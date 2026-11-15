// Atrito e conveniência em volta do prédio (15/11/2026), do CNEFE do Censo 2022 (IBGE), por prédio do índice ativo.
//
//   node scripts/dados/atrito/rodar-atrito.mjs [--relatorio <arquivo.json>]
//
// Fonte: o CSV oficial do Recife (.cache/dados-recife/cnefe-completo/2611606_RECIFE.zip, baixado do FTP do IBGE em
// 15/11/2026; SHA-256 conferido abaixo). Lê só COD_ESPECIE, DSC_ESTABELECIMENTO, LATITUDE, LONGITUDE e NV_GEO_COORD.
// Nunca lê nem emite complemento (NOM_COMP_ELEM*/VAL_COMP_ELEM*), CEP, quadra ou face.
//
// O que sai, por prédio: quantos endereços de estabelecimento a até 150 m caem em cada categoria e a distância do mais
// perto (até 300 m), e quantos endereços estavam em construção a até 150 m. NUNCA o nome: a descrição do IBGE pode trazer
// o nome de uma pessoa (comércio de bairro, MEI). A descrição só serve para escolher a categoria, por palavra inteira.
// É um retrato do levantamento do Censo 2022: não diz se o lugar está aberto hoje, horário, nem barulho medido.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gravarImutavel } from "../imutavel.mjs";

const RAIZ = process.cwd();
const FORMATO = 1;
export const ZIP = ".cache/dados-recife/cnefe-completo/2611606_RECIFE.zip";
export const SHA_DO_ZIP = "db8987a56019df7aaa4a2793b4fc31c8b2a439ede5a6bea3661e069d208e75c6";
export const URL_DO_ZIP = "https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/Municipio/26_PE/2611606_RECIFE.zip";
export const RAIO_CONTAGEM_M = 150;
export const RAIO_MAIS_PERTO_M = 300;
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const COLUNAS_LIDAS = ["LATITUDE", "LONGITUDE", "NV_GEO_COORD", "COD_ESPECIE", "DSC_ESTABELECIMENTO"];
export const COLUNAS_NUNCA_LIDAS = /^(NOM_COMP_ELEM|VAL_COMP_ELEM|CEP$|NUM_QUADRA$|NUM_FACE$|COD_UNICO_ENDERECO$)/;

/**
 * Categoria pela descrição, por palavra inteira (sem acento, maiúsculas). Ordem importa: "BAR E RESTAURANTE" é noite;
 * "BARBEARIA" e "BARRACA" não são "BAR". Fica de fora o que não diz o tipo ("LOJA", "DEPOSITO", "VAGO", "ESCRITORIO").
 */
const REGRAS = [
  ["noite", ["BAR", "BARES", "BOTECO", "BOATE", "PUB", "CHOPERIA", "CHOPPERIA", "CHOPP", "CHOPE", "ADEGA", "BEBIDAS", "CONVENIENCIA", "ESPETINHO", "ESPETINHOS", "BALADA", "KARAOKE", "SINUCA", "CASA DE SHOW", "CASA DE SHOWS", "DRINKS", "CERVEJARIA"]],
  ["oficina", ["OFICINA", "BORRACHARIA", "MECANICA", "FUNILARIA", "RETIFICA", "SERRALHARIA", "SERRALHERIA", "MARCENARIA", "LAVA JATO", "LAVAJATO", "LAVA A JATO", "AUTOPECAS", "AUTO PECAS", "MOTOPECAS", "CAPOTARIA", "SOLDA", "AUTO CENTER", "AUTOCENTER", "ESTOFARIA", "FUNDICAO", "SERRARIA"]],
  ["mercado", ["SUPERMERCADO", "HIPERMERCADO", "ATACADO", "ATACAREJO", "ATACADAO", "MERCADO", "SUPERMERCADOS"]],
  ["dia", ["PADARIA", "PANIFICADORA", "FARMACIA", "DROGARIA", "MERCEARIA", "MERCADINHO", "MINIMERCADO", "MINI MERCADO", "QUITANDA", "HORTIFRUTI", "SACOLAO", "LANCHONETE", "RESTAURANTE", "PIZZARIA", "ACAI", "LAVANDERIA", "BARBEARIA", "SALAO", "ACADEMIA", "PET SHOP", "PETSHOP", "PAPELARIA", "BANCA", "FRUTARIA", "ACOUGUE", "PEIXARIA", "CAFE", "CAFETERIA", "SORVETERIA"]],
];
const normal = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const PADROES = REGRAS.map(([c, ps]) => [c, new RegExp(`(?:^| )(?:${ps.join("|")})(?: |$)`)]);
export function categoriaDoEstabelecimento(descricao) {
  const d = normal(descricao);
  if (!d) return null;
  for (const [c, re] of PADROES) if (re.test(d)) return c;
  return null;
}

