// VE13 — Ligação de registros de alagamento sem rua oficial (VE06): regras determinísticas v2 contra o vínculo v1,
// candidatos para revisão humana e fila de revisão ordenada por impacto × reuso × incerteza ÷ esforço (VE13.04),
// comparada com amostragem uniforme no mesmo orçamento. Nenhum modelo de linguagem: o experimento com modelo exige
// enviar texto a um serviço externo e credenciais, o que não foi autorizado nesta época.
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/chuva/candidatos.mjs \
//     --relatorio docs/aplicacao/execucoes/VE13/extracao.json
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { criarIndiceDeRuas, vincularRua } from "../observacoes/vinculo.mjs";
import { ponteiroAtual } from "../observacoes/publicar.mjs";
import { classeDoTexto, normalizarParaVinculo, parecidos } from "./normalizar.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const sha = (s) => createHash("sha256").update(s).digest("hex");
const slugDe = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const PILOTO = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];

const PUB = join(RAIZ, ".cache/publicacoes");
const pub = ponteiroAtual(PUB, "chuva");
const observacoes = JSON.parse(gunzipSync(readFileSync(join(PUB, "chuva", "versoes", pub.versao, "observacoes.json.gz"))));
const trechos = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/trechos-de-logradouros.geojson"), "utf8"));
const bairrosGeo = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/bairros-do-recife.geojson"), "utf8"));
const indice = criarIndiceDeRuas(trechos, bairrosGeo);

// Vizinhança de bairros: polígonos com vértices a ≤ 30 m (aproximação; serve só para propor candidatos).
const caixas = new Map();
for (const f of bairrosGeo.features) {
  const s = slugDe(f.properties.EBAIRRNOME);
  const pts = (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.flat() : f.geometry.coordinates).flat();
  caixas.set(s, pts);
}
const vizinhos = new Map();
const slugs = [...caixas.keys()];
for (const a of slugs) {
  const pa = caixas.get(a), set = new Set();
  for (const b of slugs) {
    if (a === b) continue;
    const pb = caixas.get(b);
    let perto = false;
    for (let i = 0; i < pa.length && !perto; i += 4) for (let j = 0; j < pb.length; j += 4) if (Math.abs(pa[i][0] - pb[j][0]) < 0.0003 && Math.abs(pa[i][1] - pb[j][1]) < 0.0003) { perto = true; break; }
    if (perto) set.add(b);
  }
  vizinhos.set(a, set);
}

// Nomes oficiais por bairro (para prefixo e erro de digitação).
const porBairro = new Map();
for (const reg of indice.porCodigo.values()) for (const b of reg.bairros) { if (!porBairro.has(b)) porBairro.set(b, []); porBairro.get(b).push(reg); }

// Impacto: prédios do piloto com ligação forte a até 1 km (linha reta) de algum trecho da rua oficial.
const rede = ponteiroAtual(PUB, "rede-pedestre");
const frentes = JSON.parse(gunzipSync(readFileSync(join(PUB, "rede-pedestre", "versoes", rede.versao, "frentes.json.gz"))))
  .filter((f) => PILOTO.includes(f.area) && f.ligacao && f.classe === "forte" && f.entrada);
const pontosDaRua = new Map();
for (const f of trechos.features) {
  const c = Number(f.properties.CLOGRACODI);
  if (!f.geometry) continue;
  const ls = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
  if (!pontosDaRua.has(c)) pontosDaRua.set(c, []);
  for (const l of ls) for (const p of l) pontosDaRua.get(c).push(p);
}
const KX = 111195 * Math.cos((8.07 * Math.PI) / 180), KY = 111195;
function impacto(codigo) {
  const pts = pontosDaRua.get(codigo) ?? [];
  if (!pts.length) return 0;
  let n = 0;
  for (const f of frentes) {
    const [x, y] = f.entrada;
    if (pts.some((p) => Math.hypot((p[0] - x) * KX, (p[1] - y) * KY) <= 1000)) n += 1;
  }
  return n;
}

