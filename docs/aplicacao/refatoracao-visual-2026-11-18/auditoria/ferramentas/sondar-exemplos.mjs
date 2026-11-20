// Sondagem dos três endereços de exemplo do Explorar: abre cada um e guarda a tira inteira e o texto das três abas do
// dossiê, para escolher o exemplo mais rico (fase 0, item 4).
//   node sondar-exemplos.mjs
import { abrirNavegador, BASE, capturar, esperar, esperarTexto, pausa, textoVisivel } from "./navegador.mjs";

const EXEMPLOS = [
  ["beira-mar", "Beira-mar em Boa Viagem"],
  ["gracas", "Revenda antiga nas Graças"],
  ["madalena", "Rua da Madalena com pedidos de drenagem"],
];

for (const [slug, titulo] of EXEMPLOS) {
  const { browser, page, erros } = await abrirNavegador({ escala: 1 });
  await page.goto(`${BASE}/`);
  await esperarTexto(page, "Anúncio, prédio ou rua", 30_000);
  await page.getByRole("button", { name: new RegExp(`^Exemplo: ${titulo}`) }).click();
  await esperar(() => new URL(page.url()).pathname === "/dossie", "rota /dossie", 30_000);
  await esperar(async () => (await textoVisivel(page)).includes("Destaques"), "abas do dossiê", 30_000);
  await pausa(3500);
  await capturar(page, `sonda-${slug}-destaques`, { inteira: true, pasta: "sondagem" });
  for (const aba of ["Entorno", "Edifício"]) {
    await page.getByRole("tab", { name: aba, exact: true }).click();
    await pausa(2500);
    await capturar(page, `sonda-${slug}-${aba === "Entorno" ? "entorno" : "edificio"}`, { inteira: true, pasta: "sondagem" });
  }
  console.log(slug, "erros:", erros.length, erros.slice(0, 3));
  await browser.close();
}
