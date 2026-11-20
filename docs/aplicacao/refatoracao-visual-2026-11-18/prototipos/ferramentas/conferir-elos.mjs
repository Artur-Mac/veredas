// Confere, lendo o HTML, se todo elo de um protótipo leva a uma tela, gaveta ou âncora que existe, e se toda tela e
// gaveta é alcançável por algum elo e está em window.TELAS.
//   node ferramentas/conferir-elos.mjs a
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const opcao = process.argv[2] || "a";
const html = await readFile(path.resolve(AQUI, "..", `opcao-${opcao}`, "index.html"), "utf8");

const telas = new Set([...html.matchAll(/<section class="tela"[^>]*\bid="([^"]+)"/g)].map((m) => m[1]));
const gavetas = new Set([...html.matchAll(/<section class="gaveta[^"]*"[^>]*\bid="g-([^"]+)"/g)].map((m) => m[1]));
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const elos = [...html.matchAll(/href="#([^"]*)"/g)].map((m) => m[1]);
const rotasDeclaradas = [...html.matchAll(/rota:\s*"([^"]+)"/g)].map((m) => m[1]);

const quebrados = new Map();
const telasUsadas = new Set();
const gavetasUsadas = new Set();
const conferir = (rota, origem) => {
  const [resto, ancora] = rota.split("@");
  const [tela, gaveta] = resto.split("+");
  let problema = null;
  if (!telas.has(tela)) problema = `tela "${tela}" não existe`;
  else if (gaveta && !gavetas.has(gaveta)) problema = `gaveta "${gaveta}" não existe`;
  else if (ancora && !ids.has(`${tela}-${ancora}`)) problema = `âncora "${tela}-${ancora}" não existe`;
  if (problema) quebrados.set(`${origem} #${rota}`, problema);
  telasUsadas.add(tela);
  if (gaveta) gavetasUsadas.add(gaveta);
};
for (const e of new Set(elos)) if (e) conferir(e, "elo");
for (const r of rotasDeclaradas) conferir(r, "TELAS");

const declaradas = new Set(rotasDeclaradas);
const gavetasEmTelas = new Set(rotasDeclaradas.filter((r) => r.includes("+")).map((r) => r.split("+")[1].split("@")[0]));
const telasEmTelas = new Set(rotasDeclaradas.map((r) => r.split(/[+@]/)[0]));

console.log(`opção ${opcao}: ${telas.size} telas, ${gavetas.size} gavetas, ${new Set(elos).size} elos distintos, ${declaradas.size} rotas em TELAS`);
console.log(`elos quebrados: ${quebrados.size}`);
for (const [k, v] of quebrados) console.log(`  ${k}: ${v}`);
const semElo = [...gavetas].filter((g) => !gavetasUsadas.has(g));
console.log(`gavetas que nenhum elo abre: ${semElo.length ? semElo.join(", ") : "nenhuma"}`);
const foraDeTelas = [...gavetas].filter((g) => !gavetasEmTelas.has(g)).concat([...telas].filter((t) => !telasEmTelas.has(t)));
console.log(`telas ou gavetas fora de window.TELAS: ${foraDeTelas.length ? foraDeTelas.join(", ") : "nenhuma"}`);
const vazios = elos.filter((e) => e === "").length;
console.log(`elos sem destino (href="#"): ${vazios}`);
