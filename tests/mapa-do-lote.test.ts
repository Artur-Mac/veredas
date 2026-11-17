// Mapa do lote (15/11/2026): seletor 2D/2.5D visível, zoom em passos, arraste preso ao quadro e toque na obra com a
// distância e o estado da licença (retrato da base, P05).
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { MapaDoLote } from "../src/componentes/dossie-v1/MapaDoLote";
import { ESTADO_INICIAL, afastar, aproximar, arrastar, naTela, recentrar, tocarObra, transformacao, trocarModo } from "../src/componentes/dossie-v1/mapaInterativo";
import { linhasDeObras, textoDaLicenca } from "../src/componentes/dossie-v1/textos";
import { Pressionavel } from "../src/componentes/Pressionavel";
import type { ObrasProximas } from "../src/dados/contratos";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("expo-router", () => ({}));

describe("estado do mapa", () => {
  it("zoom em passos de 1 a 3, sem passar dos extremos", () => {
    let e = ESTADO_INICIAL;
    e = aproximar(e, 320, 280); expect(e.zoom).toBe(1.5);
    e = aproximar(aproximar(aproximar(e, 320, 280), 320, 280), 320, 280); expect(e.zoom).toBe(3);
    e = afastar(afastar(afastar(afastar(e, 320, 280), 320, 280), 320, 280), 320, 280); expect(e.zoom).toBe(1);
  });
  it("sem zoom não arrasta; com zoom o arraste fica preso para o desenho não sair do quadro", () => {
    expect(arrastar(ESTADO_INICIAL, 50, 50, 320, 280)).toMatchObject({ dx: 0, dy: 0 });
    const z2 = aproximar(aproximar(ESTADO_INICIAL, 320, 280), 320, 280);
    expect(z2.zoom).toBe(2);
    expect(arrastar(z2, 1000, -1000, 320, 280)).toMatchObject({ dx: 160, dy: -140 });
    expect(recentrar(arrastar(z2, 30, 30, 320, 280))).toMatchObject({ zoom: 1, dx: 0, dy: 0 });
  });
  it("aproximar mantém o pino do prédio no mesmo lugar do quadro (dentro dos limites)", () => {
    const pino: [number, number] = [120, 170];
    const antes = naTela(ESTADO_INICIAL, ...pino, 320, 280);
    const z = aproximar(ESTADO_INICIAL, 320, 280, pino);
    expect(naTela(z, ...pino, 320, 280)).toEqual(antes);
    const z3 = aproximar(aproximar(z, 320, 280, pino), 320, 280, pino);
    const [x, y] = naTela(z3, ...pino, 320, 280);
    expect(Math.abs(x - antes[0])).toBeLessThan(0.001);
    expect(Math.abs(y - antes[1])).toBeLessThan(0.001);
    expect(afastar(afastar(afastar(z3, 320, 280, pino), 320, 280, pino), 320, 280, pino)).toMatchObject({ zoom: 1, dx: 0, dy: 0 });
  });
  it("o ponto do centro fica no centro; os outros se afastam com o zoom", () => {
    const z2 = { ...ESTADO_INICIAL, zoom: 2 };
    expect(naTela(z2, 160, 140, 320, 280)).toEqual([160, 140]);
    expect(naTela(z2, 170, 140, 320, 280)).toEqual([180, 140]);
    expect(transformacao(z2, 320, 280)).toBe("translate(160 140) scale(2) translate(-160 -140)");
  });
  it("tocar a mesma obra de novo fecha o detalhe; trocar o modo mantém o zoom", () => {
    const e = tocarObra(ESTADO_INICIAL, 2);
    expect(e.obra).toBe(2);
    expect(tocarObra(e, 2).obra).toBeNull();
    expect(trocarModo({ ...e, zoom: 2 }, "tarde")).toMatchObject({ modo: "tarde", zoom: 2 });
  });
});

describe("estado da licença em texto", () => {
  it("válida, vencida, emitida, deferida sem data, em análise e impacto", () => {
    expect(textoDaLicenca(["valida", "2027-11-27", false])).toBe("Licença válida até 11/2027");
    expect(textoDaLicenca(["vencida", "2024-10-25", null])).toBe("Licença vencida em 10/2024");
    expect(textoDaLicenca(["emitida", null, null])).toBe("Licença emitida, sem validade publicada");
    expect(textoDaLicenca(["deferida", null, true])).toBe("Processo deferido, sem data de licença publicada · empreendimento de impacto");
    expect(textoDaLicenca(["em_analise", null, false])).toBe("Licença em análise");
    expect(textoDaLicenca(["outra", null, null])).toBeNull();
    expect(textoDaLicenca(undefined)).toBeNull();
  });
});

