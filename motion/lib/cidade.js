// Cidade estilizada do VEREDA (REF-01 na marca), desenhada em SVG por quadros projetados.
//
// criarCidade(opções) gera a geometria uma vez, com rng(semente): quadras na grade do
// POC-01 perto do lote e edifícios em volumes simples (faces em tons da marca, topo de
// papel, contorno fino). desenharChao() e desenharVolumes() projetam com a câmera 2.5D
// de motion.js (project) e devolvem SVG em texto: função pura da câmera e do tempo que a
// cena passa (crescer), sem estado entre quadros. pintarVolumes() e pintarPrisma() pintam o mesmo
// desenho num <canvas> 2D, para planos com milhares de faces (o DOM do SVG custa caro ao vivo).
//
// Mundo em metros: x para leste, y para o sul, z para cima; origem no centro do lote.
// As quadras são ilustrativas (não é o traçado de Boa Viagem): a tela tem de dizer isso.
import { rng, project, clamp, lerp, roundedQuad } from './motion.js';

// ---------------------------------------------------------------------------
// Paletas. "quente" é a versão da marca da REF-01 (docs/reference-analysis.md, seção 6);
// "dessaturado" é papel, tinta e ferrugem, para as cenas de problema (cena 3).
// ---------------------------------------------------------------------------
export const PALETAS = {
  quente: {
    claro: '#F47745', medio: '#E06332', sombra: '#B94E36', topo: '#FAF6EE',
    contorno: '#FFFFFF', calcada: '#EADFCB', faixa: 'rgba(255,255,255,0.30)', ponto: 'rgba(250,246,238,0.70)',
    destaque: '#B94E36', traco: 1,
  },
  dessaturado: {
    claro: '#FAF6EE', medio: '#EFE7D8', sombra: '#E0D6C3', topo: '#FFFFFF',
    contorno: '#171717', calcada: '#E9E1D2', faixa: 'rgba(23,23,23,0.14)', ponto: 'rgba(23,23,23,0.32)',
    destaque: '#B94E36', traco: 0.6,
  },
};

const hexRgb = (c) => {
  if (c.startsWith('#')) return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 1];
  const m = c.match(/rgba?\(([^)]+)\)/);
  const v = m[1].split(',').map(Number);
  return [v[0], v[1], v[2], v[3] ?? 1];
};
const rgbTxt = ([r, g, b, a]) => (a >= 0.999 ? `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}` : `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a.toFixed(3)})`);
// Mistura duas paletas (0 = a, 1 = b), para uma cena que esquenta ou esfria a cidade.
export function misturarPaleta(a, b, p) {
  const out = {};
  for (const k of Object.keys(a)) {
    if (typeof a[k] === 'number') out[k] = lerp(a[k], b[k], p);
    else { const x = hexRgb(a[k]), y = hexRgb(b[k]); out[k] = rgbTxt(x.map((v, i) => lerp(v, y[i], p))); }
  }
  return out;
}

// Grade de quadras: a mesma do POC-01 perto do lote (110 × 86 m, ruas de 12 m), com duas
// avenidas mais largas a leste e a oeste, e duas no sentido norte-sul do lote.
export function quadra(i, j) {
  const x0 = 122 * i - 20 + (i >= 2 ? 12 : 0) - (i <= -3 ? 6 : 0) + (i >= 9 ? 14 : 0) - (i <= -9 ? 14 : 0);
  const y0 = 98 * j - 43 + (j >= 4 ? 12 : 0) - (j <= -5 ? 12 : 0) + (j >= 11 ? 12 : 0) - (j <= -12 ? 12 : 0);
  return { x0, y0, x1: x0 + 110, y1: y0 + 86 };
}

