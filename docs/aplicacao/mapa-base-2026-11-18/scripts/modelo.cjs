// Gera as vistas SVG do modelo visual do mapa-base a partir dos dados reais da Prefeitura do Recife (ODbL).
// Uso: node modelo.cjs <pasta mapa-base> <saida.json>   → { hoje, gaveta, porPerto } (strings SVG)
const fs = require("fs");
const path = require("path");
const DIR = process.argv[2];
const SAIDA = process.argv[3];

const lon0 = -34.907539, lat0 = -8.141503; // centro do lote do prédio (índice 8001-216)
const kx = Math.cos((lat0 * Math.PI) / 180) * 111320, ky = 110574;
const metros = ([lo, la]) => [(lo - lon0) * kx, -(la - lat0) * ky];

const C = {
  rua: "#FFFFFF", quadra: "#E7DEC9", lote: "#F2EBDD", loteLinha: "#C9BEA8",
  predio: "#EBF1F8", azul: "#2E5A85", acao: "#F47745", agua: "#D3DEE8", aguaLinha: "#A9BCCF",
  praca: "#E3EBDC", pracaLinha: "#7F8870", texto: "#171717", apoio: "#625C51", barro: "#B94E36",
};
const LARG = 340, ALT = 300;

function vista(largM) {
  const s = LARG / largM;
  const altM = ALT / s;
  const px = (c) => { const [x, y] = metros(c); return [x * s + LARG / 2, y * s + ALT / 2]; };
  return { s, largM, altM, px };
}
const r1 = (n) => Math.round(n * 10) / 10;
function anel(v, ring) {
  let d = "", ult = null;
  ring.forEach((c, i) => {
    const [x, y] = v.px(c);
    if (ult && i < ring.length - 1 && Math.hypot(x - ult[0], y - ult[1]) < 0.7) return;
    // fora do quadro com folga, só precisa do contorno grosseiro
    if (ult && i < ring.length - 1 && (x < -60 || x > LARG + 60 || y < -60 || y > ALT + 60) && Math.hypot(x - ult[0], y - ult[1]) < 25) return;
    ult = [x, y]; d += (d ? "L" : "M") + `${r1(x)} ${r1(y)}`;
  });
  return d + "Z";
}
function poligonos(g) { return g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; }
function linhas(g) { return g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : []; }
function caminhoPoligono(v, g) { return poligonos(g).map((p) => p.map((r) => anel(v, r)).join("")).join(""); }
function dentroDaJanela(v, g, folga = 40) {
  const pts = [...poligonos(g).flat(2), ...linhas(g).flat()].map(v.px);
  let a = [1e9, 1e9, -1e9, -1e9];
  for (const [x, y] of pts) a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)];
  return a[2] > -folga && a[0] < LARG + folga && a[3] > -folga && a[1] < ALT + folga;
}
function areaPx(v, g) {
  let t = 0;
  for (const p of poligonos(g)) { const r = p[0].map(v.px); for (let i = 1; i < r.length; i++) t += r[i - 1][0] * r[i][1] - r[i][0] * r[i - 1][1]; }
  return Math.abs(t / 2);
}
const dentroPx = ([x, y], m = 0) => x >= m && x <= LARG - m && y >= m && y <= ALT - m;
function pontoNoPoligono([x, y], rings) {
  let dentro = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

// Rótulos de rua: o trecho mais longo dentro do quadro, lido da esquerda para a direita.
function rotulosDeRua(v, ruas, { fonte, minPx, so, evitar = [] }) {
  const cand = [];
  for (const f of ruas) {
    const nome = (f.properties.nome_curto || f.properties.NLGPAVRESU || f.properties.nome || "").replace(/^Av /, "Av. ");
    if (!nome || (so && !so(f.properties, nome))) continue;
    for (const l of linhas(f.geometry)) {
      let run = [];
      const fechar = () => {
        if (run.length > 1) {
          let comp = 0; for (let i = 1; i < run.length; i++) comp += Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]);
          cand.push({ nome, run: run.slice(), comp, av: /^Av/.test(nome), alvo: f.properties.codigo === 8001 || f.properties.CLOGRACODI === 8001 });
        }
        run = [];
      };
      for (const c of l) { const p = v.px(c); if (dentroPx(p, 14)) run.push(p); else fechar(); }
      fechar();
    }
  }
  const porNome = new Map();
  for (const c of cand) if (!porNome.has(c.nome) || porNome.get(c.nome).comp < c.comp) porNome.set(c.nome, c);
  const ordem = [...porNome.values()].sort((a, b) => (b.alvo - a.alvo) || (b.av - a.av) || (b.comp - a.comp));
  const usados = [], defs = [], textos = [];
  for (const c of ordem) {
    const larguraTexto = c.nome.length * fonte * 0.56;
    if (c.comp < Math.max(minPx, larguraTexto * 1.08)) continue;
    let run = c.run; if (run[run.length - 1][0] < run[0][0]) run = run.slice().reverse();
    // ponto a uma fração do comprimento; o rótulo desliza pela rua até achar lugar livre
    const pontoEm = (fr) => {
      let alvo = c.comp * fr;
      for (let i = 1; i < run.length; i++) { const d = Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]); if (alvo <= d) { const t = alvo / d; return [run[i - 1][0] + t * (run[i][0] - run[i - 1][0]), run[i - 1][1] + t * (run[i][1] - run[i - 1][1])]; } alvo -= d; }
      return run[run.length - 1];
    };
    const meiaFr = (larguraTexto / 2 + 4) / c.comp;
    let meio = null, fracao = 0.5;
    for (const fr of [0.5, 0.35, 0.65, 0.22, 0.78, 0.12, 0.88]) {
      if (fr < meiaFr || fr > 1 - meiaFr) continue;
      const m = pontoEm(fr);
      if (usados.some((u) => Math.hypot(u[0] - m[0], u[1] - m[1]) < 34)) continue;
      const perto = run.filter((q) => Math.hypot(q[0] - m[0], q[1] - m[1]) < larguraTexto / 2 + 6);
      if (evitar.some((e) => perto.some((q) => Math.abs(q[0] - e.x) < e.w && Math.abs(q[1] - e.y) < 11))) continue;
      meio = m; fracao = fr; break;
    }
    if (!meio) continue;
    usados.push(meio);
    const id = `r${defs.length}_${Math.round(v.largM)}`;
    defs.push(`<path id="${id}" d="M${run.map((p) => `${r1(p[0])} ${r1(p[1])}`).join("L")}"/>`);
    textos.push(`<text class="rua${c.av ? " av" : ""}${c.alvo ? " alvo" : ""}" style="font-size:${fonte}px" dy="${(fonte * 0.35).toFixed(1)}"><textPath href="#${id}" startOffset="${Math.round(fracao * 100)}%" text-anchor="middle">${c.nome}</textPath></text>`);
  }
  return { defs: defs.join(""), textos: textos.join("") };
}

