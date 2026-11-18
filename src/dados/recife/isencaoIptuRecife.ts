/**
 * Checklist determinístico de hipóteses legais de isenção ou desconto de IPTU no Recife
 * (Ownwell app30 §6.1 / backlog B7). Apenas regras públicas em abstrato para
 * conferência documental do cidadão — nunca estima valor venal nem promete deferimento.
 *
 * Conferido em 18/11/2026 no Código Tributário do Recife anotado (Lei 15.563/1991, arts. 17, III, 18 e 19, valores de
 * 2026): isenção total só para imóvel único de até 50 m² com renda até o limite da lei; para aposentado ou pensionista
 * a lei dá desconto de 50%, não isenção. A lei não fala em "idoso" nem em "decreto anual": os limites estão nela e
 * são corrigidos todo ano. As duas últimas hipóteses da lista não entraram na conferência.
 */

/** O que a lei dá em cada hipótese: isenção total ou desconto, em % do IPTU. */
export type BeneficioIptu = { tipo: "isencao_total" } | { tipo: "desconto"; percentual: number };

export type HipoteseIsencaoIptu = {
  id: string;
  titulo: string;
  requisito: string;
  comoConferir: string;
  /** Benefícios da hipótese, do maior para o menor; lista vazia quando a regra não foi conferida na lei. */
  beneficios: readonly BeneficioIptu[];
};

export const COMO_PEDIR_ISENCAO_RECIFE =
  "Esta lista resume hipóteses públicas em abstrato e não calcula benefício individual nem estima valor. Os limites de renda e de valor venal são os de 2026 e mudam todo ano: confira critérios vigentes e prazos no portal Recife em Dia (Prefeitura do Recife).";

export const HIPOTESES_ISENCAO_IPTU_RECIFE: readonly HipoteseIsencaoIptu[] = [
  {
    id: "unico_imovel_popular",
    titulo: "Único imóvel residencial dentro do padrão popular",
    requisito:
      "Único imóvel residencial do contribuinte, com até 50 m² de área construída, e renda mensal até o limite da lei (R$ 1.071,22 em 2026): isenção total (Lei 15.563/1991, art. 17, III). Para imóvel único de valor venal até R$ 98.640,00 e renda líquida até R$ 5.356,15 (valores de 2026), desconto de 25% (art. 18, II, a).",
    comoConferir: "Consultar o enquadramento cadastral da inscrição no portal Recife em Dia.",
    beneficios: [{ tipo: "isencao_total" }, { tipo: "desconto", percentual: 25 }],
  },
  {
    id: "aposentado_pensionista",
    titulo: "Aposentado ou pensionista",
    requisito:
      "Aposentado ou pensionista da previdência social com um único imóvel residencial de valor venal até R$ 98.640,00 e renda líquida mensal até R$ 5.356,15 (valores de 2026): desconto de 50% no IPTU (Lei 15.563/1991, art. 18, I, b, e § 4º).",
    comoConferir:
      "Protocolar pedido com comprovante de benefício/renda e matrícula no portal municipal dentro do calendário anual.",
    beneficios: [{ tipo: "desconto", percentual: 50 }],
  },
  {
    id: "imovel_preservado",
    titulo: "Imóvel Especial de Preservação (IEP) ou tombado",
    requisito:
      "Edificação protegida por patrimônio municipal cujo exterior e elementos preservados estejam em conservação regular atestada pelo órgão competente.",
    comoConferir:
      "Solicitar vistoria e certificado anual de conservação junto à Diretoria de Preservação do Patrimônio Cultural.",
    beneficios: [],
  },
  {
    id: "outras_hipoteses",
    titulo: "Outras hipóteses legais específicas",
    requisito:
      "Situações excepcionais previstas na legislação tributária vigente do Recife (inclusive convênios, utilidade pública ou exonerações em decreto específico).",
    comoConferir: "Conferir a relação completa e atualizada de isenções na Secretaria de Finanças.",
    beneficios: [],
  },
];