const dentro = (r, q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0;

// ---------------------------------------------------------------------------
// Geometria
// ---------------------------------------------------------------------------
export function criarCidade(o = {}) {
  const {
    semente = 327, raio = 1900, raioDetalhe = 560, raioMedio = 1450,
    reservados = [],          // retângulos {x0,y0,x1,y1} onde nada é gerado (o lote do prédio)
    lotes = null,             // (i, j, q) → lista de lotes {x0,y0,x1,y1} para fixar uma quadra
    teto = null,              // (x, y, r) → altura máxima em metros, para abrir a vista do lote
    // longe = false: a borda da cidade (além de raioMedio) fica só com as calçadas
  } = o;
  const r = rng(semente);
  const quadras = [];
  const edificios = [];
  const capPadrao = (x, y, d) => (d < 130 ? 12 + 0.3 * d : 30 + 0.16 * d);
  const cap = teto || capPadrao;
  const n = Math.ceil(raio / 98) + 2;
  for (let i = -n; i <= n; i += 1) {
    for (let j = -n; j <= n; j += 1) {
      const q = quadra(i, j);
      const qc = [(q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2];
      const dq = Math.hypot(qc[0], qc[1]);
      if (dq > raio) continue;
      quadras.push({ ...q, i, j, r: dq, cx: qc[0], cy: qc[1] });
      const fixos = lotes ? lotes(i, j, q) : null;
      let lista = [];
      if (fixos) lista = fixos.map((l) => ({ ...l, nivel: 0 }));
      else if (dq < raioMedio) {
        // duas fileiras de lotes de 18 a 36 m, como as divisas do POC-01; o anel médio usa a
        // mesma divisão (a densidade não muda de um anel para o outro), sem os detalhes
        const nivel = dq < raioDetalhe ? 0 : 1;
        for (const [ya, yb] of [[q.y0, q.y0 + 43], [q.y0 + 43, q.y1]]) {
          let x = q.x0;
          while (x < q.x1 - 6) {
            const w = Math.min(q.x1 - x, 18 + r() * 18);
            lista.push({ x0: x, y0: ya, x1: (q.x1 - (x + w) < 12 ? q.x1 : x + w), y1: yb, nivel });
            x = lista[lista.length - 1].x1;
          }
        }
      } else if (o.longe !== false && r() < 0.86) {
        // anel de fora: um volume por quadra (ou nenhum, com longe: false, e a borda fica só chão)
        lista.push({ x0: q.x0, y0: q.y0, x1: q.x1, y1: q.y1, nivel: 2 });
      }
      for (const lt of lista) {
        if (reservados.some((rs) => dentro(lt, rs))) continue;
        const u = r(), v = r(), w = r(), zz = r();
        if (lt.nivel < 2 && u < 0.07) continue;   // terreno vazio: dá respiro à quadra
        const cx = (lt.x0 + lt.x1) / 2, cy = (lt.y0 + lt.y1) / 2;
        const d = Math.hypot(cx, cy);
        const teto0 = cap(cx, cy, d);
        const recuo = lt.nivel === 2 ? 7 : lt.nivel === 1 ? 4 : 2.5 + v * 2;
        const b = { x0: lt.x0 + recuo, y0: lt.y0 + recuo, x1: lt.x1 - recuo, y1: lt.y1 - recuo };
        if (b.x1 - b.x0 < 5 || b.y1 - b.y0 < 5) continue;
        let tipo, h;
        const pTorre = lt.nivel === 2 ? 0.4 : clamp(0.08 + d / 1500, 0.08, 0.32);
        if (w < pTorre) { tipo = 'torre'; h = 34 + v * 62; }
        else if (w < 0.85) { tipo = 'lamina'; h = 9 + v * 20; }
        else { tipo = 'baixo'; h = 4 + v * 6; }
        h = Math.max(4, Math.min(h, teto0));
        if (h < 22 && tipo === 'torre') tipo = 'lamina';
        const caixas = [];
        let corpo = b;
        if (tipo === 'torre' && lt.nivel === 0) {
          // torre sobre embasamento: base baixa no lote inteiro, lâmina alta recuada
          const base = 4 + zz * 4;
          caixas.push({ ...b, z0: 0, z1: base });
          const ix = (b.x1 - b.x0) * (0.08 + 0.1 * u), iy = (b.y1 - b.y0) * (0.08 + 0.1 * w);
          corpo = { x0: b.x0 + ix, y0: b.y0 + iy, x1: b.x1 - ix, y1: b.y1 - iy };
          caixas.push({ ...corpo, z0: base, z1: h });
        } else caixas.push({ ...b, z0: 0, z1: h });
        if (tipo === 'torre') {
          // coroa: um volume menor no topo, às vezes dois
          const c1 = 2 + zz * 2.5;
          const coroa = { x0: corpo.x0 + c1, y0: corpo.y0 + c1, x1: corpo.x1 - c1, y1: corpo.y1 - c1 };
          if (coroa.x1 - coroa.x0 > 3 && coroa.y1 - coroa.y0 > 3) caixas.push({ ...coroa, z0: h, z1: h + 3 + v * 5 });
          if (zz > 0.6 && lt.nivel < 2) {
            const m = [(coroa.x0 + coroa.x1) / 2, (coroa.y0 + coroa.y1) / 2];
            caixas.push({ x0: m[0] - 2.2, y0: m[1] - 2.2, x1: m[0] + 2.2, y1: m[1] + 2.2, z0: caixas[caixas.length - 1].z1, z1: caixas[caixas.length - 1].z1 + 3 });
          }
        } else if (tipo === 'lamina' && lt.nivel === 0 && zz < 0.4) {
          // caixa-d'água
          const m = [lerp(b.x0, b.x1, 0.3 + 0.4 * u), lerp(b.y0, b.y1, 0.3 + 0.4 * v)];
          caixas.push({ x0: m[0] - 2.5, y0: m[1] - 2, x1: m[0] + 2.5, y1: m[1] + 2, z0: h, z1: h + 2.6 });
        }
        edificios.push({
          cx, cy, r: d, u: r(), tipo, nivel: lt.nivel, caixas,
          tom: r() < 0.24 ? 1 : 0,
          iCorpo: tipo === 'torre' && lt.nivel === 0 ? 1 : 0,
          faixas: tipo === 'torre' && lt.nivel < 2,
          pontos: tipo === 'lamina' && lt.nivel === 0 && h > 11 && zz > 0.78,
        });
      }
    }
  }
  return { quadras, edificios };
}

// ---------------------------------------------------------------------------
// Câmera de motion.js: posição no mundo, para descartar faces de costas e ordenar
// ---------------------------------------------------------------------------
export function posicaoCamera(cam) {
  const D = cam.focal / cam.s;
  const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
  const yr = D * Math.sin(cam.pitch), z = D * Math.cos(cam.pitch);
  return [yr * s, yr * c, z];
}

const f1 = (v) => v.toFixed(1);
const pD = (pts) => 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';

// Chão: as quadras como calçadas arredondadas, num path só. vista = retângulo de tela.
export function desenharChao(cidade, cam, o = {}) {
  const vista = o.vista || { x0: -60, y0: -60, x1: 1980, y1: 1140 };
  const filtro = o.filtro || null;
  const rr = clamp(4 * cam.s, 1, 16);
  let d = '';
  for (const q of cidade.quadras) {
    if (filtro && !filtro(q)) continue;
    const pts = [[q.x0, q.y0], [q.x1, q.y0], [q.x1, q.y1], [q.x0, q.y1]].map((p) => project(p, cam));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    if (Math.max(...xs) < vista.x0 || Math.min(...xs) > vista.x1 || Math.max(...ys) < vista.y0 || Math.min(...ys) > vista.y1) continue;
    d += roundedQuad(pts, rr);
  }
  return d;
}

// Luz fixa do sul-sudoeste: a face sul é a clara, a oeste a média, leste e norte a sombra.
const RANK = { s: 0, w: 1, e: 2, n: 2 };

// Volumes: pintor (do mais longe da câmera para o mais perto), faces de costas descartadas.
// o.crescer(edificio) → 0 a 1 (altura relativa; 0 não desenha), o.extras = [{cx, cy, desenha(pr, cam)}]
// para pôr na ordem objetos da cena (o prédio do lote), o.destaque(edificio) → bool,
// o.ocultos = [{x0,y0,x1,y1}] retângulos de tela cobertos por painéis opacos (só economia).
// A mesma varredura serve a dois pintores: desenharVolumes() devolve SVG em texto e
// pintarVolumes() pinta num <canvas> 2D (milhares de faces sem o custo do DOM do SVG).
function varrerVolumes(cidade, cam, o, saida) {
  const pal = o.paleta || PALETAS.quente;
  const crescer = o.crescer || (() => 1);
  const vista = o.vista || { x0: -80, y0: -120, x1: 2000, y1: 1160 };
  const pr = (p) => project(p, cam);
  const cp = posicaoCamera(cam);
  const sw = (o.traco ?? clamp(0.55 + 0.36 * cam.s, 0.6, 1.8)) * (pal.traco ?? 1);
  const lista = [];
  for (const ed of cidade.edificios) {
    const f = crescer(ed);
    if (f <= 0.002) continue;
    const c0 = ed.caixas[0];
    const ztop = ed.caixas[ed.caixas.length - 1].z1 * f;
    const base = [[c0.x0, c0.y0, 0], [c0.x1, c0.y0, 0], [c0.x1, c0.y1, 0], [c0.x0, c0.y1, 0], [ed.cx, ed.cy, ztop]].map(pr);
    const xs = base.map((p) => p[0]), ys = base.map((p) => p[1]);
    const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys) - 4, by1 = Math.max(...ys);
    if (bx1 < vista.x0 || bx0 > vista.x1 || by1 < vista.y0 || by0 > vista.y1) continue;
    // escondido inteiro atrás de um painel opaco da cena: não desenha
    if (o.ocultos && o.ocultos.some((q) => bx0 > q.x0 && bx1 < q.x1 && by0 > q.y0 && by1 < q.y1)) continue;
    lista.push({ ed, f, k: (ed.cx - cp[0]) ** 2 + (ed.cy - cp[1]) ** 2 });
  }
  for (const ex of o.extras || []) lista.push({ ex, k: (ex.cx - cp[0]) ** 2 + (ex.cy - cp[1]) ** 2 });
  lista.sort((a, b) => b.k - a.k);
  const tons = [pal.claro, pal.medio, pal.sombra];
  saida.inicio(pal, sw);
  for (const it of lista) {
    if (it.ex) { saida.extra(it.ex, pr); continue; }
    const { ed, f } = it;
    const dest = o.destaque ? o.destaque(ed) : false;
    // de longe (menos de 0,8 px/m) só o corpo do edifício, do chão ao topo: coroas e caixas-d'água
    // teriam um ou dois pixels e dobrariam o número de faces
    const longe = cam.s < 0.8;
    for (let ci = longe ? ed.iCorpo : 0; ci < (longe ? ed.iCorpo + 1 : ed.caixas.length); ci += 1) {
      const b = ed.caixas[ci];
      const z0 = longe ? 0 : b.z0 * f, z1 = b.z1 * f;
      if (z1 - z0 < 0.05) continue;
      const faces = [
        ['s', [[b.x0, b.y1, z0], [b.x1, b.y1, z0], [b.x1, b.y1, z1], [b.x0, b.y1, z1]], cp[1] > b.y1],
        ['n', [[b.x1, b.y0, z0], [b.x0, b.y0, z0], [b.x0, b.y0, z1], [b.x1, b.y0, z1]], cp[1] < b.y0],
        ['e', [[b.x1, b.y1, z0], [b.x1, b.y0, z0], [b.x1, b.y0, z1], [b.x1, b.y1, z1]], cp[0] > b.x1],
        ['w', [[b.x0, b.y0, z0], [b.x0, b.y1, z0], [b.x0, b.y1, z1], [b.x0, b.y0, z1]], cp[0] < b.x0],
      ];
      // faces laterais com menos de um pixel de altura na tela não aparecem: só o topo
      const lateral = (z1 - z0) * cam.s * Math.sin(cam.pitch) > 0.9 || cam.s > 0.8;
      for (const [lado, pts, ve] of faces) {
        if (!ve || !lateral) continue;
        const pp = pts.map(pr);
        const cor = dest ? pal.destaque : tons[Math.min(2, RANK[lado] + ed.tom)];
        saida.poligono(pp, cor);
        // faixas de andar nas torres: um traço a cada 6 m nas faces sul e oeste
        if (ed.faixas && ci === ed.iCorpo && (lado === 's' || lado === 'w') && cam.s > 0.9) {
          const segs = [];
          for (let z = z0 + 6 * f; z < z1 - 2 * f; z += 6 * f) segs.push([pr([pts[0][0], pts[0][1], z]), pr([pts[1][0], pts[1][1], z])]);
          if (segs.length) saida.tracos(segs, pal.faixa, Math.max(0.8, sw * 0.8));
        }
        // painel de pontos (o pontilhado da REF-01) na face sul das lâminas marcadas
        if (ed.pontos && ci === 0 && lado === 's' && cam.s > 1.1) {
          const L = b.x1 - b.x0, H = z1 - z0;
          const nx = Math.floor((L - 3) / 2.6), nz = Math.floor((H - 3 * f) / (2.6 * f));
          const rp = clamp(0.55 * cam.s, 0.6, 3);
          const cs = [];
          for (let a = 0; a < nx; a += 1) {
            for (let c = 0; c < nz; c += 1) cs.push(pr([b.x0 + 1.5 + 2.6 * (a + 0.5), b.y1, z0 + (1.8 + 2.6 * (c + 0.5)) * f]));
          }
          if (cs.length) saida.pontos(cs, rp, pal.ponto);
        }
      }
      saida.poligono([[b.x0, b.y0, z1], [b.x1, b.y0, z1], [b.x1, b.y1, z1], [b.x0, b.y1, z1]].map(pr), pal.topo);
    }
  }
  return saida.fim();
}

export function desenharVolumes(cidade, cam, o = {}) {
  let s = '';
  return varrerVolumes(cidade, cam, o, {
    inicio: (pal, sw) => { s = `<g stroke="${pal.contorno}" stroke-width="${sw.toFixed(2)}" stroke-linejoin="round">`; },
    extra: (ex, pr) => { s += ex.desenha(pr, cam); },
    poligono: (pp, cor) => { s += `<path d="${pD(pp)}" fill="${cor}"/>`; },
    tracos: (segs, cor, w) => {
      let l = '';
      for (const [a, c] of segs) l += `M${f1(a[0])} ${f1(a[1])}L${f1(c[0])} ${f1(c[1])}`;
      s += `<path d="${l}" stroke="${cor}" stroke-width="${w.toFixed(2)}" fill="none"/>`;
    },
    pontos: (cs, rp, cor) => {
      let p2 = '';
      for (const q of cs) p2 += `M${f1(q[0] - rp)} ${f1(q[1])}a${rp.toFixed(2)} ${rp.toFixed(2)} 0 1 0 ${(2 * rp).toFixed(2)} 0a${rp.toFixed(2)} ${rp.toFixed(2)} 0 1 0 ${(-2 * rp).toFixed(2)} 0`;
      s += `<path d="${p2}" fill="${cor}" stroke="none"/>`;
    },
    fim: () => s + '</g>',
  });
}

// Os mesmos volumes num contexto 2D de <canvas>. o.recorte = Path2D opcional (o recorte do mapa);
// o.extras pintam com ex.pinta(ctx, pr, cam). Limpa o canvas antes de pintar.
export function pintarVolumes(ctx, cidade, cam, o = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  let sw = 1, contorno = '#FFFFFF';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (o.recorte) ctx.clip(o.recorte);
  ctx.lineJoin = 'round';
  const caminho = (pp) => { ctx.beginPath(); ctx.moveTo(pp[0][0], pp[0][1]); for (let i = 1; i < pp.length; i += 1) ctx.lineTo(pp[i][0], pp[i][1]); ctx.closePath(); };
  varrerVolumes(cidade, cam, o, {
    inicio: (pal, w) => { sw = w; contorno = pal.contorno; },
    extra: (ex, pr) => { ctx.save(); ex.pinta(ctx, pr, cam); ctx.restore(); },
    poligono: (pp, cor) => {
      caminho(pp);
      ctx.fillStyle = cor; ctx.fill();
      ctx.strokeStyle = contorno; ctx.lineWidth = sw; ctx.stroke();
    },
    tracos: (segs, cor, w) => {
      ctx.beginPath();
      for (const [a, c] of segs) { ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); }
      ctx.strokeStyle = cor; ctx.lineWidth = w; ctx.stroke();
    },
    pontos: (cs, rp, cor) => {
      ctx.beginPath();
      for (const q of cs) { ctx.moveTo(q[0] + rp, q[1]); ctx.arc(q[0], q[1], rp, 0, Math.PI * 2); }
      ctx.fillStyle = cor; ctx.fill();
    },
    fim: () => null,
  });
  ctx.restore();
}

