#!/usr/bin/env node
// 03-leiloes.mjs — leilões judiciais e extrajudiciais de imóveis no PE.
// Fontes: Leilão Judicial (leiloeiro oficial), JusLèggas, e o portal do TJ-PE.
// Salva em raw/leiloes/.

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "leiloes");
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function baixar(url, nome) {
  try {
    const html = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" }).then((r) => r.text());
    saveOut(join(OUT, nome), html);
    console.log(`${nome}: ${html.length} bytes`);
    return html;
  } catch (e) {
    console.error(`${nome}: erro — ${e.message}`);
    return null;
  }
}

function extrairLeiloes(html) {
  // Extrai blocos que parecem lotes: valor + imóvel
  const lotes = [];
  const re = /R\$\s?([\d.]+,\d{2})/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const contexto = html.slice(Math.max(0, m.index - 300), m.index + 300);
    if (/apartamento|casa|sala comercial|imóvel|lote|terreno/i.test(contexto)) {
      lotes.push({
        valor: m[1],
        trecho: contexto.replace(/\s+/g, " ").slice(0, 280),
        posicao: m.index,
      });
    }
  }
  return lotes;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  // 1) JusLèggas — leilões do TJ-PE
  const urlJus = "https://www.jusleggis.com/leiloes/PE";
  const htmlJus = await baixar(urlJus, "jusleggis-PE.html");
  if (htmlJus) {
    const lotes = extrairLeiloes(htmlJus);
    saveOut(join(OUT, "jusleggis-PE-lotes.json"), JSON.stringify(lotes, null, 2));
  }

  // 2) Portal do TJ-PE — seção de leilões
  const urlTJ = "https://www.tjpe.jus.br/leilao";
  await baixar(urlTJ, "tjpe-leiloes.html");

  // 3) Leiloeiro oficial do Recife (busca genérica)
  const urlLeiloeiro = "https://www.google.com/search?q=leil%C3%A3o+judicial+im%C3%B3vel+Recife+2026&num=20";
  const htmlLeil = await baixar(urlLeiloeiro, "leiloeiros-recife.html");

  // 4) Leilões extrajudiciais (bancos) — busca genérica
  const urlBanco = "https://www.google.com/search?q=leil%C3%A3o+extrajudicial+im%C3%B3vel+banco+Recife+PE+2026&num=20";
  await baixar(urlBanco, "leiloes-bancos.html");

  registrarFonte({
    id: "leiloes-pe",
    nome: "Leilões judiciais e extrajudiciais PE",
    url: "https://www.jusleggis.com/leiloes/PE",
    tipo: "scraping_html",
    area: "leiloes",
    status: "parcial",
    acesso: "HTML público; estrutura varia por leiloeiro",
    observacoes: "Foco: preço de mercado real (leilões fecham abaixo do avaliado) e imóveis com pendência",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
