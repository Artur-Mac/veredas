// Conferência de leis de 18/11/2026 (docs/aplicacao/unificacao-2026-11-19/leis-conferidas.md), decisão A5: o que a fonte
// oficial confirma fica; o que diverge é corrigido; o que não se confirmou sai da tela. Estes testes prendem as mudanças
// de cálculo e de texto que a conferência pediu.
import { afterEach, describe, expect, jest, test } from "@jest/globals";
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
import { COMO_PEDIR_ISENCAO_RECIFE, HIPOTESES_ISENCAO_IPTU_RECIFE } from "../src/dados/recife/isencaoIptuRecife";
import { avaliarBioclimatico3d } from "../src/municipios/recife/motores/bioclimatico3d";
import { calcularSpuEstatutario, calcularTetoReajusteSpu } from "../src/nucleo/motores/spuMarinha";
import { avaliarResilienciaRedes, DATA_ASSUNCAO_AQUA_PERNAMBUCO, hojeNoAparelhoIso } from "../src/municipios/recife/motores/resilienciaRedes";
import { cadernoVazio, type DocumentoPessoal } from "../src/dados/caderno";
import { esquemaAnaliseV2, type AnaliseV2 } from "../src/dados/contratos";
import { ALERTAS_DILIGENCIA_RECIFE_2026, derivarImpedimentosPreSinal } from "../src/dados/documentos/copilotoPreSinal";
import { auditarConjuntoDocumental } from "../src/dados/pacoteEspecialista";
import { avaliarEstruturaECondominio, regraDaVistoriaPredialPe } from "../src/municipios/recife/motores/estruturaCondominio";
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

const VAZIO = { valor: null, origem: "link" as const, aConfirmar: true };
function analiseDeTeste(modalidade: "compra" | "aluguel", documentos: DocumentoPessoal[] = []): AnaliseV2 {
  const base = esquemaAnaliseV2.parse({
    versao: 2, id: "leis-1", criadaEm: "2026-11-17T10:00:00Z", atualizadaEm: "2026-11-17T10:00:00Z",
    url: "https://anuncio.invalid/leis", nome: "Apartamento de teste", modalidade, tipologia: "apartamento",
    bairro: "gracas", bairroTexto: "Graças", logradouro: "Rua de Teste", numero: "10", nomeEdificio: "Teste", extracao: null,
    declarados: {
      preco: { valor: 650_000, origem: "link", aConfirmar: false }, condominio: VAZIO, iptu: { ...VAZIO, periodo: "desconhecido" },
      seguroIncendio: VAZIO, taxaServico: VAZIO, outros: VAZIO, area: VAZIO, quartos: VAZIO, suites: VAZIO, banheiros: VAZIO, vagas: VAZIO, andar: VAZIO,
    },
    vinculo: { estado: "pendente" },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null,
  });
  return { ...base, caderno: { ...cadernoVazio(), documentos } };
}
const laudo = (inspecaoEm: string): DocumentoPessoal => ({
  id: `laudo-${inspecaoEm}`, titulo: "Laudo de vistoria", tipo: "laudo", inspecaoEm, emitidoEm: null, recebidoEm: "2026-11-19T12:00:00.000Z",
  origem: "Síndico", escopo: "", trecho: "", pagina: null, vinculo: "confirmado",
});
const vistoriaDoPredio = (anoConstrucao: number | null, ultimaVistoriaAno?: number) =>
  avaliarEstruturaECondominio({
    buildingId: "p", bairroSlug: "gracas", anoConstrucao, anoReferencia: 2026, pavimentos: 12, tipoEstruturaIptu: "Concreto Armado",
    distanciaCostaOuEstuarioM: 3000, ultimaVistoriaAno,
  });

