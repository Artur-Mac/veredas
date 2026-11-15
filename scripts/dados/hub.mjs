// Leitura local da extração auditada do hub de dados do Recife (15/11/2026), no lugar do datastore do CKAN.
//
// Liga com VEREDA_HUB=2026-11-15 (ou --hub 2026-11-15 na linha de comando de quem importa). Sem isso, nada muda: os
// pipelines continuam lendo o CKAN, com o cache de sempre.
//
// Regras:
// - Só lê arquivo listado em docs/aplicacao/manifesto-extracao-{hub,complementar}-<data>.json, com estado "baixado", e
//   só depois de conferir o SHA-256 do arquivo inteiro com o do manifesto. Arquivo trocado ou truncado para a execução.
// - Lista branca: devolve só as colunas pedidas. Coluna proibida pedida, ou coluna pedida que o arquivo não tem, para a
//   execução. As colunas proibidas nunca saem da leitura (nem para filtrar).
// - Mesmo formato do datastore: a coluna que o CKAN tipa como número volta como número (vazia → null); data volta como
//   "AAAA-MM-DDT00:00:00"; texto vazio volta "". Os tipos de cada recurso estão em TIPOS, conferidos contra o cache do
//   CKAN de 20/10/2026. Um valor que não converte para o tipo declarado para a execução.
// - Filtros: igualdade exata por coluna, como o `filters` do datastore_search.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();

/** Colunas pessoais que nenhuma leitura do hub devolve, nem para filtrar (IPTU, ITBI, Licenciamento, Empresas, CTTU). */
export const COLUNAS_PROIBIDAS_DO_HUB = [
  "Número do contribuinte", "CPF/CNPJ mascarado do contribuinte", "tipo de contribuinte", "complemento",
  "Regime de Tributação do iptu", "Regime de Tributação da trsd", "cnpj", "razao_social", "razao_social_mercantil",
  "inscricao_mercantil", "endereco_empreendimento", "Protocolo", "num_licenca", "num_processo",
];

/**
 * Tipos do datastore por recurso (prefixo do UUID). "int" e "num": número ou null; "data": "AAAA-MM-DDT00:00:00" ou null.
 * Colunas não listadas são texto. Conferido em 15/11/2026 contra .cache/dados-recife/*.json (lidos do CKAN em 20/10).
 */
export const TIPOS = {
  "9a847338": { numero: "int", "Código Logradouro": "int", "ano da construção corrigido": "int", latitude: "num", longitude: "num" },
  "80c5b3cd": { DATA_DEMANDA: "data", DATA_ULT_SITUACAO: "data", latitude: "num", longitude: "num" },
  "e40fc8b9": { DATA_DEMANDA: "data", DATA_ULT_SITUACAO: "data", latitude: "num", longitude: "num" },
  "fc95e204": { cod_logradouro: "int", numero: "int", data_transacao: "data", latitude: "num", longitude: "num" },
  "39927a3d": { data_entrada: "data", data_conclusao: "data", data_emissao_licenca: "data", data_validade_licenca: "data", latitude: "num", longitude: "num" },
  "87ac4237": { data: "data" },
  "dbb9165a": { data: "data" },
  "c2281788": { data: "data" },
  "7c7bb871": { Ano: "int", Data: "data" },
};

/** A versão 2025 de 02/03/2026 (86.966 linhas) é parcial; a de 04/03 (e40fc8b9, 114.653) é a completa. Nunca somar. */
export const RECURSOS_RECUSADOS = new Map([["06872af2-9350-4c34-aa39-6337a1822ff7", "cópia parcial do 156 de 2025; use e40fc8b9"]]);

export function nomeDoHub(argv = process.argv, env = process.env) {
  const i = argv.indexOf("--hub");
  return (i >= 0 ? argv[i + 1] : null) ?? env.VEREDA_HUB ?? null;
}

/** CSV com aspas (RFC 4180), separador dado; devolve linhas de células (texto). */
export function lerCsvTexto(texto, separador) {
  const linhas = [];
  let linha = [];
  let celula = "";
  let aspas = false;
  const s = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  const sep = separador.charCodeAt(0);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (aspas) {
      if (c === 34) {
        if (s.charCodeAt(i + 1) === 34) { celula += '"'; i++; } else aspas = false;
      } else celula += s[i];
      continue;
    }
    if (c === 34 && celula === "") aspas = true;
    else if (c === sep) { linha.push(celula); celula = ""; }
    else if (c === 10 || c === 13) {
      if (c === 13 && s.charCodeAt(i + 1) === 10) i++;
      linha.push(celula); celula = "";
      if (linha.length > 1 || linha[0] !== "") linhas.push(linha);
      linha = [];
    } else celula += s[i];
  }
  if (celula !== "" || linha.length) { linha.push(celula); linhas.push(linha); }
  return linhas;
}

/** Converte a célula para o tipo do datastore; lança se não converter. */
export function converter(valor, tipo, rotulo) {
  const t = valor.trim();
  if (!tipo) return valor;
  if (t === "") return null;
  if (tipo === "int") {
    if (!/^-?\d+$/.test(t)) throw new Error(`${rotulo}: "${t}" não é inteiro`);
    return Number(t);
  }
  if (tipo === "num") {
    const n = Number(t.includes(",") && !t.includes(".") ? t.replace(",", ".") : t);
    if (!Number.isFinite(n)) throw new Error(`${rotulo}: "${t}" não é número`);
    return n;
  }
  if (tipo === "data") {
    const m = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/.exec(t);
    if (!m) throw new Error(`${rotulo}: "${t}" não é data AAAA-MM-DD`);
    return `${m[1]}T${m[2] ?? "00:00:00"}`;
  }
  throw new Error(`${rotulo}: tipo desconhecido ${tipo}`);
}

