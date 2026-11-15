// Teste no celular (15/11/2026): "$undefined" virava rua, o IPTU do ZAP era suposto anual, o nome do edifício no
// anúncio não era lido e as fotos não chegavam ao app.
import { describe, expect, it } from "@jest/globals";
import { extrairDoEstado } from "../src/dados/extrator/estado";
import { extrairDoTexto } from "../src/dados/extrator";
import { fotosDoAnuncio, nomeDeEdificioNoTexto, textoDoCampo, urlDaFoto } from "../src/dados/extrator/nomeEFotos";

const ID = "2922135135";
const listing = (x: Record<string, unknown> = {}) => ({
  id: ID,
  prices: { rental: null, sale: { value: 350000, condominium: 750, iptu: 180 } },
  title: "Apartamento à venda com 53 m², 2 quartos - Edf. Engenho Torre",
  address: { city: "Recife", neighborhood: "Torre", street: "$undefined", streetNumber: "$undefined" },
  amenities: { usableAreas: [53], bedrooms: [2], bathrooms: [2], parkingSpaces: [1], unitFloor: 8 },
  medias: [
    { type: "IMAGE", url: "https://resizedimgs.zapimoveis.com.br/{action}/{width}x{height}/named.images.sp/abc/foto1.jpg" },
    { type: "VIDEO", url: "https://www.youtube.com/watch?v=x" },
    { type: "IMAGE", url: "https://resizedimgs.zapimoveis.com.br/{action}/{width}x{height}/named.images.sp/abc/foto2.jpg" },
  ],
  ...x,
});

describe("estado do ZAP", () => {
  it("'$undefined' não vira rua nem número", () => {
    const l = extrairDoEstado({ listing: listing() }, "zap", ID)!;
    expect(l.campos.logradouro).toBeNull();
    expect(l.campos.numero).toBeNull();
    expect(l.campos.bairro).toBe("torre");
  });
  it("IPTU de prices.* fica com período desconhecido (o portal não diz)", () => {
    expect(extrairDoEstado({ listing: listing() }, "zap", ID)!.campos.iptu).toEqual({ valor: 180, periodo: "desconhecido" });
  });
  it("nome do edifício sai do título; fotos saem de medias, sem vídeo", () => {
    const l = extrairDoEstado({ listing: listing() }, "zap", ID)!;
    expect(l.campos.nomeEdificio).toBe("Engenho Torre");
    expect(l.fotos).toEqual([
      "https://resizedimgs.zapimoveis.com.br/fit-in/870x653/named.images.sp/abc/foto1.jpg",
      "https://resizedimgs.zapimoveis.com.br/fit-in/870x653/named.images.sp/abc/foto2.jpg",
    ]);
  });
  it("rua e número reais continuam sendo lidos", () => {
    const l = extrairDoEstado({ listing: listing({ address: { city: "Recife", neighborhood: "Torre", street: "Rua Horácio Cahu", streetNumber: "61" } }) }, "zap", ID)!;
    expect([l.campos.logradouro, l.campos.numero]).toEqual(["Rua Horácio Cahu", "61"]);
  });
});

describe("textoDoCampo", () => {
  it("marcadores de ausência viram null", () => {
    for (const v of ["$undefined", "$L29", "undefined", "null", "  ", "--", 42, null, undefined]) expect(textoDoCampo(v)).toBeNull();
    expect(textoDoCampo(" Rua das Flores ")).toBe("Rua das Flores");
  });
});

