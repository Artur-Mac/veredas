// Sondagem do editor: abre o exemplo de Boa Viagem, vai a "Ver composição e ajustar valores" e lista os campos.
import { abrirNavegador, BASE, capturar, esperar, esperarTexto, pausa, textoVisivel } from "./navegador.mjs";

const { browser, page } = await abrirNavegador({ escala: 1 });
await page.goto(`${BASE}/`);
await esperarTexto(page, "Anúncio, prédio ou rua", 30_000);
await page.getByRole("button", { name: /^Exemplo: Beira-mar/ }).click();
await esperar(() => new URL(page.url()).pathname === "/dossie", "rota /dossie", 30_000);
await esperarTexto(page, "Destaques", 30_000);
await pausa(2000);
await page.getByText("Ver composição e ajustar valores").first().click();
await esperar(() => new URL(page.url()).pathname === "/editar", "rota /editar", 15_000);
await pausa(1500);
console.log(page.url());
await capturar(page, "sonda-editar", { inteira: true, pasta: "sondagem" });
const antes = await textoVisivel(page);
console.log(antes);
const verTodos = page.getByRole("button", { name: /^Ver todos os campos/ });
if (await verTodos.count()) {
  await verTodos.click();
  await pausa(800);
  console.log("==== todos os campos");
  console.log(await textoVisivel(page));
}
const controles = await page.evaluate(() =>
  [...document.querySelectorAll('[role="button"],button,[role="radio"],[role="checkbox"],input,textarea')]
    .filter((el) => !el.closest('[aria-hidden="true"]'))
    .map((el) => `${el.getAttribute("role") || el.tagName.toLowerCase()} | ${el.getAttribute("aria-label") || el.innerText?.slice(0, 60) || ""} | ${el.value ?? ""}`),
);
console.log("---- controles\n" + controles.join("\n"));
await capturar(page, "sonda-editar-todos", { inteira: true, pasta: "sondagem" });
console.log(JSON.stringify(await page.evaluate(() => Object.keys(localStorage))));
await browser.close();
