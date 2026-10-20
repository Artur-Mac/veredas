import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { readdirSync, readFileSync } from "fs";
import React from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import Explorar from "../src/app/(abas)/index";
import TelaDeLeitura from "../src/app/(abas)/ler";
import TelaEditar from "../src/app/editar";
import { Botao } from "../src/componentes/Botao";
import { FormularioDeRevisao } from "../src/componentes/revisao/FormularioDeRevisao";
import { TemaDoApp } from "../src/tema/Tema";
import { CORES_CLARO } from "../src/tema/tokens";
import {
  camposVazios,
  esquemaAnaliseV2,
  esquemaDeclarados,
  type AnaliseV2,
  type CamposExtraidos,
  type ExtracaoAnuncio,
  type LeituraParcial,
} from "../src/dados/contratos";
import { tituloDaAnomalia } from "../src/dados/anomalias";
import { custoMensal } from "../src/dados/custos";
import { extrairDaUrl } from "../src/dados/extrator/url";
import { extrairDoTexto } from "../src/dados/extrator/texto";
import { montarExtracao } from "../src/dados/extrator/montar";
import * as modeloDoFormulario from "../src/dados/formulario";
import {
  FORA_DO_RECIFE,
  anomaliasDaRevisao,
  anomaliasPendentes,
  bairroEscolhido,
  bairroParaSalvar,
  camposDaAnalise,
  coberturaDoFormulario,
  declaradosDoFormulario,
  destinoDaAnalise,
  editarFormulario,
  escolhaDeBairro,
  formularioDeAnalise,
  formularioDeExtracao,
  formularioVazio,
  leituraContradizAModalidade,
  nomeDoPortal,
  nomeSugerido,
  opcoesDeBairro,
  primeiraAnomaliaPendente,
  resumoDePrecoECustos,
  rotuloDoBairroEscolhido,
  rotuloDoBairroNoCartao,
  slugDoBairroPorTexto,
  tituloDeForaDeCobertura,
  tituloPadraoDoAnuncio,
  vinculoDoFormulario,
  type EstadoDoFormulario,
} from "../src/dados/formulario";
import { BAIRROS_COBERTOS, BAIRROS_DO_RECIFE } from "../src/dados/recife/bairros";
import { formatarEndereco } from "../src/dados/recife/endereco";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import fixturesTexto from "./fixtures/anuncios-texto.json";
import fixturesUrl from "./fixtures/anuncios-url.json";

// A tela de leitura (ler.tsx) roda aqui com a navegação, o caderno e a página do anúncio trocados por dublês.
const mockIr = jest.fn();
let mockParametros: { url?: string; texto?: string; id?: string } = {};
const mockSalvar = jest.fn(async (_analise: unknown) => undefined);
const mockRemover = jest.fn(async (_id: string) => undefined);
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockIr(...args), canGoBack: () => false, back: () => undefined, replace: () => undefined },
  useLocalSearchParams: () => mockParametros,
}));
const mockDefinirAtiva = jest.fn(async (_id: string | null) => undefined);
let mockLista: unknown[] = [];
jest.mock("../src/estado/Analises", () => ({
  useAnalises: () => ({ salvar: mockSalvar, remover: mockRemover, lista: mockLista, definirAtiva: mockDefinirAtiva, pronto: true }),
}));
jest.mock("expo-clipboard", () => ({ getStringAsync: async () => "" }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock("../src/componentes/leitor/LeitorDePagina", () => ({ LeitorDePagina: () => null }));
jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const AGORA = new Date("2026-10-20T12:00:00.000Z");

function extracaoDeCampos(campos: Partial<CamposExtraidos>, url = ""): ExtracaoAnuncio {
  const leitura: LeituraParcial = {
    metodo: "texto",
    portal: "outro",
    idNoPortal: null,
    campos: { ...camposVazios(), ...campos },
  };
  return montarExtracao(url, [leitura], AGORA);
}

function extracaoDoCaso(caso: { portal: string; url: string; entrada: string }): ExtracaoAnuncio {
  const leituras: LeituraParcial[] = [];
  if (caso.url) {
    const url = extrairDaUrl(caso.url);
    if (!("erro" in url)) leituras.push(url);
  }
  leituras.push(...extrairDoTexto(caso.entrada, caso.portal as never));
  return montarExtracao(caso.url, leituras, AGORA);
}

const CAMPOS_DE_CUSTO = [
  ["preco", "precoAConfirmar"],
  ["condominio", "condominioAConfirmar"],
  ["iptu", "iptuAConfirmar"],
  ["seguroIncendio", "seguroIncendioAConfirmar"],
  ["taxaServico", "taxaServicoAConfirmar"],
] as const;

describe("formulário de revisão a partir da extração", () => {
  it.each(fixturesTexto.casos)("todo campo de custo com anomalia nasce a confirmar: $id", (caso) => {
    const ext = extracaoDoCaso(caso);
    const form = formularioDeExtracao(ext);
    for (const [campo, marca] of CAMPOS_DE_CUSTO) {
      if (ext.anomalias.some((a) => a.campo === campo)) {
        expect([campo, form[marca]]).toEqual([campo, true]);
      }
    }
  });

  it("as fixtures exercitam de fato anomalias de custo (o teste acima não passa no vazio)", () => {
    const comAnomaliaDeCusto = fixturesTexto.casos.flatMap((caso) =>
      extracaoDoCaso(caso).anomalias.filter((a) => CAMPOS_DE_CUSTO.some(([campo]) => campo === a.campo)),
    );
    expect(comAnomaliaDeCusto.length).toBeGreaterThanOrEqual(5);
  });

  const SIMBOLICOS: [
    "preco" | "condominio" | "iptu" | "seguroIncendio" | "taxaServico",
    Partial<CamposExtraidos>,
    (typeof CAMPOS_DE_CUSTO)[number][1],
  ][] = [
    ["preco", { preco: 50 }, "precoAConfirmar"],
    ["condominio", { condominio: 5, preco: 4500 }, "condominioAConfirmar"],
    ["iptu", { iptu: { valor: 4, periodo: "mes" }, preco: 4500 }, "iptuAConfirmar"],
    ["seguroIncendio", { seguroIncendio: 6, preco: 4500 }, "seguroIncendioAConfirmar"],
    ["taxaServico", { taxaServico: 8, preco: 4500 }, "taxaServicoAConfirmar"],
  ];

  it.each(SIMBOLICOS)("valor simbólico em %s liga a confirmar e deixa o campo vazio", (campo, campos, marca) => {
    const ext = extracaoDeCampos(campos);
    expect(ext.anomalias.some((a) => a.campo === campo && a.tipo === "valor_simbolico")).toBe(true);
    const form = formularioDeExtracao(ext);
    expect(form[marca]).toBe(true);
    const valor = campo === "iptu" ? form.iptuValor : form[campo];
    expect(valor).toBeNull();
  });

  it("IPTU com período desconhecido nasce a confirmar, com ou sem anomalia registrada", () => {
    const ext = extracaoDeCampos({ preco: 4500, iptu: { valor: 288, periodo: "desconhecido" } });
    expect(ext.anomalias.some((a) => a.campo === "iptu" && a.tipo === "periodo_desconhecido")).toBe(true);
    expect(formularioDeExtracao(ext)).toMatchObject({ iptuValor: 288, iptuPeriodo: "desconhecido", iptuAConfirmar: true });

    const semAnomalia: ExtracaoAnuncio = { ...ext, anomalias: [] };
    expect(formularioDeExtracao(semAnomalia).iptuAConfirmar).toBe(true);
  });

  it("IPTU com período conhecido e sem anomalia não nasce a confirmar", () => {
    const ext = extracaoDeCampos({ preco: 4500, condominio: 1190, iptu: { valor: 3456, periodo: "ano" } });
    const form = formularioDeExtracao(ext);
    expect(form).toMatchObject({ iptuValor: 3456, iptuPeriodo: "ano", iptuAConfirmar: false, condominioAConfirmar: false });
  });

  it("o que não foi lido fica nulo, nunca zero", () => {
    const form = formularioDeExtracao(extracaoDeCampos({ preco: 4500 }));
    expect(form).toMatchObject({
      condominio: null,
      iptuValor: null,
      iptuPeriodo: "desconhecido",
      seguroIncendio: null,
      taxaServico: null,
      outros: null,
      area: null,
      quartos: null,
      suites: null,
      banheiros: null,
      vagas: null,
      andar: null,
    });
  });

  it("origem do valor: link, anúncio ou ninguém", () => {
    const ext = montarExtracao(
      "https://www.zapimoveis.com.br/imovel/aluguel-apartamento-3-quartos-com-garagem-boa-viagem-recife-pe-125m2-id-2799999910/",
      [
        { metodo: "url", portal: "zap", idNoPortal: "2799999910", campos: { ...camposVazios(), quartos: 3, area: 125 } },
        { metodo: "texto", portal: "zap", idNoPortal: null, campos: { ...camposVazios(), preco: 4500 } },
      ],
      AGORA,
    );
    const form = formularioDeExtracao(ext);
    expect(form).toMatchObject({ quartosOrigem: "link", areaOrigem: "link", precoOrigem: "texto", condominioOrigem: "voce" });
  });

  it("caso do cartão do Explorar: fixture do ZAP chega a R$ 5.690 com 2 a confirmar", () => {
    const caso = fixturesTexto.casos.find((c) => c.id === "zap-like-iptu-sem-periodo");
    if (!caso) throw new Error("fixture ausente");
    const ext = extracaoDoCaso(caso);
    const form = formularioDeExtracao(ext);
    const declarados = declaradosDoFormulario(form);
    expect(esquemaDeclarados.safeParse(declarados).success).toBe(true);
    const analise = analiseDe(form, ext);
    expect(esquemaAnaliseV2.safeParse(analise).success).toBe(true);
    const custo = custoMensal(analise);
    expect(custo.totalMensalConhecido).toBe(5690);
    expect(custo.pendentes).toBe(2);
    expect(primeiraAnomaliaPendente(analise)).toBe("IPTU sem periodicidade");
  });
});

describe("reler com o formulário anterior", () => {
  const ext = extracaoDeCampos({ preco: 4500, condominio: 1190, iptu: { valor: 288, periodo: "desconhecido" } });

  it("mantém o que a pessoa digitou e a marca de a confirmar que ela deixou", () => {
    const antes = formularioDeExtracao(ext);
    const editado = editarFormulario(antes, {
      condominio: 1200,
      condominioAConfirmar: false,
      iptuValor: 300,
      iptuPeriodo: "mes",
      iptuAConfirmar: false,
    });
    const depois = formularioDeExtracao(ext, editado);
    expect(depois).toMatchObject({
      condominio: 1200,
      condominioOrigem: "voce",
      condominioAConfirmar: false,
      iptuValor: 300,
      iptuPeriodo: "mes",
      iptuOrigem: "voce",
      iptuAConfirmar: false,
      preco: 4500,
    });
  });

  it("a confirmar ligado continua ligado ao reler", () => {
    const antes = { ...formularioDeExtracao(ext), precoAConfirmar: true, outrosAConfirmar: true };
    const depois = formularioDeExtracao(ext, antes);
    expect(depois.precoAConfirmar).toBe(true);
    expect(depois.outrosAConfirmar).toBe(true);
  });

  it("valor novo lido substitui o que veio da leitura anterior", () => {
    const antes = formularioDeExtracao(extracaoDeCampos({ preco: 4500 }));
    const depois = formularioDeExtracao(extracaoDeCampos({ preco: 4500, condominio: 1190 }), antes);
    expect(depois).toMatchObject({ condominio: 1190, condominioOrigem: "texto" });
  });

  it("o nome acompanha a sugestão enquanto a pessoa não o muda", () => {
    const primeira = formularioDeExtracao(extracaoDeCampos({ tipologia: "apartamento", preco: 4500 }));
    expect(primeira.nome).toBe("Apartamento");
    const segunda = formularioDeExtracao(
      extracaoDeCampos({ tipologia: "apartamento", quartos: 3, bairro: "casa-forte", bairroTexto: "Casa Forte", preco: 4500 }),
      primeira,
    );
    expect(segunda.nome).toBe("Apartamento 3 quartos · Casa Forte");
    const mudado = formularioDeExtracao(
      extracaoDeCampos({ tipologia: "apartamento", quartos: 2, bairro: "casa-forte", bairroTexto: "Casa Forte", preco: 4500 }),
      editarFormulario(segunda, { nome: "Meu favorito" }),
    );
    expect(mudado.nome).toBe("Meu favorito");
  });
});

describe("textos do formulário", () => {
  it("nome sugerido", () => {
    expect(nomeSugerido({ tipologia: "apartamento", quartos: 1, bairro: "casa-forte", bairroTexto: "Casa Forte" })).toBe(
      "Apartamento 1 quarto · Casa Forte",
    );
    expect(nomeSugerido({ tipologia: null, quartos: 0, bairro: null, bairroTexto: null })).toBe("Imóvel");
    expect(nomeSugerido({ tipologia: "outro", quartos: 2, bairro: null, bairroTexto: "piata-salvador" })).toBe(
      "Imóvel 2 quartos · Piata Salvador",
    );
  });

  it("nome dos portais como as marcas escrevem", () => {
    expect(["zap", "vivareal", "quintoandar", "olx"].map((p) => nomeDoPortal(p as never))).toEqual([
      "ZAP Imóveis",
      "VivaReal",
      "QuintoAndar",
      "OLX",
    ]);
    expect(tituloPadraoDoAnuncio("zap")).toBe("Anúncio do ZAP Imóveis");
    expect(tituloPadraoDoAnuncio("outro")).toBe("Anúncio de outro site");
  });

  it("o título da anomalia é o de src/dados/anomalias.ts; formulario.ts não tem versão própria", () => {
    expect("tituloDaAnomalia" in modeloDoFormulario).toBe(false);
    expect(tituloDaAnomalia({ campo: "condominio", tipo: "valor_atipico" })).toBe("Condomínio abaixo do comum");
  });

  it("a faixa do cartão usa o título do arquiteto (valor atípico = abaixo do comum)", () => {
    const ext = extracaoDeCampos({ preco: 4500, condominio: 100, area: 152, tipologia: "apartamento" });
    expect(ext.anomalias.some((a) => a.campo === "condominio" && a.tipo === "valor_atipico")).toBe(true);
    expect(primeiraAnomaliaPendente(analiseDe(formularioDeExtracao(ext), ext))).toBe("Condomínio abaixo do comum");
  });

  it("títulos de anomalia são factuais", () => {
    expect(tituloDaAnomalia({ campo: "iptu", tipo: "periodo_desconhecido" })).toBe(
      "IPTU sem periodicidade",
    );
    expect(tituloDaAnomalia({ campo: "condominio", tipo: "nao_informado" })).toBe(
      "Condomínio não informado",
    );
    expect(tituloDaAnomalia({ campo: "condominio", tipo: "valor_repetido" })).toBe(
      "Condomínio igual ao IPTU",
    );
  });
});

describe("valores declarados a partir do formulário", () => {
  const base = formularioDeExtracao(extracaoDeCampos({ preco: 4500 }));

  it("zero que ninguém digitou vira nulo; zero digitado fica", () => {
    const declarados = declaradosDoFormulario({
      ...base,
      condominio: 0,
      condominioOrigem: "texto",
      seguroIncendio: 0,
      seguroIncendioOrigem: "voce",
    });
    expect(declarados.condominio.valor).toBeNull();
    expect(declarados.seguroIncendio.valor).toBe(0);
  });

  it("área zero nunca passa", () => {
    expect(declaradosDoFormulario({ ...base, area: 0, areaOrigem: "voce" }).area.valor).toBeNull();
  });

  it("a anomalia some da faixa do cartão quando a pessoa resolve o campo", () => {
    const ext = extracaoDoCaso(fixturesTexto.casos.find((c) => c.id === "zap-like-iptu-sem-periodo")!);
    const form = formularioDeExtracao(ext);
    expect(primeiraAnomaliaPendente(analiseDe(form, ext))).toBe("IPTU sem periodicidade");
    const resolvido = { ...form, iptuPeriodo: "mes" as const, iptuAConfirmar: false, iptuOrigem: "voce" as const };
    expect(primeiraAnomaliaPendente(analiseDe(resolvido, ext))).toBeNull();
  });
});

function analiseDe(form: EstadoDoFormulario, extracao: ExtracaoAnuncio): AnaliseV2 {
  const agora = AGORA.toISOString();
  return {
    versao: 2,
    id: "teste",
    criadaEm: agora,
    atualizadaEm: agora,
    nome: form.nome || "Imóvel",
    modalidade: form.modalidade,
    tipologia: form.tipologia,
    url: "",
    bairroTexto: form.bairroTexto,
    bairro: extracao.campos.bairro,
    logradouro: form.logradouro || null,
    numero: form.numero || null,
    nomeEdificio: form.nomeEdificio || null,
    extracao,
    declarados: declaradosDoFormulario(form),
    vinculo: { estado: "pendente" },
    visita: {
      verificadas: [],
      respostas: {},
      perguntasProprias: [],
      notas: "",
      ruido: null,
      orientacaoGraus: null,
      segundos: 0,
      concluidaEm: null,
    },
    salva: true,
    descarte: null,
  };
}

describe("FormularioDeRevisao: campos acompanham a leitura", () => {
  const leitura = (metodo: "url" | "texto", campos: Partial<CamposExtraidos>): LeituraParcial => ({
    metodo,
    portal: "zap",
    idNoPortal: null,
    campos: { ...camposVazios(), ...campos },
  });

  it("mostra o valor novo quando a leitura da página ou do texto chega depois", () => {
    const extA = montarExtracao("", [leitura("url", { quartos: 3 })], AGORA);
    const extB = montarExtracao(
      "",
      [leitura("url", { quartos: 3 }), leitura("texto", { preco: 4500, condominio: 1190, area: 85.5 })],
      AGORA,
    );
    const formA = formularioDeExtracao(extA);
    const formB = formularioDeExtracao(extB, formA);
    const montar = (estado: EstadoDoFormulario) =>
      React.createElement(
        TemaDoApp,
        null,
        React.createElement(FormularioDeRevisao, { estado, anomalias: extB.anomalias, aoAlterar: () => undefined }),
      );

    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar(formA));
    });
    const campos = () =>
      Object.fromEntries(
        arvore.root
          .findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel !== undefined && n.props.value !== undefined)
          .map((n) => [n.props.accessibilityLabel as string, n.props.value as string]),
      );

    expect(campos()["Quartos"]).toBe("3");
    expect(campos()["Condomínio (R$ por mês)"]).toBe("");

    act(() => arvore.update(montar(formB)));
    expect(campos()).toMatchObject({
      "Aluguel (R$ por mês)": "4.500",
      "Condomínio (R$ por mês)": "1.190",
      "Área (m²)": "85,5",
      Quartos: "3",
    });
  });
});

