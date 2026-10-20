import type { ReactNode } from "react";
import { View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, TOQUE_MINIMO, comAlfa, type TokenDeCor } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";

// Primitivas do dossiê (index.html, CSS 2643 a 2990). Tamanhos de texto em pixels como no protótipo; cores só pelos
// tokens do tema; números em JetBrains Mono com `tabular-nums` (já em TIPOS.numero e em `Numero`).

/** Seta de `dossierIcon('arrow')`: M5 12h14m-6-6 6 6-6 6. */
export function Seta({ tamanho = 13, cor = "cor-barro-texto" }: { tamanho?: number; cor?: TokenDeCor }) {
  const { cor: corDe } = useTema();
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={corDe(cor)} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <Path d="M5 12h14m-6-6 6 6-6 6" />
    </Svg>
  );
}

/** `.ds-eyebrow`: 10 px, 700, caixa alta, espaçamento de 0,09em, ferrugem de texto. */
export function Sobretitulo({ children }: { children: string }) {
  return (
    <Texto
      tipo="etiqueta"
      cor="cor-barro-texto"
      style={{ fontSize: 10, lineHeight: 14, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 7 }}
    >
      {children}
    </Texto>
  );
}

/** `.ds-panel h2`: Fraunces 500, 23 px. */
export function Titulo2({ children, estilo }: { children: ReactNode; estilo?: StyleProp<TextStyle> }) {
  return (
    <Texto tipo="titulo-tela" role="heading" style={[{ fontSize: 23, lineHeight: 28, fontWeight: "500", letterSpacing: -0.58, marginBottom: 12 }, estilo]}>
      {children}
    </Texto>
  );
}

/** `.ds-copy` dentro do painel: 14 px, entrelinha 1,5, cinza de apoio. */
export function Corpo({ children, estilo }: { children: ReactNode; estilo?: StyleProp<TextStyle> }) {
  return (
    <Texto tipo="corpo" cor="cor-texto-apoio" style={[{ fontSize: 14, lineHeight: 21 }, estilo]}>
      {children}
    </Texto>
  );
}

/** `.ds-map-note`: nota de rodapé de 11 px. */
export function Nota({ children, estilo }: { children: ReactNode; estilo?: StyleProp<TextStyle> }) {
  return (
    <Texto tipo="apoio" cor="cor-texto-apoio" style={[{ fontSize: 11, lineHeight: 17 }, estilo]}>
      {children}
    </Texto>
  );
}

type PropsDoNumero = {
  children: string;
  tamanho: number;
  peso?: TextStyle["fontWeight"];
  cor?: TokenDeCor;
  estilo?: StyleProp<TextStyle>;
};

/** Número em JetBrains Mono com `tabular-nums` (preços, medidas, ano, contagens). */
export function Numero({ children, tamanho, peso = "600", cor = "cor-texto", estilo }: PropsDoNumero) {
  return (
    <Texto tipo="numero" cor={cor} style={[{ fontSize: tamanho, lineHeight: Math.round(tamanho * 1.2), fontWeight: peso }, estilo]}>
      {children}
    </Texto>
  );
}

type PropsDoNumeroEditorial = {
  children: string;
  tamanho: number;
  cor?: TokenDeCor;
  /** Espaçamento entre letras em em: `.ds-finding-measure strong` usa -0,035; `.ds-check-count strong` não usa. */
  apertado?: number;
  estilo?: StyleProp<TextStyle>;
  acessivel?: string;
};

/**
 * Número em destaque editorial (`.ds-finding-measure strong` e `.ds-check-count strong`, index.html 2774 e 2918): Fraunces
 * 500, a mesma fonte dos títulos. Preços, valores de tabela e a chave cadastral seguem em JetBrains Mono (`Numero`).
 */
export function NumeroEditorial({ children, tamanho, cor = "cor-texto", apertado = 0, estilo, acessivel }: PropsDoNumeroEditorial) {
  return (
    <Texto
      tipo="titulo-tela"
      cor={cor}
      accessibilityLabel={acessivel}
      style={[{ fontSize: tamanho, lineHeight: Math.round(tamanho * 1.1), fontWeight: "500", letterSpacing: apertado * tamanho }, estilo]}
    >
      {children}
    </Texto>
  );
}

type PropsDoLink = {
  rotulo: string;
  onPress: () => void;
  /** `true`: cinza de apoio, como `.ds-link-muted`. */
  discreto?: boolean;
  seta?: boolean;
  acessivel?: string;
  estilo?: StyleProp<ViewStyle>;
};

/** `.ds-link`: 12 px, peso 600, ferrugem; área de toque de 44 px. */
export function LinkComSeta({ rotulo, onPress, discreto = false, seta = true, acessivel, estilo }: PropsDoLink) {
  const cor: TokenDeCor = discreto ? "cor-texto-apoio" : "cor-barro-texto";
  return (
    <Pressionavel
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={acessivel ?? rotulo}
      style={[{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 10, borderRadius: RAIO.quadrado }, estilo]}
    >
      <Texto tipo="apoio" cor={cor} style={{ fontSize: 12, lineHeight: 16, fontWeight: "600" }}>
        {rotulo}
      </Texto>
      {seta ? <Seta cor={cor} /> : null}
    </Pressionavel>
  );
}

/** Linha tocável com seta à direita (`.ds-check-list > button`, `.ds-support-action`, `.ds-check-entry`). */
export function LinhaTocavel({
  children,
  onPress,
  acessivel,
  minimo = TOQUE_MINIMO,
  estilo,
}: {
  children: ReactNode;
  onPress: () => void;
  acessivel: string;
  minimo?: number;
  estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressionavel
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      style={[{ minHeight: minimo, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }, estilo]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      <Seta tamanho={17} />
    </Pressionavel>
  );
}

/** Divisor de 1 px, `--ds-line` (#E9E1D4): o token de linha do app. */
export function Divisor({ estilo }: { estilo?: StyleProp<ViewStyle> }) {
  const { cor } = useTema();
  return <View style={[{ height: 1, backgroundColor: cor("cor-linha") }, estilo]} />;
}

/** `.ds-section`: respiro vertical de 20 px; a primeira não tem respiro em cima e a última, embaixo (index.html 2751 a 2753). */
export function Secao({
  children,
  aoMedir,
  semTopo = false,
  semBase = false,
}: {
  children: ReactNode;
  aoMedir?: (y: number) => void;
  semTopo?: boolean;
  semBase?: boolean;
}) {
  return (
    <View
      style={{ paddingTop: semTopo ? 0 : ESPACO[5], paddingBottom: semBase ? 0 : ESPACO[5] }}
      onLayout={aoMedir ? (e) => aoMedir(e.nativeEvent.layout.y) : undefined}
    >
      {children}
    </View>
  );
}

/** Cartão creme com borda à esquerda laranja (`.ds-primary-finding`) ou simples (`.ds-note`). */
export function CaixaCreme({ children, laranja = false, estilo }: { children: ReactNode; laranja?: boolean; estilo?: StyleProp<ViewStyle> }) {
  const { cor } = useTema();
  return (
    <View
      style={[
        {
          padding: ESPACO[4],
          borderRadius: 11,
          backgroundColor: cor("cor-papel-claro"),
          borderLeftWidth: laranja ? 3 : 0,
          borderLeftColor: cor("cor-acao"),
          borderWidth: laranja ? 0 : 1,
          borderColor: comAlfa(cor("cor-texto"), 0.06),
          gap: ESPACO[2],
        },
        estilo,
      ]}
    >
      {children}
    </View>
  );
}
