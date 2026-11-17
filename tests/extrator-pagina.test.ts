import { describe, expect, it } from "@jest/globals";
import { coletaEhDoAnuncio, lerPagina, type ColetaDaPagina } from "../src/dados/extrator/pagina";
import { montarExtracao } from "../src/dados/extrator/montar";
import fixturesEstado from "./fixtures/estado-pagina.json";

describe("Leitura da Página (Camadas A, B, C e Estado)", () => {
  const estadoStr = JSON.stringify(fixturesEstado.estado);

  it("coleta com estado do anúncio e texto com 'Imóveis semelhantes' preserva o preço do estado", () => {
    const coleta: ColetaDaPagina = {
      url: "https://www.quintoandar.com.br/imovel/895799920/alugar/apartamento-2-quartos-espinheiro-recife",
      titulo: "Apartamento para alugar no Espinheiro",
      ld: [],
      estados: [estadoStr],
      texto: "Apartamento no Espinheiro\nImóveis semelhantes · Aluguel R$ 9.999\nCondomínio R$ 2.000",
      verificacao: false,
    };

    const leituras = lerPagina(coleta, "quintoandar", "895799920");
    expect(leituras.length).toBeGreaterThan(0);

    const agora = new Date("2026-10-19T21:00:00.000Z");
    const extracao = montarExtracao(coleta.url, leituras, agora);

    // O preço e condomínio devem vir do estado (2800 e 650), não dos semelhantes no texto (9999 e 2000)
    expect(extracao.campos.preco).toBe(2800);
    expect(extracao.campos.condominio).toBe(650);
  });

  it("coleta fora do esquema é ignorada (devolve array vazio)", () => {
    const coletaInvalida = {
      url: "https://www.quintoandar.com.br/imovel/123",
      titulo: "a".repeat(400), // > 300 caracteres, viola esquema
      ld: [],
      estados: [],
      texto: "Texto qualquer",
      verificacao: false,
    };

    const leituras = lerPagina(coletaInvalida as any, "quintoandar", "123");
    expect(leituras).toEqual([]);
  });

  it("coleta só com texto realiza leitura de texto completa", () => {
    const coleta: ColetaDaPagina = {
      url: "https://www.zapimoveis.com.br/imovel/123",
      titulo: "Apartamento em Casa Forte",
      ld: [],
      estados: [],
      texto: "Apartamento à venda em Casa Forte, Recife\nPreço R$ 750.000\nCondomínio R$ 900\nIPTU anual R$ 3.000\n120 m² · 3 quartos",
      verificacao: false,
    };

    const leituras = lerPagina(coleta, "zap", "123");
    expect(leituras.length).toBe(1);
    expect(leituras[0]?.metodo).toBe("texto");
    expect(leituras[0]?.campos.preco).toBe(750000);
    expect(leituras[0]?.campos.condominio).toBe(900);
    expect(leituras[0]?.campos.iptu?.valor).toBe(3000);
    expect(leituras[0]?.campos.iptu?.periodo).toBe("ano");
    expect(leituras[0]?.campos.area).toBe(120);
    expect(leituras[0]?.campos.quartos).toBe(3);
  });
});

// ——— P5: o portal redireciona para lista, busca ou outro lugar ——————————————————————————————————————————————

