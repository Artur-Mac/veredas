// M7 (18/11/2026): na primeira abertura do "Por perto" o fundo do mapa chegava ~0,8 s depois do mapa, quase tudo baixando,
// conferindo e lendo os arquivos (o bairro, os vizinhos e a cidade). Agora, quando a aba Entorno abre, o Por perto lê esses
// arquivos para a memória em segundo plano. O teste conta as leituras de arquivo do mapa-base (o leitor de camadas dos
// testes) antes e depois: com o pré-aquecimento, abrir o mapa não lê mais nada e o fundo vem no primeiro desenho.
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { esquecerLargurasDoMapaDoLote, MapaDoLote, quadroDoPorPerto, type EntradaPontoExtraMapa } from "../src/componentes/dossie-v1/MapaDoLote";
import { ESPERA_DO_AQUECIMENTO_MS, PorPerto } from "../src/componentes/dossie-v1/PorPerto";
import { FundoDoMapa } from "../src/componentes/mapa/FundoDoMapa";
import { aquecerFundoDoMapa, BYTES_DO_AQUECIMENTO, esquecerCenasDoFundo, planoDeCargaDoFundo } from "../src/componentes/mapa/useFundoDoMapa";
import { Pressionavel } from "../src/componentes/Pressionavel";
import { descritorDaCamada, esquecerCamadas } from "../src/dados/camadas";
import type { SlugCoberto } from "../src/dados/recife/bairros";
import { pontosDoEntornoNoMapa } from "../src/dados/recife/camadasAmbientais";
import { edificioPorId, edificiosDoBairro } from "../src/dados/recife/indice";
import { arquivoDaCidade, arquivoDoMapaBase, bairrosDecodificadosEmMemoria, esquecerMapaBase } from "../src/dados/recife/mapaBase";
import { baseDeServicos, servicosProximos } from "../src/dados/recife/servicos";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("expo-router", () => ({}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.setTimeout(30000);

const CASOS: readonly [string, string, SlugCoberto][] = [
  ["Golden Tower", "8001-216", "boa-viagem"],
  ["Torre", "31950-280", "torre"],
  ["Casa Forte, junto à divisa", "2453-108", "casa-forte"],
  ["Pina", "32948-160", "pina"],
];

function pontosDoPorPerto(centro: [number, number]): EntradaPontoExtraMapa[] {
  const lista: EntradaPontoExtraMapa[] = [...pontosDoEntornoNoMapa(centro)];
  const base = baseDeServicos();
  servicosProximos(base, centro, 800, 4, 4).itens.forEach((item, i) => lista.push({ id: `ensino-${i}`, categoria: "ensino", rotulo: `Ensino ${i}`, detalhe: "", coordenada: item.coordenada, distanciaM: item.distanciaM }));
  servicosProximos(base, centro, 800, 5, 4).itens.forEach((item, i) => lista.push({ id: `saude-${i}`, categoria: "saude", rotulo: `Saúde ${i}`, detalhe: "", coordenada: item.coordenada, distanciaM: item.distanciaM }));
  return lista;
}

// Conta cada arquivo do mapa-base que o sistema de camadas lê (nos testes, o leitor síncrono do repositório).
type Leitor = (caminho: string) => unknown;
const g = globalThis as { __veredaLerCamadaEmTeste?: Leitor };
const leitorOriginal = g.__veredaLerCamadaEmTeste!;
let lidos: string[] = [];
beforeEach(() => {
  act(() => {
    esquecerMapaBase();
    esquecerCamadas();
  });
  esquecerCenasDoFundo();
  esquecerLargurasDoMapaDoLote();
  lidos = [];
  g.__veredaLerCamadaEmTeste = (caminho) => {
    if (caminho.includes("mapa-base")) lidos.push(caminho);
    return leitorOriginal(caminho);
  };
});
afterEach(() => {
  g.__veredaLerCamadaEmTeste = leitorOriginal;
  act(() => {
    esquecerMapaBase();
    esquecerCamadas();
  });
});

const esperar = (ms: number) => act(async () => void (await new Promise((r) => setTimeout(r, ms))));

function abrirOMapa(predio: NonNullable<ReturnType<typeof edificioPorId>>, bairro: SlugCoberto, pontosExtras: EntradaPontoExtraMapa[], medir: number | null): TestRenderer.ReactTestRenderer {
  let a!: TestRenderer.ReactTestRenderer;
  act(() => {
    a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(MapaDoLote, { predio, obras: [], vizinhos: edificiosDoBairro(bairro), pontosExtras })));
  });
  if (medir !== null) {
    const moldura = a.root.findAll((n) => typeof n.type === "string" && typeof n.props.onLayout === "function")[0]!;
    act(() => moldura.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: medir, height: 280 } } }));
  }
  return a;
}

