// Teste de ponta a ponta da v1.0 (Fatia 6), na web, com o Chromium do Playwright em contexto isolado.
//
//   npm run test:v1                       (servidor do Expo web em http://localhost:8087)
//   POC_URL=http://localhost:8094 npm run test:v1
//
// Se não houver servidor em POC_URL e o endereço for local, o script sobe `npx expo start --web --port <porta>` sozinho
// e o derruba no fim. Um servidor que já estava no ar nunca é derrubado.
//
// O que percorre (os números são os da ordem do arquiteto, Fatia 6, adaptados):
//   a) link de compra do ZAP em Casa Forte + texto do anúncio, anomalia de IPTU, "Encontrar o prédio", prédio real do
//      índice (Estrada do Encanamento, 719), "É este prédio", crédito 3 para 2, dossiê com a fonte "Prefeitura do Recife"
//      e sem R$/m² comparado ao ITBI;
//   b) sem rede (`context.setOffline(true)`): abrir o dossiê de novo e o cadastro oficial; depois recarregar a página
//      com toda requisição para fora do servidor do app abortada;
//   c) link `vivareal-torre-venda`: "Ainda não cobrimos Torre." e salvar no caderno;
//   d) recarregar: análises, vínculo e saldo persistem;
//   e) "Adicionar imóvel sem link" (segunda análise de compra) e Comparar as duas;
//   f) descartar: aviso "+1 crédito", saldo sobe uma vez só (toque duplo e descarte repetido depois de restaurar);
//   g) menu e pílula de créditos levam a /sobre-os-dados e /creditos;
//   h) a 375×812 e a 1280×900, em cada tela visitada: sem rolagem horizontal, sem controle dentro de controle, todo
//      controle com nome acessível, sem pageerror e sem erro de console;
//   i) capturas de cada etapa em out/v1/smoke/.
//
// Nada aqui toca o app: só o navegador. Cada execução usa um contexto novo (armazenamento vazio, 3 créditos).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const origem = new URL(base).origin;
const pastaDeCapturas = path.resolve(process.env.SMOKE_OUT || "out/v1/smoke");

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 900 };

// ——— Dados do teste ————————————————————————————————————————————————————————————————————————

const LINK_CASA_FORTE =
  "https://www.zapimoveis.com.br/imovel/venda-apartamento-2-quartos-com-piscina-casa-forte-recife-pe-66m2-id-2799999990/";

const TEXTO_CASA_FORTE = [
  "Apartamento com 2 quartos à venda, 66 m²",
  "Estrada do Encanamento - Casa Forte, Recife - PE",
  "Venda",
  "R$ 690.000",
  "Condomínio",
  "R$ 780",
  "IPTU",
  "R$ 154",
  "66 m²",
  "2 quartos",
  "8º andar",
].join("\n");

const ANOMALIA_IPTU = "IPTU sem indicação se o valor é mensal ou anual.";
const NOME_MANUAL = "Apartamento Boa Viagem · compra manual";

/** O link do imóvel de Torre é o do caso `vivareal-torre-venda` da fixture, lido na hora. */
async function linkDeTorre() {
  const fixture = JSON.parse(await readFile(path.resolve("tests/fixtures/anuncios-url.json"), "utf8"));
  const caso = fixture.casos.find((c) => c.id === "vivareal-torre-venda");
  assert(caso && typeof caso.entrada === "string", "caso vivareal-torre-venda não encontrado em tests/fixtures/anuncios-url.json");
  return caso.entrada;
}

/** O `meta.json` do índice cadastral, de onde as gavetas de fonte tiram as datas. */
async function metaDoIndice() {
  return JSON.parse(await readFile(path.resolve("src/dados/recife/indice/meta.json"), "utf8"));
}

/** "2026-10-20T16:17:16Z" ou "2026-10-03" → "20/10/2026". */
const diaBr = (iso) => iso.slice(0, 10).split("-").reverse().join("/");

// ——— Servidor ——————————————————————————————————————————————————————————————————————————————

async function responde(url) {
  try {
    const resposta = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return resposta.ok;
  } catch {
    return false;
  }
}

