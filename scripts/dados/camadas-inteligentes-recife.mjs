// Gera `src/dados/recife/camadas-ambientais.json` unindo 5 camadas abertas oficiais sem parcerias comerciais:
// 1. Calor de superfície 100 m: USGS Landsat 8/9 Collection 2 Level-2 (`ST_B10` / `lwir11` + `qa_pixel` máscara de nuvem/sombra/água, Domínio Público USGS via STAC).
// 2. Árvores tombadas e Parques/Praças: Prefeitura do Recife (`arvores-tombadas-georreferenciadas.geojson` e `parques-e-pracas.geojson`, ODbL).
// 3. Relevo e Canais/Rios: Modelo Digital de Elevação Copernicus DEM GLO-90/30 (`Open-Meteo Elevation API`, CC-BY 4.0) + `recursos-hidricos.geojson` (ESIG Recife, ODbL).
// 4. Arboviroses por bairro (2023–2025): SINAN / Secretaria de Saúde do Recife (`casos-de-dengue-zika-e-chikungunya`, ODbL).
// 5. Corredores diurnos de tráfego pesado e trilhos: GTFS Grande Recife / CBTU Metrô (`gtfs-inspecao.zip`) + `trechos-de-logradouros.geojson` (ESIG Recife, ODbL).

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
// VE05: precisa de Node 22 (importa o roteador TypeScript por remoção de tipos).
import { corredoresDoDiaUtil, DIA_UTIL_DE_REFERENCIA, LIMIAR_PARTIDAS } from "./transito/corredores.mjs";
import { prepararGrade } from "../../src/dados/transito/roteador.ts";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dirCache = path.join(raiz, ".cache/dados-recife");
fs.mkdirSync(dirCache, { recursive: true });

function normalizarSlug(nome) {
  const s = String(nome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s === "poco-da-panela") return "poco";
  if (s === "bairro-do-recife" || s === "recife-antigo") return "recife";
  if (s === "cohab-ibura-de-cima") return "cohab";
  return s;
}

async function baixarParaCache(nomeArquivo, url) {
  const caminho = path.join(dirCache, nomeArquivo);
  if (!fs.existsSync(caminho)) {
    const r = await fetch(url, { headers: { "User-Agent": "VeredaRecifeDadosAbertos/1.0" } });
    if (!r.ok) throw new Error(`Erro HTTP ${r.status} em ${url}`);
    fs.writeFileSync(caminho, Buffer.from(await r.arrayBuffer()));
  }
  const buf = fs.readFileSync(caminho);
  return { caminho, buf, sha256: createHash("sha256").update(buf).digest("hex") };
}

function extrairAneis(geom) {
  if (!geom) return [];
  if (geom.type === "Polygon") return geom.coordinates;
  if (geom.type === "MultiPolygon") return geom.coordinates.flat(1);
  return [];
}

function pontoEmAnel(lon, lat, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const xi = anel[i][0], yi = anel[i][1];
    const xj = anel[j][0], yj = anel[j][1];
    const intersecta = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-15) + xi;
    if (intersecta) dentro = !dentro;
  }
  return dentro;
}

// Carrega bairros do Recife para teste rápido de ponto-no-município e agregação térmica por bairro
const geoBairros = JSON.parse(fs.readFileSync(path.join(dirCache, "bairros-do-recife.geojson"), "utf8"));
const poligonosBairros = geoBairros.features.map((f) => {
  const slug = normalizarSlug(f.properties?.EBAIRRNOMEOF || f.properties?.EBAIRRNOME);
  const aneis = extrairAneis(f.geometry);
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const anel of aneis) {
    for (const [x, y] of anel) {
      if (x < minLon) minLon = x;
      if (x > maxLon) maxLon = x;
      if (y < minLat) minLat = y;
      if (y > maxLat) maxLat = y;
    }
  }
  return { slug, bbox: [minLon, minLat, maxLon, maxLat], aneis };
});

function bairroDoPonto(lon, lat) {
  for (const b of poligonosBairros) {
    if (lon < b.bbox[0] || lon > b.bbox[2] || lat < b.bbox[1] || lat > b.bbox[3]) continue;
    if (b.aneis.length > 0 && pontoEmAnel(lon, lat, b.aneis[0])) return b.slug;
  }
  return null;
}

// ============================================================================
// 1. LANDSAT 8/9 COLLECTION 2 LEVEL-2 ST_B10 (`lwir11` + `qa_pixel` em 100 m)
// ============================================================================
function lonLatParaUtm25N(lon, lat) {
  const a = 6378137.0, f = 1 / 298.257223563, k0 = 0.9996, lon0 = (-33 * Math.PI) / 180;
  const e2 = 2 * f - f * f, ep2 = e2 / (1 - e2);
  const phi = (lat * Math.PI) / 180, lam = (lon * Math.PI) / 180;
  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const T = Math.tan(phi) ** 2, C = ep2 * Math.cos(phi) ** 2, A = Math.cos(phi) * (lam - lon0);
  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * phi -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi));
  const x =
    500000 +
    k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5) / 120);
  const y =
    k0 *
    (M +
      N *
        Math.tan(phi) *
        (A ** 2 / 2 + ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 + ((61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6) / 720));
  return [x, y];
}

