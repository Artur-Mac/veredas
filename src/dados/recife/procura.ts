// Ruas do piloto com tempo de ida programado até cada bairro (VE11.03), gerado por scripts/dados/transito/onde-procurar.mjs.
import { z } from "zod";
import type { RuaDaProcura } from "../escolha";
import { faltaCamada, lerCamada } from "../camadas";
import { ARQUIVO_DA_PROCURA, VERSAO_DA_PROCURA } from "./procuraGerado";

/** O arquivo de camada de "Onde mais procurar" (fora do bundle, D036). */
export const arquivoDaProcura = (): string => ARQUIVO_DA_PROCURA;

const esquema = z.strictObject({
  versao: z.string(), formato: z.literal(1), dia: z.string(), saidas: z.array(z.string()), grade: z.string(), essenciais: z.string(),
  bairros: z.array(z.string()),
  ruas: z.array(z.strictObject({ c: z.string(), n: z.string(), b: z.string(), p: z.number().int().positive(), m10: z.number().min(0).max(1), t: z.array(z.number().int().nonnegative().nullable()) })),
});
let cache: { bairros: string[]; ruas: RuaDaProcura[]; dia: string } | null | undefined;
export function procura(): { bairros: string[]; ruas: RuaDaProcura[]; dia: string } | null {
  if (cache !== undefined) return cache;
  try {
    const p = esquema.safeParse(lerCamada(ARQUIVO_DA_PROCURA));
    cache = p.success && p.data.versao === VERSAO_DA_PROCURA && p.data.ruas.every((r) => r.t.length === p.data.bairros.length) ? { bairros: p.data.bairros, ruas: p.data.ruas, dia: p.data.dia } : null;
  } catch (e) { if (faltaCamada(e)) throw e; cache = null; }
  return cache;
}
