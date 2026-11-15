import { useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as TextoSvg } from "react-native-svg";
import type { Edificio, Obra, ObrasProximas } from "../../dados/contratos";
import { type HorarioSolar } from "../../dados/dossie/solESombra";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, comAlfa, type TokenDeCor } from "../../tema/tokens";
import { GradeArquitetonica } from "../GradeArquitetonica";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { montarCena25DDoLote, montarCenaDoLote } from "./mapa";
import { categoriaDaObra } from "./textos";

/** Cor de cada categoria de obra: o ponto no mapa e a bolinha da lista usam o mesmo par. O nome está sempre escrito ao lado. */
export const COR_DA_OBRA: Record<Obra["categoria"], { fundo: TokenDeCor; texto: TokenDeCor }> = {
  construcao: { fundo: "cor-acao", texto: "cor-sobre-acao" },
  acrescimo: { fundo: "cor-salvia-escura", texto: "cor-superficie" },
  demolicao: { fundo: "cor-barro", texto: "cor-sobre-barro" },
};

const ALTURA = 280;
const LARGURA_ANTES_DA_MEDIDA = 320;

export type ModoDoMapa = HorarioSolar | "planta";

const OPCOES_DO_MAPA: readonly { id: ModoDoMapa; rotulo: string }[] = [
  { id: "planta", rotulo: "Planta 2D" },
];

type Props = {
  predio: Edificio;
  obras: ObrasProximas["recentes"];
  /** Todos os edifícios do bairro; o mapa desenha só os que ficam perto do quadro, como contexto. */
  vizinhos: readonly Edificio[];
  /** Andar declarado ou conhecido do apartamento, para destacar a altura no volume 2.5D. */
  andar?: number | null;
  /** Modo inicial: volume 2.5D com sombra da tarde (padrão) ou planta 2D. */
  modoInicial?: ModoDoMapa;
};

/**
 * Mapa arquitetônico do lote: alterna entre volume 2.5D com sombra solar projetada dos vizinhos (Manhã, Meio-dia, Tarde)
 * e a planta cadastral 2D, sobre `.arch-grid-pattern`.
 */
