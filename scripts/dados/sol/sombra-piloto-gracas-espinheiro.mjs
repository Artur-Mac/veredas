// Piloto CoolWalk em Graças e Espinheiro (15/11/2026). Estende o experimento do VE07 (sombra-nos-caminhos.mjs, que
// fica intacto e reprodutível) com: árvores do Censo Arbóreo 2023 (dimensões ausentes testadas por cenário), os dois
// lados da via (calçada a ±LADO_M do eixo) e destinos reais (supermercado, mercado público, feira e parada).
// Compara o caminho mais curto com a alternativa de menos sol dentro de +15% de distância, no mesmo horário.
// Uma preferência só é "robusta" se sobrevive a TODAS as variantes (alturas min/max, 20% dos volumes fora, árvores
// ausentes/pequenas/grandes, eixo/lado mais sombreado/lado menos sombreado). Nada disso vai para o app sem campo.
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//     scripts/dados/sol/sombra-piloto-gracas-espinheiro.mjs --saida docs/aplicacao/execucoes/moradia-2026-11-15/2-sombra
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { arestaMaisProxima, grafoPublicado, indexarArestas, projetar } from "../rede/grafo.mjs";
import { ponteiroAtual } from "../observacoes/publicar.mjs";
import { instanteNoRecife, posicaoDoSol } from "../../../src/dados/sol/astronomia.ts";
import { intervalosDoRaio } from "./raio.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const SAIDA = resolve(process.cwd(), arg("--saida") ?? "docs/aplicacao/execucoes/moradia-2026-11-15/2-sombra");
mkdirSync(SAIDA, { recursive: true });
const AREAS = ["gracas", "espinheiro"];
const RECORTES = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena", "torre"]; // vizinhança com volumes
const PREDIOS_POR_AREA = 6, DESVIO_MAX = 0.15, VELOCIDADE = 1.2, ALTURA_DO_PEDESTRE = 1.5, PASSO_M = 10, LADO_M = 7;
// Parada costuma estar perto: mínimo menor para ela (o trajeto até o ponto também é caminhada ao sol).
const DIST_MIN = { parada: 100, outros: 250 }, DIST_MAX = 1500;
const CENARIOS = [["2026-12-21", 9], ["2026-12-21", 15], ["2026-03-20", 9], ["2026-03-20", 15], ["2026-06-21", 9], ["2026-06-21", 15]];
// Dimensões ausentes no censo: três hipóteses de árvore (raio da copa, base e topo da copa, em m).
const ARVORES = { ausentes: null, pequenas: { r: 2, base: 2.5, topo: 6 }, grandes: { r: 4.5, base: 3, topo: 11 } };
const sha = (s) => createHash("sha256").update(s).digest("hex");
const t0 = Date.now();

// ——— Volumes ————————————————————————————————————————————————————————————————————————————————————————
const O = [-34.92, -8.07];
const KX = 111195.08 * Math.cos((O[1] * Math.PI) / 180), KY = 111195.08;
const xy = (lon, lat) => [(lon - O[0]) * KX, (lat - O[1]) * KY];
const volumes = [];
const vistos = new Set();
const fontes = [];
for (const a of RECORTES) {
  const arq = join(RAIZ, `src/dados/sol/recortes/${a}.json`);
  if (!existsSync(arq)) continue;
  const bruto = readFileSync(arq);
  fontes.push({ fonte: `recorte_solar_${a}`, sha256: sha(bruto) });
  const c = JSON.parse(bruto);
  for (const [id, , pav, , aneis] of c.volumes) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    const m = aneis.map((r) => r.map((p) => xy(c.origem[0] + p[0] / c.escala, c.origem[1] + p[1] / c.escala)));
    const xs = m[0].map((p) => p[0]), ys = m[0].map((p) => p[1]);
    volumes.push({ aneis: m, hMin: pav === null ? null : pav * 2.8, hMax: pav === null ? null : pav * 3.4, caixa: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], omitido: parseInt(sha(`omit|${id}`).slice(0, 8), 16) / 0xffffffff < 0.2 });
  }
}
const CEL = 50;
const grade = new Map();
const porCelula = (g, caixa, i) => { for (let x = Math.floor(caixa[0] / CEL); x <= Math.floor(caixa[2] / CEL); x++) for (let y = Math.floor(caixa[1] / CEL); y <= Math.floor(caixa[3] / CEL); y++) { const k = `${x},${y}`; if (!g.has(k)) g.set(k, []); g.get(k).push(i); } };
volumes.forEach((v, i) => porCelula(grade, v.caixa, i));

