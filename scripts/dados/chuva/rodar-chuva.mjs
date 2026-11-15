// VE06 — livro de alagamentos (Defesa Civil 2014–2024), episódios, vínculo à rede de caminhada e reprodução histórica:
// "se este trecho ficar intransitável a pé, como fica o caminho até o mercado/farmácia/ponto?" para os prédios do piloto.
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/chuva/rodar-chuva.mjs \
//     --relatorio docs/aplicacao/execucoes/VE06/chuva.json
// Sem rede: lê os caches da Defesa Civil (.cache/dados-recife), a rede e as frentes do VE03 e o catálogo do VE04.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import publicacaoDeCamadas from "../publicar-camadas.cjs";
import { Buffer } from "node:buffer";
import { gunzipSync, gzipSync } from "node:zlib";
import { categoriaDaOcorrencia, lerAtendimentoDaDefesaCivil } from "../rua/nucleo.mjs";
import { arestaMaisProxima, grafoPublicado, indexarArestas } from "../rede/grafo.mjs";
import { criarIndiceDeRuas, vincularRua } from "../observacoes/vinculo.mjs";
import { ativar, ponteiroAtual, prepararVersao } from "../observacoes/publicar.mjs";
import { alcancados, criarExplorador, indexarDestinos } from "../destinos/alcance.mjs";
import { VERSAO_DO_LIVRO, agruparObservacoes, arestasSobre, dataDaLinha, episodios, registroDoLivro } from "./livro.mjs";
import { AREAS } from "../areas.mjs";
import { gravarFolha } from "../folhas.mjs";
import { gravarImutavel } from "../imutavel.mjs";
import { VERSAO_DO_HISTORICO, cruzarPontos, cruzarTrechos, distanciaAosSegmentos, vincularObservacoesARuas } from "./historico.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const PILOTO = AREAS; // VE16: piloto + expansão (scripts/dados/areas.json)
const CATEGORIAS = ["mercado", "farmacia", "transporte"];
// Formato 3 (15/11/2026): histórico da rua confirmada (via e imóvel, meses e anos), catálogos do eSIG e desvios pequenos.
const VELOCIDADE = 1.2, LIMITE_M = 2000, RUA_LONGA_M = 1000, FORMATO = 3;
// Catálogo do eSIG perto da entrada: ponto até 400 m na mesma rua; trecho catalogado até 150 m.
const PONTO_PERTO_M = 400, TRECHO_PERTO_M = 150;
// Só chega à pessoa o que muda a rotina: ≥ 3 min a mais ou perda do acesso a pé em até 2 km.
const MINUTOS_MATERIAIS = 3;
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const agora = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString().replace(".000Z", "Z");
const slugDe = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const t0 = Date.now();

// ——— 1. Livro ———————————————————————————————————————————————————————————————————————————————
const registros = [];
const fontes = [];
for (let ano = 2014; ano <= 2024; ano++) {
  const arq = join(RAIZ, `.cache/dados-recife/defesa-civil-${ano}.json`);
  const bruto = readFileSync(arq);
  const d = JSON.parse(bruto);
  fontes.push({ fonte: `defesa_civil_${ano}`, sha256: sha256(bruto), linhas: (d.registros ?? d.atendimentos).length, comData: Boolean(d.registros) });
  for (const r of d.registros ?? d.atendimentos) {
    // 2014–2019: o cache guarda linhas já lidas, só com o ano (data incerta). 2020–2024: linhas do CKAN com a data.
    const a = d.registros ? lerAtendimentoDaDefesaCivil(r) : r;
    if (!a || categoriaDaOcorrencia(a.ocorrencia) !== "alagamento") continue;
    registros.push(registroDoLivro(`defesa_civil_${ano}`, a, d.registros ? dataDaLinha(r) : null));
  }
}
const observacoes = agruparObservacoes(registros);
const epis = episodios(observacoes.map((o) => o.dataAdministrativa));
for (const o of observacoes) o.episodio = o.dataAdministrativa ? epis.get(o.dataAdministrativa) : null;

