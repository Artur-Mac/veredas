// "Se a rua alagar" (VE06.03): consequência para o caminho a pé de um alagamento registrado pela Defesa Civil numa rua
// que o caminho diário do prédio usa. Primeiro o que muda para a pessoa (minutos, outro lugar, outro caminho); o registro
// fica atrás de um toque. Só desenha o que scripts/dados/chuva/rodar-chuva.mjs calculou.
import { z } from "zod";
import { lerCamada } from "../camadas";
import { ARQUIVOS_DA_CHUVA, VERSAO_DA_CHUVA } from "./chuvaGerado";

/** O arquivo de camada do bairro (fora do bundle, D036), ou null fora do piloto. */
export const arquivoDaChuva = (bairro: string | null | undefined): string | null => (bairro ? ARQUIVOS_DA_CHUVA[bairro] ?? null : null);

const trecho = z.strictObject({ l: z.number().int().nonnegative(), m: z.number().nonnegative(), min: z.number().nonnegative() });
export const esquemaChuvaDoBairro = z.strictObject({
  versao: z.string(),
  geradoEm: z.string(),
  rede: z.string(),
  velocidadeMps: z.number().positive(),
  limiteM: z.number().positive(),
  fonte: z.string(),
  catalogo: z.string(),
  observacoes: z.array(z.strictObject({
    data: z.string().nullable(), ano: z.number().int(), tipo: z.enum(["via_alagada", "imovel_alagado", "outro_alagamento"]), rua: z.string(), bairro: z.string(), ocorrencia: z.string(), repeticoes: z.number().int().positive(),
    episodio: z.string().nullable(), ruaLonga: z.boolean(), trechoM: z.number().nullable(), lugarNomeado: z.boolean(),
  })),
  locais: z.array(z.strictObject({ nome: z.string().nullable(), categoria: z.enum(["mercado", "farmacia", "transporte"]) })),
  predios: z.record(z.string(), z.array(z.strictObject({ c: z.enum(["mercado", "farmacia", "transporte"]), o: z.number().int().nonnegative(), a: trecho, d: trecho.nullable() }))),
  ruaPropria: z.record(z.string(), z.array(z.number().int().nonnegative())),
  // Formato 3: desvios < 3 min (histórico do caminho), ruas e histórico da rua confirmada do prédio.
  pequenos: z.record(z.string(), z.array(z.strictObject({ c: z.enum(["mercado", "farmacia", "transporte"]), o: z.number().int().nonnegative(), mais: z.number().nonnegative() }))),
  ruas: z.array(z.strictObject({ codigo: z.number().int(), nome: z.string() })),
  historico: z.record(z.string(), z.strictObject({
    r: z.number().int().nonnegative(), o: z.array(z.number().int().nonnegative()),
    pc: z.strictObject({ m: z.number().nonnegative(), precisao: z.string().nullable() }).nullable(), tc: z.number().nonnegative().nullable(),
  })),
});
export type ChuvaDoBairro = z.infer<typeof esquemaChuvaDoBairro>;

const cache = new Map<string, ChuvaDoBairro | null>();
export function chuvaDoBairro(bairro: string | null | undefined): ChuvaDoBairro | null {
  if (!bairro) return null;
  if (!cache.has(bairro)) {
    const arquivo = arquivoDaChuva(bairro);
    const p = arquivo ? esquemaChuvaDoBairro.safeParse(lerCamada(arquivo)) : null;
    cache.set(bairro, p?.success && p.data.versao === VERSAO_DA_CHUVA ? p.data : null);
  }
  return cache.get(bairro) ?? null;
}

