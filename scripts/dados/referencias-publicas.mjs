// Gera `src/dados/recife/referencias-publicas.json` a partir de fontes públicas oficiais:
// 1. Banco Central do Brasil — SGS 20774 (taxa média anual de financiamento imobiliário a mercado, PF).
// 2. ANEEL Dados Abertos — Tarifa residencial B1 Convencional homologada da Neoenergia Pernambuco (CNPJ 10835932000108).
// 3. Grande Recife Consórcio / CBTU — tarifas oficiais extraídas de `fare_attributes.txt` do GTFS em `.cache/dados-recife/gtfs-inspecao.zip`.
// 4. Centroides dos 94 bairros do Recife a partir de `bairros-do-recife.geojson` (ESIG Prefeitura do Recife, ODbL).
// 5. Eixos costeiros (`OCEANO ATLÂNTICO` / `BACIA PORTUÁRIA`) e estuarinos sob influência de maré (`RIO CAPIBARIBE`, `RIO BEBERIBE`, `RIO TEJIPIÓ`, `RIO JORDÃO`) extraídos de `recursos-hidricos.geojson` (ESIG Prefeitura do Recife, ODbL) para orientação de conferência de Terreno de Marinha / Laudêmio (SPU).

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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
  return s;
}

async function lerOuBaixarJson(nomeArquivo, url) {
  const caminho = path.join(dirCache, nomeArquivo);
  if (fs.existsSync(caminho)) {
    return JSON.parse(fs.readFileSync(caminho, "utf8"));
  }
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "VeredaRecifeDadosAbertos/1.0 (+https://dados.recife.pe.gov.br)",
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    throw new Error(`Falha ao consultar ${url}: HTTP ${resp.status}`);
  }
  const json = await resp.json();
  const envelope = { consultadoEm: new Date().toISOString().slice(0, 10), url, dados: json };
  fs.writeFileSync(caminho, JSON.stringify(envelope, null, 2) + "\n");
  return envelope;
}

