// Recorta um retângulo de uma imagem PNG (em pixels da própria imagem).
//   node recortar.mjs <entrada.png> <saida.png> <x> <y> <largura> <altura>
import { readFile, writeFile } from "node:fs/promises";
import { lancar } from "./navegador.mjs";

const [entrada, saida, x, y, w, h] = process.argv.slice(2);
const src = `data:image/png;base64,${(await readFile(entrada)).toString("base64")}`;
const browser = await lancar();
const page = await browser.newPage();
const dados = await page.evaluate(
  async ({ src, x, y, w, h }) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const tela = document.createElement("canvas");
    tela.width = w;
    tela.height = h;
    tela.getContext("2d").drawImage(img, x, y, w, h, 0, 0, w, h);
    return tela.toDataURL("image/png").split(",")[1];
  },
  { src, x: Number(x), y: Number(y), w: Number(w), h: Number(h) },
);
await writeFile(saida, Buffer.from(dados, "base64"));
await browser.close();
console.log(saida);
