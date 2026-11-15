// VE03: rede de caminhada, frentes dos prédios do piloto, G-ROUTE, fila de revisão e publicação versionada.
//
//   node --max-old-space-size=8000 scripts/dados/rede/rodar-rede.mjs [--relatorio <arquivo.json>]
//
// Lê só arquivos locais: o extrato OSM datado arquivado no VE02 (.cache/osm/nordeste-261113.osm.pbf), a malha oficial
// e os recursos hídricos (.cache/dados-recife), o índice publicado do app e o feed GTFS fixado. Nada sai da máquina.
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync, inflateRawSync } from "node:zlib";
import { lerCsv, lerZip, analisarLogradouro, nomesCompativeis } from "../rua/nucleo.mjs";
import { criarIndiceDeRuas, vincularRua } from "../observacoes/vinculo.mjs";
import { ativar, ponteiroAtual, prepararVersao } from "../observacoes/publicar.mjs";
import { lerPbf } from "./pbf.mjs";
import { VERSAO_DAS_REGRAS, arestaMaisProxima, distanciaM, eTravessia, indexarArestas, montarGrafo, permissaoAPe, resumirRota, rotaEntre, versaoDaRede as calcularVersao } from "./grafo.mjs";
import { VERSAO_DAS_FRENTES, atravessaAgua, distanciaAoContorno, entradaDoPredio, indexarAgua, indexarRuasOficiais } from "./frentes.mjs";
import { AREAS } from "../areas.mjs";
import { gravarFolha } from "../folhas.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const PBF = join(RAIZ, ".cache/osm/nordeste-261113.osm.pbf");
const CAIXA = { s: -8.17, w: -35.04, n: -7.91, e: -34.84 }; // Recife com ~1,5 km de margem
const PILOTO = AREAS; // VE16: piloto + expansão (scripts/dados/areas.json)
const TAGS_DE_NO = ["highway", "crossing", "barrier", "entrance", "foot", "access", "railway", "door"];
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const t0 = Date.now();
const tempos = {};
const marca = (k, t) => { tempos[k] = Date.now() - t; };
const dentro = (lo, la) => la >= CAIXA.s && la <= CAIXA.n && lo >= CAIXA.w && lo <= CAIXA.e;
const agora = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString().replace(".000Z", "Z");

// ——— Correções revisadas (persistem entre execuções) ————————————————————————————————————
const CORRECOES = join(RAIZ, "scripts/dados/rede/correcoes.json");
const correcoes = existsSync(CORRECOES) ? JSON.parse(readFileSync(CORRECOES, "utf8")).correcoes : [];
const viasBloqueadas = new Set(correcoes.filter((c) => c.tipo === "via_bloqueada").map((c) => Number(c.via)));
const entradasCorrigidas = new Map(correcoes.filter((c) => c.tipo === "entrada").map((c) => [c.predio, c]));

// ——— 1. Extrato OSM ——————————————————————————————————————————————————————————————————
let t = Date.now();
const coords = new Map();
const tagsDosNos = new Map();
const entradasOsm = [];
const vias = [];
const prediosOsm = [];
const contagens = lerPbf(PBF, {
  querTagsDoNo: dentro,
  aoNo: (id, lo, la, tags) => {
    if (!dentro(lo, la)) return;
    coords.set(id, [lo, la]);
    if (tags && TAGS_DE_NO.some((k) => k in tags)) {
      const t2 = Object.fromEntries(TAGS_DE_NO.filter((k) => k in tags).map((k) => [k, tags[k]]));
      tagsDosNos.set(id, t2);
      if (tags.entrance) entradasOsm.push({ id, lon: lo, lat: la, tipo: tags.entrance });
    }
  },
  aoCaminho: (id, refs, tags) => {
    if (!refs.some((r) => coords.has(r))) return;
    if (tags.highway) {
      const t2 = { ...tags };
      if (viasBloqueadas.has(id)) t2.foot = "no";
      vias.push({ id, nos: refs, tags: t2 });
    } else if (tags.building && tags["addr:housenumber"] && tags["addr:street"]) {
      const pts = refs.map((r) => coords.get(r)).filter(Boolean);
      if (pts.length) prediosOsm.push({ id, rua: tags["addr:street"], numero: tags["addr:housenumber"], lon: pts.reduce((s, p) => s + p[0], 0) / pts.length, lat: pts.reduce((s, p) => s + p[1], 0) / pts.length });
    }
  },
});
marca("leituraDoPbf", t);
const shaPbf = sha256(readFileSync(PBF));

