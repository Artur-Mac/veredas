/**
 * Camadas "A rua" do índice (v1.1), chamadas por scripts/dados/construir-indice-recife.mjs depois que os edifícios
 * têm centro. Lê, sempre com lista branca de colunas:
 * - Prefeitura do Recife (CKAN, ODbL): Licenciamento Ambiental (LUSE), Central 156 da Emlurb, Iluminação pública,
 *   Roteiro da coleta, Sinistros de trânsito da CTTU e Atendimentos da Defesa Civil;
 * - IBGE (citar a fonte): CNEFE 2022 do Recife (geocodificador local), entorno dos domicílios por setor, Tabela 1.1 da
 *   Amostra por área de ponderação e a composição das áreas de ponderação.
 *
 * O que fica no índice: por edifício (numa tupla, pelo teto de 2 MB de Boa Viagem), o setor censitário, os pedidos ao
 * 156 a até 150 m em 12 meses e os sinistros com vítima a até 150 m; por bairro, os setores e as áreas de ponderação dos edifícios, os locais com LUSE e os pontos de
 * iluminação desativados perto de algum edifício, e, por rua do IPTU, o roteiro da coleta e o resumo da Defesa Civil.
 *
 * Privacidade: o CNEFE é lido da memória (o ZIP com complementos nunca vai para o disco) e o cache guarda só
 * COLUNAS_DO_CNEFE; o Licenciamento Ambiental nunca pede CNPJ, razão social nem inscrição mercantil; a CTTU nunca pede
 * `complemento` nem protocolo; o número mascarado da Defesa Civil nunca é lido. As regras puras moram em ./nucleo.mjs.
 */

import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import * as nucleo from "./nucleo.mjs";

/** Lista oficial dos bairros (arquivo do arquiteto em TypeScript, lido como texto: o Node 20 não o importa). */
const BAIRROS_TS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "src", "dados", "recife", "bairros.ts");

/** Nome sem acento e sem caixa → slug oficial, para guardar os bairros de cada área de ponderação pelo slug. */
function slugsDosBairros() {
  const mapa = new Map();
  for (const [, slug, nome] of fs.readFileSync(BAIRROS_TS, "utf-8").matchAll(/\{ slug: "([a-z0-9-]+)", nome: "([^"]+)"/g)) mapa.set(nucleo.dobrar(nome), slug);
  if (mapa.size !== 94) throw new Error(`bairros.ts: esperava 94 bairros, li ${mapa.size}`);
  return mapa;
}

// ——— Fontes ——————————————————————————————————————————————————————————————————————

const RAIO_M = 150;
/** Coleta: a linha do roteiro só vale para a rua do prédio se o setor da coleta estiver a até esta distância. */
const RAIO_DO_SETOR_DA_COLETA_M = 2500;
/** Setor do prédio: o endereço do CNEFE achado pela rua e número só vale se estiver a até esta distância do centro. */
const DISTANCIA_MAXIMA_DO_SETOR_M = 150;
/** Sem rua e número no CNEFE, o setor vem do endereço do CNEFE mais perto do centro, a até esta distância. */
const RAIO_DO_ENDERECO_MAIS_PROXIMO_M = 80;
const MAX_BAIRROS_DA_AREA = 4;

export const RECURSO_AMBIENTAL = "982d6c85-906a-4ea8-90e0-31f55eac63f9";
/** Lista branca: nunca `cnpj`, `razao_social`, `razao_social_mercantil`, `inscricao_mercantil` nem `endereco_empreendimento`. */
export const CAMPOS_AMBIENTAL = ["dsqfl", "licenciamento_ambiental", "data_entrada", "situacao_processo", "bairro", "latitude", "longitude"];

/** O recurso de 2025 republicado em 04/03/2026 é o completo (114.653 pedidos; a cópia de 02/03 tem 86.966). */
const RECURSOS_156 = [
  { ano: 2026, id: "80c5b3cd-d4f7-466e-9031-e636ef56dd99" },
  { ano: 2025, id: "e40fc8b9-49b7-4f08-8b9f-60ba6ed35519" },
];
const CAMPOS_156 = [
  "GRUPOSERVICO_DESCRICAO", "SERVICO_DESCRICAO", "LOGRADOURO", "NUMERO", "BAIRRO", "DATA_DEMANDA", "SITUACAO", "DATA_ULT_SITUACAO",
  "latitude", "longitude",
];

const RECURSO_ILUMINACAO = "76cb7e65-1362-4ea7-ac04-453d67e41c64";
const CAMPOS_ILUMINACAO = ["id_ponto", "tipo_lampa", "bairro", "latitude", "longitude"];

const RECURSO_COLETA = "2a0dd9cf-86f4-4ceb-83c1-7e39ff239cb0";
const CAMPOS_COLETA = ["setor", "endereco", "turno", "intervalo", "frequencia"];

const RECURSOS_SINISTROS = [
  { ano: 2024, id: "87ac4237-f5f9-44d2-bcf1-927aaa0a2d31" },
  { ano: 2023, id: "dbb9165a-7539-4fdd-943a-acffe12df3e0" },
  { ano: 2022, id: "c2281788-2e8c-472c-8812-67c4f85e9272" },
];
/** Lista branca: nunca `complemento` nem `Protocolo`. */
const CAMPOS_SINISTROS = ["data", "natureza", "bairro", "endereco", "numero", "detalhe_endereco_acidente", "tipo", "pedestre", "vitimas", "vitimasfatais"];
const PERIODO_DOS_SINISTROS = { de: "2022-01-01", ate: "2024-12-31" };

/** Publicação de 06/03/2026 (a mais recente); 2020 vem da cópia de 04/03/2026, a única desse ano no datastore. */
const RECURSOS_DEFESA_CIVIL = [
  { ano: 2024, id: "7c7bb871-3906-4d82-8993-857c9e6f137b" },
  { ano: 2023, id: "921d87c7-5ace-4856-9e3f-c31521259c36" },
  { ano: 2022, id: "10203dd4-9052-4a76-95eb-fd858aa053d4" },
  { ano: 2021, id: "bf6f5af8-3556-425c-bfec-0eddccdeeb73" },
  { ano: 2020, id: "a2e18f69-9d10-4482-8f5f-04bc7bd2e8e7" },
  { ano: 2019, id: "9bb859e1-19ae-4b95-9246-139b9273846f" },
  { ano: 2018, id: "a3a25520-de12-4f56-ae05-6dc1ec4c6207" },
  { ano: 2017, id: "40e0558f-dc49-4ec7-b5e6-5a791703ae34" },
  { ano: 2016, id: "932fee1e-80fd-49f8-9ae3-6e8dd96e33a3" },
  { ano: 2015, id: "9a5103f7-6bd0-4694-90d6-7e776b1e372d" },
  { ano: 2014, id: "b81bf4cc-ae19-4a43-94a7-f11b3e0b662b" },
];
/** Colunas da Defesa Civil, pelo nome sem acento (a grafia de "Mês" muda de um ano para outro). Nunca as medidas do imóvel. */
const CAMPOS_DEFESA_CIVIL = ["Regional", "Ano", "Mes", "Data", "Ocorrencia", "Solicitacao", "Endereco", "Bairro"];
const PERIODO_DA_DEFESA_CIVIL = { de: "2014-01-01", ate: "2024-12-31" };

const FTP = "https://ftp.ibge.gov.br/";
const CNEFE = {
  pagina: `${FTP}Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/Municipio/26_PE/`,
  arquivo: "2611606_RECIFE.zip",
};
const ENTORNO = {
  pagina: `${FTP}Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Caracteristicas_urbanisticas_do_entorno_dos_domicilios/Agregados_por_Setor_csv/`,
  arquivo: "Agregados_por_setores_entorno_domic%c3%adlios_BR.zip",
};
const AMOSTRA = {
  pagina: `${FTP}Censos/Censo_Demografico_2022/Microdados_e_Areas_de_Ponderacao/Areas_de_Ponderacao/`,
  arquivo: "tabelas_xlsx.zip",
  tabela: "Tab1_1.xlsx",
};
const COMPOSICAO = {
  pagina: `${FTP}Censos/Censo_Demografico_2022/Microdados_e_Areas_de_Ponderacao/Documentacao/%c3%81reas%20de%20pondera%c3%a7%c3%a3o/`,
  arquivo: "Composi%c3%a7%c3%a3o%20das%20%c3%81reas%20de%20Pondera%c3%a7%c3%a3o.xlsx",
};
/**
 * Malha final dos setores do Censo 2022 (SIRGAS 2000). O CNEFE de 2024 usa a grade prévia (código com sufixo "P"):
 * 276 dos 2.563 setores dele, com 14% dos endereços do Recife, não existem na grade final, que é a das tabelas. Por isso
 * o setor do prédio vem do polígono que contém o centro dele, não do CNEFE.
 */
const MALHA = {
  pagina: "https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_de_setores_censitarios__divisoes_intramunicipais/censo_2022/setores/shp/UF/",
  arquivo: "PE_setores_CD2022.zip",
};
const COLUNAS_DA_MALHA = ["CD_SETOR", "CD_MUN", "NM_BAIRRO", "geometria"];
const MUNICIPIO = "2611606";
const COLUNAS_DO_ENTORNO = ["CD_setor", ...Object.values(nucleo.VARIAVEIS_DO_ENTORNO)];
const COLUNAS_DA_AMOSTRA = ["Código do Município", "Área de ponderação", "Total", "Alugado"];
const COLUNAS_DA_COMPOSICAO = ["Setor", "Código do Município", "Área de Ponderação"];

/** Colunas que nunca saem da leitura destas bases, além das da seção 1.2 da ordem (que o `lerTabela` já recusa). */
export const COLUNAS_PROIBIDAS_DA_RUA = [
  "cnpj", "razao_social", "razao_social_mercantil", "inscricao_mercantil", "endereco_empreendimento", "complemento", "Protocolo",
  "COD_UNICO_ENDERECO", "DSC_ESTABELECIMENTO", "CEP",
  ...[1, 2, 3, 4, 5].flatMap((i) => [`NOM_COMP_ELEM${i}`, `VAL_COMP_ELEM${i}`]),
];

function conferirListaBranca(rotulo, colunas) {
  const proibidas = colunas.filter((c) => COLUNAS_PROIBIDAS_DA_RUA.some((p) => p.toLowerCase() === c.toLowerCase()));
  if (proibidas.length) throw new Error(`${rotulo}: coluna proibida na lista branca: ${proibidas.join(", ")}`);
}

// ——— Download e cache ——————————————————————————————————————————————————————————————

/** Baixa um arquivo para a memória e devolve { corpo, modificadoEm } (o Last-Modified do servidor, AAAA-MM-DD). */
async function baixar(f, url, rotulo) {
  return f.comTentativas(`download ${rotulo}`, async () => {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15 * 60_000) });
    if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
    if (!res.ok) throw new f.ErroPermanente(`HTTP ${res.status}`);
    const corpo = Buffer.from(await res.arrayBuffer());
    const cabecalho = res.headers.get("last-modified");
    const modificadoEm = cabecalho && !Number.isNaN(Date.parse(cabecalho)) ? new Date(cabecalho).toISOString().slice(0, 10) : null;
    return { corpo, modificadoEm };
  });
}

