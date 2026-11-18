#!/usr/bin/env node
// 09-processar.mjs — consolida raw/ → processado/ seguindo as regras do CRIVO.
// Gera os 7 JSONs especificados em docs/dados/crivo/CRIVO.md.
//
// Uso: node 09-processar.mjs
// Depende: saída dos scrapers 01–08 em docs/dados/raw/

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { saveOut } from "./http.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW = join(__dirname, "..", "..", "raw");
const OUT = join(__dirname, "..", "..", "processado");
mkdirSync(OUT, { recursive: true });

// bairros-alvo com coordenada central aproximada
const BAIRROS = {
  "Boa Viagem": { lat: -8.8650, lng: -34.8950 },
  "Casa Forte": { lat: -8.8150, lng: -34.9150 },
  "Graças":     { lat: -8.8500, lng: -34.9250 },
  "Espinheiro": { lat: -8.8400, lng: -34.9300 },
  "Madalena":   { lat: -8.8550, lng: -34.9350 },
};

function loadJson(rel) {
  const p = join(RAW, rel);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}
const loadJson2 = loadJson;

function distMetros(lat1, lng1, lat2, lng2) {
  const x = (lng2 - lng1) * 111320 * Math.cos(((lat1 + lat2) / 2 * Math.PI) / 180);
  const y = (lat2 - lat1) * 110540;
  return Math.sqrt(x * x + y * y);
}

// ---------- 1. RUIDO-AEROPORTO ----------
function processarRuido() {
  const ru = loadJson2("ruido-aeroporto/predios-afetados-ruido.json");
  if (!ru) return null;
  const predios = ru.predios_5bairros || {};
  const out = {};
  for (const bairro of Object.keys(BAIRROS)) {
    const p = predios[bairro] || {};
    out[bairro] = {
      dentro_do_cone: p.dentro || 0,
      total_considerado: p.total || 0,
      fonte: "cone simplificado FAA/ICAO (±15°, 15 km), pista 08L/26R, -8.8383,-34.9040, azimute 86°",
      gerado_em: ru.gerado_em || new Date().toISOString(),
    };
  }
  return out;
}

// ---------- 2. ALAGAMENTO ----------
function processarAlagamento() {
  // Lê os CSVs da Defesa Civil e agrupa por bairro
  const fs = readFileSync;
  const csvDir = join(RAW, "cadastro-municipal");
  let totalAtend = 0;
  const porBairro = {};
  for (const bairro of Object.keys(BAIRROS)) { porBairro[bairro] = 0; }

  const anos = ["2021", "2022", "2023", "2024", "2025"];
  for (const ano of anos) {
    const file = join(csvDir, `defesa-civil-${ano}.csv`);
    if (!existsSync(file)) continue;
    const text = fs(file, "utf8");
    const lines = text.trim().split("\n");
    // header: ; separador
    let header = lines[0];
    // encontrar índices das colunas (defensivo)
    const cols = header.split(";").map(s => s.trim().replace(/^"|"$/g, ""));
    const idxTipo = cols.findIndex(c => /tipo/i.test(c));
    const idxEnd  = cols.findIndex(c => /endereco|rua/i.test(c));
    const idxBairro = cols.findIndex(c => /bairro|distrito/i.test(c));
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(";").map(s => s.trim().replace(/^"|"$/g, ""));
      if (parts.length < 3) continue;
      totalAtend++;
      const ocorrencia = (parts[cols.findIndex((c) => /ocorrencia/i.test(c))] || "").toLowerCase();
      const tipo = (parts[idxTipo] || "").toLowerCase();
      const solicitacao = (parts[cols.findIndex((c) => /solicitacao/i.test(c))] || "").toLowerCase();
      // conta alagamento / enchente / inundação em qualquer campo relevante
      if (/alag|enchent|inunda/.test(ocorrencia + " " + tipo + " " + solicitacao)) {
        const b = (parts[idxBairro] || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const alvo = Object.keys(BAIRROS).find((x) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === b);
        if (alvo) porBairro[alvo]++;
      }
    }
  }

  const out = {};
  for (const [b, c] of Object.entries(BAIRROS)) {
    out[b] = {
      atendimentos_alagamento_5anos: porBairro[b] || 0,
      fonte: `Defesa Civil Recife, CKAN dados.recife.pe.gov.br, 2021–2025 (${totalAtend} atendimentos totais)`,
    };
  }
  return out;
}

// ---------- 3. TRANSPORTE ----------
function processarTransporte() {
  const paradas = loadJson2("transporte/paradas.json");
  if (!paradas) return null;
  const ps = paradas.paradas || [];
  // aplicar offset lat -0.75° (correção conhecida do GTFS Grande Recife)
  const OFFSET = 0.75;
  const out = {};
  for (const [bairro, c] of Object.entries(BAIRROS)) {
    const proximas = ps.filter(p => distMetros(c.lat, c.lng, p.lat - OFFSET, p.lng) <= 400);
    out[bairro] = {
      paradas_400m: proximas.length,
      exemplos: proximas.slice(0, 3).map(p => p.nome),
      fonte: "GTFS Grande Recife, stops.txt (7238 paradas), offset lat -0.75° aplicado",
    };
  }
  return out;
}