describe("Leitura da Página quando o portal abre outra página (P5)", () => {
  const ESTADO = JSON.stringify(fixturesEstado.estado);
  const ID_QA = "895799920";
  const URL_QA = `https://www.quintoandar.com.br/imovel/${ID_QA}/alugar/apartamento-2-quartos-espinheiro-recife`;
  // JSON-LD e texto de OUTROS anúncios (os da lista): nenhum valor pode chegar à leitura.
  const LD_DA_LISTA = JSON.stringify({ "@type": "Apartment", offers: { price: "7777" }, floorSize: { value: 222 }, numberOfRooms: 4 });
  const TEXTO_DA_LISTA = "Apartamentos para alugar em Recife\nAluguel R$ 8.888\nCondomínio R$ 1.234\n150 m² · 4 quartos";

  function coleta(url: string, mudancas: Partial<ColetaDaPagina> = {}): ColetaDaPagina {
    return { url, titulo: "Portal", ld: [LD_DA_LISTA], estados: [], texto: TEXTO_DA_LISTA, verificacao: false, ...mudancas };
  }

  it("controle: na página do anúncio, o JSON-LD e o texto são lidos", () => {
    const leituras = lerPagina(coleta(URL_QA), "quintoandar", ID_QA, URL_QA);
    expect(leituras.map((l) => l.metodo).sort()).toEqual(["json_ld", "texto"]);
  });

  it.each([
    ["lista do mesmo portal", "https://www.quintoandar.com.br/alugar/imovel/recife-pe-brasil"],
    ["início do portal", "https://www.quintoandar.com.br/"],
    ["busca", "https://www.quintoandar.com.br/busca?q=recife"],
    ["outro anúncio", "https://www.quintoandar.com.br/imovel/895799999/alugar/apartamento-3-quartos-boa-viagem-recife"],
    ["login com retorno ao anúncio na query", `https://www.quintoandar.com.br/login?voltar=/imovel/${ID_QA}`],
    ["outro site", `https://www.example.com/imovel/${ID_QA}`],
    ["domínio parecido", `https://quintoandar.com.br.evil.com/imovel/${ID_QA}`],
  ])("%s: descarta JSON-LD e texto", (_nome, url) => {
    expect(lerPagina(coleta(url), "quintoandar", ID_QA, URL_QA)).toEqual([]);
    // Sem a URL pedida (três argumentos), a decisão é a mesma.
    expect(lerPagina(coleta(url), "quintoandar", ID_QA)).toEqual([]);
  });

  it("em outra página, o estado só vale pelo objeto com o id do anúncio", () => {
    const lista = "https://www.quintoandar.com.br/alugar/imovel/recife-pe-brasil";
    const leituras = lerPagina(coleta(lista, { estados: [ESTADO] }), "quintoandar", ID_QA, URL_QA);
    expect(leituras).toHaveLength(1);
    expect(leituras[0]?.campos.preco).toBe(2800);
    expect(leituras[0]?.campos.condominio).toBe(650);
    // Nada do JSON-LD (7777, 222 m²) nem do texto (8888, 1234) da lista.
    expect(JSON.stringify(leituras)).not.toMatch(/7777|8888|1234|222/);
    // O ramo `houses` da fixture (outro anúncio, aluguel 9999) e o `login` também não entram.
    expect(JSON.stringify(leituras)).not.toMatch(/9999|Conta de teste|Rua do Vizinho/);
  });

  it("em outra página, estado sem o objeto com o id do anúncio não rende nada", () => {
    const lista = "https://www.quintoandar.com.br/alugar/imovel/recife-pe-brasil";
    expect(lerPagina(coleta(lista, { estados: [ESTADO] }), "quintoandar", "111111111", URL_QA)).toEqual([]);
    expect(lerPagina(coleta(lista, { estados: [ESTADO] }), "quintoandar", null)).toEqual([]);
  });

  it("o anúncio sem id conhecido ainda é lido; a lista, a busca e o início não", () => {
    const zap = "https://www.zapimoveis.com.br/imovel/aluguel-apartamento-3-quartos-casa-forte-recife-pe";
    expect(lerPagina(coleta(zap), "zap", null).map((l) => l.metodo).sort()).toEqual(["json_ld", "texto"]);
    for (const url of [
      "https://www.zapimoveis.com.br/venda/apartamentos/pe+recife+casa-forte/",
      "https://www.zapimoveis.com.br/aluguel/",
      "https://www.zapimoveis.com.br/",
      "https://www.zapimoveis.com.br/busca?q=casa+forte",
    ]) {
      expect(lerPagina(coleta(url), "zap", null)).toEqual([]);
    }
  });

  it("portal outro: o host do link colado vale; outro host não", () => {
    const pedida = "https://www.imobiliaria.example.com.br/imoveis/ap-casa-forte-55";
    expect(lerPagina(coleta(pedida), "outro", null, pedida).map((l) => l.metodo).sort()).toEqual(["json_ld", "texto"]);
    expect(lerPagina(coleta("https://m.imobiliaria.example.com.br/imoveis/ap-casa-forte-55"), "outro", null, pedida)).toHaveLength(2);
    expect(lerPagina(coleta("https://www.google.com/search?q=ap"), "outro", null, pedida)).toEqual([]);
  });

  it("a coleta fora do esquema continua devolvendo vazio", () => {
    expect(lerPagina({ ...coleta(URL_QA), titulo: "a".repeat(400) }, "quintoandar", ID_QA, URL_QA)).toEqual([]);
  });
});