// ——— Árvores (Censo Arbóreo 2023, ODbL): só posição e origem; copa/altura quase sempre vazias ————————————
const brutoCenso = readFileSync(join(RAIZ, "docs/dados/raw/sombra-2026-11-15/censo-arboreo-2023.geojson"));
fontes.push({ fonte: "censo_arboreo_2023", sha256: sha(brutoCenso) });
const arvores = [];
const censo = { total: 0, comCopa: 0, comAltura: 0, porOrigem: {} };
{
  const j = JSON.parse(brutoCenso);
  for (const f of j.features) {
    const p = f.properties;
    censo.total += 1;
    if (Number(p.copa) > 0) censo.comCopa += 1;
    if (Number(p.altura) > 0) censo.comAltura += 1;
    const lon = Number(p.x_wgs84), lat = Number(p.y_wgs84);
    if (!(lon < -34.8 && lon > -35.1 && lat < -7.9 && lat > -8.2)) continue;
    const [x, y] = xy(lon, lat);
    // Só o entorno do piloto (economiza memória): caixa larga em volta de Graças/Espinheiro.
    if (x < 1500 || x > 7500 || y < 1500 || y > 7500) continue;
    censo.porOrigem[p.origem ?? "sem_origem"] = (censo.porOrigem[p.origem ?? "sem_origem"] ?? 0) + 1;
    arvores.push({ x, y, copa: Number(p.copa) > 0 ? Number(p.copa) : null, altura: Number(p.altura) > 0 ? Number(p.altura) : null, origem: p.origem ?? null });
  }
}
const gradeArv = new Map();
arvores.forEach((t, i) => porCelula(gradeArv, [t.x - 6, t.y - 6, t.x + 6, t.y + 6], i));

/** Sol num ponto do chão: "sol" | "sombra" | "incerto". Prédios (cadastro) e, se pedido, árvores como cilindros. */
function solNoPonto(p, sol, { alturas = "faixa", omitir = false, arvores: hip = null } = {}) {
  if (sol.elevacao <= 0) return "sombra";
  const tg = Math.tan((sol.elevacao * Math.PI) / 180);
  const dmax = Math.min(600, 160 / tg);
  const a = (sol.azimute * Math.PI) / 180, d = [Math.sin(a), Math.cos(a)];
  if (hip) {
    // Árvore: copa cilíndrica de raio r entre base e topo. O raio rumo ao sol cruza a copa se passa a < r do tronco
    // numa distância horizontal em que a altura do raio está entre base e topo.
    const smax = (hip.topo - ALTURA_DO_PEDESTRE) / tg + hip.r;
    const vistas = new Set();
    for (let s = 0; s <= smax + CEL; s += CEL / 2) {
      const x = Math.floor((p[0] + d[0] * s) / CEL), y = Math.floor((p[1] + d[1] * s) / CEL);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const i of gradeArv.get(`${x + dx},${y + dy}`) ?? []) {
        if (vistas.has(i)) continue;
        vistas.add(i);
        const t = arvores[i];
        const r = t.copa ? t.copa / 2 : hip.r, topo = t.altura ?? hip.topo, base = Math.min(hip.base, topo * 0.4);
        const vx = t.x - p[0], vy = t.y - p[1];
        const sProj = vx * d[0] + vy * d[1];
        if (sProj < -r) continue;
        const perp = Math.abs(vx * d[1] - vy * d[0]);
        if (perp >= r) continue;
        const meia = Math.sqrt(r * r - perp * perp);
        const s0 = Math.max(0, sProj - meia), s1 = sProj + meia;
        const z0 = ALTURA_DO_PEDESTRE + s0 * tg, z1 = ALTURA_DO_PEDESTRE + s1 * tg;
        if (z1 >= base && z0 <= topo) return "sombra";
      }
    }
  }
  const candidatos = new Set();
  for (let s = 0; s <= dmax + CEL; s += CEL / 2) {
    const x = Math.floor((p[0] + d[0] * s) / CEL), y = Math.floor((p[1] + d[1] * s) / CEL);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const i of grade.get(`${x + dx},${y + dy}`) ?? []) candidatos.add(i);
  }
  let incerto = false;
  for (const i of candidatos) {
    const v = volumes[i];
    if (omitir && v.omitido) continue;
    for (const [ent] of intervalosDoRaio(p, d, v.aneis)) {
      if (ent > dmax) continue;
      const zEnt = ALTURA_DO_PEDESTRE + ent * tg;
      if (v.hMin === null) { incerto = true; continue; }
      const hBaixa = alturas === "max" ? v.hMax : v.hMin, hAlta = alturas === "min" ? v.hMin : v.hMax;
      if (hBaixa > zEnt) return "sombra";
      if (hAlta > zEnt) incerto = true;
    }
  }
  return incerto ? "incerto" : "sol";
}

