import type { EpistemicTag } from "../../../nucleo/contratosCanonicos";

/**
 * IND-08 & #39 — Motor de Resiliência de Redes: Água (Tapacurá + Transição AQUA PE 23/11/2026),
 * Energia (ANEEL DEC/FEC por conjunto elétrico Neoenergia PE) e Telecom (5G 3,5 GHz Anatel + checklist na visita).
 */

export const DATA_ASSUNCAO_AQUA_PERNAMBUCO = "2026-11-23";

export type EntradaResilienciaRedes = {
  bairroSlug: string;
  atendidoSistemaTapacura?: boolean;
  unidadesCondominio: number | null;
  volumeCisternaLitros?: number | null;
  volumeCaixaSuperiorLitros?: number | null;
  moradoresMediosPorUnidade?: number;
  conjuntoEletricoCodId?: string | null;
  decHorasAno?: number | null;
  fecInterrupcoesAno?: number | null;
  temGeradorElevadorBomba?: boolean | null;
  distanciaErb5g3500MhzM?: number | null;
  andar?: number | null;
};

export type ResultadoResilienciaRedes = {
  indicadorId: "IND-08";
  hidrico: {
    autonomiaReservaDias: number | null;
    vulnerabilidadeRodizioTapacura: boolean;
    concessionariaDistribuicaoVigente: "Compesa" | "AQUA Pernambuco (Acciona + BRK)";
    dataMarcoTransicao: string;
    alertaDividaAnterior23Nov2026: string;
    epistemicTag: EpistemicTag;
  };
  eletrico: {
    conjuntoCodId: string | null;
    decHorasAno: number | null;
    fecInterrupcoesAno: number | null;
    mitigadoPorGerador: boolean | null;
    riscoInterrupcaoSemGerador: "alto" | "moderado" | "nao_sabemos";
    epistemicTag: EpistemicTag;
  };
  telecom: {
    distanciaErb5gM: number | null;
    coberturaEstimada5g: "forte_urbana" | "media_verificar_comodos" | "baixa_risco_sombra" | "nao_sabemos";
    roteiroTesteVisitaComodos: string[];
    epistemicTag: EpistemicTag;
  };
  limiteEpistemologico: string;
};

export function avaliarResilienciaRedes(
  entrada: EntradaResilienciaRedes,
  dataReferenciaIso = "2026-11-24",
): ResultadoResilienciaRedes {
  const moradoresUnid = entrada.moradoresMediosPorUnidade ?? 2.6;
  const consumoDiaLitrosUnid = moradoresUnid * 165; // ~165 L/hab/dia referência ABNT/SNIS Recife

  const volTotalLitros = (entrada.volumeCisternaLitros ?? 0) + (entrada.volumeCaixaSuperiorLitros ?? 0);
  let autonomiaDias: number | null = null;
  if (volTotalLitros > 0 && typeof entrada.unidadesCondominio === "number" && entrada.unidadesCondominio > 0) {
    autonomiaDias = Math.round((volTotalLitros / (entrada.unidadesCondominio * consumoDiaLitrosUnid)) * 100) / 100;
  }

  const posTransicaoAqua = dataReferenciaIso >= DATA_ASSUNCAO_AQUA_PERNAMBUCO;

  const dec = entrada.decHorasAno ?? null;
  const temGerador = entrada.temGeradorElevadorBomba ?? null;
  let riscoEletrico: "alto" | "moderado" | "nao_sabemos" = "nao_sabemos";
  if (dec !== null) {
    riscoEletrico = dec >= 12 && temGerador !== true ? "alto" : "moderado";
  }

  let cov5g: ResultadoResilienciaRedes["telecom"]["coberturaEstimada5g"] = "nao_sabemos";
  if (typeof entrada.distanciaErb5g3500MhzM === "number") {
    if (entrada.distanciaErb5g3500MhzM <= 450) cov5g = "forte_urbana";
    else if (entrada.distanciaErb5g3500MhzM <= 1100) cov5g = "media_verificar_comodos";
    else cov5g = "baixa_risco_sombra";
  }

  return {
    indicadorId: "IND-08",
    hidrico: {
      autonomiaReservaDias: autonomiaDias,
      vulnerabilidadeRodizioTapacura: entrada.atendidoSistemaTapacura ?? true,
      concessionariaDistribuicaoVigente: posTransicaoAqua
        ? "AQUA Pernambuco (Acciona + BRK)"
        : "Compesa",
      dataMarcoTransicao: DATA_ASSUNCAO_AQUA_PERNAMBUCO,
      alertaDividaAnterior23Nov2026:
        "A AQUA Pernambuco assume em 23/11/2026 a distribuição comercial em 151 municípios; captação/produção (Sistema Tapacurá) e cobrança de débitos anteriores a 23/11/2026 permanecem sob responsabilidade da Compesa (PPP de esgoto na RMR mantida). Exija quitação das duas origens se houver hidrômetro individual.",
      epistemicTag: autonomiaDias !== null ? "declarado" : "nao_sabemos",
    },
    eletrico: {
      conjuntoCodId: entrada.conjuntoEletricoCodId ?? null,
      decHorasAno: dec,
      fecInterrupcoesAno: entrada.fecInterrupcoesAno ?? null,
      mitigadoPorGerador: temGerador,
      riscoInterrupcaoSemGerador: riscoEletrico,
      epistemicTag: dec !== null ? "registro_oficial" : "nao_sabemos",
    },
    telecom: {
      distanciaErb5gM: entrada.distanciaErb5g3500MhzM ?? null,
      coberturaEstimada5g: cov5g,
      roteiroTesteVisitaComodos: [
        "Medir sinal de dados móveis no quarto de fundo e na suíte com a porta fechada",
        "Testar sinal no escritório/sala e confirmar posição de entrada de fibra óptica na caixa VDI",
        "Confirmar com zeladoria se há mais de uma operadora de fibra atendendo o shaft do prédio",
      ],
      epistemicTag: cov5g === "nao_sabemos" ? "nao_sabemos" : "inferencia",
    },
    limiteEpistemologico:
      "Volume real de cisterna e existência de gerador (elevadores/bomba) precisam de confirmação em visita ou ata; indicadores DEC/FEC medem o conjunto elétrico da ANEEL.",
  };
}
