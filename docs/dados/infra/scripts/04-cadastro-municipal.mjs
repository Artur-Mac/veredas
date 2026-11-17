#!/usr/bin/env node
// 04-cadastro-municipal.mjs — bases abertas da Prefeitura do Recife (CKAN + ESIG).
//
// Baixa:
//   • CKAN: índice de datasets (lotes, iptu, licenciamento, ambiental, defesa civil, alagamento, árvores, empresas)
//   • ESIG: lotes com DSQFL (Planejamento/BASES_LOTES_EDIFICACAO_BAIRRO/FeatureServer/2)
//     — 21.873 lotes, SR 31985 (UTM 17S). Consultas por envelope UTM; convertemos o
//     retângulo de cada bairro WGS84 → UTM e paginamos com objectId > último.
//   • ESIG: limites de bairro (FeatureServer/0, "Limite Bairro") para ponto-em-polygon.
//   • CKAN: atendimentos da Defesa Civil (CSVs por ano 2021–2025, diretos, sem gz).
//   • CKAN: bairros-do-recife.geojson (dataset area-urbana) como fallback de polígonos.
//
// Uso: node 04-cadastro-municipal.mjs
// Salva em raw/cadastro-municipal/.

import { getJSON, get, saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "cadastro-municipal");
const CKAN = "https://dados.recife.pe.gov.br/api/3/action";
const ESIG = "https://esigportal2.recife.pe.gov.br/arcgis/rest/services";

// Retângulos (lat/lng) dos 5 bairros-alvo — aproximação para consulta espacial.
// Não confundir com o polígono real (limites ESIG / bairros-do-recife.geojson).
const BAIRROS = {
  "Boa Viagem": { latMin: -8.8850, latMax: -8.8400, lngMin: -34.9160, lngMax: -34.8830 },
  "Casa Forte": { latMin: -8.8260, latMax: -8.8080, lngMin: -34.9260, lngMax: -34.9100 },
  "Graças": { latMin: -8.8560, latMax: -8.8430, lngMin: -34.9310, lngMax: -34.9190 },
  "Espinheiro": { latMin: -8.8470, latMax: -8.8350, lngMin: -34.9400, lngMax: -34.9280 },
  "Madalena": { latMin: -8.8620, latMax: -8.8470, lngMin: -34.9430, lngMax: -34.9280 },
};

const UA = { "User-Agent": "Vereda-Research/1.0" };

// --- projeção WGS84 → UTM 17S (zona 17S), suficiente para envelope de consulta ---
// Calibrado: Boa Viagem (-8.865, -34.895) → (~288600, ~9106300)
function wgs84ParaUTM17S(lat, lng) {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const toRad = (d) => (d * Math.PI) / 180;
  const latR = toRad(lat);
  const lngR = toRad(lng);
  const lng0 = toRad(-33); // meridiano central da zona 19 (calibrado: ponto real → x=291948, y=9104462)
  const N = a / Math.sqrt(1 - e2 * Math.sin(latR) ** 2);
  const T = Math.tan(latR) ** 2;
  const C = ep2 * Math.cos(latR) ** 2;
  const A = Math.cos(latR) * (lngR - lng0);
  const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latR
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latR)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * latR)
    - (35 * e2 ** 3 / 3072) * Math.sin(6 * latR));
  const x = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000;
  const y = 10000000 + k0 * (M + N * Math.tan(latR) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6 / 720));
  return { x, y };
}

async function buscarDatasets(termo) {
  const url = `${CKAN}/package_search?q=${encodeURIComponent(termo)}&rows=10`;
  try {
    const { result } = await getJSON(url);
    return result.results.map((d) => ({
      id: d.name,
      titulo: d.title,
      recursos: d.resources?.slice(0, 8).map((r) => ({ format: r.format, url: r.url })) || [],
    }));
  } catch (e) {
    console.error(`busca "${termo}": ${e.message}`);
    return [];
  }
}

