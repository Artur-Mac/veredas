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
  /**
   * Só na rua do imóvel: o nome caiu por cima do lote do imóvel (com o zoom no máximo o lote toma o quadro). O desenho
   * inverte as cores (texto claro, halo no azul do lote): azul sobre azul não se lia.
   */
  readonly sobreOLote?: boolean;
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

/**
 * O ponto dos trechos mais perto de `ancora` (sem âncora, o meio do trecho mais comprido), a direção da via ali, da
 * esquerda para a direita (vetor unitário), e o comprimento do trecho. A direção é a da corda entre os pontos a até 40
 * unidades para cada lado: o zigue-zague miúdo do traçado não conta.
 */
function pontoMaisPerto(trechos: readonly Trecho[], ancora?: readonly [number, number]): { x: number; y: number; ux: number; uy: number; comprimento: number } {
  let melhor: { t: Trecho; s: number; d: number } | null = null;
  for (const t of trechos) {
    if (!ancora) {
      if (!melhor || t.comprimento > melhor.t.comprimento) melhor = { t, s: t.comprimento / 2, d: 0 };
      continue;
    }
    for (let i = 2; i < t.pts.length; i += 2) {
      const [x0, y0, x1, y1] = [t.pts[i - 2]!, t.pts[i - 1]!, t.pts[i]!, t.pts[i + 1]!];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const l2 = dx * dx + dy * dy;
      const f = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((ancora[0] - x0) * dx + (ancora[1] - y0) * dy) / l2));
      const d = Math.hypot(ancora[0] - (x0 + f * dx), ancora[1] - (y0 + f * dy));
      if (!melhor || d < melhor.d) melhor = { t, s: t.acumulado[i / 2 - 1]! + f * Math.sqrt(l2), d };
    }
  }
  const { t, s } = melhor!;
  const p = pontoEm(t, s);
  const meia = Math.min(40, t.comprimento / 2);
  const a = pontoEm(t, Math.max(0, s - meia));
  const b = pontoEm(t, Math.min(t.comprimento, s + meia));
  let ux = b.x - a.x;
  let uy = b.y - a.y;
  const l = Math.hypot(ux, uy);
  if (l < 1e-9) return { x: p.x, y: p.y, ux: 1, uy: 0, comprimento: t.comprimento };
  ux /= l;
  uy /= l;
  // Da esquerda para a direita; via vertical, de baixo para cima (como o texto de uma lombada).
  if (ux < -1e-9 || (Math.abs(ux) <= 1e-9 && uy > 0)) {
    ux = -ux;
    uy = -uy;
  }
  return { x: p.x, y: p.y, ux, uy, comprimento: t.comprimento };
}

const PESO: Record<TipoDeRotulo, number> = { imovel: 2, avenida: 1, rua: 0 };

/** O que a rua do imóvel tem de diferente das outras (decisão A11, 18/11/2026: o nome dela aparece SEMPRE). */
export type RuaDoImovel = {
  /** O ponto do imóvel no desenho (o pino): o nome fica o mais perto dele que der. Sem ele, vale o meio do trecho mais comprido. */
  readonly ancora?: readonly [number, number];
  /**
   * Obstáculos que o nome só respeita enquanto há outro lugar: são desenho do próprio fundo (o lote do imóvel), ficam por
   * BAIXO do texto e não o escondem. Os de `obstaculos` (pino, selo, botões, crédito, régua, pontos e obras) ficam por
   * cima do desenho e nunca são cobertos.
   */
  readonly fracos?: readonly Retangulo[];
};

/** Passo da busca de lugar para a rua do imóvel, em em: desliza de 0,7 em 0,7 em (6 px na tela). */
const PASSO_DA_BUSCA_EM = 0.7;
/** Até onde o nome da rua do imóvel se afasta de lado da via, em em, antes de desistir de acompanhá-la (~34 px). */
const AFASTAMENTO_MAXIMO_EM = 4;

/**
 * Posiciona os nomes de rua. Ordem: rua do imóvel, depois avenidas e corredores, depois o trecho mais comprido. Cada
 * nome desliza pela via (50%, 35%, 65%, 22%, 78%…) até não colidir com outro rótulo nem com `obstaculos` (nomes de
 * bairro); se não couber, não aparece.
 *
 * A rua do imóvel é a exceção (A11): vem primeiro, os outros nomes desviam dela, e ela aparece sempre que tem trecho
 * no quadro e existe um lugar livre para o texto dentro do limite. A busca vai do melhor lugar para o pior:
 *   1. sobre a via, onde ela é reta e o nome cabe (como as outras ruas);
 *   2. em linha reta na direção da via, pelo ponto dela mais perto do imóvel: desliza ao longo da linha e se afasta de
 *      lado aos poucos (até AFASTAMENTO_MAXIMO_EM), escolhendo a posição mais perto do imóvel;
 *   3. o mesmo, podendo passar por cima do lote do imóvel (`fracos`);
 *   4. deitado (horizontal) e cruzando a via, com o meio do texto num ponto dela: é o que resta quando a via é
 *      íngreme e o quadro é baixo (a tela do prédio tem 120 px livres de altura), e o nome continua em cima da rua certa;
 *   5. deitado, no lugar livre mais perto do imóvel, em qualquer ponto do limite. É também o que vale quando a via
 *      não tem trecho no limite (zoom máximo sobre um lote grande): o nome fica na tela, junto do pino.
 * Nunca fica por baixo do pino nem do que o mapa põe por cima do desenho.
 */
