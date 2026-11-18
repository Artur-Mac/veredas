// Núcleo do pipeline do ruído estimado (decisão A2, 18/11/2026): só contas, sem ler arquivo nem rede, para o Jest e o
// Node rodarem o mesmo código (scripts/dados/ruido/rodar-ruido.mjs cuida das entradas e das saídas).
// Para cada prédio: soma o que cada fonte do chão entrega no centro do lote, de dia, na rua (sem fachada); guarda as
// fontes que mais pesam (tipo, nome, distância, rumo, nível) e o resto somado, por fachada, de dia e à noite. O app
// (src/dados/ruido/estimativa.ts) aplica o andar e a janela em cima disso e soma o avião.
import {
  ALCANCE_DA_PARADA_NA_VIA_M,
  RAIO_DA_FONTE_PONTUAL_M,
  RAIO_DA_PARADA_ATE_A_VIA_M,
  RAIO_DAS_LINHAS_M,
  type TipoDeFontePontual,
} from "../../../src/dados/ruido/parametros";
import {
  NIVEL_DO_TRILHO_DB,
  TIPOS_DE_FONTE,
  dbDe,
  deltaDaNoite,
  energiaDe,
  energiaDeElementoDeLinha,
  energiaDeTrecho,
  nivelDaFontePontual,
  nivelDaVia,
  nivelDePonto,
  nivelDosOnibus,
  quedaDaFachada,
  somarEmEnergia,
  type TipoDeFonte,
} from "../../../src/dados/ruido/modelo";

/** Formato do arquivo de camada. Mudou o que é gravado ou como? Suba este número. */
export const FORMATO_DO_RUIDO = 1;
/** As 8 fachadas da rosa do simulador, em graus a partir do norte. */
export const FACHADAS_GRAUS = [0, 45, 90, 135, 180, 225, 270, 315] as const;
/** O traçado do metrô/VLT do app vem amostrado a cada ~90 m (scripts/dados/camadas-inteligentes-recife.mjs). */
export const AMOSTRAGEM_DO_TRILHO_M = 90;
/** Quantas fontes ficam com nome na camada: as 4 que mais pesam de dia e até 2 que só pesam à noite. */
export const FONTES_DE_DIA = 4;
export const FONTES_SO_DA_NOITE = 2;
/** Fonte mais de 15 dB abaixo da que mais pesa (de dia e à noite) não muda o total em 0,2 dB: vai para o resto. */
export const CORTE_DAS_FONTES_DB = 15;

export type ViaDoMapa = { id: number; nome: string | null; highway: string; lanes?: string; maxspeed?: string; pontos: readonly (readonly [number, number])[] };
export type ParadaDeOnibus = readonly [lon: number, lat: number, partidas: number];
export type PontoDeSom = { tipo: TipoDeFontePontual; lon: number; lat: number };
/** [contagem a 150 m, metros até o mais perto, rumo em graus], como na camada de atrito (CNEFE). */
export type TrioDoAtrito = readonly [number, number, number];
export type AtritoDoPredio = { n?: TrioDoAtrito; o?: TrioDoAtrito; m?: TrioDoAtrito };

/** Fonte gravada: [código do tipo, índice do nome (−1 sem nome), metros, rumo em graus, nível de dia em décimos de dB, partidas de ônibus ou bares no grupo (opcional)]. */
export type FonteGravada = [number, number, number, number, number] | [number, number, number, number, number, number];
/** `d` e `n`: resto das fontes, em décimos de dB, [na rua, N, NE, L, SE, S, SO, O, NO]; 0 = nada. Ausentes quando tudo é zero. */
export type PredioGravado = { f: FonteGravada[]; d?: number[]; n?: number[] };
export type CamadaDoBairro = { versao: string; nomes: string[]; predios: Record<string, PredioGravado> };

const KY = 110574;
/** Metros num plano local (precisão de ~1 m em 1,5 km na escala do Recife). */
export function criarPlano(lon0: number, lat0: number): (lon: number, lat: number) => [number, number] {
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  return (lon, lat) => [(lon - lon0) * kx, (lat - lat0) * KY];
}

type Fonte = { tipo: TipoDeFonte; nome: string | null; distanciaM: number; rumoGraus: number; nivelDeDiaDb: number; extra: number };

const CELULA_M = 250;
const chave = (cx: number, cy: number): number => cx * 100003 + cy;
const rumoDe = (dx: number, dy: number): number => (Math.round((Math.atan2(dx, dy) * 180) / Math.PI) + 360) % 360;

/** Distância do ponto (0,0) ao trecho A–B e o ponto do trecho mais perto. */
function maisPertoDoTrecho(ax: number, ay: number, bx: number, by: number): [number, number, number] {
  const dx = bx - ax, dy = by - ay;
  const c2 = dx * dx + dy * dy;
  const t = c2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / c2)) : 0;
  const qx = ax + t * dx, qy = ay + t * dy;
  return [Math.hypot(qx, qy), qx, qy];
}

