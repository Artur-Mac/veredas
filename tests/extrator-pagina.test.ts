import { describe, expect, it } from "@jest/globals";
import { lerPagina, type ColetaDaPagina } from "../src/dados/extrator/pagina";
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
