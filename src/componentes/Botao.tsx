import type { StyleProp, ViewStyle } from "react-native";
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
  pilula?: boolean;
  desativado?: boolean;
  acessivel?: string;
  expandido?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Botao({
  rotulo,
  onPress,
  variante = "secundario",
  icone,
  tamanhoIcone = "m",
  pilula = false,
  desativado = false,
  acessivel,
  expandido,
  style,
}: Props) {
  const { cor } = useTema();
  const corDoTexto: TokenDeCor = variante === "principal" ? "cor-sobre-barro" : "cor-texto";
  const tipo: Tipo = variante === "texto" ? "corpo" : "botao";
  const fundo: ViewStyle =
    variante === "principal"
      ? { backgroundColor: cor("cor-barro") }
      : variante === "secundario"
        ? { backgroundColor: cor("cor-superficie"), borderWidth: 1, borderColor: cor("cor-linha") }
        : {};
  const largura: ViewStyle = variante === "texto" || pilula ? { alignSelf: "flex-start" } : { alignSelf: "stretch" };
  return (
    <Pressionavel
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      accessibilityState={{ disabled: desativado, expanded: expandido }}
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
        fundo,
        largura,
        style,
      ]}
    >
      {icone ? <Icone nome={icone} tamanho={tamanhoIcone} cor={corDoTexto} /> : null}
      <Texto tipo={tipo} cor={corDoTexto} style={variante === "texto" ? { textDecorationLine: "underline" } : undefined}>
        {rotulo}
      </Texto>
    </Pressionavel>
  );
}

type PropsDoLink = {
  rotulo: string;
  onPress: () => void;
  tipo?: "corpo" | "apoio";
  altura?: number;
  acessivel?: string;
};

export function LinkDeLinha({ rotulo, onPress, tipo = "corpo", altura = TOQUE_MINIMO, acessivel }: PropsDoLink) {
  return (
    <Pressionavel
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={acessivel}
      style={{ minHeight: altura, justifyContent: "center", alignSelf: "flex-start", borderRadius: RAIO.quadrado }}
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
