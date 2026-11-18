// Fundo do mapa (mapa-base, 18/11/2026): cena pura e componente, sobre os recortes reais em volta do Golden Tower
// (docs/aplicacao/mapa-base-2026-11-18/recortes/, Boa Viagem, índice 8001-216).
import { afterEach, describe, expect, it } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Path, Text as TextoSvg } from "react-native-svg";
import { FundoDoMapa, CreditoDaBase, SeloDoBairro } from "../src/componentes/mapa/FundoDoMapa";
import {
  descreverFundoDoMapa,
  loteNoPonto,
  montarFundoDoMapa,
  rotuloDoLote,
  type CenaDoFundo,
  type EntradaDoFundo,
} from "../src/componentes/mapa/fundoDoMapaCena";
import { estiloDoFundo } from "../src/componentes/mapa/fundoDoMapaEstilo";
import type { MapaBaseDaCidade, MapaBaseDoBairro, PoligonoBase } from "../src/dados/recife/mapaBaseContrato";
import { TemaDoApp, TemaEscuro } from "../src/tema/Tema";
import { CORES_CLARO, CORES_ESCURO, type Cores } from "../src/tema/tokens";
import {
  CENTRO_DO_IMOVEL,
  LOGRADOURO_DO_IMOVEL,
  lerRecorte,
  mapaBaseDoRecorte,
  paraDesenhoCentrado,
  projetarPara,
} from "./apoio/mapa-base-de-teste";

const A = mapaBaseDoRecorte(lerRecorte("janela-A-gaveta"));
const B = mapaBaseDoRecorte(lerRecorte("janela-B-por-perto"));
const IMOVEL = { centro: CENTRO_DO_IMOVEL, codigoDoLogradouro: LOGRADOURO_DO_IMOVEL };

function entrada(bairros: MapaBaseDoBairro[], largura: number, altura: number, metros: number, zoom = 1, cidade: MapaBaseDaCidade | null = null): EntradaDoFundo {
  return {
    bairros,
    cidade,
    bairroDoImovel: "boa-viagem",
    imovel: IMOVEL,
    quadro: { largura, altura, paraDesenho: paraDesenhoCentrado(CENTRO_DO_IMOVEL, largura, altura, metros), zoom },
  };
}

const gaveta = (zoom = 1) => montarFundoDoMapa(entrada([A], 340, 300, 220, zoom));
const porPerto = () => montarFundoDoMapa(entrada([B], 340, 300, 1500));

/** Um vizinho sintético: a metade leste do recorte B, como se fosse outro bairro com arquivo próprio (sem feições). */
function vizinhoSintetico(): MapaBaseDoBairro {
  const origem = B.origem;
  const p = projetarPara(origem);
  const [lon0, lat0, lon1, lat1] = lerRecorte("janela-B-por-perto").bbox;
  const meio = (lon0 + lon1) / 2 + 0.002;
  const anel = Int32Array.from([meio, lat1, lon1 + 0.01, lat1, lon1 + 0.01, lat0, meio, lat0].reduce<number[]>((acc, v, i, arr) => {
    if (i % 2 === 0) acc.push(...p([v, arr[i + 1]!]));
    return acc;
  }, []));
  const parte: PoligonoBase = { aneis: [anel], caixa: [Math.min(anel[0]!, anel[6]!), anel[1]!, anel[2]!, anel[5]!] };
  return { versao: 1, bairro: "pina", origem, divisa: { slug: "pina", nome: "PINA", partes: [parte] }, quadras: [], lotes: [], ruas: [], agua: [], pracas: [] };
}

function contarSubcaminhos(d: string): number {
  return (d.match(/M/g) ?? []).length;
}

function luminancia(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x! + 0.05) / (y! + 0.05);
}

