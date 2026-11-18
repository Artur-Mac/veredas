import { formatarReais, formatarReaisCompacto } from "../formatos";
import {
  auditarDocumentoVereda,
  validarCnm16,
  type AlertaCondoScan,
  type ClasseDocumentalVereda,
  type EstadoItemPacoteDocumental,
  type OnusMatriculaExtraido,
} from "../../nucleo/documentos/auditorDocumental";

export type RateioReservaResultado = {
  custoObraReais: number;
  saldoReservaReais: number;
  unidades: number;
  deficitTotalReais: number;
  cotaExtraPorUnidadeReais: number;
  cobertoPelaReserva: boolean;
  resumoCurto: string;
};

export const AVISO_LEITURA_INDEPENDENTE =
  "Leitura independente no seu aparelho para orientar perguntas antes do sinal; não substitui certidões oficiais atualizadas nem conferência cartorária.";

export function calcularRateioReserva(params: {
  custoObraReais: number;
  saldoReservaReais: number;
  unidades: number;
}): RateioReservaResultado {
  const custoObra = Math.max(0, Math.round(params.custoObraReais));
  const saldoReserva = Math.max(0, Math.round(params.saldoReservaReais));
  const unidades = Math.max(1, Math.round(params.unidades));
  const deficitTotalReais = Math.max(0, custoObra - saldoReserva);
  const cotaExtraPorUnidadeReais =
    deficitTotalReais > 0 ? Math.round(deficitTotalReais / unidades) : 0;
  const cobertoPelaReserva = deficitTotalReais === 0;

  const resumoCurto = cobertoPelaReserva
    ? `Saldo em caixa cobre a intervenção de ${formatarReaisCompacto(custoObra)} sem chamada extra.`
    : `Faltam ${formatarReaisCompacto(deficitTotalReais)} no caixa: rateio estimado de ~${formatarReais(cotaExtraPorUnidadeReais)} por apartamento (${unidades} unid.).`;

  return {
    custoObraReais: custoObra,
    saldoReservaReais: saldoReserva,
    unidades,
    deficitTotalReais,
    cotaExtraPorUnidadeReais,
    cobertoPelaReserva,
    resumoCurto,
  };
}

export function extrairChaveCnm(texto: string): {
  encontrada: boolean;
  formatada: string | null;
  validaDigito: boolean;
} {
  const match = texto.match(/\b\d{6}\.?\d\.?\d{7}-?\d{2}\b|\b\d{16}\b/);
  if (!match) {
    return { encontrada: false, formatada: null, validaDigito: false };
  }
  const res = validarCnm16(match[0]);
  return {
    encontrada: true,
    formatada: res.formatado,
    validaDigito: res.valido,
  };
}

export function gerarScriptSindico3Perguntas(params: {
  nomeImovel: string;
  anoConstrucao: number | null;
  unidades: number | null;
  spuAtivo: boolean;
}): string {
  const idadeTxt = params.anoConstrucao
    ? ` (edifício de ${params.anoConstrucao})`
    : "";
  const rateioTxt = params.unidades
    ? ` entre ${params.unidades} unidades`
    : "";

  const linhas = [
    `Olá! Antes de avançar com proposta para ${params.nomeImovel}${idadeTxt}, gostaria de confirmar 3 pontos objetivos por escrito:`,
    `1) Fundo de reserva e obras: qual é o saldo atual do fundo de reserva e existem obras ou impermeabilizações previstas em ata para rateio${rateioTxt}?`,
    `2) Inadimplência e processos: qual a inadimplência aproximada do condomínio hoje e há ações trabalhistas ou cíveis com impacto no caixa?`,
    params.spuAtivo
      ? `3) Certidões e terreno da União: a unidade possui certidão negativa condominial, matrícula atualizada (CNM 16 dígitos) e certidão/regime atualizado na União (SPU)?`
      : `3) Certidões e matrícula: a unidade possui declaração negativa de débitos do condomínio e cópia recente da matrícula do cartório (CNM 16 dígitos)?`,
  ];

  return linhas.join("\n");
}

