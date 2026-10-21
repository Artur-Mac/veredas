import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { entradaDaRua } from "../src/componentes/dossie-v1/cadastro";
import { descreverFonte, explicacaoDaConfianca, EXPLICACAO_DO_CALCULO_DA_RUA, EXPLICACAO_DO_CALCULO_DO_IBGE } from "../src/componentes/fonte/textos";
import {
  esquemaAnaliseV2,
  esquemaEdificio,
  type AnaliseV2,
  type Edificio,
  type FonteDaRua,
  type RuaDoBairro,
  type VisaoDaRua,
} from "../src/dados/contratos";
import { derivarDossie } from "../src/dados/dossie/derivar";
import { analisarRua, dataDaFonteDaRua, type EntradaDaRua } from "../src/dados/dossie/rua";
import { edificiosDoBairro, indiceDoBairro, META } from "../src/dados/recife/indice";
import { TemaDoApp } from "../src/tema/Tema";

// Seção "A rua" do dossiê (v1.1, revisão 2.6 da ordem): derivação pura com dados SINTÉTICOS (ruas, setores e números
// inventados, marcados como tal), o prédio real de Casa Forte do teste de ponta a ponta e a tela do dossiê.

type Globais = {
  __router: { push: jest.Mock; replace: jest.Mock; navigate: jest.Mock; back: jest.Mock; canGoBack: jest.Mock; setParams: jest.Mock };
  __params: { id?: string };
  __analises: unknown;
};
const G = globalThis as unknown as Globais;

jest.mock("expo-router", () => {
  const atual = () => (globalThis as unknown as Globais).__router;
  return {
    router: {
      push: (...args: unknown[]) => atual().push(...args),
      replace: (...args: unknown[]) => atual().replace(...args),
      navigate: (...args: unknown[]) => atual().navigate(...args),
      back: () => atual().back(),
      canGoBack: () => atual().canGoBack(),
      setParams: (...args: unknown[]) => atual().setParams(...args),
    },
    useLocalSearchParams: () => (globalThis as unknown as Globais).__params,
  };
});
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock("../src/estado/Analises", () => ({ useAnalises: () => (globalThis as unknown as Globais).__analises }));
jest.mock("../src/componentes/descarte/GavetaDeDescarte", () => ({ GavetaDeDescarte: () => null }));

// ——— Construtores sintéticos ————————————————————————————————————————————————————————

const INSTANTE = "2026-10-20T12:00:00.000Z";
const AGORA = new Date(INSTANTE);
const v = (valor: number | null) => ({ valor, origem: "texto" as const, aConfirmar: false });

const BASE: AnaliseV2 = {
  versao: 2, id: "analise-rua", criadaEm: INSTANTE, atualizadaEm: INSTANTE,
  nome: "Apartamento sintético da rua", modalidade: "aluguel", tipologia: "apartamento",
  url: "https://anuncio.invalid/sintetico-rua", bairroTexto: "Casa Forte", bairro: "casa-forte",
  logradouro: null, numero: null, nomeEdificio: null, extracao: null,
  declarados: {
    preco: v(4500), condominio: v(1190), iptu: { ...v(288), periodo: "mes" }, seguroIncendio: v(42), taxaServico: v(null), outros: v(null),
    area: v(98), quartos: v(3), suites: v(null), banheiros: v(2), vagas: v(1), andar: v(7),
  },
  vinculo: { estado: "pendente" },
  visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
  salva: true, descarte: null,
};

function analise(mudancas: Partial<AnaliseV2> = {}): AnaliseV2 {
  return esquemaAnaliseV2.parse({ ...BASE, ...mudancas });
}

const confirmada = (e: Edificio): Partial<AnaliseV2> => ({
  vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl, confirmadoEm: INSTANTE, indiceGeradoEm: "teste" },
});

