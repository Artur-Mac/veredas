// VE00.01 — one real published building per pilot area through the actual web UI.
//
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE00/scripts/ve00-pilot-journey.mjs
//
// Requires an Expo web server already running at POC_URL (this script never starts or stops one).
// For each pilot area: paste a fixture listing link + listing text whose address is a dev-split G-BUILDING building,
// "Encontrar o prédio", pick the building (suggestion or street+number search), confirm, open the dossier tabs, open
// the visit tab; then compare two same-tenure analyses, reload and verify persistence. Listing values are synthetic
// fixtures in an isolated Playwright context (fresh storage); nothing touches a real notebook. The context is given
// 6 credits through local storage so five confirmations fit (the product default is 3 — recorded as a test setup).
// Writes screenshots to out/ve00/pilot-journey/ and a JSON result to stdout.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const origem = new URL(base).origin;
const saida = path.resolve(process.env.JOURNEY_OUT || "out/ve00/pilot-journey");
await mkdir(saida, { recursive: true });

const gb = JSON.parse(await readFile("docs/aplicacao/evaluation-sets/g-building.json", "utf8"));
const ORDEM = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];
const NOMES = { "boa-viagem": "Boa Viagem", "casa-forte": "Casa Forte", gracas: "Graças", espinheiro: "Espinheiro", madalena: "Madalena" };
const PREFERENCIA = { ordinary: 0, multi_front: 1, sparse: 2, far_centroid: 3 };
const predios = ORDEM.map((area) => {
  const dev = gb.buildings.filter((b) => b.area === area && b.split === "dev").sort((a, b) => PREFERENCIA[a.stratum] - PREFERENCIA[b.stratum]);
  assert(dev.length > 0, `sem prédio dev em ${area}`);
  return dev[0];
});
const EXPANDE = [[/^AV /, "Avenida "], [/^EST /, "Estrada "], [/^RUA /, "Rua "], [/^TV /, "Travessa "], [/^PCA /, "Praça "]];
const titulo = (s) => s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
function ruaLegivel(logradouro) {
  let r = logradouro;
  for (const [re, sub] of EXPANDE) r = r.replace(re, sub);
  return titulo(r);
}
const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function esperar(cond, desc, ms = 15_000) {
  const fim = Date.now() + ms;
  let erro = null;
  while (Date.now() < fim) {
    try { if (await cond()) return; } catch (e) { erro = e; }
    await pausa(120);
  }
  throw new Error(`Tempo esgotado: ${desc}${erro ? ` (${erro.message.split("\n")[0]})` : ""}`);
}
async function textoVisivel(page) {
  return page.evaluate(() => {
    const ocultos = [...document.querySelectorAll('[aria-hidden="true"]')];
    const g = ocultos.map((el) => [el, el.style.display]);
    for (const el of ocultos) el.style.display = "none";
    const t = document.body.innerText;
    for (const [el, d] of g) el.style.display = d;
    return t;
  });
}
const esperarTexto = (page, t, ms) => esperar(async () => (await textoVisivel(page)).includes(t), `texto "${t}"`, ms);
const esperarRota = (page, r, ms) => esperar(() => new URL(page.url()).pathname === r, `rota ${r} (em ${new URL(page.url()).pathname})`, ms);

const resultado = { base, iniciado: new Date().toISOString(), areas: [], comparacao: null, recarga: null, externas: [], errosDePagina: [], consoleErros: [] };
let n = 0;
async function foto(page, nome) {
  n += 1;
  const arquivo = `${String(n).padStart(2, "0")}-${nome}.png`;
  await pausa(300);
  await page.screenshot({ path: path.join(saida, arquivo) });
  const largura = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  return { arquivo, rolagemHorizontalPx: largura };
}

const navegador = await chromium.launch({ headless: true });
const contexto = await navegador.newContext({ viewport: { width: 375, height: 812 } });
await contexto.route("**/*", (r) => {
  const u = r.request().url();
  if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === origem) return r.continue();
  resultado.externas.push(new URL(u).origin);
  return r.abort();
});
await contexto.addInitScript(() => {
  if (!localStorage.getItem("ve00-inicializado")) {
    const em = new Date().toISOString();
    // esquemaCarteira (src/dados/contratos.ts): delta ≤ 3 per entry, so 3 initial + 3 "recarga_de_teste".
    localStorage.setItem("vereda-carteira-v1", JSON.stringify({ saldo: 6, extrato: [
      { em, tipo: "cota_inicial", analiseId: null, delta: 3 },
      { em, tipo: "recarga_de_teste", analiseId: null, delta: 3 },
    ] }));
    localStorage.setItem("ve00-inicializado", "sim");
  }
});
const page = await contexto.newPage();
page.setDefaultTimeout(20_000);
page.on("pageerror", (e) => resultado.errosDePagina.push(e.message));
page.on("console", (m) => { if (m.type() === "error") resultado.consoleErros.push(m.text().slice(0, 300)); });

