import type { EpistemicTag } from "../../../nucleo/contratosCanonicos";

/**
 * IND-05 — Motor Hidro-Topográfico 1 m, Agrupamento ST-DBSCAN de Eventos 156,
 * Maré Astronômica Composta (DHN/REMO Porto do Recife), Auditoria de Macro/Microdrenagem e Beltrán Hedônico.
 */

export type ChamadoAlagamento156 = {
  id: string;
  lon: number;
  lat: number;
  timestampMs: number;
  bairro?: string | null;
  logradouro?: string | null;
};

export type EventoAlagamentoCluster = {
  clusterId: string;
  centroLon: number;
  centroLat: number;
  inicioUtc: string;
  fimUtc: string;
  chamadosAgrupados: number;
  idChamados: string[];
};

export type PulsoChuvaCop = {
  dataHoraUtc: string;
  acumulado3hMm: number;
};

export type LeituraMareRemo = {
  hora: string;
  altura_m: number;
  tipo: "PM" | "BM" | null;
};

export type EntradaHidroMare1m = {
  handM: number | null; // Height Above Nearest Drainage (1 m PE3D)
  areaDrenadaM2: number | null; // a (Specific catchment area por largura de contorno)
  declividadeTangente: number | null; // tan(beta) >= 0.001
  cotaTerrenoM?: number | null;
  cotaViaM?: number | null;
  emPoligonalAlagamento2026?: boolean;
  chamados156NoRaio?: ChamadoAlagamento156[];
  pulsosChuvaProximos?: PulsoChuvaCop[];
  leiturasMareDia?: LeituraMareRemo[];
  statusLimpezaMacrodrenagem?: string | null; // ex.: "NÃO FOI LIMPO", "EXECUTADO"
  probabilidadeAnualHistorica?: number | null; // ex.: 0.01 (1%/ano -> ~26% em 30 anos)
  precoImovelReais?: number | null;
};

export type ResultadoHidroMare1m = {
  indicadorId: "IND-05";
  handM: number | null;
  twi: number | null;
  deltaZMeioFioM: number | null;
  clusters156: EventoAlagamentoCluster[];
  eventosDistintosAgrupados: number;
  eventoCompostoChuvaMareCritica: boolean;
  mareMaximaDiaM: number | null;
  alertaDrenagemNaoLimpa: boolean;
  riscoAcumulado30AnosPct: number | null;
  intervaloHedonicoBeltranPct: [number, number] | null;
  faixaImpactoBeltranReais: [number, number] | null;
  classificacaoExposicao: "critica_lote_baixo" | "atencao_via_entorno" | "baixa_cota_protegida" | "nao_sabemos";
  epistemicTag: EpistemicTag;
  limiteEpistemologico: string;
};

function distMetrosAprox(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const rad = Math.PI / 180;
  const x = (lon2 - lon1) * rad * Math.cos(((lat1 + lat2) / 2) * rad);
  const y = (lat2 - lat1) * rad;
  return Math.hypot(x, y) * 6_371_000;
}

/**
 * Algoritmo ST-DBSCAN determinístico para agrupar enxurradas de múltiplos protocolos 156
 * referentes à mesma chuva/evento sem inflar a contagem.
 */
export function agruparChamados156StDbscan(
  chamados: readonly ChamadoAlagamento156[],
  opts: { epsEspacialM?: number; epsTemporalHoras?: number; minPts?: number } = {},
): EventoAlagamentoCluster[] {
  const epsM = opts.epsEspacialM ?? 150;
  const epsMs = (opts.epsTemporalHoras ?? 6) * 3_600_000;
  const minPts = opts.minPts ?? 1;

  const ord = [...chamados].sort((a, b) => a.timestampMs - b.timestampMs || a.id.localeCompare(b.id));
  const visitado = new Array<boolean>(ord.length).fill(false);
  const clusters: EventoAlagamentoCluster[] = [];

  for (let i = 0; i < ord.length; i += 1) {
    if (visitado[i]) continue;
    visitado[i] = true;

    const fila: number[] = [i];
    const membros: number[] = [i];

    for (let head = 0; head < fila.length; head += 1) {
      const idx = fila[head]!;
      const p = ord[idx]!;
      for (let j = 0; j < ord.length; j += 1) {
        if (visitado[j]) continue;
        const q = ord[j]!;
        if (Math.abs(p.timestampMs - q.timestampMs) > epsMs) continue;
        if (distMetrosAprox(p.lon, p.lat, q.lon, q.lat) <= epsM) {
          visitado[j] = true;
          fila.push(j);
          membros.push(j);
        }
      }
    }

    if (membros.length < minPts) continue;
    const pts = membros.map((m) => ord[m]!);
    const minTs = Math.min(...pts.map((p) => p.timestampMs));
    const maxTs = Math.max(...pts.map((p) => p.timestampMs));
    const cLon = pts.reduce((s, p) => s + p.lon, 0) / pts.length;
    const cLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;

    clusters.push({
      clusterId: `ev156-${clusters.length + 1}`,
      centroLon: Math.round(cLon * 1e6) / 1e6,
      centroLat: Math.round(cLat * 1e6) / 1e6,
      inicioUtc: new Date(minTs).toISOString(),
      fimUtc: new Date(maxTs).toISOString(),
      chamadosAgrupados: pts.length,
      idChamados: pts.map((p) => p.id),
    });
  }

  return clusters;
}

