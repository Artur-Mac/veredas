import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO, TOQUE_MINIMO, type Tipo, type TokenDeCor } from "../tema/tokens";
import { Icone } from "./Icone";
import type { NomeIcone } from "./icones";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

type Variante = "principal" | "secundario" | "texto";

type Props = {
  rotulo: string;
  onPress?: () => void;
  variante?: Variante;
  icone?: NomeIcone;
  tamanhoIcone?: "p" | "m";
  /** Seta depois do rótulo, como em "Gerar Dossiê" (`.btn-scanner-primary` de index.html). */
  seta?: boolean;
  pilula?: boolean;
  desativado?: boolean;
  acessivel?: string;
  expandido?: boolean;
  style?: StyleProp<ViewStyle>;
};

// `.btn-scanner-primary` de index.html (linhas 1544-1575): raio 12, padding 13,5 × 18, peso 600, 14 px com 0,01em de
// espaçamento, sombra laranja. Única adaptação: texto #171717 (cor-sobre-acao) em vez de branco, porque branco sobre
// #F47745 tem contraste 2,77 e a tinta tem 6,46.
const PRINCIPAL: ViewStyle = {
  gap: 8,
  paddingVertical: 13.5,
  paddingHorizontal: 18,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(244, 119, 69, 0.32)",
};

const TEXTO_PRINCIPAL: TextStyle = { fontSize: 14, lineHeight: 20, fontWeight: "600", letterSpacing: 0.14 };

export function Botao({
  rotulo,
  onPress,
  variante = "secundario",
  icone,
  tamanhoIcone = "m",
  seta = false,
  pilula = false,
  desativado = false,
  acessivel,
  expandido,
  style,
}: Props) {
  const { cor } = useTema();
  const corDoTexto: TokenDeCor = variante === "principal" ? "cor-sobre-acao" : "cor-texto";
  const tipo: Tipo = variante === "texto" ? "corpo" : "botao";
  const fundo: ViewStyle =
    variante === "principal"
      ? { backgroundColor: cor("cor-acao") }
      : variante === "secundario"
        ? { backgroundColor: cor("cor-superficie"), borderWidth: 1, borderColor: cor("cor-linha") }
        : {};
  const largura: ViewStyle = variante === "texto" || pilula ? { alignSelf: "flex-start" } : { alignSelf: "stretch" };
  const principal = variante === "principal";
  return (
    <Pressionavel
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      accessibilityState={{ disabled: desativado, expanded: expandido }}
      aria-disabled={desativado}
      aria-expanded={expandido}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: ESPACO[2],
          minHeight: TOQUE_MINIMO,
          paddingHorizontal: variante === "texto" ? ESPACO[2] : ESPACO[4],
          borderRadius: pilula ? RAIO.pilula : RAIO.cartao,
          opacity: desativado ? 0.5 : 1,
        },
        principal ? PRINCIPAL : null,
        principal && pilula ? { borderRadius: RAIO.pilula } : null,
        fundo,
        largura,
        style,
      ]}
    >
      {icone ? <Icone nome={icone} tamanho={tamanhoIcone} cor={corDoTexto} /> : null}
      <Texto
        tipo={tipo}
        cor={corDoTexto}
        style={variante === "texto" ? { textDecorationLine: "underline" } : principal ? TEXTO_PRINCIPAL : undefined}
      >
        {rotulo}
      </Texto>
      {seta ? (
        <Svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke={cor(corDoTexto)}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <Path d="M5 12h14" />
          <Path d="m12 5 7 7-7 7" />
        </Svg>
      ) : null}
    </Pressionavel>
  );
}

/** Menor área de toque aceita: 44 × 44 px (o padrão do app é `TOQUE_MINIMO`). */
const TOQUE_ABSOLUTO = 44;

type PropsDoLink = {
  rotulo: string;
  onPress: () => void;
  tipo?: "corpo" | "apoio";
  /** Altura da área de toque. Valores abaixo de 44 sobem para 44: a web ignora `hitSlop`, então a área desenhada é a que vale. */
  altura?: number;
  acessivel?: string;
};

export function LinkDeLinha({ rotulo, onPress, tipo = "corpo", altura = TOQUE_MINIMO, acessivel }: PropsDoLink) {
  return (
    <Pressionavel
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={acessivel}
      style={{
        minHeight: Math.max(altura, TOQUE_ABSOLUTO),
        minWidth: TOQUE_ABSOLUTO,
        justifyContent: "center",
        alignSelf: "flex-start",
        borderRadius: RAIO.quadrado,
      }}
    >
      <Texto tipo={tipo} style={{ textDecorationLine: "underline" }}>
        {rotulo}
      </Texto>
    </Pressionavel>
  );
}

type PropsDoBotaoIcone = {
  icone: NomeIcone;
  acessivel: string;
  onPress: () => void;
  pressionado?: boolean;
};

export function BotaoIcone({ icone, acessivel, onPress, pressionado }: PropsDoBotaoIcone) {
  return (
    <Pressionavel
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      accessibilityState={pressionado === undefined ? undefined : { selected: pressionado }}
      aria-pressed={pressionado}
      style={{
        width: TOQUE_MINIMO,
        height: TOQUE_MINIMO,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RAIO.pilula,
      }}
    >
      <Icone nome={icone} tamanho="g" />
    </Pressionavel>
  );
}
