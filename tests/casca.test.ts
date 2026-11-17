// Foco da gaveta na web (T5): o foco entra ao abrir, o Tab fica preso dentro dela e o foco volta a quem a abriu ao
// fechar. O DOM é simulado com uma árvore mínima (ordem de documento, `contains`, `compareDocumentPosition`), porque o
// Jest roda sem navegador; a lógica é a mesma que roda no React Native Web.
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Platform } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { Gaveta } from "../src/componentes/casca/Gaveta";
import * as focoDaGaveta from "../src/componentes/casca/focoDaGaveta";
import { devolverFoco, focarDentro, focaveisDe, prenderTab, useFocoDaGaveta } from "../src/componentes/casca/focoDaGaveta";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ——— DOM mínimo ————————————————————————————————————————————————————————————————————————

type Documento = { activeElement: No | null; body: No };

class No {
  filhos: No[] = [];
  pai: No | null = null;
  atributos = new Map<string, string>();
  isConnected = true;
  /** `focavel`: o Tab alcança; `titulo`: é o `<h2>` da gaveta. */
  constructor(
    readonly nome: string,
    readonly tipo: "caixa" | "titulo" | "focavel" = "caixa",
    private readonly doc?: Documento,
  ) {}

  adicionar(...novos: No[]): this {
    for (const no of novos) {
      no.pai = this;
      this.filhos.push(no);
    }
    return this;
  }

  /** Ordem de documento (pré-ordem). */
  private descendentes(): No[] {
    return this.filhos.flatMap((f) => [f, ...f.descendentes()]);
  }
  private raiz(): No {
    return this.pai ? this.pai.raiz() : this;
  }
  private posicao(): number {
    return [this.raiz(), ...this.raiz().descendentes()].indexOf(this);
  }

  focus = jest.fn((_opcoes?: unknown) => {
    if (this.doc) this.doc.activeElement = this;
  });
  contains(outro: unknown): boolean {
    for (let n = outro as No | null; n; n = n.pai) if (n === this) return true;
    return false;
  }
  querySelector(seletor: string): No | null {
    return this.querySelectorAll(seletor)[0] ?? null;
  }
  querySelectorAll(seletor: string): No[] {
    const procurado = seletor.startsWith("h1") ? "titulo" : "focavel";
    return this.descendentes().filter((n) => n.tipo === procurado);
  }
  getAttribute(nome: string): string | null {
    return this.atributos.get(nome) ?? null;
  }
  hasAttribute(nome: string): boolean {
    return this.atributos.has(nome);
  }
  setAttribute(nome: string, valor: string): void {
    this.atributos.set(nome, valor);
  }
  getClientRects(): number[] {
    return [1];
  }
  compareDocumentPosition(outro: No): number {
    if (outro === this) return 0;
    if (this.contains(outro)) return 16 | 4;
    if (outro.contains(this)) return 8 | 2;
    return outro.posicao() > this.posicao() ? 4 : 2;
  }
}

/** Painel de uma gaveta: título, "Fechar", e dois controles no conteúdo. */
function montarPainel(doc: Documento) {
  const painel = new No("painel", "caixa", doc);
  const titulo = new No("título", "titulo", doc);
  const fechar = new No("fechar", "focavel", doc);
  const campo = new No("campo", "focavel", doc);
  const botao = new No("botão", "focavel", doc);
  const conteudo = new No("conteúdo", "caixa", doc).adicionar(campo, botao);
  painel.adicionar(new No("cabeçalho", "caixa", doc).adicionar(titulo, fechar), conteudo);
  return { painel, titulo, fechar, campo, botao, conteudo };
}

function criarDocumento(): Documento {
  const body = new No("body");
  return { activeElement: body, body };
}

const asHtml = (no: No) => no as unknown as HTMLElement;
const asDoc = (doc: Documento) => doc as unknown as Document;
const tab = (shiftKey = false) => ({ key: "Tab", shiftKey, preventDefault: jest.fn() });

// ——— Funções puras ————————————————————————————————————————————————————————————————————————

