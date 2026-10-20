// Geometria dos mapas do dossiê (Fatia 4): o lote no topo e o lote com as obras na gaveta. Funções puras.
// Longitude e latitude do índice viram metros num plano tangente ao centro do prédio (x para leste, y para o sul, o
// sentido do eixo y do SVG), e daí pixels. Nada aqui inventa polígono: sem polígono no índice, não se desenha lote.
import type { Edificio, ObrasProximas } from "../../dados/contratos";
import { caminho, poligonoNaCaixa, type Poligono } from "../mapa/geometria";

type Coordenada = readonly [number, number];

const METROS_POR_GRAU = (Math.PI / 180) * 6371008.8;

/** Plano local em metros ao redor de `origem`. */
export function projetorDoPlano(origem: Coordenada): (ponto: Coordenada) => [number, number] {
  const [lon0, lat0] = origem;
  const cosseno = Math.cos((lat0 * Math.PI) / 180);
  return ([lon, lat]) => [(lon - lon0) * METROS_POR_GRAU * cosseno, -(lat - lat0) * METROS_POR_GRAU];
}

/** Contorno do lote no plano local, em metros; `null` quando o índice não tem polígono. */
export function poligonoDoLote(e: Edificio): Poligono | null {
  if (!e.poligono) return null;
  const projetar = projetorDoPlano(e.centro);
  return e.poligono.map((p) => projetar(p));
}

/** Caminho SVG do lote ajustado a uma caixa de `largura` × `altura` (com `margem`), para o topo 16:10. */
export function caminhoDoLoteNaCaixa(e: Edificio, largura: number, altura: number, margem: number): string | null {
  const plano = poligonoDoLote(e);
  return plano ? caminho(poligonoNaCaixa(plano, largura, altura, margem)) : null;
}

export type PontoDeObra = {
  numero: number;
  categoria: ObrasProximas["recentes"][number]["categoria"];
  x: number;
  y: number;
};

export type CenaDoLote = {
  largura: number;
  altura: number;
  /** Caminho do lote do prédio; `null` sem polígono (o desenho mostra só o pino). */
  lote: string | null;
  pino: [number, number];
  /** Contornos de prédios vizinhos do índice, só para dar escala. */
  vizinhos: string[];
  obras: PontoDeObra[];
  /** Metros por pixel do desenho. */
  metrosPorPixel: number;
  /** Régua: comprimento em pixels e rótulo ("50 m"). */
  regua: { pixels: number; rotulo: string };
};

const ESCALAS_DA_REGUA_M = [10, 20, 25, 50, 100, 200];
/** O desenho nunca mostra menos que isto de largura, para um prédio isolado não aparecer gigante. */
const VAO_MINIMO_M = 80;
const MARGEM_RELATIVA = 0.22;
/** Prédios vizinhos só entram quando o centro cai a esta distância do quadro desenhado. */
const FOLGA_DOS_VIZINHOS_M = 30;
const MAX_VIZINHOS = 60;

function reguaDe(metrosPorPixel: number, larguraMaxima: number): CenaDoLote["regua"] {
  let escolhida = ESCALAS_DA_REGUA_M[0] ?? 10;
  for (const metros of ESCALAS_DA_REGUA_M) {
    if (metros / metrosPorPixel <= larguraMaxima) escolhida = metros;
  }
  return { pixels: escolhida / metrosPorPixel, rotulo: `${escolhida} m` };
}

/**
 * Monta o desenho: o lote do prédio, o pino e as obras recentes (numeradas na ordem da lista) num quadro de
 * `largura` × `altura`. O enquadramento cobre o lote e todas as obras, com margem e um vão mínimo.
 */
export function montarCenaDoLote(
  predio: Edificio,
  obras: ObrasProximas["recentes"],
  vizinhos: readonly Edificio[],
  largura: number,
  altura: number,
): CenaDoLote {
  const projetar = projetorDoPlano(predio.centro);
  const lotePlano = poligonoDoLote(predio);
  const pontosDeObra = obras.map((o) => projetar(o.centro));

  const todos: [number, number][] = [[0, 0], ...(lotePlano ?? []), ...pontosDeObra];
  const xs = todos.map((p) => p[0]);
  const ys = todos.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const vaoX = Math.max((maxX - minX) * (1 + 2 * MARGEM_RELATIVA), VAO_MINIMO_M);
  const vaoY = Math.max((maxY - minY) * (1 + 2 * MARGEM_RELATIVA), (VAO_MINIMO_M * altura) / largura);
  const metrosPorPixel = Math.max(vaoX / largura, vaoY / altura);
  const meioX = (minX + maxX) / 2;
  const meioY = (minY + maxY) / 2;

  const paraDesenho = ([x, y]: [number, number]): [number, number] => [
    largura / 2 + (x - meioX) / metrosPorPixel,
    altura / 2 + (y - meioY) / metrosPorPixel,
  ];
  const caminhoDe = (plano: [number, number][]) => caminho(plano.map(paraDesenho));

  const metadeX = (largura / 2) * metrosPorPixel + FOLGA_DOS_VIZINHOS_M;
  const metadeY = (altura / 2) * metrosPorPixel + FOLGA_DOS_VIZINHOS_M;
  const contornos: string[] = [];
  for (const v of vizinhos) {
    if (contornos.length >= MAX_VIZINHOS) break;
    if (v.id === predio.id || !v.poligono) continue;
    const [cx, cy] = projetar(v.centro);
    if (Math.abs(cx - meioX) > metadeX || Math.abs(cy - meioY) > metadeY) continue;
    contornos.push(caminhoDe(v.poligono.map((p) => projetar(p))));
  }

  return {
    largura,
    altura,
    lote: lotePlano ? caminhoDe(lotePlano) : null,
    pino: paraDesenho([0, 0]),
    vizinhos: contornos,
    obras: pontosDeObra.map((p, i) => {
      const [x, y] = paraDesenho(p);
      return { numero: i + 1, categoria: obras[i]?.categoria ?? "construcao", x, y };
    }),
    metrosPorPixel,
    regua: reguaDe(metrosPorPixel, largura * 0.35),
  };
}
