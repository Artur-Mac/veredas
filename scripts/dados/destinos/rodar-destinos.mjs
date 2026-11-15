// VE04: catálogo de destinos, alcance a pé com plano B independente e cadeia de recados para os prédios do piloto,
// G-POI, publicação versionada e pacote do app (src/dados/recife/essenciais/<versão>/<bairro>.json).
//
//   node --max-old-space-size=8000 scripts/dados/destinos/rodar-destinos.mjs [--ao-vivo] [--relatorio <arquivo.json>]
//
// Sem --ao-vivo, as bases municipais vêm do último bruto arquivado (.cache/observacoes/brutos); com --ao-vivo, até
// 3 requisições ao CKAN da Prefeitura (lista branca de campos). O resto é local: extrato OSM do VE02, grafo e entradas
// publicados pelo VE03, praças oficiais e o GTFS fixado.
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import publicacaoDeCamadas from "../publicar-camadas.cjs";
import { gunzipSync, gzipSync, inflateRawSync } from "node:zlib";
import { lerZip } from "../rua/nucleo.mjs";
import { coletarDatastore } from "../observacoes/coleta.mjs";
import { criarIndiceDeRuas } from "../observacoes/vinculo.mjs";
import { ativar, ponteiroAtual, prepararVersao } from "../observacoes/publicar.mjs";
import { classificarColeta } from "../../../src/dados/observacao.ts";
import { lerPbf } from "../rede/pbf.mjs";
import { arestaMaisProxima, distanciaM, grafoPublicado, indexarArestas } from "../rede/grafo.mjs";
import { VERSAO_DO_CATALOGO, CATEGORIAS, amostrarContorno, categoriaDesativada, categoriaOsm, entradaPublica, fechadoNoOsm, fundirCandidatos } from "./catalogo.mjs";
import { VERSAO_DO_ALCANCE, CRITICO, cadeiaDeRecados, criarExplorador, essencialDaCategoria, indexarDestinos, alcancados } from "./alcance.mjs";
import { AREAS } from "../areas.mjs";
import { gravarFolha } from "../folhas.mjs";
import { gravarImutavel } from "../imutavel.mjs";

const RAIZ = process.cwd();
const AO_VIVO = process.argv.includes("--ao-vivo");
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const CAIXA = { s: -8.17, w: -35.04, n: -7.91, e: -34.84 };
const dentro = (lo, la) => la >= CAIXA.s && la <= CAIXA.n && lo >= CAIXA.w && lo <= CAIXA.e;
const PILOTO = AREAS; // VE16: piloto + expansão (scripts/dados/areas.json)
const LIMITE_M = 2000;
const VELOCIDADE = 1.2; // m/s, cenário padrão do VE03
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const agora = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString().replace(".000Z", "Z");
const t0 = Date.now();
const tempos = {};
const marca = (k, t) => { tempos[k] = Date.now() - t; };

// ——— 1. Grafo e entradas publicados pelo VE03 ——————————————————————————————————————————————————
let t = Date.now();
const PUB = join(RAIZ, ".cache/publicacoes");
const rede = ponteiroAtual(PUB, "rede-pedestre");
if (!rede) throw new Error("Rede do VE03 não publicada.");
const pastaRede = join(PUB, "rede-pedestre", "versoes", rede.versao);
const g = grafoPublicado(JSON.parse(gunzipSync(readFileSync(join(pastaRede, "grafo.json.gz")))));
const frentes = JSON.parse(gunzipSync(readFileSync(join(pastaRede, "frentes.json.gz"))));
const gradeArestas = indexarArestas(g);
marca("grafo", t);

