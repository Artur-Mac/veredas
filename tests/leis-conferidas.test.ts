// Conferência de leis de 18/11/2026 (docs/aplicacao/unificacao-2026-11-19/leis-conferidas.md), decisão A5: o que a fonte
// oficial confirma fica; o que diverge é corrigido; o que não se confirmou sai da tela. Estes testes prendem as mudanças
// de cálculo e de texto que a conferência pediu.
import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { ITBI_MAXIMO, ITBI_MINIMO, placarDoPar, type ExtrasDoPlacar } from "../src/componentes/comparar/placarDoPar";
import { SimuladorBolso15Segundos } from "../src/componentes/visual/SimuladorBolso15Segundos";
import { TresPerguntasDoBolso, type PropsTresPerguntasDoBolso } from "../src/componentes/visual/TresPerguntasDoBolso";
import { TemaDoApp } from "../src/tema/Tema";
import { traduzirIndicadoresCidadao, type EntradaTradutorCidadao } from "../src/dados/cidadao/tradutorCidadao";
import { ITBI_ALIQUOTA_MAXIMA, ITBI_ALIQUOTA_MINIMA, estimarTransferencia, type CustoPorPartes } from "../src/dados/custoPorPartes";
import {
  PRAZO_PEDIDO_LANCAMENTO_ITBI_DIAS,
  simularOtimizacaoItbiRecife,
  TETO_SFH_RECIFE_2026_REAIS,
} from "../src/municipios/recife/motores/econometriaItbi";