/** CSV `;` do IBGE, sem aspas (conferido: ASCII, CRLF). Devolve só as colunas lidas, por nome. */
export function* linhasDoCnefe(texto) {
  const linhas = texto.split(/\r?\n/);
  const cab = linhas[0].split(";");
  const idx = Object.fromEntries(COLUNAS_LIDAS.map((c) => [c, cab.indexOf(c)]));
  for (const [c, i] of Object.entries(idx)) if (i < 0) throw new Error(`Coluna ausente no CNEFE: ${c}`);
  for (let k = 1; k < linhas.length; k++) {
    const l = linhas[k];
    if (!l) continue;
    const p = l.split(";");
    yield { lat: Number(p[idx.LATITUDE]), lon: Number(p[idx.LONGITUDE]), nivel: Number(p[idx.NV_GEO_COORD]), especie: Number(p[idx.COD_ESPECIE]), descricao: p[idx.DSC_ESTABELECIMENTO] ?? "" };
  }
}

/** Pontos limpos: espécie 6 com categoria, espécie 7 (em construção); coordenada original ou ajustada (níveis 1 e 2). */
export function pontosDoCnefe(linhas) {
  const pontos = [];
  const vistos = new Set();
  const rel = { lidas: 0, especie6: 0, especie7: 0, semCategoria: 0, nivelAproximado: 0, foraDoRecife: 0, repetidos: 0, porCategoria: {} };
  for (const r of linhas) {
    rel.lidas++;
    if (r.especie !== 6 && r.especie !== 7) continue;
    rel[r.especie === 6 ? "especie6" : "especie7"]++;
    if (r.nivel !== 1 && r.nivel !== 2) { rel.nivelAproximado++; continue; }
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lon) || r.lat < -8.18 || r.lat > -7.9 || r.lon < -35.1 || r.lon > -34.8) { rel.foraDoRecife++; continue; }
    const cat = r.especie === 7 ? "obra" : categoriaDoEstabelecimento(r.descricao);
    if (!cat) { rel.semCategoria++; continue; }
    // A mesma descrição no mesmo ponto é o mesmo estabelecimento (várias portas/linhas); obra no mesmo ponto é a mesma obra
    // (um prédio em construção tem uma linha por unidade). A descrição não sai daqui.
    const chave = `${cat}|${r.lon.toFixed(5)}|${r.lat.toFixed(5)}|${r.especie === 6 ? normal(r.descricao) : ""}`;
    if (vistos.has(chave)) { rel.repetidos++; continue; }
    vistos.add(chave);
    rel.porCategoria[cat] = (rel.porCategoria[cat] ?? 0) + 1;
    pontos.push({ cat, lon: r.lon, lat: r.lat });
  }
  return { pontos, rel };
}

const R = 6371008.8, RAD = Math.PI / 180;
const distM = (lon1, lat1, lon2, lat2) => {
  const x = (lon2 - lon1) * RAD * Math.cos(((lat1 + lat2) / 2) * RAD), y = (lat2 - lat1) * RAD;
  return Math.hypot(x, y) * R;
};
/** Rumo do prédio até o ponto, em graus a partir do norte (sentido horário), arredondado a 5°. */
export const rumo = (lon1, lat1, lon2, lat2) => {
  const x = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * RAD), y = lat2 - lat1;
  return (Math.round(((Math.atan2(x, y) / RAD + 360) % 360) / 5) * 5) % 360;
};
const PASSO = 0.003;
export function indicePorGrade(pontos) {
  const g = new Map();
  for (const p of pontos) { const k = `${Math.floor(p.lon / PASSO)}|${Math.floor(p.lat / PASSO)}`; (g.get(k) ?? g.set(k, []).get(k)).push(p); }
  return g;
}
const r10 = (m) => Math.round(m / 10) * 10;

/**
 * Por prédio e categoria: [contagem a 150 m, metros até o mais perto (até 300 m), rumo do mais perto em graus]. Categoria
 * sem nada a até 300 m é omitida. O rumo serve para dizer de que lado do prédio fica (fachada de frente ou de costas).
 */
