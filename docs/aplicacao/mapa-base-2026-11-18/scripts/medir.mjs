// Desempenho e sem rede da régua do mapa-base (18/11/2026).
//
//   node docs/aplicacao/mapa-base-2026-11-18/scripts/medir.mjs --saida <pasta>              (os dois modos; --help: uso)
//   node .../medir.mjs --fase depois --modo desempenho --vezes 7
//   node .../medir.mjs --fase depois --modo offline
//
// Desempenho: CPU 4× mais lenta (CDP Emulation.setCPUThrottlingRate), dossiê do Golden Tower já carregado; mede do toque
// (timeStamp do pointerdown) até o primeiro quadro (requestAnimationFrame) em que o svg do mapa tem formas desenhadas e até
// o quadro com o fundo do mapa-base, e lê as medidas performance de cada etapa ("fundo-do-mapa:ler", "fundo-do-mapa",
// "fundo-do-mapa:desenhar"). Cada repetição recarrega a página e abre a superfície duas vezes (primeira e segunda
// abertura); tudo de novo com o fundo desligado pela chave de medição globalThis.__veredaSemFundoDoMapa (addInitScript).
// O custo do fundo é a segunda abertura com o fundo menos a segunda sem ele.
// Sem rede: abre o dossiê e a gaveta com rede, fecha, corta a rede (context.setOffline) e reabre a gaveta e o Por perto.
// Grava desempenho.json e offline.json (e as fotos do offline) na pasta de --saida ou da fase (a de antes só com
// --sobrescrever); recusa parâmetro desconhecido e sai antes de gravar se o servidor não responde.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  abrirNavegador,
  analiseDoCaso,
  esperarMapa,
  lerCasos,
  medidasDoFundo,
  novoContexto,
  prepararExecucao,
} from "./comum.mjs";

const USO = `
Uso: node docs/aplicacao/mapa-base-2026-11-18/scripts/medir.mjs --saida <pasta> [opções]
     node docs/aplicacao/mapa-base-2026-11-18/scripts/medir.mjs --fase antes|depois [opções]

  --saida <pasta>        onde gravar desempenho.json, offline.json e as fotos do offline
  --fase antes|depois    grava em telas/noite/<fase>. A pasta de antes já tem as medidas: só com --sobrescrever
  --sobrescrever         permite regravar a pasta de antes (o app de antes não existe mais: quase nunca é o que se quer)
  --base <url>           o app no ar (padrão http://localhost:8095); sem resposta, o roteiro sai antes de gravar
  --modo tudo|desempenho|offline      --vezes <n> (padrão 5)      --largura <px> (padrão 375)      --caso <id>
  --help, --ajuda        mostra este uso e sai sem fazer nada
`;
const { args, base, saida } = await prepararExecucao({
  uso: USO,
  conhecidos: ["modo", "vezes", "largura", "caso"],
  arquivosQueProtegem: ["desempenho.json", "offline.json"],
});
const modo = args.modo || "tudo";
const vezes = Number(args.vezes || 5);
const largura = Number(args.largura || 375);
const dados = await lerCasos();
const caso = dados.casos.find((c) => c.id === (args.caso || "golden-tower"));
const analises = dados.casos.map((c) => analiseDoCaso(c, dados.indiceGeradoEm));
const id = `captura-${caso.id}`;
await mkdir(saida, { recursive: true });

const BOTAO_GAVETA = "Abrir mapa do lote e das obras próximas";

/**
 * Na página: arma a medição antes do toque. Resolve em window.__medida com o tempo do toque ao primeiro quadro com mapa
 * (toqueAoQuadroMs, como sempre foi) e, com `esperarFundo`, ao primeiro quadro com o fundo do mapa-base na tela
 * (toqueAoFundoMs: o grupo marcado data-fundo-do-mapa-raiz dentro de um svg novo).
 */
