// Rotina por horário (VE05): calendário de serviço e roteamento programado sobre a grade compacta do GTFS fixado.
// Puro (sem React, sem rede, sem zod): usado pelo app, pelo Jest e pelo pipeline Node. Semântica GTFS Schedule:
// - uma viagem circula na data D se o serviço dela está ativo em D (calendar: dia da semana dentro de início–fim;
//   calendar_dates: tipo 1 acrescenta, tipo 2 remove naquela data);
// - horários são do dia de serviço e podem passar de 24:00 (25:10 = 01:10 do dia seguinte). Uma consulta às 00:30 de D
//   também enxerga as viagens do dia de serviço D−1 com horário ≥ 24:30;
// - pickup_type/drop_off_type = 1 proíbem embarque/desembarque naquela parada.
// Isto é horário PROGRAMADO, não observado: atraso, lotação e quebra não entram (ver VE05.04 / VE14).
// Algoritmo: RAPTOR (rodadas = número de viagens), rotas = (padrão de paradas, perfil de tempo) com viagens FIFO.

export type GradeCompacta = {
  formato: 1;
  versao: string;
  feed: { versao: string | null; sha256: string; inicio: string | null; fim: string | null; fuso: string | null; publicador: string | null };
  paradas: { n: string[]; x: number[]; y: number[] };
  servicos: { id: string[]; dias: number[]; de: number[]; ate: number[] };
  excecoes: [number, number, number][];
  linhas: { c: string[]; n: string[]; m: number[] };
  padroes: { l: number; s: number; p: number[]; f?: number[]; a: string }[];
  rotas: { q: number; t: number[]; h: number[]; v: number[]; d?: 1 }[];
  /** Pares de baldeação a pé [a, b, segundos], `a` em delta; simétricos. */
  baldeacoes: number[];
  caminhada: { velocidadeMps: number; fatorDeDesvio: number };
};

type Rota = { padrao: number; chegada: Int32Array; partida: Int32Array; inicios: Int32Array; servicos: Int32Array };
export type GradePronta = {
  bruta: GradeCompacta;
  n: number;
  lon: Float64Array;
  lat: Float64Array;
  padroes: { linha: number; sentido: number; paradas: Int32Array; bandeiras: Uint8Array | null; rotulo: string }[];
  rotas: Rota[];
  /** Por parada: pares (rota, posição) achatados. */
  rotasDaParada: Int32Array[];
  /** Por parada: pares (parada, segundos) achatados. */
  baldeacoes: Int32Array[];
};

const DIA = 86400;

function acumular(a: number[]): number[] {
  const out = new Array<number>(a.length);
  let s = 0;
  for (let i = 0; i < a.length; i++) { s += a[i]!; out[i] = s; }
  return out;
}

export function prepararGrade(bruta: GradeCompacta): GradePronta {
  const x = acumular(bruta.paradas.x), y = acumular(bruta.paradas.y);
  const n = x.length;
  const lon = new Float64Array(n), lat = new Float64Array(n);
  for (let i = 0; i < n; i++) { lon[i] = x[i]! / 1e5; lat[i] = y[i]! / 1e5; }
  const padroes = bruta.padroes.map((p) => ({
    linha: p.l, sentido: p.s, paradas: Int32Array.from(acumular(p.p)), bandeiras: p.f ? Uint8Array.from(p.f) : null, rotulo: p.a,
  }));
  const listas: number[][] = Array.from({ length: n }, () => []);
  const rotas: Rota[] = bruta.rotas.map((r, ri) => {
    const pd = padroes[r.q]!;
    const k = pd.paradas.length;
    const chegada = new Int32Array(k), partida = new Int32Array(k);
    if (r.d) {
      let s = 0;
      for (let i = 0; i < k; i++) { s += r.t[2 * i]!; chegada[i] = s; s += r.t[2 * i + 1]!; partida[i] = s; }
    } else {
      let s = 0;
      for (let i = 0; i < k; i++) { if (i) s += r.t[i - 1]!; chegada[i] = s; partida[i] = s; }
    }
    for (let i = 0; i < k; i++) listas[pd.paradas[i]!]!.push(ri, i);
    return { padrao: r.q, chegada, partida, inicios: Int32Array.from(acumular(r.h)), servicos: Int32Array.from(r.v) };
  });
  const bald: number[][] = Array.from({ length: n }, () => []);
  let a = 0;
  for (let i = 0; i + 2 < bruta.baldeacoes.length; i += 3) {
    a += bruta.baldeacoes[i]!;
    const b = bruta.baldeacoes[i + 1]!, s = bruta.baldeacoes[i + 2]!;
    bald[a]!.push(b, s); bald[b]!.push(a, s);
  }
  return { bruta, n, lon, lat, padroes, rotas, rotasDaParada: listas.map((l) => Int32Array.from(l)), baldeacoes: bald.map((l) => Int32Array.from(l)) };
}

