// Cópia fiel de `intervalosDoRaio` (src/dados/sol/geometria.ts) para o pipeline Node: o arquivo TypeScript importa
// "./astronomia" sem extensão, o que o Node não resolve. Mesma regra: intervalos em que um raio horizontal atravessa o
// sólido, respeitando furos e origem dentro dele. Testes: scripts/dados/sol/testes/raio.test.mjs.
function dentroDoAnel(p, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const a = anel[i], b = anel[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) dentro = !dentro;
  }
  return dentro;
}
const dentroDoVolume = (p, aneis) => !!aneis[0] && dentroDoAnel(p, aneis[0]) && !aneis.slice(1).some((a) => dentroDoAnel(p, a));
const cruz = (a, b) => a[0] * b[1] - a[1] * b[0];
export function intervalosDoRaio(origem, direcao, aneis) {
  const cortes = [0];
  for (const anel of aneis) for (let i = 0; i < anel.length; i++) {
    const a = anel[i], b = anel[(i + 1) % anel.length];
    const v = [b[0] - a[0], b[1] - a[1]], w = [a[0] - origem[0], a[1] - origem[1]];
    const den = cruz(direcao, v);
    if (Math.abs(den) < 1e-10) continue;
    const t = cruz(w, v) / den, u = cruz(w, direcao) / den;
    if (t >= 0 && u >= -1e-8 && u <= 1 + 1e-8) cortes.push(t);
  }
  const ordenados = [...new Set(cortes.map((n) => Math.round(n * 1e7) / 1e7))].sort((a, b) => a - b);
  const intervalos = [];
  for (let i = 0; i < ordenados.length - 1; i++) {
    const a = ordenados[i], b = ordenados[i + 1];
    const m = (a + b) / 2;
    if (b - a > 1e-7 && dentroDoVolume([origem[0] + m * direcao[0], origem[1] + m * direcao[1]], aneis)) intervalos.push([a, b]);
  }
  return intervalos;
}
