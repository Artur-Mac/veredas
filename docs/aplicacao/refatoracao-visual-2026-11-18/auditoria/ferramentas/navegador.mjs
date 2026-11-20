// Utilidades de captura da auditoria visual (fase 0). Só o navegador: nada aqui toca o app.
import { chromium } from "../../../../../node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const PASTA_AUDITORIA = path.resolve(AQUI, "..");
export const BASE = (process.env.APP_URL || "http://127.0.0.1:8097").replace(/\/+$/, "");

export const CELULAR = { width: 390, height: 844 };

export const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

/** O Chromium do Playwright, se estiver baixado; senão o Chrome instalado na máquina (nenhum download é feito aqui). */
export async function lancar() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    if (!/Executable doesn't exist/.test(String(e))) throw e;
    return chromium.launch({ headless: true, channel: "chrome" });
  }
}

export async function abrirNavegador({ largura = CELULAR.width, altura = CELULAR.height, escala = 2, estado } = {}) {
  const browser = await lancar();
  const context = await browser.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: escala,
    locale: "pt-BR",
    timezoneId: "America/Recife",
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
    ...(estado ? { storageState: estado } : {}),
  });
  const page = await context.newPage();
  const erros = [];
  page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(`console: ${m.text()}`);
  });
  return { browser, context, page, erros };
}

/** O texto que a pessoa vê agora: as telas empilhadas por baixo (aria-hidden) ficam de fora. */
export async function textoVisivel(page) {
  return page.evaluate(() => {
    const ocultos = [...document.querySelectorAll('[aria-hidden="true"]')];
    const guardados = ocultos.map((el) => [el, el.style.display]);
    for (const el of ocultos) el.style.display = "none";
    const texto = document.body.innerText;
    for (const [el, display] of guardados) el.style.display = display;
    return texto;
  });
}

export async function esperar(condicao, descricao, ms = 15_000) {
  const limite = Date.now() + ms;
  let ultimo = null;
  while (Date.now() < limite) {
    try {
      if (await condicao()) return;
    } catch (e) {
      ultimo = e;
    }
    await pausa(120);
  }
  throw new Error(`Tempo esgotado esperando: ${descricao}${ultimo ? ` (${ultimo.message.split("\n")[0]})` : ""}`);
}

export const esperarTexto = (page, trecho, ms) => esperar(async () => (await textoVisivel(page)).includes(trecho), `texto "${trecho}"`, ms);

/**
 * Altura do conteúdo da rolagem visível (o app rola dentro de um ScrollView, não no documento): devolve quanto o
 * conteúdo passa da janela, para a captura inteira.
 */
async function sobraDaRolagem(page) {
  return page.evaluate(() => {
    let maior = 0;
    for (const el of document.querySelectorAll("*")) {
      if (el.closest('[aria-hidden="true"]')) continue;
      const estilo = getComputedStyle(el);
      if (!/(auto|scroll)/.test(estilo.overflowY)) continue;
      const sobra = el.scrollHeight - el.clientHeight;
      if (sobra > maior && el.clientHeight > 200) maior = sobra;
    }
    return maior;
  });
}

/** Captura a janela (o que a pessoa vê ao abrir) e, com `inteira`, a tela toda numa tira só. Grava também o texto. */
export async function capturar(page, nome, { inteira = false, pasta = "capturas", texto = true } = {}) {
  const dir = path.join(PASTA_AUDITORIA, pasta);
  await mkdir(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${nome}.png`) });
  let alturaInteira = null;
  if (inteira) {
    const janela = page.viewportSize();
    const sobra = await sobraDaRolagem(page);
    if (sobra > 8) {
      alturaInteira = janela.height + sobra;
      await page.setViewportSize({ width: janela.width, height: alturaInteira });
      // O Chrome não desenha superfície com mais de 16.384 px: acima disso a imagem recomeça do topo. Telas muito altas
      // (o dossiê passa de 11.000 px) são capturadas a 1× em vez de 2×.
      const escala = await page.evaluate(() => window.devicePixelRatio);
      const reduzir = alturaInteira * escala > 16000;
      await pausa(700);
      await page.screenshot({ path: path.join(dir, `${nome}-inteira.png`), ...(reduzir ? { scale: "css" } : {}) });
      await page.setViewportSize(janela);
      await pausa(250);
    }
  }
  if (texto) {
    const dirTexto = path.join(PASTA_AUDITORIA, "textos");
    await mkdir(dirTexto, { recursive: true });
    await writeFile(path.join(dirTexto, `${nome}.txt`), await textoVisivel(page), "utf8");
  }
  return { alturaInteira };
}

/** Rola a rolagem visível até o primeiro texto que começa com `texto` ficar a `folga` px do topo da janela. */
export async function rolarAteTexto(page, texto, folga = 120) {
  await page.evaluate(
    ({ texto, folga }) => {
      const alvo = [...document.querySelectorAll("body *")]
        .filter((el) => !el.closest('[aria-hidden="true"]') && el.childElementCount === 0 && el.textContent.trim().startsWith(texto))
        .at(0);
      if (!alvo) throw new Error(`sem texto: ${texto}`);
      let pai = alvo.parentElement;
      while (pai && !(/(auto|scroll)/.test(getComputedStyle(pai).overflowY) && pai.scrollHeight > pai.clientHeight + 8)) pai = pai.parentElement;
      if (!pai) return;
      pai.scrollTop += alvo.getBoundingClientRect().top - folga;
    },
    { texto, folga },
  );
  await pausa(600);
}
