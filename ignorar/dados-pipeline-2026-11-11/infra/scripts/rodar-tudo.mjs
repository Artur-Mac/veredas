#!/usr/bin/env node
// node rodar-tudo.mjs [--paralelo] [--somente 01,04,06] [--listar]
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { saveOut } from "./http.mjs";

const scriptDir = fileURLToPath(new URL("./", import.meta.url));
const TIMEOUT_MS = 10 * 60 * 1000;
const LOG_LIMIT = 8_192;

const SCRIPTS = [
  { id: "01", nome: "Google Maps (categorias por bairro)", arquivo: "01-google-maps.mjs" },
  { id: "02", nome: "Imóveis (Oleo)", arquivo: "02-imoveis-oleo.mjs" },
  { id: "03", nome: "Leilões (JusLèggas + TJ-PE)", arquivo: "03-leiloes.mjs" },
  { id: "04", nome: "Cadastro municipal (CKAN + ESIG)", arquivo: "04-cadastro-municipal.mjs" },
  { id: "05", nome: "Pesquisa científica (Scholar + SciELO)", arquivo: "05-pesquisa-cientifica.mjs" },
  { id: "06", nome: "Ruído do aeroporto (cone + cruzamento)", arquivo: "06-ruido-aeroporto.mjs" },
  { id: "07", nome: "GTFS Grande Recife (transporte)", arquivo: "07-gtfs-transporte.mjs" },
  { id: "08", nome: "FipeZAP (preço m²)", arquivo: "08-fipezap.mjs" },
];

const { values } = parseArgs({
  options: {
    paralelo: { type: "boolean" },
    somente: { type: "string" },
    listar: { type: "boolean" },
  },
});

const ids = values.somente?.split(",").map((id) => id.trim());
const invalidos = ids?.filter((id) => !SCRIPTS.some((s) => s.id === id));
if (invalidos?.length) {
  console.error(`ID inválido: ${invalidos.join(", ")}. Use --listar para ver as opções.`);
  process.exit(2);
}

const selecionados = ids ? SCRIPTS.filter((s) => ids.includes(s.id)) : SCRIPTS;
if (values.listar) {
  for (const s of selecionados) console.log(`${s.id} ${s.nome}`);
  process.exit(0);
}

const resumo = {
  iniciado: new Date().toISOString(),
  modo: values.paralelo ? "paralelo" : "sequencial",
  resultados: {},
};

async function rodar(s) {
  console.log(`→ ${s.id} ${s.nome}`);
  const inicio = Date.now();
  const child = spawn(process.execPath, [join(scriptDir, s.arquivo)], {
    stdio: ["ignore", "pipe", "pipe"],
    timeout: TIMEOUT_MS,
    killSignal: "SIGKILL",
  });

  let saida = "";
  let erro = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => {
    saida = (saida + chunk).slice(-LOG_LIMIT);
  });
  child.stderr.setEncoding("utf8").on("data", (chunk) => {
    erro = (erro + chunk).slice(-LOG_LIMIT);
  });
  child.on("error", (error) => {
    erro = error.message;
  });

  const { codigo, sinal } = await new Promise((resolve) => {
    child.once("close", (codigo, sinal) => resolve({ codigo, sinal }));
  });
  const status = codigo === 0 ? "ok" : "falhou";
  resumo.resultados[s.id] = {
    nome: s.nome,
    status,
    codigo,
    sinal,
    duracao_s: Math.round((Date.now() - inicio) / 1000),
    saida: saida.trim().split("\n").slice(-5).join(" | "),
    erro: erro.trim().split("\n").slice(-5).join(" | "),
  };
  console.log(`${status === "ok" ? "✓" : "✗"} ${s.id} ${s.nome} — ${status}`);
}

const limite = values.paralelo ? 2 : 1;
const fila = selecionados.values();
await Promise.all(Array.from({ length: limite }, async () => {
  for (const s of fila) await rodar(s);
}));

resumo.finalizado = new Date().toISOString();
const destino = fileURLToPath(new URL("../../raw/_resumo-ultima-rodada.json", import.meta.url));
saveOut(destino, JSON.stringify(resumo, null, 2));
console.log(`Resumo salvo em ${destino}`);
process.exitCode = Object.values(resumo.resultados).some((r) => r.status === "falhou") ? 1 : 0;
