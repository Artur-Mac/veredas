import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { StyleSheet } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { AvisoDeExemplo, ROTULO_DO_LINK_PARA_EXPLORAR, TEXTO_DO_AVISO_DE_EXEMPLO } from "../src/componentes/dossie/AvisoDeExemplo";
import { AVISO_DE_OUTRA_PAGINA, AVISO_DE_VERIFICACAO, LeitorDePagina } from "../src/componentes/leitor/LeitorDePagina";
import {
  PADRAO_DE_TITULO_DE_VERIFICACAO,
  SCRIPT_COLETOR,
  SELETOR_DE_DESAFIO,
} from "../src/componentes/leitor/coletor";
import {
  ESTADO_INICIAL_DO_LEITOR,
  proximoEstado,
  rendeDados,
  type EstadoDoLeitor,
} from "../src/componentes/leitor/decidir";
import { camposVazios, type CamposExtraidos, type LeituraParcial } from "../src/dados/contratos";
import { SessaoDoApp } from "../src/estado/Sessao";
import { TemaDoApp } from "../src/tema/Tema";
import { CORES_CLARO } from "../src/tema/tokens";
import fixturesEstado from "./fixtures/estado-pagina.json";
import LayoutDoDossie from "../src/app/exemplos/[id]/_layout";

type PropsDaWebView = {
  onMessage: (evento: { nativeEvent: { data: string } }) => void;
  onShouldStartLoadWithRequest: (pedido: { url: string }) => boolean;
  userAgent?: string;
};

// Aviso dos exemplos (P8): o roteador e a área segura são simulados; o layout é o de verdade.
type GlobaisDoAviso = { __dismissTo: jest.Mock };
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return {
    router: { dismissTo: (...args: unknown[]) => (globalThis as unknown as GlobaisDoAviso).__dismissTo(...args) },
    useLocalSearchParams: () => ({ id: "boa-viagem" }),
    Redirect: () => React.createElement(View, { testID: "redirecionou" }),
    // O `Stack` de verdade é de navegação: aqui ele só mostra o recuo de topo que as telas receberiam.
    Stack: Object.assign(
      () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useSafeAreaInsets } = require("react-native-safe-area-context");
        return React.createElement(View, { testID: "pilha", accessibilityLabel: `topo ${useSafeAreaInsets().top}` });
      },
      { Screen: () => null },
    ),
  };
});
jest.mock("react-native-safe-area-context", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const SafeAreaInsetsContext = React.createContext(null);
  // Como o de verdade: lê o contexto; sem provedor, devolve o aparelho de teste (relógio de 47 pontos).
  const useSafeAreaInsets = () => React.useContext(SafeAreaInsetsContext) ?? { top: 47, bottom: 34, left: 0, right: 0 };
  return { SafeAreaInsetsContext, useSafeAreaInsets };
});

// A WebView real não roda no Jest: o mock guarda as props para o teste "ser a página".
jest.mock("react-native-webview", () => ({
  WebView: (props: unknown) => {
    (globalThis as { __webViewProps?: unknown }).__webViewProps = props;
    return null;
  },
}));
const webView = () => (globalThis as { __webViewProps?: unknown }).__webViewProps as PropsDaWebView;

function leitura(campos: Partial<CamposExtraidos>): LeituraParcial {
  return { metodo: "json_ld", portal: "zap", idNoPortal: null, campos: { ...camposVazios(), ...campos } };
}

const COM_PRECO = [leitura({ preco: 4500 })];
const COM_AREA = [leitura({ area: 125 })];
const SEM_DADOS = [leitura({ quartos: 3 })];

const CARREGANDO: EstadoDoLeitor = { fase: "carregando" };
const VERIFICANDO: EstadoDoLeitor = { fase: "verificando" };
const LIDO: EstadoDoLeitor = { fase: "lido" };

