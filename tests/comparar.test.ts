// Lógica do Comparar (Fatia 5). Análises e edifícios SINTÉTICOS, montados aqui e validados pelos esquemas.
import { describe, expect, it } from "@jest/globals";
import {
  celulaDaParcela,
  compararCusto,
  compararEntorno,
  compararEspaco,
  comparar,
  elegiveis,
  escolherPar,
  formatarArea,
  modalidadeInicial,
  resumoDoImovel,
  rotulosDasColunas,
  textoDePendentes,
  trocarNoSlot,
} from "../src/componentes/comparar/comparar";
import { esquemaAnaliseV2, esquemaEdificio, type AnaliseV2, type Edificio } from "../src/dados/contratos";
import { custoMensal } from "../src/dados/custos";
import { poligonoDoEdificio } from "../src/componentes/comparar/lote";

const INSTANTE = "2026-10-20T12:00:00.000Z";
const v = (valor: number | null, aConfirmar = false) => ({ valor, origem: "texto" as const, aConfirmar });
const vazio = v(null);
const iptu = (valor: number | null, periodo: "mes" | "ano" | "desconhecido", aConfirmar = false) => ({ ...v(valor, aConfirmar), periodo });

type Mudancas = Partial<Omit<AnaliseV2, "declarados">> & { declarados?: Partial<AnaliseV2["declarados"]> };

function analise(id: string, mudancas: Mudancas = {}): AnaliseV2 {
  const { declarados, ...resto } = mudancas;
  return esquemaAnaliseV2.parse({
    versao: 2, id, criadaEm: INSTANTE, atualizadaEm: INSTANTE, nome: `Imóvel sintético ${id}`, modalidade: "aluguel",
    tipologia: "apartamento", url: "", bairroTexto: "Casa Forte", bairro: "casa-forte", logradouro: null, numero: null,
    nomeEdificio: null, extracao: null,
    declarados: {
      preco: v(4500), condominio: v(1190), iptu: iptu(288, "mes"), seguroIncendio: v(42), taxaServico: vazio, outros: vazio,
      area: v(100), quartos: v(3), suites: vazio, banheiros: v(2), vagas: v(1), andar: v(5), ...declarados,
    },
    vinculo: { estado: "pendente" },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null, ...resto,
  });
}

const descartada = (id: string, mudancas: Mudancas = {}) =>
  analise(id, { descarte: { motivo: "outro", observacao: "", em: INSTANTE }, ...mudancas });

function edificio(mudancas: Partial<Edificio> = {}): Edificio {
  return esquemaEdificio.parse({
    id: "99001-100", bairro: "casa-forte", logradouro: "RUA SINTETICA ALFA", numero: "100", dsqfl: "61755015020005",
    nome: "Residencial Alfa", centro: [-34.9, -8.03], poligono: null, unidades: 24,
    tipologias: [{ area: 98, unidades: 24, iptuAnualMediano: 3936 }],
    anoConstrucao: 2010, pavimentos: 12, ate4Pavimentos: false, padrao: "Superior", iptuAnual: null, itbi: null,
    obras150m: { licencasDeObra: 68, relevantes24m: 4, demolicoes24m: 1, recentes: [] },
    ...mudancas,
  });
}

const confirmadoEm = (edificioId: string): AnaliseV2["vinculo"] => ({
  estado: "confirmado", edificioId, dsqfl: "61755015020005", confirmadoEm: INSTANTE, indiceGeradoEm: "2026-10-20T08:15:00Z",
});

// ——— Quem entra ————————————————————————————————————————————————————————————————————

