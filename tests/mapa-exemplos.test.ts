// O mapa dos dossiês de exemplo (src/componentes/mapa/Mapa.tsx) sobre o mapa-base de verdade (18/11/2026): o chão é o
// fundo da Prefeitura em volta de lote.centro, os candidatos de "É este o prédio?" são lotes da base, sem cobertura não há
// geometria inventada, e a cena é remontada por janela. O leitor de camadas é síncrono nos testes (configurar-camadas.ts).
import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { G as GrupoSvg, Mask, Path, Rect } from "react-native-svg";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import {
  Mapa,
  janelaDaVista,
  origemDaJanela,
  precisaRemontar,
  caixaDaJanela,
  paraDesenhoDaJanela,
  obstaculosDaFolga,
  retanguloDoPino,
  rotulosNaJanela,
  visivelNaJanela,
  type InfoDosCandidatos,
} from "../src/componentes/mapa/Mapa";
import { FundoDoMapa } from "../src/componentes/mapa/FundoDoMapa";
import type { CenaDoFundo } from "../src/componentes/mapa/fundoDoMapaCena";
import { esquecerCamadas } from "../src/dados/camadas";
import { esquecerMapaBase } from "../src/dados/recife/mapaBase";
import { dossies } from "../src/dados/dossies";
import type { Dossie } from "../src/dados/esquema";
import { coordenadaParaMetros, metrosParaCoordenada } from "../src/dados/geo";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
// O exemplo da tela "Confirmar o lote", o que ela grava no aparelho e para onde ela vai: lidos pelos testes do M1.
type Globais = { __exemplo?: string; __gravado: unknown[]; __destinos: unknown[] };
const G = globalThis as unknown as Globais;
G.__gravado = [];
G.__destinos = [];

jest.mock("expo-router", () => ({
  router: {
    canDismiss: () => false,
    dismissTo: () => undefined,
    replace: (destino: unknown) => void (globalThis as unknown as Globais).__destinos.push(destino),
    back: () => undefined,
    navigate: () => undefined,
  },
  Link: () => null,
}));
jest.mock("../src/navegacao/useDossie", () => ({
  useDossie: () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("../src/dados/dossies") as typeof import("../src/dados/dossies")).dossies.get((globalThis as unknown as Globais).__exemplo ?? "boa-viagem"),
}));
jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../src/estado/Aparelho", () => ({
  useAparelho: () => ({
    mudar: (mudanca: (atuais: { lotesConfirmados: Record<string, boolean> }) => unknown) =>
      void (globalThis as unknown as Globais).__gravado.push(mudanca({ lotesConfirmados: {} })),
  }),
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

