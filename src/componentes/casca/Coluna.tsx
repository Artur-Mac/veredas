// A coluna única do app. No celular ela ocupa a largura da tela; no desktop todas as telas das abas, a leitura, o prédio,
// o editar e as barras do cabeçalho e do dock usam a mesma largura máxima, centralizada. As gavetas têm a delas, menor.
// As margens laterais (16 px) ficam por conta da rolagem de cada tela, fora da coluna: assim os cartões têm exatamente
// `LARGURA_DA_COLUNA` no desktop e o mesmo recuo no celular.
import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

/** Largura máxima do conteúdo das telas. */
export const LARGURA_DA_COLUNA = 720;

/** Largura máxima das gavetas (folhas que sobem do pé da tela). */
export const LARGURA_DA_GAVETA = 640;

type Props = ViewProps & { children?: ReactNode };

/** Coluna centralizada de até `LARGURA_DA_COLUNA`. Aceita as props de `View` (estilo, `onLayout`, papéis). */
export function Coluna({ style, children, ...resto }: Props) {
  return (
    <View {...resto} style={[{ width: "100%", maxWidth: LARGURA_DA_COLUNA, alignSelf: "center" }, style]}>
      {children}
    </View>
  );
}
