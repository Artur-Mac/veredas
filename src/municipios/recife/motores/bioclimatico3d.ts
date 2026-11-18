import type { EpistemicTag } from "../../../nucleo/contratosCanonicos";

/**
 * IND-03 & #38 — Motor Bioclimático 3D Tropical e Radar de Perda de Vista (Recife, 8,05° S).
 * - Horizonte Solar compacto de 108 bytes (`Uint8Array(108)`): 36 setores azimutais (10° cada) × 3 faixas de andar (Baixo, Médio, Alto).
 * - Geometria solar exata nos solstícios/equinócio + norma europeia EN 17037 (horas de insolação direta).
 * - Canalização/bloqueio de brisa leste-sudeste (alísios 90°–150°) e delta térmico MapBiomas Col. 10 (LST).
 * - Penalidade térmica poente (+R$ 210/mês tarifa Neoenergia PE -> VPL 10 anos a 8% a.a. = R$ 17.521).
 * - Radar regulatório de gabarito LPUOS (Lei municipal nº 19.426, de 03/10/2025) + IEP/ZEPH/PBZPA.
 */

export const LATITUDE_RECIFE_GRAUS = -8.0539;
export type FaixaAndarIndex = 0 | 1 | 2; // 0 = Baixo (1-4), 1 = Médio (5-10), 2 = Alto (11+)

export type HorizonteSolar108 = Uint8Array; // length === 108 (36 * 3)

export type LoteAdjacente3D = {
  id: string;
  dsqfl?: string | null;
  azimuteGraus: number; // 0=N, 90=E, 180=S, 270=W
  distanciaM: number;
  alturaEdificadaAtualM: number;
  zonaLpuos?: string | null;
  vlCoefMax?: number | null;
  areaTerrenoM2?: number | null;
  gabaritoLegalEstimadoM?: number | null;
  protegidoIepZephIpav?: boolean;
  tetoPbzpaM?: number | null;
};

export type EntradaBioclimatica3D = {
  fachadaAzimuteGraus: number; // 0=N, 90=Nascente(L), 180=Sul, 270=Poente(O)
  andar: number;
  alturaPeDireitoM?: number;
  horizonte108?: HorizonteSolar108;
  obstaculosProximos?: LoteAdjacente3D[];
  lstDeltaIlhaCalorC?: number | null; // MapBiomas LST sobre mediana rural
  extraMensalArPoenteReais?: number;
  taxaDescontoRealAnual?: number;
};

export type ResultadoBioclimatico3D = {
  indicadorId: "IND-03";
  faixaAndar: FaixaAndarIndex;
  orientacaoCardinal: string;
  exposicaoPoente: boolean;
  horasSolEquinocioH: number;
  horasSolVeraoDezH: number;
  horasSolInvernoJunH: number;
  atendeMetaEn17037Minimo15H: boolean;
  classificacaoBrisaLesteSudeste: "brisa_franca" | "canalizada_parcial" | "barrada_por_entorno";
  deltaIlhaCalorLstC: number | null;
  custoMensalExtraPoenteReais: number;
  vpl10AnosPoenteReais: number;
  radarPerdaVista: {
    riscoSubstancialVerticalizacao: boolean;
    lotesComPotencialConstrutivoAberto: number;
    margemLegalGabaritoMaxM: number | null;
    amortecedorPatrimonialIepZephIpav: boolean;
    notaRegulatoriaLpuos2025: string;
  };
  horizonte108Bytes: HorizonteSolar108;
  epistemicTag: EpistemicTag;
  limiteEpistemologico: string;
};

export function faixaDeAndar(andar: number): FaixaAndarIndex {
  if (andar <= 4) return 0;
  if (andar <= 10) return 1;
  return 2;
}

export function classificarCardeal(azimuteGraus: number): string {
  const a = ((azimuteGraus % 360) + 360) % 360;
  if (a >= 337.5 || a < 22.5) return "Norte";
  if (a < 67.5) return "Nordeste (Nascente oblíquo)";
  if (a < 112.5) return "Leste (Nascente / Brisa)";
  if (a < 157.5) return "Sudeste (Brisa alísia)";
  if (a < 202.5) return "Sul";
  if (a < 247.5) return "Sudoeste";
  if (a < 292.5) return "Oeste (Poente)";
  return "Noroeste (Poente oblíquo)";
}