describe("ITBI do Recife: 1,8% a 3% e prazo único de 180 dias (Código Tributário do Recife, arts. 52 e 55)", () => {
  test("a faixa sobre o preço vai de 1,8% a 3%; o piso de 2% (benefício vencido em 31/12/2025) saiu", () => {
    expect(ITBI_ALIQUOTA_MINIMA).toBe(0.018);
    expect(ITBI_ALIQUOTA_MAXIMA).toBe(0.03);
    expect(ITBI_MINIMO).toBe(0.018);
    expect(ITBI_MAXIMO).toBe(0.03);

    const t = estimarTransferencia(650_000)!;
    expect(t.itbiMinimoReais).toBe(11_700);
    expect(t.itbiMaximoReais).toBe(19_500);
    expect(t.totalMinimoReais).toBe(661_700);
    expect(t.totalMaximoReais).toBe(669_500);
    expect(t.escrituraERegistroReais).toBeNull();
    expect(t.explicacao).toBe(
      "ITBI de R$ 11.700 a R$ 19.500 (1,8% a 3% do preço anunciado: 1,8% se o lançamento for pedido em até 180 dias da assinatura do contrato, 3% depois disso; a parte financiada pelo SFH paga 1% até R$ 1.036.600,71 em 2026. A base é o valor declarado, se a Prefeitura aceitar). Escritura e registro: a confirmar no cartório (tabela de emolumentos do TJPE).",
    );
    expect(t.explicacao).not.toMatch(/2% a 3%/);
    expect(t.fonteCurta).toBe("Código Tributário do Recife (Lei 15.563/1991), arts. 51, 52 e 55; Lei municipal 19.490/2026");
    expect(estimarTransferencia(null)).toBeNull();
    expect(estimarTransferencia(0)).toBeNull();
  });

  test("o placar do Comparar soma o preço com ITBI de 1,8% a 3%", () => {
    const comparacao = {
      rotulos: ["Graças", "Torre"] as [string, string],
      custo: { referencia: "preco_anunciado", colunas: [{ principal: 650000, mensalConhecido: null, pendentes: 0 }, { principal: 1000000, mensalConhecido: null, pendentes: 0 }] },
      espaco: { areas: [80, 90] },
    } as unknown as Parameters<typeof placarDoPar>[0];
    const extras: ExtrasDoPlacar = {
      compra: true, precos: [650000, 1000000], rotina: null,
      ambiente: [{ calorC: null, cotaM: null }, { calorC: null, cotaM: null }], condominioM2: [null, null],
    };
    const total = placarDoPar(comparacao, [null, null], extras).find((l) => l.id === "custo_total")!;
    expect(total.frase).toBe(
      "Graças: R$ 661.700 a R$ 669.500; Torre: R$ 1.018.000 a R$ 1.030.000. Preço + ITBI de 1,8% a 3% (1,8% se o lançamento for pedido em até 180 dias da assinatura do contrato, 3% depois disso); escritura e registro a confirmar no cartório.",
    );
  });

  test("o prazo do cenário de 1,8% é 180 dias em todos os casos; os 30 e 90 dias saíram", () => {
    expect(PRAZO_PEDIDO_LANCAMENTO_ITBI_DIAS).toBe(180);
    for (const financiamentoSfh of [false, true]) {
      for (const precoImovelReais of [180_000, 650_000, 2_400_000]) {
        const sim = simularOtimizacaoItbiRecife({ precoImovelReais, financiamentoSfh });
        expect(sim.aVistaTempestivo18Pct.prazoLegalDias).toBe(180);
        expect(sim.aVistaTempestivo18Pct.aliquotaEfetivaPct).toBe(1.8);
        // 3% é o que paga quem perde o prazo: não tem prazo próprio.
        expect(sim.semOrientacao3Pct.prazoLegalDias).toBeNull();
        expect(sim.semOrientacao3Pct.aliquotaEfetivaPct).toBe(3);
        if (financiamentoSfh) expect(sim.sfhOtimizado1Pct!.prazoLegalDias).toBe(180);
        else expect(sim.sfhOtimizado1Pct).toBeNull();
      }
    }
  });

  test("ITBI de um imóvel de R$ 650 mil: 3% = R$ 19.500; 1,8% = R$ 11.700; SFH com 80% financiado = R$ 7.540", () => {
    const sim = simularOtimizacaoItbiRecife({ precoImovelReais: 650_000, financiamentoSfh: true, percentualFinanciado: 0.8 });
    expect(sim.semOrientacao3Pct.itbiReais).toBe(19_500);
    expect(sim.aVistaTempestivo18Pct.itbiReais).toBe(11_700);
    // 1% sobre R$ 520 mil financiados + 1,8% sobre os R$ 130 mil de entrada.
    expect(sim.sfhOtimizado1Pct!.itbiReais).toBe(7_540);
    expect(sim.sfhOtimizado1Pct!.aliquotaEfetivaPct).toBe(1.16);
  });

  test("a parte financiada pelo SFH só paga 1% até o limite de 2026; o que passa paga 1,8%", () => {
    expect(TETO_SFH_RECIFE_2026_REAIS).toBe(1_036_600.71);
    const sim = simularOtimizacaoItbiRecife({ precoImovelReais: 2_000_000, financiamentoSfh: true, percentualFinanciado: 0.8 });
    // 80% de R$ 2 milhões = R$ 1,6 milhão, acima do limite: 1% sobre R$ 1.036.600,71 e 1,8% sobre o resto.
    expect(sim.sfhOtimizado1Pct!.itbiReais).toBe(Math.round((1_036_600.71 * 0.01 + (2_000_000 - 1_036_600.71) * 0.018) * 100) / 100);
  });

  test("a nota da Lei Complementar federal 227/2026 diz só o que está na lei", () => {
    const { notaBaseDeCalculoLc227, ressalvaLegalConselhos } = simularOtimizacaoItbiRecife({ precoImovelReais: 650_000, financiamentoSfh: false });
    expect(notaBaseDeCalculoLc227).toBe(
      "A Lei Complementar federal 227/2026, de 13/01/2026, mudou o art. 38 do Código Tributário Nacional: a base do ITBI é o valor de venda à vista em condições normais de mercado, estimado pelo município por critérios técnicos que ele deve divulgar. Quem discordar pode contestar com avaliação própria. No Recife (Lei 19.490/2026), vale o valor declarado pelo comprador, se for compatível com esses critérios; se não for, o Fisco arbitra, com direito de defesa. O histórico de transações do prédio serve de apoio para contestar.",
    );
    expect(notaBaseDeCalculoLc227).not.toMatch(/Tema 1\.124|Tema 1\.113|ônus da prova|incidência do ITBI no registro/);
    expect(ressalvaLegalConselhos).toMatch(/arts\. 52 e 55 da Lei Municipal nº 15\.563\/1991/);
  });
});

// Monta só o que o tradutor lê do custo por partes; o resto do quadro não entra nestes testes.
function cartoes(partes: Partial<CustoPorPartes>, extra: Partial<EntradaTradutorCidadao> = {}) {
  return traduzirIndicadoresCidadao({ modalidade: "compra", custoPorPartes: partes as CustoPorPartes, ...extra });
}
const cartao = (lista: ReturnType<typeof cartoes>, id: string) => lista.find((c) => c.indicadorId === id)!;

