// Leitura do mapa-base (18/11/2026): confere e decodifica os arquivos gerados por scripts/dados/construir-mapa-base.mjs
// e entrega os tipos de ./mapaBaseContrato. O desenho só conhece esses tipos, nunca o formato do arquivo.
//
// Formato do arquivo (VERSAO_DO_MAPA_BASE = 1): coordenadas em decímetros inteiros no plano local do arquivo (x leste,
// y SUL), numa lista plana `g` por seção, lida com um cursor que começa em (0, 0): cada ponto é a diferença para o ponto
// anterior da seção. Polígonos: por feição R (anéis); por anel N (pontos) e 2N diferenças. Ruas: por rua L (linhas); por
// linha N e 2N diferenças. Atributos em colunas paralelas.
//
// Como em indice.ts, a validação tem duas camadas: em tempo de execução, uma checagem rasa (versão, bairro, colunas com
// o tamanho certo) e a decodificação, que recusa lista `g` truncada ou com sobra; a validação zod completa
// (`validarArquivoDoBairro`, `validarArquivoDaCidade`) roda nos testes. Arquivo de outra versão ou inválido é recusado
// (lança), nunca aproveitado. Arquivo que ainda não carregou (`faltaCamada`) também lança e nada é guardado.
import { z } from "zod";
import { faltaCamada, lerCamada } from "../camadas";
import {
  METROS_POR_GRAU,
  UNIDADES_POR_METRO,
  VERSAO_DO_MAPA_BASE,
  type AguaBase,
  type Caixa,
  type DivisaDoBairro,
  type LoteBase,
  type MapaBaseDaCidade,
  type MapaBaseDoBairro,
  type OrigemDoPlano,
  type PoligonoBase,
  type PracaBase,
  type QuadraBase,
  type RuaBase,
  type TipoDeAgua,
} from "./mapaBaseContrato";
import { ARQUIVO_DA_CIDADE, ARQUIVOS_DO_MAPA_BASE, CAIXAS_DO_MAPA_BASE, FONTES_DO_MAPA_BASE, INDICE_DO_MAPA_BASE } from "./mapaBaseGerado";

export { FONTES_DO_MAPA_BASE, INDICE_DO_MAPA_BASE };

/** Caixa em graus: [oeste, sul, leste, norte]. */
export type CaixaEmGraus = readonly [number, number, number, number];

/** Borda incluída em cada arquivo de bairro, em metros. */
export const BORDA_DO_MAPA_BASE_M = 300;

// ——— Esquemas (validação completa, nos testes) ——————————————————————————————————————————————————————
const inteiros = z.array(z.number().int());
const TIPOS_DE_AGUA = ["oceano", "rio", "canal", "lago", "outro"] as const;
const esquemaRuas = z.strictObject({
  nome: z.array(z.string().min(1)),
  codigo: z.array(z.number().int().nullable()),
  tipo: z.array(z.number().int().min(0).max(7)),
  g: inteiros,
});
const esquemaAgua = z.strictObject({ nome: z.array(z.string().min(1).nullable()), tipo: z.array(z.enum(TIPOS_DE_AGUA)), g: inteiros });
const esquemaDivisa = z.strictObject({ slug: z.string().min(1), nome: z.string().min(1), g: inteiros });
const esquemaOrigem = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

export const esquemaArquivoDoBairro = z.strictObject({
  versao: z.literal(VERSAO_DO_MAPA_BASE),
  bairro: z.string().min(1),
  origem: esquemaOrigem,
  divisa: esquemaDivisa,
  quadras: z.strictObject({ g: inteiros }),
  lotes: z.strictObject({
    g: inteiros,
    pavimentos: z.array(z.number().int().min(0).max(200)),
    quadra: z.array(z.number().int().min(-1)),
    noIndice: z.array(z.number().int().nonnegative()),
  }),
  ruas: esquemaRuas,
  agua: esquemaAgua,
  pracas: z.strictObject({ nome: z.array(z.string().min(1).nullable()), tipo: z.array(z.enum(["praca", "parque"])), g: inteiros }),
  // Pontes (18/11/2026): seção acrescentada ao contrato depois do piloto. Opcional só até o pipeline gravá-la em todos
  // os arquivos; quem regenerar os dados com a seção torna este campo obrigatório.
  pontes: z.strictObject({ g: inteiros }).optional(),
});
export type ArquivoDoBairro = z.infer<typeof esquemaArquivoDoBairro>;

