import type { EpistemicTag } from "../../nucleo/contratosCanonicos";

/**
 * Fusão metodologicamente rigorosa do Censo Demográfico 2022 (IBGE):
 * - Entorno dos Domicílios (5.637 setores no Recife): os arquivos públicos (.csv/.gpkg) são agregados por
 *   setor censitário (10 quesitos percentuais), nunca por face de quadra isolada.
 * - CNEFE 2022 (737.511 registros): coordenadas pontuais exatas e espécie do endereço.
 *
 * O VEREDA usa pontos exatos do CNEFE + cadastro EMLURB como `registro_oficial` quando existem na face da quadra,
 * e aplica os percentuais do setor do Entorno apenas como PRIOR espacial (`inferencia`) onde falta cadastro direto.
 */

export const QUESITOS_ENTORNO_IBGE = [
  "pavimentacao",
  "iluminacao",
  "bueiro",
  "calcada",
  "obstaculo_calcada",
  "rampa_cadeirante",
  "arborizacao",
  "via_bicicleta",
  "ponto_onibus",
  "coleta_lixo",
] as const;

export type QuesitoEntorno = (typeof QUESITOS_ENTORNO_IBGE)[number];

export type SetorEntornoPercentuais = {
  codigoSetor: string;
  domiciliosSetor: number | null;
  /** Percentual [0, 1] de domicílios no setor com a característica; null se suprimido ("X"). */
  percentuais: Partial<Record<QuesitoEntorno, number | null>>;
};

export type EvidenciaPontualAresta = {
  bueirosEmlurbQtd?: number;
  postesIluminacaoAtivosQtd?: number;
  calcadaRequalificada?: boolean;
  viaSinalizadaBicicleta?: boolean;
  paradasGtfsQtd?: number;
  arvoresTombadasQtd?: number;
  estabelecimentosCnefeQtd?: number;
};

export type SinalEntornoFundido = {
  quesito: QuesitoEntorno;
  presentePontual: boolean | null;
  priorSetorialPct: number | null;
  epistemicTag: EpistemicTag;
  origemExplicacao: string;
};

function proporcao(contagem: number | null | undefined, total: number | null | undefined): number | null {
  if (contagem === null || contagem === undefined || total === null || total === undefined || total <= 0) return null;
  return Math.max(0, Math.min(1, Math.round((contagem / total) * 1000) / 1000));
}

export function normalizarPercentuaisSetor(bruto: {
  codigo: string;
  domicilios: number | null;
  contagens: Partial<Record<QuesitoEntorno, number | null>>;
}): SetorEntornoPercentuais {
  const percentuais: Partial<Record<QuesitoEntorno, number | null>> = {};
  for (const q of QUESITOS_ENTORNO_IBGE) {
    percentuais[q] = proporcao(bruto.contagens[q], bruto.domicilios);
  }
  return {
    codigoSetor: bruto.codigo,
    domiciliosSetor: bruto.domicilios,
    percentuais,
  };
}

/**
 * Funde cadastro pontual direto (EMLURB/CNEFE/GTFS) com o prior percentual do setor (IBGE Entorno 2022).
 * Se houver evidência pontual direta na quadra/aresta, marca `registro_oficial`; caso contrário, usa o
 * prior do setor estritamente como `inferencia`, ou `nao_sabemos` se ambos estiverem ausentes.
 */
export function fundirEntornoComPriorCenso(
  evidencia: EvidenciaPontualAresta,
  setor: SetorEntornoPercentuais | null,
): Record<QuesitoEntorno, SinalEntornoFundido> {
  const pontualDe = (q: QuesitoEntorno): boolean | null => {
    switch (q) {
      case "bueiro":
        return evidencia.bueirosEmlurbQtd !== undefined ? evidencia.bueirosEmlurbQtd > 0 : null;
      case "iluminacao":
        return evidencia.postesIluminacaoAtivosQtd !== undefined ? evidencia.postesIluminacaoAtivosQtd > 0 : null;
      case "calcada":
        return evidencia.calcadaRequalificada ?? null;
      case "via_bicicleta":
        return evidencia.viaSinalizadaBicicleta ?? null;
      case "ponto_onibus":
        return evidencia.paradasGtfsQtd !== undefined ? evidencia.paradasGtfsQtd > 0 : null;
      case "arborizacao":
        return evidencia.arvoresTombadasQtd !== undefined && evidencia.arvoresTombadasQtd > 0 ? true : null;
      default:
        return null;
    }
  };

  const saida = {} as Record<QuesitoEntorno, SinalEntornoFundido>;
  for (const q of QUESITOS_ENTORNO_IBGE) {
    const pontual = pontualDe(q);
    const prior = setor?.percentuais[q] ?? null;
    let epistemicTag: EpistemicTag = "nao_sabemos";
    let origemExplicacao = "Sem cadastro municipal direto nem dado setorial do Censo 2022.";

    if (pontual !== null) {
      epistemicTag = "registro_oficial";
      origemExplicacao = "Cadastro pontual direto na face da quadra (EMLURB / GTFS / CNEFE).";
    } else if (prior !== null) {
      epistemicTag = "inferencia";
      origemExplicacao = `Prior espacial do setor censitário IBGE Censo 2022 (${Math.round(prior * 100)}% dos domicílios).`;
    }

    saida[q] = {
      quesito: q,
      presentePontual: pontual,
      priorSetorialPct: prior,
      epistemicTag,
      origemExplicacao,
    };
  }
  return saida;
}