// ——— 2. Vínculo à rede de caminhada (só "via alagada") ——————————————————————————————————————————
const trechos = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/trechos-de-logradouros.geojson"), "utf8"));
const bairrosGeo = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/bairros-do-recife.geojson"), "utf8"));
const indiceRuas = criarIndiceDeRuas(trechos, bairrosGeo);
const segmentosPorCodigo = new Map();
for (const f of trechos.features) {
  const c = Number(f.properties.CLOGRACODI);
  if (!f.geometry || !Number.isFinite(c)) continue;
  const ls = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const l of ls) for (let i = 0; i + 1 < l.length; i++) {
    if (!segmentosPorCodigo.has(c)) segmentosPorCodigo.set(c, []);
    segmentosPorCodigo.get(c).push({ ax: l[i][0], ay: l[i][1], bx: l[i + 1][0], by: l[i + 1][1] });
  }
}
const PUB = join(RAIZ, ".cache/publicacoes");
const rede = ponteiroAtual(PUB, "rede-pedestre");
const pastaRede = join(PUB, "rede-pedestre", "versoes", rede.versao);
const g = grafoPublicado(JSON.parse(gunzipSync(readFileSync(join(pastaRede, "grafo.json.gz")))));
const frentes = JSON.parse(gunzipSync(readFileSync(join(pastaRede, "frentes.json.gz"))));
const gradeArestas = indexarArestas(g);
const metrosDoSeg = (s) => Math.hypot((s.bx - s.ax) * 111320 * Math.cos((s.ay * Math.PI) / 180), (s.by - s.ay) * 110574);
const dentroDoBairro = (slug) => (s) => indiceRuas.bairrosDoPonto((s.ax + s.bx) / 2, (s.ay + s.by) / 2).includes(slug);

const vinculo = { porMetodo: {} };
for (const o of observacoes) {
  o.arestas = [];
  if (o.tipo !== "via_alagada") { o.vinculo = "nao_e_via"; continue; }
  const slug = slugDe(o.bairro);
  if (o.precisaoDoLocal === "lugar_nomeado") {
    // Túnel nomeado: as arestas de túnel (bit 4) da rede dentro do bairro do registro. Outros lugares nomeados ficam sem vínculo.
    if (/^tunel/i.test(slugDe(o.rua))) {
      const ks = [];
      g.arestas.forEach((e, k) => { if (e.f & 4 && indiceRuas.bairrosDoPonto((g.lon[e.a] + g.lon[e.b]) / 2, (g.lat[e.a] + g.lat[e.b]) / 2).includes(slug)) ks.push(k); });
      o.arestas = ks; o.vinculo = ks.length ? "tunel_no_bairro" : "tunel_sem_aresta";
    } else o.vinculo = "lugar_sem_geometria";
  } else {
    const v = vincularRua(indiceRuas, o.rua, slug);
    o.codigoDaRua = v.codigo; o.vinculo = v.metodo;
    if (v.codigo !== null) {
      // Rua longa: só o trecho dentro do bairro do registro (a fonte não diz o ponto do alagamento).
      const todos = segmentosPorCodigo.get(v.codigo) ?? [];
      const seg = todos.filter(dentroDoBairro(slug));
      o.trechoM = Math.round(seg.reduce((s, x) => s + metrosDoSeg(x), 0));
      o.ruaLonga = o.trechoM > RUA_LONGA_M;
      o.arestas = [...arestasSobre(g, gradeArestas, seg)];
      if (!o.arestas.length) o.vinculo = `${v.metodo}_sem_aresta`;
    }
  }
  vinculo.porMetodo[o.vinculo] = (vinculo.porMetodo[o.vinculo] ?? 0) + 1;
}
const ligadas = observacoes.filter((o) => o.arestas.length);
// Histórico por rua (via + imóvel) e catálogos do eSIG, cruzados com a malha oficial.
const contagemDoHistorico = {};
const obsPorRua = vincularObservacoesARuas(observacoes, indiceRuas, contagemDoHistorico);
const ESIG = join(RAIZ, "docs/dados/raw/fontes-prioritarias-2026-11-14");
const brutoPontos = readFileSync(join(ESIG, "pontos-alagamento.geojson")), brutoTrechosEsig = readFileSync(join(ESIG, "logradouros-alagamento-2026.geojson"));
const pontosEsig = cruzarPontos(JSON.parse(brutoPontos), indiceRuas, segmentosPorCodigo);
const trechosEsig = cruzarTrechos(JSON.parse(brutoTrechosEsig), indiceRuas);
const segsEsigPorCodigo = new Map();
for (const f of JSON.parse(brutoTrechosEsig).features) {
  const c = Number(f.properties.clogracodi);
  if (!f.geometry || !Number.isFinite(c)) continue;
  const ls = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const l of ls) for (let i = 0; i + 1 < l.length; i++) (segsEsigPorCodigo.get(c) ?? segsEsigPorCodigo.set(c, []).get(c)).push({ ax: l[i][0], ay: l[i][1], bx: l[i + 1][0], by: l[i + 1][1] });
}
const pontosPorCodigo = new Map();
for (const p of pontosEsig) if (p.codigo !== null) (pontosPorCodigo.get(p.codigo) ?? pontosPorCodigo.set(p.codigo, []).get(p.codigo)).push(p);
fontes.push({ fonte: "esig_pontos_alagamento", sha256: sha256(brutoPontos), linhas: pontosEsig.length, comData: false });
fontes.push({ fonte: "esig_logradouros_alagamento_2026", sha256: sha256(brutoTrechosEsig), linhas: trechosEsig.length, comData: false });
const obsPorAresta = new Map();
ligadas.forEach((o) => { for (const k of o.arestas) { if (!obsPorAresta.has(k)) obsPorAresta.set(k, []); obsPorAresta.get(k).push(o); } });