/**
 * Calcula o horizonte solar compacto de 108 bytes (`36 setores × 3 faixas de andar`)
 * a partir da altura dos lotes vizinhos e da distância em metros.
 */
export function construirHorizonteSolar108(
  obstaculos: readonly LoteAdjacente3D[],
  peDireitoM = 3.0,
): HorizonteSolar108 {
  const buf = new Uint8Array(108);
  const alturasFaixa = [2 * peDireitoM, 7 * peDireitoM, 14 * peDireitoM];

  for (let faixa = 0; faixa < 3; faixa += 1) {
    const zObs = alturasFaixa[faixa]!;
    for (const obs of obstaculos) {
      if (obs.distanciaM <= 0.5 || obs.alturaEdificadaAtualM <= zObs) continue;
      const elevRad = Math.atan2(obs.alturaEdificadaAtualM - zObs, obs.distanciaM);
      const elevDeg = Math.min(90, Math.max(0, Math.round((elevRad * 180) / Math.PI)));
      const sector = Math.floor((((obs.azimuteGraus % 360) + 360) % 360) / 10) % 36;
      const idx = faixa * 36 + sector;
      if (elevDeg > buf[idx]!) buf[idx] = elevDeg;
    }
  }
  return buf;
}

/**
 * VPL exato em 10 anos (120 meses) usando fator de capitalização composto equivalente à taxa real anual.
 * Para R$ 210/mês a 8% a.a., retorna exatamente R$ 17.521.
 */
export function calcularVpl10AnosPoente(extraMensalReais = 210, taxaRealAnual = 0.08): number {
  if (extraMensalReais <= 0) return 0;
  if (taxaRealAnual <= 0) return Math.round(extraMensalReais * 120);
  const rMensal = Math.pow(1 + taxaRealAnual, 1 / 12) - 1;
  const vpl = extraMensalReais * ((1 - Math.pow(1 + taxaRealAnual, -10)) / rMensal);
  return Math.round(vpl);
}

/**
 * Integração numérica de horas de sol direto em um dia (passo de 15 minutos) para latitude do Recife.
 */
function horasSolDiaNaFachada(
  declinacaoDeg: number,
  fachadaAzDeg: number,
  horizonte: HorizonteSolar108,
  faixa: FaixaAndarIndex,
): number {
  const rad = Math.PI / 180;
  const phi = LATITUDE_RECIFE_GRAUS * rad;
  const delta = declinacaoDeg * rad;
  let horas = 0;

  for (let horaSolar = 5.0; horaSolar <= 19.0; horaSolar += 0.25) {
    const hAng = (horaSolar - 12.0) * 15.0 * rad;
    const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(hAng);
    if (sinAlt <= 0) continue;
    const altDeg = Math.asin(Math.min(1, sinAlt)) / rad;

    const cosAz = (Math.sin(delta) - Math.sin(phi) * sinAlt) / (Math.cos(phi) * Math.cos(Math.asin(sinAlt)) + 1e-9);
    const sinAz = (-Math.cos(delta) * Math.sin(hAng)) / (Math.cos(Math.asin(sinAlt)) + 1e-9);
    const azDeg = ((Math.atan2(sinAz, cosAz) / rad) + 360) % 360;

    // Sol atinge a fachada se a diferença angular em relação à normal da fachada for < 85°
    const diff = Math.abs((((azDeg - fachadaAzDeg) + 540) % 360) - 180);
    if (diff >= 85) continue;

    const setor = Math.floor(azDeg / 10) % 36;
    const obstrucaoDeg = horizonte[faixa * 36 + setor] ?? 0;
    if (altDeg > obstrucaoDeg) {
      horas += 0.25;
    }
  }
  return Math.round(horas * 100) / 100;
}

