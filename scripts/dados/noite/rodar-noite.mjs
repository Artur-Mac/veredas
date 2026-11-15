// VE08 — A volta à noite e de que lado vem o barulho, para os prédios do piloto com ligação forte (VE03).
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/noite/rodar-noite.mjs \
//     --relatorio docs/aplicacao/execucoes/VE08/noite.json
// Volta à noite: do ponto mais perto (pela rede, ≤ 1 km) com ônibus/metrô CHEGANDO entre 22h e 2h num dia útil típico
// (grade do VE05) até a entrada; travessias de via principal estimadas pela rede; um caminho com menos travessias
// dentro de +20%; postes CADASTRADOS (não diz se acendem) e pedidos 156 de lâmpada apagada (relato com data e situação);
// atropelamentos da CTTU 2022–2024 nas ruas do caminho (endereço da via, sem hora). Nada aqui é nota de segurança.
// Barulho: o lado do prédio que dá para a via principal mais perta (≤ 80 m) e para um local com LUSE vigente (≤ 150 m).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import publicacaoDeCamadas from "../publicar-camadas.cjs";
import { gunzipSync } from "node:zlib";
import { arestaMaisProxima, distanciaM, grafoPublicado, indexarArestas, projetar } from "../rede/grafo.mjs";
import { indexarRuasOficiais } from "../rede/frentes.mjs";
import { criarIndiceDeRuas, vincularRua } from "../observacoes/vinculo.mjs";
import { ponteiroAtual } from "../observacoes/publicar.mjs";
import { criarExplorador } from "../destinos/alcance.mjs";
import { prepararGrade, servicosAtivos } from "../../../src/dados/transito/roteador.ts";
import { contarTravessias, grauPrincipal as calcularGrau, nosDoCaminho as nosDe } from "./travessias.mjs";
import { AREAS } from "../areas.mjs";
import { gravarFolha } from "../folhas.mjs";
import { gravarImutavel } from "../imutavel.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const PILOTO = AREAS; // VE16: piloto + expansão (scripts/dados/areas.json)
const DIA_UTIL = "2026-11-17", NOITE_INI = 22 * 3600, NOITE_FIM = 26 * 3600;
const LIMITE_M = 1000, DESVIO = 0.2, LUZ_M = 25, FORMATO = 1;
const DIRS = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"];
const direcao = (graus) => DIRS[Math.round((((graus % 360) + 360) % 360) / 45) % 8];
const rumo = (a, b) => (Math.atan2((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * 180) / Math.PI;
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const slugDe = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const num = (s) => Number(String(s ?? "").replace(",", "."));
const t0 = Date.now();

// ——— Entradas ————————————————————————————————————————————————————————————————————————————————
const vTransito = /VERSAO_DO_TRANSITO = "([^"]+)"/.exec(readFileSync(join(RAIZ, "src/dados/recife/transitoGerado.ts"), "utf8"))[1];
const grade = prepararGrade(JSON.parse(readFileSync(join(RAIZ, `src/dados/recife/transito/${vTransito}/grade.json`), "utf8")));
const dirIndice = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8"))[1];
const PUB = join(RAIZ, ".cache/publicacoes");
const rede = ponteiroAtual(PUB, "rede-pedestre");
const pastaRede = join(PUB, "rede-pedestre", "versoes", rede.versao);
const g = grafoPublicado(JSON.parse(gunzipSync(readFileSync(join(pastaRede, "grafo.json.gz")))));
const frentes = JSON.parse(gunzipSync(readFileSync(join(pastaRede, "frentes.json.gz"))));
const gradeArestas = indexarArestas(g);
const trechos = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/trechos-de-logradouros.geojson"), "utf8"));
const bairrosGeo = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/bairros-do-recife.geojson"), "utf8"));
const gradeRuas = indexarRuasOficiais(trechos);
const indiceRuas = criarIndiceDeRuas(trechos, bairrosGeo);
const nomeDaRua = new Map(trechos.features.map((f) => [Number(f.properties.CLOGRACODI), f.properties.NLGPAVOFIC || f.properties.NLOGRACONC || null]));
const camadas = JSON.parse(readFileSync(join(RAIZ, "src/dados/recife/camadas-ambientais.json"), "utf8"));
const CEL = 0.002;
function ruaMaisProxima(lon, lat, raioM = 15) {
  const cx = Math.floor(lon / CEL), cy = Math.floor(lat / CEL);
  let melhor = null;
  for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) for (const s of gradeRuas.get(`${x},${y}`) ?? []) {
    const q = projetar(lon, lat, s.ax, s.ay, s.bx, s.by);
    if (q.metros <= raioM && (!melhor || q.metros < melhor.metros)) melhor = { codigo: s.codigo, metros: q.metros };
  }
  return melhor;
}
function gradeDePontos(pts) {
  const m = new Map();
  pts.forEach((p, i) => { const k = `${Math.floor(p.lon / 0.0005)},${Math.floor(p.lat / 0.0005)}`; if (!m.has(k)) m.set(k, []); m.get(k).push(i); });
  return (lon, lat, raio) => { const out = []; const cx = Math.floor(lon / 0.0005), cy = Math.floor(lat / 0.0005), r = Math.ceil(raio / 50); for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) for (const i of m.get(`${x},${y}`) ?? []) if (distanciaM(lon, lat, pts[i].lon, pts[i].lat) <= raio) out.push(i); return out; };
}

