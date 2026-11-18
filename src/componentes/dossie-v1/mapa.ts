// Geometria dos mapas do dossiê (Fatia 4): o lote no topo e o lote com as obras na gaveta. Funções puras.
// Longitude e latitude do índice viram metros num plano tangente ao centro do prédio (x para leste, y para o sul, o
// sentido do eixo y do SVG), e daí pixels. Nada aqui inventa polígono: sem polígono no índice, não se desenha lote.
import type { Edificio, ObrasProximas } from "../../dados/contratos";
import { HORARIOS_DO_MAPA, METROS_POR_PAVIMENTO, posicaoSolarRecife, type HorarioSolar } from "../../dados/dossie/solESombra";
import { caminho, poligonoNaCaixa, type Poligono } from "../mapa/geometria";
import { pontoNosAneisDoDesenho } from "../mapa/fundoDoMapaGeometria";

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
  /** Origem do plano local (o centro do prédio, [lon, lat]) e o meio do quadro nesse plano, em metros: com
   * `metrosPorPixel`, a conta inteira de [lon, lat] para o desenho (ver `paraDesenhoDoQuadro` e `caixaDoQuadro`). */
  origem: Coordenada;
  meio: [number, number];
};

/** Opções do enquadramento. Os padrões são os de antes do mapa-base (2.5D e chamadas antigas). */
export type OpcoesDaCena = {
  /** Vão mínimo do quadro, em metros (padrão 80). A gaveta usa `VAO_MINIMO_DA_GAVETA_M`. */
  vaoMinimoM?: number;
  /** Altura mínima do quadro, em metros (padrão: nenhuma além da proporção de vaoMinimoM). Ver VAO_MINIMO_VERTICAL_DA_GAVETA_M. */
  vaoMinimoVerticalM?: number;
  /** Quantos contornos de vizinhos, os mais perto primeiro; null: todos os do quadro (padrão 60). */
  limiteDeVizinhos?: number | null;
};

const ESCALAS_DA_REGUA_M = [10, 20, 25, 50, 100, 200];
/** O desenho nunca mostra menos que isto de largura, para um prédio isolado não aparecer gigante. */
const VAO_MINIMO_M = 80;
/**
 * A gaveta "Mapa do lote" abre em ~220 m com o mapa-base (proposta aprovada, 18/11/2026): rua, quadra e vizinhança à
 * vista, o lote ainda reconhecível; o zoom (até 4×, ~55 m) chega ao lote.
 */
export const VAO_MINIMO_DA_GAVETA_M = 220;
/**
 * Altura mínima do quadro da gaveta. No celular (~340 × 280 px) os 220 m de largura já dão ~180 m de altura; num quadro
 * largo (1280 px, ~600 × 280) dariam só ~100 m e a rua do imóvel saía do quadro (fotos da rodada 1, 18/11/2026).
 */
export const VAO_MINIMO_VERTICAL_DA_GAVETA_M = 160;
const MARGEM_RELATIVA = 0.22;
/** Prédios vizinhos só entram quando o centro cai a esta distância do quadro desenhado. */
const FOLGA_DOS_VIZINHOS_M = 30;
const MAX_VIZINHOS = 60;

/**
 * Os vizinhos (com polígono) cujo centro cai no quadro, os mais perto do prédio primeiro, até `MAX_VIZINHOS`.
 * O índice vem na ordem dos logradouros: cortar nessa ordem (até 16/11/2026) desenhava uma rua inteira a centenas de
 * metros e deixava de fora os lotes colados ao prédio, e o mapa parecia não ter carregado (relato de 16/11/2026).
 */
