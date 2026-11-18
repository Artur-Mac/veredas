// Fundo do mapa (mapa-base, 18/11/2026): transforma o mapa-base em memória (src/dados/recife/mapaBaseContrato.ts) numa
// cena pronta para desenhar no <Svg> de qualquer mapa do app. Puro: sem React, sem rede, sem data, sem acaso.
//
// - Nível pela escala NA TELA, em metros por pixel (já contando o zoom), não pela largura do quadro em metros.
// - Uma forma por camada: um único caminho SVG com todos os anéis (medido no Chrome com CPU 4× mais lenta, 7 mil
//   polígonos juntos desenham em 24 ms contra 114 ms separados; no nativo cada elemento é um objeto).
// - A cena é montada para o quadro inteiro na escala 1 (a pessoa arrasta), com traços e textos já divididos pelo zoom.
//   Os rótulos são calculados por passo de zoom e ficam parados no arraste.
// - Nada é completado: quadra sem lote fica quadra sem lote; fora de bairro carregado é hachura ("sem dado").
import { bairroPorSlug } from "../../dados/recife/bairros";
import { quadroCobertoPelosBairros, type CaixaEmGraus } from "../../dados/recife/mapaBase";
import { METROS_POR_GRAU, UNIDADES_POR_METRO } from "../../dados/recife/mapaBaseContrato";
import type {
  Caixa,
  DivisaDoBairro,
  LoteBase,
  MapaBaseDaCidade,
  MapaBaseDoBairro,
  PoligonoBase,
  RuaBase,
} from "../../dados/recife/mapaBaseContrato";
import {
  afimDoArquivo,
  anelNoDesenho,
  caixaNoDesenho,
  caminhoDaHachura,
  distanciaAosAneis,
  noPlano,
  pixelsPorMetro,
  pontoNosAneis,
  pontoNosAneisDoDesenho,
  recortarLinha,
  retanguloNoPlano,
  seTocam,
  trechoDoCaminho,
  type Afim,
  type ParaDesenho,
  type Retangulo,
} from "./fundoDoMapaGeometria";
import {
  posicionarNomesDeBairro,
  posicionarRotulosDeRua,
  type BairroParaNome,
  type CandidatoDeRua,
  type NomeDeBairro,
  type RotuloDeRua,
} from "./fundoDoMapaRotulos";

export type { NomeDeBairro, RotuloDeRua, TipoDeRotulo } from "./fundoDoMapaRotulos";

/**
 * Nível de lote enquanto a escala NA TELA (já contando o zoom) for de até 2,4 metros por pixel: 800 m num quadro de
 * 340 px. Um lote de 10 a 12 m de frente ainda tem 4 a 5 px e se distingue do vizinho; acima disso os lotes viram
 * textura e só pesam. Decidido por m/px, não pela largura em metros: num quadro de 1240 px a 802 m (0,65 m/px) os lotes
 * têm 15 px ou mais e aparecem. A especificação fala em ~600 m (1,8 m/px em 340 px); o desvio está no relatório da noite.
 */
export const LOTES_ATE_M_POR_PX = 2.4;
/** Nível de quadras até 8,8 m/px (3 km em 340 px); acima, só bairros, água e avenidas. */
export const QUADRAS_ATE_M_POR_PX = 8.8;

/** Nível pela escala na tela, em metros por pixel. */
export function nivelDaEscala(metrosPorPx: number): NivelDoFundo {
  return metrosPorPx <= LOTES_ATE_M_POR_PX ? "lote" : metrosPorPx <= QUADRAS_ATE_M_POR_PX ? "bairro" : "cidade";
}

export type NivelDoFundo = "lote" | "bairro" | "cidade";

export type QuadroDoFundo = {
  /** Tamanho do desenho, em px, na escala 1. */
  readonly largura: number;
  readonly altura: number;
  /** A conta do mapa que hospeda: [lon, lat] → [x, y] no desenho, na escala 1. Tem de ser linear em lon e lat. */
  readonly paraDesenho: ParaDesenho;
  /** Zoom aplicado pelo mapa por transform de grupo (1 sem zoom), em torno do centro do quadro. */
  readonly zoom?: number;
  /**
   * Retângulos [x0, y0, x1, y1] ocupados pelo mapa que hospeda por cima do desenho (selo, régua, crédito, botões), em px da
   * TELA. Rótulos de rua e nomes de bairro desviam deles. Valem para a vista sem arraste: o grupo de zoom
   * `translate(cx + dx, cy + dy) scale(zoom) translate(-cx, -cy)` com o `deslocamento` [dx, dy] abaixo.
   */
  readonly obstaculos?: readonly (readonly [number, number, number, number])[];
  /** Deslocamento [dx, dy] do grupo de zoom em px da tela (o do zoom com foco no pino); [0, 0] se omitido. */
  readonly deslocamento?: readonly [number, number];
};

