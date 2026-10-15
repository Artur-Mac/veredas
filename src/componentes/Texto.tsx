import { Text, type TextProps } from "react-native";
import { useTema } from "../tema/Tema";
import { TIPOS, type TokenDeCor, type Tipo } from "../tema/tokens";

type Props = TextProps & { tipo?: Tipo; cor?: TokenDeCor };

export function Texto({ tipo = "corpo", cor = "cor-texto", style, ...resto }: Props) {
  const { cor: corDe } = useTema();
  return (
    <Text
      maxFontSizeMultiplier={tipo === "numero" ? 1.3 : undefined}
      style={[TIPOS[tipo], { color: corDe(cor) }, style]}
      {...resto}
    />
  );
}