/** Edifício sintético (rua e números inventados), no centro [-34.9, -8.03]. */
function edificio(rua: Edificio["rua"] | null = [0, 2, 5, 7, null, 0, null, 3, 1]): Edificio {
  return esquemaEdificio.parse({
    id: "99001-100", bairro: "casa-forte", logradouro: "RUA SINTETICA ALFA", numero: "100", dsqfl: null, nome: null,
    centro: [-34.9, -8.03], poligono: null, unidades: 12, tipologias: [{ area: 98, unidades: 12, iptuAnualMediano: 3936 }],
    anoConstrucao: 2010, pavimentos: 12, ate4Pavimentos: false, padrao: "Superior", iptuAnual: { n: 12, p25: 3800, mediana: 3936, p75: 4100 },
    itbi: null, obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
    ...(rua ? { rua } : {}),
  });
}

/** 0,00045° de longitude ≈ 50 m perto do Recife. */
const RUA_SINTETICA: RuaDoBairro = {
  setores: [{ codigo: "261160699999901", areaDePonderacao: "2611606999", domicilios: 200, onibus: 50, calcada: 180, obstaculo: null, rampa: 20, arvores: 0 }],
  areasDePonderacao: [{ codigo: "2611606999", domicilios: 10000, alugados: 3130, bairros: ["gracas", "espinheiro"] }],
  luse: [
    { centro: [-34.90045, -8.03], vigente: true, ultimaEntrada: "2025-02" },
    { centro: [-34.9009, -8.03], vigente: false, ultimaEntrada: "2019-05" },
    { centro: [-34.904, -8.03], vigente: true, ultimaEntrada: "2025-03" },
  ],
  iluminacaoDesativada: [[-34.9, -8.0307]],
  logradouros: {
    "99001": {
      ruaCasada: true,
      coleta: [{ turno: "manhã", intervalo: "7h30 às 12h", frequencia: "ter, qui e sáb" }],
      defesaCivil: { atendimentos: 3, grafia: "Rua Sintetica Alfa", porAno: [[2019, 1], [2023, 2]], ocorrencias: [["danos_ou_risco", 2], ["nao_informada", 1]] },
    },
  },
};

function fonte(chave: FonteDaRua["chave"], mudancas: Partial<FonteDaRua> = {}): FonteDaRua {
  const ibge = chave === "cnefe" || chave === "censo_entorno" || chave === "censo_amostra";
  return {
    chave, nome: `Base sintética ${chave}`, orgao: ibge ? "IBGE · Censo Demográfico 2022" : "Prefeitura da Cidade do Recife · Órgão sintético",
    licenca: ibge ? "Citar o IBGE" : "ODbL", url: "https://dados.invalid/base", recursos: ["r"], modificadoEm: "2026-10-19",
    consultadoEm: "2026-10-20T16:17:16Z", registrosLidos: 10, colunasUsadas: ["a"],
    periodo: ibge ? { de: "2022-01-01", ate: "2022-12-31" } : null, ...mudancas,
  };
}

const FONTES: FonteDaRua[] = [
  fonte("licenciamento_ambiental"),
  fonte("central_156", { periodo: { de: "2025-01-31", ate: "2026-01-30" } }),
  fonte("iluminacao", { modificadoEm: "2026-03-04" }),
  fonte("coleta", { modificadoEm: "2026-03-06" }),
  fonte("sinistros", { periodo: { de: "2022-01-01", ate: "2024-12-31" } }),
  fonte("defesa_civil", { periodo: { de: "2014-01-01", ate: "2024-12-31" } }),
  fonte("cnefe"), fonte("censo_entorno"), fonte("censo_amostra"),
];
const ENTRADA: EntradaDaRua = { bairro: RUA_SINTETICA, fontes: FONTES };

const fatos = (visao: VisaoDaRua) => visao.grupos.flatMap((g) => g.fatos);
const fato = (visao: VisaoDaRua, id: string) => {
  const achado = fatos(visao).find((f) => f.id === id);
  if (!achado) throw new Error(`sem o fato ${id}`);
  return achado;
};

