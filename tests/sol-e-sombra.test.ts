// "Sol e sombra" (15/11/2026): sol direto da tarde nas fachadas, sombra de vizinho mais alto e árvores do setor,
// comparado com o bairro. Sem nota: classificador e "k de cada 10".
import { describe, expect, it } from "@jest/globals";
import type { Edificio } from "../src/dados/contratos";
import { indicadoresDoPredio } from "../src/dados/dossie/indicadores";
import { arvoresDoSetor, ladosDoContorno, solDaTardeDoBairro, solDaTardeDoPredio } from "../src/dados/dossie/solDaTarde";
import { chuvaDoBairro } from "../src/dados/recife/chuva";
import { essenciaisDoBairro } from "../src/dados/recife/essenciais";
import { edificiosDoBairro, indiceDoBairro } from "../src/dados/recife/indice";
import { noiteDoBairro } from "../src/dados/recife/noite";
import { placarDoPar } from "../src/componentes/comparar/placarDoPar";
import type { Comparacao } from "../src/componentes/comparar/comparar";

const M_LAT = 1 / 111_320;
const M_LON = 1 / (111_320 * Math.cos((8.05 * Math.PI) / 180));
const base = edificiosDoBairro("gracas")[0]!;

/** Prédio sintético: retângulo de `leste` × `norte` metros centrado em (dx, dy) metros do ponto de referência. */
function predio(id: string, leste: number, norte: number, pavimentos: number | null, dx = 0, dy = 0): Edificio {
  const cx = -34.9 + dx * M_LON, cy = -8.05 + dy * M_LAT;
  const hx = (leste / 2) * M_LON, hy = (norte / 2) * M_LAT;
  return { ...base, id, pavimentos, centro: [cx, cy], poligono: [[cx - hx, cy - hy], [cx + hx, cy - hy], [cx + hx, cy + hy], [cx - hx, cy + hy], [cx - hx, cy - hy]] };
}

describe("lados do contorno", () => {
  it("um quadrado tem as quatro normais para fora: norte, leste, sul e oeste", () => {
    const lados = ladosDoContorno(predio("q", 20, 20, 4).poligono!);
    expect(lados.map((l) => Math.round(l.normal)).sort((a, b) => a - b)).toEqual([0, 90, 180, 270]);
  });
});

describe("sol da tarde de um prédio", () => {
  it("fachada comprida para o poente pega mais sol da tarde que fachada comprida para norte e sul", () => {
    const poente = solDaTardeDoPredio(predio("a", 10, 40, 4), [], null)!;
    const norteSul = solDaTardeDoPredio(predio("b", 40, 10, 4), [], null)!;
    expect(poente.valor).toBeGreaterThan(norteSul.valor);
    expect(poente.fracaoPoente).toBeCloseTo(0.4, 1);
    expect(norteSul.fracaoPoente).toBeCloseTo(0.1, 1);
  });
  it("um vizinho bem mais alto a oeste faz sombra à tarde e baixa o sol da fachada", () => {
    const meu = predio("a", 20, 20, 2);
    const sozinho = solDaTardeDoPredio(meu, [], null)!;
    const torre = predio("t", 20, 20, 30, -35, 0);
    const comTorre = solDaTardeDoPredio(meu, [torre], null)!;
    expect(sozinho.sombraDesde).toBeNull();
    expect(comTorre.sombraDesde).not.toBeNull();
    expect(comTorre.valor).toBeLessThan(sozinho.valor);
  });
  it("vizinho sem altura no cadastro não faz sombra; vizinho a leste não tapa o sol da tarde", () => {
    const meu = predio("a", 20, 20, 2);
    expect(solDaTardeDoPredio(meu, [predio("s", 20, 20, null, -35, 0)], null)!.sombraDesde).toBeNull();
    expect(solDaTardeDoPredio(meu, [predio("l", 20, 20, 30, 35, 0)], null)!.sombraDesde).toBeNull();
  });
  it("árvores do setor só diminuem o sol em prédio baixo (até 12 m)", () => {
    const baixo = predio("a", 20, 20, 2), alto = predio("b", 20, 20, 20);
    expect(solDaTardeDoPredio(baixo, [], 1)!.valor).toBeCloseTo(solDaTardeDoPredio(baixo, [], null)!.valor / 2, 5);
    expect(solDaTardeDoPredio(alto, [], 1)!.valor).toBeCloseTo(solDaTardeDoPredio(alto, [], null)!.valor, 5);
  });
  it("sem polígono não há fachada para medir", () => {
    expect(solDaTardeDoPredio({ ...base, poligono: null }, [], null)).toBeNull();
  });
});

