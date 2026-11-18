// Microclima do ponto do imóvel: o que o conforto térmico lê além da fachada e do andar (calor de superfície da quadra
// contra o bairro, praças e árvores perto, distância da água). Fica num lugar só para o dossiê e o Comparar darem o mesmo
// selo ao mesmo prédio (unificação de 19/11/2026: o Comparar não lia o microclima e o selo saía diferente).
import { lerAreasVerdesProximas, lerRelevoECanalProximo, lerTemperaturaSuperficie100m } from "../recife/camadasAmbientais";

export type MicroclimaDoPonto = {
  tempDelta: number | null;
  tempQuadraC: number | null;
  pracasAte300m: number;
  possuiArvore: boolean;
  distanciaAgua: number | null;
};

export const SEM_MICROCLIMA: MicroclimaDoPonto = { tempDelta: null, tempQuadraC: null, pracasAte300m: 0, possuiArvore: false, distanciaAgua: null };

/** Lê o microclima no ponto. Sem coordenada, ou se a camada ambiental falhar, devolve "sem leitura" (nunca um valor fixo). */
export function lerMicroclimaDoPonto(coord: readonly [number, number] | null | undefined, bairro: string | null | undefined): MicroclimaDoPonto {
  if (!coord) return SEM_MICROCLIMA;
  try {
    const ponto: [number, number] = [coord[0], coord[1]];
    const lst = lerTemperaturaSuperficie100m(ponto, bairro);
    const verde = lerAreasVerdesProximas(ponto);
    const hid = lerRelevoECanalProximo(ponto);
    return {
      tempDelta: lst?.diferencaBairroC ?? null,
      tempQuadraC: lst?.tempQuadraC ?? null,
      pracasAte300m: verde.pracasAte300m,
      possuiArvore: Boolean(verde.arvoreTombadaProxima),
      distanciaAgua: hid.cursoDaguaMaisProximo?.distanciaM ?? null,
    };
  } catch {
    return SEM_MICROCLIMA;
  }
}