const conferidos = new Map();
const tabelas = new Map();

/**
 * Abre o hub `nome` ("2026-11-15"). Devolve null se `nome` for nulo. Os manifestos e o catálogo (datas de modificação)
 * ficam em docs/aplicacao; os arquivos em .cache/dados-recife/hub-<nome>/.
 */
export function abrirHub(nome, raiz = RAIZ) {
  if (!nome) return null;
  const manifestos = [`manifesto-extracao-hub-${nome}.json`, `manifesto-extracao-complementar-${nome}.json`]
    .map((m) => join(raiz, "docs/aplicacao", m))
    .filter((m) => existsSync(m));
  if (!manifestos.length) throw new Error(`hub ${nome}: nenhum manifesto em docs/aplicacao`);
  const entradas = new Map();
  for (const m of manifestos) for (const e of JSON.parse(readFileSync(m, "utf8"))) if (!entradas.has(e.resource_id)) entradas.set(e.resource_id, e);
  const modificados = new Map();
  const catalogo = join(raiz, "docs/aplicacao", `catalogo-recife-${nome}.json`);
  if (existsSync(catalogo)) {
    for (const pacote of JSON.parse(readFileSync(catalogo, "utf8"))) for (const r of pacote.resources ?? []) if (r.last_modified) modificados.set(r.id, r.last_modified.slice(0, 10));
  }

  /** Entrada do manifesto, com o arquivo conferido pelo SHA-256 (uma vez por execução). */
  function arquivo(id) {
    if (RECURSOS_RECUSADOS.has(id)) throw new Error(`hub ${nome}: recurso ${id} recusado (${RECURSOS_RECUSADOS.get(id)})`);
    const e = entradas.get(id);
    if (!e || e.estado !== "baixado") return null;
    const caminho = join(raiz, e.arquivo);
    if (!existsSync(caminho)) throw new Error(`hub ${nome}: ${e.arquivo} listado no manifesto e ausente`);
    if (!conferidos.has(caminho)) {
      const bytes = readFileSync(caminho);
      const sha = createHash("sha256").update(bytes).digest("hex");
      if (sha !== e.sha256) throw new Error(`hub ${nome}: SHA-256 de ${e.arquivo} não confere (${sha.slice(0, 12)} ≠ ${e.sha256.slice(0, 12)})`);
      if (bytes.length !== e.bytes) throw new Error(`hub ${nome}: tamanho de ${e.arquivo} não confere`);
      conferidos.set(caminho, bytes);
    }
    return { entrada: e, caminho, bytes: conferidos.get(caminho) };
  }

  /** Igual ao `lerTabela` do CKAN: { total, registros } com só as colunas pedidas. null se o recurso não está no hub. */
  function lerTabela({ recurso, fields, filters = null, rotulo }) {
    const proibidas = [...fields, ...Object.keys(filters ?? {})].filter((c) => COLUNAS_PROIBIDAS_DO_HUB.some((p) => p.toLowerCase() === c.toLowerCase()));
    if (proibidas.length) throw new Error(`${rotulo}: coluna proibida pedida ao hub: ${proibidas.join(", ")}`);
    const a = arquivo(recurso);
    if (!a || !a.entrada.arquivo.endsWith(".csv")) return null;
    const colunas = [...new Set([...fields, ...Object.keys(filters ?? {})])];
    const chave = `${recurso}|${colunas.join("|")}`;
    if (!tabelas.has(chave)) {
      const linhas = lerCsvTexto(a.bytes.toString("utf8"), a.entrada.delimitador ?? ";");
      const cabecalho = linhas[0].map((c) => c.replace(/^﻿/, "").trim());
      const indices = colunas.map((c) => cabecalho.indexOf(c));
      const faltando = colunas.filter((_, i) => indices[i] < 0);
      if (faltando.length) throw new Error(`${rotulo}: o arquivo do hub não tem as colunas ${faltando.join(", ")}`);
      const tipos = TIPOS[recurso.slice(0, 8)] ?? {};
      const registros = [];
      for (const l of linhas.slice(1)) {
        const r = {};
        colunas.forEach((c, i) => { r[c] = converter(l[indices[i]] ?? "", tipos[c], `${rotulo} ${c}`); });
        registros.push(r);
      }
      if (a.entrada.registros != null && registros.length !== a.entrada.registros) {
        throw new Error(`${rotulo}: li ${registros.length} linhas no hub, o manifesto diz ${a.entrada.registros}`);
      }
      tabelas.set(chave, registros);
    }
    let registros = tabelas.get(chave);
    if (filters) registros = registros.filter((r) => Object.entries(filters).every(([c, v]) => r[c] === v));
    const so = registros.map((r) => Object.fromEntries(fields.map((c) => [c, r[c]])));
    return { total: so.length, registros: so, doCache: false, doHub: true, sha256: a.entrada.sha256 };
  }

  /** GeoJSON conferido pelo SHA-256; null se o recurso não está no hub. */
  function lerGeojson(id) {
    const a = arquivo(id);
    if (!a || !/\.(geo)?json$/.test(a.entrada.arquivo)) return null;
    return { dados: JSON.parse(a.bytes.toString("utf8")), sha256: a.entrada.sha256, entrada: a.entrada };
  }

  return {
    nome,
    dataDaExtracao: nome,
    entrada: (id) => entradas.get(id) ?? null,
    modificadoEm: (id) => modificados.get(id) ?? null,
    lerTabela,
    lerGeojson,
    arquivo,
  };
}
