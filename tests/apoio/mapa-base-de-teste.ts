// Apoio dos testes do fundo do mapa: converte um recorte GeoJSON de docs/aplicacao/mapa-base-2026-11-18/recortes/ para os
// tipos do contrato em memória (src/dados/recife/mapaBaseContrato.ts), e escreve uma cena como SVG para as provas visuais.
// Os recortes trazem a propriedade `camada` (quadra, lote, rua, bairro, agua, praca, predio_indice). `predio_indice` vira a
// marca `noIndice` do lote com o mesmo DSQFL; nome de edifício, DSQFL e id do índice NÃO passam para o contrato.
import { readFileSync } from "fs";
import { join } from "path";
import type { CenaDoFundo } from "../../src/componentes/mapa/fundoDoMapaCena";
import { estiloDoFundo } from "../../src/componentes/mapa/fundoDoMapaEstilo";
import { marcacaoDoFundo } from "../../src/componentes/mapa/fundoDoMapaMarcacao";
import {
  METROS_POR_GRAU,
  UNIDADES_POR_METRO,
  VERSAO_DO_MAPA_BASE,
  type AguaBase,
  type Caixa,
  type LoteBase,
  type MapaBaseDoBairro,
  type OrigemDoPlano,
  type PoligonoBase,
  type PracaBase,
  type RuaBase,
  type TipoDeAgua,
} from "../../src/dados/recife/mapaBaseContrato";
import { CORES_ESCURO, type Cores } from "../../src/tema/tokens";

export const CENTRO_DO_IMOVEL: readonly [number, number] = [-34.907539, -8.141503];
export const LOGRADOURO_DO_IMOVEL = 8001;

type Geometria = { type: string; coordinates: unknown };
type Feicao = { properties: Record<string, unknown>; geometry: Geometria };
export type Recorte = { bbox: [number, number, number, number]; features: Feicao[] };

const PASTA = join(__dirname, "..", "..", "docs", "aplicacao", "mapa-base-2026-11-18", "recortes");

export function lerRecorte(nome: "janela-A-gaveta" | "janela-B-por-perto"): Recorte {
  return JSON.parse(readFileSync(join(PASTA, `${nome}.geojson`), "utf8")) as Recorte;
}

export function projetarPara(origem: OrigemDoPlano) {
  const [lon0, lat0] = origem;
  const cos = Math.cos((lat0 * Math.PI) / 180);
  return ([lon, lat]: readonly number[]): [number, number] => [
    Math.round((lon! - lon0) * METROS_POR_GRAU * cos * UNIDADES_POR_METRO),
    Math.round(-(lat! - lat0) * METROS_POR_GRAU * UNIDADES_POR_METRO),
  ];
}

function caixaDe(aneis: readonly Int32Array[]): Caixa {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const a of aneis) {
    for (let i = 0; i < a.length; i += 2) {
      x0 = Math.min(x0, a[i]!);
      x1 = Math.max(x1, a[i]!);
      y0 = Math.min(y0, a[i + 1]!);
      y1 = Math.max(y1, a[i + 1]!);
    }
  }
  return [x0, y0, x1, y1];
}

function pontos(coords: readonly (readonly number[])[], p: (c: readonly number[]) => [number, number], fechado: boolean): Int32Array {
  const lista = fechado && coords.length > 1 && coords[0]![0] === coords[coords.length - 1]![0] && coords[0]![1] === coords[coords.length - 1]![1] ? coords.slice(0, -1) : coords;
  const saida = new Int32Array(lista.length * 2);
  lista.forEach((c, i) => {
    const [x, y] = p(c);
    saida[2 * i] = x;
    saida[2 * i + 1] = y;
  });
  return saida;
}

function poligonosDe(g: Geometria, p: (c: readonly number[]) => [number, number]): PoligonoBase[] {
  const lista = (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []) as number[][][][];
  return lista.map((pol) => {
    const aneis = pol.map((anel) => pontos(anel, p, true));
    return { aneis, caixa: caixaDe(aneis) };
  });
}

function linhasDe(g: Geometria, p: (c: readonly number[]) => [number, number]): Int32Array[] {
  const lista = (g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : []) as number[][][];
  return lista.map((l) => pontos(l, p, false));
}