function vizinhosNoQuadro(
  predio: Edificio,
  vizinhos: readonly Edificio[],
  projetar: (ponto: Coordenada) => [number, number],
  quadro: { meioX: number; meioY: number; metadeX: number; metadeY: number },
  limite: number | null = MAX_VIZINHOS,
): Edificio[] {
  const dentro: { v: Edificio; distancia: number }[] = [];
  for (const v of vizinhos) {
    if (v.id === predio.id || !v.poligono) continue;
    const [cx, cy] = projetar(v.centro);
    if (Math.abs(cx - quadro.meioX) > quadro.metadeX || Math.abs(cy - quadro.meioY) > quadro.metadeY) continue;
    dentro.push({ v, distancia: Math.hypot(cx, cy) });
  }
  const ordenados = dentro.sort((a, b) => a.distancia - b.distancia);
  return (limite === null ? ordenados : ordenados.slice(0, limite)).map((d) => d.v);
}

export function reguaDe(metrosPorPixel: number, larguraMaxima: number): CenaDoLote["regua"] {
  let escolhida = ESCALAS_DA_REGUA_M[0] ?? 10;
  for (const metros of ESCALAS_DA_REGUA_M) {
    if (metros / metrosPorPixel <= larguraMaxima) escolhida = metros;
  }
  return { pixels: escolhida / metrosPorPixel, rotulo: `${escolhida} m` };
}

type QuadroDaCena = Pick<CenaDoLote, "largura" | "altura" | "metrosPorPixel" | "origem" | "meio">;

/**
 * A conta inteira de [lon, lat] para o desenho da cena (escala 1): a projeção do plano local (`projetorDoPlano` em
 * torno de `origem`) seguida dos pixels do quadro. Linear em lon e lat, como pede o fundo do mapa (useFundoDoMapa).
 */
export function paraDesenhoDoQuadro(cena: QuadroDaCena): (ponto: Coordenada) => [number, number] {
  const projetar = projetorDoPlano(cena.origem);
  const { largura, altura, metrosPorPixel } = cena;
  const [meioX, meioY] = cena.meio;
  return (ponto) => {
    const [x, y] = projetar(ponto);
    return [largura / 2 + (x - meioX) / metrosPorPixel, altura / 2 + (y - meioY) / metrosPorPixel];
  };
}

/** Caixa [oeste, sul, leste, norte], em graus, do quadro inteiro da cena na escala 1 (o inverso de `paraDesenhoDoQuadro`). */
export function caixaDoQuadro(cena: QuadroDaCena): [number, number, number, number] {
  const [lon0, lat0] = cena.origem;
  const cosseno = Math.cos((lat0 * Math.PI) / 180);
  const [meioX, meioY] = cena.meio;
  const metadeX = (cena.largura / 2) * cena.metrosPorPixel;
  const metadeY = (cena.altura / 2) * cena.metrosPorPixel;
  const lonDe = (x: number) => lon0 + x / (METROS_POR_GRAU * cosseno);
  const latDe = (y: number) => lat0 - y / METROS_POR_GRAU;
  return [lonDe(meioX - metadeX), latDe(meioY + metadeY), lonDe(meioX + metadeX), latDe(meioY - metadeY)];
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
  opcoes: OpcoesDaCena = {},
): CenaDoLote {
  const vaoMinimo = opcoes.vaoMinimoM ?? VAO_MINIMO_M;
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
  const vaoX = Math.max((maxX - minX) * (1 + 2 * MARGEM_RELATIVA), vaoMinimo);
  const vaoY = Math.max((maxY - minY) * (1 + 2 * MARGEM_RELATIVA), (vaoMinimo * altura) / largura, opcoes.vaoMinimoVerticalM ?? 0);
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
  const contornos = vizinhosNoQuadro(predio, vizinhos, projetar, { meioX, meioY, metadeX, metadeY }, opcoes.limiteDeVizinhos === undefined ? MAX_VIZINHOS : opcoes.limiteDeVizinhos).map((v) =>
    caminhoDe(v.poligono!.map((p) => projetar(p))),
  );

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
    origem: predio.centro,
    meio: [meioX, meioY],
  };
}

export type CategoriaPontoExtra = "praca" | "metro" | "ensino" | "saude" | "rotina";

export type EntradaPontoExtraMapa = {
  id: string;
  categoria: CategoriaPontoExtra;
  rotulo: string;
  detalhe: string;
  coordenada: Coordenada;
  distanciaM: number;
};

