// Render determinístico do POC: cada quadro é window.seek(t), capturado pelo Chromium headless.
//
//   node motion/render.mjs qa --passo pass-1      quadros-chave, tiras, folha de contato e preview de 360 px
//   node motion/render.mjs video --fps 30         out/poc-01.mp4 (preview)
//   node motion/render.mjs video --fps 60 --sub 4 out/poc-01-60fps.mp4 (motion blur por subquadros)
//   node motion/render.mjs determinismo           compara o mesmo t renderizado em ordens diferentes
//   --poc cena01 --v 2                            outra página em motion/poc/ e uma variante dela (?v=2)
//   node motion/render.mjs comparar --poc cena01 --variantes 1,2,3   as variantes lado a lado nos mesmos tempos
import { chromium } from '../node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';
import { rng } from './lib/motion.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modo = process.argv[2] || 'qa';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const POC = arg('poc', 'poc-01');
const FPS = Number(arg('fps', 30));
const SUB = Number(arg('sub', 1));
// Obturador: fração do intervalo entre quadros coberta pelos subquadros (0,5 = 180°).
// Com 1, objetos rápidos viram cópias separadas em vez de borrão.
const SHUTTER = Number(arg('obturador', 0.5));
const PASSO = arg('passo', 'pass-1');
const PORTA = Number(arg('porta', 4178));
const VAR = arg('v', null);
const NOME = VAR ? `${POC}-v${VAR}` : POC;
const url = (v) => `http://127.0.0.1:${PORTA}/motion/poc/${POC}.html${v ? `?v=${v}` : ''}`;

const servidor = await startServer(PORTA);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[página]', m.text()); });
await page.goto(url(VAR));
await page.evaluate(() => window.__pronto);
const info = await page.evaluate(() => window.POC);
const alvo = page.locator('#c');
const quadro = async (t, opts = {}) => { await page.evaluate((x) => window.seek(x), t); return alvo.screenshot({ type: 'png', ...opts }); };
const nomeT = (t) => t.toFixed(3).replace('.', '_');

