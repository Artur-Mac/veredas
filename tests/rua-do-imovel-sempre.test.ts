// M4, decisão A11 (18/11/2026): o nome da rua do imóvel aparece SEMPRE no mapa. Ele sumia no "Por perto" e na confirmação
// do prédio. O teste monta as telas de verdade, com os arquivos de verdade, nos 4 prédios e nas medidas de mapa do roteiro
// de capturas (janelas de 375, 360 e 1280 px), em todos os passos de zoom, e confere cada cena que a tela pediu ao fundo:
// o nome está lá, inteiro dentro do mapa, do tamanho de sempre, fora do pino e de tudo o que a tela põe por cima do
// desenho (selo, botões, régua, crédito, pé, obras, pontos de interesse), e nenhum outro nome passa por cima dele.
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Text as TextoSvg } from "react-native-svg";
import TestRenderer, { act } from "react-test-renderer";
import { caixaDaEtiquetaDeAltura, esquecerLargurasDoMapaDoLote, MapaDoLote, type EntradaPontoExtraMapa } from "../src/componentes/dossie-v1/MapaDoLote";
import { TopoDoDossie } from "../src/componentes/dossie-v1/Topo";
import * as cenaDoFundo from "../src/componentes/mapa/fundoDoMapaCena";
import { cobreARuaDoImovel, type CenaDoFundo, type EntradaDoFundo } from "../src/componentes/mapa/fundoDoMapaCena";
import { estiloDoFundo } from "../src/componentes/mapa/fundoDoMapaEstilo";
import { marcacaoDoFundo } from "../src/componentes/mapa/fundoDoMapaMarcacao";
import { posicionarRotulosDeRua, TAMANHO_DA_RUA } from "../src/componentes/mapa/fundoDoMapaRotulos";
import { esquecerCenasDoFundo } from "../src/componentes/mapa/useFundoDoMapa";
import { MapaDoPredio } from "../src/componentes/predio/MapaDoPredio";
import { Pressionavel } from "../src/componentes/Pressionavel";
import type { Edificio, ObrasProximas } from "../src/dados/contratos";
import { HORARIOS_DO_MAPA } from "../src/dados/dossie/solESombra";
import type { SlugCoberto } from "../src/dados/recife/bairros";
import { pontosDoEntornoNoMapa } from "../src/dados/recife/camadasAmbientais";
import { edificioPorId, edificiosDoBairro, indiceDoBairro } from "../src/dados/recife/indice";
import { baseDeServicos, servicosProximos } from "../src/dados/recife/servicos";
import { TemaDoApp } from "../src/tema/Tema";
import { CORES_CLARO } from "../src/tema/tokens";

jest.mock("expo-router", () => ({}));
// Quatro prédios, cinco superfícies, três larguras e cinco passos de zoom: mais que os 5 s padrão com a máquina ocupada.
jest.setTimeout(60000);

type Ret = [number, number, number, number];
type Lido = readonly [number, number, number, number];
const sobrepoe = (a: Lido, b: Lido) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** Os casos fixos da régua visual (docs/aplicacao/mapa-base-2026-11-18/scripts/casos.json). */
const CASOS: readonly [string, string, SlugCoberto, string][] = [
  ["Golden Tower", "8001-216", "boa-viagem", "R. Major Armando de Souza Mello"],
  ["Torre", "31950-280", "torre", "R. Frei Jaboatao"],
  ["Casa Forte, junto à divisa", "2453-108", "casa-forte", "R. Alfredo Fernandes"],
  ["Pina, quadra sem lote", "32948-160", "pina", "Av. Jemil Asfora"],
];

