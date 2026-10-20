// Testes da tela do dossiê (Fatia 4): as funções puras de apresentação e a tela renderizada com mocks de roteador e de
// estado. Os edifícios, as obras e as análises das funções puras são SINTÉTICOS, montados aqui. A tela renderizada lê o
// índice real de Casa Forte (src/dados/recife/indice), escolhido por critério, nunca por id fixo.
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { AbasDoDossie } from "../src/componentes/dossie-v1/AbasDoDossie";
import { GavetaDoCadastro } from "../src/componentes/dossie-v1/Gavetas";
import { Pressionavel } from "../src/componentes/Pressionavel";
import { abaPorTecla, focarElemento } from "../src/componentes/dossie-v1/teclado";
import { GavetaDeFonte } from "../src/componentes/fonte/GavetaDeFonte";
import {
  EXPLICACAO_DA_CONFIANCA,
  ORDEM_DA_CONFIANCA,
  dataDaFonte,
  descreverFonte,
  orgaoCurto,
  rotuloDaConfianca,
} from "../src/componentes/fonte/textos";
import { carregarCadastro } from "../src/componentes/dossie-v1/cadastro";
import { montarCenaDoLote, poligonoDoLote } from "../src/componentes/dossie-v1/mapa";
import {
  anomaliaResolvida,
  categoriaDaObra,
  corpoQueCabe,
  deltaDaPosicao,
  distanciaDaObra,
  especificacoesDaFaixa,
  fatosCurtos,
  linhaDeEndereco,
  linhasDeDeclarados,
  linhasDeObras,
  linhasDoContexto,
  mesDaObra,
  notaDaPosicao,
  posicoesDoBullet,
  precoPorM2,
  resumoDasObras,
  resumoDoValor,
  rotuloDoTotal,
  segmentosDaBarra,
  situacaoDaObra,
  textoSemPosicao,
  textosSemPredio,
  urlDoAnuncio,
  valorDaPosicao,
} from "../src/componentes/dossie-v1/textos";
import {
  camposVazios,
  esquemaAnaliseV2,
  esquemaEdificio,
  esquemaObra,
  type AnaliseV2,
  type Edificio,
  type MetaDoIndice,
  type Obra,
  type VisaoDoDossie,
} from "../src/dados/contratos";
import { derivarDossie, tipologiaUnica } from "../src/dados/dossie/derivar";
import { formatarReais } from "../src/dados/formatos";
import { formatarChaveCadastral } from "../src/dados/recife/endereco";
import { indiceDoBairro, META } from "../src/dados/recife/indice";
import { TemaDoApp } from "../src/tema/Tema";

type Globais = {
  __router: { push: jest.Mock; replace: jest.Mock; navigate: jest.Mock; back: jest.Mock; canGoBack: jest.Mock; setParams: jest.Mock };
  __params: { id?: string };
  __analises: unknown;
  __descarte: { analiseId: string; visivel: boolean; aoFechar: () => void; aoDescartar?: () => void } | undefined;
};
const G = globalThis as unknown as Globais;

jest.mock("expo-router", () => {
  // O roteador é trocado a cada teste: os métodos olham o objeto atual no momento da chamada.
  const atual = () => (globalThis as unknown as Globais).__router;
  return {
    router: {
      push: (...args: unknown[]) => atual().push(...args),
      replace: (...args: unknown[]) => atual().replace(...args),
      navigate: (...args: unknown[]) => atual().navigate(...args),
      back: () => atual().back(),
      canGoBack: () => atual().canGoBack(),
      setParams: (...args: unknown[]) => atual().setParams(...args),
    },
    useLocalSearchParams: () => (globalThis as unknown as Globais).__params,
  };
});
// `Tela` importa `Etiquetas`, que importa o estado dos exemplos, que importa o armazenamento nativo.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../src/estado/Analises", () => ({
  useAnalises: () => (globalThis as unknown as Globais).__analises,
}));
// A gaveta de descarte é de outra frente: o teste só confere como a tela a usa.
jest.mock("../src/componentes/descarte/GavetaDeDescarte", () => ({
  GavetaDeDescarte: (props: NonNullable<Globais["__descarte"]>) => {
    (globalThis as unknown as Globais).__descarte = props;
    return null;
  },
}));

// ——— Construtores sintéticos ————————————————————————————————————————————————————————

const INSTANTE = "2026-10-20T12:00:00.000Z";
const AGORA = new Date(INSTANTE);
const v = (valor: number | null, aConfirmar = false) => ({ valor, origem: "texto" as const, aConfirmar });
const vazio = v(null);

type Mudancas = Partial<Omit<AnaliseV2, "declarados">> & { declarados?: Partial<AnaliseV2["declarados"]> };

const BASE: AnaliseV2 = {
  versao: 2, id: "analise-tela", criadaEm: INSTANTE, atualizadaEm: INSTANTE,
  nome: "Apartamento sintético de 3 quartos", modalidade: "aluguel", tipologia: "apartamento",
  url: "https://anuncio.invalid/sintetico-1", bairroTexto: "Casa Forte", bairro: "casa-forte",
  logradouro: null, numero: null, nomeEdificio: null, extracao: null,
  declarados: {
    preco: v(4500), condominio: v(1190), iptu: { ...v(288), periodo: "mes" }, seguroIncendio: v(42), taxaServico: vazio, outros: vazio,
    area: v(98), quartos: v(3), suites: vazio, banheiros: v(2), vagas: v(1), andar: v(7),
  },
  vinculo: { estado: "pendente" },
  visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
  salva: true, descarte: null,
};

function analise(mudancas: Mudancas = {}): AnaliseV2 {
  const { declarados, ...resto } = mudancas;
  return esquemaAnaliseV2.parse({ ...BASE, ...resto, declarados: { ...BASE.declarados, ...declarados } });
}

const confirmadoEm = (edificioId: string): AnaliseV2["vinculo"] => ({
  estado: "confirmado", edificioId, dsqfl: "61755015020005", confirmadoEm: INSTANTE, indiceGeradoEm: "2026-10-20T08:15:00Z",
});

/** Um quadrado de cerca de 22 m de lado ao redor do centro. */
function quadrado(lon: number, lat: number, meio = 0.0001): [number, number][] {
  return [[lon - meio, lat - meio], [lon + meio, lat - meio], [lon + meio, lat + meio], [lon - meio, lat + meio]];
}

function edificio(mudancas: Partial<Edificio> = {}): Edificio {
  return esquemaEdificio.parse({
    id: "99001-100", bairro: "casa-forte", logradouro: "RUA SINTETICA ALFA", numero: "100", dsqfl: "61755015020005",
    nome: "Residencial Alfa", centro: [-34.9, -8.03], poligono: quadrado(-34.9, -8.03), unidades: 24,
    tipologias: [
      { area: 98, unidades: 12, iptuAnualMediano: 3936 },
      { area: 124.5, unidades: 12, iptuAnualMediano: 5280 },
    ],
    anoConstrucao: 2010, pavimentos: 12, ate4Pavimentos: false, padrao: "Superior",
    iptuAnual: { n: 24, p25: 3936, mediana: 4608, p75: 5280 },
    itbi: { transmissoes: 12, desde: 2018, ate: 2026, valorUnidade: { n: 12, p25: 760000, mediana: 800000, p75: 840000 }, porAno: [[2018, 3], [2026, 9]] },
    obras150m: { licencasDeObra: 68, relevantes24m: 3, demolicoes24m: 1, recentes: [[0, 40], [1, 113], [2, 150]] },
    ...mudancas,
  });
}

/** Prédio de tipologia única (uma só área, 98 m²): o único em que a compra tem posição pelo ITBI. */
function edificioUnico(mudancas: Partial<Edificio> = {}): Edificio {
  return edificio({ id: "99006-600", tipologias: [{ area: 98, unidades: 24, iptuAnualMediano: 3936 }], ...mudancas });
}

const OBRAS: Obra[] = [
  { categoria: "construcao", descricao: "ALVARA DE CONSTRUCAO INICIAL", data: "2026-05", situacao: "EM EXIGÊNCIA", centro: [-34.9004, -8.0303] },
  { categoria: "demolicao", descricao: "ALVARA DE DEMOLICAO", data: "2025-11", situacao: null, centro: [-34.8988, -8.0295] },
  { categoria: "acrescimo", descricao: "REFORMA COM ACRÉSCIMO DE ÁREA", data: "2026-01", situacao: "DEFERIDO", centro: [-34.8992, -8.0316] },
].map((o) => esquemaObra.parse(o));

function derivar(a: AnaliseV2, e: Edificio | null = null, obras: Obra[] = OBRAS, outras: AnaliseV2[] = []): VisaoDoDossie {
  return derivarDossie(a, e, null, obras, outras, AGORA, null);
}

const META_SINTETICA: Pick<MetaDoIndice, "fontes"> = {
  fontes: [
    {
      chave: "iptu_2026", nome: "IPTU 2026 (cadastro imobiliário)", orgao: "Prefeitura da Cidade do Recife · Secretaria de Finanças",
      licenca: "ODbL", url: "https://dados.recife.pe.gov.br/dataset/imposto-predial-e-territorial-urbano-iptu", recursos: ["r1"],
      modificadoEm: "2026-10-03", consultadoEm: "2026-10-20T16:17:16Z", registrosLidos: 10, colunasUsadas: ["logradouro", "numero"],
    },
  ],
};

// ——— Funções puras de apresentação —————————————————————————————————————————————————————