// ——— 2. Grafo ————————————————————————————————————————————————————————————————————————
t = Date.now();
const g = montarGrafo(vias, coords, tagsDosNos);
const gradeArestas = indexarArestas(g);
const nosTravessia = new Set([...tagsDosNos].filter(([, tg]) => eTravessia(tg)).map(([id]) => id));
marca("grafo", t);
const versaoDaRede = calcularVersao(sha256, { shaDoExtrato: shaPbf, regras: VERSAO_DAS_REGRAS, frentes: VERSAO_DAS_FRENTES, correcoes });

// ——— 3. Linhagem: via OSM → código oficial (nome + bairro) ——————————————————————————————————
t = Date.now();
const trechos = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/trechos-de-logradouros.geojson"), "utf8"));
const indiceRuas = criarIndiceDeRuas(trechos, JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/bairros-do-recife.geojson"), "utf8")));
const linhagem = new Map();
const metodoDaLinhagem = {};
const porVia = new Map(vias.map((v) => [v.id, v]));
for (const e of g.arestas) {
  if (linhagem.has(e.via)) continue;
  const v = porVia.get(e.via);
  if (!v.tags.name) { linhagem.set(e.via, null); continue; }
  const meio = [(g.lon[e.a] + g.lon[e.b]) / 2, (g.lat[e.a] + g.lat[e.b]) / 2];
  const bairro = indiceRuas.bairrosDoPonto(meio[0], meio[1])[0] ?? null;
  const r = vincularRua(indiceRuas, v.tags.name, bairro);
  metodoDaLinhagem[r.metodo] = (metodoDaLinhagem[r.metodo] ?? 0) + 1;
  linhagem.set(e.via, r.codigo);
}
marca("linhagem", t);

// ——— 4. Frentes e entradas dos prédios do piloto ——————————————————————————————————————————
t = Date.now();
const gradeRuas = indexarRuasOficiais(trechos);
const gradeAgua = indexarAgua(JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/recursos-hidricos.geojson"), "utf8")));
const catalogo = readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8");
const diretorio = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(catalogo)[1];
const frentes = [];
const contexto = { g, gradeArestas, linhagem, gradeRuas, gradeAgua };
for (const area of PILOTO) {
  const indice = JSON.parse(readFileSync(join(RAIZ, "src/dados/recife", diretorio, `${area}.json`), "utf8"));
  for (const e of indice.edificios) {
    const predio = { id: e.id, area, centro: e.centro, poligono: e.poligono, codigoDaRua: Number(e.id.split("-")[0]), unidades: e.unidades };
    const automatico = entradaDoPredio(predio, contexto, entradasCorrigidas.get(e.id) ?? null);
    // Entrada mapeada no OSM sobre o contorno deste prédio (até 3 m): observação independente. Fica registrada a
    // distância ao candidato automático; sem correção revisada, a entrada mapeada (main de preferência) passa a valer.
    const osm = e.poligono ? entradasOsm.filter((x) => (distanciaAoContorno([x.lon, x.lat], e.poligono) ?? 99) <= 3) : [];
    const melhorOsm = osm.sort((p, q) => (q.tipo === "main") - (p.tipo === "main") || p.id - q.id)[0] ?? null;
    const entradaOsm = melhorOsm && automatico.entrada
      ? { id: melhorOsm.id, tipo: melhorOsm.tipo, metrosAoCandidato: Math.round(distanciaM(melhorOsm.lon, melhorOsm.lat, automatico.entrada[0], automatico.entrada[1]) * 10) / 10 }
      : null;
    let r = automatico;
    if (melhorOsm && !entradasCorrigidas.has(e.id)) {
      const comOsm = entradaDoPredio(predio, contexto, { ponto: [melhorOsm.lon, melhorOsm.lat] });
      if (comOsm.ligacao) r = { ...comOsm, classe: "forte", origem: "entrada_mapeada_osm" };
    }
    frentes.push({ id: e.id, area, unidades: e.unidades, ...r, entradaOsmNoContorno: entradaOsm, candidatoAutomatico: r === automatico ? null : automatico.entrada });
  }
}
marca("frentes", t);

// ——— 5. Concordância independente: endereço dos prédios do OSM × cadastro (proxy de identidade) ————————————————
t = Date.now();
const porNumero = new Map();
for (const p of prediosOsm) {
  const k = String(p.numero).trim();
  if (!porNumero.has(k)) porNumero.set(k, []);
  porNumero.get(k).push(p);
}
const concordancia = Object.fromEntries(PILOTO.map((a) => [a, { comCasaNoOsm: 0, concorda: 0, discorda: 0, distancias: [] }]));
for (const area of PILOTO) {
  const indice = JSON.parse(readFileSync(join(RAIZ, "src/dados/recife", diretorio, `${area}.json`), "utf8"));
  for (const e of indice.edificios) {
    const nomeCad = analisarLogradouro(e.logradouro).completa;
    const cands = (porNumero.get(String(e.numero)) ?? []).filter((p) => {
      const n = analisarLogradouro(p.rua).completa;
      return n === nomeCad || nomesCompativeis(n, nomeCad);
    });
    if (!cands.length) continue;
    const d = Math.min(...cands.map((p) => distanciaM(p.lon, p.lat, e.centro[0], e.centro[1])));
    const c = concordancia[area];
    c.comCasaNoOsm += 1;
    c.distancias.push(Math.round(d));
    if (d <= 40) c.concorda += 1; else c.discorda += 1;
  }
}
for (const c of Object.values(concordancia)) {
  const s = [...c.distancias].sort((a, b) => a - b);
  c.medianaM = s.length ? s[Math.floor(s.length / 2)] : null;
  delete c.distancias;
}
marca("concordanciaOsm", t);

// ——— 6. G-ROUTE ————————————————————————————————————————————————————————————————————————
t = Date.now();
function tabela(texto) {
  const [cab, ...linhas] = lerCsv(texto.replace(/^﻿/, ""), ",");
  return linhas.filter((l) => l.length > 1).map((l) => Object.fromEntries(cab.map((c, i) => [c.trim(), (l[i] ?? "").trim()])));
}
const feed = lerZip(readFileSync(join(RAIZ, "docs/dados/raw/transporte/gtfs.zip")), inflateRawSync);
const paradas = tabela(feed.get("stops.txt")().toString("utf8")).map((s) => ({ id: `parada:${s.stop_id}`, nome: s.stop_name, lon: Number(s.stop_lon), lat: Number(s.stop_lat) })).filter((s) => dentro(s.lon, s.lat));
const pracasGeo = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/parques-e-pracas.geojson"), "utf8"));
const pracas = pracasGeo.features.filter((f) => f.geometry).map((f, i) => {
  const pts = [];
  const andar = (c) => (typeof c[0] === "number" ? pts.push(c) : c.forEach(andar));
  andar(f.geometry.coordinates);
  const nome = f.properties?.nome ?? f.properties?.NOME ?? f.properties?.name ?? Object.values(f.properties ?? {}).find((v) => typeof v === "string" && /pra[cç]a|parque/i.test(v)) ?? `área verde ${i}`;
  return { id: `praca:${f.properties?.OBJECTID ?? i}`, nome, lon: pts.reduce((s, p) => s + p[0], 0) / pts.length, lat: pts.reduce((s, p) => s + p[1], 0) / pts.length };
}).filter((p) => dentro(p.lon, p.lat));
const SET_ROTAS = join(RAIZ, "docs/aplicacao/evaluation-sets/g-route.json");
const gb = JSON.parse(readFileSync(join(RAIZ, "docs/aplicacao/evaluation-sets/g-building.json"), "utf8"));
let gRoute;
if (existsSync(SET_ROTAS)) gRoute = JSON.parse(readFileSync(SET_ROTAS, "utf8"));
else {
  const tipos = ["parada", "praca", "travessia_de_agua", "parada", "praca", "travessia_de_agua"];
  const rotas = [];
  for (const area of PILOTO) {
    const orig = gb.buildings.filter((b) => b.area === area).slice(0, 6);
    orig.forEach((b, i) => {
      const [lo, la] = b.centro;
      const ordem = (lista) => lista.map((d) => ({ d, m: distanciaM(lo, la, d.lon, d.lat) })).sort((x, y) => x.m - y.m || x.d.id.localeCompare(y.d.id));
      let dest;
      if (tipos[i] === "parada") dest = ordem(paradas)[0].d;
      else if (tipos[i] === "praca") dest = ordem(pracas)[0].d;
      else dest = ordem([...paradas, ...pracas]).find(({ d, m }) => m >= 300 && m <= 3000 && atravessaAgua(gradeAgua, [lo, la], [d.lon, d.lat]))?.d ?? null;
      rotas.push({ id: `GR${String(rotas.length + 1).padStart(2, "0")}`, area, tipo: tipos[i], origem: { predio: b.id, estrato: b.stratum, split: b.split, centro: b.centro }, destino: dest, rotulo: "nao_revisado" });
    });
  }
  gRoute = { set: "G-ROUTE", version: 1, created: agora.slice(0, 10), created_by: "VE03 rodar-rede.mjs", origem: "6 prédios de G-BUILDING por bairro; destinos: parada GTFS v2026.10.26 mais próxima, praça/parque oficial mais próximo, e o destino mais próximo (300 m–3 km) do outro lado de um corpo d'água oficial", label_status: "routes unreviewed by a person; automated checks only", rotas };
  writeFileSync(SET_ROTAS, JSON.stringify(gRoute, null, 1) + "\n");
}
const frentePorId = new Map(frentes.map((f) => [f.id, f]));
const principalOk = (e) => g.comp[e.a] === g.componentePrincipal && !(e.f & 32);
function checarRota(r) {
  const problemas = [];
  const suspeitas = [];
  for (const k of r.arestas) {
    const e = g.arestas[k];
    const v = porVia.get(e.via);
    if (permissaoAPe(v.tags) === "nao") problemas.push(`via ${e.via} sem permissão a pé`);
    if (e.f & 32) problemas.push(`via ${e.via} restrita`);
    if (!(e.f & 6)) {
      const agua = atravessaAgua(gradeAgua, [g.lon[e.a], g.lat[e.a]], [g.lon[e.b], g.lat[e.b]]);
      if (agua) suspeitas.push(`via ${e.via} sobre ${agua} sem marca de ponte`);
    }
  }
  return { impossivel: problemas, suspeitas: [...new Set(suspeitas)] };
}
const resultadosRotas = gRoute.rotas.map((rt) => {
  const f = frentePorId.get(rt.origem.predio);
  if (!rt.destino) return { ...rt, estado: "sem_destino" };
  if (!f?.ligacao) return { ...rt, estado: "origem_sem_ligacao", classeDaOrigem: f?.classe ?? null };
  const dst = arestaMaisProxima(g, gradeArestas, rt.destino.lon, rt.destino.lat, 60, principalOk);
  if (!dst) return { ...rt, estado: "destino_sem_ligacao" };
  // A reta parte da mesma entrada da rota (não do centroide), senão a rede pode parecer mais curta que a reta.
  const reta = distanciaM(f.entrada[0], f.entrada[1], rt.destino.lon, rt.destino.lat);
  const cenarios = {};
  for (const [nome, op] of Object.entries({ padrao: {}, sem_escadas: { evitarEscadas: true }, menos_vias_principais: { penalidadePrincipal: 1.5 } })) {
    const r = rotaEntre(g, f.ligacao.pontas, dst.pontas, op);
    const resumo = resumirRota(g, r, { nosTravessia });
    cenarios[nome] = r ? { ...resumo, metros: Math.round(r.metros + f.ligacao.metros + dst.metros), verificacao: checarRota(r) } : null;
  }
  const p = cenarios.padrao;
  return { ...rt, estado: p ? "rota" : "sem_rota", classeDaOrigem: f.classe, retaM: Math.round(reta), desvio: p ? Math.round((p.metros / Math.max(reta, 1)) * 100) / 100 : null, cenarios };
});
marca("gRoute", t);

// ——— 7. Rota de cada prédio do piloto à parada mais próxima (cobertura e checagem ampla) ————————————————
t = Date.now();
const viasSuspeitas = new Map();
const amplo = Object.fromEntries(PILOTO.map((a) => [a, { predios: 0, comLigacao: 0, comRota: 0, impossiveis: 0, suspeitas: 0, desvios: [] }]));
for (const f of frentes) {
  const c = amplo[f.area];
  c.predios += 1;
  if (!f.ligacao) continue;
  c.comLigacao += 1;
  const pt = f.entrada ?? null;
  if (!pt) continue;
  const parada = paradas.map((d) => ({ d, m: distanciaM(pt[0], pt[1], d.lon, d.lat) })).sort((x, y) => x.m - y.m)[0];
  const dst = arestaMaisProxima(g, gradeArestas, parada.d.lon, parada.d.lat, 60, principalOk);
  if (!dst) continue;
  const r = rotaEntre(g, f.ligacao.pontas, dst.pontas);
  if (!r) continue;
  c.comRota += 1;
  const v = checarRota(r);
  if (v.impossivel.length) c.impossiveis += 1;
  if (v.suspeitas.length) c.suspeitas += 1;
  for (const k of r.arestas) {
    const e = g.arestas[k];
    if (e.f & 6) continue;
    const agua = atravessaAgua(gradeAgua, [g.lon[e.a], g.lat[e.a]], [g.lon[e.b], g.lat[e.b]]);
    if (!agua) continue;
    const item = viasSuspeitas.get(e.via) ?? { via: e.via, agua, nome: porVia.get(e.via).tags.name ?? null, highway: porVia.get(e.via).tags.highway, rotas: new Set() };
    item.rotas.add(f.id);
    viasSuspeitas.set(e.via, item);
  }
  c.desvios.push((r.metros + f.ligacao.metros + dst.metros) / Math.max(parada.m, 1));
}
for (const c of Object.values(amplo)) {
  const s = c.desvios.sort((a, b) => a - b);
  c.desvioMediano = s.length ? Math.round(s[Math.floor(s.length / 2)] * 100) / 100 : null;
  c.desvioP90 = s.length ? Math.round(s[Math.floor(s.length * 0.9)] * 100) / 100 : null;
  delete c.desvios;
}
marca("rotasAmplas", t);

// ——— 8. Fila de revisão ————————————————————————————————————————————————————————————————
const peso = { fraca: 3, media: 1 };
// Prédio: unidades (lares que dependem da ligação) × peso da classe. Via sobre água sem ponte: prédios cujas rotas à
// parada mais próxima passam por ela × unidades médias (mesma escala aproximada). As duas listas ficam numa só fila.
const unidadesPorId = new Map(frentes.map((f) => [f.id, f.unidades]));
const fila = [
  ...frentes.filter((f) => peso[f.classe]).map((f) => ({ tipo: "ligacao_do_predio", id: f.id, area: f.area, classe: f.classe, motivos: f.motivos, unidades: f.unidades,
    impacto: f.unidades * peso[f.classe] + (f.adicionais.length ? 1 : 0) })),
  ...[...viasSuspeitas.values()].map((v) => ({ tipo: "via_sobre_agua_sem_ponte", id: `via:${v.via}`, nome: v.nome, highway: v.highway, agua: v.agua,
    prediosAfetados: v.rotas.size, impacto: [...v.rotas].reduce((s, id) => s + (unidadesPorId.get(id) ?? 0), 0) })),
].sort((a, b) => b.impacto - a.impacto || a.id.localeCompare(b.id));

// ——— 9. Publicação ——————————————————————————————————————————————————————————————————————
t = Date.now();
const porArea = Object.fromEntries(PILOTO.map((a) => {
  const fs = frentes.filter((f) => f.area === a);
  const cont = (k) => fs.filter((f) => f.classe === k).length;
  return [a, { predios: fs.length, forte: cont("forte"), media: cont("media"), fraca: cont("fraca"), revisada: cont("revisada"),
    comFrentesAdicionais: fs.filter((f) => f.adicionais.length).length, frentesRecusadasPorAgua: fs.filter((f) => f.recusadas.length).length,
    comEntradaOsmNoContorno: fs.filter((f) => f.entradaOsmNoContorno).length,
    usandoEntradaOsm: fs.filter((f) => f.origem === "entrada_mapeada_osm").length,
    entradaOsmAte10mDoCandidato: fs.filter((f) => f.entradaOsmNoContorno && f.entradaOsmNoContorno.metrosAoCandidato <= 10).length }];
}));
const gz = (o) => gzipSync(Buffer.from(JSON.stringify(o)), { level: 9 });
const particoes = [
  { arquivo: "grafo.json.gz", conteudo: gz({ versaoDaRede, idsOsm: g.idsOsm, lon: [...g.lon].map((x) => Math.round(x * 1e7) / 1e7), lat: [...g.lat].map((x) => Math.round(x * 1e7) / 1e7), arestas: g.arestas.map((e) => [e.a, e.b, Math.round(e.m * 10) / 10, e.via, e.f]), comp: [...g.comp] }), registros: g.arestas.length },
  { arquivo: "linhagem.json.gz", conteudo: gz([...linhagem].filter(([, c]) => c !== null)), registros: [...linhagem.values()].filter((c) => c !== null).length },
  { arquivo: "frentes.json.gz", conteudo: gz(frentes), registros: frentes.length },
  { arquivo: "fila-de-revisao.json", conteudo: Buffer.from(JSON.stringify(fila, null, 1) + "\n"), registros: fila.length },
  { arquivo: "g-route-resultados.json", conteudo: Buffer.from(JSON.stringify(resultadosRotas, null, 1) + "\n"), registros: resultadosRotas.length },
];
const RAIZ_PUB = join(RAIZ, ".cache/publicacoes");
const manifesto = prepararVersao(RAIZ_PUB, "rede-pedestre", {
  particoes,
  fontes: [{ fonte: "osm_nordeste_261113", sha256: shaPbf, estado: "valida", analisador: `pbf.mjs+grafo@${VERSAO_DAS_REGRAS}`, recuperadoEm: "2026-11-14T00:00:00Z" }],
  derivacoes: [{ nome: "regras_a_pe", versao: VERSAO_DAS_REGRAS }, { nome: "frentes", versao: VERSAO_DAS_FRENTES }, { nome: "versao_da_rede", versao: versaoDaRede }],
  cobertura: { denominador: "prédios do piloto por bairro e classe de ligação", total: frentes.length,
    porChave: Object.fromEntries(PILOTO.flatMap((a) => ["forte", "media", "fraca"].map((k) => [`${a}:${k}`, porArea[a][k]]))) },
  validacao: { quarentena: 0, motivos: {}, verificacoes: [
    { nome: "rotas_impossiveis_g_route", ok: resultadosRotas.every((r) => !r.cenarios || Object.values(r.cenarios).every((c) => !c || !c.verificacao.impossivel.length)), detalhe: "via sem permissão a pé ou restrita em alguma rota do G-ROUTE" },
    { nome: "rotas_impossiveis_amplas", ok: Object.values(amplo).every((c) => c.impossiveis === 0), detalhe: "rotas de cada prédio à parada mais próxima" },
  ] },
  criadoEm: agora,
});
const ativo = ponteiroAtual(RAIZ_PUB, "rede-pedestre");
const ponteiro = ativo?.versao === manifesto.versao ? ativo : ativar(RAIZ_PUB, "rede-pedestre", manifesto.versao, { agora });
marca("publicacao", t);

const relatorio = {
  executadoEm: agora, versaoDaRede, publicacao: { versao: manifesto.versao, ativa: ponteiro.versao, anterior: ponteiro.anterior ?? null, bytes: manifesto.particoes.reduce((s, p) => s + p.bytes, 0) },
  extrato: { arquivo: ".cache/osm/nordeste-261113.osm.pbf", sha256: shaPbf, ...contagens, nosNaCaixa: coords.size, viasDeCirculacao: vias.length, entradasOsm: entradasOsm.length, prediosOsmComEndereco: prediosOsm.length },
  grafo: { nos: g.idsOsm.length, arestas: g.arestas.length, viasMantidas: g.viasMantidas, descartes: g.descartes, componentes: g.tamanhos.length,
    componentePrincipal: g.tamanhos[g.componentePrincipal], fracaoNoPrincipal: Math.round((g.tamanhos[g.componentePrincipal] / g.idsOsm.length) * 1000) / 1000,
    escadasM: Math.round(g.arestas.reduce((s, e) => s + (e.f & 1 ? e.m : 0), 0)), ponteM: Math.round(g.arestas.reduce((s, e) => s + (e.f & 2 ? e.m : 0), 0)),
    travessiasMarcadas: nosTravessia.size, barreiras: [...tagsDosNos.values()].filter((x) => x.barrier).length },
  linhagem: { viasComNome: Object.values(metodoDaLinhagem).reduce((s, n) => s + n, 0), porMetodo: metodoDaLinhagem },
  frentes: porArea,
  concordanciaComEnderecoOsm: concordancia,
  gRoute: { total: resultadosRotas.length, porEstado: resultadosRotas.reduce((m, r) => ({ ...m, [r.estado]: (m[r.estado] ?? 0) + 1 }), {}),
    impossiveis: resultadosRotas.filter((r) => r.cenarios && Object.values(r.cenarios).some((c) => c?.verificacao.impossivel.length)).map((r) => r.id),
    suspeitas: resultadosRotas.filter((r) => r.cenarios?.padrao?.verificacao.suspeitas.length).map((r) => ({ id: r.id, suspeitas: r.cenarios.padrao.verificacao.suspeitas })) },
  rotasAmplas: amplo,
  filaDeRevisao: { total: fila.length, ligacoes: fila.filter((x) => x.tipo === "ligacao_do_predio").length, viasSobreAgua: fila.filter((x) => x.tipo === "via_sobre_agua_sem_ponte").length, top10: fila.slice(0, 10) },
  correcoesAplicadas: correcoes.length,
  tempos: { ...tempos, total: Date.now() - t0 },
};
// ——— 10. Material de revisão para uma pessoa (G-BUILDING e G-ROUTE) ——————————————————————————————
const osmLink = (lon, lat) => `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=19/${lat.toFixed(6)}/${lon.toFixed(6)}`;
const linhasRevisao = [["predio", "bairro", "estrato", "split", "classe", "origem", "rua_principal_codigo", "frentes_adicionais", "entrada_lon", "entrada_lat", "mapa_da_entrada",
  "REVISAO_identidade_correta(sim/nao)", "REVISAO_entrada_correta(sim/nao/nao_sei)", "REVISAO_entrada_lon", "REVISAO_entrada_lat", "REVISAO_revisor", "REVISAO_data", "REVISAO_nota"]];
for (const b of gb.buildings) {
  const f = frentePorId.get(b.id);
  const [lo, la] = f?.entrada ?? b.centro;
  linhasRevisao.push([b.id, b.area, b.stratum, b.split, f?.classe ?? "", f?.origem ?? "", f?.principal?.codigo ?? "", (f?.adicionais ?? []).map((a) => a.codigo).join(" "),
    lo.toFixed(6), la.toFixed(6), osmLink(lo, la), "", "", "", "", "", "", ""]);
}
gravarFolha(join(RAIZ, "docs/aplicacao/evaluation-sets/g-building-revisao.csv"), linhasRevisao.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n") + "\n");
const geo = { type: "FeatureCollection", features: resultadosRotas.filter((x) => x.cenarios?.padrao).map((x) => {
  const f = frentePorId.get(x.origem.predio);
  const dst = arestaMaisProxima(g, gradeArestas, x.destino.lon, x.destino.lat, 60, principalOk);
  const rr = rotaEntre(g, f.ligacao.pontas, dst.pontas);
  const coords = rr.nos.map((i) => [Math.round(g.lon[i] * 1e6) / 1e6, Math.round(g.lat[i] * 1e6) / 1e6]);
  return { type: "Feature", properties: { id: x.id, area: x.area, tipo: x.tipo, metros: x.cenarios.padrao.metros, destino: x.destino.nome, REVISAO: "a revisar" }, geometry: { type: "LineString", coordinates: [f.entrada, ...coords, [x.destino.lon, x.destino.lat]] } };
}) };
writeFileSync(join(RAIZ, "docs/aplicacao/evaluation-sets/g-route-caminhos.geojson"), JSON.stringify(geo) + "\n");

const rel = arg("--relatorio");
if (rel) writeFileSync(rel, JSON.stringify(relatorio, null, 1) + "\n");
console.log(JSON.stringify({ versaoDaRede, publicacao: manifesto.versao, grafo: relatorio.grafo.nos, frentes: porArea, gRoute: relatorio.gRoute.porEstado, ms: relatorio.tempos.total }));
