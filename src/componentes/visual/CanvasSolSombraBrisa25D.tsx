import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Text as TextoSvg,
} from "react-native-svg";
import type { LoteAdjacente3D } from "../../municipios/recife/motores/bioclimatico3d";
import type { ObrasProximas } from "../../dados/contratos";
import { emMetros, type VolumeSolar } from "../../dados/sol/geometria";
import type {
  InferenciaDeFachadas,
  PapelFachada,
  VizinhoParaFachada,
} from "../../dados/sol/inferirFachadas";
import {
  simularCenaSombra25D,
  type PredioCena25D,
} from "../../dados/sol/motorSombra25D";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO, comAlfa } from "../../tema/tokens";

export type EstadoSimulacao25D = {
  hora: number;
  estacao: "verao" | "inverno";
  mostrarTorresFuturas: boolean;
  emSombraVizinho: boolean;
  solBateDeFrente: boolean;
  brisaLivrePct: number;
};

type Props = {
  inferencia: InferenciaDeFachadas;
  fachadaSelecionada: PapelFachada;
  aoSelecionarFachada: (id: PapelFachada) => void;
  andar: number;
  aoAlterarAndar: (andar: number) => void;
  pavimentosTotais?: number | null;
  centro?: readonly [number, number];
  volumesEntorno?: readonly VolumeSolar[];
  vizinhosLotes?: readonly VizinhoParaFachada[];
  lotesRiscoLpuos?: readonly LoteAdjacente3D[];
  obrasEntorno?: ObrasProximas | null;
};

const HORAS_RAPIDAS = [7, 9, 12, 15, 17] as const;
const RAD = Math.PI / 180;
const SVG_W = 340;
const SVG_H = 236;
const CX = SVG_W / 2;
const CY = SVG_H / 2 + 8;
const ESCALA = 1.48; // 1 m -> 1.48 px

function toSvg([mx, my]: readonly [number, number], zM = 0): [number, number] {
  return [
    CX + mx * ESCALA - zM * 0.22,
    CY - my * ESCALA - zM * 0.42,
  ];
}

