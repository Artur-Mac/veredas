// Equipamentos por perto (15/11/2026): por prédio do índice municipal ativo, o que o cadastro da Prefeitura registra em
// volta — semáforos e semáforos sonoros a até 150 m, paraciclo, estação do Bike PE, ciclovia (permanente e Conecta),
// unidade de saúde, equipamento de cultura e lazer, unidade de conservação e praça/parque com a área do polígono.
//
//   node scripts/dados/equipamentos/rodar-equipamentos.mjs [--hub 2026-11-15] [--relatorio <arquivo.json>]
//
// Cada item é um CADASTRO: não diz horário, funcionamento, manutenção nem acesso atual (P09 para os sonoros). Distâncias
// em linha reta, arredondadas a 10 m. Fontes do hub auditado (SHA-256 conferido pelo manifesto) e o polígono oficial de
// praças e parques (.cache/dados-recife/parques-e-pracas.geojson, ESIG, ODbL).
// Fora, de propósito: residências terapêuticas, albergues, CAPS e CVA (serviço residencial ou de saúde mental; apontar
// como "vizinho" estigmatiza quem é atendido e não informa a decisão de moradia); `complemento` da cultura nunca é lido.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { abrirHub, nomeDoHub } from "../hub.mjs";
import { gravarImutavel } from "../imutavel.mjs";
import * as g from "./geometria.mjs";

const RAIZ = process.cwd();
const FORMATO = 1;
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

export const RECURSOS = {
  semaforos: "03995e83-91a3-4719-bedd-488886f103a1",
  sonoros: "d163e8ff-dc1f-410d-81d5-164ea97dc447",
  paraciclos: "a7d63c12-f9b2-4ea0-94d3-d6093bc618fa",
  /** Três recursos GeoJSON com o mesmo SHA-256 (836b8e24, a290b35f, 8778757a): um basta, só para conferir a contagem. */
  paraciclosGeo: "836b8e24-67d8-49fc-a62c-85602b501e80",
  bikePe: "26014b26-510a-4805-a9ab-55ade61c3715",
  rotasPermanentes: "1c9feb5e-38ad-4235-b3d2-771964c59c46",
  rotasConecta: "c67fa150-8c69-4f6d-8fca-8204fdd61e35",
  saude: "9a8e3ff8-950c-4548-ad9f-a73aa84dd616",
  cultura: "e5442e5b-75ef-4cc9-8ccb-526dd5ed9f87",
  ucn: "bc17896e-b2d9-4378-a87f-2f2440712bfd",
};
const PRACAS = ".cache/dados-recife/parques-e-pracas.geojson";
const URL_PRACAS = "https://dados.recife.pe.gov.br/dataset/b3a3a033-3611-485c-8d18-d02c5a42563d/resource/054f05a9-a113-47e0-a46f-720e4828eaf2";

/** Tipos de saúde que entram (atendimento a quem mora perto) e os que ficam fora (ver o cabeçalho). */
export function tipoDeSaude(tipo) {
  const t = String(tipo ?? "").toUpperCase();
  if (/RESIDENCIA|ALBERGUE|CAPS|^CVA$/.test(t)) return null;
  if (/ACADEMIA DA CIDADE/.test(t)) return "lazer";
  return "saude";
}

export const RAIO_SEMAFOROS_M = 150;
export const LIMITES_M = { paraciclo: 1000, bike: 1000, ciclovia: 1000, saude: 2000, cultura: 2000, ucn: 2000, praca: 800 };
const r10 = (m) => Math.round(m / 10) * 10;

function edificiosAtivos() {
  const pub = readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8");
  const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
  const arquivos = Object.fromEntries([...pub.matchAll(/"([a-z-]+)": "(recife\/indice-municipal\/[0-9a-f]+\/[a-z-]+\.json)"/g)].map((m) => [m[1], m[2]]));
  const porBairro = {};
  for (const [bairro, c] of Object.entries(arquivos)) {
    const d = JSON.parse(readFileSync(join(RAIZ, "src/dados", c), "utf8"));
    porBairro[bairro] = d.edificios.map((e) => ({ id: e.id, lon: e.centro[0], lat: e.centro[1] }));
  }
  return { dir, porBairro };
}