// Prisma simples para um objeto da cena (o prédio do lote) desenhado na ordem do pintor.
// cores = {s, w, e, n, topo}, contorno, andares (traços de andar a cada altura/andares).
export function prisma(x0, y0, x1, y1, h, cam, pr, cores, contorno, sw = 1.5, andares = 0, corAndar = 'rgba(23,23,23,0.10)') {
  if (h < 0.05) return '';
  const cp = posicaoCamera(cam);
  const faces = [
    ['s', [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]], cp[1] > y1],
    ['n', [[x1, y0, 0], [x0, y0, 0], [x0, y0, h], [x1, y0, h]], cp[1] < y0],
    ['e', [[x1, y1, 0], [x1, y0, 0], [x1, y0, h], [x1, y1, h]], cp[0] > x1],
    ['w', [[x0, y0, 0], [x0, y1, 0], [x0, y1, h], [x0, y0, h]], cp[0] < x0],
  ];
  let s = '';
  for (const [lado, pts, ve] of faces) {
    if (!ve) continue;
    s += `<path d="${pD(pts.map(pr))}" fill="${cores[lado]}" stroke="${contorno}" stroke-width="${sw}"/>`;
    if (andares > 1) {
      let l = '';
      for (let k = 1; k < andares; k += 1) {
        const z = (h * k) / andares;
        const a = pr([pts[0][0], pts[0][1], z]), c = pr([pts[1][0], pts[1][1], z]);
        l += `M${f1(a[0])} ${f1(a[1])}L${f1(c[0])} ${f1(c[1])}`;
      }
      s += `<path d="${l}" stroke="${corAndar}" stroke-width="1" fill="none"/>`;
    }
  }
  s += `<path d="${pD([[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]].map(pr))}" fill="${cores.topo}" stroke="${contorno}" stroke-width="${sw}"/>`;
  return s;
}