describe("quem entra na comparação", () => {
  const lista = [
    analise("a1"), descartada("a2"), analise("c1", { modalidade: "compra" }), analise("a3"), analise("c2", { modalidade: "compra" }),
  ];

  it("só análises não descartadas da modalidade", () => {
    expect(elegiveis(lista, "aluguel").map((a) => a.id)).toEqual(["a1", "a3"]);
    expect(elegiveis(lista, "compra").map((a) => a.id)).toEqual(["c1", "c2"]);
  });

  it("escolherPar pega as duas mais recentes e nunca uma descartada", () => {
    expect(escolherPar(lista, "aluguel")).toEqual(["a1", "a3"]);
    expect(escolherPar(lista, "compra")).toEqual(["c1", "c2"]);
  });

  it("respeita as preferidas que ainda valem e ignora as que não valem", () => {
    expect(escolherPar(lista, "aluguel", ["a3"])).toEqual(["a3", "a1"]);
    expect(escolherPar(lista, "aluguel", ["a2", "c1", "nao-existe", "a3"])).toEqual(["a3", "a1"]);
    expect(escolherPar(lista, "aluguel", ["a1", "a1"])).toEqual(["a1", "a3"]);
  });

  it("com menos de duas análises devolve menos de dois ids", () => {
    expect(escolherPar([analise("x")], "aluguel")).toEqual(["x"]);
    expect(escolherPar([analise("x")], "compra")).toEqual([]);
    expect(escolherPar([], "aluguel")).toEqual([]);
  });

  it("modalidade inicial: a da preferida; senão a primeira com duas análises; senão a que tem mais", () => {
    expect(modalidadeInicial(lista, ["c2"])).toBe("compra");
    expect(modalidadeInicial(lista, ["a2"])).toBe("aluguel"); // descartada não vale como preferida
    expect(modalidadeInicial(lista)).toBe("aluguel");
    expect(modalidadeInicial([analise("c1", { modalidade: "compra" }), analise("c2", { modalidade: "compra" })])).toBe("compra");
    expect(modalidadeInicial([analise("c1", { modalidade: "compra" }), analise("a1")])).toBe("aluguel");
    expect(modalidadeInicial([analise("c1", { modalidade: "compra" })])).toBe("compra");
    expect(modalidadeInicial([])).toBe("aluguel");
  });

  it("trocar no lugar: substitui, ou troca os dois de lugar quando o escolhido já estava no outro", () => {
    expect(trocarNoSlot(["a1", "a3"], 0, "a4")).toEqual(["a4", "a3"]);
    expect(trocarNoSlot(["a1", "a3"], 1, "a1")).toEqual(["a3", "a1"]);
    expect(trocarNoSlot(["a1", "a3"], 0, "a1")).toEqual(["a1", "a3"]);
  });

  it("rótulos das colunas: bairros quando diferem; senão Imóvel 1 e 2", () => {
    expect(rotulosDasColunas(analise("a"), analise("b", { bairro: "gracas", bairroTexto: "Graças" }))).toEqual(["Casa Forte", "Graças"]);
    expect(rotulosDasColunas(analise("a"), analise("b"))).toEqual(["Imóvel 1", "Imóvel 2"]);
    expect(rotulosDasColunas(analise("a", { bairro: null, bairroTexto: "" }), analise("b"))).toEqual(["Imóvel 1", "Imóvel 2"]);
  });

  it("resumo do imóvel só com o que se sabe", () => {
    expect(resumoDoImovel(analise("a"))).toBe("100 m² · 3 quartos");
    expect(resumoDoImovel(analise("a", { declarados: { quartos: v(1), area: v(62.5) } }))).toBe("62,5 m² · 1 quarto");
    expect(resumoDoImovel(analise("a", { declarados: { quartos: vazio, area: v(80, true) } }))).toBe("");
  });
});

// ——— Custo —————————————————————————————————————————————————————————————————————————

