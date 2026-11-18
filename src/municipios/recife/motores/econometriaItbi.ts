import type { EpistemicTag } from "../../../nucleo/contratosCanonicos";

/**
 * IND-07 & #40 — Econometria Espacial ITBI (ABNT NBR 14653-2), Repeat-Sales, Liquidez Condominial (λ_b)
 * e Otimizador Tributário do ITBI do Recife (Código Tributário do Recife, Lei 15.563/1991, arts. 51, 52 e 55; limite do
 * SFH de 2026; Lei Complementar federal 227/2026). Escritura e registro não entram na conta: a tabela do TJPE (Ato nº
 * 1.556/2025) tem teto e não é proporcional ao preço, então o valor fica a confirmar no cartório.
 */

export type RegistroItbiBruto = {
  id: string;
  dataTransacao: string; // YYYY-MM-DD
  valorAvaliacaoReais: number;
  areaConstruidaM2: number; // No ITBI do Recife inclui fração de área comum
  fracaoIdeal: number | null;
  complemento?: string | null;
  padraoAcabamento?: string | null;
  estadoConservacao?: string | null;
  sfh: boolean;
};

export type GrauPrecisaoNbr14653 = "Grau_III" | "Grau_II" | "Grau_I" | "amostra_insuficiente";

export type ResultadoEconometriaItbi = {
  indicadorId: "IND-07";
  totalBruto: number;
  expurgosFracaoParcial: number;
  expurgosChauvenet: number;
  amostraValidaN: number;
  amostraSfhN: number;
  mediaHomogeneizadaReais: number | null;
  medianaReais: number | null;
  ic80MinReais: number | null;
  ic80MaxReais: number | null;
  amplitudeIc80Pct: number | null;
  grauPrecisao: GrauPrecisaoNbr14653;
  repeatSalesPares: number;
  valorizacaoAnualCagrPct: number | null;
  taxaLiquidezAnualLambdaB: number | null;
  epistemicTag: EpistemicTag;
  ressalvaLegalConselhos: string;
};

/** Fatores normativos de conservação / acabamento (mantidos dentro dos limites da NBR 14653-2). */
function fatorEstadoConservacao(estado: string | null | undefined): number {
  const s = String(estado ?? "").toLowerCase();
  if (/otimo|novo|excelente/.test(s)) return 0.94;
  if (/bom|regular/.test(s)) return 1.0;
  if (/necessit|reparo|ruim|precario/.test(s)) return 1.12;
  return 1.0;
}

/** Valor crítico aproximado de Chauvenet (|z| > z_crit para probabilidade 1 / (4n)). */
function limiteChauvenet(n: number): number {
  if (n <= 3) return 1.38;
  if (n <= 5) return 1.65;
  if (n <= 10) return 1.96;
  if (n <= 25) return 2.33;
  if (n <= 50) return 2.58;
  return 2.81;
}

/** Quantil bilateral t-Student para IC de 80% (alpha/2 = 0.10, df = n - 1). */
function tCritico80(df: number): number {
  const tabela: Record<number, number> = {
    1: 3.078,
    2: 1.886,
    3: 1.638,
    4: 1.533,
    5: 1.476,
    6: 1.44,
    7: 1.415,
    8: 1.397,
    9: 1.383,
    10: 1.372,
    15: 1.341,
    20: 1.325,
    30: 1.31,
  };
  if (df <= 10) return tabela[df] ?? 1.886;
  if (df <= 15) return 1.341;
  if (df <= 20) return 1.325;
  if (df <= 30) return 1.31;
  return 1.282;
}

export function normalizarComplementoUnidade(comp: string | null | undefined): string | null {
  if (!comp) return null;
  const limpo = comp
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\b(APTO|APT|APARTAMENTO|UNIDADE|UNID|BLOCO|BL)\b/g, " ")
    .replace(/[^A-Z0-9]+/g, "")
    .trim();
  return limpo.length >= 2 ? limpo : null;
}

