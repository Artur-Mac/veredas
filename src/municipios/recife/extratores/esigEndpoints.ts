import type { SourceSnapshot } from "../../../nucleo/contratosCanonicos";

/**
 * Catálogo e paginador determinístico (OBJECTID > cursor) dos endpoints ArcGIS REST do ESIG Recife e CEMADEN.
 * Mantém zero imports runtime extensionless para execução direta sob Node ESM (`--experimental-strip-types`) e Jest/TSC.
 */

export type ConfigEndpointEsig = {
  slug: string;
  urlLayer: string;
  maxRecordCount: number;
  outFields: readonly string[];
  license: SourceSnapshot["license"];
  escalaReferencia: string;
};

export const ESIG_ENDPOINTS: Record<string, ConfigEndpointEsig> = {
  lotes_financas: {
    slug: "esig_lotes_financas",
    urlLayer: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento/BASES_LOTES_EDIFICACAO_BAIRRO/MapServer/1",
    maxRecordCount: 2000,
    outFields: ["OBJECTID", "DSQFL", "NMEDIFICACAO", "QTDPAVIMENTOS", "NMENDCOMP"],
    license: "ODbL",
    escalaReferencia: "1:500",
  },
  edificacao_3d: {
    slug: "esig_edificacao_3d",
    urlLayer: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento/BASES_LOTES_EDIFICACAO_BAIRRO/MapServer/3",
    maxRecordCount: 2000,
    outFields: ["OBJECTID", "DSQFL", "ALTURA", "QTDPAVIMENTOS"],
    license: "ODbL",
    escalaReferencia: "1:500",
  },
  lpuos_2025: {
    slug: "esig_lpuos_2025",
    urlLayer: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/ZoneamentoRecife/BASES_ANALISES_LOTES_LPUOS/MapServer/0",
    maxRecordCount: 2000,
    outFields: ["OBJECTID", "DSQFL", "ZONA", "VLCOEFMAX", "IEP", "ZEPH"],
    license: "ODbL",
    escalaReferencia: "1:1000",
  },
  zoneamento_ipav: {
    slug: "esig_pd2020_ipav",
    urlLayer: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento/BASES_ZONEAMENTO_G_PD2020/MapServer/4",
    maxRecordCount: 2000,
    outFields: ["OBJECTID", "DSQFL", "IPAV", "TIPO"],
    license: "ODbL",
    escalaReferencia: "1:1000",
  },
  zoneamento_ucn: {
    slug: "esig_pd2020_ucn",
    urlLayer: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento/BASES_ZONEAMENTO_G_PD2020/MapServer/5",
    maxRecordCount: 2000,
    outFields: ["OBJECTID", "NOME", "CATEGORIA"],
    license: "ODbL",
    escalaReferencia: "1:1000",
  },
  microdrenagem_elementos: {
    slug: "esig_microdrenagem_mi_elementos",
    urlLayer: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Emlurb/BASES_DRENAGEM_RECIFE_MI/MapServer/0",
    maxRecordCount: 8000,
    outFields: ["OBJECTID", "TIPO", "SUBBACIA"],
    license: "ODbL",
    escalaReferencia: "1:500",
  },
  microdrenagem_rede: {
    slug: "esig_microdrenagem_mi_rede",
    urlLayer: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Emlurb/BASES_DRENAGEM_RECIFE_MI/MapServer/1",
    maxRecordCount: 8000,
    outFields: ["OBJECTID", "DIAMETRO", "MATERIAL", "BACIA"],
    license: "ODbL",
    escalaReferencia: "1:500",
  },
  microdrenagem_canaleta: {
    slug: "esig_microdrenagem_mi_canaleta",
    urlLayer: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Emlurb/BASES_DRENAGEM_RECIFE_MI/MapServer/2",
    maxRecordCount: 8000,
    outFields: ["OBJECTID", "LARGURA", "BACIA"],
    license: "ODbL",
    escalaReferencia: "1:500",
  },
  cemaden_geotecnicas: {
    slug: "cemaden_estacoes_geotecnicas",
    urlLayer: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/CEMADEN/BASE_CEMADEN_ESTACOES_GEOTECNICAS/FeatureServer/0",
    maxRecordCount: 2000,
    outFields: ["OBJECTID", "NOME", "CODIGO", "BAIRRO"],
    license: "ODbL",
    escalaReferencia: "1:1000",
  },
};