async function lerJanelaCogUint16(hrefAssinado, transform, minPx, maxPx, minPy, maxPy) {
  const hdr = Buffer.from(
    await (await fetch(hrefAssinado, { headers: { Range: "bytes=0-65535" } })).arrayBuffer(),
  );
  const ifd = hdr.readUInt32LE(4);
  const n = hdr.readUInt16LE(ifd);
  const tags = {};
  for (let i = 0; i < n; i++) {
    const o = ifd + 2 + i * 12;
    tags[hdr.readUInt16LE(o)] = {
      type: hdr.readUInt16LE(o + 2),
      count: hdr.readUInt32LE(o + 4),
      valOff: hdr.readUInt32LE(o + 8),
    };
  }
  const width = tags[256].valOff;
  const height = tags[257].valOff;
  const predictor = tags[317]?.valOff ?? 1;
  const tileW = tags[322].valOff;
  const tileH = tags[323].valOff;
  const tilesAcross = Math.ceil(width / tileW);

  const lerVetorU32 = async (tag) => {
    const bytes = tag.count * (tag.type === 4 ? 4 : 8);
    let buf = hdr;
    let base = tag.valOff;
    if (tag.valOff + bytes > hdr.length) {
      buf = Buffer.from(
        await (
          await fetch(hrefAssinado, { headers: { Range: `bytes=${tag.valOff}-${tag.valOff + bytes - 1}` } })
        ).arrayBuffer(),
      );
      base = 0;
    }
    const res = new Array(tag.count);
    for (let i = 0; i < tag.count; i++) {
      res[i] = tag.type === 4 ? buf.readUInt32LE(base + i * 4) : Number(buf.readBigUInt64LE(base + i * 8));
    }
    return res;
  };

  const offsets = await lerVetorU32(tags[324]);
  const counts = await lerVetorU32(tags[325]);

  const tx0 = Math.max(0, Math.floor(minPx / tileW));
  const tx1 = Math.min(tilesAcross - 1, Math.floor(maxPx / tileW));
  const ty0 = Math.max(0, Math.floor(minPy / tileH));
  const ty1 = Math.min(Math.ceil(height / tileH) - 1, Math.floor(maxPy / tileH));

  const tilesMap = new Map();
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const idx = ty * tilesAcross + tx;
      const off = offsets[idx];
      const len = counts[idx];
      if (!len) continue;
      const comp = Buffer.from(
        await (await fetch(hrefAssinado, { headers: { Range: `bytes=${off}-${off + len - 1}` } })).arrayBuffer(),
      );
      const raw = zlib.inflateSync(comp);
      const arr = new Uint16Array(tileW * tileH);
      for (let i = 0; i < arr.length; i++) arr[i] = raw.readUInt16LE(i * 2);
      if (predictor === 2) {
        for (let r = 0; r < tileH; r++) {
          for (let c = 1; c < tileW; c++) {
            arr[r * tileW + c] = (arr[r * tileW + c] + arr[r * tileW + c - 1]) & 0xffff;
          }
        }
      }
      tilesMap.set(`${tx}:${ty}`, arr);
    }
  }

  return {
    ler(px, py) {
      if (px < 0 || py < 0 || px >= width || py >= height) return 0;
      const tx = Math.floor(px / tileW);
      const ty = Math.floor(py / tileH);
      const t = tilesMap.get(`${tx}:${ty}`);
      if (!t) return 0;
      return t[(py % tileH) * tileW + (px % tileW)];
    },
    transform,
  };
}

const GRADE_TERMICA = {
  lon0: -35.02,
  lat0: -8.16,
  passo: 0.0009, // ~100 m
  cols: 178,
  lins: 256,
};

