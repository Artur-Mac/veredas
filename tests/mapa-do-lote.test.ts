// Mapa do lote (15/11/2026): seletor 2D/2.5D visível, zoom em passos, arraste preso ao quadro e toque na obra com a
// distância e o estado da licença (retrato da base, P05).
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { daTelaParaODesenho, ehToque, esquecerLargurasDoMapaDoLote, etiquetaLongeDoPino, LARGURA_PARA_RECENTRAR_COM_TEXTO, larguraDaColunaDeBotoes, LIMIAR_DO_TOQUE_PX, MapaDoLote, obstaculosDosPontos } from "../src/componentes/dossie-v1/MapaDoLote";
import { ESTADO_INICIAL, afastar, aproximar, arrastar, deslocamentoDoZoom, naTela, recentrar, tocarObra, transformacao, trocarModo } from "../src/componentes/dossie-v1/mapaInterativo";
import { caixaDoQuadro, comVolumesDoChao, montarCena25DDoLote, montarCenaDoLote, paraDesenhoDoQuadro, VAO_MINIMO_DA_GAVETA_M, VAO_MINIMO_VERTICAL_DA_GAVETA_M } from "../src/componentes/dossie-v1/mapa";
import { CreditoDaBase, FundoDoMapa, SeloDoBairro } from "../src/componentes/mapa/FundoDoMapa";
import * as mapaBase from "../src/dados/recife/mapaBase";
import { edificioPorId , edificiosDoBairro } from "../src/dados/recife/indice";
import { linhasDeObras, textoDaLicenca } from "../src/componentes/dossie-v1/textos";
import { Pressionavel } from "../src/componentes/Pressionavel";
import type { ObrasProximas } from "../src/dados/contratos";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("expo-router", () => ({}));

