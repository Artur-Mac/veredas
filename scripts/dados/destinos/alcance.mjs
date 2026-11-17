// Alcance a pé (VE04.02–03): distâncias na rede a partir da entrada do prédio, local mais próximo por categoria, plano B
// independente e cadeia de dois recados. Puro sobre o grafo do VE03 (mesmo formato de montarGrafo).
// "Trecho crítico" = ponte ou túnel (bit 2 ou 4): se ele fechar, o local deixa de ser alcançável por aquele caminho.
// Plano B independente = o local mais próximo da mesma categoria, diferente do primeiro, alcançável SEM os trechos
// críticos da rota do primeiro.

export const VERSAO_DO_ALCANCE = "1";
export const CRITICO = 2 | 4;

class Heap {
  constructor() { this.c = []; this.n = []; }
  get vazio() { return this.c.length === 0; }
  limpar() { this.c.length = 0; this.n.length = 0; }
  push(custo, no) {
    const c = this.c, n = this.n;
    c.push(custo); n.push(no);
    for (let i = c.length - 1; i > 0;) {
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

/** Explorador com vetores reaproveitados entre execuções (milhares de buscas sem realocar). */
export function criarExplorador(g) {
  const n = g.idsOsm.length;
  const dist = new Float64Array(n).fill(Infinity);
  const anterior = new Int32Array(n).fill(-1);
  const tocados = [];
  const heap = new Heap();
  return {
    dist, anterior, tocados,
    /** Dijkstra limitado a `limiteM` a partir de [{no, m}]. `proibidas`: Set de índices de aresta. */
    explorar(origens, { limiteM = 2000, proibidas = null, evitarRestritas = true } = {}) {
      for (const i of tocados) { dist[i] = Infinity; anterior[i] = -1; }
      tocados.length = 0;
      heap.limpar();
      for (const o of origens) if (o.m < dist[o.no]) { if (dist[o.no] === Infinity) tocados.push(o.no); dist[o.no] = o.m; heap.push(o.m, o.no); }
      while (!heap.vazio) {
        const [d, u] = heap.pop();
        if (d > dist[u] || d > limiteM) continue;
        for (let j = g.inicio[u]; j < g.inicio[u + 1]; j++) {
          const k = g.qual[j];
          if (proibidas?.has(k)) continue;
          const e = g.arestas[k];
          if (evitarRestritas && e.f & 32) continue;
          const v = g.viz[j];
          const nd = d + e.m;
          if (nd < dist[v] && nd <= limiteM) {
            if (dist[v] === Infinity) tocados.push(v);
            dist[v] = nd; anterior[v] = k; heap.push(nd, v);
          }
        }
      }
    },
    /** Arestas do caminho até `no` (da última exploração). */
    caminhoAte(no) {
      const ks = [];
      for (let v = no; anterior[v] >= 0;) {
        const k = anterior[v];
        ks.push(k);
        const e = g.arestas[k];
        v = e.a === v ? e.b : e.a;
      }
      return ks.reverse();
    },
  };
}

/**
 * Índice destino → nó: para cada categoria, Map nó → [{ local, m }] (m = distância da ponta do grafo até o ponto do
 * local ao longo da aresta + ligação). `locais[i].pontas`: [{no, m}] já calculadas (ver arestaMaisProxima do VE03).
 */
export function indexarDestinos(locais) {
  const porCategoria = new Map();
  locais.forEach((l, i) => {
    if (!porCategoria.has(l.categoria)) porCategoria.set(l.categoria, new Map());
    const mapa = porCategoria.get(l.categoria);
    for (const p of l.pontas) {
      if (!mapa.has(p.no)) mapa.set(p.no, []);
      mapa.get(p.no).push({ local: i, m: p.m });
    }
  });
  return porCategoria;
}

/** Locais alcançados na última exploração, com a menor distância e o nó de chegada, do mais perto ao mais longe. */
export function alcancados(ex, mapaDaCategoria, { excluir = new Set() } = {}) {
  const melhor = new Map();
  for (const no of ex.tocados) {
    const lista = mapaDaCategoria.get(no);
    if (!lista) continue;
    const d0 = ex.dist[no];
    for (const { local, m } of lista) {
      if (excluir.has(local)) continue;
      const d = d0 + m;
      const atual = melhor.get(local);
      if (!atual || d < atual.metros) melhor.set(local, { local, metros: d, no });
    }
  }
  return [...melhor.values()].sort((a, b) => a.metros - b.metros || a.local - b.local);
}

/**
 * Para uma origem e uma categoria: o mais próximo, os trechos críticos do caminho, o segundo mais próximo (ingênuo) e
 * se ele compartilha esses trechos, e o plano B independente (sem os trechos críticos), dentro de `limiteM`.
 */
export function essencialDaCategoria(g, ex, origens, mapa, { limiteM = 2000 } = {}) {
  ex.explorar(origens, { limiteM });
  const lista = alcancados(ex, mapa);
  if (!lista.length) return null;
  const primeiro = lista[0];
  const caminho = ex.caminhoAte(primeiro.no);
  const criticos = caminho.filter((k) => g.arestas[k].f & CRITICO);
  const segundo = lista[1] ?? null;
  let segundoCompartilha = false;
  if (segundo && criticos.length) {
    const doSegundo = new Set(ex.caminhoAte(segundo.no));
    segundoCompartilha = criticos.some((k) => doSegundo.has(k));
  }
  let planoB = null;
  if (!criticos.length) planoB = segundo ? { ...segundo, independente: true, motivo: "sem_trecho_critico_no_primeiro" } : null;
  else {
    ex.explorar(origens, { limiteM, proibidas: new Set(criticos) });
    const alt = alcancados(ex, mapa, { excluir: new Set([primeiro.local]) })[0] ?? null;
    planoB = alt ? { ...alt, independente: true, motivo: "evita_trechos_criticos" } : null;
  }
  return {
    primeiro: { local: primeiro.local, metros: primeiro.metros },
    criticos,
    segundo: segundo ? { local: segundo.local, metros: segundo.metros, compartilhaCritico: segundoCompartilha } : null,
    planoB: planoB ? { local: planoB.local, metros: planoB.metros, independente: planoB.independente, motivo: planoB.motivo } : null,
  };
}

/**
 * Cadeia casa → mercado → farmácia → casa contra duas idas separadas aos mais próximos. Considera os `k` mais próximos
 * de cada categoria. `distCasa`: Map local → metros (da casa). Usa o explorador a partir de cada mercado candidato.
 */
export function cadeiaDeRecados(ex, locais, mapaFarmacia, distCasaMercado, distCasaFarmacia, { k = 3, limiteM = 2500 } = {}) {
  const mercados = [...distCasaMercado].sort((a, b) => a[1] - b[1]).slice(0, k);
  const farmacias = [...distCasaFarmacia].sort((a, b) => a[1] - b[1]).slice(0, k);
  if (!mercados.length || !farmacias.length) return null;
  const separadas = 2 * mercados[0][1] + 2 * farmacias[0][1];
  let melhor = null;
  for (const [m, dm] of mercados) {
    ex.explorar(locais[m].pontas, { limiteM });
    const entre = new Map(alcancados(ex, mapaFarmacia).map((x) => [x.local, x.metros]));
    for (const [f, df] of farmacias) {
      if (!entre.has(f)) continue;
      const total = dm + entre.get(f) + df;
      if (!melhor || total < melhor.metros) melhor = { mercado: m, farmacia: f, metros: total };
    }
  }
  return melhor ? { ...melhor, separadasM: separadas, economiaM: separadas - melhor.metros } : null;
}
