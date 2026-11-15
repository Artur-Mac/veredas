// Travessias de via principal estimadas na rede de caminhada (VE08). Rede de eixo: o lado da calçada não existe, então
// conta-se (a) passar por uma junção da via principal (≥ 2 arestas principais) chegando e saindo por arestas que não
// são a via — de uma rua lateral para outra, atravessando — e (b) usar uma faixa mapeada (bit 16) que toca a via.
// Virar para andar ao longo da via principal não conta. É estimativa: cruzamentos sem faixa mapeada também contam.

/** Quantas arestas de via principal (bit 8) tocam cada nó. */
export function grauPrincipal(g) {
  const grau = new Int32Array(g.idsOsm.length);
  for (const e of g.arestas) if (e.f & 8) { grau[e.a] += 1; grau[e.b] += 1; }
  return grau;
}
/** Nós de um caminho de arestas `ks` começando em `inicio`. */
export function nosDoCaminho(g, ks, inicio) {
  const nos = [inicio];
  let v = inicio;
  for (const k of ks) { const e = g.arestas[k]; v = e.a === v ? e.b : e.a; nos.push(v); }
  return nos;
}
export function contarTravessias(g, grau, ks, nos) {
  let n = 0;
  for (let i = 1; i < nos.length - 1; i++) if (grau[nos[i]] >= 2 && !(g.arestas[ks[i - 1]].f & 8) && !(g.arestas[ks[i]].f & 8)) n += 1;
  for (const k of ks) { const e = g.arestas[k]; if (e.f & 16 && (grau[e.a] || grau[e.b])) n += 1; }
  return n;
}
