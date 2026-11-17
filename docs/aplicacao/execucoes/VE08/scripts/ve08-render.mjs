// VE08 — rendered check of "Voltando à noite" (Entorno) and "De que lado vem o barulho" (Edifício) on real Boa Viagem
// and Graças buildings (one near a main road, one near a venue with a valid LUSE). 375 and 360 px.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE08/scripts/ve08-render.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve("out/ve08/render");
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

const ts = await readFile("src/dados/recife/noiteGerado.ts", "utf8");
const vn = /VERSAO_DA_NOITE = "([^"]+)"/.exec(ts)[1];
const noiteBV = JSON.parse(await readFile(`src/dados/recife/noite/${vn}/boa-viagem.json`, "utf8"));
const noiteGR = JSON.parse(await readFile(`src/dados/recife/noite/${vn}/gracas.json`, "utf8"));
const idBV = Object.keys(noiteBV.predios).sort().find((k) => noiteBV.predios[k].r?.partidas && noiteBV.predios[k].v?.ruas.length);
const idGR = Object.keys(noiteGR.predios).sort().find((k) => noiteGR.predios[k].s && noiteGR.predios[k].v);
const ixG = JSON.parse(await readFile(`src/dados/recife/${dir}/gracas.json`, "utf8"));
const comPredio = (base, id, ixx, area, bairroTexto, aid) => { const e2 = ixx.edificios.find((x) => x.id === id); return { ...base, id: aid, nome: `Teste ${bairroTexto}`, bairroTexto, bairro: area,
  vinculo: { estado: "confirmado", edificioId: e2.id, dsqfl: e2.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: ixx.geradoEm } }; };
const casos = [comPredio(analise, idBV, ix, "boa-viagem", "Boa Viagem", "bv"), comPredio(analise, idGR, ixG, "gracas", "Graças", "gr")];
const b = await chromium.launch();
const r = { predios: { bv: idBV, gr: idGR }, telas: {}, erros: [], externas: [] };
const trecho = (p, marca, n) => p.evaluate(([m, k]) => { const t = document.body.innerText; const i = t.indexOf(m); return i >= 0 ? t.slice(i, i + k) : null; }, [marca, n]);
try {
  for (const largura of [375, 360]) for (const a of casos) {
    const c = await b.newContext({ viewport: { width: largura, height: 812 } });
    await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
    await c.addInitScript((x) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify([x])); localStorage.setItem("vereda-ativa-v1", x.id); localStorage.setItem("s", "1"); } }, a);
    const p = await c.newPage();
    p.on("pageerror", (x) => r.erros.push(x.message));
    await p.goto(`${base}/dossie`, { waitUntil: "load" }); await p.waitForTimeout(2500);
    await p.getByRole("tab", { name: "Entorno", exact: true }).click(); await p.waitForTimeout(1200);
    const bloco = p.getByText("Voltando à noite", { exact: true }).first();
    let noite = null;
    if (await bloco.count()) {
      await bloco.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
      await p.screenshot({ path: path.join(saida, `noite-${a.id}-${largura}.png`) });
      await p.getByText("Ver o caminho à noite", { exact: true }).first().click(); await p.waitForTimeout(300);
      noite = await trecho(p, "Voltando à noite", 1600);
    }
    await p.getByRole("tab", { name: "Edifício", exact: true }).click(); await p.waitForTimeout(1500);
    const bb = p.getByText(/^(Rua movimentada e som licenciado|A via movimentada mais perto|Som licenciado por perto)\.$/).first();
    let barulho = null, pergunta = null;
    if (await bb.count()) {
      await bb.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
      await p.screenshot({ path: path.join(saida, `barulho-${a.id}-${largura}.png`) });
      barulho = await trecho(p, "DE QUE LADO VEM O BARULHO", 900) ?? await trecho(p, "De que lado vem o barulho", 900);
      const levar = p.getByRole("link", { name: "Levar a conferência do barulho para o roteiro da visita" });
      if (await levar.count()) { await levar.first().click(); await p.waitForTimeout(1200);
        pergunta = await p.evaluate((id) => (JSON.parse(localStorage.getItem("vereda-analises-v2") ?? "[]").find((x) => x.id === id)?.visita?.perguntasProprias ?? []).map((q) => q.texto), a.id); }
    }
    r.telas[`${a.id}@${largura}`] = { noite, barulho, pergunta, rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
    await c.close();
  }
} finally {
  await b.close();
  console.log(JSON.stringify(r, null, 1));
}