describe("nível pela escala na tela", () => {
  it("gaveta de 220 m: lotes, prédios do índice, quadras e água; selo do bairro; sem nome de bairro no desenho", () => {
    const c = gaveta();
    expect(c.nivel).toBe("lote");
    expect(Math.round(c.larguraEmMetros)).toBe(220);
    expect(c.camadas.lotes).not.toBe("");
    expect(c.camadas.predios).not.toBe("");
    expect(c.camadas.quadras).not.toBe("");
    expect(c.camadas.tintaDoBairro).toBe("");
    expect(c.selo).toBe("Boa Viagem");
    expect(c.bairros).toEqual([]);
  });
  it("por perto de 1,5 km: quadras, água, praça, tinta do bairro e nome; sem lote; só avenidas e corredores rotulados", () => {
    const c = porPerto();
    expect(c.nivel).toBe("bairro");
    expect(c.camadas.lotes).toBe("");
    expect(c.camadas.predios).toBe("");
    expect(c.camadas.quadras).not.toBe("");
    expect(c.camadas.agua).not.toBe("");
    expect(c.camadas.pracas).not.toBe("");
    expect(c.camadas.tintaDoBairro).not.toBe("");
    expect(c.selo).toBeNull();
    const ruas = B.ruas;
    for (const r of c.rotulos) {
      const base = ruas.find((x) => x.nome === r.nome)!;
      expect(base.avenida || base.corredor || base.perimetral || base.codigo === LOGRADOURO_DO_IMOVEL).toBe(true);
    }
  });
  it("o zoom conta: a gaveta de 1,5 km com zoom 3 mostra 500 m e volta ao nível de lote", () => {
    const c = montarFundoDoMapa(entrada([B], 340, 300, 1500, 3));
    expect(Math.round(c.larguraEmMetros)).toBe(500);
    expect(c.nivel).toBe("lote");
  });
  it("mais de 3 km, com o arquivo da cidade: bairros, água e avenidas em linha; sem quadra", () => {
    const cidade: MapaBaseDaCidade = { versao: 1, origem: B.origem, bairros: [B.divisa], agua: B.agua, vias: B.ruas.filter((r) => r.avenida || r.corredor) };
    const c = montarFundoDoMapa(entrada([B], 340, 300, 4000, 1, cidade));
    expect(c.nivel).toBe("cidade");
    expect(c.camadas.quadras).toBe("");
    expect(c.camadas.vias).not.toBe("");
    expect(c.camadas.chao).not.toBe("");
    expect(c.camadas.agua).not.toBe("");
  });
});

describe("uma forma por camada e descarte do que está fora", () => {
  it("cada camada é um caminho só, com muitos anéis", () => {
    const c = gaveta();
    for (const v of Object.values(c.camadas)) expect(typeof v).toBe("string");
    expect(contarSubcaminhos(c.camadas.lotes) + contarSubcaminhos(c.camadas.predios)).toBeGreaterThan(30);
    expect(contarSubcaminhos(c.camadas.predios)).toBeGreaterThan(20);
  });
  it("lotes fora do quadro de 220 m não entram (o recorte tem 450 × 400 m)", () => {
    const c = gaveta();
    const todos = A.lotes.length;
    expect(c.lotes.length).toBeLessThan(todos);
    for (const l of c.lotes) {
      expect(l.caixa[2]).toBeGreaterThanOrEqual(-1);
      expect(l.caixa[0]).toBeLessThanOrEqual(341);
      expect(l.caixa[3]).toBeGreaterThanOrEqual(-1);
      expect(l.caixa[1]).toBeLessThanOrEqual(301);
    }
    const larga = montarFundoDoMapa(entrada([A], 340, 300, 500));
    expect(larga.lotes.length).toBeGreaterThan(c.lotes.length);
  });
  it("a mesma feição vinda de dois arquivos (borda) é desenhada uma vez", () => {
    const uma = gaveta();
    const duas = montarFundoDoMapa(entrada([A, mapaBaseDoRecorte(lerRecorte("janela-A-gaveta"), "boa-viagem", [-34.91, -8.14])], 340, 300, 220));
    expect(contarSubcaminhos(duas.camadas.quadras)).toBe(contarSubcaminhos(uma.camadas.quadras));
    expect(contarSubcaminhos(duas.camadas.lotes)).toBe(contarSubcaminhos(uma.camadas.lotes));
    expect(duas.rotulos.map((r) => r.nome)).toEqual(uma.rotulos.map((r) => r.nome));
  });
});

type Caixa = readonly [number, number, number, number];
const sobrepoe = (a: Caixa, b: Caixa) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

const rotulo = (c: CenaDoFundo, i: number) => (i < c.rotulos.length ? c.rotulos[i]!.nome : c.bairros[i - c.rotulos.length]!.nome);

function semSobreposicao(c: CenaDoFundo) {
  const grupos = [...c.rotulos.map((r) => r.caixas), ...c.bairros.map((b) => [b.caixa])];
  for (let i = 0; i < grupos.length; i++) {
    for (let j = i + 1; j < grupos.length; j++) {
      for (const a of grupos[i]!) {
        for (const b of grupos[j]!) {
          if (sobrepoe(a, b)) throw new Error(`rótulos sobrepostos: ${rotulo(c, i)} × ${rotulo(c, j)}`);
        }
      }
    }
  }
}

