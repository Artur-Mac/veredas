#!/usr/bin/env node
/**
 * Constrói o índice cadastral: cinco bairros históricos ou 94 partições em staging com --todos-bairros.
 *
 * Uso: node scripts/dados/construir-indice-recife.mjs [--sem-lotes] [--sem-rua]
 *
 * As camadas "A rua" (v1.1: geocodificador pelo CNEFE do IBGE, Censo 2022, LUSE, Central 156, iluminação, coleta,
 * sinistros e Defesa Civil) moram em scripts/dados/rua/ e entram em cada edifício (`rua`), em cada bairro (`rua`) e no
 * meta.json (`fontesDaRua`). Ver a revisão 2.6 da ordem do arquiteto.
 *
 * Lê só dados abertos da Prefeitura do Recife (CKAN, licença ODbL), sempre com lista branca de colunas
 * (`fields`), e grava em src/dados/recife/indice/ um JSON por bairro mais o meta.json, no formato de
 * src/dados/contratos.ts (esquemaIndiceDoBairro e esquemaMetaDoIndice). Node >= 20, sem dependências.
 *
 * Regras que o script cumpre (ordem do arquiteto, Fatia 3 e C7):
 * - O portal devolve no máximo 500 linhas por requisição: pagina até o `total` e aborta se o número de
 *   linhas lidas for diferente dele.
 * - As respostas brutas ficam em .cache/dados-recife/ (fora do git). Com o cache, uma segunda execução gera
 *   arquivos idênticos: o carimbo `geradoEm` também mora no cache.
 * - Colunas pessoais ou desnecessárias nunca são pedidas nem gravadas, nem no cache (ver COLUNAS_PROIBIDAS).
 * - Valor desconhecido nunca vira zero: vira null ou fica fora da conta.
 * - Licenciamento: licença INDEFERIDA, CANCELADA, ARQUIVADA, com DESISTÊNCIA ou EXTINTA não conta em nada; as
 *   válidas são deduplicadas por (lote ou coordenada) + categoria + mês, e cada chave conta uma vez.
 * - Prédios sem coordenada no IPTU entram: o centro é a mediana das coordenadas do grupo; sem nenhuma, o lote
 *   é procurado pelo endereço (NMENDCOMP da base de Lotes, só lido para casar, nunca gravado). Com o mesmo
 *   número e o mesmo bairro, vale o nome da rua igual (sem acento, sem caixa, sem tipo de via) e, se não houver
 *   nenhum lote assim, o nome da rua que for prefixo, palavra por palavra, do outro (rua renomeada: "AV BEIRA
 *   RIO GOVERNADOR EDUARDO CAMPOS" no IPTU e "Avenida Beira Rio" no lote), desde que o mais curto tenha 2
 *   palavras ou mais e haja um único lote assim.
 * - Pavimentos: o do lote só fica se não contradisser o IPTU. Lote com QTDPAVIMENTOS <= 4 e IPTU dizendo
 *   "> 4 Pavimentos" (ate4Pavimentos false) grava pavimentos null: as fontes divergem e o relatório conta quantos.
 */

import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { dsqflsDaLuse, lerLicenciamentoAmbiental, montarARua } from "./rua/camadas.mjs";
import { planejarPaginas } from "./paginacao.mjs";

const SEM_LOTES = process.argv.includes("--sem-lotes");
/** Sem as camadas "A rua" da v1.1 (CNEFE, Censo, LUSE, 156, iluminação, coleta, CTTU e Defesa Civil). */
const SEM_RUA = process.argv.includes("--sem-rua");
/** Expansão municipal sempre em staging; nunca substitui o índice habilitado no app. */
const TODOS_BAIRROS = process.argv.includes("--todos-bairros");

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR_CACHE = path.join(RAIZ, ".cache", "dados-recife");
const DIR_SAIDA = TODOS_BAIRROS ? path.join(DIR_CACHE, "indice-municipal-staging") : path.join(RAIZ, "src", "dados", "recife", "indice");

// ——— Constantes —————————————————————————————————————————————————————————————————

const API = "https://dados.recife.pe.gov.br/api/3/action/";
const SITE = "https://dados.recife.pe.gov.br";
const TENTATIVAS = 3;
const TEMPO_LIMITE_MS = 30_000;
const CONCORRENCIA = 6;
const LIMITE_PEDIDO = 500;

