import { describe, expect, it } from "@jest/globals";
import { extrairDaUrl } from "../src/dados/extrator/url";
import { extrairDoTexto } from "../src/dados/extrator/texto";
import { montarExtracao } from "../src/dados/extrator/montar";
import fixturesTexto from "./fixtures/anuncios-texto.json";

describe("Extrator Camadas B e C (Texto e JSON-LD)", () => {
  describe("Casos de fixtures de texto", () => {
    it.each(fixturesTexto.casos)("Processa $id", (caso: any) => {
      const leiturasTexto = extrairDoTexto(caso.entrada, caso.portal as any);
      const leituras = [...leiturasTexto];

      if (caso.url) {
        const leituraUrl = extrairDaUrl(caso.url);
        if (!("erro" in leituraUrl)) {
          leituras.unshift(leituraUrl);
        }
      }

      const agora = new Date("2026-10-19T21:00:00Z");
      const extracao = montarExtracao(caso.url, leituras, agora);
      const esperado = caso.esperado;

      if (esperado.campos) {
        for (const [chave, val] of Object.entries(esperado.campos)) {
          expect((extracao.campos as any)[chave]).toEqual(val);
        }
      }

      if (esperado.anomalias) {
        for (const anomalia of esperado.anomalias) {
          const achou = extracao.anomalias.some(
            (a) => a.campo === anomalia.campo && a.tipo === anomalia.tipo,
          );
          expect(achou).toBe(true);
        }
      }

      if (esperado.semAnomalia) {
        for (const campo of esperado.semAnomalia) {
          const tem = extracao.anomalias.some((a) => a.campo === campo);
          expect(tem).toBe(false);
        }
      }

      if (esperado.metodos) {
        expect(extracao.metodos).toEqual(esperado.metodos);
      }

      if (esperado.origemDosCampos) {
        for (const [campo, origem] of Object.entries(esperado.origemDosCampos)) {
          expect((extracao.origemDosCampos as Record<string, string | undefined>)[campo]).toBe(origem);
        }
      }

      if ((esperado as any).lacunasContem) {
        for (const lacuna of (esperado as any).lacunasContem) {
          expect(extracao.lacunas).toContain(lacuna);
        }
      }
    });
  });

  describe("Teste extra de valor simbólico zero", () => {
    it("Texto com 'Condomínio R$ 0' produz condominio: null com anomalia valor_simbolico", () => {
      const texto = "Apartamento para alugar\nAluguel R$ 3.000\nCondomínio R$ 0\n60 m²\nBoa Viagem, Recife";
      const leituras = extrairDoTexto(texto, "zap");
      const extracao = montarExtracao("", leituras, new Date("2026-10-19T21:00:00Z"));

      expect(extracao.campos.condominio).toBeNull();
      const anomalia = extracao.anomalias.find((a) => a.campo === "condominio");
      expect(anomalia).toBeDefined();
      expect(anomalia?.tipo).toBe("valor_simbolico");
    });
  });
});