describe("fonte: textos", () => {
  it("descreve uma base com título, órgão, licença, datas, recorte e colunas do meta", () => {
    const d = descreverFonte("iptu_2026", META_SINTETICA);
    expect(d).toMatchObject({
      tipo: "base",
      titulo: "IPTU 2026 · Prefeitura do Recife · ODbL",
      subtitulo: "IPTU 2026 (cadastro imobiliário)",
      orgao: "Prefeitura da Cidade do Recife · Secretaria de Finanças",
      licenca: "ODbL",
      modificadoEm: "03/10/2026",
      consultadoEm: "20/10/2026",
      colunas: ["logradouro", "numero"],
    });
  });

  it("base fora do meta devolve null, em vez de inventar nome ou data", () => {
    expect(descreverFonte("itbi", META_SINTETICA)).toBeNull();
  });

  it("anúncio e você têm o texto pedido; suas análises explica o cálculo", () => {
    expect(descreverFonte("anuncio", META_SINTETICA)).toMatchObject({ tipo: "anuncio", titulo: "Informado no anúncio" });
    expect(descreverFonte("voce", META_SINTETICA)).toMatchObject({ tipo: "voce", titulo: "Informado por você" });
    expect(descreverFonte("suas_analises", META_SINTETICA)).toMatchObject({ tipo: "suas_analises", titulo: "Suas análises" });
  });

  it("datas e órgão", () => {
    expect(dataDaFonte("2026-03-02")).toBe("02/03/2026");
    expect(dataDaFonte("2026-10-20T16:17:16Z")).toBe("20/10/2026");
    expect(dataDaFonte(null)).toBe("Não informada");
    expect(orgaoCurto("Prefeitura da Cidade do Recife · SEDUL")).toBe("Prefeitura do Recife");
    expect(orgaoCurto("Outro órgão · Setor")).toBe("Outro órgão");
  });

  it("as quatro categorias de confiança, na ordem de index.html, cada uma com rótulo e explicação", () => {
    expect(ORDEM_DA_CONFIANCA).toEqual(["oficial", "declarado", "inferencia", "nao_sabemos"]);
    expect(ORDEM_DA_CONFIANCA.map((c) => rotuloDaConfianca(c))).toEqual([
      "registro oficial", "declarado pelo anunciante", "inferência ou sinal exploratório", "não sabemos",
    ]);
    for (const c of ORDEM_DA_CONFIANCA) expect(EXPLICACAO_DA_CONFIANCA[c].length).toBeGreaterThan(10);
    expect(rotuloDaConfianca("declarado", "voce")).toBe("declarado por você");
  });
});

describe("topo: fatos curtos e especificações", () => {
  it("com prédio confirmado: ano e pavimentos, e a faixa de IPTU do cadastro", () => {
    const e = edificio();
    const visao = derivar(analise({ vinculo: confirmadoEm(e.id) }), e);
    const { construcao, iptu } = fatosCurtos(visao);
    expect(construcao).toMatchObject({ destaque: "Construído em 2010", apoio: "12 pavimentos", fonte: "iptu_2026", confianca: "oficial" });
    expect(iptu).toMatchObject({ destaque: "R$ 328–R$ 440/mês", apoio: "IPTU 2026 no prédio", fonte: "iptu_2026" });
  });

  it("omite o que faltar: sem ano fica só os pavimentos; sem pavimentos fica só o ano", () => {
    const semAno = edificio({ anoConstrucao: null });
    const so1 = fatosCurtos(derivar(analise({ vinculo: confirmadoEm(semAno.id) }), semAno)).construcao;
    expect(so1).toMatchObject({ destaque: "12 pavimentos", apoio: null, fonte: "lotes" });
    const semPav = edificio({ pavimentos: null, ate4Pavimentos: null });
    const so2 = fatosCurtos(derivar(analise({ vinculo: confirmadoEm(semPav.id) }), semPav)).construcao;
    expect(so2).toMatchObject({ destaque: "Construído em 2010", apoio: null });
    const nada = edificio({ anoConstrucao: null, pavimentos: null, ate4Pavimentos: null });
    expect(fatosCurtos(derivar(analise({ vinculo: confirmadoEm(nada.id) }), nada)).construcao).toBeNull();
  });

  it("pavimentos pelo tipo de construção quando o lote não traz o número", () => {
    const e = edificio({ pavimentos: null, ate4Pavimentos: true });
    const { construcao } = fatosCurtos(derivar(analise({ vinculo: confirmadoEm(e.id) }), e));
    expect(construcao).toMatchObject({ destaque: "Construído em 2010", apoio: "Até 4 pavimentos" });
  });

  it("sem prédio não há fato curto, e IPTU de isenção (faixa abaixo de R$ 1 por mês) não aparece", () => {
    expect(fatosCurtos(derivar(analise()))).toEqual({ construcao: null, iptu: null });
    const isento = edificio({ iptuAnual: { n: 24, p25: 0, mediana: 0, p75: 0 } });
    expect(fatosCurtos(derivar(analise({ vinculo: confirmadoEm(isento.id) }), isento)).iptu).toBeNull();
  });

  it("faixa de especificações só com o que se sabe; andar e endereço vão na linha do endereço", () => {
    const e = edificio();
    const visao = derivar(analise({ vinculo: confirmadoEm(e.id), declarados: { vagas: vazio, banheiros: v(2) } }), e);
    expect(especificacoesDaFaixa(visao.especificacoes).map((i) => i.texto)).toEqual(["98 m²", "3 qtos", "2 ban"]);
    expect(linhaDeEndereco(visao)).toBe("Rua Sintetica Alfa, 100 · 7º andar");
    const semNada = derivar(analise({ declarados: { area: vazio, quartos: vazio, banheiros: vazio, vagas: vazio, andar: vazio } }));
    expect(especificacoesDaFaixa(semNada.especificacoes)).toEqual([]);
    expect(linhaDeEndereco(semNada)).toBeNull();
  });
});

describe("custo", () => {
  it("a barra só tem parcelas conhecidas; 'a confirmar' e desconhecidas ficam fora", () => {
    const visao = derivar(analise({ declarados: { iptu: { ...v(288), periodo: "desconhecido", aConfirmar: true }, seguroIncendio: vazio } }));
    expect(segmentosDaBarra(visao.custo.parcelas)).toEqual([{ nome: "Aluguel", valor: 4500 }, { nome: "Condomínio", valor: 1190 }]);
  });

  it("rótulo do total: 'Total mensal' só quando nada ficou de fora", () => {
    const completo = derivar(analise());
    expect(rotuloDoTotal(completo.custo)).toBe("Total mensal");
    const incompleto = derivar(analise({ declarados: { seguroIncendio: vazio } }));
    expect(rotuloDoTotal(incompleto.custo)).toBe("Total mensal conhecido");
    const compra = derivar(analise({ modalidade: "compra", declarados: { seguroIncendio: vazio, preco: v(900000) } }));
    expect(rotuloDoTotal(compra.custo)).toBe("Total mensal");
    const compraComFalta = derivar(analise({ modalidade: "compra", declarados: { condominio: vazio, preco: v(900000) } }));
    expect(rotuloDoTotal(compraComFalta.custo)).toBe("Mensal conhecido");
  });

  it("a linha do R$/m² diz o que realmente falta: preço, área ou os dois", () => {
    const linha = (declarados: Mudancas["declarados"]) => {
      const visao = derivar(analise({ declarados }));
      return precoPorM2(visao.custo, visao.especificacoes.area);
    };
    expect(linha({ preco: v(4500), area: v(100) })).toBe("R$ 45/m²");
    expect(linha({ preco: v(4500), area: vazio })).toBe("Área a confirmar");
    expect(linha({ preco: v(4500), area: v(98, true) })).toBe("Área a confirmar");
    expect(linha({ preco: vazio, area: v(98) })).toBe("Preço a confirmar");
    expect(linha({ preco: v(4500, true), area: v(98) })).toBe("Preço a confirmar");
    expect(linha({ preco: vazio, area: vazio })).toBe("Preço e área a confirmar");
    // Sem a área informada, só o preço é checado: faltando o preço, diz "Preço a confirmar".
    expect(precoPorM2(derivar(analise({ declarados: { preco: vazio, area: vazio } })).custo)).toBe("Preço a confirmar");
    expect(precoPorM2(derivar(analise({ declarados: { preco: v(4500), area: vazio } })).custo)).toBe("Área a confirmar");
  });

  it("o corpo do número encolhe para caber na coluna e nunca passa do máximo", () => {
    expect(corpoQueCabe("R$ 4.500", 147, 24)).toBe(24);
    expect(corpoQueCabe("R$ 1.250.000", 147, 24)).toBe(20);
    expect(corpoQueCabe("R$ 1.250.000", 60, 24)).toBe(15);
  });
});

