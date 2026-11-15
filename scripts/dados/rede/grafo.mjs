// Rede de caminhada (VE03.02): regras de permissão a pé, montagem do grafo e roteamento (VE03.03). Pura: recebe vias e
// nós já lidos (do PBF ou de fixtures) e devolve o grafo. Conexão só por nó compartilhado: duas vias que se cruzam no
// desenho sem nó comum (viaduto, ponte, túnel) NÃO se ligam. Nada aqui lê arquivo.

export const VERSAO_DAS_REGRAS = "1";

const NUNCA = new Set(["motorway", "motorway_link", "construction", "proposed", "raceway", "bus_guideway", "abandoned", "disused", "razed", "bridleway", "escape", "rest_area", "services"]);
const CAMINHAVEIS = new Set([
  "footway", "pedestrian", "path", "steps", "living_street", "residential", "service", "unclassified", "road", "track", "cycleway",
  "corridor", "elevator", "platform", "tertiary", "tertiary_link", "secondary", "secondary_link", "primary", "primary_link", "trunk", "trunk_link",
]);
export const VIAS_PRINCIPAIS = new Set(["trunk", "trunk_link", "primary", "primary_link", "secondary", "secondary_link"]);
const SIM = new Set(["yes", "designated", "permissive", "official"]);
const RESTRITO = new Set(["customers", "destination", "delivery", "agricultural", "forestry"]);

/**
 * "sim" | "restrito" | "nao" para andar na via. `foot` manda sobre `access`; via proibida ou privada nunca entra no
 * grafo; "restrito" (clientes, destino) entra com marca, para não virar atalho público.
 */
export function permissaoAPe(tags) {
  const h = tags.highway;
  if (!h || NUNCA.has(h) || !CAMINHAVEIS.has(h)) return "nao";
  if (tags.area === "yes" && h !== "pedestrian" && h !== "footway") return "nao";
  const foot = tags.foot;
  if (foot === "no" || foot === "private" || foot === "use_sidepath") return "nao";
  if (SIM.has(foot)) return "sim";
  const access = tags.access;
  if (access === "no" || access === "private") return "nao";
  if (RESTRITO.has(access) || RESTRITO.has(foot)) return "restrito";
  return "sim";
}

/** Nó que bloqueia a passagem a pé (portão privado, muro, catraca fechada). */
export function noBloqueia(tags) {
  if (!tags?.barrier) return false;
  if (SIM.has(tags.foot)) return false;
  if (["wall", "fence", "hedge", "retaining_wall", "city_wall"].includes(tags.barrier)) return true;
  if (tags.foot === "no" || tags.foot === "private" || tags.access === "no" || tags.access === "private") return true;
  return false;
}

/** Travessia marcada no nó (faixa, semáforo de pedestre). */
export function eTravessia(tags) {
  return Boolean(tags && (tags.highway === "crossing" || tags.crossing || tags.railway === "crossing"));
}

