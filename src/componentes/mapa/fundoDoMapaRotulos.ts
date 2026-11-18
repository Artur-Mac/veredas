// Rótulos do fundo do mapa: nomes de rua que deslizam pela via e nomes de bairro no ponto mais longe da borda.
// Funções puras. Tudo em unidades do desenho na escala 1 (a cena), com tamanhos de texto já divididos pelo zoom: o texto
// fica com o mesmo tamanho na tela em qualquer passo de zoom, e com zoom maior cabem mais nomes.
import { distanciaAosAneis, pontoNosAneisDoDesenho, r1, recortarAnel, type Retangulo } from "./fundoDoMapaGeometria";

export type TipoDeRotulo = "imovel" | "avenida" | "rua";

export type RotuloDeRua = {
  /** Único na cena; serve de id do caminho em <Defs>. */
  readonly id: string;
  readonly nome: string;
  readonly tipo: TipoDeRotulo;
  /** Caminho SVG do trecho, já orientado da esquerda para a direita. */
  readonly caminho: string;
  /** Distância, ao longo do caminho, do meio do texto (startOffset com textAnchor="middle"), em unidades da cena. */
  readonly inicio: number;
  /** Fração do comprimento onde o meio do texto ficou (0,5 = meio). */
  readonly fracao: number;
  /** Tamanho da fonte em unidades da cena (o tamanho na tela dividido pelo zoom). */
  readonly tamanho: number;
  /** Caixas que o texto ocupa ao longo da via, para colisão e conferência. */
  readonly caixas: readonly Retangulo[];
};

export type NomeDeBairro = {
  readonly slug: string;
  readonly nome: string;
  readonly doImovel: boolean;
  readonly x: number;
  readonly y: number;
  readonly tamanho: number;
  readonly espacamento: number;
  readonly caixa: Retangulo;
};

export type CandidatoDeRua = {
  readonly nome: string;
  readonly tipo: TipoDeRotulo;
  /** Trechos dentro do quadro, no desenho: [x0, y0, x1, y1, …]. */
  readonly trechos: readonly number[][];
};

/** Tamanho na tela, em px. */
export const TAMANHO_DA_RUA = 8.5;
export const TAMANHO_DO_BAIRRO = 10.5;
export const TAMANHO_DO_BAIRRO_DO_IMOVEL = 13;
export const ESPACAMENTO_DO_BAIRRO_EM = 0.14;
/** Largura média de um caractere em em: Plus Jakarta Sans 600 (medida no Chrome com a fonte do app) e Fraunces 600 em caixa alta. */
const LARGURA_RUA_EM = 0.56;
const LARGURA_RUA_NEGRITO_EM = 0.59;
const LARGURA_BAIRRO_EM = 0.74;
/** Frações tentadas ao longo da via, nesta ordem. */
const FRACOES = [0.5, 0.35, 0.65, 0.22, 0.78, 0.12, 0.88];
/** A mesma rua só se repete com este vão na tela entre os dois rótulos. */
const VAO_DA_REPETICAO_PX = 260;
/**
 * Curva sob o texto, medida por cordas de ~0,8 em (o traçado digitalizado tem zigue-zague miúdo que não conta): até 30°
 * entre cordas vizinhas e 60° no total. Acima disso o texto quebra na esquina e fica ilegível.
 */
const CURVA_LOCAL_RAD = (30 * Math.PI) / 180;
const CURVA_TOTAL_RAD = (60 * Math.PI) / 180;

function diferencaDeAngulo(a: number, b: number): number {
  let d = Math.abs(a - b);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d;
}

export function larguraDoTexto(nome: string, tamanho: number, negrito: boolean): number {
  return nome.length * tamanho * (negrito ? LARGURA_RUA_NEGRITO_EM : LARGURA_RUA_EM);
}

export function larguraDoNomeDeBairro(nome: string, tamanho: number): number {
  return nome.length * tamanho * (LARGURA_BAIRRO_EM + ESPACAMENTO_DO_BAIRRO_EM);
}

function sobrepoe(a: Retangulo, b: Retangulo): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

type Trecho = { pts: number[]; acumulado: number[]; comprimento: number };

function medir(pts: number[]): Trecho {
  const acumulado = [0];
  for (let i = 2; i < pts.length; i += 2) {
    acumulado.push(acumulado[acumulado.length - 1]! + Math.hypot(pts[i]! - pts[i - 2]!, pts[i + 1]! - pts[i - 1]!));
  }
  return { pts, acumulado, comprimento: acumulado[acumulado.length - 1]! };
}

