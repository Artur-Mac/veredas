import { z } from "zod";
import { distanciaMetros } from "../geo";

const esquema = z.strictObject({
  versao: z.literal(1), municipio: z.literal("2611606"), referencia: z.literal("Censo 2022"), modificadoEm: z.string(),
  fonte: z.string().url(), dicionario: z.string().url(), licenca: z.literal("Citar o IBGE"), sha256Entrada: z.string().length(64),
  lidos: z.number().int().positive(), excluidos: z.record(z.string(), z.number().int().min(0)),
  pontos: z.array(z.tuple([z.number().min(-35.1).max(-34.8), z.number().min(-8.18).max(-7.9), z.union([z.literal(4), z.literal(5), z.literal(8)]), z.literal(1)])),
});
export const CATEGORIAS_CNEFE = { 4: "Ensino", 5: "Saúde", 8: "Religioso" } as const;
export type BaseServicos = z.infer<typeof esquema>;
let base: BaseServicos | null = null;
export function validarServicos(dados: unknown): BaseServicos { return esquema.parse(dados); }
export function baseDeServicos(): BaseServicos {
  // Só é carregado ao abrir a lista, independente das partições do cadastro predial.
  if (!base) base = validarServicos(require("./servicos-cnefe.json") as unknown);
  return base;
}
export function servicosProximos(dados: BaseServicos, centro: [number, number], raioM: number, categoria: 4 | 5 | 8, limite = 20) {
  z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).parse(centro);
  z.number().min(50).max(2000).parse(raioM);
  const encontrados = dados.pontos.filter(p => p[2] === categoria)
    .map(p => ({ coordenada: [p[0], p[1]] as [number, number], distanciaM: distanciaMetros(centro, [p[0], p[1]]) }))
    .filter(p => p.distanciaM <= raioM).sort((a, b) => a.distanciaM - b.distanciaM)
    .map(p => ({ ...p, distanciaM: Math.round(p.distanciaM) }));
  return { total: encontrados.length, itens: encontrados.slice(0, Math.max(0, limite)) };
}
