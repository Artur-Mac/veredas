import { createContext, useContext } from "react";
import type { Dossie } from "../dados/esquema";

export const ContextoDoDossie = createContext<Dossie | null>(null);

export function useDossie(): Dossie {
  const dossie = useContext(ContextoDoDossie);
  if (!dossie) throw new Error("useDossie fora de dossie/[id]/_layout");
  return dossie;
}