function formatarPts(pts: readonly [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function retanguloCentrado(
  cx: number,
  cy: number,
  larg: number,
  prof: number,
  angRad: number,
): [number, number][] {
  const hl = larg / 2;
  const hp = prof / 2;
  const c = Math.cos(angRad);
  const s = Math.sin(angRad);
  const base: [number, number][] = [
    [-hl, -hp],
    [hl, -hp],
    [hl, hp],
    [-hl, hp],
  ];
  return base.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

function rotuloCurtoFachada(papel: "Frente Rua" | "Lateral" | "Fundos"): string {
  if (papel === "Frente Rua") return "Frente";
  if (papel === "Fundos") return "Fundos";
  return "Lateral";
}

export function CanvasSolSombraBrisa25D({
  inferencia,
  fachadaSelecionada,
  aoSelecionarFachada,
  andar,
  aoAlterarAndar,
  pavimentosTotais,
  centro = [-34.896, -8.121],
  volumesEntorno,
  vizinhosLotes,
  lotesRiscoLpuos,
  obrasEntorno,
}: Props) {
  const { cor } = useTema();
  const [hora, setHora] = useState<number>(15);
  const [estacao, setEstacao] = useState<"verao" | "inverno">("verao");
  const [mostrarTorresFuturas, setMostrarTorresFuturas] = useState<boolean>(false);

  const centroLon = centro[0];
  const centroLat = centro[1];
  const dia = estacao === "verao" ? "2026-12-21" : "2026-06-21";
  const maxAndar = Math.max(28, pavimentosTotais ?? 24);
  const zAndarM = Math.max(1.5, (andar - 1) * 3.0 + 1.5);
  const fachadaAtiva =
    inferencia.fachadas.find((f) => f.id === fachadaSelecionada) ?? inferencia.frente;

  const prediosDaCena = useMemo<PredioCena25D[]>(() => {
    const alvoAlturaM = Math.max(12, (pavimentosTotais ?? 14) * 3.0);
    const resultado: PredioCena25D[] = [
      {
        id: "alvo",
        pontosM: inferencia.poligonoMetros,
        alturaM: alvoAlturaM,
        ehAlvo: true,
        potencialFuturoM: null,
      },
    ];

    const cRef: [number, number] = [centroLon, centroLat];
    if (volumesEntorno && volumesEntorno.length > 0) {
      let adicionados = 0;
      for (const vol of volumesEntorno) {
        const ring = vol.aneis[0];
        if (!ring || ring.length < 3) continue;
        const ptsM = ring.slice(0, -1).map((p) => emMetros(p, cRef) as [number, number]);
        const cx = ptsM.reduce((s, p) => s + p[0], 0) / ptsM.length;
        const cy = ptsM.reduce((s, p) => s + p[1], 0) / ptsM.length;
        if (Math.hypot(cx, cy) < 5 || Math.hypot(cx, cy) > 88) continue;
        const alt = vol.alturaM ?? 12;
        const futuro = alt < 18 ? 60 : null;
        resultado.push({
          id: vol.id,
          pontosM: ptsM,
          alturaM: alt,
          ehAlvo: false,
          potencialFuturoM: futuro,
        });
        adicionados += 1;
        if (adicionados >= 14) break;
      }
    } else if (vizinhosLotes && vizinhosLotes.length > 0) {
      let adicionados = 0;
      for (const viz of vizinhosLotes) {
        const m = emMetros(viz.centro, cRef) as [number, number];
        const d = Math.hypot(m[0], m[1]);
        if (d < 8 || d > 88) continue;
        const ptsM =
          viz.poligono && viz.poligono.length >= 3
            ? viz.poligono.slice(0, 8).map((p) => emMetros(p, cRef) as [number, number])
            : retanguloCentrado(
                m[0],
                m[1],
                16,
                14,
                (inferencia.frenteAzimuteGraus * Math.PI) / 180,
              );
        const alt = Math.max(6, (viz.pavimentos ?? 4) * 3.0);
        resultado.push({
          id: viz.id,
          pontosM: ptsM,
          alturaM: alt,
          ehAlvo: false,
          potencialFuturoM: alt < 18 ? 60 : null,
        });
        adicionados += 1;
        if (adicionados >= 12) break;
      }
    } else if (lotesRiscoLpuos && lotesRiscoLpuos.length > 0) {
      for (const l of lotesRiscoLpuos.slice(0, 10)) {
        const x = Math.sin(l.azimuteGraus * RAD) * l.distanciaM;
        const y = Math.cos(l.azimuteGraus * RAD) * l.distanciaM;
        resultado.push({
          id: l.id,
          pontosM: retanguloCentrado(x, y, 16, 15, l.azimuteGraus * RAD),
          alturaM: Math.max(6, l.alturaEdificadaAtualM),
          ehAlvo: false,
          potencialFuturoM:
            l.gabaritoLegalEstimadoM &&
            l.gabaritoLegalEstimadoM > l.alturaEdificadaAtualM + 10
              ? l.gabaritoLegalEstimadoM
              : null,
        });
      }
    } else {
      const fr = inferencia.frenteAzimuteGraus * RAD;
      const lat = fr + Math.PI / 2;
      const exemplos: [number, number, number, number][] = [
        [Math.sin(lat) * 28, Math.cos(lat) * 28, 36, 62],
        [-Math.sin(lat) * 28, -Math.cos(lat) * 28, 12, 58],
        [-Math.sin(fr) * 34, -Math.cos(fr) * 34, 42, 42],
        [Math.sin(fr) * 38 + Math.sin(lat) * 22, Math.cos(fr) * 38 + Math.cos(lat) * 22, 9, 60],
      ];
      exemplos.forEach(([px, py, alt, fut], i) => {
        resultado.push({
          id: `entorno-${i}`,
          pontosM: retanguloCentrado(px, py, 16, 14, fr),
          alturaM: alt,
          ehAlvo: false,
          potencialFuturoM: alt < 18 ? fut : null,
        });
      });
    }

    return resultado;
  }, [
    centroLat,
    centroLon,
    inferencia,
    lotesRiscoLpuos,
    pavimentosTotais,
    vizinhosLotes,
    volumesEntorno,
  ]);

  const cena = useMemo(
    () =>
      simularCenaSombra25D({
        predios: prediosDaCena,
        inferencia,
        fachadaAtiva,
        andar,
        hora,
        dia,
        centro: [centroLon, centroLat],
        mostrarTorresFuturas,
      }),
    [
      andar,
      centroLat,
      centroLon,
      dia,
      fachadaAtiva,
      hora,
      inferencia,
      mostrarTorresFuturas,
      prediosDaCena,
    ],
  );

  // Linha da rua frontal fora da fachada Frente Rua
  const frRad = inferencia.frenteAzimuteGraus * RAD;
  const ruaDirX = Math.cos(frRad);
  const ruaDirY = -Math.sin(frRad);
  const ruaOffX = Math.sin(frRad) * 20;
  const ruaOffY = Math.cos(frRad) * 20;
  const ruaA = toSvg([ruaOffX - ruaDirX * 115, ruaOffY - ruaDirY * 115]);
  const ruaB = toSvg([ruaOffX + ruaDirX * 115, ruaOffY + ruaDirY * 115]);

  // Posicao do Sol e ponto na fachada selecionada
  const solAz = cena.sol.azimute * RAD;
  const [solX, solY] = toSvg([Math.sin(solAz) * 76, Math.cos(solAz) * 58], 22);
  const [pinX, pinY] = toSvg(fachadaAtiva.pontoMedioM, Math.min(28, zAndarM * 0.65));

  // Fim recortado do raio solar (para na torre vizinha quando ha sombra no andar)
  const fimRaioSvg = useMemo<[number, number] | null>(() => {
    if (!cena.oclusao.solAcima) return null;
    if (cena.oclusao.emSombraVizinho && cena.oclusao.pontoBloqueioM) {
      return toSvg(
        cena.oclusao.pontoBloqueioM,
        cena.oclusao.zBloqueioM ?? zAndarM,
      );
    }
    if (cena.oclusao.solNaFrente) {
      return [pinX, pinY];
    }
    // Sol esta nas costas da fachada selecionada -> aponta ate o contorno medio oposto sem cruzar por cima do apartamento
    const centroSvg = toSvg([0, 0], Math.min(24, zAndarM * 0.65));
    return [
      centroSvg[0] + Math.sin(solAz) * 8,
      centroSvg[1] - Math.cos(solAz) * 8,
    ];
  }, [cena.oclusao, pinX, pinY, solAz, zAndarM]);

  const ehPoenteDireto =
    cena.oclusao.solNaFrente &&
    !cena.oclusao.emSombraVizinho &&
    fachadaAtiva.grupoSolar === "Poente";

  const resumoMomento = !cena.oclusao.solAcima
    ? `${String(hora).padStart(2, "0")}h · Sol já se pôs`
    : !cena.oclusao.solNaFrente
      ? `${String(hora).padStart(2, "0")}h · Sol do outro lado do prédio`
      : cena.oclusao.emSombraVizinho
        ? `${String(hora).padStart(2, "0")}h · ${andar}º andar na sombra do vizinho${
            cena.oclusao.ateQualAndarProtegido >= andar
              ? ` (cobre até ~${cena.oclusao.ateQualAndarProtegido}º)`
              : ""
          }`
        : `${String(hora).padStart(2, "0")}h · Sol direto na face ${fachadaAtiva.orientacaoSolar} (${andar}º andar)`;

  const textoBrisa = cena.bloqueioBrisa
    ? "Brisa E-SE barrada"
    : "Brisa E-SE livre";

  // Rastrear ids de parede que ja receberam testID para evitar duplicidade
  const idsParedeAtribuidos = new Set<PapelFachada>();

  return (
    <View
      testID="canvas-sol-sombra-brisa-25d"
      style={[
        styles.container,
        {
          backgroundColor: cor("cor-superficie"),
          borderColor: cor("cor-linha-forte"),
        },
      ]}
    >
      {/* Cabecalho compacto + toggle sutil Verão | Inverno */}
      <View style={styles.cabecalho}>
        <View style={styles.topoCabecalho}>
          <Texto
            tipo="etiqueta"
            cor="cor-texto-apoio"
            style={styles.kicker}
          >
            Sol, sombra e brisa
          </Texto>
          <View
            style={[
              styles.trilhoEstacao,
              { backgroundColor: cor("cor-papel-claro") },
            ]}
          >
            <Pressable
              testID="estacao-verao"
              accessibilityRole="button"
              onPress={() => setEstacao("verao")}
              style={[
                styles.abaEstacao,
                estacao === "verao"
                  ? { backgroundColor: cor("cor-acao") }
                  : undefined,
              ]}
            >
              <Texto
                tipo="etiqueta"
                cor={estacao === "verao" ? "cor-sobre-acao" : "cor-texto-apoio"}
                style={styles.textoEstacao}
              >
                Verão
              </Texto>
            </Pressable>
            <Pressable
              testID="estacao-inverno"
              accessibilityRole="button"
              onPress={() => setEstacao("inverno")}
              style={[
                styles.abaEstacao,
                estacao === "inverno"
                  ? { backgroundColor: cor("cor-azul-cadastral") }
                  : undefined,
              ]}
            >
              <Texto
                tipo="etiqueta"
                cor={estacao === "inverno" ? "cor-superficie" : "cor-texto-apoio"}
                style={styles.textoEstacao}
              >
                Inverno
              </Texto>
            </Pressable>
          </View>
        </View>

        <Texto tipo="secao" style={styles.resumoTitulo}>
          {inferencia.resumoAutomatico}
        </Texto>
      </View>

      {/* Seletor segmentado em faixa unica sem caixas aninhadas */}
      <View
        style={[
          styles.faixaSegmentadaWrap,
          { borderTopColor: cor("cor-linha") },
        ]}
        accessibilityRole="radiogroup"
        accessibilityLabel="Escolha a fachada do apartamento"
      >
        <View
          style={[
            styles.trilhoFachadas,
            { backgroundColor: cor("cor-papel-claro") },
          ]}
        >
          {inferencia.fachadas.map((f) => {
            const ativa = f.id === fachadaSelecionada;
            return (
              <Pressable
                key={f.id}
                testID={`fachada-chip-${f.id}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: ativa }}
                onPress={() => aoSelecionarFachada(f.id)}
                style={({ pressed }) => [
                  styles.segmentoFachada,
                  ativa ? { backgroundColor: cor("cor-acao") } : undefined,
                  pressed ? { opacity: 0.85 } : undefined,
                ]}
              >
                <Texto
                  tipo="apoio"
                  cor={ativa ? "cor-sobre-acao" : "cor-texto-apoio"}
                  style={styles.subSegmento}
                >
                  {rotuloCurtoFachada(f.papelRotulo)}
                </Texto>
                <Texto
                  tipo="etiqueta"
                  cor={ativa ? "cor-sobre-acao" : "cor-texto"}
                  style={styles.tituloSegmento}
                >
                  {f.grupoSolar}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Cena 2.5D sem borda interna duplicada */}
      <View style={[styles.cenaWrap, { backgroundColor: cor("mapa-terra") }]}>
        <Svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          {/* Via frontal */}
          <Line
            x1={ruaA[0]}
            y1={ruaA[1]}
            x2={ruaB[0]}
            y2={ruaB[1]}
            stroke={cor("mapa-via")}
            strokeWidth={18}
            strokeLinecap="round"
          />
          <Line
            x1={ruaA[0]}
            y1={ruaA[1]}
            x2={ruaB[0]}
            y2={ruaB[1]}
            stroke={cor("cor-linha-forte")}
            strokeWidth={1}
            strokeDasharray="6 6"
          />

          {/* Camada 1: Sombra real projetada no solo por vizinhos E pelo proprio edificio */}
          {cena.sombrasSolo.map((s) => {
            const ptsSvg = s.poliM.map((pt) => toSvg(pt, 0));
            return (
              <Polygon
                key={`sh-${s.id}`}
                points={formatarPts(ptsSvg)}
                fill={
                  s.ehAlvo
                    ? cor("cor-texto")
                    : s.futura
                      ? cor("cor-barro")
                      : cor("cor-campo")
                }
                fillOpacity={s.ehAlvo ? 0.14 : s.futura ? 0.19 : 0.16}
                stroke={s.futura ? cor("cor-barro") : undefined}
                strokeWidth={s.futura ? 0.8 : 0}
                strokeDasharray={s.futura ? "3 3" : undefined}
              />
            );
          })}

          {/* Camada 2: Extrusao 2.5D com self-shadowing fisico (n · s) + paredes clicaveis */}
          {cena.prediosOrdenados.map((p) => {
            const alt =
              !p.ehAlvo && mostrarTorresFuturas && p.potencialFuturoM
                ? p.potencialFuturoM
                : p.alturaM;
            const ehFutura =
              !p.ehAlvo &&
              mostrarTorresFuturas &&
              Boolean(p.potencialFuturoM);

            const topoSvg = p.pontosM.map((pt) => toSvg(pt, alt));
            const cxTopo =
              topoSvg.reduce((s, q) => s + q[0], 0) / topoSvg.length;
            const cyTopo =
              topoSvg.reduce((s, q) => s + q[1], 0) / topoSvg.length;
            const paredes = cena.paredesPorPredio[p.id] ?? [];

            const corTeto = p.ehAlvo
              ? cena.tetoEmSombra
                ? cor("cor-sutil")
                : cor("cor-superficie")
              : ehFutura
                ? cor("cor-barro-suave")
                : cena.tetoEmSombra
                  ? cor("cor-linha")
                  : cor("cor-papel-claro");

            return (
              <G key={p.id}>
                {/* Paredes visiveis para a camera com iluminacao real */}
                {paredes
                  .filter((w) => w.ehFrenteCamera)
                  .map((w) => {
                    const b0 = toSvg(w.p0M, 0);
                    const b1 = toSvg(w.p1M, 0);
                    const t1 = toSvg(w.p1M, alt);
                    const t0 = toSvg(w.p0M, alt);
                    const ehSelecionada =
                      p.ehAlvo && w.fachadaId === fachadaSelecionada;

                    let fillParede: string;
                    if (p.ehAlvo) {
                      if (ehSelecionada) {
                        fillParede = w.emSombraPropria
                          ? comAlfa(cor("cor-azul-cadastral"), 0.34)
                          : fachadaAtiva.grupoSolar === "Poente"
                            ? comAlfa(cor("cor-barro"), 0.52)
                            : comAlfa(cor("cor-acao"), 0.44);
                      } else if (w.emSombraPropria) {
                        fillParede = comAlfa(cor("cor-azul-cadastral"), 0.24);
                      } else {
                        fillParede = comAlfa(
                          cor("cat-ipe-amarelo"),
                          0.26 + w.luminosidadeSol0a1 * 0.44,
                        );
                      }
                    } else if (ehFutura) {
                      fillParede = w.emSombraPropria
                        ? comAlfa(cor("cor-barro"), 0.34)
                        : cor("cor-barro-suave");
                    } else {
                      fillParede = w.emSombraPropria
                        ? comAlfa(cor("cor-texto"), 0.17)
                        : cor("cor-papel-claro");
                    }

                    let wallTestId: string | undefined;
                    if (
                      p.ehAlvo &&
                      w.fachadaId &&
                      !idsParedeAtribuidos.has(w.fachadaId)
                    ) {
                      idsParedeAtribuidos.add(w.fachadaId);
                      wallTestId = `canvas-wall-${w.fachadaId}`;
                    }

                    return (
                      <Polygon
                        key={`w-${p.id}-${w.indiceAresta}`}
                        testID={wallTestId}
                        points={formatarPts([b0, b1, t1, t0])}
                        fill={fillParede}
                        stroke={
                          ehSelecionada
                            ? fachadaAtiva.grupoSolar === "Poente"
                              ? cor("cor-barro")
                              : cor("cor-acao")
                            : p.ehAlvo
                              ? cor("cor-texto-apoio")
                              : cor("cor-linha-forte")
                        }
                        strokeWidth={ehSelecionada ? 2 : 0.7}
                        onPress={
                          p.ehAlvo && w.fachadaId
                            ? () => aoSelecionarFachada(w.fachadaId!)
                            : undefined
                        }
                      />
                    );
                  })}

                {/* Teto */}
                <Polygon
                  points={formatarPts(topoSvg)}
                  fill={corTeto}
                  stroke={
                    p.ehAlvo
                      ? cor("cor-texto")
                      : ehFutura
                        ? cor("cor-barro")
                        : cor("cor-traco")
                  }
                  strokeWidth={p.ehAlvo ? 1.5 : 1}
                  strokeDasharray={ehFutura ? "4 3" : undefined}
                />

                {/* Aresta iluminada no teto + alvos de toque para fachadas posteriores (Norte/Oeste) */}
                {p.ehAlvo
                  ? paredes.map((w) => {
                      const t0 = toSvg(w.p0M, alt);
                      const t1 = toSvg(w.p1M, alt);
                      const ehSelecionada = w.fachadaId === fachadaSelecionada;
                      let backTestId: string | undefined;
                      if (
                        !w.ehFrenteCamera &&
                        w.fachadaId &&
                        !idsParedeAtribuidos.has(w.fachadaId)
                      ) {
                        idsParedeAtribuidos.add(w.fachadaId);
                        backTestId = `canvas-wall-${w.fachadaId}`;
                      }
                      return (
                        <G key={`edge-${w.indiceAresta}`}>
                          {ehSelecionada ? (
                            <Line
                              x1={t0[0]}
                              y1={t0[1]}
                              x2={t1[0]}
                              y2={t1[1]}
                              stroke={
                                fachadaAtiva.grupoSolar === "Poente"
                                  ? cor("cor-barro")
                                  : cor("cor-acao")
                              }
                              strokeWidth={3.6}
                              strokeLinecap="round"
                            />
                          ) : null}
                          {!w.ehFrenteCamera && w.fachadaId ? (
                            <Line
                              testID={backTestId}
                              x1={t0[0]}
                              y1={t0[1]}
                              x2={t1[0]}
                              y2={t1[1]}
                              stroke={cor("cor-acao")}
                              strokeOpacity={0.01}
                              strokeWidth={16}
                              onPress={() => aoSelecionarFachada(w.fachadaId!)}
                            />
                          ) : null}
                        </G>
                      );
                    })
                  : null}

                {!p.ehAlvo && alt >= 18 ? (
                  <TextoSvg
                    x={cxTopo}
                    y={cyTopo + 3}
                    fontFamily="PlusJakartaSans"
                    fontSize={8.5}
                    fontWeight="700"
                    fill={
                      ehFutura ? cor("cor-barro-texto") : cor("cor-texto-apoio")
                    }
                    textAnchor="middle"
                  >
                    {`${Math.round(alt / 3)}p`}
                  </TextoSvg>
                ) : null}
              </G>
            );
          })}

          {/* Vetores curvos de brisa E-SE (125° -> 305°) */}
          {cena.fluxosBrisa.map((f, idx) => {
            const p0 = toSvg(f.origemM, 5);
            const c1 = toSvg(f.cp1M, 5);
            const c2 = toSvg(f.cp2M, 5);
            const p1 = toSvg(f.destinoM, 5);
            const sA = toSvg(f.pontaA, 5);
            const sB = toSvg(f.pontaB, 5);
            const corBrisa = cena.bloqueioBrisa
              ? cor("cor-traco")
              : cor("cat-mare");
            const d = `M ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
            return (
              <G key={`brisa-${idx}`}>
                <Path
                  d={d}
                  fill="none"
                  stroke={corBrisa}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeDasharray={cena.bloqueioBrisa ? "4 3" : undefined}
                />
                <Polygon points={formatarPts([p1, sA, sB])} fill={corBrisa} />
              </G>
            );
          })}

          {/* Pinos 2.5D de obras licenciadas recentes a ate 85 m (R13) */}
          {(obrasEntorno?.recentes ?? [])
            .filter((o) => o.distanciaM <= 85)
            .slice(0, 5)
            .map((o, idx) => {
              const m = emMetros(o.centro, [centroLon, centroLat]);
              const [ox, oy] = toSvg(m, 2);
              const ehDem = o.categoria === "demolicao";
              const corPino = ehDem ? cor("cor-barro") : cor("cor-acao");
              return (
                <G key={`obra25d-${idx}`}>
                  <Circle
                    cx={ox}
                    cy={oy}
                    r={4.2}
                    fill={corPino}
                    stroke={cor("cor-superficie")}
                    strokeWidth={1.3}
                  />
                  <TextoSvg
                    x={ox}
                    y={oy - 6.5}
                    fontFamily="PlusJakartaSans"
                    fontSize={8}
                    fontWeight="700"
                    fill={ehDem ? cor("cor-barro-texto") : cor("cor-texto")}
                    textAnchor="middle"
                  >
                    {ehDem ? "Dem." : "Obra"}
                  </TextoSvg>
                </G>
              );
            })}

          {/* Camada 3: Orbe do Sol e raio solar recortado no bloqueador (nunca atravessa vizinho) */}
          {cena.oclusao.solAcima && fimRaioSvg ? (
            <G>
              <Line
                x1={solX}
                y1={solY}
                x2={fimRaioSvg[0]}
                y2={fimRaioSvg[1]}
                stroke={
                  cena.oclusao.emSombraVizinho
                    ? cor("cor-azul-cadastral")
                    : cor("cor-acao")
                }
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeOpacity={0.82}
              />
              {cena.oclusao.emSombraVizinho ? (
                <Circle
                  cx={fimRaioSvg[0]}
                  cy={fimRaioSvg[1]}
                  r={4.2}
                  fill={cor("cor-azul-cadastral")}
                  stroke={cor("cor-superficie")}
                  strokeWidth={1.4}
                />
              ) : null}
              <Circle cx={solX} cy={solY} r={10} fill={cor("cat-ipe-amarelo")} />
              <Circle cx={solX} cy={solY} r={5.5} fill={cor("cor-acao")} />
            </G>
          ) : null}

          {/* Rosa dos ventos compacta */}
          <G>
            <Circle
              cx={SVG_W - 22}
              cy={22}
              r={13}
              fill={cor("cor-superficie")}
              fillOpacity={0.9}
              stroke={cor("cor-linha-forte")}
              strokeWidth={1}
            />
            <TextoSvg
              x={SVG_W - 22}
              y={26}
              fontFamily="PlusJakartaSans"
              fontSize={9.5}
              fontWeight="700"
              fill={cor("cor-texto")}
              textAnchor="middle"
            >
              N
            </TextoSvg>
          </G>
        </Svg>

        {/* Pílula translúcida integrada no rodapé da cena (substitui caixa bege separada) */}
        <View
          style={[
            styles.overlayStatus,
            {
              backgroundColor: ehPoenteDireto
                ? comAlfa(cor("cor-barro-suave"), 0.94)
                : comAlfa(cor("cor-superficie"), 0.92),
            },
          ]}
        >
          <View
            style={[
              styles.pontoStatus,
              {
                backgroundColor: ehPoenteDireto
                  ? cor("cor-barro")
                  : cena.oclusao.emSombraVizinho
                    ? cor("cor-azul-cadastral")
                    : cor("cat-mare"),
              },
            ]}
          />
          <Texto
            tipo="apoio"
            cor={ehPoenteDireto ? "cor-barro-texto" : "cor-texto"}
            style={styles.textoOverlayStatus}
          >
            {`${resumoMomento} · ${textoBrisa}`}
          </Texto>
        </View>
      </View>

      {/* Controles separados por hairline 1px */}
      <View style={styles.rodapeHoras}>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloMini}>
          Hora
        </Texto>
        <View style={styles.horasRow}>
          {HORAS_RAPIDAS.map((h) => {
            const ativo = hora === h;
            return (
              <Pressable
                key={h}
                testID={`hora-preset-${h}`}
                accessibilityRole="button"
                onPress={() => setHora(h)}
                style={[
                  styles.pilulaHora,
                  {
                    backgroundColor: ativo ? cor("cor-texto") : cor("cor-papel-claro"),
                  },
                ]}
              >
                <Texto
                  tipo="etiqueta"
                  cor={ativo ? "cor-superficie" : "cor-texto"}
                  style={styles.textoHora}
                >
                  {`${String(h).padStart(2, "0")}h`}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.rodapeAndarFuturo,
          { borderTopColor: cor("cor-linha") },
        ]}
      >
        <View style={styles.andarStepper}>
          <Pressable
            testID="andar-menos"
            accessibilityRole="button"
            accessibilityLabel="Diminuir andar"
            onPress={() => aoAlterarAndar(Math.max(1, andar - 1))}
            style={[
              styles.botaoStepper,
              { backgroundColor: cor("cor-papel-claro") },
            ]}
          >
            <Texto tipo="secao" style={styles.textoStepper}>
              −
            </Texto>
          </Pressable>
          <View style={styles.andarValor}>
            <Texto tipo="etiqueta" style={styles.tabular}>
              {`${andar}º andar`}
            </Texto>
            <Texto
              tipo="apoio"
              cor="cor-texto-apoio"
              style={[styles.rotuloMini, styles.tabular]}
            >
              {`~${Math.round(zAndarM)} m`}
            </Texto>
          </View>
          <Pressable
            testID="andar-mais"
            accessibilityRole="button"
            accessibilityLabel="Aumentar andar"
            onPress={() => aoAlterarAndar(Math.min(maxAndar, andar + 1))}
            style={[
              styles.botaoStepper,
              { backgroundColor: cor("cor-papel-claro") },
            ]}
          >
            <Texto tipo="secao" style={styles.textoStepper}>
              +
            </Texto>
          </Pressable>
        </View>

        <Pressable
          testID="toggle-torres-futuras"
          accessibilityRole="switch"
          accessibilityState={{ checked: mostrarTorresFuturas }}
          onPress={() => setMostrarTorresFuturas((v) => !v)}
          style={[
            styles.botaoFuturas,
            {
              backgroundColor: mostrarTorresFuturas
                ? cor("cor-barro-suave")
                : cor("cor-papel-claro"),
            },
          ]}
        >
          <Texto
            tipo="etiqueta"
            cor={mostrarTorresFuturas ? "cor-barro-texto" : "cor-texto"}
            style={styles.textoFuturas}
          >
            {mostrarTorresFuturas
              ? "Risco de torres futuras: ligado"
              : "Ver risco de torres futuras"}
          </Texto>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    overflow: "hidden",
  },
  cabecalho: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 6,
  },
  topoCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  trilhoEstacao: {
    flexDirection: "row",
    borderRadius: RAIO.pilula,
    padding: 3,
    gap: 2,
  },
  abaEstacao: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: RAIO.pilula,
    alignItems: "center",
    justifyContent: "center",
  },
  textoEstacao: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  resumoTitulo: {
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  faixaSegmentadaWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  trilhoFachadas: {
    flexDirection: "row",
    borderRadius: RAIO.quadrado,
    padding: 3,
    gap: 3,
  },
  segmentoFachada: {
    flex: 1,
    minHeight: TOQUE_MINIMO,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  subSegmento: {
    fontSize: 10.5,
    lineHeight: 13,
  },
  tituloSegmento: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
  },
  cenaWrap: {
    position: "relative",
    width: "100%",
  },
  overlayStatus: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pontoStatus: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  textoOverlayStatus: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  rodapeHoras: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexWrap: "wrap",
  },
  rotuloMini: {
    fontSize: 11.5,
  },
  horasRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  pilulaHora: {
    minHeight: TOQUE_MINIMO - 4,
    minWidth: 46,
    borderRadius: RAIO.pilula,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textoHora: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  rodapeAndarFuturo: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  andarStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botaoStepper: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    alignItems: "center",
    justifyContent: "center",
  },
  textoStepper: {
    fontSize: 18,
  },
  andarValor: {
    alignItems: "center",
    minWidth: 68,
  },
  tabular: {
    fontVariant: ["tabular-nums"],
  },
  botaoFuturas: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    flexShrink: 1,
  },
  textoFuturas: {
    fontSize: 12,
    fontWeight: "600",
  },
});
