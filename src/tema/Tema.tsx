import { createContext, useContext, useMemo, type ReactNode } from "react";
import { CORES_CLARO, CORES_ESCURO, type Cores, type TokenDeCor } from "./tokens";

type ValorDoTema = { escuro: boolean; cores: Cores; cor: (token: TokenDeCor) => string };

const ContextoDoTema = createContext<ValorDoTema | null>(null);

function valorDoTema(escuro: boolean): ValorDoTema {
  const cores = escuro ? CORES_ESCURO : CORES_CLARO;
  return { escuro, cores, cor: (token) => cores[token] };
}

/** Tema padrão da aplicação: sempre claro (substrato de papel #F2EBDD). */
export function TemaDoApp({ children }: { children: ReactNode }) {
  const valor = useMemo(() => valorDoTema(false), []);
  return <ContextoDoTema.Provider value={valor}>{children}</ContextoDoTema.Provider>;
}

/** Painel escuro de campo exclusivo da visita (.field-dark-panel). */
export function TemaEscuro({ children }: { children: ReactNode }) {
  const valor = useMemo(() => valorDoTema(true), []);
  return <ContextoDoTema.Provider value={valor}>{children}</ContextoDoTema.Provider>;
}

export function useTema(): ValorDoTema {
  const valor = useContext(ContextoDoTema);
  if (!valor) throw new Error("useTema fora de TemaDoApp");
  return valor;
}