export function MapaDoLote({ predio, obras, vizinhos, andar = null, modoInicial = "planta" }: Props) {
  const { cor } = useTema();
  const azul = cor("cor-azul-cadastral");
  const acao = cor("cor-acao");
  const textoCor = cor("cor-texto");
  const [largura, setLargura] = useState(LARGURA_ANTES_DA_MEDIDA);
  // O lote não é a torre. A interface cadastral permanece em planta; os helpers antigos ficam compatíveis.
  const [modo, setModo] = useState<ModoDoMapa>(modoInicial === "planta" ? modoInicial : "planta");

  const cenaPlanta = useMemo(() => montarCenaDoLote(predio, obras, vizinhos, largura, ALTURA), [predio, obras, vizinhos, largura]);
  const cena25d = useMemo(
    () => (modo === "planta" ? null : montarCena25DDoLote(predio, obras, vizinhos, largura, ALTURA, modo, andar)),
    [predio, obras, vizinhos, largura, modo, andar],
  );
  const cena = cena25d ?? cenaPlanta;

  const descricao =
    obras.length > 0
      ? `Mapa do lote do prédio${cena25d ? " em volume 3D com sombra projetada" : ""} e ${obras.length} ${obras.length === 1 ? "obra licenciada" : "obras licenciadas"} como pontos numerados. Régua de ${cena.regua.rotulo}.`
      : `Mapa do lote do prédio${cena25d ? " em volume 3D com sombra projetada" : ""}, sem obras licenciadas nos últimos 24 meses. Régua de ${cena.regua.rotulo}.`;

  return (
    <View style={{ gap: ESPACO[2] }}>
      <View style={{ display: "none" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" accessibilityLabel="Modo cadastral">
        {OPCOES_DO_MAPA.map((op) => {
          const ativa = modo === op.id;
          return (
            <Pressionavel
              key={op.id}
              onPress={() => setModo(op.id)}
              accessibilityRole="button"
              accessibilityLabel={`Ver mapa: ${op.rotulo}`}
              accessibilityState={{ selected: ativa }}
              aria-pressed={ativa}
              style={{
                minHeight: 36,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: RAIO.pilula,
                borderWidth: 1,
                borderColor: ativa ? comAlfa(azul, 0.55) : cor("cor-linha"),
                backgroundColor: ativa ? cor("cor-azul-cadastral-suave") : cor("cor-papel-claro"),
                justifyContent: "center",
              }}
            >
              <Texto tipo="apoio" cor={ativa ? "cor-azul-cadastral" : "cor-texto-apoio"} style={{ fontSize: 11, lineHeight: 15, fontWeight: ativa ? "700" : "500" }}>
                {op.rotulo}
              </Texto>
            </Pressionavel>
          );
        })}
      </View>

      <View
        onLayout={(e) => {
          const medida = Math.round(e.nativeEvent.layout.width);
          if (medida > 0 && medida !== largura) setLargura(medida);
        }}
        style={{
          height: ALTURA,
          borderRadius: 13,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: comAlfa(azul, 0.25),
          backgroundColor: cor("cor-azul-cadastral-suave"),
        }}
      >
        <GradeArquitetonica />
        <View accessible role="img" accessibilityLabel={descricao} pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <Svg width={cena.largura} height={cena.altura} viewBox={`0 0 ${cena.largura} ${cena.altura}`}>
            {cena25d ? (
              <>
                {/* 1. Sombras projetadas no chão por todos os edifícios */}
                {cena25d.volumes.map((v) =>
                  v.sombra.map((d, idx) => (
                    <Path key={`s-${v.id}-${idx}`} d={d} fill={textoCor} fillOpacity={v.alvo ? 0.14 : 0.09} />
                  )),
                )}
                {/* 2. Volumes ordenados de Norte para Sul (paredes, cobertura e andar do imóvel) */}
                {cena25d.volumes.map((v) => (
                  <G key={`v-${v.id}`}>
                    <Path
                      d={v.base}
                      fill={azul}
                      fillOpacity={v.alvo ? 0.14 : 0.04}
                      stroke={azul}
                      strokeOpacity={v.alvo ? 0.5 : 0.28}
                      strokeWidth={1}
                    />
                    {v.paredes.map((p, idx) => (
                      <Path
                        key={`p-${v.id}-${idx}`}
                        d={p}
                        fill={v.alvo ? azul : textoCor}
                        fillOpacity={v.alvo ? 0.18 : 0.06}
                        stroke={azul}
                        strokeOpacity={v.alvo ? 0.55 : 0.25}
                        strokeWidth={0.8}
                        strokeLinejoin="round"
                      />
                    ))}
                    <Path
                      d={v.topo}
                      fill={v.alvo ? azul : cor("cor-superficie")}
                      fillOpacity={v.alvo ? 0.28 : 0.72}
                      stroke={azul}
                      strokeOpacity={v.alvo ? 0.95 : 0.48}
                      strokeWidth={v.alvo ? 2.2 : 1}
                      strokeDasharray={!v.alvo && v.alturaM === null ? "4 3" : undefined}
                      strokeLinejoin="round"
                    />
                    {v.faixaDoAndar ? (
                      <Path d={v.faixaDoAndar} fill="none" stroke={acao} strokeWidth={2.4} strokeLinejoin="round" />
                    ) : null}
                    {v.etiquetaAltura ? (
                      <TextoSvg
                        x={v.etiquetaAltura.x}
                        y={v.etiquetaAltura.y}
                        fill={v.alvo ? azul : cor("cor-texto-apoio")}
                        fontFamily="JetBrainsMono"
                        fontSize={9.5}
                        fontWeight={v.alvo ? "700" : "600"}
                        textAnchor="middle"
                      >
                        {v.etiquetaAltura.texto}
                      </TextoSvg>
                    ) : null}
                  </G>
                ))}
                {/* Indicador discreto de Norte e da brisa Sudeste do Recife */}
                <G transform={`translate(${cena.largura - 56}, ${cena.altura - 22})`}>
                  <Line x1={38} y1={10} x2={22} y2={-4} stroke={azul} strokeWidth={1.5} strokeLinecap="round" />
                  <Path d="M22 -4 L28 -3 L23 2 Z" fill={azul} />
                  <TextoSvg x={4} y={12} fill={azul} fontFamily="JetBrainsMono" fontSize={9.5} fontWeight="600">
                    Brisa SE
                  </TextoSvg>
                </G>
              </>
            ) : (
              <>
                {cenaPlanta.vizinhos.map((d) => (
                  <Path key={d} d={d} fill={azul} fillOpacity={0.05} stroke={azul} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="4 3" strokeLinejoin="round" />
                ))}
                {cenaPlanta.lote ? <Path d={cenaPlanta.lote} fill={azul} fillOpacity={0.22} stroke={azul} strokeWidth={2.5} strokeLinejoin="round" /> : null}
              </>
            )}

            <G transform={`translate(${cena.pino[0]}, ${cena.pino[1]})`}>
              <Circle cx={0} cy={0} r={11} fill={acao} fillOpacity={0.25} />
              <Circle cx={0} cy={0} r={5.5} fill={acao} stroke={cor("cor-superficie")} strokeWidth={2} />
            </G>
            {cena.obras.map((o) => (
              <G key={o.numero} transform={`translate(${o.x}, ${o.y})`}>
                <Circle cx={0} cy={0} r={10} fill={cor(COR_DA_OBRA[o.categoria].fundo)} stroke={cor("cor-superficie")} strokeWidth={2} />
                <TextoSvg x={0} y={3.5} fill={cor(COR_DA_OBRA[o.categoria].texto)} fontFamily="JetBrainsMono" fontSize={10} fontWeight="700" textAnchor="middle">
                  {String(o.numero)}
                </TextoSvg>
              </G>
            ))}
            <G>
              <Line x1={12} y1={cena.altura - 14} x2={12 + cena.regua.pixels} y2={cena.altura - 14} stroke={textoCor} strokeWidth={2} />
              <Line x1={12} y1={cena.altura - 18} x2={12} y2={cena.altura - 10} stroke={textoCor} strokeWidth={2} />
              <Line x1={12 + cena.regua.pixels} y1={cena.altura - 18} x2={12 + cena.regua.pixels} y2={cena.altura - 10} stroke={textoCor} strokeWidth={2} />
              <TextoSvg x={12} y={cena.altura - 22} fill={textoCor} fontFamily="JetBrainsMono" fontSize={10} fontWeight="600">
                {cena.regua.rotulo}
              </TextoSvg>
            </G>
          </Svg>
        </View>
      </View>
    </View>
  );
}

/** Linha da lista de obras: bolinha numerada com a cor da categoria, tipo da obra e "mês · distância · situação". */
export function LinhaDeObraNumerada({
  numero, categoria, titulo, detalhe, rotulo,
}: {
  numero: number;
  categoria: Obra["categoria"];
  titulo: string;
  detalhe: string;
  rotulo: string;
}) {
  const { cor } = useTema();
  const cores = COR_DA_OBRA[categoria];
  return (
    <View
      accessible
      accessibilityLabel={rotulo}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: cor("cor-linha") }}
    >
      <View style={{ width: 26, height: 26, borderRadius: RAIO.pilula, alignItems: "center", justifyContent: "center", backgroundColor: cor(cores.fundo) }}>
        <Texto tipo="etiqueta" cor={cores.texto} style={{ fontFamily: "JetBrainsMono", fontSize: 11, lineHeight: 14, fontWeight: "700" }}>
          {String(numero)}
        </Texto>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
          {titulo}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17, marginTop: 2 }}>
          {detalhe}
        </Texto>
      </View>
    </View>
  );
}

