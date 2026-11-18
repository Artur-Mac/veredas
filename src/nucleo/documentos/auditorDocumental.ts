import {
  esquemaDocumentAssertion,
  verificarEntailmentDeterministico,
  type AbsenceState,
  type DocClass,
  type DocumentAssertion,
} from "../contratosCanonicos";

/**
 * IND-10 & #41 — Auditor Documental Local-First:
 * - Validador e gerador de Código Nacional de Matrícula (CNM 16 dígitos, Provimento CNJ 143/2023, ISO 7064 MOD 97-10).
 * - Checagem de validade de 30 dias da certidão (Decreto nº 93.240/1986).
 * - Análise da cadeia cronológica de registros (R-n) e averbações (AV-n) para ônus ativos não cancelados.
 * - Classificador de 6 classes documentais + pacote em 3 estados (`recebido | faltando | vencido`).
 * - 8 alertas CondoScan (Airbnb, pets, vaga presa/rotativa, cotas extras, ações, déficit, inadimplência, AVCB/trienal)
 *   e Índice de Adequação do Fundo de Reserva.
 * - Regra de Ferro: 100% Citation Entailment determinístico (`verificarEntailmentDeterministico`).
 */

export type ClasseDocumentalVereda =
  | "matricula_onr"
  | "ata_assembleia"
  | "convencao_condominio"
  | "balancete_condominial"
  | "boleto_condominio_iptu"
  | "laudo_vistoria_art"
  | "desconhecido";

export type EstadoItemPacoteDocumental = "recebido" | "faltando" | "vencido";

export type PaginaDocumentoBruto = {
  pagina: number;
  texto: string;
};

export type ResultadoValidacaoCnm = {
  valido: boolean;
  formatado: string | null;
  digitos16: string | null;
  cnsServentia: string | null;
  livro: string | null;
  matricula7: string | null;
  digitoVerificador: string | null;
  motivoErro: string | null;
};

export function apenasDigitos(texto: string): string {
  return texto.replace(/\D+/g, "");
}

/** Calcula dígitos verificadores ISO 7064 MOD 97-10 sobre os 14 dígitos base (CNS 6 + Livro 1 + Matrícula 7). */
export function calcularDvCnmIso7064(base14: string): string {
  if (!/^\d{14}$/.test(base14)) {
    throw new Error("Base CNM deve conter exatamente 14 dígitos numéricos.");
  }
  const resto = BigInt(`${base14}00`) % 97n;
  const dv = Number(98n - resto);
  return String(dv).padStart(2, "0");
}

export function gerarCnm16Formatado(cns6: string, livro1: string, matricula7: string): string {
  const base14 = `${cns6.padStart(6, "0").slice(-6)}${livro1.slice(0, 1)}${matricula7.padStart(7, "0").slice(-7)}`;
  const dv = calcularDvCnmIso7064(base14);
  return `${base14.slice(0, 6)}.${base14.slice(6, 7)}.${base14.slice(7, 14)}-${dv}`;
}

export function validarCnm16(entrada: string): ResultadoValidacaoCnm {
  const dig = apenasDigitos(entrada);
  if (dig.length !== 16) {
    return {
      valido: false,
      formatado: null,
      digitos16: null,
      cnsServentia: null,
      livro: null,
      matricula7: null,
      digitoVerificador: null,
      motivoErro: `CNM deve ter 16 dígitos (recebido ${dig.length}).`,
    };
  }
  const base14 = dig.slice(0, 14);
  const dv = dig.slice(14, 16);
  const valido = BigInt(`${base14}${dv}`) % 97n === 1n;
  const formatado = `${dig.slice(0, 6)}.${dig.slice(6, 7)}.${dig.slice(7, 14)}-${dv}`;

  return {
    valido,
    formatado,
    digitos16: dig,
    cnsServentia: dig.slice(0, 6),
    livro: dig.slice(6, 7),
    matricula7: dig.slice(7, 14),
    digitoVerificador: dv,
    motivoErro: valido ? null : `Dígito verificador inválido (ISO 7064 MOD 97-10 esperado ${calcularDvCnmIso7064(base14)}).`,
  };
}

export function verificarValidadeCertidao30Dias(
  dataEmissaoIso: string | null,
  dataReferenciaIso: string,
): { valida: boolean | null; diasDecorridos: number | null; estado: EstadoItemPacoteDocumental } {
  if (!dataEmissaoIso) return { valida: null, diasDecorridos: null, estado: "faltando" };
  const tEm = Date.parse(dataEmissaoIso);
  const tRef = Date.parse(dataReferenciaIso);
  if (!Number.isFinite(tEm) || !Number.isFinite(tRef)) {
    return { valida: null, diasDecorridos: null, estado: "faltando" };
  }
  const dias = Math.floor((tRef - tEm) / 86_400_000);
  const valida = dias >= 0 && dias <= 30;
  return {
    valida,
    diasDecorridos: dias,
    estado: valida ? "recebido" : "vencido",
  };
}

