import type { LeituraParcial, Portal } from "../../dados/contratos";

export interface LeitorDePaginaProps {
  url: string;
  portal: Portal;
  idNoPortal: string | null;
  aoLer: (leituras: LeituraParcial[]) => void;
  aoFalhar: (motivo: "tempo" | "verificacao" | "erro") => void;
}

export function LeitorDePagina(_props: LeitorDePaginaProps): null {
  return null;
}
