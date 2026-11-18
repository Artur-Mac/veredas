// Checagens de qualidade numa janela. Uso: node qualidade.mjs <janela.geojson>
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const turf = require("@turf/turf");

const fc = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const por = (c) => fc.features.filter((f) => f.properties.camada === c);
const quadras = por("quadra"), lotes = por("lote"), ruas = por("rua"), predios = por("predio_indice"), agua = por("agua");
const quadraPorDsq = new Map(quadras.map((q) => [q.properties.dsq, q]));
const area = (g) => turf.area(g);
const inter = (a, b) => { try { const i = turf.intersect(turf.featureCollection([a, b])); return i ? area(i) : 0; } catch { return NaN; } };

// 1) lote dentro da sua quadra (DSQ = 8 primeiros dígitos do DSQFL)
let semQuadra = 0, fora = [], dentroOutra = 0;
for (const l of lotes) {
  const q = quadraPorDsq.get(l.properties.dsqfl.slice(0, 8));
  if (!q) { semQuadra++; continue; }
  const a = area(l), i = inter(l, q);
  fora.push(1 - i / a);
}
fora.sort((a, b) => a - b);
const pct = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))];
console.log(`lotes: ${lotes.length}; sem quadra na janela (código): ${semQuadra}`);
console.log(`  fração da área do lote FORA da sua quadra: mediana ${(pct(fora, 0.5) * 100).toFixed(2)}%, p90 ${(pct(fora, 0.9) * 100).toFixed(2)}%, max ${(fora.at(-1) * 100).toFixed(1)}%; lotes com >5% fora: ${fora.filter((x) => x > 0.05).length}`);

// 2) cobertura: quanto da quadra é coberto por lotes
const cob = [];
for (const q of quadras) {
  const ls = lotes.filter((l) => l.properties.dsqfl.startsWith(q.properties.dsq));
  const s = ls.reduce((s, l) => s + inter(l, q), 0);
  cob.push({ dsq: q.properties.dsq, n: ls.length, cob: s / area(q) });
}
const semLote = cob.filter((c) => c.n === 0).length;
const cobs = cob.filter((c) => c.n).map((c) => c.cob).sort((a, b) => a - b);
console.log(`quadras: ${quadras.length}; sem nenhum lote: ${semLote}; cobertura por lotes (soma área lote∩quadra / área quadra): mediana ${(pct(cobs, 0.5) * 100).toFixed(1)}%, p10 ${(pct(cobs, 0.1) * 100).toFixed(1)}%, >101%: ${cobs.filter((c) => c > 1.01).length}`);

// 3) sobreposição entre lotes vizinhos (amostra)
let sobre = 0, pares = 0;
const bb = lotes.map((l) => turf.bbox(l));
for (let i = 0; i < lotes.length; i++) for (let j = i + 1; j < lotes.length; j++) {
  const a = bb[i], b = bb[j];
  if (a[2] < b[0] || b[2] < a[0] || a[3] < b[1] || b[3] < a[1]) continue;
  pares++;
  const x = inter(lotes[i], lotes[j]);
  if (x > 1) sobre++;
}
console.log(`pares de lotes com bbox cruzada: ${pares}; com sobreposição > 1 m²: ${sobre}`);

// 4) ruas: comprimento que cai DENTRO de quadras (rua deveria correr entre quadras)
let total = 0, dentro = 0;
for (const r of ruas) {
  const linhas = r.geometry.type === "LineString" ? [r.geometry.coordinates] : r.geometry.coordinates;
  for (const l of linhas) for (let k = 1; k < l.length; k++) {
    const seg = turf.lineString([l[k - 1], l[k]]);
    const len = turf.length(seg, { units: "meters" });
    total += len;
    const mid = turf.midpoint(l[k - 1], l[k]);
    if (quadras.some((q) => turf.booleanPointInPolygon(mid, q))) dentro += len;
  }
}
console.log(`ruas: ${ruas.length} logradouros, ${(total / 1000).toFixed(2)} km; comprimento com ponto médio dentro de quadra: ${(dentro / total * 100).toFixed(1)}%`);
console.log(`  ruas sem nome: ${ruas.filter((r) => !r.properties.nome).length}; sem tipo derivável do nome: ${ruas.filter((r) => !r.properties.tipo).map((r) => r.properties.nome).join(" | ") || 0}`);

// 5) índice x lote: polígono do índice vs lote da base com o mesmo DSQFL
const lotePorDsqfl = new Map(lotes.map((l) => [l.properties.dsqfl, l]));
const ious = []; let semLoteBase = 0;
for (const p of predios) {
  const l = lotePorDsqfl.get(p.properties.dsqfl);
  if (!l) { semLoteBase++; continue; }
  const i = inter(p, l);
  ious.push(i / (area(p) + area(l) - i));
}
ious.sort((a, b) => a - b);
console.log(`predio_indice: ${predios.length}; sem lote de mesmo DSQFL na janela: ${semLoteBase}; IoU índice×lote: mediana ${pct(ious, 0.5)?.toFixed(3)}, min ${ious[0]?.toFixed(3)}, <0,9: ${ious.filter((x) => x < 0.9).length}`);
const alvo = fc.features.filter((f) => f.properties.alvo);
for (const a of alvo) console.log(`  alvo ${a.properties.camada}: área ${area(a).toFixed(0)} m², centroide ${turf.centroid(a).geometry.coordinates.map((v) => v.toFixed(6))}`);

// 6) água: lotes/quadras que invadem água
let invade = 0;
for (const q of quadras) for (const w of agua) { const x = inter(q, w); if (x > 5) invade++; }
console.log(`pares quadra×água com sobreposição > 5 m²: ${invade}`);