export const esquemaArquivoDaCidade = z.strictObject({
  versao: z.literal(VERSAO_DO_MAPA_BASE),
  origem: esquemaOrigem,
  bairros: z.array(esquemaDivisa),
  agua: esquemaAgua,
  vias: esquemaRuas,
});
export type ArquivoDaCidade = z.infer<typeof esquemaArquivoDaCidade>;

// ——— Decodificação ——————————————————————————————————————————————————————————————————————————————————
class Leitor {
  private i = 0;
  private x = 0;
  private y = 0;
  constructor(private readonly g: readonly number[], private readonly onde: string) {}
  inteiro(): number {
    const v = this.g[this.i++];
    if (v === undefined || !Number.isInteger(v) || v < 0) throw new Error(`Mapa-base inválido em ${this.onde}: lista truncada ou contagem inválida na posição ${this.i - 1}.`);
    return v;
  }
  pontos(minimo: number): Int32Array {
    const n = this.inteiro();
    if (n < minimo) throw new Error(`Mapa-base inválido em ${this.onde}: ${n} pontos (mínimo ${minimo}).`);
    if (this.i + 2 * n > this.g.length) throw new Error(`Mapa-base inválido em ${this.onde}: lista truncada.`);
    const p = new Int32Array(2 * n);
    for (let k = 0; k < n; k++) {
      this.x += this.g[this.i++]!;
      this.y += this.g[this.i++]!;
      p[2 * k] = this.x;
      p[2 * k + 1] = this.y;
    }
    return p;
  }
  temMais(): boolean {
    return this.i < this.g.length;
  }
  fim(): void {
    if (this.i !== this.g.length) throw new Error(`Mapa-base inválido em ${this.onde}: ${this.g.length - this.i} números sobrando.`);
  }
}