describe("rótulos de rua", () => {
  it("a rua do imóvel é rotulada na gaveta de 220 m, nas duas medidas de gaveta, e em todo passo de zoom", () => {
    for (const [l, a] of [[340, 300], [327, 280]] as const) {
      for (const z of [1, 1.5, 2, 3]) {
        const c = montarFundoDoMapa(entrada([A], l, a, 220, z));
        const doImovel = c.rotulos.filter((r) => r.tipo === "imovel");
        expect(doImovel.length).toBeGreaterThanOrEqual(1);
        expect(doImovel[0]!.nome).toBe("R. Major Armando de Souza Mello");
      }
    }
  });
  it("nenhum par de rótulos se sobrepõe (por caixas), na gaveta, no por perto e com zoom", () => {
    semSobreposicao(gaveta());
    semSobreposicao(gaveta(3));
    semSobreposicao(porPerto());
  });
  it("lê da esquerda para a direita e fica dentro do quadro", () => {
    for (const c of [gaveta(), porPerto(), gaveta(2)]) {
      expect(c.rotulos.length).toBeGreaterThan(0);
      for (const r of c.rotulos) {
        const nums = r.caminho.match(/-?\d+(\.\d+)?/g)!.map(Number);
        expect(nums[nums.length - 2]!).toBeGreaterThanOrEqual(nums[0]!);
        for (const cx of r.caixas) {
          expect(cx[0]).toBeGreaterThanOrEqual(-1);
          expect(cx[2]).toBeLessThanOrEqual(c.largura + 1);
        }
      }
    }
  });
  it("texto com tamanho constante na tela: com zoom 2 o tamanho na cena cai pela metade e cabem mais nomes", () => {
    const z1 = gaveta(1);
    const z2 = gaveta(2);
    expect(z2.rotulos[0]!.tamanho * 2).toBeCloseTo(z1.rotulos[0]!.tamanho, 6);
    expect(z2.rotulos.length).toBeGreaterThan(z1.rotulos.length);
  });
  it("prioridade: a rua do imóvel primeiro, depois avenidas e corredores", () => {
    const c = porPerto();
    const tipos = c.rotulos.map((r) => r.tipo);
    expect(tipos.indexOf("imovel")).toBe(0);
  });
});

describe("bairros, hachura e divisas", () => {
  it("o nome do bairro do imóvel aparece com acento, maior, longe da borda", () => {
    const c = porPerto();
    const bv = c.bairros.find((b) => b.slug === "boa-viagem")!;
    expect(bv.nome).toBe("BOA VIAGEM");
    expect(bv.doImovel).toBe(true);
    expect(bv.x).toBeGreaterThan(20);
    expect(bv.x).toBeLessThan(320);
  });
  it("com um vizinho com arquivo: divisa tracejada dele, nome dele (de bairros.ts, com acento) e o chão cobre os dois", () => {
    const viz = vizinhoSintetico();
    const so = porPerto();
    const c = montarFundoDoMapa(entrada([B, viz], 340, 300, 1500));
    expect(so.camadas.divisas).toBe("");
    expect(c.camadas.divisas).not.toBe("");
    expect(c.camadas.divisaDoImovel).not.toBe("");
    expect(contarSubcaminhos(c.camadas.chao)).toBe(contarSubcaminhos(so.camadas.chao) + 1);
    const pina = c.bairros.find((b) => b.slug === "pina");
    expect(pina?.nome).toBe("PINA");
    expect(pina?.doImovel).toBe(false);
    semSobreposicao(c);
  });
  it("hachura cobre o quadro inteiro por baixo; sem arquivo nenhum, a cena não tem dado", () => {
    const c = porPerto();
    expect(contarSubcaminhos(c.camadas.hachura)).toBeGreaterThan(80);
    const vazia = montarFundoDoMapa({ bairros: [], cidade: null, bairroDoImovel: "boa-viagem", imovel: IMOVEL, quadro: { largura: 340, altura: 300, paraDesenho: paraDesenhoCentrado(CENTRO_DO_IMOVEL, 340, 300, 220) } });
    expect(vazia.temDado).toBe(false);
    expect(vazia.camadas.hachura).toBe("");
  });
});