// ——— K1: reler preserva tudo que a pessoa editou ——————————————————————————————————————————

const leituraDe = (
  metodo: "url" | "texto" | "json_ld",
  campos: Partial<CamposExtraidos>,
  portal: LeituraParcial["portal"] = "zap",
): LeituraParcial => ({ metodo, portal, idNoPortal: null, campos: { ...camposVazios(), ...campos } });

describe("reler preserva todo campo que a pessoa editou (K1)", () => {
  const DO_LINK = leituraDe("url", {
    modalidade: "aluguel",
    tipologia: "apartamento",
    bairro: "casa-forte",
    bairroTexto: "Casa Forte",
    cidade: "recife",
    quartos: 2,
    area: 60,
  });
  const DA_PAGINA = leituraDe("json_ld", {
    modalidade: "compra",
    tipologia: "cobertura",
    bairro: "boa-viagem",
    bairroTexto: "Boa Viagem",
    logradouro: "Rua da Leitura",
    numero: "999",
    nomeEdificio: "Edifício da Página",
    preco: 7000,
    condominio: 900,
    iptu: { valor: 3000, periodo: "ano" },
    quartos: 4,
    area: 95,
    vagas: 2,
  });
  const DO_TEXTO = leituraDe("texto", { preco: 7100, condominio: 950, area: 96, vagas: 3, suites: 1 });

  const LEITURAS_DEPOIS = [DO_LINK, DA_PAGINA, DO_TEXTO];

  /** Formulário como a pessoa o deixa: tudo o que dá para mexer, mexido. */
  function formularioEditado(): EstadoDoFormulario {
    const inicial = formularioDeExtracao(montarExtracao("", [DO_LINK], AGORA));
    return editarFormulario(inicial, {
      nome: "Meu favorito",
      modalidade: "compra",
      tipologia: "casa",
      bairro: "madalena",
      bairroTexto: "Madalena",
      logradouro: "Rua Que Eu Digitei",
      numero: "12",
      nomeEdificio: "Edifício Que Eu Digitei",
      preco: 650000,
      condominio: 800,
      iptuValor: 2400,
      iptuPeriodo: "ano",
      area: 70,
      quartos: 3,
    });
  }

  it("editarFormulario marca só o que foi mexido e passa a origem para você", () => {
    const base = formularioDeExtracao(montarExtracao("", [DO_LINK, DO_TEXTO], AGORA));
    expect(base.editados).toEqual({});
    const mexido = editarFormulario(base, { logradouro: "Rua A", preco: 5000, iptuPeriodo: "mes", condominioAConfirmar: true });
    // O IPTU é uma unidade: mexer no período marca também o valor.
    expect(mexido.editados).toEqual({
      logradouro: true,
      preco: true,
      iptuValor: true,
      iptuPeriodo: true,
      condominioAConfirmar: true,
    });
    expect(mexido).toMatchObject({ precoOrigem: "voce", iptuOrigem: "voce", condominioOrigem: base.condominioOrigem });
    // O formulário anterior não é mexido.
    expect(base.editados).toEqual({});
  });

  it("mexer no texto do bairro conta como mexer no bairro", () => {
    const base = formularioDeExtracao(montarExtracao("", [DO_LINK], AGORA));
    expect(editarFormulario(base, { bairroTexto: "Madalena" }).editados).toEqual({ bairro: true });
  });

  it("leitura da página que chega depois não toca em nenhum campo editado", () => {
    const editado = formularioEditado();
    const depois = formularioDeExtracao(montarExtracao("", [DO_LINK, DA_PAGINA], AGORA), editado);
    expect(depois).toMatchObject({
      nome: "Meu favorito",
      modalidade: "compra",
      tipologia: "casa",
      bairro: "madalena",
      bairroTexto: "Madalena",
      logradouro: "Rua Que Eu Digitei",
      numero: "12",
      nomeEdificio: "Edifício Que Eu Digitei",
      preco: 650000,
      precoOrigem: "voce",
      condominio: 800,
      iptuValor: 2400,
      iptuPeriodo: "ano",
      area: 70,
      areaOrigem: "voce",
      quartos: 3,
    });
  });

  it("'Ler texto' depois da página também preserva, e a leitura preenche só o que ninguém mexeu", () => {
    const editado = formularioEditado();
    const aposAPagina = formularioDeExtracao(montarExtracao("", [DO_LINK, DA_PAGINA], AGORA), editado);
    const aposOTexto = formularioDeExtracao(montarExtracao("", LEITURAS_DEPOIS, AGORA), aposAPagina);
    expect(aposOTexto).toMatchObject({
      nome: "Meu favorito",
      modalidade: "compra",
      tipologia: "casa",
      bairro: "madalena",
      logradouro: "Rua Que Eu Digitei",
      numero: "12",
      nomeEdificio: "Edifício Que Eu Digitei",
      preco: 650000,
      condominio: 800,
      iptuValor: 2400,
      area: 70,
      quartos: 3,
      // Não mexidos: seguem a leitura (a do texto vale mais que a da página).
      vagas: 3,
      vagasOrigem: "texto",
      suites: 1,
      suitesOrigem: "texto",
    });
    expect(aposOTexto.editados).toEqual(editado.editados);
  });

  it("campo apagado pela pessoa continua apagado, mesmo que a leitura traga valor", () => {
    const base = formularioDeExtracao(montarExtracao("", [DO_LINK, DA_PAGINA], AGORA));
    expect(base).toMatchObject({ logradouro: "Rua da Leitura", condominio: 900, area: 95 });
    const apagado = editarFormulario(base, { logradouro: "", condominio: null, area: null });
    const depois = formularioDeExtracao(montarExtracao("", LEITURAS_DEPOIS, AGORA), apagado);
    expect(depois).toMatchObject({ logradouro: "", condominio: null, area: null });
    expect(depois.preco).toBe(7100);
  });

  it("campo que ninguém mexeu segue a leitura nova, inclusive os de identificação", () => {
    const antes = formularioDeExtracao(montarExtracao("", [DO_LINK], AGORA));
    expect(antes).toMatchObject({ modalidade: "aluguel", tipologia: "apartamento", bairro: "casa-forte", logradouro: "" });
    const depois = formularioDeExtracao(montarExtracao("", LEITURAS_DEPOIS, AGORA), antes);
    // Identificação: vale a primeira leitura não nula (o link). Rua, número e edifício só a página trouxe.
    expect(depois).toMatchObject({
      modalidade: "aluguel",
      tipologia: "apartamento",
      bairro: "casa-forte",
      logradouro: "Rua da Leitura",
      numero: "999",
      nomeEdificio: "Edifício da Página",
      preco: 7100,
    });
  });

  it("a marca de 'a confirmar' que a pessoa desligou não volta a ligar sozinha, mas o valor segue a leitura", () => {
    const comAnomalia = leituraDe("texto", { preco: 4500, iptu: { valor: 288, periodo: "desconhecido" } });
    const antes = formularioDeExtracao(montarExtracao("", [comAnomalia], AGORA));
    expect(antes.iptuAConfirmar).toBe(true);
    const desligado = editarFormulario(antes, { iptuAConfirmar: false });
    const depois = formularioDeExtracao(
      montarExtracao("", [leituraDe("texto", { preco: 4500, iptu: { valor: 300, periodo: "desconhecido" } })], AGORA),
      desligado,
    );
    expect(depois).toMatchObject({ iptuAConfirmar: false, iptuValor: 300 });
  });

  it("o período do IPTU que a leitura traz nunca vale para um valor que a pessoa digitou", () => {
    const antes = formularioDeExtracao(montarExtracao("", [leituraDe("texto", { preco: 4500 })], AGORA));
    const digitado = editarFormulario(antes, { iptuValor: 288 });
    expect(digitado.iptuPeriodo).toBe("desconhecido");
    const depois = formularioDeExtracao(
      montarExtracao("", [leituraDe("json_ld", { preco: 4500, iptu: { valor: 3456, periodo: "ano" } })], AGORA),
      digitado,
    );
    expect(depois).toMatchObject({ iptuValor: 288, iptuPeriodo: "desconhecido", iptuOrigem: "voce", iptuAConfirmar: true });
  });

  it("nome apagado volta a seguir a sugestão", () => {
    const base = formularioDeExtracao(montarExtracao("", [DO_LINK], AGORA));
    const apagado = editarFormulario(base, { nome: "   " });
    const depois = formularioDeExtracao(montarExtracao("", LEITURAS_DEPOIS, AGORA), apagado);
    expect(depois.nome).toBe("Apartamento 4 quartos · Casa Forte");
  });

  it("o nome sugerido acompanha o bairro e os quartos que a pessoa escolheu", () => {
    const base = formularioDeExtracao(montarExtracao("", [DO_LINK], AGORA));
    const escolhido = editarFormulario(base, { bairro: "madalena", bairroTexto: "Madalena", quartos: 3 });
    const depois = formularioDeExtracao(montarExtracao("", [DO_LINK, DO_TEXTO], AGORA), escolhido);
    expect(depois.nome).toBe("Apartamento 3 quartos · Madalena");
  });
});

// ——— K2: bairro escolhido decide a cobertura ——————————————————————————————————————————————

function formularioDaUrl(id: string): EstadoDoFormulario {
  const caso = fixturesUrl.casos.find((c) => c.id === id);
  if (!caso) throw new Error(`fixture ausente: ${id}`);
  const lida = extrairDaUrl(caso.entrada);
  if ("erro" in lida) throw new Error("url inválida");
  return formularioDeExtracao(montarExtracao(caso.entrada, [lida], AGORA));
}

