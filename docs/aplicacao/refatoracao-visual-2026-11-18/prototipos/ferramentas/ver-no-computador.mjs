// Captura um protótipo como ele aparece no computador (roteiro das telas à esquerda e o aparelho de 390 × 844).
//   node ferramentas/ver-no-computador.mjs a ficha        → capturas/<x>/computador-<rota>.png
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lancar } from "../../auditoria/ferramentas/navegador.mjs";
import { servir } from "../../auditoria/ferramentas/servir.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROTOTIPOS = path.resolve(AQUI, "..");
const RAIZ = path.resolve(PROTOTIPOS, "../../../..");
const [opcao = "a", rota = ""] = process.argv.slice(2);
const porta = 8151;
const servidor = await servir(RAIZ, porta);
const browser = await lancar();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 920 }, deviceScaleFactor: 1 });
  const caminho = "/" + path.relative(RAIZ, PROTOTIPOS).split(path.sep).join("/");
  await page.goto(`http://127.0.0.1:${porta}${caminho}/opcao-${opcao}/index.html${rota ? "#" + rota : ""}`);
  await page.waitForFunction(() => document.documentElement.dataset.pronto === "1");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const saida = path.join(PROTOTIPOS, "capturas", opcao, `computador-${(rota || "inicio").replace(/[+@]/g, "--")}.png`);
  await page.screenshot({ path: saida });
  console.log(saida);
} finally {
  await browser.close();
  servidor.close();
}
