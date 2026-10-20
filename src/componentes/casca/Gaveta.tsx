import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, comAlfa } from "../../tema/tokens";
import { BotaoIcone } from "../Botao";
import { Texto } from "../Texto";

type Props = {
  visivel: boolean;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  aoFechar: () => void;
};

export function Gaveta({ visivel, titulo, subtitulo, children, aoFechar }: Props) {
  const { cor } = useTema();
  const insets = useSafeAreaInsets();
  const [deslocamento] = useState(() => new Animated.Value(0));

  const fechar = useCallback(() => {
    aoFechar();
  }, [aoFechar]);

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
    [deslocamento, fechar]
  );

  useEffect(() => {
    if (!visivel || Platform.OS !== "web") return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [visivel, fechar]);

  if (!visivel) return null;

  return (
    <View style={styles.conteinerAbsoluto}>
      <Pressable
        accessibilityLabel="Fechar gaveta"
        onPress={fechar}
        style={[styles.fundoBackdrop, { backgroundColor: comAlfa(cor("cor-campo"), 0.45) }]}
      />
      <Animated.View
        role="dialog"
        aria-modal
        accessibilityLabel={titulo}
        style={[
          styles.painelGaveta,
          {
            backgroundColor: cor("cor-superficie"),
            borderTopLeftRadius: RAIO.cartao,
            borderTopRightRadius: RAIO.cartao,
            borderTopColor: comAlfa(cor("cor-texto"), 0.08),
            boxShadow: `0 -4px 16px ${comAlfa(cor("cor-campo"), 0.16)}`,
            transform: [{ translateY: deslocamento }],
          },
        ]}
      >
        {/* Puxador da gaveta (.sheet-handle) */}
        <View {...arrasto.panHandlers} style={styles.areaPuxador}>
          <View style={[styles.puxador, { backgroundColor: cor("cor-linha-forte") }]} />
        </View>

        {/* Cabeçalho da Gaveta */}
        <View style={[styles.cabecalho, { borderBottomColor: comAlfa(cor("cor-texto"), 0.06) }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto tipo="secao" role="heading" style={styles.titulo}>
              {titulo}
            </Texto>
            {subtitulo ? (
              <Texto tipo="apoio" cor="cor-texto-apoio">
                {subtitulo}
              </Texto>
            ) : null}
          </View>
          <BotaoIcone icone="x" acessivel="Fechar" onPress={fechar} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: ESPACO[4],
            paddingBottom: ESPACO[6] + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteinerAbsoluto: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
  fundoBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  painelGaveta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "90%",
    maxWidth: 640,
    alignSelf: "center",
    width: "100%",
    borderTopWidth: 1,
    elevation: 16,
  },
  areaPuxador: {
    alignItems: "center",
    paddingTop: ESPACO[2] + 2,
    paddingBottom: ESPACO[2],
  },
  puxador: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ESPACO[4],
    paddingBottom: ESPACO[3],
    borderBottomWidth: 1,
  },
  titulo: {
    fontSize: 17,
    fontWeight: "600",
  },
});
