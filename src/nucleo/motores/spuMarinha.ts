import type { EpistemicTag } from "../contratosCanonicos";

/**
 * IND-01 & #37 — Motor Legal de Terrenos de Marinha (SPU) e Elegibilidade FGTS.
 * Base legal: Decreto-Lei nº 9.760/1946, art. 101 (foro de 0,6%); Decreto-Lei nº 2.398/1987, arts. 1º e 3º (taxa de
 * ocupação de 2% e laudêmio de 5%, redação das Leis nº 13.139/2015, nº 13.240/2015 e nº 13.465/2017);
 * Lei nº 14.011/2020 (Remição de Foro / Conversão); Lei nº 14.474/2022 (teto do reajuste anual: 10,06% só no exercício
 * de 2022; daí em diante, no máximo 2× o IPCA do ano anterior) e normativo da Caixa Econômica Federal (bloqueio FGTS em Ocupação).
 *
 * REGRA DECISIVA: Laudêmio (5%), Ocupação (2%/ano), Foro (0,6%/ano), Conversão (83%) e
 * Remição (17%) incidem EXCLUSIVAMENTE sobre o valor atualizado do domínio pleno do terreno,
 * EXCLUÍDAS AS BENFEITORIAS, multiplicado pela fração ideal da unidade.
 */

export type RegimeSpu = "ocupacao" | "aforamento" | "alodial" | "nao_sabemos";

export type EntradaSpu = {
  regime: RegimeSpu;
  valorDominioPlenoTerrenoReais: number | null;
  fracaoIdeal: number | null; // ex.: 0.02 para 2,0%
  /** Preço pedido do imóvel (usado apenas para exibir o impacto relativo / comparar com erro clássico). */
  precoImovelReais?: number | null;
  /** Em faixa de LPM 1831 / LLTM 33 m conforme Geoportal SPU 5.2 / hidrografia oficial. */
  emPoligonalMarinha?: boolean;
  /** Possui Portaria Autorizativa ativa no SPUApp (reduz rito ordinário de até 180 dias). */
  portariaAutorizativaAtiva?: boolean | null;
  /** IPCA do ano anterior em fração (ex.: 0.045 para 4,5%), para o teto de reajuste da Lei 14.474/2022. Sem ele, o teto fica nulo. */
  ipcaAnual?: number;
};

export type ResultadoSpu = {
  indicadorId: "IND-01";
  regime: RegimeSpu;
  emPoligonalMarinha: boolean;
  baseTerrenoUnidadeReais: number | null;
  laudemio5PctVendedorReais: number | null;
  taxaOcupacaoAnual2PctReais: number | null;
  taxaOcupacaoMensalReais: number | null;
  foroAnual06PctReais: number | null;
  foroMensalReais: number | null;
  encargoPatrimonialAnualVigenteReais: number | null;
  encargoPatrimonialMensalVigenteReais: number | null;
  custoConversao83PctReais: number | null;
  custoRemicaoForo17PctReais: number | null;
  /** Teto do reajuste anual da cobrança (2× o IPCA do ano anterior), em %; null quando o IPCA não foi informado. */
  tetoReajusteAnualPct: number | null;
  elegivelFgtsCaixa: boolean | null;
  bloqueioFgtsMotivo: string | null;
  prazoOrdinarioSpuDias: number | null;
  catValidadeDias: 90;
  pec3EmTramitacaoSenado: true;
  epistemicTag: EpistemicTag;
  limiteEpistemologico: string;
};

/**
 * Teto do reajuste anual da cobrança da SPU (Lei nº 14.474/2022, art. 6º, e art. 11-B, § 8º-A, da Lei nº 9.636/1998):
 * no máximo 2 vezes o IPCA do ano anterior. Os 10,06% valeram só para o exercício de 2022 e saíram da conta em
 * 19/11/2026: até então o código usava o maior entre 10,06% e 2× IPCA, o que a lei não diz.
 */
export function calcularTetoReajusteSpu(ipcaAnoAnterior: number): number {
  return Math.round(Math.max(0, 2 * ipcaAnoAnterior) * 10000) / 10000;
}