describe("estado do mapa", () => {
  // 18/11/2026: o passo 4 entrou com a gaveta abrindo em ~220 m (mapa-base), para o zoom chegar ao lote.
  it("zoom em passos de 1 a 4, sem passar dos extremos", () => {
    let e = ESTADO_INICIAL;
    e = aproximar(e, 320, 280); expect(e.zoom).toBe(1.5);
    e = aproximar(aproximar(aproximar(e, 320, 280), 320, 280), 320, 280); expect(e.zoom).toBe(4);
    expect(aproximar(e, 320, 280).zoom).toBe(4);
    e = afastar(afastar(afastar(afastar(afastar(e, 320, 280), 320, 280), 320, 280), 320, 280), 320, 280); expect(e.zoom).toBe(1);
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
    expect(deslocamentoDoZoom(z3.zoom, 320, 280, pino)).toEqual([z3.dx, z3.dy]);
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
    medirOQuadro(a);
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

// 18/11/2026: o fundo do mapa (mapa-base) na planta da gaveta. No jest as camadas são lidas na hora, então o fundo vem
// pronto logo depois da primeira medida do quadro.
/**
 * No jest o onLayout não dispara sozinho, e o fundo só monta depois da primeira medida. A largura é a mesma de antes
 * da medida (320), para as contas de toque dos testes continuarem valendo.
 */
function medirOQuadro(a: TestRenderer.ReactTestRenderer, largura = 320) {
  const no = a.root.findAll((n) => typeof n.type === "string" && typeof n.props.onLayout === "function")[0];
  if (no) act(() => no.props.onLayout({ nativeEvent: { layout: { width: largura, height: 280 } } }));
}

describe("MapaDoLote com o fundo do mapa", () => {
  const golden = edificioPorId("8001-216", "boa-viagem")!;
  const vizinhosBV = edificiosDoBairro("boa-viagem");
  function montar(props: Partial<React.ComponentProps<typeof MapaDoLote>> = {}) {
    let a!: TestRenderer.ReactTestRenderer;
    act(() => { a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(MapaDoLote, { predio: golden, obras: [], vizinhos: vizinhosBV, ...props }))); });
    montadas.push(a);
    medirOQuadro(a);
    return a;
  }
  const rotulo = (a: TestRenderer.ReactTestRenderer) => a.root.findAll((n) => n.props.role === "img")[0]!.props.accessibilityLabel as string;
  const tracejados = (a: TestRenderer.ReactTestRenderer) => a.root.findAll((n) => typeof n.type !== "string" && typeof n.props.d === "string" && n.props.strokeDasharray === "4 3");

  it("a planta de um prédio de Boa Viagem tem o fundo, o selo do bairro e o crédito da base", () => {
    const a = montar();
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(1);
    expect(a.root.findAllByType(SeloDoBairro)[0]!.props.nome).toBe("Boa Viagem");
    expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(1);
    expect(textos(a.toJSON())).toContain("Base: Prefeitura do Recife (ODbL)");
    // Com o fundo, os contornos tracejados do índice não são desenhados por cima.
    expect(tracejados(a)).toHaveLength(0);
  });

  it("o rótulo acessível traz a rua, o bairro e a distância até a divisa, sem perder obras, zoom e régua", () => {
    const t = rotulo(montar());
    expect(t).toContain("sem obras licenciadas");
    expect(t).toContain("Zoom 1 vezes");
    expect(t).toMatch(/Régua de \d+ m/);
    expect(t).toContain("bairro Boa Viagem");
    expect(t).toMatch(/O imóvel fica na .+\./);
    expect(t).toMatch(/divisa/);
  });

  it("sem arquivo do mapa-base para o quadro, desenha como antes: vizinhos numa forma só, sem fundo, selo nem crédito", () => {
    const espiao = jest.spyOn(mapaBase, "arquivosDoMapaBaseParaOQuadro").mockReturnValue({ arquivos: [], completo: true });
    try {
      // Uma obra a ~500 m ao norte alarga o quadro: mais de 60 prédios do índice entram nele.
      const obras: ObrasProximas["recentes"] = [{ categoria: "construcao", descricao: "ALVARA DE CONSTRUCAO INICIAL", data: "2026-05", situacao: "DEFERIDO", centro: [golden.centro[0], golden.centro[1] + 0.0045], distanciaM: 500 }];
      const a = montar({ obras });
      expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(0);
      expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(0);
      expect(a.root.findAllByType(SeloDoBairro)).toHaveLength(0);
      expect(rotulo(a)).not.toContain("bairro Boa Viagem");
      // Todos os contornos do quadro, sem o limite de 60, num único Path.
      const t = tracejados(a);
      expect(t).toHaveLength(1);
      const cena = montarCenaDoLote(golden, obras, vizinhosBV, 320, 280, { vaoMinimoM: VAO_MINIMO_DA_GAVETA_M, limiteDeVizinhos: null });
      const unicos = new Set(cena.vizinhos).size;
      expect(unicos).toBeGreaterThan(60);
      expect((t[0]!.props.d as string).match(/M /g)!.length).toBe(unicos);
    } finally {
      espiao.mockRestore();
    }
  });

  // Mudou em 18/11/2026 (Por perto e volume): o volume passa a ter o fundo como chão, sem o lote do imóvel em dobro.
  it("o modo Volume tem o fundo por baixo, sem a camada do lote do imóvel, e continua com o limite de 60 vizinhos", () => {
    const a = montar({ modoInicial: "tarde" });
    // Revisão de 18/11/2026: o chão vai antes dos volumes e os nomes de rua e de bairro depois deles.
    const fundos = a.root.findAllByType(FundoDoMapa);
    expect(fundos.map((f) => f.props.partes)).toEqual(["chao", "rotulos"]);
    expect(fundos[0]!.props.cena.camadas.loteDoImovel).toBe("");
    expect(fundos[0]!.props.cena.camadas.quadras.length).toBeGreaterThan(0);
    expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(1);
    const t = textos(a.toJSON());
    expect(t).toContain("Volume estimado");
    expect(montarCena25DDoLote(golden, [], vizinhosBV, 320, 280, "tarde").volumes.length).toBeLessThanOrEqual(61);
  });

  it("planta e volume abrem na mesma escala (220 m) e o meio do volume repete a conta do desenho 2.5D", () => {
    const opcoes = { vaoMinimoM: VAO_MINIMO_DA_GAVETA_M, vaoMinimoVerticalM: VAO_MINIMO_VERTICAL_DA_GAVETA_M };
    const planta = montarCenaDoLote(golden, [], vizinhosBV, 340, 280, { ...opcoes, limiteDeVizinhos: null });
    const volume = montarCena25DDoLote(golden, [], vizinhosBV, 340, 280, "tarde", null, opcoes);
    expect(volume.metrosPorPixel).toBeCloseTo(planta.metrosPorPixel, 9);
    // O chão do pino (centro do prédio) cai a 56% da altura, como na conta do 2.5D.
    const [, y] = paraDesenhoDoQuadro(volume)(golden.centro);
    const alvo = volume.volumes.find((v) => v.alvo);
    expect(alvo).toBeDefined();
    expect(Math.abs(y - 280 * 0.56)).toBeLessThan(40);
  });

  it("volumes do chão: prédio do índice que o bairro não traz vira volume; o que já tem volume não entra em dobro", () => {
    const opcoes = { vaoMinimoM: VAO_MINIMO_DA_GAVETA_M, vaoMinimoVerticalM: VAO_MINIMO_VERTICAL_DA_GAVETA_M };
    const cena = montarCena25DDoLote(golden, [], [], 340, 280, "tarde", null, opcoes);
    const quadrado = (x: number, y: number) => ({ aneis: [new Float64Array([x - 4, y - 4, x + 4, y - 4, x + 4, y + 4, x - 4, y + 4])], caixa: [x - 4, y - 4, x + 4, y + 4] as const });
    const alvo = cena.volumes.find((v) => v.alvo)!;
    const lotes = [
      { ...quadrado(60, 60), pavimentos: 12, noIndice: true, doImovel: false },
      { ...quadrado(alvo.centroNoChao[0], alvo.centroNoChao[1]), pavimentos: 20, noIndice: true, doImovel: false },
      { ...quadrado(100, 60), pavimentos: null, noIndice: true, doImovel: false },
      { ...quadrado(140, 60), pavimentos: 5, noIndice: false, doImovel: false },
    ];
    const com = comVolumesDoChao(cena, lotes, golden.centro);
    expect(com.volumes.length).toBe(cena.volumes.length + 1);
    const novo = com.volumes.find((v) => v.id.startsWith("chao-"))!;
    expect(novo.pavimentos).toBe(12);
    expect(novo.centroNoChao[0]).toBeCloseTo(60, 6);
    expect(novo.centroNoChao[1]).toBeCloseTo(60, 6);
  });

  it("no Por perto, o pino e os pontos de interesse passam como obstáculos aos nomes do fundo", () => {
    const ob = obstaculosDosPontos([100, 100], [{ x: 50, y: 40, categoria: "praca" }, { x: 10, y: 10, categoria: "rotina" }], (x, y) => [x, y]);
    expect(ob).toEqual([[89, 89, 111, 111], [39, 29, 61, 51], [-2, -2, 22, 22]]);
  });

  it("o Por perto com pontos desenha o fundo, os pontos por cima e passa os obstáculos ao fundo", () => {
    const [lon, lat] = golden.centro;
    const pontosExtras = [{ id: "p1", categoria: "praca" as const, rotulo: "Praça", detalhe: "", distanciaM: 60, coordenada: [lon + 0.0004, lat] as [number, number] }];
    const a = montar({ pontosExtras });
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(1);
    expect(porRotulo(a, /^Praça a 60 m/)).toBeDefined();
  });

  it("toque no lote: o inverso de naTela, o limiar do arraste e o cartão com fechar", () => {
    const z = { ...ESTADO_INICIAL, zoom: 2, dx: 30, dy: -10 };
    const [sx, sy] = naTela(z, 123, 77, 320, 280);
    const [x, y] = daTelaParaODesenho(z, sx, sy, 320, 280);
    expect(x).toBeCloseTo(123, 9); expect(y).toBeCloseTo(77, 9);
    expect(ehToque(0)).toBe(true);
    expect(ehToque(LIMIAR_DO_TOQUE_PX)).toBe(true);
    expect(ehToque(LIMIAR_DO_TOQUE_PX + 1)).toBe(false);

    const a = montar();
    const quadro = a.root.findAll((n) => typeof n.props.onResponderRelease === "function" && typeof n.props.onLayout === "function")[0]!;
    const fundo = a.root.findAllByType(FundoDoMapa)[0]!.props.cena;
    const doImovel = fundo.lotes.find((l: { doImovel: boolean }) => l.doImovel);
    expect(doImovel).toBeDefined();
    const toque = (px: number, py: number, andar = 0) => act(() => {
      quadro.props.onResponderGrant({ nativeEvent: { pageX: 0, pageY: 0, locationX: px, locationY: py } });
      if (andar) quadro.props.onResponderMove({ nativeEvent: { pageX: andar, pageY: 0 } });
      quadro.props.onResponderRelease({ nativeEvent: {} });
    });
    // O pino (centro do prédio) cai no lote do imóvel.
    const cena = montarCenaDoLote(golden, [], vizinhosBV, 320, 280, { vaoMinimoM: VAO_MINIMO_DA_GAVETA_M, vaoMinimoVerticalM: VAO_MINIMO_VERTICAL_DA_GAVETA_M, limiteDeVizinhos: null });
    toque(cena.pino[0], cena.pino[1], 20);
    expect(textos(a.toJSON())).not.toContain("Lote do imóvel");
    toque(cena.pino[0], cena.pino[1]);
    let t = textos(a.toJSON());
    expect(t).toMatch(/Lote do imóvel( · \d+ pavimentos?)?/);
    if (doImovel.pavimentos) expect(t).toContain("base de Lotes da Prefeitura");
    // Tocar de novo fecha.
    toque(cena.pino[0], cena.pino[1]);
    expect(textos(a.toJSON())).not.toContain("Lote do imóvel");
    // Um vizinho: "Lote vizinho", e o ✕ fecha.
    const vizinho = fundo.lotes.find((l: { doImovel: boolean; caixa: [number, number, number, number] }) => !l.doImovel && l.caixa[0] > 20 && l.caixa[2] < 300 && l.caixa[1] > 20 && l.caixa[3] < 260);
    if (vizinho) {
      const r = vizinho.aneis[0] as Float64Array;
      // Um ponto dentro: a média dos vértices de um lote convexo o bastante; se cair fora, o teste só pula esta parte.
      let mx = 0, my = 0;
      for (let i = 0; i < r.length; i += 2) { mx += r[i]!; my += r[i + 1]!; }
      mx /= r.length / 2; my /= r.length / 2;
      toque(mx, my);
      t = textos(a.toJSON());
      if (t.includes("Lote vizinho")) {
        act(() => porRotulo(a, /^Fechar o detalhe do lote$/)!.props.onPress());
        expect(textos(a.toJSON())).not.toContain("Lote vizinho");
      }
    }
  });

  it("os controles do mapa têm 44 px e o rótulo acessível conta os lotes do quadro", () => {
    const a = montar();
    expect(rotulo(a)).toMatch(/\d+ lotes no quadro/);
    const mais = porRotulo(a, /^Aproximar o mapa$/)!;
    expect(mais.props.style.height).toBe(44);
  });

  it("a gaveta abre em ~220 m (o 2.5D continua em 80 m) e a caixa em graus volta ao quadro do desenho", () => {
    const cena = montarCenaDoLote(golden, [], [], 320, 280, { vaoMinimoM: VAO_MINIMO_DA_GAVETA_M });
    expect(cena.metrosPorPixel * 320).toBeGreaterThanOrEqual(219.9);
    expect(montarCenaDoLote(golden, [], [], 320, 280).metrosPorPixel * 320).toBeLessThan(100);
    const para = paraDesenhoDoQuadro(cena);
    const [o, s, l, n] = caixaDoQuadro(cena);
    const [x0, y0] = para([o, n]);
    const [x1, y1] = para([l, s]);
    expect(x0).toBeCloseTo(0, 6); expect(y0).toBeCloseTo(0, 6);
    expect(x1).toBeCloseTo(320, 6); expect(y1).toBeCloseTo(280, 6);
    const [px, py] = para(golden.centro);
    expect(px).toBeCloseTo(cena.pino[0], 6); expect(py).toBeCloseTo(cena.pino[1], 6);
  });
});

// Revisão de 18/11/2026: ordem das camadas no volume, descrição num nó só, botão de recentrar estreito e etiqueta de
// altura longe do pino.
describe("MapaDoLote, revisão do mapa-base", () => {
  const golden = edificioPorId("8001-216", "boa-viagem")!;
  const vizinhosBV = edificiosDoBairro("boa-viagem");
  function montar(props: Partial<React.ComponentProps<typeof MapaDoLote>> = {}) {
    let a!: TestRenderer.ReactTestRenderer;
    act(() => { a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(MapaDoLote, { predio: golden, obras: [], vizinhos: vizinhosBV, ...props }))); });
    montadas.push(a);
    medirOQuadro(a);
    return a;
  }
  /** Os filhos do grupo de zoom, na ordem do desenho, como "chao", "volume", "rotulos" ou "outro". */
  function ordemNoVolume(a: TestRenderer.ReactTestRenderer): string[] {
    const fundos = a.root.findAllByType(FundoDoMapa);
    // O grupo de zoom: o primeiro ancestral do chão que também contém os rótulos.
    let grupo = fundos[0]!.parent!;
    while (!grupo.findAllByType(FundoDoMapa).some((f) => f.props.partes === "rotulos") && grupo.parent) grupo = grupo.parent;
    const ordem: string[] = [];
    const visitar = (n: TestRenderer.ReactTestInstance) => {
      if (n.type === FundoDoMapa) { ordem.push(String(n.props.partes)); return; }
      if (typeof n.type !== "string" && typeof n.props.d === "string" && n.props.fillOpacity === 0.72) { ordem.push("volume"); return; }
      for (const f of n.children) if (typeof f !== "string") visitar(f);
    };
    visitar(grupo);
    return ordem.filter((x, i) => i === 0 || x !== ordem[i - 1]);
  }

  it("no volume, o chão vem antes dos volumes e os rótulos do fundo depois deles", () => {
    expect(ordemNoVolume(montar({ modoInicial: "tarde" }))).toEqual(["chao", "volume", "rotulos"]);
  });

  it("na planta, o fundo é desenhado inteiro, uma vez", () => {
    const fundos = montar().root.findAllByType(FundoDoMapa);
    expect(fundos.map((f) => f.props.partes)).toEqual(["tudo"]);
  });

  it("a descrição do mapa fica num nó só; o desenho de dentro fica escondido da acessibilidade", () => {
    const a = montar();
    const comDescricao = a.root.findAll((n) => typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.includes("Mapa do entorno"));
    // O View acessível e o host dele (react-test-renderer mostra os dois níveis): um só componente com o rótulo.
    expect(comDescricao.filter((n) => typeof n.type !== "string")).toHaveLength(1);
    const svg = a.root.findAll((n) => n.props["aria-hidden"] === true && typeof n.type !== "string" && n.props.viewBox?.startsWith("0 0 3"));
    expect(svg.length).toBeGreaterThan(0);
  });

  it("em tela estreita, Recentrar é um botão de 44 px com ícone e rótulo acessível; a área dos botões acompanha", () => {
    expect(larguraDaColunaDeBotoes(328, true)).toBe(60);
    expect(larguraDaColunaDeBotoes(328, false)).toBe(60);
    expect(larguraDaColunaDeBotoes(LARGURA_PARA_RECENTRAR_COM_TEXTO, true)).toBe(116);
    const a = montar();
    act(() => porRotulo(a, /^Aproximar o mapa$/)!.props.onPress());
    const recentrar = porRotulo(a, /^Voltar ao enquadramento inicial$/)!;
    expect(recentrar).toBeDefined();
    // A largura antes da medida é 320: o botão não tem texto "Recentrar" (só o ícone).
    expect(recentrar.findAll((n) => n.props.children === "Recentrar")).toHaveLength(0);
  });

  it("a etiqueta de altura do prédio do imóvel sai de baixo do pino", () => {
    expect(etiquetaLongeDoPino({ x: 100, y: 104 }, [100, 100], 1)).toEqual({ x: 100, y: 86 });
    expect(etiquetaLongeDoPino({ x: 100, y: 104 }, [100, 100], 2)).toEqual({ x: 100, y: 93 });
    // Longe do pino, fica onde está.
    expect(etiquetaLongeDoPino({ x: 160, y: 104 }, [100, 100], 1)).toEqual({ x: 160, y: 104 });
    expect(etiquetaLongeDoPino({ x: 100, y: 60 }, [100, 100], 1)).toEqual({ x: 100, y: 60 });
  });
});

