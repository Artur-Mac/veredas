// Projeção da decisão (VE01). Análises SINTÉTICAS; G-COMPARE usa prédios reais com valores de anúncio sintéticos
// (docs/aplicacao/evaluation-sets/g-compare.json) e rótulos feitos à mão antes da primeira execução
// (g-compare-labels-v1.json). Nada aqui entra em caderno real.
import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import path from "node:path";
import { esquemaAnaliseV2, esquemaEdificio, type AnaliseV2, type Edificio } from "../src/dados/contratos";
import { custoMensal } from "../src/dados/custos";
import { precoDaHoraPoupada, projetarDecisao, type Par, type ProjecaoDaDecisao } from "../src/dados/decisao";
import { derivarDossie } from "../src/dados/dossie/derivar";

const INSTANTE = "2026-11-14T12:00:00.000Z";
const v = (valor: number | null, aConfirmar = false) => ({ valor, origem: "texto" as const, aConfirmar });
const vazio = v(null);
type Periodo = "mes" | "ano" | "desconhecido";
const iptu = (valor: number | null, periodo: Periodo, aConfirmar = false) => ({ ...v(valor, aConfirmar), periodo });

type Mudancas = Partial<Omit<AnaliseV2, "declarados">> & { declarados?: Partial<AnaliseV2["declarados"]> };

function analise(id: string, mudancas: Mudancas = {}): AnaliseV2 {
  const { declarados, ...resto } = mudancas;
  return esquemaAnaliseV2.parse({
    versao: 2, id, criadaEm: INSTANTE, atualizadaEm: INSTANTE, nome: `Imóvel sintético ${id}`, modalidade: "aluguel",
    tipologia: "apartamento", url: "", bairroTexto: "Graças", bairro: "gracas", logradouro: null, numero: null,
    nomeEdificio: null, extracao: null,
    declarados: {
      preco: v(3000), condominio: v(600), iptu: iptu(100, "mes"), seguroIncendio: v(40), taxaServico: vazio, outros: vazio,
      area: v(70), quartos: v(2), suites: vazio, banheiros: v(2), vagas: v(1), andar: v(5), ...declarados,
    },
    vinculo: { estado: "pendente" },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null, ...resto,
  });
}

function edificio(id: string, relevantes24m: number): Edificio {
  return esquemaEdificio.parse({
    id, bairro: "gracas", logradouro: "RUA SINTETICA", numero: id.split("-")[1], dsqfl: "61755015020005", nome: null,
    centro: [-34.9, -8.04], poligono: null, unidades: 20, tipologias: [{ area: 70, unidades: 20, iptuAnualMediano: 1200 }],
    anoConstrucao: 2000, pavimentos: 10, ate4Pavimentos: false, padrao: "Médio", iptuAnual: null, itbi: null,
    obras150m: { licencasDeObra: 10, relevantes24m, demolicoes24m: 0, recentes: [] },
  });
}
const confirmado = (edificioId: string): AnaliseV2["vinculo"] => ({
  estado: "confirmado", edificioId, dsqfl: "61755015020005", confirmadoEm: INSTANTE, indiceGeradoEm: "2026-10-22T00:30:36Z",
});

const ROTULOS: Par<string> = ["Imóvel A", "Imóvel B"];
function pronta(p: ProjecaoDaDecisao) {
  if (p.estado !== "pronta") throw new Error(`esperava projeção pronta: ${p.motivo}`);
  return p;
}
const todosOsTextos = (p: ReturnType<typeof pronta>) =>
  [p.manchete, p.apoio ?? "", ...p.diferencas.map((d) => d.texto), p.pergunta?.texto ?? "", p.pergunta?.motivo ?? ""];

// ——— G-COMPARE ————————————————————————————————————————————————————————————————————————

