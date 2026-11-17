// 15/11/2026 — equipamentos por perto (geometria, tipos de saúde, coordenadas trocadas) e a regra do H1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decidirH1, registrosQueSustentam } from "../../chuva/revisao-h1.mjs";
import * as g from "../geometria.mjs";
import { equipamentosDoPonto, lerFontes, tipoDeSaude } from "../rodar-equipamentos.mjs";

const M_LAT = 1 / 111_320;
const M_LON = 1 / (111_320 * Math.cos((8.05 * Math.PI) / 180));
const quadrado = (cx, cy, lado) => {
  const hx = (lado / 2) * M_LON, hy = (lado / 2) * M_LAT;
  return [[[cx - hx, cy - hy], [cx + hx, cy - hy], [cx + hx, cy + hy], [cx - hx, cy + hy], [cx - hx, cy - hy]]];
};

test("distância plana local: 100 m para leste e para norte", () => {
  assert.ok(Math.abs(g.distM(-34.9, -8.05, -34.9 + 100 * M_LON, -8.05) - 100) < 0.5);
  assert.ok(Math.abs(g.distM(-34.9, -8.05, -34.9, -8.05 + 100 * M_LAT) - 100) < 0.5);
});

test("polígono: 0 dentro, distância à borda fora; área de um quadrado de 100 m", () => {
  const q = [quadrado(-34.9, -8.05, 100)];
  assert.equal(g.distAoPoligonoM(-34.9, -8.05, q), 0);
  assert.ok(Math.abs(g.distAoPoligonoM(-34.9 + 80 * M_LON, -8.05, q) - 30) < 0.5);
  assert.ok(Math.abs(g.areaM2(q) - 10_000) < 50);
});

test("linha: distância ao segmento mais perto", () => {
  const linha = [[[-34.9 - 50 * M_LON, -8.05 + 20 * M_LAT], [-34.9 + 50 * M_LON, -8.05 + 20 * M_LAT]]];
  assert.ok(Math.abs(g.distAsLinhasM(-34.9, -8.05, linha) - 20) < 0.5);
});

test("saúde: residência terapêutica, albergue, CAPS e CVA ficam fora; Academia da Cidade é lazer", () => {
  assert.equal(tipoDeSaude("USF"), "saude");
  assert.equal(tipoDeSaude("HOSPITAL"), "saude");
  assert.equal(tipoDeSaude("RESIDENCIA TERAPEUTICA"), null);
  assert.equal(tipoDeSaude("Albergue Terapeutica"), null);
  assert.equal(tipoDeSaude("CAPS AD"), null);
  assert.equal(tipoDeSaude("CVA"), null);
  assert.equal(tipoDeSaude("ACADEMIA DA CIDADE"), "lazer");
});

test("títulos: caixa de título com siglas e preposições", () => {
  assert.equal(g.titulo("PAÇO DO FREVO"), "Paço do Frevo");
  assert.equal(g.titulo("USF  ALTO DO MANDU"), "USF Alto do Mandu");
});

/** Hub falso: só o que lerFontes pede, sem arquivo. */
function hubFalso() {
  const csv = {
    "03995e83-91a3-4719-bedd-488886f103a1": [{ semaforo: "1", latitude: "-8.05", longitude: String(-34.9 + 100 * M_LON) }],
    "d163e8ff-dc1f-410d-81d5-164ea97dc447": [{ semafororo: "13", latitude: "-8.05", longitude: String(-34.9 + 300 * M_LON) }],
    "a7d63c12-f9b2-4ea0-94d3-d6093bc618fa": [
      { referencia: "P001", nome: "A", vagas: "2", latitude: "-8.05", longitude: String(-34.9 + 50 * M_LON) },
      { referencia: "P001", nome: "A", vagas: "2", latitude: "-8.05", longitude: String(-34.9 + 50 * M_LON) },
      { referencia: "P252", nome: "B", vagas: "2", latitude: "-8.031", longitude: "-34.523973" },
    ],
    "26014b26-510a-4805-a9ab-55ade61c3715": [{ nome: "7 - Praça", capacidade: "15", latitude: "-8.05", longitude: String(-34.9 + 400 * M_LON) }],
    // Cultura com latitude e longitude trocadas, como as 68 linhas reais.
    "e5442e5b-75ef-4cc9-8ccb-526dd5ed9f87": [{ equipamento: "TEATRO X", tipo: "MUSEUS E TEATROS", latitude: String(-34.9 + 900 * M_LON), longitude: "-8.05" }],
  };
  const geo = {
    "836b8e24-67d8-49fc-a62c-85602b501e80": { features: [{ properties: { Name: "P252" }, geometry: { type: "Point", coordinates: [-34.9 + 600 * M_LON, -8.05] } }] },
    "1c9feb5e-38ad-4235-b3d2-771964c59c46": { features: [{ properties: { Tipo: "Ciclovia" }, geometry: { type: "LineString", coordinates: [[-34.9 - 100 * M_LON, -8.05 + 30 * M_LAT], [-34.9 + 100 * M_LON, -8.05 + 30 * M_LAT]] } }] },
    "c67fa150-8c69-4f6d-8fca-8204fdd61e35": { features: [] },
    "9a8e3ff8-950c-4548-ad9f-a73aa84dd616": { features: [
      { properties: { NMUNIDAD: "USF X", CDTIPO: "USF" }, geometry: { type: "Polygon", coordinates: quadrado(-34.9, -8.05 - 500 * M_LAT, 20) } },
      { properties: { NMUNIDAD: "RT Y", CDTIPO: "RESIDENCIA TERAPEUTICA" }, geometry: { type: "Polygon", coordinates: quadrado(-34.9, -8.05 - 50 * M_LAT, 20) } },
    ] },
    "bc17896e-b2d9-4378-a87f-2f2440712bfd": { features: [] },
  };
  return {
    lerTabela: ({ recurso, fields }) => ({ registros: (csv[recurso] ?? []).map((r) => Object.fromEntries(fields.map((f) => [f, r[f] ?? null]))) }),
    lerGeojson: (id) => ({ dados: geo[id] ?? { features: [] } }),
  };
}