describe("decisão do leitor de página", () => {
  it("começa carregando", () => {
    expect(ESTADO_INICIAL_DO_LEITOR).toEqual(CARREGANDO);
  });

  describe("1. mensagem que rende preço ou área vira lido, mesmo com verificação", () => {
    it("preço, sem verificação", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "mensagem", leituras: COM_PRECO, verificacao: false })).toEqual(LIDO);
    });
    it("área, sem verificação", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "mensagem", leituras: COM_AREA, verificacao: false })).toEqual(LIDO);
    });
    it("preço trazido junto com a palavra 'verifique' do anúncio", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "mensagem", leituras: COM_PRECO, verificacao: true })).toEqual(LIDO);
    });
    it("já em verificação, a página que passa a trazer dados vira lido", () => {
      expect(proximoEstado(VERIFICANDO, { tipo: "mensagem", leituras: COM_PRECO, verificacao: false })).toEqual(LIDO);
    });
    it("depois de falhar por tempo, dados que chegam ainda valem (a página continua à vista)", () => {
      const falhou: EstadoDoLeitor = { fase: "falhou", motivo: "tempo" };
      expect(proximoEstado(falhou, { tipo: "mensagem", leituras: COM_PRECO, verificacao: false })).toEqual(LIDO);
    });
    it("quartos sem preço nem área não rendem", () => {
      expect(rendeDados(SEM_DADOS)).toBe(false);
      expect(proximoEstado(CARREGANDO, { tipo: "mensagem", leituras: SEM_DADOS, verificacao: false })).toBe(CARREGANDO);
    });
  });

  describe("2. verificação sem dados vira verificando", () => {
    it("a partir de carregando", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "mensagem", leituras: [], verificacao: true })).toEqual(VERIFICANDO);
    });
    it("leitura sem preço nem área, com verificação", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "mensagem", leituras: SEM_DADOS, verificacao: true })).toEqual(VERIFICANDO);
    });
    it("continua verificando enquanto a página não trouxer dados", () => {
      expect(proximoEstado(VERIFICANDO, { tipo: "mensagem", leituras: [], verificacao: false })).toBe(VERIFICANDO);
      expect(proximoEstado(VERIFICANDO, { tipo: "mensagem", leituras: [], verificacao: true })).toBe(VERIFICANDO);
    });
    it("depois de falhar por tempo, a mensagem de verificação sem dados volta a verificando (o desafio chegou depois dos 20 s)", () => {
      const falhou: EstadoDoLeitor = { fase: "falhou", motivo: "tempo" };
      expect(proximoEstado(falhou, { tipo: "mensagem", leituras: [], verificacao: true })).toEqual(VERIFICANDO);
      expect(proximoEstado(falhou, { tipo: "mensagem", leituras: SEM_DADOS, verificacao: true })).toEqual(VERIFICANDO);
    });
    it("falhou por tempo e a mensagem não é de verificação nem rende dados: segue falhado", () => {
      const falhou: EstadoDoLeitor = { fase: "falhou", motivo: "tempo" };
      expect(proximoEstado(falhou, { tipo: "mensagem", leituras: [], verificacao: false })).toBe(falhou);
    });
    it("falha por verificação ou por erro não volta a verificando", () => {
      const porVerificacao: EstadoDoLeitor = { fase: "falhou", motivo: "verificacao" };
      const porErro: EstadoDoLeitor = { fase: "falhou", motivo: "erro" };
      expect(proximoEstado(porVerificacao, { tipo: "mensagem", leituras: [], verificacao: true })).toBe(porVerificacao);
      expect(proximoEstado(porErro, { tipo: "mensagem", leituras: [], verificacao: true })).toBe(porErro);
    });
  });

  describe("3. prazo de 20 s só derruba carregando", () => {
    it("carregando vira falhou por tempo", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "prazo_20s" })).toEqual({ fase: "falhou", motivo: "tempo" });
    });
    it("verificando segue verificando", () => {
      expect(proximoEstado(VERIFICANDO, { tipo: "prazo_20s" })).toBe(VERIFICANDO);
    });
    it("lido segue lido", () => {
      expect(proximoEstado(LIDO, { tipo: "prazo_20s" })).toBe(LIDO);
    });
  });

  describe("4. prazo de 120 s só derruba verificando", () => {
    it("verificando vira falhou por verificação", () => {
      expect(proximoEstado(VERIFICANDO, { tipo: "prazo_120s" })).toEqual({ fase: "falhou", motivo: "verificacao" });
    });
    it("carregando segue carregando (o prazo de 20 s é quem o derruba)", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "prazo_120s" })).toBe(CARREGANDO);
    });
    it("lido segue lido", () => {
      expect(proximoEstado(LIDO, { tipo: "prazo_120s" })).toBe(LIDO);
    });
    it("quem já falhou por tempo mantém o motivo", () => {
      const falhou: EstadoDoLeitor = { fase: "falhou", motivo: "tempo" };
      expect(proximoEstado(falhou, { tipo: "prazo_120s" })).toBe(falhou);
    });
  });

  describe("5. erro de carregamento", () => {
    it("derruba carregando", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "erro" })).toEqual({ fase: "falhou", motivo: "erro" });
    });
    it("derruba verificando", () => {
      expect(proximoEstado(VERIFICANDO, { tipo: "erro" })).toEqual({ fase: "falhou", motivo: "erro" });
    });
    it("não desfaz uma leitura que já deu certo", () => {
      expect(proximoEstado(LIDO, { tipo: "erro" })).toBe(LIDO);
    });
  });

  describe("6. o portal abre outra página (P5)", () => {
    const OUTRA = { outraPagina: true };
    const RECUPERAVEL: EstadoDoLeitor = { fase: "falhou", motivo: "outra_pagina" };

    it("sem dados e sem verificação, derruba carregando, verificando e a falha por tempo", () => {
      for (const antes of [CARREGANDO, VERIFICANDO, { fase: "falhou", motivo: "tempo" } as EstadoDoLeitor]) {
        expect(proximoEstado(antes, { tipo: "mensagem", leituras: [], verificacao: false, ...OUTRA })).toEqual(RECUPERAVEL);
      }
    });
    it("leitura sem preço nem área também falha", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "mensagem", leituras: SEM_DADOS, verificacao: false, ...OUTRA })).toEqual(RECUPERAVEL);
    });
    it("repetir a mensagem não muda nada (mesma referência, sem novo aviso ao fluxo)", () => {
      expect(proximoEstado(RECUPERAVEL, { tipo: "mensagem", leituras: [], verificacao: false, ...OUTRA })).toBe(RECUPERAVEL);
    });
    it("preço ou área que vieram do estado do anúncio ainda valem", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "mensagem", leituras: COM_PRECO, verificacao: false, ...OUTRA })).toEqual(LIDO);
    });
    it("o desafio do portal tem prioridade: em outra página, continua verificando", () => {
      expect(proximoEstado(CARREGANDO, { tipo: "mensagem", leituras: [], verificacao: true, ...OUTRA })).toEqual(VERIFICANDO);
      expect(proximoEstado(VERIFICANDO, { tipo: "mensagem", leituras: [], verificacao: true, ...OUTRA })).toBe(VERIFICANDO);
    });
    it("a pessoa volta ao anúncio: dados viram lido, e um desafio vira verificando", () => {
      expect(proximoEstado(RECUPERAVEL, { tipo: "mensagem", leituras: COM_AREA, verificacao: false })).toEqual(LIDO);
      expect(proximoEstado(RECUPERAVEL, { tipo: "mensagem", leituras: [], verificacao: true })).toEqual(VERIFICANDO);
    });
    it("voltar ao anúncio sem dados ainda não é leitura: segue falhado", () => {
      expect(proximoEstado(RECUPERAVEL, { tipo: "mensagem", leituras: [], verificacao: false })).toBe(RECUPERAVEL);
    });
    it("falha por erro ou por verificação não é trocada por outra página", () => {
      const porErro: EstadoDoLeitor = { fase: "falhou", motivo: "erro" };
      const porVerificacao: EstadoDoLeitor = { fase: "falhou", motivo: "verificacao" };
      expect(proximoEstado(porErro, { tipo: "mensagem", leituras: [], verificacao: false, ...OUTRA })).toBe(porErro);
      expect(proximoEstado(porVerificacao, { tipo: "mensagem", leituras: [], verificacao: false, ...OUTRA })).toBe(porVerificacao);
    });
    it("lido não muda", () => {
      expect(proximoEstado(LIDO, { tipo: "mensagem", leituras: [], verificacao: false, ...OUTRA })).toBe(LIDO);
    });
    it("os prazos não mexem na falha por outra página", () => {
      expect(proximoEstado(RECUPERAVEL, { tipo: "prazo_20s" })).toBe(RECUPERAVEL);
      expect(proximoEstado(RECUPERAVEL, { tipo: "prazo_120s" })).toBe(RECUPERAVEL);
      expect(proximoEstado(RECUPERAVEL, { tipo: "erro" })).toBe(RECUPERAVEL);
    });
  });

  it("a sequência do bug: 25 s de carregamento, verificação e preço depois", () => {
    // A página demora, o prazo de 20 s derruba; quando a pessoa resolve o desafio, o anúncio chega.
    let estado = proximoEstado(ESTADO_INICIAL_DO_LEITOR, { tipo: "prazo_20s" });
    expect(estado).toEqual({ fase: "falhou", motivo: "tempo" });
    estado = proximoEstado(estado, { tipo: "mensagem", leituras: COM_PRECO, verificacao: true });
    expect(estado).toEqual(LIDO);
  });

  it("a sequência do desafio tardio: 25 s de carregamento, desafio, depois o anúncio", () => {
    let estado = proximoEstado(ESTADO_INICIAL_DO_LEITOR, { tipo: "prazo_20s" });
    estado = proximoEstado(estado, { tipo: "mensagem", leituras: [], verificacao: true });
    expect(estado).toEqual(VERIFICANDO);
    estado = proximoEstado(estado, { tipo: "mensagem", leituras: COM_PRECO, verificacao: false });
    expect(estado).toEqual(LIDO);
  });

  it("a sequência feliz de verificação: desafio, depois o anúncio", () => {
    let estado = proximoEstado(ESTADO_INICIAL_DO_LEITOR, { tipo: "mensagem", leituras: [], verificacao: true });
    expect(estado).toEqual(VERIFICANDO);
    estado = proximoEstado(estado, { tipo: "prazo_20s" });
    expect(estado).toEqual(VERIFICANDO);
    estado = proximoEstado(estado, { tipo: "mensagem", leituras: COM_AREA, verificacao: false });
    expect(estado).toEqual(LIDO);
  });
});

