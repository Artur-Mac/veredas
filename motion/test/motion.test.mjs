// node --test motion/test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spring, track, swap, press, rng, PRESETS, describe } from '../lib/motion.js';

const vel = (f, t, h = 1e-4) => (f(t + h) - f(t - h)) / (2 * h);

test('spring começa em 0 com velocidade 0 e chega a 1', () => {
  for (const p of Object.values(PRESETS)) {
    assert.equal(spring(0, p.k, p.d), 0);
    // x'' (0) = k, então a velocidade logo depois do início é cerca de k * t.
    assert.ok(Math.abs(vel((t) => spring(t, p.k, p.d), 1e-3, 1e-5)) < p.k * 1.5e-3);
    assert.ok(Math.abs(spring(8, p.k, p.d) - 1) < 1e-3);
  }
});

test('superamortecido e crítico continuam contínuos', () => {
  for (const d of [2 * Math.sqrt(100), 40]) {
    assert.ok(spring(0.001, 100, d) >= 0);
    assert.ok(Math.abs(spring(10, 100, d) - 1) < 1e-3);
  }
});

test('track preserva posição e velocidade quando o alvo muda no meio', () => {
  const keys = [[0, 0], [0.2, 100], [0.35, 40], [0.5, 260]];
  const f = (t) => track(t, keys, PRESETS.card);
  for (const tk of [0.2, 0.35, 0.5]) {
    assert.ok(Math.abs(f(tk + 1e-6) - f(tk - 1e-6)) < 1e-3, `salto de posição em ${tk}`);
    const h = 1e-5;
    const esquerda = (f(tk) - f(tk - h)) / h, direita = (f(tk + h) - f(tk)) / h;
    assert.ok(Math.abs(direita - esquerda) < 2, `salto de velocidade em ${tk}`);
  }
});

test('track é função pura: a ordem das chamadas não muda o valor', () => {
  const keys = [[0, [0, 0]], [1, [10, 20]], [2, [5, -3]]];
  const a = track(1.37, keys);
  track(9, keys); track(0.1, keys);
  assert.deepEqual(track(1.37, keys), a);
});

test('swap: o texto que sai some antes do que entra aparecer', () => {
  const troca = 2.0;
  for (let t = 1.5; t < 2.5; t += 0.005) {
    const sai = swap(t, 0, troca), entra = swap(t, troca);
    assert.ok(!(sai > 0 && entra > 0), `sobreposição em ${t.toFixed(3)}`);
  }
});

test('press volta a zero depois do clique', () => {
  assert.equal(press(0.5, [1]), 0);
  assert.ok(press(1.07, [1]) > 0.99);
  assert.ok(press(2, [1]) < 0.01);
});

test('rng é determinístico', () => {
  const a = rng(7), b = rng(7);
  for (let i = 0; i < 5; i += 1) assert.equal(a(), b());
});

test('presets dentro do overshoot combinado', () => {
  assert.ok(describe(PRESETS.camera).overshoot < 1e-3);
  assert.ok(describe(PRESETS.type).overshoot < 0.005);
  assert.ok(describe(PRESETS.cursor).overshoot < 0.01);
  assert.ok(describe(PRESETS.card).overshoot < 0.03);
  assert.ok(describe(PRESETS.button).overshoot < 0.08);
});