type Listing = { tenure: "aluguel" | "compra"; price: number | null; condo_monthly: number | null; iptu_value: number | null; iptu_period: string; area_m2: number; area: string };
type Rotulo = {
  known_monthly: Par<number | null>; pending: Par<number>; cost_diff: number | null; cost_definite: boolean; cost_winner: 0 | 1 | null;
  threshold: number | null; visit_first: 0 | 1 | null; question: { field: string; target: 0 | 1 } | null; horizon_months: number | null;
  visit_first_if_space_priority?: 0 | 1 | null; area_winner?: 0 | 1; question_if_space_priority?: { field: string; target: 0 | 1; type: string };
  time_tradeoff?: { minutes_per_day: number; days_per_month: number; hours_text: string; reais_per_hour_text: string };
};
const raiz = path.resolve(__dirname, "..");
const gc = JSON.parse(readFileSync(path.join(raiz, "docs/aplicacao/evaluation-sets/g-compare.json"), "utf8")) as { pairs: { pair_id: string; case: string; A: Listing; B: Listing }[] };
const rotulos = JSON.parse(readFileSync(path.join(raiz, "docs/aplicacao/evaluation-sets/g-compare-labels-v1.1.json"), "utf8")) as { cases: Record<string, Rotulo> };
const PERIODO: Record<string, Periodo> = { mensal: "mes", anual: "ano", desconhecido: "desconhecido" };

function daListagem(id: string, l: Listing): AnaliseV2 {
  return analise(id, {
    modalidade: l.tenure,
    bairro: l.area,
    declarados: {
      preco: v(l.price), condominio: v(l.condo_monthly), iptu: iptu(l.iptu_value, PERIODO[l.iptu_period] ?? "desconhecido"),
      seguroIncendio: vazio, area: v(l.area_m2),
    },
  });
}

describe("G-COMPARE v1 contra rótulos feitos à mão", () => {
  it("tem 20 pares rotulados", () => {
    expect(gc.pairs).toHaveLength(20);
    expect(Object.keys(rotulos.cases)).toHaveLength(20);
  });

  for (const par of gc.pairs) {
    const r = rotulos.cases[par.pair_id]!;
    it(`${par.pair_id} ${par.case}`, () => {
      const a = daListagem(`${par.pair_id.toLowerCase()}-a`, par.A);
      const b = daListagem(`${par.pair_id.toLowerCase()}-b`, par.B);
      const p = pronta(projetarDecisao(a, b, [null, null], ROTULOS, "custo"));
      expect(p.custo.mensalConhecido).toEqual(r.known_monthly);
      expect(p.custo.pendentes).toEqual(r.pending);
      if (r.cost_diff === null) expect(p.custo.diferenca).toBeNull();
      else expect(p.custo.diferenca).toBeCloseTo(r.cost_diff, 2);
      expect(p.custo.definida).toBe(r.cost_definite);
      if (r.threshold === null) expect(p.custo.limiarDeInversao).toBeNull();
      else expect(p.custo.limiarDeInversao).toBeCloseTo(r.threshold, 2);
      expect(p.visitarPrimeiro).toBe(r.visit_first);
      expect(p.pergunta ? { field: p.pergunta.campo, target: p.pergunta.alvo } : null).toEqual(r.question);
      expect(p.horizonteMeses).toBe(r.horizon_months);
      expect(p.diferencas.length).toBeLessThanOrEqual(3);
      if (r.area_winner !== undefined) expect(p.diferencas.find((d) => d.id === "area")?.favorece).toBe(r.area_winner);
      if (r.visit_first_if_space_priority !== undefined) {
        const e = pronta(projetarDecisao(a, b, [null, null], ROTULOS, "espaco"));
        expect(e.visitarPrimeiro).toBe(r.visit_first_if_space_priority);
        if (r.question_if_space_priority) {
          expect(e.pergunta && { field: e.pergunta.campo, target: e.pergunta.alvo, type: e.pergunta.tipo }).toEqual(r.question_if_space_priority);
        }
      }
      if (r.time_tradeoff && p.baseDoTempo) {
        const t = precoDaHoraPoupada(p.baseDoTempo.reais, r.time_tradeoff.minutes_per_day, r.time_tradeoff.days_per_month);
        expect(t?.horasTexto).toBe(r.time_tradeoff.hours_text);
        expect(t?.reaisPorHoraTexto).toBe(r.time_tradeoff.reais_per_hour_text);
      }
    });
  }
});

// ——— Invariantes ——————————————————————————————————————————————————————————————————————