// O mesmo prisma num contexto 2D de <canvas>.
export function pintarPrisma(ctx, x0, y0, x1, y1, h, cam, pr, cores, contorno, sw = 1.5, andares = 0, corAndar = 'rgba(23,23,23,0.10)') {
  if (h < 0.05) return;
  const cp = posicaoCamera(cam);
  const faces = [
    ['s', [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]], cp[1] > y1],
    ['n', [[x1, y0, 0], [x0, y0, 0], [x0, y0, h], [x1, y0, h]], cp[1] < y0],
    ['e', [[x1, y1, 0], [x1, y0, 0], [x1, y0, h], [x1, y1, h]], cp[0] > x1],
    ['w', [[x0, y0, 0], [x0, y1, 0], [x0, y1, h], [x0, y0, h]], cp[0] < x0],
  ];
  const caminho = (pp) => { ctx.beginPath(); ctx.moveTo(pp[0][0], pp[0][1]); for (let i = 1; i < pp.length; i += 1) ctx.lineTo(pp[i][0], pp[i][1]); ctx.closePath(); };
  ctx.lineJoin = 'miter';
  for (const [lado, pts, ve] of faces) {
    if (!ve) continue;
    caminho(pts.map(pr));
    ctx.fillStyle = cores[lado]; ctx.fill();
    ctx.strokeStyle = contorno; ctx.lineWidth = sw; ctx.stroke();
    if (andares > 1) {
      ctx.beginPath();
      for (let k = 1; k < andares; k += 1) {
        const z = (h * k) / andares;
        const a = pr([pts[0][0], pts[0][1], z]), c = pr([pts[1][0], pts[1][1], z]);
        ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]);
      }
      ctx.strokeStyle = corAndar; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  caminho([[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]].map(pr));
  ctx.fillStyle = cores.topo; ctx.fill();
  ctx.strokeStyle = contorno; ctx.lineWidth = sw; ctx.stroke();
}

// Polígono de um círculo do chão projetado (para revelar o chão a partir do lote).
export function circuloChao(cx, cy, raio, cam, n = 72) {
  return 'M' + Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const p = project([cx + raio * Math.cos(a), cy + raio * Math.sin(a), 0], cam);
    return f1(p[0]) + ' ' + f1(p[1]);
  }).join('L') + 'Z';
}