export type ImovelDoFundo = {
  /** Centro do prédio, [lon, lat]. */
  readonly centro: readonly [number, number];
  /** Código do logradouro (o prefixo do id do prédio no índice: "8001-216" → 8001), ou null. */
  readonly codigoDoLogradouro: number | null;
};

export type EntradaDoFundo = {
  /** Os arquivos de bairro carregados (zero ou mais). */
  readonly bairros: readonly MapaBaseDoBairro[];
  readonly cidade: MapaBaseDaCidade | null;
  /** Slug do bairro do imóvel, ou null. */
  readonly bairroDoImovel: string | null;
  readonly imovel: ImovelDoFundo | null;
  readonly quadro: QuadroDoFundo;
};

/** Um caminho SVG por camada, de baixo para cima. String vazia: a camada não desenha nada. */
export type CamadasDoFundo = {
  /** Hachura a 45° sobre o quadro todo; o chão cobre onde há dado. */
  readonly hachura: string;
  /** Dentro dos bairros com dado (a cor da rua: rua é o espaço entre quadras). */
  readonly chao: string;
  /**
   * Chão dos bairros vizinhos que só vêm do arquivo da cidade (divisa de 2 m), quando a borda de 300 m dos arquivos
   * carregados cobre o quadro: as quadras e os lotes do vizinho vêm dessa borda. Desenhado com traço da cor do chão para
   * fechar a emenda com a divisa fina do arquivo do bairro. Opcional: ausente é vazio.
   */
  readonly chaoDaCidade?: string;
  /** Bairro do imóvel levemente tingido (só no nível de 1 a 3 km). */
  readonly tintaDoBairro: string;
  readonly quadras: string;
  readonly lotes: string;
  readonly predios: string;
  readonly pracas: string;
  readonly agua: string;
  /** Tabuleiros de pontes e viadutos, na cor do chão, por cima da água (níveis de lote e de quadras). */
  readonly pontes: string;
  /** Avenidas como linha (só no nível de cidade, onde não há quadra para a rua aparecer como vão). */
  readonly vias: string;
  readonly divisas: string;
  readonly divisaDoImovel: string;
  /**
   * O lote do imóvel, nos níveis de lote E de quadras: é a camada "lote do imóvel" da tabela da seção 4, que não tem
   * restrição de nível (decisão do orquestrador, 18/11/2026). Some só no nível de cidade, onde não há arquivo de lote.
   */
  readonly loteDoImovel: string;
};

/** Lote guardado para o toque: anéis no desenho. */
export type LoteNoDesenho = {
  readonly aneis: readonly Float64Array[];
  readonly caixa: Retangulo;
  readonly pavimentos: number | null;
  readonly noIndice: boolean;
  readonly doImovel: boolean;
};

export type CenaDoFundo = {
  readonly largura: number;
  readonly altura: number;
  readonly zoom: number;
  readonly nivel: NivelDoFundo;
  /** Largura do quadro visível, em metros, já contando o zoom. */
  readonly larguraEmMetros: number;
  /** Escala na tela, já contando o zoom: o que decide o nível. */
  readonly metrosPorPx: number;
  /** Passo da hachura e espessuras de referência já divididos pelo zoom (unidades da cena). */
  readonly camadas: CamadasDoFundo;
  readonly rotulos: readonly RotuloDeRua[];
  readonly bairros: readonly NomeDeBairro[];
  /** Nome do bairro para o selo "BAIRRO / Boa Viagem" (só no nível de lote). */
  readonly selo: string | null;
  /** O que a descrição acessível diz. */
  readonly acessibilidade: { readonly rua: string | null; readonly bairro: string | null; readonly distanciaDaDivisaM: number | null };
  readonly lotes: readonly LoteNoDesenho[];
  /** Existe algum dado para desenhar (senão o mapa fica como hoje e não leva crédito). */
  readonly temDado: boolean;
};

const PASSO_DA_HACHURA_PX = 7;
/** O lote do imóvel é obstáculo dos nomes de rua enquanto a caixa dele ocupa até esta fração do quadro. */
const FRACAO_DO_LOTE_OBSTACULO = 0.12;
/** Pontos mais perto que isto (px na tela) não mudam o desenho. */
const TOLERANCIA_PX = 0.4;
/** Quadras menores que isto (px no desenho) somem no nível de bairro. */
const QUADRA_MINIMA_PX = 0.8;

