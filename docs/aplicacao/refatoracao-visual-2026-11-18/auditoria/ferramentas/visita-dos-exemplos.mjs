// Texto da aba Visita (Preparar e roteiro completo) dos três exemplos, do app como ele está.
// Serve para os protótipos usarem o roteiro real de cada imóvel: quantos pontos e quais vêm primeiro.
//   node visita-dos-exemplos.mjs        (depende do servidor da exportação estática e do caderno de `node capturar.mjs B C`)
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { abrirNavegador, AQUI, BASE, esperar, esperarTexto, PASTA_AUDITORIA, pausa, textoVisivel } from "./navegador.mjs";

const TEXTOS = path.join(PASTA_AUDITORIA, "textos", "outros-exemplos");
await mkdir(TEXTOS, { recursive: true });

const IMOVEIS = [
  { slug: "parque-atlantico", comeca: "Beira-mar" },
  { slug: "ana-elizabeth", comeca: "Revenda antiga" },
  { slug: "viena", comeca: "Rua da Madalena" },
];

const { browser, page } = await abrirNavegador({ estado: path.join(AQUI, ".estado.json") });
const rota = () => new URL(page.url()).pathname;

for (const im of IMOVEIS) {
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.getByRole("tab", { name: "Explorar", exact: true }).waitFor({ timeout: 60_000 });
  await pausa(1500);
  await page.getByRole("button", { name: new RegExp(`^Exemplo · ${im.comeca}`) }).first().click();
  await esperar(() => rota() === "/dossie", "rota /dossie", 40_000);
  await esperarTexto(page, "Destaques", 40_000);
  await pausa(3000);
  await page.getByRole("tab", { name: "Visita", exact: true }).click();
  await esperarTexto(page, "para conferir", 40_000);
  await pausa(2500);
  const preparar = await textoVisivel(page);
  let roteiro = "";
  const completo = page.getByText("Ver roteiro completo").first();
  if (await completo.count()) {
    await completo.click();
    await pausa(2000);
    roteiro = await textoVisivel(page);
  }
  await writeFile(path.join(TEXTOS, `${im.slug}-visita.txt`), `${preparar}\n\n===== ROTEIRO COMPLETO =====\n\n${roteiro}`, "utf8");
  const n = /(\d+)\s*\n\s*pontos? para conferir/.exec(preparar);
  console.log(im.slug, "pontos:", n ? n[1] : "?");
}
await browser.close();
