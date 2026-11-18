// Conferência de leis de 18/11/2026 (docs/aplicacao/unificacao-2026-11-19/leis-conferidas.md), decisão A5: o que a fonte
// oficial confirma fica; o que diverge é corrigido; o que não se confirmou sai da tela. Estes testes prendem as mudanças
// de cálculo e de texto que a conferência pediu.
import { describe, expect, test } from "@jest/globals";
import { ITBI_MAXIMO, ITBI_MINIMO, placarDoPar, type ExtrasDoPlacar } from "../src/componentes/comparar/placarDoPar";
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