function lerCache(f, arquivo, consulta, gz = false) {
  const caminho = path.join(f.DIR_CACHE, arquivo);
  if (!fs.existsSync(caminho)) return null;
  try {
    const bruto = fs.readFileSync(caminho);
    const json = JSON.parse((gz ? zlib.gunzipSync(bruto) : bruto).toString("utf-8"));
    return JSON.stringify(json.consulta) === JSON.stringify(consulta) ? json : null;
  } catch {
    return null;
  }
}

function gravarCache(f, arquivo, conteudo, gz = false) {
  const texto = JSON.stringify(conteudo);
  f.gravarAtomico(path.join(f.DIR_CACHE, arquivo), gz ? zlib.gzipSync(Buffer.from(texto)) : texto);
}

// ——— Leitura: Prefeitura ———————————————————————————————————————————————————————————

/** Lido antes do passo de Lotes: os locais com LUSE sem coordenada precisam do centro do lote. */
export async function lerLicenciamentoAmbiental(f) {
  conferirListaBranca("Licenciamento Ambiental", CAMPOS_AMBIENTAL);
  const lido = await f.lerTabela({ recurso: RECURSO_AMBIENTAL, fields: CAMPOS_AMBIENTAL, arquivo: "ambiental.json", rotulo: "Licenciamento Ambiental" });
  console.log(`  Licenciamento Ambiental: ${f.mil(lido.registros.length)} lidos, total da API ${f.mil(lido.total)}${lido.doCache ? " (cache)" : ""}`);
  return lido;
}

/** dsqfls (14 dígitos) dos processos com LUSE sem coordenada: o passo de Lotes devolve o centro deles. */
export function dsqflsDaLuse(ambiental) {
  const pedidos = new Set();
  for (const r of ambiental.registros) {
    if (!nucleo.situacaoDaLuse(r.licenciamento_ambiental)) continue;
    if (nucleo.coordenadaNoRecife(r.latitude, r.longitude)) continue;
    const d = nucleo.soDigitos(r.dsqfl);
    if (d.length === 14) pedidos.add(d);
  }
  return pedidos;
}

async function lerVarios(f, recursos, campos, prefixo, rotulo) {
  conferirListaBranca(rotulo, campos);
  const anos = [];
  for (const { ano, id } of recursos) {
    const lido = await f.lerTabela({ recurso: id, fields: campos, arquivo: `${prefixo}-${ano}.json`, rotulo: `${rotulo} ${ano}` });
    console.log(`  ${rotulo} ${ano}: ${f.mil(lido.registros.length)} lidos, total da API ${f.mil(lido.total)}${lido.doCache ? " (cache)" : ""}`);
    anos.push({ ano, id, lidos: lido.registros.length, total: lido.total, registros: lido.registros });
  }
  return anos;
}

/** Nome real de cada coluna da Defesa Civil no recurso (a de "Mês" vem como "Mês" ou "MÃªs"). */
async function camposDaDefesaCivil(f, id) {
  const caminho = path.join(f.DIR_CACHE, `campos-${id}.json`);
  let nomes = f.lerJson(caminho);
  if (!Array.isArray(nomes)) {
    const resultado = await f.chamarCkan("datastore_search", { resource_id: id, limit: 0 });
    nomes = resultado.fields.map((c) => c.id);
    f.gravarAtomico(caminho, JSON.stringify(nomes));
  }
  const porNome = new Map();
  for (const nome of nomes) {
    const d = nucleo.dobrar(nome).replace(/[^a-z]/g, "");
    const canonico = /^m.{1,3}s$/.test(d) ? "Mes" : CAMPOS_DEFESA_CIVIL.find((c) => c.toLowerCase() === d);
    if (canonico) porNome.set(canonico, nome);
  }
  const faltando = CAMPOS_DEFESA_CIVIL.filter((c) => !porNome.has(c));
  if (faltando.length) throw new Error(`Defesa Civil ${id}: colunas ausentes: ${faltando.join(", ")}`);
  return porNome;
}

