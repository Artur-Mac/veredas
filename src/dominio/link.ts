const padraoUrl = /https?:\/\/[^\s<>"']+/gi;
const padraoCodigo = /\d{6,}/g;

function codigosEm(texto: string): string[] {
  return texto.match(padraoCodigo) ?? [];
}

function caminhoDaUrl(url: string): string {
  const semProtocolo = url.replace(/^https?:\/\/[^/]+/i, '');
  return semProtocolo.split(/[?#]/)[0] ?? '';
}

export function extrairUrls(texto: string): string[] {
  return texto.match(padraoUrl) ?? [];
}

export function pareceLinkDeAnuncio(texto: string): boolean {
  return extrairUrls(texto).some((url) => codigosEm(caminhoDaUrl(url)).length > 0);
}

export function extrairCodigoAnuncio(texto: string): string | null {
  const candidatos = extrairUrls(texto).flatMap((url) => codigosEm(caminhoDaUrl(url)));
  const fonte = candidatos.length > 0 ? candidatos : codigosEm(texto);
  if (fonte.length === 0) {
    return null;
  }
  return fonte.reduce((maior, atual) => (atual.length > maior.length ? atual : maior));
}
