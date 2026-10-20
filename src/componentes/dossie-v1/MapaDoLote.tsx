import { useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as TextoSvg } from "react-native-svg";
import type { Edificio, Obra, ObrasProximas } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { RAIO, comAlfa, type TokenDeCor } from "../../tema/tokens";
import { GradeArquitetonica } from "../GradeArquitetonica";
import { Texto } from "../Texto";
import { montarCenaDoLote } from "./mapa";
import { categoriaDaObra } from "./textos";

/** Cor de cada categoria de obra: o ponto no mapa e a bolinha da lista usam o mesmo par. O nome está sempre escrito ao lado. */
export const COR_DA_OBRA: Record<Obra["categoria"], { fundo: TokenDeCor; texto: TokenDeCor }> = {
  construcao: { fundo: "cor-acao", texto: "cor-sobre-acao" },
  acrescimo: { fundo: "cor-salvia-escura", texto: "cor-superficie" },
  demolicao: { fundo: "cor-barro", texto: "cor-sobre-barro" },
};

const ALTURA = 280;
const LARGURA_ANTES_DA_MEDIDA = 320;

type Props = {
  predio: Edificio;
  obras: ObrasProximas["recentes"];
  /** Todos os edifícios do bairro; o mapa desenha só os que ficam perto do quadro, como contexto. */
  vizinhos: readonly Edificio[];
};

/**
 * O lote do prédio (azul cadastral), o pino laranja e as obras recentes como pontos numerados, sobre
 * `.arch-grid-pattern`. O desenho é uma imagem para o leitor de tela; a lista de obras ao lado carrega o texto.
 */
export function MapaDoLote({ predio, obras, vizinhos }: Props) {
  const { cor } = useTema();
  const azul = cor("cor-azul-cadastral");
  const [largura, setLargura] = useState(LARGURA_ANTES_DA_MEDIDA);
  const cena = useMemo(() => montarCenaDoLote(predio, obras, vizinhos, largura, ALTURA), [predio, obras, vizinhos, largura]);
  const descricao =
    obras.length > 0
      ? `Mapa do lote do prédio com ${obras.length} ${obras.length === 1 ? "obra licenciada" : "obras licenciadas"} como pontos numerados. Régua de ${cena.regua.rotulo}.`
      : `Mapa do lote do prédio, sem obras licenciadas nos últimos 24 meses. Régua de ${cena.regua.rotulo}.`;
  return (
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
          {cena.vizinhos.map((d) => (
            <Path key={d} d={d} fill={azul} fillOpacity={0.05} stroke={azul} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="4 3" strokeLinejoin="round" />
          ))}
          {cena.lote ? <Path d={cena.lote} fill={azul} fillOpacity={0.22} stroke={azul} strokeWidth={2.5} strokeLinejoin="round" /> : null}
          <G transform={`translate(${cena.pino[0]}, ${cena.pino[1]})`}>
            <Circle cx={0} cy={0} r={11} fill={cor("cor-acao")} fillOpacity={0.25} />
            <Circle cx={0} cy={0} r={5.5} fill={cor("cor-acao")} stroke={cor("cor-superficie")} strokeWidth={2} />
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
            <Line x1={12} y1={cena.altura - 14} x2={12 + cena.regua.pixels} y2={cena.altura - 14} stroke={cor("cor-texto")} strokeWidth={2} />
            <Line x1={12} y1={cena.altura - 18} x2={12} y2={cena.altura - 10} stroke={cor("cor-texto")} strokeWidth={2} />
            <Line x1={12 + cena.regua.pixels} y1={cena.altura - 18} x2={12 + cena.regua.pixels} y2={cena.altura - 10} stroke={cor("cor-texto")} strokeWidth={2} />
            <TextoSvg x={12} y={cena.altura - 22} fill={cor("cor-texto")} fontFamily="JetBrainsMono" fontSize={10} fontWeight="600">
              {cena.regua.rotulo}
            </TextoSvg>
          </G>
        </Svg>
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

/** Legenda do mapa: o contorno do lote, o pino e só as categorias de obra que aparecem. */
export function LegendaDoMapa({ categorias }: { categorias: Obra["categoria"][] }) {
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
