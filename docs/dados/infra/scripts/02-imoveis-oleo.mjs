#!/usr/bin/env node
// 02-imoveis-oleo.mjs — scraping do portal Oleo Imoveis (imoveis.com.br), maior portal do Nordeste.
// Técnica: busca por bairro via HTML público e extrai os cards de anúncio do embedded JSON.
// Salva em raw/imoveis/oleo-<bairro>.json com preço, quartos, área, endereço e URL do anúncio.

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "imoveis");

const BAIRROS = ["Boa Viagem", "Casa Forte", "Graças", "Espinheiro", "Madalena"];
const UAS = { venda: "1", aluguel: "2" }; // 1=compra, 2=aluguel

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function extrairCards(html) {
  // O Oleo embute os anúncios em JSON dentro de <script> (various keys).
  // Estratégia: pega todos os blocos que têm "preco" e "endereco" próximos.
  const resultados = [];
  const re = /\{\s*"id"\s*:\s*(\d+)[^{}]*?"titulo"\s*:\s*"([^"]+)"[^{}]*?"preco"\s*:\s*"?(\d+)"?[^{}]*?"quartos"\s*:\s*(\d+|null)[^{}]*?"area"\s*:\s*"?([\d.]+)"?/gs;
  let m;
  while ((m = re.exec(html)) !== null) {
    resultados.push({
      id: m[1],
      titulo: m[2],
      preco: parseInt(m[3], 10),
      quartos: m[4] === "null" ? null : parseInt(m[4], 10),
      area: m[5] ? parseFloat(m[5]) : null,
    });
  }
  // Fallback: regex mais frouxa por "preco" + "bairro"
  if (resultados.length === 0) {
    const re2 = /"price"\s*:\s*(\d+)[\s\S]{0,600}?"(?:neighborhood|bairro)"\s*:\s*"([^"]+)"/g;
    while ((m = re2.exec(html)) !== null) {
      resultados.push({ preco: parseInt(m[1], 10), bairro: m[2] });
    }
  }
  return resultados;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const todos = {};
  for (const bairro of BAIRROS) {
    todos[bairro] = {};
    for (const [tipo, ua] of Object.entries(UAS)) {
      const url = `https://www.oleoimoveis.com.br/imoveis/apartamento/?uf=PE&cidade=Recife&bairro=${encodeURIComponent(bairro)}&tp_operacao=${ua}&page=1`;
      try {
        const html = await fetch(url, {
          headers: { "User-Agent": UA, "Accept-Language": "pt-BR" },
          redirect: "follow",
        }).then((r) => r.text());
        const cards = extrairCards(html);
        todos[bairro][tipo] = { url, total: cards.length, anuncios: cards.slice(0, 60) };
        console.log(`${bairro} | ${tipo}: ${cards.length} anúncios`);
      } catch (e) {
        todos[bairro][tipo] = { url, erro: String(e.message || e) };
        console.error(`${bairro} | ${tipo}: erro — ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  saveOut(join(OUT, "oleo-recife.json"), JSON.stringify(todos, null, 2));
  registrarFonte({
    id: "oleo-imoveis",
    nome: "Oleo Imoveis (imoveis.com.br)",
    url: "https://www.oleoimoveis.com.br",
    tipo: "scraping_html",
    area: "imoveis",
    status: "parcial",
    acesso: "HTML público, sem chave; rate limit humano",
    observacoes: "Cards extraídos de JSON embutido; confirmar estrutura em produção",
  });
}

main().catch((e) => {
  console.error(e);
  registrarFonte({ id: "oleo-imoveis", nome: "Oleo Imoveis", url: "https://www.oleoimoveis.com.br", tipo: "scraping_html", area: "imoveis", status: "falhou", acesso: "erro", observacoes: String(e.message || e) });
  process.exit(1);
});