describe("coletaEhDoAnuncio (P5)", () => {
  const ehDe = (url: string, portal: Parameters<typeof coletaEhDoAnuncio>[1], id: string | null, pedida?: string) =>
    coletaEhDoAnuncio({ url }, portal, id, pedida);

  it("aceita o anúncio pedido, com subdomínio, www, barra final, query e fragmento", () => {
    expect(ehDe("https://www.zapimoveis.com.br/imovel/123", "zap", "123")).toBe(true);
    expect(ehDe("https://m.zapimoveis.com.br/imovel/venda-apartamento-casa-forte-id-123/?utm=a#fotos", "zap", "123")).toBe(true);
    expect(ehDe("https://zapimoveis.com.br/imovel/123/", "zap", "123")).toBe(true);
    expect(ehDe("http://www.vivareal.com.br/imovel/apartamento-3-quartos-rs900000-id-2812345678", "vivareal", "2812345678")).toBe(true);
    expect(ehDe("https://pe.olx.com.br/grande-recife/imoveis/apartamento-2-quartos-1234567890", "olx", "1234567890")).toBe(true);
  });

  it("recusa host diferente do portal, inclusive o que só termina parecido", () => {
    expect(ehDe("https://www.google.com/imovel/123", "zap", "123")).toBe(false);
    expect(ehDe("https://notzapimoveis.com.br/imovel/123", "zap", "123")).toBe(false);
    expect(ehDe("https://zapimoveis.com.br.evil.com/imovel/123", "zap", "123")).toBe(false);
  });

  it("recusa quando o caminho não traz o id, e o id não vale dentro de outro número", () => {
    expect(ehDe("https://www.zapimoveis.com.br/imovel/456", "zap", "123")).toBe(false);
    expect(ehDe("https://www.zapimoveis.com.br/imovel/1234", "zap", "123")).toBe(false);
    expect(ehDe("https://www.zapimoveis.com.br/imovel/9123", "zap", "123")).toBe(false);
    expect(ehDe("https://www.zapimoveis.com.br/imovel/x-id-123-y", "zap", "123")).toBe(true);
    expect(ehDe("https://www.zapimoveis.com.br/imovel/456?id=123", "zap", "123")).toBe(false);
  });

  it("recusa lista, busca e início quando o id é desconhecido", () => {
    expect(ehDe("https://www.vivareal.com.br/venda/pernambuco/recife/", "vivareal", null)).toBe(false);
    expect(ehDe("https://www.vivareal.com.br/aluguel/pernambuco/recife/casa-forte/apartamento_residencial/", "vivareal", null)).toBe(false);
    expect(ehDe("https://www.vivareal.com.br/", "vivareal", null)).toBe(false);
    expect(ehDe("https://pe.olx.com.br/busca/recife", "olx", null)).toBe(false);
    expect(ehDe("https://www.quintoandar.com.br/comprar/imovel/recife-pe-brasil", "quintoandar", null)).toBe(false);
  });

  it("caminho igual ao do link pedido é sempre a página pedida", () => {
    const pedida = "https://www.zapimoveis.com.br/venda/apartamentos/pe+recife/";
    expect(ehDe(`${pedida}?pagina=2`, "zap", null, pedida)).toBe(true);
    expect(ehDe("https://www.zapimoveis.com.br/aluguel/apartamentos/pe+recife/", "zap", null, pedida)).toBe(false);
  });

  it("URL ilegível ou que não é http(s) não é o anúncio", () => {
    expect(ehDe("", "zap", null)).toBe(false);
    expect(ehDe("about:blank", "zap", null)).toBe(false);
    expect(ehDe("javascript:alert(1)", "zap", "123")).toBe(false);
    expect(ehDe("/imovel/123", "zap", "123")).toBe(false);
  });

  it("portal outro sem link pedido não confere host, só o caminho", () => {
    expect(ehDe("https://qualquer.example.com/imoveis/ap-55", "outro", null)).toBe(true);
    expect(ehDe("https://qualquer.example.com/", "outro", null)).toBe(false);
  });
});
