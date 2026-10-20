import { describe, expect, it } from "@jest/globals";
import { chavesDoAnuncio, extrairDoEstado } from "../src/dados/extrator/estado";
import fixturesEstado from "./fixtures/estado-pagina.json";

function contemValorProibido(obj: unknown, proibido: unknown): boolean {
  if (obj === proibido) return true;
  if (!obj || typeof obj !== "object") return false;
  if (Array.isArray(obj)) {
    return obj.some((el) => contemValorProibido(el, proibido));
  }
  return Object.values(obj).some((v) => contemValorProibido(v, proibido));
}

describe("Extrator de Estado da Página", () => {
  const estadoBase = fixturesEstado.estado;

  for (const caso of fixturesEstado.casos) {
    it(`Processa caso: ${caso.id}`, () => {
      let estadoParaTestar: unknown = estadoBase;

      if (caso.id === "id-numerico-tambem-casa") {
        // Altera o ID no estado para número
        const clone = JSON.parse(JSON.stringify(estadoBase));
        clone.props.pageProps.initialState.house.houseInfo.id = 895799920;
        estadoParaTestar = clone;
      }

      const res = extrairDoEstado(estadoParaTestar, caso.portal as any, caso.idNoPortal);

      if ("resultado" in caso.esperado && caso.esperado.resultado === null) {
        expect(res).toBeNull();
        return;
      }

      expect(res).not.toBeNull();
      if (!res) return;

      if (caso.esperado.metodo) {
        expect(res.metodo).toBe(caso.esperado.metodo);
      }

      if (caso.esperado.campos) {
        for (const [k, v] of Object.entries(caso.esperado.campos)) {
          expect((res.campos as any)[k]).toEqual(v);
        }
      }

      if (caso.esperado.valoresProibidos) {
        for (const proibido of caso.esperado.valoresProibidos) {
          expect(contemValorProibido(res, proibido)).toBe(false);
        }
      }
    });
  }
});

describe("chavesDoAnuncio: mapa de nomes de chave do objeto do anúncio (K7)", () => {
  const estado = fixturesEstado.estado;
  const ID = "895799920";

  it("devolve os caminhos das chaves do anúncio até 3 níveis, sem nenhum caminho dos ramos login ou houses", () => {
    const caminhos = chavesDoAnuncio(estado, ID);
    expect(caminhos).toEqual(
      expect.arrayContaining([
        "id",
        "displayId",
        "bedrooms",
        "rentPrice",
        "salePrice",
        "condoPrice",
        "iptu",
        "iptuType",
        "totalCost",
        "tenantServiceFee",
        "insurance",
        "forRent",
        "address",
        "address.street",
        "address.neighborhood",
        "address.city",
        "listings",
        "listings[].imovelId",
      ]),
    );
    for (const caminho of caminhos) {
      expect(caminho).not.toMatch(/login|user|houses|lista|phone|areaCode|nome|houseInfo/);
    }
  });

  it("devolve só nomes: nenhum valor do estado aparece, nem o id do anúncio", () => {
    const saida = JSON.stringify(chavesDoAnuncio(estado, ID));
    for (const valor of ["Conta de teste", "900000000", "Rua da Conta Logada", "Rua do Vizinho", "Rua Projetada C", "Espinheiro", "Recife", ID, "2800", "3707", "Normal"]) {
      expect(saida).not.toContain(valor);
    }
  });

  it("não repete caminho", () => {
    const caminhos = chavesDoAnuncio(estado, ID);
    expect(new Set(caminhos).size).toBe(caminhos.length);
  });

  it("vale também quando o id do estado é número", () => {
    const clone = JSON.parse(JSON.stringify(estado));
    clone.props.pageProps.initialState.house.houseInfo.id = 895799920;
    expect(chavesDoAnuncio(clone, ID)).toContain("rentPrice");
  });

  it("para no terceiro nível abaixo do anúncio", () => {
    const sintetico = { raiz: { id: "1", a: { b: { c: { d: { e: 1 } } }, x: 1 } } };
    const caminhos = chavesDoAnuncio(sintetico, "1");
    expect(caminhos).toEqual(["id", "a", "a.b", "a.b.c", "a.x"]);
  });

  it("lista conta como o mesmo nível: as chaves dos itens saem sob 'nome[]'", () => {
    const sintetico = { id: "1", fotos: [{ url: "x", tamanho: { w: 1 } }, { url: "y", legenda: "z" }] };
    expect(chavesDoAnuncio(sintetico, "1")).toEqual(["id", "fotos", "fotos[].url", "fotos[].tamanho", "fotos[].tamanho.w", "fotos[].legenda"]);
  });

  it("chave que parece dado (número, e-mail, texto livre) vira <chave>", () => {
    const sintetico = { id: "1", mapa: { "123456789": { preco: 1 }, "ana@exemplo.com": 2, "Rua das Flores 10": 3 } };
    const caminhos = chavesDoAnuncio(sintetico, "1");
    expect(caminhos).toEqual(["id", "mapa", "mapa.<chave>", "mapa.<chave>.preco"]);
    const saida = JSON.stringify(caminhos);
    for (const dado of ["123456789", "ana@exemplo.com", "Rua das Flores"]) expect(saida).not.toContain(dado);
  });

  it("sem id no link, anúncio ausente ou estado que não é objeto: lista vazia", () => {
    expect(chavesDoAnuncio(estado, null)).toEqual([]);
    expect(chavesDoAnuncio(estado, "")).toEqual([]);
    expect(chavesDoAnuncio(estado, "123456789")).toEqual([]);
    expect(chavesDoAnuncio(null, ID)).toEqual([]);
    expect(chavesDoAnuncio("texto", ID)).toEqual([]);
    expect(chavesDoAnuncio(42, ID)).toEqual([]);
  });

  it("estado com ciclo não trava", () => {
    const ciclico: Record<string, unknown> = { id: "1" };
    ciclico["volta"] = ciclico;
    // O ciclo para no teto de 3 níveis.
    expect(chavesDoAnuncio(ciclico, "1")).toEqual(["id", "volta", "volta.id", "volta.volta", "volta.volta.id", "volta.volta.volta"]);
  });
});