// O defeito de C2 estava no componente (prazos reiniciados a cada renderização, verificação sem prazo), não só na regra.
describe("LeitorDePagina: prazos e mensagens", () => {
  const URL_DO_ANUNCIO = "https://www.zapimoveis.com.br/imovel/123";
  const COLETA_COM_PRECO = JSON.stringify({
    url: URL_DO_ANUNCIO,
    titulo: "Verifique a disponibilidade · Apartamento",
    ld: [],
    estados: [],
    texto: "Apartamento para alugar\nAluguel\nR$ 4.500 /mês\nCondomínio\nR$ 1.190\n125 m²\n3 quartos",
    verificacao: true,
  });
  const COLETA_DE_DESAFIO = JSON.stringify({
    url: URL_DO_ANUNCIO,
    titulo: "Just a moment...",
    ld: [],
    estados: [],
    texto: "Verify you are human",
    verificacao: true,
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  function montar(aoLer: (l: LeituraParcial[]) => void, aoFalhar: (m: string) => void) {
    return React.createElement(
      TemaDoApp,
      null,
      React.createElement(LeitorDePagina, { url: URL_DO_ANUNCIO, portal: "zap", idNoPortal: "123", aoLer, aoFalhar }),
    );
  }

  it("o prazo de 20 s dispara uma vez, mesmo com o pai recriando os callbacks a cada renderização", () => {
    const falhas: string[] = [];
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar(() => undefined, (m) => falhas.push(m)));
    });
    for (let i = 0; i < 5; i++) {
      act(() => jest.advanceTimersByTime(3000));
      act(() => arvore.update(montar(() => undefined, (m) => falhas.push(m))));
    }
    expect(falhas).toEqual([]);
    act(() => jest.advanceTimersByTime(4999));
    expect(falhas).toEqual([]);
    act(() => jest.advanceTimersByTime(2));
    expect(falhas).toEqual(["tempo"]);
    act(() => jest.advanceTimersByTime(200_000));
    expect(falhas).toEqual(["tempo"]);
  });

  it("anúncio com a palavra 'verifique' e preço é lido uma vez, não descartado", () => {
    const lidos: LeituraParcial[][] = [];
    const falhas: string[] = [];
    act(() => {
      TestRenderer.create(montar((l) => lidos.push(l), (m) => falhas.push(m)));
    });
    act(() => webView().onMessage({ nativeEvent: { data: COLETA_COM_PRECO } }));
    expect(lidos).toHaveLength(1);
    expect(lidos[0]?.some((l) => l.campos.preco === 4500)).toBe(true);
    act(() => webView().onMessage({ nativeEvent: { data: COLETA_COM_PRECO } }));
    expect(lidos).toHaveLength(1);
    act(() => jest.advanceTimersByTime(200_000));
    expect(falhas).toEqual([]);
  });

  it("desafio do portal: avisa, não falha aos 20 s e só falha por verificação aos 120 s", () => {
    const falhas: string[] = [];
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar(() => undefined, (m) => falhas.push(m)));
    });
    act(() => jest.advanceTimersByTime(5000));
    act(() => webView().onMessage({ nativeEvent: { data: COLETA_DE_DESAFIO } }));
    expect(JSON.stringify(arvore.toJSON())).toContain("O portal pediu uma verificação. Complete na página abaixo.");
    act(() => jest.advanceTimersByTime(30_000));
    expect(falhas).toEqual([]);
    act(() => jest.advanceTimersByTime(90_000));
    expect(falhas).toEqual(["verificacao"]);
  });

  it("desafio que chega depois da falha por tempo ainda é esperado: avisa e falha por verificação aos 120 s da montagem", () => {
    const falhas: string[] = [];
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar(() => undefined, (m) => falhas.push(m)));
    });
    act(() => jest.advanceTimersByTime(21_000));
    expect(falhas).toEqual(["tempo"]);
    act(() => jest.advanceTimersByTime(4_000));
    act(() => webView().onMessage({ nativeEvent: { data: COLETA_DE_DESAFIO } }));
    expect(JSON.stringify(arvore.toJSON())).toContain("O portal pediu uma verificação. Complete na página abaixo.");
    act(() => jest.advanceTimersByTime(94_000));
    expect(falhas).toEqual(["tempo"]);
    act(() => jest.advanceTimersByTime(2_000));
    expect(falhas).toEqual(["tempo", "verificacao"]);
  });

  it("desafio que chega depois dos 120 s da montagem ganha um prazo novo, nunca fica sem prazo", () => {
    const falhas: string[] = [];
    act(() => {
      TestRenderer.create(montar(() => undefined, (m) => falhas.push(m)));
    });
    act(() => jest.advanceTimersByTime(130_000));
    expect(falhas).toEqual(["tempo"]);
    act(() => webView().onMessage({ nativeEvent: { data: COLETA_DE_DESAFIO } }));
    act(() => jest.advanceTimersByTime(119_000));
    expect(falhas).toEqual(["tempo"]);
    act(() => jest.advanceTimersByTime(2_000));
    expect(falhas).toEqual(["tempo", "verificacao"]);
  });

  it("depois do desafio tardio, o anúncio que chega vira lido e nenhum prazo derruba", () => {
    const lidos: LeituraParcial[][] = [];
    const falhas: string[] = [];
    act(() => {
      TestRenderer.create(montar((l) => lidos.push(l), (m) => falhas.push(m)));
    });
    act(() => jest.advanceTimersByTime(25_000));
    act(() => webView().onMessage({ nativeEvent: { data: COLETA_DE_DESAFIO } }));
    act(() => webView().onMessage({ nativeEvent: { data: COLETA_COM_PRECO } }));
    expect(lidos).toHaveLength(1);
    act(() => jest.advanceTimersByTime(400_000));
    expect(falhas).toEqual(["tempo"]);
  });

  it("JSON quebrado e mensagem fora do esquema são ignorados", () => {
    const lidos: LeituraParcial[][] = [];
    act(() => {
      TestRenderer.create(montar((l) => lidos.push(l), () => undefined));
    });
    act(() => webView().onMessage({ nativeEvent: { data: "{quebrado" } }));
    act(() => webView().onMessage({ nativeEvent: { data: JSON.stringify({ url: 1 }) } }));
    expect(lidos).toEqual([]);
  });

  it("navegação só no domínio do portal e no desafio da Cloudflare; sem userAgent trocado", () => {
    act(() => {
      TestRenderer.create(montar(() => undefined, () => undefined));
    });
    const pode = (url: string) => webView().onShouldStartLoadWithRequest({ url });
    expect(pode(URL_DO_ANUNCIO)).toBe(true);
    expect(pode("https://challenges.cloudflare.com/turnstile/v0/api.js")).toBe(true);
    expect(pode("https://evil.example.com/")).toBe(false);
    expect(pode("https://zapimoveis.com.br.evil.com/")).toBe(false);
    expect(pode("javascript:alert(1)")).toBe(false);
    expect(pode("file:///etc/passwd")).toBe(false);
    expect(webView().userAgent).toBeUndefined();
  });
});