const cacheLandsat = path.join(dirCache, "landsat-st-recife-100m.json");
let landsatDados;
if (fs.existsSync(cacheLandsat)) {
  landsatDados = JSON.parse(fs.readFileSync(cacheLandsat, "utf8"));
} else {
  const buscaStac = await fetch("https://planetarycomputer.microsoft.com/api/stac/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collections: ["landsat-c2-l2"],
      bbox: [-34.98, -8.15, -34.87, -7.95],
      datetime: "2023-01-01T00:00:00Z/2026-10-27T23:59:59Z",
      query: { "eo:cloud_cover": { lt: 18 }, "landsat:wrs_row": { eq: "066" } },
      limit: 6,
    }),
  }).then((r) => r.json());

  const cenas = (buscaStac.features ?? [])
    .filter((f) => f.assets?.lwir11?.href && f.assets?.qa_pixel?.href)
    .sort((a, b) => (a.properties?.["eo:cloud_cover"] ?? 99) - (b.properties?.["eo:cloud_cover"] ?? 99))
    .slice(0, 4);
  if (cenas.length === 0) throw new Error("Nenhuma cena Landsat 8/9 encontrada sobre o Recife.");

  const acumulador = Array.from({ length: GRADE_TERMICA.cols * GRADE_TERMICA.lins }, () => []);
  const idsCenas = [];

  const [uxMin, uyMin] = lonLatParaUtm25N(GRADE_TERMICA.lon0, GRADE_TERMICA.lat0);
  const [uxMax, uyMax] = lonLatParaUtm25N(
    GRADE_TERMICA.lon0 + GRADE_TERMICA.cols * GRADE_TERMICA.passo,
    GRADE_TERMICA.lat0 + GRADE_TERMICA.lins * GRADE_TERMICA.passo,
  );

  for (const cena of cenas) {
    const tr = cena.properties["proj:transform"];
    const assinar = async (href) =>
      (await fetch("https://planetarycomputer.microsoft.com/api/sas/v1/sign?href=" + encodeURIComponent(href)).then((r) => r.json())).href;
    const hrefSt = await assinar(cena.assets.lwir11.href);
    const hrefQa = await assinar(cena.assets.qa_pixel.href);

    const px0 = Math.floor((Math.min(uxMin, uxMax) - tr[2]) / tr[0]) - 2;
    const px1 = Math.ceil((Math.max(uxMin, uxMax) - tr[2]) / tr[0]) + 2;
    const py0 = Math.floor((Math.max(uyMin, uyMax) - tr[5]) / tr[4]) - 2;
    const py1 = Math.ceil((Math.min(uyMin, uyMax) - tr[5]) / tr[4]) + 2;

    const leitorSt = await lerJanelaCogUint16(hrefSt, tr, px0, px1, py0, py1);
    const leitorQa = await lerJanelaCogUint16(hrefQa, tr, px0, px1, py0, py1);
    idsCenas.push({
      id: cena.id,
      data: String(cena.properties.datetime).slice(0, 10),
      nuvensPct: cena.properties["eo:cloud_cover"],
    });

    for (let r = 0; r < GRADE_TERMICA.lins; r++) {
      const lat = GRADE_TERMICA.lat0 + (r + 0.5) * GRADE_TERMICA.passo;
      for (let c = 0; c < GRADE_TERMICA.cols; c++) {
        const lon = GRADE_TERMICA.lon0 + (c + 0.5) * GRADE_TERMICA.passo;
        const [ux, uy] = lonLatParaUtm25N(lon, lat);
        const px = Math.round((ux - tr[2]) / tr[0]);
        const py = Math.round((uy - tr[5]) / tr[4]);
        const dn = leitorSt.ler(px, py);
        const qa = leitorQa.ler(px, py);
        if (dn === 0 || qa === 0) continue;
        // QA_PIXEL Collection 2: bit 0 fill, bit 1 dilated cloud, bit 3 cloud, bit 4 cloud shadow
        if ((qa & ((1 << 0) | (1 << 1) | (1 << 3) | (1 << 4))) !== 0) continue;
        const tempC = dn * 0.00341802 + 149.0 - 273.15;
        if (tempC >= 18 && tempC <= 52) {
          acumulador[r * GRADE_TERMICA.cols + c].push(tempC);
        }
      }
    }
  }

  // Mediana em décimos de °C (ex.: 324 = 32,4 °C; 0 = sem leitura terrestre sem nuvem)
  const celulasDecimosC = new Array(GRADE_TERMICA.cols * GRADE_TERMICA.lins).fill(0);
  for (let i = 0; i < acumulador.length; i++) {
    const vals = acumulador[i].sort((a, b) => a - b);
    if (vals.length === 0) continue;
    const meio = Math.floor(vals.length / 2);
    const med = vals.length % 2 === 1 ? vals[meio] : (vals[meio - 1] + vals[meio]) / 2;
    celulasDecimosC[i] = Math.round(med * 10);
  }

  landsatDados = {
    consultadoEm: "2026-10-27",
    cenas: idsCenas,
    grade: { ...GRADE_TERMICA, decimosC: celulasDecimosC },
  };
  fs.writeFileSync(cacheLandsat, JSON.stringify(landsatDados) + "\n");
}

// Calcula a mediana térmica de superfície por bairro para comparação imediata ("+X,X °C vs mediana do bairro")
const tempsPorBairro = new Map();
for (let r = 0; r < GRADE_TERMICA.lins; r++) {
  const lat = GRADE_TERMICA.lat0 + (r + 0.5) * GRADE_TERMICA.passo;
  for (let c = 0; c < GRADE_TERMICA.cols; c++) {
    const dec = landsatDados.grade.decimosC[r * GRADE_TERMICA.cols + c];
    if (!dec) continue;
    const lon = GRADE_TERMICA.lon0 + (c + 0.5) * GRADE_TERMICA.passo;
    const slug = bairroDoPonto(lon, lat);
    if (!slug) continue;
    const arr = tempsPorBairro.get(slug) ?? [];
    arr.push(dec);
    tempsPorBairro.set(slug, arr);
  }
}
const medianaTermicaBairrosDecimosC = {};
for (const [slug, arr] of [...tempsPorBairro.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  arr.sort((a, b) => a - b);
  const m = Math.floor(arr.length / 2);
  medianaTermicaBairrosDecimosC[slug] = arr.length % 2 === 1 ? arr[m] : Math.round((arr[m - 1] + arr[m]) / 2);
}

// Compacta `decimosC` em Base64 de Int16Array para ocupar apenas ~60 KB no JSON!
const bufTermico = Buffer.alloc(landsatDados.grade.decimosC.length * 2);
for (let i = 0; i < landsatDados.grade.decimosC.length; i++) {
  bufTermico.writeInt16LE(landsatDados.grade.decimosC[i], i * 2);
}
const gradeTermicaBase64 = bufTermico.toString("base64");

// ============================================================================
// 2. ÁRVORES TOMBADAS E PARQUES / PRAÇAS (CKAN RECIFE ODbL)
// ============================================================================
const URL_ARVORES =
  "https://dados.recife.pe.gov.br/dataset/42bbfbf1-57ad-4121-9087-ac52d0511a3a/resource/1104dfc8-5afb-467c-9135-f83257249c15/download/arvores-tombadas-georreferenciadas.geojson";
const URL_PRACAS =
  "https://dados.recife.pe.gov.br/dataset/b3a3a033-3611-485c-8d18-d02c5a42563d/resource/054f05a9-a113-47e0-a46f-720e4828eaf2/download/parques-e-pracas.geojson";

const arqArvores = await baixarParaCache("arvores-tombadas.geojson", URL_ARVORES);
const arqPracas = await baixarParaCache("parques-e-pracas.geojson", URL_PRACAS);

const geoArvores = JSON.parse(arqArvores.buf.toString("utf8"));
const arvoresTombadas = [];
for (const f of geoArvores.features ?? []) {
  const coords = f.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) continue;
  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
  arvoresTombadas.push([
    Number(lon.toFixed(5)),
    Number(lat.toFixed(5)),
    String(f.properties?.nmpopul ?? "Árvore tombada").trim().slice(0, 40),
  ]);
}

