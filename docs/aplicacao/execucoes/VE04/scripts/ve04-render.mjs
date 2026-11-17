// VE04 — rendered checks of the "A pé, a partir da entrada" dossier section and the Compare brief difference, with
// real pilot buildings and synthetic listing values in an isolated Playwright context. Needs a server at POC_URL.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE04/scripts/ve04-render.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve("out/ve04");
await mkdir(saida, { recursive: true });
const pub = await readFile("src/dados/recife/publicacaoGerada.ts", "utf8");
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
async function edificio(area, id) {
  const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/${area}.json`, "utf8"));
  return { e: ix.edificios.find((x) => x.id === id), geradoEm: ix.geradoEm };
}
const em = "2026-11-14T12:00:00.000Z";
const val = (valor) => ({ valor, origem: "voce", aConfirmar: false });
async function analise(id, area, bairroTexto, predioId, preco) {
  const { e, geradoEm } = await edificio(area, predioId);
  return {
    versao: 2, id, criadaEm: em, atualizadaEm: em, nome: `Fixture ${bairroTexto}`, modalidade: "aluguel", tipologia: "apartamento", bairroTexto, bairro: area,
    logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
    declarados: { preco: val(preco), condominio: val(600), iptu: { ...val(100), periodo: "mes" }, seguroIncendio: val(40), taxaServico: val(null), outros: val(null), area: val(70), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null) },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: geradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null,
  };
}
const lista = [
  await analise("bv", "boa-viagem", "Boa Viagem", "10537-232", 3000),
  await analise("cf", "casa-forte", "Casa Forte", "61999-311", 3000),
  await analise("gr", "gracas", "Graças", "59382-327", 3050),
];
const resultado = { externas: [], erros: [], telas: {} };
const b = await chromium.launch();
const visivel = (p) => p.evaluate(() => document.body.innerText);
try {
  for (const largura of [375, 360]) {
    const c = await b.newContext({ viewport: { width: largura, height: 812 } });
    await c.route("**/*", (r) => { const u = r.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return r.continue(); resultado.externas.push(u); return r.abort(); });
    await c.addInitScript((l) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify(l)); localStorage.setItem("vereda-ativa-v1", "bv"); localStorage.setItem("s", "1"); } }, lista);
    const p = await c.newPage();
    p.on("pageerror", (e) => resultado.erros.push(e.message));
    await p.goto(`${base}/dossie`, { waitUntil: "load" });
    await p.waitForTimeout(2500);
    await p.getByRole("tab", { name: "Entorno", exact: true }).click();
    await p.waitForTimeout(1500);
    const t = await visivel(p);
    const i = t.toUpperCase().indexOf("A PÉ, A PARTIR DA ENTRADA");
    const el = p.getByText("Mercado, farmácia, praça e ônibus").first();
    if (await el.count()) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); }
    await p.screenshot({ path: path.join(saida, `dossie-dia-a-dia-${largura}.png`) });
    resultado.telas[`dossie@${largura}`] = { secao: i >= 0 ? t.slice(i, i + 900) : null, rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
    await p.goto(`${base}/comparar?ids=cf,gr`, { waitUntil: "load" });
    await p.waitForTimeout(2500);
    const tc = await visivel(p);
    const j = tc.toUpperCase().indexOf("PARA DECIDIR");
    await p.screenshot({ path: path.join(saida, `comparar-dia-a-dia-${largura}.png`) });
    resultado.telas[`comparar@${largura}`] = { resumo: j >= 0 ? tc.slice(j, j + 700) : null, rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
    await c.close();
  }
} finally {
  await b.close();
  console.log(JSON.stringify(resultado, null, 1));
}