describe("ficha do ITBI no tradutor (IND-07)", () => {
  test("diz o prazo de 180 dias e cita o Código Tributário do Recife com os artigos certos", () => {
    const ind07 = cartao(cartoes({ otimizacaoFechamento: simularOtimizacaoItbiRecife({ precoImovelReais: 650_000, financiamentoSfh: true }) }), "IND-07");
    expect(ind07.camada2ImpactoPratico).toBe("Pedindo o lançamento do ITBI em até 180 dias da assinatura do contrato, a alíquota cai de 3% para 1,8%.");
    expect(ind07.camada2AcaoConcreta).toBe(
      "Peça o lançamento do ITBI em até 180 dias da assinatura do contrato (em imóvel novo, do habite-se ou do contrato) para pagar 1,8% em vez de 3%. No financiamento pelo SFH, a parte financiada paga 1% até R$ 1.036.600,71 (valor de 2026).",
    );
    expect(ind07.camada3ProvaMetodo.metodo6Campos.baseLegalOuNormativa).toBe(
      "Código Tributário do Recife (Lei 15.563/1991), arts. 51, 52 e 55, com a redação das Leis 17.904/2013, 19.174/2023, 19.391/2025 e 19.490/2026; Lei federal 6.015/1973, art. 290; Ato TJPE 1.556/2025 (tabela de 2026); Lei Complementar federal 227/2026.",
    );
    expect(ind07.camada3ProvaMetodo.metodo6Campos.aritmeticaResumo).toBe(
      "1% sobre a parte financiada pelo SFH até R$ 1.036.600,71 (2026); 1,8% com pedido em até 180 dias; 3% nos demais casos. Expurgo de Chauvenet + IC 80%.",
    );
    const tudo = JSON.stringify(ind07);
    expect(tudo).not.toMatch(/30 dias|90 dias|tempestivo/);
  });
});

const fonteDe = (...partes: string[]) => readFileSync(join(__dirname, "..", "src", ...partes), "utf8");

function textos(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(textos).join(" ");
  return (node.children ?? []).map((c) => (typeof c === "string" ? c : textos(c))).join(" ");
}

function montar(elemento: React.ReactElement): TestRenderer.ReactTestRenderer {
  let arvore!: TestRenderer.ReactTestRenderer;
  act(() => {
    arvore = TestRenderer.create(React.createElement(TemaDoApp, null, elemento));
  });
  return arvore;
}

const PROPS_BOLSO: PropsTresPerguntasDoBolso = {
  modalidade: "compra",
  nomeImovel: "Apartamento de teste",
  enderecoImovel: "Graças",
  precoAnuncioReais: 650_000,
  aluguelAnunciadoReais: null,
  condominioMensalReais: 1_050,
  iptuMensalReais: 300,
  prestacaoEstimadaReais: 4_800,
  entradaReais: 130_000,
  itbiReais: 7_540,
  spuAnualReais: 0,
  custoMensalArReais: 180,
  economiaLegalItbiReais: 11_960,
  descontoRuidoReais: 0,
  vplCalorPoenteReais: 0,
  riscoManutencaoPredioReais: 0,
  excedenteMedianaM2Reais: 0,
};

