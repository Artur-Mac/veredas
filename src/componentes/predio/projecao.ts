// Projeção local do mapa da confirmação do prédio. Latitude e longitude do índice viram metros num plano
// tangente ao prédio selecionado (norte para cima), e daí pixels de uma área de desenho. Funções puras.
import type { Edificio } from "../../dados/contratos";

export type PontoPlano = [number, number];

export type Forma = {
  id: string;
  numero: string;
  /** Polígono do lote em pixels; null quando o índice não tem polígono (a tela desenha um círculo). */
  pontos: PontoPlano[] | null;
  centro: PontoPlano;
};

export type Cena = {
  largura: number;
  altura: number;
  selecionado: Forma;
  /** Mais próximos primeiro. Só os que aparecem, ao menos em parte, na área de desenho. */
  vizinhos: Forma[];
  /** Onde fica o pino: o centro do prédio selecionado. */
  pino: PontoPlano;
  /** Metros por unidade do desenho. */
  metrosPorUnidade: number;
};

export type OpcoesDaCena = {
  largura?: number;
  altura?: number;
  /** Faixa de baixo reservada à legenda. */
  reservaInferior?: number;
  margem?: number;
  /** Vizinhos além deste raio (metros) não entram. */
  raioMaximoM?: number;
  /** Quantos vizinhos mais próximos definem o enquadramento. */
  paraEnquadrar?: number;
};

const METROS_POR_GRAU = (Math.PI / 180) * 6371008.8;

/** Plano local em metros: x para leste, y para o sul (o sentido do eixo y do SVG). */
export function projetorLocal(origem: readonly [number, number]): (ponto: readonly [number, number]) => PontoPlano {
  const [lon0, lat0] = origem;
  const cosseno = Math.cos((lat0 * Math.PI) / 180);
  return ([lon, lat]) => [(lon - lon0) * METROS_POR_GRAU * cosseno, -(lat - lat0) * METROS_POR_GRAU];
}

export function distanciaEmMetros(a: readonly [number, number], b: readonly [number, number]): number {
  const [x, y] = projetorLocal(a)(b);
  return Math.hypot(x, y);
}

type Crua = { id: string; numero: string; poligono: PontoPlano[] | null; centro: PontoPlano; distancia: number };

/** Meio-lado, em metros, do quadrado que representa um prédio sem polígono. */
const MEIO_LADO_SEM_POLIGONO_M = 8;

function extremos(c: Crua): { minX: number; maxX: number; minY: number; maxY: number } {
  const pontos = c.poligono ?? [
    [c.centro[0] - MEIO_LADO_SEM_POLIGONO_M, c.centro[1] - MEIO_LADO_SEM_POLIGONO_M] as PontoPlano,
    [c.centro[0] + MEIO_LADO_SEM_POLIGONO_M, c.centro[1] + MEIO_LADO_SEM_POLIGONO_M] as PontoPlano,
  ];
  const xs = pontos.map((p) => p[0]);
  const ys = pontos.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/**
 * Monta o desenho: o prédio selecionado e seus vizinhos num plano local, ajustados a `largura` × `altura`.
 * O enquadramento cobre o selecionado e os `paraEnquadrar` vizinhos mais próximos dentro de `raioMaximoM`,
 * com um mínimo de 70 m de largura para um prédio isolado não aparecer gigante.
 */
export function montarCena(selecionado: Edificio, outros: readonly Edificio[], opcoes: OpcoesDaCena = {}): Cena {
  const { largura = 400, altura = 180, reservaInferior = 32, margem = 12, raioMaximoM = 140, paraEnquadrar = 4 } = opcoes;
  const projetar = projetorLocal(selecionado.centro);

  const crua = (e: Edificio): Crua => {
    const centro = projetar(e.centro);
    return {
      id: e.id,
      numero: e.numero,
      poligono: e.poligono ? e.poligono.map((p) => projetar(p)) : null,
      centro,
      distancia: Math.hypot(centro[0], centro[1]),
    };
  };

  const principal = crua(selecionado);
  const proximos = outros
    .filter((e) => e.id !== selecionado.id)
    .map(crua)
    .filter((c) => c.distancia <= raioMaximoM)
    .sort((a, b) => a.distancia - b.distancia || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const enquadrados = [principal, ...proximos.slice(0, paraEnquadrar)].map(extremos);
  const minX = Math.min(...enquadrados.map((e) => e.minX));
  const maxX = Math.max(...enquadrados.map((e) => e.maxX));
  const minY = Math.min(...enquadrados.map((e) => e.minY));
  const maxY = Math.max(...enquadrados.map((e) => e.maxY));

  const areaX = largura - 2 * margem;
  const areaY = altura - reservaInferior - margem;
  const larguraM = Math.max(maxX - minX, 70);
  const alturaM = Math.max(maxY - minY, (70 * areaY) / areaX);
  const porMetro = Math.min(areaX / larguraM, areaY / alturaM);
  const meioX = (minX + maxX) / 2;
  const meioY = (minY + maxY) / 2;
  const centroDaArea: PontoPlano = [largura / 2, margem + areaY / 2];

  const paraDesenho = ([x, y]: PontoPlano): PontoPlano => [
    centroDaArea[0] + (x - meioX) * porMetro,
    centroDaArea[1] + (y - meioY) * porMetro,
  ];
  const forma = (c: Crua): Forma => ({
    id: c.id,
    numero: c.numero,
    pontos: c.poligono ? c.poligono.map(paraDesenho) : null,
    centro: paraDesenho(c.centro),
  });

  const aparece = (f: Forma): boolean => {
    const pontos = f.pontos ?? [f.centro];
    return pontos.some(([x, y]) => x >= 0 && x <= largura && y >= 0 && y <= altura - reservaInferior);
  };

  const desenhoPrincipal = forma(principal);
  return {
    largura,
    altura,
    selecionado: desenhoPrincipal,
    vizinhos: proximos.map(forma).filter(aparece),
    pino: desenhoPrincipal.centro,
    metrosPorUnidade: 1 / porMetro,
  };
}

/** Pontos de um polígono no formato do atributo `points` do SVG. */
export function pontosDoSvg(pontos: readonly PontoPlano[]): string {
  return pontos.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

/** Raio, em unidades do desenho, do círculo que representa um prédio sem polígono. */
export function raioSemPoligono(cena: Cena, selecionado: boolean): number {
  const naTela = MEIO_LADO_SEM_POLIGONO_M / cena.metrosPorUnidade;
  return Math.max(selecionado ? 11 : 8, Math.min(naTela, selecionado ? 22 : 16));
}
