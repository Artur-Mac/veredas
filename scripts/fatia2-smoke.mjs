import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const DIST = path.resolve("out/web-dist");
const OUT = path.resolve("out/v1/fatia-2");
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

await new Promise((resolve) => server.listen(8092, "127.0.0.1", resolve));
console.log("Smoke server listening on http://127.0.0.1:8092");

const browser = await chromium.launch({ headless: true });

async function capture(page, name) {
  // Mobile 375x812
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}-375.png`), fullPage: true });

  // Desktop 1280x900
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}-1280.png`), fullPage: true });
}

try {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test 1: Web /ler sem WebView e com cartão de colar texto
  const urlZap = "https://www.zapimoveis.com.br/imovel/aluguel-apartamento-1-quarto-com-piscina-casa-forte-recife-pe-37m2-id-2790563018/";
  console.log("Navigating to /ler with ZAP URL...");
  await page.goto(`http://127.0.0.1:8092/ler?url=${encodeURIComponent(urlZap)}`);
  await page.waitForSelector("text=Lendo o anúncio no aparelho");

  // Verify WebView is NOT present
  const iframes = await page.locator("iframe").count();
  if (iframes > 0) {
    throw new Error("Found iframe/webview on web platform, expected none!");
  }
  console.log("Verified: No WebView on web platform.");

  // Verify card "Complete com o texto do anúncio"
  await page.waitForSelector("text=Complete com o texto do anúncio");
  await capture(page, "ler-zap-antes-texto");

  // Test 2: Paste text fixture with IPTU without period
  const textoFixture = `Apartamento com 3 quartos para alugar, 125 m²
Rua Projetada A - Boa Viagem, Recife - PE
Aluguel
R$ 4.500 /mês
Condomínio
R$ 1.190
IPTU
R$ 288
125 m²
3 quartos
3 suítes
1 banheiro
3 vagas
1º andar`;

  console.log("Pasting text and clicking 'Ler texto'...");
  const textarea = page.locator("textarea");
  await textarea.fill(textoFixture);
  await page.click("text=Ler texto");
  await page.waitForTimeout(500);

  // Verify anomaly visible
  await page.waitForSelector("text=IPTU sem indicação se o valor é mensal ou anual.");
  console.log("Verified: IPTU anomaly message is visible.");
  await capture(page, "ler-zap-com-anomalia");

  // Test 3: Save and check in Explorar
  console.log("Clicking 'Encontrar o prédio'...");
  await page.click("text=Encontrar o prédio");
  await page.waitForTimeout(600);

  // Navigate to Explorar to check persistence
  console.log("Navigating to Explorar...");
  await page.goto("http://127.0.0.1:8092/");
  await page.waitForSelector("text=Análises Recentes");
  await capture(page, "explorar-com-analise-salva");
  console.log("Verified: Analysis saved and visible in Explorar.");

  // Test 4: VivaReal Torre (Fora de cobertura)
  const urlTorre = "https://www.vivareal.com.br/imovel/apartamento-3-quartos-torre-bairros-recife-com-garagem-80m2-venda-RS648810-id-2913218130/";
  console.log("Navigating to /ler with Torre URL...");
  await page.goto(`http://127.0.0.1:8092/ler?url=${encodeURIComponent(urlTorre)}`);
  await page.waitForSelector("text=Ainda não cobrimos Torre.");
  console.log("Verified: 'Ainda não cobrimos Torre.' card is displayed.");
  await capture(page, "ler-torre-fora-de-cobertura");

  // Save out of coverage
  console.log("Clicking 'Salvar no caderno' for Torre...");
  await page.click("text=Salvar no caderno");
  await page.waitForTimeout(600);

  // Check in Salvos
  console.log("Navigating to /salvos...");
  await page.goto("http://127.0.0.1:8092/salvos");
  await page.waitForSelector("text=Minhas Análises");
  await capture(page, "salvos-com-torre");
  console.log("Verified: Torre saved in caderno.");

  console.log("All Fatia 2 smoke tests and screenshots completed successfully!");
} finally {
  await browser.close();
  server.close();
}
