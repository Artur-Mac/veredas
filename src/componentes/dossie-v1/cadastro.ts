// Leitura do índice cadastral para uma análise (Fatia 4). `e` só vale com vínculo confirmado; contexto e obras só
// valem em bairro coberto. Qualquer falha do índice (arquivo inválido) vira `falhou`, nunca um dado "parecido".
import type { AnaliseV2, ContextoDoBairro, Edificio, Obra } from "../../dados/contratos";
import { eCoberto } from "../../dados/recife/bairros";
import { edificioPorId, indiceDoBairro } from "../../dados/recife/indice";

export type CadastroDaAnalise = {
  edificio: Edificio | null;
  contexto: ContextoDoBairro | null;
  obras: Obra[];
  /** Todos os edifícios do bairro, só para o mapa desenhar os lotes vizinhos. */
  vizinhos: readonly Edificio[];
  /** `true` quando o índice do bairro não pôde ser lido. */
  falhou: boolean;
};

const VAZIO: CadastroDaAnalise = { edificio: null, contexto: null, obras: [], vizinhos: [], falhou: false };

export function carregarCadastro(a: AnaliseV2): CadastroDaAnalise {
  const bairro = a.bairro;
  if (!eCoberto(bairro)) return VAZIO;
  try {
    const indice = indiceDoBairro(bairro);
    const edificio = a.vinculo.estado === "confirmado" ? edificioPorId(a.vinculo.edificioId, bairro) : null;
    return { edificio, contexto: indice.contexto, obras: indice.obras, vizinhos: indice.edificios, falhou: false };
  } catch {
    return { ...VAZIO, falhou: true };
  }
}
