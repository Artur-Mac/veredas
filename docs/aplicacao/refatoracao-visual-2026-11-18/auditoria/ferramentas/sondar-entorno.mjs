// Lê no app, para o exemplo de Boa Viagem, os blocos que abrem com um toque na aba Entorno: bairros vizinhos da
// segurança, renda do setor censitário, pulso da quadra e a ficha de método da nota a pé e do conforto. Só leitura.
import path from "node:path";
import { abrirNavegador, AQUI, BASE, esperar, esperarTexto, pausa, rolarAteTexto, textoVisivel } from "./navegador.mjs";

const { browser, page } = await abrirNavegador({ estado: path.join(AQUI, ".estado.json"), escala: 1 });
const rota = () => new URL(page.url()).pathname;
await page.goto(`${BASE}/`, { waitUntil: "load" });
await page.getByRole("tab", { name: "Explorar", exact: true }).waitFor({ timeout: 60_000 });
await pausa(1500);
await page.getByRole("button", { name: /^Exemplo · Beira-mar/ }).first().click();
await esperar(() => rota() === "/dossie", "rota /dossie", 40_000);
await esperarTexto(page, "Destaques", 40_000);
await pausa(3000);
await page.getByRole("tab", { name: "Entorno", exact: true }).click();
await pausa(3000);

const trecho = async (inicio, tamanho = 1400) => {
  const t = await textoVisivel(page);
  const i = t.indexOf(inicio);
  return i < 0 ? `(não achei "${inicio}")` : t.slice(i, i + tamanho).replace(/\n/g, " | ");
};
const tocar = async (texto) => {
  await rolarAteTexto(page, texto, 200);
  await page.getByText(texto, { exact: false }).first().click();
  await pausa(900);
};

await tocar("Ver os 4 bairros vizinhos");
console.log("### VIZINHOS\n" + (await trecho("Segurança em Boa Viagem", 1800)));
await tocar("Setor censitário");
console.log("\n### RENDA\n" + (await trecho("Setor censitário", 1200)));
await tocar("Como esta nota foi calculada");
console.log("\n### MÉTODO A PÉ\n" + (await trecho("Como esta nota foi calculada", 1600).then((x) => x)));
await tocar("Como cada nota foi calculada");
console.log("\n### MÉTODO PULSO\n" + (await trecho("Pulso da quadra por dimensão", 3200)));
await page.getByRole("tab", { name: "Destaques", exact: true }).click();
await pausa(2500);
await rolarAteTexto(page, "Conforto térmico na prática", 100);
await page.getByText("Como foi calculada", { exact: true }).first().click();
await pausa(900);
console.log("\n### MÉTODO CONFORTO\n" + (await trecho("O que checar na visita: abrir janelas", 1800)));
await browser.close();