function regua(v) {
  const alvo = LARG * 0.22 / v.s;
  const passos = [10, 20, 25, 50, 100, 200, 250, 500, 1000];
  let m = passos[0]; for (const p of passos) if (p <= alvo) m = p;
  const w = m * v.s, x = 12, y = ALT - 12;
  const rot = m >= 1000 ? `${m / 1000} km` : `${m} m`;
  return `<g class="regua"><rect x="${x - 4}" y="${y - 17}" width="${w + 8}" height="22" rx="4" fill="#FFFFFF" fill-opacity=".85"/><path d="M${x} ${y - 4}V${y}H${r1(x + w)}V${y - 4}" fill="none" stroke="${C.texto}" stroke-width="1.5"/><text x="${x}" y="${y - 7}" class="mono">${rot}</text></g>`;
}
function pino(v) {
  const [x, y] = v.px([lon0, lat0]);
  return `<circle cx="${r1(x)}" cy="${r1(y)}" r="11" fill="${C.acao}" fill-opacity=".25"/><circle cx="${r1(x)}" cy="${r1(y)}" r="5.5" fill="${C.acao}" stroke="#fff" stroke-width="2"/>`;
}
function svg(conteudo, rotulo) {
  return `<svg viewBox="0 0 ${LARG} ${ALT}" width="${LARG}" height="${ALT}" role="img" aria-label="${rotulo}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="q${rotulo.length}"><rect width="${LARG}" height="${ALT}" rx="14"/></clipPath></defs><g clip-path="url(#q${rotulo.length})">${conteudo}</g></svg>`;
}

const ler = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));

