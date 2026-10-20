// Testes da derivação do dossiê (Fatia 4). Todo edifício, obra e análise daqui é SINTÉTICO, montado no
// próprio teste, e valida nos esquemas de contratos.ts. Nada vem do índice real.
import { describe, expect, it, jest } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import {
  camposVazios,
  esquemaAnaliseV2,
  esquemaEdificio,
  esquemaObra,
  type AnaliseV2,
  type Anomalia,
  type ContextoDoBairro,
  type Edificio,
  type Obra,
  type Prioridade,
  type VisaoDoDossie,
} from "../src/dados/contratos";
import { tituloDaAnomalia } from "../src/dados/anomalias";
import { custoMensal } from "../src/dados/custos";
import { derivarDossie, enderecoDoImovel, ordenarPerguntas, tipologiaUnica } from "../src/dados/dossie/derivar";

const AGORA = new Date("2026-10-20T12:00:00.000Z");
const INSTANTE = "2026-10-20T12:00:00.000Z";

// ——— Construtores sintéticos ————————————————————————————————————————————————————————

const v = (valor: number | null, aConfirmar = false) => ({ valor, origem: "texto" as const, aConfirmar });
const vazio = v(null);
const iptuDe = (valor: number | null, periodo: "mes" | "ano" | "desconhecido", aConfirmar = false) => ({ ...v(valor, aConfirmar), periodo });
const digitado = (valor: number) => ({ valor, origem: "voce" as const, aConfirmar: false });

type Mudancas = Partial<Omit<AnaliseV2, "declarados">> & { declarados?: Partial<AnaliseV2["declarados"]> };

/** Aluguel em Casa Forte, tudo conhecido, vínculo pendente, sem leitura de anúncio. */
const BASE: AnaliseV2 = {
  versao: 2, id: "analise-base", criadaEm: INSTANTE, atualizadaEm: INSTANTE,
  nome: "Apartamento sintético de 3 quartos", modalidade: "aluguel", tipologia: "apartamento",
  url: "https://anuncio.invalid/sintetico-1", bairroTexto: "Casa Forte", bairro: "casa-forte",
  logradouro: null, numero: null, nomeEdificio: null, extracao: null,
  declarados: {
    preco: v(4500), condominio: v(1190), iptu: iptuDe(288, "mes"), seguroIncendio: v(42), taxaServico: vazio, outros: vazio,
    area: v(98), quartos: v(3), suites: vazio, banheiros: vazio, vagas: vazio, andar: vazio,
  },
  vinculo: { estado: "pendente" },
  visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
  salva: true, descarte: null,
};

function analise(mudancas: Mudancas = {}): AnaliseV2 {
  const { declarados, ...resto } = mudancas;
  return esquemaAnaliseV2.parse({ ...BASE, ...resto, declarados: { ...BASE.declarados, ...declarados } });
}

const confirmadoEm = (edificioId: string): AnaliseV2["vinculo"] => ({
  estado: "confirmado", edificioId, dsqfl: "61755015020005", confirmadoEm: INSTANTE, indiceGeradoEm: "2026-10-20T08:15:00Z",
});

function anomalia(campo: Anomalia["campo"], tipo: Anomalia["tipo"], valorLido: string | null): Anomalia {
  return { campo, tipo, valorLido, mensagem: "Mensagem sintética." };
}

function extracaoCom(anomalias: Anomalia[], cobertura: "coberto" | "recife_fora" | "fora_do_recife" = "coberto", cidade: string | null = null): AnaliseV2["extracao"] {
  return {
    url: "https://anuncio.invalid/sintetico-1", portal: "outro", idNoPortal: null, coletadoEm: INSTANTE, metodos: ["texto"],
    campos: { ...camposVazios(), cidade }, origemDosCampos: {}, anomalias, lacunas: [], cobertura,
  };
}

/**
 * Edifício sintético: 24 unidades, duas tipologias (98 m² e 124,5 m²), prédio alto de 2010, sem obras. Com tipologias tão
 * diferentes, a compra não tem posição pelo ITBI; `edificioUnico` é o de uma tipologia só.
 */