describe("cartório: sem valor calculado por proporção; a economia é só de ITBI (Ato TJPE 1.556/2025 tem teto)", () => {
  test("nenhum cenário traz valor de escritura e registro, em nenhuma faixa de preço", () => {
    for (const precoImovelReais of [150_000, 278_000, 650_000, 1_300_000, 3_000_000]) {
      const sim = simularOtimizacaoItbiRecife({ precoImovelReais, financiamentoSfh: true });
      for (const cenario of [sim.semOrientacao3Pct, sim.aVistaTempestivo18Pct, sim.sfhOtimizado1Pct!]) {
        expect(cenario.escrituraERegistroReais).toBeNull();
        expect(cenario).not.toHaveProperty("emolumentosERegistroReais");
        expect(cenario).not.toHaveProperty("totalFechamentoReais");
      }
      // A economia do pedido no prazo é a diferença entre 3% e 1,8% do preço, e nada mais.
      expect(sim.economiaAVistaTempestivoReais).toBeCloseTo(precoImovelReais * 0.012, 2);
    }
  });

  test("R$ 650 mil com 80% financiado: a economia era R$ 23.427,15 (com cartório por proporção) e passa a R$ 11.960 (só ITBI)", () => {
    const sim = simularOtimizacaoItbiRecife({ precoImovelReais: 650_000, financiamentoSfh: true, percentualFinanciado: 0.8 });
    expect(sim.economiaAVistaTempestivoReais).toBe(7_800);
    expect(sim.economiaSfhReais).toBe(11_960);
    expect(sim.melhorCenarioEconomiaReais).toBe(11_960);
    expect(sim.economiaSfhReais).toBe(sim.semOrientacao3Pct.itbiReais - sim.sfhOtimizado1Pct!.itbiReais);
    expect(sim.ressalvaLegalConselhos).toMatch(/não inclui escritura e registro \(tabela do TJPE, Ato nº 1\.556\/2025, a confirmar no cartório\)/);
  });

  test("o motor não guarda mais os valores de R$ 16.651,97 e R$ 5.184,82 nem a proporção sobre R$ 650 mil", () => {
    const motor = fonteDe("municipios", "recife", "motores", "econometriaItbi.ts");
    expect(motor).not.toMatch(/16[._]651|5[._]184|650_000/);
  });

  test("a ficha do IND-07 fala de economia de ITBI e deixa o cartório a confirmar", () => {
    const ind07 = cartao(cartoes({ otimizacaoFechamento: simularOtimizacaoItbiRecife({ precoImovelReais: 650_000, financiamentoSfh: true }) }), "IND-07");
    expect(ind07.tituloCurto).toBe("Economia de ITBI e base de preço");
    expect(ind07.camada1Manchete).toBe(
      "Planejamento correto de prazo e financiamento economiza até R$ 11.960 de ITBI; escritura e registro ficam a confirmar no cartório.",
    );
    expect(ind07.camada3ProvaMetodo.metodo6Campos.oQueMede).not.toMatch(/emolumentos/);
    expect(ind07.camada3ProvaMetodo.metodo6Campos.fontePrimaria).toMatch(/a confirmar no cartório/);
  });

  test("no bolso, o dinheiro para entrar é entrada + ITBI e o cartório aparece como a confirmar, sem valor", () => {
    const arvore = montar(React.createElement(TresPerguntasDoBolso, PROPS_BOLSO));
    const texto = textos(arvore.toJSON());
    expect(texto).toContain("Dinheiro à vista para entrar (sem cartório)");
    expect(texto).toContain("Entrada (20%): R$ 130 mil");
    expect(texto).toContain("Imposto (ITBI): R$ 7.540");
    // R$ 130.000 de entrada + R$ 7.540 de ITBI = R$ 137.540; antes o total somava também o cartório por proporção.
    expect(texto).toContain("~R$ 138 mil");
    expect(texto).toContain("Escritura e registro não entram neste total: a confirmar no cartório (tabela de emolumentos do TJPE).");
    expect(texto).toContain("Economia possível de ITBI: até R$ 11.960");
    expect(texto).not.toMatch(/Cartório\/Registro|Economia legal no fechamento|ITBI\/Cartório/);
    act(() => arvore.unmount());
  });

  test("no aluguel, o bolso não fala de cartório", () => {
    const arvore = montar(React.createElement(TresPerguntasDoBolso, { ...PROPS_BOLSO, modalidade: "aluguel", precoAnuncioReais: null, aluguelAnunciadoReais: 3_000 }));
    const texto = textos(arvore.toJSON());
    expect(texto).toContain("Dinheiro à vista para entrar");
    expect(texto).not.toMatch(/cartório/i);
    act(() => arvore.unmount());
  });

  test("o placar de 5 segundos e o simulador de 15 segundos dizem que o total não inclui cartório", () => {
    const fonteDoPlacar = fonteDe("componentes", "visual", "PlacarHeroi5Segundos.tsx");
    expect(fonteDoPlacar).toContain("`Entrada + ITBI ~${formatarReaisCompacto(dinheiroParaEntrarReais)} (sem cartório)`");
    expect(fonteDoPlacar).not.toContain("Entrada + cartório");

    const fonteDoSimulador = fonteDe("componentes", "visual", "SimuladorBolso15Segundos.tsx");
    expect(fonteDoSimulador).toContain("Caixa para entrar (sem cartório)");
    expect(fonteDoSimulador).toContain("escritura e registro a confirmar no cartório, fora da conta");
    expect(fonteDoSimulador).not.toMatch(/totalFechamentoReais|emolumentos/);
    expect(SimuladorBolso15Segundos).toBeDefined();
  });
});
