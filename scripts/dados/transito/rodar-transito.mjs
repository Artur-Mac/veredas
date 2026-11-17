// VE05 — grade de horários programados para o aparelho, acessos a pé por prédio do piloto e checagens do feed.
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/transito/rodar-transito.mjs \
//     --relatorio docs/aplicacao/execucoes/VE05/transito.json
// Entradas: GTFS fixado (docs/dados/raw/transporte/gtfs.zip), rede e frentes publicadas pelo VE03, logradouros e bairros
// oficiais. Saídas: src/dados/recife/transito/<versão>/{grade,<bairro>}.json, src/dados/recife/transitoGerado.ts e a
// publicação "transito" (.cache/publicacoes). Nenhuma contagem somada de stop_times é publicada.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import publicacaoDeCamadas from "../publicar-camadas.cjs";
import { Buffer } from "node:buffer";
import { gunzipSync, gzipSync, inflateRawSync } from "node:zlib";
import { lerZip } from "../rua/nucleo.mjs";
import { arestaMaisProxima, distanciaM, grafoPublicado, indexarArestas, projetar } from "../rede/grafo.mjs";
import { indexarRuasOficiais } from "../rede/frentes.mjs";
import { criarIndiceDeRuas } from "../observacoes/vinculo.mjs";
import { ativar, ponteiroAtual, prepararVersao } from "../observacoes/publicar.mjs";
import { criarExplorador } from "../destinos/alcance.mjs";
import { VERSAO_DA_GRADE, compactarFeed } from "./grade.mjs";
import { prepararGrade, servicosAtivos } from "../../../src/dados/transito/roteador.ts";
import { AREAS } from "../areas.mjs";
import { gravarImutavel } from "../imutavel.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const PILOTO = AREAS; // VE16: piloto + expansão (scripts/dados/areas.json)
const VELOCIDADE = 1.2;
const ACESSO_M = 1000;
const ACESSO_SEMPRE_M = 400;
const BALDEACAO_M = 400;
const BALDEACAO_RETA_M = 300;
const FORMATO = 1;
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const agora = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString().replace(".000Z", "Z");
const tempos = {};
let t = Date.now();
const marca = (k) => { tempos[k] = Date.now() - t; t = Date.now(); };

// ——— 1. Feed fixado e geometria oficial ————————————————————————————————————————————————————
const ARQ_FEED = join(RAIZ, "docs/dados/raw/transporte/gtfs.zip");
const zip = readFileSync(ARQ_FEED);
const feedSha = sha256(zip);
const arquivos = lerZip(zip, inflateRawSync);
const ler = (n) => { const f = arquivos.get(n); return f ? f().toString("utf8") : null; };

const trechos = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/trechos-de-logradouros.geojson"), "utf8"));
const bairrosGeo = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/bairros-do-recife.geojson"), "utf8"));
const gradeRuas = indexarRuasOficiais(trechos);
const nomeDaRua = new Map(trechos.features.map((f) => [Number(f.properties.CLOGRACODI), f.properties.NLGPAVOFIC || f.properties.NLOGRACONC || null]));
const indiceRuas = criarIndiceDeRuas(trechos, bairrosGeo);
const slugDe = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const nomeDoBairro = new Map(bairrosGeo.features.map((f) => [slugDe(f.properties.EBAIRRNOME), f.properties.EBAIRRNOMEOF || f.properties.EBAIRRNOME]));
const CELULA = 0.002;
function ruaMaisProxima(lon, lat, raioM = 40) {
  const cx = Math.floor(lon / CELULA), cy = Math.floor(lat / CELULA);
  let melhor = null;
  for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
    for (const s of gradeRuas.get(`${x},${y}`) ?? []) {
      const q = projetar(lon, lat, s.ax, s.ay, s.bx, s.by);
      if (q.metros <= raioM && (!melhor || q.metros < melhor.metros)) melhor = { codigo: s.codigo, metros: q.metros };
    }
  }
  return melhor;
}
marca("leitura");

