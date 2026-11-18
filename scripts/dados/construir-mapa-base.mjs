// Mapa-base por bairro (18/11/2026): quadras, lotes, ruas, água, praças, pontes e a divisa de cada bairro do Recife, das bases
// abertas da Prefeitura (dados.recife.pe.gov.br, dataset "Área urbana" e "Parques e Praças", ODbL), mais um arquivo da
// cidade inteira (divisas, água grande, avenidas). Contrato em memória: src/dados/recife/mapaBaseContrato.ts.
//
//   node --max-old-space-size=4096 scripts/dados/construir-mapa-base.mjs --bairros boa-viagem,torre
//   node --max-old-space-size=4096 scripts/dados/construir-mapa-base.mjs --todos
//   opções:
//     --bairros a,b    só esses bairros. Recusado se tiraria bairros já publicados (liste-os também), salvo --substituir.
//     --todos          todos os bairros da base; sempre troca a versão inteira.
//     --substituir     com --bairros: publica só a lista dada, tirando os outros de propósito.
//     --saida <pasta>  grava a versão e o módulo em <pasta> (pasta/<sha>/*.json e pasta/mapaBaseGerado.ts), sem tocar no
//                      publicado e sem chamar publicar-camadas. Para experimentar e para testes.
//     --borda <m>      borda do recorte em metros (padrão 300). Só com --saida: a leitura publicada supõe 300 m.
//     --atualizar [a,b] relê os metadados no portal, baixa de novo o que mudou (last_modified ou tamanho) e recalcula o
//                      sha256; sem lista, todos os recursos (chaves de RECURSOS em mapa-base/fontes.mjs).
//     --relatorio <arquivo.json> (pesos por arquivo e por seção, tempo e memória)
//
// Brutos em .cache/dados-recife/mapa-base/ (fora do git), reaproveitados. Saída: src/dados/recife/mapa-base/<sha>/
// <bairro>.json e cidade.json, e o módulo src/dados/recife/mapaBaseGerado.ts. Ordem de gravação: arquivos da versão nova,
// depois o módulo (troca atômica), depois publicar-camadas, por último a pasta da versão anterior.
//
// Lista branca: só geometria, pavimentos, a marca "prédio do índice", nome/código/tipo de rua, nome e tipo de água e
// praça, nome do bairro. DSQFL (e DSQ) servem só dentro do pipeline, para ligar lote ao índice; nunca vão para o arquivo.
// Nada de data de geração nem caminho absoluto: duas execuções com os mesmos brutos e o mesmo índice dão os mesmos bytes.
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { gzipSync } from "node:zlib";
import publicacaoDeCamadas from "./publicar-camadas.cjs";
import { gravarImutavel } from "./imutavel.mjs";
import { compararTexto, decidirBairros, textoDoModulo } from "./mapa-base/decisao.mjs";
import { garantirFontes } from "./mapa-base/fontes.mjs";
import {
  alargar, areaM2, caixaDe, caixasTocam, degenerado, dentroDoPoligono, limparAnel, pontoInterior, recortarAnel, regiao, simplificar,
} from "./mapa-base/geometria.mjs";
import { VERSAO, escreverLinhas, escreverPoligonos, poligonoQuantizado, projetor, quantizar } from "./mapa-base/codificar.mjs";

const RAIZ = process.cwd();
const BRUTOS = join(RAIZ, ".cache/dados-recife/mapa-base");
const MODULO_PUBLICADO = join(RAIZ, "src/dados/recife/mapaBaseGerado.ts");
const t0 = Date.now();
const arg = (n) => { const i = process.argv.indexOf(n); const v = i >= 0 ? process.argv[i + 1] : null; return v && !v.startsWith("--") ? v : null; };
const tem = (n) => process.argv.includes(n);

const SAIDA_PROPRIA = arg("--saida") ? resolve(RAIZ, arg("--saida")) : null;
if (tem("--saida") && !SAIDA_PROPRIA) throw new Error("--saida pede uma pasta");
const SAIDA = SAIDA_PROPRIA ?? join(RAIZ, "src/dados/recife/mapa-base");
const MODULO = SAIDA_PROPRIA ? join(SAIDA_PROPRIA, "mapaBaseGerado.ts") : MODULO_PUBLICADO;
const ATUALIZAR = tem("--atualizar") ? (arg("--atualizar") ? arg("--atualizar").split(",").map((x) => x.trim()) : true) : false;

