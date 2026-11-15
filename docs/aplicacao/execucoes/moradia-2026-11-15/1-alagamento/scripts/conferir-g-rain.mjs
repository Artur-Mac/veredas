// Conferência documental do G-RAIN (15/11/2026) contra o catálogo do eSIG e o próprio livro. NÃO é revisão humana:
// não toca nas colunas REVISAO_* de g-rain-revisao.csv. Grava g-rain-conferencia-2026-11-15.csv ao lado do relatório.
//   node scripts... conferir-g-rain.mjs  (lê chuva.json gerado por rodar-chuva.mjs --relatorio)
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
const RAIZ = process.cwd();
const AQUI = "docs/aplicacao/execucoes/moradia-2026-11-15/1-alagamento";
const rel = JSON.parse(readFileSync(join(RAIZ, AQUI, "chuva.json"), "utf8"));
const g = JSON.parse(readFileSync(join(RAIZ, "docs/aplicacao/evaluation-sets/g-rain.json"), "utf8"));
const pub = JSON.parse(readFileSync(join(RAIZ, ".cache/publicacoes/chuva/atual.json"), "utf8")).versao;
const obs = JSON.parse(gunzipSync(readFileSync(join(RAIZ, ".cache/publicacoes/chuva/versoes", pub, "observacoes.json.gz"))));
const slug = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const trechoPorCodigo = new Map(rel.esig.detalheTrechos.map((t) => [t.codigo, t]));
const pontosPorCodigo = new Map();
for (const p of rel.esig.detalhePontos) if (p.codigo !== null) pontosPorCodigo.set(p.codigo, [...(pontosPorCodigo.get(p.codigo) ?? []), p]);
const linhas = [["caso", "divisao", "data", "rua", "bairro", "vinculo", "codigo", "esig_trecho_mesma_rua", "esig_trecho_no_bairro", "esig_pontos_mesma_rua", "outras_datas_mesma_rua_no_livro", "conferencia"]];
const resumo = {};
for (const c of g.casos) {
  const t = c.codigoDaRua !== null ? trechoPorCodigo.get(c.codigoDaRua) : null;
  const pts = c.codigoDaRua !== null ? pontosPorCodigo.get(c.codigoDaRua) ?? [] : [];
  const outras = c.codigoDaRua === null ? [] : [...new Set(obs.filter((o) => o.codigoDaRua === c.codigoDaRua && slug(o.bairro) === slug(c.bairro) && o.tipo === "via_alagada" && (o.dataAdministrativa ?? `ano ${o.ano}`) !== (c.data ?? `ano ${c.ano}`)).map((o) => o.dataAdministrativa ?? `ano ${o.ano}`))].sort();
  const noBairro = Boolean(t && t.bairros.includes(slug(c.bairro)));
  let conf;
  if (c.codigoDaRua === null) conf = "sem_vinculo_a_rua_oficial";
  else if (noBairro || pts.some((p) => p.bairroDoPoligono === slug(c.bairro))) conf = "rua_no_catalogo_da_prefeitura";
  else if (outras.length) conf = "recorrente_so_no_livro";
  else conf = "sem_corroboracao_independente";
  resumo[conf] = (resumo[conf] ?? 0) + 1;
  linhas.push([c.id, c.divisao, c.data ?? `ano ${c.ano}`, c.rua, c.bairro, c.vinculo, c.codigoDaRua ?? "", t ? "sim" : "nao", noBairro ? "sim" : "nao", pts.length, outras.join(" "), conf]);
}
writeFileSync(join(RAIZ, AQUI, "g-rain-conferencia-2026-11-15.csv"), linhas.map((l) => l.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n");
console.log(JSON.stringify({ casos: g.casos.length, resumo }, null, 1));