const geoPracas = JSON.parse(arqPracas.buf.toString("utf8"));
const pracasEParques = [];
for (const f of geoPracas.features ?? []) {
  const aneis = extrairAneis(f.geometry);
  let lon = null, lat = null;
  if (f.geometry?.type === "Point") {
    [lon, lat] = f.geometry.coordinates;
  } else if (aneis.length > 0 && aneis[0].length > 0) {
    let sx = 0, sy = 0;
    for (const pt of aneis[0]) { sx += pt[0]; sy += pt[1]; }
    lon = sx / aneis[0].length;
    lat = sy / aneis[0].length;
  }
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
  const nome = String(
    f.properties?.nm_praca || f.properties?.NM_PRACA || f.properties?.nome || f.properties?.NOME || f.properties?.equipamento || "Praça ou parque",
  ).trim().slice(0, 50);
  pracasEParques.push([Number(lon.toFixed(5)), Number(lat.toFixed(5)), nome]);
}

// ============================================================================
// 3. ELEVAÇÃO COPERNICUS DEM GLO-30 (30 m nativo via COG) + CANAIS E RIOS (ODbL)
// ============================================================================
async function lerJanelaCogFloat32(hrefAssinado, transform, minPx, maxPx, minPy, maxPy) {
  const hdr = Buffer.from(
    await (await fetch(hrefAssinado, { headers: { Range: "bytes=0-16383" } })).arrayBuffer(),
  );
  const ifd = hdr.readUInt32LE(4);
  const n = hdr.readUInt16LE(ifd);
  const tags = {};
  for (let i = 0; i < n; i++) {
    const o = ifd + 2 + i * 12;
    tags[hdr.readUInt16LE(o)] = {
      type: hdr.readUInt16LE(o + 2),
      count: hdr.readUInt32LE(o + 4),
      valOff: hdr.readUInt32LE(o + 8),
    };
  }
  const width = tags[256].valOff;
  const height = tags[257].valOff;
  const predictor = tags[317]?.valOff ?? 1;
  const tileW = tags[322].valOff;
  const tileH = tags[323].valOff;
  const tilesAcross = Math.ceil(width / tileW);

  const lerVetorU32 = async (tag) => {
    const bytes = tag.count * (tag.type === 4 ? 4 : 8);
    let buf = hdr;
    let base = tag.valOff;
    if (tag.valOff + bytes > hdr.length) {
      buf = Buffer.from(
        await (
          await fetch(hrefAssinado, { headers: { Range: `bytes=${tag.valOff}-${tag.valOff + bytes - 1}` } })
        ).arrayBuffer(),
      );
      base = 0;
    }
    const res = new Array(tag.count);
    for (let i = 0; i < tag.count; i++) {
      res[i] = tag.type === 4 ? buf.readUInt32LE(base + i * 4) : Number(buf.readBigUInt64LE(base + i * 8));
    }
    return res;
  };

  const offsets = await lerVetorU32(tags[324]);
  const counts = await lerVetorU32(tags[325]);

  const tx0 = Math.max(0, Math.floor(minPx / tileW));
  const tx1 = Math.min(tilesAcross - 1, Math.floor(maxPx / tileW));
  const ty0 = Math.max(0, Math.floor(minPy / tileH));
  const ty1 = Math.min(Math.ceil(height / tileH) - 1, Math.floor(maxPy / tileH));

  const tilesMap = new Map();
  const tmp4 = Buffer.alloc(4);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const idx = ty * tilesAcross + tx;
      const off = offsets[idx];
      const len = counts[idx];
      if (!len) continue;
      const comp = Buffer.from(
        await (await fetch(hrefAssinado, { headers: { Range: `bytes=${off}-${off + len - 1}` } })).arrayBuffer(),
      );
      const raw = zlib.inflateSync(comp);
      const arr = new Float32Array(tileW * tileH);
      if (predictor === 3) {
        // TIFF Technical Note 3: Floating-Point Horizontal Differencing (1 banda Float32)
        for (let y = 0; y < tileH; y++) {
          const base = y * tileW * 4;
          for (let j = 1; j < tileW * 4; j++) {
            raw[base + j] = (raw[base + j] + raw[base + j - 1]) & 0xff;
          }
          for (let x = 0; x < tileW; x++) {
            tmp4[0] = raw[base + x];
            tmp4[1] = raw[base + tileW + x];
            tmp4[2] = raw[base + 2 * tileW + x];
            tmp4[3] = raw[base + 3 * tileW + x];
            arr[y * tileW + x] = tmp4.readFloatBE(0);
          }
        }
      } else {
        for (let i = 0; i < arr.length; i++) arr[i] = raw.readFloatLE(i * 4);
      }
      tilesMap.set(`${tx}:${ty}`, arr);
    }
  }

  return {
    width,
    height,
    transform,
    lerLonLat(lon, lat) {
      const px = Math.round((lon - transform[2]) / transform[0]);
      const py = Math.round((lat - transform[5]) / transform[4]);
      if (px < 0 || py < 0 || px >= width || py >= height) return null;
      const tx = Math.floor(px / tileW);
      const ty = Math.floor(py / tileH);
      const t = tilesMap.get(`${tx}:${ty}`);
      if (!t) return null;
      const v = t[(py % tileH) * tileW + (px % tileW)];
      return Number.isFinite(v) ? v : null;
    },
  };
}