try {
  const t0 = Date.now();
  await page.goto(`${base}/`, { waitUntil: "load", timeout: 180_000 });
  await page.getByRole("button", { name: "Colar link", exact: true }).waitFor({ timeout: 180_000 });
  resultado.primeiraCargaMs = Date.now() - t0;

  for (const [i, p] of predios.entries()) {
    const area = p.area;
    const bairro = NOMES[area];
    const rua = ruaLegivel(p.logradouro);
    const registro = { area, predio: p.id, estrato: p.stratum, endereco: `${rua}, ${p.numero}`, etapas: [], capturas: [] };
    resultado.areas.push(registro);
    try {
      await page.getByRole("tab", { name: "Explorar", exact: true }).click();
      await esperarRota(page, "/");
      const slug = semAcento(bairro).replace(/\s+/g, "-");
      const link = `https://www.zapimoveis.com.br/imovel/aluguel-apartamento-2-quartos-${slug}-recife-pe-70m2-id-27999990${i + 10}/`;
      await page.getByRole("textbox", { name: "Link do anúncio do imóvel" }).fill(link);
      await page.getByRole("button", { name: "Gerar Dossiê", exact: true }).click();
      await esperarRota(page, "/ler");
      registro.etapas.push("link lido");
      const aluguel = 2800 + 100 * i;
      const texto = [
        "Apartamento com 2 quartos para alugar, 70 m²",
        `${rua}, ${p.numero} - ${bairro}, Recife - PE`,
        "Aluguel", `R$ ${aluguel.toLocaleString("pt-BR")}`, "Condomínio", "R$ 600", "IPTU", "R$ 100 /mês", "70 m²", "2 quartos",
      ].join("\n");
      await page.getByRole("textbox", { name: "Texto do anúncio" }).fill(texto);
      await page.getByRole("button", { name: "Ler texto", exact: true }).click();
      await pausa(600);
      registro.capturas.push(await foto(page, `${area}-ler`));
      registro.etapas.push("texto lido");
      await page.getByRole("button", { name: "Encontrar o prédio", exact: true }).click();
      await esperarRota(page, "/predio");
      await esperarTexto(page, "Cadastro imobiliário · Prefeitura do Recife").catch(() => {});
      const telaDoPredio = semAcento(await textoVisivel(page));
      const sugeriu = (await page.getByRole("button", { name: "É este prédio", exact: true }).count()) > 0
        && telaDoPredio.includes(semAcento(`, ${p.numero}`));
      registro.sugestaoAutomatica = sugeriu;
      if (!sugeriu) {
        const busca = page.getByRole("textbox", { name: "Buscar por rua, número ou nome do prédio", exact: true });
        if ((await busca.count()) === 0) {
          // Some states hide the search behind "Examinar sugestões" / other candidates; record and try the button.
          const outro = page.getByRole("button", { name: /Não é este|Outro prédio|Buscar outro/ });
          if ((await outro.count()) > 0) await outro.first().click();
        }
        await page.getByRole("textbox", { name: "Buscar por rua, número ou nome do prédio", exact: true }).fill(`${p.logradouro} ${p.numero}`);
        await esperar(async () => (await page.getByRole("button", { name: /^Escolher / }).count()) > 0, "resultados da busca");
        const rotulos = await page.getByRole("button", { name: /^Escolher / }).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
        registro.resultadosDaBusca = rotulos.length;
        const alvo = rotulos.find((r) => new RegExp(`, ${p.numero}(?: ·|$)`).test(r) && (!p.nome || semAcento(r).includes(semAcento(p.nome))))
          ?? rotulos.find((r) => new RegExp(`, ${p.numero}(?: ·|$)`).test(r));
        assert(alvo, `busca não achou ${p.logradouro} ${p.numero}: ${JSON.stringify(rotulos.slice(0, 5))}`);
        await page.getByRole("button", { name: alvo, exact: true }).click();
      }
      registro.capturas.push(await foto(page, `${area}-predio`));
      const tConfirma = Date.now();
      await page.getByRole("button", { name: "É este prédio", exact: true }).click();
      await esperarRota(page, "/dossie");
      await esperarTexto(page, "Lote confirmado ✓");
      registro.dossieAposConfirmarMs = Date.now() - tConfirma;
      registro.etapas.push("prédio confirmado");
      const destaques = await textoVisivel(page);
      registro.dossieMostraEndereco = semAcento(destaques).includes(semAcento(`${p.numero}`));
      registro.capturas.push(await foto(page, `${area}-dossie-destaques`));
      for (const aba of ["Entorno", "Edifício"]) {
        await page.getByRole("tab", { name: aba, exact: true }).click();
        await esperar(async () => (await page.getByRole("tab", { name: aba, exact: true }).getAttribute("aria-selected")) === "true", `aba ${aba}`);
        await pausa(400);
        const t = await textoVisivel(page);
        registro[`aba${aba === "Entorno" ? "Entorno" : "Edificio"}`] = {
          temARua: /a rua/i.test(t), tem156: /156/.test(t), temDefesaCivil: /Defesa Civil/i.test(t), temObras: /obras/i.test(t), temFonte: /Prefeitura do Recife|IBGE|Ver fonte/.test(t), caracteres: t.length,
          aConfirmar: (t.match(/A confirmar|a confirmar/g) || []).length,
        };
        registro.capturas.push(await foto(page, `${area}-dossie-${semAcento(aba)}`));
      }
      await page.getByRole("tab", { name: "Visita", exact: true }).click();
      await pausa(600);
      const visita = await textoVisivel(page);
      registro.visitaAbre = visita.length > 0 && !/Erro|erro inesperado/.test(visita);
      registro.capturas.push(await foto(page, `${area}-visita`));
      registro.etapas.push("dossiê e visita");
      registro.ok = true;
    } catch (e) {
      registro.ok = false;
      registro.erro = e.message.split("\n")[0];
      registro.capturas.push(await foto(page, `${area}-falha`).catch(() => null));
    }
  }

  // Compare Boa Viagem with Madalena (both rent).
  try {
    await page.getByRole("tab", { name: "Comparar", exact: true }).click();
    await esperarRota(page, "/comparar");
    await page.getByRole("radio", { name: "Alugar", exact: true }).click();
    await page.getByRole("button", { name: /^Imóvel 1: / }).waitFor();
    const nomes = async (s) => (await page.getByRole("button", { name: new RegExp(`^Imóvel ${s}: `) }).getAttribute("aria-label"));
    const t = await textoVisivel(page);
    resultado.comparacao = {
      imovel1: await nomes(1), imovel2: await nomes(2),
      mostraMensal: /Mensal conhecido|mensal/i.test(t), caracteres: t.length,
      capturas: [await foto(page, "comparar-custo")],
    };
    for (const aba of ["Espaço", "Entorno"]) {
      await page.getByRole("tab", { name: aba, exact: true }).click();
      await pausa(400);
      resultado.comparacao.capturas.push(await foto(page, `comparar-${semAcento(aba)}`));
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    resultado.comparacao.capturas.push(await foto(page, "comparar-entorno-1280"));
    await page.setViewportSize({ width: 375, height: 812 });
  } catch (e) {
    resultado.comparacao = { erro: e.message.split("\n")[0] };
  }

  // Reload: analyses and links persist.
  try {
    const tRecarga = Date.now();
    await page.reload({ waitUntil: "load" });
    await page.getByRole("tab", { name: "Explorar", exact: true }).waitFor({ timeout: 60_000 });
    resultado.rotaAposRecarga = new URL(page.url()).pathname;
    resultado.recargaMs = Date.now() - tRecarga;
    const caderno = await page.evaluate(() => JSON.parse(localStorage.getItem("vereda-analises-v2") || "null"));
    const lista = Array.isArray(caderno) ? caderno : caderno?.analises ?? [];
    resultado.recarga = {
      analises: lista.length,
      confirmadas: lista.filter((a) => a?.vinculo?.estado === "confirmado").length,
      bairros: [...new Set(lista.map((a) => a?.bairro))],
      edificios: lista.map((a) => a?.vinculo?.edificioId ?? null),
    };
    resultado.recarga.capturas = [await foto(page, "explorar-apos-recarga")];
  } catch (e) {
    resultado.recarga = { erro: e.message.split("\n")[0] };
  }
} finally {
  resultado.terminado = new Date().toISOString();
  await navegador.close();
  console.log(JSON.stringify(resultado, null, 1));
}
