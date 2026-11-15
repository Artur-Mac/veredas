// VE11 — rendered check of the "Para decidir" section in the Compare Rotina tab: cost × time with its threshold, the
// two-destination dominance line (profile neighbourhood + a positioned notebook destination) and "Onde mais procurar".
// synthetic listing values and a household profile (destination: Bairro do Recife) in an isolated context.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE11/scripts/ve11-render.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve("out/ve11");
await mkdir(saida, { recursive: true });
const pub = await readFile("src/dados/recife/publicacaoGerada.ts", "utf8");
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
async function edificio(area, id) {
  const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/${area}.json`, "utf8"));
  return { e: ix.edificios.find((x) => x.id === id), geradoEm: ix.geradoEm };
}
const em = "2026-11-14T12:00:00.000Z";
const val = (valor) => ({ valor, origem: "voce", aConfirmar: false });
async function analise(id, area, bairroTexto, predioId, preco) {
  const { e, geradoEm } = await edificio(area, predioId);
  return {
    versao: 2, id, criadaEm: em, atualizadaEm: em, nome: `Fixture ${bairroTexto}`, modalidade: "aluguel", tipologia: "apartamento", bairroTexto, bairro: area,
    logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
    declarados: { preco: val(preco), condominio: val(600), iptu: { ...val(100), periodo: "mes" }, seguroIncendio: val(40), taxaServico: val(null), outros: val(null), area: val(70), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null) },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: geradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null,
  };
}
const destinoCaderno = { id: "destino-faculdade", apelido: "Faculdade", nota: "", posicao: { longitude: -34.95219, latitude: -8.05519, precisaoM: 20, em: "2026-11-10T12:00:00.000Z" } };
const lista = [
  await analise("bv", "boa-viagem", "Boa Viagem", "10537-232", 3000),
  { ...(await analise("cf", "casa-forte", "Casa Forte", "61999-311", 3000)), caderno: { versao: 1, documentos: [], entidades: [], ocorrencias: [], observacoes: [], cenarios: [], visitas: [], decisao: "considerando", diario: [], destinos: [destinoCaderno] } },
  await analise("gr", "gracas", "Graças", "59382-327", 3250),
];
const resultado = { externas: [], erros: [], telas: {} };
const b = await chromium.launch();
const visivel = (p) => p.evaluate(() => document.body.innerText);
try {
  for (const largura of [375, 360]) {
    const c = await b.newContext({ viewport: { width: largura, height: 812 } });
    await c.route("**/*", (r) => { const u = r.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return r.continue(); resultado.externas.push(u); return r.abort(); });
    const perfil = { versao: 1, configurado: true, moradores: 2, usoArCondicionado: "noite_1_quarto", destinoBairro: "recife", modoTransporte: "transporte_publico", diasPresenciaisMes: 20, entradaPercentualCompra: 20, prazoAnosCompra: 30, orcamentoMensalReais: null, atualizadoEm: em };
    await c.addInitScript(([l, pf]) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify(l)); localStorage.setItem("vereda-ativa-v1", "bv"); localStorage.setItem("vereda-perfil-domicilio-v1", JSON.stringify(pf)); localStorage.setItem("s", "1"); } }, [lista, perfil]);
    const p = await c.newPage();
    p.on("pageerror", (e) => resultado.erros.push(e.message));
    for (const [ids, nome] of [["cf,gr", "cf-gr"]]) {
      const t0 = Date.now();
      await p.goto(`${base}/comparar?ids=${ids}`, { waitUntil: "load" });
      await p.waitForTimeout(2000);
      await p.getByRole("tab", { name: "Rotina", exact: true }).click();
      await p.waitForFunction(() => !document.body.innerText.includes("Calculando"), null, { timeout: 60000 });
      // A ida para o segundo destino é calculada depois dos cenários do primeiro (sem "Calculando" na tela).
      await p.getByText("Com todos os destinos", { exact: true }).first().waitFor({ timeout: 60000 }).catch(() => undefined);
      const ms = Date.now() - t0;
      const tc = await visivel(p);
      const j = tc.indexOf("Custo × tempo") >= 0 ? tc.indexOf("Custo × tempo") : tc.toUpperCase().indexOf("ROTINA POR HORÁRIO");
      const alvo = p.getByText("Custo × tempo").first(); if (await alvo.count()) await alvo.scrollIntoViewIfNeeded();
      await p.screenshot({ path: path.join(saida, `comparar-rotina-${nome}-${largura}.png`), fullPage: true });
      resultado.telas[`${nome}@${largura}`] = { msAteTerminar: ms, painel: j >= 0 ? tc.slice(j, j + 2200) : null, rolagem: await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) };
    }
    await c.close();
  }
} finally {
  await b.close();
  console.log(JSON.stringify(resultado, null, 1));
}
