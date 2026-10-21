import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { parseShareIntent } from "expo-share-intent";
import { getPreprocessorContent } from "expo-share-intent/plugin/build/ios/writeIosShareExtensionFiles";
import React from "react";
import { Platform, Text } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import * as pluginDaColeta from "../plugins/compartilhar/coletaDaPagina";
import withCompartilhar from "../plugins/compartilhar/index";
import * as pluginDoAndroid from "../plugins/compartilhar/processarTexto";
import TelaDeLeitura from "../src/app/(abas)/ler";
import { redirectSystemPath } from "../src/app/+native-intent";
import { PADRAO_DE_TITULO_DE_VERIFICACAO, SCRIPT_COLETOR, SELETOR_DE_DESAFIO } from "../src/componentes/leitor/coletor";
import { AVISO_NADA_DO_ANUNCIO, RecebedorDeCompartilhamento } from "../src/componentes/leitor/RecebedorDeCompartilhamento";
import {
  CHAVE_DA_COLETA,
  anuncioRecebido,
  coletaCompartilhada,
  ehLinkDoCompartilhamento,
  parametrosDaLeitura,
  primeiroLink,
  type Compartilhamento,
} from "../src/dados/extrator/compartilhado";
import { montarExtracao } from "../src/dados/extrator/montar";
import { esquemaColetaDaPagina, lerPagina, type ColetaDaPagina } from "../src/dados/extrator/pagina";
import {
  VALIDADE_DO_LINK_ABERTO_MS,
  coletaDoId,
  esquecerCompartilhamento,
  guardarColeta,
  linkAbertoRecente,
  recebeuDesde,
  registrarLinkAberto,
  registrarRecebimento,
} from "../src/estado/compartilhamento";
import { TemaDoApp } from "../src/tema/Tema";

// ——— Dublês: navegação, caderno, área de transferência, página e o módulo nativo do compartilhamento ———————————

const mockIr = jest.fn();
const mockNavegar = jest.fn();
let mockParametros: Record<string, string> = {};
let mockCaminho = "/";
jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockIr(...args),
    navigate: (...args: unknown[]) => mockNavegar(...args),
    replace: () => undefined,
    canGoBack: () => false,
    back: () => undefined,
  },
  useLocalSearchParams: () => mockParametros,
  usePathname: () => mockCaminho,
}));
jest.mock("../src/estado/Analises", () => ({
  useAnalises: () => ({ salvar: async () => undefined, remover: async () => undefined, lista: [], definirAtiva: async () => undefined, pronto: true }),
}));
const mockCopiado = jest.fn(async () => "");
jest.mock("expo-clipboard", () => ({ getStringAsync: () => mockCopiado() }));
jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
/** A WebView do anúncio: registra que abriu e, quando pedido, falha como a página de bloqueio do portal. */
let mockPaginasAbertas = 0;
let mockBloquear = false;
jest.mock("../src/componentes/leitor/LeitorDePagina", () => {
  const { useEffect } = jest.requireActual<typeof import("react")>("react");
  return {
    LeitorDePagina: ({ aoFalhar }: { aoFalhar: (motivo: string) => void }) => {
      useEffect(() => {
        mockPaginasAbertas += 1;
        if (mockBloquear) aoFalhar("bloqueio");
      }, [aoFalhar]);
      return null;
    },
  };
});
const mockFecharNavegador = jest.fn(async () => ({ type: "dismiss" }));
jest.mock("expo-web-browser", () => ({
  dismissBrowser: () => mockFecharNavegador(),
  openBrowserAsync: async () => ({ type: "cancel" }),
}));
/** `ShareIntentModule` é null no Expo Go; no build próprio, existe. */
let mockModuloNativo: object | null = null;
let mockContexto: { hasShareIntent: boolean; shareIntent: Compartilhamento; resetShareIntent: () => void } = {
  hasShareIntent: false,
  shareIntent: {},
  resetShareIntent: () => undefined,
};
// Propriedades definidas uma a uma: o espalhamento (`...`) leria o getter uma vez só, na criação do dublê.
jest.mock("expo-share-intent", () => {
  const real = jest.requireActual<Record<string, unknown>>("expo-share-intent");
  return Object.defineProperties(
    {},
    {
      __esModule: { value: true },
      parseShareIntent: { value: real.parseShareIntent, enumerable: true },
      ShareIntentModule: { get: () => mockModuloNativo, enumerable: true },
      useShareIntentContext: { value: () => mockContexto, enumerable: true },
    },
  );
});

