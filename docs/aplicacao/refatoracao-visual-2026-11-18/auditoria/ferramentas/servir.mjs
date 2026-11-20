// Servidor estático mínimo para a auditoria visual (fase 0) e para os protótipos (fase 1).
//
//   node servir.mjs <pasta> <porta> [--spa]
//
// --spa: rota sem arquivo devolve index.html (o app exportado com `expo export --platform web` usa um roteador de página
// única). Sem dependência fora do Node. Não toca o app.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
};

export function servir(pasta, porta, { spa = false } = {}) {
  const raiz = path.resolve(pasta);
  const servidor = createServer(async (pedido, resposta) => {
    try {
      const caminho = decodeURIComponent(new URL(pedido.url, "http://x").pathname);
      let arquivo = path.join(raiz, caminho);
      if (!arquivo.startsWith(raiz)) throw new Error("fora da raiz");
      let info = await stat(arquivo).catch(() => null);
      if (info?.isDirectory()) {
        arquivo = path.join(arquivo, "index.html");
        info = await stat(arquivo).catch(() => null);
      }
      if (!info) {
        if (!spa || path.extname(caminho)) {
          resposta.writeHead(404).end("não encontrado");
          return;
        }
        arquivo = path.join(raiz, "index.html");
      }
      const corpo = await readFile(arquivo);
      resposta.writeHead(200, {
        "content-type": TIPOS[path.extname(arquivo).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      resposta.end(corpo);
    } catch (e) {
      resposta.writeHead(500).end(String(e));
    }
  });
  return new Promise((ok) => servidor.listen(porta, "127.0.0.1", () => ok(servidor)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
  const [pasta, porta = "8097", ...resto] = process.argv.slice(2);
  if (!pasta) {
    console.error("uso: node servir.mjs <pasta> <porta> [--spa]");
    process.exit(1);
  }
  await servir(pasta, Number(porta), { spa: resto.includes("--spa") });
  console.log(`servindo ${path.resolve(pasta)} em http://127.0.0.1:${porta}${resto.includes("--spa") ? " (spa)" : ""}`);
}