describe.each(CASOS)("%s: pré-aquecer o fundo do Por perto", (_nome, id, bairro) => {
  const predio = edificioPorId(id, bairro)!;
  const pontosExtras = pontosDoPorPerto(predio.centro);

  it.each([305, 290, 682])("a %i px: depois do pré-aquecimento, abrir o mapa não lê nenhum arquivo e o fundo vem no primeiro desenho", async (largura) => {
    const quadro = quadroDoPorPerto(predio, [], pontosExtras, largura);
    const emMemoria = await aquecerFundoDoMapa(bairro, [quadro]);
    // Leu exatamente o plano de carga desse mapa (o bairro do imóvel e, se o quadro passa da borda dele, os vizinhos e a cidade).
    const plano = planoDeCargaDoFundo(bairro, quadro.caixa, quadro.largura);
    expect(plano.completo).toBe(true);
    expect([...emMemoria].sort()).toEqual([...plano.arquivos].sort());
    expect(new Set(lidos)).toEqual(new Set(plano.arquivos));
    expect(emMemoria).toContain(arquivoDoMapaBase(bairro));
    const antesDeAbrir = lidos.length;
    // A largura ficou lembrada: o mapa pede o fundo já no primeiro render, sem esperar a própria medida.
    const a = abrirOMapa(predio, bairro, pontosExtras, null);
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(1);
    expect(lidos.length).toBe(antesDeAbrir);
    act(() => a.unmount());
  });

  it("sem o pré-aquecimento (como era), é a abertura do mapa que lê os arquivos", () => {
    const a = abrirOMapa(predio, bairro, pontosExtras, 305);
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(1);
    expect(lidos.length).toBeGreaterThan(0);
    act(() => a.unmount());
  });
});

describe("pré-aquecimento: sem bloquear a tela e sem estourar a memória", () => {
  const predio = edificioPorId("8001-216", "boa-viagem")!;
  const pontosExtras = pontosDoPorPerto(predio.centro);

  it("não lê nada na chamada: a leitura começa depois de ceder a vez, um arquivo por vez", async () => {
    const promessa = aquecerFundoDoMapa("boa-viagem", [quadroDoPorPerto(predio, [], pontosExtras, 305)]);
    expect(lidos).toEqual([]);
    await promessa;
    expect(lidos.length).toBeGreaterThan(0);
  });

  it("só o bairro do imóvel é decodificado; os outros arquivos ficam brutos até o mapa abrir", async () => {
    const emMemoria = await aquecerFundoDoMapa("boa-viagem", [quadroDoPorPerto(predio, [], pontosExtras, 305)]);
    expect(emMemoria.length).toBeGreaterThan(2);
    expect(bairrosDecodificadosEmMemoria()).toEqual(["boa-viagem"]);
  });

  it("um quadro que tocaria dezenas de bairros lê só até o teto de 4 MB de JSON, com o bairro do imóvel e a cidade entre os lidos", async () => {
    // 12 km de lado a 2 m por pixel (nível de lote): o plano pede todos os bairros cuja caixa toca o quadro.
    const [lon, lat] = predio.centro;
    const quadro = { caixa: [lon - 0.055, lat - 0.055, lon + 0.055, lat + 0.055] as [number, number, number, number], largura: 6000 };
    const emMemoria = await aquecerFundoDoMapa("boa-viagem", [quadro]);
    const doPlano = planoDeCargaDoFundo("boa-viagem", quadro.caixa, quadro.largura).arquivos;
    const bytesDe = (arquivos: readonly string[]) => arquivos.reduce((s, a) => s + (descritorDaCamada(a)?.bytes ?? 0), 0);
    expect(bytesDe(doPlano)).toBeGreaterThan(BYTES_DO_AQUECIMENTO);
    expect(emMemoria.length).toBeLessThan(doPlano.length);
    expect(bytesDe([...new Set(lidos)])).toBeLessThanOrEqual(BYTES_DO_AQUECIMENTO);
    expect(emMemoria).toContain(arquivoDoMapaBase("boa-viagem"));
    expect(emMemoria).toContain(arquivoDaCidade());
  });

  it("os planos do Por perto dos quatro prédios, nas três larguras, cabem inteiros no teto", () => {
    for (const [, id, bairro] of CASOS) {
      const p = edificioPorId(id, bairro)!;
      for (const largura of [305, 290, 682]) {
        const quadro = quadroDoPorPerto(p, [], pontosDoPorPerto(p.centro), largura);
        // Com o arquivo do bairro em memória (o leitor dos testes é síncrono), o plano já é o definitivo.
        const plano = planoDeCargaDoFundo(bairro, quadro.caixa, quadro.largura);
        expect(plano.completo).toBe(true);
        expect(plano.arquivos.reduce((s, a) => s + (descritorDaCamada(a)?.bytes ?? 0), 0)).toBeLessThanOrEqual(BYTES_DO_AQUECIMENTO);
      }
    }
  });

  it("cancelado (a pessoa saiu da aba): para de ler", async () => {
    let cancelado = false;
    const promessa = aquecerFundoDoMapa("boa-viagem", [quadroDoPorPerto(predio, [], pontosExtras, 305)], () => cancelado);
    cancelado = true;
    expect(await promessa).toEqual([]);
    expect(lidos).toEqual([]);
  });

  it("arquivo que não pôde ser lido não quebra nada: o que deu fica em memória e o mapa abre e tenta de novo", async () => {
    const doBairro = arquivoDoMapaBase("boa-viagem")!;
    const cidade = arquivoDaCidade()!;
    g.__veredaLerCamadaEmTeste = (caminho) => {
      if (caminho === cidade) throw new Error("sem rede");
      if (caminho.includes("mapa-base")) lidos.push(caminho);
      return leitorOriginal(caminho);
    };
    const emMemoria = await aquecerFundoDoMapa("boa-viagem", [quadroDoPorPerto(predio, [], pontosExtras, 305)]);
    expect(emMemoria).toContain(doBairro);
    expect(emMemoria).not.toContain(cidade);
  });
});