/** Os pontos do "Por perto", como a tela os monta (praças, metrô, ensino e saúde em volta do prédio). */
function pontosDoPorPerto(centro: [number, number]): EntradaPontoExtraMapa[] {
  const lista: EntradaPontoExtraMapa[] = [...pontosDoEntornoNoMapa(centro)];
  const base = baseDeServicos();
  servicosProximos(base, centro, 800, 4, 4).itens.forEach((item, i) => lista.push({ id: `ensino-${i}`, categoria: "ensino", rotulo: `Ensino ${i}`, detalhe: "", coordenada: item.coordenada, distanciaM: item.distanciaM }));
  servicosProximos(base, centro, 800, 5, 4).itens.forEach((item, i) => lista.push({ id: `saude-${i}`, categoria: "saude", rotulo: `Saúde ${i}`, detalhe: "", coordenada: item.coordenada, distanciaM: item.distanciaM }));
  return lista;
}

function obrasDo(predio: Edificio, bairro: SlugCoberto): ObrasProximas["recentes"] {
  const doBairro = indiceDoBairro(bairro)!.obras;
  return predio.obras150m.recentes.flatMap(([i, distanciaM]) => (doBairro[i] ? [{ ...doBairro[i]!, distanciaM }] : []));
}

/** Cada cena que as telas pediram ao fundo, com a entrada (quadro, zoom, obstáculos) que a gerou. */
let pedidas: { entrada: EntradaDoFundo; cena: CenaDoFundo }[] = [];
let espia: ReturnType<typeof jest.spyOn>;
beforeEach(() => {
  pedidas = [];
  esquecerCenasDoFundo();
  esquecerLargurasDoMapaDoLote();
  const original = cenaDoFundo.montarFundoDoMapa;
  espia = jest.spyOn(cenaDoFundo, "montarFundoDoMapa").mockImplementation((entrada: EntradaDoFundo) => {
    const cena = original(entrada);
    pedidas.push({ entrada, cena });
    return cena;
  });
});
afterEach(() => {
  espia.mockRestore();
});

function montar(el: React.ReactElement, largura: number, altura: number): TestRenderer.ReactTestRenderer {
  let a!: TestRenderer.ReactTestRenderer;
  act(() => {
    a = TestRenderer.create(React.createElement(TemaDoApp, null, el));
  });
  for (const no of a.root.findAll((n) => typeof n.type === "string" && typeof n.props.onLayout === "function")) {
    act(() => no.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: largura, height: altura } } }));
  }
  return a;
}

/** Toca "Aproximar o mapa" até o fim (zoom 1,5, 2, 3 e 4): cada passo pede uma cena nova. */
function aproximarAteOFim(a: TestRenderer.ReactTestRenderer): void {
  for (let i = 0; i < 6; i++) {
    const mais = a.root.findAllByType(Pressionavel).find((p) => p.props.accessibilityLabel === "Aproximar o mapa");
    if (!mais || mais.props.disabled) return;
    act(() => (mais.props.onPress as () => void)());
  }
}

/**
 * O aceite, para uma cena pedida por uma tela: o nome da rua do imóvel está na cena e na tela (dentro do quadro, com o
 * zoom e o deslocamento do grupo), do tamanho de sempre, fora do pino e de todo obstáculo que a tela declarou, e nenhum
 * outro nome de rua ou de bairro cruza com ele.
 */
