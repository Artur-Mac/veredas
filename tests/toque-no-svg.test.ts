/** @jest-environment jsdom */
// T4 (18/11/2026): toque em forma SVG sem erro de console na web. O `onPress` numa forma do react-native-svg fazia a
// versão web da biblioteca espalhar no DOM seis handlers de responder do React Native ("Unknown event handler property
// `onStartShouldSetResponder`…", seis por tela do dossiê). O teste passa as props pelo `prepare` de verdade da biblioteca
// (o caminho da web) e pelo React DOM, e escuta o console.
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { toqueNoSvg } from "../src/componentes/toqueNoSvg";
import { CanvasSolSombraBrisa25D } from "../src/componentes/visual/CanvasSolSombraBrisa25D";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import { inferirFachadasDoEdificio } from "../src/dados/sol/inferirFachadas";
import { TemaDoApp } from "../src/tema/Tema";

// Sem tipos no projeto (react-dom não tem @types aqui; o fonte da biblioteca não passa no tsc estrito do app): require.
/* eslint-disable @typescript-eslint/no-require-imports */
const { createRoot } = require("react-dom/client") as { createRoot: (no: Element) => { render: (e: React.ReactElement) => void; unmount: () => void } };
const { prepare } = require("react-native-svg/src/web/utils/prepare") as { prepare: (instancia: unknown, props: unknown) => Record<string, unknown> };
/* eslint-enable @typescript-eslint/no-require-imports */

const RESPONDER = /^on(StartShouldSetResponder|MoveShouldSetResponder|Responder[A-Z])/;

/** A forma como o react-native-svg a monta na web: os handlers do toque existem na instância (SvgTouchableMixin). */
function formaNaWeb(props: Record<string, unknown>): Record<string, unknown> {
  const semAcao = () => undefined;
  const instancia = {
    props,
    elementRef: { current: null },
    touchableHandleStartShouldSetResponder: () => true,
    touchableHandleResponderTerminationRequest: () => true,
    touchableHandleResponderGrant: semAcao,
    touchableHandleResponderMove: semAcao,
    touchableHandleResponderRelease: semAcao,
    touchableHandleResponderTerminate: semAcao,
  };
  const { ref: _ref, ...limpas } = prepare(instancia, props);
  return limpas;
}

/**
 * Desenha a forma pelo React DOM (cliente, num documento de verdade) e devolve o que ele reclamou no console.
 * `comAForma` recebe o elemento desenhado (para clicar nele).
 */
function reclamacoesDoReactDom(props: Record<string, unknown>, comAForma?: (forma: Element) => void): string[] {
  const espia = jest.spyOn(console, "error").mockImplementation(() => undefined);
  const caixa = document.createElement("div");
  document.body.appendChild(caixa);
  const raiz = createRoot(caixa);
  try {
    act(() => raiz.render(React.createElement("svg", null, React.createElement("polygon", { points: "0,0 10,0 10,10", ...props }))));
    const forma = caixa.querySelector("polygon");
    expect(forma).not.toBeNull();
    if (forma && comAForma) act(() => comAForma(forma));
    return espia.mock.calls.map((c) => c.map(String).join(" "));
  } finally {
    act(() => raiz.unmount());
    caixa.remove();
    espia.mockRestore();
  }
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("toque em forma SVG na web", () => {
  it("o defeito existe sem o cuidado: onPress direto leva seis handlers de responder ao DOM e o React reclama de cada um", () => {
    const props = formaNaWeb({ onPress: () => undefined });
    expect(Object.keys(props).filter((k) => RESPONDER.test(k))).toHaveLength(6);
    const reclamacoes = reclamacoesDoReactDom(props).filter((r) => r.includes("Unknown event handler property"));
    expect(reclamacoes).toHaveLength(6);
    expect(reclamacoes.join(" ")).toContain("onStartShouldSetResponder");
    expect(reclamacoes.join(" ")).toContain("onResponderGrant");
  });

  it("com toqueNoSvg: nenhum handler de responder chega ao DOM, o React não reclama e o clique chama o toque", () => {
    const aoTocar = jest.fn();
    const props = formaNaWeb({ fill: "#fff", ...toqueNoSvg(aoTocar, "web") });
    expect(Object.keys(props).filter((k) => RESPONDER.test(k))).toEqual([]);
    // Um clique de verdade no elemento do documento chega ao toque.
    const clicar = (forma: Element) => void forma.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(reclamacoesDoReactDom(props, clicar)).toEqual([]);
    expect(aoTocar).toHaveBeenCalledTimes(1);
    // O evento do DOM não vaza para quem só quer saber do toque.
    expect(aoTocar).toHaveBeenCalledWith();
  });

  it("sem toque, a forma não vira tocável em plataforma nenhuma", () => {
    expect(toqueNoSvg(undefined, "web")).toEqual({});
    expect(toqueNoSvg(null, "ios")).toEqual({});
    const props = formaNaWeb({ fill: "#fff", ...toqueNoSvg(undefined, "web") });
    expect(props.onClick).toBeUndefined();
    expect(reclamacoesDoReactDom(props)).toEqual([]);
  });

  it("no nativo, o toque continua sendo onPress", () => {
    const aoTocar = jest.fn();
    for (const plataforma of ["ios", "android"]) {
      const props = toqueNoSvg(aoTocar, plataforma);
      expect(Object.keys(props)).toEqual(["onPress"]);
      props.onPress?.();
    }
    expect(aoTocar).toHaveBeenCalledTimes(2);
  });
});

describe("paredes do volume 2.5D do dossiê (de onde vinham os erros)", () => {
  const predio = edificiosDoBairro("boa-viagem").find((e) => e.poligono && e.poligono.length >= 3)!;
  const inferencia = inferirFachadasDoEdificio({ edificio: predio, textoAnuncio: "" });
  const centro = predio.centro;

  it("a parede continua escolhendo a fachada no toque", () => {
    const aoSelecionar = jest.fn();
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CanvasSolSombraBrisa25D, { inferencia, fachadaSelecionada: "frente_rua", aoSelecionarFachada: aoSelecionar, andar: 5, aoAlterarAndar: () => undefined, pavimentosTotais: 14, centro }),
        ),
      );
    });
    const paredes = arvore.root.findAll((n) => typeof n.type !== "string" && typeof n.props.testID === "string" && (n.props.testID as string).startsWith("canvas-wall-") && typeof n.props.onPress === "function");
    expect(paredes.length).toBeGreaterThan(0);
    const parede = paredes[0]!;
    act(() => (parede.props.onPress as () => void)());
    expect(aoSelecionar).toHaveBeenCalledWith((parede.props.testID as string).replace("canvas-wall-", ""));
    // Na web, as mesmas props da parede passam pelo react-native-svg sem deixar handler de responder no DOM.
    const naWeb = formaNaWeb({ points: "0,0 1,0 1,1", ...toqueNoSvg(parede.props.onPress as () => void, "web") });
    expect(Object.keys(naWeb).filter((k) => RESPONDER.test(k))).toEqual([]);
    expect(reclamacoesDoReactDom(naWeb)).toEqual([]);
    act(() => arvore.unmount());
  });
});
