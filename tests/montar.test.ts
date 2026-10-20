import { describe, expect, it } from "@jest/globals";
import { camposVazios, type CamposExtraidos, type LeituraParcial, type Periodo } from "../src/dados/contratos";
import { montarExtracao } from "../src/dados/extrator/montar";

const AGORA = new Date("2026-10-20T12:00:00.000Z");

function leitura(metodo: LeituraParcial["metodo"], campos: Partial<CamposExtraidos>): LeituraParcial {
  return { metodo, portal: "zap", idNoPortal: null, campos: { ...camposVazios(), ...campos } };
}

const iptu = (valor: number, periodo: Periodo) => ({ valor, periodo });

describe("anomalia incoerente do IPTU (K9)", () => {
  it.each<[string, Periodo, string]>([
    ["mensal", "mes", "R$ 288/mês"],
    ["anual", "ano", "R$ 288/ano"],
    ["sem periodicidade", "desconhecido", "R$ 288"],
  ])("grava o valor lido como texto, não como objeto: IPTU %s", (_nome, periodo, esperado) => {
    const ext = montarExtracao(
      "",
      [leitura("json_ld", { preco: 4500, iptu: iptu(3456, "ano") }), leitura("texto", { preco: 4500, iptu: iptu(288, periodo) })],
      AGORA,
    );
    const anomalia = ext.anomalias.find((a) => a.campo === "iptu" && a.tipo === "incoerente");
    expect(anomalia?.valorLido).toBe(esperado);
    expect(JSON.stringify(ext)).not.toContain("[object Object]");
  });

  it("o texto lido é o do último valor (texto vale mais que JSON-LD e link)", () => {
    const ext = montarExtracao(
      "",
      [
        leitura("url", { iptu: iptu(100, "mes") }),
        leitura("json_ld", { iptu: iptu(200, "mes") }),
        leitura("texto", { preco: 4500, iptu: iptu(300, "ano") }),
      ],
      AGORA,
    );
    expect(ext.campos.iptu).toEqual(iptu(300, "ano"));
    expect(ext.anomalias.filter((a) => a.campo === "iptu" && a.tipo === "incoerente")).toEqual([
      expect.objectContaining({ valorLido: "R$ 300/ano" }),
    ]);
  });

  it("mesmo valor com período diferente também é incoerente", () => {
    const ext = montarExtracao(
      "",
      [leitura("json_ld", { preco: 4500, iptu: iptu(288, "mes") }), leitura("texto", { preco: 4500, iptu: iptu(288, "ano") })],
      AGORA,
    );
    expect(ext.anomalias.find((a) => a.campo === "iptu" && a.tipo === "incoerente")?.valorLido).toBe("R$ 288/ano");
  });

  it("leituras que concordam não geram incoerência", () => {
    const ext = montarExtracao(
      "",
      [leitura("json_ld", { preco: 4500, iptu: iptu(288, "mes") }), leitura("texto", { preco: 4500, iptu: iptu(288, "mes") })],
      AGORA,
    );
    expect(ext.anomalias.some((a) => a.tipo === "incoerente")).toBe(false);
  });

  it("os demais campos continuam gravando o próprio valor", () => {
    const ext = montarExtracao(
      "",
      [leitura("url", { area: 60, quartos: 2, logradouro: "Rua A" }), leitura("texto", { preco: 4500, area: 85, quartos: 3, logradouro: "Rua B" })],
      AGORA,
    );
    const lido = (campo: string) => ext.anomalias.find((a) => a.campo === campo && a.tipo === "incoerente")?.valorLido;
    expect(lido("area")).toBe("85");
    expect(lido("quartos")).toBe("3");
    expect(lido("logradouro")).toBe("Rua B");
  });

  it("texto muito longo não derruba a extração (valorLido cabe em 80 caracteres)", () => {
    const longo = "Rua ".concat("A".repeat(150));
    const ext = montarExtracao(
      "",
      [leitura("url", { logradouro: "Rua Curta" }), leitura("texto", { preco: 4500, logradouro: longo })],
      AGORA,
    );
    const anomalia = ext.anomalias.find((a) => a.campo === "logradouro" && a.tipo === "incoerente");
    expect(anomalia?.valorLido?.length).toBeLessThanOrEqual(80);
  });
});
