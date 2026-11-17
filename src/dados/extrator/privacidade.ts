// O texto de um anúncio traz o contato de quem anuncia: telefone, WhatsApp, e-mail, CRECI, às vezes CPF ou CNPJ.
// O Vereda só lê campos do imóvel, então isso sai antes de qualquer leitura (texto colado, copiado, compartilhado ou
// da página). Nenhum padrão aqui pode comer preço, área ou CEP: os testes conferem.

// Separadores só dentro da linha ([ \t]): a leitura usa as quebras, e um número não pode grudar no da linha seguinte.
const TROCAS: [RegExp, string][] = [
  // E-mail.
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, " "],
  // CRECI com o número ("CRECI 12345-J", "CRECI/PE: 1.234", "Creci nº 9876"). A palavra fica; o número sai.
  [/\b(CRECI)(?:[ \t]*[/-][ \t]*[A-Z]{2})?[ \t:.-]*(?:n[º°o.]?[ \t]*)?\d[\d.]*(?:-?[A-Z]{1,2}\b)?/gi, "$1"],
  // CPF e CNPJ formatados.
  [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, " "],
  [/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, " "],
  // Telefone com DDD, com ou sem +55 e parênteses: "(81) 99999-9999", "+55 81 3333 4444", "81 98765.4321".
  [/(?:\+?55[ \t.-]?)?\(?\b[1-9]\d\)?[ \t.-]?9?\d{4}[ \t.-]?\d{4}\b/g, " "],
  // Celular sem DDD: "99999-9999", "9 8765-4321".
  [/\b9[ \t.]?\d{4}[ \t.-]\d{4}\b/g, " "],
];

/** Tira contato e documento de pessoa do texto; mantém as quebras de linha, que a leitura usa. */
export function semDadosPessoais(texto: string): string {
  let limpo = texto;
  for (const [padrao, troca] of TROCAS) limpo = limpo.replace(padrao, troca);
  return limpo;
}