function caixaDosPontos(listas: readonly Int32Array[]): Caixa {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of listas) {
    for (let k = 0; k < p.length; k += 2) {
      const x = p[k]!, y = p[k + 1]!;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return [x0, y0, x1, y1];
}

/** Decodifica uma lista de polígonos. `quantos`: o número esperado (o das colunas), ou null para "até o fim". */
export function decodificarPoligonos(g: readonly number[], quantos: number | null, onde: string): PoligonoBase[] {
  const l = new Leitor(g, onde);
  const saida: PoligonoBase[] = [];
  while (quantos === null ? l.temMais() : saida.length < quantos) {
    const r = l.inteiro();
    if (r < 1) throw new Error(`Mapa-base inválido em ${onde}: polígono sem anel.`);
    const aneis: Int32Array[] = [];
    for (let k = 0; k < r; k++) aneis.push(l.pontos(3));
    saida.push({ aneis, caixa: caixaDosPontos([aneis[0]!]) });
  }
  l.fim();
  return saida;
}

/** Decodifica as linhas das ruas: uma entrada por rua, com `quantos` ruas. */
export function decodificarLinhas(g: readonly number[], quantos: number, onde: string): Int32Array[][] {
  const l = new Leitor(g, onde);
  const saida: Int32Array[][] = [];
  for (let i = 0; i < quantos; i++) {
    const n = l.inteiro();
    if (n < 1) throw new Error(`Mapa-base inválido em ${onde}: rua sem linha.`);
    const linhas: Int32Array[] = [];
    for (let k = 0; k < n; k++) linhas.push(l.pontos(2));
    saida.push(linhas);
  }
  l.fim();
  return saida;
}

/** Codifica (o inverso de decodificarPoligonos/decodificarLinhas): usado nos testes de ida e volta. */
export function codificarPoligonos(lista: readonly (readonly (readonly number[])[])[]): number[] {
  const g: number[] = [];
  let x = 0, y = 0;
  for (const aneis of lista) {
    g.push(aneis.length);
    for (const a of aneis) {
      g.push(a.length / 2);
      for (let k = 0; k < a.length; k += 2) { g.push(a[k]! - x, a[k + 1]! - y); x = a[k]!; y = a[k + 1]!; }
    }
  }
  return g;
}

function decodificarRuas(r: ArquivoDoBairro["ruas"], onde: string): RuaBase[] {
  const linhas = decodificarLinhas(r.g, r.nome.length, onde);
  return r.nome.map((nome, i) => {
    const t = r.tipo[i]!;
    const ls = linhas[i]!;
    return { nome, codigo: r.codigo[i] ?? null, avenida: (t & 1) !== 0, corredor: (t & 2) !== 0, perimetral: (t & 4) !== 0, linhas: ls, caixa: caixaDosPontos(ls) };
  });
}

function decodificarAgua(a: ArquivoDoBairro["agua"], onde: string): AguaBase[] {
  return decodificarPoligonos(a.g, a.nome.length, onde).map((p, i) => ({ ...p, nome: a.nome[i] ?? null, tipo: a.tipo[i] as TipoDeAgua }));
}

function decodificarDivisa(d: ArquivoDoBairro["divisa"], onde: string): DivisaDoBairro {
  return { slug: d.slug, nome: d.nome, partes: decodificarPoligonos(d.g, null, onde) };
}

// ——— Checagem rasa (tempo de execução) ——————————————————————————————————————————————————————————————
const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const ehLista = (v: unknown): v is unknown[] => Array.isArray(v);

function recusar(onde: string, motivo: string): never {
  throw new Error(`Mapa-base recusado em ${onde}: ${motivo}. Gere de novo com scripts/dados/construir-mapa-base.mjs.`);
}

function checarColunas(onde: string, secao: unknown, colunas: readonly string[]): void {
  if (!ehObjeto(secao) || !ehLista(secao.g)) recusar(onde, "seção sem lista g");
  let n: number | null = null;
  for (const c of colunas) {
    const v = secao[c];
    if (!ehLista(v)) recusar(onde, `coluna ${c} ausente`);
    if (n !== null && v.length !== n) recusar(onde, `coluna ${c} com ${v.length} posições, esperava ${n}`);
    n = v.length;
  }
}

function checarVersao(onde: string, dados: unknown): asserts dados is Record<string, unknown> {
  if (!ehObjeto(dados)) recusar(onde, "não é objeto");
  if (dados.versao !== VERSAO_DO_MAPA_BASE) recusar(onde, `versão ${String(dados.versao)}, esperava ${VERSAO_DO_MAPA_BASE}`);
  const o = dados.origem;
  if (!ehLista(o) || o.length !== 2 || typeof o[0] !== "number" || typeof o[1] !== "number") recusar(onde, "origem inválida");
}

export function checarArquivoDoBairroRaso(slug: string, dados: unknown): ArquivoDoBairro {
  const onde = `${slug}.json`;
  checarVersao(onde, dados);
  if (dados.bairro !== slug) recusar(onde, `o arquivo diz ser do bairro "${String(dados.bairro)}"`);
  if (!ehObjeto(dados.divisa) || !ehLista(dados.divisa.g) || typeof dados.divisa.nome !== "string") recusar(onde, "divisa inválida");
  checarColunas(onde, dados.quadras, []);
  checarColunas(onde, dados.lotes, ["pavimentos", "quadra"]);
  if (!ehLista((dados.lotes as Record<string, unknown>).noIndice)) recusar(onde, "coluna noIndice ausente");
  checarColunas(onde, dados.ruas, ["nome", "codigo", "tipo"]);
  checarColunas(onde, dados.agua, ["nome", "tipo"]);
  checarColunas(onde, dados.pracas, ["nome", "tipo"]);
  return dados as unknown as ArquivoDoBairro;
}

export function checarArquivoDaCidadeRaso(dados: unknown): ArquivoDaCidade {
  const onde = "cidade.json";
  checarVersao(onde, dados);
  if (!ehLista(dados.bairros)) recusar(onde, "bairros ausentes");
  checarColunas(onde, dados.agua, ["nome", "tipo"]);
  checarColunas(onde, dados.vias, ["nome", "codigo", "tipo"]);
  return dados as unknown as ArquivoDaCidade;
}

/** Validação completa (zod): só nos testes. */
export function validarArquivoDoBairro(slug: string, dados: unknown): ArquivoDoBairro {
  const r = esquemaArquivoDoBairro.safeParse(dados);
  if (!r.success) recusar(`${slug}.json`, `${r.error.issues.length} problemas; primeiro em ${r.error.issues[0]?.path.join(".")}: ${r.error.issues[0]?.message}`);
  return checarArquivoDoBairroRaso(slug, r.data);
}
export function validarArquivoDaCidade(dados: unknown): ArquivoDaCidade {
  const r = esquemaArquivoDaCidade.safeParse(dados);
  if (!r.success) recusar("cidade.json", `${r.error.issues.length} problemas; primeiro em ${r.error.issues[0]?.path.join(".")}: ${r.error.issues[0]?.message}`);
  return checarArquivoDaCidadeRaso(r.data);
}

/** Decodifica um arquivo de bairro já conferido. Os lotes são decodificados só no primeiro acesso a `lotes`. */
export function decodificarArquivoDoBairro(a: ArquivoDoBairro): MapaBaseDoBairro {
  const onde = `${a.bairro}.json`;
  const quadras: QuadraBase[] = decodificarPoligonos(a.quadras.g, null, `${onde} quadras`);
  const nLotes = a.lotes.pavimentos.length;
  let lotes: LoteBase[] | null = null;
  const lerLotes = (): LoteBase[] => {
    if (lotes) return lotes;
    const marcados = new Set(a.lotes.noIndice);
    const formas = decodificarPoligonos(a.lotes.g, nLotes, `${onde} lotes`);
    lotes = formas.map((f, i) => {
      const q = a.lotes.quadra[i]!;
      if (q >= quadras.length) recusar(onde, `lote ${i} aponta para a quadra ${q}, que não existe`);
      const p = a.lotes.pavimentos[i]!;
      return { ...f, pavimentos: p > 0 ? p : null, noIndice: marcados.has(i), quadra: q };
    });
    return lotes;
  };
  const pracas: PracaBase[] = decodificarPoligonos(a.pracas.g, a.pracas.nome.length, `${onde} praças`).map((p, i) => ({
    ...p, nome: a.pracas.nome[i] ?? null, tipo: a.pracas.tipo[i] === "parque" ? "parque" : "praca",
  }));
  return {
    versao: VERSAO_DO_MAPA_BASE,
    bairro: a.bairro,
    origem: [a.origem[0], a.origem[1]] as OrigemDoPlano,
    divisa: decodificarDivisa(a.divisa, `${onde} divisa`),
    quadras,
    get lotes() {
      return lerLotes();
    },
    ruas: decodificarRuas(a.ruas, `${onde} ruas`),
    agua: decodificarAgua(a.agua, `${onde} água`),
    pracas,
    pontes: a.pontes ? decodificarPoligonos(a.pontes.g, null, `${onde} pontes`) : [],
  };
}

export function decodificarArquivoDaCidade(a: ArquivoDaCidade): MapaBaseDaCidade {
  return {
    versao: VERSAO_DO_MAPA_BASE,
    origem: [a.origem[0], a.origem[1]] as OrigemDoPlano,
    bairros: a.bairros.map((d) => decodificarDivisa(d, `cidade.json divisa ${d.slug}`)),
    agua: decodificarAgua(a.agua, "cidade.json água"),
    vias: decodificarRuas(a.vias, "cidade.json vias"),
  };
}

// ——— Arquivos e memória ——————————————————————————————————————————————————————————————————————————————
const ARQUIVOS = ARQUIVOS_DO_MAPA_BASE as Record<string, string | undefined>;
const CAIXAS = CAIXAS_DO_MAPA_BASE as Record<string, CaixaEmGraus | undefined>;

/** O arquivo de camada do mapa-base do bairro (para garantirCamadas), ou null se não há. */
export function arquivoDoMapaBase(slug: string | null | undefined): string | null {
  return slug ? (ARQUIVOS[slug] ?? null) : null;
}

/** O arquivo de camada da cidade (divisas, água grande, avenidas), ou null se não há. */
export function arquivoDaCidade(): string | null {
  return ARQUIVO_DA_CIDADE || null;
}

/** A caixa em graus do polígono do bairro, ou null se o bairro não tem arquivo. */
export function caixaDoBairro(slug: string): CaixaEmGraus | null {
  return CAIXAS[slug] ?? null;
}

const tocam = (a: CaixaEmGraus, b: CaixaEmGraus): boolean => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);

