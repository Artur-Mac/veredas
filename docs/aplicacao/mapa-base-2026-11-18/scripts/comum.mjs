// Apoio da régua visual do mapa-base (18/11/2026): casos, análises de teste, navegador, rede e a leitura do mapa na página.
// Usado por capturar.mjs e medir.mjs. Não depende do código do app: abre o app pelo navegador, como uma pessoa.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ_DA_NOITE = path.resolve(AQUI, "..");

export async function lerCasos() {
  return JSON.parse(await readFile(path.join(AQUI, "casos.json"), "utf8"));
}

/** Lê `--chave valor` e `--chave=valor`; `--bandeira` sozinha vira true. */
export function lerArgumentos(argv = process.argv.slice(2)) {
  const r = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const [k, v] = a.slice(2).split("=");
    if (v !== undefined) r[k] = v;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) r[k] = argv[++i];
    else r[k] = true;
  }
  return r;
}

/**
 * Entrada segura dos roteiros que gravam fotos e medidas (capturar.mjs, medir.mjs). Em 18/11/2026 um `--help` que o
 * roteiro não conhecia rodou tudo contra uma porta fora do ar e gravou fotos de erro na pasta de antes (versionada).
 * - `--help`/`--ajuda`: imprime o uso e sai sem fazer nada; parâmetro desconhecido (ou solto) é erro, com o uso.
 * - Sem `--fase` nem `--saida`: recusa. A pasta de antes (telas/noite/antes) só é gravada se ainda não tem nenhum
 *   dos `arquivosQueProtegem`, a não ser com `--sobrescrever` (o app de antes não existe mais para refazer as fotos).
 * - O servidor tem de responder antes de qualquer gravação (nem a pasta é criada antes disso).
 * Devolve { args, base, fase, saida }. Sai do processo (código 0 no uso, 2 no erro de uso, 1 no resto) quando recusa.
 */
export async function prepararExecucao({ uso, conhecidos, arquivosQueProtegem, argv = process.argv.slice(2) }) {
  const aceitos = new Set([...conhecidos, "base", "fase", "saida", "sobrescrever", "help", "ajuda"]);
  const sair = (codigo, mensagem) => {
    if (mensagem) console.error(`Erro: ${mensagem}\n`);
    (codigo === 0 ? console.log : console.error)(uso.trim());
    process.exit(codigo);
  };
  const soltos = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && !argv[i - 1].includes("=")));
  const args = lerArgumentos(argv);
  if (args.help || args.ajuda) sair(0);
  const desconhecidos = Object.keys(args).filter((k) => !aceitos.has(k));
  if (desconhecidos.length) sair(2, `parâmetro desconhecido: ${desconhecidos.map((k) => `--${k}`).join(", ")}`);
  if (soltos.length) sair(2, `parâmetro sem nome: ${soltos.join(" ")}`);
  if (typeof args.fase !== "string" && typeof args.saida !== "string") {
    sair(2, "diga onde gravar: --saida <pasta> (rodadas de trabalho) ou --fase antes|depois (as pastas da régua em telas/noite/).");
  }
  if (args.fase !== undefined && !["antes", "depois"].includes(args.fase)) sair(2, `--fase ${args.fase}: use antes ou depois.`);
  const fase = typeof args.fase === "string" ? args.fase : "depois";
  const saida = path.resolve(typeof args.saida === "string" ? args.saida : path.join(RAIZ_DA_NOITE, "telas", "noite", fase));
  const pastaDeAntes = path.resolve(RAIZ_DA_NOITE, "telas", "noite", "antes");
  if (path.relative(pastaDeAntes, saida) === "" && !args.sobrescrever) {
    const ja = arquivosQueProtegem.filter((a) => existsSync(path.join(pastaDeAntes, a)));
    if (ja.length) {
      console.error(`Erro: a pasta de antes já tem ${ja.join(", ")} (fotos e medidas de um app que não existe mais). Nada foi gravado.`);
      console.error("Use --saida <outra pasta> para uma rodada de trabalho, ou --sobrescrever se for mesmo para regravar a pasta de antes.");
      process.exit(2);
    }
  }
  const base = String(args.base || process.env.BASE_URL || "http://localhost:8095").replace(/\/+$/, "");
  try {
    const r = await fetch(base, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    console.error(`Erro: o servidor ${base} não respondeu (${e?.cause?.code ?? e?.message ?? e}). Nada foi gravado.`);
    console.error("Suba o app (npx expo start --web --port <porta>) e passe --base http://localhost:<porta>.");
    process.exit(1);
  }
  return { args, base, fase, saida };
}

export const lista = (v) => (typeof v === "string" && v ? v.split(",").map((s) => s.trim()).filter(Boolean) : null);

const AGORA = "2026-11-18T03:00:00.000Z";
const nulo = () => ({ valor: null, origem: "voce", aConfirmar: false });

