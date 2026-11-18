// Fundo do mapa (mapa-base, 18/11/2026): desenha a cena de montarFundoDoMapa (fundoDoMapa.ts) com os tokens do tema.
// Vai DENTRO do <Svg> do mapa que hospeda, no mesmo grupo de zoom do conteúdo e antes dele: pino, obras, pontos e régua
// ficam por cima. Uma forma por camada; traços e textos já vêm divididos pelo zoom (constantes na tela).
//
// Texto na via (TextPath), web × nativo (react-native-svg 15.15):
// - web: vira <textPath href="#id" startOffset=…> de verdade; textAnchor, letterSpacing e stroke são atributos SVG
//   comuns. `paint-order` não é repassado pelo react-native-svg, por isso o halo é um segundo texto com traço, por baixo.
// - nativo: RNSVGTextPath faz o próprio leiaute ao longo do caminho; startOffset aceita número (usamos número, não %,
//   para não depender do cálculo de porcentagem de cada plataforma); textAnchor vem do <Text> pai; letterSpacing entra
//   nos dados de fonte; traço em texto funciona, então o halo também é um texto com traço por baixo.
// - nos dois: fontWeight com família própria depende de a fonte carregada ter o peso (os .ttf do app são variáveis).
import { useEffect, useId, useRef } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Defs, G, Path, Rect, Text as TextoSvg, TextPath } from "react-native-svg";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { Texto } from "../Texto";
import { desempenhoDoAmbiente, registrarMedida, tomarFimDaMontagem, type CenaDoFundo } from "./fundoDoMapaCena";
import { estiloDoFundo, FONTES_DO_FUNDO, TRACEJADO_DA_DIVISA, TRACO } from "./fundoDoMapaEstilo";
import type { RotuloDeRua } from "./fundoDoMapaRotulos";

/**
 * Que parte do fundo desenhar. "tudo" (padrão): o fundo inteiro. "chao": todas as camadas menos os rótulos de rua e os
 * nomes de bairro. "rotulos": só eles. O mapa com volumes (2.5D) desenha "chao", os volumes e, por cima, "rotulos".
 */
export type PartesDoFundo = "tudo" | "chao" | "rotulos";

export type FundoDoMapaProps = { cena: CenaDoFundo; partes?: PartesDoFundo };

/**
 * "fundo-do-mapa:desenhar" (só na web, só com a API performance): do fim da montagem da cena (ou, para uma cena já
 * guardada, do render que a trouxe) até o quadro seguinte ao que a pôs na tela.
 */
function useMedirODesenho(cena: CenaDoFundo, ligado: boolean): void {
  const medir = ligado && Platform.OS === "web" && desempenhoDoAmbiente() !== null;
  const inicio = useRef<{ cena: CenaDoFundo; t: number } | null>(null);
  useEffect(() => {
    if (!medir || typeof requestAnimationFrame !== "function") return;
    if (inicio.current?.cena !== cena) inicio.current = { cena, t: tomarFimDaMontagem(cena) ?? desempenhoDoAmbiente()!.now() };
    const t = inicio.current.t;
    const id = requestAnimationFrame(() => registrarMedida("fundo-do-mapa:desenhar", t));
    return () => cancelAnimationFrame(id);
  }, [cena, medir]);
}

