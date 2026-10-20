// Uso: node motion/tools/checar-quadros.mjs <poc> [limite_px=40] [--porta 4188]   (ex.: node motion/tools/checar-quadros.mjs cena05 --porta 4193)
// Verificador da cena: (1) texto sobre texto em cada quadro a 30 fps; (2) deslocamento por quadro.
// Trazido de um construtor anterior; o comportamento é o mesmo. Única mudança: #tela e #folha
// (da cena 8) são opcionais, para a ferramenta rodar em cenas que não os têm.
import { chromium } from '../../node_modules/playwright/index.mjs';
import { startServer } from '../serve.mjs';
const args = process.argv.slice(2);
const iPorta = args.indexOf('--porta');
const PORTA = iPorta >= 0 ? Number(args[iPorta + 1]) : 4188;
const posicionais = args.filter((a, i) => !(iPorta >= 0 && (i === iPorta || i === iPorta + 1)));
const [poc, lim = '40'] = posicionais;
const srv = await startServer(PORTA);
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', (e) => console.log('[erro]', e.message));
await p.goto(`http://127.0.0.1:${PORTA}/motion/poc/${poc}.html`);
await p.evaluate(() => window.__pronto);
const res = await p.evaluate(({ LIM }) => {
  const c = document.getElementById('c');
  const todos = [...c.querySelectorAll('*')];
  const nomeDe = (e) => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + [...e.classList].join('.')) + (e.textContent ? ' «' + e.textContent.trim().slice(0, 28) + '»' : '');
  const parseInset = (cp, r) => {
    const m = cp.match(/inset\(([^)]*)\)/); if (!m) return null;
    const parts = m[1].split(' round ')[0].trim().split(/\s+/).map((v) => parseFloat(v));
    let [t, rr, bb, l] = parts.length === 1 ? [parts[0], parts[0], parts[0], parts[0]] : parts.length === 2 ? [parts[0], parts[1], parts[0], parts[1]] : parts.length === 3 ? [parts[0], parts[1], parts[2], parts[1]] : parts;
    return { x0: r.left + l, y0: r.top + t, x1: r.right - rr, y1: r.bottom - bb };
  };
  const inter = (a, q) => ({ x0: Math.max(a.x0, q.x0), y0: Math.max(a.y0, q.y0), x1: Math.min(a.x1, q.x1), y1: Math.min(a.y1, q.y1) });
  const vazio = (a) => a.x1 - a.x0 < 1 || a.y1 - a.y0 < 1;
  const QUADRO = { x0: 0, y0: 0, x1: 1920, y1: 1080 };
  function visivel(e) {
    let op = 1, clip = QUADRO;
    for (let a = e; a && a !== c.parentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none' || s.visibility === 'hidden') return null;
      op *= parseFloat(s.opacity);
      if (s.clipPath && s.clipPath !== 'none') { const q = parseInset(s.clipPath, a.getBoundingClientRect()); if (q) clip = inter(clip, q); }
      if (a !== e && (s.overflow === 'hidden' || s.overflowX === 'hidden')) { const r = a.getBoundingClientRect(); clip = inter(clip, { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }); }
    }
    if (op < 0.05 || vazio(clip)) return null;
    return { op, clip };
  }
  const tela = document.getElementById('tela'), folha = document.getElementById('folha');
  const DUR = window.POC.duracao;
  const sobre = [], vel = new Map();
  let antes = null;
  for (let f = 0; f <= Math.round(DUR * 30); f += 1) {
    const t = Math.min(f / 30, DUR);
    window.seek(t);
    // retângulo da folha (cobre o que está abaixo do #tela)
    let rf = null;
    if (folha && tela && getComputedStyle(folha).visibility !== 'hidden') { const r = folha.getBoundingClientRect(), rt = tela.getBoundingClientRect(); rf = inter({ x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }, { x0: rt.left, y0: rt.top, x1: rt.right, y1: rt.bottom }); if (vazio(rf)) rf = null; }
    // textos visíveis
    const tx = [];
    const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim()) continue;
      const e = n.parentElement; const v = visivel(e); if (!v) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r0 of rg.getClientRects()) {
        let r = inter({ x0: r0.left, y0: r0.top, x1: r0.right, y1: r0.bottom }, v.clip);
        if (vazio(r)) continue;
        const pg = document.getElementById('pagina');
        if (rf && (!tela.contains(e) || (pg && pg.contains(e)))) { const q = inter(r, rf); if (!vazio(q)) { if (r.x0 < rf.x0) r = { ...r, x1: Math.min(r.x1, rf.x0) }; else continue; } }
        if (vazio(r)) continue;
        tx.push({ r, n, nome: n.textContent.trim().slice(0, 30) });
      }
    }
    for (let i = 0; i < tx.length; i += 1) for (let j = i + 1; j < tx.length; j += 1) {
      if (tx[i].n === tx[j].n) continue;
      const q = inter(tx[i].r, tx[j].r);
      if (q.x1 - q.x0 > 3 && q.y1 - q.y0 > 3) sobre.push({ t: +t.toFixed(3), a: tx[i].nome, b: tx[j].nome, w: +(q.x1 - q.x0).toFixed(0), h: +(q.y1 - q.y0).toFixed(0) });
    }
    // velocidade: bordas visíveis (limitadas ao quadro) de cada elemento visível
    const agora = new Map();
    for (const e of todos) {
      if (e.closest('#cursor-camada') || e.id === 'tela' || e.id === 'pagina') continue;
      const v = visivel(e); if (!v) continue;
      const r = e.getBoundingClientRect(); if (r.width === 0 && r.height === 0) continue;
      let q = inter({ x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }, v.clip);
      if (vazio(q)) continue;
      agora.set(e, q);
      if (antes && antes.has(e)) {
        const a = antes.get(e);
        const d = Math.max(Math.abs(q.x0 - a.x0), Math.abs(q.y0 - a.y0), Math.abs(q.x1 - a.x1), Math.abs(q.y1 - a.y1));
        const m = vel.get(e);
        if (!m || d > m.d) vel.set(e, { d, t });
      }
    }
    antes = agora;
  }
  const rapidos = [...vel.entries()].filter(([, m]) => m.d > LIM).map(([e, m]) => ({ el: nomeDe(e), px: +m.d.toFixed(1), t: +m.t.toFixed(3) })).sort((a, b) => b.px - a.px);
  // agrupa sobreposições por par de textos
  const grupos = new Map();
  for (const s of sobre) { const k = s.a + ' × ' + s.b; const g = grupos.get(k) || { de: s.t, ate: s.t, n: 0, max: 0 }; g.ate = s.t; g.n += 1; g.max = Math.max(g.max, s.w * s.h); grupos.set(k, g); }
  return { sobre: [...grupos.entries()].map(([k, g]) => ({ par: k, ...g })), rapidos };
}, { LIM: Number(lim) });
console.log('== texto sobre texto ==');
for (const s of res.sobre) console.log(`${s.de.toFixed(2)}–${s.ate.toFixed(2)} s (${s.n} q, máx ${s.max} px²): ${s.par}`);
if (!res.sobre.length) console.log('nenhum');
console.log(`== deslocamento acima de ${lim} px/quadro ==`);
for (const r of res.rapidos.slice(0, 40)) console.log(`${r.px} px em ${r.t} s · ${r.el}`);
if (!res.rapidos.length) console.log('nenhum');
await b.close(); srv.close();