function nomeDeExibicao(slug: string, reserva: string): string {
  return bairroPorSlug(slug)?.nome ?? reserva;
}

/** Evita a mesma feição duas vezes quando vem de dois arquivos (borda de 300 m): mesma caixa no desenho e mesmo número de pontos. */
class Vistos {
  private readonly celulas = new Map<string, number[][]>();
  /** true se é nova (e passa a ser conhecida). */
  novo(c: Retangulo, n: number): boolean {
    const cx = (c[0] + c[2]) / 2;
    const cy = (c[1] + c[3]) / 2;
    const gx = Math.floor(cx);
    const gy = Math.floor(cy);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const lista = this.celulas.get(`${gx + i}:${gy + j}`);
        if (lista?.some(([x, y, w, h, m]) => m === n && Math.abs(x! - cx) < 0.3 && Math.abs(y! - cy) < 0.3 && Math.abs(w! - (c[2] - c[0])) < 0.6 && Math.abs(h! - (c[3] - c[1])) < 0.6)) {
          return false;
        }
      }
    }
    const chave = `${gx}:${gy}`;
    const lista = this.celulas.get(chave) ?? [];
    lista.push([cx, cy, c[2] - c[0], c[3] - c[1], n]);
    this.celulas.set(chave, lista);
    return true;
  }
}

type Arquivo = { afim: Afim };

function pontosTotais(p: PoligonoBase): number {
  let n = 0;
  for (const a of p.aneis) n += a.length;
  return n;
}

type Desempenho = { now: () => number; mark: (n: string) => unknown; measure: (n: string, o: { start: number; end: number }) => unknown };

/** A API performance, só quando existe por inteiro (web, Node recente); senão null e nada é medido. */
export function desempenhoDoAmbiente(): Desempenho | null {
  const p = (globalThis as { performance?: Partial<Desempenho> }).performance;
  return p && typeof p.mark === "function" && typeof p.measure === "function" && typeof p.now === "function" ? (p as Desempenho) : null;
}

/** performance.measure(nome) de `inicio` até agora; nunca lança (medir é só para a verificação). */
export function registrarMedida(nome: string, inicio: number): void {
  const p = desempenhoDoAmbiente();
  if (!p) return;
  try {
    p.measure(nome, { start: inicio, end: p.now() });
  } catch {
    // ambiente sem measure com opções: sem medida
  }
}

// Fim da montagem de cada cena (performance.now), para "fundo-do-mapa:desenhar" começar dali. Lido uma vez só.
const fimDaMontagem = new WeakMap<CenaDoFundo, number>();

/** O instante em que a cena acabou de ser montada, só na primeira consulta (depois, null). */
export function tomarFimDaMontagem(cena: CenaDoFundo): number | null {
  const t = fimDaMontagem.get(cena);
  if (t === undefined) return null;
  fimDaMontagem.delete(cena);
  return t;
}

let montagens = 0;
/** Quantas cenas foram montadas desde o início (para os testes: uma montagem por abertura do mapa). */
export function contarMontagensDoFundo(): number {
  return montagens;
}

/** Monta a cena do fundo. Mesma entrada, mesma cena. Mede "fundo-do-mapa" quando há a API performance. */
export function montarFundoDoMapa(entrada: EntradaDoFundo): CenaDoFundo {
  montagens += 1;
  const p = desempenhoDoAmbiente();
  if (!p) return montar(entrada);
  const inicio = p.now();
  const cena = montar(entrada);
  registrarMedida("fundo-do-mapa", inicio);
  fimDaMontagem.set(cena, p.now());
  return cena;
}

const CAMADAS_VAZIAS: CamadasDoFundo = {
  hachura: "",
  chao: "",
  chaoDaCidade: "",
  tintaDoBairro: "",
  quadras: "",
  lotes: "",
  predios: "",
  pracas: "",
  agua: "",
  pontes: "",
  vias: "",
  divisas: "",
  divisaDoImovel: "",
  loteDoImovel: "",
};