/** Lê as fontes; devolve os pontos/linhas/polígonos já limpos e o que foi descartado, por quê. */
export function lerFontes(hub, pracasGeo) {
  const rel = {};
  const csv = (id, campos) => hub.lerTabela({ recurso: id, fields: campos, rotulo: id.slice(0, 8) }).registros;
  const ponto = (lat, lon) => {
    let a = Number(String(lat ?? "").trim().replace(",", ".")), o = Number(String(lon ?? "").trim().replace(",", "."));
    if (!Number.isFinite(a) || !Number.isFinite(o)) return null;
    if (a < -30 && o > -10) [a, o] = [o, a]; // latitude e longitude trocadas (cultura: as 68 linhas)
    return g.noRecife(o, a) ? [o, a] : null;
  };
  const pontos = (rotulo, linhas, ler) => {
    const out = [];
    let sem = 0, trocadas = 0;
    for (const r of linhas) {
      const v = ler(r);
      const p = ponto(v.lat, v.lon);
      if (!p) { sem++; continue; }
      if (Number(v.lat) < -30) trocadas++;
      out.push({ ...v, p });
    }
    rel[rotulo] = { linhas: linhas.length, comPosicao: out.length, semPosicao: sem, ...(trocadas ? { latLonTrocadas: trocadas } : {}) };
    return out;
  };

  const semaforos = pontos("semaforos", csv(RECURSOS.semaforos, ["semaforo", "latitude", "longitude"]), (r) => ({ id: r.semaforo, lat: r.latitude, lon: r.longitude }));
  const sonoros = pontos("sonoros", csv(RECURSOS.sonoros, ["semafororo", "latitude", "longitude"]), (r) => ({ id: r.semafororo, lat: r.latitude, lon: r.longitude }));

  // Paraciclos: o CSV (562 linhas, com nome e vagas). Coordenada fora do Recife no CSV (88 linhas, longitude truncada,
  // ex.: -34.52) vem do GeoJSON pela mesma referência ("P252"), quando ele a tem dentro do Recife. Um ponto por
  // referência + coordenada.
  const geo = hub.lerGeojson(RECURSOS.paraciclosGeo);
  const geoPorRef = new Map();
  for (const f of geo.dados.features) {
    const c = f.geometry?.coordinates;
    if (c && g.noRecife(c[0], c[1]) && f.properties?.Name) geoPorRef.set(String(f.properties.Name).trim(), [c[0], c[1]]);
  }
  const linhasPc = csv(RECURSOS.paraciclos, ["referencia", "nome", "vagas", "latitude", "longitude"]);
  let peloGeojson = 0;
  const comGeo = linhasPc.map((r) => {
    const ref = String(r.referencia ?? "").trim();
    if (ponto(r.latitude, r.longitude) || !geoPorRef.has(ref)) return r;
    peloGeojson++;
    const [lon, lat] = geoPorRef.get(ref);
    return { ...r, latitude: String(lat), longitude: String(lon) };
  });
  const brutos = pontos("paraciclos", comGeo,
    (r) => ({ id: String(r.referencia ?? "").trim(), nome: String(r.nome ?? "").trim() || null, vagas: Number(r.vagas) || null, lat: r.latitude, lon: r.longitude }));
  const vistos = new Map();
  for (const x of brutos) { const k = `${x.id}|${x.p[0].toFixed(5)}|${x.p[1].toFixed(5)}`; if (!vistos.has(k)) vistos.set(k, x); }
  const paraciclos = [...vistos.values()];
  rel.paraciclos.unicos = paraciclos.length;
  rel.paraciclos.posicaoPeloGeojson = peloGeojson;
  rel.paraciclos.conferenciaGeojson = { recurso: RECURSOS.paraciclosGeo, feicoes: geo.dados.features.length, nota: "a290b35f e 8778757a têm o mesmo SHA-256; não lidos" };

  const bikes = pontos("bikePe", csv(RECURSOS.bikePe, ["nome", "capacidade", "latitude", "longitude"]),
    (r) => ({ nome: String(r.nome ?? "").replace(/^\d+\s*-\s*/, "").trim(), cap: Number(r.capacidade) || null, lat: r.latitude, lon: r.longitude }));
  const cultura = pontos("cultura", csv(RECURSOS.cultura, ["equipamento", "tipo", "latitude", "longitude"]),
    (r) => ({ nome: g.titulo(r.equipamento), tipo: g.titulo(r.tipo), lat: r.latitude, lon: r.longitude }));

  const linhas = (id, rotulo) => {
    const d = hub.lerGeojson(id).dados;
    const feicoes = d.features.filter((f) => f.geometry).map((f) => ({ tipo: f.properties.Tipo ?? null, linhas: g.linhasDe(f.geometry) }));
    rel[rotulo] = { feicoes: d.features.length, comGeometria: feicoes.length };
    return feicoes;
  };
  const permanentes = linhas(RECURSOS.rotasPermanentes, "rotasPermanentes");
  const conecta = linhas(RECURSOS.rotasConecta, "rotasConecta");

  const sd = hub.lerGeojson(RECURSOS.saude).dados.features;
  const saude = [], lazer = [], foraDaSaude = {};
  for (const f of sd) {
    const tipo = String(f.properties.CDTIPO ?? "").trim();
    const classe = tipoDeSaude(tipo);
    if (!classe) { foraDaSaude[tipo] = (foraDaSaude[tipo] ?? 0) + 1; continue; }
    const item = { nome: g.titulo(f.properties.NMUNIDAD), tipo: g.titulo(tipo), aneis: g.aneisDe(f.geometry) };
    (classe === "saude" ? saude : lazer).push(item);
  }
  rel.saude = { feicoes: sd.length, saude: saude.length, academiaDaCidade: lazer.length, foraDeProposito: foraDaSaude };

  const uc = hub.lerGeojson(RECURSOS.ucn).dados.features;
  const ucn = uc.filter((f) => f.geometry).map((f) => ({ nome: g.titulo(f.properties.CDZONA_NOME), aneis: g.aneisDe(f.geometry), hectares: Math.round(g.areaM2(g.aneisDe(f.geometry)) / 1000) / 10 }));
  rel.ucn = { feicoes: uc.length, comGeometria: ucn.length };

  const pracas = [];
  const tiposPraca = {};
  for (const f of pracasGeo.features) {
    const tipo = String(f.properties.CDTIPO ?? "").toUpperCase().replace("PRACA", "PRAÇA");
    tiposPraca[tipo] = (tiposPraca[tipo] ?? 0) + 1;
    if (!f.geometry || !["PRAÇA", "PARQUE"].includes(tipo)) continue;
    const aneis = g.aneisDe(f.geometry);
    pracas.push({ nome: g.titulo(f.properties.NMNOMEOFIC ?? f.properties.NMNOME) || null, tipo: tipo === "PARQUE" ? "Parque" : "Praça", aneis, m2: Math.round(g.areaM2(aneis)) });
  }
  rel.pracas = { feicoes: pracasGeo.features.length, porTipo: tiposPraca, usadas: pracas.length, nota: "\"AREA VERDE\" fica fora: não é espaço de convívio cadastrado" };
  return { semaforos, sonoros, paraciclos, bikes, cultura, permanentes, conecta, saude, lazer, ucn, pracas, rel };
}

