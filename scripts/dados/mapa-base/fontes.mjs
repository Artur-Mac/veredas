// Fontes do mapa-base: as bases abertas da Prefeitura do Recife (dados.recife.pe.gov.br, CKAN). Baixa para
// .cache/dados-recife/mapa-base/ (fora do git), reaproveita o que já foi baixado e registra sha256 e tamanho de cada bruto.
// Com `atualizar` (a flag --atualizar do pipeline), relê os metadados no CKAN, compara last_modified e tamanho com os do
// cache, baixa de novo o que mudou e recalcula sempre o sha256. Sem ela, usa o cache como está; o sha é refeito quando o
// tamanho ou a data de modificação do arquivo mudam.
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const API = "https://dados.recife.pe.gov.br/api/3/action/";

/** Recursos usados. `chave` nomeia o arquivo no cache. */
export const RECURSOS = {
  bairros: { id: "5c67ce14-1799-40c4-a37c-9daa04d1761c", arquivo: "bairros-do-recife.geojson" },
  quadras: { id: "a961bf64-f6fe-4b1d-95c5-456bf0d01a31", arquivo: "quadras.geojson" },
  lotes: { id: "c41ee0d0-bb33-4380-8809-2e9082d79ab0", arquivo: "lotes.geojson" },
  ruas: { id: "6be90377-7b6d-483c-9b58-f7f34401ee6a", arquivo: "trechos-de-logradouros.geojson" },
  agua: { id: "dc655db0-6b58-4334-8d72-1ef666de4b86", arquivo: "recursos-hidricos.geojson" },
  pracas: { id: "054f05a9-a113-47e0-a46f-720e4828eaf2", arquivo: "parques-e-pracas.geojson" },
  pontes: { id: "53a04509-3524-4e4d-ac9e-79cf7d942c3d", arquivo: "pontes-do-recife.geojson" },
};

/** Dicionários de dados (JSON) do mesmo dataset, para conferir o significado das colunas. Não entram na saída. */
export const DICIONARIOS = {
  lotes: "a9db29eb-9a64-4319-8b98-008d20ce72c8",
  quadras: "e78cebc8-449c-40db-8429-9e693880ef35",
  agua: "a5edcbd6-dd67-41ea-b0f5-fd391c9b60ae",
  ruas: "208573c6-d55b-4a48-aef2-3cc7c963365e",
  bairros: "486d7bd5-3aba-49ba-b73b-a4c223a67ada",
};

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function comTentativas(rotulo, f, vezes = 5) {
  for (let i = 0; ; i++) {
    try {
      return await f();
    } catch (e) {
      if (i + 1 >= vezes) throw new Error(`${rotulo}: ${e.message}`);
      await espera(1500 * (i + 1));
    }
  }
}

