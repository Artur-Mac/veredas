import type { AnaliseV2 } from "./contratos";
export type AgendamentoLocal = { id: string; em: string; chave: string };
export function lembretesDesejados(lista: readonly AnaliseV2[], agora: number): AgendamentoLocal[] {
  return lista.flatMap(a => a.descarte ? [] : (a.caderno?.lembretes ?? []).filter(r => r.estado === "ativo" && r.notificar && Date.parse(r.em) > agora)
    .map(r => ({ id: `vereda:${a.id}:${r.id}`, em: r.em, chave: `${a.id}/${r.id}` })));
}
export function mudancasDeAgendamento(atuais: readonly AgendamentoLocal[], desejados: readonly AgendamentoLocal[]) {
  const igual = (a: AgendamentoLocal, b: AgendamentoLocal) => a.id === b.id && a.em === b.em && a.chave === b.chave;
  return { cancelar: atuais.filter(a => !desejados.some(d => igual(a, d))), agendar: desejados.filter(d => !atuais.some(a => igual(a, d))) };
}
/** Fuso faz parte da entrada; horário sem offset é ambíguo e deve ser recusado. */
export function dataDoLembrete(data: string, fuso: string): string {
  if (!/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:Z|[+-]\d\d:\d\d)$/.test(data)) throw new Error("Informe data/hora com fuso, como 2026-11-01T14:00-03:00.");
  new Intl.DateTimeFormat("pt-BR", { timeZone: fuso }).format();
  const d = new Date(data); if (!Number.isFinite(d.getTime())) throw new Error("Data inválida.");
  const formato = data.slice(0, 10); const dia = new Date(formato + "T12:00:00Z");
  if (!Number.isFinite(dia.getTime()) || dia.toISOString().slice(0, 10) !== formato) throw new Error("Data inexistente.");
  return d.toISOString();
}