describe("custo", () => {
  const casaForte = analise("a"); // 4.500 + 1.190 + 288 + 42 = 6.020
  const graças = analise("b", { bairro: "gracas", bairroTexto: "Graças", declarados: { preco: v(3800), condominio: v(900), iptu: iptu(2400, "ano"), seguroIncendio: v(30) } }); // 3.800 + 900 + 200 + 30 = 4.930

  it("a diferença sai do custo mensal conhecido de custoMensal, nunca de soma própria", () => {
    const c = compararCusto(casaForte, graças);
    expect(c.colunas[0].mensalConhecido).toBe(custoMensal(casaForte).totalMensalConhecido);
    expect(c.colunas[1].mensalConhecido).toBe(custoMensal(graças).totalMensalConhecido);
    expect(c.colunas[0].mensalConhecido).toBe(6020);
    expect(c.colunas[1].mensalConhecido).toBe(4930);
    expect(c.diferenca).toBe(1090);
    expect(c.destaque).toBe("R$ 1.090");
    expect(c.legenda).toBe("de diferença no custo mensal conhecido.");
    expect(c.frase).toBe("R$ 1.090 de diferença no custo mensal conhecido.");
    expect(c.nota).toBeNull();
  });

  it("barras na mesma escala: a maior ocupa 1 e a outra, a razão", () => {
    const c = compararCusto(casaForte, graças);
    expect(c.barras[0]).toBe(1);
    expect(c.barras[1]).toBeCloseTo(4930 / 6020, 10);
    const invertido = compararCusto(graças, casaForte);
    expect(invertido.barras[0]).toBeCloseTo(4930 / 6020, 10);
    expect(invertido.barras[1]).toBe(1);
  });

  it("IPTU sem periodicidade e valor a confirmar ficam fora do total e entram em '{n} parcelas a confirmar'", () => {
    const pendente = analise("p", { declarados: { iptu: iptu(288, "desconhecido", true), seguroIncendio: vazio } });
    const c = compararCusto(pendente, casaForte);
    expect(c.colunas[0].mensalConhecido).toBe(4500 + 1190);
    expect(c.colunas[0].pendentes).toBe(2);
    expect(c.colunas[0].textoDePendentes).toBe("2 parcelas a confirmar");
    expect(c.colunas[1].textoDePendentes).toBe("Nenhuma parcela a confirmar");
    expect(c.diferenca).toBe(6020 - 5690);
    expect(c.nota).toBe("A diferença usa só as parcelas conhecidas; as a confirmar ficam fora.");
    const iptuLinha = c.parcelas.find((p) => p.nome === "IPTU");
    expect(iptuLinha?.celulas[0]).toEqual({ texto: "A confirmar", detalhe: "O anúncio informa R$ 288, sem periodicidade" });
    expect(iptuLinha?.celulas[1]).toEqual({ texto: "R$ 288/mês", detalhe: null });
    const seguro = c.parcelas.find((p) => p.nome === "Seguro incêndio");
    expect(seguro?.celulas[0]).toEqual({ texto: "A confirmar", detalhe: "Não informado" });
  });

  it("uma parcela só vira '1 parcela' no singular", () => {
    expect(textoDePendentes(0)).toBe("Nenhuma parcela a confirmar");
    expect(textoDePendentes(1)).toBe("1 parcela a confirmar");
    expect(textoDePendentes(3)).toBe("3 parcelas a confirmar");
  });

  it("sem custo conhecido em uma das análises, não inventa diferença", () => {
    const sem = analise("s", { declarados: { preco: vazio, condominio: vazio, iptu: iptu(null, "desconhecido"), seguroIncendio: vazio } });
    const c = compararCusto(sem, casaForte);
    expect(sem.declarados.preco.valor).toBeNull();
    expect(c.colunas[0].mensalConhecido).toBeNull();
    expect(c.diferenca).toBeNull();
    expect(c.destaque).toBe("A confirmar");
    expect(c.barras).toEqual([null, 1]);
  });

  it("custos iguais: 'Mesmo custo mensal conhecido.'", () => {
    const c = compararCusto(casaForte, analise("z"));
    expect(c.diferenca).toBe(0);
    expect(c.frase).toBe("Mesmo custo mensal conhecido.");
  });

  it("zero digitado pela pessoa entra como zero; ausente não", () => {
    const zero = { valor: 0, origem: "voce" as const, aConfirmar: false };
    const c = compararCusto(analise("a", { declarados: { condominio: zero } }), analise("b", { declarados: { condominio: vazio } }));
    expect(c.colunas[0].mensalConhecido).toBe(4500 + 288 + 42);
    expect(c.colunas[1].mensalConhecido).toBe(4500 + 288 + 42);
    expect(c.parcelas.find((p) => p.nome === "Condomínio")?.celulas).toEqual([
      { texto: "R$ 0/mês", detalhe: null },
      { texto: "A confirmar", detalhe: "Não informado" },
    ]);
  });

  it("compra: nunca soma o preço; compara o preço anunciado e mostra as despesas mensais à parte", () => {
    const compraA = analise("ca", { modalidade: "compra", declarados: { preco: v(890000), iptu: iptu(3240, "ano"), seguroIncendio: vazio } });
    const compraB = analise("cb", { modalidade: "compra", declarados: { preco: v(760000), condominio: v(700), iptu: iptu(2400, "ano"), seguroIncendio: vazio } });
    const c = compararCusto(compraA, compraB);
    expect(c.referencia).toBe("preco_anunciado");
    expect(c.rotuloDoPrincipal).toBe("Preço anunciado");
    expect(c.rotuloDoMensal).toBe("Despesas mensais conhecidas");
    expect(c.colunas[0].valorDaBarra).toBe(890000);
    expect(c.colunas[0].mensalConhecido).toBe(1190 + 270);
    expect(c.colunas[1].mensalConhecido).toBe(700 + 200);
    expect(c.diferenca).toBe(130000);
    expect(c.frase).toBe("R$ 130.000 de diferença no preço anunciado.");
    expect(c.nota).toBeNull();
    expect(c.parcelas.map((p) => p.nome)).toEqual(["Condomínio", "IPTU"]);
    expect(c.barras[0]).toBe(1);
  });

  it("parcela que só uma das análises tem aparece com '—' na outra", () => {
    const comTaxa = analise("t", { declarados: { taxaServico: v(120) } });
    const linha = compararCusto(comTaxa, casaForte).parcelas.find((p) => p.nome === "Taxa de serviço");
    expect(linha?.celulas).toEqual([{ texto: "R$ 120/mês", detalhe: null }, { texto: "—", detalhe: null }]);
  });

  it("células de parcela: conhecida, a confirmar, desconhecida e ausente", () => {
    expect(celulaDaParcela({ nome: "IPTU", valorMensal: 24, estado: "conhecido", nota: null })).toEqual({ texto: "R$ 24/mês", detalhe: null });
    expect(celulaDaParcela({ nome: "IPTU", valorMensal: null, estado: "a_confirmar", nota: "Você informou R$ 300" })).toEqual({ texto: "A confirmar", detalhe: "Você informou R$ 300" });
    expect(celulaDaParcela({ nome: "IPTU", valorMensal: null, estado: "desconhecido", nota: null })).toEqual({ texto: "A confirmar", detalhe: "Não informado" });
    expect(celulaDaParcela(null)).toEqual({ texto: "—", detalhe: null });
  });

  it("nenhum texto de custo compara com adjetivo nem recomenda", () => {
    const proibidas = /perigos|vale a pena|caro|barat|caix[aã]o|[óo]tim|ruim|arriscad|melhor|pior|recomend|menor|maior/i;
    const casos = [compararCusto(casaForte, graças), compararCusto(analise("s", { declarados: { preco: vazio } }), casaForte), compararCusto(casaForte, analise("z"))];
    for (const c of casos) {
      const textos = [c.destaque, c.legenda, c.frase, c.nota ?? "", ...c.colunas.map((x) => x.textoDePendentes), ...c.parcelas.flatMap((p) => p.celulas.flatMap((x) => [x.texto, x.detalhe ?? ""]))];
      for (const t of textos) expect(t).not.toMatch(proibidas);
    }
  });
});

