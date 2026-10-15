import type { Stack } from "expo-router";
import type { ComponentProps } from "react";
import { Platform } from "react-native";

type OpcoesDaTela = Exclude<ComponentProps<typeof Stack.Screen>["options"], ((...args: never[]) => unknown) | undefined>;

export const OPCOES_DA_FOLHA: OpcoesDaTela = {
  presentation: "transparentModal",
  animation: Platform.OS === "web" ? "none" : "fade",
  contentStyle: { backgroundColor: "transparent" },
  headerShown: false,
};
