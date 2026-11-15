// Rotina por horário (VE05.03): grade programada do GTFS fixado + acesso a pé da entrada do prédio (VE03) → tempo porta a
// porta por janela de saída, dia útil, sábado e volta tarde. Só desenha o que o roteador calculou; nada aqui é
// pontualidade real (horário programado) nem contagem de paradas.
import { z } from "zod";
import {
  avaliarJanela,
  dentroDaValidade,
  distanciaM,
  pontasEstimadas,
  prepararGrade,
  proximaDataTipica,
  ultimaVolta,
  type GradeCompacta,
  type GradePronta,
  type Jornada,
  type Ponta,
} from "../transito/roteador";
import { faltaCamada, lerCamada } from "../camadas";
import { ARQUIVO_DA_GRADE, ARQUIVOS_DE_ACESSO, VERSAO_DO_TRANSITO } from "./transitoGerado";

/** Os arquivos de camada da rotina por horário (fora do bundle, D036): a grade e o acesso a pé de cada bairro do piloto. */
export function arquivosDoTransito(bairros: readonly (string | null | undefined)[]): string[] {
  const acessos = bairros.map((b) => (b ? ARQUIVOS_DE_ACESSO[b] : undefined)).filter((x): x is string => !!x);
  return [ARQUIVO_DA_GRADE, ...new Set(acessos)];
}

const esquemaAcessos = z.strictObject({
  versao: z.string(),
  grade: z.string(),
  rede: z.string(),
  velocidadeMps: z.number().positive(),
  acessoM: z.number().positive(),
  /** prédio → [parada, metros, parada, metros, …] pela rede, da entrada. */
  predios: z.record(z.string(), z.array(z.number().int().nonnegative())),
});
type Acessos = z.infer<typeof esquemaAcessos>;

let grade: GradePronta | null | undefined;
/** Grade preparada (memória do processo). null se o pacote faltar ou não bater com a versão gerada. */
export function gradeDoTransito(): GradePronta | null {
  if (grade !== undefined) return grade;
  try {
    const bruta = lerCamada(ARQUIVO_DA_GRADE) as GradeCompacta;
    const ok = bruta?.formato === 1 && bruta.versao === VERSAO_DO_TRANSITO && bruta.paradas.n.length === bruta.paradas.x.length &&
      bruta.paradas.x.length === bruta.paradas.y.length && bruta.rotas.every((r) => r.q >= 0 && r.q < bruta.padroes.length && r.h.length === r.v.length);
    grade = ok ? prepararGrade(bruta) : null;
  } catch (e) {
    // Arquivo ainda não carregado não é grade ausente: nada fica guardado e o erro sobe.
    if (faltaCamada(e)) throw e;
    grade = null;
  }
  return grade;
}

const acessos = new Map<string, Acessos | null>();
function acessosDoBairro(bairro: string): Acessos | null {
  if (!acessos.has(bairro)) {
    const arquivo = ARQUIVOS_DE_ACESSO[bairro];
    const p = arquivo ? esquemaAcessos.safeParse(lerCamada(arquivo)) : null;
    acessos.set(bairro, p?.success && p.data.grade === VERSAO_DO_TRANSITO ? p.data : null);
  }
  return acessos.get(bairro) ?? null;
}

export type AcessoDoPredio = { estado: "rede"; origens: Ponta[] } | { estado: "sem_ligacao" } | { estado: "fora_do_piloto" };
/** Paradas a até 1 km da entrada do prédio, em segundos de caminhada pela rede (só ligação forte/revisada, D020). */
export function acessoDoPredio(bairro: string | null | undefined, predioId: string | null | undefined): AcessoDoPredio {
  const a = bairro ? acessosDoBairro(bairro) : null;
  if (!a || !predioId) return { estado: "fora_do_piloto" };
  const l = a.predios[predioId];
  if (!l) return { estado: "sem_ligacao" };
  const origens: Ponta[] = [];
  for (let i = 0; i + 1 < l.length; i += 2) origens.push({ parada: l[i]!, seg: Math.round(l[i + 1]! / a.velocidadeMps) });
  return { estado: "rede", origens };
}