// ——— Calendário ————————————————————————————————————————————————————————————————————————————

/** "2026-11-17" → 20261117. */
export function numeroDaData(iso: string): number {
  return Number(iso.slice(0, 10).replaceAll("-", ""));
}
/** 20261117 → "2026-11-17". */
export function isoDoNumero(n: number): string {
  const s = String(n);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
/** 0 = segunda … 6 = domingo (ordem do calendar.txt). */
export function diaDaSemana(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number) as [number, number, number];
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
}
export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

export function dentroDaValidade(g: GradePronta, iso: string): boolean {
  const d = numeroDaData(iso);
  const { inicio, fim } = g.bruta.feed;
  return (!inicio || d >= Number(inicio)) && (!fim || d <= Number(fim));
}

/** Serviços ativos na data (1 = ativo). Fora da validade do feed, nada fica ativo. */
export function servicosAtivos(g: GradePronta, iso: string): Uint8Array {
  const s = g.bruta.servicos;
  const out = new Uint8Array(s.id.length);
  if (!dentroDaValidade(g, iso)) return out;
  const d = numeroDaData(iso);
  const bit = 1 << diaDaSemana(iso);
  for (let i = 0; i < out.length; i++) if (s.dias[i]! & bit && d >= s.de[i]! && d <= s.ate[i]!) out[i] = 1;
  for (const [data, serv, tipo] of g.bruta.excecoes) if (data === d) out[serv] = tipo === 1 ? 1 : 0;
  return out;
}

/** Número de exceções de calendário na data (feriado, operação especial). */
export function excecoesNaData(g: GradePronta, iso: string): number {
  const d = numeroDaData(iso);
  let n = 0;
  for (const [data] of g.bruta.excecoes) if (data === d) n += 1;
  return n;
}

/** Serviços do dia de serviço da consulta e dos vizinhos: às 00:20 de D ainda rodam viagens 24:xx de D−1, e uma
 * consulta pedida como 24:20 de D precisa das viagens 00:xx de D+1. */
export type Ativos = { hoje: Uint8Array; ontem: Uint8Array; amanha: Uint8Array };
export function ativosEm(g: GradePronta, iso: string): Ativos {
  return { hoje: servicosAtivos(g, iso), ontem: servicosAtivos(g, somarDias(iso, -1)), amanha: servicosAtivos(g, somarDias(iso, 1)) };
}

// ——— Roteamento ———————————————————————————————————————————————————————————————————————————

export type Ponta = { parada: number; seg: number };
export type Perna =
  | { tipo: "a_pe"; de: number | null; para: number | null; seg: number }
  | { tipo: "viagem"; rota: number; viagem: number; dia: number; linha: number; sentido: string; de: number; para: number; partida: number; chegada: number; paradas: number };
export type Jornada = { saida: number; chegada: number; duracao: number; viagens: number; pernas: Perna[]; espera: number; aPe: number };

type Rotulo = { tipo: 0 } | { tipo: 1; rota: number; viagem: number; dia: number; de: number; ate: number } | { tipo: 2; de: number; seg: number };

export type Opcoes = { maxViagens?: number; horizonte?: number; folga?: number; penalidade?: number };

/**
 * Viagem mais cedo da rota que parte da posição `i` em ≥ `t` (segundos do dia de serviço da consulta).
 * Considera também as viagens do dia anterior (horário ≥ 24h) e do seguinte. Devolve [índice, deslocamento do dia] ou null.
 */