/** Slugs com arquivo cuja caixa (do polígono do bairro) toca a caixa dada, em graus. */
export function bairrosNaCaixa(caixa: CaixaEmGraus): string[] {
  return Object.keys(CAIXAS).filter((s) => ARQUIVOS[s] && tocam(CAIXAS[s]!, caixa));
}

const bairrosEmMemoria = new Map<string, MapaBaseDoBairro>();
let cidadeEmMemoria: MapaBaseDaCidade | null = null;

/**
 * O mapa-base do bairro, decodificado uma vez por arquivo (lotes só no primeiro acesso). null se o bairro não tem
 * arquivo. Lança se o arquivo não carregou ainda (CamadaPendente/CamadaIndisponivel: nada é guardado) ou é inválido.
 */
export function mapaBaseDoBairro(slug: string): MapaBaseDoBairro | null {
  const guardado = bairrosEmMemoria.get(slug);
  if (guardado) return guardado;
  const arquivo = arquivoDoMapaBase(slug);
  if (!arquivo) return null;
  const mapa = decodificarArquivoDoBairro(checarArquivoDoBairroRaso(slug, lerCamada(arquivo)));
  bairrosEmMemoria.set(slug, mapa);
  return mapa;
}

/** O mapa-base da cidade, decodificado uma vez. Mesmas regras de mapaBaseDoBairro. */
export function mapaBaseDaCidade(): MapaBaseDaCidade | null {
  if (cidadeEmMemoria) return cidadeEmMemoria;
  const arquivo = arquivoDaCidade();
  if (!arquivo) return null;
  cidadeEmMemoria = decodificarArquivoDaCidade(checarArquivoDaCidadeRaso(lerCamada(arquivo)));
  return cidadeEmMemoria;
}

