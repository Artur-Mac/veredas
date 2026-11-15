// VE06 — rendered check of "Se a rua alagar" in the dossier (Entorno → A pé, a partir da entrada), real pilot building
// 10537-232, synthetic listing values. 375 and 360 px; opens "Ver o registro".
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE06/scripts/ve06-render.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve("out/ve06/render");
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

const b = await chromium.launch();
const r = { telas: {}, erros: [], externas: [] };
try {
  for (const largura of [375, 360]) {
    const c = await b.newContext({ viewport: { width: largura, height: 812 } });
    await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
    await c.addInitScript((a) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify([a])); localStorage.setItem("vereda-ativa-v1", a.id); localStorage.setItem("s", "1"); } }, analise);
    const p = await c.newPage();
    p.on("pageerror", (x) => r.erros.push(x.message));
    await p.goto(`${base}/dossie`, { waitUntil: "load" }); await p.waitForTimeout(2500);
    await p.getByRole("tab", { name: "Entorno", exact: true }).click(); await p.waitForTimeout(1500);
    const bloco = p.getByText("Se a rua alagar", { exact: true }).first();
    const tem = await bloco.count();
    if (tem) { await bloco.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); }
    await p.screenshot({ path: path.join(saida, `se-alagar-${largura}.png`) });
    const antes = await p.evaluate(() => { const t = document.body.innerText; const i = t.indexOf("Se a rua alagar"); return i >= 0 ? t.slice(i, i + 700) : null; });
    let depois = null;
    if (tem) { await p.getByText("Ver o registro", { exact: true }).first().click(); await p.waitForTimeout(400); depois = await p.evaluate(() => { const t = document.body.innerText; const i = t.indexOf("Se a rua alagar"); return i >= 0 ? t.slice(i, i + 1400) : null; }); await p.screenshot({ path: path.join(saida, `se-alagar-registro-${largura}.png`) }); }
    r.telas[largura] = { bloco: Boolean(tem), antes, depois, rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
    await c.close();
  }
} finally {
  await b.close();
  console.log(JSON.stringify(r, null, 1));
}
