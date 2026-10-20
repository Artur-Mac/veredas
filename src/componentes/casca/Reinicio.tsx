// Reinício do app: remonta todos os provedores de estado (preferências, aparelho, créditos, análises), que leem o
// armazenamento de novo ao subir. Serve para "Apagar meus dados deste aparelho": depois de limpar o armazenamento, a
// memória das telas não pode continuar mostrando o que já foi apagado.
import React, { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const Contexto = createContext<(() => void) | null>(null);

/** Sem raiz acima (uma tela montada sozinha, num teste): reiniciar não faz nada. */
const SEM_REINICIO = () => {};

/** Fica acima dos provedores de estado e abaixo dos que não guardam nada (tema, aviso). */
export function ReinicioDoApp({ children }: { children: ReactNode }) {
  const [geracao, definirGeracao] = useState(0);
  const reiniciar = useCallback(() => definirGeracao((g) => g + 1), []);
  return (
    <Contexto.Provider value={reiniciar}>
      <React.Fragment key={geracao}>{children}</React.Fragment>
    </Contexto.Provider>
  );
}

export function useReiniciarApp(): () => void {
  return useContext(Contexto) ?? SEM_REINICIO;
}
