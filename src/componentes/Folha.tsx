import type { Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO, comAlfa } from "../tema/tokens";
import { BotaoIcone } from "./Botao";
import { Texto } from "./Texto";
import { voltarOu } from "./Tela";

type Props = { titulo: string; pai: Href; children: ReactNode; aoFechar?: () => void };

export function Folha({ titulo, pai, children, aoFechar }: Props) {
  const { cor } = useTema();
  const insets = useSafeAreaInsets();
  const [deslocamento] = useState(() => new Animated.Value(0));
  const fechar = useCallback(() => (aoFechar ? aoFechar() : voltarOu(pai)), [aoFechar, pai]);

  const arrasto = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesto) => gesto.dy > 4,
        onPanResponderMove: (_, gesto) => deslocamento.setValue(Math.max(0, gesto.dy)),
        onPanResponderRelease: (_, gesto) => {
          if (gesto.dy > 80) fechar();
          else Animated.spring(deslocamento, { toValue: 0, useNativeDriver: Platform.OS !== "web" }).start();
        },
      }),
    [deslocamento, fechar],
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [fechar]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        accessibilityLabel="Fechar"
        onPress={fechar}
        style={[StyleSheet.absoluteFill, { backgroundColor: comAlfa(cor("cor-texto"), 0.32) }]}
      />
      <Animated.View
        role="dialog"
        aria-modal
        accessibilityLabel={titulo}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "88%",
          backgroundColor: cor("cor-superficie"),
          borderTopLeftRadius: RAIO.cartao,
          borderTopRightRadius: RAIO.cartao,
          transform: [{ translateY: deslocamento }],
        }}
      >
        <View {...arrasto.panHandlers} style={{ alignItems: "center", paddingVertical: ESPACO[2] }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: cor("cor-traco") }} />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: ESPACO[2],
            minHeight: 48,
            marginBottom: ESPACO[2],
            paddingHorizontal: ESPACO[4],
          }}
        >
          <Texto tipo="barra" role="heading" style={{ flex: 1 }}>
            {titulo}
          </Texto>
          <BotaoIcone icone="x" acessivel="Fechar" onPress={fechar} />
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: ESPACO[4], paddingBottom: ESPACO[6] + insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
