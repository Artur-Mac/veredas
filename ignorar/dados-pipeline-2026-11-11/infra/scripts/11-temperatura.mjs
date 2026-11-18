#!/usr/bin/env node
// 11-temperatura.mjs — temperatura do ar por bairro, via Open-Meteo (sem chave).
//
// Por que Open-Meteo: API pública, sem chave, e o modelo é geográfico — cada
// consulta cai numa célula da grade de ~25–30 km, então dá pra pedir por
// coordenada de bairro e não só por "Recife". Duas fontes de dados:
//   1. archive-api/era5 — histórico reanalizado (30+ anos, diário)
//   2. api/v1/forecast  — medição/reanálise recente (últimos ~30 dias, diário)
//
// Para cada bairro-alvo calculamos:
//   - média anual, temperatura mais quente/fria do ano
//   - média do mês mais quente e do mês mais frio (regras de clima)
//   - tendência de longo prazo (regressão linear °C/década, 1995→hoje)
//
// Fato com fonte e data: cada série traz a data de consulta e a fonte citada.
// Salva em raw/temperatura/temperatura-bairros.json e em temperatura-bairros.csv.

import { getJSON, saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "temperatura");

// Mesmos centros de bairro usados em 09-processar.mjs (consistência)
const BAIRROS = {
  "Boa Viagem": { lat: -8.8650, lng: -34.8950 },
  "Casa Forte": { lat: -8.8150, lng: -34.9150 },
  "Graças":     { lat: -8.8500, lng: -34.9250 },
  "Espinheiro": { lat: -8.8400, lng: -34.9300 },
  "Madalena":   { lat: -8.8550, lng: -34.9350 },
};

const ANO_INICIO = 1995; // início da série de tendência (reanálise estável)
const ANO_FIM = new Date().getFullYear();

