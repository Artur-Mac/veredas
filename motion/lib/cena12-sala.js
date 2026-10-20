// A sala quente da cena 01 no estado de encantamento, para a foto do anúncio da cena 12.
//
// Cópia do desenho de motion/poc/cena01.html (?v=1) antes do "Mas": mesma câmera pinhole, mesmas
// torres (rng(81)), mesmas cores quentes, caixilho com montante e travessa, luz do sol no chão,
// cortinas e vento. A cena 01 e a lib/sala01.js (a versão noturna da cena 09) não são tocadas.
// Fora do desenho, de propósito: a cota "75 m²" pintada no chão (a cena 12 não mostra número além
// das quatro aspas do anúncio).
//
// A sala é redesenhada em SVG a cada quadro, nunca uma imagem escalada: cada ponto sai da câmera
// pinhole em coordenadas do quadro da cena 01 (1920 × 1080) e passa por `proj`, que a cena 12 usa
// para pôr a sala dentro da moldura da foto e aplicar a câmera dela. `esc` escala as espessuras.
import { lerp, sp, rng, PRESETS as P } from './motion.js';

// marcas da cena 01 que este estado usa
const T01 = { a1: 4.4, a2: 5.9, a3: 7.3 };
export const T_ENCANTO = 10.6;   // "parece o lar perfeito": as quatro aspas no ar, sol alto

const hex = (h, a = 1) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];
const QUENTE = {
  piso: hex('#EFC38D'), pisoLinha: hex('#F8DDB4'), fundo: hex('#F8E3C4'), esquerda: hex('#F6B467'), direita: hex('#F9C978'), teto: hex('#FCEEDA'),
  ceu1: hex('#FBD08F'), ceu2: hex('#FCDDA8'), ceu3: hex('#FDE9C6'), mar: hex('#F7C79E'), marLinha: hex('#FCE3C9'),
  torreA: hex('#F4A15C'), torreB: hex('#EE8956'), torreC: hex('#E9734F'), torreTopo: hex('#FCE0B8'),
  sol: hex('#FFB347'), halo: hex('#FFC46B', 0.35), luz: hex('#FFF4D6', 0.88), feixe: hex('#FFF1C9', 0.26), sanca: hex('#F8E2C2'), spot: hex('#FFF8EA'), torreLinha: hex('#FFFFFF'),
  moldura: hex('#FFFFFF'), contorno: hex('#FFFFFF'), cortina: hex('#FFF8EC', 0.8), vento: hex('#FFFFFF', 0.95),
  sofaT: hex('#F9A07A'), sofaF: hex('#F47745'), sofaL: hex('#DC683B'),
  tapete: hex('#F2A27F'), tapeteBorda: hex('#F8C3A6'),
  mesaT: hex('#FBD27D'), mesaF: hex('#F2B04F'), mesaL: hex('#E39A3C'),
  rackT: hex('#FCE7C4'), rackF: hex('#F6D3A0'), rackL: hex('#E9BC85'),
  quadro: hex('#E9734F'), quadroSol: hex('#FFC46B'), passepartout: hex('#FFF7EA'),
};
const cor = (ch) => { const q = QUENTE[ch]; return `rgba(${q[0]},${q[1]},${q[2]},${q[3].toFixed(3)})`; };
export const FUNDO_QUENTE = cor('fundo');

// ---------------------------------------------------------------------------
// Câmera pinhole (a mesma da cena 01): x à direita, y para o fundo é negativo, z para cima.
// ---------------------------------------------------------------------------
function paraCamera(p, c) {
  const dx = p[0] - c.pos[0], dy = p[1] - c.pos[1], dz = p[2] - c.pos[2];
  const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
  const xr = dx * cy + dy * sy, yr = -dx * sy + dy * cy;
  const xc = xr, yc = dz, zc = -yr;
  const cp = Math.cos(c.pitch), spt = Math.sin(c.pitch);
  const yc2 = yc * cp - zc * spt, zc2 = yc * spt + zc * cp;
  const cr = Math.cos(c.roll), sr = Math.sin(c.roll);
  return [xc * cr - yc2 * sr, xc * sr + yc2 * cr, zc2];
}
const PERTO = 0.06;
function recortaPerto(poly) {
  const out = [];
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ai = a[2] > PERTO, bi = b[2] > PERTO;
    if (ai) out.push(a);
    if (ai !== bi) { const s = (PERTO - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], s), lerp(a[1], b[1], s), PERTO]); }
  }
  return out;
}
function recortaRet(pts, x0, x1, y0, y1) {
  let out = pts;
  for (const f of [(p) => p[0] - x0, (p) => x1 - p[0], (p) => p[1] - y0, (p) => y1 - p[1]]) {
    const ent = out; out = [];
    for (let i = 0; i < ent.length; i += 1) {
      const a = ent[i], b = ent[(i + 1) % ent.length];
      const fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) { const s = fa / (fa - fb); out.push([lerp(a[0], b[0], s), lerp(a[1], b[1], s), 0.004]); }
    }
    if (!out.length) return out;
  }
  return out;
}