/** Tolerâncias de Douglas-Peucker (m). A cidade usa outras, mais grossas. */
const TOL = { lote: 0.5, quadra: 0.5, agua: 0.5, praca: 0.5, ponte: 0.5, divisa: 0.5, rua: 1 };
const TOL_CIDADE = { divisa: 2, agua: 3, via: 3 };
const BORDA_M = arg("--borda") ? Number(arg("--borda")) : 300;
if (!(BORDA_M > 0 && BORDA_M <= 1000)) throw new Error("--borda fora de 1..1000 m");
if (BORDA_M !== 300 && !SAIDA_PROPRIA) throw new Error("--borda diferente de 300 só com --saida: a leitura publicada supõe 300 m.");
/** Ruas: trecho entra se uma ponta está a até BORDA_M + FOLGA_RUA_M do bairro. */
const FOLGA_RUA_M = 60;
/** Água maior que isto (em área de caixa, vezes a caixa do recorte) é cortada à caixa do recorte. */
const AGUA_GRANDE = 4;
/** Na cidade: água com área de pelo menos isto (m²), ou oceano. */
const AGUA_DA_CIDADE_M2 = 30_000;
const PAVIMENTOS_MAX = 80;

const slugDe = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

// ——— Entradas ———————————————————————————————————————————————————————————————————————————————————
const fontes = await garantirFontes(BRUTOS, { atualizar: ATUALIZAR });
const lerGeo = (k) => JSON.parse(readFileSync(fontes[k].caminho, "utf8")).features;

/** GeoJSON (Multi)Polygon → lista de polígonos, cada um lista de anéis limpos. */
function poligonosDe(geo) {
  if (!geo) return [];
  const ps = geo.type === "Polygon" ? [geo.coordinates] : geo.type === "MultiPolygon" ? geo.coordinates : [];
  return ps.map((p) => p.map(limparAnel));
}
/** Simplifica cada anel uma vez (plano da cidade); contorno degenerado derruba o polígono, furo degenerado sai. */
function simplificarPoligonos(polis, tol) {
  const saida = [];
  for (const p of polis) {
    const aneis = [];
    for (let i = 0; i < p.length; i++) {
      const a = simplificar(p[i], tol, true);
      if (degenerado(a)) { if (i === 0) break; continue; }
      aneis.push(a);
    }
    if (aneis.length) saida.push(aneis);
  }
  return saida;
}

// Bairros: slug pelo nome curto (EBAIRRNOME) ou pelo oficial, sempre um slug de src/dados/recife/bairros.ts.
const SLUGS = new Set([...readFileSync(join(RAIZ, "src/dados/recife/bairros.ts"), "utf8").matchAll(/slug: "([a-z0-9-]+)"/g)].map((m) => m[1]));
const bairros = lerGeo("bairros").map((f) => {
  const p = f.properties;
  const slug = [slugDe(p.EBAIRRNOME), slugDe(p.EBAIRRNOMEOF)].find((s) => SLUGS.has(s));
  if (!slug) throw new Error(`Bairro sem slug em bairros.ts: ${p.EBAIRRNOMEOF}`);
  const bruto = poligonosDe(f.geometry);
  return { slug, nome: p.EBAIRRNOMEOF, bruto, caixa: caixaDe(bruto.flat()), divisa: simplificarPoligonos(bruto, TOL.divisa), cidade: simplificarPoligonos(bruto, TOL_CIDADE.divisa) };
}).sort((a, b) => compararTexto(a.slug, b.slug));
if (new Set(bairros.map((b) => b.slug)).size !== bairros.length) throw new Error("Slug de bairro repetido");
const porSlug = new Map(bairros.map((b) => [b.slug, b]));

// O que já está publicado (para recusar uma lista que tiraria bairros sem --substituir).
const publicados = existsSync(MODULO_PUBLICADO)
  ? [...(/ARQUIVOS_DO_MAPA_BASE[^{]*\{([^}]*)\}/.exec(readFileSync(MODULO_PUBLICADO, "utf8"))?.[1] ?? "").matchAll(/"([a-z0-9-]+)":/g)].map((m) => m[1])
  : [];