const linhas = [];
const contagem = { porMetodoV1: {}, porDecisaoV2: {} };
const alvo = observacoes.filter((o) => o.tipo === "via_alagada");
for (const o of alvo) {
  contagem.porMetodoV1[o.vinculo] = (contagem.porMetodoV1[o.vinculo] ?? 0) + 1;
  const bairro = slugDe(o.bairro);
  let decisao, codigo = null, metodo = null, confianca = null, candidatos = [];
  if (["nome_e_bairro", "tunel_no_bairro", "nome_e_bairro_sem_aresta"].includes(o.vinculo)) { decisao = "ja_ligado_v1"; codigo = o.codigoDaRua ?? null; }
  else {
    const classe = classeDoTexto(o.rua);
    if (classe !== "rua") { decisao = `nao_e_rua:${classe}`; }
    else {
      const norm = normalizarParaVinculo(o.rua);
      const v = vincularRua(indice, norm, bairro);
      if (v.codigo !== null && norm !== o.rua) { decisao = "auto_regra_v2"; codigo = v.codigo; metodo = "normalizacao"; confianca = "alta"; }
      else {
        // Candidatos para revisão: mesmo nome num bairro vizinho; prefixo único no bairro; 1–2 letras de diferença.
        const lista = porBairro.get(bairro) ?? [];
        const fora = v.metodo === "nome_fora_do_bairro" ? vincularRuaEmVizinhos(norm, bairro) : [];
        for (const reg of fora) candidatos.push({ codigo: reg.codigo, nome: reg.nome, metodo: "bairro_vizinho" });
        for (const reg of lista) {
          const p = parecidos(norm, reg.nome);
          if (p) candidatos.push({ codigo: reg.codigo, nome: reg.nome, metodo: p });
        }
        const unicos = [...new Map(candidatos.map((c) => [c.codigo, c])).values()];
        candidatos = unicos;
        decisao = unicos.length === 1 ? "candidato_unico" : unicos.length > 1 ? "candidatos_varios" : "sem_candidato";
        if (unicos.length === 1) { codigo = unicos[0].codigo; metodo = unicos[0].metodo; confianca = "revisar"; }
      }
    }
  }
  contagem.porDecisaoV2[decisao] = (contagem.porDecisaoV2[decisao] ?? 0) + 1;
  linhas.push({ id: o.ids[0], data: o.dataAdministrativa, ano: o.ano, bairro: o.bairro, rua: o.rua, repeticoes: o.repeticoes, v1: o.vinculo, decisao, codigo, metodo, confianca,
    candidatos: candidatos.slice(0, 4).map((c) => ({ codigo: c.codigo, nome: c.nome, metodo: c.metodo })) });
}
function vincularRuaEmVizinhos(norm, bairro) {
  const out = [];
  for (const b of vizinhos.get(bairro) ?? []) { const v = vincularRua(indice, norm, b); if (v.codigo !== null) out.push(indice.porCodigo.get(v.codigo)); }
  return out.filter(Boolean);
}