describe("vistoria predial periódica (Lei PE 13.032/2006): 4 anos até 20 anos de construção, 3 depois, carência de 5 anos", () => {
  const estadoDe = (anoConstrucao: number | null, ultimaVistoriaAno?: number) => vistoriaDoPredio(anoConstrucao, ultimaVistoriaAno).vistoriaPeriodicaLei13032;

  test("a regra: exigida de prédio com mais de 5 anos; intervalo de 4 anos até 20 anos e de 3 anos depois", () => {
    expect(regraDaVistoriaPredialPe(null)).toEqual({ exigida: null, intervaloAnos: null });
    expect(regraDaVistoriaPredialPe(0)).toEqual({ exigida: false, intervaloAnos: 4 });
    expect(regraDaVistoriaPredialPe(5)).toEqual({ exigida: false, intervaloAnos: 4 });
    expect(regraDaVistoriaPredialPe(6)).toEqual({ exigida: true, intervaloAnos: 4 });
    expect(regraDaVistoriaPredialPe(20)).toEqual({ exigida: true, intervaloAnos: 4 });
    expect(regraDaVistoriaPredialPe(21)).toEqual({ exigida: true, intervaloAnos: 3 });
    expect(regraDaVistoriaPredialPe(46)).toEqual({ exigida: true, intervaloAnos: 3 });
  });

  test("sem vistoria informada, só se cobra de prédio com mais de 5 anos", () => {
    // Antes, prédio com 3 anos já saía como "vencida ou ausente".
    expect(estadoDe(2023)).toEqual({ obrigatoria: false, intervaloAnos: 4, estado: "ainda_nao_exigida", proximaVistoriaAteAno: null });
    expect(estadoDe(2021).estado).toBe("ainda_nao_exigida");
    expect(estadoDe(2020)).toEqual({ obrigatoria: true, intervaloAnos: 4, estado: "vencida_ou_ausente", proximaVistoriaAteAno: null });
    expect(estadoDe(1984)).toEqual({ obrigatoria: true, intervaloAnos: 3, estado: "vencida_ou_ausente", proximaVistoriaAteAno: null });
    expect(estadoDe(null)).toEqual({ obrigatoria: null, intervaloAnos: null, estado: "nao_sabemos", proximaVistoriaAteAno: null });
  });

  test("com vistoria informada, o prazo é de 4 anos em prédio de até 20 anos e de 3 anos em prédio mais velho", () => {
    // Prédio de 2010 (16 anos): a vistoria de 2022 vale até 2026. Com a regra antiga, de 3 anos, estaria vencida.
    expect(estadoDe(2010, 2022)).toEqual({ obrigatoria: true, intervaloAnos: 4, estado: "em_dia", proximaVistoriaAteAno: 2026 });
    expect(estadoDe(2010, 2021)).toEqual({ obrigatoria: true, intervaloAnos: 4, estado: "vencida_ou_ausente", proximaVistoriaAteAno: 2025 });
    // Prédio de 1990 (36 anos): a mesma vistoria de 2022 venceu em 2025.
    expect(estadoDe(1990, 2022)).toEqual({ obrigatoria: true, intervaloAnos: 3, estado: "vencida_ou_ausente", proximaVistoriaAteAno: 2025 });
    expect(estadoDe(1990, 2023)).toEqual({ obrigatoria: true, intervaloAnos: 3, estado: "em_dia", proximaVistoriaAteAno: 2026 });
    // Sem a idade, só vale o que os dois prazos dizem igual.
    expect(estadoDe(null, 2023).estado).toBe("em_dia");
    expect(estadoDe(null, 2022).estado).toBe("nao_sabemos");
    expect(estadoDe(null, 2021).estado).toBe("vencida_ou_ausente");
  });

  test("o tradutor diz o estado em palavras e não usa mais a palavra trienal", () => {
    const frase = (anoConstrucao: number | null, ultimaVistoriaAno?: number) =>
      cartao(cartoes({ estruturaECondominio: vistoriaDoPredio(anoConstrucao, ultimaVistoriaAno) }), "IND-09").camada2ImpactoPratico;
    expect(frase(2023)).toBe("Vistoria periódica (Lei PE 13.032/2006): ainda não exigida (prédio com até 5 anos).");
    expect(frase(1984)).toBe("Vistoria periódica (Lei PE 13.032/2006): sem laudo informado (exigida de prédio com mais de 5 anos).");
    expect(frase(2010, 2022)).toBe("Vistoria periódica (Lei PE 13.032/2006): em dia, a próxima até 2026.");
    expect(frase(1990, 2022)).toBe("Vistoria periódica (Lei PE 13.032/2006): vencida, o prazo ia até 2025.");
    expect(frase(null)).toBe("Vistoria periódica (Lei PE 13.032/2006): a confirmar.");
    expect(JSON.stringify(cartoes({}))).not.toMatch(/trienal/i);
    expect(cartao(cartoes({}), "IND-02").camada2AcaoConcreta).toBe("Solicite os últimos 3 balancetes, atas de assembleia e o último laudo de vistoria predial.");
  });

  test("o alerta do copiloto traz a regra da lei", () => {
    const alerta = ALERTAS_DILIGENCIA_RECIFE_2026.find((a) => a.id === "vistoria_predial_pe")!;
    expect(alerta.titulo).toBe("Vistoria predial periódica (Lei Estadual PE nº 13.032/2006)");
    expect(alerta.detalhe).toBe(
      "Em Pernambuco, prédio com mais de 5 anos de habite-se deve passar por vistoria técnica a cada 4 anos (até 20 anos de construção) ou a cada 3 anos (mais de 20 anos), com laudo registrado no CREA-PE. Peça ao síndico a cópia do último laudo.",
    );
  });

  test("no pacote para especialista, o prazo do laudo segue a idade do prédio e o laudo não é cobrado de prédio novo", () => {
    const AGORA = "2026-11-19T12:00:00.000Z";
    const estrutura = (a: AnaliseV2, anoConstrucao?: number | null) =>
      auditarConjuntoDocumental(a, AGORA, { anoConstrucao }).itens.find((i) => i.id === "estrutura");

    // Sem laudo: prédio de 2023 não é cobrado; prédio de 2010 e prédio sem ano são.
    const semLaudo = analiseDeTeste("compra");
    expect(auditarConjuntoDocumental(semLaudo, AGORA).totalObrigatorios).toBe(7);
    expect(auditarConjuntoDocumental(semLaudo, AGORA, { anoConstrucao: 2010 }).totalObrigatorios).toBe(7);
    expect(auditarConjuntoDocumental(semLaudo, AGORA, { anoConstrucao: 2023 }).totalObrigatorios).toBe(6);
    expect(estrutura(semLaudo, 2023)).toBeUndefined();
    expect(estrutura(semLaudo, 2010)).toMatchObject({
      estado: "faltando",
      referencia: "Inspeção periódica (Lei Estadual PE nº 13.032/2006 · a cada 3 ou 4 anos, conforme a idade do prédio)",
    });
    expect(auditarConjuntoDocumental(analiseDeTeste("aluguel"), AGORA, { anoConstrucao: 2023 }).totalObrigatorios).toBe(3);

    // Laudo de 3 anos e meio (1.283 dias): em dia num prédio de 16 anos, data antiga num prédio de 36.
    const comLaudo = analiseDeTeste("compra", [laudo("2023-05-16")]);
    expect(estrutura(comLaudo, 2010)).toMatchObject({ estado: "recebido", detalhe: "Inspecionado em 16/05/2023 (1283 dias)" });
    expect(estrutura(comLaudo, 1990)).toMatchObject({ estado: "desatualizado", detalhe: "Inspecionado em 16/05/2023 · 1283 dias (referência: até 1095 dias)" });
    // Sem o ano de construção, não dá para dizer que venceu: fica recebido, com o aviso do prazo menor.
    expect(estrutura(comLaudo)).toMatchObject({
      estado: "recebido",
      detalhe: "Inspecionado em 16/05/2023 (1283 dias) · se o prédio tiver mais de 20 anos, o prazo é de 3 anos",
    });
    // Mais de 4 anos é data antiga em qualquer idade.
    const laudoVelho = analiseDeTeste("compra", [laudo("2022-05-16")]);
    expect(estrutura(laudoVelho)).toMatchObject({ estado: "desatualizado", detalhe: "Inspecionado em 16/05/2022 · 1648 dias (referência: até 1461 dias)" });
    expect(estrutura(laudoVelho, 2010)!.estado).toBe("desatualizado");
    // Prédio novo que já tem laudo guardado continua aparecendo.
    expect(estrutura(analiseDeTeste("compra", [laudo("2025-05-16")]), 2023)!.estado).toBe("recebido");
  });
});

