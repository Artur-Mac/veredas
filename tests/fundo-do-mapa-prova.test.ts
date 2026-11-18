// Prova visual e custo do fundo do mapa, sobre os recortes reais.
// - Sempre: mede o tempo de montar a cena da gaveta e do por perto (média de 50) e confere um teto folgado.
// - Com PROVA_FUNDO=<pasta>: escreve as vistas em HTML (fontes do app por @font-face) para fotografar no navegador.
import { describe, expect, it } from "@jest/globals";
import { mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { montarFundoDoMapa, QUADRAS_ATE_M_POR_PX, type CenaDoFundo, type EntradaDoFundo } from "../src/componentes/mapa/fundoDoMapaCena";
import { bairrosNaCaixa, mapaBaseDaCidade, mapaBaseDoBairro } from "../src/dados/recife/mapaBase";
import { METROS_POR_GRAU } from "../src/dados/recife/mapaBaseContrato";
import { CORES_CLARO, CORES_ESCURO, type Cores } from "../src/tema/tokens";
import { CENTRO_DO_IMOVEL, LOGRADOURO_DO_IMOVEL, lerRecorte, mapaBaseDoRecorte, paraDesenhoCentrado, svgDaCena } from "./apoio/mapa-base-de-teste";

const A = mapaBaseDoRecorte(lerRecorte("janela-A-gaveta"));
const B = mapaBaseDoRecorte(lerRecorte("janela-B-por-perto"));

type Vista = { nome: string; base: typeof A; largura: number; altura: number; metros: number; zoom: number };
const VISTAS: Vista[] = [
  { nome: "gaveta-340x300", base: A, largura: 340, altura: 300, metros: 220, zoom: 1 },
  { nome: "gaveta-327x280", base: A, largura: 327, altura: 280, metros: 220, zoom: 1 },
  { nome: "gaveta-340x300-zoom3", base: A, largura: 340, altura: 300, metros: 220, zoom: 3 },
  { nome: "por-perto-340x300", base: B, largura: 340, altura: 300, metros: 1500, zoom: 1 },
];

function entradaDe(v: Vista): EntradaDoFundo {
  return {
    bairros: [v.base],
    cidade: null,
    bairroDoImovel: "boa-viagem",
    imovel: { centro: CENTRO_DO_IMOVEL, codigoDoLogradouro: LOGRADOURO_DO_IMOVEL },
    quadro: { largura: v.largura, altura: v.altura, paraDesenho: paraDesenhoCentrado(CENTRO_DO_IMOVEL, v.largura, v.altura, v.metros), zoom: v.zoom },
  };
}

function regua(cena: CenaDoFundo, cores: Cores): string {
  const mpp = cena.larguraEmMetros / cena.largura;
  let m = 10;
  for (const p of [10, 20, 25, 50, 100, 200, 250, 500, 1000]) if (p / mpp <= cena.largura * 0.3) m = p;
  const w = m / mpp;
  const y = cena.altura - 12;
  return `<div class="regua" style="background:${cores["cor-superficie"]}e0;color:${cores["cor-texto"]}"><span>${m} m</span><i style="width:${w.toFixed(1)}px;border-color:${cores["cor-texto"]}"></i></div><!--${y}-->`;
}

function html(v: Vista, cena: CenaDoFundo, cores: Cores, escuro: boolean): string {
  const fontes = resolve(__dirname, "..", "assets", "fonts").replace(/\\/g, "/");
  const z = cena.zoom;
  // Com zoom, mostra a janela em volta do pino (o centro), como o mapa do lote faz.
  const transform = z === 1 ? "" : `translate(${v.largura / 2} ${v.altura / 2}) scale(${z}) translate(${-v.largura / 2} ${-v.altura / 2})`;
  const pino = `<circle cx="${v.largura / 2}" cy="${v.altura / 2}" r="${11 / z}" fill="${cores["cor-acao"]}" fill-opacity=".25"/><circle cx="${v.largura / 2}" cy="${v.altura / 2}" r="${5.5 / z}" fill="${cores["cor-acao"]}" stroke="${cores["cor-superficie"]}" stroke-width="${2 / z}"/>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:PlusJakartaSans;src:url("file:///${fontes}/PlusJakartaSans.ttf");font-weight:200 800}
@font-face{font-family:Fraunces;src:url("file:///${fontes}/Fraunces.ttf");font-weight:100 900}
@font-face{font-family:JetBrainsMono;src:url("file:///${fontes}/JetBrainsMono.ttf");font-weight:100 800}
body{margin:0;padding:12px;background:${cores["cor-fundo"]};font-family:PlusJakartaSans}
.mapa{position:relative;width:${v.largura}px;height:${v.altura}px;border-radius:14px;overflow:hidden;border:1px solid ${cores["cor-linha"]}}
.selo{position:absolute;left:10px;top:10px;background:${cores["cor-superficie"]}f0;border:1px solid ${cores["cor-linha"]};border-radius:8px;padding:4px 8px 5px}
.selo small{display:block;font:9px/11px JetBrainsMono;letter-spacing:1.2px;color:${cores["cor-texto-apoio"]}}
.selo b{display:block;font:600 15px/18px Fraunces;color:${cores["cor-texto"]}}
.credito{position:absolute;right:6px;bottom:4px;font:9px/12px PlusJakartaSans;color:${cores["cor-texto-apoio"]};background:${cores["cor-superficie"]}e0;border-radius:4px;padding:1px 4px}
.regua{position:absolute;left:10px;bottom:10px;border-radius:4px;padding:2px 6px 4px;font:11px JetBrainsMono}
.regua i{display:block;height:4px;border:1.5px solid;border-top:0}
</style></head><body data-tema="${escuro ? "escuro" : "claro"}"><div class="mapa"><svg width="${v.largura}" height="${v.altura}" viewBox="0 0 ${v.largura} ${v.altura}" xmlns="http://www.w3.org/2000/svg"><g transform="${transform}">${svgDaCena(cena, cores, pino)}</g></svg>
${cena.selo ? `<div class="selo"><small>BAIRRO</small><b>${cena.selo}</b></div>` : ""}${regua(cena, cores)}<div class="credito">Base: Prefeitura do Recife (ODbL)</div></div></body></html>`;
}

/** A caixa em graus de um quadro centrado (a mesma conta de paraDesenhoCentrado), com folga de 300 m. */
function caixaDoQuadro(centro: readonly [number, number], largura: number, altura: number, metros: number): readonly [number, number, number, number] {
  const cos = Math.cos((centro[1] * Math.PI) / 180);
  const meiaL = metros / 2 + 300;
  const meiaA = (metros * altura) / largura / 2 + 300;
  return [centro[0] - meiaL / (METROS_POR_GRAU * cos), centro[1] - meiaA / METROS_POR_GRAU, centro[0] + meiaL / (METROS_POR_GRAU * cos), centro[1] + meiaA / METROS_POR_GRAU];
}

/** Os arquivos reais que o mapa que hospeda carregaria para o quadro: os bairros cuja caixa toca o quadro, e a cidade. */
function entradaReal(largura: number, altura: number, metros: number, zoom = 1): EntradaDoFundo {
  const caixa = caixaDoQuadro(CENTRO_DO_IMOVEL, largura, altura, metros);
  const slugs = metros / zoom / largura > QUADRAS_ATE_M_POR_PX ? ["boa-viagem"] : bairrosNaCaixa(caixa);
  return {
    bairros: slugs.map((s) => mapaBaseDoBairro(s)).filter((m): m is NonNullable<typeof m> => m !== null),
    cidade: mapaBaseDaCidade(),
    bairroDoImovel: "boa-viagem",
    imovel: { centro: CENTRO_DO_IMOVEL, codigoDoLogradouro: LOGRADOURO_DO_IMOVEL },
    quadro: { largura, altura, paraDesenho: paraDesenhoCentrado(CENTRO_DO_IMOVEL, largura, altura, metros), zoom },
  };
}

/**
 * Metas da noite (node, arquivos reais, cidade carregada, depois de aquecido): gaveta de 220 m em 340 px até 5 ms; Por
 * perto de 2,6 km em 340 px até 15 ms; 1240 × 600 em qualquer escala até 40 ms. Os tetos ficam um pouco acima das metas.
 *
 * Milissegundo medido com a máquina carregada não é medida: na suíte inteira, com as outras suítes disputando os
 * núcleos, a mediana estourava o teto sem o código ter mudado (18/11/2026). Por isso há dois modos:
 * - suíte normal: o MELHOR tempo de 15 contra 8 vezes o teto. Pega a regressão grande (a busca do nome de bairro já
 *   custou 774 ms num quadro largo) e não falha por carga.
 * - CUSTO_ESTRITO=1 (ou PROVA_FUNDO), rodando este arquivo sozinho: a mediana contra o teto. É a medida que vale para
 *   o relatório; vai para custo.txt e para o LEIA.md.
 */
const CUSTO_ESTRITO = Boolean(process.env.CUSTO_ESTRITO || process.env.PROVA_FUNDO);
const FOLGA_NA_SUITE = 8;
const CASOS_DE_CUSTO: { nome: string; largura: number; altura: number; metros: number; zoom?: number; teto: number }[] = [
  { nome: "gaveta 220 m, 340 px", largura: 340, altura: 300, metros: 220, teto: 6 },
  { nome: "gaveta 220 m, 340 px, zoom 3", largura: 340, altura: 300, metros: 220, zoom: 3, teto: 6 },
  { nome: "por perto 2,6 km, 340 px", largura: 340, altura: 300, metros: 2600, teto: 18 },
  { nome: "1240 × 600 a 802 m", largura: 1240, altura: 600, metros: 802, teto: 45 },
  { nome: "1240 × 600 a 2 km", largura: 1240, altura: 600, metros: 2000, teto: 45 },
  { nome: "1240 × 600 a 5 km", largura: 1240, altura: 600, metros: 5000, teto: 45 },
  { nome: "1240 × 600 a 12 km", largura: 1240, altura: 600, metros: 12000, teto: 45 },
];

const temArquivosReais = mapaBaseDoBairro("boa-viagem") !== null && mapaBaseDaCidade() !== null;

(temArquivosReais ? describe : describe.skip)("custo de montar a cena com os arquivos reais (15 medidas, aquecido)", () => {
  it("gaveta, por perto e quadro largo dentro dos limites", () => {
    const linhas: string[] = [];
    const acima: string[] = [];
    for (const k of CASOS_DE_CUSTO) {
      const e = entradaReal(k.largura, k.altura, k.metros, k.zoom);
      for (let i = 0; i < 3; i++) montarFundoDoMapa(e);
      const tempos: number[] = [];
      let cena!: CenaDoFundo;
      for (let i = 0; i < 15; i++) {
        const t0 = process.hrtime.bigint();
        cena = montarFundoDoMapa(e);
        tempos.push(Number(process.hrtime.bigint() - t0) / 1e6);
      }
      tempos.sort((a, b) => a - b);
      const mediana = tempos[7]!;
      const bytes = Object.values(cena.camadas).reduce((s, d) => s + d.length, 0);
      linhas.push(
        `${k.nome}: mediana ${mediana.toFixed(2)} ms, pior ${tempos[14]!.toFixed(2)} ms, ${e.bairros.length} arquivos de bairro, nível ${cena.nivel}, ${cena.lotes.length} lotes, ${(bytes / 1024).toFixed(0)} kB de caminho, ${cena.rotulos.length} rótulos, ${cena.bairros.length} nomes de bairro`,
      );
      const medido = CUSTO_ESTRITO ? mediana : tempos[0]!;
      const limite = CUSTO_ESTRITO ? k.teto : k.teto * FOLGA_NA_SUITE;
      if (medido >= limite) acima.push(`${k.nome}: ${medido.toFixed(1)} ms (limite ${limite}${CUSTO_ESTRITO ? ", mediana" : ", melhor de 15 na suíte"})`);
    }
    if (process.env.PROVA_FUNDO) mkdirSync(process.env.PROVA_FUNDO, { recursive: true });
    if (process.env.PROVA_FUNDO) writeFileSync(join(process.env.PROVA_FUNDO, "custo.txt"), linhas.join("\n") + "\n");
    if (process.env.MOSTRAR_CUSTO) console.log(linhas.join("\n"));
    expect(acima).toEqual([]);
  });
});

const pasta = process.env.PROVA_FUNDO;
(pasta ? describe : describe.skip)("prova visual (PROVA_FUNDO)", () => {
  it("escreve as vistas em HTML", () => {
    mkdirSync(pasta!, { recursive: true });
    for (const v of VISTAS) {
      const cena = montarFundoDoMapa(entradaDe(v));
      for (const [tema, cores] of [["claro", CORES_CLARO], ["escuro", CORES_ESCURO]] as [string, Cores][]) {
        writeFileSync(join(pasta!, `${v.nome}-${tema}.html`), html(v, cena, cores, tema === "escuro"));
      }
    }
  });
});