/** AnaliseV2 sem foto e sem extração, com o vínculo confirmado no prédio do caso (src/dados/contratos.ts). */
export function analiseDoCaso(caso, indiceGeradoEm) {
  return {
    versao: 2,
    id: `captura-${caso.id}`,
    criadaEm: AGORA,
    atualizadaEm: AGORA,
    nome: caso.nome,
    modalidade: "compra",
    tipologia: "apartamento",
    url: "",
    bairroTexto: caso.bairroTexto,
    bairro: caso.bairro,
    logradouro: caso.logradouro,
    numero: caso.numero,
    nomeEdificio: caso.nome,
    extracao: null,
    declarados: {
      preco: nulo(),
      condominio: nulo(),
      iptu: { ...nulo(), periodo: "ano" },
      seguroIncendio: nulo(),
      taxaServico: nulo(),
      outros: nulo(),
      area: nulo(),
      quartos: nulo(),
      suites: nulo(),
      banheiros: nulo(),
      vagas: nulo(),
      andar: nulo(),
    },
    vinculo: { estado: "confirmado", edificioId: caso.edificioId, dsqfl: caso.dsqfl, confirmadoEm: AGORA, indiceGeradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true,
    descarte: null,
  };
}

export async function abrirNavegador() {
  return chromium.launch({ channel: "chrome", args: ["--disable-extensions"] });
}

/**
 * Contexto com as análises dos casos no localStorage (gravadas a cada carga: estado sempre conhecido), a ativa escolhida,
 * a rede para fora da origem bloqueada e contada, e os erros guardados em `registro`.
 */
export async function novoContexto(navegador, { base, largura, altura, analises, ativa, tema = "claro" }) {
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: altura ?? (largura >= 1000 ? 800 : 812) },
    deviceScaleFactor: 1,
    colorScheme: tema === "escuro" ? "dark" : "light",
    locale: "pt-BR",
    timezoneId: "America/Recife",
  });
  const origem = new URL(base).origin;
  const registro = { externas: [], falhas: [], console: [], avisos: [] };
  await contexto.route("**/*", (q) => {
    const u = q.request().url();
    if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === origem) return q.continue();
    registro.externas.push(u);
    return q.abort("blockedbyclient");
  });
  await contexto.addInitScript(
    ({ analises, ativa }) => {
      try {
        localStorage.setItem("vereda-analises-v2", JSON.stringify(analises));
        if (ativa) localStorage.setItem("vereda-ativa-v1", ativa);
      } catch {
        /* sem armazenamento: a tela mostra o vazio, e a foto denuncia */
      }
    },
    { analises, ativa },
  );
  const pagina = await contexto.newPage();
  pagina.on("pageerror", (x) => registro.console.push(`pageerror: ${x.message}`.slice(0, 300)));
  pagina.on("console", (m) => {
    if (m.type() === "error") registro.console.push(m.text().slice(0, 300));
    else if (m.type() === "warning") registro.avisos.push(m.text().slice(0, 300));
  });
  pagina.on("requestfailed", (q) => {
    const u = q.url();
    if (new URL(u).origin !== origem) return; // as externas já foram contadas como bloqueadas
    registro.falhas.push(`${q.failure()?.errorText ?? "?"} ${u}`.slice(0, 300));
  });
  pagina.on("response", (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === origem) registro.falhas.push(`HTTP ${r.status()} ${r.url()}`.slice(0, 300));
  });
  return { contexto, pagina, registro };
}

/** Zera o registro entre fotos do mesmo contexto. */
export function esvaziar(registro) {
  for (const k of Object.keys(registro)) registro[k] = [];
}

/**
 * Na página: acha o mapa da superfície e o marca com `data-captura-alvo`. O mapa é o maior <svg> visível dentro do escopo
 * (ou o elemento do seletor `alvo`); a moldura é o primeiro ancestral com overflow escondido do tamanho do svg (o quadro
 * que a pessoa vê, com pinos e obras por cima). Conta os elementos de todos os <svg> dentro da moldura.
 */
