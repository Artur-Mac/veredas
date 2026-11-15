// Tipos de valor de imóvel (15/11/2026). Cada um tem rótulo próprio e só se compara com o mesmo tipo e modalidade.
// O app hoje mostra "preco_pedido"/"aluguel_pedido" (anúncio) e "avaliacao_fiscal_itbi" (ITBI do Recife, campo
// valor_avaliacao: o arquivo aberto não traz o valor declarado da transação). "preco_registrado" e
// "aluguel_contratado" só entram com fonte própria: matrícula/certidão ou o serviço do art. 343-J, V do CNN/CNJ
// (Provimento 195), e contrato de locação ou base contratual autorizada. Leilão fica no seu próprio recorte.
export type TipoDeValor = "preco_pedido" | "aluguel_pedido" | "avaliacao_fiscal_itbi" | "preco_registrado" | "aluguel_contratado" | "lance_de_leilao";

export const ROTULO_DO_VALOR: Record<TipoDeValor, string> = {
  preco_pedido: "Preço pedido no anúncio",
  aluguel_pedido: "Aluguel pedido no anúncio",
  avaliacao_fiscal_itbi: "Avaliação fiscal do ITBI (não é preço de venda)",
  preco_registrado: "Preço registrado na matrícula",
  aluguel_contratado: "Aluguel contratado",
  lance_de_leilao: "Valor de leilão (outro mercado)",
};

/** Evidência mínima para cada tipo aparecer como fato. */
export const EVIDENCIA_EXIGIDA: Record<TipoDeValor, string> = {
  preco_pedido: "anúncio com data de leitura",
  aluguel_pedido: "anúncio com data de leitura",
  avaliacao_fiscal_itbi: "linha do ITBI do Recife (data da transação, fração ideal) ligada ao prédio",
  preco_registrado: "ato R-n de compra e venda na matrícula (data do registro, valor declarado, fração transmitida), ligado à unidade",
  aluguel_contratado: "contrato de locação ou base contratual autorizada, com data de início",
  lance_de_leilao: "edital e resultado com data, modalidade e matrícula",
};

const MODALIDADE: Record<TipoDeValor, "venda" | "aluguel"> = {
  preco_pedido: "venda", aluguel_pedido: "aluguel", avaliacao_fiscal_itbi: "venda", preco_registrado: "venda", aluguel_contratado: "aluguel", lance_de_leilao: "venda",
};

/**
 * Dois valores só se comparam lado a lado como iguais quando são do mesmo tipo. Tipos diferentes da mesma modalidade
 * podem aparecer juntos, cada um com o seu rótulo, mas nunca numa diferença ("desconto") calculada pelo app.
 */
export function relacaoEntreValores(a: TipoDeValor, b: TipoDeValor): "comparavel" | "lado_a_lado_com_rotulos" | "nao_misturar" {
  if (a === b) return "comparavel";
  if (MODALIDADE[a] !== MODALIDADE[b] || a === "lance_de_leilao" || b === "lance_de_leilao") return "nao_misturar";
  return "lado_a_lado_com_rotulos";
}