describe("projeção da decisão: invariantes", () => {
  it("aluguel e compra não se comparam", () => {
    const p = projetarDecisao(analise("a"), analise("b", { modalidade: "compra", declarados: { preco: v(600000) } }), [null, null], ROTULOS);
    expect(p.estado).toBe("incompativel");
  });

  it("trocar A e B troca o lado e o sinal, sem mudar valores", () => {
    const a = analise("a", { declarados: { preco: v(2500), condominio: vazio } });
    const b = analise("b", { declarados: { preco: v(3200), area: v(95) } });
    const ab = pronta(projetarDecisao(a, b, [null, null], ROTULOS));
    const ba = pronta(projetarDecisao(b, a, [null, null], [ROTULOS[1], ROTULOS[0]]));
    expect(ba.custo.diferenca).toBeCloseTo(-(ab.custo.diferenca ?? 0), 6);
    expect(ba.custo.limiarDeInversao).toBe(ab.custo.limiarDeInversao);
    expect(ba.visitarPrimeiro).toBe(ab.visitarPrimeiro === null ? null : 1 - ab.visitarPrimeiro);
    expect(ba.pergunta?.alvo).toBe(ab.pergunta ? 1 - ab.pergunta.alvo : undefined);
    expect(ba.manchete).toBe(ab.manchete);
  });

  it("zero declarado é conhecido; ausente fica pendente e nunca vira zero", () => {
    const zero = analise("z", { declarados: { condominio: v(0) } });
    const ausente = analise("u", { declarados: { condominio: vazio } });
    const p = pronta(projetarDecisao(zero, ausente, [null, null], ROTULOS));
    expect(p.custo.pendentes).toEqual([0, 1]);
    expect(p.custo.faixas[1]?.maximo).toBeNull();
    expect(p.custo.definida).toBe(false);
    expect(p.visitarPrimeiro).toBeNull();
    expect(p.pergunta).toMatchObject({ campo: "condominio", alvo: 1 });
  });

  it("IPTU anual vira mensal; IPTU sem período entra como faixa de valor/12 a valor", () => {
    const anual = analise("an", { declarados: { iptu: iptu(1200, "ano") } });
    const semPeriodo = analise("sp", { declarados: { iptu: iptu(1200, "desconhecido") } });
    const p = pronta(projetarDecisao(anual, semPeriodo, [null, null], ROTULOS));
    expect(p.custo.mensalConhecido[0]).toBe(3000 + 600 + 100 + 40);
    expect(p.custo.faixas[1]).toEqual({ minimo: 3000 + 600 + 40 + 100, maximo: 3000 + 600 + 40 + 1200 });
  });

  it("diferença definida quando a faixa do lado que custa menos não alcança o outro", () => {
    const a = analise("a", { declarados: { preco: v(2000), iptu: iptu(240, "desconhecido") } });
    const b = analise("b", { declarados: { preco: v(3000) } });
    const p = pronta(projetarDecisao(a, b, [null, null], ROTULOS));
    expect(p.custo.definida).toBe(true);
    expect(p.custo.limiarDeInversao).toBeNull();
    // 3.740 − (2.000 + 600 + 240 + 40) = 860 garantidos; 1.080 só se o IPTU for anual.
    expect(p.diferencas[0]!.texto).toBe("Imóvel A custa pelo menos R$ 860/mês a menos que Imóvel B.");
  });

  it("diferença pequena não escolhe quem visitar primeiro", () => {
    const p = pronta(projetarDecisao(analise("a"), analise("b", { declarados: { preco: v(3030) } }), [null, null], ROTULOS));
    expect(p.visitarPrimeiro).toBeNull();
    expect(p.manchete).toBe("Com o que se sabe, os dois ficam próximos.");
  });

  it("compra: horizonte do plano (R$ 30.000 de preço contra R$ 500/mês = 60 meses), sem juros", () => {
    const a = analise("a", { modalidade: "compra", declarados: { preco: v(900000), condominio: v(600), iptu: iptu(150, "mes"), seguroIncendio: vazio } });
    const b = analise("b", { modalidade: "compra", declarados: { preco: v(870000), condominio: v(1100), iptu: iptu(150, "mes"), seguroIncendio: vazio } });
    const p = pronta(projetarDecisao(a, b, [null, null], ROTULOS));
    expect(p.horizonteMeses).toBe(60);
    expect(p.diferencas.find((d) => d.id === "despesas_mensais")?.texto).toContain("Em 60 meses (cerca de 5 anos) elas somam a diferença de preço, sem contar juros");
  });

  it("preço da hora poupada: 20 min × 16 dias = 5h20; R$ 180 / 5h20 = R$ 33,75", () => {
    const t = precoDaHoraPoupada(180, 20, 16);
    expect(t).not.toBeNull();
    expect(t!.horasPorMes).toBeCloseTo(16 / 3, 10);
    expect(t!.reaisPorHora).toBeCloseTo(33.75, 10);
    expect(t!.horasTexto).toBe("5h20");
    expect(t!.reaisPorHoraTexto).toBe("R$ 33,75");
    expect(precoDaHoraPoupada(180, 0, 16)).toBeNull();
    expect(precoDaHoraPoupada(0, 20, 16)).toBeNull();
    expect(precoDaHoraPoupada(180, 20, 40)).toBeNull();
  });

  it("obras licenciadas só entram com os dois prédios confirmados e diferença de pelo menos 3", () => {
    const a = analise("a", { vinculo: confirmado("1-10") });
    const b = analise("b", { vinculo: confirmado("1-20") });
    const com = pronta(projetarDecisao(a, b, [edificio("1-10", 1), edificio("1-20", 6)], ROTULOS));
    expect(com.diferencas.find((d) => d.id === "obras")).toMatchObject({ favorece: 0, fontes: ["licenciamento"] });
    const semConfirmar = pronta(projetarDecisao(a, analise("c"), [edificio("1-10", 1), null], ROTULOS));
    expect(semConfirmar.diferencas.find((d) => d.id === "obras")).toBeUndefined();
    const pequena = pronta(projetarDecisao(a, b, [edificio("1-10", 4), edificio("1-20", 6)], ROTULOS));
    expect(pequena.diferencas.find((d) => d.id === "obras")).toBeUndefined();
  });

  it("o custo mensal da projeção é o mesmo número que o dossiê mostra", () => {
    for (const par of gc.pairs) {
      const a = daListagem("pa", par.A);
      const b = daListagem("pb", par.B);
      const p = pronta(projetarDecisao(a, b, [null, null], ROTULOS));
      expect(p.custo.mensalConhecido[0]).toBe(derivarDossie(a, null, null, [], [], new Date(INSTANTE)).custo.totalMensalConhecido);
      expect(p.custo.mensalConhecido[1]).toBe(derivarDossie(b, null, null, [], [], new Date(INSTANTE)).custo.totalMensalConhecido);
      expect(p.custo.mensalConhecido[0]).toBe(custoMensal(a).totalMensalConhecido);
    }
  });

  it("não expõe destinos privados nem fala em tempo de deslocamento", () => {
    const caderno = {
      versao: 1 as const, documentos: [], entidades: [], ocorrencias: [], observacoes: [], cenarios: [], visitas: [], decisao: "considerando" as const, diario: [],
      destinos: [{ id: "trabalho-secreto", apelido: "Escritório da Rua Segredo", nota: "Nota privada", posicao: { longitude: -34.9, latitude: -8.05, precisaoM: 10, em: INSTANTE } }],
    };
    const a = analise("a", { caderno } as Mudancas);
    const b = analise("b", { declarados: { preco: v(3600) }, caderno } as Mudancas);
    const p = pronta(projetarDecisao(a, b, [null, null], ROTULOS));
    const json = JSON.stringify(p);
    expect(json).not.toMatch(/Segredo|Nota privada|trabalho-secreto/);
    for (const t of todosOsTextos(p)) expect(t).not.toMatch(/\bmin(utos)?\b|deslocamento|trajeto|rota/i);
  });

  it("política de texto: sem adjetivo pejorativo, de segurança, nota ou vencedor; comparativos com número são permitidos", () => {
    const proibidas = /perigos|arriscad|segur[oa]\b(?! incêndio)|ruim|[óo]tim|caix[aã]o|vale a pena|melhor|pior|\bnota\b|vencedor|barat|\bcar[oa]\b/i;
    const casos = gc.pairs.flatMap((par) => [
      pronta(projetarDecisao(daListagem("x", par.A), daListagem("y", par.B), [null, null], ROTULOS, "custo")),
      pronta(projetarDecisao(daListagem("x", par.A), daListagem("y", par.B), [null, null], ROTULOS, "espaco")),
    ]);
    for (const p of casos) for (const t of todosOsTextos(p)) expect(t).not.toMatch(proibidas);
  });
});
