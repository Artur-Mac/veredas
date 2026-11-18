import { describe, expect, it } from "@jest/globals";
import { extrairDaUrl, extrairDoTexto, montarExtracao } from "../src/dados/extrator";
import { esquemaColetaDaPagina, lerPagina, type ColetaDaPagina } from "../src/dados/extrator/pagina";
import type { LeituraParcial } from "../src/dados/contratos";
import reais from "./fixtures/anuncios-reais-2026-11-18.json";

// Bug de 16/11/2026, "anúncios não são lidos corretamente". Reprodução com páginas reais de 18/11/2026 de ZAP, VivaReal,
// QuintoAndar e OLX, abertas como no celular e coletadas pelo SCRIPT_COLETOR do app (fixture higienizada: sem anunciante).
// Causas: o texto da página inteira entrava na leitura, com os cartões de outros anúncios; o estado do QuintoAndar e o da
// OLX não eram achados; contadores atravessavam a quebra de linha.

type Portal = "zap" | "vivareal" | "quintoandar" | "olx";
const AGORA = new Date("2026-11-18T12:00:00Z");

function coleta(portal: Portal): ColetaDaPagina {
  return esquemaColetaDaPagina.parse(reais[portal]);
}

function doLink(url: string): LeituraParcial {
  const lida = extrairDaUrl(url);
  if ("erro" in lida) throw new Error(url);
  return lida;
}

/** Pela página (WebView no celular ou a página compartilhada do Safari): link + lerPagina. */
function pelaPagina(portal: Portal) {
  const c = coleta(portal);
  const link = doLink(c.url);
  const leituras = lerPagina(c, link.portal, link.idNoPortal, c.url);
  return { leituras, extracao: montarExtracao(c.url, [link, ...leituras], AGORA) };
}

/** Pelo texto copiado da página inteira (o caminho de quem cola o anúncio): link + texto. */
function peloTexto(portal: Portal) {
  const c = coleta(portal);
  const link = doLink(c.url);
  return montarExtracao(c.url, [link, ...extrairDoTexto(c.texto, link.portal)], AGORA);
}

const anomaliaDe = (extracao: { anomalias: { campo: string; tipo: string }[] }, campo: string) =>
  extracao.anomalias.filter((a) => a.campo === campo).map((a) => a.tipo);

describe("ZAP real (aluguel, condomínio e IPTU isentos)", () => {
  it("pela página: o IPTU de um anúncio parecido ('IPTU R$ 1') não vira o IPTU deste", () => {
    const { extracao } = pelaPagina("zap");
    expect(extracao.campos).toMatchObject({ preco: 3500, condominio: null, iptu: null, banheiros: 2, vagas: 1, andar: 23 });
    expect(anomaliaDe(extracao, "iptu")).toEqual([]);
    expect(extracao.fotos).toHaveLength(2);
  });

  it("pelo texto: 'Quartos 3 / Banheiros 2' não dá aos banheiros o número dos quartos", () => {
    const extracao = peloTexto("zap");
    expect(extracao.campos).toMatchObject({ quartos: 3, banheiros: 2, vagas: 1, iptu: null, condominio: null });
    expect(extracao.campos).toMatchObject({ logradouro: "Rua Othon Paraíso", numero: "211", nomeEdificio: "Aurelino Melo" });
    expect(anomaliaDe(extracao, "iptu")).toEqual([]);
  });
});

describe("VivaReal real (aluguel, IPTU isento)", () => {
  it("pela página: o 'IPTU não informado' de outro anúncio não aparece como aviso deste", () => {
    const { extracao } = pelaPagina("vivareal");
    expect(extracao.campos).toMatchObject({ preco: 4500, area: 55, banheiros: 2, vagas: 1, andar: 10, bairro: "gracas" });
    expect(anomaliaDe(extracao, "iptu")).toEqual([]);
  });

  it("pelo texto: as vagas são as deste anúncio", () => {
    const extracao = peloTexto("vivareal");
    expect(extracao.campos).toMatchObject({ banheiros: 2, vagas: 1, bairro: "gracas" });
    expect(extracao.anomalias).toEqual([]);
  });
});