const BAIRROS_INICIAIS = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];
const bairrosMunicipais = TODOS_BAIRROS ? JSON.parse(fs.readFileSync(path.join(DIR_CACHE, "bairros.json"), "utf8")).registros : [];
if (TODOS_BAIRROS && (bairrosMunicipais.length !== 94 || bairrosMunicipais.some(b => typeof b.Bairro !== "string"))) {
  throw new Error("A expansão exige o cache oficial validado dos 94 bairros.");
}
const slugDoBairro = nome => dobrar(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const BAIRROS_COBERTOS = TODOS_BAIRROS ? [...new Set([...BAIRROS_INICIAIS, ...bairrosMunicipais.map(b => slugDoBairro(b.Bairro))])] : BAIRROS_INICIAIS;
if (TODOS_BAIRROS && BAIRROS_COBERTOS.length !== 94) throw new Error("Slugs municipais inconsistentes; expansão cancelada.");

// Cópia de GRAFIAS_NO_CADASTRO de src/dados/recife/bairros.ts (arquivo .ts do arquiteto, que o Node 20 não
// importa). Valores exatos da coluna `bairro` do IPTU 2026 e do ITBI; o filtro da API é exato. Se mudar lá,
// mude aqui.
const GRAFIAS_NO_CADASTRO = {
  "boa-viagem": ["Boa Viagem"],
  "casa-forte": ["Casa Forte"],
  gracas: ["Gracas", "Graças"],
  espinheiro: ["Espinheiro"],
  madalena: ["Madalena"],
};
for (const b of bairrosMunicipais) {
  const slug = slugDoBairro(b.Bairro);
  if (!GRAFIAS_NO_CADASTRO[slug]) {
    const preposicoes = b.Bairro.replace(/\b(Do|Da|Dos|Das|De|E)\b/g, palavra => palavra.toLowerCase());
    GRAFIAS_NO_CADASTRO[slug] = [...new Set([b.Bairro, preposicoes])];
  }
}

/** Grafia do bairro (sem acento, minúscula) → slug. Serve ao IPTU, ao ITBI e ao endereço do lote. */
const bairroDaGrafia = new Map();
for (const slug of BAIRROS_COBERTOS) for (const g of GRAFIAS_NO_CADASTRO[slug]) bairroDaGrafia.set(dobrar(g), slug);

/** Colunas que nunca podem ser pedidas à API nem gravadas (ordem do arquiteto, seção 1.2). */
const COLUNAS_PROIBIDAS = [
  "Número do contribuinte",
  "CPF/CNPJ mascarado do contribuinte",
  "tipo de contribuinte",
  "complemento",
  "Regime de Tributação do iptu",
  "Regime de Tributação da trsd",
  "cnpj",
  "razao_social",
  "razao_social_mercantil",
  "inscricao_mercantil",
  "endereco_empreendimento",
];

const RECURSO_IPTU_2026 = "9a847338-92a6-4b74-b3e8-c8f8b57aff2d";
const CAMPOS_IPTU = [
  "logradouro",
  "numero",
  "Código Logradouro",
  "AREA CONSTRUIDA",
  "valor cobrado de IPTU",
  "ano da construção corrigido",
  "tipo de uso do imóvel",
  "tipo de padrão da construção",
  "Tipo de Construção",
  "Tipo de Empreendimento",
  "latitude",
  "longitude",
];

const RECURSOS_ITBI = [
  { ano: 2026, id: "fc95e204-a121-4b7a-94b2-e4420539c0d1" },
  { ano: 2025, id: "1d705d4a-f67a-4914-971f-01f9b1685d1b" },
  { ano: 2024, id: "756d9a7e-33aa-4fdd-a541-0f5dc97c7502" },
  { ano: 2023, id: "47dfea23-81ec-455e-83a0-3e451e5b5ca6" },
  { ano: 2022, id: "5226cf6f-ed06-4956-b133-a0c788a5d494" },
  { ano: 2021, id: "f3a083a1-aa48-416d-b3aa-c022192219e6" },
  { ano: 2020, id: "6f79d820-b764-4cde-939f-83d80e728c53" },
  { ano: 2019, id: "6a8a8f7e-8d3d-4729-aaf9-fcc43ae2827a" },
  { ano: 2018, id: "ae29c630-77b8-4109-8e1b-02292069f4d5" },
  { ano: 2017, id: "53617998-09e8-420c-9399-75d859c8528e" },
  { ano: 2016, id: "210db9b0-4ea5-49cb-8084-135ebfca848d" },
];
const CAMPOS_ITBI = [
  "cod_logradouro",
  "numero",
  "bairro",
  "valor_avaliacao",
  "area_construida",
  "data_transacao",
  "tipo_imovel",
  "latitude",
  "longitude",
];

const RECURSO_LICENCIAMENTO = "39927a3d-3235-436a-9dc8-df7f4ea3b720";
const CAMPOS_LICENCIAMENTO = [
  "dsqfl",
  "tipo_processo",
  "assunto",
  "data_entrada",
  "situacao_processo",
  "latitude",
  "longitude",
  "categoria_empreendimento",
];

const RECURSO_LOTES = "c41ee0d0-bb33-4380-8809-2e9082d79ab0";
// Nomes reais das propriedades da base de Lotes (conferidos em 20/10/2026; não são os do dicionário).
// NMENDCOMP (endereço por extenso do lote) só é lido para casar o endereço do IPTU com o lote; o valor nunca é gravado.
const COLUNAS_LOTES = ["DSQFL", "QTDPAVIMENTOS", "NMEDIFICACAO", "NMENDCOMP", "geometry"];

const RECURSO_BAIRROS = "a378d50a-5e55-4956-a28c-13305acfc2b3";
const CAMPOS_BAIRROS = ["Bairro", "rpa"];

/** Primeiro dia da série útil de licenças de obra (2017 tem só 395 registros). */
const INICIO_DA_SERIE = "2018-01-01";
const RAIO_OBRAS_M = 150;
const MAX_VERTICES = 24;
const MAX_TIPOLOGIAS = 60;
const MAX_RECENTES = 10;

/**
 * Licença sem efeito: `situacao_processo` que, sem acento e em minúsculas, contém um destes trechos
 * (indeferido, cancelado, arquivado, desistência, extinto). Não conta em nada.
 */
const SITUACOES_EXCLUIDAS = ["indefer", "cancel", "arquiv", "desist", "extint"];

/** Tipos de via que não entram na comparação de logradouros (já sem acento e em minúsculas). */
const TIPOS_DE_VIA = new Set(["rua", "r", "av", "avenida", "est", "estrada", "prc", "praca", "pca", "tv", "travessa"]);

const CONSTRUCAO = new Set([
  "ALVARA DE CONSTRUCAO INICIAL",
  "APROVACAO DE PROJETO INICIAL",
  "ALVARA DE CONSTRUCAO/LEGALIZACAO",
]);

/** Região generosa do Recife; coordenada fora dela é tratada como ausente. */
const REGIAO = { latMin: -8.35, latMax: -7.75, lonMin: -35.2, lonMax: -34.75 };

/**
 * Referência medida pelo arquiteto em 20/10/2026 (ordem, C7). Só serve para avisar na saída quando uma
 * contagem foge de 5%: nunca altera o resultado.
 */
const REFERENCIA_C7 = {
  "boa-viagem": { iptu: 71237, edificios: 1818 },
  "casa-forte": { iptu: 3247, edificios: 78 },
  gracas: { iptu: 11373, edificios: 283 },
  espinheiro: { iptu: 6533, edificios: 154 },
  madalena: { iptu: 12805, edificios: 214 },
};
const REFERENCIA_C7_LICENCIAMENTO = 39067;
const REFERENCIA_C7_LOTES = 114079;

// ——— Utilitários ————————————————————————————————————————————————————————————————

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function arredondar(n, casas) {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
}
const r2 = (n) => arredondar(n, 2);
const r6 = (n) => arredondar(n, 6);

/** Minúsculas, sem acento e com espaços simples: serve só para comparar. */
function dobrar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function limpar(texto) {
  return String(texto ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

/**
 * Decimal do portal: ora número, ora texto com vírgula ("26,56"), ora texto com ponto ("343000.00").
 * Com vírgula, o ponto é separador de milhar. Vazio e inválido viram null, nunca 0.
 */
function numero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (valor === null || valor === undefined) return null;
  let t = String(valor).trim();
  if (t === "") return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function inteiroPositivo(valor) {
  const n = numero(valor);
  return n !== null && Number.isInteger(n) && n > 0 ? n : null;
}

function soDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

/** Logradouro para comparar: sem acento, sem caixa, sem pontuação e sem o tipo de via (RUA, AV, EST, PRC...). */
function logradouroSemTipo(texto) {
  const palavras = dobrar(texto)
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean);
  if (palavras.length > 1 && TIPOS_DE_VIA.has(palavras[0])) palavras.shift();
  return palavras.join(" ");
}

/** Chave de um número num bairro (o slug, que absorve as grafias): onde se procuram os lotes de um endereço. */
function chaveDeNumero(numeroDoImovel, slug) {
  return `${numeroDoImovel}|${slug}`;
}

/**
 * Nomes de rua (já sem acento, sem caixa e sem tipo de via) compatíveis quando o mais curto tem 2 palavras ou
 * mais e é prefixo do outro, palavra por palavra ("beira rio" e "beira rio governador eduardo campos"). Serve
 * às ruas renomeadas; a igualdade exata é tratada antes e não passa por aqui.
 */
function ruasCompativeisPorPrefixo(a, b) {
  const pa = a.split(" ").filter(Boolean);
  const pb = b.split(" ").filter(Boolean);
  const [curto, longo] = pa.length <= pb.length ? [pa, pb] : [pb, pa];
  return curto.length >= 2 && curto.every((palavra, i) => palavra === longo[i]);
}

/**
 * Endereço por extenso do lote ("Rua Visconde de Inhauma,  14, Afogados, Recife - Pernambuco, CEP  50820-490")
 * em { logradouro, numero, bairro }. Lê de trás para a frente, porque o nome da rua pode ter vírgula.
 * null se o formato for outro ou o número não for só dígitos. Só serve para casar; o texto nunca é gravado.
 */
function lerEnderecoDoLote(texto) {
  if (typeof texto !== "string") return null;
  const partes = texto.split(",").map((p) => p.trim());
  if (partes.length < 5) return null;
  const numeroTexto = partes[partes.length - 4];
  if (!/^\d{1,6}$/.test(numeroTexto)) return null;
  const numeroDoImovel = Number(numeroTexto);
  if (numeroDoImovel <= 0) return null;
  const logradouro = partes.slice(0, partes.length - 4).join(",");
  if (logradouro === "") return null;
  return { logradouro, numero: numeroDoImovel, bairro: partes[partes.length - 3] };
}

function situacaoValida(situacao) {
  const s = dobrar(situacao);
  return !SITUACOES_EXCLUIDAS.some((trecho) => s.includes(trecho));
}

function dentroDaRegiao(lat, lon) {
  return lat >= REGIAO.latMin && lat <= REGIAO.latMax && lon >= REGIAO.lonMin && lon <= REGIAO.lonMax;
}

/** Latitude e longitude como número, ou null se faltar ou estiver fora do Recife. */
function coordenadaValida(latBruta, lonBruta) {
  const lat = numero(latBruta);
  const lon = numero(lonBruta);
  if (lat === null || lon === null || (lat === 0 && lon === 0)) return null;
  return dentroDaRegiao(lat, lon) ? { lat, lon } : null;
}

/** Interpolação linear entre vizinhos, como o padrão do numpy. `ordenados` já vem em ordem crescente. */
function percentil(ordenados, p) {
  const n = ordenados.length;
  if (n === 1) return ordenados[0];
  const pos = p * (n - 1);
  const i = Math.floor(pos);
  if (i >= n - 1) return ordenados[n - 1];
  return ordenados[i] + (pos - i) * (ordenados[i + 1] - ordenados[i]);
}

function mediana(valores) {
  const o = valores.slice().sort((a, b) => a - b);
  return o.length ? percentil(o, 0.5) : null;
}

/** { n, p25, mediana, p75 } com 2 casas, ou null se não houver valores. O chamador já tirou os inválidos. */
function quartis(valores) {
  if (valores.length === 0) return null;
  const o = valores.slice().sort((a, b) => a - b);
  return { n: o.length, p25: r2(percentil(o, 0.25)), mediana: r2(percentil(o, 0.5)), p75: r2(percentil(o, 0.75)) };
}

/** Valor mais frequente; empate vai para o menor valor, para a saída não depender da ordem de leitura. */
function moda(valores) {
  const contagem = new Map();
  for (const v of valores) {
    if (v === null || v === undefined) continue;
    contagem.set(v, (contagem.get(v) ?? 0) + 1);
  }
  let melhor = null;
  let max = 0;
  for (const [v, c] of contagem) {
    if (c > max || (c === max && v < melhor)) {
      melhor = v;
      max = c;
    }
  }
  return melhor;
}

function haversineM(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ordemTexto(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function lerJson(caminho) {
  if (!fs.existsSync(caminho)) return null;
  try {
    return JSON.parse(fs.readFileSync(caminho, "utf-8"));
  } catch {
    return null;
  }
}

function gravarAtomico(caminho, conteudo) {
  const temporario = `${caminho}.tmp`;
  fs.writeFileSync(temporario, conteudo);
  fs.renameSync(temporario, caminho);
}

function aviso(texto) {
  console.log(`  ! ${texto}`);
}

function porcentagem(parte, total) {
  return total === 0 ? "n/d" : `${((parte / total) * 100).toFixed(1)}%`;
}

function mil(n) {
  return n.toLocaleString("pt-BR");
}

// ——— Geometria ——————————————————————————————————————————————————————————————————
// Anéis são listas de [lon, lat] (GeoJSON, CRS84, o mesmo do IPTU).

function areaDoAnel(anel) {
  let soma = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    soma += anel[j][0] * anel[i][1] - anel[i][0] * anel[j][1];
  }
  return Math.abs(soma) / 2;
}

function centroideDoAnel(anel) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const f = anel[j][0] * anel[i][1] - anel[i][0] * anel[j][1];
    a += f;
    cx += (anel[j][0] + anel[i][0]) * f;
    cy += (anel[j][1] + anel[i][1]) * f;
  }
  if (Math.abs(a) < 1e-18) {
    const lon = anel.reduce((s, p) => s + p[0], 0) / anel.length;
    const lat = anel.reduce((s, p) => s + p[1], 0) / anel.length;
    return [r6(lon), r6(lat)];
  }
  return [r6(cx / (3 * a)), r6(cy / (3 * a))];
}

function pontoNoAnel(lon, lat, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Anel externo contém o ponto e nenhum buraco o contém. `parte` = [externo, ...buracos]. */
function pontoNaParte(lon, lat, parte) {
  if (!pontoNoAnel(lon, lat, parte[0])) return false;
  for (let i = 1; i < parte.length; i++) if (pontoNoAnel(lon, lat, parte[i])) return false;
  return true;
}

function distanciaAoSegmento(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Douglas–Peucker numa linha aberta; devolve os vértices mantidos, com as duas pontas. */
function douglasPeucker(pontos, tolerancia) {
  if (pontos.length <= 2) return pontos.slice();
  let maior = 0;
  let indice = 0;
  for (let i = 1; i < pontos.length - 1; i++) {
    const d = distanciaAoSegmento(pontos[i], pontos[0], pontos[pontos.length - 1]);
    if (d > maior) {
      maior = d;
      indice = i;
    }
  }
  if (maior <= tolerancia) return [pontos[0], pontos[pontos.length - 1]];
  const esquerda = douglasPeucker(pontos.slice(0, indice + 1), tolerancia);
  const direita = douglasPeucker(pontos.slice(indice), tolerancia);
  return esquerda.slice(0, -1).concat(direita);
}

/** Anel fechado (sem repetir o primeiro vértice): ancora no vértice 0 e no mais distante dele. */
function simplificarAnelFechado(anel, tolerancia) {
  let ancora = 1;
  let maior = -1;
  for (let i = 1; i < anel.length; i++) {
    const d = Math.hypot(anel[i][0] - anel[0][0], anel[i][1] - anel[0][1]);
    if (d > maior) {
      maior = d;
      ancora = i;
    }
  }
  const ida = douglasPeucker(anel.slice(0, ancora + 1), tolerancia);
  const volta = douglasPeucker(anel.slice(ancora).concat([anel[0]]), tolerancia);
  return ida.slice(0, -1).concat(volta.slice(0, -1));
}

/**
 * Polígono do lote para o app: anel externo sem o vértice de fechamento, 6 casas decimais, sem vértices
 * repetidos; só simplifica acima de 24 vértices (Douglas–Peucker com tolerância de 0,00001° e aumentando).
 * null se sobrar menos de 3 vértices.
 */
function poligonoDoLote(anelGeoJson) {
  const aberto = [];
  for (const [lon, lat] of anelGeoJson) {
    const p = [r6(lon), r6(lat)];
    const ultimo = aberto[aberto.length - 1];
    if (!ultimo || ultimo[0] !== p[0] || ultimo[1] !== p[1]) aberto.push(p);
  }
  while (aberto.length > 1 && aberto[0][0] === aberto[aberto.length - 1][0] && aberto[0][1] === aberto[aberto.length - 1][1]) {
    aberto.pop();
  }
  if (aberto.length < 3) return null;
  if (aberto.length <= MAX_VERTICES) return aberto;
  let tolerancia = 0.00001;
  let ultimoValido = null;
  for (let i = 0; i < 60; i++) {
    const s = simplificarAnelFechado(aberto, tolerancia);
    if (s.length >= 3) ultimoValido = s;
    if (s.length >= 3 && s.length <= MAX_VERTICES) return s;
    tolerancia *= 1.5;
  }
  // Não deveria acontecer; mantém uma amostra regular dos vértices em vez de inventar forma.
  const passo = aberto.length / MAX_VERTICES;
  return ultimoValido && ultimoValido.length <= MAX_VERTICES
    ? ultimoValido
    : Array.from({ length: MAX_VERTICES }, (_, i) => aberto[Math.floor(i * passo)]);
}

// ——— Texto: nome do edifício ————————————————————————————————————————————————————

const PALAVRAS_MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "a", "o", "as", "os", "para", "por", "com"]);
const ALGARISMO_ROMANO = /^(?:XXX|XX|X)?(?:IX|IV|V?I{0,3})$/;

function ehRomano(token, ultimo) {
  const t = token.toUpperCase();
  return t !== "" && /^[IVX]+$/.test(t) && ALGARISMO_ROMANO.test(t) && (t.length >= 2 || ultimo);
}

function capitalizar(minusculo) {
  return minusculo.replace(/(^|[-/('’])(\p{L})/gu, (_, antes, letra) => antes + letra.toLocaleUpperCase("pt-BR"));
}

/**
 * `NMEDIFICACAO` da base de Lotes → nome para exibir: tira o prefixo EDF/EDIF/EDIFICIO, espaços simples,
 * caixa de título ("EDF  PARADOR  DE  CERVANTES" → "Parador de Cervantes"). null se não sobrar nome.
 */
function normalizarNomeEdificio(bruto) {
  if (typeof bruto !== "string") return null;
  let t = limpar(bruto);
  const prefixo = /^(edificio|edif|edf)(?:[.\s/:\-]+|$)/.exec(dobrar(t));
  if (prefixo) t = t.slice(prefixo[0].length);
  t = t.replace(/^[\s\-–.,:;]+|[\s\-–.,:;]+$/g, "");
  if ((t.match(/\p{L}/gu) ?? []).length < 2) return null;
  const tokens = t.split(" ");
  const saida = tokens.map((token, i) => {
    if (ehRomano(token, i === tokens.length - 1 && tokens.length > 1)) return token.toUpperCase();
    const minusculo = token.toLocaleLowerCase("pt-BR");
    return i > 0 && PALAVRAS_MINUSCULAS.has(minusculo) ? minusculo : capitalizar(minusculo);
  });
  return saida.join(" ").slice(0, 120).trimEnd();
}

// ——— CSV (ITBI 2017) ————————————————————————————————————————————————————————————

/** Leitor de CSV com campos entre aspas (aspas duplicadas e quebra de linha dentro do campo). */
function lerCsv(texto, separador) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let entreAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else entreAspas = false;
      } else campo += c;
    } else if (c === '"') entreAspas = true;
    else if (c === separador) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      campo = "";
      linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo !== "" || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

// ——— Cliente CKAN ———————————————————————————————————————————————————————————————

class ErroPermanente extends Error {}

function ehTransitorio(erro) {
  if (erro instanceof ErroPermanente) return false;
  return true; // 5xx, 429, tempo esgotado, rede e corpo truncado
}

async function comTentativas(rotulo, tarefa) {
  for (let t = 1; t <= TENTATIVAS; t++) {
    try {
      return await tarefa();
    } catch (erro) {
      if (!ehTransitorio(erro) || t === TENTATIVAS) {
        throw new Error(`${rotulo}: ${erro?.message ?? erro}`, { cause: erro });
      }
      await esperar(2000 * t);
    }
  }
  throw new Error(`${rotulo}: sem tentativas`);
}

async function chamarCkan(acao, parametros) {
  const url = new URL(API + acao);
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null) url.searchParams.set(chave, String(valor));
  }
  return comTentativas(`CKAN ${acao}`, async () => {
    const res = await fetch(url, { signal: AbortSignal.timeout(TEMPO_LIMITE_MS), headers: { accept: "application/json" } });
    if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
    const corpo = await res.json();
    if (!res.ok || !corpo.success) {
      throw new ErroPermanente(`HTTP ${res.status} ${JSON.stringify(corpo.error ?? null).slice(0, 200)}`);
    }
    return corpo.result;
  });
}

function conferirColunas(fields) {
  const proibidas = fields.filter((f) => COLUNAS_PROIBIDAS.some((p) => p.toLowerCase() === f.toLowerCase()));
  if (proibidas.length) throw new Error(`Coluna proibida na lista branca: ${proibidas.join(", ")}`);
}

/**
 * Lê uma tabela inteira do datastore, página por página (o portal limita a resposta a 500 linhas e ecoa o
 * limite). Aborta se o número de linhas lidas for diferente do `total` da API. Guarda o resultado bruto em
 * cache; o cache só vale se a consulta for idêntica e completa.
 */
async function lerTabela({ recurso, fields, filters = null, arquivo, rotulo }) {
  conferirColunas(fields);
  const consulta = { recurso, fields, filters };
  const caminho = path.join(DIR_CACHE, arquivo);
  const emCache = lerJson(caminho);
  if (
    emCache &&
    JSON.stringify(emCache.consulta) === JSON.stringify(consulta) &&
    Array.isArray(emCache.registros) &&
    emCache.registros.length === emCache.total
  ) {
    return { total: emCache.total, registros: emCache.registros, doCache: true };
  }

  const pedir = (offset) =>
    chamarCkan("datastore_search", {
      resource_id: recurso,
      fields: fields.join(","),
      filters: filters ? JSON.stringify(filters) : undefined,
      sort: "_id",
      limit: LIMITE_PEDIDO,
      offset,
    });

  const primeira = await pedir(0);
  const total = primeira.total;
  const limite = primeira.limit;
  if (primeira.total_was_estimated) throw new Error(`${rotulo}: o portal só estimou o total`);
  if (!Number.isInteger(total) || !Number.isInteger(limite) || limite <= 0) throw new Error(`${rotulo}: resposta sem total ou limite`);

  const { offsets, paginas } = planejarPaginas(total, limite, primeira.records);
  let proximo = 1;
  let prontas = 1;

  async function trabalhador() {
    while (proximo < offsets.length) {
      const i = proximo++;
      const resultado = await pedir(offsets[i]);
      paginas[i] = resultado.records;
      prontas++;
      if (prontas % 25 === 0 || prontas === offsets.length) console.log(`    ${rotulo}: ${prontas}/${offsets.length} páginas`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCORRENCIA, Math.max(1, offsets.length - 1)) }, trabalhador));

  paginas.forEach((registros, i) => {
    const esperado = Math.min(limite, total - offsets[i]);
    if (registros.length !== esperado) {
      throw new Error(`${rotulo}: a página de offset ${offsets[i]} veio com ${registros.length} linhas, esperava ${esperado}`);
    }
    if (registros.length) {
      const fora = Object.keys(registros[0]).filter((k) => !fields.includes(k));
      if (fora.length) throw new Error(`${rotulo}: a API devolveu colunas fora da lista branca: ${fora.join(", ")}`);
    }
  });
  const registros = paginas.flat();
  if (registros.length !== total) throw new Error(`${rotulo}: li ${registros.length} linhas, o total da API é ${total}`);

  gravarAtomico(caminho, JSON.stringify({ consulta, total, registros }));
  return { total, registros, doCache: false };
}