// ——— Rede, prédios e destinos reais ——————————————————————————————————————————————————————————————————
const PUB = join(RAIZ, ".cache/publicacoes");
const rede = ponteiroAtual(PUB, "rede-pedestre");
const pasta = join(PUB, "rede-pedestre", "versoes", rede.versao);
const g = grafoPublicado(JSON.parse(gunzipSync(readFileSync(join(pasta, "grafo.json.gz")))));
const frentes = JSON.parse(gunzipSync(readFileSync(join(pasta, "frentes.json.gz"))));
const gradeArestas = indexarArestas(g);
const ess = ponteiroAtual(PUB, "essenciais");
const locais = JSON.parse(gunzipSync(readFileSync(join(PUB, "essenciais", "versoes", ess.versao, "locais.json.gz"))));
const RAW = join(RAIZ, "docs/dados/raw/fontes-prioritarias-2026-11-14");
const feiras = JSON.parse(readFileSync(join(RAW, "feiras.json"), "utf8"));
const mercadosPublicos = JSON.parse(readFileSync(join(RAW, "mercados.json"), "utf8"));
const destinos = [
  ...locais.filter((l) => l.categoria === "mercado").map((l) => ({ tipo: "supermercado", nome: l.nome ?? "mercado sem nome", ponto: l.ponto, horario: null })),
  ...locais.filter((l) => l.categoria === "transporte").map((l) => ({ tipo: "parada", nome: `parada ${l.nome}`, ponto: l.ponto, horario: null })),
  ...mercadosPublicos.map((m) => ({ tipo: "mercado_publico", nome: m.nome, ponto: [Number(m.longitude), Number(m.latitude)], horario: null })),
  ...feiras.filter((f) => Number.isFinite(Number(f.Longitude))).map((f) => ({ tipo: "feira", nome: f.Nome, ponto: [Number(f.Longitude), Number(f.Latitude)], horario: `${f.Dias ?? ""} ${f["Horário"] ?? ""}`.trim() })),
];
const ok = (e) => g.comp[e.a] === g.componentePrincipal && !(e.f & 32);
const nosPorTipo = new Map();
for (const dst of destinos) {
  const a = arestaMaisProxima(g, gradeArestas, dst.ponto[0], dst.ponto[1], 60, ok);
  if (!a) continue;
  if (!nosPorTipo.has(dst.tipo)) nosPorTipo.set(dst.tipo, new Map());
  const m = nosPorTipo.get(dst.tipo);
  for (const p of a.pontas) if (!m.has(p.no) || p.m + a.metros < m.get(p.no).m) m.set(p.no, { m: p.m + a.metros, dst });
}