const pedidos = decidirBairros({
  todos: tem("--todos"),
  pedidos: (arg("--bairros") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  substituir: tem("--substituir"),
  saida: Boolean(SAIDA_PROPRIA),
  publicados,
  conhecidos: bairros.map((b) => b.slug),
});

// Quadras: cada parte de MultiPolygon é uma quadra.
const quadras = [];
for (const f of lerGeo("quadras")) for (const aneis of simplificarPoligonos(poligonosDe(f.geometry), TOL.quadra)) quadras.push({ aneis, caixa: caixaDe([aneis[0]]) });

// Ruas: uma feição por logradouro na base (uma entrada por CLOGRACODI); sem nome não entra (não há o que rotular).
const ruasPorCodigo = new Map();
let ruasSemNome = 0;
for (const f of lerGeo("ruas")) {
  const p = f.properties;
  const nomeBruto = String(p.NLGPAVRESU ?? "").trim();
  if (!nomeBruto || !f.geometry) { ruasSemNome++; continue; }
  // Única normalização: "Av Fulano" → "Av. Fulano". O resto do nome fica como a base publica.
  const nome = nomeBruto.replace(/^Av (?=\S)/, "Av. ");
  // 23 trechos da base de 2026 trazem o código com ruído de ponto flutuante (700398.0000000001): arredonda só quando a
  // diferença para o inteiro é desprezível; qualquer outro valor não inteiro fica sem código.
  const c = p.CLOGRACODI;
  const codigo = typeof c === "number" && Math.abs(c - Math.round(c)) < 1e-6 ? Math.round(c) : null;
  const linhas = (f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates).map((l) => simplificar(limparAnel(l), TOL.rua, false)).filter((l) => l.length >= 2);
  if (!linhas.length) continue;
  const chave = codigo ?? `nome:${nome}`;
  const atual = ruasPorCodigo.get(chave);
  const rua = atual ?? { nome, codigo, avenida: /^Av\. /.test(nome), corredor: false, perimetral: false, linhas: [] };
  rua.corredor ||= Boolean(p.CT);
  rua.perimetral ||= Boolean(p.NMPERIMETR);
  rua.linhas.push(...linhas);
  ruasPorCodigo.set(chave, rua);
}
const ruas = [...ruasPorCodigo.values()].map((r) => ({ ...r, caixa: caixaDe(r.linhas) }));

// Água (Recursos Hídricos). Tipo pelo nome publicado (CDTPRHIDRC e CDRECHIDRIC vêm vazios na base de 2026):
// OCEANO → oceano; RIO, RIACHO, BRAÇO (de rio) → rio; CANAL → canal; AÇUDE, LAGOA, LAGÃO → lago; o resto (ALAGADO,
// BACIA PORTUÁRIA, sem nome…) → outro.
function tipoDeAgua(nome) {
  const n = slugDe(nome);
  if (/^oceano\b/.test(n)) return "oceano";
  if (/^(rio|riacho|braco)\b/.test(n)) return "rio";
  if (/^canal\b/.test(n)) return "canal";
  if (/^(acude|lagoa|lagao)\b/.test(n)) return "lago";
  return "outro";
}
const agua = [];
for (const f of lerGeo("agua")) {
  const nome = String(f.properties.NMRECHIDRIC ?? "").trim() || null;
  const tipo = tipoDeAgua(nome);
  const bruto = poligonosDe(f.geometry);
  for (const aneis of simplificarPoligonos(bruto, TOL.agua)) agua.push({ nome, tipo, aneis, caixa: caixaDe([aneis[0]]), area: Math.abs(areaM2(aneis[0])) });
}

// Praças e parques: tipo PARQUE → parque; PRAÇA, PRACA e AREA VERDE → praca. Nome oficial, senão o nome popular.
const pracas = [];
for (const f of lerGeo("pracas")) {
  const p = f.properties;
  const nome = String(p.NMNOMEOFIC ?? p.NMNOME ?? "").trim() || null;
  const tipo = slugDe(p.CDTIPO) === "parque" ? "parque" : "praca";
  for (const aneis of simplificarPoligonos(poligonosDe(f.geometry), TOL.praca)) pracas.push({ nome, tipo, aneis, caixa: caixaDe([aneis[0]]) });
}

// Pontes do Recife: só a geometria (a base não traz nome; os campos de cadastro, como CREATED_USER e LAST_EDITED_USER,
// nunca são lidos). Cada parte de MultiPolygon é um tabuleiro.
const pontes = [];
for (const f of lerGeo("pontes")) for (const aneis of simplificarPoligonos(poligonosDe(f.geometry), TOL.ponte)) pontes.push({ aneis, caixa: caixaDe([aneis[0]]) });

// Lotes, em fluxo (137 MB, uma feição por linha). Guarda só a forma simplificada, os pavimentos e o DSQFL (interno).
const lotes = [];
const lidos = { feicoes: 0, semGeometria: 0, partesDegeneradas: 0, pavimentosZeroOuVazio: 0, pavimentosAbsurdos: 0 };
{
  const rl = createInterface({ input: createReadStream(fontes.lotes.caminho), crlfDelay: Infinity });
  for await (const linha of rl) {
    if (!linha.startsWith('{ "type": "Feature"')) continue;
    const f = JSON.parse(linha.replace(/,\s*$/, ""));
    lidos.feicoes++;
    if (!f.geometry) { lidos.semGeometria++; continue; }
    const pv = f.properties.QTDPAVIMENTOS;
    let pavimentos = null;
    if (Number.isInteger(pv) && pv > 0 && pv <= PAVIMENTOS_MAX) pavimentos = pv;
    else if (pv === null || pv === 0 || pv === undefined) lidos.pavimentosZeroOuVazio++;
    else lidos.pavimentosAbsurdos++;
    const dsqfl = f.properties.DSQFL ? String(f.properties.DSQFL) : null;
    const brutos = poligonosDe(f.geometry);
    const partes = simplificarPoligonos(brutos, TOL.lote);
    lidos.partesDegeneradas += brutos.length - partes.length;
    for (const aneis of partes) lotes.push({ dsqfl, pavimentos, aneis, caixa: caixaDe([aneis[0]]), noIndice: false, quadra: -1 });
  }
}

// ——— Grade espacial (graus) ———————————————————————————————————————————————————————————————————————
const CEL = 0.002;
function grade(itens) {
  const m = new Map();
  itens.forEach((it, i) => {
    const c = it.caixa;
    for (let x = Math.floor(c[0] / CEL); x <= Math.floor(c[2] / CEL); x++) for (let y = Math.floor(c[1] / CEL); y <= Math.floor(c[3] / CEL); y++) {
      const k = `${x},${y}`;
      let l = m.get(k);
      if (!l) m.set(k, (l = []));
      l.push(i);
    }
  });
  return {
    noPonto(lon, lat) { return m.get(`${Math.floor(lon / CEL)},${Math.floor(lat / CEL)}`) ?? []; },
    naCaixa(c) {
      const s = new Set();
      for (let x = Math.floor(c[0] / CEL); x <= Math.floor(c[2] / CEL); x++) for (let y = Math.floor(c[1] / CEL); y <= Math.floor(c[3] / CEL); y++) for (const i of m.get(`${x},${y}`) ?? []) s.add(i);
      return [...s].sort((a, b) => a - b);
    },
  };
}
const gradeQuadras = grade(quadras);
const gradeLotes = grade(lotes);

// Ligação lote → quadra pela geometria: a quadra que contém um ponto interior do lote (o código QUADRA da base não serve:
// 18% apontam para quadra que não existe mais e há códigos duplicados).
const ligacao = { comQuadra: 0, semQuadra: 0 };
for (const l of lotes) {
  const [x, y] = pontoInterior(l.aneis);
  l.interior = [x, y];
  l.quadraGlobal = -1;
  for (const qi of gradeQuadras.noPonto(x, y)) {
    const q = quadras[qi];
    if (x < q.caixa[0] || x > q.caixa[2] || y < q.caixa[1] || y > q.caixa[3]) continue;
    if (dentroDoPoligono(x, y, q.aneis)) { l.quadraGlobal = qi; break; }
  }
  if (l.quadraGlobal >= 0) ligacao.comQuadra++; else ligacao.semQuadra++;
}

// Prédios do índice ativo: pelo DSQFL; sem DSQFL (ou DSQFL que não está na base de Lotes), pelo lote que contém o centro.
const pub = readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8");
const DIRETORIO_DO_INDICE = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
const arquivosDoIndice = [...pub.matchAll(/"([a-z0-9-]+)": "(recife\/indice-municipal\/[0-9a-f]+\/[a-z0-9-]+\.json)"/g)].map((m) => m[2]).sort();
const lotesPorDsqfl = new Map();
lotes.forEach((l, i) => { if (l.dsqfl) { const a = lotesPorDsqfl.get(l.dsqfl) ?? []; a.push(i); lotesPorDsqfl.set(l.dsqfl, a); } });
const loteNoPonto = (lon, lat) => gradeLotes.noPonto(lon, lat).filter((i) => dentroDoPoligono(lon, lat, lotes[i].aneis));
const cruzamento = { edificios: 0, peloDsqfl: 0, peloCentro: 0, semLote: 0, pavimentosDiferentes: 0 };
for (const c of arquivosDoIndice) {
  const ix = JSON.parse(readFileSync(join(RAIZ, "src/dados", c), "utf8"));
  for (const e of ix.edificios) {
    cruzamento.edificios++;
    let alvo = [];
    const candidatos = e.dsqfl ? lotesPorDsqfl.get(String(e.dsqfl)) ?? [] : [];
    if (candidatos.length === 1) alvo = candidatos;
    else if (candidatos.length > 1) {
      // DSQFL repetido na base: fica a parte que contém o centro; se nenhuma, todas as partes com esse DSQFL.
      const comCentro = e.centro ? candidatos.filter((i) => dentroDoPoligono(e.centro[0], e.centro[1], lotes[i].aneis)) : [];
      alvo = comCentro.length ? comCentro : candidatos;
    }
    if (alvo.length) cruzamento.peloDsqfl++;
    else if (e.centro) { alvo = loteNoPonto(e.centro[0], e.centro[1]); if (alvo.length) cruzamento.peloCentro++; }
    if (!alvo.length) { cruzamento.semLote++; continue; }
    for (const i of alvo) {
      lotes[i].noIndice = true;
      if (lotes[i].pavimentos !== (e.pavimentos ?? null)) cruzamento.pavimentosDiferentes++;
    }
  }
}

// ——— Recorte por bairro ———————————————————————————————————————————————————————————————————————————
/**
 * A feição toca a região: um vértice dentro ou perto, ou uma aresta que passa perto (segmento a segmento: uma aresta
 * longa que atravessa a faixa sem vértice nela também conta); ou, se for grande, um vértice do bairro dentro dela.
 */
function tocaRegiao(reg, b, item, aneis) {
  if (!caixasTocam(item.caixa, reg.caixa)) return false;
  for (const a of aneis) if (reg.tocaLinha(a, true)) return true;
  const c = item.caixa;
  if (c[2] - c[0] > 0.005 || c[3] - c[1] > 0.005) {
    for (const poli of b.divisa) for (const p of poli[0]) if (dentroDoPoligono(p[0], p[1], aneis)) return true;
  }
  return false;
}
const chaveEspacial = (p) => [Math.floor(p[1] / 1000), p[0]];
const porChave = (a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1];

function gerarBairro(b) {
  const reg = regiao(b.divisa, BORDA_M);
  const regRua = regiao(b.divisa, BORDA_M + FOLGA_RUA_M);
  const origem = [Number(((b.caixa[0] + b.caixa[2]) / 2).toFixed(6)), Number(((b.caixa[1] + b.caixa[3]) / 2).toFixed(6))];
  const proj = projetor(origem);

  // Lotes que tocam; as quadras que tocam mais as que contêm esses lotes.
  const idsLotes = gradeLotes.naCaixa(reg.caixa).filter((i) => tocaRegiao(reg, b, lotes[i], lotes[i].aneis));
  const idsQuadras = new Set(gradeQuadras.naCaixa(reg.caixa).filter((i) => tocaRegiao(reg, b, quadras[i], quadras[i].aneis)));
  for (const i of idsLotes) if (lotes[i].quadraGlobal >= 0) idsQuadras.add(lotes[i].quadraGlobal);

  const qs = [];
  for (const i of idsQuadras) { const g = poligonoQuantizado(quadras[i].aneis, proj); if (g) qs.push({ i, g, k: chaveEspacial(g[0][0]) }); }
  qs.sort(porChave);
  const posQuadra = new Map(qs.map((q, p) => [q.i, p]));

  const ls = [];
  for (const i of idsLotes) {
    const l = lotes[i];
    const g = poligonoQuantizado(l.aneis, proj);
    if (!g) continue;
    ls.push({ g, q: posQuadra.get(l.quadraGlobal) ?? -1, pav: l.pavimentos, ind: l.noIndice, k: chaveEspacial(g[0][0]) });
  }
  // Pela quadra (os lotes de -1 por último) e, dentro dela, pela posição: coluna `q` quase constante e cursor perto.
  ls.sort((a, b2) => (a.q < 0) - (b2.q < 0) || a.q - b2.q || porChave(a, b2));

  // Ruas: trechos com uma ponta a até 360 m do bairro; trechos seguidos viram uma linha.
  const rs = [];
  for (const r of ruas) {
    if (!caixasTocam(r.caixa, regRua.caixa)) continue;
    const linhas = [];
    for (const l of r.linhas) {
      const dentro = l.map((p) => regRua.toca(p[0], p[1]));
      let atual = null;
      for (let k = 1; k < l.length; k++) {
        if (dentro[k - 1] || dentro[k] || regRua.tocaSegmento(l[k - 1], l[k])) { if (!atual) { atual = [l[k - 1]]; linhas.push(atual); } atual.push(l[k]); } else atual = null;
      }
    }
    const qz = linhas.map((l) => quantizar(l, proj, false)).filter(Boolean);
    if (!qz.length) continue;
    rs.push({ r, g: qz, k: chaveEspacial(qz[0][0]) });
  }
  rs.sort((a, b2) => (a.r.codigo ?? 1e9) - (b2.r.codigo ?? 1e9) || compararTexto(a.r.nome, b2.r.nome));

  // Água: inteira, ou cortada à caixa do recorte quando muito maior que ela (o oceano, a bacia portuária).
  const caixaRec = alargar(reg.caixa, 100);
  const areaCaixa = (c) => (c[2] - c[0]) * (c[3] - c[1]);
  const as = [];
  for (const w of agua) {
    if (!tocaRegiao(reg, b, w, w.aneis)) continue;
    let aneis = w.aneis;
    if (areaCaixa(w.caixa) > AGUA_GRANDE * areaCaixa(caixaRec)) {
      const c = recortarAnel(aneis[0], caixaRec);
      if (degenerado(c)) continue;
      aneis = [c, ...aneis.slice(1).map((f) => recortarAnel(f, caixaRec)).filter((f) => !degenerado(f))];
    }
    const g = poligonoQuantizado(aneis, proj);
    if (g) as.push({ w, g, k: chaveEspacial(g[0][0]) });
  }
  as.sort(porChave);

  const ps = [];
  for (const p of pracas) {
    if (!tocaRegiao(reg, b, p, p.aneis)) continue;
    const g = poligonoQuantizado(p.aneis, proj);
    if (g) ps.push({ p, g, k: chaveEspacial(g[0][0]) });
  }
  ps.sort(porChave);

  const pts = [];
  for (const p of pontes) {
    if (!tocaRegiao(reg, b, p, p.aneis)) continue;
    const g = poligonoQuantizado(p.aneis, proj);
    if (g) pts.push({ g, k: chaveEspacial(g[0][0]) });
  }
  pts.sort(porChave);

  const divisa = b.divisa.map((p) => poligonoQuantizado(p, proj)).filter(Boolean);
  const conteudo = {
    versao: VERSAO,
    bairro: b.slug,
    origem,
    divisa: { slug: b.slug, nome: b.nome, g: escreverPoligonos(divisa) },
    quadras: { g: escreverPoligonos(qs.map((q) => q.g)) },
    lotes: {
      g: escreverPoligonos(ls.map((l) => l.g)),
      pavimentos: ls.map((l) => l.pav ?? 0),
      quadra: ls.map((l) => l.q),
      noIndice: ls.flatMap((l, i) => (l.ind ? [i] : [])),
    },
    ruas: {
      nome: rs.map((x) => x.r.nome),
      codigo: rs.map((x) => x.r.codigo),
      tipo: rs.map((x) => (x.r.avenida ? 1 : 0) | (x.r.corredor ? 2 : 0) | (x.r.perimetral ? 4 : 0)),
      g: escreverLinhas(rs.map((x) => x.g)),
    },
    agua: { nome: as.map((x) => x.w.nome), tipo: as.map((x) => x.w.tipo), g: escreverPoligonos(as.map((x) => x.g)) },
    pracas: { nome: ps.map((x) => x.p.nome), tipo: ps.map((x) => x.p.tipo), g: escreverPoligonos(ps.map((x) => x.g)) },
    pontes: { g: escreverPoligonos(pts.map((x) => x.g)) },
  };
  return { conteudo, contagem: { quadras: qs.length, lotes: ls.length, lotesNoIndice: conteudo.lotes.noIndice.length, ruas: rs.length, agua: as.length, pracas: ps.length, pontes: pts.length } };
}

function gerarCidade() {
  const todas = bairros.flatMap((b) => b.bruto.flat());
  const c = caixaDe(todas);
  const origem = [Number(((c[0] + c[2]) / 2).toFixed(6)), Number(((c[1] + c[3]) / 2).toFixed(6))];
  const proj = projetor(origem);
  const caixaCidade = alargar(c, 1000);
  const divisas = bairros.map((b) => ({ slug: b.slug, nome: b.nome, g: escreverPoligonos(b.cidade.map((p) => poligonoQuantizado(p, proj)).filter(Boolean)) }));
  const as = [];
  for (const w of agua) {
    if (w.tipo !== "oceano" && w.area < AGUA_DA_CIDADE_M2) continue;
    if (!caixasTocam(w.caixa, caixaCidade)) continue;
    let aneis = w.aneis.map((a) => simplificar(a, TOL_CIDADE.agua, true)).filter((a, i) => i === 0 || !degenerado(a));
    if (degenerado(aneis[0])) continue;
    if (w.tipo === "oceano") aneis = [recortarAnel(aneis[0], caixaCidade), ...aneis.slice(1)];
    const g = poligonoQuantizado(aneis, proj);
    if (g) as.push({ w, g, k: chaveEspacial(g[0][0]) });
  }
  as.sort(porChave);
  const vs = [];
  for (const r of ruas) {
    if (!(r.avenida || r.corredor || r.perimetral)) continue;
    const g = r.linhas.map((l) => quantizar(simplificar(l, TOL_CIDADE.via, false), proj, false)).filter(Boolean);
    if (g.length) vs.push({ r, g });
  }
  vs.sort((a, b) => (a.r.codigo ?? 1e9) - (b.r.codigo ?? 1e9) || compararTexto(a.r.nome, b.r.nome));
  const conteudo = {
    versao: VERSAO,
    origem,
    bairros: divisas,
    agua: { nome: as.map((x) => x.w.nome), tipo: as.map((x) => x.w.tipo), g: escreverPoligonos(as.map((x) => x.g)) },
    vias: {
      nome: vs.map((x) => x.r.nome),
      codigo: vs.map((x) => x.r.codigo),
      tipo: vs.map((x) => (x.r.avenida ? 1 : 0) | (x.r.corredor ? 2 : 0) | (x.r.perimetral ? 4 : 0)),
      g: escreverLinhas(vs.map((x) => x.g)),
    },
  };
  return { conteudo, contagem: { bairros: divisas.length, agua: as.length, vias: vs.length } };
}

// ——— Gravação ———————————————————————————————————————————————————————————————————————————————————
const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length;
const textos = new Map();
const relatorio = { bairros: {}, cidade: null };
for (const slug of pedidos) {
  const { conteudo, contagem } = gerarBairro(porSlug.get(slug));
  const texto = JSON.stringify(conteudo);
  textos.set(`${slug}.json`, texto);
  const secoes = Object.fromEntries(["divisa", "quadras", "lotes", "ruas", "agua", "pracas", "pontes"].map((s) => { const t = JSON.stringify(conteudo[s]); return [s, { bytes: t.length, gzip: gz(t) }]; }));
  relatorio.bairros[slug] = { bytes: Buffer.byteLength(texto), gzip: gz(texto), contagem, secoes };
}
{
  const { conteudo, contagem } = gerarCidade();
  const texto = JSON.stringify(conteudo);
  textos.set("cidade.json", texto);
  const secoes = Object.fromEntries(["bairros", "agua", "vias"].map((s) => { const t = JSON.stringify(conteudo[s]); return [s, { bytes: t.length, gzip: gz(t) }]; }));
  relatorio.cidade = { bytes: Buffer.byteLength(texto), gzip: gz(texto), contagem, secoes };
}

const listaFontes = [
  ["bairros", "Bairros do Recife"], ["quadras", "Quadras"], ["lotes", "Lotes"], ["ruas", "Trechos de Logradouros"],
  ["agua", "Recursos Hídricos"], ["pracas", "Parques e Praças"], ["pontes", "Pontes do Recife"],
].map(([k]) => fontes[k].fonte);
const nomes = [...textos.keys()].sort(compararTexto);
const versao = sha256(JSON.stringify({ formato: VERSAO, indice: DIRETORIO_DO_INDICE, fontes: listaFontes.map((f) => f.sha256), arquivos: nomes.map((n) => [n, sha256(textos.get(n))]) })).slice(0, 16);
const pasta = join(SAIDA, versao);
mkdirSync(pasta, { recursive: true });
for (const n of nomes) gravarImutavel(join(pasta, n), textos.get(n));

const ts = textoDoModulo({ versao, indice: DIRETORIO_DO_INDICE, bairros: pedidos, caixas: Object.fromEntries(pedidos.map((x) => [x, porSlug.get(x).caixa])), fontes: listaFontes });
writeFileSync(`${MODULO}.tmp`, ts);
renameSync(`${MODULO}.tmp`, MODULO);
// Com --saida, nada do publicado é tocado: nem publicar-camadas, nem as versões antigas.
const registrado = !SAIDA_PROPRIA && publicacaoDeCamadas.MODULOS_GERADOS.includes("recife/mapaBaseGerado.ts");
if (registrado) publicacaoDeCamadas.publicarCamadas();
// Por último, as versões anteriores (o módulo já não aponta para elas).
const removidas = [];
if (!SAIDA_PROPRIA) for (const d of readdirSync(SAIDA)) if (d !== versao && /^[0-9a-f]{16}$/.test(d)) { rmSync(join(SAIDA, d), { recursive: true }); removidas.push(d); }
if (registrado) publicacaoDeCamadas.publicarCamadas();

const TETO_GZIP = 250_000;
const AVISO_DO_TETO = 0.9;
const resumo = {
  versao, indice: DIRETORIO_DO_INDICE, bordaM: BORDA_M, saida: SAIDA_PROPRIA ? "propria" : "publicada", bairros: pedidos.length, lidos, ligacao, cruzamento, ruasSemNome, removidas,
  registradoEmPublicarCamadas: registrado,
  totalBytes: [...textos.values()].reduce((s, t) => s + Buffer.byteLength(t), 0),
  totalGzip: Object.values(relatorio.bairros).reduce((s, r) => s + r.gzip, 0) + relatorio.cidade.gzip,
  maiorGzip: Object.entries(relatorio.bairros).sort((a, b) => b[1].gzip - a[1].gzip).slice(0, 5).map(([s, r]) => [s, r.gzip]),
  acimaDoTeto: Object.entries(relatorio.bairros).filter(([, r]) => r.gzip > TETO_GZIP).map(([s, r]) => [s, r.gzip]),
  // Aviso (não falha): arquivos acima de 90% do teto, que a próxima atualização da base pode empurrar para cima dele.
  pertoDoTeto: Object.entries(relatorio.bairros).filter(([, r]) => r.gzip > TETO_GZIP * AVISO_DO_TETO && r.gzip <= TETO_GZIP).map(([s, r]) => [s, r.gzip, TETO_GZIP - r.gzip]),
  ms: Date.now() - t0, memoriaPicoMB: Math.round(process.resourceUsage().maxRSS / 1024),
  sha256: { ...Object.fromEntries(nomes.map((n) => [n, sha256(textos.get(n))])), "mapaBaseGerado.ts": sha256(ts) },
};
const saidaRel = arg("--relatorio");
if (saidaRel) writeFileSync(saidaRel, JSON.stringify({ ...resumo, ...relatorio }, null, 1) + "\n");
if (!existsSync(MODULO)) throw new Error("módulo gerado ausente");
console.log(JSON.stringify({ ...resumo, sha256: undefined, arquivos: nomes.length }));
for (const [s, g, falta] of resumo.pertoDoTeto) console.warn(`AVISO: ${s} tem ${g} bytes gzip, acima de ${AVISO_DO_TETO * 100}% do teto de ${TETO_GZIP} (faltam ${falta} bytes).`);
