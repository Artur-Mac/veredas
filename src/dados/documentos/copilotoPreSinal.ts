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
    titulo: "Água e saneamento (transição 23/11/2026)",
    detalhe:
      "Na mudança operacional para a AQUA Pernambuco, eventuais débitos anteriores a 23/11/2026 permanecem retidos na Compesa: peça certidão de quitação nas duas frentes.",
  },
  {
    id: "vistoria_trienal_pe",
    titulo: "Inspeção predial periódica (Lei Estadual PE nº 13.032/2006)",
    detalhe:
      "Edifícios em Pernambuco devem manter vistoria técnica trienal registrada; em prédios entregues há mais de 5 anos, solicite cópia do último relatório ao síndico.",
  },
  {
    id: "cat_spu_90_dias",
    titulo: "Transferência em terreno da União — CAT (90 dias)",
    detalhe:
      "Quando há regime da União, o laudêmio (5% sobre o domínio pleno do terreno × fração ideal) e a emissão da CAT cabem ao vendedor antes da escritura, com validade de 90 dias.",
  },
];

export type ResumoTextoColadoCidadao = {
  classeRotulo: string;
  cnmFormatada: string | null;
  cnmValida: boolean;
  validade30DiasRotulo: string;
  camposReconhecidos: string[];
  camposAusentesNoTrecho: string[];
  onusAtivosResumo: { atoNumero: string; titulo: string; citacao: string }[];
  alertasCondoScanResumo: {
    codigo: AlertaCondoScan["codigo"];
    severidade: AlertaCondoScan["severidade"];
    titulo: string;
    citacao: string;
  }[];
};

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

  return {
    classeRotulo: rotuloClasseDoc(audit.classeDocumental),
    cnmFormatada: audit.cnmEncontrado?.formatado ?? null,
    cnmValida: Boolean(audit.cnmEncontrado?.valido),
    validade30DiasRotulo,
    camposReconhecidos,
    camposAusentesNoTrecho,
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
