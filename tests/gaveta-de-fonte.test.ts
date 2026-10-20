// Gaveta de fonte (L2): o texto do rastro do dado oficial TEM DE APARECER NA TELA. Dado calculado pelo Vereda (faixa de IPTU,
// medianas, contagem de obras, moda do ano) mostra "Calculado pelo Vereda…"; valor copiado do registro mostra "sem
// alteração". O teste monta a gaveta como o dossiê a monta (fonte, confiança e dado, sem id) a partir do que a derivação
// de verdade produz, e olha o texto renderizado, não só a função de texto. Edifícios, obras e análises são sintéticos.
import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { GavetaDeFonte, type PedidoDeFonte } from "../src/componentes/fonte/GavetaDeFonte";
import {
  EXPLICACAO_DA_CONFIANCA,
  EXPLICACAO_DO_CALCULO,
  IDS_DE_DADO_CALCULADO,
  IDS_DE_DADO_COPIADO,
} from "../src/componentes/fonte/textos";
import {
  esquemaAnaliseV2,
  esquemaEdificio,
  esquemaObra,
  type AnaliseV2,
  type Confianca,
  type Edificio,
  type MetaDoIndice,
  type Obra,
  type VisaoDoDossie,
} from "../src/dados/contratos";
import { derivarDossie } from "../src/dados/dossie/derivar";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const INSTANTE = "2026-10-20T12:00:00.000Z";
const AGORA = new Date(INSTANTE);
const v = (valor: number | null) => ({ valor, origem: "texto" as const, aConfirmar: false });

type Mudancas = Partial<Omit<AnaliseV2, "declarados">> & { declarados?: Partial<AnaliseV2["declarados"]> };