// Nome da rua de cada aresta (malha oficial mais próxima, ≤ 25 m), só para o roteiro de campo.
const trechosOficiais = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/trechos-de-logradouros.geojson"), "utf8"));
const segsNome = [];
for (const f of trechosOficiais.features) {
  const nome = f.properties.NLGPAVOFIC || f.properties.NLOGRACONC;
  if (!f.geometry || !nome) continue;
  const ls = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const l of ls) for (let i = 0; i + 1 < l.length; i++) {
    const [x, y] = xy(l[i][0], l[i][1]);
    if (x < 1000 || x > 8000 || y < 1000 || y > 8000) continue;
    segsNome.push({ nome, ax: l[i][0], ay: l[i][1], bx: l[i + 1][0], by: l[i + 1][1] });
  }
}
function nomeDaAresta(k) {
  const e = g.arestas[k];
  const mx = (g.lon[e.a] + g.lon[e.b]) / 2, my = (g.lat[e.a] + g.lat[e.b]) / 2;
  let melhor = null;
  for (const s of segsNome) {
    if (Math.abs(s.ax - mx) > 0.002 && Math.abs(s.bx - mx) > 0.002) continue;
    const m = projetar(mx, my, s.ax, s.ay, s.bx, s.by).metros;
    if (m <= 25 && (!melhor || m < melhor.m)) melhor = { m, nome: s.nome };
  }
  return melhor?.nome ?? "trecho sem nome na malha";
}

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
const caminho = (ant, no) => { const ks = []; for (let v = no, k; (k = ant.get(v)) !== undefined;) { ks.push(k); const e = g.arestas[k]; v = e.a === v ? e.b : e.a; } return ks.reverse(); };
function metros(ks, alvo, origens) {
  let v = alvo;
  for (const k of [...ks].reverse()) { const e = g.arestas[k]; v = e.a === v ? e.b : e.a; }
  return ks.reduce((s, k) => s + g.arestas[k].m, 0) + (origens.find((o) => o.no === v)?.m ?? 0);
}

// Sol por aresta, por lado: eixo (0), esquerda (+1) e direita (−1), deslocados LADO_M perpendicularmente.
const memo = new Map();
function solDaAresta(k, sol, cc, op, lado = 0) {
  const ck = `${k}|${cc}|${op.alturas}|${op.omitir ? 1 : 0}|${op.arvores ? op.nomeArv : "-"}|${lado}`;
  if (memo.has(ck)) return memo.get(ck);
  const e = g.arestas[k];
  const a = xy(g.lon[e.a], g.lat[e.a]), b = xy(g.lon[e.b], g.lat[e.b]);
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (-(b[1] - a[1]) / L) * LADO_M * lado, ny = ((b[0] - a[0]) / L) * LADO_M * lado;
  const n = Math.max(1, Math.round(e.m / PASSO_M));
  let s_ = 0, inc = 0;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const r = solNoPonto([a[0] + (b[0] - a[0]) * t + nx, a[1] + (b[1] - a[1]) * t + ny], sol, op);
    if (r === "sol") s_ += 1; else if (r === "incerto") inc += 1;
  }
  const out = { sol: (s_ / n) * e.m, incerto: (inc / n) * e.m };
  memo.set(ck, out);
  return out;
}
/** Metros ao sol de um caminho; lado: "eixo" | "melhor" (calçada mais sombreada de cada trecho) | "pior". */
function solDoCaminho(ks, sol, cc, op, lado = "eixo") {
  let m = 0, inc = 0;
  for (const k of ks) {
    const r = lado === "eixo" ? solDaAresta(k, sol, cc, op, 0)
      : [solDaAresta(k, sol, cc, op, 1), solDaAresta(k, sol, cc, op, -1)].sort((x, y) => (lado === "melhor" ? x.sol - y.sol : y.sol - x.sol))[0];
    m += r.sol; inc += r.incerto;
  }
  return { min: m / VELOCIDADE / 60, incertoMin: inc / VELOCIDADE / 60 };
}