async function chamarCkan(acao, id) {
  return comTentativas(`${acao} ${id}`, async () => {
    const res = await fetch(`${API}${acao}?id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(60_000) });
    const texto = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = JSON.parse(texto);
    if (!j.success) throw new Error("CKAN sem sucesso");
    return j.result;
  });
}

/** Lê resource_show e package_show no portal e grava no cache (o portal às vezes responde "no healthy upstream"). */
async function metadadosDoPortal(dir, id) {
  const r = await chamarCkan("resource_show", id);
  const p = await chamarCkan("package_show", r.package_id);
  const meta = { id, nome: r.name, url: r.url, lastModified: r.last_modified ?? null, tamanho: Number.isInteger(r.size) ? r.size : null, conjunto: p.title, licenca: p.license_id };
  writeFileSync(join(dir, `recurso-${id}.json`), JSON.stringify(meta, null, 1));
  return meta;
}

/** Metadados do recurso e do pacote: os do cache, se houver; senão os do portal. */
export async function metadados(dir, id) {
  const caminho = join(dir, `recurso-${id}.json`);
  if (existsSync(caminho)) return JSON.parse(readFileSync(caminho, "utf8"));
  return metadadosDoPortal(dir, id);
}

/**
 * O bruto precisa ser baixado de novo? Mudou a data de modificação publicada ou o tamanho publicado difere do arquivo
 * guardado. Tamanho null no portal não conta como mudança.
 */
export function mudouNoPortal(antes, agora, bytesNoCache) {
  if ((antes?.lastModified ?? null) !== (agora.lastModified ?? null)) return true;
  return agora.tamanho !== null && agora.tamanho !== undefined && bytesNoCache !== null && agora.tamanho !== bytesNoCache;
}

async function baixar(url, destino) {
  await comTentativas(`download ${destino}`, async () => {
    const res = await fetch(url.replace(/^http:/, "https:"), { redirect: "follow", signal: AbortSignal.timeout(20 * 60_000) });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const tmp = `${destino}.tmp`;
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
    renameSync(tmp, destino);
  });
}

export async function sha256DoArquivo(caminho) {
  const h = createHash("sha256");
  await pipeline(createReadStream(caminho), h);
  return h.digest("hex");
}

/**
 * Garante os brutos no cache; devolve { chave: { caminho, fonte } } com sha256 e bytes de cada um.
 * `atualizar`: false, true (todos os recursos) ou a lista de chaves a atualizar (ex.: ["bairros"]).
 */
export async function garantirFontes(dir, { atualizar = false } = {}) {
  mkdirSync(dir, { recursive: true });
  const saida = {};
  const relato = [];
  const atualizarChave = (c) => atualizar === true || (Array.isArray(atualizar) && atualizar.includes(c));
  for (const [chave, r] of Object.entries(RECURSOS)) {
    const caminho = join(dir, r.arquivo);
    const naCache = existsSync(caminho);
    let meta;
    let baixarDeNovo = !naCache;
    if (atualizarChave(chave)) {
      const cacheMeta = join(dir, `recurso-${r.id}.json`);
      const antes = existsSync(cacheMeta) ? JSON.parse(readFileSync(cacheMeta, "utf8")) : null;
      meta = await metadadosDoPortal(dir, r.id);
      if (naCache && mudouNoPortal(antes, meta, statSync(caminho).size)) baixarDeNovo = true;
      relato.push({ chave, antes: antes?.lastModified ?? null, agora: meta.lastModified, tamanhoNoPortal: meta.tamanho, baixouDeNovo: baixarDeNovo });
    } else meta = await metadados(dir, r.id);
    if (baixarDeNovo) {
      console.error(`baixando ${r.arquivo}…`);
      await baixar(meta.url, caminho);
    }
    // sha do bruto guardado ao lado (o de 137 MB leva segundos). Recalculado com --atualizar, ou se o tamanho ou a data
    // de modificação do arquivo mudarem.
    const st = statSync(caminho);
    const bytes = st.size;
    const mtime = Math.round(st.mtimeMs);
    const marca = `${caminho}.sha256.json`;
    let sha = existsSync(marca) ? JSON.parse(readFileSync(marca, "utf8")) : null;
    if (!sha || sha.bytes !== bytes || (sha.mtime !== undefined && sha.mtime !== mtime) || atualizarChave(chave)) {
      sha = { bytes, mtime, sha256: await sha256DoArquivo(caminho) };
      writeFileSync(marca, JSON.stringify(sha));
    } else if (sha.mtime === undefined) {
      writeFileSync(marca, JSON.stringify({ ...sha, mtime }));
    }
    saida[chave] = {
      caminho,
      fonte: { recurso: r.id, nome: meta.nome, conjunto: meta.conjunto, licenca: meta.licenca, lastModified: meta.lastModified, sha256: sha.sha256, bytes },
    };
  }
  for (const [chave, id] of Object.entries(DICIONARIOS)) {
    const caminho = join(dir, `dicionario-${chave}.json`);
    if (existsSync(caminho)) continue;
    const meta = await metadados(dir, id);
    await baixar(meta.url, caminho);
  }
  if (atualizar) console.error(JSON.stringify({ atualizar: relato }));
  return saida;
}