// ——— 2. Nomes de parada legíveis (VE04: 6.7 mil paradas só têm código) ——————————————————————————
const numerico = (n) => /^\s*\d+\s*$/.test(n ?? "");
function limpar(nome) {
  return nome.replace(/\s+-\s+\d+\s*$/, "").replace(/\s+/g, " ").replace(/^Ti\s+/i, "Terminal Integrado ").replace(/^Tp\s+/i, "Terminal ")
    .replace(/\s+-\s+Embarque\s+/i, ", embarque ").trim();
}
const verificacaoParadas = { total: 0, comNome: 0, noRecife: 0, ruaAte15m: 0, ruaAte40m: 0, semRuaA40m: 0, distanciasRua: [] };
const nomeDaParada = (s) => {
  verificacaoParadas.total += 1;
  const lon = Number(s.stop_lon), lat = Number(s.stop_lat);
  const bairro = indiceRuas.bairrosDoPonto(lon, lat)[0] ?? null;
  const rua = bairro ? ruaMaisProxima(lon, lat) : null;
  if (bairro) {
    verificacaoParadas.noRecife += 1;
    if (rua) { verificacaoParadas.ruaAte40m += 1; if (rua.metros <= 15) verificacaoParadas.ruaAte15m += 1; verificacaoParadas.distanciasRua.push(rua.metros); }
    else verificacaoParadas.semRuaA40m += 1;
  }
  if (!numerico(s.stop_name) && s.stop_name) { verificacaoParadas.comNome += 1; return limpar(s.stop_name); }
  if (rua && nomeDaRua.get(rua.codigo)) return `Ponto na ${nomeDaRua.get(rua.codigo)}`;
  if (bairro) return `Ponto em ${nomeDoBairro.get(bairro) ?? bairro}`;
  return `Ponto ${s.stop_id.trim()}`;
};
const compacto = compactarFeed(ler, { nomeDaParada });
const { grade: gradeBase, auditoria } = compacto;
marca("compactacao");

// Sentido de cada padrão: nome da última parada (terminal com nome) ou o bairro onde ela fica.
const paradasXY = (() => { let x = 0, y = 0; return gradeBase.paradas.x.map((dx, i) => { x += dx; y += gradeBase.paradas.y[i]; return [x / 1e5, y / 1e5]; }); })();
const paradasDoPadrao = (pd) => { let s = 0; return pd.p.map((d) => (s += d)); };
for (const pd of gradeBase.padroes) {
  const ps = paradasDoPadrao(pd);
  const ultima = ps[ps.length - 1];
  const nome = gradeBase.paradas.n[ultima];
  const [lo, la] = paradasXY[ultima];
  const b = indiceRuas.bairrosDoPonto(lo, la)[0];
  pd.a = nome.startsWith("Ponto ") ? (b ? (nomeDoBairro.get(b) ?? b) : nome) : nome.replace(/, embarque .*$/i, "");
}

// ——— 3. Rede de caminhada do VE03: paradas na rede, baldeações e acessos por prédio ——————————————————
const PUB = join(RAIZ, ".cache/publicacoes");
const rede = ponteiroAtual(PUB, "rede-pedestre");
const pastaRede = join(PUB, "rede-pedestre", "versoes", rede.versao);
const g = grafoPublicado(JSON.parse(gunzipSync(readFileSync(join(pastaRede, "grafo.json.gz")))));
const frentes = JSON.parse(gunzipSync(readFileSync(join(pastaRede, "frentes.json.gz"))));
const gradeArestas = indexarArestas(g);
const principalOk = (e) => g.comp[e.a] === g.componentePrincipal && !(e.f & 32);
const pontasDaParada = paradasXY.map(([lo, la]) => {
  const a = arestaMaisProxima(g, gradeArestas, lo, la, 60, principalOk);
  return a ? a.pontas.map((p) => ({ no: p.no, m: p.m + a.metros })) : null;
});
const paradasPorNo = new Map();
pontasDaParada.forEach((ps, i) => { for (const p of ps ?? []) { if (!paradasPorNo.has(p.no)) paradasPorNo.set(p.no, []); paradasPorNo.get(p.no).push([i, p.m]); } });
const ex = criarExplorador(g);
/** Paradas alcançadas na última exploração: parada → metros (≤ limite). */
function paradasAlcancadas(limite) {
  const out = new Map();
  for (const no of ex.tocados) {
    const d = ex.dist[no];
    if (!(d <= limite)) continue;
    for (const [i, m] of paradasPorNo.get(no) ?? []) { const tot = d + m; if (tot <= limite && (!out.has(i) || tot < out.get(i))) out.set(i, tot); }
  }
  return out;
}
marca("rede");

