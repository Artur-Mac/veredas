// Rotina por horário (VE05): calendário de serviço, roteamento programado e pacote real do piloto.
import { describe, expect, it } from "@jest/globals";
import gTransit from "../docs/aplicacao/evaluation-sets/g-transit.json";
import {
  CENARIOS,
  acessoDoPredio,
  avaliarCenario,
  diferencaMensalHoras,
  frasesDaJornada,
  gradeDoTransito,
  resumoDoCenario,
  rotuloDaData,
  type ResultadoDoCenario,
} from "../src/dados/recife/transito";
import { VERSAO_DO_TRANSITO } from "../src/dados/recife/transitoGerado";
import {
  ativosEm,
  avaliarJanela,
  melhorJornada,
  pontasEstimadas,
  prepararGrade,
  proximaDataTipica,
  raptor,
  servicosAtivos,
  ultimaVolta,
  type GradeCompacta,
  type Jornada,
  type Ponta,
} from "../src/dados/transito/roteador";

// ——— Grade sintética ————————————————————————————————————————————————————————————————————————
// Paradas 0–5 numa linha; serviços DUT (seg–sex), SAB, DOM; feriado 02/11/2026: DUT removido, DOM acrescentado.
const H = 3600, M = 60;
const delta = (a: number[]) => a.map((x, i) => (i ? x - a[i - 1]! : x));
type Viagem = [inicio: number, servico: number];
function rota(q: number, tempos: number[], viagens: Viagem[]) {
  const v = [...viagens].sort((a, b) => a[0] - b[0]);
  return { q, t: tempos, h: delta(v.map((x) => x[0])), v: v.map((x) => x[1]) };
}
const bruta: GradeCompacta = {
  formato: 1, versao: "sintetica", caminhada: { velocidadeMps: 1.2, fatorDeDesvio: 1.2 },
  feed: { versao: "teste", sha256: "0", inicio: "20260101", fim: "20271026", fuso: "America/Recife", publicador: null },
  paradas: { n: ["P0", "P1", "P2", "P3", "P4", "P5"], x: delta([-3490000, -3490100, -3490200, -3490300, -3490400, -3490310]), y: delta([-805000, -805000, -805000, -805000, -805000, -805010]) },
  servicos: { id: ["DUT", "SAB", "DOM"], dias: [0b0011111, 0b0100000, 0b1000000], de: [20260101, 20260101, 20260101], ate: [20271026, 20271026, 20271026] },
  excecoes: [[20261102, 0, 2], [20261102, 2, 1]],
  linhas: { c: ["A", "B", "C", "D"], n: ["", "", "", ""], m: [3, 3, 3, 3] },
  padroes: [
    { l: 0, s: 0, p: delta([0, 1, 2]), a: "P2" },
    { l: 0, s: 1, p: delta([2, 1, 0]), a: "P0" },
    { l: 1, s: 0, p: delta([2, 3]), a: "P3" },
    { l: 2, s: 0, p: delta([1, 4]), f: [1, 0], a: "P4" },
    { l: 3, s: 0, p: delta([0, 3]), a: "P3" },
  ],
  rotas: [
    rota(0, [5 * M, 5 * M], [[7 * H, 0], [7 * H + 30 * M, 0], [9 * H, 1], [8 * H, 2], [25 * H, 0]]),
    rota(1, [5 * M, 5 * M], [[18 * H, 0]]),
    rota(2, [4 * M], [[7 * H + 12 * M, 0], [7 * H + 20 * M, 0]]),
    rota(3, [5 * M], [[7 * H, 0]]),
    rota(4, [19 * M], [[7 * H, 0]]),
  ],
  baldeacoes: [3, 5, 60],
};
const g = prepararGrade(bruta);
const em = (p: number): Ponta[] => [{ parada: p, seg: 0 }];
const jornada = (de: number, para: number, iso: string, t: number, opcoes = {}): Jornada | null =>
  melhorJornada(g, raptor(g, em(de), t, ativosEm(g, iso), opcoes, em(para)), em(para), em(de), (opcoes as { penalidade?: number }).penalidade);
const viagens = (j: Jornada | null) => j?.pernas.filter((p) => p.tipo === "viagem").map((p) => p.tipo === "viagem" ? `${bruta.linhas.c[p.linha]}@${p.partida}` : "") ?? null;

