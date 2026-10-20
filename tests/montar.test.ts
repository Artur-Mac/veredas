import { describe, expect, it } from "@jest/globals";
import { camposVazios, type CamposExtraidos, type LeituraParcial, type Periodo } from "../src/dados/contratos";
import { montarExtracao } from "../src/dados/extrator/montar";
import { extrairDoTexto } from "../src/dados/extrator/texto";

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

describe("mensagem da anomalia incoerente (L1): rótulo da pessoa, nunca o nome interno do campo", () => {
  const mensagemDe = (campo: string, url: Partial<CamposExtraidos>, texto: Partial<CamposExtraidos>) =>
    montarExtracao("", [leitura("url", url), leitura("texto", { preco: 4500, ...texto })], AGORA).anomalias.find(
      (a) => a.campo === campo && a.tipo === "incoerente",
    )?.mensagem;

  it("área: 'A área difere entre o link e o texto do anúncio.'", () => {
    expect(mensagemDe("area", { area: 60 }, { area: 85 })).toBe("A área difere entre o link e o texto do anúncio.");
  });

  it("seguro incêndio: 'O seguro incêndio difere entre o link e o texto do anúncio.'", () => {
    expect(mensagemDe("seguroIncendio", { seguroIncendio: 30 }, { seguroIncendio: 45 })).toBe(
      "O seguro incêndio difere entre o link e o texto do anúncio.",
    );
  });

  it("taxa de serviço: 'A taxa de serviço difere entre o link e o texto do anúncio.'", () => {
    expect(mensagemDe("taxaServico", { taxaServico: 50 }, { taxaServico: 80 })).toBe(
      "A taxa de serviço difere entre o link e o texto do anúncio.",
    );
  });

  it("os campos que o arquiteto ainda não rotulou também saem com nome de gente", () => {
    expect(mensagemDe("anoConstrucao", { anoConstrucao: 1998 }, { anoConstrucao: 2004 })).toBe(
      "O ano de construção difere entre o link e o texto do anúncio.",
    );
    expect(mensagemDe("tipologia", { tipologia: "apartamento" }, { tipologia: "casa" })).toBe(
      "O tipo de imóvel difere entre o link e o texto do anúncio.",
    );
    expect(mensagemDe("cidade", { cidade: "recife" }, { cidade: "olinda" })).toBe(
      "A cidade difere entre o link e o texto do anúncio.",
    );
  });

  it("sigla fica em maiúsculas e o verbo concorda no plural: 'O IPTU difere', 'Os quartos diferem'", () => {
    expect(mensagemDe("iptu", { iptu: iptu(100, "mes") }, { iptu: iptu(200, "mes") })).toBe(
      "O IPTU difere entre o link e o texto do anúncio.",
    );
    expect(mensagemDe("quartos", { quartos: 2 }, { quartos: 3 })).toBe("Os quartos diferem entre o link e o texto do anúncio.");
  });

  it("dois valores só do texto (JSON-LD e texto) não falam em link", () => {
    const ext = montarExtracao(
      "",
      [leitura("json_ld", { preco: 4500, area: 60 }), leitura("texto", { preco: 4500, area: 85 })],
      AGORA,
    );
    expect(ext.anomalias.find((a) => a.campo === "area" && a.tipo === "incoerente")?.mensagem).toBe(
      "A área difere entre duas leituras do texto do anúncio.",
    );
  });

  it("nenhuma mensagem de incoerência traz o nome interno de um campo (camelCase) nem 'valor de'", () => {
    const ext = montarExtracao(
      "",
      [
        leitura("url", {
          modalidade: "aluguel", tipologia: "apartamento", bairro: "casa-forte", cidade: "recife", logradouro: "Rua A", numero: "10",
          nomeEdificio: "Edifício A", area: 60, quartos: 2, suites: 1, banheiros: 1, vagas: 1, andar: 3, anoConstrucao: 1998,
          preco: 4000, condominio: 800, iptu: iptu(100, "mes"), seguroIncendio: 30, taxaServico: 50, totalInformado: 5000,
        }),
        leitura("texto", {
          modalidade: "compra", tipologia: "casa", bairro: "graças", cidade: "olinda", logradouro: "Rua B", numero: "20",
          nomeEdificio: "Edifício B", area: 85, quartos: 3, suites: 2, banheiros: 2, vagas: 2, andar: 4, anoConstrucao: 2004,
          preco: 4500, condominio: 900, iptu: iptu(200, "mes"), seguroIncendio: 45, taxaServico: 80, totalInformado: 6000,
        }),
      ],
      AGORA,
    );
    const incoerentes = ext.anomalias.filter((a) => a.tipo === "incoerente");
    expect(incoerentes).toHaveLength(20);
    for (const a of incoerentes) {
      expect(a.mensagem).toMatch(/^(O|A|Os|As) .+ (difere|diferem) entre o link e o texto do anúncio\.$/);
      expect(a.mensagem).not.toMatch(/[a-z][A-Z]/);
      expect(a.mensagem).not.toContain("valor de");
      expect(a.mensagem.length).toBeLessThanOrEqual(200);
    }
  });
});

describe("mensagem de valor não informado", () => {
  it("usa o rótulo do campo, nunca o nome interno", () => {
    const e = montarExtracao("", extrairDoTexto("Aluguel R$ 2.000\nCondomínio: Não informado\nSeguro incêndio: Consulte", "zap"), AGORA);
    const mensagens = e.anomalias.filter((a) => a.tipo === "nao_informado").map((a) => a.mensagem);
    expect(mensagens).toContain('Condomínio: o anúncio diz "Não informado".');
    for (const m of mensagens) expect(m).not.toMatch(/seguroIncendio|condominio/);
  });
});