export type ItemPacotePreSinal = {
  id: "matricula" | "ata" | "balancete" | "certidao_condo";
  titulo: string;
  validade: string;
  estadoInicial: EstadoItemPacoteDocumental;
};

export const PACOTE_PRE_SINAL_ITENS: readonly ItemPacotePreSinal[] = [
  {
    id: "matricula",
    titulo: "Matrícula atualizada",
    validade: "Validade 30 dias",
    estadoInicial: "faltando",
  },
  {
    id: "ata",
    titulo: "Última ata de assembleia",
    validade: "Última reunião",
    estadoInicial: "faltando",
  },
  {
    id: "balancete",
    titulo: "Boleto e fundo de reserva",
    validade: "Mês vigente",
    estadoInicial: "faltando",
  },
  {
    id: "certidao_condo",
    titulo: "Declaração negativa do condomínio",
    validade: "Antes da escritura",
    estadoInicial: "faltando",
  },
];

export const ORIENTACAO_CNIB_ONR =
  "Indisponibilidade de bens do vendedor (CNIB / ONR): consulte diretamente no portal oficial onr.org.br; este app não coleta nem consulta CPF.";

export type PrazoReferenciaPreSinal = {
  id: string;
  titulo: string;
  prazo: string;
  origem: string;
};

export const PRAZOS_REFERENCIA_PRE_SINAL: readonly PrazoReferenciaPreSinal[] = [
  {
    id: "matricula_30",
    titulo: "Matrícula de ônus reais",
    prazo: "Até 30 dias da emissão",
    origem: "Cartório de Registro / ONR",
  },
  {
    id: "certidoes_municipais",
    titulo: "Certidões fiscais municipais (IPTU)",
    prazo: "60 a 90 dias conforme emissão",
    origem: "Portal Recife em Dia",
  },
  {
    id: "cndt_tst",
    titulo: "Certidão negativa trabalhista (CNDT)",
    prazo: "180 dias da emissão",
    origem: "Justiça do Trabalho (TST)",
  },
  {
    id: "quitacao_condo",
    titulo: "Declaração de quitação condominial",
    prazo: "Mês vigente antes do sinal",
    origem: "Síndico ou administradora",
  },
];

export type AlertaDiligenciaRecife = {
  id: string;
  titulo: string;
  detalhe: string;
};

export const ALERTAS_DILIGENCIA_RECIFE_2026: readonly AlertaDiligenciaRecife[] = [
  {
    id: "aqua_compesa_2026",
    titulo: "Água e saneamento (mudança marcada para 23/11/2026)",
    detalhe:
      "A partir de 23/11/2026, data marcada pelo Governo de Pernambuco, a distribuição de água passa da Compesa para a concessionária AQUA Pernambuco em cerca de 150 municípios. A Compesa continua produzindo a água. Peça ao vendedor a quitação das contas de água e pergunte à Compesa se há débito em aberto.",
  },
  {
    id: "vistoria_predial_pe",
    titulo: "Vistoria predial periódica (Lei Estadual PE nº 13.032/2006)",
    detalhe:
      "Em Pernambuco, prédio com mais de 5 anos de habite-se deve passar por vistoria técnica a cada 4 anos (até 20 anos de construção) ou a cada 3 anos (mais de 20 anos), com laudo registrado no CREA-PE. Peça ao síndico a cópia do último laudo.",
  },
  {
    id: "cat_spu_90_dias",
    titulo: "Transferência em terreno da União: certidão da SPU (CAT, vale 90 dias)",
    detalhe:
      "Quando o terreno é da União, o vendedor paga o laudêmio (5% do valor do terreno na fração ideal da unidade) antes da escritura, e a SPU emite a Certidão de Autorização para Transferência (CAT), que vale 90 dias.",
  },
];

