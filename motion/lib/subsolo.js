// O subsolo escuro: último quadro da cena 4 e primeiro quadro da cena 5 (pontilhado B, papel
// sobre tinta). A cena 4 termina exatamente neste desenho e a cena 5 parte dele; as duas
// importam daqui, para a emenda sair igual pixel a pixel. Quadro de 1920 x 1080 px.
// Tudo é determinístico: o pontilhado sai de rng(semente), nunca de Math.random.
// Sem números de dias, sem dado de planilha e sem chave de lote: só os nomes das bases e dos
// proxies, a régua do tempo, a palavra TEMPO e o contorno vazio do anúncio levado.
// (18/10/2026, roteiro novo: "leva tempo" no lugar de "leva semanas"; os proxies viraram a sétima
// camada do subsolo e entram aqui como o sétimo nome.)
//
// Como desenhar (as duas cenas):
//   1. um <canvas> de 1920 x 1080 com desenharSubsolo(ctx, larguras): fundo, pontilhado, marcas,
//      régua, contorno e os nomes das bases;
//   2. por cima, TEMPO em HTML, letra a letra (classe com font: 500 96px Fraunces;
//      font-variation-settings 'opsz' 40; font-kerning: none; letter-spacing 0.02em; line-height 1),
//      cada letra em left = posLetras(...)[i] a partir de (palavra.x, palavra.top), cor palavra.cor.
//      TEMPO fica em HTML porque o canvas não aceita o eixo opsz.
import { rng, clamp, smooth, roundedQuad, rectPts } from './motion.js';

const PAPEL = '242,235,221';   // --bg-paper #F2EBDD

export const SUBSOLO = {
  fundo: '#171717',            // --bg-ink
  // a régua longa do tempo: sai do quadro pela esquerda e termina no contorno vazio.
  // Ainda tem a memória do emaranhado: duas ondas de 6 px, que a cena 5 puxa até ficar reta.
  // Ela é a linha do chão: a tinta da cena 5 desce até ela, para e escoa por baixo.
  regua: {
    y: 540, x0: -60, x1: 1008.75, traco: 3, cor: `rgba(${PAPEL},0.62)`,
    onda: 6, ondas: 2,
    marcas: { passo: 96, altura: 22, traco: 2, cor: `rgba(${PAPEL},0.42)` },   // marcas de tempo, de 96 em 96 px, para baixo
  },
  // "TEMPO" em Fraunces 500, opsz 40, sem kerning, letra a letra pela largura do prefixo
  palavra: {
    texto: 'TEMPO', x: 120, top: 424, tamanho: 96, peso: 500, opsz: 40, espacamento: 0.02,
    cor: '#F2EBDD',
  },
  // o contorno tracejado do anúncio levado (traço .conf-trace.declarado do protótipo, em papel)
  contorno: { x: 1008.75, y: 357.25, w: 540, h: 360, raio: 30, traco: 3, tracejado: [12, 9], cor: `rgba(${PAPEL},0.7)` },
  // os nomes das seis bases (catálogo do protótipo, openSourceSheet, e o ESIG) e dos proxies, bem
  // apagados, um por estrato, de cima para baixo, cada um num x diferente; todos abaixo do contorno
  bases: [
    { nome: 'IPTU 2026', x: 1240, y: 776 },
    { nome: 'ITBI 2015–2026', x: 880, y: 816 },
    { nome: 'Licenciamento Urbanístico', x: 1300, y: 856 },
    { nome: 'Defesa Civil 2024', x: 940, y: 896 },
    { nome: 'SDS-PE / Crime Brasil', x: 1420, y: 936 },
    { nome: 'ESIG', x: 1130, y: 976 },
    { nome: 'Proxies · alagamento / segurança / verde', x: 960, y: 1016 },
  ],
  baseFonte: { tamanho: 22, peso: 500, familia: '"JetBrains Mono"' },
  baseCor: `rgba(${PAPEL},0.26)`,
  // pontilhado em meio-tom: manchas orgânicas preenchidas de pontos (REF-09, opção B). Só a mancha
  // grande e a menor que passam atrás da palavra, como o "new" da REF-09 (18/10/2026: as duas
  // manchas dos cantos saíram, para o pontilhado não ler como vinheta).
  pontilhado: {
    semente: 405, passo: 14, rMax: 4.1, cor: `rgba(${PAPEL},0.40)`,
    // [cx, cy, rx, ry]
    manchas: [[420, 455, 440, 150], [770, 360, 170, 80]],
    // zonas que ficam limpas: a régua e o contorno [x0, y0, x1, y1] (mais os nomes, medidos)
    livres: [[-100, 526, 1030, 574], [986, 336, 1572, 740]],
  },
};

