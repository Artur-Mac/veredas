// Régua visual do mapa-base (18/11/2026): fotografa todas as superfícies com mapa do app e mede o svg de cada uma.
// O mesmo roteiro tira as fotos de "antes" (sem mapa-base) e as de "depois" de cada integração, com nomes estáveis
// (<superficie>--<caso>--<largura>--<tema>.png) para pôr lado a lado. Ver ../telas/noite/antes/LEIA.md.
//
//   CI=1 npx expo start --web --port 8095          (noutro terminal; espere a página responder)
//   node docs/aplicacao/mapa-base-2026-11-18/scripts/capturar.mjs --fase antes
//   node .../capturar.mjs --fase depois --superficie gaveta-planta,por-perto --caso golden-tower --largura 375
//
// Parâmetros: --base <url> (padrão http://localhost:8095), --fase antes|depois ou --saida <pasta>, --superficie a,b,
// --caso a,b (ids de casos.json ou dos exemplos), --largura 375,360,1280, --tema claro|escuro (padrão claro; o app é
// sempre claro, "escuro" só emula prefers-color-scheme para provar isso).
// --esperar-fundo <ms> (padrão 20000; 0 desliga): nas superfícies que podem ter o fundo do mapa-base, espera o crédito
// "Base: Prefeitura do Recife (ODbL)" aparecer na moldura (o fundo chega depois do mapa). capturas.json registra "fundo"
// (true/false) e "elementosDoFundo" (elementos dentro de [data-fundo-do-mapa], ou null sem a marca).
// --zoom max: antes da foto, toca "Aproximar o mapa" até o fim; o nome ganha "--zoom-max" (sem o parâmetro, nada muda).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  RAIZ_DA_NOITE,
  abrirNavegador,
  analiseDoCaso,
  esperarMapa,
  esvaziar,
  lerArgumentos,
  lerCasos,
  lista,
  medidasDoFundo,
  novoContexto,
  rolagemHorizontal,
} from "./comum.mjs";

const args = lerArgumentos();
const base = String(args.base || process.env.BASE_URL || "http://localhost:8095").replace(/\/+$/, "");
const fase = args.fase || "antes";
const saida = path.resolve(args.saida || path.join(RAIZ_DA_NOITE, "telas", "noite", fase));
const filtroSuperficie = lista(args.superficie);
const filtroCaso = lista(args.caso);
const temas = lista(args.tema) ?? ["claro"];
const esperarFundoMs = args["esperar-fundo"] === undefined ? 20000 : Number(args["esperar-fundo"]);
const zoomMaximo = args.zoom === "max";
const dados = await lerCasos();
const larguras = (lista(args.largura) ?? dados.larguras).map(Number);
await mkdir(saida, { recursive: true });

const analises = dados.casos.map((c) => analiseDoCaso(c, dados.indiceGeradoEm));
const idDe = (caso) => `captura-${caso.id}`;

/** Na página: sobe da âncora até o primeiro ancestral que tem um svg visível de pelo menos `area` px², e o marca. */
function marcarEscopo({ ancora, area }) {
  for (const el of document.querySelectorAll("[data-captura-escopo]")) el.removeAttribute("data-captura-escopo");
  const a = [...document.querySelectorAll(ancora)].find((el) => el.getBoundingClientRect().width > 0);
  if (!a) return false;
  for (let el = a; el && el !== document.body; el = el.parentElement) {
    const tem = [...el.querySelectorAll("svg")].some((s) => {
      const r = s.getBoundingClientRect();
      return r.width * r.height >= area;
    });
    if (tem) {
      el.setAttribute("data-captura-escopo", "1");
      return true;
    }
  }
  return false;
}

const dossie = (caso) => `/dossie?id=${idDe(caso)}`;
async function abrirDossie(p, caso) {
  await p.goto(base + dossie(caso), { waitUntil: "load" });
  await p.getByRole("button", { name: "Abrir mapa do lote e das obras próximas" }).waitFor({ timeout: 120000 });
}
async function abrirGaveta(p, caso) {
  await abrirDossie(p, caso);
  await p.getByRole("button", { name: "Abrir mapa do lote e das obras próximas" }).click();
  await p.locator('[role="dialog"]').first().waitFor({ timeout: 20000 });
}