function montar(entrada: EntradaDoFundo): CenaDoFundo {
  const { largura, altura, paraDesenho } = entrada.quadro;
  const zoom = entrada.quadro.zoom && entrada.quadro.zoom > 0 ? entrada.quadro.zoom : 1;
  const quadro: Retangulo = [0, 0, largura, altura];
  const arquivos = entrada.bairros.map((b) => ({ base: b, afim: afimDoArquivo(b.origem, paraDesenho) }));
  const cidade = entrada.cidade ? { base: entrada.cidade, afim: afimDoArquivo(entrada.cidade.origem, paraDesenho) } : null;
  const referencia = arquivos[0]?.afim ?? cidade?.afim;
  if (!referencia) {
    return {
      largura,
      altura,
      zoom,
      nivel: "lote",
      larguraEmMetros: NaN,
      metrosPorPx: NaN,
      camadas: CAMADAS_VAZIAS,
      rotulos: [],
      bairros: [],
      selo: null,
      acessibilidade: { rua: null, bairro: entrada.bairroDoImovel ? nomeDeExibicao(entrada.bairroDoImovel, entrada.bairroDoImovel) : null, distanciaDaDivisaM: null },
      lotes: [],
      temDado: false,
    };
  }
  const metrosPorPx = 1 / (pixelsPorMetro(referencia) * zoom);
  const larguraEmMetros = largura * metrosPorPx;
  const nivel = nivelDaEscala(metrosPorPx);
  // Sem arquivo de bairro, só a cidade serve, em qualquer escala.
  const daCidade = nivel === "cidade" || arquivos.length === 0;
  const tolerancia = TOLERANCIA_PX / zoom;
  const slugDoImovel = entrada.bairroDoImovel;

  // Pré-filtro no plano de cada arquivo (folga de 4 px, maior que a de naCena): descarta sem alocar nada.
  const noPlanoDoQuadro = new Map<Afim, Caixa>();
  const planoDe = (a: Arquivo) => {
    let c = noPlanoDoQuadro.get(a.afim);
    if (!c) {
      c = retanguloNoPlano(a.afim, [-4, -4, largura + 4, altura + 4]);
      noPlanoDoQuadro.set(a.afim, c);
    }
    return c;
  };
  const naCena = (a: Arquivo, c: Caixa, folga = 1) => {
    const p = planoDe(a);
    if (c[2] < p[0] || c[0] > p[2] || c[3] < p[1] || c[1] > p[3]) return null;
    const r = caixaNoDesenho(a.afim, c);
    return seTocam(r, [-folga, -folga, largura + folga, altura + folga]) ? r : null;
  };
  const caminhoDoPoligono = (a: Arquivo, p: PoligonoBase) => p.aneis.map((anel) => trechoDoCaminho(anel, a.afim, quadro, tolerancia, true)).join("");

  /** Uma camada de polígonos de vários arquivos, sem repetir a feição da borda. */
  function camada<T extends PoligonoBase>(fontes: { a: Arquivo; itens: readonly T[] }[], aceitar?: (p: T, r: Retangulo) => boolean): string {
    const vistos = new Vistos();
    const partes: string[] = [];
    for (const { a, itens } of fontes) {
      for (const p of itens) {
        const r = naCena(a, p.caixa);
        if (!r) continue;
        if (aceitar && !aceitar(p, r)) continue;
        if (!vistos.novo(r, pontosTotais(p))) continue;
        partes.push(caminhoDoPoligono(a, p));
      }
    }
    return partes.join("");
  }

  // ---------- Divisas: dos arquivos de bairro (precisão do arquivo) e da cidade (os vizinhos sem arquivo) ----------
  type Divisa = { a: Arquivo; divisa: DivisaDoBairro; carregado: boolean };
  const divisas: Divisa[] = [];
  const slugs = new Set<string>();
  if (!daCidade) {
    for (const arq of arquivos) {
      if (slugs.has(arq.base.divisa.slug)) continue;
      slugs.add(arq.base.divisa.slug);
      divisas.push({ a: arq, divisa: arq.base.divisa, carregado: true });
    }
  }
  if (cidade) {
    for (const d of cidade.base.bairros) {
      if (slugs.has(d.slug)) continue;
      slugs.add(d.slug);
      divisas.push({ a: cidade, divisa: d, carregado: daCidade });
    }
  }
  const divisasNaCena = divisas.filter((d) => d.divisa.partes.some((p) => naCena(d.a, p.caixa, 2)));
  const caminhoDaDivisa = (d: Divisa) => d.divisa.partes.map((p) => caminhoDoPoligono(d.a, p)).join("");
  const doImovel = divisasNaCena.find((d) => d.divisa.slug === slugDoImovel) ?? null;

  const chao = divisasNaCena.filter((d) => d.carregado).map(caminhoDaDivisa).join("");
  // O vizinho sem arquivo próprio ganha chão (da cidade) só se a borda de 300 m dos arquivos carregados cobre o quadro
  // inteiro: aí tudo o que é Recife no quadro tem as quadras vindas dessa borda. Senão continua "sem dado".
  const vizinhosDaCidade = !daCidade && cidade ? divisasNaCena.filter((d) => !d.carregado) : [];
  const chaoDaCidade = vizinhosDaCidade.length > 0 && bordaCobreOQuadro(arquivos, largura, altura) ? vizinhosDaCidade.map(caminhoDaDivisa).join("") : "";
  const tintaDoBairro = nivel === "bairro" && doImovel ? caminhoDaDivisa(doImovel) : "";
  const divisasOutras = divisasNaCena.filter((d) => d !== doImovel).map(caminhoDaDivisa).join("");
  const divisaDoImovel = doImovel ? caminhoDaDivisa(doImovel) : "";

  // ---------- Quadras, lotes, prédios do índice, praças, água ----------
  const deArquivos = <T>(f: (b: MapaBaseDoBairro) => readonly T[]) => arquivos.map((arq) => ({ a: arq as Arquivo, itens: f(arq.base) }));
  const quadras = daCidade
    ? ""
    : camada(deArquivos((b) => b.quadras), nivel === "bairro" ? (_p, r) => r[2] - r[0] >= QUADRA_MINIMA_PX || r[3] - r[1] >= QUADRA_MINIMA_PX : undefined);
  const pracas = daCidade ? "" : camada(deArquivos((b) => b.pracas));
  const fontesDaAgua = daCidade && cidade ? [{ a: cidade as Arquivo, itens: cidade.base.agua }] : deArquivos((b) => b.agua);
  const agua = camada(fontesDaAgua);
  // Pontes: chão de rua por cima da água, uma forma só (o arquivo da cidade não tem pontes).
  const pontes = daCidade ? "" : camada(deArquivos((b) => b.pontes ?? []));

  // O lote do imóvel: o que contém o centro do prédio, achado pela geometria.
  let loteDoImovel: { a: Arquivo; lote: LoteBase } | null = null;
  if (entrada.imovel && !daCidade) {
    for (const arq of arquivos) {
      const [x, y] = noPlano(arq.base.origem, entrada.imovel.centro);
      const achado = arq.base.lotes.find((l) => x >= l.caixa[0] && x <= l.caixa[2] && y >= l.caixa[1] && y <= l.caixa[3] && pontoNosAneis(x, y, l.aneis));
      if (achado) {
        loteDoImovel = { a: arq, lote: achado };
        break;
      }
    }
  }

  const lotesDoToque: LoteNoDesenho[] = [];
  let lotes = "";
  let predios = "";
  if (nivel === "lote" && !daCidade) {
    const vistos = new Vistos();
    const partesLotes: string[] = [];
    const partesPredios: string[] = [];
    for (const arq of arquivos) {
      for (const l of arq.base.lotes) {
        const r = naCena(arq, l.caixa);
        if (!r || !vistos.novo(r, pontosTotais(l))) continue;
        const eDoImovel = loteDoImovel?.lote === l;
        lotesDoToque.push({ aneis: l.aneis.map((anel) => anelNoDesenho(anel, arq.afim)), caixa: r, pavimentos: l.pavimentos, noIndice: l.noIndice, doImovel: eDoImovel });
        if (eDoImovel) continue;
        (l.noIndice ? partesPredios : partesLotes).push(caminhoDoPoligono(arq, l));
      }
    }
    lotes = partesLotes.join("");
    predios = partesPredios.join("");
  }

  // ---------- Vias como linha (só cidade) ----------
  let vias = "";
  if (daCidade && cidade) {
    const partes: string[] = [];
    for (const v of cidade.base.vias) {
      if (!naCena(cidade, v.caixa)) continue;
      for (const l of v.linhas) partes.push(trechoDoCaminho(l, cidade.afim, quadro, tolerancia, false));
    }
    vias = partes.join("");
  }

  // ---------- Rótulos: a rua do imóvel, depois os nomes de bairro, depois as outras ruas ----------
  const inset: Retangulo = [10 / zoom, 10 / zoom, largura - 10 / zoom, altura - 10 / zoom];
  const codigo = entrada.imovel?.codigoDoLogradouro ?? null;
  // No nível de cidade as ruas vêm das avenidas da cidade; a rua do imóvel (que a cidade não tem) é procurada nos
  // arquivos de bairro carregados.
  const ruas: { a: Arquivo; rua: RuaBase }[] = daCidade
    ? [
        ...(cidade ? cidade.base.vias.map((rua) => ({ a: cidade as Arquivo, rua })) : []),
        ...(codigo === null ? [] : arquivos.flatMap((arq) => arq.base.ruas.filter((r) => r.codigo === codigo).map((rua) => ({ a: arq as Arquivo, rua })))),
      ]
    : arquivos.flatMap((arq) => arq.base.ruas.map((rua) => ({ a: arq as Arquivo, rua })));
  // A janela visível sem arraste (o inverso do grupo de zoom translate(cx + dx, cy + dy) scale(zoom) translate(-cx, -cy)):
  // a rua do imóvel é recortada a ela, para o nome cair onde a pessoa olha mesmo no zoom máximo.
  const [dx, dy] = entrada.quadro.deslocamento ?? [0, 0];
  const cx = largura / 2;
  const cy = altura / 2;
  const visivel: Retangulo = [cx + (0 - cx - dx) / zoom, cy + (0 - cy - dy) / zoom, cx + (largura - cx - dx) / zoom, cy + (altura - cy - dy) / zoom];
  const margem = 10 / zoom;
  const limiteDoImovel: Retangulo = [
    Math.max(inset[0], visivel[0] + margem),
    Math.max(inset[1], visivel[1] + margem),
    Math.min(inset[2], visivel[2] - margem),
    Math.min(inset[3], visivel[3] - margem),
  ];
  const porNome = new Map<string, CandidatoDeRua & { trechos: number[][] }>();
  for (const { a, rua } of ruas) {
    const eDoImovel = codigo !== null && rua.codigo === codigo;
    const grande = rua.avenida || rua.corredor || rua.perimetral;
    if (!eDoImovel && nivel !== "lote" && !grande) continue;
    if (!naCena(a, rua.caixa)) continue;
    // A mesma rua vinda de dois arquivos (borda) é um candidato só; os trechos repetidos caem na regra de repetição.
    const chave = `${rua.codigo ?? ""}|${rua.nome}`;
    const item = porNome.get(chave) ?? { nome: rua.nome, tipo: eDoImovel ? "imovel" : grande ? "avenida" : "rua", trechos: [] };
    for (const l of rua.linhas) item.trechos.push(...recortarLinha(anelNoDesenho(l, a.afim), eDoImovel ? limiteDoImovel : inset));
    porNome.set(chave, item);
  }
  const candidatos = [...porNome.values()];
  // O pino do imóvel e os elementos do mapa que hospeda (selo, régua, crédito, botões) ficam livres de texto.
  const pino: Retangulo[] = [];
  if (entrada.imovel) {
    const [px, py] = paraDesenho(entrada.imovel.centro);
    const m = 13 / zoom;
    pino.push([px - m, py - m, px + m, py + m]);
  }
  // Tela → desenho: inverso de translate(cx + dx, cy + dy) scale(zoom) translate(-cx, -cy).
  for (const o of entrada.quadro.obstaculos ?? []) {
    pino.push([cx + (o[0] - cx - dx) / zoom, cy + (o[1] - cy - dy) / zoom, cx + (o[2] - cx - dx) / zoom, cy + (o[3] - cy - dy) / zoom]);
  }
  // O lote do imóvel pequeno na vista também fica livre de nome de rua; o lote enorme (um conjunto que toma metade da
  // vista, ou qualquer lote no zoom máximo) não: bloquearia a vista toda, e o pino já protege o imóvel.
  const obstaculosDeRua: Retangulo[] = [...pino];
  if (loteDoImovel) {
    const r = caixaNoDesenho(loteDoImovel.a.afim, loteDoImovel.lote.caixa);
    const w = Math.min(r[2], visivel[2]) - Math.max(r[0], visivel[0]);
    const h = Math.min(r[3], visivel[3]) - Math.max(r[1], visivel[1]);
    const fracao = w > 0 && h > 0 ? (w * h) / ((visivel[2] - visivel[0]) * (visivel[3] - visivel[1])) : 0;
    // O lote vira células pequenas dentro do polígono (não a caixa: a caixa de um lote torto cobre a via da frente,
    // onde o nome da rua do imóvel corre).
    if (fracao > 0 && fracao <= FRACAO_DO_LOTE_OBSTACULO) obstaculosDeRua.push(...celulasDoLote(loteDoImovel.lote.aneis.map((a) => anelNoDesenho(a, loteDoImovel!.a.afim)), r, 4 / zoom));
  }
  // A água da cena no desenho, para nenhum nome de rua cair dentro dela. Um ponto a menos de 1,5 px da margem não conta:
  // a via que corre na beira do rio continua rotulável.
  // Só a caixa no começo; os anéis passam para o desenho na primeira pergunta que cai dentro da caixa.
  const aguaNoDesenho: { caixa: Retangulo; aneis: () => Float64Array[] }[] = [];
  for (const { a, itens } of fontesDaAgua) {
    for (const p of itens) {
      const caixa = naCena(a, p.caixa);
      if (!caixa) continue;
      let aneis: Float64Array[] | null = null;
      aguaNoDesenho.push({ caixa, aneis: () => (aneis ??= p.aneis.map((anel) => anelNoDesenho(anel, a.afim))) });
    }
  }
  const margemDaAgua = 1.5 / zoom;
  const naAgua = (x: number, y: number): boolean =>
    aguaNoDesenho.some((w) => x >= w.caixa[0] && x <= w.caixa[2] && y >= w.caixa[1] && y <= w.caixa[3] && pontoNosAneisDoDesenho(x, y, w.aneis()) && distanciaAosAneis(x, y, w.aneis()) > margemDaAgua);
  const rotulosDoImovel = posicionarRotulosDeRua(candidatos.filter((c) => c.tipo === "imovel"), zoom, obstaculosDeRua, 0, inset, limiteDoImovel, naAgua);
  const ocupadas: Retangulo[] = [...obstaculosDeRua, ...rotulosDoImovel.flatMap((r) => [...r.caixas])];
  let nomes: NomeDeBairro[] = [];
  // No nível de lote o bairro do imóvel está no selo; com a cidade carregada, os vizinhos junto à divisa levam o nome.
  const comNome = nivel !== "lote" ? divisasNaCena : cidade && !daCidade ? divisasNaCena.filter((d) => d !== doImovel) : [];
  if (comNome.length > 0) {
    const paraNome: BairroParaNome[] = comNome.map((d) => ({
      slug: d.divisa.slug,
      nome: nomeDeExibicao(d.divisa.slug, d.divisa.nome),
      doImovel: d === doImovel,
      aneis: d.divisa.partes.flatMap((p) => p.aneis.map((anel) => anelNoDesenho(anel, d.a.afim))),
    }));
    nomes = posicionarNomesDeBairro(paraNome, quadro, zoom, pino, rotulosDoImovel.flatMap((r) => [...r.caixas]));
  }
  const outras = posicionarRotulosDeRua(
    candidatos.filter((c) => c.tipo !== "imovel"),
    zoom,
    [...ocupadas, ...nomes.map((n) => n.caixa)],
    rotulosDoImovel.length,
    inset,
    undefined,
    naAgua,
  );
  const rotulos = [...rotulosDoImovel, ...outras];

  // ---------- Acessibilidade ----------
  const nomeDoBairro = slugDoImovel ? nomeDeExibicao(slugDoImovel, divisas.find((d) => d.divisa.slug === slugDoImovel)?.divisa.nome ?? slugDoImovel) : null;
  let ruaDoImovel: string | null = null;
  if (codigo !== null) {
    for (const { rua } of ruas) if (rua.codigo === codigo) { ruaDoImovel = rua.nome; break; }
    if (!ruaDoImovel) for (const arq of arquivos) for (const rua of arq.base.ruas) if (!ruaDoImovel && rua.codigo === codigo) ruaDoImovel = rua.nome;
  }
  let distanciaDaDivisaM: number | null = null;
  const divisaParaMedir = divisas.find((d) => d.divisa.slug === slugDoImovel);
  if (entrada.imovel && divisaParaMedir) {
    const origem = divisaParaMedir.a === cidade ? cidade.base.origem : arquivos.find((x) => x === divisaParaMedir.a)!.base.origem;
    const [x, y] = noPlano(origem, entrada.imovel.centro);
    const aneis = divisaParaMedir.divisa.partes.flatMap((p) => p.aneis);
    distanciaDaDivisaM = Math.round(distanciaAosAneis(x, y, aneis) / 10);
  }

  return {
    largura,
    altura,
    zoom,
    nivel,
    larguraEmMetros,
    metrosPorPx,
    camadas: {
      hachura: caminhoDaHachura(largura, altura, PASSO_DA_HACHURA_PX / zoom),
      chao,
      chaoDaCidade,
      tintaDoBairro,
      quadras,
      lotes,
      predios,
      pracas,
      agua,
      pontes,
      vias,
      divisas: divisasOutras,
      divisaDoImovel,
      loteDoImovel: loteDoImovel ? caminhoDoPoligono(loteDoImovel.a, loteDoImovel.lote) : "",
    },
    rotulos,
    bairros: nomes,
    selo: nivel === "lote" && nomeDoBairro ? nomeDoBairro : null,
    acessibilidade: { rua: ruaDoImovel, bairro: nomeDoBairro, distanciaDaDivisaM },
    lotes: lotesDoToque,
    temDado: chao !== "" || chaoDaCidade !== "" || quadras !== "" || agua !== "",
  };
}

