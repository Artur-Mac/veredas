// Espinha de identidade (VE03.01): prédio → frentes oficiais → candidato de entrada → ponto na rede de caminhada.
// Puro. Regras: todas as frentes candidatas ficam (esquina, várias entradas); a frente do código cadastral do prédio é a
// principal; nenhuma ligação atravessa água (polígonos oficiais de recursos hídricos); correções revisadas ficam à parte
// do centroide bruto. Nada aqui é "entrada verificada": são candidatos com classe de confiança e motivo.
import { arestaMaisProxima, projetar } from "./grafo.mjs";

export const VERSAO_DAS_FRENTES = "1";
const CELULA = 0.002;

/** Grade de segmentos de rua oficiais: código → segmentos, indexados por célula. */
export function indexarRuasOficiais(trechos) {
  const grade = new Map();
  for (const f of trechos.features) {
    const codigo = f.properties.CLOGRACODI;
    if (codigo == null || !f.geometry) continue;
    const linhas = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const l of linhas) for (let i = 0; i + 1 < l.length; i++) {
      const s = { codigo: Number(codigo), ax: l[i][0], ay: l[i][1], bx: l[i + 1][0], by: l[i + 1][1] };
      const x0 = Math.floor(Math.min(s.ax, s.bx) / CELULA), x1 = Math.floor(Math.max(s.ax, s.bx) / CELULA);
      const y0 = Math.floor(Math.min(s.ay, s.by) / CELULA), y1 = Math.floor(Math.max(s.ay, s.by) / CELULA);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        const c = `${x},${y}`;
        if (!grade.has(c)) grade.set(c, []);
        grade.get(c).push(s);
      }
    }
  }
  return grade;
}

/** Anéis externos dos polígonos de água, com caixa, numa grade. */
export function indexarAgua(geojson) {
  const grade = new Map();
  for (const f of geojson.features) {
    const g = f.geometry;
    if (!g) continue;
    for (const p of g.type === "MultiPolygon" ? g.coordinates : [g.coordinates]) {
      const anel = p[0];
      let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
      for (const [x, y] of anel) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
      const item = { anel, caixa: [w, s, e, n], nome: f.properties?.NMRECHIDRIC ?? null };
      for (let x = Math.floor(w / CELULA); x <= Math.floor(e / CELULA); x++) for (let y = Math.floor(s / CELULA); y <= Math.floor(n / CELULA); y++) {
        const c = `${x},${y}`;
        if (!grade.has(c)) grade.set(c, []);
        grade.get(c).push(item);
      }
    }
  }
  return grade;
}

