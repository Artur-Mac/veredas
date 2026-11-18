import type { EpistemicTag } from "../contratosCanonicos";

/**
 * IND-04 & #15 — Motor Acústico 3D por Andar e Fachada, PEZR SBRF (RBAC 161),
 * Isolamento de Dormitório ABNT NBR 15575-4, Lei Municipal nº 16.243/1996 e NSDI.
 *
 * REGRAS DE ENGENHARIA E PRIVACIDADE (P3):
 * - Ruído rodoviário/boate: sofre atenuação geométrica 3D pela altura do andar e
 *   atenuação por difração (-8 a -12 dB(A)) na fachada de fundos.
 * - Ruído aeronáutico (PEZR SBRF): ZERO atenuação por altura ou fachada de fundos.
 * - Corte normativo julho/2013 (NBR 15575-4): 65 dB(A) externos viram 47,2 dB(A)
 *   em dormitório pré-norma (~17,8 dB isolamento) vs 32,2 dB(A) em esquadria superior (~32,8 dB).
 * - Decibelímetro na visita opera exclusivamente em memória calculando SPL dB(A),
 *   com `gravacaoAudioBrutoPermitida: false` (zero armazenamento/transmissão de voz).
 *
 * 18/11/2026 (decisões A1, A2 e A3): `avaliarAcustica3d` está APOSENTADA para as telas. Ela parte de uma via escolhida
 * à mão (`tipologiaVia`, `distanciaViaM`) e de uma curva de avião informada (`curvaPezrAeroportoDb`); nenhuma tela a
 * chama mais. O ruído de cada prédio sai do modelo estimado (src/dados/ruido), que usa daqui a soma em energia com o
 * avião sem atenuação (`somarComOAviao`), a janela pela NBR 15575-4 (`resolverIsolamentoD2mnTw`) e o fecho
 * (`fecharResultadoAcustico`). A função continua só para os testes do motor.
 */

export type TipologiaVia = "arterial_principal" | "coletora" | "local";
export type ClasseIsolamentoNbr15575 = "Superior" | "Intermediaria" | "Minima" | "PreNorma2013";

export type EntradaAcustica3D = {
  andar: number;
  fachadaVoltadaParaVia: "frente" | "fundos" | "lateral";
  tipologiaVia: TipologiaVia;
  distanciaViaM: number;
  anoConstrucao: number | null;
  classeIsolamentoDeclarada?: ClasseIsolamentoNbr15575;
  curvaPezrAeroportoDb?: number | null; // Ex.: 65, 70, 75 em PEZR SBRF
  distanciaFonteLuseM?: number | null; // bares / casas de show / templos a até 150 m
  precoImovelReais?: number | null;
};

export type ResultadoAcustica3D = {
  indicadorId: "IND-04";
  ruidoExternoViaDbA: number;
  ruidoExternoAeronavePezrDb: number;
  ruidoExternoCombinadoDbA: number;
  atenuacaoAlturaViaDb: number;
  atenuacaoFachadaFundosDb: number;
  isolamentoFachadaD2mnTwDb: number;
  ruidoInternoDormitorioDbA: number;
  atendeLimiteNoturnoLei16243_50Db: boolean;
  descontoHedonicoNelsonNsdiPct: number;
  descontoHedonicoEstimadoReais: number | null;
  agendaPiorHoraVisita: string[];
  privacidadeAudio: {
    gravacaoAudioBrutoPermitida: false;
    modoOperacao: "integracao_spl_em_memoria";
  };
  epistemicTag: EpistemicTag;
  limiteEpistemologico: string;
  /**
   * Nota de sossego 0–10 do modelo de ruído estimado (src/dados/ruido), quando o resultado veio dele. Quem mostra nota
   * usa esta; sem ela (motor aposentado, só em teste) vale a conta antiga de cada cartão.
   */
  notaSossego0a10?: number;
};

const RUÍDO_BASE_VIA_DB: Record<TipologiaVia, number> = {
  arterial_principal: 74.0,
  coletora: 66.0,
  local: 55.0,
};