// ——— Página falsa: o mínimo de DOM que as duas coletas usam ——————————————————————————————————————————

type Pagina = {
  href: string;
  titulo: string;
  ld?: string[];
  nextData?: string;
  initialData?: string;
  estadoGlobal?: unknown;
  main?: string;
  body?: string;
  desafio?: boolean;
  metas?: Record<string, string>;
};

function domFalso(p: Pagina) {
  const documento = {
    title: p.titulo,
    baseURI: p.href,
    querySelectorAll: (seletor: string) => {
      if (seletor === 'script[type="application/ld+json"]') return (p.ld ?? []).map((t) => ({ innerText: t }));
      if (seletor === SELETOR_DE_DESAFIO) return p.desafio ? [{}] : [];
      if (seletor === "meta") {
        return Object.entries(p.metas ?? {}).map(([nome, conteudo]) => ({
          getAttribute: (a: string) => (a === "name" ? nome : a === "content" ? conteudo : null),
        }));
      }
      return [];
    },
    getElementById: (id: string) => {
      if (id === "__NEXT_DATA__" && p.nextData !== undefined) return { innerText: p.nextData };
      if (id === "initial-data" && p.initialData !== undefined) return { getAttribute: () => p.initialData };
      return null;
    },
    querySelector: (seletor: string) => (seletor === "main" && p.main !== undefined ? { innerText: p.main } : null),
    body: p.body !== undefined ? { innerText: p.body } : null,
  };
  return { documento, janela: { location: { href: p.href }, __INITIAL_STATE__: p.estadoGlobal } as Record<string, unknown> };
}

/** O que a WebView do app manda para `LeitorDePagina` nesta página (primeira mensagem de `SCRIPT_COLETOR`). */
function coletaDaWebView(p: Pagina): unknown {
  const { documento, janela } = domFalso(p);
  const mensagens: string[] = [];
  janela.ReactNativeWebView = { postMessage: (m: string) => mensagens.push(m) };
  new Function("document", "window", "setTimeout", SCRIPT_COLETOR)(documento, janela, () => undefined);
  return JSON.parse(mensagens[0] ?? "null");
}

/**
 * O caminho inteiro do iOS, menos o nativo: o arquivo de pré-processamento que o plugin gera roda na página, a extensão
 * devolve `{ baseURI, meta }`, o módulo nativo o entrega como JSON e o JavaScript da biblioteca monta o `ShareIntent`.
 */
function compartilharDoSafari(p: Pagina): Compartilhamento {
  const { documento, janela } = domFalso(p);
  const arquivo = getPreprocessorContent(withCompartilhar.opcoesDoShareIntent());
  const preprocessador = new Function("document", "window", `${arquivo}\nreturn ExtensionPreprocessingJS;`)(documento, janela) as {
    run: (a: { completionFunction: (r: { baseURI: string; meta: string }) => void }) => void;
  };
  let resultado: { baseURI: string; meta: string } | null = null;
  preprocessador.run({ completionFunction: (r) => (resultado = r) });
  if (resultado === null) throw new Error("o pré-processador não chamou completionFunction");
  const { baseURI, meta } = resultado;
  return parseShareIntent(JSON.stringify({ weburls: [{ url: baseURI, meta }], type: "weburl" }), {});
}

/** O que o Android entrega ao JavaScript para um ACTION_SEND de texto (o "Ler no Vereda" vira um deles). */
function compartilharNoAndroid(texto: string): Compartilhamento {
  return parseShareIntent({ text: texto, type: "text", meta: { title: null } } as never, {});
}

const URL_ZAP =
  "https://www.zapimoveis.com.br/imovel/aluguel-apartamento-3-quartos-com-garagem-boa-viagem-recife-pe-125m2-id-2799999910/";
const TEXTO_ZAP =
  "Apartamento com 3 quartos para alugar, 125 m²\nRua Projetada A - Boa Viagem, Recife - PE\nAluguel\nR$ 4.500 /mês\nCondomínio\nR$ 1.190\nIPTU\nR$ 288\n125 m²\n3 quartos";