/** Só para testes: esquece o que foi decodificado. */
export function esquecerMapaBase(): void {
  bairrosEmMemoria.clear();
  cidadeEmMemoria = null;
}

// ——— Carga em dois tempos ———————————————————————————————————————————————————————————————————————————
/** O bairro decodificado, ou null se o arquivo ainda não está em memória. Arquivo inválido lança. */
function bairroDisponivel(slug: string): MapaBaseDoBairro | null {
  try {
    return mapaBaseDoBairro(slug);
  } catch (e) {
    if (faltaCamada(e)) return null;
    throw e;
  }
}

/** Distância (decímetros) de um ponto à borda de um polígono, no plano do arquivo. */
function distanciaABorda(x: number, y: number, p: PoligonoBase): number {
  let melhor = Infinity;
  for (const a of p.aneis) {
    const n = a.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const ax = a[2 * j]!, ay = a[2 * j + 1]!, bx = a[2 * i]!, by = a[2 * i + 1]!;
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
      const ex = x - ax - t * dx, ey = y - ay - t * dy;
      melhor = Math.min(melhor, Math.sqrt(ex * ex + ey * ey));
    }
  }
  return melhor;
}

function dentro(x: number, y: number, p: PoligonoBase): boolean {
  let d = false;
  for (const a of p.aneis) {
    const n = a.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = a[2 * i]!, yi = a[2 * i + 1]!, xj = a[2 * j]!, yj = a[2 * j + 1]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
    }
  }
  return d;
}

