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
//   a2) ALUGUEL: link `zap-casa-forte-aluguel` + texto `zap-like-iptu-sem-periodo` (as duas fixtures, lidas na hora),
//      anomalia de IPTU visível, prédio achado pela busca de rua e número com o primeiro edifício de
//      `src/dados/recife/indice/casa-forte.json` (lido na hora), confirmação (crédito 2 para 1) e dossiê com um fato da
//      "Prefeitura do Recife";
//   b) sem rede: com as duas análises já abertas, `context.setOffline(true)` DEPOIS de a página carregada e navegação
//      entre Explorar, dossiês, abas do dossiê, Comparar, Visita e o cadastro oficial, tudo com o índice local. A recarga
//      de página sem rede NÃO é testada: na web o HTML e o bundle vêm do servidor e o app não registra service worker, então
//      ela não é suportada. O que se recarrega é o dossiê com toda requisição para fora do servidor do app abortada;
//   c) link `vivareal-torre-venda`: "Ainda não cobrimos Torre." e salvar no caderno;
//   d) recarregar: análises, vínculos e saldo persistem; filtro Todos/Alugar/Comprar;
//   e) "Adicionar imóvel sem link" (segunda análise de compra) e Comparar as duas de compra;
//   e2) "Adicionar imóvel sem link" (segunda análise de ALUGUEL) e Comparar as duas de aluguel;
//   f) descartar: só imóvel que usou crédito rende "+1 crédito" (toque duplo e descarte repetido depois de restaurar
//      creditam uma vez só); o descartado que nunca usou crédito não rende nada e a gaveta o diz;
//   g) menu e pílula de créditos levam a /sobre-os-dados e /creditos;
//   g2) caderno ilegível: com JSON inválido na chave `vereda-analises-v2` o app mostra o erro (Explorar, Dossiê, Comparar,
//      Visita, salvar a leitura e o editor), nenhuma gravação toca a chave (byte a byte igual) e o texto original fica
//      copiado à parte;
//   h) a 375×812 e a 1280×900, em cada tela visitada: sem rolagem horizontal, sem controle dentro de controle, todo
//      controle com nome acessível, gaveta e folha de até 640 px e centradas a 1280 px, sem pageerror e sem erro de console;
//   i) capturas de cada etapa em out/v1/smoke/.
// Também passa pela Visita (aba Preparar) e pelo dossiê de exemplo do menu, e confere estados expostos ao leitor de tela
// (aria-checked, aria-selected, aria-expanded).
//
// Roda na web, em Chromium: não substitui teste em celular, WebView dos portais nem leitor de tela nativo.
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
const NOME_ALUGUEL_MANUAL = "Apartamento Boa Viagem · aluguel manual";
/** O nome que a leitura dá à compra de Casa Forte (tipologia, quartos e bairro do texto colado). */
const NOME_COMPRA_CASA_FORTE = "Apartamento 2 quartos · Casa Forte";
/** O mesmo, para o aluguel de Casa Forte: o texto da fixture traz 3 quartos. */
const NOME_ALUGUEL_CASA_FORTE = "Apartamento 3 quartos · Casa Forte";

/** O que a tela do caderno ilegível diz (o começo da mensagem de `src/estado/Analises.tsx`). */
const ERRO_DO_CADERNO = "Não foi possível abrir seu caderno neste aparelho. Nada foi apagado nem gravado por cima";
/** Texto que não é JSON, no lugar do caderno (chave `vereda-analises-v2`). */
const CADERNO_CORROMPIDO = '[{"versao":2,"id":"imovel-1","nome":"Apartamento Jardim","declarados":{"preco":';

/** O link do imóvel de Torre é o do caso `vivareal-torre-venda` da fixture, lido na hora. */
async function linkDeTorre() {
  const fixture = JSON.parse(await readFile(path.resolve("tests/fixtures/anuncios-url.json"), "utf8"));
  const caso = fixture.casos.find((c) => c.id === "vivareal-torre-venda");
  assert(caso && typeof caso.entrada === "string", "caso vivareal-torre-venda não encontrado em tests/fixtures/anuncios-url.json");
  return caso.entrada;
}

/** O caso `zap-casa-forte-aluguel` da fixture de links (o link vem em `entrada`), lido na hora. */
async function casoDoLinkDeAluguel() {
  const fixture = JSON.parse(await readFile(path.resolve("tests/fixtures/anuncios-url.json"), "utf8"));
  const caso = fixture.casos.find((c) => c.id === "zap-casa-forte-aluguel");
  assert(caso && typeof caso.entrada === "string", "caso zap-casa-forte-aluguel não encontrado em tests/fixtures/anuncios-url.json");
  return caso;
}

/** O caso `zap-like-iptu-sem-periodo` da fixture de textos (o texto vem em `entrada`, os valores em `esperado.campos`), lido na hora. */
async function casoDoTextoDeAluguel() {
  const fixture = JSON.parse(await readFile(path.resolve("tests/fixtures/anuncios-texto.json"), "utf8"));
  const caso = fixture.casos.find((c) => c.id === "zap-like-iptu-sem-periodo");
  assert(caso && typeof caso.entrada === "string", "caso zap-like-iptu-sem-periodo não encontrado em tests/fixtures/anuncios-texto.json");
  return caso;
}

/** O primeiro edifício de `casa-forte.json`, lido na hora: o prédio que a busca por rua e número tem de achar. */
async function primeiroEdificioDeCasaForte() {
  const indice = JSON.parse(await readFile(path.resolve("src/dados/recife/indice/casa-forte.json"), "utf8"));
  const edificio = indice.edificios[0];
  assert(edificio && edificio.logradouro && edificio.numero && /^\d{14}$/.test(edificio.dsqfl), "primeiro edifício de casa-forte.json sem logradouro, número ou chave cadastral");
  return edificio;
}

/** `D.SSSS.QQQ.FF.LLLL`, como a tela do prédio mostra a chave de 14 dígitos. */
const chaveCadastral = (d) => [d.slice(0, 1), d.slice(1, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 14)].join(".");

/** Minúsculas e sem acento, para comparar o endereço do cadastro ("RUA PADRE JOSE …") com o escrito na tela. */
const semAcento = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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

/** A leitura de um link abre o formulário enxuto (preço, condomínio e IPTU); o resto fica atrás do link. */
async function abrirTodosOsCampos(page) {
  assert.equal(await page.getByRole("textbox", { name: "Rua", exact: true }).count(), 0, "formulário enxuto sem a rua");
  await page.getByRole("button", { name: /^Ver todos os campos/ }).click();
}