/** Todo o texto da tela, com os textos montados de vários pedaços (string e expressão) juntos. */
function textoCorrido(r: TestRenderer.ReactTestRenderer): string {
  const partes: string[] = [];
  for (const n of r.root.findAll((x) => x.props.children !== undefined)) {
    const c = n.props.children as unknown;
    if (typeof c === "string") partes.push(c);
    else if (Array.isArray(c) && c.every((x) => typeof x === "string" || x === null || x === false)) partes.push(c.filter(Boolean).join(""));
  }
  return partes.join(" | ");
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

describe("rótulos dentro da parte visível", () => {
  const j = janelaDaVista({ escala: 0.25, centro: [0, 0] }, { largura: 375, altura: 500 });

  it("a folga vira obstáculo em volta do mapa visível, e o pino inteiro (não só a ponta) também", () => {
    const folga = obstaculosDaFolga(j);
    expect(folga).toHaveLength(4);
    expect(folga[0]).toEqual([-j.folgaX - 1, -j.folgaY - 1, j.largura + j.folgaX + 1, 4]);
    expect(folga[3]![0]).toBe(j.largura - 4);
    const [x0, y0, x1, y1] = retanguloDoPino(j);
    expect([x0, x1]).toEqual([j.largura / 2 - 15, j.largura / 2 + 15]);
    expect(y1 - y0).toBeGreaterThanOrEqual(36);
    expect(y1).toBeGreaterThanOrEqual(j.altura / 2);
  });

  it("rotulosNaJanela tira o rótulo de rua e o nome de bairro que saem da janela, e mantém os que cabem", () => {
    const cena = {
      rotulos: [
        { id: "a", nome: "Dentro", caixas: [[10, 10, 20, 20], [20, 10, 30, 20]] },
        { id: "b", nome: "Cortado", caixas: [[90, 10, 110, 20]] },
      ],
      bairros: [
        { slug: "x", nome: "X", caixa: [5, 50, 60, 60] },
        { slug: "y", nome: "Y", caixa: [-5, 50, 60, 60] },
      ],
    } as unknown as CenaDoFundo;
    const r = rotulosNaJanela(cena, [0, 0, 100, 100]);
    expect(r.rotulos.map((x) => x.nome)).toEqual(["Dentro"]);
    expect(r.bairros.map((x) => x.slug)).toEqual(["x"]);
    expect(rotulosNaJanela(cena, [-10, 0, 120, 100])).toBe(cena);
  });

  it.each(["casa-forte", "madalena", "espinheiro", "gracas", "boa-viagem"])("%s: todo rótulo desenhado cabe no mapa visível e nenhum fica sob o pino", (id) => {
    const r = montar({ dossie: dossie(id), ajustar: 1550, raios: [500, 1000, 1500], acessivel: "x" }, 375, 560);
    const cena = r.root.findByType(FundoDoMapa).props.cena as CenaDoFundo;
    const jj = janelaDaVista({ escala: (375 / 2 - 14) / 1550, centro: [0, 0] }, { largura: 375, altura: 560 });
    const [vx0, vy0, vx1, vy1] = visivelNaJanela(jj);
    // Os da cena montada (antes do filtro): a folga como obstáculo já os põe dentro.
    const caixas = [...cena.rotulos.flatMap((x) => x.caixas), ...cena.bairros.map((b) => b.caixa)];
    expect(caixas.length).toBeGreaterThan(0);
    for (const c of caixas) {
      expect(c[0]).toBeGreaterThanOrEqual(vx0);
      expect(c[1]).toBeGreaterThanOrEqual(vy0);
      expect(c[2]).toBeLessThanOrEqual(vx1);
      expect(c[3]).toBeLessThanOrEqual(vy1);
    }
    const p = retanguloDoPino(jj);
    const [p0, p1, p2, p3] = [p[0] + jj.folgaX, p[1] + jj.folgaY, p[2] + jj.folgaX, p[3] + jj.folgaY];
    for (const c of caixas) expect(c[0] < p2 && c[2] > p0 && c[1] < p3 && c[3] > p1).toBe(false);
    act(() => r.unmount());
  });
});

/** A tela "Confirmar o lote" do exemplo. `medir: false` deixa o mapa sem tamanho: o fundo nem começou a carregar. */
function montarConfirmar(exemplo = "boa-viagem", medir = true): TestRenderer.ReactTestRenderer {
  G.__exemplo = exemplo;
  G.__gravado = [];
  G.__destinos = [];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Tela = (require("../src/app/exemplos/[id]/confirmar-lote") as { default: React.ComponentType }).default;
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(Tela)));
  });
  if (!medir) return r;
  const raiz = r.root.find((n) => typeof n.props.onLayout === "function" && typeof n.props.accessibilityLabel === "string");
  act(() => {
    (raiz.props.onLayout as (e: unknown) => void)({ nativeEvent: { layout: { x: 0, y: 0, width: 375, height: 420 } } });
  });
  return r;
}

const botaoDe = (r: TestRenderer.ReactTestRenderer, nome: string) => r.root.find((n) => n.props.rotulo === nome && typeof n.type !== "string");
const tocarBotao = (r: TestRenderer.ReactTestRenderer, nome: string) => act(() => (botaoDe(r, nome).props.onPress as () => void)());

