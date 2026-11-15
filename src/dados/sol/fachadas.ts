// Sol nas fachadas do prédio (VE07.02): qual lado do prédio recebe sol direto, de manhã e à tarde, no verão e no
// inverno, e a hora da visita em que a diferença aparece. Usa o motor existente (lerExposicao) com uma "janela" sintética
// no meio de cada lado do volume cadastral do próprio prédio. Não diz nada sobre temperatura interna nem sobre a
// orientação de um apartamento: é o prédio por lado, num andar (o informado ou o 1º).
import { incidenciaNaFace, instanteNoRecife, posicaoDoSol } from "./astronomia";
import { nomeDaDirecao } from "./janelas";
import type { EntornoDaJanela } from "./entorno";
import { alturasDaJanela, emCoordenadas, emMetros, intervalosDoRaio, type EstadoSolar, type Ponto, type VolumeSolar } from "./geometria";

export const DATAS_DAS_ESTACOES = { verao: "2026-12-21", inverno: "2026-06-21" } as const;
const PASSO = 15;
const RAIO_M = 300;

export type Lado = { direcao: string; graus: number; comprimentoM: number; meio: Ponto };
export type Faixa = { min: number; max: number };
/** `frente`: minutos com o Sol à frente da face (só orientação, sem obstáculos); faixa: com os volumes do cadastro. */
export type Periodo = Faixa & { frente: number };
export type SolDoLado = Lado & { verao: { manha: Periodo; tarde: Periodo }; inverno: { manha: Periodo; tarde: Periodo } };