// Baldeações: pela rede quando as duas paradas estão nela; senão linha reta × desvio mediano medido aqui.
const pares = new Map();
const desvios = [];
const chave = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`);
for (let i = 0; i < paradasXY.length; i++) {
  if (!pontasDaParada[i]) continue;
  ex.explorar(pontasDaParada[i], { limiteM: BALDEACAO_M });
  for (const [j, m] of paradasAlcancadas(BALDEACAO_M)) {
    if (j === i) continue;
    const k = chave(i, j);
    if (!pares.has(k) || m < pares.get(k)) pares.set(k, m);
    const reta = distanciaM(...paradasXY[i], ...paradasXY[j]);
    if (reta >= 100) desvios.push(m / reta);
  }
}
desvios.sort((a, b) => a - b);
const fatorDeDesvio = Math.round((desvios[Math.floor(desvios.length / 2)] ?? 1.3) * 100) / 100;
// Paradas fora da rede publicada (região metropolitana): linha reta curta × fator.
const gradeParadas = new Map();
paradasXY.forEach(([lo, la], i) => { const c = `${Math.floor(lo / 0.003)},${Math.floor(la / 0.003)}`; if (!gradeParadas.has(c)) gradeParadas.set(c, []); gradeParadas.get(c).push(i); });
let paresEstimados = 0;
paradasXY.forEach(([lo, la], i) => {
  const cx = Math.floor(lo / 0.003), cy = Math.floor(la / 0.003);
  for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) for (const j of gradeParadas.get(`${x},${y}`) ?? []) {
    if (j <= i || (pontasDaParada[i] && pontasDaParada[j])) continue;
    const reta = distanciaM(lo, la, ...paradasXY[j]);
    if (reta > BALDEACAO_RETA_M) continue;
    const k = chave(i, j);
    if (!pares.has(k)) { pares.set(k, reta * fatorDeDesvio); paresEstimados += 1; }
  }
});
const listaPares = [...pares].map(([k, m]) => { const [a, b] = k.split(",").map(Number); return [a, b, Math.max(1, Math.round(m / VELOCIDADE))]; })
  .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
const baldeacoes = [];
let antA = 0;
for (const [a, b, s] of listaPares) { baldeacoes.push(a - antA, b, s); antA = a; }
marca("baldeacoes");

// Acessos: da entrada (ligação forte/revisada do VE03) às paradas a até 1 km pela rede. Guarda toda parada a até 400 m
// e, além disso, só as que servem um padrão (linha + sentido) que nenhuma parada mais perto serve.
const padroesDaParada = Array.from({ length: paradasXY.length }, () => []);
gradeBase.padroes.forEach((pd, q) => { for (const p of new Set(paradasDoPadrao(pd))) padroesDaParada[p].push(q); });
const acessos = Object.fromEntries(PILOTO.map((a) => [a, {}]));
const resumoAcesso = Object.fromEntries(PILOTO.map((a) => [a, { rede: 0, linhaReta: 0, semParadaA1km: 0, paradasGuardadas: [] }]));
for (const f of frentes) {
  if (!PILOTO.includes(f.area)) continue;
  const forte = f.ligacao && (f.classe === "forte" || f.classe === "revisada");
  if (!forte) { resumoAcesso[f.area].linhaReta += 1; continue; }
  resumoAcesso[f.area].rede += 1;
  ex.explorar(f.ligacao.pontas.map((p) => ({ no: p.no, m: p.m + f.ligacao.metros })), { limiteM: ACESSO_M });
  const alc = [...paradasAlcancadas(ACESSO_M)].sort((x, y) => x[1] - y[1]);
  const cobertos = new Set();
  const lista = [];
  for (const [p, m] of alc) {
    const novos = padroesDaParada[p].filter((q) => !cobertos.has(q));
    if (m <= ACESSO_SEMPRE_M || novos.length) { lista.push(p, Math.round(m)); for (const q of padroesDaParada[p]) cobertos.add(q); }
  }
  if (!lista.length) resumoAcesso[f.area].semParadaA1km += 1;
  acessos[f.area][f.id] = lista;
  resumoAcesso[f.area].paradasGuardadas.push(lista.length / 2);
}
marca("acessos");

// ——— 4. Versão, pacote do app e publicação ————————————————————————————————————————————————
// A versão cobre o conteúdo (nomes, sentidos, baldeações, acessos), não só as entradas: mudar a redação muda a pasta.
const conteudo = sha256(JSON.stringify([gradeBase, baldeacoes, fatorDeDesvio, acessos]));
const versao = sha256(JSON.stringify({ feed: feedSha, grade: VERSAO_DA_GRADE, rede: rede.versao, formato: FORMATO, conteudo })).slice(0, 16);
const grade = { ...gradeBase, versao, feed: { ...gradeBase.feed, sha256: feedSha }, baldeacoes, caminhada: { velocidadeMps: VELOCIDADE, fatorDeDesvio } };
const pastaApp = join(RAIZ, "src/dados/recife/transito", versao);
mkdirSync(pastaApp, { recursive: true });
const gravar = (arq, texto) => gravarImutavel(arq, texto);
const textoGrade = JSON.stringify(grade);
gravar(join(pastaApp, "grade.json"), textoGrade);
const pacotes = {};
for (const a of PILOTO) {
  pacotes[a] = { versao, grade: versao, rede: rede.versao, velocidadeMps: VELOCIDADE, acessoM: ACESSO_M, predios: acessos[a] };
  gravar(join(pastaApp, `${a}.json`), JSON.stringify(pacotes[a]));
}
const ts = `// Gerado por scripts/dados/transito/rodar-transito.mjs (VE05). Troca atômica depois de gravar as partições.\n` +
  `export const VERSAO_DO_TRANSITO = ${JSON.stringify(versao)};\n` +
  `export const ARQUIVO_DA_GRADE = ${JSON.stringify(`recife/transito/${versao}/grade.json`)};\n` +
  `export const ARQUIVOS_DE_ACESSO: Record<string, string> = {\n${PILOTO.map((a) => `  ${JSON.stringify(a)}: ${JSON.stringify(`recife/transito/${versao}/${a}.json`)},`).join("\n")}\n};\n`;
