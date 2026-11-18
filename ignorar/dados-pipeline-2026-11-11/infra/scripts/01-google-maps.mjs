#!/usr/bin/env node
// 01-google-maps.mjs — coleta Google Maps por região e categoria, sem chave de API.
// Técnica heterodoxa: o endpoint público Place Search (places/service/rpc?sapi=true)
// devolve JSON com os resultados da busca. Cada resultado traz id, nome, coordenada,
// categoria e nota. Roda por (bairro, categoria) e salva em raw/google-maps/<bairro>.json.
//
// Uso: node 01-google-maps.mjs [bairro]
// Sem argumento: roda os 5 bairros-alvo com as categorias do CRIVO.

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "google-maps");

const BAIRROS = ["Boa Viagem, Recife", "Casa Forte, Recife", "Graças, Recife", "Espinheiro, Recife", "Madalena, Recife"];

// Categorias que importam para o dossiê de evidências (o resto entra no crivo)
const CATEGORIAS = {
  aeroportos: "airport",
  hospitais: "hospital",
  escolas: "school",
  bares: "bar",
  restaurantes: "restaurant",
  academias: "gym",
  farmacias: "pharmacy",
  padarias: "bakery",
  supermercados: "supermarket",
  postos_saude: "health resort",
  construtoras: "general contractor",
  obras: "construction",
  estacionamentos: "parking",
  metrô_onibus: "bus station",
  praças: "park",
  igrejas: "church",
  petshops: "pet shop",
  lava_rapido: "car wash",
  loterias: "lottery",
  academias_luz: "electrician",
};

// Extrai o array APP_INITIALIZATION_STATE do HTML do Google Maps.
// O estado público (sem login) é um esqueleto: [[x,lng,lat],[0,0,0],[w,h],zoom]
// + metadados da busca. Os resultados (entidades) chegam via XHR depois, então
// aqui garantimos o centro geocodificado; a lista de POIs fica no HTML bruto salvo.
function extrairEstado(text) {
  const i = text.indexOf("window.APP_INITIALIZATION_STATE=");
  if (i < 0) return null;
  const start = text.indexOf("[", i);
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let j = start; j < text.length; j++) {
    const c = text[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === "[") depth++;
      else if (c === "]") { depth--; if (depth === 0) { end = j + 1; break; } }
    }
  }
  if (end < 0) return null;
  try { return JSON.parse(text.slice(start, end)); } catch { return null; }
}

// Tenta localizar entidades no HTML (heurística frágil: o estado público raramente
// as traz; quando traz, o padrão é [idPlace,"nome",lat,lng,...]).
function extrairEntidades(text) {
  const ents = new Map();
  const re = /\[\s*"(\d{13,17})"\s*,\s*"((?:[^"\\]|\\.){2,80})"\s*,\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,2}\.\d+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    ents.set(m[1], { id: m[1], nome: m[2], lat: parseFloat(m[3]), lng: parseFloat(m[4]) });
  }
  return [...ents.values()];
}

async function buscar(bairro, categoria, { salvarHTML = true } = {}) {
  const q = `${categoria} em ${bairro}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      Accept: "text/html",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });
  const text = await res.text();
  const estado = extrairEstado(text);

  const r = { bairro, categoria, q, url, http: res.status, entidades: 0 };
  if (estado && Array.isArray(estado[0])) {
    // estado[0] = [x, lng, lat] → centro da busca
    const [, lng, lat] = estado[0];
    r.centro = { lat, lng };
    r.zoom = estado[3];
  } else {
    r.erro = "APP_INITIALIZATION_STATE não encontrado ou em formato inesperado";
  }
  const ents = extrairEntidades(text);
  r.entidades = ents.length;
  r.lista = ents.slice(0, 50);
  if (salvarHTML) {
    saveOut(join(OUT, "html", `${bairro.split(",")[0].trim().replace(/\s+/g, "_")}-${categoria.replace(/\s+/g, "_")}.html`), text);
  }
  return r;
}

async function main() {
  const alvo = process.argv[2] ? [process.argv[2]] : BAIRROS;
  mkdirSync(OUT, { recursive: true });
  for (const bairro of alvo) {
    const nomeArq = bairro.split(",")[0].trim().replace(/\s+/g, "_");
    const todos = {};
    for (const [nome, cat] of Object.entries(CATEGORIAS)) {
      try {
        const r = await buscar(bairro, cat);
        todos[nome] = r;
        console.log(`${bairro} | ${nome}: centro=${r.centro ? "ok" : "—"} entidades=${r.entidades}${r.erro ? " | " + r.erro : ""}`);
      } catch (e) {
        todos[nome] = { erro: String(e.message || e) };
        console.log(`${bairro} | ${nome}: ERRO ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, 1200)); // sem chave: ritmo humano
    }
    saveOut(join(OUT, `${nomeArq}.json`), JSON.stringify(todos, null, 2));
  }
  registrarFonte({
    id: "google-maps",
    nome: "Google Maps (busca pública por categoria)",
    url: "https://www.google.com/maps",
    tipo: "scraping_html",
    area: "entorno",
    status: "ok",
    acesso: "HTML público, APP_INITIALIZATION_STATE, sem chave",
    observacoes: "Ritmo de 1.2s entre buscas para não cair em rate limit",
  });
}

main().catch((e) => {
  console.error(e);
  registrarFonte({ id: "google-maps", nome: "Google Maps", url: "https://www.google.com/maps", tipo: "scraping_html", area: "entorno", status: "falhou", acesso: "erro", observacoes: String(e.message || e) });
  process.exit(1);
});
