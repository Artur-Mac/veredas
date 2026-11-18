/**
 * Motor analítico de projeção SIRGAS 2000 / UTM Zona 25S (EPSG:31985) em TypeScript puro.
 * Todas as interseções métricas (DSQFL × SPU, DSQFL × LPUOS, buffers de 100 m e 250 m) rodam em EPSG:31985,
 * convertendo para EPSG:4326 apenas na publicação dos artefatos móveis.
 */

const A_GRS80 = 6378137.0;
const F_GRS80 = 1 / 298.257222101;
const E2 = 2 * F_GRS80 - F_GRS80 * F_GRS80;
const EP2 = E2 / (1 - E2);
const K0 = 0.9996;
const LON0_RAD = (-33 * Math.PI) / 180; // Meridiano central da Zona 25 (-33°)
const FALSE_EASTING = 500_000.0;
const FALSE_NORTHING_SUL = 10_000_000.0;

export type PontoWgs84 = readonly [lon: number, lat: number];
export type PontoUtm = readonly [easting: number, northing: number];

function arcoMeridiano(phi: number): number {
  const e4 = E2 * E2;
  const e6 = e4 * E2;
  return (
    A_GRS80 *
    ((1 - E2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
      ((3 * E2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
      ((35 * e6) / 3072) * Math.sin(6 * phi))
  );
}

/** Converte [lon, lat] em EPSG:4326/4674 (WGS84/SIRGAS 2000) para [easting, northing] em EPSG:31985 (metros). */
export function wgs84ParaSirgas31985(lon: number, lat: number): [number, number] {
  const phi = (lat * Math.PI) / 180;
  const lam = (lon * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const N = A_GRS80 / Math.sqrt(1 - E2 * sinPhi * sinPhi);
  const T = tanPhi * tanPhi;
  const C = EP2 * cosPhi * cosPhi;
  const A = cosPhi * (lam - LON0_RAD);
  const M = arcoMeridiano(phi);

  const easting =
    FALSE_EASTING +
    K0 *
      N *
      (A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * EP2) * A ** 5) / 120);

  const northing =
    FALSE_NORTHING_SUL +
    K0 *
      (M +
        N *
          tanPhi *
          ((A * A) / 2 +
            ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24 +
            ((61 - 58 * T + T * T + 600 * C - 330 * EP2) * A ** 6) / 720));

  return [easting, northing];
}

/** Converte [easting, northing] em EPSG:31985 (metros) para [lon, lat] em WGS84/SIRGAS 2000 (graus). */
export function sirgas31985ParaWgs84(easting: number, northing: number): [number, number] {
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const x = easting - FALSE_EASTING;
  const y = northing - FALSE_NORTHING_SUL;
  const M = y / K0;
  const mu = M / (A_GRS80 * (1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256));

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const sin1 = Math.sin(phi1);
  const cos1 = Math.cos(phi1);
  const tan1 = Math.tan(phi1);
  const N1 = A_GRS80 / Math.sqrt(1 - E2 * sin1 * sin1);
  const R1 = (A_GRS80 * (1 - E2)) / Math.pow(1 - E2 * sin1 * sin1, 1.5);
  const T1 = tan1 * tan1;
  const C1 = EP2 * cos1 * cos1;
  const D = x / (N1 * K0);

  const phi =
    phi1 -
    ((N1 * tan1) / R1) *
      ((D * D) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * D ** 6) / 720);

  const lam =
    LON0_RAD +
    (D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * D ** 5) / 120) /
      cos1;

  return [(lam * 180) / Math.PI, (phi * 180) / Math.PI];
}

export function reprojetarAnelPara31985(anel: readonly PontoWgs84[]): [number, number][] {
  return anel.map(([lon, lat]) => wgs84ParaSirgas31985(lon, lat));
}

export function reprojetarAnelPara4326(anel: readonly PontoUtm[], casasDecimais = 6): [number, number][] {
  return anel.map(([e, n]) => {
    const [lon, lat] = sirgas31985ParaWgs84(e, n);
    return [Number(lon.toFixed(casasDecimais)), Number(lat.toFixed(casasDecimais))];
  });
}

