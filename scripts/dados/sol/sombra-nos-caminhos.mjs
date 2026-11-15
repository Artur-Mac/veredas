// VE07.03 — Experimento: caminho a pé com menos sol direto, pela sombra dos prédios do cadastro (sem árvores nem
// marquises: não há base delas). Para pares (prédio → mercado mais perto), compara o caminho mais curto com o que tem
// menos sol dentro de +15% de distância, em 2 datas × 2 horários, com as alturas no mínimo e no máximo do cenário e com
// 20% dos volumes retirados (cadastro incompleto). Um par é "inconclusivo" se o preferido troca entre esses cenários.
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/sol/sombra-nos-caminhos.mjs \
//     --relatorio docs/aplicacao/execucoes/VE07/sombra.json
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { arestaMaisProxima, grafoPublicado, indexarArestas } from "../rede/grafo.mjs";
import { ponteiroAtual } from "../observacoes/publicar.mjs";
import { instanteNoRecife, posicaoDoSol } from "../../../src/dados/sol/astronomia.ts";
import { intervalosDoRaio } from "./raio.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const PILOTO = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];
const POR_AREA = 4, DESVIO_MAX = 0.15, VELOCIDADE = 1.2, ALTURA_DO_PEDESTRE = 1.5, PASSO_M = 10;
const CENARIOS = [["2026-12-21", 9], ["2026-12-21", 15], ["2026-06-21", 9], ["2026-06-21", 15]];
const sha = (s) => createHash("sha256").update(s).digest("hex");
const t0 = Date.now();

// ——— Volumes (recortes solares publicados) num plano métrico único ————————————————————————————————
const O = [-34.92, -8.07];
const KX = 111195.08 * Math.cos((O[1] * Math.PI) / 180), KY = 111195.08;
const xy = (lon, lat) => [(lon - O[0]) * KX, (lat - O[1]) * KY];
const volumes = [];
const vistos = new Set();
for (const a of PILOTO) {
  const c = JSON.parse(readFileSync(join(RAIZ, `src/dados/sol/recortes/${a}.json`), "utf8"));
  for (const [id, , pav, , aneis] of c.volumes) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    const m = aneis.map((r) => r.map((p) => xy(c.origem[0] + p[0] / c.escala, c.origem[1] + p[1] / c.escala)));
    const xs = m[0].map((p) => p[0]), ys = m[0].map((p) => p[1]);
    volumes.push({ id, aneis: m, hMin: pav === null ? null : pav * 2.8, hMax: pav === null ? null : pav * 3.4, caixa: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], omitido: parseInt(sha(`omit|${id}`).slice(0, 8), 16) / 0xffffffff < 0.2 });
  }
}
const CEL = 50;
const grade = new Map();
volumes.forEach((v, i) => {
  for (let x = Math.floor(v.caixa[0] / CEL); x <= Math.floor(v.caixa[2] / CEL); x++) for (let y = Math.floor(v.caixa[1] / CEL); y <= Math.floor(v.caixa[3] / CEL); y++) {
    const k = `${x},${y}`; if (!grade.has(k)) grade.set(k, []); grade.get(k).push(i);
  }
});

/** Sol num ponto do chão: "sol", "sombra" ou "incerto" (altura desconhecida ou entre mínimo e máximo). */
function solNoPonto(p, sol, { alturas = "faixa", omitir = false } = {}) {
  if (sol.elevacao <= 0) return "sombra";
  const tg = Math.tan((sol.elevacao * Math.PI) / 180);
  const dmax = Math.min(600, 160 / tg);
  const a = (sol.azimute * Math.PI) / 180, d = [Math.sin(a), Math.cos(a)];
  const candidatos = new Set();
  for (let s = 0; s <= dmax + CEL; s += CEL / 2) {
    const x = Math.floor((p[0] + d[0] * s) / CEL), y = Math.floor((p[1] + d[1] * s) / CEL);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const i of grade.get(`${x + dx},${y + dy}`) ?? []) candidatos.add(i);
  }
  let incerto = false;
  for (const i of candidatos) {
    const v = volumes[i];
    if (omitir && v.omitido) continue;
    for (const [ent, sai] of intervalosDoRaio(p, d, v.aneis)) {
      if (ent > dmax) continue;
      const zEnt = ALTURA_DO_PEDESTRE + ent * tg;
      void sai;
      if (v.hMin === null) { incerto = true; continue; }
      const hBaixa = alturas === "max" ? v.hMax : v.hMin, hAlta = alturas === "min" ? v.hMin : v.hMax;
      if (hBaixa > zEnt) return "sombra";
      if (hAlta > zEnt) incerto = true;
    }
  }
  return incerto ? "incerto" : "sol";
}