export function analisarItbiNbr14653(
  registros: readonly RegistroItbiBruto[],
  opts: {
    areaAlvoItbiM2?: number | null;
    fracaoIdealEsperada?: number | null;
    totalUnidadesPredio?: number | null;
    anosJanela?: number;
    taxaAtualizacaoAnual?: number; // ex. 0.05 para atualizar transações antigas até o corte
    anoBase?: number;
  } = {},
): ResultadoEconometriaItbi {
  const anoBase = opts.anoBase ?? 2026;
  const taxaAtu = opts.taxaAtualizacaoAnual ?? 0.05;
  const anosJanela = opts.anosJanela ?? 3;

  // 1. Expurgo de frações parciais (vendas de parte ideal de 25%/50% ou vagas soltas) e segmentação de prumada
  let expurgosFracao = 0;
  const candidatos: (RegistroItbiBruto & { valorHomogeneizado: number })[] = [];

  for (const r of registros) {
    if (!Number.isFinite(r.valorAvaliacaoReais) || r.valorAvaliacaoReais <= 0 || r.areaConstruidaM2 <= 0) continue;

    if (
      typeof opts.fracaoIdealEsperada === "number" &&
      opts.fracaoIdealEsperada > 0 &&
      typeof r.fracaoIdeal === "number" &&
      r.fracaoIdeal > 0
    ) {
      const razao = r.fracaoIdeal / opts.fracaoIdealEsperada;
      if (razao < 0.75 || razao > 1.25) {
        expurgosFracao += 1;
        continue;
      }
    }

    // Segmentação por prumada (±18% na área construída ITBI quando informada)
    if (typeof opts.areaAlvoItbiM2 === "number" && opts.areaAlvoItbiM2 > 0) {
      const razaoArea = r.areaConstruidaM2 / opts.areaAlvoItbiM2;
      if (razaoArea < 0.82 || razaoArea > 1.18) continue;
    }

    const anoTx = Number(r.dataTransacao.slice(0, 4));
    const deltaAnos = Number.isFinite(anoTx) ? Math.max(0, anoBase - anoTx) : 0;
    const fatorTempo = Math.pow(1 + taxaAtu, deltaAnos);
    const fatorConserv = fatorEstadoConservacao(r.estadoConservacao);
    const valorHomogeneizado = r.valorAvaliacaoReais * fatorTempo * fatorConserv;

    candidatos.push({ ...r, valorHomogeneizado });
  }

  // 2. Remoção de outliers pelo Critério de Chauvenet
  let amostra = [...candidatos];
  let expurgosChauvenet = 0;
  if (amostra.length >= 4) {
    const vals = amostra.map((x) => x.valorHomogeneizado);
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1));
    if (sd > 0) {
      const zCrit = limiteChauvenet(amostra.length);
      const filtrados = amostra.filter((x) => Math.abs(x.valorHomogeneizado - mean) / sd <= zCrit);
      expurgosChauvenet = amostra.length - filtrados.length;
      amostra = filtrados;
    }
  }

  // 3. Repeat-Sales intra-edifício & Taxa Anual de Liquidez Condominial (λ_b)
  const porUnidade = new Map<string, RegistroItbiBruto[]>();
  for (const r of registros) {
    const un = normalizarComplementoUnidade(r.complemento);
    if (!un) continue;
    const list = porUnidade.get(un) ?? [];
    list.push(r);
    porUnidade.set(un, list);
  }
  const cagrs: number[] = [];
  for (const txs of porUnidade.values()) {
    if (txs.length < 2) continue;
    const ord = [...txs].sort((a, b) => a.dataTransacao.localeCompare(b.dataTransacao));
    const primeira = ord[0]!;
    const ultima = ord[ord.length - 1]!;
    const anos = (Date.parse(ultima.dataTransacao) - Date.parse(primeira.dataTransacao)) / (365.25 * 86_400_000);
    if (anos >= 0.5 && primeira.valorAvaliacaoReais > 0 && ultima.valorAvaliacaoReais > 0) {
      cagrs.push(Math.pow(ultima.valorAvaliacaoReais / primeira.valorAvaliacaoReais, 1 / anos) - 1);
    }
  }

  const valorizacaoAnualCagrPct =
    cagrs.length > 0
      ? Math.round((cagrs.reduce((s, v) => s + v, 0) / cagrs.length) * 10000) / 100
      : null;

  const taxaLiquidezAnualLambdaB =
    typeof opts.totalUnidadesPredio === "number" && opts.totalUnidadesPredio > 0
      ? Math.round((amostra.length / Math.max(1, anosJanela) / opts.totalUnidadesPredio) * 10000) / 10000
      : null;

  const sfhCount = amostra.filter((x) => x.sfh).length;
  const n = amostra.length;
  let media: number | null = null;
  let mediana: number | null = null;
  let icLow: number | null = null;
  let icHigh: number | null = null;
  let amplitudePct: number | null = null;
  let grau: GrauPrecisaoNbr14653 = "amostra_insuficiente";

  if (n > 0) {
    const ord = amostra.map((x) => x.valorHomogeneizado).sort((a, b) => a - b);
    mediana = Math.round(ord[Math.floor(ord.length / 2)]!);
    media = Math.round(ord.reduce((s, v) => s + v, 0) / n);
  }

  if (n >= 3 && media !== null && media > 0) {
    const vals = amostra.map((x) => x.valorHomogeneizado);
    const sd = Math.sqrt(vals.reduce((s, v) => s + (v - media!) ** 2, 0) / (n - 1));
    const semi = tCritico80(n - 1) * (sd / Math.sqrt(n));
    icLow = Math.max(0, Math.round(media - semi));
    icHigh = Math.round(media + semi);
    amplitudePct = Math.round(((icHigh - icLow) / media) * 10000) / 100;

    if (amplitudePct <= 15) grau = "Grau_III";
    else if (amplitudePct <= 30) grau = "Grau_II";
    else if (amplitudePct <= 50) grau = "Grau_I";
    else grau = "amostra_insuficiente";
  }

  return {
    indicadorId: "IND-07",
    totalBruto: registros.length,
    expurgosFracaoParcial: expurgosFracao,
    expurgosChauvenet,
    amostraValidaN: n,
    amostraSfhN: sfhCount,
    mediaHomogeneizadaReais: media,
    medianaReais: mediana,
    ic80MinReais: icLow,
    ic80MaxReais: icHigh,
    amplitudeIc80Pct: amplitudePct,
    grauPrecisao: grau,
    repeatSalesPares: cagrs.length,
    valorizacaoAnualCagrPct,
    taxaLiquidezAnualLambdaB,
    epistemicTag: n >= 3 ? "inferencia" : "nao_sabemos",
    ressalvaLegalConselhos:
      "Dossiê Estatístico de Transparência Fiscal e Comparáveis Públicos (ITBI SEFIN). Não constitui Laudo de Avaliação (ART CREA / RRT CAU) nem PTAM (CNAI/CRECI).",
  };
}