const ARTIGO: Record<string, string> = { mercado: "o mercado", farmacia: "a farmácia", transporte: "o ponto de ônibus" };
const MAIS_PERTO: Record<string, string> = { mercado: "o mercado mais perto", farmacia: "a farmácia mais perto", transporte: "o ponto mais perto" };
const minutos = (m: number) => (m < 1 ? "menos de 1 min" : `${Math.round(m)} min`);
function dataBr(iso: string | null, ano: number): string {
  if (!iso) return `em ${ano} (sem dia no registro)`;
  return `em ${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}
function quando(obs: ChuvaDoBairro["observacoes"]): string {
  const ds = [...new Set(obs.map((o) => dataBr(o.data, o.ano)))];
  return ds.length === 1 ? ds[0]! : `${ds.slice(0, -1).join(", ")} e ${ds.at(-1)!.replace(/^em /, "")}`;
}
function nomeDaRua(rua: string): string {
  return rua.replace(/^Tunel\b/i, "Túnel").replace(/\bGov\.\s/, "Governador ").replace(/\bBarao\b/, "Barão").replace(/\bLeao\b/, "Leão");
}
const nomeDoLocal = (l: ChuvaDoBairro["locais"][number] | undefined) => (l?.nome ? l.nome.replace(/\s+-\s+\d+$/, "") : null);

export type ConsequenciaDaChuva = {
  /** O que muda para a pessoa, numa frase. */
  frase: string;
  /** Registro e método, para quem tocar em "Ver o registro". */
  registro: string;
  minutosAMais: number | null;
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const lista = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}`);

/**
 * Meses e anos com registro: datados viram "mai/2022"; só com ano viram "2015". A leitura sazonal só aparece quando a
 * série sustenta (≥ 4 datas distintas em ≥ 2 anos, todas numa janela de até 5 meses do ano).
 */
export function mesesEAnos(obs: { data: string | null; ano: number }[]): { rotulos: string[]; sazonal: string | null } {
  const datadas = [...new Set(obs.filter((o) => o.data).map((o) => o.data!.slice(0, 7)))].sort();
  const anosDatados = new Set(datadas.map((d) => d.slice(0, 4)));
  const soAno = [...new Set(obs.filter((o) => !o.data).map((o) => String(o.ano)))].filter((a) => !anosDatados.has(a));
  const rotulos = [...soAno.map((a) => ({ k: `${a}-00`, r: a })), ...datadas.map((d) => ({ k: d, r: `${MESES[Number(d.slice(5, 7)) - 1]}/${d.slice(0, 4)}` }))]
    .sort((a, b) => a.k.localeCompare(b.k)).map((x) => x.r);
  let sazonal: string | null = null;
  const distintas = new Set(obs.map((o) => o.data).filter(Boolean));
  if (distintas.size >= 4 && anosDatados.size >= 2) {
    const meses = [...new Set(datadas.map((d) => Number(d.slice(5, 7))))].sort((a, b) => a - b);
    if (meses.at(-1)! - meses[0]! + 1 <= 5) sazonal = `todos os registros com data caíram entre ${MESES[meses[0]! - 1]} e ${MESES[meses.at(-1)! - 1]}`;
  }
  return { rotulos, sazonal };
}

const SEM_BLOQUEIO = "Nenhuma dessas fontes diz se a passagem a pé foi bloqueada, nem por quanto tempo.";
const PERGUNTA = "Na visita, pergunte até onde a água chega na entrada e por quanto tempo ela fica.";

/**
 * Consequências para o prédio, a maior primeiro (no máximo `limite`); o histórico da rua confirmada do prédio à parte
 * (`ruaPropria`), mesmo quando o desvio calculado é pequeno; e os desvios pequenos do caminho numa linha (`pequenos`).
 * O desvio é um cenário condicional: só vale se a água bloquear a passagem, o que nenhuma fonte atual registra.
 */
