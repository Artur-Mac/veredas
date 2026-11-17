// Snapshot de um feed GTFS arquivado (VE02.02, issue I08 do VE00): versão, validade, contagens e checagens de
// coordenadas, sem gerar camada nenhuma (calendário por data e direção ficam para o VE05). Uma execução usa um feed só.
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { lerCsv, lerZip } from "../rua/nucleo.mjs";
import { ENVELOPE_DO_RECIFE } from "./osm.mjs";

export const ANALISADOR_GTFS = { nome: "gtfs_snapshot", versao: "1" };

const BOM = String.fromCharCode(0xfeff);

function texto(arquivos, nome) {
  const ler = arquivos.get(nome);
  if (!ler) return null;
  const t = ler().toString("utf8");
  return t.startsWith(BOM) ? t.slice(1) : t;
}

/** CSV com cabeçalho → objetos; linhas vazias saem. */
function tabela(t) {
  if (t === null) return [];
  const [cab, ...linhas] = lerCsv(t, ",");
  if (!cab) return [];
  return linhas
    .filter((l) => l.length > 1 || (l[0] ?? "") !== "")
    .map((l) => Object.fromEntries(cab.map((c, i) => [c.trim(), (l[i] ?? "").trim()])));
}

/** Resumo e checagens do feed. `zip`: Buffer do arquivo. Não altera nada; não descompacta stop_times.txt. */
export function resumirFeed(zip) {
  const arquivos = lerZip(zip, inflateRawSync);
  const obrig = ["agency.txt", "stops.txt", "routes.txt", "trips.txt", "stop_times.txt"];
  const faltando = obrig.filter((n) => !arquivos.has(n));
  const info = tabela(texto(arquivos, "feed_info.txt"))[0] ?? {};
  const stops = tabela(texto(arquivos, "stops.txt"));
  const calendar = tabela(texto(arquivos, "calendar.txt"));
  const datas = tabela(texto(arquivos, "calendar_dates.txt"));
  const dentro = (lat, lon) => lat >= ENVELOPE_DO_RECIFE.s && lat <= ENVELOPE_DO_RECIFE.n && lon >= ENVELOPE_DO_RECIFE.w && lon <= ENVELOPE_DO_RECIFE.e;
  let noRecife = 0, comDeslocamento = 0, invalidas = 0;
  for (const s of stops) {
    const lat = Number(s.stop_lat), lon = Number(s.stop_lon);
    if (s.stop_lat === "" || s.stop_lon === "" || !Number.isFinite(lat) || !Number.isFinite(lon)) { invalidas += 1; continue; }
    if (dentro(lat, lon)) noRecife += 1;
    if (dentro(lat - 0.75, lon)) comDeslocamento += 1;
  }
  const checagens = [
    { nome: "arquivos_obrigatorios", ok: faltando.length === 0, detalhe: faltando.length ? `faltam ${faltando.join(", ")}` : "presentes" },
    { nome: "feed_info_com_versao", ok: Boolean(info.feed_version), detalhe: info.feed_version || "sem feed_version" },
    { nome: "paradas_no_recife_com_coordenada_original", ok: noRecife > 0, detalhe: `${noRecife} de ${stops.length}` },
    { nome: "deslocamento_de_-0,75_rejeitado", ok: comDeslocamento === 0, detalhe: `${comDeslocamento} paradas no Recife se a latitude fosse deslocada` },
    { nome: "calendar_dates_presente", ok: datas.length > 0, detalhe: `${datas.length} exceções de calendário` },
  ];
  return {
    versao: info.feed_version || null, inicio: info.feed_start_date || null, fim: info.feed_end_date || null,
    contagens: { paradas: stops.length, paradasNoRecife: noRecife, coordenadasInvalidas: invalidas, servicos: calendar.length, excecoes: datas.length },
    checagens,
    sha256: createHash("sha256").update(zip).digest("hex"),
    bytes: zip.length,
  };
}