/** Células quadradas de lado `passo` cujo centro cai dentro do lote (anéis no desenho), recolhidas meio passo. */
function celulasDoLote(aneis: readonly Float64Array[], caixa: Retangulo, passo: number): Retangulo[] {
  const celulas: Retangulo[] = [];
  const meia = passo / 2;
  for (let x = caixa[0] + meia; x < caixa[2]; x += passo) {
    for (let y = caixa[1] + meia; y < caixa[3]; y += passo) {
      if (pontoNosAneisDoDesenho(x, y, aneis)) celulas.push([x - meia, y - meia, x + meia, y + meia]);
    }
  }
  return celulas;
}

/** A caixa em graus do quadro inteiro (escala 1), pelo plano do arquivo. */
function caixaEmGrausDoQuadro(arq: { base: MapaBaseDoBairro; afim: Afim }, largura: number, altura: number): CaixaEmGraus {
  const c = retanguloNoPlano(arq.afim, [0, 0, largura, altura]);
  const [lon0, lat0] = arq.base.origem;
  const kx = METROS_POR_GRAU * Math.cos((lat0 * Math.PI) / 180) * UNIDADES_POR_METRO;
  const ky = METROS_POR_GRAU * UNIDADES_POR_METRO;
  return [lon0 + c[0] / kx, lat0 - c[3] / ky, lon0 + c[2] / kx, lat0 - c[1] / ky];
}

