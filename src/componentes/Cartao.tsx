import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO, type TokenDeCor } from "../tema/tokens";
import { Icone } from "./Icone";
import type { NomeIcone } from "./icones";

type Props = { children: ReactNode; nota?: boolean; style?: StyleProp<ViewStyle> };

export function Cartao({ children, nota = false, style }: Props) {
  const { cor } = useTema();
  return (
    <View
      style={[
        {
          backgroundColor: cor(nota ? "cor-nota" : "cor-superficie"),
          borderRadius: RAIO.cartao,
          marginHorizontal: ESPACO[3],
          marginBottom: ESPACO[2],
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CorpoDoCartao({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ padding: ESPACO[4], gap: ESPACO[3] }, style]}>{children}</View>;
}

export function Pilha({ children, gap = ESPACO[3], style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

export function Linha({ children, gap = ESPACO[2], style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function Divisor() {
  const { cor } = useTema();
  return <View style={{ height: 0.5, backgroundColor: cor("cor-linha") }} />;
}

type PropsDoIcone = { nome: NomeIcone; pequeno?: boolean; cor?: TokenDeCor };

export function IconeDeSecao({ nome, pequeno = false, cor: corDoIcone }: PropsDoIcone) {
  const { cor } = useTema();
  const lado = pequeno ? 32 : 36;
  return (
    <View
      style={{
        width: lado,
        height: lado,
        borderRadius: RAIO.icone,
        backgroundColor: cor("cor-fundo"),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icone nome={nome} tamanho={pequeno ? "p" : "m"} cor={corDoIcone} />
    </View>
  );
}
