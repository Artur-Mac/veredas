#!/usr/bin/env node
/**
 * Coleta as contagens de ocorrências por bairro do Recife publicadas pelo Crime Brasil (registros da SDS-PE
 * compilados pelo Crime Brasil) e grava um retrato com data em src/dados/recife/crime/.
 *
 * Uso:
 *   node scripts/dados/coletar-crime-recife.mjs                 coleta (ou reexecuta a partir do cache) e grava
 *   node scripts/dados/coletar-crime-recife.mjs --parsear ARQ   só lê um HTML de bairro e imprime o JSON (teste)
 *
 * Escopo (ampliado a pedido do usuário em 16/11/2026): os 94 bairros de src/dados/recife/bairros.ts, em três
 * papéis: "alvo" (os 5 da v1), "vizinho" (divisa de 50 m ou mais com algum alvo, calculada na malha oficial de
 * bairros da Prefeitura, ODbL) e "outro" (os demais). Só o Recife. Node >= 20, sem dependências.
 *
 * Regras que o script cumpre:
 * - Lê o robots.txt antes de tudo e aborta se ele vedar /bairro/pe/recife/ para qualquer robô.
 * - Uma requisição por vez, com no mínimo 3,5 s entre duas requisições ao Crime Brasil.
 * - HTML bruto em .cache/crime-recife/ (fora do git); uma página nunca é baixada duas vezes: com o cache, a
 *   reexecução não usa a rede (a malha de bairros também fica no cache). O carimbo da coleta mora no cache.
 * - User-Agent genérico de navegador: nenhum nome, e-mail ou projeto em cabeçalho.
 * - Desafio anti-robô, login, HTTP 401/403/429 ou 5xx: para na hora e não contorna. Redirecionamento não é
 *   seguido: uma página de bairro que redireciona conta como sem página.
 * - Só lê o HTML que o servidor já entrega (JSON-LD e as barras de contagem). Não chama API interna.
 * - Só os números e os nomes das naturezas são gravados. Nenhum texto, marca ou visualização do site.
 * - Total que não fecha com a soma das naturezas é gravado como veio e avisado: nunca é ajustado.
 * - Bairro sem página, com slug ambíguo ou cuja página não confirma o nome oficial fica fora do JSON e entra em
 *   `pendencias` no meta.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR_CACHE = path.join(RAIZ, ".cache", "crime-recife");
const DIR_HTML = path.join(DIR_CACHE, "html");
const DIR_SAIDA = path.join(RAIZ, "src", "dados", "recife", "crime");
const ARQUIVO_BAIRROS_TS = path.join(RAIZ, "src", "dados", "recife", "bairros.ts");

// ——— Constantes —————————————————————————————————————————————————————————————————

const SITE = "https://crimebrasil.com.br";
const URL_ROBOTS = `${SITE}/robots.txt`;
const URL_TERMOS = `${SITE}/termos`;
const URL_FONTE = `${SITE}/fontes/sds-pe`;
const URL_CIDADE = `${SITE}/cidade/pe/recife`;
const CAMINHO_BAIRRO = "/bairro/pe/recife/";
const urlDoBairro = (slug) => `${SITE}${CAMINHO_BAIRRO}${slug}`;

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const INTERVALO_MS = 3500;
const TEMPO_LIMITE_MS = 30_000;

const ALVOS = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];

/** Rótulos que o site lista como bairro do Recife mas que não estão em bairros.ts; coletados a pedido do usuário. */
const EXTRAS_FORA_DA_LISTA = [
  { slug: "centro", nome: "Centro", motivo: "rótulo do site; não consta na lista oficial de 94 bairros da Prefeitura" },
];

const CKAN = "https://dados.recife.pe.gov.br";
const RECURSO_MALHA = "5c67ce14-1799-40c4-a37c-9daa04d1761c";
const URL_DATASET_MALHA = `${CKAN}/dataset/area-urbana`;
/** Divisa = trecho compartilhado de pelo menos 50 m, com folga de 5 m entre os vértices das duas malhas. */
const TOLERANCIA_M = 5;
const DIVISA_MINIMA_M = 50;

const ATRIBUICAO = "registros da SDS-PE compilados pelo Crime Brasil";

// ——— Utilitários ————————————————————————————————————————————————————————————————

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function dobrar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function limpar(texto) {
  return decodificarEntidades(String(texto ?? "")).normalize("NFC").replace(/\s+/g, " ").trim();
}

function decodificarEntidades(texto) {
  return texto
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
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
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  const temporario = `${caminho}.tmp`;
  fs.writeFileSync(temporario, conteudo);
  fs.renameSync(temporario, caminho);
}

const mil = (n) => n.toLocaleString("pt-BR");
const ordemTexto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

class ErroDeColeta extends Error {}

// ——— Parser da página de bairro ————————————————————————————————————————————————————

/** "2.148" → 2148; texto que não seja inteiro com ponto de milhar (ou sem) vira null. */
function inteiroPtBr(texto) {
  const t = String(texto ?? "").trim();
  if (!/^(\d{1,3}(\.\d{3})+|\d+)$/.test(t)) return null;
  return Number(t.replace(/\./g, ""));
}

