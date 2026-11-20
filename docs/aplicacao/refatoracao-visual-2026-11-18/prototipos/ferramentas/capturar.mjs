// Captura e verificação dos protótipos HTML (fase 1).
//
//   node capturar.mjs a                     captura e verifica a opção A (pasta opcao-a)
//   node capturar.mjs a --rota ficha+metodo só uma rota (não refaz as folhas)
//   node capturar.mjs a --sem-folha         não monta as folhas de contato
//
// Grava capturas/<x>/390 e capturas/<x>/360, folha-de-contato-<x>.png, folha-de-contato-<x>-360.png e verificacao-<x>.json.
// A verificação é relatório, não portão: sai com 0 mesmo havendo problemas, e com 1 só se a captura falhar.
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lancar } from "../../auditoria/ferramentas/navegador.mjs";
import { servir } from "../../auditoria/ferramentas/servir.mjs";
import { montarFolha } from "../../auditoria/ferramentas/folha.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROTOTIPOS = path.resolve(AQUI, "..");
const RAIZ = path.resolve(PROTOTIPOS, "../../../.."); // raiz do repositório: o base.css busca as fontes em assets/fonts
const CAMINHO_WEB = "/" + path.relative(RAIZ, PROTOTIPOS).split(path.sep).join("/");

const LARGURAS = [
  { largura: 390, altura: 844 },
  { largura: 360, altura: 780 },
];
const TIPOS = ["vazamento", "toque", "rotulo", "principal", "db", "termo", "emoji", "contraste", "paragrafo", "console"];

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// ——— Argumentos ———
const args = process.argv.slice(2);
const opcao = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--rota");
const soRota = args.includes("--rota") ? args[args.indexOf("--rota") + 1] : null;
const semFolha = args.includes("--sem-folha") || !!soRota;
if (!opcao || !/^[a-z0-9-]+$/i.test(opcao)) {
  console.error("uso: node capturar.mjs <opcao> [--rota tela+gaveta] [--sem-folha]");
  process.exit(1);
}

/** Primeira porta livre a partir de 8131 (o servidor de outra sessão pode estar na 8131). */
async function portaLivre(inicio = 8131) {
  for (let p = inicio; p < inicio + 50; p++) {
    const livre = await new Promise((ok) => {
      const s = createServer().once("error", () => ok(false)).once("listening", () => s.close(() => ok(true)));
      s.listen(p, "127.0.0.1");
    });
    if (livre) return p;
  }
  throw new Error("nenhuma porta livre entre 8131 e 8180");
}

const nomeArquivo = (i, rota) => `${String(i + 1).padStart(2, "0")}-${rota.replace(/[+@]/g, "--")}`;

