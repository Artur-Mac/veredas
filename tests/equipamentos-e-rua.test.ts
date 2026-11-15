// Equipamentos por perto, a rua em linguagem simples e o simulador Price (15/11/2026).
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { ARua } from "../src/componentes/dossie-v1/ARua";
import { PorPerto } from "../src/componentes/dossie-v1/PorPerto";
import { simularPrice } from "../src/componentes/dossie-v1/SimuladorPrice";
import { Pressionavel } from "../src/componentes/Pressionavel";
import { camadasDoBairro } from "../src/dados/camadasDasTelas";
import type { VisaoDaRua } from "../src/dados/contratos";
import { prestacaoPrice } from "../src/dados/custoPorPartes";
import { arquivoDosEquipamentos, equipamentosDoBairro, fatosDeEquipamentos, semaforosPerto } from "../src/dados/recife/equipamentos";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("expo-router", () => ({}));

const montadas: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => { act(() => montadas.splice(0).forEach((a) => a.unmount())); });
function montar(no: React.ReactElement) {
  let a!: TestRenderer.ReactTestRenderer;
  act(() => { a = TestRenderer.create(React.createElement(TemaDoApp, null, no)); });
  montadas.push(a);
  return a;
}
function textos(no: unknown): string {
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textos).join(" ");
  return no && typeof no === "object" && "children" in no ? textos((no as { children: unknown }).children) : "";
}

describe("equipamentos por perto", () => {
  const bairro = "gracas";
  const pacote = equipamentosDoBairro(bairro)!;
  const comSonoro = Object.entries(pacote.predios).find(([, e]) => e.sonM !== undefined)?.[0] ?? null;
  const qualquer = Object.keys(pacote.predios)[0]!;

  it("a camada entra no que o dossiê espera do bairro", () => {
    expect(camadasDoBairro(bairro)).toContain(arquivoDosEquipamentos(bairro));
    expect(Object.keys(pacote.predios).length).toBe(edificiosDoBairro(bairro).length);
  });
  it("frase primeiro, detalhe com nome e distância em linha reta; nada de horário ou funcionamento prometido", () => {
    const fatos = fatosDeEquipamentos(bairro, qualquer);
    expect(fatos.length).toBeGreaterThan(0);
    for (const f of fatos) {
      expect(f.detalhe).toMatch(/linha reta\.?/);
      expect(`${f.frase} ${f.detalhe}`).not.toMatch(/aberto|funciona bem|seguro|nota/i);
    }
    expect([...fatos].map((f) => f.metros)).toEqual([...fatos].map((f) => f.metros).sort((a, b) => a - b));
  });
  it("semáforo sonoro só aparece quando o perfil pede acessibilidade de visão", () => {
    if (!comSonoro) return;
    expect(fatosDeEquipamentos(bairro, comSonoro).some((f) => f.id === "sonoro")).toBe(false);
    expect(fatosDeEquipamentos(bairro, comSonoro, ["mobilidade"]).some((f) => f.id === "sonoro")).toBe(false);
    const sonoro = fatosDeEquipamentos(bairro, comSonoro, ["visao"]).find((f) => f.id === "sonoro")!;
    expect(sonoro.detalhe).toContain("não diz se o sinal funciona hoje");
  });
  it("a contagem de semáforos e a fonte ficam atrás do toque", () => {
    expect(semaforosPerto(bairro, qualquer)).toMatch(/semáforo|Nenhum semáforo/);
    const a = montar(React.createElement(PorPerto, { bairro, predioId: qualquer }));
    expect(textos(a.toJSON())).toContain("Cadastro da Prefeitura: não diz horário, funcionamento nem manutenção.");
    expect(textos(a.toJSON())).not.toContain("Dados Abertos do Recife");
    const ver = a.root.findAllByType(Pressionavel).find((p) => textos(p.props.children).includes("Ver contagens e fonte") || p.props.accessibilityLabel === "Ver contagens e fonte");
    if (ver) act(() => ver.props.onPress());
  });
  it("prédio ou bairro fora da camada não inventa nada", () => {
    expect(fatosDeEquipamentos("gracas", "inexistente")).toEqual([]);
    expect(fatosDeEquipamentos(null, qualquer)).toEqual([]);
  });
});

describe("a rua: consequência primeiro, número e fonte no toque", () => {
  const rua: VisaoDaRua = {
    defesaCivil: null,
    grupos: [
      { id: "zeladoria", titulo: "Pedidos ao 156", nota: null, fatos: [
        { id: "rua-156-drenagem", rotulo: "Pedidos de drenagem (galeria, canaleta)", valor: "4", detalhe: "Mediana de 3 dias até o atendimento.", confianca: "oficial", fonte: "central_156", data: "20/06/2025 a 19/06/2026",
          consequencia: "Houve 4 pedidos de limpeza de galeria ou canaleta perto do prédio em 12 meses: vale perguntar se a rua acumula água." },
      ] },
      { id: "entorno", titulo: "Calçada", nota: null, fatos: [
        { id: "rua-censo-rampa", rotulo: "Rampa para cadeirante", valor: "12%", detalhe: "3 de 25 domicílios do setor", confianca: "oficial", fonte: "censo_entorno", data: "Censo 2022" },
      ] },
    ],
  };
  it("a linha mostra a frase; o toque abre o número e o link da fonte com a data", () => {
    const aoAbrirFonte = jest.fn();
    const a = montar(React.createElement(ARua, { rua, aoAbrirFonte, aoResponderDefesaCivil: () => {} }));
    const t = textos(a.toJSON());
    expect(t).toContain("Houve 4 pedidos de limpeza de galeria");
    expect(t).not.toContain("Mediana de 3 dias");
    const linha = a.root.findAllByType(Pressionavel).find((p) => String(p.props.accessibilityLabel).startsWith("Houve 4 pedidos"))!;
    act(() => linha.props.onPress());
    expect(textos(a.toJSON())).toContain("Mediana de 3 dias até o atendimento.");
    expect(textos(a.toJSON())).toContain("Ver fonte e data (20/06/2025 a 19/06/2026)");
  });
  it("rampa só aparece com mobilidade marcada no perfil da casa", () => {
    const sem = montar(React.createElement(ARua, { rua, aoAbrirFonte: () => {}, aoResponderDefesaCivil: () => {} }));
    expect(textos(sem.toJSON())).not.toContain("Rampa para cadeirante");
    const com = montar(React.createElement(ARua, { rua, aoAbrirFonte: () => {}, aoResponderDefesaCivil: () => {}, acesso: ["mobilidade"] }));
    expect(textos(com.toJSON())).toContain("Rampa para cadeirante");
  });
});

describe("simulador Price", () => {
  it("mesma fórmula do custo por partes; entrada e prazo mudam a prestação", () => {
    expect(prestacaoPrice(0, 360, 11)).toBe(0);
    const base = simularPrice(500_000, 20, 30, 11.0);
    expect(base.entradaReais).toBe(100_000);
    expect(base.financiadoReais).toBe(400_000);
    expect(base.prestacaoReais).toBe(prestacaoPrice(400_000, 360, 11.0));
    expect(base.totalPagoReais).toBe(base.prestacaoReais * 360);
    expect(base.jurosReais).toBe(base.totalPagoReais - 400_000);
    expect(simularPrice(500_000, 50, 30, 11).prestacaoReais).toBeLessThan(base.prestacaoReais);
    expect(simularPrice(500_000, 20, 15, 11).prestacaoReais).toBeGreaterThan(base.prestacaoReais);
    expect(simularPrice(500_000, 20, 15, 11).jurosReais).toBeLessThan(base.jurosReais);
  });
});
