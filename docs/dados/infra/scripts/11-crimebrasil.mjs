#!/usr/bin/env node
// 11-crimebrasil.mjs — coleta criminalidade por bairro do Crime Brasil.
// Fonte: dados oficiais da SDS/PE processados pelo Crime Brasil
// (crimebrasil.com.br), publicados como páginas por bairro com HTML
// server-side renderizado. Sem chave de API: cada página traz o total do
// período (12 meses), o ranking municipal, a tendência ano a ano e o
// detalhamento por tipo de crime.
//
// Uso: node 11-crimebrasil.mjs [bairro]
// Sem argumento: roda os 5 bairros-alvo.
//
// Saída: raw/seguranca/crimebrasil-bairros.json

import { get } from "./http.mjs";
import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "seguranca");

// Slug = nome do bairro em minúsculas, espaços viram hífen, sem acento.
const BAIRROS = [
  { nome: "Boa Viagem", slug: "boa-viagem" },
  { nome: "Casa Forte", slug: "casa-forte" },
  { nome: "Graças", slug: "gracas" },
  { nome: "Espinheiro", slug: "espinheiro" },
  { nome: "Madalena", slug: "madalena" },
];

function slugify(nome) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function limpar(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function numSimples(s) {
  if (!s) return null;
  const n = parseInt(String(s).replace(/[.\s]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function pctNum(s) {
  if (s === undefined || s === null) return null;
  return parseFloat(String(s).replace(",", "."));
}

function parseBairro(html) {
  const t = limpar(html);
  const out = {};

  const mPeriodo = t.match(/Dados oficiais da SDS\/PE · ([A-Za-z]{3} \d{4} — [A-Za-z]{3} \d{4})/);
  if (mPeriodo) out.periodo = mPeriodo[1];

  const mTotal = t.match(/Ocorrências no período\s*([\d.]+)\s/);
  if (mTotal) out.ocorrencias_periodo = numSimples(mTotal[1]);

  const mRank = t.match(/é o (\d+)º bairro com mais ocorrências entre os (\d+) bairros de Recife com dados/);
  if (mRank) out.ranking = { posicao: +mRank[1], total_bairros: +mRank[2] };

  // Tendência anual: "De 2020 a 2025, o total subiu 11% (de 2.429 para 2.706)."
  // ou "ficou estável (537 e 543)."
  const mA = t.match(/De 2020 a 2025, o total (\w+) ([\d,]+)% \(de ([\d.]+) para ([\d.]+)\)/);
  const mB = t.match(/De 2020 a 2025, o total ficou estável \(([\d.]+) e ([\d.]+)\)/);
  if (mA) {
    out.ano_a_ano = {
      tendencia: `${mA[1]} ${mA[2]}%`,
      ano_base: numSimples(mA[3]),
      ano_fim: numSimples(mA[4]),
    };
  } else if (mB) {
    out.ano_a_ano = { tendencia: "estável", ano_base: numSimples(mB[1]), ano_fim: numSimples(mB[2]) };
  }

  // Valores do gráfico anual (labels <text> numéricos do SVG).
  // A sequência de 2020..2023 aparece em ordem decrescente/crescente; 2024 e
  // 2025 podem não ter label (a página omite o último ano parcial). Captura
  // todos os números que aparecem antes dos rótulos de ano.
  const mChart = html.match(/Ocorrências por ano em[^>]*>([\s\S]{0,6000}?)<\/svg>/i);
  if (mChart) {
    const labels = [...mChart[1].matchAll(/<text[^>]*>([\d.]+)<\/text>/g)]
      .map((m) => numSimples(m[1]))
      .filter((n) => n !== null);
    // Rótulos de ano também são <text>; separe os que são anos (2020-2025) dos que são valores.
    const anos = labels.filter((n) => n >= 2020 && n <= 2025);
    const valores = labels.filter((n) => !(n >= 2020 && n <= 2025));
    if (valores.length) out.grafico_ano_a_ano = valores;
    if (anos.length) out.grafico_anos = anos;
  }

  // Detalhamento por tipo de crime. Formato na página (texto limpo):
  //   "Principais tipos de crime ... Ameaça 28% · 601 Roubo a Transeunte 27% · 587
  //    ... Outros tipos 6,7% · 143"
  // Captura uma janela generosa após o cabeçalho e extrai cada par (tipo, %, qtd).
  const iTipos = t.indexOf("Principais tipos de crime");
  if (iTipos >= 0) {
    // Janela: do cabeçalho até o fim da tabela de tipos. O texto antes dos
    // tipos menciona "Recife" (marca de comparação), então remove esse prefixo
    // do primeiro nome capturado.
    const seg = t.slice(iTipos, iTipos + 1200);
    const tipos = [];
    const re = /([A-ZÀ-Ú][A-Za-zÀ-ú' ]{2,60}?)\s+([\d.,]+)% · ([\d.]+)\s/g;
    let m;
    while ((m = re.exec(seg)) !== null) {
      let nome = m[1].trim();
      if (tipos.length === 0 && /^Recife\s/.test(nome)) nome = nome.replace(/^Recife\s+/, "");
      tipos.push({
        tipo: nome,
        parte_pct: pctNum(m[2]),
        quantidade: numSimples(m[3]),
      });
    }
    if (tipos.length) out.por_tipo = tipos;
  }

  const mPerfil = t.match(/esse grupo soma pelo menos (\d+)%/);
  if (mPerfil) out.perfil = { crimes_violentos_pct: +mPerfil[1] };

  return out;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const alvo = process.argv[2]
    ? BAIRROS.filter((b) => b.nome === process.argv[2] || slugify(b.nome) === process.argv[2])
    : BAIRROS;

  if (!alvo.length) {
    console.error(`Bairro desconhecido: ${process.argv[2]}. Use: ${BAIRROS.map((b) => b.nome).join(", ")}`);
    process.exit(1);
  }

  const resultado = {};
  let falhas = 0;

  for (const b of alvo) {
    const url = `https://crimebrasil.com.br/bairro/pe/recife/${b.slug}`;
    try {
      const { text, fromCache } = await get(url, { timeoutMs: 45_000 });
      const parsed = parseBairro(text);
      resultado[b.nome] = {
        bairro: b.nome,
        url,
        consultado_em: new Date().toISOString(),
        de_cache: fromCache,
        ...parsed,
      };
      const total = parsed.ocorrencias_periodo ?? "?";
      const rank = parsed.ranking ? `${parsed.ranking.posicao}º/${parsed.ranking.total_bairros}` : "?";
      console.log(`${b.nome}: ${total} ocorrências (${parsed.periodo ?? "?"}), ranking ${rank}`);
      console.log(`  tipos: ${parsed.por_tipo ? parsed.por_tipo.map((t) => `${t.tipo} ${t.parte_pct}%·${t.quantidade}`).join(", ") : "?"}`);
    } catch (e) {
      falhas++;
      resultado[b.nome] = { bairro: b.nome, url, consultado_em: new Date().toISOString(), erro: String(e.message || e) };
      console.log(`${b.nome}: ERRO ${e.message}`);
    }
  }

  saveOut(join(OUT, "crimebrasil-bairros.json"), JSON.stringify({ consultado_em: new Date().toISOString(), bairros: resultado }, null, 2));
  console.log(`--- salvo em ${OUT}/crimebrasil-bairros.json (${Object.keys(resultado).length} bairros, ${falhas} falhas) ---`);

  registrarFonte({
    id: "crimebrasil",
    nome: "Crime Brasil (processa SDS/PE)",
    url: "https://crimebrasil.com.br",
    tipo: "pagina_publica",
    area: "seguranca",
    status: falhas === 0 ? "ok" : falhas === BAIRROS.length ? "falhou" : "parcial",
    acesso: "HTML server-side renderizado, sem chave; scraping das páginas por bairro",
    observacoes:
      "Fonte original: SDS/PE (boletins de ocorrência com município, bairro e natureza do crime). " +
      "Período exibido: 12 meses móveis. Taxas por 100 mil habitantes disponíveis; população por setor censitário IBGE 2022. " +
      "O dado é contagem de ocorrências registradas, não crimes ocorridos (subnotificação).",
  });
}

main().catch((e) => {
  console.error(e);
  registrarFonte({
    id: "crimebrasil",
    nome: "Crime Brasil (processa SDS/PE)",
    url: "https://crimebrasil.com.br",
    tipo: "pagina_publica",
    area: "seguranca",
    status: "falhou",
    acesso: "erro",
    observacoes: String(e.message || e),
  });
  process.exit(1);
});
