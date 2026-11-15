// VE01 — rendered checks of the decision brief on Compare, with G-COMPARE pairs (real buildings, synthetic listing values)
// seeded into an isolated Playwright context. Requires an Expo web server at POC_URL (never starts one).
//
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE01/scripts/ve01-compare-render.mjs
//
// Writes screenshots to out/ve01/compare/ and a JSON result to stdout.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const origem = new URL(base).origin;
const saida = path.resolve(process.env.COMPARE_OUT || "out/ve01/compare");
await mkdir(saida, { recursive: true });

const gc = JSON.parse(await readFile("docs/aplicacao/evaluation-sets/g-compare.json", "utf8"));
const pub = await readFile("src/dados/recife/publicacaoGerada.ts", "utf8");
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
const indices = {};
async function edificio(area, id) {
  indices[area] ??= JSON.parse(await readFile(`src/dados/recife/${dir}/${area}.json`, "utf8"));
  const e = indices[area].edificios.find((x) => x.id === id);
  assert(e, `edifício ${id} não está em ${area}`);
  return { e, geradoEm: indices[area].geradoEm };
}
const NOMES = { "boa-viagem": "Boa Viagem", "casa-forte": "Casa Forte", gracas: "Graças", espinheiro: "Espinheiro", madalena: "Madalena" };
const PERIODO = { mensal: "mes", anual: "ano", desconhecido: "desconhecido" };
const em = "2026-11-14T12:00:00.000Z";
const val = (valor) => ({ valor, origem: "voce", aConfirmar: false });
async function analise(id, l) {
  const { e, geradoEm } = await edificio(l.area, l.building_id);
  return {
    versao: 2, id, criadaEm: em, atualizadaEm: em, nome: `Fixture ${NOMES[l.area]} ${id}`, modalidade: l.tenure, tipologia: "apartamento",
    bairroTexto: NOMES[l.area], bairro: l.area, logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
    declarados: {
      preco: val(l.price), condominio: val(l.condo_monthly), iptu: { ...val(l.iptu_value), periodo: PERIODO[l.iptu_period] },
      seguroIncendio: val(null), taxaServico: val(null), outros: val(null), area: val(l.area_m2), quartos: val(2), suites: val(null),
      banheiros: val(null), vagas: val(null), andar: val(null),
    },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: geradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null,
  };
}
const PARES = ["GC03", "GC08", "GC10", "GC02", "GC16", "GC20"];
const lista = [];
for (const id of PARES) {
  const p = gc.pairs.find((x) => x.pair_id === id);
  lista.push(await analise(`${id.toLowerCase()}a`, p.A), await analise(`${id.toLowerCase()}b`, p.B));
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function esperar(cond, desc, ms = 15_000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) { try { if (await cond()) return; } catch { /* tenta de novo */ } await pausa(25); }
  throw new Error(`Tempo esgotado: ${desc}`);
}
const visivel = (page) => page.evaluate(() => {
  const ocultos = [...document.querySelectorAll('[aria-hidden="true"]')];
  const g = ocultos.map((el) => [el, el.style.display]);
  for (const el of ocultos) el.style.display = "none";
  const t = document.body.innerText;
  for (const [el, d] of g) el.style.display = d;
  return t;
});
const p95 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)]; };
const p50 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

const resultado = { base, pares: {}, larguras: {}, tempos: {}, offline: null, tempo: null, visita: null, externas: [], errosDePagina: [], consoleErros: [] };
const navegador = await chromium.launch({ headless: true });
async function novoContexto(largura = 375) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: largura >= 1000 ? 900 : 812 } });
  await ctx.route("**/*", (r) => {
    const u = r.request().url();
    if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === origem) return r.continue();
    resultado.externas.push(new URL(u).origin);
    return r.abort();
  });
  await ctx.addInitScript((l) => {
    if (!localStorage.getItem("ve01-semeado")) {
      localStorage.setItem("vereda-analises-v2", JSON.stringify(l));
      localStorage.setItem("ve01-semeado", "sim");
    }
  }, lista);
  const page = await ctx.newPage();
  page.setDefaultTimeout(20_000);
  page.on("pageerror", (e) => resultado.errosDePagina.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") resultado.consoleErros.push(m.text().slice(0, 200)); });
  return { ctx, page };
}
const abrirPar = async (page, id) => {
  await page.goto(`${base}/comparar?ids=${id.toLowerCase()}a,${id.toLowerCase()}b`, { waitUntil: "load" });
  await esperar(async () => (await visivel(page)).toLowerCase().includes("para decidir"), `resumo de ${id}`);
};
const rolagem = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

