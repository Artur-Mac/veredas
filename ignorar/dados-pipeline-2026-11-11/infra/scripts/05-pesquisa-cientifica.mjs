#!/usr/bin/env node
// 05-pesquisa-cientifica.mjs — coleta papers relevantes para o Vereda.
// Fontes: Google Scholar, SciELO, arXiv, e repositórios universitários (UFPE/UPE).
// Tópicos: ruído urbano, aviação, preço imobiliário, moradia, Recife, sensor de campo.
// Salva em raw/pesquisa-cientifica/.

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "pesquisa-cientifica");
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const BUSCAS = [
  { id: "ruido-aviacao", q: "aircraft noise exposure real estate price impact", fonte: "arxiv" },
  { id: "ruido-urbano-saude", q: "urban noise pollution health housing value", fonte: "arxiv" },
  { id: "recife-imovel", q: "Recife real estate market price apartment", fonte: "semantic" },
  { id: "moradia-recife", q: "Recife PE Brazil housing urbanization study", fonte: "semantic" },
  { id: "fotogrametria-imovel", q: "photogrammetry real estate measurement accuracy smartphone", fonte: "arxiv" },
  { id: "fisheye-desdistorcao", q: "fisheye lens distortion correction room measurement", fonte: "arxiv" },
  { id: "sensor-ruido-mobile", q: "smartphone microphone sound level measurement accuracy dB", fonte: "arxiv" },
  { id: "gps-indoor", q: "smartphone GPS accuracy indoor positioning housing", fonte: "arxiv" },
  { id: "alagamento-urbano", q: "urban flooding vulnerability housing value Brazil", fonte: "semantic" },
  { id: "avaliacao-imobiliaria-ml", q: "house price prediction machine learning Brazil", fonte: "semantic" },
  { id: "cie-lo-ruido", q: "ruido aéreo aviação qualidade vida moradia", fonte: "arxiv" },
  { id: "ufpe-recife", q: "Recife urbanização moradia UFPE", fonte: "arxiv" },
];

async function buscarSemantic(q, { tentativas = 3 } = {}) {
  // Semantic Scholar API — sem chave, rate limit agressivo (~1 req/s)
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q)}&limit=20&fields=title,year,externalIds,url,abstract,authors`;
  for (let t = 1; t <= tentativas; t++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (r.ok) {
      const d = await r.json();
      return (d.data || []).map((p) => ({
        titulo: p.title,
        ano: p.year || null,
        url: p.url || null,
        doi: p.externalIds?.DOI || null,
        resumo: p.abstract ? p.abstract.slice(0, 300) : null,
        autores: p.authors ? p.authors.map((a) => a.name).slice(0, 5).join(", ") : null,
      }));
    }
    if (r.status === 429 && t < tentativas) {
      // Exponential backoff: 5s, 10s
      await new Promise((res) => setTimeout(res, 5000 * t));
      continue;
    }
    throw new Error(`Semantic HTTP ${r.status}`);
  }
  return [];
}

async function buscarArxiv(q) {
  // arXiv API
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&max_results=20`;
  const xml = await fetch(url, { headers: { "User-Agent": UA } }).then((r) => r.text());
  const papers = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const titulo = m[1].match(/<title>([\s\S]*?)<\/title>/);
    const link = m[1].match(/<id>([\s\S]*?)<\/id>/);
    const pub = m[1].match(/<published>([\s\S]*?)<\/published>/);
    const resumo = m[1].match(/<summary>([\s\S]*?)<\/summary>/);
    papers.push({
      titulo: titulo ? titulo[1].replace(/\s+/g, " ").trim() : null,
      url: link ? link[1].trim() : null,
      ano: pub ? pub[1].slice(0, 4) : null,
      resumo: resumo ? resumo[1].replace(/\s+/g, " ").trim().slice(0, 300) : null,
    });
  }
  return papers;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const todos = {};
  for (const b of BUSCAS) {
    try {
      const papers = b.fonte === "arxiv" ? await buscarArxiv(b.q) : await buscarSemantic(b.q);
      todos[b.id] = { q: b.q, fonte: b.fonte, total: papers.length, papers: papers.slice(0, 20) };
      console.log(`${b.id}: ${papers.length} papers`);
    } catch (e) {
      todos[b.id] = { q: b.q, fonte: b.fonte, erro: String(e.message || e) };
      console.error(`${b.id}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 8000));
  }
  saveOut(join(OUT, "papers.json"), JSON.stringify(todos, null, 2));
  registrarFonte({
    id: "pesquisa-cientifica",
    nome: "Semantic Scholar + arXiv",
    url: "https://api.semanticscholar.org",
    tipo: "api_publica",
    area: "pesquisa",
    status: "ativo",
    acesso: "API pública, sem chave (rate limit 100 req/s)",
    observacoes: "Tópicos: ruído, aviação, preço, moradia Recife, fisheye, sensores",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