describe("Por perto na aba Entorno", () => {
  const predio = edificioPorId("8001-216", "boa-viagem")!;
  const vizinhos = edificiosDoBairro("boa-viagem");

  it("ao abrir, mede a própria largura e pré-aquece; 'Ver no mapa' já encontra os arquivos em memória e o fundo vem no primeiro desenho", async () => {
    let a!: TestRenderer.ReactTestRenderer;
    act(() => {
      a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(PorPerto, { bairro: "boa-viagem", predioId: predio.id, centro: predio.centro, edificio: predio, obras: [], vizinhos })));
    });
    const raiz = a.root.find((n) => typeof n.type === "string" && n.props.role === "group" && typeof n.props.onLayout === "function");
    // Nada é lido ao desenhar a aba: só depois da medida e da espera.
    expect(lidos).toEqual([]);
    act(() => raiz.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 305, height: 600 } } }));
    expect(lidos).toEqual([]);
    // Espera o pré-aquecimento terminar (as leituras param de chegar), sem depender de a máquina estar livre.
    for (let i = 0, antes = -1, parado = 0; i < 100 && parado < 3; i++) {
      await esperar(ESPERA_DO_AQUECIMENTO_MS);
      parado = lidos.length > 0 && lidos.length === antes ? parado + 1 : 0;
      antes = lidos.length;
    }
    expect(new Set(lidos).size).toBeGreaterThan(2);
    expect(lidos).toContain(arquivoDoMapaBase("boa-viagem"));
    const antesDeAbrir = lidos.length;
    const ver = a.root.findAllByType(Pressionavel).find((p) => p.props.accessibilityLabel === "Ver pontos por perto no mapa")!;
    act(() => (ver.props.onPress as () => void)());
    expect(a.root.findAllByType(FundoDoMapa)).toHaveLength(1);
    expect(lidos.length).toBe(antesDeAbrir);
    act(() => a.unmount());
  });

  it("sair da aba antes da espera cancela: nada é lido", async () => {
    let a!: TestRenderer.ReactTestRenderer;
    act(() => {
      a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(PorPerto, { bairro: "boa-viagem", predioId: predio.id, centro: predio.centro, edificio: predio, obras: [], vizinhos })));
    });
    const raiz = a.root.find((n) => typeof n.type === "string" && n.props.role === "group" && typeof n.props.onLayout === "function");
    act(() => raiz.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 305, height: 600 } } }));
    act(() => a.unmount());
    await esperar(ESPERA_DO_AQUECIMENTO_MS + 250);
    expect(lidos).toEqual([]);
  });
});
