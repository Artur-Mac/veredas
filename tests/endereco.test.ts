import { describe, expect, it } from "@jest/globals";
import { formatarChaveCadastral, formatarEndereco } from "../src/dados/recife/endereco";

describe("endereço e chave cadastral", () => {
  it("expande os quatro prefixos do cadastro", () => {
    expect(formatarEndereco("EST DO ENCANAMENTO", "719")).toBe("Estrada do Encanamento, 719");
    expect(formatarEndereco("PRC DE CASA FORTE", "317")).toBe("Praça de Casa Forte, 317");
    expect(formatarEndereco("AV BEIRA RIO", null)).toBe("Avenida Beira Rio");
    expect(formatarEndereco("RUA TELES JUNIOR", "331")).toBe("Rua Teles Junior, 331");
  });
  it("mantém maiúscula a letra solta no fim do nome", () => {
    expect(formatarEndereco("RUA PROJETADA A", null)).toBe("Rua Projetada A");
    expect(formatarEndereco("RUA DA AURORA", "10")).toBe("Rua da Aurora, 10");
  });
  it("expande abreviação digitada com acento e ponto", () => {
    expect(formatarEndereco("Pça. do Entroncamento", null)).toBe("Praça do Entroncamento");
    expect(formatarEndereco("Av. Rui Barbosa", " 12 ")).toBe("Avenida Rui Barbosa, 12");
  });
  it("formata a chave e recusa o que não tem 14 dígitos", () => {
    expect(formatarChaveCadastral("31400097010326")).toBe("3.1400.097.01.0326");
    expect(formatarChaveCadastral("06.1780.0412.02.0327")).toBeNull();
    expect(formatarChaveCadastral(null)).toBeNull();
  });
});
