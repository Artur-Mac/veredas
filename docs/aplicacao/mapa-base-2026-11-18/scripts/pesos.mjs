// Pesos do mapa-base por recorte (Boa Viagem, Torre, cidade). Uso: node pesos.mjs <dir-brutos>
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import readline from "node:readline";
import { createRequire } from "node:module";
const turf = createRequire(import.meta.url)("@turf/turf");

const BRUTOS = process.argv[2];
const L = (f) => JSON.parse(fs.readFileSync(path.join(BRUTOS, f), "utf8"));
const bairros = L("bairros-do-recife.geojson").features;
const quadras = L("quadras.geojson").features;
const ruas = L("trechos-de-logradouros.geojson").features;
const agua = L("recursos-hidricos.geojson").features;
const pracas = L("parques-e-pracas.geojson").features;

const achar = (n) => bairros.find((b) => b.properties.EBAIRRNOMEOF === n);
const RECORTES = {
  "boa-viagem": { poly: achar("Boa Viagem") },
  torre: { poly: achar("Torre") },
  cidade: { poly: null },
};
for (const r of Object.values(RECORTES)) {
  r.bbox = r.poly ? turf.bbox(r.poly) : turf.bbox(turf.featureCollection(bairros));
  r.lat0 = (r.bbox[1] + r.bbox[3]) / 2;
  r.mx = 111320 * Math.cos((r.lat0 * Math.PI) / 180);
  r.my = 110574;
  r.area_km2 = r.poly ? turf.area(r.poly) / 1e6 : bairros.reduce((s, b) => s + turf.area(b), 0) / 1e6;
  r.camadas = { quadra: [], lote: [], rua: [], agua: [], praca: [], bairro: [] };
}
const dentroBbox = (p, b) => p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];
const noRecorte = (r, p) => Number.isFinite(p[0]) && (!r.poly || (dentroBbox(p, r.bbox) && turf.booleanPointInPolygon(p, r.poly)));
const centro = (f) => { const a0 = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates[0]?.[0] : f.geometry.coordinates[0]; if (!a0?.length) return [NaN, NaN]; const a = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates[0][0] : f.geometry.coordinates[0]; let x = 0, y = 0; for (const c of a) { x += c[0]; y += c[1]; } return [x / a.length, y / a.length]; };
const cruzaBbox = (a, b) => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);

// ---- seleção
for (const r of Object.values(RECORTES)) {
  for (const q of quadras) if (q.geometry && noRecorte(r, centro(q))) r.camadas.quadra.push(q);
  for (const p of pracas) if (p.geometry && noRecorte(r, centro(p))) r.camadas.praca.push(p);
  // água e limite: recortados pelo bbox do bairro (para a cidade, inteiros)
  for (const w of agua) if (w.geometry && cruzaBbox(turf.bbox(w), r.bbox)) {
    const g = r.poly ? turf.bboxClip(w, r.bbox) : w;
    if (g.geometry.coordinates.length) r.camadas.agua.push(g);
  }
  r.camadas.bairro = r.poly ? [r.poly] : bairros;
  // ruas: segmentos com ponto médio dentro do recorte, juntados em corridas
  for (const f of ruas) {
    if (!f.geometry) continue;
    if (r.poly && !cruzaBbox(turf.bbox(f), r.bbox)) continue;
    const partes = [];
    for (const l of f.geometry.coordinates) {
      let cur = null;
      for (let k = 1; k < l.length; k++) {
        const m = [(l[k - 1][0] + l[k][0]) / 2, (l[k - 1][1] + l[k][1]) / 2];
        if (noRecorte(r, m)) { if (!cur) { cur = [l[k - 1]]; partes.push(cur); } cur.push(l[k]); } else cur = null;
      }
    }
    if (partes.length) r.camadas.rua.push({ type: "Feature", properties: f.properties, geometry: { type: "MultiLineString", coordinates: partes } });
  }
}
{
  const rl = readline.createInterface({ input: fs.createReadStream(path.join(BRUTOS, "lotes.geojson")), crlfDelay: Infinity });
  for await (const linha of rl) {
    if (!linha.startsWith('{ "type": "Feature"')) continue;
    const f = JSON.parse(linha.replace(/,\s*$/, ""));
    if (!f.geometry) continue;
    const c = centro(f);
    for (const r of Object.values(RECORTES)) if (noRecorte(r, c)) r.camadas.lote.push(f);
  }
}

