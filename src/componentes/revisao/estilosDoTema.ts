import { useTema } from "../../tema/Tema";
import type { TokenDeCor } from "../../tema/tokens";

export type CorDoTema = (token: TokenDeCor) => string;

/**
 * Folha de estilos que depende das cores do tema. `criar` recebe `cor(token)` e devolve o `StyleSheet.create(...)`;
 * o resultado é guardado por tema, então cada tema monta a sua folha uma única vez, não a cada renderização.
 * Cor de marca só entra por token (`cor("cor-barro-texto")`), nunca por valor solto.
 */
export function estilosDoTema<T>(criar: (cor: CorDoTema) => T): () => T {
  const porTema = new WeakMap<object, T>();
  return function useEstilos(): T {
    const tema = useTema();
    let estilos = porTema.get(tema);
    if (estilos === undefined) {
      estilos = criar(tema.cor);
      porTema.set(tema, estilos);
    }
    return estilos;
  };
}