// ——— P5: o portal abre outra página no meio da leitura ————————————————————————————————————————————

describe("LeitorDePagina: o portal abre outra página (P5)", () => {
  const URL_DO_ANUNCIO = "https://www.zapimoveis.com.br/imovel/123";
  const URL_DA_LISTA = "https://www.zapimoveis.com.br/aluguel/apartamentos/pe+recife+casa-forte/";
  const LD_DA_LISTA = JSON.stringify({ "@type": "Apartment", offers: { price: "7777" }, floorSize: { value: 222 } });
  // Preço e área de OUTROS anúncios, os da lista: nada disso pode virar leitura do anúncio pedido.
  const TEXTO_DA_LISTA = "Apartamentos para alugar\nAluguel R$ 8.888 /mês\nCondomínio R$ 1.234\n150 m²\n4 quartos";
  const coleta = (url: string, extra: Record<string, unknown> = {}) =>
    JSON.stringify({ url, titulo: "ZAP Imóveis", ld: [LD_DA_LISTA], estados: [], texto: TEXTO_DA_LISTA, verificacao: false, ...extra });
  const COLETA_DO_ANUNCIO = coleta(URL_DO_ANUNCIO, { ld: [], texto: "Apartamento\nAluguel R$ 4.500 /mês\n125 m²" });

  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  function montar(aoLer: (l: LeituraParcial[]) => void, aoFalhar: (m: string) => void) {
    return React.createElement(
      TemaDoApp,
      null,
      React.createElement(LeitorDePagina, { url: URL_DO_ANUNCIO, portal: "zap", idNoPortal: "123", aoLer, aoFalhar }),
    );
  }
  const textoDoAviso = (arvore: TestRenderer.ReactTestRenderer, texto: string) =>
    arvore.root.findAll((n) => String(n.type) === "Text" && n.props.children === texto);

  it("lista, busca ou início: nada é lido, o aviso aparece e o fluxo recebe a falha uma vez", () => {
    const lidos: LeituraParcial[][] = [];
    const falhas: string[] = [];
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar((l) => lidos.push(l), (m) => falhas.push(m)));
    });
    expect(textoDoAviso(arvore, AVISO_DE_OUTRA_PAGINA)).toHaveLength(0);
    act(() => webView().onMessage({ nativeEvent: { data: coleta(URL_DA_LISTA) } }));
    expect(lidos).toEqual([]);
    expect(falhas).toEqual(["outra_pagina"]);
    expect(AVISO_DE_OUTRA_PAGINA).toBe("O portal abriu outra página. Confira o anúncio ou cole o texto.");
    expect(textoDoAviso(arvore, AVISO_DE_OUTRA_PAGINA)).toHaveLength(1);
    // Outra mensagem da mesma página (o coletor roda de novo 2,5 s depois): sem novo aviso ao fluxo, sem leitura.
    act(() => webView().onMessage({ nativeEvent: { data: coleta("https://www.zapimoveis.com.br/") } }));
    act(() => webView().onMessage({ nativeEvent: { data: coleta("https://www.zapimoveis.com.br/busca?q=casa+forte") } }));
    act(() => jest.advanceTimersByTime(400_000));
    expect(lidos).toEqual([]);
    expect(falhas).toEqual(["outra_pagina"]);
  });

  it("o aviso usa ferrugem de texto pequeno, por token", () => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar(() => undefined, () => undefined));
    });
    act(() => webView().onMessage({ nativeEvent: { data: coleta(URL_DA_LISTA) } }));
    const [no] = textoDoAviso(arvore, AVISO_DE_OUTRA_PAGINA);
    const estilo = StyleSheet.flatten(no?.props.style) as { color?: string };
    expect(estilo.color).toBe(CORES_CLARO["cor-barro-texto"]);
  });

  it("o aviso de verificação também usa o token, e o de outra página não aparece junto", () => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar(() => undefined, () => undefined));
    });
    act(() =>
      webView().onMessage({ nativeEvent: { data: coleta(URL_DO_ANUNCIO, { titulo: "Just a moment...", ld: [], texto: "", verificacao: true }) } }),
    );
    const [no] = textoDoAviso(arvore, AVISO_DE_VERIFICACAO);
    expect((StyleSheet.flatten(no?.props.style) as { color?: string }).color).toBe(CORES_CLARO["cor-barro-texto"]);
    expect(textoDoAviso(arvore, AVISO_DE_OUTRA_PAGINA)).toHaveLength(0);
  });

  it("o anúncio com a palavra 'verifique' continua lido: o desafio da própria página não é outra página", () => {
    const lidos: LeituraParcial[][] = [];
    const falhas: string[] = [];
    act(() => {
      TestRenderer.create(montar((l) => lidos.push(l), (m) => falhas.push(m)));
    });
    act(() => webView().onMessage({ nativeEvent: { data: COLETA_DO_ANUNCIO } }));
    expect(lidos).toHaveLength(1);
    expect(falhas).toEqual([]);
  });

  it("na lista, estado sem o objeto com o id do anúncio não rende: nada é lido e o fluxo recebe a falha", () => {
    const lidos: LeituraParcial[][] = [];
    const falhas: string[] = [];
    act(() => {
      TestRenderer.create(montar((l) => lidos.push(l), (m) => falhas.push(m)));
    });
    // Estado de QuintoAndar com o objeto do anúncio de id 895799920; o leitor aqui espera o id 123 do ZAP: nada casa.
    act(() => webView().onMessage({ nativeEvent: { data: coleta(URL_DA_LISTA, { estados: [JSON.stringify(fixturesEstado.estado)] }) } }));
    expect(lidos).toEqual([]);
    expect(falhas).toEqual(["outra_pagina"]);
  });

  it("a página aberta é outra, mas o estado traz o objeto com o id do anúncio: vale, só o do anúncio", () => {
    const URL_QA = "https://www.quintoandar.com.br/imovel/895799920/alugar/apartamento-2-quartos-espinheiro-recife";
    const lidos: LeituraParcial[][] = [];
    const falhas: string[] = [];
    act(() => {
      TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(LeitorDePagina, {
            url: URL_QA,
            portal: "quintoandar",
            idNoPortal: "895799920",
            aoLer: (l: LeituraParcial[]) => lidos.push(l),
            aoFalhar: (m: string) => falhas.push(m),
          }),
        ),
      );
    });
    const naLista = coleta("https://www.quintoandar.com.br/alugar/imovel/recife-pe-brasil", { estados: [JSON.stringify(fixturesEstado.estado)] });
    act(() => webView().onMessage({ nativeEvent: { data: naLista } }));
    expect(falhas).toEqual([]);
    expect(lidos).toHaveLength(1);
    const lidas = lidos[0] ?? [];
    expect(lidas.map((l) => l.campos.preco)).toEqual([2800]);
    expect(JSON.stringify(lidas)).not.toMatch(/7777|8888|1234|222|9999/);
  });

  it("depois de outra página, a pessoa volta ao anúncio: lê e o aviso some", () => {
    const lidos: LeituraParcial[][] = [];
    const falhas: string[] = [];
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar((l) => lidos.push(l), (m) => falhas.push(m)));
    });
    act(() => webView().onMessage({ nativeEvent: { data: coleta(URL_DA_LISTA) } }));
    expect(textoDoAviso(arvore, AVISO_DE_OUTRA_PAGINA)).toHaveLength(1);
    act(() => webView().onMessage({ nativeEvent: { data: COLETA_DO_ANUNCIO } }));
    expect(lidos).toHaveLength(1);
    expect(lidos[0]?.some((l) => l.campos.preco === 4500)).toBe(true);
    expect(JSON.stringify(lidos)).not.toMatch(/7777|8888/);
    expect(textoDoAviso(arvore, AVISO_DE_OUTRA_PAGINA)).toHaveLength(0);
    expect(falhas).toEqual(["outra_pagina"]);
  });

  it("depois da falha por tempo, uma página que não é a do anúncio troca o motivo", () => {
    const falhas: string[] = [];
    act(() => {
      TestRenderer.create(montar(() => undefined, (m) => falhas.push(m)));
    });
    act(() => jest.advanceTimersByTime(21_000));
    act(() => webView().onMessage({ nativeEvent: { data: coleta(URL_DA_LISTA) } }));
    expect(falhas).toEqual(["tempo", "outra_pagina"]);
  });

  it("desafio em outra página continua sendo desafio: verifica, não falha", () => {
    const falhas: string[] = [];
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(montar(() => undefined, (m) => falhas.push(m)));
    });
    act(() =>
      webView().onMessage({ nativeEvent: { data: coleta("https://www.zapimoveis.com.br/", { titulo: "Just a moment...", ld: [], texto: "", verificacao: true }) } }),
    );
    expect(falhas).toEqual([]);
    expect(textoDoAviso(arvore, AVISO_DE_VERIFICACAO)).toHaveLength(1);
  });

  it("host diferente do portal conta como outra página", () => {
    const falhas: string[] = [];
    act(() => {
      TestRenderer.create(montar(() => undefined, (m) => falhas.push(m)));
    });
    act(() => webView().onMessage({ nativeEvent: { data: coleta("https://www.example.com/imovel/123") } }));
    expect(falhas).toEqual(["outra_pagina"]);
  });
});

