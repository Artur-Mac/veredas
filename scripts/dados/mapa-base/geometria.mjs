// Geometria plana do mapa-base, sem biblioteca: projeção local, Douglas-Peucker, ponto em polígono, distância de ponto
// a segmento, ponto interior, recorte de anel por retângulo e área. Anéis em [lon, lat] (CRS84) sem repetir o primeiro
// ponto no fim.

/** Metros por grau de latitude na esfera de raio médio: o mesmo de src/dados/recife/mapaBaseContrato.ts. */
export const METROS_POR_GRAU = (Math.PI / 180) * 6371008.8;

/** Plano local em metros (x leste, y norte) a partir de [lon0, lat0]. */
export function plano(lon0, lat0) {
  const kx = METROS_POR_GRAU * Math.cos((lat0 * Math.PI) / 180);
  const ky = METROS_POR_GRAU;
  return { kx, ky, x: (lon) => (lon - lon0) * kx, y: (lat) => (lat - lat0) * ky };
}

/** Plano da cidade, fixo: é nele que cada feição é simplificada uma vez só. */
export const PLANO_DA_CIDADE = plano(-34.92, -8.05);

/** Tira o ponto final repetido e pontos seguidos iguais. */
export function limparAnel(anel) {
  const s = [];
  for (const p of anel) {
    const u = s[s.length - 1];
    if (!u || u[0] !== p[0] || u[1] !== p[1]) s.push([p[0], p[1]]);
  }
  if (s.length > 1 && s[0][0] === s[s.length - 1][0] && s[0][1] === s[s.length - 1][1]) s.pop();
  return s;
}

function dpIndices(xs, ys, a, b, tol2, manter) {
  const pilha = [[a, b]];
  while (pilha.length) {
    const [i0, i1] = pilha.pop();
    const ax = xs[i0], ay = ys[i0], dx = xs[i1] - ax, dy = ys[i1] - ay, l2 = dx * dx + dy * dy;
    let melhor = -1, qual = -1;
    for (let i = i0 + 1; i < i1; i++) {
      const px = xs[i] - ax, py = ys[i] - ay;
      let d;
      if (l2 === 0) d = px * px + py * py;
      else {
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / l2));
        const ex = px - t * dx, ey = py - t * dy;
        d = ex * ex + ey * ey;
      }
      if (d > melhor) { melhor = d; qual = i; }
    }
    if (melhor > tol2) { manter[qual] = 1; pilha.push([i0, qual], [qual, i1]); }
  }
}

/**
 * Douglas-Peucker no plano da cidade. Devolve um subconjunto dos pontos ORIGINAIS ([lon, lat]), por isso a mesma feição
 * sai igual em qualquer arquivo. Anel: ancorado no primeiro ponto e no mais distante dele.
 */
export function simplificar(pontos, tolM, anel) {
  const n = pontos.length;
  if (n < (anel ? 4 : 3)) return pontos.slice();
  const P = PLANO_DA_CIDADE;
  const xs = new Float64Array(n + (anel ? 1 : 0)), ys = new Float64Array(xs.length);
  for (let i = 0; i < n; i++) { xs[i] = P.x(pontos[i][0]); ys[i] = P.y(pontos[i][1]); }
  const manter = new Uint8Array(xs.length);
  const tol2 = tolM * tolM;
  if (anel) {
    xs[n] = xs[0]; ys[n] = ys[0];
    let longe = 1, dl = -1;
    for (let i = 1; i < n; i++) { const d = (xs[i] - xs[0]) ** 2 + (ys[i] - ys[0]) ** 2; if (d > dl) { dl = d; longe = i; } }
    manter[0] = manter[longe] = 1;
    dpIndices(xs, ys, 0, longe, tol2, manter);
    dpIndices(xs, ys, longe, n, tol2, manter);
    manter[n] = 0;
  } else {
    manter[0] = manter[n - 1] = 1;
    dpIndices(xs, ys, 0, n - 1, tol2, manter);
  }
  const s = [];
  for (let i = 0; i < n; i++) if (manter[i]) s.push(pontos[i]);
  return s;
}

/** Área (m²) com sinal no plano da cidade. */
export function areaM2(anel) {
  const P = PLANO_DA_CIDADE;
  let a = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    a += (P.x(anel[j][0]) - P.x(anel[i][0])) * (P.y(anel[j][1]) + P.y(anel[i][1]));
  }
  return a / 2;
}

/** Anel que degenerou: menos de 3 pontos ou área quase nula (< 0,05 m²). */
export const degenerado = (anel) => anel.length < 3 || Math.abs(areaM2(anel)) < 0.05;

export function caixaDe(aneis) {
  let o = Infinity, s = Infinity, l = -Infinity, n = -Infinity;
  for (const a of aneis) for (const [x, y] of a) {
    if (x < o) o = x; if (x > l) l = x; if (y < s) s = y; if (y > n) n = y;
  }
  return [o, s, l, n];
}

export const caixasTocam = (a, b) => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);

