import { describe, expect, it } from "@jest/globals";
import type { Analise } from "../src/dados/analise";
import { esquemaAnaliseV2 } from "../src/dados/contratos";
import { migrarAnaliseV1 } from "../src/dados/migracao";

describe("Migração de análises v1 para v2", () => {
  const base: Analise = {
    id: "imovel-1",
    nome: "Apartamento A",
    bairro: "Boa Viagem",
    url: "https://www.zapimoveis.com.br/imovel/123",
    tipo: "aluguel",
    preco: 2500,
    condominio: 500,
    iptuAnual: 1200,
    outros: null,
    area: 60,
    quartos: 2,
    logradouro: "Rua dos Navegantes",
    notas: "Excelente estado",
    verificadas: ["agua"],
    atualizadoEm: "2026-10-19T10:00:00.000Z",
  };

  it("migra análise v1 base e valida com esquemaAnaliseV2", () => {
    const agora = new Date("2026-10-19T21:00:00.000Z");
    const v2 = migrarAnaliseV1(base, agora);

    expect(v2.versao).toBe(2);
    expect(v2.id).toBe("imovel-1");
    expect(v2.modalidade).toBe("aluguel");
    expect(v2.bairro).toBe("boa-viagem");
    expect(v2.declarados.preco.valor).toBe(2500);
    expect(v2.declarados.condominio.valor).toBe(500);
    expect(v2.declarados.iptu.valor).toBe(1200);
    expect(v2.declarados.iptu.periodo).toBe("ano");
    expect(v2.declarados.quartos.valor).toBe(2);
    expect(v2.declarados.preco.origem).toBe("voce");
    expect(v2.vinculo.estado).toBe("pendente");
    expect(v2.visita.verificadas).toEqual(["agua"]);
    expect(v2.visita.notas).toBe("Excelente estado");
    expect(v2.salva).toBe(true);

    expect(esquemaAnaliseV2.safeParse(v2).success).toBe(true);
  });

  it("migra bairro fora de cobertura com estado fora_de_cobertura", () => {
    const agora = new Date("2026-10-19T21:00:00.000Z");
    const v2 = migrarAnaliseV1({ ...base, bairro: "Cabanga" }, agora);

    expect(v2.bairro).toBe("cabanga");
    expect(v2.vinculo.estado).toBe("fora_de_cobertura");
    expect(esquemaAnaliseV2.safeParse(v2).success).toBe(true);
  });

  it("o texto 'Recife' é a cidade: não vira o bairro 'recife' (só os aliases e o nome de exibição de bairros.ts)", () => {
    const agora = new Date("2026-10-19T21:00:00.000Z");
    for (const texto of ["Recife", "recife", "  RECIFE  "]) {
      const v2 = migrarAnaliseV1({ ...base, bairro: texto }, agora);
      expect([texto, v2.bairro]).toEqual([texto, null]);
      expect(v2.bairroTexto).toBe(texto);
      expect(v2.vinculo.estado).toBe("fora_de_cobertura");
      expect(esquemaAnaliseV2.safeParse(v2).success).toBe(true);
    }
    // O bairro do centro antigo continua casando pelo que bairros.ts diz: nome de exibição e aliases.
    for (const texto of ["Recife (bairro)", "Recife Antigo", "recife-antigo", "bairro-do-recife"]) {
      const v2 = migrarAnaliseV1({ ...base, bairro: texto }, agora);
      expect([texto, v2.bairro]).toEqual([texto, "recife"]);
      expect(v2.vinculo.estado).toBe("pendente");
    }
  });

  it("os demais bairros seguem casando por nome, slug e alias, com ou sem acento e caixa", () => {
    const agora = new Date("2026-10-19T21:00:00.000Z");
    const esperado: [string, string, string][] = [
      ["Boa Viagem", "boa-viagem", "pendente"],
      ["boa-viagem", "boa-viagem", "pendente"],
      ["BOA VIAGEM", "boa-viagem", "pendente"],
      ["Graças", "gracas", "pendente"],
      ["gracas", "gracas", "pendente"],
      ["Casa Forte", "casa-forte", "pendente"],
      ["Poço da Panela", "poco", "pendente"],
      ["poco-da-panela", "poco", "pendente"],
      ["Cabanga", "cabanga", "fora_de_cobertura"],
    ];
    for (const [texto, slug, estado] of esperado) {
      const v2 = migrarAnaliseV1({ ...base, bairro: texto }, agora);
      expect([texto, v2.bairro, v2.vinculo.estado]).toEqual([texto, slug, estado]);
    }
  });

  it("bairro que não é do Recife fica sem slug e fora de cobertura", () => {
    const agora = new Date("2026-10-19T21:00:00.000Z");
    const v2 = migrarAnaliseV1({ ...base, bairro: "Piedade" }, agora);
    expect(v2.bairro).toBeNull();
    expect(v2.bairroTexto).toBe("Piedade");
    expect(v2.vinculo.estado).toBe("fora_de_cobertura");
  });

  it("aceita data simples 'AAAA-MM-DD' e converte para datetime ISO válido", () => {
    const agora = new Date("2026-10-19T21:00:00.000Z");
    const v2 = migrarAnaliseV1({ ...base, atualizadoEm: "2026-10-19" }, agora);

    expect(v2.criadaEm).toContain("2026-10-19");
    expect(esquemaAnaliseV2.safeParse(v2).success).toBe(true);
  });
});
