import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, G, Path, Pattern, Polygon, Rect, Text as TextoSvg } from "react-native-svg";
import type { Edificio } from "../../dados/contratos";
import { bairroPorSlug } from "../../dados/recife/bairros";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO, comAlfa } from "../../tema/tokens";
import { useFocoDeTeclado } from "../casca/foco";
import { AvisoDoFundoDoMapa } from "../mapa/AvisoDoFundoDoMapa";
import { CreditoDaBase, FundoDoMapa, SeloDoBairro } from "../mapa/FundoDoMapa";
import { descreverFundoDoMapa } from "../mapa/fundoDoMapaCena";
import { useFundoDoMapa } from "../mapa/useFundoDoMapa";
import { Texto } from "../Texto";
import { caixaDaCena, montarCena, paraDesenhoDaCena, pontosDoSvg, raioSemPoligono, type Forma } from "./projecao";
import { rotuloDoLoteVizinho } from "./textos";

type Props = {
  selecionado: Edificio;
  /** Todos os edifícios do bairro; o mapa escolhe os mais próximos. */
  outros: readonly Edificio[];
  aoEscolher: (edificio: Edificio) => void;
};

const ALTURA = 180;
const LARGURA_ANTES_DA_MEDIDA = 340;
const RESERVA_DA_LEGENDA = 40;
/** Selo do bairro (canto de cima, à esquerda) e crédito da base (canto de cima, à direita), por cima do desenho. */
const MARGEM_DOS_SELOS = 6;
const ALTURA_DO_SELO = 40;
const LARGURA_DO_CREDITO = 150;
const ALTURA_DO_CREDITO = 14;
const INSTRUCAO =
  "o prédio em azul, o pino laranja sobre ele e os lotes vizinhos tracejados. Use a busca ou o botão Não é este se o pino estiver fora do prédio.";

/** Código do logradouro no id do índice ("8001-216" → 8001), para o fundo destacar a rua do prédio. */
function codigoDoLogradouro(id: string): number | null {
  const n = Number(id.split("-")[0]);
  return Number.isInteger(n) ? n : null;
}

/** Retângulo, em pixels do desenho, que um lote tocável ocupa: o do próprio lote, no mínimo o toque mínimo do app. */
function areaDeToque(f: Forma, raioDoCirculo: number): { left: number; top: number; width: number; height: number } {
  const xs = f.pontos ? f.pontos.map((p) => p[0]) : [f.centro[0] - raioDoCirculo, f.centro[0] + raioDoCirculo];
  const ys = f.pontos ? f.pontos.map((p) => p[1]) : [f.centro[1] - raioDoCirculo, f.centro[1] + raioDoCirculo];
  const largura = Math.max(Math.max(...xs) - Math.min(...xs), TOQUE_MINIMO);
  const altura = Math.max(Math.max(...ys) - Math.min(...ys), TOQUE_MINIMO);
  return { left: f.centro[0] - largura / 2, top: f.centro[1] - altura / 2, width: largura, height: altura };
}

type AreaDoLote = ReturnType<typeof areaDeToque>;

/** Botão transparente sobre um lote vizinho. Em componente próprio para levar o anel de foco de teclado. */
function LoteTocavel({ rotulo, area, azul, aoEscolher }: { rotulo: string; area: AreaDoLote; azul: string; aoEscolher: () => void }) {
  const foco = useFocoDeTeclado();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={aoEscolher}
      onFocus={foco.aoFocar}
      onBlur={foco.aoDesfocar}
      style={({ pressed }) => [
        {
          position: "absolute",
          ...area,
          borderRadius: RAIO.icone,
          backgroundColor: pressed ? comAlfa(azul, 0.14) : "transparent",
        },
        foco.estilo,
      ]}
    />
  );
}

/**
 * Mapa do prédio e dos lotes vizinhos num plano local. O selecionado em azul; os vizinhos tracejados e tocáveis.
 * O desenho em SVG é uma imagem só para o leitor de tela; cada lote vizinho tocável é um botão de verdade, por cima
 * do desenho, com o endereço no rótulo. Nada aqui esconde os botões do leitor de tela.
 */
