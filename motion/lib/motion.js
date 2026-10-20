// Biblioteca de movimento do VEREDA. Tudo aqui é função pura do tempo:
// nenhum estado entre quadros, nenhum timer, nenhum Math.random.
// Base: REF-07 (one shape, springs fechadas) e REF-08 (spring, track, swapAlpha, rng).

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (p) => { const q = clamp(p); return q * q * (3 - 2 * q); };
export const lerpPt = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];

// Resposta ao degrau de um oscilador massa-mola (m = 1), de 0 a 1, com
// velocidade inicial zero. k é a rigidez, d o amortecimento.
export function spring(t, k = 170, d = 26) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k);
  const z = d / (2 * w0);
  if (Math.abs(z - 1) < 1e-6) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  // Superamortecido, solução exata (REF-08 aproxima pelo crítico).
  const s = w0 * Math.sqrt(z * z - 1);
  const r1 = -z * w0 + s;
  const r2 = -z * w0 - s;
  return 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
}

// Personalidades de movimento (docs/motion-language.md, seção 3).
// zeta = d / (2 * sqrt(k)); overshoot = exp(-zeta * pi / sqrt(1 - zeta^2)).
export const PRESETS = {
  cursor: { k: 420, d: 38 },   // zeta 0,93: rápido e preciso, overshoot 0,04%
  button: { k: 520, d: 30 },   // zeta 0,66: resposta tátil, overshoot 6%, assenta em 0,25 s
  card:   { k: 190, d: 22 },   // zeta 0,80: confiante, um pouco pesado, overshoot 1,5%
  camera: { k: 30,  d: 11 },   // zeta 1,00: sem overshoot, assenta em cerca de 1,4 s
  type:   { k: 260, d: 31 },   // zeta 0,96: título firme, overshoot desprezível
  map:    { k: 90,  d: 16 },   // zeta 0,84: fluido e espacial, overshoot 0,6%
};

export const sp = (t, p = PRESETS.card) => spring(t, p.k, p.d);

// Valor com vários alvos: soma de uma spring por mudança de alvo.
// keys = [[tempo, valor], ...] em ordem; valor pode ser número ou vetor.
// Como cada spring começa com valor e velocidade zero, trocar o alvo no meio
// de um movimento preserva posição e velocidade.
export function track(t, keys, p = PRESETS.card) {
  const first = keys[0][1];
  if (Array.isArray(first)) {
    const v = first.slice();
    for (let i = 1; i < keys.length; i += 1) {
      const f = spring(t - keys[i][0], (keys[i][2] || p).k, (keys[i][2] || p).d);
      for (let j = 0; j < v.length; j += 1) v[j] += (keys[i][1][j] - keys[i - 1][1][j]) * f;
    }
    return v;
  }
  let v = first;
  for (let i = 1; i < keys.length; i += 1) {
    const q = keys[i][2] || p;
    v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], q.k, q.d);
  }
  return v;
}

// Opacidade de um conteúdo que vive entre tIn e tOut dentro de um container
// em morph. Entra depois que o morph começa e sai antes do próximo (REF-08).
export function swap(t, tIn, tOut = Infinity, o = {}) {
  const { delayIn = 0.08, durIn = 0.12, leadOut = 0.1, durOut = 0.1 } = o;
  const a = durIn > 0 ? clamp((t - tIn - delayIn) / durIn) : (t >= tIn + delayIn ? 1 : 0);
  const b = clamp((tOut - leadOut - t) / durOut);
  return Math.min(a, b);
}

// Entrada de texto: quanto falta para chegar (1 = longe, 0 = no lugar).
export const pending = (t, t0, p = PRESETS.type) => 1 - sp(t - t0, p);

// Pressão de um clique: desce em 70 ms e volta com a spring de botão.
export function press(t, clicks, p = PRESETS.button) {
  let v = 0;
  for (const c of clicks) {
    const u = t - c;
    if (u <= 0) continue;
    v += u < 0.07 ? u / 0.07 : 1 - sp(u - 0.07, p);
  }
  return clamp(v);
}

// PRNG determinístico (mulberry32).
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Câmera 2.5D: o chão é o plano z = 0, em metros, x para leste, y para o sul.
// yaw gira o chão, pitch inclina (0 = visto de cima), s é px por metro.
export function project([x, y, z = 0], cam) {
  const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
  const xr = x * c - y * s;
  const yr = x * s + y * c;
  const cp = Math.cos(cam.pitch), spn = Math.sin(cam.pitch);
  const yv = yr * cp - z * spn;
  const depth = yr * spn + z * cp;
  // Pontos perto demais da câmera fariam o fator explodir ou trocar de sinal e inverter
  // polígonos do chão; o limite mantém a geometria fora da tela bem-comportada.
  const f = Math.min(6, cam.focal / Math.max(cam.focal * 0.15, cam.focal - depth * cam.s));
  return [cam.cx + cam.s * f * xr, cam.cy + cam.s * f * yv];
}

export const mixCam = (a, b, p) => ({
  cx: lerp(a.cx, b.cx, p), cy: lerp(a.cy, b.cy, p), s: lerp(a.s, b.s, p),
  yaw: lerp(a.yaw, b.yaw, p), pitch: lerp(a.pitch, b.pitch, p), focal: lerp(a.focal, b.focal, p),
});

// Caminho SVG de um quadrilátero convexo com cantos arredondados.
export function roundedQuad(pts, r) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i += 1) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a = [p1[0] + ((p0[0] - p1[0]) / l1) * rr, p1[1] + ((p0[1] - p1[1]) / l1) * rr];
    const b = [p1[0] + ((p2[0] - p1[0]) / l2) * rr, p1[1] + ((p2[1] - p1[1]) / l2) * rr];
    d += `${i ? 'L' : 'M'}${a[0].toFixed(2)} ${a[1].toFixed(2)}Q${p1[0].toFixed(2)} ${p1[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  }
  return d + 'Z';
}

export const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

export function mixColor(a, b, p) {
  return a.map((v, i) => lerp(v, b[i], p));
}
export const rgba = ([r, g, b, a = 1]) => `rgba(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)},${a.toFixed(3)})`;

// Números de referência de um preset, para documentação e testes.
export function describe({ k, d }) {
  const w0 = Math.sqrt(k), z = d / (2 * w0);
  const overshoot = z < 1 ? Math.exp((-z * Math.PI) / Math.sqrt(1 - z * z)) : 0;
  let settle = 0;
  for (let t = 0; t < 10; t += 0.001) if (Math.abs(1 - spring(t, k, d)) > 0.02) settle = t;
  return { zeta: z, overshoot, settle2pct: settle };
}