function conferir({ entrada, cena }: { entrada: EntradaDoFundo; cena: CenaDoFundo }, rua: string, onde: string): void {
  const { largura, altura } = entrada.quadro;
  const zoom = entrada.quadro.zoom ?? 1;
  const [dx, dy] = entrada.quadro.deslocamento ?? [0, 0];
  const naTela = (c: Ret): Ret => [largura / 2 + dx + (c[0] - largura / 2) * zoom, altura / 2 + dy + (c[1] - altura / 2) * zoom, largura / 2 + dx + (c[2] - largura / 2) * zoom, altura / 2 + dy + (c[3] - altura / 2) * zoom];
  const doImovel = cena.rotulos.filter((r) => r.tipo === "imovel");
  const erro = (o: string) => `${onde}: ${o}`;
  if (doImovel.length === 0) throw new Error(erro(`a rua do imóvel (${rua}) ficou sem nome no mapa`));
  const [px, py] = entrada.quadro.paraDesenho(entrada.imovel!.centro);
  const pino = naTela([px, py, px, py]);
  const pinoNaTela: Ret = [pino[0] - 11, pino[1] - 11, pino[2] + 11, pino[3] + 11];
  for (const r of doImovel) {
    expect(r.nome).toBe(rua);
    // Legível: o tamanho de sempre na tela, e o texto inteiro dentro do quadro.
    expect(r.tamanho * zoom).toBeCloseTo(TAMANHO_DA_RUA, 6);
    for (const caixa of r.caixas.map(naTela)) {
      if (caixa[0] < 0 || caixa[1] < 0 || caixa[2] > largura || caixa[3] > altura) throw new Error(erro(`o nome sai do quadro (${caixa.map(Math.round).join(", ")})`));
      if (sobrepoe(caixa, pinoNaTela)) throw new Error(erro("o nome cobre o pino"));
      for (const o of entrada.quadro.obstaculos ?? []) if (sobrepoe(caixa, o)) throw new Error(erro(`o nome fica por baixo do que a tela põe por cima do desenho (${o.join(", ")})`));
    }
    // Os outros nomes cedem.
    for (const outro of cena.rotulos) if (outro !== r) for (const c of outro.caixas) for (const meu of r.caixas) if (sobrepoe(c, meu)) throw new Error(erro(`"${outro.nome}" passa por cima do nome da rua do imóvel`));
    for (const b of cena.bairros) for (const meu of r.caixas) if (sobrepoe(b.caixa, meu)) throw new Error(erro(`o nome do bairro ${b.nome} passa por cima do nome da rua do imóvel`));
  }
}

describe.each(CASOS)("%s: a rua do imóvel tem nome em toda superfície do roteiro de capturas", (_nome, id, bairro, rua) => {
  const predio = edificioPorId(id, bairro)!;
  const vizinhos = edificiosDoBairro(bairro);
  const obras = obrasDo(predio, bairro);

  // As medidas são as das molduras nas capturas a 375, 360 e 1280 px de janela.
  it.each([343, 328, 608])("gaveta Mapa do lote, planta, a %i px: em todo passo de zoom", (largura) => {
    const a = montar(React.createElement(MapaDoLote, { predio, obras, vizinhos }), largura, 280);
    aproximarAteOFim(a);
    expect(pedidas.map((p) => p.entrada.quadro.zoom)).toEqual([1, 1.5, 2, 3, 4]);
    for (const p of pedidas) conferir(p, rua, `gaveta ${largura} px, zoom ${p.entrada.quadro.zoom}`);
    act(() => a.unmount());
  });

  it.each([343, 328, 608])("gaveta Mapa do lote, volume 2.5D, a %i px", (largura) => {
    const a = montar(React.createElement(MapaDoLote, { predio, obras, vizinhos, modoInicial: HORARIOS_DO_MAPA[0]!.id }), largura, 280);
    expect(pedidas.length).toBeGreaterThan(0);
    for (const p of pedidas) conferir(p, rua, `volume ${largura} px`);
    // A etiqueta de altura de um vizinho não é desenhada por cima do nome da rua do imóvel.
    const cena = pedidas[pedidas.length - 1]!.cena;
    const etiquetas = a.root.findAllByType(TextoSvg).filter((t) => /^\d+m$/.test(String(t.props.children)) && t.props.fontWeight === "600");
    for (const t of etiquetas) expect(cobreARuaDoImovel(cena, caixaDaEtiquetaDeAltura({ x: t.props.x as number, y: t.props.y as number }, 1))).toBe(false);
    act(() => a.unmount());
  });

  it.each([305, 290, 682])("Por perto, com os pontos de interesse, a %i px: em todo passo de zoom", (largura) => {
    const a = montar(React.createElement(MapaDoLote, { predio, obras, vizinhos, pontosExtras: pontosDoPorPerto(predio.centro) }), largura, 280);
    aproximarAteOFim(a);
    expect(pedidas.map((p) => p.entrada.quadro.zoom)).toEqual([1, 1.5, 2, 3, 4]);
    for (const p of pedidas) conferir(p, rua, `Por perto ${largura} px, zoom ${p.entrada.quadro.zoom}`);
    act(() => a.unmount());
  });

  it.each([309, 294, 686])("confirmação do prédio (/predio), a %i px", (largura) => {
    const a = montar(React.createElement(MapaDoPredio, { selecionado: predio, outros: vizinhos, aoEscolher: () => undefined }), largura, 180);
    expect(pedidas.length).toBeGreaterThan(0);
    const ultima = pedidas[pedidas.length - 1]!;
    conferir(ultima, rua, `/predio ${largura} px`);
    // Os números dos lotes vizinhos cedem: nenhum é desenhado por cima do nome da rua do imóvel.
    const numeros = a.root.findAllByType(TextoSvg).filter((t) => /^\d+[A-Z]?$/.test(String(t.props.children)));
    for (const t of numeros) {
      const [x, y] = [t.props.x as number, (t.props.y as number) - 3];
      expect(cobreARuaDoImovel(ultima.cena, [x - 12, y - 7, x + 12, y + 6])).toBe(false);
    }
    act(() => a.unmount());
  });

  it.each([
    [341, 213],
    [326, 204],
    [718, 449],
  ])("topo do dossiê sem fotos, a %i × %i px", (largura, altura) => {
    const a = montar(React.createElement(TopoDoDossie, { predio, salva: false, aoVoltar: () => undefined, aoAlternarSalvo: () => undefined, aoAbrirMapa: () => undefined }), largura, altura);
    expect(pedidas.length).toBeGreaterThan(0);
    conferir(pedidas[pedidas.length - 1]!, rua, `topo ${largura} px`);
    act(() => a.unmount());
  });
});

