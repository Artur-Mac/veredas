import { describe, expect, it } from "@jest/globals";
import { custos, esquemaAnalise, mensagemDaAnalise, numeroDigitado, perguntas, urlValida, type Analise } from "../src/dados/analise";
const base: Analise = { id: "a", nome: "Apartamento A", bairro: "Recife", url: "", tipo: "aluguel", preco: 2500, condominio: 500, iptuAnual: 1200, outros: null, area: 60, notas: "", verificadas: [], atualizadoEm: "2026-10-19" };
describe("caderno de análises", () => {
  it("distingue desconhecido, zero e valor inválido em moeda brasileira", () => {
    expect(numeroDigitado("")).toBeNull();
    expect(numeroDigitado("0")).toBe(0);
    expect(numeroDigitado("R$ 2.500,50")).toBe(2500.5);
    for (const s of ["-20", "2.50", "1,2,3", "Infinity", "texto", "10000000001"]) expect(numeroDigitado(s)).toBeNaN();
  });
  it("mensaliza IPTU sem ocultar lacunas e sem somar preço de compra", () => {
    expect(custos(base)).toMatchObject({ subtotal: 3100, pendentes: 1 });
    expect(custos({ ...base, tipo: "compra", preco: 500000 })).toMatchObject({ subtotal: 600, pendentes: 1 });
    expect(custos({ ...base, preco: null, condominio: null, iptuAnual: null })).toMatchObject({ subtotal: null, pendentes: 4 });
    expect(custos({ ...base, preco: 0, condominio: 0, iptuAnual: 0, outros: 0 })).toMatchObject({ subtotal: 0, pendentes: 0 });
  });
  it("transforma lacunas em perguntas e exclui itens já verificados da mensagem", () => {
    expect(perguntas(base).map((p) => p.id)).toContain("outros");
    expect(perguntas(base).map((p) => p.id)).not.toContain("iptu");
    const msg = mensagemDaAnalise({ ...base, verificadas: ["outros"] });
    expect(msg).toContain(base.nome);
    expect(msg).not.toContain("Há seguro");
    expect(msg).toContain("Ouvir o ruído");
  });
  it("rejeita esquemas ativos e credenciais no link", () => {
    expect(urlValida("https://www.zapimoveis.com.br/imovel/123")).toBe(true);
    for (const s of ["javascript:alert(1)", "file:///tmp/a", "https://user:senha@example.com", "não é link"]) expect(urlValida(s)).toBe(false);
  });
  it("valida dados persistidos sem aceitar NaN ou área negativa", () => {
    expect(esquemaAnalise.safeParse(base).success).toBe(true);
    expect(esquemaAnalise.safeParse({ ...base, preco: NaN }).success).toBe(false);
    expect(esquemaAnalise.safeParse({ ...base, area: -1 }).success).toBe(false);
  });
});
