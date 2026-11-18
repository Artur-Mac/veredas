import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Polygon, Rect, Text as TextoSvg } from "react-native-svg";
import type { LoteAdjacente3D } from "../../municipios/recife/motores/bioclimatico3d";
import {
  incidenciaNaFace,
  instanteNoRecife,
  posicaoDoSol,
} from "../../dados/sol/astronomia";
import { emMetros, type VolumeSolar } from "../../dados/sol/geometria";
import type {
  InferenciaDeFachadas,
  PapelFachada,
  VizinhoParaFachada,
} from "../../dados/sol/inferirFachadas";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";

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
};

type PredioCena = {
  id: string;
  pontosM: [number, number][];
  alturaM: number;
  ehAlvo: boolean;
  potencialFuturoM: number | null;
};

const HORAS_RAPIDAS = [7, 9, 12, 15, 17] as const;
const RAD = Math.PI / 180;
const SVG_W = 340;
const SVG_H = 228;
const CX = SVG_W / 2;
const CY = SVG_H / 2 + 10;
const ESCALA = 1.48; // 1 metro -> 1.48 px (mostra ~220 m × 140 m ao redor)

function toSvg([mx, my]: readonly [number, number], zM = 0): [number, number] {
  // Projecao 2.5D isometrica leve: +x=Leste(dir), +y=Norte(cima), z desloca para cima-esquerda
  return [
    CX + mx * ESCALA - zM * 0.22,
    CY - my * ESCALA - zM * 0.42,
  ];
}