describe("seletor de bairro e cobertura (K2)", () => {
  it("as opções são 'Fora do Recife' e os 94 bairros de BAIRROS_DO_RECIFE, pelo nome de exibição", () => {
    const opcoes = opcoesDeBairro();
    expect(BAIRROS_DO_RECIFE).toHaveLength(94);
    expect(opcoes).toHaveLength(95);
    expect(opcoes[0]).toEqual({ valor: FORA_DO_RECIFE, rotulo: "Fora do Recife", coberto: false });
    const doRecife = opcoes.slice(1);
    expect(doRecife.map((o) => o.valor).sort()).toEqual(BAIRROS_DO_RECIFE.map((b) => b.slug).sort());
    expect(doRecife.find((o) => o.valor === "gracas")?.rotulo).toBe("Graças");
    expect(doRecife.filter((o) => o.coberto).map((o) => o.valor).sort()).toEqual([...BAIRROS_COBERTOS].sort());
    expect(BAIRROS_DO_RECIFE.some((b) => b.slug === FORA_DO_RECIFE)).toBe(false);
  });

  it("a busca ignora acento e caixa, e acha pelo nome ou pelo slug", () => {
    const rotulos = (q: string) => opcoesDeBairro(q).map((o) => o.rotulo);
    expect(rotulos("gracas")).toEqual(["Graças"]);
    expect(rotulos("GRAÇAS")).toEqual(["Graças"]);
    expect(rotulos("casa f")).toEqual(["Casa Forte"]);
    expect(rotulos("casa")).toEqual(expect.arrayContaining(["Casa Amarela", "Casa Forte"]));
    expect(rotulos("fora")).toEqual(["Fora do Recife"]);
    expect(rotulos("zzzz")).toEqual([]);
    expect(opcoesDeBairro("   ")).toHaveLength(95);
  });

  it("vem pré-selecionado pela extração: bairro do Recife, 'Fora do Recife' ou nada", () => {
    const casaForte = formularioDaUrl("zap-casa-forte-aluguel");
    expect(casaForte).toMatchObject({ bairro: "casa-forte", bairroTexto: "Casa Forte" });
    expect(coberturaDoFormulario(casaForte)).toBe("coberto");

    const torre = formularioDaUrl("vivareal-torre-venda");
    expect(torre).toMatchObject({ bairro: "torre", bairroTexto: "Torre" });
    expect(coberturaDoFormulario(torre)).toBe("recife_fora");

    const piata = formularioDaUrl("quintoandar-outra-cidade");
    expect(piata.bairro).toBe(FORA_DO_RECIFE);
    expect(rotuloDoBairroEscolhido(piata)).toBe("Fora do Recife");
    expect(coberturaDoFormulario(piata)).toBe("fora_do_recife");

    const desconhecido = formularioDaUrl("portal-desconhecido");
    expect(desconhecido.bairro).toBeNull();
    expect(rotuloDoBairroEscolhido(desconhecido)).toBeNull();
    expect(coberturaDoFormulario(desconhecido)).toBe("desconhecida");
  });

  it("o slug escolhido decide a cobertura, não o que a leitura achou", () => {
    const lido = formularioDaUrl("vivareal-torre-venda");
    expect(coberturaDoFormulario(lido)).toBe("recife_fora");
    expect(coberturaDoFormulario(editarFormulario(lido, { bairro: "casa-forte", bairroTexto: "Casa Forte" }))).toBe("coberto");
    expect(coberturaDoFormulario(editarFormulario(lido, { bairro: FORA_DO_RECIFE, bairroTexto: "" }))).toBe("fora_do_recife");
    const nenhum = formularioDaUrl("zap-casa-forte-aluguel");
    expect(coberturaDoFormulario({ ...nenhum, bairro: null })).toBe("desconhecida");
  });

  it("cobertura para cada tipo de escolha", () => {
    expect(coberturaDoFormulario({ bairro: "boa-viagem" })).toBe("coberto");
    expect(coberturaDoFormulario({ bairro: "gracas" })).toBe("coberto");
    expect(coberturaDoFormulario({ bairro: "boa-vista" })).toBe("recife_fora");
    expect(coberturaDoFormulario({ bairro: FORA_DO_RECIFE })).toBe("fora_do_recife");
    expect(coberturaDoFormulario({ bairro: null })).toBe("desconhecida");
    expect(coberturaDoFormulario({ bairro: "bairro-que-nao-existe" })).toBe("desconhecida");
  });

  it("formulário montado à mão, sem `bairro`, vale o bairro que o texto nomeia", () => {
    expect(coberturaDoFormulario({ bairroTexto: "Casa Forte" })).toBe("coberto");
    expect(coberturaDoFormulario({ bairroTexto: "graças" })).toBe("coberto");
    expect(coberturaDoFormulario({ bairroTexto: "Torre" })).toBe("recife_fora");
    expect(coberturaDoFormulario({ bairroTexto: "Piedade" })).toBe("desconhecida");
    expect(coberturaDoFormulario({ bairroTexto: "" })).toBe("desconhecida");
    expect(coberturaDoFormulario({})).toBe("desconhecida");
    expect(bairroEscolhido({ bairroTexto: "Boa Viagem" })).toBe("boa-viagem");
  });

  it("textos do cartão de fora de cobertura", () => {
    expect(tituloDeForaDeCobertura({ bairro: "torre" })).toBe("Ainda não cobrimos Torre.");
    expect(tituloDeForaDeCobertura({ bairro: "boa-vista" })).toBe("Ainda não cobrimos Boa Vista.");
    expect(tituloDeForaDeCobertura({ bairro: FORA_DO_RECIFE })).toBe("Ainda não cobrimos esta cidade.");
    expect(tituloDeForaDeCobertura({ bairro: "casa-forte" })).toBeNull();
    expect(tituloDeForaDeCobertura({ bairro: null })).toBeNull();
  });

  it("o que fica gravado na análise: slug e nome oficial, ou nulo", () => {
    expect(bairroParaSalvar({ bairro: "gracas", bairroTexto: "gracas" })).toEqual({ bairro: "gracas", bairroTexto: "Graças" });
    expect(bairroParaSalvar({ bairro: FORA_DO_RECIFE, bairroTexto: " Piata Salvador " })).toEqual({
      bairro: null,
      bairroTexto: "Piata Salvador",
    });
    expect(bairroParaSalvar({ bairro: null, bairroTexto: "" })).toEqual({ bairro: null, bairroTexto: "" });
  });

  describe("FormularioDeRevisao", () => {
    const montar = (estado: EstadoDoFormulario, aoAlterar: (novo: EstadoDoFormulario) => void) =>
      React.createElement(
        TemaDoApp,
        null,
        React.createElement(FormularioDeRevisao, { estado, anomalias: [], aoAlterar }),
      );
    /** Primeiro componente com esse rótulo de acessibilidade que reage a toque (o Pressable aparece em mais de uma camada). */
    const tocavel = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
      arvore.root.findAll(
        (n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onPress === "function",
      )[0];
    const gatilho = (arvore: TestRenderer.ReactTestRenderer) => tocavel(arvore, "Bairro");

    /** Rótulos das opções abertas, na ordem em que aparecem (cada uma é um botão com `selected` em seu estado). */
    const opcoesVisiveis = (arvore: TestRenderer.ReactTestRenderer) =>
      arvore.root
        .findAll(
          (n) =>
            typeof n.type !== "string" &&
            typeof n.props.onPress === "function" &&
            n.props.accessibilityState !== undefined &&
            "selected" in n.props.accessibilityState,
        )
        .map((n) => n.props.accessibilityLabel as string)
        .filter((rotulo, i, todos) => todos.indexOf(rotulo) === i);

    it("mostra o bairro que veio da extração e 'Nenhum escolhido' quando não há", () => {
      let arvore!: TestRenderer.ReactTestRenderer;
      act(() => {
        arvore = TestRenderer.create(montar(formularioDaUrl("zap-casa-forte-aluguel"), () => undefined));
      });
      expect(gatilho(arvore)?.props.accessibilityValue).toEqual({ text: "Casa Forte" });
      expect(JSON.stringify(arvore.toJSON())).toContain("Casa Forte");

      act(() => arvore.update(montar(formularioDaUrl("portal-desconhecido"), () => undefined)));
      expect(gatilho(arvore)?.props.accessibilityValue).toEqual({ text: "Nenhum escolhido" });
      expect(JSON.stringify(arvore.toJSON())).toContain("Escolha o bairro");
    });

    it("abre com busca; escolher um bairro grava o slug e o nome, e marca o campo como editado", () => {
      const recebidos: EstadoDoFormulario[] = [];
      let arvore!: TestRenderer.ReactTestRenderer;
      act(() => {
        arvore = TestRenderer.create(montar(formularioDaUrl("portal-desconhecido"), (novo) => recebidos.push(novo)));
      });
      expect(arvore.root.findAll((n) => n.props.accessibilityLabel === "Buscar bairro")).toHaveLength(0);
      act(() => gatilho(arvore)?.props.onPress());
      const busca = arvore.root.findAll((n) => n.props.accessibilityLabel === "Buscar bairro" && n.props.onChangeText)[0];
      expect(busca).toBeDefined();
      act(() => busca?.props.onChangeText("gracas"));
      expect(opcoesVisiveis(arvore)).toEqual(["Graças"]);
      act(() => tocavel(arvore, "Graças")?.props.onPress());
      expect(recebidos).toHaveLength(1);
      expect(recebidos[0]).toMatchObject({ bairro: "gracas", bairroTexto: "Graças" });
      expect(recebidos[0]?.editados).toMatchObject({ bairro: true });
      expect(coberturaDoFormulario(recebidos[0]!)).toBe("coberto");
      // Fecha depois de escolher.
      expect(arvore.root.findAll((n) => n.props.accessibilityLabel === "Buscar bairro")).toHaveLength(0);
    });

    it("'Fora do Recife' é a primeira opção", () => {
      const recebidos: EstadoDoFormulario[] = [];
      let arvore!: TestRenderer.ReactTestRenderer;
      act(() => {
        arvore = TestRenderer.create(montar(formularioDaUrl("zap-casa-forte-aluguel"), (novo) => recebidos.push(novo)));
      });
      act(() => gatilho(arvore)?.props.onPress());
      expect(opcoesVisiveis(arvore)[0]).toBe("Fora do Recife");
      expect(opcoesVisiveis(arvore)).toHaveLength(95);
      act(() => tocavel(arvore, "Fora do Recife")?.props.onPress());
      expect(recebidos[0]).toMatchObject({ bairro: FORA_DO_RECIFE, bairroTexto: "" });
      expect(coberturaDoFormulario(recebidos[0]!)).toBe("fora_do_recife");
    });
  });
});

// ——— K8: para onde o cartão do Explorar leva ————————————————————————————————————————————

describe("destino do cartão do Explorar (K8)", () => {
  const confirmado = {
    estado: "confirmado",
    edificioId: "60461-331",
    dsqfl: null,
    confirmadoEm: "2026-10-20T12:00:00.000Z",
    indiceGeradoEm: "2026-10-20",
  } as const;

  it("vínculo pendente em bairro coberto abre o prédio", () => {
    expect(destinoDaAnalise({ bairro: "casa-forte", vinculo: { estado: "pendente" } })).toBe("predio");
    expect(destinoDaAnalise({ bairro: "boa-viagem", vinculo: { estado: "pendente" } })).toBe("predio");
  });

  it("as demais abrem o dossiê", () => {
    expect(destinoDaAnalise({ bairro: "casa-forte", vinculo: confirmado })).toBe("dossie");
    expect(destinoDaAnalise({ bairro: "casa-forte", vinculo: { estado: "pulado", em: "2026-10-20T12:00:00.000Z" } })).toBe("dossie");
    expect(destinoDaAnalise({ bairro: "casa-forte", vinculo: { estado: "nao_encontrado", em: "2026-10-20T12:00:00.000Z" } })).toBe("dossie");
    expect(destinoDaAnalise({ bairro: "torre", vinculo: { estado: "pendente" } })).toBe("dossie");
    expect(destinoDaAnalise({ bairro: null, vinculo: { estado: "pendente" } })).toBe("dossie");
    expect(destinoDaAnalise({ bairro: "torre", vinculo: { estado: "fora_de_cobertura" } })).toBe("dossie");
  });
});

// ——— K4 e K5: botão principal e texto pequeno em laranja ———————————————————————————————————

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (claro + 0.05) / (escuro + 0.05);
}

describe("Botao principal igual a .btn-scanner-primary (K4)", () => {
  const renderizar = (props: Record<string, unknown>) => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(Botao, { rotulo: "Gerar Dossiê", onPress: jest.fn(), ...props })),
      );
    });
    return arvore;
  };

  /** Estilo do botão na árvore de renderização (o nó de host que leva o papel "button"). */
  const estiloDoBotao = (arvore: TestRenderer.ReactTestRenderer) => {
    const no = arvore.root.findAll((n) => typeof n.type === "string" && n.props.accessibilityRole === "button")[0];
    return StyleSheet.flatten(no?.props.style);
  };

  it("raio 12, padding 13,5 × 18, sombra laranja, fundo laranja, texto em tinta com peso 600", () => {
    const arvore = renderizar({ variante: "principal", seta: true });
    const estilo = estiloDoBotao(arvore);
    expect(estilo).toMatchObject({
      borderRadius: 12,
      paddingVertical: 13.5,
      paddingHorizontal: 18,
      backgroundColor: CORES_CLARO["cor-acao"],
      boxShadow: "0 4px 12px rgba(244, 119, 69, 0.32)",
      gap: 8,
    });
    const texto = arvore.root.findAllByType(Text).find((n) => n.props.children === "Gerar Dossiê");
    expect(StyleSheet.flatten(texto?.props.style)).toMatchObject({ color: CORES_CLARO["cor-sobre-acao"], fontWeight: "600", fontSize: 14 });
  });

  it("a seta vem depois do rótulo, e só quando pedida", () => {
    const com = JSON.stringify(renderizar({ variante: "principal", seta: true }).toJSON());
    const sem = JSON.stringify(renderizar({ variante: "principal" }).toJSON());
    expect(com.indexOf("Gerar Dossiê")).toBeGreaterThan(-1);
    expect(com.indexOf("RNSVGPath")).toBeGreaterThan(com.indexOf("Gerar Dossiê"));
    expect(sem).not.toContain("RNSVGPath");
  });

  it("a variante secundária continua como era", () => {
    const estilo = estiloDoBotao(renderizar({ variante: "secundario" }));
    expect(estilo).toMatchObject({ borderRadius: 16, backgroundColor: CORES_CLARO["cor-superficie"] });
    expect(estilo.boxShadow).toBeUndefined();
  });

  it("o texto em tinta passa de 4,5 sobre o laranja (branco não passaria)", () => {
    expect(contraste(CORES_CLARO["cor-sobre-acao"], CORES_CLARO["cor-acao"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(CORES_CLARO["cor-superficie"], CORES_CLARO["cor-acao"])).toBeLessThan(3);
  });
});

const TELAS_E_PECAS = [
  "src/app/(abas)/index.tsx",
  "src/app/(abas)/ler.tsx",
  "src/app/editar.tsx",
  ...readdirSync("src/componentes/revisao").map((arquivo) => `src/componentes/revisao/${arquivo}`),
];

