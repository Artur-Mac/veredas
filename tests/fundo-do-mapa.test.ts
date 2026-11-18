// Fundo do mapa (mapa-base, 18/11/2026): cena pura e componente, sobre os recortes reais em volta do Golden Tower
// (docs/aplicacao/mapa-base-2026-11-18/recortes/, Boa Viagem, índice 8001-216).
import { afterEach, describe, expect, it } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Defs, Path, Rect, Text as TextoSvg, TextPath } from "react-native-svg";
import { FundoDoMapa, CreditoDaBase, SeloDoBairro } from "../src/componentes/mapa/FundoDoMapa";
import {
  descreverFundoDoMapa,
  LOTES_ATE_M_POR_PX,
  loteNoPonto,
  montarFundoDoMapa,
  nivelDaEscala,
  QUADRAS_ATE_M_POR_PX,
  rotuloDoLote,
  type CenaDoFundo,
  type EntradaDoFundo,
} from "../src/componentes/mapa/fundoDoMapaCena";
import { estiloDoFundo } from "../src/componentes/mapa/fundoDoMapaEstilo";
import { pontoNosAneis } from "../src/componentes/mapa/fundoDoMapaGeometria";
import { bairrosNaCaixa, mapaBaseDaCidade, mapaBaseDoBairro } from "../src/dados/recife/mapaBase";
import { METROS_POR_GRAU } from "../src/dados/recife/mapaBaseContrato";
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
  return { versao: 1, bairro: "pina", origem, divisa: { slug: "pina", nome: "PINA", partes: [parte] }, quadras: [], lotes: [], ruas: [], agua: [], pracas: [], pontes: [] };
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
  it("o nível vem de metros por pixel: 2,4 m/px (800 m em 340 px) e 8,8 m/px (3 km em 340 px)", () => {
    expect([LOTES_ATE_M_POR_PX, QUADRAS_ATE_M_POR_PX]).toEqual([2.4, 8.8]);
    expect([nivelDaEscala(2.4), nivelDaEscala(2.41), nivelDaEscala(8.8), nivelDaEscala(8.81)]).toEqual(["lote", "bairro", "bairro", "cidade"]);
    const p = montarFundoDoMapa(entrada([B], 340, 300, 800));
    expect(p.metrosPorPx).toBeCloseTo(800 / 340, 3);
    expect(p.nivel).toBe("lote");
  });
  it("tela larga: num quadro de 1240 px a 802 m (0,65 m/px) os lotes aparecem", () => {
    const c = montarFundoDoMapa(entrada([B], 1240, 600, 802));
    expect(c.nivel).toBe("lote");
    expect(c.camadas.lotes).not.toBe("");
    expect(c.lotes.length).toBeGreaterThan(100);
  });
  it("o lote do imóvel continua no nível de quadras (camada sem restrição de nível na tabela)", () => {
    expect(porPerto().camadas.loteDoImovel).not.toBe("");
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
      const e = estiloDoFundo(cores, cores === CORES_ESCURO);
      // Rua: o texto fica na via (o chão) e tem halo da cor do chão (o componente desenha o halo: ver os testes dele).
      expect(e.halo).toBe(e.chao);
      for (const cor of [e.rua, e.avenida, e.ruaDoImovel]) expect(contraste(cor, e.chao)).toBeGreaterThanOrEqual(4.5);
      // Nome de bairro: o halo da cor do chão contorna cada letra; é o que fica colado ao texto.
      for (const cor of [e.bairro, e.bairroDoImovel]) expect(contraste(cor, e.halo)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

/** Distância entre duas cores em RGB (0 a 441): separa tons de luminância parecida e matiz diferente (a água). */
function distanciaRgb(a: string, b: string): number {
  const v = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [v(a), v(b)];
  return Math.hypot(x[0]! - y[0]!, x[1]! - y[1]!, x[2]! - y[2]!);
}

describe("as camadas se distinguem nos dois temas", () => {
  for (const [nome, cores] of [["claro", CORES_CLARO], ["escuro", CORES_ESCURO]] as [string, Cores][]) {
    it(`${nome}: sem dado, rua, quadra e lote em degraus; avenida da cidade contra o chão; água separada`, () => {
      const e = estiloDoFundo(cores, cores === CORES_ESCURO);
      // Rua × quadra e quadra × lote: degrau de luminância medido.
      expect(contraste(e.chao, e.quadra)).toBeGreaterThanOrEqual(1.25);
      expect(contraste(e.quadra, e.lote)).toBeGreaterThanOrEqual(1.1);
      // Sem dado × rua: a cor muda, e a hachura por cima separa ainda mais.
      expect(e.semDado).not.toBe(e.chao);
      expect(Math.max(contraste(e.semDado, e.chao), contraste(e.hachura, e.semDado))).toBeGreaterThanOrEqual(1.25);
      expect(contraste(e.hachura, e.semDado)).toBeGreaterThanOrEqual(1.25);
      // A avenida em linha no nível de cidade aparece sobre o chão (antes era a mesma cor).
      expect(contraste(e.via, e.chao)).toBeGreaterThanOrEqual(1.6);
      // O contorno do lote aparece sobre o lote.
      expect(contraste(e.loteLinha, e.lote)).toBeGreaterThanOrEqual(1.15);
      // A água não se confunde com quadra, lote nem prédio do índice.
      for (const outra of [e.quadra, e.lote, e.predio, e.chao]) expect(distanciaRgb(e.agua, outra)).toBeGreaterThanOrEqual(30);
    });
  }
  it("no claro, as cores das camadas são as da tabela da seção 4", () => {
    const e = estiloDoFundo(CORES_CLARO);
    expect([e.chao, e.semDado, e.quadra, e.lote, e.loteLinha, e.agua]).toEqual([
      CORES_CLARO["cor-superficie"],
      CORES_CLARO["cor-papel-claro"],
      CORES_CLARO["cor-sutil"],
      CORES_CLARO["cor-fundo"],
      CORES_CLARO["cor-linha-forte"],
      "#D3DEE8",
    ]);
  });
});

/** Uma ponte sintética: um tabuleiro de 60 × 12 m centrado num ponto que cai dentro da maior água do recorte B. */
function comPonte(): { base: MapaBaseDoBairro; centro: [number, number] } {
  const agua = [...B.agua].sort((a, b) => (b.caixa[2] - b.caixa[0]) * (b.caixa[3] - b.caixa[1]) - (a.caixa[2] - a.caixa[0]) * (a.caixa[3] - a.caixa[1]))[0]!;
  let centro: [number, number] | null = null;
  for (let i = 1; i < 20 && !centro; i++) {
    for (let j = 1; j < 20 && !centro; j++) {
      const x = agua.caixa[0] + ((agua.caixa[2] - agua.caixa[0]) * i) / 20;
      const y = agua.caixa[1] + ((agua.caixa[3] - agua.caixa[1]) * j) / 20;
      if (pontoNosAneis(x, y, agua.aneis)) centro = [Math.round(x), Math.round(y)];
    }
  }
  const [x, y] = centro!;
  const anel = Int32Array.from([x - 300, y - 60, x + 300, y - 60, x + 300, y + 60, x - 300, y + 60]);
  return { base: { ...B, pontes: [{ aneis: [anel], caixa: [x - 300, y - 60, x + 300, y + 60] }] }, centro: [x, y] };
}

describe("pontes", () => {
  it("chão de rua por cima da água, numa forma só, nos níveis de lote e de quadras; nada na cidade", () => {
    const { base } = comPonte();
    expect(porPerto().camadas.pontes).toBe("");
    const quadras = montarFundoDoMapa(entrada([base], 340, 300, 1500));
    const lote = montarFundoDoMapa(entrada([base], 340, 300, 1500, 3));
    expect(quadras.nivel).toBe("bairro");
    expect(lote.nivel).toBe("lote");
    for (const c of [quadras, lote]) {
      expect(contarSubcaminhos(c.camadas.pontes)).toBe(1);
      expect(c.camadas.agua).not.toBe("");
    }
    const cidade: MapaBaseDaCidade = { versao: 1, origem: B.origem, bairros: [B.divisa], agua: B.agua, vias: [] };
    expect(montarFundoDoMapa(entrada([base], 340, 300, 4000, 1, cidade)).camadas.pontes).toBe("");
  });
});

describe("obstáculos do mapa que hospeda", () => {
  it("rótulos de rua e nomes de bairro desviam do selo, da régua, do crédito e dos botões (px da tela, com zoom)", () => {
    for (const [metros, zoom] of [[220, 1], [220, 3], [1500, 1]] as const) {
      const livre = montarFundoDoMapa(entrada([metros > 800 ? B : A], 340, 300, metros, zoom));
      // Os retângulos que cobrem as caixas dos rótulos da cena livre, em px da tela.
      const tela = (x: number, y: number): [number, number] => [170 + (x - 170) * zoom, 150 + (y - 150) * zoom];
      const ocupados = [...livre.rotulos.filter((r) => r.tipo !== "imovel").flatMap((r) => r.caixas), ...livre.bairros.filter((b) => !b.doImovel).map((b) => b.caixa)];
      expect(ocupados.length).toBeGreaterThan(0);
      const obstaculos = ocupados.map((c) => [...tela(c[0], c[1]), ...tela(c[2], c[3])] as [number, number, number, number]);
      const e = entrada([metros > 800 ? B : A], 340, 300, metros, zoom);
      const c = montarFundoDoMapa({ ...e, quadro: { ...e.quadro, obstaculos } });
      const desenho = obstaculos.map(([x0, y0, x1, y1]) => [170 + (x0 - 170) / zoom, 150 + (y0 - 150) / zoom, 170 + (x1 - 170) / zoom, 150 + (y1 - 150) / zoom] as const);
      for (const r of c.rotulos.filter((x) => x.tipo !== "imovel")) for (const cx of r.caixas) for (const o of desenho) expect(sobrepoe(cx, o)).toBe(false);
      for (const b of c.bairros) for (const o of desenho) expect(sobrepoe(b.caixa, o)).toBe(false);
    }
  });
  it("o deslocamento do grupo de zoom entra na conta", () => {
    const e = entrada([A], 340, 300, 220, 2);
    // Um obstáculo no canto superior direito da tela, com o desenho deslocado 40 px para a esquerda.
    const c = montarFundoDoMapa({ ...e, quadro: { ...e.quadro, obstaculos: [[250, 0, 340, 60]], deslocamento: [-40, 0] } });
    const o = [170 + (250 - 170 + 40) / 2, 150 + (0 - 150) / 2, 170 + (340 - 170 + 40) / 2, 150 + (60 - 150) / 2] as const;
    for (const r of c.rotulos.filter((x) => x.tipo !== "imovel")) for (const cx of r.caixas) expect(sobrepoe(cx, o)).toBe(false);
  });
});

const comArquivosReais = mapaBaseDoBairro("boa-viagem") !== null && mapaBaseDaCidade() !== null;

(comArquivosReais ? describe : describe.skip)("arquivos reais: a rua do imóvel no nível de cidade", () => {
  const real = (bairros: MapaBaseDoBairro[], largura: number, altura: number, metros: number): EntradaDoFundo => ({
    ...entrada(bairros, largura, altura, metros, 1, mapaBaseDaCidade()),
  });
  it("com o arquivo de Boa Viagem carregado, a 5 e a 12 km: a rua vem do arquivo do bairro, entra na descrição e ganha rótulo se couber", () => {
    const bv = mapaBaseDoBairro("boa-viagem")!;
    for (const metros of [5000, 12000]) {
      const c = montarFundoDoMapa(real([bv], 340, 300, metros));
      expect(c.nivel).toBe("cidade");
      expect(c.camadas.vias).not.toBe("");
      expect(c.acessibilidade.rua).toBe("R. Major Armando de Souza Mello");
      expect(descreverFundoDoMapa(c)).toContain("O imóvel fica na R. Major Armando de Souza Mello.");
      // Rótulo só se couber: nunca por cima do pino (13 px em volta do centro).
      for (const r of c.rotulos.filter((x) => x.tipo === "imovel")) {
        expect(r.nome).toBe("R. Major Armando de Souza Mello");
        for (const cx of r.caixas) expect(sobrepoe(cx, [157, 137, 183, 163])).toBe(false);
      }
    }
  });
  it("só com a cidade (nenhum arquivo de bairro), a rua não é conhecida: nem rótulo nem descrição, e nada quebra", () => {
    const c = montarFundoDoMapa(real([], 340, 300, 220));
    expect(c.temDado).toBe(true);
    expect(c.acessibilidade.rua).toBeNull();
    expect(c.rotulos.some((r) => r.tipo === "imovel")).toBe(false);
  });
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
        const cores = nome === "claro" ? CORES_CLARO : CORES_ESCURO;
        const e = estiloDoFundo(cores, nome === "escuro");
        const textos = a.root.findAllByType(TextoSvg);
        expect(textos).toHaveLength(2 * (c.rotulos.length + c.bairros.length));
        // Contagem verdadeira: 13 Path de camada no máximo, mais 1 Path por rótulo de rua (no Defs); 1 Rect.
        const defs = a.root.findAllByType(Defs);
        const noDefs = defs.flatMap((d) => d.findAllByType(Path));
        expect(noDefs).toHaveLength(c.rotulos.length);
        const deCamada = a.root.findAllByType(Path).length - noDefs.length;
        expect(deCamada).toBeLessThanOrEqual(13);
        expect(deCamada).toBeGreaterThan(4);
        expect(a.root.findAllByType(Rect)).toHaveLength(1);
        // TextPath: href aponta para um id que existe no Defs, com o startOffset e o texto do rótulo.
        const ids = new Set(noDefs.map((p) => p.props.id as string));
        const caminhos = a.root.findAllByType(TextPath);
        expect(caminhos).toHaveLength(2 * c.rotulos.length);
        for (const tp of caminhos) {
          // O id leva um prefixo por instância (dois fundos na mesma página web não se confundem).
          const r = c.rotulos.find((x) => (tp.props.href as string).endsWith(`-${x.id}`))!;
          expect(r).toBeDefined();
          const id = (tp.props.href as string).slice(1);
          expect(ids.has(id)).toBe(true);
          expect(noDefs.find((p) => p.props.id === id)!.props.d).toBe(r.caminho);
          expect(tp.props.startOffset).toBe(r.inicio);
          expect(tp.props.children).toBe(r.nome);
        }
        // Halo: todo rótulo tem o par com traço da cor do chão, desenhado antes (por baixo) do texto.
        const comHalo = textos.filter((t) => t.props.stroke);
        const semHalo = textos.filter((t) => !t.props.stroke);
        expect(comHalo).toHaveLength(semHalo.length);
        for (const h of comHalo) {
          expect(h.props.stroke).toBe(e.chao);
          expect(h.props.fill).toBe(e.chao);
          expect(h.props.strokeWidth).toBeGreaterThan(0);
        }
        expect(textos.indexOf(comHalo[comHalo.length - 1]!)).toBeLessThan(textos.indexOf(semHalo[0]!));
        for (const r of c.rotulos) {
          const par = caminhos.filter((tp) => (tp.props.href as string).endsWith(`-${r.id}`));
          expect(par).toHaveLength(2);
        }
        const rua = semHalo.find((t) => t.props.fill === cores["cor-azul-cadastral"]);
        if (c.nivel === "lote") {
          expect(rua).toBeDefined();
          expect(rua!.props.fontWeight).toBe("700");
          expect(rua!.props.textAnchor).toBe("middle");
        }
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

// Correções da F2 (18/11/2026): chão junto à divisa, nome do bairro do imóvel, rua do imóvel na janela visível.
describe("junto à divisa e janela visível (arquivos reais)", () => {
  const CASA_FORTE: readonly [number, number] = [-34.914433, -8.035775];
  const deslocar = (c: readonly [number, number], lesteM: number, norteM: number): [number, number] => [
    c[0] + lesteM / (METROS_POR_GRAU * Math.cos((c[1] * Math.PI) / 180)),
    c[1] + norteM / METROS_POR_GRAU,
  ];
  const cena = (centro: readonly [number, number], metros: number, bairros: MapaBaseDoBairro[], comCidade: boolean, extra: Partial<EntradaDoFundo["quadro"]> = {}, largura = 343, altura = 280) =>
    montarFundoDoMapa({
      bairros,
      cidade: comCidade ? mapaBaseDaCidade() : null,
      bairroDoImovel: "casa-forte",
      imovel: { centro: CASA_FORTE, codigoDoLogradouro: 2453 },
      quadro: { largura, altura, paraDesenho: paraDesenhoCentrado(centro, largura, altura, metros), zoom: 1, ...extra },
    });
  const casaForte = () => mapaBaseDoBairro("casa-forte")!;

  it("na borda de 300 m, com a cidade: o vizinho ganha chão (não fica hachurado), divisa e nome no nível de lote", () => {
    const c = cena(CASA_FORTE, 220, [casaForte()], true);
    expect(c.nivel).toBe("lote");
    expect(c.camadas.chaoDaCidade).not.toBe("");
    expect(c.camadas.divisas).not.toBe("");
    expect(c.camadas.divisaDoImovel).not.toBe("");
    expect(c.bairros.map((b) => b.slug)).toContain("parnamirim");
    expect(c.bairros.some((b) => b.doImovel)).toBe(false);
  });

  it("sem a cidade o vizinho continua sem chão (como antes)", () => {
    const c = cena(CASA_FORTE, 220, [casaForte()], false);
    expect(c.camadas.chaoDaCidade ?? "").toBe("");
  });

  it("bem além da borda, só com o arquivo do bairro e a cidade: nenhum chão de rua sem quadras (fica sem dado)", () => {
    const c = cena(deslocar(CASA_FORTE, 0, -1500), 400, [casaForte()], true);
    expect(c.camadas.chaoDaCidade ?? "").toBe("");
  });

  it("além da borda com os vizinhos carregados: o chão vem dos arquivos deles", () => {
    const centro = deslocar(CASA_FORTE, 0, -1500);
    const m = 400;
    const meiaL = m / 2 / (METROS_POR_GRAU * Math.cos((centro[1] * Math.PI) / 180));
    const meiaA = (m * 280) / 343 / 2 / METROS_POR_GRAU;
    const slugs = bairrosNaCaixa([centro[0] - meiaL, centro[1] - meiaA, centro[0] + meiaL, centro[1] + meiaA]);
    const bairros = [casaForte(), ...slugs.filter((s) => s !== "casa-forte").map((s) => mapaBaseDoBairro(s)!)];
    const c = cena(centro, m, bairros, true);
    expect(c.camadas.chao).not.toBe("");
    expect(c.camadas.quadras).not.toBe("");
  });

  it("o nome do bairro do imóvel aparece no nível de quadras mesmo com o melhor lugar tomado", () => {
    const m = 2600;
    const meiaL = m / 2 / (METROS_POR_GRAU * Math.cos((CASA_FORTE[1] * Math.PI) / 180));
    const meiaA = (m * 280) / 343 / 2 / METROS_POR_GRAU;
    const slugs = bairrosNaCaixa([CASA_FORTE[0] - meiaL, CASA_FORTE[1] - meiaA, CASA_FORTE[0] + meiaL, CASA_FORTE[1] + meiaA]);
    const bairros = [casaForte(), ...slugs.filter((s) => s !== "casa-forte").map((s) => mapaBaseDoBairro(s)!)];
    const livre = cena(CASA_FORTE, m, bairros, true);
    const nome = livre.bairros.find((b) => b.doImovel);
    expect(nome?.nome).toBe("CASA FORTE");
    // Um controle do mapa por cima do melhor lugar: o nome procura outro.
    const k = nome!.caixa;
    const tomado = cena(CASA_FORTE, m, bairros, true, { obstaculos: [[k[0] - 4, k[1] - 4, k[2] + 4, k[3] + 4]] });
    const outro = tomado.bairros.find((b) => b.doImovel);
    expect(outro).toBeDefined();
    expect(outro!.x !== nome!.x || outro!.y !== nome!.y).toBe(true);
  });

  it("com zoom, a rua do imóvel fica dentro da janela visível sem arraste", () => {
    for (const z of [2, 3]) {
      const desl: [number, number] = [-20, 15];
      const c = montarFundoDoMapa({ ...entrada([A], 340, 300, 220, z), quadro: { ...entrada([A], 340, 300, 220, z).quadro, deslocamento: desl } });
      const r = c.rotulos.find((x) => x.tipo === "imovel");
      expect(r).toBeDefined();
      const cx = 170;
      const cy = 150;
      const janela = [cx + (0 - cx - desl[0]) / z, cy + (0 - cy - desl[1]) / z, cx + (340 - cx - desl[0]) / z, cy + (300 - cy - desl[1]) / z];
      for (const b of r!.caixas) {
        expect(b[0]).toBeGreaterThanOrEqual(janela[0]!);
        expect(b[2]).toBeLessThanOrEqual(janela[2]!);
        expect(b[1]).toBeGreaterThanOrEqual(janela[1]!);
        expect(b[3]).toBeLessThanOrEqual(janela[3]!);
      }
    }
  });

  it("em tela larga nenhum rótulo sai do quadro", () => {
    const c = montarFundoDoMapa(entrada([A], 1240, 600, 802));
    expect(c.rotulos.length).toBeGreaterThan(0);
    for (const r of c.rotulos) {
      for (const b of r.caixas) {
        expect(b[0]).toBeGreaterThanOrEqual(0);
        expect(b[2]).toBeLessThanOrEqual(1240);
        expect(b[1]).toBeGreaterThanOrEqual(0);
        expect(b[3]).toBeLessThanOrEqual(600);
      }
    }
  });
});