export function calcularRiscoAcumulado30AnosPct(probAnual: number): number {
  const p = Math.max(0, Math.min(1, probAnual));
  return Math.round((1 - Math.pow(1 - p, 30)) * 1000) / 10;
}

export function avaliarHidroMare1m(entrada: EntradaHidroMare1m): ResultadoHidroMare1m {
  const twi =
    typeof entrada.areaDrenadaM2 === "number" &&
    entrada.areaDrenadaM2 > 0 &&
    typeof entrada.declividadeTangente === "number" &&
    entrada.declividadeTangente > 0
      ? Math.round(Math.log(entrada.areaDrenadaM2 / Math.max(0.001, entrada.declividadeTangente)) * 100) / 100
      : null;

  const deltaZ =
    typeof entrada.cotaTerrenoM === "number" && typeof entrada.cotaViaM === "number"
      ? Math.round((entrada.cotaTerrenoM - entrada.cotaViaM) * 100) / 100
      : null;

  const clusters = agruparChamados156StDbscan(entrada.chamados156NoRaio ?? []);

  let mareMax: number | null = null;
  for (const l of entrada.leiturasMareDia ?? []) {
    if (mareMax === null || l.altura_m > mareMax) mareMax = l.altura_m;
  }
  const temChuvaForte = (entrada.pulsosChuvaProximos ?? []).some((p) => p.acumulado3hMm >= 30);
  const temMareAlta = mareMax !== null && mareMax >= 1.2;
  const compostoCritico = temChuvaForte && temMareAlta;

  const statusLimp = (entrada.statusLimpezaMacrodrenagem ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const alertaNaoLimpo = /NAO FOI LIMP/.test(statusLimp);

  const probAnual = entrada.probabilidadeAnualHistorica ?? null;
  const risco30 = probAnual !== null ? calcularRiscoAcumulado30AnosPct(probAnual) : null;

  let exposicao: ResultadoHidroMare1m["classificacaoExposicao"] = "nao_sabemos";
  if (entrada.handM !== null) {
    if (entrada.handM <= 1.2 || (entrada.emPoligonalAlagamento2026 && (deltaZ === null || deltaZ <= 0.15))) {
      exposicao = "critica_lote_baixo";
    } else if (entrada.emPoligonalAlagamento2026 || clusters.length > 0 || alertaNaoLimpo) {
      exposicao = "atencao_via_entorno";
    } else {
      exposicao = "baixa_cota_protegida";
    }
  } else if (entrada.emPoligonalAlagamento2026 || clusters.length > 0) {
    exposicao = "atencao_via_entorno";
  }

  // Beltrán et al. (desconto de preço por risco de inundação): -4,6% a -24,9%
  const intervaloBeltran: [number, number] | null =
    exposicao === "critica_lote_baixo"
      ? [-24.9, -10.5]
      : exposicao === "atencao_via_entorno"
        ? [-9.8, -4.6]
        : null;

  const impactoReais: [number, number] | null =
    intervaloBeltran && typeof entrada.precoImovelReais === "number" && entrada.precoImovelReais > 0
      ? [
          Math.round((entrada.precoImovelReais * intervaloBeltran[0]) / 100),
          Math.round((entrada.precoImovelReais * intervaloBeltran[1]) / 100),
        ]
      : null;

  const epistemicTag: EpistemicTag =
    entrada.handM !== null || entrada.emPoligonalAlagamento2026 || clusters.length > 0
      ? entrada.handM !== null
        ? "inferencia"
        : "registro_oficial"
      : "nao_sabemos";

  return {
    indicadorId: "IND-05",
    handM: entrada.handM,
    twi,
    deltaZMeioFioM: deltaZ,
    clusters156: clusters,
    eventosDistintosAgrupados: clusters.length,
    eventoCompostoChuvaMareCritica: compostoCritico,
    mareMaximaDiaM: mareMax,
    alertaDrenagemNaoLimpa: alertaNaoLimpo,
    riscoAcumulado30AnosPct: risco30,
    intervaloHedonicoBeltranPct: intervaloBeltran,
    faixaImpactoBeltranReais: impactoReais,
    classificacaoExposicao: exposicao,
    epistemicTag,
    limiteEpistemologico:
      "Índice topográfico (HAND/TWI 1 m PE3D), tábua de marés e 156 não substituem checagem de nível de garagem, bombas de recalque e comportas no prédio.",
  };
}
