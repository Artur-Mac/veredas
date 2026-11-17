// Regra das travessias: atravessar a via principal de uma rua lateral para outra conta; andar ao longo dela ou virar
// para ela não; faixa mapeada que toca a via conta.
import { test } from "node:test";
import assert from "node:assert/strict";
import { contarTravessias, grauPrincipal, nosDoCaminho } from "../travessias.mjs";
import { grafoPublicado } from "../../rede/grafo.mjs";

//            n4 (rua lateral norte)
//            |
//   n0 ===== n1 ===== n2      (=== via principal, bit 8)
//            |
//            n3 (rua lateral sul)        n2 —[faixa bit 16]— n5
const P = { idsOsm: [0, 1, 2, 3, 4, 5], lon: [0, 0.001, 0.002, 0.001, 0.001, 0.003], lat: [0, 0, 0, -0.001, 0.001, 0], comp: [0, 0, 0, 0, 0, 0], versaoDaRede: "t",
  arestas: [[0, 1, 110, 1, 8], [1, 2, 110, 1, 8], [1, 3, 110, 2, 0], [1, 4, 110, 3, 0], [2, 5, 110, 4, 16]] };
const g = grafoPublicado(P);
const grau = grauPrincipal(g);
const conta = (ks, inicio) => contarTravessias(g, grau, ks, nosDoCaminho(g, ks, inicio));

test("de uma rua lateral para a outra, cruzando a via principal: 1", () => assert.equal(conta([3, 2], 4), 1));
test("andar ao longo da via principal: 0", () => assert.equal(conta([0, 1], 0), 0));
test("virar da lateral para andar na via principal: 0", () => assert.equal(conta([3, 1], 4), 0));
test("faixa mapeada que toca a via principal: 1", () => assert.equal(conta([1, 4], 1), 1));
