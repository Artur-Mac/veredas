import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { LARGURA_DA_GAVETA } from "./Coluna";
import { useFocoDaGaveta } from "./focoDaGaveta";
import { useMovimentoReduzidoRef } from "./movimento";

/**
 * Espaço entre a divisória do cabeçalho e o primeiro título do conteúdo, nas gavetas de rota que desenham o próprio corpo
 * (Créditos, Sobre os dados): o mesmo respiro das outras gavetas do app, que ficam entre 12 e 14 px.
 */
export const RESPIRO_NO_TOPO_DA_GAVETA = 13;

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
  const movimentoReduzido = useMovimentoReduzidoRef();
  const painel = useRef<View>(null);

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
          // Com movimento reduzido a gaveta volta ao lugar de uma vez, sem a mola.
          else if (movimentoReduzido.current) deslocamento.setValue(0);
          else Animated.spring(deslocamento, { toValue: 0, useNativeDriver: Platform.OS !== "web" }).start();
        },
      }),
    [deslocamento, fechar, movimentoReduzido]
  );

  useEffect(() => {
    if (!visivel || Platform.OS !== "web") return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [visivel, fechar]);

  // Na web: o foco entra na gaveta ao abrir, o Tab gira dentro dela e o foco volta a quem a abriu ao fechar.
  useFocoDaGaveta(visivel, painel);

  if (!visivel) return null;

  return (
    <View style={styles.conteinerAbsoluto}>
      {/* O fundo fecha por toque; teclado fecha com Esc ou com o botão "Fechar", então ele fica fora da ordem de Tab. */}
      <Pressable
        accessibilityLabel="Fechar gaveta"
        tabIndex={-1}
        onPress={fechar}
        style={[styles.fundoBackdrop, { backgroundColor: comAlfa(cor("cor-campo"), 0.45) }]}
      />
      <Animated.View
        ref={painel}
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
  // O painel é filho em fluxo, encostado no pé e centralizado: no desktop a gaveta tem `LARGURA_DA_GAVETA` no meio da tela.
  conteinerAbsoluto: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  fundoBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  // `outlineWidth: 0`: o painel e o título recebem o foco por programa ao abrir; o anel fica para os controles.
  painelGaveta: {
    outlineWidth: 0,
    maxHeight: "90%",
    maxWidth: LARGURA_DA_GAVETA,
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
    outlineWidth: 0,
  },
});