/** Os elementos do fundo, para pôr dentro do <Svg> (e do grupo de zoom) do mapa que hospeda. */
export function FundoDoMapa({ cena, partes = "tudo" }: FundoDoMapaProps) {
  const { cores, escuro } = useTema();
  // A medida do desenho vai com a parte de baixo (a que existe sempre).
  useMedirODesenho(cena, partes !== "rotulos");
  // Os ids dos caminhos dos rótulos são do documento inteiro na web: dois fundos na mesma página (topo do dossiê e
  // gaveta abertos juntos) não podem apontar um para o caminho do outro.
  const prefixo = "f" + useId().replace(/[^A-Za-z0-9_-]/g, "");
  const idDe = (r: RotuloDeRua) => `${prefixo}-${r.id}`;
  const e = estiloDoFundo(cores, escuro);
  const z = cena.zoom;
  const t = (px: number) => px / z;
  const c = cena.camadas;
  const corDaRua = (r: RotuloDeRua) => (r.tipo === "imovel" ? e.ruaDoImovel : r.tipo === "avenida" ? e.avenida : e.rua);
  const pesoDaRua = (r: RotuloDeRua) => (r.tipo === "imovel" ? "700" : "600");
  if (!cena.temDado) return null;
  // Emenda do chão do vizinho (divisa da cidade, 2 m) com a divisa fina do bairro: um traço de 3 m na cor do chão.
  const emenda = Number.isFinite(cena.metrosPorPx) && cena.metrosPorPx > 0 ? 3 / (cena.metrosPorPx * z) : t(2);
  // Marca estável do grupo raiz (testID e, na web, data-fundo-do-mapa-raiz) para as capturas acharem o fundo em
  // qualquer tela. Não é data-fundo-do-mapa: quem hospeda já pode marcar o embrulho com ele, e a contagem dobraria.
  // Só a parte de baixo ("tudo" ou "chao") leva a marca: com o fundo em duas partes, as capturas contam um fundo só.
  const marca = (partes === "rotulos" ? { testID: "fundo-do-mapa-rotulos" } : { testID: "fundo-do-mapa", "data-fundo-do-mapa-raiz": "" }) as object;
  const chao = partes !== "rotulos";
  const rotulos = partes !== "chao";
  return (
    <G {...marca}>
      {chao ? (
        <>
          <Rect x={0} y={0} width={cena.largura} height={cena.altura} fill={e.semDado} />
          <Path d={c.hachura} stroke={e.hachura} strokeWidth={t(TRACO.hachura)} fill="none" />
          {c.chao ? <Path d={c.chao} fill={e.chao} fillRule="evenodd" /> : null}
          {c.chaoDaCidade ? (
            <Path d={c.chaoDaCidade} fill={e.chao} stroke={e.chao} strokeWidth={emenda} strokeLinejoin="round" fillRule="evenodd" />
          ) : null}
          {c.tintaDoBairro ? <Path d={c.tintaDoBairro} fill={e.tinta} fillOpacity={e.tintaOpacidade} fillRule="evenodd" /> : null}
          {c.quadras ? <Path d={c.quadras} fill={e.quadra} fillRule="evenodd" /> : null}
          {c.lotes ? <Path d={c.lotes} fill={e.lote} stroke={e.loteLinha} strokeWidth={t(TRACO.lote)} strokeLinejoin="round" fillRule="evenodd" /> : null}
          {c.predios ? (
            <Path d={c.predios} fill={e.predio} stroke={e.predioLinha} strokeOpacity={e.predioLinhaOpacidade} strokeWidth={t(TRACO.predio)} strokeLinejoin="round" fillRule="evenodd" />
          ) : null}
          {c.pracas ? <Path d={c.pracas} fill={e.praca} stroke={e.pracaLinha} strokeWidth={t(TRACO.praca)} fillRule="evenodd" /> : null}
          {c.agua ? <Path d={c.agua} fill={e.agua} stroke={e.aguaLinha} strokeWidth={t(TRACO.agua)} fillRule="evenodd" /> : null}
          {c.pontes ? <Path d={c.pontes} fill={e.chao} fillRule="evenodd" /> : null}
          {c.vias ?<Path d={c.vias} fill="none" stroke={e.via} strokeWidth={t(TRACO.via)} strokeLinecap="round" strokeLinejoin="round" /> : null}
          {c.divisas ? (
            <Path
              d={c.divisas}
              fill="none"
              stroke={e.divisa}
              strokeOpacity={e.divisaOpacidade}
              strokeWidth={t(TRACO.divisa)}
              strokeDasharray={TRACEJADO_DA_DIVISA.map(t)}
            />
          ) : null}
          {c.divisaDoImovel ? (
            <Path d={c.divisaDoImovel} fill="none" stroke={e.divisaDoImovel} strokeOpacity={e.divisaDoImovelOpacidade} strokeWidth={t(TRACO.divisaDoImovel)} strokeLinejoin="round" />
          ) : null}
          {c.loteDoImovel ? (
            <Path
              d={c.loteDoImovel}
              fill={e.loteDoImovel}
              fillOpacity={e.loteDoImovelOpacidade}
              stroke={e.loteDoImovel}
              strokeWidth={t(TRACO.loteDoImovel)}
              strokeLinejoin="round"
              fillRule="evenodd"
            />
          ) : null}
        </>
      ) : null}
      {rotulos ? (
        <>
          {cena.rotulos.length > 0 ? (
            <Defs>
              {cena.rotulos.map((r) => (
                <Path key={r.id} id={idDe(r)} d={r.caminho} />
              ))}
            </Defs>
          ) : null}
          {[true, false].map((halo) => (
            <G key={halo ? "halo" : "texto"}>
              {cena.rotulos.map((r) => (
                <TextoSvg
                  key={r.id}
                  fontFamily={FONTES_DO_FUNDO.rua}
                  fontWeight={pesoDaRua(r)}
                  fontSize={r.tamanho}
                  textAnchor="middle"
                  fill={halo ? e.halo : corDaRua(r)}
                  stroke={halo ? e.halo : undefined}
                  strokeWidth={halo ? t(TRACO.haloDaRua) : undefined}
                  strokeLinejoin={halo ? "round" : undefined}
                >
                  <TextPath href={`#${idDe(r)}`} startOffset={r.inicio}>
                    {r.nome}
                  </TextPath>
                </TextoSvg>
              ))}
              {cena.bairros.map((b) => (
                <TextoSvg
                  key={b.slug}
                  x={b.x}
                  y={b.y + b.tamanho * 0.36}
                  fontFamily={FONTES_DO_FUNDO.bairro}
                  fontWeight="600"
                  fontSize={b.tamanho}
                  letterSpacing={b.espacamento}
                  textAnchor="middle"
                  fill={halo ? e.halo : b.doImovel ? e.bairroDoImovel : e.bairro}
                  stroke={halo ? e.halo : undefined}
                  strokeWidth={halo ? t(TRACO.haloDoBairro) : undefined}
                  strokeLinejoin={halo ? "round" : undefined}
                >
                  {b.nome}
                </TextoSvg>
              ))}
            </G>
          ))}
        </>
      ) : null}
    </G>
  );
}