/** Metadados do recurso (nome, `last_modified`, `url` de download) e do pacote, com cache. */
async function metadadosDoRecurso(id) {
  const caminho = path.join(DIR_CACHE, `recurso-${id}.json`);
  const emCache = lerJson(caminho);
  if (emCache) return emCache;
  const recurso = await chamarCkan("resource_show", { id });
  const pacote = await chamarCkan("package_show", { id: recurso.package_id });
  const meta = {
    id,
    nome: recurso.name,
    formato: recurso.format,
    datastoreAtivo: Boolean(recurso.datastore_active),
    modificadoEm: typeof recurso.last_modified === "string" ? recurso.last_modified.slice(0, 10) : null,
    url: recurso.url,
    pacote: {
      nome: pacote.name,
      titulo: pacote.title,
      orgao: pacote.organization?.title ?? null,
      licenca: pacote.license_id,
    },
  };
  gravarAtomico(caminho, JSON.stringify(meta));
  return meta;
}

/** Baixa um arquivo (o portal responde 302 para um link temporário; o fetch o segue) direto para o disco. */
async function baixarParaArquivo(url, destino) {
  await comTentativas(`download ${path.basename(destino)}`, async () => {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15 * 60_000) });
    if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
    if (!res.ok || !res.body) throw new ErroPermanente(`HTTP ${res.status}`);
    const temporario = `${destino}.tmp`;
    await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(temporario));
    fs.renameSync(temporario, destino);
  });
}