/** Caixa alargada em metros. */
export function alargar(c, metros) {
  const dLat = metros / METROS_POR_GRAU;
  const dLon = metros / (METROS_POR_GRAU * Math.cos((((c[1] + c[3]) / 2) * Math.PI) / 180));
  return [c[0] - dLon, c[1] - dLat, c[2] + dLon, c[3] + dLat];
}

/** Ponto em anel (raio horizontal). */
export function dentroDoAnel(x, y, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i], [xj, yj] = anel[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Ponto em polígono (lista de anéis, par-ímpar: o contorno e os furos). */
export function dentroDoPoligono(x, y, aneis) {
  let d = false;
  for (const a of aneis) if (dentroDoAnel(x, y, a)) d = !d;
  return d;
}

/** Ponto em multipolígono (lista de polígonos). */
export const dentroDeAlgum = (x, y, poligonos) => poligonos.some((p) => dentroDoPoligono(x, y, p));

/** Distância (m) de um ponto a um segmento, num plano local já em metros. */
export function distPontoSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const ex = px - ax - t * dx, ey = py - ay - t * dy;
  return Math.sqrt(ex * ex + ey * ey);
}

/**
 * Região de recorte: um multipolígono em [lon, lat] alargado em `metros`. `toca(x, y)` diz se o ponto está dentro ou a
 * até `metros` da borda. As bordas ficam em metros no plano da cidade, em grade, para o teste ser barato.
 */
export function regiao(poligonos, metros) {
  const P = PLANO_DA_CIDADE;
  const segs = [];
  for (const p of poligonos) for (const a of p) for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
    segs.push([P.x(a[j][0]), P.y(a[j][1]), P.x(a[i][0]), P.y(a[i][1])]);
  }
  const CEL = Math.max(metros, 100);
  const grade = new Map();
  for (const s of segs) {
    const x0 = Math.floor((Math.min(s[0], s[2]) - metros) / CEL), x1 = Math.floor((Math.max(s[0], s[2]) + metros) / CEL);
    const y0 = Math.floor((Math.min(s[1], s[3]) - metros) / CEL), y1 = Math.floor((Math.max(s[1], s[3]) + metros) / CEL);
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const k = gx * 100003 + gy;
      let l = grade.get(k);
      if (!l) grade.set(k, (l = []));
      l.push(s);
    }
  }
  const caixa = alargar(caixaDe(poligonos.flat()), metros);
  return {
    caixa,
    toca(lon, lat) {
      if (lon < caixa[0] || lon > caixa[2] || lat < caixa[1] || lat > caixa[3]) return false;
      if (dentroDeAlgum(lon, lat, poligonos)) return true;
      const x = P.x(lon), y = P.y(lat);
      const l = grade.get(Math.floor(x / CEL) * 100003 + Math.floor(y / CEL));
      if (l) for (const s of l) if (distPontoSegmento(x, y, s[0], s[1], s[2], s[3]) <= metros) return true;
      return false;
    },
  };
}

/** Um ponto garantidamente dentro do polígono (contorno + furos): o meio do maior intervalo numa linha horizontal. */
export function pontoInterior(aneis) {
  const [, s, , n] = caixaDe([aneis[0]]);
  for (const f of [0.5, 0.37, 0.63, 0.25, 0.75, 0.13, 0.87]) {
    const y = s + (n - s) * f;
    const xs = [];
    for (const a of aneis) for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const [xi, yi] = a[i], [xj, yj] = a[j];
      if ((yi > y) !== (yj > y)) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
    }
    xs.sort((p, q) => p - q);
    let melhor = null, larg = 0;
    for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > larg) { larg = xs[i + 1] - xs[i]; melhor = [(xs[i] + xs[i + 1]) / 2, y]; }
    if (melhor) return melhor;
  }
  return aneis[0][0];
}

/** Sutherland-Hodgman de um anel contra um retângulo [o, s, l, n]. Pode criar arestas sobre a borda do retângulo. */
export function recortarAnel(anel, c) {
  const lados = [
    [(p) => p[0] >= c[0], (a, b) => [c[0], a[1] + ((b[1] - a[1]) * (c[0] - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= c[2], (a, b) => [c[2], a[1] + ((b[1] - a[1]) * (c[2] - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= c[1], (a, b) => [a[0] + ((b[0] - a[0]) * (c[1] - a[1])) / (b[1] - a[1]), c[1]]],
    [(p) => p[1] <= c[3], (a, b) => [a[0] + ((b[0] - a[0]) * (c[3] - a[1])) / (b[1] - a[1]), c[3]]],
  ];
  let saida = anel;
  for (const [dentro, cruza] of lados) {
    const ent = saida;
    saida = [];
    for (let i = 0; i < ent.length; i++) {
      const a = ent[(i + ent.length - 1) % ent.length], b = ent[i];
      if (dentro(b)) { if (!dentro(a)) saida.push(cruza(a, b)); saida.push(b); }
      else if (dentro(a)) saida.push(cruza(a, b));
    }
    if (!saida.length) break;
  }
  return limparAnel(saida);
}