// ——— Espaço ————————————————————————————————————————————————————————————————————————

describe("espaço", () => {
  it("área, quartos, banheiros, vagas, andar e preço por m²", () => {
    const b = analise("b", { declarados: { area: v(82.5), quartos: v(2), banheiros: v(1), vagas: v(0), andar: v(0), preco: v(3300) } });
    const e = compararEspaco(analise("a"), b);
    const linha = (rotulo: string) => e.linhas.find((l) => l.rotulo === rotulo)?.medidas;
    expect(linha("Área anunciada")).toEqual([{ texto: "100 m²", detalhe: null }, { texto: "82,5 m²", detalhe: null }]);
    expect(linha("Quartos")?.map((m) => m.texto)).toEqual(["3", "2"]);
    expect(linha("Banheiros")?.map((m) => m.texto)).toEqual(["2", "1"]);
    expect(linha("Vagas de garagem")?.map((m) => m.texto)).toEqual(["1", "0"]);
    expect(linha("Andar anunciado")?.map((m) => m.texto)).toEqual(["5º andar", "Térreo"]);
    expect(linha("Aluguel anunciado por m²")?.map((m) => m.texto)).toEqual(["R$ 45/m²", "R$ 40/m²"]);
    expect(e.diferenca).toBe(17.5);
    expect(e.destaque).toBe("17,5 m²");
    expect(e.frase).toBe("17,5 m² de diferença na área anunciada.");
    expect(e.barras[0]).toBe(1);
    expect(e.barras[1]).toBeCloseTo(0.825, 10);
  });

  it("o preço por m² da compra usa o rótulo da compra", () => {
    const e = compararEspaco(analise("a", { modalidade: "compra", declarados: { preco: v(890000), area: v(125) } }), analise("b", { modalidade: "compra" }));
    expect(e.linhas.find((l) => l.rotulo === "Preço anunciado por m²")?.medidas[0].texto).toBe("R$ 7.120/m²");
  });

  it("valor desconhecido ou a confirmar nunca vira zero", () => {
    const b = analise("b", { declarados: { area: v(90, true), quartos: vazio, vagas: vazio, andar: v(3, true) } });
    const e = compararEspaco(analise("a"), b);
    const linha = (rotulo: string) => e.linhas.find((l) => l.rotulo === rotulo)?.medidas[1];
    expect(linha("Área anunciada")).toEqual({ texto: "A confirmar", detalhe: "O anúncio informa 90 m²" });
    expect(linha("Quartos")).toEqual({ texto: "A confirmar", detalhe: "Não informado" });
    expect(linha("Vagas de garagem")).toEqual({ texto: "A confirmar", detalhe: "Não informado" });
    expect(linha("Andar anunciado")).toEqual({ texto: "A confirmar", detalhe: "O anúncio informa 3º andar" });
    expect(e.areas).toEqual([100, null]);
    expect(e.diferenca).toBeNull();
    expect(e.barras).toEqual([1, null]);
    expect(e.destaque).toBe("A confirmar");
  });

  it("mesma área: frase própria", () => {
    expect(compararEspaco(analise("a"), analise("b")).frase).toBe("Mesma área anunciada.");
  });

  it("formata área sem zeros sobrando", () => {
    expect(formatarArea(125)).toBe("125");
    expect(formatarArea(62.5)).toBe("62,5");
    expect(formatarArea(62.25)).toBe("62,25");
    expect(formatarArea(1250)).toBe("1.250");
  });
});