// torres vistas pela janela (as mesmas da cena 01)
const torres = [];
(function cidade() {
  const r = rng(81);
  for (let i = 0; i < 18; i += 1) {
    const lado = i % 2 ? 1 : -1;
    const x = lado * (6 + r() * 26) + (r() - 0.5) * 4;
    const w = 2.2 + r() * 3.2, prof = 2 + r() * 2;
    const y = -52 - r() * 14;
    const topo = 0.4 + r() * 6.5 - Math.abs(x) * 0.02;
    torres.push({ x, w, prof, y, topo, cor: ['torreA', 'torreB', 'torreC'][i % 3] });
  }
  torres.sort((a, b) => a.y - b.y);
})();

// geometria e sol no encantamento (a sala já "ampliada" do "75 metros quadrados"; o sol já subiu)
const G = { hw: 3.4, D: 7.3, H: 2.8 };
const SOL = [2.4, -38, 5.4];
const J = { x0: -1.85, x1: 1.85, z0: 0.25, z1: 2.5 };
const MOLD = { e: 0.08, montanteX: 0, travessaZ: 1.95 };

// câmera da cena 01 no encantamento; `tr` é o tempo da cena 01 (só a deriva lenta do yaw depende dele)
export function camera01(tr) {
  const t = T_ENCANTO;
  const abre = sp(t, { k: 4, d: 4 });
  const pos = [lerp(0.6, 0.05, abre), lerp(2.6, 0.55, abre) + 0.6 * sp(t - T01.a1, P.map), lerp(1.6, 1.42, abre)];
  const yaw = lerp(-0.06, 0, abre) + 0.012 * Math.sin(tr * 0.35);
  return { pos, f: 1180, roll: 0, pitch: -0.03, yaw };
}