export type PontoExtraCena = {
  id: string;
  categoria: CategoriaPontoExtra;
  rotulo: string;
  detalhe: string;
  distanciaM: number;
  x: number;
  y: number;
};

const SETORES_CARDEAIS = ["L", "SE", "S", "SO", "O", "NO", "N", "NE"] as const;

export function direcaoCardealPlano(x: number, y: number): string {
  // No plano local, x > 0 é leste e y > 0 é sul (eixo y do SVG).
  const rad = Math.atan2(y, x);
  const idx = Math.round(rad / (Math.PI / 4));
  return SETORES_CARDEAIS[((idx % 8) + 8) % 8] ?? "N";
}

/**
 * Monta a cena 2D ampliando o enquadramento para incluir pontos próximos (praças, metrô, escolas, saúde
 * e destinos da rotina dentro de `distanciaMaxEnquadramentoM`). Destinos mais distantes voltam em `foraDoQuadro`
 * com direção cardeal para exibição como seta de rumo.
 */
export function montarCenaComPontosExtras(
  predio: Edificio,
  obras: ObrasProximas["recentes"],
  vizinhos: readonly Edificio[],
  largura: number,
  altura: number,
  pontosExtras: readonly EntradaPontoExtraMapa[],
  distanciaMaxEnquadramentoM = 1300,
  opcoes: OpcoesDaCena = {},
): {
  cena: CenaDoLote;
  pontos: PontoExtraCena[];
  foraDoQuadro: (EntradaPontoExtraMapa & { direcao: string })[];
} {
  const vaoMinimo = opcoes.vaoMinimoM ?? VAO_MINIMO_M;
  const projetar = projetorDoPlano(predio.centro);
  const lotePlano = poligonoDoLote(predio);
  const pontosDeObra = obras.map((o) => projetar(o.centro));

  const dentro: { item: EntradaPontoExtraMapa; plano: [number, number] }[] = [];
  const foraDoQuadro: (EntradaPontoExtraMapa & { direcao: string })[] = [];

  for (const item of pontosExtras) {
    const plano = projetar(item.coordenada);
    if (item.distanciaM <= distanciaMaxEnquadramentoM) {
      dentro.push({ item, plano });
    } else {
      foraDoQuadro.push({ ...item, direcao: direcaoCardealPlano(plano[0], plano[1]) });
    }
  }

  const todos: [number, number][] = [
    [0, 0],
    ...(lotePlano ?? []),
    ...pontosDeObra,
    ...dentro.map((d) => d.plano),
  ];
  const xs = todos.map((p) => p[0]);
  const ys = todos.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const vaoX = Math.max((maxX - minX) * (1 + 2 * MARGEM_RELATIVA), vaoMinimo);
  const vaoY = Math.max((maxY - minY) * (1 + 2 * MARGEM_RELATIVA), (vaoMinimo * altura) / largura);
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
  const contornos = vizinhosNoQuadro(predio, vizinhos, projetar, { meioX, meioY, metadeX, metadeY }, opcoes.limiteDeVizinhos === undefined ? MAX_VIZINHOS : opcoes.limiteDeVizinhos).map((v) =>
    caminhoDe(v.poligono!.map((p) => projetar(p))),
  );

  const cena: CenaDoLote = {
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
    origem: predio.centro,
    meio: [meioX, meioY],
  };

  const pontos: PontoExtraCena[] = dentro.map(({ item, plano }) => {
    const [x, y] = paraDesenho(plano);
    return {
      id: item.id,
      categoria: item.categoria,
      rotulo: item.rotulo,
      detalhe: item.detalhe,
      distanciaM: item.distanciaM,
      x,
      y,
    };
  });

  return { cena, pontos, foraDoQuadro };
}

