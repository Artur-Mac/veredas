import { describe, expect, it } from "@jest/globals";
import * as pluginDaColeta from "../plugins/compartilhar/coletaDaPagina";
import { SCRIPT_COLETOR } from "../src/componentes/leitor/coletor";
import { esquemaColetaDaPagina, lerPagina, type ColetaDaPagina } from "../src/dados/extrator/pagina";

// Reprodução da página de anúncio do ZAP em 21/10/2026 (Next.js com App Router): sem __NEXT_DATA__, o estado vem em
// pedaços em self.__next_f. O anunciante é inventado; o coletor tem de removê-lo.
const URL = "https://www.zapimoveis.com.br/imovel/aluguel-apartamento-1-quarto-mobiliado-gracas-recife-pe-32m2-id-2884141276/?source=ranking%2Crp";
const LISTING = JSON.stringify({
  id: "2884141276",
  prices: { rental: { iptu: 0, value: 3200, condominium: 0, multiple: false, period: "MONTHLY", values: [3200] }, sale: null },
  title: "Apartamento para alugar com 32 m², 1 quarto, 1 banheiro, 1 vaga",
  business: "RENTAL",
  address: {
    city: "Recife", state: "Pernambuco", stateAcronym: "PE", neighborhood: "Graças", isApproximateLocation: false,
    streetNumber: "153", street: "Rua Engenheiro Clóvis de Castro", coordinates: { latitude: -8.031083, longitude: -34.910606 },
  },
  amenities: { usableAreas: [32], bedrooms: [1], bathrooms: [1], suites: [1], parkingSpaces: [1], floors: [13], unitFloor: 1 },
  advertiser: { name: "Imobiliária Inventada", phoneNumbers: ["08130000000"], whatsAppNumber: "081900000000", license: "00000-F-PE" },
  description: "Valor para locação: R$ 3.200,00 \"taxas inclusas\" {chaves no texto}",
  unitType: "APARTMENT",
});
const PAYLOAD = `0:{"P":null}\n28:["$","$L29",null,{"baseData":{"pageData":{"videos":[],"account":{"listingsCount":68},"listing":${LISTING},"isPreview":false}}}]\n`;
// O Next manda o payload em pedaços; o corte pode cair no meio de um texto.
const PEDACOS = [[0], [1, PAYLOAD.slice(0, 300)], [1, PAYLOAD.slice(300, 700)], [1, PAYLOAD.slice(700)]];
const TEXTO =
  "Apartamento com 1 Quarto para alugar, 32m² - Graças\nRua Engenheiro Clóvis de Castro, 153 - Graças, Recife - PE\nValores\nAluguel\nR$ 3.200/mês\nCondomínio\nIsento\nIPTU\nIsento";

/**
 * `esvaziado`: como no celular depois de a página montar, o Next zera self.__next_f e os pedaços só existem nos
 * <script> inline que os empurraram.
 */
function pagina(esvaziado = false) {
  const scripts = PEDACOS.map((p) => ({ textContent: `self.__next_f.push(${JSON.stringify(p)})` }));
  const documento = {
    title: "Apartamentos para alugar em Graças - Recife, PE | ZAP Imóveis",
    body: { innerText: TEXTO, scrollHeight: 0 },
    querySelector: () => null,
    querySelectorAll: (seletor: string) => (seletor === "script" ? [{ textContent: "console.log(1)" }, ...scripts] : []),
    getElementById: () => null,
  };
  return { documento, janela: { location: { href: URL }, __next_f: esvaziado ? [] : PEDACOS } as Record<string, unknown> };
}

function coletaDaWebView(esvaziado = false): ColetaDaPagina {
  const { documento, janela } = pagina(esvaziado);
  const mensagens: string[] = [];
  janela.ReactNativeWebView = { postMessage: (m: string) => mensagens.push(m) };
  new Function("document", "window", "setTimeout", SCRIPT_COLETOR)(documento, janela, () => undefined);
  return JSON.parse(mensagens[0] ?? "null");
}

describe("ZAP com Next.js App Router (self.__next_f)", () => {
  it("a coleta traz o objeto do anúncio, sem o anunciante", () => {
    const coleta = coletaDaWebView();
    expect(esquemaColetaDaPagina.safeParse(coleta).success).toBe(true);
    expect(coleta.estados).toHaveLength(1);
    const estado = JSON.parse(coleta.estados[0] ?? "{}");
    expect(estado.listing.address.street).toBe("Rua Engenheiro Clóvis de Castro");
    expect(estado.listing.advertiser).toBeUndefined();
    expect(coleta.estados[0]).not.toMatch(/0813|0819|Inventada/);
  });

  it("a leitura acha rua, número, aluguel, área, quartos e andar", () => {
    const leituras = lerPagina(coletaDaWebView(), "zap", "2884141276", URL);
    const doEstado = leituras.find((l) => l.campos.logradouro !== null);
    expect(doEstado?.campos).toMatchObject({
      logradouro: "Rua Engenheiro Clóvis de Castro",
      numero: "153",
      preco: 3200,
      area: 32,
      quartos: 1,
      andar: 1,
      modalidade: "aluguel",
      bairro: "gracas",
    });
  });

  it("com self.__next_f já esvaziado pelo Next, o objeto sai dos <script> da página", () => {
    const leituras = lerPagina(coletaDaWebView(true), "zap", "2884141276", URL);
    expect(leituras.some((l) => l.campos.logradouro === "Rua Engenheiro Clóvis de Castro" && l.campos.numero === "153")).toBe(true);
  });

  it("só pelo texto: a rua da trilha (sem número) não esconde a da Localização (com número)", () => {
    const coleta = { ...coletaDaWebView(true), estados: [], texto: `Aluguel\nRua Engenheiro Clóvis de Castro\n${TEXTO}` };
    const doTexto = lerPagina(coleta, "zap", "2884141276", URL).find((l) => l.metodo === "texto");
    expect(doTexto?.campos).toMatchObject({ logradouro: "Rua Engenheiro Clóvis de Castro", numero: "153" });
  });

  it("o Safari (pré-processamento) devolve a mesma coleta da WebView", () => {
    const { documento, janela } = pagina();
    const doSafari = pluginDaColeta.coletarPagina(documento, janela, pluginDaColeta.PADRAO_DE_TITULO_DE_VERIFICACAO, pluginDaColeta.SELETOR_DE_DESAFIO);
    expect(doSafari).toEqual(coletaDaWebView());
  });
});
