// Leitura do índice cadastral para uma análise (Fatia 4). `e` só vale com vínculo confirmado; contexto e obras só
// valem em bairro coberto. Qualquer falha do índice (arquivo inválido) vira `falhou`, nunca um dado "parecido".
// v1.1: `rua` é a camada "A rua" do bairro com as fontes dela no meta.json, ou null num índice sem a camada.
import type { AnaliseV2, ContextoDoBairro, Edificio, Obra } from "../../dados/contratos";
import type { EntradaDaRua } from "../../dados/dossie/rua";
import { eCoberto } from "../../dados/recife/bairros";
import { META, edificioPorId, indiceDoBairro } from "../../dados/recife/indice";

export type CadastroDaAnalise = {
  edificio: Edificio | null;
  contexto: ContextoDoBairro | null;
  obras: Obra[];
  /** Todos os edifícios do bairro, só para o mapa desenhar os lotes vizinhos. */
  vizinhos: readonly Edificio[];
  rua: EntradaDaRua | null;
  /** `true` quando o índice do bairro não pôde ser lido. */
  falhou: boolean;
};

const VAZIO: CadastroDaAnalise = { edificio: null, contexto: null, obras: [], vizinhos: [], rua: null, falhou: false };

/** A camada "A rua" do índice do bairro com as fontes do meta.json; null se faltar uma das duas. */
export function entradaDaRua(indice: { rua?: EntradaDaRua["bairro"] }): EntradaDaRua | null {
  const fontes = META.fontesDaRua;
  return indice.rua && fontes ? { bairro: indice.rua, fontes } : null;
}

export function carregarCadastro(a: AnaliseV2): CadastroDaAnalise {
  const bairro = a.bairro;
  if (!eCoberto(bairro)) return VAZIO;
  try {
    const indice = indiceDoBairro(bairro);
    const edificio = a.vinculo.estado === "confirmado" ? edificioPorId(a.vinculo.edificioId, bairro) : null;
    return { edificio, contexto: indice.contexto, obras: indice.obras, vizinhos: indice.edificios, rua: entradaDaRua(indice), falhou: false };
  } catch {
    return { ...VAZIO, falhou: true };
  }
}
