// VE11.03 — "Onde mais procurar": para cada rua do piloto (código oficial do logradouro, prefixo do id do prédio), a
// mediana do tempo porta a porta programado da ida das 7h num dia útil até o centro de cada bairro do Recife, mais a
// parcela dos prédios da rua com mercado a até 10 min a pé (VE04). Sem preço, sem anúncio: só as dimensões cobertas.
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/transito/onde-procurar.mjs \
//     --relatorio docs/aplicacao/execucoes/VE11/procura.json
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import publicacaoDeCamadas from "../publicar-camadas.cjs";
import { ativosEm, prepararGrade, raptor, pontasEstimadas, distanciaM } from "../../../src/dados/transito/roteador.ts";
import { AREAS } from "../areas.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const PILOTO = AREAS; // VE16: piloto + expansão (scripts/dados/areas.json)
const DIA = "2026-11-17", SAIDAS = [7 * 3600, 7 * 3600 + 20 * 60, 7 * 3600 + 40 * 60];
const t0 = Date.now();
const sha = (s) => createHash("sha256").update(s).digest("hex");

const vT = /VERSAO_DO_TRANSITO = "([^"]+)"/.exec(readFileSync(join(RAIZ, "src/dados/recife/transitoGerado.ts"), "utf8"))[1];
const g = prepararGrade(JSON.parse(readFileSync(join(RAIZ, `src/dados/recife/transito/${vT}/grade.json`), "utf8")));
const vE = /VERSAO_DOS_ESSENCIAIS = "([^"]+)"/.exec(readFileSync(join(RAIZ, "src/dados/recife/essenciaisGerados.ts"), "utf8"))[1];
const dirIndice = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8"))[1];
const centroides = JSON.parse(readFileSync(join(RAIZ, "src/dados/recife/referencias-publicas.json"), "utf8")).centroidesBairros;
const bairros = Object.keys(centroides).sort();
const destinos = bairros.map((b) => pontasEstimadas(g, centroides[b][0], centroides[b][1], 800));
const ativos = ativosEm(g, DIA);
const { velocidadeMps, fatorDeDesvio } = g.bruta.caminhada;

// VE16: cache por área. A parte de cada área (ruas → prédios, mercado a 10 min, tempos por bairro) só depende do código
// deste script e do roteador, da grade, dos centroides e dos arquivos da área (acesso, essenciais, índice). Uma área
// nova (expansão) não refaz as outras; uma grade nova refaz todas. A saída final é a mesma com ou sem cache.
const CACHE = join(RAIZ, ".cache/procura");
mkdirSync(CACHE, { recursive: true });
const fixo = sha([readFileSync(new URL(import.meta.url)), readFileSync(join(RAIZ, "src/dados/transito/roteador.ts")),
  readFileSync(join(RAIZ, `src/dados/recife/transito/${vT}/grade.json`)), JSON.stringify(centroides), JSON.stringify([DIA, SAIDAS])].map((b) => sha(b)).join("|"));
