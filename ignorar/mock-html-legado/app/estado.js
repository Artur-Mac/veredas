import { aparelho, hojeIso } from "./dados.js";

export const estado = {
  dossies: new Map(),
  creditos: { extrato: [] },
  forcado: "padrao",
  apagado: false,
  selecao: [],
  selecionando: false,
  abertas: new Map(),
  natureza: new Set(),
  recebido: null,
  regua: new Map(),
};

export function seccoesAbertas(idDossie) {
  if (!estado.abertas.has(idDossie)) estado.abertas.set(idDossie, new Set());
  return estado.abertas.get(idDossie);
}

export function contestacaoDe(idDossie, idFato) {
  return aparelho.ler("contestacoes", {})[`${idDossie}/${idFato}`] || null;
}

export function contestar(idDossie, idFato, motivo) {
  const todas = aparelho.ler("contestacoes", {});
  todas[`${idDossie}/${idFato}`] = { data: hojeIso(), motivo };
  aparelho.gravar("contestacoes", todas);
}

export function loteConfirmado(dossie) {
  const confirmados = aparelho.ler("lotes-confirmados", {});
  if (dossie.id in confirmados) return confirmados[dossie.id];
  return dossie.lote.confirmado;
}

export function confirmarLote(idDossie, valor) {
  const confirmados = aparelho.ler("lotes-confirmados", {});
  confirmados[idDossie] = valor;
  aparelho.gravar("lotes-confirmados", confirmados);
}

export function estadoDoFato(idDossie, fato) {
  if (estado.forcado === "carregando") return "carregando";
  if (fato.estado === "nao_sabemos" || fato.estado === "vazio") return fato.estado;
  if (estado.forcado === "em_verificacao") return "em_verificacao";
  if (estado.forcado === "contestado" || contestacaoDe(idDossie, fato.id)) return "contestado";
  return fato.estado;
}

export function destinos() {
  return aparelho.ler("destinos", []);
}
