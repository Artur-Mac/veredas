import { describe, expect, it } from "@jest/globals";
import { extrairDaUrl } from "../src/dados/extrator/url";
import { montarExtracao } from "../src/dados/extrator/montar";
import fixturesUrl from "./fixtures/anuncios-url.json";

describe("Extrator Camada A (URL)", () => {
  describe("Casos válidos de fixtures", () => {
    it.each(fixturesUrl.casos)("Processa $id", (caso: any) => {
      const res = extrairDaUrl(caso.entrada);
      expect("erro" in res).toBe(false);
      if ("erro" in res) return;

      const esperado = caso.esperado;
      if (esperado.portal) {
        expect(res.portal).toBe(esperado.portal);
      }
      if (esperado.idNoPortal !== undefined) {
        expect(res.idNoPortal).toBe(esperado.idNoPortal);
      }
      if (esperado.campos) {
        for (const [chave, val] of Object.entries(esperado.campos)) {
          expect((res.campos as any)[chave]).toEqual(val);
        }
      }
      if (esperado.cobertura) {
        const extracao = montarExtracao(caso.entrada, [res], new Date("2026-10-19T21:00:00Z"));
        expect(extracao.cobertura).toBe(esperado.cobertura);
      }
    });
  });

  describe("URLs inválidas", () => {
    it.each(fixturesUrl.invalidas)("Rejeita %s", (urlInvalida: string) => {
      const res = extrairDaUrl(urlInvalida);
      expect(res).toEqual({ erro: "url_invalida" });
    });
  });
});

describe("anúncio que não é moradia", () => {
  it("loja, sala ou ponto comercial vira tipologia 'outro'; apartamento continua apartamento", () => {
    const loja = extrairDaUrl(
      "https://www.zapimoveis.com.br/imovel/aluguel-loja-salao-3-quartos-com-varanda-espinheiro-recife-pe-70m2-id-2917916680/?source=ranking%2Crp",
    );
    expect("erro" in loja ? null : loja.campos).toMatchObject({ tipologia: "outro", bairro: "espinheiro", area: 70 });
    const sala = extrairDaUrl("https://www.zapimoveis.com.br/imovel/venda-sala-comercial-gracas-recife-pe-40m2-id-123/");
    expect("erro" in sala ? null : sala.campos.tipologia).toBe("outro");
    const ap = extrairDaUrl("https://www.zapimoveis.com.br/imovel/aluguel-apartamento-2-quartos-com-sala-gracas-recife-pe-60m2-id-124/");
    expect("erro" in ap ? null : ap.campos.tipologia).toBe("apartamento");
  });
});