// ——— Pares: prédios com ligação forte (ordem do SHA-256), o destino mais perto de cada tipo a 250–1.500 m ————
const pares = [];
for (const area of AREAS) {
  const cands = frentes.filter((f) => f.area === area && f.ligacao && f.classe === "forte").sort((x, y) => sha(`COOLWALK|${x.id}`).localeCompare(sha(`COOLWALK|${y.id}`)));
  let n = 0;
  for (const f of cands) {
    if (n >= PREDIOS_POR_AREA) break;
    const origens = f.ligacao.pontas.map((p) => ({ no: p.no, m: p.m + f.ligacao.metros }));
    const { dist, ant } = dijkstra(origens, (k) => g.arestas[k].m, DIST_MAX + 200);
    const doPredio = [];
    for (const [tipo, mapa] of nosPorTipo) {
      let alvo = null;
      for (const [no, x] of mapa) { const d = dist.get(no); if (d !== undefined && (!alvo || d + x.m < alvo.m)) alvo = { no, m: d + x.m, dst: x.dst }; }
      if (alvo && alvo.m >= (DIST_MIN[tipo] ?? DIST_MIN.outros) && alvo.m <= DIST_MAX) doPredio.push({ area, predio: f.id, tipo, destino: alvo.dst.nome, horario: alvo.dst.horario, origens, alvo, curto: caminho(ant, alvo.no) });
    }
    if (!doPredio.length) continue;
    pares.push(...doPredio);
    n += 1;
  }
}

// ——— Comparação ————————————————————————————————————————————————————————————————————————————————————————
const VARIANTES = [];
for (const nomeArv of Object.keys(ARVORES)) for (const lado of ["eixo", "melhor", "pior"]) for (const alt of [{ alturas: "faixa" }, { alturas: "min" }, { alturas: "max" }, { alturas: "faixa", omitir: true }])
  VARIANTES.push({ nome: `${nomeArv}|${lado}|${alt.alturas}${alt.omitir ? "|omit20" : ""}`, op: { ...alt, arvores: ARVORES[nomeArv], nomeArv }, lado, nomeArv });
const resultados = [];
for (const p of pares) {
  const L = metros(p.curto, p.alvo.no, p.origens);
  const r = { area: p.area, predio: p.predio, tipo: p.tipo, destino: p.destino, horarioDoDestino: p.horario, curtoM: Math.round(L), cenarios: [] };
  for (const [dia, h] of CENARIOS) {
    const sol = posicaoDoSol(instanteNoRecife(dia, h * 60), { longitude: g.lon[p.alvo.no], latitude: g.lat[p.alvo.no] });
    const cc = `${dia}T${h}`;
    // Alternativa construída no cenário central (prédios na faixa, árvores pequenas, eixo), dentro de +15%.
    const opBase = { alturas: "faixa", arvores: ARVORES.pequenas, nomeArv: "pequenas" };
    let melhor = null;
    for (const lambda of [0.5, 1, 2, 4, 8]) {
      const { dist, ant } = dijkstra(p.origens, (k) => g.arestas[k].m + lambda * solDaAresta(k, sol, cc, opBase).sol, 8000);
      if (!dist.has(p.alvo.no)) continue;
      const ks = caminho(ant, p.alvo.no);
      if (metros(ks, p.alvo.no, p.origens) > L * (1 + DESVIO_MAX)) continue;
      const s = solDoCaminho(ks, sol, cc, opBase).min;
      if (!melhor || s < melhor.s) melhor = { ks, s, lambda };
    }
    const alt = melhor?.ks ?? p.curto;
    const mesmo = alt.length === p.curto.length && alt.every((k, i) => k === p.curto[i]);
    const extraM = Math.round(metros(alt, p.alvo.no, p.origens) - L), extraMin = Math.round((extraM / VELOCIDADE / 60) * 10) / 10;
    const porVariante = VARIANTES.map((v) => {
      const c = solDoCaminho(p.curto, sol, cc, v.op, v.lado), a = solDoCaminho(alt, sol, cc, v.op, v.lado);
      return { v: v.nome, arv: v.nomeArv, lado: v.lado, curto: Math.round(c.min * 10) / 10, alt: Math.round(a.min * 10) / 10, ganho: Math.round((c.min - a.min) * 10) / 10 };
    });
    const ganhos = porVariante.map((x) => x.ganho);
    const central = porVariante.find((x) => x.v === "pequenas|eixo|faixa");
    const prefereSempre = ganhos.every((x) => x > 0);
    let estado;
    if (mesmo || central.ganho < 0.5) estado = "sem_alternativa_util";
    else if (!prefereSempre) estado = "inconclusivo";
    else if (Math.min(...ganhos) >= 2 * Math.max(extraMin, 0.5)) estado = "alternativa_robusta";
    else estado = "ganho_pequeno";
    // O que muda a preferência: árvores (ausentes × grandes) e lado da calçada.
    // Sensibilidade (só quando há alternativa): o sinal da preferência muda entre árvores ausentes e grandes (eixo,
    // alturas na faixa) ou entre o lado mais e o menos sombreado da calçada (árvores pequenas, alturas na faixa).
    const ganhoDe = (arv, lado) => porVariante.find((x) => x.v === `${arv}|${lado}|faixa`).ganho;
    const sensivel = mesmo ? { arvores: false, lado: false } : {
      arvores: (ganhoDe("ausentes", "eixo") > 0) !== (ganhoDe("grandes", "eixo") > 0),
      lado: (ganhoDe("pequenas", "melhor") > 0) !== (ganhoDe("pequenas", "pior") > 0),
    };
    const trechosDiferentes = mesmo ? [] : [...new Set([...alt.filter((k) => !p.curto.includes(k)).map((k) => `alternativa: ${nomeDaAresta(k)}`), ...p.curto.filter((k) => !alt.includes(k)).map((k) => `curto: ${nomeDaAresta(k)}`)])];
    r.cenarios.push({ dia, hora: h, elevacao: Math.round(sol.elevacao), azimute: Math.round(sol.azimute), estado, extraM, extraMin, central, faixaDoGanho: [Math.min(...ganhos), Math.max(...ganhos)],
      sensivel, trechosDiferentes, porVariante });
  }
  resultados.push(r);
}

