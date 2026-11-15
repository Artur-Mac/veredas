// VE11: troca custo × tempo, opções não dominadas e onde mais procurar. Monotonicidade, dominância, preferências
// contraditórias, nenhuma opção serve, destino ausente, sem preço na procura e inversão no limiar.
import { describe, expect, it } from "@jest/globals";
import { diasParaCompensar, fraseDaDominancia, naoDominadas, ondeMaisProcurar, trocaCustoTempo, type RuaDaProcura } from "../src/dados/escolha";

const R: [string, string] = ["Casa Forte", "Graças"];

describe("troca custo × tempo", () => {
  it("o mais caro poupa tempo: preço da hora poupada e o limiar que inverte a escolha", () => {
    const t = trocaCustoTempo(R, [3000, 3050], [0, 0], [101, 67], 20);
    expect(t.tipo).toBe("troca");
    if (t.tipo !== "troca") return;
    expect(t.maisCaro).toBe(1);
    expect(t.frase).toBe("Graças custa R$ 50 a mais por mês e poupa 11h20 por mês no trajeto (20 dias): cerca de R$ 4,41 por hora poupada.");
    expect(t.limiar).toBe("Se uma hora sua vale mais que R$ 4,41, Graças compensa; se vale menos, Casa Forte. A escolha é sua; o VEREDA não dá valor ao seu tempo.");
  });
  it("monotonicidade: subir o custo de um lado nunca melhora a posição dele", () => {
    // A é mais caro e mais rápido (troca): subir o custo de A só aumenta o preço da hora; A nunca vira dominante.
    let anterior = 0;
    for (const extra of [0, 100, 1000, 10000]) {
      const t = trocaCustoTempo(R, [3100 + extra, 3050], [0, 0], [67, 101], 20);
      expect(t).toMatchObject({ tipo: "troca", maisCaro: 0 });
      if (t.tipo === "troca") { expect(t.reaisPorHora).toBeGreaterThan(anterior); anterior = t.reaisPorHora; }
    }
    // A domina (mais barato e mais rápido): subir o custo de A pode tirar a dominância, nunca dar a B uma posição pior.
    const posicao = (t: ReturnType<typeof trocaCustoTempo>) => (t.tipo === "dominante" ? (t.vencedor === 0 ? 2 : 0) : 1);
    let pos = 2;
    for (const extra of [0, 30, 60, 500, 5000]) {
      const p = posicao(trocaCustoTempo(R, [2900 + extra, 3050], [0, 0], [67, 101], 20));
      expect(p).toBeLessThanOrEqual(pos);
      pos = p;
    }
  });
  it("mais barato e mais rápido domina; diferenças pequenas ficam 'parecidos'; sem dado não decide", () => {
    expect(trocaCustoTempo(R, [2900, 3050], [0, 0], [60, 90], 20)).toMatchObject({ tipo: "dominante", vencedor: 0 });
    expect(trocaCustoTempo(R, [3000, 3010], [0, 0], [60, 62], 20).tipo).toBe("parecidos");
    expect(trocaCustoTempo(R, [null, 3010], [0, 0], [60, 62], 20).tipo).toBe("sem_dados");
    expect(trocaCustoTempo(R, [3000, 3010], [0, 0], [60, null], 20).tipo).toBe("sem_dados");
  });
  it("custo com valores a confirmar avisa que o limiar pode mudar", () => {
    expect(trocaCustoTempo(R, [3000, 3050], [1, 0], [101, 67], 20).frase).toContain("O custo ainda tem valores a confirmar");
  });
  it("dias para compensar: quem já tem um preço da hora vê com quantos dias por mês o mais caro compensa", () => {
    expect(diasParaCompensar(50, 34, 10)).toBe(9);
    expect(diasParaCompensar(0, 34, 10)).toBeNull();
  });
});

describe("não dominadas", () => {
  const custo = { nome: "custo", menorMelhor: true, tolerancia: 20 };
  it("quem é melhor ou igual em tudo domina", () => {
    const r = naoDominadas(["A", "B"], [{ ...custo, valores: [3000, 3200] }, { nome: "trabalho", valores: [30, 45], menorMelhor: true, tolerancia: 2 }]);
    expect(r.naoDominadas).toEqual([0]);
    expect(fraseDaDominancia(["A", "B"], r)).toBe("A é melhor ou igual em tudo que dá para comparar: não há troca a fazer.");
  });
  it("preferências contraditórias (dois destinos): nenhuma domina, e a frase diz quem ganha em quê", () => {
    const r = naoDominadas(["A", "B"], [{ ...custo, valores: [2800, 3000] }, { nome: "ida até o trabalho", valores: [30, 50], menorMelhor: true, tolerancia: 2 },
      { nome: "ida até a faculdade", valores: [55, 25], menorMelhor: true, tolerancia: 2 }]);
    expect(r.naoDominadas).toEqual([0, 1]);
    expect(fraseDaDominancia(["A", "B"], r)).toBe("Nenhuma opção ganha em tudo: A no custo e na ida até o trabalho; B na ida até a faculdade. A escolha depende do que pesa mais para vocês.");
  });
  it("critério sem dado de um lado não decide; tudo empatado vira empate", () => {
    const r = naoDominadas(["A", "B"], [{ ...custo, valores: [3000, null] }, { nome: "trabalho", valores: [30, 31], menorMelhor: true, tolerancia: 2 }]);
    expect(r.naoDominadas).toEqual([0, 1]);
    expect(fraseDaDominancia(["A", "B"], r)).toBe("Nos critérios com dado dos dois lados, as opções empatam.");
  });
});

describe("onde mais procurar", () => {
  const rua = (c: string, b: string, t: (number | null)[], m10 = 1): RuaDaProcura => ({ c, n: `Rua ${c}`, b, p: 3, m10, t });
  const ruas = [rua("1", "gracas", [20, 40]), rua("2", "espinheiro", [25, null]), rua("3", "madalena", [35, 30], 0.2), rua("4", "gracas", [18, 50])];
  it("filtra pelo tempo até o bairro de destino, tira as ruas já comparadas e ordena pelo tempo", () => {
    const r = ondeMaisProcurar(ruas, ["recife", "boa-vista"], "recife", 25, ["4"]);
    expect(r.ruas.map((x) => [x.c, x.minutos])).toEqual([["1", 20], ["2", 25]]);
  });
  it("sem ônibus útil (null) nunca entra; pedir mercado a pé exige metade dos prédios", () => {
    expect(ondeMaisProcurar(ruas, ["recife", "boa-vista"], "boa-vista", 60, [], { exigirMercado: true }).ruas.map((x) => x.c)).toEqual(["1", "4"]);
  });
  it("nenhuma rua serve e destino fora da lista são estados próprios, não listas inventadas", () => {
    expect(ondeMaisProcurar(ruas, ["recife", "boa-vista"], "recife", 10, []).estado).toBe("nenhuma");
    expect(ondeMaisProcurar(ruas, ["recife", "boa-vista"], "olinda", 60, []).estado).toBe("sem_destino");
  });
  it("a procura não tem preço: o resultado não carrega valor nem anúncio", () => {
    const r = ondeMaisProcurar(ruas, ["recife", "boa-vista"], "recife", 60, []);
    expect(JSON.stringify(r)).not.toMatch(/preco|aluguel|R\$/i);
  });
});
