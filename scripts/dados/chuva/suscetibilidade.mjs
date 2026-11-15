// VE14 X04 — Ranking de ruas para revisão de alagamento: baselines simples × regressão logística, com divisão temporal
// (2024 inteiro como teste, todas as tempestades do ano fora do treino) e checagem espacial por metades de bairros.
// Segue docs/aplicacao/execucoes/VE14/preregistro.md, escrito antes de qualquer resultado.
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/chuva/suscetibilidade.mjs \
//     --relatorio docs/aplicacao/execucoes/VE14/x04.json
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { ponteiroAtual } from "../observacoes/publicar.mjs";
import { criarIndiceDeRuas } from "../observacoes/vinculo.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const sha = (s) => createHash("sha256").update(s).digest("hex");
const t0 = Date.now();
const KX = 111195 * Math.cos((8.07 * Math.PI) / 180), KY = 111195;
const dist = (a, b) => Math.hypot((a[0] - b[0]) * KX, (a[1] - b[1]) * KY);

// ——— Ruas oficiais: segmentos, comprimento, pontos de amostra ——————————————————————————————————
const trechos = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/trechos-de-logradouros.geojson"), "utf8"));
const bairrosGeo = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/bairros-do-recife.geojson"), "utf8"));
const indice = criarIndiceDeRuas(trechos, bairrosGeo);
const ruas = new Map();
for (const f of trechos.features) {
  const c = Number(f.properties.CLOGRACODI);
  if (!f.geometry || !Number.isFinite(c)) continue;
  const r = ruas.get(c) ?? { codigo: c, m: 0, pts: [] };
  for (const l of f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates]) for (let i = 0; i + 1 < l.length; i++) {
    const L = dist(l[i], l[i + 1]); r.m += L;
    const n = Math.max(1, Math.round(L / 40));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; r.pts.push([l[i][0] + (l[i + 1][0] - l[i][0]) * t, l[i][1] + (l[i + 1][1] - l[i][1]) * t]); }
  }
  ruas.set(c, r);
}
const universo = [...ruas.values()].filter((r) => r.m >= 50);
const bairroDaRua = (r) => [...(indice.porCodigo.get(r.codigo)?.bairros ?? [])].sort()[0] ?? "sem-bairro";

// ——— Características ————————————————————————————————————————————————————————————————————————
// Água: pontos dos anéis dos polígonos oficiais numa grade de 200 m.
const agua = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/recursos-hidricos.geojson"), "utf8"));
const gradeAgua = new Map();
for (const f of agua.features) {
  if (!f.geometry) continue;
  for (const p of f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]) for (const anel of p) for (const q of anel) {
    const k = `${Math.floor(q[0] / 0.002)},${Math.floor(q[1] / 0.002)}`; if (!gradeAgua.has(k)) gradeAgua.set(k, []); gradeAgua.get(k).push(q);
  }
}
function distAgua(p) {
  const cx = Math.floor(p[0] / 0.002), cy = Math.floor(p[1] / 0.002);
  for (let raio = 1; raio <= 12; raio++) {
    let m = Infinity;
    for (let x = cx - raio; x <= cx + raio; x++) for (let y = cy - raio; y <= cy + raio; y++) for (const q of gradeAgua.get(`${x},${y}`) ?? []) m = Math.min(m, dist(p, q));
    if (m < Infinity && m <= raio * 200) return m;
  }
  return 3000;
}
// Superfície (DSM GLO-30, decímetros numa grade de 0,0014°).
const dem = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/copernicus-dem-glo30-recife.json"), "utf8"));
const dm = typeof dem.decimetros === "string" ? JSON.parse(dem.decimetros) : dem.decimetros;
const { lon0, lat0, passo, cols, lins } = dem.grade;
function altura(p) {
  const c = Math.floor((p[0] - lon0) / passo), l = Math.floor((p[1] - lat0) / passo);
  if (c < 0 || l < 0 || c >= cols || l >= lins) return null;
  const v = dm[l * cols + c];
  return v === null || v === undefined || v < -1000 ? null : v / 10;
}
// Pedidos de drenagem ao 156 (DRENAGEM/MACRODRENAGEM) com data e posição.
const pedidos = [];
for (const y of [2025, 2026]) for (const r of JSON.parse(readFileSync(join(RAIZ, `.cache/dados-recife/156-${y}.json`), "utf8")).registros) {
  if (!["DRENAGEM", "MACRODRENAGEM"].includes(r.GRUPOSERVICO_DESCRICAO) || !Number.isFinite(r.longitude) || !Number.isFinite(r.latitude)) continue;
  pedidos.push({ p: [r.longitude, r.latitude], data: String(r.DATA_DEMANDA).slice(0, 10) });
}
const gradePed = new Map();
pedidos.forEach((x, i) => { const k = `${Math.floor(x.p[0] / 0.001)},${Math.floor(x.p[1] / 0.001)}`; if (!gradePed.has(k)) gradePed.set(k, []); gradePed.get(k).push(i); });
function pedidosAntes(r, ate) {
  const vistos = new Set();
  for (const p of r.pts) {
    const cx = Math.floor(p[0] / 0.001), cy = Math.floor(p[1] / 0.001);
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) for (const i of gradePed.get(`${x},${y}`) ?? []) if (!vistos.has(i) && pedidos[i].data < ate && dist(p, pedidos[i].p) <= 50) vistos.add(i);
  }
  return vistos.size;
}
// Rótulos e histórico: observações "via alagada" do VE06 ligadas a rua.
const PUB = join(RAIZ, ".cache/publicacoes");
const pub = ponteiroAtual(PUB, "chuva");
const obs = JSON.parse(gunzipSync(readFileSync(join(PUB, "chuva", "versoes", pub.versao, "observacoes.json.gz")))).filter((o) => o.tipo === "via_alagada" && o.codigoDaRua != null);
const anoDe = (o) => (o.dataAdministrativa ? Number(o.dataAdministrativa.slice(0, 4)) : o.ano);
const registros = (codigo, ateAno) => obs.filter((o) => o.codigoDaRua === codigo && anoDe(o) < ateAno).length;
const positivas = (anos) => new Set(obs.filter((o) => anos.includes(anoDe(o))).map((o) => o.codigoDaRua));

