import type { EpistemicTag } from "../contratosCanonicos";

/**
 * Street Smart — Roteamento Pedestre, Decaimento Polinomial 400–2.400 m, Permeabilidade Urbana (>120 m quadra),
 * Atrito Real (sombra, luz, calçada) e Calendário GTFS Estrito (incluindo viagens pós-meia-noite > 24:00:00).
 */

export type ServicoComum = {
  id: string;
  categoria: "supermercado" | "farmacia" | "escola_publica" | "posto_saude" | "parque" | "parada_onibus";
  distanciaRedeM: number;
};

export type FatoresRuaPedestre = {
  comprimentoMedioQuadraM: number | null;
  intersecoesPorKm2: number | null;
  coberturaCopaArvoresPct: number | null; // 0..100
  iluminacaoDesativada150mCount: number;
  pctDomiciliosCalcadaAdequada?: number | null; // Censo Entorno (prior)
  semaforosSonorosProximosCount?: number;
  abrigosClimaticosProximosCount?: number;
};

export type EntradaStreetSmart = {
  servicosProximos: ServicoComum[];
  fatoresRua: FatoresRuaPedestre;
};

export type ResultadoStreetSmart = {
  indicadorId: "MOB-SS";
  indiceAcessoAPeSinergico: number; // grandeza interna para comparação ordinal, não exibida como nota mágica 0-100
  penalidadePermeabilidade: number;
  multiplicadorAtritoCaminhada: number;
  servicosAlcancaveis400m: number;
  servicosAlcancaveis1200m: number;
  acessibilidadeAuditivaERefugios: {
    semaforosSonorosCount: number;
    abrigosClimaticosCount: number;
  };
  alertaQuadraLonga: boolean;
  epistemicTag: EpistemicTag;
};

/** Decaimento polinomial suave (Street Smart / Walk Score): 1,0 até 400 m, cai polinomialmente até 0 em 2.400 m. */
export function pesoDecaimentoPolinomial(distanciaM: number): number {
  if (!Number.isFinite(distanciaM) || distanciaM < 0) return 0;
  if (distanciaM <= 400) return 1.0;
  if (distanciaM >= 2400) return 0;
  const x = (distanciaM - 400) / 2000; // 0..1
  const peso = 1 - 3 * x * x + 2 * x * x * x; // Hermite cúbica C^1 suave
  return Math.round(Math.max(0, Math.min(1, peso)) * 10_000) / 10_000;
}

export function avaliarWalkabilityStreetSmart(entrada: EntradaStreetSmart): ResultadoStreetSmart {
  const f = entrada.fatoresRua;

  // Penalidade de permeabilidade para quadras extensas (> 120 m) e baixa densidade de cruzamentos (< 60/km²)
  let penalidadePerm = 1.0;
  const quadraLonga = typeof f.comprimentoMedioQuadraM === "number" && f.comprimentoMedioQuadraM > 120;
  if (quadraLonga) {
    const excesso = Math.min(180, f.comprimentoMedioQuadraM! - 120);
    penalidadePerm -= excesso * 0.0012;
  }
  if (typeof f.intersecoesPorKm2 === "number" && f.intersecoesPorKm2 < 60) {
    penalidadePerm -= ((60 - f.intersecoesPorKm2) / 60) * 0.15;
  }
  penalidadePerm = Math.max(0.65, Math.min(1.0, Math.round(penalidadePerm * 1000) / 1000));

  // Multiplicador de atrito (sombra tropical, luz noturna e qualidade de calçada)
  let multAtrito = 1.0;
  if (typeof f.coberturaCopaArvoresPct === "number") {
    multAtrito += ((f.coberturaCopaArvoresPct - 15) / 100) * 0.12;
  }
  if (f.iluminacaoDesativada150mCount > 0) {
    multAtrito -= Math.min(0.16, f.iluminacaoDesativada150mCount * 0.03);
  }
  if (typeof f.pctDomiciliosCalcadaAdequada === "number") {
    multAtrito += ((f.pctDomiciliosCalcadaAdequada - 50) / 100) * 0.08;
  }
  multAtrito = Math.max(0.7, Math.min(1.15, Math.round(multAtrito * 1000) / 1000));

  const somaBruta = entrada.servicosProximos.reduce((acc, s) => acc + pesoDecaimentoPolinomial(s.distanciaRedeM), 0);
  const indice = Math.round(somaBruta * penalidadePerm * multAtrito * 1000) / 1000;

  return {
    indicadorId: "MOB-SS",
    indiceAcessoAPeSinergico: indice,
    penalidadePermeabilidade: penalidadePerm,
    multiplicadorAtritoCaminhada: multAtrito,
    servicosAlcancaveis400m: entrada.servicosProximos.filter((s) => s.distanciaRedeM <= 400).length,
    servicosAlcancaveis1200m: entrada.servicosProximos.filter((s) => s.distanciaRedeM <= 1200).length,
    acessibilidadeAuditivaERefugios: {
      semaforosSonorosCount: f.semaforosSonorosProximosCount ?? 0,
      abrigosClimaticosCount: f.abrigosClimaticosProximosCount ?? 0,
    },
    alertaQuadraLonga: quadraLonga,
    epistemicTag: "inferencia",
  };
}