/** Devolve o processo do servidor quando foi este script que o subiu; `null` quando já havia um. */
async function garantirServidor() {
  if (await responde(`${base}/`)) {
    console.log(`Servidor já no ar em ${base}; não será derrubado.`);
    return null;
  }
  const url = new URL(base);
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error(`Nada responde em ${base}, e só subo servidor para endereço local.`);
  }
  const porta = url.port || "8087";
  console.log(`Subindo o Expo web na porta ${porta}…`);
  const processo = spawn("npx", ["expo", "start", "--web", "--port", porta], {
    stdio: ["ignore", "ignore", "pipe"],
    detached: true,
    env: { ...process.env, EXPO_NO_TELEMETRY: "1", BROWSER: "none" },
  });
  let ultimaSaida = "";
  processo.stderr.on("data", (parte) => (ultimaSaida = String(parte).slice(-400)));
  const limite = Date.now() + 240_000;
  while (Date.now() < limite) {
    if (await responde(`${base}/`)) return processo;
    if (processo.exitCode !== null) throw new Error(`O Expo web saiu antes de responder: ${ultimaSaida}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  derrubar(processo);
  throw new Error("O Expo web não respondeu em 240 s.");
}

function derrubar(processo) {
  if (!processo || processo.pid === undefined) return;
  try {
    process.kill(-processo.pid, "SIGTERM");
  } catch {
    /* já tinha saído */
  }
}

// ——— Utilidades do teste ———————————————————————————————————————————————————————————————————

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function esperar(condicao, descricao, ms = 10_000) {
  const limite = Date.now() + ms;
  let ultimoErro = null;
  while (Date.now() < limite) {
    try {
      if (await condicao()) return;
    } catch (e) {
      ultimoErro = e;
    }
    await pausa(100);
  }
  throw new Error(`Tempo esgotado esperando: ${descricao}${ultimoErro ? ` (${ultimoErro.message.split("\n")[0]})` : ""}`);
}

/**
 * O texto que a pessoa vê agora. O navegador mantém as telas anteriores empilhadas por baixo, marcadas com
 * `aria-hidden`; elas ficam de fora. Os `display` são devolvidos no mesmo instante, sem nenhuma pintura no meio.
 */
async function textoVisivel(page) {
  return page.evaluate(() => {
    const ocultos = [...document.querySelectorAll('[aria-hidden="true"]')];
    const guardados = ocultos.map((el) => [el, el.style.display]);
    for (const el of ocultos) el.style.display = "none";
    const texto = document.body.innerText;
    for (const [el, display] of guardados) el.style.display = display;
    return texto;
  });
}

const linhasVisiveis = async (page) =>
  (await textoVisivel(page)).split("\n").map((l) => l.trim()).filter(Boolean);

async function esperarTexto(page, trecho, ms = 10_000) {
  await esperar(async () => (await textoVisivel(page)).includes(trecho), `texto "${trecho}"`, ms);
}

async function esperarRota(page, rota, ms = 10_000) {
  await esperar(() => new URL(page.url()).pathname === rota, `rota ${rota} (estou em ${new URL(page.url()).pathname})`, ms);
}

/** Saldo lido do rótulo acessível da pílula de créditos do cabeçalho. */
async function saldoDoCabecalho(page) {
  const rotulo = await page.getByRole("button", { name: /^Carteira de créditos: \d+/ }).first().getAttribute("aria-label");
  const achado = /: (\d+) créditos?/.exec(rotulo ?? "");
  assert(achado, `pílula de créditos sem saldo legível: ${rotulo}`);
  return Number(achado[1]);
}

async function esperarSaldo(page, esperado) {
  let ultimo = null;
  await esperar(
    async () => {
      ultimo = await saldoDoCabecalho(page);
      return ultimo === esperado;
    },
    `saldo ${esperado} na pílula de créditos`,
  );
  return ultimo;
}

const valorDoCampo = (page, nome) => page.getByRole("textbox", { name: nome, exact: true }).inputValue();

// ——— Auditoria de cada tela (item h) ———————————————————————————————————————————————————————

const PAPEIS_COM_NOME = "button|link|tab|radio|checkbox|menuitem|switch|textbox|combobox|slider";
/** Linha da árvore de acessibilidade com o papel e sem nome entre aspas: `- button`, `- tab [selected]`. */
const SEM_NOME = new RegExp(`^\\s*- (${PAPEIS_COM_NOME})((?: \\[[^\\]]+\\])*)(?::.*)?$`);

/** Roda dentro da página. Devolve texto de cada problema achado. */
function auditoriaNaPagina() {
  const larguraDaTela = window.innerWidth;
  const descrever = (el) => {
    const papel = el.getAttribute("role") || el.tagName.toLowerCase();
    const nome = (el.getAttribute("aria-label") || el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 48);
    return `${el.tagName.toLowerCase()}[${papel}] "${nome}"`;
  };
  const escondido = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (n.getAttribute("aria-hidden") === "true") return true;
      if (getComputedStyle(n).display === "none") return true;
    }
    return getComputedStyle(el).visibility === "hidden";
  };
  /** O elemento passa da borda da tela, mas um ancestral que cabe na tela o recorta. */
  const recortado = (el) => {
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      if (["hidden", "clip", "auto", "scroll"].includes(getComputedStyle(a).overflowX)) {
        const r = a.getBoundingClientRect();
        if (r.right <= larguraDaTela + 1 && r.left >= -1) return true;
      }
    }
    return false;
  };

  const problemas = [];

  const raiz = document.scrollingElement || document.documentElement;
  if (raiz.scrollWidth > larguraDaTela + 1) problemas.push(`rolagem horizontal da página: ${raiz.scrollWidth} px em ${larguraDaTela} px`);
  if (document.body.scrollWidth > larguraDaTela + 1) problemas.push(`rolagem horizontal do body: ${document.body.scrollWidth} px em ${larguraDaTela} px`);

  let fora = 0;
  for (const el of document.querySelectorAll("#root *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= larguraDaTela + 1 && r.left >= -1) continue;
    if (escondido(el) || recortado(el)) continue;
    if (fora++ < 6) problemas.push(`elemento fora da tela (${Math.round(r.left)}→${Math.round(r.right)} de ${larguraDaTela}): ${descrever(el)}`);
  }
  if (fora > 6) problemas.push(`… e mais ${fora - 6} elementos fora da tela`);

  const INTERATIVO = 'button, a[href], input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="radio"], [role="checkbox"], [role="switch"], [role="menuitem"]';
  const CONTENTOR = 'button, a[href], [role="button"], [role="link"], [role="tab"], [role="radio"], [role="checkbox"], [role="switch"], [role="menuitem"]';
  for (const pai of document.querySelectorAll(CONTENTOR)) {
    const filho = pai.querySelector(INTERATIVO);
    if (filho && !escondido(pai)) problemas.push(`controle dentro de controle: ${descrever(pai)} contém ${descrever(filho)}`);
  }
  // Estado exposto (ARIA): radio, caixa e interruptor precisam de aria-checked; aba, de aria-selected.
  for (const el of document.querySelectorAll('[role="radio"], [role="checkbox"], [role="switch"]')) {
    if (!el.hasAttribute("aria-checked") && !escondido(el)) problemas.push(`sem aria-checked: ${descrever(el)}`);
  }
  for (const el of document.querySelectorAll('[role="tab"]')) {
    if (!el.hasAttribute("aria-selected") && !escondido(el)) problemas.push(`sem aria-selected: ${descrever(el)}`);
  }
  return problemas;
}

/** `{ etapa, texto }` de cada problema achado pela auditoria. */
const problemasDaAuditoria = [];
const avisosDeAlvo = new Map();

/** O mesmo problema em várias etapas aparece uma vez, com a lista de onde ocorreu. */
function resumirProblemas(lista) {
  const grupos = new Map();
  for (const { etapa, texto } of lista) grupos.set(texto, [...(grupos.get(texto) ?? []), etapa]);
  return [...grupos].map(([texto, etapas]) => {
    const telas = [...new Set(etapas.map((e) => e.replace(/ @\d+$/, "")))];
    return `${texto}  [${telas.length} tela(s): ${telas.slice(0, 4).join(", ")}${telas.length > 4 ? ", …" : ""}]`;
  });
}
let numeroDaEtapa = 0;

/** Mede (sem reprovar) os controles com menos de 44 px de lado. O toque na web também conta `hitSlop`; este número é só um indício. */
function alvosPequenosNaPagina() {
  const lista = [];
  const escondido = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (n.getAttribute("aria-hidden") === "true" || getComputedStyle(n).display === "none") return true;
    }
    return getComputedStyle(el).visibility === "hidden";
  };
  for (const el of document.querySelectorAll('button, a[href], [role="button"], [role="link"], [role="tab"], [role="radio"], [role="checkbox"], [role="menuitem"]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width >= 43.5 && r.height >= 43.5) continue;
    if (escondido(el)) continue;
    const nome = (el.getAttribute("aria-label") || el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 40);
    lista.push(`${nome || "(sem nome)"} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  return lista;
}