// ——— Passos que se repetem (editor e Comparar) ——————————————————————————————————————————————

/**
 * "Adicionar imóvel sem link": abre o editor e o preenche, sem salvar. `d`: nome, modalidade ("compra" ou "aluguel"),
 * bairro, preco (o preço de venda ou o aluguel), condominio, iptu (por mês), seguro (opcional, só aluguel), area, quartos
 * e o nome da etapa auditada com o formulário cheio. `adicionarImovelSemLink` salva em seguida e termina em /salvos, com
 * o link "Abrir {nome}".
 */
async function preencherImovelSemLink(page, d) {
  const aluguel = d.modalidade === "aluguel";
  await page.getByRole("button", { name: "Adicionar imóvel sem link", exact: true }).click();
  await esperarRota(page, "/editar");
  await esperarTexto(page, "Adicionar imóvel");
  await page.getByRole("textbox", { name: "Nome da análise", exact: true }).fill(d.nome);
  await page.getByRole("radio", { name: aluguel ? "Alugar" : "Comprar", exact: true }).click();
  await page.getByRole("button", { name: "Bairro", exact: true }).click();
  await page.getByRole("textbox", { name: "Buscar bairro", exact: true }).fill(d.bairro);
  await page.getByRole("button", { name: d.bairro, exact: true }).click();
  await page.getByRole("textbox", { name: aluguel ? "Aluguel (R$ por mês)" : "Preço de venda (R$)", exact: true }).fill(String(d.preco));
  await page.getByRole("textbox", { name: "Condomínio (R$ por mês)", exact: true }).fill(String(d.condominio));
  await page.getByRole("textbox", { name: "IPTU (R$)", exact: true }).fill(String(d.iptu));
  await page.getByRole("radio", { name: "Mês", exact: true }).click();
  if (d.seguro !== undefined) await page.getByRole("textbox", { name: "Seguro incêndio (R$ por mês)", exact: true }).fill(String(d.seguro));
  await page.getByRole("textbox", { name: "Área (m²)", exact: true }).fill(String(d.area));
  await page.getByRole("textbox", { name: "Quartos", exact: true }).fill(String(d.quartos));
  await etapa(page, d.etapa);
}

async function adicionarImovelSemLink(page, d) {
  await preencherImovelSemLink(page, d);
  await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
  await esperarRota(page, "/salvos");
  await esperarTexto(page, "Seus imóveis salvos.");
  await esperar(async () => (await page.getByRole("link", { name: `Abrir ${d.nome}`, exact: true }).count()) === 1, `análise "${d.nome}" em Salvos`);
}

/** Nome do imóvel no lugar `slot` (1 ou 2) do Comparar, lido do rótulo do botão. */
async function nomeDoSlot(page, slot) {
  const rotulo = await page.getByRole("button", { name: new RegExp(`^Imóvel ${slot}: `) }).getAttribute("aria-label");
  return rotulo.replace(new RegExp(`^Imóvel ${slot}: `), "").replace(/\. Trocar imóvel$/, "");
}

async function escolherNoSlot(page, slot, comecaCom) {
  await page.getByRole("button", { name: new RegExp(`^Imóvel ${slot}: `) }).click();
  await page.getByRole("dialog", { name: `Escolher imóvel ${slot}` }).waitFor();
  await page.getByRole("radio", { name: new RegExp(`^${comecaCom}`) }).click();
  await esperar(async () => (await page.getByRole("dialog").count()) === 0, "gaveta de escolha fecha");
}

/** No Comparar, deixa `primeiro` no lugar 1 e `segundo` no lugar 2 (pelo começo do nome, ou o nome inteiro). */
async function colocarNosSlots(page, primeiro, segundo) {
  await page.getByRole("button", { name: /^Imóvel 1: / }).waitFor();
  if (!(await nomeDoSlot(page, 1)).startsWith(primeiro)) await escolherNoSlot(page, 1, primeiro);
  if (!(await nomeDoSlot(page, 2)).startsWith(segundo)) await escolherNoSlot(page, 2, segundo);
  assert((await nomeDoSlot(page, 1)).startsWith(primeiro), `Imóvel 1 deveria começar com "${primeiro}"`);
  assert((await nomeDoSlot(page, 2)).startsWith(segundo), `Imóvel 2 deveria começar com "${segundo}"`);
}

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

  // Gaveta e folha a 1280 px: painel de no máximo 640 px, no meio da tela (no protótipo `.drawer-panel` é centrado).
  if (larguraDaTela >= 900) {
    for (const el of document.querySelectorAll('[role="dialog"]')) {
      if (escondido(el)) continue;
      // O `Modal` do menu rápido cobre a tela toda (o painel dele é o `role="menu"`); não é gaveta nem folha.
      if (el.querySelector('[role="menu"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.width > 641 || Math.abs(r.left + r.width / 2 - larguraDaTela / 2) > 1.5) {
        problemas.push(`gaveta ou folha desalinhada a ${larguraDaTela} px (${Math.round(r.left)}→${Math.round(r.right)}): ${descrever(el)}`);
      }
    }
  }

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
/** Controle pequeno ("Todos 47×26") → telas em que apareceu. */
const avisosDeAlvo = new Map();
let numeroDaEtapa = 0;

/** O mesmo problema em várias etapas aparece uma vez, com a lista de onde ocorreu. */
function resumirProblemas(lista) {
  const grupos = new Map();
  for (const { etapa, texto } of lista) grupos.set(texto, [...(grupos.get(texto) ?? []), etapa]);
  return [...grupos].map(([texto, etapas]) => {
    const telas = [...new Set(etapas.map((e) => e.replace(/ @\d+$/, "")))];
    return `${texto}  [${telas.length} tela(s): ${telas.slice(0, 4).join(", ")}${telas.length > 4 ? ", …" : ""}]`;
  });
}

/** Mede (sem reprovar) os controles com menos de 44 px de lado. Na web o `hitSlop` não alarga a área de toque (conferido tocando 6 px fora de um controle com `hitSlop`), então vale o tamanho desenhado. */
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
  const tela = rotulo.replace(/ @\d+$/, "").replace(/^\d+-/, "");
  for (const a of await page.evaluate(alvosPequenosNaPagina)) avisosDeAlvo.set(a, new Set([...(avisosDeAlvo.get(a) ?? []), tela]));
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
  // A 1280 px, um painel encostado na esquerda e mais largo que 640 px tem de ser apontado.
  await page.setViewportSize(DESKTOP);
  await pausa(250);
  await page.evaluate(() => {
    const falso = document.createElement("div");
    falso.id = "autoteste-da-gaveta";
    falso.setAttribute("role", "dialog");
    falso.style.cssText = "position:fixed;top:0;left:0;width:900px;height:40px;z-index:99999;background:#eee;";
    document.getElementById("root").appendChild(falso);
  });
  const achadosDaGaveta = await page.evaluate(auditoriaNaPagina);
  await page.evaluate(() => document.getElementById("autoteste-da-gaveta")?.remove());
  await page.setViewportSize(MOBILE);
  await pausa(250);
  assert.match(achadosDaGaveta.join("\n"), /gaveta ou folha desalinhada/, "auditor: gaveta desalinhada a 1280 px");
  console.log("  autoteste do auditor: apontou controle dentro de controle, botão sem nome, radio sem aria-checked, aba sem aria-selected, estouro horizontal e gaveta desalinhada a 1280 px");
}