const GRADE_RELEVO = {
  lon0: -35.02,
  lat0: -8.16,
  passo: 0.0014, // ~155 m (amostrado de Copernicus DEM GLO-30 nativo de 30 m)
  cols: 115,
  lins: 165,
};

const cacheDem = path.join(dirCache, "copernicus-dem-glo30-recife.json");
let demDados;
if (fs.existsSync(cacheDem)) {
  demDados = JSON.parse(fs.readFileSync(cacheDem, "utf8"));
} else {
  const lonMax = GRADE_RELEVO.lon0 + GRADE_RELEVO.cols * GRADE_RELEVO.passo;
  const latMax = GRADE_RELEVO.lat0 + GRADE_RELEVO.lins * GRADE_RELEVO.passo;
  const stacDem = await fetch("https://planetarycomputer.microsoft.com/api/stac/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collections: ["cop-dem-glo-30"],
      bbox: [GRADE_RELEVO.lon0, GRADE_RELEVO.lat0, lonMax, latMax],
      limit: 8,
    }),
  }).then((r) => r.json());

  const leitoresDem = [];
  for (const item of stacDem.features ?? []) {
    if (!item.assets?.data?.href) continue;
    const tr = item.properties["proj:transform"];
    const hrefAssinado = (
      await fetch("https://planetarycomputer.microsoft.com/api/sas/v1/sign?href=" + encodeURIComponent(item.assets.data.href)).then((r) =>
        r.json(),
      )
    ).href;
    const px0 = Math.max(0, Math.floor((GRADE_RELEVO.lon0 - tr[2]) / tr[0]) - 2);
    const px1 = Math.min(3599, Math.ceil((lonMax - tr[2]) / tr[0]) + 2);
    const py0 = Math.max(0, Math.floor((latMax - tr[5]) / tr[4]) - 2);
    const py1 = Math.min(3599, Math.ceil((GRADE_RELEVO.lat0 - tr[5]) / tr[4]) + 2);
    if (px1 < 0 || py1 < 0 || px0 >= 3600 || py0 >= 3600 || px0 > px1 || py0 > py1) continue;
    leitoresDem.push({ id: item.id, leitor: await lerJanelaCogFloat32(hrefAssinado, tr, px0, px1, py0, py1) });
  }
  if (leitoresDem.length === 0) throw new Error("Nenhum tile Copernicus DEM GLO-30 encontrado sobre o Recife.");

  const decimetros = new Array(GRADE_RELEVO.cols * GRADE_RELEVO.lins).fill(-9999);
  for (let r = 0; r < GRADE_RELEVO.lins; r++) {
    const lat = GRADE_RELEVO.lat0 + (r + 0.5) * GRADE_RELEVO.passo;
    for (let c = 0; c < GRADE_RELEVO.cols; c++) {
      const lon = GRADE_RELEVO.lon0 + (c + 0.5) * GRADE_RELEVO.passo;
      let elev = null;
      for (const { leitor } of leitoresDem) {
        const v = leitor.lerLonLat(lon, lat);
        if (v !== null) {
          elev = v;
          break;
        }
      }
      if (elev === null) continue;
      // Preserva células em terra firme (dentro de bairro do Recife ou elevação > 0,2 m) e ignora mar aberto (0,0 m fora dos bairros)
      if (bairroDoPonto(lon, lat) || elev > 0.2) {
        decimetros[r * GRADE_RELEVO.cols + c] = Math.round(elev * 10);
      }
    }
  }
  demDados = {
    consultadoEm: "2026-10-27",
    tiles: leitoresDem.map((t) => t.id),
    grade: GRADE_RELEVO,
    decimetros,
  };
  fs.writeFileSync(cacheDem, JSON.stringify(demDados) + "\n");
}

const bufDem = Buffer.alloc(demDados.decimetros.length * 2);
for (let i = 0; i < demDados.decimetros.length; i++) {
  bufDem.writeInt16LE(Math.max(-32000, Math.min(32000, demDados.decimetros[i])), i * 2);
}
const gradeRelevoBase64 = bufDem.toString("base64");

