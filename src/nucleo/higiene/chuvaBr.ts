import type { EpistemicTag } from "../contratosCanonicos";

const TRES_HORAS_MS = 3 * 60 * 60 * 1000;

export type TimestampBrt = {
  utcIso: string;
  brtIso: string;
  epochUtcMs: number;
};

/**
 * Converte data/hora UTC publicada por APAC/CEMADEN para BRT (`America/Recife`, UTC-3):
 * `DATAHORA_BRT = DATAHORA_UTC - 3h`.
 * Tolera strings duplicadas do serviço APAC (ex.: `"2026-11-15 11:20:00 11:20:00"`).
 * Rejeita sentinelas como `1900-01-01` retornando `null`.
 */
export function converterUtcParaBrt(valor: string | number | null | undefined): TimestampBrt | null {
  if (valor === null || valor === undefined) return null;
  let epochUtcMs: number;

  if (typeof valor === "number") {
    if (!Number.isFinite(valor) || valor <= 0) return null;
    epochUtcMs = valor;
  } else {
    const bruto = String(valor).trim();
    if (!bruto) return null;

    // Caso 1: "YYYY-MM-DD HH:MM:SS" (eventualmente com hora repetida "HH:MM:SS HH:MM:SS")
    const mIsoEspaco = /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})(?:\s+\d{2}:\d{2}:\d{2})?(Z|[+-]\d{2}:?\d{2})?$/i.exec(bruto);
    if (mIsoEspaco) {
      const dataParte = mIsoEspaco[1]!;
      const horaParte = mIsoEspaco[2]!;
      const tzParte = mIsoEspaco[3];
      if (dataParte <= "1970-01-01") return null;
      const isoParse = tzParte ? `${dataParte}T${horaParte}${tzParte}` : `${dataParte}T${horaParte}Z`;
      epochUtcMs = Date.parse(isoParse);
    } else {
      // Caso 2: "DD/MM/YYYY HH:MM:SS"
      const mBr = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/.exec(bruto);
      if (mBr) {
        const [, dd, mm, yyyy, hhmmss] = mBr;
        if (Number(yyyy) <= 1970) return null;
        epochUtcMs = Date.parse(`${yyyy}-${mm}-${dd}T${hhmmss}Z`);
      } else {
        epochUtcMs = Date.parse(bruto);
        if (!Number.isFinite(epochUtcMs) || epochUtcMs <= 0) return null;
      }
    }
  }

  if (!Number.isFinite(epochUtcMs) || epochUtcMs <= 0) return null;

  const utcDate = new Date(epochUtcMs);
  if (utcDate.getUTCFullYear() <= 1970) return null;

  // Subtração explícita de 3 horas para compor o carimbo local BRT (-03:00)
  const brtDate = new Date(epochUtcMs - TRES_HORAS_MS);
  const brtIso = `${brtDate.toISOString().slice(0, 19)}-03:00`;
  return {
    utcIso: utcDate.toISOString().slice(0, 19) + "Z",
    brtIso,
    epochUtcMs,
  };
}

/**
 * Leituras negativas (ex.: `-1` no serviço APAC/CEMADEN) indicam falha de telemetria
 * ou sensor sem leitura, nunca `0 mm`.
 */
export function sanitizarLeituraPluviometrica(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = typeof valor === "number" ? valor : Number(String(valor).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1000) / 1000;
}

export type EstacaoPluviometricaHigienizada = {
  objectId: number | null;
  codigoGmmc: string;
  nome: string;
  bacia: string | null;
  coordenada: [number, number] | null;
  leituraUtc: string | null;
  leituraBrt: string | null;
  acumuladosMm: {
    h1: number | null;
    h3: number | null;
    h6: number | null;
    h12: number | null;
    h24: number | null;
    h48: number | null;
    h72: number | null;
  };
  epistemicTag: EpistemicTag;
  motivoQuarentena: string | null;
};

export type ResultadoHigieneApac = {
  estacoes: EstacaoPluviometricaHigienizada[];
  totalLidas: number;
  validas: number;
  quarentenadas: number;
  leiturasNegativasRemovidas: number;
};

type FeicaoApacBruta = {
  id?: number;
  geometry?: { coordinates?: [number, number] } | null;
  properties?: Record<string, unknown>;
};