export function posicionarRotulosDeRua(
  candidatos: readonly CandidatoDeRua[],
  zoom: number,
  obstaculos: readonly Retangulo[],
  primeiroId = 0,
  limite?: Retangulo,
  /** Limite só para a rua do imóvel (a janela visível sem arraste, com zoom); omitido, vale `limite`. */
  limiteDoImovel?: Retangulo,
  /**
   * O ponto do desenho cai na água (rio, canal, mar)? A posição cujo trajeto passa pela água é descartada: um nome
   * deitado no rio parece outra coisa e fica espremido na curva da margem.
   */
  naAgua?: (x: number, y: number) => boolean,
  doImovel: RuaDoImovel = {},
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

  const fracos = doImovel.fracos ?? [];
  // Enquanto a rua do imóvel procura lugar, os fracos contam como ocupados; os outros nomes sempre desviam deles.
  const ocupadas: Retangulo[] = [...obstaculos, ...fracos];
  const meiosPorNome = new Map<string, [number, number][]>();
  const rotulos: RotuloDeRua[] = [];
  const imovelPosto = { feito: false };

  /** Sobre a via: desliza pelas frações até achar um trecho reto, dentro do limite, sem colisão e fora da água. */
  const tentar = (item: Item): boolean => {
    const negrito = item.tipo === "imovel";
    const largura = larguraDoTexto(item.nome, tamanho, negrito);
    const trecho = item.trecho;
    if (trecho.comprimento < largura * 1.08 + tamanho) return false;
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
      if (!reta) continue;
      // O texto inteiro dentro do limite (não só o meio de cada caixa): nenhum nome sai do quadro nem da janela.
      const lim = item.tipo === "imovel" && limiteDoImovel ? limiteDoImovel : limite;
      if (lim && caixas.some((c) => c[0] < lim[0] || c[2] > lim[2] || c[1] < lim[1] || c[3] > lim[3])) continue;
      if (caixas.some((c) => ocupadas.some((o) => sobrepoe(c, o)))) continue;
      if (naAgua && caixas.some((c) => naAgua((c[0] + c[2]) / 2, (c[1] + c[3]) / 2))) continue;
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
    }
    return postos > 0;
  };

  // A rua do imóvel primeiro. Passo 1: sobre a via, como qualquer rua.
  const trechosDoImovel = itens.filter((i) => i.tipo === "imovel");
  for (const item of trechosDoImovel) if (tentar(item)) imovelPosto.feito = true;
  // O candidato existe mesmo sem trecho no limite (a via ficou fora da janela, com o zoom no máximo sobre um lote grande).
  const item = candidatos.find((c) => c.tipo === "imovel");
  if (!imovelPosto.feito && item) {
    const largura = larguraDoTexto(item.nome, tamanho, true);
    const lim = limiteDoImovel ?? limite;
    const passo = tamanho * PASSO_DA_BUSCA_EM;
    // O ponto da via mais perto do imóvel e a direção dela ali; null se a via não tem trecho no limite.
    const perto = trechosDoImovel.length > 0 ? pontoMaisPerto(trechosDoImovel.map((i) => i.trecho), doImovel.ancora) : null;
    const [ax, ay] = doImovel.ancora ?? (perto ? [perto.x, perto.y] : lim ? [(lim[0] + lim[2]) / 2, (lim[1] + lim[3]) / 2] : [0, 0]);
    const serve = (caixas: Retangulo[], comFracos: boolean, comAgua: boolean): boolean => {
      if (lim && caixas.some((c) => c[0] < lim[0] || c[2] > lim[2] || c[1] < lim[1] || c[3] > lim[3])) return false;
      if (caixas.some((c) => obstaculos.some((o) => sobrepoe(c, o)))) return false;
      if (comFracos && caixas.some((c) => fracos.some((o) => sobrepoe(c, o)))) return false;
      if (comAgua && naAgua && caixas.some((c) => naAgua((c[0] + c[2]) / 2, (c[1] + c[3]) / 2))) return false;
      return true;
    };
    /** Tenta o texto reto com o meio em (cx, cy) na direção (ux, uy); põe o rótulo se o lugar serve. */
    const reto = (cx: number, cy: number, ux: number, uy: number, comFracos: boolean, comAgua: boolean): boolean => {
      const meia = largura / 2 + tamanho * 0.4;
      // Descarte barato, sem alocar nada, antes de montar as caixas de verdade (a busca prova centenas de posições):
      // quadradinhos do tamanho das caixas ao longo do texto contra o limite e os obstáculos.
      const lado = tamanho * 0.62;
      const n = Math.ceil(largura / 2 / (tamanho * 0.8));
      for (let k = -n; k <= n; k++) {
        const s = Math.max(-largura / 2, Math.min(largura / 2, k * tamanho * 0.8));
        const x = cx + ux * s;
        const y = cy + uy * s;
        if (lim && (x - lado < lim[0] || x + lado > lim[2] || y - lado < lim[1] || y + lado > lim[3])) return false;
        for (const o of obstaculos) if (x - lado < o[2] && o[0] < x + lado && y - lado < o[3] && o[1] < y + lado) return false;
        if (comFracos) for (const o of fracos) if (x - lado < o[2] && o[0] < x + lado && y - lado < o[3] && o[1] < y + lado) return false;
      }
      const trecho = medir([cx - ux * meia, cy - uy * meia, cx + ux * meia, cy + uy * meia]);
      const { caixas } = caixasNoTrecho(trecho, meia - largura / 2, meia + largura / 2, tamanho);
      if (!serve(caixas, comFracos, comAgua)) return false;
      ocupadas.push(...caixas);
      meiosPorNome.set(item.nome, [...(meiosPorNome.get(item.nome) ?? []), [cx, cy]]);
      rotulos.push({ id: `fundo-rua-${primeiroId + rotulos.length}`, nome: item.nome, tipo: "imovel", caminho: caminhoDoTrecho(trecho.pts), inicio: Math.round(meia * 10) / 10, fracao: 0.5, tamanho, caixas });
      return true;
    };
    if (perto) {
      // Passos 2 e 3: na direção da via. Posições (ao longo, de lado) da mais perto do imóvel para a mais longe; o
      // afastamento de lado pesa a mais, para o nome ficar sobre a via ou colado nela enquanto der.
      const aoLongo = Math.max(largura, perto.comprimento / 2);
      const deLado = tamanho * AFASTAMENTO_MAXIMO_EM;
      const posicoes: { x: number; y: number; d: number; custo: number }[] = [];
      for (let t = 0; t <= aoLongo + 1e-9; t += passo) {
        for (let d = 0; d <= deLado + 1e-9; d += passo) {
          for (const st of t === 0 ? [1] : [1, -1]) {
            for (const sd of d === 0 ? [1] : [1, -1]) {
              const x = perto.x + perto.ux * t * st - perto.uy * d * sd;
              const y = perto.y + perto.uy * t * st + perto.ux * d * sd;
              posicoes.push({ x, y, d, custo: Math.hypot(x - ax, y - ay) + 1.5 * d });
            }
          }
        }
      }
      posicoes.sort((a, b) => a.custo - b.custo || a.d - b.d || a.y - b.y || a.x - b.x);
      const naDirecaoDaVia = (comFracos: boolean): boolean => posicoes.some((p) => reto(p.x, p.y, perto.ux, perto.uy, comFracos, true));
      imovelPosto.feito = naDirecaoDaVia(true) || naDirecaoDaVia(false);
    }
    // Passo 4: deitado, com o meio do texto num ponto da via (o mais perto do imóvel primeiro).
    if (!imovelPosto.feito && perto) {
      const naVia: { x: number; y: number; custo: number }[] = [];
      for (const i of trechosDoImovel) {
        for (let s = 0; s <= i.trecho.comprimento + 1e-9; s += passo) {
          const p = pontoEm(i.trecho, s);
          naVia.push({ x: p.x, y: p.y, custo: Math.hypot(p.x - ax, p.y - ay) });
        }
      }
      naVia.sort((a, b) => a.custo - b.custo || a.y - b.y || a.x - b.x);
      imovelPosto.feito = naVia.some((c) => reto(c.x, c.y, 1, 0, true, true)) || naVia.some((c) => reto(c.x, c.y, 1, 0, false, true));
    }
    // Passo 5: deitado, no lugar livre mais perto do imóvel (também quando a via ficou fora da janela: o nome continua
    // na tela, junto do pino). Só os obstáculos de cima contam; a água, só se houver saída.
    if (!imovelPosto.feito && lim) {
      const centros: { x: number; y: number; custo: number }[] = [];
      for (let x = lim[0] + largura / 2 + tamanho; x <= lim[2] - largura / 2 - tamanho + 1e-9; x += passo) {
        for (let y = lim[1] + tamanho; y <= lim[3] - tamanho + 1e-9; y += passo) centros.push({ x, y, custo: Math.hypot(x - ax, y - ay) });
      }
      centros.sort((a, b) => a.custo - b.custo || a.y - b.y || a.x - b.x);
      imovelPosto.feito = centros.some((c) => reto(c.x, c.y, 1, 0, false, true)) || centros.some((c) => reto(c.x, c.y, 1, 0, false, false));
    }
  }
  for (const item of itens) {
    if (item.tipo !== "imovel") tentar(item);
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
