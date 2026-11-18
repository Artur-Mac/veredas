import type { EpistemicTag } from "../contratosCanonicos";

/**
 * IND-06 — Desviesamento de Zeladoria 156 por PU-Learning (Expectation-Maximization)
 * Base metodológica: Boxer, Hong, Kontokosta & Neill (2025).
 * Separa a probabilidade real de ocorrência urbana (\theta_i \in [0, 1]) da propensão
 * socioeconômica de reportar ao canal 156 (p_report_i), garantindo que áreas de menor
 * renda ou menor taxa de reporte nunca sejam falsamente exibidas como "sem problemas".
 */

export type ObservacaoZeladoria156 = {
  id: string;
  observadoPositivo156: boolean; // s_i = 1 se há chamado registrado, 0 caso não-rotulado (unlabeled)
  rendaMedianaSm: number;
  escolaridadeSuperiorPct: number; // 0..100
  coberturaInternetPct: number; // 0..100
  /** Variáveis estruturais físicas independentes da propensão de reportar (densidade arbórea, pontos alagamento, vias). */
  sinaisFisicos: {
    proximidadeCanalOuDrenagemScore: number; // 0..1
    desnivelTopograficoScore: number; // 0..1
    deficienciaIluminacaoVistoriada: number; // 0..1
  };
};

export type ResultadoZeladoriaPu = {
  indicadorId: "IND-06";
  itens: {
    id: string;
    observado156: boolean;
    propensaoReporteEstimada: number;
    riscoLatenteCorrigidoTheta: number;
    rotuloZeladoria: "incidencia_confirmada_156" | "subnotificacao_provavel" | "baixa_evidencia_monitorar";
  }[];
  elboPorIteracao: number[];
  iteracoesConvergidas: number;
  epistemicTag: EpistemicTag;
  limiteEpistemologico: string;
};

function sigmoid(x: number): number {
  const c = Math.max(-25, Math.min(25, x));
  return 1 / (1 + Math.exp(-c));
}

/** Propensão socioeconômica inicial a reportar no 156 (prior calibrado, truncado em [0.08, 0.96]). */
export function estimarPropensaoReporteInicial(obs: ObservacaoZeladoria156): number {
  const z =
    -1.2 +
    0.18 * Math.min(10, Math.max(0, obs.rendaMedianaSm)) +
    0.015 * Math.min(100, Math.max(0, obs.escolaridadeSuperiorPct)) +
    0.012 * Math.min(100, Math.max(0, obs.coberturaInternetPct));
  return Math.max(0.08, Math.min(0.96, sigmoid(z)));
}

