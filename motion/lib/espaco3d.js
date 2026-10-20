// Câmera pinhole e desenho de polígonos 3D em SVG, como função pura da câmera.
// Mundo: x à direita, z para cima; a câmera olha para −y. Recorta no plano próximo.
// (A cena 01 tem uma cópia embutida deste mesmo código.)
import { lerp } from './motion.js';

export function paraCamera(p, c) {
  const dx = p[0] - c.pos[0], dy = p[1] - c.pos[1], dz = p[2] - c.pos[2];
  const cy = Math.cos(c.yaw || 0), sy = Math.sin(c.yaw || 0);
  const xr = dx * cy + dy * sy, yr = -dx * sy + dy * cy;
  const xc = xr, yc = dz, zc = -yr;
  const cp = Math.cos(c.pitch || 0), sp = Math.sin(c.pitch || 0);
  const yc2 = yc * cp - zc * sp, zc2 = yc * sp + zc * cp;
  const cr = Math.cos(c.roll || 0), sr = Math.sin(c.roll || 0);
  return [xc * cr - yc2 * sr, xc * sr + yc2 * cr, zc2];
}

export const PERTO = 0.06;
export const naTela = (q, c) => [(c.cx ?? 960) + (c.f * q[0]) / q[2], (c.cy ?? 540) - (c.f * q[1]) / q[2]];
export const tela = (p, c) => naTela(paraCamera(p, c), c);
export const profundidade = (p, c) => paraCamera(p, c)[2];

export function recortaPerto(poly) {
  const out = [];
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ai = a[2] > PERTO, bi = b[2] > PERTO;
    if (ai) out.push(a);
    if (ai !== bi) { const s = (PERTO - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], s), lerp(a[1], b[1], s), PERTO]); }
  }
  return out;
}

const fmt = (p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
export function caminho(pts3, c, fechar = true) {
  const cam = pts3.map((p) => paraCamera(p, c));
  const rec = fechar ? recortaPerto(cam) : cam.filter((q) => q[2] > PERTO);
  if (rec.length < (fechar ? 3 : 2)) return '';
  return 'M' + rec.map((q) => fmt(naTela(q, c))).join('L') + (fechar ? 'Z' : '');
}

export const poly = (d, fill, stroke, sw = 2, extra = '') => (d ? `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>` : '');

// caixa com as faces viradas para a câmera (as outras não são desenhadas)
export function caixa(x0, y0, z0, x1, y1, z1, cores, c, contorno, sw = 2) {
  const faces = [
    { pts: [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]], n: [0, 0, 1], cor: cores.t },
    { pts: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], n: [0, 1, 0], cor: cores.f },
    { pts: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], n: [0, -1, 0], cor: cores.f },
    { pts: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], n: [1, 0, 0], cor: cores.l },
    { pts: [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], n: [-1, 0, 0], cor: cores.l },
  ];
  let s = '';
  for (const f of faces) {
    const ctr = f.pts.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4, a[2] + p[2] / 4], [0, 0, 0]);
    const v = [c.pos[0] - ctr[0], c.pos[1] - ctr[1], c.pos[2] - ctr[2]];
    if (v[0] * f.n[0] + v[1] * f.n[1] + v[2] * f.n[2] <= 0) continue;
    s += poly(caminho(f.pts, c), f.cor, contorno, sw);
  }
  return s;
}

// recorte de polígono num retângulo do plano xy
export function recortaRet(pts, x0, x1, y0, y1, z = 0.004) {
  let out = pts;
  for (const f of [(p) => p[0] - x0, (p) => x1 - p[0], (p) => p[1] - y0, (p) => y1 - p[1]]) {
    const ent = out; out = [];
    for (let i = 0; i < ent.length; i += 1) {
      const a = ent[i], b = ent[(i + 1) % ent.length];
      const fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) { const s = fa / (fa - fb); out.push([lerp(a[0], b[0], s), lerp(a[1], b[1], s), z]); }
    }
    if (!out.length) return out;
  }
  return out;
}
