import {
  esquemaDecisionProjection,
  type DecisionProjection,
} from "../../nucleo/contratosCanonicos";

/**
 * Filtragem Silenciosa de Opções Superadas (Dominância Estrita Multidimensional).
 * NUNCA exibe a palavra "Pareto" nem notas opacas de 0 a 100 na interface do usuário:
 * coloca os imóveis estritamente piores em preço, espaço, ruído e tempo de deslocamento numa gaveta secundária.
 */

export type CandidatoDecisao = {
  id: string;
  nomeExibicao: string;
  custoMensalTotalReais: number; // menor é melhor
  areaM2: number; // maior é melhor
  deslocamentoMinDia: number; // menor é melhor
  ruidoInternoDb: number; // menor é melhor
  tco10AnosVplReais?: number | null;
};

export type ResultadoDominanciaInvisivel = {
  finalistasVisiveis: CandidatoDecisao[];
  opcoesSuperadas: {
    candidato: CandidatoDecisao;
    superadoPorId: string;
    superadoPorNome: string;
    explicacaoSimplesPtBr: string;
  }[];
  tituloGavetaRecolhida: string;
  projecaoCanonica: DecisionProjection;
};

/** Retorna true se `a` domina `b` (igual ou melhor em todos os 4 critérios e estritamente melhor em pelo menos 1). */
export function dominaEstritamente(a: CandidatoDecisao, b: CandidatoDecisao): boolean {
  const naoPior =
    a.custoMensalTotalReais <= b.custoMensalTotalReais &&
    a.areaM2 >= b.areaM2 &&
    a.deslocamentoMinDia <= b.deslocamentoMinDia &&
    a.ruidoInternoDb <= b.ruidoInternoDb;

  const estritamenteMelhor =
    a.custoMensalTotalReais < b.custoMensalTotalReais ||
    a.areaM2 > b.areaM2 ||
    a.deslocamentoMinDia < b.deslocamentoMinDia ||
    a.ruidoInternoDb < b.ruidoInternoDb;

  return naoPior && estritamenteMelhor;
}

export function filtrarDominanciaInvisivel(
  notebookId: string,
  candidatos: readonly CandidatoDecisao[],
): ResultadoDominanciaInvisivel {
  const finalistas: CandidatoDecisao[] = [];
  const superadas: ResultadoDominanciaInvisivel["opcoesSuperadas"] = [];
  const dominatedMap: DecisionProjection["dominated_map"] = {};
  const tcoMap: DecisionProjection["tco_10y_npv_brl"] = {};
  const negDeltas: DecisionProjection["negotiation_deltas_brl"] = {};
  const alignMatrix: DecisionProjection["partner_alignment_matrix"] = {};

  for (const c of candidatos) {
    tcoMap[c.id] = c.tco10AnosVplReais ?? null;
    negDeltas[c.id] = [];
    alignMatrix[c.id] = {};

    const dominador = candidatos.find((outro) => outro.id !== c.id && dominaEstritamente(outro, c));
    if (dominador) {
      const razao = `${dominador.nomeExibicao} oferece ao menos igual área (${Math.round(dominador.areaM2)} m²) com custo total menor ou igual (R$ ${Math.round(dominador.custoMensalTotalReais)}/mês) e menor deslocamento/ruído.`;
      superadas.push({
        candidato: c,
        superadoPorId: dominador.id,
        superadoPorNome: dominador.nomeExibicao,
        explicacaoSimplesPtBr: razao,
      });
      dominatedMap[c.id] = {
        dominated_by_id: dominador.id,
        reason_pt_br: razao.slice(0, 235),
      };
    } else {
      finalistas.push(c);
    }
  }

  const finalistasSeguros = finalistas.length > 0 ? finalistas : candidatos.slice(0, 1);

  const projecaoCanonica = esquemaDecisionProjection.parse({
    projection_id: `proj-${notebookId}-${candidatos.length}`,
    notebook_id: notebookId,
    candidate_ids: candidatos.map((c) => c.id),
    pareto_frontier_ids: finalistasSeguros.map((c) => c.id),
    dominated_map: dominatedMap,
    tco_10y_npv_brl: tcoMap,
    negotiation_deltas_brl: negDeltas,
    partner_alignment_matrix: alignMatrix,
  });

  const nSup = superadas.length;
  return {
    finalistasVisiveis: finalistasSeguros,
    opcoesSuperadas: superadas,
    tituloGavetaRecolhida:
      nSup > 0
        ? `Ver ${nSup} ${nSup === 1 ? "opção superada" : "opções superadas"} em custo, espaço e deslocamento`
        : "Todas as opções analisadas trazem algum ganho único",
    projecaoCanonica,
  };
}