const PAGINA_ZAP: Pagina = {
  href: URL_ZAP,
  titulo: "Apartamento com 3 Quartos para alugar, 125m² em Boa Viagem, Recife - ZAP Imóveis",
  main: TEXTO_ZAP,
  metas: { description: "Apartamento para alugar em Boa Viagem" },
};

// ——— Coleta do Safari: a mesma da WebView ————————————————————————————————————————————————————————————

describe("coleta da página no Safari (plugins/compartilhar)", () => {
  const casos: [string, Pagina][] = [
    ["anúncio com texto", PAGINA_ZAP],
    [
      "JSON-LD, __NEXT_DATA__, initial-data e estado global",
      {
        href: URL_ZAP,
        titulo: "Anúncio",
        ld: ['{"@type":"Offer","price":"4500"}', '{"@type":"Residence"}'],
        nextData: '{"props":{"pageProps":{}}}',
        initialData: '{"listing":{"id":"2799999910"}}',
        estadoGlobal: { anuncio: { id: 2799999910 } },
        body: TEXTO_ZAP,
      },
    ],
    [
      "acima dos limites do esquema",
      {
        href: `${URL_ZAP}?${"a".repeat(2500)}`,
        titulo: "t".repeat(400),
        ld: [...Array.from({ length: 12 }, (_, i) => `{"n":${i}}`), "x".repeat(200 * 1024 + 1)],
        nextData: "y".repeat(3 * 1024 * 1024 + 1),
        initialData: '{"a":1}',
        estadoGlobal: { b: 2 },
        main: "z".repeat(250_000),
      },
    ],
    ["desafio da Cloudflare", { href: URL_ZAP, titulo: "Just a moment...", body: "Verificando", desafio: true }],
    ["página vazia, sem main nem body", { href: URL_ZAP, titulo: "" }],
  ];

  it.each(casos)("%s: devolve o mesmo que a WebView e passa no esquema", (_nome, pagina) => {
    const { documento, janela } = domFalso(pagina);
    const doSafari = pluginDaColeta.coletarPagina(
      documento,
      janela,
      pluginDaColeta.PADRAO_DE_TITULO_DE_VERIFICACAO,
      pluginDaColeta.SELETOR_DE_DESAFIO,
    );
    expect(doSafari).toEqual(coletaDaWebView(pagina));
    expect(esquemaColetaDaPagina.safeParse(doSafari).success).toBe(true);
  });

  it("os limites cortam como o esquema manda", () => {
    const { documento, janela } = domFalso(casos[2]![1]);
    const coleta = pluginDaColeta.coletarPagina(documento, janela, pluginDaColeta.PADRAO_DE_TITULO_DE_VERIFICACAO, pluginDaColeta.SELETOR_DE_DESAFIO);
    expect(coleta.titulo).toHaveLength(300);
    expect(coleta.url).toHaveLength(2000);
    expect(coleta.ld).toHaveLength(10);
    expect(coleta.estados).toEqual(['{"a":1}', '{"b":2}']);
    expect(coleta.texto).toHaveLength(200_000);
  });

  it("o padrão do desafio, o seletor e a chave são os mesmos do app", () => {
    expect(pluginDaColeta.PADRAO_DE_TITULO_DE_VERIFICACAO.source).toBe(PADRAO_DE_TITULO_DE_VERIFICACAO.source);
    expect(pluginDaColeta.PADRAO_DE_TITULO_DE_VERIFICACAO.flags).toBe(PADRAO_DE_TITULO_DE_VERIFICACAO.flags);
    expect(pluginDaColeta.SELETOR_DE_DESAFIO).toBe(SELETOR_DE_DESAFIO);
    expect(pluginDaColeta.CHAVE_DA_COLETA).toBe(CHAVE_DA_COLETA);
  });

  it("do Safari ao formulário: o arquivo gerado rende preço, condomínio e IPTU do anúncio", () => {
    const compartilhado = compartilharDoSafari(PAGINA_ZAP);
    expect(compartilhado.webUrl).toBe(URL_ZAP);
    expect(compartilhado.meta?.description).toBe("Apartamento para alugar em Boa Viagem");
    const recebido = anuncioRecebido(compartilhado, null);
    expect(recebido?.url).toBe(URL_ZAP);
    expect(recebido?.texto).toBe("");
    expect(recebido?.coleta?.texto).toBe(TEXTO_ZAP);
    const campos = montarExtracao(URL_ZAP, lerPagina(recebido!.coleta!, "zap", "2799999910"), new Date("2026-10-20T12:00:00Z")).campos;
    expect(campos.preco).toBe(4500);
    expect(campos.condominio).toBe(1190);
    expect(campos.iptu?.valor).toBe(288);
  });

  it("um erro na coleta não impede o compartilhamento: chega o link", () => {
    const pagina = domFalso(PAGINA_ZAP);
    const arquivo = getPreprocessorContent(withCompartilhar.opcoesDoShareIntent());
    const documento = { ...pagina.documento, getElementById: () => {
      throw new Error("DOM recusou");
    } };
    let resultado: { baseURI: string; meta: string } | null = null;
    const preprocessador = new Function("document", "window", `${arquivo}\nreturn ExtensionPreprocessingJS;`)(documento, pagina.janela) as {
      run: (a: { completionFunction: (r: { baseURI: string; meta: string }) => void }) => void;
    };
    preprocessador.run({ completionFunction: (r) => (resultado = r) });
    const meta = JSON.parse(resultado!.meta) as Record<string, string>;
    expect(meta[CHAVE_DA_COLETA]).toBeUndefined();
    expect(anuncioRecebido(parseShareIntent(JSON.stringify({ weburls: [{ url: URL_ZAP, meta: resultado!.meta }], type: "weburl" }), {}), null)).toEqual({
      url: URL_ZAP,
      texto: "",
      coleta: null,
    });
  });
});