// ---------- helpers ----------
const MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function media(nums) {
  const v = nums.filter((x) => typeof x === "number" && !Number.isNaN(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

// Regressão linear simples: devolve a inclinação (°C por ano)
function tendenciaPorAno(dates, valores) {
  const pts = [];
  for (let i = 0; i < dates.length; i++) {
    const y = valores[i];
    if (typeof y !== "number" || Number.isNaN(y)) continue;
    const d = new Date(dates[i]);
    if (Number.isNaN(d.getTime())) continue;
    const ano = d.getFullYear() + (d.getMonth() + d.getDate() / 31) / 12;
    pts.push([ano, y]);
  }
  if (pts.length < 10) return null;
  const n = pts.length;
  const somaX = pts.reduce((a, [x]) => a + x, 0);
  const somaY = pts.reduce((a, [, y]) => a + y, 0);
  const somaXY = pts.reduce((a, [x, y]) => a + x * y, 0);
  const somaXX = pts.reduce((a, [x]) => a + x * x, 0);
  const denom = n * somaXX - somaX * somaX;
  if (Math.abs(denom) < 1e-9) return null;
  return (n * somaXY - somaX * somaY) / denom; // °C/ano
}

// Agrupa por mês e devolve a média de cada mês (máx ou mín, conforme o vetor)
function mediaPorMes(dates, valores) {
  const buckets = Array.from({ length: 12 }, () => []);
  for (let i = 0; i < dates.length; i++) {
    const y = valores[i];
    if (typeof y !== "number" || Number.isNaN(y)) continue;
    const d = new Date(dates[i]);
    if (Number.isNaN(d.getTime())) continue;
    buckets[d.getMonth()].push(y);
  }
  return buckets.map((b) => (b.length ? media(b) : null));
}

function maisExtremo(dates, valores) {
  let melhor = null;
  let pior = null;
  let idxMelhor = -1, idxPior = -1;
  for (let i = 0; i < dates.length; i++) {
    const y = valores[i];
    if (typeof y !== "number" || Number.isNaN(y)) continue;
    if (melhor === null || y > melhor) { melhor = y; idxMelhor = i; }
    if (pior === null || y < pior) { pior = y; idxPior = i; }
  }
  return {
    max: melhor, max_em: idxMelhor >= 0 ? dates[idxMelhor] : null,
    min: pior,  min_em: idxPior >= 0 ? dates[idxPior] : null,
  };
}

// ---------- coleta ----------
async function coletarBairro(bairro, { lat, lng }) {
  const tz = "America/Recife";
  const resultado = {
    bairro,
    lat, lng,
    consultado_em: new Date().toISOString(),
    fonte: "Open-Meteo (reanálise ERA5 + medição recente), sem chave",
    serie_diaria: null, // resumo
    tendencia_anual: null,
    por_mes: null,
    erros: [],
  };

  // 1) Histórico ERA5 (diário, de ANO_INICIO a hoje).
  //    O archive aceita end_date até o dia de hoje (reanálise com ~5 dias de atraso);
  //    end_date no futuro dá HTTP 400.
  const hoje = new Date().toISOString().slice(0, 10);
  const urlEra5 =
    `https://archive-api.open-meteo.com/v1/era5` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean` +
    `&start_date=${ANO_INICIO}-01-01&end_date=${hoje}&timezone=${encodeURIComponent(tz)}`;
  try {
    const d = await getJSON(urlEra5);
    const t = d.daily?.time || [];
    const max = d.daily?.temperature_2m_max || [];
    const min = d.daily?.temperature_2m_min || [];
    const mean = d.daily?.temperature_2m_mean || [];
    if (!t.length) throw new Error("ERA5: série vazia");

    const extMax = maisExtremo(t, max);
    const extMin = maisExtremo(t, min);
    const mediaAno = media(mean);
    const porMesMax = mediaPorMes(t, max);
    const porMesMin = mediaPorMes(t, min);
    const tendenciaMax = tendenciaPorAno(t, max);
    const tendenciaMean = tendenciaPorAno(t, mean);

    // mês mais quente/frio pela média mensal (regras de clima)
    const idxQuente = porMesMax.indexOf(Math.max(...porMesMax.filter((x) => x !== null)));
    const idxFrio = porMesMin.indexOf(Math.min(...porMesMin.filter((x) => x !== null)));

    resultado.serie_diaria = {
      periodo: `${ANO_INICIO}–${ANO_FIM}`,
      n_dias: t.length,
      media_anual: mediaAno,
      max: extMax.max, max_em: extMax.max_em,
      min: extMin.min, min_em: extMin.min_em,
      mes_mais_quente: MESES[idxQuente], media_max_mes_quente: porMesMax[idxQuente],
      mes_mais_frio: MESES[idxFrio], media_min_mes_frio: porMesMin[idxFrio],
      tendencia_max_por_decada: tendenciaMax ? +(tendenciaMax * 10).toFixed(2) : null,
      tendencia_media_por_decada: tendenciaMean ? +(tendenciaMean * 10).toFixed(2) : null,
      unidade: "°C",
    };
    resultado.por_mes = {
      media_max: porMesMax,
      media_min: porMesMin,
      unidade: "°C",
    };
    // guarda uma amostra compacta da série (anual, por trimestre) para o app
    resultado.amostra_anual = t
      .map((dt, i) => ({ d: dt, max: max[i], min: min[i], mean: mean[i] }))
      .filter((o, i) => i % 90 === 0 || i === t.length - 1) // ~1 amostra/mês
      .slice(-130);
    console.log(`${bairro}: ERA5 ${t.length} dias, média ${mediaAno?.toFixed(1)}°C, máx ${extMax.max}°C em ${extMax.max_em}, mín ${extMin.min}°C em ${extMin.min_em}, tendência ${resultado.serie_diaria.tendencia_max_por_decada}°C/década`);
  } catch (e) {
    resultado.erros.push(`ERA5: ${e.message}`);
    console.log(`${bairro}: ERA5 ERRO ${e.message}`);
  }

  // 2) Recente (últimos 30 dias, medição/reanálise)
  const fim = new Date();
  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - 30);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const urlRecente =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean` +
    `&start_date=${fmt(inicio)}&end_date=${fmt(fim)}&timezone=${encodeURIComponent(tz)}`;
  try {
    const d = await getJSON(urlRecente);
    const t = d.daily?.time || [];
    const max = d.daily?.temperature_2m_max || [];
    const min = d.daily?.temperature_2m_min || [];
    if (!t.length) throw new Error("recente: série vazia");
    const extMax = maisExtremo(t, max);
    const extMin = maisExtremo(t, min);
    resultado.recente_30d = {
      periodo: `${fmt(inicio)}–${fmt(fim)}`,
      n_dias: t.length,
      media_max: media(max),
      media_min: media(min),
      max: extMax.max, max_em: extMax.max_em,
      min: extMin.min, min_em: extMin.min_em,
      unidade: "°C",
    };
    console.log(`${bairro}: recente 30d, média máx ${media(max)?.toFixed(1)}°C, média mín ${media(min)?.toFixed(1)}°C`);
  } catch (e) {
    resultado.erros.push(`recente: ${e.message}`);
    console.log(`${bairro}: recente ERRO ${e.message}`);
  }

  return resultado;
}

function paraCsv(registros) {
  const linhas = [
    "bairro,lat,lng,media_anual,max,max_em,min,min_em,mes_mais_quente,media_max_mes_quente,mes_mais_frio,media_min_mes_frio,tendencia_max_por_decada,unidade,fonte",
  ];
  for (const r of registros) {
    const s = r.serie_diaria;
    if (!s) continue;
    linhas.push(
      [
        r.bairro, r.lat, r.lng,
        s.media_anual?.toFixed(1),
        s.max, s.max_em, s.min, s.min_em,
        s.mes_mais_quente, s.media_max_mes_quente?.toFixed(1),
        s.mes_mais_frio, s.media_min_mes_frio?.toFixed(1),
        s.tendencia_max_por_decada,
        s.unidade,
        `Open-Meteo ${s.periodo}`,
      ].join(",")
    );
  }
  return linhas.join("\n");
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const alvo = process.argv[2] ? [process.argv[2]] : Object.keys(BAIRROS);

  const registros = [];
  for (const bairro of alvo) {
    const c = BAIRROS[bairro];
    if (!c) {
      console.error(`Bairro desconhecido: ${bairro}. Use: ${Object.keys(BAIRROS).join(", ")}`);
      process.exit(1);
    }
    registros.push(await coletarBairro(bairro, c));
    // Open-Meteo é generoso, mas dá uma folga curta
    await new Promise((r) => setTimeout(r, 800));
  }

  const doc = {
    fonte: "Open-Meteo (reanálise ERA5 + medição recente), sem chave",
    consultado_em: new Date().toISOString(),
    unidade: "°C",
    nota_limite:
      "A reanálise ERA5 tem grade de ~25–30 km: os 5 bairros-alvo (zona sul/centro de Recife) caem na MESMA célula, então a série histórica 1995–2026 é idêntica entre eles. A variação por bairro só aparece na medição recente (últimos 30 dias). Para diferença real entre bairros, usar estação local (INMET) ou reanálise de maior resolução (ERA5-Land 9 km / ECMWF).",
    bairros: registros,
  };
  const jsonPath = join(OUT, "temperatura-bairros.json");
  saveOut(jsonPath, JSON.stringify(doc, null, 2));
  saveOut(join(OUT, "temperatura-bairros.csv"), paraCsv(registros));
  console.log(`\n--- ${registros.length} bairros salvos em raw/temperatura/ ---`);

  const todosOk = registros.every((r) => !r.erros.length && r.serie_diaria);
  registrarFonte({
    id: "open-meteo",
    nome: "Open-Meteo (temperatura do ar por bairro)",
    url: "https://open-meteo.com",
    tipo: "api_publica",
    area: "temperatura",
    status: todosOk ? "ok" : "parcial",
    acesso: "API pública, sem chave; reanálise ERA5 (histórico) + medição recente",
    observacoes: `Série diária ${ANO_INICIO}–${ANO_FIM} por coordenada de bairro. ${registros.length} bairros.`,
  });
}

main().catch((e) => {
  console.error(e);
  registrarFonte({ id: "open-meteo", nome: "Open-Meteo", url: "https://open-meteo.com", tipo: "api_publica", area: "temperatura", status: "falhou", acesso: "erro", observacoes: String(e.message || e) });
  process.exit(1);
});
