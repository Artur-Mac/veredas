// Divide o pitch travado em trechos por cena, sem mudar um caractere, e confere a cobertura:
// a concatenação dos trechos (com o separador original) tem que ser o pitch inteiro.
// Uso: node motion/tools/cenas-pitch.mjs   → escreve motion/tools/cenas-pitch.json
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pitch = readFileSync(path.join(RAIZ, 'docs/pitch-original-locked.md'), 'utf8').match(/<!-- PITCH:INICIO -->\n([\s\S]*?)\n<!-- PITCH:FIM -->/)[1];
const par = pitch.split('\n');
// cortes dentro do parágrafo 9: o fim da cena 08 é o fim da frase do WhatsAp
const corte9 = par[8].indexOf(' E, na visita presencial');
const CENAS = [
  { cena: 1, titulo: 'O apartamento perfeito', trecho: par[0] },
  { cena: 2, titulo: 'O portal não está do seu lado', trecho: par[1] },
  { cena: 3, titulo: 'Quem descobre tarde demais', trecho: par[2] },
  { cena: 4, titulo: 'Os dados existem, mas estão enterrados', trecho: par[3] },
  { cena: 5, titulo: 'A virada: em segundos', trecho: par[4] + '\n' + par[5] },
  { cena: 6, titulo: 'Da porta para dentro', trecho: par[6] },
  { cena: 7, titulo: 'Da porta para fora', trecho: par[7] },
  { cena: 8, titulo: 'Tirar a maquiagem e negociar', trecho: par[8].slice(0, corte9) },
  { cena: 9, titulo: 'O celular vira ferramenta', trecho: par[8].slice(corte9 + 1) },
  { cena: 10, titulo: 'Modelo e validação', trecho: par[9] },
  { cena: 11, titulo: 'Prova, equipe e piloto', trecho: par[10] },
  { cena: 12, titulo: 'A verdade antes da decisão', trecho: par[11] },
];
// reconstrução: parágrafos com \n; o corte do parágrafo 9 foi num espaço
const rec = [CENAS[0], CENAS[1], CENAS[2], CENAS[3], CENAS[4], CENAS[5], CENAS[6]].map((c) => c.trecho).join('\n')
  + '\n' + CENAS[7].trecho + ' ' + CENAS[8].trecho + '\n' + [CENAS[9], CENAS[10], CENAS[11]].map((c) => c.trecho).join('\n');
if (rec !== pitch) { console.error('A divisão não reconstrói o pitch. Nada foi escrito.'); process.exit(1); }
for (const c of CENAS) c.palavras = c.trecho.split(/\s+/).filter(Boolean).length;
writeFileSync(path.join(RAIZ, 'motion/tools/cenas-pitch.json'), JSON.stringify({ fonte: 'docs/pitch-original-locked.md', regra: 'trechos literais; a concatenação reconstrói o pitch inteiro', cenas: CENAS }, null, 2) + '\n');
console.log('Cobertura conferida: os 12 trechos reconstroem o pitch caractere por caractere.');
for (const c of CENAS) console.log(`cena ${String(c.cena).padStart(2)}  ${String(c.palavras).padStart(3)} palavras  ~${Math.round(c.palavras / 2.5)} s  ${c.titulo}`);