/** Espera a página pronta: o prototipo.js marcou data-pronto e as fontes carregaram. */
async function esperarPronta(page) {
  await page.waitForFunction(() => document.documentElement.dataset.pronto === "1", null, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
}

/** Navega até a rota e confirma que a tela (e a gaveta, se houver) trocou de fato: troca só de hash não recarrega. */
async function irPara(page, url, rota) {
  await page.goto(url, { waitUntil: "load" });
  await esperarPronta(page);
  const [resto] = rota.split("@");
  const [tela, gaveta] = resto.split("+");
  await page.waitForFunction(
    ({ tela, gaveta }) => {
      const ativa = document.querySelector(".tela.ativa");
      if (!ativa || ativa.id !== tela) return false;
      const aberta = document.querySelector(".gaveta.aberta");
      return gaveta ? aberta?.id === "g-" + gaveta : !aberta;
    },
    { tela, gaveta: gaveta || null },
    { timeout: 10_000 },
  );
  await pausa(gaveta ? 350 : 120); // a gaveta sobe em 240 ms
  // O prototipo.js foca o título da gaveta (leitor de tela); o anel de foco não é desenho e sairia na captura.
  await page.evaluate(() => document.activeElement?.blur());
}

// ——— Verificação: roda inteira dentro da página, numa função só ———
function verificarNaPagina() {
  const larguraJanela = innerWidth;
  const problemas = { vazamento: [], toque: [], rotulo: [], principal: [], db: [], termo: [], emoji: [], contraste: [], paragrafo: [] };
  const gaveta = document.querySelector(".gaveta.aberta");
  const tela = document.querySelector(".tela.ativa");
  // Com gaveta aberta só ela é verificada: a tela por baixo é verificada na rota sem gaveta.
  const escopos = gaveta ? [gaveta] : tela ? [tela] : [];
  const IGNORAR = ".roteiro, .estado, .veu, [hidden]";

  const palavrasDe = (t) => (t || "").split(/\s+/).filter((p) => /[\p{L}\p{N}]/u.test(p));
  const curto = (t, n = 40) => {
    const s = (t || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  };
  const seletor = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) return s + "#" + el.id;
    const c = [...el.classList].slice(0, 2).join(".");
    return c ? s + "." + c : s;
  };
  const visivel = (el) => {
    if (el.closest(IGNORAR)) return false;
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const elementos = escopos.flatMap((e) => [e, ...e.querySelectorAll("*")]).filter(visivel);

  // Nós de texto visíveis (o pai visível), com o texto já sem espaço sobrando.
  const textos = [];
  for (const e of escopos) {
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode;
      const t = n.textContent.replace(/\s+/g, " ").trim();
      if (!t || !n.parentElement || !visivel(n.parentElement)) continue;
      if (["SCRIPT", "STYLE", "TEMPLATE"].includes(n.parentElement.tagName)) continue;
      textos.push({ no: n, el: n.parentElement, t });
    }
  }

  // vazamento: rolagem horizontal do documento ou caixa além da janela. Quem está dentro de rolagem horizontal própria
  // (carrossel) pode passar da janela de propósito e fica de fora. A .rolagem vertical não conta: overflow-y auto força
  // overflow-x auto no CSS, e o que vaza nela é vazamento de verdade.
  if (document.documentElement.scrollWidth > larguraJanela + 1)
    problemas.vazamento.push({ seletor: "html", texto: `scrollWidth ${document.documentElement.scrollWidth} > ${larguraJanela}` });
  const dentroDeCarrossel = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement)
      if (!p.matches(".rolagem, .corpo, .tela, .gaveta, .aparelho") && /(auto|scroll)/.test(getComputedStyle(p).overflowX)) return true;
    return false;
  };
  for (const el of elementos) {
    if (problemas.vazamento.length >= 5) break;
    const r = el.getBoundingClientRect();
    if ((r.right > larguraJanela + 1 || r.left < -1) && !dentroDeCarrossel(el))
      problemas.vazamento.push({ seletor: seletor(el), texto: curto(el.innerText), esquerda: Math.round(r.left), direita: Math.round(r.right) });
  }

  // toque: alvo menor que 44 × 44.
  const CONTROLES = 'a[href], button, input, textarea, select, [role=button], [role=tab], [role=radio], [role=checkbox], [role=switch]';
  for (const el of elementos) {
    if (!el.matches(CONTROLES)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5)
      problemas.toque.push({ seletor: seletor(el), texto: curto(el.getAttribute("aria-label") || el.innerText || el.value), tamanho: `${Math.round(r.width)}×${Math.round(r.height)}` });
  }

  // rotulo: botão com mais de 3 palavras.
  for (const el of elementos) {
    if (!el.matches("button, .botao, [role=button]")) continue;
    const n = palavrasDe(el.innerText).length;
    if (n > 3) problemas.rotulo.push({ seletor: seletor(el), texto: curto(el.innerText, 60), palavras: n });
  }
  // rotulo, também nas linhas que levam a outro lugar (atalho da opção A, linha da opção B): o nome da linha é o texto
  // em negrito ou o texto solto do elo, sem o apoio ao lado. Linha de dado (sem href) não conta.
  for (const el of elementos) {
    if (!el.matches("a.atalho, a.linha, a.abre, a.elo")) continue;
    const nome = el.querySelector(".linha-texto b") || el.querySelector(".rotulo");
    const texto = nome ? nome.innerText : [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ");
    const n = palavrasDe(texto).length;
    if (n > 3) problemas.rotulo.push({ seletor: seletor(el), texto: curto(texto, 60), palavras: n, linha: true });
  }

  // principal: no máximo um botão laranja visível.
  const principais = elementos.filter((el) => el.matches(".principal"));
  if (principais.length > 1) problemas.principal.push({ quantos: principais.length, textos: principais.map((el) => curto(el.innerText)) });

  // db: todo dB(A) com "estimativa" por perto (até 3 ancestrais).
  for (const { el, t } of textos) {
    if (!t.includes("dB(A)")) continue;
    let ok = false;
    for (let p = el, i = 0; p && i <= 3; p = p.parentElement, i++) if (/estimativa/i.test(p.innerText)) ok = true; // innerText: ignora as telas escondidas
    if (!ok) problemas.db.push({ seletor: seletor(el), texto: curto(t, 60) });
  }

  // termo e emoji, no texto visível.
  const TERMOS = /inteligente|poderos|aqui você|esta análise|esta seção|preço-alvo|preço alvo|ranking|perigos|bairro seguro|mais seguro|menos seguro|lorem/giu;
  // © ® ™ entram na classe Extended_Pictographic, mas são sinais de texto (o crédito "© colaboradores do OpenStreetMap").
  const PERMITIDOS = new Set(["✓", "×", "·", "→", "‹", "›", "↗", "©", "®", "™"]);
  for (const { el, t } of textos) {
    for (const m of t.matchAll(TERMOS)) problemas.termo.push({ termo: m[0], seletor: seletor(el), texto: curto(t, 60) });
    for (const m of t.matchAll(/\p{Extended_Pictographic}/gu))
      if (!PERMITIDOS.has(m[0])) problemas.emoji.push({ emoji: m[0], seletor: seletor(el), texto: curto(t) });
  }

  // contraste (WCAG AA).
  const rgba = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const sobre = (c, f) => ({ r: c.r * c.a + f.r * (1 - c.a), g: c.g * c.a + f.g * (1 - c.a), b: c.b * c.a + f.b * (1 - c.a), a: 1 });
  const lum = ({ r, g, b }) => {
    const l = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
  };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  const vistos = new Set();
  for (const el of elementos) {
    const proprio = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").replace(/\s+/g, " ").trim();
    if (!proprio || !/[\p{L}\p{N}]/u.test(proprio)) continue;
    const cs = getComputedStyle(el);
    const cor = rgba(cs.color);
    if (!cor) continue;
    // Fundo efetivo: as camadas de cima para baixo, até uma opaca; imagem de fundo impede o cálculo.
    const camadas = [];
    let sobreImagem = false;
    let opacidade = 1;
    for (let p = el; p; p = p.parentElement) {
      const ps = getComputedStyle(p);
      opacidade *= parseFloat(ps.opacity);
      if (ps.backgroundImage !== "none") { sobreImagem = true; break; }
      const f = rgba(ps.backgroundColor);
      if (f && f.a > 0) { camadas.push(f); if (f.a >= 1) break; }
    }
    const tamanho = parseFloat(cs.fontSize);
    const chave = `${proprio}|${cs.color}|${sobreImagem ? "img" : camadas.map((c) => hex(c) + c.a).join()}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    if (sobreImagem) continue; // sobre imagem não se calcula; fica fora da contagem
    let fundo = { r: 255, g: 255, b: 255, a: 1 };
    for (const c of camadas.reverse()) fundo = sobre(c, fundo);
    const texto = sobre({ ...cor, a: cor.a * opacidade }, fundo);
    const [a, b] = [lum(texto), lum(fundo)].sort((x, y) => y - x);
    const razao = (a + 0.05) / (b + 0.05);
    const grande = tamanho >= 24 || (tamanho >= 18.66 && parseInt(cs.fontWeight) >= 700);
    if (razao < (grande ? 3 : 4.5))
      problemas.contraste.push({ texto: curto(proprio), cor: hex(texto), fundo: hex(fundo), razao: Number(razao.toFixed(2)), fonte: `${tamanho}px` });
  }

  // paragrafo: só na tela, bloco com mais de 22 palavras (texto próprio + filhos em linha).
  if (!gaveta) {
    const emLinha = (n) => {
      let t = "";
      for (const c of n.childNodes) {
        if (c.nodeType === 3) t += " " + c.textContent;
        else if (c.nodeType === 1 && getComputedStyle(c).display.startsWith("inline") && visivel(c)) t += " " + emLinha(c);
      }
      return t;
    };
    for (const el of elementos) {
      if (getComputedStyle(el).display.startsWith("inline")) continue;
      const t = emLinha(el);
      const n = palavrasDe(t).length;
      if (n > 22) problemas.paragrafo.push({ seletor: seletor(el), palavras: n, texto: curto(t, 60) });
    }
  }

  // palavras: tela + gaveta aberta.
  const contar = (raiz) => {
    let n = 0;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const p = w.currentNode.parentElement;
      if (p && !["SCRIPT", "STYLE", "TEMPLATE"].includes(p.tagName) && visivel(p)) n += palavrasDe(w.currentNode.textContent).length;
    }
    return n;
  };
  const palavras = (tela ? contar(tela) : 0) + (gaveta ? contar(gaveta) : 0);
  return { palavras, problemas };
}

// ——— Execução ———
const porta = await portaLivre();
const servidor = await servir(RAIZ, porta);
const base = `http://127.0.0.1:${porta}${CAMINHO_WEB}/opcao-${opcao}/index.html`;
let browser;
let codigo = 0;
try {
  browser = await lancar();
  const relatorio = { geradoEm: new Date().toISOString(), opcao, rotas: [] };
  let TELAS = null;
  let nomeProto = "";
  const capturas = { 390: [], 360: [] };

  for (const { largura, altura } of LARGURAS) {
    const context = await browser.newContext({
      viewport: { width: largura, height: altura },
      deviceScaleFactor: 2,
      locale: "pt-BR",
      isMobile: true,
      hasTouch: true,
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    let erros = [];
    page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
    // O 404 do favicon.ico é do servidor, não do protótipo.
    page.on("console", (m) => m.type() === "error" && !/favicon\.ico/.test(m.location()?.url || "") && erros.push(`console: ${m.text()} ${m.location()?.url || ""}`.trim()));

    const resp = await page.goto(base, { waitUntil: "load" });
    if (!resp || !resp.ok()) throw new Error(`não abriu ${base} (${resp?.status()})`);
    await esperarPronta(page);
    if (!TELAS) {
      ({ TELAS, nomeProto } = await page.evaluate(() => ({ TELAS: window.TELAS || [], nomeProto: (window.PROTOTIPO || {}).nome || "" })));
      if (!TELAS.length) throw new Error("window.TELAS vazio");
      if (soRota && !TELAS.some((t) => t.rota === soRota)) throw new Error(`rota "${soRota}" não está em window.TELAS`);
    }
    const dir = path.join(PROTOTIPOS, "capturas", opcao, String(largura));
    await mkdir(dir, { recursive: true });

    for (const [i, t] of TELAS.entries()) {
      if (soRota && t.rota !== soRota) continue;
      const nome = nomeArquivo(i, t.rota);
      await irPara(page, `${base}#${t.rota}`, t.rota);
      const arquivo = path.join(dir, `${nome}.png`);
      await page.screenshot({ path: arquivo });
      capturas[largura].push({ arquivo, legenda: `${String(i + 1).padStart(2, "0")} · ${t.nome}`, secundaria: !!t.secundaria });

      const { palavras, problemas } = await page.evaluate(verificarNaPagina);

      // A tira inteira só em 390, numa página à parte (o ?inteira muda o CSS da página toda).
      if (t.inteira && largura === 390) {
        const p2 = await context.newPage();
        p2.on("pageerror", (e) => erros.push(`pageerror (inteira): ${e.message}`));
        await irPara(p2, `${base.replace("index.html", "index.html?inteira")}#${t.rota}`, t.rota);
        const alto = await p2.evaluate(() => document.documentElement.scrollHeight);
        // Acima de 8.000 px a 2× passa do limite de superfície do Chrome (16.384 px): captura a 1×.
        await p2.screenshot({ path: path.join(dir, `${nome}-inteira.png`), fullPage: true, ...(alto > 8000 ? { scale: "css" } : {}) });
        await p2.close();
      }

      problemas.console = erros;
      erros = [];
      relatorio.rotas.push({ rota: t.rota, nome: t.nome, largura, palavras, problemas });
    }
    await context.close();
  }

  // ——— Relatório ———
  const destino = path.join(PROTOTIPOS, soRota ? `verificacao-${opcao}--${soRota.replace(/[+@]/g, "--")}.json` : `verificacao-${opcao}.json`);
  await writeFile(destino, JSON.stringify(relatorio, null, 2), "utf8");

  const abrev = { vazamento: "vaz", toque: "toq", rotulo: "rot", principal: "pri", db: "db", termo: "ter", emoji: "emo", contraste: "con", paragrafo: "par", console: "cns" };
  console.log(`\n${nomeProto || "opção " + opcao} · ${relatorio.rotas.length} capturas verificadas\n`);
  console.log("rota".padEnd(34) + "larg  pal  " + TIPOS.map((k) => abrev[k].padStart(4)).join(""));
  const totais = Object.fromEntries(TIPOS.map((k) => [k, []]));
  for (const r of relatorio.rotas) {
    console.log(r.rota.slice(0, 33).padEnd(34) + String(r.largura).padEnd(6) + String(r.palavras).padStart(3) + "  " + TIPOS.map((k) => String(r.problemas[k].length || "·").padStart(4)).join(""));
    for (const k of TIPOS) for (const o of r.problemas[k]) totais[k].push({ rota: `${r.rota} (${r.largura})`, ...(typeof o === "string" ? { msg: o } : o) });
  }
  console.log("\nTotal por tipo: " + TIPOS.map((k) => `${k} ${totais[k].length}`).join(" · "));
  for (const k of TIPOS) {
    if (!totais[k].length) continue;
    console.log(`\n${k} (${totais[k].length}):`);
    for (const o of totais[k].slice(0, 15)) {
      const { rota, ...resto } = o;
      console.log(`  ${rota}: ${Object.values(resto).map((v) => (Array.isArray(v) ? v.join(" | ") : v)).join(" · ")}`);
    }
  }
  console.log(`\nrelatório: ${path.relative(RAIZ, destino)}`);

  // ——— Folhas de contato ———
  if (!semFolha) {
    // As rotas marcadas `secundaria: true` em window.TELAS (gavetas menores) vão para uma folha à parte, para a folha
    // principal mostrar as telas e os detalhes que decidem a escolha entre as opções.
    const principais = (l) => capturas[l].filter((c) => !c.secundaria);
    const secundarias = capturas[390].filter((c) => c.secundaria);
    const f390 = await montarFolha(principais(390), { saida: path.join(PROTOTIPOS, `folha-de-contato-${opcao}.png`), titulo: `${nomeProto} · 390 × 844`, colunas: 6, largura: 250, escala: 2 });
    const f360 = await montarFolha(capturas[360], { saida: path.join(PROTOTIPOS, `folha-de-contato-${opcao}-360.png`), titulo: `${nomeProto} · 360 × 780 · todas as rotas`, colunas: 8, largura: 200, escala: 2 });
    console.log(`folhas: ${path.relative(RAIZ, f390)}, ${path.relative(RAIZ, f360)}`);
    if (secundarias.length) {
      const fSec = await montarFolha(secundarias, { saida: path.join(PROTOTIPOS, `folha-de-contato-${opcao}-gavetas.png`), titulo: `${nomeProto} · gavetas secundárias · 390 × 844`, colunas: 6, largura: 250, escala: 2 });
      console.log(`folha das gavetas secundárias: ${path.relative(RAIZ, fSec)}`);
    }
  }
} catch (e) {
  console.error("captura falhou:", e?.stack || e);
  codigo = 1;
} finally {
  await browser?.close().catch(() => {});
  await new Promise((ok) => servidor.close(ok));
}
process.exit(codigo);
