import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Edificio } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { GradeArquitetonica } from "../GradeArquitetonica";
import { Icone } from "../Icone";
import { Pressionavel } from "../Pressionavel";
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
};

const LARGURA_DO_DESENHO = 300;
const ALTURA_DO_DESENHO = 100;

/**
 * `.ds-photo` de index.html (CSS 2693 a 2701): quadro 16:10 no lugar da foto, com o voltar, o marcador de salvo e
 * "Abrir mapa". O app não tem foto; o quadro mostra o contorno do lote sobre `.arch-grid-pattern`, ou só a grade.
 */
export function TopoDoDossie({ predio, salva, aoVoltar, aoAlternarSalvo, aoAbrirMapa }: Props) {
  const { cor } = useTema();
  const azul = cor("cor-azul-cadastral");
  const lote = useMemo(
    () => (predio ? caminhoDoLoteNaCaixa(predio, LARGURA_DO_DESENHO - 12, ALTURA_DO_DESENHO - 12, 6) : null),
    [predio],
  );
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
    <View style={{ aspectRatio: 16 / 10, backgroundColor: cor("cor-sutil"), overflow: "hidden" }}>
      <GradeArquitetonica />
      {lote ? (
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