// Postes cadastrados (inventário de iluminação pública 2025) e pedidos 156 de lâmpada apagada (últimos 12 meses dos dados).
const postes = JSON.parse(readFileSync(join(RAIZ, ".cache/dados-recife/iluminacao-2025.json"), "utf8")).registros
  .map((r) => ({ id: r.id_ponto, lon: num(r.longitude), lat: num(r.latitude) })).filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat) && p.lon !== 0);
const postesPerto = gradeDePontos(postes);
const pedidos156 = [];
let fim156 = "";
for (const y of [2025, 2026]) for (const r of JSON.parse(readFileSync(join(RAIZ, `.cache/dados-recife/156-${y}.json`), "utf8")).registros) {
  if (r.SERVICO_DESCRICAO !== "MANUTENCAO EM LAMPADA APAGADA" || !Number.isFinite(r.longitude) || !Number.isFinite(r.latitude)) continue;
  const d = String(r.DATA_DEMANDA).slice(0, 10);
  if (d > fim156) fim156 = d;
  pedidos156.push({ lon: r.longitude, lat: r.latitude, data: d, situacao: r.SITUACAO });
}
const inicio156 = new Date(Date.parse(`${fim156}T00:00:00Z`) - 365 * 86400000).toISOString().slice(0, 10);
const pedidosRecentes = pedidos156.filter((p) => p.data > inicio156);
const pedidosPerto = gradeDePontos(pedidosRecentes);

// Atropelamentos e sinistros com pedestre (CTTU 2022–2024), ligados à rua oficial pelo nome e bairro.
const atropelamentos = new Map();
const sinistrosLidos = { total: 0, comPedestre: 0, ligados: 0 };
for (const ano of [2022, 2023, 2024]) for (const r of JSON.parse(readFileSync(join(RAIZ, `.cache/dados-recife/sinistros-${ano}.json`), "utf8")).registros) {
  sinistrosLidos.total += 1;
  const pedestre = /ATROPELAMENTO/.test(r.tipo ?? "") || num(r.pedestre) > 0;
  if (!pedestre) continue;
  sinistrosLidos.comPedestre += 1;
  const v = vincularRua(indiceRuas, r.endereco ?? "", slugDe(r.bairro));
  if (v.codigo === null) continue;
  sinistrosLidos.ligados += 1;
  const l = atropelamentos.get(v.codigo) ?? [];
  l.push({ ano, fatal: /FATAL/.test(r.natureza ?? ""), detalhe: (r.detalhe_endereco_acidente || "").trim() || null });
  atropelamentos.set(v.codigo, l);
}