export type Cenario = ReturnType<typeof prepararCenario>;

/**
 * Monta as fontes em linha uma vez: trechos das vias com o nível de dia (classe, faixas, velocidade e ônibus), o
 * grupo de cada trecho (mesmo nome e classe = uma fonte) e a grade para achar o que fica perto de um ponto.
 */
export function prepararCenario(entrada: {
  vias: readonly ViaDoMapa[];
  paradas: readonly ParadaDeOnibus[];
  trilho: readonly (readonly [number, number])[];
  luse: readonly (readonly [number, number])[];
  plano: (lon: number, lat: number) => [number, number];
}) {
  const { plano } = entrada;
  const ax: number[] = [], ay: number[] = [], bx: number[] = [], by: number[] = [];
  const nivel: number[] = [], grupoDoTrecho: number[] = [], partidasDoTrecho: number[] = [];
  const grupos: { tipo: TipoDeFonte; nome: string | null; rua: string }[] = [];
  const indiceDoGrupo = new Map<string, number>();
  const ruaDoTrecho: string[] = [];

  for (const via of [...entrada.vias].sort((p, q) => p.id - q.id)) {
    const n = nivelDaVia(via);
    if (!n || via.pontos.length < 2) continue;
    const nome = via.nome?.trim() || null;
    // A mesma rua do mapa vem partida em várias vias: nome e classe iguais são uma fonte só. Sem nome, cada via é uma.
    const rua = nome ?? `#${via.id}`;
    const k = `${n.classe}|${rua}`;
    let g = indiceDoGrupo.get(k);
    if (g === undefined) {
      g = grupos.length;
      grupos.push({ tipo: n.classe, nome, rua });
      indiceDoGrupo.set(k, g);
    }
    let [px, py] = plano(via.pontos[0]![0], via.pontos[0]![1]);
    for (let i = 1; i < via.pontos.length; i++) {
      const [qx, qy] = plano(via.pontos[i]![0], via.pontos[i]![1]);
      if (qx !== px || qy !== py) {
        ax.push(px); ay.push(py); bx.push(qx); by.push(qy);
        nivel.push(n.nivelDb); grupoDoTrecho.push(g); partidasDoTrecho.push(0); ruaDoTrecho.push(rua);
      }
      px = qx; py = qy;
    }
  }

  const grade = new Map<number, number[]>();
  for (let i = 0; i < ax.length; i++) {
    const x0 = Math.floor(Math.min(ax[i]!, bx[i]!) / CELULA_M), x1 = Math.floor(Math.max(ax[i]!, bx[i]!) / CELULA_M);
    const y0 = Math.floor(Math.min(ay[i]!, by[i]!) / CELULA_M), y1 = Math.floor(Math.max(ay[i]!, by[i]!) / CELULA_M);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const k = chave(cx, cy);
      const l = grade.get(k);
      if (l) l.push(i); else grade.set(k, [i]);
    }
  }
  const trechosPerto = (x: number, y: number, raio: number, ver: (i: number) => void): void => {
    const x0 = Math.floor((x - raio) / CELULA_M), x1 = Math.floor((x + raio) / CELULA_M);
    const y0 = Math.floor((y - raio) / CELULA_M), y1 = Math.floor((y + raio) / CELULA_M);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) for (const i of grade.get(chave(cx, cy)) ?? []) ver(i);
  };

  // Ônibus: cada parada (GTFS, ≥ 180 partidas num dia útil) vale para a rua do trecho mais perto, a até 40 m; os
  // trechos dessa rua a até 400 m da parada ganham a parcela dos ônibus (a maior, se houver mais de uma parada).
  const paradasDaRua = new Map<string, [number, number, number][]>();
  for (const [lon, lat, partidas] of entrada.paradas) {
    const [x, y] = plano(lon, lat);
    let melhor = -1, menor = RAIO_DA_PARADA_ATE_A_VIA_M;
    trechosPerto(x, y, RAIO_DA_PARADA_ATE_A_VIA_M, (i) => {
      const [d] = maisPertoDoTrecho(ax[i]! - x, ay[i]! - y, bx[i]! - x, by[i]! - y);
      if (d < menor || (d === menor && melhor >= 0 && i < melhor)) { menor = d; melhor = i; }
    });
    if (melhor < 0) continue;
    const rua = ruaDoTrecho[melhor]!;
    const l = paradasDaRua.get(rua);
    if (l) l.push([x, y, partidas]); else paradasDaRua.set(rua, [[x, y, partidas]]);
  }
  let trechosComOnibus = 0;
  for (let i = 0; i < ax.length; i++) {
    const ps = paradasDaRua.get(ruaDoTrecho[i]!);
    if (!ps) continue;
    const mx = (ax[i]! + bx[i]!) / 2, my = (ay[i]! + by[i]!) / 2;
    let partidas = 0;
    for (const [x, y, n] of ps) if (n > partidas && Math.hypot(x - mx, y - my) <= ALCANCE_DA_PARADA_NA_VIA_M) partidas = n;
    if (!partidas) continue;
    partidasDoTrecho[i] = partidas;
    nivel[i] = somarEmEnergia([nivel[i]!, nivelDosOnibus(partidas)]);
    trechosComOnibus++;
  }

  const pontos = (ps: readonly (readonly [number, number])[]) => ps.map(([lon, lat]) => plano(lon, lat));
  return {
    ax, ay, bx, by, nivel, grupoDoTrecho, partidasDoTrecho, grupos, trechosPerto,
    trilho: pontos(entrada.trilho), luse: pontos(entrada.luse),
    resumo: { trechos: ax.length, grupos: grupos.length, paradasLigadas: [...paradasDaRua.values()].reduce((s, l) => s + l.length, 0), paradas: entrada.paradas.length, trechosComOnibus },
  };
}