/** O que vale para um prédio. Distâncias em metros, arredondadas a 10; ausente quando passa do limite. */
export function equipamentosDoPonto(lon, lat, f, indices) {
  const out = {};
  const perto = (lista) => lista.reduce((n, x) => n + (g.distM(lon, lat, x.p[0], x.p[1]) <= RAIO_SEMAFOROS_M ? 1 : 0), 0);
  out.sem = perto(f.semaforos);
  out.son = perto(f.sonoros);
  const maisPerto = (lista, dist, limite) => {
    let melhor = null;
    lista.forEach((x, i) => { const d = dist(x); if (d <= limite && (!melhor || d < melhor[1])) melhor = [i, d]; });
    return melhor ? [melhor[0], r10(melhor[1])] : null;
  };
  const pt = (x) => g.distM(lon, lat, x.p[0], x.p[1]);
  const pol = (x) => g.distAoPoligonoM(lon, lat, x.aneis);
  const lin = (x) => g.distAsLinhasM(lon, lat, x.linhas);
  const son = maisPerto(f.sonoros, pt, 500);
  if (son) out.sonM = son[1];
  const pc = maisPerto(f.paraciclos, pt, LIMITES_M.paraciclo); if (pc) out.pc = pc[1];
  const bk = maisPerto(f.bikes, pt, LIMITES_M.bike); if (bk) out.bk = [indices.bikes.get(bk[0]), bk[1]];
  const cv = maisPerto(f.permanentes, lin, LIMITES_M.ciclovia); if (cv) out.cv = cv[1];
  const cc = maisPerto(f.conecta, lin, LIMITES_M.ciclovia); if (cc) out.cc = cc[1];
  const sd = maisPerto(f.saude, pol, LIMITES_M.saude); if (sd) out.sd = [indices.saude.get(sd[0]), sd[1]];
  const ac = maisPerto(f.lazer, pol, LIMITES_M.cultura); if (ac) out.ac = [indices.lazer.get(ac[0]), ac[1]];
  const ct = maisPerto(f.cultura, pt, LIMITES_M.cultura); if (ct) out.ct = [indices.cultura.get(ct[0]), ct[1]];
  const uc = maisPerto(f.ucn, pol, LIMITES_M.ucn); if (uc) out.uc = [indices.ucn.get(uc[0]), uc[1]];
  const pq = maisPerto(f.pracas, pol, LIMITES_M.praca); if (pq) out.pq = [indices.pracas.get(pq[0]), pq[1]];
  // A maior praça ou parque a até 800 m, quando não é a mais perto.
  let maior = null;
  f.pracas.forEach((x, i) => { const d = pol(x); if (d <= LIMITES_M.praca && (!maior || x.m2 > f.pracas[maior[0]].m2)) maior = [i, d]; });
  if (maior && (!pq || maior[0] !== pq[0])) out.pg = [indices.pracas.get(maior[0]), r10(maior[1])];
  return out;
}