/** Da esquerda para a direita: se a ponta final está à esquerda da inicial, inverte. */
function orientar(pts: number[]): number[] {
  const n = pts.length;
  if (pts[n - 2]! >= pts[0]!) return pts;
  const inv: number[] = [];
  for (let i = n - 2; i >= 0; i -= 2) inv.push(pts[i]!, pts[i + 1]!);
  return inv;
}

/** Ponto e direção a `s` unidades do começo do trecho. */
function pontoEm(t: Trecho, s: number): { x: number; y: number; angulo: number } {
  const { pts, acumulado } = t;
  let i = 1;
  while (i < acumulado.length - 1 && acumulado[i]! < s) i++;
  const a0 = acumulado[i - 1]!;
  const seg = acumulado[i]! - a0;
  const f = seg === 0 ? 0 : Math.max(0, Math.min(1, (s - a0) / seg));
  const x0 = pts[2 * (i - 1)]!;
  const y0 = pts[2 * (i - 1) + 1]!;
  const x1 = pts[2 * i]!;
  const y1 = pts[2 * i + 1]!;
  return { x: x0 + f * (x1 - x0), y: y0 + f * (y1 - y0), angulo: Math.atan2(y1 - y0, x1 - x0) };
}

/** Caixas ao longo do trecho entre s0 e s1, e se a via é reta o bastante ali. */
function caixasNoTrecho(t: Trecho, s0: number, s1: number, tamanho: number): { caixas: Retangulo[]; reta: boolean } {
  const caixas: Retangulo[] = [];
  const meia = tamanho * 0.62;
  const passo = tamanho * 0.8;
  let reta = true;
  let anterior: { x: number; y: number } | null = null;
  let primeira: number | null = null;
  let ultima: number | null = null;
  for (let s = s0; s <= s1 + 1e-9; s += passo) {
    const p = pontoEm(t, Math.min(s, s1));
    if (anterior) {
      const corda = Math.atan2(p.y - anterior.y, p.x - anterior.x);
      if (primeira === null) primeira = corda;
      if (ultima !== null && diferencaDeAngulo(corda, ultima) > CURVA_LOCAL_RAD) reta = false;
      if (diferencaDeAngulo(corda, primeira) > CURVA_TOTAL_RAD) reta = false;
      ultima = corda;
    }
    anterior = p;
    caixas.push([p.x - meia, p.y - meia, p.x + meia, p.y + meia]);
  }
  const fim = pontoEm(t, s1);
  caixas.push([fim.x - meia, fim.y - meia, fim.x + meia, fim.y + meia]);
  return { caixas, reta };
}

function caminhoDoTrecho(pts: number[]): string {
  let d = "";
  for (let i = 0; i < pts.length; i += 2) d += (i === 0 ? "M" : "L") + r1(pts[i]!) + " " + r1(pts[i + 1]!);
  return d;
}

/** Estica as pontas do trecho em linha reta, para o nome da rua do imóvel caber mesmo num trecho curto. */
/** O trecho deslocado de lado (normal de cada segmento), para o nome correr ao lado da via e não sob o pino. */
function aoLado(pts: number[], d: number): number[] {
  const saida: number[] = [];
  const n = pts.length / 2;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    const dx = pts[2 * b]! - pts[2 * a]!;
    const dy = pts[2 * b + 1]! - pts[2 * a + 1]!;
    const l = Math.hypot(dx, dy) || 1;
    saida.push(pts[2 * i]! - (dy / l) * d, pts[2 * i + 1]! + (dx / l) * d);
  }
  return saida;
}

function esticar(pts: number[], quanto: number): number[] {
  const n = pts.length;
  const [x0, y0, x1, y1] = [pts[0]!, pts[1]!, pts[2]!, pts[3]!];
  const [xa, ya, xb, yb] = [pts[n - 4]!, pts[n - 3]!, pts[n - 2]!, pts[n - 1]!];
  const d0 = Math.hypot(x1 - x0, y1 - y0) || 1;
  const d1 = Math.hypot(xb - xa, yb - ya) || 1;
  const saida = pts.slice();
  saida[0] = x0 - ((x1 - x0) / d0) * quanto;
  saida[1] = y0 - ((y1 - y0) / d0) * quanto;
  saida[n - 2] = xb + ((xb - xa) / d1) * quanto;
  saida[n - 1] = yb + ((yb - ya) / d1) * quanto;
  return saida;
}