// Cada superfície: de onde vêm os casos, como abrir e onde está o mapa (ver lerMapaNaPagina em comum.mjs).
const SUPERFICIES = [
  {
    id: "gaveta-planta",
    tipo: "caso",
    descricao: "Gaveta \"Mapa do lote\" do dossiê, Planta 2D (MapaDoLote em GavetaDoMapa)",
    abrir: abrirGaveta,
    mapa: { escopo: '[role="dialog"]', minimo: 2 },
    fundo: true,
  },
  {
    id: "gaveta-volume",
    tipo: "caso",
    descricao: "Gaveta \"Mapa do lote\", primeiro horário do Volume 2.5D",
    async abrir(p, caso, nota) {
      await abrirGaveta(p, caso);
      const botao = p.locator('[role="dialog"] [aria-label^="Ver mapa: Volume"]').first();
      nota.modo = await botao.getAttribute("aria-label");
      await botao.click();
      await p.locator('[role="dialog"] [aria-label^="Ver mapa: Volume"][aria-checked="true"]').first().waitFor({ timeout: 10000 });
    },
    mapa: { escopo: '[role="dialog"]', minimo: 2 },
  },
  {
    id: "por-perto",
    tipo: "caso",
    descricao: "\"Por perto\" na aba Entorno, botão \"Ver no mapa\" (PorPerto usa MapaDoLote com pontos)",
    async abrir(p, caso) {
      await abrirDossie(p, caso);
      await p.getByRole("tab", { name: "Entorno", exact: true }).click();
      const ver = p.getByRole("button", { name: "Ver pontos por perto no mapa" });
      await ver.waitFor({ timeout: 60000 });
      await ver.scrollIntoViewIfNeeded();
      await ver.click();
      await p.getByRole("button", { name: "Ocultar mapa do entorno" }).waitFor({ timeout: 10000 });
      await p.waitForFunction(marcarEscopo, { ancora: '[aria-label="Ocultar mapa do entorno"]', area: 20000 }, { timeout: 30000 });
    },
    mapa: { escopo: "[data-captura-escopo]", minimo: 2 },
    fundo: true,
  },
  {
    id: "predio",
    tipo: "caso",
    descricao: "Confirmação do prédio, rota /predio (MapaDoPredio)",
    async abrir(p, caso) {
      await p.goto(`${base}/predio?id=${idDe(caso)}`, { waitUntil: "load" });
      await p.getByText("É este o prédio?").first().waitFor({ timeout: 120000 });
    },
    mapa: { minimo: 2 },
    fundo: true,
  },
  {
    id: "miniatura-inicio",
    tipo: "caso",
    descricao: "Miniatura do lote no cartão da aba inicial (src/app/(abas)/index.tsx)",
    async abrir(p, caso) {
      await p.goto(`${base}/`, { waitUntil: "load" });
      const ancora = `[aria-label^="${caso.nome}."]`;
      await p.locator(ancora).first().waitFor({ timeout: 120000 });
      await p.locator(ancora).first().scrollIntoViewIfNeeded();
      await p.waitForFunction(marcarEscopo, { ancora, area: 3000 }, { timeout: 30000 });
    },
    mapa: { escopo: "[data-captura-escopo]", minimo: 1 },
  },
  {
    id: "miniatura-comparar",
    tipo: "caso",
    descricao: "Miniatura no cartão \"Imóvel 1\" do Comparar (comparar/CartaoDoImovel.tsx); o par é o caso seguinte",
    async abrir(p, caso) {
      const i = dados.casos.findIndex((c) => c.id === caso.id);
      const par = dados.casos[(i + 1) % dados.casos.length];
      await p.goto(`${base}/comparar?ids=${idDe(caso)},${idDe(par)}`, { waitUntil: "load" });
      const ancora = '[aria-label^="Imóvel 1: "]';
      await p.locator(ancora).first().waitFor({ timeout: 120000 });
      await p.waitForFunction(marcarEscopo, { ancora, area: 3000 }, { timeout: 30000 });
    },
    mapa: { escopo: "[data-captura-escopo]", minimo: 1 },
  },
  {
    id: "miniatura-visita",
    tipo: "caso",
    descricao: "Miniatura no cartão do imóvel da Visita (visita-v1/CartaoDoImovel.tsx)",
    async abrir(p) {
      await p.goto(`${base}/visita`, { waitUntil: "load" });
      const ancora = '[aria-label="Trocar imóvel da visita"]';
      await p.locator(ancora).first().waitFor({ timeout: 120000 });
      await p.waitForFunction(marcarEscopo, { ancora, area: 2000 }, { timeout: 30000 });
    },
    mapa: { escopo: "[data-captura-escopo]", minimo: 1 },
  },
  {
    id: "miniatura-visita-no-imovel",
    tipo: "caso",
    descricao: "Visita no modo \"No imóvel\": o painel de campo é o único lugar sob TemaEscuro; o cartão com a miniatura fica fora dele",
    async abrir(p) {
      await p.goto(`${base}/visita`, { waitUntil: "load" });
      const ancora = '[aria-label="Trocar imóvel da visita"]';
      await p.locator(ancora).first().waitFor({ timeout: 120000 });
      await p.getByText("No imóvel", { exact: true }).first().click();
      await p.waitForTimeout(300);
      await p.evaluate(() => scrollTo(0, 0));
      await p.waitForFunction(marcarEscopo, { ancora, area: 2000 }, { timeout: 30000 });
    },
    mapa: { escopo: "[data-captura-escopo]", minimo: 1 },
  },
  {
    id: "miniatura-topo",
    tipo: "caso",
    descricao: "Topo do dossiê sem fotos: contorno do lote (dossie-v1/Topo.tsx)",
    async abrir(p, caso) {
      await abrirDossie(p, caso);
      await p.evaluate(() => scrollTo(0, 0));
    },
    // O botão "Abrir mapa" fica no topo; o topo é o ancestral dele que tem o desenho do lote.
    async preparar(p) {
      await p.waitForFunction(marcarEscopo, { ancora: '[aria-label="Abrir mapa do lote e das obras próximas"]', area: 3000 }, { timeout: 30000 });
    },
    mapa: { escopo: "[data-captura-escopo]", minimo: 1 },
  },
  {
    id: "exemplo-mapa",
    tipo: "exemplo",
    descricao: "Aba Mapa do dossiê de exemplo (componentes/mapa/Mapa.tsx)",
    async abrir(p, id) {
      await p.goto(`${base}/exemplos/${id}/mapa`, { waitUntil: "load" });
    },
    mapa: { minimo: 5 },
    fundo: true,
  },
  {
    id: "exemplo-topo",
    tipo: "exemplo",
    descricao: "Topo do dossiê de exemplo (componentes/dossie/Topo.tsx, Mapa com raio de 500 m)",
    async abrir(p, id) {
      await p.goto(`${base}/exemplos/${id}`, { waitUntil: "load" });
    },
    mapa: { minimo: 5 },
    fundo: true,
  },
  {
    id: "exemplo-caminhos",
    tipo: "detalhe",
    descricao: "Caminhos do dossiê de exemplo, com \"Adicionar destino\" aberto (o mapa só aparece aí; exemplos/[id]/caminhos.tsx)",
    async abrir(p, id) {
      await p.goto(`${base}/exemplos/${id}/caminhos`, { waitUntil: "load" });
      await p.getByRole("button", { name: /Adicionar destino/ }).first().click({ timeout: 120000 });
    },
    mapa: { minimo: 5 },
    fundo: true,
  },
  {
    id: "exemplo-confirmar-lote",
    tipo: "detalhe",
    descricao: "Confirmar lote do dossiê de exemplo (exemplos/[id]/confirmar-lote.tsx)",
    async abrir(p, id) {
      await p.goto(`${base}/exemplos/${id}/confirmar-lote`, { waitUntil: "load" });
    },
    mapa: { minimo: 5 },
    fundo: true,
  },
];