function analisar(a: AnaliseV2, e: Edificio | null, entrada: EntradaDaRua | null = ENTRADA) {
  const r = analisarRua(a, e, entrada);
  if (!r) throw new Error("analisarRua devolveu null");
  return r;
}

const PALAVRAS_PROIBIDAS = [/perigos/i, /vale a pena/i, /\bcaro\b/i, /\bcara\b/i, /barat/i, /caix[ãa]o/i, /ótim|\botim/i, /\bruim\b/i, /arriscad/i];
function textosDaVisao(visao: VisaoDaRua): string[] {
  return [
    ...visao.grupos.flatMap((g) => [g.titulo, g.nota ?? "", ...g.fatos.flatMap((f) => [f.rotulo, f.valor, f.detalhe ?? "", f.data])]),
    ...(visao.defesaCivil ? [visao.defesaCivil.rua, visao.defesaCivil.anos] : []),
  ];
}

// ——— Derivação ————————————————————————————————————————————————————————————————————

describe("A rua: cada fato com fonte e data", () => {
  const e = edificio();
  const { visao } = analisar(analise(confirmada(e)), e);

  it("todos os fatos dizem a fonte e a data (ou o período) que vão para a tela", () => {
    expect(fatos(visao).length).toBeGreaterThanOrEqual(12);
    for (const f of fatos(visao)) {
      expect({ id: f.id, data: f.data.length > 3, fonte: f.fonte.length > 0 }).toEqual({ id: f.id, data: true, fonte: true });
    }
    expect(fato(visao, "rua-luse").data).toBe("base de 19/10/2026");
    expect(fato(visao, "rua-156-lampada").data).toBe("31/01/2025 a 30/01/2026");
    expect(fato(visao, "rua-sinistros").data).toBe("2022 a 2024");
    expect(fato(visao, "rua-defesa-civil").data).toBe("2014 a 2024");
    expect(fato(visao, "rua-censo-onibus").data).toBe("Censo 2022");
    expect(fato(visao, "rua-alugados").data).toBe("Censo 2022");
    expect(fato(visao, "rua-coleta").data).toBe("base de 06/03/2026");
  });

  it("licença de som: só as vigentes a até 150 m contam; a expirada é dita à parte", () => {
    const luse = fato(visao, "rua-luse");
    expect(luse).toMatchObject({ valor: "1", fonte: "licenciamento_ambiental", confianca: "oficial" });
    expect(luse.detalhe).toContain("o mais perto a 50 m");
    expect(luse.detalhe).toContain("1 local com licença expirada");
  });

  it("156: contagem por categoria, mediana de dias dos atendidos; zero é zero e sem atendido não inventa prazo", () => {
    expect(fato(visao, "rua-156-drenagem")).toMatchObject({ valor: "2", detalhe: "Mediana de 5 dias até o atendimento." });
    expect(fato(visao, "rua-156-lampada")).toMatchObject({ valor: "7", detalhe: "Nenhum marcado como atendido até a publicação." });
    expect(fato(visao, "rua-156-entulho")).toMatchObject({ valor: "0", detalhe: "Nenhum pedido a até 150 m." });
  });

  it("iluminação, trânsito e coleta", () => {
    expect(fato(visao, "rua-luz")).toMatchObject({ valor: "1" });
    expect(fato(visao, "rua-luz").detalhe).toContain("80 m");
    expect(fato(visao, "rua-sinistros")).toMatchObject({ valor: "3", detalhe: "1 com pedestre atropelado." });
    expect(fato(visao, "rua-coleta")).toMatchObject({ valor: "Manhã", detalhe: "7h30 às 12h · ter, qui e sáb", confianca: "oficial" });
  });

  it("Censo: percentual dos domicílios do setor com o denominador; valor suprimido vira 'A confirmar'", () => {
    expect(fato(visao, "rua-censo-onibus")).toMatchObject({ valor: "25%", detalhe: "50 de 200 domicílios do setor", fonte: "censo_entorno" });
    expect(fato(visao, "rua-censo-arvores")).toMatchObject({ valor: "0%" });
    expect(fato(visao, "rua-censo-obstaculo")).toMatchObject({ valor: "A confirmar", confianca: "nao_sabemos" });
    const alugados = fato(visao, "rua-alugados");
    expect(alugados).toMatchObject({ valor: "31%", fonte: "censo_amostra" });
    expect(alugados.detalhe).toContain("Cerca de 1 em cada 3 dos 10.000 domicílios da área de ponderação 999 do Censo (Graças e Espinheiro)");
    // Com quatro bairros (o máximo guardado), a área pode ter outros: a lista fecha com "e vizinhos", sem dois "e".
    const quatro: RuaDoBairro = { ...RUA_SINTETICA, areasDePonderacao: [{ ...RUA_SINTETICA.areasDePonderacao[0]!, bairros: ["parnamirim", "monteiro", "casa-forte", "poco"] }] };
    const r = analisar(analise(confirmada(e)), e, { bairro: quatro, fontes: FONTES });
    expect(fato(r.visao, "rua-alugados").detalhe).toContain("(Parnamirim, Monteiro, Casa Forte, Poço da Panela e vizinhos)");
  });

  it("nenhum texto da seção tem palavra de julgamento, nem 'seguro'", () => {
    for (const texto of textosDaVisao(visao)) {
      expect({ texto, proibidas: PALAVRAS_PROIBIDAS.filter((p) => p.test(texto)).map(String) }).toEqual({ texto, proibidas: [] });
      expect(/seguro/i.test(texto)).toBe(false);
    }
  });
});

