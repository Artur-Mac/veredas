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