describe("foco da gaveta: funções puras", () => {
  it("o foco entra pelo título, que passa a aceitar foco por programa sem entrar na ordem de Tab", () => {
    const doc = criarDocumento();
    const { painel, titulo } = montarPainel(doc);
    const alvo = focarDentro(asHtml(painel), asDoc(doc));
    expect(alvo).toBe(titulo);
    expect(doc.activeElement).toBe(titulo);
    expect(titulo.getAttribute("tabindex")).toBe("-1");
    expect(titulo.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(focaveisDe(asHtml(painel)).map((n) => (n as unknown as No).nome)).toEqual(["fechar", "campo", "botão"]);
  });

  it("sem título, o foco vai ao primeiro controle; sem controle, ao próprio painel", () => {
    const doc = criarDocumento();
    const comControle = new No("painel", "caixa", doc);
    const primeiro = new No("primeiro", "focavel", doc);
    comControle.adicionar(primeiro, new No("segundo", "focavel", doc));
    expect(focarDentro(asHtml(comControle), asDoc(doc))).toBe(primeiro);

    const vazio = new No("vazio", "caixa", doc);
    expect(focarDentro(asHtml(vazio), asDoc(doc))).toBe(vazio);
    expect(vazio.getAttribute("tabindex")).toBe("-1");
    expect(doc.activeElement).toBe(vazio);
  });

  it("não tira o foco de quem já o tem dentro da gaveta (campo com foco automático)", () => {
    const doc = criarDocumento();
    const { painel, campo, titulo } = montarPainel(doc);
    doc.activeElement = campo;
    expect(focarDentro(asHtml(painel), asDoc(doc))).toBe(campo);
    expect(titulo.focus).not.toHaveBeenCalled();
    expect(doc.activeElement).toBe(campo);
  });

  it("Tab no último controle volta ao primeiro; Shift+Tab no primeiro vai ao último", () => {
    const doc = criarDocumento();
    const { painel, fechar, botao } = montarPainel(doc);
    doc.activeElement = botao;
    const adiante = tab();
    expect(prenderTab(adiante, asHtml(painel), asDoc(doc))).toBe(true);
    expect(adiante.preventDefault).toHaveBeenCalledTimes(1);
    expect(doc.activeElement).toBe(fechar);

    const atras = tab(true);
    expect(prenderTab(atras, asHtml(painel), asDoc(doc))).toBe(true);
    expect(atras.preventDefault).toHaveBeenCalledTimes(1);
    expect(doc.activeElement).toBe(botao);
  });

  it("Shift+Tab no título (antes do primeiro controle) ou no painel vai ao último controle", () => {
    const doc = criarDocumento();
    const { painel, titulo, botao } = montarPainel(doc);
    doc.activeElement = titulo;
    expect(prenderTab(tab(true), asHtml(painel), asDoc(doc))).toBe(true);
    expect(doc.activeElement).toBe(botao);

    doc.activeElement = painel;
    expect(prenderTab(tab(true), asHtml(painel), asDoc(doc))).toBe(true);
    expect(doc.activeElement).toBe(botao);
  });

  it("do título, Tab segue o caminho normal até 'Fechar'; no meio da lista o navegador cuida do Tab", () => {
    const doc = criarDocumento();
    const { painel, titulo, campo } = montarPainel(doc);
    for (const ativo of [titulo, campo]) {
      doc.activeElement = ativo;
      const evento = tab();
      expect(prenderTab(evento, asHtml(painel), asDoc(doc))).toBe(false);
      expect(evento.preventDefault).not.toHaveBeenCalled();
      expect(doc.activeElement).toBe(ativo);
    }
    // Shift+Tab no meio da lista também.
    doc.activeElement = campo;
    expect(prenderTab(tab(true), asHtml(painel), asDoc(doc))).toBe(false);
  });

  it("com o foco fora da gaveta, o Tab o traz de volta para dentro (nos dois sentidos)", () => {
    const doc = criarDocumento();
    const { painel, fechar, botao } = montarPainel(doc);
    const pagina = new No("botão da página", "focavel", doc);
    doc.activeElement = pagina;
    expect(prenderTab(tab(), asHtml(painel), asDoc(doc))).toBe(true);
    expect(doc.activeElement).toBe(fechar);
    doc.activeElement = pagina;
    expect(prenderTab(tab(true), asHtml(painel), asDoc(doc))).toBe(true);
    expect(doc.activeElement).toBe(botao);
  });

  it("sem nenhum controle, o Tab fica no painel; outras teclas passam", () => {
    const doc = criarDocumento();
    const vazio = new No("vazio", "caixa", doc);
    const evento = tab();
    expect(prenderTab(evento, asHtml(vazio), asDoc(doc))).toBe(true);
    expect(evento.preventDefault).toHaveBeenCalledTimes(1);
    expect(doc.activeElement).toBe(vazio);
    const outra = { key: "a", shiftKey: false, preventDefault: jest.fn() };
    expect(prenderTab(outra, asHtml(vazio), asDoc(doc))).toBe(false);
    expect(outra.preventDefault).not.toHaveBeenCalled();
  });

  it("devolverFoco ignora quem não existe mais na página e o corpo da página", () => {
    const doc = criarDocumento();
    const aberto = new No("quem abriu", "focavel", doc);
    devolverFoco(asHtml(aberto), asDoc(doc));
    expect(aberto.focus).toHaveBeenCalledTimes(1);

    const sumiu = new No("sumiu", "focavel", doc);
    sumiu.isConnected = false;
    devolverFoco(asHtml(sumiu), asDoc(doc));
    expect(sumiu.focus).not.toHaveBeenCalled();

    devolverFoco(asHtml(doc.body), asDoc(doc));
    expect(doc.body.focus).not.toHaveBeenCalled();
    expect(() => devolverFoco(null, asDoc(doc))).not.toThrow();
  });
});

// ——— O gancho, com `window` e `document` simulados ——————————————————————————————————————————————

type AoTeclar = (evento: { key: string; shiftKey: boolean; preventDefault: () => void }) => void;

describe("useFocoDaGaveta e a Gaveta, na web", () => {
  const original = {
    document: Object.getOwnPropertyDescriptor(globalThis, "document"),
    window: Object.getOwnPropertyDescriptor(globalThis, "window"),
  };
  let doc: Documento;
  let ouvintes: AoTeclar[];
  let plataforma: { restore: () => void } | null = null;
  const montadas: TestRenderer.ReactTestRenderer[] = [];

  const definir = (nome: "document" | "window", valor: unknown) =>
    Object.defineProperty(globalThis, nome, { value: valor, configurable: true, writable: true });
  const restaurar = (nome: "document" | "window") => {
    const descritor = original[nome];
    if (descritor) Object.defineProperty(globalThis, nome, descritor);
    else delete (globalThis as Record<string, unknown>)[nome];
  };

  beforeEach(() => {
    doc = criarDocumento();
    ouvintes = [];
    definir("document", doc);
    definir("window", {
      addEventListener: (tipo: string, f: AoTeclar) => {
        if (tipo === "keydown") ouvintes.push(f);
      },
      removeEventListener: (tipo: string, f: AoTeclar) => {
        if (tipo === "keydown") ouvintes = ouvintes.filter((o) => o !== f);
      },
    });
    plataforma = jest.replaceProperty(Platform, "OS", "web");
  });
  afterEach(() => {
    for (const arvore of montadas.splice(0)) act(() => arvore.unmount());
    plataforma?.restore();
    restaurar("document");
    restaurar("window");
    jest.restoreAllMocks();
  });

  /** Uma gaveta de mentira: o gancho recebe a referência do painel simulado. */
  function Sonda({ visivel, painel }: { visivel: boolean; painel: { current: unknown } }) {
    useFocoDaGaveta(visivel, painel);
    return null;
  }
  const montarSonda = (visivel: boolean, painel: { current: unknown }) => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(React.createElement(Sonda, { visivel, painel }));
    });
    montadas.push(arvore);
    return arvore;
  };
  const teclarTab = (shiftKey = false) => {
    const evento = { key: "Tab", shiftKey, preventDefault: jest.fn() };
    for (const f of [...ouvintes]) f(evento);
    return evento;
  };

  it("ao abrir, o foco vai para o título; ao fechar, volta para quem abriu a gaveta", () => {
    const abriu = new No("botão que abriu", "focavel", doc);
    doc.activeElement = abriu;
    const { painel, titulo } = montarPainel(doc);
    const arvore = montarSonda(true, { current: painel });
    expect(doc.activeElement).toBe(titulo);
    expect(ouvintes).toHaveLength(1);

    act(() => arvore.update(React.createElement(Sonda, { visivel: false, painel: { current: painel } })));
    expect(ouvintes).toHaveLength(0);
    expect(doc.activeElement).toBe(abriu);
    expect(abriu.focus).toHaveBeenCalledTimes(1);
  });

  it("desmontar a gaveta (rota que fecha) também devolve o foco", () => {
    const abriu = new No("pílula de créditos", "focavel", doc);
    doc.activeElement = abriu;
    const { painel } = montarPainel(doc);
    const arvore = montarSonda(true, { current: painel });
    act(() => arvore.unmount());
    montadas.splice(montadas.indexOf(arvore), 1);
    expect(doc.activeElement).toBe(abriu);
    expect(ouvintes).toHaveLength(0);
  });

  it("o Tab fica preso: do último controle volta ao primeiro, do primeiro com Shift vai ao último", () => {
    const { painel, fechar, botao } = montarPainel(doc);
    montarSonda(true, { current: painel });
    doc.activeElement = botao;
    const adiante = teclarTab();
    expect(adiante.preventDefault).toHaveBeenCalledTimes(1);
    expect(doc.activeElement).toBe(fechar);
    const atras = teclarTab(true);
    expect(atras.preventDefault).toHaveBeenCalledTimes(1);
    expect(doc.activeElement).toBe(botao);
  });

  it("com duas gavetas abertas, só a de cima prende o Tab; fechada a de cima, a de baixo volta a prender", () => {
    const de_baixo = montarPainel(doc);
    const de_cima = montarPainel(doc);
    montarSonda(true, { current: de_baixo.painel });
    const arvoreDeCima = montarSonda(true, { current: de_cima.painel });
    expect(ouvintes).toHaveLength(2);

    doc.activeElement = de_cima.botao;
    teclarTab();
    expect(doc.activeElement).toBe(de_cima.fechar);
    // O Tab não tocou na gaveta de baixo.
    expect(de_baixo.fechar.focus).not.toHaveBeenCalled();

    act(() => arvoreDeCima.unmount());
    montadas.splice(montadas.indexOf(arvoreDeCima), 1);
    doc.activeElement = de_baixo.botao;
    teclarTab();
    expect(doc.activeElement).toBe(de_baixo.fechar);
  });

  it("fora da web não mexe em foco nem em teclado", () => {
    plataforma?.restore();
    plataforma = jest.replaceProperty(Platform, "OS", "ios");
    const abriu = new No("botão", "focavel", doc);
    doc.activeElement = abriu;
    const { painel, titulo } = montarPainel(doc);
    const arvore = montarSonda(true, { current: painel });
    expect(ouvintes).toHaveLength(0);
    expect(titulo.focus).not.toHaveBeenCalled();
    act(() => arvore.unmount());
    montadas.splice(montadas.indexOf(arvore), 1);
    expect(abriu.focus).not.toHaveBeenCalled();
  });

  it("a Gaveta usa o gancho com a referência do painel (role dialog) e devolve o foco ao fechar", () => {
    const espiao = jest.spyOn(focoDaGaveta, "useFocoDaGaveta");
    const abriu = new No("botão que abriu", "focavel", doc);
    doc.activeElement = abriu;
    const aoFechar = jest.fn<() => void>();
    let arvore!: TestRenderer.ReactTestRenderer;
    const propsDaGaveta = (visivel: boolean): React.ComponentProps<typeof Gaveta> => ({
      visivel,
      titulo: "Carteira de créditos",
      aoFechar,
      children: null,
    });
    const gaveta = (visivel: boolean) => React.createElement(TemaDoApp, null, React.createElement(Gaveta, propsDaGaveta(visivel)));
    act(() => {
      arvore = TestRenderer.create(gaveta(true));
    });
    montadas.push(arvore);
    expect(espiao).toHaveBeenCalled();
    const [visivel, referencia] = espiao.mock.calls[0] as [boolean, { current: unknown }];
    expect(visivel).toBe(true);
    expect(referencia).toHaveProperty("current");
    expect(arvore.root.findAll((n) => typeof n.type === "string" && n.props.role === "dialog")).toHaveLength(1);

    act(() => arvore.update(gaveta(false)));
    expect(arvore.root.findAll((n) => typeof n.type === "string" && n.props.role === "dialog")).toHaveLength(0);
    expect(abriu.focus).toHaveBeenCalledTimes(1);
    expect(doc.activeElement).toBe(abriu);
  });
});