// Pontos com chegada de ônibus/metrô entre 22h e 2h num dia útil típico (desembarque permitido).
const ativos = servicosAtivos(grade, DIA_UTIL);
const ultimaChegada = new Map();
const noturnas = new Set();
for (const r of grade.rotas) {
  const pd = grade.padroes[r.padrao];
  for (let j = 0; j < r.inicios.length; j++) {
    if (!ativos[r.servicos[j]]) continue;
    for (let i = 1; i < pd.paradas.length; i++) {
      if (pd.bandeiras && pd.bandeiras[i] & 2) continue;
      const t = r.inicios[j] + r.chegada[i];
      if (t >= NOITE_INI && t <= NOITE_FIM) noturnas.add(pd.paradas[i]);
      // Última chegada do dia de serviço inteiro (pode passar de 26h com linhas da madrugada), não só até as 2h.
      if (t >= NOITE_INI) { const p = pd.paradas[i]; if (!ultimaChegada.has(p) || t > ultimaChegada.get(p)) ultimaChegada.set(p, t); }
    }
  }
}
const ok = (e) => g.comp[e.a] === g.componentePrincipal && !(e.f & 32);
const paradasPorNo = new Map();
for (const p of noturnas) {
  const a = arestaMaisProxima(g, gradeArestas, grade.lon[p], grade.lat[p], 60, ok);
  if (a) for (const q of a.pontas) { if (!paradasPorNo.has(q.no)) paradasPorNo.set(q.no, []); paradasPorNo.get(q.no).push([p, q.m + a.metros]); }
}

// ——— Travessias de via principal ————————————————————————————————————————————————————————————————
const grauPrincipal = calcularGrau(g);
const juncaoPrincipal = (no) => grauPrincipal[no] >= 2;
const nosDoCaminho = (ks, inicio) => nosDe(g, ks, inicio);
const travessias = (ks, nos) => contarTravessias(g, grauPrincipal, ks, nos);
function dijkstra(origens, peso, alvo, limite) {
  const dist = new Map(), ant = new Map(), fila = [];
  const push = (c, n) => { fila.push([c, n]); let i = fila.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (fila[q][0] <= fila[i][0]) break; [fila[q], fila[i]] = [fila[i], fila[q]]; i = q; } };
  const pop = () => { const t = fila[0], u = fila.pop(); if (fila.length) { fila[0] = u; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < fila.length && fila[l][0] < fila[m][0]) m = l; if (r < fila.length && fila[r][0] < fila[m][0]) m = r; if (m === i) break; [fila[m], fila[i]] = [fila[i], fila[m]]; i = m; } } return t; };
  for (const o of origens) { dist.set(o.no, o.m); push(o.m, o.no); }
  while (fila.length) {
    const [d, u] = pop();
    if (u === alvo) break;
    if (d > (dist.get(u) ?? Infinity) || d > limite) continue;
    for (let j = g.inicio[u]; j < g.inicio[u + 1]; j++) {
      const k = g.qual[j], e = g.arestas[k];
      if (e.f & 32) continue;
      const v = g.viz[j], nd = d + peso(k);
      if (nd < (dist.get(v) ?? Infinity)) { dist.set(v, nd); ant.set(v, k); push(nd, v); }
    }
  }
  return { dist, ant };
}
const caminhoAte = (ant, no) => { const ks = []; for (let v = no, k; (k = ant.get(v)) !== undefined;) { ks.push(k); const e = g.arestas[k]; v = e.a === v ? e.b : e.a; } return ks.reverse(); };
const origemDe = (ks, fim) => { let v = fim; for (let i = ks.length - 1; i >= 0; i--) { const e = g.arestas[ks[i]]; v = e.a === v ? e.b : e.a; } return v; };

