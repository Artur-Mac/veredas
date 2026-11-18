/**
 * Ficha de método de 6 campos (decisão A13 de 18/11/2026): toda nota de 0 a 10 mostra, a um toque, o que mede, de onde
 * vem, de quando é, como foi calculada, até onde vale e o que conferir na visita. Regra das notas: cada uma usa dado do
 * imóvel, nunca um valor fixo igual para todos.
 */
export type FichaDeMetodo6Campos = {
  oQueMede: string;
  fonte: string;
  data: string;
  calculo: string;
  limite: string;
  naVisita: string;
};