describe("posição", () => {
  const e = edificioUnico();
  const compra = analise({ modalidade: "compra", declarados: { preco: v(896000), area: v(100) }, vinculo: confirmadoEm(e.id) });

  it("delta com sinal, direção sem o número e posições do bullet na mesma escala", () => {
    const posicao = derivar(compra, e).posicao;
    expect(posicao).not.toBeNull();
    if (!posicao) return;
    const direcao = "acima da mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses)";
    expect(deltaDaPosicao(posicao)).toEqual({ metrica: "+12%", tom: "acima", direcao });
    const { valor, referencia } = posicoesDoBullet(posicao);
    expect(valor).toBeGreaterThan(referencia);
    expect(valor).toBeLessThan(100);
    expect(deltaDaPosicao({ ...posicao, deltaPercentual: -8, frase: "8% abaixo da mediana das avaliações fiscais" })).toMatchObject({ metrica: "−8%", tom: "abaixo" });
    const naMediana = "Na mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses)";
    expect(deltaDaPosicao({ ...posicao, deltaPercentual: 0, frase: naMediana })).toEqual({ metrica: "", tom: "na_mediana", direcao: naMediana });
  });

  it("o número leva a unidade da posição: R$ da compra sem /m², R$/m² do aluguel com /m²", () => {
    const posicao = derivar(compra, e).posicao;
    if (!posicao) throw new Error("sem posição");
    expect(posicao.unidade).toBe("R$");
    expect(valorDaPosicao(posicao, posicao.valor)).toBe("R$ 896.000");
    expect(valorDaPosicao(posicao, posicao.referencia.mediana, true)).toBe("R$ 800.000");
    const porM2 = { ...posicao, unidade: "R$/m²" as const };
    expect(valorDaPosicao(porM2, 45)).toBe("R$ 45/m²");
    expect(valorDaPosicao(porM2, 45, true)).toBe("R$ 45 por m²");
    expect(valorDaPosicao({ ...posicao, unidade: "R$/mês" }, 4500)).toBe("R$ 4.500/mês");
    expect(valorDaPosicao({ ...posicao, unidade: "R$/ano" }, 4500, true)).toBe("R$ 4.500 por ano");
  });

  it("a nota da posição fiscal diz a faixa por unidade e que não é preço de mercado; a de aluguel não tem nota", () => {
    const posicao = derivar(compra, e).posicao;
    if (!posicao) throw new Error("sem posição");
    expect(notaDaPosicao(posicao)).toBe(
      "Metade central das avaliações fiscais deste prédio: R$ 760.000–R$ 840.000 por unidade · 12 transmissões em 36 meses. É avaliação fiscal, não preço de mercado.",
    );
    expect(notaDaPosicao({ ...posicao, fonte: "suas_analises" })).toBeNull();
  });

  it("sem posição, o texto diz o motivo certo: preço, prédio, tamanhos diferentes ou poucas transmissões", () => {
    const sem = (a: AnaliseV2, predio: Edificio | null) => textoSemPosicao(derivar(a, predio), predio);
    const semPreco = analise({ modalidade: "compra", declarados: { preco: vazio }, vinculo: confirmadoEm(e.id) });
    expect(sem(semPreco, e)).toContain("preço anunciado está confirmado");
    expect(sem(analise({ modalidade: "compra" }), null)).toBe("Confirme o prédio para comparar o preço com as avaliações fiscais dele.");
    const diferentes = edificio();
    expect(sem(analise({ modalidade: "compra", vinculo: confirmadoEm(diferentes.id) }), diferentes)).toContain("apartamentos de tamanhos diferentes");
    const poucas = edificioUnico({ itbi: { transmissoes: 2, desde: 2024, ate: 2025, valorUnidade: null, porAno: [[2024, 1], [2025, 1]] } });
    expect(sem(analise({ modalidade: "compra", vinculo: confirmadoEm(poucas.id) }), poucas)).toContain("menos de 3 transmissões nos últimos 36 meses");
    const aluguelSemArea = analise({ declarados: { area: vazio } });
    expect(sem(aluguelSemArea, null)).toBe("O aluguel por m² aparece quando o aluguel e a área estão confirmados.");
    expect(sem(analise(), null)).toContain("3 ou mais análises suas de aluguel");
  });
});

describe("obras e contexto do bairro", () => {
  it("categoria em palavras, mês por extenso, distância e situação em caixa de frase", () => {
    expect(categoriaDaObra("construcao")).toBe("Construção nova");
    expect(categoriaDaObra("acrescimo")).toBe("Acréscimo de área");
    expect(categoriaDaObra("demolicao")).toBe("Demolição");
    expect(mesDaObra("2026-05")).toBe("maio de 2026");
    expect(situacaoDaObra("EM EXIGÊNCIA")).toBe("Em exigência");
    expect(situacaoDaObra(null)).toBe("Situação não informada");
    expect(distanciaDaObra(113)).toBe("a 113 m");
    expect(distanciaDaObra(2)).toBe("a menos de 5 m");
  });

  it("as linhas das obras recentes seguem a ordem do índice e carregam mês, distância e situação", () => {
    const e = edificio();
    const visao = derivar(analise({ vinculo: confirmadoEm(e.id) }), e);
    const linhas = linhasDeObras(visao.obras);
    expect(linhas.map((l) => l.titulo)).toEqual(["Construção nova", "Demolição", "Acréscimo de área"]);
    expect(linhas[0]).toMatchObject({ numero: 1, detalhe: "maio de 2026 · a 40 m · Em exigência" });
    expect(linhas[1]?.detalhe).toBe("novembro de 2025 · a 113 m · Situação não informada");
    expect(linhasDeObras(null)).toEqual([]);
  });

  it("resumo factual com e sem obras", () => {
    const e = edificio();
    const com = derivar(analise({ vinculo: confirmadoEm(e.id) }), e).obras;
    const sem = derivar(analise({ vinculo: confirmadoEm("99001-100") }), edificio({ obras150m: { licencasDeObra: 5, relevantes24m: 0, demolicoes24m: 0, recentes: [] } })).obras;
    expect(com && resumoDasObras(com)).toBe("Construção, acréscimo ou demolição a até 150 m nos últimos 24 meses · 1 demolição");
    expect(sem && resumoDasObras(sem)).toBe("Nenhuma licença de construção, acréscimo ou demolição a até 150 m nos últimos 24 meses.");
  });

  it("contexto do bairro vira linhas com a base de cada número; ITBI por m² não existe mais", () => {
    const linhas = linhasDoContexto({
      bairro: "casa-forte", edificios: 82, unidades: 2230, iptuAnualPorM2: { n: 2217, p25: 17.68, mediana: 24.24, p75: 29.54 },
    });
    expect(linhas.map((l) => [l.id, l.fonte])).toEqual([["edificios", "iptu_2026"], ["unidades", "iptu_2026"], ["iptu", "iptu_2026"]]);
    expect(linhas.find((l) => l.id === "iptu")?.valor).toBe("R$ 24,24/m²");
    expect(linhas.some((l) => /m²/.test(l.rotulo) && l.fonte === "itbi")).toBe(false);
    const semQuartis = linhasDoContexto({ bairro: "casa-forte", edificios: 1, unidades: 2, iptuAnualPorM2: null });
    expect(semQuartis.map((l) => l.id)).toEqual(["edificios", "unidades"]);
  });
});

describe("mapa do lote", () => {
  it("monta o lote, o pino e as obras numeradas dentro do quadro", () => {
    const e = edificio();
    const visao = derivar(analise({ vinculo: confirmadoEm(e.id) }), e);
    const cena = montarCenaDoLote(e, visao.obras?.recentes ?? [], [e], 320, 280);
    expect(cena.lote).toMatch(/^M .* Z$/);
    expect(cena.obras.map((o) => o.numero)).toEqual([1, 2, 3]);
    for (const o of cena.obras) {
      expect(o.x).toBeGreaterThanOrEqual(0);
      expect(o.x).toBeLessThanOrEqual(320);
      expect(o.y).toBeGreaterThanOrEqual(0);
      expect(o.y).toBeLessThanOrEqual(280);
    }
    expect(cena.pino[0]).toBeGreaterThan(0);
    expect(cena.regua.rotulo).toMatch(/^\d+ m$/);
    expect(cena.regua.pixels).toBeGreaterThan(0);
  });

  it("sem polígono não desenha lote, só o pino; sem obras, nenhum ponto", () => {
    const e = edificio({ poligono: null, obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] } });
    const cena = montarCenaDoLote(e, [], [], 320, 280);
    expect(cena.lote).toBeNull();
    expect(cena.obras).toEqual([]);
    expect(poligonoDoLote(e)).toBeNull();
  });

  it("vizinhos distantes ficam fora do quadro", () => {
    const e = edificio();
    const perto = edificio({ id: "99001-102", numero: "102", centro: [-34.8998, -8.0302], poligono: quadrado(-34.8998, -8.0302) });
    const longe = edificio({ id: "99001-900", numero: "900", centro: [-34.85, -8.0], poligono: quadrado(-34.85, -8.0) });
    const cena = montarCenaDoLote(e, [], [perto, longe], 320, 280);
    expect(cena.vizinhos).toHaveLength(1);
  });
});

describe("cadastro, valor e histórico", () => {
  it("sem prédio: o cartão diz o que fazer, conforme a cobertura e o vínculo", () => {
    const pendente = derivar(analise());
    expect(textosSemPredio(pendente, true, false)).toMatchObject({ titulo: "Confirme o prédio para ver o cadastro", podeConfirmar: true });
    const fora = derivar(analise({ bairro: "torre", bairroTexto: "Torre", vinculo: { estado: "fora_de_cobertura" } }));
    const t = textosSemPredio(fora, false, false);
    expect(t).toMatchObject({ titulo: "Fora da área com cadastro", podeConfirmar: false });
    expect(t.texto).toContain("Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena");
    const sumiu = derivar(analise({ vinculo: confirmadoEm("99001-100") }));
    expect(textosSemPredio(sumiu, true, true)).toMatchObject({ titulo: "Prédio confirmado não encontrado no índice atual", podeConfirmar: true });
  });

  it("resumo do valor: IPTU mensal no aluguel, avaliações fiscais por unidade na compra, 'A confirmar' sem dado", () => {
    const e = edificio();
    const aluguel = derivar(analise({ vinculo: confirmadoEm(e.id) }), e);
    expect(resumoDoValor(aluguel, e)).toMatchObject({ rotulo: "IPTU mensal no prédio", valor: "R$ 328–R$ 440/mês", fonte: "iptu_2026" });
    const compra = derivar(analise({ modalidade: "compra", declarados: { preco: v(900000) }, vinculo: confirmadoEm(e.id) }), e);
    expect(resumoDoValor(compra, e)).toEqual({
      rotulo: "Avaliações fiscais",
      valor: "R$ 760.000–R$ 840.000",
      apoio: "por unidade · 12 transmissões em 36 meses. É avaliação fiscal, não preço de mercado.",
      frase: "Avaliações fiscais: R$ 760.000–R$ 840.000 por unidade · 12 transmissões em 36 meses",
      fonte: "itbi",
      confianca: "oficial",
    });
    const poucos = edificio({ itbi: { transmissoes: 2, desde: 2024, ate: 2025, valorUnidade: null, porAno: [[2024, 1], [2025, 1]] } });
    const compraPoucos = derivar(analise({ modalidade: "compra", declarados: { preco: v(900000) }, vinculo: confirmadoEm(poucos.id) }), poucos);
    expect(resumoDoValor(compraPoucos, poucos)).toMatchObject({
      valor: "A confirmar", fonte: null, apoio: "Menos de 3 transmissões nos últimos 36 meses neste endereço.",
    });
    const semItbi = edificio({ itbi: null });
    const compraSemItbi = derivar(analise({ modalidade: "compra", declarados: { preco: v(900000) }, vinculo: confirmadoEm(semItbi.id) }), semItbi);
    expect(resumoDoValor(compraSemItbi, semItbi)).toMatchObject({ valor: "A confirmar", fonte: null, apoio: "Nenhuma transmissão registrada neste endereço." });
    const semIptu = edificio({ iptuAnual: null });
    expect(resumoDoValor(derivar(analise({ vinculo: confirmadoEm(semIptu.id) }), semIptu), semIptu)).toMatchObject({ valor: "A confirmar", fonte: null });
  });

  it("quartis iguais viram um valor só, e a avaliação nunca é por m²", () => {
    const igual = edificio({ itbi: { transmissoes: 6, desde: 2017, ate: 2026, valorUnidade: { n: 6, p25: 1400000, mediana: 1400000, p75: 1400000 }, porAno: [[2017, 6]] } });
    const compra = derivar(analise({ modalidade: "compra", declarados: { preco: v(900000) }, vinculo: confirmadoEm(igual.id) }), igual);
    const resumo = resumoDoValor(compra, igual);
    expect(resumo.valor).toBe("R$ 1.400.000");
    expect(resumo.frase).toBe("Avaliações fiscais: R$ 1.400.000 por unidade · 6 transmissões em 36 meses");
    expect(`${resumo.valor} ${resumo.apoio}`).not.toMatch(/\/m²|por m²/);
  });
});