function edificio(mudancas: Partial<Edificio> = {}): Edificio {
  return esquemaEdificio.parse({
    id: "99001-100", bairro: "casa-forte", logradouro: "RUA SINTETICA ALFA", numero: "100", dsqfl: "61755015020005",
    nome: "Residencial Alfa", centro: [-34.9, -8.03], poligono: null, unidades: 24,
    tipologias: [
      { area: 98, unidades: 12, iptuAnualMediano: 3936 },
      { area: 124.5, unidades: 12, iptuAnualMediano: 5280 },
    ],
    anoConstrucao: 2010, pavimentos: 12, ate4Pavimentos: false, padrao: "Superior",
    iptuAnual: { n: 24, p25: 3936, mediana: 4608, p75: 5280 },
    itbi: {
      transmissoes: 12, desde: 2018, ate: 2026,
      valorUnidade: { n: 12, p25: 760000, mediana: 800000, p75: 840000 }, porAno: [[2018, 3], [2026, 9]],
    },
    obras150m: { licencasDeObra: 68, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
    ...mudancas,
  });
}

/** Prédio de tipologia única: uma só área (98 m²), com avaliações fiscais por unidade nos 36 meses. */
function edificioUnico(mudancas: Partial<Edificio> = {}): Edificio {
  return edificio({ id: "99006-600", tipologias: [{ area: 98, unidades: 24, iptuAnualMediano: 3936 }], ...mudancas });
}

const comObras = (relevantes24m: number, demolicoes24m: number, recentes: [number, number][] = []) => ({
  licencasDeObra: 68, relevantes24m, demolicoes24m, recentes,
});

const OBRAS: Obra[] = [
  { categoria: "construcao", descricao: "ALVARA DE CONSTRUCAO INICIAL", data: "2026-03", situacao: "EM ANALISE", centro: [-34.9005, -8.0305] },
  { categoria: "demolicao", descricao: "ALVARA DE DEMOLICAO", data: "2025-11", situacao: null, centro: [-34.9011, -8.0299] },
  { categoria: "acrescimo", descricao: "REFORMA COM ACRÉSCIMO DE ÁREA", data: "2026-06", situacao: "DEFERIDO", centro: [-34.8995, -8.0302] },
].map((o) => esquemaObra.parse(o));

const CONTEXTO: ContextoDoBairro = {
  bairro: "casa-forte", edificios: 40, unidades: 900,
  iptuAnualPorM2: { n: 900, p25: 20, mediana: 30, p75: 45 },
};

type Entrada = { e?: Edificio | null; contexto?: ContextoDoBairro | null; obras?: Obra[]; outras?: AnaliseV2[]; prioridade?: Prioridade | null };

function derivar(a: AnaliseV2, o: Entrada = {}): VisaoDoDossie {
  return derivarDossie(a, o.e ?? null, o.contexto ?? null, o.obras ?? OBRAS, o.outras ?? [], AGORA, o.prioridade ?? null);
}

/** Análise confirmada no edifício sintético: caminho feliz do cadastro. */
function noPredio(mudancas: Mudancas = {}, e: Edificio = edificio()): { a: AnaliseV2; e: Edificio } {
  return { a: analise({ vinculo: confirmadoEm(e.id), ...mudancas }), e };
}

const ids = (v: VisaoDoDossie) => v.perguntas.map((p) => p.id);
const achadoIds = (v: VisaoDoDossie) => [v.achados.principal, ...v.achados.apoio].filter((x) => x !== null).map((x) => x.id);

function outraDeAluguel(id: string, preco: number | null, area: number | null, mudancas: Mudancas = {}): AnaliseV2 {
  return analise({ id, declarados: { preco: v(preco), area: v(area) }, ...mudancas });
}

// ——— Custo ———————————————————————————————————————————————————————————————————————

describe("custo", () => {
  it("usa custoMensal e copia o resultado sem o campo pendentes", () => {
    const a = analise({ declarados: { iptu: iptuDe(288, "desconhecido", true), seguroIncendio: vazio } });
    const visao = derivar(a);
    const { pendentes, ...esperado } = custoMensal(a);
    expect(pendentes).toBe(2);
    expect(visao.custo).toEqual(esperado);
    expect(visao.custo).not.toHaveProperty("pendentes");
    expect(visao.custo.totalMensalConhecido).toBe(4500 + 1190);
    expect(visao.custo.parcelas.find((p) => p.nome === "IPTU")).toMatchObject({
      estado: "a_confirmar", valorMensal: null, nota: "O anúncio informa R$ 288, sem periodicidade",
    });
    expect(visao.custo.notaForaDaSoma).toBe("IPTU e Seguro incêndio fora da soma.");
  });

  it("IPTU anual entra dividido por 12 e o preço de compra nunca entra no total", () => {
    const visao = derivar(analise({ modalidade: "compra", declarados: { preco: v(896000), iptu: iptuDe(3240, "ano"), area: v(100) } }));
    expect(visao.custo.principal).toEqual({ rotulo: "Preço anunciado", valor: 896000, porM2: 8960 });
    expect(visao.custo.totalMensalConhecido).toBe(1190 + 270 + 42);
    expect(visao.custo.alemDoPrincipal).toBeNull();
  });

  it("sem nenhuma parcela conhecida não existe total", () => {
    const visao = derivar(analise({ declarados: { preco: vazio, condominio: vazio, iptu: iptuDe(null, "desconhecido"), seguroIncendio: vazio } }));
    expect(visao.custo.totalMensalConhecido).toBeNull();
    expect(visao.custo.alemDoPrincipal).toBeNull();
    expect(visao.custo.parcelas.every((p) => p.valorMensal === null)).toBe(true);
  });

  it("especificações usam só o que é conhecido", () => {
    const visao = derivar(analise({ declarados: { area: v(98, true), quartos: v(3), banheiros: v(2), vagas: vazio, andar: v(7) } }));
    expect(visao.especificacoes).toEqual({ area: null, quartos: 3, banheiros: 2, vagas: null, andar: 7 });
  });
});

// ——— Posição ——————————————————————————————————————————————————————————————————————

describe("posição (barra bala)", () => {
  const compra = (precoTotal: number, extra: Mudancas = {}) =>
    analise({ modalidade: "compra", declarados: { preco: v(precoTotal), area: v(100) }, ...extra });

  const REFERENCIA = { n: 12, p25: 760000, mediana: 800000, p75: 840000 };
  const noUnico = (mudancas: Mudancas = {}, e: Edificio = edificioUnico()) => noPredio({ modalidade: "compra", ...mudancas }, e);

  it("compra em prédio de tipologia única: o preço anunciado contra as avaliações fiscais por unidade (R$, não R$/m²)", () => {
    const { a, e } = noUnico({ declarados: { preco: v(896000), area: v(100) } });
    expect(derivar(a, { e }).posicao).toEqual({
      rotulo: "Preço anunciado", valor: 896000, referencia: REFERENCIA, unidade: "R$", fonte: "itbi", deltaPercentual: 12,
      frase: "12% acima da mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses)",
    });
  });

  it("abaixo da mediana, com delta negativo", () => {
    const { a, e } = noUnico({ declarados: { preco: v(720000) } });
    expect(derivar(a, { e }).posicao).toMatchObject({
      deltaPercentual: -10, frase: "10% abaixo da mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses)",
    });
  });

  it("diferença menor que 1% é 'Na mediana'", () => {
    const { a, e } = noUnico({ declarados: { preco: v(804000) } });
    expect(derivar(a, { e }).posicao).toMatchObject({
      deltaPercentual: 0, frase: "Na mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses)",
    });
  });

  it("não depende da área do anúncio: a comparação é de valor por unidade", () => {
    const { a, e } = noUnico({ declarados: { preco: v(896000), area: vazio } });
    expect(derivar(a, { e }).posicao).toMatchObject({ valor: 896000, deltaPercentual: 12, unidade: "R$" });
  });

  it("prédio com tipologias de tamanhos diferentes: compra sem posição e sem achado de ITBI, mesmo com valorUnidade", () => {
    const { a, e } = noPredio({ modalidade: "compra", declarados: { preco: v(896000), area: v(100) } });
    expect(e.itbi?.valorUnidade).not.toBeNull();
    const visao = derivar(a, { e, contexto: CONTEXTO });
    expect(visao.posicao).toBeNull();
    expect(achadoIds(visao)).not.toContain("ach-itbi");
    // O histórico por ano continua: só o percentual não existe.
    expect(visao.historico.some((h) => h.quando === "2026" && h.texto === "9 transmissões")).toBe(true);
  });

  it("sem valorUnidade (menos de 3 transmissões em 36 meses) não há posição", () => {
    const e = edificioUnico({ itbi: { transmissoes: 2, desde: 2024, ate: 2025, valorUnidade: null, porAno: [[2024, 1], [2025, 1]] } });
    const { a } = noUnico({ declarados: { preco: v(990000) } }, e);
    expect(derivar(a, { e }).posicao).toBeNull();
    const semItbi = edificioUnico({ itbi: null });
    expect(derivar(noUnico({}, semItbi).a, { e: semItbi }).posicao).toBeNull();
  });

  it("compra sem prédio confirmado, ou com o contexto do bairro, não tem posição", () => {
    expect(derivar(compra(990000)).posicao).toBeNull();
    expect(derivar(compra(990000), { contexto: CONTEXTO }).posicao).toBeNull();
    const e = edificioUnico();
    expect(derivar(compra(990000), { e }).posicao).toBeNull();
  });

  it("preço a confirmar ou desconhecido não gera posição", () => {
    const e = edificioUnico();
    expect(derivar(noUnico({ declarados: { preco: v(896000, true) } }, e).a, { e }).posicao).toBeNull();
    expect(derivar(noUnico({ declarados: { preco: vazio } }, e).a, { e }).posicao).toBeNull();
  });

  describe("prédio de tipologia única (até 3% da mediana das áreas)", () => {
    const comAreas = (...areas: number[]) => edificio({ tipologias: areas.map((area) => ({ area, unidades: 4, iptuAnualMediano: 3936 })) });

    it("uma só tipologia, ou áreas dentro de 3% da mediana", () => {
      expect(tipologiaUnica(comAreas(98))).toBe(true);
      expect(tipologiaUnica(comAreas(98, 99, 100.5))).toBe(true);
      expect(tipologiaUnica(comAreas(100, 106))).toBe(true);
    });

    it("área a mais de 3% da mediana desfaz a tipologia única", () => {
      expect(tipologiaUnica(comAreas(100, 107))).toBe(false);
      expect(tipologiaUnica(comAreas(98, 124.5))).toBe(false);
      expect(tipologiaUnica(comAreas(98, 99, 100, 130))).toBe(false);
    });

    it("o limite decide a posição da compra", () => {
      const dentro = comAreas(100, 106);
      const fora = comAreas(100, 107);
      expect(derivar(noUnico({}, dentro).a, { e: dentro }).posicao).not.toBeNull();
      expect(derivar(noUnico({}, fora).a, { e: fora }).posicao).toBeNull();
    });
  });

  describe("aluguel", () => {
    const tres = [outraDeAluguel("o1", 3000, 60), outraDeAluguel("o2", 4200, 70), outraDeAluguel("o3", 5600, 80)];

    it("com 3 outras do mesmo bairro e modalidade usa os quartis delas", () => {
      const { posicao } = derivar(analise(), { outras: tres });
      expect(posicao).toMatchObject({
        rotulo: "Aluguel por m²", unidade: "R$/m²", fonte: "suas_analises", deltaPercentual: -23,
        referencia: { n: 3, p25: 55, mediana: 60, p75: 65 },
        frase: "23% abaixo da mediana das suas análises em Casa Forte",
      });
      expect(posicao?.valor).toBeCloseTo(45.92, 2);
    });

    it("com menos de 3 comparáveis não há posição", () => {
      expect(derivar(analise(), { outras: tres.slice(0, 2) }).posicao).toBeNull();
    });

    it("não contam outra modalidade, outro bairro, sem área, sem preço nem a própria análise", () => {
      const ruido = [
        outraDeAluguel("c1", 800000, 80, { modalidade: "compra" }),
        outraDeAluguel("b1", 3000, 60, { bairro: "madalena", bairroTexto: "Madalena" }),
        outraDeAluguel("s1", 3000, null),
        outraDeAluguel("p1", null, 60),
        outraDeAluguel("analise-base", 3000, 60),
      ];
      expect(derivar(analise(), { outras: [...tres.slice(0, 2), ...ruido] }).posicao).toBeNull();
      expect(derivar(analise(), { outras: [...tres, ...ruido] })?.posicao?.referencia.n).toBe(3);
    });

    it("aluguel não usa o ITBI nem o contexto do bairro, nem em prédio de tipologia única", () => {
      const e = edificioUnico();
      const { a } = noPredio({}, e);
      expect(derivar(a, { e, contexto: CONTEXTO }).posicao).toBeNull();
    });
  });
});

// ——— Achados ——————————————————————————————————————————————————————————————————————

describe("achados", () => {
  describe("anomalia de custo", () => {
    it("IPTU sem periodicidade é o achado principal e gera a pergunta do IPTU", () => {
      const a = analise({
        extracao: extracaoCom([anomalia("iptu", "periodo_desconhecido", "R$ 288")]),
        declarados: { iptu: iptuDe(288, "desconhecido", true) },
      });
      const visao = derivar(a);
      expect(visao.achados.principal).toMatchObject({
        tipo: "anomalia", titulo: "IPTU sem periodicidade", confianca: "declarado", fonte: "anuncio",
        medida: { numero: "R$ 288", unidade: "sem periodicidade" }, perguntaId: "anomalia-iptu",
      });
      expect(visao.perguntas.find((p) => p.id === "anomalia-iptu")).toMatchObject({
        titulo: "R$ 288 de IPTU por mês?", pista: "Anúncio sem periodicidade", origem: "anomalia", prioridade: "custo",
      });
      expect(ids(visao)).not.toContain("lacuna-iptu");
    });

    it("IPTU simbólico: o valor lido aparece na pergunta, com a pista de fachada", () => {
      const a = analise({
        extracao: extracaoCom([anomalia("iptu", "valor_simbolico", "R$ 5")]),
        declarados: { iptu: iptuDe(null, "desconhecido") },
      });
      const visao = derivar(a);
      expect(visao.achados.principal).toMatchObject({ titulo: "IPTU com valor simbólico", medida: { numero: "R$ 5", unidade: "no anúncio" } });
      expect(visao.perguntas.find((p) => p.id === "anomalia-iptu")).toMatchObject({
        titulo: "R$ 5 de IPTU por mês?", pista: "Valor do anúncio parece de fachada",
      });
      expect(visao.custo.parcelas.find((p) => p.nome === "IPTU")?.estado).toBe("desconhecido");
    });

    it("IPTU igual ao condomínio gera as duas perguntas, IPTU primeiro", () => {
      const a = analise({
        extracao: extracaoCom([anomalia("condominio", "valor_repetido", "R$ 1190"), anomalia("iptu", "valor_repetido", "R$ 1190")]),
        declarados: { iptu: iptuDe(1190, "mes"), condominio: v(1190) },
      });
      const visao = derivar(a);
      expect(visao.achados.principal?.titulo).toBe("IPTU igual ao condomínio");
      expect(visao.achados.apoio[0]?.titulo).toBe("Condomínio igual ao IPTU");
      expect(ids(visao).filter((id) => id.startsWith("anomalia-"))).toEqual(["anomalia-iptu", "anomalia-condominio"]);
      expect(visao.perguntas.find((p) => p.id === "anomalia-condominio")).toMatchObject({
        titulo: "Condomínio de R$ 1.190 está certo?", pista: "Valor do anúncio parece de fachada",
      });
    });

    it("condomínio abaixo do comum para a área", () => {
      const a = analise({
        extracao: extracaoCom([anomalia("condominio", "valor_atipico", "R$ 150")]),
        declarados: { condominio: v(150) },
      });
      const visao = derivar(a);
      expect(visao.achados.principal).toMatchObject({ titulo: "Condomínio abaixo do comum", perguntaId: "anomalia-condominio" });
      expect(visao.perguntas.find((p) => p.id === "anomalia-condominio")).toMatchObject({
        titulo: "Condomínio de R$ 150 está certo?", pista: "Abaixo do comum para 98 m²", prioridade: "custo",
      });
    });

    it("leituras incoerentes sem valor legível não vazam o valor lido na tela", () => {
      const a = analise({
        extracao: extracaoCom([anomalia("iptu", "incoerente", "[object Object]")]),
        declarados: { iptu: iptuDe(null, "desconhecido") },
      });
      const visao = derivar(a);
      expect(visao.achados.principal).toMatchObject({ titulo: "IPTU difere entre as leituras", medida: null });
      expect(visao.perguntas.find((p) => p.id === "anomalia-iptu")).toMatchObject({
        titulo: "O IPTU do anúncio está certo?", pista: "Valores diferentes no anúncio",
      });
      expect(JSON.stringify(visao)).not.toContain("[object");
    });

    it("quando o valor volta a ser conhecido pela pessoa, a anomalia some", () => {
      const periodoResolvido = analise({
        extracao: extracaoCom([anomalia("iptu", "periodo_desconhecido", "R$ 288")]),
        declarados: { iptu: iptuDe(288, "mes") },
      });
      expect(derivar(periodoResolvido).achados.principal).toBeNull();
      expect(ids(derivar(periodoResolvido))).not.toContain("anomalia-iptu");

      const valorDigitado = analise({
        extracao: extracaoCom([anomalia("iptu", "valor_simbolico", "R$ 5"), anomalia("condominio", "valor_atipico", "R$ 150")]),
        declarados: { iptu: { ...digitado(310), periodo: "mes" }, condominio: digitado(150) },
      });
      expect(derivar(valorDigitado).achados.principal).toBeNull();
    });

    it("anomalia de outro campo (preço, área) não vira achado de custo", () => {
      const a = analise({ extracao: extracaoCom([anomalia("preco", "valor_simbolico", "R$ 50"), anomalia("area", "incoerente", "80")]) });
      expect(derivar(a).achados.principal).toBeNull();
    });

    it("o título do achado é o de tituloDaAnomalia, para todo tipo e campo de custo", () => {
      const casos: [Anomalia["campo"], Anomalia["tipo"], Mudancas["declarados"]][] = [
        ["iptu", "periodo_desconhecido", { iptu: iptuDe(288, "desconhecido", true) }],
        ["iptu", "valor_simbolico", { iptu: iptuDe(null, "desconhecido") }],
        ["iptu", "valor_repetido", { iptu: iptuDe(1190, "mes"), condominio: v(1190) }],
        ["iptu", "incoerente", { iptu: iptuDe(null, "desconhecido") }],
        ["condominio", "valor_simbolico", { condominio: v(null) }],
        ["condominio", "valor_repetido", { iptu: iptuDe(1190, "mes"), condominio: v(1190) }],
        ["condominio", "valor_atipico", { condominio: v(150) }],
        ["condominio", "incoerente", { condominio: v(null) }],
      ];
      for (const [campo, tipo, declarados] of casos) {
        const visao = derivar(analise({ extracao: extracaoCom([anomalia(campo, tipo, "R$ 5")]), declarados }));
        const achado = [visao.achados.principal, ...visao.achados.apoio].find((x) => x?.id === `ach-anomalia-${campo}`);
        expect({ campo, tipo, titulo: achado?.titulo }).toEqual({ campo, tipo, titulo: tituloDaAnomalia({ campo, tipo }) });
      }
      expect(tituloDaAnomalia({ campo: "condominio", tipo: "valor_simbolico" })).toBe("Condomínio com valor simbólico");
    });

    it("a pergunta da anomalia não usa o título do achado: continua no formato de pergunta", () => {
      const a = analise({
        extracao: extracaoCom([anomalia("condominio", "valor_simbolico", "R$ 1")]),
        declarados: { condominio: v(null) },
      });
      const visao = derivar(a);
      expect(visao.achados.principal?.titulo).toBe("Condomínio com valor simbólico");
      expect(visao.perguntas.find((p) => p.id === "anomalia-condominio")).toMatchObject({
        titulo: "Condomínio de R$ 1 está certo?", pista: "Valor do anúncio parece de fachada",
      });
    });
  });

  describe("IPTU no cadastro", () => {
    it("sem IPTU declarado conhecido mostra a mediana mensal da tipologia da mesma área", () => {
      const { a, e } = noPredio({ declarados: { iptu: iptuDe(null, "desconhecido") } });
      expect(derivar(a, { e }).achados.principal).toEqual({
        id: "ach-iptu", tipo: "iptu", titulo: "IPTU no cadastro", medida: { numero: "R$ 328", unidade: "/mês" },
        texto: "Mediana de 12 unidades de 98 m² neste prédio · IPTU 2026", confianca: "oficial", fonte: "iptu_2026", perguntaId: null,
      });
    });

    it("IPTU do anúncio a confirmar também recebe a referência do cadastro", () => {
      const { a, e } = noPredio({ declarados: { iptu: iptuDe(288, "desconhecido", true) } });
      expect(derivar(a, { e }).achados.principal?.titulo).toBe("IPTU no cadastro");
    });

    it("a tolerância de área é o maior entre 1,5 m² e 3%", () => {
      const comArea = (area: number) => {
        const { a, e } = noPredio({ declarados: { iptu: iptuDe(null, "desconhecido"), area: v(area) } });
        return achadoIds(derivar(a, { e }));
      };
      expect(comArea(99.4)).toEqual(["ach-iptu"]);
      expect(comArea(100.9)).toEqual(["ach-iptu"]);
      expect(comArea(101.5)).toEqual([]);
      expect(comArea(120)).toEqual([]);
    });

    it("sem mediana de IPTU na tipologia ou sem área declarada não há achado de IPTU", () => {
      const semMediana = edificio({ tipologias: [{ area: 98, unidades: 12, iptuAnualMediano: null }] });
      const a = noPredio({ declarados: { iptu: iptuDe(null, "desconhecido") } }, semMediana);
      expect(derivar(a.a, { e: a.e }).achados.principal).toBeNull();
      const b = noPredio({ declarados: { iptu: iptuDe(null, "desconhecido"), area: vazio } });
      expect(derivar(b.a, { e: b.e }).achados.principal).toBeNull();
    });

    it("mediana zero na tipologia não gera achado de IPTU, nem 'IPTU no cadastro' nem 'IPTU não confere'", () => {
      const isenta = edificio({ tipologias: [{ area: 98, unidades: 12, iptuAnualMediano: 0 }] });
      for (const iptu of [iptuDe(null, "desconhecido"), iptuDe(288, "mes"), iptuDe(3456, "ano"), iptuDe(288, "desconhecido", true)]) {
        const { a, e } = noPredio({ declarados: { iptu } }, isenta);
        const visao = derivar(a, { e });
        expect(achadoIds(visao)).not.toContain("ach-iptu");
        expect(visao.achados.principal).toBeNull();
        expect(textosDe(visao.achados).join(" ")).not.toMatch(/IPTU no cadastro|IPTU não confere|R\$ 0(?![\d.,])/);
      }
    });

    it("mediana nula também não gera achado, com ou sem IPTU declarado", () => {
      const semDado = edificio({ tipologias: [{ area: 98, unidades: 12, iptuAnualMediano: null }] });
      for (const iptu of [iptuDe(null, "desconhecido"), iptuDe(288, "mes")]) {
        const { a, e } = noPredio({ declarados: { iptu } }, semDado);
        expect(achadoIds(derivar(a, { e }))).not.toContain("ach-iptu");
      }
    });

    it("a isenção de uma tipologia não apaga o achado de outra com IPTU", () => {
      const duas = edificio({ tipologias: [{ area: 98, unidades: 6, iptuAnualMediano: 0 }, { area: 124.5, unidades: 12, iptuAnualMediano: 5280 }] });
      const { a, e } = noPredio({ declarados: { area: v(124.5), iptu: iptuDe(null, "desconhecido") } }, duas);
      expect(derivar(a, { e }).achados.principal).toMatchObject({ titulo: "IPTU no cadastro", medida: { numero: "R$ 440", unidade: "/mês" } });
    });

    it("IPTU declarado dentro de 20% do cadastro não gera achado", () => {
      const { a, e } = noPredio({ declarados: { iptu: iptuDe(288, "mes") } });
      expect(derivar(a, { e }).achados.principal).toBeNull();
    });

    it("IPTU declarado mais de 20% longe do cadastro: IPTU não confere", () => {
      const { a, e } = noPredio({ declarados: { iptu: iptuDe(200, "mes") } });
      expect(derivar(a, { e }).achados.principal).toMatchObject({
        titulo: "IPTU não confere", tipo: "iptu", confianca: "oficial", fonte: "iptu_2026",
        medida: { numero: "R$ 200 × R$ 328", unidade: "/mês" },
      });
    });

    it("IPTU anual declarado é comparado em valor mensal", () => {
      const { a, e } = noPredio({ declarados: { iptu: iptuDe(2400, "ano") } });
      expect(derivar(a, { e }).achados.principal).toMatchObject({ titulo: "IPTU não confere", medida: { numero: "R$ 200 × R$ 328" } });
      const { a: b } = noPredio({ declarados: { iptu: iptuDe(3300, "ano") } });
      expect(derivar(b, { e }).achados.principal).toBeNull();
    });

    it("sem prédio confirmado não há achado de cadastro, mesmo com o edifício à mão", () => {
      const { e } = noPredio();
      const a = analise({ declarados: { iptu: iptuDe(null, "desconhecido") } });
      expect(derivar(a, { e }).achados.principal).toBeNull();
    });
  });

  describe("área", () => {
    it("área declarada longe da tipologia mais próxima: Área não confere", () => {
      const { a, e } = noPredio({ declarados: { area: v(140) } });
      expect(derivar(a, { e }).achados.principal).toEqual({
        id: "ach-area", tipo: "area", titulo: "Área não confere", medida: { numero: "140 × 124,5", unidade: "m²" },
        texto: "O anúncio informa 140 m²; a tipologia mais próxima no cadastro tem 124,5 m². Confira a área privativa na matrícula.",
        confianca: "inferencia", fonte: "iptu_2026", perguntaId: "achado-area",
      });
    });

    it("exige mais de 10% e mais de 5 m² ao mesmo tempo", () => {
      const pequeno = edificio({ tipologias: [{ area: 30, unidades: 8, iptuAnualMediano: 1200 }] });
      const a = noPredio({ declarados: { area: v(34.5) } }, pequeno);
      expect(achadoIds(derivar(a.a, { e: a.e }))).toEqual([]); // 15%, mas só 4,5 m²
      const b = noPredio({ declarados: { area: v(133) } });
      expect(achadoIds(derivar(b.a, { e: b.e }))).toEqual([]); // 8,5 m², mas só 6,8%
    });
  });

  describe("estrutura", () => {
    const sinais = { ate4Pavimentos: true, pavimentos: null, anoConstrucao: 1990, padrao: "Médio" } as const;
    const derivarCom = (mudancas: Partial<Edificio>) => {
      const { a, e } = noPredio({}, edificio(mudancas));
      return derivar(a, { e });
    };

    it("até 4 pavimentos, antes de 2005 e padrão Simples ou Médio: 3 sinais no cadastro", () => {
      expect(derivarCom(sinais).achados.principal).toEqual({
        id: "ach-estrutura", tipo: "estrutura", titulo: "3 sinais no cadastro", medida: null,
        texto: "Até 4 pavimentos, construído antes de 2005, padrão Médio. Confirme o sistema estrutural e peça o laudo.",
        confianca: "inferencia", fonte: "iptu_2026", perguntaId: "achado-estrutura",
      });
      expect(derivarCom({ ...sinais, padrao: "SIMPLES" }).achados.principal?.id).toBe("ach-estrutura");
      expect(derivarCom({ ...sinais, padrao: "Medio" }).achados.principal?.id).toBe("ach-estrutura");
    });

    it("pavimentos ≤ 4 do cadastro de lotes vale no lugar do tipo de construção", () => {
      expect(derivarCom({ ...sinais, ate4Pavimentos: null, pavimentos: 4 }).achados.principal?.id).toBe("ach-estrutura");
      expect(derivarCom({ ...sinais, ate4Pavimentos: false, pavimentos: 3 }).achados.principal?.id).toBe("ach-estrutura");
    });

    it("falta de qualquer um dos três sinais desliga o achado", () => {
      expect(derivarCom({ ...sinais, ate4Pavimentos: false, pavimentos: 5 }).achados.principal).toBeNull();
      expect(derivarCom({ ...sinais, ate4Pavimentos: null, pavimentos: null }).achados.principal).toBeNull();
      expect(derivarCom({ ...sinais, anoConstrucao: 2005 }).achados.principal).toBeNull();
      expect(derivarCom({ ...sinais, anoConstrucao: null }).achados.principal).toBeNull();
      expect(derivarCom({ ...sinais, padrao: "Superior" }).achados.principal).toBeNull();
      expect(derivarCom({ ...sinais, padrao: null }).achados.principal).toBeNull();
    });
  });

  describe("obras", () => {
    const derivarObras = (relevantes: number, demolicoes: number) => {
      const { a, e } = noPredio({}, edificio({ obras150m: comObras(relevantes, demolicoes, [[0, 85]]) }));
      return derivar(a, { e });
    };

    it("usa relevantes24m e conta as demolições", () => {
      expect(derivarObras(3, 1).achados.principal).toEqual({
        id: "ach-obras", tipo: "obras", titulo: "Obras na vizinhança",
        medida: { numero: "3", unidade: "obras licenciadas perto" },
        texto: "Construção, acréscimo ou demolição a até 150 m nos últimos 24 meses · 1 demolição",
        confianca: "oficial", fonte: "licenciamento", perguntaId: "achado-obras",
      });
      expect(derivarObras(5, 2).achados.principal?.texto).toMatch(/· 2 demolições$/);
    });

    it("sem demolições a segunda parte do texto some", () => {
      expect(derivarObras(1, 0).achados.principal).toMatchObject({
        medida: { numero: "1", unidade: "obra licenciada perto" },
        texto: "Construção, acréscimo ou demolição a até 150 m nos últimos 24 meses",
      });
    });

    it("nunca usa licencasDeObra: 68 licenças e nenhuma relevante não é achado", () => {
      const visao = derivarObras(0, 0);
      expect(visao.achados.principal).toBeNull();
      expect(visao.obras?.licencasDeObra).toBe(68);
      expect(JSON.stringify(visao.achados)).not.toContain("68");
    });
  });

  describe("ITBI", () => {
    it("na compra, mostra a posição fiscal como achado oficial: só no prédio de tipologia única", () => {
      const e = edificioUnico();
      const { a } = noPredio({ modalidade: "compra", declarados: { preco: v(896000), area: v(100) } }, e);
      const achado = derivar(a, { e }).achados.principal;
      expect(achado).toMatchObject({
        id: "ach-itbi", tipo: "itbi", titulo: "Preço × avaliação fiscal", confianca: "oficial", fonte: "itbi", perguntaId: null,
        medida: { numero: "12%", unidade: "acima da mediana fiscal" },
      });
      expect(achado?.texto).toBe(
        "Preço anunciado de R$ 896.000: 12% acima da mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses). Avaliação fiscal não é preço de mercado.",
      );
    });

    it("na mediana, o achado não traz percentual", () => {
      const e = edificioUnico();
      const { a } = noPredio({ modalidade: "compra", declarados: { preco: v(800000) } }, e);
      const achado = derivar(a, { e }).achados.principal;
      expect(achado).toMatchObject({ id: "ach-itbi", medida: null });
      expect(achado?.texto).toContain("na mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses)");
    });

    it("sem a posição (tipologias diferentes, sem valorUnidade, sem prédio) não há achado de ITBI", () => {
      const diferentes = noPredio({ modalidade: "compra", declarados: { preco: v(896000), area: v(100) } });
      expect(achadoIds(derivar(diferentes.a, { e: diferentes.e }))).not.toContain("ach-itbi");
      const semValor = edificioUnico({ itbi: { transmissoes: 2, desde: 2024, ate: 2025, valorUnidade: null, porAno: [[2024, 1], [2025, 1]] } });
      expect(achadoIds(derivar(noPredio({ modalidade: "compra" }, semValor).a, { e: semValor }))).not.toContain("ach-itbi");
      expect(achadoIds(derivar(analise({ modalidade: "compra" })))).toEqual([]);
    });

    it("no aluguel nunca aparece, nem em prédio de tipologia única", () => {
      const e = edificioUnico();
      const { a } = noPredio({}, e);
      expect(achadoIds(derivar(a, { e, contexto: CONTEXTO }))).not.toContain("ach-itbi");
    });
  });

  describe("ordem de prioridade", () => {
    it("anomalia, IPTU/área, estrutura, obras, ITBI: o primeiro presente é o principal e entram até 3 de apoio", () => {
      const e = edificioUnico({
        ate4Pavimentos: true, pavimentos: null, anoConstrucao: 1990, padrao: "Médio", obras150m: comObras(3, 0, [[0, 85]]),
      });
      const { a } = noPredio({
        modalidade: "compra",
        extracao: extracaoCom([anomalia("iptu", "periodo_desconhecido", "R$ 288")]),
        declarados: { preco: v(896000), area: v(100), iptu: iptuDe(288, "desconhecido", true) },
      }, e);
      const visao = derivar(a, { e });
      expect(visao.achados.principal?.id).toBe("ach-anomalia-iptu");
      expect(visao.achados.apoio.map((x) => x.id)).toEqual(["ach-iptu", "ach-estrutura", "ach-obras"]);
      expect(achadoIds(visao)).not.toContain("ach-itbi");
    });

    it("sem anomalia, o IPTU do cadastro vem antes de estrutura e obras", () => {
      const e = edificio({
        ate4Pavimentos: true, pavimentos: null, anoConstrucao: 1990, padrao: "Médio", obras150m: comObras(2, 0, []),
      });
      const { a } = noPredio({ declarados: { iptu: iptuDe(null, "desconhecido") } }, e);
      expect(achadoIds(derivar(a, { e }))).toEqual(["ach-iptu", "ach-estrutura", "ach-obras"]);
    });

    it("sem nenhum sinal, não há principal nem apoio", () => {
      const visao = derivar(analise());
      expect(visao.achados).toEqual({ principal: null, apoio: [] });
    });
  });
});

// ——— Perguntas ————————————————————————————————————————————————————————————————————

describe("perguntas", () => {
  it("lacuna-endereco: bairro coberto e vínculo que não é confirmado", () => {
    for (const vinculo of [
      { estado: "pendente" }, { estado: "pulado", em: INSTANTE }, { estado: "nao_encontrado", em: INSTANTE },
    ] as const) {
      const visao = derivar(analise({ vinculo }));
      expect(visao.perguntas[0]).toEqual({
        id: "lacuna-endereco", titulo: "Qual é o endereço completo?", pista: "Para conferir o cadastro do prédio",
        textoParaMensagem: "Qual é o endereço completo do imóvel, com rua e número?", origem: "lacuna", prioridade: "documentos",
      });
    }
  });

  it("lacuna-endereco só quando falta rua ou número", () => {
    const comEndereco = (logradouro: string | null, numero: string | null, vinculo: AnaliseV2["vinculo"] = { estado: "pendente" }) =>
      ids(derivar(analise({ logradouro, numero, vinculo }))).includes("lacuna-endereco");
    expect(comEndereco("Rua do Sol", "55")).toBe(false);
    expect(comEndereco("Rua do Sol", "55", { estado: "pulado", em: INSTANTE })).toBe(false);
    expect(comEndereco("Rua do Sol", "55", { estado: "nao_encontrado", em: INSTANTE })).toBe(false);
    expect(comEndereco("Rua do Sol", null)).toBe(true);
    expect(comEndereco(null, "55")).toBe(true);
    expect(comEndereco(null, null)).toBe(true);
    expect(comEndereco("   ", "55")).toBe(true);
    expect(comEndereco("Rua do Sol", "  ")).toBe(true);
    expect(comEndereco("", "")).toBe(true);
  });

  it("endereço completo no bairro não coberto ou sem bairro continua sem a pergunta", () => {
    expect(ids(derivar(analise({ bairro: "boa-vista", bairroTexto: "Boa Vista", logradouro: null, numero: null, vinculo: { estado: "fora_de_cobertura" } }))))
      .not.toContain("lacuna-endereco");
    expect(ids(derivar(analise({ bairro: null, bairroTexto: "", logradouro: null, numero: null })))).not.toContain("lacuna-endereco");
  });

  it("sem lacuna-endereco quando o prédio está confirmado, o bairro não é coberto ou não há bairro", () => {
    const { a, e } = noPredio();
    expect(ids(derivar(a, { e }))).not.toContain("lacuna-endereco");
    expect(ids(derivar(analise({ bairro: "boa-vista", bairroTexto: "Boa Vista", vinculo: { estado: "fora_de_cobertura" } })))).not.toContain("lacuna-endereco");
    expect(ids(derivar(analise({ bairro: null, bairroTexto: "" })))).not.toContain("lacuna-endereco");
  });

  it("lacunas de custo: preço, condomínio e IPTU, com os títulos da ordem", () => {
    const visao = derivar(analise({
      tipologia: "apartamento",
      declarados: { preco: vazio, condominio: vazio, iptu: iptuDe(null, "desconhecido") },
    }));
    expect(visao.perguntas.filter((p) => p.origem === "lacuna" && p.prioridade === "custo").map((p) => [p.id, p.titulo, p.pista])).toEqual([
      ["lacuna-preco", "Qual é o valor do aluguel?", "Não informado no anúncio"],
      ["lacuna-condominio", "Qual é o condomínio e há cota extra?", "Não informado no anúncio"],
      ["lacuna-iptu", "Qual é o IPTU deste apartamento?", "Não informado no anúncio"],
    ]);
  });

  it("lacuna-preco na compra, valor a confirmar e tipologia no título do IPTU", () => {
    const visao = derivar(analise({
      modalidade: "compra", tipologia: "casa",
      declarados: { preco: v(500000, true), condominio: v(100, true), iptu: iptuDe(null, "mes") },
    }));
    expect(visao.perguntas.find((p) => p.id === "lacuna-preco")).toMatchObject({ titulo: "Qual é o preço de venda?", pista: "Valor a confirmar" });
    expect(visao.perguntas.find((p) => p.id === "lacuna-condominio")?.pista).toBe("Valor a confirmar");
    expect(visao.perguntas.find((p) => p.id === "lacuna-iptu")?.titulo).toBe("Qual é o IPTU desta casa?");
  });

  it("valores conhecidos não geram lacuna de custo", () => {
    expect(ids(derivar(analise())).filter((id) => id.startsWith("lacuna-"))).toEqual(["lacuna-endereco"]);
  });

  describe("seguro incêndio, taxa de serviço e outros", () => {
    const lacunasDeCusto = (a: AnaliseV2) => derivar(a).perguntas.filter((p) => p.origem === "lacuna" && p.prioridade === "custo").map((p) => p.id);

    it("aluguel com seguro incêndio desconhecido gera lacuna-seguro, depois do IPTU", () => {
      const a = analise({ declarados: { seguroIncendio: vazio, condominio: vazio, iptu: iptuDe(null, "desconhecido") } });
      const visao = derivar(a);
      expect(visao.perguntas.find((p) => p.id === "lacuna-seguro")).toEqual({
        id: "lacuna-seguro", titulo: "Há seguro incêndio? Quanto custa?", pista: "Não informado no anúncio",
        textoParaMensagem: "Há seguro incêndio no contrato de aluguel? Qual é o valor mensal?", origem: "lacuna", prioridade: "custo",
      });
      expect(lacunasDeCusto(a)).toEqual(["lacuna-condominio", "lacuna-iptu", "lacuna-seguro"]);
    });

    it("aluguel com seguro a confirmar tem a pista 'Valor a confirmar' e o valor do anúncio na mensagem", () => {
      const a = analise({ declarados: { seguroIncendio: v(42, true) } });
      expect(derivar(a).perguntas.find((p) => p.id === "lacuna-seguro")).toMatchObject({
        titulo: "Há seguro incêndio? Quanto custa?", pista: "Valor a confirmar", prioridade: "custo", origem: "lacuna",
        textoParaMensagem: "Qual é o valor mensal do seguro incêndio? O anúncio informa R$ 42.",
      });
      expect(derivar(a).custo.parcelas.find((p) => p.nome === "Seguro incêndio")?.estado).toBe("a_confirmar");
    });

    it("seguro conhecido não gera pergunta; digitado pela pessoa (inclusive R$ 0) também não", () => {
      expect(ids(derivar(analise()))).not.toContain("lacuna-seguro");
      expect(ids(derivar(analise({ declarados: { seguroIncendio: digitado(0) } })))).not.toContain("lacuna-seguro");
    });

    it("na compra o seguro desconhecido não gera pergunta", () => {
      const a = analise({ modalidade: "compra", declarados: { seguroIncendio: vazio } });
      expect(ids(derivar(a))).not.toContain("lacuna-seguro");
    });

    it("taxa de serviço e outros só geram pergunta se informados e a confirmar", () => {
      const nenhum = analise({ declarados: { taxaServico: vazio, outros: vazio } });
      expect(ids(derivar(nenhum))).not.toContain("lacuna-taxa-servico");
      expect(ids(derivar(nenhum))).not.toContain("lacuna-outros");

      const conhecidos = analise({ declarados: { taxaServico: v(80), outros: v(60) } });
      expect(ids(derivar(conhecidos))).not.toContain("lacuna-taxa-servico");
      expect(ids(derivar(conhecidos))).not.toContain("lacuna-outros");

      const desconhecidosMasMarcados = analise({ declarados: { taxaServico: v(null, true), outros: v(null, true) } });
      expect(ids(derivar(desconhecidosMasMarcados))).not.toContain("lacuna-taxa-servico");
      expect(ids(derivar(desconhecidosMasMarcados))).not.toContain("lacuna-outros");

      const aConfirmar = analise({ declarados: { taxaServico: v(80, true), outros: v(60, true) } });
      const { perguntas } = derivar(aConfirmar);
      expect(perguntas.find((p) => p.id === "lacuna-taxa-servico")).toEqual({
        id: "lacuna-taxa-servico", titulo: "Qual é a taxa de serviço?", pista: "Valor a confirmar",
        textoParaMensagem: "O anúncio informa R$ 80 de taxa de serviço. Qual é o valor correto e o que ela cobre?", origem: "lacuna", prioridade: "custo",
      });
      expect(perguntas.find((p) => p.id === "lacuna-outros")).toEqual({
        id: "lacuna-outros", titulo: "O que são os outros custos?", pista: "Valor a confirmar",
        textoParaMensagem: "O anúncio informa R$ 60 de outros custos mensais. Do que se trata e qual é o valor correto?", origem: "lacuna", prioridade: "custo",
      });
      expect(lacunasDeCusto(aConfirmar)).toEqual(["lacuna-taxa-servico", "lacuna-outros"]);
    });

    it("as perguntas novas respeitam a prioridade escolhida e o endereço continua primeiro", () => {
      const a = analise({ declarados: { seguroIncendio: vazio } });
      const lista = ids(derivar(a, { prioridade: "documentos" }));
      expect(lista[0]).toBe("lacuna-endereco");
      expect(lista.indexOf("padrao-documentos")).toBeLessThan(lista.indexOf("lacuna-seguro"));
      expect(ids(derivar(a, { prioridade: "custo" })).slice(0, 2)).toEqual(["lacuna-endereco", "lacuna-seguro"]);
    });
  });

  it("achado-estrutura, achado-area e achado-obras só existem com o achado correspondente", () => {
    const e = edificio({
      ate4Pavimentos: true, pavimentos: null, anoConstrucao: 1990, padrao: "Simples", obras150m: comObras(4, 1, [[0, 85]]),
    });
    const { a } = noPredio({ declarados: { area: v(140) } }, e);
    const visao = derivar(a, { e });
    expect(visao.perguntas.find((p) => p.id === "achado-estrutura")).toEqual({
      id: "achado-estrutura", titulo: "Qual é o sistema estrutural?", pista: "3 sinais no cadastro",
      textoParaMensagem: "Qual é o sistema estrutural do prédio e há laudo disponível?", origem: "achado", prioridade: "documentos",
    });
    expect(visao.perguntas.find((p) => p.id === "achado-area")).toMatchObject({
      titulo: "Qual é a área privativa na matrícula?", pista: "140 × 124,5 m²", origem: "achado", prioridade: "documentos",
    });
    expect(visao.perguntas.find((p) => p.id === "achado-obras")).toMatchObject({
      titulo: "As obras próximas afetam a rotina?", pista: "4 obras licenciadas a 150 m", origem: "achado", prioridade: "conforto",
    });
    const limpo = derivar(analise());
    expect(ids(limpo).filter((id) => id.startsWith("achado-"))).toEqual([]);
  });

  it("as perguntas de achado existem mesmo quando o achado não coube entre principal e apoio", () => {
    const e = edificio({
      ate4Pavimentos: true, pavimentos: null, anoConstrucao: 1990, padrao: "Médio", obras150m: comObras(3, 0, [[0, 85]]),
    });
    const { a } = noPredio({
      modalidade: "compra",
      extracao: extracaoCom([anomalia("iptu", "periodo_desconhecido", "R$ 288"), anomalia("condominio", "valor_atipico", "R$ 150")]),
      declarados: { preco: v(896000), area: v(100), iptu: iptuDe(288, "desconhecido", true), condominio: v(150) },
    }, e);
    const visao = derivar(a, { e });
    expect(achadoIds(visao)).toEqual(["ach-anomalia-iptu", "ach-anomalia-condominio", "ach-iptu", "ach-estrutura"]);
    expect(ids(visao)).toEqual(expect.arrayContaining(["achado-estrutura", "achado-obras"]));
  });

  it("perguntas padrão sempre presentes, com título, pista e prioridade", () => {
    const padrao = derivar(analise()).perguntas.filter((p) => p.origem === "padrao");
    expect(padrao.map((p) => [p.id, p.titulo, p.pista, p.prioridade])).toEqual([
      ["padrao-documentos", "Há cota extra ou obra aprovada?", "Peça atas e balancetes", "documentos"],
      ["padrao-agua", "Como é a pressão da água?", "Teste torneiras e chuveiro", "conforto"],
      ["padrao-ruido", "Como é o ruído com a janela aberta?", "Ouça na visita", "conforto"],
      ["padrao-sol", "O sol chega às janelas?", "Anote a orientação na visita", "conforto"],
    ]);
    expect(derivar(analise({ modalidade: "compra" })).perguntas.filter((p) => p.origem === "padrao")).toHaveLength(4);
  });

  it("perguntas próprias da visita vão no fim, com origem propria e prioridade conforto", () => {
    const a = analise({
      declarados: { condominio: vazio },
      visita: {
        ...BASE.visita,
        perguntasProprias: [{ id: "propria-vaga", texto: "A vaga é coberta?" }, { id: "propria-pet", texto: "Aceita animais de estimação?" }],
      },
    });
    const { perguntas } = derivar(a);
    expect(perguntas.slice(-2)).toEqual([
      { id: "propria-vaga", titulo: "A vaga é coberta?", pista: "Sua pergunta", textoParaMensagem: "A vaga é coberta?", origem: "propria", prioridade: "conforto" },
      { id: "propria-pet", titulo: "Aceita animais de estimação?", pista: "Sua pergunta", textoParaMensagem: "Aceita animais de estimação?", origem: "propria", prioridade: "conforto" },
    ]);
  });

  it("a ordem das perguntas sem prioridade segue a derivação", () => {
    const e = edificio({ ate4Pavimentos: true, pavimentos: null, anoConstrucao: 1990, padrao: "Médio", obras150m: comObras(3, 0, []) });
    const { a } = noPredio({
      vinculo: { estado: "pendente" },
      extracao: extracaoCom([anomalia("iptu", "periodo_desconhecido", "R$ 288")]),
      declarados: { preco: vazio, condominio: vazio, iptu: iptuDe(288, "desconhecido", true), area: v(98) },
      visita: { ...BASE.visita, perguntasProprias: [{ id: "propria-x", texto: "Tem portaria?" }] },
    }, e);
    const visao = derivarDossie(a, null, null, OBRAS, [], AGORA);
    expect(ids(visao)).toEqual([
      "lacuna-endereco", "lacuna-preco", "lacuna-condominio", "anomalia-iptu",
      "padrao-documentos", "padrao-agua", "padrao-ruido", "padrao-sol", "propria-x",
    ]);
  });

  it("nenhuma pergunta repete id", () => {
    const e = edificio({ ate4Pavimentos: true, pavimentos: null, anoConstrucao: 1990, padrao: "Médio", obras150m: comObras(3, 0, []) });
    const { a } = noPredio({
      extracao: extracaoCom([anomalia("iptu", "valor_repetido", "R$ 1190"), anomalia("iptu", "periodo_desconhecido", "R$ 1190"), anomalia("condominio", "valor_repetido", "R$ 1190")]),
      declarados: { condominio: v(1190), iptu: iptuDe(1190, "desconhecido", true), area: v(140) },
      visita: { ...BASE.visita, perguntasProprias: [{ id: "propria-a", texto: "A?" }, { id: "propria-b", texto: "B?" }] },
    }, e);
    const lista = ids(derivar(a, { e }));
    expect(new Set(lista).size).toBe(lista.length);
  });

  describe("ordenação por prioridade", () => {
    const a = analise({ declarados: { condominio: vazio, iptu: iptuDe(null, "desconhecido") } });

    it("sem prioridade fica na ordem da derivação", () => {
      expect(ids(derivar(a))).toEqual([
        "lacuna-endereco", "lacuna-condominio", "lacuna-iptu", "padrao-documentos", "padrao-agua", "padrao-ruido", "padrao-sol",
      ]);
    });

    it("lacuna-endereco é sempre a primeira; a prioridade escolhida vem depois, mantendo a ordem", () => {
      expect(ids(derivar(a, { prioridade: "custo" }))).toEqual([
        "lacuna-endereco", "lacuna-condominio", "lacuna-iptu", "padrao-documentos", "padrao-agua", "padrao-ruido", "padrao-sol",
      ]);
      expect(ids(derivar(a, { prioridade: "conforto" }))).toEqual([
        "lacuna-endereco", "padrao-agua", "padrao-ruido", "padrao-sol", "lacuna-condominio", "lacuna-iptu", "padrao-documentos",
      ]);
      expect(ids(derivar(a, { prioridade: "documentos" }))).toEqual([
        "lacuna-endereco", "padrao-documentos", "lacuna-condominio", "lacuna-iptu", "padrao-agua", "padrao-ruido", "padrao-sol",
      ]);
    });

    it("ordenarPerguntas é estável e não altera a lista recebida", () => {
      const original = derivar(a).perguntas;
      const copia = [...original];
      const ordenada = ordenarPerguntas(original, "conforto");
      expect(original).toEqual(copia);
      expect(ordenada).not.toBe(original);
      expect(ordenarPerguntas(original, null)).toEqual(original);
      expect(ordenada.map((p) => p.id)).toEqual(ids(derivar(a, { prioridade: "conforto" })));
    });
  });
});

// ——— Cadastro, histórico e obras ——————————————————————————————————————————————————————

describe("cadastro", () => {
  it("com prédio confirmado lista os fatos do cadastro, com fonte e confiança", () => {
    const { a, e } = noPredio();
    const visao = derivar(a, { e });
    expect(visao.cadastro.map((f) => [f.rotulo, f.valor, f.confianca, f.fonte])).toEqual([
      ["Nome do edifício", "Residencial Alfa", "oficial", "lotes"],
      ["Ano de construção", "2010", "oficial", "iptu_2026"],
      ["Pavimentos", "12", "oficial", "lotes"],
      ["Unidades residenciais", "24", "oficial", "iptu_2026"],
      ["Área das unidades mais parecidas", "98 m²", "inferencia", "iptu_2026"],
      ["IPTU 2026 no prédio", "R$ 328–R$ 440/mês", "oficial", "iptu_2026"],
      ["Padrão", "Superior", "oficial", "iptu_2026"],
      ["Chave cadastral", "6.1755.015.02.0005", "oficial", "lotes"],
    ]);
    expect(visao.loteConfirmado).toBe(true);
    expect(visao.endereco).toBe("Rua Sintetica Alfa, 100");
  });

  it("a área do cadastro é a da tipologia mais próxima da área do anúncio", () => {
    const { a, e } = noPredio({ declarados: { area: v(125) } });
    const fato = derivar(a, { e }).cadastro.find((f) => f.id === "cadastro-area");
    expect(fato).toEqual({
      id: "cadastro-area", rotulo: "Área das unidades mais parecidas", valor: "124,5 m²", confianca: "inferencia", fonte: "iptu_2026",
      detalhe: "12 unidades de 124,5 m² neste prédio",
    });
  });

  it("a área das unidades mais parecidas usa o singular quando há uma só unidade", () => {
    const unica = edificio({ tipologias: [{ area: 98, unidades: 1, iptuAnualMediano: 3936 }, { area: 124.5, unidades: 12, iptuAnualMediano: 5280 }] });
    const { a, e } = noPredio({}, unica);
    expect(derivar(a, { e }).cadastro.find((f) => f.id === "cadastro-area")?.detalhe).toBe("1 unidade de 98 m² neste prédio");
  });

  it("sem área declarada mostra a faixa das tipologias, nunca um valor escolhido ao acaso", () => {
    const { a, e } = noPredio({ declarados: { area: vazio } });
    expect(derivar(a, { e }).cadastro.find((f) => f.id === "cadastro-area")).toMatchObject({
      rotulo: "Área no cadastro", valor: "98 a 124,5 m²", detalhe: "2 tipologias no prédio", confianca: "oficial", fonte: "iptu_2026",
    });
  });

  describe("IPTU 2026 no prédio (iptu-faixa)", () => {
    const faixaDe = (e: Edificio, mudancas: Mudancas = {}) => {
      const { a } = noPredio(mudancas, e);
      return derivar(a, { e }).cadastro.find((f) => f.id === "iptu-faixa");
    };
    const comIptu = (iptuAnual: Edificio["iptuAnual"]) => edificio({ iptuAnual });

    it("faixa do 1º ao 3º quartil em valor mensal, oficial, da base de IPTU 2026", () => {
      expect(faixaDe(edificio())).toEqual({
        id: "iptu-faixa", rotulo: "IPTU 2026 no prédio", valor: "R$ 328–R$ 440/mês", confianca: "oficial", fonte: "iptu_2026",
        detalhe: "Metade central das 24 unidades residenciais do prédio",
      });
      expect(faixaDe(comIptu({ n: 5, p25: 3936, mediana: 4200, p75: 4452 }))?.valor).toBe("R$ 328–R$ 371/mês");
    });

    it("arredonda para o real mais próximo, como o resto do dossiê", () => {
      expect(faixaDe(comIptu({ n: 9, p25: 3950, mediana: 4100, p75: 4460 }))?.valor).toBe("R$ 329–R$ 372/mês");
    });

    it("depende só do prédio: não muda com o IPTU do anúncio nem com a modalidade", () => {
      const e = edificio();
      expect(faixaDe(e, { declarados: { iptu: iptuDe(9999, "mes") } })?.valor).toBe("R$ 328–R$ 440/mês");
      expect(faixaDe(e, { modalidade: "compra" })?.valor).toBe("R$ 328–R$ 440/mês");
    });

    it("fica ao lado da área e antes do padrão", () => {
      const { a, e } = noPredio();
      const rotulos = derivar(a, { e }).cadastro.map((f) => f.id);
      expect(rotulos.indexOf("iptu-faixa")).toBe(rotulos.indexOf("cadastro-area") + 1);
      expect(rotulos.indexOf("iptu-faixa")).toBeLessThan(rotulos.indexOf("cadastro-padrao"));
    });

    it("sem quartis ou com menos de 2 unidades no cálculo, não há fato", () => {
      expect(faixaDe(comIptu(null))).toBeUndefined();
      expect(faixaDe(comIptu({ n: 1, p25: 3936, mediana: 3936, p75: 3936 }))).toBeUndefined();
      expect(faixaDe(comIptu({ n: 2, p25: 3936, mediana: 4000, p75: 4100 }))?.valor).toBe("R$ 328–R$ 342/mês");
    });

    it("sem prédio confirmado não há faixa, mesmo com o edifício à mão", () => {
      const e = edificio();
      for (const visao of [derivar(analise(), { e }), derivar(analise({ vinculo: confirmadoEm("99002-200") }), { e })]) {
        expect(visao.cadastro.map((f) => f.id)).toEqual(["cadastro-sem-predio"]);
      }
    });

    it("limites iguais viram um valor só; zero no cadastro (isenção) nunca vira 'R$ 0'", () => {
      expect(faixaDe(comIptu({ n: 6, p25: 3936, mediana: 3936, p75: 3936 }))?.valor).toBe("R$ 328/mês");
      expect(faixaDe(comIptu({ n: 6, p25: 0, mediana: 3000, p75: 4000 }))).toBeUndefined();
      expect(faixaDe(comIptu({ n: 6, p25: 0, mediana: 0, p75: 0 }))).toBeUndefined();
      expect(faixaDe(comIptu({ n: 6, p25: 3, mediana: 3, p75: 5 }))).toBeUndefined();
    });
  });

  it("nome do edifício só aparece quando existe", () => {
    const { a, e } = noPredio({}, edificio({ nome: null }));
    expect(derivar(a, { e }).cadastro.map((f) => f.rotulo)).not.toContain("Nome do edifício");
  });

  it("pavimentos: do cadastro de lotes, ou inferido do tipo de construção, ou a confirmar", () => {
    const pavimentos = (mudancas: Partial<Edificio>) => {
      const { a, e } = noPredio({}, edificio(mudancas));
      return derivar(a, { e }).cadastro.find((f) => f.id === "cadastro-pavimentos");
    };
    expect(pavimentos({ pavimentos: 12 })).toMatchObject({ valor: "12", confianca: "oficial", fonte: "lotes" });
    expect(pavimentos({ pavimentos: null, ate4Pavimentos: true })).toMatchObject({ valor: "Até 4 pavimentos", confianca: "inferencia", fonte: "iptu_2026" });
    expect(pavimentos({ pavimentos: null, ate4Pavimentos: false })).toMatchObject({ valor: "Mais de 4 pavimentos", confianca: "inferencia" });
    expect(pavimentos({ pavimentos: null, ate4Pavimentos: null })).toMatchObject({ valor: "A confirmar", confianca: "nao_sabemos", fonte: null });
  });

  it("dado ausente no cadastro vira 'A confirmar', nunca zero", () => {
    const { a, e } = noPredio({}, edificio({ anoConstrucao: null, padrao: null, dsqfl: null, nome: null, pavimentos: null, ate4Pavimentos: null }));
    const fatos = derivar(a, { e }).cadastro;
    for (const rotulo of ["Ano de construção", "Pavimentos", "Padrão", "Chave cadastral"]) {
      expect(fatos.find((f) => f.rotulo === rotulo)).toMatchObject({ valor: "A confirmar", confianca: "nao_sabemos", fonte: null });
    }
    expect(fatos.map((f) => f.valor)).not.toContain("0");
  });

  it("sem prédio: um único fato nao_sabemos", () => {
    const pendente = derivar(analise());
    expect(pendente.cadastro).toEqual([
      { id: "cadastro-sem-predio", rotulo: "Prédio não confirmado", valor: "Confirme o prédio para ver o cadastro", confianca: "nao_sabemos", fonte: null, detalhe: null },
    ]);
    expect(pendente.loteConfirmado).toBe(false);
    expect(pendente.obras).toBeNull();
    expect(pendente.historico).toEqual([]);
    const fora = derivar(analise({ bairro: "boa-vista", bairroTexto: "Boa Vista", vinculo: { estado: "fora_de_cobertura" } }));
    expect(fora.cadastro).toHaveLength(1);
    expect(fora.cadastro[0]).toMatchObject({ rotulo: "Prédio não confirmado", valor: "Fora da área com cadastro", confianca: "nao_sabemos" });
  });

  it("edifício de outro vínculo, ou sem vínculo confirmado, não é usado", () => {
    const e = edificio();
    const outro = analise({ vinculo: confirmadoEm("99002-200") });
    const visao = derivar(outro, { e });
    expect(visao.loteConfirmado).toBe(false);
    expect(visao.cadastro).toHaveLength(1);
    expect(visao.cadastro[0]?.valor).toBe("Prédio confirmado não encontrado no índice atual");
    expect(derivar(analise(), { e }).loteConfirmado).toBe(false);
    expect(derivar(analise(), { e }).endereco).toBeNull();
  });
});

describe("cabeçalho", () => {
  it("subtítulo e endereço", () => {
    expect(derivar(analise()).subtitulo).toBe("Casa Forte · Recife");
    expect(derivar(analise()).endereco).toBeNull();
    expect(derivar(analise({ logradouro: "Rua do Sol", numero: "55" })).endereco).toBe("Rua do Sol, 55");
    expect(derivar(analise({ logradouro: "Rua do Sol", numero: null })).endereco).toBe("Rua do Sol");
    expect(derivar(analise({ bairro: null, bairroTexto: "" })).subtitulo).toBe("Recife");
    expect(derivar(analise({ bairro: null, bairroTexto: "Bairro Novo", extracao: extracaoCom([], "fora_do_recife", "olinda") })).subtitulo).toBe("Bairro Novo · Olinda");
  });

  it("com prédio confirmado, o endereço vem do cadastro em caixa de título", () => {
    const { a, e } = noPredio({ logradouro: "Outra Rua", numero: "9" }, edificio({ logradouro: "RUA DO FUTURO DE SANTO", numero: "331" }));
    expect(derivar(a, { e }).endereco).toBe("Rua do Futuro de Santo, 331");
  });

  it("o prefixo do cadastro vem por extenso: 'EST DO ENCANAMENTO' é 'Estrada do Encanamento', nunca 'Est do Encanamento'", () => {
    const { a, e } = noPredio({}, edificio({ logradouro: "EST DO ENCANAMENTO", numero: "719" }));
    expect(derivar(a, { e }).endereco).toBe("Estrada do Encanamento, 719");
    const praca = noPredio({}, edificio({ logradouro: "PRC DE CASA FORTE", numero: "317" }));
    expect(derivar(praca.a, { e: praca.e }).endereco).toBe("Praça de Casa Forte, 317");
    const avenida = noPredio({}, edificio({ logradouro: "AV DEZESSETE DE AGOSTO", numero: "1070" }));
    expect(derivar(avenida.a, { e: avenida.e }).endereco).toBe("Avenida Dezessete de Agosto, 1070");
  });

  it("sem prédio, o que a análise guarda também passa por formatarEndereco", () => {
    expect(derivar(analise({ logradouro: "EST DO ENCANAMENTO", numero: "719" })).endereco).toBe("Estrada do Encanamento, 719");
    expect(derivar(analise({ logradouro: "av. rui barbosa", numero: " 12 " })).endereco).toBe("Avenida Rui Barbosa, 12");
    expect(derivar(analise({ logradouro: "  ", numero: "12" })).endereco).toBeNull();
  });

  it("enderecoDoImovel: o prédio confirmado vence a análise; sem nenhum dos dois, nulo", () => {
    const rua = { logradouro: "Rua do Sol", numero: "55" };
    expect(enderecoDoImovel(rua, { logradouro: "EST DO ENCANAMENTO", numero: "719" })).toBe("Estrada do Encanamento, 719");
    expect(enderecoDoImovel(rua, null)).toBe("Rua do Sol, 55");
    expect(enderecoDoImovel({ logradouro: null, numero: "55" }, null)).toBeNull();
  });
});

describe("histórico e obras próximas", () => {
  it("construção, as transmissões de cada ano (porAno) e cada demolição, do mais antigo ao mais recente", () => {
    const e = edificio({ obras150m: comObras(3, 1, [[0, 85], [1, 120], [2, 40]]) });
    const { a } = noPredio({}, e);
    const visao = derivar(a, { e });
    expect(visao.historico).toEqual([
      { quando: "2010", texto: "Construção registrada no cadastro" },
      { quando: "2018", texto: "3 transmissões" },
      { quando: "2025", texto: "Demolição licenciada a 120 m" },
      { quando: "2026", texto: "9 transmissões" },
    ]);
  });

  it("porAno vira uma linha por ano, em ordem, e a ordem das fontes vale dentro do mesmo ano", () => {
    const itbi = { transmissoes: 7, desde: 2016, ate: 2025, valorUnidade: null, porAno: [[2016, 3], [2020, 1], [2025, 3]] as [number, number][] };
    const e = edificio({ anoConstrucao: 2020, itbi, obras150m: comObras(3, 1, [[1, 120]]) });
    const { a } = noPredio({}, e);
    expect(derivar(a, { e }).historico).toEqual([
      { quando: "2016", texto: "3 transmissões" },
      { quando: "2020", texto: "Construção registrada no cadastro" },
      { quando: "2020", texto: "1 transmissão" },
      { quando: "2025", texto: "3 transmissões" },
      { quando: "2025", texto: "Demolição licenciada a 120 m" },
    ]);
  });

  it("sem ITBI, sem ano e sem demolição, o histórico não inventa linhas; um ano com uma transmissão", () => {
    const vazioDeHistorico = noPredio({}, edificio({ anoConstrucao: null, itbi: null }));
    expect(derivar(vazioDeHistorico.a, { e: vazioDeHistorico.e }).historico).toEqual([]);
    const unico = noPredio({}, edificio({ itbi: { transmissoes: 1, desde: 2024, ate: 2024, valorUnidade: null, porAno: [[2024, 1]] } }));
    expect(derivar(unico.a, { e: unico.e }).historico[1]).toEqual({ quando: "2024", texto: "1 transmissão" });
  });

  it("obras: recentes resolvidos contra a lista do bairro, com a distância", () => {
    const e = edificio({ obras150m: comObras(3, 1, [[2, 40], [1, 120], [0, 85]]) });
    const { a } = noPredio({}, e);
    const { obras } = derivar(a, { e });
    expect(obras).toMatchObject({ licencasDeObra: 68, relevantes24m: 3, demolicoes24m: 1 });
    expect(obras?.recentes).toEqual([
      { ...OBRAS[2], distanciaM: 40 }, { ...OBRAS[1], distanciaM: 120 }, { ...OBRAS[0], distanciaM: 85 },
    ]);
  });

  it("índice de obra que não existe na lista do bairro é ignorado", () => {
    const e = edificio({ obras150m: comObras(2, 0, [[0, 85], [7, 100]]) });
    const { a } = noPredio({}, e);
    expect(derivar(a, { e }).obras?.recentes).toEqual([{ ...OBRAS[0], distanciaM: 85 }]);
  });
});

// ——— Pureza ———————————————————————————————————————————————————————————————————————

function congelar<T>(valor: T): T {
  if (valor !== null && typeof valor === "object" && !Object.isFrozen(valor)) {
    Object.freeze(valor);
    for (const filho of Object.values(valor)) congelar(filho);
  }
  return valor;
}

describe("função pura", () => {
  const e = edificio({ obras150m: comObras(3, 1, [[0, 85], [1, 120]]) });
  const a = analise({
    vinculo: confirmadoEm(e.id),
    extracao: extracaoCom([anomalia("iptu", "periodo_desconhecido", "R$ 288")]),
    declarados: { iptu: iptuDe(288, "desconhecido", true) },
    visita: { ...BASE.visita, perguntasProprias: [{ id: "propria-x", texto: "Tem portaria?" }] },
  });

  it("mesma entrada, mesma saída, sem alterar nada do que recebeu", () => {
    const entradas = [a, e, CONTEXTO, OBRAS, [outraDeAluguel("o1", 3000, 60)]] as const;
    congelar(entradas);
    const primeira = derivarDossie(a, e, CONTEXTO, OBRAS, [outraDeAluguel("o1", 3000, 60)], AGORA);
    const segunda = derivarDossie(a, e, CONTEXTO, OBRAS, [outraDeAluguel("o1", 3000, 60)], new Date("2030-01-01T00:00:00Z"));
    expect(segunda).toEqual(primeira);
  });

  it("não lê o relógio", () => {
    const relogio = jest.spyOn(Date, "now");
    derivarDossie(a, e, CONTEXTO, OBRAS, [], AGORA);
    expect(relogio).not.toHaveBeenCalled();
    relogio.mockRestore();
    const fonte = readFileSync(join(__dirname, "../src/dados/dossie/derivar.ts"), "utf8");
    expect(fonte).not.toMatch(/Date\.now|new Date\(|Math\.random/);
  });
});

// ——— Palavras proibidas (seção 1.2) —————————————————————————————————————————————————

const PROIBIDAS = [/perigos/i, /vale a pena/i, /caro/i, /barat/i, /caix[ãa]o/i, /ótim|\botim/i, /ruim/i, /arriscad/i];

/** `seguro` só passa dentro de "seguro incêndio" e "seguro fiança". */
function palavrasProibidas(texto: string): string[] {
  const achadas = PROIBIDAS.filter((padrao) => padrao.test(texto)).map(String);
  const sobra = texto.replace(/seguro inc[êe]ndio/gi, "").replace(/seguro fian[çc]a/gi, "");
  if (/seguro/i.test(sobra)) achadas.push("/seguro/");
  return achadas;
}

/** Identificadores internos ("lacuna-seguro", "ach-iptu") nunca aparecem na tela: fora da varredura de texto. */
const CHAVES_DE_IDENTIFICADOR = new Set(["id", "perguntaId", "analiseId"]);

function textosDe(valor: unknown, acumulado: string[] = []): string[] {
  if (typeof valor === "string") acumulado.push(valor);
  else if (Array.isArray(valor)) for (const item of valor) textosDe(item, acumulado);
  else if (valor !== null && typeof valor === "object") {
    for (const [chave, item] of Object.entries(valor)) if (!CHAVES_DE_IDENTIFICADOR.has(chave)) textosDe(item, acumulado);
  }
  return acumulado;
}

type Caso = { nome: string; a: AnaliseV2; e?: Edificio | null; contexto?: ContextoDoBairro | null; outras?: AnaliseV2[] };

function bateria(): Caso[] {
  const alto = edificio();
  const unico = edificioUnico();
  const antigo = edificioUnico({
    id: "99003-300", nome: "Residencial Beta", ate4Pavimentos: true, pavimentos: 4, anoConstrucao: 1978, padrao: "Simples",
    obras150m: comObras(5, 2, [[0, 40], [1, 120], [2, 85]]),
  });
  const sem = edificio({
    id: "99004-400", nome: null, dsqfl: null, pavimentos: null, ate4Pavimentos: null, padrao: null, anoConstrucao: null, itbi: null,
    tipologias: [{ area: 60, unidades: 2, iptuAnualMediano: null }],
  });
  const isento = edificio({
    id: "99005-500", nome: "Residencial Gama", tipologias: [{ area: 98, unidades: 12, iptuAnualMediano: 0 }],
    iptuAnual: { n: 12, p25: 0, mediana: 0, p75: 0 },
  });
  const tres = [outraDeAluguel("o1", 3000, 60), outraDeAluguel("o2", 4200, 70), outraDeAluguel("o3", 5600, 80)];
  const noAlto = (m: Mudancas = {}) => analise({ vinculo: confirmadoEm(alto.id), ...m });

  return [
    { nome: "aluguel conhecido, sem prédio", a: analise() },
    { nome: "aluguel, prédio alto, obras com demolição", a: noAlto(), e: edificio({ obras150m: comObras(3, 1, [[0, 85], [1, 120]]) }) },
    { nome: "aluguel, IPTU sem periodicidade, prédio confirmado", a: noAlto({
      extracao: extracaoCom([anomalia("iptu", "periodo_desconhecido", "R$ 288")]), declarados: { iptu: iptuDe(288, "desconhecido", true) },
    }), e: alto },
    { nome: "aluguel, 3 sinais estruturais", a: analise({ vinculo: confirmadoEm(antigo.id) }), e: antigo },
    { nome: "compra acima da mediana do prédio de tipologia única", a: analise({
      modalidade: "compra", vinculo: confirmadoEm(unico.id), declarados: { preco: v(896000), area: v(100) },
    }), e: unico },
    { nome: "compra em prédio de tipologias diferentes", a: noAlto({ modalidade: "compra", declarados: { preco: v(896000), area: v(100) } }), e: alto },
    { nome: "compra abaixo da mediana do prédio, 3 sinais", a: analise({ modalidade: "compra", vinculo: confirmadoEm(antigo.id), declarados: { preco: v(500000), area: v(98) } }), e: antigo },
    { nome: "compra na mediana", a: analise({
      modalidade: "compra", vinculo: confirmadoEm(unico.id), declarados: { preco: v(800000), area: v(100) },
    }), e: unico },
    { nome: "compra sem prédio, com contexto do bairro", a: analise({ modalidade: "compra", declarados: { preco: v(990000), area: v(100) } }), contexto: CONTEXTO },
    { nome: "compra com tudo a confirmar", a: analise({ modalidade: "compra", declarados: {
      preco: v(700000, true), condominio: v(900, true), iptu: iptuDe(2400, "ano", true), area: v(70, true),
    } }), contexto: CONTEXTO },
    { nome: "fora de cobertura", a: analise({
      bairro: "boa-vista", bairroTexto: "Boa Vista", vinculo: { estado: "fora_de_cobertura" }, extracao: extracaoCom([], "recife_fora"),
    }) },
    { nome: "fora do Recife, sem bairro", a: analise({
      bairro: null, bairroTexto: "Bairro Novo", logradouro: "Rua do Sol", numero: "55", extracao: extracaoCom([], "fora_do_recife", "olinda"),
    }) },
    { nome: "anomalias simbólica, atípica e repetida", a: analise({
      extracao: extracaoCom([anomalia("iptu", "valor_simbolico", "R$ 5"), anomalia("condominio", "valor_atipico", "R$ 150")]),
      declarados: { iptu: iptuDe(null, "desconhecido"), condominio: v(150) },
    }) },
    { nome: "IPTU igual ao condomínio e leituras incoerentes", a: analise({
      extracao: extracaoCom([anomalia("iptu", "valor_repetido", "R$ 1190"), anomalia("condominio", "valor_repetido", "R$ 1190"), anomalia("iptu", "incoerente", "[object Object]")]),
      declarados: { iptu: iptuDe(1190, "mes"), condominio: v(1190) },
    }) },
    { nome: "aluguel com 3 outras e perguntas próprias", a: analise({
      visita: { ...BASE.visita, perguntasProprias: [{ id: "propria-vaga", texto: "A vaga é coberta?" }] },
    }), outras: tres },
    { nome: "área e IPTU não conferem", a: noAlto({ declarados: { area: v(140), iptu: iptuDe(150, "mes") } }), e: alto },
    { nome: "IPTU não confere na tipologia pequena", a: noAlto({ declarados: { area: v(98), iptu: iptuDe(150, "mes") } }), e: alto },
    { nome: "casa, tudo desconhecido", a: analise({
      tipologia: "casa", bairro: null, bairroTexto: "",
      declarados: { preco: vazio, condominio: vazio, iptu: iptuDe(null, "desconhecido"), seguroIncendio: vazio, area: vazio, quartos: vazio },
    }) },
    { nome: "prédio com cadastro quase vazio", a: analise({ vinculo: confirmadoEm(sem.id), declarados: { area: v(60), iptu: iptuDe(null, "desconhecido") } }), e: sem },
    { nome: "aluguel sem seguro nem condomínio, prédio confirmado", a: noAlto({ declarados: { seguroIncendio: vazio, condominio: vazio } }), e: alto },
    { nome: "aluguel com seguro, taxa de serviço e outros a confirmar", a: analise({
      declarados: { seguroIncendio: v(42, true), taxaServico: v(80, true), outros: v(60, true) },
    }) },
    { nome: "prédio isento de IPTU no cadastro, IPTU do anúncio informado", a: analise({
      vinculo: confirmadoEm(isento.id), declarados: { iptu: iptuDe(288, "mes") },
    }), e: isento },
    { nome: "prédio isento de IPTU no cadastro, IPTU do anúncio desconhecido", a: analise({
      vinculo: confirmadoEm(isento.id), declarados: { iptu: iptuDe(null, "desconhecido") },
    }), e: isento },
    { nome: "endereço completo com vínculo pulado", a: analise({
      logradouro: "Rua do Sol", numero: "55", vinculo: { estado: "pulado", em: INSTANTE }, declarados: { seguroIncendio: vazio },
    }) },
    { nome: "compra com seguro e taxa de serviço a confirmar", a: analise({
      modalidade: "compra", declarados: { preco: v(800000), area: v(100), seguroIncendio: v(40, true), taxaServico: v(90, true) },
    }), contexto: CONTEXTO },
  ];
}

describe("palavras proibidas da seção 1.2", () => {
  it("o detector pega o que deve e deixa passar seguro incêndio e seguro fiança", () => {
    for (const ruim of ["É perigoso?", "perigos do local", "Vale a pena", "preço caro", "bem barato", "um caixão", "ótimo negócio", "otimo", "ruim", "arriscado", "seguro de vida", "Seguro"]) {
      expect(palavrasProibidas(ruim)).not.toEqual([]);
    }
    for (const bom of ["Seguro incêndio fora da soma.", "seguro fiança", "IPTU e Seguro incêndio fora da soma.", "ruído com a janela aberta"]) {
      expect(palavrasProibidas(bom)).toEqual([]);
    }
  });

  const casos = bateria();
  const prioridades: (Prioridade | null)[] = [null, "custo", "conforto", "documentos"];

  it("a bateria tem pelo menos 10 análises válidas, de aluguel e de compra, com e sem prédio", () => {
    expect(casos.length).toBeGreaterThanOrEqual(10);
    expect(casos.some((c) => c.a.modalidade === "aluguel")).toBe(true);
    expect(casos.some((c) => c.a.modalidade === "compra")).toBe(true);
    expect(casos.some((c) => c.e)).toBe(true);
    expect(casos.some((c) => !c.e)).toBe(true);
    expect(casos.some((c) => (c.a.extracao?.anomalias.length ?? 0) > 0)).toBe(true);
    const visoes = casos.map((c) => derivar(c.a, c));
    expect(visoes.some((x) => x.achados.principal?.id === "ach-estrutura" || x.achados.apoio.some((y) => y.id === "ach-estrutura"))).toBe(true);
    expect(visoes.some((x) => x.posicao?.fonte === "suas_analises")).toBe(true);
    expect(visoes.some((x) => x.posicao?.fonte === "itbi" && x.posicao.unidade === "R$")).toBe(true);
    expect(visoes.some((x) => x.posicao?.unidade === "R$/m²" && x.posicao.fonte === "itbi")).toBe(false);
  });

  it("a bateria cobre os casos novos: seguro, taxa, outros, faixa de IPTU, área parecida, isenção e endereço completo", () => {
    expect(casos.length).toBeGreaterThanOrEqual(10);
    const visoes = casos.map((c) => ({ nome: c.nome, visao: derivar(c.a, c) }));
    const todas = visoes.flatMap((x) => ids(x.visao));
    for (const id of ["lacuna-seguro", "lacuna-taxa-servico", "lacuna-outros", "lacuna-endereco"]) expect(todas).toContain(id);
    expect(visoes.some((x) => x.visao.cadastro.some((f) => f.id === "iptu-faixa"))).toBe(true);
    expect(visoes.some((x) => x.visao.cadastro.some((f) => f.id === "cadastro-area" && f.confianca === "inferencia"))).toBe(true);
    for (const { nome, visao } of visoes.filter((x) => x.nome.startsWith("prédio isento"))) {
      expect({ nome, faixa: visao.cadastro.some((f) => f.id === "iptu-faixa"), iptu: achadoIds(visao).includes("ach-iptu") })
        .toEqual({ nome, faixa: false, iptu: false });
    }
    const completo = visoes.find((x) => x.nome === "endereço completo com vínculo pulado");
    expect(completo && ids(completo.visao)).not.toContain("lacuna-endereco");
  });

  it.each(casos.map((c) => [c.nome, c] as const))("nenhum texto gerado contém palavra proibida: %s", (_nome, c) => {
    for (const prioridade of prioridades) {
      const visao = derivar(c.a, { ...c, prioridade });
      const textos = textosDe(visao);
      expect(textos.length).toBeGreaterThan(10);
      for (const texto of textos) {
        expect({ texto, achadas: palavrasProibidas(texto) }).toEqual({ texto, achadas: [] });
      }
    }
  });

  it.each(casos.map((c) => [c.nome, c] as const))("nada de NaN, undefined, [object, Infinity nem R$ 0 inventado: %s", (_nome, c) => {
    const visao = derivar(c.a, c);
    for (const texto of textosDe(visao)) {
      expect(texto).not.toMatch(/NaN|undefined|\[object|Infinity|null/);
      expect(texto).not.toMatch(/R\$ 0(?![\d.,])/);
    }
    expect(JSON.stringify(visao)).not.toMatch(/NaN|Infinity/);
  });

  it.each(casos.map((c) => [c.nome, c] as const))("estrutura consistente: ids únicos, achados apontam para perguntas que existem, no máximo 3 de apoio: %s", (_nome, c) => {
    const visao = derivar(c.a, c);
    const idsDasPerguntas = ids(visao);
    expect(new Set(idsDasPerguntas).size).toBe(idsDasPerguntas.length);
    const todos = [visao.achados.principal, ...visao.achados.apoio].filter((x) => x !== null);
    expect(visao.achados.apoio.length).toBeLessThanOrEqual(3);
    if (visao.achados.principal === null) expect(visao.achados.apoio).toEqual([]);
    expect(new Set(todos.map((x) => x.id)).size).toBe(todos.length);
    for (const achado of todos) {
      if (achado.perguntaId !== null) expect(idsDasPerguntas).toContain(achado.perguntaId);
    }
    expect(visao.cadastro.length).toBeGreaterThan(0);
    if (visao.custo.principal.valor === null) expect(visao.custo.principal.porM2).toBeNull();
    const conhecidas = visao.custo.parcelas.filter((p) => p.estado === "conhecido");
    const soma = conhecidas.reduce((total, p) => total + (p.valorMensal ?? 0), 0);
    expect(visao.custo.totalMensalConhecido).toBe(conhecidas.length ? soma : null);
  });
});
