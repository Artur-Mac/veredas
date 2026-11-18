// Gera as janelas A (gaveta) e B (por perto) em GeoJSON EPSG:4326, uma FeatureCollection por janela.
// Uso: node janelas.mjs <dir-brutos> <dir-indice> <dir-saida>
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const turf = require("@turf/turf");

const [BRUTOS, INDICE, SAIDA] = process.argv.slice(2);
const L = (f) => JSON.parse(fs.readFileSync(path.join(BRUTOS, f), "utf8"));

const CENTRO = [-34.907539, -8.141503]; // Golden Tower, índice 8001-216
const DSQFL_ALVO = "61845335020347";
const ID_ALVO = "8001-216";
const M_LAT = 110574;
const M_LON = 111320 * Math.cos((CENTRO[1] * Math.PI) / 180);
const janela = (w, h) => [CENTRO[0] - w / 2 / M_LON, CENTRO[1] - h / 2 / M_LAT, CENTRO[0] + w / 2 / M_LON, CENTRO[1] + h / 2 / M_LAT];
const JANELAS = { A: { nome: "gaveta", bbox: janela(450, 400) }, B: { nome: "por-perto", bbox: janela(1600, 1400) } };

const r6 = (c) => (typeof c[0] === "number" ? [Math.round(c[0] * 1e6) / 1e6, Math.round(c[1] * 1e6) / 1e6] : c.map(r6));
const bboxDe = (g) => turf.bbox(g);
const cruza = (a, b) => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);

// remove anéis/linhas degenerados depois do clip e pontos repetidos
function limparGeom(g) {
  const dedup = (pts) => pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    const polys = (g.type === "Polygon" ? [g.coordinates] : g.coordinates)
      .map((p) => p.map((r) => dedup(r6(r))).filter((r) => r.length >= 4 && Math.abs(turf.area(turf.polygon([r]))) > 0.01))
      .filter((p) => p.length > 0);
    if (!polys.length) return null;
    return polys.length === 1 ? { type: "Polygon", coordinates: polys[0] } : { type: "MultiPolygon", coordinates: polys };
  }
  if (g.type === "LineString" || g.type === "MultiLineString") {
    const ls = (g.type === "LineString" ? [g.coordinates] : g.coordinates).map((l) => dedup(r6(l))).filter((l) => l.length >= 2);
    if (!ls.length) return null;
    return ls.length === 1 ? { type: "LineString", coordinates: ls[0] } : { type: "MultiLineString", coordinates: ls };
  }
  return { type: g.type, coordinates: r6(g.coordinates) };
}
function recortar(feat, bbox) {
  if (!feat.geometry) return null;
  if (!cruza(bboxDe(feat), bbox)) return null;
  const c = turf.bboxClip(feat, bbox);
  return limparGeom(c.geometry);
}

const tipoDaVia = (nome) => {
  const m = /^(Rua|Avenida|Travessa|Praça|Praca|Largo|Beco|Estrada|Via|Ponte|Viaduto|Alameda|Vila|Ladeira|Caminho|Passagem|Rodovia|Cais|Pátio|Patio|Escadaria|Córrego|Corrego|Rotatória|Parque|Loteamento|Conjunto)\b/i.exec(nome || "");
  return m ? m[1].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : null;
};

console.time("camadas");
const fontes = {
  bairros: L("bairros-do-recife.geojson").features,
  quadras: L("quadras.geojson").features,
  ruas: L("trechos-de-logradouros.geojson").features,
  agua: L("recursos-hidricos.geojson").features,
  pracas: L("parques-e-pracas.geojson").features,
};
console.timeEnd("camadas");

// lotes: uma feição por linha; guarda só os que cruzam a janela B
const lotesB = [];
{
  const rl = readline.createInterface({ input: fs.createReadStream(path.join(BRUTOS, "lotes.geojson")), crlfDelay: Infinity });
  let n = 0;
  for await (const linha of rl) {
    if (!linha.startsWith('{ "type": "Feature"')) continue;
    n++;
    const f = JSON.parse(linha.replace(/,\s*$/, ""));
    if (f.geometry && cruza(bboxDe(f), JANELAS.B.bbox)) lotesB.push(f);
  }
  console.log("lotes lidos", n, "na janela B", lotesB.length);
}

