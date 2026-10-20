// Servidor estático da raiz do repositório, só em 127.0.0.1.
// Os módulos ES do POC não carregam em file://, por isso o preview e o render passam por aqui.
// Uso: node motion/serve.mjs [porta]   →   http://127.0.0.1:4178/motion/poc/poc-01.html
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.wav': 'audio/wav' };

export function startServer(porta = 4178) {
  const servidor = http.createServer((req, res) => {
    const rota = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const arquivo = path.resolve(RAIZ, '.' + rota);
    if (!arquivo.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; }
    try {
      const stat = statSync(arquivo);
      if (!stat.isFile()) throw new Error();
      const comum = { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
      const faixa = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
      if (faixa) {
        const inicio = faixa[1] ? Number(faixa[1]) : Math.max(0, stat.size - Number(faixa[2]));
        const fim = faixa[1] ? Math.min(stat.size - 1, faixa[2] ? Number(faixa[2]) : stat.size - 1) : stat.size - 1;
        if (!Number.isSafeInteger(inicio) || !Number.isSafeInteger(fim) || inicio > fim || inicio >= stat.size) {
          res.writeHead(416, { ...comum, 'Content-Range': `bytes */${stat.size}` }); res.end(); return;
        }
        res.writeHead(206, { ...comum, 'Content-Range': `bytes ${inicio}-${fim}/${stat.size}`, 'Content-Length': fim - inicio + 1 });
        createReadStream(arquivo, { start: inicio, end: fim }).pipe(res);
      } else {
        res.writeHead(200, { ...comum, 'Content-Length': stat.size });
        createReadStream(arquivo).pipe(res);
      }
    } catch {
      res.writeHead(404); res.end('não encontrado');
    }
  });
  return new Promise((resolve) => servidor.listen(porta, '127.0.0.1', () => resolve(servidor)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const porta = Number(process.argv[2] || 4178);
  await startServer(porta);
  console.log(`Preview: http://127.0.0.1:${porta}/motion/poc/poc-01.html`);
  console.log(`Modo ao vivo (ENTER → HOLD → EXIT): http://127.0.0.1:${porta}/motion/poc/poc-01.html?live`);
}
