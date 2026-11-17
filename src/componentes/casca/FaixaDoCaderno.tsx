// Faixa fixa no topo do Explorar e de Salvos com o aviso do caderno: "N análises não puderam ser abertas e foram guardadas
// à parte". O toast da abertura some em poucos segundos; esta faixa fica enquanto o app estiver aberto, para a pessoa não
// achar que perdeu as análises. Discreta: caixa creme (`.ed-cream-box`, index.html) com o texto em ferrugem.
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useAnalises } from "../../estado/Analises";
import { useTema } from "../../tema/Tema";
import { Texto } from "../Texto";

export function FaixaDoCaderno({ style }: { style?: StyleProp<ViewStyle> }) {
  const { cor } = useTema();
  const { aviso } = useAnalises();
  if (!aviso) return null;
  return (
    <View
      role="note"
      style={[
        {
          backgroundColor: cor("cor-creme"),
          borderWidth: 1,
          borderColor: cor("cor-linha"),
          borderRadius: 13,
          paddingVertical: 13,
          paddingHorizontal: 14,
        },
        style,
      ]}
    >
      <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 17, fontWeight: "500" }}>
        {aviso}
      </Texto>
    </View>
  );
}