export function somaLogaritmicaDb(niveis: number[]): number {
  let somaEnergia = 0;
  for (const l of niveis) {
    if (Number.isFinite(l) && l > 0) somaEnergia += Math.pow(10, l / 10);
  }
  return somaEnergia > 0 ? Math.round(10 * Math.log10(somaEnergia) * 10) / 10 : 0;
}

/**
 * Soma o que vem do chão com o avião. O som que vem de cima não é atenuado pelo andar nem pela fachada dos fundos: a
 * curva do avião entra inteira, em energia. É a única conta de avião do app (decisão A3).
 */
export function somarComOAviao(nivelDoChaoDbA: number, nivelDoAviaoDbA: number | null | undefined): number {
  return typeof nivelDoAviaoDbA === "number" && nivelDoAviaoDbA > 0 ? somaLogaritmicaDb([nivelDoChaoDbA, nivelDoAviaoDbA]) : nivelDoChaoDbA;
}

export function resolverIsolamentoD2mnTw(
  anoConstrucao: number | null,
  classeDeclarada?: ClasseIsolamentoNbr15575,
): number {
  if (classeDeclarada === "Superior") return 32.8; // Classe S (>30 dB)
  if (classeDeclarada === "Intermediaria") return 27.0; // Classe I (25-29 dB)
  if (classeDeclarada === "Minima") return 22.0; // Classe M (20-24 dB)
  if (classeDeclarada === "PreNorma2013") return 17.8;
  if (anoConstrucao !== null && anoConstrucao < 2013) return 17.8;
  return 27.0;
}

export function avaliarAcustica3d(entrada: EntradaAcustica3D): ResultadoAcustica3D {
  const zM = Math.max(0, entrada.andar) * 3.0;
  const dHoriz = Math.max(4, entrada.distanciaViaM);
  const dSlant = Math.sqrt(dHoriz * dHoriz + zM * zM);

  // Atenuação geométrica linear/ponto suavizada pela elevação do andar (3D)
  const atenuacaoAltura = Math.max(0, Math.round(12 * Math.log10(dSlant / dHoriz) * 10) / 10);
  const atenuacaoFundos =
    entrada.fachadaVoltadaParaVia === "fundos"
      ? 10.0
      : entrada.fachadaVoltadaParaVia === "lateral"
        ? 5.0
        : 0;

  let nivelVia = Math.max(42, RUÍDO_BASE_VIA_DB[entrada.tipologiaVia] - atenuacaoAltura - atenuacaoFundos);

  // Contribuição LUSE (lazer noturno) até 150 m
  const niveisSolo: number[] = [nivelVia];
  if (typeof entrada.distanciaFonteLuseM === "number" && entrada.distanciaFonteLuseM <= 150) {
    const dLuse = Math.max(10, Math.sqrt(entrada.distanciaFonteLuseM ** 2 + zM ** 2));
    const nivelLuse = Math.max(45, 76 - 16 * Math.log10(dLuse / 10) - atenuacaoFundos * 0.7);
    niveisSolo.push(nivelLuse);
  }

  nivelVia = somaLogaritmicaDb(niveisSolo);

  // PEZR SBRF (RBAC 161): ruído de sobrevoo NÃO é atenuado por andar alto nem por fundos
  const nivelPezr =
    typeof entrada.curvaPezrAeroportoDb === "number" && entrada.curvaPezrAeroportoDb > 0
      ? entrada.curvaPezrAeroportoDb
      : 0;

  return fecharResultadoAcustico({
    nivelDoChaoDbA: nivelVia,
    nivelDoAviaoDbA: nivelPezr,
    atenuacaoAlturaViaDb: atenuacaoAltura,
    atenuacaoFachadaFundosDb: atenuacaoFundos,
    isolamentoD2mnTwDb: resolverIsolamentoD2mnTw(entrada.anoConstrucao, entrada.classeIsolamentoDeclarada),
    precoImovelReais: entrada.precoImovelReais,
    viaMovimentada: entrada.tipologiaVia === "arterial_principal" || entrada.tipologiaVia === "coletora",
    somNoturnoPerto: typeof entrada.distanciaFonteLuseM === "number" && entrada.distanciaFonteLuseM <= 150,
    epistemicTag: nivelPezr > 0 ? "registro_oficial" : "inferencia",
  });
}