// ——— Otimizador Tributário do ITBI (Recife 2026) ————————————————————————————————————————

/** Limite da parte financiada pelo SFH que paga 1% (art. 52, I, do Código Tributário do Recife). Valor de 2026: muda todo ano. */
export const TETO_SFH_RECIFE_2026_REAIS = 1_036_600.71;

/**
 * Prazo para pedir o lançamento do ITBI e pagar 1,8% em vez de 3% (art. 55, § 1º, na redação das Leis 19.174/2023 e
 * 19.391/2025): 180 dias da assinatura do contrato; em imóvel novo, do habite-se ou do contrato; com SFH, da assinatura
 * do financiamento. Os prazos de 30 e 90 dias eram da Lei 17.904/2013 e não valem mais.
 */
export const PRAZO_PEDIDO_LANCAMENTO_ITBI_DIAS = 180;

export type EntradaOtimizadorItbiRecife = {
  precoImovelReais: number;
  financiamentoSfh: boolean;
  percentualFinanciado?: number; // ex.: 0.80 para 80%
};

export type CenarioTributarioRecife = {
  itbiReais: number;
  aliquotaEfetivaPct: number;
  /**
   * Escritura e registro: a confirmar no cartório, nunca estimados aqui. A tabela do TJPE (Ato nº 1.556/2025) tem teto
   * por faixa de valor e não cresce em proporção ao preço; os valores que o app calculava por proporção saíram na
   * conferência de 18/11/2026.
   */
  escrituraERegistroReais: null;
  /** Dias para pedir o lançamento e ter a alíquota reduzida; null no cenário de 3%, que é o de quem perde o prazo. */
  prazoLegalDias: number | null;
};

export type ResultadoOtimizadorItbiRecife = {
  semOrientacao3Pct: CenarioTributarioRecife;
  aVistaTempestivo18Pct: CenarioTributarioRecife;
  sfhOtimizado1Pct: CenarioTributarioRecife | null;
  /** As três economias são só de ITBI (diferença entre as alíquotas); cartório não entra. */
  melhorCenarioEconomiaReais: number;
  economiaAVistaTempestivoReais: number;
  economiaSfhReais: number | null;
  /** O que a Lei Complementar federal 227/2026 mudou na base de cálculo do ITBI (art. 38 do CTN) e como o Recife aplica. */
  notaBaseDeCalculoLc227: string;
  ressalvaLegalConselhos: string;
};