const R = 6371008.8;
export function distanciaM(lon1, lat1, lon2, lat2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * vias: [{ id, nos:[idOSM…], tags }]; coords: Map idOSM → [lon, lat]; tagsDosNos: Map idOSM → tags.
 * Devolve { nos: Float64Array lon/lat por índice, idsOsm, arestas: [{a,b,m,via,f}], adj (CSR), componentes, … }.
 * Bits de `f`: 1 escada, 2 ponte, 4 túnel, 8 via principal, 16 travessia (footway=crossing), 32 restrito, 64 sem calçada declarada.
 */
export function montarGrafo(vias, coords, tagsDosNos = new Map()) {
  const indice = new Map();
  const idsOsm = [];
  const lon = [], lat = [];
  const indiceDe = (id) => {
    let i = indice.get(id);
    if (i === undefined) {
      const c = coords.get(id);
      if (!c) return -1;
      i = idsOsm.length;
      indice.set(id, i);
      idsOsm.push(id);
      lon.push(c[0]);
      lat.push(c[1]);
    }
    return i;
  };
  const arestas = [];
  const descartes = { semPermissao: 0, bloqueadoPorBarreira: 0, semCoordenada: 0 };
  const viasMantidas = [];
  for (const v of vias) {
    const p = permissaoAPe(v.tags);
    if (p === "nao") { descartes.semPermissao += 1; continue; }
    viasMantidas.push(v.id);
    let f = 0;
    if (v.tags.highway === "steps") f |= 1;
    if (v.tags.bridge && v.tags.bridge !== "no") f |= 2;
    if (v.tags.tunnel && v.tags.tunnel !== "no") f |= 4;
    if (VIAS_PRINCIPAIS.has(v.tags.highway)) f |= 8;
    if (v.tags.footway === "crossing" || v.tags.cycleway === "crossing") f |= 16;
    if (p === "restrito") f |= 32;
    if (VIAS_PRINCIPAIS.has(v.tags.highway) && v.tags.sidewalk === "no") f |= 64;
    for (let k = 0; k + 1 < v.nos.length; k++) {
      const [ida, idb] = [v.nos[k], v.nos[k + 1]];
      if (noBloqueia(tagsDosNos.get(ida)) || noBloqueia(tagsDosNos.get(idb))) { descartes.bloqueadoPorBarreira += 1; continue; }
      const a = indiceDe(ida), b = indiceDe(idb);
      if (a < 0 || b < 0) { descartes.semCoordenada += 1; continue; }
      if (a === b) continue;
      arestas.push({ a, b, m: distanciaM(lon[a], lat[a], lon[b], lat[b]), via: v.id, f });
    }
  }
  const n = idsOsm.length;
  // CSR não dirigido: cada aresta nos dois sentidos (a pé não há mão única).
  const grau = new Int32Array(n + 1);
  for (const e of arestas) { grau[e.a + 1]++; grau[e.b + 1]++; }
  for (let i = 0; i < n; i++) grau[i + 1] += grau[i];
  const viz = new Int32Array(grau[n]), qual = new Int32Array(grau[n]);
  const cursor = grau.slice(0, n);
  arestas.forEach((e, k) => { viz[cursor[e.a]] = e.b; qual[cursor[e.a]++] = k; viz[cursor[e.b]] = e.a; qual[cursor[e.b]++] = k; });
  // Componentes conexos.
  const comp = new Int32Array(n).fill(-1);
  const tamanhos = [];
  for (let s = 0; s < n; s++) {
    if (comp[s] >= 0) continue;
    const c = tamanhos.length;
    let t = 0;
    const pilha = [s];
    comp[s] = c;
    while (pilha.length) {
      const u = pilha.pop();
      t++;
      for (let j = grau[u]; j < grau[u + 1]; j++) if (comp[viz[j]] < 0) { comp[viz[j]] = c; pilha.push(viz[j]); }
    }
    tamanhos.push(t);
  }
  const principal = tamanhos.indexOf(Math.max(0, ...tamanhos));
  return {
    lon: Float64Array.from(lon), lat: Float64Array.from(lat), idsOsm, indice, arestas, inicio: grau, viz, qual, comp, tamanhos,
    componentePrincipal: principal, descartes, viasMantidas: viasMantidas.length,
  };
}

/** Heap binário mínimo sobre (custo, nó). */
class Heap {
  constructor() { this.c = []; this.n = []; }
  get vazio() { return this.c.length === 0; }
  push(custo, no) {
    const c = this.c, n = this.n;
    c.push(custo); n.push(no);
    let i = c.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (c[p] <= c[i]) break;
      [c[p], c[i]] = [c[i], c[p]]; [n[p], n[i]] = [n[i], n[p]];
      i = p;
    }
  }
  pop() {
    const c = this.c, n = this.n;
    const topo = [c[0], n[0]];
    const uc = c.pop(), un = n.pop();
    if (c.length) {
      c[0] = uc; n[0] = un;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < c.length && c[l] < c[m]) m = l;
        if (r < c.length && c[r] < c[m]) m = r;
        if (m === i) break;
        [c[m], c[i]] = [c[i], c[m]]; [n[m], n[i]] = [n[i], n[m]];
        i = m;
      }
    }
    return topo;
  }
}