/**
 * O quadro (em graus) está todo dentro da divisa do bairro ou a menos de `borda` metros dela? Confere pontos a cada
 * ~25 m ao longo da borda do quadro (e os cantos): o arquivo do bairro cobre a divisa mais 300 m.
 */
export function quadroCobertoPeloBairro(mapa: MapaBaseDoBairro, caixa: CaixaEmGraus, bordaM = BORDA_DO_MAPA_BASE_M): boolean {
  const [lon0, lat0] = mapa.origem;
  const kx = METROS_POR_GRAU * Math.cos((lat0 * Math.PI) / 180) * UNIDADES_POR_METRO;
  const ky = METROS_POR_GRAU * UNIDADES_POR_METRO;
  const limite = bordaM * UNIDADES_POR_METRO;
  const x0 = (caixa[0] - lon0) * kx, x1 = (caixa[2] - lon0) * kx;
  const y0 = -(caixa[3] - lat0) * ky, y1 = -(caixa[1] - lat0) * ky;
  const passo = 25 * UNIDADES_POR_METRO;
  const nx = Math.max(1, Math.ceil((x1 - x0) / passo)), ny = Math.max(1, Math.ceil((y1 - y0) / passo));
  const pontos: [number, number][] = [];
  for (let i = 0; i <= nx; i++) { const x = x0 + ((x1 - x0) * i) / nx; pontos.push([x, y0], [x, y1]); }
  for (let j = 1; j < ny; j++) { const y = y0 + ((y1 - y0) * j) / ny; pontos.push([x0, y], [x1, y]); }
  const partes = mapa.divisa.partes;
  return pontos.every(([x, y]) => partes.some((p) => dentro(x, y, p) || distanciaABorda(x, y, p) < limite));
}

/**
 * A carga em dois tempos (decisão 6 do plano). Primeiro só o arquivo do bairro do imóvel; com ele em memória, se o
 * quadro está todo a menos de 300 m da divisa, basta ele (`completo`). Senão entram os bairros cuja caixa toca o quadro
 * e o arquivo da cidade. Sem bairro, ou bairro sem arquivo: os bairros na caixa e a cidade direto. Função pura sobre o
 * que está em memória: a tela chama de novo depois de cada carga, até `completo`.
 */
export function arquivosDoMapaBaseParaOQuadro({ bairro, caixa }: { bairro: string | null | undefined; caixa: CaixaEmGraus }): { arquivos: string[]; completo: boolean } {
  const doBairro = arquivoDoMapaBase(bairro);
  const cidade = arquivoDaCidade();
  const vizinhos = () => {
    const lista = doBairro ? [doBairro] : [];
    for (const s of bairrosNaCaixa(caixa)) { const a = arquivoDoMapaBase(s)!; if (!lista.includes(a)) lista.push(a); }
    if (cidade) lista.push(cidade);
    return lista;
  };
  if (!doBairro) return { arquivos: vizinhos(), completo: true };
  const mapa = bairroDisponivel(bairro!);
  if (!mapa) return { arquivos: [doBairro], completo: false };
  if (quadroCobertoPeloBairro(mapa, caixa)) return { arquivos: [doBairro], completo: true };
  return { arquivos: vizinhos(), completo: true };
}
