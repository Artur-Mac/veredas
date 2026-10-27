import type { AnaliseV2 } from "./contratos";
import type { Caderno } from "./caderno";

export function custoDaRotina(p: NonNullable<Caderno["perfilDomestico"]>) {
  const parcelas = p.consumos.map(c => ({ id: c.id, centavos: c.quantidade === null || c.tarifaCentavos === null ? null : Math.round(c.quantidade * c.tarifaCentavos) }));
  if (parcelas.some(p => p.centavos !== null && !Number.isSafeInteger(p.centavos))) throw new Error("Estimativa fora do limite monetário.");
  const soma = parcelas.reduce((s, p) => s + (p.centavos ?? 0), 0);
  if (!Number.isSafeInteger(soma)) throw new Error("Estimativa fora do limite monetário.");
  return { conhecidoCentavos: parcelas.every(p => p.centavos === null) ? null : soma, pendentes: parcelas.filter(p => p.centavos === null).length };
}
export function saldoDoBalancete(b: NonNullable<Caderno["balancetes"]>[number]): number | null {
  return b.receitasCentavos === null || b.despesasCentavos === null ? null : b.receitasCentavos - b.despesasCentavos;
}
export type EventoDaAnalise = { id: string; data: string | null; titulo: string; fonte: string; tipoDeData: string };
/** Datas da fonte não são substituídas pela data em que o arquivo foi recebido. */
export function linhaDoTempo(a: AnaliseV2): EventoDaAnalise[] {
  const c = a.caderno; if (!c) return [];
  const eventos: EventoDaAnalise[] = [];
  for (const d of c.documentos) {
    if (d.tipo === "laudo" || d.inspecaoEm) eventos.push({ id: `inspecao-${d.id}`, data: d.inspecaoEm, titulo: `Inspeção apresentada · ${d.titulo}`, fonte: d.origem, tipoDeData: "data da inspeção; vínculo " + d.vinculo });
    else if (!d.emitidoEm) eventos.push({ id: `documento-${d.id}`, data: null, titulo: `Documento apresentado · ${d.titulo}`, fonte: d.origem, tipoDeData: "data do documento não informada; vínculo " + d.vinculo });
    if (d.emitidoEm) eventos.push({ id: `emissao-${d.id}`, data: d.emitidoEm, titulo: `Emissão · ${d.titulo}`, fonte: d.origem, tipoDeData: "data de emissão" });
  }
  for (const o of c.ocorrencias) eventos.push({ id: `ocorrencia-${o.id}`, data: o.referenciaEm, titulo: o.identificador + " · " + o.estagio, fonte: o.fonte, tipoDeData: "referência da fonte; não é diagnóstico ou condenação" });
  for (const v of c.visitas) eventos.push({ id: `visita-${v.id}`, data: v.concluidaEm, titulo: "Visita anterior", fonte: "Seu caderno", tipoDeData: "conclusão informada; arquivamento não substitui data da visita" });
  if (a.visita.concluidaEm) eventos.push({ id: "visita-atual", data: a.visita.concluidaEm, titulo: "Visita atual concluída", fonte: "Seu caderno", tipoDeData: "conclusão informada" });
  for (const o of c.observacoes) eventos.push({ id: `observacao-${o.id}`, data: o.em, titulo: `Observação pessoal · ${o.assunto}`, fonte: "Seu caderno", tipoDeData: "data do registro; não comprova horário do fenômeno observado" });
  for (const h of c.historicoDoAnuncio ?? []) eventos.push({ id: h.id, data: h.em, titulo: "Alteração deliberada do anúncio", fonte: "Seu caderno", tipoDeData: "registro da edição" });
  for (const b of c.balancetes ?? []) eventos.push({ id: `balancete-${b.id}`, data: b.periodo, titulo: "Balancete apresentado", fonte: b.fonte, tipoDeData: "competência mensal" });
  for (const i of c.infraestrutura ?? []) eventos.push({ id: `infra-${i.id}`, data: i.observadoEm, titulo: "Infraestrutura · " + i.assunto, fonte: i.fonte, tipoDeData: "observação informada" });
  return eventos.sort((a, b) => a.data === null ? (b.data === null ? a.id.localeCompare(b.id) : 1) : b.data === null ? -1 : b.data.localeCompare(a.data));
}
