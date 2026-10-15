import type { NomeIcone } from "../componentes/icones";
import type { Creditos, TipoDeMovimento } from "./esquema";

export const NOMES_DE_MOVIMENTO: Record<TipoDeMovimento, string> = {
  cota_inicial: "Cota inicial",
  dossie: "Dossiê",
  confirmacao_lote: "Confirmação do lote",
  feedback_pos_visita: "Feedback pós-visita",
  motivo_descarte: "Motivo do descarte",
};

export const COMO_GANHAR: readonly { icone: NomeIcone; tipo: TipoDeMovimento; mais: number }[] = [
  { icone: "map-pin", tipo: "confirmacao_lote", mais: 1 },
  { icone: "message-circle", tipo: "feedback_pos_visita", mais: 1 },
  { icone: "square-x", tipo: "motivo_descarte", mais: 1 },
];

export type ResumoDosCreditos = { disponiveis: number; cotaInicial: number; ganhos: number; usados: number };

export function resumoDosCreditos(creditos: Creditos): ResumoDosCreditos {
  const soma = (filtro: (m: Creditos["extrato"][number]) => boolean) =>
    creditos.extrato.filter(filtro).reduce((total, m) => total + m.delta, 0);
  return {
    disponiveis: soma(() => true),
    cotaInicial: soma((m) => m.tipo === "cota_inicial"),
    ganhos: soma((m) => m.delta > 0 && m.tipo !== "cota_inicial"),
    usados: -soma((m) => m.delta < 0),
  };
}

export function textoDeDisponiveis(n: number): string {
  return n === 1 ? "dossiê disponível" : "dossiês disponíveis";
}
