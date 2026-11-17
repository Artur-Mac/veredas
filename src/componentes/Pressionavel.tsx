import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useFocoDeTeclado } from "./casca/foco";
import { useTema } from "../tema/Tema";
import { comAlfa } from "../tema/tokens";

type Props = Omit<PressableProps, "style" | "children"> & { style?: StyleProp<ViewStyle>; children: ReactNode };

/**
 * Toque do app: sombra de 8% ao pressionar e, na web, anel de 2 px em azul cadastral quando o foco vem do teclado
 * (ver `casca/foco.ts`). O anel fica por fora (`outlineOffset`), então o `overflow: hidden` do próprio controle não o corta.
 */
export function Pressionavel({ style, children, onFocus, onBlur, ...resto }: Props) {
  const { cor } = useTema();
  const foco = useFocoDeTeclado();
  return (
    <Pressable
      style={[{ overflow: "hidden" }, style, foco.estilo]}
      onFocus={(evento) => {
        foco.aoFocar(evento);
        onFocus?.(evento);
      }}
      onBlur={(evento) => {
        foco.aoDesfocar();
        onBlur?.(evento);
      }}
      {...resto}
    >
      {({ pressed }) => (
        <>
          {children}
          {pressed ? (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: comAlfa(cor("cor-texto"), 0.08) }]}
            />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

type PropsDoAlvo = PressableProps;

/**
 * `Pressable` cru com o anel de foco de teclado, para quando o desenho (pílula, botão redondo, caixa de marcar) é menor
 * que a área de toque e a sombra de `Pressionavel` cobriria também a parte vazia. O `children` e o `style` podem ser função
 * de `{ pressed }`, como no `Pressable`. O anel acompanha a área de toque, não o desenho de dentro.
 */
export function AlvoDeToque({ style, onFocus, onBlur, ...resto }: PropsDoAlvo) {
  const foco = useFocoDeTeclado();
  return (
    <Pressable
      style={typeof style === "function" ? (estado) => [style(estado), foco.estilo] : [style, foco.estilo]}
      onFocus={(evento) => {
        foco.aoFocar(evento);
        onFocus?.(evento);
      }}
      onBlur={(evento) => {
        foco.aoDesfocar();
        onBlur?.(evento);
      }}
      {...resto}
    />
  );
}