// ——— Cenários ——————————————————————————————————————————————————————————————————————————————

export type DestinoDaRotina = { id: string; rotulo: string; lon: number; lat: number; aproximado: boolean };
export type IdDoCenario = "util_ida" | "util_volta" | "sabado" | "tarde";
type Cenario = { id: IdDoCenario; rotulo: string; dia: number; ini: number; fim: number; sentido: "ida" | "volta" };
const H = 3600;
/** Janelas fixas e explícitas (dia: 0 = segunda … 5 = sábado). A data é a próxima sem exceção de calendário. */
export const CENARIOS: readonly Cenario[] = [
  { id: "util_ida", rotulo: "Dia útil, ida 7h–8h", dia: 1, ini: 7 * H, fim: 8 * H, sentido: "ida" },
  { id: "util_volta", rotulo: "Dia útil, volta 18h–19h", dia: 1, ini: 18 * H, fim: 19 * H, sentido: "volta" },
  { id: "sabado", rotulo: "Sábado, ida 9h–10h", dia: 5, ini: 9 * H, fim: 10 * H, sentido: "ida" },
  { id: "tarde", rotulo: "Volta tarde, saída 22h–23h", dia: 1, ini: 22 * H, fim: 23 * H, sentido: "volta" },
];
const PASSO = 600;
export const ULTIMA_SAIDA = 26 * H;

export type ResultadoDoCenario =
  | { estado: "sem_grade" }
  | { estado: "fora_da_validade"; data: string | null }
  | { estado: "sem_servico"; data: string }
  | { estado: "ok"; data: string; mediana: number; pior: number; tipica: Jornada; soAPe: boolean; ultima: Jornada | null; ultimaAteOFim: boolean };

/** Caminhada direta estimada (linha reta × desvio medido nas baldeações), só para destinos a até 3 km. */
function aPeDireto(g: GradePronta, de: [number, number] | null, para: DestinoDaRotina): number {
  if (!de) return Infinity;
  const m = distanciaM(de[0], de[1], para.lon, para.lat);
  return m <= 3000 ? Math.round((m * g.bruta.caminhada.fatorDeDesvio) / g.bruta.caminhada.velocidadeMps) : Infinity;
}

/**
 * Tempo porta a porta programado de um prédio a um destino num cenário. `hoje` (aaaa-mm-dd, data local) escolhe a data
 * de referência. `centro`: ponto do prédio, só para a caminhada direta estimada.
 */
export function avaliarCenario(origens: Ponta[], centro: [number, number] | null, destino: DestinoDaRotina, cenarioId: IdDoCenario, hoje: string): ResultadoDoCenario {
  const g = gradeDoTransito();
  if (!g) return { estado: "sem_grade" };
  const c = CENARIOS.find((x) => x.id === cenarioId)!;
  if (!dentroDaValidade(g, hoje)) return { estado: "fora_da_validade", data: null };
  const data = proximaDataTipica(g, hoje, c.dia);
  if (!data) return { estado: "fora_da_validade", data: null };
  const noDestino = pontasEstimadas(g, destino.lon, destino.lat, 800);
  const [de, para] = c.sentido === "ida" ? [origens, noDestino] : [noDestino, origens];
  const r = avaliarJanela(g, de, para, data, c.ini, c.fim, { passo: PASSO, aPeSeg: aPeDireto(g, centro, destino) });
  if (r.estado === "fora_da_validade") return { estado: "fora_da_validade", data };
  if (r.estado === "sem_servico") return { estado: "sem_servico", data };
  // Última volta: saídas das 21h às 02h (26h do dia de serviço), chegando em até 90 min. Se ainda houver às 02h, as
  // linhas da madrugada cobrem a noite e a frase diz isso em vez de inventar um horário-limite.
  const ultima = c.id === "tarde" ? ultimaVolta(g, de, para, data, 21 * H, ULTIMA_SAIDA, { passo: 900, maxDuracao: 90 * 60 }) : null;
  return { estado: "ok", data, mediana: r.mediana, pior: r.pior, tipica: r.tipica, soAPe: r.soAPe, ultima, ultimaAteOFim: Boolean(ultima && ultima.saida >= ULTIMA_SAIDA) };
}

