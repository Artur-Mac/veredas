// Dia a dia a pé (VE04): pacote gerado por scripts/dados/destinos/rodar-destinos.mjs, validado aqui, e as frases curtas
// que o dossiê e o Comparar mostram. Caminhada só para prédios com entrada ligada à rede com confiança (D020); nos
// outros, o local mais próximo em linha reta, sem minutos a pé.
import { z } from "zod";
import { formatarDistancia, formatarNumero } from "../formatos";
import { lerCamada } from "../camadas";
import { ARQUIVOS_DOS_ESSENCIAIS, VERSAO_DOS_ESSENCIAIS } from "./essenciaisGerados";

/** O arquivo de camada do bairro (fora do bundle, D036), ou null fora do piloto. */
export const arquivoDosEssenciais = (bairro: string | null | undefined): string | null => (bairro ? ARQUIVOS_DOS_ESSENCIAIS[bairro] ?? null : null);

export const CATEGORIAS_DO_DIA = ["mercado", "farmacia", "praca", "transporte"] as const;
export type CategoriaDoDia = (typeof CATEGORIAS_DO_DIA)[number];

const local = z.strictObject({
  nome: z.string().max(200).nullable(),
  categoria: z.enum(CATEGORIAS_DO_DIA),
  ponto: z.tuple([z.number(), z.number()]),
  horario: z.string().max(200).nullable(),
  fontes: z.array(z.enum(["osm", "prefeitura", "gtfs"])).min(1),
  periodico: z.boolean(),
});
const naRede = z.strictObject({
  l: z.number().int().min(0),
  m: z.number().int().min(0),
  min: z.number().min(0),
  b: z.strictObject({ l: z.number().int().min(0), m: z.number().int().min(0), min: z.number().min(0) }).nullable(),
  pontes: z.array(z.string().max(200)).min(1).optional(),
  segundoNaMesmaPonte: z.literal(true).optional(),
});
const emLinhaReta = z.strictObject({ l: z.number().int().min(0), retaM: z.number().int().min(0) });
const predio = z.discriminatedUnion("modo", [
  z.strictObject({
    modo: z.literal("rede"),
    c: z.strictObject(Object.fromEntries(CATEGORIAS_DO_DIA.map((k) => [k, naRede.nullable()])) as Record<CategoriaDoDia, z.ZodNullable<typeof naRede>>),
    cadeia: z.strictObject({ mercado: z.number().int(), farmacia: z.number().int(), m: z.number().int(), separadasM: z.number().int() }).nullable(),
  }),
  z.strictObject({
    modo: z.literal("linha_reta"),
    c: z.strictObject(Object.fromEntries(CATEGORIAS_DO_DIA.map((k) => [k, emLinhaReta.nullable()])) as Record<CategoriaDoDia, z.ZodNullable<typeof emLinhaReta>>),
    cadeia: z.null(),
  }),
]);
export const esquemaEssenciaisDoBairro = z.strictObject({
  versao: z.string().regex(/^[0-9a-f]{16}$/),
  geradoEm: z.string(),
  rede: z.string().regex(/^[0-9a-f]{16}$/),
  velocidadeMps: z.number().positive(),
  limiteM: z.number().int().positive(),
  fontes: z.record(z.string(), z.string()),
  locais: z.array(local),
  predios: z.record(z.string(), predio),
});
export type EssenciaisDoBairro = z.infer<typeof esquemaEssenciaisDoBairro>;
export type EssenciaisDoPredio = z.infer<typeof predio>;
export type LocalDoDia = z.infer<typeof local>;

const cache = new Map<string, EssenciaisDoBairro | null>();

/** Pacote do bairro, validado; null fora do piloto ou se o arquivo não validar (a seção some, o resto segue). */
export function essenciaisDoBairro(bairro: string | null): EssenciaisDoBairro | null {
  if (!bairro) return null;
  if (cache.has(bairro)) return cache.get(bairro)!;
  const arquivo = arquivoDosEssenciais(bairro);
  let v: EssenciaisDoBairro | null = null;
  if (arquivo) {
    const r = esquemaEssenciaisDoBairro.safeParse(lerCamada(arquivo));
    v = r.success && r.data.versao === VERSAO_DOS_ESSENCIAIS ? r.data : null;
  }
  cache.set(bairro, v);
  return v;
}

export function essenciaisDoPredio(bairro: string | null, predioId: string | null): { pacote: EssenciaisDoBairro; predio: EssenciaisDoPredio } | null {
  const pacote = essenciaisDoBairro(bairro);
  const p = pacote && predioId ? pacote.predios[predioId] : undefined;
  return pacote && p ? { pacote, predio: p } : null;
}

// ——— Frases ———————————————————————————————————————————————————————————————————————

export const ROTULO_DA_CATEGORIA: Record<CategoriaDoDia, string> = {
  mercado: "Mercado", farmacia: "Farmácia", praca: "Praça ou parque", transporte: "Ônibus ou metrô",
};
const SEM_NOME: Record<CategoriaDoDia, string> = {
  mercado: "Mercado sem nome no mapa", farmacia: "Farmácia sem nome no mapa", praca: "Área verde sem nome no mapa", transporte: "Parada",
};

