// Redesenho (15/11/2026): anúncio real do ZAP (fixture) → prédio → preparo → dossiê novo (fotos, ficha curta, IPTU uma
// vez, destaques comparados com o bairro, rotina, divergências) → Entorno → segundo anúncio (Torre) → Comparar com placar.
// Permite só as fotos do CDN do ZAP; o resto de fora é bloqueado e contado.
//   POC_URL=http://localhost:8081 ANALISE=<json> node docs/aplicacao/execucoes/redesenho-2026-11-15/render.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8081").replace(/\/+$/, "");
const AQUI = "docs/aplicacao/execucoes/redesenho-2026-11-15";
const saida = path.resolve(AQUI, "telas");
await mkdir(saida, { recursive: true });
const analise = JSON.parse(await readFile(process.env.ANALISE, "utf8"));
const TEXTO_TORRE = ["Apartamento à venda com 53 m², 2 quartos, 2 banheiros, 1 vaga", "Edf. Engenho Torre", "Torre, Recife - PE", "Venda", "R$ 350.000", "Condomínio R$ 750", "IPTU R$ 180", "8º andar"].join("\n");
const r = { externas: [], fotos: 0, erros: [], console: [], telas: {} };
const b = await chromium.launch();
const texto = (p) => p.evaluate(() => {
  const ocultos = [...document.querySelectorAll('[aria-hidden="true"]')]; const g = ocultos.map((el) => [el, el.style.display]);
  for (const el of ocultos) el.style.display = "none"; const t = document.body.innerText; for (const [el, d] of g) el.style.display = d; return t;
});
try {
  const largura = 375;
  const c = await b.newContext({ viewport: { width: largura, height: 812 } });
  await c.route("**/*", (q) => {
    const u = q.request().url();
    if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue();
    if (new URL(u).hostname === "resizedimgs.zapimoveis.com.br") { r.fotos += 1; return q.continue(); }
    r.externas.push(u); return q.abort();
  });
  await c.addInitScript((a) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify([a])); localStorage.setItem("vereda-ativa-v1", a.id); localStorage.setItem("s", "1"); } }, analise);
  const p = await c.newPage();
  p.on("pageerror", (x) => r.erros.push(x.message));
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) r.console.push(m.text().slice(0, 240)); });
  // 1. Prédio do anúncio real.
  await p.goto(`${base}/predio?id=${analise.id}`, { waitUntil: "load" });
  await p.getByText("É este o prédio?").waitFor({ timeout: 120000 });
  r.telas.predio = (await texto(p)).slice(0, 900);
  await p.getByRole("button", { name: "É este prédio", exact: true }).click();
  await p.getByText("PREPARANDO O DOSSIÊ").waitFor({ timeout: 20000 });
  await p.waitForURL(/\/dossie/, { timeout: 20000 });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: path.join(saida, "dossie-topo.png") });
  r.telas.dossie = await texto(p);
  await p.getByText("Destaques deste prédio.").scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(saida, "dossie-destaques.png") });
  await p.getByText("A pé, da porta do prédio").scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(saida, "dossie-rotina.png") });
  // Abre o primeiro destaque comparativo, se houver.
  const ver = p.getByText("Ver o porquê").first();
  if (await ver.count()) { await ver.click(); await p.waitForTimeout(300); r.telas.destaqueAberto = (await texto(p)).match(/O QUE MAIS PESA[\s\S]{0,1200}/i)?.[0] ?? null; }
  await p.getByRole("tab", { name: "Entorno", exact: true }).click(); await p.waitForTimeout(2000);
  r.telas.entorno = await texto(p);
  await p.getByText("Comparado com o bairro".toUpperCase()).or(p.getByText("Comparado com o bairro")).first().scrollIntoViewIfNeeded().catch(() => undefined); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(saida, "dossie-entorno.png") });
  // 2. Segundo anúncio (Torre) pelo cartão, para o Comparar.
  await p.goto(`${base}/ler?texto=${encodeURIComponent(TEXTO_TORRE)}&n=2`, { waitUntil: "load" });
  await p.getByText("É este · gerar o dossiê").first().waitFor({ timeout: 60000 });
  await p.getByText("É este · gerar o dossiê").first().click();
  await p.waitForURL(/\/dossie/, { timeout: 20000 });
  await p.waitForTimeout(2500);
  await p.goto(`${base}/comparar`, { waitUntil: "load" });
  await p.getByText("Quem ganha em cada parte".toUpperCase()).or(p.getByText("Quem ganha em cada parte")).first().waitFor({ timeout: 30000 }).catch(() => undefined);
  await p.waitForTimeout(1500);
  r.telas.comparar = (await texto(p)).slice(0, 2600);
  await p.getByText("Quem ganha em cada parte".toUpperCase()).or(p.getByText("Quem ganha em cada parte")).first().scrollIntoViewIfNeeded().catch(() => undefined); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(saida, "comparar-placar.png") });
  r.rolagem = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await c.close();
} finally {
  await b.close();
  await writeFile(path.join(AQUI, "render.json"), JSON.stringify(r, null, 1) + "\n");
  console.log(JSON.stringify({ externas: r.externas.length, fotos: r.fotos, erros: r.erros, console: r.console.slice(0, 8), rolagem: r.rolagem }, null, 1));
}
