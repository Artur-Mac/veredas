// Dobra uma captura muito alta (tira da tela inteira) em colunas lado a lado, para caber numa página.
//
//   node fatiar.mjs <imagem.png> [--altura 1600] [--colunas 4] [--saida pasta/prefixo]
//
// Gera <prefixo>-1.png, <prefixo>-2.png… com até `colunas` fatias de `altura` px cada. Cada fatia leva no topo a posição
// (em telas de 844 px) em que começa.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { lancar } from "./navegador.mjs";

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};

export async function fatiar(imagem, { altura = 1600, colunas = 4, saida, largura = 390, tela = 844 } = {}) {
  const dados = await readFile(imagem);
  const src = `data:image/png;base64,${dados.toString("base64")}`;
  const browser = await lancar();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
  await page.setContent(`<img id="i" src="${src}">`);
  const dim = await page.evaluate(async () => {
    const i = document.getElementById("i");
    await i.decode();
    return { w: i.naturalWidth, h: i.naturalHeight };
  });
  const escala = dim.w / largura;
  const alturaReal = dim.h / escala;
  const total = Math.ceil(alturaReal / altura);
  const prefixo = saida ?? imagem.replace(/\.png$/, "-dobrada");
  const arquivos = [];
  for (let folha = 0; folha * colunas < total; folha++) {
    const fatias = [];
    for (let c = 0; c < colunas && folha * colunas + c < total; c++) {
      const n = folha * colunas + c;
      fatias.push(
        `<figure><figcaption>${n === 0 ? "topo" : `a ${(Math.round(((n * altura) / tela) * 10) / 10).toString().replace(".", ",")} telas do topo`}</figcaption>` +
          `<div style="width:${largura}px;height:${Math.min(altura, alturaReal - n * altura)}px;overflow:hidden"><img src="${src}" style="width:${largura}px;margin-top:-${n * altura}px;display:block"></div></figure>`,
      );
    }
    await page.setViewportSize({ width: fatias.length * (largura + 16) + 16, height: altura + 60 });
    await page.setContent(
      `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#2a2622;display:flex;gap:16px;align-items:flex-start;font:500 12px/1.3 sans-serif;color:#e7e2d8}figure{margin:0}figcaption{margin-bottom:6px;color:#cdbfa8}</style>${fatias.join("")}`,
    );
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
    const arquivo = `${prefixo}-${folha + 1}.png`;
    await page.screenshot({ path: arquivo, fullPage: true });
    arquivos.push(arquivo);
  }
  await browser.close();
  return { arquivos, alturaReal, telas: alturaReal / tela };
}

if (process.argv[1] && path.basename(process.argv[1]) === "fatiar.mjs") {
  const imagem = process.argv[2];
  const r = await fatiar(imagem, { altura: Number(arg("altura", 1600)), colunas: Number(arg("colunas", 4)), saida: arg("saida", undefined) });
  console.log(`${imagem}: ${Math.round(r.alturaReal)} px (${r.telas.toFixed(1)} telas de 844 px) → ${r.arquivos.join(", ")}`);
}
