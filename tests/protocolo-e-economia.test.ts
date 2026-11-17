import { describe, expect, it } from "@jest/globals";
import { aplicarNoModelo, type EstadoDoModelo } from "../src/dados/protocoloDeSincronizacao";
import { economiaDaOferta } from "../src/dados/economiaDaOferta";
import { analiseDeTeste } from "./fixtures/caderno";

describe("modelo local de sincronização — não é backend", () => {
  const operacao = () => ({ id: "op-1", donoId: "dono-a", analiseId: "a", revisaoBase: 0, tipo: "salvar", conteudo: analiseDeTeste("a") });
  const vazio = (): EstadoDoModelo => ({ registros: {}, aplicadas: {} });
  it("confirma uma vez e repetir não incrementa revisão", () => {
    const estado = vazio(); const o = operacao();
    expect(aplicarNoModelo(estado, o, "dono-a")).toEqual({ estado: "confirmado", revisao: 1, repetida: false });
    expect(aplicarNoModelo(estado, o, "dono-a")).toEqual({ estado: "confirmado", revisao: 1, repetida: true });
  });
  it("conflito preserva versões e não usa relógio como desempate", () => {
    const estado = vazio(); const a = operacao();
    aplicarNoModelo(estado, a, "dono-a");
    const b = { ...a, id: "op-2", conteudo: { ...a.conteudo, nome: "Outra versão local" } };
    expect(aplicarNoModelo(estado, b, "dono-a")).toMatchObject({ estado: "conflito", local: b });
    expect(estado.registros.a?.conteudo?.nome).toBe(a.conteudo.nome);
  });
  it("nega cruzamento de proprietário sem devolver conteúdo", () => {
    const estado = vazio(); const a = operacao();
    aplicarNoModelo(estado, a, "dono-a");
    expect(aplicarNoModelo(estado, { ...a, donoId: "dono-b", revisaoBase: 1 }, "dono-b")).toEqual({ estado: "nao_autorizado" });
    expect(aplicarNoModelo(estado, a, "dono-b")).toEqual({ estado: "nao_autorizado" });
  });
  it("exclusão não é revertida por dispositivo antigo; restaurar é explícito", () => {
    const estado = vazio(); const a = operacao();
    aplicarNoModelo(estado, a, "dono-a");
    aplicarNoModelo(estado, { ...a, id: "op-delete", tipo: "excluir", conteudo: null, revisaoBase: 1 }, "dono-a");
    expect(aplicarNoModelo(estado, { ...a, id: "op-velha", revisaoBase: 1 }, "dono-a").estado).toBe("conflito");
    expect(aplicarNoModelo(estado, { ...a, id: "op-recriar", revisaoBase: 2 }, "dono-a").estado).toBe("conflito");
    expect(aplicarNoModelo(estado, { ...a, id: "op-restaurar", tipo: "restaurar", revisaoBase: 2 }, "dono-a").estado).toBe("confirmado");
  });
});

describe("economia da oferta — cenários internos", () => {
  it("custo desconhecido continua pendente, sem declarar margem completa", () => {
    expect(economiaDaOferta({ receitaBrutaCentavos: 10000, taxaPagamentoFracao: 0.05, tributosFracao: 0.1,
      custos: [{ nome: "Consulta", valorCentavos: null, fonte: "Cotação pendente", referenciaEm: null },
        { nome: "Suporte", valorCentavos: 1000, fonte: "Hipótese", referenciaEm: "2026-10-21" }] }))
      .toEqual({ receitaLiquidaCentavos: 8500, custoConhecidoCentavos: 1000, margemConhecidaCentavos: 7500, completo: false, pendencias: ["Consulta"] });
  });
  it("margem negativa aparece sem mudar preço ou saldo", () => {
    const r = economiaDaOferta({ receitaBrutaCentavos: 1000, taxaPagamentoFracao: 0, tributosFracao: 0,
      custos: [{ nome: "API", valorCentavos: 1200, fonte: "Hipótese de teste", referenciaEm: "2026-10-21" }] });
    expect(r.margemConhecidaCentavos).toBe(-200); expect(r.completo).toBe(true);
  });
});