/**
 * Dijkstra (VE03.03) com várias origens e destinos, cada um com custo inicial (ponto sobre uma aresta liga-se às duas
 * pontas). `origens`/`destinos`: [{ no, m }]. Cenários: `evitarEscadas` remove escadas; `evitarRestritas` remove
 * "restrito"; `penalidadePrincipal` multiplica o custo de andar em via principal (preferência, não proibição).
 * Devolve null sem caminho; senão { metros, arestas:[k…], nos:[i…], origem, destino }.
 */
export function rotaEntre(g, origens, destinos, { evitarEscadas = false, evitarRestritas = true, penalidadePrincipal = 1 } = {}) {
  const n = g.idsOsm.length;
  const dist = new Float64Array(n).fill(Infinity);
  const anterior = new Int32Array(n).fill(-1);
  const h = new Heap();
  for (const o of origens) if (o.m < dist[o.no]) { dist[o.no] = o.m; h.push(o.m, o.no); }
  const fim = new Map(destinos.map((d) => [d.no, d.m]));
  let melhor = Infinity, alvo = -1;
  while (!h.vazio) {
    const [d, u] = h.pop();
    if (d > dist[u]) continue;
    if (d >= melhor) break;
    if (fim.has(u) && d + fim.get(u) < melhor) { melhor = d + fim.get(u); alvo = u; }
    for (let j = g.inicio[u]; j < g.inicio[u + 1]; j++) {
      const k = g.qual[j];
      const e = g.arestas[k];
      if (evitarEscadas && e.f & 1) continue;
      if (evitarRestritas && e.f & 32) continue;
      const v = g.viz[j];
      const nd = d + e.m * (e.f & 8 ? penalidadePrincipal : 1);
      if (nd < dist[v]) { dist[v] = nd; anterior[v] = k; h.push(nd, v); }
    }
  }
  if (alvo < 0) return null;
  const arestas = [], nos = [alvo];
  for (let v = alvo; anterior[v] >= 0;) {
    const k = anterior[v];
    arestas.push(k);
    const e = g.arestas[k];
    v = e.a === v ? e.b : e.a;
    nos.push(v);
  }
  arestas.reverse(); nos.reverse();
  const real = arestas.reduce((s, k) => s + g.arestas[k].m, 0);
  const o = origens.find((x) => x.no === nos[0]);
  return { metros: real + (o?.m ?? 0) + fim.get(alvo), arestas, nos, origem: nos[0], destino: alvo };
}

/** Compatível com a forma simples: de um nó a outro. */
export function rota(g, origem, destino, opcoes = {}) {
  return rotaEntre(g, [{ no: origem, m: 0 }], [{ no: destino, m: 0 }], opcoes);
}

const CELULA = 0.002; // ~220 m

/** Grade espacial das arestas, para achar a aresta mais próxima de um ponto. */
export function indexarArestas(g) {
  const grade = new Map();
  g.arestas.forEach((e, k) => {
    const x0 = Math.floor(Math.min(g.lon[e.a], g.lon[e.b]) / CELULA), x1 = Math.floor(Math.max(g.lon[e.a], g.lon[e.b]) / CELULA);
    const y0 = Math.floor(Math.min(g.lat[e.a], g.lat[e.b]) / CELULA), y1 = Math.floor(Math.max(g.lat[e.a], g.lat[e.b]) / CELULA);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const c = `${x},${y}`;
      if (!grade.has(c)) grade.set(c, []);
      grade.get(c).push(k);
    }
  });
  return grade;
}

/** Ponto mais próximo sobre o segmento a–b (equiretangular local) e a fração t. */
export function projetar(lon, lat, ax, ay, bx, by) {
  const kx = 111319.49 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  const px = (ax - lon) * kx, py = (ay - lat) * ky, qx = (bx - lon) * kx, qy = (by - lat) * ky;
  const dx = qx - px, dy = qy - py;
  const L = dx * dx + dy * dy;
  const t = L === 0 ? 0 : Math.max(0, Math.min(1, -(px * dx + py * dy) / L));
  return { t, metros: Math.hypot(px + t * dx, py + t * dy), lon: ax + t * (bx - ax), lat: ay + t * (by - ay) };
}

