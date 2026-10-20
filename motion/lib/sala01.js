// A sala da cena 01, variante 1 (janela), como função pura do tempo da cena 01.
//
// Cópia do desenho de motion/poc/cena01.html (?v=1): mesma câmera pinhole, mesmas torres
// (rng(81)), mesmas cores de noite e mesmo caixilho que se abre num vão só. A cena 01 não
// importa este módulo (tem o código embutido); a cena 09 usa salaV1(18) para trazer de volta o
// quadro final dela, redesenhado em SVG, sem imagem escalada. Só o que a variante 1 desenha
// no fim está aqui: a cota de "75 m²" e a luz no chão já valem zero nesse trecho e saíram.
//
// Roteiro gravado de 18/10/2026: a cena 01 ?v=1 encurtada (T01C, DUR01C) importa daqui os marcos e a
// regra do número; salaV1(t, { curta: true }) desenha o mesmo quadro que ela (a cena 02 abre nele).
// Sem opção, tudo fica como antes (a cena 09 continua com salaV1(18)).
import { clamp, lerp, invLerp, smooth, sp, rng, PRESETS as P } from './motion.js';
import { caminho, caixa, poly, tela, profundidade, recortaRet, PERTO } from './espaco3d.js';

export const DUR01 = 18;
const TA = { anuncio: 3.6, a1: 4.4, a2: 5.9, a3: 7.3, a4: 8.6, lar: 9.8, mas: 11.0, colapso: 12.2, numero: 14.6, apoio: 15.6 };
const LENTO = { k: 4, d: 4 };
const DOLLY = { k: 12, d: 7 };

// Marcos da cena 01 ?v=1 na gravação de 18/10/2026 (tempo local da cena; a fala começa em 0,28 s).
// Cada evento chega cerca de 0,1 s antes da palavra: "75" 3,6 · "super ventilado" 5,03 · "sol" 5,80 ·
// "taxa" 7,10 · "Mas" 9,96 · "contrato hoje" 10,6 a 11,1 · "milhares" 12,38 · "de reais" 12,70 · fim de "anos" 13,65.
export const T01C = { anuncio: 3.0, a1: 3.5, a2: 4.95, a3: 5.7, a4: 7.0, lar: 8.95, mas: 9.9, colapso: 10.75, numero: 12.3, apoio: 12.65 };
export const DUR01C = 13.8;
export const HOLD01C = 2.95;                    // fim de "Recife.": a abertura chega parada antes de 2,85 s
export const ABRE_J01C = 1.0;                    // o caixilho se abre 1,0 s depois do colapso (antes: 1,2 s)
// molas que têm de parar de vez: o último 0,1% vira o próprio fim (o quadro do HOLD é o estado final)
export const fim01 = (x, lim = 0.999) => Math.min(1, x / lim);
export const ABRE01C = sp(HOLD01C - 0.12, LENTO), LUZ01C = sp(HOLD01C - 0.12 - 0.15, LENTO);
// "MILHARES" e "de reais" no vão (frações da altura h do vão): tamanhos, margem de baixo do apoio
// até o peitoril e vão entre os dois. Os dois sobem juntos, como um bloco, de trás do peitoril, com uma
// mola de zeta 1 (a mais rápida que fica abaixo de cerca de 38 px por quadro); "de reais" aparece
// por último, por estar embaixo
export const NUM01C = { fs: 0.30, ap: 0.085, mb: 0.15, gap: 0.066, mola: { k: 44, d: 13.27 } };   // subida de cerca de 473 px: até 38,5 px por quadro
// topo final do número (yN) e do apoio (yA) e o topo escondido logo abaixo do peitoril (yEsc), em px do vão
export function layout01C(h, nh, apH, o = NUM01C) {
  const yA = h * (1 - o.mb) - apH;
  const yN = yA - h * o.gap - nh;
  return { yN, yA, yEsc: h * 1.02 };
}

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
  quadro: hex('#E9734F'), quadroSol: hex('#FFC46B'), passepartout: hex('#FFF7EA'), cota: hex('#C8643A', 0.9),
};
// V1 noite: tudo escuro, contorno branco, céu preto; só o número leva cor
const MONO1 = { piso: '#141414', pisoLinha: '#2A2A2A', fundo: '#1C1C1C', esquerda: '#232323', direita: '#191919', teto: '#101010',
  ceu1: '#0B0B0B', ceu2: '#0B0B0B', ceu3: '#0E0E0E', mar: '#121212', marLinha: '#2A2A2A', torreA: '#202020', torreB: '#1A1A1A', torreC: '#242424', torreTopo: '#2E2E2E',
  sol: '#2A2A2A', halo: '#000000', luz: '#FFFFFF', feixe: '#FFFFFF', sanca: '#161616', spot: '#2A2A2A', torreLinha: '#3A3A3A', moldura: '#F2EBDD', contorno: '#F2EBDD', cortina: '#2A2A2A', vento: '#555555',
  sofaT: '#3A3A3A', sofaF: '#2C2C2C', sofaL: '#222222', tapete: '#262626', tapeteBorda: '#3A3A3A', mesaT: '#404040', mesaF: '#303030', mesaL: '#262626',
  rackT: '#3A3A3A', rackF: '#2C2C2C', rackL: '#222222', quadro: '#303030', quadroSol: '#3A3A3A', passepartout: '#262626', cota: '#555555' };