/** As fontes do chão em volta de um ponto (x, y em metros no plano), com o nível de dia na rua. */
export function fontesDoPonto(c: Cenario, x: number, y: number, atrito: AtritoDoPredio | null): Fonte[] {
  const fontes: Fonte[] = [];

  // Vias: energia por grupo, ponto mais perto e as partidas de ônibus do trecho mais perto.
  const porGrupo = new Map<number, { e: number; d: number; qx: number; qy: number; partidas: number }>();
  const vistos = new Set<number>();
  c.trechosPerto(x, y, RAIO_DAS_LINHAS_M, (i) => {
    if (vistos.has(i)) return;
    vistos.add(i);
    const pax = c.ax[i]! - x, pay = c.ay[i]! - y, pbx = c.bx[i]! - x, pby = c.by[i]! - y;
    const [d, qx, qy] = maisPertoDoTrecho(pax, pay, pbx, pby);
    if (d > RAIO_DAS_LINHAS_M) return;
    const e = energiaDeTrecho(c.nivel[i]!, pax, pay, pbx, pby);
    const g = c.grupoDoTrecho[i]!;
    const a = porGrupo.get(g);
    if (!a) porGrupo.set(g, { e, d, qx, qy, partidas: c.partidasDoTrecho[i]! });
    else {
      a.e += e;
      if (d < a.d) { a.d = d; a.qx = qx; a.qy = qy; a.partidas = c.partidasDoTrecho[i]!; }
    }
  });
  for (const g of [...porGrupo.keys()].sort((p, q) => p - q)) {
    const a = porGrupo.get(g)!;
    const { tipo, nome } = c.grupos[g]!;
    fontes.push({ tipo, nome, distanciaM: Math.round(a.d), rumoGraus: rumoDe(a.qx, a.qy), nivelDeDiaDb: dbDe(a.e), extra: a.partidas });
  }

  // Trilho: os pontos amostrados do traçado, cada um um pedaço de ~90 m; uma fonte só.
  let eTrilho = 0, dTrilho = Infinity, tx = 0, ty = 0;
  for (const [px, py] of c.trilho) {
    const dx = px - x, dy = py - y;
    if (Math.abs(dx) > RAIO_DAS_LINHAS_M || Math.abs(dy) > RAIO_DAS_LINHAS_M) continue;
    const d = Math.hypot(dx, dy);
    if (d > RAIO_DAS_LINHAS_M) continue;
    eTrilho += energiaDeElementoDeLinha(NIVEL_DO_TRILHO_DB, d, AMOSTRAGEM_DO_TRILHO_M);
    if (d < dTrilho) { dTrilho = d; tx = dx; ty = dy; }
  }
  if (eTrilho > 0) fontes.push({ tipo: "trilho", nome: null, distanciaM: Math.round(dTrilho), rumoGraus: rumoDe(tx, ty), nivelDeDiaDb: dbDe(eTrilho), extra: 0 });

  // Locais com licença de som (LUSE vigente): cada um é uma fonte pontual.
  for (const [px, py] of c.luse) {
    const dx = px - x, dy = py - y;
    const d = Math.hypot(dx, dy);
    if (d > RAIO_DA_FONTE_PONTUAL_M.luse) continue;
    const dm = Math.round(d);
    fontes.push({ tipo: "luse", nome: null, distanciaM: dm, rumoGraus: rumoDe(dx, dy), nivelDeDiaDb: nivelDePonto(nivelDaFontePontual("luse"), dm), extra: 0 });
  }

  // CNEFE (camada de atrito): o bar, a oficina e o mercado mais perto; bares a 150 m entram como grupo.
  const doAtrito: [TipoDeFontePontual, TrioDoAtrito | undefined][] = [["bar", atrito?.n], ["oficina", atrito?.o], ["mercado", atrito?.m]];
  for (const [tipo, trio] of doAtrito) {
    if (!trio || trio[1] > RAIO_DA_FONTE_PONTUAL_M[tipo]) continue;
    const grupo = tipo === "bar" ? Math.max(1, trio[0]) : 1;
    fontes.push({ tipo, nome: null, distanciaM: trio[1], rumoGraus: trio[2], nivelDeDiaDb: nivelDePonto(nivelDaFontePontual(tipo, grupo), trio[1]), extra: tipo === "bar" && grupo > 1 ? grupo : 0 });
  }
  return fontes;
}

