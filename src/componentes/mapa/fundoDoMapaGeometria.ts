// Geometria do fundo do mapa (mapa-base, 18/11/2026). Funções puras, sem React.
// Cada arquivo do mapa-base tem o próprio plano local em decímetros (src/dados/recife/mapaBaseContrato.ts). Quem hospeda o
// mapa desenha com a própria conta `paraDesenho([lon, lat]) → [x, y]`. As duas são lineares em lon e lat, então a passagem
// do plano do arquivo para o desenho é uma transformação afim, calculada uma vez por arquivo com três chamadas a
// `paraDesenho`, e não ponto a ponto por lon/lat.
import { METROS_POR_GRAU, UNIDADES_POR_METRO, type Caixa, type OrigemDoPlano, type Pontos } from "../../dados/recife/mapaBaseContrato";

export type ParaDesenho = (ponto: readonly [number, number]) => readonly [number, number] | [number, number];

/** x' = ax·x + bx·y + cx; y' = ay·x + by·y + cy, com (x, y) em decímetros do plano do arquivo. */
export type Afim = { ax: number; bx: number; cx: number; ay: number; by: number; cy: number };

/** Retângulo no desenho: [x0, y0, x1, y1]. */
export type Retangulo = [number, number, number, number];

const PASSO_GRAUS = 0.01;

export function afimDoArquivo(origem: OrigemDoPlano, paraDesenho: ParaDesenho): Afim {
  const [lon0, lat0] = origem;
  const cosseno = Math.cos((lat0 * Math.PI) / 180);
  const p0 = paraDesenho([lon0, lat0]);
  const pLeste = paraDesenho([lon0 + PASSO_GRAUS, lat0]);
  const pNorte = paraDesenho([lon0, lat0 + PASSO_GRAUS]);
  const ux = PASSO_GRAUS * METROS_POR_GRAU * cosseno * UNIDADES_POR_METRO;
  const uy = -PASSO_GRAUS * METROS_POR_GRAU * UNIDADES_POR_METRO;
  return {
    ax: (pLeste[0] - p0[0]) / ux,
    bx: (pNorte[0] - p0[0]) / uy,
    cx: p0[0],
    ay: (pLeste[1] - p0[1]) / ux,
    by: (pNorte[1] - p0[1]) / uy,
    cy: p0[1],
  };
}

/** Pixels do desenho (escala 1) por metro do terreno. */
export function pixelsPorMetro(a: Afim): number {
  return Math.hypot(a.ax, a.ay) * UNIDADES_POR_METRO;
}

/** [lon, lat] no plano do arquivo, em decímetros (sem arredondar). */
export function noPlano(origem: OrigemDoPlano, ponto: readonly [number, number]): [number, number] {
  const [lon0, lat0] = origem;
  const cosseno = Math.cos((lat0 * Math.PI) / 180);
  return [
    (ponto[0] - lon0) * METROS_POR_GRAU * cosseno * UNIDADES_POR_METRO,
    -(ponto[1] - lat0) * METROS_POR_GRAU * UNIDADES_POR_METRO,
  ];
}

export function aplicar(a: Afim, x: number, y: number): [number, number] {
  return [a.ax * x + a.bx * y + a.cx, a.ay * x + a.by * y + a.cy];
}

/** A caixa do plano levada ao desenho (envolvente dos quatro cantos). */
export function caixaNoDesenho(a: Afim, c: Caixa): Retangulo {
  const xs = [a.ax * c[0] + a.bx * c[1], a.ax * c[2] + a.bx * c[1], a.ax * c[0] + a.bx * c[3], a.ax * c[2] + a.bx * c[3]];
  const ys = [a.ay * c[0] + a.by * c[1], a.ay * c[2] + a.by * c[1], a.ay * c[0] + a.by * c[3], a.ay * c[2] + a.by * c[3]];
  return [Math.min(...xs) + a.cx, Math.min(...ys) + a.cy, Math.max(...xs) + a.cx, Math.max(...ys) + a.cy];
}

export function seTocam(r: Retangulo, s: Retangulo): boolean {
  return r[0] <= s[2] && s[0] <= r[2] && r[1] <= s[3] && s[1] <= r[3];
}

/** Arredonda a 0,1 px: com zoom 3 isso dá 0,3 px na tela, abaixo do que se vê. */
export function r1(n: number): string {
  const v = Math.round(n * 10) / 10;
  return Object.is(v, -0) ? "0" : String(v);
}

/**
 * Anel ou linha do plano para o trecho de um caminho SVG ("M…L…Z"), já no desenho.
 * - pula ponto a menos de `tolerancia` px do anterior (não muda o que se vê);
 * - fora do quadro com folga, só o contorno grosseiro (pula ponto a menos de 25 px do anterior): o que está fora não
 *   aparece, e o anel continua fechado para o preenchimento par-ímpar.
 */