// ——— P8: faixa de exemplo no topo de /exemplos/* ——————————————————————————————————————————————————————

describe("aviso dos exemplos (P8)", () => {
  const G = globalThis as unknown as GlobaisDoAviso;
  beforeEach(() => {
    G.__dismissTo = jest.fn();
  });

  const todos = (arvore: TestRenderer.ReactTestRenderer, pred: (n: TestRenderer.ReactTestInstance) => boolean) => arvore.root.findAll(pred);
  const link = (arvore: TestRenderer.ReactTestRenderer) =>
    todos(arvore, (n) => typeof n.type !== "string" && n.props.role === "link" && n.props.accessibilityLabel === ROTULO_DO_LINK_PARA_EXPLORAR)[0];

  it("o texto é exatamente o combinado", () => {
    expect(TEXTO_DO_AVISO_DE_EXEMPLO).toBe("Exemplo com dados de demonstração. Para dados do cadastro, cole o link de um anúncio.");
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(AvisoDeExemplo)));
    });
    expect(todos(arvore, (n) => String(n.type) === "Text" && n.props.children === TEXTO_DO_AVISO_DE_EXEMPLO)).toHaveLength(1);
  });

  it("o link leva ao Explorar e tem toque de pelo menos 44 por 44", () => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(AvisoDeExemplo)));
    });
    const alvo = link(arvore);
    expect(alvo).toBeDefined();
    act(() => alvo?.props.onPress());
    expect(G.__dismissTo).toHaveBeenCalledTimes(1);
    expect(G.__dismissTo).toHaveBeenCalledWith("/");
    const estilo = StyleSheet.flatten(alvo?.props.style) as { minWidth?: number; minHeight?: number };
    expect(estilo.minWidth).toBeGreaterThanOrEqual(44);
    expect(estilo.minHeight).toBeGreaterThanOrEqual(44);
  });

  it("a cor de fundo e a do texto vêm dos tokens", () => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(AvisoDeExemplo)));
    });
    const faixa = todos(arvore, (n) => String(n.type) === "View" && StyleSheet.flatten(n.props.style)?.backgroundColor === CORES_CLARO["cor-nota"]);
    expect(faixa.length).toBeGreaterThan(0);
    const [texto] = todos(arvore, (n) => String(n.type) === "Text" && n.props.children === TEXTO_DO_AVISO_DE_EXEMPLO);
    expect((StyleSheet.flatten(texto?.props.style) as { color?: string }).color).toBe(CORES_CLARO["cor-texto"]);
  });

  it("o layout de /exemplos/[id] põe a faixa acima da pilha, que não recua o topo de novo", () => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(SessaoDoApp, null, React.createElement(LayoutDoDossie))),
      );
    });
    expect(todos(arvore, (n) => n.props.testID === "redirecionou")).toHaveLength(0);
    const texto = todos(arvore, (n) => String(n.type) === "Text" && n.props.children === TEXTO_DO_AVISO_DE_EXEMPLO);
    expect(texto).toHaveLength(1);
    // A pilha vem depois da faixa na árvore.
    const json = JSON.stringify(arvore.toJSON());
    expect(json.indexOf(TEXTO_DO_AVISO_DE_EXEMPLO)).toBeGreaterThan(-1);
    expect(json.indexOf(TEXTO_DO_AVISO_DE_EXEMPLO)).toBeLessThan(json.indexOf("pilha"));
    // A faixa cobre os 47 pontos do relógio; a pilha enxerga topo 0.
    const faixa = todos(arvore, (n) => String(n.type) === "View" && StyleSheet.flatten(n.props.style)?.paddingTop === 47);
    expect(faixa.length).toBeGreaterThan(0);
    const pilha = todos(arvore, (n) => n.props.testID === "pilha")[0];
    expect(pilha?.props.accessibilityLabel).toBe("topo 0");
  });
});