// ---------------------------------------------------------------------------
// Desenho. o = { tr: tempo da cena 01 (deriva e vento), proj: ([x, y]) => [X, Y], esc }
// Devolve o SVG da sala e a geometria da janela (vão e moldura) já projetada.
// ---------------------------------------------------------------------------
export function salaQuente(o) {
  const c = camera01(o.tr);
  const proj = o.proj, esc = o.esc ?? 1;
  const naTela = (q) => proj([960 + (c.f * q[0]) / q[2], 540 - (c.f * q[1]) / q[2]]);
  const tela = (p) => naTela(paraCamera(p, c));
  const profundidade = (p) => paraCamera(p, c)[2];
  const fmt = (p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  const caminho = (pts3, fechar = true) => {
    const cam = pts3.map((p) => paraCamera(p, c));
    const rec = fechar ? recortaPerto(cam) : cam.filter((q) => q[2] > PERTO);
    if (rec.length < (fechar ? 3 : 2)) return '';
    return 'M' + rec.map((q) => fmt(naTela(q))).join('L') + (fechar ? 'Z' : '');
  };
  const w = (v) => (v * esc).toFixed(2);
  const poly = (d, fill, stroke, sw = 2) => (d ? `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w(sw)}" stroke-linejoin="round"/>` : '');
  const caixa = (x0, y0, z0, x1, y1, z1, cores, contorno, sw = 2) => {
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
      s += poly(caminho(f.pts), f.cor, contorno, sw);
    }
    return s;
  };

  const { hw, D, H } = G;
  const linha = cor('contorno');
  let s = '';
  let feixesPorCima = '';

  // lá fora: céu em faixas, sol, mar e torres (atrás da parede do fundo)
  const yc = -80;
  s += poly(caminho([[-120, yc, 1.6], [120, yc, 1.6], [120, yc, 80], [-120, yc, 80]]), cor('ceu1'), 'none', 0);
  s += poly(caminho([[-120, yc, 1.6], [120, yc, 1.6], [120, yc, 9], [-120, yc, 9]]), cor('ceu2'), 'none', 0);
  s += poly(caminho([[-120, yc, 1.6], [120, yc, 1.6], [120, yc, 4.2], [-120, yc, 4.2]]), cor('ceu3'), 'none', 0);
  {
    const sc = tela(SOL), sd = profundidade(SOL);
    if (sd > PERTO) {
      // raio em px do quadro de saída: o mesmo fator de `proj` (medido em dois pontos)
      const k = Math.hypot(...[0, 1].map((i) => proj([100, 0])[i] - proj([0, 0])[i])) / 100;
      const r = ((c.f * 2.3) / sd) * k;
      s += `<circle cx="${sc[0].toFixed(1)}" cy="${sc[1].toFixed(1)}" r="${(r * 2.6).toFixed(1)}" fill="${cor('halo')}" opacity="0.5"/>`;
      s += `<circle cx="${sc[0].toFixed(1)}" cy="${sc[1].toFixed(1)}" r="${(r * 1.7).toFixed(1)}" fill="${cor('halo')}"/>`;
      s += `<circle cx="${sc[0].toFixed(1)}" cy="${sc[1].toFixed(1)}" r="${r.toFixed(1)}" fill="${cor('sol')}"/>`;
    }
  }
  s += poly(caminho([[-120, -79, -30], [120, -79, -30], [120, -79, 1.6], [-120, -79, 1.6]]), cor('mar'), 'none', 0);
  for (let i = 1; i < 6; i += 1) s += poly(caminho([[-120, -79, 1.6 - i * 0.9], [120, -79, 1.6 - i * 0.9]], false), 'none', cor('marLinha'), 1.4);
  for (const tw of torres) s += caixa(tw.x - tw.w / 2, tw.y - tw.prof, -30, tw.x + tw.w / 2, tw.y, tw.topo, { t: cor('torreTopo'), f: cor(tw.cor), l: cor(tw.cor) }, cor('torreLinha'), 1.1);

  // casca da sala
  const esq = (y, z) => [-hw, y, z];
  const dir = (y, z) => [hw, y, z];
  const fun = (x, z) => [x, -D, z];
  s += poly(caminho([[-hw, 0.4, 0], [hw, 0.4, 0], [hw, -D, 0], [-hw, -D, 0]]), cor('piso'), linha, 2);
  let lin = '';
  for (let x = -hw + 0.6; x < hw - 0.05; x += 0.6) lin += caminho([[x, 0.4, 0.002], [x, -D, 0.002]], false);
  for (let y = -0.6; y > -D + 0.05; y -= 0.6) lin += caminho([[-hw, y, 0.002], [hw, y, 0.002]], false);
  s += `<path d="${lin}" fill="none" stroke="${cor('pisoLinha')}" stroke-width="${w(1.5)}"/>`;
  {
    const zt = H;
    s += poly(caminho([[-hw, 0.4, zt], [hw, 0.4, zt], [hw, -D, zt], [-hw, -D, zt]]), cor('teto'), linha, 2);
    const m = 0.55, zs = zt - 0.001;
    s += poly(caminho([[-hw + m, 0.4, zs], [hw - m, 0.4, zs], [hw - m, -D + m, zs], [-hw + m, -D + m, zs]]), cor('sanca'), linha, 1.6);
    const k = Math.hypot(...[0, 1].map((i) => proj([100, 0])[i] - proj([0, 0])[i])) / 100;
    for (const [x, y] of [[-1.25, -4.2], [1.25, -4.2], [-1.25, -5.9], [1.25, -5.9]]) {
      const pc = tela([x, y, zs]), dp = profundidade([x, y, zs]);
      if (dp > PERTO) s += `<ellipse cx="${pc[0].toFixed(1)}" cy="${pc[1].toFixed(1)}" rx="${((c.f * 0.09 / dp) * k).toFixed(1)}" ry="${((c.f * 0.035 / dp) * k).toFixed(1)}" fill="${cor('spot')}" stroke="${linha}" stroke-width="${w(1)}"/>`;
    }
  }
  s += poly(caminho([esq(0.4, 0), esq(-D, 0), esq(-D, H), esq(0.4, H)]), cor('esquerda'), linha, 2);
  s += poly(caminho([dir(0.4, 0), dir(-D, 0), dir(-D, H), dir(0.4, H)]), cor('direita'), linha, 2);
  // quadro na parede direita
  s += poly(caminho([dir(-2.5, 1.05), dir(-4.2, 1.05), dir(-4.2, 2.1), dir(-2.5, 2.1)]), cor('passepartout'), linha, 2);
  s += poly(caminho([dir(-2.65, 1.2), dir(-4.05, 1.2), dir(-4.05, 1.95), dir(-2.65, 1.95)]), cor('quadro'), 'none', 0);
  const qs = []; for (let i = 0; i <= 16; i += 1) { const a = Math.PI * i / 16; qs.push(dir(-3.35 + 0.32 * Math.cos(a), 1.2 + 0.32 * Math.sin(a))); }
  s += poly(caminho(qs), cor('quadroSol'), 'none', 0);
  // parede do fundo com o vão da janela (evenodd)
  const ext = caminho([fun(-hw, 0), fun(hw, 0), fun(hw, H), fun(-hw, H)]);
  const vao = caminho([fun(J.x0, J.z0), fun(J.x0, J.z1), fun(J.x1, J.z1), fun(J.x1, J.z0)]);
  if (ext) s += `<path d="${ext}${vao}" fill="${cor('fundo')}" fill-rule="evenodd" stroke="${linha}" stroke-width="${w(2)}" stroke-linejoin="round"/>`;
  // caixilho: moldura, montante e travessa
  const mold = MOLD;
  const barra = (x0, z0, x1, z1) => poly(caminho([fun(x0, z0), fun(x1, z0), fun(x1, z1), fun(x0, z1)]), cor('moldura'), linha, 1.2);
  s += barra(J.x0 - mold.e, J.z0 - mold.e, J.x1 + mold.e, J.z0);
  s += barra(J.x0 - mold.e, J.z1, J.x1 + mold.e, J.z1 + mold.e);
  s += barra(J.x0 - mold.e, J.z0, J.x0, J.z1);
  s += barra(J.x1, J.z0, J.x1 + mold.e, J.z1);
  s += barra(mold.montanteX - 0.035, J.z0, mold.montanteX + 0.035, J.z1);
  s += barra(J.x0, mold.travessaZ - 0.03, J.x1, mold.travessaZ + 0.03);

  // luz do sol no chão: os vidros projetados pela direção do sol, e os feixes
  {
    const W = [0, -D, 1.37];
    const L = [W[0] - SOL[0], W[1] - SOL[1], W[2] - SOL[2]];
    if (L[2] < -0.02) {
      const paineis = [[J.x0, mold.montanteX - 0.035, J.z0, mold.travessaZ - 0.03], [mold.montanteX + 0.035, J.x1, J.z0, mold.travessaZ - 0.03],
                       [J.x0, mold.montanteX - 0.035, mold.travessaZ + 0.03, J.z1], [mold.montanteX + 0.035, J.x1, mold.travessaZ + 0.03, J.z1]];
      let luz = '', feixes = '';
      for (const [x0, x1, z0, z1] of paineis) {
        const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => { const sP = -z / L[2]; return [x + L[0] * sP, -D + L[1] * sP, 0.004]; });
        const rec = recortaRet(pts, -hw, hw, -D, 0.4);
        if (rec.length >= 3) luz += caminho(rec);
        const longe = rec.length >= 3 ? rec.reduce((a, p) => (p[1] > a[1] ? p : a), rec[0]) : null;
        if (longe) feixes += caminho([[x0, -D, z1], [x1, -D, z1], [x1 + L[0] * (-z0 / L[2]), longe[1], 0.01], [x0 + L[0] * (-z0 / L[2]), longe[1], 0.01]]);
      }
      s += `<path d="${luz}" fill="${cor('luz')}"/>`;
      feixesPorCima = `<path d="${feixes}" fill="${cor('feixe')}"/>`;
    }
  }

  // tapete e móveis
  s += poly(caminho([[-1.6, -3.1, 0.008], [1.25, -3.1, 0.008], [1.25, -5.6, 0.008], [-1.6, -5.6, 0.008]]), cor('tapete'), cor('tapeteBorda'), 3);
  const moveis = [
    { d: profundidade([-2.55, -4.5, 0.4]), s: () => {
        const so = { t: cor('sofaT'), f: cor('sofaF'), l: cor('sofaL') };
        return caixa(-hw + 0.02, -5.7, 0.08, -hw + 0.26, -3.3, 0.82, so, linha)
          + caixa(-hw + 0.24, -5.7, 0.08, -hw + 1.0, -3.3, 0.4, so, linha)
          + caixa(-hw + 0.24, -5.7, 0.08, -hw + 1.0, -5.5, 0.58, so, linha)
          + caixa(-hw + 0.24, -3.5, 0.08, -hw + 1.0, -3.3, 0.58, so, linha); } },
    { d: profundidade([-0.3, -4.45, 0.2]), s: () => caixa(-0.6, -4.75, 0, 0.0, -4.15, 0.26, { t: cor('mesaF'), f: cor('mesaL'), l: cor('mesaL') }, linha)
        + caixa(-0.95, -5.0, 0.26, 0.35, -3.9, 0.34, { t: cor('mesaT'), f: cor('mesaF'), l: cor('mesaL') }, linha) },
    { d: profundidade([hw - 0.3, -4.4, 0.3]), s: () => caixa(hw - 0.48, -5.6, 0.12, hw - 0.02, -3.4, 0.5, { t: cor('rackT'), f: cor('rackF'), l: cor('rackL') }, linha) },
  ].sort((a, b) => b.d - a.d);
  for (const m of moveis) s += m.s();

  // cortinas e vento (o vento corre com tv, o tempo da cena 01)
  const tv = o.tr;
  const forca = 0.25 + 0.75 * sp(T_ENCANTO - T01.a2, P.map);
  for (const [x0, x1, fase] of [[J.x0 - 0.75, J.x0 + 0.05, 0], [J.x1 - 0.05, J.x1 + 0.75, 1.7]]) {
    const pts = [[x0, -D + 0.12, H - 0.05], [x1, -D + 0.12, H - 0.05]];
    for (let i = 0; i <= 8; i += 1) {
      const u = 1 - i / 8;
      const x = lerp(x0, x1, u);
      const onda = Math.sin(tv * 2.1 + u * 5 + fase) * 0.5 + 0.5;
      pts.push([x + 0.05 * Math.sin(tv * 1.7 + u * 3 + fase) * forca, -D + 0.12 + forca * (0.18 + 0.32 * onda), 0.06 + 0.05 * onda * forca]);
    }
    s += poly(caminho(pts), cor('cortina'), linha, 1.2);
  }
  {
    let ven = '';
    const linhas = [[-0.55, 1.85, 0.3], [0.5, 1.6, 1.4], [-0.05, 2.15, 2.3], [0.85, 2.0, 3.6]];
    for (const [x0, z0, ph] of linhas) {
      const pts = [];
      for (let i = 0; i <= 28; i += 1) {
        const y = lerp(-D + 0.35, -2.5, i / 28);
        const abre = (y + D) / D;
        pts.push([x0 * (1 + 1.2 * abre) + 0.18 * Math.sin(0.8 * y + ph), y, z0 - 0.15 * abre + 0.08 * Math.sin(1.2 * y + ph * 1.7)]);
      }
      ven += caminho(pts, false);
    }
    s += feixesPorCima; feixesPorCima = '';
    s += `<path d="${ven}" fill="none" stroke="${cor('vento')}" stroke-width="${w(2.6)}" stroke-linecap="round" stroke-dasharray="${w(420)} ${w(700)}" stroke-dashoffset="${(-tv * 360 * esc).toFixed(1)}" opacity="${(0.8 * forca).toFixed(3)}"/>`;
  }
  s += feixesPorCima;

  // janela projetada: o vão (vidro) e a moldura por fora, como [x0, y0, x1, y1]
  const v0 = tela(fun(J.x0, J.z1)), v1 = tela(fun(J.x1, J.z0));
  const m0 = tela(fun(J.x0 - mold.e, J.z1 + mold.e)), m1 = tela(fun(J.x1 + mold.e, J.z0 - mold.e));
  return { svg: s, vidro: [v0[0], v0[1], v1[0], v1[1]], moldura: [m0[0], m0[1], m1[0], m1[1]] };
}
