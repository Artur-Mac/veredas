// Testes offline do catálogo e do alcance (VE04). Node 22:
//   node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/destinos/testes/destinos.test.mjs
// Geografia SINTÉTICA perto de (−34,90; −8,05).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { montarGrafo } from "../../rede/grafo.mjs";
import { cadeiaDeRecados, criarExplorador, essencialDaCategoria, indexarDestinos, alcancados } from "../alcance.mjs";
import { categoriaDesativada, categoriaOsm, entradaPublica, fechadoNoOsm, fundirCandidatos } from "../catalogo.mjs";

const P = (xm, ym) => [-34.9 + xm / 110222, -8.05 + ym / 110574];

describe("catálogo: categoria, fechados, entradas", () => {
  it("categoria pela etiqueta; escola e igreja não viram mercado", () => {
    assert.equal(categoriaOsm({ shop: "supermarket" }), "mercado");
    assert.equal(categoriaOsm({ shop: "convenience" }), "mercado");
    assert.equal(categoriaOsm({ amenity: "marketplace" }), "mercado");
    assert.equal(categoriaOsm({ amenity: "pharmacy" }), "farmacia");
    assert.equal(categoriaOsm({ leisure: "park" }), "praca");
    assert.equal(categoriaOsm({ leisure: "park", access: "private" }), null);
    assert.equal(categoriaOsm({ amenity: "school" }), null);
    assert.equal(categoriaOsm({ amenity: "place_of_worship" }), null);
  });
  it("local fechado sai, com a categoria que tinha", () => {
    assert.equal(fechadoNoOsm({ "disused:shop": "supermarket" }), true);
    assert.equal(categoriaDesativada({ "disused:shop": "supermarket" }), "mercado");
    assert.equal(fechadoNoOsm({ shop: "vacant" }), true);
    assert.equal(fechadoNoOsm({ amenity: "pharmacy", opening_hours: "closed" }), true);
    assert.equal(fechadoNoOsm({ amenity: "pharmacy", name: "Farmácia Sol (fechada)" }), true);
    assert.equal(fechadoNoOsm({ amenity: "pharmacy", opening_hours: "Mo-Fr 08:00-20:00" }), false);
  });
  it("entrada de serviço, emergência ou saída não serve como entrada pública", () => {
    assert.equal(entradaPublica({ entrance: "main" }), true);
    assert.equal(entradaPublica({ entrance: "yes" }), true);
    for (const e of ["service", "emergency", "exit", "garage"]) assert.equal(entradaPublica({ entrance: e }), false);
    assert.equal(entradaPublica({ entrance: "main", access: "private" }), false);
  });
});

describe("catálogo: fusão de duplicatas", () => {
  const cand = (id, nome, xy, extra = {}) => ({ id, categoria: "farmacia", nome, ponto: P(...xy), destinos: [P(...xy)], horario: null, fontes: ["osm"], entradaMapeada: false, ...extra });
  it("nó e contorno do mesmo estabelecimento (mesmo nome, 20 m) viram um local, com as duas fontes", () => {
    const { locais, duplicatas } = fundirCandidatos([cand("osm:n1", "Farmácia Boa", [0, 0]), cand("pcr:2", "FARMÁCIA BOA", [20, 0], { fontes: ["prefeitura"], horario: { texto: "8h às 18h", fonte: "prefeitura" } })]);
    assert.equal(locais.length, 1);
    assert.deepEqual(locais[0].fontes.sort(), ["osm", "prefeitura"]);
    assert.equal(locais[0].horario.texto, "8h às 18h");
    assert.equal(duplicatas.length, 1);
  });
  it("mesma rede, endereços diferentes (300 m): dois locais", () => {
    const { locais } = fundirCandidatos([cand("osm:n1", "Drogasil", [0, 0]), cand("osm:n2", "Drogasil", [300, 0])]);
    assert.equal(locais.length, 2);
  });
  it("nomes diferentes lado a lado (8 m): dois locais; sem nome a até 25 m: funde", () => {
    assert.equal(fundirCandidatos([cand("osm:n1", "Farmácia A", [0, 0]), cand("osm:n2", "Farmácia B", [8, 0])]).locais.length, 2);
    assert.equal(fundirCandidatos([cand("osm:n1", "Farmácia A", [0, 0]), cand("osm:n2", null, [15, 0])]).locais.length, 1);
    assert.equal(fundirCandidatos([cand("osm:n1", "Farmácia A", [0, 0]), cand("osm:n2", null, [40, 0])]).locais.length, 2);
  });
  it("horário ausente continua ausente (nunca inventado)", () => {
    assert.equal(fundirCandidatos([cand("osm:n1", "Farmácia A", [0, 0])]).locais[0].horario, null);
  });
  it("entrada mapeada de uma cópia substitui os pontos do contorno", () => {
    const { locais } = fundirCandidatos([
      cand("osm:w1", "Mercado X", [0, 0], { destinos: [P(-5, -5), P(5, -5), P(5, 5)] }),
      cand("osm:n2", "Mercado X", [3, 0], { destinos: [P(5, 0)], entradaMapeada: true }),
    ]);
    assert.equal(locais.length, 1);
    assert.equal(locais[0].entradaMapeada, true);
    assert.deepEqual(locais[0].destinos, [P(5, 0)]);
  });
});

