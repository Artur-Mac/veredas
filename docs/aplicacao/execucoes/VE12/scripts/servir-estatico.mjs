// Servidor estático local para medir o build de produção (expo export, saída "single"): arquivo existente ou, para
// qualquer rota do app, o index.html. Comprime com gzip o que um host comum comprime (js, json, html, css, svg) e marca
// /_expo/static e /dados (nomes com hash) como imutáveis. Só para medição local; não é o servidor de produção.
//   node docs/aplicacao/execucoes/VE12/scripts/servir-estatico.mjs <pasta> [porta]
//   SEM_GZIP=1 … serve sem compressão (o custo de comprimir 30 MB na hora não entra na medida).
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { createGzip } from "node:zlib";

const raiz = path.resolve(process.argv[2] ?? "dist");
const porta = Number(process.argv[3] ?? 8099);
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".ttf": "font/ttf", ".wasm": "application/wasm", ".gz": "application/gzip", ".ico": "image/x-icon" };
const COMPRIME = new Set([".html", ".js", ".json", ".css", ".svg"]);
createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  let arquivo = path.join(raiz, decodeURIComponent(url.pathname));
  if (!arquivo.startsWith(raiz)) { res.writeHead(403).end(); return; }
  if (!existsSync(arquivo) || statSync(arquivo).isDirectory()) {
    // /dados e /_expo nunca caem no index.html: um arquivo que falta é 404, como num host real.
    if (url.pathname.startsWith("/dados/") || url.pathname.startsWith("/_expo/") || url.pathname.startsWith("/assets/")) { res.writeHead(404).end(); return; }
    arquivo = path.join(raiz, "index.html");
  }
  const ext = path.extname(arquivo);
  const cabecalhos = { "content-type": TIPOS[ext] ?? "application/octet-stream",
    "cache-control": /^\/(_expo\/static|dados)\//.test(url.pathname) ? "public, max-age=31536000, immutable" : "no-cache" };
  if (!process.env.SEM_GZIP && COMPRIME.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "")) {
    res.writeHead(200, { ...cabecalhos, "content-encoding": "gzip", vary: "accept-encoding" });
    createReadStream(arquivo).pipe(createGzip({ level: 6 })).pipe(res);
  } else {
    res.writeHead(200, { ...cabecalhos, "content-length": statSync(arquivo).size });
    createReadStream(arquivo).pipe(res);
  }
}).listen(porta, "127.0.0.1", () => console.log(`servindo ${raiz} em http://127.0.0.1:${porta}`));