describe("texto pequeno em laranja vira ferrugem nas telas de Explorar, Leitura e Edição (K5, R7)", () => {
  const FONTES = [...TELAS_E_PECAS, "src/componentes/leitor/LeitorDePagina.tsx"];
  const superficies = ["cor-superficie", "cor-papel-claro", "cor-creme", "cor-fundo"] as const;

  it("o token de ferrugem para texto passa de 4,5 sobre as superfícies das telas; o laranja não passa", () => {
    for (const superficie of superficies) {
      expect(contraste(CORES_CLARO["cor-barro-texto"], CORES_CLARO[superficie])).toBeGreaterThanOrEqual(4.5);
    }
    expect(contraste(CORES_CLARO["cor-acao"], CORES_CLARO["cor-superficie"])).toBeLessThan(4.5);
  });

  it.each(FONTES)("nenhum estilo de texto usa o laranja da marca: %s", (caminho) => {
    const fonte = readFileSync(caminho, "utf8");
    expect(fonte).not.toMatch(/\bcolor:\s*cor\("cor-acao"\)/);
  });

  it.each(TELAS_E_PECAS)("nenhuma cor solta (hex ou rgba) e nenhuma constante de marca: %s", (caminho) => {
    const fonte = readFileSync(caminho, "utf8");
    expect(fonte).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(fonte).not.toMatch(/\brgba?\(/);
    expect(fonte).not.toMatch(/\b(FERRUGEM|LARANJA|CADASTRAL|VERDE_LIDO|INK|MUTED|SECUNDARIO)\b/);
  });

  it("a ferrugem de texto pequeno vem do token cor-barro-texto, e a de preenchimento e traço, de cor-barro", () => {
    expect(readFileSync("src/app/(abas)/ler.tsx", "utf8")).toMatch(/sobretitulo:\s*\{\s*color:\s*cor\("cor-barro-texto"\)/);
    expect(readFileSync("src/app/(abas)/ler.tsx", "utf8")).toMatch(/erro:\s*\{\s*color:\s*cor\("cor-barro-texto"\)/);
    expect(readFileSync("src/app/(abas)/index.tsx", "utf8")).toMatch(/textoFerrugem:\s*\{[^}]*color:\s*cor\("cor-barro-texto"\)/);
    expect(readFileSync("src/app/(abas)/index.tsx", "utf8")).toMatch(/pontoFerrugem:\s*\{\s*backgroundColor:\s*cor\("cor-barro"\)/);
    expect(readFileSync("src/componentes/revisao/FormularioDeRevisao.tsx", "utf8")).toMatch(
      /textoAnomalia:\s*\{\s*color:\s*cor\("cor-barro-texto"\)/,
    );
    expect(readFileSync("src/app/editar.tsx", "utf8")).toMatch(/modalTitulo:\s*\{\s*color:\s*cor\("cor-barro-texto"\)/);
    expect(readFileSync("src/app/editar.tsx", "utf8")).toMatch(/btnExcluirModal:\s*\{[^}]*backgroundColor:\s*cor\("cor-barro"\)/);
  });

  const textoFlat = (arvore: TestRenderer.ReactTestRenderer, conteudo: string) =>
    StyleSheet.flatten(arvore.root.findAllByType(Text).find((t) => [t.props.children].flat(3).join("") === conteudo)?.props.style);

  it("em tela, a anomalia do campo usa a ferrugem de texto e o sobretítulo da leitura também", () => {
    const ext = extracaoDeCampos({ preco: 4500, condominio: 1 });
    const form = formularioDeExtracao(ext);
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(FormularioDeRevisao, { estado: form, anomalias: ext.anomalias, aoAlterar: () => undefined }),
        ),
      );
    });
    const mensagem = ext.anomalias.find((a) => a.campo === "condominio")?.mensagem ?? "";
    expect(mensagem).not.toBe("");
    expect(textoFlat(arvore, mensagem)).toMatchObject({ color: CORES_CLARO["cor-barro-texto"] });
  });
});

// ——— A tela de leitura: bairro escolhido decide a ação; reler não desfaz o que a pessoa fez ————————————

describe("tela de leitura (K1 e K2)", () => {
  const URL_CASA_FORTE =
    "https://www.zapimoveis.com.br/imovel/aluguel-apartamento-1-quarto-com-piscina-casa-forte-recife-pe-37m2-id-2790563018/";
  const URL_TORRE =
    "https://www.vivareal.com.br/imovel/apartamento-3-quartos-torre-bairros-recife-com-garagem-80m2-venda-RS648810-id-2913218130/";
  const URL_OUTRO_SITE = "https://imobiliaria-exemplo.com.br/imovel/apartamento-3-quartos";

  const sistema = Platform.OS;
  beforeEach(() => {
    mockIr.mockClear();
    mockSalvar.mockClear();
    // Na web, o cartão de colar texto sempre aparece e a página do anúncio nunca abre.
    (Platform as { OS: string }).OS = "web";
  });
  afterEach(() => {
    (Platform as { OS: string }).OS = sistema;
  });

  function abrir(parametros: { url?: string; texto?: string }) {
    mockParametros = parametros;
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(TelaDeLeitura)));
    });
    return arvore;
  }

  const textosDe = (no: TestRenderer.ReactTestInstance): string =>
    no
      .findAllByType(Text)
      .map((t) => [t.props.children].flat(3).filter((c) => typeof c === "string").join(""))
      .join(" ");
  const botao = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll(
      (n) => typeof n.type !== "string" && typeof n.props.onPress === "function" && n.findAllByType(Text).length === 1 && textosDe(n) === rotulo,
    )[0];
  const tela = (arvore: TestRenderer.ReactTestRenderer) => textosDe(arvore.root);
  /** `disabled` do botão como a tela o entrega ao Pressable (o `onPress` do componente não passa por ele). */
  const desativado = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityState !== undefined && textosDe(n) === rotulo)[0]?.props
      .accessibilityState.disabled;
  const campo = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onChangeText === "function")[0];
  const escolherBairro = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) => {
    act(() => arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === "Bairro" && n.props.onPress)[0]?.props.onPress());
    act(() =>
      arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onPress === "function")[0]?.props.onPress(),
    );
  };

  it("bairro coberto: 'Encontrar o prédio' ligado, sem cartão de fora de cobertura", () => {
    const arvore = abrir({ url: URL_CASA_FORTE });
    expect(desativado(arvore, "Encontrar o prédio")).toBe(false);
    expect(tela(arvore)).not.toContain("Ainda não cobrimos");
    expect(tela(arvore)).not.toContain("Escolha o bairro");
  });

  it("outro bairro do Recife: cartão 'Ainda não cobrimos Torre.' no lugar do botão principal", () => {
    const arvore = abrir({ url: URL_TORRE });
    expect(tela(arvore)).toContain("Ainda não cobrimos Torre.");
    expect(botao(arvore, "Encontrar o prédio")).toBeUndefined();
    expect(botao(arvore, "Salvar no caderno")).toBeDefined();
    expect(botao(arvore, "Colar outro link")).toBeDefined();
    // O formulário continua à mão para corrigir o bairro.
    expect(tela(arvore)).toContain("Revise antes de salvar");
  });

  it("nada escolhido: botão principal desativado e a dica 'Escolha o bairro'", async () => {
    const arvore = abrir({ url: URL_OUTRO_SITE });
    expect(desativado(arvore, "Encontrar o prédio")).toBe(true);
    // A dica é um texto à parte (o seletor também diz "Escolha o bairro", como espaço reservado).
    const dica = arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLiveRegion === "polite" && textosDe(n) === "Escolha o bairro");
    expect(dica.length).toBeGreaterThan(0);
    expect(tela(arvore)).not.toContain("Ainda não cobrimos");
    await act(async () => {
      botao(arvore, "Encontrar o prédio")?.props.onPress();
    });
    expect(mockSalvar).not.toHaveBeenCalled();
  });

  it("a escolha da pessoa troca a ação: coberto, outro bairro, fora do Recife", () => {
    const arvore = abrir({ url: URL_OUTRO_SITE });
    escolherBairro(arvore, "Casa Forte");
    expect(desativado(arvore, "Encontrar o prédio")).toBe(false);
    expect(tela(arvore)).not.toContain("Escolha o bairro");
    expect(arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLiveRegion === "polite")).toHaveLength(0);

    escolherBairro(arvore, "Boa Vista");
    expect(tela(arvore)).toContain("Ainda não cobrimos Boa Vista.");
    expect(botao(arvore, "Encontrar o prédio")).toBeUndefined();

    escolherBairro(arvore, "Fora do Recife");
    expect(tela(arvore)).toContain("Ainda não cobrimos esta cidade.");

    escolherBairro(arvore, "Graças");
    expect(tela(arvore)).not.toContain("Ainda não cobrimos");
    expect(desativado(arvore, "Encontrar o prédio")).toBe(false);
  });

  it("salvar grava o bairro escolhido e leva ao prédio com vínculo pendente", async () => {
    const arvore = abrir({ url: URL_OUTRO_SITE });
    escolherBairro(arvore, "Graças");
    await act(async () => botao(arvore, "Encontrar o prédio")?.props.onPress());
    expect(mockSalvar).toHaveBeenCalledTimes(1);
    expect(mockSalvar.mock.calls[0]?.[0]).toMatchObject({ bairro: "gracas", bairroTexto: "Graças", vinculo: { estado: "pendente" } });
    expect(mockIr).toHaveBeenCalledWith({ pathname: "/predio", params: { id: expect.stringMatching(/^imovel-/) } });
  });

  it("'Salvar no caderno' fora de cobertura grava vínculo fora_de_cobertura; fora do Recife não grava bairro", async () => {
    const arvore = abrir({ url: URL_TORRE });
    await act(async () => botao(arvore, "Salvar no caderno")?.props.onPress());
    expect(mockSalvar.mock.calls[0]?.[0]).toMatchObject({ bairro: "torre", bairroTexto: "Torre", vinculo: { estado: "fora_de_cobertura" } });

    mockSalvar.mockClear();
    escolherBairro(arvore, "Fora do Recife");
    await act(async () => botao(arvore, "Salvar no caderno")?.props.onPress());
    expect(mockSalvar.mock.calls[0]?.[0]).toMatchObject({ bairro: null, vinculo: { estado: "fora_de_cobertura" } });
  });

  it("'Ler texto' depois de a pessoa editar não desfaz nenhum campo editado", async () => {
    const arvore = abrir({ url: URL_CASA_FORTE });
    act(() => campo(arvore, "Rua")?.props.onChangeText("Rua Que Eu Digitei"));
    act(() => campo(arvore, "Número")?.props.onChangeText("12"));
    act(() => campo(arvore, "Edifício")?.props.onChangeText("Edifício Que Eu Digitei"));
    act(() =>
      arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityRole === "radio" && textosDe(n) === "Comprar" && n.props.onPress)[0]?.props.onPress(),
    );
    escolherBairro(arvore, "Madalena");

    act(() =>
      campo(arvore, "Texto do anúncio")?.props.onChangeText(
        "Apartamento para alugar\nAluguel R$ 4.500 /mês\nCondomínio R$ 1.190\nRua da Leitura, 999 - Boa Viagem, Recife\n85 m²\n3 quartos",
      ),
    );
    act(() => botao(arvore, "Ler texto")?.props.onPress());

    // O que veio da leitura entrou nos campos que ninguém mexeu...
    const valor = (rotulo: string) => campo(arvore, rotulo)?.props.value;
    expect(valor("Condomínio (R$ por mês)")).toBe("1.190");
    expect(valor("Área (m²)")).toBe("85");
    expect(valor("Quartos")).toBe("3");
    // ...e os campos editados ficaram como a pessoa os deixou.
    expect(valor("Rua")).toBe("Rua Que Eu Digitei");
    expect(valor("Número")).toBe("12");
    expect(valor("Edifício")).toBe("Edifício Que Eu Digitei");
    const gatilho = arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === "Bairro" && n.props.accessibilityValue)[0];
    expect(gatilho?.props.accessibilityValue).toEqual({ text: "Madalena" });
    const comprar = arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityRole === "radio" && textosDe(n) === "Comprar")[0];
    expect(comprar?.props.accessibilityState).toMatchObject({ checked: true });
    // A pessoa fixou "Comprar" e o texto traz um aluguel: o preço lido (R$ 4.500 por mês) não entra no preço de venda.
    expect(valor("Preço de venda (R$)")).toBe("");

    await act(async () => botao(arvore, "Encontrar o prédio")?.props.onPress());
    expect(mockSalvar.mock.calls[0]?.[0]).toMatchObject({
      modalidade: "compra",
      bairro: "madalena",
      logradouro: "Rua Que Eu Digitei",
      numero: "12",
      nomeEdificio: "Edifício Que Eu Digitei",
    });
  });
});

describe("Explorar: o que o cartão abre (K8)", () => {
  function analiseDoCartao(id: string, nome: string, bairro: string, vinculo: AnaliseV2["vinculo"]): AnaliseV2 {
    const ext = extracaoDeCampos({ preco: 4500, condominio: 1190 });
    return { ...analiseDe(formularioDeExtracao(ext), ext), id, nome, bairro, bairroTexto: bairro, vinculo };
  }

  function abrirExplorar(lista: AnaliseV2[]) {
    mockLista = lista;
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(Explorar)));
    });
    return arvore;
  }
  const tocarNoCartao = async (arvore: TestRenderer.ReactTestRenderer, nome: string) => {
    const cartao = arvore.root.findAll(
      (n) => typeof n.type !== "string" && typeof n.props.onPress === "function" && String(n.props.accessibilityLabel ?? "").startsWith(`${nome}.`),
    )[0];
    expect(cartao).toBeDefined();
    await act(async () => {
      cartao?.props.onPress();
    });
  };

  beforeEach(() => {
    mockIr.mockClear();
    mockDefinirAtiva.mockClear();
  });
  afterEach(() => {
    mockLista = [];
  });

  it("vínculo pendente em bairro coberto abre /predio?id= sem mexer na análise ativa", async () => {
    const arvore = abrirExplorar([analiseDoCartao("pendente-1", "Imóvel pendente", "casa-forte", { estado: "pendente" })]);
    await tocarNoCartao(arvore, "Imóvel pendente");
    expect(mockIr).toHaveBeenCalledTimes(1);
    expect(mockIr).toHaveBeenCalledWith({ pathname: "/predio", params: { id: "pendente-1" } });
    expect(mockDefinirAtiva).not.toHaveBeenCalled();
  });

  it("as demais abrem /dossie?id= e definem a análise ativa antes", async () => {
    const arvore = abrirExplorar([
      analiseDoCartao("fora-1", "Imóvel de fora", "torre", { estado: "fora_de_cobertura" }),
      analiseDoCartao("pulado-1", "Imóvel pulado", "casa-forte", { estado: "pulado", em: "2026-10-20T12:00:00.000Z" }),
      analiseDoCartao("pendente-fora", "Pendente em outro bairro", "boa-vista", { estado: "pendente" }),
    ]);
    for (const [nome, id] of [
      ["Imóvel de fora", "fora-1"],
      ["Imóvel pulado", "pulado-1"],
      ["Pendente em outro bairro", "pendente-fora"],
    ] as const) {
      mockIr.mockClear();
      mockDefinirAtiva.mockClear();
      await tocarNoCartao(arvore, nome);
      expect(mockDefinirAtiva).toHaveBeenCalledWith(id);
      expect(mockIr).toHaveBeenCalledWith({ pathname: "/dossie", params: { id } });
    }
  });

  it("'Gerar Dossiê' é o botão principal compartilhado, com seta", () => {
    const arvore = abrirExplorar([]);
    const texto = arvore.root.findAllByType(Text).find((t) => t.props.children === "Gerar Dossiê");
    expect(texto).toBeDefined();
    const botaoDoTexto = arvore.root.findAll(
      (n) => typeof n.type === "string" && n.props.accessibilityRole === "button" && n.findAllByType(Text).some((t) => t.props.children === "Gerar Dossiê"),
    )[0];
    expect(StyleSheet.flatten(botaoDoTexto?.props.style)).toMatchObject({ borderRadius: 12, paddingVertical: 13.5, paddingHorizontal: 18, backgroundColor: CORES_CLARO["cor-acao"] });
    // A seta (dois traços) está dentro do próprio botão.
    expect(botaoDoTexto?.findAll((n) => (n.type as unknown) === "RNSVGPath")).toHaveLength(2);
  });
});

// ——— R1: IPTU, valor e período são uma unidade ——————————————————————————————————————————————

describe("IPTU: valor e período são uma unidade (R1)", () => {
  const SEM_PERIODO = leituraDe("texto", { preco: 4500, iptu: { valor: 288, periodo: "desconhecido" } });
  const ANUAL = leituraDe("json_ld", { preco: 4500, iptu: { valor: 3456, periodo: "ano" } });
  const formularioInicial = () => formularioDeExtracao(montarExtracao("", [SEM_PERIODO], AGORA));
  const novaLeitura = montarExtracao("", [ANUAL], AGORA);

  it("mexer só no período marca valor e período como editados, e a origem passa para você", () => {
    const mexido = editarFormulario(formularioInicial(), { iptuPeriodo: "mes" });
    expect(mexido.editados).toEqual({ iptuValor: true, iptuPeriodo: true });
    expect(mexido.iptuOrigem).toBe("voce");
  });

  it("mexer só no valor marca os dois também", () => {
    const mexido = editarFormulario(formularioInicial(), { iptuValor: 300 });
    expect(mexido.editados).toEqual({ iptuValor: true, iptuPeriodo: true });
    expect(mexido.iptuOrigem).toBe("voce");
  });

  it("'a confirmar' do IPTU continua sendo um campo à parte", () => {
    const mexido = editarFormulario(formularioInicial(), { iptuAConfirmar: false });
    expect(mexido.editados).toEqual({ iptuAConfirmar: true });
  });

  it("caso do revisor: a pessoa muda só o período e a leitura nova chega com valor anual; nada muda", () => {
    const antes = formularioInicial();
    expect(antes).toMatchObject({ iptuValor: 288, iptuPeriodo: "desconhecido", iptuOrigem: "texto" });
    const mexido = editarFormulario(antes, { iptuPeriodo: "mes" });
    const depois = formularioDeExtracao(novaLeitura, mexido);
    expect(depois).toMatchObject({ iptuValor: 288, iptuPeriodo: "mes", iptuOrigem: "voce" });
  });

  it("o custo fica em R$ 288 por mês, nunca R$ 3.456 lido como se fosse mensal", () => {
    // A pessoa resolve o período e desliga o "a confirmar"; depois a leitura anual chega.
    const resolvido = editarFormulario(editarFormulario(formularioInicial(), { iptuPeriodo: "mes" }), { iptuAConfirmar: false });
    const depois = formularioDeExtracao(novaLeitura, resolvido);
    expect(depois).toMatchObject({ iptuValor: 288, iptuPeriodo: "mes", iptuAConfirmar: false });
    const iptu = custoMensal(analiseDe(depois, novaLeitura)).parcelas.find((p) => p.nome === "IPTU");
    expect(iptu).toMatchObject({ estado: "conhecido", valorMensal: 288 });
  });

  it("a pessoa muda só o valor e a leitura nova chega com período: o período da leitura não vale", () => {
    const mexido = editarFormulario(formularioInicial(), { iptuValor: 310 });
    const depois = formularioDeExtracao(novaLeitura, mexido);
    expect(depois).toMatchObject({ iptuValor: 310, iptuPeriodo: "desconhecido", iptuOrigem: "voce" });
  });

  it("a pessoa muda os dois e nenhum é trocado", () => {
    const mexido = editarFormulario(formularioInicial(), { iptuValor: 4200, iptuPeriodo: "ano" });
    const depois = formularioDeExtracao(novaLeitura, mexido);
    expect(depois).toMatchObject({ iptuValor: 4200, iptuPeriodo: "ano" });
  });

  it("formulário só com um dos dois marcado (montado à mão) também fica inteiro", () => {
    const so_periodo = { ...formularioInicial(), iptuPeriodo: "mes" as const, editados: { iptuPeriodo: true as const } };
    expect(formularioDeExtracao(novaLeitura, so_periodo)).toMatchObject({ iptuValor: 288, iptuPeriodo: "mes" });
    const so_valor = { ...formularioInicial(), iptuValor: 310, editados: { iptuValor: true as const } };
    expect(formularioDeExtracao(novaLeitura, so_valor)).toMatchObject({ iptuValor: 310, iptuPeriodo: "desconhecido" });
  });

  it("sem edição, a leitura nova troca valor e período juntos", () => {
    const depois = formularioDeExtracao(novaLeitura, formularioInicial());
    expect(depois).toMatchObject({ iptuValor: 3456, iptuPeriodo: "ano", iptuOrigem: "texto" });
  });
});

