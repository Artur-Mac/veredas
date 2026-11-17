// Foco visível na web. Dois indicadores, os dois em "cor-azul-cadastral" e com 2 px:
//  - `useFocoDeTeclado`: anel por fora de botões, links, abas e linhas tocáveis, só quando o foco veio do teclado
//    (`:focus-visible`); um toque ou clique do mouse não deixa anel.
//  - `useFocoDoCampo`: borda de 2 px em campo de texto focado, por teclado ou por clique. A borda cresce 1 px para dentro
//    e a margem negativa de 1 px devolve o espaço: o campo não muda de tamanho nem empurra o que está em volta.
// Fora da web (celular) o anel de teclado não existe; a borda do campo vale nos dois.
import { useCallback, useState } from "react";
import { Platform, type ViewStyle } from "react-native";
import { useTema } from "../../tema/Tema";

/** Espessura do anel e da borda de foco, em px. */
export const ESPESSURA_DO_FOCO = 2;

/**
 * O foco veio do teclado? Lê `:focus-visible` do elemento que recebeu o foco. O foco de um filho sobe até o pai (o evento
 * do React borbulha), e esse não conta: o anel é de quem de fato está focado. Sem DOM (celular, teste), `false`.
 */
export function focoVeioDoTeclado(evento: unknown): boolean {
  if (Platform.OS !== "web") return false;
  const { target, currentTarget } = (evento ?? {}) as {
    target?: { matches?: (seletor: string) => boolean };
    currentTarget?: unknown;
  };
  if (!target || typeof target.matches !== "function") return false;
  if (currentTarget && currentTarget !== target) return false;
  try {
    return target.matches(":focus-visible");
  } catch {
    // Navegador sem `:focus-visible`: sem anel é pior que anel a mais.
    return true;
  }
}

export type FocoDeTeclado = {
  aoFocar: (evento: unknown) => void;
  aoDesfocar: () => void;
  /** Estilo do anel; `null` enquanto o foco não veio do teclado. */
  estilo: ViewStyle | null;
};

export function useFocoDeTeclado(): FocoDeTeclado {
  const { cor } = useTema();
  const [visivel, definirVisivel] = useState(false);
  const aoFocar = useCallback((evento: unknown) => definirVisivel(focoVeioDoTeclado(evento)), []);
  const aoDesfocar = useCallback(() => definirVisivel(false), []);
  const estilo: ViewStyle | null = visivel
    ? { outlineWidth: ESPESSURA_DO_FOCO, outlineStyle: "solid", outlineColor: cor("cor-azul-cadastral"), outlineOffset: 2 }
    : null;
  return { aoFocar, aoDesfocar, estilo };
}

/** Só propriedades que `ViewStyle` e `TextStyle` têm em comum: o mesmo estilo vale para um `View` e para um `TextInput`. */
export type BordaDeFoco = { borderWidth: number; borderColor: string; margin: number };

export type FocoDoCampo = {
  focado: boolean;
  aoFocar: () => void;
  aoDesfocar: () => void;
  /** Borda de 2 px em azul cadastral; `null` fora do foco. Vai por último no estilo do elemento que tem a borda. */
  estilo: BordaDeFoco | null;
};

export function useFocoDoCampo(): FocoDoCampo {
  const { cor } = useTema();
  const [focado, definirFocado] = useState(false);
  const aoFocar = useCallback(() => definirFocado(true), []);
  const aoDesfocar = useCallback(() => definirFocado(false), []);
  const estilo: BordaDeFoco | null = focado
    ? { borderWidth: ESPESSURA_DO_FOCO, borderColor: cor("cor-azul-cadastral"), margin: -1 }
    : null;
  return { focado, aoFocar, aoDesfocar, estilo };
}