// ——— Montagem do anúncio recebido e dos parâmetros ——————————————————————————————————————————————————————

describe("anúncio recebido por compartilhamento", () => {
  const coleta: ColetaDaPagina = { url: URL_ZAP, titulo: "Anúncio", ld: [], estados: [], texto: TEXTO_ZAP, verificacao: false };

  it("coleta em meta: válida passa; ausente, quebrada ou fora dos limites, não", () => {
    expect(coletaCompartilhada({ [CHAVE_DA_COLETA]: JSON.stringify(coleta) })).toEqual(coleta);
    expect(coletaCompartilhada(undefined)).toBeNull();
    expect(coletaCompartilhada({ title: "Anúncio" })).toBeNull();
    expect(coletaCompartilhada({ [CHAVE_DA_COLETA]: "{não é json" })).toBeNull();
    expect(coletaCompartilhada({ [CHAVE_DA_COLETA]: JSON.stringify({ ...coleta, texto: "x".repeat(200_001) }) })).toBeNull();
    expect(coletaCompartilhada({ [CHAVE_DA_COLETA]: JSON.stringify({ ...coleta, extra: 1 }) })).toBeNull();
  });

  it("link compartilhado do Chrome: só o link, sem texto", () => {
    expect(anuncioRecebido(compartilharNoAndroid(URL_ZAP), null)).toEqual({ url: URL_ZAP, texto: "", coleta: null });
  });

  it("mensagem com o link (app do portal, conversa): o link sai do meio do texto, sem a pontuação do fim", () => {
    const recebido = anuncioRecebido(compartilharNoAndroid(`Olha este imóvel que encontrei: ${URL_ZAP}.`), null);
    expect(recebido).toEqual({ url: URL_ZAP, texto: "", coleta: null });
    expect(primeiroLink(`(veja ${URL_ZAP})`)).toBe(URL_ZAP);
    expect(primeiroLink("sem link nenhum")).toBeNull();
    expect(primeiroLink("ftp://exemplo.test/arquivo")).toBeNull();
  });

  it("trecho do 'Ler no Vereda' sem link: junta o link aberto no navegador e passa pelo filtro do copiado", () => {
    expect(anuncioRecebido(compartilharNoAndroid(TEXTO_ZAP), URL_ZAP)).toEqual({ url: URL_ZAP, texto: TEXTO_ZAP, coleta: null });
    expect(anuncioRecebido(compartilharNoAndroid(TEXTO_ZAP), null)).toEqual({ url: "", texto: TEXTO_ZAP, coleta: null });
  });

  it("o link que veio no próprio texto manda mais que o aberto antes", () => {
    const outro = "https://www.vivareal.com.br/imovel/apartamento-2-quartos-gracas-recife-id-999/";
    expect(anuncioRecebido(compartilharNoAndroid(`${TEXTO_ZAP}\n${outro}`), URL_ZAP)?.url).toBe(outro);
  });

  it("texto que não é anúncio é descartado e, sem link, nada abre", () => {
    expect(anuncioRecebido(compartilharNoAndroid("Senha do wi-fi: casa-da-praia-2026, rede Visitantes do terceiro andar"), URL_ZAP)).toBeNull();
    expect(anuncioRecebido(compartilharNoAndroid("Oi"), null)).toBeNull();
    expect(anuncioRecebido({}, null)).toBeNull();
  });

  it("parâmetros da rota: só o que veio, com a origem e a marca", () => {
    expect(parametrosDaLeitura({ url: URL_ZAP, texto: "", coleta }, "17", "c3")).toEqual({
      origem: "compartilhado",
      n: "17",
      url: URL_ZAP,
      coleta: "c3",
    });
    expect(parametrosDaLeitura({ url: "", texto: TEXTO_ZAP, coleta: null }, "18", null)).toEqual({
      origem: "compartilhado",
      n: "18",
      texto: TEXTO_ZAP,
    });
  });

  it("o link do Safari vai para a espera; os outros seguem como vieram", () => {
    expect(ehLinkDoCompartilhamento("vereda://dataUrl=veredaShareKey?nonce=1#weburl")).toBe(true);
    expect(redirectSystemPath({ path: "vereda://dataUrl=veredaShareKey?nonce=1#weburl", initial: true })).toBe("/receber");
    expect(redirectSystemPath({ path: "/ler?url=x", initial: false })).toBe("/ler?url=x");
  });
});

