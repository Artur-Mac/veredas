import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ConfigConjuntoRevisao = {
  id: string;
  arquivo: string;
  prioridade: number;
  descricao: string;
};

export const CONJUNTOS_REVISAO_HUMANA: readonly ConfigConjuntoRevisao[] = [
  { id: "g-rain-h1", arquivo: "g-rain-h1.csv", prioridade: 1, descricao: "4 registros que dirigem 173 dossiês de chuva" },
  { id: "g-rain", arquivo: "g-rain-revisao.csv", prioridade: 2, descricao: "38 registros de alagamento (Defesa Civil)" },
  { id: "g-poi", arquivo: "g-poi-revisao.csv", prioridade: 3, descricao: "44 estabelecimentos e paradas (G-POI)" },
  { id: "g-building", arquivo: "g-building-revisao.csv", prioridade: 4, descricao: "50 vínculos edifício-lote e entradas (G-BUILDING)" },
  { id: "g-transit", arquivo: "g-transit-revisao.csv", prioridade: 5, descricao: "20 itinerários programados (G-TRANSIT)" },
  { id: "g-transit-torre", arquivo: "g-transit-torre-revisao.csv", prioridade: 6, descricao: "12 itinerários na Torre (G-TRANSIT-TORRE)" },
  { id: "g-extract", arquivo: "g-extract-revisao.csv", prioridade: 7, descricao: "34 grupos de ruas da Defesa Civil (G-EXTRACT)" },
  { id: "g-noite", arquivo: "g-noite-observacao.csv", prioridade: 8, descricao: "18 checagens de campo noturno/ruído" },
  { id: "g-shade", arquivo: "g-shade-observacao.csv", prioridade: 9, descricao: "80 pares de observação de sombra em rota" },
];

export function parseCsvSimples(texto: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i]!;
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else aspas = false;
      } else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i += 1;
      linha.push(campo);
      campo = "";
      if (linha.length > 1 || linha[0] !== "") linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo !== "" || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

export function serializarCsv(linhas: readonly (readonly (string | number | null | undefined)[])[]): string {
  return linhas.map((l) => l.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n") + "\n";
}

export function indicesDeRevisao(cabecalho: readonly string[]): { col: string; i: number }[] {
  return cabecalho
    .map((col, i) => ({ col, i }))
    .filter(({ col }) => col.startsWith("REVISAO_") || col.startsWith("OBS_"));
}

export function colunaPrincipalDecisao(revCols: readonly { col: string; i: number }[]): { col: string; i: number } | null {
  return revCols.find((c) => /corret|confere|existe|resultado/i.test(c.col)) ?? revCols[0] ?? null;
}

export type ResumoPendenciaConjunto = {
  id: string;
  arquivo: string;
  prioridade: number;
  descricao: string;
  colunaPrincipal: string | null;
  total: number;
  revisadas: number;
  pendentes: number;
};

export type DiagnosticoPendencias = {
  geradoEm: string;
  totalLinhas: number;
  totalRevisadas: number;
  totalPendentes: number;
  pending_human_gates_zero: boolean;
  porConjunto: ResumoPendenciaConjunto[];
};

export function diagnosticarPendencias(dirEval: string): DiagnosticoPendencias {
  const porConjunto: ResumoPendenciaConjunto[] = [];
  let totalLinhas = 0;
  let totalPendentes = 0;
  let totalRevisadas = 0;

  for (const cfg of CONJUNTOS_REVISAO_HUMANA) {
    const caminho = join(dirEval, cfg.arquivo);
    if (!existsSync(caminho)) continue;
    const linhas = parseCsvSimples(readFileSync(caminho, "utf8"));
    if (linhas.length <= 1) continue;
    const cabecalho = linhas[0]!;
    const revCols = indicesDeRevisao(cabecalho);
    const principal = colunaPrincipalDecisao(revCols);
    const corpo = linhas.slice(1);
    let pendentes = 0;
    let revisadas = 0;
    for (const r of corpo) {
      const preenchida = revCols.some(({ i }) => String(r[i] ?? "").trim() !== "");
      if (preenchida) revisadas += 1;
      else pendentes += 1;
    }
    totalLinhas += corpo.length;
    totalPendentes += pendentes;
    totalRevisadas += revisadas;
    porConjunto.push({
      id: cfg.id,
      arquivo: cfg.arquivo,
      prioridade: cfg.prioridade,
      descricao: cfg.descricao,
      colunaPrincipal: principal?.col ?? null,
      total: corpo.length,
      revisadas,
      pendentes,
    });
  }

  return {
    geradoEm: new Date().toISOString(),
    totalLinhas,
    totalRevisadas,
    totalPendentes,
    pending_human_gates_zero: totalPendentes === 0,
    porConjunto,
  };
}
