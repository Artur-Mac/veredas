// Onde cada camada por prédio existe (VE16). Lido dos módulos gerados pelos pipelines, para o texto da tela acompanhar a
// cobertura publicada: quando uma área entra (scripts/dados/areas.json), a frase muda sem edição à mão.
import { bairroPorSlug } from "./bairros";
import { ARQUIVOS_DA_CHUVA } from "./chuvaGerado";
import { ARQUIVOS_DOS_ESSENCIAIS } from "./essenciaisGerados";
import { ARQUIVOS_DA_NOITE } from "./noiteGerado";
import { ARQUIVOS_DE_ACESSO } from "./transitoGerado";

export const AREAS_POR_CAMADA = {
  diaADia: Object.keys(ARQUIVOS_DOS_ESSENCIAIS),
  horarios: Object.keys(ARQUIVOS_DE_ACESSO),
  chuva: Object.keys(ARQUIVOS_DA_CHUVA),
  noite: Object.keys(ARQUIVOS_DA_NOITE),
} as const;

/** "Boa Viagem, Casa Forte e Torre" (nomes oficiais, na ordem publicada). */
export function nomesDasAreas(slugs: readonly string[]): string {
  const nomes = slugs.map((s) => bairroPorSlug(s)?.nome ?? s);
  return nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