async function baixarTexto(url) {
  return comTentativas("download CSV", async () => {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(5 * 60_000) });
    if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}`);
    if (!res.ok) throw new ErroPermanente(`HTTP ${res.status}`);
    return new TextDecoder("utf-8").decode(await res.arrayBuffer());
  });
}

// ——— Leitura das fontes —————————————————————————————————————————————————————————

async function lerBairrosOficiais() {
  const lido = await lerTabela({ recurso: RECURSO_BAIRROS, fields: CAMPOS_BAIRROS, arquivo: "bairros.json", rotulo: "Bairros" });
  const nomes = new Set(lido.registros.map((r) => dobrar(r.Bairro)));
  for (const slug of BAIRROS_COBERTOS) {
    for (const grafia of GRAFIAS_NO_CADASTRO[slug]) {
      if (!nomes.has(dobrar(grafia))) throw new Error(`Bairro "${grafia}" não consta na lista oficial de bairros`);
    }
  }
  return lido;
}

async function lerIptu() {
  const porBairro = {};
  for (const slug of BAIRROS_COBERTOS) {
    const grafias = [];
    for (const [i, grafia] of GRAFIAS_NO_CADASTRO[slug].entries()) {
      const lido = await lerTabela({
        recurso: RECURSO_IPTU_2026,
        fields: CAMPOS_IPTU,
        filters: { bairro: grafia },
        arquivo: `iptu-2026-${slug}-${i}.json`,
        rotulo: `IPTU ${grafia}`,
      });
      console.log(`  IPTU 2026 "${grafia}": ${mil(lido.registros.length)} lidos, total da API ${mil(lido.total)}${lido.doCache ? " (cache)" : ""}`);
      grafias.push({ grafia, lidos: lido.registros.length, total: lido.total, registros: lido.registros });
    }
    porBairro[slug] = grafias;
  }
  return porBairro;
}

/** ITBI 2017 não está na API: baixa o CSV e guarda no cache só as colunas da lista branca (nunca `complemento`). */
async function lerItbi2017(meta) {
  const caminho = path.join(DIR_CACHE, "itbi-2017.json");
  const consulta = { recurso: meta.id, fields: CAMPOS_ITBI, filters: null };
  const emCache = lerJson(caminho);
  if (emCache && JSON.stringify(emCache.consulta) === JSON.stringify(consulta) && emCache.registros.length === emCache.total) {
    return { total: emCache.total, registros: emCache.registros, doCache: true };
  }
  const linhas = lerCsv(await baixarTexto(meta.url), ";");
  const cabecalho = linhas[0].map((c) => c.trim().toLowerCase());
  const indices = CAMPOS_ITBI.map((campo) => cabecalho.indexOf(campo));
  const faltando = CAMPOS_ITBI.filter((_, i) => indices[i] < 0);
  if (faltando.length) throw new Error(`CSV do ITBI 2017 sem as colunas: ${faltando.join(", ")}`);
  const registros = [];
  for (const colunas of linhas.slice(1)) {
    if (colunas.length < 2) continue;
    const r = {};
    CAMPOS_ITBI.forEach((campo, i) => {
      const v = (colunas[indices[i]] ?? "").trim();
      r[campo] = v === "" ? null : v;
    });
    registros.push(r);
  }
  gravarAtomico(caminho, JSON.stringify({ consulta, total: registros.length, registros }));
  return { total: registros.length, registros, doCache: false };
}

async function lerItbi(metasItbi) {
  const anos = [];
  for (const { ano, id } of RECURSOS_ITBI) {
    const meta = metasItbi.get(id);
    const lido = meta.datastoreAtivo
      ? await lerTabela({ recurso: id, fields: CAMPOS_ITBI, arquivo: `itbi-${ano}.json`, rotulo: `ITBI ${ano}` })
      : await lerItbi2017(meta);
    console.log(
      `  ITBI ${ano}: ${mil(lido.registros.length)} lidos, total ${meta.datastoreAtivo ? "da API" : "do CSV"} ${mil(lido.total)}${lido.doCache ? " (cache)" : ""}`,
    );
    anos.push({ ano, lidos: lido.registros.length, total: lido.total, origem: meta.datastoreAtivo ? "API" : "CSV", registros: lido.registros });
  }
  return anos;
}

async function lerLicenciamento() {
  const lido = await lerTabela({
    recurso: RECURSO_LICENCIAMENTO,
    fields: CAMPOS_LICENCIAMENTO,
    filters: { categoria_empreendimento: "Obra" },
    arquivo: "licenciamento-obra.json",
    rotulo: "Licenciamento (Obra)",
  });
  console.log(`  Licenciamento "Obra": ${mil(lido.registros.length)} lidos, total da API ${mil(lido.total)}${lido.doCache ? " (cache)" : ""}`);
  return lido;
}

async function garantirArquivoDeLotes(meta) {
  const caminho = path.join(DIR_CACHE, "lotes.geojson");
  if (fs.existsSync(caminho) && fs.statSync(caminho).size > 1_000_000) return caminho;
  console.log(`  Baixando Lotes (${meta.url})...`);
  await baixarParaArquivo(meta.url, caminho);
  return caminho;
}

// ——— Lotes: uma passada, uma feição por linha ————————————————————————————————————

const TAMANHO_DA_CELULA = 0.002;
const chaveDaCelula = (lon, lat) => `${Math.floor(lon / TAMANHO_DA_CELULA)}:${Math.floor(lat / TAMANHO_DA_CELULA)}`;

/**
 * Passa uma vez pelo GeoJSON (uma feição por linha) sem guardar a base inteira:
 * - para cada edifício com coordenada, o menor lote cujo anel externo contém o `centro` (buracos excluídos);
 * - para cada `dsqfl` pedido, o centroide do lote (obras sem coordenada);
 * - para cada número pedido num bairro (edifícios sem nenhuma coordenada no IPTU), todos os lotes que têm esse
 *   número e esse bairro no NMENDCOMP, com o nome da rua já normalizado; quem escolhe entre eles é
 *   `acharLoteDoEndereco` (rua igual ou, se a rua foi renomeada, rua prefixo da outra).
 * Propriedades usadas: DSQFL, QTDPAVIMENTOS, NMEDIFICACAO e NMENDCOMP (este só para casar: nunca é gravado).
 * Os edifícios sem `centro` ficam fora da grade; `numerosPedidos` é o conjunto de `chaveDeNumero`.
 */
async function passarPelosLotes(arquivo, edificios, dsqflsPedidos, numerosPedidos) {
  const grade = new Map();
  edificios.forEach((e, i) => {
    if (!e.centro) return;
    const chave = chaveDaCelula(e.centro[0], e.centro[1]);
    if (!grade.has(chave)) grade.set(chave, []);
    grade.get(chave).push(i);
  });

  const achados = new Array(edificios.length).fill(null);
  const centroPorDsqfl = new Map();
  const candidatosPorNumero = new Map();
  const repeticoes = new Map();
  let feicoes = 0;
  let vazias = 0;

  const linhas = readline.createInterface({ input: fs.createReadStream(arquivo, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const bruta of linhas) {
    const linha = bruta.trim();
    if (!linha.startsWith("{") || !linha.includes('"Feature"')) continue;
    const feicao = JSON.parse(linha.endsWith(",") ? linha.slice(0, -1) : linha);
    feicoes++;
    const geometria = feicao.geometry;
    const partes =
      geometria?.type === "MultiPolygon" ? geometria.coordinates : geometria?.type === "Polygon" ? [geometria.coordinates] : [];
    const validas = partes.filter((p) => Array.isArray(p) && Array.isArray(p[0]) && p[0].length >= 4);
    if (validas.length === 0) {
      vazias++;
      continue;
    }
    const props = feicao.properties ?? {};
    const dsqfl = soDigitos(props.DSQFL).length === 14 ? soDigitos(props.DSQFL) : null;
    if (dsqfl) repeticoes.set(dsqfl, (repeticoes.get(dsqfl) ?? 0) + 1);

    let maiorParte = validas[0][0];
    let maiorArea = -1;
    let areaTotal = 0;
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const parte of validas) {
      const area = areaDoAnel(parte[0]);
      areaTotal += area;
      if (area > maiorArea) {
        maiorArea = area;
        maiorParte = parte[0];
      }
      for (const [lon, lat] of parte[0]) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }

    if (dsqfl && dsqflsPedidos.has(dsqfl) && !centroPorDsqfl.has(dsqfl)) centroPorDsqfl.set(dsqfl, centroideDoAnel(maiorParte));

    const pav = numero(props.QTDPAVIMENTOS);
    const pavimentos = pav !== null && pav > 0 && pav <= 200 ? Math.round(pav) : null;

    if (numerosPedidos.size > 0) {
      const endereco = lerEnderecoDoLote(props.NMENDCOMP);
      const slug = endereco ? bairroDaGrafia.get(dobrar(endereco.bairro)) : null;
      if (endereco && slug) {
        const chave = chaveDeNumero(endereco.numero, slug);
        if (numerosPedidos.has(chave)) {
          if (!candidatosPorNumero.has(chave)) candidatosPorNumero.set(chave, []);
          candidatosPorNumero.get(chave).push({
            rua: logradouroSemTipo(endereco.logradouro),
            area: areaTotal,
            dsqfl,
            pavimentos,
            nome: normalizarNomeEdificio(props.NMEDIFICACAO),
            anel: maiorParte,
            centro: centroideDoAnel(maiorParte),
          });
        }
      }
    }

    const celulas = [];
    for (let cx = Math.floor(minLon / TAMANHO_DA_CELULA); cx <= Math.floor(maxLon / TAMANHO_DA_CELULA); cx++) {
      for (let cy = Math.floor(minLat / TAMANHO_DA_CELULA); cy <= Math.floor(maxLat / TAMANHO_DA_CELULA); cy++) {
        const candidatos = grade.get(`${cx}:${cy}`);
        if (candidatos) celulas.push(...candidatos);
      }
    }
    for (const i of celulas) {
      const [lon, lat] = edificios[i].centro;
      if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) continue;
      if (!validas.some((parte) => pontoNaParte(lon, lat, parte))) continue;
      const atual = achados[i];
      if (atual && atual.area <= areaTotal) continue;
      achados[i] = {
        area: areaTotal,
        dsqfl,
        pavimentos,
        nome: normalizarNomeEdificio(props.NMEDIFICACAO),
        anel: maiorParte,
      };
    }
  }
  if (feicoes === 0) throw new Error("Nenhuma feição lida em lotes.geojson: o arquivo não tem uma feição por linha?");
  const duplicados = [...repeticoes.values()].filter((c) => c > 1).length;
  return { achados, centroPorDsqfl, candidatosPorNumero, feicoes, vazias, duplicados };
}

/**
 * Lote entre candidatos que já passaram pelo mesmo critério: um único `dsqfl` (se várias feições têm o mesmo,
 * vale a de maior área). Mais de um `dsqfl` diferente é ambíguo e conta como não achado.
 */
function loteDoEndereco(candidatos) {
  if (candidatos.length === 0) return { lote: null, ambiguo: false };
  const dsqfls = new Set(candidatos.map((c) => c.dsqfl));
  if (dsqfls.size > 1) return { lote: null, ambiguo: true };
  const maior = candidatos.reduce((a, b) => (b.area > a.area ? b : a));
  return { lote: maior, ambiguo: false };
}

/**
 * Lote de um edifício sem coordenada, pelo endereço, em dois passos, sempre com o mesmo número e o mesmo bairro:
 * 1. rua igual (sem acento, sem caixa, sem tipo de via);
 * 2. só se o passo 1 não achou NENHUM lote (uma rua ambígua no passo 1 continua ambígua): rua renomeada, isto é,
 *    nome de rua que seja prefixo, palavra por palavra, do outro, com 2 palavras ou mais no mais curto
 *    (`ruasCompativeisPorPrefixo`), e um único lote assim.
 * Devolve `via` ("exato", "prefixo" ou null) para o relatório.
 */
function acharLoteDoEndereco(edificio, candidatosPorNumero) {
  const candidatos = candidatosPorNumero.get(chaveDeNumero(Number(edificio.numero), edificio.bairro)) ?? [];
  const rua = logradouroSemTipo(edificio.logradouro);
  const exatos = candidatos.filter((c) => c.rua === rua);
  if (exatos.length > 0) return { ...loteDoEndereco(exatos), via: "exato", ruaDoEdificio: rua };
  const parecidos = candidatos.filter((c) => ruasCompativeisPorPrefixo(c.rua, rua));
  if (parecidos.length === 0) return { lote: null, ambiguo: false, via: null, ruaDoEdificio: rua };
  return { ...loteDoEndereco(parecidos), via: "prefixo", ruaDoEdificio: rua };
}

// ——— Edifícios a partir do IPTU ——————————————————————————————————————————————————

function classificarConstrucao(texto) {
  const t = String(texto ?? "");
  if (/<=\s*4/.test(t)) return true;
  if (/>\s*4/.test(t)) return false;
  return null;
}

/**
 * Agrupa TODO o IPTU residencial de apartamentos por `Código Logradouro` + `numero` (número nulo fica de fora)
 * e mantém os grupos com 2 ou mais registros, tenham ou não coordenada.
 * - `centro` = mediana das coordenadas disponíveis no grupo; sem nenhuma, `centro` fica null e o edifício vai
 *   para `semCoordenada`: o lote é procurado depois pelo endereço (NMENDCOMP) ou o grupo é descartado.
 * - `idsAntes` guarda os edifícios que a regra anterior (só registros com coordenada) já produzia, para o
 *   relatório comparar antes e depois.
 * Devolve também, por id, as contagens de diagnóstico e o IPTU por m² das unidades: só entram no relatório e
 * no contexto do bairro os edifícios que ficarem no índice.
 */
function montarEdificios(slug, grafias, relatorio) {
  const rel = relatorio.iptu[slug];
  const usos = new Map();
  const tiposDeConstrucao = new Map();
  const tiposDeEmpreendimento = new Map();
  const grupos = new Map();

  for (const { registros } of grafias) {
    for (const r of registros) {
      rel.lidos++;
      const uso = limpar(r["tipo de uso do imóvel"]).toUpperCase();
      usos.set(uso, (usos.get(uso) ?? 0) + 1);
      if (uso !== "RESIDENCIAL") continue;
      const tipo = limpar(r["Tipo de Construção"]);
      if (!dobrar(tipo).startsWith("apartamento")) continue;
      rel.apartamentos++;
      tiposDeConstrucao.set(tipo, (tiposDeConstrucao.get(tipo) ?? 0) + 1);
      const emp = limpar(r["Tipo de Empreendimento"]);
      tiposDeEmpreendimento.set(emp, (tiposDeEmpreendimento.get(emp) ?? 0) + 1);

      const cod = inteiroPositivo(r["Código Logradouro"]);
      const num = inteiroPositivo(r.numero);
      if (cod === null || num === null) {
        rel.semNumero++;
        continue;
      }
      const posicao = coordenadaValida(r.latitude, r.longitude);
      if (!posicao) rel.semCoordenada++;
      const id = `${cod}-${num}`;
      if (!grupos.has(id)) grupos.set(id, { id, numero: String(num), unidades: [] });
      const iptu = numero(r["valor cobrado de IPTU"]);
      const ano = numero(r["ano da construção corrigido"]);
      grupos.get(id).unidades.push({
        logradouro: limpar(r.logradouro).toUpperCase(),
        area: numero(r["AREA CONSTRUIDA"]),
        iptu: iptu !== null && iptu > 0 ? iptu : null,
        iptuZeroOuInvalido: iptu === null || iptu <= 0,
        ano: ano !== null && Number.isInteger(ano) && ano >= 1800 && ano <= 2100 ? ano : null,
        padrao: limpar(r["tipo de padrão da construção"]).slice(0, 40) || null,
        ate4: classificarConstrucao(tipo),
        lat: posicao ? posicao.lat : null,
        lon: posicao ? posicao.lon : null,
      });
    }
  }
  rel.usosDistintos = usos;
  rel.tiposDeConstrucao = tiposDeConstrucao;
  rel.tiposDeEmpreendimento = tiposDeEmpreendimento;
  rel.grupos = grupos.size;

  const edificios = [];
  const semCoordenada = new Set();
  const idsAntes = new Set();
  const iptuPorM2PorId = new Map();
  const diagnostico = new Map();
  for (const grupo of [...grupos.values()].sort((a, b) => ordemTexto(a.id, b.id))) {
    const un = grupo.unidades;
    if (un.length < 2) continue;
    rel.gruposComDoisOuMais++;
    const comPosicao = un.filter((u) => u.lat !== null);
    // Todos os grupos de 2+ registros caem em exatamente uma destas três contagens.
    if (comPosicao.length === 0) rel.gruposSemCoordenada++;
    else if (comPosicao.length < un.length) rel.gruposComCoordenadaParcial++;
    else rel.gruposComTodasAsCoordenadas++;

    const porArea = new Map();
    const porM2 = [];
    let semArea = 0;
    for (const u of un) {
      if (u.area === null || u.area <= 0) {
        semArea++;
        continue;
      }
      const chave = r2(u.area);
      if (!porArea.has(chave)) porArea.set(chave, []);
      porArea.get(chave).push(u.iptu);
      if (u.iptu !== null) porM2.push(u.iptu / u.area);
    }
    if (porArea.size === 0) {
      rel.semNenhumaArea++;
      continue;
    }
    let tipologias = [...porArea.entries()].map(([area, iptus]) => {
      const validos = iptus.filter((v) => v !== null);
      return { area, unidades: iptus.length, iptuAnualMediano: validos.length ? r2(mediana(validos)) : null };
    });
    let acimaDe60 = 0;
    if (tipologias.length > MAX_TIPOLOGIAS) {
      acimaDe60 = 1;
      tipologias = tipologias
        .sort((a, b) => b.unidades - a.unidades || a.area - b.area)
        .slice(0, MAX_TIPOLOGIAS);
    }
    tipologias.sort((a, b) => a.area - b.area);

    if (comPosicao.length >= 2) idsAntes.add(grupo.id);
    if (comPosicao.length === 0) semCoordenada.add(grupo.id);
    iptuPorM2PorId.set(grupo.id, porM2);
    diagnostico.set(grupo.id, {
      semArea,
      iptuInvalido: un.filter((u) => u.iptuZeroOuInvalido).length,
      acimaDe60,
    });

    edificios.push({
      id: grupo.id,
      bairro: slug,
      logradouro: moda(un.map((u) => u.logradouro).filter(Boolean)) ?? "",
      numero: grupo.numero,
      dsqfl: null,
      nome: null,
      centro: comPosicao.length ? [r6(mediana(comPosicao.map((u) => u.lon))), r6(mediana(comPosicao.map((u) => u.lat)))] : null,
      poligono: null,
      unidades: un.length,
      tipologias,
      anoConstrucao: moda(un.map((u) => u.ano)),
      pavimentos: null,
      ate4Pavimentos: moda(un.map((u) => u.ate4)),
      padrao: moda(un.map((u) => u.padrao)),
      iptuAnual: quartis(un.map((u) => u.iptu).filter((v) => v !== null)),
      itbi: null,
      obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
    });
  }
  return { edificios, semCoordenada, idsAntes, iptuPorM2PorId, diagnostico };
}

// ——— ITBI ———————————————————————————————————————————————————————————————————————

/**
 * Guarda, por edifício, uma linha por transmissão de apartamento: o ano e o `valor_avaliacao` (R$ por unidade,
 * ou null se vier vazio ou não positivo) dos últimos 36 meses. A `area_construida` do ITBI continua na lista
 * branca de colunas (o cache é chaveado pela consulta), mas nenhum cálculo a usa: ela inclui a área comum
 * (66,7 m² privativos no IPTU aparecem como 109,84 m² no ITBI), então nenhum R$/m² sai dela.
 */
function indexarItbi(anos, limiar36m, geradoEmData, relatorio) {
  const grafiaParaSlug = bairroDaGrafia;
  const porBairro = Object.fromEntries(BAIRROS_COBERTOS.map((s) => [s, { porId: new Map(), valorRecente: [] }]));
  const rel = relatorio.itbi;
  for (const { ano: anoDoArquivo, registros } of anos) {
    const porSlug = Object.fromEntries(BAIRROS_COBERTOS.map((s) => [s, { lidos: 0, apartamentos: 0, semChave: 0, semData: 0 }]));
    for (const r of registros) {
      const slug = grafiaParaSlug.get(dobrar(r.bairro));
      if (!slug) continue;
      const bairroBruto = limpar(r.bairro);
      rel.bairrosDistintos.set(bairroBruto, (rel.bairrosDistintos.get(bairroBruto) ?? 0) + 1);
      const tipoBruto = limpar(r.tipo_imovel);
      rel.tiposDistintos.set(tipoBruto, (rel.tiposDistintos.get(tipoBruto) ?? 0) + 1);
      porSlug[slug].lidos++;
      if (!dobrar(tipoBruto).startsWith("apartamento")) continue;
      rel.apartamentoUsados.add(tipoBruto);
      rel.bairroUsados.add(bairroBruto);
      porSlug[slug].apartamentos++;

      const cod = inteiroPositivo(r.cod_logradouro);
      const num = inteiroPositivo(r.numero);
      if (cod === null || num === null) {
        porSlug[slug].semChave++;
        continue;
      }
      const data = String(r.data_transacao ?? "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        porSlug[slug].semData++;
        continue;
      }
      const valor = numero(r.valor_avaliacao);
      const valorUnidade = valor !== null && valor > 0 ? valor : null;
      const recente = data >= limiar36m && data <= geradoEmData;
      const id = `${cod}-${num}`;
      const lista = porBairro[slug].porId.get(id) ?? [];
      lista.push({ ano: Number(data.slice(0, 4)), valorUnidade: recente ? valorUnidade : null });
      porBairro[slug].porId.set(id, lista);
      if (valorUnidade !== null && recente) porBairro[slug].valorRecente.push(valorUnidade);
    }
    rel.porAno.push({ ano: anoDoArquivo, porSlug });
  }
  return porBairro;
}

function resumoDoItbi(transacoes) {
  if (!transacoes || transacoes.length === 0) return null;
  const anos = transacoes.map((t) => t.ano);
  const porAno = new Map();
  for (const a of anos) porAno.set(a, (porAno.get(a) ?? 0) + 1);
  const valores = transacoes.map((t) => t.valorUnidade).filter((v) => v !== null);
  return {
    transmissoes: transacoes.length,
    desde: Math.min(...anos),
    ate: Math.max(...anos),
    valorUnidade: valores.length >= 3 ? quartis(valores) : null,
    porAno: [...porAno.entries()].sort((a, b) => a[0] - b[0]),
  };
}

// ——— Licenciamento ——————————————————————————————————————————————————————————————

function classificarObra(assunto, tipoProcesso) {
  const a = dobrar(assunto).toUpperCase();
  const t = dobrar(tipoProcesso).toUpperCase();
  const principal = a || t;
  if (a === "ALVARA DE DEMOLICAO" || t === "ALVARA DE DEMOLICAO") return "demolicao";
  if (CONSTRUCAO.has(principal)) return "construcao";
  if (t === "REFORMA COM ACRESCIMO DE AREA") return "acrescimo";
  return null;
}

function chaveDeLote(valor) {
  const d = soDigitos(valor);
  return d.length === 14 ? d : null;
}

/** dsqfls das licenças de obra válidas que não trazem coordenada: precisam do centro do lote. */
function dsqflsSemCoordenada(registros) {
  const pedidos = new Set();
  for (const r of registros) {
    if (!situacaoValida(r.situacao_processo)) continue;
    if (coordenadaValida(r.latitude, r.longitude)) continue;
    const d = chaveDeLote(r.dsqfl);
    if (d) pedidos.add(d);
  }
  return pedidos;
}

const ROTULO_SEM_SITUACAO = "(vazio)";

function contarSituacao(mapa, situacao, campo) {
  const valor = limpar(situacao) || ROTULO_SEM_SITUACAO;
  const atual = mapa.get(valor) ?? { todas: 0, escopo: 0 };
  atual[campo]++;
  mapa.set(valor, atual);
}

/**
 * Licenças de obra → processos únicos.
 * 1. Fora: categoria diferente de "Obra", sem data, antes de 2018, data futura.
 * 2. Fora: situação sem efeito (SITUACOES_EXCLUIDAS). Nada dela conta, em lugar nenhum.
 * 3. Posição: a coordenada publicada ou, sem ela, o centro do lote pelo `dsqfl`; sem nenhuma das duas, descarta.
 * 4. Deduplicação: chave = (dsqfl de 14 dígitos; sem ele, coordenada arredondada a 5 casas) + categoria
 *    (construcao, acrescimo, demolicao ou outra) + mês de `data_entrada`. Cada chave vira UM processo, que
 *    fica com a linha de data mais recente (empate: menor descrição, depois menor situação), a data mais
 *    recente do grupo para a janela de 24 meses, e a menor coordenada publicada do grupo (ou o centro do lote).
 */
function prepararProcessos(registros, centroPorDsqfl, geradoEmData, relatorio) {
  const rel = relatorio.licenciamento;
  const grupos = new Map();
  for (const r of registros) {
    rel.lidos++;
    contarSituacao(rel.situacoes, r.situacao_processo, "todas");
    if (r.categoria_empreendimento !== "Obra") {
      rel.foraDaCategoria++;
      continue;
    }
    const data = String(r.data_entrada ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      rel.semData++;
      continue;
    }
    if (data < INICIO_DA_SERIE) {
      rel.antesDe2018++;
      continue;
    }
    if (data > geradoEmData) {
      rel.dataFutura++;
      continue;
    }
    rel.noEscopo++;
    contarSituacao(rel.situacoes, r.situacao_processo, "escopo");
    if (!situacaoValida(r.situacao_processo)) {
      rel.situacaoExcluida++;
      continue;
    }
    const dsqfl = chaveDeLote(r.dsqfl);
    let lat;
    let lon;
    let propria = true;
    const publicada = coordenadaValida(r.latitude, r.longitude);
    if (publicada) {
      lat = r6(publicada.lat);
      lon = r6(publicada.lon);
      rel.comCoordenada++;
    } else {
      const lote = dsqfl ? centroPorDsqfl.get(dsqfl) : undefined;
      if (!lote) {
        rel.descartadasSemPosicao++;
        continue;
      }
      [lon, lat] = lote;
      propria = false;
      rel.posicaoPeloLote++;
    }
    rel.validasComPosicao++;
    const assunto = limpar(r.assunto);
    const tipoProcesso = limpar(r.tipo_processo);
    const categoria = classificarObra(assunto, tipoProcesso);
    const mes = data.slice(0, 7);
    const lugar = dsqfl ? `d:${dsqfl}` : `c:${lat.toFixed(5)},${lon.toFixed(5)}`;
    const chave = `${lugar}|${categoria ?? "outra"}|${mes}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push({
      categoria,
      descricao: (assunto || tipoProcesso).slice(0, 80),
      dataCompleta: data,
      mes,
      situacao: limpar(r.situacao_processo).slice(0, 80) || null,
      lat,
      lon,
      propria,
      dsqfl,
    });
  }

  const processos = [];
  for (const linhas of grupos.values()) {
    const maisRecente = linhas
      .slice()
      .sort(
        (a, b) =>
          ordemTexto(b.dataCompleta, a.dataCompleta) || ordemTexto(a.descricao, b.descricao) || ordemTexto(a.situacao ?? "", b.situacao ?? ""),
      )[0];
    const publicadas = linhas.filter((l) => l.propria);
    const lugares = (publicadas.length ? publicadas : linhas).slice().sort((a, b) => a.lon - b.lon || a.lat - b.lat);
    const processo = {
      categoria: maisRecente.categoria,
      descricao: maisRecente.descricao,
      dataCompleta: maisRecente.dataCompleta,
      mes: maisRecente.mes,
      situacao: maisRecente.situacao,
      lat: lugares[0].lat,
      lon: lugares[0].lon,
      dsqfl: maisRecente.dsqfl,
      linhas: linhas.length,
    };
    rel.porCategoria[processo.categoria ?? "outra"]++;
    if (linhas.length > 1) {
      rel.chavesComRepeticao++;
      rel.maiorRepeticao = Math.max(rel.maiorRepeticao, linhas.length);
    }
    processos.push(processo);
  }
  rel.chavesUnicas = processos.length;
  rel.linhasColapsadas = rel.validasComPosicao - processos.length;
  return processos;
}

