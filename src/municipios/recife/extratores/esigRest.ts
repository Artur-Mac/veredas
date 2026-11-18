import { esquemaSourceSnapshot, type SourceSnapshot } from "../../../nucleo/contratosCanonicos";
import {
  areaPoligonoM2,
  poligonosInterceptamEm31985,
  reprojetarAnelPara4326,
  type PontoUtm,
} from "../../../nucleo/geo/sirgas31985";
import {
  construirUrlPaginadaEsig,
  ESIG_ENDPOINTS,
  extrairCamadaEsigPaginadaBruta,
  type ConfigEndpointEsig,
  type FeicaoArcGis31985,
  type RespostaArcGisQuery,
  type TransportHttpArcGis,
} from "./esigEndpoints";

export { construirUrlPaginadaEsig, ESIG_ENDPOINTS };
export type { ConfigEndpointEsig, FeicaoArcGis31985, RespostaArcGisQuery, TransportHttpArcGis };

/**
 * Extrai deterministicamente todas as feições paginando por `OBJECTID > cursor` em ordem ascendente,
 * validando o `SourceSnapshot` via contrato canónico e respeitando `MaxRecordCount` e `Retry-After`.
 */
export async function extrairCamadaEsigPaginada(
  config: ConfigEndpointEsig,
  fetchPage: TransportHttpArcGis,
  opts: { sha256Computado?: string; vintage?: string; maxPaginas?: number; aguardarMs?: (ms: number) => Promise<void> } = {},
): Promise<{ feicoes: FeicaoArcGis31985[]; paginasLidas: number; snapshot: SourceSnapshot }> {
  const bruto = await extrairCamadaEsigPaginadaBruta(config, fetchPage, opts);
  return {
    ...bruto,
    snapshot: esquemaSourceSnapshot.parse(bruto.snapshot),
  };
}

export type PoligonoMetrico = {
  id: string;
  anel31985: readonly PontoUtm[];
  propriedades?: Record<string, unknown>;
};

export type ResultadoCruzamentoLote31985 = {
  dsqfl: string;
  areaTerreno31985M2: number;
  emSpuMarinha: boolean;
  zonasLpuos: string[];
  vlCoefMax: number | null;
  protegidoIepZephIpav: boolean;
  lotesVizinhos100mIds: string[];
  anelWgs84: [number, number][];
};

/**
 * Executa as interseções topológicas de um lote DSQFL inteiramente em EPSG:31985 (metros)
 * e reprojeta o polígono resultante para WGS84 (EPSG:4326) somente na publicação.
 */
export function cruzarLoteEm31985(
  lote: PoligonoMetrico,
  camadas: {
    poligonosSpu: readonly PoligonoMetrico[];
    poligonosLpuos: readonly PoligonoMetrico[];
    poligonosIpav: readonly PoligonoMetrico[];
    lotesProximos: readonly PoligonoMetrico[];
  },
): ResultadoCruzamentoLote31985 {
  const emSpuMarinha = camadas.poligonosSpu.some((s) =>
    poligonosInterceptamEm31985(lote.anel31985, s.anel31985, 0),
  );

  const zonasLpuos: string[] = [];
  let vlCoefMax: number | null = null;
  let protegido = false;

  for (const z of camadas.poligonosLpuos) {
    if (!poligonosInterceptamEm31985(lote.anel31985, z.anel31985, 0)) continue;
    const nomeZona = String(z.propriedades?.ZONA ?? z.id);
    if (!zonasLpuos.includes(nomeZona)) zonasLpuos.push(nomeZona);
    const coef = Number(z.propriedades?.VLCOEFMAX);
    if (Number.isFinite(coef)) vlCoefMax = vlCoefMax === null ? coef : Math.max(vlCoefMax, coef);
    if (z.propriedades?.IEP || z.propriedades?.ZEPH) protegido = true;
  }

  for (const ipav of camadas.poligonosIpav) {
    if (poligonosInterceptamEm31985(lote.anel31985, ipav.anel31985, 0)) {
      protegido = true;
      break;
    }
  }

  const lotesVizinhos100mIds = camadas.lotesProximos
    .filter((v) => v.id !== lote.id && poligonosInterceptamEm31985(lote.anel31985, v.anel31985, 100))
    .map((v) => v.id);

  return {
    dsqfl: lote.id,
    areaTerreno31985M2: Math.round(areaPoligonoM2(lote.anel31985) * 100) / 100,
    emSpuMarinha,
    zonasLpuos,
    vlCoefMax,
    protegidoIepZephIpav: protegido,
    lotesVizinhos100mIds,
    anelWgs84: reprojetarAnelPara4326(lote.anel31985),
  };
}

/**
 * Normalização de chaves tabulares entre IPTU (34 cols), ITBI (22 cols), CTTU e ESIG (DSQFL 14 dígitos).
 * Preserva lista branca estrita (sem CPF/CNPJ mascarado).
 */
export type RegistroChavesRecife = {
  dsqfl: string | null;
  codLogradouro: string;
  sequencialIptu: string | null;
  areaTerrenoM2: number | null;
  areaConstruidaM2: number | null;
  valorM2Terreno: number | null;
  fracaoIdeal: number | null;
  tipoEstrutura: string | null;
  fatorObsolescencia: number | null;
  sfh: boolean | null;
};

const parseNumBr = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v === null || v === undefined || v === "") return null;
  let t = String(v).trim();
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function mapearLinhaIptuParaChaves(linha: Record<string, unknown>, dsqfl: string | null): RegistroChavesRecife {
  const cod = String(linha["Código Logradouro"] ?? linha.cod_logradouro ?? "").replace(/\D/g, "");
  const seq = String(linha["Número do contribuinte"] ?? linha.sequencial ?? "").replace(/\D/g, "") || null;
  return {
    dsqfl: dsqfl && /^\d{14}$/.test(dsqfl) ? dsqfl : null,
    codLogradouro: cod,
    sequencialIptu: seq,
    areaTerrenoM2: parseNumBr(linha["AREA TERRENO"]),
    areaConstruidaM2: parseNumBr(linha["AREA CONSTRUIDA"]),
    valorM2Terreno: parseNumBr(linha["valor do m2 do terreno"]),
    fracaoIdeal: parseNumBr(linha["fração ideal"] ?? linha.fracao_ideal),
    tipoEstrutura: typeof linha["Tipo de Estrutura"] === "string" ? linha["Tipo de Estrutura"].trim() : null,
    fatorObsolescencia: parseNumBr(linha["fator de obsolescência"]),
    sfh: null,
  };
}