const TIPOS_DE_AGUA: readonly TipoDeAgua[] = ["oceano", "rio", "canal", "lago"];

/** "Av Boa Viagem" → "Av. Boa Viagem", como o pipeline publica. */
export function nomeCurto(nome: string): string {
  return nome.replace(/^Av /, "Av. ");
}

/** Converte o recorte. A origem do plano é o canto noroeste do recorte, de propósito diferente do centro do mapa. */
export function mapaBaseDoRecorte(recorte: Recorte, slug = "boa-viagem", origem: OrigemDoPlano = [recorte.bbox[0], recorte.bbox[3]]): MapaBaseDoBairro {
  const p = projetarPara(origem);
  const de = (camada: string) => recorte.features.filter((f) => f.properties.camada === camada);
  const doIndice = new Set(de("predio_indice").map((f) => String(f.properties.dsqfl)));
  const bairro = de("bairro")[0]!;
  const lotes: LoteBase[] = de("lote").flatMap((f) =>
    poligonosDe(f.geometry, p).map((pol) => ({
      ...pol,
      pavimentos: typeof f.properties.pavimentos === "number" ? f.properties.pavimentos : null,
      noIndice: doIndice.has(String(f.properties.dsqfl)),
      quadra: -1,
    })),
  );
  const ruas: RuaBase[] = de("rua").map((f) => {
    const linhas = linhasDe(f.geometry, p);
    const nome = nomeCurto(String(f.properties.nome_curto ?? f.properties.nome));
    return {
      nome,
      codigo: typeof f.properties.codigo === "number" ? f.properties.codigo : null,
      avenida: /^Av\.? /.test(nome),
      corredor: Boolean(f.properties.corredor_transporte),
      perimetral: Boolean(f.properties.perimetral),
      linhas,
      caixa: caixaDe(linhas),
    };
  });
  const agua: AguaBase[] = de("agua").flatMap((f) =>
    poligonosDe(f.geometry, p).map((pol) => ({
      ...pol,
      nome: (f.properties.nome as string | null) ?? null,
      tipo: TIPOS_DE_AGUA.includes(f.properties.tipo as TipoDeAgua) ? (f.properties.tipo as TipoDeAgua) : "outro",
    })),
  );
  const pracas: PracaBase[] = de("praca").flatMap((f) =>
    poligonosDe(f.geometry, p).map((pol) => ({ ...pol, nome: (f.properties.nome as string | null) ?? null, tipo: f.properties.tipo === "parque" ? "parque" : "praca" })),
  );
  return {
    versao: VERSAO_DO_MAPA_BASE,
    bairro: slug,
    origem,
    divisa: { slug, nome: String(bairro.properties.nome), partes: poligonosDe(bairro.geometry, p) },
    quadras: de("quadra").flatMap((f) => poligonosDe(f.geometry, p)),
    lotes,
    ruas,
    agua,
    pracas,
    pontes: [],
  };
}

/** A conta de um mapa que hospeda: centro no meio do quadro, `metrosNaLargura` metros na largura (projeção de projetorDoPlano). */
export function paraDesenhoCentrado(centro: readonly [number, number], largura: number, altura: number, metrosNaLargura: number) {
  const [lon0, lat0] = centro;
  const cos = Math.cos((lat0 * Math.PI) / 180);
  const s = largura / metrosNaLargura;
  return ([lon, lat]: readonly [number, number]): [number, number] => [
    largura / 2 + (lon - lon0) * METROS_POR_GRAU * cos * s,
    altura / 2 - (lat - lat0) * METROS_POR_GRAU * s,
  ];
}

// ---------- Prova visual: a cena como SVG, com a mesma tabela de estilo do componente ----------

/** A cena como SVG: a mesma marcação que o FundoDoMapa desenha na web (src/componentes/mapa/fundoDoMapaMarcacao.ts). */
export function svgDaCena(cena: CenaDoFundo, cores: Cores, extra = ""): string {
  return `<g>${marcacaoDoFundo(cena, estiloDoFundo(cores, cores === CORES_ESCURO), "tudo", "prova")}${extra}</g>`;
}