export function chuvaDoPredio(bairro: string | null | undefined, predioId: string | null | undefined, limite = 3): { linhas: ConsequenciaDaChuva[]; ruaPropria: ConsequenciaDaChuva | null; pequenos: ConsequenciaDaChuva | null } | null {
  const p = chuvaDoBairro(bairro);
  if (!p || !predioId) return null;
  const cenarios = p.predios[predioId] ?? [];
  const propria = p.ruaPropria[predioId] ?? [];
  const hist = p.historico[predioId] ?? null;
  const peq = p.pequenos[predioId] ?? [];
  if (!cenarios.length && !propria.length && !hist && !peq.length) return null;
  const registroDe = (obs: ChuvaDoBairro["observacoes"]) => {
    const o = obs[0]!;
    const rep = obs.reduce((s, x) => s + x.repeticoes, 0);
    return `${p.fonte}: "${o.ocorrencia}" em ${nomeDaRua(o.rua)}, ${o.bairro}, ${quando(obs)}${rep > obs.length ? ` (${rep} linhas no registro, contadas como ${obs.length === 1 ? "uma ocorrência" : `${obs.length} ocorrências`})` : ""}. ` +
      "A data é a do registro, não a hora da chuva, e o registro não diz se a passagem a pé foi bloqueada: o desvio é um cenário, calculado supondo o trecho intransitável a pé" +
      (o.ruaLonga ? ` (a rua é longa e a fonte não diz o ponto; consideramos os ${String(Math.round((o.trechoM ?? 0) / 100) / 10).replace(".", ",")} km dela dentro do bairro)` : "") +
      ". Não ter registro não quer dizer que a rua não alaga.";
  };
  // Agrupa a mesma rua (ex.: o túnel com dois registros) por categoria.
  const grupos = new Map<string, { c: string; obs: ChuvaDoBairro["observacoes"]; a: (typeof cenarios)[number]["a"]; d: (typeof cenarios)[number]["d"] }>();
  for (const s of cenarios) {
    const o = p.observacoes[s.o]!;
    const k = `${s.c}|${o.rua}`;
    const g = grupos.get(k);
    if (g) g.obs.push(o); else grupos.set(k, { c: s.c, obs: [o], a: s.a, d: s.d });
  }
  for (const g of grupos.values()) g.obs.sort((x, y) => (x.data ?? String(x.ano)).localeCompare(y.data ?? String(y.ano)));
  const linhas = [...grupos.values()].map((g): ConsequenciaDaChuva => {
    const rua = nomeDaRua(g.obs[0]!.rua);
    const art = /^túnel/i.test(rua) ? "no" : "na";
    const datas = g.obs.map((o) => o.data).filter(Boolean);
    const como = datas.length > 1 ? `como os de ${quando(g.obs).replace(/^em /, "")}` : `como o de ${quando(g.obs).replace(/^em /, "")}`;
    const se = `Se um alagamento ${como} bloquear a passagem a pé ${art} ${rua}`;
    let frase: string;
    if (!g.d) frase = `${se}, nenhum lugar dessa categoria ficaria a até 2 km a pé: hoje ${ARTIGO[g.c]} está a ${minutos(g.a.min)}.`;
    else if (g.d.l === g.a.l) frase = `${se}, o caminho a pé até ${ARTIGO[g.c]} passaria de ${minutos(g.a.min)} para ${minutos(g.d.min)}, por outro caminho.`;
    else {
      const nome = nomeDoLocal(p.locais[g.d.l]);
      frase = `${se}, ${MAIS_PERTO[g.c]} a pé passaria a ser ${nome ?? "outro, sem nome no mapa"}, a ${minutos(g.d.min)} (hoje ${minutos(g.a.min)}).`;
    }
    return { frase, registro: registroDe(g.obs), minutosAMais: g.d ? g.d.min - g.a.min : null };
  }).sort((x, y) => (y.minutosAMais ?? Infinity) - (x.minutosAMais ?? Infinity));

  // Histórico da rua confirmada do prédio: ocorrência na via, imóvel alagado e catálogo da Prefeitura são fatos distintos.
  let ruaPropria: ConsequenciaDaChuva | null = null;
  if (hist) {
    const rua = p.ruas[hist.r]?.nome ?? "";
    const obs = hist.o.map((i) => p.observacoes[i]!);
    const via = obs.filter((o) => o.tipo === "via_alagada"), imovel = obs.filter((o) => o.tipo === "imovel_alagado");
    const partes: string[] = [];
    if (via.length) partes.push(`alagamento na via em ${lista(mesesEAnos(via).rotulos)}`);
    if (imovel.length) partes.push(`imóvel alagado na rua em ${lista(mesesEAnos(imovel).rotulos)} (o registro não diz qual imóvel)`);
    const frases: string[] = [];
    if (partes.length) frases.push(`Na rua do prédio (${rua}), a Defesa Civil registrou ${partes.join(", e ")}.`);
    else frases.push(`Na rua do prédio (${rua}), a Defesa Civil não tem atendimento de alagamento de 2014 a 2024.`);
    const saz = mesesEAnos(obs).sazonal;
    if (saz) frases.push(`${saz[0]!.toUpperCase()}${saz.slice(1)}.`);
    if (hist.pc) frases.push(`A Prefeitura cataloga um ponto de alagamento nesta rua a ${Math.round(hist.pc.m / 10) * 10} m da entrada (${/interse/i.test(hist.pc.precisao ?? "") ? "num cruzamento" : "posição aproximada"}).`);
    if (hist.tc !== null) frases.push(hist.tc <= 30 ? "O trecho em frente ao prédio está na lista de ruas de alagamento da Prefeitura (2026)." : `Um trecho desta rua a ${Math.round(hist.tc / 10) * 10} m da entrada está na lista de ruas de alagamento da Prefeitura (2026).`);
    frases.push(SEM_BLOQUEIO, PERGUNTA);
    // Um registro por tipo e grafia da rua: "Imóveis Alagados" e "Alagamentos" não se misturam na mesma frase.
    const porGrafia = new Map<string, ChuvaDoBairro["observacoes"]>();
    for (const o of obs) { const k = `${o.tipo}|${o.rua}`; porGrafia.set(k, [...(porGrafia.get(k) ?? []), o]); }
    const fontes = [
      ...[...porGrafia.values()].map((g) => registroDe(g).replace(/: o desvio é um cenário, calculado supondo o trecho intransitável a pé/, "").replace(/ Não ter registro não quer dizer que a rua não alaga\.$/, "")),
      obs.length ? "Não ter registro não quer dizer que a rua não alaga." : null,
      hist.pc || hist.tc !== null ? `${p.catalogo}. O catálogo não traz data de evento, recorrência, lâmina d'água nem influência da maré (campos vazios na fonte); o critério da lista de ruas não está publicado.` : null,
    ].filter(Boolean).join(" ");
    ruaPropria = { frase: frases.join(" "), registro: fontes, minutosAMais: null };
  } else if (propria.length) {
    // A entrada liga num trecho com registro, mas a rua do prédio no cadastro é outra (ex.: esquina ou túnel).
    const obs = propria.map((i) => p.observacoes[i]!);
    ruaPropria = {
      frase: `O trecho em frente à entrada (${nomeDaRua(obs[0]!.rua)}) tem alagamento registrado ${quando(obs)}. ${SEM_BLOQUEIO} ${PERGUNTA}`,
      registro: registroDe(obs).replace(/: o desvio é um cenário, calculado supondo o trecho intransitável a pé/, ""), minutosAMais: null,
    };
  }

  // Desvios pequenos: a rua do caminho tem registro, mas o desvio é de menos de 3 min.
  let pequenos: ConsequenciaDaChuva | null = null;
  const jaDitas = new Set(linhas.map((l) => l.frase));
  const porRua = new Map<string, ChuvaDoBairro["observacoes"]>();
  const categorias = new Set<string>();
  for (const s of peq) {
    const o = p.observacoes[s.o]!;
    const k = nomeDaRua(o.rua);
    if ([...jaDitas].some((f) => f.includes(k))) continue;
    categorias.add(s.c);
    if (!porRua.has(k)) porRua.set(k, []);
    if (!porRua.get(k)!.includes(o)) porRua.get(k)!.push(o);
  }
  if (porRua.size) {
    const itens = [...porRua.entries()].slice(0, 3).map(([rua, obs]) => `${rua} (${lista(mesesEAnos(obs).rotulos)})`);
    const resto = porRua.size - itens.length;
    pequenos = {
      frase: `No caminho a pé até ${lista(["mercado", "farmacia", "transporte"].filter((c) => categorias.has(c)).map((c) => ARTIGO[c]!))} também há ${porRua.size === 1 ? "uma rua" : "ruas"} com alagamento registrado: ${lista(itens)}${resto > 0 ? ` e mais ${resto}` : ""}. Se ${porRua.size === 1 ? "ela ficar intransitável" : "ficarem intransitáveis"}, o desvio é de menos de 3 min.`,
      registro: `${p.fonte}. O desvio foi calculado para mercado, farmácia e ponto de ônibus, supondo o trecho intransitável a pé; o registro não diz se a passagem foi bloqueada.`,
      minutosAMais: Math.max(...peq.map((x) => x.mais)),
    };
  }
  return { linhas: linhas.slice(0, limite), ruaPropria, pequenos };
}
