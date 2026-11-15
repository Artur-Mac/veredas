// Folhas de revisão e de observação (VE16): um ciclo de atualização nunca apaga o que uma pessoa escreveu.
// Antes, cada pipeline regravava a sua folha a cada execução; com colunas REVISAO_*/OBS_* preenchidas, a resposta
// humana se perderia na próxima atualização. Regra: sem conteúdo humano, a folha é regravada; com conteúdo humano, a
// folha fica como está e a versão regerada vai para <nome>.regerada.csv, ao lado, para conferência.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

const HUMANAS = /^(REVISAO|OBS)_/;

/** Lê um CSV simples com campos entre aspas (o formato que os pipelines gravam). */
export function lerCsv(texto) {
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; } else if (c === '"') aspas = false; else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

/** Quantas células humanas (REVISAO_*, OBS_*) estão preenchidas. */
export function celulasHumanas(texto) {
  const [cab, ...resto] = lerCsv(texto);
  if (!cab) return 0;
  const idx = cab.map((c, i) => (HUMANAS.test(c) ? i : -1)).filter((i) => i >= 0);
  return resto.reduce((n, l) => n + idx.filter((i) => (l[i] ?? "").trim() !== "").length, 0);
}

/** Grava a folha respeitando o conteúdo humano. Devolve "igual" | "gravada" | "preservada". */
export function gravarFolha(arquivo, texto) {
  if (existsSync(arquivo)) {
    const atual = readFileSync(arquivo, "utf8");
    if (atual === texto) return "igual";
    if (celulasHumanas(atual) > 0) {
      const lado = arquivo.replace(/\.csv$/, ".regerada.csv");
      writeFileSync(`${lado}.tmp`, texto); renameSync(`${lado}.tmp`, lado);
      console.warn(`folha com respostas humanas preservada: ${arquivo} (versão regerada em ${lado})`);
      return "preservada";
    }
  }
  writeFileSync(`${arquivo}.tmp`, texto); renameSync(`${arquivo}.tmp`, arquivo);
  return "gravada";
}