describe("os casos que faziam o nome sumir", () => {
  it("Por perto do Golden Tower (a rua tem 84 px no quadro e o nome 155): o nome fica junto do pino, não some", () => {
    const predio = edificioPorId("8001-216", "boa-viagem")!;
    const a = montar(React.createElement(MapaDoLote, { predio, obras: [], vizinhos: edificiosDoBairro("boa-viagem"), pontosExtras: pontosDoPorPerto(predio.centro) }), 305, 280);
    const { entrada, cena } = pedidas[pedidas.length - 1]!;
    expect(cena.nivel).toBe("bairro");
    const r = cena.rotulos.find((x) => x.tipo === "imovel")!;
    const [px, py] = entrada.quadro.paraDesenho(predio.centro);
    const meio = r.caixas[Math.floor(r.caixas.length / 2)]!;
    expect(Math.hypot((meio[0] + meio[2]) / 2 - px, (meio[1] + meio[3]) / 2 - py)).toBeLessThan(60);
    act(() => a.unmount());
  });

  it("/predio do Golden Tower (rua íngreme num quadro de 120 px livres): o nome fica deitado, com o meio em cima da via, e os números vizinhos que cairiam nele não são desenhados", () => {
    const predio = edificioPorId("8001-216", "boa-viagem")!;
    const vizinhos = edificiosDoBairro("boa-viagem");
    const a = montar(React.createElement(MapaDoPredio, { selecionado: predio, outros: vizinhos, aoEscolher: () => undefined }), 309, 180);
    const { cena } = pedidas[pedidas.length - 1]!;
    const r = cena.rotulos.find((x) => x.tipo === "imovel")!;
    const ys = r.caixas.map((c) => (c[1] + c[3]) / 2);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.01);
    // Os lotes vizinhos continuam botões com o endereço; só o número desenhado cede.
    const numeros = a.root.findAllByType(TextoSvg).filter((t) => /^\d+[A-Z]?$/.test(String(t.props.children)));
    const botoes = a.root.findAll((n) => typeof n.type !== "string" && n.props.accessibilityRole === "button" && typeof n.props.onPress === "function" && typeof n.props.accessibilityLabel === "string");
    expect(numeros.length).toBeGreaterThan(0);
    expect(new Set(botoes.map((b) => b.props.accessibilityLabel)).size).toBeGreaterThan(numeros.length);
    act(() => a.unmount());
  });

  it("zoom máximo sobre um lote grande (Pina): a via sai da janela e o nome continua na tela, deitado, junto do pino", () => {
    const predio = edificioPorId("32948-160", "pina")!;
    const a = montar(React.createElement(MapaDoLote, { predio, obras: [], vizinhos: edificiosDoBairro("pina") }), 343, 280);
    aproximarAteOFim(a);
    const { entrada, cena } = pedidas[pedidas.length - 1]!;
    expect(entrada.quadro.zoom).toBe(4);
    const r = cena.rotulos.find((x) => x.tipo === "imovel")!;
    expect(r.nome).toBe("Av. Jemil Asfora");
    const [px, py] = entrada.quadro.paraDesenho(predio.centro);
    const meio = r.caixas[Math.floor(r.caixas.length / 2)]!;
    // Em px da tela (zoom 4): a menos de 40 px do pino.
    expect(Math.hypot((meio[0] + meio[2]) / 2 - px, (meio[1] + meio[3]) / 2 - py) * 4).toBeLessThan(40);
    // O nome caiu sobre o lote do imóvel (azul): o desenho inverte as cores, texto claro com halo no azul do lote.
    expect(r.sobreOLote).toBe(true);
    const estilo = estiloDoFundo(CORES_CLARO);
    const marcacao = marcacaoDoFundo(cena, estilo, "rotulos", "t");
    expect(marcacao).toContain(`fill="${estilo.ruaDoImovelSobreOLote}" style="font-family:PlusJakartaSans`);
    expect(marcacao).toContain(`stroke="${estilo.haloSobreOLote}"`);
    expect(marcacao).not.toContain(`fill="${estilo.ruaDoImovel}" style=`);
    act(() => a.unmount());
  });

  it("fora do lote, o nome continua no azul cadastral com o halo do chão (Golden Tower na gaveta)", () => {
    const predio = edificioPorId("8001-216", "boa-viagem")!;
    const a = montar(React.createElement(MapaDoLote, { predio, obras: [], vizinhos: edificiosDoBairro("boa-viagem") }), 343, 280);
    const { cena } = pedidas[pedidas.length - 1]!;
    const r = cena.rotulos.find((x) => x.tipo === "imovel")!;
    expect(r.sobreOLote).toBeUndefined();
    const estilo = estiloDoFundo(CORES_CLARO);
    expect(marcacaoDoFundo(cena, estilo, "rotulos", "t")).toContain(`fill="${estilo.ruaDoImovel}" style="font-family:PlusJakartaSans;font-size:8.5px;font-weight:700"`);
    act(() => a.unmount());
  });
});

