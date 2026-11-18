// Indicadores comparados com o bairro e placar do Comparar (15/11/2026).
import { describe, expect, it } from "@jest/globals";
import { destaquesDosIndicadores, indicadoresDoPredio, posicaoNoBairro } from "../src/dados/dossie/indicadores";
import { chuvaDoBairro } from "../src/dados/recife/chuva";
import { essenciaisDoBairro } from "../src/dados/recife/essenciais";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import { noiteDoBairro } from "../src/dados/recife/noite";
import { placarDoPar } from "../src/componentes/comparar/placarDoPar";
import type { Comparacao } from "../src/componentes/comparar/comparar";

const ind = (bairro: "boa-viagem" | "torre", id: string, nome: string) => {
  const predio = edificiosDoBairro(bairro).find((e) => e.id === id)!;
  return indicadoresDoPredio({ nomeDoBairro: nome, predio, edificiosDoBairro: edificiosDoBairro(bairro), essenciais: essenciaisDoBairro(bairro), noite: noiteDoBairro(bairro), chuva: chuvaDoBairro(bairro) });
};

describe("posição no bairro", () => {
  it("fração dos outros que ficam piores e melhores; empate não conta", () => {
    expect(posicaoNoBairro(2, [1, 2, 3, 4, 5], true)).toEqual({ piores: 0.75, melhores: 0.25, n: 5 });
    expect(posicaoNoBairro(2, [1, 2, 2, 3], false)).toEqual({ piores: 1 / 3, melhores: 1 / 3, n: 4 });
    expect(posicaoNoBairro(1, [1], true)).toEqual({ piores: 0, melhores: 0, n: 1 });
  });
});

describe("prédio real (Rua Pedro Bergamo, 323, Boa Viagem — anúncio do ZAP de 15/11/2026)", () => {
  const i = ind("boa-viagem", "50105-323", "Boa Viagem");
  it("avenida colada, perto do dia a dia; comparação dita com 'de Boa Viagem'", () => {
    const barulho = i.find((x) => x.id === "barulho")!;
    expect(barulho).toMatchObject({ classe: "pior", rotulo: "Avenida colada" });
    expect(barulho.comparacao).toMatch(/^Mais perto de avenida que \d de cada 10 prédios de Boa Viagem\.$/);
    expect(i.find((x) => x.id === "a_pe")).toMatchObject({ classe: "melhor", rotulo: "Perto do dia a dia" });
  });
  it("alagamento sem registro fica 'como o bairro', nunca 'melhor'", () => {
    const chuva = i.find((x) => x.id === "chuva")!;
    expect(chuva.classe).toBe("igual");
    expect(chuva.significado).toContain("Não ter registro não garante");
  });
  it("destaques: só o que está fora da média, mais forte primeiro, até 3", () => {
    const d = destaquesDosIndicadores(i);
    expect(d.length).toBeLessThanOrEqual(3);
    expect(d.every((x) => x.classe !== "igual")).toBe(true);
    expect(d.map((x) => x.forca)).toEqual([...d.map((x) => x.forca)].sort((a, b) => b - a));
  });
});

describe("placar do Comparar", () => {
  const comparacao = {
    rotulos: ["Torre", "Boa Viagem"],
    custo: { referencia: "preco_anunciado", colunas: [{ principal: 350000, mensalConhecido: 930, pendentes: 0 }, { principal: 540000, mensalConhecido: null, pendentes: 2 }] },
    espaco: { areas: [53, 74] },
  } as unknown as Comparacao;
  it("custo, espaço, dia a dia e rua: quem ganha e por quanto", () => {
    const p = placarDoPar(comparacao, [ind("torre", "29246-61", "Torre"), ind("boa-viagem", "50105-323", "Boa Viagem")]);
    expect(p.find((l) => l.id === "custo")).toMatchObject({ vencedor: 0, frase: "Torre custa R$ 190.000 a menos (há valores a confirmar).", topico: "custo" });
    expect(p.find((l) => l.id === "espaco")).toMatchObject({ vencedor: 1, frase: "Boa Viagem tem 21 m² a mais." });
    expect(p.find((l) => l.id === "a_pe")?.topico).toBe("rotina");
    expect(p.find((l) => l.id === "rua")?.topico).toBe("entorno");
  });
  it("sem dado de um dos dois: sem vencedor, dito em palavras", () => {
    const sem = { ...comparacao, espaco: { areas: [53, null] } } as unknown as Comparacao;
    expect(placarDoPar(sem, [null, null]).find((l) => l.id === "espaco")).toMatchObject({ vencedor: null, frase: "Falta a área de um dos dois." });
  });
});
