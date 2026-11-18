import type { EpistemicTag } from "../../../nucleo/contratosCanonicos";

/**
 * IND-02, IND-09 & #42 — Triagem Estrutural (Prédios-Caixão), Maresia (ABNT NBR 6118 CAA-III/IV),
 * Relógio de Vida Útil (ABNT NBR 15575-1:2025), Vistoria Trienal (Lei PE 13.032/2006) e
 * Segregação da Lei do Inquilinato (Lei 8.245/1991, Arts. 22 X e 23).
 */

export type ClasseAgressividadeMarinha = "CAA-IV" | "CAA-III" | "CAA-II";

export type NivelRiscoPredioCaixao =
  | "confirmado_acordo_trf5"
  | "suspeita_tipologica_alvenaria"
  | "baixo_indicio_concreto_armado"
  | "nao_sabemos";

export type ItemCicloVup = {
  sistema: string;
  vupMinimaAnos: number;
  vupIntermediariaAnos: number | null;
  vupSuperiorAnos: number | null;
  idadeAtualAnos: number | null;
  anosAteProximoCiclo: number | null;
  emJanelaCritica: boolean;
};

export type EntradaEstruturaCondominio = {
  buildingId: string;
  bairroSlug: string;
  anoConstrucao: number | null;
  anoReferencia?: number;
  pavimentos: number | null;
  /** Coluna 31 do IPTU ("Tipo de Estrutura"): ex. "Alvenaria Autoportante", "Concreto Armado". */
  tipoEstruturaIptu: string | null;
  distanciaCostaOuEstuarioM: number | null;
  emSoloAluvionarOuMangue?: boolean;
  /** Código de identificação oficial presente na lista dos 431 prédios do Acordo-Base 01/2024 TRF5/Seduh. */
  constaAcordoTrf5_431?: boolean;
  faseAcordoTrf5?: "fase_1" | "fase_2_ago_set_2026" | null;
  /** Data da última vistoria técnica com ART/RRT (Lei PE 13.032/2006), se informada em documentos. */
  ultimaVistoriaTrienalAno?: number | null;
  ultimaReformaFachadaAno?: number | null;
  saldoFundoReservaReais?: number | null;
  orcamentoEstimadoObraReais?: number | null;
  inadimplenciaCondominialPct?: number | null;
  unidadesCondominio?: number | null;
  /** Passivos ou itens extras em boleto para checagem de Lei 8.245/91 (locação) e STJ propter rem (compra). */
  itensBoleto?: { descricao: string; valorReais: number; categoria: "ordinaria" | "fundo_reserva" | "obra_estrutural" | "pintura_externa_desgaste" }[];
};

export type ResultadoEstruturaCondominio = {
  indicadorCotaExtra: "IND-02";
  indicadorPredioCaixao: "IND-09";
  classeAgressividade: ClasseAgressividadeMarinha;
  riscoPredioCaixao: NivelRiscoPredioCaixao;
  bloqueioSeguroECreditoProvavel: boolean;
  indenizacaoReferenciaTrf5TetoReais: number | null;
  vistoriaTrienalLei13032: {
    obrigatoria: boolean;
    estado: "em_dia" | "vencida_ou_ausente" | "nao_sabemos";
    proximaVistoriaAteAno: number | null;
  };
  matrizVupNbr15575: ItemCicloVup[];
  sistemasEmJanelaCritica: string[];
  choqueCotaExtraEstimadoPorUnidadeReais: number | null;
  alertaInadimplenciaNordestePct: number;
  inadimplenciaCondominioPct: number;
  alertaPropterRemStj: string;
  segregacaoLei8245: {
    totalOrdinarioInquilinoReais: number;
    totalExtraordinarioLocadorReais: number;
    itensCobrancaAbusivaNoBoleto: { descricao: string; valorReais: number; artigoLegal: string }[];
  };
  epistemicTag: EpistemicTag;
  limiteEpistemologico: string;
};

export const BENCHMARK_CONDO_PE_REAIS = 910.0;
export const INADIMPLENCIA_NE_1S2026_PCT = 12.71;
const INDENIZACAO_TETO_TRF5_REAIS = 120_000;

export function classificarMaresiaNbr6118(distanciaCostaM: number | null): ClasseAgressividadeMarinha {
  if (distanciaCostaM === null) return "CAA-III";
  if (distanciaCostaM <= 150) return "CAA-IV"; // Respingos de maré / linha de frente
  if (distanciaCostaM <= 1000) return "CAA-III"; // Névoa salina marinha até 1 km
  return "CAA-II";
}

