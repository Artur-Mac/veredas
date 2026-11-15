// Fase 1 (15/11/2026): do texto do anúncio ao dossiê, pelo fluxo normal. Texto sintético que reproduz o anúncio do
// teste no celular (Torre, "Edf. Engenho Torre", 53 m², 2 quartos, 8º andar, sem rua e número, IPTU sem período).
// Confere: cartão em vez de checklist, prédio provável pelo nome e pela área, "É este" → preparo (passos e aviso) →
// dossiê com um IPTU só (mensal, do cadastro) e sem "$undefined". 375 e 360 px; avisos do console guardados.
//   POC_URL=http://localhost:8081 node docs/aplicacao/execucoes/fase1-2026-11-15/render.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8081").replace(/\/+$/, "");
const AQUI = "docs/aplicacao/execucoes/fase1-2026-11-15";
const saida = path.resolve(AQUI, "telas");
await mkdir(saida, { recursive: true });
const TEXTO = [
  "Apartamento à venda com 53 m², 2 quartos, 2 banheiros, 1 vaga",
  "Edf. Engenho Torre",
  "Torre, Recife - PE",
  "Venda",
  "R$ 350.000",
  "Condomínio R$ 750",
  "IPTU R$ 180",
  "8º andar",
].join("\n");
const r = { externas: [], erros: [], console: [], telas: {} };
const b = await chromium.launch();
const texto = (p) => p.evaluate(() => document.body.innerText);
try {
  for (const largura of [375, 360]) {
    const c = await b.newContext({ viewport: { width: largura, height: 812 } });
    await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
    const p = await c.newPage();
    p.on("pageerror", (x) => r.erros.push(x.message));
    p.on("console", (m) => { if (["error", "warning"].includes(m.type())) r.console.push(`${largura}: ${m.text().slice(0, 300)}`); });
    await p.goto(`${base}/ler?texto=${encodeURIComponent(TEXTO)}&n=${largura}`, { waitUntil: "load" });
    await p.getByText("É este · gerar o dossiê").first().waitFor({ timeout: 120000 });
    const cartao = await texto(p);
    await p.screenshot({ path: path.join(saida, `cartao-${largura}.png`), fullPage: true });
    const t0 = Date.now();
    await p.getByText("É este · gerar o dossiê").first().click();
    await p.getByText("PREPARANDO O DOSSIÊ").waitFor({ timeout: 20000 });
    await p.waitForTimeout(500);
    const preparo = await texto(p);
    await p.screenshot({ path: path.join(saida, `preparo-${largura}.png`), fullPage: false });
    await p.waitForURL(/\/dossie/, { timeout: 20000 });
    const msPreparo = Date.now() - t0;
    await p.waitForTimeout(3000);
    const dossie = await texto(p);
    await p.screenshot({ path: path.join(saida, `dossie-${largura}.png`), fullPage: false });
    const iptus = [...dossie.matchAll(/IPTU[^\n]{0,60}/g)].map((m) => m[0]);
    r.telas[largura] = {
      cartao: cartao.slice(0, 1400), temChecklist: /Link reconhecido|Tipo, quartos e área/.test(cartao), predioProvavel: (cartao.match(/PRÉDIO PROVÁVEL[\s\S]{0,260}/) ?? [""])[0],
      preparo: preparo.slice(0, 900), msAteODossie: msPreparo, temAviso: /podem estar desatualizados ou divergir/.test(preparo),
      dossieInicio: dossie.slice(0, 1200), undefinedNaTela: /\$?undefined/.test(cartao + dossie), iptus,
      rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    };
    await c.close();
  }
} finally {
  await b.close();
  await writeFile(path.join(AQUI, "render.json"), JSON.stringify(r, null, 1) + "\n");
  console.log(JSON.stringify({ externas: r.externas.length, erros: r.erros, console: r.console.slice(0, 12), telas: Object.fromEntries(Object.entries(r.telas).map(([k, v]) => [k, { checklist: v.temChecklist, aviso: v.temAviso, ms: v.msAteODossie, undef: v.undefinedNaTela, iptus: v.iptus, rolagem: v.rolagem, predio: v.predioProvavel }])) }, null, 1));
}