// ——— Redação ——————————————————————————————————————————————————————————————————————————————

export const minutosDe = (seg: number) => Math.max(1, Math.round(seg / 60));
/** 25:10 → "01:10". */
export function horaDe(seg: number): string {
  const s = ((seg % 86400) + 86400) % 86400;
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
}
const DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
export function rotuloDaData(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number) as [number, number, number];
  const dia = (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
  return `${DIAS[dia]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

/** "A pé 5 min até Ponto na Avenida X · linha 064 (sentido Recife) às 07:57, desce às 08:35 · a pé 2 min". */
export function frasesDaJornada(j: Jornada): string[] {
  const g = gradeDoTransito();
  if (!g) return [];
  const nome = (p: number | null) => (p === null ? null : g.bruta.paradas.n[p] ?? null);
  const out: string[] = [];
  for (const p of j.pernas) {
    if (p.tipo === "a_pe") {
      if (p.seg < 30) continue;
      const para = nome(p.para);
      out.push(para ? `A pé ${minutosDe(p.seg)} min até ${para}` : `A pé ${minutosDe(p.seg)} min`);
    } else {
      const linha = g.bruta.linhas.c[p.linha] ?? "";
      const modo = ({ 0: "VLT", 1: "metrô", 2: "trem" } as Record<number, string>)[g.bruta.linhas.m[p.linha] ?? 3] ?? "linha";
      out.push(`${modo} ${linha} (sentido ${p.sentido}) às ${horaDe(p.partida)}, desce às ${horaDe(p.chegada)} em ${nome(p.para) ?? "parada"}`);
    }
  }
  if (out.length) out[0] = out[0]!.charAt(0).toUpperCase() + out[0]!.slice(1);
  return out;
}

export function resumoDoCenario(r: ResultadoDoCenario): { valor: string; detalhe: string } {
  switch (r.estado) {
    case "sem_grade": return { valor: "—", detalhe: "Grade de horários indisponível neste aparelho." };
    case "fora_da_validade": return { valor: "—", detalhe: "A grade de horários fixada não cobre esta data." };
    case "sem_servico": return { valor: "Sem ônibus útil", detalhe: `Nenhuma viagem programada leva até lá em menos de 3 h nesta janela (${rotuloDaData(r.data)}).` };
    case "ok": {
      if (r.soAPe) return { valor: `${minutosDe(r.mediana)} min`, detalhe: "A pé é mais rápido que o ônibus (estimado)." };
      const baldeacoes = r.tipica.viagens - 1;
      const extra = r.pior - r.mediana >= 120 ? `até ${minutosDe(r.pior)} min · ` : "";
      return { valor: `${minutosDe(r.mediana)} min`, detalhe: `${extra}${baldeacoes <= 0 ? "direto" : baldeacoes === 1 ? "1 baldeação" : `${baldeacoes} baldeações`}` };
    }
  }
}

/**
 * Diferença mensal com frequência explícita: `dias` idas (7h–8h) e voltas (18h–19h) por mês. Só com os dois lados
 * calculados; devolve horas a mais de `b` em relação a `a` (negativo = `b` gasta menos).
 */
export function diferencaMensalHoras(ida: [ResultadoDoCenario, ResultadoDoCenario], volta: [ResultadoDoCenario, ResultadoDoCenario], dias: number): number | null {
  if (dias <= 0 || [...ida, ...volta].some((r) => r.estado !== "ok")) return null;
  const tot = (i: 0 | 1) => (ida[i] as { mediana: number }).mediana + (volta[i] as { mediana: number }).mediana;
  return ((tot(1) - tot(0)) * dias) / 3600;
}

export const NOTA_DO_TRANSITO =
  "Horário programado do GTFS Grande Recife (não é pontualidade real). Mediana e pior caso de saídas a cada 10 min na janela; " +
  "caminhada da entrada pela rede do mapa e, no destino, estimada em linha reta. Tarifa e lotação não entram.";
