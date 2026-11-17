// VE07 — rendered check of "O sol nas fachadas" (dossier, Edifício tab) for a real Boa Viagem building and a Madalena
// building; opens "Ver cada lado", uses "Levar para a visita" and reads the notebook back. 375 and 360 px.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE07/scripts/ve07-render.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve("out/ve07/render");
await mkdir(saida, { recursive: true });
const pub = await readFile("src/dados/recife/publicacaoGerada.ts", "utf8");
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/boa-viagem.json`, "utf8"));
const e = ix.edificios.find((x) => x.id === "10537-232");
const em = "2026-11-14T12:00:00.000Z";
const val = (valor) => ({ valor, origem: "voce", aConfirmar: false });
const analise = {
  versao: 2, id: "bv", criadaEm: em, atualizadaEm: em, nome: "Apartamento em Boa Viagem (teste)", modalidade: "aluguel", tipologia: "apartamento", bairroTexto: "Boa Viagem", bairro: "boa-viagem",
  logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
  declarados: { preco: val(3000), condominio: val(600), iptu: { ...val(100), periodo: "mes" }, seguroIncendio: val(40), taxaServico: val(null), outros: val(null), area: val(70), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null) },
  vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: ix.geradoEm },
  visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null,
};

const ixM = JSON.parse(await readFile(`src/dados/recife/${dir}/madalena.json`, "utf8"));
const em2 = ixM.edificios.find((x) => x.id === (process.env.PREDIO_MADALENA || "10308-186"));
const analiseM = { ...analise, id: "md", nome: "Apartamento na Madalena (teste)", bairroTexto: "Madalena", bairro: "madalena",
  declarados: { ...analise.declarados, andar: { valor: 5, origem: "voce", aConfirmar: false } },
  vinculo: { estado: "confirmado", edificioId: em2.id, dsqfl: em2.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: ixM.geradoEm } };
const b = await chromium.launch();
const r = { telas: {}, erros: [], externas: [] };
try {
  for (const largura of [375, 360]) for (const a of [analise, analiseM]) {
    const c = await b.newContext({ viewport: { width: largura, height: 812 } });
    await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
    await c.addInitScript((x) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify([x])); localStorage.setItem("vereda-ativa-v1", x.id); localStorage.setItem("s", "1"); } }, a);
    const p = await c.newPage();
    p.on("pageerror", (x) => r.erros.push(x.message));
    await p.goto(`${base}/dossie`, { waitUntil: "load" }); await p.waitForTimeout(2500);
    const t0 = Date.now();
    await p.getByRole("tab", { name: "Edifício", exact: true }).click();
    await p.getByText("Qual lado do prédio pega sol.", { exact: true }).first().waitFor({ timeout: 30000 });
    await p.waitForFunction(() => !document.body.innerText.includes("Calculando o sol em cada lado"), null, { timeout: 60000 });
    const ms = Date.now() - t0;
    await p.getByText("Qual lado do prédio pega sol.", { exact: true }).first().scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(saida, `fachadas-${a.id}-${largura}.png`) });
    const texto = async () => p.evaluate(() => { const t = document.body.innerText; const i = t.indexOf("O SOL NAS FACHADAS") >= 0 ? t.indexOf("O SOL NAS FACHADAS") : t.indexOf("O sol nas fachadas"); return i >= 0 ? t.slice(i, i + 1600) : null; });
    const antes = await texto();
    const ver = p.getByText("Ver cada lado", { exact: true });
    if (await ver.count()) { await ver.first().click(); await p.waitForTimeout(300); }
    const lados = await texto();
    let pergunta = null;
    const levar = p.getByText("Levar para a visita", { exact: true });
    if (await levar.count()) {
      await levar.first().click(); await p.waitForTimeout(1200);
      pergunta = await p.evaluate((id) => (JSON.parse(localStorage.getItem("vereda-analises-v2") ?? "[]").find((x) => x.id === id)?.visita?.perguntasProprias ?? []).map((q) => q.texto), a.id);
    }
    r.telas[`${a.id}@${largura}`] = { msAteOResultado: ms, antes, lados, perguntaGuardada: pergunta, rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
    await c.close();
  }
} finally {
  await b.close();
  console.log(JSON.stringify(r, null, 1));
}
