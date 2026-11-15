// "Sol e sombra" (15/11/2026): quanto sol direto da tarde as fachadas do prédio recebem, comparado com os prédios do
// bairro. Modelo leve, para rodar em todos os prédios do bairro no aparelho:
// - fachadas: os lados do contorno do lote (não a planta da torre), cada um com a normal para fora;
// - sol: posição no equinócio, de 13h a 17h, a cada 30 min (posicaoSolarRecife);
// - sombra de vizinho: prédio do cadastro a até 120 m, na direção do Sol, mais alto que o meio da fachada o bastante para
//   tapar o Sol naquela elevação (altura pelos pavimentos da base de Lotes; vizinho sem altura não conta);
// - árvores: em prédio baixo (até 12 m), a fração de domicílios do setor em face de quadra com 5 ou mais árvores
//   (Censo 2022) tira até metade do sol da fachada.
// Não mede temperatura nem a face de um apartamento: só ordena os prédios do bairro. Puro e com cache por bairro.
import type { Edificio, RuaDoBairro } from "../contratos";
import { alturaDoEdificioM, posicaoSolarRecife } from "./solESombra";

const R = 6_371_008.8;
const RAD = Math.PI / 180;
export const HORAS_DA_TARDE = [13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17] as const;
const RAIO_VIZINHOS_M = 120;
const ALTURA_DESCONHECIDA_M = 12;
const ARVORES_ATE_M = 12;

export type SolDaTarde = {
  /** Média, na tarde, da fração do contorno iluminada de frente (0 a 1): só serve para ordenar. */
  valor: number;
  /** Fração do contorno com a fachada voltada para o poente (normal entre SO e NO). */
  fracaoPoente: number;
  /** Primeira hora da tarde em que um vizinho mais alto tapa o Sol no meio da fachada, ou null. */
  sombraDesde: number | null;
  /** Fração de domicílios do setor em face com 5+ árvores (Censo 2022), ou null. */
  arvores: number | null;
  /** A altura do próprio prédio veio do cadastro (false: estimada em 12 m). */
  alturaConhecida: boolean;
};

type Lado = { normal: number; comprimento: number };

function emMetros(p: readonly [number, number], ref: readonly [number, number]): [number, number] {
  return [(p[0] - ref[0]) * R * RAD * Math.cos(ref[1] * RAD), (p[1] - ref[1]) * R * RAD];
}