function cruza(p1, p2, p3, p4) {
  const d = (a, b, c) => (c[0] - a[0]) * (b[1] - a[1]) - (b[0] - a[0]) * (c[1] - a[1]);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
function dentroDoAnel([x, y], anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i], [xj, yj] = anel[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** O segmento a→b entra em água? (cruza a borda de um polígono ou tem uma ponta dentro dele). Devolve o nome ou null. */
export function atravessaAgua(gradeAgua, a, b) {
  const vistos = new Set();
  const cx = [Math.floor(Math.min(a[0], b[0]) / CELULA), Math.floor(Math.max(a[0], b[0]) / CELULA)];
  const cy = [Math.floor(Math.min(a[1], b[1]) / CELULA), Math.floor(Math.max(a[1], b[1]) / CELULA)];
  for (let x = cx[0]; x <= cx[1]; x++) for (let y = cy[0]; y <= cy[1]; y++) {
    for (const item of gradeAgua.get(`${x},${y}`) ?? []) {
      if (vistos.has(item)) continue;
      vistos.add(item);
      const [w, s, e, n] = item.caixa;
      if (Math.max(a[0], b[0]) < w || Math.min(a[0], b[0]) > e || Math.max(a[1], b[1]) < s || Math.min(a[1], b[1]) > n) continue;
      if (dentroDoAnel(a, item.anel) || dentroDoAnel(b, item.anel)) return item.nome ?? "água";
      for (let i = 0; i + 1 < item.anel.length; i++) if (cruza(a, b, item.anel[i], item.anel[i + 1])) return item.nome ?? "água";
    }
  }
  return null;
}

/** Pontos do contorno do prédio (vértices e pontos médios) ou o centro, quando não há polígono. */
function pontosDoPredio(p) {
  if (!p.poligono || p.poligono.length < 3) return [p.centro];
  const pts = [];
  for (let i = 0; i < p.poligono.length; i++) {
    const a = p.poligono[i], b = p.poligono[(i + 1) % p.poligono.length];
    pts.push(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }
  return pts;
}

/**
 * Frentes candidatas: por código de rua oficial a até `raioM` do contorno, a menor distância e o par (ponto do prédio,
 * ponto da rua). Frentes que atravessam água são recusadas com motivo, nunca escolhidas.
 */
export function frentesDoPredio(predio, gradeRuas, gradeAgua, { raioM = 60 } = {}) {
  const pts = pontosDoPredio(predio);
  const porCodigo = new Map();
  const [lon, lat] = predio.centro;
  const cx = Math.floor(lon / CELULA), cy = Math.floor(lat / CELULA);
  const vistos = new Set();
  for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
    for (const s of gradeRuas.get(`${x},${y}`) ?? []) {
      if (vistos.has(s)) continue;
      vistos.add(s);
      for (const pt of pts) {
        const q = projetar(pt[0], pt[1], s.ax, s.ay, s.bx, s.by);
        if (q.metros > raioM) continue;
        const atual = porCodigo.get(s.codigo);
        if (!atual || q.metros < atual.metros) porCodigo.set(s.codigo, { codigo: s.codigo, metros: q.metros, predio: pt, rua: [q.lon, q.lat] });
      }
    }
  }
  const frentes = [...porCodigo.values()].sort((a, b) => a.metros - b.metros).map((f) => {
    const agua = atravessaAgua(gradeAgua, f.predio, f.rua);
    return { ...f, metros: Math.round(f.metros * 10) / 10, propria: f.codigo === predio.codigoDaRua, recusa: agua ? `atravessa_agua:${agua}` : null };
  });
  return frentes;
}

/**
 * Liga o candidato de entrada (ponto do prédio na frente escolhida) à rede: primeiro a aresta mais próxima cuja via
 * casa com o mesmo código oficial; senão a aresta caminhável mais próxima do componente principal. A ligação também
 * não pode atravessar água.
 */
export function ligarARede(g, gradeArestas, linhagem, gradeAgua, frente, { raioM = 60 } = {}) {
  const [lon, lat] = frente.predio;
  const principal = (e) => g.comp[e.a] === g.componentePrincipal && !(e.f & 32);
  const casada = arestaMaisProxima(g, gradeArestas, lon, lat, raioM, (e) => principal(e) && linhagem.get(e.via) === frente.codigo);
  const qualquer = arestaMaisProxima(g, gradeArestas, lon, lat, Math.min(raioM, 40), principal);
  for (const [cand, metodo] of [[casada, "via_com_mesmo_codigo"], [qualquer, "aresta_mais_proxima"]]) {
    if (!cand) continue;
    const agua = atravessaAgua(gradeAgua, [lon, lat], [cand.lon, cand.lat]);
    if (agua) continue;
    return { ...cand, metodo };
  }
  return null;
}

/** Classe de confiança e motivos (para a fila de revisão). */
export function classificar(frente, ligacao) {
  const motivos = [];
  if (!frente) return { classe: "fraca", motivos: ["sem_frente_propria_a_60m"] };
  if (!frente.propria) motivos.push("frente_de_outra_rua");
  if (frente.metros > 30) motivos.push("frente_a_mais_de_30m");
  if (!ligacao) motivos.push("sem_ligacao_a_rede");
  else {
    if (ligacao.metodo !== "via_com_mesmo_codigo") motivos.push("via_osm_sem_o_mesmo_codigo");
    if (ligacao.metros > 30) motivos.push("ligacao_a_mais_de_30m");
  }
  const graves = motivos.filter((m) => ["sem_ligacao_a_rede", "frente_de_outra_rua", "frente_a_mais_de_30m", "ligacao_a_mais_de_30m"].includes(m));
  return { classe: motivos.length === 0 ? "forte" : graves.length ? "fraca" : "media", motivos };
}

/** Distância (m) de um ponto ao contorno do polígono; 0 quando está dentro. */
export function distanciaAoContorno(ponto, poligono) {
  if (!poligono || poligono.length < 3) return null;
  if (dentroDoAnel(ponto, [...poligono, poligono[0]])) return 0;
  let m = Infinity;
  for (let i = 0; i < poligono.length; i++) {
    const a = poligono[i], b = poligono[(i + 1) % poligono.length];
    m = Math.min(m, projetar(ponto[0], ponto[1], a[0], a[1], b[0], b[1]).metros);
  }
  return m;
}

/**
 * Entrada de um prédio (VE03.01/04): frentes candidatas, frente principal (código cadastral do prédio, sem atravessar
 * água), ligação à rede, frentes adicionais até 15 m (esquinas) e classe. Uma correção revisada (`correcao.ponto`)
 * substitui o candidato automático, guardando a origem; o centroide bruto não muda.
 */
export function entradaDoPredio(predio, { g, gradeArestas, linhagem, gradeRuas, gradeAgua }, correcao = null) {
  const candidatas = frentesDoPredio(predio, gradeRuas, gradeAgua);
  const aceitas = candidatas.filter((f) => !f.recusa);
  const principal = aceitas.find((f) => f.propria) ?? null;
  let ligacao, classe, motivos, origem, frenteUsada;
  if (correcao) {
    frenteUsada = { codigo: predio.codigoDaRua, metros: 0, predio: correcao.ponto, rua: correcao.ponto, propria: true, recusa: null };
    ligacao = ligarARede(g, gradeArestas, linhagem, gradeAgua, frenteUsada);
    ({ classe, motivos } = ligacao ? { classe: "revisada", motivos: [] } : classificar(frenteUsada, ligacao));
    origem = "correcao_revisada";
  } else {
    frenteUsada = principal;
    ligacao = principal ? ligarARede(g, gradeArestas, linhagem, gradeAgua, principal) : null;
    ({ classe, motivos } = classificar(principal, ligacao));
    origem = "candidato_automatico";
  }
  const adicionais = aceitas.filter((f) => f !== principal && f.metros <= 15).map((f) => {
    const l = ligarARede(g, gradeArestas, linhagem, gradeAgua, f);
    return { codigo: f.codigo, metros: f.metros, ligada: Boolean(l), metodo: l?.metodo ?? null };
  });
  return {
    classe, motivos, origem,
    entrada: frenteUsada ? frenteUsada.predio.map((x) => Math.round(x * 1e6) / 1e6) : null,
    principal: principal ? { codigo: principal.codigo, metros: principal.metros } : null,
    recusadas: candidatas.filter((f) => f.recusa).map((f) => ({ codigo: f.codigo, motivo: f.recusa })),
    adicionais,
    ligacao: ligacao ? { aresta: ligacao.k, via: g.arestas[ligacao.k].via, metros: Math.round(ligacao.metros * 10) / 10, metodo: ligacao.metodo, pontas: ligacao.pontas } : null,
  };
}