/** Legenda do mapa: o contorno do lote, a sombra projetada, o andar destacado e só as categorias de obra que aparecem. */
export function LegendaDoMapa({ categorias, temAndar = false, temSombra = false }: { categorias: Obra["categoria"][]; temAndar?: boolean; temSombra?: boolean }) {
  const { cor } = useTema();
  const unicas = [...new Set(categorias)];
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 14, height: 10, borderRadius: 2, borderWidth: 2, borderColor: cor("cor-azul-cadastral"), backgroundColor: comAlfa(cor("cor-azul-cadastral"), 0.22) }} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          Lote do prédio
        </Texto>
      </View>
      {temSombra ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 12, height: 8, borderRadius: 2, backgroundColor: comAlfa(cor("cor-texto"), 0.16) }} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          Sombra estimada
        </Texto>
      </View> : null}
      {temAndar ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 14, height: 3, borderRadius: 1, backgroundColor: cor("cor-acao") }} />
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
            Cota do andar
          </Texto>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cor("cor-acao"), borderWidth: 2, borderColor: cor("cor-superficie") }} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          Centro do prédio
        </Texto>
      </View>
      {unicas.map((c) => (
        <View key={c} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cor(COR_DA_OBRA[c].fundo) }} />
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
            {categoriaDaObra(c)}
          </Texto>
        </View>
      ))}
    </View>
  );
}