describe("água: início da AQUA Pernambuco marcado para 23/11/2026, pela data real do aparelho", () => {
  const ENTRADA_REDES = { bairroSlug: "gracas", unidadesCondominio: 28, volumeCisternaLitros: 35_000 };
  const AVISO =
    "A partir de 23/11/2026, data marcada pelo Governo de Pernambuco, a distribuição de água passa da Compesa para a concessionária AQUA Pernambuco em cerca de 150 municípios. A Compesa continua produzindo a água. Peça ao vendedor a quitação das contas de água e pergunte à Compesa se há débito em aberto.";

  afterEach(() => {
    jest.useRealTimers();
  });

  test("com a data injetada: Compesa até 22/11/2026, AQUA Pernambuco a partir de 23/11/2026", () => {
    expect(DATA_ASSUNCAO_AQUA_PERNAMBUCO).toBe("2026-11-23");
    expect(avaliarResilienciaRedes(ENTRADA_REDES, "2026-11-19").hidrico.concessionariaDistribuicaoVigente).toBe("Compesa");
    expect(avaliarResilienciaRedes(ENTRADA_REDES, "2026-11-22").hidrico.concessionariaDistribuicaoVigente).toBe("Compesa");
    expect(avaliarResilienciaRedes(ENTRADA_REDES, "2026-11-23").hidrico.concessionariaDistribuicaoVigente).toBe("AQUA Pernambuco (Acciona + BRK)");
    expect(avaliarResilienciaRedes(ENTRADA_REDES, "2027-01-10").hidrico.concessionariaDistribuicaoVigente).toBe("AQUA Pernambuco (Acciona + BRK)");
  });

  test("sem data informada, vale o relógio do aparelho (antes era 24/11/2026 fixo, e a AQUA aparecia antes da hora)", () => {
    // 22/11/2026 às 23h30 no aparelho: ainda é a Compesa.
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 22, 23, 30));
    expect(hojeNoAparelhoIso()).toBe("2026-11-22");
    expect(avaliarResilienciaRedes(ENTRADA_REDES).hidrico.concessionariaDistribuicaoVigente).toBe("Compesa");
    // 23/11/2026 à 0h30 no aparelho: a AQUA Pernambuco assume.
    jest.setSystemTime(new Date(2026, 10, 23, 0, 30));
    expect(hojeNoAparelhoIso()).toBe("2026-11-23");
    expect(avaliarResilienciaRedes(ENTRADA_REDES).hidrico.concessionariaDistribuicaoVigente).toBe("AQUA Pernambuco (Acciona + BRK)");
    // Hoje, 19/11/2026: Compesa.
    jest.setSystemTime(new Date(2026, 10, 19, 12, 0));
    expect(avaliarResilienciaRedes(ENTRADA_REDES).hidrico.concessionariaDistribuicaoVigente).toBe("Compesa");
  });

  test("o aviso não afirma que o débito antigo fica retido na Compesa nem fala em 151 municípios", () => {
    for (const data of ["2026-11-19", "2026-11-23"]) {
      const { hidrico } = avaliarResilienciaRedes(ENTRADA_REDES, data);
      expect(hidrico.avisoMudancaNaDistribuicao).toBe(AVISO);
      expect(hidrico.dataMarcoTransicao).toBe("2026-11-23");
    }
    const alerta = ALERTAS_DILIGENCIA_RECIFE_2026.find((a) => a.id === "aqua_compesa_2026")!;
    expect(alerta.titulo).toBe("Água e saneamento (mudança marcada para 23/11/2026)");
    expect(alerta.detalhe).toBe(AVISO);
    expect(JSON.stringify(ALERTAS_DILIGENCIA_RECIFE_2026)).not.toMatch(/permanecem retidos|151 municípios/);
  });

  test("a ficha do IND-08 muda com a data e diz a fonte", () => {
    const ind08 = (data: string) => cartao(cartoes({}, { resiliencia: avaliarResilienciaRedes(ENTRADA_REDES, data) }), "IND-08");
    const antes = ind08("2026-11-19");
    expect(antes.camada1Manchete).toBe("Reserva estimada para 2.91 dias; início da AQUA Pernambuco na distribuição de água marcado para 23/11/2026.");
    expect(antes.camada2ImpactoPratico).toBe(
      "Distribuição de água hoje: Compesa. A AQUA Pernambuco assume em 23/11/2026, data marcada pelo Governo de Pernambuco.",
    );
    expect(ind08("2026-11-23").camada2ImpactoPratico).toBe(
      "Distribuição de água: AQUA Pernambuco (Acciona + BRK), desde 23/11/2026, data marcada pelo Governo de Pernambuco.",
    );
    expect(antes.camada3ProvaMetodo.metodo6Campos.baseLegalOuNormativa).toBe(
      "Concessão parcial do saneamento de Pernambuco (início da AQUA Pernambuco marcado para 23/11/2026) e indicadores ANEEL/ANATEL.",
    );
    // Sem a leitura das redes, sai a afirmação de que o débito antigo "continua sendo cobrado pela Compesa".
    const semRedes = cartao(cartoes({}), "IND-08");
    expect(semRedes.camada2ImpactoPratico).toBe("Peça ao vendedor a quitação das contas de água e pergunte à Compesa se há débito em aberto.");
    expect(JSON.stringify([antes, semRedes])).not.toMatch(/continuam sendo cobrados|permanecem|Tapacurá/);
  });
});