/** Índice da viagem mais cedo do dia `dia` (deslocamento em s) que parte da posição `i` em ≥ `t`, ou −1. */
function cedoNoDia(r: Rota, i: number, t: number, ativos: Uint8Array, dia: number, ateT: number): number {
  const ini = r.inicios, part = r.partida[i]!, serv = r.servicos;
  const alvo = t - dia - part;
  let lo = 0, hi = ini.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (ini[m]! < alvo) lo = m + 1; else hi = m; }
  for (let j = lo; j < ini.length; j++) {
    if (ini[j]! + part + dia >= ateT) return -1;
    if (ativos[serv[j]!]) return j;
  }
  return -1;
}
// Resultado de viagemMaisCedo sem alocar (o laço interno chama isto milhares de vezes por busca).
let achadaViagem = -1, achadoDia = 0;
/**
 * Viagem mais cedo da rota que parte da posição `i` em ≥ `t` (segundos do dia de serviço da consulta), considerando
 * também as viagens do dia anterior (horário ≥ 24h) e do seguinte. Deixa o resultado em achadaViagem/achadoDia.
 */
function viagemMaisCedo(r: Rota, i: number, t: number, a: Ativos): boolean {
  achadaViagem = -1; achadoDia = 0;
  let melhorT = Infinity;
  const part = r.partida[i]!;
  for (let k = 0; k < 3; k++) {
    const dia = k === 0 ? 0 : k === 1 ? -DIA : DIA;
    const j = cedoNoDia(r, i, t, k === 0 ? a.hoje : k === 1 ? a.ontem : a.amanha, dia, melhorT);
    if (j >= 0) { achadaViagem = j; achadoDia = dia; melhorT = r.inicios[j]! + part + dia; }
  }
  return achadaViagem >= 0;
}

type Rascunho = { fila: Int32Array; naFila: Int32Array; marca: Uint8Array };
const rascunhos = new WeakMap<GradePronta, Rascunho>();

/**
 * RAPTOR de `origens` (parada + segundos de caminhada) saindo em `saida`. `destino` (opcional) poda a busca: nenhuma
 * chegada pior que a melhor já possível no destino é guardada. Devolve um objeto para extrair jornadas.
 */