// ——— K3: o que o coletor chama de verificação ————————————————————————————————————————

type ElementoFalso = { innerText?: string; textContent?: string; getAttribute?: (nome: string) => string | null };

type PaginaFalsa = {
  titulo: string;
  texto: string;
  /** Há iframe ou script com `challenges.cloudflare.com` no `src`. */
  comDesafioDaCloudflare?: boolean;
};

/** Roda o script injetado contra uma página falsa e devolve o que ele posta para o app. */
function rodarColetor(pagina: PaginaFalsa): { verificacao: boolean; titulo: string; texto: string }[] {
  const mensagens: string[] = [];
  const agendados: (() => void)[] = [];
  const documento = {
    title: pagina.titulo,
    body: { innerText: pagina.texto } as ElementoFalso,
    querySelector: (seletor: string) => (seletor === "main" ? null : null),
    getElementById: () => null,
    // A página falsa só responde ao seletor do desafio quando tem o desafio.
    querySelectorAll: (seletor: string): ElementoFalso[] =>
      seletor === SELETOR_DE_DESAFIO && pagina.comDesafioDaCloudflare ? [{}] : [],
  };
  const janela = {
    location: { href: "https://www.zapimoveis.com.br/imovel/123" },
    ReactNativeWebView: { postMessage: (m: string) => mensagens.push(m) },
  };
  const rodar = new Function("document", "window", "setTimeout", SCRIPT_COLETOR);
  rodar(documento, janela, (f: () => void) => agendados.push(f));
  agendados.forEach((f) => f());
  return mensagens.map((m) => JSON.parse(m));
}