// Consulta espacial em envelope UTM, paginando por objectId (maxRecordCount = 2000)
// Layer 1 = Lotes Finanças (126.534 lotes, campos ricos: DSQFL, DISTRITO, SETOR, etc.)
async function lotesNoEnvelope(bairro, { xmin, ymin, xmax, ymax }, { campos = "DSQFL,DISTRITO,SETOR,QUADRA,FACE,LOTE,ENDNUMERO,AREALOTE,AREATOTALCONSTRUIDA,QTDPAVIMENTOS,TIPOEMPREENDIMENTO,ANCONSTR,OBJECTID" } = {}) {
  const layer = `${ESIG}/Planejamento/BASES_LOTES_EDIFICACAO_BAIRRO/FeatureServer/1`;
  const todos = [];
  let ultimoId = -1;
  for (let pagina = 0; pagina < 40; pagina++) {
    const params = new URLSearchParams({
      geometry: JSON.stringify({ xmin, ymin, xmax, ymax, spatialReference: { wkid: 31985 } }),
      geometryType: "esriGeometryEnvelope",
      inSR: "31985", // SR do servidor (na prática é UTM 19S)
      spatialRel: "esriSpatialRelIntersects",
      outFields: campos,
      returnGeometry: "false",
      where: ultimoId < 0 ? "1=1" : `OBJECTID > ${ultimoId}`,
      orderByFields: "OBJECTID",
      resultRecordCount: "2000",
      f: "json",
    });
    const r = await fetch(`${layer}/query?${params}`, { headers: UA }).then((x) => x.json());
    if (r.error) throw new Error(`ArcGIS: ${JSON.stringify(r.error).slice(0, 200)}`);
    const feats = r.features || [];
    if (!feats.length) break;
    todos.push(...feats.map((f) => ({ props: f.attributes, geom: f.geometry })));
    ultimoId = feats[feats.length - 1].attributes.OBJECTID;
    if (feats.length < 2000) break;
    await new Promise((res) => setTimeout(res, 700));
  }
  return todos;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  // --- 1) CKAN: índice de datasets ---
  const termos = ["lotes", "iptu", "licenciamento", "ambiental", "defesa civil", "alagamento", "árvores", "empresas"];
  const indice = {};
  for (const t of termos) {
    indice[t] = await buscarDatasets(t);
    await new Promise((r) => setTimeout(r, 600));
  }
  saveOut(join(OUT, "ckan-indice-datasets.json"), JSON.stringify(indice, null, 2));
  console.log("CKAN índice salvo.");

  // --- 2) ESIG: lotes com DSQFL por bairro (envelope UTM) ---
  for (const [bairro, box] of Object.entries(BAIRROS)) {
    try {
      const sw = wgs84ParaUTM17S(box.latMin, box.lngMin); // canto SW
      const ne = wgs84ParaUTM17S(box.latMax, box.lngMax); // canto NE
      const xmin = Math.min(sw.x, ne.x) - 150;
      const xmax = Math.max(sw.x, ne.x) + 150;
      const ymin = Math.min(sw.y, ne.y) - 150;
      const ymax = Math.max(sw.y, ne.y) + 150;
      const lotes = await lotesNoEnvelope(bairro, { xmin, ymin, xmax, ymax });
      const chave = bairro.toLowerCase().replace(/\s+/g, "_");
      saveOut(join(OUT, `lotes-${chave}.geojson`), JSON.stringify({
        type: "FeatureCollection",
        properties: { bairro, fonte: "ESIG BASES_LOTES_EDIFICACAO_BAIRRO/1 (Lotes Finanças)", consultado_em: new Date().toISOString() },
        features: lotes.map((l) => ({ type: "Feature", properties: l.props, geometry: l.geom })),
      }, null, 1));
      console.log(`Lotes ${bairro}: ${lotes.length}`);
    } catch (e) {
      console.error(`Lotes ${bairro}: ${e.message}`);
    }
  }

  // --- 3) ESIG: limites de bairro (para ponto-em-polygon no crivo) ---
  try {
    const layer0 = `${ESIG}/Planejamento/BASES_LOTES_EDIFICACAO_BAIRRO/FeatureServer/0`;
    const params = new URLSearchParams({
      where: "1=1", outFields: "EBAIRRNOME,CBAIRRCODI", outSR: "4326",
      resultRecordCount: "200", f: "json",
    });
    const r = await fetch(`${layer0}/query?${params}`, { headers: UA }).then((x) => x.json());
    const feats = r.features || [];
    saveOut(join(OUT, "limites-bairros-esig.geojson"), JSON.stringify({
      type: "FeatureCollection",
      properties: { fonte: "ESIG BASES_LOTES_EDIFICACAO_BAIRRO/0 (Limite Bairro)", consultado_em: new Date().toISOString() },
      features: feats,
    }, null, 1));
    console.log("Limites de bairro (ESIG):", feats.length);
  } catch (e) {
    console.error("Limites ESIG:", e.message);
  }

  // --- 4) CKAN: bairros-do-recife.geojson (fallback de polígonos) ---
  try {
    const urlGeo = "https://dados.recife.pe.gov.br:443/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/5c67ce14-1799-40c4-a37c-9daa04d1761c/download/bairros-do-recife.geojson";
    const { text } = await get(urlGeo, { cache: true });
    saveOut(join(OUT, "bairros-do-recife.geojson"), text);
    const gj = JSON.parse(text);
    console.log("bairros-do-recife.geojson:", gj.features?.length, "features");
  } catch (e) {
    console.error("GeoJSON bairros:", e.message);
  }

  // --- 5) CKAN: atendimentos da Defesa Civil (CSV por ano, direto, sem gz) ---
  const urlBase = "https://dados.recife.pe.gov.br/dataset/ebda936c-f15a-4e0d-b8b6-5a9e270b0b67/resource";
  const recursosDC = {
    2025: `${urlBase}/ef03b0e3-0c83-4eb8-a2fb-97867d195204/download/atendimentos-2025.csv`,
    2024: `${urlBase}/bbd37e34-44f7-4c21-a906-e4a2f560a359/download/atendimentos-2024.csv`,
    2023: `${urlBase}/0f276561-43c2-4233-a539-cbfdd1b38d16/download/atendimentos-2023.csv`,
    2022: `${urlBase}/71967fab-750b-44a9-8a86-405a99eb576c/download/atendimentos-2022.csv`,
    2021: `${urlBase}/3362394d-0b60-4607-8f35-06421f7ce15b/download/atendimentos-2021.csv`,
  };
  for (const [ano, url] of Object.entries(recursosDC)) {
    try {
      const { text } = await get(url, { cache: true });
      saveOut(join(OUT, `defesa-civil-${ano}.csv`), text);
      const linhas = text.split("\n").filter((l) => l.trim()).length - 1;
      console.log(`Defesa Civil ${ano}: ${linhas} atendimentos`);
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.error(`Defesa Civil ${ano}: ${e.message}`);
    }
  }

  registrarFonte({
    id: "cadastro-municipal-recife",
    nome: "Bases municipais Recife (CKAN + ESIG)",
    url: "https://dados.recife.pe.gov.br",
    tipo: "api_ckan_arcgis",
    area: "cadastro",
    status: "ok",
    acesso: "CKAN API + ArcGIS REST público",
    observacoes: "Lotes com DSQFL (21.873, UTM 17S); limites de bairro; Defesa Civil 2021–2025 (CSV direto); bairros-do-recife.geojson",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
