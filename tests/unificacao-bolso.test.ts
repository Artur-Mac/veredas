// Unificação de 19/11/2026, item R3 (decisões D4 e A4 de 18/11/2026): o bolso não sugere preço nem valor de proposta, e
// a conta de 10 anos começa com valorização de 0% ao ano, escolhida pela pessoa (0, 3 ou 5%) e dita como suposição.
import { describe, expect, it } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import {
  calcularTco10Anos,
  fraseDasSuposicoesTco,
  SimuladorTco10Anos,
  VALORIZACAO_INICIAL,
  VALORIZACOES_ANUAIS,
  type EntradaTco10Anos,
} from "../src/componentes/cidadao/SimuladorTco10Anos";
import { TresPerguntasDoBolso, type PropsTresPerguntasDoBolso } from "../src/componentes/visual/TresPerguntasDoBolso";
import { TemaDoApp } from "../src/tema/Tema";

function textos(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(textos).join(" ");
  return (node.children ?? []).map((c) => (typeof c === "string" ? c : textos(c))).join(" ");
}

const ENTRADA: EntradaTco10Anos = {
  precoCompraReais: 650_000,
  aluguelEquivalenteMensalReais: 2_925,
  condominioMensalReais: 1_050,
  iptuAnualReais: 3_600,
};

const PROPS: PropsTresPerguntasDoBolso = {
  modalidade: "compra",
  nomeImovel: "Apartamento de teste",
  enderecoImovel: "Boa Viagem",
  precoAnuncioReais: 650_000,
  aluguelAnunciadoReais: null,
  condominioMensalReais: 1_050,
  iptuMensalReais: 300,
  prestacaoEstimadaReais: 4_800,
  entradaReais: 130_000,
  itbiReais: 9_000,
  spuAnualReais: 0,
  custoMensalArReais: 180,
  economiaLegalItbiReais: 0,
  descontoRuidoReais: 9_000,
  vplCalorPoenteReais: 7_000,
  riscoManutencaoPredioReais: 12_000,
  excedenteMedianaM2Reais: 40_000,
  entradaTco10Anos: ENTRADA,
};

function montar(elemento: React.ReactElement): TestRenderer.ReactTestRenderer {
  let arvore!: TestRenderer.ReactTestRenderer;
  act(() => {
    arvore = TestRenderer.create(React.createElement(TemaDoApp, null, elemento));
  });
  return arvore;
}

describe("R3: bolso sem alvo de preço e conta de 10 anos com valorização escolhida", () => {
  it("a conta de 10 anos começa em 0% e só oferece 0, 3 e 5% ao ano", () => {
    expect(VALORIZACAO_INICIAL).toBe(0);
    expect([...VALORIZACOES_ANUAIS]).toEqual([0, 0.03, 0.05]);
    const semEscolha = calcularTco10Anos(ENTRADA);
    const zero = calcularTco10Anos({ ...ENTRADA, valorizacaoImovelAnual: 0 });
    const cinco = calcularTco10Anos({ ...ENTRADA, valorizacaoImovelAnual: 0.05 });
    expect(semEscolha).toEqual(zero);
    // Com 0% o imóvel vale em 10 anos o que vale hoje, menos o saldo devedor.
    expect(zero.patrimonioFinalCompraReais).toBeLessThan(ENTRADA.precoCompraReais);
    expect(cinco.saldoLiquidoCompraSobreAluguel10AnosReais).toBeGreaterThan(zero.saldoLiquidoCompraSobreAluguel10AnosReais);
  });

  it("a frase das suposições diz o CDI, os juros, o prazo, o reajuste e o aluguel equivalente usados", () => {
    const frase = fraseDasSuposicoesTco(ENTRADA);
    expect(frase).toContain("CDI líquido de 9,5% ao ano");
    expect(frase).toContain("10,5% ao ano em 15 anos");
    expect(frase).toContain("4,5% ao ano");
    expect(frase).toContain("custo de fechamento (ITBI, escritura e registro) de 2,5% do preço");
    expect(frase).toContain("0,45% do preço ao mês");
  });

  it("o bolso lista fatos para negociar sem valor em reais e sem alvo de proposta", () => {
    const arvore = montar(React.createElement(TresPerguntasDoBolso, PROPS));
    const bloco = arvore.root.find((n) => n.props.testID === "argumentos-negociacao" && typeof n.type !== "string");
    const texto = textos(arvore.toJSON());
    expect(texto).toContain("Fatos que você pode levar à conversa");
    expect(texto).toContain("Pedido acima da mediana das escrituras do prédio (ITBI)");
    expect(texto).toContain("O Vereda não sugere preço nem valor de proposta");
    expect(texto).not.toMatch(/alvo (justo|sugerido)|contraproposta/i);
    // Dentro do bloco de negociação não há nenhum valor em reais.
    const textoDoBloco = bloco.findAll((n) => typeof n.type === "string" && n.children.some((c) => typeof c === "string")).map((n) => n.children.filter((c) => typeof c === "string").join("")).join(" ");
    expect(textoDoBloco).not.toMatch(/R\$/);
    act(() => arvore.unmount());
  });

  it("no bolso, a visão de 10 anos diz a suposição e muda quando a pessoa escolhe outra valorização", () => {
    const arvore = montar(React.createElement(TresPerguntasDoBolso, PROPS));
    const antes = textos(arvore.toJSON());
    expect(antes).toContain("Supondo valorização de 0% ao ano");
    expect(antes).toContain("o Vereda não prevê preço");
    const cinco = arvore.root.find((n) => n.props.testID === "tco-valorizacao-5" && typeof n.props.onPress === "function");
    act(() => cinco.props.onPress());
    const depois = textos(arvore.toJSON());
    expect(depois).toContain("Supondo valorização de 5% ao ano");
    expect(depois).not.toContain("Supondo valorização de 0% ao ano");
    act(() => arvore.unmount());
  });

  it("no simulador de 10 anos, a valorização também começa em 0% e é dita como suposição", () => {
    const arvore = montar(React.createElement(SimuladorTco10Anos, { entrada: ENTRADA }));
    const antes = textos(arvore.toJSON());
    expect(antes).toContain("valorização de 0% ao ano, uma suposição sua");
    const tres = arvore.root.find((n) => n.props.testID === "tco-valorizacao-3" && typeof n.props.onPress === "function");
    act(() => tres.props.onPress());
    const depois = textos(arvore.toJSON());
    expect(depois).toContain("valorização de 3% ao ano, uma suposição sua");
    expect(depois).not.toBe(antes);
    act(() => arvore.unmount());
  });

  it("sem os dados da conta de 10 anos, o bolso não mostra a visão de 10 anos", () => {
    const arvore = montar(React.createElement(TresPerguntasDoBolso, { ...PROPS, entradaTco10Anos: null }));
    expect(textos(arvore.toJSON())).not.toContain("Supondo valorização");
    act(() => arvore.unmount());
  });
});