/** Lados do contorno com a normal para fora, em graus a partir do norte (sentido horário). */
export function ladosDoContorno(poligono: readonly (readonly [number, number])[]): Lado[] {
  const ref = poligono[0]!;
  const m = poligono.map((p) => emMetros(p, ref));
  const area = m.reduce((s, p, i) => { const q = m[(i + 1) % m.length]!; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  const sentido = area >= 0 ? 1 : -1;
  const lados: Lado[] = [];
  for (let i = 0; i < m.length; i++) {
    const a = m[i]!, b = m[(i + 1) % m.length]!;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 1) continue;
    lados.push({ normal: (Math.atan2(sentido * dy, -sentido * dx) / RAD + 360) % 360, comprimento: L });
  }
  return lados;
}

const difAngulo = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

type Vizinho = { rumo: number; distancia: number; meiaLargura: number; altura: number };

function raioDoLote(e: Edificio): number {
  if (!e.poligono) return 8;
  const ref = e.centro;
  return Math.max(4, ...e.poligono.map((p) => Math.hypot(...emMetros(p, ref)))) * 0.7;
}

type SolDaHora = { hora: number; azimuteGraus: number; elevacaoGraus: number };
const solDasHoras = (centro: readonly [number, number]): SolDaHora[] =>
  HORAS_DA_TARDE.map((hora) => { const p = posicaoSolarRecife(hora, centro, "equinocio"); return { hora, azimuteGraus: p.azimuteGraus, elevacaoGraus: p.elevacaoGraus }; });

/** Medidas que não dependem do prédio olhado: calculadas uma vez por edifício do bairro. */
type Medidas = { raio: number; altura: number | null };
const medidasDe = (e: Edificio): Medidas => ({ raio: raioDoLote(e), altura: alturaDoEdificioM(e) });

/**
 * Sol da tarde de um prédio, dados os vizinhos já filtrados (a até 120 m) e a fração de árvores do setor. `medidas` e
 * `horas` são caches do bairro (opcionais): sem eles, tudo é calculado na hora.
 */
export function solDaTardeDoPredio(
  e: Edificio, vizinhos: readonly Edificio[], arvores: number | null,
  medidas?: (x: Edificio) => Medidas, horas?: readonly SolDaHora[],
): SolDaTarde | null {
  if (!e.poligono || e.poligono.length < 3) return null;
  const lados = ladosDoContorno(e.poligono);
  const perimetro = lados.reduce((s, l) => s + l.comprimento, 0);
  if (perimetro <= 0) return null;
  const medir = medidas ?? medidasDe;
  const minhas = medir(e);
  const alturaPropria = minhas.altura;
  const z = (alturaPropria ?? ALTURA_DESCONHECIDA_M) / 2;
  const meuRaio = minhas.raio;
  const vs: Vizinho[] = [];
  for (const v of vizinhos) {
    if (v.id === e.id) continue;
    const mv = medir(v);
    const h = mv.altura;
    if (h === null || h <= z) continue;
    const [x, y] = emMetros(v.centro, e.centro);
    const d = Math.hypot(x, y);
    if (d > RAIO_VIZINHOS_M || d < 1) continue;
    const r = mv.raio;
    vs.push({ rumo: (Math.atan2(x, y) / RAD + 360) % 360, distancia: Math.max(3, d - r - meuRaio), meiaLargura: Math.atan2(r, d) / RAD, altura: h });
  }
  const fatorArvores = arvores !== null && (alturaPropria ?? ALTURA_DESCONHECIDA_M) <= ARVORES_ATE_M ? 1 - 0.5 * arvores : 1;
  let soma = 0;
  let sombraDesde: number | null = null;
  for (const sol of horas ?? solDasHoras(e.centro)) {
    const hora = sol.hora;
    if (sol.elevacaoGraus <= 2) continue;
    const tg = Math.tan(sol.elevacaoGraus * RAD);
    const tapado = vs.some((v) => difAngulo(v.rumo, sol.azimuteGraus) <= v.meiaLargura + 5 && v.altura - z > v.distancia * tg);
    if (tapado) { if (sombraDesde === null) sombraDesde = hora; continue; }
    // Fração do contorno iluminada de frente: cada lado pesa pelo cosseno entre a normal e o Sol (no plano).
    const frente = lados.reduce((s, l) => s + l.comprimento * Math.max(0, Math.cos(difAngulo(l.normal, sol.azimuteGraus) * RAD)), 0) / perimetro;
    soma += frente * fatorArvores;
  }
  const fracaoPoente = lados.filter((l) => l.normal >= 225 && l.normal <= 315).reduce((s, l) => s + l.comprimento, 0) / perimetro;
  return { valor: soma / HORAS_DA_TARDE.length, fracaoPoente, sombraDesde, arvores, alturaConhecida: alturaPropria !== null };
}

/** Fração de árvores do setor do prédio (Censo 2022), ou null. */
export function arvoresDoSetor(e: Edificio, rua: RuaDoBairro | null | undefined): number | null {
  const i = e.rua?.[0];
  const s = typeof i === "number" ? rua?.setores[i] : undefined;
  if (!s || !s.domicilios || s.arvores === null) return null;
  return Math.min(1, s.arvores / s.domicilios);
}

const PASSO_GRADE = 0.0015;
const cache = new WeakMap<readonly Edificio[], Map<string, SolDaTarde>>();

/** Sol da tarde de todos os prédios do bairro (com polígono), uma vez por lista de edifícios. */
export function solDaTardeDoBairro(edificios: readonly Edificio[], rua: RuaDoBairro | null | undefined): Map<string, SolDaTarde> {
  const pronto = cache.get(edificios);
  if (pronto) return pronto;
  const grade = new Map<string, Edificio[]>();
  const celula = (lon: number, lat: number) => `${Math.floor(lon / PASSO_GRADE)}|${Math.floor(lat / PASSO_GRADE)}`;
  for (const e of edificios) {
    const k = celula(e.centro[0], e.centro[1]);
    const l = grade.get(k);
    if (l) l.push(e); else grade.set(k, [e]);
  }
  // Caches do bairro: raio e altura de cada edifício uma vez; o Sol das 9 horas, no centro do bairro (a diferença de
  // posição solar dentro de um bairro é desprezível para ordenar fachadas).
  const medidas = new Map<string, Medidas>();
  const medir = (x: Edificio) => { let m = medidas.get(x.id); if (!m) { m = medidasDe(x); medidas.set(x.id, m); } return m; };
  const meio: [number, number] = edificios.length
    ? [edificios.reduce((s, e) => s + e.centro[0], 0) / edificios.length, edificios.reduce((s, e) => s + e.centro[1], 0) / edificios.length]
    : [-34.9, -8.05];
  const horas = solDasHoras(meio);
  const out = new Map<string, SolDaTarde>();
  for (const e of edificios) {
    const cx = Math.floor(e.centro[0] / PASSO_GRADE), cy = Math.floor(e.centro[1] / PASSO_GRADE);
    const perto: Edificio[] = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) perto.push(...(grade.get(`${cx + dx}|${cy + dy}`) ?? []));
    const s = solDaTardeDoPredio(e, perto, arvoresDoSetor(e, rua), medir, horas);
    if (s) out.set(e.id, s);
  }
  cache.set(edificios, out);
  return out;
}

/** "15h", "15h30". */
export const horaEmTexto = (h: number) => `${Math.floor(h)}h${h % 1 ? "30" : ""}`;
