// Material para os protótipos da fase 1, tirado do app como ele está:
//  - capturas do mapa atual (topo do dossiê dos três exemplos e a gaveta "Mapa do lote"), sem os botões por cima;
//  - o texto do dossiê dos outros dois exemplos (Graças e Madalena), para os números do Comparar e do caderno;
//  - o contorno do lote dos três prédios, do índice cadastral, como caminho SVG.
//   node extrair.mjs        (depende do caderno montado por `node capturar.mjs B C`)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { abrirNavegador, AQUI, BASE, esperar, esperarTexto, PASTA_AUDITORIA, pausa, textoVisivel } from "./navegador.mjs";

const RAIZ = path.resolve(AQUI, "../../../../..");
const MAPAS = path.resolve(PASTA_AUDITORIA, "../prototipos/mapas");
const TEXTOS = path.join(PASTA_AUDITORIA, "textos", "outros-exemplos");
await mkdir(MAPAS, { recursive: true });
await mkdir(TEXTOS, { recursive: true });

const IMOVEIS = [
  { slug: "parque-atlantico", comeca: "Beira-mar", bairro: "boa-viagem", id: "11720-2290" },
  { slug: "ana-elizabeth", comeca: "Revenda antiga", bairro: "gracas", id: "59382-537" },
  { slug: "viena", comeca: "Rua da Madalena", bairro: "madalena", id: "1880-186" },
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
  await pausa(4000);

  // Mapa do topo: a primeira faixa do "Resumo do imóvel". Os botões por cima somem só para a foto.
  const caixa = await page.evaluate(() => {
    const resumo = document.querySelector('[aria-label="Resumo do imóvel"]');
    const topo = resumo.firstElementChild;
    for (const el of topo.querySelectorAll('[role="button"],button,a')) el.style.visibility = "hidden";
    const r = topo.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await pausa(300);
  await page.screenshot({ path: path.join(MAPAS, `${im.slug}-topo.png`), clip: caixa });
  await page.evaluate(() => {
    for (const el of document.querySelector('[aria-label="Resumo do imóvel"]').firstElementChild.querySelectorAll('[role="button"],button,a')) el.style.visibility = "";
  });

  for (const [aba, nome] of [["Destaques", "destaques"], ["Entorno", "entorno"], ["Edifício", "edificio"]]) {
    await page.getByRole("tab", { name: aba, exact: true }).click();
    await pausa(2500);
    await writeFile(path.join(TEXTOS, `${im.slug}-${nome}.txt`), await textoVisivel(page), "utf8");
  }

  if (im.slug === "parque-atlantico") {
    await page.getByRole("tab", { name: "Destaques", exact: true }).click();
    await pausa(1500);
    await page.getByRole("button", { name: /Abrir mapa/ }).first().click();
    const gaveta = page.getByRole("dialog").first();
    await gaveta.waitFor();
    await pausa(3000);
    await writeFile(path.join(TEXTOS, "parque-atlantico-gaveta-mapa.txt"), await gaveta.innerText(), "utf8");
    await page.screenshot({ path: path.join(MAPAS, "parque-atlantico-gaveta-planta.png") });
    const volume = page.getByRole("radio", { name: /Volume · manhã/ }).or(page.getByRole("tab", { name: /Volume · manhã/ })).or(page.getByText("Volume · manhã"));
    await volume.first().click();
    await pausa(3000);
    await page.screenshot({ path: path.join(MAPAS, "parque-atlantico-gaveta-volume.png") });
    await page.keyboard.press("Escape");
    await pausa(600);
    // "Ver risco de torres futuras": o caso de "Sem leitura" da ficha.
    await page.getByText("Ver risco de torres futuras").first().click();
    await pausa(1200);
    const t = await textoVisivel(page);
    await writeFile(path.join(TEXTOS, "parque-atlantico-torres-futuras.txt"), t.slice(t.indexOf("torres futuras") - 200, t.indexOf("torres futuras") + 1400), "utf8");
  }
  console.log(im.slug, "ok");
}
await browser.close();

// Contorno do lote, do índice cadastral, numa caixa de 100 × 100 (norte para cima).
const diretorio = /DIRETORIO_DO_INDICE = "([a-z0-9/-]+)"/.exec(await readFile(path.join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8"))[1];
const lotes = {};
for (const im of IMOVEIS) {
  const indice = JSON.parse(await readFile(path.join(RAIZ, "src/dados/recife", diretorio, `${im.bairro}.json`), "utf8"));
  const e = indice.edificios.find((x) => x.id === im.id);
  const cos = Math.cos((e.centro[1] * Math.PI) / 180);
  const pts = e.poligono.map(([lon, lat]) => [lon * cos, -lat]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = 88 / Math.max(maxX - minX, maxY - minY);
  const dx = (100 - (maxX - minX) * k) / 2;
  const dy = (100 - (maxY - minY) * k) / 2;
  lotes[im.slug] = "M" + pts.map(([x, y]) => `${((x - minX) * k + dx).toFixed(1)} ${((y - minY) * k + dy).toFixed(1)}`).join("L") + "Z";
}
await writeFile(path.join(MAPAS, "lotes.json"), JSON.stringify(lotes, null, 2), "utf8");
console.log(lotes);
