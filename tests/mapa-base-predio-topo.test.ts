// O fundo do mapa-base (18/11/2026) na confirmação do prédio e no topo do dossiê, com os arquivos de verdade (leitor
// síncrono nos testes). Sem cobertura, os dois ficam como antes.
import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { Edificio } from "../src/dados/contratos";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import { FOLGA_EM_VOLTA_DO_LOTE_M, METROS_MINIMOS_NA_LARGURA, metrosNaLarguraDoTopo, quadroDoTopo, TopoDoDossie } from "../src/componentes/dossie-v1/Topo";
import { FundoDoMapa, CreditoDaBase } from "../src/componentes/mapa/FundoDoMapa";
import { alturaDoPe, MapaDoPredio } from "../src/componentes/predio/MapaDoPredio";
import { caixaDaCena, montarCena, paraDesenhoDaCena, projetorLocal } from "../src/componentes/predio/projecao";
import { GradeArquitetonica } from "../src/componentes/GradeArquitetonica";
import { TemaDoApp } from "../src/tema/Tema";
import { arquivosDoFundoEmVolta, camadasParaDepois } from "../src/dados/camadasDasTelas";
import * as mapaBase from "../src/dados/recife/mapaBase";

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
  // O fundo do /predio só monta depois da primeira medida (no jest o onLayout não dispara sozinho).
  if (el.type === MapaDoPredio) medir(arvore);
  return arvore;
}
function medir(a: TestRenderer.ReactTestRenderer, largura = 340) {
  const no = a.root.findAll((n) => typeof n.type === "string" && typeof n.props.onLayout === "function")[0];
  if (no) act(() => no.props.onLayout({ nativeEvent: { layout: { width: largura, height: 180 } } }));
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

// Revisão de 18/11/2026: crédito embaixo no /predio, descrição num nó só e enquadramento do topo com lote grande.
describe("revisão do mapa-base no /predio e no topo", () => {
  const TORRE = edificiosDoBairro("torre").find((e) => e.id === "31950-280")!;
  const comRotulo = (a: TestRenderer.ReactTestRenderer) =>
    a.root.findAll((n) => typeof n.type !== "string" && typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.includes("Mapa do entorno"));

  it("/predio: o crédito fica embaixo, junto da faixa, e o pé inteiro é obstáculo e fica fora do enquadramento", () => {
    const a = montar(React.createElement(MapaDoPredio, { selecionado: GOLDEN, outros: BOA_VIAGEM, aoEscolher: () => undefined }));
    const pe = a.root.find((n) => n.props.testID === "pe-do-mapa-do-predio" && typeof n.type !== "string");
    expect(pe.findAllByType(CreditoDaBase)).toHaveLength(1);
    expect(pe.props.style).toMatchObject({ position: "absolute", bottom: 8 });
    expect(JSON.stringify(pe.props.style)).not.toContain('"top"');
    // A 340 px a frase quebra em duas linhas: 8 de margem + 36 da faixa + 2 + 14 do crédito.
    expect(alturaDoPe(340, true)).toBe(60);
    expect(alturaDoPe(1200, true)).toBe(46);
    const fundo = a.root.findByType(FundoDoMapa).props.cena;
    const altura = fundo.altura as number;
    // Nenhum nome de rua ou de bairro entra na faixa do pé.
    for (const b of fundo.bairros as { y: number; tamanho: number }[]) expect(b.y + b.tamanho / 2).toBeLessThanOrEqual(altura - alturaDoPe(340, true) + 1);
    // O pino fica acima do pé.
    const cena = montarCena(GOLDEN, BOA_VIAGEM, { largura: 340, altura: 180, reservaInferior: alturaDoPe(340, true) });
    expect(cena.pino[1]).toBeLessThan(180 - alturaDoPe(340, true));
  });

  it("/predio e topo: a descrição do entorno fica num nó só e o desenho fica escondido da acessibilidade", () => {
    const p = montar(React.createElement(MapaDoPredio, { selecionado: GOLDEN, outros: BOA_VIAGEM, aoEscolher: () => undefined }));
    expect(comRotulo(p)).toHaveLength(1);
    expect(comRotulo(p)[0]!.findAll((n) => n.props["aria-hidden"] === true && typeof n.type !== "string").length).toBeGreaterThan(0);
    const t = montar(React.createElement(TopoDoDossie, { salva: false, aoVoltar: () => undefined, aoAlternarSalvo: () => undefined, aoAbrirMapa: () => undefined, predio: GOLDEN }));
    act(() => t.root.find((n) => typeof n.props.onLayout === "function" && n.props.style?.aspectRatio === 16 / 10).props.onLayout({ nativeEvent: { layout: { width: 375, height: 234 } } }));
    expect(comRotulo(t)).toHaveLength(1);
    expect(comRotulo(t)[0]!.findAll((n) => n.props["aria-hidden"] === true && typeof n.type !== "string").length).toBeGreaterThan(0);
  });

  it("topo: lote pequeno fica em 220 m; lote grande cabe inteiro com folga para a rua em volta", () => {
    expect(metrosNaLarguraDoTopo(GOLDEN.centro, GOLDEN.poligono, 375, 234)).toBe(METROS_MINIMOS_NA_LARGURA);
    expect(metrosNaLarguraDoTopo(GOLDEN.centro, null, 375, 234)).toBe(METROS_MINIMOS_NA_LARGURA);
    // Um lote de 300 m × 200 m: o quadro passa de 220 m e o lote cabe com a folga dos dois lados.
    const [lon, lat] = GOLDEN.centro;
    const g = 1 / 111195;
    const grande: [number, number][] = [[lon - 150 * g, lat - 100 * g], [lon + 150 * g, lat - 100 * g], [lon + 150 * g, lat + 100 * g], [lon - 150 * g, lat + 100 * g]];
    const m = metrosNaLarguraDoTopo(GOLDEN.centro, grande, 375, 234);
    expect(m).toBeGreaterThan(300 + 2 * FOLGA_EM_VOLTA_DO_LOTE_M - 10);
    const { paraDesenho } = quadroDoTopo(GOLDEN.centro, 375, 234, m);
    for (const p of grande) {
      const [x, y] = paraDesenho(p);
      expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(375);
      expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(234);
    }
  });

  it("topo da Torre (lote grande do caso de teste): o lote cabe no quadro com folga e algum nome de rua aparece", () => {
    expect(TORRE).toBeDefined();
    const m = metrosNaLarguraDoTopo(TORRE.centro, TORRE.poligono, 375, 234);
    const { paraDesenho } = quadroDoTopo(TORRE.centro, 375, 234, m);
    const porMetro = 375 / m;
    const projetar = projetorLocal(TORRE.centro);
    for (const p of TORRE.poligono!) {
      const [x, y] = paraDesenho(p);
      expect(Math.min(x, 375 - x, y, 234 - y)).toBeGreaterThanOrEqual(FOLGA_EM_VOLTA_DO_LOTE_M * porMetro - 1);
      expect(projetar(p)).toBeDefined();
    }
    const a = montar(React.createElement(TopoDoDossie, { salva: false, aoVoltar: () => undefined, aoAlternarSalvo: () => undefined, aoAbrirMapa: () => undefined, predio: TORRE }));
    act(() => a.root.find((n) => typeof n.props.onLayout === "function" && n.props.style?.aspectRatio === 16 / 10).props.onLayout({ nativeEvent: { layout: { width: 375, height: 234 } } }));
    const cena = a.root.findByType(FundoDoMapa).props.cena;
    expect(cena.rotulos.length).toBeGreaterThan(0);
  });
});

// 18/11/2026 (última revisão): fundo só depois da medida, topo sem nomes de bairro e pré-carga dos arquivos do fundo.
describe("última revisão do mapa-base nas telas", () => {
  it("/predio: antes do onLayout não há fundo nem crédito e o gancho não pediu arquivo; depois, uma cena só", () => {
    const pedidos = jest.spyOn(mapaBase, "arquivosDoMapaBaseParaOQuadro");
    try {
      let a!: TestRenderer.ReactTestRenderer;
      act(() => {
        a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(MapaDoPredio, { selecionado: GOLDEN, outros: BOA_VIAGEM, aoEscolher: () => undefined })));
      });
      expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(0);
      expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(0);
      expect(pedidos).not.toHaveBeenCalled();
      medir(a, 343);
      const fundos = a.root.findAllByType(FundoDoMapa);
      expect(fundos).toHaveLength(1);
      expect(fundos[0]!.props.cena.largura).toBe(343);
      expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(1);
      a.unmount();
    } finally {
      pedidos.mockRestore();
    }
  });

  it("topo: o desenho não traz nomes de bairro (o título já diz o bairro); os nomes de rua continuam", () => {
    const t = montar(React.createElement(TopoDoDossie, { salva: false, aoVoltar: () => undefined, aoAlternarSalvo: () => undefined, aoAbrirMapa: () => undefined, predio: GOLDEN }));
    act(() => t.root.find((n) => typeof n.props.onLayout === "function" && n.props.style?.aspectRatio === 16 / 10).props.onLayout({ nativeEvent: { layout: { width: 375, height: 234 } } }));
    const cena = t.root.findByType(FundoDoMapa).props.cena;
    expect(cena.bairros).toEqual([]);
    expect(cena.rotulos.length).toBeGreaterThan(0);
  });

  it("camadasParaDepois leva o mapa-base do bairro e o da cidade; bairro sem arquivo fica só com a cidade", () => {
    const depois = camadasParaDepois("boa-viagem");
    expect(depois).toContain(mapaBase.arquivoDoMapaBase("boa-viagem"));
    expect(depois).toContain(mapaBase.arquivoDaCidade());
    expect(new Set(depois).size).toBe(depois.length);
    expect(camadasParaDepois(null)).toEqual([mapaBase.arquivoDaCidade()]);
  });

  it("Por perto: adianta os bairros cuja caixa toca ~1,3 km em volta do centro e a cidade, sem repetir", () => {
    const arquivos = arquivosDoFundoEmVolta(GOLDEN.centro);
    expect(arquivos).toContain(mapaBase.arquivoDoMapaBase("boa-viagem"));
    expect(arquivos).toContain(mapaBase.arquivoDaCidade());
    expect(new Set(arquivos).size).toBe(arquivos.length);
    // Um quadro de 1,3 km não chega a todos os bairros da cidade.
    expect(arquivos.length).toBeLessThan(10);
    // No mar, longe de tudo: só a cidade.
    expect(arquivosDoFundoEmVolta(NO_MAR.centro)).toEqual([mapaBase.arquivoDaCidade()]);
  });
});
