#!/usr/bin/env node
// validar-gtfs.mjs — valida as coordenadas do GTFS Grande Recife contra os
// limites municipais (bairros-do-recife.geojson) e recalcula as contagens
// de 400 m por bairro. Metodologia em docs/dados/validacao-defesa-civil-gtfs.md.
//
// Uso: node validar-gtfs.mjs
// Lê raw/transporte/paradas.json e raw/cadastro-municipal/bairros-do-recife.geojson.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW = join(__dirname, "..", "..", "raw");

// ---- ponto-em-polígono (ray casting) ----
// coords pode ser Polygon ([[anel0, furos...]]) ou MultiPolygon ([[pol0, pol1...]]).
// MultiPolygon: XOR sobre todos os anéis de todos os polígonos.
function pontoEmPoligono(lat, lng, coords) {
  // detecta MultiPolygon: c[0][0] é array de anéis, não de vértices
  const multipol = Array.isArray(coords[0]) && Array.isArray(coords[0][0]) && Array.isArray(coords[0][0][0]);
  const polys = multipol ? coords : [coords];
  let inside = false;
  for (const poligono of polys) {
    for (const anel of poligono) {
      for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
        const xi = anel[i][0], yi = anel[i][1];
        const xj = anel[j][0], yj = anel[j][1];
        if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
      }
    }
  }
  return inside;
}

function bbox(coords) {
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  const walk = (k) => {
    if (typeof k[0] === "number") { c = Math.min(c, k[0]); d = Math.max(d, k[0]); a = Math.min(a, k[1]); b = Math.max(b, k[1]); }
    else k.forEach(walk);
  };
  walk(coords);
  return { latMin: a, latMax: b, lngMin: c, lngMax: d };
}

const bairros = JSON.parse(readFileSync(join(RAW, "cadastro-municipal", "bairros-do-recife.geojson"), "utf8"));
const pol = new Map();
for (const f of bairros.features) pol.set(f.properties.EBAIRRNOME.toUpperCase(), f.geometry.coordinates);
const recife = new Set([...pol.keys()]);

const paradas = JSON.parse(readFileSync(join(RAW, "transporte", "paradas.json"), "utf8"));
const stops = paradas.paradas;
const OFFSET = 0.75;

// 1) Quantas paradas originais caem dentro de algum bairro do Recife?
let dentroRecife = 0;
const contagemBairrosOrig = {};
for (const s of stops) {
  let hit = null;
  for (const [nome, coords] of pol) {
    const bb = bbox(coords);
    if (s.lat < bb.latMin || s.lat > bb.latMax || s.lng < bb.lngMin || s.lng > bb.lngMax) continue;
    if (pontoEmPoligono(s.lat, s.lng, coords)) { hit = nome; break; }
  }
  if (hit) { dentroRecife++; contagemBairrosOrig[hit] = (contagemBairrosOrig[hit] || 0) + 1; }
}

// 2) Mesmo teste com o offset lat - 0.75°
let dentroRecifeCorr = 0;
const contagemBairrosCorr = {};
for (const s of stops) {
  let hit = null;
  for (const [nome, coords] of pol) {
    const bb = bbox(coords);
    const lat = s.lat - OFFSET;
    if (lat < bb.latMin || lat > bb.latMax || s.lng < bb.lngMin || s.lng > bb.lngMax) continue;
    if (pontoEmPoligono(lat, s.lng, coords)) { hit = nome; break; }
  }
  if (hit) { dentroRecifeCorr++; contagemBairrosCorr[hit] = (contagemBairrosCorr[hit] || 0) + 1; }
}

// 3) Testes de ponto: "Terminal Residencial Boa Viagem" e centros dos 5 bairros-alvo.
const terminais = stops.filter(s => /residencial boa viagem/i.test(s.nome));
const testeTerminal = terminais.map(t => ({
  nome: t.nome,
  id: t.id,
  bruto: { lat: t.lat, lng: t.lng,
    bairro: [...pol.entries()].find(([, c]) => pontoEmPoligono(t.lat, t.lng, c))?.[0] || null,
    dentroRecife: [...pol.values()].some(c => pontoEmPoligono(t.lat, t.lng, c)),
  },
  corrigido: { lat: +(t.lat - OFFSET).toFixed(7), lng: t.lng,
    bairro: [...pol.entries()].find(([, c]) => pontoEmPoligono(t.lat - OFFSET, t.lng, c))?.[0] || null,
    dentroRecife: [...pol.values()].some(c => pontoEmPoligono(t.lat - OFFSET, t.lng, c)),
  },
}));