async function lerOuBaixarGeojson(nomeArquivo, url) {
  const caminho = path.join(dirCache, nomeArquivo);
  if (!fs.existsSync(caminho)) {
    const resp = await fetch(url, {
      headers: { "User-Agent": "VeredaRecifeDadosAbertos/1.0" },
    });
    if (!resp.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${resp.status}`);
    fs.writeFileSync(caminho, Buffer.from(await resp.arrayBuffer()));
  }
  const bruto = fs.readFileSync(caminho);
  return {
    sha256: createHash("sha256").update(bruto).digest("hex"),
    geojson: JSON.parse(bruto.toString("utf8")),
  };
}

// 1. Banco Central SGS 20774
const bcbUrl = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.20774/dados/ultimos/3?formato=json";
const bcbEnv = await lerOuBaixarJson("bcb-sgs-20774.json", bcbUrl);
const serieBcb = Array.isArray(bcbEnv.dados) ? bcbEnv.dados : [];
const ultimoBcb = serieBcb[serieBcb.length - 1];
if (!ultimoBcb || !ultimoBcb.valor) throw new Error("Série SGS 20774 vazia.");
const [diaBcb, mesBcb, anoBcb] = String(ultimoBcb.data).split("/");
const taxaJurosAnualPct = Number(String(ultimoBcb.valor).replace(",", "."));
if (!Number.isFinite(taxaJurosAnualPct) || taxaJurosAnualPct <= 0) {
  throw new Error(`Taxa BCB inválida: ${ultimoBcb.valor}`);
}

// 2. ANEEL Tarifa Residencial B1 Convencional — Neoenergia Pernambuco (CNPJ 10835932000108)
const filtrosAneel = JSON.stringify({
  NumCNPJDistribuidora: "10835932000108",
  DscSubGrupo: "B1",
  DscModalidadeTarifaria: "Convencional",
  DscBaseTarifaria: "Tarifa de Aplicação",
  DscClasse: "Residencial",
  DscSubClasse: "Residencial",
  DscDetalhe: "Não se aplica",
});
const aneelUrl =
  "https://dadosabertos.aneel.gov.br/api/3/action/datastore_search?resource_id=fcf2906c-7c32-4b9b-a637-054e7a5234f4&limit=5&sort=DatInicioVigencia%20desc&filters=" +
  encodeURIComponent(filtrosAneel);
const aneelEnv = await lerOuBaixarJson("aneel-neoenergia-pe-b1.json", aneelUrl);
const regAneel = aneelEnv.dados?.result?.records?.[0];
if (!regAneel) throw new Error("Tarifa ANEEL Neoenergia PE não encontrada.");
const tusdMwh = Number(String(regAneel.VlrTUSD).replace(",", "."));
const teMwh = Number(String(regAneel.VlrTE).replace(",", "."));
const tarifaHomologadaKwh = Number(((tusdMwh + teMwh) / 1000).toFixed(5));
const tarifaComTributosEstimadaKwh = Number((tarifaHomologadaKwh * 1.33).toFixed(4));

// 3. Tarifas GTFS Grande Recife / CBTU Metrô
const zipGtfs = path.join(dirCache, "gtfs-inspecao.zip");
const csvFare = execFileSync("python3", [
  "-c",
  `import zipfile, sys; z=zipfile.ZipFile(sys.argv[1]); sys.stdout.write(z.read("fare_attributes.txt").decode("utf-8"))`,
  zipGtfs,
]).toString("utf8");
const shaFare = createHash("sha256").update(csvFare).digest("hex");
let tarifaAnelAReais = 4.5;
let tarifaMetroReais = 4.25;
for (const linha of csvFare.trim().split(/\r?\n/).slice(1)) {
  const [fareId, preco] = linha.split(",");
  const v = Number(preco);
  if (fareId?.startsWith("A-") && Number.isFinite(v)) tarifaAnelAReais = v;
  if (fareId === "metro" && Number.isFinite(v)) tarifaMetroReais = v;
}

// 4. Centroides dos 94 bairros a partir de bairros-do-recife.geojson (ESIG ODbL)
const urlBairrosGeojson =
  "https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/5c67ce14-1799-40c4-a37c-9daa04d1761c/download/bairros-do-recife.geojson";
const { sha256: shaBairros, geojson: geoBairros } = await lerOuBaixarGeojson("bairros-do-recife.geojson", urlBairrosGeojson);

function extrairAneis(geom) {
  if (!geom) return [];
  if (geom.type === "Polygon") return geom.coordinates;
  if (geom.type === "MultiPolygon") return geom.coordinates.flat(1);
  return [];
}

const centroidesBairros = {};
const aneisCosteiros = [];
const SLUGS_ORLA_ATLANTICA = new Set(["boa-viagem", "pina", "brasilia-teimosa", "recife"]);

for (const feat of geoBairros.features ?? []) {
  const nome = feat.properties?.EBAIRRNOMEOF || feat.properties?.EBAIRRNOME || "";
  const slug = normalizarSlug(nome);
  const aneis = extrairAneis(feat.geometry);
  if (!slug || aneis.length === 0) continue;
  let somaLon = 0;
  let somaLat = 0;
  let n = 0;
  for (const anel of aneis) {
    for (const pt of anel) {
      somaLon += pt[0];
      somaLat += pt[1];
      n += 1;
    }
  }
  if (n > 0) {
    centroidesBairros[slug] = [Number((somaLon / n).toFixed(5)), Number((somaLat / n).toFixed(5))];
  }
  if (SLUGS_ORLA_ATLANTICA.has(slug)) {
    aneisCosteiros.push({ slug, aneis });
  }
}

// 5. Recursos Hídricos oficiais do Recife (ESIG ODbL): orla atlântica/portuária e estuário sob maré
const urlHidricos =
  "https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/dc655db0-6b58-4334-8d72-1ef666de4b86/download/recursos-hidricos.geojson";
const { sha256: shaHidricos, geojson: geoHidricos } = await lerOuBaixarGeojson("recursos-hidricos.geojson", urlHidricos);

function amostrarPontosDeAnel(anel, passoMetrosAprox = 85) {
  if (!Array.isArray(anel) || anel.length === 0) return [];
  const res = [];
  let ultimo = null;
  for (const pt of anel) {
    const lon = Number(pt[0].toFixed(5));
    const lat = Number(pt[1].toFixed(5));
    if (lon < -35.06 || lon > -34.84 || lat < -8.17 || lat > -7.92) continue;
    if (!ultimo) {
      ultimo = [lon, lat];
      res.push(ultimo);
      continue;
    }
    const dx = (lon - ultimo[0]) * 110200;
    const dy = (lat - ultimo[1]) * 110570;
    if (Math.hypot(dx, dy) >= passoMetrosAprox) {
      ultimo = [lon, lat];
      res.push(ultimo);
    }
  }
  return res;
}

function deduplicarGrade(pontos, precisao = 1200) {
  const vistos = new Set();
  const saidaPts = [];
  for (const [lon, lat] of pontos) {
    const chave = `${Math.round(lon * precisao)}:${Math.round(lat * precisao)}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    saidaPts.push([lon, lat]);
  }
  saidaPts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return saidaPts;
}

const brutosOrla = [];
const brutosEstuario = [];
const NOMES_ORLA = new Set(["OCEANO ATLÂNTICO", "BACIA PORTUÁRIA"]);
const NOMES_ESTUARIO_MARE = new Set([
  "RIO CAPIBARIBE",
  "BRAÇO MORTO DO RIO CAPIBARIBE",
  "RIO BEBERIBE",
  "RIO TEJIPIÓ",
  "RIO JORDÃO",
  "LAGAO DO ARAÇA",
]);

for (const feat of geoHidricos.features ?? []) {
  const nome = String(feat.properties?.NMRECHIDRIC ?? "").trim().toUpperCase();
  if (!NOMES_ORLA.has(nome) && !NOMES_ESTUARIO_MARE.has(nome)) continue;
  for (const anel of extrairAneis(feat.geometry)) {
    const amostrados = amostrarPontosDeAnel(anel, 85);
    if (NOMES_ORLA.has(nome)) brutosOrla.push(...amostrados);
    else if (amostrados.some((p) => p[0] >= -34.945)) {
      // Trecho estuarino/planície sob influência de maré (a leste de ~-34.945 no Recife)
      brutosEstuario.push(...amostrados.filter((p) => p[0] >= -34.945));
    }
  }
}

// Também garante a borda leste da praia de Boa Viagem, Pina e Brasília Teimosa (onde o limite do bairro toca a faixa de areia/mar)
for (const { aneis } of aneisCosteiros) {
  for (const anel of aneis) {
    // Na orla sul do Recife, a linha de praia corre a leste de -34.906 (Boa Viagem/Pina/Brasília Teimosa)
    for (const [lon, lat] of amostrarPontosDeAnel(anel, 85)) {
      if (lat <= -8.08 && lon >= -34.905 && lon <= -34.875) {
        // Verifica se é a face leste do bairro (maior longitude para aquela faixa de latitude)
        brutosOrla.push([lon, lat]);
      }
    }
  }
}

// Filtra na orla sul apenas a borda costeira (máximo leste por faixa de latitude de ~90m) + pontos explícitos de OCEANO/BACIA PORTUÁRIA
const maxLonPorFaixaLat = new Map();
for (const [lon, lat] of brutosOrla) {
  const faixa = Math.round(lat * 1200);
  const atual = maxLonPorFaixaLat.get(faixa);
  if (atual === undefined || lon > atual) maxLonPorFaixaLat.set(faixa, lon);
}
const pontosOrlaFiltrados = brutosOrla.filter(([lon, lat]) => {
  if (lat > -8.08) return true; // Bacia Portuária / Recife Antigo
  const maxLon = maxLonPorFaixaLat.get(Math.round(lat * 1200)) ?? lon;
  return maxLon - lon <= 0.0016; // até ~175m da linha de praia
});

const pontosOrla = deduplicarGrade(pontosOrlaFiltrados, 1300);
const pontosEstuario = deduplicarGrade(brutosEstuario, 1100);

const saida = {
  versao: 1,
  municipio: "2611606",
  financiamento: {
    serieSgs: 20774,
    taxaEfetivaAnualPct: taxaJurosAnualPct,
    referenciaData: `${anoBcb}-${mesBcb}-${diaBcb}`,
    consultadoEm: bcbEnv.consultadoEm,
    fonte: "Banco Central do Brasil — Série SGS 20774 (Financiamento imobiliário PF com taxas de mercado)",
    url: bcbUrl,
    licenca: "Dados Abertos BCB",
  },
  energia: {
    distribuidora: "Neoenergia Pernambuco",
    cnpj: "10835932000108",
    resolucao: String(regAneel.DscREH),
    inicioVigencia: String(regAneel.DatInicioVigencia),
    fimVigencia: String(regAneel.DatFimVigencia),
    tarifaHomologadaKwh,
    tarifaComTributosEstimadaKwh,
    consultadoEm: aneelEnv.consultadoEm,
    fonte: "ANEEL — Tarifas Homologadas de Distribuição (Subgrupo B1 Residencial Convencional)",
    url: "https://dadosabertos.aneel.gov.br/dataset/tarifas-distribuidoras-energia-eletrica",
    licenca: "Dados Abertos ANEEL",
  },
  transportePublico: {
    tarifaAnelAReais,
    tarifaMetroReais,
    sha256FareAttributes: shaFare,
    fonte: "Grande Recife Consórcio de Transporte / CBTU Recife (GTFS oficial)",
    licenca: "Dados públicos de transporte metropolitano",
  },
  marinha: {
    fonteGeometria: "Prefeitura do Recife — ESIG Recursos Hídricos e Limites Costeiros (dados.recife.pe.gov.br)",
    urlGeometria: urlHidricos,
    sha256Hidricos: shaHidricos,
    sha256Bairros: shaBairros,
    normaReferencia: "Decreto-Lei nº 9.760/1946 (Terrenos de Marinha e Acrescidos — SPU)",
    licenca: "ODbL 1.0",
    bairrosIlhasAterroHistorico: [
      "recife",
      "santo-antonio",
      "sao-jose",
      "ilha-do-leite",
      "ilha-joana-bezerra",
      "cabanga",
      "coelhos",
      "brasilia-teimosa",
      "pina",
    ],
    pontosOrla,
    pontosEstuario,
  },
  centroidesBairros,
};

if (Object.keys(centroidesBairros).length !== 94) {
  throw new Error(`Esperados os 94 bairros oficiais do Recife; obtidos ${Object.keys(centroidesBairros).length}`);
}

const destino = path.join(raiz, "src/dados/recife/referencias-publicas.json");
fs.writeFileSync(destino + ".tmp", JSON.stringify(saida) + "\n");
fs.renameSync(destino + ".tmp", destino);
console.log(
  JSON.stringify({
    jurosBcbPct: saida.financiamento.taxaEfetivaAnualPct,
    tarifaKwhHomologada: saida.energia.tarifaHomologadaKwh,
    tarifaKwhComTributos: saida.energia.tarifaComTributosEstimadaKwh,
    anelA: saida.transportePublico.tarifaAnelAReais,
    bairrosComCentroide: Object.keys(centroidesBairros).length,
    pontosOrla: pontosOrla.length,
    pontosEstuario: pontosEstuario.length,
    bytes: fs.statSync(destino).size,
  }),
);
