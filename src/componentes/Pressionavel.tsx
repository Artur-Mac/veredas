import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useTema } from "../tema/Tema";
import { comAlfa } from "../tema/tokens";

type Props = Omit<PressableProps, "style" | "children"> & { style?: StyleProp<ViewStyle>; children: ReactNode };

export function Pressionavel({ style, children, ...resto }: Props) {
  const { cor } = useTema();
  return (
    <Pressable style={[{ overflow: "hidden" }, style]} {...resto}>
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