export function distanciaPlanarM(a: PontoUtm, b: PontoUtm): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

export function areaPoligonoM2(anel: readonly PontoUtm[]): number {
  if (anel.length < 3) return 0;
  let s = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    s += anel[j]![0] * anel[i]![1] - anel[i]![0] * anel[j]![1];
  }
  return Math.abs(s) / 2;
}

export function pontoEmPoligonoPlanar(p: PontoUtm, anel: readonly PontoUtm[]): boolean {
  let dentro = false;
  const [px, py] = p;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i]!;
    const [xj, yj] = anel[j]!;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro;
}

export function distanciaPontoSegmentoM(p: PontoUtm, a: PontoUtm, b: PontoUtm): number {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const len2 = vx * vx + vy * vy;
  if (len2 === 0) return distanciaPlanarM(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len2));
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
}

export function distanciaPontoPoligonoM(p: PontoUtm, anel: readonly PontoUtm[]): number {
  if (anel.length < 3) return Infinity;
  if (pontoEmPoligonoPlanar(p, anel)) return 0;
  let min = Infinity;
  for (let i = 1; i < anel.length; i += 1) {
    const d = distanciaPontoSegmentoM(p, anel[i - 1]!, anel[i]!);
    if (d < min) min = d;
  }
  const fechamento = distanciaPontoSegmentoM(p, anel[anel.length - 1]!, anel[0]!);
  return Math.min(min, fechamento);
}

export type CaixaUtm = readonly [minE: number, minN: number, maxE: number, maxN: number];

export function caixaDoAnelUtm(anel: readonly PontoUtm[]): CaixaUtm {
  let minE = Infinity;
  let minN = Infinity;
  let maxE = -Infinity;
  let maxN = -Infinity;
  for (const [e, n] of anel) {
    if (e < minE) minE = e;
    if (e > maxE) maxE = e;
    if (n < minN) minN = n;
    if (n > maxN) maxN = n;
  }
  return [minE, minN, maxE, maxN];
}

export function caixasInterceptam(a: CaixaUtm, b: CaixaUtm, margemM = 0): boolean {
  return (
    a[0] - margemM <= b[2] &&
    a[2] + margemM >= b[0] &&
    a[1] - margemM <= b[3] &&
    a[3] + margemM >= b[1]
  );
}

function segmentosCruza(a1: PontoUtm, a2: PontoUtm, b1: PontoUtm, b2: PontoUtm): boolean {
  const ccw = (p1: PontoUtm, p2: PontoUtm, p3: PontoUtm) =>
    (p3[1] - p1[1]) * (p2[0] - p1[0]) > (p2[1] - p1[1]) * (p3[0] - p1[0]);
  return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2);
}

/** Verifica interseção exata ou proximidade métrica (`bufferM`) entre dois polígonos em EPSG:31985. */
export function poligonosInterceptamEm31985(
  anelA: readonly PontoUtm[],
  anelB: readonly PontoUtm[],
  bufferM = 0,
): boolean {
  if (anelA.length < 3 || anelB.length < 3) return false;
  if (!caixasInterceptam(caixaDoAnelUtm(anelA), caixaDoAnelUtm(anelB), bufferM)) return false;

  for (const p of anelA) {
    if (pontoEmPoligonoPlanar(p, anelB)) return true;
    if (bufferM > 0 && distanciaPontoPoligonoM(p, anelB) <= bufferM) return true;
  }
  for (const p of anelB) {
    if (pontoEmPoligonoPlanar(p, anelA)) return true;
    if (bufferM > 0 && distanciaPontoPoligonoM(p, anelA) <= bufferM) return true;
  }
  for (let i = 0; i < anelA.length; i += 1) {
    const a1 = anelA[i]!;
    const a2 = anelA[(i + 1) % anelA.length]!;
    for (let j = 0; j < anelB.length; j += 1) {
      const b1 = anelB[j]!;
      const b2 = anelB[(j + 1) % anelB.length]!;
      if (segmentosCruza(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}
