// Descarte de uma análise (Fatia 5). Funções puras: recebem o instante (`agora`) e o extrato da carteira e
// devolvem o próximo estado; quem grava (Analises.tsx, Carteira.tsx) fica de fora, o que deixa a regra
// "um crédito por análise, uma única vez" testável sem React.
import type { AnaliseV2, Carteira, MotivoDeDescarte } from "./contratos";
import { formatarData, hojeIso } from "./formatos";

export const LIMITE_DA_OBSERVACAO = 400;

type Movimento = Carteira["extrato"][number];

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

/** Esta análise consumiu crédito? Há uma linha "dossie_cadastral" dela no extrato. */
export function extratoTemDossie(extrato: Carteira["extrato"], analiseId: string): boolean {
  return extrato.some((m) => m.tipo === "dossie_cadastral" && m.analiseId === analiseId);
}

/**
 * O descarte desta análise rende +1 crédito? Só se a análise consumiu crédito (tem "dossie_cadastral" no extrato) e o
 * +1 ainda não foi dado. O +1 devolve o crédito de quem pagou e contou por que descartou; sem pagamento não há o que
 * devolver (descartar uma análise de graça e ganhar crédito seria fabricar saldo).
 */
export function descarteGeraCredito(extrato: Carteira["extrato"], analiseId: string): boolean {
  return extratoTemDossie(extrato, analiseId) && !extratoTemDescarte(extrato, analiseId);
}

/** Teto do extrato no contrato (`esquemaCarteira`). */
export const LIMITE_DO_EXTRATO = 500;

/**
 * Corta o extrato (mais recente primeiro) ao teto do contrato sem perder o que prova os créditos: as linhas
 * "dossie_cadastral" e "descarte" são as últimas a sair, porque é por elas que o +1 do descarte sabe se a análise
 * pagou e se já foi creditada. Ordem do corte: recargas de teste, da mais antiga para a mais nova; depois a cota
 * inicial; e só se o extrato ainda passar do teto (500 linhas de dossiê e descarte, que o contrato não comporta) as
 * mais antigas dessas duas. Mantém a ordem das linhas que ficam. Se já cabe, devolve o mesmo array.
 */
export function limitarExtrato(extrato: Carteira["extrato"], limite: number = LIMITE_DO_EXTRATO): Carteira["extrato"] {
  const excesso = extrato.length - limite;
  if (excesso <= 0) return extrato;
  const sai = new Set<number>();
  const etapas: ((m: Movimento) => boolean)[] = [
    (m) => m.tipo === "recarga_de_teste",
    (m) => m.tipo === "cota_inicial",
    () => true,
  ];
  for (const serve of etapas) {
    // do fim (o mais antigo) para o começo
    for (let i = extrato.length - 1; i >= 0 && sai.size < excesso; i -= 1) {
      const movimento = extrato[i];
      if (movimento && !sai.has(i) && serve(movimento)) sai.add(i);
    }
  }
  return extrato.filter((_, i) => !sai.has(i));
}

export type EntradaDoDescarte = { motivo: MotivoDeDescarte; observacao: string };
export type ResultadoDoDescarte = {
  analise: AnaliseV2;
  /** Cabe o crédito de +1? Só quando a análise consumiu crédito (dossiê no extrato) e o extrato ainda não tem o descarte dela. */
  creditar: boolean;
};

/**
 * Aplica o descarte. Se a análise já está descartada, ela volta como veio (o primeiro motivo e a primeira data
 * ficam). O crédito não depende disso, e sim do extrato: restaurar e descartar de novo não rende outro crédito,
 * um descarte gravado cujo crédito falhou ainda pode ser creditado na tentativa seguinte, e uma análise que nunca
 * consumiu crédito é descartada sem crédito.
 */
export function aplicarDescarte(
  a: AnaliseV2,
  entrada: EntradaDoDescarte,
  extrato: Carteira["extrato"],
  agora: Date,
): ResultadoDoDescarte {
  const creditar = descarteGeraCredito(extrato, a.id);
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

/**
 * O +1 do descarte devolveu o crédito da confirmação que está valendo? Sim quando o extrato tem o "descarte" desta
 * análise e ele é mais recente que o último "dossie_cadastral" dela (o extrato vem do mais recente para o mais antigo).
 * Se a pessoa pagou de novo depois do reembolso (há um dossiê mais novo que o descarte), a confirmação de agora não foi
 * devolvida, e o descarte seguinte não rende outro +1 (ver `descarteGeraCredito`).
 */
export function descarteDevolveuAConfirmacao(extrato: Carteira["extrato"], analiseId: string): boolean {
  const doDescarte = extrato.findIndex((m) => m.tipo === "descarte" && m.analiseId === analiseId);
  if (doDescarte === -1) return false;
  const doDossie = extrato.findIndex((m) => m.tipo === "dossie_cadastral" && m.analiseId === analiseId);
  // Sem dossiê no extrato, o dele já saiu no corte (o mais antigo sai primeiro): o descarte é o mais recente.
  return doDossie === -1 || doDescarte < doDossie;
}

/**
 * Restaurar tira o descarte e não mexe na carteira: o crédito já concedido continua lá.
 *
 * Com o `extrato` da carteira, há uma exceção: se o +1 do descarte devolveu o crédito do prédio confirmado, o vínculo
 * volta a "pendente" e confirmar o prédio de novo custa 1 crédito. Sem isso, confirmar (-1), descartar (+1) e
 * restaurar deixaria o dossiê aberto de graça. Só o vínculo "confirmado" é desfeito (pular, "não encontrei" e fora de
 * cobertura nunca custaram crédito), e só quando o reembolso cobriu a confirmação de agora. Sem `extrato`, o vínculo
 * fica como está: quem restaura passa o extrato de `useCarteira()`.
 */
export function restaurarAnalise(a: AnaliseV2, agora: Date, extrato?: Carteira["extrato"]): AnaliseV2 {
  if (a.descarte === null) return a;
  const pedeConfirmarDeNovo =
    extrato !== undefined && a.vinculo.estado === "confirmado" && descarteDevolveuAConfirmacao(extrato, a.id);
  return {
    ...a,
    descarte: null,
    vinculo: pedeConfirmarDeNovo ? { estado: "pendente" } : a.vinculo,
    atualizadaEm: agora.toISOString(),
  };
}

/**
 * +1 crédito de descarte, só para análise que consumiu crédito e uma única vez: se o extrato não tem o
 * "dossie_cadastral" dela, ou já tem o "descarte", devolve a mesma carteira (mesma referência), e quem chama sabe
 * que nada foi creditado.
 */
export function creditarDescarteNaCarteira(c: Carteira, analiseId: string, agora: Date): Carteira {
  if (!descarteGeraCredito(c.extrato, analiseId)) return c;
  return {
    saldo: Math.min(999, c.saldo + 1),
    extrato: limitarExtrato([
      { em: agora.toISOString(), tipo: "descarte" as const, analiseId, delta: 1 },
      ...c.extrato,
    ]),
  };
}

// ——— Extrato da carteira em palavras (tela de Créditos) ——————————————————————————————

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
