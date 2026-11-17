// Estado do mapa do lote (15/11/2026): modo (planta 2D ou volume estimado 2.5D num horário), zoom em passos, arraste
// limitado para o desenho nunca sair do quadro e a obra tocada. Puro, testado em tests/mapa-do-lote.test.ts.
import type { HorarioSolar } from "../../dados/dossie/solESombra";

export type ModoDoMapa = HorarioSolar | "planta";

export const ZOOMS = [1, 1.5, 2, 3] as const;

export type EstadoDoMapa = {
  modo: ModoDoMapa;
  zoom: number;
  /** Deslocamento do desenho, em pixels do quadro (já na escala do zoom). */
  dx: number;
  dy: number;
  /** Número da obra tocada (1, 2, 3…), ou null. */
  obra: number | null;
};

export const ESTADO_INICIAL: EstadoDoMapa = { modo: "planta", zoom: 1, dx: 0, dy: 0, obra: null };

/** Quanto o desenho pode andar para cada lado sem mostrar borda vazia: metade do que sobra com o zoom. */
function limites(zoom: number, largura: number, altura: number) {
  return { x: (largura * (zoom - 1)) / 2, y: (altura * (zoom - 1)) / 2 };
}

const prender = (v: number, m: number) => Math.max(-m, Math.min(m, v));

/**
 * Troca o zoom mantendo `foco` (um ponto do desenho, na escala 1) no mesmo lugar do quadro — o mapa usa o pino do
 * prédio, que assim não escapa para a borda. Sem foco, o centro do quadro. O resultado fica preso aos limites.
 */
function comZoom(e: EstadoDoMapa, zoom: number, largura: number, altura: number, foco?: readonly [number, number]): EstadoDoMapa {
  const cx = largura / 2, cy = altura / 2;
  const [fx, fy] = foco ?? [cx - e.dx / e.zoom, cy - e.dy / e.zoom];
  const l = limites(zoom, largura, altura);
  return { ...e, zoom, dx: prender(e.dx + (fx - cx) * (e.zoom - zoom), l.x), dy: prender(e.dy + (fy - cy) * (e.zoom - zoom), l.y) };
}

export function aproximar(e: EstadoDoMapa, largura: number, altura: number, foco?: readonly [number, number]): EstadoDoMapa {
  const proximo = ZOOMS.find((z) => z > e.zoom);
  return proximo ? comZoom(e, proximo, largura, altura, foco) : e;
}

export function afastar(e: EstadoDoMapa, largura: number, altura: number, foco?: readonly [number, number]): EstadoDoMapa {
  const anterior = [...ZOOMS].reverse().find((z) => z < e.zoom);
  return anterior ? comZoom(e, anterior, largura, altura, foco) : e;
}

export function arrastar(e: EstadoDoMapa, ddx: number, ddy: number, largura: number, altura: number): EstadoDoMapa {
  const l = limites(e.zoom, largura, altura);
  return { ...e, dx: prender(e.dx + ddx, l.x), dy: prender(e.dy + ddy, l.y) };
}

export const recentrar = (e: EstadoDoMapa): EstadoDoMapa => ({ ...e, zoom: 1, dx: 0, dy: 0 });

export const trocarModo = (e: EstadoDoMapa, modo: ModoDoMapa): EstadoDoMapa => ({ ...e, modo });

export const tocarObra = (e: EstadoDoMapa, numero: number): EstadoDoMapa => ({ ...e, obra: e.obra === numero ? null : numero });

/** Transformação SVG do grupo desenhado: escala em torno do centro do quadro e depois o deslocamento. */
export function transformacao(e: EstadoDoMapa, largura: number, altura: number): string {
  const cx = largura / 2, cy = altura / 2;
  return `translate(${cx + e.dx} ${cy + e.dy}) scale(${e.zoom}) translate(${-cx} ${-cy})`;
}

/** Onde um ponto do desenho ([x, y] na escala 1) aparece no quadro, para pôr o alvo de toque sobre ele. */
export function naTela(e: EstadoDoMapa, x: number, y: number, largura: number, altura: number): [number, number] {
  const cx = largura / 2, cy = altura / 2;
  return [cx + e.dx + (x - cx) * e.zoom, cy + e.dy + (y - cy) * e.zoom];
}

/** Ponto visível no quadro (com folga para o alvo de toque de 44 px). */
export const visivelNoQuadro = ([x, y]: [number, number], largura: number, altura: number) => x >= -22 && y >= -22 && x <= largura + 22 && y <= altura + 22;
