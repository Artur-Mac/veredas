// Sintetiza os sons de interface de um POC a partir das deixas (cues) da linha do tempo.
// Sons originais, gerados aqui; nenhuma amostra de terceiros. Vozes click, pop, thump e
// whoosh seguem a receita da REF-08; tick e sweep são deste projeto.
//
//   node motion/audio/sfx.mjs cues.json out/poc-01-sfx.wav [duração]
import { readFileSync, writeFileSync } from 'node:fs';

const TAXA = 48000;

// ruído determinístico (LCG, semente fixa)
function ruido(semente = 42) {
  let s = semente >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s / 4294967296) * 2 - 1; };
}

const VOZES = {
  click: { dur: 0.05, f: (t) => Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-90 * t) * 0.5 },
  tick: { dur: 0.03, f: (t) => Math.sin(2 * Math.PI * 2600 * t) * Math.exp(-160 * t) * 0.22 },
  pop: { dur: 0.15, f: (t) => Math.sin(2 * Math.PI * (600 + 900 * t) * t) * Math.exp(-30 * t) * 0.32 },
  thump: { dur: 0.5, f: (t) => Math.sin(2 * Math.PI * (90 - 60 * t) * t) * Math.exp(-9 * t) * 0.7 },
  // whoosh: ruído passa-baixa de um polo, envelope em seno, duração variável
  whoosh: { dur: 0.35, gerar: (dur) => {
    const n = Math.round(dur * TAXA), r = ruido(7), out = new Float32Array(n);
    let y = 0;
    for (let i = 0; i < n; i += 1) {
      const t = i / TAXA, env = Math.sin(Math.PI * Math.min(1, t / dur));
      const corte = 0.02 + 0.10 * env;
      y += corte * (r() - y);
      out[i] = y * env * 0.9;
    }
    return out;
  } },
  // sweep: glissando curto e baixo para o raio que varre
  sweep: { dur: 0.95, gerar: (dur) => {
    const n = Math.round(dur * TAXA), out = new Float32Array(n);
    let fase = 0;
    for (let i = 0; i < n; i += 1) {
      const t = i / TAXA, p = t / dur;
      fase += (2 * Math.PI * (320 + 260 * p)) / TAXA;
      out[i] = Math.sin(fase) * Math.sin(Math.PI * p) ** 2 * 0.10;
    }
    return out;
  } },
};

export function sintetizar(cues, duracao) {
  const mix = new Float32Array(Math.ceil(duracao * TAXA) + TAXA);
  for (const c of cues) {
    const v = VOZES[c.tipo];
    if (!v) throw new Error(`voz desconhecida: ${c.tipo}`);
    const dur = c.dur || v.dur;
    const amostras = v.gerar ? v.gerar(dur) : Float32Array.from({ length: Math.round(dur * TAXA) }, (_, i) => v.f(i / TAXA));
    const i0 = Math.round(c.t * TAXA), ganho = c.ganho ?? 1;
    for (let i = 0; i < amostras.length && i0 + i < mix.length; i += 1) mix[i0 + i] += amostras[i] * ganho;
  }
  return mix.subarray(0, Math.ceil(duracao * TAXA));
}

export function wav(amostras) {
  const buf = Buffer.alloc(44 + amostras.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + amostras.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(TAXA, 24); buf.writeUInt32LE(TAXA * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(amostras.length * 2, 40);
  for (let i = 0; i < amostras.length; i += 1) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, amostras[i])) * 32767), 44 + i * 2);
  return buf;
}

if (process.argv[1]?.endsWith('sfx.mjs')) {
  const [entrada, saida, dur] = process.argv.slice(2);
  const cues = JSON.parse(readFileSync(entrada, 'utf8'));
  const lista = Array.isArray(cues) ? cues : cues.sons;
  const duracao = Number(dur || cues.duracao || Math.max(...lista.map((c) => c.t)) + 1);
  writeFileSync(saida, wav(sintetizar(lista, duracao)));
  console.log(`${lista.length} sons em ${saida}`);
}