describe("dados do anúncio", () => {
  it("valor nulo é 'Não informado', nunca zero; cada valor traz a origem; 'a confirmar' acompanha", () => {
    const a = analise({
      declarados: {
        condominio: vazio,
        iptu: { valor: 288, origem: "link", aConfirmar: true, periodo: "desconhecido" },
        seguroIncendio: { valor: 0, origem: "voce", aConfirmar: false },
      },
    });
    const linhas = linhasDeDeclarados(a);
    expect(linhas.find((l) => l.id === "condominio")).toMatchObject({ valor: "Não informado", origem: null });
    expect(linhas.find((l) => l.id === "iptu")).toMatchObject({ valor: "R$ 288, sem periodicidade", origem: "link", aConfirmar: true });
    expect(linhas.find((l) => l.id === "seguro")).toMatchObject({ valor: "R$ 0/mês", origem: "voce" });
    expect(linhas.find((l) => l.id === "preco")).toMatchObject({ rotulo: "Aluguel", valor: "R$ 4.500/mês", origem: "texto" });
    expect(linhas.some((l) => l.id === "suites")).toBe(false);
    expect(linhas.find((l) => l.id === "andar")?.valor).toBe("7º andar");
  });

  it("uma anomalia corrigida pela pessoa deixa de ser pendência; o link só vale se for http(s)", () => {
    const anomalia = { campo: "iptu" as const, tipo: "periodo_desconhecido" as const, valorLido: "R$ 288", mensagem: "x" };
    const pendente = analise({ declarados: { iptu: { ...v(288), periodo: "desconhecido" } } });
    expect(anomaliaResolvida(pendente, anomalia)).toBe(false);
    const corrigida = analise({ declarados: { iptu: { valor: 288, origem: "voce", aConfirmar: false, periodo: "mes" } } });
    expect(anomaliaResolvida(corrigida, anomalia)).toBe(true);
    expect(urlDoAnuncio(analise())).toBe("https://anuncio.invalid/sintetico-1");
    expect(urlDoAnuncio(analise({ url: "" }))).toBeNull();
    expect(urlDoAnuncio(analise({ url: "javascript:alert(1)" }))).toBeNull();
  });
});

// ——— Gaveta de fonte ————————————————————————————————————————————————————————————————

