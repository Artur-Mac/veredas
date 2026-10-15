import type { EstadoDoFato, Fato } from "./esquema";

export type EstadoForcado = "padrao" | "carregando" | "contestado" | "em_verificacao";

export function estadoDoFato(fato: Pick<Fato, "estado">, forcado: EstadoForcado, contestado: boolean): EstadoDoFato {
  if (forcado === "carregando") return "carregando";
  if (fato.estado === "nao_sabemos" || fato.estado === "vazio") return fato.estado;
  if (forcado === "em_verificacao") return "em_verificacao";
  if (forcado === "contestado" || contestado) return "contestado";
  return fato.estado;
}
