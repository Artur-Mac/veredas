// O mapa dos dossiês de exemplo (src/componentes/mapa/Mapa.tsx) sobre o mapa-base de verdade (18/11/2026): o chão é o
// fundo da Prefeitura em volta de lote.centro, os candidatos de "É este o prédio?" são lotes da base, sem cobertura não há
// geometria inventada, e a cena é remontada por janela. O leitor de camadas é síncrono nos testes (configurar-camadas.ts).
import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { Mapa, janelaDaVista, origemDaJanela, precisaRemontar, caixaDaJanela, paraDesenhoDaJanela } from "../src/componentes/mapa/Mapa";
import { dossies } from "../src/dados/dossies";
import type { Dossie } from "../src/dados/esquema";
import { coordenadaParaMetros, metrosParaCoordenada } from "../src/dados/geo";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const CREDITO = "Base: Prefeitura do Recife (ODbL)";

function dossie(id: string): Dossie {
  const d = dossies.get(id);
  if (!d) throw new Error(`Dossiê sem dados: ${id}`);
  return d;
}

function montar(props: React.ComponentProps<typeof Mapa>, largura = 375, altura = 500): TestRenderer.ReactTestRenderer {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(Mapa, props)));
  });
  const raiz = r.root.find((n) => typeof n.props.onLayout === "function" && typeof n.type !== "string");
  act(() => {
    (raiz.props.onLayout as (e: unknown) => void)({ nativeEvent: { layout: { x: 0, y: 0, width: largura, height: altura } } });
  });
  return r;
}

function textos(r: TestRenderer.ReactTestRenderer): string {
  return r.root
    .findAll((n) => typeof n.props.children === "string")
    .map((n) => n.props.children as string)
    .join(" | ");
}

function rotulo(r: TestRenderer.ReactTestRenderer): string {
  const no = r.root.find((n) => typeof n.props.accessibilityLabel === "string" && typeof n.props.onLayout === "function");
  return no.props.accessibilityLabel as string;
}

const caminhos = (r: TestRenderer.ReactTestRenderer): ReactTestInstance[] =>
  r.root.findAll((n) => typeof n.props.d === "string" && (n.props.d as string).length > 0 && n.type !== "path");

describe("mapa dos exemplos sobre o mapa-base", () => {
  it("Boa Viagem: o chão é o fundo de verdade, com crédito e descrição para o leitor de tela", () => {
    const r = montar({ dossie: dossie("boa-viagem"), ajustar: 1550, raios: [500, 1000, 1500], acessivel: "Imóvel em análise" });
    expect(textos(r)).toContain(CREDITO);
    expect(rotulo(r)).toContain("Imóvel em análise. Mapa do entorno, bairro Boa Viagem.");
    expect(textos(r)).not.toContain("Carregando ruas e quadras");
    act(() => r.unmount());
  });

  it("topo do exemplo: 500 m, sem o selo no canto, com o crédito", () => {
    const r = montar({ dossie: dossie("casa-forte"), ajustar: 500, acessivel: "Casa Forte", selo: false }, 336, 200);
    expect(textos(r)).toContain(CREDITO);
    expect(textos(r)).not.toContain("BAIRRO");
    act(() => r.unmount());
  });

  it("É este o prédio?: os candidatos são lotes da base perto do centro (tracejados), nunca retângulos inventados", () => {
    const r = montar({ dossie: dossie("boa-viagem"), ajustar: 110, raios: [], lotes: "candidatos", acessivel: "x" });
    const tracejados = r.root.findAll((n) => n.props.strokeDasharray === "4 3" && typeof n.props.d === "string" && n.type !== "path");
    expect(tracejados.length).toBeGreaterThan(0);
    expect(tracejados.length).toBeLessThanOrEqual(8);
    // Os candidatos vêm da base: nenhum é um retângulo de 4 cantos com o centro no imóvel (o antigo gerador).
    for (const t of tracejados) expect(t.props.d as string).toMatch(/^M[\d.-]+ [\d.-]+L/);
    expect(textos(r)).toContain("BAIRRO");
    act(() => r.unmount());
  });

  it("sem cobertura (fora do Recife): chão liso, sem ruas, praças, água ou lotes inventados, e sem crédito", () => {
    const base = dossie("casa-forte");
    const fora: Dossie = { ...base, id: "fora", bairro: "Lugar Nenhum", lote: { ...base.lote, centro: [-46.63, -23.55] } };
    const r = montar({ dossie: fora, ajustar: 1550, lotes: "confirmado", acessivel: "Fora" });
    expect(textos(r)).not.toContain(CREDITO);
    // Só sobra o pino (um Path dentro do seu próprio Svg): nada de geometria de chão.
    const formas = caminhos(r).filter((n) => !(n.props.d as string).startsWith("M14 35"));
    expect(formas).toHaveLength(0);
    expect(r.root.findAll((n) => n.type !== "line" && typeof n.props.x1 === "number")).toHaveLength(0);
    act(() => r.unmount());
  });
});

describe("remontagem por janela", () => {
  const tamanho = { largura: 400, altura: 300 };
  const vista = { escala: 0.5, centro: [0, 0] as [number, number] };
  const j = janelaDaVista(vista, tamanho);

  it("não remonta enquanto a vista fica dentro da folga e do intervalo de zoom", () => {
    expect(precisaRemontar(j, vista, tamanho)).toBe(false);
    expect(precisaRemontar(j, { ...vista, centro: [200, 100] }, tamanho)).toBe(false);
    expect(precisaRemontar(j, { ...vista, escala: 0.6 }, tamanho)).toBe(false);
  });

  it("remonta sem janela, ao sair da folga, ao mudar muito o zoom ou o tamanho", () => {
    expect(precisaRemontar(null, vista, tamanho)).toBe(true);
    // Folga de 120 px = 240 m nessa escala: 260 m para o lado já mostra o que não foi montado.
    expect(precisaRemontar(j, { ...vista, centro: [260, 0] }, tamanho)).toBe(true);
    expect(precisaRemontar(j, { ...vista, escala: 0.3 }, tamanho)).toBe(true);
    expect(precisaRemontar(j, { ...vista, escala: 0.8 }, tamanho)).toBe(true);
    expect(precisaRemontar(j, vista, { largura: 360, altura: 300 })).toBe(true);
  });

  it("o desenho da janela, a caixa em graus e a conta de metros do mapa concordam", () => {
    const centro: [number, number] = [-34.907662, -8.142946];
    const para = paraDesenhoDaJanela(j, centro);
    const [x, y] = para(centro);
    const [ox, oy] = origemDaJanela(j);
    expect(x).toBeCloseTo(-ox * j.escala, 6);
    expect(y).toBeCloseTo(-oy * j.escala, 6);
    const [oeste, sul, leste, norte] = caixaDaJanela(j, centro);
    const [x0, y0] = para([oeste, norte]);
    const [x1, y1] = para([leste, sul]);
    expect(x0).toBeCloseTo(0, 6);
    expect(y0).toBeCloseTo(0, 6);
    expect(x1).toBeCloseTo(j.largura + 2 * j.folgaX, 6);
    expect(y1).toBeCloseTo(j.altura + 2 * j.folgaY, 6);
    expect(coordenadaParaMetros(centro, metrosParaCoordenada(centro, 100, 50))[0]).toBeCloseTo(100, 6);
  });
});