// ——— Entorno ———————————————————————————————————————————————————————————————————————

describe("entorno", () => {
  it("com o prédio confirmado mostra obras em 24 meses, ano, pavimentos e unidades do edifício", () => {
    const e = edificio();
    const a = analise("a", { vinculo: confirmadoEm(e.id) });
    const nao = analise("b");
    const r = compararEntorno(a, nao, [e, null]);
    const linha = (rotulo: string) => r.linhas.find((l) => l.rotulo === rotulo)?.celulas;
    expect(r.colunas.map((c) => c.estado)).toEqual(["confirmado", "nao_confirmado"]);
    expect(linha("Prédio")).toEqual([
      { texto: "Prédio confirmado", detalhe: "Residencial Alfa" },
      { texto: "Prédio não confirmado", detalhe: null },
    ]);
    expect(linha("Obras licenciadas a 150 m")?.[0]).toEqual({ texto: "4", detalhe: "Últimos 24 meses" });
    expect(linha("Ano de construção")?.[0].texto).toBe("2010");
    expect(linha("Pavimentos")?.[0].texto).toBe("12");
    expect(linha("Unidades residenciais")?.[0].texto).toBe("24");
    // prédio não confirmado: sem número nenhum, nunca zero
    for (const rotulo of ["Obras licenciadas a 150 m", "Ano de construção", "Pavimentos", "Unidades residenciais"]) {
      expect(linha(rotulo)?.[1]).toEqual({ texto: "—", detalhe: null });
    }
  });

  it("zero obras licenciadas é um zero do cadastro (o prédio está confirmado)", () => {
    const e = edificio({ obras150m: { licencasDeObra: 10, relevantes24m: 0, demolicoes24m: 0, recentes: [] } });
    const r = compararEntorno(analise("a", { vinculo: confirmadoEm(e.id) }), analise("b"), [e, null]);
    expect(r.linhas.find((l) => l.rotulo === "Obras licenciadas a 150 m")?.celulas[0].texto).toBe("0");
  });

  it("sem nome no cadastro, o endereço em caixa de título; sem pavimentos, 'Até 4' só quando o cadastro diz", () => {
    const e = edificio({ nome: null, pavimentos: null, ate4Pavimentos: true, anoConstrucao: null });
    const f = edificio({ id: "99001-200", numero: "200", nome: null, pavimentos: null, ate4Pavimentos: null });
    const r = compararEntorno(analise("a", { vinculo: confirmadoEm(e.id) }), analise("b", { vinculo: confirmadoEm(f.id) }), [e, f]);
    const linha = (rotulo: string) => r.linhas.find((l) => l.rotulo === rotulo)?.celulas;
    expect(linha("Prédio")?.[0].detalhe).toBe("Rua Sintetica Alfa, 100");
    expect(linha("Pavimentos")?.map((c) => c.texto)).toEqual(["Até 4", "—"]);
    expect(linha("Ano de construção")?.[0].texto).toBe("—");
  });

  it("vínculo confirmado cujo edifício saiu do índice não inventa dados", () => {
    const a = analise("a", { vinculo: confirmadoEm("99001-100") });
    const r = compararEntorno(a, analise("b"), [null, null]);
    expect(r.colunas[0].estado).toBe("fora_do_indice");
    expect(r.linhas.find((l) => l.rotulo === "Prédio")?.celulas[0].texto).toBe("Prédio fora do índice atual");
    expect(r.linhas.find((l) => l.rotulo === "Obras licenciadas a 150 m")?.celulas[0].texto).toBe("—");
  });

  it("vínculo pulado, não encontrado ou fora de cobertura é 'Prédio não confirmado'", () => {
    const pulado = analise("a", { vinculo: { estado: "pulado", em: INSTANTE } });
    const fora = analise("b", { bairro: null, bairroTexto: "Torre", vinculo: { estado: "fora_de_cobertura" } });
    const r = compararEntorno(pulado, fora, [null, null]);
    expect(r.linhas.find((l) => l.rotulo === "Prédio")?.celulas.map((c) => c.texto)).toEqual(["Prédio não confirmado", "Prédio não confirmado"]);
  });
});