/**
 * Atendimentos da Defesa Civil, 2014 a 2024: do datastore quando o recurso está nele (paginado até o total), senão do
 * CSV. Do CSV o cache guarda só o já lido por `lerAtendimentoDaDefesaCivil` (ano, bairro, rua e ocorrência).
 */
async function lerDefesaCivil(f, metas) {
  const anos = [];
  for (const { ano, id } of RECURSOS_DEFESA_CIVIL) {
    const meta = metas.get(id);
    if (meta.datastoreAtivo) {
      const nomes = await camposDaDefesaCivil(f, id);
      const fields = CAMPOS_DEFESA_CIVIL.map((c) => nomes.get(c));
      const lido = await f.lerTabela({ recurso: id, fields, arquivo: `defesa-civil-${ano}.json`, rotulo: `Defesa Civil ${ano}` });
      const atendimentos = lido.registros.map((r) => {
        const linha = {};
        for (const c of CAMPOS_DEFESA_CIVIL) linha[c] = r[nomes.get(c)];
        return nucleo.lerAtendimentoDaDefesaCivil(linha);
      });
      console.log(`  Defesa Civil ${ano}: ${f.mil(lido.registros.length)} lidos, total da API ${f.mil(lido.total)}${lido.doCache ? " (cache)" : ""}`);
      anos.push({ ano, id, origem: "API", lidos: lido.registros.length, atendimentos });
      continue;
    }
    const consulta = { recurso: id, campos: CAMPOS_DEFESA_CIVIL, versao: 1 };
    let cache = lerCache(f, `defesa-civil-${ano}.json`, consulta);
    if (!cache) {
      const { corpo } = await baixar(f, meta.url, `Defesa Civil ${ano}`);
      const linhas = nucleo.lerCsv(corpo.toString("utf-8").replace(/^﻿/, ""), ";");
      const cabecalho = linhas[0].map((c) => {
        const d = nucleo.dobrar(c).replace(/[^a-z]/g, "");
        return /^m.{1,3}s$/.test(d) ? "Mes" : (CAMPOS_DEFESA_CIVIL.find((x) => x.toLowerCase() === d) ?? null);
      });
      const faltando = CAMPOS_DEFESA_CIVIL.filter((c) => !cabecalho.includes(c));
      if (faltando.length) throw new Error(`CSV da Defesa Civil ${ano} sem as colunas: ${faltando.join(", ")}`);
      const atendimentos = [];
      let lidas = 0;
      for (const colunas of linhas.slice(1)) {
        if (colunas.length < 4) continue;
        lidas++;
        const linha = {};
        cabecalho.forEach((c, i) => {
          if (c) linha[c] = colunas[i] ?? "";
        });
        atendimentos.push(nucleo.lerAtendimentoDaDefesaCivil(linha));
      }
      cache = { consulta, lidas, atendimentos };
      gravarCache(f, `defesa-civil-${ano}.json`, cache);
    }
    console.log(`  Defesa Civil ${ano}: ${f.mil(cache.lidas)} lidos do CSV`);
    anos.push({ ano, id, origem: "CSV", lidos: cache.lidas, atendimentos: cache.atendimentos });
  }
  return anos;
}

// ——— Leitura: IBGE ——————————————————————————————————————————————————————————————————

/**
 * CNEFE 2022 do Recife: o ZIP vai para a memória, o CSV é lido linha a linha e só as colunas de COLUNAS_DO_CNEFE
 * seguem; o cache (comprimido) guarda essas linhas. Confere o cabeçalho e conta as linhas lidas.
 */
async function lerCnefe(f) {
  nucleo.COLUNAS_DO_CNEFE.forEach((c) => conferirListaBranca("CNEFE", [c]));
  const consulta = { url: CNEFE.pagina + CNEFE.arquivo, colunas: nucleo.COLUNAS_DO_CNEFE };
  const emCache = lerCache(f, "cnefe-recife.json.gz", consulta, true);
  if (emCache) return { ...emCache, doCache: true };
  const { corpo, modificadoEm } = await baixar(f, consulta.url, "CNEFE Recife");
  const zip = nucleo.lerZip(corpo, zlib.inflateRawSync);
  const nome = [...zip.keys()].find((n) => n.toLowerCase().endsWith(".csv"));
  if (!nome) throw new Error("ZIP do CNEFE sem CSV");
  const texto = zip.get(nome)().toString("latin1");
  let fim = texto.indexOf("\n");
  const cabecalho = texto.slice(0, fim).replace(/\r$/, "").split(";");
  const indices = nucleo.COLUNAS_DO_CNEFE.map((c) => cabecalho.indexOf(c));
  const faltando = nucleo.COLUNAS_DO_CNEFE.filter((_, i) => indices[i] < 0);
  if (faltando.length) throw new Error(`CNEFE sem as colunas: ${faltando.join(", ")}`);
  const linhas = [];
  let inicio = fim + 1;
  while (inicio < texto.length) {
    fim = texto.indexOf("\n", inicio);
    if (fim < 0) fim = texto.length;
    const linha = texto.slice(inicio, fim).replace(/\r$/, "");
    inicio = fim + 1;
    if (linha === "") continue;
    const colunas = linha.split(";");
    if (colunas.length !== cabecalho.length) throw new Error(`CNEFE: linha com ${colunas.length} colunas, esperava ${cabecalho.length}`);
    linhas.push(indices.map((i) => colunas[i]));
  }
  const conteudo = { consulta, modificadoEm, colunas: nucleo.COLUNAS_DO_CNEFE, linhas };
  gravarCache(f, "cnefe-recife.json.gz", conteudo, true);
  return { ...conteudo, doCache: false };
}

