// Gera uma versão de arquivo único de cada protótipo, para mandar a quem não tem o repositório.
// A base comum (CSS e script), as três fontes e os mapas vão embutidos: o arquivo abre de qualquer pasta e não pede
// nada à rede. O original (opcao-x/index.html) não muda.
//   node ferramentas/empacotar.mjs        → ../compartilhar/vereda-opcao-a.html e vereda-opcao-b.html
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROTOTIPOS = path.resolve(AQUI, "..");
const SAIDA = path.resolve(PROTOTIPOS, "..", "compartilhar");
await mkdir(SAIDA, { recursive: true });

const dados = async (arquivo, tipo) => `data:${tipo};base64,${(await readFile(arquivo)).toString("base64")}`;

// CSS comum, com as fontes locais embutidas.
let css = await readFile(path.join(PROTOTIPOS, "comum", "base.css"), "utf8");
for (const [, relativo] of [...css.matchAll(/url\("([^"]+\.ttf)"\)/g)]) {
  const fonte = await dados(path.resolve(PROTOTIPOS, "comum", relativo), "font/ttf");
  css = css.replace(`url("${relativo}")`, `url("${fonte}")`);
}
const js = await readFile(path.join(PROTOTIPOS, "comum", "prototipo.js"), "utf8");
if (js.includes("</script")) throw new Error("prototipo.js tem </script> no texto: não dá para embutir assim");

for (const letra of ["a", "b"]) {
  let html = await readFile(path.join(PROTOTIPOS, `opcao-${letra}`, "index.html"), "utf8");

  // Sem pedido à rede: saem as fontes do Google (as locais, embutidas, assumem) e entra o aviso para buscadores.
  html = html.replace(/^<link [^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\r?\n/gm, "");
  html = html.replace('<link rel="stylesheet" href="../comum/base.css">', `<meta name="robots" content="noindex, nofollow">\n<style>\n${css}\n</style>`);

  // Cada mapa entra uma vez só, num dicionário; as imagens apontam para ele pelo nome.
  const nomes = [...new Set([...html.matchAll(/src="\.\.\/mapas\/([^"]+)"/g)].map((m) => m[1]))];
  const mapas = {};
  for (const nome of nomes) mapas[nome] = await dados(path.join(PROTOTIPOS, "mapas", nome), "image/png");
  html = html.replace(/src="\.\.\/mapas\/([^"]+)"/g, 'data-mapa="$1"');
  const ligarMapas = `<script>\nconst MAPAS = ${JSON.stringify(mapas)};\nfor (const img of document.querySelectorAll("img[data-mapa]")) img.src = MAPAS[img.dataset.mapa];\n</script>`;
  html = html.replace('<script src="../comum/prototipo.js"></script>', `${ligarMapas}\n<script>\n${js}\n</script>`);

  const sobras = [...html.matchAll(/(?:src|href)="(?!#|data:)([^"]+)"/g)].map((m) => m[1]);
  if (sobras.length) throw new Error(`opção ${letra}: ficou referência externa: ${[...new Set(sobras)].join(", ")}`);
  const destino = path.join(SAIDA, `vereda-opcao-${letra}.html`);
  await writeFile(destino, html, "utf8");
  console.log(`${destino}  ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB  (${nomes.length} mapas)`);
}