/**
 * Aresta mais próxima de (lon, lat) até `raioM` (≤ 200), aceita por `filtro(aresta, k)`. Devolve
 * { k, metros, lon, lat, pontas:[{no, m}, {no, m}] } — as pontas servem de origem/destino em `rotaEntre`.
 */
export function arestaMaisProxima(g, grade, lon, lat, raioM = 60, filtro = () => true) {
  const cx = Math.floor(lon / CELULA), cy = Math.floor(lat / CELULA);
  let melhor = null;
  const vistos = new Set();
  for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
    for (const k of grade.get(`${x},${y}`) ?? []) {
      if (vistos.has(k)) continue;
      vistos.add(k);
      const e = g.arestas[k];
      if (!filtro(e, k)) continue;
      const p = projetar(lon, lat, g.lon[e.a], g.lat[e.a], g.lon[e.b], g.lat[e.b]);
      if (p.metros <= raioM && (!melhor || p.metros < melhor.metros)) melhor = { k, ...p };
    }
  }
  if (!melhor) return null;
  const e = g.arestas[melhor.k];
  return { k: melhor.k, metros: melhor.metros, lon: melhor.lon, lat: melhor.lat, pontas: [{ no: e.a, m: melhor.t * e.m }, { no: e.b, m: (1 - melhor.t) * e.m }] };
}

/** Resumo de uma rota: metros, minutos por velocidade, escadas, pontes, trechos em via principal e travessias marcadas. */
export function resumirRota(g, r, { velocidadesMps = { padrao: 1.2, devagar: 0.8 }, nosTravessia = new Set() } = {}) {
  if (!r) return null;
  const somar = (bit) => r.arestas.reduce((s, k) => s + (g.arestas[k].f & bit ? g.arestas[k].m : 0), 0);
  return {
    metros: Math.round(r.metros),
    minutos: Object.fromEntries(Object.entries(velocidadesMps).map(([k, v]) => [k, Math.round(r.metros / v / 6) / 10])),
    escadasM: Math.round(somar(1)), ponteM: Math.round(somar(2)), viaPrincipalM: Math.round(somar(8)),
    travessiasMarcadas: r.nos.filter((i) => nosTravessia.has(g.idsOsm[i])).length + new Set(r.arestas.filter((k) => g.arestas[k].f & 16).map((k) => g.arestas[k].via)).size,
    vias: [...new Set(r.arestas.map((k) => g.arestas[k].via))],
  };
}

/** Versão da rede: muda quando muda o extrato, as regras, as frentes ou as correções; igual para entradas iguais. */
export function versaoDaRede(sha256, { shaDoExtrato, regras, frentes, correcoes }) {
  return sha256(`${shaDoExtrato}|regras@${regras}|frentes@${frentes}|${JSON.stringify(correcoes)}`).slice(0, 16);
}

/** Reconstrói o grafo a partir da partição publicada pelo VE03 (`grafo.json.gz`): mesmos índices de nó e de aresta. */
export function grafoPublicado(p) {
  const n = p.idsOsm.length;
  const arestas = p.arestas.map(([a, b, m, via, f]) => ({ a, b, m, via, f }));
  const grau = new Int32Array(n + 1);
  for (const e of arestas) { grau[e.a + 1]++; grau[e.b + 1]++; }
  for (let i = 0; i < n; i++) grau[i + 1] += grau[i];
  const viz = new Int32Array(grau[n]), qual = new Int32Array(grau[n]);
  const cursor = grau.slice(0, n);
  arestas.forEach((e, k) => { viz[cursor[e.a]] = e.b; qual[cursor[e.a]++] = k; viz[cursor[e.b]] = e.a; qual[cursor[e.b]++] = k; });
  const comp = Int32Array.from(p.comp);
  const tamanhos = [];
  for (const c of comp) tamanhos[c] = (tamanhos[c] ?? 0) + 1;
  return {
    lon: Float64Array.from(p.lon), lat: Float64Array.from(p.lat), idsOsm: p.idsOsm, indice: new Map(p.idsOsm.map((id, i) => [id, i])),
    arestas, inicio: grau, viz, qual, comp, tamanhos, componentePrincipal: tamanhos.indexOf(Math.max(...tamanhos)), versaoDaRede: p.versaoDaRede,
  };
}