export function ajustarZeladoriaPuLearningEm(
  observacoes: readonly ObservacaoZeladoria156[],
  opts: { maxIteracoes?: number; tolerancia?: number } = {},
): ResultadoZeladoriaPu {
  const maxIter = opts.maxIteracoes ?? 25;
  const tol = opts.tolerancia ?? 1e-6;
  const n = observacoes.length;

  if (n === 0) {
    return {
      indicadorId: "IND-06",
      itens: [],
      elboPorIteracao: [],
      iteracoesConvergidas: 0,
      epistemicTag: "nao_sabemos",
      limiteEpistemologico: "Sem observações de entrada para inferência PU-Learning.",
    };
  }

  // Parâmetros de risco latente (\beta_0..3) e multiplicador global de propensão (\alpha)
  let beta = [-1.4, 1.3, 1.1, 0.9];
  const pBase = observacoes.map(estimarPropensaoReporteInicial);
  let escalaProp = 1.0;

  const features = observacoes.map((o) => [
    1.0,
    o.sinaisFisicos.proximidadeCanalOuDrenagemScore,
    o.sinaisFisicos.desnivelTopograficoScore,
    o.sinaisFisicos.deficienciaIluminacaoVistoriada,
  ]);

  let theta = observacoes.map((_, i) =>
    sigmoid(beta[0]! + beta[1]! * features[i]![1]! + beta[2]! * features[i]![2]! + beta[3]! * features[i]![3]!),
  );

  const elboHist: number[] = [];

  const computarLogLikObservado = (th: number[], esc: number) => {
    let ll = 0;
    for (let i = 0; i < n; i += 1) {
      const c_i = Math.max(0.05, Math.min(0.97, pBase[i]! * esc));
      const pObs = Math.max(1e-9, Math.min(1 - 1e-9, th[i]! * c_i));
      ll += observacoes[i]!.observadoPositivo156 ? Math.log(pObs) : Math.log(1 - pObs);
    }
    return Math.round(ll * 1e6) / 1e6;
  };

  elboHist.push(computarLogLikObservado(theta, escalaProp));

  for (let it = 0; it < maxIter; it += 1) {
    // Passo E: posterior E[y_i = 1 | s_i, x_i]
    const resp = new Array<number>(n);
    for (let i = 0; i < n; i += 1) {
      if (observacoes[i]!.observadoPositivo156) {
        resp[i] = 1.0;
      } else {
        const c_i = Math.max(0.05, Math.min(0.97, pBase[i]! * escalaProp));
        const th = theta[i]!;
        const num = th * (1 - c_i);
        const den = num + (1 - th);
        resp[i] = den > 1e-12 ? num / den : 0;
      }
    }

    // Passo M1: atualiza escala global de propensão de reporte mantendo monotonicidade por busca de passo
    let somaObs = 0;
    let somaEsp = 0;
    for (let i = 0; i < n; i += 1) {
      if (observacoes[i]!.observadoPositivo156) somaObs += 1;
      somaEsp += resp[i]! * pBase[i]!;
    }
    const candidatoEscala = somaEsp > 1e-9 ? Math.max(0.4, Math.min(1.3, somaObs / somaEsp)) : escalaProp;

    // Passo M2: um passo de gradiente regularizado L2 para log-verossimilhança ponderada por resp[i]
    const grad = [0, 0, 0, 0];
    const hessDiag = [1e-4, 1e-4, 1e-4, 1e-4];
    for (let i = 0; i < n; i += 1) {
      const th = theta[i]!;
      const err = resp[i]! - th;
      const w = Math.max(1e-4, th * (1 - th));
      for (let k = 0; k < 4; k += 1) {
        grad[k]! += err * features[i]![k]!;
        hessDiag[k]! += w * features[i]![k]! * features[i]![k]!;
      }
    }
    for (let k = 0; k < 4; k += 1) {
      grad[k]! -= 0.05 * beta[k]!;
      hessDiag[k]! += 0.05;
    }

    let aceitou = false;
    for (const step of [1.0, 0.5, 0.25, 0.1, 0.0]) {
      const candBeta = beta.map((b, k) => b + step * (grad[k]! / hessDiag[k]!));
      const candTheta = observacoes.map((_, i) =>
        sigmoid(
          candBeta[0]! +
            candBeta[1]! * features[i]![1]! +
            candBeta[2]! * features[i]![2]! +
            candBeta[3]! * features[i]![3]!,
        ),
      );
      const llCand = computarLogLikObservado(candTheta, step > 0 ? candidatoEscala : escalaProp);
      if (llCand >= elboHist[elboHist.length - 1]! - 1e-7) {
        beta = candBeta;
        theta = candTheta;
        if (step > 0) escalaProp = candidatoEscala;
        elboHist.push(llCand);
        aceitou = true;
        break;
      }
    }

    if (!aceitou) break;
    const prev = elboHist[elboHist.length - 2]!;
    const curr = elboHist[elboHist.length - 1]!;
    if (Math.abs(curr - prev) < tol) break;
  }

  const itens = observacoes.map((o, i) => {
    const c_i = Math.round(Math.max(0.05, Math.min(0.97, pBase[i]! * escalaProp)) * 1000) / 1000;
    const th = Math.round(theta[i]! * 1000) / 1000;
    let rotuloZeladoria: ResultadoZeladoriaPu["itens"][number]["rotuloZeladoria"] = "baixa_evidencia_monitorar";
    if (o.observadoPositivo156) rotuloZeladoria = "incidencia_confirmada_156";
    else if (th >= 0.45 && c_i < 0.5) rotuloZeladoria = "subnotificacao_provavel";

    return {
      id: o.id,
      observado156: o.observadoPositivo156,
      propensaoReporteEstimada: c_i,
      riscoLatenteCorrigidoTheta: th,
      rotuloZeladoria,
    };
  });

  return {
    indicadorId: "IND-06",
    itens,
    elboPorIteracao: elboHist,
    iteracoesConvergidas: elboHist.length - 1,
    epistemicTag: "inferencia",
    limiteEpistemologico:
      "Probabilidade corrigida por PU-Learning indica risco latente em zonas de baixa propensão de reporte ao 156; não equivale a protocolo municipal aberto.",
  };
}
