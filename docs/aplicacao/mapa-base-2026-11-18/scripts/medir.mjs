// Desempenho e sem rede da régua do mapa-base (18/11/2026).
//
//   node docs/aplicacao/mapa-base-2026-11-18/scripts/medir.mjs --fase antes                 (os dois modos)
//   node .../medir.mjs --fase depois --modo desempenho --vezes 7
//   node .../medir.mjs --fase depois --modo offline
//
// Desempenho: CPU 4× mais lenta (CDP Emulation.setCPUThrottlingRate), dossiê do Golden Tower já carregado; mede do toque
// (timeStamp do pointerdown) até o primeiro quadro (requestAnimationFrame) em que o svg do mapa tem formas desenhadas, e
// lê as marcas performance "fundo-do-mapa" quando existirem. Cada repetição recarrega a página (abre a frio a superfície).
// Sem rede: abre o dossiê e a gaveta com rede, fecha, corta a rede (context.setOffline) e reabre a gaveta e o Por perto.
// Grava desempenho.json e offline.json (e as fotos do offline) na pasta da fase.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  RAIZ_DA_NOITE,
  abrirNavegador,
  analiseDoCaso,
  esperarMapa,
  lerArgumentos,
  lerCasos,
  medidasDoFundo,
  novoContexto,
} from "./comum.mjs";

const args = lerArgumentos();
const base = String(args.base || process.env.BASE_URL || "http://localhost:8095").replace(/\/+$/, "");
const fase = args.fase || "antes";
const saida = path.resolve(args.saida || path.join(RAIZ_DA_NOITE, "telas", "noite", fase));
const modo = args.modo || "tudo";
const vezes = Number(args.vezes || 5);
const largura = Number(args.largura || 375);
const dados = await lerCasos();
const caso = dados.casos.find((c) => c.id === (args.caso || "golden-tower"));
const analises = dados.casos.map((c) => analiseDoCaso(c, dados.indiceGeradoEm));
const id = `captura-${caso.id}`;
await mkdir(saida, { recursive: true });

const BOTAO_GAVETA = "Abrir mapa do lote e das obras próximas";

/** Na página: arma a medição antes do toque. Resolve em window.__medida com o tempo do toque ao primeiro quadro com mapa. */
function armar({ escopo, minimo }) {
  window.__medida = null;
  let toque = null;
  const aoTocar = (e) => {
    if (toque === null) toque = e.timeStamp;
  };
  document.addEventListener("pointerdown", aoTocar, { capture: true, once: true });
  const limite = performance.now() + 60000;
  // Só conta svg que nasceu depois do toque: um mapa que já estava na tela não vale como "desenhado".
  const jaExistiam = new Set(document.querySelectorAll("svg"));
  const formas = () => {
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
    return svgMaior && melhor > 20000 ? svgMaior.querySelectorAll("path,polygon,polyline,rect,circle,line,text").length : 0;
  };
  const quadro = (t) => {
    if (toque !== null && formas() >= minimo) {
      // O svg está no DOM neste quadro; o quadro seguinte começa depois de ele ter sido pintado.
      const noDom = performance.now();
      requestAnimationFrame(() => {
        const pintado = performance.now();
        window.__medida = { toqueAoQuadroMs: Math.round((pintado - toque) * 10) / 10, toqueAoDomMs: Math.round((noDom - toque) * 10) / 10 };
      });
      return;
    }
    if (t > limite) {
      window.__medida = { erro: "tempo esgotado" };
      return;
    }
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

async function medirUma(pagina, cdp, superficie) {
  await pagina.goto(`${base}/dossie?id=${id}`, { waitUntil: "load" });
  await pagina.getByRole("button", { name: BOTAO_GAVETA }).waitFor({ timeout: 120000 });
  await pagina.waitForTimeout(1500); // o dossiê termina de assentar antes de ligar o freio de CPU
  let botao;
  let escopo;
  if (superficie === "gaveta") {
    botao = pagina.getByRole("button", { name: BOTAO_GAVETA });
    escopo = '[role="dialog"]';
  } else {
    await pagina.getByRole("tab", { name: "Entorno", exact: true }).click();
    botao = pagina.getByRole("button", { name: "Ver pontos por perto no mapa" });
    await botao.waitFor({ timeout: 60000 });
    await botao.scrollIntoViewIfNeeded();
    await pagina.waitForTimeout(800);
    escopo = null;
  }
  await pagina.evaluate(() => performance.clearMarks?.("fundo-do-mapa") ?? undefined).catch(() => undefined);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  try {
    await pagina.evaluate(armar, { escopo, minimo: 2 });
    await botao.click();
    await pagina.waitForFunction(() => window.__medida !== null, null, { timeout: 120000 });
    const medida = await pagina.evaluate(() => window.__medida);
    return { ...medida, fundoDoMapa: await medidasDoFundo(pagina) };
  } finally {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  }
}

/** Fecha a gaveta pelo teclado (Esc), como a gaveta prevê; o fundo que fecha por toque não é botão. */
async function fecharGaveta(pagina) {
  await pagina.keyboard.press("Escape");
  const fechou = await pagina.locator('[role="dialog"]').first().waitFor({ state: "detached", timeout: 5000 }).then(() => true, () => false);
  if (!fechou) await pagina.locator('[aria-label="Fechar gaveta"]').first().click({ position: { x: 10, y: 10 } });
}

const mediana = (v) => {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? Math.round((s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) * 10) / 10 : null;
};

const navegador = await abrirNavegador();
try {
  if (modo === "tudo" || modo === "desempenho") {
    const resultado = { geradoEm: new Date().toISOString(), base, caso: caso.id, largura, cpu: "4x (Emulation.setCPUThrottlingRate)", vezes, superficies: {} };
    for (const superficie of ["gaveta", "por-perto"]) {
      const { contexto, pagina, registro } = await novoContexto(navegador, { base, largura, analises, ativa: id });
      const cdp = await contexto.newCDPSession(pagina);
      const rodadas = [];
      try {
        for (let i = 0; i < vezes; i++) rodadas.push(await medirUma(pagina, cdp, superficie));
      } finally {
        await contexto.close();
      }
      const tempos = rodadas.map((r) => r.toqueAoQuadroMs).filter((x) => typeof x === "number");
      const fundos = rodadas.flatMap((r) => r.fundoDoMapa.map((f) => f.duracao));
      resultado.superficies[superficie] = {
        toqueAoQuadroMs: { mediana: mediana(tempos), pior: tempos.length ? Math.max(...tempos) : null, todas: tempos },
        toqueAoDomMs: rodadas.map((r) => r.toqueAoDomMs ?? null),
        fundoDoMapaMs: fundos.length ? { mediana: mediana(fundos), pior: Math.max(...fundos), todas: fundos } : null,
        erros: rodadas.filter((r) => r.erro).map((r) => r.erro),
        errosDeConsole: registro.console.length,
        requisicoesFalhas: registro.falhas.length,
        externasBloqueadas: registro.externas.length,
      };
      console.log(superficie, JSON.stringify(resultado.superficies[superficie].toqueAoQuadroMs), "fundo:", JSON.stringify(resultado.superficies[superficie].fundoDoMapaMs));
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
