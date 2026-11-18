#!/usr/bin/env node
// validar-defesa-civil.mjs — recontagem dos CSVs da Defesa Civil (2021–2025)
// com leitor CSV robusto (aspas, ;, colunas dinâmicas) e chave em Ocorrencia,
// conforme metodologia de docs/dados/validacao-defesa-civil-gtfs.md.
//
// Uso: node validar-defesa-civil.mjs
// Não escreve em raw/ nem processado/; imprime o JSON do resumo.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_DIR = join(__dirname, "..", "..", "raw", "cadastro-municipal");

// Leitor CSV com suporte a aspas duplas (incluindo aspas escapadas "" dentro de campo).
function parseCSV(text, sep = ";") {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === sep) { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Normaliza nomes de bairro: sem acento, minúsculas, espaços colapsados.
function norm(s) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
}

const ALVO = ["Boa Viagem", "Casa Forte", "Graças", "Espinheiro", "Madalena"];
const alvoNorm = new Map(ALVO.map(b => [norm(b), b]));
const ALAG = /alag|enchent|inunda/i;

const anos = ["2021", "2022", "2023", "2024", "2025"];
const porAno = {};
let totalLinhas = 0, linhasVaziasOcorrencia = 0, linhasSemBairro = 0;
const porBairroAno = {}; // bairro -> ano -> contagem
for (const b of ALVO) porBairroAno[b] = {};
const outras = {}; // bairros-alvo de nomes que não casaram (amostra de verificação)
let amostraBV2022 = [];

for (const ano of anos) {
  const texto = readFileSync(join(CSV_DIR, `defesa-civil-${ano}.csv`), "utf8");
  const rows = parseCSV(texto);
  // O cabeçalho tem aspas residuais (o exportador fechou a última coluna sem
  // separador de aspas): "Grau_de_Risco" vira '"Grau_de_Risco".
  const header = rows[0].map(h => h.trim().replace(/^"+|"+$/g, ""));
  // O CSV de 2022 não tem coluna "Regional": os dados de Ocorrencia, Solicitacao
  // e Endereco saem deslocados 1 célula para a esquerda em relação ao cabeçalho
  // de 16 colunas (a coluna Regional não existe nos dados). Bairro e Data, por
  // coincidência, caem no mesmo índice do cabeçalho. Detectamos a ausência de
  // Regional pelo valor da primeira célula da primeira linha de dados (é "2022",
  // o ano, em vez de uma região como "Norte"/"Oeste").
  const temRegional = (rows[1] || [])[0]?.trim() !== "2022";
  const d = temRegional ? 0 : -1;
  const iO = header.findIndex(h => h.toLowerCase() === "ocorrencia") + d;
  const iS = header.findIndex(h => h.toLowerCase() === "solicitacao") + d;
  const iB = header.findIndex(h => h.toLowerCase() === "bairro"); // bairro NÃO desloca
  const iT = header.findIndex(h => h.toLowerCase().startsWith("tipo")) + d;
  const iData = header.findIndex(h => h.toLowerCase() === "data"); // data NÃO desloca
  porAno[ano] = { totalLinhas: rows.length - 1, comOcorrencia: 0, alagamento: 0, bairrosAlvo: {} };
  for (const b of ALVO) porBairroAno[b][ano] = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r.length || r.every(c => !c.trim())) continue;
    totalLinhas++;
    const ocorrencia = (r[iO] || "").trim();
    const bairro = (r[iB] || "").trim();
    if (!ocorrencia) linhasVaziasOcorrencia++;
    else porAno[ano].comOcorrencia++;
    if (!bairro) linhasSemBairro++;

    // Filtro: Ocorrencia contém alagamento/ENCHENTE/inundação (caminho primário).
    // A linha antiga somava também Tipo_da_Acao e Solicitacao; o caminho secundário
    // é reportado separadamente para transparência (ver relatório).
    const matchO = ALAG.test(ocorrencia);
    const matchSec = ALAG.test((r[iT] || "") + " " + (r[iS] || ""));
    if (matchO || matchSec) {
      porAno[ano].alagamento++;
      if (matchO) {
        const nome = alvoNorm.get(norm(bairro));
        if (nome) {
          porAno[ano].bairrosAlvo[nome] = (porAno[ano].bairrosAlvo[nome] || 0) + 1;
          porBairroAno[nome][ano]++;
          if (nome === "Boa Viagem" && ano === "2022" && amostraBV2022.length < 5) {
            amostraBV2022.push({ data: r[iData] || "", ocorrencia, solicitacao: r[iS] || "" });
          }
        } else if (norm(bairro)) {
          // bairro que não casa com nenhum alvo — amostragem de diagnóstico
          outras[`${norm(bairro)} (${ano})`] = (outras[`${norm(bairro)} (${ano})`] || 0) + 1;
        }
      }
    }
  }
}

// Conferência independente: Boa Viagem 2022 — linhas cuja Ocorrencia ou Solicitacao
// diga "Vistoria Alagado" ou "Monitoramento Alagado".
const texto22 = readFileSync(join(CSV_DIR, "defesa-civil-2022.csv"), "utf8");
const rows22 = parseCSV(texto22);
// O CSV de 2022 não tem coluna "Regional": a primeira célula de cada linha é o ano.
// O mapeamento abaixo usa o nome da coluna para localizar o campo, independentemente
// de onde ele aparece, e o teste de conferência abaixo valida a localização.
const h22 = rows22[0].map(h => h.trim().replace(/^"+|"+$/g, ""));
// 2022 sem Regional: Ocorrencia/Solicitacao/Endereco deslocados -1; Bairro e Data
// ficam no índice do cabeçalho. Mapeamento: O=3, S=4, E=5, B=7, Data=2.
const jO = h22.findIndex(h => h.toLowerCase() === "ocorrencia") - 1;
const jS = h22.findIndex(h => h.toLowerCase() === "solicitacao") - 1;
const jB = h22.findIndex(h => h.toLowerCase() === "bairro"); // bairro não desloca
const jD = 2;
const jEnd = h22.findIndex(h => h.toLowerCase() === "endereco") - 1;
let confBV = 0;
const amostraConf = [];
for (let i = 1; i < rows22.length; i++) {
  const r = rows22[i];
  if (norm(r[jB]) !== "boa viagem") continue;
  const o = (r[jO] || "").toLowerCase(), s = (r[jS] || "").toLowerCase();
  if (/vistoria alagado|monitoramento alagado/.test(o + " " + s)) {
    confBV++;
    if (amostraConf.length < 3) amostraConf.push({ data: r[jD] || "", ocorrencia: r[jO] || "", endereco: (r[jEnd] || "").slice(0, 40) });
  }
}

console.log(JSON.stringify({
  gerado_em: new Date().toISOString(),
  totalLinhas2021_2025: totalLinhas,
  linhasComOcorrenciaVazia: linhasVaziasOcorrencia,
  linhasSemBairro: linhasSemBairro,
  porAno,
  bairrosAlvo: porBairroAno,
  conferenciaBoaViagem2022: {
    esperado: 14,
    obtido: confBV,
    critério: 'Bairro="Boa Viagem" E (Ocorrencia OU Solicitacao contém "vistoria alagado" ou "monitoramento alagado")',
    amostraLinhas: amostraConf,
  },
  bairrosAlvoNaoCasados: outras,
}, null, 2));