export type VolumeDeEdificio25D = {
  id: string;
  alvo: boolean;
  alturaM: number | null;
  pavimentos: number | null;
  base: string;
  sombra: string[];
  paredes: string[];
  topo: string;
  /** Contorno na cota do andar do apartamento anunciado (somente no edifício alvo quando conhecido). */
  faixaDoAndar: string | null;
  etiquetaAltura: { x: number; y: number; texto: string } | null;
  /** Centro da base no desenho (o chão), para casar com os lotes do fundo do mapa. */
  centroNoChao: [number, number];
  /** Y médio no plano (metros, Sul positivo): a ordem do pintor. */
  centroY: number;
};

export type Cena25DDoLote = CenaDoLote & {
  horario: HorarioSolar;
  elevacaoSolarGraus: number;
  azimuteSolarGraus: number;
  volumes: VolumeDeEdificio25D[];
};

function elevarPonto([px, py]: [number, number], alturaM: number, metrosPorPixel: number): [number, number] {
  // Projeção axonométrica suave: mantém o Norte no topo e eleva os volumes para cima-direita sem distorcer a leitura da rua.
  const pxPorMetro = Math.min(2.2, (1 / metrosPorPixel) * 0.42);
  const h = Math.min(58, alturaM * pxPorMetro);
  return [px + h * 0.24, py - h * 0.92];
}

function montarVolume(
  id: string,
  alvo: boolean,
  planoMetros: [number, number][],
  pavimentos: number | null,
  ate4Pavimentos: boolean | null,
  andarAlvo: number | null,
  sombraPorMetro: [number, number],
  paraDesenho: (p: [number, number]) => [number, number],
  metrosPorPixel: number,
): { centroY: number; volume: VolumeDeEdificio25D } {
  const alturaExata = pavimentos !== null && pavimentos > 0 ? Math.round(pavimentos * METROS_POR_PAVIMENTO * 10) / 10 : null;
  const alturaVisual = alturaExata ?? (ate4Pavimentos ? 9.3 : 0);
  const basePx = planoMetros.map(paraDesenho);
  const topoPx = alturaVisual > 0 ? basePx.map((p) => elevarPonto(p, alturaVisual, metrosPorPixel)) : basePx;

  const sombra: string[] = [];
  if (alturaVisual > 0 && (Math.abs(sombraPorMetro[0]) > 0.01 || Math.abs(sombraPorMetro[1]) > 0.01)) {
    const deslocadoPx = planoMetros
      .map(([x, y]): [number, number] => [x + alturaVisual * sombraPorMetro[0], y + alturaVisual * sombraPorMetro[1]])
      .map(paraDesenho);
    sombra.push(caminho(deslocadoPx));
    for (let i = 0; i < basePx.length; i += 1) {
      const prox = (i + 1) % basePx.length;
      const a = basePx[i]!;
      const b = basePx[prox]!;
      const sa = deslocadoPx[i]!;
      const sb = deslocadoPx[prox]!;
      sombra.push(caminho([a, b, sb, sa]));
    }
  }

  const paredes: string[] = [];
  if (alturaVisual > 0) {
    for (let i = 0; i < basePx.length; i += 1) {
      const prox = (i + 1) % basePx.length;
      paredes.push(caminho([basePx[i]!, basePx[prox]!, topoPx[prox]!, topoPx[i]!]));
    }
  }

  let faixaDoAndar: string | null = null;
  if (alvo && andarAlvo !== null && Number.isFinite(andarAlvo) && alturaVisual > 0) {
    const zAndar = andarAlvo <= 0 ? 1.6 : Math.min(alturaVisual, 1.5 + andarAlvo * METROS_POR_PAVIMENTO);
    faixaDoAndar = caminho(basePx.map((p) => elevarPonto(p, zAndar, metrosPorPixel)));
  }

  const somaX = topoPx.reduce((s, p) => s + p[0], 0);
  const somaY = topoPx.reduce((s, p) => s + p[1], 0);
  const n = topoPx.length || 1;
  const etiquetaAltura =
    alturaExata !== null && (alvo || pavimentos! >= 8)
      ? { x: somaX / n, y: somaY / n - 4, texto: `${Math.round(alturaExata)}m` }
      : null;

  const centroY = planoMetros.reduce((s, p) => s + p[1], 0) / (planoMetros.length || 1);

  return {
    centroY,
    volume: {
      id,
      alvo,
      alturaM: alturaExata,
      pavimentos,
      base: caminho(basePx),
      sombra,
      paredes,
      topo: caminho(topoPx),
      faixaDoAndar,
      etiquetaAltura,
      centroNoChao: [basePx.reduce((s, p) => s + p[0], 0) / (basePx.length || 1), basePx.reduce((s, p) => s + p[1], 0) / (basePx.length || 1)],
      centroY,
    },
  };
}