async function auditar(page, rotulo) {
  const achados = await page.evaluate(auditoriaNaPagina);
  const arvore = await page.locator("body").ariaSnapshot();
  for (const linha of arvore.split("\n")) {
    if (SEM_NOME.test(linha)) achados.push(`controle sem nome acessível: ${linha.trim()}`);
  }
  for (const texto of achados) problemasDaAuditoria.push({ etapa: rotulo, texto });
  for (const a of await page.evaluate(alvosPequenosNaPagina)) avisosDeAlvo.set(a, (avisosDeAlvo.get(a) ?? 0) + 1);
  return achados.length;
}

/** Cada tela visitada: auditoria e captura a 375×812 e a 1280×900. Termina no tamanho de celular. */
async function etapa(page, nome) {
  numeroDaEtapa += 1;
  const prefixo = String(numeroDaEtapa).padStart(2, "0");
  await pausa(350);
  let total = 0;
  for (const viewport of [MOBILE, DESKTOP]) {
    await page.setViewportSize(viewport);
    await pausa(350);
    total += await auditar(page, `${prefixo}-${nome} @${viewport.width}`);
    await page.screenshot({ path: path.join(pastaDeCapturas, `${prefixo}-${nome}-${viewport.width}.png`) });
  }
  await page.setViewportSize(MOBILE);
  await pausa(250);
  console.log(`  etapa ${prefixo} ${nome}: ${total === 0 ? "sem problemas" : `${total} problema(s)`}`);
}

/**
 * O auditor precisa conseguir reprovar. Monta na página um controle dentro de controle, um botão sem nome, um radio sem
 * aria-checked, uma aba sem aria-selected e uma caixa mais larga que a tela; confere que cada um foi apontado e desmonta tudo.
 */