describe("memória do compartilhamento", () => {
  beforeEach(() => esquecerCompartilhamento());
  const coleta: ColetaDaPagina = { url: URL_ZAP, titulo: "", ld: [], estados: [], texto: "", verificacao: false };

  it("só a última coleta fica, pelo id da rota", () => {
    const primeira = guardarColeta(coleta);
    const segunda = guardarColeta({ ...coleta, titulo: "nova" });
    expect(coletaDoId(primeira)).toBeNull();
    expect(coletaDoId(segunda)?.titulo).toBe("nova");
  });

  it("o link aberto vale por meia hora", () => {
    registrarLinkAberto(URL_ZAP, 1_000);
    expect(linkAbertoRecente(1_000 + VALIDADE_DO_LINK_ABERTO_MS)).toBe(URL_ZAP);
    expect(linkAbertoRecente(1_001 + VALIDADE_DO_LINK_ABERTO_MS)).toBeNull();
  });

  it("recebimento depois de abrir o navegador dispensa a área de transferência", () => {
    expect(recebeuDesde(0)).toBe(false);
    registrarRecebimento(500);
    expect(recebeuDesde(400)).toBe(true);
    expect(recebeuDesde(600)).toBe(false);
  });
});

// ——— Plugin do Android ——————————————————————————————————————————————————————————————————————————————

