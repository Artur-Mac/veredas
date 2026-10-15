import { router, type Href } from "expo-router";
import type { ReactNode, Ref } from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../tema/Tema";
import { ESPACO } from "../tema/tokens";
import { BotaoIcone } from "./Botao";
import { EtiquetaFase } from "./Etiquetas";
import { Texto } from "./Texto";

export function voltarOu(pai: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(pai);
}

export function Tela({ children, comAbas = false }: { children: ReactNode; comAbas?: boolean }) {
  const { cor } = useTema();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: cor("cor-fundo"),
        paddingTop: insets.top,
        paddingBottom: comAbas ? 0 : insets.bottom,
      }}
    >
      {children}
    </View>
  );
}

type PropsDoCabecalho = {
  titulo?: string;
  pai?: Href;
  fase?: "prototipo" | "final";
  esquerda?: ReactNode;
  direita?: ReactNode;
};

export function Cabecalho({ titulo, pai, fase = "prototipo", esquerda, direita }: PropsDoCabecalho) {
  const { cor } = useTema();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: ESPACO[1],
        minHeight: 56,
        paddingLeft: ESPACO[1],
        paddingRight: ESPACO[2],
        backgroundColor: cor("cor-fundo"),
      }}
    >
      {pai ? <BotaoIcone icone="chevron-left" acessivel="Voltar" onPress={() => voltarOu(pai)} /> : null}
      {esquerda}
      {titulo ? (
        <Texto
          tipo="barra"
          role="heading"
          numberOfLines={1}
          style={{ flex: 1, paddingLeft: pai ? ESPACO[1] : ESPACO[3] }}
        >
          {titulo}
        </Texto>
      ) : null}
      {direita}
      <EtiquetaFase fase={fase} />
    </View>
  );
}

type PropsDaRolagem = {
  children: ReactNode;
  semRespiro?: boolean;
  respiroInferior?: number;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ScrollView>;
};

export function Rolagem({ children, semRespiro = false, respiroInferior = 0, style, ref }: PropsDaRolagem) {
  return (
    <ScrollView
      ref={ref}
      style={[{ flex: 1 }, style]}
      contentContainerStyle={{ paddingBottom: (semRespiro ? 0 : ESPACO[6]) + respiroInferior }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function AreaDeBotoes({ children }: { children: ReactNode }) {
  return <View style={{ paddingTop: ESPACO[2], paddingHorizontal: ESPACO[3], gap: ESPACO[2] }}>{children}</View>;
}

export function TituloDeGrupo({ children, direita }: { children: string; direita?: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: ESPACO[2],
        paddingTop: ESPACO[5],
        paddingHorizontal: ESPACO[4],
        paddingBottom: ESPACO[2],
      }}
    >
      <Texto tipo="secao" role="heading" style={{ flex: 1 }}>
        {children}
      </Texto>
      {direita}
    </View>
  );
}
