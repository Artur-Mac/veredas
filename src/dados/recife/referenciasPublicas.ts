import { z } from "zod";
import { distanciaMetros } from "../geo";

const ponto = z.tuple([z.number().min(-35.15).max(-34.8), z.number().min(-8.2).max(-7.9)]);

const esquemaReferenciasPublicas = z.strictObject({
  versao: z.literal(1),
  municipio: z.literal("2611606"),
  financiamento: z.strictObject({
    serieSgs: z.literal(20774),
    taxaEfetivaAnualPct: z.number().positive(),
    referenciaData: z.string(),
    consultadoEm: z.string(),
    fonte: z.string(),
    url: z.string().url(),
    licenca: z.string(),
  }),
  energia: z.strictObject({
    distribuidora: z.string(),
    cnpj: z.string(),
    resolucao: z.string(),
    inicioVigencia: z.string(),
    fimVigencia: z.string(),
    tarifaHomologadaKwh: z.number().positive(),
    tarifaComTributosEstimadaKwh: z.number().positive(),
    consultadoEm: z.string(),
    fonte: z.string(),
    url: z.string().url(),
    licenca: z.string(),
  }),
  transportePublico: z.strictObject({
    tarifaAnelAReais: z.number().positive(),
    tarifaMetroReais: z.number().positive(),
    sha256FareAttributes: z.string().length(64),
    fonte: z.string(),
    licenca: z.string(),
  }),
  marinha: z.strictObject({
    fonteGeometria: z.string(),
    urlGeometria: z.string().url(),
    sha256Hidricos: z.string().length(64),
    sha256Bairros: z.string().length(64),
    normaReferencia: z.string(),
    licenca: z.string(),
    bairrosIlhasAterroHistorico: z.array(z.string()),
    pontosOrla: z.array(ponto),
    pontosEstuario: z.array(ponto),
  }),
  centroidesBairros: z.record(z.string(), ponto),
});

export type BaseReferenciasPublicas = z.infer<typeof esquemaReferenciasPublicas>;

let cache: BaseReferenciasPublicas | null = null;

export function validarReferenciasPublicas(dados: unknown): BaseReferenciasPublicas {
  return esquemaReferenciasPublicas.parse(dados);
}

export function baseDeReferenciasPublicas(): BaseReferenciasPublicas {
  if (!cache) {
    cache = validarReferenciasPublicas(require("./referencias-publicas.json") as unknown);
  }
  return cache;
}

export function centroideDoBairro(slug: string | null | undefined): [number, number] | null {
  if (!slug) return null;
  const base = baseDeReferenciasPublicas();
  return base.centroidesBairros[slug] ?? null;
}

export type IndicioDeMarinha = {
  /** Verdadeiro quando o lote ou bairro está em faixa costeira, estuarina sob maré ou ilha de aterro histórico. */
  emFaixaDeAtencao: boolean;
  motivo: "orla_atlantica" | "margem_estuarina" | "ilha_costeira_estuarina" | null;
  distanciaReferenciaM: number | null;
};

function menorDistanciaM(alvo: [number, number], pontos: readonly [number, number][]): number {
  let menor = Infinity;
  for (const p of pontos) {
    if (Math.abs(p[0] - alvo[0]) > 0.005 || Math.abs(p[1] - alvo[1]) > 0.005) continue;
    const d = distanciaMetros(alvo, p);
    if (d < menor) menor = d;
  }
  return menor;
}

/**
 * Verifica se o lote (ou bairro, quando ainda não confirmado) fica em faixa costeira ou estuarina do Recife
 * onde são frequentes imóveis sob regime de ocupação ou aforamento da SPU (Terrenos de Marinha e Acrescidos).
 * Nunca afirma o regime jurídico da matrícula: serve apenas para lembrar a conferência na certidão de ônus/matrícula.
 */
export function verificarFaixaDeMarinha(
  coordenadaDoLote: [number, number] | null,
  slugBairro: string | null | undefined,
): IndicioDeMarinha {
  const base = baseDeReferenciasPublicas();
  if (coordenadaDoLote) {
    const distOrla = menorDistanciaM(coordenadaDoLote, base.marinha.pontosOrla);
    if (distOrla <= 240) {
      return { emFaixaDeAtencao: true, motivo: "orla_atlantica", distanciaReferenciaM: Math.round(distOrla) };
    }
    const distEstuario = menorDistanciaM(coordenadaDoLote, base.marinha.pontosEstuario);
    if (distEstuario <= 120) {
      return { emFaixaDeAtencao: true, motivo: "margem_estuarina", distanciaReferenciaM: Math.round(distEstuario) };
    }
  }
  if (slugBairro && base.marinha.bairrosIlhasAterroHistorico.includes(slugBairro)) {
    return { emFaixaDeAtencao: true, motivo: "ilha_costeira_estuarina", distanciaReferenciaM: null };
  }
  return { emFaixaDeAtencao: false, motivo: null, distanciaReferenciaM: null };
}