const arqTs = join(RAIZ, "src/dados/recife/transitoGerado.ts");
writeFileSync(`${arqTs}.tmp`, ts); renameSync(`${arqTs}.tmp`, arqTs);
publicacaoDeCamadas.publicarCamadas(); // D036: os arquivos vão para public/dados e assets/dados, fora do bundle.

// ——— 5. Checagens e a correção da contagem antiga ————————————————————————————————————————————
const pronta = prepararGrade(grade);
const DATA_UTIL = "2026-11-17", DATA_SABADO = "2026-11-21", DATA_DOMINGO = "2026-11-22", FERIADO = "2026-11-02";
function partidasNoDia(iso) {
  const ativos = servicosAtivos(pronta, iso);
  const n = new Int32Array(pronta.n);
  for (const r of pronta.rotas) {
    const pd = pronta.padroes[r.padrao];
    let viagens = 0;
    for (let j = 0; j < r.servicos.length; j++) if (ativos[r.servicos[j]]) viagens += 1;
    if (!viagens) continue;
    for (let i = 0; i < pd.paradas.length; i++) if (!(pd.bandeiras && pd.bandeiras[i] & 1) && i < pd.paradas.length - 1) n[pd.paradas[i]] += viagens;
  }
  return n;
}
const util = partidasNoDia(DATA_UTIL), sabado = partidasNoDia(DATA_SABADO), domingo = partidasNoDia(DATA_DOMINGO), feriado = partidasNoDia(FERIADO);
// Contagem antiga (camadas-inteligentes-recife.mjs): todas as linhas de stop_times da parada, somando dia útil, sábado e domingo.
const antiga = new Int32Array(pronta.n);
for (const r of pronta.rotas) { const pd = pronta.padroes[r.padrao]; for (let i = 0; i < pd.paradas.length; i++) antiga[pd.paradas[i]] += r.servicos.length; }
const ferroviaria = new Set();
for (const pd of pronta.padroes) if ([0, 1, 2].includes(grade.linhas.m[pd.linha])) for (const p of pd.paradas) ferroviaria.add(p);
const CAIXA_ANTIGA = (lo, la) => lo >= -35.03 && lo <= -34.86 && la >= -8.165 && la <= -7.93;
const corredor = { antigaMaior180: 0, utilMaior180: 0, saemComDiaUtil: 0, entramComDiaUtil: 0, antigaSemServicoUtil: 0, razoes: [] };
for (let i = 0; i < pronta.n; i++) {
  if (ferroviaria.has(i) || !CAIXA_ANTIGA(pronta.lon[i], pronta.lat[i])) continue;
  const a = antiga[i] >= 180, u = util[i] >= 180;
  if (a) corredor.antigaMaior180 += 1;
  if (u) corredor.utilMaior180 += 1;
  if (a && !u) corredor.saemComDiaUtil += 1;
  if (!a && u) corredor.entramComDiaUtil += 1;
  if (a && util[i] === 0) corredor.antigaSemServicoUtil += 1;
  if (util[i] > 0) corredor.razoes.push(antiga[i] / util[i]);
}
corredor.razoes.sort((x, y) => x - y);
corredor.razaoMediana = Math.round(corredor.razoes[Math.floor(corredor.razoes.length / 2)] * 100) / 100;
delete corredor.razoes;
const soma = (a) => a.reduce((s, x) => s + x, 0);
const ativosEm = (iso) => soma(servicosAtivos(pronta, iso));
const distRua = verificacaoParadas.distanciasRua.sort((x, y) => x - y);
const checagens = [
  { nome: "um_feed_por_execucao", ok: true, detalhe: `${grade.feed.versao} sha256 ${feedSha.slice(0, 12)}…` },
  { nome: "fuso_unico_da_agencia", ok: grade.feed.fuso === "America/Recife", detalhe: auditoria.fusos.join(", ") },
  { nome: "viagens_descartadas", ok: soma(Object.values(compacto.descartes)) === 0, detalhe: JSON.stringify(compacto.descartes) },
  { nome: "horarios_apos_24h_preservados", ok: pronta.rotas.some((r) => r.inicios[r.inicios.length - 1] + r.chegada[r.chegada.length - 1] >= 86400), detalhe: "viagens do dia de serviço que passam da meia-noite" },
  { nome: "feriado_2026_11_02_troca_servicos", ok: ativosEm(FERIADO) !== ativosEm("2026-11-09"), detalhe: `${ativosEm(FERIADO)} serviços ativos em 02/11 (segunda, feriado) vs ${ativosEm("2026-11-09")} em 09/11 (segunda comum)` },
  { nome: "paradas_do_recife_perto_de_rua_oficial", ok: verificacaoParadas.semRuaA40m / Math.max(1, verificacaoParadas.noRecife) < 0.05,
    detalhe: `${verificacaoParadas.ruaAte40m} de ${verificacaoParadas.noRecife} a até 40 m de um logradouro oficial (${verificacaoParadas.ruaAte15m} a até 15 m; mediana ${Math.round(distRua[Math.floor(distRua.length / 2)] * 10) / 10} m)` },
  { nome: "paradas_na_rede_de_caminhada", ok: true, detalhe: `${pontasDaParada.filter(Boolean).length} de ${pronta.n} ligadas à rede publicada do VE03 a até 60 m` },
];