export function triarPredioCaixao(entrada: Pick<
  EntradaEstruturaCondominio,
  "constaAcordoTrf5_431" | "tipoEstruturaIptu" | "pavimentos" | "anoConstrucao" | "emSoloAluvionarOuMangue"
>): { risco: NivelRiscoPredioCaixao; epistemic: EpistemicTag; bloqueio: boolean } {
  if (entrada.constaAcordoTrf5_431) {
    return { risco: "confirmado_acordo_trf5", epistemic: "registro_oficial", bloqueio: true };
  }

  const est = (entrada.tipoEstruturaIptu ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const ehAlvenariaAutoportante = /alvenaria\s*(autoportante|estrutural|resistente|portante)|caixao/.test(est);
  const ehConcreto = /concreto\s*armado|metalica|aco|mista/.test(est);
  const ate4Andares = entrada.pavimentos !== null && entrada.pavimentos <= 4;
  const periodoCritico = entrada.anoConstrucao !== null && entrada.anoConstrucao <= 2005;

  if (ehAlvenariaAutoportante || (ate4Andares && periodoCritico && !ehConcreto && entrada.emSoloAluvionarOuMangue)) {
    return { risco: "suspeita_tipologica_alvenaria", epistemic: "inferencia", bloqueio: true };
  }

  if (ehConcreto || (entrada.pavimentos !== null && entrada.pavimentos >= 6)) {
    return { risco: "baixo_indicio_concreto_armado", epistemic: "inferencia", bloqueio: false };
  }

  return { risco: "nao_sabemos", epistemic: "nao_sabemos", bloqueio: false };
}

export function avaliarEstruturaECondominio(entrada: EntradaEstruturaCondominio): ResultadoEstruturaCondominio {
  const anoAtual = entrada.anoReferencia ?? 2026;
  const idade = entrada.anoConstrucao !== null ? Math.max(0, anoAtual - entrada.anoConstrucao) : null;
  const classeAgressividade = classificarMaresiaNbr6118(entrada.distanciaCostaOuEstuarioM);

  const caixao = triarPredioCaixao(entrada);

  // Vistoria Trienal Lei PE 13.032/2006 (Decreto 33.747/2009)
  let estadoVistoria: "em_dia" | "vencida_ou_ausente" | "nao_sabemos" = "nao_sabemos";
  let proximaVistoria: number | null = null;
  if (typeof entrada.ultimaVistoriaTrienalAno === "number") {
    proximaVistoria = entrada.ultimaVistoriaTrienalAno + 3;
    estadoVistoria = anoAtual <= proximaVistoria ? "em_dia" : "vencida_ou_ausente";
  } else if (idade !== null && idade >= 3) {
    estadoVistoria = "vencida_ou_ausente";
  }

  // Relógio de Vida Útil ABNT NBR 15575-1:2025 (Tabela 7 + Anexo C)
  const anosDesdeFachada =
    entrada.ultimaReformaFachadaAno !== undefined && entrada.ultimaReformaFachadaAno !== null
      ? Math.max(0, anoAtual - entrada.ultimaReformaFachadaAno)
      : idade;

  // Em CAA-IV/III, ciclo curto de selantes/pintura sofre aceleração de cloretos se manutenção atrasa.
  const cicloCurtoAnos = classeAgressividade === "CAA-IV" ? 4 : 5;

  const matrizVupNbr15575: ItemCicloVup[] = [
    {
      sistema: "Estrutura principal",
      vupMinimaAnos: 50,
      vupIntermediariaAnos: 63,
      vupSuperiorAnos: 75,
      idadeAtualAnos: idade,
      anosAteProximoCiclo: idade !== null ? Math.max(0, 50 - idade) : null,
      emJanelaCritica: idade !== null && idade >= 45,
    },
    {
      sistema: "Vedação vertical externa (fachada global — Tab. 7)",
      vupMinimaAnos: 40,
      vupIntermediariaAnos: 50,
      vupSuperiorAnos: 60,
      idadeAtualAnos: idade,
      anosAteProximoCiclo: idade !== null ? Math.max(0, 40 - idade) : null,
      emJanelaCritica: idade !== null && idade >= 35,
    },
    {
      sistema: "Coberta, impermeabilização e hidrossanitário (manuteníveis)",
      vupMinimaAnos: 20,
      vupIntermediariaAnos: 25,
      vupSuperiorAnos: 30,
      idadeAtualAnos: idade,
      anosAteProximoCiclo: idade !== null ? (20 - (idade % 20)) % 20 : null,
      emJanelaCritica: idade !== null && idade >= 18 && (idade % 20 >= 17 || idade % 20 === 0),
    },
    {
      sistema: "Pisos internos",
      vupMinimaAnos: 13,
      vupIntermediariaAnos: 17,
      vupSuperiorAnos: 20,
      idadeAtualAnos: idade,
      anosAteProximoCiclo: idade !== null ? Math.max(0, 13 - (idade % 13)) : null,
      emJanelaCritica: false,
    },
    {
      sistema: "Juntas de movimentação, selantes e pintura externa (Anexo C)",
      vupMinimaAnos: cicloCurtoAnos,
      vupIntermediariaAnos: null,
      vupSuperiorAnos: null,
      idadeAtualAnos: anosDesdeFachada,
      anosAteProximoCiclo:
        anosDesdeFachada !== null
          ? anosDesdeFachada >= cicloCurtoAnos
            ? 0
            : cicloCurtoAnos - anosDesdeFachada
          : null,
      emJanelaCritica: anosDesdeFachada !== null && anosDesdeFachada >= cicloCurtoAnos,
    },
  ];

  const sistemasEmJanelaCritica = matrizVupNbr15575.filter((i) => i.emJanelaCritica).map((i) => i.sistema);

  // Estimativa de choque de cota extra por unidade: (orçamento pendente - saldo reserva) / unidades pagantes
  const inadimplencia = entrada.inadimplenciaCondominialPct ?? INADIMPLENCIA_NE_1S2026_PCT;
  let choquePorUnidade: number | null = null;
  if (
    typeof entrada.orcamentoEstimadoObraReais === "number" &&
    typeof entrada.unidadesCondominio === "number" &&
    entrada.unidadesCondominio > 0
  ) {
    const reserva = Math.max(0, entrada.saldoFundoReservaReais ?? 0);
    const deficit = Math.max(0, entrada.orcamentoEstimadoObraReais - reserva);
    const fatorInadimplencia = 1 / Math.max(0.5, 1 - inadimplencia / 100);
    choquePorUnidade = Math.round((deficit / entrada.unidadesCondominio) * fatorInadimplencia * 100) / 100;
  }

  // Segregação da Lei do Inquilinato (Lei 8.245/1991, Arts. 22 X vs. 23)
  let totalOrdinario = 0;
  let totalExtraordinario = 0;
  const abusivos: { descricao: string; valorReais: number; artigoLegal: string }[] = [];

  for (const item of entrada.itensBoleto ?? []) {
    if (item.categoria === "ordinaria") {
      totalOrdinario += item.valorReais;
    } else {
      totalExtraordinario += item.valorReais;
      const artigo =
        item.categoria === "fundo_reserva"
          ? "Art. 22, inciso X, alínea 'g' da Lei nº 8.245/1991 (constituição de fundo de reserva compete ao locador)"
          : "Art. 22, inciso X, alínea 'a' da Lei nº 8.245/1991 (reformas estruturais e pintura de fachada por desgaste natural competem ao locador)";
      abusivos.push({ descricao: item.descricao, valorReais: item.valorReais, artigoLegal: artigo });
    }
  }

  return {
    indicadorCotaExtra: "IND-02",
    indicadorPredioCaixao: "IND-09",
    classeAgressividade,
    riscoPredioCaixao: caixao.risco,
    bloqueioSeguroECreditoProvavel: caixao.bloqueio,
    indenizacaoReferenciaTrf5TetoReais: caixao.risco === "confirmado_acordo_trf5" ? INDENIZACAO_TETO_TRF5_REAIS : null,
    vistoriaTrienalLei13032: {
      obrigatoria: true,
      estado: estadoVistoria,
      proximaVistoriaAteAno: proximaVistoria,
    },
    matrizVupNbr15575,
    sistemasEmJanelaCritica,
    choqueCotaExtraEstimadoPorUnidadeReais: choquePorUnidade,
    alertaInadimplenciaNordestePct: INADIMPLENCIA_NE_1S2026_PCT,
    inadimplenciaCondominioPct: inadimplencia,
    alertaPropterRemStj:
      "Dívidas condominiais têm natureza propter rem (STJ REsp 2.147.665 e REsp 1.910.280): quem figura na matrícula responde pelos débitos do prédio. Exija certidão negativa de débitos condominiais antes do sinal.",
    segregacaoLei8245: {
      totalOrdinarioInquilinoReais: Math.round(totalOrdinario * 100) / 100,
      totalExtraordinarioLocadorReais: Math.round(totalExtraordinario * 100) / 100,
      itensCobrancaAbusivaNoBoleto: abusivos,
    },
    epistemicTag: caixao.epistemic === "registro_oficial" ? "registro_oficial" : idade !== null ? "inferencia" : "nao_sabemos",
    limiteEpistemologico:
      "A ausência nas listas do Acordo TRF5 (431 edifícios) e o relógio VUP não substituem vistoria presencial com ART/RRT (Lei PE nº 13.032/2006).",
  };
}
