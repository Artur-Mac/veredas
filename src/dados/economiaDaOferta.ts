import { z } from "zod";
const centavos = z.number().int().min(0).max(1e12);
const esquema = z.strictObject({
  receitaBrutaCentavos: centavos, taxaPagamentoFracao: z.number().min(0).max(1),
  tributosFracao: z.number().min(0).max(1),
  custos: z.array(z.strictObject({ nome: z.string().trim().min(1).max(100), valorCentavos: centavos.nullable(),
    fonte: z.string().max(300), referenciaEm: z.iso.date().nullable() })).max(100),
}).refine(x => x.taxaPagamentoFracao + x.tributosFracao <= 1, "Deduções excedem a receita");

/** Ferramenta interna para cenários. Não define preço, contrata fornecedor ou altera carteira. */
export function economiaDaOferta(entrada: z.input<typeof esquema>) {
  const x = esquema.parse(entrada);
  const receitaLiquidaCentavos = Math.round(x.receitaBrutaCentavos * (1 - x.taxaPagamentoFracao - x.tributosFracao));
  const custoConhecidoCentavos = x.custos.reduce((s, c) => s + (c.valorCentavos ?? 0), 0);
  const pendencias = x.custos.filter(c => c.valorCentavos === null).map(c => c.nome);
  return { receitaLiquidaCentavos, custoConhecidoCentavos, margemConhecidaCentavos: receitaLiquidaCentavos - custoConhecidoCentavos,
    completo: pendencias.length === 0, pendencias };
}
