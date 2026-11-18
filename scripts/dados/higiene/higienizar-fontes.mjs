#!/usr/bin/env node
/**
 * Script de higiene determinística das fontes locais do VEREDA:
 * 1) Converte APAC GeoJSON e pulsos COP (+3h UTC -> BRT -03:00) e coloca leituras negativas (-1) em quarentena (null);
 * 2) Desduplica recursos triplicados de paraciclos pelo SHA-256 e chave espacial;
 * 3) Extrai somente as 49 árvores tombadas oficiais (excluindo copa/altura defasada do censo 2007);
 * 4) Registra CTTU 2015/2016 e camadas pré-PD2021 na quarentena `arquivado_fora_do_manifesto`;
 * 5) Emite manifesto de higiene em `out/higiene/relatorio-higiene.json`.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { corrigirPulsoCopParaBrt, higienizarApacGeojson } from "../../../src/nucleo/higiene/chuvaBr.ts";
import { deduplicarParaciclosGeojson } from "../../../src/nucleo/higiene/cicloviario.ts";
import { extrairArvoresTombadasOficiais, REGISTRO_FONTES_ARQUIVADAS } from "../../../src/nucleo/higiene/arquivosLegados.ts";

const RAIZ = process.cwd();
const OUT_DIR = join(RAIZ, "out/higiene");
mkdirSync(OUT_DIR, { recursive: true });

const sha256File = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

// 1. APAC GeoJSON (20 estações) -> BRT + quarentena de -1 e 1900-01-01
const apacPath = join(RAIZ, "docs/aplicacao/apac-chuva-recife-2026-11-15.geojson");
const apacRaw = JSON.parse(readFileSync(apacPath, "utf8"));
const apacLimpo = higienizarApacGeojson(apacRaw);
writeFileSync(
  join(OUT_DIR, "apac-chuva-recife-brt.json"),
  JSON.stringify(
    {
      fonteOriginalSha256: sha256File(apacPath),
      regraFuso: "DATAHORA_BRT = DATAHORA_UTC - 3h",
      ...apacLimpo,
    },
    null,
    2,
  ) + "\n",
);

// 2. Pulsos COP (7.808 registros) -> correção do desvio de +3h no IDUNICO vs DATAHORA
const copPath = join(RAIZ, "docs/dados/raw/fontes-prioritarias-2026-11-14/chuva-cop-pulsos-recife.json");
let resumoCop = { encontrado: false };
if (existsSync(copPath)) {
  const copRaw = JSON.parse(readFileSync(copPath, "utf8"));
  const corrigidos = (copRaw.registros ?? []).map(corrigirPulsoCopParaBrt);
  const comDesvio = corrigidos.filter((c) => c.desvioCorrigido3h).length;
  resumoCop = {
    encontrado: true,
    fonteOriginalSha256: sha256File(copPath),
    totalRegistros: corrigidos.length,
    registrosCorrigidos3h: comDesvio,
    amostraPrimeiros5: corrigidos.slice(0, 5),
  };
  writeFileSync(join(OUT_DIR, "cop-pulsos-brt-resumo.json"), JSON.stringify(resumoCop, null, 2) + "\n");
}

// 3. Paraciclos GeoJSONs triplicados no cache do hub
const paraciclosIds = [
  "836b8e24-67d8-49fc-a62c-85602b501e80",
  "a290b35f-0f2f-440a-a437-ad478a9076ff",
  "8778757a-1daa-49aa-a553-2cce1be03569",
];
const recursosParaciclos = [];
for (const id of paraciclosIds) {
  const p = join(RAIZ, ".cache/dados-recife/hub-2026-11-15", `${id}.geojson`);
  if (!existsSync(p)) continue;
  const parsed = JSON.parse(readFileSync(p, "utf8"));
  recursosParaciclos.push({
    resourceId: id,
    sha256: sha256File(p),
    features: parsed.features ?? [],
  });
}
const paraciclosLimpo = deduplicarParaciclosGeojson(recursosParaciclos);
writeFileSync(
  join(OUT_DIR, "paraciclos-deduplicado.json"),
  JSON.stringify(
    {
      recursosLidos: paraciclosLimpo.recursosLidos,
      recursosDescartadosPorShaIdentico: paraciclosLimpo.recursosDescartadosPorShaIdentico,
      feicoesBrutas: paraciclosLimpo.feicoesBrutas,
      feicoesDuplicadasRemovidas: paraciclosLimpo.feicoesDuplicadasRemovidas,
      unicosCount: paraciclosLimpo.unicos.length,
      unicos: paraciclosLimpo.unicos,
    },
    null,
    2,
  ) + "\n",
);

// 4. Árvores tombadas oficiais
const arvoresPath = join(RAIZ, ".cache/dados-recife/arvores-tombadas.geojson");
let arvoresTombadas = [];
if (existsSync(arvoresPath)) {
  arvoresTombadas = extrairArvoresTombadasOficiais(JSON.parse(readFileSync(arvoresPath, "utf8")));
  writeFileSync(join(OUT_DIR, "arvores-tombadas-oficiais.json"), JSON.stringify(arvoresTombadas, null, 2) + "\n");
}

const relatorio = {
  executadoEm: new Date().toISOString(),
  apac: {
    total: apacLimpo.totalLidas,
    validas: apacLimpo.validas,
    quarentenadas: apacLimpo.quarentenadas,
    leiturasNegativasRemovidas: apacLimpo.leiturasNegativasRemovidas,
  },
  cop: {
    encontrado: resumoCop.encontrado,
    totalRegistros: resumoCop.totalRegistros ?? 0,
    registrosCorrigidos3h: resumoCop.registrosCorrigidos3h ?? 0,
  },
  paraciclos: {
    recursosLidos: paraciclosLimpo.recursosLidos,
    recursosDescartadosPorShaIdentico: paraciclosLimpo.recursosDescartadosPorShaIdentico,
    unicosCount: paraciclosLimpo.unicos.length,
  },
  arvoresTombadasPreservadas: arvoresTombadas.length,
  fontesArquivadasForaDoManifesto: REGISTRO_FONTES_ARQUIVADAS,
};

writeFileSync(join(OUT_DIR, "relatorio-higiene.json"), JSON.stringify(relatorio, null, 2) + "\n");
console.log(JSON.stringify(relatorio, null, 2));
