// Mede as telas da navegação principal para o inventário da auditoria (fase 0): altura em telas de 844 px, palavras,
// controles por tipo, caixas com borda e canto arredondado ("cartões"), títulos e rótulos de botão com mais de 3 palavras.
//   node medir.mjs      (depende do caderno montado por `node capturar.mjs B C`)  →  auditoria/metricas.json
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { abrirNavegador, AQUI, BASE, esperar, esperarTexto, PASTA_AUDITORIA, pausa, textoVisivel } from "./navegador.mjs";

const { browser, page } = await abrirNavegador({ estado: path.join(AQUI, ".estado.json"), escala: 1 });
const rota = () => new URL(page.url()).pathname;

async function abrir(caminho) {
  await page.goto(`${BASE}${caminho}`, { waitUntil: "load" });
  await page.getByRole("tab", { name: "Explorar", exact: true }).waitFor({ timeout: 60_000 });
  await pausa(3500);
}

async function medir(nome) {
  const texto = await textoVisivel(page);
  const dom = await page.evaluate(() => {
    const visivel = (el) => !el.closest('[aria-hidden="true"]') && el.getClientRects().length > 0;
    let sobra = 0;
    for (const el of document.querySelectorAll("*")) {
      if (!visivel(el)) continue;
      const e = getComputedStyle(el);
      if (/(auto|scroll)/.test(e.overflowY) && el.clientHeight > 200) sobra = Math.max(sobra, el.scrollHeight - el.clientHeight);
    }
    const nomeDe = (el) => (el.getAttribute("aria-label") || el.innerText || "").replace(/\s+/g, " ").trim();
    const papeis = { botao: '[role="button"],button', link: 'a,[role="link"]', aba: '[role="tab"]', opcao: '[role="radio"],[role="checkbox"]', campo: "input,textarea" };
    const controles = {};
    const rotulos = [];
    for (const [k, seletor] of Object.entries(papeis)) {
      const els = [...document.querySelectorAll(seletor)].filter(visivel);
      controles[k] = els.length;
      if (k === "botao" || k === "link") for (const el of els) rotulos.push((el.innerText || "").replace(/\s+/g, " ").trim());
    }
    // "Cartão": caixa larga com borda de 1 px ou mais em volta e canto de 12 px ou mais.
    const cartoes = [...document.querySelectorAll("div")].filter((el) => {
      if (!visivel(el)) return false;
      const e = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return r.width >= 300 && r.height >= 70 && parseFloat(e.borderTopWidth) >= 1 && parseFloat(e.borderLeftWidth) >= 1 && parseFloat(e.borderTopLeftRadius) >= 12 && e.borderTopStyle !== "none";
    }).length;
    const titulos = [...document.querySelectorAll('[role="heading"],h1,h2,h3')].filter(visivel).length;
    return { altura: window.innerHeight + sobra, controles, rotulos, cartoes, titulos, nomeDe: undefined };
  });
  const palavras = texto.split(/\s+/).filter(Boolean).length;
  const longos = [...new Set(dom.rotulos.filter((r) => r && r.split(" ").filter((p) => /[\p{L}\p{N}]/u.test(p)).length > 3 && r.length < 90))];
  const total = Object.values(dom.controles).reduce((s, n) => s + n, 0);
  const contar = (re) => (texto.match(re) || []).length;
  return {
    tela: nome,
    telas: Math.round((dom.altura / 844) * 10) / 10,
    palavras,
    controles: total,
    porTipo: dom.controles,
    cartoes: dom.cartoes,
    titulos: dom.titulos,
    rotulosComMaisDe3Palavras: longos,
    repeticoes: { "dB(A)": contar(/dB\(A\)/g), "R$": contar(/R\$/g), ITBI: contar(/ITBI/g), IPTU: contar(/IPTU/g), "min a pé ou min": contar(/\bmin\b/g), "/10": contar(/\/ ?10\b/g) },
  };
}

const saida = [];
await abrir("/");
saida.push(await medir("Explorar (com caderno)"));
await page.getByRole("button", { name: /^Exemplo · Beira-mar/ }).first().click();
await esperar(() => rota() === "/dossie", "rota /dossie", 40_000);
await esperarTexto(page, "Destaques", 40_000);
await pausa(4000);
saida.push(await medir("Dossiê · Destaques"));
await page.getByRole("button", { name: "Ver auditoria detalhada em 10 pontos e simulador", exact: true }).click();
await pausa(1500);
saida.push(await medir("Dossiê · Destaques com os 10 pontos abertos"));
await page.getByRole("tab", { name: "Entorno", exact: true }).click();
await pausa(3000);
saida.push(await medir("Dossiê · Entorno"));
await page.getByRole("tab", { name: "Edifício", exact: true }).click();
await pausa(3000);
saida.push(await medir("Dossiê · Edifício"));
await abrir("/comparar");
saida.push(await medir("Comparar"));
await abrir("/visita");
saida.push(await medir("Visita · Preparar"));
await page.getByRole("button", { name: "Começar visita", exact: true }).click();
await pausa(2000);
saida.push(await medir("Visita · No imóvel"));
await abrir("/salvos");
saida.push(await medir("Salvos"));

await writeFile(path.join(PASTA_AUDITORIA, "metricas.json"), JSON.stringify(saida, null, 2), "utf8");
for (const m of saida) console.log(`${m.tela.padEnd(46)} ${String(m.telas).padStart(5)} telas  ${String(m.palavras).padStart(5)} palavras  ${String(m.controles).padStart(4)} controles  ${String(m.cartoes).padStart(3)} cartões  ${String(m.titulos).padStart(3)} títulos  ${m.rotulosComMaisDe3Palavras.length} rótulos longos  ${JSON.stringify(m.repeticoes)}`);
await browser.close();