// Canais, rios e alagados em recursos-hidricos.geojson (exceto Oceano Atlântico)
const geoHidricos = JSON.parse(fs.readFileSync(path.join(dirCache, "recursos-hidricos.geojson"), "utf8"));
const nomesHidricos = [];
const indiceNomeHidrico = new Map();
const pontosCanaisRios = [];
const vistosHidro = new Set();

for (const f of geoHidricos.features ?? []) {
  const brutoNome = String(f.properties?.NMRECHIDRIC ?? "").trim();
  const nome = brutoNome || "Canal ou curso d'água";
  if (nome.toUpperCase() === "OCEANO ATLÂNTICO" || nome.toUpperCase() === "BACIA PORTUÁRIA") continue;
  let idNome = indiceNomeHidrico.get(nome);
  if (idNome === undefined) {
    idNome = nomesHidricos.length;
    nomesHidricos.push(nome);
    indiceNomeHidrico.set(nome, idNome);
  }
  for (const anel of extrairAneis(f.geometry)) {
    let ult = null;
    for (const [x, y] of anel) {
      if (x < -35.03 || x > -34.86 || y < -8.16 || y > -7.93) continue;
      if (ult && Math.hypot((x - ult[0]) * 110200, (y - ult[1]) * 110570) < 75) continue;
      ult = [x, y];
      const chave = `${Math.round(x * 1350)}:${Math.round(y * 1350)}`;
      if (vistosHidro.has(chave)) continue;
      vistosHidro.add(chave);
      pontosCanaisRios.push([Number(x.toFixed(5)), Number(y.toFixed(5)), idNome]);
    }
  }
}

// ============================================================================
// 4. ARBOVIROSES POR BAIRRO (SINAN / SMS RECIFE 2023–2025, ODbL)
// ============================================================================
const RECURSOS_ARBOVIROSES = [
  ["tab-bairros-sinan.csv", "https://dados.recife.pe.gov.br/dataset/3c990c15-29ad-46e5-8fd2-1b83289bb9f5/resource/0af97ed3-5b04-454b-810f-8e64344d2374/download/tabela-de-bairros.csv"],
  ["dengue-2023.csv", "https://dados.recife.pe.gov.br/dataset/3c990c15-29ad-46e5-8fd2-1b83289bb9f5/resource/18ffe3a6-9f3c-4259-8c85-f3dae9c8d8ae/download/engon-20.csv"],
  ["dengue-2024.csv", "https://dados.recife.pe.gov.br/dataset/3c990c15-29ad-46e5-8fd2-1b83289bb9f5/resource/7755fe11-48f0-4797-ac5a-78d6da0fc8d9/download/casos-de-dengue-2024.csv"],
  ["dengue-2025.csv", "https://dados.recife.pe.gov.br/dataset/3c990c15-29ad-46e5-8fd2-1b83289bb9f5/resource/45a675e2-d387-4019-bb6e-4b915b74b1bf/download/casos-de-dengue-2025.csv"],
  ["chik-2023.csv", "https://dados.recife.pe.gov.br/dataset/3c990c15-29ad-46e5-8fd2-1b83289bb9f5/resource/79f9e050-3932-4512-9c9a-ef1e06381c38/download/casos-confirmados-de-chikungunya-em-2023.csv"],
  ["chik-2024.csv", "https://dados.recife.pe.gov.br/dataset/3c990c15-29ad-46e5-8fd2-1b83289bb9f5/resource/b0490f6f-f51a-4471-bc9e-a82c59b8e59e/download/chikon-2024.csv"],
  ["chik-2025.csv", "https://dados.recife.pe.gov.br/dataset/3c990c15-29ad-46e5-8fd2-1b83289bb9f5/resource/b300a634-1ab7-49fc-8592-4b45227822a8/download/casos-confirmados-de-chikungunya-em-2025.csv"],
];

for (const [arq, url] of RECURSOS_ARBOVIROSES) {
  await baixarParaCache(arq, url);
}