function armar({ escopo, minimo, esperarFundo }) {
  window.__medida = null;
  let toque = null;
  const aoTocar = (e) => {
    if (toque === null) toque = e.timeStamp;
  };
  document.addEventListener("pointerdown", aoTocar, { capture: true, once: true });
  const limite = performance.now() + 60000;
  // Só conta svg que nasceu depois do toque: um mapa que já estava na tela não vale como "desenhado".
  const jaExistiam = new Set(document.querySelectorAll("svg"));
  const maior = () => {
    const raizes = escopo ? [...document.querySelectorAll(escopo)] : [document];
    let melhor = 0;
    let svgMaior = null;
    for (const r of raizes)
      for (const s of r.querySelectorAll("svg")) {
        if (jaExistiam.has(s)) continue;
        const b = s.getBoundingClientRect();
        if (b.width * b.height > melhor) {
          melhor = b.width * b.height;
          svgMaior = s;
        }
      }
    return svgMaior && melhor > 20000 ? svgMaior : null;
  };
  const r1 = (x) => Math.round(x * 10) / 10;
  let mapa = null;
  let fundo = null;
  const quadro = (t) => {
    if (toque !== null) {
      const svg = maior();
      const agora = performance.now();
      if (mapa === null && svg && svg.querySelectorAll("path,polygon,polyline,rect,circle,line,text").length >= minimo) mapa = { dom: agora };
      if (esperarFundo && fundo === null && svg && svg.querySelector("[data-fundo-do-mapa-raiz], [data-testid='fundo-do-mapa']")) fundo = { dom: agora };
      const pronto = mapa !== null && (!esperarFundo || fundo !== null);
      if (pronto) {
        // O svg está no DOM neste quadro; o quadro seguinte começa depois de ele ter sido pintado.
        requestAnimationFrame(() => {
          const pintado = performance.now();
          window.__medida = {
            toqueAoDomMs: r1(mapa.dom - toque),
            toqueAoQuadroMs: r1((mapa.pintado ?? pintado) - toque),
            toqueAoFundoMs: fundo ? r1(pintado - toque) : null,
            toqueAoFundoNoDomMs: fundo ? r1(fundo.dom - toque) : null,
          };
        });
        return;
      }
      if (mapa !== null && mapa.pintado === undefined && mapa.dom < agora) mapa.pintado = agora;
    }
    if (t > limite) {
      window.__medida = { erro: "tempo esgotado" };
      return;
    }
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

const ETAPAS = ["fundo-do-mapa:ler", "fundo-do-mapa", "fundo-do-mapa:desenhar"];

/** As medidas performance de cada etapa do fundo desde a última limpeza (soma e lista por etapa). */
async function etapasDoFundo(pagina) {
  return pagina.evaluate((nomes) => {
    const r = {};
    for (const n of nomes) {
      const d = performance.getEntriesByName(n, "measure").map((e) => Math.round(e.duration * 10) / 10);
      r[n] = { vezes: d.length, somaMs: Math.round(d.reduce((a, b) => a + b, 0) * 10) / 10, todas: d };
    }
    return r;
  }, ETAPAS);
}

async function abrirSuperficie(pagina, superficie) {
  if (superficie === "gaveta") return { botao: pagina.getByRole("button", { name: BOTAO_GAVETA }), escopo: '[role="dialog"]' };
  const aba = pagina.getByRole("tab", { name: "Entorno", exact: true });
  if ((await aba.getAttribute("aria-selected").catch(() => null)) !== "true") await aba.click();
  const botao = pagina.getByRole("button", { name: "Ver pontos por perto no mapa" });
  await botao.waitFor({ timeout: 60000 });
  await botao.scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(800);
  return { botao, escopo: null };
}

async function fecharSuperficie(pagina, superficie) {
  if (superficie === "gaveta") {
    await fecharGaveta(pagina);
    await pagina.locator('[role="dialog"]').first().waitFor({ state: "detached", timeout: 10000 }).catch(() => undefined);
  } else {
    await pagina.getByRole("button", { name: "Ocultar mapa do entorno" }).click();
  }
  await pagina.waitForTimeout(800);
}

/** Uma abertura medida, com a CPU 4× mais lenta só durante o toque e o desenho. */
async function medirAbertura(pagina, cdp, superficie, comFundo) {
  const { botao, escopo } = await abrirSuperficie(pagina, superficie);
  await pagina.evaluate(() => {
    performance.clearMarks?.();
    performance.clearMeasures?.();
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  try {
    await pagina.evaluate(armar, { escopo, minimo: 2, esperarFundo: comFundo });
    await botao.click();
    await pagina.waitForFunction(() => window.__medida !== null, null, { timeout: 120000 });
    const medida = await pagina.evaluate(() => window.__medida);
    // "fundo-do-mapa:desenhar" fecha no quadro seguinte ao do desenho: espera um pouco por ela.
    if (comFundo) await pagina.waitForFunction(() => performance.getEntriesByName("fundo-do-mapa:desenhar").length > 0, null, { timeout: 3000 }).catch(() => undefined);
    return { ...medida, etapas: await etapasDoFundo(pagina), fundoDoMapa: await medidasDoFundo(pagina) };
  } finally {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  }
}

/**
 * Cada repetição recarrega a página e abre a superfície duas vezes: a primeira (inclui baixar e ler os arquivos do
 * mapa-base) e a segunda, na mesma página (arquivos já em memória; a cena pode vir da memória do gancho).
 */
async function medirRepeticao(pagina, cdp, superficie, comFundo) {
  await pagina.goto(`${base}/dossie?id=${id}`, { waitUntil: "load" });
  await pagina.getByRole("button", { name: BOTAO_GAVETA }).waitFor({ timeout: 120000 });
  await pagina.waitForTimeout(1500); // o dossiê termina de assentar antes de ligar o freio de CPU
  const primeira = await medirAbertura(pagina, cdp, superficie, comFundo);
  await pagina.waitForTimeout(comFundo ? 1500 : 500);
  await fecharSuperficie(pagina, superficie);
  const segunda = await medirAbertura(pagina, cdp, superficie, comFundo);
  await fecharSuperficie(pagina, superficie).catch(() => undefined);
  return { primeira, segunda };
}

/** Fecha a gaveta pelo teclado (Esc), como a gaveta prevê; o fundo que fecha por toque não é botão. */
async function fecharGaveta(pagina) {
  await pagina.keyboard.press("Escape");
  const fechou = await pagina.locator('[role="dialog"]').first().waitFor({ state: "detached", timeout: 5000 }).then(() => true, () => false);
  if (!fechou) await pagina.locator('[aria-label="Fechar gaveta"]').first().click({ position: { x: 10, y: 10 } });
}

const mediana = (v) => {
  const s = [...v].filter((x) => typeof x === "number").sort((a, b) => a - b);
  return s.length ? Math.round((s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) * 10) / 10 : null;
};
const resumo = (v) => {
  const n = v.filter((x) => typeof x === "number");
  return { mediana: mediana(n), pior: n.length ? Math.max(...n) : null, todas: v };
};

/** Resumo de uma série de aberturas: do toque ao mapa, ao fundo, e cada etapa do fundo (soma por abertura). */
function resumir(aberturas, comFundo) {
  const r = {
    toqueAoQuadroMs: resumo(aberturas.map((a) => a.toqueAoQuadroMs ?? null)),
    toqueAoDomMs: resumo(aberturas.map((a) => a.toqueAoDomMs ?? null)),
    erros: aberturas.filter((a) => a.erro).map((a) => a.erro),
  };
  if (comFundo) {
    r.toqueAoFundoMs = resumo(aberturas.map((a) => a.toqueAoFundoMs ?? null));
    r.etapasMs = Object.fromEntries(
      ETAPAS.map((n) => [n, { medianaDaSoma: mediana(aberturas.map((a) => a.etapas?.[n]?.somaMs ?? null)), vezesPorAbertura: aberturas.map((a) => a.etapas?.[n]?.vezes ?? 0), somas: aberturas.map((a) => a.etapas?.[n]?.somaMs ?? null) }]),
    );
  }
  return r;
}

const navegador = await abrirNavegador();
try {
  if (modo === "tudo" || modo === "desempenho") {
    const resultado = {
      geradoEm: new Date().toISOString(),
      base,
      caso: caso.id,
      largura,
      cpu: "4x (Emulation.setCPUThrottlingRate)",
      vezes,
      superficies: {},
      comoLer:
        "toqueAoQuadroMs: do toque ao primeiro quadro pintado com o mapa (sem esperar o fundo). toqueAoFundoMs: do toque ao quadro pintado com o fundo do mapa-base. " +
        "primeira: abertura logo depois de recarregar (baixa e lê os arquivos); segunda: reabertura na mesma página. semFundo: com globalThis.__veredaSemFundoDoMapa. " +
        "custoDoFundoMs = mediana(segunda com fundo, toqueAoFundoMs) − mediana(segunda sem fundo, toqueAoQuadroMs): o número do portão.",
    };
    for (const superficie of ["gaveta", "por-perto"]) {
      const sup = {};
      for (const comFundo of [true, false]) {
        const { contexto, pagina, registro } = await novoContexto(navegador, { base, largura, analises, ativa: id });
        if (!comFundo) await contexto.addInitScript(() => { globalThis.__veredaSemFundoDoMapa = true; });
        const cdp = await contexto.newCDPSession(pagina);
        const rodadas = [];
        try {
          for (let i = 0; i < vezes; i++) rodadas.push(await medirRepeticao(pagina, cdp, superficie, comFundo));
        } finally {
          await contexto.close();
        }
        const chave = comFundo ? "comFundo" : "semFundo";
        sup[chave] = {
          primeira: resumir(rodadas.map((r) => r.primeira), comFundo),
          segunda: resumir(rodadas.map((r) => r.segunda), comFundo),
          errosDeConsole: registro.console.length,
          requisicoesFalhas: registro.falhas.length,
          externasBloqueadas: registro.externas.length,
        };
        console.log(superficie, chave, "1ª", JSON.stringify(sup[chave].primeira.toqueAoFundoMs ?? sup[chave].primeira.toqueAoQuadroMs), "2ª", JSON.stringify(sup[chave].segunda.toqueAoFundoMs ?? sup[chave].segunda.toqueAoQuadroMs));
        if (comFundo) console.log("  etapas 1ª", JSON.stringify(sup[chave].primeira.etapasMs), "\n  etapas 2ª", JSON.stringify(sup[chave].segunda.etapasMs));
      }
      const com = sup.comFundo;
      const fundos = [...com.primeira.etapasMs["fundo-do-mapa"].somas, ...com.segunda.etapasMs["fundo-do-mapa"].somas].filter((x) => typeof x === "number" && x > 0);
      resultado.superficies[superficie] = {
        // Chaves de antes (primeira abertura com o fundo, cada repetição recarrega a página), com o mesmo sentido.
        toqueAoQuadroMs: com.primeira.toqueAoQuadroMs,
        toqueAoDomMs: com.primeira.toqueAoDomMs.todas,
        fundoDoMapaMs: fundos.length ? { mediana: mediana(fundos), pior: Math.max(...fundos), todas: fundos } : null,
        erros: [...com.primeira.erros, ...com.segunda.erros, ...sup.semFundo.primeira.erros, ...sup.semFundo.segunda.erros],
        errosDeConsole: com.errosDeConsole + sup.semFundo.errosDeConsole,
        requisicoesFalhas: com.requisicoesFalhas + sup.semFundo.requisicoesFalhas,
        externasBloqueadas: com.externasBloqueadas + sup.semFundo.externasBloqueadas,
        // Novas (desempenho, 18/11/2026).
        aberturas: sup,
        custoDoFundoMs: {
          segunda: com.segunda.toqueAoFundoMs.mediana !== null && sup.semFundo.segunda.toqueAoQuadroMs.mediana !== null ? Math.round((com.segunda.toqueAoFundoMs.mediana - sup.semFundo.segunda.toqueAoQuadroMs.mediana) * 10) / 10 : null,
          primeira: com.primeira.toqueAoFundoMs.mediana !== null && sup.semFundo.primeira.toqueAoQuadroMs.mediana !== null ? Math.round((com.primeira.toqueAoFundoMs.mediana - sup.semFundo.primeira.toqueAoQuadroMs.mediana) * 10) / 10 : null,
        },
      };
      console.log(superficie, "custo do fundo", JSON.stringify(resultado.superficies[superficie].custoDoFundoMs));
    }
    await writeFile(path.join(saida, "desempenho.json"), JSON.stringify(resultado, null, 1) + "\n");
  }

  if (modo === "tudo" || modo === "offline") {
    const { contexto, pagina, registro } = await novoContexto(navegador, { base, largura, analises, ativa: id });
    const r = { geradoEm: new Date().toISOString(), base, caso: caso.id, largura, passos: [] };
    try {
      const botao = pagina.getByRole("button", { name: BOTAO_GAVETA });
      await pagina.goto(`${base}/dossie?id=${id}`, { waitUntil: "load" });
      await botao.waitFor({ timeout: 120000 });
      await botao.click();
      const comRede = await esperarMapa(pagina, { escopo: '[role="dialog"]', minimo: 2 });
      r.passos.push({ passo: "gaveta com rede", mapa: comRede.achou, elementos: comRede.elementos?.total ?? 0, fundoDoMapa: await medidasDoFundo(pagina) });
      await fecharGaveta(pagina);
      await pagina.locator('[role="dialog"]').first().waitFor({ state: "detached", timeout: 10000 }).catch(() => undefined);
      await contexto.setOffline(true);
      const antesDasFalhas = registro.falhas.length;
      await botao.click();
      const semRede = await esperarMapa(pagina, { escopo: '[role="dialog"]', minimo: 2 }, 20000);
      await pagina.screenshot({ path: path.join(saida, `offline--gaveta-planta--${caso.id}--${largura}--claro--tela.png`) });
      r.passos.push({ passo: "gaveta sem rede", mapa: semRede.achou, motivo: semRede.motivo ?? null, elementos: semRede.elementos?.total ?? 0, fundoDoMapa: await medidasDoFundo(pagina), falhasNovas: registro.falhas.slice(antesDasFalhas) });
      await fecharGaveta(pagina);
      await pagina.locator('[role="dialog"]').first().waitFor({ state: "detached", timeout: 10000 }).catch(() => undefined);
      const f2 = registro.falhas.length;
      await pagina.getByRole("tab", { name: "Entorno", exact: true }).click();
      const ver = pagina.getByRole("button", { name: "Ver pontos por perto no mapa" });
      const temBotao = await ver.waitFor({ timeout: 20000 }).then(() => true, () => false);
      if (temBotao) {
        await ver.scrollIntoViewIfNeeded();
        await ver.click();
        await pagina.waitForTimeout(500);
        const pp = await esperarMapa(pagina, { minimo: 2 }, 20000);
        await pagina.screenshot({ path: path.join(saida, `offline--por-perto--${caso.id}--${largura}--claro--tela.png`) });
        r.passos.push({ passo: "por perto sem rede", mapa: pp.achou, motivo: pp.motivo ?? null, elementos: pp.elementos?.total ?? 0, fundoDoMapa: await medidasDoFundo(pagina), falhasNovas: registro.falhas.slice(f2) });
      } else {
        await pagina.screenshot({ path: path.join(saida, `offline--por-perto--${caso.id}--${largura}--claro--tela.png`) });
        r.passos.push({ passo: "por perto sem rede", mapa: false, motivo: "botão \"Ver no mapa\" não apareceu sem rede", falhasNovas: registro.falhas.slice(f2) });
      }
      // Recarregar a página sem rede: sem service worker, o servidor some e a página não volta. Registrado para a fase final.
      const recarga = await pagina.reload({ timeout: 15000 }).then(() => "carregou", (e) => String(e.message).split("\n")[0].slice(0, 160));
      r.passos.push({ passo: "recarregar a página sem rede", resultado: recarga });
    } finally {
      r.errosDeConsole = registro.console;
      r.externasBloqueadas = registro.externas.length;
      await contexto.close();
    }
    for (const p of r.passos) console.log(p.passo, p.mapa ?? p.resultado, p.elementos ?? "", p.motivo ?? "");
    await writeFile(path.join(saida, "offline.json"), JSON.stringify(r, null, 1) + "\n");
  }
} finally {
  await navegador.close();
}