describe("terreno da União: teto de reajuste, foro pelo Decreto-Lei 9.760/1946 e CAT", () => {
  test("Lei 14.474/2022: o teto do reajuste é 2× o IPCA do ano anterior; os 10,06% de 2022 saíram", () => {
    // Antes, com IPCA de 3% ou de 4,5%, o código devolvia 10,06% (o maior entre os dois).
    expect(calcularTetoReajusteSpu(0.03)).toBe(0.06);
    expect(calcularTetoReajusteSpu(0.045)).toBe(0.09);
    expect(calcularTetoReajusteSpu(0.06)).toBe(0.12);
    expect(calcularTetoReajusteSpu(0)).toBe(0);
    expect(calcularTetoReajusteSpu(-0.01)).toBe(0);
    const base = { regime: "aforamento" as const, valorDominioPlenoTerrenoReais: 15_300_000, fracaoIdeal: 1 / 50 };
    expect(calcularSpuEstatutario({ ...base, ipcaAnual: 0.045 }).tetoReajusteAnualPct).toBe(9);
    expect(calcularSpuEstatutario({ ...base, ipcaAnual: 0.03 }).tetoReajusteAnualPct).toBe(6);
    // Sem o IPCA do ano anterior, o app não supõe um: o teto fica nulo.
    expect(calcularSpuEstatutario(base).tetoReajusteAnualPct).toBeNull();
    expect(fonteDe("nucleo", "motores", "spuMarinha.ts")).not.toMatch(/0\.1006/);
  });

  test("as fichas dizem que o foro vem do Decreto-Lei 9.760/1946 e o laudêmio e a ocupação, do 2.398/1987", () => {
    expect(cartao(cartoes({}), "IND-01").camada3ProvaMetodo.metodo6Campos.baseLegalOuNormativa).toBe(
      "Decreto-Lei nº 9.760/1946 (foro), Decreto-Lei nº 2.398/1987 (laudêmio e taxa de ocupação) e Lei nº 14.474/2022.",
    );
    const bolso = montar(React.createElement(TresPerguntasDoBolso, PROPS_BOLSO));
    const abrir = bolso.root.find((n) => n.props.testID === "bolso-metodo-toggle" && typeof n.props.onPress === "function");
    act(() => abrir.props.onPress());
    const texto = textos(bolso.toJSON());
    expect(texto).toContain(
      "• Terreno da União: foro anual de 0,6% (Decreto-Lei nº 9.760/1946, art. 101) ou taxa de ocupação de 2% (Decreto-Lei nº 2.398/1987, art. 1º), calculados sobre o valor do terreno na fração ideal da unidade, sem as benfeitorias.",
    );
    expect(texto).toContain(
      "• ITBI no Recife (Código Tributário do Recife, Lei 15.563/1991, arts. 52 e 55): 1% sobre a parte financiada pelo SFH, até R$ 1.036.600,71 (valor de 2026), e 1,8% sobre o restante com o lançamento pedido em até 180 dias da assinatura do contrato (3% fora do prazo).",
    );
    expect(texto).not.toMatch(/13\.139\/2015|LC nº 227/);
    act(() => bolso.unmount());

    const boletim = fonteDe("dados", "recife", "boletimPreContrato.ts");
    expect(boletim).toContain("(Decretos-Leis 9.760/1946 e 2.398/1987)");
    expect(boletim).toContain("com checagem da alíquota reduzida de 1,8% (pedido em até 180 dias)");
    expect(boletim).not.toMatch(/\(DL 2\.398\/1987\)|alíquota reduzida SFH/);
  });

  test("a CAT aparece com o nome inteiro, vale 90 dias, e quem paga o laudêmio é o vendedor", () => {
    const alerta = ALERTAS_DILIGENCIA_RECIFE_2026.find((a) => a.id === "cat_spu_90_dias")!;
    expect(alerta.titulo).toBe("Transferência em terreno da União: certidão da SPU (CAT, vale 90 dias)");
    expect(alerta.detalhe).toBe(
      "Quando o terreno é da União, o vendedor paga o laudêmio (5% do valor do terreno na fração ideal da unidade) antes da escritura, e a SPU emite a Certidão de Autorização para Transferência (CAT), que vale 90 dias.",
    );
    const [trava] = derivarImpedimentosPreSinal({ spuAtivo: true, onusAtivos: [], alertas: [], estadosPacote: { matricula: "recebido" } });
    expect(trava!.comoDestravar).toBe(
      "Conferir se é aforamento ou ocupação e exigir o laudêmio pago pelo vendedor e a Certidão de Autorização para Transferência (CAT) da SPU, que vale 90 dias.",
    );
    expect(calcularSpuEstatutario({ regime: "ocupacao", valorDominioPlenoTerrenoReais: 1_000_000, fracaoIdeal: 0.1 }).limiteEpistemologico).toMatch(
      /Certidão de Autorização para Transferência \(CAT\), que a SPU emite para a venda e vale 90 dias\.$/,
    );
  });
});