// ——— 2. Candidatos do OSM ———————————————————————————————————————————————————————————————————
t = Date.now();
const coords = new Map();
const candidatos = [];
const fechados = [];
const entradasPublicas = [];
const nomeDaVia = new Map();
const viasDoGrafo = new Set(g.arestas.filter((e) => e.f & CRITICO).map((e) => e.via));
lerPbf(join(RAIZ, ".cache/osm/nordeste-261113.osm.pbf"), {
  querTagsDoNo: dentro,
  aoNo: (id, lo, la, tags) => {
    if (!dentro(lo, la)) return;
    coords.set(id, [lo, la]);
    if (!tags) return;
    if (entradaPublica(tags)) entradasPublicas.push([lo, la]);
    if (fechadoNoOsm(tags) && categoriaDesativada(tags)) { fechados.push({ id: `osm:n${id}`, categoria: categoriaDesativada(tags), nome: tags.name ?? null, ponto: [lo, la] }); return; }
    const cat = categoriaOsm(tags);
    if (cat) candidatos.push({ id: `osm:n${id}`, categoria: cat, nome: tags.name ?? null, ponto: [lo, la], destinos: [[lo, la]], entradaMapeada: false, horario: tags.opening_hours ? { texto: tags.opening_hours, fonte: "osm" } : null, fontes: ["osm"] });
  },
  aoCaminho: (id, refs, tags) => {
    if (viasDoGrafo.has(id) && tags.name) nomeDaVia.set(id, tags.name);
    const cat = categoriaOsm(tags);
    const fechado = fechadoNoOsm(tags) && categoriaDesativada(tags);
    if (!cat && !fechado) return;
    const pts = refs.map((r) => coords.get(r)).filter(Boolean);
    if (pts.length < 2) return;
    const centro = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
    if (fechado) { fechados.push({ id: `osm:w${id}`, categoria: categoriaDesativada(tags), nome: tags.name ?? null, ponto: centro }); return; }
    candidatos.push({ id: `osm:w${id}`, categoria: cat, nome: tags.name ?? null, ponto: centro, destinos: amostrarContorno(pts), entradaMapeada: false, horario: tags.opening_hours ? { texto: tags.opening_hours, fonte: "osm" } : null, fontes: ["osm"], contorno: pts });
  },
});
// Entrada pública mapeada sobre o contorno de um local-área substitui os pontos do contorno.
for (const c of candidatos.filter((x) => x.contorno)) {
  const xs = c.contorno.map((p) => p[0]), ys = c.contorno.map((p) => p[1]);
  const [w, e, s, n] = [Math.min(...xs) - 3e-5, Math.max(...xs) + 3e-5, Math.min(...ys) - 3e-5, Math.max(...ys) + 3e-5];
  const ent = entradasPublicas.filter(([x, y]) => x >= w && x <= e && y >= s && y <= n);
  if (ent.length) { c.destinos = ent; c.entradaMapeada = true; }
  delete c.contorno;
}
marca("osm", t);

