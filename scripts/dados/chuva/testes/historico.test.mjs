// Histórico da rua e catálogos do eSIG (15/11/2026): vínculo ambíguo, posição longe do nome, meses e anos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cruzarPontos, cruzarTrechos, mesesEAnos, tipoDeViaDiverge, vincularObservacoesARuas } from "../historico.mjs";
import { criarIndiceDeRuas } from "../../observacoes/vinculo.mjs";

const quadrado = (x0, y0, x1, y1) => [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];
const bairros = { type: "FeatureCollection", features: [
  { properties: { EBAIRRNOME: "Graças" }, geometry: { type: "Polygon", coordinates: quadrado(0, 0, 0.01, 0.01) } },
  { properties: { EBAIRRNOME: "Espinheiro" }, geometry: { type: "Polygon", coordinates: quadrado(0.01, 0, 0.02, 0.01) } },
] };
const linha = (codigo, nome, coords) => ({ properties: { CLOGRACODI: codigo, NLGPAVOFIC: nome }, geometry: { type: "LineString", coordinates: coords } });
const trechos = { type: "FeatureCollection", features: [
  linha(1, "Rua Lemos Torres", [[0.001, 0.005], [0.009, 0.005]]),
  linha(2, "Avenida Rui Barbosa", [[0.001, 0.002], [0.019, 0.002]]),
] };
const indice = criarIndiceDeRuas(trechos, bairros);
const segs = new Map([[1, [{ ax: 0.001, ay: 0.005, bx: 0.009, by: 0.005 }]], [2, [{ ax: 0.001, ay: 0.002, bx: 0.019, by: 0.002 }]]]);

test("travessa homônima não entra no histórico da rua; avenida × rua entra", () => {
  assert.equal(tipoDeViaDiverge("Travessa Lemos Torres", "Rua Lemos Torres"), true);
  assert.equal(tipoDeViaDiverge("Avenida Barão de Souza Leão", "Rua Barão de Souza Leão"), false);
  const obs = [
    { tipo: "imovel_alagado", rua: "Travessa Lemos Torres", bairro: "Graças", precisaoDoLocal: "rua" },
    { tipo: "imovel_alagado", rua: "Rua Lemos Torres", bairro: "Graças", precisaoDoLocal: "rua" },
  ];
  const contagem = {};
  const porRua = vincularObservacoesARuas(obs, indice, contagem);
  assert.equal(porRua.get("1|gracas").length, 1);
  assert.deepEqual(contagem, { tipoDeViaDiverge: 1, noHistorico: 1 });
});

test("ponto do eSIG: vinculado só com nome no bairro do polígono e posição perto da rua", () => {
  const ponto = (id, logradouro, bairro, x, y) => ({ properties: { id, objectid: id, logradouro, bairro, precisao: "Aproximado" }, geometry: { type: "Point", coordinates: [x, y] } });
  const r = cruzarPontos({ features: [
    ponto(1, "Rua Lemos Torres", "Graças", 0.005, 0.0051),
    ponto(2, "Rua Lemos Torres", "Graças", 0.005, 0.009), // nome certo, posição a ~440 m da rua
    ponto(3, "Rua Inexistente", "Graças", 0.005, 0.005),
    ponto(4, "Avenida Rui Barbosa", "Graças", 0.015, 0.0021), // bairro da fonte diverge do polígono
  ] }, indice, segs);
  assert.deepEqual(r.map((x) => x.estado), ["vinculado", "nome_longe_da_posicao", "nome_sem_correspondencia", "vinculado"]);
  assert.equal(r[3].bairroConfere, false);
  assert.equal(r[0].codigo, 1);
  assert.equal(r[1].codigo, null);
});

test("trecho do eSIG: código na malha e nome conferem", () => {
  const t = cruzarTrechos({ features: [
    { properties: { fid: 1, clogracodi: 2, nlograconc: "Avenida Rui Barbosa" }, geometry: { type: "LineString", coordinates: [[0.002, 0.002], [0.004, 0.002]] } },
    { properties: { fid: 2, clogracodi: 99, nlograconc: "Rua Sem Malha" }, geometry: { type: "LineString", coordinates: [[0.002, 0.003], [0.004, 0.003]] } },
  ] }, indice);
  assert.deepEqual(t.map((x) => [x.codigoNaMalha, x.nomeConfere, x.bairros]), [[true, true, ["gracas"]], [false, false, ["gracas"]]]);
});

test("meses e anos: só com ano não repete ano datado; sazonal exige série", () => {
  const m = mesesEAnos([{ dataAdministrativa: "2022-05-30", ano: 2022 }, { dataAdministrativa: null, ano: 2022 }, { dataAdministrativa: null, ano: 2016 }]);
  assert.deepEqual(m.rotulos, ["2016", "mai/2022"]);
  assert.equal(m.sazonal, null);
});
