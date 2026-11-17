// VE06 — livro de alagamentos: boletins duplicados, colunas deslocadas, datas incertas, episódios, mesmo nome em dois
// bairros, rua longa recortada no bairro, modo não informado, travessia que não é a rua e dois caminhos com gargalo comum.
import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparObservacoes, arestasSobre, dataDaLinha, eLugarNomeado, episodios, registroDoLivro, tipoDoAlagamento } from "../livro.mjs";
import { grafoPublicado, indexarArestas } from "../../rede/grafo.mjs";
import { criarExplorador } from "../../destinos/alcance.mjs";
import { criarIndiceDeRuas, vincularRua } from "../../observacoes/vinculo.mjs";

const linha = (rua, data, ocorrencia = "Alagamentos", bairro = "Boa Viagem") => registroDoLivro("teste", { ano: 2024, bairro, rua, ocorrencia, acao: null }, data);

test("tipo: rua alagada × imóvel alagado (com a acentuação perdida da fonte)", () => {
  assert.equal(tipoDoAlagamento("Alagamentos"), "via_alagada");
  assert.equal(tipoDoAlagamento("Imveis Alagados"), "imovel_alagado");
  assert.equal(tipoDoAlagamento("Imóveis Alagados"), "imovel_alagado");
});

test("colunas deslocadas: a data vem de 'Mês' (inclusive com o nome estragado); sem data → null", () => {
  assert.equal(dataDaLinha({ Data: "Imveis com Danos", "MÃªs": "2022-04-19T00:00:00" }), "2022-04-19");
  assert.equal(dataDaLinha({ Data: "2024-04-03T00:00:00", Mês: "Abril" }), "2024-04-03");
  assert.equal(dataDaLinha({ Data: "", Mês: "Abril" }), null);
});

test("boletins duplicados viram uma observação com repetições; data incerta não entra em episódio", () => {
  const regs = [linha("Rua A", "2024-06-15"), linha("Rua A", "2024-06-15"), linha("Rua A", "2024-06-16"), linha("Rua A", null)];
  regs[1] = { ...regs[1], id: "outro" };
  const obs = agruparObservacoes(regs);
  assert.equal(obs.length, 3);
  assert.equal(obs.find((o) => o.dataAdministrativa === "2024-06-15").repeticoes, 2);
  const e = episodios(obs.map((o) => o.dataAdministrativa));
  assert.equal(e.get("2024-06-15"), e.get("2024-06-16"), "folga de 1 dia: mesmo episódio");
  assert.equal(e.size, 2, "a linha só com ano fica fora");
  assert.notEqual(episodios(["2024-06-15", "2024-06-18"]).get("2024-06-18"), "E2024-06-15");
});

test("modo e hora nunca são inventados; lugar nomeado tem outra precisão", () => {
  const r = linha("Tunel da Madalena", "2024-06-25");
  assert.equal(r.modoAfetado, "nao_informado");
  assert.equal(r.horaDoEvento, null);
  assert.equal(r.precisaoDoLocal, "lugar_nomeado");
  assert.equal(eLugarNomeado("Rua do Túnel"), false);
});

test("mesmo nome em dois bairros: liga pelo bairro do registro; fora dos dois, não liga", () => {
  const quadrado = (x) => [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]];
  const bairros = { features: [{ properties: { EBAIRRNOME: "BOA VIAGEM" }, geometry: { type: "Polygon", coordinates: quadrado(0) } }, { properties: { EBAIRRNOME: "MADALENA" }, geometry: { type: "Polygon", coordinates: quadrado(2) } }] };
  const rua = (codigo, x) => ({ properties: { CLOGRACODI: codigo, NLGPAVOFIC: "Rua das Flores" }, geometry: { type: "LineString", coordinates: [[x + 0.2, 0.5], [x + 0.8, 0.5]] } });
  const indice = criarIndiceDeRuas({ features: [rua(1, 0), rua(2, 2)] }, bairros);
  assert.deepEqual(vincularRua(indice, "Rua das Flores", "madalena"), { codigo: 2, metodo: "nome_e_bairro" });
  assert.deepEqual(vincularRua(indice, "Rua das Flores", "boa-viagem"), { codigo: 1, metodo: "nome_e_bairro" });
  assert.equal(vincularRua(indice, "Rua das Flores", "gracas").codigo, null);
});

// Grade em "H": duas ruas paralelas (y = 0 e y = 0.002) ligadas por duas travessas; casa no meio da de baixo.
//   n3 ——— n4 ——— n5
//   |             |
//   n0 ——— n1 ——— n2
const P = { idsOsm: [0, 1, 2, 3, 4, 5], lon: [0, 0.001, 0.002, 0, 0.001, 0.002], lat: [0, 0, 0, 0.002, 0.002, 0.002], comp: [0, 0, 0, 0, 0, 0], versaoDaRede: "t",
  arestas: [[0, 1, 110, 1, 0], [1, 2, 110, 1, 0], [3, 4, 110, 2, 0], [4, 5, 110, 2, 0], [0, 3, 220, 3, 0], [2, 5, 220, 4, 0]] };
const g = grafoPublicado(P);
const grade = indexarArestas(g);

test("arestas sobre a rua: as da própria rua entram; a travessa perpendicular que a toca não", () => {
  const ruaDeBaixo = [{ ax: 0, ay: 0, bx: 0.002, by: 0 }];
  assert.deepEqual([...arestasSobre(g, grade, ruaDeBaixo)].sort(), [0, 1]);
});

test("rua longa recortada: só o trecho dentro do bairro fecha", () => {
  const soMetade = [{ ax: 0, ay: 0, bx: 0.001, by: 0 }];
  assert.deepEqual([...arestasSobre(g, grade, soMetade)], [0]);
});

test("caminho com gargalo: sem o trecho alagado, o explorador acha o desvio pela rua de cima", () => {
  const ex = criarExplorador(g);
  ex.explorar([{ no: 0, m: 0 }], { limiteM: 2000 });
  assert.equal(ex.dist[2], 220);
  ex.explorar([{ no: 0, m: 0 }], { limiteM: 2000, proibidas: arestasSobre(g, grade, [{ ax: 0.001, ay: 0, bx: 0.002, by: 0 }]) });
  assert.equal(ex.dist[2], 220 + 220 + 220, "sobe, atravessa por cima e desce");
  ex.explorar([{ no: 0, m: 0 }], { limiteM: 500, proibidas: new Set([1]) });
  assert.equal(ex.dist[2], Infinity, "fora do limite: perda de acesso, não um desvio inventado");
});