/**
 * Monta a cena axonométrica 2.5D com volume real (em metros) do edifício e dos vizinhos, sombra projetada
 * para o horário escolhido no Recife e destaque da cota do andar anunciado.
 */
export function montarCena25DDoLote(
  predio: Edificio,
  obras: ObrasProximas["recentes"],
  vizinhos: readonly Edificio[],
  largura: number,
  altura: number,
  horario: HorarioSolar = "tarde",
  andarAlvo: number | null = null,
  opcoes: OpcoesDaCena = {},
): Cena25DDoLote {
  // O limite de 60 volumes vale sempre no 2.5D; o enquadramento (vão mínimo) segue as opções, como na planta.
  const base = montarCenaDoLote(predio, obras, vizinhos, largura, altura, { ...opcoes, limiteDeVizinhos: MAX_VIZINHOS });
  const projetar = projetorDoPlano(predio.centro);
  const lotePlano = poligonoDoLote(predio);
  const pontosDeObra = obras.map((o) => projetar(o.centro));
  const todos: [number, number][] = [[0, 0], ...(lotePlano ?? []), ...pontosDeObra];
  const xs = todos.map((p) => p[0]);
  const ys = todos.map((p) => p[1]);
  const meioX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const meioY = (Math.min(...ys) + Math.max(...ys)) / 2;

  // Reserva leve folga vertical inferior/superior para acomodar a extrusão dos prédios altos.
  const paraDesenho = ([x, y]: [number, number]): [number, number] => [
    largura / 2 + (x - meioX) / base.metrosPorPixel,
    altura * 0.56 + (y - meioY) / base.metrosPorPixel,
  ];

  const horaConfig = HORARIOS_DO_MAPA.find((h) => h.id === horario) ?? HORARIOS_DO_MAPA[2]!;
  const sol = posicaoSolarRecife(horaConfig.horaLocal, predio.centro, "equinocio");

  const metadeX = (largura / 2) * base.metrosPorPixel + FOLGA_DOS_VIZINHOS_M;
  const metadeY = (altura / 2) * base.metrosPorPixel + FOLGA_DOS_VIZINHOS_M;

  const candidatos: { centroY: number; volume: VolumeDeEdificio25D }[] = [];
  for (const v of vizinhosNoQuadro(predio, vizinhos, projetar, { meioX, meioY, metadeX, metadeY })) {
    candidatos.push(
      montarVolume(
        v.id,
        false,
        v.poligono!.map((p) => projetar(p)),
        v.pavimentos,
        v.ate4Pavimentos,
        null,
        sol.sombraPorMetro,
        paraDesenho,
        base.metrosPorPixel,
      ),
    );
  }

  if (lotePlano) {
    candidatos.push(
      montarVolume(
        predio.id,
        true,
        lotePlano,
        predio.pavimentos,
        predio.ate4Pavimentos,
        andarAlvo,
        sol.sombraPorMetro,
        paraDesenho,
        base.metrosPorPixel,
      ),
    );
  }

  // Algoritmo do pintor: desenha de Norte (menor Y) para Sul (maior Y) para que volumes frontais sobreponham os de trás.
  candidatos.sort((a, b) => a.centroY - b.centroY);

  const pinoBase = paraDesenho([0, 0]);
  const alturaPino = predio.pavimentos ? predio.pavimentos * METROS_POR_PAVIMENTO : predio.ate4Pavimentos ? 9.3 : 0;
  const pinoElevado = alturaPino > 0 ? elevarPonto(pinoBase, alturaPino, base.metrosPorPixel) : pinoBase;

  return {
    ...base,
    // O meio que faz `paraDesenhoDoQuadro` repetir a conta deste desenho (deslocado na vertical para caber a extrusão).
    meio: [meioX, meioY - (altura * 0.56 - altura / 2) * base.metrosPorPixel],
    pino: pinoElevado,
    obras: pontosDeObra.map((p, i) => {
      const [x, y] = paraDesenho(p);
      return { numero: i + 1, categoria: obras[i]?.categoria ?? "construcao", x, y };
    }),
    horario,
    elevacaoSolarGraus: Math.round(sol.elevacaoGraus),
    azimuteSolarGraus: Math.round(sol.azimuteGraus),
    volumes: candidatos.map((c) => c.volume),
  };
}

