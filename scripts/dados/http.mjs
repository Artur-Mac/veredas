import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const CACHE_DIR = process.env.VEREDA_HTTP_CACHE_DIR ?? fileURLToPath(new URL("../../raw/_cache/", import.meta.url));
const UA = "Vereda-Research/1.0";
const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRY_DELAY_MS = 30_000;

function cachePath(url) {
  const key = createHash("sha256").update(String(url)).digest("hex").slice(0, 16);
  return join(CACHE_DIR, key + ".txt");
}

export function getCached(url, maxAgeMs = Infinity) {
  const path = cachePath(url);
  try {
    if (Date.now() - statSync(path).mtimeMs <= maxAgeMs) return readFileSync(path, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return null;
}

function retryDelay(retryAfter, attempt) {
  if (retryAfter !== null) {
    if (/^\d+$/.test(retryAfter)) return Number(retryAfter) * 1000;
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  return Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** attempt + Math.random() * 250);
}

async function download(url, { retries, timeoutMs, headers }) {
  for (let attempt = 0; ; attempt++) {
    let wait;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers });
      if (res.ok) return { buffer: Buffer.from(await res.arrayBuffer()), status: res.status, headers: res.headers };

      await res.body?.cancel();
      const error = new Error(`HTTP ${res.status} em ${url}`);
      error.status = res.status;
      const retryAfter = res.headers.get("retry-after");
      wait = retryDelay(retryAfter, attempt);
      if (!RETRY_STATUS.has(res.status) || attempt >= retries || wait > MAX_RETRY_DELAY_MS) throw error;
    } catch (error) {
      const networkFailure = error.name === "TimeoutError" || (error instanceof TypeError && error.cause);
      if (!networkFailure || attempt >= retries) throw error;
      wait = retryDelay(null, attempt);
    }
    await delay(wait);
  }
}

function decodedBody(buffer) {
  // O fetch já descomprime Content-Encoding, mas arquivos .gz podem chegar compactados.
  return buffer[0] === 0x1f && buffer[1] === 0x8b ? gunzipSync(buffer) : buffer;
}

async function requestText(url, {
  retries = 2,
  timeoutMs = 45_000,
  headers = {},
  cache = true,
  maxAgeMs = Infinity,
} = {}, parse = (text) => text) {
  const requestHeaders = new Headers(headers);
  const useCache = cache && [...requestHeaders].length === 0;
  if (useCache) {
    const text = getCached(url, maxAgeMs);
    if (text !== null) {
      try {
        return { text, value: parse(text), fromCache: true };
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
      }
    }
  }

  if (!requestHeaders.has("User-Agent")) requestHeaders.set("User-Agent", UA);
  const result = await download(url, { retries, timeoutMs, headers: requestHeaders });
  const text = decodedBody(result.buffer).toString("utf8");
  const value = parse(text);
  const cacheControl = result.headers.get("cache-control") ?? "";
  if (useCache && !/\b(no-store|private)\b/i.test(cacheControl) && !result.headers.has("vary")) {
    saveOut(cachePath(url), text);
  }
  return { text, value, fromCache: false, status: result.status };
}

export async function get(url, opts) {
  const { text, fromCache, status } = await requestText(url, opts);
  return fromCache ? { text, fromCache } : { text, fromCache, status };
}

export async function getJSON(url, opts) {
  const { value } = await requestText(url, opts, JSON.parse);
  return value;
}

export async function getRaw(url, opts) {
  return get(url, opts);
}

export async function getGZ(url, { retries = 2, timeoutMs = 45_000, headers = {} } = {}) {
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("User-Agent")) requestHeaders.set("User-Agent", UA);
  const { buffer } = await download(url, { retries, timeoutMs, headers: requestHeaders });
  return decodedBody(buffer);
}

export function saveOut(path, content, { binary = false } = {}) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = join(dirname(path), `.vereda-${randomUUID()}.tmp`);
  try {
    writeFileSync(temp, content, binary ? undefined : "utf8");
    renameSync(temp, path);
  } finally {
    rmSync(temp, { force: true });
  }
  return path;
}