const MONOH = {};
for (const [k, h] of Object.entries(MONO1)) MONOH[k] = hex(h, QUENTE[k][3]);
MONOH.luz[3] = 0; MONOH.feixe[3] = 0; MONOH.halo[3] = 0;

function tinta(chave, dsat, k) {
  const q = QUENTE[chave];
  const l = 0.299 * q[0] + 0.587 * q[1] + 0.114 * q[2];
  const d = [lerp(q[0], l, dsat), lerp(q[1], l, dsat), lerp(q[2], l, dsat)];
  const m = MONOH[chave];
  const r = lerp(d[0], m[0], k), g = lerp(d[1], m[1], k), b = lerp(d[2], m[2], k), a = lerp(q[3], m[3], k);
  return `rgba(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)},${a.toFixed(3)})`;
}

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

function geometria(t, T = TA) {
  const amplo = sp(t - T.a1, P.map);
  return { hw: lerp(3.05, 3.4, amplo), D: lerp(6.6, 7.3, amplo), H: 2.8, amplo };
}
function tempoVento(t, T = TA) {
  if (t <= T.mas) return t;
  const tau = 0.22;
  return T.mas + tau * (1 - Math.exp(-(t - T.mas) / tau));
}
const SOL_X = 2.4, SOL_Y = -38;
const trilha = (t, keys, p) => { let v = keys[0][1]; for (let i = 1; i < keys.length; i += 1) { const q = keys[i][2] || p; v += (keys[i][1] - keys[i - 1][1]) * sp(t - keys[i][0], q); } return v; };
const solZ = (t, T = TA) => trilha(t, [[0, 2.6], [T.a3, 5.4, P.map], [T.mas, -3.0, DOLLY]], P.map);

export function camera01(t, o = {}) {
  // curta: a abertura para antes do HOLD de "Recife.", sem a respiração do yaw, e o último avanço
  // (0,35 m) termina 0,2 s antes do fim, para o quadro final ficar parado
  const T = o.curta ? T01C : TA;
  const abre = o.curta ? fim01(sp(t, LENTO), ABRE01C) : sp(t, LENTO);
  let pos = [lerp(0.6, 0.05, abre), lerp(2.6, 0.55, abre), lerp(1.6, 1.42, abre)];
  pos = [pos[0], pos[1] + 0.6 * sp(t - T.a1, P.map), pos[2]];
  const f = 1180;
  let pitch = -0.03, yaw = lerp(-0.06, 0, abre) + (o.curta ? 0 : 0.012 * Math.sin(t * 0.35));
  const quebra = sp(t - T.mas, P.camera);
  const roll = 0.026 * quebra * (1 - sp(t - T.colapso, P.camera));
  const g = geometria(t, T);
  const entra = o.curta ? fim01(sp(t - T.colapso, DOLLY)) : sp(t - T.colapso, DOLLY);
  pos = [lerp(pos[0], 0, entra), lerp(pos[1], -g.D + 3.6, entra), lerp(pos[2], 1.25, entra)];
  pitch = lerp(pitch, 0, entra); yaw = lerp(yaw, 0, entra);
  const deriva = o.curta ? smooth(invLerp(T.colapso + 1.3, DUR01C - 0.2, t)) : sp(t - (T.colapso + 1.3), { k: 3, d: 3.46 });
  pos = [pos[0], pos[1] - 0.35 * deriva, pos[2]];
  return { pos, f, roll, pitch, yaw };
}

