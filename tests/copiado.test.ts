import { describe, expect, it } from "@jest/globals";
import { textoDoAnuncioCopiado } from "../src/dados/extrator/copiado";
import { extrairDoTexto } from "../src/dados/extrator/texto";

const URL = "https://www.zapimoveis.com.br/imovel/aluguel-apartamento-3-quartos-boa-viagem-recife-pe-125m2-id-123/";
const TRECHO = "Apartamento para alugar\nAluguel R$ 4.500 /mês\nCondomínio R$ 1.190\nIPTU R$ 288\n125 m²\n3 quartos";

describe("o que a pessoa copiou no navegador", () => {
  it("o trecho do anúncio passa inteiro e rende preço, condomínio e IPTU", () => {
    const texto = textoDoAnuncioCopiado(`  ${TRECHO}  `, URL);
    expect(texto).toBe(TRECHO);
    const campos = extrairDoTexto(texto ?? "", "zap").map((l) => l.campos);
    expect(campos.some((c) => c.preco === 4500)).toBe(true);
    expect(campos.some((c) => c.condominio === 1190)).toBe(true);
  });

  it("o próprio link, outro link ou nada não são o anúncio", () => {
    expect(textoDoAnuncioCopiado(URL, URL)).toBeNull();
    expect(textoDoAnuncioCopiado("https://www.vivareal.com.br/imovel/apartamento-2-quartos-graças-recife-id-999/", URL)).toBeNull();
    expect(textoDoAnuncioCopiado("", URL)).toBeNull();
    expect(textoDoAnuncioCopiado(null, URL)).toBeNull();
  });

  it("texto sem valor em reais nem área é descartado: a área de transferência pode ter qualquer coisa", () => {
    expect(textoDoAnuncioCopiado("Oi, te mando o endereço da reunião amanhã cedo, combinado? Abraço", URL)).toBeNull();
    expect(textoDoAnuncioCopiado("codigoInventadoParaOTeste-com-mais-de-quarenta-caracteres", URL)).toBeNull();
    expect(textoDoAnuncioCopiado("R$ 4.500", URL)).toBeNull();
  });

  it("só a área também serve, e o texto longo é cortado no teto da coleta", () => {
    expect(textoDoAnuncioCopiado("Apartamento com 125 m² em Boa Viagem, 3 quartos e varanda", URL)).not.toBeNull();
    expect(textoDoAnuncioCopiado(`${TRECHO}\n${"x".repeat(250_000)}`, URL)?.length).toBe(200_000);
  });
});