function blocosJsonLd(html) {
  const blocos = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      blocos.push(JSON.parse(m[1]));
    } catch {
      // bloco que não é JSON válido não serve
    }
  }
  return blocos;
}

function nosDoJsonLd(blocos) {
  const nos = [];
  for (const b of blocos) {
    if (Array.isArray(b?.["@graph"])) nos.push(...b["@graph"]);
    else nos.push(b);
  }
  return nos;
}

/** Janela "AAAA-MM/AAAA-MM" do JSON-LD → { inicio, fim }. */
function lerPeriodo(texto) {
  const m = /^(\d{4}-(?:0[1-9]|1[0-2]))\/(\d{4}-(?:0[1-9]|1[0-2]))$/.exec(String(texto ?? "").trim());
  if (!m || m[1] > m[2]) return null;
  return { inicio: m[1], fim: m[2] };
}

/**
 * Lê uma página de bairro do Crime Brasil (HTML que o servidor já entrega, sem JavaScript) e devolve só números
 * e nomes: { bairro, cidade, periodo, total, naturezas, atualizadoEm }. Lança ErroDeColeta se a estrutura
 * esperada não estiver na página (nunca devolve zero no lugar de um valor que faltou).
 *
 * Onde estão os dados:
 * - JSON-LD do tipo Dataset: `temporalCoverage` (janela de 12 meses) e `dateModified`;
 * - JSON-LD BreadcrumbList: o nome do município (3º item) e do bairro (4º item);
 * - o quadro "Ocorrências no período": o total;
 * - os pares <b>natureza</b><span>contagem</span> das barras: a contagem por natureza. As barras aparecem duas
 *   vezes, com "pct% · n" e só com "n"; as duas têm de concordar.
 */
export function parsearPaginaDeBairro(html) {
  const nos = nosDoJsonLd(blocosJsonLd(html));
  const dataset = nos.find((n) => n?.["@type"] === "Dataset");
  if (!dataset) throw new ErroDeColeta("página sem JSON-LD do tipo Dataset");
  const periodo = lerPeriodo(dataset.temporalCoverage);
  // Bairro sem registro recente: a página só mostra "todo o período disponível" e não declara datas.
  const historico = !periodo && /não tem ocorrências registradas nos últimos 12 meses/.test(html);
  if (!periodo && !historico) throw new ErroDeColeta(`temporalCoverage inválido: ${JSON.stringify(dataset.temporalCoverage)}`);

  const migalhas = nos.find((n) => n?.["@type"] === "BreadcrumbList")?.itemListElement;
  const itens = Array.isArray(migalhas) ? migalhas.slice().sort((a, b) => a.position - b.position) : [];
  const cidade = limpar(itens[2]?.name);
  const bairro = limpar(itens[3]?.name);
  if (!cidade || !bairro) throw new ErroDeColeta("página sem os nomes de município e bairro no JSON-LD");

  const quadro = /<div class="bv2-sl">Ocorrências (no período|\(todo o período\))<\/div><div class="bv2-sv">([^<]*)<\/div>/.exec(html);
  if (quadro && (quadro[1] === "no período") === historico) throw new ErroDeColeta("o rótulo do total não combina com a janela declarada na página");
  const total = quadro ? inteiroPtBr(quadro[2]) : null;
  if (total === null) throw new ErroDeColeta("página sem o total de ocorrências do período");

  const comPercentual = new Map();
  const soContagem = [];
  for (const m of html.matchAll(/<div class="bv2-bh"><b>([^<]*)<\/b><span>([^<]*)<\/span><\/div>/g)) {
    const natureza = limpar(m[1]);
    const valor = limpar(m[2]);
    const dupla = /^[\d.,]+%\s*·\s*(.+)$/.exec(valor);
    if (dupla) {
      const n = inteiroPtBr(dupla[1]);
      if (n === null) throw new ErroDeColeta(`contagem ilegível em "${natureza}": ${valor}`);
      comPercentual.set(natureza, n);
    } else {
      const n = inteiroPtBr(valor);
      if (n === null) throw new ErroDeColeta(`contagem ilegível em "${natureza}": ${valor}`);
      soContagem.push({ natureza, ocorrencias: n });
    }
  }
  if (soContagem.length === 0) throw new ErroDeColeta("página sem contagem por natureza");
  const nomes = new Set(soContagem.map((x) => x.natureza));
  if (nomes.size !== soContagem.length) throw new ErroDeColeta("natureza repetida na lista de contagens");
  for (const { natureza, ocorrencias } of soContagem) {
    if (comPercentual.has(natureza) && comPercentual.get(natureza) !== ocorrencias) {
      throw new ErroDeColeta(`contagem de "${natureza}" difere entre as duas listas da página`);
    }
  }
  for (const natureza of comPercentual.keys()) {
    if (!nomes.has(natureza)) throw new ErroDeColeta(`natureza "${natureza}" só aparece numa das listas da página`);
  }

  return {
    bairro,
    cidade,
    janela: historico ? "todo-o-periodo" : "12-meses",
    periodo: historico ? null : periodo,
    total,
    naturezas: soContagem,
    atualizadoEm: typeof dataset.dateModified === "string" ? dataset.dateModified.slice(0, 10) : null,
    licencaDeclaradaPeloSite: typeof dataset.license === "string" ? dataset.license : null,
  };
}