describe("'Ler no Vereda' no menu de seleção (Android)", () => {
  const manifesto = () => ({ manifest: { $: {}, application: [{ $: { "android:name": ".MainApplication" }, activity: [{ $: { "android:name": ".MainActivity" } }] }] } });

  it("acrescenta a atividade sem tela com PROCESS_TEXT, uma vez só", () => {
    const uma = pluginDoAndroid.adicionarAtividade(manifesto() as never) as unknown as ReturnType<typeof manifesto>;
    const duas = pluginDoAndroid.adicionarAtividade(uma as never) as unknown as ReturnType<typeof manifesto>;
    const atividades = duas.manifest.application[0]!.activity as { $: Record<string, string>; "intent-filter"?: unknown[] }[];
    expect(atividades.map((a) => a.$["android:name"])).toEqual([".MainActivity", ".ProcessarTextoActivity"]);
    const atividade = atividades[1]!;
    expect(atividade.$["android:label"]).toBe("Ler no Vereda");
    expect(atividade.$["android:theme"]).toBe("@android:style/Theme.NoDisplay");
    expect(JSON.stringify(atividade["intent-filter"])).toContain("android.intent.action.PROCESS_TEXT");
    expect(JSON.stringify(atividade["intent-filter"])).toContain("text/plain");
  });

  it("o código fica no pacote da MainActivity e repassa o trecho como ACTION_SEND de texto", () => {
    const codigo = pluginDoAndroid.codigoDaAtividade("br.vereda.prototipo");
    expect(codigo).toMatch(/^package br\.vereda\.prototipo\n/);
    expect(codigo).toContain("Intent.EXTRA_PROCESS_TEXT");
    expect(codigo).toContain("action = Intent.ACTION_SEND");
    expect(codigo).toContain('type = "text/plain"');
    expect(pluginDoAndroid.caminhoDaAtividade("/raiz/android", "br.vereda.prototipo")).toBe(
      "/raiz/android/app/src/main/java/br/vereda/prototipo/ProcessarTextoActivity.kt",
    );
  });

  it("a extensão do iOS aceita página, link e texto, com o nome em português", () => {
    const opcoes = withCompartilhar.opcoesDoShareIntent();
    expect(opcoes.iosActivationRules).toEqual({
      NSExtensionActivationSupportsWebURLWithMaxCount: 1,
      NSExtensionActivationSupportsWebPageWithMaxCount: 1,
      NSExtensionActivationSupportsText: true,
    });
    expect(opcoes.iosShareExtensionName).toBe("Ler no Vereda");
    expect(opcoes.androidIntentFilters).toEqual(["text/*"]);
  });
});

// ——— Recebedor e tela de leitura ——————————————————————————————————————————————————————————————————————

const sistema = Platform.OS;

function textos(arvore: TestRenderer.ReactTestRenderer): string {
  return arvore.root
    .findAllByType(Text)
    .map((t) => [t.props.children].flat(3).filter((c) => typeof c === "string").join(""))
    .join(" ");
}

describe("recebedor do compartilhamento (raiz)", () => {
  const mockLimpar = jest.fn();
  beforeEach(() => {
    esquecerCompartilhamento();
    mockNavegar.mockClear();
    mockLimpar.mockClear();
    mockFecharNavegador.mockClear();
    mockCaminho = "/";
    (Platform as { OS: string }).OS = "ios";
  });
  afterEach(() => {
    (Platform as { OS: string }).OS = sistema;
    mockContexto = { hasShareIntent: false, shareIntent: {}, resetShareIntent: () => undefined };
  });

  function receber(compartilhado: Compartilhamento) {
    mockContexto = { hasShareIntent: true, shareIntent: compartilhado, resetShareIntent: mockLimpar };
    act(() => {
      TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(RecebedorDeCompartilhamento)));
    });
  }

  it("página do Safari: guarda a coleta, limpa o compartilhamento, fecha a aba e abre a leitura", () => {
    mockCaminho = "/receber";
    receber(compartilharDoSafari(PAGINA_ZAP));
    expect(mockLimpar).toHaveBeenCalledTimes(1);
    expect(mockFecharNavegador).toHaveBeenCalledTimes(1);
    expect(mockNavegar).toHaveBeenCalledTimes(1);
    const destino = mockNavegar.mock.calls[0]![0] as { pathname: string; params: Record<string, string> };
    expect(destino.pathname).toBe("/ler");
    expect(destino.params).toMatchObject({ origem: "compartilhado", url: URL_ZAP });
    expect(coletaDoId(destino.params.coleta!)?.texto).toBe(TEXTO_ZAP);
    expect(linkAbertoRecente(Date.now())).toBe(URL_ZAP);
    expect(recebeuDesde(Date.now() - 1_000)).toBe(true);
  });

  it("trecho sem link, com o app aberto em outra tela: navega para a leitura com o link aberto antes", () => {
    registrarLinkAberto(URL_ZAP, Date.now());
    receber(compartilharNoAndroid(TEXTO_ZAP));
    expect(mockNavegar).toHaveBeenCalledWith({
      pathname: "/ler",
      params: expect.objectContaining({ origem: "compartilhado", url: URL_ZAP, texto: TEXTO_ZAP }),
    });
  });

  it("nada do anúncio: avisa, não abre a leitura e sai da espera", () => {
    mockCaminho = "/receber";
    receber(compartilharNoAndroid("Reunião às 9h na sala 3, levar o crachá e o caderno"));
    expect(mockNavegar).toHaveBeenCalledTimes(1);
    expect(mockNavegar).toHaveBeenCalledWith("/");
    expect(mockLimpar).toHaveBeenCalledTimes(1);
    expect(AVISO_NADA_DO_ANUNCIO).toContain("Ler no Vereda");
  });
});