/** Identidade da obra como é gravada no índice: a lista `obras` do bairro não repete nenhuma. */
function chaveDaObra(o) {
  return [o.categoria, o.descricao, o.mes, o.situacao ?? "", o.lon, o.lat].join("|");
}

function compararObras(a, b) {
  return (
    ordemTexto(a.mes, b.mes) ||
    a.lon - b.lon ||
    a.lat - b.lat ||
    ordemTexto(a.categoria, b.categoria) ||
    ordemTexto(a.descricao, b.descricao) ||
    ordemTexto(a.situacao ?? "", b.situacao ?? "")
  );
}

/**
 * Preenche `obras150m` de cada edifício e devolve a lista `obras` do bairro (só as referidas por
 * `recentes`, sem repetição, ordenadas por data e coordenada). Os processos já são únicos por chave.
 */
function ligarObras(edificios, processos, limiar24m) {
  const referidas = new Map();
  const porEdificio = new Map();
  const passo = 0.002;

  for (const e of edificios) {
    const [lon0, lat0] = e.centro;
    let licencas = 0;
    let relevantes24m = 0;
    let demolicoes24m = 0;
    const candidatas = [];
    for (const p of processos) {
      if (Math.abs(p.lat - lat0) > passo || Math.abs(p.lon - lon0) > passo) continue;
      const d = haversineM(lat0, lon0, p.lat, p.lon);
      if (d > RAIO_OBRAS_M) continue;
      licencas++;
      if (p.categoria && p.dataCompleta >= limiar24m) {
        relevantes24m++;
        if (p.categoria === "demolicao") demolicoes24m++;
        candidatas.push({ p, d: Math.round(d), chave: chaveDaObra(p) });
      }
    }
    candidatas.sort((a, b) => ordemTexto(b.p.dataCompleta, a.p.dataCompleta) || a.d - b.d || ordemTexto(a.chave, b.chave));
    const vistas = new Set();
    const recentes = [];
    for (const c of candidatas) {
      if (vistas.has(c.chave)) continue;
      vistas.add(c.chave);
      recentes.push(c);
      if (recentes.length === MAX_RECENTES) break;
    }
    for (const c of recentes) if (!referidas.has(c.chave)) referidas.set(c.chave, c.p);
    porEdificio.set(e.id, { licencas, relevantes24m, demolicoes24m, recentes });
  }

  const obras = [...referidas.values()].sort(compararObras);
  const indicePorChave = new Map(obras.map((o, i) => [chaveDaObra(o), i]));
  for (const e of edificios) {
    const r = porEdificio.get(e.id);
    e.obras150m = {
      licencasDeObra: r.licencas,
      relevantes24m: r.relevantes24m,
      demolicoes24m: r.demolicoes24m,
      recentes: r.recentes.map((c) => [indicePorChave.get(c.chave), Math.min(c.d, RAIO_OBRAS_M)]),
    };
  }
  return obras.map((o) => ({
    categoria: o.categoria,
    descricao: o.descricao,
    data: o.mes,
    situacao: o.situacao,
    centro: [o.lon, o.lat],
  }));
}

