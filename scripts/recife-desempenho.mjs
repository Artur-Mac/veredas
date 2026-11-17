// Medição no navegador local; não representa Android/iOS ou aparelho de referência.
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.POC_URL || "http://localhost:8093";
const pacote = JSON.parse(await fs.readFile("out/v1/execucao-ampla/novos/pacote-sintetico-375.json", "utf8"));
const exemplo = JSON.parse(pacote.metadados).analises[0];
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const resultados = [];
try {
  for (const quantidade of [10, 100, 500]) {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    await context.route("**/*", r => new URL(r.request().url()).origin === new URL(base).origin ? r.continue() : r.abort());
    const page = await context.newPage();
    await page.goto(base);
    const bytes = await page.evaluate(({ exemplo, quantidade }) => {
      const lista = Array.from({ length: quantidade }, (_, i) => ({ ...exemplo, id: `bench-${i}`, nome: `Imóvel sintético ${i}` }));
      const texto = JSON.stringify(lista);
      localStorage.setItem("vereda-analises-v2", texto);
      localStorage.setItem("vereda-ativa-v1", "bench-0");
      return new TextEncoder().encode(texto).length;
    }, { exemplo, quantidade });
    const inicio = performance.now();
    await page.goto(`${base}/detalhes?id=bench-0&secao=campo`);
    await page.getByText("Seu registro de campo.", { exact: true }).waitFor();
    const aberturaMs = performance.now() - inicio;
    await page.getByRole("button", { name: /Decisão e diário pessoal/ }).click();
    const tempos = [];
    for (let i = 0; i < 33; i++) {
      const decisao = i % 2 ? "visitado" : "considerando";
      const label = i % 2 ? "Visitado" : "Considerando";
      const t = performance.now();
      await page.getByRole("button", { name: new RegExp(`^Situação da busca: ${label}(, selecionado)?$`) }).click();
      await page.waitForFunction(decisao => JSON.parse(localStorage.getItem("vereda-analises-v2"))[0].caderno.decisao === decisao, decisao);
      if (i >= 3) tempos.push(performance.now() - t);
    }
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("vereda-analises-v2")).length), quantidade);
    const ordenados = tempos.toSorted((a, b) => a - b);
    resultados.push({ quantidade, bytes, aberturaMs, aberturaAmostras: 1, amostrasAposAquecimento: tempos.length,
      p50Ms: ordenados[14], p95Ms: ordenados[28], maxMs: ordenados.at(-1), temposMs: tempos });
    await context.close();
  }
  const resultado = { navegador: browser.version(), plataforma: "Chromium headless local / Linux, 375×812", metodo: "Tempo do clique automatizado até persistência da decisão via atualizar; inclui automação, renderização e validação. Três aquecimentos e 30 amostras por tamanho. Abertura tem uma amostra, sem p95. Não mede rede móvel, dispositivo físico, consumo de memória ou arquivos máximos.", resultados };
  await fs.writeFile("docs/plano-recife/execucoes/desempenho-local.json", JSON.stringify(resultado, null, 2) + "\n");
  console.log(JSON.stringify(resultados.map(({ quantidade, bytes, p95Ms, maxMs }) => ({ quantidade, bytes, p95Ms, maxMs }))));
} finally { await browser.close(); }