describe("A rua: Defesa Civil só com a confirmação da pessoa", () => {
  const e = edificio();

  it("sem resposta: a contagem da rua, o aviso de que o número não é publicado e nenhum fato sobre o prédio", () => {
    const { visao, perguntas } = analisar(analise(confirmada(e)), e);
    expect(fato(visao, "rua-defesa-civil").valor).toBe("3");
    expect(fato(visao, "rua-defesa-civil").detalhe).toContain("não dá para saber se foi este prédio");
    expect(fatos(visao).some((f) => f.id === "rua-defesa-civil-predio")).toBe(false);
    expect(visao.defesaCivil).toEqual({ rua: "Rua Sintetica Alfa", atendimentos: 3, anos: "2019 e 2023", resposta: null });
    expect(perguntas.find((p) => p.id === "rua-defesa-civil")).toMatchObject({ prioridade: "documentos", pista: "3 atendimentos na rua, 2014 a 2024" });
  });

  it("'Foi neste prédio': o fato aparece como declarado por você, com a data da resposta", () => {
    const a = analise({ ...confirmada(e), confirmacoesDaRua: { defesaCivil: { resposta: "neste_predio", em: "2026-10-21T10:00:00.000Z" } } });
    const { visao, perguntas } = analisar(a, e);
    expect(fato(visao, "rua-defesa-civil-predio")).toMatchObject({ valor: "Confirmado por você", fonte: "voce", confianca: "declarado", data: "respondido em 21/10/2026" });
    expect(visao.defesaCivil?.resposta).toBe("neste_predio");
    expect(perguntas.some((p) => p.id === "rua-defesa-civil")).toBe(true);
  });

  it("'Não foi aqui': a pergunta sai do roteiro e nenhum fato é atribuído ao prédio", () => {
    const a = analise({ ...confirmada(e), confirmacoesDaRua: { defesaCivil: { resposta: "outro_endereco", em: INSTANTE } } });
    const { visao, perguntas } = analisar(a, e);
    expect(fatos(visao).some((f) => f.id === "rua-defesa-civil-predio")).toBe(false);
    expect(perguntas.some((p) => p.id === "rua-defesa-civil")).toBe(false);
    expect(visao.defesaCivil?.resposta).toBe("outro_endereco");
  });

  it("rua sem atendimento: zero, sem bloco e sem pergunta; rua não casada com o CNEFE: 'A confirmar'", () => {
    const semAtendimento: RuaDoBairro = {
      ...RUA_SINTETICA,
      logradouros: { "99001": { ruaCasada: true, coleta: [], defesaCivil: { atendimentos: 0, grafia: null, porAno: [], ocorrencias: [] } } },
    };
    const r1 = analisar(analise(confirmada(e)), e, { bairro: semAtendimento, fontes: FONTES });
    expect(fato(r1.visao, "rua-defesa-civil").valor).toBe("0");
    expect(r1.visao.defesaCivil).toBeNull();
    expect(fato(r1.visao, "rua-coleta")).toMatchObject({ valor: "Sem roteiro", confianca: "nao_sabemos" });
    expect(r1.perguntas.map((p) => p.id)).not.toContain("rua-coleta");

    const naoCasada: RuaDoBairro = { ...RUA_SINTETICA, logradouros: { "99001": { ruaCasada: false, coleta: [], defesaCivil: null } } };
    const r2 = analisar(analise(confirmada(e)), e, { bairro: naoCasada, fontes: FONTES });
    expect(fato(r2.visao, "rua-defesa-civil")).toMatchObject({ valor: "A confirmar", confianca: "nao_sabemos" });
    expect(fato(r2.visao, "rua-coleta")).toMatchObject({ valor: "A confirmar", confianca: "nao_sabemos" });
    expect(r2.perguntas.map((p) => p.id)).not.toContain("rua-defesa-civil");
  });
});