// ——— 3. Bases da Prefeitura (feiras, mercados públicos, Farmácias da Família) ——————————————————————————————
t = Date.now();
const BRUTOS = join(RAIZ, ".cache/observacoes/brutos");
const MUNICIPAIS = [
  { fonte: "pcr_feiras_livres", recurso: "2aca1941-ca17-47b5-b151-58ac5119bb8e", campos: ["Nome", "Localização", "Dias", "Horário", "Latitude", "Longitude"], categoria: "mercado",
    ler: (r) => ({ nome: r.Nome, lat: r.Latitude, lon: r.Longitude, horario: [r.Dias, r["Horário"]].filter(Boolean).join(", ") || null, periodico: true }) },
  { fonte: "pcr_mercados_publicos", recurso: "53085c8b-f007-4979-b60e-dfd3f882b0bd", campos: ["nome", "bairro", "latitude", "longitude"], categoria: "mercado",
    ler: (r) => ({ nome: r.nome, lat: r.latitude, lon: r.longitude, horario: null }) },
  { fonte: "pcr_farmacias_da_familia", recurso: "8c67114d-3319-4b63-8fa6-b6540a1c14cf", campos: ["nome_oficial", "tipo_servico", "horario", "latitude", "longitude"], categoria: "farmacia",
    ler: (r) => ({ nome: r.nome_oficial, lat: r.latitude, lon: r.longitude, horario: r.horario || null }) },
];
const snapshotsMunicipais = [];
mkdirSync(BRUTOS, { recursive: true });
for (const m of MUNICIPAIS) {
  let registros = null, estado, motivo, hash = null, recuperadoEm = null;
  const arquivado = join(BRUTOS, `${m.fonte}.ultimo.json`);
  if (AO_VIVO) {
    const r = await coletarDatastore({ base: "https://dados.recife.pe.gov.br", recurso: m.recurso, campos: m.campos, limite: 500, orcamento: 3 });
    ({ estado, motivo } = classificarColeta({ erro: r.erro, declarados: r.declarados, lidos: r.registros.length, aceitos: r.registros.length, paginasFaltando: r.paginasFaltando }));
    if (estado === "valida" || estado === "vazia") {
      registros = r.registros;
      hash = r.sha256;
      recuperadoEm = agora;
      writeFileSync(`${arquivado}.tmp`, JSON.stringify({ recuperadoEm: agora, sha256: hash, registros }));
      renameSync(`${arquivado}.tmp`, arquivado);
    }
  }
  if (!registros && existsSync(arquivado)) {
    const a = JSON.parse(readFileSync(arquivado, "utf8"));
    registros = a.registros; hash = a.sha256;
    // VE16: a data é a do bruto arquivado, não a desta execução (idade dos dados honesta). Coleta ao vivo que falhou e
    // caiu no arquivo fica dita no motivo.
    recuperadoEm = a.recuperadoEm ?? null;
    if (estado && estado !== "valida" && estado !== "vazia") motivo = `usado o bruto arquivado de ${recuperadoEm ?? "data desconhecida"}; coleta ao vivo: ${motivo ?? estado}`;
    estado = estado ?? "valida"; motivo = motivo ?? null;
  }
  snapshotsMunicipais.push({ fonte: m.fonte, estado: registros ? estado : "falhou", motivo: registros ? motivo : motivo ?? "rede", registros: registros?.length ?? 0, sha256: hash, recuperadoEm });
  for (const [i, r] of (registros ?? []).entries()) {
    const v = m.ler(r);
    const lon = Number(v.lon), lat = Number(v.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || !dentro(lon, lat)) continue;
    candidatos.push({ id: `${m.fonte}:${r._id ?? i}`, categoria: m.categoria, nome: v.nome, ponto: [lon, lat], destinos: [[lon, lat]], entradaMapeada: false,
      horario: v.horario ? { texto: v.horario, fonte: "prefeitura" } : null, fontes: ["prefeitura"], periodico: v.periodico ?? false });
  }
}
// Praças e parques oficiais (ESIG): áreas → pontos do contorno.
const pracas = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/parques-e-pracas.geojson"), "utf8"));
for (const f of pracas.features) {
  const tipo = f.properties.CDTIPO;
  if (!f.geometry || !["PRAÇA", "PRACA", "PARQUE"].includes(tipo)) continue;
  const pts = [];
  const andar = (c) => (typeof c[0] === "number" ? pts.push(c) : c.forEach(andar));
  andar(f.geometry.coordinates);
  const centro = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  candidatos.push({ id: `pcr_pracas:${f.properties.OBJECTID ?? candidatos.length}`, categoria: "praca", nome: f.properties.NMNOMEOFIC ?? f.properties.NMNOME ?? null, ponto: centro,
    destinos: amostrarContorno(pts), entradaMapeada: false, horario: null, fontes: ["prefeitura"] });
}
// Paradas do GTFS fixado com ao menos uma viagem programada.
const feed = lerZip(readFileSync(join(RAIZ, "docs/dados/raw/transporte/gtfs.zip")), inflateRawSync);
const stopTimes = feed.get("stop_times.txt")().toString("utf8");
const cab = stopTimes.slice(0, stopTimes.indexOf("\n")).replace(/^﻿/, "").trim().split(",");
const colStop = cab.indexOf("stop_id");
const comServico = new Set();
for (let i = stopTimes.indexOf("\n") + 1; i < stopTimes.length;) {
  const j = stopTimes.indexOf("\n", i);
  const linha = stopTimes.slice(i, j < 0 ? undefined : j);
  if (linha) comServico.add(linha.split(",")[colStop]);
  i = j < 0 ? stopTimes.length : j + 1;
}
const stops = feed.get("stops.txt")().toString("utf8").replace(/^﻿/, "").trim().split(/\r?\n/);
const cs = stops[0].split(",");
let paradasSemServico = 0;
for (const l of stops.slice(1)) {
  const c = l.split(",");
  const s = Object.fromEntries(cs.map((k, i) => [k.trim(), (c[i] ?? "").trim()]));
  const lon = Number(s.stop_lon), lat = Number(s.stop_lat);
  if (!dentro(lon, lat)) continue;
  if (!comServico.has(s.stop_id)) { paradasSemServico += 1; continue; }
  candidatos.push({ id: `gtfs:${s.stop_id}`, categoria: "transporte", nome: s.stop_name || null, ponto: [lon, lat], destinos: [[lon, lat]], entradaMapeada: false, horario: null, fontes: ["gtfs"] });
}
marca("fontes", t);