export function raptor(g: GradePronta, origens: Ponta[], saida: number, ativos: Ativos, opcoes: Opcoes = {}, destino: Ponta[] = []) {
  const K = opcoes.maxViagens ?? 3;
  const limite = saida + (opcoes.horizonte ?? 3 * 3600);
  const folga = opcoes.folga ?? 120;
  const n = g.n;
  let rs = rascunhos.get(g);
  if (!rs) { rs = { fila: new Int32Array(g.rotas.length).fill(-1), naFila: new Int32Array(g.rotas.length), marca: new Uint8Array(n) }; rascunhos.set(g, rs); }
  const { fila, naFila, marca } = rs;
  const tau: Float64Array[] = [];
  const rot: (Rotulo | null)[][] = [];
  const melhor = new Float64Array(n).fill(Infinity);
  const saidaFinal = new Float64Array(n).fill(Infinity);
  for (const d of destino) saidaFinal[d.parada] = Math.min(saidaFinal[d.parada]!, d.seg);
  let alvo = Infinity;
  // Momento em que dá para embarcar (chegada de ônibus + folga; a pé já inclui a folga).
  const embarcavel: Float64Array[] = [];
  let marcadas: number[] = [];
  tau.push(new Float64Array(n).fill(Infinity));
  rot.push(new Array(n).fill(null));
  embarcavel.push(new Float64Array(n).fill(Infinity));
  for (const o of origens) {
    const t = saida + o.seg;
    if (t < tau[0]![o.parada]!) {
      tau[0]![o.parada] = t; embarcavel[0]![o.parada] = t; melhor[o.parada] = t; rot[0]![o.parada] = { tipo: 0 };
      if (!marca[o.parada]) { marca[o.parada] = 1; marcadas.push(o.parada); }
    }
  }
  for (const p of marcadas) marca[p] = 0;
  for (let k = 1; k <= K && marcadas.length; k++) {
    const tk = Float64Array.from(tau[k - 1]!);
    // Carrega o "pode embarcar" das rodadas anteriores: uma rota enfileirada por outra parada também pode ser
    // tomada numa parada alcançada antes.
    const ek = Float64Array.from(embarcavel[k - 1]!);
    const rk: (Rotulo | null)[] = new Array(n).fill(null);
    tau.push(tk); embarcavel.push(ek); rot.push(rk);
    let nFila = 0;
    for (let m = 0; m < marcadas.length; m++) {
      const l = g.rotasDaParada[marcadas[m]!]!;
      for (let j = 0; j < l.length; j += 2) {
        const r = l[j]!, pos = l[j + 1]!;
        if (fila[r] === -1) { fila[r] = pos; naFila[nFila++] = r; } else if (pos < fila[r]!) fila[r] = pos;
      }
    }
    const novas: number[] = [];
    const anterior = embarcavel[k - 1]!;
    for (let q = 0; q < nFila; q++) {
      const ri = naFila[q]!;
      const pos0 = fila[ri]!;
      fila[ri] = -1;
      const r = g.rotas[ri]!;
      const pd = g.padroes[r.padrao]!;
      const paradas = pd.paradas, bandeiras = pd.bandeiras;
      let viagem = -1, dia = 0, embarque = -1, base = 0;
      for (let i = pos0; i < paradas.length; i++) {
        const p = paradas[i]!;
        const b = bandeiras ? bandeiras[i]! : 0;
        if (viagem >= 0 && !(b & 2)) {
          const chega = base + r.chegada[i]!;
          if (chega < melhor[p]! && chega <= limite && chega < alvo) {
            tk[p] = chega; melhor[p] = chega; ek[p] = chega + folga;
            const s = saidaFinal[p]!;
            if (s + chega < alvo) alvo = s + chega;
            rk[p] = { tipo: 1, rota: ri, viagem, dia, de: embarque, ate: i };
            if (!marca[p]) { marca[p] = 1; novas.push(p); }
          }
        }
        const pode = anterior[p]!;
        if (!(b & 1) && pode < Infinity) {
          const atual = viagem >= 0 ? base + r.partida[i]! : Infinity;
          if (pode <= atual && viagemMaisCedo(r, i, pode, ativos) && r.inicios[achadaViagem]! + r.partida[i]! + achadoDia < atual) {
            viagem = achadaViagem; dia = achadoDia; embarque = i; base = r.inicios[viagem]! + dia;
          }
        }
      }
    }
    // Baldeações a pé a partir das paradas alcançadas de ônibus nesta rodada.
    const deOnibus = novas.length;
    for (let m = 0; m < deOnibus; m++) {
      const p = novas[m]!;
      const l = g.baldeacoes[p]!;
      for (let j = 0; j < l.length; j += 2) {
        const q = l[j]!, s = l[j + 1]!;
        const t = tk[p]! + s + folga;
        if (t < melhor[q]! && t <= limite && t < alvo) {
          tk[q] = t; melhor[q] = t; ek[q] = t; rk[q] = { tipo: 2, de: p, seg: s };
          const sf = saidaFinal[q]!;
          if (sf + t < alvo) alvo = sf + t;
          if (!marca[q]) { marca[q] = 1; novas.push(q); }
        }
      }
    }
    for (const p of novas) marca[p] = 0;
    marcadas = novas;
  }
  return { tau, rot, saida, K: tau.length - 1 };
}