const montadas: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => { act(() => montadas.splice(0).forEach((a) => a.unmount())); });
function textos(no: unknown): string {
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textos).join(" ");
  return no && typeof no === "object" && "children" in no ? textos((no as { children: unknown }).children) : "";
}
const porRotulo = (a: TestRenderer.ReactTestRenderer, r: RegExp) => a.root.findAllByType(Pressionavel).find((p) => r.test(String(p.props.accessibilityLabel ?? "")));

describe("MapaDoLote na tela", () => {
  const predio = edificiosDoBairro("gracas").find((e) => e.poligono && e.pavimentos)!;
  const [lon, lat] = predio.centro;
  const obras: ObrasProximas["recentes"] = [
    { categoria: "construcao", descricao: "ALVARA DE CONSTRUCAO INICIAL", data: "2026-05", situacao: "DEFERIDO", centro: [lon + 0.0006, lat], distanciaM: 66, licenca: ["valida", "2027-11-27", false] },
    { categoria: "demolicao", descricao: "ALVARA DE DEMOLICAO", data: "2025-08", situacao: "DEFERIDO", centro: [lon, lat + 0.0007], distanciaM: 78 },
  ];
  function montar() {
    let a!: TestRenderer.ReactTestRenderer;
    act(() => { a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(MapaDoLote, { predio, obras, vizinhos: edificiosDoBairro("gracas") }))); });
    montadas.push(a);
    return a;
  }
  it("o seletor 2D/2.5D aparece com quatro modos e o volume diz que é estimado", () => {
    const a = montar();
    const modos = a.root.findAllByType(Pressionavel).filter((p) => p.props.accessibilityRole === "radio");
    expect(modos.map((p) => p.props.accessibilityLabel)).toEqual(["Ver mapa: Planta 2D", "Ver mapa: Volume · manhã", "Ver mapa: Volume · meio-dia", "Ver mapa: Volume · tarde"]);
    expect(textos(a.toJSON())).not.toContain("Volume estimado");
    act(() => modos[3]!.props.onPress());
    expect(textos(a.toJSON())).toContain("Volume estimado: a altura do cadastro desenhada sobre o contorno do lote");
  });
  it("aproximar muda o zoom dito ao leitor de tela e mostra Recentrar", () => {
    const a = montar();
    const img = () => a.root.findAll((n) => n.props.role === "img")[0]!.props.accessibilityLabel as string;
    expect(img()).toContain("Zoom 1 vezes");
    expect(porRotulo(a, /^Voltar ao enquadramento/)).toBeUndefined();
    act(() => porRotulo(a, /^Aproximar o mapa$/)!.props.onPress());
    expect(img()).toContain("Zoom 1,5 vezes");
    expect(porRotulo(a, /^Voltar ao enquadramento/)).toBeDefined();
    expect(textos(a.toJSON())).toContain("Arraste o mapa para ver em volta.");
  });
  it("tocar o ponto da obra mostra a distância e a licença; sem o dado, diz que não foi publicado", () => {
    const a = montar();
    act(() => porRotulo(a, /^Obra 1: Construção/)!.props.onPress());
    let t = textos(a.toJSON());
    expect(t).toContain("1. Construção nova a 66 m");
    expect(t).toContain("Licença válida até 11/2027");
    expect(t).toContain("não prova que a obra começou, parou ou terminou");
    act(() => porRotulo(a, /^Obra 2: Demolição/)!.props.onPress());
    t = textos(a.toJSON());
    expect(t).toContain("Estado da licença não publicado nesta versão do índice.");
  });
  it("a lista de obras leva a licença na linha e no rótulo acessível", () => {
    const linhas = linhasDeObras({ licencasDeObra: 2, relevantes24m: 2, demolicoes24m: 1, recentes: obras });
    expect(linhas[0]!.licenca).toBe("Licença válida até 11/2027");
    expect(linhas[0]!.rotuloAcessivel).toContain("Licença válida até 11/2027");
    expect(linhas[1]!.licenca).toBeNull();
  });
});