// ---------- Janela A: gaveta (≈ 450 m) ----------
const A = ler("janela-A-gaveta.geojson").features;
const vA = vista(220);
const de = (fs_, k) => fs_.filter((f) => f.properties.camada === k);

// Hoje: grade azul, só prédios do índice (os mais perto), tracejados.
{
  var hoje = (() => {
    const pred = de(A, "predio_indice");
    const alvo = pred.find((f) => f.properties.alvo);
    let grade = ""; for (let x = 0; x <= LARG; x += 24) grade += `M${x} 0V${ALT}`; for (let y = 0; y <= ALT; y += 24) grade += `M0 ${y}H${LARG}`;
    const viz = pred.filter((f) => !f.properties.alvo).map((f) => caminhoPoligono(vA, f.geometry)).join("");
    return svg(
      `<rect width="${LARG}" height="${ALT}" fill="#EEF2F6"/><path d="${grade}" stroke="#D9E2EC" stroke-width="1"/>` +
      `<path d="${viz}" fill="${C.azul}" fill-opacity=".05" stroke="${C.azul}" stroke-opacity=".35" stroke-dasharray="4 3" fill-rule="evenodd"/>` +
      (alvo ? `<path d="${caminhoPoligono(vA, alvo.geometry)}" fill="${C.azul}" fill-opacity=".22" stroke="${C.azul}" stroke-width="2.5"/>` : "") +
      pino(vA) + regua(vA), "Mapa do lote hoje");
  })();
}

const gaveta = (() => {
  const agua = de(A, "agua").map((f) => caminhoPoligono(vA, f.geometry)).join("");
  const quadras = de(A, "quadra").map((f) => caminhoPoligono(vA, f.geometry)).join("");
  const lotes = de(A, "lote").filter((f) => !f.properties.alvo).map((f) => caminhoPoligono(vA, f.geometry)).join("");
  const pred = de(A, "predio_indice").filter((f) => !f.properties.alvo).map((f) => caminhoPoligono(vA, f.geometry)).join("");
  const alvo = de(A, "lote").find((f) => f.properties.alvo) || de(A, "predio_indice").find((f) => f.properties.alvo);
  const ruas = rotulosDeRua(vA, de(A, "rua"), { fonte: 8.6, minPx: 60 });
  return svg(
    `<rect width="${LARG}" height="${ALT}" fill="${C.rua}"/>` +
    `<path d="${quadras}" fill="${C.quadra}" fill-rule="evenodd"/>` +
    `<path d="${lotes}" fill="${C.lote}" stroke="${C.loteLinha}" stroke-width=".6" stroke-linejoin="round"/>` +
    `<path d="${pred}" fill="${C.predio}" stroke="${C.azul}" stroke-opacity=".45" stroke-width=".8" stroke-linejoin="round"/>` +
    `<path d="${agua}" fill="${C.agua}" stroke="${C.aguaLinha}" stroke-width=".6"/>` +
    `<path d="${caminhoPoligono(vA, alvo.geometry)}" fill="${C.azul}" fill-opacity=".85" stroke="${C.azul}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<defs>${ruas.defs}</defs>${ruas.textos}` +
    `<g class="chip"><rect x="10" y="10" width="102" height="34" rx="8" fill="#FFFFFF" fill-opacity=".92" stroke="#E2D9C8"/><text x="18" y="23" class="mono mini">BAIRRO</text><text x="18" y="38" class="bairro-chip">Boa Viagem</text></g>` +
    pino(vA) + regua(vA), "Mapa do lote proposto");
})();

// ---------- Janela B: por perto (≈ 2,6 km), dos arquivos completos ----------
const vB = vista(2600);
console.error("lendo bases completas…");
const quadrasT = ler("brutos/quadras.geojson").features.filter((f) => dentroDaJanela(vB, f.geometry, 5));
const aguaT = ler("brutos/recursos-hidricos.geojson").features.filter((f) => dentroDaJanela(vB, f.geometry));
const pracasT = ler("brutos/parques-e-pracas.geojson").features.filter((f) => f.geometry && dentroDaJanela(vB, f.geometry));
const ruasT = ler("brutos/trechos-de-logradouros.geojson").features.filter((f) => dentroDaJanela(vB, f.geometry));
const bairrosT = ler("brutos/bairros-do-recife.geojson").features.filter((f) => dentroDaJanela(vB, f.geometry));
console.error({ quadras: quadrasT.length, agua: aguaT.length, pracas: pracasT.length, ruas: ruasT.length, bairros: bairrosT.map((b) => b.properties.EBAIRRNOMEOF) });

