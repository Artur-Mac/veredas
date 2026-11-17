// VE12.01 — End-to-end pilot run on Expo web (375 × 812, isolated contexts, external requests blocked). For each of the
// five pilot areas: four saved homes on real buildings (rent pair: one complete listing, one with the condo fee missing
// and IPTU without period; purchase pair), one of them with a snapshot taken from the OLDER published index (5bad409c,
// "later update" path). Opens every dossier tab and both comparisons (incl. the Rotina tab), records which capability
// blocks appear per building, and checks invariants on every screen: no NaN/undefined/Infinity/[object, no horizontal
// overflow, no page errors, no external requests. Writes docs/aplicacao/execucoes/VE12/piloto.json.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE12/scripts/ve12-piloto.mjs
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { retrato } from "../../../../../src/dados/memoria.ts";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const saida = path.resolve("out/ve12");
await mkdir(saida, { recursive: true });
const PILOTO = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];
const NOMES = { "boa-viagem": "Boa Viagem", "casa-forte": "Casa Forte", gracas: "Graças", espinheiro: "Espinheiro", madalena: "Madalena" };
const sha = (s) => createHash("sha256").update(s).digest("hex");
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(await readFile("src/dados/recife/publicacaoGerada.ts", "utf8"))[1];
const vT = /VERSAO_DO_TRANSITO = "([^"]+)"/.exec(await readFile("src/dados/recife/transitoGerado.ts", "utf8"))[1];
const em = "2026-11-14T12:00:00.000Z";
const val = (valor, mais = {}) => ({ valor, origem: "texto", aConfirmar: false, ...mais });
const CADERNO = { versao: 1, documentos: [], entidades: [], ocorrencias: [], observacoes: [], cenarios: [], visitas: [], decisao: "considerando", diario: [] };
const perfil = { versao: 1, configurado: true, moradores: 2, usoArCondicionado: "noite_1_quarto", destinoBairro: "recife", modoTransporte: "transporte_publico", diasPresenciaisMes: 20, entradaPercentualCompra: 20, prazoAnosCompra: 30, orcamentoMensalReais: null, atualizadoEm: em };

function analise(id, area, e, ix, modalidade, d, extra = {}) {
  return { versao: 2, id, criadaEm: em, atualizadaEm: em, nome: `${modalidade === "aluguel" ? "Aluguel" : "Compra"} ${NOMES[area]} ${id.slice(-1)}`, modalidade, tipologia: "apartamento",
    bairroTexto: NOMES[area], bairro: area, logradouro: null, numero: null, nomeEdificio: null, url: `https://anuncio.test/${id}`, extracao: null,
    declarados: { preco: val(modalidade === "aluguel" ? 3000 : 650000), condominio: val(700), iptu: val(150, { periodo: "mes" }), seguroIncendio: val(modalidade === "aluguel" ? 40 : null), taxaServico: val(null), outros: val(null),
      area: val(75), quartos: val(2), suites: val(null), banheiros: val(null), vagas: val(null), andar: val(null), ...d },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: ix.geradoEm },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null }, salva: true, descarte: null, ...extra };
}

// Quatro prédios por área: ligação forte (há acesso no pacote do VE05), pela ordem do SHA-256 do id.
const casos = {};
for (const area of PILOTO) {
  const ix = JSON.parse(await readFile(`src/dados/recife/${dir}/${area}.json`, "utf8"));
  const antigo = JSON.parse(await readFile(`src/dados/recife/indice-municipal/5bad409c1782ca8a/${area}.json`, "utf8").catch(() => "null"));
  const acessos = JSON.parse(await readFile(`src/dados/recife/transito/${vT}/${area}.json`, "utf8")).predios;
  const ids = Object.keys(acessos).filter((k) => acessos[k].length).sort((a, b) => sha(`VE12|${a}`).localeCompare(sha(`VE12|${b}`))).slice(0, 4);
  const ed = ids.map((i) => ix.edificios.find((x) => x.id === i));
  // "Atualização depois de salvar": retrato a partir do índice antigo, com condomínio 650 (agora 700).
  const eAnt = antigo?.edificios.find((x) => x.id === ed[0].id);
  const dcAnt = antigo?.rua?.logradouros[ed[0].id.split("-")[0]]?.defesaCivil;
  const memoria = eAnt ? retrato({ em: "2026-11-01T12:00:00.000Z", fontes: { indice: "indice-municipal/5bad409c1782ca8a" },
    declarados: { preco: { valor: 3000 }, condominio: { valor: 650 }, iptu: { valor: 150, periodo: "mes" }, seguroIncendio: { valor: 40 } },
    obras: eAnt.obras150m.recentes.map(([i, m]) => ({ ...antigo.obras[i], distanciaM: m })), defesaCivil: dcAnt ? { porAno: dcAnt.porAno } : null, ruaDoPredio: null, essenciais: [], noite: null }) : null;
  casos[area] = [
    analise(`${area}-a1`, area, ed[0], ix, "aluguel", {}, memoria ? { caderno: { ...CADERNO, memoria } } : {}),
    analise(`${area}-a2`, area, ed[1], ix, "aluguel", { preco: val(2700), condominio: val(null), iptu: val(1800, { periodo: "desconhecido" }) }),
    analise(`${area}-c3`, area, ed[2], ix, "compra", { preco: val(720000), condominio: val(900), iptu: val(2400, { periodo: "ano" }), area: val(90), quartos: val(3) }),
    analise(`${area}-c4`, area, ed[3], ix, "compra", { preco: val(560000), condominio: val(650), iptu: val(null, { periodo: "mes" }), area: val(70) }),
  ];
}