// ---- codificações
const r6 = (c) => (typeof c[0] === "number" ? [Math.round(c[0] * 1e6) / 1e6, Math.round(c[1] * 1e6) / 1e6] : c.map(r6));
const propsMin = (camada, p) => ({
  quadra: { dsq: p.DSQ },
  lote: { dsqfl: p.DSQFL },
  rua: { nome: p.NLGPAVOFIC, codigo: p.CLOGRACODI },
  agua: { nome: p.NMRECHIDRIC },
  praca: { nome: p.NMNOMEOFIC || p.NMNOME, tipo: p.CDTIPO },
  bairro: { nome: p.EBAIRRNOMEOF },
}[camada]);
const idCompacto = (camada, p) => ({ quadra: p.DSQ, lote: p.DSQFL, rua: p.NLGPAVOFIC, agua: p.NMRECHIDRIC, praca: p.NMNOMEOFIC || p.NMNOME, bairro: p.EBAIRRNOMEOF }[camada]) ?? null;
const TOL = { quadra: 0.5, lote: 0.5, rua: 1, agua: 0.5, praca: 0.5, bairro: 0.5 };

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  const t2 = tol * tol;
  while (st.length) {
    const [a, b] = st.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (L2 === 0) d = (px - ax) ** 2 + (py - ay) ** 2;
      else { const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)); d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2; }
      if (d > best) { best = d; bi = i; }
    }
    if (best > t2) { keep[bi] = 1; st.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// anel fechado: ancora no ponto mais distante do primeiro para não perder a forma
function dpAnel(pts, tol) {
  const aberto = pts.slice(0, -1);
  if (aberto.length < 4) return aberto;
  let far = 1, fd = -1;
  for (let i = 1; i < aberto.length; i++) { const d = (aberto[i][0] - aberto[0][0]) ** 2 + (aberto[i][1] - aberto[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
  const a = dp(aberto.slice(0, far + 1), tol), b = dp([...aberto.slice(far), aberto[0]], tol);
  return [...a, ...b.slice(1, -1)];
}
function aneisOuLinhas(g) {
  if (g.type === "Polygon") return { anel: true, partes: g.coordinates };
  if (g.type === "MultiPolygon") return { anel: true, partes: g.coordinates.flat() };
  if (g.type === "LineString") return { anel: false, partes: [g.coordinates] };
  return { anel: false, partes: g.coordinates };
}
function compacto(r, camada, feats, escala, comId) {
  // escala: 1 = metro inteiro, 10 = decímetro
  const out = [];
  let vIn = 0, vOut = 0;
  for (const f of feats) {
    const { anel, partes } = aneisOuLinhas(f.geometry);
    const enc = [];
    for (const p of partes) {
      vIn += p.length;
      const m = p.map(([lon, lat]) => [(lon - r.bbox[0]) * r.mx, (lat - r.bbox[1]) * r.my]);
      const s = anel ? dpAnel(m, TOL[camada]) : dp(m, TOL[camada]);
      const q = [];
      for (const [x, y] of s) { const X = Math.round(x * escala), Y = Math.round(y * escala); if (!q.length || q.at(-1)[0] !== X || q.at(-1)[1] !== Y) q.push([X, Y]); }
      if (q.length < (anel ? 3 : 2)) continue;
      vOut += q.length;
      const flat = [q[0][0], q[0][1]];
      for (let i = 1; i < q.length; i++) flat.push(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
      enc.push(flat);
    }
    if (!enc.length) continue;
    out.push(comId ? [idCompacto(camada, f.properties), ...enc] : enc);
  }
  return { json: JSON.stringify(out), vIn, vOut };
}
const gz = (s) => zlib.gzipSync(Buffer.from(s), { level: 9 }).length;
const fcStr = (feats) => '{"type":"FeatureCollection","features":[' + feats.join(",") + "]}";

const tabela = [];
for (const [nome, r] of Object.entries(RECORTES)) {
  const tot = { bruto: [], limpo: [], m1: [], dm: [], m1semId: [] };
  for (const [camada, feats] of Object.entries(r.camadas)) {
    const bruto = feats.map((f) => JSON.stringify(f));
    const limpo = feats.map((f) => JSON.stringify({ type: "Feature", properties: propsMin(camada, f.properties), geometry: { type: f.geometry.type, coordinates: r6(f.geometry.coordinates) } }));
    const m1 = compacto(r, camada, feats, 1, true), dm = compacto(r, camada, feats, 10, true), m1s = compacto(r, camada, feats, 1, false);
    const partes = camada === "rua" ? feats.reduce((s, f) => s + f.geometry.coordinates.length, 0) : null;
    const linha = {
      recorte: nome, camada, n: feats.length, partes_rua: partes,
      bruto: fcStr(bruto).length, bruto_gz: gz(fcStr(bruto)),
      limpo6: fcStr(limpo).length, limpo6_gz: gz(fcStr(limpo)),
      m1: m1.json.length, m1_gz: gz(m1.json), m1semId_gz: gz(m1s.json), dm: dm.json.length, dm_gz: gz(dm.json),
      vert_in: m1.vIn, vert_m1: m1.vOut, vert_dm: dm.vOut,
    };
    tabela.push(linha);
    tot.bruto.push(...bruto); tot.limpo.push(...limpo); tot.m1.push(m1.json); tot.dm.push(dm.json); tot.m1semId.push(m1s.json);
  }
  const all = (a) => "[" + a.join(",") + "]";
  tabela.push({
    recorte: nome, camada: "TOTAL", area_km2: +r.area_km2.toFixed(2),
    bruto: fcStr(tot.bruto).length, bruto_gz: gz(fcStr(tot.bruto)),
    limpo6: fcStr(tot.limpo).length, limpo6_gz: gz(fcStr(tot.limpo)),
    m1: all(tot.m1).length, m1_gz: gz(all(tot.m1)), m1semId_gz: gz(all(tot.m1semId)), dm: all(tot.dm).length, dm_gz: gz(all(tot.dm)),
  });
  console.error("feito", nome);
}
fs.writeFileSync(path.join(path.dirname(BRUTOS), "pesos.json"), JSON.stringify(tabela, null, 1));
const kb = (b) => (b == null ? "" : b >= 1e6 ? (b / 1e6).toFixed(2) + " MB" : (b / 1e3).toFixed(1) + " kB");
console.log("recorte | camada | n | partes | bruto | bruto.gz | 6casas | 6casas.gz | m(1m) | m.gz | m.gz sem id | dm(0,1m) | dm.gz | vért in→1m→0,1m");
for (const t of tabela) console.log([t.recorte, t.camada, t.n ?? t.area_km2 + " km²", t.partes_rua ?? "", kb(t.bruto), kb(t.bruto_gz), kb(t.limpo6), kb(t.limpo6_gz), kb(t.m1), kb(t.m1_gz), kb(t.m1semId_gz), kb(t.dm), kb(t.dm_gz), t.vert_in ? `${t.vert_in}→${t.vert_m1}→${t.vert_dm}` : ""].join(" | "));