describe("sem o fundo, nos exemplos", () => {
  const g = globalThis as { __veredaLerCamadaEmTeste?: (c: string) => unknown };
  const original = g.__veredaLerCamadaEmTeste!;
  const limpar = () =>
    act(() => {
      esquecerMapaBase();
      esquecerCamadas();
    });
  const semFundo = (corpo: () => void) => {
    limpar();
    g.__veredaLerCamadaEmTeste = (c) => (c.includes("mapa-base") ? { versao: "outra" } : original(c));
    try {
      corpo();
    } finally {
      g.__veredaLerCamadaEmTeste = original;
      limpar();
    }
  };

  it("o aviso diz o que continua valendo neste mapa (o pino e os raios), não o lote", () =>
    semFundo(() => {
      const r = montar({ dossie: dossie("casa-forte"), ajustar: 1550, raios: [500], acessivel: "x" });
      const t = textoCorrido(r);
      expect(t).toContain("Não foi possível carregar as ruas e quadras deste mapa. O pino e os raios continuam valendo.");
      expect(t).not.toContain("O lote e os pontos");
      act(() => r.unmount());
    }));

  it("candidatos: o mapa avisa a tela que falhou e que não há candidato, sem lote inventado", () =>
    semFundo(() => {
      let info: InfoDosCandidatos | null = null;
      const r = montar({
        dossie: dossie("boa-viagem"),
        ajustar: 110,
        raios: [],
        lotes: "candidatos",
        acessivel: "x",
        aoMudarCandidatos: (i) => {
          info = i;
        },
      });
      expect(info).toEqual({ estado: "falhou", quantos: 0, escolhido: false });
      expect(r.root.findAll((n) => n.props.strokeDasharray === "4 3")).toHaveLength(0);
      act(() => r.unmount());
    }));

  // M1 (18/11/2026): a resposta é sobre o prédio do endereço e não depende de o fundo carregar. Os exemplos de compra
  // (Casa Forte, Graças, Madalena) não tinham "Pular": com os dois botões desligados, a pessoa ficava presa na tela.
  it.each(["casa-forte", "gracas", "madalena", "boa-viagem", "espinheiro"])("%s sem o fundo: os três botões ligados, a tela diz o que falta e oferece Tentar de novo", (id) =>
    semFundo(() => {
      const r = montarConfirmar(id);
      const t = textoCorrido(r);
      expect(t).toContain("Os lotes do cadastro não carregaram. Dá para responder pelo endereço acima.");
      expect(t).toContain("Tentar de novo");
      expect(t).toContain("a resposta pelo endereço continua valendo");
      for (const nome of ["É este prédio", "Não é este", "Pular por agora"]) expect(Boolean(botaoDe(r, nome).props.desativado)).toBe(false);
      // Sem o fundo não há lote desenhado para confirmar: nada inventado.
      expect(r.root.findAll((n) => n.props.strokeDasharray === "4 3")).toHaveLength(0);
      act(() => r.unmount());
    }));

  it("sem o fundo, num exemplo de compra: É este prédio grava a confirmação e volta ao dossiê", () =>
    semFundo(() => {
      const r = montarConfirmar("casa-forte");
      tocarBotao(r, "É este prédio");
      expect(G.__gravado).toEqual([{ lotesConfirmados: { "casa-forte": true } }]);
      expect(G.__destinos).toEqual([{ pathname: "/exemplos/[id]", params: { id: "casa-forte" } }]);
      act(() => r.unmount());
    }));

  it("sem o fundo, num exemplo de compra: Pular por agora é a saída (grava que não confirmou e volta)", () =>
    semFundo(() => {
      const r = montarConfirmar("gracas");
      tocarBotao(r, "Pular por agora");
      expect(G.__gravado).toEqual([{ lotesConfirmados: { gracas: false } }]);
      expect(G.__destinos).toEqual([{ pathname: "/exemplos/[id]", params: { id: "gracas" } }]);
      act(() => r.unmount());
    }));

  it("sem o fundo: Não é este não promete escolha no mapa; diz por que não dá e aponta as saídas", () =>
    semFundo(() => {
      const r = montarConfirmar("madalena");
      expect(textoCorrido(r)).not.toContain("Sem os lotes do cadastro não dá para escolher outro prédio no mapa");
      tocarBotao(r, "Não é este");
      const t = textoCorrido(r);
      expect(t).toContain("Sem os lotes do cadastro não dá para escolher outro prédio no mapa. Use “Tentar de novo” no mapa ou “Pular por agora”.");
      expect(t).not.toContain("Escolha o prédio no mapa.");
      // Uma linha só: a que dizia "dá para responder pelo endereço" dá lugar a esta, não se soma a ela.
      expect(t).not.toContain("Dá para responder pelo endereço acima.");
      // Nada foi gravado nem a tela saiu: a pessoa ainda decide.
      expect(G.__gravado).toEqual([]);
      expect(G.__destinos).toEqual([]);
      act(() => r.unmount());
    }));

  it("enquanto o fundo não chegou (o mapa nem foi medido): os botões já estão ligados e dá para responder", () => {
    const r = montarConfirmar("casa-forte", false);
    expect(textoCorrido(r)).toContain("Carregando os lotes do cadastro… Dá para responder pelo endereço sem esperar o mapa.");
    for (const nome of ["É este prédio", "Não é este", "Pular por agora"]) expect(Boolean(botaoDe(r, nome).props.desativado)).toBe(false);
    tocarBotao(r, "É este prédio");
    expect(G.__gravado).toEqual([{ lotesConfirmados: { "casa-forte": true } }]);
    act(() => r.unmount());
  });

  it("com o fundo: a linha que explica os tracejados, os botões ligados e Não é este pede a escolha no mapa", () => {
    const r = montarConfirmar("casa-forte");
    expect(textos(r)).toContain("cadastro da Prefeitura");
    for (const nome of ["É este prédio", "Não é este", "Pular por agora"]) expect(Boolean(botaoDe(r, nome).props.desativado)).toBe(false);
    expect(r.root.findAll((n) => n.props.strokeDasharray === "4 3" && typeof n.props.d === "string" && n.type !== "path").length).toBeGreaterThan(0);
    tocarBotao(r, "Não é este");
    expect(textoCorrido(r)).toContain("Escolha o prédio no mapa.");
    act(() => r.unmount());
  });

  it("com o fundo, em Boa Viagem: o lote do centro do imóvel é o escolhido, em azul cadastral", () => {
    const r = montarConfirmar("boa-viagem");
    expect(textoCorrido(r)).toContain("Em azul, o lote escolhido");
    expect(r.root.findAll((n) => n.props.fill === "#2E5A85" && n.props.fillOpacity === 0.85 && n.type !== "path").length).toBeGreaterThan(0);
    act(() => r.unmount());
  });
});