// ——— 4. Fusão em locais canônicos e ligação à rede ——————————————————————————————————————————
t = Date.now();
const { locais, duplicatas } = fundirCandidatos(candidatos);
const principalOk = (e) => g.comp[e.a] === g.componentePrincipal && !(e.f & 32);
for (const l of locais) {
  const porNo = new Map();
  for (const [lo, la] of l.destinos) {
    const a = arestaMaisProxima(g, gradeArestas, lo, la, 60, principalOk);
    if (!a) continue;
    for (const p of a.pontas) {
      const m = p.m + a.metros;
      if (!porNo.has(p.no) || m < porNo.get(p.no)) porNo.set(p.no, m);
    }
  }
  l.pontas = [...porNo].map(([no, m]) => ({ no, m }));
}
const indiceRuas = criarIndiceDeRuas(JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/trechos-de-logradouros.geojson"), "utf8")), JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/bairros-do-recife.geojson"), "utf8")));
for (const l of locais) l.bairro = indiceRuas.bairrosDoPonto(l.ponto[0], l.ponto[1])[0] ?? null;
const ligados = locais.filter((l) => l.pontas.length);
const mapas = indexarDestinos(ligados);
marca("fusao", t);

// ——— 5. Alcance por prédio ————————————————————————————————————————————————————————————————
t = Date.now();
const ex = criarExplorador(g);
const porPredio = new Map();
const minutos = (m) => Math.round(m / VELOCIDADE / 6) / 10;
const pontesDe = (ks) => [...new Set(ks.map((k) => nomeDaVia.get(g.arestas[k].via) ?? "ponte sem nome no mapa"))];
let cadeiasComparadas = 0, cadeiasMaioresQueSeparadas = 0;
for (const f of frentes) {
  const rede = f.ligacao && (f.classe === "forte" || f.classe === "revisada");
  const ponto = f.entrada ?? null;
  if (!rede) {
    // Sem ligação forte: só o local mais próximo em linha reta, sem afirmar caminhada.
    const cats = {};
    for (const c of CATEGORIAS) {
      const melhor = ponto ? ligados.filter((l) => l.categoria === c).map((l) => ({ l, m: distanciaM(ponto[0], ponto[1], l.ponto[0], l.ponto[1]) })).sort((a, b) => a.m - b.m)[0] : null;
      cats[c] = melhor ? { local: ligados.indexOf(melhor.l), retaM: Math.round(melhor.m) } : null;
    }
    porPredio.set(f.id, { area: f.area, modo: "linha_reta", classe: f.classe, categorias: cats, cadeia: null });
    continue;
  }
  const origens = f.ligacao.pontas.map((p) => ({ no: p.no, m: p.m + f.ligacao.metros }));
  const cats = {};
  const distCasa = {};
  for (const c of CATEGORIAS) {
    const r = essencialDaCategoria(g, ex, origens, mapas.get(c) ?? new Map(), { limiteM: LIMITE_M });
    cats[c] = r ? {
      local: r.primeiro.local, metros: Math.round(r.primeiro.metros), minutos: minutos(r.primeiro.metros),
      pontes: r.criticos.length ? pontesDe(r.criticos) : [],
      segundo: r.segundo ? { local: r.segundo.local, metros: Math.round(r.segundo.metros), compartilhaPonte: r.segundo.compartilhaCritico } : null,
      planoB: r.planoB ? { local: r.planoB.local, metros: Math.round(r.planoB.metros), minutos: minutos(r.planoB.metros), motivo: r.planoB.motivo } : null,
    } : null;
    if (c === "mercado" || c === "farmacia") {
      ex.explorar(origens, { limiteM: LIMITE_M });
      distCasa[c] = new Map(alcancados(ex, mapas.get(c) ?? new Map()).slice(0, 3).map((x) => [x.local, x.metros]));
    }
  }
  const cadeia = distCasa.mercado?.size && distCasa.farmacia?.size ? cadeiaDeRecados(ex, ligados, mapas.get("farmacia"), distCasa.mercado, distCasa.farmacia) : null;
  if (cadeia) { cadeiasComparadas += 1; if (cadeia.metros > cadeia.separadasM + 1e-6) cadeiasMaioresQueSeparadas += 1; }
  porPredio.set(f.id, { area: f.area, modo: "rede", classe: f.classe, categorias: cats,
    cadeia: cadeia ? { mercado: cadeia.mercado, farmacia: cadeia.farmacia, metros: Math.round(cadeia.metros), separadasM: Math.round(cadeia.separadasM) } : null });
}
marca("alcance", t);