const escolhidas = SUPERFICIES.filter((s) => !filtroSuperficie || filtroSuperficie.includes(s.id));
const caminhoDoJson = path.join(saida, "capturas.json");
let anteriores = [];
try {
  anteriores = JSON.parse(await readFile(caminhoDoJson, "utf8")).capturas ?? [];
} catch {
  anteriores = [];
}
const novas = [];

/** Grupos de trabalho: um contexto de navegador por (tema, largura, caso), reaproveitado pelas superfícies dele. */
function grupos() {
  const r = [];
  for (const tema of temas)
    for (const largura of larguras) {
      for (const caso of dados.casos) {
        if (filtroCaso && !filtroCaso.includes(caso.id)) continue;
        const sup = escolhidas.filter((s) => s.tipo === "caso");
        if (sup.length) r.push({ tema, largura, chave: caso.id, caso, sup, ativa: idDe(caso) });
      }
      for (const id of dados.exemplos) {
        if (filtroCaso && !filtroCaso.includes(id)) continue;
        const sup = escolhidas.filter((s) => s.tipo === "exemplo" || (s.tipo === "detalhe" && id === dados.exemploDeDetalhe));
        if (sup.length) r.push({ tema, largura, chave: id, caso: id, sup, ativa: null });
      }
    }
  return r;
}