const arbovirosesJson = JSON.parse(
  execFileSync(
    "python3",
    [
      "-c",
      `
import csv, json, os, unicodedata, re, sys

cache = sys.argv[1]
def slug(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode("ascii").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    if s == "poco-da-panela": return "poco"
    if s in ("bairro-do-recife", "recife-antigo"): return "recife"
    if s == "cohab-ibura-de-cima": return "cohab"
    return s

mapa_id = {}
with open(os.path.join(cache, "tab-bairros-sinan.csv"), encoding="utf-8-sig", errors="replace") as f:
    for row in csv.reader(f, delimiter=";"):
        if len(row) >= 3 and "RECIFE" in row[2].upper():
            mapa_id[row[0].strip()] = slug(row[1])

# Tupla por bairro: [casos2023, casos2024, casos2025, notificacoesTotais3Anos]
por_bairro = {}
arqs = [
    ("2023", "dengue-2023.csv"), ("2024", "dengue-2024.csv"), ("2025", "dengue-2025.csv"),
    ("2023", "chik-2023.csv"), ("2024", "chik-2024.csv"), ("2025", "chik-2025.csv"),
]
total_lidos = 0
for ano, nome_arq in arqs:
    caminho = os.path.join(cache, nome_arq)
    with open(caminho, encoding="utf-8-sig", errors="replace") as f:
        amostra = f.read(2048)
        f.seek(0)
        delim = ";" if amostra.count(";") >= amostra.count(",") else ","
        leitor = csv.DictReader(f, delimiter=delim)
        for r in leitor:
            total_lidos += 1
            mun = (r.get("ID_MN_RESI") or r.get("id_mn_resi") or "").strip()
            if mun and not mun.startswith("261160"):
                continue
            nm = (r.get("NM_BAIRRO") or r.get("nm_bairro") or "").strip()
            id_b = (r.get("ID_BAIRRO") or r.get("id_bairro") or "").strip()
            b = slug(nm) if nm else mapa_id.get(id_b, "")
            if not b:
                continue
            classi = (r.get("CLASSI_FIN") or r.get("classi_fin") or "").strip()
            rec = por_bairro.setdefault(b, [0, 0, 0, 0])
            rec[3] += 1
            # CLASSI_FIN == "5" no SINAN significa caso descartado laboratorialmente
            if classi != "5":
                idx = 0 if ano == "2023" else (1 if ano == "2024" else 2)
                rec[idx] += 1

print(json.dumps({"totalLidos": total_lidos, "porBairro": por_bairro}))
`,
      dirCache,
    ],
    { maxBuffer: 32 * 1024 * 1024 },
  ).toString("utf8"),
);

// ============================================================================
// 5. CORREDORES DIURNOS (GTFS ÔNIBUS ALTA FREQUÊNCIA + METRÔ/VLT CBTU)
// ============================================================================
const VERSAO_DO_TRANSITO_GERADA = /VERSAO_DO_TRANSITO = "([^"]+)"/.exec(fs.readFileSync(path.join(raiz, "src/dados/recife/transitoGerado.ts"), "utf8"))[1];
void DIA_UTIL_DE_REFERENCIA;
const mobilidadeRuidoJson = JSON.parse(
  execFileSync(
    "python3",
    [
      "-c",
      `
import zipfile, csv, io, json, sys, math

zip_path = sys.argv[1]
with zipfile.ZipFile(zip_path) as z:
    routes = {r["route_id"]: r for r in csv.DictReader(io.TextIOWrapper(z.open("routes.txt"), "utf-8"))}
    rail_route_ids = {rid for rid, r in routes.items() if r.get("agency_id") == "metrorec" or r.get("route_type") in ("1", "2")}

    trips = {}
    rail_shape_ids = set()
    for t in csv.DictReader(io.TextIOWrapper(z.open("trips.txt"), "utf-8")):
        trips[t["trip_id"]] = t["route_id"]
        if t["route_id"] in rail_route_ids and t.get("shape_id"):
            rail_shape_ids.add(t["shape_id"])

    stop_counts = {}
    rail_stop_ids = set()
    for st in csv.DictReader(io.TextIOWrapper(z.open("stop_times.txt"), "utf-8")):
        sid = st["stop_id"]
        rid = trips.get(st["trip_id"])
        stop_counts[sid] = stop_counts.get(sid, 0) + 1
        if rid in rail_route_ids:
            rail_stop_ids.add(sid)

    corredores_onibus = []
    estacoes_metro = []
    for s in csv.DictReader(io.TextIOWrapper(z.open("stops.txt"), "utf-8")):
        try:
            lon = float(s["stop_lon"])
            lat = float(s["stop_lat"])
        except Exception:
            continue
        if not (-35.03 <= lon <= -34.86 and -8.165 <= lat <= -7.93):
            continue
        sid = s["stop_id"]
        cnt = stop_counts.get(sid, 0)
        if sid in rail_stop_ids:
            estacoes_metro.append([round(lon, 5), round(lat, 5), s["stop_name"].split(" - ")[0][:36]])
        elif cnt >= 180:
            # Parada com alto volume de partidas no GTFS -> corredor arterial/coletor de ônibus
            corredores_onibus.append([round(lon, 5), round(lat, 5), cnt])

    # Amostra pontos dos trilhos do Metrô/VLT a cada ~90 m
    trilhos = []
    vistos = set()
    if "shapes.txt" in z.namelist() and rail_shape_ids:
        for sh in csv.DictReader(io.TextIOWrapper(z.open("shapes.txt"), "utf-8")):
            if sh["shape_id"] not in rail_shape_ids:
                continue
            lon = float(sh["shape_pt_lon"])
            lat = float(sh["shape_pt_lat"])
            if not (-35.03 <= lon <= -34.86 and -8.165 <= lat <= -7.93):
                continue
            chave = (round(lon * 1250), round(lat * 1250))
            if chave in vistos:
                continue
            vistos.add(chave)
            trilhos.append([round(lon, 5), round(lat, 5)])

# Deduplica paradas de ônibus muito coladas (<75 m) mantendo o maior volume
corredores_dedup = []
celulas_onibus = {}
for lon, lat, cnt in sorted(corredores_onibus, key=lambda x: -x[2]):
    k = (round(lon * 1350), round(lat * 1350))
    if k in celulas_onibus:
        continue
    celulas_onibus[k] = True
    corredores_dedup.append([lon, lat, cnt])

estacoes_dedup = []
nomes_vistos = set()
for lon, lat, nome in estacoes_metro:
    if nome in nomes_vistos:
        continue
    nomes_vistos.add(nome)
    estacoes_dedup.append([lon, lat, nome])

print(json.dumps({
    "corredoresOnibus": sorted(corredores_dedup),
    "estacoesMetro": sorted(estacoes_dedup),
    "trilhosMetro": sorted(trilhos),
}))
`,
      // VE05 (I08): um feed só, o fixado; o arquivo de inspeção antigo (v2026.10.16) deixa de ser usado.
      path.join(raiz, "docs/dados/raw/transporte/gtfs.zip"),
    ],
    { maxBuffer: 32 * 1024 * 1024 },
  ).toString("utf8"),
);