describe("A rua: perguntas novas no roteiro de visita", () => {
  it("som, drenagem, iluminação, travessia, coleta e Defesa Civil entram quando o dado pede", () => {
    const e = edificio();
    const { perguntas } = analisar(analise(confirmada(e)), e);
    expect(perguntas.map((p) => p.id)).toEqual(["rua-som", "rua-drenagem", "rua-iluminacao", "rua-travessia", "rua-coleta", "rua-defesa-civil"]);
    for (const p of perguntas) {
      expect(p.origem).toBe("achado");
      expect(p.textoParaMensagem.length).toBeGreaterThan(20);
      for (const t of [p.titulo, p.pista, p.textoParaMensagem]) expect(PALAVRAS_PROIBIDAS.some((r) => r.test(t)) || /seguro/i.test(t)).toBe(false);
    }
  });

  it("sem sinal na rua, nenhuma pergunta da rua", () => {
    const quieto: RuaDoBairro = {
      ...RUA_SINTETICA, luse: [], iluminacaoDesativada: [],
      logradouros: { "99001": { ruaCasada: true, coleta: [], defesaCivil: { atendimentos: 0, grafia: null, porAno: [], ocorrencias: [] } } },
    };
    const e = edificio([0, 0, null, 2, 1, 0, null, 0, 0]);
    expect(analisar(analise(confirmada(e)), e, { bairro: quieto, fontes: FONTES }).perguntas).toEqual([]);
  });

  it("derivarDossie põe as perguntas da rua antes das padrão e a visão ganha `rua`; sem o argumento, nada muda", () => {
    const e = edificio();
    const a = analise(confirmada(e));
    const com = derivarDossie(a, e, null, [], [], AGORA, null, ENTRADA);
    const ids = com.perguntas.map((p) => p.id);
    expect(ids.indexOf("rua-som")).toBeLessThan(ids.indexOf("padrao-documentos"));
    expect(com.rua?.grupos.length).toBeGreaterThan(5);
    const sem = derivarDossie(a, e, null, [], [], AGORA, null);
    expect("rua" in sem).toBe(false);
    expect(sem.perguntas.some((p) => p.id.startsWith("rua-"))).toBe(false);
    // Sem prédio confirmado, a seção não existe (null), mesmo com a camada.
    expect(derivarDossie(analise(), e, null, [], [], AGORA, null, ENTRADA).rua).toBeNull();
  });

  it("edifício sem a camada (índice da v1.0) ou sem a entrada: sem seção", () => {
    const e = edificio(null);
    expect(analisarRua(analise(confirmada(e)), e, ENTRADA)).toBeNull();
    expect(analisarRua(analise(confirmada(edificio())), edificio(), null)).toBeNull();
  });
});