/**
 * O fecho comum do motor antigo e do modelo estimado (src/dados/ruido): chão + avião em energia, janela fechada,
 * desconto hedônico e a agenda da visita. Quem chama já traz o nível do chão na janela (andar e fachada aplicados).
 */
export function fecharResultadoAcustico(p: {
  nivelDoChaoDbA: number;
  nivelDoAviaoDbA: number;
  atenuacaoAlturaViaDb: number;
  atenuacaoFachadaFundosDb: number;
  isolamentoD2mnTwDb: number;
  precoImovelReais?: number | null;
  viaMovimentada: boolean;
  somNoturnoPerto: boolean;
  epistemicTag: EpistemicTag;
  limiteEpistemologico?: string;
  notaSossego0a10?: number;
}): ResultadoAcustica3D {
  const nivelVia = p.nivelDoChaoDbA;
  const nivelPezr = p.nivelDoAviaoDbA > 0 ? p.nivelDoAviaoDbA : 0;
  const nivelExternoCombinado = somarComOAviao(nivelVia, nivelPezr);
  const d2mnTw = p.isolamentoD2mnTwDb;
  const ruidoInterno = Math.round((nivelExternoCombinado - d2mnTw) * 10) / 10;

  // Nelson (NSDI): -0,58% no valor por dB(A) acima do limiar de 55 dB(A)
  const excessoNsdi = Math.max(0, nivelExternoCombinado - 55);
  const descontoPct = Math.round(excessoNsdi * 0.58 * 100) / 100;
  const descontoReais =
    typeof p.precoImovelReais === "number" && p.precoImovelReais > 0
      ? Math.round((p.precoImovelReais * descontoPct) / 100)
      : null;

  const agenda: string[] = [];
  if (p.viaMovimentada) {
    agenda.push("Dia útil entre 17h30 e 19h15 (pico de tráfego e buzinas na via)");
  }
  if (p.somNoturnoPerto) {
    agenda.push("Sexta ou sábado entre 22h30 e 00h30 (teste real de som de bares/eventos LUSE)");
  }
  if (nivelPezr >= 60) {
    agenda.push("Janelas de aproximação/decolagem SBRF: 07h00–09h00 ou 19h00–21h30");
  }
  if (agenda.length === 0) {
    agenda.push("Noite de dia útil após 22h00 para checar ruído de fundo residencial");
  }

  return {
    indicadorId: "IND-04",
    ruidoExternoViaDbA: Math.round(nivelVia * 10) / 10,
    ruidoExternoAeronavePezrDb: nivelPezr,
    ruidoExternoCombinadoDbA: nivelExternoCombinado,
    atenuacaoAlturaViaDb: p.atenuacaoAlturaViaDb,
    atenuacaoFachadaFundosDb: p.atenuacaoFachadaFundosDb,
    isolamentoFachadaD2mnTwDb: d2mnTw,
    ruidoInternoDormitorioDbA: ruidoInterno,
    atendeLimiteNoturnoLei16243_50Db: nivelVia <= 50 || ruidoInterno <= 40,
    descontoHedonicoNelsonNsdiPct: descontoPct,
    descontoHedonicoEstimadoReais: descontoReais,
    agendaPiorHoraVisita: agenda,
    privacidadeAudio: {
      gravacaoAudioBrutoPermitida: false,
      modoOperacao: "integracao_spl_em_memoria",
    },
    epistemicTag: p.epistemicTag,
    limiteEpistemologico:
      p.limiteEpistemologico ??
      "Estimativa acústica 3D por geometria e marco temporal (2013); vedação real da esquadria instalada exige medição pontual no dormitório.",
    ...(typeof p.notaSossego0a10 === "number" ? { notaSossego0a10: p.notaSossego0a10 } : {}),
  };
}