// M3 (18/11/2026): a camada "Calor" de demonstração pintava o mar de Boa Viagem e os rios. As células passam por uma
// máscara feita com o mesmo caminho da camada de água do fundo.
describe("calor dos exemplos: não pinta a água do mapa-base", () => {
  /** Anéis ([x, y][]) de um caminho "Mx yLx y…Z" da cena. */
  const aneisDoCaminho = (d: string): [number, number][][] =>
    d
      .split("Z")
      .filter((p) => p.trim() !== "")
      .map((p) => (p.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number))
      .map((n) => n.reduce<[number, number][]>((pares, v, i) => (i % 2 === 0 ? [...pares, [v, n[i + 1]!]] : pares), []));
  /** Par-ímpar sobre todos os anéis, como o fundo pinta a água (fillRule evenodd). */
  const naAgua = (aneis: [number, number][][], x: number, y: number): boolean => {
    let dentro = false;
    for (const anel of aneis) {
      for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
        const [xi, yi] = anel[i]!;
        const [xj, yj] = anel[j]!;
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
      }
    }
    return dentro;
  };
  const montarCalor = (id: string) => montar({ dossie: dossie(id), ajustar: 1550, raios: [500, 1000, 1500], camada: "calor", comCalor: true, acessivel: "x" }, 375, 470);
  const grupoDoCalor = (r: TestRenderer.ReactTestRenderer) => r.root.find((n) => n.type === GrupoSvg && n.props.testID === "calor-do-mapa");
  const mascaraDe = (r: TestRenderer.ReactTestRenderer) => {
    const referencia = grupoDoCalor(r).props.mask as string | undefined;
    const id = /^url\(#(.+)\)$/.exec(referencia ?? "")?.[1];
    return id ? (r.root.findAll((n) => n.type === Mask && n.props.id === id)[0] ?? null) : null;
  };

  it("Boa Viagem (o mar ao lado): o calor passa por uma máscara que apaga exatamente a água que o fundo desenha", () => {
    const r = montarCalor("boa-viagem");
    const fundos = r.root.findAllByType(FundoDoMapa);
    const cena = fundos[0]!.props.cena as CenaDoFundo;
    expect(cena.camadas.agua).not.toBe("");
    const mascara = mascaraDe(r);
    expect(mascara).not.toBeNull();
    // Na máscara: branco em tudo (mostra o calor), a água em preto (apaga) com a regra par-ímpar do fundo.
    const branco = mascara!.findAllByType(Rect)[0]!;
    const agua = mascara!.findAll((n) => n.type === Path && n.props.d === cena.camadas.agua)[0]!;
    expect(branco.props.fill).toBe("#FFFFFF");
    expect(agua.props.fill).toBe("#000000");
    expect(agua.props.fillRule).toBe("evenodd");
    // A água da máscara fica no mesmo lugar do mundo que a água do fundo: a mesma conta de transformação do grupo da cena.
    const grupoDaAgua = mascara!.findAll((n) => n.type === GrupoSvg && typeof n.props.transform === "string")[0]!;
    let grupoDoFundo: ReactTestInstance | null = fundos[0]!.parent;
    while (grupoDoFundo && grupoDoFundo.type !== GrupoSvg) grupoDoFundo = grupoDoFundo.parent;
    expect(grupoDoFundo).not.toBeNull();
    expect(grupoDaAgua.props.transform).toBe(grupoDoFundo!.props.transform);
    // O caso é de verdade: sem a máscara, dezenas de células de calor cairiam com o centro no mar.
    const m = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)/.exec(grupoDaAgua.props.transform as string)!;
    const [ox, oy, k] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const aneis = aneisDoCaminho(cena.camadas.agua);
    const celulas = grupoDoCalor(r).findAllByType(Rect);
    expect(celulas).toHaveLength(22 * 22);
    const noMar = celulas.filter((c) => naAgua(aneis, ((c.props.x as number) + 50 - ox) / k, ((c.props.y as number) + 50 - oy) / k));
    expect(noMar.length).toBeGreaterThan(20);
    // A máscara cobre todas as células (nenhuma fica de fora dela, onde não haveria recorte).
    const [mx, my, ml] = [mascara!.props.x as number, mascara!.props.y as number, mascara!.props.width as number];
    for (const c of celulas) {
      expect(c.props.x as number).toBeGreaterThanOrEqual(mx);
      expect(c.props.y as number).toBeGreaterThanOrEqual(my);
      expect((c.props.x as number) + 100).toBeLessThanOrEqual(mx + ml);
      expect((c.props.y as number) + 100).toBeLessThanOrEqual(my + ml);
    }
    act(() => r.unmount());
  });

  it("com o calor ligado, os nomes de rua e de bairro ficam por cima das células (chão, calor, rótulos)", () => {
    const r = montarCalor("boa-viagem");
    const partes = r.root.findAllByType(FundoDoMapa).map((f) => f.props.partes as string);
    expect(partes).toEqual(["chao", "rotulos"]);
    const ordem = r.root
      .findAll((n) => n.type === FundoDoMapa || (n.type === GrupoSvg && n.props.testID === "calor-do-mapa"))
      .map((n) => (n.type === FundoDoMapa ? (n.props.partes as string) : "calor"));
    expect(ordem).toEqual(["chao", "calor", "rotulos"]);
    act(() => r.unmount());
  });

  it("nos cinco exemplos a máscara leva a água da cena; onde a cena não tem água, as células ficam inteiras", () => {
    for (const id of ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"]) {
      const r = montarCalor(id);
      const cena = r.root.findAllByType(FundoDoMapa)[0]!.props.cena as CenaDoFundo;
      const mascara = mascaraDe(r);
      if (cena.camadas.agua === "") expect(mascara).toBeNull();
      else expect(mascara!.findAll((n) => n.type === Path && n.props.d === cena.camadas.agua)).toHaveLength(1);
      act(() => r.unmount());
    }
  });

  it("sem o fundo (não se sabe onde há água): sem máscara, as células continuam desenhadas", () => {
    const base = dossie("casa-forte");
    const fora: Dossie = { ...base, id: "fora-calor", bairro: "Lugar Nenhum", lote: { ...base.lote, centro: [-46.63, -23.55] } };
    const r = montar({ dossie: fora, ajustar: 1550, camada: "calor", comCalor: true, acessivel: "Fora" });
    expect(grupoDoCalor(r).props.mask).toBeUndefined();
    expect(grupoDoCalor(r).findAllByType(Rect)).toHaveLength(22 * 22);
    act(() => r.unmount());
  });

  it("fora da camada de calor, o mapa não desenha células nem máscara e o fundo vem inteiro, uma vez", () => {
    const r = montar({ dossie: dossie("boa-viagem"), ajustar: 1550, raios: [500], camada: "ruas", comCalor: true, acessivel: "x" });
    expect(r.root.findAll((n) => n.type === GrupoSvg && n.props.testID === "calor-do-mapa")).toHaveLength(0);
    expect(r.root.findAllByType(FundoDoMapa).map((f) => f.props.partes)).toEqual(["tudo"]);
    act(() => r.unmount());
  });
});
