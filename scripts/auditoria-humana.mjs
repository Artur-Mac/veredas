#!/usr/bin/env node
/**
 * Utilitário rápido de auditoria humana para zerar as revisões pendentes sem jamais fabricar revisões.
 * Uso:
 *   node scripts/auditoria-humana.mjs --status
 *   node scripts/auditoria-humana.mjs --conjunto g-rain-h1 [--revisor seu_nome]
 *
 * Teclas em modo interativo:
 *   [s] sim / confirmado    [n] não / rejeitado    [i] incerto / não sei
 *   [o] abrir link de mapa  [p] pular              [q] salvar e sair
 * Cronometra automaticamente `REVISAO_minutos` / tempo gasto por linha.
 */

import { execFile } from "node:child_process";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import readline from "node:readline";
import {
  CONJUNTOS_REVISAO_HUMANA,
  colunaPrincipalDecisao,
  diagnosticarPendencias,
  indicesDeRevisao,
  parseCsvSimples,
  serializarCsv,
} from "../src/nucleo/higiene/pendenciasHumanas.ts";

const RAIZ = process.cwd();
const DIR_EVAL = join(RAIZ, "docs/aplicacao/evaluation-sets");

function abrirNavegador(url) {
  if (!url) return;
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", url] : [url];
  execFile(cmd, args, () => undefined);
}

async function auditarConjuntoInterativo(conjuntoId, revisor) {
  const cfg = CONJUNTOS_REVISAO_HUMANA.find((c) => c.id === conjuntoId);
  if (!cfg) {
    console.error(`Conjunto desconhecido: ${conjuntoId}. Opções: ${CONJUNTOS_REVISAO_HUMANA.map((c) => c.id).join(", ")}`);
    process.exit(1);
  }
  const caminho = join(DIR_EVAL, cfg.arquivo);
  const linhas = parseCsvSimples(readFileSync(caminho, "utf8"));
  const cabecalho = linhas[0];
  const revCols = indicesDeRevisao(cabecalho);
  const principal = colunaPrincipalDecisao(revCols);
  if (!principal) throw new Error(`Sem colunas REVISAO_/OBS_ em ${cfg.arquivo}`);

  const idxData = cabecalho.findIndex((c) => /REVISAO_data|OBS_data/i.test(c));
  const idxRevisor = cabecalho.findIndex((c) => /REVISAO_revisor/i.test(c));
  const idxMin = cabecalho.findIndex((c) => /REVISAO_minutos/i.test(c));
  const idxNota = cabecalho.findIndex((c) => /REVISAO_nota|OBS_nota/i.test(c));
  const idxMapa = cabecalho.findIndex((c) => /mapa/i.test(c));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const perguntar = (q) => new Promise((res) => rl.question(q, res));

  let gravadas = 0;
  for (let rowIdx = 1; rowIdx < linhas.length; rowIdx += 1) {
    const row = linhas[rowIdx];
    if (revCols.some(({ i }) => String(row[i] ?? "").trim() !== "")) continue;

    console.log(`\n=== [${cfg.id}] Linha ${rowIdx}/${linhas.length - 1} ===`);
    cabecalho.forEach((col, i) => {
      if (!col.startsWith("REVISAO_") && !col.startsWith("OBS_") && row[i]) {
        console.log(`  ${col}: ${row[i]}`);
      }
    });

    const tInicio = Date.now();
    let concluida = false;
    while (!concluida) {
      const resp = (await perguntar("Decisão ([s]=sim, [n]=não, [i]=incerto, [o]=abrir mapa, [p]=pular, [q]=sair): "))
        .trim()
        .toLowerCase();

      if (resp === "o" && idxMapa >= 0) {
        abrirNavegador(row[idxMapa]);
        continue;
      }
      if (resp === "p") {
        concluida = true;
        break;
      }
      if (resp === "q") {
        rl.close();
        if (gravadas > 0) {
          const tmp = `${caminho}.tmp`;
          writeFileSync(tmp, serializarCsv(linhas));
          renameSync(tmp, caminho);
        }
        console.log(`Salvas ${gravadas} revisões em ${cfg.arquivo}.`);
        return;
      }
      const mapaResp = { s: "sim", n: "nao", i: "incerto" };
      if (!mapaResp[resp]) {
        console.log("Tecla inválida. Use s, n, i, o, p ou q.");
        continue;
      }
      const nota = (await perguntar("Nota opcional (Enter para pular): ")).trim();
      const minutos = Math.max(0.1, Number(((Date.now() - tInicio) / 60_000).toFixed(2)));
      row[principal.i] = mapaResp[resp];
      if (idxData >= 0) row[idxData] = new Date().toISOString().slice(0, 10);
      if (idxRevisor >= 0) row[idxRevisor] = revisor;
      if (idxMin >= 0) row[idxMin] = String(minutos);
      if (idxNota >= 0 && nota) row[idxNota] = nota;
      gravadas += 1;
      const tmp = `${caminho}.tmp`;
      writeFileSync(tmp, serializarCsv(linhas));
      renameSync(tmp, caminho);
      concluida = true;
    }
  }
  rl.close();
  console.log(`Conjunto ${cfg.id} finalizado (${gravadas} linhas gravadas nesta sessão).`);
}

const args = process.argv.slice(2);
if (args.includes("--status") || args.length === 0) {
  console.log(JSON.stringify(diagnosticarPendencias(DIR_EVAL), null, 2));
} else {
  const idxC = args.indexOf("--conjunto");
  const cid = idxC >= 0 ? args[idxC + 1] : null;
  const idxR = args.indexOf("--revisor");
  const rev = idxR >= 0 ? args[idxR + 1] : "auditor_humano";
  if (!cid) {
    console.error("Uso: node scripts/auditoria-humana.mjs --status | --conjunto <id> [--revisor nome]");
    process.exit(1);
  }
  await auditarConjuntoInterativo(cid, rev);
}