/** Lote do fundo do mapa, no desenho (o `LoteNoDesenho` do fundo, só o que o volume usa). */
export type LoteDoChao = {
  readonly aneis: readonly Float64Array[];
  readonly caixa: readonly [number, number, number, number];
  readonly pavimentos: number | null;
  readonly noIndice: boolean;
  readonly doImovel: boolean;
};

/**
 * Acrescenta à cena 2.5D os prédios do índice que o fundo do mapa traz e o índice do bairro não (os do bairro ao lado,
 * do outro lado da divisa): lotes `noIndice` com pavimentos, que não contêm o centro de nenhum volume já desenhado.
 * Os mais perto do pino primeiro, sem passar de `MAX_VIZINHOS` vizinhos no total. Função pura.
 */
export function comVolumesDoChao(cena: Cena25DDoLote, lotes: readonly LoteDoChao[], centro: Coordenada): Cena25DDoLote {
  const vizinhosJa = cena.volumes.filter((v) => !v.alvo).length;
  const vagas = MAX_VIZINHOS - vizinhosJa;
  if (vagas <= 0 || lotes.length === 0) return cena;
  const { largura, altura, metrosPorPixel: mpp } = cena;
  const [meioX, meioY] = cena.meio;
  const paraDesenho = ([x, y]: [number, number]): [number, number] => [largura / 2 + (x - meioX) / mpp, altura / 2 + (y - meioY) / mpp];
  const paraPlano = (px: number, py: number): [number, number] => [meioX + (px - largura / 2) * mpp, meioY + (py - altura / 2) * mpp];
  const [chaoX, chaoY] = paraDesenho([0, 0]);
  const horaConfig = HORARIOS_DO_MAPA.find((h) => h.id === cena.horario) ?? HORARIOS_DO_MAPA[2]!;
  const sol = posicaoSolarRecife(horaConfig.horaLocal, centro, "equinocio");
  const centros = cena.volumes.map((v) => v.centroNoChao);
  const candidatos = lotes
    .filter((l) => l.noIndice && !l.doImovel && l.pavimentos !== null && l.pavimentos > 0 && l.aneis.length > 0)
    .filter((l) => !centros.some(([x, y]) => x >= l.caixa[0] && x <= l.caixa[2] && y >= l.caixa[1] && y <= l.caixa[3] && pontoNosAneisDoDesenho(x, y, l.aneis)))
    .map((l) => ({ l, d: Math.hypot((l.caixa[0] + l.caixa[2]) / 2 - chaoX, (l.caixa[1] + l.caixa[3]) / 2 - chaoY) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, vagas);
  if (candidatos.length === 0) return cena;
  const novos = candidatos.map(({ l }, i) => {
    const anel = l.aneis[0]!;
    const plano: [number, number][] = [];
    for (let k = 0; k + 1 < anel.length; k += 2) plano.push(paraPlano(anel[k]!, anel[k + 1]!));
    return montarVolume(`chao-${i}`, false, plano, l.pavimentos, null, null, sol.sombraPorMetro, paraDesenho, mpp).volume;
  });
  const volumes = [...cena.volumes, ...novos].sort((a, b) => a.centroY - b.centroY);
  return { ...cena, volumes };
}
