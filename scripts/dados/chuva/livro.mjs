// VE06.01 — Livro de eventos de chuva: registros de alagamento da Defesa Civil viram observações com data administrativa,
// precisão de data e de local, tipo (via alagada × imóvel alagado) e modo afetado (não informado pela fonte). Puro.
// Regras: a data é ADMINISTRATIVA (do registro), nunca a hora do evento; linhas só com ano não entram em episódio;
// várias linhas da mesma rua, tipo e data são UMA observação com n repetições (não contam como alagamentos independentes);
// episódio = datas com folga ≤ 1 dia (hipótese inicial de 24 h, VE06.01); ausência de registro não é prova de rua seca.
import { createHash } from "node:crypto";
import { projetar } from "../rede/grafo.mjs";

export const VERSAO_DO_LIVRO = "1";

const dobrar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** "Alagamentos" → via; "Imóveis Alagados" (com acentuação perdida) → imóvel; outro texto de alagamento → outro. */
export function tipoDoAlagamento(ocorrencia) {
  const t = dobrar(ocorrencia);
  if (/im\s?o?veis? alagad|imveis alagad/.test(t)) return "imovel_alagado";
  if (/alagament|inunda/.test(t)) return "via_alagada";
  return "outro_alagamento";
}

/** Data administrativa da linha bruta do CKAN (colunas deslocadas em 2020–2022: a data cai em "Mês"). */
export function dataDaLinha(r) {
  const chaveMes = Object.keys(r).find((k) => /^M.{1,3}s$/.test(k));
  for (const v of [r.Data, chaveMes ? r[chaveMes] : null]) if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return null;
}

/** Lugar nomeado (túnel, comunidade, ocupação) não é logradouro oficial: a precisão do local é outra. */
export function eLugarNomeado(rua) {
  return /^(tunel|comunidade|ocupacao|favela|vila|ilha|fazendinha)\b/.test(dobrar(rua));
}

/** Registro do livro a partir de uma linha já lida ({ano, bairro, rua, ocorrencia, acao}) e da data (ou null). */
export function registroDoLivro(fonte, a, data) {
  const id = createHash("sha256").update(JSON.stringify([fonte, a.ano, data, a.bairro, a.rua, a.ocorrencia, a.acao])).digest("hex").slice(0, 16);
  return {
    id, fonte, ano: a.ano, dataAdministrativa: data, precisaoDaData: data ? "dia" : "ano", horaDoEvento: null,
    tipo: tipoDoAlagamento(a.ocorrencia), modoAfetado: "nao_informado", rua: a.rua, bairro: a.bairro,
    precisaoDoLocal: eLugarNomeado(a.rua) ? "lugar_nomeado" : "rua", ocorrencia: a.ocorrencia, acao: a.acao,
  };
}

/** Mesma rua, bairro, tipo e data → uma observação com `repeticoes` (boletins duplicados não viram vários eventos). */
export function agruparObservacoes(registros) {
  const por = new Map();
  for (const r of registros) {
    const k = [r.tipo, dobrar(r.rua), dobrar(r.bairro), r.dataAdministrativa ?? `ano:${r.ano}`].join("|");
    const o = por.get(k);
    if (o) { o.repeticoes += 1; o.ids.push(r.id); } else por.set(k, { ...r, repeticoes: 1, ids: [r.id] });
  }
  return [...por.values()];
}

const diaNum = (iso) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86400000;

/** Episódios: datas ordenadas, folga ≤ `folgaDias` → mesmo episódio. Devolve Map data → id do episódio ("E2022-05-30"). */
export function episodios(datas, folgaDias = 1) {
  const u = [...new Set(datas.filter(Boolean))].sort();
  const out = new Map();
  let atual = null, ultima = null;
  for (const d of u) {
    if (!atual || diaNum(d) - diaNum(ultima) > folgaDias) atual = `E${d}`;
    out.set(d, atual); ultima = d;
  }
  return out;
}

/**
 * Arestas da rede de caminhada sobre os segmentos dados (meio da aresta a ≤ `toleranciaM` de algum segmento e direção
 * parecida). `grade`: indexarArestas(g). Só segmentos já recortados (ex.: o trecho da rua dentro do bairro do registro).
 */
export function arestasSobre(g, grade, segmentos, { toleranciaM = 12, celula = 0.002 } = {}) {
  const out = new Set();
  for (const s of segmentos) {
    const x0 = Math.floor(Math.min(s.ax, s.bx) / celula) - 1, x1 = Math.floor(Math.max(s.ax, s.bx) / celula) + 1;
    const y0 = Math.floor(Math.min(s.ay, s.by) / celula) - 1, y1 = Math.floor(Math.max(s.ay, s.by) / celula) + 1;
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (const k of grade.get(`${x},${y}`) ?? []) {
      if (out.has(k)) continue;
      const e = g.arestas[k];
      const mx = (g.lon[e.a] + g.lon[e.b]) / 2, my = (g.lat[e.a] + g.lat[e.b]) / 2;
      if (projetar(mx, my, s.ax, s.ay, s.bx, s.by).metros > toleranciaM) continue;
      // Direção: evita pegar travessias perpendiculares que só cruzam a rua.
      const ex = g.lon[e.b] - g.lon[e.a], ey = g.lat[e.b] - g.lat[e.a], sx = s.bx - s.ax, sy = s.by - s.ay;
      const cos = Math.abs(ex * sx + ey * sy) / (Math.hypot(ex, ey) * Math.hypot(sx, sy) || 1);
      if (cos >= 0.7) out.add(k);
    }
  }
  return out;
}

export { dobrar };
