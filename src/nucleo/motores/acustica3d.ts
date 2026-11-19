import type { EpistemicTag } from "../contratosCanonicos";
import { notaDeSossego } from "../../dados/ruido/modelo";

/**
 * IND-04 & #15 — Motor Acústico 3D por Andar e Fachada, isolamento de dormitório (ABNT NBR 15575-4) e NSDI.
 * A conferência de leis de 18/11/2026 (docs/aplicacao/unificacao-2026-11-19/leis-conferidas.md) tirou daqui duas
 * citações: a Lei municipal 16.243/1996 não fixa 50 dB à noite (o art. 51 diz 70 dB(A) de dia e 60 à noite, para som
 * de atividades) e o RBAC 161 da ANAC não pode ser citado enquanto o app não usar as curvas oficiais. A referência de
 * 50 dB(A) à noite é a da ABNT NBR 10151 para área residencial: norma técnica, não lei municipal.
 *
 * REGRAS DE ENGENHARIA E PRIVACIDADE (P3):
 * - Ruído rodoviário/boate: sofre atenuação geométrica 3D pela altura do andar e
 *   atenuação por difração (-8 a -12 dB(A)) na fachada de fundos.
 * - Ruído de avião: ZERO atenuação por altura ou fachada de fundos (o som vem de cima).
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
  curvaPezrAeroportoDb?: number | null; // nível do avião informado à mão (só no motor aposentado)
  distanciaFonteLuseM?: number | null; // bares / casas de show / templos a até 150 m
  precoImovelReais?: number | null;
};

export type ResultadoAcustica3D = {
  indicadorId: "IND-04";
  /** A pista do aeroporto ao lado não entra na estimativa: os números são um piso (src/dados/ruido/ponte.ts). */
  pisoSemAPistaDoAeroporto?: boolean;
  /** O avião é a primeira das fontes que mais pesam na ficha do prédio (src/dados/ruido/ponte.ts). */
  aviaoEAFontePrincipal?: boolean;
  ruidoExternoViaDbA: number;
  ruidoExternoAeronavePezrDb: number;
  ruidoExternoCombinadoDbA: number;
  atenuacaoAlturaViaDb: number;
  atenuacaoFachadaFundosDb: number;
  isolamentoFachadaD2mnTwDb: number;
  ruidoInternoDormitorioDbA: number;
  /** Fora, à noite, até 50 dB(A) (referência da NBR 10151 para área residencial) ou, no quarto, até 40. */
  atendeReferenciaNoturnaNbr10151: boolean;
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
   * Nota de sossego 0–10, a única do app: a escala do modelo de ruído estimado (48 dB(A) ou menos = 10; 86 ou mais = 0)
   * sobre o nível de fora. Vinda do modelo (src/dados/ruido), é a da noite na janela; no motor aposentado, a do nível
   * combinado. Placar, pulso da quadra, "Sossego à noite por fonte" e Comparar mostram esta.
   */
  notaSossego0a10: number;
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
  // NBR 15575-4, D2m,nT,w da fachada dos dormitórios na classe de ruído I (a mais baixa): mínimo 20 dB, intermediário
  // 25, superior 30. Nas classes II e III os mínimos são maiores (até 30, 35 e 40). Conferido em fontes secundárias em
  // 18/11/2026 (manual ProAcústica, ANTAC), sem o texto pago da ABNT. Sem classe declarada, vale o MÍNIMO (antes era o
  // intermediário, sem prova). Antes de 2013 a norma não vale: 17,8 dB é suposição do Vereda, e a tela diz isso.
  if (classeDeclarada === "Superior") return 30.0;
  if (classeDeclarada === "Intermediaria") return 25.0;
  if (classeDeclarada === "Minima") return 20.0;
  if (classeDeclarada === "PreNorma2013") return 17.8;
  if (anoConstrucao !== null && anoConstrucao < 2013) return 17.8;
  return 20.0;
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

  // Ruído de sobrevoo NÃO é atenuado por andar alto nem por fundos
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
    agenda.push("Horários de mais pousos e decolagens no aeroporto: 07h00–09h00 ou 19h00–21h30");
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
    atendeReferenciaNoturnaNbr10151: nivelExternoCombinado <= 50, // do lado de fora e com o avião (revisão de 19/11/2026: antes valia pelo quarto com janela fechada e contradizia a comparação com a NBR na mesma tela)
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
    notaSossego0a10: p.notaSossego0a10 ?? notaDeSossego(nivelExternoCombinado),
  };
}