// ——— 6. Cobertura por prédio e categoria ————————————————————————————————————————————————————
const cobertura = {};
for (const a of PILOTO) {
  const ps = [...porPredio.values()].filter((p) => p.area === a);
  const redeP = ps.filter((p) => p.modo === "rede");
  const cat = {};
  for (const c of CATEGORIAS) {
    const ms = redeP.map((p) => p.categorias[c]).filter(Boolean).map((x) => x.metros).sort((x, y) => x - y);
    const comPonte = redeP.filter((p) => p.categorias[c]?.pontes.length);
    cat[c] = {
      predios: ps.length, comRede: redeP.length, alcancadoAte2km: ms.length, ate10min: redeP.filter((p) => p.categorias[c] && p.categorias[c].metros <= 720).length,
      medianaMin: ms.length ? minutos(ms[Math.floor(ms.length / 2)]) : null,
      rotaComPonte: comPonte.length, planoBIndependenteQuandoHaPonte: comPonte.filter((p) => p.categorias[c].planoB).length,
      segundoMaisProximoCompartilhaPonte: redeP.filter((p) => p.categorias[c]?.segundo?.compartilhaPonte).length,
      comPlanoB: redeP.filter((p) => p.categorias[c]?.planoB).length,
    };
  }
  const cad = redeP.map((p) => p.cadeia).filter(Boolean);
  const econ = cad.map((c) => c.separadasM - c.metros).sort((x, y) => x - y);
  cobertura[a] = { predios: ps.length, modoRede: redeP.length, modoLinhaReta: ps.length - redeP.length, categorias: cat,
    cadeia: { comparadas: cad.length, economiaMedianaM: econ.length ? econ[Math.floor(econ.length / 2)] : null, comEconomiaMaterial: cad.filter((c) => c.separadasM - c.metros >= 300 && (c.separadasM - c.metros) / c.separadasM >= 0.15).length } };
}

