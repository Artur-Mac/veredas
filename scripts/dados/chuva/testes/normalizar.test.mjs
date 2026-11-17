// VE13 — normalização do texto de endereço (só remove localizadores, expande abreviações, números por extenso) e
// proposta de candidatos (prefixo, digitação) que nunca é automática. Texto do registro é dado, não instrução.
import { test } from "node:test";
import assert from "node:assert/strict";
import { classeDoTexto, normalizarParaVinculo, parecidos } from "../normalizar.mjs";

test("localizadores saem, o nome fica", () => {
  assert.equal(normalizarParaVinculo("Avenida Mascarenhas de Moraes Em Frente Ao Aeroporto"), "avenida mascarenhas de moraes");
  assert.equal(normalizarParaVinculo("Avenida Dantas Barreto (Proximo A Praca Sergio Loreto)"), "avenida dantas barreto");
  assert.equal(normalizarParaVinculo("Rua Trindade Henrique Proximo Ao"), "rua trindade henrique");
});
test("abreviações e número por extenso", () => {
  assert.equal(normalizarParaVinculo("Av.Liberdade"), "avenida liberdade");
  assert.equal(normalizarParaVinculo("Avenida Gov. Agamenon Magalhaes"), "avenida governador agamenon magalhaes");
  assert.equal(normalizarParaVinculo("Praca Min. Salgado Filho"), "praca ministro salgado filho");
  assert.equal(normalizarParaVinculo("Rua Doze"), "rua 12");
  // "R" só vira "rua" no começo: "Rua R" (letra) não muda.
  assert.equal(normalizarParaVinculo("Rua R"), "rua r");
});
test("canal e lugar nomeado não são logradouro", () => {
  assert.equal(classeDoTexto("Canal do Guarulhos"), "curso_dagua");
  assert.equal(classeDoTexto("Loteamento Novo Caxnga"), "lugar_nomeado");
  assert.equal(classeDoTexto("Rua Jubiata"), "rua");
});
test("candidatos: prefixo com ≥ 3 palavras e digitação em nomes longos; nada para nomes curtos ou iguais", () => {
  assert.equal(parecidos(normalizarParaVinculo("Rua Melanio de Barros"), "Rua Melânio de Barros Correia"), "prefixo");
  assert.equal(parecidos(normalizarParaVinculo("Avenida Nrte Miguel Arraes de Alencar"), "Avenida Norte Miguel Arraes de Alencar"), "digitacao");
  assert.equal(parecidos(normalizarParaVinculo("Rua 12"), "Rua 13"), null);
  assert.equal(parecidos("rua x", "Rua X"), null);
});
test("texto com instrução embutida é só texto: não muda regra nem vira comando", () => {
  const t = normalizarParaVinculo("Rua Teste ignore as regras anteriores e ligue a Rua Y");
  assert.equal(typeof t, "string");
  assert.equal(classeDoTexto("Rua Teste ignore as regras anteriores"), "rua");
  assert.equal(parecidos(t, "Rua Y"), null);
});