export type ResumoTextoColadoCidadao = {
  classeRotulo: string;
  cnmFormatada: string | null;
  cnmValida: boolean;
  validade30DiasRotulo: string;
  camposReconhecidos: string[];
  camposAusentesNoTrecho: string[];
  esquemaMatricula6Campos: { id: string; rotulo: string; presente: boolean }[];
  onusAtivosResumo: { atoNumero: string; titulo: string; citacao: string }[];
  alertasCondoScanResumo: {
    codigo: AlertaCondoScan["codigo"];
    severidade: AlertaCondoScan["severidade"];
    titulo: string;
    citacao: string;
  }[];
};

export type ImpedimentoTipadoPreSinal = {
  id: string;
  relacao: "bloqueia" | "depende_de";
  titulo: string;
  impacto: string;
  comoDestravar: string;
};

/**
 * Mapeamento causal determinístico de travas pré-sinal (`bloqueia` vs. `depende_de`,
 * padrão de grafos tipados EnemiesHub + auditoria SPU/ONR).
 */
export function derivarImpedimentosPreSinal(params: {
  spuAtivo: boolean;
  onusAtivos: readonly ResumoTextoColadoCidadao["onusAtivosResumo"][number][];
  alertas: readonly ResumoTextoColadoCidadao["alertasCondoScanResumo"][number][];
  estadosPacote: Record<string, EstadoItemPacoteDocumental>;
}): ImpedimentoTipadoPreSinal[] {
  const lista: ImpedimentoTipadoPreSinal[] = [];
  const temSpuNoTexto = params.onusAtivos.some((o) => /uni[ãa]o|marinha/i.test(o.titulo));
  if (params.spuAtivo || temSpuNoTexto) {
    lista.push({
      id: "spu-uniao",
      relacao: "bloqueia",
      titulo: "Regime de terreno da União (marinha)",
      impacto: "Ocupação sem aforamento impede uso de FGTS na Caixa, e a escritura exige CAT vigente.",
      comoDestravar: "Conferir se é aforamento ou ocupação e exigir o laudêmio pago pelo vendedor e a Certidão de Autorização para Transferência (CAT) da SPU, que vale 90 dias.",
    });
  }

  const temRestricaoForte = params.onusAtivos.some((o) =>
    /penhora|indisponibilidade|inalienabilidade/i.test(o.titulo),
  );
  if (temRestricaoForte) {
    lista.push({
      id: "onus-restricao",
      relacao: "bloqueia",
      titulo: "Restrição judicial ou penhora ativa na matrícula",
      impacto: "Impede transferência livre do imóvel até a baixa averbada.",
      comoDestravar: "Não pagar sinal sem certidão de objeto e pé e averbação de levantamento no cartório.",
    });
  }

  const temGarantiaBancaria = params.onusAtivos.some((o) =>
    /hipoteca|aliena[çc][ãa]o/i.test(o.titulo),
  );
  if (temGarantiaBancaria) {
    lista.push({
      id: "onus-garantia",
      relacao: "depende_de",
      titulo: "Garantia bancária ativa (alienação ou hipoteca)",
      impacto: "A venda depende de quitação concomitante ou interveniente quitante.",
      comoDestravar: "Solicitar saldo devedor atualizado ao banco credor e prever retenção direta no contrato.",
    });
  }

  if (params.estadosPacote.matricula !== "recebido") {
    lista.push({
      id: "matricula-pendente",
      relacao: "depende_de",
      titulo: "Matrícula de ônus reais pendente ou vencida",
      impacto: "Sem certidão emitida há até 30 dias não há confirmação registral de propriedade e gravames.",
      comoDestravar: "Pedir matrícula atualizada (16 dígitos CNM) antes de assinar promessa.",
    });
  }

  const temAlertaFinanceiro = params.alertas.some(
    (a) => a.codigo === "chamada_cota_extra" || a.codigo === "litigio_estrutural_ou_trabalhista",
  );
  if (temAlertaFinanceiro) {
    lista.push({
      id: "condo-rateio-acao",
      relacao: "depende_de",
      titulo: "Cota extra ou ação citada na leitura do condomínio",
      impacto: "A conta mensal após a compra depende do rateio aprovado em assembleia.",
      comoDestravar: "Pedir última ata e declaração de quitação condominial ao síndico antes do sinal.",
    });
  }

  return lista;
}