function bordaCobreOQuadro(arquivos: readonly { base: MapaBaseDoBairro; afim: Afim }[], largura: number, altura: number): boolean {
  const primeiro = arquivos[0];
  if (!primeiro) return false;
  return quadroCobertoPelosBairros(
    arquivos.map((a) => a.base),
    caixaEmGrausDoQuadro(primeiro, largura, altura),
  );
}

function metros(n: number): string {
  const inteiro = Math.round(n);
  return `${String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} m`;
}

/** Para o leitor de tela: "R." vira "Rua" e "Av." vira "Avenida" no começo do nome; o resto fica como a base publica. */
export function ruaPorExtenso(nome: string): string {
  return nome.replace(/^R\.\s*/, "Rua ").replace(/^Av\.\s*/, "Avenida ");
}

/** Descrição do mapa para o leitor de tela: rua do imóvel, bairro e distância até a divisa mais próxima do bairro. */
export function descreverFundoDoMapa(cena: CenaDoFundo): string {
  const { rua, bairro, distanciaDaDivisaM } = cena.acessibilidade;
  const partes: string[] = [];
  partes.push(bairro ? `Mapa do entorno, bairro ${bairro}.` : "Mapa do entorno.");
  if (rua) partes.push(`O imóvel fica na ${ruaPorExtenso(rua)}.`);
  if (bairro && distanciaDaDivisaM !== null) {
    partes.push(distanciaDaDivisaM < 10 ? `O imóvel fica junto à divisa de ${bairro}.` : `A divisa mais próxima de ${bairro} fica a ${metros(distanciaDaDivisaM)} do imóvel.`);
  }
  return partes.join(" ");
}

/** O lote num ponto do desenho (escala 1), para o toque; null fora de lote ou fora do nível de lote. */
export function loteNoPonto(cena: CenaDoFundo, x: number, y: number): LoteNoDesenho | null {
  // De trás para a frente: o último desenhado fica por cima.
  for (let i = cena.lotes.length - 1; i >= 0; i--) {
    const l = cena.lotes[i]!;
    if (x < l.caixa[0] || x > l.caixa[2] || y < l.caixa[1] || y > l.caixa[3]) continue;
    if (pontoNosAneisDoDesenho(x, y, l.aneis)) return l;
  }
  return null;
}

/** "Lote vizinho · 12 pavimentos", "Lote do imóvel", "Lote vizinho" (sem pavimentos na base). */
export function rotuloDoLote(l: LoteNoDesenho): string {
  const base = l.doImovel ? "Lote do imóvel" : "Lote vizinho";
  if (l.pavimentos === null || l.pavimentos <= 0) return base;
  return `${base} · ${l.pavimentos} ${l.pavimentos === 1 ? "pavimento" : "pavimentos"}`;
}