function textosDe(no: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string[] {
  const saida: string[] = [];
  const andar = (n: TestRenderer.ReactTestRendererJSON | string) => {
    if (typeof n === "string") {
      saida.push(n);
      return;
    }
    for (const filho of n.children ?? []) andar(filho);
  };
  for (const n of Array.isArray(no) ? no : no ? [no] : []) andar(n);
  return saida;
}

function renderizar(elemento: React.ReactElement): TestRenderer.ReactTestRenderer {
  let arvore!: TestRenderer.ReactTestRenderer;
  act(() => {
    arvore = TestRenderer.create(React.createElement(TemaDoApp, null, elemento));
  });
  return arvore;
}

describe("abas do dossiê: teclado (index.html dossierTabKey)", () => {
  const ids = ["destaques", "entorno", "edificio"] as const;

  it("setas dão a volta; Home e End vão às pontas; outra tecla não navega", () => {
    expect(abaPorTecla(ids, "destaques", "ArrowRight")).toBe("entorno");
    expect(abaPorTecla(ids, "entorno", "ArrowRight")).toBe("edificio");
    expect(abaPorTecla(ids, "edificio", "ArrowRight")).toBe("destaques");
    expect(abaPorTecla(ids, "destaques", "ArrowLeft")).toBe("edificio");
    expect(abaPorTecla(ids, "edificio", "ArrowLeft")).toBe("entorno");
    expect(abaPorTecla(ids, "entorno", "Home")).toBe("destaques");
    expect(abaPorTecla(ids, "entorno", "End")).toBe("edificio");
    for (const tecla of ["Tab", "Enter", " ", "ArrowUp", "ArrowDown", "a", ""]) expect(abaPorTecla(ids, "entorno", tecla)).toBeNull();
    expect(abaPorTecla([], "entorno" as string, "Home")).toBeNull();
  });

  it("role tablist e tab, aria-selected, ids de index.html e só a aba ativa na ordem de Tab", () => {
    const escolher = jest.fn();
    const arvore = renderizar(React.createElement(AbasDoDossie, { atual: "entorno", aoEscolher: escolher }));
    const lista = arvore.root.findAll((n) => (n.type as unknown) === "View" && n.props.role === "tablist");
    expect(lista).toHaveLength(1);
    expect(lista[0]?.props.accessibilityLabel).toBe("Explorar o dossiê");
    const abas = arvore.root.findAll((n) => n.type === Pressionavel && n.props.role === "tab");
    expect(abas.map((n) => n.props.accessibilityLabel)).toEqual(["Destaques", "Entorno", "Edifício"]);
    expect(abas.map((n) => n.props["aria-selected"])).toEqual([false, true, false]);
    expect(abas.map((n) => n.props.accessibilityState)).toEqual([{ selected: false }, { selected: true }, { selected: false }]);
    expect(abas.map((n) => n.props.nativeID)).toEqual(["ds-tab-destaques", "ds-tab-entorno", "ds-tab-edificio"]);
    expect(abas.map((n) => n.props.tabIndex)).toEqual([-1, 0, -1]);
    expect(abas.every((n) => n.props["aria-controls"] === "dossier-panel")).toBe(true);
  });

  it("a seta escolhe a aba, impede a rolagem da página e leva o foco do navegador para ela", () => {
    const focar = jest.fn();
    const pegarElemento = jest.fn(() => ({ focus: focar }));
    const original = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", { value: { getElementById: pegarElemento }, configurable: true, writable: true });
    const plataforma = jest.replaceProperty(Platform, "OS", "web");
    try {
      const escolher = jest.fn();
      const arvore = renderizar(React.createElement(AbasDoDossie, { atual: "destaques", aoEscolher: escolher }));
      const lista = arvore.root.findAll((n) => n.props.role === "tablist")[0];
      const preventDefault = jest.fn();
      act(() => {
        (lista?.props.onKeyDown as (e: unknown) => void)({ key: "ArrowRight", preventDefault });
      });
      expect(escolher).toHaveBeenCalledWith("entorno");
      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(pegarElemento).toHaveBeenCalledWith("ds-tab-entorno");
      expect(focar).toHaveBeenCalledTimes(1);
      // Evento nativo (sem `key` direto): a tecla vem em nativeEvent.
      act(() => {
        (lista?.props.onKeyDown as (e: unknown) => void)({ nativeEvent: { key: "End" }, preventDefault });
      });
      expect(escolher).toHaveBeenLastCalledWith("edificio");
      expect(pegarElemento).toHaveBeenLastCalledWith("ds-tab-edificio");
      // Tecla que não navega: nada acontece.
      escolher.mockClear();
      focar.mockClear();
      act(() => {
        (lista?.props.onKeyDown as (e: unknown) => void)({ key: "Tab", preventDefault });
      });
      expect(escolher).not.toHaveBeenCalled();
      expect(focar).not.toHaveBeenCalled();
      focarElemento("ds-tab-destaques");
      expect(focar).toHaveBeenCalledTimes(1);
    } finally {
      plataforma.restore();
      if (original) Object.defineProperty(globalThis, "document", original);
      else delete (globalThis as { document?: unknown }).document;
    }
  });
});

describe("gaveta do cadastro: fatos com e sem fonte", () => {
  it("fato com fonte vira botão que abre a fonte; 'A confirmar' (nao_sabemos) fica só como leitura", () => {
    const e = edificio({ anoConstrucao: null, padrao: null });
    const visao = derivar(analise({ vinculo: confirmadoEm(e.id) }), e);
    const abrir = jest.fn();
    const arvore = renderizar(React.createElement(GavetaDoCadastro, { visivel: true, aoFechar: () => undefined, visao, aoAbrirFonte: abrir }));
    const botaoDe = (inicio: string) => arvore.root.findAll((n) => typeof n.props.onPress === "function" && typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.startsWith(inicio))[0];
    const unidades = botaoDe("Unidades residenciais: 24.");
    expect(unidades?.props.accessibilityLabel).toMatch(/Ver fonte\.$/);
    act(() => {
      (unidades?.props.onPress as () => void)();
    });
    expect(abrir).toHaveBeenCalledWith({ fonte: "iptu_2026", confianca: "oficial", dado: { rotulo: "Unidades residenciais", valor: "24" } });
    expect(botaoDe("Ano de construção: A confirmar")).toBeUndefined();
    expect(botaoDe("Padrão: A confirmar")).toBeUndefined();
    const lidos = arvore.root.findAll((n) => typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.startsWith("Ano de construção: A confirmar"));
    expect(lidos.length).toBeGreaterThan(0);
    // Inferência também tem fonte: a área das unidades mais parecidas abre o IPTU 2026.
    expect(botaoDe("Área das unidades mais parecidas")?.props.accessibilityLabel).toMatch(/inferência ou sinal exploratório, IPTU 2026\. Ver fonte\.$/);
  });
});

describe("GavetaDeFonte", () => {
  it("mostra título, órgão, licença, datas, recorte, colunas e as quatro linhas de confiança com a atual destacada", () => {
    const arvore = renderizar(
      React.createElement(GavetaDeFonte, {
        visivel: true, aoFechar: () => undefined, fonte: "iptu_2026", confianca: "oficial", meta: META_SINTETICA,
        dado: { rotulo: "IPTU 2026 no prédio", valor: "R$ 328–R$ 371/mês" },
      }),
    );
    const t = textosDe(arvore.toJSON());
    expect(t).toContain("IPTU 2026 · Prefeitura do Recife · ODbL");
    expect(t).toContain("Prefeitura da Cidade do Recife · Secretaria de Finanças");
    expect(t).toContain("ODbL");
    expect(t).toContain("03/10/2026");
    expect(t).toContain("20/10/2026");
    expect(t).toContain("logradouro, numero");
    expect(t).toContain("R$ 328–R$ 371/mês");
    for (const c of ORDEM_DA_CONFIANCA) expect(t).toContain(rotuloDaConfianca(c));
    expect(t).toContain("Este dado");
    expect(t).toContain(EXPLICACAO_DA_CONFIANCA.oficial);
    expect(t).not.toContain(EXPLICACAO_DA_CONFIANCA.declarado);
    const destacadas = arvore.root.findAll((n) => typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.includes("é a confiança deste dado"));
    expect(destacadas.length).toBeGreaterThan(0);
  });

  it("fonte 'anuncio' e 'voce' mostram o texto pedido, sem órgão nem licença", () => {
    const anuncio = textosDe(
      renderizar(React.createElement(GavetaDeFonte, { visivel: true, aoFechar: () => undefined, fonte: "anuncio", confianca: "declarado", meta: META_SINTETICA })).toJSON(),
    );
    expect(anuncio).toContain("Informado no anúncio");
    expect(anuncio).not.toContain("ODbL");
    const voce = textosDe(
      renderizar(React.createElement(GavetaDeFonte, { visivel: true, aoFechar: () => undefined, fonte: "voce", confianca: "declarado", meta: META_SINTETICA })).toJSON(),
    );
    expect(voce).toContain("Informado por você");
    expect(voce).toContain("declarado por você");
  });

  it("base que não está no meta avisa em vez de inventar", () => {
    const t = textosDe(
      renderizar(React.createElement(GavetaDeFonte, { visivel: true, aoFechar: () => undefined, fonte: "itbi", confianca: "oficial", meta: META_SINTETICA })).toJSON(),
    );
    expect(t).toContain("Esta base não consta no registro de fontes do índice cadastral.");
  });

  it("fechada, não desenha nada", () => {
    expect(renderizar(React.createElement(GavetaDeFonte, { visivel: false, aoFechar: () => undefined, fonte: "iptu_2026", confianca: "oficial" })).toJSON()).toBeNull();
  });
});

// ——— A tela ————————————————————————————————————————————————————————————————————————

/** Um edifício real de Casa Forte com contorno, obras recentes e faixa de IPTU, escolhido por critério. */
function edificioRealDeCasaForte(): Edificio {
  const achado = indiceDoBairro("casa-forte").edificios.find(
    (e) => e.poligono && e.obras150m.recentes.length > 0 && e.anoConstrucao !== null && e.iptuAnual && e.iptuAnual.n >= 2 && Math.round(e.iptuAnual.p25 / 12) >= 1,
  );
  if (!achado) throw new Error("O índice de Casa Forte não tem um edifício com contorno, obras recentes e faixa de IPTU.");
  return achado;
}

type Contexto = { definirAtiva: jest.Mock; salvar: jest.Mock };

function prepararEstado(lista: AnaliseV2[], ativa: string | null, id?: string): Contexto {
  const contexto: Contexto = { definirAtiva: jest.fn(async () => undefined), salvar: jest.fn(async () => undefined) };
  G.__params = id ? { id } : {};
  G.__analises = {
    lista, ativa, analiseAtiva: lista.find((a) => a.id === ativa) ?? null, pronto: true, erro: "",
    definirAtiva: contexto.definirAtiva, salvar: contexto.salvar, remover: jest.fn(async () => undefined),
  };
  return contexto;
}

function abrirTela(): TestRenderer.ReactTestRenderer {
  // `require` aqui, depois dos mocks de módulo: a tela importa expo-router e o estado.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Tela = require("../src/app/(abas)/dossie").default as React.ComponentType;
  return renderizar(React.createElement(Tela));
}

const todosOsTextos = (arvore: TestRenderer.ReactTestRenderer) => textosDe(arvore.toJSON());

function botao(arvore: TestRenderer.ReactTestRenderer, rotulo: string | RegExp): ReactTestInstance {
  const confere = (texto: unknown) => typeof texto === "string" && (typeof rotulo === "string" ? texto === rotulo : rotulo.test(texto));
  // `Pressionavel` leva o rótulo em `accessibilityLabel`; `Botao` sem rótulo acessível leva o texto em `rotulo`.
  const achados = arvore.root.findAll(
    (n) => typeof n.props.onPress === "function" && (confere(n.props.accessibilityLabel) || confere(n.props.rotulo)),
  );
  const primeiro = achados[0];
  if (!primeiro) throw new Error(`Nenhum botão com o rótulo ${String(rotulo)}`);
  return primeiro;
}

function tocar(arvore: TestRenderer.ReactTestRenderer, rotulo: string | RegExp) {
  const no = botao(arvore, rotulo);
  act(() => {
    (no.props.onPress as () => void)();
  });
}

/** O texto de um nó da árvore de teste: os filhos de texto, juntos. */
function textoDoNo(no: ReactTestInstance | string): string {
  return typeof no === "string" ? no : no.children.map(textoDoNo).join("");
}

/** Os estilos de cada `Text` de verdade (host) cujo texto é exatamente `texto`, já achatados. */
function estilosDoTexto(raiz: ReactTestInstance, texto: string) {
  return raiz
    .findAll((n) => (n.type as unknown) === "Text" && textoDoNo(n) === texto)
    .map((n) => StyleSheet.flatten(n.props.style as object) as { fontFamily?: string; fontWeight?: string });
}

/** Edifício real de Casa Forte (com contorno) que atende ao critério, escolhido por critério e nunca por id fixo. */
function edificioRealDeCasaForteCom(descricao: string, criterio: (e: Edificio) => boolean): Edificio {
  const achado = indiceDoBairro("casa-forte").edificios.find((e) => e.poligono && criterio(e));
  if (!achado) throw new Error(`O índice de Casa Forte não tem um edifício ${descricao}.`);
  return achado;
}

const PALAVRAS_PROIBIDAS = [/perigos/i, /vale a pena/i, /\bcaro\b/i, /\bcara\b/i, /barat/i, /caixão/i, /ótim/i, /\bruim\b/i, /arriscad/i];
/** "seguro" só vale em "seguro incêndio" e "seguro fiança". */
function seguroForaDoLugar(texto: string): boolean {
  return /seguro/i.test(texto.replace(/seguro incêndio/gi, "").replace(/seguro fiança/gi, ""));
}

describe("tela do dossiê", () => {
  beforeEach(() => {
    G.__router = { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false), setParams: jest.fn() };
    G.__descarte = undefined;
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sem nenhuma análise mostra o estado vazio e leva a Explorar", () => {
    prepararEstado([], null);
    const arvore = abrirTela();
    expect(todosOsTextos(arvore)).toContain("Nenhum dossiê aberto. Cole um link em Explorar.");
    tocar(arvore, "Ir para Explorar");
    expect(G.__router.push).toHaveBeenCalledWith("/");
  });

  it("sem id usa a análise ativa; com id abre essa análise e a torna ativa", () => {
    const a = analise({ id: "primeira", nome: "Primeira análise" });
    const b = analise({ id: "segunda", nome: "Segunda análise" });
    const semId = prepararEstado([a, b], "primeira");
    expect(todosOsTextos(abrirTela())).toContain("Primeira análise");
    expect(semId.definirAtiva).not.toHaveBeenCalled();

    const comId = prepararEstado([a, b], "primeira", "segunda");
    const t = todosOsTextos(abrirTela());
    expect(t).toContain("Segunda análise");
    expect(comId.definirAtiva).toHaveBeenCalledWith("segunda");
  });

  it("com a análise do parâmetro já ativa, o parâmetro sai da rota; enquanto não é a ativa, fica", () => {
    const a = analise({ id: "primeira" });
    const b = analise({ id: "segunda" });
    prepararEstado([a, b], "primeira", "segunda");
    abrirTela();
    expect(G.__router.setParams).not.toHaveBeenCalled();
    prepararEstado([a, b], "segunda", "segunda");
    abrirTela();
    expect(G.__router.setParams).toHaveBeenCalledWith({ id: undefined });
  });

  it("id que não existe cai no estado vazio", () => {
    prepararEstado([analise({ id: "primeira" })], "primeira", "nao-existe");
    expect(todosOsTextos(abrirTela())).toContain("Nenhum dossiê aberto. Cole um link em Explorar.");
  });

  describe("com prédio confirmado (edifício real de Casa Forte)", () => {
    const e = edificioRealDeCasaForte();
    const a = analise({ id: "confirmada", nome: "Apartamento de teste", vinculo: confirmadoEm(e.id) });
    const visao = derivarDossie(a, e, indiceDoBairro("casa-forte").contexto, indiceDoBairro("casa-forte").obras, [], AGORA, "custo");

    it("mostra o topo, o título, o lote confirmado, os fatos curtos e os links", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      const t = todosOsTextos(arvore);
      expect(t).toContain("Apartamento de teste");
      expect(t).toContain("Casa Forte · Recife");
      expect(t).toContain("Lote confirmado ✓");
      expect(t).toContain("Abrir mapa");
      expect(t).toContain(`Construído em ${e.anoConstrucao}`);
      const faixa = visao.cadastro.find((f) => f.id === "iptu-faixa");
      expect(faixa).toBeDefined();
      expect(t).toContain(faixa?.valor);
      expect(t).toContain("IPTU 2026 no prédio");
      expect(t).toContain("Dados do anúncio");
      expect(t).toContain("Cadastro oficial");
      expect(t).toContain("Preparar visita");
      expect(t).toContain("Comparar imóveis");
      expect(t).toContain("Descartar");
      expect(t).not.toContain("Confirmar prédio");
    });

    it("o custo vem de custoMensal: principal, total conhecido, além do aluguel e a nota do que ficou de fora", () => {
      const comPendencia = analise({ id: "confirmada", vinculo: confirmadoEm(e.id), declarados: { iptu: { ...v(288), periodo: "desconhecido" }, seguroIncendio: vazio } });
      prepararEstado([comPendencia], "confirmada");
      const t = todosOsTextos(abrirTela());
      expect(t).toContain("Aluguel anunciado");
      expect(t).toContain("Total mensal conhecido");
      expect(t).toContain("R$ 5.690");
      expect(t).toContain("+R$ 1.190 além do aluguel");
      expect(t).toContain("IPTU e Seguro incêndio fora da soma.");
      expect(t).toContain("IPTU: O anúncio informa R$ 288, sem periodicidade.");
      expect(t.filter((x) => x === "A confirmar").length).toBeGreaterThanOrEqual(2);
      expect(t).toContain("Ver composição e ajustar valores");
    });

    it("um toque no número de IPTU do cadastro abre a gaveta de fonte com as datas do meta.json", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      const faixa = visao.cadastro.find((f) => f.id === "iptu-faixa");
      tocar(arvore, new RegExp(`${faixa?.valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*Ver fonte`));
      const t = todosOsTextos(arvore);
      const iptu = META.fontes.find((f) => f.chave === "iptu_2026");
      expect(iptu).toBeDefined();
      expect(t).toContain("IPTU 2026 · Prefeitura do Recife · ODbL");
      expect(t).toContain(dataDaFonte(iptu?.modificadoEm ?? null));
      expect(t).toContain(dataDaFonte(iptu?.consultadoEm ?? null));
      expect(t).toContain("Colunas usadas");
      for (const c of ORDEM_DA_CONFIANCA) expect(t).toContain(rotuloDaConfianca(c));
    });

    it("Preparar visita torna a análise ativa e abre a Visita; Comparar leva ao Comparar", async () => {
      const estado = prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      await act(async () => {
        (botao(arvore, "Preparar visita").props.onPress as () => void)();
      });
      expect(estado.definirAtiva).toHaveBeenCalledWith("confirmada");
      expect(G.__router.push).toHaveBeenCalledWith("/visita");
      tocar(arvore, "Comparar imóveis");
      expect(G.__router.push).toHaveBeenCalledWith("/comparar");
    });

    it("Descartar abre a gaveta de descarte com a análise; ao descartar volta a Explorar", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      expect(G.__descarte?.visivel).toBe(false);
      tocar(arvore, "Descartar");
      expect(G.__descarte).toMatchObject({ analiseId: "confirmada", visivel: true });
      act(() => G.__descarte?.aoDescartar?.());
      expect(G.__router.replace).toHaveBeenCalledWith("/");
      act(() => G.__descarte?.aoFechar());
      expect(G.__descarte?.visivel).toBe(false);
    });

    it("o marcador de salvo grava a análise com salva invertida", async () => {
      const estado = prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      await act(async () => {
        (botao(arvore, "Remover dos salvos").props.onPress as () => void)();
      });
      expect(estado.salvar).toHaveBeenCalledWith(expect.objectContaining({ id: "confirmada", salva: false }));
    });

    it("Abrir mapa abre a gaveta com o lote e as obras numeradas", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      tocar(arvore, "Abrir mapa do lote e das obras próximas");
      const t = todosOsTextos(arvore);
      expect(t).toContain("Mapa do lote");
      expect(t).toContain("Lote do prédio");
      const obras = visao.obras?.recentes ?? [];
      expect(obras.length).toBeGreaterThan(0);
      for (const l of linhasDeObras(visao.obras)) expect(t).toContain(l.titulo);
    });

    it("a aba Entorno mostra as obras com categoria em palavras, mês, distância e situação, e o contexto do bairro", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      tocar(arvore, "Entorno");
      const t = todosOsTextos(arvore);
      expect(t).toContain("Obras próximas");
      const linhas = linhasDeObras(visao.obras);
      expect(linhas.length).toBeGreaterThan(0);
      for (const l of linhas) {
        expect(t).toContain(l.titulo);
        expect(t).toContain(l.detalhe);
      }
      expect(t).toContain("Casa Forte, em números");
      expect(t).toContain("Prédios no índice cadastral");
      expect(t).toContain("Abrir mapa");
    });

    it("a aba Edifício mostra as verificações, o filtro de prioridade, o cadastro em grade e o histórico", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      tocar(arvore, "Edifício");
      const t = todosOsTextos(arvore);
      expect(t).toContain("O que pesa mais para você?");
      for (const p of ["Custo", "Conforto", "Documentos"]) expect(t).toContain(p);
      expect(t).toContain("Estrutura e cadastro");
      expect(t).toContain("Valor e histórico");
      expect(t).toContain("Ano de construção");
      expect(t).toContain("Chave cadastral");
      expect(t).toContain("Ver todas as verificações");
      // As três primeiras perguntas são as da prioridade escolhida, com a de endereço sempre à frente.
      const antes = derivarDossie(a, e, null, [], [], AGORA, "custo").perguntas.slice(0, 3);
      for (const p of antes) expect(t).toContain(p.titulo);
    });

    it("mudar o filtro para Conforto reordena as verificações", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      tocar(arvore, "Edifício");
      tocar(arvore, "Conforto");
      const t = todosOsTextos(arvore);
      const conforto = derivarDossie(a, e, null, [], [], AGORA, "conforto").perguntas.slice(0, 3);
      for (const p of conforto) expect(t).toContain(p.titulo);
    });

    it("um dado do cadastro abre a gaveta de fonte; 'Abrir cadastro completo' abre a lista com as fontes", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      tocar(arvore, "Edifício");
      tocar(arvore, /^Ano de construção: .*Ver fonte\.$/);
      expect(todosOsTextos(arvore)).toContain("IPTU 2026 · Prefeitura do Recife · ODbL");
      act(() => {
        (arvore.root.findByProps({ accessibilityLabel: "Fechar" }).props.onPress as () => void)();
      });
      tocar(arvore, "Abrir cadastro completo");
      const t = todosOsTextos(arvore);
      expect(t).toContain("Cadastro oficial");
      expect(t).toContain("Prefeitura do Recife · Open Database License (ODbL)");
    });

    it("'Dados do anúncio' abre a gaveta com os valores, as origens e o link original", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      tocar(arvore, "Dados do anúncio");
      const t = todosOsTextos(arvore);
      expect(t).toContain("O que o anúncio informa e o que você corrigiu");
      expect(t).toContain("R$ 4.500/mês");
      expect(t).toContain("Origem: do anúncio");
      expect(t).toContain("Abrir o anúncio original");
    });

    describe("compra e avaliação fiscal (ITBI) por unidade", () => {
      const comPosicao = (x: Edificio) => tipologiaUnica(x) && x.itbi?.valorUnidade != null;
      const unico = edificioRealDeCasaForteCom("de tipologia única, com avaliações fiscais por unidade", comPosicao);
      const referencia = unico.itbi?.valorUnidade;
      if (!referencia) throw new Error("sem valorUnidade");
      const preco = Math.round(referencia.mediana * 1.12);
      const compra = analise({
        id: "compra", modalidade: "compra", vinculo: confirmadoEm(unico.id),
        declarados: { preco: v(preco), area: v(100), iptu: { ...v(3240), periodo: "ano" }, seguroIncendio: vazio },
      });

      it("o preço fica fora da soma e a posição é do preço anunciado contra as avaliações por unidade (R$, não R$/m²)", () => {
        prepararEstado([compra], "compra");
        const t = todosOsTextos(abrirTela());
        expect(t).toContain("Preço anunciado");
        expect(t).toContain(formatarReais(preco));
        expect(t).toContain(`${formatarReais(preco / 100)}/m²`);
        expect(t).toContain("12% acima da mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses)");
        expect(t).toContain("Preço de compra e financiamento não entram nesta soma.");
        // Condomínio 1.190 + IPTU 3.240 ÷ 12 = 270; o preço nunca entra.
        expect(t).toContain("R$ 1.460");
        expect(t.some((x) => /R\$ [\d.]+\/m².*acima da mediana/.test(x))).toBe(false);
      });

      it("a posição abre o Entorno: barra em R$, mediana fiscal, faixa por unidade e a fonte do ITBI", () => {
        prepararEstado([compra], "compra");
        const arvore = abrirTela();
        tocar(arvore, /Ver no Entorno/);
        const entorno = todosOsTextos(arvore);
        expect(entorno).toContain("Preço e avaliação fiscal");
        expect(entorno).toContain("+12%");
        expect(entorno).toContain("Mediana fiscal");
        expect(entorno).toContain(formatarReais(referencia.mediana));
        expect(entorno).not.toContain("Preço por m²");
        expect(entorno).toContain(`${formatarReais(preco)}`);
        expect(entorno).not.toContain(`${formatarReais(referencia.mediana)}/m²`);
        expect(entorno.some((x) => x.startsWith("Metade central das avaliações fiscais deste prédio:") && x.includes("não preço de mercado"))).toBe(true);
        const barra = arvore.root.findAll((n) => n.props.role === "img" && typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.startsWith("Preço anunciado"));
        expect(barra[0]?.props.accessibilityLabel).toBe(`Preço anunciado ${formatarReais(preco)}; mediana fiscal ${formatarReais(referencia.mediana)}`);
        tocar(arvore, /^Ver fonte: registro oficial · ITBI 2016 a 2026$/);
        expect(todosOsTextos(arvore)).toContain("ITBI 2016 a 2026 · Prefeitura do Recife · ODbL");
      });

      it("na aba Edifício, 'Valor e histórico' mostra a faixa por unidade, as transmissões em 36 meses e o histórico por ano", () => {
        prepararEstado([compra], "compra");
        const arvore = abrirTela();
        tocar(arvore, "Edifício");
        const t = todosOsTextos(arvore);
        const faixa = referencia.p25 === referencia.p75 ? formatarReais(referencia.p25) : `${formatarReais(referencia.p25)}–${formatarReais(referencia.p75)}`;
        const frase = `Avaliações fiscais: ${faixa} por unidade · ${referencia.n} transmissões em 36 meses`;
        expect(arvore.root.findAll((n) => n.props.accessibilityLabel === `${frase}. Ver fonte.`)).not.toHaveLength(0);
        expect(t).toContain("Avaliações fiscais");
        expect(t).toContain(faixa);
        expect(t.some((x) => x.startsWith("por unidade · ") && x.includes("em 36 meses"))).toBe(true);
        for (const [ano, n] of unico.itbi?.porAno ?? []) {
          expect(arvore.root.findAll((x) => x.props.accessibilityLabel === `${ano}: ${n} ${n === 1 ? "transmissão" : "transmissões"}`)).not.toHaveLength(0);
        }
        expect(t.join("\n")).not.toMatch(/Avaliação fiscal por m²|por m²/);
        // Toque na faixa: a gaveta de fonte do ITBI, com o dado.
        tocar(arvore, new RegExp(`^${frase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\. Ver fonte\\.$`));
        const gaveta = todosOsTextos(arvore);
        expect(gaveta).toContain("ITBI 2016 a 2026 · Prefeitura do Recife · ODbL");
        expect(gaveta).toContain(faixa);
      });

      it("em prédio de tipologias diferentes, a compra não tem posição nem percentual; o histórico continua", () => {
        const varias = edificioRealDeCasaForteCom("de tipologias diferentes, com avaliações por unidade", (x) => !tipologiaUnica(x) && x.itbi?.valorUnidade != null);
        const analiseDeVarias = analise({
          id: "varias", modalidade: "compra", vinculo: confirmadoEm(varias.id), declarados: { preco: v(1200000), area: v(100) },
        });
        prepararEstado([analiseDeVarias], "varias");
        const arvore = abrirTela();
        const inicio = todosOsTextos(arvore);
        expect(inicio.some((x) => x.includes("avaliações fiscais de unidades deste prédio"))).toBe(false);
        expect(arvore.root.findAll((n) => typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.endsWith("Ver no Entorno."))).toHaveLength(0);
        tocar(arvore, "Entorno");
        const entorno = todosOsTextos(arvore);
        expect(entorno).toContain("Preço e avaliação fiscal");
        expect(entorno.some((x) => x.includes("apartamentos de tamanhos diferentes"))).toBe(true);
        expect(entorno).not.toContain("Mediana fiscal");
        expect(entorno.some((x) => /^[+−]\d+%$/.test(x))).toBe(false);
        tocar(arvore, "Edifício");
        const edificioAba = todosOsTextos(arvore);
        expect(edificioAba).toContain("Avaliações fiscais");
        for (const [ano, n] of varias.itbi?.porAno ?? []) {
          expect(arvore.root.findAll((x) => x.props.accessibilityLabel === `${ano}: ${n} ${n === 1 ? "transmissão" : "transmissões"}`)).not.toHaveLength(0);
        }
      });

      it("a compra sem o preço diz o que falta no lugar da posição", () => {
        const semPreco = analise({ id: "sem-preco", modalidade: "compra", vinculo: confirmadoEm(unico.id), declarados: { preco: vazio, area: v(100) } });
        prepararEstado([semPreco], "sem-preco");
        const arvore = abrirTela();
        const inicio = todosOsTextos(arvore);
        expect(inicio).toContain("Preço a confirmar");
        tocar(arvore, "Entorno");
        expect(todosOsTextos(arvore).some((x) => x.includes("preço anunciado está confirmado"))).toBe(true);
      });
    });

    it("o cabeçalho e o mapa mostram o endereço do edifício por extenso: 'Estrada do Encanamento', nunca 'Est do Encanamento'", () => {
      const estrada = edificioRealDeCasaForteCom("em estrada (prefixo EST)", (x) => x.logradouro.startsWith("EST "));
      const a2 = analise({ id: "estrada", vinculo: confirmadoEm(estrada.id), logradouro: "Outra rua digitada", numero: "9" });
      prepararEstado([a2], "estrada");
      const arvore = abrirTela();
      const esperado = `${estrada.logradouro.replace(/^EST /, "Estrada ").split(" ").map((p, i) => (i > 0 && ["DO", "DA", "DE", "DOS", "DAS"].includes(p) ? p.toLowerCase() : p.charAt(0) + p.slice(1).toLowerCase())).join(" ")}, ${estrada.numero}`;
      const t = todosOsTextos(arvore);
      expect(t).toContain(`${esperado} · 7º andar`);
      expect(t.join("\n")).not.toMatch(/\bEst (do|da|de)\b/);
      expect(t.join("\n")).not.toContain("Outra rua digitada");
      tocar(arvore, "Abrir mapa do lote e das obras próximas");
      expect(todosOsTextos(arvore)).toContain(esperado);
    });

    it("números em destaque editorial (obras no Entorno) em Fraunces 500; preço e chave cadastral seguem em JetBrains Mono", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      // Preço em tabela: JetBrains Mono.
      expect(estilosDoTexto(arvore.root, "R$ 4.500")[0]).toMatchObject({ fontFamily: "JetBrainsMono" });
      tocar(arvore, "Entorno");
      const contagem = String(visao.obras?.relevantes24m);
      const linha = arvore.root.findAll(
        (n) => (n.type as unknown) === "View" && /^\d+obras? licenciadas? perto$/.test(textoDoNo(n)) && n.children.length === 2,
      )[0];
      expect(linha).toBeDefined();
      if (!linha) return;
      expect(textoDoNo(linha)).toBe(`${contagem}${visao.obras?.relevantes24m === 1 ? "obra licenciada perto" : "obras licenciadas perto"}`);
      expect(estilosDoTexto(linha, contagem)[0]).toMatchObject({ fontFamily: "Fraunces", fontWeight: "500" });
      tocar(arvore, "Edifício");
      const chave = formatarChaveCadastral(e.dsqfl);
      expect(chave).not.toBeNull();
      expect(estilosDoTexto(arvore.root, chave ?? "")[0]).toMatchObject({ fontFamily: "JetBrainsMono" });
    });

    it("'N a conferir' do 'Antes de decidir' está em Fraunces 500, na cor de ferrugem do texto", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      tocar(arvore, "Edifício");
      const total = String(visao.perguntas.length);
      const bloco = arvore.root.findAll((n) => n.props.accessibilityLabel === `${total} a conferir`)[0];
      expect(bloco).toBeDefined();
      if (!bloco) return;
      const numeros = estilosDoTexto(bloco, total);
      expect(numeros).toHaveLength(1);
      expect(numeros[0]).toMatchObject({ fontFamily: "Fraunces", fontWeight: "500" });
      expect(textoDoNo(bloco)).toBe(`${total}a conferir`);
    });

    it("tocar num fato da gaveta 'Cadastro oficial' abre a gaveta de fonte; fechar a fonte volta ao cadastro", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      tocar(arvore, "Cadastro oficial");
      expect(todosOsTextos(arvore)).toContain("Prefeitura do Recife · Open Database License (ODbL)");
      tocar(arvore, /^Ano de construção: .*Ver fonte\.$/);
      const aberta = todosOsTextos(arvore);
      expect(aberta).toContain("IPTU 2026 · Prefeitura do Recife · ODbL");
      expect(aberta).toContain("Ano de construção");
      expect(aberta).not.toContain("Prefeitura do Recife · Open Database License (ODbL)");
      act(() => {
        (arvore.root.findByProps({ accessibilityLabel: "Fechar" }).props.onPress as () => void)();
      });
      const voltou = todosOsTextos(arvore);
      expect(voltou).toContain("Prefeitura do Recife · Open Database License (ODbL)");
      expect(voltou).not.toContain("IPTU 2026 · Prefeitura do Recife · ODbL");
      // Fechar o cadastro fecha tudo.
      act(() => {
        (arvore.root.findByProps({ accessibilityLabel: "Fechar" }).props.onPress as () => void)();
      });
      expect(todosOsTextos(arvore)).not.toContain("Prefeitura do Recife · Open Database License (ODbL)");
    });

    it("o teclado troca de aba na tela e o painel é nomeado pela aba ativa", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      const tablist = () => arvore.root.findAll((n) => n.props.role === "tablist" && n.props.accessibilityLabel === "Explorar o dossiê")[0];
      const painel = () => arvore.root.findAll((n) => n.props.role === "tabpanel")[0];
      expect(painel()?.props.nativeID).toBe("dossier-panel");
      expect(painel()?.props["aria-labelledby"]).toBe("ds-tab-destaques");
      const tecla = (key: string) => {
        const preventDefault = jest.fn();
        act(() => {
          (tablist()?.props.onKeyDown as (e: unknown) => void)({ key, preventDefault });
        });
        return preventDefault;
      };
      expect(tecla("ArrowRight")).toHaveBeenCalled();
      expect(painel()?.props.accessibilityLabel).toBe("Entorno");
      expect(painel()?.props["aria-labelledby"]).toBe("ds-tab-entorno");
      expect(todosOsTextos(arvore)).toContain("Obras próximas");
      tecla("End");
      expect(painel()?.props.accessibilityLabel).toBe("Edifício");
      expect(tecla("ArrowRight")).toHaveBeenCalled();
      expect(painel()?.props.accessibilityLabel).toBe("Destaques");
      tecla("ArrowLeft");
      expect(painel()?.props.accessibilityLabel).toBe("Edifício");
      tecla("Home");
      expect(painel()?.props.accessibilityLabel).toBe("Destaques");
      // Outras teclas não trocam de aba e deixam o navegador agir (sem preventDefault).
      expect(tecla("Tab")).not.toHaveBeenCalled();
      expect(tecla("Enter")).not.toHaveBeenCalled();
      expect(painel()?.props.accessibilityLabel).toBe("Destaques");
    });

    it("em nenhuma aba nem gaveta há as palavras de julgamento da ordem", () => {
      prepararEstado([a], "confirmada");
      const arvore = abrirTela();
      const lidos: string[] = [...todosOsTextos(arvore)];
      for (const aba of ["Entorno", "Edifício", "Destaques"]) {
        tocar(arvore, aba);
        lidos.push(...todosOsTextos(arvore));
      }
      tocar(arvore, "Edifício");
      tocar(arvore, "Ver todas as verificações");
      lidos.push(...todosOsTextos(arvore));
      const todo = lidos.join("\n");
      for (const proibida of PALAVRAS_PROIBIDAS) expect(todo).not.toMatch(proibida);
      for (const linha of lidos) expect(seguroForaDoLugar(linha)).toBe(false);
    });
  });

  describe("sem prédio confirmado", () => {
    it("bairro coberto com vínculo pendente: dados do anúncio, o cartão de confirmar e o link no topo", () => {
      const pendente = analise({ id: "pendente", nome: "Sem prédio", vinculo: { estado: "pendente" } });
      prepararEstado([pendente], "pendente");
      const arvore = abrirTela();
      const t = todosOsTextos(arvore);
      expect(t).toContain("Confirme o prédio para ver o cadastro");
      expect(t).not.toContain("Lote confirmado ✓");
      expect(t).not.toContain("Abrir mapa");
      expect(t).not.toContain("Cadastro oficial");
      expect(t).toContain("Aluguel anunciado");
      tocar(arvore, "Confirmar prédio");
      expect(G.__router.push).toHaveBeenCalledWith({ pathname: "/predio", params: { id: "pendente" } });
    });

    it("fora da área com cadastro: sem link para confirmar e sem dado de cadastro", () => {
      const fora = analise({ id: "fora", nome: "Em Torre", bairro: "torre", bairroTexto: "Torre", vinculo: { estado: "fora_de_cobertura" } });
      prepararEstado([fora], "fora");
      const arvore = abrirTela();
      const t = todosOsTextos(arvore);
      expect(t).toContain("Fora da área com cadastro");
      expect(t).toContain("Torre · Recife");
      expect(arvore.root.findAll((n) => n.props.accessibilityLabel === "Confirmar prédio")).toHaveLength(0);
      tocar(arvore, "Entorno");
      expect(todosOsTextos(arvore)).toContain("Fora da área com cadastro");
    });

    it("valor desconhecido nunca vira zero: aparece 'A confirmar' e nenhuma medida zerada", () => {
      const a = analise({
        id: "desconhecida",
        declarados: {
          preco: vazio, condominio: vazio, iptu: { ...vazio, periodo: "desconhecido" }, seguroIncendio: vazio,
          area: vazio, quartos: vazio, banheiros: vazio, vagas: vazio, andar: vazio,
        },
      });
      prepararEstado([a], "desconhecida");
      const arvore = abrirTela();
      const lidos: string[] = [...todosOsTextos(arvore)];
      for (const aba of ["Entorno", "Edifício"]) {
        tocar(arvore, aba);
        lidos.push(...todosOsTextos(arvore));
      }
      const todo = lidos.join("\n");
      expect(lidos).toContain("A confirmar");
      expect(todo).not.toMatch(/R\$ 0(?![\d.,])/);
      expect(todo).not.toMatch(/(^|\s)0 (m²|qtos|ban|vg)/);
      expect(todo).toContain("Preço e área a confirmar");
    });

    it("a linha do R$/m² diz só o que falta: área, quando o preço está lá", () => {
      const a = analise({ id: "sem-area", declarados: { area: vazio } });
      prepararEstado([a], "sem-area");
      const t = todosOsTextos(abrirTela());
      expect(t).toContain("Área a confirmar");
      expect(t).not.toContain("Preço a confirmar");
      expect(t).not.toContain("Preço e área a confirmar");
      const b = analise({ id: "sem-preco", declarados: { preco: vazio } });
      prepararEstado([b], "sem-preco");
      const u = todosOsTextos(abrirTela());
      expect(u).toContain("Preço a confirmar");
      expect(u).not.toContain("Área a confirmar");
    });

    it("a medida do achado, principal e de apoio, está em Fraunces 500 (`.ds-finding-measure`), não em JetBrains Mono", () => {
      const a = analise({
        id: "medidas",
        declarados: { iptu: { ...v(288), periodo: "desconhecido", aConfirmar: true }, condominio: v(150) },
        extracao: {
          url: "https://anuncio.invalid/sintetico-1", portal: "outro", idNoPortal: null, coletadoEm: INSTANTE, metodos: ["texto"],
          campos: camposVazios(), origemDosCampos: {}, lacunas: [], cobertura: "coberto",
          anomalias: [
            { campo: "iptu", tipo: "periodo_desconhecido", valorLido: "R$ 288", mensagem: "O anúncio informa R$ 288 de IPTU, sem periodicidade." },
            { campo: "condominio", tipo: "valor_atipico", valorLido: "R$ 150", mensagem: "Condomínio abaixo do comum." },
          ],
        },
      });
      prepararEstado([a], "medidas");
      const arvore = abrirTela();
      const visao = derivar(a);
      expect(visao.achados.principal?.medida).toEqual({ numero: "R$ 288", unidade: "sem periodicidade" });
      expect(visao.achados.apoio[0]?.medida).toEqual({ numero: "R$ 150", unidade: "no anúncio" });
      // Só o painel da aba: o bloco de custo, acima dele, escreve os mesmos valores em tabela, em outra fonte.
      const painel = arvore.root.findAll((n) => (n.type as unknown) === "View" && n.props.role === "tabpanel")[0];
      if (!painel) throw new Error("sem painel");
      for (const numero of ["R$ 288", "R$ 150"]) {
        const estilos = estilosDoTexto(painel, numero);
        expect(estilos.length).toBeGreaterThan(0);
        for (const estilo of estilos) expect(estilo).toMatchObject({ fontFamily: "Fraunces", fontWeight: "500" });
      }
    });

    it("com anomalia de custo, o achado vem do anúncio e 'Ver composição' leva a /editar", () => {
      const a = analise({
        id: "anomalia", declarados: { iptu: { ...v(288), periodo: "desconhecido", aConfirmar: true } },
        extracao: {
          url: "https://anuncio.invalid/sintetico-1", portal: "outro", idNoPortal: null, coletadoEm: INSTANTE, metodos: ["texto"],
          campos: camposVazios(), origemDosCampos: {}, lacunas: [], cobertura: "coberto",
          anomalias: [{ campo: "iptu", tipo: "periodo_desconhecido", valorLido: "R$ 288", mensagem: "O anúncio informa R$ 288 de IPTU, sem periodicidade." }],
        },
      });
      prepararEstado([a], "anomalia");
      const arvore = abrirTela();
      const t = todosOsTextos(arvore);
      expect(t).toContain("O que o Vereda encontrou");
      expect(t).toContain("IPTU sem periodicidade");
      tocar(arvore, "Ver composição");
      expect(G.__router.push).toHaveBeenCalledWith({ pathname: "/editar", params: { id: "anomalia" } });
      tocar(arvore, /^Ver fonte: declarado pelo anunciante · anúncio$/);
      expect(todosOsTextos(arvore)).toContain("Informado no anúncio");
    });
  });

  it("o cadastro: id desconhecido não falha e bairro fora da cobertura vem vazio", () => {
    const desconhecido = analise({ vinculo: confirmadoEm("id-que-nao-existe") });
    expect(carregarCadastro(desconhecido)).toMatchObject({ edificio: null, falhou: false });
    expect(carregarCadastro(desconhecido).contexto?.bairro).toBe("casa-forte");
    const fora = analise({ bairro: "torre", bairroTexto: "Torre", vinculo: { estado: "fora_de_cobertura" } });
    expect(carregarCadastro(fora)).toEqual({ edificio: null, contexto: null, obras: [], vizinhos: [], falhou: false });
  });

  it("índice ilegível vira 'falhou' em vez de derrubar a tela", () => {
    jest.isolateModules(() => {
      jest.doMock("../src/dados/recife/indice", () => ({
        indiceDoBairro: () => {
          throw new Error("Índice cadastral inválido");
        },
        edificioPorId: () => null,
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { carregarCadastro: carregar } = require("../src/componentes/dossie-v1/cadastro") as typeof import("../src/componentes/dossie-v1/cadastro");
      expect(carregar(analise())).toEqual({ edificio: null, contexto: null, obras: [], vizinhos: [], falhou: true });
    });
    jest.dontMock("../src/dados/recife/indice");
  });
});