describe("A rua: datas e fontes na gaveta", () => {
  it("período de anos inteiros, de datas e a base sem período", () => {
    expect(dataDaFonteDaRua(fonte("sinistros", { periodo: { de: "2024-01-01", ate: "2024-12-31" } }))).toBe("2024");
    expect(dataDaFonteDaRua(fonte("central_156", { periodo: { de: "2025-01-31", ate: "2026-01-30" } }))).toBe("31/01/2025 a 30/01/2026");
    expect(dataDaFonteDaRua(fonte("coleta", { modificadoEm: null }))).toBe("data não informada");
    expect(dataDaFonteDaRua(undefined)).toBe("data não informada");
  });

  it("a gaveta descreve a base da Prefeitura com a ODbL e a do IBGE com a citação", () => {
    const meta = { fontes: [], fontesDaRua: FONTES };
    expect(descreverFonte("central_156", meta)).toMatchObject({ tipo: "base", titulo: "Central 156 da Emlurb · Prefeitura do Recife · ODbL", licenca: "ODbL", modificadoEm: "19/10/2026" });
    expect(descreverFonte("censo_entorno", meta)).toMatchObject({ titulo: "Entorno do Censo · IBGE", licenca: "Sem licença nomeada; o IBGE pede a citação da fonte" });
    expect(descreverFonte("defesa_civil", { fontes: [] })).toBeNull();
    expect(explicacaoDaConfianca("oficial", null, "central_156")).toBe(EXPLICACAO_DO_CALCULO_DA_RUA);
    expect(explicacaoDaConfianca("oficial", null, "censo_amostra")).toBe(EXPLICACAO_DO_CALCULO_DO_IBGE);
  });
});

// ——— Prédio real de Casa Forte (o do teste de ponta a ponta) ————————————————————————————————

const ENCANAMENTO = edificiosDoBairro("casa-forte").find((e) => e.logradouro === "EST DO ENCANAMENTO" && e.numero === "719");

describe("A rua no prédio real Estrada do Encanamento, 719 (Casa Forte)", () => {
  it("o índice e o meta.json têm a camada; a seção sai com fonte e data em todo fato", () => {
    expect(ENCANAMENTO).toBeDefined();
    if (!ENCANAMENTO) return;
    const entrada = entradaDaRua(indiceDoBairro("casa-forte"));
    expect(entrada).not.toBeNull();
    const visao = derivarDossie(analise(confirmada(ENCANAMENTO)), ENCANAMENTO, null, [], [], AGORA, null, entrada);
    const rua = visao.rua;
    expect(rua).toBeTruthy();
    if (!rua) return;
    const p156 = META.fontesDaRua?.find((f) => f.chave === "central_156")?.periodo;
    expect(p156).toBeTruthy();
    for (const f of fatos(rua)) expect({ id: f.id, data: f.data }).not.toEqual({ id: f.id, data: "data não informada" });
    expect(fato(rua, "rua-156-lampada").data).toBe(dataDaFonteDaRua(META.fontesDaRua?.find((f) => f.chave === "central_156")));
    expect(fato(rua, "rua-censo-onibus").valor).toMatch(/^\d{1,3}%$/);
    expect(fato(rua, "rua-alugados").valor).toBe("17%");
    expect(rua.defesaCivil?.atendimentos).toBeGreaterThan(0);
    for (const texto of textosDaVisao(rua)) expect(PALAVRAS_PROIBIDAS.some((p) => p.test(texto))).toBe(false);
  });
});

// ——— Tela do dossiê ————————————————————————————————————————————————————————————————