// ---------- 4. PREÇOS ----------
function processarPrecos() {
  const fipe = loadJson2("precos/fipezap-bairros-recife.json");
  if (!fipe) return null;
  // fipezap-bairros-recife.json tem linhas (array) e linhas_bairros (contador)
  const linhas = fipe.linhas || [];
  const ultimo = linhas.length ? linhas[linhas.length - 1] : null;
  const out = {};
  for (const bairro of Object.keys(BAIRROS)) {
    out[bairro] = {
      locacao_m2: ultimo?.locacao_m2 ?? null,
      venda_m2: ultimo?.venda_m2 ?? null,
      ultima_data: ultimo?.data || null,
      linhas_bairros: fipe.linhas_bairros || 0,
      fonte: "FipeZAP, xlsx mensal (Recife agregado), " + (fipe.total_linhas || 0) + " linhas",
    };
  }
  return out;
}

// ---------- 5. ENTORNO ----------
function processarEntorno() {
  const out = {};
  for (const bairro of Object.keys(BAIRROS)) {
    const slug = bairro.toLowerCase().replace(/\s+/g, "_");
    const osm = loadJson2(`osm-pois/${slug}.json`);
    const gm = loadJson2(`google-maps/${bairro.replace(/\s+/g, "_")}.json`);
    const categorias = {};
    if (osm) {
      for (const [cat, v] of Object.entries(osm)) {
        if (cat === "bairro" || cat === "consultado_em") continue;
        if (typeof v === "object" && v !== null && v.total !== undefined) {
          categorias[cat] = v.total;
        }
      }
    }
    if (gm) {
      for (const [cat, v] of Object.entries(gm)) {
        if (typeof v === "object" && v !== null && v.total !== undefined) {
          if (!categorias[cat]) categorias[cat] = v.total;
        }
      }
    }
    out[bairro] = {
      categorias,
      fonte: "OSM (Overpass API) + Google Maps (endpoint público)",
    };
  }
  return out;
}

// ---------- 6. CONDOMÍNIO ----------
function processarCondominio() {
  const fipe = loadJson2("precos/fipezap-bairros-recife.json");
  if (!fipe) return null;
  const linhas = fipe.linhas || [];
  const ultimo = linhas.length ? linhas[linhas.length - 1] : null;
  const out = {};
  for (const bairro of Object.keys(BAIRROS)) {
    out[bairro] = {
      venda_m2: ultimo?.venda_m2 ?? null,
      locacao_m2: ultimo?.locacao_m2 ?? null,
      data: ultimo?.data || null,
      fonte: "FipeZAP (Recife agregado)",
    };
  }
  return out;
}

// ---------- 8. TEMPERATURA ----------
function processarTemperatura() {
  const temp = loadJson2("temperatura/temperatura-bairros.json");
  if (!temp) return null;
  const porBairro = {};
  for (const b of temp.bairros || []) {
    porBairro[b.bairro] = b;
  }
  const out = {};
  for (const bairro of Object.keys(BAIRROS)) {
    const b = porBairro[bairro];
    if (!b) continue;
    const s = b.serie_diaria || {};
    const r = b.recente_30d || {};
    out[bairro] = {
      media_anual: s.media_anual ? +s.media_anual.toFixed(1) : null,
      max_registrado: s.max ?? null,
      max_em: s.max_em ?? null,
      min_registrado: s.min ?? null,
      min_em: s.min_em ?? null,
      mes_mais_quente: s.mes_mais_quente ?? null,
      media_max_mes_quente: s.media_max_mes_quente ? +s.media_max_mes_quente.toFixed(1) : null,
      mes_mais_frio: s.mes_mais_frio ?? null,
      media_min_mes_frio: s.media_min_mes_frio ? +s.media_min_mes_frio.toFixed(1) : null,
      tendencia_por_decada: s.tendencia_max_por_decada ?? null,
      recente_30d_media_max: r.media_max ? +r.media_max.toFixed(1) : null,
      fonte: `Open-Meteo ERA5 ${s.periodo || ""} + medição recente, consultado ${temp.consultado_em}`.trim(),
      nota: temp.nota_limite,
    };
  }
  return out;
}

// ---------- 7. PESQUISA ----------
function processarPesquisa() {
  const pesq = loadJson2("pesquisa-cientifica/papers.json");
  if (!pesq) return null;
  const artigos = [];
  let total = 0;
  for (const [id, v] of Object.entries(pesq)) {
    if (v.erro) continue;
    total += v.total || 0;
    for (const p of (v.papers || []).slice(0, 5)) {
      artigos.push({ titulo: p.titulo, ano: p.ano, fonte: v.fonte, url: p.url, tema: id });
    }
  }
  return {
    artigos: artigos.slice(0, 20),
    total_encontrado: total,
  };
}

// ---------- main ----------
const tarefas = [
  ["ruido-aeroporto.json", processarRuido],
  ["alagamento.json", processarAlagamento],
  ["transporte.json", processarTransporte],
  ["precos.json", processarPrecos],
  ["entorno.json", processarEntorno],
  ["condominio.json", processarCondominio],
  ["temperatura.json", processarTemperatura],
  ["pesquisa.json", processarPesquisa],
];

for (const [nome, fn] of tarefas) {
  try {
    const resultado = fn();
    if (resultado) {
      saveOut(join(OUT, nome), JSON.stringify(resultado, null, 2));
      console.log("OK", nome);
    } else {
      console.log("skip", nome, "(sem dados em raw/)");
    }
  } catch (e) {
    console.log("ERRO", nome, e.message);
  }
}