// Casa (1) a oeste de um rio. Uma ponte (4–5) leva aos mercados A e B a leste. O mercado C fica a oeste, mais longe.
//   C(10) ── 9 ──────── 1 casa ── 2 ── 3 ──[ponte 4–5]── 6 ── A(7) ── B(8)
function cenario() {
  const pontos = { 1: [0, 0], 2: [100, 0], 3: [150, 0], 4: [160, 0], 5: [240, 0], 6: [250, 0], 7: [300, 0], 8: [400, 0], 9: [-300, 0], 10: [-420, 0] };
  const coords = new Map(Object.entries(pontos).map(([k, v]) => [Number(k), P(...v)]));
  const g = montarGrafo([
    { id: 1, nos: [1, 2, 3, 4], tags: { highway: "residential" } },
    { id: 2, nos: [4, 5], tags: { highway: "footway", bridge: "yes" } },
    { id: 3, nos: [5, 6, 7, 8], tags: { highway: "residential" } },
    { id: 4, nos: [1, 9, 10], tags: { highway: "residential" } },
  ], coords);
  const no = (id) => g.indice.get(id);
  const locais = [
    { id: "A", categoria: "mercado", pontas: [{ no: no(7), m: 0 }] },
    { id: "B", categoria: "mercado", pontas: [{ no: no(8), m: 0 }] },
    { id: "C", categoria: "mercado", pontas: [{ no: no(10), m: 0 }] },
    { id: "F", categoria: "farmacia", pontas: [{ no: no(6), m: 0 }] },
    { id: "G", categoria: "farmacia", pontas: [{ no: no(9), m: 0 }] },
  ];
  return { g, no, locais, mapas: indexarDestinos(locais) };
}

describe("alcance: plano B independente e cadeia de recados", () => {
  it("o segundo mais próximo depende da mesma ponte; o plano B independente é o do outro lado", () => {
    const { g, no, locais, mapas } = cenario();
    const ex = criarExplorador(g);
    const r = essencialDaCategoria(g, ex, [{ no: no(1), m: 0 }], mapas.get("mercado"), { limiteM: 2000 });
    assert.equal(locais[r.primeiro.local].id, "A");
    assert.ok(Math.abs(r.primeiro.metros - 300) < 1);
    assert.ok(r.criticos.length >= 1);
    assert.equal(locais[r.segundo.local].id, "B");
    assert.equal(r.segundo.compartilhaCritico, true);
    assert.equal(locais[r.planoB.local].id, "C");
    assert.equal(r.planoB.motivo, "evita_trechos_criticos");
    assert.ok(Math.abs(r.planoB.metros - 420) < 1);
  });
  it("sem ponte no caminho, o plano B é o segundo mais próximo; sem ninguém além da ponte, não há plano B", () => {
    const { g, no, locais, mapas } = cenario();
    const ex = criarExplorador(g);
    const r = essencialDaCategoria(g, ex, [{ no: no(9), m: 0 }], mapas.get("farmacia"), { limiteM: 2000 });
    assert.equal(locais[r.primeiro.local].id, "G");
    assert.equal(r.criticos.length, 0);
    assert.equal(r.planoB.motivo, "sem_trecho_critico_no_primeiro");
    const daCasa = essencialDaCategoria(g, ex, [{ no: no(2), m: 0 }], mapas.get("farmacia"), { limiteM: 2000 });
    assert.equal(locais[daCasa.primeiro.local].id, "F");
    assert.equal(locais[daCasa.planoB.local].id, "G");
  });
  it("limite de distância: nada além dele", () => {
    const { g, no, mapas } = cenario();
    const ex = criarExplorador(g);
    assert.equal(essencialDaCategoria(g, ex, [{ no: no(1), m: 0 }], mapas.get("mercado"), { limiteM: 250 }), null);
    ex.explorar([{ no: no(1), m: 0 }], { limiteM: 350 });
    assert.deepEqual(alcancados(ex, mapas.get("mercado")).map((x) => x.local), [0]);
  });
  it("cadeia casa → mercado → farmácia → casa nunca é maior que duas idas e aqui economiza", () => {
    const { g, no, locais, mapas } = cenario();
    const ex = criarExplorador(g);
    const origem = [{ no: no(1), m: 0 }];
    ex.explorar(origem, { limiteM: 2000 });
    const dm = new Map(alcancados(ex, mapas.get("mercado")).slice(0, 3).map((x) => [x.local, x.metros]));
    const df = new Map(alcancados(ex, mapas.get("farmacia")).slice(0, 3).map((x) => [x.local, x.metros]));
    const c = cadeiaDeRecados(ex, locais, mapas.get("farmacia"), dm, df);
    assert.ok(c.metros <= c.separadasM);
    // Mercado A (300 m) e farmácia F (250 m, no caminho): 300 + 50 + 250 = 600 contra 2×300 + 2×250 = 1.100.
    assert.equal(locais[c.mercado].id, "A");
    assert.equal(locais[c.farmacia].id, "F");
    // Tolerância de 3 m: a conversão metro → grau da geografia sintética é aproximada (~0,1%).
    assert.ok(Math.abs(c.metros - 600) < 3);
    assert.ok(Math.abs(c.separadasM - 1100) < 3);
  });
});
