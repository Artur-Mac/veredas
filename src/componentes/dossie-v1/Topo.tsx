import { useMemo, useState } from "react";
import { Image, Modal, ScrollView, View } from "react-native";
import { FotoRemota } from "../FotoRemota";
import Svg, { Circle, Path, Polygon } from "react-native-svg";
import type { Edificio } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { GradeArquitetonica } from "../GradeArquitetonica";
import { Icone } from "../Icone";
import { CreditoDaBase, FundoDoMapa } from "../mapa/FundoDoMapa";
import { descreverFundoDoMapa } from "../mapa/fundoDoMapaCena";
import { useFundoDoMapa } from "../mapa/useFundoDoMapa";
import { Pressionavel } from "../Pressionavel";
import { pontosDoSvg, projetorLocal } from "../predio/projecao";
import { Texto } from "../Texto";
import { caminhoDoLoteNaCaixa } from "./mapa";

type Props = {
  /** Edifício confirmado, de onde vem o contorno do lote. Sem ele, o quadro mostra só a grade. */
  predio: Edificio | null;
  salva: boolean;
  aoVoltar: () => void;
  aoAlternarSalvo: () => void;
  /** `null` quando não há lote para mostrar: o botão "Abrir mapa" não aparece. */
  aoAbrirMapa: (() => void) | null;
  /** 15/11/2026: fotos do anúncio (mostradas sem guardar cópia). Com elas, o quadro é a galeria; o lote fica no mapa. */
  fotos?: readonly string[];
};

const LARGURA_DO_DESENHO = 300;
const ALTURA_DO_DESENHO = 100;
/** Largura, em metros, do mapa parado do topo (mapa-base, 18/11/2026): o quarteirão do prédio e os vizinhos. */
const METROS_NA_LARGURA = 220;
const METROS_POR_GRAU = (Math.PI / 180) * 6371008.8;
const CAIXA_VAZIA = [0, 0, 0, 0] as const;

/** Quadro do mapa do topo: [lon, lat] → px, com o prédio no centro, norte para cima, `METROS_NA_LARGURA` de largura. */
function quadroDoTopo(centro: readonly [number, number], largura: number, altura: number) {
  const porMetro = largura / METROS_NA_LARGURA;
  const projetar = projetorLocal(centro);
  const paraDesenho = (p: readonly [number, number]): [number, number] => {
    const [x, y] = projetar(p);
    return [largura / 2 + x * porMetro, altura / 2 + y * porMetro];
  };
  const cos = Math.cos((centro[1] * Math.PI) / 180);
  const meiaL = METROS_NA_LARGURA / 2;
  const meiaA = altura / porMetro / 2;
  const caixa = [centro[0] - meiaL / (METROS_POR_GRAU * cos), centro[1] - meiaA / METROS_POR_GRAU, centro[0] + meiaL / (METROS_POR_GRAU * cos), centro[1] + meiaA / METROS_POR_GRAU] as const;
  return { paraDesenho, caixa };
}

/**
 * `.ds-photo` de index.html (CSS 2693 a 2701): quadro 16:10 no lugar da foto, com o voltar, o marcador de salvo e
 * "Abrir mapa". Com fotos, tocar abre a foto sozinha em tela cheia.
 */
