// VE09 — rendered check of "Desde que você guardou" (dossier, Destaques), real building 53490-78 (Rua Salgueiro, Boa
// Viagem). Case A: a snapshot built from the OLDER published index (5bad409c, before the outreach split) with a condo fee of
// R$ 550, so the page must show one listing change first and the Defesa Civil reclassification as base corrections; then
// "Marcar como visto hoje". Case B: an unsaved analysis; "Salvar imóvel" must store a snapshot. 375 and 360 px.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE09/scripts/ve09-render.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { retrato } from "../../../../../src/dados/memoria.ts";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve("out/ve09/render");
await mkdir(saida, { recursive: true });
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(await readFile("src/dados/recife/publicacaoGerada.ts", "utf8"))[1];
const atual = JSON.parse(await readFile(`src/dados/recife/${dir}/boa-viagem.json`, "utf8"));
const antigo = JSON.parse(await readFile("src/dados/recife/indice-municipal/5bad409c1782ca8a/boa-viagem.json", "utf8"));
const ID = "53490-78";
const e = atual.edificios.find((x) => x.id === ID);
const em = "2026-11-14T12:00:00.000Z";
const val = (valor) => ({ valor, origem: "voce", aConfirmar: false });
const analise = (id, salva, memoria) => ({
  versao: 2, id, criadaEm: em, atualizadaEm: em, nome: `Rua Salgueiro (teste ${id})`, modalidade: "aluguel", tipologia: "apartamento", bairroTexto: "Boa Viagem", bairro: "boa-viagem",
  logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
  declarados: { preco: val(3000), condominio: val(600), iptu: { ...val(100), periodo: "mes" }, seguroIncendio: val(40), taxaServico: val(null), outros: val(null), area: val(70), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null) },
  vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: atual.geradoEm },
  visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva, descarte: null,
  ...(memoria ? { caderno: { versao: 1, documentos: [], entidades: [], ocorrencias: [], observacoes: [], cenarios: [], visitas: [], decisao: "considerando", diario: [], memoria } } : {}),
});
const eAnt = antigo.edificios.find((x) => x.id === ID);
const dcAnt = antigo.rua.logradouros[ID.split("-")[0]].defesaCivil;
const memoria = retrato({ em: "2026-11-01T12:00:00.000Z", fontes: { indice: "indice-municipal/5bad409c1782ca8a" },
  declarados: { preco: { valor: 3000 }, condominio: { valor: 550 }, iptu: { valor: 100, periodo: "mes" }, seguroIncendio: { valor: 40 } },
  obras: eAnt.obras150m.recentes.map(([i, m]) => ({ ...antigo.obras[i], distanciaM: m })), defesaCivil: { porAno: dcAnt.porAno }, ruaDoPredio: null, essenciais: [], noite: null });

const b = await chromium.launch();
const r = { telas: {}, erros: [], externas: [] };
const bloco = (p) => p.evaluate(() => { const t = document.body.innerText; const i = Math.max(t.indexOf("Desde "), t.indexOf("Guarde o que este dossiê"), t.indexOf("Nada mudou nas bases")); return i >= 0 ? t.slice(i, i + 1400) : null; });
try {
  for (const largura of [375, 360]) {
    for (const [nome, a] of [["A", analise("a", true, memoria)], ["B", analise("b", false, null)]]) {
      const c = await b.newContext({ viewport: { width: largura, height: 812 } });
      await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
      await c.addInitScript((x) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify([x])); localStorage.setItem("vereda-ativa-v1", x.id); localStorage.setItem("s", "1"); } }, a);
      const p = await c.newPage();
      p.on("pageerror", (x) => r.erros.push(x.message));
      await p.goto(`${base}/dossie`, { waitUntil: "load" }); await p.waitForTimeout(2500);
      const tela = { antes: await bloco(p) };
      await p.screenshot({ path: path.join(saida, `memoria-${nome}-${largura}.png`) });
      const lerMemoria = () => p.evaluate((id) => JSON.parse(localStorage.getItem("vereda-analises-v2") ?? "[]").find((x) => x.id === id)?.caderno?.memoria ?? null, a.id);
      if (nome === "A") {
        const t = p.getByText(/correç(ão|ões) de base$/).first();
        if (await t.count()) { await t.click(); await p.waitForTimeout(300); tela.correcoes = await bloco(p); }
        await p.getByText("Marcar como visto hoje", { exact: true }).first().click(); await p.waitForTimeout(1200);
        tela.depoisDeMarcar = await bloco(p);
        tela.memoriaEm = (await lerMemoria())?.em ?? null;
      } else {
        await p.getByRole("button", { name: "Salvar imóvel" }).first().click(); await p.waitForTimeout(1200);
        const m = await lerMemoria();
        tela.memoriaCriadaAoSalvar = m ? { em: m.em, fatos: m.fatos.length, fontes: m.fontes } : null;
        tela.depoisDeSalvar = await bloco(p);
      }
      tela.rolagem = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      r.telas[`${nome}@${largura}`] = tela;
      await c.close();
    }
  }
} finally {
  await b.close();
  console.log(JSON.stringify(r, null, 1));
}