function desenharSala(t, c, dsat, k, opts) {
  const T = opts.curta ? T01C : TA;
  const { hw, D, H } = geometria(t, T);
  const cor = (ch) => tinta(ch, dsat, k);
  const linha = cor('contorno');
  let s = '';
  let feixesPorCima = '';
  // lá fora: céu em faixas, mar, sol e torres
  s += '<g opacity="1.000">';
  const yc = -80;
  s += poly(caminho([[-120, yc, 1.6], [120, yc, 1.6], [120, yc, 80], [-120, yc, 80]], c), cor('ceu1'), 'none', 0);
  s += poly(caminho([[-120, yc, 1.6], [120, yc, 1.6], [120, yc, 9], [-120, yc, 9]], c), cor('ceu2'), 'none', 0);
  s += poly(caminho([[-120, yc, 1.6], [120, yc, 1.6], [120, yc, 4.2], [-120, yc, 4.2]], c), cor('ceu3'), 'none', 0);
  const sz = solZ(t, T), sc = tela([SOL_X, SOL_Y, sz], c), sd = profundidade([SOL_X, SOL_Y, sz], c);
  if (sd > PERTO) {
    const r = (c.f * 2.3) / sd;
    s += `<circle cx="${sc[0].toFixed(1)}" cy="${sc[1].toFixed(1)}" r="${(r * 2.6).toFixed(1)}" fill="${cor('halo')}" opacity="0.5"/>`;
    s += `<circle cx="${sc[0].toFixed(1)}" cy="${sc[1].toFixed(1)}" r="${(r * 1.7).toFixed(1)}" fill="${cor('halo')}"/>`;
    s += `<circle cx="${sc[0].toFixed(1)}" cy="${sc[1].toFixed(1)}" r="${r.toFixed(1)}" fill="${cor('sol')}"/>`;
  }
  s += poly(caminho([[-120, -79, -30], [120, -79, -30], [120, -79, 1.6], [-120, -79, 1.6]], c), cor('mar'), 'none', 0);
  for (let i = 1; i < 6; i += 1) s += poly(caminho([[-120, -79, 1.6 - i * 0.9], [120, -79, 1.6 - i * 0.9]], c, false), 'none', cor('marLinha'), 1.4);
  for (const tw of torres) s += caixa(tw.x - tw.w / 2, tw.y - tw.prof, -30, tw.x + tw.w / 2, tw.y, tw.topo, { t: cor('torreTopo'), f: cor(tw.cor), l: cor(tw.cor) }, c, cor('torreLinha'), 1.1);
  s += '</g>';

  // casca da sala
  const esq = (y, z) => [-hw, y, z];
  const dir = (y, z) => [hw, y, z];
  const fun = (x, z) => [x, -D, z];
  s += poly(caminho([[-hw, 0.4, 0], [hw, 0.4, 0], [hw, -D, 0], [-hw, -D, 0]], c), cor('piso'), linha, 2);
  let lin = '';
  for (let x = -hw + 0.6; x < hw - 0.05; x += 0.6) lin += caminho([[x, 0.4, 0.002], [x, -D, 0.002]], c, false);
  for (let y = -0.6; y > -D + 0.05; y -= 0.6) lin += caminho([[-hw, y, 0.002], [hw, y, 0.002]], c, false);
  s += `<path d="${lin}" fill="none" stroke="${cor('pisoLinha')}" stroke-width="1.5"/>`;
  {
    const zt = H;
    let teto = poly(caminho([[-hw, 0.4, zt], [hw, 0.4, zt], [hw, -D, zt], [-hw, -D, zt]], c), cor('teto'), linha, 2);
    const m = 0.55, zs = zt - 0.001;
    teto += poly(caminho([[-hw + m, 0.4, zs], [hw - m, 0.4, zs], [hw - m, -D + m, zs], [-hw + m, -D + m, zs]], c), cor('sanca'), linha, 1.6);
    for (const [x, y] of [[-1.25, -4.2], [1.25, -4.2], [-1.25, -5.9], [1.25, -5.9]]) {
      const pc = tela([x, y, zs], c), dp = profundidade([x, y, zs], c);
      if (dp > PERTO) teto += `<ellipse cx="${pc[0].toFixed(1)}" cy="${pc[1].toFixed(1)}" rx="${(c.f * 0.09 / dp).toFixed(1)}" ry="${(c.f * 0.035 / dp).toFixed(1)}" fill="${cor('spot')}" stroke="${linha}" stroke-width="1"/>`;
    }
    s += '<g opacity="1.000">' + teto + '</g>';
  }
  s += poly(caminho([esq(0.4, 0), esq(-D, 0), esq(-D, H), esq(0.4, H)], c), cor('esquerda'), linha, 2);
  s += poly(caminho([dir(0.4, 0), dir(-D, 0), dir(-D, H), dir(0.4, H)], c), cor('direita'), linha, 2);
  s += poly(caminho([dir(-2.5, 1.05), dir(-4.2, 1.05), dir(-4.2, 2.1), dir(-2.5, 2.1)], c), cor('passepartout'), linha, 2);
  s += poly(caminho([dir(-2.65, 1.2), dir(-4.05, 1.2), dir(-4.05, 1.95), dir(-2.65, 1.95)], c), cor('quadro'), 'none', 0);
  const qs = []; for (let i = 0; i <= 16; i += 1) { const a = Math.PI * i / 16; qs.push(dir(-3.35 + 0.32 * Math.cos(a), 1.2 + 0.32 * Math.sin(a))); }
  s += poly(caminho(qs, c), cor('quadroSol'), 'none', 0);
  // parede do fundo com o vão da janela (evenodd)
  const J = { x0: -1.85, x1: 1.85, z0: 0.25, z1: 2.5 };
  const ext = caminho([fun(-hw, 0), fun(hw, 0), fun(hw, H), fun(-hw, H)], c);
  const vao = caminho([fun(J.x0, J.z0), fun(J.x0, J.z1), fun(J.x1, J.z1), fun(J.x1, J.z0)], c);
  if (ext) s += `<path d="${ext}${vao}" fill="${cor('fundo')}" fill-rule="evenodd" stroke="${linha}" stroke-width="2" stroke-linejoin="round"/>`;
  const mold = opts.moldura;
  const barra = (x0, z0, x1, z1) => poly(caminho([fun(x0, z0), fun(x1, z0), fun(x1, z1), fun(x0, z1)], c), cor('moldura'), linha, 1.2);
  s += barra(J.x0 - mold.e, J.z0 - mold.e, J.x1 + mold.e, J.z0);
  s += barra(J.x0 - mold.e, J.z1, J.x1 + mold.e, J.z1 + mold.e);
  s += barra(J.x0 - mold.e, J.z0, J.x0, J.z1);
  s += barra(J.x1, J.z0, J.x1 + mold.e, J.z1);
  if (mold.divisoes > 0.01) {
    s += `<g opacity="${mold.divisoes.toFixed(3)}">`;
    s += barra(mold.montanteX - 0.035, J.z0, mold.montanteX + 0.035, J.z1);
    s += barra(J.x0, mold.travessaZ - 0.03, J.x1, mold.travessaZ + 0.03);
    s += '</g>';
  }
  // luz do sol no chão (na noite já vale zero; o cálculo fica para o mesmo desenho da cena 01)
  const S = [SOL_X, SOL_Y, sz];
  const W = [0, -D, 1.37];
  const L = [W[0] - S[0], W[1] - S[1], W[2] - S[2]];
  const intens = opts.luz ?? 1;
  if (L[2] < -0.02 && intens > 0.01) {
    const paineis = [[J.x0, mold.montanteX - 0.035, J.z0, mold.travessaZ - 0.03], [mold.montanteX + 0.035, J.x1, J.z0, mold.travessaZ - 0.03],
                     [J.x0, mold.montanteX - 0.035, mold.travessaZ + 0.03, J.z1], [mold.montanteX + 0.035, J.x1, mold.travessaZ + 0.03, J.z1]];
    let luz = '', feixes = '';
    for (const [x0, x1, z0, z1] of paineis) {
      const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => { const sP = -z / L[2]; return [x + L[0] * sP, -D + L[1] * sP, 0.004]; });
      const rec = recortaRet(pts, -hw, hw, -D, 0.4);
      if (rec.length >= 3) luz += caminho(rec, c);
      const longe = rec.length >= 3 ? rec.reduce((a, p) => (p[1] > a[1] ? p : a), rec[0]) : null;
      if (longe) feixes += caminho([[x0, -D, z1], [x1, -D, z1], [x1 + L[0] * (-z0 / L[2]), longe[1], 0.01], [x0 + L[0] * (-z0 / L[2]), longe[1], 0.01]], c);
    }
    s += `<path d="${luz}" fill="${cor('luz')}" opacity="${intens.toFixed(3)}"/>`;
    feixesPorCima = `<path d="${feixes}" fill="${cor('feixe')}" opacity="${intens.toFixed(3)}"/>`;
  }
  // tapete e móveis
  const hz = (z) => z;
  s += poly(caminho([[-1.6, -3.1, 0.008], [1.25, -3.1, 0.008], [1.25, -5.6, 0.008], [-1.6, -5.6, 0.008]], c), cor('tapete'), cor('tapeteBorda'), 3);
  const moveis = [
    { d: profundidade([-2.55, -4.5, 0.4], c), s: () => {
        const so = { t: cor('sofaT'), f: cor('sofaF'), l: cor('sofaL') };
        return caixa(-hw + 0.02, -5.7, 0.08, -hw + 0.26, -3.3, hz(0.82), so, c, linha)
          + caixa(-hw + 0.24, -5.7, 0.08, -hw + 1.0, -3.3, hz(0.4), so, c, linha)
          + caixa(-hw + 0.24, -5.7, 0.08, -hw + 1.0, -5.5, hz(0.58), so, c, linha)
          + caixa(-hw + 0.24, -3.5, 0.08, -hw + 1.0, -3.3, hz(0.58), so, c, linha); } },
    { d: profundidade([-0.3, -4.45, 0.2], c), s: () => caixa(-0.6, -4.75, 0, 0.0, -4.15, hz(0.26), { t: cor('mesaF'), f: cor('mesaL'), l: cor('mesaL') }, c, linha)
        + caixa(-0.95, -5.0, hz(0.26), 0.35, -3.9, hz(0.34), { t: cor('mesaT'), f: cor('mesaF'), l: cor('mesaL') }, c, linha) },
    { d: profundidade([hw - 0.3, -4.4, 0.3], c), s: () => caixa(hw - 0.48, -5.6, 0.12, hw - 0.02, -3.4, hz(0.5), { t: cor('rackT'), f: cor('rackF'), l: cor('rackL') }, c, linha) },
  ].sort((a, b) => b.d - a.d);
  for (const m of moveis) s += m.s();
  // cortinas e vento
  const tv = tempoVento(t, T);
  // curta: o vento só começa em "super ventilado" (a abertura fica parada no HOLD de "Recife.")
  const forca = opts.curta ? sp(t - T.a2, P.map) : 0.25 + 0.75 * sp(t - T.a2, P.map);
  for (const [x0, x1, fase] of [[J.x0 - 0.75, J.x0 + 0.05, 0], [J.x1 - 0.05, J.x1 + 0.75, 1.7]]) {
    const pts = [[x0, -D + 0.12, H - 0.05], [x1, -D + 0.12, H - 0.05]];
    for (let i = 0; i <= 8; i += 1) {
      const u = 1 - i / 8;
      const x = lerp(x0, x1, u);
      const onda = Math.sin(tv * 2.1 + u * 5 + fase) * 0.5 + 0.5;
      pts.push([x + 0.05 * Math.sin(tv * 1.7 + u * 3 + fase) * forca, -D + 0.12 + forca * (0.18 + 0.32 * onda), 0.06 + 0.05 * onda * forca]);
    }
    s += '<g opacity="1.000">' + poly(caminho(pts, c), cor('cortina'), linha, 1.2) + '</g>';
  }
  if (forca > 0.01) {
    let ven = '';
    const linhas = [[-0.55, 1.85, 0.3], [0.5, 1.6, 1.4], [-0.05, 2.15, 2.3], [0.85, 2.0, 3.6]];
    for (const [x0, z0, ph] of linhas) {
      const pts = [];
      for (let i = 0; i <= 28; i += 1) {
        const y = lerp(-D + 0.35, -2.5, i / 28);
        const abre = (y + D) / D;
        pts.push([x0 * (1 + 1.2 * abre) + 0.18 * Math.sin(0.8 * y + ph), y, z0 - 0.15 * abre + 0.08 * Math.sin(1.2 * y + ph * 1.7)]);
      }
      ven += caminho(pts, c, false);
    }
    const desloc = -tv * 360;
    s += feixesPorCima; feixesPorCima = '';
    s += `<path d="${ven}" fill="none" stroke="${cor('vento')}" stroke-width="2.6" stroke-linecap="round"  stroke-dasharray="420 700" stroke-dashoffset="${desloc.toFixed(1)}" opacity="${(0.8 * forca * (opts.ventoOpacidade ?? 1)).toFixed(3)}"/>`;
  }
  return s + feixesPorCima;
}