// ——— R2: preço e modalidade ————————————————————————————————————————————————————————————————

describe("preço e modalidade (R2)", () => {
  const ALUGUEL = leituraDe("texto", { modalidade: "aluguel", preco: 4500, condominio: 1190 });
  const ext = (...leituras: LeituraParcial[]) => montarExtracao("", leituras, AGORA);

  it("modalidade editada e leitura com outra modalidade: o preço lido não entra, o do formulário fica", () => {
    const comPreco = editarFormulario(formularioDeExtracao(ext(leituraDe("url", { modalidade: "compra" }))), { preco: 650000 });
    const depois = formularioDeExtracao(ext(ALUGUEL), editarFormulario(comPreco, { modalidade: "compra" }));
    expect(depois).toMatchObject({ modalidade: "compra", preco: 650000, precoOrigem: "voce" });
    // O que não depende da modalidade continua entrando.
    expect(depois).toMatchObject({ condominio: 1190, condominioOrigem: "texto" });
  });

  it("o preço que o formulário já tinha (não editado) também fica; o lido não o troca", () => {
    const antes = formularioDeExtracao(ext(leituraDe("texto", { modalidade: "aluguel", preco: 4500 })));
    expect(antes).toMatchObject({ preco: 4500, precoOrigem: "texto" });
    const comprar = editarFormulario(antes, { modalidade: "compra" });
    const depois = formularioDeExtracao(ext(leituraDe("texto", { modalidade: "aluguel", preco: 4600, condominio: 1190 })), comprar);
    expect(depois).toMatchObject({ modalidade: "compra", preco: 4500, precoOrigem: "texto", condominio: 1190 });
  });

  it("sem preço no formulário, o lido continua de fora (fica vazio, nunca zero)", () => {
    const base = editarFormulario(formularioDeExtracao(ext(leituraDe("url", { quartos: 3 }))), { modalidade: "compra" });
    const depois = formularioDeExtracao(ext(ALUGUEL), base);
    expect(depois.preco).toBeNull();
    expect(declaradosDoFormulario(depois).preco.valor).toBeNull();
  });

  it("mesma modalidade: o preço da leitura entra", () => {
    const comprar = editarFormulario(formularioDeExtracao(ext(leituraDe("url", { modalidade: "aluguel" }))), { modalidade: "compra" });
    const depois = formularioDeExtracao(ext(leituraDe("texto", { modalidade: "compra", preco: 650000 })), comprar);
    expect(depois).toMatchObject({ modalidade: "compra", preco: 650000, precoOrigem: "texto" });
  });

  it("leitura sem modalidade (nula): o preço da leitura entra", () => {
    const comprar = editarFormulario(formularioDeExtracao(ext(leituraDe("url", { modalidade: "aluguel" }))), { modalidade: "compra" });
    const depois = formularioDeExtracao(ext(leituraDe("texto", { preco: 720000 })), comprar);
    expect(depois).toMatchObject({ modalidade: "compra", preco: 720000 });
  });

  it("modalidade que ninguém editou: segue a leitura, e o preço dela entra", () => {
    const antes = formularioDeExtracao(ext(leituraDe("texto", { modalidade: "compra", preco: 650000 })));
    const depois = formularioDeExtracao(ext(ALUGUEL), antes);
    expect(depois).toMatchObject({ modalidade: "aluguel", preco: 4500 });
  });

  it("a anomalia do preço que não entrou não liga 'a confirmar' nem aparece na revisão", () => {
    const comprar = editarFormulario(formularioDeExtracao(ext(leituraDe("url", { modalidade: "aluguel" }))), { modalidade: "compra" });
    const simbolica = ext(leituraDe("texto", { modalidade: "aluguel", preco: 50, condominio: 1190 }));
    expect(simbolica.anomalias.some((a) => a.campo === "preco")).toBe(true);
    const depois = formularioDeExtracao(simbolica, comprar);
    expect(depois.precoAConfirmar).toBe(false);
    expect(anomaliasDaRevisao(simbolica, depois).some((a) => a.campo === "preco")).toBe(false);
    // Com a mesma modalidade, a anomalia segue valendo.
    const mesma = ext(leituraDe("texto", { modalidade: "compra", preco: 50 }));
    expect(formularioDeExtracao(mesma, comprar).precoAConfirmar).toBe(true);
    expect(anomaliasDaRevisao(mesma, comprar).some((a) => a.campo === "preco")).toBe(true);
  });

  it("leituraContradizAModalidade só vale com a modalidade editada e a leitura diferente e não nula", () => {
    const base = formularioDeExtracao(ext(leituraDe("url", { modalidade: "aluguel" })));
    const editada = editarFormulario(base, { modalidade: "compra" });
    expect(leituraContradizAModalidade(ext(ALUGUEL), editada)).toBe(true);
    expect(leituraContradizAModalidade(ext(ALUGUEL), base)).toBe(false);
    expect(leituraContradizAModalidade(ext(leituraDe("texto", { modalidade: "compra" })), editada)).toBe(false);
    expect(leituraContradizAModalidade(ext(leituraDe("texto", { preco: 1000 })), editada)).toBe(false);
  });
});

// ——— R3: leitura nova nunca apaga o que já está preenchido ——————————————————————————————————

describe("leitura nova nunca apaga campo preenchido (R3)", () => {
  const ext = (...leituras: LeituraParcial[]) => montarExtracao("", leituras, AGORA);
  const COM_BAIRRO = leituraDe("texto", {
    preco: 4500,
    condominio: 1190,
    area: 85,
    quartos: 3,
    iptu: { valor: 3456, periodo: "ano" },
    bairro: "boa-viagem",
    bairroTexto: "Boa Viagem",
    cidade: "recife",
    logradouro: "Rua da Leitura",
  });
  const SEM_BAIRRO = leituraDe("texto", { preco: 4500 });

  it("'Ler texto' sem bairro depois de um com bairro: o bairro fica, o nome e a cobertura também", () => {
    const primeiro = formularioDeExtracao(ext(COM_BAIRRO));
    expect(primeiro).toMatchObject({ bairro: "boa-viagem", bairroTexto: "Boa Viagem" });
    const segundoExt = ext(SEM_BAIRRO);
    expect(segundoExt.campos.bairro).toBeNull();
    const segundo = formularioDeExtracao(segundoExt, primeiro);
    expect(segundo).toMatchObject({ bairro: "boa-viagem", bairroTexto: "Boa Viagem" });
    expect(coberturaDoFormulario(segundo)).toBe("coberto");
    expect(segundo.nome).toBe(primeiro.nome);
  });

  it("o campo que a leitura nova não traz fica como estava, com a origem que tinha", () => {
    const primeiro = formularioDeExtracao(ext(leituraDe("url", { quartos: 3, area: 85 }), COM_BAIRRO));
    const segundo = formularioDeExtracao(ext(SEM_BAIRRO), primeiro);
    expect(segundo).toMatchObject({
      condominio: 1190,
      condominioOrigem: "texto",
      area: primeiro.area,
      areaOrigem: primeiro.areaOrigem,
      quartos: primeiro.quartos,
      quartosOrigem: primeiro.quartosOrigem,
      logradouro: "Rua da Leitura",
      iptuValor: 3456,
      iptuPeriodo: "ano",
      iptuOrigem: "texto",
    });
  });

  it("só troca por valor não nulo: a leitura nova com condomínio diferente substitui", () => {
    const primeiro = formularioDeExtracao(ext(COM_BAIRRO));
    const segundo = formularioDeExtracao(ext(leituraDe("texto", { preco: 4500, condominio: 1250 })), primeiro);
    expect(segundo).toMatchObject({ condominio: 1250, condominioOrigem: "texto", area: 85 });
  });

  it("'Fora do Recife' lido: leitura nova sem bairro mantém a escolha e o texto lido", () => {
    const fora = formularioDaUrl("quintoandar-outra-cidade");
    expect(fora).toMatchObject({ bairro: FORA_DO_RECIFE, bairroTexto: "Piata Salvador" });
    const depois = formularioDeExtracao(ext(SEM_BAIRRO), fora);
    expect(depois).toMatchObject({ bairro: FORA_DO_RECIFE, bairroTexto: "Piata Salvador" });
  });

  it("leitura que diz outra cidade troca o bairro de uma leitura anterior (valor novo, campo não editado)", () => {
    const primeiro = formularioDeExtracao(ext(COM_BAIRRO));
    const outra = montarExtracao(
      "https://www.quintoandar.com.br/imovel/893333/alugar/apartamento-3-quartos-piata-salvador",
      [{ ...(extrairDaUrl("https://www.quintoandar.com.br/imovel/893333/alugar/apartamento-3-quartos-piata-salvador") as LeituraParcial) }],
      AGORA,
    );
    expect(outra.cobertura).toBe("fora_do_recife");
    expect(formularioDeExtracao(outra, primeiro)).toMatchObject({ bairro: FORA_DO_RECIFE, bairroTexto: "Piata Salvador" });
  });

  it("bairro escolhido pela pessoa continua valendo mesmo sem nada na leitura nova", () => {
    const primeiro = editarFormulario(formularioDeExtracao(ext(COM_BAIRRO)), { bairro: "madalena", bairroTexto: "Madalena" });
    expect(formularioDeExtracao(ext(SEM_BAIRRO), primeiro)).toMatchObject({ bairro: "madalena", bairroTexto: "Madalena" });
  });
});

// ——— R4: "Fora do Recife" guarda o texto lido; a pílula do cartão nunca diz "Recife" por padrão ———————

describe("'Fora do Recife' e a pílula do cartão (R4)", () => {
  const montar = (estado: EstadoDoFormulario, aoAlterar: (novo: EstadoDoFormulario) => void) =>
    React.createElement(TemaDoApp, null, React.createElement(FormularioDeRevisao, { estado, anomalias: [], aoAlterar }));
  const tocavel = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onPress === "function")[0];

  it("o texto lido continua guardado quando a leitura diz que é outra cidade", () => {
    const fora = formularioDaUrl("quintoandar-outra-cidade");
    expect(fora).toMatchObject({ bairro: FORA_DO_RECIFE, bairroTexto: "Piata Salvador" });
    expect(bairroParaSalvar(fora)).toEqual({ bairro: null, bairroTexto: "Piata Salvador" });
    expect(camposDaAnalise(fora)).toMatchObject({ bairro: null, bairroTexto: "Piata Salvador" });
  });

  it("escolher 'Fora do Recife' no seletor não apaga o texto lido", () => {
    const recebidos: EstadoDoFormulario[] = [];
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar(formularioDaUrl("quintoandar-outra-cidade"), (novo) => recebidos.push(novo)));
    });
    act(() => tocavel(arvore, "Bairro")?.props.onPress());
    act(() => tocavel(arvore, "Fora do Recife")?.props.onPress());
    expect(recebidos[0]).toMatchObject({ bairro: FORA_DO_RECIFE, bairroTexto: "Piata Salvador" });
    expect(bairroParaSalvar(recebidos[0]!)).toEqual({ bairro: null, bairroTexto: "Piata Salvador" });
  });

  it("texto lido que não é bairro do Recife também fica (Piedade) quando a pessoa escolhe 'Fora do Recife'", () => {
    const lido = formularioDeExtracao(extracaoDeCampos({ preco: 4500, bairroTexto: "Piedade" }));
    expect(lido).toMatchObject({ bairro: null, bairroTexto: "Piedade" });
    expect(escolhaDeBairro(lido, FORA_DO_RECIFE)).toEqual({ bairro: FORA_DO_RECIFE, bairroTexto: "Piedade" });
  });

  it("o nome de um bairro do Recife não descreve um imóvel de fora: sai do texto", () => {
    expect(escolhaDeBairro({ bairro: "casa-forte", bairroTexto: "Casa Forte" }, FORA_DO_RECIFE)).toEqual({
      bairro: FORA_DO_RECIFE,
      bairroTexto: "",
    });
    expect(escolhaDeBairro({ bairro: "casa-forte", bairroTexto: "Casa Forte" }, "gracas")).toEqual({
      bairro: "gracas",
      bairroTexto: "Graças",
    });
  });

  it("H5d: o texto 'Recife' é a cidade; sem slug, a pílula mostra 'Fora do Recife'", () => {
    for (const texto of ["Recife", "recife", "  RECIFE  "]) expect(rotuloDoBairroNoCartao({ bairro: null, bairroTexto: texto })).toBe("Fora do Recife");
    // O caminho inteiro: a pessoa escolhe "Fora do Recife" num formulário cujo texto de bairro é a cidade.
    const escolha = escolhaDeBairro({ bairro: null, bairroTexto: "Recife" }, FORA_DO_RECIFE);
    const salvo = camposDaAnalise({ ...formularioVazio(), ...escolha });
    expect(salvo).toMatchObject({ bairro: null });
    expect(rotuloDoBairroNoCartao(salvo)).toBe("Fora do Recife");
    // O bairro do centro antigo continua sendo bairro.
    expect(rotuloDoBairroNoCartao({ bairro: "recife", bairroTexto: "Recife" })).toBe("Recife (bairro)");
    expect(rotuloDoBairroNoCartao({ bairro: null, bairroTexto: "Recife Antigo" })).toBe("Recife Antigo");
  });

  it("pílula do cartão: nome oficial com slug; sem slug, o texto lido; sem nada, 'Fora do Recife'", () => {
    expect(rotuloDoBairroNoCartao({ bairro: "casa-forte", bairroTexto: "casa-forte" })).toBe("Casa Forte · Recife");
    expect(rotuloDoBairroNoCartao({ bairro: "gracas", bairroTexto: "" })).toBe("Graças · Recife");
    expect(rotuloDoBairroNoCartao({ bairro: "recife", bairroTexto: "" })).toBe("Recife (bairro)");
    expect(rotuloDoBairroNoCartao({ bairro: null, bairroTexto: "Piata Salvador" })).toBe("Piata Salvador");
    expect(rotuloDoBairroNoCartao({ bairro: null, bairroTexto: "piata-salvador" })).toBe("Piata Salvador");
    expect(rotuloDoBairroNoCartao({ bairro: null, bairroTexto: "" })).toBe("Fora do Recife");
    expect(rotuloDoBairroNoCartao({ bairro: null, bairroTexto: "   " })).toBe("Fora do Recife");
    expect(rotuloDoBairroNoCartao({ bairro: "bairro-inexistente", bairroTexto: "" })).toBe("Fora do Recife");
  });

  describe("no cartão do Explorar", () => {
    function pilulas(a: Partial<AnaliseV2>): string[] {
      const ext = extracaoDeCampos({ preco: 4500, condominio: 1190 });
      mockLista = [{ ...analiseDe(formularioDeExtracao(ext), ext), id: "cartao", nome: "Imóvel do cartão", ...a }];
      let arvore!: TestRenderer.ReactTestRenderer;
      act(() => {
        arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(Explorar)));
      });
      mockLista = [];
      return arvore.root.findAllByType(Text).map((t) => [t.props.children].flat(3).join(""));
    }

    it("com slug mostra o nome oficial; sem slug, o texto lido; sem nada, 'Fora do Recife'", () => {
      expect(pilulas({ bairro: "casa-forte", bairroTexto: "Casa Forte" })).toContain("Casa Forte · Recife");
      expect(pilulas({ bairro: null, bairroTexto: "Piata Salvador", vinculo: { estado: "fora_de_cobertura" } })).toContain("Piata Salvador");
      expect(pilulas({ bairro: null, bairroTexto: "", vinculo: { estado: "fora_de_cobertura" } })).toContain("Fora do Recife");
    });

    it("H5d: 'Fora do Recife' escolhido com o texto 'Recife' (a cidade) mostra 'Fora do Recife'", () => {
      expect(pilulas({ bairro: null, bairroTexto: "Recife", vinculo: { estado: "fora_de_cobertura" } })).toContain("Fora do Recife");
      expect(pilulas({ bairro: null, bairroTexto: " recife ", vinculo: { estado: "fora_de_cobertura" } })).not.toContain("Recife");
    });

    it("nunca 'Recife' sozinho como padrão", () => {
      for (const a of [
        { bairro: null, bairroTexto: "", vinculo: { estado: "fora_de_cobertura" } },
        { bairro: null, bairroTexto: "  ", vinculo: { estado: "fora_de_cobertura" } },
        { bairro: null, bairroTexto: "Piata Salvador", vinculo: { estado: "fora_de_cobertura" } },
      ] as Partial<AnaliseV2>[]) {
        expect(pilulas(a)).not.toContain("Recife");
      }
    });
  });
});

