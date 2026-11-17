// O que a pessoa copiou no navegador, lido pelo app quando ela volta (portal que bloqueia a página no app).
// A área de transferência pode ter qualquer coisa: senha, conversa, endereço. Só passa o que parece anúncio; o resto é
// descartado sem aparecer na tela nem ser guardado.

/** O mesmo teto do texto coletado da página (`esquemaColetaDaPagina`). */
const TAMANHO_MAXIMO = 200_000;

/** Um trecho de anúncio com preço e área tem mais que isso; menos é o link, uma palavra ou um número solto. */
const TAMANHO_MINIMO = 40;

const SO_UM_LINK = /^https?:\/\/\S+$/i;

/** Valor em reais ("R$ 4.500", "R$4500") ou área ("125 m²", "125m2"): sem um dos dois não é anúncio. */
const SINAL_DE_ANUNCIO = /R\$\s?\d|\d\s?m[²2](?![a-z\d])/i;

/** Devolve o texto pronto para `extrairDoTexto`, ou null quando o que foi copiado não parece um anúncio. */
export function textoDoAnuncioCopiado(copiado: string | null | undefined, url: string): string | null {
  const texto = (copiado ?? "").trim();
  if (texto.length < TAMANHO_MINIMO) return null;
  if (SO_UM_LINK.test(texto) || texto === url.trim()) return null;
  if (!SINAL_DE_ANUNCIO.test(texto)) return null;
  return texto.slice(0, TAMANHO_MAXIMO);
}