/** Melhor chegada ao destino (paradas + caminhada final) e a jornada reconstruída. */
export function melhorJornada(g: GradePronta, res: ReturnType<typeof raptor>, destino: Ponta[], origens: Ponta[], penalidade = 300): Jornada | null {
  // Cada viagem a mais precisa poupar `penalidade` segundos: sem isso, um ônibus de 2 min troca uma caminhada curta.
  let best = Infinity, custo = Infinity, bk = -1, bp = -1, bseg = 0;
  for (let k = 1; k <= res.K; k++) {
    let ak = Infinity, pk = -1, sk = 0;
    for (const d of destino) {
      const t = res.tau[k]![d.parada]! + d.seg;
      if (t < ak) { ak = t; pk = d.parada; sk = d.seg; }
    }
    if (pk < 0 || ak === Infinity) continue;
    // A rodada k guarda o melhor com até k viagens; a reconstrução desce até a rodada que de fato chegou.
    let kk = k;
    while (kk > 0 && !res.rot[kk]![pk]) kk -= 1;
    if (kk === 0) continue;
    const c = ak + penalidade * (kk - 1);
    if (c < custo - 1e-9) { custo = c; best = ak; bk = kk; bp = pk; bseg = sk; }
  }
  if (bk < 0) return null;
  const pernas: Perna[] = [];
  if (bseg > 0) pernas.push({ tipo: "a_pe", de: bp, para: null, seg: bseg });
  let k = bk, p = bp;
  let guarda = 0;
  while (k >= 0 && guarda++ < 50) {
    // Sobe as rodadas até achar o rótulo que definiu p nesta rodada.
    let r = res.rot[k]![p];
    while (!r && k > 0) { k -= 1; r = res.rot[k]![p]; }
    if (!r) return null;
    if (r.tipo === 0) {
      const o = origens.find((x) => x.parada === p);
      pernas.push({ tipo: "a_pe", de: null, para: p, seg: o?.seg ?? 0 });
      break;
    }
    if (r.tipo === 2) { pernas.push({ tipo: "a_pe", de: r.de, para: p, seg: r.seg }); p = r.de; continue; }
    const rota = g.rotas[r.rota]!;
    const pd = g.padroes[rota.padrao]!;
    const base = rota.inicios[r.viagem]! + r.dia;
    pernas.push({ tipo: "viagem", rota: r.rota, viagem: r.viagem, dia: r.dia, linha: pd.linha, sentido: pd.rotulo, de: pd.paradas[r.de]!, para: pd.paradas[r.ate]!,
      partida: base + rota.partida[r.de]!, chegada: base + rota.chegada[r.ate]!, paradas: r.ate - r.de });
    p = pd.paradas[r.de]!;
    k -= 1;
  }
  pernas.reverse();
  const viagens = pernas.filter((x) => x.tipo === "viagem").length;
  const aPe = pernas.reduce((s, x) => s + (x.tipo === "a_pe" ? x.seg : 0), 0);
  const emViagem = pernas.reduce((s, x) => s + (x.tipo === "viagem" ? x.chegada - x.partida : 0), 0);
  const duracao = best - res.saida;
  return { saida: res.saida, chegada: best, duracao, viagens, pernas, aPe, espera: Math.max(0, duracao - aPe - emViagem) };
}

// ——— Caminhada estimada (destinos fora da rede publicada) ————————————————————————————————————