try {
  // 1. Each pair at 375 px: text of the brief, screenshot, overflow; then 360 and 1280 for two pairs.
  let { ctx, page } = await novoContexto(375);
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 180_000 });
  for (const id of PARES) {
    await abrirPar(page, id);
    const t = await visivel(page);
    const inicio = t.toUpperCase().indexOf("PARA DECIDIR");
    const fim = t.indexOf("Imóvel 1");
    resultado.pares[id] = { resumo: t.slice(inicio, fim > inicio ? fim : inicio + 900).trim(), rolagemHorizontalPx: await rolagem(page) };
    // The brief must start within the first screen at 375x812.
    const topo = await page.getByText("Para decidir", { exact: true }).boundingBox();
    resultado.pares[id].kickerTopPx = topo ? Math.round(topo.y) : null;
    const manchete = await page.getByRole("heading", { level: 2 }).first().boundingBox();
    resultado.pares[id].mancheteBottomPx = manchete ? Math.round(manchete.y + manchete.height) : null;
    await page.screenshot({ path: path.join(saida, `${id}-375.png`) });
  }
  for (const largura of [360, 1280]) {
    await page.setViewportSize({ width: largura, height: largura >= 1000 ? 900 : 812 });
    for (const id of ["GC08", "GC16"]) {
      await abrirPar(page, id);
      await pausa(200);
      resultado.larguras[`${id}@${largura}`] = { rolagemHorizontalPx: await rolagem(page) };
      await page.screenshot({ path: path.join(saida, `${id}-${largura}.png`), fullPage: largura === 360 });
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });

  // 2. Time trade-off (GC10: R$ 180/mês, 20 min × 16 dias).
  await abrirPar(page, "GC10");
  await page.getByRole("button", { name: "E se o que custa mais te poupar tempo?" }).click();
  await page.getByRole("textbox", { name: "Minutos poupados por dia" }).fill("20");
  await page.getByRole("textbox", { name: "Dias por mês" }).fill("16");
  await esperar(async () => (await visivel(page)).includes("R$ 33,75"), "conta do tempo");
  resultado.tempo = (await visivel(page)).match(/São [^\n]*Você decide quanto vale\./)?.[0] ?? null;
  await page.screenshot({ path: path.join(saida, "GC10-tempo-375.png") });

  // 3. Priority switch and question to the visit (GC03: condomínio de Boa Viagem).
  await abrirPar(page, "GC03");
  const antes = await page.getByRole("heading", { level: 2 }).first().innerText();
  await page.getByRole("radio", { name: "Mais espaço" }).click();
  await pausa(150);
  const depois = await page.getByRole("heading", { level: 2 }).first().innerText();
  const campo = page.getByRole("textbox", { name: /^Pergunta para / });
  await campo.fill("Qual é o valor atual do condomínio? Há chamada extra prevista para 2027?");
  const botao = page.getByRole("button", { name: /^Levar para a visita de / });
  const rotuloDoBotao = await botao.getAttribute("aria-label");
  await botao.click();
  await esperar(async () => (await visivel(page)).includes("Pergunta no roteiro da visita de"), "aviso de pergunta gravada");
  const caderno = await page.evaluate(() => JSON.parse(localStorage.getItem("vereda-analises-v2")));
  const gravada = caderno.find((a) => a.id === "gc03a")?.visita.perguntasProprias ?? [];
  await page.goto(`${base}/visita`, { waitUntil: "load" });
  await pausa(800);
  resultado.visita = { antes, depois, rotuloDoBotao, gravadas: gravada, naTelaDaVisita: null };
  await page.evaluate(() => localStorage.setItem("vereda-ativa-v1", "gc03a"));
  await page.reload({ waitUntil: "load" });
  await pausa(1200);
  const tv = await visivel(page);
  resultado.visita.naTelaDaVisita = tv.includes("Há chamada extra prevista para 2027?");
  await page.screenshot({ path: path.join(saida, "GC03-visita-375.png"), fullPage: true });

  // 4. Offline after load: switching pairs and priority still works.
  await abrirPar(page, "GC08");
  await ctx.setOffline(true);
  await page.getByRole("button", { name: /^Imóvel 2: / }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("radio", { name: /Fixture Madalena gc09b|Fixture Espinheiro gc10a/ }).first().click().catch(() => {});
  await pausa(300);
  await page.getByRole("radio", { name: "Mais espaço" }).click();
  await pausa(200);
  resultado.offline = { resumoPresente: (await visivel(page)).toLowerCase().includes("para decidir"), externas: resultado.externas.length };
  await ctx.setOffline(false);
  await ctx.close();

  // 5. Timings (desktop dev web build, not the target device): 30 warm opens and 30 priority switches; 5 cold contexts.
  ({ ctx, page } = await novoContexto(375));
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 180_000 });
  await abrirPar(page, "GC08");
  const aberturas = [];
  for (let i = 0; i < 30; i += 1) {
    const id = PARES[i % PARES.length];
    const t0 = Date.now();
    await abrirPar(page, id);
    aberturas.push(Date.now() - t0);
  }
  const trocas = [];
  for (let i = 0; i < 30; i += 1) {
    const alvo = i % 2 === 0 ? "Mais espaço" : "Menor custo";
    const antesT = await page.getByRole("heading", { level: 2 }).first().innerText();
    const t0 = performance.now();
    await page.getByRole("radio", { name: alvo }).click();
    await esperar(async () => (await page.getByRole("heading", { level: 2 }).first().innerText()) !== antesT || (await page.getByRole("radio", { name: alvo }).getAttribute("aria-checked")) === "true", "troca de prioridade", 5000);
    trocas.push(Math.round(performance.now() - t0));
  }
  await ctx.close();
  const frias = [];
  for (let i = 0; i < 5; i += 1) {
    const c = await novoContexto(375);
    const t0 = Date.now();
    await c.page.goto(`${base}/comparar?ids=gc08a,gc08b`, { waitUntil: "load" });
    await esperar(async () => (await visivel(c.page)).toLowerCase().includes("para decidir"), "resumo frio", 60_000);
    frias.push(Date.now() - t0);
    await c.ctx.close();
  }
  resultado.tempos = {
    ambiente: "Expo web dev server, headless Chromium, this desktop; not the target device",
    aberturaMorna: { n: aberturas.length, p50: p50(aberturas), p95: p95(aberturas), unidade: "ms, page.goto(/comparar?ids) until 'Para decidir' visible" },
    trocaDePrioridade: { n: trocas.length, p50: p50(trocas), p95: p95(trocas), unidade: "ms, click until heading/aria-checked updated (includes Playwright round trips)" },
    aberturaFria: { n: frias.length, p50: p50(frias), p95: p95(frias), unidade: "ms, new browser context (empty cache) until 'Para decidir'" },
  };
} finally {
  await navegador.close();
  console.log(JSON.stringify(resultado, null, 1));
}