describe("lote do imóvel, toque e acessibilidade", () => {
  it("o lote do imóvel é achado pela geometria (o recorte marca o mesmo com alvo: true)", () => {
    const c = gaveta();
    expect(c.camadas.loteDoImovel).not.toBe("");
    const doImovel = c.lotes.filter((l) => l.doImovel);
    expect(doImovel).toHaveLength(1);
    const recorte = lerRecorte("janela-A-gaveta");
    const alvo = recorte.features.find((f) => f.properties.camada === "lote" && f.properties.alvo)!;
    expect(doImovel[0]!.pavimentos).toBe(alvo.properties.pavimentos ?? null);
  });
  it("o lote no ponto: o centro do quadro é o lote do imóvel; um ponto noutro lote diz os pavimentos", () => {
    const c = gaveta();
    const centro = loteNoPonto(c, 170, 150)!;
    expect(centro.doImovel).toBe(true);
    expect(rotuloDoLote(centro)).toMatch(/^Lote do imóvel/);
    const vizinho = c.lotes.find((l) => !l.doImovel && l.pavimentos)!;
    const r = vizinho.aneis[0]!;
    // um ponto dentro: a média de três vértices consecutivos de um lote convexo cai dentro dele
    const [x, y] = [(r[0]! + r[2]! + r[4]!) / 3, (r[1]! + r[3]! + r[5]!) / 3];
    const achado = loteNoPonto(c, x, y)!;
    expect(rotuloDoLote(achado)).toMatch(/^Lote vizinho · \d+ pavimentos?$/);
    expect(loteNoPonto(porPerto(), 170, 150)).toBeNull();
    expect(rotuloDoLote({ ...vizinho, doImovel: false, pavimentos: 1 })).toBe("Lote vizinho · 1 pavimento");
    expect(rotuloDoLote({ ...vizinho, doImovel: false, pavimentos: null })).toBe("Lote vizinho");
  });
  it("a descrição diz a rua do imóvel, o bairro e a distância até a divisa", () => {
    const c = porPerto();
    const texto = descreverFundoDoMapa(c);
    expect(texto).toContain("bairro Boa Viagem");
    expect(texto).toContain("R. Major Armando de Souza Mello");
    expect(texto).toMatch(/A divisa mais próxima de Boa Viagem fica a [\d.]+ m do imóvel\./);
    expect(c.acessibilidade.distanciaDaDivisaM).toBeGreaterThan(0);
  });
});

describe("determinismo e custo", () => {
  it("mesma entrada, mesma cena", () => {
    const tirar = (c: CenaDoFundo) => JSON.stringify({ ...c, lotes: c.lotes.length });
    expect(tirar(gaveta())).toBe(tirar(gaveta()));
    expect(tirar(porPerto())).toBe(tirar(porPerto()));
  });
  it("marca o custo com performance.measure('fundo-do-mapa')", () => {
    const p = globalThis.performance;
    if (typeof p?.mark !== "function") return;
    p.clearMeasures?.("fundo-do-mapa");
    gaveta();
    expect(p.getEntriesByName("fundo-do-mapa", "measure").length).toBeGreaterThanOrEqual(1);
  });
});

describe("contraste dos rótulos (4,5:1) sobre o chão onde caem, claro e escuro", () => {
  for (const [nome, cores] of [["claro", CORES_CLARO], ["escuro", CORES_ESCURO]] as [string, Cores][]) {
    it(nome, () => {
      const e = estiloDoFundo(cores);
      // Rua: o texto fica na via (o chão) e tem halo da cor do chão.
      for (const cor of [e.rua, e.avenida, e.ruaDoImovel]) expect(contraste(cor, e.chao)).toBeGreaterThanOrEqual(4.5);
      // Nome de bairro: o halo da cor do chão contorna cada letra; é o que fica colado ao texto.
      for (const cor of [e.bairro, e.bairroDoImovel]) expect(contraste(cor, e.halo)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

const montadas: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  act(() => montadas.splice(0).forEach((a) => a.unmount()));
});

describe("componente FundoDoMapa", () => {
  for (const [nome, Tema] of [["claro", TemaDoApp], ["escuro", TemaEscuro]] as const) {
    it(`renderiza no ${nome} com no máximo ~30 elementos de fundo mais os rótulos`, () => {
      for (const c of [gaveta(), porPerto(), gaveta(3)]) {
        let a!: TestRenderer.ReactTestRenderer;
        act(() => {
          a = TestRenderer.create(React.createElement(Tema, null, React.createElement(FundoDoMapa, { cena: c })));
        });
        montadas.push(a);
        const textos = a.root.findAllByType(TextoSvg);
        expect(textos).toHaveLength(2 * (c.rotulos.length + c.bairros.length));
        const caminhos = a.root.findAllByType(Path).length - c.rotulos.length;
        expect(caminhos).toBeLessThanOrEqual(13);
        expect(caminhos).toBeGreaterThan(4);
        const rua = textos.find((t) => !t.props.stroke && t.props.fill === (nome === "claro" ? CORES_CLARO : CORES_ESCURO)["cor-azul-cadastral"]);
        if (c.nivel === "lote") expect(rua).toBeDefined();
      }
    });
  }
  it("selo e crédito", () => {
    let a!: TestRenderer.ReactTestRenderer;
    act(() => {
      a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(SeloDoBairro, { nome: "Boa Viagem" }), React.createElement(CreditoDaBase)));
    });
    montadas.push(a);
    const json = JSON.stringify(a.toJSON());
    expect(json).toContain("BAIRRO");
    expect(json).toContain("Boa Viagem");
    expect(json).toContain("Base: Prefeitura do Recife (ODbL)");
  });
});
