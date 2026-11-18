import type { EpistemicTag } from "../../../nucleo/contratosCanonicos";

/**
 * IND-07 & #40 — Econometria Espacial ITBI (ABNT NBR 14653-2), Repeat-Sales, Liquidez Condominial (λ_b)
 * e Otimizador Tributário & Cartorário do Recife (CTMR Art. 52, SFH 2026, LC 227/2026 vs. STJ Tema 1.113,
 * Art. 290 da Lei nº 6.015/1973 e Ato TJPE nº 1.556/2025).
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

// ——— Otimizador Tributário e Cartorário (Recife 2026) —————————————————————————————————————

export const TETO_SFH_RECIFE_2026_REAIS = 1_036_600.71;

export type EntradaOtimizadorItbiRecife = {
  precoImovelReais: number;
  financiamentoSfh: boolean;
  percentualFinanciado?: number; // ex.: 0.80 para 80%
  primeiroImovelResidencialSfh?: boolean;
  /** Venda parcelada >12m ou na planta após Habite-se tem janela de 90 dias; à vista 30 dias; SFH 180 dias. */
  modalidadePrazo?: "a_vista_30d" | "parcelado_ou_planta_90d" | "sfh_180d";
  /** Tabela de emolumentos cartório + avaliação bancária opcional (padrão compilado Ato TJPE 1.556/2025). */
  emolumentosEscrituraRegistroPadraoReais?: number;
  emolumentosRegistroSfhDesconto50PctReais?: number;
};

export type CenarioTributarioRecife = {
  itbiReais: number;
  aliquotaEfetivaPct: number;
  emolumentosERegistroReais: number;
  totalFechamentoReais: number;
  prazoLegalDias: number;
};

export type ResultadoOtimizadorItbiRecife = {
  semOrientacao3Pct: CenarioTributarioRecife;
  aVistaTempestivo18Pct: CenarioTributarioRecife;
  sfhOtimizado1Pct: CenarioTributarioRecife | null;
  melhorCenarioEconomiaReais: number;
  economiaAVistaTempestivoReais: number;
  economiaSfhReais: number | null;
  anexoContenciosoLc227VsTema1113: string;
  ressalvaLegalConselhos: string;
};

/**
 * Simula com exatidão os custos de ITBI e emolumentos de fechamento no Recife em 2026:
 * - Art. 52 da Lei Municipal nº 15.563/1991: 3,0% ordinário -> 1,8% tempestivo (30/90/180 dias) -> 1,0% SFH (teto R$ 1.036.600,71).
 * - Art. 290 da Lei nº 6.015/1973: contrato bancário SFH com força de escritura pública + 50% de redução nos emolumentos sobre o primeiro imóvel residencial financiado.
 */
export function simularOtimizacaoItbiRecife(entrada: EntradaOtimizadorItbiRecife): ResultadoOtimizadorItbiRecife {
  const preco = Math.max(0, entrada.precoImovelReais);
  const r2 = (v: number) => Math.round(v * 100) / 100;

  // Referência compilada do Ato TJPE nº 1.556/2025 (para R$ 650 mil: R$ 16.651,97 escritura+registro à vista; R$ 5.184,82 registro+avaliação SFH)
  const padraoEscReg =
    entrada.emolumentosEscrituraRegistroPadraoReais ?? r2((preco / 650_000) * 16_651.97);
  const padraoRegSfh =
    entrada.emolumentosRegistroSfhDesconto50PctReais ?? r2((preco / 650_000) * 5_184.82);

  const itbi3 = r2(preco * 0.03);
  const semOrientacao3Pct: CenarioTributarioRecife = {
    itbiReais: itbi3,
    aliquotaEfetivaPct: 3.0,
    emolumentosERegistroReais: padraoEscReg,
    totalFechamentoReais: r2(itbi3 + padraoEscReg),
    prazoLegalDias: 30,
  };

  const itbi18 = r2(preco * 0.018);
  const prazo18 = entrada.modalidadePrazo === "parcelado_ou_planta_90d" ? 90 : 30;
  const aVistaTempestivo18Pct: CenarioTributarioRecife = {
    itbiReais: itbi18,
    aliquotaEfetivaPct: 1.8,
    emolumentosERegistroReais: padraoEscReg,
    totalFechamentoReais: r2(itbi18 + padraoEscReg),
    prazoLegalDias: prazo18,
  };

  const economiaAVista = r2(semOrientacao3Pct.totalFechamentoReais - aVistaTempestivo18Pct.totalFechamentoReais);

  let sfhOtimizado: CenarioTributarioRecife | null = null;
  let economiaSfh: number | null = null;

  if (entrada.financiamentoSfh) {
    const pctFin = Math.max(0, Math.min(0.95, entrada.percentualFinanciado ?? 0.8));
    const parcelaFinanciada = Math.min(preco * pctFin, TETO_SFH_RECIFE_2026_REAIS);
    const parcelaEntradaOuExcedente = Math.max(0, preco - parcelaFinanciada);
    const itbiSfh = r2(parcelaFinanciada * 0.01 + parcelaEntradaOuExcedente * 0.018);
    const emolSfh = entrada.primeiroImovelResidencialSfh === false ? r2(padraoRegSfh * 1.45) : padraoRegSfh;
    const totalSfh = r2(itbiSfh + emolSfh);

    sfhOtimizado = {
      itbiReais: itbiSfh,
      aliquotaEfetivaPct: preco > 0 ? r2((itbiSfh / preco) * 100) : 0,
      emolumentosERegistroReais: emolSfh,
      totalFechamentoReais: totalSfh,
      prazoLegalDias: 180,
    };
    economiaSfh = r2(semOrientacao3Pct.totalFechamentoReais - totalSfh);
  }

  return {
    semOrientacao3Pct,
    aVistaTempestivo18Pct,
    sfhOtimizado1Pct: sfhOtimizado,
    melhorCenarioEconomiaReais: economiaSfh !== null ? Math.max(economiaAVista, economiaSfh) : economiaAVista,
    economiaAVistaTempestivoReais: economiaAVista,
    economiaSfhReais: economiaSfh,
    anexoContenciosoLc227VsTema1113:
      "A LC nº 227/2026 (13/01/2026) manteve a incidência do ITBI no registro (Tema 1.124/STF), mas alterou o art. 38 do CTN permitindo estimativa cadastral prévia pelo município — invertendo o ônus da prova na avaliação contraditória frente ao Tema 1.113 do STJ. O histórico de comparáveis ITBI homogeneizados (NBR 14653-2) serve de evidência técnica para impugnação.",
    ressalvaLegalConselhos:
      "Simulação estatística informativa segundo o art. 52 da Lei Municipal nº 15.563/1991 e Ato TJPE nº 1.556/2025; não substitui guia DAM oficial da SEFIN nem cálculo de cartório.",
  };
}
