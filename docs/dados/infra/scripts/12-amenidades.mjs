#!/usr/bin/env node
// 12-amenidades.mjs — custo a pé por bairro: POIs via Overpass + métricas de
// proximidade (distância em linha reta + tempo de caminhada estimado).
//
// Fonte: OpenStreetMap via Overpass API (mirror maps.mail.ru, o único que
// respondeu no momento da coleta). Cada POI tem nome, coordenada e tags.
//
// Métricas por categoria e por bairro:
//   - contagem total de POIs
//   - distância mínima (linha reta) do centroide do bairro até o POI mais próximo
//   - distância média dos 5 POIs mais próximos
//   - tempo de caminhada estimado (4,8 km/h → 80 m/min)
//   - POIs dentro do bounding box (proximidade imediata)
//
// Uso: node 12-amenidades.mjs
// Saída: raw/amenidades/amenidades.json
//
// Nota: as distâncias são em linha reta (haversine), não o trajeto real.
// O tempo de caminhada usa 80 m/min (4,8 km/h), velocidade média de adulto.

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, readFileSync } from "node:fs";
// VE02: seletores e caixas vêm do construtor testado (scripts/dados/observacoes/osm.mjs).
import { seletorOverpass, validarCaixa } from "../../../../scripts/dados/observacoes/osm.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "amenidades");
const GEOJSON_BAIRROS = join(__dirname, "..", "..", "raw", "cadastro-municipal", "bairros-do-recife.geojson");

// Bbox corretos extraídos do GeoJSON municipal (EBAIRRNOME)
const BAIRROS = [
  { nome: "Boa Viagem", codi: "BOA VIAGEM", bbox: { s: -8.15533, w: -34.91795, n: -8.09875, e: -34.88267 } },
  { nome: "Casa Forte", codi: "CASA FORTE", bbox: { s: -8.03797, w: -34.92369, n: -8.02954, e: -34.91393 } },
  { nome: "Graças", codi: "GRACAS", bbox: { s: -8.05347, w: -34.90501, n: -8.03615, e: -34.89374 } },
  { nome: "Espinheiro", codi: "ESPINHEIRO", bbox: { s: -8.05010, w: -34.89697, n: -8.03856, e: -34.88460 } },
  { nome: "Madalena", codi: "MADALENA", bbox: { s: -8.06209, w: -34.91646, n: -8.04672, e: -34.90049 } },
];

