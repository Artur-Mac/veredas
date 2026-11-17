import type { Caderno } from "./caderno";
import { distanciaMetros } from "./geo";

/** Distância reta, sem tempo estimado, roteamento, acessibilidade ou travessia implícitos. */
export function distanciaDaRotina(centro: [number, number] | null, destino: NonNullable<Caderno["destinos"]>[number]): number | null {
  const p = destino.posicao;
  if (!centro || !p || p.precisaoM === null || p.precisaoM > 100) return null;
  if (![...centro, p.longitude, p.latitude].every(Number.isFinite)) return null;
  return Math.max(100, Math.round(distanciaMetros(centro, [p.longitude, p.latitude]) / 100) * 100);
}
