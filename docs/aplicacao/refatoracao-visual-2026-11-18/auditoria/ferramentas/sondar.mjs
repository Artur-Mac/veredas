// Sondagem rápida: abre o app, captura o Explorar vazio e lista os controles com nome acessível.
//   node sondar.mjs
import { abrirNavegador, BASE, capturar, esperarTexto, pausa, textoVisivel } from "./navegador.mjs";

const { browser, page, erros } = await abrirNavegador();
await page.goto(`${BASE}/`);
await esperarTexto(page, "Anúncio, prédio ou rua", 30_000);
await pausa(1500);
await capturar(page, "sonda-explorar-vazio", { inteira: true, pasta: "sondagem" });
console.log(await textoVisivel(page));
const botoes = await page.evaluate(() =>
  [...document.querySelectorAll('[role="button"],button,[role="tab"],[role="radio"],a,input,textarea')]
    .filter((el) => !el.closest('[aria-hidden="true"]'))
    .map((el) => `${el.getAttribute("role") || el.tagName.toLowerCase()} | ${el.getAttribute("aria-label") || el.innerText?.slice(0, 60) || el.getAttribute("placeholder") || ""}`),
);
console.log("---- controles");
console.log(botoes.join("\n"));
console.log("---- erros", erros);
await browser.close();