/** Os processos relevantes (24 meses) a até 150 m de um edifício, para explicar um número alto. */
function relevantesPerto(e, processos, limiar24m) {
  const [lon0, lat0] = e.centro;
  return processos.filter(
    (p) => p.categoria && p.dataCompleta >= limiar24m && haversineM(lat0, lon0, p.lat, p.lon) <= RAIO_OBRAS_M,
  );
}

// ——— Relatório ——————————————————————————————————————————————————————————————————

function novoRelatorio() {
  const iptu = {};
  for (const slug of BAIRROS_COBERTOS) {
    iptu[slug] = {
      lidos: 0, apartamentos: 0, semNumero: 0, semCoordenada: 0, semNenhumaArea: 0, grupos: 0, gruposComDoisOuMais: 0,
      gruposSemCoordenada: 0, gruposComCoordenadaParcial: 0, gruposComTodasAsCoordenadas: 0,
    };
  }
  return {
    iptu,
    itbi: { porAno: [], bairrosDistintos: new Map(), tiposDistintos: new Map(), apartamentoUsados: new Set(), bairroUsados: new Set() },
    licenciamento: {
      lidos: 0, foraDaCategoria: 0, semData: 0, antesDe2018: 0, dataFutura: 0, noEscopo: 0, situacaoExcluida: 0,
      comCoordenada: 0, posicaoPeloLote: 0, descartadasSemPosicao: 0, validasComPosicao: 0,
      chavesUnicas: 0, linhasColapsadas: 0, chavesComRepeticao: 0, maiorRepeticao: 0,
      porCategoria: { construcao: 0, acrescimo: 0, demolicao: 0, outra: 0 },
      situacoes: new Map(),
    },
    lotes: { feicoes: 0, vazias: 0, duplicados: 0 },
    porBairro: {},
  };
}

function ordenarPorContagem(mapa) {
  return [...mapa.entries()].sort((a, b) => b[1] - a[1] || ordemTexto(a[0], b[0]));
}

const MEGABYTE = 1_000_000;

