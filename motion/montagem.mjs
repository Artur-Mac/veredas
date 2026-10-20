// Montagem final com a voz: cada quadro do filme é o seek(t) de uma cena, com t tirado de âncoras
// [tempo na gravação, tempo local da cena] e interpolado linearmente entre elas. Nenhum quadro é
// duplicado nem pulado por ffmpeg; as cenas não mudam.
//
//   node motion/montagem.mjs parte 3 --porta 4270      renderiza só a cena de índice 3 em out/montagem/
//   node motion/montagem.mjs juntar                    concatena as partes e põe a voz (sem efeitos)
//   --linha motion/montagem/linha-final.json            a linha do tempo (padrão)
import { chromium } from '../node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modo = process.argv[2];
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const LINHA = path.resolve(RAIZ, arg('linha', 'motion/montagem/linha-final.json'));
const L = JSON.parse(readFileSync(LINHA, 'utf8'));
const FPS = L.fps;
const TOTAL = Math.round(L.duracao * FPS);
const DIR = path.join(RAIZ, 'out', 'montagem');
mkdirSync(DIR, { recursive: true });

// quadros [k0, k1) de cada cena: começa no primeiro T da cena e vai até o primeiro T da seguinte
function faixa(i) {
  const k0 = Math.round(L.cenas[i].ancoras[0][0] * FPS);
  const k1 = i + 1 < L.cenas.length ? Math.round(L.cenas[i + 1].ancoras[0][0] * FPS) : TOTAL;
  return [k0, k1];
}
function local(anc, T) {
  if (T <= anc[0][0]) return anc[0][1];
  for (let j = 1; j < anc.length; j += 1) {
    const [Ta, ta] = anc[j - 1], [Tb, tb] = anc[j];
    if (T <= Tb) return ta + ((tb - ta) * (T - Ta)) / (Tb - Ta);
  }
  return anc[anc.length - 1][1];
}

if (modo === 'parte') {
  const i = Number(process.argv[3]);
  const c = L.cenas[i];
  const PORTA = Number(arg('porta', 4270 + i));
  await startServer(PORTA);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('[erro]', c.poc, e.message));
  await page.goto(`http://127.0.0.1:${PORTA}/motion/poc/${c.poc}.html${c.v ? `?v=${c.v}` : ''}`);
  await page.evaluate(() => window.__pronto);
  const dur = await page.evaluate(() => window.POC.duracao);
  const alvo = page.locator('#c');
  const [k0, k1] = faixa(i);
  const saida = path.join(DIR, `parte-${String(i).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-r', String(FPS), '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', saida], { stdio: ['pipe', 'inherit', 'inherit'] });
  const mapa = [];
  for (let k = k0; k < k1; k += 1) {
    const T = k / FPS;
    const t = Math.min(dur, Math.max(0, local(c.ancoras, T)));
    mapa.push([Number(T.toFixed(4)), Number(t.toFixed(4))]);
    await page.evaluate((x) => window.seek(x), t);
    const png = await alvo.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  writeFileSync(saida.replace('.mp4', '.json'), JSON.stringify({ poc: c.poc, k0, k1, mapa }));
  console.log(`${c.poc}: quadros ${k0} a ${k1 - 1} (${((k1 - k0) / FPS).toFixed(2)} s) → ${path.relative(RAIZ, saida)}`);
  await browser.close();
  process.exit(0);
}

if (modo === 'juntar') {
  const partes = L.cenas.map((_, i) => path.join(DIR, `parte-${String(i).padStart(2, '0')}.mp4`));
  for (const p of partes) if (!existsSync(p)) { console.log('falta', p); process.exit(1); }
  const lista = path.join(DIR, 'lista.txt');
  writeFileSync(lista, partes.map((p) => `file '${p}'`).join('\n'));
  const video = path.join(DIR, 'video.mp4');
  const run = (a) => new Promise((r, j) => spawn('ffmpeg', a, { stdio: 'inherit' }).on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
  await run(['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', video]);
  const saida = path.join(RAIZ, 'out', L.saida);
  // a voz entra sem nenhum filtro: o fluxo de áudio original é copiado
  await run(['-y', '-loglevel', 'error', '-i', video, '-i', L.audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-movflags', '+faststart', saida]);
  console.log(`Filme: ${path.relative(RAIZ, saida)} (${TOTAL} quadros a ${FPS} fps)`);
}
