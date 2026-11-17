// Confirmar o prédio (15/11/2026): endereço do cadastro quando o anúncio não trouxe, IPTU decidido pelo cadastro e os
// passos do preparo do dossiê conforme as camadas do bairro.
import { describe, expect, it, jest } from "@jest/globals";
jest.mock("../src/estado/Analises", () => ({ useAnalises: () => ({}) }));
jest.mock("../src/estado/Carteira", () => ({ useCarteira: () => ({}) }));
import { analiseConfirmada } from "../src/componentes/predio/confirmar";
import { camadasDoBairro } from "../src/dados/camadasDasTelas";
import { passosDoPreparo } from "../src/dados/preparo";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import type { AnaliseV2 } from "../src/dados/contratos";

const capibaribe = () => edificiosDoBairro("torre").find((e) => e.id === "29246-61")!;
const analise = (x: Partial<AnaliseV2> = {}) => ({
  id: "imovel-1", logradouro: "$undefined", numero: "$undefined", vinculo: { estado: "pendente" },
  declarados: { area: { valor: 53, origem: "link", aConfirmar: false }, iptu: { valor: 180, origem: "link", aConfirmar: true, periodo: "desconhecido" } },
  ...x,
}) as unknown as AnaliseV2;

describe("analiseConfirmada", () => {
  it("rua e número do cadastro quando o anúncio trouxe '$undefined'; IPTU decidido; vínculo confirmado", () => {
    const r = analiseConfirmada(analise(), capibaribe(), "2026-11-15T00:00:00Z", "2026-11-15T12:00:00.000Z");
    expect([r.logradouro, r.numero]).toEqual(["RUA HORACIO CAHU", "61"]);
    expect(r.declarados.iptu).toMatchObject({ valor: 180, periodo: "mes", aConfirmar: false });
    expect(r.vinculo).toEqual({ estado: "confirmado", edificioId: "29246-61", dsqfl: capibaribe().dsqfl, confirmadoEm: "2026-11-15T12:00:00.000Z", indiceGeradoEm: "2026-11-15T00:00:00Z" });
  });
  it("rua que o anúncio trouxe fica; número ausente vem do cadastro", () => {
    const r = analiseConfirmada(analise({ logradouro: "Rua Horácio Cahu", numero: null }), capibaribe(), "g", "2026-11-15T12:00:00.000Z");
    expect([r.logradouro, r.numero]).toEqual(["Rua Horácio Cahu", "61"]);
  });
});

describe("passos do preparo", () => {
  it("só os passos das camadas que o bairro tem, começando pelo cadastro e terminando no dossiê", () => {
    const p = passosDoPreparo(camadasDoBairro("boa-viagem"), "boa-viagem");
    expect(p[0]).toBe("Conferindo o prédio no cadastro da Prefeitura");
    expect(p.at(-1)).toBe("Montando o dossiê");
    expect(p).toContain("Procurando registros de alagamento na rua");
    expect(passosDoPreparo([], "cabanga")).toEqual(["Conferindo o prédio no cadastro da Prefeitura", "Cruzando IPTU, transmissões e obras perto", "Montando o dossiê"]);
  });
});
