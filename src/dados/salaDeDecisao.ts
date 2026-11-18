// Sala de decisão compartilhada (15/11/2026): "Compartilhar comparação (voto e notas)" sem servidor nem conta. As 2 ou 3
// análises viram um pacote compacto (JSON → UTF-8 → base64url) no fragmento do link (`#s=…`), que não vai para servidor
// nenhum. A outra pessoa abre no navegador dela, marca "Faz sentido / Dúvida / Descartar" e uma nota por imóvel, e manda
// de volta um link de resposta (`#r=…`); quem compartilhou importa e as respostas viram linhas do diário de cada análise.
// Fica de fora, de propósito: caderno, visita, perfil da casa (acessibilidade, orçamento), fotos e documentos.
import { z } from "zod";
import type { AnaliseV2 } from "./contratos";
import { cadernoVazio } from "./caderno";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
/** UTF-8 à mão: não depende de TextEncoder/TextDecoder no motor JS do aparelho. */
function utf8(texto: string): number[] {
  const out: number[] = [];
  for (const ch of texto) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}
function deUtf8(b: readonly number[]): string {
  let s = "";
  for (let i = 0; i < b.length;) {
    const x = b[i]!;
    const n = x < 0x80 ? 1 : x >> 5 === 6 ? 2 : x >> 4 === 14 ? 3 : x >> 3 === 30 ? 4 : 0;
    if (!n || i + n > b.length) throw new Error("Link corrompido.");
    let c = n === 1 ? x : x & (0xff >> (n + 1));
    for (let k = 1; k < n; k++) { const y = b[i + k]!; if (y >> 6 !== 2) throw new Error("Link corrompido."); c = (c << 6) | (y & 63); }
    s += String.fromCodePoint(c);
    i += n;
  }
  return s;
}
export function paraBase64Url(texto: string): string {
  const bytes = utf8(texto);
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b, c] = [bytes[i]!, bytes[i + 1], bytes[i + 2]];
    s += B64[a >> 2]! + B64[((a & 3) << 4) | ((b ?? 0) >> 4)]!;
    if (b !== undefined) s += B64[((b & 15) << 2) | ((c ?? 0) >> 6)]!;
    if (c !== undefined) s += B64[c & 63]!;
  }
  return s;
}
export function deBase64Url(s: string): string {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("Link corrompido.");
  const v = [...s].map((ch) => B64.indexOf(ch));
  const bytes: number[] = [];
  for (let i = 0; i < v.length; i += 4) {
    const [a, b, c, d] = [v[i]!, v[i + 1], v[i + 2], v[i + 3]];
    if (b === undefined) throw new Error("Link corrompido.");
    bytes.push((a << 2) | (b >> 4));
    if (c !== undefined) bytes.push(((b & 15) << 4) | (c >> 2));
    if (d !== undefined) bytes.push(((c! & 3) << 6) | d);
  }
  return deUtf8(bytes);
}

export const LIMITE_DO_LINK = 12_000;
const numero = z.number().finite().nullable();
const esquemaImovel = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]{1,60}$/),
  nome: z.string().max(120),
  modalidade: z.enum(["aluguel", "compra"]),
  bairro: z.string().max(120),
  url: z.string().max(600),
  preco: numero, condominio: numero, iptu: numero, area: numero, quartos: numero, vagas: numero, andar: numero,
});
export const esquemaSala = z.strictObject({ v: z.literal(1), sala: z.string().regex(/^[a-z0-9]{6,16}$/), criadaEm: z.iso.datetime(), imoveis: z.array(esquemaImovel).min(2).max(3) });
export type Sala = z.infer<typeof esquemaSala>;
export const REACOES = [
  { valor: "faz_sentido", rotulo: "Faz sentido" },
  { valor: "duvida", rotulo: "Dúvida" },
  { valor: "descartar", rotulo: "Descartar" },
] as const;
export type Reacao = (typeof REACOES)[number]["valor"];
export const esquemaResposta = z.strictObject({
  v: z.literal(1), sala: z.string().regex(/^[a-z0-9]{6,16}$/), autor: z.string().trim().max(40), em: z.iso.datetime(),
  respostas: z.array(z.strictObject({ id: z.string().regex(/^[a-z0-9-]{1,60}$/), reacao: z.enum(["faz_sentido", "duvida", "descartar"]).nullable(), nota: z.string().max(500) })).max(3),
});
export type RespostaDaSala = z.infer<typeof esquemaResposta>;

/** Valor declarado só quando conhecido e não "a confirmar": o desconhecido viaja como null, nunca 0. */
const conhecido = (d: { valor: number | null; aConfirmar: boolean }) => (d.aConfirmar ? null : d.valor);