const MARCAS = {
  destaques: { achados: /Além do anúncio\.|Nenhuma divergência encontrada|Só o que o anúncio informa/, memoriaMudou: /Desde 01\/11\/2026/, memoria: /Desde \d\d\/\d\d\/\d{4}|Guarde o que este dossiê|Nada mudou nas bases/, negociacao: /Preparar a negociação\./ },
  entorno: { diaADia: /Mercado, farmácia, praça e ônibus/, seAlagar: /Se a rua alagar/, noite: /Voltando à noite/ },
  edificio: { sol: /Qual lado do prédio pega sol\./, barulho: /A via movimentada mais perto\.|Som licenciado por perto\.|Rua movimentada e som licenciado\./ },
};
const RUIM = /\bNaN\b|\bundefined\b|\bInfinity\b|\[object /;
const b = await chromium.launch();
const r = { geradoEm: new Date().toISOString(), base, indice: dir, areas: {}, erros: [], externas: [], invariantes: [] };
const invariante = async (p, onde) => {
  const t = await p.evaluate(() => document.body.innerText);
  const m = t.match(RUIM);
  const rol = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (m || rol > 0) r.invariantes.push({ onde, texto: m?.[0] ?? null, rolagem: rol });
  return t;
};
try {
  for (const area of PILOTO) {
    const lista = casos[area];
    const c = await b.newContext({ viewport: { width: 375, height: 812 } });
    await c.route("**/*", (q) => { const u = q.request().url(); if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue(); r.externas.push(u); return q.abort(); });
    await c.addInitScript(([l, pf]) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify(l)); localStorage.setItem("vereda-perfil-domicilio-v1", JSON.stringify(pf)); localStorage.setItem("s", "1"); } }, [lista, perfil]);
    const p = await c.newPage();
    p.on("pageerror", (x) => r.erros.push(`${area}: ${x.message}`));
    const ra = { predios: {}, comparacoes: {} };
    for (const a of lista) {
      const t0 = Date.now();
      await p.goto(`${base}/dossie?id=${a.id}`, { waitUntil: "load" });
      try { await p.getByRole("tab", { name: "Destaques", exact: true }).first().waitFor({ timeout: 20000 }); }
      catch (e) { await p.screenshot({ path: path.join(saida, `falha-${a.id}.png`) }); throw new Error(`${a.id}: ${(await p.evaluate(() => document.body.innerText)).slice(0, 600)}`); }
      const msDossie = Date.now() - t0;
      const presente = {};
      for (const [aba, marcas] of Object.entries(MARCAS)) {
        const nome = { destaques: "Destaques", entorno: "Entorno", edificio: "Edifício" }[aba];
        await p.getByRole("tab", { name: nome, exact: true }).click();
        if (aba === "edificio") await p.waitForFunction(() => !document.body.innerText.includes("Calculando o sol em cada lado"), null, { timeout: 30000 }).catch(() => undefined);
        await p.waitForTimeout(aba === "destaques" ? 600 : 1000);
        const t = await invariante(p, `${a.id}/${aba}`);
        for (const [k, re] of Object.entries(marcas)) presente[k] = re.test(t);
        if (a.id.endsWith("a1")) await p.screenshot({ path: path.join(saida, `${a.id}-${aba}.png`) });
      }
      ra.predios[a.id] = { predio: a.vinculo.edificioId, modalidade: a.modalidade, msAteODossie: msDossie, ...presente, comRetratoAntigo: Boolean(a.caderno?.memoria) };
    }
    for (const [nome, ids] of [["aluguel", [lista[0].id, lista[1].id]], ["compra", [lista[2].id, lista[3].id]]]) {
      const t0 = Date.now();
      await p.goto(`${base}/comparar?ids=${ids.join(",")}`, { waitUntil: "load" });
      await p.getByRole("tab", { name: "Rotina", exact: true }).waitFor({ timeout: 20000 });
      const brief = /PARA DECIDIR|Para decidir/.test(await invariante(p, `${area}/${nome}/custo`));
      await p.getByRole("tab", { name: "Rotina", exact: true }).click();
      await p.waitForFunction(() => !document.body.innerText.includes("Calculando"), null, { timeout: 90000 }).catch(() => undefined);
      await p.getByText("Onde mais procurar", { exact: false }).first().waitFor({ timeout: 30000 }).catch(() => undefined);
      const ms = Date.now() - t0;
      const t = await invariante(p, `${area}/${nome}/rotina`);
      await p.screenshot({ path: path.join(saida, `${area}-${nome}-rotina.png`), fullPage: true });
      ra.comparacoes[nome] = { msAteARotina: ms, resumo: brief, rotina: /ROTINA POR HORÁRIO|Rotina por horário/.test(t), mensal: /h\/mês|Quase igual no mês/.test(t),
        custoTempo: /Custo × tempo/.test(t), ondeProcurar: /Onde mais procurar/.test(t), semOnibus: /Sem ônibus útil/.test(t) };
    }
    r.areas[area] = ra;
    await c.close();
  }
} finally {
  await b.close();
  await writeFile("docs/aplicacao/execucoes/VE12/piloto.json", JSON.stringify(r, null, 1) + "\n");
  console.log(JSON.stringify({ erros: r.erros.length, externas: r.externas.length, invariantes: r.invariantes }, null, 1));
}
