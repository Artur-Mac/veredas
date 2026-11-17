#!/usr/bin/env node
// 10-osm-pois.mjs — coleta POIs via Overpass API (OpenStreetMap).
// Mais confiável que o HTML público do Google Maps: traz nome, coordenada, tags.
// Roda por bairro (bounding box) e categoria (amenity/shop/tourism).
// Salva em raw/osm-pois/<bairro>.geojson.

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, readFileSync } from "node:fs";
// VE02: caixas tiradas do GeoJSON oficial e seletor testado (scripts/dados/observacoes/osm.mjs).
import { caixasDosBairros, resumirCategorias, seletorOverpass } from "../../../../scripts/dados/observacoes/osm.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "osm-pois");

// VE02: as caixas antigas estavam fixas perto da latitude −8,8 (fora do Recife). Agora vêm dos polígonos oficiais.
const GEOJSON_BAIRROS = join(__dirname, "..", "..", "raw", "cadastro-municipal", "bairros-do-recife.geojson");
const BAIRROS = caixasDosBairros(JSON.parse(readFileSync(GEOJSON_BAIRROS, "utf8")), ["Boa Viagem", "Casa Forte", "Graças", "Espinheiro", "Madalena"]);

// Mapeia categorias do CRIVO para Overpass tags
const CATEGORIAS = {
  restaurantes: { key: "amenity", values: ["restaurant", "cafe", "fast_food", "food_court"] },
  bares: { key: "amenity", values: ["bar", "pub", "brewpub"] },
  academias: { key: "leisure", values: ["fitness_centre", "gym"] },
  farmacias: { key: "amenity", values: ["pharmacy"] },
  padarias: { key: "shop", values: ["bakery"] },
  supermercados: { key: "shop", values: ["supermarket", "convenience", "grocery"] },
  hospitais: { key: "amenity", values: ["hospital"] },
  postos_saude: { key: "amenity", values: ["clinic", "doctor", "health_resort"] },
  escolas: { key: "amenity", values: ["school", "kindergarten", "university"] },
  igrejas: { key: "amenity", values: ["church", "place_of_worship", "mosque", "synagogue"] },
  praças: { key: "leisure", values: ["park", "garden", "square"] },
  estacionamentos: { key: "amenity", values: ["parking"] },
  metrô_onibus: { key: "highway", values: ["bus_station"] },
  petshops: { key: "shop", values: ["pet"] },
  lava_rapido: { key: "amenity", values: ["car_wash"] },
  loterias: { key: "shop", values: ["lottery"] },
  construtoras: { key: "office", values: ["architect", "company"] },
  aerportros: { key: "aeroway", values: ["aerodrome"] },
};

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function consultarOverpass(query, { tentativas = 3 } = {}) {
  let ultimoErro;
  for (let t = 0; t < tentativas; t++) {
    const mirror = OVERPASS_MIRRORS[t % OVERPASS_MIRRORS.length];
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 60000);
      const r = await fetch(mirror, {
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
      ultimoErro = `HTTP ${r.status} (${mirror.split("/")[2]})`;
    } catch (e) {
      ultimoErro = e.name === "AbortError" ? `timeout (${mirror.split("/")[2]})` : String(e.message || e);
    }
    if (t < tentativas - 1) {
      const espera = 5000 * (t + 1); // 5s, 10s
      console.log(`  retry em ${espera / 1000}s...`);
      await new Promise((res) => setTimeout(res, espera));
    }
  }
  throw new Error(ultimoErro);
}


async function buscarPOIs(bairro, box) {
  const resultado = {};

  for (const [nome, { key, values }] of Object.entries(CATEGORIAS)) {
    // VE02: o regex antigo `["k"~""a"|"b""]` quebrava as aspas; `nwr` cobre nós, vias e relações.
    const query = `[out:json][timeout:60];(${seletorOverpass(key, values, box)});out center 500;`;
    try {
      const d = await consultarOverpass(query);
      const elements = d.elements || [];
      resultado[nome] = {
        total: elements.length,
        pois: elements
          .filter((e) => e.tags?.name)
          .map((e) => ({
            id: `${e.type}/${e.id}`,
            nome: e.tags.name,
            lat: e.lat || e.center?.lat || null,
            lng: e.lon || e.center?.lon || null,
            tags: e.tags,
          })),
      };
      console.log(`${bairro} | ${nome}: ${elements.length} elementos, ${resultado[nome].pois.length} com nome`);
    } catch (e) {
      resultado[nome] = { total: -1, erro: String(e.message || e) };
      console.log(`${bairro} | ${nome}: ERRO ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 3000)); // Overpass é lento
  }

  return resultado;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const alvo = process.argv[2] ? [process.argv[2]] : Object.keys(BAIRROS);

  const estados = [];
  for (const bairro of alvo) {
    const box = BAIRROS[bairro];
    if (!box) {
      console.error(`Bairro desconhecido: ${bairro}. Use: ${Object.keys(BAIRROS).join(", ")}`);
      process.exit(1);
    }
    const resultado = await buscarPOIs(bairro, box);
    estados.push(resumirCategorias(resultado).estado);
    const nomeArq = bairro.toLowerCase().replace(/\s+/g, "_");
    saveOut(join(OUT, `${nomeArq}.json`), JSON.stringify({ bairro, consultado_em: new Date().toISOString(), ...resultado }, null, 2));
    console.log(`--- ${bairro} salvo ---`);
  }

  registrarFonte({
    id: "osm-pois",
    nome: "OpenStreetMap (Overpass API)",
    url: "https://overpass-api.de",
    tipo: "api_publica",
    area: "entorno",
    // VE02: o status era "ok" mesmo com todas as categorias em erro. Agora reflete o resultado.
    status: estados.every((e) => e === "valida") ? "ok" : estados.every((e) => e === "falhou") ? "falhou" : "parcial",
    acesso: "API pública, sem chave, rate limit de servidor",
    observacoes: "POIs com nome, coordenada e tags. Complementa o Google Maps (que só devolve o centro).",
  });
}

main().catch((e) => {
  console.error(e);
  registrarFonte({ id: "osm-pois", nome: "OSM POIs", url: "https://overpass-api.de", tipo: "api_publica", area: "entorno", status: "falhou", acesso: "erro", observacoes: String(e.message || e) });
  process.exit(1);
});
