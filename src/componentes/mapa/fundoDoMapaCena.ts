// Fundo do mapa (mapa-base, 18/11/2026): transforma o mapa-base em memória (src/dados/recife/mapaBaseContrato.ts) numa
// cena pronta para desenhar no <Svg> de qualquer mapa do app. Puro: sem React, sem rede, sem data, sem acaso.
//
// - Nível pela escala NA TELA (largura do quadro em metros, já contando o zoom), não pelo tamanho da tela.
// - Uma forma por camada: um único caminho SVG com todos os anéis (medido no Chrome com CPU 4× mais lenta, 7 mil
//   polígonos juntos desenham em 24 ms contra 114 ms separados; no nativo cada elemento é um objeto).
// - A cena é montada para o quadro inteiro na escala 1 (a pessoa arrasta), com traços e textos já divididos pelo zoom.
//   Os rótulos são calculados por passo de zoom e ficam parados no arraste.
// - Nada é completado: quadra sem lote fica quadra sem lote; fora de bairro carregado é hachura ("sem dado").
import { bairroPorSlug } from "../../dados/recife/bairros";
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
 * Até aqui (largura do quadro na tela, em metros) desenha todos os lotes. 800 m num quadro de 340 px dá 2,4 m por px:
 * um lote de 10 a 12 m de frente ainda tem 4 a 5 px e se distingue do vizinho; acima disso os lotes viram textura e só
 * pesam. 600 m (a especificação) deixaria o Por perto mais fechado sem lote; 1 km já embola os lotes.
 */
export const LOTES_ATE_M = 800;
/** Acima disto, só bairros, água e avenidas (a especificação diz "mais de 3 km"). */
export const QUADRAS_ATE_M = 3000;

export type NivelDoFundo = "lote" | "bairro" | "cidade";