// ——— Rede (Crime Brasil), com cache e intervalo ——————————————————————————————————

const manifestoCaminho = path.join(DIR_CACHE, "manifesto.json");
const manifesto = lerJson(manifestoCaminho) ?? {};
let ultimaRequisicao = 0;
let requisicoesFeitas = 0;

function gravarManifesto() {
  gravarAtomico(manifestoCaminho, JSON.stringify(manifesto, null, 2) + "\n");
}

/** Marcadores de desafio anti-robô (não confundir com o script passivo de detecção da Cloudflare). */
const DESAFIO = /<title>\s*(just a moment|attention required|verifying you are human|access denied)|id="challenge-form"|cf-turnstile|g-recaptcha|h-captcha|data-sitekey/i;

/**
 * HTML (ou texto) de uma URL do Crime Brasil. Do cache se já existir; senão uma requisição, depois do intervalo.
 * Devolve { corpo, status, coletadoEm, doCache }. 404 e 3xx voltam como status (a página não existe ou saiu do
 * lugar); 401, 403, 429, 5xx e desafio abortam a coleta inteira.
 */
async function obterPagina(url, arquivo) {
  const caminho = path.join(DIR_CACHE, arquivo);
  const registro = manifesto[url];
  if (fs.existsSync(caminho) && registro) {
    return { corpo: fs.readFileSync(caminho, "utf-8"), status: registro.status, coletadoEm: registro.em, doCache: true };
  }
  if (fs.existsSync(caminho) && !registro) {
    // Arquivo guardado à mão antes do script existir: adota, com o instante da gravação como carimbo.
    const em = fs.statSync(caminho).mtime.toISOString().replace(/\.\d{3}Z$/, "Z");
    manifesto[url] = { status: 200, em, arquivo };
    gravarManifesto();
    return { corpo: fs.readFileSync(caminho, "utf-8"), status: 200, coletadoEm: em, doCache: true };
  }
  if (registro && registro.status !== 200) {
    return { corpo: "", status: registro.status, coletadoEm: registro.em, doCache: true };
  }

  const espera = ultimaRequisicao + INTERVALO_MS - Date.now();
  if (espera > 0) await esperar(espera);
  ultimaRequisicao = Date.now();
  requisicoesFeitas++;
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml", "accept-language": "pt-BR,pt;q=0.9" },
  });
  const em = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  if ([401, 403, 429].includes(res.status) || res.status >= 500) {
    throw new ErroDeColeta(`HTTP ${res.status} em ${url}: coleta interrompida, nada foi contornado`);
  }
  if (res.status === 404 || (res.status >= 300 && res.status < 400)) {
    manifesto[url] = { status: res.status, em, arquivo: null, destino: res.headers.get("location") ?? null };
    gravarManifesto();
    return { corpo: "", status: res.status, coletadoEm: em, doCache: false };
  }
  if (res.status !== 200) throw new ErroDeColeta(`HTTP ${res.status} inesperado em ${url}`);
  const corpo = await res.text();
  if (DESAFIO.test(corpo)) throw new ErroDeColeta(`desafio anti-robô ou login em ${url}: coleta interrompida, nada foi contornado`);
  gravarAtomico(caminho, corpo);
  manifesto[url] = { status: 200, em, arquivo };
  gravarManifesto();
  console.log(`  baixado ${url} (${mil(corpo.length)} caracteres)`);
  return { corpo, status: 200, coletadoEm: em, doCache: false };
}