// ——— Rede, prédios e mercados ——————————————————————————————————————————————————————————————————
const PUB = join(RAIZ, ".cache/publicacoes");
const rede = ponteiroAtual(PUB, "rede-pedestre");
const pasta = join(PUB, "rede-pedestre", "versoes", rede.versao);
const g = grafoPublicado(JSON.parse(gunzipSync(readFileSync(join(pasta, "grafo.json.gz")))));
const frentes = JSON.parse(gunzipSync(readFileSync(join(pasta, "frentes.json.gz"))));
const gradeArestas = indexarArestas(g);
const ess = ponteiroAtual(PUB, "essenciais");
const mercados = JSON.parse(gunzipSync(readFileSync(join(PUB, "essenciais", "versoes", ess.versao, "locais.json.gz")))).filter((l) => l.categoria === "mercado");
const ok = (e) => g.comp[e.a] === g.componentePrincipal && !(e.f & 32);
const noDoMercado = new Map();
for (const m of mercados) { const a = arestaMaisProxima(g, gradeArestas, m.ponto[0], m.ponto[1], 60, ok); if (a) for (const p of a.pontas) if (!noDoMercado.has(p.no) || p.m + a.metros < noDoMercado.get(p.no).m) noDoMercado.set(p.no, { m: p.m + a.metros, nome: m.nome }); }

/** Dijkstra com peso por aresta; devolve {dist, ant} até `limite` no custo. */
function dijkstra(origens, peso, limite) {
  const dist = new Map(), ant = new Map(), fila = [];
  const push = (c, n) => { fila.push([c, n]); let i = fila.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (fila[q][0] <= fila[i][0]) break; [fila[q], fila[i]] = [fila[i], fila[q]]; i = q; } };
  const pop = () => { const t = fila[0], u = fila.pop(); if (fila.length) { fila[0] = u; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < fila.length && fila[l][0] < fila[m][0]) m = l; if (r < fila.length && fila[r][0] < fila[m][0]) m = r; if (m === i) break; [fila[m], fila[i]] = [fila[i], fila[m]]; i = m; } } return t; };
  for (const o of origens) { dist.set(o.no, o.m); push(o.m, o.no); }
  while (fila.length) {
    const [d, u] = pop();
    if (d > (dist.get(u) ?? Infinity) || d > limite) continue;
    for (let j = g.inicio[u]; j < g.inicio[u + 1]; j++) {
      const k = g.qual[j], e = g.arestas[k];
      if (e.f & 32) continue;
      const v = g.viz[j], nd = d + peso(k);
      if (nd < (dist.get(v) ?? Infinity)) { dist.set(v, nd); ant.set(v, k); push(nd, v); }
    }
  }
  return { dist, ant };
}
const caminho = (ant, no) => { const ks = []; for (let v = no, k; (k = ant.get(v)) !== undefined;) { ks.push(k); const e = g.arestas[k]; v = e.a === v ? e.b : e.a; } return ks; };

// Fração de sol por aresta e cenário, calculada sob demanda e guardada.
const memo = new Map();
function solDaAresta(k, sol, chaveCen, opcoes) {
  const ck = `${k}|${chaveCen}|${opcoes.alturas}|${opcoes.omitir ? 1 : 0}`;
  if (memo.has(ck)) return memo.get(ck);
  const e = g.arestas[k];
  const a = xy(g.lon[e.a], g.lat[e.a]), b = xy(g.lon[e.b], g.lat[e.b]);
  const n = Math.max(1, Math.round(e.m / PASSO_M));
  let sol_ = 0, inc = 0;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const s = solNoPonto([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], sol, opcoes);
    if (s === "sol") sol_ += 1; else if (s === "incerto") inc += 1;
  }
  const r = { sol: (sol_ / n) * e.m, incerto: (inc / n) * e.m };
  memo.set(ck, r);
  return r;
}
const minutosDeSol = (ks, sol, cc, op) => ks.reduce((s, k) => s + solDaAresta(k, sol, cc, op).sol, 0) / VELOCIDADE / 60;
/** Comprimento do caminho mais a ligação da entrada até o nó de partida (as duas pontas da entrada diferem). */
function metros(ks, alvo, origens) {
  let v = alvo;
  for (const k of ks) { const e = g.arestas[k]; v = e.a === v ? e.b : e.a; }
  return ks.reduce((s, k) => s + g.arestas[k].m, 0) + (origens.find((o) => o.no === v)?.m ?? 0);
}

// ——— Pares: prédios com ligação forte, mercado a 300–1.200 m, pela ordem do SHA-256 ————————————————————
const pares = [];
for (const a of PILOTO) {
  const cands = frentes.filter((f) => f.area === a && f.ligacao && f.classe === "forte").sort((x, y) => sha(`VE07|${x.id}`).localeCompare(sha(`VE07|${y.id}`)));
  let n = 0;
  for (const f of cands) {
    if (n >= POR_AREA) break;
    const origens = f.ligacao.pontas.map((p) => ({ no: p.no, m: p.m + f.ligacao.metros }));
    const { dist, ant } = dijkstra(origens, (k) => g.arestas[k].m, 1500);
    let alvo = null;
    for (const [no, mm] of noDoMercado) { const d = dist.get(no); if (d !== undefined && (!alvo || d + mm.m < alvo.m)) alvo = { no, m: d + mm.m, nome: mm.nome }; }
    if (!alvo || alvo.m < 300 || alvo.m > 1200) continue;
    pares.push({ area: a, predio: f.id, origens, alvo, curto: caminho(ant, alvo.no) });
    n += 1;
  }
}

