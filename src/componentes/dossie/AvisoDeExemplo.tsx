import { router } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../../tema/Tema";
import { ESPACO, LINHA, RAIO, TOQUE_MINIMO } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";

export const TEXTO_DO_AVISO_DE_EXEMPLO =
  "Exemplo com dados de demonstração. Para dados do cadastro, cole o link de um anúncio.";
export const ROTULO_DO_LINK_PARA_EXPLORAR = "Explorar";

/** O link leva ao Explorar, onde se cola o link de um anúncio. */
export function irParaExplorar() {
  router.dismissTo("/");
}

/**
 * Faixa fixa no topo de toda tela de `/exemplos/*`. Cobre a área do relógio do aparelho (a tela de baixo recebe
 * `top: 0` no layout, para o recuo não valer duas vezes).
 */
export function AvisoDeExemplo() {
  const { cor } = useTema();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: ESPACO[2],
        paddingTop: insets.top,
        paddingLeft: ESPACO[4] + insets.left,
        paddingRight: ESPACO[2] + insets.right,
        backgroundColor: cor("cor-nota"),
        borderBottomWidth: LINHA.divisor,
        borderBottomColor: cor("cor-linha"),
      }}
    >
      <Texto tipo="apoio" style={{ flex: 1, paddingVertical: ESPACO[2] }}>
        {TEXTO_DO_AVISO_DE_EXEMPLO}
      </Texto>
      <Pressionavel
        role="link"
        accessibilityLabel={ROTULO_DO_LINK_PARA_EXPLORAR}
        onPress={irParaExplorar}
        style={{
          minWidth: TOQUE_MINIMO,
          minHeight: TOQUE_MINIMO,
          paddingHorizontal: ESPACO[2],
          justifyContent: "center",
          alignItems: "center",
          borderRadius: RAIO.quadrado,
        }}
      >
        <Texto tipo="apoio" style={{ textDecorationLine: "underline", fontWeight: "600" }}>
          {ROTULO_DO_LINK_PARA_EXPLORAR}
        </Texto>
      </Pressionavel>
    </View>
  );
}