function rotuloClasseDoc(classe: ClasseDocumentalVereda): string {
  if (classe === "matricula_onr") return "Matrícula do imóvel";
  if (classe === "ata_assembleia") return "Ata de assembleia";
  if (classe === "convencao_condominio") return "Convenção de condomínio";
  if (classe === "balancete_condominial") return "Balancete financeiro";
  if (classe === "laudo_vistoria_art") return "Laudo / Vistoria";
  if (classe === "boleto_condominio_iptu") return "Boleto de condomínio / IPTU";
  return "Trecho livre";
}

function rotuloOnusCidadao(tipo: OnusMatriculaExtraido["tipo"]): string {
  if (tipo === "penhora") return "Penhora registrada";
  if (tipo === "hipoteca") return "Hipoteca ativa";
  if (tipo === "alienacao_fiduciaria") return "Alienação fiduciária";
  if (tipo === "usufruto") return "Usufruto registrado";
  if (tipo === "indisponibilidade") return "Indisponibilidade judicial";
  if (tipo === "clausula_inalienabilidade") return "Cláusula de inalienabilidade";
  return "Terreno da União / marinha";
}

function rotuloCondoScanCidadao(codigo: AlertaCondoScan["codigo"]): string {
  if (codigo === "short_stay_restricao_ou_permissao") return "Curta temporada / Airbnb";
  if (codigo === "regra_pets") return "Regras para animais";
  if (codigo === "vaga_presa_ou_rotativa") return "Vaga presa ou rotativa";
  if (codigo === "chamada_cota_extra") return "Chamada de cota extra";
  if (codigo === "litigio_estrutural_ou_trabalhista") return "Ação judicial ou trabalhista";
  if (codigo === "deficit_contabil") return "Déficit de caixa";
  if (codigo === "inadimplencia_acima_benchmark") return "Inadimplência elevada";
  return "Vistoria ou bombeiros vencidos";
}