/** Domicílios do entorno por setor, só os setores do Recife e só as colunas de COLUNAS_DO_ENTORNO. */
async function lerEntorno(f) {
  const consulta = { url: ENTORNO.pagina + ENTORNO.arquivo, colunas: COLUNAS_DO_ENTORNO };
  const emCache = lerCache(f, "censo-entorno-recife.json", consulta);
  if (emCache) return emCache;
  const { corpo, modificadoEm } = await baixar(f, consulta.url, "Censo, entorno por setor");
  const zip = nucleo.lerZip(corpo, zlib.inflateRawSync);
  const nome = [...zip.keys()].find((n) => n.toLowerCase().endsWith(".csv"));
  const texto = zip.get(nome)().toString("latin1");
  const linhas = texto.split(/\r?\n/);
  const cabecalho = linhas[0].split(";").map((c) => c.replace(/"/g, "").trim());
  const indices = COLUNAS_DO_ENTORNO.map((c) => cabecalho.indexOf(c));
  if (indices.some((i) => i < 0)) throw new Error("CSV do entorno sem as colunas esperadas");
  const setores = [];
  let lidas = 0;
  for (const linha of linhas.slice(1)) {
    if (!linha) continue;
    lidas++;
    const colunas = linha.split(";");
    const objeto = Object.fromEntries(COLUNAS_DO_ENTORNO.map((c, k) => [c, (colunas[indices[k]] ?? "").replace(/"/g, "")]));
    if (!objeto.CD_setor.startsWith(MUNICIPIO)) continue;
    setores.push(nucleo.lerSetorDoEntorno(objeto));
  }
  const conteudo = { consulta, modificadoEm, lidasNoBrasil: lidas, setores };
  gravarCache(f, "censo-entorno-recife.json", conteudo);
  return conteudo;
}

/** Tabela 1.1 da Amostra (condição de ocupação) por área de ponderação do Recife: total e alugados. */
async function lerAlugados(f) {
  const consulta = { url: AMOSTRA.pagina + AMOSTRA.arquivo, tabela: AMOSTRA.tabela, colunas: COLUNAS_DA_AMOSTRA };
  const emCache = lerCache(f, "censo-alugados-recife.json", consulta);
  if (emCache) return emCache;
  const { corpo, modificadoEm } = await baixar(f, consulta.url, "Censo, tabelas por área de ponderação");
  const xlsx = nucleo.lerZip(nucleo.lerZip(corpo, zlib.inflateRawSync).get(AMOSTRA.tabela)(), zlib.inflateRawSync);
  const textos = nucleo.textosCompartilhados(xlsx.get("xl/sharedStrings.xml")().toString("utf-8"));
  const folha = xlsx.get("xl/worksheets/sheet1.xml")().toString("utf-8");
  let colunas = null;
  const areas = [];
  for (const celulas of nucleo.linhasDaPlanilha(folha, textos)) {
    if (!colunas && celulas.A === "Código do Município") {
      colunas = Object.fromEntries(Object.entries(celulas).map(([col, nome]) => [nome, col]));
      const faltando = COLUNAS_DA_AMOSTRA.filter((c) => !colunas[c]);
      if (faltando.length) throw new Error(`Tabela 1.1 sem as colunas: ${faltando.join(", ")}`);
      continue;
    }
    if (!colunas || celulas[colunas["Código do Município"]] !== MUNICIPIO) continue;
    const codigo = String(celulas[colunas["Área de ponderação"]] ?? "");
    const total = nucleo.contagemDoCenso(celulas[colunas.Total]);
    const alugados = nucleo.contagemDoCenso(celulas[colunas.Alugado]);
    if (!/^\d{10}$/.test(codigo) || total === null || total <= 0 || alugados === null) continue;
    areas.push({ codigo, domicilios: total, alugados });
  }
  if (areas.length === 0) throw new Error("Tabela 1.1 sem áreas de ponderação do Recife");
  const conteudo = { consulta, modificadoEm, areas };
  gravarCache(f, "censo-alugados-recife.json", conteudo);
  return conteudo;
}

/** Malha de setores de PE → os setores do Recife, com o nome do bairro, a caixa e os anéis do polígono. */
async function lerMalhaDeSetores(f) {
  const consulta = { url: MALHA.pagina + MALHA.arquivo, colunas: COLUNAS_DA_MALHA };
  const emCache = lerCache(f, "censo-setores-recife.json.gz", consulta, true);
  if (emCache) return emCache;
  const { corpo, modificadoEm } = await baixar(f, consulta.url, "Censo, malha de setores de PE");
  const zip = nucleo.lerZip(corpo, zlib.inflateRawSync);
  const arquivo = (extensao) => {
    const nome = [...zip.keys()].find((n) => n.toLowerCase().endsWith(extensao));
    if (!nome) throw new Error(`Malha de setores sem o arquivo ${extensao}`);
    return zip.get(nome)();
  };
  const dbf = nucleo.lerDbf(arquivo(".dbf"), ["CD_SETOR", "CD_MUN", "NM_BAIRRO"]);
  const shp = arquivo(".shp");
  const shx = arquivo(".shx");
  const setores = [];
  for (let i = 0; i < dbf.registros; i++) {
    const r = dbf.ler(i);
    if (r.CD_MUN !== MUNICIPIO) continue;
    const poligono = nucleo.lerPoligonoDoShp(shp, shx, i);
    if (!poligono || !/^\d{15}$/.test(r.CD_SETOR)) continue;
    setores.push({ codigo: r.CD_SETOR, bairro: r.NM_BAIRRO, ...poligono });
  }
  if (setores.length === 0) throw new Error("Malha sem setores do Recife");
  setores.sort((a, b) => nucleo.ordemTexto(a.codigo, b.codigo));
  const conteudo = { consulta, modificadoEm, lidosEmPE: dbf.registros, setores };
  gravarCache(f, "censo-setores-recife.json.gz", conteudo, true);
  return conteudo;
}

/** Composição das áreas de ponderação: setor → área, só os setores do Recife. */
async function lerComposicao(f) {
  const consulta = { url: COMPOSICAO.pagina + COMPOSICAO.arquivo, colunas: COLUNAS_DA_COMPOSICAO };
  const emCache = lerCache(f, "censo-composicao-recife.json", consulta);
  if (emCache) return emCache;
  const { corpo, modificadoEm } = await baixar(f, consulta.url, "Censo, composição das áreas de ponderação");
  const xlsx = nucleo.lerZip(corpo, zlib.inflateRawSync);
  const folha = xlsx.get("xl/worksheets/sheet1.xml")().toString("utf-8");
  const setores = [];
  for (const celulas of nucleo.linhasDaPlanilha(folha, [], (xml) => xml.includes(`<v>${MUNICIPIO}</v>`))) {
    const setor = String(celulas.A ?? "");
    const area = String(celulas.C ?? "");
    if (celulas.B === MUNICIPIO && /^\d{15}$/.test(setor) && /^\d{10}$/.test(area)) setores.push([setor, area]);
  }
  if (setores.length === 0) throw new Error("Composição sem setores do Recife");
  setores.sort((a, b) => nucleo.ordemTexto(a[0], b[0]));
  const conteudo = { consulta, modificadoEm, setores };
  gravarCache(f, "censo-composicao-recife.json", conteudo);
  return conteudo;
}

// ——— Montagem ————————————————————————————————————————————————————————————————————

const porcento = (parte, total) => (total === 0 ? "n/d" : `${((parte / total) * 100).toFixed(1)}%`);

function contar(mapa, chave, n = 1) {
  mapa.set(chave, (mapa.get(chave) ?? 0) + n);
}

function textoDoMapa(mapa) {
  return [...mapa.entries()].sort((a, b) => b[1] - a[1] || nucleo.ordemTexto(a[0], b[0])).map(([k, v]) => `${k} ${v}`).join(", ");
}

/** Slug do bairro coberto → nome como no CNEFE (DSC_LOCALIDADE, já dobrado). */
const nomeNoCnefe = (slug) => slug.replace(/-/g, " ");

function medianaInteira(valores) {
  const m = nucleo.mediana(valores);
  return m === null ? null : Math.round(m);
}

/**
 * Acrescenta `rua` a cada edifício e devolve, por bairro, o objeto `rua` do índice; mais as fontes do meta.json
 * (`fontesDaRua`) e as linhas do relatório.
 * `edificiosPorBairro`: os edifícios finais (com centro), por slug. `centroPorDsqfl`: centro dos lotes pedidos por
 * `dsqflsDaLuse`. Os bairros de cada área de ponderação ficam pelo slug de src/dados/recife/bairros.ts (ou, se o nome do
 * CNEFE não for um bairro oficial, pelo nome dele com hífens).
 */
export async function montarARua({ edificiosPorBairro, geradoEm, centroPorDsqfl, ambiental, f }) {
  const bairros = Object.keys(edificiosPorBairro);
  const relatorio = [];
  const linha = (texto) => relatorio.push(texto);
  const geradoEmData = geradoEm.slice(0, 10);

  console.log("\nA rua: metadados");
  const ids = [
    RECURSO_AMBIENTAL, ...RECURSOS_156.map((r) => r.id), RECURSO_ILUMINACAO, RECURSO_COLETA, ...RECURSOS_SINISTROS.map((r) => r.id),
    ...RECURSOS_DEFESA_CIVIL.map((r) => r.id),
  ];
  const metas = new Map();
  for (const id of ids) metas.set(id, await f.metadadosDoRecurso(id));

  console.log("\nA rua: Prefeitura");
  const pedidos156 = await lerVarios(f, RECURSOS_156, CAMPOS_156, "156", "Central 156");
  const [iluminacao] = await lerVarios(f, [{ ano: 2025, id: RECURSO_ILUMINACAO }], CAMPOS_ILUMINACAO, "iluminacao", "Iluminação pública");
  const [coleta] = await lerVarios(f, [{ ano: "roteiro", id: RECURSO_COLETA }], CAMPOS_COLETA, "coleta", "Roteiro de coleta");
  const sinistros = await lerVarios(f, RECURSOS_SINISTROS, CAMPOS_SINISTROS, "sinistros", "Sinistros CTTU");
  const defesaCivil = await lerDefesaCivil(f, metas);

  console.log("\nA rua: IBGE");
  const cnefe = await lerCnefe(f);
  console.log(`  CNEFE Recife: ${f.mil(cnefe.linhas.length)} endereços${cnefe.doCache ? " (cache)" : ""}`);
  const entorno = await lerEntorno(f);
  console.log(`  Censo, entorno: ${f.mil(entorno.setores.length)} setores do Recife`);
  const alugados = await lerAlugados(f);
  console.log(`  Censo, Tabela 1.1: ${alugados.areas.length} áreas de ponderação do Recife`);
  const composicao = await lerComposicao(f);
  console.log(`  Censo, composição: ${f.mil(composicao.setores.length)} setores do Recife`);
  const malha = await lerMalhaDeSetores(f);
  console.log(`  Censo, malha de setores: ${f.mil(malha.setores.length)} setores do Recife (de ${f.mil(malha.lidosEmPE)} em PE)`);

  // 1. Geocodificador.
  const indicesDoCnefe = Object.fromEntries(nucleo.COLUNAS_DO_CNEFE.map((c, i) => [c, i]));
  const enderecos = [];
  let cnefeSemPosicao = 0;
  for (const colunas of cnefe.linhas) {
    const e = nucleo.lerEnderecoDoCnefe(colunas, indicesDoCnefe);
    if (e) enderecos.push(e);
    else cnefeSemPosicao++;
  }
  const geo = nucleo.criarGeocodificador(enderecos);
  linha(`  CNEFE: ${f.mil(cnefe.linhas.length)} endereços lidos (${f.mil(cnefeSemPosicao)} sem coordenada no Recife), ${f.mil(geo.ruas.length)} ruas (bairro + tipo + nome)`);

  // 2. Censo: área de cada setor, setores do entorno e bairros de cada área (pelo bairro da malha, com o peso dos
  //    domicílios do entorno; setor sem esse número pesa 1).
  const areaDoSetor = new Map(composicao.setores);
  const entornoDoSetor = new Map(entorno.setores.map((s) => [s.codigo, s]));
  const alugadosDaArea = new Map(alugados.areas.map((a) => [a.codigo, a]));
  const slugPorNome = slugsDosBairros();
  const localizador = nucleo.criarLocalizadorDeSetor(malha.setores);
  const domiciliosPorAreaEBairro = new Map();
  for (const s of malha.setores) {
    const area = areaDoSetor.get(s.codigo);
    if (!area) continue;
    if (!domiciliosPorAreaEBairro.has(area)) domiciliosPorAreaEBairro.set(area, new Map());
    contar(domiciliosPorAreaEBairro.get(area), nucleo.dobrar(s.bairro), entornoDoSetor.get(s.codigo)?.domicilios || 1);
  }
  const setoresPrevios = new Set(enderecos.map((e) => e.setor).filter(Boolean));
  const previosForaDaGrade = [...setoresPrevios].filter((s) => !areaDoSetor.has(s)).length;
  linha(`  Setores: o CNEFE traz ${f.mil(setoresPrevios.size)} setores da grade prévia, ${previosForaDaGrade} fora da grade final (${f.mil(malha.setores.length)} setores na malha, ${f.mil(composicao.setores.length)} na composição): o setor do prédio vem da malha`);
  const bairrosDaArea = (area) =>
    [...(domiciliosPorAreaEBairro.get(area) ?? new Map()).entries()]
      .sort((a, b) => b[1] - a[1] || nucleo.ordemTexto(a[0], b[0]))
      .slice(0, MAX_BAIRROS_DA_AREA)
      .map(([b]) => slugPorNome.get(b) ?? b.replace(/ /g, "-"));

  // 3. LUSE: um local por lote.
  const luse = nucleo.deduplicarLuse(ambiental.registros, centroPorDsqfl);
  const gradeLuse = nucleo.criarGrade(luse.locais.map((l) => ({ lon: l.centro[0], lat: l.centro[1] })));
  linha(
    `  LUSE: ${f.mil(ambiental.registros.length)} processos do Licenciamento Ambiental; ${luse.linhasComLuse} com LUSE no histórico do lote -> ${luse.locais.length} locais (dedupe por dsqfl ou coordenada), ${luse.locais.filter((l) => l.vigente).length} com LUSE vigente; ${luse.semPosicao} sem posição`,
  );

  // 4. Central 156: janela de 12 meses que termina no pedido mais recente publicado (até a geração).
  const vias156 = new Map();
  const linhas156 = new Map();
  let fim156 = "0000-00-00";
  for (const { registros } of pedidos156) {
    for (const r of registros) {
      const data = nucleo.dataIso(r.DATA_DEMANDA);
      if (data && data <= geradoEmData && nucleo.categoriaDoPedido(r.GRUPOSERVICO_DESCRICAO, r.SERVICO_DESCRICAO) && data > fim156) fim156 = data;
    }
  }
  const inicio156 = nucleo.inicioDaJanela(fim156, 12);
  for (const { registros } of pedidos156) {
    for (const r of registros) {
      const categoria = nucleo.categoriaDoPedido(r.GRUPOSERVICO_DESCRICAO, r.SERVICO_DESCRICAO);
      const data = nucleo.dataIso(r.DATA_DEMANDA);
      if (!categoria || !data || data < inicio156 || data > fim156) continue;
      // O mesmo pedido pode estar nos dois arquivos (2025 e 2026): fica uma vez, com a situação mais recente.
      const chave = [categoria, nucleo.dobrar(r.SERVICO_DESCRICAO), nucleo.dobrar(r.LOGRADOURO), nucleo.dobrar(r.NUMERO), nucleo.dobrar(r.BAIRRO), data, r.latitude ?? "", r.longitude ?? ""].join("|");
      const atual = linhas156.get(chave);
      const ultima = nucleo.dataIso(r.DATA_ULT_SITUACAO) ?? "";
      if (atual && atual.ultima >= ultima) {
        contar(vias156, "repetido nos dois arquivos");
        continue;
      }
      if (atual) contar(vias156, "repetido nos dois arquivos");
      linhas156.set(chave, { r, categoria, data, ultima });
    }
  }
  const pontos156 = [];
  for (const chave of [...linhas156.keys()].sort()) {
    const { r, categoria } = linhas156.get(chave);
    let posicao = nucleo.coordenadaNoRecife(r.latitude, r.longitude);
    let via = "coordenada publicada";
    if (!posicao) {
      const g = nucleo.geocodificar(geo, { logradouro: limparEspacos(r.LOGRADOURO), numero: r.NUMERO, bairro: r.BAIRRO });
      posicao = g;
      via = g ? `CNEFE (${g.precisao})` : nucleo.numeroDoImovel(r.NUMERO) === null ? "sem número, descartado" : "sem casamento no CNEFE, descartado";
    }
    contar(vias156, via);
    if (!posicao) continue;
    pontos156.push({ lon: posicao.lon, lat: posicao.lat, categoria, dias: nucleo.diasAteAtender(r.SITUACAO, r.DATA_DEMANDA, r.DATA_ULT_SITUACAO) });
  }
  const grade156 = nucleo.criarGrade(pontos156);
  linha(`  Central 156: janela ${inicio156} a ${fim156}; ${f.mil(linhas156.size)} pedidos de drenagem, lâmpada apagada ou entulho -> posição: ${textoDoMapa(vias156)}`);

  // 5. Iluminação: um ponto por id_ponto; só os desativados.
  const pontosDeLuz = new Map();
  for (const r of iluminacao.registros) {
    const id = String(r.id_ponto ?? "");
    if (!id || pontosDeLuz.has(id)) continue;
    pontosDeLuz.set(id, r);
  }
  const desativados = [];
  let desativadosSemPosicao = 0;
  for (const id of [...pontosDeLuz.keys()].sort()) {
    const r = pontosDeLuz.get(id);
    if (nucleo.dobrar(r.tipo_lampa) !== "desativado") continue;
    const p = nucleo.coordenadaNoRecife(r.latitude, r.longitude);
    if (p) desativados.push({ lon: nucleo.arredondar(p.lon, 6), lat: nucleo.arredondar(p.lat, 6) });
    else desativadosSemPosicao++;
  }
  const gradeLuz = nucleo.criarGrade(desativados);
  linha(`  Iluminação 2025: ${f.mil(iluminacao.registros.length)} linhas -> ${f.mil(pontosDeLuz.size)} pontos (id_ponto único); ${desativados.length} desativados com posição, ${desativadosSemPosicao} sem`);

  // 6. Coleta: cada linha do roteiro vira uma rua do CNEFE, desempatada pelo centro do setor da coleta.
  const roteiros = coleta.registros.map((r) => nucleo.lerRoteiroDeColeta(r));
  const centroDoSetor = new Map();
  {
    const pontosDoSetor = new Map();
    for (const rot of roteiros) {
      const { rua, via } = nucleo.acharRua(geo, { logradouro: rot.rua });
      if (!rua || via !== "cidade") continue;
      if (geo.porCompleta.get(rua.completa)?.length !== 1) continue; // só ruas com nome único na cidade
      if (!pontosDoSetor.has(rot.setor)) pontosDoSetor.set(rot.setor, []);
      pontosDoSetor.get(rot.setor).push(rua.centro);
    }
    for (const [setor, pontos] of pontosDoSetor) {
      centroDoSetor.set(setor, { lon: nucleo.mediana(pontos.map((p) => p.lon)), lat: nucleo.mediana(pontos.map((p) => p.lat)) });
    }
  }
  const roteirosDaRua = new Map();
  let roteirosCasados = 0;
  for (const rot of roteiros) {
    const perto = centroDoSetor.get(rot.setor) ?? null;
    const { rua } = nucleo.acharRua(geo, { logradouro: rot.rua, perto });
    if (!rua) continue;
    if (perto && nucleo.haversineM(perto.lat, perto.lon, rua.centro.lat, rua.centro.lon) > RAIO_DO_SETOR_DA_COLETA_M) continue;
    roteirosCasados++;
    if (!roteirosDaRua.has(rua.id)) roteirosDaRua.set(rua.id, new Map());
    const chave = [rot.turno, rot.intervalo, rot.frequencia].join("|");
    roteirosDaRua.get(rua.id).set(chave, { turno: rot.turno, intervalo: rot.intervalo, frequencia: rot.frequencia });
  }
  linha(`  Coleta: ${roteiros.length} trechos de rua; ${roteirosCasados} casados com uma rua do CNEFE (${centroDoSetor.size} setores da coleta com centro); ${roteirosDaRua.size} ruas com roteiro`);

  // 7. Sinistros com vítima, 2022 a 2024.
  const viasSinistro = new Map();
  const pontosSinistro = [];
  let sinistrosLidos = 0;
  for (const { registros } of sinistros) {
    for (const r of registros) {
      sinistrosLidos++;
      const s = nucleo.lerSinistro(r);
      if (!s || s.data < PERIODO_DOS_SINISTROS.de || s.data > PERIODO_DOS_SINISTROS.ate) {
        contar(viasSinistro, "fora de 2022 a 2024");
        continue;
      }
      if (!s.comVitima) {
        contar(viasSinistro, "sem vítima");
        continue;
      }
      let g = s.numero !== null ? nucleo.geocodificar(geo, { logradouro: s.logradouro, numero: s.numero, bairro: s.bairro }) : null;
      if (!g && s.cruzamento) g = nucleo.geocodificarCruzamento(geo, { logradouro: s.logradouro, cruzamento: s.cruzamento, bairro: s.bairro });
      contar(viasSinistro, g ? `CNEFE (${g.precisao})` : "sem posição, descartado");
      if (g) pontosSinistro.push({ lon: g.lon, lat: g.lat, atropelamento: s.atropelamento });
    }
  }
  const gradeSinistro = nucleo.criarGrade(pontosSinistro);
  linha(`  Sinistros CTTU 2022 a 2024: ${f.mil(sinistrosLidos)} chamados -> ${textoDoMapa(viasSinistro)}`);

  // 8. Defesa Civil: por rua do CNEFE, só nos bairros cobertos.
  const bairrosCnefe = new Set(bairros.map(nomeNoCnefe));
  const dcPorRua = new Map();
  const viasDc = new Map();
  let dcLidos = 0;
  let dcNosBairros = 0;
  for (const { atendimentos } of defesaCivil) {
    for (const a of atendimentos) {
      dcLidos++;
      if (!a) continue;
      const b = nucleo.dobrar(a.bairro);
      if (!bairrosCnefe.has(b)) continue;
      dcNosBairros++;
      if (a.ano === null || a.ano < 2014 || a.ano > 2024) {
        contar(viasDc, "ano fora de 2014 a 2024");
        continue;
      }
      const { rua, via } = nucleo.acharRua(geo, { logradouro: a.rua, bairro: b });
      contar(viasDc, rua ? `rua ${via}` : "rua não achada no CNEFE");
      if (!rua) continue;
      if (!dcPorRua.has(rua.id)) dcPorRua.set(rua.id, { porAno: new Map(), ocorrencias: new Map(), grafias: new Map() });
      const resumo = dcPorRua.get(rua.id);
      contar(resumo.porAno, a.ano);
      contar(resumo.ocorrencias, nucleo.categoriaDaOcorrencia(a.ocorrencia));
      contar(resumo.grafias, a.rua);
    }
  }
  linha(`  Defesa Civil 2014 a 2024: ${f.mil(dcLidos)} linhas; ${f.mil(dcNosBairros)} nos ${bairros.length} bairros -> ${textoDoMapa(viasDc)}`);

  // 9. Por bairro e por edifício.
  const porBairro = {};
  const resumo = {};
  for (const slug of bairros) {
    const edificios = edificiosPorBairro[slug];
    const bairroCnefe = nomeNoCnefe(slug);
    const viasSetor = new Map();
    const setoresUsados = new Map();
    const setorPorEdificio = new Map();
    for (const e of edificios) {
      const [lon, lat] = e.centro;
      let setor = localizador.achar(lon, lat);
      if (setor) contar(viasSetor, "polígono da malha");
      else {
        // Fora de todo polígono (centro em rio ou borda): o setor do endereço do CNEFE, se ele existir na grade final.
        const g = nucleo.geocodificar(geo, { logradouro: e.logradouro, numero: e.numero, bairro: bairroCnefe, perto: { lon, lat } });
        const p = g && nucleo.haversineM(lat, lon, g.lat, g.lon) <= DISTANCIA_MAXIMA_DO_SETOR_M ? g : nucleo.enderecoMaisProximo(geo, lon, lat, RAIO_DO_ENDERECO_MAIS_PROXIMO_M);
        setor = p?.setor && areaDoSetor.has(p.setor) ? p.setor : null;
        contar(viasSetor, setor ? "endereço do CNEFE" : "sem setor");
      }
      setorPorEdificio.set(e.id, setor);
      if (setor) contar(setoresUsados, setor);
    }
    const codigos = [...setoresUsados.keys()].sort();
    const indiceDoSetor = new Map(codigos.map((c, i) => [c, i]));
    const setores = codigos.map((codigo) => {
      const s = entornoDoSetor.get(codigo);
      return {
        codigo,
        areaDePonderacao: areaDoSetor.get(codigo) ?? null,
        domicilios: s?.domicilios ?? null,
        onibus: s?.onibus ?? null,
        calcada: s?.calcada ?? null,
        obstaculo: s?.obstaculo ?? null,
        rampa: s?.rampa ?? null,
        arvores: s?.arvores ?? null,
      };
    });
    const areasUsadas = [...new Set(setores.map((s) => s.areaDePonderacao).filter(Boolean))].sort();
    const areasDePonderacao = areasUsadas
      .filter((a) => alugadosDaArea.has(a))
      .map((codigo) => ({ codigo, domicilios: alugadosDaArea.get(codigo).domicilios, alugados: alugadosDaArea.get(codigo).alugados, bairros: bairrosDaArea(codigo) }));

    // LUSE e luz desativada: os pontos a até 150 m de algum edifício do bairro; o app mede a distância de cada prédio.
    const luseUsada = new Set();
    const luzUsada = new Set();
    for (const e of edificios) {
      const [lon, lat] = e.centro;
      for (const { i } of nucleo.pontosNoRaio(gradeLuse, lon, lat, RAIO_M)) luseUsada.add(i);
      for (const { i } of nucleo.pontosNoRaio(gradeLuz, lon, lat, RAIO_M)) luzUsada.add(i);
    }
    const locaisLuse = [...luseUsada].sort((a, b) => a - b).map((i) => {
      const l = luse.locais[i];
      return { centro: l.centro, vigente: l.vigente, ultimaEntrada: l.ultimaEntrada };
    });
    const pontosDesativados = [...luzUsada].sort((a, b) => a - b).map((i) => [desativados[i].lon, desativados[i].lat]);

    // Ruas do IPTU: o código vem do id do edifício (`${Código Logradouro}-${numero}`).
    const ruasDoIptu = new Map();
    for (const e of edificios) {
      const codigo = e.id.split("-")[0];
      if (!ruasDoIptu.has(codigo)) ruasDoIptu.set(codigo, []);
      ruasDoIptu.get(codigo).push(e);
    }
    const logradouros = {};
    let ruasCasadas = 0;
    let ruasComColeta = 0;
    let ruasComDc = 0;
    let atendimentosDc = 0;
    for (const codigo of [...ruasDoIptu.keys()].sort((a, b) => Number(a) - Number(b))) {
      const daRua = ruasDoIptu.get(codigo);
      const nome = nucleo.moda(daRua.map((e) => e.logradouro));
      const perto = { lon: nucleo.mediana(daRua.map((e) => e.centro[0])), lat: nucleo.mediana(daRua.map((e) => e.centro[1])) };
      const { rua } = nucleo.acharRua(geo, { logradouro: nome, bairro: bairroCnefe, perto });
      if (!rua) {
        logradouros[codigo] = { ruaCasada: false, coleta: [], defesaCivil: null };
        continue;
      }
      ruasCasadas++;
      const coletaDaRua = [...(roteirosDaRua.get(rua.id)?.values() ?? [])].sort(
        (a, b) => nucleo.ordemTexto(a.turno ?? "", b.turno ?? "") || nucleo.ordemTexto(a.intervalo ?? "", b.intervalo ?? "") || nucleo.ordemTexto(a.frequencia ?? "", b.frequencia ?? ""),
      );
      if (coletaDaRua.length) ruasComColeta++;
      const dc = dcPorRua.get(rua.id);
      const total = dc ? [...dc.porAno.values()].reduce((s, n) => s + n, 0) : 0;
      if (total) {
        ruasComDc++;
        atendimentosDc += total;
      }
      logradouros[codigo] = {
        ruaCasada: true,
        coleta: coletaDaRua.slice(0, 6),
        defesaCivil: {
          atendimentos: total,
          // A grafia mais frequente na publicação (empate: a primeira em ordem alfabética), para a pessoa reconhecer a rua.
          grafia: dc ? [...dc.grafias.entries()].sort((a, b) => b[1] - a[1] || nucleo.ordemTexto(a[0], b[0]))[0][0] : null,
          porAno: dc ? [...dc.porAno.entries()].sort((a, b) => a[0] - b[0]) : [],
          ocorrencias: dc ? [...dc.ocorrencias.entries()].sort((a, b) => b[1] - a[1] || nucleo.ordemTexto(a[0], b[0])) : [],
        },
      };
    }

    // Por edifício: setor, 156 e sinistros a até 150 m.
    let comLampada = 0;
    let comDrenagem = 0;
    let comEntulho = 0;
    let comSinistro = 0;
    const todosOs156 = [];
    const todosOsSinistros = [];
    for (const e of edificios) {
      const [lon, lat] = e.centro;
      const porCategoria = Object.fromEntries(nucleo.CATEGORIAS_DO_156.map((c) => [c, { n: 0, dias: [] }]));
      for (const { i } of nucleo.pontosNoRaio(grade156, lon, lat, RAIO_M)) {
        const p = pontos156[i];
        porCategoria[p.categoria].n++;
        if (p.dias !== null) porCategoria[p.categoria].dias.push(p.dias);
      }
      let comVitima = 0;
      let atropelamentos = 0;
      for (const { i } of nucleo.pontosNoRaio(gradeSinistro, lon, lat, RAIO_M)) {
        comVitima++;
        if (pontosSinistro[i].atropelamento) atropelamentos++;
      }
      const setor = setorPorEdificio.get(e.id);
      // Tupla do contrato (esquemaRuaDoEdificio): [setor, drenagem, dias, lâmpada, dias, entulho, dias, com vítima, atropelamentos].
      e.rua = [
        setor ? indiceDoSetor.get(setor) : null,
        ...nucleo.CATEGORIAS_DO_156.flatMap((c) => [porCategoria[c].n, medianaInteira(porCategoria[c].dias)]),
        comVitima,
        atropelamentos,
      ];
      if (porCategoria.lampada.n) comLampada++;
      if (porCategoria.drenagem.n) comDrenagem++;
      if (porCategoria.entulho.n) comEntulho++;
      if (comVitima) comSinistro++;
      todosOs156.push(porCategoria.drenagem.n + porCategoria.lampada.n + porCategoria.entulho.n);
      todosOsSinistros.push(comVitima);
    }

    porBairro[slug] = { setores, areasDePonderacao, luse: locaisLuse, iluminacaoDesativada: pontosDesativados, logradouros };

    const n = edificios.length;
    const comSetor = edificios.filter((e) => e.rua[0] !== null).length;
    const comLuseVigente = edificios.filter((e) =>
      locaisLuse.some((l) => l.vigente && nucleo.haversineM(e.centro[1], e.centro[0], l.centro[1], l.centro[0]) <= RAIO_M),
    ).length;
    const comLuzDesativada = edificios.filter((e) =>
      pontosDesativados.some((p) => nucleo.haversineM(e.centro[1], e.centro[0], p[1], p[0]) <= RAIO_M),
    ).length;
    const comColeta = edificios.filter((e) => logradouros[e.id.split("-")[0]].coleta.length > 0).length;
    const comDc = edificios.filter((e) => (logradouros[e.id.split("-")[0]].defesaCivil?.atendimentos ?? 0) > 0).length;
    const setorComEntorno = setores.filter((s) => s.domicilios !== null).length;
    const pctAlugados = areasDePonderacao.map((a) => `${a.codigo.slice(7)} ${porcento(a.alugados, a.domicilios)} (${a.bairros.join(", ")})`).join("; ");
    resumo[slug] = {
      edificios: n, comSetor, setores: setores.length, setorComEntorno, areas: areasDePonderacao.length, comLuseVigente, locaisLuse: locaisLuse.length,
      comDrenagem, comLampada, comEntulho, comLuzDesativada, luzDesativada: pontosDesativados.length, ruas: ruasDoIptu.size, ruasCasadas,
      ruasComColeta, comColeta, ruasComDc, comDc, atendimentosDc, comSinistro,
      mediana156: nucleo.mediana(todosOs156), medianaSinistros: nucleo.mediana(todosOsSinistros),
    };
    linha(`  ${slug.padEnd(11)} setor: ${comSetor}/${n} edifícios (${textoDoMapa(viasSetor)}); ${setores.length} setores, ${setorComEntorno} com entorno do Censo; áreas de ponderação: ${pctAlugados}`);
    linha(`              LUSE: ${locaisLuse.length} locais a 150 m de algum prédio (${locaisLuse.filter((l) => l.vigente).length} vigentes); prédios com LUSE vigente a 150 m ${comLuseVigente}/${n}`);
    linha(`              156 em 12 meses a 150 m: prédios com drenagem ${comDrenagem}, lâmpada ${comLampada}, entulho ${comEntulho} (de ${n}); mediana de pedidos por prédio ${resumo[slug].mediana156}`);
    linha(`              iluminação desativada: ${pontosDesativados.length} pontos; prédios com algum a 150 m ${comLuzDesativada}/${n}`);
    linha(`              ruas do IPTU ${ruasDoIptu.size}: casadas com o CNEFE ${ruasCasadas} (${porcento(ruasCasadas, ruasDoIptu.size)}); com roteiro de coleta ${ruasComColeta} (prédios ${comColeta}/${n}); com Defesa Civil ${ruasComDc} (${atendimentosDc} atendimentos; prédios ${comDc}/${n})`);
    linha(`              sinistros com vítima 2022 a 2024 a 150 m: prédios com algum ${comSinistro}/${n}; mediana por prédio ${resumo[slug].medianaSinistros}`);
  }

  // 10. Fontes do meta.json.
  const fonteDaPrefeitura = (chave, nome, recursos, registrosLidos, colunasUsadas, periodo) => {
    const pacote = metas.get(recursos[0]).pacote;
    return {
      chave,
      nome,
      orgao: pacote.orgao ? `Prefeitura da Cidade do Recife · ${pacote.orgao.trim()}` : "Prefeitura da Cidade do Recife",
      licenca: "ODbL",
      url: `https://dados.recife.pe.gov.br/dataset/${pacote.nome}`,
      recursos,
      modificadoEm: recursos.map((id) => metas.get(id).modificadoEm).filter(Boolean).sort().at(-1) ?? null,
      consultadoEm: geradoEm,
      registrosLidos,
      colunasUsadas,
      periodo,
    };
  };
  const fonteDoIbge = (chave, nome, url, recursos, modificadoEm, registrosLidos, colunasUsadas) => ({
    chave, nome, orgao: "IBGE · Censo Demográfico 2022", licenca: "Citar o IBGE", url, recursos, modificadoEm,
    consultadoEm: geradoEm, registrosLidos, colunasUsadas, periodo: { de: "2022-01-01", ate: "2022-12-31" },
  });
  const soma = (lista) => lista.reduce((s, x) => s + x.lidos, 0);
  const fontes = [
    fonteDaPrefeitura("licenciamento_ambiental", "Licenciamento Ambiental (licença de utilização sonora, LUSE)", [RECURSO_AMBIENTAL], ambiental.registros.length, CAMPOS_AMBIENTAL, null),
    fonteDaPrefeitura("central_156", "Central 156 da Emlurb (drenagem, lâmpada apagada e entulho)", RECURSOS_156.map((r) => r.id), soma(pedidos156), CAMPOS_156, { de: inicio156, ate: fim156 }),
    fonteDaPrefeitura("iluminacao", "Iluminação pública do Recife 2025 (pontos desativados)", [RECURSO_ILUMINACAO], iluminacao.lidos, CAMPOS_ILUMINACAO, null),
    fonteDaPrefeitura("coleta", "Roteiro da coleta domiciliar", [RECURSO_COLETA], coleta.lidos, CAMPOS_COLETA, null),
    fonteDaPrefeitura("sinistros", "Sinistros de trânsito com vítima (CTTU)", RECURSOS_SINISTROS.map((r) => r.id), soma(sinistros), CAMPOS_SINISTROS, PERIODO_DOS_SINISTROS),
    fonteDaPrefeitura("defesa_civil", "Atendimentos da Defesa Civil", RECURSOS_DEFESA_CIVIL.map((r) => r.id), soma(defesaCivil), CAMPOS_DEFESA_CIVIL, PERIODO_DA_DEFESA_CIVIL),
    fonteDoIbge("cnefe", "CNEFE 2022 (endereços do Censo, sem complemento)", CNEFE.pagina, [CNEFE.arquivo], cnefe.modificadoEm, cnefe.linhas.length, nucleo.COLUNAS_DO_CNEFE),
    fonteDoIbge(
      "censo_entorno", "Censo 2022: características urbanísticas do entorno e malha de setores", ENTORNO.pagina,
      [decodeURIComponent(ENTORNO.arquivo), MALHA.arquivo],
      [entorno.modificadoEm, malha.modificadoEm].filter(Boolean).sort().at(-1) ?? null,
      entorno.setores.length + malha.setores.length, [...COLUNAS_DO_ENTORNO, ...COLUNAS_DA_MALHA],
    ),
    fonteDoIbge(
      "censo_amostra", "Censo 2022: domicílios por condição de ocupação, por área de ponderação", AMOSTRA.pagina,
      [`${AMOSTRA.arquivo} (${AMOSTRA.tabela})`, decodeURIComponent(COMPOSICAO.arquivo)],
      [alugados.modificadoEm, composicao.modificadoEm].filter(Boolean).sort().at(-1) ?? null,
      alugados.areas.length + composicao.setores.length, [...COLUNAS_DA_AMOSTRA, "Setor", "Área de Ponderação"],
    ),
  ];
  for (const fonte of fontes) conferirListaBranca(fonte.nome, fonte.colunasUsadas);

  return { porBairro, fontes, relatorio, resumo };
}

/** "AV   Conselheiro Aguiar" (156) → "AV Conselheiro Aguiar". */
function limparEspacos(texto) {
  return String(texto ?? "").replace(/\s+/g, " ").trim();
}
