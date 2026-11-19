// Open Database License 1.0 (ODbL): os textos de atribuição e a oferta das bases derivadas que o app embute (índice de
// prédios, mapa-base e camada de ruído). Obrigações e local de publicação em docs/dados/ODBL.md; o pacote sai de
// scripts/dados/exportar-bases-odbl.mjs. Não é parecer jurídico.

export const URL_DA_LICENCA_ODBL = "https://opendatacommons.org/licenses/odbl/1-0/";

/** Atribuição das bases da Prefeitura do Recife (dados.recife.pe.gov.br). */
export const ATRIBUICAO_DA_PREFEITURA_ODBL = "Contém dados da Prefeitura do Recife (ODbL)";

/** Atribuição do OpenStreetMap (vias do ruído, pista do aeroporto, rede de ruas a pé). */
export const ATRIBUICAO_DO_OSM_ODBL = "© colaboradores do OpenStreetMap (ODbL)";

/**
 * Onde as bases derivadas são oferecidas (ODbL 4.4 e 4.6). Decisão do Samuel, ainda não tomada: enquanto for null, a
 * tela diz que o local está a definir. Não preencha com URL que não exista.
 */
export const LOCAL_DAS_BASES_DERIVADAS: string | null = null;

export function textoDaOfertaDasBases(local: string | null = LOCAL_DAS_BASES_DERIVADAS): string {
  const onde = local ? `Onde baixar: ${local}.` : "O local de download ainda está a definir.";
  return `As bases que o Vereda deriva desses dados (índice de prédios, desenho dos mapas e ruído estimado) são oferecidas sob a mesma licença, a ODbL 1.0, com os scripts que as geram. ${onde} O reuso delas não tem restrição além das da própria licença.`;
}