export function trechoDoCaminho(pts: Pontos, a: Afim, quadro: Retangulo, tolerancia: number, fechado: boolean): string {
  const n = pts.length / 2;
  if (n < 2) return "";
  const fx0 = quadro[0] - 60;
  const fy0 = quadro[1] - 60;
  const fx1 = quadro[2] + 60;
  const fy1 = quadro[3] + 60;
  const partes: string[] = [];
  let ux = 0;
  let uy = 0;
  let emitidos = 0;
  for (let i = 0; i < n; i++) {
    const x0 = pts[2 * i]!;
    const y0 = pts[2 * i + 1]!;
    const x = a.ax * x0 + a.bx * y0 + a.cx;
    const y = a.ay * x0 + a.by * y0 + a.cy;
    if (emitidos > 0 && i < n - 1) {
      const d = Math.hypot(x - ux, y - uy);
      if (d < tolerancia) continue;
      if (d < 25 && (x < fx0 || x > fx1 || y < fy0 || y > fy1)) continue;
    }
    partes.push((emitidos === 0 ? "M" : "L") + r1(x) + " " + r1(y));
    ux = x;
    uy = y;
    emitidos++;
  }
  if (emitidos < 2) return "";
  return partes.join("") + (fechado ? "Z" : "");
}

/** Ponto em polígono (par-ímpar) sobre anéis do plano. */
export function pontoNosAneis(x: number, y: number, aneis: readonly Pontos[]): boolean {
  let dentro = false;
  for (const r of aneis) {
    const n = r.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = r[2 * i]!;
      const yi = r[2 * i + 1]!;
      const xj = r[2 * j]!;
      const yj = r[2 * j + 1]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
  }
  return dentro;
}

/** Ponto em polígono (par-ímpar) sobre anéis já no desenho ([x0, y0, x1, y1, …]). */
export function pontoNosAneisDoDesenho(x: number, y: number, aneis: readonly Float64Array[]): boolean {
  let dentro = false;
  for (const r of aneis) {
    const n = r.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = r[2 * i]!;
      const yi = r[2 * i + 1]!;
      const xj = r[2 * j]!;
      const yj = r[2 * j + 1]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
  }
  return dentro;
}

export function distanciaAoSegmento(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Menor distância do ponto a qualquer lado dos anéis (mesma unidade dos anéis). */
export function distanciaAosAneis(x: number, y: number, aneis: readonly (Pontos | Float64Array)[]): number {
  let melhor = Infinity;
  for (const r of aneis) {
    const n = r.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const d = distanciaAoSegmento(x, y, r[2 * j]!, r[2 * j + 1]!, r[2 * i]!, r[2 * i + 1]!);
      if (d < melhor) melhor = d;
    }
  }
  return melhor;
}

/** Anel do plano levado ao desenho, sem simplificar. */
export function anelNoDesenho(pts: Pontos, a: Afim): Float64Array {
  const saida = new Float64Array(pts.length);
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i]!;
    const y = pts[i + 1]!;
    saida[i] = a.ax * x + a.bx * y + a.cx;
    saida[i + 1] = a.ay * x + a.by * y + a.cy;
  }
  return saida;
}

/**
 * Recorta uma polilinha (no desenho) pelo retângulo, segmento a segmento (Liang–Barsky): devolve os trechos contínuos
 * que ficam dentro. Um segmento que só atravessa o quadro, com as duas pontas fora, também entra.
 */
export function recortarLinha(pts: Float64Array, r: Retangulo): number[][] {
  const trechos: number[][] = [];
  let atual: number[] = [];
  const fechar = () => {
    if (atual.length >= 4) trechos.push(atual);
    atual = [];
  };
  for (let i = 2; i < pts.length; i += 2) {
    const x0 = pts[i - 2]!;
    const y0 = pts[i - 1]!;
    const x1 = pts[i]!;
    const y1 = pts[i + 1]!;
    const dx = x1 - x0;
    const dy = y1 - y0;
    let t0 = 0;
    let t1 = 1;
    let fora = false;
    const p = [-dx, dx, -dy, dy];
    const q = [x0 - r[0], r[2] - x0, y0 - r[1], r[3] - y0];
    for (let k = 0; k < 4; k++) {
      const pk = p[k]!;
      const qk = q[k]!;
      if (pk === 0) {
        if (qk < 0) {
          fora = true;
          break;
        }
      } else {
        const t = qk / pk;
        if (pk < 0) {
          if (t > t1) {
            fora = true;
            break;
          }
          if (t > t0) t0 = t;
        } else {
          if (t < t0) {
            fora = true;
            break;
          }
          if (t < t1) t1 = t;
        }
      }
    }
    if (fora) {
      fechar();
      continue;
    }
    const ax = x0 + t0 * dx;
    const ay = y0 + t0 * dy;
    const bx = x0 + t1 * dx;
    const by = y0 + t1 * dy;
    if (atual.length === 0 || t0 > 0) {
      fechar();
      atual.push(ax, ay);
    }
    atual.push(bx, by);
    if (t1 < 1) fechar();
  }
  fechar();
  return trechos;
}

/** Hachura a 45° ("/") cobrindo o quadro, com `passo` entre linhas. Uma forma só. */
export function caminhoDaHachura(largura: number, altura: number, passo: number): string {
  const partes: string[] = [];
  for (let c = passo / 2; c < largura + altura; c += passo) {
    const xa = Math.min(c, largura);
    const ya = c - xa;
    const yb = Math.min(c, altura);
    const xb = c - yb;
    partes.push("M" + r1(xa) + " " + r1(ya) + "L" + r1(xb) + " " + r1(yb));
  }
  return partes.join("");
}