describe("calendário de serviço", () => {
  it("dia útil, sábado, domingo e o feriado que troca DUT por DOM", () => {
    expect([...servicosAtivos(g, "2026-11-17")]).toEqual([1, 0, 0]);
    expect([...servicosAtivos(g, "2026-11-21")]).toEqual([0, 1, 0]);
    expect([...servicosAtivos(g, "2026-11-22")]).toEqual([0, 0, 1]);
    expect([...servicosAtivos(g, "2026-11-02")]).toEqual([0, 0, 1]);
    expect([...servicosAtivos(g, "2026-11-09")]).toEqual([1, 0, 0]);
  });
  it("fora da validade do feed nada circula; a data típica pula o feriado", () => {
    expect([...servicosAtivos(g, "2027-10-27")]).toEqual([0, 0, 0]);
    expect(avaliarJanela(g, em(0), em(2), "2027-11-03", 7 * H, 8 * H).estado).toBe("fora_da_validade");
    expect(proximaDataTipica(g, "2026-10-31", 0)).toBe("2026-11-09");
  });
});

describe("roteamento programado", () => {
  it("embarca na primeira viagem que dá e desce no destino", () => {
    const j = jornada(0, 2, "2026-11-17", 6 * H + 55 * M)!;
    expect(viagens(j)).toEqual([`A@${7 * H}`]);
    expect(j.chegada).toBe(7 * H + 10 * M);
    expect(j.espera).toBe(5 * M);
  });
  it("baldeação respeita a folga: chega 07:10, folga de 2 min pega 07:12; folga de 3 min só 07:20", () => {
    expect(viagens(jornada(0, 3, "2026-11-17", 6 * H + 55 * M, { penalidade: 0 }))).toEqual([`A@${7 * H}`, `B@${7 * H + 12 * M}`]);
    expect(viagens(jornada(0, 3, "2026-11-17", 6 * H + 55 * M, { penalidade: 0, folga: 180 }))).toEqual([`D@${7 * H}`]);
  });
  it("uma viagem a mais precisa poupar a penalidade: 3 min mais rápido com baldeação perde para o direto", () => {
    expect(viagens(jornada(0, 3, "2026-11-17", 6 * H + 55 * M))).toEqual([`D@${7 * H}`]);
  });
  it("baldeação a pé entre paradas vizinhas", () => {
    const j = jornada(0, 5, "2026-11-17", 6 * H + 55 * M)!;
    expect(j.pernas.at(-1)).toMatchObject({ tipo: "a_pe", de: 3, para: 5, seg: 60 });
  });
  it("sábado usa o serviço de sábado; domingo sem viagem nesta linha fica sem serviço", () => {
    expect(viagens(jornada(0, 2, "2026-11-21", 8 * H))).toEqual([`A@${9 * H}`]);
    expect(avaliarJanela(g, em(0), em(3), "2026-11-22", 7 * H, 8 * H).estado).toBe("sem_servico");
  });
  it("feriado: a viagem das 07:00 (DUT) some e vale a de domingo, 08:00", () => {
    expect(viagens(jornada(0, 2, "2026-11-02", 6 * H + 55 * M))).toEqual([`A@${8 * H}`]);
  });
  it("25:00 do dia de serviço 17/11 é 01:00 de 18/11: pedido dos dois jeitos dá a mesma viagem", () => {
    const a = jornada(0, 2, "2026-11-17", 24 * H + 50 * M)!;
    const b = jornada(0, 2, "2026-11-18", 50 * M)!;
    expect(a.chegada).toBe(25 * H + 10 * M);
    expect(b.chegada).toBe(H + 10 * M);
    expect(a.duracao).toBe(b.duracao);
    expect(b.pernas.find((p) => p.tipo === "viagem")).toMatchObject({ dia: -86400 });
  });
  it("sentidos opostos são padrões diferentes; o de volta só às 18:00", () => {
    expect(viagens(jornada(2, 0, "2026-11-17", 17 * H + 50 * M))).toEqual([`A@${18 * H}`]);
    expect(jornada(0, 2, "2026-11-17", 17 * H + 50 * M)).toBeNull();
  });
  it("parada sem embarque (pickup_type = 1) não serve de origem", () => {
    expect(jornada(1, 4, "2026-11-17", 6 * H + 50 * M)).toBeNull();
  });
  it("última volta: a saída mais tarde que ainda pega a viagem das 18:00", () => {
    const u = ultimaVolta(g, em(2), em(0), "2026-11-17", 16 * H, 20 * H, { passo: 900, maxDuracao: 90 * M })!;
    expect(u.pernas.find((p) => p.tipo === "viagem")).toMatchObject({ partida: 18 * H });
    expect(u.saida).toBe(18 * H);
  });
});

// ——— Pacote real ——————————————————————————————————————————————————————————————————————————————