// ——— 3. Reprodução histórica nos prédios do piloto ——————————————————————————————————————————————
const pubEss = ponteiroAtual(PUB, "essenciais");
const locais = JSON.parse(gunzipSync(readFileSync(join(PUB, "essenciais", "versoes", pubEss.versao, "locais.json.gz"))))
  .filter((l) => CATEGORIAS.includes(l.categoria));
const principalOk = (e) => g.comp[e.a] === g.componentePrincipal && !(e.f & 32);
for (const l of locais) {
  const a = arestaMaisProxima(g, gradeArestas, l.ponto[0], l.ponto[1], 60, principalOk);
  l.pontas = a ? a.pontas.map((p) => ({ no: p.no, m: p.m + a.metros })) : [];
}
const mapas = indexarDestinos(locais.filter((l) => l.pontas.length));
const indiceDoLocal = new Map(locais.filter((l) => l.pontas.length).map((l, i) => [i, l]));
const ex = criarExplorador(g);
const minutos = (m) => Math.round(m / VELOCIDADE / 6) / 10;
const cenarios = Object.fromEntries(PILOTO.map((a) => [a, []]));
const proprias = Object.fromEntries(PILOTO.map((a) => [a, []]));
const resumo = Object.fromEntries(PILOTO.map((a) => [a, { predios: 0, comCenario: 0, porCategoria: {}, perdeAcesso: 0, mesmoLocalOutroCaminho: 0, outroLocal: 0, comHistoricoDaRua: 0, comCatalogoPerto: 0, soDesvioPequeno: 0 }]));
const pequenos = Object.fromEntries(PILOTO.map((a) => [a, []]));
const historicos = Object.fromEntries(PILOTO.map((a) => [a, []]));
for (const f of frentes) {
  if (!PILOTO.includes(f.area) || !(f.ligacao && (f.classe === "forte" || f.classe === "revisada"))) continue;
  resumo[f.area].predios += 1;
  const origens = f.ligacao.pontas.map((p) => ({ no: p.no, m: p.m + f.ligacao.metros }));
  // Aresta onde a entrada se liga à rede: se o alagamento registrado está nela, é a rua do próprio prédio.
  const nos = new Set(origens.map((o) => o.no));
  const daEntrada = new Set();
  for (const no of nos) for (let j = g.inicio[no]; j < g.inicio[no + 1]; j++) { const e = g.arestas[g.qual[j]]; if (nos.size === 1 || (nos.has(e.a) && nos.has(e.b))) daEntrada.add(g.qual[j]); }
  const propriasDoPredio = new Set();
  for (const k of daEntrada) for (const o of obsPorAresta.get(k) ?? []) propriasDoPredio.add(o);
  for (const o of propriasDoPredio) proprias[f.area].push({ predio: f.id, obs: o });
  let algum = propriasDoPredio.size > 0;
  for (const c of CATEGORIAS) {
    const mapa = mapas.get(c);
    if (!mapa) continue;
    ex.explorar(origens, { limiteM: LIMITE_M });
    const antes = alcancados(ex, mapa)[0];
    if (!antes) continue;
    const caminho = ex.caminhoAte(antes.no);
    const tocadas = new Map();
    for (const k of caminho) for (const o of obsPorAresta.get(k) ?? []) tocadas.set(o, true);
    for (const o of tocadas.keys()) {
      if (propriasDoPredio.has(o)) continue;
      ex.explorar(origens, { limiteM: LIMITE_M, proibidas: new Set(o.arestas) });
      const depois = alcancados(ex, mapa)[0] ?? null;
      const r = resumo[f.area];
      r.comparados = (r.comparados ?? 0) + 1;
      if (depois && minutos(depois.metros) - minutos(antes.metros) < MINUTOS_MATERIAIS) {
        // Desvio pequeno: fica como histórico do caminho (a rua tem registro), sem virar consequência.
        r.imateriais = (r.imateriais ?? 0) + 1;
        pequenos[f.area].push({ predio: f.id, categoria: c, obs: o, mais: Math.max(0, Math.round((minutos(depois.metros) - minutos(antes.metros)) * 10) / 10) });
        continue;
      }
      r.porCategoria[c] = (r.porCategoria[c] ?? 0) + 1;
      if (!depois) r.perdeAcesso += 1; else if (depois.local === antes.local) r.mesmoLocalOutroCaminho += 1; else r.outroLocal += 1;
      cenarios[f.area].push({ predio: f.id, categoria: c, obs: o, antes: { local: antes.local, metros: antes.metros }, depois: depois ? { local: depois.local, metros: depois.metros } : null });
      algum = true;
    }
  }
  if (algum) resumo[f.area].comCenario += 1;
  // Histórico da rua confirmada (ligação forte pelo mesmo código): registros no bairro do prédio e catálogo do eSIG perto.
  const C = f.principal?.codigo ?? null;
  if (C !== null && f.ligacao.metodo === "via_com_mesmo_codigo") {
    const obsDaRua = obsPorRua.get(`${C}|${f.area}`) ?? [];
    const [ex0, ey0] = f.entrada;
    const pontoPerto = (pontosPorCodigo.get(C) ?? []).map((p) => ({ p, m: Math.round(Math.hypot((p.lon - ex0) * 111320 * Math.cos((ey0 * Math.PI) / 180), (p.lat - ey0) * 110574)) }))
      .filter((x) => x.m <= PONTO_PERTO_M).sort((a, b) => a.m - b.m)[0] ?? null;
    const dTrecho = segsEsigPorCodigo.has(C) ? Math.round(distanciaAosSegmentos(ex0, ey0, segsEsigPorCodigo.get(C))) : null;
    const trechoPerto = dTrecho !== null && dTrecho <= TRECHO_PERTO_M ? dTrecho : null;
    if (obsDaRua.length || pontoPerto || trechoPerto !== null) {
      historicos[f.area].push({ predio: f.id, codigo: C, obs: obsDaRua, ponto: pontoPerto, trechoM: trechoPerto });
      if (obsDaRua.length) resumo[f.area].comHistoricoDaRua += 1;
      if (pontoPerto || trechoPerto !== null) resumo[f.area].comCatalogoPerto += 1;
    }
  }
  if (!algum && pequenos[f.area].some((x) => x.predio === f.id)) resumo[f.area].soDesvioPequeno += 1;
  if (propriasDoPredio.size) resumo[f.area].ruaPropria = (resumo[f.area].ruaPropria ?? 0) + 1;
}