// ——— Calendário Estrito GTFS (calendar.txt + calendar_dates.txt + viagens > 24:00:00) ———

export type GtfsCalendarRow = {
  serviceId: string;
  monday: 0 | 1;
  tuesday: 0 | 1;
  wednesday: 0 | 1;
  thursday: 0 | 1;
  friday: 0 | 1;
  saturday: 0 | 1;
  sunday: 0 | 1;
  startDateYyyymmdd: string;
  endDateYyyymmdd: string;
};

export type GtfsCalendarDateException = {
  serviceId: string;
  dateYyyymmdd: string;
  exceptionType: 1 | 2; // 1 = adicionado na data, 2 = removido na data
};

export type GtfsStopTime = {
  serviceId: string;
  tripId: string;
  routeShortName: string;
  departureTimeHms: string; // pode ser >= "24:00:00", ex.: "25:15:00"
};

export function segundosDesdeMeiaNoiteGtfs(hms: string): number {
  const parts = hms.trim().split(":").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`Horário GTFS inválido: ${hms}`);
  }
  return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
}

export function servicosAtivosNaDataGtfs(
  dataYyyymmdd: string,
  calendars: readonly GtfsCalendarRow[],
  exceptions: readonly GtfsCalendarDateException[],
): Set<string> {
  const ano = Number(dataYyyymmdd.slice(0, 4));
  const mes = Number(dataYyyymmdd.slice(4, 6)) - 1;
  const dia = Number(dataYyyymmdd.slice(6, 8));
  const dt = new Date(Date.UTC(ano, mes, dia));
  const dow = dt.getUTCDay(); // 0=Dom..6=Sab

  const chavesDia: (keyof GtfsCalendarRow)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const campoDia = chavesDia[dow]!;
  const ativos = new Set<string>();

  for (const row of calendars) {
    if (dataYyyymmdd >= row.startDateYyyymmdd && dataYyyymmdd <= row.endDateYyyymmdd && row[campoDia] === 1) {
      ativos.add(row.serviceId);
    }
  }

  for (const ex of exceptions) {
    if (ex.dateYyyymmdd !== dataYyyymmdd) continue;
    if (ex.exceptionType === 1) ativos.add(ex.serviceId);
    else if (ex.exceptionType === 2) ativos.delete(ex.serviceId);
  }

  return ativos;
}

export function filtrarPartidasValidasGtfs(opts: {
  dataYyyymmdd: string;
  horaAtualHms: string;
  janelaMinutos: number;
  calendars: readonly GtfsCalendarRow[];
  exceptions: readonly GtfsCalendarDateException[];
  stopTimes: readonly GtfsStopTime[];
  incluirDiaOperacionalAnteriorAposMeiaNoite?: boolean;
}): (GtfsStopTime & { esperaMin: number })[] {
  const ativosHoje = servicosAtivosNaDataGtfs(opts.dataYyyymmdd, opts.calendars, opts.exceptions);
  const agoraSeg = segundosDesdeMeiaNoiteGtfs(opts.horaAtualHms);
  const fimSeg = agoraSeg + opts.janelaMinutos * 60;
  const saida: (GtfsStopTime & { esperaMin: number })[] = [];

  for (const st of opts.stopTimes) {
    const depSeg = segundosDesdeMeiaNoiteGtfs(st.departureTimeHms);
    if (ativosHoje.has(st.serviceId) && depSeg >= agoraSeg && depSeg <= fimSeg) {
      saida.push({ ...st, esperaMin: Math.round(((depSeg - agoraSeg) / 60) * 10) / 10 });
    } else if (
      opts.incluirDiaOperacionalAnteriorAposMeiaNoite &&
      depSeg >= 86_400 &&
      agoraSeg < 14_400 // madrugada entre 00:00 e 04:00
    ) {
      const segNorm = depSeg - 86_400;
      if (segNorm >= agoraSeg && segNorm <= fimSeg) {
        saida.push({ ...st, esperaMin: Math.round(((segNorm - agoraSeg) / 60) * 10) / 10 });
      }
    }
  }

  return saida.sort((a, b) => a.esperaMin - b.esperaMin);
}
