import { describe, expect, it } from "@jest/globals";
import { semDadosPessoais } from "../src/dados/extrator/privacidade";
import { extrairDoTexto } from "../src/dados/extrator/texto";

describe("o texto lido perde o contato de quem anuncia", () => {
  it.each([
    "(81) 99999-9999",
    "(81)99999-9999",
    "81 98765-4321",
    "81 3333-4444",
    "+55 81 99876 5432",
    "+55 (81) 3222-1100",
    "99999-9999",
    "9 8765-4321",
    "corretor@imobiliaria.com.br",
    "123.456.789-09",
    "12.345.678/0001-90",
  ])("%s sai", (dado) => {
    expect(semDadosPessoais(`Fale com a gente: ${dado} ou visite.`)).not.toContain(dado);
  });

  it("CRECI fica como palavra, sem o número", () => {
    for (const creci of ["CRECI 12345-J", "CRECI/PE: 1.234", "Creci nº 9876", "CRECI-PE 54321"]) {
      const limpo = semDadosPessoais(`Corretor responsável ${creci}.`);
      expect(limpo).toMatch(/creci/i);
      expect(limpo).not.toMatch(/\d/);
    }
  });

  it("preço, área, CEP, ano e andar ficam como estão", () => {
    const anuncio = [
      "Aluguel R$ 4.500 /mês",
      "Venda R$ 1.250.000",
      "Condomínio R$ 1.190",
      "IPTU R$ 3.456 por ano (2026)",
      "125 m² · 3 quartos · 8º andar",
      "CEP 52050-000",
      "Construído entre 2015 e 2016",
    ].join("\n");
    expect(semDadosPessoais(anuncio)).toBe(anuncio);
  });

  it("as quebras de linha continuam: um número não gruda no da linha seguinte", () => {
    expect(semDadosPessoais("Andar\n81\n9999 1234")).toBe("Andar\n81\n9999 1234");
  });

  it("a leitura do texto não muda por causa do contato, e o contato não chega a nenhum campo", () => {
    const texto = [
      "Apartamento para alugar em Boa Viagem",
      "Aluguel R$ 4.500 /mês",
      "Condomínio R$ 1.190",
      "IPTU R$ 288",
      "125 m²",
      "3 quartos",
      "Fale com Maria pelo WhatsApp (81) 99999-9999 ou maria@exemplo.com · CRECI 12345-J",
    ].join("\n");
    const leituras = extrairDoTexto(texto, "zap");
    const campos = leituras.map((l) => l.campos);
    expect(campos.some((c) => c.preco === 4500)).toBe(true);
    expect(campos.some((c) => c.condominio === 1190)).toBe(true);
    expect(campos.some((c) => c.area === 125)).toBe(true);
    const tudo = JSON.stringify(leituras);
    expect(tudo).not.toContain("99999");
    expect(tudo).not.toContain("maria@");
    expect(tudo).not.toContain("12345");
  });
});