// ——— Relatório e roteiro de campo ——————————————————————————————————————————————————————————————————————
const porEstado = {};
for (const r of resultados) for (const c of r.cenarios) porEstado[c.estado] = (porEstado[c.estado] ?? 0) + 1;
const porEstadoSemArvores = {};
for (const r of resultados) for (const c of r.cenarios) {
  const sem = c.porVariante.filter((x) => x.arv === "ausentes" && x.lado === "eixo");
  const k = sem.every((x) => x.ganho > 0) ? "prefere_alternativa" : sem.every((x) => x.ganho <= 0) ? "prefere_curto_ou_igual" : "troca";
  porEstadoSemArvores[k] = (porEstadoSemArvores[k] ?? 0) + 1;
}
const relatorio = {
  geradoPor: "scripts/dados/sol/sombra-piloto-gracas-espinheiro.mjs", rede: rede.versao, essenciais: ess.versao, fontes,
  volumes: volumes.length, volumesSemAltura: volumes.filter((v) => v.hMin === null).length,
  censoArboreo: { ...censo, noEntorno: arvores.length, noEntornoComCopa: arvores.filter((t) => t.copa).length, noEntornoComAltura: arvores.filter((t) => t.altura).length },
  hipotesesDeArvore: ARVORES, ladoM: LADO_M, desvioMax: DESVIO_MAX, cenarios: CENARIOS, variantes: VARIANTES.length,
  pares: resultados.length, porTipo: resultados.reduce((m, r) => ({ ...m, [r.tipo]: (m[r.tipo] ?? 0) + 1 }), {}),
  porEstado, porEstadoSemArvores,
  sensivelAArvores: resultados.flatMap((r) => r.cenarios).filter((c) => c.sensivel.arvores).length,
  sensivelAoLado: resultados.flatMap((r) => r.cenarios).filter((c) => c.sensivel.lado).length,
  resultados: resultados.map((r) => ({ ...r, cenarios: r.cenarios.map(({ porVariante, ...c }) => c) })),
  limites: [
    "Copa e altura das árvores quase nunca preenchidas no censo: testadas por hipótese (ausentes, pequenas, grandes).",
    "O censo vem majoritariamente do inventário de 2007 (origem ARB2007); árvores removidas depois podem continuar no arquivo.",
    "Podas e erradicações 2023 vêm por endereço textual, sem coordenada: contadas por rua no roteiro, não entram na simulação.",
    "Marquises e toldos: nenhuma base verificável; ficam para a observação de campo.",
    "Lado da calçada: deslocamento fixo de 7 m do eixo; a largura real da via não é publicada para estas ruas.",
    "Simulação, sem observação de campo.",
  ],
  ms: Date.now() - t0, memoriaPicoMB: Math.round(process.resourceUsage().maxRSS / 1024),
};
writeFileSync(join(SAIDA, "sombra-piloto.json"), JSON.stringify(relatorio, null, 1) + "\n");
// Casos (detalhe) e roteiro curto: trechos que decidem mais casos, por horário, para a equipe observar.
const casos = [["caso", "area", "predio", "destino", "tipo", "dia_de_referencia", "hora", "estado_simulado", "ganho_central_min", "faixa_do_ganho_min", "extra_min", "sensivel_a", "trechos_que_diferem"]];
const porTrecho = new Map();
let n = 0;
for (const r of resultados) for (const c of r.cenarios) {
  if (c.estado === "sem_alternativa_util") continue;
  const id = `CW${String(++n).padStart(3, "0")}`;
  const sens = [c.sensivel.arvores ? "arvores" : null, c.sensivel.lado ? "lado" : null].filter(Boolean).join("+") || "-";
  casos.push([id, r.area, r.predio, r.destino, r.tipo, c.dia, `${c.hora}h`, c.estado, c.central.ganho, `${c.faixaDoGanho[0]} a ${c.faixaDoGanho[1]}`, c.extraMin, sens, c.trechosDiferentes.join(" | ")]);
  for (const t of c.trechosDiferentes) {
    const [papel, nome] = t.split(": ");
    const k = `${nome}|${c.hora}h`;
    const x = porTrecho.get(k) ?? { nome, hora: `${c.hora}h`, casos: new Set(), papeis: new Set(), dias: new Set(), sens: new Set(), areas: new Set() };
    x.casos.add(id); x.papeis.add(papel); x.dias.add(c.dia); x.areas.add(r.area); if (sens !== "-") x.sens.add(sens);
    porTrecho.set(k, x);
  }
}
writeFileSync(join(SAIDA, "casos.csv"), casos.map((l) => l.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n");
const roteiro = [["ordem", "trecho", "bairros", "horario", "datas_de_referencia_simuladas", "papel_no_caminho", "casos_que_decide", "sensivel_a", "o_que_observar", "OBS_data", "OBS_hora", "OBS_lado_par(sol/sombra/parcial)", "OBS_lado_impar(sol/sombra/parcial)", "OBS_arvores_com_copa(n)", "OBS_marquises_ou_toldos(sim/nao)", "OBS_nota"]];
[...porTrecho.values()].filter((x) => x.nome !== "trecho sem nome na malha").sort((a, b) => b.casos.size - a.casos.size || a.nome.localeCompare(b.nome)).slice(0, 15).forEach((x, i) => {
  const oQue = [x.sens.size && [...x.sens].some((s) => s.includes("lado")) ? "sol em cada lado da calçada" : "sol na calçada", [...x.sens].some((s) => s.includes("arvores")) ? "copas sobre a calçada (contar e estimar raio)" : null, "marquises e toldos contínuos"].filter(Boolean).join("; ");
  roteiro.push([i + 1, x.nome, [...x.areas].join("/"), x.hora, [...x.dias].sort().join(" "), [...x.papeis].sort().join("+"), x.casos.size, [...x.sens].join(" ") || "-", oQue, "", "", "", "", "", "", ""]);
});
writeFileSync(join(SAIDA, "roteiro-observacao.csv"), roteiro.map((l) => l.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n");
const linhas = roteiro;
console.log(JSON.stringify({ pares: relatorio.pares, porTipo: relatorio.porTipo, porEstado, porEstadoSemArvores, sensivelAArvores: relatorio.sensivelAArvores, sensivelAoLado: relatorio.sensivelAoLado, arvores: relatorio.censoArboreo, linhasDoRoteiro: linhas.length - 1, casosDecisivos: casos.length - 1, trechosDistintos: porTrecho.size, ms: relatorio.ms }, null, 1));
