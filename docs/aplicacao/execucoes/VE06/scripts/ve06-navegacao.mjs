// VE06 (navigation fix) — reproduces the three ways a person opens a dossier and records which screen/layout appears:
// (1) Início → recent analysis, (2) Salvos → saved analysis, (3) Início and the quick menu → "Dossiês de exemplo".
// Real pilot building, synthetic listing values, isolated Playwright context, 375 × 812.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE06/scripts/ve06-navegacao.mjs <rotulo>
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const rotulo = process.argv[2] ?? "antes";
const saida = path.resolve(`out/ve06/navegacao-${rotulo}`);
await mkdir(saida, { recursive: true });
const pub = await readFile("src/dados/recife/publicacaoGerada.ts", "utf8");
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/boa-viagem.json`, "utf8"));
const e = ix.edificios.find((x) => x.id === "10537-232");
const em = "2026-11-14T12:00:00.000Z";
const val = (valor) => ({ valor, origem: "voce", aConfirmar: false });
const analise = {
  versao: 2, id: "bv", criadaEm: em, atualizadaEm: em, nome: "Apartamento em Boa Viagem (teste)", modalidade: "aluguel", tipologia: "apartamento", bairroTexto: "Boa Viagem", bairro: "boa-viagem",
  logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
  declarados: { preco: val(3000), condominio: val(600), iptu: { ...val(100), periodo: "mes" }, seguroIncendio: val(40), taxaServico: val(null), outros: val(null), area: val(70), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null) },
  vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: ix.geradoEm },
  visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null,
};

const b = await chromium.launch();
const r = { rotulo, fluxos: {}, erros: [] };
const marcas = async (p) => p.evaluate(() => {
  const t = document.body.innerText;
  return {
    url: location.pathname + location.search,
    // O dossiê aprovado: abas Destaques / Entorno / Edifício e o bloco de custo mensal.
    layoutAprovado: ["Destaques", "Entorno", "Edifício"].every((x) => t.includes(x)) && /custo|mês/i.test(t),
    avisoDeExemplo: /exemplo/i.test(t.slice(0, 400)),
    titulo: t.slice(0, 260).replace(/\s+/g, " "),
  };
});
try {
  const c = await b.newContext({ viewport: { width: 375, height: 812 } });
  await c.addInitScript((a) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify([a])); localStorage.setItem("s", "1"); } }, analise);
  const p = await c.newPage();
  p.on("pageerror", (x) => r.erros.push(x.message));

  await p.goto(`${base}/`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  await p.getByText("Apartamento em Boa Viagem (teste)").first().click(); await p.waitForTimeout(2500);
  r.fluxos.recente = await marcas(p); await p.screenshot({ path: path.join(saida, "1-recente.png") });

  await p.goto(`${base}/salvos`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  await p.getByText("Apartamento em Boa Viagem (teste)").first().click(); await p.waitForTimeout(2500);
  r.fluxos.salvos = await marcas(p); await p.screenshot({ path: path.join(saida, "2-salvos.png") });

  await p.goto(`${base}/`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  const cartao = p.getByRole("button", { name: /^Exemplo:/ }).first();
  r.fluxos.exemploNoInicio = (await cartao.count()) ? (await cartao.click(), await p.waitForTimeout(2500), await marcas(p)) : { exposto: false };
  await p.screenshot({ path: path.join(saida, "3-exemplo-inicio.png") });

  await p.goto(`${base}/`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  await p.getByRole("button", { name: /menu/i }).first().click(); await p.waitForTimeout(600);
  const item = p.getByText("Dossiês de exemplo", { exact: true });
  r.fluxos.exemploNoMenu = (await item.count()) ? (await item.first().click(), await p.waitForTimeout(2500), await marcas(p)) : { exposto: false };
  await p.screenshot({ path: path.join(saida, "4-exemplo-menu.png") });

  // Abrir um exemplo ainda exposto, se houver, e voltar à análise da pessoa pelo Início.
  await p.goto(`${base}/`, { waitUntil: "load" }); await p.waitForTimeout(2000);
  await p.getByText("Apartamento em Boa Viagem (teste)").first().click(); await p.waitForTimeout(2500);
  r.fluxos.recenteDeNovo = await marcas(p);
  // A análise salva continua intacta depois dos três fluxos.
  r.analisesDepois = await p.evaluate(() => JSON.parse(localStorage.getItem("vereda-analises-v2") ?? "[]").map((a) => ({ id: a.id, nome: a.nome, salva: a.salva })));
  await c.close();
  // Caderno vazio: é aí que o Início mostrava os cartões de exemplo.
  const v = await b.newContext({ viewport: { width: 375, height: 812 } });
  const pv = await v.newPage();
  pv.on("pageerror", (x) => r.erros.push(x.message));
  await pv.goto(`${base}/`, { waitUntil: "load" }); await pv.waitForTimeout(2500);
  r.fluxos.inicioVazio = { cartoesDeExemplo: await pv.getByRole("button", { name: /^Exemplo:/ }).count(), tituloDosExemplos: await pv.getByText("Dossiês de exemplo", { exact: true }).count() };
  const cv = pv.getByRole("button", { name: /^Exemplo:/ }).first();
  if (await cv.count()) { await cv.click(); await pv.waitForTimeout(2500); r.fluxos.inicioVazio.aoAbrir = await marcas(pv); }
  await pv.screenshot({ path: path.join(saida, "5-inicio-vazio.png") });
  await v.close();
} finally {
  await b.close();
  console.log(JSON.stringify(r, null, 1));
}
