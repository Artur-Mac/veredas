#!/usr/bin/env node
/**
 * Gera src/dados/recife/populacao-bairros.json: população residente por bairro do Recife no Censo Demográfico 2022
 * (IBGE, Agregados por Bairros, arquivo "básico"). Serve de denominador para a taxa de ocorrências por 1.000
 * moradores do cartão "Segurança no bairro".
 *
 * Uso: node scripts/dados/populacao-bairros-recife.mjs
 *
 * - Variável V0001 (Total de pessoas), conferida no dicionário de dados dos agregados por setores censitários.
 * - O CSV do IBGE vem em ISO-8859-1; o nome do bairro é casado com a lista oficial de src/dados/recife/bairros.ts
 *   (94 bairros). Bairro que não casar interrompe a geração: nada é adivinhado.
 * - ZIP em .cache/dados-recife/ (fora do git); com o cache, a reexecução não usa a rede.
 * - Node >= 20, sem dependências (o ZIP é lido com zlib).
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR_CACHE = path.join(RAIZ, ".cache", "dados-recife");
const ARQUIVO_ZIP = path.join(DIR_CACHE, "ibge-censo-2022-basico-bairros.zip");
const ARQUIVO_BAIRROS_TS = path.join(RAIZ, "src", "dados", "recife", "bairros.ts");
const DESTINO = path.join(RAIZ, "src", "dados", "recife", "populacao-bairros.json");

const URL_ZIP =
  "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/Agregados_por_Bairro_csv/Agregados_por_bairros_basico_BR_20260520.zip";
const URL_DICIONARIO =
  "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/dicionario_de_dados_agregados_por_setores_censitarios_20261113.xlsx";
const MUNICIPIO = "2611606";

const dobrar = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s-]+/g, " ")
    .trim()
    .toLowerCase();

function lerBairrosOficiais() {
  const texto = fs.readFileSync(ARQUIVO_BAIRROS_TS, "utf-8");
  const re = /\{\s*slug:\s*"([^"]+)",\s*nome:\s*"([^"]+)",\s*rpa:\s*(\d+)(?:,\s*aliases:\s*\[([^\]]*)\])?\s*\}/g;
  const lista = [...texto.matchAll(re)].map((m) => ({ slug: m[1], nome: m[2] }));
  if (lista.length !== 94) throw new Error(`bairros.ts: li ${lista.length} bairros, esperava 94`);
  return lista;
}

/** Primeiro arquivo .csv do ZIP, descompactado (diretório central + zlib). */
function lerCsvDoZip(buffer) {
  const fimDoDiretorio = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (fimDoDiretorio < 0) throw new Error("ZIP sem diretório central");
  const entradas = buffer.readUInt16LE(fimDoDiretorio + 10);
  let p = buffer.readUInt32LE(fimDoDiretorio + 16);
  for (let i = 0; i < entradas; i++) {
    if (buffer.readUInt32LE(p) !== 0x02014b50) throw new Error("diretório central inválido");
    const metodo = buffer.readUInt16LE(p + 10);
    const tamanho = buffer.readUInt32LE(p + 20);
    const nomeLen = buffer.readUInt16LE(p + 28);
    const extraLen = buffer.readUInt16LE(p + 30);
    const comentarioLen = buffer.readUInt16LE(p + 32);
    const local = buffer.readUInt32LE(p + 42);
    const nome = buffer.toString("utf-8", p + 46, p + 46 + nomeLen);
    p += 46 + nomeLen + extraLen + comentarioLen;
    if (!nome.toLowerCase().endsWith(".csv")) continue;
    const inicio = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const dados = buffer.subarray(inicio, inicio + tamanho);
    return metodo === 0 ? dados : zlib.inflateRawSync(dados);
  }
  throw new Error("ZIP sem arquivo .csv");
}

async function garantirZip() {
  if (!fs.existsSync(ARQUIVO_ZIP)) {
    fs.mkdirSync(DIR_CACHE, { recursive: true });
    const resp = await fetch(URL_ZIP, { signal: AbortSignal.timeout(5 * 60_000) });
    if (!resp.ok) throw new Error(`download do IBGE: HTTP ${resp.status}`);
    fs.writeFileSync(ARQUIVO_ZIP, Buffer.from(await resp.arrayBuffer()));
  }
  return fs.readFileSync(ARQUIVO_ZIP);
}

const zip = await garantirZip();
const csv = new TextDecoder("latin1").decode(lerCsvDoZip(zip));
const linhas = csv.split(/\r?\n/).filter(Boolean);
const cabecalho = linhas[0].split(";").map((c) => c.replace(/"/g, "").toLowerCase());
const col = (nome) => {
  const i = cabecalho.indexOf(nome);
  if (i < 0) throw new Error(`coluna ${nome} ausente no CSV`);
  return i;
};
const [iCodigo, iNome, iMun, iPessoas] = [col("cd_bairro"), col("nm_bairro"), col("cd_mun"), col("v0001")];

const oficiais = lerBairrosOficiais();
const porNome = new Map(oficiais.map((b) => [dobrar(b.nome.replace(/\s*\(bairro\)$/i, "")), b]));
const populacao = {};
const codigos = {};
for (const linha of linhas.slice(1)) {
  const c = linha.split(";").map((v) => v.replace(/^"|"$/g, ""));
  if (c[iMun] !== MUNICIPIO) continue;
  // O IBGE às vezes grafa diferente da Prefeitura: "Poço" (Poço da Panela), "Sítio dos Pintos - São Brás".
  // Tenta o nome inteiro, depois o trecho antes de " - ", depois o nome oficial que começa com ele.
  const bruto = c[iNome];
  const nome = dobrar(bruto);
  const curto = dobrar(bruto.split(" - ")[0]);
  const oficial =
    porNome.get(nome) ?? porNome.get(curto) ?? oficiais.find((o) => dobrar(o.nome).startsWith(`${curto} `));
  if (!oficial) throw new Error(`bairro do IBGE sem correspondência em bairros.ts: "${c[iNome]}" (${c[iCodigo]})`);
  if (oficial.slug in populacao) throw new Error(`dois bairros do IBGE casaram com ${oficial.slug}`);
  const pessoas = Number(c[iPessoas]);
  if (!Number.isInteger(pessoas) || pessoas < 0) throw new Error(`V0001 inválido em ${c[iNome]}: ${c[iPessoas]}`);
  populacao[oficial.slug] = pessoas;
  codigos[oficial.slug] = c[iCodigo];
}
const faltando = oficiais.filter((o) => !(o.slug in populacao)).map((o) => o.slug);
if (faltando.length) throw new Error(`bairros sem linha no IBGE: ${faltando.join(", ")}`);

const ordenado = Object.fromEntries(oficiais.map((o) => [o.slug, populacao[o.slug]]));
const total = Object.values(ordenado).reduce((s, n) => s + n, 0);
const saida = {
  versao: 1,
  municipio: MUNICIPIO,
  referencia: "Censo Demográfico 2022",
  variavel: "V0001 — Total de pessoas (população residente)",
  fonte: URL_ZIP,
  dicionario: URL_DICIONARIO,
  licenca: "Citar o IBGE",
  sha256Zip: createHash("sha256").update(zip).digest("hex"),
  totalMunicipio: total,
  codigosIbge: Object.fromEntries(oficiais.map((o) => [o.slug, codigos[o.slug]])),
  populacao: ordenado,
};
fs.writeFileSync(DESTINO, JSON.stringify(saida, null, 1) + "\n");
console.log(`Gravado ${path.relative(RAIZ, DESTINO)}: 94 bairros, ${total.toLocaleString("pt-BR")} pessoas.`);