describe("verificação do coletor (K3)", () => {
  const ANUNCIO = "Apartamento para alugar\nAluguel R$ 4.500 /mês\nVerifique a disponibilidade com o corretor.";

  it.each(["Just a moment...", "Um momento…", "Attention Required! | Cloudflare", "Verify you are human"])(
    "título de desafio: %s",
    (titulo) => {
      const mensagens = rodarColetor({ titulo, texto: "" });
      expect(mensagens.length).toBeGreaterThan(0);
      expect(mensagens.every((m) => m.verificacao)).toBe(true);
    },
  );

  it("iframe ou script de challenges.cloudflare.com é verificação, mesmo com título comum", () => {
    const mensagens = rodarColetor({ titulo: "Apartamento · ZAP Imóveis", texto: ANUNCIO, comDesafioDaCloudflare: true });
    expect(mensagens.every((m) => m.verificacao)).toBe(true);
  });

  it("'verifique' e 'captcha' no texto do anúncio não são verificação", () => {
    const mensagens = rodarColetor({
      titulo: "Apartamento · ZAP Imóveis",
      texto: `${ANUNCIO}\nProteção contra robôs: captcha ativo. Verifique os dados do imóvel.\nVerify you are human`,
    });
    expect(mensagens.length).toBeGreaterThan(0);
    expect(mensagens.every((m) => m.verificacao === false)).toBe(true);
  });

  it("'verifique' e 'captcha' no título também não", () => {
    expect(rodarColetor({ titulo: "Verifique a disponibilidade · Captcha", texto: ANUNCIO }).every((m) => !m.verificacao)).toBe(true);
  });

  it("o anúncio com a palavra 'verifique' chega inteiro, para o app ler", () => {
    const [mensagem] = rodarColetor({ titulo: "Apartamento · ZAP Imóveis", texto: ANUNCIO });
    expect(mensagem?.texto).toContain("R$ 4.500");
    expect(mensagem?.verificacao).toBe(false);
  });

  it("o padrão exportado é o que o script usa", () => {
    expect(SCRIPT_COLETOR).toContain(PADRAO_DE_TITULO_DE_VERIFICACAO.toString());
    expect(PADRAO_DE_TITULO_DE_VERIFICACAO.test("verifique")).toBe(false);
    expect(PADRAO_DE_TITULO_DE_VERIFICACAO.test("captcha")).toBe(false);
    expect(SCRIPT_COLETOR).not.toMatch(/verifique|captcha|cf-chl/i);
  });
});