function idDaSala(analises: readonly AnaliseV2[], criadaEm: string): string {
  let h = 2166136261;
  for (const ch of `${analises.map((a) => a.id).join("|")}|${criadaEm}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h.toString(36).padStart(7, "0").slice(0, 12);
}

export function montarSala(analises: readonly AnaliseV2[], criadaEm: string): Sala {
  if (analises.length < 2 || analises.length > 3) throw new Error("A sala leva 2 ou 3 imóveis.");
  return esquemaSala.parse({
    v: 1, sala: idDaSala(analises, criadaEm), criadaEm,
    imoveis: analises.map((a) => ({
      id: a.id, nome: a.nome, modalidade: a.modalidade, bairro: a.bairroTexto || a.bairro || "", url: a.url.slice(0, 600),
      preco: conhecido(a.declarados.preco), condominio: conhecido(a.declarados.condominio), iptu: conhecido(a.declarados.iptu),
      area: conhecido(a.declarados.area), quartos: conhecido(a.declarados.quartos), vagas: conhecido(a.declarados.vagas), andar: conhecido(a.declarados.andar),
    })),
  });
}

export const fragmentoDaSala = (s: Sala) => `s=${paraBase64Url(JSON.stringify(s))}`;
export const fragmentoDaResposta = (r: RespostaDaSala) => `r=${paraBase64Url(JSON.stringify(esquemaResposta.parse(r)))}`;

export const esquemaResumoCompartilhado = z.strictObject({
  v: z.literal(1),
  n: z.string().max(80),
  e: z.string().max(120),
  m: z.enum(["aluguel", "compra"]),
  p: z.number().finite().nullable(),
  mb: z.number().finite().nullable(),
  s: z.string().max(100),
});
export type ResumoCompartilhado = z.infer<typeof esquemaResumoCompartilhado>;

export type LidoDoLink =
  | { tipo: "sala"; sala: Sala }
  | { tipo: "resposta"; resposta: RespostaDaSala }
  | { tipo: "resumo"; resumo: ResumoCompartilhado }
  | { tipo: "erro"; motivo: string }
  | { tipo: "vazio" };
/** Lê `#s=…`, `#r=…` ou `#v=…` (ou `s=`/`r=`/`v=` sem o #). Nada fora do esquema passa. */
export function lerFragmento(fragmento: string): LidoDoLink {
  const f = fragmento.replace(/^#/, "").trim();
  if (!f) return { tipo: "vazio" };
  if (f.length > LIMITE_DO_LINK) return { tipo: "erro", motivo: "Link grande demais para uma sala de decisão." };
  const m = /^(s|r|v)=([A-Za-z0-9_-]+)$/.exec(f);
  if (!m) return { tipo: "erro", motivo: "Este link não é de uma sala de decisão do Vereda." };
  try {
    const dados = JSON.parse(deBase64Url(m[2]!)) as unknown;
    if (m[1] === "s") { const p = esquemaSala.safeParse(dados); return p.success ? { tipo: "sala", sala: p.data } : { tipo: "erro", motivo: "Link de sala incompleto ou alterado." }; }
    if (m[1] === "v") { const p = esquemaResumoCompartilhado.safeParse(dados); return p.success ? { tipo: "resumo", resumo: p.data } : { tipo: "erro", motivo: "Link de dossiê resumido incompleto ou alterado." }; }
    const p = esquemaResposta.safeParse(dados);
    return p.success ? { tipo: "resposta", resposta: p.data } : { tipo: "erro", motivo: "Link de resposta incompleto ou alterado." };
  } catch {
    return { tipo: "erro", motivo: "Link corrompido: copie o link inteiro de novo." };
  }
}

const ROTULO_DA_REACAO: Record<Reacao, string> = { faz_sentido: "Faz sentido", duvida: "Dúvida", descartar: "Descartar" };

/**
 * As respostas viram uma linha no diário de cada análise que ainda existe no caderno. Devolve só as análises que mudam;
 * uma resposta já importada (mesmo texto) não entra duas vezes.
 */
export function importarResposta(r: RespostaDaSala, lista: readonly AnaliseV2[], agora: string): AnaliseV2[] {
  const out: AnaliseV2[] = [];
  for (const x of r.respostas) {
    const a = lista.find((y) => y.id === x.id);
    if (!a || (!x.reacao && !x.nota.trim())) continue;
    const texto = `Sala de decisão · ${r.autor.trim() || "Outra pessoa"}: ${x.reacao ? ROTULO_DA_REACAO[x.reacao] : "sem reação"}${x.nota.trim() ? ` — ${x.nota.trim()}` : ""}`.slice(0, 2000);
    const c = a.caderno ?? cadernoVazio();
    if (c.diario.some((d) => d.texto === texto) || c.diario.length >= 200) continue;
    out.push({ ...a, atualizadaEm: agora, caderno: { ...c, diario: [...c.diario, { id: `diario-sala-${r.sala}-${Date.parse(agora).toString(36)}-${out.length}`, em: agora, texto }] } });
  }
  return out;
}
