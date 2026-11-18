#!/usr/bin/env node
/**
 * Extrator batch ESIG ArcGIS REST (paginação determinística por OBJECTID em EPSG:31985) + validação contra
 * o diretório local `.cache/dados-recife/` ou coleta controlada `--ao-vivo`.
 *
 * Uso:
 *   node scripts/dados/esig-extrator.mjs --listar-endpoints
 *   node scripts/dados/esig-extrator.mjs --ao-vivo [--camada lpuos_2025] [--max-paginas 5]
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ESIG_ENDPOINTS,
  construirUrlPaginadaEsig,
  extrairCamadaEsigPaginadaBruta as extrairCamadaEsigPaginada,
} from "../../src/municipios/recife/extratores/esigEndpoints.ts";

const RAIZ = process.cwd();
const OUT_DIR = join(RAIZ, ".cache/esig-rest");

const args = process.argv.slice(2);
if (args.includes("--listar-endpoints") || (!args.includes("--ao-vivo"))) {
  const lista = Object.entries(ESIG_ENDPOINTS).map(([chave, cfg]) => ({
    chave,
    slug: cfg.slug,
    escalaReferencia: cfg.escalaReferencia,
    maxRecordCount: cfg.maxRecordCount,
    sampleQueryUrl: construirUrlPaginadaEsig(cfg, 0, 31985),
  }));
  console.log(JSON.stringify(lista, null, 2));
  process.exit(0);
}

const idxCamada = args.indexOf("--camada");
const chave = idxCamada >= 0 ? args[idxCamada + 1] : "lpuos_2025";
const cfg = ESIG_ENDPOINTS[chave];
if (!cfg) {
  console.error(`Camada ESIG desconhecida: ${chave}. Disponíveis: ${Object.keys(ESIG_ENDPOINTS).join(", ")}`);
  process.exit(1);
}

const idxMax = args.indexOf("--max-paginas");
const maxPaginas = idxMax >= 0 ? Number(args[idxMax + 1]) || 5 : 5;

const res = await extrairCamadaEsigPaginada(
  cfg,
  async (url) => {
    const r = await fetch(url, { headers: { "User-Agent": "Vereda-ESIG/1.0" }, signal: AbortSignal.timeout(30_000) });
    return {
      status: r.status,
      headers: r.headers,
      json: () => r.json(),
    };
  },
  { maxPaginas },
);

mkdirSync(OUT_DIR, { recursive: true });
const rawJson = JSON.stringify(res.feicoes);
const sha = createHash("sha256").update(rawJson).digest("hex");
res.snapshot.sha256_raw = sha;

writeFileSync(join(OUT_DIR, `${cfg.slug}.json`), rawJson + "\n");
writeFileSync(join(OUT_DIR, `${cfg.slug}.snapshot.json`), JSON.stringify(res.snapshot, null, 2) + "\n");
console.log(JSON.stringify({ slug: cfg.slug, paginasLidas: res.paginasLidas, registros: res.feicoes.length, sha256: sha }, null, 2));