const cacheDaArea = { usadas: [], calculadas: [] };
const ruas = new Map();
let predios = 0;
for (const area of PILOTO) {
  const textos = [`src/dados/recife/transito/${vT}/${area}.json`, `src/dados/recife/essenciais/${vE}/${area}.json`, `src/dados/recife/${dirIndice}/${area}.json`].map((f) => readFileSync(join(RAIZ, f), "utf8"));
  // Chave = só o que o cálculo lê de cada arquivo (acessos por prédio, mercado a pé, id/centro/rua do índice). Cabeçalhos
  // como versão e rede de origem mudam sem mudar o resultado e não invalidam a área.
  const [jA, jE, jI] = textos.map((t) => JSON.parse(t));
  const usado = [JSON.stringify(jA.predios), JSON.stringify(Object.entries(jE.predios).map(([id, x]) => [id, x?.c?.mercado ?? null])),
    JSON.stringify(jI.edificios.map((e) => [e.id, e.centro, e.logradouro]))];
  const arqCache = join(CACHE, `${area}.${sha([fixo, ...usado.map((t) => sha(t))].join("|")).slice(0, 24)}.json`);
  if (existsSync(arqCache)) {
    const c = JSON.parse(readFileSync(arqCache, "utf8"));
    predios += c.predios;
    for (const r of c.ruas) {
      const atual = ruas.get(r.codigo);
      if (!atual) ruas.set(r.codigo, r);
      else { atual.predios += r.predios; atual.mercado10 += r.mercado10; r.tempos.forEach((t, j) => atual.tempos[j].push(...t)); }
    }
    cacheDaArea.usadas.push(area);
    continue;
  }
  cacheDaArea.calculadas.push(area);
  const daArea = new Map();
  let prediosDaArea = 0;
  const acessos = jA.predios;
  const ess = jE.predios;
  const ix = jI;
  const porId = new Map(ix.edificios.map((e) => [e.id, e]));
  for (const [id, l] of Object.entries(acessos)) {
    const e = porId.get(id);
    if (!e || !l.length) continue;
    prediosDaArea += 1;
    const origens = [];
    for (let i = 0; i < l.length; i += 2) origens.push({ parada: l[i], seg: Math.round(l[i + 1] / 1.2) });
    // Uma busca por horário de saída, para todos os bairros de uma vez (sem poda por destino).
    const amostras = bairros.map(() => []);
    for (const t of SAIDAS) {
      const res = raptor(g, origens, t, ativos, { horizonte: 2 * 3600 });
      destinos.forEach((d, j) => {
        let melhor = Infinity;
        for (let k = 1; k <= res.K; k++) for (const p of d) { const x = res.tau[k][p.parada] + p.seg; if (x < melhor) melhor = x; }
        // Caminhada direta estimada até o centro do bairro (como no app), se ganhar do ônibus.
        const aPe = distanciaM(e.centro[0], e.centro[1], centroides[bairros[j]][0], centroides[bairros[j]][1]);
        const direta = aPe <= 3000 ? t + (aPe * fatorDeDesvio) / velocidadeMps : Infinity;
        amostras[j].push(Math.min(melhor, direta) - t);
      });
    }
    const codigo = id.split("-")[0];
    const r = daArea.get(codigo) ?? { codigo, nome: e.logradouro, bairro: area, predios: 0, mercado10: 0, tempos: bairros.map(() => []) };
    r.predios += 1;
    const m = ess[id]?.c?.mercado;
    if (m && "min" in m && m.min <= 10) r.mercado10 += 1;
    amostras.forEach((a, j) => { const s = [...a].sort((x, y) => x - y)[1]; if (Number.isFinite(s)) r.tempos[j].push(s); });
    daArea.set(codigo, r);
  }
  const parte = { predios: prediosDaArea, ruas: [...daArea.values()] };
  writeFileSync(`${arqCache}.tmp`, JSON.stringify(parte)); renameSync(`${arqCache}.tmp`, arqCache);
  predios += parte.predios;
  for (const r of JSON.parse(JSON.stringify(parte.ruas))) {
    const atual = ruas.get(r.codigo);
    if (!atual) ruas.set(r.codigo, r);
    else { atual.predios += r.predios; atual.mercado10 += r.mercado10; r.tempos.forEach((t, j) => atual.tempos[j].push(...t)); }
  }
}
const med = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
const saida = [...ruas.values()].filter((r) => r.predios >= 2).map((r) => ({
  c: r.codigo, n: r.nome, b: r.bairro, p: r.predios, m10: Math.round((r.mercado10 / r.predios) * 100) / 100,
  // Minutos inteiros; null = sem ônibus útil em até 2 h ou menos da metade dos prédios com tempo.
  t: r.tempos.map((ts) => (ts.length * 2 >= r.predios ? Math.round(med(ts) / 60) : null)),
})).sort((x, y) => x.c.localeCompare(y.c));
const conteudo = { formato: 1, dia: DIA, saidas: ["07:00", "07:20", "07:40"], grade: vT, essenciais: vE, bairros, ruas: saida };
const versao = sha(JSON.stringify(conteudo)).slice(0, 16);
const pasta = join(RAIZ, "src/dados/recife/procura");
mkdirSync(pasta, { recursive: true });
const arq = join(pasta, `${versao}.json`), texto = JSON.stringify({ versao, ...conteudo });
if (!existsSync(arq)) { writeFileSync(`${arq}.tmp`, texto); renameSync(`${arq}.tmp`, arq); }
const ts = `// Gerado por scripts/dados/transito/onde-procurar.mjs (VE11).\nexport const VERSAO_DA_PROCURA = ${JSON.stringify(versao)};\nexport const ARQUIVO_DA_PROCURA = ${JSON.stringify(`recife/procura/${versao}.json`)};\n`;
const arqTs = join(RAIZ, "src/dados/recife/procuraGerado.ts");
writeFileSync(`${arqTs}.tmp`, ts); renameSync(`${arqTs}.tmp`, arqTs);
publicacaoDeCamadas.publicarCamadas(); // D036: os arquivos vão para public/dados e assets/dados, fora do bundle.
const rel = { versao, predios, ruas: saida.length, ruasDescartadasComUmPredio: [...ruas.values()].filter((r) => r.predios < 2).length, bytes: texto.length, cache: cacheDaArea, ms: Date.now() - t0, memoriaPicoMB: Math.round(process.resourceUsage().maxRSS / 1024) };
const out = arg("--relatorio");
if (out) writeFileSync(out, JSON.stringify(rel, null, 1) + "\n");
console.log(JSON.stringify(rel));
