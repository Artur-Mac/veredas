// Contrato do mapa-base em memória (18/11/2026). Só tipos e constantes: nenhuma lógica, nenhum dado.
//
// O mapa-base são as bases abertas da Prefeitura do Recife (quadras, lotes, trechos de logradouro, bairros, recursos
// hídricos, parques e praças; licença ODbL) recortadas por bairro por scripts/dados/construir-mapa-base.mjs e publicadas
// pelo sistema de camadas (src/dados/camadas.ts, D036). Este arquivo é a fronteira entre duas metades:
// - a LEITURA (src/dados/recife/mapaBase.ts) confere e decodifica o arquivo publicado e entrega estes tipos;
// - o DESENHO (src/componentes/mapa/fundoDoMapa.ts e FundoDoMapa.tsx) só conhece estes tipos, nunca o formato do arquivo.
// O formato do arquivo em disco (JSON com diferenças) é assunto do pipeline e da leitura; pode mudar sem tocar o desenho.
//
// Plano local de cada arquivo, a partir de `origem` = [lon, lat] (CRS84, como o portal publica):
//   x = (lon − lon0) × METROS_POR_GRAU × cos(lat0)   cresce para o leste
//   y = −(lat − lat0) × METROS_POR_GRAU              cresce para o SUL, como o eixo y do SVG
// É a mesma projeção de `projetorDoPlano` (src/componentes/dossie-v1/mapa.ts) e `projetorLocal`
// (src/componentes/predio/projecao.ts). As coordenadas são inteiros em DECÍMETROS (0,1 m).
// Quem desenha num plano com outra origem (o centro do prédio) converte por uma transformação afim: as duas projeções
// são lineares em lon e lat, então bastam dois fatores de escala e um deslocamento, sem passar ponto a ponto por lon/lat.

/** Versão do formato. Arquivo com outra versão é recusado pela leitura, nunca "aproveitado". */
export const VERSAO_DO_MAPA_BASE = 1;

/** Metros por grau de latitude na esfera de raio médio (6.371.008,8 m): a constante de `projetorDoPlano`. */
export const METROS_POR_GRAU = (Math.PI / 180) * 6371008.8;

/** Unidades do plano local por metro: as coordenadas são decímetros inteiros. */
export const UNIDADES_POR_METRO = 10;

/** [lon, lat] em graus. */
export type OrigemDoPlano = readonly [number, number];

/**
 * Pontos em decímetros no plano local do arquivo: [x0, y0, x1, y1, …].
 * Anel de polígono: fechado por definição, NÃO repete o primeiro ponto no fim, no mínimo 3 pontos.
 * Linha de rua: aberta, no mínimo 2 pontos.
 */
export type Pontos = Int32Array;

/** Caixa envolvente em decímetros: [minX, minY, maxX, maxY]. */
export type Caixa = readonly [number, number, number, number];

/** `aneis[0]` é o contorno; os demais são furos (preenchimento par-ímpar). Um MultiPolygon da base vira vários. */
export type PoligonoBase = { readonly aneis: readonly Pontos[]; readonly caixa: Caixa };

/** Quadra: só a forma. Quadra sem lote dentro continua sendo só quadra: nada é completado. */
export type QuadraBase = PoligonoBase;

export type LoteBase = PoligonoBase & {
  /** Pavimentos na base de Lotes; null quando a base não traz. */
  readonly pavimentos: number | null;
  /** O lote é de um prédio do índice ativo do Vereda ("prédios que o Vereda conhece"). */
  readonly noIndice: boolean;
  /** Posição em `quadras` da quadra que contém o lote (ligação pela geometria, não pelo código), ou -1. */
  readonly quadra: number;
};

export type RuaBase = {
  /** Nome curto de exibição (NLGPAVRESU), ex.: "R. Major Armando de Souza Mello", "Av. Boa Viagem". Nunca vazio. */
  readonly nome: string;
  /**
   * Código do logradouro (CLOGRACODI): o prefixo do id do prédio no índice ("8001-216" → 8001). É por ele que o
   * desenho acha a rua do imóvel. null quando a base não traz.
   */
  readonly codigo: number | null;
  /** Avenida pelo nome ("Av. …"). */
  readonly avenida: boolean;
  /** Corredor de transporte (campo CT). */
  readonly corredor: boolean;
  /** Perimetral (campo NMPERIMETR). */
  readonly perimetral: boolean;
  /** Trechos da rua dentro do recorte, cada um uma linha aberta. */
  readonly linhas: readonly Pontos[];
  readonly caixa: Caixa;
};

export type TipoDeAgua = "oceano" | "rio" | "canal" | "lago" | "outro";

export type AguaBase = PoligonoBase & { readonly nome: string | null; readonly tipo: TipoDeAgua };

export type PracaBase = PoligonoBase & { readonly nome: string | null; readonly tipo: "praca" | "parque" };

export type DivisaDoBairro = {
  /** Slug como em src/dados/recife/bairros.ts ("boa-viagem"). O nome de exibição com acento vem de lá, pelo slug. */
  readonly slug: string;
  /** Nome oficial como a base de Bairros publica; só reserva para quando o slug não estiver em bairros.ts. */
  readonly nome: string;
  readonly partes: readonly PoligonoBase[];
};

/**
 * Um arquivo por bairro: tudo o que toca o bairro mais uma borda de 300 m, para a divisa não ficar vazia.
 * Feições da borda pertencem aos vizinhos e aparecem também no arquivo deles, com a mesma geometria.
 */
export type MapaBaseDoBairro = {
  readonly versao: typeof VERSAO_DO_MAPA_BASE;
  readonly bairro: string;
  readonly origem: OrigemDoPlano;
  /** A divisa do próprio bairro, na precisão do arquivo. */
  readonly divisa: DivisaDoBairro;
  readonly quadras: readonly QuadraBase[];
  /** Pode ser decodificado só na primeira leitura: quem desenha de longe não paga pelos lotes. */
  readonly lotes: readonly LoteBase[];
  readonly ruas: readonly RuaBase[];
  readonly agua: readonly AguaBase[];
  readonly pracas: readonly PracaBase[];
  /**
   * Tabuleiros de pontes e viadutos (base "Pontes do Recife"): só a forma, sem nome (a base não traz). São chão de rua
   * por cima da água: é o que mostra por onde se atravessa o Capibaribe e os canais. Vazio onde não há ponte.
   */
  readonly pontes: readonly PoligonoBase[];
};

/**
 * Um arquivo para a cidade inteira, simplificado: serve aos quadros de mais de ~3 km (bairros, água, avenidas), aos
 * nomes e divisas dos bairros vizinhos em qualquer escala e à hachura de "fora do Recife".
 */
export type MapaBaseDaCidade = {
  readonly versao: typeof VERSAO_DO_MAPA_BASE;
  readonly origem: OrigemDoPlano;
  /** Os bairros do Recife na base de Bairros. */
  readonly bairros: readonly DivisaDoBairro[];
  /** Corpos d'água que se leem de longe (oceano, rios, canais e lagoas maiores). */
  readonly agua: readonly AguaBase[];
  /** Avenidas, corredores de transporte e perimetrais. */
  readonly vias: readonly RuaBase[];
};