function main() {
  const hub = abrirHub(nomeDoHub() ?? "2026-11-15");
  if (!existsSync(join(RAIZ, PRACAS))) throw new Error(`${PRACAS} ausente: rode scripts/dados/camadas-inteligentes-recife.mjs`);
  const pracasTexto = readFileSync(join(RAIZ, PRACAS), "utf8");
  const f = lerFontes(hub, JSON.parse(pracasTexto));
  const { dir, porBairro } = edificiosAtivos();
  const codigo = readFileSync(new URL(import.meta.url), "utf8") + readFileSync(new URL("./geometria.mjs", import.meta.url), "utf8");
  const shas = Object.values(RECURSOS).map((id) => hub.entrada(id).sha256);
  const versao = sha256(JSON.stringify({ FORMATO, codigo: sha256(codigo), shas, pracas: sha256(pracasTexto), indice: dir })).slice(0, 16);
  const pasta = join(RAIZ, "src/dados/recife/equipamentos", versao);
  mkdirSync(pasta, { recursive: true });

  const arquivos = {};
  const resumo = {};
  for (const [bairro, eds] of Object.entries(porBairro)) {
    const usados = { bikes: new Map(), saude: new Map(), lazer: new Map(), cultura: new Map(), ucn: new Map(), pracas: new Map() };
    const locais = { b: [], s: [], a: [], c: [], u: [], p: [] };
    const chave = { bikes: "b", saude: "s", lazer: "a", cultura: "c", ucn: "u", pracas: "p" };
    const linhaDoLocal = {
      bikes: (x) => [x.nome, x.cap], saude: (x) => [x.nome, x.tipo], lazer: (x) => [x.nome, x.tipo], cultura: (x) => [x.nome, x.tipo],
      ucn: (x) => [x.nome, x.hectares], pracas: (x) => [x.nome, x.tipo, x.m2],
    };
    // Índice local: a primeira vez que um prédio do bairro aponta para um local, ele entra na lista do bairro.
    const indices = Object.fromEntries(Object.keys(usados).map((k) => [k, { get: (i) => {
      if (!usados[k].has(i)) { usados[k].set(i, locais[chave[k]].length); locais[chave[k]].push(linhaDoLocal[k](f[k][i])); }
      return usados[k].get(i);
    } }]));
    const predios = {};
    for (const e of [...eds].sort((a, b) => (a.id < b.id ? -1 : 1))) predios[e.id] = equipamentosDoPonto(e.lon, e.lat, f, indices);
    const texto = JSON.stringify({ versao, raioSemaforosM: RAIO_SEMAFOROS_M, locais, predios });
    gravarImutavel(join(pasta, `${bairro}.json`), texto);
    arquivos[bairro] = `recife/equipamentos/${versao}/${bairro}.json`;
    const v = Object.values(predios);
    resumo[bairro] = { predios: v.length, bytes: Buffer.byteLength(texto), comSonoroA150m: v.filter((x) => x.son > 0).length, comCiclovia: v.filter((x) => x.cv != null).length, comPraca: v.filter((x) => x.pq).length };
  }

  const fontes = [
    ...Object.entries(RECURSOS).map(([chave, id]) => ({ chave, recurso: id, nome: hub.entrada(id).nome, sha256: hub.entrada(id).sha256, modificadoEm: hub.modificadoEm(id), extraidoEm: hub.dataDaExtracao, licenca: "ODbL" })),
    { chave: "pracas", recurso: URL_PRACAS, nome: "Parques e praças (ESIG)", sha256: sha256(pracasTexto), modificadoEm: null, extraidoEm: null, licenca: "ODbL" },
  ];
  const ts = "// Gerado por scripts/dados/equipamentos/rodar-equipamentos.mjs (15/11/2026). Troca atômica depois de gravar as partições.\n" +
    "// Cadastro da Prefeitura: não diz horário, funcionamento, manutenção nem acesso atual.\n" +
    `export const VERSAO_DOS_EQUIPAMENTOS = ${JSON.stringify(versao)};\n` +
    `export const INDICE_DOS_EQUIPAMENTOS = ${JSON.stringify(dir)};\n` +
    `export const ARQUIVOS_DOS_EQUIPAMENTOS: Record<string, string> = {\n${Object.entries(arquivos).map(([b, c]) => `  ${JSON.stringify(b)}: ${JSON.stringify(c)},`).join("\n")}\n};\n` +
    `export const FONTES_DOS_EQUIPAMENTOS = ${JSON.stringify(fontes, null, 1)} as const;\n`;
  const arqTs = join(RAIZ, "src/dados/recife/equipamentosGerado.ts");
  writeFileSync(`${arqTs}.tmp`, ts); renameSync(`${arqTs}.tmp`, arqTs);

  const relatorio = { executadoEm: new Date().toISOString(), versao, indice: dir, hub: hub.nome, fontes: f.rel, bairros: Object.keys(arquivos).length,
    predios: Object.values(resumo).reduce((s, r) => s + r.predios, 0), maiorArquivo: Math.max(...Object.values(resumo).map((r) => r.bytes)), resumo };
  const out = arg("--relatorio");
  if (out) writeFileSync(out, JSON.stringify(relatorio, null, 1) + "\n");
  console.log(JSON.stringify({ ...relatorio, resumo: undefined }, null, 1));
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) main();