// O quadro da variante 1 no tempo t da cena 01 (a cena 09 usa t = 18, o HOLD final dela).
// Devolve o SVG da sala, a cor de fundo do #c e a geometria da janela e do número, nas mesmas
// fórmulas de render() da cena 01: o vão (vidro), a moldura por fora e a base da moldura.
export function salaV1(t = DUR01, o = {}) {
  const curta = !!o.curta;
  const T = curta ? T01C : TA;
  t = clamp(t, 0, curta ? DUR01C : DUR01);
  const c = camera01(t, o);
  const g = geometria(t, T);
  const dsat = 0.72 * sp(t - T.mas, P.camera);
  const k = curta ? fim01(sp(t - (T.colapso + 0.2), P.camera)) : sp(t - (T.colapso + 0.2), P.camera);
  const abreJanela = curta ? fim01(sp(t - (T.colapso + ABRE_J01C), P.card)) : sp(t - (T.colapso + 1.2), P.card);
  const mold = { e: lerp(0.08, 0.16, abreJanela), montanteX: lerp(0, -1.85, abreJanela), travessaZ: lerp(1.95, 2.5, abreJanela), divisoes: 1 - invLerp(0.6, 1, abreJanela) };
  const luzA = (curta ? fim01(sp(t - 0.15, LENTO), LUZ01C) : sp(t - 0.15, LENTO)) * (1 - sp(t - T.mas, P.camera));
  const cotaA = sp(t - (T.a1 + 0.08), P.map);
  const svg = desenharSala(t, c, dsat, k, { cota: cotaA * (1 - k), moldura: mold, luz: luzA * (1 - k), ventoOpacidade: 1 - k, curta });
  const D = g.D;
  const sup = tela([0, -D, 2.5], c), inf = tela([0, -D, 0.25], c), esq = tela([-1.85, -D, 1.3], c), dir = tela([1.85, -D, 1.3], c);
  const fSup = tela([0, -D, 2.5 + mold.e], c), fInf = tela([0, -D, 0.25 - mold.e], c), fEsq = tela([-1.85 - mold.e, -D, 1.3], c), fDir = tela([1.85 + mold.e, -D, 1.3], c);
  const chao = tela([0, -D, 0], c);
  return {
    svg,
    fundo: tinta('fundo', dsat, k),
    // vão da janela (o vidro), em px do quadro: é também o recorte do número na cena 01
    vidro: { x0: esq[0], y0: sup[1], x1: dir[0], y1: inf[1] },
    // moldura por fora (o caixilho creme) e a linha do chão na parede do fundo
    moldura: { x0: fEsq[0], y0: fSup[1], x1: fDir[0], y1: fInf[1] },
    chao: chao[1],
    // número e apoio da cena 01 (render(), V === 1): tamanho do número e posição do apoio
    numero: curta
      ? { fontSize: (inf[1] - sup[1]) * NUM01C.fs, sobe: 1 - fim01(sp(t - T.numero, NUM01C.mola)) }
      : { fontSize: (inf[1] - sup[1]) * 0.265, sobe: 1 - sp(t - T.numero, { k: 120, d: 22 }) },
    apoioTop: fInf[1] + 30 + 10 * (1 - sp(t - T.apoio, { k: 260, d: 31 })),
    // curta: "de reais" fica dentro do vão, logo abaixo do número, e sobe junto com ele
    ...(curta ? { apoio: { fontSize: (inf[1] - sup[1]) * NUM01C.ap } } : {}),
  };
}