// ——— R5: o texto "Recife" não é o bairro "recife" ——————————————————————————————————————————

describe("slugDoBairroPorTexto (R5)", () => {
  it("'Recife' sozinho é a cidade, não o bairro do centro antigo", () => {
    expect(slugDoBairroPorTexto("Recife")).toBeNull();
    expect(slugDoBairroPorTexto("recife")).toBeNull();
    expect(slugDoBairroPorTexto("  RECIFE  ")).toBeNull();
    expect(bairroEscolhido({ bairroTexto: "Recife" })).toBeNull();
    expect(coberturaDoFormulario({ bairroTexto: "Recife" })).toBe("desconhecida");
    expect(bairroParaSalvar({ bairroTexto: "Recife" })).toEqual({ bairro: null, bairroTexto: "Recife" });
  });

  it("o bairro 'recife' só casa pelos aliases de bairros.ts e pelo nome de exibição", () => {
    for (const texto of ["bairro-do-recife", "Bairro do Recife", "recife-antigo", "Recife Antigo", "RECIFE ANTIGO", "Recife (bairro)"]) {
      expect(slugDoBairroPorTexto(texto)).toBe("recife");
    }
    expect(coberturaDoFormulario({ bairroTexto: "Recife Antigo" })).toBe("recife_fora");
  });

  it("os demais bairros seguem casando por nome, slug e alias, sem acento e sem caixa", () => {
    expect(slugDoBairroPorTexto("Boa Viagem")).toBe("boa-viagem");
    expect(slugDoBairroPorTexto("boa-viagem")).toBe("boa-viagem");
    expect(slugDoBairroPorTexto("GRAÇAS")).toBe("gracas");
    expect(slugDoBairroPorTexto("Poço da Panela")).toBe("poco");
    expect(slugDoBairroPorTexto("poco-da-panela")).toBe("poco");
    expect(slugDoBairroPorTexto("Boa Vista")).toBe("boa-vista");
    expect(slugDoBairroPorTexto("Piedade")).toBeNull();
    expect(slugDoBairroPorTexto("")).toBeNull();
    expect(slugDoBairroPorTexto("   ")).toBeNull();
  });

  it("cada bairro oficial é achado pelo próprio nome de exibição, exceto a cidade sozinha", () => {
    for (const b of BAIRROS_DO_RECIFE) expect([b.slug, slugDoBairroPorTexto(b.nome)]).toEqual([b.slug, b.slug]);
  });
});

// ——— R6: /editar usa o formulário de revisão de verdade ————————————————————————————————————

describe("tela de edição (R6)", () => {
  const sistema = Platform.OS;
  beforeEach(() => {
    mockIr.mockClear();
    mockSalvar.mockClear();
    mockRemover.mockClear();
  });
  afterEach(() => {
    (Platform as { OS: string }).OS = sistema;
    mockLista = [];
    mockParametros = {};
  });

  function salva(id: string, mudancas: Partial<AnaliseV2> = {}): AnaliseV2 {
    const ext = extracaoDeCampos({ preco: 4500, condominio: 1190, area: 60, quartos: 2 });
    return { ...analiseDe(formularioDeExtracao(ext), ext), id, nome: "Imóvel salvo", bairro: "casa-forte", bairroTexto: "Casa Forte", ...mudancas };
  }

  function abrirEditar(parametros: { id?: string } = {}, lista: AnaliseV2[] = []) {
    mockParametros = parametros;
    mockLista = lista;
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(TelaEditar)));
    });
    return arvore;
  }

  const textosDe = (no: TestRenderer.ReactTestInstance): string =>
    no
      .findAllByType(Text)
      .map((t) => [t.props.children].flat(3).filter((c) => typeof c === "string").join(""))
      .join(" ");
  const campo = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onChangeText === "function")[0];
  const toque = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onPress === "function")[0];
  const botao = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll(
      (n) => typeof n.type !== "string" && typeof n.props.onPress === "function" && n.findAllByType(Text).length === 1 && textosDe(n) === rotulo,
    )[0];
  const desativado = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityState !== undefined && textosDe(n) === rotulo)[0]?.props
      .accessibilityState.disabled;
  const escolherBairro = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) => {
    act(() => toque(arvore, "Bairro")?.props.onPress());
    act(() => toque(arvore, rotulo)?.props.onPress());
  };
  const bairroMostrado = (arvore: TestRenderer.ReactTestRenderer) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === "Bairro" && n.props.accessibilityValue)[0]?.props
      .accessibilityValue.text;
  const salvar = async (arvore: TestRenderer.ReactTestRenderer) => {
    await act(async () => botao(arvore, "Salvar alterações")?.props.onPress());
    return mockSalvar.mock.calls[0]?.[0] as AnaliseV2 | undefined;
  };

  it("usa o formulário de revisão compartilhado, com o seletor de bairro", () => {
    const arvore = abrirEditar();
    expect(arvore.root.findAllByType(FormularioDeRevisao)).toHaveLength(1);
    expect(toque(arvore, "Bairro")).toBeDefined();
    expect(textosDe(arvore.root)).toContain("Adicionar imóvel");
  });

  it("análise nova sem bairro escolhido: salvar desativado e a dica 'Escolha o bairro'", async () => {
    const arvore = abrirEditar();
    expect(desativado(arvore, "Salvar alterações")).toBe(true);
    const dica = arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLiveRegion === "polite" && textosDe(n) === "Escolha o bairro");
    expect(dica.length).toBeGreaterThan(0);
    await act(async () => botao(arvore, "Salvar alterações")?.props.onPress());
    expect(mockSalvar).not.toHaveBeenCalled();
    escolherBairro(arvore, "Casa Forte");
    expect(desativado(arvore, "Salvar alterações")).toBe(false);
    expect(arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLiveRegion === "polite")).toHaveLength(0);
  });

  it("a cobertura vem do bairro escolhido: coberto fica pendente; outro bairro e fora do Recife, fora de cobertura", async () => {
    const casos = [
      ["Graças", { bairro: "gracas", bairroTexto: "Graças", vinculo: { estado: "pendente" } }],
      ["Torre", { bairro: "torre", bairroTexto: "Torre", vinculo: { estado: "fora_de_cobertura" } }],
      ["Fora do Recife", { bairro: null, bairroTexto: "", vinculo: { estado: "fora_de_cobertura" } }],
    ] as const;
    for (const [rotulo, esperado] of casos) {
      mockSalvar.mockClear();
      const arvore = abrirEditar();
      escolherBairro(arvore, rotulo);
      act(() => campo(arvore, "Aluguel (R$ por mês)")?.props.onChangeText("3.200"));
      const gravada = await salvar(arvore);
      expect(gravada).toMatchObject({ ...esperado, url: "", extracao: null, descarte: null, salva: true });
      expect(gravada?.declarados.preco).toEqual({ valor: 3200, origem: "voce", aConfirmar: false });
      expect(mockIr).toHaveBeenLastCalledWith("/salvos");
    }
  });

  it("sem nome digitado, o nome é a sugestão do que está no formulário", async () => {
    const arvore = abrirEditar();
    escolherBairro(arvore, "Casa Forte");
    act(() => campo(arvore, "Quartos")?.props.onChangeText("2"));
    expect((await salvar(arvore))?.nome).toBe("Apartamento 2 quartos · Casa Forte");
  });

  it("análise salva abre com o bairro, os valores e as origens dela; editar passa a origem para você", async () => {
    const existente = salva("salva-1", { declarados: { ...salva("x").declarados, preco: { valor: 4500, origem: "texto", aConfirmar: false } } });
    const arvore = abrirEditar({ id: "salva-1" }, [existente]);
    expect(bairroMostrado(arvore)).toBe("Casa Forte");
    expect(campo(arvore, "Aluguel (R$ por mês)")?.props.value).toBe("4.500");
    expect(textosDe(arvore.root)).toContain("Editar análise");
    expect(textosDe(arvore.root)).toContain("do anúncio");

    act(() => campo(arvore, "Aluguel (R$ por mês)")?.props.onChangeText("4.800"));
    const gravada = await salvar(arvore);
    expect(gravada?.declarados.preco).toEqual({ valor: 4800, origem: "voce", aConfirmar: false });
    // O que a pessoa não mexeu continua com a origem que tinha.
    expect(gravada?.declarados.condominio.origem).toBe(existente.declarados.condominio.origem);
    expect(gravada).toMatchObject({ id: "salva-1", criadaEm: existente.criadaEm, vinculo: existente.vinculo });
  });

  it("mexer num campo é registrado em `editados` (a etiqueta do campo passa a 'você')", () => {
    const existente = salva("salva-2", { declarados: { ...salva("x").declarados, condominio: { valor: 1190, origem: "texto", aConfirmar: false } } });
    const arvore = abrirEditar({ id: "salva-2" }, [existente]);
    const antes = textosDe(arvore.root).split("você").length - 1;
    act(() => campo(arvore, "Condomínio (R$ por mês)")?.props.onChangeText("1.250"));
    const depois = textosDe(arvore.root).split("você").length - 1;
    expect(depois).toBe(antes + 1);
  });

  it("mantém o prédio confirmado se o bairro não muda; mudar de bairro recomeça a cobertura", async () => {
    const confirmado = {
      estado: "confirmado",
      edificioId: "60461-331",
      dsqfl: null,
      confirmadoEm: "2026-10-20T12:00:00.000Z",
      indiceGeradoEm: "2026-10-20",
    } as const;
    const existente = salva("salva-3", { vinculo: confirmado });

    const igual = abrirEditar({ id: "salva-3" }, [existente]);
    expect((await salvar(igual))?.vinculo).toEqual(confirmado);

    mockSalvar.mockClear();
    const outroCoberto = abrirEditar({ id: "salva-3" }, [existente]);
    escolherBairro(outroCoberto, "Madalena");
    expect((await salvar(outroCoberto))?.vinculo).toEqual({ estado: "pendente" });

    mockSalvar.mockClear();
    const foraDeCobertura = abrirEditar({ id: "salva-3" }, [existente]);
    escolherBairro(foraDeCobertura, "Torre");
    expect(await salvar(foraDeCobertura)).toMatchObject({ bairro: "torre", vinculo: { estado: "fora_de_cobertura" } });
  });

  it("análise de fora do Recife abre com 'Fora do Recife' e o texto lido guardado", async () => {
    const existente = salva("salva-4", { bairro: null, bairroTexto: "Piata Salvador", vinculo: { estado: "fora_de_cobertura" } });
    const arvore = abrirEditar({ id: "salva-4" }, [existente]);
    expect(bairroMostrado(arvore)).toBe("Fora do Recife");
    expect(desativado(arvore, "Salvar alterações")).toBe(false);
    expect(await salvar(arvore)).toMatchObject({ bairro: null, bairroTexto: "Piata Salvador", vinculo: { estado: "fora_de_cobertura" } });
  });

  it("anomalia da leitura que ainda vale aparece no campo e some quando a pessoa resolve", () => {
    const ext = extracaoDeCampos({ preco: 4500, condominio: 5 });
    const form = formularioDeExtracao(ext);
    const existente = { ...analiseDe(form, ext), id: "salva-5", bairro: "casa-forte", bairroTexto: "Casa Forte" };
    const mensagem = ext.anomalias.find((a) => a.campo === "condominio")?.mensagem ?? "";
    expect(mensagem).not.toBe("");
    const arvore = abrirEditar({ id: "salva-5" }, [existente]);
    expect(textosDe(arvore.root)).toContain(mensagem);
    act(() => campo(arvore, "Condomínio (R$ por mês)")?.props.onChangeText("1.190"));
    // Valor digitado pela pessoa resolve a anomalia da leitura na hora, mesmo com a marca "A confirmar" ainda ligada.
    expect(textosDe(arvore.root)).not.toContain(mensagem);
    act(() => toque(arvore, "A confirmar")?.props.onPress?.());
    // O condomínio digitado vale e resolve a anomalia da leitura, esteja a marca "A confirmar" ligada ou não.
    expect(anomaliasPendentes(ext, declaradosDoFormulario(editarFormulario(form, { condominio: 1190, condominioAConfirmar: false })), form.modalidade)).toHaveLength(0);
  });

  it("H5a: análise salva sem slug cujo texto é bairro do Recife abre com esse bairro, não com 'Fora do Recife'", async () => {
    const existente = salva("salva-7", { bairro: null, bairroTexto: "Boa Viagem", vinculo: { estado: "fora_de_cobertura" } });
    const arvore = abrirEditar({ id: "salva-7" }, [existente]);
    expect(bairroMostrado(arvore)).toBe("Boa Viagem");
    expect(textosDe(arvore.root)).not.toContain("Ainda não cobrimos");
    expect(await salvar(arvore)).toMatchObject({ bairro: "boa-viagem", bairroTexto: "Boa Viagem", vinculo: { estado: "pendente" } });
  });

  it("H5b: na edição, só a anomalia que a leitura trouxe e a pessoa ainda não resolveu aparece", () => {
    // Condomínio R$ 100 para 152 m² (valor_atipico) com o valor lido ainda no formulário: a anomalia aparece.
    const ext = extracaoDeCampos({ preco: 4500, condominio: 100, area: 152, tipologia: "apartamento" });
    const mensagem = ext.anomalias.find((a) => a.campo === "condominio")?.mensagem ?? "";
    expect(mensagem).not.toBe("");
    const lido = { ...analiseDe(formularioDeExtracao(ext), ext), id: "salva-8", bairro: "casa-forte", bairroTexto: "Casa Forte" };
    expect(textosDe(abrirEditar({ id: "salva-8" }, [lido]).root)).toContain(mensagem);
    // Valor que a pessoa já tinha digitado antes (origem "você"): a anomalia da leitura não volta.
    const digitado = { ...lido, declarados: { ...lido.declarados, condominio: { valor: 1190, origem: "voce" as const, aConfirmar: true } } };
    expect(textosDe(abrirEditar({ id: "salva-8" }, [digitado]).root)).not.toContain(mensagem);
    // A modalidade da análise vale na edição: o preço lido para aluguel não é de uma análise de compra.
    const simbolico = extracaoDeCampos({ modalidade: "aluguel", preco: 50, condominio: 1190 });
    const precoLido = simbolico.anomalias.find((a) => a.campo === "preco")?.mensagem ?? "";
    expect(precoLido).not.toBe("");
    const aluguel = { ...analiseDe(formularioDeExtracao(simbolico), simbolico), id: "salva-9", bairro: "casa-forte", bairroTexto: "Casa Forte" };
    expect(textosDe(abrirEditar({ id: "salva-9" }, [aluguel]).root)).toContain(precoLido);
    expect(textosDe(abrirEditar({ id: "salva-9" }, [{ ...aluguel, modalidade: "compra" }]).root)).not.toContain(precoLido);
  });

  it("excluir pede confirmação e remove só depois dela", async () => {
    const existente = salva("salva-6");
    const arvore = abrirEditar({ id: "salva-6" }, [existente]);
    act(() => botao(arvore, "Excluir análise")?.props.onPress());
    expect(mockRemover).not.toHaveBeenCalled();
    await act(async () => toque(arvore, "Sim, excluir")?.props.onPress());
    expect(mockRemover).toHaveBeenCalledWith("salva-6");
    expect(mockIr).toHaveBeenLastCalledWith("/salvos");
  });

  it("modelo: formulário vazio, formulário de análise salva e vínculo", () => {
    const vazio = formularioVazio();
    expect(vazio).toMatchObject({ bairro: null, editados: {}, preco: null, iptuPeriodo: "desconhecido", modalidade: "aluguel" });
    const salvaX = salva("modelo");
    const f = formularioDeAnalise(salvaX);
    expect(f).toMatchObject({ bairro: "casa-forte", bairroTexto: "Casa Forte", editados: {}, preco: 4500, condominio: 1190 });
    expect(declaradosDoFormulario(f)).toEqual(salvaX.declarados);
    expect(vinculoDoFormulario(f, null)).toEqual({ estado: "pendente" });
    expect(vinculoDoFormulario({ bairro: "torre" }, salvaX)).toEqual({ estado: "fora_de_cobertura" });
    expect(vinculoDoFormulario({ bairro: null }, null)).toEqual({ estado: "fora_de_cobertura" });
  });
});

