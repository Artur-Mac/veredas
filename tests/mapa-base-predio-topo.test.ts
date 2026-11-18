// O fundo do mapa-base (18/11/2026) na confirmação do prédio e no topo do dossiê, com os arquivos de verdade (leitor
// síncrono nos testes). Sem cobertura, os dois ficam como antes.
import { describe, expect, it } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { Edificio } from "../src/dados/contratos";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import { TopoDoDossie } from "../src/componentes/dossie-v1/Topo";
import { FundoDoMapa, CreditoDaBase } from "../src/componentes/mapa/FundoDoMapa";
import { MapaDoPredio } from "../src/componentes/predio/MapaDoPredio";
import { caixaDaCena, montarCena, paraDesenhoDaCena } from "../src/componentes/predio/projecao";
import { GradeArquitetonica } from "../src/componentes/GradeArquitetonica";
import { TemaDoApp } from "../src/tema/Tema";

const BOA_VIAGEM = edificiosDoBairro("boa-viagem");
const GOLDEN = BOA_VIAGEM.find((e) => e.id === "8001-216")!;
/** O mesmo prédio levado para o meio do Atlântico: não há arquivo do mapa-base para ele. */
const NO_MAR: Edificio = {
  ...GOLDEN,
  centro: [-34.5, -8.14],
  poligono: GOLDEN.poligono ? GOLDEN.poligono.map(([lon, lat]) => [lon + 0.4075, lat] as [number, number]) : null,
};

function montar(el: React.ReactElement): TestRenderer.ReactTestRenderer {
  let arvore!: TestRenderer.ReactTestRenderer;
  act(() => {
    arvore = TestRenderer.create(React.createElement(TemaDoApp, null, el));
  });
  return arvore;
}
const botoes = (a: TestRenderer.ReactTestRenderer) =>
  a.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityRole === "button" && typeof n.props.onPress === "function");
const textoDe = (a: TestRenderer.ReactTestRenderer) => JSON.stringify(a.toJSON());

describe("projeção do prédio para o fundo", () => {
  it("a conta em graus leva o centro do prédio ao pino e a caixa cobre o desenho", () => {
    const cena = montarCena(GOLDEN, BOA_VIAGEM, { largura: 340, altura: 180, reservaInferior: 40 });
    const [x, y] = paraDesenhoDaCena(cena)(GOLDEN.centro);
    expect(x).toBeCloseTo(cena.pino[0], 6);
    expect(y).toBeCloseTo(cena.pino[1], 6);
    const [o, s, l, n] = caixaDaCena(cena);
    const p = paraDesenhoDaCena(cena);
    expect(p([o, n])[0]).toBeCloseTo(0, 4);
    expect(p([o, n])[1]).toBeCloseTo(0, 4);
    expect(p([l, s])[0]).toBeCloseTo(340, 4);
    expect(p([l, s])[1]).toBeCloseTo(180, 4);
  });
});

describe("MapaDoPredio com o fundo", () => {
  it("prédio de Boa Viagem: fundo, crédito e rótulo que descreve o entorno sem perder a instrução", () => {
    const a = montar(React.createElement(MapaDoPredio, { selecionado: GOLDEN, outros: BOA_VIAGEM, aoEscolher: () => undefined }));
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(1);
    expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(1);
    const img = a.root.find((n) => n.props.role === "img" && typeof n.props.accessibilityLabel === "string");
    expect(img.props.accessibilityLabel).toMatch(/^Mapa do entorno, bairro Boa Viagem\./);
    expect(img.props.accessibilityLabel).toContain("Use a busca ou o botão Não é este");
    // A grade some com o fundo.
    expect(textoDe(a)).not.toContain("grade-do-mapa");
  });

  it("os vizinhos continuam botões que escolhem o prédio", () => {
    const escolhidos: string[] = [];
    const a = montar(React.createElement(MapaDoPredio, { selecionado: GOLDEN, outros: BOA_VIAGEM, aoEscolher: (e: Edificio) => escolhidos.push(e.id) }));
    const lista = botoes(a);
    expect(lista.length).toBeGreaterThan(0);
    for (const b of lista) expect(b.props.accessibilityLabel).toMatch(/^Prédio vizinho: /);
    act(() => lista[0]?.props.onPress());
    expect(escolhidos).toHaveLength(1);
  });

  it("um destaque só: com o lote do imóvel no fundo, o contorno do índice não é desenhado", () => {
    const a = montar(React.createElement(MapaDoPredio, { selecionado: GOLDEN, outros: BOA_VIAGEM, aoEscolher: () => undefined }));
    expect(a.root.findByType(FundoDoMapa).props.cena.camadas.loteDoImovel).not.toBe("");
    // O selecionado é o único com traço cheio de 2,5; os vizinhos são tracejados de 1,3.
    expect(a.root.findAll((n) => typeof n.type !== "string" && n.props.strokeWidth === 2.5)).toHaveLength(0);
  });

  it("sem cobertura: igual a hoje (grade, sem fundo, sem crédito)", () => {
    const a = montar(React.createElement(MapaDoPredio, { selecionado: NO_MAR, outros: [NO_MAR], aoEscolher: () => undefined }));
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(0);
    expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(0);
    expect(textoDe(a)).toContain("grade-do-mapa");
    const img = a.root.find((n) => n.props.role === "img" && typeof n.props.accessibilityLabel === "string");
    expect(img.props.accessibilityLabel).toMatch(/^Mapa cadastral: o prédio em azul/);
  });
});

describe("Topo do dossiê com o fundo", () => {
  const props = { salva: false, aoVoltar: () => undefined, aoAlternarSalvo: () => undefined, aoAbrirMapa: () => undefined };
  const medir = (a: TestRenderer.ReactTestRenderer) => {
    const raiz = a.root.find((n) => typeof n.props.onLayout === "function" && n.props.style?.aspectRatio === 16 / 10);
    act(() => raiz.props.onLayout({ nativeEvent: { layout: { width: 375, height: 234 } } }));
  };

  it("sem fotos: mapa parado com fundo, crédito e rótulo do entorno; os botões continuam", () => {
    const a = montar(React.createElement(TopoDoDossie, { ...props, predio: GOLDEN }));
    medir(a);
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(1);
    expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(1);
    expect(a.root.findAllByType(GradeArquitetonica)).toHaveLength(0);
    const img = a.root.find((n) => n.props.role === "img");
    expect(img.props.accessibilityLabel).toMatch(/^Mapa do entorno, bairro Boa Viagem\./);
    // Pressionavel envolve um Pressable: cada botão aparece duas vezes na árvore de componentes.
    expect([...new Set(botoes(a).map((b) => b.props.accessibilityLabel))]).toEqual(["Voltar aos imóveis", "Salvar imóvel", "Abrir mapa do lote e das obras próximas"]);
  });

  it("com fotos: nada muda (sem fundo)", () => {
    const a = montar(React.createElement(TopoDoDossie, { ...props, predio: GOLDEN, fotos: ["https://exemplo.invalid/a.jpg"] }));
    medir(a);
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(0);
    expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(0);
  });

  it("sem cobertura: o contorno solto sobre a grade, como antes", () => {
    const a = montar(React.createElement(TopoDoDossie, { ...props, predio: NO_MAR }));
    medir(a);
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(0);
    expect(a.root.findAllByType(GradeArquitetonica)).toHaveLength(1);
    expect(a.root.find((n) => n.props.role === "img").props.accessibilityLabel).toBe("Contorno do lote do prédio, a partir do cadastro da Prefeitura");
  });
});