describe("aluguel: alíneas do art. 22 da Lei 8.245/1991, fiança sem citar a lei e curta temporada pelo REsp 2.121.055", () => {
  test("fundo de reserva é a alínea g; obra de estrutura e pintura de fachada, as alíneas a e b do parágrafo único", () => {
    const est = avaliarEstruturaECondominio({
      buildingId: "p", bairroSlug: "torre", anoConstrucao: 2012, anoReferencia: 2026, pavimentos: 12, tipoEstruturaIptu: "Concreto Armado",
      distanciaCostaOuEstuarioM: 600,
      itensBoleto: [
        { descricao: "Taxa ordinária", valorReais: 680, categoria: "ordinaria" },
        { descricao: "Fundo de reserva", valorReais: 68, categoria: "fundo_reserva" },
        { descricao: "Reforma estrutural", valorReais: 320, categoria: "obra_estrutural" },
        { descricao: "Pintura da fachada", valorReais: 290, categoria: "pintura_externa_desgaste" },
      ],
    });
    const FUNDO = "Art. 22, X e parágrafo único, alínea 'g', da Lei nº 8.245/1991 (fundo de reserva é despesa extraordinária, paga pelo locador)";
    const OBRA = "Art. 22, X e parágrafo único, alíneas 'a' e 'b', da Lei nº 8.245/1991 (obra que interessa à estrutura e pintura de fachada são despesas extraordinárias, pagas pelo locador)";
    expect(est.segregacaoLei8245.itensCobrancaAbusivaNoBoleto.map((i) => i.artigoLegal)).toEqual([FUNDO, OBRA, OBRA]);
    expect(est.segregacaoLei8245.totalOrdinarioInquilinoReais).toBe(680);
    expect(est.segregacaoLei8245.totalExtraordinarioLocadorReais).toBe(678);
    expect(JSON.stringify(est)).not.toMatch(/inciso X, alínea/);
    expect(cartao(cartoes({ estruturaECondominio: est }), "IND-02").camada3ProvaMetodo.metodo6Campos.baseLegalOuNormativa).toBe(
      "ABNT NBR 15575-1:2025, NBR 6118, Lei PE 13.032/2006 e Lei 8.245/1991, art. 22, X e parágrafo único.",
    );
  });

  test("os 10% da fiança são ditos como estimativa de mercado, sem a Lei 8.245/1991 ao lado", () => {
    const simulador = fonteDe("componentes", "visual", "SimuladorBolso15Segundos.tsx");
    expect(simulador).toContain("fiança locatícia estimada em cerca de 10% do aluguel por mês (estimativa de mercado, não é valor de lei)");
    expect(simulador).not.toMatch(/8\.245/);
  });

  test("curta temporada cita a decisão da Segunda Seção do STJ de 07/05/2026, não o REsp 1.819.075", () => {
    const radar = fonteDe("dados", "entorno", "radarVistaELote.ts");
    expect(radar).toContain("STJ (REsp 2.121.055, Segunda Seção, 07/05/2026): em condomínio residencial, oferecer a unidade para estadia de curta temporada depende de aprovação de dois terços dos condôminos em assembleia. Confira a convenção e as atas antes do sinal.");
    expect(radar).toContain("STJ (REsp 2.121.055, Segunda Seção, 07/05/2026): a liberação depende de aprovação de dois terços dos condôminos.");
    expect(radar).not.toMatch(/1\.819\.075/);
  });
});