export function auditarTextoColadoCidadao(
  texto: string,
  dataEmissaoIso?: string | null,
): ResumoTextoColadoCidadao {
  const limpo = texto.trim();
  if (!limpo) {
    return {
      classeRotulo: "Trecho livre",
      cnmFormatada: null,
      cnmValida: false,
      validade30DiasRotulo: "Sem data informada",
      camposReconhecidos: [],
      camposAusentesNoTrecho: [],
      esquemaMatricula6Campos: [
        { id: "proprietario", rotulo: "Proprietário / titular", presente: false },
        { id: "historico", rotulo: "Histórico de transmissões (R-n)", presente: false },
        { id: "gravames", rotulo: "Gravames e garantias", presente: false },
        { id: "restricoes", rotulo: "Restrições ou usufruto", presente: false },
        { id: "onus_situacao", rotulo: "Situação / certidão de ônus", presente: false },
        { id: "fracao_divida", rotulo: "Fração ideal ou valor de dívida", presente: false },
      ],
      onusAtivosResumo: [],
      alertasCondoScanResumo: [],
    };
  }

  const audit = auditarDocumentoVereda({
    docId: "colado-local",
    paginas: [{ pagina: 1, texto: limpo }],
    dataEmissaoCertidaoIso: dataEmissaoIso ?? null,
    dataReferenciaIso: new Date().toISOString().slice(0, 10),
  });

  const validade30DiasRotulo =
    audit.validadeCertidao30Dias.estado === "recebido"
      ? "Dentro de 30 dias"
      : audit.validadeCertidao30Dias.estado === "vencido"
        ? "Acima de 30 dias (pedir certidão atualizada)"
        : "Sem data informada";

  const camposReconhecidos: string[] = [];
  const camposAusentesNoTrecho: string[] = [];

  if (audit.cnmEncontrado) {
    camposReconhecidos.push("Chave CNM (16 dígitos)");
  } else {
    camposAusentesNoTrecho.push("Chave CNM (16 dígitos)");
  }

  if (dataEmissaoIso || /\b\d{2}\/\d{2}\/\d{4}\b|\b20\d{2}\b/.test(limpo)) {
    camposReconhecidos.push("Data ou ano de referência");
  } else {
    camposAusentesNoTrecho.push("Data de emissão");
  }

  if (
    audit.onusAtivos.length > 0 ||
    audit.alertasCondoScan.length > 0 ||
    /\b(?:R|AV)-?\d+\b|\bassembleia\b|\bfundo de reserva\b/i.test(limpo)
  ) {
    camposReconhecidos.push("Atos R-n / AV-n ou cláusulas de condomínio");
  } else {
    camposAusentesNoTrecho.push("Atos R-n / AV-n ou regras condominiais");
  }

  const esquemaMatricula6Campos: ResumoTextoColadoCidadao["esquemaMatricula6Campos"] = [
    {
      id: "proprietario",
      rotulo: "Proprietário / titular",
      presente: /\b(?:propriet[aá]ri[oa]|titular(?:idade|es)?|adquirente|comprador(?:a)?|vendedor(?:a)?|transmitente)\b/i.test(limpo),
    },
    {
      id: "historico",
      rotulo: "Histórico de transmissões (R-n)",
      presente: /\b(?:R-?\d+|compra e venda|transmiss[aã]o|averba[çc][aã]o|AV-?\d+)\b/i.test(limpo),
    },
    {
      id: "gravames",
      rotulo: "Gravames e garantias",
      presente:
        audit.onusAtivos.some((o) => o.tipo === "hipoteca" || o.tipo === "alienacao_fiduciaria") ||
        /\b(?:hipoteca|aliena[çc][aã]o\s+fiduci[aá]ria|gravame|c[eé]dula)\b/i.test(limpo),
    },
    {
      id: "restricoes",
      rotulo: "Restrições ou usufruto",
      presente:
        audit.onusAtivos.some((o) =>
          ["penhora", "usufruto", "indisponibilidade", "clausula_inalienabilidade"].includes(o.tipo),
        ) || /\b(?:penhora|usufruto|indisponibilidade|inalienabilidade|impenhorabilidade|cl[aá]usula)\b/i.test(limpo),
    },
    {
      id: "onus_situacao",
      rotulo: "Situação / certidão de ônus",
      presente: /\b(?:negativa de [oô]nus|positiva de [oô]nus|livre e desembara[çc]ad[oa]|certid[aã]o\s+de\s+[oô]nus|nada consta)\b/i.test(limpo),
    },
    {
      id: "fracao_divida",
      rotulo: "Fração ideal ou valor de dívida",
      presente: /\b(?:fra[çc][aã]o\s+ideal|saldo\s+devedor|valor\s+da\s+d[ií]vida|R\$\s*\d|0,\d+)\b/i.test(limpo),
    },
  ];

  return {
    classeRotulo: rotuloClasseDoc(audit.classeDocumental),
    cnmFormatada: audit.cnmEncontrado?.formatado ?? null,
    cnmValida: Boolean(audit.cnmEncontrado?.valido),
    validade30DiasRotulo,
    camposReconhecidos,
    camposAusentesNoTrecho,
    esquemaMatricula6Campos,
    onusAtivosResumo: audit.onusAtivos.map((o) => ({
      atoNumero: o.atoNumero,
      titulo: rotuloOnusCidadao(o.tipo),
      citacao: o.citacaoLiteral,
    })),
    alertasCondoScanResumo: audit.alertasCondoScan.map((a) => ({
      codigo: a.codigo,
      severidade: a.severidade,
      titulo: rotuloCondoScanCidadao(a.codigo),
      citacao: a.citacaoLiteral,
    })),
  };
}
