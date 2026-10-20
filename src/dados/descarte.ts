// Descarte de uma análise (Fatia 5). Funções puras: recebem o instante (`agora`) e o extrato da carteira e
// devolvem o próximo estado; quem grava (Analises.tsx, Carteira.tsx) fica de fora, o que deixa a regra
// "um crédito por análise, uma única vez" testável sem React.
import type { AnaliseV2, Carteira, MotivoDeDescarte } from "./contratos";
import { formatarData, hojeIso } from "./formatos";

export const LIMITE_DA_OBSERVACAO = 400;

/** Os quatro motivos de `openDiscardSheet` (index.html, linhas 6325–6371), com a chave estável de `motivoDeDescarte`. */
export const MOTIVOS_DE_DESCARTE: readonly { chave: MotivoDeDescarte; rotulo: string }[] = [
  { chave: "preco_taxas", rotulo: "Preço ou taxas acima do orçamento" },
  { chave: "ruido_entorno", rotulo: "Ruído ou entorno desfavorável" },
  { chave: "planta_andar_vaga", rotulo: "Planta, andar ou vaga inadequados" },
  { chave: "outro", rotulo: "Outro motivo" },
];

export function rotuloDoMotivo(chave: MotivoDeDescarte): string {
  return MOTIVOS_DE_DESCARTE.find((m) => m.chave === chave)?.rotulo ?? "Outro motivo";
}

/** Tira espaços das pontas e limita a 400 caracteres sem partir um par substituto (emoji) ao meio. */
export function normalizarObservacao(texto: string): string {
  const limpo = texto.trim();
  if (limpo.length <= LIMITE_DA_OBSERVACAO) return limpo;
  let corte = limpo.slice(0, LIMITE_DA_OBSERVACAO);
  const ultimo = corte.charCodeAt(corte.length - 1);
  if (ultimo >= 0xd800 && ultimo <= 0xdbff) corte = corte.slice(0, -1);
  return corte.trimEnd();
}

/** O extrato já tem um crédito de descarte desta análise? */
export function extratoTemDescarte(extrato: Carteira["extrato"], analiseId: string): boolean {
  return extrato.some((m) => m.tipo === "descarte" && m.analiseId === analiseId);
}

export type EntradaDoDescarte = { motivo: MotivoDeDescarte; observacao: string };
export type ResultadoDoDescarte = {
  analise: AnaliseV2;
  /** Cabe o crédito de +1? Só quando o extrato ainda não tem o descarte desta análise. */
  creditar: boolean;
};

/**
 * Aplica o descarte. Se a análise já está descartada, ela volta como veio (o primeiro motivo e a primeira data
 * ficam). O crédito não depende disso, e sim do extrato: restaurar e descartar de novo não rende outro crédito,
 * e um descarte gravado cujo crédito falhou ainda pode ser creditado na tentativa seguinte.
 */
export function aplicarDescarte(
  a: AnaliseV2,
  entrada: EntradaDoDescarte,
  extrato: Carteira["extrato"],
  agora: Date,
): ResultadoDoDescarte {
  const creditar = !extratoTemDescarte(extrato, a.id);
  if (a.descarte !== null) return { analise: a, creditar };
  const instante = agora.toISOString();
  return {
    analise: {
      ...a,
      atualizadaEm: instante,
      descarte: { motivo: entrada.motivo, observacao: normalizarObservacao(entrada.observacao), em: instante },
    },
    creditar,
  };
}

/** Restaurar tira o descarte e não mexe na carteira: o crédito já concedido continua lá. */
export function restaurarAnalise(a: AnaliseV2, agora: Date): AnaliseV2 {
  if (a.descarte === null) return a;
  return { ...a, descarte: null, atualizadaEm: agora.toISOString() };
}

/**
 * +1 crédito de descarte, uma única vez por análise: se o extrato já tem o descarte, devolve a mesma carteira
 * (mesma referência), e quem chama sabe que nada foi creditado.
 */
export function creditarDescarteNaCarteira(c: Carteira, analiseId: string, agora: Date): Carteira {
  if (extratoTemDescarte(c.extrato, analiseId)) return c;
  return {
    saldo: Math.min(999, c.saldo + 1),
    extrato: [{ em: agora.toISOString(), tipo: "descarte" as const, analiseId, delta: 1 }, ...c.extrato].slice(0, 500),
  };
}

// ——— Extrato da carteira em palavras (tela de Créditos) ——————————————————————————————

type Movimento = Carteira["extrato"][number];

/** "Prédio confirmado · Apartamento 3 quartos"; sem o nome da análise (removida), só a primeira parte. */
export function descreverMovimento(m: Movimento, nomeDaAnalise: string | null): string {
  const com = (texto: string) => (nomeDaAnalise ? `${texto} · ${nomeDaAnalise}` : texto);
  switch (m.tipo) {
    case "cota_inicial":
      return "Cota inicial";
    case "dossie_cadastral":
      return com("Prédio confirmado");
    case "descarte":
      return com("Descarte informado");
    case "recarga_de_teste":
      return "Recarga de créditos de teste";
  }
}

/** "+1" ou "−1" (sinal de menos de verdade), como o extrato mostra. */
export function sinalDoDelta(delta: number): string {
  return `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta)}`;
}

/** Dia do movimento na data do aparelho, "20/10/2026". */
export function dataLocal(instante: string): string {
  return formatarData(hojeIso(new Date(instante)));
}
