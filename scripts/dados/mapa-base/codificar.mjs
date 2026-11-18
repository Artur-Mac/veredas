// Formato do arquivo do mapa-base (VERSAO_DO_MAPA_BASE = 1). A leitura (src/dados/recife/mapaBase.ts) decodifica.
//
// Coordenadas: decímetros inteiros no plano local do arquivo (x leste, y SUL, origem = `origem`). Cada seção tem uma
// lista plana de inteiros `g` lida com um cursor que começa em (0, 0) e anda ponto a ponto: cada ponto é gravado como a
// diferença para o ponto anterior da seção (inclusive o primeiro de um anel, em relação ao último do anel anterior).
// - polígonos: por feição, R (número de anéis); por anel, N (pontos) e 2N diferenças. Anel 0 é o contorno.
// - ruas: por rua, L (número de linhas); por linha, N e 2N diferenças.
// Atributos em colunas paralelas, uma posição por feição.
import { METROS_POR_GRAU } from "./geometria.mjs";

export const VERSAO = 1;

export function projetor(origem) {
  const [lon0, lat0] = origem;
  const kx = METROS_POR_GRAU * Math.cos((lat0 * Math.PI) / 180) * 10;
  const ky = METROS_POR_GRAU * 10;
  return (p) => [Math.round((p[0] - lon0) * kx), Math.round(-(p[1] - lat0) * ky)];
}

/** Projeta e arredonda um anel/linha; tira pontos repetidos. Devolve null se degenerar. */
export function quantizar(pts, proj, anel) {
  const q = [];
  for (const p of pts) {
    const [x, y] = proj(p);
    const u = q[q.length - 1];
    if (!u || u[0] !== x || u[1] !== y) q.push([x, y]);
  }
  if (anel && q.length > 1 && q[0][0] === q[q.length - 1][0] && q[0][1] === q[q.length - 1][1]) q.pop();
  if (anel) {
    if (q.length < 3) return null;
    let a = 0;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) a += (q[j][0] - q[i][0]) * (q[j][1] + q[i][1]);
    if (Math.abs(a) / 2 < 5) return null; // < 0,05 m² (5 dm²): área quase nula
  } else if (q.length < 2) return null;
  return q;
}

/** Escritor de lista plana com cursor. */
export function escritor() {
  const g = [];
  let cx = 0, cy = 0;
  return {
    g,
    num(n) { g.push(n); },
    pontos(q) {
      g.push(q.length);
      for (const [x, y] of q) { g.push(x - cx, y - cy); cx = x; cy = y; }
    },
  };
}

/**
 * Quantiza um polígono (lista de anéis em [lon, lat]). Contorno degenerado → null (a feição sai); furo degenerado sai.
 */
export function poligonoQuantizado(aneis, proj) {
  const contorno = quantizar(aneis[0], proj, true);
  if (!contorno) return null;
  const saida = [contorno];
  for (let i = 1; i < aneis.length; i++) { const f = quantizar(aneis[i], proj, true); if (f) saida.push(f); }
  return saida;
}

export function escreverPoligonos(lista) {
  const e = escritor();
  for (const aneis of lista) { e.num(aneis.length); for (const a of aneis) e.pontos(a); }
  return e.g;
}

export function escreverLinhas(lista) {
  const e = escritor();
  for (const linhas of lista) { e.num(linhas.length); for (const l of linhas) e.pontos(l); }
  return e.g;
}