// Fila de revisão: um item por (texto normalizado, bairro) — uma revisão resolve todas as observações com o mesmo texto.
// Prioridade = impacto (prédios do piloto a ≤ 1 km da rua candidata) × reuso (observações do grupo) × incerteza ÷ esforço
// (1 com candidato único; 2 com vários a escolher). Itens sem candidato ficam fora (não há o que confirmar).
const grupos = new Map();
for (const l of linhas.filter((x) => x.decisao === "candidato_unico" || x.decisao === "candidatos_varios")) {
  const k = `${normalizarParaVinculo(l.rua)}|${slugDe(l.bairro)}`;
  const gr = grupos.get(k) ?? { chave: k, rua: l.rua, bairro: l.bairro, ids: [], observacoes: 0, decisao: l.decisao, candidatos: l.candidatos };
  gr.ids.push(l.id); gr.observacoes += l.repeticoes;
  grupos.set(k, gr);
}
const revisaveis = [...grupos.values()];
for (const g of revisaveis) {
  g.impacto = Math.max(...g.candidatos.map((c) => impacto(c.codigo)), 0);
  g.prioridade = (g.impacto * g.observacoes) / (g.decisao === "candidatos_varios" ? 2 : 1);
}
const fila = [...revisaveis].sort((a, b) => b.prioridade - a.prioridade || sha(a.chave).localeCompare(sha(b.chave)));
// Mesmo orçamento de revisões: prédios do piloto alcançados (soma do impacto dos grupos revistos), fila ordenada ×
// uniforme (média de 200 ordens aleatórias determinísticas). Supõe que o revisor confirma o candidato: é o teto do valor.
const valor = (ls) => ls.reduce((s, l) => s + l.impacto, 0);
const uniforme = (k) => {
  let soma = 0;
  for (let r = 0; r < 200; r++) soma += valor([...revisaveis].sort((a, b) => sha(`${r}|${a.chave}`).localeCompare(sha(`${r}|${b.chave}`))).slice(0, k));
  return Math.round((soma / 200) * 10) / 10;
};
const orcamentos = [3, 5, 10].map((k) => ({ revisoes: k, ordenada: valor(fila.slice(0, k)), uniforme: uniforme(k) }));

// G-EXTRACT v1: todos os itens decididos pela v2 (auto, candidatos, não-rua) com a divisão por ano (2024 = teste).
const conjunto = linhas.filter((l) => l.decisao !== "ja_ligado_v1").map((l) => ({ ...l, divisao: l.ano === 2024 ? "teste" : "desenvolvimento" }));
writeFileSync(join(RAIZ, "docs/aplicacao/evaluation-sets/g-extract.json"), JSON.stringify({ conjunto: "G-EXTRACT", versao: 1, criadoEm: "2026-11-14", epoca: "VE13",
  tarefa: "ligação de registros de alagamento da Defesa Civil (texto do endereço) a logradouro oficial", selecao: "todas as observações de 'via alagada' que a v1 não ligou; 2024 reservado como teste",
  revisao: "nao_revisado", itens: conjunto }, null, 1) + "\n");
const csv = [["ordem", "prioridade", "bairro", "texto_do_registro", "observacoes", "decisao_v2", "candidato_1", "candidato_2", "impacto_predios_piloto_1km", "REVISAO_rua_correta(codigo ou 'nenhuma')", "REVISAO_nota"]];
fila.forEach((g, i) => csv.push([i + 1, g.prioridade, g.bairro, g.rua, g.observacoes, g.decisao, g.candidatos[0] ? `${g.candidatos[0].codigo} ${g.candidatos[0].nome} (${g.candidatos[0].metodo})` : "", g.candidatos[1] ? `${g.candidatos[1].codigo} ${g.candidatos[1].nome}` : "", g.impacto, "", ""]));
writeFileSync(join(RAIZ, "docs/aplicacao/evaluation-sets/g-extract-revisao.csv"), csv.map((x) => x.map((y) => `"${String(y).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n");
const rel = { publicacaoChuva: pub.versao, observacoesDeVia: alvo.length, contagem,
  ligadasV1: linhas.filter((l) => l.decisao === "ja_ligado_v1").length, autoV2: linhas.filter((l) => l.decisao === "auto_regra_v2").length,
  candidatos: linhas.filter((l) => l.decisao === "candidato_unico" || l.decisao === "candidatos_varios").length, gruposParaRevisar: revisaveis.length,
  comImpactoNoPiloto: revisaveis.filter((l) => l.impacto > 0).length, orcamentos,
  exemplosAuto: linhas.filter((l) => l.decisao === "auto_regra_v2").slice(0, 8).map((l) => [l.rua, l.bairro, l.codigo]),
  topoDaFila: fila.slice(0, 8).map((g) => [g.rua, g.bairro, g.candidatos.map((c) => `${c.nome} (${c.metodo})`).join(" | "), g.observacoes, g.impacto, g.prioridade]) };
const out = arg("--relatorio");
if (out) writeFileSync(out, JSON.stringify(rel, null, 1) + "\n");
console.log(JSON.stringify(rel, null, 1));