/**
 * Simula o ITBI do fechamento no Recife em 2026 e a economia entre as alíquotas:
 * - Arts. 52 e 55 da Lei Municipal nº 15.563/1991: 3% na regra comum; 1,8% com o lançamento pedido em até 180 dias;
 *   1% sobre a parte financiada pelo SFH, até R$ 1.036.600,71 (valor de 2026), sem depender de prazo.
 * - Escritura e registro ficam de fora (a confirmar no cartório). O art. 290 da Lei nº 6.015/1973 dá 50% de redução
 *   nos emolumentos da primeira compra residencial financiada pelo SFH (na tabela do TJPE, sobre a parte financiada),
 *   mas o app não calcula esse valor.
 */
export function simularOtimizacaoItbiRecife(entrada: EntradaOtimizadorItbiRecife): ResultadoOtimizadorItbiRecife {
  const preco = Math.max(0, entrada.precoImovelReais);
  const r2 = (v: number) => Math.round(v * 100) / 100;

  const itbi3 = r2(preco * 0.03);
  const semOrientacao3Pct: CenarioTributarioRecife = {
    itbiReais: itbi3,
    aliquotaEfetivaPct: 3.0,
    escrituraERegistroReais: null,
    prazoLegalDias: null,
  };

  const itbi18 = r2(preco * 0.018);
  const aVistaTempestivo18Pct: CenarioTributarioRecife = {
    itbiReais: itbi18,
    aliquotaEfetivaPct: 1.8,
    escrituraERegistroReais: null,
    prazoLegalDias: PRAZO_PEDIDO_LANCAMENTO_ITBI_DIAS,
  };

  const economiaAVista = r2(itbi3 - itbi18);

  let sfhOtimizado: CenarioTributarioRecife | null = null;
  let economiaSfh: number | null = null;

  if (entrada.financiamentoSfh) {
    const pctFin = Math.max(0, Math.min(0.95, entrada.percentualFinanciado ?? 0.8));
    const parcelaFinanciada = Math.min(preco * pctFin, TETO_SFH_RECIFE_2026_REAIS);
    const parcelaEntradaOuExcedente = Math.max(0, preco - parcelaFinanciada);
    const itbiSfh = r2(parcelaFinanciada * 0.01 + parcelaEntradaOuExcedente * 0.018);

    sfhOtimizado = {
      itbiReais: itbiSfh,
      aliquotaEfetivaPct: preco > 0 ? r2((itbiSfh / preco) * 100) : 0,
      escrituraERegistroReais: null,
      prazoLegalDias: PRAZO_PEDIDO_LANCAMENTO_ITBI_DIAS,
    };
    economiaSfh = r2(itbi3 - itbiSfh);
  }

  return {
    semOrientacao3Pct,
    aVistaTempestivo18Pct,
    sfhOtimizado1Pct: sfhOtimizado,
    melhorCenarioEconomiaReais: economiaSfh !== null ? Math.max(economiaAVista, economiaSfh) : economiaAVista,
    economiaAVistaTempestivoReais: economiaAVista,
    economiaSfhReais: economiaSfh,
    notaBaseDeCalculoLc227:
      "A Lei Complementar federal 227/2026, de 13/01/2026, mudou o art. 38 do Código Tributário Nacional: a base do ITBI é o valor de venda à vista em condições normais de mercado, estimado pelo município por critérios técnicos que ele deve divulgar. Quem discordar pode contestar com avaliação própria. No Recife (Lei 19.490/2026), vale o valor declarado pelo comprador, se for compatível com esses critérios; se não for, o Fisco arbitra, com direito de defesa. O histórico de transações do prédio serve de apoio para contestar.",
    ressalvaLegalConselhos:
      "Simulação informativa do ITBI segundo os arts. 52 e 55 da Lei Municipal nº 15.563/1991; não inclui escritura e registro (tabela do TJPE, Ato nº 1.556/2025, a confirmar no cartório) e não substitui a guia oficial da Secretaria de Finanças.",
  };
}