// ——— 7. G-POI e folha de revisão ———————————————————————————————————————————————————————————
const SET_POI = join(RAIZ, "docs/aplicacao/evaluation-sets/g-poi.json");
const hashDe = (s) => sha256(`VE04-gpoi|${s}`);
let gpoi;
if (existsSync(SET_POI)) gpoi = JSON.parse(readFileSync(SET_POI, "utf8"));
else {
  const itens = [];
  for (const a of PILOTO) for (const c of CATEGORIAS) {
    const pool = locais.filter((l) => l.bairro === a && l.categoria === c).sort((x, y) => hashDe(x.id).localeCompare(hashDe(y.id)));
    for (const l of pool.slice(0, 2)) itens.push({ local: l.id, area: a, categoria: c, motivo: "amostra" });
  }
  for (const d of duplicatas.filter((d) => PILOTO.includes(locais.find((l) => l.id === d.local)?.bairro)).slice(0, 6)) itens.push({ local: d.local, area: locais.find((l) => l.id === d.local).bairro, categoria: locais.find((l) => l.id === d.local).categoria, motivo: `duplicata_fundida:${d.fundido}` });
  for (const fc of fechados.filter((x) => PILOTO.includes(indiceRuas.bairrosDoPonto(x.ponto[0], x.ponto[1])[0])).slice(0, 4)) itens.push({ local: fc.id, area: indiceRuas.bairrosDoPonto(fc.ponto[0], fc.ponto[1])[0], categoria: fc.categoria, motivo: "fechado_no_osm" });
  gpoi = { set: "G-POI", version: 1, created: agora.slice(0, 10), created_by: "VE04 rodar-destinos.mjs", regra: "2 locais por bairro e categoria (ordem SHA-256 do id) + duplicatas fundidas e locais fechados achados no piloto", label_status: "nao_revisado", itens };
  writeFileSync(SET_POI, JSON.stringify(gpoi, null, 1) + "\n");
}
const porId = new Map(locais.map((l) => [l.id, l]));
const fechadoPorId = new Map(fechados.map((f) => [f.id, f]));
const osm = (lo, la) => `https://www.openstreetmap.org/?mlat=${la.toFixed(6)}&mlon=${lo.toFixed(6)}#map=19/${la.toFixed(6)}/${lo.toFixed(6)}`;
const linhas = [["local", "bairro", "categoria", "motivo", "nome", "fontes", "horario", "entrada_mapeada", "ligado_a_rede", "lon", "lat", "mapa",
  "REVISAO_existe_e_funciona(sim/nao/nao_sei)", "REVISAO_categoria_correta(sim/nao)", "REVISAO_e_o_mesmo_que_outro(id)", "REVISAO_entrada_publica_lon", "REVISAO_entrada_publica_lat", "REVISAO_revisor", "REVISAO_data", "REVISAO_nota"]];
