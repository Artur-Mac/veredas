import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? (process.argv[i + 1]?.startsWith('--') ? true : process.argv[i + 1]) : d;
};

const FPS = Number(arg('fps', 30));
const DUR = Number(arg('dur', 12.0));
const SUB = Number(arg('sub', 1));
const SKIP_VIDEO = process.argv.includes('--skip-video');
const OUT_DIR = path.resolve(process.cwd(), 'out');
const SNAP_DIR = path.resolve(process.cwd(), 'motion-references/contact-sheets');

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(SNAP_DIR, { recursive: true });

console.log(`[VEREDA Motion Engine - Pass 2] Inicializando...`);
console.log(`- Resolução: 1920x1080 | Duração: ${DUR}s | FPS: ${FPS} | Subframes: ${SUB}`);

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1
});

const htmlPath = 'file://' + path.resolve(process.cwd(), 'motion/poc-one-shape.html');
await page.goto(htmlPath);
await page.evaluate(() => document.fonts.ready);

// =========================================================================
// 1. CAPTURA DE SNAPSHOTS CRÍTICOS (PASS 2)
// =========================================================================
const SNAP_TIMESTAMPS = [
  { t: 0.5, name: 'snap_01_card_inicial' },
  { t: 1.8, name: 'snap_02_cursor_click_discrepancia' },
  { t: 2.5, name: 'snap_03_morph_midpoint_card_to_record' },
  { t: 3.5, name: 'snap_04_record_iptu_dsqfl' },
  { t: 4.3, name: 'snap_05_cursor_click_dsqfl' },
  { t: 5.4, name: 'snap_06_morph_midpoint_record_to_lot' },
  { t: 6.5, name: 'snap_07_lot_iso_projection' },
  { t: 8.0, name: 'snap_08_morph_midpoint_lot_to_map' },
  { t: 9.2, name: 'snap_09_map_boa_viagem_radius150m' },
  { t: 10.3, name: 'snap_10_morph_midpoint_map_to_dossier' },
  { t: 11.5, name: 'snap_11_final_dossier_complete' }
];

console.log(`[Pass 2] Capturando ${SNAP_TIMESTAMPS.length} snapshots periciais...`);
for (const s of SNAP_TIMESTAMPS) {
  await page.evaluate((time) => window.seek(time), s.t);
  const outPath = path.join(SNAP_DIR, `${s.name}.png`);
  await page.locator('#c').screenshot({ path: outPath });
}

// =========================================================================
// 2. FAIXA DE QUADROS CONSECUTIVOS DA AÇÃO RÁPIDA (CLIQUE DISCREPÂNCIA: 1.6s - 2.1s)
// =========================================================================
console.log(`[Pass 2] Capturando tira de ação rápida (1.60s a 2.10s)...`);
const stripFrames = [1.60, 1.70, 1.80, 1.90, 2.00, 2.10];
for (let i = 0; i < stripFrames.length; i++) {
  const t = stripFrames[i];
  await page.evaluate((time) => window.seek(time), t);
  const stripPath = path.join(SNAP_DIR, `action_strip_${i}_t${t.toFixed(2)}.png`);
  await page.locator('#c').screenshot({ path: stripPath });
}

// =========================================================================
// 3. RENDERIZAÇÃO DO VÍDEO COMPLETO MP4
// =========================================================================
if (!SKIP_VIDEO) {
  const videoOut = path.join(OUT_DIR, 'poc-one-shape.mp4');
  console.log(`[Pass 2] Renderizando vídeo completo: ${videoOut}...`);

  const ffArgs = [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(FPS * SUB),
    '-i', '-',
    ...(SUB > 1 ? ['-vf', `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/${FPS}/TB`] : []),
    '-r', String(FPS),
    '-c:v', 'libx264',
    '-crf', '16',
    '-pix_fmt', 'yuv420p',
    videoOut
  ];

  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  const totalFrames = Math.round(DUR * FPS * SUB);
  for (let i = 0; i < totalFrames; i++) {
    const t = i / (FPS * SUB);
    await page.evaluate((time) => window.seek(time), t);
    const png = await page.locator('#c').screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) {
      await new Promise((resolve) => ff.stdin.once('drain', resolve));
    }
    if (i % (FPS * 2) === 0 || i === totalFrames - 1) {
      const sec = (i / (FPS * SUB)).toFixed(1);
      process.stdout.write(`\r[Render] ${sec}s / ${DUR}s (${Math.round((i / totalFrames) * 100)}%)`);
    }
  }
  process.stdout.write('\n');
  ff.stdin.end();
  await new Promise((resolve) => ff.on('close', resolve));
  console.log(`[Pass 2] Vídeo salvo em: ${videoOut}`);
}

await browser.close();
console.log(`[Pass 2] Concluído com sucesso.`);