export type QuadroDoFundo = {
  /** Tamanho do desenho, em px, na escala 1. */
  readonly largura: number;
  readonly altura: number;
  /** A conta do mapa que hospeda: [lon, lat] → [x, y] no desenho, na escala 1. Tem de ser linear em lon e lat. */
  readonly paraDesenho: ParaDesenho;
  /** Zoom aplicado pelo mapa por transform de grupo (1 sem zoom). */
  readonly zoom?: number;
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
  /** Bairro do imóvel levemente tingido (só no nível de 1 a 3 km). */
  readonly tintaDoBairro: string;
  readonly quadras: string;
  readonly lotes: string;
  readonly predios: string;
  readonly pracas: string;
  readonly agua: string;
  /** Avenidas como linha (só no nível de cidade, onde não há quadra para a rua aparecer como vão). */
  readonly vias: string;
  readonly divisas: string;
  readonly divisaDoImovel: string;
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

function marcar(nome: string): boolean {
  const p = (globalThis as { performance?: { mark?: (n: string) => unknown } }).performance;
  if (!p || typeof p.mark !== "function") return false;
  p.mark(nome);
  return true;
}

function medirMarca(): void {
  const p = (globalThis as {
    performance?: { measure?: (n: string, a: string, b: string) => unknown; clearMarks?: (n?: string) => void };
  }).performance;
  if (!p || typeof p.measure !== "function") return;
  try {
    p.measure("fundo-do-mapa", "fundo-do-mapa:inicio", "fundo-do-mapa:fim");
    p.clearMarks?.("fundo-do-mapa:inicio");
    p.clearMarks?.("fundo-do-mapa:fim");
  } catch {
    // marca ausente: medir é só para a verificação, nunca quebra o desenho
  }
}

/** Monta a cena do fundo. Mesma entrada, mesma cena. */
export function montarFundoDoMapa(entrada: EntradaDoFundo): CenaDoFundo {
  const marcou = marcar("fundo-do-mapa:inicio");
  const cena = montar(entrada);
  if (marcou) {
    marcar("fundo-do-mapa:fim");
    medirMarca();
  }
  return cena;
}

const CAMADAS_VAZIAS: CamadasDoFundo = {
  hachura: "",
  chao: "",
  tintaDoBairro: "",
  quadras: "",
  lotes: "",
  predios: "",
  pracas: "",
  agua: "",
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
      camadas: CAMADAS_VAZIAS,
      rotulos: [],
      bairros: [],
      selo: null,
      acessibilidade: { rua: null, bairro: entrada.bairroDoImovel ? nomeDeExibicao(entrada.bairroDoImovel, entrada.bairroDoImovel) : null, distanciaDaDivisaM: null },
      lotes: [],
      temDado: false,
    };
  }
  const larguraEmMetros = largura / (pixelsPorMetro(referencia) * zoom);
  const nivel: NivelDoFundo = larguraEmMetros <= LOTES_ATE_M ? "lote" : larguraEmMetros <= QUADRAS_ATE_M ? "bairro" : "cidade";
  // Sem arquivo de bairro, só a cidade serve, em qualquer escala.
  const daCidade = nivel === "cidade" || arquivos.length === 0;
  const tolerancia = TOLERANCIA_PX / zoom;
  const slugDoImovel = entrada.bairroDoImovel;

  const naCena = (a: Arquivo, c: Caixa, folga = 1) => {
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
  const tintaDoBairro = nivel === "bairro" && doImovel ? caminhoDaDivisa(doImovel) : "";
  const divisasOutras = divisasNaCena.filter((d) => d !== doImovel).map(caminhoDaDivisa).join("");
  const divisaDoImovel = doImovel ? caminhoDaDivisa(doImovel) : "";

  // ---------- Quadras, lotes, prédios do índice, praças, água ----------
  const deArquivos = <T>(f: (b: MapaBaseDoBairro) => readonly T[]) => arquivos.map((arq) => ({ a: arq as Arquivo, itens: f(arq.base) }));
  const quadras = daCidade
    ? ""
    : camada(deArquivos((b) => b.quadras), nivel === "bairro" ? (_p, r) => r[2] - r[0] >= QUADRA_MINIMA_PX || r[3] - r[1] >= QUADRA_MINIMA_PX : undefined);
  const pracas = daCidade ? "" : camada(deArquivos((b) => b.pracas));
  const agua = daCidade && cidade ? camada([{ a: cidade, itens: cidade.base.agua }]) : camada(deArquivos((b) => b.agua));

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
  const ruas: { a: Arquivo; rua: RuaBase }[] = daCidade
    ? (cidade ? cidade.base.vias.map((rua) => ({ a: cidade as Arquivo, rua })) : [])
    : arquivos.flatMap((arq) => arq.base.ruas.map((rua) => ({ a: arq as Arquivo, rua })));
  const porNome = new Map<string, CandidatoDeRua & { trechos: number[][] }>();
  for (const { a, rua } of ruas) {
    const eDoImovel = codigo !== null && rua.codigo === codigo;
    const grande = rua.avenida || rua.corredor || rua.perimetral;
    if (!eDoImovel && nivel !== "lote" && !grande) continue;
    if (!naCena(a, rua.caixa)) continue;
    // A mesma rua vinda de dois arquivos (borda) é um candidato só; os trechos repetidos caem na regra de repetição.
    const chave = `${rua.codigo ?? ""}|${rua.nome}`;
    const item = porNome.get(chave) ?? { nome: rua.nome, tipo: eDoImovel ? "imovel" : grande ? "avenida" : "rua", trechos: [] };
    for (const l of rua.linhas) item.trechos.push(...recortarLinha(anelNoDesenho(l, a.afim), inset));
    porNome.set(chave, item);
  }
  const candidatos = [...porNome.values()];
  // O pino do imóvel (desenhado pelo mapa que hospeda) fica livre de texto.
  const pino: Retangulo[] = [];
  if (entrada.imovel) {
    const [px, py] = paraDesenho(entrada.imovel.centro);
    const m = 13 / zoom;
    pino.push([px - m, py - m, px + m, py + m]);
  }
  const rotulosDoImovel = posicionarRotulosDeRua(candidatos.filter((c) => c.tipo === "imovel"), zoom, pino, 0, inset);
  const ocupadas: Retangulo[] = [...pino, ...rotulosDoImovel.flatMap((r) => [...r.caixas])];
  let nomes: NomeDeBairro[] = [];
  if (nivel !== "lote") {
    const paraNome: BairroParaNome[] = divisasNaCena.map((d) => ({
      slug: d.divisa.slug,
      nome: nomeDeExibicao(d.divisa.slug, d.divisa.nome),
      doImovel: d === doImovel,
      aneis: d.divisa.partes.flatMap((p) => p.aneis.map((anel) => anelNoDesenho(anel, d.a.afim))),
    }));
    nomes = posicionarNomesDeBairro(paraNome, quadro, zoom, ocupadas);
  }
  const outras = posicionarRotulosDeRua(
    candidatos.filter((c) => c.tipo !== "imovel"),
    zoom,
    [...ocupadas, ...nomes.map((n) => n.caixa)],
    rotulosDoImovel.length,
    inset,
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
    camadas: {
      hachura: caminhoDaHachura(largura, altura, PASSO_DA_HACHURA_PX / zoom),
      chao,
      tintaDoBairro,
      quadras,
      lotes,
      predios,
      pracas,
      agua,
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
    temDado: chao !== "" || quadras !== "" || agua !== "",
  };
}

function metros(n: number): string {
  const inteiro = Math.round(n);
  return `${String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} m`;
}

/** Descrição do mapa para o leitor de tela: rua do imóvel, bairro e distância até a divisa mais próxima do bairro. */
export function descreverFundoDoMapa(cena: CenaDoFundo): string {
  const { rua, bairro, distanciaDaDivisaM } = cena.acessibilidade;
  const partes: string[] = [];
  partes.push(bairro ? `Mapa do entorno, bairro ${bairro}.` : "Mapa do entorno.");
  if (rua) partes.push(`O imóvel fica na ${rua}.`);
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