export function avaliarBioclimatico3d(entrada: EntradaBioclimatica3D): ResultadoBioclimatico3D {
  const az = ((entrada.fachadaAzimuteGraus % 360) + 360) % 360;
  const faixa = faixaDeAndar(entrada.andar);
  const horizonte =
    entrada.horizonte108 && entrada.horizonte108.length === 108
      ? entrada.horizonte108
      : construirHorizonteSolar108(entrada.obstaculosProximos ?? [], entrada.alturaPeDireitoM ?? 3.0);

  const solEq = horasSolDiaNaFachada(0, az, horizonte, faixa);
  const solVer = horasSolDiaNaFachada(-23.44, az, horizonte, faixa);
  const solInv = horasSolDiaNaFachada(23.44, az, horizonte, faixa);

  // Alísios predominantes no Recife sopram de Leste/Sudeste (setores 90° a 150°)
  let maxObsBrisa = 0;
  for (let s = 9; s <= 15; s += 1) {
    const o = horizonte[faixa * 36 + s] ?? 0;
    if (o > maxObsBrisa) maxObsBrisa = o;
  }
  const faceRecebeAlisio = az >= 60 && az <= 170;
  const classificacaoBrisa: ResultadoBioclimatico3D["classificacaoBrisaLesteSudeste"] =
    faceRecebeAlisio && maxObsBrisa < 20
      ? "brisa_franca"
      : maxObsBrisa < 38
        ? "canalizada_parcial"
        : "barrada_por_entorno";

  const exposicaoPoente = az >= 225 && az <= 315;
  const extraMensal = exposicaoPoente ? (entrada.extraMensalArPoenteReais ?? 210) : 0;
  const vpl10Anos = calcularVpl10AnosPoente(extraMensal, entrada.taxaDescontoRealAnual ?? 0.08);

  // Radar de perda de vista LPUOS 2025 (Lei municipal 19.426/2025) + IEP/ZEPH/PBZPA
  const obs = entrada.obstaculosProximos ?? [];
  let lotesAbertos = 0;
  let margemMaxM: number | null = null;
  let temAmortecedorPatrimonial = false;

  for (const lote of obs) {
    if (lote.distanciaM > 100) continue;
    if (lote.protegidoIepZephIpav) {
      temAmortecedorPatrimonial = true;
      continue;
    }
    const gabaritoEfetivo =
      lote.gabaritoLegalEstimadoM !== undefined && lote.gabaritoLegalEstimadoM !== null
        ? Math.min(lote.gabaritoLegalEstimadoM, lote.tetoPbzpaM ?? Number.POSITIVE_INFINITY)
        : lote.vlCoefMax && lote.vlCoefMax > 1.5
          ? Math.min(lote.vlCoefMax * 12, lote.tetoPbzpaM ?? 120)
          : null;

    if (gabaritoEfetivo !== null && gabaritoEfetivo > lote.alturaEdificadaAtualM + 9) {
      lotesAbertos += 1;
      const ganho = Math.round((gabaritoEfetivo - lote.alturaEdificadaAtualM) * 10) / 10;
      if (margemMaxM === null || ganho > margemMaxM) margemMaxM = ganho;
    }
  }

  return {
    indicadorId: "IND-03",
    faixaAndar: faixa,
    orientacaoCardinal: classificarCardeal(az),
    exposicaoPoente,
    horasSolEquinocioH: solEq,
    horasSolVeraoDezH: solVer,
    horasSolInvernoJunH: solInv,
    atendeMetaEn17037Minimo15H: solEq >= 1.5,
    classificacaoBrisaLesteSudeste: classificacaoBrisa,
    deltaIlhaCalorLstC: entrada.lstDeltaIlhaCalorC ?? null,
    custoMensalExtraPoenteReais: extraMensal,
    vpl10AnosPoenteReais: vpl10Anos,
    radarPerdaVista: {
      riscoSubstancialVerticalizacao: lotesAbertos > 0,
      lotesComPotencialConstrutivoAberto: lotesAbertos,
      margemLegalGabaritoMaxM: margemMaxM,
      amortecedorPatrimonialIepZephIpav: temAmortecedorPatrimonial,
      notaRegulatoriaLpuos2025:
        "Leitura segundo a LPUOS do Recife (Lei nº 19.426, de 03/10/2025).",
    },
    horizonte108Bytes: horizonte,
    epistemicTag: obs.length > 0 || entrada.horizonte108 ? "inferencia" : "nao_sabemos",
    limiteEpistemologico:
      "Simulação 3D baseada em orientação da fachada e gabarito do entorno; vegetação densa e protetores solares (brises) locais alteram a carga térmica real.",
  };
}