export function distanciaM(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const r = 6371008.8, rad = Math.PI / 180;
  const dlat = (lat2 - lat1) * rad, dlon = (lon2 - lon1) * rad;
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dlon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Paradas a até `raioM` em linha reta de um ponto, com segundos de caminhada estimados (linha reta × fator de desvio). */
export function pontasEstimadas(g: GradePronta, lon: number, lat: number, raioM = 800): Ponta[] {
  const { velocidadeMps, fatorDeDesvio } = g.bruta.caminhada;
  const out: Ponta[] = [];
  const dLat = raioM / 111_000, dLon = raioM / (111_000 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i < g.n; i++) {
    if (Math.abs(g.lat[i]! - lat) > dLat || Math.abs(g.lon[i]! - lon) > dLon) continue;
    const m = distanciaM(lon, lat, g.lon[i]!, g.lat[i]!);
    if (m <= raioM) out.push({ parada: i, seg: Math.round((m * fatorDeDesvio) / velocidadeMps) });
  }
  return out;
}

// ——— Janelas de saída ——————————————————————————————————————————————————————————————————————

export type ResultadoDaJanela =
  | { estado: "fora_da_validade"; data: string }
  | { estado: "sem_servico"; data: string; amostras: number; comViagem: number }
  | { estado: "ok"; data: string; amostras: number; comViagem: number; mediana: number; pior: number; tipica: Jornada; soAPe: boolean };

/**
 * Sai de `origens` a cada `passo` segundos em [ini, fim] na data de serviço `iso` e mede o tempo porta a porta até
 * `destino`. `aPeSeg`: caminhada direta estimada (se ganhar do ônibus, a amostra vale a pé). Mediana e pior caso
 * (cauda) das amostras; a jornada típica é a da amostra mediana.
 */
export function avaliarJanela(g: GradePronta, origens: Ponta[], destino: Ponta[], iso: string, ini: number, fim: number,
  { passo = 300, aPeSeg = Infinity, ...opcoes }: Opcoes & { passo?: number; aPeSeg?: number } = {}): ResultadoDaJanela {
  if (!dentroDaValidade(g, iso)) return { estado: "fora_da_validade", data: iso };
  const ativos = ativosEm(g, iso);
  const amostras: { dur: number; j: Jornada | null }[] = [];
  let comViagem = 0;
  for (let t = ini; t <= fim; t += passo) {
    const res = raptor(g, origens, t, ativos, opcoes, destino);
    const j = melhorJornada(g, res, destino, origens, opcoes.penalidade);
    if (j) comViagem += 1;
    const dur = Math.min(j ? j.duracao : Infinity, aPeSeg);
    amostras.push({ dur, j: j && j.duracao <= aPeSeg ? j : null });
  }
  const validas = amostras.filter((a) => Number.isFinite(a.dur));
  if (validas.length * 2 < amostras.length) return { estado: "sem_servico", data: iso, amostras: amostras.length, comViagem };
  const ord = [...amostras].sort((a, b) => a.dur - b.dur);
  const med = ord[Math.floor((ord.length - 1) / 2)]!;
  const pior = ord[ord.length - 1]!.dur;
  const tipica = med.j ?? { saida: ini, chegada: ini + med.dur, duracao: med.dur, viagens: 0, pernas: [{ tipo: "a_pe", de: null, para: null, seg: med.dur }], espera: 0, aPe: med.dur };
  return { estado: "ok", data: iso, amostras: amostras.length, comViagem, mediana: med.dur, pior, tipica, soAPe: !med.j };
}

/**
 * Última volta útil: a saída mais tarde entre `ini` e `fim` (pode passar de 24h) que ainda chega com ônibus em até
 * `maxDuracao`. Varredura linear em passos de `passo` e refinamento de 5 min depois da última saída viável: com linhas da
 * madrugada, as saídas viáveis não formam um intervalo único, então não dá para usar busca binária.
 */
export function ultimaVolta(g: GradePronta, origens: Ponta[], destino: Ponta[], iso: string, ini: number, fim: number,
  { passo = 900, maxDuracao = 90 * 60, ...opcoes }: Opcoes & { passo?: number; maxDuracao?: number } = {}): Jornada | null {
  if (!dentroDaValidade(g, iso)) return null;
  const ativos = ativosEm(g, iso);
  const em = (t: number) => {
    const j = melhorJornada(g, raptor(g, origens, t, ativos, { ...opcoes, horizonte: maxDuracao }, destino), destino, origens, opcoes.penalidade);
    return j && j.viagens > 0 && j.duracao <= maxDuracao ? j : null;
  };
  let ultima: Jornada | null = null, tUltima = -1;
  for (let t = ini; t <= fim; t += passo) { const j = em(t); if (j) { ultima = j; tUltima = t; } }
  if (!ultima) return null;
  for (let t = tUltima + 300; t < Math.min(tUltima + passo, fim + 1); t += 300) { const j = em(t); if (j) ultima = j; else break; }
  return ultima;
}

/** Primeira data ≥ `iso` com o dia da semana pedido (0 = segunda), dentro da validade e sem exceção de calendário. */
export function proximaDataTipica(g: GradePronta, iso: string, dia: number, limiteDias = 60): string | null {
  for (let i = 0; i <= limiteDias; i++) {
    const d = somarDias(iso, i);
    if (!dentroDaValidade(g, d)) return null;
    if (diaDaSemana(d) === dia && excecoesNaData(g, d) === 0) return d;
  }
  return null;
}