/** Lados do contorno externo agrupados nas 8 direções; só lados com ≥ 8 m somados. */
export function ladosDoVolume(v: VolumeSolar): Lado[] {
  const anel = v.aneis[0]!;
  const ref = anel[0]!;
  const m = anel.map((p) => emMetros(p, ref));
  const area = m.reduce((s, p, i) => { const q = m[(i + 1) % m.length]!; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  const sentido = area >= 0 ? 1 : -1;
  const grupos = new Map<string, { total: number; maior: number; graus: number; meio: Ponto }>();
  for (let i = 0; i + 1 < anel.length; i++) {
    const a = m[i]!, b = m[i + 1]!;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 2) continue;
    // Normal para fora: mesma convenção de facesDoVolume (graus a partir do norte, sentido horário).
    const graus = (Math.atan2(sentido * dy, -sentido * dx) * 180 / Math.PI + 360) % 360;
    const dir = nomeDaDirecao(graus);
    const g = grupos.get(dir) ?? { total: 0, maior: 0, graus, meio: [0, 0] as Ponto };
    g.total += L;
    if (L > g.maior) { g.maior = L; g.graus = graus; g.meio = [(anel[i]![0] + anel[i + 1]![0]) / 2, (anel[i]![1] + anel[i + 1]![1]) / 2]; }
    grupos.set(dir, g);
  }
  return [...grupos].filter(([, g]) => g.total >= 8).map(([direcao, g]) => ({ direcao, graus: Math.round(g.graus) % 360, comprimentoM: Math.round(g.total), meio: g.meio }))
    .sort((a, b) => a.graus - b.graus);
}

/**
 * Estado do lado num instante. Mesmas convenções do motor das janelas (alturas da janela por andar, faixa de altura dos
 * volumes por pavimentos, ponto 5 cm fora da face, o próprio prédio continua como obstáculo), com duas diferenças de
 * propósito, para comparar lados do prédio em vez de uma janela:
 * - um vizinho sem altura no cadastro só torna o resultado incerto se estiver no caminho do raio;
 * - obstáculo além de 300 m: incerto só se um prédio da altura do mais alto conhecido no entorno pudesse tapar o Sol.
 */
export function estadoDoLado(entorno: EntornoDaJanela, _volume: VolumeSolar, lado: Lado, andar: number, dia: string, minutos: number): EstadoSolar {
  const sol = posicaoDoSol(instanteNoRecife(dia, minutos), { longitude: lado.meio[0], latitude: lado.meio[1] });
  if (sol.elevacao <= 0) return "noite";
  if (!incidenciaNaFace(sol, lado.graus)) return "sol_atras_da_face";
  const [zmin, zmax] = alturasDaJanela(andar);
  const g = (lado.graus * Math.PI) / 180, a = (sol.azimute * Math.PI) / 180;
  const origem: Ponto = [0.05 * Math.sin(g), 0.05 * Math.cos(g)];
  const dir: Ponto = [Math.sin(a), Math.cos(a)];
  const tg = Math.tan((sol.elevacao * Math.PI) / 180);
  let incerto = false, maisAlto = 0;
  for (const v of volumesProximos(entorno, lado.meio)) {
    if (v.alturaMaxM !== null) maisAlto = Math.max(maisAlto, v.baseM + v.alturaMaxM);
    // Corte barato: volume atrás da face ou longe do raio.
    const c = v.centroM, t = c[0] * dir[0] + c[1] * dir[1], lat = Math.abs(c[0] * dir[1] - c[1] * dir[0]);
    if (t < -v.raioM || lat > v.raioM) continue;
    for (const [ent, sai] of intervalosDoRaio(origem, dir, v.aneisM)) {
      if (v.alturaMinM === null || v.alturaMaxM === null) { incerto = true; continue; }
      if (v.baseM + v.alturaMinM > zmax + ent * tg && v.baseM <= zmin + sai * tg) return "bloqueado_no_modelo";
      if (v.baseM + v.alturaMaxM > zmin + ent * tg && v.baseM <= zmax + sai * tg) incerto = true;
    }
  }
  if (incerto) return "indeterminado";
  if (sol.elevacao < 3 || (maisAlto - zmin) / tg > RAIO_M) return "indeterminado";
  return "sol_potencial";
}

type VolumeLocal = VolumeSolar & { aneisM: Ponto[][]; centroM: Ponto; raioM: number };
const locais = new WeakMap<EntornoDaJanela, Map<string, VolumeLocal[]>>();
/** Volumes a até 300 m do meio do lado, em metros relativos a ele (calculado uma vez por lado). */
function volumesProximos(entorno: EntornoDaJanela, meio: Ponto): VolumeLocal[] {
  let porLado = locais.get(entorno);
  if (!porLado) { porLado = new Map(); locais.set(entorno, porLado); }
  const k = `${meio[0]},${meio[1]}`;
  let l = porLado.get(k);
  if (!l) {
    l = [];
    for (const v of entorno.recorte.volumes) {
      const aneisM = v.aneis.map((anel) => anel.map((p) => emMetros(p, meio)));
      const xs = aneisM[0]!.map((p) => p[0]), ys = aneisM[0]!.map((p) => p[1]);
      const centroM: Ponto = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
      const raioM = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 1;
      if (Math.hypot(...centroM) - raioM <= RAIO_M) l.push({ ...v, aneisM, centroM, raioM });
    }
    porLado.set(k, l);
  }
  return l;
}

function somar(entorno: EntornoDaJanela, volume: VolumeSolar, lado: Lado, andar: number, dia: string) {
  const out = { manha: { min: 0, max: 0, frente: 0 }, tarde: { min: 0, max: 0, frente: 0 } };
  for (let m = 0; m < 1440; m += PASSO) {
    const e = estadoDoLado(entorno, volume, lado, andar, dia, m + Math.floor(PASSO / 2));
    if (e === "noite" || e === "sol_atras_da_face") continue;
    const p = m < 720 ? out.manha : out.tarde;
    p.frente += PASSO;
    if (e === "sol_potencial") { p.min += PASSO; p.max += PASSO; } else if (e === "indeterminado") p.max += PASSO;
  }
  return out;
}

export type ContrasteDasFachadas =
  | { estado: "sem_geometria" }
  | { estado: "ok"; andar: number; andarInformado: boolean; lados: SolDoLado[]; destaque: { sol: SolDoLado; sombra: SolDoLado; periodo: "manha" | "tarde" } | null; volumeId: string };

/** Sol direto por lado do prédio no verão e no inverno, no andar informado (ou no 1º). */
export function contrasteDasFachadas(entorno: EntornoDaJanela | null, andarInformado: number | null): ContrasteDasFachadas {
  const volume = entorno?.volumesDoImovel[0];
  if (!entorno || !volume || volume.alturaMinM === null) return { estado: "sem_geometria" };
  const andar = andarInformado !== null && andarInformado >= 0 ? andarInformado : 1;
  const lados = ladosDoVolume(volume).map((l) => ({ ...l, verao: somar(entorno, volume, l, andar, DATAS_DAS_ESTACOES.verao), inverno: somar(entorno, volume, l, andar, DATAS_DAS_ESTACOES.inverno) }));
  // Destaque: o par de lados com a maior diferença de sol de frente no verão (só orientação: não depende das alturas
  // desconhecidas). O efeito dos vizinhos entra depois, como ressalva.
  let destaque: { sol: SolDoLado; sombra: SolDoLado; periodo: "manha" | "tarde"; dif: number } | null = null;
  for (const periodo of ["tarde", "manha"] as const) for (const a of lados) for (const b of lados) {
    const dif = a.verao[periodo].frente - b.verao[periodo].frente;
    if (dif >= 120 && (!destaque || dif > destaque.dif)) destaque = { sol: a, sombra: b, periodo, dif };
  }
  return { estado: "ok", andar, andarInformado: andarInformado !== null, lados, volumeId: volume.id, destaque: destaque ? { sol: destaque.sol, sombra: destaque.sombra, periodo: destaque.periodo } : null };
}

/** Primeira hora cheia (8h–17h) da data em que o lado ensolarado tem sol e o outro não: a hora de ver a diferença. */
export function horaDaVisita(entorno: EntornoDaJanela, c: Extract<ContrasteDasFachadas, { estado: "ok" }>, dia: string): number | null {
  const volume = entorno.volumesDoImovel.find((v) => v.id === c.volumeId);
  if (!volume || !c.destaque) return null;
  const horas = c.destaque.periodo === "tarde" ? [13, 14, 15, 16, 17] : [8, 9, 10, 11];
  for (const h of horas) {
    const a = estadoDoLado(entorno, volume, c.destaque.sol, c.andar, dia, h * 60);
    const b = estadoDoLado(entorno, volume, c.destaque.sombra, c.andar, dia, h * 60);
    if ((a === "sol_potencial" || a === "indeterminado") && b === "sol_atras_da_face") return h;
  }
  return null;
}

// ——— Redação ———————————————————————————————————————————————————————————————————————————————

const h = (m: number) => { const x = Math.round(m / 30) / 2; return String(x).replace(".", ","); };
function faixa(f: Faixa): string {
  if (f.max === 0) return "nenhuma hora";
  return h(f.min) === h(f.max) ? `cerca de ${h(f.min)} h` : `de ${h(f.min)} a ${h(f.max)} h`;
}
/** Ressalva dos vizinhos para o lado ensolarado: só afirma quando o modelo é decisivo. */
function ressalva(p: Periodo, andar: number): string {
  if (p.frente === 0) return "";
  if (p.min >= 0.6 * p.frente) return ` No ${andar}º andar, os prédios vizinhos do cadastro não tapam esse sol.`;
  if (p.max <= 0.4 * p.frente) return ` Mas, no ${andar}º andar, prédios vizinhos tapam boa parte dele.`;
  return ` Se prédios vizinhos ou anexos tapam esse sol no ${andar}º andar, o cadastro não permite dizer (há alturas desconhecidas).`;
}
export function fraseDoDestaque(c: Extract<ContrasteDasFachadas, { estado: "ok" }>, hora: number | null): string | null {
  if (!c.destaque) return null;
  const { sol, sombra, periodo } = c.destaque;
  const quando = periodo === "tarde" ? "À tarde" : "De manhã";
  const visita = hora !== null ? ` Para ver a diferença, visite por volta das ${hora}h.` : "";
  // A 8° S, norte e sul trocam de papel entre dezembro e junho: dizer isso quando a orientação mostra a troca.
  const inverte = sombra.inverno[periodo].frente >= 120 && sol.inverno[periodo].frente < sombra.inverno[periodo].frente ? " No inverno (junho) é o contrário." : "";
  const outro = sombra.verao[periodo].frente === 0 ? "nenhuma" : `cerca de ${h(sombra.verao[periodo].frente)} h`;
  return `${quando}, o lado ${sol.direcao} do prédio fica de frente para o sol por cerca de ${h(sol.verao[periodo].frente)} h no verão; o lado ${sombra.direcao}, ${outro}.${inverte}${ressalva(sol.verao[periodo], c.andar)}${visita}`;
}
export function linhasDosLados(c: Extract<ContrasteDasFachadas, { estado: "ok" }>): string[] {
  const per = (nome: string, p: Periodo) => (p.frente === 0 ? null : `${nome} cerca de ${h(p.frente)} h de frente (com os vizinhos, ${faixa(p)})`);
  const est = (e: { manha: Periodo; tarde: Periodo }) => [per("manhã", e.manha), per("tarde", e.tarde)].filter(Boolean).join("; ") || "sem sol de frente";
  return c.lados.map((l) => `Lado ${l.direcao} — verão: ${est(l.verao)}. Inverno: ${est(l.inverno)}.`);
}
export function notaDoMetodo(c: Extract<ContrasteDasFachadas, { estado: "ok" }>): string {
  return `"De frente para o sol" depende só da orientação de cada lado. "Com os vizinhos" é o sol direto no ${c.andar}º andar${c.andarInformado ? " (informado)" : " (andar não informado)"} ` +
    "com os volumes do cadastro da Prefeitura; as alturas vêm dos pavimentos e algumas faltam, por isso há faixas. Árvores, varandas, brises e marquises não entram. Verão = 21/12, inverno = 21/06. Não indica a temperatura dentro do apartamento nem para que lado ficam as janelas dele.";
}
export function perguntaParaVisita(c: Extract<ContrasteDasFachadas, { estado: "ok" }>, hora: number | null): string | null {
  if (!c.destaque) return null;
  return `Sol no lado ${c.destaque.sol.direcao}${hora !== null ? ` por volta das ${hora}h` : ""}: as janelas do apartamento ficam desse lado? Há proteção (varanda, brise, árvore)?`;
}

export { emCoordenadas };