describe("nome do edifício no texto", () => {
  it.each([
    ["Lindo apartamento no Edf. Engenho Torre, 8º andar", "Engenho Torre"],
    ["EDIFÍCIO SOLAR DO ATLÂNTICO - Boa Viagem", "SOLAR DO ATLÂNTICO"],
    ["Condomínio Jardim das Acácias, com piscina", "Jardim das Acácias"],
    ["Residencial Porto Belo. Próximo ao metrô", "Porto Belo"],
  ])("%s → %s", (texto, nome) => expect(nomeDeEdificioNoTexto(texto)).toBe(nome));
  it.each([
    "Condomínio fechado com lazer completo",
    "Condomínio Fechado com piscina",
    "Edifício 2 quartos perto da praia",
    "Apartamento 2 quartos na Torre",
    "",
  ])("sem nome: %s", (texto) => expect(nomeDeEdificioNoTexto(texto)).toBeNull());
  it("texto colado: o extrator de texto propõe o nome", () => {
    const [l] = extrairDoTexto("Apartamento à venda, 53 m², 2 quartos\nEdf. Engenho Torre\nTorre, Recife - PE\nR$ 350.000\nCondomínio R$ 750", "zap");
    expect(l?.campos.nomeEdificio).toBe("Engenho Torre");
  });
});

describe("anúncio real do ZAP (objeto lido em 15/11/2026, tests/fixtures/zap-listing-real-2026-11-15.json)", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const real = require("./fixtures/zap-listing-real-2026-11-15.json");
  it("fotos, endereço, área, preço; R$ 1 simbólico vira não informado; nome do prédio do código do anunciante", () => {
    const l = extrairDoEstado({ listing: real.listing }, "zap", "2909737935")!;
    expect(l.fotos).toHaveLength(3);
    expect(l.fotos?.[0]).toBe("https://resizedimgs.zapimoveis.com.br/img/vr-listing/9fe9ee180d0658dc20b57fe6a4df6780/foto.webp?action=fit-in&dimension=870x653");
    expect([l.campos.logradouro, l.campos.numero, l.campos.bairro]).toEqual(["Rua Pedro Bergamo", "323", "boa-viagem"]);
    expect([l.campos.preco, l.campos.area, l.campos.quartos, l.campos.modalidade]).toEqual([540000, 74, 3, "compra"]);
    expect([l.campos.condominio, l.campos.iptu]).toEqual([null, null]);
    expect(l.campos.nomeEdificio).toBe("CASTELO DE BRUNO RENDA");
  });
});

describe("fotos no formato real do ZAP (conferido em 15/11/2026)", () => {
  it("medias.images[].dangerousSrc com {description}/{action}/{width}x{height}; planta baixa fica de fora", () => {
    const l = extrairDoEstado({ listing: listing({ medias: {
      images: [{ dangerousSrc: "https://resizedimgs.zapimoveis.com.br/img/vr-listing/9fe9/{description}.webp?action={action}&dimension={width}x{height}", alt: "x" }],
      floorPlans: [{ dangerousSrc: "https://resizedimgs.zapimoveis.com.br/img/vr-listing/plan/{description}.webp?action={action}&dimension={width}x{height}" }],
    } }) }, "zap", ID)!;
    expect(l.fotos).toEqual(["https://resizedimgs.zapimoveis.com.br/img/vr-listing/9fe9/foto.webp?action=fit-in&dimension=870x653"]);
  });
  it("condomínio e IPTU de R$ 1 (simbólicos no ZAP) ficam como não informados", () => {
    const l = extrairDoEstado({ listing: listing({ prices: { rental: null, sale: { value: 540000, condominium: 1, iptu: 1 } } }) }, "zap", ID)!;
    expect([l.campos.condominio, l.campos.iptu]).toEqual([null, null]);
  });
});

describe("fotos", () => {
  it("só https de imagem; modelos preenchidos; no máximo o limite", () => {
    expect(urlDaFoto("http://x.com/a.jpg")).toBeNull();
    expect(urlDaFoto("https://x.com/tour.mp4")).toBeNull();
    expect(urlDaFoto({ src: "https://cdn.x.com/img/1.webp" })).toBe("https://cdn.x.com/img/1.webp");
    const muitas = Array.from({ length: 30 }, (_, i) => `https://cdn.x.com/img/${i}.jpg`);
    expect(fotosDoAnuncio({ images: muitas })).toHaveLength(12);
  });
});