// ——— R2, R3 e R4 na tela de leitura ——————————————————————————————————————————————————————————

describe("tela de leitura: preço e modalidade, leitura nova e 'Fora do Recife' (R2, R3, R4)", () => {
  const URL_OUTRO_SITE = "https://imobiliaria-exemplo.com.br/imovel/apartamento-3-quartos";
  const URL_SALVADOR = fixturesUrl.casos.find((c) => c.id === "quintoandar-outra-cidade")?.entrada ?? "";
  const sistema = Platform.OS;
  beforeEach(() => {
    mockIr.mockClear();
    mockSalvar.mockClear();
    (Platform as { OS: string }).OS = "web";
  });
  afterEach(() => {
    (Platform as { OS: string }).OS = sistema;
    mockParametros = {};
  });

  function abrir(parametros: { url?: string; texto?: string }) {
    mockParametros = parametros;
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(TelaDeLeitura)));
    });
    return arvore;
  }
  const textosDe = (no: TestRenderer.ReactTestInstance): string =>
    no
      .findAllByType(Text)
      .map((t) => [t.props.children].flat(3).filter((c) => typeof c === "string").join(""))
      .join(" ");
  const botao = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll(
      (n) => typeof n.type !== "string" && typeof n.props.onPress === "function" && n.findAllByType(Text).length === 1 && textosDe(n) === rotulo,
    )[0];
  const campo = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onChangeText === "function")[0];
  const bairroMostrado = (arvore: TestRenderer.ReactTestRenderer) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === "Bairro" && n.props.accessibilityValue)[0]?.props
      .accessibilityValue.text;
  const escolherBairro = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) => {
    act(() => arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === "Bairro" && n.props.onPress)[0]?.props.onPress());
    act(() =>
      arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onPress === "function")[0]?.props.onPress(),
    );
  };
  const lerTexto = (arvore: TestRenderer.ReactTestRenderer, texto: string) => {
    act(() => campo(arvore, "Texto do anúncio")?.props.onChangeText(texto));
    act(() => botao(arvore, "Ler texto")?.props.onPress());
  };

  it("R3: 'Ler texto' sem bairro depois de um com bairro não apaga o bairro nem a ação do prédio", async () => {
    const arvore = abrir({ url: URL_OUTRO_SITE });
    expect(bairroMostrado(arvore)).toBe("Nenhum escolhido");

    lerTexto(arvore, "Apartamento para alugar\nAluguel R$ 4.500 /mês\nRua da Leitura, 999 - Boa Viagem, Recife\n85 m²");
    expect(bairroMostrado(arvore)).toBe("Boa Viagem");

    lerTexto(arvore, "Apartamento para alugar\nAluguel R$ 4.500 /mês\nCondomínio R$ 1.190\n85 m²");
    expect(bairroMostrado(arvore)).toBe("Boa Viagem");
    expect(textosDe(arvore.root)).not.toContain("Ainda não cobrimos");
    await act(async () => botao(arvore, "Encontrar o prédio")?.props.onPress());
    expect(mockSalvar.mock.calls[0]?.[0]).toMatchObject({ bairro: "boa-viagem", bairroTexto: "Boa Viagem", vinculo: { estado: "pendente" } });
  });

  it("R2: com 'Comprar' escolhido, o texto com aluguel não preenche o preço de venda", () => {
    const arvore = abrir({ url: URL_OUTRO_SITE });
    act(() =>
      arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityRole === "radio" && textosDe(n) === "Comprar" && n.props.onPress)[0]?.props.onPress(),
    );
    lerTexto(arvore, "Apartamento para alugar\nAluguel R$ 4.500 /mês\nCondomínio R$ 1.190");
    // O aluguel por mês não vira preço de venda; o que não depende da modalidade entra.
    expect(campo(arvore, "Preço de venda (R$)")?.props.value).toBe("");
    expect(campo(arvore, "Condomínio (R$ por mês)")?.props.value).toBe("1.190");

    // O que a pessoa digita depois fica, e a leitura seguinte não o troca.
    act(() => campo(arvore, "Preço de venda (R$)")?.props.onChangeText("650.000"));
    lerTexto(arvore, "Apartamento para alugar\nAluguel R$ 4.600 /mês\nCondomínio R$ 1.190");
    expect(campo(arvore, "Preço de venda (R$)")?.props.value).toBe("650.000");
  });

  it("R4: link de outra cidade vem com 'Fora do Recife' e o texto lido é gravado, sem bairro", async () => {
    const arvore = abrir({ url: URL_SALVADOR });
    expect(bairroMostrado(arvore)).toBe("Fora do Recife");
    expect(textosDe(arvore.root)).toContain("Ainda não cobrimos esta cidade.");
    escolherBairro(arvore, "Fora do Recife");
    expect(bairroMostrado(arvore)).toBe("Fora do Recife");
    await act(async () => botao(arvore, "Salvar no caderno")?.props.onPress());
    expect(mockSalvar.mock.calls[0]?.[0]).toMatchObject({
      bairro: null,
      bairroTexto: "Piata Salvador",
      vinculo: { estado: "fora_de_cobertura" },
    });
  });
});

// ——— H5a: bairro de uma análise salva sem slug ——————————————————————————————————————————————

describe("formularioDeAnalise: bairro de uma análise salva sem slug (H5a)", () => {
  const base = (() => {
    const ext = extracaoDeCampos({ preco: 4500, condominio: 1190 });
    return analiseDe(formularioDeExtracao(ext), ext);
  })();
  const semSlug = (bairroTexto: string, vinculo: AnaliseV2["vinculo"] = { estado: "pendente" }): AnaliseV2 => ({
    ...base,
    bairro: null,
    bairroTexto,
    vinculo,
  });
  const abre = (a: AnaliseV2) => {
    const f = formularioDeAnalise(a);
    return { bairro: f.bairro, bairroTexto: f.bairroTexto };
  };

  it("o texto que nomeia um bairro do Recife vale esse bairro (nome, slug ou alias), sem 'Fora do Recife'", () => {
    const fora = { estado: "fora_de_cobertura" } as const;
    expect(abre(semSlug("Boa Viagem", fora))).toEqual({ bairro: "boa-viagem", bairroTexto: "Boa Viagem" });
    expect(abre(semSlug("boa-viagem", fora))).toEqual({ bairro: "boa-viagem", bairroTexto: "Boa Viagem" });
    expect(abre(semSlug("GRAÇAS", fora))).toEqual({ bairro: "gracas", bairroTexto: "Graças" });
    expect(abre(semSlug("Torre", fora))).toEqual({ bairro: "torre", bairroTexto: "Torre" });
    expect(abre(semSlug("Recife Antigo", fora))).toEqual({ bairro: "recife", bairroTexto: "Recife (bairro)" });
    // Daí a cobertura sai do bairro: Boa Viagem é coberto, Torre não.
    expect(coberturaDoFormulario(formularioDeAnalise(semSlug("Boa Viagem", fora)))).toBe("coberto");
    expect(coberturaDoFormulario(formularioDeAnalise(semSlug("Torre", fora)))).toBe("recife_fora");
  });

  it("o slug guardado continua mandando", () => {
    expect(abre({ ...semSlug("Torre"), bairro: "casa-forte" })).toEqual({ bairro: "casa-forte", bairroTexto: "Casa Forte" });
  });

  it("texto que não é bairro do Recife continua 'Fora do Recife', com o texto guardado", () => {
    expect(abre(semSlug("Piata Salvador"))).toEqual({ bairro: FORA_DO_RECIFE, bairroTexto: "Piata Salvador" });
    expect(abre(semSlug("Piedade"))).toEqual({ bairro: FORA_DO_RECIFE, bairroTexto: "Piedade" });
  });

  it("'Recife' sozinho é a cidade, não o bairro do centro antigo: fica 'Fora do Recife'", () => {
    expect(abre(semSlug("Recife"))).toEqual({ bairro: FORA_DO_RECIFE, bairroTexto: "Recife" });
  });

  it("sem texto: fora de cobertura é 'Fora do Recife'; pendente ou outro estado, nada escolhido", () => {
    expect(abre(semSlug("", { estado: "fora_de_cobertura" }))).toEqual({ bairro: FORA_DO_RECIFE, bairroTexto: "" });
    expect(abre(semSlug(""))).toEqual({ bairro: null, bairroTexto: "" });
  });
});

// ——— H5b: anomalias pendentes depois de salvar —————————————————————————————————————————————

describe("anomalias pendentes depois de salvar (H5b)", () => {
  const ATIPICO = { preco: 4500, condominio: 100, area: 152, tipologia: "apartamento" } as const;
  const comAnomalia = (ext: ExtracaoAnuncio, campo: "bairro" | "modalidade" | "numero" | "totalInformado"): ExtracaoAnuncio => ({
    ...ext,
    anomalias: [...ext.anomalias, { campo, tipo: "incoerente", valorLido: "x", mensagem: `O valor de ${campo} difere entre as fontes lidas.` }],
  });
  const pendentes = (ext: ExtracaoAnuncio, form: EstadoDoFormulario, modalidade = form.modalidade) =>
    anomaliasPendentes(ext, declaradosDoFormulario(form), modalidade).map((a) => `${a.campo}:${a.tipo}`);

  it("o valor da leitura com anomalia conta; sem leitura nenhuma, nada conta", () => {
    const ext = extracaoDeCampos(ATIPICO);
    expect(pendentes(ext, formularioDeExtracao(ext))).toEqual(["condominio:valor_atipico"]);
    expect(anomaliasPendentes(null, declaradosDoFormulario(formularioVazio()), "aluguel")).toEqual([]);
  });

  it("valor que a pessoa digitou (origem 'você') resolve a anomalia, mesmo com 'a confirmar' ligado", () => {
    const ext = extracaoDeCampos(ATIPICO);
    const lido = formularioDeExtracao(ext);
    expect(lido).toMatchObject({ condominioOrigem: "texto", condominioAConfirmar: true });
    const digitado = editarFormulario(lido, { condominio: 1190 });
    expect(digitado).toMatchObject({ condominioOrigem: "voce", condominioAConfirmar: true });
    expect(pendentes(ext, digitado)).toEqual([]);
    expect(primeiraAnomaliaPendente(analiseDe(digitado, ext))).toBeNull();
  });

  it("valor que ninguém declarou ainda (nunca lido) continua pendente", () => {
    const ext = extracaoDeCampos({ preco: 4500, condominio: 5 });
    const form = formularioDeExtracao(ext);
    expect(form).toMatchObject({ condominio: null, condominioOrigem: "voce" });
    expect(pendentes(ext, form)).toEqual(["condominio:valor_simbolico"]);
  });

  it("IPTU: o período em aberto conta enquanto o valor é o da leitura; a pessoa o resolve ao mexer", () => {
    const ext = extracaoDeCampos({ preco: 4500, iptu: { valor: 288, periodo: "desconhecido" } });
    const lido = formularioDeExtracao(ext);
    expect(pendentes(ext, lido)).toEqual(["iptu:periodo_desconhecido"]);
    expect(pendentes(ext, editarFormulario(lido, { iptuPeriodo: "mes" }))).toEqual([]);
  });

  it("anomalia de campo sem valor declarado (bairro, modalidade, número) não conta: a pessoa não tem como resolvê-la", () => {
    const base = extracaoDeCampos({ preco: 4500, condominio: 1190 });
    const form = formularioDeExtracao(base);
    for (const campo of ["bairro", "modalidade", "numero", "totalInformado"] as const) {
      expect([campo, pendentes(comAnomalia(base, campo), form)]).toEqual([campo, []]);
    }
    // Junto de uma anomalia que conta, só a que conta aparece.
    const mista = comAnomalia(extracaoDeCampos(ATIPICO), "bairro");
    expect(pendentes(mista, formularioDeExtracao(mista))).toEqual(["condominio:valor_atipico"]);
  });

  it("preço: só conta se a modalidade da leitura é a da análise", () => {
    const aluguel = extracaoDeCampos({ modalidade: "aluguel", preco: 50, condominio: 1190 });
    const form = formularioDeExtracao(aluguel);
    expect(form.modalidade).toBe("aluguel");
    expect(pendentes(aluguel, form, "aluguel")).toEqual(["preco:valor_simbolico"]);
    // A pessoa mudou a análise para compra: aquele preço é de aluguel e não conta.
    expect(pendentes(aluguel, form, "compra")).toEqual([]);
    expect(primeiraAnomaliaPendente({ ...analiseDe(form, aluguel), modalidade: "compra" })).toBeNull();
    expect(primeiraAnomaliaPendente(analiseDe(form, aluguel))).not.toBeNull();
    // Leitura sem modalidade não contradiz nada: o preço conta, seja qual for a modalidade da análise.
    const semModalidade = extracaoDeCampos({ preco: 50, condominio: 1190 });
    expect(semModalidade.campos.modalidade).toBeNull();
    expect(pendentes(semModalidade, formularioDeExtracao(semModalidade), "compra")).toEqual(["preco:valor_simbolico"]);
    // A regra é do preço: o condomínio da mesma leitura segue valendo na outra modalidade.
    const comCondominio = extracaoDeCampos({ modalidade: "aluguel", preco: 4500, condominio: 5 });
    expect(pendentes(comCondominio, formularioDeExtracao(comCondominio), "compra")).toEqual(["condominio:valor_simbolico"]);
  });

  it("no cartão do Explorar a faixa de diagnóstico segue a mesma regra", () => {
    const aluguel = extracaoDeCampos({ modalidade: "aluguel", preco: 50, condominio: 1190 });
    const analise = analiseDe(formularioDeExtracao(aluguel), aluguel);
    const faixa = (a: AnaliseV2) => {
      mockLista = [a];
      let arvore!: TestRenderer.ReactTestRenderer;
      act(() => {
        arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(Explorar)));
      });
      mockLista = [];
      return arvore.root.findAllByType(Text).map((t) => [t.props.children].flat(3).join(""));
    };
    const titulo = tituloDaAnomalia({ campo: "preco", tipo: "valor_simbolico" });
    expect(faixa({ ...analise, id: "cartao-aluguel" })).toContain(titulo);
    expect(faixa({ ...analise, modalidade: "compra", id: "cartao-compra" })).not.toContain(titulo);
  });
});