// ——— 4. G-RAIN: observações de via ligadas à rede, em episódios; dois episódios inteiros ficam de fora ————————
const hashDe = (s) => sha256(`VE06-grain|${s}`);
const ligadasDatadas = ligadas.filter((o) => o.episodio);
const episLigados = [...new Set(ligadasDatadas.map((o) => o.episodio))].sort((a, b) => hashDe(a).localeCompare(hashDe(b)));
const reservados = new Set(episLigados.slice(0, 2));
const doConjunto = [...ligadasDatadas.sort((a, b) => hashDe(a.ids[0]).localeCompare(hashDe(b.ids[0])))].slice(0, 30);
for (const o of observacoes.filter((x) => x.tipo === "via_alagada" && !x.dataAdministrativa).slice(0, 4)) doConjunto.push(o); // data incerta
for (const o of observacoes.filter((x) => x.tipo === "via_alagada" && /^(ambiguo|nome_fora_do_bairro|sem_correspondencia)/.test(x.vinculo)).slice(0, 4)) doConjunto.push(o); // local ambíguo
const gRain = {
  conjunto: "G-RAIN", versao: 1, criadoEm: "2026-11-14", epoca: "VE06",
  selecao: "observações de 'via alagada' da Defesa Civil 2020–2024 ligadas à rede (ordem do SHA-256 do id), mais 4 só com ano e 4 de local ambíguo; episódios = datas com folga ≤ 1 dia; dois episódios inteiros reservados (teste) pela ordem do SHA-256",
  revisao: "nao_revisado", episodiosReservados: [...reservados],
  casos: doConjunto.map((o) => ({ id: o.ids[0], ids: o.ids, repeticoes: o.repeticoes, data: o.dataAdministrativa, ano: o.ano, precisaoDaData: o.precisaoDaData, episodio: o.episodio ?? null,
    divisao: o.episodio && reservados.has(o.episodio) ? "teste" : "desenvolvimento", rua: o.rua, bairro: o.bairro, ocorrencia: o.ocorrencia, vinculo: o.vinculo,
    codigoDaRua: o.codigoDaRua ?? null, trechoM: o.trechoM ?? null, ruaLonga: o.ruaLonga ?? null, arestas: o.arestas.length, modoAfetado: o.modoAfetado })),
};
// VE16: a seleção do G-RAIN é fixada na criação (divisão teste/desenvolvimento); uma atualização não a refaz.
const SET_RAIN = join(RAIZ, "docs/aplicacao/evaluation-sets/g-rain.json");
if (!existsSync(SET_RAIN)) writeFileSync(SET_RAIN, JSON.stringify(gRain, null, 1) + "\n");
const gRainFixado = JSON.parse(readFileSync(SET_RAIN, "utf8"));
const csv = [["caso", "data", "episodio", "divisao", "rua", "bairro", "ocorrencia", "vinculo", "trecho_m", "REVISAO_local_correto(sim/nao/incerto)", "REVISAO_data_do_evento", "REVISAO_modo(pe/veiculo/ambos/incerto)", "REVISAO_nota"]];
for (const c of gRainFixado.casos) csv.push([c.id, c.data ?? `ano ${c.ano}`, c.episodio ?? "", c.divisao, c.rua, c.bairro, c.ocorrencia, c.vinculo, c.trechoM ?? "", "", "", "", ""]);
gravarFolha(join(RAIZ, "docs/aplicacao/evaluation-sets/g-rain-revisao.csv"), csv.map((l) => l.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n");

// ——— 5. Pacote do app e publicação ————————————————————————————————————————————————————————————
const versao = sha256(JSON.stringify({ livro: VERSAO_DO_LIVRO, historico: VERSAO_DO_HISTORICO, rede: rede.versao, essenciais: pubEss.versao, fontes: fontes.map((x) => x.sha256), formato: FORMATO,
  conteudo: sha256(JSON.stringify([Object.values(cenarios).map((l) => l.map((c) => [c.predio, c.categoria, c.obs.ids[0], c.antes, c.depois])), Object.values(proprias).map((l) => l.map((p) => [p.predio, p.obs.ids[0]])),
    Object.values(pequenos).map((l) => l.map((p) => [p.predio, p.categoria, p.obs.ids[0], p.mais])), Object.values(historicos).map((l) => l.map((h) => [h.predio, h.codigo, h.obs.map((o) => o.ids[0]), h.ponto?.p.id ?? null, h.ponto?.m ?? null, h.trechoM]))])) })).slice(0, 16);
// VE16: "geradoEm" é a data do dado mais novo usado (não a hora da execução): mesma entrada, mesmo arquivo.
// Os CSVs da Defesa Civil em .cache/dados-recife foram obtidos em 14/11/2026 (mesma data declarada no manifesto).
const RECUPERADO_EM = "2026-11-14T00:00:00Z";
const dataDosDados = RECUPERADO_EM;
const pacotes = {};
for (const a of PILOTO) {
  const obsIdx = new Map(), locIdx = new Map();
  const refO = (o) => { if (!obsIdx.has(o)) obsIdx.set(o, obsIdx.size); return obsIdx.get(o); };
  const refL = (i) => { if (!locIdx.has(i)) locIdx.set(i, locIdx.size); return locIdx.get(i); };
  const predios = {};
  const ruaPropria = {};
  for (const p of proprias[a]) (ruaPropria[p.predio] ??= []).push(refO(p.obs));
  const pequenosDoBairro = {};
  for (const p of pequenos[a]) (pequenosDoBairro[p.predio] ??= []).push({ c: p.categoria, o: refO(p.obs), mais: p.mais });
  const ruaIdx = new Map();
  const ruas = [];
  const historico = {};
  for (const h of historicos[a]) {
    if (!ruaIdx.has(h.codigo)) { ruaIdx.set(h.codigo, ruas.length); ruas.push({ codigo: h.codigo, nome: indiceRuas.porCodigo.get(h.codigo)?.nome || h.obs[0]?.rua || String(h.codigo) }); }
    historico[h.predio] = { r: ruaIdx.get(h.codigo), o: h.obs.map(refO), pc: h.ponto ? { m: h.ponto.m, precisao: h.ponto.p.precisao } : null, tc: h.trechoM };
  }
  for (const c of cenarios[a]) {
    (predios[c.predio] ??= []).push({ c: c.categoria, o: refO(c.obs), a: { l: refL(c.antes.local), m: Math.round(c.antes.metros), min: minutos(c.antes.metros) },
      d: c.depois ? { l: refL(c.depois.local), m: Math.round(c.depois.metros), min: minutos(c.depois.metros) } : null });
  }
  pacotes[a] = {
    versao, geradoEm: dataDosDados, rede: rede.versao, velocidadeMps: VELOCIDADE, limiteM: LIMITE_M,
    fonte: "Defesa Civil do Recife, atendimentos 2014–2024 (dados.recife.pe.gov.br)",
    catalogo: "Prefeitura do Recife, eSIG: pontos de alagamento (edição de 25/09/2026) e logradouros de alagamento 2026 (edição de 08/05/2026)",
    observacoes: [...obsIdx.keys()].map((o) => ({ data: o.dataAdministrativa, ano: o.ano, tipo: o.tipo, rua: o.rua, bairro: o.bairro, ocorrencia: o.ocorrencia, repeticoes: o.repeticoes,
      episodio: o.episodio ?? null, ruaLonga: Boolean(o.ruaLonga), trechoM: o.trechoM ?? null, lugarNomeado: o.precisaoDoLocal === "lugar_nomeado" })),
    locais: [...locIdx.keys()].map((i) => { const l = indiceDoLocal.get(i); return { nome: l.nome ?? null, categoria: l.categoria }; }),
    predios,
    ruaPropria,
    pequenos: pequenosDoBairro,
    ruas,
    historico,
  };
}
const pastaApp = join(RAIZ, "src/dados/recife/chuva", versao);
mkdirSync(pastaApp, { recursive: true });
for (const a of PILOTO) {
  const arq = join(pastaApp, `${a}.json`), texto = JSON.stringify(pacotes[a]);
  gravarImutavel(arq, texto);
}
const ts = `// Gerado por scripts/dados/chuva/rodar-chuva.mjs (VE06). Troca atômica depois de gravar as partições.\n` +
  `export const VERSAO_DA_CHUVA = ${JSON.stringify(versao)};\n` +
  `export const ARQUIVOS_DA_CHUVA: Record<string, string> = {\n${PILOTO.map((a) => `  ${JSON.stringify(a)}: ${JSON.stringify(`recife/chuva/${versao}/${a}.json`)},`).join("\n")}\n};\n`;
const arqTs = join(RAIZ, "src/dados/recife/chuvaGerado.ts");
writeFileSync(`${arqTs}.tmp`, ts); renameSync(`${arqTs}.tmp`, arqTs);
publicacaoDeCamadas.publicarCamadas(); // D036: os arquivos vão para public/dados e assets/dados, fora do bundle.

const contar = (l, k) => l.reduce((m, x) => ({ ...m, [x[k]]: (m[x[k]] ?? 0) + 1 }), {});
const gz = (o) => gzipSync(Buffer.from(JSON.stringify(o)), { level: 9 });
const manifesto = prepararVersao(PUB, "chuva", {
  particoes: [
    { arquivo: "livro.json.gz", conteudo: gz(registros), registros: registros.length },
    { arquivo: "observacoes.json.gz", conteudo: gz(observacoes.map(({ arestas, ...o }) => ({ ...o, arestas: arestas.length }))), registros: observacoes.length },
    ...PILOTO.map((a) => ({ arquivo: `${a}.json`, conteudo: Buffer.from(JSON.stringify(pacotes[a])), registros: new Set([...Object.keys(pacotes[a].predios), ...Object.keys(pacotes[a].ruaPropria), ...Object.keys(pacotes[a].historico)]).size })),
  ],
  fontes: fontes.map((f) => ({ fonte: f.fonte, sha256: f.sha256, estado: "valida", analisador: `livro@${VERSAO_DO_LIVRO}`, recuperadoEm: RECUPERADO_EM })),
  derivacoes: [{ nome: "rede_pedestre", versao: rede.versao }, { nome: "essenciais", versao: pubEss.versao }, { nome: "livro", versao: VERSAO_DO_LIVRO }],
  cobertura: { denominador: "prédios do piloto com ligação forte cujo caminho diário muda ≥ 3 min (ou se perde) sem uma rua com alagamento registrado, ou cuja própria rua tem registro", total: PILOTO.reduce((s, a) => s + resumo[a].predios, 0),
    // Chave nova desde o formato 2: conta só cenários materiais (≥ 3 min ou perda) e rua própria; não se compara à antiga.
    porChave: Object.fromEntries(PILOTO.map((a) => [`${a}:material`, resumo[a].comCenario])) },
  validacao: { quarentena: 0, motivos: {}, verificacoes: [{ nome: "data_e_administrativa", ok: registros.every((r) => r.horaDoEvento === null), detalhe: "nenhum registro traz hora de evento" }] },
  criadoEm: agora,
});
const redefinicao = arg("--redefinir-cobertura");
const ativo = ponteiroAtual(PUB, "chuva");
const ponteiro = ativo?.versao === manifesto.versao ? ativo : ativar(PUB, "chuva", manifesto.versao, redefinicao
  // Redefinir o que a cobertura conta exige motivo explícito, que fica gravado no ponteiro (parcialAceita).
  ? { agora, quedaMaxima: 1, aceitarParcial: `redefinicao_da_cobertura: ${redefinicao}` } : { agora, quedaMaxima: 0.5 });
const relatorio = {
  executadoEm: agora, versao, publicacao: { versao: manifesto.versao, ativa: ponteiro.versao, anterior: ponteiro.anterior ?? null }, fontes,
  registros: { total: registros.length, porTipo: contar(registros, "tipo"), porPrecisaoDaData: contar(registros, "precisaoDaData"), porPrecisaoDoLocal: contar(registros, "precisaoDoLocal") },
  observacoes: { total: observacoes.length, comRepeticao: observacoes.filter((o) => o.repeticoes > 1).length, porTipo: contar(observacoes, "tipo") },
  episodios: { total: new Set(epis.values()).size, maiores: Object.entries(contar(observacoes.filter((o) => o.episodio), "episodio")).sort((a, b) => b[1] - a[1]).slice(0, 8) },
  vinculo: { ...vinculo, ligadasARede: ligadas.length, ruasLongas: ligadas.filter((o) => o.ruaLonga).length,
    imoveisPorMetodo: contar(observacoes.filter((o) => o.tipo === "imovel_alagado"), "vinculo"), historico: contagemDoHistorico },
  esig: {
    pontos: { total: pontosEsig.length, porEstado: contar(pontosEsig, "estado"), porPrecisao: contar(pontosEsig, "precisao"), bairroConfere: pontosEsig.filter((p) => p.bairroConfere).length,
      camposSempreVazios: ["recorrencia", "n_recorrencia", "mare", "n_mare", "lamina"].filter((k) => pontosEsig.every((p) => p.camposVazios.includes(k))) },
    trechos: { total: trechosEsig.length, codigoNaMalha: trechosEsig.filter((t) => t.codigoNaMalha).length, nomeConfere: trechosEsig.filter((t) => t.nomeConfere).length,
      codigosDistintos: new Set(trechosEsig.map((t) => t.codigo)).size, noPiloto: trechosEsig.filter((t) => t.bairros.some((b) => PILOTO.includes(b))).length },
    pontoXlivro: pontosEsig.filter((p) => p.codigo !== null).map((p) => ({ id: p.id, logradouro: p.logradouro, bairro: p.bairroDoPoligono, precisao: p.precisao,
      registrosNoLivro: (obsPorRua.get(`${p.codigo}|${p.bairroDoPoligono}`) ?? []).length })),
    detalhePontos: pontosEsig, detalheTrechos: trechosEsig,
  },
  piloto: resumo,
  exemplos: PILOTO.flatMap((a) => cenarios[a].slice(0, 2).map((c) => ({ area: a, predio: c.predio, categoria: c.categoria, data: c.obs.dataAdministrativa ?? `ano ${c.obs.ano}`, rua: c.obs.rua,
    antesMin: minutos(c.antes.metros), depoisMin: c.depois ? minutos(c.depois.metros) : null, mesmoLocal: c.depois?.local === c.antes.local }))),
  gRain: { casos: gRain.casos.length, episodios: new Set(gRain.casos.map((c) => c.episodio).filter(Boolean)).size, reservados: [...reservados] },
  bytes: Object.fromEntries(PILOTO.map((a) => [a, JSON.stringify(pacotes[a]).length])),
  ms: Date.now() - t0, memoriaPicoMB: Math.round(process.resourceUsage().maxRSS / 1024),
};
const saida = arg("--relatorio");
if (saida) writeFileSync(saida, JSON.stringify(relatorio, null, 1) + "\n");
console.log(JSON.stringify({ registros: relatorio.registros, observacoes: relatorio.observacoes, episodios: relatorio.episodios.total, vinculo: relatorio.vinculo, piloto: resumo, exemplos: relatorio.exemplos.slice(0, 6), ms: relatorio.ms }, null, 1));