describe("condomínio e documentos: Acordo-Base nº 01/2024, REsp 1.910.280 e Código Nacional de Normas do CNJ", () => {
  const est = avaliarEstruturaECondominio({
    buildingId: "p", bairroSlug: "torre", anoConstrucao: 1980, anoReferencia: 2026, pavimentos: 4, tipoEstruturaIptu: "Alvenaria Autoportante",
    distanciaCostaOuEstuarioM: 600, constaAcordoTrf5_431: true,
  });

  test("o acordo é o Acordo-Base nº 01/2024, homologado pelo TRF5, e a indenização é um teto", () => {
    expect(est.riscoPredioCaixao).toBe("confirmado_acordo_trf5");
    expect(est.indenizacaoReferenciaTrf5TetoReais).toBe(120_000);
    expect(est.limiteEpistemologico).toBe(
      "Não estar na lista dos 431 prédios do Acordo-Base nº 01/2024 e o relógio de vida útil não substituem vistoria presencial com ART/RRT (Lei PE nº 13.032/2006).",
    );
    const ficha = cartao(cartoes({ estruturaECondominio: est }), "IND-09").camada3ProvaMetodo.metodo6Campos;
    expect(ficha.baseLegalOuNormativa).toBe("Acordo-Base nº 01/2024, homologado pelo TRF5 em 19/06/2024, e Lei Estadual PE 13.032/2006.");
    expect(ficha.oQueMede).toMatch(/Acordo-Base nº 01\/2024 \(431 edifícios\)/);
    expect(JSON.stringify(ficha)).not.toMatch(/Acordo-Base TRF5|Acordo TRF5/);
  });

  test("dívida de condomínio cita só o REsp 1.910.280; o REsp 2.147.665 não foi achado no STJ e saiu", () => {
    expect(est.alertaPropterRemStj).toBe(
      "Dívida de condomínio acompanha o imóvel (STJ, REsp 1.910.280, Segunda Seção, 2025): quem figura na matrícula responde pelos débitos da unidade. Exija certidão negativa de débitos condominiais antes do sinal.",
    );
    expect(fonteDe("municipios", "recife", "motores", "estruturaCondominio.ts")).not.toMatch(/2\.147\.665/);
  });

  test("a ficha da documentação cita o Código Nacional de Normas (Provimento 149/2023) e o art. 642-A, § 4º, da CLT", () => {
    expect(cartao(cartoes({}), "IND-10").camada3ProvaMetodo.metodo6Campos.baseLegalOuNormativa).toBe(
      "Código Nacional de Normas do CNJ, Foro Extrajudicial (Provimento 149/2023, que incorporou o Provimento 143/2023); Decreto 93.240/1986; STJ, REsp 1.910.280.",
    );
    const itens = auditarConjuntoDocumental(analiseDeTeste("compra"), "2026-11-19T12:00:00.000Z").itens;
    expect(itens.find((i) => i.id === "trabalhista")!.referencia).toBe("Débitos e ações trabalhistas (CLT, art. 642-A, § 4º · 180 dias)");
    expect(itens.find((i) => i.id === "matricula")!.referencia).toBe("Certidão de ônus reais (até 30 dias · Dec. nº 93.240/1986)");
  });
});

