import { formatarReais, formatarReaisCompacto } from "../formatos";
import type { VereditoConfortoTermico } from "../clima/confortoTermico";
import type { ResultadoRadarVistaELote } from "../entorno/radarVistaELote";
import type { ResultadoPulsoDaQuadra } from "./pulsoDaQuadra";

export type EntradaResumoExecutivo = {
  nomeImovel: string;
  endereco: string;
  modalidade: "compra" | "aluguel";
  precoPrincipalReais: number | null;
  mensalBolsoRealReais: number | null;
  dinheiroEntrarReais: number | null;
  fachadaResumo: string;
  conforto: VereditoConfortoTermico;
  sossegoNivel: string;
  radar: ResultadoRadarVistaELote;
  pulso: ResultadoPulsoDaQuadra;
  anoConstrucao: number | null;
  unidades: number | null;
  chaveLote14: string | null;
  spuAtivo: boolean;
};

export function gerarTextoResumoExecutivo(e: EntradaResumoExecutivo): string {
  const compra = e.modalidade === "compra";
  const precoStr =
    e.precoPrincipalReais !== null
      ? `${formatarReais(e.precoPrincipalReais)}${compra ? "" : "/mês"}`
      : "A confirmar";
  const mensalStr =
    e.mensalBolsoRealReais !== null
      ? `~${formatarReais(e.mensalBolsoRealReais)}/mês`
      : "A calcular";
  const entradaStr =
    compra && e.dinheiroEntrarReais
      ? `~${formatarReaisCompacto(e.dinheiroEntrarReais)}`
      : "Caução / garantias conforme contrato";

  const linhas = [
    `DOSSIÊ EXECUTIVO VEREDA — ${e.nomeImovel}`,
    `Endereço de referência: ${e.endereco}`,
    "",
    "1. IDENTIFICAÇÃO E VALOR",
    `• Pedido no anúncio: ${precoStr}`,
    `• Identificador municipal do lote: ${e.chaveLote14 ?? "A confirmar no vínculo"}`,
    `• Prédio: ${e.anoConstrucao ? `ano ${e.anoConstrucao}` : "ano a confirmar"}${e.unidades ? ` · ${e.unidades} unidades` : ""}${e.spuAtivo ? " · Terreno da União" : ""}`,
    "",
    "2. CAIXA DE ENTRADA E SAÍDA MENSAL REAL",
    `• Caixa estimado para entrar: ${entradaStr}`,
    `• Saída mensal estimada do bolso: ${mensalStr}`,
    "",
    "3. SOL, VENTO E CONFORTO TÉRMICO",
    `• Orientação ativa: ${e.fachadaResumo}`,
    `• Conforto térmico: ${e.conforto.selo} — ${e.conforto.vereditoUmaLinha}`,
    `• Climatização estimada: ~R$ ${e.conforto.custoMensalArReais}/mês`,
    "",
    "4. SOSSEGO E HORIZONTE DA JANELA",
    `• Sossego noturno no quarto: ${e.sossegoNivel}`,
    `• Radar do horizonte e lote: ${e.radar.manchete}`,
    "",
    "5. PULSO DA QUADRA (6 DIMENSÕES 0–10)",
    `• Síntese: ${e.pulso.manchete}`,
    ...e.pulso.eixos.map((x) => `• ${x.titulo}: ${x.rotuloValor} (${x.resumo})`),
    "",
    "6. LIMITES E CONFERÊNCIA ANTES DO SINAL",
    "• Leitura independente baseada em cadastro municipal, geometria do lote e valores declarados. Confirmar matrícula atualizada (CNM 16 dígitos), atas condominiais e vistoria presencial.",
  ];

  return linhas.join("\n");
}