describe("lote do edifício", () => {
  it("sem polígono no índice, nada é desenhado", () => {
    expect(poligonoDoEdificio(edificio({ poligono: null }))).toBeNull();
  });

  it("norte para cima: latitude maior vira y menor", () => {
    const e = edificio({ poligono: [[-34.9, -8.03], [-34.8999, -8.03], [-34.8999, -8.0299], [-34.9, -8.0299]] });
    const plano = poligonoDoEdificio(e);
    expect(plano).toHaveLength(4);
    const [sul, , norte] = [plano?.[0], plano?.[1], plano?.[2]];
    expect(norte?.[1]).toBeLessThan(sul?.[1] ?? 0);
  });
});

describe("comparar (tudo junto)", () => {
  it("devolve rótulos, resumos e as três comparações", () => {
    const e = edificio();
    const a = analise("a", { vinculo: confirmadoEm(e.id) });
    const b = analise("b", { bairro: "gracas", bairroTexto: "Graças" });
    const r = comparar(a, b, [e, null]);
    expect(r.modalidade).toBe("aluguel");
    expect(r.rotulos).toEqual(["Casa Forte", "Graças"]);
    expect(r.resumos).toEqual(["100 m² · 3 quartos", "100 m² · 3 quartos"]);
    expect(r.custo.colunas).toHaveLength(2);
    expect(r.espaco.linhas.length).toBeGreaterThan(0);
    expect(r.entorno.linhas.length).toBeGreaterThan(0);
  });
});
