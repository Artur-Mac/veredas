// Textos da tela de confirmação do prédio. Funções puras: recebem o edifício do índice e devolvem o que a
// interface mostra. Valor ausente no cadastro some do texto; nunca vira zero nem frase inventada.
import type { Edificio, Tipologia } from "../../dados/contratos";

// Formatação movida para src/dados/recife/endereco.ts (arquiteto); reexportada aqui para os usos existentes.
import { formatarChaveCadastral, formatarEndereco } from "../../dados/recife/endereco";
export { formatarChaveCadastral };
export const enderecoEmCaixaDeTitulo = formatarEndereco;

/** "48 unidades · construído em 2023 · padrão médio · 12 pavimentos"; partes sem valor no cadastro saem. */
export function resumoDoPredio(e: Edificio): string {
  const partes = [`${e.unidades} unidades`];
  if (e.anoConstrucao !== null) partes.push(`construído em ${e.anoConstrucao}`);
  if (e.padrao) partes.push(`padrão ${e.padrao.toLowerCase()}`);
  if (e.pavimentos !== null) partes.push(`${e.pavimentos} ${e.pavimentos === 1 ? "pavimento" : "pavimentos"}`);
  return partes.join(" · ");
}

/** Linha de resultado da busca: "Rua Teles Junior, 331 · Parador de Cervantes". */
export function linhaDeResultado(e: Edificio): string {
  const endereco = enderecoEmCaixaDeTitulo(e.logradouro, e.numero);
  return e.nome ? `${endereco} · ${e.nome}` : endereco;
}

/** Rótulo de leitor de tela de um lote vizinho tocável no mapa: "Prédio vizinho: Rua Teles Junior, 331". */
export function rotuloDoLoteVizinho(e: Edificio): string {
  return `Prédio vizinho: ${enderecoEmCaixaDeTitulo(e.logradouro, e.numero)}`;
}

/**
 * O que a tela diz quando não há candidato. Com rua no anúncio, a rua não está no cadastro disponível; sem
 * rua, não há como saber o prédio. Nunca as duas mensagens juntas.
 */
export function mensagemSemCandidatos(logradouro: string | null, numero: string | null): string {
  const rua = logradouro?.trim();
  if (!rua) return "Sem o endereço não dá para saber qual é o prédio. Peça a rua e o número ao corretor.";
  return `Não achamos ${enderecoEmCaixaDeTitulo(rua, numero)} no cadastro disponível para o Recife. Confira o endereço com o corretor ou busque abaixo.`;
}

/**
 * O índice só tem prédios residenciais de apartamentos (IPTU de apartamento agrupado por endereço). Loja, sala, casa e
 * terreno não aparecem na lista, e sugerir apartamentos pela área seria enganoso.
 */
export function avisoDeTipologia(tipologia: Tipologia | null): string | null {
  if (tipologia === "outro") {
    return "Este anúncio não é de apartamento. O cadastro do Vereda localiza só prédios residenciais de apartamentos, então loja, sala e terreno não aparecem na lista. Você pode continuar sem identificar.";
  }
  if (tipologia === "casa") {
    return "O cadastro do Vereda localiza só prédios de apartamentos; casas ainda não aparecem na lista. Você pode continuar sem identificar.";
  }
  return null;
}