export type FeicaoArcGis31985 = {
  objectId: number;
  attributes: Record<string, unknown>;
  geometry?: {
    x?: number;
    y?: number;
    rings?: [number, number][][];
    paths?: [number, number][][];
  } | null;
};

export type RespostaArcGisQuery = {
  features?: {
    attributes?: Record<string, unknown>;
    geometry?: FeicaoArcGis31985["geometry"];
  }[];
  exceededTransferLimit?: boolean;
  error?: { code?: number; message?: string };
};

export type TransportHttpArcGis = (url: string) => Promise<{
  status: number;
  headers?: { get(name: string): string | null };
  json(): Promise<RespostaArcGisQuery>;
}>;

export function construirUrlPaginadaEsig(
  config: ConfigEndpointEsig,
  cursorObjectId: number,
  outSR = 31985,
): string {
  const params = new URLSearchParams({
    where: `OBJECTID > ${Math.max(0, Math.floor(cursorObjectId))}`,
    orderByFields: "OBJECTID ASC",
    outFields: config.outFields.join(","),
    outSR: String(outSR),
    resultRecordCount: String(config.maxRecordCount),
    returnGeometry: "true",
    f: "json",
  });
  return `${config.urlLayer}/query?${params.toString()}`;
}

export async function extrairCamadaEsigPaginadaBruta(
  config: ConfigEndpointEsig,
  fetchPage: TransportHttpArcGis,
  opts: { sha256Computado?: string; vintage?: string; maxPaginas?: number; aguardarMs?: (ms: number) => Promise<void> } = {},
): Promise<{ feicoes: FeicaoArcGis31985[]; paginasLidas: number; snapshot: SourceSnapshot }> {
  const maxPaginas = opts.maxPaginas ?? 500;
  const aguardar = opts.aguardarMs ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const feicoes: FeicaoArcGis31985[] = [];
  const idsVistos = new Set<number>();

  let cursor = 0;
  let paginasLidas = 0;

  while (paginasLidas < maxPaginas) {
    const url = construirUrlPaginadaEsig(config, cursor, 31985);
    let resp: RespostaArcGisQuery | null = null;

    for (let tentativa = 0; tentativa < 3; tentativa += 1) {
      const r = await fetchPage(url);
      if (r.status === 429 || r.status >= 500) {
        const ra = Number(r.headers?.get("retry-after") ?? "1");
        const delayMs = Number.isFinite(ra) && ra > 0 ? Math.min(30_000, ra * 1000) : 250 * 2 ** tentativa;
        if (tentativa < 2) {
          await aguardar(delayMs);
          continue;
        }
        throw new Error(`ESIG ${config.slug}: HTTP ${r.status}`);
      }
      resp = await r.json();
      break;
    }

    if (!resp) throw new Error(`ESIG ${config.slug}: resposta nula.`);
    if (resp.error) throw new Error(`ESIG ${config.slug}: ${resp.error.message ?? resp.error.code}`);

    const lote = resp.features ?? [];
    paginasLidas += 1;
    if (lote.length === 0) break;

    let ultimoId = cursor;
    for (const f of lote) {
      const oid = Number(f.attributes?.OBJECTID);
      if (!Number.isFinite(oid) || idsVistos.has(oid)) continue;
      idsVistos.add(oid);
      feicoes.push({ objectId: oid, attributes: f.attributes ?? {}, geometry: f.geometry ?? null });
      if (oid > ultimoId) ultimoId = oid;
    }

    if (ultimoId <= cursor) break;
    cursor = ultimoId;
    if (!resp.exceededTransferLimit && lote.length < config.maxRecordCount) break;
  }

  const snapshot: SourceSnapshot = {
    snapshot_id: `${config.slug}-${(opts.vintage ?? "2026-11-17").replace(/-/g, "")}`,
    source_slug: config.slug,
    uri_origem: config.urlLayer,
    fetched_at_utc: new Date().toISOString(),
    reference_vintage: opts.vintage ?? "2026-11-17",
    license: config.license,
    sha256_raw: opts.sha256Computado ?? "0".repeat(64),
    row_count: feicoes.length,
    schema_version: "1.0.0",
  };

  return { feicoes, paginasLidas, snapshot };
}