describe("a busca de lugar (função pura)", () => {
  const rua = (trechos: number[][]) => [{ nome: "R. do Imóvel de Nome Comprido", tipo: "imovel" as const, trechos }];
  const limite: Ret = [10, 10, 290, 110];

  it("via reta e livre: o nome corre sobre ela", () => {
    const [r] = posicionarRotulosDeRua(rua([[10, 60, 290, 60]]), 1, [], 0, limite, limite, undefined, { ancora: [150, 50] });
    expect(r).toBeDefined();
    for (const c of r!.caixas) expect((c[1] + c[3]) / 2).toBeCloseTo(60, 6);
  });

  it("via curta com o pino no meio: o nome desliza na direção da via e fica o mais perto do imóvel que der", () => {
    const pino: Ret = [137, 47, 163, 73];
    const [r] = posicionarRotulosDeRua(rua([[120, 60, 180, 60]]), 1, [pino], 0, limite, limite, undefined, { ancora: [150, 60] });
    expect(r).toBeDefined();
    for (const c of r!.caixas) expect(sobrepoe(c, pino)).toBe(false);
    // Na direção da via (horizontal) e a menos de 4 em de lado.
    const ys = r!.caixas.map((c) => (c[1] + c[3]) / 2);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.01);
    expect(Math.abs(ys[0]! - 60)).toBeLessThanOrEqual(TAMANHO_DA_RUA * 4 + 0.01);
  });

  it("via íngreme num quadro baixo: o nome fica deitado, com o meio num ponto da via", () => {
    const [r] = posicionarRotulosDeRua(rua([[200, 10, 180, 110]]), 1, [], 0, limite, limite, undefined, { ancora: [150, 40] });
    expect(r).toBeDefined();
    const ys = r!.caixas.map((c) => (c[1] + c[3]) / 2);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.01);
    const meioX = (r!.caixas[0]![0] + r!.caixas[r!.caixas.length - 1]![2]) / 2;
    const xDaViaNessaAltura = 200 - ((ys[0]! - 10) / 100) * 20;
    expect(Math.abs(meioX - xDaViaNessaAltura)).toBeLessThan(1);
  });

  it("o lote do imóvel (fraco) é respeitado enquanto há outro lugar e cedido quando não há", () => {
    const lote: Ret = [100, 40, 200, 80];
    const comLugar = posicionarRotulosDeRua(rua([[10, 60, 290, 60]]), 1, [], 0, limite, limite, undefined, { ancora: [150, 60], fracos: [lote] })[0]!;
    for (const c of comLugar.caixas) expect(sobrepoe(c, lote)).toBe(false);
    // O quadro inteiro tomado pelo lote: o nome vai por cima dele (é desenho do fundo, fica por baixo do texto).
    const semLugar = posicionarRotulosDeRua(rua([[10, 60, 290, 60]]), 1, [], 0, limite, limite, undefined, { ancora: [150, 60], fracos: [[0, 0, 300, 120]] })[0];
    expect(semLugar).toBeDefined();
  });

  it("o que a tela põe por cima nunca é coberto: com um só vão livre, o nome vai para ele", () => {
    // Tudo ocupado menos uma faixa de 20 px de altura embaixo, à esquerda.
    const obstaculos: Ret[] = [
      [0, 0, 300, 84],
      [200, 84, 300, 120],
    ];
    const [r] = posicionarRotulosDeRua(rua([[150, 10, 150, 110]]), 1, obstaculos, 0, limite, limite, undefined, { ancora: [150, 40] });
    expect(r).toBeDefined();
    for (const c of r!.caixas) for (const o of obstaculos) expect(sobrepoe(c, o)).toBe(false);
  });

  it("sem lugar nenhum livre no limite, não inventa: fica sem rótulo (e a descrição acessível continua dizendo a rua)", () => {
    expect(posicionarRotulosDeRua(rua([[10, 60, 290, 60]]), 1, [[0, 0, 300, 120]], 0, limite, limite, undefined, { ancora: [150, 60] })).toEqual([]);
  });

  it("os outros nomes de rua desviam do nome da rua do imóvel, que vem primeiro", () => {
    const candidatos = [...rua([[10, 60, 290, 60]]), { nome: "R. Qualquer Outra", tipo: "rua" as const, trechos: [[10, 62, 290, 62]] }];
    const rotulos = posicionarRotulosDeRua(candidatos, 1, [], 0, limite, limite, undefined, { ancora: [150, 60] });
    expect(rotulos[0]!.tipo).toBe("imovel");
    for (const outro of rotulos.slice(1)) for (const c of outro.caixas) for (const meu of rotulos[0]!.caixas) expect(sobrepoe(c, meu)).toBe(false);
  });
});
