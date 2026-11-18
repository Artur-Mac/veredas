#!/usr/bin/env node
/**
 * Gera src/dados/recife/aeroporto.json: o eixo da pista do Aeroporto Internacional do Recife/Guararapes, lido do
 * OpenStreetMap (ODbL), para o app mostrar o aeroporto como fonte de ruído com nome e distância, sem decibéis
 * (hub, 18/11/2026: feature "Ruído do aeroporto").
 *
 * Uso: node scripts/dados/pista-aeroporto-recife.mjs
 *
 * - Lê a via OSM da pista pela API principal do OpenStreetMap (/way/{id}/full), com cache em .cache/dados-recife/.
 *   Com o cache, a reexecução não usa a rede.
 * - Confere as etiquetas (aeroway=runway, ref 18/36) e o comprimento medido contra a etiqueta `length`, com folga de
 *   3%. Se a via mudar de forma ou de etiqueta, o script para: nada é ajustado à mão.
 * - Substitui o cone de 11/11/2026 (docs/dados/raw/ruido-aeroporto), que punha a pista uns 80 km ao sul do Recife e
 *   com o rumo de outra pista.
 * - Node >= 20, sem dependências. User-Agent genérico, sem nome de pessoa ou projeto.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR_CACHE = path.join(RAIZ, ".cache", "dados-recife");
const DESTINO = path.join(RAIZ, "src", "dados", "recife", "aeroporto.json");

const WAY_DA_PISTA = 22732877;
const URL_API = `https://api.openstreetmap.org/api/0.6/way/${WAY_DA_PISTA}/full.json`;
const URL_PUBLICA = `https://www.openstreetmap.org/way/${WAY_DA_PISTA}`;
const CACHE = path.join(DIR_CACHE, `osm-way-${WAY_DA_PISTA}-full.json`);

const M_POR_GRAU_LAT = 110574;
const metros = (a, b) => {
  const kx = 111320 * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  return Math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * M_POR_GRAU_LAT);
};

async function lerVia() {
  if (fs.existsSync(CACHE)) return { corpo: JSON.parse(fs.readFileSync(CACHE, "utf-8")), doCache: true };
  const resp = await fetch(URL_API, { headers: { "User-Agent": "osm-data-script/1.0" }, signal: AbortSignal.timeout(60_000) });
  if (!resp.ok) throw new Error(`API do OpenStreetMap: HTTP ${resp.status}`);
  const corpo = await resp.json();
  fs.mkdirSync(DIR_CACHE, { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify({ ...corpo, consultadoEm: new Date().toISOString().replace(/\.\d{3}Z$/, "Z") }));
  return { corpo: JSON.parse(fs.readFileSync(CACHE, "utf-8")), doCache: false };
}

const { corpo, doCache } = await lerVia();
const via = corpo.elements.find((e) => e.type === "way" && e.id === WAY_DA_PISTA);
if (!via) throw new Error(`a resposta não traz a via ${WAY_DA_PISTA}`);
if (via.tags?.aeroway !== "runway" || via.tags?.ref !== "18/36") throw new Error(`etiquetas inesperadas: ${JSON.stringify(via.tags)}`);
const nos = new Map(corpo.elements.filter((e) => e.type === "node").map((n) => [n.id, [n.lon, n.lat]]));
const pontos = via.nodes.map((id) => {
  const p = nos.get(id);
  if (!p) throw new Error(`nó ${id} ausente`);
  return p;
});
// O eixo é a linha entre as duas pontas da via; a cabeceira 18 fica ao norte (o avião pousa rumo ao sul).
const [a, b] = [pontos[0], pontos[pontos.length - 1]];
const [norte, sul] = a[1] > b[1] ? [a, b] : [b, a];
const comprimento = Math.round(metros(norte, sul));
const declarado = Number(via.tags.length);
if (Number.isFinite(declarado) && Math.abs(comprimento - declarado) / declarado > 0.03) {
  throw new Error(`comprimento medido ${comprimento} m difere da etiqueta length=${declarado} m`);
}
const r6 = (n) => Math.round(n * 1e6) / 1e6;

const saida = {
  versao: 1,
  aeroporto: "Aeroporto Internacional do Recife/Guararapes",
  pista: {
    ref: via.tags.ref,
    cabeceiraNorte: { ref: "18", lonLat: norte.map(r6) },
    cabeceiraSul: { ref: "36", lonLat: sul.map(r6) },
    comprimentoM: comprimento,
    larguraM: Number(via.tags.width) || null,
  },
  fonte: {
    nome: "OpenStreetMap (via da pista)",
    licenca: "ODbL",
    atribuicao: "© colaboradores do OpenStreetMap",
    url: URL_PUBLICA,
    osmId: WAY_DA_PISTA,
    versaoOsm: via.version,
    editadoEm: via.timestamp,
    consultadoEm: corpo.consultadoEm ?? null,
  },
};
fs.writeFileSync(DESTINO, JSON.stringify(saida, null, 1) + "\n");
console.log(`Gravado ${path.relative(RAIZ, DESTINO)}: pista ${via.tags.ref}, ${comprimento} m${doCache ? " (cache)" : ""}.`);