function formatarPts(pts: readonly [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function dentroPoligono2D(p: readonly [number, number], poli: readonly [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const xi = poli[i]![0], yi = poli[i]![1];
    const xj = poli[j]![0], yj = poli[j]![1];
    const inter = (yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi + 1e-9) + xi;
    if (inter) inside = !inside;
  }
  return inside;
}

function retanguloCentrado(cx: number, cy: number, larg: number, prof: number, angRad: number): [number, number][] {
  const hl = larg / 2;
  const hp = prof / 2;
  const c = Math.cos(angRad);
  const s = Math.sin(angRad);
  const base: [number, number][] = [[-hl, -hp], [hl, -hp], [hl, hp], [-hl, hp]];
  return base.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

function sombraDaCaixa(
  baseM: readonly [number, number][],
  dxM: number,
  dyM: number,
): [number, number][] {
  // Envoltoria convexa simples entre poligono base e poligono deslocado pela sombra
  const todos = [...baseM, ...baseM.map(([x, y]): [number, number] => [x + dxM, y + dyM])];
  if (todos.length < 3) return [];
  const ord = [...todos].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const baixo: [number, number][] = [];
  for (const p of ord) {
    while (baixo.length >= 2 && cross(baixo[baixo.length - 2]!, baixo[baixo.length - 1]!, p) <= 0) baixo.pop();
    baixo.push(p);
  }
  const cima: [number, number][] = [];
  for (let i = ord.length - 1; i >= 0; i--) {
    const p = ord[i]!;
    while (cima.length >= 2 && cross(cima[cima.length - 2]!, cima[cima.length - 1]!, p) <= 0) cima.pop();
    cima.push(p);
  }
  baixo.pop();
  cima.pop();
  return [...baixo, ...cima];
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
}: Props) {
  const { cor } = useTema();
  const [hora, setHora] = useState<number>(15);
  const [estacao, setEstacao] = useState<"verao" | "inverno">("verao");
  const [mostrarTorresFuturas, setMostrarTorresFuturas] = useState<boolean>(false);

  const dia = estacao === "verao" ? "2026-12-21" : "2026-06-21";
  const maxAndar = Math.max(28, pavimentosTotais ?? 24);
  const zAndarM = Math.max(1.5, (andar - 1) * 3.0 + 1.5);
  const fachadaAtiva =
    inferencia.fachadas.find((f) => f.id === fachadaSelecionada) ?? inferencia.frente;

  const prediosDaCena = useMemo<PredioCena[]>(() => {
    const alvoAlturaM = Math.max(12, (pavimentosTotais ?? 14) * 3.0);
    const resultado: PredioCena[] = [
      {
        id: "alvo",
        pontosM: inferencia.poligonoMetros,
        alturaM: alvoAlturaM,
        ehAlvo: true,
        potencialFuturoM: null,
      },
    ];

    const cRef: [number, number] = [centro[0], centro[1]];
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
            : retanguloCentrado(m[0], m[1], 16, 14, (inferencia.frenteAzimuteGraus * Math.PI) / 180);
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
          pontosM: retanguloCentrado(x, y, 16, 15, (l.azimuteGraus * RAD)),
          alturaM: Math.max(6, l.alturaEdificadaAtualM),
          ehAlvo: false,
          potencialFuturoM: l.gabaritoLegalEstimadoM && l.gabaritoLegalEstimadoM > l.alturaEdificadaAtualM + 10 ? l.gabaritoLegalEstimadoM : null,
        });
      }
    } else {
      // Contexto esquematico coerente ao redor da quadra quando sem camadas carregadas
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
  }, [centro, inferencia, lotesRiscoLpuos, pavimentosTotais, vizinhosLotes, volumesEntorno]);

  const calculoSolar = useMemo(() => {
    const sol = posicaoDoSol(instanteNoRecife(dia, hora * 60), {
      latitude: centro[1],
      longitude: centro[0],
    });
    const solAcima = sol.elevacao > 1;
    const solNaFrente = solAcima && incidenciaNaFace(sol, fachadaAtiva.azimuteGraus);
    const elevRad = Math.max(0.14, sol.elevacao * RAD);
    const azRad = sol.azimute * RAD;

    const sombras: { id: string; poliSvg: [number, number][]; futura: boolean }[] = [];
    let emSombraVizinho = false;
    const pontoJanelaM: [number, number] = [
      fachadaAtiva.pontoMedioM[0] * 1.05,
      fachadaAtiva.pontoMedioM[1] * 1.05,
    ];

    if (solAcima) {
      for (const p of prediosDaCena) {
        if (p.ehAlvo) continue;
        const altEfetiva = mostrarTorresFuturas && p.potencialFuturoM ? p.potencialFuturoM : p.alturaM;
        const excessoH = altEfetiva - zAndarM;
        if (excessoH <= 0.3) continue;
        const compM = Math.min(110, excessoH / Math.tan(elevRad));
        const dxM = -Math.sin(azRad) * compM;
        const dyM = -Math.cos(azRad) * compM;
        const sombraM = sombraDaCaixa(p.pontosM, dxM, dyM);
        if (sombraM.length >= 3) {
          if (dentroPoligono2D(pontoJanelaM, sombraM)) {
            emSombraVizinho = true;
          }
          sombras.push({
            id: p.id,
            poliSvg: sombraM.map((pt) => toSvg(pt, 0)),
            futura: Boolean(mostrarTorresFuturas && p.potencialFuturoM),
          });
        }
      }
    }

    // Vetor de vento alisio E-SE (sopra DE 125° PARA 305°)
    const ventoDeAz = 125 * RAD;
    const ventoVemX = Math.sin(ventoDeAz);
    const ventoVemY = Math.cos(ventoDeAz);
    const bloqueioBrisa = prediosDaCena
      .filter((p) => !p.ehAlvo)
      .some((p) => {
        const cx = p.pontosM.reduce((s, pt) => s + pt[0], 0) / p.pontosM.length;
        const cy = p.pontosM.reduce((s, pt) => s + pt[1], 0) / p.pontosM.length;
        const projVento = cx * ventoVemX + cy * ventoVemY;
        const alt = mostrarTorresFuturas && p.potencialFuturoM ? p.potencialFuturoM : p.alturaM;
        return projVento > 12 && projVento < 65 && alt > zAndarM + 3;
      });

    return {
      sol,
      solAcima,
      solNaFrente,
      emSombraVizinho,
      sombras,
      bloqueioBrisa,
    };
  }, [centro, dia, fachadaAtiva, hora, mostrarTorresFuturas, prediosDaCena, zAndarM]);

  // Ordenar edificios de tras para frente no eixo Y do SVG para correta oclusao 2.5D
  const prediosOrdenados = useMemo(
    () =>
      [...prediosDaCena].sort((a, b) => {
        const ya = a.pontosM.reduce((s, p) => s + p[1], 0) / a.pontosM.length;
        const yb = b.pontosM.reduce((s, p) => s + p[1], 0) / b.pontosM.length;
        return yb - ya;
      }),
    [prediosDaCena],
  );

  // Linha da rua frontal fora da fachada Frente Rua
  const frRad = inferencia.frenteAzimuteGraus * RAD;
  const ruaDirX = Math.cos(frRad);
  const ruaDirY = -Math.sin(frRad);
  const ruaOffX = Math.sin(frRad) * 20;
  const ruaOffY = Math.cos(frRad) * 20;
  const ruaA = toSvg([ruaOffX - ruaDirX * 110, ruaOffY - ruaDirY * 110]);
  const ruaB = toSvg([ruaOffX + ruaDirX * 110, ruaOffY + ruaDirY * 110]);

  // Posicao do icone do Sol no ceu (borda do diagrama)
  const solAz = calculoSolar.sol.azimute * RAD;
  const [solX, solY] = toSvg([Math.sin(solAz) * 76, Math.cos(solAz) * 58], 18);
  const [pinX, pinY] = toSvg(fachadaAtiva.pontoMedioM, Math.min(28, zAndarM * 0.65));

  // Brisa setas vindo de SE (~125°)
  const brisaOffsets: [number, number][] = [
    [42, -38],
    [68, -14],
    [22, -52],
  ];

  const resumoMomento = !calculoSolar.solAcima
    ? `${String(hora).padStart(2, "0")}h · Sol já se pôs`
    : !calculoSolar.solNaFrente
      ? `${String(hora).padStart(2, "0")}h · Sol do outro lado do prédio (esta face está na sombra)`
      : calculoSolar.emSombraVizinho
        ? `${String(hora).padStart(2, "0")}h · ${andar}º andar protegido pela sombra de prédio vizinho`
        : `${String(hora).padStart(2, "0")}h · Sol direto na fachada ${fachadaAtiva.orientacaoSolar} (${andar}º andar)`;

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
      {/* Cabecalho direto */}
      <View style={styles.cabecalho}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 12, fontWeight: "600" }}>
          Sol, sombra e brisa
        </Texto>
        <Texto tipo="secao" style={[styles.resumoTitulo, { fontWeight: "700", letterSpacing: -0.35 }]}>
          {inferencia.resumoAutomatico}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.subtitulo}>
          {inferencia.subtituloExplicacao}
        </Texto>
      </View>

      {/* Seletor 1-toque das 4 fachadas */}
      <View style={styles.grupoBotoesFachada} accessibilityRole="radiogroup" accessibilityLabel="Escolha a fachada do apartamento">
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
                styles.botaoFachada,
                {
                  backgroundColor: ativa ? cor("cor-acao") : cor("cor-papel-claro"),
                  borderColor: ativa ? cor("cor-acao") : cor("cor-linha-forte"),
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Texto
                tipo="etiqueta"
                cor={ativa ? "cor-sobre-acao" : "cor-texto"}
                style={styles.textoBotaoFachada}
              >
                {f.rotuloBotao}
              </Texto>
              <Texto
                tipo="apoio"
                cor={ativa ? "cor-sobre-acao" : "cor-texto-apoio"}
                style={styles.subBotaoFachada}
              >
                {f.grupoSolar === "Poente"
                  ? "Sol da tarde"
                  : f.recebeBrisaAlisia
                    ? "Brisa SE livre"
                    : `${f.azimuteGraus}°`}
              </Texto>
            </Pressable>
          );
        })}
      </View>

      {/* Cena SVG 2.5D */}
      <View
        style={[
          styles.molduraSvg,
          {
            backgroundColor: cor("mapa-terra"),
            borderColor: cor("cor-linha"),
          },
        ]}
      >
        <Svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          {/* Fundo da via frontal */}
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

          {/* Poligonos de sombra reais projetados no horario */}
          {calculoSolar.sombras.map((s) => (
            <Polygon
              key={`sh-${s.id}`}
              points={formatarPts(s.poliSvg)}
              fill={s.futura ? cor("cor-barro") : cor("cor-campo")}
              fillOpacity={s.futura ? 0.18 : 0.16}
            />
          ))}

          {/* Volumes 2.5D dos vizinhos e do edificio alvo */}
          {prediosOrdenados.map((p) => {
            const alt = !p.ehAlvo && mostrarTorresFuturas && p.potencialFuturoM ? p.potencialFuturoM : p.alturaM;
            const baseSvg = p.pontosM.map((pt) => toSvg(pt, 0));
            const topoSvg = p.pontosM.map((pt) => toSvg(pt, alt));
            const cxBase = baseSvg.reduce((s, q) => s + q[0], 0) / baseSvg.length;
            const cyTopo = topoSvg.reduce((s, q) => s + q[1], 0) / topoSvg.length;

            // Faces laterais simples para extrusao visual 2.5D
            const faces = baseSvg.map((b, i) => {
              const nb = baseSvg[(i + 1) % baseSvg.length]!;
              const t = topoSvg[i]!;
              const nt = topoSvg[(i + 1) % topoSvg.length]!;
              return `${formatarPts([b, nb, nt, t])}`;
            });

            const ehFutura = !p.ehAlvo && mostrarTorresFuturas && Boolean(p.potencialFuturoM);

            return (
              <G key={p.id}>
                {faces.map((pts, i) => (
                  <Polygon
                    key={`wall-${p.id}-${i}`}
                    points={pts}
                    fill={p.ehAlvo ? cor("cor-sutil") : ehFutura ? cor("cor-barro-suave") : cor("cor-linha")}
                    stroke={p.ehAlvo ? cor("cor-texto-apoio") : cor("cor-linha-forte")}
                    strokeWidth={0.7}
                  />
                ))}
                <Polygon
                  points={formatarPts(topoSvg)}
                  fill={p.ehAlvo ? cor("cor-superficie") : ehFutura ? cor("cor-barro-suave") : cor("cor-papel-claro")}
                  stroke={p.ehAlvo ? cor("cor-texto") : ehFutura ? cor("cor-barro") : cor("cor-traco")}
                  strokeWidth={p.ehAlvo ? 1.8 : 1}
                  strokeDasharray={ehFutura ? "4 3" : undefined}
                />
                {!p.ehAlvo && alt >= 18 ? (
                  <TextoSvg
                    x={cxBase}
                    y={cyTopo + 3}
                    fontFamily="JetBrainsMono"
                    fontSize={8.5}
                    fontWeight="600"
                    fill={ehFutura ? cor("cor-barro-texto") : cor("cor-texto-apoio")}
                    textAnchor="middle"
                  >
                    {`${Math.round(alt / 3)}p`}
                  </TextoSvg>
                ) : null}
              </G>
            );
          })}

          {/* Linhas de brisa E-SE (90-160°) */}
          {brisaOffsets.map(([bx, by], idx) => {
            const p0 = toSvg([bx, by], 4);
            const p1 = toSvg([bx - 34, by + 23], 4);
            return (
              <G key={`brisa-${idx}`}>
                <Line
                  x1={p0[0]}
                  y1={p0[1]}
                  x2={p1[0]}
                  y2={p1[1]}
                  stroke={calculoSolar.bloqueioBrisa ? cor("cor-traco") : cor("cat-mare")}
                  strokeWidth={2}
                  strokeDasharray={calculoSolar.bloqueioBrisa ? "4 4" : undefined}
                />
                <Circle
                  cx={p1[0]}
                  cy={p1[1]}
                  r={2.4}
                  fill={calculoSolar.bloqueioBrisa ? cor("cor-traco") : cor("cat-mare")}
                />
              </G>
            );
          })}

          {/* Marcador da fachada selecionada no imovel */}
          <Circle
            cx={pinX}
            cy={pinY}
            r={6.5}
            fill={fachadaAtiva.grupoSolar === "Poente" ? cor("cor-barro") : cor("cor-acao")}
            stroke={cor("cor-superficie")}
            strokeWidth={2}
          />

          {/* Orbe do Sol no horario */}
          {calculoSolar.solAcima ? (
            <G>
              <Line
                x1={solX}
                y1={solY}
                x2={pinX}
                y2={pinY}
                stroke={cor("cor-acao")}
                strokeWidth={1.3}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
              <Circle cx={solX} cy={solY} r={10} fill={cor("cat-ipe-amarelo")} />
              <Circle cx={solX} cy={solY} r={5.5} fill={cor("cor-acao")} />
            </G>
          ) : null}

          {/* Rosa dos ventos compacta (Norte) */}
          <G>
            <Circle cx={SVG_W - 24} cy={24} r={14} fill={cor("cor-superficie")} stroke={cor("cor-linha-forte")} strokeWidth={1} />
            <TextoSvg x={SVG_W - 24} y={28} fontFamily="PlusJakartaSans" fontSize={10} fontWeight="700" fill={cor("cor-texto")} textAnchor="middle">
              N
            </TextoSvg>
          </G>

          {/* Legenda canto inferior */}
          <Rect x={10} y={SVG_H - 28} width={178} height={20} rx={6} fill={cor("cor-superficie")} fillOpacity={0.92} />
          <TextoSvg x={18} y={SVG_H - 14.5} fontFamily="PlusJakartaSans" fontSize={9.5} fontWeight="600" fill={cor("cat-mare")}>
            {calculoSolar.bloqueioBrisa ? "Brisa E-SE: barrada por vizinho" : "Brisa E-SE: entrando pela quadra"}
          </TextoSvg>
        </Svg>
      </View>

      {/* Leitura dinamica do instante simulado */}
      <View
        style={[
          styles.faixaLeitura,
          {
            backgroundColor: calculoSolar.solNaFrente && !calculoSolar.emSombraVizinho && fachadaAtiva.grupoSolar === "Poente"
              ? cor("cor-barro-suave")
              : cor("cor-papel-claro"),
            borderColor: cor("cor-linha"),
          },
        ]}
      >
        <Texto tipo="corpo" cor="cor-texto" style={styles.textoLeitura}>
          {resumoMomento}
        </Texto>
      </View>

      {/* Controles interativos: Hora, Estacao, Andar e Risco LPUOS */}
      <View style={styles.controlesLinha}>
        <View style={styles.blocoHoras}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloMini}>
            Hora do dia:
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
                      borderColor: cor("cor-linha-forte"),
                    },
                  ]}
                >
                  <Texto tipo="etiqueta" cor={ativo ? "cor-superficie" : "cor-texto"} style={styles.textoHora}>
                    {`${String(h).padStart(2, "0")}h`}
                  </Texto>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.blocoEstacao}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloMini}>
            Época do ano:
          </Texto>
          <View style={styles.horasRow}>
            <Pressable
              testID="estacao-verao"
              accessibilityRole="button"
              onPress={() => setEstacao("verao")}
              style={[
                styles.pilulaEstacao,
                {
                  backgroundColor: estacao === "verao" ? cor("cor-acao") : cor("cor-papel-claro"),
                  borderColor: cor("cor-linha-forte"),
                },
              ]}
            >
              <Texto tipo="etiqueta" cor={estacao === "verao" ? "cor-sobre-acao" : "cor-texto"} style={styles.textoHora}>
                Verão (Dez)
              </Texto>
            </Pressable>
            <Pressable
              testID="estacao-inverno"
              accessibilityRole="button"
              onPress={() => setEstacao("inverno")}
              style={[
                styles.pilulaEstacao,
                {
                  backgroundColor: estacao === "inverno" ? cor("cor-azul-cadastral") : cor("cor-papel-claro"),
                  borderColor: cor("cor-linha-forte"),
                },
              ]}
            >
              <Texto tipo="etiqueta" cor={estacao === "inverno" ? "cor-superficie" : "cor-texto"} style={styles.textoHora}>
                Inverno (Jun)
              </Texto>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Stepper de Andar + Botao Risco Torres Futuras */}
      <View style={styles.rodapeControles}>
        <View style={styles.andarStepper}>
          <Pressable
            testID="andar-menos"
            accessibilityRole="button"
            accessibilityLabel="Diminuir andar"
            onPress={() => aoAlterarAndar(Math.max(1, andar - 1))}
            style={[styles.botaoStepper, { backgroundColor: cor("cor-papel-claro"), borderColor: cor("cor-linha-forte") }]}
          >
            <Texto tipo="secao" style={styles.textoStepper}>−</Texto>
          </Pressable>
          <View style={styles.andarValor}>
            <Texto tipo="etiqueta">{`${andar}º andar`}</Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloMini}>
              {`Altura ~${Math.round(zAndarM)} m`}
            </Texto>
          </View>
          <Pressable
            testID="andar-mais"
            accessibilityRole="button"
            accessibilityLabel="Aumentar andar"
            onPress={() => aoAlterarAndar(Math.min(maxAndar, andar + 1))}
            style={[styles.botaoStepper, { backgroundColor: cor("cor-papel-claro"), borderColor: cor("cor-linha-forte") }]}
          >
            <Texto tipo="secao" style={styles.textoStepper}>+</Texto>
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
              backgroundColor: mostrarTorresFuturas ? cor("cor-barro-suave") : cor("cor-papel-claro"),
              borderColor: mostrarTorresFuturas ? cor("cor-barro") : cor("cor-linha-forte"),
            },
          ]}
        >
          <Texto
            tipo="etiqueta"
            cor={mostrarTorresFuturas ? "cor-barro-texto" : "cor-texto"}
            style={styles.textoFuturas}
          >
            {mostrarTorresFuturas ? "Risco de torres futuras: ligado" : "Ver risco de torres futuras"}
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
    padding: 16,
    gap: 12,
  },
  cabecalho: {
    gap: 4,
  },
  resumoTitulo: {
    fontSize: 17,
    lineHeight: 22,
  },
  subtitulo: {
    fontSize: 13,
    lineHeight: 18,
  },
  grupoBotoesFachada: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  botaoFachada: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  textoBotaoFachada: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  subBotaoFachada: {
    fontSize: 11,
  },
  molduraSvg: {
    borderRadius: RAIO.quadrado,
    borderWidth: 1,
    overflow: "hidden",
  },
  faixaLeitura: {
    borderRadius: RAIO.quadrado,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  textoLeitura: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  controlesLinha: {
    gap: 10,
  },
  blocoHoras: {
    gap: 4,
  },
  blocoEstacao: {
    gap: 4,
  },
  rotuloMini: {
    fontSize: 11,
  },
  horasRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pilulaHora: {
    minHeight: TOQUE_MINIMO,
    minWidth: 48,
    borderRadius: RAIO.pilula,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pilulaEstacao: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.pilula,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textoHora: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  rodapeControles: {
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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textoStepper: {
    fontSize: 18,
  },
  andarValor: {
    alignItems: "center",
    minWidth: 74,
  },
  botaoFuturas: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    flexShrink: 1,
  },
  textoFuturas: {
    fontSize: 12.5,
    fontWeight: "600",
  },
});
