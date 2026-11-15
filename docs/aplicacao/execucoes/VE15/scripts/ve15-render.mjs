// VE15 — rendered check of "Já tem a resposta?" in the Compare summary: a pair where B's condo fee is unknown (synthetic
// listing values on real index buildings, isolated context). Type the confirmed value, tap "Usar este valor", read the
// sentence and the headline, reload and confirm the value persisted as "informado por você".
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE15/scripts/ve15-render.mjs [condominio...]
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve(process.env.SAIDA || "out/ve15");
await mkdir(saida, { recursive: true });
const valores = process.argv.slice(2).length ? process.argv.slice(2) : ["150", "1200"];
const pub = await readFile("src/dados/recife/publicacaoGerada.ts", "utf8");
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
async function edificio(area, id) {
  const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/${area}.json`, "utf8"));
  return { e: ix.edificios.find((x) => x.id === id), geradoEm: ix.geradoEm };
}
const em = "2026-11-14T12:00:00.000Z";
const val = (valor) => ({ valor, origem: "texto", aConfirmar: false });
async function analise(id, area, bairroTexto, predioId, condominio) {
  const { e, geradoEm } = await edificio(area, predioId);
  return {
    versao: 2, id, criadaEm: em, atualizadaEm: em, nome: `Fixture ${bairroTexto}`, modalidade: "aluguel", tipologia: "apartamento", bairroTexto, bairro: area,
    logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
    declarados: { preco: val(2800), condominio: val(condominio), iptu: { ...val(100), periodo: "mes" }, seguroIncendio: val(40), taxaServico: val(null), outros: val(null), area: val(70), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null) },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: geradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null,
  };
}
const lista = [await analise("cf", "casa-forte", "Casa Forte", "61999-311", 600), await analise("gr", "gracas", "Graças", "59382-327", null)];
const resultado = { externas: [], erros: [], casos: {} };
const b = await chromium.launch();
const visivel = (p) => p.evaluate(() => document.body.innerText);
const trecho = (t, k, n = 700) => { const i = t.indexOf(k); return i >= 0 ? t.slice(Math.max(0, i - 400), i + n) : null; };
try {
  for (const largura of [375, 360]) for (const v of valores) {
    const c = await b.newContext({ viewport: { width: largura, height: 812 } });
    await c.route("**/*", (r) => { const u = r.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return r.continue(); resultado.externas.push(u); return r.abort(); });
    await c.addInitScript((l) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify(l)); localStorage.setItem("s", "1"); } }, lista);
    const p = await c.newPage();
    p.on("pageerror", (e) => resultado.erros.push(e.message));
    await p.goto(`${base}/comparar?ids=cf,gr`, { waitUntil: "load" });
    const grupo = p.getByRole("group", { name: /Já tem a resposta/ });
    await grupo.waitFor({ timeout: 60000 });
    const antes = await visivel(p);
    await grupo.scrollIntoViewIfNeeded();
    await p.screenshot({ path: path.join(saida, `antes-${largura}.png`), fullPage: false });
    await grupo.getByRole("textbox").fill(v);
    await grupo.getByRole("button", { name: "Usar este valor" }).click();
    // The sentence sits under the headline: once answered, the question changes and the box closes.
    const status = p.getByRole("status").filter({ hasText: "Valor guardado" });
    await status.waitFor({ timeout: 15000 });
    const frase = await status.innerText();
    await p.waitForTimeout(800);
    const fraseAVista = await status.evaluate((n) => { const r = n.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
    const depois = await visivel(p);
    const caixaDepois = depois.includes("Já tem a resposta");
    await p.screenshot({ path: path.join(saida, `depois-${v}-${largura}.png`), fullPage: false });
    await p.reload({ waitUntil: "load" });
    await p.waitForTimeout(2500);
    const recarregada = await visivel(p);
    const guardado = await p.evaluate(() => JSON.parse(localStorage.getItem("vereda-analises-v2")).find((a) => a.id === "gr").declarados.condominio);
    resultado.casos[`${v}@${largura}`] = {
      frase, fraseAVista, guardado, caixaDepoisDeResponder: caixaDepois, caixaDepoisDeRecarregar: recarregada.includes("Já tem a resposta"),
      antes: trecho(antes, "Já tem a resposta"), depois: trecho(depois, "Valor guardado", 900), recarregada: recarregada.slice(0, 1400),
      rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    };
    await c.close();
  }
} finally {
  await b.close();
  console.log(JSON.stringify(resultado, null, 1));
}