const porPerto = (() => {
  const quadras = quadrasT.filter((f) => areaPx(vB, f.geometry) > 0.6).map((f) => caminhoPoligono(vB, f.geometry)).join("");
  const agua = aguaT.map((f) => caminhoPoligono(vB, f.geometry)).join("");
  const pracas = pracasT.filter((f) => poligonos(f.geometry).length).map((f) => caminhoPoligono(vB, f.geometry)).join("");
  const atual = bairrosT.find((b) => b.properties.EBAIRRNOMEOF === "Boa Viagem");
  const outros = bairrosT.filter((b) => b !== atual);
  const limites = bairrosT.map((b) => caminhoPoligono(vB, b.geometry)).join("");
  // nome de cada bairro no ponto do quadro mais longe da borda dele
  const nomes = bairrosT.map((b) => {
    const rings = poligonos(b.geometry).flat().map((r) => r.map(vB.px));
    let melhor = null;
    for (let x = 30; x <= LARG - 30; x += 8) for (let y = 26; y <= ALT - 40; y += 8) {
      if (!rings.some((r) => pontoNoPoligono([x, y], [r]))) continue;
      let d = 1e9; for (const r of rings) for (let i = 1; i < r.length; i += 1) d = Math.min(d, Math.hypot(r[i][0] - x, r[i][1] - y));
      d = Math.min(d, x, LARG - x, y, ALT - y);
      if (!melhor || d > melhor.d) melhor = { x, y, d };
    }
    return melhor && melhor.d > 9 ? { nome: b.properties.EBAIRRNOMEOF, ...melhor, atual: b === atual } : null;
  }).filter(Boolean);
  const evitar = nomes.map((n) => ({ x: n.x, y: n.y - 4, w: n.nome.length * (n.atual ? 5.6 : 4.6) + 8 }));
  const ruas = rotulosDeRua(vB, ruasT, { fonte: 8.4, minPx: 110, evitar, so: (p, nome) => /^Av/.test(nome) || p.CT || p.NMPERIMETR });
  const txtBairros = nomes.map((n) => `<text x="${n.x}" y="${n.y}" class="nome-bairro${n.atual ? " atual" : ""}" text-anchor="middle">${n.nome.toUpperCase()}</text>`).join("");
  return svg(
    `<defs><pattern id="hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#F4F0E8"/><path d="M0 0V7" stroke="#DCD3C2" stroke-width="1.4"/></pattern></defs>` +
    `<rect width="${LARG}" height="${ALT}" fill="url(#hach)"/>` +
    `<path d="${bairrosT.map((b) => caminhoPoligono(vB, b.geometry)).join("")}" fill="${C.rua}"/>` +
    (atual ? `<path d="${caminhoPoligono(vB, atual.geometry)}" fill="${C.acao}" fill-opacity=".07"/>` : "") +
    `<path d="${quadras}" fill="${C.quadra}" fill-rule="evenodd"/>` +
    `<path d="${pracas}" fill="${C.praca}" stroke="${C.pracaLinha}" stroke-width=".6"/>` +
    `<path d="${agua}" fill="${C.agua}" stroke="${C.aguaLinha}" stroke-width=".5"/>` +
    `<path d="${outros.map((b) => caminhoPoligono(vB, b.geometry)).join("")}" fill="none" stroke="${C.apoio}" stroke-width="1" stroke-dasharray="5 3" stroke-opacity=".8"/>` +
    (atual ? `<path d="${caminhoPoligono(vB, atual.geometry)}" fill="none" stroke="${C.barro}" stroke-width="1.6" stroke-opacity=".9"/>` : "") +
    `<defs>${ruas.defs}</defs>${ruas.textos}` + txtBairros +
    pino(vB) + regua(vB), "Por perto proposto");
})();

fs.writeFileSync(SAIDA, JSON.stringify({ hoje, gaveta, porPerto }));
console.error("ok", { hoje: hoje.length, gaveta: gaveta.length, porPerto: porPerto.length });
