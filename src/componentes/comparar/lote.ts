// Lote do edifício para desenho, a partir do índice cadastral. Pura.
import type { Edificio } from "../../dados/contratos";
import type { Poligono } from "../mapa/geometria";

/**
 * Polígono do lote em plano local (x = longitude reduzida pelo cosseno da latitude, y = latitude invertida, norte
 * para cima), pronto para `poligonoNaCaixa`. Sem polígono no índice, devolve null: nada é inventado.
 */
export function poligonoDoEdificio(e: Edificio): Poligono | null {
  const pontos = e.poligono;
  if (!pontos || pontos.length < 3) return null;
  const [, lat0 = 0] = pontos[0] ?? [0, 0];
  const fator = Math.cos((lat0 * Math.PI) / 180);
  return pontos.map(([lon, lat]) => [lon * fator, -lat]);
}