describe("LPUOS do Recife: Lei 19.426/2025; saem a Lei 19.389/2025 e os Decretos 39.664 a 39.667/2026", () => {
  test("o radar de vista e a ficha do IND-03 citam a Lei nº 19.426, de 03/10/2025", () => {
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 100, andar: 8 });
    expect(bio.radarPerdaVista.notaRegulatoriaLpuos2025).toBe("Leitura segundo a LPUOS do Recife (Lei nº 19.426, de 03/10/2025).");
    expect(cartao(cartoes({}, { bioclimatico: bio }), "IND-03").camada3ProvaMetodo.metodo6Campos.baseLegalOuNormativa).toBe(
      "EN 17037 e Lei municipal do Recife 19.426/2025 (LPUOS).",
    );
    for (const arquivo of [["municipios", "recife", "motores", "bioclimatico3d.ts"], ["dados", "cidadao", "tradutorCidadao.ts"]]) {
      expect(fonteDe(...arquivo)).not.toMatch(/19\.389|39\.66[4-7]/);
    }
    expect(fonteDe("nucleo", "higiene", "arquivosLegados.ts")).toContain("Plano Diretor (LC 2/2021) e LPUOS (Lei 19.426/2025)");
  });
});

describe("IPTU do Recife: aposentado ou pensionista tem desconto de 50%, não isenção (Lei 15.563/1991, arts. 17 e 18)", () => {
  const hipotese = (id: string) => HIPOTESES_ISENCAO_IPTU_RECIFE.find((h) => h.id === id)!;

  test("aposentado ou pensionista: desconto de 50%; a lei não fala em idoso nem em decreto anual", () => {
    const h = hipotese("aposentado_pensionista");
    expect(h.titulo).toBe("Aposentado ou pensionista");
    expect(h.beneficios).toEqual([{ tipo: "desconto", percentual: 50 }]);
    expect(h.requisito).toBe(
      "Aposentado ou pensionista da previdência social com um único imóvel residencial de valor venal até R$ 98.640,00 e renda líquida mensal até R$ 5.356,15 (valores de 2026): desconto de 50% no IPTU (Lei 15.563/1991, art. 18, I, b, e § 4º).",
    );
    expect(`${h.titulo} ${h.requisito}`).not.toMatch(/idoso|decreto anual|isenção/i);
    expect(HIPOTESES_ISENCAO_IPTU_RECIFE.some((x) => x.id === "idoso_aposentado")).toBe(false);
  });

  test("imóvel único: isenção total só até 50 m² e com renda até o limite; fora disso, desconto de 25%", () => {
    const h = hipotese("unico_imovel_popular");
    expect(h.beneficios).toEqual([{ tipo: "isencao_total" }, { tipo: "desconto", percentual: 25 }]);
    expect(h.requisito).toBe(
      "Único imóvel residencial do contribuinte, com até 50 m² de área construída, e renda mensal até o limite da lei (R$ 1.071,22 em 2026): isenção total (Lei 15.563/1991, art. 17, III). Para imóvel único de valor venal até R$ 98.640,00 e renda líquida até R$ 5.356,15 (valores de 2026), desconto de 25% (art. 18, II, a).",
    );
  });

  test("só a primeira hipótese dá isenção total; as que a conferência não cobriu não afirmam benefício", () => {
    const comIsencaoTotal = HIPOTESES_ISENCAO_IPTU_RECIFE.filter((h) => h.beneficios.some((b) => b.tipo === "isencao_total")).map((h) => h.id);
    expect(comIsencaoTotal).toEqual(["unico_imovel_popular"]);
    expect(hipotese("imovel_preservado").beneficios).toEqual([]);
    expect(hipotese("outras_hipoteses").beneficios).toEqual([]);
    expect(COMO_PEDIR_ISENCAO_RECIFE).toMatch(/são os de 2026 e mudam todo ano/);
    expect(fonteDe("componentes", "dossie-v1", "Custo.tsx")).toContain("IPTU no Recife: conferir hipóteses legais de isenção ou desconto");
  });
});