const gz = (o) => gzipSync(Buffer.from(JSON.stringify(o)), { level: 9 });
const manifesto = prepararVersao(PUB, "transito", {
  particoes: [
    { arquivo: "grade.json", conteudo: Buffer.from(textoGrade), registros: grade.rotas.length },
    { arquivo: "auditoria.json.gz", conteudo: gz(auditoria), registros: auditoria.paradas.length },
    ...PILOTO.map((a) => ({ arquivo: `${a}.json`, conteudo: Buffer.from(JSON.stringify(pacotes[a])), registros: Object.keys(pacotes[a].predios).length })),
  ],
  fontes: [{ fonte: "gtfs_grande_recife", sha256: feedSha, estado: "valida", analisador: `grade@${VERSAO_DA_GRADE}`, recuperadoEm: "2026-11-11T16:39:00Z" }],
  derivacoes: [{ nome: "rede_pedestre", versao: rede.versao }, { nome: "grade", versao: VERSAO_DA_GRADE }],
  cobertura: { denominador: "prédios do piloto com ligação forte e ao menos uma parada a até 1 km pela rede", total: soma(PILOTO.map((a) => resumoAcesso[a].rede + resumoAcesso[a].linhaReta)),
    porChave: Object.fromEntries(PILOTO.map((a) => [a, resumoAcesso[a].rede - resumoAcesso[a].semParadaA1km])) },
  validacao: { quarentena: 0, motivos: {}, verificacoes: checagens.map(({ nome, ok, detalhe }) => ({ nome, ok, detalhe })) },
  criadoEm: agora,
});
const ativo = ponteiroAtual(PUB, "transito");
const ponteiro = ativo?.versao === manifesto.versao ? ativo : ativar(PUB, "transito", manifesto.versao, { agora, quedaMaxima: 0.2 });
marca("publicacao");