/** Iluminação ao longo do caminho: postes cadastrados a ≤ 25 m, maior trecho sem poste, pedidos 156 de lâmpada apagada. */
function luzDoCaminho(ks, nos) {
  const vistos = new Set(), pedidos = new Set();
  let maior = 0, corrido = 0;
  for (let i = 0; i < ks.length; i++) {
    const a = nos[i], b = nos[i + 1], m = g.arestas[ks[i]].m, n = Math.max(1, Math.round(m / 10));
    for (let s = 0; s < n; s++) {
      const t = (s + 0.5) / n, lon = g.lon[a] + (g.lon[b] - g.lon[a]) * t, lat = g.lat[a] + (g.lat[b] - g.lat[a]) * t;
      const ps = postesPerto(lon, lat, LUZ_M);
      for (const p of ps) vistos.add(p);
      for (const q of pedidosPerto(lon, lat, LUZ_M)) pedidos.add(q);
      if (ps.length) corrido = 0; else { corrido += m / n; maior = Math.max(maior, corrido); }
    }
  }
  const ped = [...pedidos].map((i) => pedidosRecentes[i]);
  // [postes cadastrados, maior trecho sem poste (m), pedidos de lâmpada apagada em 12 meses, ainda não atendidos]
  return [vistos.size, Math.round(maior), ped.length, ped.filter((p) => p.situacao !== "ATENDIDA").length];
}
/** Ruas oficiais do caminho (≥ 30 m) e os atropelamentos registrados nelas. */
function ruasDoCaminho(ks, nos) {
  const metros = new Map();
  for (let i = 0; i < ks.length; i++) {
    const a = nos[i], b = nos[i + 1];
    const r = ruaMaisProxima((g.lon[a] + g.lon[b]) / 2, (g.lat[a] + g.lat[b]) / 2);
    if (r) metros.set(r.codigo, (metros.get(r.codigo) ?? 0) + g.arestas[ks[i]].m);
  }
  // Só as ruas com registro entram no pacote: [nome, metros no caminho, atropelamentos, fatais, anos].
  return [...metros].filter(([, m]) => m >= 30).map(([c, m]) => {
    const l = atropelamentos.get(c) ?? [];
    return [nomeDaRua.get(c) ?? null, Math.round(m), l.length, l.filter((x) => x.fatal).length, [...new Set(l.map((x) => x.ano))].sort()];
  }).filter((r) => r[0] && r[2] > 0);
}

