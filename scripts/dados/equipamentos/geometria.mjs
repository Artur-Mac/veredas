// Geometria plana local para distâncias curtas no Recife (erro < 0,5% até alguns km): pontos, linhas e polígonos em
// [lon, lat] WGS84. Puro, testado em ./testes/equipamentos.test.mjs.
const R = 6_371_008.8;
const RAD = Math.PI / 180;
const LAT_REF = -8.05;
const KX = R * RAD * Math.cos(LAT_REF * RAD);
const KY = R * RAD;

export const noRecife = (lon, lat) => lon > -35.1 && lon < -34.8 && lat > -8.2 && lat < -7.9;

export function distM(lon1, lat1, lon2, lat2) {
  const dx = (lon2 - lon1) * KX, dy = (lat2 - lat1) * KY;
  return Math.hypot(dx, dy);
}

/** Distância do ponto P ao segmento AB, em metros (plano local). */
function distAoSegmento(px, py, ax, ay, bx, by) {
  const ux = (bx - ax) * KX, uy = (by - ay) * KY, vx = (px - ax) * KX, vy = (py - ay) * KY;
  const l2 = ux * ux + uy * uy;
  const t = l2 ? Math.max(0, Math.min(1, (vx * ux + vy * uy) / l2)) : 0;
  return Math.hypot(vx - t * ux, vy - t * uy);
}

/** Linhas de uma geometria LineString/MultiLineString: [[lon, lat], …][]. */
export function linhasDe(geom) {
  if (geom.type === "LineString") return [geom.coordinates];
  if (geom.type === "MultiLineString") return geom.coordinates;
  return [];
}

/** Anéis externos e buracos de Polygon/MultiPolygon: [[anel externo, …buracos], …]. */
export function aneisDe(geom) {
  const sem3 = (anel) => anel.map((c) => [c[0], c[1]]);
  if (geom.type === "Polygon") return [geom.coordinates.map(sem3)];
  if (geom.type === "MultiPolygon") return geom.coordinates.map((p) => p.map(sem3));
  return [];
}

function dentroDoAnel(lon, lat, anel) {
  let c = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [x1, y1] = anel[i], [x2, y2] = anel[j];
    if ((y1 > lat) !== (y2 > lat) && lon < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) c = !c;
  }
  return c;
}

export function distAsLinhasM(lon, lat, linhas) {
  let min = Infinity;
  for (const l of linhas) for (let i = 1; i < l.length; i++) {
    const d = distAoSegmento(lon, lat, l[i - 1][0], l[i - 1][1], l[i][0], l[i][1]);
    if (d < min) min = d;
  }
  return min;
}

/** 0 dentro do polígono (fora dos buracos); senão, a distância à borda mais perto. */
export function distAoPoligonoM(lon, lat, poligonos) {
  let min = Infinity;
  for (const [externo, ...buracos] of poligonos) {
    if (dentroDoAnel(lon, lat, externo) && !buracos.some((b) => dentroDoAnel(lon, lat, b))) return 0;
    const d = distAsLinhasM(lon, lat, [externo, ...buracos]);
    if (d < min) min = d;
  }
  return min;
}

/** Área em m² (fórmula do laço no plano local), anel externo menos buracos. */
export function areaM2(poligonos) {
  const anel = (a) => {
    let s = 0;
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) s += (a[j][0] * KX) * (a[i][1] * KY) - (a[i][0] * KX) * (a[j][1] * KY);
    return Math.abs(s) / 2;
  };
  return poligonos.reduce((t, [externo, ...buracos]) => t + anel(externo) - buracos.reduce((b, x) => b + anel(x), 0), 0);
}

const MINUSCULAS = new Set(["da", "de", "do", "das", "dos", "e", "a", "o"]);
const SIGLAS = new Set(["USF", "PSF", "CAPS", "CEO", "SPA", "UPA", "II", "III", "IV", "JBR", "UCN", "ARIE", "APA", "RPPN", "MAMAM", "CVA"]);
/** "PAÇO DO FREVO" → "Paço do Frevo"; siglas ficam. */
export function titulo(texto) {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.split(" ").map((p, i) => {
    const up = p.toUpperCase();
    if (SIGLAS.has(up.replace(/[^A-Z]/g, ""))) return up;
    const low = p.toLowerCase();
    if (i > 0 && MINUSCULAS.has(low)) return low;
    return low.charAt(0).toUpperCase() + low.slice(1);
  }).join(" ");
}
