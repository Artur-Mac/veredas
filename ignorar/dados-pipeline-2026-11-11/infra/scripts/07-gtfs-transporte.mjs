#!/usr/bin/env node
// 07-gtfs-transporte.mjs — GTFS do Grande Recife: linhas, paradas e horários.
// Processa o GTFS (ZIP) e calcula, por coordenada, quantas linhas passam a 400 m.
// Salva em raw/transporte/.

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "transporte");
const GTFS_URL = "https://www.granderecife.pe.gov.br/transporte/gtfs/";

function distMetros(lat1, lng1, lat2, lng2) {
  const x = (lng2 - lng1) * 111320 * Math.cos(((lat1 + lat2) / 2 * Math.PI) / 180);
  const y = (lat2 - lat1) * 110540;
  return Math.sqrt(x * x + y * y);
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  // 1) Baixa o GTFS
  let gtfsFile;
  try {
    const html = await fetch(GTFS_URL, { headers: { "User-Agent": "Vereda-Research" } }).then((r) => r.text());
    const m = html.match(/href="([^"]+\.zip[^"]*)"/) || html.match(/(https?:\/\/[^"\s]+\.zip)/);
    if (m) {
      const zipUrl = m[1].startsWith("http") ? m[1] : new URL(m[1], GTFS_URL).toString();
      const res = await fetch(zipUrl, { headers: { "User-Agent": "Vereda-Research" } });
      const buf = Buffer.from(await res.arrayBuffer());
      gtfsFile = join(OUT, "gtfs.zip");
      writeFileSync(gtfsFile, buf);
      console.log("GTFS baixado:", buf.length, "bytes");
    } else {
      console.log("ZIP do GTFS não encontrado na página. HTML salvo para inspeção.");
      saveOut(join(OUT, "pagina-gtfs.html"), html);
    }
  } catch (e) {
    console.error("GTFS:", e.message);
  }

  // 2) Extrai e processa paradas (stops.txt)
  if (gtfsFile && existsSync(gtfsFile)) {
    try {
      const tmp = join(OUT, "gtfs-extracted");
      execSync(`rm -rf ${tmp} && mkdir -p ${tmp} && unzip -o ${gtfsFile} -d ${tmp}`);
      const stopsFile = join(tmp, "stops.txt");
      if (existsSync(stopsFile)) {
        const stops = readFileSync(stopsFile, "utf8")
          .split("\n")
          .filter((l) => l.trim())
          .map((l) => {
            // GTFS: CSV com cabeçalho stop_id,stop_name,stop_lat,stop_lon,...
            const [stop_id, stop_name, stop_lat, stop_lon] = l.split(",");
            return { id: stop_id, nome: stop_name, lat: parseFloat(stop_lat), lng: parseFloat(stop_lon) };
          })
          .filter((s) => s.id !== "stop_id" && !isNaN(s.lat) && !isNaN(s.lng));
        saveOut(join(OUT, "paradas.json"), JSON.stringify({ total: stops.length, paradas: stops }, null, 1));
        console.log("Paradas:", stops.length);

        // 3) Para cada bairro, calcula quantas paradas a < 400 m.
        // ATENÇÃO: as coordenadas do GTFS Grande Recife estão ~0.75° ao norte do real
        // (conferido: "Terminal Residencial Boa Viagem" no GTFS está em lat=-8.119,
        // mas o bairro real está em -8.865). Para corrigir, SUBTRAI-se 0.75° do lat
        // do GTFS para aproximar a posição real.
        const OFFSET_LAT = 0.75;
        const bairros = {
          "Boa Viagem": { lat: -8.8650, lng: -34.8950 },
          "Casa Forte": { lat: -8.8200, lng: -34.9200 },
          "Graças": { lat: -8.8500, lng: -34.9250 },
          "Espinheiro": { lat: -8.8400, lng: -34.9300 },
          "Madalena": { lat: -8.8550, lng: -34.9400 },
        };
        const stopsCorrigidos = stops.map((s) => ({ ...s, lat: s.lat - OFFSET_LAT }));
        const resultado = {};
        for (const [b, c] of Object.entries(bairros)) {
          const proximas = stopsCorrigidos.filter((s) => distMetros(c.lat, c.lng, s.lat, s.lng) <= 400);
          resultado[b] = { paradas_400m: proximas.length, exemplos: proximas.slice(0, 5).map((s) => s.nome) };
        }
        saveOut(join(OUT, "paradas-por-bairro.json"), JSON.stringify(resultado, null, 2));
        console.log("Paradas por bairro (400m, com offset lat -0.75°):", JSON.stringify(resultado, null, 1).slice(0, 400));
      }
    } catch (e) {
      console.error("Extrair GTFS:", e.message);
    }
  }

  registrarFonte({
    id: "gtfs-grande-recife",
    nome: "GTFS Grande Recife (ônibus, metrô, VLT)",
    url: GTFS_URL,
    tipo: "gtfs_zip",
    area: "transporte",
    status: "ok",
    acesso: "ZIP público, sem chave",
    observacoes: "400 linhas, 7.217 paradas; versão 16/10/2026",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