const PESO: Record<TipoDeRotulo, number> = { imovel: 2, avenida: 1, rua: 0 };

/**
 * Posiciona os nomes de rua. Ordem: rua do imóvel, depois avenidas e corredores, depois o trecho mais comprido. Cada
 * nome desliza pela via (50%, 35%, 65%, 22%, 78%…) até não colidir com outro rótulo nem com `obstaculos` (nomes de
 * bairro); se não couber, não aparece. A rua do imóvel vem primeiro e pode ser esticada ou correr ao lado da via, mas
 * só aparece se couber sem colidir: o que o código garante é tentar, não rotular sempre.
 */
export function posicionarRotulosDeRua(
  candidatos: readonly CandidatoDeRua[],
  zoom: number,
  obstaculos: readonly Retangulo[],
  primeiroId = 0,
  limite?: Retangulo,
  /** Limite só para a rua do imóvel (a janela visível sem arraste, com zoom); omitido, vale `limite`. */
  limiteDoImovel?: Retangulo,
): RotuloDeRua[] {
  const tamanho = TAMANHO_DA_RUA / zoom;
  const vao = VAO_DA_REPETICAO_PX / zoom;
  type Item = { nome: string; tipo: TipoDeRotulo; trecho: Trecho };
  const itens: Item[] = [];
  for (const c of candidatos) {
    for (const pts of c.trechos) {
      if (pts.length < 4) continue;
      itens.push({ nome: c.nome, tipo: c.tipo, trecho: medir(orientar(pts)) });
    }
  }
  itens.sort((a, b) => PESO[b.tipo] - PESO[a.tipo] || b.trecho.comprimento - a.trecho.comprimento || (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0));

  const ocupadas: Retangulo[] = [...obstaculos];
  const meiosPorNome = new Map<string, [number, number][]>();
  const rotulos: RotuloDeRua[] = [];
  const imovelPosto = { feito: false };

  const tentar = (item: Item, forcar: boolean, ignorarColisao = false, deslocamento = 0): boolean => {
    const negrito = item.tipo === "imovel";
    const largura = larguraDoTexto(item.nome, tamanho, negrito);
    let trecho = item.trecho;
    if (forcar) {
      // Forçado (só a rua do imóvel): pontas esticadas em linha reta, com sobra para o nome escapar do pino.
      trecho = medir(aoLado(esticar(trecho.pts, Math.max(0, (largura * 1.08 + tamanho - trecho.comprimento) / 2) + largura), deslocamento));
    } else if (trecho.comprimento < largura * 1.08 + tamanho) {
      return false;
    }
    const meiaFr = (largura / 2 + tamanho * 0.4) / trecho.comprimento;
    const maximo = Math.max(1, Math.floor(trecho.comprimento / (largura + vao)) + 1);
    let postos = 0;
    for (const fr of FRACOES) {
      if (postos >= maximo) break;
      if (fr < meiaFr || fr > 1 - meiaFr) continue;
      const s = fr * trecho.comprimento;
      const meio = pontoEm(trecho, s);
      const anteriores = meiosPorNome.get(item.nome) ?? [];
      if (anteriores.some(([x, y]) => Math.hypot(x - meio.x, y - meio.y) < Math.max(vao, largura + tamanho * 4))) continue;
      const { caixas, reta } = caixasNoTrecho(trecho, s - largura / 2, s + largura / 2, tamanho);
      if (!reta && !forcar) continue;
      // O texto inteiro dentro do limite (não só o meio de cada caixa): nenhum nome sai do quadro nem da janela.
      const lim = item.tipo === "imovel" && limiteDoImovel ? limiteDoImovel : limite;
      if (lim && caixas.some((c) => c[0] < lim[0] || c[2] > lim[2] || c[1] < lim[1] || c[3] > lim[3])) continue;
      if (!ignorarColisao && caixas.some((c) => ocupadas.some((o) => sobrepoe(c, o)))) continue;
      ocupadas.push(...caixas);
      anteriores.push([meio.x, meio.y]);
      meiosPorNome.set(item.nome, anteriores);
      rotulos.push({
        id: `fundo-rua-${primeiroId + rotulos.length}`,
        nome: item.nome,
        tipo: item.tipo,
        caminho: caminhoDoTrecho(trecho.pts),
        inicio: Math.round(s * 10) / 10,
        fracao: fr,
        tamanho,
        caixas,
      });
      postos++;
      if (forcar) break;
    }
    return postos > 0;
  };

  // A rua do imóvel primeiro e sempre que tiver trecho no quadro: se o nome não cabe em nenhum trecho, vai no mais
  // comprido, esticado em linha reta; se ainda colide com um nome de bairro, vai assim mesmo (é a rua que importa).
  const doImovel = itens.filter((i) => i.tipo === "imovel");
  for (const item of doImovel) if (tentar(item, false)) imovelPosto.feito = true;
  if (!imovelPosto.feito && doImovel[0]) {
    const lado = tamanho * 0.75 + (obstaculos.length > 0 ? 13 / zoom : 0);
    // Sem lugar livre nem ao lado da via, a rua fica sem rótulo (nunca por cima do pino, de outro rótulo ou dos
    // controles do mapa); a descrição acessível continua dizendo a rua.
    if (!tentar(doImovel[0], true)) if (!tentar(doImovel[0], true, false, -lado)) tentar(doImovel[0], true, false, lado);
  }
  for (const item of itens) {
    if (item.tipo !== "imovel") tentar(item, false);
  }
  return rotulos;
}