for (const it of gpoi.itens) {
  const l = porId.get(it.local) ?? fechadoPorId.get(it.local);
  if (!l) continue;
  linhas.push([it.local, it.area, it.categoria, it.motivo, l.nome ?? "", (l.fontes ?? ["osm"]).join(" "), l.horario?.texto ?? "", l.entradaMapeada ? "sim" : "nao", l.pontas?.length ? "sim" : "nao",
    l.ponto[0].toFixed(6), l.ponto[1].toFixed(6), osm(l.ponto[0], l.ponto[1]), "", "", "", "", "", "", "", ""]);
}
gravarFolha(join(RAIZ, "docs/aplicacao/evaluation-sets/g-poi-revisao.csv"), linhas.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n") + "\n");

// ——— 8. Pacote do app e publicação ——————————————————————————————————————————————————————————
t = Date.now();
// O formato do pacote entra na versão: mudar o formato com as mesmas entradas não pode reaproveitar a pasta.
// 3 (VE16): "geradoEm" passa a ser a data do dado mais novo; pasta nova em vez de regravar a da versão 2.
const FORMATO_DO_PACOTE = 3;
// VE16: "geradoEm" é a data do dado mais novo usado (não a hora da execução): mesma entrada, mesmo arquivo.
const dataDosDados = ["2026-11-14T00:00:00Z", ...snapshotsMunicipais.map((s) => s.recuperadoEm)].filter(Boolean).sort().at(-1);
const versaoDeEntrada = sha256(JSON.stringify({ rede: rede.versao, catalogo: VERSAO_DO_CATALOGO, alcance: VERSAO_DO_ALCANCE, formato: FORMATO_DO_PACOTE, municipais: snapshotsMunicipais.map((s) => s.sha256) })).slice(0, 16);
const pacotes = {};
for (const a of PILOTO) {
  const usados = new Map();
  const ref = (i) => {
    if (i === null || i === undefined) return null;
    if (!usados.has(i)) usados.set(i, usados.size);
    return usados.get(i);
  };
  const predios = {};
  for (const [id, p] of porPredio) {
    if (p.area !== a) continue;
    const c = {};
    for (const cat of CATEGORIAS) {
      const x = p.categorias[cat];
      if (!x) { c[cat] = null; continue; }
      c[cat] = p.modo === "linha_reta" ? { l: ref(x.local), retaM: x.retaM }
        : { l: ref(x.local), m: x.metros, min: x.minutos, b: x.planoB ? { l: ref(x.planoB.local), m: x.planoB.metros, min: x.planoB.minutos } : null,
          // Campos opcionais só quando dizem algo (pacote menor): pontes do caminho e o segundo mais próximo na mesma ponte.
          ...(x.pontes.length ? { pontes: x.pontes } : {}), ...(x.segundo?.compartilhaPonte ? { segundoNaMesmaPonte: true } : {}) };
    }
    predios[id] = { modo: p.modo, c, cadeia: p.cadeia ? { mercado: ref(p.cadeia.mercado), farmacia: ref(p.cadeia.farmacia), m: p.cadeia.metros, separadasM: p.cadeia.separadasM } : null };
  }
  const locaisDoPacote = [...usados.keys()].map((i) => {
    const l = ligados[i];
    return { nome: l.nome ?? null, categoria: l.categoria, ponto: l.ponto.map((x) => Math.round(x * 1e6) / 1e6), horario: l.horario?.texto?.slice(0, 160) ?? null,
      fontes: l.fontes, periodico: Boolean(l.periodico) };
  });
  pacotes[a] = { versao: versaoDeEntrada, geradoEm: dataDosDados, rede: rede.versao, velocidadeMps: VELOCIDADE, limiteM: LIMITE_M,
    fontes: { osm: "OpenStreetMap, extrato Geofabrik de 13/11/2026", prefeitura: "Prefeitura do Recife: praças, feiras, mercados públicos e Farmácias da Família", gtfs: "GTFS Grande Recife v2026.10.26" },
    locais: locaisDoPacote, predios };
}
const pastaApp = join(RAIZ, "src/dados/recife/essenciais", versaoDeEntrada);
mkdirSync(pastaApp, { recursive: true });
for (const a of PILOTO) {
  const arq = join(pastaApp, `${a}.json`);
  const texto = JSON.stringify(pacotes[a]);
  gravarImutavel(arq, texto);
}
const catalogoTs = `// Gerado por scripts/dados/destinos/rodar-destinos.mjs (VE04). Troca atômica depois de gravar as partições.\n` +
  `export const VERSAO_DOS_ESSENCIAIS = ${JSON.stringify(versaoDeEntrada)};\n` +
  `export const ARQUIVOS_DOS_ESSENCIAIS: Record<string, string> = {\n${PILOTO.map((a) => `  ${JSON.stringify(a)}: ${JSON.stringify(`recife/essenciais/${versaoDeEntrada}/${a}.json`)},`).join("\n")}\n};\n`;
const arqCat = join(RAIZ, "src/dados/recife/essenciaisGerados.ts");
writeFileSync(`${arqCat}.tmp`, catalogoTs); renameSync(`${arqCat}.tmp`, arqCat);
publicacaoDeCamadas.publicarCamadas(); // D036: os arquivos vão para public/dados e assets/dados, fora do bundle.

const gz = (o) => gzipSync(Buffer.from(JSON.stringify(o)), { level: 9 });
const manifesto = prepararVersao(PUB, "essenciais", {
  particoes: [
    { arquivo: "locais.json.gz", conteudo: gz(locais.map(({ pontas, destinos, ...l }) => ({ ...l, ligado: pontas.length > 0, destinos: destinos.length }))), registros: locais.length },
    { arquivo: "fechados.json", conteudo: Buffer.from(JSON.stringify(fechados, null, 1) + "\n"), registros: fechados.length },
    { arquivo: "duplicatas.json", conteudo: Buffer.from(JSON.stringify(duplicatas, null, 1) + "\n"), registros: duplicatas.length },
    ...PILOTO.map((a) => ({ arquivo: `${a}.json`, conteudo: Buffer.from(JSON.stringify(pacotes[a])), registros: Object.keys(pacotes[a].predios).length })),
  ],
  fontes: [
    { fonte: "osm_nordeste_261113", sha256: "e55995308145fa0b7e98f1231a3478f76815f5ff3cd114c0848c7ba047204f83", estado: "valida", analisador: `catalogo@${VERSAO_DO_CATALOGO}`, recuperadoEm: "2026-11-14T00:00:00Z" },
    ...snapshotsMunicipais.map((s) => ({ fonte: s.fonte, sha256: s.sha256, estado: s.estado, analisador: `catalogo@${VERSAO_DO_CATALOGO}`, recuperadoEm: s.recuperadoEm ?? agora })),
  ],
  derivacoes: [{ nome: "rede_pedestre", versao: rede.versao }, { nome: "catalogo", versao: VERSAO_DO_CATALOGO }, { nome: "alcance", versao: VERSAO_DO_ALCANCE }],
  cobertura: { denominador: "prédios do piloto com cada categoria a até 10 min a pé (rede, 1,2 m/s)", total: porPredio.size,
    porChave: Object.fromEntries(PILOTO.flatMap((a) => CATEGORIAS.map((c) => [`${a}:${c}`, cobertura[a].categorias[c].ate10min]))) },
  validacao: { quarentena: 0, motivos: {}, verificacoes: [{ nome: "cadeia_nunca_maior_que_idas_separadas", ok: cadeiasMaioresQueSeparadas === 0, detalhe: `${cadeiasMaioresQueSeparadas} de ${cadeiasComparadas}` }] },
  criadoEm: agora,
});
const ativo = ponteiroAtual(PUB, "essenciais");
const ponteiro = ativo?.versao === manifesto.versao ? ativo : ativar(PUB, "essenciais", manifesto.versao, { agora, quedaMaxima: 0.2 });
marca("publicacao", t);

const contarPor = (lista, k) => lista.reduce((m, x) => ({ ...m, [x[k]]: (m[x[k]] ?? 0) + 1 }), {});
const relatorio = {
  executadoEm: agora, aoVivo: AO_VIVO, rede: rede.versao, versaoDosEssenciais: versaoDeEntrada, publicacao: { versao: manifesto.versao, ativa: ponteiro.versao, anterior: ponteiro.anterior ?? null },
  candidatos: { total: candidatos.length, porCategoria: contarPor(candidatos, "categoria"), porFonte: candidatos.reduce((m, c) => { for (const f of c.fontes) m[f] = (m[f] ?? 0) + 1; return m; }, {}) },
  locais: { total: locais.length, porCategoria: contarPor(locais, "categoria"), ligadosARede: ligados.length, comEntradaMapeada: locais.filter((l) => l.entradaMapeada).length,
    comHorario: contarPor(locais.filter((l) => l.horario), "categoria"), multiFonte: locais.filter((l) => l.fontes.length > 1).length,
    noPiloto: contarPor(locais.filter((l) => PILOTO.includes(l.bairro)), "categoria") },
  duplicatasFundidas: duplicatas.length, fechadosNoOsm: { total: fechados.length, porCategoria: contarPor(fechados, "categoria") }, paradasSemServico,
  municipais: snapshotsMunicipais, cobertura, cadeias: { comparadas: cadeiasComparadas, maioresQueSeparadas: cadeiasMaioresQueSeparadas },
  gpoi: { itens: gpoi.itens.length, porMotivo: gpoi.itens.reduce((m, x) => { const k = x.motivo.split(":")[0]; m[k] = (m[k] ?? 0) + 1; return m; }, {}) },
  pacoteDoApp: { pasta: `src/dados/recife/essenciais/${versaoDeEntrada}`, bytes: Object.fromEntries(PILOTO.map((a) => [a, Buffer.byteLength(JSON.stringify(pacotes[a]))])) },
  tempos: { ...tempos, total: Date.now() - t0 },
};
const rel = arg("--relatorio");
if (rel) writeFileSync(rel, JSON.stringify(relatorio, null, 1) + "\n");
console.log(JSON.stringify({ versao: versaoDeEntrada, locais: relatorio.locais.porCategoria, cobertura: Object.fromEntries(PILOTO.map((a) => [a, Object.fromEntries(CATEGORIAS.map((c) => [c, cobertura[a].categorias[c].ate10min]))])), ms: relatorio.tempos.total }));