const BASE: AnaliseV2 = {
  versao: 2, id: "analise-gaveta", criadaEm: INSTANTE, atualizadaEm: INSTANTE,
  nome: "Apartamento sintético de 3 quartos", modalidade: "aluguel", tipologia: "apartamento",
  url: "https://anuncio.invalid/sintetico-1", bairroTexto: "Casa Forte", bairro: "casa-forte",
  logradouro: null, numero: null, nomeEdificio: null, extracao: null,
  declarados: {
    preco: v(4500), condominio: v(1190), iptu: { ...v(null), periodo: "mes" }, seguroIncendio: v(42), taxaServico: v(null), outros: v(null),
    area: v(98), quartos: v(3), suites: v(null), banheiros: v(2), vagas: v(1), andar: v(7),
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

function quadrado(lon: number, lat: number, meio = 0.0001): [number, number][] {
  return [[lon - meio, lat - meio], [lon + meio, lat - meio], [lon + meio, lat + meio], [lon - meio, lat + meio]];
}

function edificio(mudancas: Partial<Edificio> = {}): Edificio {
  return esquemaEdificio.parse({
    id: "99001-100", bairro: "casa-forte", logradouro: "RUA SINTETICA ALFA", numero: "100", dsqfl: "61755015020005",
    nome: "Residencial Alfa", centro: [-34.9, -8.03], poligono: quadrado(-34.9, -8.03), unidades: 24,
    tipologias: [
      { area: 98, unidades: 12, iptuAnualMediano: 3936 },
      { area: 124.5, unidades: 12, iptuAnualMediano: 5280 },
    ],
    anoConstrucao: 2010, pavimentos: 12, ate4Pavimentos: false, padrao: "Superior",
    iptuAnual: { n: 24, p25: 3936, mediana: 4608, p75: 5280 },
    itbi: { transmissoes: 12, desde: 2018, ate: 2026, valorUnidade: { n: 12, p25: 760000, mediana: 800000, p75: 840000 }, porAno: [[2018, 3], [2026, 9]] },
    obras150m: { licencasDeObra: 68, relevantes24m: 3, demolicoes24m: 1, recentes: [[0, 40], [1, 113], [2, 150]] },
    ...mudancas,
  });
}

/** Tipologia única (uma só área, 98 m²): o único prédio em que a compra tem posição pelo ITBI. */
const edificioUnico = () => edificio({ id: "99006-600", tipologias: [{ area: 98, unidades: 24, iptuAnualMediano: 3936 }] });

const OBRAS: Obra[] = [
  { categoria: "construcao", descricao: "ALVARA DE CONSTRUCAO INICIAL", data: "2026-05", situacao: "EM EXIGÊNCIA", centro: [-34.9004, -8.0303] },
].map((o) => esquemaObra.parse(o));

function derivar(a: AnaliseV2, e: Edificio): VisaoDoDossie {
  return derivarDossie(a, e, null, OBRAS, [], AGORA, null);
}

const META: Pick<MetaDoIndice, "fontes"> = {
  fontes: [
    {
      chave: "iptu_2026", nome: "IPTU 2026 (cadastro imobiliário)", orgao: "Prefeitura da Cidade do Recife · Secretaria de Finanças",
      licenca: "ODbL", url: "https://fonte.invalid/iptu", recursos: ["r1"],
      modificadoEm: "2026-10-03", consultadoEm: "2026-10-20T16:17:16Z", registrosLidos: 10, colunasUsadas: ["logradouro", "numero"],
    },
    {
      chave: "lotes", nome: "Lotes (cadastro imobiliário)", orgao: "Prefeitura da Cidade do Recife · Secretaria de Planejamento",
      licenca: "ODbL", url: "https://fonte.invalid/lotes", recursos: ["r2"],
      modificadoEm: "2026-09-01", consultadoEm: "2026-10-20T16:17:16Z", registrosLidos: 10, colunasUsadas: ["DSQFL"],
    },
    {
      chave: "licenciamento", nome: "Licenciamento de obras", orgao: "Prefeitura da Cidade do Recife · Secretaria de Controle Urbano",
      licenca: "ODbL", url: "https://fonte.invalid/licenciamento", recursos: ["r3"],
      modificadoEm: "2026-09-02", consultadoEm: "2026-10-20T16:17:16Z", registrosLidos: 10, colunasUsadas: ["categoria"],
    },
    {
      chave: "itbi", nome: "ITBI 2016 a 2026", orgao: "Prefeitura da Cidade do Recife · Secretaria de Finanças",
      licenca: "ODbL", url: "https://fonte.invalid/itbi", recursos: ["r4"],
      modificadoEm: "2026-09-03", consultadoEm: "2026-10-20T16:17:16Z", registrosLidos: 10, colunasUsadas: ["valor"],
    },
  ],
};

function renderizar(elemento: React.ReactElement): TestRenderer.ReactTestRenderer {
  let arvore!: TestRenderer.ReactTestRenderer;
  act(() => {
    arvore = TestRenderer.create(React.createElement(TemaDoApp, null, elemento));
  });
  return arvore;
}

/** Todo o texto desenhado, em uma lista de trechos. */
function textosDe(arvore: TestRenderer.ReactTestRenderer): string[] {
  const saida: string[] = [];
  const andar = (n: TestRenderer.ReactTestRendererJSON | string) => {
    if (typeof n === "string") saida.push(n);
    else for (const filho of n.children ?? []) andar(filho);
  };
  const raiz = arvore.toJSON();
  for (const n of Array.isArray(raiz) ? raiz : raiz ? [raiz] : []) andar(n);
  return saida;
}

function textoDaGaveta(props: Partial<React.ComponentProps<typeof GavetaDeFonte>> & Pick<PedidoDeFonte, "fonte" | "confianca">): string[] {
  return textosDe(renderizar(React.createElement(GavetaDeFonte, { visivel: true, aoFechar: () => undefined, meta: META, ...props })));
}

/** A gaveta como o dossiê a abre hoje: fonte, confiança e o dado, sem id. */
function textoDoPedido(fonte: PedidoDeFonte["fonte"], confianca: Confianca, rotulo: string, valor: string): string[] {
  return textoDaGaveta({ fonte, confianca, dado: { rotulo, valor } });
}

type Dado = { id: string; fonte: PedidoDeFonte["fonte"]; confianca: Confianca; rotulo: string; valor: string };

/** Todos os fatos e achados oficiais que a derivação produz, na forma que o dossiê passa para a gaveta. */
function dadosOficiais(visao: VisaoDoDossie): Dado[] {
  const fatos: Dado[] = visao.cadastro.flatMap((f) =>
    f.confianca === "oficial" && f.fonte ? [{ id: f.id, fonte: f.fonte, confianca: f.confianca, rotulo: f.rotulo, valor: f.valor }] : [],
  );
  const achados: Dado[] = [visao.achados.principal, ...visao.achados.apoio].flatMap((a) =>
    a && a.confianca === "oficial" && a.fonte
      ? [{ id: a.id, fonte: a.fonte, confianca: a.confianca, rotulo: a.titulo, valor: a.medida ? `${a.medida.numero} ${a.medida.unidade}`.trim() : a.texto }]
      : [],
  );
  return [...fatos, ...achados];
}

function todosOsDadosOficiais(): Dado[] {
  const e = edificio();
  const unico = edificioUnico();
  return [
    // Aluguel com a área do anúncio: fatos do cadastro, faixa de IPTU, achados de IPTU e de obras.
    ...dadosOficiais(derivar(analise({ vinculo: confirmadoEm(e.id) }), e)),
    // Compra em prédio de tipologia única: achado "Preço × avaliação fiscal".
    ...dadosOficiais(derivar(analise({ modalidade: "compra", declarados: { preco: v(880000) }, vinculo: confirmadoEm(unico.id) }), unico)),
    // Sem área no anúncio: "Área no cadastro" é a faixa do registro, não a inferência da tipologia mais próxima.
    ...dadosOficiais(derivar(analise({ declarados: { area: v(null) }, vinculo: confirmadoEm(e.id) }), e)),
  ];
}

describe("gaveta de fonte: dado calculado x dado copiado, no texto desenhado (L2)", () => {
  const dados = todosOsDadosOficiais();
  const ids = [...new Set(dados.map((d) => d.id))];

  it("a derivação de verdade produz todos os ids das duas listas (o teste não ficou sem cobertura)", () => {
    expect(ids.slice().sort()).toEqual([...IDS_DE_DADO_COPIADO, ...IDS_DE_DADO_CALCULADO].slice().sort());
  });

  it.each(IDS_DE_DADO_CALCULADO.map((id) => [id]))("%s: faixa, mediana, moda ou contagem mostra 'Calculado pelo Vereda…' e não 'sem alteração'", (id) => {
    const dado = dados.find((d) => d.id === id);
    expect(dado).toBeDefined();
    if (!dado) return;
    const t = textoDoPedido(dado.fonte, dado.confianca, dado.rotulo, dado.valor);
    expect(t).toContain(EXPLICACAO_DO_CALCULO);
    expect(t).not.toContain(EXPLICACAO_DA_CONFIANCA.oficial);
  });

  it.each(IDS_DE_DADO_COPIADO.map((id) => [id]))("%s: valor copiado do registro mostra 'sem alteração' e não 'Calculado'", (id) => {
    const dado = dados.find((d) => d.id === id);
    expect(dado).toBeDefined();
    if (!dado) return;
    const t = textoDoPedido(dado.fonte, dado.confianca, dado.rotulo, dado.valor);
    expect(t).toContain(EXPLICACAO_DA_CONFIANCA.oficial);
    expect(t).not.toContain(EXPLICACAO_DO_CALCULO);
  });

  it("os dois textos são os pedidos, palavra por palavra", () => {
    expect(EXPLICACAO_DO_CALCULO).toBe("Calculado pelo Vereda a partir de uma base pública da Prefeitura (mediana, faixa ou contagem por prédio).");
    expect(EXPLICACAO_DA_CONFIANCA.oficial).toBe("Vem de uma base pública da Prefeitura, sem alteração.");
  });

  it("o id, quando a tela o passa, manda sobre a fonte", () => {
    // Fonte "lotes" sozinha é cópia; com o id de um dado calculado, vira cálculo, e o contrário também.
    expect(textoDaGaveta({ fonte: "lotes", confianca: "oficial" })).toContain(EXPLICACAO_DA_CONFIANCA.oficial);
    expect(textoDaGaveta({ fonte: "lotes", confianca: "oficial", idDoDado: "cadastro-ano" })).toContain(EXPLICACAO_DO_CALCULO);
    expect(textoDaGaveta({ fonte: "iptu_2026", confianca: "oficial" })).toContain(EXPLICACAO_DO_CALCULO);
    expect(textoDaGaveta({ fonte: "iptu_2026", confianca: "oficial", idDoDado: "cadastro-nome" })).toContain(EXPLICACAO_DA_CONFIANCA.oficial);
  });

  it("outras confianças não ganham o texto de cálculo, nem vindas de base da Prefeitura", () => {
    for (const confianca of ["declarado", "inferencia", "nao_sabemos"] as const) {
      const t = textoDaGaveta({ fonte: "iptu_2026", confianca, idDoDado: "iptu-faixa" });
      expect(t).not.toContain(EXPLICACAO_DO_CALCULO);
      expect(t).not.toContain(EXPLICACAO_DA_CONFIANCA.oficial);
    }
    expect(textoDaGaveta({ fonte: "anuncio", confianca: "declarado" })).not.toContain(EXPLICACAO_DO_CALCULO);
  });
});
