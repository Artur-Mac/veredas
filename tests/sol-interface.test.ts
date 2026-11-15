import { afterEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Botao } from "../src/componentes/Botao";
import { Pressionavel } from "../src/componentes/Pressionavel";
import { CapturaSolar } from "../src/componentes/sol/Captura";
import { ExploracaoSolar } from "../src/componentes/sol/Exploracao";
import type { JanelaSolar } from "../src/dados/sol/contratos";
import { TemaDoApp, TemaEscuro } from "../src/tema/Tema";
import { CORES_ESCURO } from "../src/tema/tokens";

jest.mock("expo-router", () => ({ useFocusEffect: (cb: () => (() => void) | void) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const r = require("react") as typeof React; r.useEffect(cb, [cb]);
} }));
jest.mock("../src/plataforma/bussolaSolar", () => ({ temBussolaSolar: false, fonteDaBussolaSolar: jest.fn() }));

const montadas: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => { act(() => montadas.splice(0).forEach(a => a.unmount())); });
function montar(no: React.ReactNode, escuro = false) {
  let a!: TestRenderer.ReactTestRenderer;
  act(() => { a = TestRenderer.create(React.createElement(TemaDoApp, null, escuro ? React.createElement(TemaEscuro, null, no) : no)); });
  montadas.push(a); return a;
}
function textos(no: unknown): string {
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textos).join(" ");
  return no && typeof no === "object" && "children" in no ? textos(no.children) : "";
}
async function tocar(a: TestRenderer.ReactTestRenderer, rotulo: string) {
  const b = a.root.findAllByType(Botao).find(b => b.props.rotulo === rotulo);
  if (!b) throw new Error(`Botão ausente: ${rotulo}`);
  await act(async () => { b.props.onPress?.(); for (let i=0;i<10;i++) await Promise.resolve(); });
}
describe("interface solar: uma decisão por vez", () => {
  it("não guarda norte por padrão; revela o ajuste fino só por escolha e preserva a direção se falhar", async () => {
    const guardar = jest.fn<(j: JanelaSolar) => Promise<void>>().mockRejectedValueOnce(new Error("sem espaço"));
    const a = montar(React.createElement(CapturaSolar, { existente: null, coordenada: null, aoGuardar: guardar, aoCancelar: () => {} }));
    expect(a.root.findAllByType(Botao).find(b => b.props.rotulo === "Guardar direção")?.props.desativado).toBe(true);
    expect(a.root.findAll(n => n.props.role === "slider")).toHaveLength(0);
    // As escolhas expõem o texto como filho do componente Texto, sem depender da árvore nativa.
    const escolha = a.root.findAllByType(Pressionavel).find(n => n.findAll(x => x.props.children === "oeste").length > 0);
    expect(escolha).toBeDefined();act(() => escolha!.props.onPress?.({} as never));
    await tocar(a, "Guardar direção");expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ graus: 270, origem: "manual", referencia: "verdadeiro", coordenada: null }));
    expect(textos(a.toJSON())).toContain("A direção continua aqui");
    expect(a.root.findAllByType(Botao).find(b => b.props.rotulo === "Guardar direção")?.props.desativado).toBe(false);
    await tocar(a, "Refinar direção");expect(a.root.findAll(n => n.props.role === "slider").length).toBeGreaterThan(0);
  });
  it("respeita os tokens escuros sem introduzir outra paleta", () => {
    const a = montar(React.createElement(CapturaSolar, { existente: null, coordenada: null, aoGuardar: async () => {}, aoCancelar: () => {} }), true);
    expect(a.root.findAll(n => n.props.fill === CORES_ESCURO["cor-papel-claro"]).length).toBeGreaterThan(0);
  });
  it("não habilita comparação ou sombras quando falta localização", () => {
    const j: JanelaSolar = { id: "janela", nome: "Sala", graus: 270, origem: "manual", referencia: "verdadeiro", observadoEm: null, revisadoEm: null,
      coordenada: null, calibracao: null, andar: null, posicao: null, protecoes: [] };
    const a = montar(React.createElement(ExploracaoSolar, { janela: j, analiseId: "a", predio: null, andarDeclarado: null, lista: [], aoGuardar: async () => {}, aoEditar: () => {} }));
    expect(a.root.findAllByType(Botao).find(b => b.props.rotulo === "Ver entorno")?.props.desativado).toBe(true);
    expect(textos(a.toJSON())).toContain("precisamos da localização do imóvel");
  });
});