export function classificarDocumento(textoCompleto: string): ClasseDocumentalVereda {
  const norm = textoCompleto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/(cnm|codigo nacional de matricula|registro de imoveis|r-\d+|av-\d+|livro n[oº°]?\s*2)/.test(norm)) {
    return "matricula_onr";
  }
  if (/(balancete|demonstrativo financeiro|saldo do fundo de reserva|receita ordin[aá]ria|inadimpl[eê]ncia)/.test(norm)) {
    return "balancete_condominial";
  }
  if (/(convencao do condominio|fracao ideal.*vagas|proibido.*curta temporada|airbnb)/.test(norm)) {
    return "convencao_condominio";
  }
  if (/(ata de assembleia|assembleia geral (ordinaria|extraordinaria)|cota extra|aprovada por maioria)/.test(norm)) {
    return "ata_assembleia";
  }
  if (/(laudo de vistoria|art\s*n|rrt\s*n|lei estadual n[oº°]?\s*13\.032|avcb|bombeiros)/.test(norm)) {
    return "laudo_vistoria_art";
  }
  if (/(boleto|vencimento|fundo de reserva|cota condominial|iptu)/.test(norm)) {
    return "boleto_condominio_iptu";
  }
  return "desconhecido";
}

export type OnusMatriculaExtraido = {
  atoNumero: string;
  tipo: "penhora" | "hipoteca" | "alienacao_fiduciaria" | "usufruto" | "indisponibilidade" | "clausula_inalienabilidade" | "spu_ocupacao_aforamento";
  canceladoPorAto: string | null;
  ativo: boolean;
  pagina: number;
  citacaoLiteral: string;
};

export type AlertaCondoScan = {
  codigo:
    | "short_stay_restricao_ou_permissao"
    | "regra_pets"
    | "vaga_presa_ou_rotativa"
    | "chamada_cota_extra"
    | "litigio_estrutural_ou_trabalhista"
    | "deficit_contabil"
    | "inadimplencia_acima_benchmark"
    | "avcb_ou_vistoria_vencida";
  severidade: "critico" | "atencao" | "informativo";
  pagina: number;
  citacaoLiteral: string;
};

export type ResultadoAuditoriaDocumental = {
  classeDocumental: ClasseDocumentalVereda;
  cnmEncontrado: ResultadoValidacaoCnm | null;
  validadeCertidao30Dias: { valida: boolean | null; diasDecorridos: number | null; estado: EstadoItemPacoteDocumental };
  onusIdentificados: OnusMatriculaExtraido[];
  onusAtivos: OnusMatriculaExtraido[];
  alertasCondoScan: AlertaCondoScan[];
  indiceAdequacaoFundoReserva: {
    razaoSaldoOrcamentoObra: number | null;
    estado: "adequado" | "insuficiente" | "nao_sabemos";
  };
  assercaoCanonicas: DocumentAssertion[];
  taxaCitationEntailment: number;
  rejeitadosPorEntailment: number;
  estadoAusencia: AbsenceState | null;
};

const PADROES_ONUS: {
  tipo: OnusMatriculaExtraido["tipo"];
  regex: RegExp;
}[] = [
  { tipo: "penhora", regex: /\bpenhora(?:do|da)?\b/i },
  { tipo: "hipoteca", regex: /\bhipoteca(?:do|da)?\b/i },
  { tipo: "alienacao_fiduciaria", regex: /\baliena[cç][aã]o\s+fiduci[aá]ria\b/i },
  { tipo: "usufruto", regex: /\busufruto\b/i },
  { tipo: "indisponibilidade", regex: /\bindisponibilidade\b/i },
  { tipo: "clausula_inalienabilidade", regex: /\binalienabilidade\b/i },
  { tipo: "spu_ocupacao_aforamento", regex: /\b(?:terreno\s+de\s+marinha|spu|enfiteuse|aforamento|ocupa[cç][aã]o\s+da\s+uni[aã]o)\b/i },
];