for (const r of universo) {
  const alts = r.pts.map(altura).filter((x) => x !== null);
  r.altura = alts.length ? alts.reduce((s, x) => s + x, 0) / alts.length : null;
  r.agua = Math.min(...r.pts.slice(0, 40).map(distAgua));
  r.bairro = bairroDaRua(r);
  r.metade = parseInt(sha(`VE14|${r.bairro}`).slice(0, 2), 16) % 2 === 0 ? "A" : "B";
}
const mediana = (xs) => { const s = xs.filter((x) => x !== null).sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const altMed = mediana(universo.map((r) => r.altura));
function caracteristicas(r, ateAno) {
  return [registros(r.codigo, ateAno), r.agua, r.altura ?? altMed, pedidosAntes(r, `${ateAno}-01-01`)];
}

// ——— Rankers ——————————————————————————————————————————————————————————————————————————————
const BASES = {
  B1_registros_anteriores: (x) => x[0],
  B2_perto_da_agua: (x) => -x[1],
  B3_superficie_baixa: (x) => -x[2],
  B4_pedidos_de_drenagem: (x) => x[3],
};
function padronizar(X) {
  const m = X[0].map((_, j) => X.reduce((s, x) => s + x[j], 0) / X.length);
  const d = X[0].map((_, j) => Math.sqrt(X.reduce((s, x) => s + (x[j] - m[j]) ** 2, 0) / X.length) || 1);
  return { m, d, f: (x) => x.map((v, j) => (v - m[j]) / d[j]) };
}
function treinarLogistica(X, y, { l2 = 1.0, passos = 2000, taxa = 0.5 } = {}) {
  const p = padronizar(X), Z = X.map(p.f), n = Z.length, k = Z[0].length;
  let w = new Array(k).fill(0), b = 0;
  // Peso maior para os poucos positivos (classe rara), fixo e documentado.
  const pos = y.filter(Boolean).length, wp = (n - pos) / Math.max(pos, 1);
  for (let it = 0; it < passos; it++) {
    const gw = new Array(k).fill(0); let gb = 0;
    for (let i = 0; i < n; i++) {
      const z = Z[i].reduce((s, v, j) => s + v * w[j], b), q = 1 / (1 + Math.exp(-z)), e = (q - (y[i] ? 1 : 0)) * (y[i] ? wp : 1);
      for (let j = 0; j < k; j++) gw[j] += e * Z[i][j];
      gb += e;
    }
    w = w.map((wj, j) => wj - taxa * (gw[j] / n + (l2 * wj) / n));
    b -= taxa * gb / n;
  }
  return { w, b, pontuar: (x) => p.f(x).reduce((s, v, j) => s + v * w[j], b) };
}
function avaliar(ranking, positivosSet, ks = [20, 50, 100]) {
  const out = {};
  for (const k of ks) { const topo = ranking.slice(0, k); const acertos = topo.filter((r) => positivosSet.has(r.codigo)).length; out[`p@${k}`] = Math.round((acertos / k) * 1000) / 1000; out[`acertos@${k}`] = acertos; }
  out.recall50 = Math.round((out["acertos@50"] / Math.max(positivosSet.size, 1)) * 1000) / 1000;
  return out;
}
const ordenar = (ruasLista, score) => [...ruasLista].sort((a, b) => score(b) - score(a) || sha(`o|${a.codigo}`).localeCompare(sha(`o|${b.codigo}`)));

// Temporal: treino rótulos 2022–2023 com características < 2022; teste rótulos 2024 com características < 2024.
const treinoPos = positivas([2022, 2023]), testePos = positivas([2024]);
const Xtr = universo.map((r) => caracteristicas(r, 2022)), ytr = universo.map((r) => treinoPos.has(r.codigo));
const modelo = treinarLogistica(Xtr, ytr);
const Xte = new Map(universo.map((r) => [r.codigo, caracteristicas(r, 2024)]));
const temporal = {};
for (const [nome, f] of Object.entries(BASES)) temporal[nome] = avaliar(ordenar(universo, (r) => f(Xte.get(r.codigo))), testePos);
temporal.M1_logistica = avaliar(ordenar(universo, (r) => modelo.pontuar(Xte.get(r.codigo))), testePos);

// Espacial: treina numa metade de bairros (2022–2023) e avalia na outra (2024), nos dois sentidos.
const espacial = {};
for (const [treino, teste] of [["A", "B"], ["B", "A"]]) {
  const tr = universo.filter((r) => r.metade === treino), te = universo.filter((r) => r.metade === teste);
  const m = treinarLogistica(tr.map((r) => caracteristicas(r, 2022)), tr.map((r) => treinoPos.has(r.codigo)));
  const pos = new Set([...testePos].filter((c) => te.some((r) => r.codigo === c)));
  const res = { positivos: pos.size };
  for (const [nome, f] of Object.entries(BASES)) res[nome] = avaliar(ordenar(te, (r) => f(Xte.get(r.codigo))), pos, [20, 50]);
  res.M1_logistica = avaliar(ordenar(te, (r) => m.pontuar(Xte.get(r.codigo))), pos, [20, 50]);
  espacial[`treino_${treino}_teste_${teste}`] = res;
}

// Portão pré-registrado.
const melhorBase = Object.keys(BASES).sort((a, b) => temporal[b]["acertos@50"] - temporal[a]["acertos@50"])[0];
const mb = temporal[melhorBase]["acertos@50"], mm = temporal.M1_logistica["acertos@50"];
const espacialOk = Object.values(espacial).every((e) => e.M1_logistica["acertos@50"] >= e[melhorBase]["acertos@50"]);
let decisao;
if (testePos.size < 15) decisao = "adiar: teste com menos de 15 ruas positivas (sem poder)";
else if (mm >= mb * 1.1 && mm - mb >= 2 && espacialOk) decisao = "promover M1 sobre a melhor base (sem produto: falta teste de utilidade, VE14.03)";
else decisao = `rejeitar M1; manter ${melhorBase} como regra de prioridade de revisão`;
const rel = {
  preregistro: "docs/aplicacao/execucoes/VE14/preregistro.md", publicacaoChuva: pub.versao, ruasNoUniverso: universo.length,
  positivosTreino_2022_2023: treinoPos.size, positivosTeste_2024: testePos.size, pedidosDeDrenagem: pedidos.length,
  pesos: { ordem: ["registros_anteriores", "distancia_agua_m", "superficie_m", "pedidos_drenagem_50m"], w: modelo.w.map((x) => Math.round(x * 1000) / 1000), b: Math.round(modelo.b * 1000) / 1000 },
  temporal, espacial, melhorBase, decisao,
  ms: Date.now() - t0, memoriaPicoMB: Math.round(process.resourceUsage().maxRSS / 1024),
};
const out = arg("--relatorio");
if (out) writeFileSync(out, JSON.stringify(rel, null, 1) + "\n");
console.log(JSON.stringify(rel, null, 1));