export function MapaDoPredio({ selecionado, outros, aoEscolher }: Props) {
  const { cor } = useTema();
  const azul = cor("cor-azul-cadastral");
  const [largura, setLargura] = useState(LARGURA_ANTES_DA_MEDIDA);

  const cena = useMemo(
    () => montarCena(selecionado, outros, { largura, altura: ALTURA, reservaInferior: RESERVA_DA_LEGENDA }),
    [selecionado, outros, largura],
  );
  const porId = useMemo(() => new Map(outros.map((e) => [e.id, e])), [outros]);

  // Fundo do mapa (mapa-base, 18/11/2026): quadras, lotes e ruas sob o desenho do índice, no mesmo quadro, sem zoom.
  const nomeDoBairro = bairroPorSlug(selecionado.bairro)?.nome ?? null;
  const paraDesenho = useMemo(() => paraDesenhoDaCena(cena), [cena]);
  const caixa = useMemo(() => caixaDaCena(cena), [cena]);
  const obstaculos = useMemo((): [number, number, number, number][] => {
    const m = MARGEM_DOS_SELOS;
    const lista: [number, number, number, number][] = [
      [cena.largura - m - LARGURA_DO_CREDITO, m, cena.largura - m, m + ALTURA_DO_CREDITO],
      [12, cena.altura - 34, cena.largura - 12, cena.altura],
    ];
    if (nomeDoBairro) lista.push([m, m, m + Math.max(64, nomeDoBairro.length * 9 + 18), m + ALTURA_DO_SELO]);
    return lista;
  }, [cena.largura, cena.altura, nomeDoBairro]);
  const imovel = useMemo(
    () => ({ centro: selecionado.centro, codigoDoLogradouro: codigoDoLogradouro(selecionado.id) }),
    [selecionado.centro, selecionado.id],
  );
  const fundo = useFundoDoMapa({
    bairro: selecionado.bairro,
    imovel,
    quadro: { largura: cena.largura, altura: cena.altura, paraDesenho, obstaculos },
    caixa,
  });
  const comFundo = fundo.cena?.temDado ? fundo.cena : null;
  // Um destaque só para o prédio: com o fundo, o lote do imóvel do fundo (azul forte, o mesmo do topo do dossiê e da
  // gaveta) e o contorno do índice não é desenhado. Sem o lote no fundo, fica o contorno do índice, como antes.
  const loteDoFundoNoLugar = comFundo !== null && comFundo.camadas.loteDoImovel !== "";
  const cenaDoFundo = comFundo;

  const desenharForma = (f: Forma, escolhido: boolean) => {
    if (escolhido && loteDoFundoNoLugar) return null;
    const raio = raioSemPoligono(cena, escolhido);
    const traco = escolhido
      ? { stroke: azul, strokeWidth: 2.5 }
      : { stroke: azul, strokeOpacity: 0.55, strokeWidth: 1.3, strokeDasharray: "4 3" };
    const preenchimento = { fill: azul, fillOpacity: escolhido ? (cenaDoFundo ? 0.5 : 0.22) : cenaDoFundo ? 0.1 : 0.06 };
    return (
      <G key={f.id}>
        {f.pontos ? (
          <Polygon points={pontosDoSvg(f.pontos)} strokeLinejoin="round" {...preenchimento} {...traco} />
        ) : (
          <Circle cx={f.centro[0]} cy={f.centro[1]} r={raio} {...preenchimento} {...traco} />
        )}
        {escolhido ? null : (
          <TextoSvg
            x={f.centro[0]}
            y={f.centro[1] + 3}
            fill={azul}
            fillOpacity={0.8}
            fontFamily="JetBrainsMono"
            fontSize={9}
            fontWeight="600"
            textAnchor="middle"
          >
            {f.numero}
          </TextoSvg>
        )}
      </G>
    );
  };

  // O mais próximo por último, para ficar por cima quando as áreas de toque se encontram.
  const lotesTocaveis = [...cena.vizinhos].reverse().flatMap((f) => {
    const edificio = porId.get(f.id);
    return edificio ? [{ forma: f, edificio }] : [];
  });

  return (
    <View style={{ gap: 6 }}>
    <View
      onLayout={(e) => {
        const medida = Math.round(e.nativeEvent.layout.width);
        if (medida > 0 && medida !== largura) setLargura(medida);
      }}
      style={{
        position: "relative",
        height: ALTURA,
        borderRadius: 13,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: comAlfa(azul, 0.25),
        backgroundColor: cor("cor-azul-cadastral-suave"),
      }}
    >
      <View
        accessible
        role="img"
        accessibilityLabel={cenaDoFundo ? `${descreverFundoDoMapa(cenaDoFundo)} No mapa, ${INSTRUCAO}` : `Mapa cadastral: ${INSTRUCAO}`}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <Svg width={cena.largura} height={cena.altura} viewBox={`0 0 ${cena.largura} ${cena.altura}`}>
          {cenaDoFundo ? (
            <FundoDoMapa cena={cenaDoFundo} />
          ) : (
            <>
              <Defs>
                <Pattern id="grade-do-mapa" width={24} height={24} patternUnits="userSpaceOnUse">
                  <Path d="M 24 0 L 0 0 0 24" fill="none" stroke={azul} strokeOpacity={0.08} strokeWidth={1} />
                </Pattern>
              </Defs>
              <Rect width={cena.largura} height={cena.altura} fill="url(#grade-do-mapa)" />
            </>
          )}
          {cena.vizinhos.map((f) => desenharForma(f, false))}
          {desenharForma(cena.selecionado, true)}
          <G transform={`translate(${cena.pino[0]}, ${cena.pino[1]})`}>
            <Circle cx={0} cy={0} r={13} fill={cor("cor-acao")} fillOpacity={0.25} />
            <Circle cx={0} cy={0} r={7} fill={cor("cor-acao")} stroke={cor("cor-superficie")} strokeWidth={2} />
          </G>
        </Svg>
      </View>
      {cenaDoFundo ? (
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: MARGEM_DOS_SELOS, left: MARGEM_DOS_SELOS, right: MARGEM_DOS_SELOS, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}
        >
          {cenaDoFundo.selo ? <SeloDoBairro nome={cenaDoFundo.selo} /> : <View />}
          <CreditoDaBase />
        </View>
      ) : null}
      {lotesTocaveis.map(({ forma, edificio }) => (
        <LoteTocavel
          key={forma.id}
          rotulo={rotuloDoLoteVizinho(edificio)}
          area={areaDeToque(forma, raioSemPoligono(cena, false))}
          azul={azul}
          aoEscolher={() => aoEscolher(edificio)}
        />
      ))}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 8,
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 6,
          backgroundColor: comAlfa(cor("cor-superficie"), 0.92),
        }}
      >
        <Texto tipo="apoio" style={{ color: azul, fontSize: 10, lineHeight: 14, fontWeight: "600", textAlign: "center" }}>
          Toque nos lotes vizinhos se o pino não estiver sobre o prédio correto
        </Texto>
      </View>
    </View>
    <AvisoDoFundoDoMapa estado={fundo.estado} tentarDeNovo={fundo.tentarDeNovo} />
    </View>
  );
}
