// Prova visual e custo do fundo do mapa, sobre os recortes reais.
// - Sempre: mede o tempo de montar a cena da gaveta e do por perto (média de 50) e confere um teto folgado.
// - Com PROVA_FUNDO=<pasta>: escreve as vistas em HTML (fontes do app por @font-face) para fotografar no navegador.
import { describe, expect, it } from "@jest/globals";
import { mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { montarFundoDoMapa, type CenaDoFundo, type EntradaDoFundo } from "../src/componentes/mapa/fundoDoMapaCena";
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

describe("custo de montar a cena (média de 50)", () => {
  it("gaveta e por perto", () => {
    const linhas: string[] = [];
    for (const v of VISTAS) {
      const e = entradaDe(v);
      montarFundoDoMapa(e);
      const t0 = performance.now();
      let cena!: CenaDoFundo;
      for (let i = 0; i < 50; i++) cena = montarFundoDoMapa(e);
      const ms = (performance.now() - t0) / 50;
      const bytes = Object.values(cena.camadas).reduce((s, d) => s + d.length, 0) + cena.rotulos.reduce((s, r) => s + r.caminho.length, 0);
      linhas.push(`${v.nome}: ${ms.toFixed(2)} ms, ${(bytes / 1024).toFixed(1)} kB de caminho, ${cena.rotulos.length} rótulos de rua, ${cena.bairros.length} nomes de bairro, nível ${cena.nivel}`);
      expect(ms).toBeLessThan(200);
    }
    if (process.env.PROVA_FUNDO) mkdirSync(process.env.PROVA_FUNDO, { recursive: true });
    if (process.env.PROVA_FUNDO) writeFileSync(join(process.env.PROVA_FUNDO, "custo.txt"), linhas.join("\n") + "\n");
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
