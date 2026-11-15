// VE16 — rendered check of the expansion area: a real Torre building (G-TRANSIT-TORRE GTT01) shows the per-building
// layers in the dossier (Dia a dia, Voltando à noite, Sol nas fachadas) and Compare's Rotina names Torre in its coverage
// text; a Madalena building is the pilot control. Synthetic listing values; 375 and 360 px; no external requests.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE16/scripts/ve16-render-torre.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve(process.env.SAIDA || "out/ve16/render");
await mkdir(saida, { recursive: true });
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(await readFile("src/dados/recife/publicacaoGerada.ts", "utf8"))[1];
const em = "2026-11-15T12:00:00.000Z";
const val = (valor) => ({ valor, origem: "voce", aConfirmar: false });
async function analise(id, area, bairroTexto, predioId) {
  const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/${area}.json`, "utf8"));
  const e = ix.edificios.find((x) => x.id === predioId);
  return {
    versao: 2, id, criadaEm: em, atualizadaEm: em, nome: `Teste ${bairroTexto}`, modalidade: "aluguel", tipologia: "apartamento", bairroTexto, bairro: area,
    logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
    declarados: { preco: val(2800), condominio: val(600), iptu: { ...val(100), periodo: "mes" }, seguroIncendio: val(40), taxaServico: val(null), outros: val(null), area: val(70), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null) },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: ix.geradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null,
  };
}
const lista = [await analise("to", "torre", "Torre", "36056-510"), await analise("ma", "madalena", "Madalena", "16918-49")];
const perfil = { versao: 1, configurado: true, moradores: 2, usoArCondicionado: "noite_1_quarto", destinoBairro: "recife", modoTransporte: "transporte_publico", diasPresenciaisMes: 20, entradaPercentualCompra: 20, prazoAnosCompra: 30, orcamentoMensalReais: null, atualizadoEm: em };
const r = { externas: [], erros: [], telas: {} };
const b = await chromium.launch();
const texto = (p) => p.evaluate(() => document.body.innerText);
const trecho = (t, m, n) => { const i = t.indexOf(m); return i >= 0 ? t.slice(i, i + n) : null; };
try {
  for (const largura of [375, 360]) {
    for (const ativa of ["to", "ma"]) {
      const c = await b.newContext({ viewport: { width: largura, height: 812 } });
      await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
      await c.addInitScript(([l, a, pf]) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify(l)); localStorage.setItem("vereda-ativa-v1", a); localStorage.setItem("vereda-perfil-domicilio-v1", JSON.stringify(pf)); localStorage.setItem("s", "1"); } }, [lista, ativa, perfil]);
      const p = await c.newPage();
      p.on("pageerror", (x) => r.erros.push(x.message));
      await p.goto(`${base}/dossie`, { waitUntil: "load" }); await p.waitForTimeout(3000);
      await p.getByRole("tab", { name: "Entorno", exact: true }).click(); await p.waitForTimeout(2000);
      const entorno = await texto(p);
      await p.screenshot({ path: path.join(saida, `entorno-${ativa}-${largura}.png`), fullPage: false });
      await p.getByRole("tab", { name: "Edifício", exact: true }).click(); await p.waitForTimeout(2000);
      const edificio = await texto(p);
      r.telas[`${ativa}@${largura}`] = {
        diaADia: trecho(entorno, "A PÉ, A PARTIR DA ENTRADA", 700) ?? trecho(entorno, "A pé, a partir da entrada", 700), noite: trecho(entorno, "Voltando à noite", 400),
        sol: trecho(edificio, "Sol nas fachadas", 400) ?? trecho(edificio, "SOL NAS FACHADAS", 400),
        carregando: /Carregando os dados/.test(entorno + edificio), falha: /Não foi possível carregar/.test(entorno + edificio),
        rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      };
      await c.close();
    }
    const c = await b.newContext({ viewport: { width: largura, height: 812 } });
    await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
    await c.addInitScript(([l, pf]) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify(l)); localStorage.setItem("vereda-perfil-domicilio-v1", JSON.stringify(pf)); localStorage.setItem("s", "1"); } }, [lista, perfil]);
    const p = await c.newPage();
    p.on("pageerror", (x) => r.erros.push(x.message));
    await p.goto(`${base}/comparar?ids=to,ma`, { waitUntil: "load" }); await p.waitForTimeout(2500);
    await p.getByRole("tab", { name: "Rotina", exact: true }).click();
    await p.waitForFunction(() => !document.body.innerText.includes("Calculando"), null, { timeout: 90000 }).catch(() => undefined);
    await p.waitForTimeout(1500);
    const t = await texto(p);
    await p.screenshot({ path: path.join(saida, `rotina-${largura}.png`), fullPage: true });
    r.telas[`comparar@${largura}`] = { rotina: trecho(t, "ROTINA POR HORÁRIO", 1500) ?? trecho(t, "Rotina por horário", 1500), ondeMaisProcurar: trecho(t, "Onde mais procurar", 900),
      cincoBairros: t.includes("cinco bairros"), rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
    await c.close();
  }
} finally {
  await b.close();
  console.log(JSON.stringify(r, null, 1));
}