// ---------------------------------------------------------------------------
// régua: a curva e as marcas. u vai de 0 (ponta esquerda) a 1 (ponta no contorno);
// a onda vale zero nas duas pontas.
// ---------------------------------------------------------------------------
export const ondaY = (u, y, amp, ondas) => y + amp * Math.sin(2 * Math.PI * ondas * u);

export function reguaPts(x0, x1, y, amp, ondas, n = 72) {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    pts.push([x0 + (x1 - x0) * u, ondaY(u, y, amp, ondas)]);
  }
  return pts;
}
const f2 = (v) => v.toFixed(2);
export const linhaD = (pts) => 'M' + pts.map((p) => f2(p[0]) + ' ' + f2(p[1])).join('L');

// altura da régua da entrada num x qualquer (fora dela, a linha do chão segue reta em y)
export function reguaEmX(x) {
  const R = SUBSOLO.regua;
  if (x <= R.x0 || x >= R.x1) return R.y;
  return ondaY((x - R.x0) / (R.x1 - R.x0), R.y, R.onda, R.ondas);
}

// frações das marcas de tempo na régua da entrada: a partir da ponta do contorno, de 96 em 96 px
export const MARCAS_U = (() => {
  const R = SUBSOLO.regua, out = [];
  for (let x = R.x1 - R.marcas.passo / 2; x > R.x0; x -= R.marcas.passo) out.push((x - R.x0) / (R.x1 - R.x0));
  return out;
})();

export function marcasD(x0, x1, y, amp, ondas, altura, us = MARCAS_U) {
  let d = '';
  for (const u of us) {
    const x = x0 + (x1 - x0) * u, yy = ondaY(u, y, amp, ondas);
    d += `M${f2(x)} ${f2(yy)}V${f2(yy + altura)}`;
  }
  return d || 'M0 0';
}

export const contornoD = (x, y, w, h, r) => roundedQuad(rectPts(x, y, w, h), r);

