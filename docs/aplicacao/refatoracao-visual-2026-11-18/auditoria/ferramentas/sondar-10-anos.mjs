// Lê no app, para os dois exemplos de compra, a frase de "Visão de 10 anos" com 0%, 3% e 5% de valorização, as opções do
// simulador de financiamento e a mensagem pronta para o corretor. Só leitura: alimenta os protótipos com números reais.
import path from "node:path";
import { abrirNavegador, AQUI, BASE, esperar, esperarTexto, pausa, rolarAteTexto, textoVisivel } from "./navegador.mjs";

const { browser, page } = await abrirNavegador({ estado: path.join(AQUI, ".estado.json"), escala: 1 });
const rota = () => new URL(page.url()).pathname;
for (const comeca of ["Beira-mar", "Revenda antiga"]) {
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.getByRole("tab", { name: "Explorar", exact: true }).waitFor({ timeout: 60_000 });
  await pausa(1500);
  await page.getByRole("button", { name: new RegExp(`^Exemplo · ${comeca}`) }).first().click();
  await esperar(() => rota() === "/dossie", "rota /dossie", 40_000);
  await esperarTexto(page, "Destaques", 40_000);
  await pausa(3500);
  await rolarAteTexto(page, "Visão de 10 anos", 100);
  for (const v of ["0% ao ano", "3% ao ano", "5% ao ano"]) {
    await page.getByText(v, { exact: true }).first().click();
    await pausa(500);
    const t = await textoVisivel(page);
    const frase = t.split("\n").find((l) => l.startsWith("Supondo valorização"));
    console.log(comeca, "|", v, "|", frase);
  }
  if (comeca === "Beira-mar") {
    // Simulador de financiamento (dentro da pílula "Financiar 80% em 30 anos").
    await rolarAteTexto(page, "Financiar 80% em 30 anos", 200);
    await page.getByText("Financiar 80% em 30 anos").first().click();
    await pausa(1200);
    const t = await textoVisivel(page);
    const i = t.indexOf("Financiar 80% em 30 anos");
    console.log("--- financiamento\n" + t.slice(i, i + 900).replace(/\n/g, " | "));
    // Perguntas e mensagem para o corretor: gaveta do roteiro, pela aba Edifício.
    await page.getByRole("tab", { name: "Edifício", exact: true }).click();
    await pausa(2000);
    await page.getByText("Ver todas as verificações").first().click();
    await pausa(1200);
    const dialogo = page.getByRole("dialog").first();
    console.log("--- roteiro\n" + (await dialogo.innerText()).replace(/\n/g, " | ").slice(0, 2500));
  }
}
await browser.close();