test("fontes: dedupe de paraciclo, posição pelo GeoJSON, cultura destrocada, residência terapêutica fora", () => {
  const pracas = { features: [{ properties: { CDTIPO: "PRAÇA", NMNOMEOFIC: "PRAÇA Z" }, geometry: { type: "Polygon", coordinates: quadrado(-34.9 + 200 * M_LON, -8.05, 40) } },
    { properties: { CDTIPO: "AREA VERDE" }, geometry: { type: "Polygon", coordinates: quadrado(-34.9, -8.05, 10) } }] };
  const f = lerFontes(hubFalso(), pracas);
  assert.equal(f.paraciclos.length, 2);
  assert.equal(f.rel.paraciclos.posicaoPeloGeojson, 1);
  assert.equal(f.rel.cultura.latLonTrocadas, 1);
  assert.equal(f.cultura[0].p[1], -8.05);
  assert.deepEqual(f.rel.saude.foraDeProposito, { "RESIDENCIA TERAPEUTICA": 1 });
  assert.equal(f.pracas.length, 1);
  const indices = Object.fromEntries(["bikes", "saude", "lazer", "cultura", "ucn", "pracas"].map((k) => [k, { get: (i) => i }]));
  const e = equipamentosDoPonto(-34.9, -8.05, f, indices);
  assert.equal(e.sem, 1);
  assert.equal(e.son, 0);
  assert.equal(e.sonM, 300);
  assert.equal(e.pc, 50);
  assert.equal(e.cv, 30);
  assert.deepEqual(e.bk, [0, 400]);
  assert.deepEqual(e.sd, [0, 490]);
  assert.deepEqual(e.ct, [0, 900]);
  assert.deepEqual(e.pq, [0, 180]);
  assert.equal(e.cc, undefined);
});

test("H1: registros que sustentam consequências e a regra de 3 de 4", () => {
  const obs = (rua) => ({ data: "2024-06-15", rua, bairro: "Madalena", ocorrencia: "Alagamentos" });
  const pacotes = {
    madalena: { observacoes: [obs("Tunel"), obs("Outra")], predios: { a: [{ o: 0 }, { o: 0 }], b: [{ o: 0 }, { o: 1 }] } },
    torre: { observacoes: [obs("Tunel")], predios: { c: [{ o: 0 }] } },
  };
  const r = registrosQueSustentam(pacotes);
  assert.deepEqual(r.map((x) => [x.obs.rua, x.predios.size]), [["Tunel", 3], ["Outra", 1]]);
  const linha = (v, m = "") => ({ "REVISAO_local_correto(sim/nao/incerto)": v, REVISAO_minutos: m });
  assert.equal(decidirH1([linha("sim", "5"), linha("sim", "6"), linha("sim", "7"), linha("nao", "4")]).decisao, "manter");
  assert.equal(decidirH1([linha("sim", "5"), linha("sim", "6"), linha("sim", "7"), linha("nao", "4")]).dentroDoTempo, true);
  assert.equal(decidirH1([linha("sim"), linha("nao"), linha("incerto"), linha("nao")]).decisao, "esconder");
  assert.equal(decidirH1([linha("sim"), linha(""), linha(""), linha("nao")]).decisao, "pendente");
});