const centros = {
  "BOA VIAGEM": { lat: -8.0987, lng: -34.8827 },  // canto SE do bbox real do bairro (sul do bairro)
};

// 4) Distância de ~83 km do offset em lat
const distOffsetKm = (0.75 * Math.PI / 180 * 6378.137).toFixed(1);

// 5) Contagens 400 m por bairro-alvo (haversine), com e sem offset — para comparar.
function distM(lat1, lng1, lat2, lng2) {
  const x = (lng2 - lng1) * 111320 * Math.cos(((lat1 + lat2) / 2 * Math.PI) / 180);
  const y = (lat2 - lat1) * 110540;
  return Math.sqrt(x * x + y * y);
}
const alvoCentros = {
  "Boa Viagem": { lat: -8.8650, lng: -34.8950 },
  "Casa Forte": { lat: -8.8150, lng: -34.9150 },
  "Graças": { lat: -8.8500, lng: -34.9250 },
  "Espinheiro": { lat: -8.8400, lng: -34.9300 },
  "Madalena": { lat: -8.8550, lng: -34.9350 },
};
const contagem400 = {};
for (const [nome, c] of Object.entries(alvoCentros)) {
  let sem = 0, com = 0;
  for (const s of stops) {
    if (distM(c.lat, c.lng, s.lat, s.lng) <= 400) sem++;
    if (distM(c.lat, c.lng, s.lat - OFFSET, s.lng) <= 400) com++;
  }
  contagem400[nome] = { semOffset: sem, comOffset: com };
}

// 6) Serviço programado: quantas paradas têm viagens em trips/stop_times?
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fs = require("node:fs");
const GTFS_DIR = join(RAW, "transporte", "gtfs-extracted");
function csvRows(file) {
  if (!fs.existsSync(file)) return null;
  const rows = parseCSVSimple(fs.readFileSync(file, "utf8"), ",");
  return { header: rows[0], rows: rows.slice(1) };
}
function parseCSVSimple(text, sep) {
  const rows = []; let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === sep) { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
let servico = null;
try {
  const trips = csvRows(join(GTFS_DIR, "trips.txt"));
  const st = csvRows(join(GTFS_DIR, "stop_times.txt"));
  const cal = csvRows(join(GTFS_DIR, "calendar.txt"));
  if (trips && st) {
    const iStop = st.header.findIndex(h => h === "stop_id");
    const iTrip = st.header.findIndex(h => h === "trip_id");
    const stopsComViagem = new Set();
    const iTripStop = trips.header.findIndex(h => h === "stop_id");
    for (const r of st.rows) if (r[iStop]) stopsComViagem.add(r[iStop]);
    // paradas com offset aplicado que têm viagens
    let comViagemCorr = 0;
    for (const s of stops) if (stopsComViagem.has(s.id)) comViagemCorr++;
    servico = {
      paradasComViagens: stopsComViagem.size,
      paradasTotal: stops.length,
      viagens: trips.rows.length,
      stopTimes: st.rows.length,
      diasCalendario: cal ? cal.rows.length : null,
      nota: "paradas sem viagens em stop_times podem ser terminais (location_type=1) ou paradas sem serviço no período do calendário",
    };
  }
} catch (e) { servico = { erro: e.message }; }

console.log(JSON.stringify({
  gerado_em: new Date().toISOString(),
  totalParadas: stops.length,
  paradasDentroDoRecife: { bruto: dentroRecife, corrigido: dentroRecifeCorr },
  contagemBairros: { bruto: contagemBairrosOrig, corrigido: contagemBairrosCorr },
  testeTerminalResidencialBoaViagem: testeTerminal,
  deslocamentoDoOffsetKm: distOffsetKm,
  contagem400mPorBairro: contagem400,
  servicoProgramado: servico,
}, null, 2));