// ——— Comparação por cenário ——————————————————————————————————————————————————————————————————
const resultados = [];
for (const p of pares) {
  const L = metros(p.curto, p.alvo.no, p.origens);
  const r = { area: p.area, predio: p.predio, mercado: p.alvo.nome ?? null, curtoM: Math.round(L), cenarios: [] };
  for (const [dia, h] of CENARIOS) {
    const sol = posicaoDoSol(instanteNoRecife(dia, h * 60), { longitude: g.lon[p.alvo.no], latitude: g.lat[p.alvo.no] });
    const cc = `${dia}T${h}`;
    // Alternativa: penaliza o comprimento ensolarado (alturas no centro da faixa = "faixa"), com λ crescente,
    // e fica com a de menos sol dentro de +15%.
    let melhor = null;
    for (const lambda of [0.5, 1, 2, 4, 8]) {
      const { dist, ant } = dijkstra(p.origens, (k) => g.arestas[k].m + lambda * solDaAresta(k, sol, cc, { alturas: "faixa" }).sol, 6000);
      if (!dist.has(p.alvo.no)) continue;
      const ks = caminho(ant, p.alvo.no);
      if (metros(ks, p.alvo.no, p.origens) > L * (1 + DESVIO_MAX)) continue;
      const s = minutosDeSol(ks, sol, cc, { alturas: "faixa" });
      if (!melhor || s < melhor.s) melhor = { ks, s, lambda };
    }
    const alt = melhor?.ks ?? p.curto;
    // Robustez: alturas no mínimo/máximo e 20% dos volumes retirados.
    const variantes = [{ alturas: "min" }, { alturas: "max" }, { alturas: "faixa", omitir: true }];
    const prefere = variantes.map((op) => minutosDeSol(alt, sol, cc, op) < minutosDeSol(p.curto, sol, cc, op) - 1e-9);
    const curtoMin = minutosDeSol(p.curto, sol, cc, { alturas: "faixa" }), altMin = minutosDeSol(alt, sol, cc, { alturas: "faixa" });
    const ganho = curtoMin - altMin, extraMin = (metros(alt, p.alvo.no, p.origens) - L) / VELOCIDADE / 60;
    const estado = alt === p.curto || ganho < 0.5 ? "sem_alternativa_util" : prefere.every(Boolean) ? (ganho >= 2 * Math.max(extraMin, 0.5) ? "alternativa_estavel" : "ganho_pequeno") : "inconclusivo";
    r.cenarios.push({ dia, hora: h, elevacao: Math.round(sol.elevacao), solCurtoMin: Math.round(curtoMin * 10) / 10, solAltMin: Math.round(altMin * 10) / 10,
      extraM: Math.round(metros(alt, p.alvo.no, p.origens) - L), extraMin: Math.round(extraMin * 10) / 10, estado, lambda: melhor?.lambda ?? null });
  }
  resultados.push(r);
}
const porEstado = {};
for (const r of resultados) for (const c of r.cenarios) porEstado[c.estado] = (porEstado[c.estado] ?? 0) + 1;
const relatorio = {
  executadoEm: new Date().toISOString(), rede: rede.versao, volumes: volumes.length, volumesSemAltura: volumes.filter((v) => v.hMin === null).length,
  pares: resultados.length, cenarios: CENARIOS, desvioMax: DESVIO_MAX, porEstado, resultados,
  limites: ["Só sombra de prédios do cadastro; árvores, marquises e toldos não entram (não há base).", "Rede de eixo de rua: o lado da calçada não é modelado.", "Simulação, sem observação de campo (G-SHADE não observado)."],
  ms: Date.now() - t0, memoriaPicoMB: Math.round(process.resourceUsage().maxRSS / 1024),
};
const out = arg("--relatorio");
if (out) writeFileSync(out, JSON.stringify(relatorio, null, 1) + "\n");
// G-SHADE: folha de observação de campo (data, hora, trecho), nada observado ainda.
const linhas = [["par", "area", "predio", "mercado", "dia_simulado", "hora", "estado_simulado", "sol_curto_min", "sol_alternativa_min", "extra_m", "OBS_data", "OBS_hora", "OBS_trechos_ao_sol_curto", "OBS_trechos_ao_sol_alternativa", "OBS_arvores_ou_marquises", "OBS_nota"]];
resultados.forEach((r, i) => r.cenarios.forEach((c) => linhas.push([`GS${String(i + 1).padStart(2, "0")}`, r.area, r.predio, r.mercado ?? "", c.dia, `${c.hora}h`, c.estado, c.solCurtoMin, c.solAltMin, c.extraM, "", "", "", "", "", ""])));
writeFileSync(join(RAIZ, "docs/aplicacao/evaluation-sets/g-shade-observacao.csv"), linhas.map((l) => l.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n");
console.log(JSON.stringify({ pares: resultados.length, porEstado, ms: relatorio.ms, mem: relatorio.memoriaPicoMB }, null, 1));