export function higienizarApacGeojson(geojson: { features?: FeicaoApacBruta[] }): ResultadoHigieneApac {
  const features = geojson.features ?? [];
  const estacoes: EstacaoPluviometricaHigienizada[] = [];
  let validas = 0;
  let quarentenadas = 0;
  let leiturasNegativasRemovidas = 0;

  for (const f of features) {
    const p = f.properties ?? {};
    const brutoData =
      typeof p.ultima_leitura_data_hora === "string"
        ? p.ultima_leitura_data_hora
        : typeof p.ultima_leitura === "string" && typeof p.ultima_leitura_hora === "string"
          ? `${p.ultima_leitura} ${p.ultima_leitura_hora}`
          : null;

    const ts = converterUtcParaBrt(brutoData);

    const campos = ["hora_1", "horas_3", "horas_6", "horas_12", "horas_24", "horas_48", "horas_72"] as const;
    for (const c of campos) {
      const v = p[c];
      if (typeof v === "number" && v < 0) leiturasNegativasRemovidas += 1;
    }

    const acumuladosMm = {
      h1: sanitizarLeituraPluviometrica(p.hora_1),
      h3: sanitizarLeituraPluviometrica(p.horas_3),
      h6: sanitizarLeituraPluviometrica(p.horas_6),
      h12: sanitizarLeituraPluviometrica(p.horas_12),
      h24: sanitizarLeituraPluviometrica(p.horas_24),
      h48: sanitizarLeituraPluviometrica(p.horas_48),
      h72: sanitizarLeituraPluviometrica(p.horas_72),
    };

    const todasNulas = Object.values(acumuladosMm).every((v) => v === null);
    let motivoQuarentena: string | null = null;
    if (!ts) motivoQuarentena = "timestamp_sentinela_ou_ausente";
    else if (todasNulas) motivoQuarentena = "todas_leituras_negativas_ou_nulas";

    const epistemicTag: EpistemicTag = motivoQuarentena ? "nao_sabemos" : "registro_oficial";
    if (motivoQuarentena) quarentenadas += 1;
    else validas += 1;

    const coords = f.geometry?.coordinates;
    const coordenada: [number, number] | null =
      Array.isArray(coords) && coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1])
        ? [Number(coords[0].toFixed(6)), Number(coords[1].toFixed(6))]
        : null;

    estacoes.push({
      objectId: typeof p.objectid === "number" ? p.objectid : typeof f.id === "number" ? f.id : null,
      codigoGmmc: String(p.codigo_gmmc ?? "").trim(),
      nome: String(p.nome ?? "Estação sem nome").trim(),
      bacia: typeof p.bacia === "string" ? p.bacia.trim() : null,
      coordenada,
      leituraUtc: ts?.utcIso ?? null,
      leituraBrt: ts?.brtIso ?? null,
      acumuladosMm,
      epistemicTag,
      motivoQuarentena,
    });
  }

  return {
    estacoes,
    totalLidas: features.length,
    validas,
    quarentenadas,
    leiturasNegativasRemovidas,
  };
}

export type PulsoCopBruto = {
  OBJECTID?: number;
  CODESTACAO?: string;
  LATITUDE?: number;
  LONGITUDE?: number;
  NOME?: string;
  CHUVA?: number;
  IDUNICO?: string;
  DATAHORA?: number;
};

export type PulsoCopCorrigido = {
  objectId: number | null;
  codEstacao: string;
  nome: string;
  coordenada: [number, number] | null;
  chuvaMm: number | null;
  leituraUtc: string | null;
  leituraBrt: string | null;
  desvioCorrigido3h: boolean;
  epistemicTag: EpistemicTag;
};

/**
 * Corrige pulsos COP/ESIG onde `DATAHORA` foi exportado com deslocamento de -3h frente ao epoch UTC
 * registrado no sufixo de `IDUNICO` (7.807 de 7.808 linhas no snapshot de 14/11/2026).
 */
export function corrigirPulsoCopParaBrt(pulso: PulsoCopBruto): PulsoCopCorrigido {
  const mId = /_(\d{13})$/.exec(String(pulso.IDUNICO ?? ""));
  const idMs = mId ? Number(mId[1]) : null;
  const dhMs = typeof pulso.DATAHORA === "number" && Number.isFinite(pulso.DATAHORA) ? pulso.DATAHORA : null;

  let utcMs: number | null = dhMs;
  let desvioCorrigido3h = false;

  if (idMs !== null && dhMs !== null && Math.abs(idMs - dhMs - TRES_HORAS_MS) <= 60_000) {
    // O sufixo do IDUNICO traz o instante UTC real; DATAHORA já havia sofrido subtração na serialização Esri.
    utcMs = idMs;
    desvioCorrigido3h = true;
  }

  const ts = converterUtcParaBrt(utcMs);
  const chuvaMm = sanitizarLeituraPluviometrica(pulso.CHUVA);
  const coord: [number, number] | null =
    typeof pulso.LONGITUDE === "number" && typeof pulso.LATITUDE === "number"
      ? [Number(pulso.LONGITUDE.toFixed(6)), Number(pulso.LATITUDE.toFixed(6))]
      : null;

  return {
    objectId: typeof pulso.OBJECTID === "number" ? pulso.OBJECTID : null,
    codEstacao: String(pulso.CODESTACAO ?? "").trim(),
    nome: String(pulso.NOME ?? "").trim(),
    coordenada: coord,
    chuvaMm,
    leituraUtc: ts?.utcIso ?? null,
    leituraBrt: ts?.brtIso ?? null,
    desvioCorrigido3h,
    epistemicTag: ts && chuvaMm !== null ? "registro_oficial" : "nao_sabemos",
  };
}
