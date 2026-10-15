import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { usePreferencias } from "../estado/Preferencias";
import { CORES_CLARO, CORES_ESCURO, type Cores, type TokenDeCor } from "./tokens";

type ValorDoTema = { escuro: boolean; cores: Cores; cor: (token: TokenDeCor) => string };

const ContextoDoTema = createContext<ValorDoTema | null>(null);

function valorDoTema(escuro: boolean): ValorDoTema {
  const cores = escuro ? CORES_ESCURO : CORES_CLARO;
  return { escuro, cores, cor: (token) => cores[token] };
}

export function TemaDoApp({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const { tema } = usePreferencias();
  const escuro = tema === "escuro" || (tema === "sistema" && sistema === "dark");
  const valor = useMemo(() => valorDoTema(escuro), [escuro]);
  return <ContextoDoTema.Provider value={valor}>{children}</ContextoDoTema.Provider>;
}

export function TemaEscuro({ children }: { children: ReactNode }) {
  const valor = useMemo(() => valorDoTema(true), []);
  return <ContextoDoTema.Provider value={valor}>{children}</ContextoDoTema.Provider>;
}

export function useTema(): ValorDoTema {
  const valor = useContext(ContextoDoTema);
  if (!valor) throw new Error("useTema fora de TemaDoApp");
  return valor;
}
