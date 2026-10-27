import type { DocumentoPessoal } from "./caderno";

export const camposDoBalancete = ["receitasCentavos", "despesasCentavos", "reservaCentavos", "inadimplenciaCentavos"] as const;
export type CampoDoBalancete = typeof camposDoBalancete[number];
export type PropostaDoBalancete = { campo: CampoDoBalancete; centavos: number; trecho: string; pagina: number | null; documentoId: string };
const nomes: Record<CampoDoBalancete, string> = {
  receitasCentavos: "(?:receitas(?: totais)?|total de receitas)", despesasCentavos: "(?:despesas(?: totais)?|total de despesas)",
  reservaCentavos: "(?:reserva|fundo de reserva)", inadimplenciaCentavos: "inadimplência",
};
/** Gramática deliberadamente estreita: uma rubrica e um valor por linha, em texto
 * já revisado. Não interpreta instruções, tabelas, conclusões ou valores negativos.
 * A proposta aponta para o trecho original; nunca é um fato salvo automaticamente. */
export function proporBalancete(d: DocumentoPessoal): { propostas: PropostaDoBalancete[]; ambiguos: CampoDoBalancete[] } {
  if (d.tipo !== "balancete" || d.vinculo === "outro_imovel") return { propostas: [], ambiguos: [] };
  const propostas: PropostaDoBalancete[] = [], ambiguos: CampoDoBalancete[] = [];
  for (const campo of camposDoBalancete) {
    const re = new RegExp(`^\\s*${nomes[campo]}\\s*:\\s*R\\$\\s*((?:\\d{1,3}(?:\\.\\d{3})+|\\d+)(?:,\\d{2})?)\\s*$`, "iu");
    const encontrados = d.trecho.split(/\r?\n/).flatMap(trecho => {
      const m = re.exec(trecho); if (!m) return [];
      const centavos = Math.round(Number(m[1]!.replace(/\./g, "").replace(",", ".")) * 100);
      return Number.isSafeInteger(centavos) && centavos <= 1e12 ? [{ campo, centavos, trecho, pagina: d.pagina, documentoId: d.id }] : [];
    });
    if (new Set(encontrados.map(p => p.centavos)).size > 1) ambiguos.push(campo);
    else if (encontrados[0]) propostas.push(encontrados[0]);
  }
  return { propostas, ambiguos };
}