export function calcularSpuEstatutario(entrada: EntradaSpu): ResultadoSpu {
  const emMarinha = entrada.emPoligonalMarinha ?? (entrada.regime === "ocupacao" || entrada.regime === "aforamento");
  // Sem o IPCA do ano anterior não há teto para mostrar: o app não supõe um IPCA.
  const tetoReajusteAnualPct =
    typeof entrada.ipcaAnual === "number" && Number.isFinite(entrada.ipcaAnual)
      ? Math.round(calcularTetoReajusteSpu(entrada.ipcaAnual) * 10000) / 100
      : null;

  if (entrada.regime === "alodial") {
    return {
      indicadorId: "IND-01",
      regime: "alodial",
      emPoligonalMarinha: emMarinha,
      baseTerrenoUnidadeReais: null,
      laudemio5PctVendedorReais: 0,
      taxaOcupacaoAnual2PctReais: 0,
      taxaOcupacaoMensalReais: 0,
      foroAnual06PctReais: 0,
      foroMensalReais: 0,
      encargoPatrimonialAnualVigenteReais: 0,
      encargoPatrimonialMensalVigenteReais: 0,
      custoConversao83PctReais: 0,
      custoRemicaoForo17PctReais: 0,
      tetoReajusteAnualPct,
      elegivelFgtsCaixa: true,
      bloqueioFgtsMotivo: null,
      prazoOrdinarioSpuDias: null,
      catValidadeDias: 90,
      pec3EmTramitacaoSenado: true,
      epistemicTag: "registro_oficial",
      limiteEpistemologico:
        "Imóvel alodial não sofre cobrança patrimonial da SPU. Confirme ausência de averbação residual de marinha na matrícula.",
    };
  }

  const terrenoValido =
    typeof entrada.valorDominioPlenoTerrenoReais === "number" &&
    Number.isFinite(entrada.valorDominioPlenoTerrenoReais) &&
    entrada.valorDominioPlenoTerrenoReais > 0;
  const fracaoValida =
    typeof entrada.fracaoIdeal === "number" &&
    Number.isFinite(entrada.fracaoIdeal) &&
    entrada.fracaoIdeal > 0 &&
    entrada.fracaoIdeal <= 1;

  const baseTerreno =
    terrenoValido && fracaoValida
      ? Math.round(entrada.valorDominioPlenoTerrenoReais! * entrada.fracaoIdeal! * 100) / 100
      : null;

  const r2 = (v: number | null) => (v === null ? null : Math.round(v * 100) / 100);

  const laudemio = baseTerreno !== null ? r2(baseTerreno * 0.05) : null;
  const occAnual = baseTerreno !== null ? r2(baseTerreno * 0.02) : null;
  const occMensal = occAnual !== null ? r2(occAnual / 12) : null;
  const foroAnual = baseTerreno !== null ? r2(baseTerreno * 0.006) : null;
  const foroMensal = foroAnual !== null ? r2(foroAnual / 12) : null;
  const conversao83 = baseTerreno !== null ? r2(baseTerreno * 0.83) : null;
  const remicao17 = baseTerreno !== null ? r2(baseTerreno * 0.17) : null;

  const vigenteAnual =
    entrada.regime === "ocupacao" ? occAnual : entrada.regime === "aforamento" ? foroAnual : null;
  const vigenteMensal =
    entrada.regime === "ocupacao" ? occMensal : entrada.regime === "aforamento" ? foroMensal : null;

  const elegivelFgts =
    entrada.regime === "ocupacao" ? false : entrada.regime === "aforamento" ? true : null;

  const bloqueioFgtsMotivo =
    entrada.regime === "ocupacao"
      ? "Caixa Econômica Federal bloqueia o uso do FGTS em imóveis sob regime de ocupação na SPU por ausência de direito real."
      : null;

  const epistemicTag: EpistemicTag =
    entrada.regime === "nao_sabemos" || baseTerreno === null ? "nao_sabemos" : "registro_oficial";

  return {
    indicadorId: "IND-01",
    regime: entrada.regime,
    emPoligonalMarinha: emMarinha,
    baseTerrenoUnidadeReais: baseTerreno,
    laudemio5PctVendedorReais: laudemio,
    taxaOcupacaoAnual2PctReais: occAnual,
    taxaOcupacaoMensalReais: occMensal,
    foroAnual06PctReais: foroAnual,
    foroMensalReais: foroMensal,
    encargoPatrimonialAnualVigenteReais: vigenteAnual,
    encargoPatrimonialMensalVigenteReais: vigenteMensal,
    custoConversao83PctReais: conversao83,
    custoRemicaoForo17PctReais: remicao17,
    tetoReajusteAnualPct,
    elegivelFgtsCaixa: elegivelFgts,
    bloqueioFgtsMotivo,
    prazoOrdinarioSpuDias: entrada.portariaAutorizativaAtiva ? 30 : 180,
    catValidadeDias: 90,
    pec3EmTramitacaoSenado: true,
    epistemicTag,
    limiteEpistemologico:
      "Polígono SPU e cálculo sobre terreno não substituem certidão individual por RIP na SPU nem a Certidão de Autorização para Transferência (CAT), que a SPU emite para a venda e vale 90 dias.",
  };
}
