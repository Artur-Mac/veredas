/**
 * Checklist determinístico de hipóteses legais de isenção de IPTU no Recife
 * (Ownwell app30 §6.1 / backlog B7). Apenas regras públicas em abstrato para
 * conferência documental do cidadão — nunca estima valor venal nem promete deferimento.
 */

export type HipoteseIsencaoIptu = {
  id: string;
  titulo: string;
  requisito: string;
  comoConferir: string;
};

export const COMO_PEDIR_ISENCAO_RECIFE =
  "Esta lista resume hipóteses públicas em abstrato e não calcula benefício individual nem estima valor. Confira critérios vigentes, renda máxima e prazos anuais no portal Recife em Dia (Prefeitura do Recife).";

export const HIPOTESES_ISENCAO_IPTU_RECIFE: readonly HipoteseIsencaoIptu[] = [
  {
    id: "unico_imovel_popular",
    titulo: "Único imóvel residencial dentro do padrão popular",
    requisito:
      "Unidade exclusivamente residencial e único imóvel do contribuinte dentro dos limites de área e enquadramento previstos no Código Tributário Municipal (Lei 15.563/1991).",
    comoConferir: "Consultar o enquadramento cadastral da inscrição no portal Recife em Dia.",
  },
  {
    id: "idoso_aposentado",
    titulo: "Aposentado, pensionista ou idoso",
    requisito:
      "Titular ou cônjuge residente no imóvel, com um único bem residencial e rendimento familiar dentro da faixa estabelecida em decreto anual.",
    comoConferir:
      "Protocolar pedido com comprovante de benefício/renda e matrícula no portal municipal dentro do calendário anual.",
  },
  {
    id: "imovel_preservado",
    titulo: "Imóvel Especial de Preservação (IEP) ou tombado",
    requisito:
      "Edificação protegida por patrimônio municipal cujo exterior e elementos preservados estejam em conservação regular atestada pelo órgão competente.",
    comoConferir:
      "Solicitar vistoria e certificado anual de conservação junto à Diretoria de Preservação do Patrimônio Cultural.",
  },
  {
    id: "outras_hipoteses",
    titulo: "Outras hipóteses legais específicas",
    requisito:
      "Situações excepcionais previstas na legislação tributária vigente do Recife (inclusive convênios, utilidade pública ou exonerações em decreto específico).",
    comoConferir: "Conferir a relação completa e atualizada de isenções na Secretaria de Finanças.",
  },
];