// ——— Por prédio ————————————————————————————————————————————————————————————————————————————————
const ex = criarExplorador(g);
const pacotes = {};
const resumo = {};
const corredores = camadas.ruidoCorredores.corredoresOnibus;
for (const area of PILOTO) {
  const ix = JSON.parse(readFileSync(join(RAIZ, `src/dados/recife/${dirIndice}/${area}.json`), "utf8"));
  const centro = new Map(ix.edificios.map((e) => [e.id, e.centro]));
  const luse = ix.rua.luse.filter((l) => l.vigente);
  const paradasUsadas = new Map();
  const refP = (p) => { if (!paradasUsadas.has(p)) paradasUsadas.set(p, paradasUsadas.size); return paradasUsadas.get(p); };
  const predios = {};
  const r = { predios: 0, comPontoNoturno: 0, semPontoNoturno: 0, comAlternativa: 0, travessiasMedianas: [], comViaPrincipalA80m: 0, comLuseVigenteA150m: 0 };
  for (const f of frentes) {
    if (f.area !== area || !(f.ligacao && (f.classe === "forte" || f.classe === "revisada"))) continue;
    r.predios += 1;
    const origens = f.ligacao.pontas.map((p) => ({ no: p.no, m: p.m + f.ligacao.metros }));
    const out = {};
    // Volta à noite.
    ex.explorar(origens, { limiteM: LIMITE_M });
    let melhor = null;
    for (const no of ex.tocados) for (const [p, m] of paradasPorNo.get(no) ?? []) { const d = ex.dist[no] + m; if (d <= LIMITE_M && (!melhor || d < melhor.d)) melhor = { p, no, d, mParada: m }; }
    if (melhor) {
      r.comPontoNoturno += 1;
      const ks = ex.caminhoAte(melhor.no).reverse();
      const ini = origemDe(ks, melhor.no);
      const nos = nosDoCaminho(ks, ini);
      const trav = travessias(ks, nos);
      r.travessiasMedianas.push(trav);
      // Alternativa: penaliza arestas que chegam a uma junção de via principal sem ser a via (75 m por ponta).
      const pen = (k) => { const e = g.arestas[k]; if (e.f & 8) return e.m; return e.m + 75 * ((juncaoPrincipal(e.a) ? 1 : 0) + (juncaoPrincipal(e.b) ? 1 : 0)); };
      const { dist, ant } = dijkstra(origens, pen, melhor.no, LIMITE_M * 3);
      let alt = null;
      if (dist.has(melhor.no)) {
        const ks2 = caminhoAte(ant, melhor.no), ini2 = origemDe(ks2, melhor.no), nos2 = nosDoCaminho(ks2, ini2);
        // Mesmo começo e fim que o caminho curto: ligação da entrada + arestas + ligação da parada.
        const m2 = ks2.reduce((s, k) => s + g.arestas[k].m, 0) + (origens.find((o) => o.no === ini2)?.m ?? 0) + melhor.mParada;
        const t2 = travessias(ks2, nos2);
        if (t2 < trav && m2 <= melhor.d * (1 + DESVIO) + 1e-6) { alt = { m: Math.round(Math.max(m2, melhor.d)), travessias: t2 }; r.comAlternativa += 1; }
      }
      out.v = { p: refP(melhor.p), m: Math.round(melhor.d), t: trav, alt, luz: luzDoCaminho(ks, nos), ruas: ruasDoCaminho(ks, nos) };
    } else r.semPontoNoturno += 1;
    // De que lado vem o barulho: via principal mais perto (≤ 80 m) e LUSE vigente (≤ 150 m).
    const c = centro.get(f.id) ?? f.entrada;
    if (c) {
      let via = null;
      const cx = Math.floor(c[0] / CEL), cy = Math.floor(c[1] / CEL);
      for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) for (const k of gradeArestas.get(`${x},${y}`) ?? []) {
        const e = g.arestas[k];
        if (!(e.f & 8)) continue;
        const q = projetar(c[0], c[1], g.lon[e.a], g.lat[e.a], g.lon[e.b], g.lat[e.b]);
        if (q.metros <= 80 && (!via || q.metros < via.m)) via = { m: q.metros, ponto: [q.lon, q.lat] };
      }
      if (via) {
        r.comViaPrincipalA80m += 1;
        const rua = ruaMaisProxima(via.ponto[0], via.ponto[1], 25);
        let partidas = 0;
        for (const [lo, la, n] of corredores) if (Math.abs(lo - via.ponto[0]) < 0.001 && Math.abs(la - via.ponto[1]) < 0.001 && distanciaM(lo, la, via.ponto[0], via.ponto[1]) <= 60) partidas = Math.max(partidas, n);
        out.r = { lado: direcao(rumo(c, via.ponto)), m: Math.round(via.m), rua: rua ? nomeDaRua.get(rua.codigo) ?? null : null, partidas: partidas || null };
      }
      let lu = null;
      for (const l of luse) { const d = distanciaM(c[0], c[1], l.centro[0], l.centro[1]); if (d <= 150 && (!lu || d < lu.m)) lu = { m: d, ponto: l.centro, desde: l.ultimaEntrada }; }
      if (lu) { r.comLuseVigenteA150m += 1; out.s = { lado: direcao(rumo(c, lu.ponto)), m: Math.round(lu.m), desde: lu.desde ?? null }; }
    }
    if (out.v || out.r || out.s) predios[f.id] = out;
  }
  const s = [...r.travessiasMedianas].sort((a, b) => a - b);
  r.travessiasMediana = s.length ? s[Math.floor(s.length / 2)] : null;
  delete r.travessiasMedianas;
  resumo[area] = r;
  pacotes[area] = { paradas: [...paradasUsadas.keys()].map((p) => ({ nome: grade.bruta.paradas.n[p], ultima: ultimaChegada.get(p) })), predios };
}

