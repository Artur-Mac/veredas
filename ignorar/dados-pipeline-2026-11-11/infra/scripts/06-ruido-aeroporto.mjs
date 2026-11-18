#!/usr/bin/env node
// 06-ruído-aeroporto.mjs — o cone de som do Aeroporto do Recife (Belo Jardim).
// Calcula o polígono de influência de ruído a partir da coordenada da pista
// e cruza com os prédios dos 5 bairros. Também busca o mapa oficial da ANAC.
//
// Pista principal do Recife (STU): 08L/26R, orientação ~86°/266°.
// Coordenada aproximada: -8.8383, -34.9040 (runway center)
// Cone de ruído: ±15° da cabeceira, até 15 km (FAA/ICAO model simplified).

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, readFileSync, existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "ruido-aeroporto");

const PISTA = { lat: -8.8383, lng: -34.9040, azimute: 86, nome: "08L/26R" };
const CONE = { angulo: 15, distMaxKm: 15 };

// Converte lat/lng para metros (aproximação local)
function paraMetros(lat, lng, refLat, refLng) {
  const x = (lng - refLng) * 111320 * Math.cos((refLat * Math.PI) / 180);
  const y = (lat - refLat) * 110540;
  return { x, y };
}

// Gera o polígono do cone de ruído (2 triângulos: uma por cabeceira)
function gerarCone() {
  const verts = [];
  for (const az of [PISTA.azimute, PISTA.azimute + 180]) {
    const rad = (az * Math.PI) / 180;
    const spread = (CONE.angulo * Math.PI) / 180;
    // Ponto do centro da pista
    const cx = 0, cy = 0;
    // Vértice oposto (extremidade do cone)
    const ex = cx + CONE.distMaxKm * 1000 * Math.sin(rad);
    const ey = cy + CONE.distMaxKm * 1000 * Math.cos(rad);
    // Bordas do cone
    const b1x = cx + CONE.distMaxKm * 1000 * Math.sin(rad - spread);
    const b1y = cy + CONE.distMaxKm * 1000 * Math.cos(rad - spread);
    const b2x = cx + CONE.distMaxKm * 1000 * Math.sin(rad + spread);
    const b2y = cy + CONE.distMaxKm * 1000 * Math.cos(rad + spread);
    verts.push(
      { x: cx, y: cy },
      { x: b1x, y: b1y },
      { x: ex, y: ey },
      { x: b2x, y: b2y },
    );
  }
  return verts;
}

// Verifica se um ponto está dentro do cone
function dentroDoCone(pt, coneVerts) {
  for (let i = 0; i < coneVerts.length; i += 4) {
    const poly = coneVerts.slice(i, i + 4);
    if (pointInPolygon(pt, poly)) return true;
  }
  return false;
}

function pointInPolygon(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  // 1) Gera o cone
  const cone = gerarCone();
  const coneGeo = {
    type: "FeatureCollection",
    name: "cone_ruido_recife",
    properties: {
      pista: PISTA,
      modelo: "cone simplificado ±15° até 15km (FAA/ICAO)",
      gerado_em: new Date().toISOString(),
      nota: "Cone teórico; validar com mapa oficial da ANAC/DECEA",
    },
    features: [
      { type: "Feature", properties: { pista: PISTA.nome, direcao: "08L (NNE)" }, geometry: { type: "Polygon", coordinates: [[cone.slice(0, 4).map((v) => [v.x, v.y])]] } },
      { type: "Feature", properties: { pista: PISTA.nome, direcao: "26R (SSW)" }, geometry: { type: "Polygon", coordinates: [[cone.slice(4, 8).map((v) => [v.x, v.y])]] } },
    ],
  };
  saveOut(join(OUT, "cone-ruido.geojson"), JSON.stringify(coneGeo, null, 2));
  console.log("Cone de ruído gerado.");

  // 2) Cruza com os lotes (se já baixados)
  const lotesDir = join(__dirname, "..", "..", "raw", "cadastro-municipal");
  const bairros = ["boa_viagem", "casa_forte", "gracas", "espinheiro", "madalena"];
  const afetados = [];
  for (const b of bairros) {
    const f = join(lotesDir, `lotes-${b}.geojson`);
    if (!existsSync(f)) continue;
    const gj = JSON.parse(readFileSync(f, "utf8"));
    for (const feat of gj.features) {
      const coords = feat.geometry?.coordinates?.[0]?.[0] || feat.geometry?.coordinates;
      if (!coords) continue;
      const { lat, lng } = typeof coords[0] === "number" ? { lat: coords[1], lng: coords[0] } : { lat: coords[0][1], lng: coords[0][0] };
      const pt = paraMetros(lat, lng, PISTA.lat, PISTA.lng);
      const distKm = Math.sqrt(pt.x * pt.x + pt.y * pt.y) / 1000;
      if (distKm <= CONE.distMaxKm && dentroDoCone(pt, cone)) {
        afetados.push({
          dsqfl: feat.properties?.DSQFL || feat.properties?.dsqfl,
          lat, lng,
          distancia_km: distKm.toFixed(2),
          bairro: b,
          endereco: feat.properties?.NMENDCOMP || feat.properties?.endereco || null,
        });
      }
    }
  }
  saveOut(join(OUT, "predios-afetados-ruido.json"), JSON.stringify(
    { modelo: coneGeo.properties, total_afiado: afetados.length, predios: afetados }, null, 2));
  console.log(`Prédios no cone de ruído: ${afetados.length}`);

  // 3) Busca o mapa oficial da ANAC (heterodoxo: busca no site)
  try {
    const html = await fetch("https://www.google.com/search?q=mapa+r%C3%B3tulo+de+ru%C3%ADdo+aeroporto+recife+ANAC&num=10", {
      headers: { "User-Agent": "Mozilla/5.0" },
    }).then((r) => r.text());
    const links = [...html.matchAll(/href="(https?:\/\/[^"]+anac[^"]*)"/g)].map((m) => m[1]);
    saveOut(join(OUT, "anac-links.json"), JSON.stringify(links, null, 2));
    console.log("ANAC links:", links.length);
  } catch (e) {
    console.error("ANAC:", e.message);
  }

  registrarFonte({
    id: "ruido-aeroporto-recife",
    nome: "Cone de ruído — Aeroporto Recife (Belo Jardim)",
    url: "https://www.anac.gov.br",
    tipo: "calculado + scraping",
    area: "ruido",
    status: "ok",
    acesso: "Cone teórico calculado (±15°, 15km) + busca ANAC",
    observacoes: "Validar com o mapa oficial de ruído da ANAC/DECEA; cruzar com lotes",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