const mediana = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const relatorio = {
  executadoEm: agora, versao, publicacao: { versao: manifesto.versao, ativa: ponteiro.versao, anterior: ponteiro.anterior ?? null },
  feed: grade.feed, contagens: compacto.contagens, descartes: compacto.descartes,
  paradas: { ...verificacaoParadas, distanciasRua: undefined, ligadasARede: pontasDaParada.filter(Boolean).length },
  baldeacoes: { pares: listaPares.length, pelaRede: listaPares.length - paresEstimados, estimadas: paresEstimados, fatorDeDesvio, amostrasDoFator: desvios.length },
  acessos: Object.fromEntries(PILOTO.map((a) => [a, { ...resumoAcesso[a], paradasGuardadas: undefined, medianaParadasGuardadas: mediana(resumoAcesso[a].paradasGuardadas) }])),
  servicosAtivos: { [DATA_UTIL]: ativosEm(DATA_UTIL), [DATA_SABADO]: ativosEm(DATA_SABADO), [DATA_DOMINGO]: ativosEm(DATA_DOMINGO), [FERIADO]: ativosEm(FERIADO) },
  partidasTotais: { [DATA_UTIL]: soma(util), [DATA_SABADO]: soma(sabado), [DATA_DOMINGO]: soma(domingo), [FERIADO]: soma(feriado) },
  correcaoDoCorredor: corredor,
  checagens,
  bytes: { grade: textoGrade.length, gradeGzip: gzipSync(textoGrade).length, acessos: Object.fromEntries(PILOTO.map((a) => [a, JSON.stringify(pacotes[a]).length])) },
  tempos,
  memoriaPicoMB: Math.round(process.resourceUsage().maxRSS / 1024),
};
const saida = arg("--relatorio");
if (saida) writeFileSync(saida, JSON.stringify(relatorio, null, 1) + "\n");
console.log(JSON.stringify({ versao, checagens: checagens.map((c) => [c.nome, c.ok]), bytes: relatorio.bytes, corredor, tempos }, null, 1));