describe("tela de leitura com o anúncio compartilhado", () => {
  beforeEach(() => {
    esquecerCompartilhamento();
    mockPaginasAbertas = 0;
    mockBloquear = false;
    mockModuloNativo = null;
    mockCopiado.mockClear();
    (Platform as { OS: string }).OS = "ios";
  });
  afterEach(() => {
    (Platform as { OS: string }).OS = sistema;
  });

  function abrir(parametros: Record<string, string>) {
    mockParametros = parametros;
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(TelaDeLeitura)));
    });
    return arvore;
  }
  const valor = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
    arvore.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityLabel === rotulo && typeof n.props.onChangeText === "function")[0]
      ?.props.value;

  it("página do Safari: preço, condomínio e IPTU preenchidos na revisão, sem abrir a WebView", () => {
    const recebido = anuncioRecebido(compartilharDoSafari(PAGINA_ZAP), null)!;
    const arvore = abrir(parametrosDaLeitura(recebido, "1", guardarColeta(recebido.coleta!)));
    expect(valor(arvore, "Aluguel (R$ por mês)")).toBe("4.500");
    expect(valor(arvore, "Condomínio (R$ por mês)")).toBe("1.190");
    expect(valor(arvore, "IPTU (R$)")).toBe("288");
    expect(mockPaginasAbertas).toBe(0);
    expect(textos(arvore)).toContain("Lemos a página que você compartilhou.");
  });

  it("trecho do menu de seleção: preenche, mostra o trecho no campo e não lê a área de transferência", () => {
    const arvore = abrir(parametrosDaLeitura({ url: URL_ZAP, texto: TEXTO_ZAP, coleta: null }, "2", null));
    expect(valor(arvore, "Aluguel (R$ por mês)")).toBe("4.500");
    expect(valor(arvore, "Condomínio (R$ por mês)")).toBe("1.190");
    expect(valor(arvore, "IPTU (R$)")).toBe("288");
    expect(valor(arvore, "Texto do anúncio")).toBe(TEXTO_ZAP);
    expect(mockPaginasAbertas).toBe(0);
    expect(mockCopiado).not.toHaveBeenCalled();
    expect(textos(arvore)).toContain("Lemos o trecho que você escolheu.");
  });

  it("só o link: a WebView tenta ler, como num link colado", () => {
    abrir(parametrosDaLeitura({ url: URL_ZAP, texto: "", coleta: null }, "3", null));
    expect(mockPaginasAbertas).toBe(1);
  });

  it("coleta que já saiu da memória: volta ao caminho do link", () => {
    abrir({ origem: "compartilhado", n: "4", url: URL_ZAP, coleta: "c999" });
    expect(mockPaginasAbertas).toBe(1);
  });

  it("portal que bloqueia, no build próprio: a instrução fala de Ler no Vereda; no Expo Go, só de copiar", () => {
    mockBloquear = true;
    mockModuloNativo = {};
    const comModulo = abrir({ url: URL_ZAP, n: "5" });
    expect(textos(comModulo)).toContain("toque em Compartilhar e escolha Ler no Vereda");
    (Platform as { OS: string }).OS = "android";
    const noAndroid = abrir({ url: URL_ZAP, n: "6" });
    expect(textos(noAndroid)).toContain("toque em Ler no Vereda, no menu da seleção");
    mockModuloNativo = null;
    const semModulo = abrir({ url: URL_ZAP, n: "7" });
    expect(textos(semModulo)).not.toContain("Ler no Vereda");
    expect(textos(semModulo)).toContain("copie e volte");
  });
});