/** Número inteiro sem casas, ou com uma casa quando for fracionário (medianas e p90 interpolados). */
function umaCasa(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** { mediana, p90, max } de uma lista de contagens (p90 interpolado, como o numpy). */
function distribuicao(valores) {
  if (valores.length === 0) return { mediana: 0, p90: 0, max: 0 };
  const o = valores.slice().sort((a, b) => a - b);
  return { mediana: percentil(o, 0.5), p90: percentil(o, 0.9), max: o[o.length - 1] };
}

/** Texto curto de uma distribuição, para o relatório. */
function textoDaDistribuicao(d) {
  return `mediana ${umaCasa(d.mediana)}, p90 ${umaCasa(d.p90)}, máx ${d.max}`;
}

/** Linhas que explicam um edifício com muitas obras relevantes: por categoria, por lote (dsqfl) e por mês. */
function explicarExcesso(e, processos, limiar24m) {
  const perto = relevantesPerto(e, processos, limiar24m);
  const porCategoria = new Map();
  const porLote = new Map();
  const porMes = new Map();
  let linhas = 0;
  for (const p of perto) {
    porCategoria.set(p.categoria, (porCategoria.get(p.categoria) ?? 0) + 1);
    const lote = p.dsqfl ?? "sem dsqfl";
    const atual = porLote.get(lote) ?? { n: 0, de: "9999-99-99", ate: "0000-00-00" };
    atual.n++;
    if (p.dataCompleta < atual.de) atual.de = p.dataCompleta;
    if (p.dataCompleta > atual.ate) atual.ate = p.dataCompleta;
    porLote.set(lote, atual);
    porMes.set(p.mes, (porMes.get(p.mes) ?? 0) + 1);
    linhas += p.linhas;
  }
  const lotes = [...porLote.entries()].sort((a, b) => b[1].n - a[1].n || ordemTexto(a[0], b[0]));
  const meses = [...porMes.entries()].sort((a, b) => b[1] - a[1] || ordemTexto(a[0], b[0]));
  return [
    `    edifício ${e.id} (${e.logradouro}, ${e.numero}): ${e.obras150m.relevantes24m} relevantes e ${e.obras150m.demolicoes24m} demolições em 24 meses; ${e.obras150m.licencasDeObra} licenças de obra desde 2018; centro ${e.centro[1]}, ${e.centro[0]}`,
    `      por categoria: ${[...porCategoria.entries()].map(([k, v]) => `${k} ${v}`).join(", ")}; ${perto.length} processos únicos, vindos de ${mil(linhas)} linhas válidas; ${lotes.length} lotes distintos a até ${RAIO_OBRAS_M} m`,
    `      lotes com mais processos: ${lotes.slice(0, 5).map(([d, v]) => `${d} (${v.n} de ${v.de} a ${v.ate})`).join("; ")}`,
    `      meses com mais processos: ${meses.slice(0, 4).map(([m, n]) => `${m} ${n}`).join(", ")}`,
  ];
}

function imprimirRelatorio({ relatorio, contagens, geradoEm, arquivos, meta }) {
  const linha = "=".repeat(78);
  console.log(`\n${linha}\n RELATÓRIO (geradoEm ${geradoEm}${SEM_LOTES ? ", --sem-lotes" : ""})\n${linha}`);

  console.log("\n1. Registros lidos por fonte");
  console.log(`  IPTU 2026 (filtro por bairro, todas as grafias): ${mil(contagens.iptu)}`);
  console.log(`  ITBI 2016-2026 (leitura integral, filtro por bairro no script): ${mil(contagens.itbi)}`);
  console.log(`  Licenciamento (categoria "Obra"): ${mil(contagens.licenciamento)}  [referência C7 ${mil(REFERENCIA_C7_LICENCIAMENTO)}]`);
  console.log(`  Lotes (feições): ${mil(contagens.lotes)}  [referência C7 ${mil(REFERENCIA_C7_LOTES)}]`);
  console.log(`  Bairros e RPAs: ${mil(contagens.bairros)}`);

  console.log("\n2. IPTU 2026 por bairro: lidos / total da API, e comparação com a tabela C7");
  for (const slug of BAIRROS_COBERTOS) {
    const g = relatorio.porBairro[slug];
    const ref = REFERENCIA_C7[slug];
    const desvio = ref ? ((g.iptuLidos - ref.iptu) / ref.iptu) * 100 : null;
    const porGrafia = g.grafias.map((x) => `"${x.grafia}" ${mil(x.lidos)}/${mil(x.total)}`).join(" + ");
    console.log(`  ${slug.padEnd(11)} ${mil(g.iptuLidos).padStart(7)} lidos = total API ${mil(g.iptuTotal)} (${porGrafia}); ${ref ? `C7 ${mil(ref.iptu)}, diferença ${desvio.toFixed(2)}%` : "sem referência histórica C7"}`);
    if (desvio !== null && Math.abs(desvio) > 5) aviso(`${slug}: registros de IPTU fora de 5% da tabela C7`);
  }

  console.log("\n3. Edifícios (2+ registros residenciais de apartamento no mesmo Código Logradouro + número)");
  console.log("  antes = regra anterior (só registros com coordenada); depois = todos os registros, coordenada pela mediana do grupo");
  console.log("  ou, sem nenhuma, pelo lote achado no endereço (NMENDCOMP); sem lote, o grupo é descartado.");
  for (const slug of BAIRROS_COBERTOS) {
    const i = relatorio.iptu[slug];
    const b = relatorio.porBairro[slug];
    const ref = REFERENCIA_C7[slug];
    const desvio = ref ? ((b.edificios - ref.edificios) / ref.edificios) * 100 : null;
    console.log(
      `  ${slug.padEnd(11)} antes ${String(b.antes).padStart(5)} -> depois ${String(b.edificios).padStart(5)} (${ref ? `C7 ${ref.edificios}, diferença ${desvio >= 0 ? "+" : ""}${desvio.toFixed(2)}%` : "sem referência histórica C7"})`,
    );
    if (i.gruposSemCoordenada + i.gruposComCoordenadaParcial + i.gruposComTodasAsCoordenadas !== i.gruposComDoisOuMais) {
      throw new Error(`${slug}: as contagens de coordenada dos grupos não somam os ${i.gruposComDoisOuMais} grupos de 2+ registros`);
    }
    console.log(
      `              grupos com 2+ registros ${mil(i.gruposComDoisOuMais)} = ${mil(i.gruposComTodasAsCoordenadas)} com coordenada em todos os registros + ${i.gruposComCoordenadaParcial} com coordenada parcial (alguns registros sem, centro pela mediana dos que têm) + ${b.semCoordenada} sem nenhuma coordenada`,
    );
    console.log(
      `              dos ${b.semCoordenada} sem nenhuma coordenada: recuperados pelo NMENDCOMP ${b.recuperados} (${b.recuperadosExato} por rua igual + ${b.recuperadosPrefixo} por rua renomeada, prefixo da outra), descartados ${b.descartados} (ambíguos entre os descartados ${b.ambiguos}, dos quais ${b.ambiguosPrefixo} só pelo prefixo)`,
    );
    console.log(
      `              registros de apartamento sem número ${i.semNumero}, sem coordenada ${mil(i.semCoordenada)}; edifícios sem nenhuma área ${i.semNenhumaArea}`,
    );
    if (b.paresDePrefixo.size > 0) {
      const pares = [...b.paresDePrefixo.entries()].sort((x, y) => y[1] - x[1] || ordemTexto(x[0], y[0]));
      console.log(`              ruas renomeadas casadas por prefixo (rua do IPTU ~ rua do lote: edifícios): ${pares.map(([par, n]) => `${par}: ${n}`).join("; ")}`);
    }
    if (b.antes - b.antesNoFinal !== 0) aviso(`${slug}: ${b.antes - b.antesNoFinal} edifícios da regra antiga ficaram de fora`);
    if (desvio !== null && Math.abs(desvio) > 5 && desvio < 0) aviso(`${slug}: edifícios abaixo de 95% da tabela C7`);
    if (b.semArea || b.iptuInvalido || b.mais60) {
      console.log(
        `              unidades sem área ${b.semArea}; unidades com IPTU ausente ou zero (fora dos quartis) ${b.iptuInvalido}; edifícios com mais de 60 tipologias ${b.mais60}`,
      );
    }
  }

  const totalDosBairros = (campo, origem) => BAIRROS_COBERTOS.reduce((t, slug) => t + (origem === "iptu" ? relatorio.iptu[slug][campo] : relatorio.porBairro[slug][campo]), 0);
  console.log(
    `  TOTAL (${BAIRROS_COBERTOS.length} bairros): antes ${mil(totalDosBairros("antes"))} -> depois ${mil(totalDosBairros("edificios"))} edifícios; grupos com 2+ registros ${mil(totalDosBairros("gruposComDoisOuMais", "iptu"))} = ${mil(totalDosBairros("gruposComTodasAsCoordenadas", "iptu"))} com coordenada em todos + ${totalDosBairros("gruposComCoordenadaParcial", "iptu")} com coordenada parcial + ${totalDosBairros("semCoordenada")} sem nenhuma coordenada`,
  );
  console.log(
    `  TOTAL dos ${totalDosBairros("semCoordenada")} sem nenhuma coordenada: recuperados ${totalDosBairros("recuperados")} (${totalDosBairros("recuperadosExato")} por rua igual + ${totalDosBairros("recuperadosPrefixo")} por rua renomeada), descartados ${totalDosBairros("descartados")} (ambíguos ${totalDosBairros("ambiguos")}, dos quais ${totalDosBairros("ambiguosPrefixo")} só pelo prefixo)`,
  );

  const somar = (campo) => {
    const total = new Map();
    for (const slug of BAIRROS_COBERTOS) for (const [k, v] of relatorio.iptu[slug][campo]) total.set(k, (total.get(k) ?? 0) + v);
    return ordenarPorContagem(total).slice(0, 12).map(([k, v]) => `"${k}" ${mil(v)}`).join("; ");
  };
  console.log(`  valores de "tipo de uso do imóvel" (${BAIRROS_COBERTOS.length} bairros): ${somar("usosDistintos")}`);
  console.log(`  valores de "Tipo de Construção" usados (residencial, apartamento): ${somar("tiposDeConstrucao")}`);
  console.log(`  valores de "Tipo de Empreendimento" usados: ${somar("tiposDeEmpreendimento")}`);

  console.log("\n4. Vínculo com Lotes, nome, pavimentos e polígono por bairro (edifícios do índice)");
  for (const slug of BAIRROS_COBERTOS) {
    const b = relatorio.porBairro[slug];
    console.log(
      `  ${slug.padEnd(11)} vínculo ${b.comLote}/${b.edificios} = ${porcentagem(b.comLote, b.edificios)}; nome ${b.comNome} = ${porcentagem(b.comNome, b.edificios)}; pavimentos ${b.comPavimentos} = ${porcentagem(b.comPavimentos, b.edificios)}; polígono ${b.comPoligono} = ${porcentagem(b.comPoligono, b.edificios)}`,
    );
  }
  console.log("  pavimentos incoerentes: lote com QTDPAVIMENTOS <= 4 e IPTU com ate4Pavimentos false -> pavimentos gravado como null");
  for (const slug of BAIRROS_COBERTOS) {
    const b = relatorio.porBairro[slug];
    console.log(
      `  ${slug.padEnd(11)} divergentes anulados ${b.pavimentosDivergentes} de ${b.edificios} edifícios (${porcentagem(b.pavimentosDivergentes, b.edificios)}); contrário (lote > 4 e IPTU até 4, não alterado) ${b.pavimentosAcimaDe4ComIptuAte4}`,
    );
  }
  console.log(
    `  TOTAL divergentes anulados ${totalDosBairros("pavimentosDivergentes")} de ${mil(totalDosBairros("edificios"))} edifícios; contrário (não alterado) ${totalDosBairros("pavimentosAcimaDe4ComIptuAte4")}`,
  );
  console.log(
    `  Lotes: ${mil(relatorio.lotes.feicoes)} feições, ${relatorio.lotes.vazias} sem geometria, ${relatorio.lotes.duplicados} dsqfl em mais de uma feição`,
  );

  console.log("\n5. Obras (Licenciamento, categoria Obra, desde 2018-01-01)");
  const l = relatorio.licenciamento;
  console.log(
    `  lidos ${mil(l.lidos)}; fora da categoria ${l.foraDaCategoria}; sem data ${l.semData}; antes de 2018 ${mil(l.antesDe2018)}; data futura ${l.dataFutura}; no escopo (2018 em diante) ${mil(l.noEscopo)}`,
  );
  console.log(`  valores distintos de situacao_processo (todas as linhas lidas / no escopo) e se contam:`);
  for (const [valor, c] of [...l.situacoes.entries()].sort((a, b) => b[1].todas - a[1].todas || ordemTexto(a[0], b[0]))) {
    const excluida = valor !== ROTULO_SEM_SITUACAO && !situacaoValida(valor);
    console.log(`    "${valor}": ${mil(c.todas)} / ${mil(c.escopo)} -> ${excluida ? "EXCLUÍDA (não conta em nada)" : "válida"}`);
  }
  console.log(`  excluídas por situação (no escopo): ${mil(l.situacaoExcluida)} de ${mil(l.noEscopo)}; sobram ${mil(l.noEscopo - l.situacaoExcluida)} linhas válidas`);
  console.log(
    `  das válidas: com coordenada ${mil(l.comCoordenada)}; posição pelo lote ${mil(l.posicaoPeloLote)}; descartadas sem posição ${mil(l.descartadasSemPosicao)}; ficam ${mil(l.validasComPosicao)} linhas`,
  );
  console.log(
    `  deduplicação por (dsqfl ou coordenada a 5 casas) + categoria + mês: ${mil(l.validasComPosicao)} linhas -> ${mil(l.chavesUnicas)} processos únicos; ${mil(l.linhasColapsadas)} linhas colapsadas; ${mil(l.chavesComRepeticao)} chaves tinham repetição (maior: ${mil(l.maiorRepeticao)} linhas numa chave)`,
  );
  console.log(`  processos únicos por categoria: construção ${mil(l.porCategoria.construcao)}, acréscimo ${mil(l.porCategoria.acrescimo)}, demolição ${mil(l.porCategoria.demolicao)}, outras ${mil(l.porCategoria.outra)}`);
  console.log("  por edifício, em 24 meses (mediana, p90, máximo):");
  for (const slug of BAIRROS_COBERTOS) {
    const b = relatorio.porBairro[slug];
    console.log(
      `  ${slug.padEnd(11)} relevantes: ${textoDaDistribuicao(b.distRelevantes)} | demolições: ${textoDaDistribuicao(b.distDemolicoes)} | licenças desde 2018: mediana ${umaCasa(b.distLicencas.mediana)}`,
    );
    console.log(
      `              obras no arquivo ${String(b.obrasNoArquivo).padStart(4)}; edifícios com relevantes em 24 meses ${b.comRelevantes}/${b.edificios}; soma de demolições em 24 meses ${b.demolicoes24m}; edifícios com mais de 60 relevantes ${b.acimaDe60}`,
    );
  }
  for (const slug of BAIRROS_COBERTOS) {
    const b = relatorio.porBairro[slug];
    if (b.investigacao.length) {
      console.log(`  edifícios de ${slug} com mais de 60 relevantes em 24 meses (até 3, os maiores):`);
      for (const texto of b.investigacao) console.log(texto);
    }
  }

  console.log("\n6. ITBI");
  console.log(`  valores distintos de bairro que casam com os ${BAIRROS_COBERTOS.length} bairros (e quantas linhas): ${ordenarPorContagem(relatorio.itbi.bairrosDistintos).map(([v, c]) => `"${v}" ${mil(c)}`).join("; ")}`);
  console.log(`  valores distintos de tipo_imovel nessas linhas (e quantas): ${ordenarPorContagem(relatorio.itbi.tiposDistintos).map(([v, c]) => `"${v}" ${mil(c)}`).join("; ")}`);
  console.log(`  usados: bairro ${[...relatorio.itbi.bairroUsados].sort().map((v) => `"${v}"`).join(", ")}; tipo_imovel ${[...relatorio.itbi.apartamentoUsados].sort().map((v) => `"${v}"`).join(", ")}`);
  console.log("  vínculo ITBI x edifício por ano = transações de apartamento ligadas a um edifício do índice / transações de apartamento com número e data");
  const anos = relatorio.itbi.porAno.slice().sort((a, b) => a.ano - b.ano);
  for (const slug of BAIRROS_COBERTOS) {
    const b = relatorio.porBairro[slug];
    const denominador = (a) => {
      const s = a.porSlug[slug];
      return s.apartamentos - s.semChave - s.semData;
    };
    const taxas = (mapa) =>
      anos
        .map((a) => `${a.ano} ${porcentagem(mapa.get(a.ano) ?? 0, denominador(a))}`)
        .join("  ");
    const somaVinculo = (mapa) => anos.reduce((s, a) => s + (mapa.get(a.ano) ?? 0), 0);
    const somaDenominador = anos.reduce((s, a) => s + denominador(a), 0);
    console.log(`  ${slug.padEnd(11)} transações com número e data por ano: ${anos.map((a) => `${a.ano} ${denominador(a)}`).join("  ")}`);
    console.log(`              antes : ${taxas(b.itbiVinculadoAntesPorAno)}  (total ${porcentagem(somaVinculo(b.itbiVinculadoAntesPorAno), somaDenominador)})`);
    console.log(`              depois: ${taxas(b.itbiVinculadoPorAno)}  (total ${porcentagem(somaVinculo(b.itbiVinculadoPorAno), somaDenominador)})`);
  }
  for (const slug of BAIRROS_COBERTOS) {
    const b = relatorio.porBairro[slug];
    console.log(`  ${slug.padEnd(11)} edifícios com ITBI ${b.comItbi}/${b.edificios}; com valorUnidade (n>=3 em 36 meses) ${b.comItbiValorUnidade}; transações com valor nos 36 meses: ${b.itbiRecentes}`);
  }

  console.log("\n7. Tamanho dos arquivos (MB = 1.000.000 bytes, como no teste)");
  let soma = 0;
  for (const a of arquivos) {
    soma += a.bytes;
    console.log(`  ${a.nome.padEnd(16)} ${String(a.bytes).padStart(9)} bytes (${(a.bytes / MEGABYTE).toFixed(3)} MB)`);
  }
  console.log(`  ${"soma".padEnd(16)} ${String(soma).padStart(9)} bytes (${(soma / MEGABYTE).toFixed(3)} MB)`);
  for (const a of arquivos) if (a.bytes > 2 * MEGABYTE) aviso(`${a.nome} passa de 2,0 MB`);
  if (soma > 4 * MEGABYTE) aviso("a soma passa de 4 MB");

  console.log("\n8. meta.json (registrosLidos)");
  for (const f of meta.fontes) console.log(`  ${f.chave.padEnd(14)} ${mil(f.registrosLidos).padStart(8)}  modificadoEm ${f.modificadoEm}  recursos ${f.recursos.length}`);
}

// ——— Principal ——————————————————————————————————————————————————————————————————

async function main() {
  const catalogoAtual = path.join(RAIZ, "src/dados/recife/publicacaoGerada.ts");
  if (!TODOS_BAIRROS && fs.existsSync(catalogoAtual) && fs.readFileSync(catalogoAtual, "utf8").includes("indice-municipal/")) {
    throw new Error("Há uma versão municipal ativa. Use --todos-bairros, audite o staging e execute ativar-indice-municipal.mjs para atualizar o índice local.");
  }
  console.log(`Índice cadastral do Recife (${SEM_LOTES ? "sem Lotes" : "completo"})`);
  fs.mkdirSync(DIR_CACHE, { recursive: true });
  fs.mkdirSync(DIR_SAIDA, { recursive: true });

  // Carimbo estável: nasce na primeira execução e fica no cache, para a segunda gerar arquivos idênticos.
  const arquivoCarimbo = path.join(DIR_CACHE, TODOS_BAIRROS ? "geradoEm-municipal.txt" : "geradoEm.txt");
  if (!fs.existsSync(arquivoCarimbo)) gravarAtomico(arquivoCarimbo, `${new Date().toISOString().slice(0, 19)}Z`);
  const geradoEm = fs.readFileSync(arquivoCarimbo, "utf-8").trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(geradoEm)) throw new Error(`Carimbo inválido em ${arquivoCarimbo}`);
  const geradoEmData = geradoEm.slice(0, 10);
  const [ano, mes, dia] = geradoEmData.split("-").map(Number);
  const limiar24m = new Date(Date.UTC(ano - 2, mes - 1, dia)).toISOString().slice(0, 10);
  const limiar36m = new Date(Date.UTC(ano - 3, mes - 1, dia)).toISOString().slice(0, 10);
  console.log(`geradoEm ${geradoEm}; janela de 24 meses (obras) a partir de ${limiar24m}; janela de 36 meses (ITBI) a partir de ${limiar36m}`);

  // 1. Leitura das fontes (tudo antes de processar, para falhar cedo e deixar o cache pronto).
  console.log("\nMetadados dos recursos");
  const idsDeRecursos = [RECURSO_IPTU_2026, ...RECURSOS_ITBI.map((r) => r.id), RECURSO_LICENCIAMENTO, RECURSO_LOTES, RECURSO_BAIRROS];
  const metas = new Map();
  for (const id of idsDeRecursos) metas.set(id, await metadadosDoRecurso(id));

  console.log("\nBairros");
  const bairros = await lerBairrosOficiais();
  console.log(`  ${bairros.registros.length} bairros, total da API ${bairros.total}`);
  console.log("\nIPTU 2026");
  const iptu = await lerIptu();
  console.log("\nITBI");
  const itbiAnos = await lerItbi(metas);
  console.log("\nLicenciamento");
  const licenciamento = await lerLicenciamento();
  // Ferramentas do cliente CKAN e do cache, emprestadas às camadas "A rua" (scripts/dados/rua/camadas.mjs).
  const ferramentas = { lerTabela, metadadosDoRecurso, chamarCkan, comTentativas, ErroPermanente, gravarAtomico, lerJson, DIR_CACHE, mil };
  // Lido antes dos Lotes: os locais com licença de som sem coordenada usam o centro do lote.
  const ambiental = SEM_RUA ? null : await lerLicenciamentoAmbiental(ferramentas);
  const caminhoLotes = SEM_LOTES ? null : await garantirArquivoDeLotes(metas.get(RECURSO_LOTES));

  const relatorio = novoRelatorio();
  const contagens = {
    iptu: 0,
    itbi: itbiAnos.reduce((s, a) => s + a.lidos, 0),
    licenciamento: licenciamento.registros.length,
    lotes: 0,
    bairros: bairros.registros.length,
  };

  // 2. Grupos do IPTU (todos os de 2+ registros; os sem nenhuma coordenada esperam o endereço do lote).
  console.log("\nEdifícios");
  const montados = {};
  for (const slug of BAIRROS_COBERTOS) {
    const montado = montarEdificios(slug, iptu[slug], relatorio);
    montados[slug] = montado;
    const lidos = iptu[slug].reduce((s, g) => s + g.lidos, 0);
    contagens.iptu += lidos;
    relatorio.porBairro[slug] = {
      grafias: iptu[slug],
      iptuLidos: lidos,
      iptuTotal: iptu[slug].reduce((s, g) => s + g.total, 0),
      antes: montado.idsAntes.size,
      antesNoFinal: 0,
      candidatos: montado.edificios.length,
      semCoordenada: montado.semCoordenada.size,
      recuperados: 0, recuperadosExato: 0, recuperadosPrefixo: 0, descartados: 0, ambiguos: 0, ambiguosPrefixo: 0,
      paresDePrefixo: new Map(),
      pavimentosDivergentes: 0, pavimentosAcimaDe4ComIptuAte4: 0,
      edificios: 0, semArea: 0, iptuInvalido: 0, mais60: 0,
      comLote: 0, comNome: 0, comPavimentos: 0, comPoligono: 0,
      obrasNoArquivo: 0, comRelevantes: 0, demolicoes24m: 0, acimaDe60: 0, investigacao: [],
      distRelevantes: null, distDemolicoes: null, distLicencas: null,
      comItbi: 0, comItbiValorUnidade: 0, itbiRecentes: 0, itbiVinculadoPorAno: new Map(), itbiVinculadoAntesPorAno: new Map(),
    };
    console.log(`  ${slug}: ${montado.edificios.length} grupos com 2+ registros (${montado.semCoordenada.size} sem nenhuma coordenada)`);
  }
  const todos = BAIRROS_COBERTOS.flatMap((s) => montados[s].edificios);
  const ids = new Set();
  for (const e of todos) {
    if (ids.has(e.id)) throw new Error(`Id de edifício repetido entre bairros: ${e.id}`);
    ids.add(e.id);
  }

  // 3. Lotes: vínculo do edifício, lote dos edifícios sem coordenada (pelo endereço) e centro dos lotes das obras
  //    sem coordenada.
  let centroPorDsqfl = new Map();
  if (!SEM_LOTES) {
    console.log("\nLotes (uma passada pelo GeoJSON)");
    const pedidos = dsqflsSemCoordenada(licenciamento.registros);
    if (ambiental) for (const d of dsqflsDaLuse(ambiental)) pedidos.add(d);
    const numerosPedidos = new Set();
    for (const e of todos) if (e.centro === null) numerosPedidos.add(chaveDeNumero(Number(e.numero), e.bairro));
    const lotes = await passarPelosLotes(caminhoLotes, todos, pedidos, numerosPedidos);
    centroPorDsqfl = lotes.centroPorDsqfl;
    contagens.lotes = lotes.feicoes;
    Object.assign(relatorio.lotes, { feicoes: lotes.feicoes, vazias: lotes.vazias, duplicados: lotes.duplicados });
    todos.forEach((e, i) => {
      const achado = lotes.achados[i];
      if (!achado) return;
      e.dsqfl = achado.dsqfl;
      e.nome = achado.nome;
      e.pavimentos = achado.pavimentos;
      e.poligono = poligonoDoLote(achado.anel);
    });
    for (const e of todos) {
      if (e.centro !== null) continue;
      const rb = relatorio.porBairro[e.bairro];
      const { lote, ambiguo, via, ruaDoEdificio } = acharLoteDoEndereco(e, lotes.candidatosPorNumero);
      if (!lote) {
        rb.descartados++;
        if (ambiguo) {
          rb.ambiguos++;
          if (via === "prefixo") rb.ambiguosPrefixo++;
        }
        continue;
      }
      rb.recuperados++;
      if (via === "prefixo") {
        rb.recuperadosPrefixo++;
        const par = `"${ruaDoEdificio}" ~ "${lote.rua}"`;
        rb.paresDePrefixo.set(par, (rb.paresDePrefixo.get(par) ?? 0) + 1);
      } else rb.recuperadosExato++;
      e.centro = lote.centro;
      e.dsqfl = lote.dsqfl;
      e.nome = lote.nome;
      e.pavimentos = lote.pavimentos;
      e.poligono = poligonoDoLote(lote.anel);
    }
  } else {
    for (const e of todos) if (e.centro === null) relatorio.porBairro[e.bairro].descartados++;
  }

  // Edifícios do índice: os que têm centro (coordenada do IPTU ou lote achado pelo endereço).
  const edificiosPorBairro = {};
  const iptuPorM2PorBairro = {};
  for (const slug of BAIRROS_COBERTOS) {
    const montado = montados[slug];
    const rb = relatorio.porBairro[slug];
    const edificios = montado.edificios.filter((e) => e.centro !== null);
    edificiosPorBairro[slug] = edificios;
    iptuPorM2PorBairro[slug] = edificios.flatMap((e) => montado.iptuPorM2PorId.get(e.id));
    rb.edificios = edificios.length;
    rb.antesNoFinal = edificios.filter((e) => montado.idsAntes.has(e.id)).length;
    for (const e of edificios) {
      // As fontes divergem: lote com até 4 pavimentos e IPTU dizendo "> 4 Pavimentos". Fica null.
      if (e.pavimentos !== null && e.pavimentos <= 4 && e.ate4Pavimentos === false) {
        e.pavimentos = null;
        rb.pavimentosDivergentes++;
      } else if (e.pavimentos !== null && e.pavimentos > 4 && e.ate4Pavimentos === true) {
        rb.pavimentosAcimaDe4ComIptuAte4++; // só contado: o pedido trata apenas o caso inverso
      }
      const d = montado.diagnostico.get(e.id);
      rb.semArea += d.semArea;
      rb.iptuInvalido += d.iptuInvalido;
      rb.mais60 += d.acimaDe60;
    }
    console.log(
      `  ${slug}: ${edificios.length} edifícios (antes ${rb.antes}; recuperados pelo endereço ${rb.recuperados}, sendo ${rb.recuperadosExato} por rua igual e ${rb.recuperadosPrefixo} por rua renomeada; descartados ${rb.descartados}); pavimentos nulos por divergência com o IPTU ${rb.pavimentosDivergentes}`,
    );
  }

  // 4. A rua (v1.1): acrescenta `rua` a cada edifício; devolve o `rua` de cada bairro e as fontes do meta.json.
  const rua = SEM_RUA
    ? null
    : await montarARua({
        edificiosPorBairro,
        geradoEm,
        centroPorDsqfl,
        ambiental,
        f: ferramentas,
      });

  // 5. ITBI e obras, por bairro; escrita.
  console.log("\nITBI e obras");
  const itbiPorBairro = indexarItbi(itbiAnos, limiar36m, geradoEmData, relatorio);
  const processos = prepararProcessos(licenciamento.registros, centroPorDsqfl, geradoEmData, relatorio);
  console.log(`  ${mil(processos.length)} processos de obra únicos com posição, desde ${INICIO_DA_SERIE} (${mil(relatorio.licenciamento.linhasColapsadas)} linhas colapsadas)`);

  const arquivos = [];
  for (const slug of BAIRROS_COBERTOS) {
    const edificios = edificiosPorBairro[slug];
    const rb = relatorio.porBairro[slug];

    for (const e of edificios) {
      const transacoes = itbiPorBairro[slug].porId.get(e.id);
      e.itbi = resumoDoItbi(transacoes);
      if (e.itbi) {
        rb.comItbi++;
        if (e.itbi.valorUnidade) rb.comItbiValorUnidade++;
        for (const [a, n] of e.itbi.porAno) rb.itbiVinculadoPorAno.set(a, (rb.itbiVinculadoPorAno.get(a) ?? 0) + n);
      }
    }
    for (const id of montados[slug].idsAntes) {
      for (const t of itbiPorBairro[slug].porId.get(id) ?? []) rb.itbiVinculadoAntesPorAno.set(t.ano, (rb.itbiVinculadoAntesPorAno.get(t.ano) ?? 0) + 1);
    }
    rb.itbiRecentes = itbiPorBairro[slug].valorRecente.length;

    const obras = ligarObras(edificios, processos, limiar24m);
    rb.obrasNoArquivo = obras.length;
    rb.comRelevantes = edificios.filter((e) => e.obras150m.relevantes24m > 0).length;
    rb.distRelevantes = distribuicao(edificios.map((e) => e.obras150m.relevantes24m));
    rb.distDemolicoes = distribuicao(edificios.map((e) => e.obras150m.demolicoes24m));
    rb.distLicencas = distribuicao(edificios.map((e) => e.obras150m.licencasDeObra));
    rb.demolicoes24m = edificios.reduce((s, e) => s + e.obras150m.demolicoes24m, 0);
    const excesso = edificios.filter((e) => e.obras150m.relevantes24m > 60).sort((a, b) => b.obras150m.relevantes24m - a.obras150m.relevantes24m);
    rb.acimaDe60 = excesso.length;
    rb.investigacao = excesso.slice(0, 3).flatMap((e) => explicarExcesso(e, processos, limiar24m));
    rb.comLote = edificios.filter((e) => e.dsqfl !== null).length;
    rb.comNome = edificios.filter((e) => e.nome !== null).length;
    rb.comPavimentos = edificios.filter((e) => e.pavimentos !== null).length;
    rb.comPoligono = edificios.filter((e) => e.poligono !== null).length;

    const indice = {
      bairro: slug,
      geradoEm,
      contexto: {
        bairro: slug,
        edificios: edificios.length,
        unidades: edificios.reduce((s, e) => s + e.unidades, 0),
        iptuAnualPorM2: quartis(iptuPorM2PorBairro[slug]),
      },
      edificios,
      obras,
      ...(rua ? { rua: rua.porBairro[slug] } : {}),
    };
    const conteudo = JSON.stringify(indice);
    gravarAtomico(path.join(DIR_SAIDA, `${slug}.json`), conteudo);
    arquivos.push({ nome: `${slug}.json`, bytes: Buffer.byteLength(conteudo) });
  }

  // 5. meta.json.
  const maisRecente = (ids) => ids.map((id) => metas.get(id).modificadoEm).filter(Boolean).sort().at(-1) ?? null;
  const fonte = (chave, nome, ids, registrosLidos, colunasUsadas) => {
    const pacote = metas.get(ids[0]).pacote;
    return {
      chave,
      nome,
      orgao: pacote.orgao ? `Prefeitura da Cidade do Recife · ${pacote.orgao}` : "Prefeitura da Cidade do Recife",
      licenca: "ODbL",
      url: `${SITE}/dataset/${pacote.nome}`,
      recursos: ids,
      modificadoEm: maisRecente(ids),
      consultadoEm: geradoEm,
      registrosLidos,
      colunasUsadas,
    };
  };
  const meta = {
    geradoEm,
    fontes: [
      fonte("iptu_2026", "IPTU 2026 (cadastro imobiliário)", [RECURSO_IPTU_2026], contagens.iptu, CAMPOS_IPTU),
      fonte("itbi", "ITBI 2016 a 2026 (transmissão de bens imóveis)", RECURSOS_ITBI.map((r) => r.id), contagens.itbi, CAMPOS_ITBI),
      fonte("licenciamento", "Licenciamento urbanístico (categoria Obra)", [RECURSO_LICENCIAMENTO], contagens.licenciamento, CAMPOS_LICENCIAMENTO),
      fonte("lotes", "Lotes (base cartográfica da área urbana)", [RECURSO_LOTES], contagens.lotes, COLUNAS_LOTES),
      fonte("bairros", "Bairros e RPAs do Recife", [RECURSO_BAIRROS], contagens.bairros, CAMPOS_BAIRROS),
    ],
    ...(rua ? { fontesDaRua: rua.fontes } : {}),
  };
  const conteudoMeta = JSON.stringify(meta);
  gravarAtomico(path.join(DIR_SAIDA, "meta.json"), conteudoMeta);
  arquivos.push({ nome: "meta.json", bytes: Buffer.byteLength(conteudoMeta) });

  imprimirRelatorio({ relatorio, contagens, geradoEm, arquivos, meta });
  if (rua) {
    console.log("\n9. A rua (v1.1)");
    for (const texto of rua.relatorio) console.log(texto);
    for (const f of rua.fontes) console.log(`  ${f.chave.padEnd(24)} ${mil(f.registrosLidos).padStart(8)}  modificadoEm ${f.modificadoEm}  licença ${f.licenca}`);
  }
}

main().catch((erro) => {
  console.error("\nErro na geração do índice:", erro);
  process.exit(1);
});
