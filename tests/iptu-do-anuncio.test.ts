// IPTU do anúncio contra o cadastro (teste no celular, 15/11/2026: R$ 180 sem período virava R$ 15/mês).
import { describe, expect, it } from "@jest/globals";
import { lerIptuDoAnuncio, referenciaDoCadastro, resolverIptuNaConfirmacao } from "../src/dados/iptuDoAnuncio";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import type { AnaliseV2 } from "../src/dados/contratos";

const capibaribe = () => edificiosDoBairro("torre").find((e) => e.id === "29246-61")!;

describe("referência do cadastro", () => {
  it("tipologia mais perto da área do anúncio, IPTU mensal mediano", () => {
    const r = referenciaDoCadastro(capibaribe(), 53)!;
    expect(r.area).toBe(53.18);
    expect(Math.round(r.mensal)).toBe(131);
  });
  it("sem tipologia a até 15% da área, ou sem área com várias tipologias: sem referência", () => {
    expect(referenciaDoCadastro(capibaribe(), 90)).toBeNull();
    expect(referenciaDoCadastro(capibaribe(), null)).toBeNull();
  });
});

describe("período do IPTU", () => {
  const ref = { mensal: 131, area: 53.18, unidades: 21 };
  it("sem período: R$ 180 bate como mensal, não como anual (R$ 15)", () => {
    expect(lerIptuDoAnuncio(180, "desconhecido", ref)).toEqual({ periodo: "mes", decididoPor: "cadastro", divergente: false });
  });
  it("sem período: R$ 1.600 bate como anual", () => {
    expect(lerIptuDoAnuncio(1600, "desconhecido", ref)).toEqual({ periodo: "ano", decididoPor: "cadastro", divergente: false });
  });
  it("sem período e nenhum dos dois bate: continua desconhecido e divergente", () => {
    expect(lerIptuDoAnuncio(40, "desconhecido", ref)).toEqual({ periodo: "desconhecido", decididoPor: "ninguem", divergente: true });
  });
  it("com período dito: mantém e só marca a divergência", () => {
    expect(lerIptuDoAnuncio(180, "ano", ref)).toEqual({ periodo: "ano", decididoPor: "anuncio", divergente: true });
    expect(lerIptuDoAnuncio(150, "mes", ref)).toEqual({ periodo: "mes", decididoPor: "anuncio", divergente: false });
  });
  it("sem cadastro ou sem valor: nada a decidir", () => {
    expect(lerIptuDoAnuncio(180, "desconhecido", null).periodo).toBe("desconhecido");
    expect(lerIptuDoAnuncio(null, "desconhecido", ref).decididoPor).toBe("ninguem");
  });
});

describe("na confirmação do prédio", () => {
  const analise = (iptu: Partial<AnaliseV2["declarados"]["iptu"]>) => ({
    declarados: {
      area: { valor: 53, origem: "link", aConfirmar: false },
      iptu: { valor: 180, origem: "link", aConfirmar: true, periodo: "desconhecido", ...iptu },
    },
  }) as unknown as AnaliseV2;
  it("período desconhecido vindo do anúncio é decidido pelo cadastro e deixa de estar a confirmar", () => {
    const r = resolverIptuNaConfirmacao(analise({}), capibaribe());
    expect(r.declarados.iptu).toEqual({ valor: 180, origem: "link", aConfirmar: false, periodo: "mes" });
  });
  it("o que a pessoa digitou, ou já tem período, não muda", () => {
    const voce = analise({ origem: "voce" });
    expect(resolverIptuNaConfirmacao(voce, capibaribe())).toBe(voce);
    const anual = analise({ periodo: "ano" });
    expect(resolverIptuNaConfirmacao(anual, capibaribe())).toBe(anual);
  });
});