// ——— H5c: campos de custo vazios mostram "Não informado", nunca "0" —————————————————————————

describe("campos de custo vazios (H5c)", () => {
  const CAMPOS = [
    "Aluguel (R$ por mês)",
    "Condomínio (R$ por mês)",
    "IPTU (R$)",
    "Seguro incêndio (R$ por mês)",
    "Taxa de serviço (R$ por mês)",
    "Outros custos (R$ por mês)",
  ];
  const abrir = (estado: EstadoDoFormulario) => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(FormularioDeRevisao, { estado, anomalias: [], aoAlterar: () => undefined })),
      );
    });
    return arvore;
  };
  const entrada = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onChangeText === "function")[0];

  it("o placeholder de cada custo é 'Não informado' e o valor fica vazio", () => {
    const arvore = abrir(formularioVazio());
    for (const rotulo of CAMPOS) {
      const campo = entrada(arvore, rotulo);
      expect([rotulo, campo?.props.placeholder, campo?.props.value]).toEqual([rotulo, "Não informado", ""]);
    }
    const compra = abrir({ ...formularioVazio(), modalidade: "compra" });
    expect(entrada(compra, "Preço de venda (R$)")?.props.placeholder).toBe("Não informado");
  });

  it("valor lido aparece e zero digitado pela pessoa continua zero", () => {
    const lido = abrir({ ...formularioVazio(), condominio: 1190, condominioOrigem: "texto", seguroIncendio: 0, seguroIncendioOrigem: "voce" });
    expect(entrada(lido, "Condomínio (R$ por mês)")?.props.value).toBe("1.190");
    expect(entrada(lido, "Seguro incêndio (R$ por mês)")?.props.value).toBe("0");
    expect(entrada(lido, "IPTU (R$)")?.props.value).toBe("");
  });
});

function textosDe(no: TestRenderer.ReactTestInstance): string {
  return no
    .findAllByType(Text)
    .map((t) => [t.props.children].flat(3).filter((c) => typeof c === "string").join(""))
    .join(" ");
}

// ——— H4: endereço do prédio confirmado e filtro na linha do título ————————————————————————————

describe("Explorar: endereço do prédio confirmado e filtro (H4)", () => {
  const agora = AGORA.toISOString();
  const abrirExplorar = async (lista: AnaliseV2[]) => {
    mockLista = lista;
    let arvore!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(Explorar)));
    });
    // O cartão lê o índice cadastral depois da primeira pintura.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    mockLista = [];
    return arvore;
  };
  const textosDoCartao = (arvore: TestRenderer.ReactTestRenderer) =>
    arvore.root.findAllByType(Text).map((t) => [t.props.children].flat(3).filter((c) => typeof c === "string").join(""));
  const base = (() => {
    const ext = extracaoDeCampos({ preco: 4500, condominio: 1190 });
    return { ...analiseDe(formularioDeExtracao(ext), ext), bairro: "casa-forte", bairroTexto: "Casa Forte" } as AnaliseV2;
  })();

  it("com o prédio confirmado, o cartão mostra o endereço do edifício com número, por formatarEndereco", async () => {
    const edificio = edificiosDoBairro("casa-forte")[0];
    if (!edificio) throw new Error("índice de Casa Forte vazio");
    const confirmada: AnaliseV2 = {
      ...base,
      id: "confirmada",
      nome: "Imóvel confirmado",
      logradouro: "rua digitada pela pessoa",
      numero: "1",
      vinculo: { estado: "confirmado", edificioId: edificio.id, dsqfl: edificio.dsqfl, confirmadoEm: agora, indiceGeradoEm: "x" },
    };
    const textos = textosDoCartao(await abrirExplorar([confirmada]));
    const esperado = formatarEndereco(edificio.logradouro, edificio.numero);
    expect(esperado).toMatch(/\d/);
    expect(esperado).not.toBe(edificio.logradouro);
    expect(textos).toContain(esperado);
    expect(textos).not.toContain("Rua Digitada Pela Pessoa, 1");
    expect(textos.some((t) => t.startsWith("Prédio confirmado"))).toBe(true);
  });

  it("sem prédio confirmado, o endereço é a rua da pessoa, também por formatarEndereco; sem rua, o bairro", async () => {
    const comRua = { ...base, id: "com-rua", nome: "Com rua", logradouro: "rua amélia", numero: "331" } as AnaliseV2;
    const semRua = { ...base, id: "sem-rua", nome: "Sem rua", logradouro: null, numero: null } as AnaliseV2;
    const textos = textosDoCartao(await abrirExplorar([comRua, semRua]));
    expect(textos).toContain("Rua Amélia, 331");
    expect(textos).toContain("Casa Forte");
  });

  it("o filtro Todos / Alugar / Comprar fica à direita do título, na mesma linha", async () => {
    const arvore = await abrirExplorar([]);
    // A linha é o contêiner que tem, juntos, o título "Análises Recentes" e o grupo do filtro.
    const linhas = arvore.root.findAll(
      (n) =>
        typeof n.type === "string" &&
        StyleSheet.flatten(n.props.style)?.flexDirection === "row" &&
        n.findAll((f) => typeof f.type === "string" && f.props.accessibilityRole === "radiogroup").length > 0 &&
        n.findAll((f) => f.type === Text && f.props.children === "Análises Recentes").length > 0,
    );
    const linha = linhas[linhas.length - 1];
    expect(linha).toBeDefined();
    const estilo = StyleSheet.flatten(linha?.props.style);
    expect(estilo).toMatchObject({ flexDirection: "row", justifyContent: "space-between", alignItems: "center" });
    expect(estilo?.flexWrap === undefined || estilo.flexWrap === "nowrap").toBe(true);
    const filhos = (linha?.children ?? []).filter((c): c is TestRenderer.ReactTestInstance => typeof c !== "string");
    expect(filhos).toHaveLength(2);
    expect(textosDe(filhos[0] as TestRenderer.ReactTestInstance)).toBe("Análises Recentes");
    expect(textosDe(filhos[1] as TestRenderer.ReactTestInstance)).toBe("Todos Alugar Comprar");
  });
});

// ——— H3: nenhum botão dentro de botão (hidratação na web) ———————————————————————————————————

/**
 * Elemento da árvore que o React Native Web desenha como <button> ou <a>: tocável (recebe toque) e com papel
 * `button`, `link`, `radio`, `tab`, etc. Um dentro do outro vira <button> em <button> no DOM.
 */
function tocaveisAninhados(arvore: TestRenderer.ReactTestRenderer): string[] {
  const ehTocavel = (n: TestRenderer.ReactTestInstance) =>
    typeof n.type === "string" && (typeof n.props.onClick === "function" || typeof n.props.onResponderRelease === "function");
  const nome = (n: TestRenderer.ReactTestInstance) => String(n.props.accessibilityLabel ?? n.props["aria-label"] ?? "?");
  const problemas: string[] = [];
  for (const no of arvore.root.findAll(ehTocavel)) {
    let pai = no.parent;
    while (pai) {
      if (ehTocavel(pai)) {
        problemas.push(`${nome(no)} dentro de ${nome(pai)}`);
        break;
      }
      pai = pai.parent;
    }
  }
  return problemas;
}

describe("Explorar: o marcador e o cartão são irmãos (H3)", () => {
  const ext = extracaoDeCampos({ preco: 4500, condominio: 1190 });
  const analise = (id: string, salva: boolean): AnaliseV2 => ({
    ...analiseDe(formularioDeExtracao(ext), ext),
    id,
    nome: `Imóvel ${id}`,
    bairro: "casa-forte",
    bairroTexto: "Casa Forte",
    salva,
  });
  const abrir = async (lista: AnaliseV2[]) => {
    mockLista = lista;
    let arvore!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(Explorar)));
    });
    mockLista = [];
    return arvore;
  };

  it("o detector acha o aninhamento quando ele existe", () => {
    let aninhado!: TestRenderer.ReactTestRenderer;
    act(() => {
      aninhado = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(
            Pressable,
            { accessibilityLabel: "de fora", onPress: () => undefined },
            React.createElement(Pressable, { accessibilityLabel: "de dentro", onPress: () => undefined }),
          ),
        ),
      );
    });
    expect(tocaveisAninhados(aninhado)).toEqual(["de dentro dentro de de fora"]);
  });

  it("cartões com o imóvel salvo e não salvo não têm toque dentro de toque, e o marcador continua funcionando", async () => {
    const arvore = await abrir([analise("a", true), analise("b", false)]);
    expect(tocaveisAninhados(arvore)).toEqual([]);

    const marcador = (rotulo: string) =>
      arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onPress === "function")[0];
    expect(marcador("Remover dos salvos")).toBeDefined();
    expect(marcador("Salvar imóvel")).toBeDefined();
    mockSalvar.mockClear();
    mockIr.mockClear();
    await act(async () => marcador("Remover dos salvos")?.props.onPress());
    expect(mockSalvar).toHaveBeenCalledTimes(1);
    expect(mockSalvar.mock.calls[0]?.[0]).toMatchObject({ id: "a", salva: false });
    // Tocar no marcador não abre o cartão.
    expect(mockIr).not.toHaveBeenCalled();
  });

  it("o alvo do marcador tem pelo menos 44 × 44", async () => {
    const arvore = await abrir([analise("a", true)]);
    const alvo = arvore.root.findAll((n) => typeof n.type === "string" && n.props.accessibilityLabel === "Remover dos salvos")[0];
    const estilo = StyleSheet.flatten(alvo?.props.style);
    expect(estilo?.width).toBeGreaterThanOrEqual(44);
    expect(estilo?.height).toBeGreaterThanOrEqual(44);
  });
});

// ——— H6: checklist "Preço e custos" da leitura ————————————————————————————————————————————

describe("resumoDePrecoECustos (H6)", () => {
  const ext = (campos: Partial<CamposExtraidos>) => extracaoDeCampos(campos);
  const aluguel = { modalidade: "aluguel", editados: {} } as const;
  const compra = { modalidade: "compra", editados: {} } as const;

  it("aluguel leva '/mês'; compra, não", () => {
    expect(resumoDePrecoECustos(ext({ modalidade: "aluguel", preco: 4500 }), aluguel)).toEqual({ precoLido: true, partes: ["R$ 4.500/mês"] });
    expect(resumoDePrecoECustos(ext({ modalidade: "compra", preco: 890000 }), compra)).toEqual({ precoLido: true, partes: ["R$ 890.000"] });
  });

  it("IPTU leva o período: '/mês', '/ano' ou 'período não informado'", () => {
    const iptu = (periodo: "mes" | "ano" | "desconhecido") => resumoDePrecoECustos(ext({ preco: 4500, iptu: { valor: 154, periodo } }), aluguel).partes;
    expect(iptu("mes")).toEqual(["R$ 4.500/mês", "IPTU R$ 154/mês"]);
    expect(iptu("ano")).toEqual(["R$ 4.500/mês", "IPTU R$ 154/ano"]);
    expect(iptu("desconhecido")).toEqual(["R$ 4.500/mês", "IPTU R$ 154 · período não informado"]);
  });

  it("condomínio é por mês; o que não foi lido não aparece e nunca vira zero", () => {
    expect(resumoDePrecoECustos(ext({ preco: 4500, condominio: 1190 }), aluguel).partes).toEqual(["R$ 4.500/mês", "Cond. R$ 1.190/mês"]);
    expect(resumoDePrecoECustos(ext({}), aluguel)).toEqual({ precoLido: false, partes: [] });
  });

  it("preço que o formulário deixou de fora (R2) também fica de fora do checklist; o resto continua", () => {
    const lidoComoAluguel = ext({ modalidade: "aluguel", preco: 4500, condominio: 1190 });
    const fixouCompra = { modalidade: "compra", editados: { modalidade: true } } as const;
    expect(resumoDePrecoECustos(lidoComoAluguel, fixouCompra)).toEqual({ precoLido: false, partes: ["Cond. R$ 1.190/mês"] });
    // Sem a pessoa ter fixado a modalidade, a leitura manda e o preço aparece.
    expect(resumoDePrecoECustos(lidoComoAluguel, { modalidade: "aluguel", editados: {} }).partes).toEqual(["R$ 4.500/mês", "Cond. R$ 1.190/mês"]);
  });
});

describe("tela de leitura: checklist 'Preço e custos' (H6)", () => {
  const URL_OUTRO_SITE = "https://imobiliaria-exemplo.com.br/imovel/apartamento-3-quartos";
  const sistema = Platform.OS;
  beforeEach(() => {
    (Platform as { OS: string }).OS = "web";
  });
  afterEach(() => {
    (Platform as { OS: string }).OS = sistema;
    mockParametros = {};
  });
  const caso = (id: string) => {
    const achado = fixturesTexto.casos.find((c) => c.id === id);
    if (!achado) throw new Error(`fixture ausente: ${id}`);
    return achado;
  };
  const abrir = (texto: string) => {
    mockParametros = { url: URL_OUTRO_SITE, texto };
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(TelaDeLeitura)));
    });
    return arvore;
  };
  const linhaDePreco = (arvore: TestRenderer.ReactTestRenderer) =>
    arvore.root.findAll((n) => typeof n.type === "string" && String(n.props.accessibilityLabel ?? "").startsWith("Preço e custos:"))[0]?.props
      .accessibilityLabel as string;

  it("aluguel com '/mês' e IPTU sem período: 'IPTU R$ 288 · período não informado'", () => {
    const rotulo = linhaDePreco(abrir(caso("zap-like-iptu-sem-periodo").entrada));
    expect(rotulo).toBe("Preço e custos: R$ 4.500/mês · Cond. R$ 1.190/mês · IPTU R$ 288 · período não informado. Lido");
  });

  it("compra sem '/mês' e IPTU com o período que o anúncio disse", () => {
    const rotulo = linhaDePreco(abrir(caso("iptu-anual-explicito").entrada));
    expect(rotulo).toBe("Preço e custos: R$ 890.000 · Cond. R$ 980/mês · IPTU R$ 3.240/ano. Lido");
  });

  it("sem nada lido, a linha pede o texto e não inventa valor", () => {
    expect(linhaDePreco(abrir(""))).toBe("Preço e custos: Cole o texto do anúncio para ler condomínio e IPTU. Não lido");
  });

  it("preço que o R2 deixou fora do formulário não aparece na linha", () => {
    const arvore = abrir("");
    act(() =>
      arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityRole === "radio" && textosDe(n) === "Comprar" && n.props.onPress)[0]?.props.onPress(),
    );
    act(() =>
      arvore.root
        .findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === "Texto do anúncio" && typeof n.props.onChangeText === "function")[0]
        ?.props.onChangeText("Apartamento para alugar\nAluguel R$ 4.500 /mês\nCondomínio R$ 1.190"),
    );
    act(() =>
      arvore.root.findAll((n) => typeof n.type !== "string" && typeof n.props.onPress === "function" && n.findAllByType(Text).length === 1 && textosDe(n) === "Ler texto")[0]?.props.onPress(),
    );
    const rotulo = linhaDePreco(arvore);
    expect(rotulo).toBe("Preço e custos: Cond. R$ 1.190/mês. Não lido");
    expect(rotulo).not.toContain("4.500");
  });
});