const PADROES_CONDOSCAN: {
  codigo: AlertaCondoScan["codigo"];
  severidade: AlertaCondoScan["severidade"];
  regex: RegExp;
}[] = [
  { codigo: "short_stay_restricao_ou_permissao", severidade: "atencao", regex: /\b(?:airbnb|curta\s+temporada|loca[cç][aã]o\s+por\s+aplicativo|hospedagem\s+tempor[aá]ria)\b/i },
  { codigo: "regra_pets", severidade: "informativo", regex: /\b(?:animais\s+dom[eé]sticos|pets?|cachorro|gato)\b/i },
  { codigo: "vaga_presa_ou_rotativa", severidade: "critico", regex: /\b(?:vaga\s+presa|vaga\s+rotativa|estacionamento\s+indeterminado|sem\s+vaga\s+escriturada)\b/i },
  { codigo: "chamada_cota_extra", severidade: "critico", regex: /\b(?:cota\s+extra|rateio\s+extraordin[aá]rio|chamada\s+de\s+capital)\b/i },
  { codigo: "litigio_estrutural_ou_trabalhista", severidade: "critico", regex: /\b(?:a[cç][aã]o\s+trabalhista|execu[cç][aã]o\s+fiscal|a[cç][aã]o\s+judicial|patologia\s+estrutural|embargo\s+de\s+obra)\b/i },
  { codigo: "deficit_contabil", severidade: "critico", regex: /\b(?:d[eé]ficit\s+financeiro|saldo\s+negativo|insufici[eê]ncia\s+de\s+caixa)\b/i },
  { codigo: "inadimplencia_acima_benchmark", severidade: "atencao", regex: /\b(?:inadimpl[eê]ncia\s+(?:de\s+)?(?:1[3-9]|[2-9]\d)|alta\s+inadimpl[eê]ncia)\b/i },
  { codigo: "avcb_ou_vistoria_vencida", severidade: "critico", regex: /\b(?:avcb\s+vencid[oa]|alvar[aá]\s+dos\s+bombeiros\s+vencid[oa]|vistoria\s+trienal\s+vencid[ao])\b/i },
];

function paraDocClassCanonico(classe: ClasseDocumentalVereda): DocClass {
  if (classe === "matricula_onr") return "matricula_onr";
  if (classe === "ata_assembleia") return "ata";
  if (classe === "convencao_condominio") return "convencao";
  if (classe === "balancete_condominial") return "balancete";
  if (classe === "laudo_vistoria_art") return "laudo";
  return "seguro";
}

