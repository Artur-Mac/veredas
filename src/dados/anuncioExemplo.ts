import exemplo from "../../docs/mock/anuncios/quintoandar-895773394.json";

export const anuncioExemplo = exemplo;

// Esta referência visual não compõe os dossiês nem as bases municipais de Recife.
export function eAnuncioExemplo(link: string): boolean {
  try {
    const url = new URL(link);
    return /^https?:$/.test(url.protocol)
      && ["www.quintoandar.com.br", "quintoandar.com.br"].includes(url.hostname)
      && /^\/imovel\/895773394(?:\/|$)/.test(url.pathname);
  } catch {
    return false;
  }
}
