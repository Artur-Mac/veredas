// D036 / divisão do pacote — reabrir sem rede na web, contra o build de produção (expo export) servido localmente.
//   1. Online, abre o dossiê de um prédio de Casa Forte (Destaques, Entorno, Edifício com o sol) e espera o service
//      worker guardar a casca e as camadas.
//   2. Sem rede (context.setOffline), recarrega o mesmo dossiê: tem de abrir com Destaques, o dia a dia a pé e o sol.
//   3. Ainda sem rede, abre um dossiê de Madalena, nunca aberto: tem de dizer que não carregou e não mostrar o dossiê.
//   4. Com a rede de volta, "Tentar de novo" abre o dossiê de Madalena.
// Pedido para fora da origem é abortado e contado. Escreve docs/aplicacao/execucoes/VE12/payload-offline.json.
//   URL=http://127.0.0.1:8099 node docs/aplicacao/execucoes/VE12/scripts/payload-offline.mjs
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = (process.env.URL || "http://127.0.0.1:8099").replace(/\/+$/, "");
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(await readFile("src/dados/recife/publicacaoGerada.ts", "utf8"))[1];
const vT = /VERSAO_DO_TRANSITO = "([^"]+)"/.exec(await readFile("src/dados/recife/transitoGerado.ts", "utf8"))[1];
const em = "2026-11-14T12:00:00.000Z";
const val = (valor, mais = {}) => ({ valor, origem: "texto", aConfirmar: false, ...mais });
const sha = (s) => createHash("sha256").update(s).digest("hex");

/** Prédios com ligação forte (há acesso no pacote do VE05), pela ordem do SHA-256 do id. */
async function prediosDe(area, n) {
  const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/${area}.json`, "utf8"));
  const acessos = JSON.parse(await readFile(`src/dados/recife/transito/${vT}/${area}.json`, "utf8")).predios;
  const ids = Object.keys(acessos).filter((k) => acessos[k].length).sort((a, b) => sha(`OFF|${a}`).localeCompare(sha(`OFF|${b}`))).slice(0, n);
  return ids.map((id) => ({ ix, e: ix.edificios.find((x) => x.id === id) }));
}
function analise(id, area, nome, { ix, e }) {
  return { versao: 2, id, criadaEm: em, atualizadaEm: em, nome, modalidade: "aluguel", tipologia: "apartamento", bairroTexto: nome, bairro: area,
    logradouro: null, numero: null, nomeEdificio: null, url: `https://anuncio.test/${id}`, extracao: null,
    declarados: { preco: val(3000), condominio: val(700), iptu: val(150, { periodo: "mes" }), seguroIncendio: val(40), taxaServico: val(null), outros: val(null),
      area: val(75), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null) },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: ix.geradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null };
}
// Vários de Casa Forte: o sol nas fachadas só aparece onde o cálculo dá resultado (prédio baixo some, por desenho).
const candidatos = (await prediosDe("casa-forte", 8)).map((p, i) => analise(`off-cf${i}`, "casa-forte", `Casa Forte ${i}`, p));
const lista = [...candidatos, analise("off-md", "madalena", "Madalena", (await prediosDe("madalena", 1))[0])];

const r = { geradoEm: new Date().toISOString(), base, externas: [], erros: [], passos: {} };
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 375, height: 812 } });
await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
await c.addInitScript((l) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify(l)); localStorage.setItem("s", "1"); } }, lista);
const p = await c.newPage();
p.on("pageerror", (x) => r.erros.push(x.message));
const texto = () => p.evaluate(() => document.body.innerText);
const aba = async (nome) => { await p.getByRole("tab", { name: nome, exact: true }).click(); await p.waitForTimeout(800); };
try {
  // 1. Online: o primeiro candidato com o sol nas fachadas.
  let t0 = 0;
  let escolhido = null;
  for (const a of candidatos) {
    t0 = Date.now();
    await p.goto(`${base}/dossie?id=${a.id}`, { waitUntil: "load" });
    await p.getByRole("tab", { name: "Destaques", exact: true }).first().waitFor({ timeout: 30000 });
    r.passos.online = { msAteODossie: Date.now() - t0 };
    await aba("Entorno");
    r.passos.online.diaADia = /Mercado, farmácia, praça e ônibus/.test(await texto());
    await aba("Edifício");
    await p.waitForFunction(() => !document.body.innerText.includes("Calculando o sol em cada lado"), null, { timeout: 30000 }).catch(() => undefined);
    r.passos.online.sol = /Qual lado do prédio pega sol\./.test(await texto());
    if (r.passos.online.sol) { escolhido = a; break; }
  }
  r.passos.online.predio = escolhido?.vinculo.edificioId ?? null;
  if (escolhido) await p.goto(`${base}/dossie?id=${escolhido.id}`, { waitUntil: "load" });
  await p.waitForTimeout(5000); // registro do service worker (2 s depois das fontes) e camadas adiantadas (1,5 s)
  r.passos.online.controlado = await p.evaluate(() => !!navigator.serviceWorker?.controller);
  r.passos.online.cache = await p.evaluate(async () => Object.fromEntries(await Promise.all((await caches.keys()).map(async (n) => [n, (await (await caches.open(n)).keys()).length]))));

  // 2. Sem rede: recarrega o mesmo dossiê.
  await c.setOffline(true);
  t0 = Date.now();
  await p.reload({ waitUntil: "load" });
  await p.getByRole("tab", { name: "Destaques", exact: true }).first().waitFor({ timeout: 30000 });
  r.passos.semRede = { msAteODossie: Date.now() - t0 };
  await aba("Entorno");
  r.passos.semRede.diaADia = /Mercado, farmácia, praça e ônibus/.test(await texto());
  await aba("Edifício");
  await p.waitForFunction(() => !document.body.innerText.includes("Calculando o sol em cada lado"), null, { timeout: 30000 }).catch(() => undefined);
  const tEd = await texto();
  r.passos.semRede.sol = /Qual lado do prédio pega sol\./.test(tEd) && !/Não foi possível carregar/.test(tEd);
  await p.screenshot({ path: "out/payload/offline-reaberto.png" });

  // 3. Sem rede, bairro nunca aberto.
  await p.goto(`${base}/dossie?id=off-md`, { waitUntil: "load" });
  await p.getByText("Não foi possível carregar", { exact: false }).first().waitFor({ timeout: 30000 });
  const t3 = await texto();
  r.passos.nuncaAberto = { falhaDita: /Não foi possível carregar os dados de Madalena\./.test(t3), tentarDeNovo: /Tentar de novo/.test(t3),
    semDossie: !(await p.getByRole("tab", { name: "Destaques", exact: true }).count()), invariante: !/\bNaN\b|\bundefined\b|\[object /.test(t3) };
  await p.screenshot({ path: "out/payload/offline-nunca-aberto.png" });

  // 4. Rede de volta.
  await c.setOffline(false);
  await p.getByText("Tentar de novo", { exact: true }).first().click();
  await p.getByRole("tab", { name: "Destaques", exact: true }).first().waitFor({ timeout: 30000 });
  r.passos.recupera = true;
} catch (e) {
  r.erros.push(`roteiro: ${e.message.split("\n")[0]}`);
  await p.screenshot({ path: "out/payload/offline-falha.png" }).catch(() => undefined);
} finally {
  await b.close();
  await writeFile("docs/aplicacao/execucoes/VE12/payload-offline.json", JSON.stringify(r, null, 1) + "\n");
  console.log(JSON.stringify(r));
}