// ——— K7: "Mapear chaves" só em desenvolvimento, só nomes de chave ————————————————————————————

describe('botão "Mapear chaves" do modo de inspeção (K7)', () => {
  const URL_QUINTOANDAR = "https://www.quintoandar.com.br/imovel/895799920/alugar/apartamento-2-quartos-espinheiro-recife";
  const COLETA_COM_ESTADO = JSON.stringify({
    url: URL_QUINTOANDAR,
    titulo: "Apartamento · QuintoAndar",
    ld: [],
    estados: [JSON.stringify(fixturesEstado.estado)],
    texto: "Apartamento para alugar",
    verificacao: false,
  });
  const VALORES_QUE_NAO_PODEM_SAIR = [
    "Conta de teste",
    "900000000",
    "Rua da Conta Logada",
    "Rua do Vizinho",
    "Rua Projetada C",
    "Espinheiro",
    "895799920",
    "2800",
    "3707",
  ];

  // Sem relógio falso, os prazos de 20 s e 120 s do leitor ficariam pendentes depois do teste.
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  function montarNoQuintoAndar() {
    return React.createElement(
      TemaDoApp,
      null,
      React.createElement(LeitorDePagina, {
        url: URL_QUINTOANDAR,
        portal: "quintoandar",
        idNoPortal: "895799920",
        aoLer: () => undefined,
        aoFalhar: () => undefined,
      }),
    );
  }
  const botao = (arvore: TestRenderer.ReactTestRenderer) =>
    arvore.root.findAll(
      (n) => typeof n.type !== "string" && n.props.accessibilityLabel === "Mapear chaves" && typeof n.props.onPress === "function",
    )[0];

  it("registra no console os nomes das chaves do anúncio e nenhum valor", () => {
    const registro = jest.spyOn(console, "info").mockImplementation(() => undefined);
    try {
      let arvore!: TestRenderer.ReactTestRenderer;
      act(() => {
        arvore = TestRenderer.create(montarNoQuintoAndar());
      });
      // Sem o toque, nada é registrado.
      act(() => webView().onMessage({ nativeEvent: { data: COLETA_COM_ESTADO } }));
      expect(registro).not.toHaveBeenCalled();

      act(() => botao(arvore)?.props.onPress());
      act(() => webView().onMessage({ nativeEvent: { data: COLETA_COM_ESTADO } }));
      expect(registro).toHaveBeenCalledTimes(1);
      const saida = JSON.stringify(registro.mock.calls);
      for (const nome of ["rentPrice", "condoPrice", "address", "address.neighborhood", "address.street", "listings[].imovelId"]) {
        expect(saida).toContain(`"${nome}"`);
      }
      for (const valor of VALORES_QUE_NAO_PODEM_SAIR) expect(saida).not.toContain(valor);
      for (const ramoAlheio of ["login", "houses", "lista", "phone", "areaCode"]) expect(saida).not.toContain(ramoAlheio);

      // Uma só vez por toque: a mensagem seguinte não registra de novo.
      act(() => webView().onMessage({ nativeEvent: { data: COLETA_COM_ESTADO } }));
      expect(registro).toHaveBeenCalledTimes(1);
      act(() => arvore.unmount());
    } finally {
      registro.mockRestore();
    }
  });

  it("estado que não é JSON ou sem o anúncio registra só um aviso, sem conteúdo", () => {
    const registro = jest.spyOn(console, "info").mockImplementation(() => undefined);
    try {
      let arvore!: TestRenderer.ReactTestRenderer;
      act(() => {
        arvore = TestRenderer.create(montarNoQuintoAndar());
      });
      act(() => botao(arvore)?.props.onPress());
      act(() =>
        webView().onMessage({
          nativeEvent: { data: JSON.stringify({ url: URL_QUINTOANDAR, titulo: "x", ld: [], estados: ["{quebrado", '{"a":{"id":"1"}}'], texto: "", verificacao: false }) },
        }),
      );
      const saida = registro.mock.calls.map((c) => c.join(" "));
      expect(saida).toHaveLength(2);
      expect(saida[0]).toContain("não é JSON");
      expect(saida[1]).toContain("objeto do anúncio não encontrado");
      act(() => arvore.unmount());
    } finally {
      registro.mockRestore();
    }
  });

  it("fora de __DEV__ o botão não existe", () => {
    const global = globalThis as { __DEV__?: boolean };
    const antes = global.__DEV__;
    try {
      global.__DEV__ = true;
      let arvore!: TestRenderer.ReactTestRenderer;
      act(() => {
        arvore = TestRenderer.create(montarNoQuintoAndar());
      });
      expect(botao(arvore)).toBeDefined();
      act(() => arvore.unmount());
      global.__DEV__ = false;
      act(() => {
        arvore = TestRenderer.create(montarNoQuintoAndar());
      });
      expect(botao(arvore)).toBeUndefined();
      expect(JSON.stringify(arvore.toJSON())).not.toContain("Mapear chaves");
      act(() => arvore.unmount());
    } finally {
      global.__DEV__ = antes;
    }
  });
});
