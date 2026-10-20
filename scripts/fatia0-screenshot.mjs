import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const DIST = path.resolve("out/web-dist");
const OUT = path.resolve("out/v1/fatia-0");
await mkdir(OUT, { recursive: true });

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  let filePath = path.join(DIST, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, "index.html");
  }
  const ext = path.extname(filePath);
  const type = MIME[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(8089, "127.0.0.1", resolve));
console.log("Server listening on http://127.0.0.1:8089");

const browser = await chromium.launch({ headless: true });

async function capture(page, name) {
  // Mobile 375x812
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}-375.png`) });

  // Desktop 1280x900
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}-1280.png`) });
}

try {
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Explorar
  await page.goto("http://127.0.0.1:8089/");
  await page.waitForSelector("text=VEREDA");
  await capture(page, "explorar");

  // 2. Gaveta de Créditos
  const creditBtn = page.getByRole("button", { name: /créditos/i });
  await creditBtn.click();
  await page.waitForSelector("text=Carteira de créditos");
  await capture(page, "creditos");

  // Fechar gaveta (Esc)
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 3. Menu Rápido
  const menuBtn = page.getByRole("button", { name: "Menu de navegação" });
  await menuBtn.click();
  await page.waitForSelector("text=Minhas análises");
  await capture(page, "menu");

  // Fechar menu (Esc)
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 4. Dossiê (Vazio)
  const tabDossie = page.getByRole("tab", { name: "Dossiê" });
  await tabDossie.click();
  await page.waitForSelector("text=Nenhum dossiê aberto");
  await capture(page, "dossie-vazio");

  // 5. Comparar
  const tabComparar = page.getByRole("tab", { name: "Comparar" });
  await tabComparar.click();
  await page.waitForTimeout(400);
  await capture(page, "comparar");

  // 6. Visita (Vazio)
  const tabVisita = page.getByRole("tab", { name: "Visita" });
  await tabVisita.click();
  await page.waitForSelector("text=Nenhum dossiê aberto");
  await capture(page, "visita-vazio");

  // 7. Exemplo Boa Viagem
  const tabExplorar = page.getByRole("tab", { name: "Explorar" });
  await tabExplorar.click();
  await page.waitForTimeout(400);

  const cardBoaViagem = page.getByRole("button", { name: /Boa Viagem/i }).first();
  await cardBoaViagem.click();
  await page.locator("text=Rua João Cardoso Aires").first().waitFor({ state: "attached", timeout: 5000 });
  await page.waitForTimeout(600);
  await capture(page, "exemplo-boa-viagem");

  console.log("All screenshots captured successfully in out/v1/fatia-0/");
} finally {
  await browser.close();
  server.close();
}