// Categorias que importam para o custo a pé do morador (subconjunto do CRIVO)
const CATEGORIAS = {
  supermercados: { key: "shop", values: ["supermarket", "convenience", "grocery"] },
  farmacias: { key: "amenity", values: ["pharmacy"] },
  padarias: { key: "shop", values: ["bakery"] },
  restaurantes: { key: "amenity", values: ["restaurant", "cafe", "fast_food", "food_court"] },
  academias: { key: "leisure", values: ["fitness_centre", "gym"] },
  hospitais: { key: "amenity", values: ["hospital"] },
  postos_saude: { key: "amenity", values: ["clinic", "doctor"] },
  escolas: { key: "amenity", values: ["school", "kindergarten"] },
  praças: { key: "leisure", values: ["park", "garden", "square"] },
};

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// Haversine em metros
function distMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Centroide aproximado: média dos vértices do polígono (suficiente para
// estimar a distância até o POI mais próximo; não é o centroide geométrico
// exato, mas estável e reproduzível).
function centroide(geometry) {
  let latSum = 0, lonSum = 0, n = 0;
  const walk = (c) => {
    if (!Array.isArray(c)) return;
    if (typeof c[0] === "number") { lonSum += c[0]; latSum += c[1]; n++; }
    else c.forEach(walk);
  };
  walk(geometry.coordinates);
  return { lat: latSum / n, lon: lonSum / n };
}

function pontoNoBbox(lat, lon, bbox) {
  return lat >= bbox.s && lat <= bbox.n && lon >= bbox.w && lon <= bbox.e;
}

function tempoCaminhadaMin(distM) {
  return Math.round(distM / 80); // 80 m/min
}

async function consultarOverpass(query, { tentativas = 2 } = {}) {
  const erros = [];
  for (const url of OVERPASS_MIRRORS) {
    for (let t = 0; t < tentativas; t++) {
      const host = new URL(url).host;
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 70000);
        const r = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Vereda-Research/1.0",
          },
          body: "data=" + encodeURIComponent(query),
          signal: ctrl.signal,
        });
        clearTimeout(timeout);
        const text = await r.text();
        if (r.ok && text.startsWith("{")) {
          return JSON.parse(text);
        }
        // extrair mensagem de erro do XML Overpass
        const m = text.match(/<p>([^<]+)<\/p>/);
        erros.push(`${host} ${r.status}${m ? `: ${m[1].slice(0, 100)}` : ""}`);
        console.log(`  ${host} ${r.status}${m ? ` (${m[1].slice(0, 80)})` : ""}`);
      } catch (e) {
        const msg = e.name === "AbortError" ? "timeout 70s" : String(e.message || e);
        erros.push(`${host} ${msg}`);
        console.log(`  ${host} erro: ${msg}`);
      }
      if (t < tentativas - 1) {
        const espera = 5000 * (t + 1);
        console.log(`  retry em ${espera / 1000}s...`);
        await new Promise((res) => setTimeout(res, espera));
      }
    }
  }
  throw new Error(erros.join(" | "));
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  // Carregar geojson para centroide
  const geo = JSON.parse(readFileSync(GEOJSON_BAIRROS, "utf8"));

  const resultado = {};
  // VE02: antes declarado dentro do laço e usado depois dele (ReferenceError ao salvar).
  const todosPois = {}; // POIs crus por bairro e categoria
  let falhas = 0;

  for (const b of BAIRROS) {
    validarCaixa(b.bbox);
    console.log(`\n=== ${b.nome} ===`);
    const feat = geo.features.find((f) => f.properties.EBAIRRNOME === b.codi);
    if (!feat) {
      console.log("  GeoJSON: não encontrado");
      falhas++;
      continue;
    }
    const centro = centroide(feat.geometry);
    console.log(`  centroide: ${centro.lat.toFixed(4)}, ${centro.lon.toFixed(4)}`);

    const categorias = {};
    todosPois[b.nome] = {};

    for (const [cat, { key, values }] of Object.entries(CATEGORIAS)) {
      // VE02: `amenity["pharmacy"](...)` não é Overpass QL; o seletor válido é `nwr["amenity"~"^(pharmacy)$"](s,w,n,e);`.
      const matchers = seletorOverpass(key, values, b.bbox);
      const query = `[out:json][timeout:30];(${matchers});out center;`;
      try {
        const resp = await consultarOverpass(query);
        const elements = resp.elements || [];
        const pois = elements.map((el) => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          return {
            id: el.id,
            tipo: el.type,
            nome: el.tags?.name || null,
            lat,
            lon,
            tags: el.tags || {},
            distancia_centro_m: lat && lon ? Math.round(distMetros(centro.lat, centro.lon, lat, lon)) : null,
            dentro_bbox: lat && lon ? pontoNoBbox(lat, lon, b.bbox) : false,
          };
        }).filter((p) => p.lat && p.lon);

        // Métricas
        const dists = pois.map((p) => p.distancia_centro_m).filter((d) => d !== null).sort((a, c) => a - c);
        const proximos5 = dists.slice(0, 5);
        const dentro = pois.filter((p) => p.dentro_bbox).length;

        categorias[cat] = {
          total: pois.length,
          dentro_bbox: dentro,
          distancia_minima_m: dists.length ? dists[0] : null,
          distancia_media_5proximos_m: proximos5.length ? Math.round(proximos5.reduce((a, c) => a + c, 0) / proximos5.length) : null,
          tempo_caminhada_min_minimo: dists.length ? tempoCaminhadaMin(dists[0]) : null,
          tempo_caminhada_min_media_5proximos: proximos5.length ? tempoCaminhadaMin(Math.round(proximos5.reduce((a, c) => a + c, 0) / proximos5.length)) : null,
        };

        todosPois[b.nome][cat] = pois;
        console.log(`  ${cat}: ${pois.length} POIs | mín ${dists.length ? dists[0] + "m" : "?"} | 5prox méd ${proximos5.length ? Math.round(proximos5.reduce((a, c) => a + c, 0) / proximos5.length) + "m" : "?"} | dentro bbox: ${dentro}`);
      } catch (e) {
        categorias[cat] = { total: -1, erro: e.message };
        todosPois[b.nome][cat] = [];
        console.log(`  ${cat}: ERRO ${e.message}`);
        falhas++;
      }
      // pausar entre queries para não sobrecarregar o mirror
      await new Promise((res) => setTimeout(res, 3000));
    }

    resultado[b.nome] = {
      bairro: b.nome,
      centroide: { lat: +centro.lat.toFixed(6), lon: +centro.lon.toFixed(6) },
      bbox: b.bbox,
      consultado_em: new Date().toISOString(),
      categorias,
    };
  }

  saveOut(join(OUT, "amenidades.json"), JSON.stringify({
    consultado_em: new Date().toISOString(),
    metodo: "Overpass API (maps.mail.ru) — POIs por bounding box do bairro. Distâncias em linha reta (haversine) do centroide do bairro até o POI. Tempo de caminhada: 80 m/min.",
    bairros: resultado,
    pois_crudos: todosPois,
  }, null, 2));

  console.log(`\n--- salvo em ${OUT}/amenidades.json (${Object.keys(resultado).length} bairros, ${falhas} falhas) ---`);

  const status = falhas === 0 ? "ok" : falhas === BAIRROS.length * Object.keys(CATEGORIAS).length ? "falhou" : "parcial";
  registrarFonte({
    id: "osm_overpass",
    nome: "OpenStreetMap (Overpass API)",
    url: "https://www.openstreetmap.org",
    tipo: "api_publica",
    area: "amenidades",
    status,
    acesso: "Overpass API (mirror maps.mail.ru), bounding box do bairro municipal, tags de amenity/shop/leisure",
    observacoes:
      "POIs georreferenciados por contribuintes do OSM. Cobertura varia por bairro e categoria. " +
      "Distâncias calculadas em linha reta (haversine) do centroide do bairro — não o trajeto real de caminhada. " +
      "Tempo estimado a 80 m/min (4,8 km/h).",
  });
}

main().catch((e) => {
  console.error(e);
  registrarFonte({
    id: "osm_overpass",
    nome: "OpenStreetMap (Overpass API)",
    url: "https://www.openstreetmap.org",
    tipo: "api_publica",
    area: "amenidades",
    status: "falhou",
    acesso: "erro",
    observacoes: String(e.message || e),
  });
  process.exit(1);
});
