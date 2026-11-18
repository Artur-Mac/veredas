import type { AnaliseV2 } from "../contratos";
import { formatarReais, formatarReaisCompacto } from "../formatos";
import { fragmentoDaSala, montarSala, paraBase64Url } from "../salaDeDecisao";
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

export function gerarTextoResumoExecutivo(
  e: EntradaResumoExecutivo,
  opcoes?: { ocultarValoresFinanceiros?: boolean },
): string {
  const ocultar = Boolean(opcoes?.ocultarValoresFinanceiros);
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

  const pendenciasLista: string[] = [];
  if (!ocultar && e.precoPrincipalReais === null) pendenciasLista.push("preço anunciado");
  if (!ocultar && e.mensalBolsoRealReais === null) pendenciasLista.push("parcelas mensais completas");
  if (!e.chaveLote14) pendenciasLista.push("chave municipal do lote");
  if (!e.anoConstrucao) pendenciasLista.push("ano de construção do prédio");

  const linhas = [
    `DOSSIÊ EXECUTIVO VEREDA — ${e.nomeImovel}`,
    `Modelo do dossiê: v2`,
    `Endereço de referência: ${e.endereco}`,
    "",
    "1. IDENTIFICAÇÃO E VALOR",
    `• Pedido no anúncio: ${ocultar ? "Ocultado pelo usuário neste envio" : precoStr}`,
    `• Identificador municipal do lote: ${e.chaveLote14 ?? "A confirmar no vínculo"}`,
    `• Prédio: ${e.anoConstrucao ? `ano ${e.anoConstrucao}` : "ano a confirmar"}${e.unidades ? ` · ${e.unidades} unidades` : ""}${e.spuAtivo ? " · Terreno da União" : ""}`,
    "",
    "2. CAIXA DE ENTRADA E SAÍDA MENSAL REAL",
    ...(ocultar
      ? ["• Caixa e saída mensal: Ocultados pelo usuário (modo técnico para vistoria/síndico)"]
      : [
          compra && e.dinheiroEntrarReais
            ? `• Caixa estimado para entrar (entrada + ITBI; escritura e registro a confirmar no cartório): ${entradaStr}`
            : `• Caixa estimado para entrar: ${entradaStr}`,
          `• Saída mensal estimada do bolso: ${mensalStr}`,
        ]),
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
    pendenciasLista.length > 0
      ? `• Itens faltantes visíveis antes do sinal: ${pendenciasLista.join(", ")}.`
      : "• Campos estruturais deste resumo preenchidos; confirmar matrícula atualizada (CNM 16 dígitos) e atas antes do sinal.",
    "• Leitura independente baseada em cadastro municipal, geometria do lote e valores declarados. Não substitui certidão oficial nem vistoria presencial.",
    "• Privacidade: notas privadas do seu caderno ficam de fora por padrão e nenhum dado passa por servidor.",
  ];

  return linhas.join("\n");
}

export function gerarLinkPrivadoSemServidor(params: {
  entrada: EntradaResumoExecutivo;
  analisePrincipal?: AnaliseV2 | null;
  outrasAnalises?: readonly AnaliseV2[];
  origemWeb?: string;
  ocultarValoresFinanceiros?: boolean;
}): string {
  const origem = params.origemWeb ?? "https://vereda.local";
  const compativel = (params.outrasAnalises ?? []).find(
    (x) =>
      params.analisePrincipal &&
      x.id !== params.analisePrincipal.id &&
      !x.descarte &&
      x.modalidade === params.analisePrincipal.modalidade,
  );
  if (params.analisePrincipal && compativel) {
    const sala = montarSala(
      [params.analisePrincipal, compativel],
      new Date().toISOString(),
    );
    return `${origem}/sala#${fragmentoDaSala(sala)}`;
  }

  const compacto = {
    v: 1,
    n: params.entrada.nomeImovel.slice(0, 60),
    e: params.entrada.endereco.slice(0, 80),
    m: params.entrada.modalidade,
    p: params.ocultarValoresFinanceiros ? null : params.entrada.precoPrincipalReais,
    mb: params.ocultarValoresFinanceiros ? null : params.entrada.mensalBolsoRealReais,
    s: params.entrada.fachadaResumo,
  };
  return `${origem}/sala#v=${paraBase64Url(JSON.stringify(compacto))}`;
}