function textosDe(no: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string[] {
  const saida: string[] = [];
  const andar = (n: TestRenderer.ReactTestRendererJSON | string) => {
    if (typeof n === "string") saida.push(n);
    else for (const filho of n.children ?? []) andar(filho);
  };
  for (const n of Array.isArray(no) ? no : no ? [no] : []) andar(n);
  return saida;
}

function abrirTela(): TestRenderer.ReactTestRenderer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Tela = require("../src/app/(abas)/dossie").default as React.ComponentType;
  let arvore!: TestRenderer.ReactTestRenderer;
  act(() => {
    arvore = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(Tela)));
  });
  return arvore;
}

function tocar(arvore: TestRenderer.ReactTestRenderer, rotulo: string | RegExp) {
  const confere = (t: unknown) => typeof t === "string" && (typeof rotulo === "string" ? t === rotulo : rotulo.test(t));
  const no: ReactTestInstance | undefined = arvore.root.findAll((n) => typeof n.props.onPress === "function" && (confere(n.props.accessibilityLabel) || confere(n.props.rotulo)))[0];
  if (!no) throw new Error(`Nenhum botão ${String(rotulo)}`);
  act(() => {
    (no.props.onPress as () => void)();
  });
}

describe("A rua na tela do dossiê (prédio real de Casa Forte)", () => {
  let salvar: jest.Mock<(a: AnaliseV2) => Promise<void>>;
  beforeEach(() => {
    G.__router = { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false), setParams: jest.fn() };
    G.__params = {};
    salvar = jest.fn(async () => undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function preparar(a: AnaliseV2) {
    G.__analises = { lista: [a], ativa: a.id, analiseAtiva: a, pronto: true, erro: "", definirAtiva: jest.fn(async () => undefined), salvar, remover: jest.fn(async () => undefined) };
  }

  it("a aba Entorno mostra 'A rua' com cada linha, a fonte e a data; o toque abre a gaveta da base", () => {
    if (!ENCANAMENTO) throw new Error("prédio de teste ausente");
    preparar(analise(confirmada(ENCANAMENTO)));
    const arvore = abrirTela();
    tocar(arvore, "Entorno");
    const t = textosDe(arvore.toJSON());
    expect(t).toContain("A rua");
    expect(t).toContain("O que os registros dizem da rua");
    expect(t).toContain("Pedidos de lâmpada apagada");
    expect(t).toContain("Calçada e entorno da quadra");
    const periodo = dataDaFonteDaRua(META.fontesDaRua?.find((f) => f.chave === "central_156"));
    expect(t).toContain(`registro oficial · Central 156 da Emlurb · ${periodo}`);
    expect(t).toContain("registro oficial · Entorno do Censo · Censo 2022");

    tocar(arvore, /^Pedidos de lâmpada apagada: /);
    const depois = textosDe(arvore.toJSON());
    expect(depois).toContain("Central 156 da Emlurb · Prefeitura do Recife · ODbL");
    expect(depois).toContain(EXPLICACAO_DO_CALCULO_DA_RUA);
  });

  it("'Foi neste prédio' grava a resposta na análise; sem ela, nada é atribuído ao prédio", async () => {
    if (!ENCANAMENTO) throw new Error("prédio de teste ausente");
    preparar(analise(confirmada(ENCANAMENTO)));
    const arvore = abrirTela();
    tocar(arvore, "Entorno");
    expect(textosDe(arvore.toJSON())).not.toContain("Atendimento neste prédio");
    await act(async () => {
      tocar(arvore, "A Defesa Civil atendeu este prédio");
    });
    expect(salvar).toHaveBeenCalledTimes(1);
    const gravada = salvar.mock.calls[0]?.[0];
    expect(gravada?.confirmacoesDaRua?.defesaCivil?.resposta).toBe("neste_predio");
    expect(() => esquemaAnaliseV2.parse(gravada)).not.toThrow();
  });
});