export function lerMapaNaPagina({ escopo, alvo, minimo }) {
  for (const el of document.querySelectorAll("[data-captura-alvo]")) el.removeAttribute("data-captura-alvo");
  const visivel = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none";
  };
  let raizes = [document];
  if (escopo) raizes = [...document.querySelectorAll(escopo)].filter(visivel);
  if (raizes.length === 0) return { achou: false, motivo: `escopo ${escopo} não visível` };
  let moldura = null;
  let svgPrincipal = null;
  if (alvo) {
    moldura = raizes.flatMap((r) => [...r.querySelectorAll(alvo)]).find(visivel) ?? null;
    svgPrincipal = moldura ? [...moldura.querySelectorAll("svg")].filter(visivel).sort((a, b) => area(b) - area(a))[0] ?? null : null;
  } else {
    const svgs = raizes.flatMap((r) => [...r.querySelectorAll("svg")]).filter(visivel);
    svgPrincipal = svgs.sort((a, b) => area(b) - area(a))[0] ?? null;
    if (svgPrincipal) {
      moldura = svgPrincipal;
      const a0 = area(svgPrincipal);
      for (let el = svgPrincipal.parentElement; el && el !== document.body; el = el.parentElement) {
        if (area(el) > a0 * 1.8) break;
        moldura = el;
        if (getComputedStyle(el).overflow === "hidden" && area(el) >= a0 * 0.9) break;
      }
    }
  }
  function area(el) {
    const r = el.getBoundingClientRect();
    return r.width * r.height;
  }
  if (!moldura || !svgPrincipal) return { achou: false, motivo: "nenhum svg visível no escopo" };
  moldura.setAttribute("data-captura-alvo", "1");
  const porTipo = {};
  let total = 0;
  const svgsNaMoldura = moldura.tagName.toLowerCase() === "svg" ? [moldura] : [...moldura.querySelectorAll("svg")];
  for (const s of svgsNaMoldura) {
    for (const el of s.querySelectorAll("*")) {
      const t = el.tagName.toLowerCase();
      porTipo[t] = (porTipo[t] ?? 0) + 1;
      total++;
    }
  }
  const r = moldura.getBoundingClientRect();
  const rs = svgPrincipal.getBoundingClientRect();
  const desenhado = svgPrincipal.querySelectorAll("path,polygon,polyline,rect,circle,line,text,image").length;
  // Fundo do mapa-base: o crédito obrigatório dentro da moldura diz que ele está na tela. Os elementos do fundo são
  // contados dentro do grupo marcado com data-fundo-do-mapa (quem hospeda marca; sem a marca, null).
  const fundo = [...moldura.querySelectorAll("*")].some((el) => el.childElementCount === 0 && (el.textContent ?? "").trim() === "Base: Prefeitura do Recife (ODbL)");
  const gruposDoFundo = [...moldura.querySelectorAll("[data-fundo-do-mapa]")];
  const elementosDoFundo = gruposDoFundo.length ? gruposDoFundo.reduce((n, g) => n + 1 + g.querySelectorAll("*").length, 0) : null;
  return {
    achou: desenhado >= (minimo ?? 1),
    motivo: desenhado >= (minimo ?? 1) ? null : `só ${desenhado} formas no svg`,
    moldura: { x: Math.round(r.x), y: Math.round(r.y + scrollY), largura: Math.round(r.width), altura: Math.round(r.height) },
    svg: { largura: Math.round(rs.width), altura: Math.round(rs.height) },
    svgs: svgsNaMoldura.length,
    elementos: { total, porTipo: Object.fromEntries(Object.entries(porTipo).sort()) },
    fundo,
    elementosDoFundo,
    assinatura: `${total}|${Math.round(r.width)}x${Math.round(r.height)}|${desenhado}|${fundo ? "fundo" : "-"}`,
  };
}

/**
 * Espera o mapa ficar desenhado e parado: mesma assinatura em 3 leituras seguidas (250 ms), com formas desenhadas.
 * Com `opcoes.esperarFundoMs` > 0, o fundo do mapa-base chega depois do mapa (carga assíncrona): parado sem o fundo, a
 * espera continua até ele aparecer ou até esse tempo passar (contado do primeiro quadro parado); o resultado diz `fundo`.
 */
export async function esperarMapa(pagina, opcoes, limiteMs = 60000) {
  const inicio = Date.now();
  let anterior = null;
  let iguais = 0;
  let ultimo = null;
  let paradoSemFundoDesde = null;
  const esperarFundoMs = Number(opcoes?.esperarFundoMs ?? 0);
  while (Date.now() - inicio < limiteMs) {
    ultimo = await pagina.evaluate(lerMapaNaPagina, opcoes).catch((e) => ({ achou: false, motivo: String(e).slice(0, 200) }));
    if (ultimo.achou && ultimo.assinatura === anterior) iguais++;
    else iguais = 0;
    anterior = ultimo.achou ? ultimo.assinatura : null;
    if (iguais >= 2) {
      if (ultimo.fundo || esperarFundoMs <= 0) return { ...ultimo, esperaMs: Date.now() - inicio };
      paradoSemFundoDesde ??= Date.now();
      if (Date.now() - paradoSemFundoDesde >= esperarFundoMs) return { ...ultimo, esperaMs: Date.now() - inicio, motivoDoFundo: `fundo não apareceu em ${esperarFundoMs} ms` };
    }
    await pagina.waitForTimeout(250);
  }
  return { ...(ultimo ?? { achou: false }), achou: false, motivo: `tempo esgotado (${limiteMs} ms): ${ultimo?.motivo ?? "?"}`, esperaMs: Date.now() - inicio };
}

export async function medidasDoFundo(pagina) {
  return pagina
    .evaluate(() => performance.getEntriesByName("fundo-do-mapa").map((e) => ({ tipo: e.entryType, inicio: Math.round(e.startTime * 10) / 10, duracao: Math.round(e.duration * 10) / 10, detalhe: e.detail ?? null })))
    .catch(() => []);
}

export async function rolagemHorizontal(pagina) {
  return pagina.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