describe("indicador no índice real", () => {
  const ind = (bairro: "boa-viagem" | "gracas", id: string, nome: string) => {
    const p = edificiosDoBairro(bairro).find((e) => e.id === id)!;
    return indicadoresDoPredio({ nomeDoBairro: nome, predio: p, edificiosDoBairro: edificiosDoBairro(bairro), essenciais: essenciaisDoBairro(bairro), noite: noiteDoBairro(bairro), chuva: chuvaDoBairro(bairro), ruaDoBairro: indiceDoBairro(bairro).rua ?? null });
  };
  it("Rua Pedro Bergamo, 323 (Boa Viagem): tem o tema, compara com o bairro e diz que é estimativa", () => {
    const sol = ind("boa-viagem", "50105-323", "Boa Viagem").find((x) => x.id === "sol")!;
    expect(sol).toBeDefined();
    expect(sol.tema).toBe("Sol e sombra");
    expect(["Menos sol da tarde", "Sol da tarde forte", "Sol da tarde na média"]).toContain(sol.rotulo);
    expect(sol.comparacao).toMatch(/(de cada 10 prédios de Boa Viagem|Parecido com a maioria dos prédios de Boa Viagem)\.$/);
    expect(sol.frase).toContain("Estimativa no equinócio");
    expect(sol.base).toBeGreaterThanOrEqual(20);
    // Sem nota: nenhum número de 0 a 10 solto, nenhum "seguro".
    expect(`${sol.rotulo} ${sol.frase} ${sol.significado}`).not.toMatch(/nota|\/10|seguro/i);
  });
  it("a comparação usa todos os prédios do bairro com polígono, uma vez por lista (cache)", () => {
    const eds = edificiosDoBairro("gracas");
    const a = solDaTardeDoBairro(eds, indiceDoBairro("gracas").rua);
    expect(solDaTardeDoBairro(eds, indiceDoBairro("gracas").rua)).toBe(a);
    expect(a.size).toBe(eds.filter((e) => e.poligono).length);
  });
  it("árvores vêm do setor do Censo do prédio", () => {
    const rua = indiceDoBairro("gracas").rua!;
    const e = edificiosDoBairro("gracas").find((x) => x.rua && x.rua[0] !== null)!;
    const s = rua.setores[e.rua![0]!]!;
    const f = arvoresDoSetor(e, rua);
    if (s.domicilios && s.arvores !== null) expect(f).toBeCloseTo(s.arvores / s.domicilios, 5);
    else expect(f).toBeNull();
  });
});

describe("Comparar: Rua e clima inclui Sol e sombra", () => {
  it("o prédio com sol da tarde forte perde a linha e o motivo aparece", () => {
    const sol = (classe: "pior" | "igual") => ({ id: "sol" as const, tema: "Sol e sombra", classe, rotulo: classe === "pior" ? "Sol da tarde forte" : "Sol da tarde na média", frase: "", comparacao: "", significado: "", forca: 0.8, base: 50 });
    const c = { rotulos: ["A", "B"], custo: { referencia: "preco_anunciado", colunas: [{ principal: 1, mensalConhecido: null, pendentes: 0 }, { principal: 1, mensalConhecido: null, pendentes: 0 }] }, espaco: { areas: [null, null] } } as unknown as Comparacao;
    const linha = placarDoPar(c, [[sol("pior")], [sol("igual")]]).find((l) => l.id === "rua")!;
    expect(linha.vencedor).toBe(1);
    expect(linha.frase).toContain("sol da tarde forte");
  });
});