const navegador = await abrirNavegador();
const inicio = Date.now();
try {
  for (const g of grupos()) {
    const { contexto, pagina, registro } = await novoContexto(navegador, { base, largura: g.largura, analises, ativa: g.ativa, tema: g.tema });
    try {
      for (const s of g.sup) {
        const nome = `${s.id}--${g.chave}--${g.largura}--${g.tema}${zoomMaximo ? "--zoom-max" : ""}`;
        esvaziar(registro);
        const nota = {};
        const item = { arquivo: `${nome}.png`, tela: null, superficie: s.id, descricao: s.descricao, caso: g.chave, largura: g.largura, tema: g.tema, ...(zoomMaximo ? { zoom: "max" } : {}) };
        try {
          await s.abrir(pagina, g.caso, nota);
          if (s.preparar) await s.preparar(pagina);
          const opcoesDoMapa = { ...s.mapa, esperarFundoMs: s.fundo ? esperarFundoMs : 0 };
          let mapa = await esperarMapa(pagina, opcoesDoMapa);
          if (zoomMaximo) {
            const mais = pagina.locator('[data-captura-alvo] [aria-label="Aproximar o mapa"]').first();
            for (let i = 0; i < 8 && (await mais.count()) && !(await mais.isDisabled().catch(() => true)); i++) await mais.click();
            nota.zoomTocado = true;
            mapa = await esperarMapa(pagina, opcoesDoMapa);
          }
          const alvo = pagina.locator("[data-captura-alvo]").first();
          if (await alvo.count()) await alvo.scrollIntoViewIfNeeded().catch(() => undefined);
          // Releitura depois de rolar: a moldura pode ter mudado de posição.
          if (g.largura === 375) {
            item.tela = `${nome}--tela.png`;
            await pagina.screenshot({ path: path.join(saida, item.tela) });
          }
          if (await alvo.count()) await alvo.screenshot({ path: path.join(saida, item.arquivo) });
          else {
            item.arquivo = null;
            if (!item.tela) {
              item.tela = `${nome}--tela.png`;
              await pagina.screenshot({ path: path.join(saida, item.tela) });
            }
          }
          Object.assign(item, {
            estado: mapa.achou ? "ok" : "sem_mapa",
            motivo: mapa.motivo ?? null,
            esperaMs: mapa.esperaMs,
            moldura: mapa.moldura ?? null,
            svgs: mapa.svgs ?? 0,
            elementos: mapa.elementos ?? { total: 0, porTipo: {} },
            fundo: mapa.fundo ?? false,
            elementosDoFundo: mapa.elementosDoFundo ?? null,
            motivoDoFundo: mapa.motivoDoFundo ?? null,
            fundoDoMapa: await medidasDoFundo(pagina),
            rolagemHorizontal: await rolagemHorizontal(pagina),
            ...nota,
          });
        } catch (e) {
          item.estado = "erro";
          item.motivo = String(e?.message ?? e).split("\n")[0].slice(0, 300);
          item.tela = `${nome}--erro.png`;
          await pagina.screenshot({ path: path.join(saida, item.tela) }).catch(() => undefined);
          item.rolagemHorizontal = await rolagemHorizontal(pagina).catch(() => null);
        }
        item.errosDeConsole = [...registro.console];
        item.avisosDeConsole = registro.avisos.length;
        item.requisicoesFalhas = [...registro.falhas];
        item.externasBloqueadas = [...registro.externas];
        novas.push(item);
        console.log(`${item.estado.padEnd(8)} ${nome}  svg=${item.elementos?.total ?? "-"} fundo=${item.fundo ?? "-"}/${item.elementosDoFundo ?? "-"} rolagem=${item.rolagemHorizontal} erros=${item.errosDeConsole.length} falhas=${item.requisicoesFalhas.length} externas=${item.externasBloqueadas.length}${item.motivo ? `  (${item.motivo})` : ""}`);
      }
    } finally {
      await contexto.close();
    }
  }
} finally {
  await navegador.close();
  const chave = (c) => `${c.superficie}--${c.caso}--${c.largura}--${c.tema}${c.zoom === "max" ? "--zoom-max" : ""}`;
  const trocadas = new Set(novas.map(chave));
  const capturas = [...anteriores.filter((c) => !trocadas.has(chave(c))), ...novas].sort((a, b) => chave(a).localeCompare(chave(b)));
  await writeFile(
    caminhoDoJson,
    JSON.stringify({ geradoEm: new Date().toISOString(), base, fase, casos: "casos.json", total: capturas.length, capturas }, null, 1) + "\n",
  );
  const ruins = novas.filter((c) => c.estado !== "ok");
  console.log(`\n${novas.length} capturas nesta rodada (${ruins.length} fora do estado ok) em ${Math.round((Date.now() - inicio) / 1000)} s; ${capturas.length} no total em ${caminhoDoJson}`);
  if (ruins.length) process.exitCode = 1;
}