export function nomeDe(l: LocalDoDia): string {
  const n = l.nome?.trim();
  if (!n) return SEM_NOME[l.categoria];
  if (l.categoria === "transporte") {
    // No GTFS, quase todo ponto tem só um código numérico; terminais e estações têm nome com o código no fim.
    if (/^\d+$/.test(n)) return "Ponto de ônibus";
    return n.replace(/\s+-\s+\d+$/, "");
  }
  return n;
}

const minutosEmTexto = (min: number) => (min < 1 ? "menos de 1 min" : `${formatarNumero(Math.round(min))} min`);

export type LinhaDoDia = { categoria: CategoriaDoDia; rotulo: string; valor: string; detalhe: string };

/** Uma linha por categoria, curta: o local, o tempo a pé e o plano B quando ele importa. */
export function linhasDoDia(pacote: EssenciaisDoBairro, p: EssenciaisDoPredio): LinhaDoDia[] {
  const linhas: LinhaDoDia[] = [];
  for (const cat of CATEGORIAS_DO_DIA) {
    const rotulo = ROTULO_DA_CATEGORIA[cat];
    if (p.modo === "linha_reta") {
      const x = p.c[cat];
      if (!x) { linhas.push({ categoria: cat, rotulo, valor: "—", detalhe: "Nenhum no mapa a até 2 km." }); continue; }
      const l = pacote.locais[x.l]!;
      linhas.push({ categoria: cat, rotulo, valor: `~${formatarDistancia(x.retaM)}`, detalhe: `${nomeDe(l)}, em linha reta. A entrada do prédio ainda não está ligada às ruas no mapa, então não calculamos o caminho.` });
      continue;
    }
    const x = p.c[cat];
    if (!x) { linhas.push({ categoria: cat, rotulo, valor: "—", detalhe: `Nenhum no mapa a até ${formatarDistancia(pacote.limiteM)} a pé.` }); continue; }
    const l = pacote.locais[x.l]!;
    const partes = [`${nomeDe(l)}, ${formatarDistancia(x.m)} a pé.`];
    if (l.horario && cat !== "transporte" && cat !== "praca") partes.push(`${l.periodico ? "Funciona" : "Horário informado"}: ${l.horario}.`);
    const b = x.b ? pacote.locais[x.b.l] : null;
    if (x.pontes?.length) {
      // A ponte é nomeada uma vez só, em `ponteDoCaminho`; aqui só o efeito e o plano B sem ela.
      partes.push(b && x.b ? `Passa pela ponte. Sem ela: ${nomeDe(b)}, ${minutosEmTexto(x.b.min)}.` : "Passa pela ponte. Sem ela, nenhum outro a até 2 km.");
    } else if (b && x.b) partes.push(`Outra opção: ${nomeDe(b)}, ${minutosEmTexto(x.b.min)}.`);
    linhas.push({ categoria: cat, rotulo, valor: minutosEmTexto(x.min), detalhe: partes.join(" ") });
  }
  return linhas;
}

/**
 * A ponte que os caminhos atravessam, dita uma vez para a seção (o nome é o da via marcada como ponte no mapa, às vezes
 * a própria rua). Null quando nenhum caminho passa por ponte.
 */
export function ponteDoCaminho(p: EssenciaisDoPredio): string | null {
  if (p.modo !== "rede") return null;
  const contagem = new Map<string, string[]>();
  for (const cat of CATEGORIAS_DO_DIA) {
    const nome = p.c[cat]?.pontes?.[0];
    if (nome) contagem.set(nome, [...(contagem.get(nome) ?? []), ROTULO_DA_CATEGORIA[cat].toLowerCase()]);
  }
  if (!contagem.size) return null;
  const [nome, cats] = [...contagem].sort((a, b) => b[1].length - a[1].length)[0]!;
  const quais = cats.length === 1 ? cats[0] : `${cats.slice(0, -1).join(", ")} e ${cats[cats.length - 1]}`;
  return `Ponte no caminho até ${quais}: ${nome}. Se ela fechar, cada linha mostra a opção que não depende dela.`;
}

/** "Mercado e farmácia numa volta só" quando a economia é material (≥ 300 m e ≥ 15%). */
export function fraseDaCadeia(pacote: EssenciaisDoBairro, p: EssenciaisDoPredio): string | null {
  if (p.modo !== "rede" || !p.cadeia) return null;
  const economia = p.cadeia.separadasM - p.cadeia.m;
  if (economia < 300 || economia / p.cadeia.separadasM < 0.15) return null;
  const m = pacote.locais[p.cadeia.mercado], f = pacote.locais[p.cadeia.farmacia];
  if (!m || !f) return null;
  return `Mercado e farmácia numa volta só (${nomeDe(m)} e ${nomeDe(f)}): ${formatarDistancia(p.cadeia.m)}, em vez de ${formatarDistancia(p.cadeia.separadasM)} em duas idas.`;
}

export const NOTA_DAS_FONTES = "Caminho pelas ruas do mapa a passo médio, a partir da entrada do prédio. Locais do OpenStreetMap, da Prefeitura e do GTFS; pode faltar algum.";
