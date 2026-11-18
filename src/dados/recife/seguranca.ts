// "Segurança no bairro" (hub, 18/11/2026): ocorrências registradas em 12 meses por bairro, com a taxa por 1.000
// moradores. Junta dois arquivos gerados por scripts:
// - crime/ocorrencias.json (scripts/dados/coletar-crime-recife.mjs): registros da SDS-PE compilados pelo Crime Brasil;
// - populacao-bairros.json (scripts/dados/populacao-bairros-recife.mjs): população do Censo 2022 (IBGE, V0001).
// Regras do hub: atribuição fixa, sem ranking de bairros, sem nota e sem "seguro"/"perigoso". A comparação é só a
// posição em relação à mediana do Recife. Os vizinhos saem em ordem alfabética, nunca ordenados pela taxa.
import { z } from "zod";

export const ATRIBUICAO_DA_SEGURANCA = "registros da SDS-PE compilados pelo Crime Brasil";
export const FONTE_DA_POPULACAO = "IBGE, Censo 2022";
export const URL_DA_FONTE_DA_SEGURANCA = "https://crimebrasil.com.br/fontes/sds-pe";
/** Abaixo disso a taxa por morador exagera (centro antigo, bairros de comércio): a tela avisa. */
export const POUCOS_MORADORES = 5000;

const periodo = z.strictObject({ inicio: z.string().regex(/^\d{4}-\d{2}$/), fim: z.string().regex(/^\d{4}-\d{2}$/) });
const natureza = z.strictObject({ natureza: z.string().min(1), ocorrencias: z.number().int().min(0) });
const bairro = z.object({
  nome: z.string().min(1),
  slug: z.string().min(1),
  janela: z.enum(["12-meses", "todo-o-periodo"]),
  periodo: periodo.nullable(),
  total: z.number().int().min(0),
  naturezas: z.array(natureza),
  url: z.string().url(),
  vizinhosDeDivisa: z.array(z.string()),
});
const esquemaOcorrencias = z.object({
  geradoEm: z.string(),
  atribuicao: z.literal(ATRIBUICAO_DA_SEGURANCA),
  periodo,
  bairros: z.array(bairro),
});
const esquemaPopulacao = z.object({
  referencia: z.literal("Censo Demográfico 2022"),
  fonte: z.string().url(),
  populacao: z.record(z.string(), z.number().int().min(0)),
});

type Ocorrencias = z.infer<typeof esquemaOcorrencias>;
type Populacao = z.infer<typeof esquemaPopulacao>;

export type LinhaDeSeguranca = {
  slug: string;
  nome: string;
  /** Registros na janela de 12 meses; null quando a fonte só tem o período inteiro (não comparável). */
  total: number | null;
  moradores: number | null;
  /** Registros por 1.000 moradores em 12 meses, com uma casa decimal. */
  taxaPorMil: number | null;
  poucosMoradores: boolean;
  /** As três naturezas mais frequentes (ordem da fonte, por contagem). */
  principais: readonly { natureza: string; ocorrencias: number }[];
  url: string;
};

export type SegurancaDoBairro = {
  bairro: LinhaDeSeguranca;
  /** Bairros com pelo menos 50 m de divisa, em ordem alfabética. */
  vizinhos: readonly LinhaDeSeguranca[];
  /** Mediana da taxa entre os bairros do Recife com janela de 12 meses e população conhecida. */
  medianaRecife: number;
  /** Posição da taxa do bairro em relação à mediana; null sem taxa. */
  posicao: "acima" | "perto" | "abaixo" | null;
  periodo: { inicio: string; fim: string };
  atribuicao: string;
};

let cache: { ocorrencias: Ocorrencias; populacao: Populacao; mediana: number } | null = null;

const umaCasa = (n: number) => Math.round(n * 10) / 10;

function mediana(valores: number[]): number {
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m]! : (v[m - 1]! + v[m]!) / 2;
}

export function validarSeguranca(ocorrenciasBrutas: unknown, populacaoBruta: unknown) {
  const ocorrencias = esquemaOcorrencias.parse(ocorrenciasBrutas);
  const populacao = esquemaPopulacao.parse(populacaoBruta);
  const taxas = ocorrencias.bairros
    .map((b) => linha(b, populacao).taxaPorMil)
    .filter((t): t is number => t !== null);
  return { ocorrencias, populacao, mediana: umaCasa(mediana(taxas)) };
}

function base() {
  if (!cache) {
    cache = validarSeguranca(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("./crime/ocorrencias.json") as unknown,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("./populacao-bairros.json") as unknown,
    );
  }
  return cache;
}

function linha(b: z.infer<typeof bairro>, populacao: Populacao): LinhaDeSeguranca {
  const moradores = populacao.populacao[b.slug] ?? null;
  const total = b.janela === "12-meses" ? b.total : null;
  const taxaPorMil = total !== null && moradores ? umaCasa((total * 1000) / moradores) : null;
  return {
    slug: b.slug,
    nome: b.nome,
    total,
    moradores,
    taxaPorMil,
    poucosMoradores: moradores !== null && moradores < POUCOS_MORADORES,
    // "Outros tipos", "Outros Crimes" e "Outros Roubos" não dizem o que aconteceu: ficam fora das principais.
    principais:
      total === null
        ? []
        : b.naturezas
            .filter((n) => !/^outros?\b/i.test(n.natureza))
            .sort((x, y) => y.ocorrencias - x.ocorrencias)
            .slice(0, 3),
    url: b.url,
  };
}

/** Faixa de 15% em volta da mediana conta como "perto": diferença pequena não vira manchete. */
export function posicaoDaTaxa(taxa: number | null, medianaRecife: number): SegurancaDoBairro["posicao"] {
  if (taxa === null || medianaRecife <= 0) return null;
  const razao = Math.round((taxa / medianaRecife) * 1000) / 1000;
  if (razao > 1.15) return "acima";
  if (razao < 0.85) return "abaixo";
  return "perto";
}

export function segurancaDoBairro(slug: string | null | undefined): SegurancaDoBairro | null {
  if (!slug) return null;
  const { ocorrencias, populacao, mediana: medianaRecife } = base();
  const b = ocorrencias.bairros.find((x) => x.slug === slug);
  if (!b) return null;
  const doBairro = linha(b, populacao);
  const vizinhos = b.vizinhosDeDivisa
    .map((s) => ocorrencias.bairros.find((x) => x.slug === s))
    .filter((x): x is z.infer<typeof bairro> => x !== undefined)
    .map((x) => linha(x, populacao))
    .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"));
  return {
    bairro: doBairro,
    vizinhos,
    medianaRecife,
    posicao: posicaoDaTaxa(doBairro.taxaPorMil, medianaRecife),
    periodo: ocorrencias.periodo,
    atribuicao: ocorrencias.atribuicao,
  };
}
