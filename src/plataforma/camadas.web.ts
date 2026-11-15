// Web: arquivos de camada servidos em /dados (public/dados, ver scripts/dados/publicar-camadas.mjs), com o sha256 no
// nome. Primeiro o Cache Storage (o que já foi aberto neste navegador reabre sem rede); senão a rede, e o arquivo só
// entra no cache depois de conferir tamanho e sha256 com o manifesto. Nada daqui sai da origem do app.
import type { ArquivoPublicado } from "../dados/camadasGeradas";

export const CACHE_DAS_CAMADAS = "vereda-dados-v1";

function erro(caminho: string, motivo: string): Error {
  const e = new Error(`Camada de dados indisponível: ${caminho} (${motivo}).`);
  e.name = "CamadaIndisponivel";
  return e;
}

async function abrirCache(): Promise<Cache | null> {
  try {
    return typeof caches === "undefined" ? null : await caches.open(CACHE_DAS_CAMADAS);
  } catch {
    return null;
  }
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** null = confere; senão o motivo. Sem `crypto.subtle` (página fora de contexto seguro) só o tamanho é conferido. */
async function conferir(bytes: ArrayBuffer, d: ArquivoPublicado): Promise<string | null> {
  if (bytes.byteLength !== d.bytes) return `tamanho ${bytes.byteLength} em vez de ${d.bytes}`;
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const sha = hex(await subtle.digest("SHA-256", bytes));
  return sha === d.sha256 ? null : "sha256 não confere";
}

export async function buscarArquivoDeCamada(caminho: string, d: ArquivoPublicado): Promise<unknown> {
  const url = `/${d.url}`;
  const cache = await abrirCache();
  let bytes: ArrayBuffer | null = null;
  if (cache) {
    try {
      const guardada = await cache.match(url);
      if (guardada) {
        const b = await guardada.arrayBuffer();
        if ((await conferir(b, d)) === null) bytes = b;
        else await cache.delete(url);
      }
    } catch {
      bytes = null;
    }
  }
  if (!bytes) {
    let resposta: Response;
    try {
      resposta = await fetch(url, { credentials: "same-origin" });
    } catch {
      throw erro(caminho, "sem conexão e ainda não guardado neste aparelho");
    }
    if (!resposta.ok) throw erro(caminho, `HTTP ${resposta.status}`);
    const b = await resposta.arrayBuffer();
    const problema = await conferir(b, d);
    if (problema) throw erro(caminho, problema);
    bytes = b;
    if (cache) {
      try {
        await cache.put(url, new Response(b, { headers: { "content-type": "application/json" } }));
      } catch {
        // Cota cheia ou modo privado: o arquivo serve agora, só não fica para depois.
      }
    }
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw erro(caminho, "JSON inválido");
  }
}

/** Guarda no Cache Storage sem ler para a memória (para reabrir sem rede depois). */
export async function aquecerArquivoDeCamada(caminho: string, d: ArquivoPublicado): Promise<void> {
  const cache = await abrirCache();
  const url = `/${d.url}`;
  if (!cache || (await cache.match(url))) return;
  const resposta = await fetch(url, { credentials: "same-origin" });
  if (!resposta.ok) throw erro(caminho, `HTTP ${resposta.status}`);
  const b = await resposta.arrayBuffer();
  if ((await conferir(b, d)) !== null) return;
  await cache.put(url, new Response(b, { headers: { "content-type": "application/json" } }));
}

/** Tira do cache os arquivos de versões que o app já não usa (o nome traz o sha256, então nada muda no lugar). */
export async function limparCamadasAntigas(urlsAtuais: readonly string[]): Promise<void> {
  const cache = await abrirCache();
  if (!cache) return;
  const atuais = new Set(urlsAtuais.map((u) => new URL(`/${u}`, location.origin).href));
  for (const pedido of await cache.keys()) if (!atuais.has(pedido.url)) await cache.delete(pedido);
}