async function autotesteDoAuditor(page) {
  await page.evaluate((largura) => {
    const raiz = document.getElementById("root");
    const caixa = document.createElement("div");
    caixa.id = "autoteste-do-auditor";
    caixa.style.cssText = "position:absolute;top:0;left:0;z-index:99999;";
    const externo = document.createElement("button");
    externo.textContent = "externo";
    const interno = document.createElement("button");
    interno.textContent = "interno";
    externo.appendChild(interno);
    const semNome = document.createElement("button");
    const radio = document.createElement("div");
    radio.setAttribute("role", "radio");
    radio.setAttribute("tabindex", "0");
    radio.setAttribute("aria-label", "radio de teste");
    const aba = document.createElement("div");
    aba.setAttribute("role", "tab");
    aba.setAttribute("tabindex", "0");
    aba.setAttribute("aria-label", "aba de teste");
    const larga = document.createElement("div");
    larga.style.cssText = `width:${largura + 240}px;height:6px;background:red;`;
    larga.textContent = "larga";
    caixa.append(externo, semNome, radio, aba, larga);
    raiz.appendChild(caixa);
  }, MOBILE.width);
  const achados = await page.evaluate(auditoriaNaPagina);
  const arvore = await page.locator("body").ariaSnapshot();
  const semNome = arvore.split("\n").filter((linha) => SEM_NOME.test(linha));
  await page.evaluate(() => document.getElementById("autoteste-do-auditor")?.remove());
  const junto = achados.join("\n");
  assert.match(junto, /controle dentro de controle/, "auditor: controle dentro de controle");
  assert.match(junto, /sem aria-checked/, "auditor: radio sem aria-checked");
  assert.match(junto, /sem aria-selected/, "auditor: aba sem aria-selected");
  assert.match(junto, /rolagem horizontal|fora da tela/, "auditor: estouro horizontal");
  assert(semNome.length >= 1, "auditor: botão sem nome");
  console.log("  autoteste do auditor: apontou controle dentro de controle, botão sem nome, radio sem aria-checked, aba sem aria-selected e estouro horizontal");
}

// ——— Principal —————————————————————————————————————————————————————————————————————————————

await rm(pastaDeCapturas, { recursive: true, force: true });
await mkdir(pastaDeCapturas, { recursive: true });

const servidor = await garantirServidor();
const browser = await chromium.launch({ headless: true });
const errosDaPagina = [];
const externos = [];
let correu = false;