// ——— Principal —————————————————————————————————————————————————————————————————————————————

await rm(pastaDeCapturas, { recursive: true, force: true });
await mkdir(pastaDeCapturas, { recursive: true });

const servidor = await garantirServidor();
const browser = await chromium.launch({ headless: true });
const errosDaPagina = [];
const externos = [];
let correu = false;

/** Toda requisição para fora do servidor do app, de qualquer contexto. */
const rastrearRede = (contexto) =>
  contexto.on("request", (r) => {
    const url = r.url();
    if (/^https?:/.test(url) && new URL(url).origin !== origem) externos.push(url);
  });
/** `pageerror` e `console.error` de qualquer página. */
const rastrearErros = (pagina) => {
  pagina.on("pageerror", (e) => errosDaPagina.push(`pageerror: ${e.message}`));
  pagina.on("console", (m) => {
    if (m.type() === "error") errosDaPagina.push(`console.error: ${m.text()}`);
  });
};

try {
  const context = await browser.newContext({ viewport: MOBILE, locale: "pt-BR" });
  rastrearRede(context);
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  rastrearErros(page);
  /** A página em que o teste está, para a captura de falha. */
  let paginaEmUso = page;

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
    await abrirTodosOsCampos(page);
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
    assert.equal(await page.getByRole("tab", { name: "Dossiê", exact: true }).getAttribute("aria-selected"), "true");
    console.log("  saldo de créditos: 3 → 2");
    await etapa(page, "dossie-destaques");

    // Nenhuma linha do dossiê (texto na tela e nome acessível) põe R$/m² ou "por m²" ao lado do ITBI: a área do ITBI
    // inclui área comum, então o valor fiscal só se compara por unidade.
    const semPorM2ComITBI = async (aba) => {
      const linhas = [...(await linhasVisiveis(page)), ...(await page.locator("body").ariaSnapshot()).split("\n")];
      const comITBI = linhas.filter((l) => /ITBI|avaliaç(?:ão|ões) fiscais?|mediana fiscal/i.test(l));
      assert(comITBI.length > 0, `aba ${aba}: nenhuma linha de ITBI para conferir`);
      const comM2 = comITBI.filter((l) => /m²/i.test(l));
      assert.deepEqual(comM2, [], `aba ${aba}: linha de ITBI com m²`);
      return comITBI;
    };
    // A anomalia lida no texto continua no dossiê, como achado principal.
    await esperarTexto(page, "IPTU sem periodicidade");
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

    // ——— a2) aluguel em Casa Forte ————————————————————————————————————————————————————————

    console.log("a2) aluguel em Casa Forte: link, texto, anomalia de IPTU, prédio por rua e número, crédito e dossiê");
    const predio = await primeiroEdificioDeCasaForte();
    /** Rua do cadastro sem o tipo de via ("RUA PADRE JOSE EDWALDO GOMES" → "padre jose edwaldo gomes"): o que a tela escreve por extenso. */
    const ruaDoPredio = semAcento(predio.logradouro).split(/\s+/).slice(1).join(" ");
    const casoDoLink = await casoDoLinkDeAluguel();
    const casoDoTexto = await casoDoTextoDeAluguel();
    const dadosDoAluguel = casoDoTexto.esperado.campos;
    const reais = (n) => n.toLocaleString("pt-BR");

    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await esperarRota(page, "/");
    // Só há compras no caderno: o filtro Alugar está vazio.
    await page.getByRole("radio", { name: "Alugar", exact: true }).click();
    await esperarTexto(page, "Nenhuma análise de aluguel ainda.");
    await page.getByRole("radio", { name: "Todos", exact: true }).click();

    await page.getByRole("textbox", { name: "Link do anúncio do imóvel" }).fill(casoDoLink.entrada);
    await page.getByRole("button", { name: "Gerar Dossiê", exact: true }).click();
    await esperarRota(page, "/ler");
    await esperarTexto(page, `ZAP Imóveis · código ${casoDoLink.esperado.idNoPortal}`);
    await esperarTexto(page, "Casa Forte · com cadastro");
    await esperarTexto(page, "Apartamento · 1 quarto · 37 m²");
    assert.equal(await page.getByRole("radio", { name: "Alugar", exact: true }).isChecked(), true, "o link é de aluguel");
    await etapa(page, "ler-aluguel-link");

    await page.getByRole("textbox", { name: "Texto do anúncio" }).fill(casoDoTexto.entrada);
    await page.getByRole("button", { name: "Ler texto", exact: true }).click();
    await esperarTexto(page, ANOMALIA_IPTU);
    await esperarTexto(
      page,
      `R$ ${reais(dadosDoAluguel.preco)}/mês · Cond. R$ ${reais(dadosDoAluguel.condominio)}/mês · IPTU R$ ${reais(dadosDoAluguel.iptu.valor)} · período não informado`,
    );
    // A cobertura é a do link (Casa Forte): o texto colado fala de outro bairro e não a muda.
    await esperarTexto(page, "Casa Forte · com cadastro");
    await abrirTodosOsCampos(page);
    assert.equal(await valorDoCampo(page, "Rua"), dadosDoAluguel.logradouro);
    assert.equal(await valorDoCampo(page, "Aluguel (R$ por mês)"), reais(dadosDoAluguel.preco));
    assert.equal(await valorDoCampo(page, "Condomínio (R$ por mês)"), reais(dadosDoAluguel.condominio));
    assert.equal(await valorDoCampo(page, "IPTU (R$)"), reais(dadosDoAluguel.iptu.valor));
    assert.equal(await valorDoCampo(page, "Área (m²)"), reais(dadosDoAluguel.area));
    assert.equal(await valorDoCampo(page, "Quartos"), String(dadosDoAluguel.quartos));
    assert.equal(await valorDoCampo(page, "Andar"), String(dadosDoAluguel.andar));
    assert.equal(await page.getByRole("radio", { name: "Alugar", exact: true }).isChecked(), true, "modalidade Alugar");
    assert.equal(await page.getByRole("radio", { name: "Não sei", exact: true }).isChecked(), true, "o IPTU sem período fica em Não sei");
    await etapa(page, "ler-aluguel-anomalia-iptu");

    await page.getByRole("button", { name: "Encontrar o prédio", exact: true }).click();
    await esperarRota(page, "/predio");
    await esperarTexto(page, "É este o prédio?");
    // T4: o link (37 m²) e o texto (125 m²) discordam da área, que fica a confirmar e não entra na busca de candidatos.
    // Com a rua do anúncio (Rua Projetada A) fora do cadastro, nada é sugerido nem cobrado: a pessoa busca por rua e número.
    await esperarTexto(page, "Não achamos Rua Projetada A no cadastro");
    assert.equal(await page.getByRole("button", { name: "É este prédio", exact: true }).count(), 0, "área a confirmar sozinha não sugere prédio");
    assert.equal(await saldoDoCabecalho(page), 2, "o crédito só sai ao confirmar o prédio");

    const consulta = `${predio.logradouro} ${predio.numero}`;
    await page.getByRole("textbox", { name: "Buscar por rua, número ou nome do prédio", exact: true }).fill(consulta);
    await esperar(async () => (await page.getByRole("button", { name: /^Escolher / }).count()) > 0, `resultados da busca "${consulta}"`);
    const rotulosDaBusca = await page.getByRole("button", { name: /^Escolher / }).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    const fimDoNumero = new RegExp(`, ${predio.numero}(?: ·|$)`);
    const rotuloDoPredio = rotulosDaBusca.find(
      (r) => semAcento(r).includes(ruaDoPredio) && fimDoNumero.test(r) && (!predio.nome || semAcento(r).includes(semAcento(predio.nome))),
    );
    assert(rotuloDoPredio, `a busca por "${consulta}" não achou o primeiro edifício de casa-forte.json; resultados: ${JSON.stringify(rotulosDaBusca)}`);
    await etapa(page, "predio-aluguel-busca");
    await page.getByRole("button", { name: rotuloDoPredio, exact: true }).click();
    await esperarTexto(page, chaveCadastral(predio.dsqfl));
    await esperarTexto(page, `${predio.unidades} unidades`);
    if (predio.nome) await esperarTexto(page, predio.nome);
    await esperarTexto(page, "Usa 1 crédito.");
    assert.equal(await saldoDoCabecalho(page), 2, "escolher na busca não gasta crédito");
    await etapa(page, "predio-aluguel-escolhido");

    await page.getByRole("button", { name: "É este prédio", exact: true }).click();
    await esperarRota(page, "/dossie");
    await esperarTexto(page, "Lote confirmado ✓");
    await esperarSaldo(page, 1);
    console.log("  saldo de créditos: 2 → 1");
    const textoDoDossieDeAluguel = semAcento(await textoVisivel(page));
    assert(textoDoDossieDeAluguel.includes(`${ruaDoPredio}, ${predio.numero}`), `o dossiê mostra o endereço do prédio escolhido (${ruaDoPredio}, ${predio.numero})`);
    await esperarTexto(page, "IPTU sem periodicidade");
    await esperarTexto(page, `R$ ${reais(dadosDoAluguel.preco)}`);
    await esperarTexto(page, `R$ ${reais(dadosDoAluguel.preco + dadosDoAluguel.condominio)}`);
    await esperarTexto(page, `+R$ ${reais(dadosDoAluguel.condominio)} além do aluguel`);
    await esperarTexto(page, `O anúncio informa R$ ${reais(dadosDoAluguel.iptu.valor)}, sem periodicidade`);
    await etapa(page, "dossie-aluguel-destaques");

    // Um fato do cadastro com a Prefeitura do Recife como origem.
    await page.getByRole("link", { name: "Cadastro oficial", exact: true }).click();
    const gavetaDoAluguel = page.getByRole("dialog", { name: "Cadastro oficial" });
    await gavetaDoAluguel.waitFor();
    const textoDaGavetaDoAluguel = await gavetaDoAluguel.innerText();
    assert.match(textoDaGavetaDoAluguel, /Prefeitura do Recife/);
    assert.match(textoDaGavetaDoAluguel, /registro oficial · IPTU 2026/);
    assert(textoDaGavetaDoAluguel.includes(chaveCadastral(predio.dsqfl)), "o cadastro oficial mostra a chave cadastral do prédio escolhido");
    if (predio.nome) assert(textoDaGavetaDoAluguel.includes(predio.nome), `o cadastro oficial mostra o nome do edifício (${predio.nome})`);
    await etapa(page, "dossie-aluguel-cadastro-oficial");
    await page.keyboard.press("Escape");
    await esperar(async () => (await page.getByRole("dialog").count()) === 0, "Esc fecha o cadastro oficial do aluguel");

    // ——— b) sem rede ————————————————————————————————————————————————————————————————————

    // O app já está aberto, com as duas análises e o índice carregado. A rede cai DEPOIS: a navegação entre telas é do
    // aparelho. Recarregar a página sem rede não é suportado na web (o HTML e o bundle vêm do servidor e o app não registra
    // service worker), por isso aqui não se recarrega.
    console.log("b) sem rede: com o app já aberto, abas, dossiês e cadastro só com o índice local");
    await context.setOffline(true);
    assert.equal(await page.evaluate(() => navigator.onLine), false, "o navegador está sem rede");

    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await esperarRota(page, "/");
    const cartaoAluguel = page.getByRole("button", { name: new RegExp(`^${NOME_ALUGUEL_CASA_FORTE}\\.`) });
    await cartaoAluguel.waitFor();
    await cartaoAluguel.click();
    await esperarRota(page, "/dossie");
    await esperarTexto(page, "Lote confirmado ✓");
    assert(semAcento(await textoVisivel(page)).includes(`${ruaDoPredio}, ${predio.numero}`), "sem rede, o dossiê do aluguel mostra o prédio do índice");
    await page.getByRole("tab", { name: "Entorno", exact: true }).click();
    await esperarTexto(page, "Casa Forte, em números");
    await esperarTexto(page, "Prédios no índice cadastral");
    await page.getByRole("tab", { name: "Edifício", exact: true }).click();
    await esperarTexto(page, "Estrutura e cadastro");
    if (predio.nome) await esperarTexto(page, predio.nome);
    await page.getByRole("link", { name: "Cadastro oficial", exact: true }).click();
    await page.getByRole("dialog", { name: "Cadastro oficial" }).waitFor();
    assert.match(await page.getByRole("dialog", { name: "Cadastro oficial" }).innerText(), /Prefeitura do Recife/);
    await etapa(page, "dossie-aluguel-sem-rede");
    await page.keyboard.press("Escape");
    await esperar(async () => (await page.getByRole("dialog").count()) === 0, "Esc fecha o cadastro oficial sem rede");

    await page.getByRole("tab", { name: "Comparar", exact: true }).click();
    await esperarRota(page, "/comparar");
    await esperarTexto(page, "Compare suas opções.");
    await page.getByRole("tab", { name: "Visita", exact: true }).click();
    await esperarRota(page, "/visita");
    await esperarTexto(page, "Prepare sua visita.");

    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await esperarRota(page, "/");
    const cartaoCasaForte = page.getByRole("button", { name: new RegExp(`^${NOME_COMPRA_CASA_FORTE}\\.`) });
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
    await esperar(async () => (await page.getByRole("dialog").count()) === 0, "Esc fecha o cadastro oficial da compra sem rede");

    // O dock leva de volta ao dossiê aberto por último (a compra), ainda sem rede.
    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await esperarRota(page, "/");
    await page.getByRole("tab", { name: "Dossiê", exact: true }).click();
    await esperarRota(page, "/dossie");
    await esperarTexto(page, "Estrada do Encanamento, 719");
    await context.setOffline(false);
    console.log("  sem rede: Explorar, dois dossiês (Destaques, Entorno, Edifício), cadastro oficial, Comparar e Visita; recarga offline não testada (sem service worker na web)");

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
    await esperarSaldo(page, 1);
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
    assert.equal(await saldoDoCabecalho(page), 1, "fora da cobertura não gasta crédito");
    await etapa(page, "ler-torre-fora-de-cobertura");
    await page.getByRole("button", { name: "Salvar no caderno", exact: true }).click();
    await esperarRota(page, "/");
    await esperarTexto(page, "Análises Recentes");
    await esperar(async () => (await page.getByRole("button", { name: /Torre/ }).count()) > 0, "cartão de Torre no Explorar");
    await etapa(page, "explorar-tres-analises");

    // ——— d) recarregar ——————————————————————————————————————————————————————————————————

    console.log("d) recarregar: análises, vínculos e saldo persistem");
    await page.reload({ waitUntil: "load", timeout: 120_000 });
    await esperarTexto(page, "Análises Recentes", 60_000);
    const cartaoDaCompra = () => page.getByRole("button", { name: new RegExp(`^${NOME_COMPRA_CASA_FORTE}\\.`) });
    const cartaoDoAluguel = () => page.getByRole("button", { name: new RegExp(`^${NOME_ALUGUEL_CASA_FORTE}\\.`) });
    await esperar(async () => (await cartaoDaCompra().count()) === 1, "cartão da compra de Casa Forte depois da recarga");
    await esperar(async () => (await cartaoDoAluguel().count()) === 1, "cartão do aluguel de Casa Forte depois da recarga");
    await esperar(async () => (await page.getByRole("button", { name: /Torre/ }).count()) >= 1, "cartão de Torre depois da recarga");
    const textoAposRecarga = await textoVisivel(page);
    assert.match(textoAposRecarga, /Prédio confirmado · \d{4}/, "o vínculo confirmado persistiu");
    assert.match(textoAposRecarga, /Estrada do Encanamento, 719/);
    assert.match(textoAposRecarga, /IPTU sem periodicidade/, "a anomalia de IPTU aparece no cartão do Explorar");
    // O aluguel também: prédio escolhido na busca, custo conhecido e o que falta confirmar.
    assert(semAcento(textoAposRecarga).includes(`${ruaDoPredio}, ${predio.numero}`), "o cartão do aluguel mostra o endereço do prédio escolhido na busca");
    if (predio.anoConstrucao) assert.match(textoAposRecarga, new RegExp(`Prédio confirmado · ${predio.anoConstrucao}`), "ano do prédio do aluguel no cartão");
    assert(textoAposRecarga.includes(`Anúncio: R$ ${reais(dadosDoAluguel.preco)}/mês`), "cartão do aluguel: anúncio");
    assert(textoAposRecarga.includes(`Total conhecido: R$ ${reais(dadosDoAluguel.preco + dadosDoAluguel.condominio)}/mês`), "cartão do aluguel: total conhecido sem o IPTU sem período");
    assert(textoAposRecarga.includes(`+R$ ${reais(dadosDoAluguel.condominio)} além do aluguel`), "cartão do aluguel: além do aluguel");
    assert(textoAposRecarga.includes("2 a confirmar"), "cartão do aluguel: IPTU e seguro incêndio a confirmar");
    assert.equal(await saldoDoCabecalho(page), 1, "o saldo persistiu");
    // Estados expostos ao leitor de tela: aba do dock e filtro (radio) marcados.
    assert.equal(await page.getByRole("tab", { name: "Explorar", exact: true }).getAttribute("aria-selected"), "true");
    assert.equal(await page.getByRole("tab", { name: "Dossiê", exact: true }).getAttribute("aria-selected"), "false");
    assert.equal(await page.getByRole("radio", { name: "Todos", exact: true }).isChecked(), true);
    await page.getByRole("radio", { name: "Alugar", exact: true }).click();
    await esperar(async () => (await cartaoDoAluguel().count()) === 1, "filtro Alugar mostra o aluguel");
    assert.equal(await cartaoDaCompra().count(), 0, "filtro Alugar esconde a compra");
    assert.equal(await page.getByRole("button", { name: /Torre/ }).count(), 0, "filtro Alugar esconde Torre");
    assert.equal(await page.getByRole("radio", { name: "Alugar", exact: true }).isChecked(), true);
    assert.equal(await page.getByRole("radio", { name: "Todos", exact: true }).isChecked(), false);
    await page.getByRole("radio", { name: "Comprar", exact: true }).click();
    await esperar(async () => (await page.getByRole("button", { name: /Torre/ }).count()) >= 1, "filtro Comprar mostra Torre");
    assert.equal(await cartaoDaCompra().count(), 1, "filtro Comprar mostra a compra de Casa Forte");
    assert.equal(await cartaoDoAluguel().count(), 0, "filtro Comprar esconde o aluguel");
    await page.getByRole("radio", { name: "Todos", exact: true }).click();
    await etapa(page, "explorar-apos-recarga");
    await cartaoDaCompra().click();
    await esperarRota(page, "/dossie");
    await esperarTexto(page, "Lote confirmado ✓");

    // ——— e) segunda análise de compra e Comparar ——————————————————————————————————————————

    console.log("e) segunda análise de compra pelo editor e comparação");
    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await esperarRota(page, "/");
    await adicionarImovelSemLink(page, {
      nome: NOME_MANUAL,
      modalidade: "compra",
      bairro: "Boa Viagem",
      preco: 540000,
      condominio: 650,
      iptu: 120,
      area: 58,
      quartos: 2,
      etapa: "editar-imovel-sem-link",
    });
    await etapa(page, "salvos-quatro-analises");

    await page.getByRole("link", { name: "Comparar", exact: true }).click();
    await esperarRota(page, "/comparar");
    await esperarTexto(page, "Compare suas opções.");
    await page.getByRole("radio", { name: "Comprar", exact: true }).click();
    await colocarNosSlots(page, NOME_COMPRA_CASA_FORTE, NOME_MANUAL);

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

    // ——— e2) segunda análise de aluguel e Comparar ————————————————————————————————————————

    console.log("e2) segunda análise de aluguel pelo editor e comparação das duas de aluguel");
    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await esperarRota(page, "/");
    const manual = { preco: 3200, condominio: 900, iptu: 150, seguro: 40 };
    await adicionarImovelSemLink(page, {
      nome: NOME_ALUGUEL_MANUAL,
      modalidade: "aluguel",
      bairro: "Boa Viagem",
      ...manual,
      area: 70,
      quartos: 2,
      etapa: "editar-aluguel-sem-link",
    });
    await etapa(page, "salvos-cinco-analises");

    await page.getByRole("link", { name: "Comparar", exact: true }).click();
    await esperarRota(page, "/comparar");
    await esperarTexto(page, "Compare suas opções.");
    await page.getByRole("radio", { name: "Alugar", exact: true }).click();
    await colocarNosSlots(page, NOME_ALUGUEL_CASA_FORTE, NOME_ALUGUEL_MANUAL);

    // Aluguel: a diferença é do custo mensal conhecido. Casa Forte: aluguel + condomínio (o IPTU sem período e o seguro
    // desconhecido ficam de fora e contam como 2 a confirmar). A manual tem as quatro parcelas.
    const conhecidoDeCasaForte = dadosDoAluguel.preco + dadosDoAluguel.condominio;
    const conhecidoDaManual = manual.preco + manual.condominio + manual.iptu + manual.seguro;
    await esperarTexto(page, "de diferença no custo mensal conhecido");
    await esperarTexto(page, "Custo mensal conhecido");
    const custoDoAluguel = await textoVisivel(page);
    assert(
      custoDoAluguel.includes(`R$ ${reais(conhecidoDeCasaForte - conhecidoDaManual)}\nde diferença no custo mensal conhecido`),
      `${conhecidoDeCasaForte} contra ${conhecidoDaManual}: diferença de R$ ${reais(conhecidoDeCasaForte - conhecidoDaManual)}`,
    );
    assert(custoDoAluguel.includes(`R$ ${reais(conhecidoDeCasaForte)}/mês`), "Casa Forte: aluguel e condomínio");
    assert(custoDoAluguel.includes(`R$ ${reais(conhecidoDaManual)}/mês`), "Boa Viagem: aluguel, condomínio, IPTU e seguro");
    assert.match(custoDoAluguel, /2 parcelas a confirmar/, "Casa Forte: o IPTU sem periodicidade e o seguro desconhecido ficam a confirmar");
    assert.match(custoDoAluguel, /Nenhuma parcela a confirmar/, "Boa Viagem: nada a confirmar");
    assert(custoDoAluguel.includes(`O anúncio informa R$ ${reais(dadosDoAluguel.iptu.valor)}, sem periodicidade`), "a nota do IPTU sem periodicidade");
    await etapa(page, "comparar-aluguel-custo");
    await page.getByRole("tab", { name: "Espaço", exact: true }).click();
    await esperarTexto(page, "Aluguel anunciado por m²");
    await etapa(page, "comparar-aluguel-espaco");
    await page.getByRole("tab", { name: "Entorno", exact: true }).click();
    await esperarTexto(page, "Prédio não confirmado");
    await esperarTexto(page, "Prédio confirmado");
    if (predio.nome) await esperarTexto(page, predio.nome);
    await etapa(page, "comparar-aluguel-entorno");

    // ——— f) descartar ——————————————————————————————————————————————————————————————————

    // O +1 devolve o crédito de quem pagou e contou por que descartou: só vale para o imóvel que usou crédito (prédio
    // confirmado). Descartar o que nunca usou crédito não rende nada, e a gaveta avisa antes.
    console.log("f) descartar: +1 crédito só para o imóvel que usou crédito, e uma vez só");
    await page.getByRole("link", { name: "Meus salvos", exact: true }).click();
    await esperarRota(page, "/salvos");
    assert.equal(await saldoDoCabecalho(page), 1, "3 créditos menos 2 prédios confirmados");

    // 1. Compra manual: nunca usou crédito.
    await esperar(async () => (await page.getByRole("link", { name: `Descartar ${NOME_MANUAL}`, exact: true }).count()) === 1, "link Descartar da compra manual");
    await page.getByRole("link", { name: `Descartar ${NOME_MANUAL}`, exact: true }).click();
    await page.getByRole("dialog", { name: "Descartar imóvel" }).waitFor();
    await esperarTexto(page, "Este imóvel não usou crédito, então o descarte não rende crédito.");
    await page.getByRole("radio", { name: "Planta, andar ou vaga inadequados", exact: true }).click();
    await etapa(page, "descartar-gaveta-sem-credito");
    await page.getByRole("button", { name: "Descartar imóvel", exact: true }).click();
    await esperar(async () => (await page.getByRole("dialog").count()) === 0, "gaveta de descarte fecha (sem crédito)");
    await esperarTexto(page, "Descartados");
    await pausa(1200);
    assert.equal(await page.getByRole("status").filter({ hasText: "+1 crédito" }).count(), 0, "descartar o que nunca usou crédito não avisa crédito");
    assert.equal(await saldoDoCabecalho(page), 1, "descartar o que nunca usou crédito não credita");
    console.log("  compra manual descartada sem crédito: saldo continua 1");

    // 2. Compra de Casa Forte: usou 1 crédito, então o descarte rende +1, uma vez só.
    await esperar(async () => (await page.getByRole("link", { name: `Descartar ${NOME_COMPRA_CASA_FORTE}`, exact: true }).count()) === 1, "link Descartar da compra de Casa Forte");
    await page.getByRole("link", { name: `Descartar ${NOME_COMPRA_CASA_FORTE}`, exact: true }).click();
    await page.getByRole("dialog", { name: "Descartar imóvel" }).waitFor();
    await esperarTexto(page, "Seu feedback concede +1 crédito na carteira.");
    await page.getByRole("radio", { name: "Preço ou taxas acima do orçamento", exact: true }).click();
    await etapa(page, "descartar-gaveta");
    // Toque duplo no botão: o descarte vale um crédito, não dois.
    await page.getByRole("button", { name: "Descartar imóvel", exact: true }).dblclick();
    await page.getByRole("status").filter({ hasText: "+1 crédito" }).first().waitFor({ timeout: 8000 });
    await esperarSaldo(page, 2);
    await pausa(1200);
    assert.equal(await saldoDoCabecalho(page), 2, "o saldo sobe uma vez só (1 → 2), não duas");
    console.log('  aviso "+1 crédito" visto; saldo 1 → 2 depois de um toque duplo');
    await esperarTexto(page, "Descartados");
    await etapa(page, "salvos-com-descartado");

    // 3. Restaurar e descartar de novo: o crédito daquela análise já foi concedido.
    await page.getByRole("button", { name: `Restaurar ${NOME_COMPRA_CASA_FORTE}`, exact: true }).click();
    await esperarTexto(page, "Imóvel restaurado");
    await page.getByRole("link", { name: `Descartar ${NOME_COMPRA_CASA_FORTE}`, exact: true }).click();
    await page.getByRole("dialog", { name: "Descartar imóvel" }).waitFor();
    await esperarTexto(page, "O crédito deste descarte já foi concedido.");
    await page.getByRole("radio", { name: "Outro motivo", exact: true }).click();
    await page.getByRole("button", { name: "Descartar imóvel", exact: true }).click();
    await esperar(async () => (await page.getByRole("dialog").count()) === 0, "gaveta de descarte fecha");
    await pausa(800);
    assert.equal(await page.getByRole("status").filter({ hasText: "+1 crédito" }).count(), 0, "o segundo descarte não avisa crédito");
    assert.equal(await saldoDoCabecalho(page), 2, "descartar de novo a mesma análise não credita outra vez");
    console.log("  restaurar e descartar de novo: saldo continua 2");

    // ——— g) menu e pílula de créditos ——————————————————————————————————————————————————

    console.log("g) menu e pílula de créditos");
    await page.getByRole("button", { name: "Menu de navegação", exact: true }).click();
    await page.getByRole("menuitem", { name: "Sobre os dados", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Menu de navegação", exact: true }).getAttribute("aria-expanded"), "true");
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
    assert.equal((extrato.match(/Descarte informado/g) ?? []).length, 1, "o extrato tem um único descarte (o do imóvel que usou crédito)");
    assert.equal((extrato.match(/Prédio confirmado/g) ?? []).length, 2, "o extrato tem as duas confirmações de prédio (compra e aluguel)");
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
    await page.getByRole("heading").first().waitFor();
    const secoesComEstado = await page.evaluate(
      () => [...document.querySelectorAll('[role="button"][aria-expanded]')].filter((el) => !el.closest('[aria-hidden="true"]')).length,
    );
    assert(secoesComEstado > 0, "as seções do dossiê de exemplo expõem aria-expanded");
    await etapa(page, "exemplo-boa-viagem");

    // ——— g2) caderno ilegível ——————————————————————————————————————————————————————————————

    // O caderno guardado no aparelho virou texto que não é JSON (cortado no meio). O app tem de dizer isso, nenhuma
    // gravação pode passar por cima da chave (sumiriam as análises da pessoa) e o texto original fica copiado à parte.
    console.log("g2) caderno ilegível: JSON inválido em vereda-analises-v2");
    const contextoDoErro = await browser.newContext({ viewport: MOBILE, locale: "pt-BR" });
    try {
      rastrearRede(contextoDoErro);
      const pagina = await contextoDoErro.newPage();
      pagina.setDefaultTimeout(20_000);
      rastrearErros(pagina);
      paginaEmUso = pagina;

      await pagina.goto(`${base}/`, { waitUntil: "load", timeout: 120_000 });
      await pagina.getByRole("button", { name: "Colar link", exact: true }).waitFor();
      assert.equal(await saldoDoCabecalho(pagina), 3, "o contexto novo começa com 3 créditos");
      await pagina.evaluate(([chave, valor]) => localStorage.setItem(chave, valor), ["vereda-analises-v2", CADERNO_CORROMPIDO]);
      await pagina.reload({ waitUntil: "load", timeout: 120_000 });
      await pagina.getByRole("button", { name: "Colar link", exact: true }).waitFor();

      const doCaderno = () => pagina.evaluate(() => localStorage.getItem("vereda-analises-v2"));
      const intacta = async (onde) => assert.equal(await doCaderno(), CADERNO_CORROMPIDO, `${onde}: a chave vereda-analises-v2 tem de continuar byte a byte igual`);

      // Explorar não finge que o caderno está vazio.
      await esperarTexto(pagina, "Seu caderno não abriu.");
      await esperarTexto(pagina, ERRO_DO_CADERNO);
      assert.doesNotMatch(await textoVisivel(pagina), /Seu caderno começa com um link/, "Explorar não pode dizer que o caderno está vazio");
      await intacta("Explorar");
      await etapa(pagina, "caderno-ilegivel-explorar");

      await pagina.getByRole("tab", { name: "Dossiê", exact: true }).click();
      await esperarRota(pagina, "/dossie");
      await esperarTexto(pagina, ERRO_DO_CADERNO);
      await pagina.getByRole("tab", { name: "Comparar", exact: true }).click();
      await esperarRota(pagina, "/comparar");
      await esperarTexto(pagina, ERRO_DO_CADERNO);
      await pagina.getByRole("link", { name: "Meus salvos", exact: true }).click();
      await esperarRota(pagina, "/salvos");
      await esperarTexto(pagina, ERRO_DO_CADERNO);
      await pagina.getByRole("tab", { name: "Visita", exact: true }).click();
      await esperarRota(pagina, "/visita");
      await esperarTexto(pagina, ERRO_DO_CADERNO);
      await intacta("Dossiê, Comparar, Salvos e Visita");

      // Salvar a leitura: o erro é o do caderno (não "confira os valores"), nada navega e o crédito não sai.
      await pagina.getByRole("tab", { name: "Explorar", exact: true }).click();
      await esperarRota(pagina, "/");
      await pagina.getByRole("textbox", { name: "Link do anúncio do imóvel" }).fill(LINK_CASA_FORTE);
      await pagina.getByRole("button", { name: "Gerar Dossiê", exact: true }).click();
      await esperarRota(pagina, "/ler");
      await esperarTexto(pagina, "Casa Forte · com cadastro");
      await pagina.getByRole("button", { name: "Encontrar o prédio", exact: true }).click();
      await esperarTexto(pagina, ERRO_DO_CADERNO);
      assert.equal(new URL(pagina.url()).pathname, "/ler", "salvar a leitura com o caderno ilegível não navega");
      assert.equal(await saldoDoCabecalho(pagina), 3, "nenhum crédito sai");
      await intacta("salvar a leitura");
      await etapa(pagina, "caderno-ilegivel-ler-erro");

      // Salvar pelo editor: o mesmo.
      await pagina.getByRole("tab", { name: "Explorar", exact: true }).click();
      await esperarRota(pagina, "/");
      await preencherImovelSemLink(pagina, {
        nome: NOME_MANUAL,
        modalidade: "compra",
        bairro: "Boa Viagem",
        preco: 540000,
        condominio: 650,
        iptu: 120,
        area: 58,
        quartos: 2,
        etapa: "caderno-ilegivel-editor-cheio",
      });
      await pagina.getByRole("button", { name: "Salvar alterações", exact: true }).click();
      await esperarTexto(pagina, ERRO_DO_CADERNO);
      assert.equal(new URL(pagina.url()).pathname, "/editar", "salvar no editor com o caderno ilegível não navega");
      await intacta("salvar pelo editor");
      await etapa(pagina, "caderno-ilegivel-editor-erro");

      // Abrir o app de novo: a mesma mensagem, a chave intacta, uma única cópia do texto original, nada gravado no lugar.
      await pagina.goto(`${base}/`, { waitUntil: "load", timeout: 120_000 });
      await pagina.getByRole("button", { name: "Colar link", exact: true }).waitFor();
      await esperarTexto(pagina, ERRO_DO_CADERNO);
      await intacta("recarga");
      const chaves = await pagina.evaluate(() => Object.keys(localStorage));
      const copias = chaves.filter((k) => k.startsWith("vereda-analises-v2-bruto-"));
      assert.equal(copias.length, 1, `uma única cópia do texto original (achei: ${JSON.stringify(copias)})`);
      assert.equal(await pagina.evaluate((k) => localStorage.getItem(k), copias[0]), CADERNO_CORROMPIDO, "a cópia é o texto original");
      for (const proibida of ["vereda-analises-v2-quarentena", "vereda-analises-v1", "vereda-ativa-v1"]) {
        assert(!chaves.includes(proibida), `nenhuma gravação nova: ${proibida} não pode existir`);
      }
      assert.equal(await saldoDoCabecalho(pagina), 3, "a carteira continua com 3 créditos");
      console.log(`  caderno ilegível: erro na tela em Explorar, Dossiê, Comparar, Salvos, Visita, leitura e editor; chave intacta; cópia à parte (${copias[0]})`);
    } finally {
      await contextoDoErro.close();
    }
    paginaEmUso = page;

    // ——— h) e i) ————————————————————————————————————————————————————————————————————————

    console.log("h) conferência final");
    const externosDeDados = externos.filter((u) => /dados\.recife\.pe\.gov\.br/.test(u));
    assert.deepEqual(externosDeDados, [], "o app não pode chamar o portal de dados do Recife");
    assert.deepEqual(resumirProblemas(problemasDaAuditoria), [], "auditoria das telas");
    assert.deepEqual(errosDaPagina, [], `erros da página:\n${errosDaPagina.join("\n")}`);
    correu = true;
  } catch (erro) {
    await paginaEmUso.screenshot({ path: path.join(pastaDeCapturas, "FALHA.png") }).catch(() => undefined);
    console.error(`\nFALHOU em ${new URL(paginaEmUso.url()).pathname}`);
    console.error((await textoVisivel(paginaEmUso).catch(() => "")).split("\n").slice(0, 40).join("\n"));
    if (problemasDaAuditoria.length) console.error(`\nAuditoria até aqui:\n${resumirProblemas(problemasDaAuditoria).join("\n")}`);
    if (errosDaPagina.length) console.error(`\nErros da página até aqui:\n${errosDaPagina.join("\n")}`);
    throw erro;
  }

  if (avisosDeAlvo.size > 0) {
    console.log("\nControles com menos de 44 px de lado na web (só mede, não reprova; o react-native-web ignora `hitSlop`):");
    for (const [alvo, telas] of [...avisosDeAlvo].sort()) console.log(`  ${alvo}: ${[...telas].join(", ")}`);
  }
  const hostsExternos = [...new Set(externos.map((u) => new URL(u).host))];
  console.log(`\nRequisições para fora do servidor do app: ${externos.length === 0 ? "nenhuma" : hostsExternos.join(", ")}`);
  console.log(`Etapas auditadas a 375×812 e 1280×900: ${numeroDaEtapa}. Capturas em ${path.relative(process.cwd(), pastaDeCapturas)}/`);
  console.log(
    "\nV1: compra e aluguel em Casa Forte (link, texto, anomalia de IPTU, prédio real do índice, busca por rua e número, " +
      "crédito 3→2→1, fonte da Prefeitura, sem R$/m² com ITBI), abas e dossiês sem rede, Torre fora da cobertura, persistência, " +
      "segunda análise e comparação de compra e de aluguel, descarte (+1 só para quem usou crédito, uma vez), menu e créditos, " +
      "caderno ilegível (erro na tela, chave intacta) passaram.",
  );
} finally {
  await browser.close();
  if (servidor) derrubar(servidor);
}
process.exit(correu ? 0 : 1);