const decimos = (db: number): number => (db >= 1 ? Math.round(db * 10) : 0);

/** O registro de um prédio: as fontes que mais pesam e o resto somado por fachada. `nomes` recebe os nomes novos. */
export function registroDoPredio(fontes: readonly Fonte[], nomes: string[], indiceDosNomes: Map<string, number>): PredioGravado {
  const codigo = (t: TipoDeFonte) => TIPOS_DE_FONTE.indexOf(t);
  const noite = (f: Fonte) => f.nivelDeDiaDb + deltaDaNoite(f.tipo);
  const ordem = (nivelDe: (f: Fonte) => number) =>
    fontes.map((f, i) => i).sort((p, q) => nivelDe(fontes[q]!) - nivelDe(fontes[p]!) || codigo(fontes[p]!.tipo) - codigo(fontes[q]!.tipo) || fontes[p]!.distanciaM - fontes[q]!.distanciaM || p - q);
  const deDia = ordem((f) => f.nivelDeDiaDb), deNoite = ordem(noite);
  const topoDia = deDia.length ? fontes[deDia[0]!]!.nivelDeDiaDb : -Infinity;
  const topoNoite = deNoite.length ? noite(fontes[deNoite[0]!]!) : -Infinity;
  const escolhidas = new Set<number>();
  for (const i of deDia.slice(0, FONTES_DE_DIA)) if (fontes[i]!.nivelDeDiaDb >= topoDia - CORTE_DAS_FONTES_DB) escolhidas.add(i);
  let soDaNoite = 0;
  for (const i of deNoite.slice(0, FONTES_DE_DIA)) {
    if (escolhidas.has(i) || soDaNoite >= FONTES_SO_DA_NOITE || noite(fontes[i]!) < topoNoite - CORTE_DAS_FONTES_DB) continue;
    escolhidas.add(i);
    soDaNoite++;
  }

  const f: FonteGravada[] = deDia.filter((i) => escolhidas.has(i)).map((i) => {
    const x = fontes[i]!;
    let n = -1;
    if (x.nome) {
      n = indiceDosNomes.get(x.nome) ?? -1;
      if (n < 0) { n = nomes.length; nomes.push(x.nome); indiceDosNomes.set(x.nome, n); }
    }
    const base: FonteGravada = [codigo(x.tipo), n, x.distanciaM, x.rumoGraus, Math.round(x.nivelDeDiaDb * 10)];
    return x.extra > 0 ? [...base, x.extra] as FonteGravada : base;
  });

  const resto = fontes.filter((_, i) => !escolhidas.has(i));
  const somar = (fachada: number | null, delta: (x: Fonte) => number): number => {
    let e = 0;
    for (const x of resto) e += energiaDe(x.nivelDeDiaDb + delta(x) - quedaDaFachada(fachada, x.rumoGraus));
    return decimos(dbDe(e));
  };
  const fachadas: (number | null)[] = [null, ...FACHADAS_GRAUS];
  const d = fachadas.map((g) => somar(g, () => 0));
  const n = fachadas.map((g) => somar(g, (x) => deltaDaNoite(x.tipo)));
  const registro: PredioGravado = { f };
  if (d.some((v) => v > 0)) registro.d = d;
  if (n.some((v) => v > 0)) registro.n = n;
  return registro;
}

/** A camada de um bairro: prédios em ordem de id, nomes das vias na ordem em que aparecem. */
export function camadaDoBairro(c: Cenario, versao: string, predios: readonly { id: string; lon: number; lat: number }[], atrito: Record<string, AtritoDoPredio> | null, plano: (lon: number, lat: number) => [number, number]): CamadaDoBairro {
  const nomes: string[] = [];
  const indice = new Map<string, number>();
  const saida: Record<string, PredioGravado> = {};
  for (const p of [...predios].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    const [x, y] = plano(p.lon, p.lat);
    saida[p.id] = registroDoPredio(fontesDoPonto(c, x, y, atrito?.[p.id] ?? null), nomes, indice);
  }
  return { versao, nomes, predios: saida };
}