// 18/11/2026 (última revisão): o fundo só monta depois da primeira medida do quadro. Antes, com a largura provisória,
// ele montava e desenhava duas vezes por abertura da gaveta.
describe("MapaDoLote: o fundo só depois de medir a largura", () => {
  const golden = edificioPorId("8001-216", "boa-viagem")!;
  it("antes do onLayout não há fundo nem crédito e o gancho não pediu arquivo; depois, uma cena só", () => {
    const pedidos = jest.spyOn(mapaBase, "arquivosDoMapaBaseParaOQuadro");
    const bairros = jest.spyOn(mapaBase, "mapaBaseDoBairro");
    esquecerLargurasDoMapaDoLote();
    try {
      let a!: TestRenderer.ReactTestRenderer;
      act(() => { a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(MapaDoLote, { predio: golden, obras: [], vizinhos: edificiosDoBairro("boa-viagem") }))); });
      montadas.push(a);
      expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(0);
      expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(0);
      expect(pedidos).not.toHaveBeenCalled();
      expect(bairros).not.toHaveBeenCalled();
      medirOQuadro(a, 340);
      const fundos = a.root.findAllByType(FundoDoMapa);
      expect(fundos).toHaveLength(1);
      expect(fundos[0]!.props.cena.largura).toBe(340);
      expect(a.root.findAllByType(CreditoDaBase)).toHaveLength(1);
    } finally {
      pedidos.mockRestore();
      bairros.mockRestore();
    }
  });

  // Desempenho (18/11/2026): a reabertura começa com a última largura medida e já pede o fundo no primeiro render.
  it("na reabertura, a largura lembrada já vale como medida: o fundo vem no primeiro render, com essa largura", () => {
    esquecerLargurasDoMapaDoLote();
    const criar = () => {
      let a!: TestRenderer.ReactTestRenderer;
      act(() => { a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(MapaDoLote, { predio: golden, obras: [], vizinhos: edificiosDoBairro("boa-viagem") }))); });
      montadas.push(a);
      return a;
    };
    const primeira = criar();
    medirOQuadro(primeira, 352);
    act(() => primeira.unmount());
    const segunda = criar();
    const fundos = segunda.root.findAllByType(FundoDoMapa);
    expect(fundos).toHaveLength(1);
    expect(fundos[0]!.props.cena.largura).toBe(352);
    esquecerLargurasDoMapaDoLote();
  });
});