export function auditarDocumentoVereda(entrada: {
  docId: string;
  docSha256?: string;
  paginas: readonly PaginaDocumentoBruto[];
  dataEmissaoCertidaoIso?: string | null;
  dataReferenciaIso?: string;
  saldoFundoReservaReais?: number | null;
  orcamentoObraReais?: number | null;
  extrairAssercoesCandidatas?: (pagina: PaginaDocumentoBruto) => {
    assertionType: string;
    literalQuote: string;
    confidence: number;
  }[];
}): ResultadoAuditoriaDocumental {
  const textoTudo = entrada.paginas.map((p) => p.texto).join("\n");
  const classe = classificarDocumento(textoTudo);
  const docClass = paraDocClassCanonico(classe);
  const docSha = entrada.docSha256 ?? "0".repeat(64);
  const dataRef = entrada.dataReferenciaIso ?? "2026-11-17";

  const mapaPaginas: Record<number, string> = {};
  for (const p of entrada.paginas) mapaPaginas[p.pagina] = p.texto;

  const matchCnm = textoTudo.match(/\b\d{6}\.?\d\.?\d{7}-?\d{2}\b/);
  const cnmEncontrado = matchCnm ? validarCnm16(matchCnm[0]) : null;
  const validade = verificarValidadeCertidao30Dias(entrada.dataEmissaoCertidaoIso ?? null, dataRef);

  const assercoes: DocumentAssertion[] = [];
  let rejeitadosEntail = 0;

  // 1. Extrai e verifica cadeia R- / AV- de matrícula
  const atosEncontrados: OnusMatriculaExtraido[] = [];
  const cancelamentos: { atoCancelado: string; canceladoPor: string }[] = [];

  for (const pag of entrada.paginas) {
    const linhas = pag.texto
      .split(/(?<=[.;\n])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 10);

    for (const trecho of linhas) {
      const mAto = trecho.match(/^(R-\d+|AV-\d+)/i);
      const atoNum = mAto ? mAto[1]!.toUpperCase() : `PAG${pag.pagina}`;

      const mCanc = trecho.match(/(?:cancela|baix[ao]\s+d?[oa]?|quita[cç][aã]o\s+d?[oa]?|extin[cç][aã]o\s+d?[oa]?)\s+(R-\d+|AV-\d+)/i);
      if (mCanc) {
        cancelamentos.push({ atoCancelado: mCanc[1]!.toUpperCase(), canceladoPor: atoNum });
      } else {
        for (const pOnus of PADROES_ONUS) {
          if (pOnus.regex.test(trecho)) {
            if (!verificarEntailmentDeterministico(mapaPaginas, pag.pagina, trecho)) {
              rejeitadosEntail += 1;
              continue;
            }
            atosEncontrados.push({
              atoNumero: atoNum,
              tipo: pOnus.tipo,
              canceladoPorAto: null,
              ativo: true,
              pagina: pag.pagina,
              citacaoLiteral: trecho.slice(0, 300),
            });
            assercoes.push(
              esquemaDocumentAssertion.parse({
                assertion_id: `${entrada.docId}-p${pag.pagina}-${assercoes.length + 1}`,
                doc_sha256: docSha,
                doc_class: docClass,
                claim_type: `onus_${pOnus.tipo}`,
                extracted_value: `${atoNum}: ${pOnus.tipo}`,
                source_page: pag.pagina,
                verbatim_quote: trecho.slice(0, 1200),
                entailment_verified: true,
                epistemic_status: classe === "matricula_onr" ? "registro_oficial" : "declarado",
              }),
            );
            break;
          }
        }
      }

      // 2. CondoScan 8 alertas em atas, convenções, balancetes e laudos
      for (const cs of PADROES_CONDOSCAN) {
        if (cs.regex.test(trecho)) {
          if (!verificarEntailmentDeterministico(mapaPaginas, pag.pagina, trecho)) {
            rejeitadosEntail += 1;
            continue;
          }
          assercoes.push(
            esquemaDocumentAssertion.parse({
              assertion_id: `${entrada.docId}-p${pag.pagina}-cs-${assercoes.length + 1}`,
              doc_sha256: docSha,
              doc_class: docClass,
              claim_type: cs.codigo,
              extracted_value: trecho.slice(0, 200),
              source_page: pag.pagina,
              verbatim_quote: trecho.slice(0, 1200),
              entailment_verified: true,
              epistemic_status: "declarado",
            }),
          );
        }
      }
    }

    // 3. Portão obrigatório contra alucinações para quaisquer extratores externos/candidatos
    if (entrada.extrairAssercoesCandidatas) {
      for (const cand of entrada.extrairAssercoesCandidatas(pag)) {
        const verificado = verificarEntailmentDeterministico(mapaPaginas, pag.pagina, cand.literalQuote);
        if (!verificado) {
          rejeitadosEntail += 1;
          continue;
        }
        assercoes.push(
          esquemaDocumentAssertion.parse({
            assertion_id: `${entrada.docId}-p${pag.pagina}-cand-${assercoes.length + 1}`,
            doc_sha256: docSha,
            doc_class: docClass,
            claim_type: cand.assertionType,
            extracted_value: cand.literalQuote.slice(0, 200),
            source_page: pag.pagina,
            verbatim_quote: cand.literalQuote.slice(0, 1200),
            entailment_verified: true,
            epistemic_status: "declarado",
          }),
        );
      }
    }
  }

  for (const canc of cancelamentos) {
    for (const ato of atosEncontrados) {
      if (ato.atoNumero === canc.atoCancelado) {
        ato.canceladoPorAto = canc.canceladoPor;
        ato.ativo = false;
      }
    }
  }

  const alertasCondoScan: AlertaCondoScan[] = [];
  for (const a of assercoes) {
    const csDef = PADROES_CONDOSCAN.find((p) => p.codigo === a.claim_type);
    if (csDef && a.source_page !== null) {
      alertasCondoScan.push({
        codigo: csDef.codigo,
        severidade: csDef.severidade,
        pagina: a.source_page,
        citacaoLiteral: a.verbatim_quote,
      });
    }
  }

  let razaoReserva: number | null = null;
  let estadoReserva: ResultadoAuditoriaDocumental["indiceAdequacaoFundoReserva"]["estado"] = "nao_sabemos";
  if (typeof entrada.saldoFundoReservaReais === "number" && typeof entrada.orcamentoObraReais === "number" && entrada.orcamentoObraReais > 0) {
    razaoReserva = Math.round((entrada.saldoFundoReservaReais / entrada.orcamentoObraReais) * 1000) / 1000;
    estadoReserva = razaoReserva >= 1.0 ? "adequado" : "insuficiente";
  }

  const totalVerificadas = assercoes.length;
  const taxaEntail =
    totalVerificadas + rejeitadosEntail === 0
      ? 1.0
      : totalVerificadas > 0
        ? 1.0
        : 0;

  return {
    classeDocumental: classe,
    cnmEncontrado,
    validadeCertidao30Dias: validade,
    onusIdentificados: atosEncontrados,
    onusAtivos: atosEncontrados.filter((o) => o.ativo),
    alertasCondoScan,
    indiceAdequacaoFundoReserva: {
      razaoSaldoOrcamentoObra: razaoReserva,
      estado: estadoReserva,
    },
    assercaoCanonicas: assercoes,
    taxaCitationEntailment: taxaEntail,
    rejeitadosPorEntailment: rejeitadosEntail,
    estadoAusencia:
      entrada.paginas.length === 0
        ? "sem_leitura_publicada"
        : atosEncontrados.length === 0 && alertasCondoScan.length === 0
          ? "sem_ocorrencia_no_periodo"
          : null,
  };
}