try {
  const context = await browser.newContext({ viewport: MOBILE, locale: "pt-BR" });
  context.on("request", (r) => {
    const url = r.url();
    if (/^https?:/.test(url) && new URL(url).origin !== origem) externos.push(url);
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on("pageerror", (e) => errosDaPagina.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errosDaPagina.push(`console.error: ${m.text()}`);
  });

  try {
    // ——— a) link de compra em Casa Forte ————————————————————————————————————————————————

    console.log("a) Casa Forte: link, texto, anomalia, prédio, crédito e dossiê");
    await page.goto(`${base}/`, { waitUntil: "load", timeout: 180_000 });
    await page.getByRole("button", { name: "Colar link", exact: true }).waitFor({ timeout: 180_000 });
    assert.equal(await saldoDoCabecalho(page), 3, "o contexto novo começa com 3 créditos");
    await autotesteDoAuditor(page);
    await etapa(page, "explorar-vazio");

    await page.getByRole("textbox", { name: "Link do anúncio do imóvel" }).fill(LINK_CASA_FORTE);
    await page.getByRole("button", { name: "Gerar Dossiê", exact: true }).click();
    await esperarRota(page, "/ler");
    await esperarTexto(page, "ZAP Imóveis · código 2799999990");
    await esperarTexto(page, "Casa Forte · com cadastro");
    await etapa(page, "ler-link");

    await page.getByRole("textbox", { name: "Texto do anúncio" }).fill(TEXTO_CASA_FORTE);
    await page.getByRole("button", { name: "Ler texto", exact: true }).click();
    await esperarTexto(page, ANOMALIA_IPTU);
    await esperarTexto(page, "R$ 690.000 · Cond. R$ 780/mês · IPTU R$ 154 · período não informado");
    assert.equal(await valorDoCampo(page, "Rua"), "Estrada do Encanamento");
    assert.equal(await valorDoCampo(page, "Preço de venda (R$)"), "690.000");
    assert.equal(await valorDoCampo(page, "Condomínio (R$ por mês)"), "780");
    assert.equal(await valorDoCampo(page, "IPTU (R$)"), "154");
    assert.equal(await valorDoCampo(page, "Área (m²)"), "66");
    assert.equal(await valorDoCampo(page, "Quartos"), "2");
    assert.equal(await valorDoCampo(page, "Andar"), "8");
    assert.equal(await page.getByRole("radio", { name: "Comprar", exact: true }).isChecked(), true, "modalidade Comprar");
    await etapa(page, "ler-texto-anomalia-iptu");

    await page.getByRole("button", { name: "Encontrar o prédio", exact: true }).click();
    await esperarRota(page, "/predio");
    await esperarTexto(page, "É este o prédio?");
    await esperarTexto(page, "Estrada do Encanamento, 719");
    await esperarTexto(page, "Cadastro imobiliário · Prefeitura do Recife");
    await esperarTexto(page, "Usa 1 crédito.");
    assert.equal(await saldoDoCabecalho(page), 3, "o crédito só sai ao confirmar o prédio");
    await etapa(page, "predio");

    await page.getByRole("button", { name: "É este prédio", exact: true }).click();
    await esperarRota(page, "/dossie");
    await esperarTexto(page, "Lote confirmado ✓");
    await esperarSaldo(page, 2);
    console.log("  saldo de créditos: 3 → 2");
    await etapa(page, "dossie-destaques");

    // Nenhuma linha do dossiê põe R$/m² (ou "por m²") ao lado do ITBI: a área do ITBI inclui área comum.
    const semPorM2ComITBI = async (aba) => {
      const linhas = await linhasVisiveis(page);
      const comITBI = linhas.filter((l) => /ITBI|avaliaç(?:ão|ões) fiscais?|mediana fiscal/i.test(l));
      assert(comITBI.length > 0, `aba ${aba}: nenhuma linha de ITBI para conferir`);
      const comM2 = comITBI.filter((l) => /m²/i.test(l));
      assert.deepEqual(comM2, [], `aba ${aba}: linha de ITBI com m²`);
      return comITBI;
    };
    const linhasITBI = await semPorM2ComITBI("Destaques");
    assert(
      linhasITBI.some((l) => /^\d+% (acima|abaixo) da mediana das avaliações fiscais de unidades deste prédio/.test(l)),
      "posição do preço contra o valor por unidade do ITBI do prédio",
    );

    // Toque num número do cadastro abre a gaveta da fonte: "IPTU 2026 · Prefeitura do Recife · ODbL".
    await page.getByRole("button", { name: /IPTU 2026 no prédio\. Ver fonte/ }).click();
    await page.getByRole("dialog", { name: "IPTU 2026 · Prefeitura do Recife · ODbL" }).waitFor();
    const gavetaDaFonte = await page.getByRole("dialog").last().innerText();
    assert.match(gavetaDaFonte, /Prefeitura da Cidade do Recife/);
    assert.match(gavetaDaFonte, /ODbL/);
    const iptu = (await metaDoIndice()).fontes.find((f) => f.chave === "iptu_2026");
    assert(iptu, "fonte iptu_2026 ausente do meta.json");
    assert.match(gavetaDaFonte, new RegExp(`Base modificada em\\s+${diaBr(iptu.modificadoEm)}`), "data de modificação do meta.json");
    assert.match(gavetaDaFonte, new RegExp(`Consultada pelo Vereda em\\s+${diaBr(iptu.consultadoEm)}`), "data de consulta do meta.json");
    await etapa(page, "dossie-fonte-iptu");
    await page.keyboard.press("Escape");
    await esperar(async () => (await page.getByRole("dialog").count()) === 0, "Esc fecha a gaveta da fonte");

    // O cadastro oficial: um fato com a Prefeitura do Recife como origem.
    await page.getByRole("link", { name: "Cadastro oficial", exact: true }).click();
    await page.getByRole("dialog", { name: "Cadastro oficial" }).waitFor();
    const gavetaDoCadastro = await page.getByRole("dialog", { name: "Cadastro oficial" }).innerText();
    assert.match(gavetaDoCadastro, /Prefeitura do Recife/);
    assert.match(gavetaDoCadastro, /registro oficial · IPTU 2026/);
    assert.match(gavetaDoCadastro, /Sobrado Gilberto Freyre/);
    await etapa(page, "dossie-cadastro-oficial");
    await page.keyboard.press("Escape");
    await esperar(async () => (await page.getByRole("dialog").count()) === 0, "Esc fecha a gaveta do cadastro");

    await page.getByRole("tab", { name: "Entorno", exact: true }).click();
    await esperarTexto(page, "Preço e avaliação fiscal");
    await semPorM2ComITBI("Entorno");
    await etapa(page, "dossie-entorno");
    await page.getByRole("tab", { name: "Edifício", exact: true }).click();
    await esperar(async () => (await page.getByRole("tab", { name: "Edifício", exact: true }).getAttribute("aria-selected")) === "true", "aba Edifício");
    await etapa(page, "dossie-edificio");
    await page.getByRole("tab", { name: "Destaques", exact: true }).click();

    // Preparar visita: a ação principal do dossiê leva à aba Visita com esta análise.
    await page.getByRole("button", { name: "Preparar visita", exact: true }).click();
    await esperarRota(page, "/visita");
    await esperarTexto(page, "Prepare sua visita.");
    await etapa(page, "visita-preparar");

    // ——— b) sem rede ————————————————————————————————————————————————————————————————————

    console.log("b) sem rede: abrir o dossiê de novo e recarregar");
    await context.setOffline(true);
    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await esperarRota(page, "/");
    const cartaoCasaForte = page.getByRole("button", { name: /^Apartamento 2 quartos · Casa Forte\./ });
    await cartaoCasaForte.waitFor();
    await cartaoCasaForte.click();
    await esperarRota(page, "/dossie");
    await esperarTexto(page, "Lote confirmado ✓");
    await esperarTexto(page, "Estrada do Encanamento, 719");
    await page.getByRole("link", { name: "Cadastro oficial", exact: true }).click();
    await page.getByRole("dialog", { name: "Cadastro oficial" }).waitFor();
    assert.match(await page.getByRole("dialog", { name: "Cadastro oficial" }).innerText(), /Prefeitura do Recife/);
    await etapa(page, "dossie-sem-rede");
    await page.keyboard.press("Escape");

    // A recarga de página sem rede nenhuma falha no navegador, porque o HTML e o bundle vêm do servidor e o app não
    // registra service worker. Só registro: o que o app precisa (índice, análises, carteira) está no aparelho.
    const recargaSemRede = await page.reload({ waitUntil: "load", timeout: 15_000 }).then(
      () => "carregou",
      (e) => `falhou no navegador (${e.message.split("\n")[0].replace(/^page\.reload: /, "")})`,
    );
    console.log(`  recarga com setOffline(true): ${recargaSemRede}`);
    await context.setOffline(false);

    // A recarga que importa para o app: rede externa fechada, só o servidor do app responde.
    const bloqueadas = [];
    await context.route(
      (url) => /^https?:$/.test(url.protocol) && url.origin !== origem,
      (rota) => {
        bloqueadas.push(rota.request().url());
        return rota.abort("internetdisconnected");
      },
    );
    await page.goto(`${base}/dossie`, { waitUntil: "load", timeout: 120_000 });
    await esperarTexto(page, "Lote confirmado ✓", 30_000);
    await esperarTexto(page, "Estrada do Encanamento, 719");
    await page.getByRole("link", { name: "Cadastro oficial", exact: true }).click();
    await page.getByRole("dialog", { name: "Cadastro oficial" }).waitFor();
    assert.match(await page.getByRole("dialog", { name: "Cadastro oficial" }).innerText(), /Prefeitura do Recife/);
    await page.keyboard.press("Escape");
    await esperarSaldo(page, 2);
    assert.deepEqual(bloqueadas, [], "a recarga do dossiê tentou falar com um servidor de fora");
    await context.unrouteAll({ behavior: "wait" });
    console.log("  dossiê recarregado com a rede externa fechada: tudo no aparelho, nenhuma requisição para fora");
    await etapa(page, "dossie-recarregado");

    // ——— c) fora de cobertura ————————————————————————————————————————————————————————

    console.log("c) Torre: fora da cobertura");
    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await esperarRota(page, "/");
    await page.getByRole("textbox", { name: "Link do anúncio do imóvel" }).fill(await linkDeTorre());
    await page.getByRole("button", { name: "Gerar Dossiê", exact: true }).click();
    await esperarRota(page, "/ler");
    await esperarTexto(page, "Ainda não cobrimos Torre.");
    await esperarTexto(page, "A leitura deste anúncio não consumiu crédito.");
    assert.equal(await saldoDoCabecalho(page), 2, "fora da cobertura não gasta crédito");
    await etapa(page, "ler-torre-fora-de-cobertura");
    await page.getByRole("button", { name: "Salvar no caderno", exact: true }).click();
    await esperarRota(page, "/");
    await esperarTexto(page, "Análises Recentes");
    await esperar(async () => (await page.getByRole("button", { name: /Torre/ }).count()) > 0, "cartão de Torre no Explorar");
    await etapa(page, "explorar-duas-analises");

    // ——— d) recarregar ——————————————————————————————————————————————————————————————————

    console.log("d) recarregar: análises, vínculo e saldo persistem");
    await page.reload({ waitUntil: "load", timeout: 120_000 });
    await esperarTexto(page, "Análises Recentes", 60_000);
    await esperar(async () => (await page.getByRole("button", { name: /^Apartamento 2 quartos · Casa Forte\./ }).count()) === 1, "cartão de Casa Forte depois da recarga");
    await esperar(async () => (await page.getByRole("button", { name: /Torre/ }).count()) >= 1, "cartão de Torre depois da recarga");
    const textoAposRecarga = await textoVisivel(page);
    assert.match(textoAposRecarga, /Prédio confirmado · \d{4}/, "o vínculo confirmado persistiu");
    assert.match(textoAposRecarga, /Estrada do Encanamento, 719/);
    assert.equal(await saldoDoCabecalho(page), 2, "o saldo persistiu");
    await etapa(page, "explorar-apos-recarga");
    await page.getByRole("button", { name: /^Apartamento 2 quartos · Casa Forte\./ }).click();
    await esperarRota(page, "/dossie");
    await esperarTexto(page, "Lote confirmado ✓");

    // ——— e) segunda análise de compra e Comparar ——————————————————————————————————————————

    console.log("e) segunda análise de compra pelo editor e comparação");
    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await esperarRota(page, "/");
    await page.getByRole("button", { name: "Adicionar imóvel sem link", exact: true }).click();
    await esperarRota(page, "/editar");
    await esperarTexto(page, "Adicionar imóvel");
    await page.getByRole("textbox", { name: "Nome da análise", exact: true }).fill(NOME_MANUAL);
    await page.getByRole("radio", { name: "Comprar", exact: true }).click();
    await page.getByRole("button", { name: "Bairro", exact: true }).click();
    await page.getByRole("textbox", { name: "Buscar bairro", exact: true }).fill("Boa Viagem");
    await page.getByRole("button", { name: "Boa Viagem", exact: true }).click();
    await page.getByRole("textbox", { name: "Preço de venda (R$)", exact: true }).fill("540000");
    await page.getByRole("textbox", { name: "Condomínio (R$ por mês)", exact: true }).fill("650");
    await page.getByRole("textbox", { name: "IPTU (R$)", exact: true }).fill("120");
    await page.getByRole("radio", { name: "Mês", exact: true }).click();
    await page.getByRole("textbox", { name: "Área (m²)", exact: true }).fill("58");
    await page.getByRole("textbox", { name: "Quartos", exact: true }).fill("2");
    await etapa(page, "editar-imovel-sem-link");
    await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
    await esperarRota(page, "/salvos");
    await esperarTexto(page, "Seus imóveis salvos.");
    await esperar(async () => (await page.getByRole("link", { name: `Abrir ${NOME_MANUAL}`, exact: true }).count()) === 1, "análise manual em Salvos");
    await etapa(page, "salvos-tres-analises");

    await page.getByRole("link", { name: "Comparar", exact: true }).click();
    await esperarRota(page, "/comparar");
    await esperarTexto(page, "Compare suas opções.");
    await page.getByRole("radio", { name: "Comprar", exact: true }).click();

    const nomeDoSlot = async (slot) => {
      const rotulo = await page.getByRole("button", { name: new RegExp(`^Imóvel ${slot}: `) }).getAttribute("aria-label");
      return rotulo.replace(new RegExp(`^Imóvel ${slot}: `), "").replace(/\. Trocar imóvel$/, "");
    };
    const escolherNoSlot = async (slot, comecaCom) => {
      await page.getByRole("button", { name: new RegExp(`^Imóvel ${slot}: `) }).click();
      await page.getByRole("dialog", { name: `Escolher imóvel ${slot}` }).waitFor();
      await page.getByRole("radio", { name: new RegExp(`^${comecaCom}`) }).click();
      await esperar(async () => (await page.getByRole("dialog").count()) === 0, "gaveta de escolha fecha");
    };
    await page.getByRole("button", { name: /^Imóvel 1: / }).waitFor();
    if (!(await nomeDoSlot(1)).startsWith("Apartamento 2 quartos · Casa Forte")) await escolherNoSlot(1, "Apartamento 2 quartos · Casa Forte");
    if ((await nomeDoSlot(2)) !== NOME_MANUAL) await escolherNoSlot(2, NOME_MANUAL);
    assert.match(await nomeDoSlot(1), /^Apartamento 2 quartos · Casa Forte/);
    assert.equal(await nomeDoSlot(2), NOME_MANUAL);

    // Compra: a diferença é do preço anunciado; o preço nunca entra nas despesas mensais (só condomínio e IPTU conhecidos).
    await esperarTexto(page, "de diferença no preço anunciado");
    await esperarTexto(page, "Despesas mensais conhecidas");
    const custoComparado = await textoVisivel(page);
    assert.match(custoComparado, /R\$ 150\.000\nde diferença no preço anunciado/, "540.000 contra 690.000");
    assert.match(custoComparado, /1 parcela a confirmar/, "o IPTU sem periodicidade da compra de Casa Forte fica a confirmar");
    assert.match(custoComparado, /Despesas mensais conhecidas\nR\$ 780\/mês/, "Casa Forte: só o condomínio entra (IPTU sem período fica fora)");
    assert.match(custoComparado, /R\$ 770\/mês/, "Boa Viagem: condomínio 650 + IPTU 120 por mês");
    await etapa(page, "comparar-custo");
    await page.getByRole("tab", { name: "Espaço", exact: true }).click();
    await esperarTexto(page, "Preço anunciado por m²");
    await etapa(page, "comparar-espaco");
    await page.getByRole("tab", { name: "Entorno", exact: true }).click();
    await esperarTexto(page, "Prédio não confirmado");
    await etapa(page, "comparar-entorno");

    // ——— f) descartar ——————————————————————————————————————————————————————————————————

    console.log("f) descartar: +1 crédito uma vez só");
    await page.getByRole("link", { name: "Meus salvos", exact: true }).click();
    await esperarRota(page, "/salvos");
    await esperar(async () => (await page.getByRole("link", { name: `Descartar ${NOME_MANUAL}`, exact: true }).count()) === 1, "link Descartar");
    assert.equal(await saldoDoCabecalho(page), 2);
    await page.getByRole("link", { name: `Descartar ${NOME_MANUAL}`, exact: true }).click();
    await page.getByRole("dialog", { name: "Descartar imóvel" }).waitFor();
    await esperarTexto(page, "Seu feedback concede +1 crédito na carteira.");
    await page.getByRole("radio", { name: "Preço ou taxas acima do orçamento", exact: true }).click();
    await etapa(page, "descartar-gaveta");
    // Toque duplo no botão: o descarte vale um crédito, não dois.
    await page.getByRole("button", { name: "Descartar imóvel", exact: true }).dblclick();
    await page.getByRole("status").filter({ hasText: "+1 crédito" }).first().waitFor({ timeout: 8000 });
    await esperarSaldo(page, 3);
    await pausa(1200);
    assert.equal(await saldoDoCabecalho(page), 3, "o saldo sobe uma vez só (2 → 3), não duas");
    console.log('  aviso "+1 crédito" visto; saldo 2 → 3 depois de um toque duplo');
    await esperarTexto(page, "Descartados");
    await etapa(page, "salvos-com-descartado");

    // Restaurar e descartar de novo: o crédito daquela análise já foi concedido.
    await page.getByRole("button", { name: `Restaurar ${NOME_MANUAL}`, exact: true }).click();
    await esperarTexto(page, "Imóvel restaurado");
    await page.getByRole("link", { name: `Descartar ${NOME_MANUAL}`, exact: true }).click();
    await page.getByRole("dialog", { name: "Descartar imóvel" }).waitFor();
    await esperarTexto(page, "O crédito deste descarte já foi concedido.");
    await page.getByRole("radio", { name: "Outro motivo", exact: true }).click();
    await page.getByRole("button", { name: "Descartar imóvel", exact: true }).click();
    await esperar(async () => (await page.getByRole("dialog").count()) === 0, "gaveta de descarte fecha");
    await pausa(800);
    assert.equal(await page.getByRole("status").filter({ hasText: "+1 crédito" }).count(), 0, "o segundo descarte não avisa crédito");
    assert.equal(await saldoDoCabecalho(page), 3, "descartar de novo a mesma análise não credita outra vez");
    console.log("  restaurar e descartar de novo: saldo continua 3");

    // ——— g) menu e pílula de créditos ——————————————————————————————————————————————————

    console.log("g) menu e pílula de créditos");
    await page.getByRole("button", { name: "Menu de navegação", exact: true }).click();
    await page.getByRole("menuitem", { name: "Sobre os dados", exact: true }).waitFor();
    await etapa(page, "menu-aberto");
    await page.getByRole("menuitem", { name: "Sobre os dados", exact: true }).click();
    await esperarRota(page, "/sobre-os-dados");
    await esperarTexto(page, "Contém dados da Prefeitura do Recife, disponibilizados sob a Open Database License (ODbL).");
    await esperarTexto(page, "O que ainda não cobrimos");
    await etapa(page, "sobre-os-dados");
    await page.keyboard.press("Escape");
    await esperar(() => new URL(page.url()).pathname !== "/sobre-os-dados", "Esc fecha Sobre os dados");

    await page.getByRole("button", { name: /^Carteira de créditos: \d+/ }).first().click();
    await esperarRota(page, "/creditos");
    await esperarTexto(page, "Saldo disponível");
    await esperarTexto(page, "Na versão de teste, créditos não têm valor em dinheiro.");
    const extrato = await textoVisivel(page);
    assert.equal((extrato.match(/Descarte informado/g) ?? []).length, 1, "o extrato tem um único descarte");
    assert.equal((extrato.match(/Prédio confirmado/g) ?? []).length, 1, "o extrato tem uma única confirmação de prédio");
    assert.match(extrato, /Cota inicial/);
    await etapa(page, "creditos");
    await page.keyboard.press("Escape");
    await esperar(() => new URL(page.url()).pathname !== "/creditos", "Esc fecha a carteira");

    await page.getByRole("button", { name: "Menu de navegação", exact: true }).click();
    await page.getByRole("menuitem", { name: /^Carteira de créditos/ }).click();
    await esperarRota(page, "/creditos");
    await page.keyboard.press("Escape");
    await esperar(() => new URL(page.url()).pathname !== "/creditos", "Esc fecha a carteira (menu)");

    await page.getByRole("button", { name: "Menu de navegação", exact: true }).click();
    await page.getByRole("menuitem", { name: "Dossiês de exemplo", exact: true }).click();
    await esperarRota(page, "/exemplos/boa-viagem");
    await etapa(page, "exemplo-boa-viagem");

    // ——— h) e i) ————————————————————————————————————————————————————————————————————————

    console.log("h) conferência final");
    const externosDeDados = externos.filter((u) => /dados\.recife\.pe\.gov\.br/.test(u));
    assert.deepEqual(externosDeDados, [], "o app não pode chamar o portal de dados do Recife");
    assert.deepEqual(resumirProblemas(problemasDaAuditoria), [], "auditoria das telas");
    assert.deepEqual(errosDaPagina, [], `erros da página:\n${errosDaPagina.join("\n")}`);
    correu = true;
  } catch (erro) {
    await page.screenshot({ path: path.join(pastaDeCapturas, "FALHA.png") }).catch(() => undefined);
    console.error(`\nFALHOU em ${new URL(page.url()).pathname}`);
    console.error((await textoVisivel(page).catch(() => "")).split("\n").slice(0, 40).join("\n"));
    if (problemasDaAuditoria.length) console.error(`\nAuditoria até aqui:\n${resumirProblemas(problemasDaAuditoria).join("\n")}`);
    if (errosDaPagina.length) console.error(`\nErros da página até aqui:\n${errosDaPagina.join("\n")}`);
    throw erro;
  }

  if (avisosDeAlvo.size > 0) {
    console.log("\nControles com menos de 44 px de lado (medida do elemento; não reprova, `hitSlop` não entra):");
    for (const [alvo, vezes] of [...avisosDeAlvo].sort()) console.log(`  ${alvo} (${vezes}×)`);
  }
  const hostsExternos = [...new Set(externos.map((u) => new URL(u).host))];
  console.log(`\nRequisições para fora do servidor do app: ${externos.length === 0 ? "nenhuma" : hostsExternos.join(", ")}`);
  console.log(`Etapas auditadas a 375×812 e 1280×900: ${numeroDaEtapa}. Capturas em ${path.relative(process.cwd(), pastaDeCapturas)}/`);
  console.log(
    "\nV1: link de compra, anomalia de IPTU, prédio real do índice, crédito 3→2, fonte da Prefeitura, sem R$/m² com ITBI, " +
      "dossiê sem rede, Torre fora da cobertura, persistência, segunda análise, comparação, descarte (+1 uma vez), menu e créditos passaram.",
  );
} finally {
  await browser.close();
  if (servidor) derrubar(servidor);
}
process.exit(correu ? 0 : 1);
