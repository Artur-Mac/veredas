import { formatarReais, formatarReaisCompacto } from "../formatos";
import { validarCnm16 } from "../../nucleo/documentos/auditorDocumental";

export type RateioReservaResultado = {
  custoObraReais: number;
  saldoReservaReais: number;
  unidades: number;
  deficitTotalReais: number;
  cotaExtraPorUnidadeReais: number;
  cobertoPelaReserva: boolean;
  resumoCurto: string;
};

export const AVISO_LEITURA_INDEPENDENTE =
  "Leitura independente no seu aparelho para orientar perguntas antes do sinal; não substitui certidões oficiais atualizadas nem conferência cartorária.";

export function calcularRateioReserva(params: {
  custoObraReais: number;
  saldoReservaReais: number;
  unidades: number;
}): RateioReservaResultado {
  const custoObra = Math.max(0, Math.round(params.custoObraReais));
  const saldoReserva = Math.max(0, Math.round(params.saldoReservaReais));
  const unidades = Math.max(1, Math.round(params.unidades));
  const deficitTotalReais = Math.max(0, custoObra - saldoReserva);
  const cotaExtraPorUnidadeReais =
    deficitTotalReais > 0 ? Math.round(deficitTotalReais / unidades) : 0;
  const cobertoPelaReserva = deficitTotalReais === 0;

  const resumoCurto = cobertoPelaReserva
    ? `Saldo em caixa cobre a intervenção de ${formatarReaisCompacto(custoObra)} sem chamada extra.`
    : `Faltam ${formatarReaisCompacto(deficitTotalReais)} no caixa: rateio estimado de ~${formatarReais(cotaExtraPorUnidadeReais)} por apartamento (${unidades} unid.).`;

  return {
    custoObraReais: custoObra,
    saldoReservaReais: saldoReserva,
    unidades,
    deficitTotalReais,
    cotaExtraPorUnidadeReais,
    cobertoPelaReserva,
    resumoCurto,
  };
}

export function extrairChaveCnm(texto: string): {
  encontrada: boolean;
  formatada: string | null;
  validaDigito: boolean;
} {
  const match = texto.match(/\b\d{6}\.?\d\.?\d{7}-?\d{2}\b|\b\d{16}\b/);
  if (!match) {
    return { encontrada: false, formatada: null, validaDigito: false };
  }
  const res = validarCnm16(match[0]);
  return {
    encontrada: true,
    formatada: res.formatado,
    validaDigito: res.valido,
  };
}

export function gerarScriptSindico3Perguntas(params: {
  nomeImovel: string;
  anoConstrucao: number | null;
  unidades: number | null;
  spuAtivo: boolean;
}): string {
  const idadeTxt = params.anoConstrucao
    ? ` (edifício de ${params.anoConstrucao})`
    : "";
  const rateioTxt = params.unidades
    ? ` entre ${params.unidades} unidades`
    : "";

  const linhas = [
    `Olá! Antes de avançar com proposta para ${params.nomeImovel}${idadeTxt}, gostaria de confirmar 3 pontos objetivos por escrito:`,
    `1) Fundo de reserva e obras: qual é o saldo atual do fundo de reserva e existem obras ou impermeabilizações previstas em ata para rateio${rateioTxt}?`,
    `2) Inadimplência e processos: qual a inadimplência aproximada do condomínio hoje e há ações trabalhistas ou cíveis com impacto no caixa?`,
    params.spuAtivo
      ? `3) Certidões e terreno da União: a unidade possui certidão negativa condominial, matrícula atualizada (CNM 16 dígitos) e certidão/regime atualizado na União (SPU)?`
      : `3) Certidões e matrícula: a unidade possui declaração negativa de débitos do condomínio e cópia recente da matrícula do cartório (CNM 16 dígitos)?`,
  ];

  return linhas.join("\n");
}