/** Lê o robots.txt e confirma que as páginas de bairro não estão vedadas para `User-agent: *`. */
function robotsPermiteBairros(texto) {
  const grupos = [];
  let atual = null;
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.replace(/#.*$/, "").trim();
    if (!linha) continue;
    const m = /^([^:]+):\s*(.*)$/.exec(linha);
    if (!m) continue;
    const chave = m[1].trim().toLowerCase();
    if (chave === "user-agent") {
      if (!atual || atual.regras.length > 0) {
        atual = { agentes: [], regras: [] };
        grupos.push(atual);
      }
      atual.agentes.push(m[2].trim().toLowerCase());
    } else if (atual && (chave === "allow" || chave === "disallow")) {
      atual.regras.push({ tipo: chave, caminho: m[2].trim() });
    }
  }
  const grupo = grupos.find((g) => g.agentes.includes("*"));
  if (!grupo) return true;
  // Vale a regra mais longa que casa com o caminho; empate vai para Allow.
  let melhor = null;
  for (const r of grupo.regras) {
    if (r.caminho === "") continue;
    const padrao = new RegExp("^" + r.caminho.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*"));
    if (!padrao.test(CAMINHO_BAIRRO + "boa-viagem")) continue;
    if (!melhor || r.caminho.length > melhor.caminho.length || (r.caminho.length === melhor.caminho.length && r.tipo === "allow")) melhor = r;
  }
  return !melhor || melhor.tipo === "allow";
}

// ——— bairros.ts ————————————————————————————————————————————————————————————————

/** Lista oficial dos 94 bairros, lida do próprio bairros.ts (fonte única de nomes, slugs e aliases). */
function lerBairrosOficiais() {
  const texto = fs.readFileSync(ARQUIVO_BAIRROS_TS, "utf-8");
  const lista = [];
  const re = /\{\s*slug:\s*"([^"]+)",\s*nome:\s*"([^"]+)",\s*rpa:\s*(\d+)(?:,\s*aliases:\s*\[([^\]]*)\])?\s*\}/g;
  for (const m of texto.matchAll(re)) {
    lista.push({
      slug: m[1],
      nome: m[2],
      rpa: Number(m[3]),
      aliases: m[4] ? [...m[4].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [],
    });
  }
  if (lista.length !== 94) throw new ErroDeColeta(`bairros.ts: li ${lista.length} bairros, esperava 94`);
  return lista;
}

// ——— Divisas pela malha oficial ——————————————————————————————————————————————————

async function baixarMalha() {
  const caminho = path.join(DIR_CACHE, "bairros-do-recife.geojson");
  const metaCaminho = path.join(DIR_CACHE, "bairros-do-recife.meta.json");
  const emCache = lerJson(metaCaminho);
  if (fs.existsSync(caminho) && emCache) return { caminho, ...emCache, doCache: true };

  const rec = await fetch(`${CKAN}/api/3/action/resource_show?id=${RECURSO_MALHA}`, { signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
  const corpo = await rec.json();
  if (!rec.ok || !corpo.success) throw new ErroDeColeta(`resource_show da malha: HTTP ${rec.status}`);
  const url = corpo.result.url;
  const modificadoEm = typeof corpo.result.last_modified === "string" ? corpo.result.last_modified.slice(0, 10) : null;
  if (!fs.existsSync(caminho)) {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(5 * 60_000) });
    if (!res.ok) throw new ErroDeColeta(`download da malha: HTTP ${res.status}`);
    gravarAtomico(caminho, Buffer.from(await res.arrayBuffer()));
  }
  const consultadoEm = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const meta = { modificadoEm, consultadoEm, url };
  gravarAtomico(metaCaminho, JSON.stringify(meta));
  return { caminho, ...meta, doCache: false };
}

function distanciaAoSegmento(p, a, b, escala) {
  const dx = (b[0] - a[0]) * escala.x;
  const dy = (b[1] - a[1]) * escala.y;
  const px = (p[0] - a[0]) * escala.x;
  const py = (p[1] - a[1]) * escala.y;
  const L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, (px * dx + py * dy) / L)) : 0;
  return Math.hypot(px - t * dx, py - t * dy);
}

/**
 * Para cada bairro-alvo, os outros bairros cujo limite acompanha o dele por pelo menos DIVISA_MINIMA_M metros.
 * Mede, no contorno do alvo, os segmentos com os dois extremos a até TOLERANCIA_M do contorno do outro bairro
 * (metros por grau na latitude do Recife). Devolve também o que ficou abaixo do mínimo, para o relatório.
 * `slugDaFeicao` liga cada feição da malha ao slug do bairros.ts (null se não achar).
 */
function calcularDivisas(geojson, slugDaFeicao) {
  const escala = { x: 111320 * Math.cos((-8.05 * Math.PI) / 180), y: 110574 };
  const bairros = geojson.features.map((f) => {
    const partes = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    const aneis = partes.flat();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const anel of aneis) {
      for (const [x, y] of anel) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    return { slug: slugDaFeicao(f), aneis, caixa: { minX, maxX, minY, maxY } };
  });
  const folgaX = TOLERANCIA_M / escala.x;
  const folgaY = TOLERANCIA_M / escala.y;
  const distancia = (p, outro) => {
    let menor = Infinity;
    for (const anel of outro.aneis) {
      for (let i = 1; i < anel.length; i++) {
        const d = distanciaAoSegmento(p, anel[i - 1], anel[i], escala);
        if (d < menor) menor = d;
      }
    }
    return menor;
  };

  const resultado = {};
  for (const alvo of ALVOS) {
    const A = bairros.find((b) => b.slug === alvo);
    if (!A) throw new ErroDeColeta(`bairro-alvo "${alvo}" não achado na malha`);
    const vizinhos = [];
    for (const B of bairros) {
      if (B === A) continue;
      const c = B.caixa;
      if (A.caixa.minX > c.maxX + folgaX || A.caixa.maxX < c.minX - folgaX || A.caixa.minY > c.maxY + folgaY || A.caixa.maxY < c.minY - folgaY) continue;
      let comprimento = 0;
      for (const anel of A.aneis) {
        let anteriorPerto = distancia(anel[0], B) <= TOLERANCIA_M;
        for (let i = 1; i < anel.length; i++) {
          const perto = distancia(anel[i], B) <= TOLERANCIA_M;
          if (perto && anteriorPerto) comprimento += Math.hypot((anel[i][0] - anel[i - 1][0]) * escala.x, (anel[i][1] - anel[i - 1][1]) * escala.y);
          anteriorPerto = perto;
        }
      }
      if (comprimento >= DIVISA_MINIMA_M && !B.slug) {
        throw new ErroDeColeta(`a malha tem um bairro que divide ${Math.round(comprimento)} m com "${alvo}" e não casa com bairros.ts`);
      }
      if (comprimento > 0 && B.slug) vizinhos.push({ slug: B.slug, metros: Math.round(comprimento) });
    }
    vizinhos.sort((a, b) => b.metros - a.metros || ordemTexto(a.slug, b.slug));
    resultado[alvo] = vizinhos;
  }
  return resultado;
}