// índice do app: todos os bairros cujo limite cruza a janela B
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const bairrosB = fontes.bairros.filter((f) => cruza(bboxDe(f), JANELAS.B.bbox));
const edificios = [];
for (const b of bairrosB) {
  const arq = path.join(INDICE, slug(b.properties.EBAIRRNOMEOF || b.properties.EBAIRRNOME) + ".json");
  if (fs.existsSync(arq)) edificios.push(...JSON.parse(fs.readFileSync(arq, "utf8")).edificios);
  else console.log("sem índice para", b.properties.EBAIRRNOMEOF);
}
console.log("bairros que cruzam B:", bairrosB.map((b) => b.properties.EBAIRRNOMEOF).join(", "), "| edifícios do índice:", edificios.length);

for (const [id, J] of Object.entries(JANELAS)) {
  const bbox = J.bbox;
  const out = [];
  const push = (camada, geom, props) => geom && out.push({ type: "Feature", properties: { camada, ...props }, geometry: geom });

  for (const f of fontes.bairros) {
    const g = recortar(f, bbox);
    push("bairro", g, { nome: f.properties.EBAIRRNOMEOF, codigo: f.properties.CBAIRRCODI });
  }
  for (const f of fontes.agua) {
    const g = recortar(f, bbox);
    const nome = f.properties.NMRECHIDRIC || null;
    push("agua", g, { nome, tipo: nome ? nome.split(" ")[0].toLowerCase() : null });
  }
  for (const f of fontes.pracas) {
    const g = recortar(f, bbox);
    const p = f.properties;
    push("praca", g, { nome: p.NMNOMEOFIC || p.NMNOME || null, tipo: (p.CDTIPO || "").replace("PRACA", "PRAÇA").toLowerCase() || null });
  }
  for (const f of fontes.quadras) {
    const g = recortar(f, bbox);
    push("quadra", g, { dsq: f.properties.DSQ });
  }
  for (const f of lotesB) {
    const g = recortar(f, bbox);
    const p = f.properties;
    const props = { dsqfl: p.DSQFL, pavimentos: p.QTDPAVIMENTOS ?? null, area_lote_m2: p.AREALOTE ?? null };
    if (p.DSQFL === DSQFL_ALVO) props.alvo = true;
    push("lote", g, props);
  }
  for (const f of fontes.ruas) {
    const g = recortar(f, bbox);
    const p = f.properties;
    push("rua", g, {
      nome: p.NLGPAVOFIC || p.NLOGRACONC,
      nome_curto: p.NLGPAVRESU || null,
      codigo: p.CLOGRACODI,
      tipo: tipoDaVia(p.NLGPAVOFIC), // derivado do nome; a base não traz tipo nem hierarquia
      pavimentacao: p.INDPAV || null,
      corredor_transporte: p.CT || null,
      perimetral: p.NMPERIMETR || null,
    });
  }
  // vários registros do índice (números do mesmo condomínio) compartilham o polígono: um por polígono
  const grupos = new Map();
  for (const e of edificios) {
    if (!e.poligono || e.poligono.length < 3) continue;
    const k = JSON.stringify(e.poligono);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(e);
  }
  for (const grupo of grupos.values()) {
    const e0 = grupo.find((e) => e.id === ID_ALVO) || grupo.find((e) => e.nome) || grupo[0];
    const anel = [...e0.poligono, e0.poligono[0]];
    const g = recortar(turf.polygon([anel]), bbox);
    const props = {
      id: e0.id,
      ids: grupo.length > 1 ? grupo.map((e) => e.id) : undefined,
      nome: e0.nome ?? null,
      dsqfl: e0.dsqfl ?? null,
      pavimentos: e0.pavimentos ?? null,
      unidades: grupo.reduce((s, e) => s + (e.unidades || 0), 0) || null,
    };
    if (grupo.some((e) => e.id === ID_ALVO)) props.alvo = true;
    push("predio_indice", g, props);
  }

  const fc = { type: "FeatureCollection", name: `janela-${id}-${J.nome}`, bbox: bbox.map((v) => Math.round(v * 1e6) / 1e6), features: out };
  const arq = path.join(SAIDA, `janela-${id}-${J.nome}.geojson`);
  fs.writeFileSync(arq, JSON.stringify(fc));
  const cont = {};
  for (const f of out) cont[f.properties.camada] = (cont[f.properties.camada] || 0) + 1;
  console.log(`janela ${id} (${J.nome})`, bbox.map((v) => v.toFixed(6)).join(","), fs.statSync(arq).size, "bytes", cont);
  console.log("  alvo:", out.filter((f) => f.properties.alvo).map((f) => f.properties.camada + ":" + (f.properties.nome || f.properties.dsqfl)).join(", "));
}