const versao = sha256(JSON.stringify({ formato: FORMATO, rede: rede.versao, transito: vTransito, indice: dirIndice, conteudo: sha256(JSON.stringify(pacotes)) })).slice(0, 16);
const pasta = join(RAIZ, "src/dados/recife/noite", versao);
mkdirSync(pasta, { recursive: true });
for (const a of PILOTO) {
  const texto = JSON.stringify({ versao, diaUtil: DIA_UTIL, fim156, inicio156, ...pacotes[a] });
  const arq = join(pasta, `${a}.json`);
  gravarImutavel(arq, texto);
}
const ts = `// Gerado por scripts/dados/noite/rodar-noite.mjs (VE08). Troca atômica depois de gravar as partições.\n` +
  `export const VERSAO_DA_NOITE = ${JSON.stringify(versao)};\n` +
  `export const ARQUIVOS_DA_NOITE: Record<string, string> = {\n${PILOTO.map((a) => `  ${JSON.stringify(a)}: ${JSON.stringify(`recife/noite/${versao}/${a}.json`)},`).join("\n")}\n};\n`;
const arqTs = join(RAIZ, "src/dados/recife/noiteGerado.ts");
writeFileSync(`${arqTs}.tmp`, ts); renameSync(`${arqTs}.tmp`, arqTs);
publicacaoDeCamadas.publicarCamadas(); // D036: os arquivos vão para public/dados e assets/dados, fora do bundle.

// Folha de observação (VE08.04): 2 voltas à noite e 1 lado de barulho por área, pela ordem do SHA-256.
const linhas = [["caso", "area", "predio", "tipo", "o_que_conferir", "quando", "OBS_data", "OBS_hora", "OBS_resultado", "OBS_nota"]];
let n = 0;
for (const a of PILOTO) {
  const ids = Object.keys(pacotes[a].predios).sort((x, y) => sha256(`VE08|${x}`).localeCompare(sha256(`VE08|${y}`)));
  const noite = ids.filter((i) => pacotes[a].predios[i].v).slice(0, 2), ruido = ids.filter((i) => pacotes[a].predios[i].r).slice(0, 1);
  for (const i of noite) { const v = pacotes[a].predios[i].v; linhas.push([`GN${String(++n).padStart(2, "0")}`, a, i, "volta_a_noite", `${pacotes[a].paradas[v.p].nome} → entrada: ${v.t} travessias estimadas; postes cadastrados ${v.luz[0]}; maior trecho sem poste ${v.luz[1]} m`, "dia útil, 22h–23h", "", "", "", ""]); }
  for (const i of ruido) { const r = pacotes[a].predios[i].r; linhas.push([`GN${String(++n).padStart(2, "0")}`, a, i, "lado_do_barulho", `lado ${r.lado} dá para ${r.rua ?? "via principal"} a ${r.m} m`, "dia útil, 17h–19h e domingo 10h", "", "", "", ""]); }
}
gravarFolha(join(RAIZ, "docs/aplicacao/evaluation-sets/g-noite-observacao.csv"), linhas.map((l) => l.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n");

const relatorio = { executadoEm: new Date().toISOString(), versao, rede: rede.versao, transito: vTransito, diaUtil: DIA_UTIL,
  paradasComChegadaNoturna: noturnas.size, paradasComChegadaDepoisDas2h: [...ultimaChegada].filter(([p, t]) => noturnas.has(p) && t > NOITE_FIM).length, postes: postes.length, pedidosLampadaApagada12m: pedidosRecentes.length, janela156: [inicio156, fim156], sinistros: sinistrosLidos,
  piloto: resumo, bytes: Object.fromEntries(PILOTO.map((a) => [a, JSON.stringify(pacotes[a]).length])), casosDeObservacao: linhas.length - 1, ms: Date.now() - t0, memoriaPicoMB: Math.round(process.resourceUsage().maxRSS / 1024) };
const out = arg("--relatorio");
if (out) writeFileSync(out, JSON.stringify(relatorio, null, 1) + "\n");
console.log(JSON.stringify(relatorio, null, 1));