// ——— Coleta ————————————————————————————————————————————————————————————————————

/** Slugs de bairro que a página do município de fato lista (os links /bairro/pe/recife/{slug}). */
function slugsDaCidade(html) {
  const slugs = new Set();
  for (const m of html.matchAll(/href="\/bairro\/pe\/recife\/([a-z0-9-]+)"/g)) slugs.add(m[1]);
  return slugs;
}

function trechosDaFonte(html) {
  const texto = decodificarEntidades(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
  const achados = [];
  for (const re of [/[^.]{0,120}sem bairro[^.]{0,120}\./i, /[^.]{0,120}registros[^.]{0,40}(?:jan|20\d\d)[^.]{0,120}\./i]) {
    const m = re.exec(texto);
    if (m) achados.push(m[0].trim());
  }
  return achados;
}

async function coletar() {
  fs.mkdirSync(DIR_HTML, { recursive: true });
  console.log("Coleta de crime por bairro (Crime Brasil, registros da SDS-PE)\n");

  // 1. robots.txt e termos, antes de qualquer página de bairro.
  const robots = await obterPagina(URL_ROBOTS, "robots.txt");
  if (robots.status !== 200) throw new ErroDeColeta(`robots.txt respondeu HTTP ${robots.status}: não dá para confirmar a permissão`);
  if (!robotsPermiteBairros(robots.corpo)) {
    throw new ErroDeColeta("robots.txt veda as páginas de bairro: coleta cancelada, nada foi baixado");
  }
  console.log(`  robots.txt permite ${CAMINHO_BAIRRO}* para "User-agent: *" (lido em ${robots.coletadoEm}${robots.doCache ? ", cache" : ""})`);
  const termos = await obterPagina(URL_TERMOS, "termos.html");
  if (termos.status !== 200) throw new ErroDeColeta(`/termos respondeu HTTP ${termos.status}`);
  console.log(`  termos de uso lidos (${termos.coletadoEm}${termos.doCache ? ", cache" : ""})`);

  // 2. Escopo: alvos e vizinhos pela malha oficial.
  const oficiais = lerBairrosOficiais();
  const porNome = new Map(oficiais.map((b) => [dobrar(b.nome), b]));
  const malha = await baixarMalha();
  const geojson = JSON.parse(fs.readFileSync(malha.caminho, "utf-8"));
  if (geojson.features.length !== 94) throw new ErroDeColeta(`malha com ${geojson.features.length} bairros, esperava 94`);
  const semCorrespondencia = [];
  const slugDaFeicao = (f) => {
    // Nome de exibição, depois o nome em caixa alta do cadastro ("COHAB" para "Cohab - Ibura de Cima"), depois o slug do nome.
    const nome = f.properties.EBAIRRNOMEOF;
    const b =
      porNome.get(dobrar(nome)) ??
      porNome.get(dobrar(f.properties.EBAIRRNOME)) ??
      oficiais.find((o) => o.slug === dobrar(nome).replace(/\s+/g, "-"));
    if (!b) semCorrespondencia.push(nome);
    return b?.slug ?? null;
  };
  const divisas = calcularDivisas(geojson, slugDaFeicao);
  console.log(`\nMalha oficial de bairros (${malha.modificadoEm}${malha.doCache ? ", cache" : ""}): 94 feições; feições sem correspondência em bairros.ts: ${semCorrespondencia.length ? [...new Set(semCorrespondencia)].join(", ") : "nenhuma"}`);

  /** slug → { papel, divisaComAlvos } */
  const escopo = new Map();
  for (const a of ALVOS) escopo.set(a, { papel: "alvo", divisaComAlvos: [] });
  const abaixoDoMinimo = [];
  for (const alvo of ALVOS) {
    for (const v of divisas[alvo]) {
      if (v.metros < DIVISA_MINIMA_M) {
        abaixoDoMinimo.push({ alvo, vizinho: v.slug, metros: v.metros });
        continue;
      }
      if (!escopo.has(v.slug)) escopo.set(v.slug, { papel: "vizinho", divisaComAlvos: [] });
      escopo.get(v.slug).divisaComAlvos.push(alvo);
    }
  }
  for (const alvo of ALVOS) {
    const e = escopo.get(alvo);
    e.divisaComAlvos = ALVOS.filter((o) => o !== alvo && divisas[alvo].some((v) => v.slug === o && v.metros >= DIVISA_MINIMA_M));
  }
  const porNomeOrdenado = (slugs) =>
    slugs.sort((a, b) => ordemTexto(dobrar(oficiais.find((o) => o.slug === a).nome), dobrar(oficiais.find((o) => o.slug === b).nome)));
  const vizinhos = porNomeOrdenado([...escopo.keys()].filter((s) => !ALVOS.includes(s)));
  for (const o of oficiais) if (!escopo.has(o.slug)) escopo.set(o.slug, { papel: "outro", divisaComAlvos: [] });
  const outros = porNomeOrdenado([...escopo.keys()].filter((s) => !ALVOS.includes(s) && !vizinhos.includes(s)));
  const ordemSlugs = [...ALVOS, ...vizinhos, ...outros];
  console.log(`\nEscopo: ${ALVOS.length} alvos + ${vizinhos.length} vizinhos + ${outros.length} outros = ${ordemSlugs.length} bairros`);
  for (const alvo of ALVOS) {
    console.log(`  ${alvo}: ${divisas[alvo].map((v) => `${v.slug} ${v.metros} m${v.metros < DIVISA_MINIMA_M ? " (abaixo do mínimo, fora)" : ""}`).join(", ")}`);
  }

  // 3. Página do município (slugs de verdade) e página da fonte.
  const cidade = await obterPagina(URL_CIDADE, "cidade-recife.html");
  if (cidade.status !== 200) throw new ErroDeColeta(`página do município respondeu HTTP ${cidade.status}`);
  const slugsNoSite = slugsDaCidade(cidade.corpo);
  console.log(`\nPágina do município: ${slugsNoSite.size} bairros com link`);
  const fonte = await obterPagina(URL_FONTE, "fonte-sds-pe.html");
  const trechos = fonte.status === 200 ? trechosDaFonte(fonte.corpo) : [];
  trechos.forEach((t) => console.log(`  fonte: ${t}`));

  // 4. Uma página por bairro, uma de cada vez.
  const pendencias = [];
  const bairros = [];
  console.log("\nPáginas de bairro");
  for (const slug of ordemSlugs) {
    const oficial = oficiais.find((o) => o.slug === slug);
    const candidatos = [slug, ...oficial.aliases].filter((s) => slugsNoSite.has(s));
    if (candidatos.length === 0) {
      pendencias.push({ slug, nome: oficial.nome, motivo: `nenhum link do site corresponde ao slug "${slug}"${oficial.aliases.length ? ` nem aos aliases ${oficial.aliases.join(", ")}` : ""}` });
      console.log(`  ${slug}: SEM PÁGINA (fora do JSON)`);
      continue;
    }
    if (candidatos.length > 1) {
      pendencias.push({ slug, nome: oficial.nome, motivo: `slug ambíguo: o site lista ${candidatos.join(" e ")}` });
      console.log(`  ${slug}: SLUG AMBÍGUO (${candidatos.join(", ")}; fora do JSON)`);
      continue;
    }
    const slugNoSite = candidatos[0];
    const url = urlDoBairro(slugNoSite);
    const pagina = await obterPagina(url, path.join("html", `${slugNoSite}.html`));
    if (pagina.status !== 200) {
      pendencias.push({ slug, nome: oficial.nome, motivo: `HTTP ${pagina.status} em ${url}` });
      console.log(`  ${slug}: HTTP ${pagina.status} (fora do JSON)`);
      continue;
    }
    let lido;
    try {
      lido = parsearPaginaDeBairro(pagina.corpo);
    } catch (erro) {
      pendencias.push({ slug, nome: oficial.nome, motivo: `página sem a estrutura esperada em ${url}: ${erro.message}` });
      console.log(`  ${slug}: página sem a estrutura esperada (${erro.message}); fora do JSON`);
      continue;
    }
    if (dobrar(lido.cidade) !== "recife") {
      pendencias.push({ slug, nome: oficial.nome, motivo: `a página é do município "${lido.cidade}"` });
      console.log(`  ${slug}: município "${lido.cidade}" (fora do JSON)`);
      continue;
    }
    // "Recife (bairro)" em bairros.ts aparece só como "Recife" no site.
    if (![oficial.nome, oficial.nome.replace(/\s*\(bairro\)$/i, "")].some((n) => dobrar(n) === dobrar(lido.bairro))) {
      pendencias.push({ slug, nome: oficial.nome, motivo: `a página de ${slugNoSite} diz "${lido.bairro}", não "${oficial.nome}"` });
      console.log(`  ${slug}: a página diz "${lido.bairro}" (fora do JSON)`);
      continue;
    }
    const soma = lido.naturezas.reduce((s, n) => s + n.ocorrencias, 0);
    const fecha = soma === lido.total;
    console.log(
      `  ${slug}${slugNoSite !== slug ? ` (site: ${slugNoSite})` : ""}: ${mil(lido.total)} ocorrências ${lido.periodo ? `em ${lido.periodo.inicio}/${lido.periodo.fim}` : "em TODO O PERÍODO (sem janela de 12 meses)"}, ${lido.naturezas.length} naturezas, soma ${mil(soma)}${fecha ? "" : "  ! NÃO FECHA"}${pagina.doCache ? " (cache)" : ""}`,
    );
    bairros.push({
      nome: oficial.nome,
      slug,
      papel: escopo.get(slug).papel,
      divisaComAlvos: escopo.get(slug).divisaComAlvos,
      janela: lido.janela,
      periodo: lido.periodo,
      total: lido.total,
      naturezas: lido.naturezas,
      url,
      _coletadoEm: pagina.coletadoEm,
      _atualizadoEm: lido.atualizadoEm,
      _licenca: lido.licencaDeclaradaPeloSite,
    });
  }

  // 4b. Rótulos do site que não são bairro da lista oficial, pedidos pelo usuário. Ficam num bloco à parte.
  const foraDaLista = [];
  console.log("\nRótulos do site fora da lista oficial");
  for (const extra of EXTRAS_FORA_DA_LISTA) {
    if (!slugsNoSite.has(extra.slug)) {
      pendencias.push({ slug: extra.slug, nome: extra.nome, motivo: "o site não lista mais este rótulo na página do município" });
      console.log(`  ${extra.slug}: sem link no site (fora do JSON)`);
      continue;
    }
    const url = urlDoBairro(extra.slug);
    const pagina = await obterPagina(url, path.join("html", `${extra.slug}.html`));
    if (pagina.status !== 200) {
      pendencias.push({ slug: extra.slug, nome: extra.nome, motivo: `HTTP ${pagina.status} em ${url}` });
      console.log(`  ${extra.slug}: HTTP ${pagina.status} (fora do JSON)`);
      continue;
    }
    const lido = parsearPaginaDeBairro(pagina.corpo);
    if (dobrar(lido.cidade) !== "recife" || dobrar(lido.bairro) !== dobrar(extra.nome)) {
      throw new ErroDeColeta(`${url}: a página diz "${lido.bairro}" em "${lido.cidade}", esperava "${extra.nome}" em Recife`);
    }
    const soma = lido.naturezas.reduce((s, n) => s + n.ocorrencias, 0);
    console.log(
      `  ${extra.slug}: ${mil(lido.total)} ocorrências ${lido.periodo ? `em ${lido.periodo.inicio}/${lido.periodo.fim}` : "em TODO O PERÍODO"}, ${lido.naturezas.length} naturezas, soma ${mil(soma)}${soma === lido.total ? "" : "  ! NÃO FECHA"}${pagina.doCache ? " (cache)" : ""}`,
    );
    foraDaLista.push({
      nome: extra.nome,
      slug: extra.slug,
      papel: "outro",
      motivo: extra.motivo,
      janela: lido.janela,
      periodo: lido.periodo,
      total: lido.total,
      naturezas: lido.naturezas,
      url,
      _coletadoEm: pagina.coletadoEm,
      _atualizadoEm: lido.atualizadoEm,
      _licenca: lido.licencaDeclaradaPeloSite,
    });
  }

  // 5. Conferências do conjunto.
  const todos = [...bairros, ...foraDaLista];
  const dosDozeMeses = todos.filter((b) => b.janela === "12-meses");
  const periodos = new Set(dosDozeMeses.map((b) => `${b.periodo.inicio}/${b.periodo.fim}`));
  if (periodos.size !== 1) throw new ErroDeColeta(`janelas de 12 meses diferentes entre as páginas: ${[...periodos].join(", ")}`);
  const semJanela = todos.filter((b) => b.janela !== "12-meses").map((b) => b.slug);
  const naoFecham = todos.filter((b) => b.naturezas.reduce((s, n) => s + n.ocorrencias, 0) !== b.total).map((b) => b.slug);
  const atualizadoEm = [...new Set(dosDozeMeses.map((b) => b._atualizadoEm))];
  const licencasDoSite = [...new Set(todos.map((b) => b._licenca))];
  const coletadoEm = todos.map((b) => b._coletadoEm).sort().at(-1);

  const periodo = dosDozeMeses[0].periodo;
  const paginasLidas = todos.length;
  const limpo = ({ _coletadoEm, _atualizadoEm, _licenca, ...resto }) => resto;
  const saidaBairros = bairros.map(limpo);
  const saidaForaDaLista = foraDaLista.map(limpo);

  gravarAtomico(
    path.join(DIR_SAIDA, "ocorrencias.json"),
    JSON.stringify({ geradoEm: coletadoEm, atribuicao: ATRIBUICAO, periodo, bairros: saidaBairros, foraDaListaOficial: saidaForaDaLista }, null, 2) + "\n",
  );

  const meta = {
    geradoEm: coletadoEm,
    fontes: [
      {
        chave: "crime_sds_pe",
        nome: "Ocorrências por bairro e natureza, janela de 12 meses (contagem bruta de registros)",
        fontePrimaria: "SDS-PE (Secretaria de Defesa Social de Pernambuco)",
        compiladoPor: "Crime Brasil",
        atribuicao: ATRIBUICAO,
        licenca: "não declarada pela SDS-PE",
        url: URL_FONTE,
        urlMunicipio: URL_CIDADE,
        urls: [...saidaBairros, ...saidaForaDaLista].map((b) => b.url),
        coletadoEm,
        modificadoEm: atualizadoEm.length === 1 ? atualizadoEm[0] : null,
        periodo,
        paginasLidas,
        // Só a janela de 12 meses: os bairros sem janela (período inteiro) não entram nesta soma.
        registrosLidos: dosDozeMeses.reduce((s, b) => s + b.total, 0),
        acessoAutomatizado: {
          robotsTxt: `${URL_ROBOTS}, lido em ${robots.coletadoEm}: User-agent * com Allow: / e sem Disallow para ${CAMINHO_BAIRRO}`,
          termos: `${URL_TERMOS}, lido em ${termos.coletadoEm}: não tratam de acesso automatizado; dizem que o conteúdo do site pode ser citado com link e crédito ao Crime Brasil e que os dados brutos seguem a licença de cada órgão`,
          requisicoes: `uma por vez, com pelo menos ${INTERVALO_MS / 1000} s de intervalo; HTML bruto em cache local`,
        },
        licencaDeclaradaPeloCompilador: licencasDoSite.length === 1 ? licencasDoSite[0] : null,
        limitacoes: [
          "Contagem bruta de registros de ocorrência por natureza: não é taxa por morador, ranking nem nota de bairro.",
          "Subnotificação: só entra o que foi registrado; o que não chegou à polícia não aparece.",
          "Só bairro: sem rua e sem coordenada.",
          "Registros sem bairro preenchido ficam fora de qualquer bairro (a página da fonte fala em cerca de 4%).",
          "O bairro é o nome informado no registro, que pode divergir do limite oficial.",
          "Janela móvel de 12 meses: cada atualização do site desloca o período e muda as contagens.",
          "Compilação de terceiro: a SDS-PE não publica esta base por bairro em formato aberto; o nome das naturezas é o da página do compilador.",
          ...(semJanela.length
            ? [`Sem janela de 12 meses (a página só mostra o período inteiro disponível, sem datas): ${semJanela.join(", ")}. Não comparar nem somar com os demais.`]
            : []),
          ...(foraDaLista.length
            ? [`Rótulos do site que não constam nos 94 bairros oficiais (bloco foraDaListaOficial): ${foraDaLista.map((b) => b.slug).join(", ")}. Podem se sobrepor a bairros oficiais; não verificado.`]
            : []),
        ],
        pendencias,
      },
      {
        chave: "bairros_malha",
        nome: "Limites dos bairros do Recife (usados só para achar quais bairros fazem divisa com os cinco alvos)",
        orgao: "Prefeitura da Cidade do Recife · Secretaria de Infraestrutura",
        licenca: "ODbL",
        url: URL_DATASET_MALHA,
        recursos: [RECURSO_MALHA],
        modificadoEm: malha.modificadoEm,
        consultadoEm: malha.consultadoEm,
        registrosLidos: 94,
        colunasUsadas: ["EBAIRRNOMEOF", "geometry"],
        criterioDeDivisa: `trecho comum de pelo menos ${DIVISA_MINIMA_M} m, com folga de ${TOLERANCIA_M} m entre os vértices das duas malhas`,
      },
    ],
  };
  gravarAtomico(path.join(DIR_SAIDA, "meta.json"), JSON.stringify(meta, null, 2) + "\n");

  console.log(`\nGravado: ${path.relative(RAIZ, path.join(DIR_SAIDA, "ocorrencias.json"))} e meta.json`);
  console.log(`Requisições ao Crime Brasil nesta execução: ${requisicoesFeitas} (as demais vieram do cache)`);
  console.log(`Período: ${periodo.inicio} a ${periodo.fim}; atualizado em (JSON-LD): ${atualizadoEm.join(", ")}; licença declarada pelo site: ${licencasDoSite.join(", ")}`);
  if (abaixoDoMinimo.length) console.log(`Contatos de divisa abaixo de ${DIVISA_MINIMA_M} m (fora do escopo): ${abaixoDoMinimo.map((x) => `${x.alvo}/${x.vizinho} ${x.metros} m`).join("; ")}`);
  if (pendencias.length) console.log(`Pendências: ${pendencias.map((p) => `${p.slug} (${p.motivo})`).join("; ")}`);
  if (semJanela.length) console.log(`Sem janela de 12 meses (período inteiro, não comparável): ${semJanela.join(", ")}`);
  if (naoFecham.length) console.log(`! Total diferente da soma das naturezas em: ${naoFecham.join(", ")}`);
}

// ——— Entrada ———————————————————————————————————————————————————————————————————

async function principal() {
  const i = process.argv.indexOf("--parsear");
  if (i >= 0) {
    const arquivo = process.argv[i + 1];
    if (!arquivo) throw new ErroDeColeta("uso: --parsear ARQUIVO.html");
    console.log(JSON.stringify(parsearPaginaDeBairro(fs.readFileSync(arquivo, "utf-8")), null, 2));
    return;
  }
  await coletar();
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  principal().catch((erro) => {
    console.error(`\nERRO: ${erro instanceof ErroDeColeta ? erro.message : (erro?.stack ?? erro)}`);
    process.exit(1);
  });
}