describe("pacote real do piloto", () => {
  const real = gradeDoTransito();
  it("a grade abre, bate com a versão gerada e tem o feed fixado", () => {
    expect(real?.bruta.versao).toBe(VERSAO_DO_TRANSITO);
    expect(real?.bruta.feed.versao).toBe("v2026.10.26");
    expect(real?.bruta.feed.fuso).toBe("America/Recife");
  });
  it("acesso: ligação forte → paradas pela rede; ligação fraca → sem tempo; fora do piloto → nada", () => {
    const forte = acessoDoPredio("boa-viagem", gTransit.casos[0]!.predio);
    expect(forte.estado).toBe("rede");
    if (forte.estado === "rede") expect(forte.origens.length).toBeGreaterThan(0);
    expect(acessoDoPredio("boa-viagem", "5690-1013").estado).toBe("sem_ligacao");
    expect(acessoDoPredio("cabanga", "1-1").estado).toBe("fora_do_piloto");
  });
  it("G-TRANSIT: refazer os itinerários dá as mesmas viagens e a mesma duração", () => {
    const r = real!;
    for (const c of gTransit.casos.filter((x) => x.resultado === "jornada")) {
      const a = acessoDoPredio(c.area, c.predio);
      if (a.estado !== "rede") throw new Error(c.id);
      const noBairro = pontasEstimadas(r, c.centroide[0]!, c.centroide[1]!, 800);
      const [de, para] = c.sentido === "ida" ? [a.origens, noBairro] : [noBairro, a.origens];
      const j = melhorJornada(r, raptor(r, de, c.saidaSeg, ativosEm(r, c.data), {}, para), para, de)!;
      const linhas = j.pernas.flatMap((p) => (p.tipo === "viagem" ? [r.bruta.linhas.c[p.linha]] : []));
      expect([c.id, linhas]).toEqual([c.id, c.pernas!.flatMap((p) => (p.tipo === "viagem" ? [(p as { linha: string }).linha] : []))]);
      expect([c.id, Math.round(j.duracao / 60)]).toEqual([c.id, c.duracaoMin]);
    }
  });
  it("cenário real: Boa Viagem → centro do bairro Recife, dia útil 7h–8h", () => {
    const a = acessoDoPredio("boa-viagem", gTransit.casos[0]!.predio);
    if (a.estado !== "rede") throw new Error("sem acesso");
    const r = avaliarCenario(a.origens, null, { id: "x", rotulo: "centro", lon: -34.87102, lat: -8.05827, aproximado: true }, "util_ida", "2026-11-14");
    expect(r.estado).toBe("ok");
    if (r.estado !== "ok") return;
    expect(r.data).toBe("2026-11-17");
    expect(r.mediana).toBeGreaterThan(10 * M);
    expect(r.mediana).toBeLessThan(2 * H);
    expect(r.pior).toBeGreaterThanOrEqual(r.mediana);
    expect(frasesDaJornada(r.tipica)[0]).toMatch(/^A pé \d+ min até /);
  });
});

describe("redação", () => {
  const ok = (mediana: number, pior: number, viagensN: number): ResultadoDoCenario => ({
    estado: "ok", data: "2026-11-17", mediana, pior, soAPe: false, ultima: null, ultimaAteOFim: false,
    tipica: { saida: 0, chegada: mediana, duracao: mediana, viagens: viagensN, pernas: [], espera: 0, aPe: 0 },
  });
  it("mediana, pior caso só quando difere 2 min ou mais, e baldeações", () => {
    expect(resumoDoCenario(ok(45 * M, 52 * M, 2))).toEqual({ valor: "45 min", detalhe: "até 52 min · 1 baldeação" });
    expect(resumoDoCenario(ok(30 * M, 31 * M, 1))).toEqual({ valor: "30 min", detalhe: "direto" });
    expect(resumoDoCenario({ estado: "sem_servico", data: "2026-11-22" }).detalhe).toContain("dom 22/11");
    expect(resumoDoCenario({ estado: "fora_da_validade", data: null }).valor).toBe("—");
  });
  it("diferença mensal com frequência explícita; sem um dos lados, nada", () => {
    expect(diferencaMensalHoras([ok(50 * M, 0, 1), ok(37 * M, 0, 1)], [ok(50 * M, 0, 1), ok(30 * M, 0, 1)], 20)).toBeCloseTo((-33 * M * 20) / 3600);
    expect(diferencaMensalHoras([ok(50 * M, 0, 1), { estado: "sem_grade" }], [ok(50 * M, 0, 1), ok(30 * M, 0, 1)], 20)).toBeNull();
    expect(diferencaMensalHoras([ok(50 * M, 0, 1), ok(37 * M, 0, 1)], [ok(50 * M, 0, 1), ok(30 * M, 0, 1)], 0)).toBeNull();
  });
  it("datas e cenários fixos", () => {
    expect(rotuloDaData("2026-11-17")).toBe("ter 17/11");
    expect(CENARIOS.map((c) => c.id)).toEqual(["util_ida", "util_volta", "sabado", "tarde"]);
  });
});
