// Atrito (CNEFE 2022): categoria por palavra inteira, dedupe, contagem e rumo, e as colunas que nunca são lidas.
import assert from "node:assert/strict";
import { test } from "node:test";
import { atritoDoPonto, categoriaDoEstabelecimento, COLUNAS_NUNCA_LIDAS, indicePorGrade, linhasDoCnefe, pontosDoCnefe, rumo } from "../rodar-atrito.mjs";

test("categoria por palavra inteira: BAR não casa com BARBEARIA nem BARRACA", () => {
  assert.equal(categoriaDoEstabelecimento("BAR DO ZE"), "noite");
  assert.equal(categoriaDoEstabelecimento("BAR E RESTAURANTE"), "noite");
  assert.equal(categoriaDoEstabelecimento("DEPOSITO DE BEBIDAS"), "noite");
  assert.equal(categoriaDoEstabelecimento("BARBEARIA"), "dia");
  assert.equal(categoriaDoEstabelecimento("BARRACA"), null);
  assert.equal(categoriaDoEstabelecimento("OFICINA MECÂNICA"), "oficina");
  assert.equal(categoriaDoEstabelecimento("SUPERMERCADO X"), "mercado");
  assert.equal(categoriaDoEstabelecimento("MERCADINHO"), "dia");
  assert.equal(categoriaDoEstabelecimento("LOJA"), null);
  assert.equal(categoriaDoEstabelecimento(""), null);
});

test("lê só as colunas permitidas; complemento, CEP, quadra e face nunca entram", () => {
  const cab = "COD_UNICO_ENDERECO;CEP;NUM_QUADRA;NUM_FACE;NOM_COMP_ELEM1;VAL_COMP_ELEM1;LATITUDE;LONGITUDE;NV_GEO_COORD;COD_ESPECIE;DSC_ESTABELECIMENTO";
  const linhas = [...linhasDoCnefe(`${cab}\r\n1;50000000;10;5;APARTAMENTO;101;-8.05;-34.90;1;6;BAR DO ZE\r\n`)];
  assert.deepEqual(Object.keys(linhas[0]).sort(), ["descricao", "especie", "lat", "lon", "nivel"]);
  for (const c of ["NOM_COMP_ELEM1", "VAL_COMP_ELEM3", "CEP", "NUM_QUADRA", "NUM_FACE", "COD_UNICO_ENDERECO"]) assert.ok(COLUNAS_NUNCA_LIDAS.test(c), c);
  assert.equal(COLUNAS_NUNCA_LIDAS.test("DSC_ESTABELECIMENTO"), false);
});

test("dedupe: mesma descrição no mesmo ponto, ou a mesma obra; nível aproximado fica fora", () => {
  const l = (especie, descricao, lon = -34.9, lat = -8.05, nivel = 1) => ({ especie, descricao, lon, lat, nivel });
  const { pontos, rel } = pontosDoCnefe([l(6, "BAR DO ZE"), l(6, "BAR DO ZE"), l(6, "BAR DA ANA"), l(7, ""), l(7, ""), l(6, "BAR X", -34.9, -8.05, 4), l(1, "")]);
  assert.equal(pontos.filter((p) => p.cat === "noite").length, 2);
  assert.equal(pontos.filter((p) => p.cat === "obra").length, 1);
  assert.equal(rel.repetidos, 2);
  assert.equal(rel.nivelAproximado, 1);
  assert.ok(pontos.every((p) => Object.keys(p).sort().join() === "cat,lat,lon"), "o ponto não guarda a descrição");
});

test("contagem a 150 m, mais perto até 300 m e rumo", () => {
  const grade = indicePorGrade([{ cat: "noite", lon: -34.9, lat: -8.049 }, { cat: "noite", lon: -34.9, lat: -8.0475 }, { cat: "dia", lon: -34.905, lat: -8.05 }]);
  const a = atritoDoPonto(-34.9, -8.05, grade);
  assert.deepEqual(a.n, [1, 110, 0]);
  assert.equal(a.d, undefined, "a mais de 300 m não entra");
  assert.equal(rumo(-34.9, -8.05, -34.899, -8.05), 90);
  assert.equal(rumo(-34.9, -8.05, -34.9, -8.051), 180);
});
