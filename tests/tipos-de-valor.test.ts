// Rótulos próprios para preço pedido, avaliação fiscal, preço registrado e aluguel contratado (15/11/2026).
import { describe, expect, it } from "@jest/globals";
import { EVIDENCIA_EXIGIDA, ROTULO_DO_VALOR, relacaoEntreValores, type TipoDeValor } from "../src/dados/tiposDeValor";
import { descreverFonte } from "../src/componentes/fonte/textos";
import meta from "../src/dados/recife/indice/meta.json";

const TIPOS = Object.keys(ROTULO_DO_VALOR) as TipoDeValor[];
describe("tipos de valor", () => {
  it("cada tipo tem rótulo e evidência próprios, sem repetição", () => {
    expect(new Set(TIPOS.map((t) => ROTULO_DO_VALOR[t])).size).toBe(TIPOS.length);
    for (const t of TIPOS) expect(EVIDENCIA_EXIGIDA[t].length).toBeGreaterThan(10);
  });
  it("só o mesmo tipo é comparável; leilão e modalidade diferente não se misturam", () => {
    expect(relacaoEntreValores("preco_pedido", "preco_pedido")).toBe("comparavel");
    expect(relacaoEntreValores("preco_pedido", "avaliacao_fiscal_itbi")).toBe("lado_a_lado_com_rotulos");
    expect(relacaoEntreValores("preco_registrado", "avaliacao_fiscal_itbi")).toBe("lado_a_lado_com_rotulos");
    expect(relacaoEntreValores("aluguel_pedido", "preco_pedido")).toBe("nao_misturar");
    expect(relacaoEntreValores("lance_de_leilao", "preco_registrado")).toBe("nao_misturar");
  });
  it("o ITBI no app continua dito como avaliação fiscal, não preço", () => {
    expect(ROTULO_DO_VALOR.avaliacao_fiscal_itbi).toContain("não é preço de venda");
    const d = descreverFonte("itbi", meta as never);
    expect(d && "recorte" in d ? d.recorte : "").toContain("É avaliação fiscal, não preço de mercado.");
  });
});
