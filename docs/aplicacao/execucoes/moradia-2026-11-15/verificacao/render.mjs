// Verificação no fluxo normal (15/11/2026): "Se a rua alagar" em quatro prédios reais (histórico da rua, catálogo do
// eSIG, desvio pequeno, desvio condicional) e o registro de internet no caderno (consulta de fibra + medição + o que
// falta + entrada inválida). Valores do anúncio sintéticos; 375 e 360 px; nenhuma requisição externa permitida.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/moradia-2026-11-15/verificacao/render.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const AQUI = "docs/aplicacao/execucoes/moradia-2026-11-15/verificacao";
const saida = path.resolve(AQUI, "telas");
await mkdir(saida, { recursive: true });
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(await readFile("src/dados/recife/publicacaoGerada.ts", "utf8"))[1];
const em = "2026-11-15T12:00:00.000Z";
const val = (valor) => ({ valor, origem: "voce", aConfirmar: false });
async function analise(id, area, bairroTexto, predioId) {
  const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/${area}.json`, "utf8"));
  const e = ix.edificios.find((x) => x.id === predioId);
  if (!e) throw new Error(`prédio ${predioId} não está no índice de ${area}`);
  return {
    versao: 2, id, criadaEm: em, atualizadaEm: em, nome: `Teste ${bairroTexto} ${predioId}`, modalidade: "aluguel", tipologia: "apartamento", bairroTexto, bairro: area,
    logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
    declarados: { preco: val(2800), condominio: val(600), iptu: { ...val(100), periodo: "mes" }, seguroIncendio: val(40), taxaServico: val(null), outros: val(null), area: val(70), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null) },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: ix.geradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null,
  };
}
const CASOS = [["cf", "casa-forte", "Casa Forte", "38490-145"], ["gr", "gracas", "Graças", "59595-264"], ["gp", "gracas", "Graças", "21075-38"], ["bv", "boa-viagem", "Boa Viagem", "10537-232"]];
const lista = [];
for (const [id, area, txt, predio] of CASOS) lista.push(await analise(id, area, txt, predio));
const perfil = { versao: 1, configurado: true, moradores: 2, usoArCondicionado: "noite_1_quarto", destinoBairro: "recife", modoTransporte: "transporte_publico", diasPresenciaisMes: 20, entradaPercentualCompra: 20, prazoAnosCompra: 30, orcamentoMensalReais: null, atualizadoEm: em };
const r = { externas: [], erros: [], alagamento: {}, internet: {} };
const b = await chromium.launch();
const texto = (p) => p.evaluate(() => document.body.innerText);
const trecho = (t, m, n) => { const i = t.indexOf(m); return i >= 0 ? t.slice(i, i + n) : null; };
async function contexto(largura, ativa) {
  const c = await b.newContext({ viewport: { width: largura, height: 812 } });
  await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
  await c.addInitScript(([l, a, pf]) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify(l)); localStorage.setItem("vereda-ativa-v1", a); localStorage.setItem("vereda-perfil-domicilio-v1", JSON.stringify(pf)); localStorage.setItem("s", "1"); } }, [lista, ativa, perfil]);
  const p = await c.newPage();
  p.on("pageerror", (x) => r.erros.push(x.message));
  return { c, p };
}
try {
  for (const largura of [375, 360]) {
    for (const [ativa] of CASOS) {
      const { c, p } = await contexto(largura, ativa);
      await p.goto(`${base}/dossie`, { waitUntil: "load" }); await p.waitForTimeout(3000);
      await p.getByRole("tab", { name: "Entorno", exact: true }).click(); await p.waitForTimeout(2500);
      const grupo = p.getByRole("group", { name: "Se a rua alagar" });
      const existe = await grupo.count();
      let antes = null, depois = null;
      if (existe) {
        await grupo.scrollIntoViewIfNeeded();
        antes = await grupo.innerText();
        const ver = grupo.getByText("Ver o registro").first();
        if (await ver.count()) { await ver.click(); await p.waitForTimeout(400); depois = await grupo.innerText(); }
        await grupo.screenshot({ path: path.join(saida, `alagar-${ativa}-${largura}.png`) });
      }
      const t = await texto(p);
      r.alagamento[`${ativa}@${largura}`] = { bloco: Boolean(existe), texto: antes, aposVerRegistro: depois, afirmaBloqueio: /comprometida|qualquer que seja o destino/.test(t),
        carregando: /Carregando os dados/.test(t), falha: /Não foi possível carregar/.test(t), rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
      await c.close();
    }
    // Internet no caderno: consulta de fibra, medição Wi-Fi, medição móvel por chamada e uma entrada inválida.
    const { c, p } = await contexto(largura, "gr");
    await p.goto(`${base}/detalhes?id=gr&secao=campo`, { waitUntil: "load" }); await p.waitForTimeout(3000);
    const g = p.getByText("Internet onde você vai usar").first();
    await g.scrollIntoViewIfNeeded(); await g.click(); await p.waitForTimeout(500);
    const inicial = trecho(await texto(p), "Disponibilidade consultada", 1600);
    await p.getByLabel("Prestadora consultada").fill("Prestadora Teste");
    await p.getByLabel("A resposta vale para: Bloco", { exact: true }).click();
    await p.getByLabel("Bloco", { exact: true }).fill("B");
    await p.getByLabel("Data da consulta (AAAA-MM-DD; vazio = hoje)").fill("2026-11-15");
    await p.getByText("Guardar consulta de fibra").click(); await p.waitForTimeout(800);
    await p.getByLabel("Cômodo da medição").fill("Quarto 2");
    await p.getByLabel("Download em Mbps (se medido)").fill("312,4");
    await p.getByLabel("Latência em ms (se medida)").fill("9");
    await p.getByText("Guardar medição no cômodo").click(); await p.waitForTimeout(800);
    // Entrada inválida: número negativo não é guardado.
    await p.getByLabel("Cômodo da medição").fill("Sala");
    await p.getByLabel("Download em Mbps (se medido)").fill("-5");
    await p.getByText("Guardar medição no cômodo").click(); await p.waitForTimeout(600);
    const aposInvalida = await texto(p);
    await p.getByLabel("Download em Mbps (se medido)").fill("");
    await p.getByLabel("Rede usada no teste: Rede móvel", { exact: true }).click();
    await p.getByLabel("Tecnologia vista no aparelho: 4G", { exact: true }).click();
    await p.getByLabel("Como testou: Chamada", { exact: true }).click();
    await p.getByLabel("Chamada: Funcionou", { exact: true }).click();
    await p.getByText("Guardar medição no cômodo").click(); await p.waitForTimeout(800);
    const final = await texto(p);
    await p.getByText("Disponibilidade consultada").first().scrollIntoViewIfNeeded();
    await p.screenshot({ path: path.join(saida, `internet-${largura}.png`), fullPage: false });
    const salvo = await p.evaluate(() => JSON.parse(localStorage.getItem("vereda-analises-v2")).find((a) => a.id === "gr")?.caderno?.conectividade ?? null);
    r.internet[largura] = { inicial, recusouNegativo: /números com vírgula ou vazios/.test(aposInvalida), final: trecho(final, "Disponibilidade consultada", 2600), salvos: salvo?.length ?? 0,
      tipos: salvo?.map((x) => x.tipo), nulos: salvo?.filter((x) => x.tipo === "medicao").map((x) => [x.downloadMbps, x.uploadMbps, x.latenciaMs]),
      rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
    await c.close();
  }
} finally {
  await b.close();
  await writeFile(path.join(AQUI, "render.json"), JSON.stringify(r, null, 1) + "\n");
  console.log(JSON.stringify({ externas: r.externas.length, erros: r.erros, alagamento: Object.fromEntries(Object.entries(r.alagamento).map(([k, v]) => [k, [v.bloco, v.afirmaBloqueio, v.rolagem, v.falha]])), internet: Object.fromEntries(Object.entries(r.internet).map(([k, v]) => [k, [v.salvos, v.recusouNegativo, JSON.stringify(v.nulos), v.rolagem]])) }, null, 1));
}
