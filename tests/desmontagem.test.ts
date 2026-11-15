// 15/11/2026: confirmar o prédio e fechar a tela no meio não mexe em estado de componente desmontado, e o preparo não
// deixa relógio rodando depois de fechado.
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

let liberarSalvar: () => void = () => {};
jest.mock("../src/estado/Analises", () => ({
  useAnalises: () => ({ salvar: () => new Promise<void>((r) => { liberarSalvar = r; }) }),
}));
jest.mock("../src/estado/Carteira", () => ({
  useCarteira: () => ({ saldo: 3, bloqueada: false, erro: null, debitarDossie: async () => true }),
}));

// eslint-disable-next-line import/first
import { useConfirmarPredio } from "../src/componentes/predio/confirmar";
// eslint-disable-next-line import/first
import { PreparoDoDossie } from "../src/componentes/preparo/PreparoDoDossie";
// eslint-disable-next-line import/first
import { edificiosDoBairro } from "../src/dados/recife/indice";
// eslint-disable-next-line import/first
import type { AnaliseV2 } from "../src/dados/contratos";
// eslint-disable-next-line import/first
import { TemaDoApp } from "../src/tema/Tema";

afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

describe("confirmação com a tela já fechada", () => {
  it("termina sem atualizar estado de componente desmontado", async () => {
    const erros = jest.spyOn(console, "error").mockImplementation(() => {});
    let confirmar!: ReturnType<typeof useConfirmarPredio>["confirmar"];
    function Tela() {
      confirmar = useConfirmarPredio().confirmar;
      return null;
    }
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => { arvore = TestRenderer.create(React.createElement(Tela)); });
    const edificio = edificiosDoBairro("gracas")[0]!;
    const analise = { id: "a1", bairro: "gracas", vinculo: { estado: "pendente" } } as unknown as AnaliseV2;
    let resultado: Promise<string> | undefined;
    act(() => { resultado = confirmar(analise, edificio, "gracas").catch(() => "erro"); });
    act(() => arvore.unmount());
    await act(async () => { liberarSalvar(); await Promise.resolve(); await Promise.resolve(); });
    await act(async () => { await resultado; });
    expect(erros).not.toHaveBeenCalled();
  });
});

describe("preparo do dossiê", () => {
  it("fechado antes do fim, não chama quem abriu nem deixa relógio pendente", () => {
    jest.useFakeTimers();
    const aoTerminar = jest.fn();
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(PreparoDoDossie, { aberto: true, nome: "Teste", bairro: "gracas", aoTerminar })));
    });
    expect(JSON.stringify(arvore.toJSON())).toContain("PREPARANDO O DOSSIÊ");
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    act(() => arvore.unmount());
    act(() => { jest.advanceTimersByTime(20_000); });
    expect(aoTerminar).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
