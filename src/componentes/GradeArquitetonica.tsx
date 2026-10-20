import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

// `.arch-grid-pattern` de index.html (linha 81): linhas de 1 px em rgba(127, 136, 112, 0.11) a cada 24 px,
// uma vertical e uma horizontal por célula, a partir do canto superior esquerdo.
const PASSO = 24;
const COR_DA_LINHA = "rgba(127, 136, 112, 0.11)";

/** Preenche o contêiner pai (posição absoluta). Não captura toque. */
export function GradeArquitetonica() {
  const id = `grade-arquitetonica-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" aria-hidden>
        <Defs>
          <Pattern id={id} width={PASSO} height={PASSO} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={1} height={PASSO} fill={COR_DA_LINHA} />
            <Rect x={0} y={0} width={PASSO} height={1} fill={COR_DA_LINHA} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