const arbovirosesOrdenadas = {};
for (const k of Object.keys(arbovirosesJson.porBairro).sort()) {
  arbovirosesOrdenadas[k] = arbovirosesJson.porBairro[k];
}

const saida = {
  versao: 1,
  municipio: "2611606",
  consultadoEm: "2026-10-27",
  calorSuperficie: {
    fonte: "USGS Landsat 8/9 Collection 2 Level-2 Surface Temperature (ST_B10, 100 m)",
    licenca: "Domínio Público (USGS)",
    url: "https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2",
    cenasUsadas: landsatDados.cenas,
    lon0: GRADE_TERMICA.lon0,
    lat0: GRADE_TERMICA.lat0,
    passo: GRADE_TERMICA.passo,
    cols: GRADE_TERMICA.cols,
    lins: GRADE_TERMICA.lins,
    decimosCBase64: gradeTermicaBase64,
    medianaBairrosDecimosC: medianaTermicaBairrosDecimosC,
  },
  areasVerdes: {
    fonteArvores: "Prefeitura do Recife — Árvores Tombadas Georreferenciadas (dados.recife.pe.gov.br)",
    fontePracas: "Prefeitura do Recife — Parques e Praças (dados.recife.pe.gov.br)",
    licenca: "ODbL 1.0",
    sha256Arvores: arqArvores.sha256,
    sha256Pracas: arqPracas.sha256,
    arvoresTombadas,
    pracasEParques,
  },
  relevoEDrenagem: {
    fonteRelevo: "Copernicus DEM GLO-30 (30 m nativo via COG, ESA / Planetary Computer)",
    licencaRelevo: "CC-BY 4.0 (Copernicus / ESA)",
    fonteHidrografia: "Prefeitura do Recife — ESIG Recursos Hídricos (dados.recife.pe.gov.br)",
    licencaHidrografia: "ODbL 1.0",
    lon0: GRADE_RELEVO.lon0,
    lat0: GRADE_RELEVO.lat0,
    passo: GRADE_RELEVO.passo,
    cols: GRADE_RELEVO.cols,
    lins: GRADE_RELEVO.lins,
    decimetrosBase64: gradeRelevoBase64,
    nomesHidricos,
    pontosCanaisRios,
  },
  arboviroses: {
    fonte: "Secretaria de Saúde do Recife / SINAN — Casos de Dengue e Chikungunya (2023 a 2025)",
    url: "https://dados.recife.pe.gov.br/dataset/casos-de-dengue-zika-e-chikungunya",
    licenca: "ODbL 1.0",
    anos: [2023, 2024, 2025],
    registrosLidos: arbovirosesJson.totalLidos,
    porBairro: arbovirosesOrdenadas,
  },
  ruidoCorredores: {
    fonte: `Grande Recife Consórcio de Transporte / CBTU Metrô do Recife (GTFS oficial v2026.10.26; corredores = paradas com ≥ ${LIMIAR_PARTIDAS} partidas programadas num dia útil típico)`,
    licenca: "Dados públicos de transporte metropolitano",
    // VE05 (I01): partidas programadas num dia útil típico, resolvidas pelo calendário, não a soma de stop_times.
    corredoresOnibus: corredoresDoDiaUtil(prepararGrade(JSON.parse(fs.readFileSync(path.join(raiz, "src/dados/recife/transito", VERSAO_DO_TRANSITO_GERADA, "grade.json"), "utf8")))),
    estacoesMetro: mobilidadeRuidoJson.estacoesMetro,
    trilhosMetro: mobilidadeRuidoJson.trilhosMetro,
  },
};

const destino = path.join(raiz, "src/dados/recife/camadas-ambientais.json");
fs.writeFileSync(destino + ".tmp", JSON.stringify(saida) + "\n");
fs.renameSync(destino + ".tmp", destino);
console.log(
  JSON.stringify({
    cenasLandsat: saida.calorSuperficie.cenasUsadas.length,
    bairrosTermicos: Object.keys(medianaTermicaBairrosDecimosC).length,
    arvoresTombadas: arvoresTombadas.length,
    pracas: pracasEParques.length,
    pontosCanais: pontosCanaisRios.length,
    bairrosArboviroses: Object.keys(arbovirosesOrdenadas).length,
    corredoresOnibus: mobilidadeRuidoJson.corredoresOnibus.length,
    estacoesMetro: mobilidadeRuidoJson.estacoesMetro.length,
    trilhosMetro: mobilidadeRuidoJson.trilhosMetro.length,
    bytes: fs.statSync(destino).size,
  }),
);