async function montarFolha(itens, colunas, largura, saida, titulo) {
  const p = await browser.newPage({ viewport: { width: colunas * (largura + 16) + 16, height: 400 }, deviceScaleFactor: 1 });
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:16px;background:#1b1c1d;font:500 13px/1.3 'Plus Jakarta Sans',sans-serif;color:#e7e2d8}
    h1{font-size:15px;margin:0 0 12px;font-weight:600}
    .g{display:grid;grid-template-columns:repeat(${colunas},${largura}px);gap:16px}
    figure{margin:0} img{width:${largura}px;display:block;border-radius:4px}
    figcaption{margin-top:6px;color:#bdb6a8}</style>
    <h1>${titulo}</h1><div class="g">${itens.map((i) => `<figure><img src="${i.src}"><figcaption>${i.legenda}</figcaption></figure>`).join('')}</div>`;
  await p.goto(`http://127.0.0.1:${PORTA}/motion/`).catch(() => {});
  await p.setContent(html.replace(/src="\//g, `src="http://127.0.0.1:${PORTA}/`), { waitUntil: 'networkidle' });
  await p.screenshot({ path: saida, fullPage: true });
  await p.close();
}

if (modo === 'qa') {
  const dir = path.join(RAIZ, 'motion-references/contact-sheets', POC, VAR ? `v${VAR}` : '', PASSO);
  const rel = '/' + path.relative(RAIZ, dir);
  mkdirSync(dir, { recursive: true });
  const itens = [];
  for (const e of info.estados) {
    const arq = `${e.id}_t${nomeT(e.t)}.png`;
    writeFileSync(path.join(dir, arq), await quadro(e.t));
    itens.push({ src: `${rel}/${arq}`, legenda: `${e.id} · ${e.nome} · t = ${e.t.toFixed(2)} s` });
  }
  await montarFolha(itens, 4, 440, path.join(dir, 'contact_sheet.png'), `${info.id} · ${PASSO} · estados e meios de morph`);

  // grade regular a cada 0,5 s (pega cortes secos e tempo morto)
  const grade = [];
  for (let t = 0; t <= info.duracao + 1e-6; t += 0.5) {
    const arq = `grade_t${nomeT(t)}.png`;
    writeFileSync(path.join(dir, arq), await quadro(Math.min(t, info.duracao)));
    grade.push({ src: `${rel}/${arq}`, legenda: `${t.toFixed(1)} s` });
  }
  await montarFolha(grade, 7, 260, path.join(dir, 'grade_0_5s.png'), `${info.id} · ${PASSO} · um quadro a cada 0,5 s`);

  // tiras de quadros consecutivos em torno de cada clique e de cada morph
  const momentos = info.tiras || [
    ...info.cliques.map((c, i) => ({ nome: `clique${i + 1}`, t0: c - 0.1 })),
    { nome: 'morph1', t0: info.marcos.m1 - 0.05 },
    { nome: 'morph2', t0: info.marcos.m2 - 0.05 },
    { nome: 'morph3', t0: info.marcos.m3 + 0.2 },
    { nome: 'morph4', t0: info.marcos.m4 - 0.05 },
  ];
  for (const m of momentos) {
    const fr = [];
    for (let i = 0; i < 12; i += 1) {
      const t = m.t0 + i / FPS;
      const arq = `tira_${m.nome}_${String(i).padStart(2, '0')}.png`;
      writeFileSync(path.join(dir, arq), await quadro(t));
      fr.push({ src: `${rel}/${arq}`, legenda: `${t.toFixed(3)} s` });
    }
    await montarFolha(fr, 6, 300, path.join(dir, `tira_${m.nome}.png`), `${info.id} · ${m.nome} · 12 quadros a ${FPS} fps`);
  }

  // legibilidade: os mesmos estados reduzidos a 360 px de largura
  const peq = info.estados.map((e) => ({ src: `${rel}/${e.id}_t${nomeT(e.t)}.png`, legenda: e.id }));
  await montarFolha(peq, 5, 360, path.join(dir, 'preview_360px.png'), `${info.id} · ${PASSO} · teste de leitura a 360 px`);
  console.log(`QA em ${path.relative(RAIZ, dir)}`);
}

if (modo === 'video') {
  mkdirSync(path.join(RAIZ, 'out'), { recursive: true });
  const saida = path.join(RAIZ, 'out', `${NOME}${FPS === 30 && SUB === 1 ? '' : `-${FPS}fps`}.mp4`);
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-i', '-',
    ...(SUB > 1 ? ['-vf', `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/${FPS}/TB`] : []),
    '-r', String(FPS), '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', saida,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(info.duracao * FPS * SUB);
  for (let i = 0; i < total; i += 1) {
    const f = Math.floor(i / SUB), k = i % SUB;
    const png = await quadro((f + (SUB > 1 ? (SHUTTER * k) / SUB : 0)) / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (FPS * SUB) === 0) process.stdout.write(`\r${(i / (FPS * SUB)).toFixed(0)} s de ${info.duracao} s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\nVídeo: ${path.relative(RAIZ, saida)}`);
  const audio = path.join(RAIZ, 'out', `${NOME}-sfx.wav`);
  if (existsSync(audio)) console.log(`Para juntar o som: ffmpeg -i ${path.relative(RAIZ, saida)} -i ${path.relative(RAIZ, audio)} -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v copy -c:a aac -shortest ${path.relative(RAIZ, saida).replace('.mp4', '-com-som.mp4')}`);
}

if (modo === 'audio') {
  // Sem trilha licenciada: mapa de ritmo provisório. Os sons ficam presos aos eventos da
  // linha do tempo; a grade de BPM só sugere em que andamento procurar uma trilha.
  const { sintetizar, wav } = await import('./audio/sfx.mjs');
  const principais = info.sons.filter((s) => s.tipo === 'click' || s.tipo === 'whoosh').map((s) => s.t);
  let melhor = null;
  for (let bpm = 80; bpm <= 132; bpm += 1) {
    const beat = 60 / bpm;
    for (let fase = 0; fase < beat; fase += 0.01) {
      const erro = principais.reduce((acc, t) => { const r = ((t - fase) % beat + beat) % beat; return acc + Math.min(r, beat - r); }, 0) / principais.length;
      if (!melhor || erro < melhor.erroMedio) melhor = { bpm, fase: +fase.toFixed(2), erroMedio: +erro.toFixed(3) };
    }
  }
  const beat = 60 / melhor.bpm;
  const ritmo = {
    poc: info.id, duracao: info.duracao, geradoEm: new Date().toLocaleDateString('sv'),
    trilha: null,
    observacao: 'Nenhuma trilha licenciada foi fornecida. Sons sintetizados por motion/audio/sfx.mjs, presos aos eventos. A grade abaixo é uma sugestão de andamento; quando houver trilha, gere beats.json (motion/audio/beats.py) e realinhe só as transições curtas. Os HOLD do modo ao vivo não seguem grade: duram o quanto o apresentador falar.',
    gradeSugerida: { ...melhor, batidas: Array.from({ length: Math.floor((info.duracao - melhor.fase) / beat) + 1 }, (_, i) => +(melhor.fase + i * beat).toFixed(3)) },
    holds: info.holds,
    sons: info.sons.map((s) => {
      const k = Math.round((s.t - melhor.fase) / beat);
      return { ...s, t: +s.t.toFixed(3), batidaMaisProxima: +(melhor.fase + k * beat).toFixed(3), desvio: +(s.t - (melhor.fase + k * beat)).toFixed(3) };
    }),
  };
  const arqRitmo = path.join(RAIZ, 'motion/audio', `ritmo-${NOME}.json`);
  writeFileSync(arqRitmo, JSON.stringify(ritmo, null, 2) + '\n');
  mkdirSync(path.join(RAIZ, 'out'), { recursive: true });
  const arqWav = path.join(RAIZ, 'out', `${NOME}-sfx.wav`);
  writeFileSync(arqWav, wav(sintetizar(info.sons, info.duracao)));
  console.log(`Mapa de ritmo: ${path.relative(RAIZ, arqRitmo)} (grade sugerida ${melhor.bpm} BPM, desvio médio ${melhor.erroMedio} s)`);
  console.log(`Sons: ${path.relative(RAIZ, arqWav)}`);
  const video = path.join(RAIZ, 'out', `${NOME}.mp4`);
  if (existsSync(video)) {
    const saida = path.join(RAIZ, 'out', `${NOME}-com-som.mp4`);
    await new Promise((r) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', arqWav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', saida], { stdio: 'inherit' }).on('close', r));
    console.log(`Com som (-14 LUFS): ${path.relative(RAIZ, saida)}`);
  }
}

if (modo === 'determinismo') {
  // Compara o mesmo t renderizado depois de quadros diferentes. Iguais byte a byte é o ideal.
  // O Chromium às vezes rasteriza de novo só a parte que mudou, e o antisserrilhado de uns
  // poucos pixels muda alguns níveis; isso é aceito como ruído (no máximo 0,02% dos pixels com
  // diferença até 24 de 255). Qualquer coisa acima disso é dependência real do histórico.
  const md5 = (b) => createHash('md5').update(b).digest('hex');
  const ts = [...new Set(info.estados ? [0, ...info.estados.map((e) => e.t)] : [0, 1.95, 5.12, 8.05, 10.8, info.duracao - 1 / 30])];
  const ida = {};
  for (const t of ts) ida[t] = await quadro(t);
  const volta = {};
  const sorteio = rng(2027);
  for (const t of [...ts].reverse()) { await quadro(sorteio() * info.duracao); volta[t] = await quadro(t); }
  const cmp = await browser.newPage();
  let ok = true;
  for (const t of ts) {
    let r;
    if (md5(ida[t]) === md5(volta[t])) r = { estado: 'igual' };
    else {
      const d = await cmp.evaluate(async ([a, b]) => {
        const img = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = new OffscreenCanvas(i.width, i.height); const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
        const [p, q] = [await img(a), await img(b)];
        let n = 0, max = 0;
        for (let k = 0; k < p.length; k += 4) { const m = Math.max(Math.abs(p[k] - q[k]), Math.abs(p[k + 1] - q[k + 1]), Math.abs(p[k + 2] - q[k + 2])); if (m > 0) n += 1; if (m > max) max = m; }
        return { n, max, total: p.length / 4 };
      }, [ida[t].toString('base64'), volta[t].toString('base64')]);
      const ruido = d.n / d.total <= 2e-4 && d.max <= 24;
      r = { estado: ruido ? 'ruído' : 'DIFERENTE', detalhe: `${d.n} px, diferença máx. ${d.max}` };
      if (!ruido) ok = false;
    }
    console.log(`t = ${t.toFixed(3)} s  ${r.estado}${r.detalhe ? `  (${r.detalhe})` : ''}`);
  }
  await cmp.close();
  console.log(ok ? 'Determinismo confirmado: o quadro só depende de t.' : 'Falhou: algum quadro depende do histórico.');
  process.exitCode = ok ? 0 : 1;
}

if (modo === 'comparar') {
  // As variantes de uma cena lado a lado, nos tempos de info.comparar (ou dos estados).
  const variantes = String(arg('variantes', '1,2,3')).split(',');
  const dir = path.join(RAIZ, 'motion-references/contact-sheets', POC, 'comparativo', PASSO);
  const rel = '/' + path.relative(RAIZ, dir);
  mkdirSync(dir, { recursive: true });
  const itens = [];
  let tempos = null;
  for (const v of variantes) {
    await page.goto(url(v));
    await page.evaluate(() => window.__pronto);
    const iv = await page.evaluate(() => window.POC);
    tempos ||= iv.comparar || iv.estados.map((e) => ({ t: e.t, nome: e.id }));
    for (const m of tempos) {
      const arq = `v${v}_t${nomeT(m.t)}.png`;
      writeFileSync(path.join(dir, arq), await quadro(m.t));
      itens.push({ src: `${rel}/${arq}`, legenda: `V${v} · ${iv.variante || ''} · ${m.nome} · ${m.t.toFixed(2)} s` });
    }
  }
  await montarFolha(itens, tempos.length, 300, path.join(dir, 'comparativo.png'), `${POC} · ${PASSO} · variantes lado a lado`);
  console.log(`Comparativo em ${path.relative(RAIZ, dir)}`);
}

await browser.close();
servidor.close();