// ---------------------------------------------------------------------------
// pontilhado: grade hexagonal de 14 px; o raio de cada ponto vem de um campo de manchas com
// borda ondulada (fases e amplitudes de rng); miolo cheio e borda curta em meio-tom; as zonas
// livres zeram o campo com 40 px de margem.
// ---------------------------------------------------------------------------
function distRet(x, y, [x0, y0, x1, y1]) {
  const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1);
  return Math.hypot(dx, dy);
}
export function pontilhadoD(P = SUBSOLO.pontilhado, extrasLivres = []) {
  const r = rng(P.semente);
  const manchas = P.manchas.map(([cx, cy, rx, ry]) => ({
    cx, cy, rx, ry,
    f: [r() * 6.283, r() * 6.283, r() * 6.283],
    a: [0.18 + r() * 0.12, 0.10 + r() * 0.08, 0.06 + r() * 0.05],
  }));
  const livres = [...P.livres, ...extrasLivres];
  const passo = P.passo, dy = passo * 0.866;
  let d = '';
  for (let j = 0, y = passo / 2; y < 1080 + passo; j += 1, y += dy) {
    for (let x = j % 2 ? passo / 2 : 0; x < 1920 + passo; x += passo) {
      let f = 0;
      for (const m of manchas) {
        const ux = (x - m.cx) / m.rx, uy = (y - m.cy) / m.ry;
        const ang = Math.atan2(uy, ux);
        const borda = 1 + m.a[0] * Math.sin(2 * ang + m.f[0]) + m.a[1] * Math.sin(3 * ang + m.f[1]) + m.a[2] * Math.sin(5 * ang + m.f[2]);
        const q = Math.hypot(ux, uy) / borda;
        // miolo cheio e uma borda curta em meio-tom: mancha, não vinheta
        f = Math.max(f, 1 - smooth(clamp((q - 0.62) / 0.42)));
      }
      for (const z of livres) f *= smooth(clamp(distRet(x, y, z) / 40));
      const rr = P.rMax * Math.pow(f, 0.85);
      if (rr < 0.45) continue;
      d += `M${f2(x - rr)} ${f2(y)}a${f2(rr)} ${f2(rr)} 0 1 0 ${f2(2 * rr)} 0a${f2(rr)} ${f2(rr)} 0 1 0 ${f2(-2 * rr)} 0`;
    }
  }
  return d;
}

// zonas livres dos nomes (caixa do texto com folga), para o pontilhado não passar por baixo deles
export const livresDosNomes = (larguras) => SUBSOLO.bases.map((b, i) => [b.x - 14, b.y - 14, b.x + larguras[i] + 14, b.y + SUBSOLO.baseFonte.tamanho + 14]);

// posições das letras de uma palavra: x de cada letra = largura do prefixo (sem kerning).
// medir(prefixo) devolve a largura fracionária do texto na fonte da palavra.
export function posLetras(texto, medir) {
  const out = [];
  for (let i = 0; i < texto.length; i += 1) out.push(i === 0 ? 0 : medir(texto.slice(0, i)));
  return out;
}

// ---------------------------------------------------------------------------
// O desenho escuro inteiro num canvas 2D de 1920 x 1080 (menos TEMPO, que vai em HTML).
// larguras: largura de cada nome de base na fonte dos nomes (para as zonas livres do pontilhado).
// Os nomes ficam com a caixa de linha de 22 px (line-height 1), como no HTML: a linha de base vem
// das métricas da fonte, igual ao CSS.
// ---------------------------------------------------------------------------
export function desenharSubsolo(ctx, larguras) {
  const S = SUBSOLO, R = S.regua, K = S.contorno, F = S.baseFonte;
  ctx.save();
  ctx.fillStyle = S.fundo;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = S.pontilhado.cor;
  ctx.fill(new Path2D(pontilhadoD(S.pontilhado, livresDosNomes(larguras))));
  ctx.lineCap = 'butt';
  ctx.strokeStyle = R.marcas.cor; ctx.lineWidth = R.marcas.traco;
  ctx.stroke(new Path2D(marcasD(R.x0, R.x1, R.y, R.onda, R.ondas, R.marcas.altura)));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = R.cor; ctx.lineWidth = R.traco;
  ctx.stroke(new Path2D(linhaD(reguaPts(R.x0, R.x1, R.y, R.onda, R.ondas))));
  ctx.lineCap = 'butt';
  ctx.strokeStyle = K.cor; ctx.lineWidth = K.traco; ctx.setLineDash(K.tracejado);
  ctx.stroke(new Path2D(contornoD(K.x, K.y, K.w, K.h, K.raio)));
  ctx.setLineDash([]);
  ctx.font = `${F.peso} ${F.tamanho}px ${F.familia}`;
  ctx.fillStyle = S.baseCor;
  ctx.textBaseline = 'alphabetic';
  for (const b of S.bases) {
    const m = ctx.measureText(b.nome);
    const a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent;
    ctx.fillText(b.nome, b.x, b.y + (F.tamanho - (a + d)) / 2 + a);
  }
  ctx.restore();
}