export function TopoDoDossie({ predio, salva, aoVoltar, aoAlternarSalvo, aoAbrirMapa, fotos = [] }: Props) {
  const { cor } = useTema();
  const [largura, setLargura] = useState(0);
  const [atual, setAtual] = useState(0);
  const [fotoAmpliada, setFotoAmpliada] = useState<number | null>(null);
  const azul = cor("cor-azul-cadastral");
  const lote = useMemo(
    () => (predio ? caminhoDoLoteNaCaixa(predio, LARGURA_DO_DESENHO - 12, ALTURA_DO_DESENHO - 12, 6) : null),
    [predio],
  );

  // Sem fotos, o quadro vira um mapa pequeno e parado em volta do prédio, com o fundo do mapa-base. Enquanto o fundo não
  // chega (ou se não há cobertura), fica como antes: o contorno solto sobre a grade.
  const altura = Math.round((largura * 10) / 16);
  const querFundo = predio !== null && fotos.length === 0 && largura > 0;
  const quadro = useMemo(
    () => (predio && largura > 0 ? quadroDoTopo(predio.centro, largura, altura) : null),
    [predio, largura, altura],
  );
  const semConta = useMemo(() => (p: readonly [number, number]): [number, number] => [p[0], p[1]], []);
  const obstaculos = useMemo(
    (): [number, number, number, number][] => [
      [8, 8, 60, 60],
      [largura - 60, 8, largura - 8, 60],
      [largura - 136, altura - 60, largura - 8, altura - 8],
      [8, altura - 26, 180, altura - 4],
    ],
    [largura, altura],
  );
  const imovel = useMemo(() => {
    if (!predio) return null;
    const codigo = Number(predio.id.split("-")[0]);
    return { centro: predio.centro, codigoDoLogradouro: Number.isInteger(codigo) ? codigo : null };
  }, [predio]);
  const fundo = useFundoDoMapa({
    bairro: predio?.bairro ?? null,
    imovel,
    quadro: { largura, altura, paraDesenho: quadro?.paraDesenho ?? semConta, obstaculos },
    caixa: quadro?.caixa ?? CAIXA_VAZIA,
    ativo: querFundo,
  });
  const mapa = querFundo && fundo.cena?.temDado && quadro ? fundo.cena : null;
  const contornoDoIndice = useMemo(
    () => (mapa && !mapa.camadas.loteDoImovel && predio?.poligono && quadro ? pontosDoSvg(predio.poligono.map(quadro.paraDesenho)) : null),
    [mapa, predio, quadro],
  );
  const pino = predio && quadro ? quadro.paraDesenho(predio.centro) : null;

  const botao = {
    position: "absolute" as const,
    top: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: comAlfa(cor("cor-superficie"), 0.96),
    borderWidth: 1,
    borderColor: comAlfa(cor("cor-texto"), 0.08),
  };
  return (
    <View style={{ aspectRatio: 16 / 10, backgroundColor: cor("cor-sutil"), overflow: "hidden" }} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      {fotos.length && largura > 0 ? (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / largura))}
            onScroll={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / largura))}
            scrollEventThrottle={64}
            accessibilityLabel={`Fotos do anúncio, ${fotos.length}`}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {fotos.map((f, i) => (
              <Pressionavel
                key={f}
                onPress={() => setFotoAmpliada(i)}
                accessibilityRole="button"
                accessibilityLabel={`Ampliar foto ${i + 1} de ${fotos.length}`}
                style={{ width: largura, height: "100%" }}
              >
                <FotoRemota uri={f} rotulo={`Foto ${i + 1} de ${fotos.length} do anúncio`} estilo={{ width: largura, height: "100%", backgroundColor: cor("cor-creme") }} />
              </Pressionavel>
            ))}
          </ScrollView>
          <Pressionavel
            onPress={() => setFotoAmpliada(Math.min(atual, fotos.length - 1))}
            accessibilityRole="button"
            accessibilityLabel={`Ver foto ${Math.min(atual + 1, fotos.length)} de ${fotos.length} em tela cheia`}
            style={{ position: "absolute", left: 12, bottom: 12, minHeight: 36, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: comAlfa(cor("cor-superficie"), 0.94) }}
          >
            <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 16, fontWeight: "600" }}>{`${Math.min(atual + 1, fotos.length)}/${fotos.length} · tocar para ampliar`}</Texto>
          </Pressionavel>
          <Modal
            visible={fotoAmpliada !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setFotoAmpliada(null)}
          >
            <View style={{ flex: 1, backgroundColor: "rgba(17, 17, 16, 0.96)", justifyContent: "center", alignItems: "center" }}>
              {fotoAmpliada !== null && fotos[fotoAmpliada] ? (
                <Image
                  source={{ uri: fotos[fotoAmpliada] }}
                  accessibilityLabel={`Foto ${fotoAmpliada + 1} de ${fotos.length} em tela cheia`}
                  resizeMode="contain"
                  style={{ width: "100%", height: "86%" }}
                />
              ) : null}
              <Pressionavel
                onPress={() => setFotoAmpliada(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar foto"
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(255,255,255,0.16)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Texto style={{ color: "#FFFFFF", fontSize: 20, lineHeight: 24, fontWeight: "600" }}>✕</Texto>
              </Pressionavel>
              {fotos.length > 1 && fotoAmpliada !== null ? (
                <View style={{ position: "absolute", bottom: 24, flexDirection: "row", alignItems: "center", gap: 18 }}>
                  <Pressionavel
                    onPress={() => setFotoAmpliada((p) => (p === null ? 0 : (p - 1 + fotos.length) % fotos.length))}
                    accessibilityRole="button"
                    accessibilityLabel="Foto anterior"
                    style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}
                  >
                    <Texto style={{ color: "#FFFFFF", fontSize: 20, lineHeight: 24 }}>‹</Texto>
                  </Pressionavel>
                  <Texto style={{ color: "#FFFFFF", fontFamily: "JetBrainsMono", fontSize: 13, fontWeight: "600" }}>
                    {`${fotoAmpliada + 1} / ${fotos.length}`}
                  </Texto>
                  <Pressionavel
                    onPress={() => setFotoAmpliada((p) => (p === null ? 0 : (p + 1) % fotos.length))}
                    accessibilityRole="button"
                    accessibilityLabel="Próxima foto"
                    style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}
                  >
                    <Texto style={{ color: "#FFFFFF", fontSize: 20, lineHeight: 24 }}>›</Texto>
                  </Pressionavel>
                </View>
              ) : null}
            </View>
          </Modal>
        </>
      ) : mapa ? null : <GradeArquitetonica />}
      {mapa && pino ? (
        <>
          <View
            accessible
            role="img"
            accessibilityLabel={`${descreverFundoDoMapa(mapa)} O lote do prédio em azul, com o pino laranja.`}
            pointerEvents="none"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <Svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`}>
              <FundoDoMapa cena={mapa} />
              {contornoDoIndice ? (
                <Polygon points={contornoDoIndice} fill={azul} fillOpacity={0.3} stroke={azul} strokeWidth={1.5} strokeLinejoin="round" />
              ) : null}
              <Circle cx={pino[0]} cy={pino[1]} r={11} fill={cor("cor-acao")} fillOpacity={0.25} />
              <Circle cx={pino[0]} cy={pino[1]} r={6} fill={cor("cor-acao")} stroke={cor("cor-superficie")} strokeWidth={2} />
            </Svg>
          </View>
          <CreditoDaBase style={{ position: "absolute", left: 12, bottom: 12 }} />
        </>
      ) : null}
      {lote && !fotos.length && !mapa ? (
        <View
          accessible
          role="img"
          accessibilityLabel="Contorno do lote do prédio, a partir do cadastro da Prefeitura"
          pointerEvents="none"
          style={{ position: "absolute", top: 64, bottom: 64, left: 24, right: 24 }}
        >
          <Svg width="100%" height="100%" viewBox={`0 0 ${LARGURA_DO_DESENHO} ${ALTURA_DO_DESENHO}`}>
            <Path d={lote} fill={azul} fillOpacity={0.18} stroke={azul} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </Svg>
        </View>
      ) : null}

      <Pressionavel
        onPress={aoVoltar}
        accessibilityRole="button"
        accessibilityLabel="Voltar aos imóveis"
        style={{ ...botao, left: 12 }}
      >
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={cor("cor-texto")} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <Path d="M19 12H5m6-6-6 6 6 6" />
        </Svg>
      </Pressionavel>

      <Pressionavel
        onPress={aoAlternarSalvo}
        accessibilityRole="button"
        accessibilityLabel={salva ? "Remover dos salvos" : "Salvar imóvel"}
        accessibilityState={{ selected: salva }}
        aria-pressed={salva}
        style={{ ...botao, right: 12 }}
      >
        <Svg
          width={19}
          height={19}
          viewBox="0 0 24 24"
          fill={salva ? cor("cor-acao") : "none"}
          stroke={salva ? cor("cor-acao") : cor("cor-texto")}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </Svg>
      </Pressionavel>

      {aoAbrirMapa ? (
        <Pressionavel
          onPress={aoAbrirMapa}
          accessibilityRole="button"
          accessibilityLabel="Abrir mapa do lote e das obras próximas"
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            borderRadius: 24,
            backgroundColor: comAlfa(cor("cor-superficie"), 0.95),
            borderWidth: 1,
            borderColor: comAlfa(cor("cor-texto"), 0.1),
          }}
        >
          <Icone nome="map" tamanho="p" />
          <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 16, fontWeight: "600" }}>
            Abrir mapa
          </Texto>
        </Pressionavel>
      ) : null}
    </View>
  );
}
