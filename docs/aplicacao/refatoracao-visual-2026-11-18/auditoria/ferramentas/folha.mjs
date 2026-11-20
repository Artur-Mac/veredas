// Folha de contato: várias capturas numa imagem só, com legenda.
//
//   node folha.mjs <saida.png> --titulo "Texto" --colunas 5 --largura 300 <img1.png> <img2.png> …
//
// Também exporta `montarFolha(itens, opções)` para os roteiros de captura. `itens`: [{ arquivo, legenda }].
import { readFile } from "node:fs/promises";
import path from "node:path";
import { lancar } from "./navegador.mjs";

export async function montarFolha(itens, { saida, titulo = "", colunas = 5, largura = 300, fundo = "#2a2622", escala = 1 } = {}) {
  const browser = await lancar();
  const page = await browser.newPage({ viewport: { width: colunas * (largura + 20) + 20, height: 600 }, deviceScaleFactor: escala });
  const figuras = [];
  for (const i of itens) {
    const src = `data:image/png;base64,${(await readFile(i.arquivo)).toString("base64")}`;
    figuras.push(`<figure><img src="${src}"><figcaption>${i.legenda ?? path.basename(i.arquivo, ".png")}</figcaption></figure>`);
  }
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:20px;background:${fundo};font:500 13px/1.35 "Segoe UI",system-ui,sans-serif;color:#efe8da}
    h1{font-size:17px;margin:0 0 16px;font-weight:600}
    .g{display:grid;grid-template-columns:repeat(${colunas},${largura}px);gap:20px;align-items:start}
    figure{margin:0} img{width:${largura}px;display:block;border-radius:6px}
    figcaption{margin-top:7px;color:#cdbfa8}</style>
    ${titulo ? `<h1>${titulo}</h1>` : ""}<div class="g">${figuras.join("")}</div>`);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  await page.screenshot({ path: saida, fullPage: true });
  await browser.close();
  return saida;
}

if (process.argv[1] && path.basename(process.argv[1]) === "folha.mjs") {
  const args = process.argv.slice(2);
  const opc = { saida: args.shift() };
  const itens = [];
  while (args.length) {
    const a = args.shift();
    if (a === "--titulo") opc.titulo = args.shift();
    else if (a === "--colunas") opc.colunas = Number(args.shift());
    else if (a === "--largura") opc.largura = Number(args.shift());
    else itens.push({ arquivo: a });
  }
  console.log(await montarFolha(itens, opc));
}
