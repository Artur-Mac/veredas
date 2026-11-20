// Confere o cobertura.md contra os dois protótipos: toda rota citada existe e todo texto entre aspas está no HTML
// da opção a que a coluna se refere. Não julga se a feature está bem coberta: só pega rota e citação que não existem.
//   node ferramentas/conferir-cobertura.mjs
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..");

const ENTIDADES = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&middot;": "·", "&ndash;": "–", "&minus;": "−", "&times;": "×" };
// Sem espaço e sem caixa: "~ 58 dB(A)" e "~58 dB(A)" são a mesma citação, e o código em maiúsculas pode estar em minúsculas no HTML.
const chave = (s) => s.replace(/&[a-z#0-9]+;/gi, (e) => ENTIDADES[e.toLowerCase()] ?? e).toLowerCase().replace(/\s+/g, "");

async function lerOpcao(letra) {
  const html = await readFile(path.join(RAIZ, `opcao-${letra}`, "index.html"), "utf8");
  const corpo = html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ");
  return {
    telas: new Set([...html.matchAll(/<section class="tela"[^>]*\bid="([^"]+)"/g)].map((m) => m[1])),
    gavetas: new Set([...html.matchAll(/<section class="gaveta[^"]*"[^>]*\bid="g-([^"]+)"/g)].map((m) => m[1])),
    ids: new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])),
    // Texto visível (sem as marcas) e o HTML inteiro (para placeholder, aria-label e alt).
    texto: chave(corpo.replace(/<[^>]+>/g, "")),
    bruto: chave(corpo),
  };
}

const opcoes = { a: await lerOpcao("a"), b: await lerOpcao("b") };

function rotaExiste(o, rota) {
  const [resto, ancora] = rota.split("@");
  const [tela, gaveta] = resto.split("+");
  if (!o.telas.has(tela)) return `tela "${tela}" não existe`;
  if (gaveta && !o.gavetas.has(gaveta)) return `gaveta "${gaveta}" não existe`;
  if (ancora && !o.ids.has(`${tela}-${ancora}`)) return `âncora "${tela}-${ancora}" não existe`;
  return null;
}

const ROTA = /^[a-z0-9-]+(?:[+@][a-z0-9-]+)*$/;
const md = await readFile(path.join(RAIZ, "cobertura.md"), "utf8");
const problemas = [];
let rotas = 0;
let citacoes = 0;
let cabecalho = null;

for (const [i, linha] of md.split(/\r?\n/).entries()) {
  if (!linha.startsWith("|")) { cabecalho = null; continue; }
  const celulas = linha.split("|").slice(1, -1).map((c) => c.trim());
  if (!cabecalho) { cabecalho = celulas; continue; }
  if (celulas.every((c) => /^:?-+:?$/.test(c))) continue;
  celulas.forEach((celula, k) => {
    const titulo = cabecalho[k] || "";
    // Coluna de uma opção só, ou coluna que fala das duas ("Como aparece nos protótipos", "Conferência nos dois arquivos").
    const alvo = /Opção A/.test(titulo) ? ["a"] : /Opção B/.test(titulo) ? ["b"] : /protótipos|dois arquivos/i.test(titulo) ? ["a", "b"] : null;
    if (!alvo) return;
    for (const [, r] of celula.matchAll(/`([^`]+)`/g)) {
      if (!ROTA.test(r)) continue;
      // Na coluna das duas, a rota vale se existir em alguma; palavra solta que não é tela de nenhuma (em_aberto, npm) é ignorada.
      const erros = alvo.map((l) => rotaExiste(opcoes[l], r));
      const tela = r.split(/[+@]/)[0];
      if (!alvo.some((l) => opcoes[l].telas.has(tela)) && alvo.length === 2) continue;
      rotas += 1;
      if (erros.every(Boolean)) problemas.push(`linha ${i + 1}, ${titulo}: rota \`${r}\`: ${erros[0]}`);
    }
    for (const [, c] of celula.matchAll(/"([^"]+)"/g)) {
      citacoes += 1;
      const k2 = chave(c);
      if (!alvo.some((l) => opcoes[l].texto.includes(k2) || opcoes[l].bruto.includes(k2))) {
        problemas.push(`linha ${i + 1}, ${titulo}: "${c}" não está no HTML`);
      }
    }
  });
}

console.log(`cobertura.md: ${rotas} rotas e ${citacoes} citações conferidas`);
console.log(`problemas: ${problemas.length}`);
for (const p of problemas) console.log("  " + p);
process.exitCode = problemas.length ? 1 : 0;
