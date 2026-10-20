// Confere que a narração travada não mudou e que as citações do storyboard são literais.
// Uso: node motion/tools/verificar-pitch.mjs
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const travado = readFileSync(path.join(RAIZ, 'docs/pitch-original-locked.md'), 'utf8');
const m = travado.match(/<!-- PITCH:INICIO -->\n([\s\S]*?)\n<!-- PITCH:FIM -->/);
if (!m) { console.error('Marcadores do pitch não encontrados.'); process.exit(1); }
const pitch = m[1];
const hash = createHash('sha256').update(pitch).digest('hex');
console.log(`Pitch: ${pitch.split('\n').length} parágrafos, ${pitch.length} caracteres, sha256 ${hash}`);
let ok = true;
const esperado = readFileSync(path.join(RAIZ, 'motion/tools/pitch.sha256'), 'utf8').trim();
if (hash !== esperado) { console.error(`O texto travado mudou (esperado ${esperado}).`); ok = false; } else console.log('Texto travado intacto.');

// citações do storyboard: linhas "| Frase | “...” |" ou blocos "> " depois de "Trecho:"
const sb = readFileSync(path.join(RAIZ, 'docs/storyboard.md'), 'utf8');
const citacoes = [];
for (const linha of sb.split('\n')) {
  const f = linha.match(/^\| (?:Frase|Trecho)[^|]*\| ([“"].*[”"]) \|\s*$/);
  if (f) citacoes.push(f[1]);
  const b = linha.match(/^> «(.*)»\s*$/);
  if (b) citacoes.push(b[1]);
  const bt = linha.match(/^\| B\d+ \| “(.*?)” \|/);
  if (bt) citacoes.push(bt[1]);
}

// cobertura: em cada cena, as batidas reconstroem o trecho literal da cena (motion/tools/cenas-pitch.json)
const trechos = Object.fromEntries(JSON.parse(readFileSync(path.join(RAIZ, 'motion/tools/cenas-pitch.json'), 'utf8')).cenas.map((c) => [c.cena, c.trecho]));
for (const [, num, corpo] of sb.matchAll(/^## Cena (\d+) · [^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)) {
  const falas = [...corpo.matchAll(/^\| B\d+ \| “(.*?)” \|/gm)].map((x) => x[1]);
  if (!falas.length) continue;
  const alvo = trechos[Number(num)];
  let pos = 0, okc = true;
  for (const f of falas) { const i = alvo.indexOf(f, pos); if (i < 0 || alvo.slice(pos, i).trim()) { okc = false; break; } pos = i + f.length; }
  if (alvo.slice(pos).trim()) okc = false;
  if (!okc) { ok = false; console.error(`Cena ${num}: as batidas não reconstroem o trecho da cena.`); }
}
let ruins = 0;
for (const c of citacoes) {
  // aceita a citação inteira entre aspas tipográficas ou retas; "[…]" separa trechos
  const corpo = c.replace(/^[“"]/, '').replace(/[”"]$/, '');
  const partes = corpo.split(' […] ');
  const falta = partes.filter((p) => !pitch.includes(p));
  if (falta.length) { ruins += 1; ok = false; console.error(`NÃO É LITERAL: ${falta.map((p) => p.slice(0, 90)).join(' | ')}`); }
}
console.log(`${citacoes.length} citações no storyboard, ${citacoes.length - ruins} literais.`);
process.exitCode = ok ? 0 : 1;
