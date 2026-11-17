import { describe, expect, it } from "@jest/globals";
import { resumoDaColeta } from "../src/componentes/leitor/diagnostico";
import { lerPagina } from "../src/dados/extrator/pagina";

describe("diagnóstico da leitura da página", () => {
  const coleta = {
    url: "https://www.zapimoveis.com.br/imovel/aluguel-apartamento-1-quarto-gracas-recife-pe-32m2-id-2884141276/?source=x",
    titulo: "Apartamento para alugar · ZAP",
    ld: ['{"@context":"https://schema.org","@type":"Product"}'],
    estados: ['{"props":{"pageProps":{}},"page":"/imovel"}'],
    texto: "Aluguel\nR$ 1.800/mês\nCondomínio R$ 450\n32 m²\nFale com Pedro (81) 99999-9999",
    verificacao: false,
  };

  it("resume a coleta sem query, sem contato e com o que rendeu", () => {
    const leituras = lerPagina(coleta, "zap", "2884141276", coleta.url);
    const resumo = resumoDaColeta(coleta, leituras, { numero: 3, doAnuncio: true, bloqueio: false });
    expect(resumo).toContain("Leitura nº 3 · www.zapimoveis.com.br/imovel/aluguel-apartamento-1-quarto-gracas-recife-pe-32m2-id-2884141276/");
    expect(resumo).not.toContain("source=");
    expect(resumo).toContain("JSON-LD: 1 (Product)");
    expect(resumo).toContain("chaves: props, page");
    expect(resumo).toContain("R$ 1.800/mês");
    expect(resumo).not.toContain("99999");
    expect(resumo).toMatch(/texto: .*preco/);
  });
});
