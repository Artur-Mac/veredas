#!/usr/bin/env node
// 13-seguranca.mjs — processa raw/seguranca/crimebrasil-bairros.json → processado/seguranca.json
// Fonte: Crime Brasil (crimebrasil.com.br) — páginas por bairro, período 12 meses (Nov 2025 — Out 2026)
//
// Uso: node 13-seguranca.mjs
// Saída: processado/seguranca.json

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW = join(__dirname, "..", "..", "raw", "seguranca", "crimebrasil-bairros.json");
const OUT = join(__dirname, "..", "..", "processado");

async function main() {
  if (!existsSync(RAW)) {
    console.error("raw/seguranca/crimebrasil-bairros.json não encontrado — rode 11-crimebrasil.mjs primeiro");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(RAW, "utf8"));
  const bairros = {};

  for (const [nome, d] of Object.entries(raw.bairros)) {
    bairros[nome] = {
      bairro: nome,
      url: d.url,
      consultado_em: d.consultado_em,
      periodo: d.periodo,
      ocorrencias_12m: d.ocorrencias_periodo,
      ranking: `${d.ranking.posicao}º de ${d.ranking.total_bairros}`,
      tendencia: d.ano_a_ano.tendencia,
      ano_a_ano: { base: d.ano_a_ano.ano_base, fim: d.ano_a_ano.ano_fim },
      por_tipo: d.por_tipo,
      perfil: d.perfil,
    };
  }

  saveOut(join(OUT, "seguranca.json"), JSON.stringify({
    consultado_em: raw.consultado_em,
    fonte: "Crime Brasil (crimebrasil.com.br)",
    periodo: "Nov 2025 — Out 2026",
    bairros,
  }, null, 2));

  console.log(`--- salvo em ${OUT}/seguranca.json (${Object.keys(bairros).length} bairros) ---`);

  registrarFonte({
    id: "crimebrasil",
    nome: "Crime Brasil",
    url: "https://crimebrasil.com.br",
    tipo: "scraping_publico",
    area: "seguranca",
    status: "ok",
    acesso: "Páginas por bairro (crimebrasil.com.br/bairro/pe/recife/{bairro}), HTML server-side, período 12 meses",
    observacoes:
      "Contagem de ocorrências (subnotificação). População IBGE Censo 2022. " +
      "Período: Nov 2025 — Out 2026. Licença CC BY 4.0.",
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