export function atritoDoPonto(lon, lat, grade) {
  const cx = Math.floor(lon / PASSO), cy = Math.floor(lat / PASSO);
  const acc = {};
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const p of grade.get(`${cx + dx}|${cy + dy}`) ?? []) {
    const d = distM(lon, lat, p.lon, p.lat);
    if (d > RAIO_MAIS_PERTO_M) continue;
    const a = (acc[p.cat] ??= { n: 0, m: Infinity, r: 0 });
    if (d <= RAIO_CONTAGEM_M) a.n++;
    if (d < a.m) { a.m = d; a.r = rumo(lon, lat, p.lon, p.lat); }
  }
  const out = {};
  const chave = { noite: "n", oficina: "o", mercado: "m", dia: "d", obra: "k" };
  for (const [cat, a] of Object.entries(acc)) out[chave[cat]] = [a.n, r10(a.m), a.r];
  return out;
}

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

function main() {
  if (!existsSync(join(RAIZ, ZIP))) throw new Error(`${ZIP} ausente: baixe ${URL_DO_ZIP} para essa pasta.`);
  const zip = readFileSync(join(RAIZ, ZIP));
  const sha = sha256(zip);
  if (sha !== SHA_DO_ZIP) throw new Error(`SHA-256 do CNEFE mudou (${sha}). Confira o arquivo e atualize SHA_DO_ZIP de propósito.`);
  const texto = execFileSync("unzip", ["-p", join(RAIZ, ZIP), "2611606_RECIFE.csv"], { maxBuffer: 400 * 1024 * 1024 }).toString("latin1");
  const { pontos, rel } = pontosDoCnefe(linhasDoCnefe(texto));
  const grade = indicePorGrade(pontos);
  const { dir, porBairro } = edificiosAtivos();
  const codigo = sha256(readFileSync(new URL(import.meta.url), "utf8"));
  const versao = sha256(JSON.stringify({ FORMATO, codigo, sha, indice: dir })).slice(0, 16);
  const pasta = join(RAIZ, "src/dados/recife/atrito", versao);
  mkdirSync(pasta, { recursive: true });
  const arquivos = {}, resumo = {};
  for (const [bairro, eds] of Object.entries(porBairro)) {
    const predios = {};
    for (const e of [...eds].sort((a, b) => (a.id < b.id ? -1 : 1))) predios[e.id] = atritoDoPonto(e.lon, e.lat, grade);
    const t = JSON.stringify({ versao, raioM: RAIO_CONTAGEM_M, maisPertoAteM: RAIO_MAIS_PERTO_M, predios });
    gravarImutavel(join(pasta, `${bairro}.json`), t);
    arquivos[bairro] = `recife/atrito/${versao}/${bairro}.json`;
    const v = Object.values(predios);
    resumo[bairro] = { predios: v.length, bytes: Buffer.byteLength(t), comNoiteA150m: v.filter((x) => x.n?.[0] > 0).length, comObraA150m: v.filter((x) => x.k?.[0] > 0).length };
  }
  const ts = "// Gerado por scripts/dados/atrito/rodar-atrito.mjs (15/11/2026). Troca atômica depois de gravar as partições.\n" +
    "// CNEFE do Censo 2022 (IBGE): só categorias e contagens; nunca nome, complemento ou CEP.\n" +
    `export const VERSAO_DO_ATRITO = ${JSON.stringify(versao)};\n` +
    `export const INDICE_DO_ATRITO = ${JSON.stringify(dir)};\n` +
    `export const ARQUIVOS_DO_ATRITO: Record<string, string> = {\n${Object.entries(arquivos).map(([b, c]) => `  ${JSON.stringify(b)}: ${JSON.stringify(c)},`).join("\n")}\n};\n` +
    `export const FONTE_DO_ATRITO = ${JSON.stringify({ nome: "CNEFE, Censo Demográfico 2022 (IBGE)", url: URL_DO_ZIP, sha256: sha, arquivoModificadoEm: "2024-05-17", levantamento: "2022", licenca: "Citar o IBGE" }, null, 1)} as const;\n`;
  const arqTs = join(RAIZ, "src/dados/recife/atritoGerado.ts");
  writeFileSync(`${arqTs}.tmp`, ts); renameSync(`${arqTs}.tmp`, arqTs);
  const relatorio = { executadoEm: new Date().toISOString(), versao, indice: dir, sha256: sha, fonte: rel, bairros: Object.keys(arquivos).length,
    predios: Object.values(resumo).reduce((s, r) => s + r.predios, 0), maiorArquivo: Math.max(...Object.values(resumo).map((r) => r.bytes)),
    pilotos: Object.fromEntries(["boa-viagem", "gracas", "espinheiro", "madalena", "casa-forte", "aflitos"].map((b) => [b, resumo[b]])) };
  const out = arg("--relatorio");
  if (out) writeFileSync(out, JSON.stringify(relatorio, null, 1) + "\n");
  console.log(JSON.stringify(relatorio, null, 1));
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) main();
