// Conta as palavras que a pessoa vê sem rolar (390 × 844) numa rota de um protótipo. Usado na tabela de medidas do comparativo.
//   node ferramentas/primeira-tela.mjs a ficha        node ferramentas/primeira-tela.mjs b painel
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lancar } from "../../auditoria/ferramentas/navegador.mjs";
import { servir } from "../../auditoria/ferramentas/servir.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROTOTIPOS = path.resolve(AQUI, "..");
const RAIZ = path.resolve(PROTOTIPOS, "../../../..");
const [opcao = "a", ...rotas] = process.argv.slice(2);
const porta = 8161;
const servidor = await servir(RAIZ, porta);
const browser = await lancar();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: "pt-BR" });
  const page = await context.newPage();
  const caminho = "/" + path.relative(RAIZ, PROTOTIPOS).split(path.sep).join("/");
  for (const rota of rotas) {
    await page.goto(`http://127.0.0.1:${porta}${caminho}/opcao-${opcao}/index.html#${rota}`);
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.pronto === "1");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const n = await page.evaluate(() => {
      const escopo = document.querySelector(".gaveta.aberta") || document.querySelector(".tela.ativa");
      const w = document.createTreeWalker(escopo, NodeFilter.SHOW_TEXT);
      let palavras = 0;
      while (w.nextNode()) {
        const no = w.currentNode;
        const el = no.parentElement;
        if (!el || el.closest(".estado, [hidden], template") || !el.checkVisibility()) continue;
        const faixa = document.createRange();
        faixa.selectNodeContents(no);
        const r = faixa.getBoundingClientRect();
        // Só o que está dentro da janela (o painel da opção B tem páginas ao lado, fora dela).
        if (r.width === 0 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
        palavras += no.textContent.split(/\s+/).filter((p) => /[\p{L}\p{N}]/u.test(p)).length;
      }
      return palavras;
    });
    console.log(`${opcao} · ${rota}: ${n} palavras na primeira tela`);
  }
} finally {
  await browser.close();
  servidor.close();
}
