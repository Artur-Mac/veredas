import type { EpistemicTag } from "../../../nucleo/contratosCanonicos";

/**
 * IND-02, IND-09 & #42 — Triagem Estrutural (Prédios-Caixão), Maresia (ABNT NBR 6118 CAA-III/IV),
 * Relógio de Vida Útil (ABNT NBR 15575-1:2025), Vistoria Predial Periódica (Lei PE 13.032/2006) e
 * Segregação da Lei do Inquilinato (Lei 8.245/1991, art. 22, X e parágrafo único, e art. 23).
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
  /** Prédio presente na lista dos 431 do Acordo-Base nº 01/2024, homologado pelo TRF5 em 19/06/2024. */
  constaAcordoTrf5_431?: boolean;
  faseAcordoTrf5?: "fase_1" | "fase_2_ago_set_2026" | null;
  /** Ano da última vistoria técnica com ART/RRT (Lei PE 13.032/2006), se informado em documentos. */
  ultimaVistoriaAno?: number | null;
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
  vistoriaPeriodicaLei13032: {
    /** Exigida de prédio com mais de 5 anos de habite-se (art. 4º); null sem o ano de construção. */
    obrigatoria: boolean | null;
    /** 4 anos até 20 anos de construção, 3 anos depois (art. 3º); null sem o ano de construção. */
    intervaloAnos: 3 | 4 | null;
    estado: EstadoDaVistoriaPredial;
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

export type EstadoDaVistoriaPredial = "em_dia" | "vencida_ou_ausente" | "ainda_nao_exigida" | "nao_sabemos";

/** Prédio com mais de 5 anos de habite-se precisa da vistoria (Lei PE nº 13.032/2006, art. 4º). */
export const VISTORIA_PE_CARENCIA_ANOS = 5;
/** Até 20 anos de construção, a vistoria é a cada 4 anos; depois, a cada 3 (art. 3º, I, na redação da Lei 17.882/2022). */
export const VISTORIA_PE_IDADE_DO_INTERVALO_MENOR_ANOS = 20;

/**
 * Vistoria predial periódica em Pernambuco: Lei Estadual nº 13.032, de 14/06/2006, arts. 3º a 5º, com a redação da Lei
 * 17.882/2022, regulamentada pelo Decreto nº 33.747/2009. A cada 4 anos em prédio residencial ou condominial com até 20
 * anos de construção e a cada 3 anos em prédio com mais de 20 anos; exigida de prédio com mais de 5 anos de habite-se;
 * laudo registrado no CREA-PE com ART. A palavra "trienal" era da redação de 2006.
 * O app não tem a data do habite-se: usa o ano de construção do cadastro no lugar dela.
 */
export function regraDaVistoriaPredialPe(idadeAnos: number | null): { exigida: boolean | null; intervaloAnos: 3 | 4 | null } {
  if (idadeAnos === null || !Number.isFinite(idadeAnos)) return { exigida: null, intervaloAnos: null };
  return {
    exigida: idadeAnos > VISTORIA_PE_CARENCIA_ANOS,
    intervaloAnos: idadeAnos > VISTORIA_PE_IDADE_DO_INTERVALO_MENOR_ANOS ? 3 : 4,
  };
}

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

  // Vistoria predial periódica (Lei PE 13.032/2006; Decreto 33.747/2009): 4 anos até 20 anos de construção, 3 depois.
  const regraVistoria = regraDaVistoriaPredialPe(idade);
  let estadoVistoria: EstadoDaVistoriaPredial = "nao_sabemos";
  let proximaVistoria: number | null = null;
  if (typeof entrada.ultimaVistoriaAno === "number") {
    if (regraVistoria.intervaloAnos !== null) {
      proximaVistoria = entrada.ultimaVistoriaAno + regraVistoria.intervaloAnos;
      estadoVistoria = anoAtual <= proximaVistoria ? "em_dia" : "vencida_ou_ausente";
    } else {
      // Sem a idade do prédio, só vale o que os dois intervalos dizem igual: até 3 anos está em dia, mais de 4 venceu.
      const anosDesdeAVistoria = anoAtual - entrada.ultimaVistoriaAno;
      estadoVistoria = anosDesdeAVistoria <= 3 ? "em_dia" : anosDesdeAVistoria > 4 ? "vencida_ou_ausente" : "nao_sabemos";
    }
  } else if (regraVistoria.exigida === true) {
    // Sem vistoria informada, só se cobra de prédio com mais de 5 anos (art. 4º).
    estadoVistoria = "vencida_ou_ausente";
  } else if (regraVistoria.exigida === false) {
    estadoVistoria = "ainda_nao_exigida";
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

  // Segregação da Lei do Inquilinato (Lei 8.245/1991, art. 22, X vs. art. 23). As alíneas são do parágrafo único do
  // art. 22 (o inciso X não tem alíneas): a, obra que interessa à estrutura; b, pintura de fachada; g, fundo de reserva.
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
          ? "Art. 22, X e parágrafo único, alínea 'g', da Lei nº 8.245/1991 (fundo de reserva é despesa extraordinária, paga pelo locador)"
          : "Art. 22, X e parágrafo único, alíneas 'a' e 'b', da Lei nº 8.245/1991 (obra que interessa à estrutura e pintura de fachada são despesas extraordinárias, pagas pelo locador)";
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
    vistoriaPeriodicaLei13032: {
      obrigatoria: regraVistoria.exigida,
      intervaloAnos: regraVistoria.intervaloAnos,
      estado: estadoVistoria,
      proximaVistoriaAteAno: proximaVistoria,
    },
    matrizVupNbr15575,
    sistemasEmJanelaCritica,
    choqueCotaExtraEstimadoPorUnidadeReais: choquePorUnidade,
    alertaInadimplenciaNordestePct: INADIMPLENCIA_NE_1S2026_PCT,
    inadimplenciaCondominioPct: inadimplencia,
    alertaPropterRemStj:
      "Dívida de condomínio acompanha o imóvel (STJ, REsp 1.910.280, Segunda Seção, 2025): quem figura na matrícula responde pelos débitos da unidade. Exija certidão negativa de débitos condominiais antes do sinal.",
    segregacaoLei8245: {
      totalOrdinarioInquilinoReais: Math.round(totalOrdinario * 100) / 100,
      totalExtraordinarioLocadorReais: Math.round(totalExtraordinario * 100) / 100,
      itensCobrancaAbusivaNoBoleto: abusivos,
    },
    epistemicTag: caixao.epistemic === "registro_oficial" ? "registro_oficial" : idade !== null ? "inferencia" : "nao_sabemos",
    limiteEpistemologico:
      "Não estar na lista dos 431 prédios do Acordo-Base nº 01/2024 e o relógio de vida útil não substituem vistoria presencial com ART/RRT (Lei PE nº 13.032/2006).",
  };
}
