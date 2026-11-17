import type { LeituraParcial, Portal } from "../../dados/contratos";
import type { MotivoDaFalha } from "./decidir";

export interface LeitorDePaginaProps {
  url: string;
  portal: Portal;
  idNoPortal: string | null;
  aoLer: (leituras: LeituraParcial[]) => void;
  aoFalhar: (motivo: MotivoDaFalha) => void;
}

export function LeitorDePagina(_props: LeitorDePaginaProps): null {
  return null;
}
