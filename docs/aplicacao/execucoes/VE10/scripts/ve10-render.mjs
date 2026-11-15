// VE10 — rendered check of "Preparar a negociação" (dossier, Destaques) with a realistic notebook: the home on Rua
// Salgueiro (53490-78; condo fee missing, IPTU without period, price change recorded), a second listing of the same flat,
// and two other Boa Viagem homes. Opens the message, types a proposal, copies. 375 and 360 px.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE10/scripts/ve10-render.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve("out/ve10/render");
await mkdir(saida, { recursive: true });
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(await readFile("src/dados/recife/publicacaoGerada.ts", "utf8"))[1];
const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/boa-viagem.json`, "utf8"));
const em = "2026-11-14T12:00:00.000Z";
const val = (valor, mais = {}) => ({ valor, origem: "texto", aConfirmar: false, ...mais });
function analise(id, predioId, nome, d, extra = {}) {
  const e = ix.edificios.find((x) => x.id === predioId);
  return { versao: 2, id, criadaEm: em, atualizadaEm: em, nome, modalidade: "aluguel", tipologia: "apartamento", bairroTexto: "Boa Viagem", bairro: "boa-viagem",
    logradouro: null, numero: null, nomeEdificio: null, url: `https://anuncio.test/${id}`, extracao: null,
    declarados: { preco: val(3000), condominio: val(600), iptu: val(100, { periodo: "mes" }), seguroIncendio: val(40), taxaServico: val(null), outros: val(null), area: val(70), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null), ...d },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: ix.geradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null, ...extra };
}
const caderno = { versao: 1, documentos: [], entidades: [], ocorrencias: [], observacoes: [], cenarios: [], visitas: [], decisao: "considerando", diario: [],
  historicoDoAnuncio: [{ id: "historico-1", em: "2026-10-01T12:00:00.000Z", origem: "nova_extracao", alteracoes: [{ campo: "Preço anunciado", antes: "3.200 · anúncio", depois: "3.000 · anúncio" }] }] };
const outros = ix.edificios.filter((x) => x.id !== "53490-78").slice(0, 2).map((x) => x.id);
const lista = [
  analise("eu", "53490-78", "Apartamento na Rua Salgueiro", { condominio: val(null), iptu: val(288, { periodo: "desconhecido" }) }, { caderno }),
  analise("gemeo", "53490-78", "Mesmo prédio, outro portal", { preco: val(2950) }),
  analise("o1", outros[0], "Outro em Boa Viagem 1", { preco: val(2500), area: val(80) }),
  analise("o2", outros[1], "Outro em Boa Viagem 2", { preco: val(2200), area: val(65) }),
];
const b = await chromium.launch();
const r = { telas: {}, erros: [], externas: [] };
const bloco = (p) => p.evaluate(() => { const t = document.body.innerText; const i = t.indexOf("ANTES DE PROPOR UM VALOR") >= 0 ? t.indexOf("ANTES DE PROPOR UM VALOR") : t.indexOf("Antes de propor um valor"); return i >= 0 ? t.slice(i, i + 2600) : null; });
try {
  for (const largura of [375, 360]) {
    const c = await b.newContext({ viewport: { width: largura, height: 812 }, permissions: ["clipboard-read", "clipboard-write"] });
    await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
    await c.addInitScript((l) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify(l)); localStorage.setItem("vereda-ativa-v1", "eu"); localStorage.setItem("s", "1"); } }, lista);
    const p = await c.newPage();
    p.on("pageerror", (x) => r.erros.push(x.message));
    await p.goto(`${base}/dossie`, { waitUntil: "load" }); await p.waitForTimeout(2500);
    const t = p.getByText("Preparar a negociação.", { exact: true }).first();
    await t.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(saida, `negociacao-${largura}.png`) });
    const antes = await bloco(p);
    await p.getByText("Montar uma mensagem", { exact: true }).first().click(); await p.waitForTimeout(300);
    await p.getByLabel("Sua proposta de aluguel por mês (opcional)").fill("2700"); await p.waitForTimeout(300);
    const mensagem = await p.getByLabel("Mensagem (edite à vontade)").inputValue();
    await p.getByText("Copiar a mensagem", { exact: true }).first().click(); await p.waitForTimeout(600);
    const copiada = await p.evaluate(() => navigator.clipboard.readText().catch(() => null));
    await p.screenshot({ path: path.join(saida, `negociacao-mensagem-${largura}.png`) });
    r.telas[largura] = { antes, mensagem, copiadaIgual: copiada === mensagem, aviso: await p.getByText("Mensagem copiada. Você escolhe onde enviar.").count(),
      rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
    await c.close();
  }
} finally {
  await b.close();
  console.log(JSON.stringify(r, null, 1));
}