export type BairroParaNome = {
  readonly slug: string;
  readonly nome: string;
  readonly doImovel: boolean;
  /** Anéis no desenho. */
  readonly aneis: readonly Float64Array[];
};

/** Menor tamanho na tela (px) a que o nome do bairro do imóvel pode encolher para caber. */
export const TAMANHO_MINIMO_DO_BAIRRO_DO_IMOVEL = 10;
/** O nome do bairro do imóvel é insistido (lugares afrouxados) quando o bairro ocupa ao menos esta fração do quadro. */
const FRACAO_PARA_INSISTIR = 0.08;

/**
 * Nome de cada bairro no ponto do quadro mais longe da borda dele (e da borda do quadro), sem colidir com outro nome.
 * O do imóvel primeiro e maior. Bairro que não deixa espaço para o nome fica sem nome, menos o do imóvel quando ele
 * ocupa parte razoável do quadro: aí a busca afrouxa, nesta ordem, a distância à divisa, os `fracos` (rótulos já
 * postos, como a rua do imóvel) e, por último, o tamanho (até TAMANHO_MINIMO_DO_BAIRRO_DO_IMOVEL). `obstaculos`
 * (pino, controles do mapa) nunca afrouxam.
 */
export function posicionarNomesDeBairro(
  bairros: readonly BairroParaNome[],
  quadro: Retangulo,
  zoom: number,
  obstaculos: readonly Retangulo[] = [],
  fracos: readonly Retangulo[] = [],
): NomeDeBairro[] {
  const nomes: NomeDeBairro[] = [];
  const ordem = [...bairros].sort((a, b) => Number(b.doImovel) - Number(a.doImovel));
  const passo = Math.max(5, 9 / zoom);
  // A distância que interessa nunca passa da metade do menor lado do quadro (o ponto é limitado também pela borda do
  // quadro): a divisa é recortada a um retângulo com essa folga e simplificada, e a busca fica no pedaço do bairro que
  // cai no quadro, primeiro numa grade grossa e depois refinada em volta do melhor ponto.
  const folgaDoRecorte = Math.min(quadro[2] - quadro[0], quadro[3] - quadro[1]) / 2 + 4;
  const area: Retangulo = [quadro[0] - folgaDoRecorte, quadro[1] - folgaDoRecorte, quadro[2] + folgaDoRecorte, quadro[3] + folgaDoRecorte];
  for (const b of ordem) {
    const texto = b.nome.toLocaleUpperCase("pt-BR");
    const aneis: Float64Array[] = [];
    for (const anel of b.aneis) {
      const r = recortarAnel(anel, area, 0.5 / zoom);
      if (r) aneis.push(r);
    }
    if (aneis.length === 0) continue;
    let bx0 = Infinity;
    let by0 = Infinity;
    let bx1 = -Infinity;
    let by1 = -Infinity;
    for (const a of aneis) {
      for (let i = 0; i < a.length; i += 2) {
        if (a[i]! < bx0) bx0 = a[i]!;
        if (a[i]! > bx1) bx1 = a[i]!;
        if (a[i + 1]! < by0) by0 = a[i + 1]!;
        if (a[i + 1]! > by1) by1 = a[i + 1]!;
      }
    }

    const buscar = (tamanhoPx: number, comFracos: boolean, bordaEstrita: boolean): NomeDeBairro | null => {
      const tamanho = tamanhoPx / zoom;
      const largura = larguraDoNomeDeBairro(texto, tamanho);
      // Caixa com folga: o nome não encosta num rótulo de rua.
      const meiaL = largura / 2 + 4 / zoom;
      const meiaA = tamanho * 0.7 + 2 / zoom;
      const folga = 6 / zoom;
      // Onde o centro do nome pode ficar: dentro do quadro (com a folga) e dentro da caixa do bairro recortado.
      const x0 = Math.max(quadro[0] + meiaL + folga, bx0);
      const x1 = Math.min(quadro[2] - meiaL - folga, bx1);
      const y0 = Math.max(quadro[1] + meiaA + folga, by0);
      const y1 = Math.min(quadro[3] - meiaA - folga, by1);
      if (x0 > x1 || y0 > y1) return null;
      const bordaMinima = bordaEstrita ? meiaA + 2 / zoom : 2 / zoom;
      let melhor: { x: number; y: number; d: number } | null = null;
      const provar = (x: number, y: number) => {
        if (x < x0 || x > x1 || y < y0 || y > y1) return;
        const limiteDoQuadro = Math.min(x - quadro[0], quadro[2] - x, y - quadro[1], quadro[3] - y);
        if (melhor && limiteDoQuadro <= melhor.d) return;
        const caixa: Retangulo = [x - meiaL, y - meiaA, x + meiaL, y + meiaA];
        if (nomes.some((n) => sobrepoe(caixa, n.caixa)) || obstaculos.some((o) => sobrepoe(caixa, o))) return;
        if (comFracos && fracos.some((o) => sobrepoe(caixa, o))) return;
        if (!pontoNosAneisDoDesenho(x, y, aneis)) return;
        const borda = distanciaAosAneis(x, y, aneis);
        if (borda < bordaMinima) return;
        const d = Math.min(borda, limiteDoQuadro);
        if (!melhor || d > melhor.d) melhor = { x, y, d };
      };
      const grosso = Math.max(passo, Math.min(x1 - x0, y1 - y0) / 10);
      for (let x = x0; x <= x1 + 1e-9; x += grosso) for (let y = y0; y <= y1 + 1e-9; y += grosso) provar(x, y);
      if (grosso > passo) {
        // Refino em volta do melhor ponto; sem nenhum ponto na grade grossa (bairro estreito), a grade fina inteira.
        const achado = melhor as { x: number; y: number; d: number } | null;
        if (achado) {
          for (let x = achado.x - grosso; x <= achado.x + grosso; x += passo) for (let y = achado.y - grosso; y <= achado.y + grosso; y += passo) provar(x, y);
        } else {
          for (let x = x0; x <= x1 + 1e-9; x += passo) for (let y = y0; y <= y1 + 1e-9; y += passo) provar(x, y);
        }
      }
      if (!melhor) return null;
      const m = melhor as { x: number; y: number; d: number };
      return {
        slug: b.slug,
        nome: texto,
        doImovel: b.doImovel,
        x: Math.round(m.x * 10) / 10,
        y: Math.round(m.y * 10) / 10,
        tamanho,
        espacamento: tamanho * ESPACAMENTO_DO_BAIRRO_EM,
        caixa: [m.x - meiaL, m.y - meiaA, m.x + meiaL, m.y + meiaA],
      };
    };

    let posto = buscar(b.doImovel ? TAMANHO_DO_BAIRRO_DO_IMOVEL : TAMANHO_DO_BAIRRO, true, true);
    if (!posto && b.doImovel && fracaoNoQuadro(aneis, quadro) >= FRACAO_PARA_INSISTIR) {
      posto = buscar(TAMANHO_DO_BAIRRO_DO_IMOVEL, true, false) ?? buscar(TAMANHO_DO_BAIRRO_DO_IMOVEL, false, false);
      for (let px = TAMANHO_DO_BAIRRO_DO_IMOVEL - 1; !posto && px >= TAMANHO_MINIMO_DO_BAIRRO_DO_IMOVEL; px -= 1) posto = buscar(px, false, false);
    }
    if (posto) nomes.push(posto);
  }
  return nomes;
}

/** Fração aproximada do quadro dentro dos anéis (grade de 12 × 12). */
function fracaoNoQuadro(aneis: readonly Float64Array[], quadro: Retangulo): number {
  let dentro = 0;
  const n = 12;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = quadro[0] + ((i + 0.5) / n) * (quadro[2] - quadro[0]);
      const y = quadro[1] + ((j + 0.5) / n) * (quadro[3] - quadro[1]);
      if (pontoNosAneisDoDesenho(x, y, aneis)) dentro++;
    }
  }
  return dentro / (n * n);
}