export type SeloDoBairroProps = { nome: string; style?: StyleProp<ViewStyle> };

/** Selo "BAIRRO / Boa Viagem" para o canto do mapa (por cima do desenho, fora do <Svg>). */
export function SeloDoBairro({ nome, style }: SeloDoBairroProps) {
  const { cor } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={`Bairro ${nome}`}
      style={[estilos.selo, { backgroundColor: comAlfa(cor("cor-superficie"), 0.94), borderColor: cor("cor-linha") }, style]}
    >
      <Texto tipo="etiqueta" cor="cor-texto-apoio" style={estilos.seloRotulo}>
        BAIRRO
      </Texto>
      <Texto tipo="titulo-tela" style={estilos.seloNome}>
        {nome}
      </Texto>
    </View>
  );
}

export type CreditoDaBaseProps = { style?: StyleProp<ViewStyle> };

/** Crédito obrigatório em todo mapa com o fundo (licença ODbL da base da Prefeitura). */
export function CreditoDaBase({ style }: CreditoDaBaseProps) {
  const { cor } = useTema();
  return (
    <View style={[estilos.credito, { backgroundColor: comAlfa(cor("cor-superficie"), 0.88) }, style]}>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={estilos.creditoTexto}>
        Base: Prefeitura do Recife (ODbL)
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingTop: 4, paddingBottom: 5 },
  seloRotulo: { fontFamily: "JetBrainsMono", fontSize: 9, lineHeight: 11, letterSpacing: 1.2 },
  seloNome: { fontSize: 15, lineHeight: 18, fontWeight: "600" },
  credito: { alignSelf: "flex-end", borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  creditoTexto: { fontSize: 9, lineHeight: 12 },
});