describe("QuintoAndar real (aluguel)", () => {
  it("pela página: o estado é lido de houseInfo, não da rota (query.houseId)", () => {
    const { leituras, extracao } = pelaPagina("quintoandar");
    const doEstado = leituras.find((l) => l.idNoPortal === "893547852");
    expect(doEstado?.campos).toMatchObject({
      modalidade: "aluguel", preco: 2600, condominio: 315, iptu: { valor: 31, periodo: "mes" }, area: 46, quartos: 1,
      seguroIncendio: 52, taxaServico: 67, totalInformado: 3065, logradouro: "Rua do Aragão", bairro: "boa-vista",
    });
    expect(extracao.fotos).toEqual([
      "https://www.quintoandar.com.br/img/xlg/893547852-996.68255896601041.jpg",
      "https://www.quintoandar.com.br/img/xlg/893547852-766.55204132963432.jpg",
    ]);
    expect(extracao.anomalias).toEqual([]);
  });

  it("pelo texto: o bairro é o do anúncio (não o de um 'Similar'), e a rua termina antes de 'no bairro…'", () => {
    const extracao = peloTexto("quintoandar");
    expect(extracao.campos).toMatchObject({ bairro: "boa-vista", logradouro: "Rua do Aragão", preco: 2600, condominio: 315 });
    expect(anomaliaDe(extracao, "bairro")).toEqual([]);
  });
});

describe("OLX real (venda)", () => {
  it("pela página: o estado (initial-data → ad.listId) rende preço, medidas, bairro, modalidade e fotos", () => {
    const { leituras, extracao } = pelaPagina("olx");
    expect(leituras.some((l) => l.idNoPortal === "1553890780")).toBe(true);
    expect(extracao.campos).toMatchObject({
      modalidade: "compra", preco: 570000, area: 116, quartos: 3, banheiros: 3, vagas: 1, bairro: "boa-viagem",
      logradouro: null, nomeEdificio: null,
    });
    expect(extracao.fotos).toEqual([
      "https://img.olx.com.br/images/66/664664344322814.jpg",
      "https://img.olx.com.br/images/69/691665829071193.jpg",
    ]);
    expect(anomaliaDe(extracao, "condominio")).toEqual(["nao_informado"]);
  });

  it("pelo texto: venda continua venda, com o preço dela, e a rua de outro anúncio não entra", () => {
    const extracao = peloTexto("olx");
    expect(extracao.campos).toMatchObject({ modalidade: "compra", preco: 570000, area: 116, logradouro: null });
    expect(anomaliaDe(extracao, "modalidade")).toEqual([]);
  });

  it("pelo texto: o bairro sai do bloco 'Localização' (bairro numa linha, 'Recife, PE, CEP' na seguinte)", () => {
    const c = coleta("olx");
    const texto = c.texto.replace("Detalhes\n", "Localização\nBoa Viagem\nRecife, PE, 51020260\nExibir no mapa\nDetalhes\n");
    const [lido] = extrairDoTexto(texto, "olx");
    expect(lido?.campos).toMatchObject({ bairro: "boa-viagem", cidade: "recife" });
  });

  it("pelo texto: 'R$ 5.000 Aluguel' lê o valor antes do rótulo, não o total da linha seguinte", () => {
    const [texto] = extrairDoTexto("Aluguel\nImóvel para aluguel tem 57 metros quadrados\n57m²\nR$ 5.000 Aluguel\nTotal R$ 5.003/mês", "olx");
    expect(texto?.campos).toMatchObject({ modalidade: "aluguel", preco: 5000 });
  });
});

describe("estado da página contra o texto", () => {
  it("o 'não informado' do texto não apaga o valor que o estado trouxe", () => {
    const c = coleta("zap");
    const estado = JSON.parse(c.estados[0] ?? "{}");
    estado.listing.prices.rental.condominium = 600;
    const comCondominio = { ...c, estados: [JSON.stringify(estado)], texto: "Valores\nAluguel\nR$ 3.500/mês\nCondomínio\nNão informado" };
    const link = doLink(c.url);
    const extracao = montarExtracao(c.url, [link, ...lerPagina(comCondominio, "zap", link.idNoPortal, c.url)], AGORA);
    expect(extracao.campos.condominio).toBe(600);
    expect(anomaliaDe(extracao, "condominio")).toEqual([]);
  });
});
