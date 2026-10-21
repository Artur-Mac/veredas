// O anúncio que chega por compartilhamento (plugins/compartilhar): a página que a pessoa compartilhou do Safari (iOS),
// o link compartilhado ou o trecho escolhido em "Ler no Vereda", no menu de seleção de texto (Android). Funções puras:
// recebem o que o expo-share-intent entregou e devolvem o que a tela de leitura abre.
import { textoDoAnuncioCopiado } from "./copiado";
import { esquemaColetaDaPagina, type ColetaDaPagina } from "./pagina";

/** A mesma chave de plugins/compartilhar/coletaDaPagina.js; um teste confere que as duas não se separam. */
export const CHAVE_DA_COLETA = "vereda:coleta";

/** O que o expo-share-intent entrega (`ShareIntent`), só com os campos que a leitura usa. */
export type Compartilhamento = {
  text?: string | null;
  webUrl?: string | null;
  meta?: Record<string, string | undefined> | null;
};

export type AnuncioRecebido = {
  /** Link do anúncio: o da página do Safari, o que veio no texto ou o aberto no navegador há pouco. Vazio se nenhum. */
  url: string;
  /** Trecho do anúncio, já filtrado por `textoDoAnuncioCopiado`. Vazio quando não veio texto de anúncio. */
  texto: string;
  /** Coleta da página do Safari, validada pelo esquema da WebView. */
  coleta: ColetaDaPagina | null;
};

/** O Safari abre o Vereda com `vereda://dataUrl=<chave>?nonce=…#weburl` (expo-share-intent). */
export function ehLinkDoCompartilhamento(caminho: string): boolean {
  return caminho.includes("dataUrl=");
}

function linkHttp(texto: string): string | null {
  try {
    const analisado = new URL(texto);
    return analisado.protocol === "https:" || analisado.protocol === "http:" ? texto : null;
  } catch {
    return null;
  }
}

const LINK_NO_TEXTO = /https?:\/\/[^\s<>"']+/i;
const LINKS_NO_TEXTO = new RegExp(LINK_NO_TEXTO.source, "gi");
/** Pontuação que fecha a frase, não o link: "veja em https://…/id-123." */
const PONTUACAO_NO_FIM = /[.,;:!?)\]}»]+$/;

/** Primeiro link http(s) do texto, sem a pontuação que vem logo depois dele. */
export function primeiroLink(texto: string): string | null {
  const achado = LINK_NO_TEXTO.exec(texto);
  return achado ? linkHttp(achado[0].replace(PONTUACAO_NO_FIM, "")) : null;
}

/** A coleta da página que veio em `meta`, validada; null quando falta, não é JSON ou passa dos limites. */
export function coletaCompartilhada(meta: Compartilhamento["meta"]): ColetaDaPagina | null {
  const bruta = meta?.[CHAVE_DA_COLETA];
  if (typeof bruta !== "string" || !bruta) return null;
  let objeto: unknown;
  try {
    objeto = JSON.parse(bruta);
  } catch {
    return null;
  }
  const validada = esquemaColetaDaPagina.safeParse(objeto);
  return validada.success ? validada.data : null;
}

/**
 * Monta o anúncio recebido. `linkAberto` é o link que a pessoa abriu no navegador há pouco: o trecho escolhido no menu
 * de seleção do Chrome chega sem link, e o link rende tipo, quartos, área e bairro.
 *
 * O texto só entra se parecer anúncio (`textoDoAnuncioCopiado`): o resto é descartado sem aparecer nem ser guardado.
 * Devolve null quando não chegou nada do anúncio (nem link, nem trecho com preço ou área, nem página).
 */
export function anuncioRecebido(compartilhado: Compartilhamento, linkAberto: string | null): AnuncioRecebido | null {
  const coleta = coletaCompartilhada(compartilhado.meta);
  const texto = (compartilhado.text ?? "").trim();
  const linkRecebido =
    (coleta ? linkHttp(coleta.url) : null) ?? primeiroLink(texto) ?? primeiroLink((compartilhado.webUrl ?? "").trim());
  const url = linkRecebido ?? linkAberto ?? "";
  // Sem os links: o endereço do anúncio traz a área ("…-125m2-id-…") e faria uma mensagem com o link passar por trecho.
  const trecho = textoDoAnuncioCopiado(texto.replace(LINKS_NO_TEXTO, " ").trim(), url) ?? "";
  if (!linkRecebido && !trecho && !coleta) return null;
  return { url, texto: trecho, coleta };
}

/** Parâmetros da rota /ler. `marca` muda a cada recebimento (recomeça a leitura); `idDaColeta` aponta a memória. */
export function parametrosDaLeitura(
  recebido: AnuncioRecebido,
  marca: string,
  idDaColeta: string | null,
): { origem: "compartilhado"; n: string; url?: string; texto?: string; coleta?: string } {
  return {
    origem: "compartilhado",
    n: marca,
    ...(recebido.url ? { url: recebido.url } : {}),
    ...(recebido.texto ? { texto: recebido.texto } : {}),
    ...(idDaColeta ? { coleta: idDaColeta } : {}),
  };
}
