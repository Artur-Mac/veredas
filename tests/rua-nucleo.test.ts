import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";

// Núcleo puro das camadas "A rua" (scripts/dados/rua/nucleo.mjs, v1.1): geocodificador local pelo CNEFE, deduplicação
// das licenças de som (LUSE), leitura da Defesa Civil com o número mascarado e o localizador de setor. O módulo não
// importa nada: o teste lê o arquivo, tira os `export` e avalia as funções, como tests/indice-recife.test.ts faz com o
// script do índice. Todos os endereços, lotes e setores daqui são SINTÉTICOS (nenhum é do Recife de verdade).

type Ponto = { lon: number; lat: number };
type Endereco = { bairro: string; tipo: string; titulo: string; nome: string; numero: number | null; lon: number; lat: number; setor: string | null; especie: number | null };
type Rua = { id: number; bairro: string; classe: string | null; completa: string; semTitulo: string; centro: Ponto };
type Geo = { ruas: Rua[] };
type Geocodificado = { lon: number; lat: number; setor: string | null; via: string; precisao: string } | null;
type LocalLuse = { lugar: string; centro: [number, number]; vigente: boolean; ultimaEntrada: string | null; processos: number };

type Nucleo = {
  COLUNAS_DO_CNEFE: string[];
  analisarLogradouro: (texto: string, tipo?: string | null) => { classe: string | null; completa: string; semTitulo: string };
  nomesCompativeis: (a: string, b: string) => boolean;
  distanciaDeEdicao: (a: string, b: string, teto?: number) => number;
  lerEnderecoDoCnefe: (colunas: string[], indices: Record<string, number>) => Endereco | null;
  criarGeocodificador: (enderecos: Endereco[]) => Geo;
  acharRua: (geo: Geo, q: { logradouro: string; bairro?: string | null; perto?: Ponto | null }) => { rua: Rua | null; via: string | null };
  geocodificar: (geo: Geo, q: { logradouro: string; numero: number | string | null; bairro?: string | null; perto?: Ponto | null }) => Geocodificado;
  geocodificarCruzamento: (geo: Geo, q: { logradouro: string; cruzamento: string; bairro?: string | null }) => Geocodificado;
  haversineM: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  situacaoDaLuse: (historico: string | null) => "vigente" | "expirada" | null;
  deduplicarLuse: (registros: Record<string, unknown>[], centroPorDsqfl?: Map<string, [number, number]>) => { locais: LocalLuse[]; linhasComLuse: number; semPosicao: number };
  lerAtendimentoDaDefesaCivil: (r: Record<string, unknown>) => { ano: number | null; bairro: string; rua: string; ocorrencia: string } | null;
  categoriaDaOcorrencia: (texto: string) => string;
  categoriaDoPedido: (grupo: string, servico: string) => string | null;
  diasAteAtender: (situacao: string, demanda: string, ultima: string) => number | null;
  lerSinistro: (r: Record<string, unknown>) => { comVitima: boolean; atropelamento: boolean; numero: number | null; cruzamento: string | null } | null;
  lerRoteiroDeColeta: (r: Record<string, unknown>) => { turno: string | null; intervalo: string | null; frequencia: string | null };
  lerSetorDoEntorno: (linha: Record<string, string>) => Record<string, number | string | null>;
  inicioDaJanela: (fim: string, meses: number) => string;
  criarLocalizadorDeSetor: (setores: { codigo: string; caixa: number[]; aneis: number[][][] }[]) => { achar: (lon: number, lat: number) => string | null };
};

const NUCLEO = join(__dirname, "..", "scripts", "dados", "rua", "nucleo.mjs");
const codigo = readFileSync(NUCLEO, "utf-8");

const n = (() => {
  const nomes = [...codigo.matchAll(/^export (?:function\*?|const) (\w+)/gm)].map((m) => m[1]);
  return new Function(`${codigo.replace(/^export /gm, "")}\nreturn { ${nomes.join(", ")} };`)() as Nucleo;
})();

// ——— CNEFE sintético ——————————————————————————————————————————————————————————————

/** Um endereço sintético no formato que `lerEnderecoDoCnefe` devolve. */
function end(bairro: string, tipo: string, titulo: string, nome: string, numero: number | null, lon: number, lat: number, setor = "261160605000001"): Endereco {
  return { bairro, tipo, titulo, nome, numero, lon, lat, setor, especie: 1 };
}

// Metros por grau perto do Recife: ~111 km de latitude; 0,0001° ≈ 11 m.
const ENDERECOS: Endereco[] = [
  // Bairro "alfa sintetico": uma rua com títulos e números dos dois lados.
  end("alfa sintetico", "RUA", "DOUTOR", "SAMUEL SINTETICO", 10, -34.9, -8.03, "261160605000010"),
  end("alfa sintetico", "RUA", "DOUTOR", "SAMUEL SINTETICO", 10, -34.9002, -8.03, "261160605000010"),
  end("alfa sintetico", "RUA", "DOUTOR", "SAMUEL SINTETICO", 10, -34.9001, -8.03, "261160605000011"),
  end("alfa sintetico", "RUA", "DOUTOR", "SAMUEL SINTETICO", 40, -34.9003, -8.03),
  end("alfa sintetico", "RUA", "DOUTOR", "SAMUEL SINTETICO", 100, -34.901, -8.03),
  end("alfa sintetico", "RUA", "DOUTOR", "SAMUEL SINTETICO", 300, -34.903, -8.03),
  end("alfa sintetico", "RUA", "DOUTOR", "SAMUEL SINTETICO", 15, -34.9, -8.0302),
  // A avenida "Dezessete de Agosto Sintética" e uma rua de mesmo nome no mesmo bairro: a classe desempata.
  end("alfa sintetico", "AVENIDA", "", "DEZESSETE DE AGOSTO SINTETICA", 500, -34.905, -8.031),
  end("alfa sintetico", "RUA", "", "DEZESSETE DE AGOSTO SINTETICA", 20, -34.95, -8.05),
  // Rua homônima em dois bairros (a 3 km de distância).
  end("alfa sintetico", "RUA", "", "AURORA SINTETICA", 1, -34.9, -8.032),
  end("beta sintetico", "RUA", "", "AURORA SINTETICA", 1, -34.873, -8.032),
  // Avenida longa partida em dois bairros no CNEFE: os números altos ficam no trecho do bairro vizinho.
  end("alfa sintetico", "AVENIDA", "", "LONGA SINTETICA", 2, -34.91, -8.04),
  end("alfa sintetico", "AVENIDA", "", "LONGA SINTETICA", 400, -34.913, -8.04),
  end("beta sintetico", "AVENIDA", "", "LONGA SINTETICA", 1800, -34.925, -8.04),
  // Conselheiro Sintético, para o erro de digitação ("Consenheiro").
  end("alfa sintetico", "AVENIDA", "CONSELHEIRO", "AGUIAR SINTETICO", 50, -34.92, -8.02),
  // Duas ruas que se cruzam: pontos a ~10 m um do outro na esquina.
  end("alfa sintetico", "RUA", "", "NORTE SINTETICA", 2, -34.93, -8.0),
  end("alfa sintetico", "RUA", "", "NORTE SINTETICA", 80, -34.9307, -8.0),
  end("alfa sintetico", "RUA", "", "LESTE SINTETICA", 2, -34.9301, -8.0001),
  end("alfa sintetico", "RUA", "", "LESTE SINTETICA", 90, -34.9301, -8.0009),
  // Uma rua longe de tudo, para o cruzamento impossível.
  end("alfa sintetico", "RUA", "", "ISOLADA SINTETICA", 2, -34.99, -8.1),
];

const geo = n.criarGeocodificador(ENDERECOS);
const distancia = (a: { lon: number; lat: number }, b: { lon: number; lat: number }) => n.haversineM(a.lat, a.lon, b.lat, b.lon);

describe("nomes de rua", () => {
  it("tipo de via, abreviações de título, números por extenso e partículas", () => {
    expect(n.analisarLogradouro("AV DEZESSETE DE AGOSTO")).toEqual({ classe: "avenida", completa: "dezessete agosto", semTitulo: "dezessete agosto" });
    expect(n.analisarLogradouro("AVENIDA 17 DE AGOSTO").completa).toBe("dezessete agosto");
    expect(n.analisarLogradouro("Rua Quarenta e Oito").completa).toBe(n.analisarLogradouro("RUA 48").completa);
    expect(n.analisarLogradouro("EST DO ENCANAMENTO")).toMatchObject({ classe: "estrada", completa: "encanamento" });
    expect(n.analisarLogradouro("RUA DR SAMUEL LINS")).toEqual({ classe: "rua", completa: "doutor samuel lins", semTitulo: "samuel lins" });
    // O título que vem em campo separado, como no CNEFE, dá a mesma chave.
    expect(n.analisarLogradouro("DOUTOR SAMUEL LINS", "RUA").completa).toBe("doutor samuel lins");
    expect(n.analisarLogradouro("AV   Sul Gov  Cid Sampaio").completa).toBe("sul governador cid sampaio");
    // Nunca fica vazio: "Rua do Marquês" continua "marques".
    expect(n.analisarLogradouro("RUA DO MARQUES").semTitulo).toBe("marques");
  });

  it("nomes compatíveis: prefixo de 2 palavras ou fim do outro; igualdade e uma palavra curta não contam", () => {
    expect(n.nomesCompativeis("beira rio", "beira rio governador eduardo campos")).toBe(true);
    expect(n.nomesCompativeis("rondon", "candido rondon")).toBe(true);
    expect(n.nomesCompativeis("silva", "jose silva")).toBe(false);
    expect(n.nomesCompativeis("beira rio", "beira rio")).toBe(false);
    expect(n.nomesCompativeis("rio", "rio branco")).toBe(false);
  });

  it("distância de edição com teto", () => {
    expect(n.distanciaDeEdicao("consenheiro aguiar", "conselheiro aguiar")).toBe(1);
    expect(n.distanciaDeEdicao("abc", "xyz", 1)).toBe(2);
  });
});

describe("geocodificador local pelo CNEFE", () => {
  it("rua e número existentes: a mediana das coordenadas do número e a moda do setor", () => {
    const g = n.geocodificar(geo, { logradouro: "RUA DR SAMUEL SINTETICO", numero: "10", bairro: "Alfa Sintetico" });
    expect(g).toMatchObject({ lon: -34.9001, lat: -8.03, setor: "261160605000010", via: "nome", precisao: "numero" });
  });

  it("número ausente: o vizinho do mesmo lado a até 30, nunca o do outro lado", () => {
    const g = n.geocodificar(geo, { logradouro: "Rua Doutor Samuel Sintetico", numero: 38, bairro: "alfa sintetico" });
    expect(g).toMatchObject({ precisao: "vizinho", lon: -34.9003 });
    // 17 é ímpar: o vizinho é o 15, não o 10 nem o 40.
    expect(n.geocodificar(geo, { logradouro: "Rua Doutor Samuel Sintetico", numero: 17, bairro: "alfa sintetico" })).toMatchObject({ lat: -8.0302 });
  });

  it("entre dois números do mesmo lado, interpola a posição", () => {
    const g = n.geocodificar(geo, { logradouro: "RUA DR SAMUEL SINTETICO", numero: 200, bairro: "alfa sintetico" });
    expect(g?.precisao).toBe("interpolado");
    expect(g?.lon).toBeCloseTo(-34.902, 6);
  });

  it("sem número, sem rua ou longe demais de qualquer número: null, nunca um chute", () => {
    expect(n.geocodificar(geo, { logradouro: "RUA DR SAMUEL SINTETICO", numero: "SN", bairro: "alfa sintetico" })).toBeNull();
    expect(n.geocodificar(geo, { logradouro: "RUA DR SAMUEL SINTETICO", numero: null, bairro: "alfa sintetico" })).toBeNull();
    expect(n.geocodificar(geo, { logradouro: "RUA QUE NAO EXISTE SINTETICA", numero: 10, bairro: "alfa sintetico" })).toBeNull();
    expect(n.geocodificar(geo, { logradouro: "RUA DR SAMUEL SINTETICO", numero: 2000, bairro: "alfa sintetico" })).toBeNull();
  });

  it("o tipo de via desempata ruas de mesmo nome no bairro", () => {
    expect(n.geocodificar(geo, { logradouro: "AV 17 DE AGOSTO SINTETICA", numero: 500, bairro: "alfa sintetico" })).toMatchObject({ lon: -34.905 });
    expect(n.geocodificar(geo, { logradouro: "RUA DEZESSETE DE AGOSTO SINTETICA", numero: 20, bairro: "alfa sintetico" })).toMatchObject({ lon: -34.95 });
  });

  it("rua homônima em dois bairros: vale o bairro; sem bairro, a mais perto; sem bairro e sem referência, nada", () => {
    expect(n.geocodificar(geo, { logradouro: "RUA AURORA SINTETICA", numero: 1, bairro: "beta sintetico" })).toMatchObject({ lon: -34.873 });
    expect(n.geocodificar(geo, { logradouro: "RUA AURORA SINTETICA", numero: 1, perto: { lon: -34.901, lat: -8.032 } })).toMatchObject({ lon: -34.9 });
    expect(n.acharRua(geo, { logradouro: "RUA AURORA SINTETICA" }).rua).toBeNull();
  });

  it("avenida partida em dois bairros: o número que só existe no trecho vizinho é achado lá", () => {
    const g = n.geocodificar(geo, { logradouro: "AV LONGA SINTETICA", numero: 1800, bairro: "alfa sintetico" });
    expect(g).toMatchObject({ via: "continuacao", precisao: "numero", lon: -34.925 });
  });

  it("erro de digitação no bairro: casa pela rua parecida", () => {
    // "Consenheiro" não é título conhecido; o resto do nome é o fim do nome do CNEFE, e isso já casa.
    expect(n.acharRua(geo, { logradouro: "Avenida Consenheiro Aguiar Sintetico", bairro: "alfa sintetico" }).rua?.completa).toBe("conselheiro aguiar sintetico");
    // Uma letra trocada no nome: só a distância de edição acha.
    const { rua, via } = n.acharRua(geo, { logradouro: "Rua Doutor Samuel Sintetiko", bairro: "alfa sintetico" });
    expect(via).toBe("digitacao");
    expect(rua?.completa).toBe("doutor samuel sintetico");
  });

  it("cruzamento: o meio dos endereços mais próximos das duas ruas; ruas que não se encontram, null", () => {
    const g = n.geocodificarCruzamento(geo, { logradouro: "RUA NORTE SINTETICA", cruzamento: "RUA LESTE SINTETICA", bairro: "alfa sintetico" });
    expect(g?.precisao).toBe("cruzamento");
    expect(distancia(g ?? { lon: 0, lat: 0 }, { lon: -34.93, lat: -8.0 })).toBeLessThan(20);
    expect(n.geocodificarCruzamento(geo, { logradouro: "RUA NORTE SINTETICA", cruzamento: "RUA ISOLADA SINTETICA", bairro: "alfa sintetico" })).toBeNull();
  });
});

describe("CNEFE: o complemento nunca sai da leitura", () => {
  const CABECALHO = [
    "COD_UNICO_ENDERECO", "COD_UF", "COD_MUNICIPIO", "COD_DISTRITO", "COD_SUBDISTRITO", "COD_SETOR", "NUM_QUADRA", "NUM_FACE", "CEP",
    "DSC_LOCALIDADE", "NOM_TIPO_SEGLOGR", "NOM_TITULO_SEGLOGR", "NOM_SEGLOGR", "NUM_ENDERECO", "DSC_MODIFICADOR", "NOM_COMP_ELEM1",
    "VAL_COMP_ELEM1", "NOM_COMP_ELEM2", "VAL_COMP_ELEM2", "NOM_COMP_ELEM3", "VAL_COMP_ELEM3", "NOM_COMP_ELEM4", "VAL_COMP_ELEM4",
    "NOM_COMP_ELEM5", "VAL_COMP_ELEM5", "LATITUDE", "LONGITUDE", "NV_GEO_COORD", "COD_ESPECIE", "DSC_ESTABELECIMENTO",
    "COD_INDICADOR_ESTAB_ENDERECO", "COD_INDICADOR_CONST_ENDERECO", "COD_INDICADOR_FINALIDADE_CONST", "COD_TIPO_ESPECI",
  ];
  // Linha sintética com complemento ("APARTAMENTO 1203", "BLOCO B") e nome de estabelecimento.
  const linha = [
    "999000111", "26", "2611606", "261160605", "26116060500", "261160605000077P", "3", "2", "50000000", "ALFA SINTETICO", "RUA", "", "SINTETICA",
    "719", "", "APARTAMENTO", "1203", "BLOCO", "B", "", "", "", "", "", "", "-8.030000", "-34.900000", "2", "1", "PADARIA SINTETICA", "", "", "", "101",
  ];

  it("a lista branca é a do contrato e não tem complemento, CEP, estabelecimento nem código único", () => {
    expect(n.COLUNAS_DO_CNEFE).toEqual([
      "COD_SETOR", "DSC_LOCALIDADE", "NOM_TIPO_SEGLOGR", "NOM_TITULO_SEGLOGR", "NOM_SEGLOGR", "NUM_ENDERECO", "LATITUDE", "LONGITUDE", "NV_GEO_COORD", "COD_ESPECIE",
    ]);
    expect(n.COLUNAS_DO_CNEFE.filter((c) => /COMP|CEP|ESTAB|UNICO/.test(c))).toEqual([]);
  });

  it("a linha lida só tem as colunas da lista branca: o complemento e o estabelecimento não aparecem", () => {
    const indices = Object.fromEntries(n.COLUNAS_DO_CNEFE.map((c) => [c, CABECALHO.indexOf(c)]));
    const lido = n.lerEnderecoDoCnefe(linha, indices);
    expect(lido).toEqual({
      bairro: "alfa sintetico", tipo: "RUA", titulo: "", nome: "SINTETICA", numero: 719, lon: -34.9, lat: -8.03, setor: "261160605000077", especie: 1,
    });
    const texto = JSON.stringify(lido);
    for (const proibido of ["APARTAMENTO", "1203", "BLOCO", "PADARIA", "999000111", "50000000"]) expect(texto).not.toContain(proibido);
  });

  it("o núcleo não lê coluna de complemento em lugar nenhum", () => {
    expect(codigo).not.toMatch(/["'](?:NOM|VAL)_COMP_ELEM\d["']/);
    expect(codigo).not.toMatch(/["']DSC_ESTABELECIMENTO["']/);
  });
});

describe("licença de som (LUSE): situação e deduplicação", () => {
  const HIST_VIGENTE = "Licenciamento expirado - LAS - LICENÇA SIMPLIFICADA-Licenciamento vigente - LUSE - LICENÇA UTILIZAÇÃO SONORA - ESTABELECIMENTO";
  const HIST_EXPIRADA = "Licenciamento expirado - LUSE - LICENÇA UTILIZAÇÃO SONORA - ESTABELECIMENTO-Licenciamento vigente - LO - LICENÇA DE OPERAÇÃO";
  const HIST_SOLICITADA = "Licenciamento(s) solicitado(s) - 000276/2022 - LUSE - LICENÇA UTILIZAÇÃO SONORA - ESTABELECIMENTO";

  it("vigente, expirada ou sem LUSE (a licença só solicitada ainda não conta)", () => {
    expect(n.situacaoDaLuse(HIST_VIGENTE)).toBe("vigente");
    expect(n.situacaoDaLuse(HIST_EXPIRADA)).toBe("expirada");
    expect(n.situacaoDaLuse("Licenciamento expirado - LUSE - LICENÇA DE UTILIZAÇÃO SONORA")).toBe("expirada");
    expect(n.situacaoDaLuse(HIST_SOLICITADA)).toBeNull();
    expect(n.situacaoDaLuse("Licenciamento vigente - LO - LICENÇA DE OPERAÇÃO")).toBeNull();
    expect(n.situacaoDaLuse(null)).toBeNull();
  });

  it("vários processos do mesmo lote viram um local; vale o processo mais recente", () => {
    const registros = [
      // Mesmo lote, publicado com pontos: três renovações; a mais recente diz expirada.
      { dsqfl: "9.9999.001.01.0001", licenciamento_ambiental: HIST_VIGENTE, data_entrada: "2019-03-01T00:00:00", latitude: -8.03, longitude: -34.9 },
      { dsqfl: "9.9999.001.01.0001", licenciamento_ambiental: HIST_VIGENTE, data_entrada: "2021-05-01T00:00:00", latitude: -8.03, longitude: -34.9 },
      { dsqfl: "99999001010001", licenciamento_ambiental: HIST_EXPIRADA, data_entrada: "2024-07-10T00:00:00", latitude: null, longitude: null },
      // Outro lote, só um processo, vigente.
      { dsqfl: "9.9999.002.01.0002", licenciamento_ambiental: HIST_VIGENTE, data_entrada: "2025-02-01T00:00:00", latitude: -8.031, longitude: -34.901 },
      // Processo sem LUSE no histórico: fica de fora.
      { dsqfl: "9.9999.003.01.0003", licenciamento_ambiental: "Licenciamento vigente - LO - LICENÇA DE OPERAÇÃO", data_entrada: "2025-01-01", latitude: -8.0, longitude: -34.9 },
    ];
    const { locais, linhasComLuse, semPosicao } = n.deduplicarLuse(registros);
    expect(linhasComLuse).toBe(4);
    expect(semPosicao).toBe(0);
    expect(locais).toEqual([
      { lugar: "d:99999001010001", centro: [-34.9, -8.03], vigente: false, ultimaEntrada: "2024-07", processos: 3 },
      { lugar: "d:99999002010002", centro: [-34.901, -8.031], vigente: true, ultimaEntrada: "2025-02", processos: 1 },
    ]);
  });

  it("sem coordenada usa o centro do lote; sem os dois, fica de fora e é contado; sem dsqfl, a coordenada é o lugar", () => {
    const registros = [
      { dsqfl: "9.9999.004.01.0004", licenciamento_ambiental: HIST_VIGENTE, data_entrada: "2025-01-01", latitude: null, longitude: null },
      { dsqfl: "9.9999.005.01.0005", licenciamento_ambiental: HIST_VIGENTE, data_entrada: "2025-01-01", latitude: null, longitude: null },
      { dsqfl: null, licenciamento_ambiental: HIST_VIGENTE, data_entrada: "2025-01-01", latitude: -8.04, longitude: -34.91 },
      { dsqfl: null, licenciamento_ambiental: HIST_VIGENTE, data_entrada: "2025-03-01", latitude: -8.04, longitude: -34.91 },
    ];
    const centros = new Map<string, [number, number]>([["99999004010004", [-34.95, -8.05]]]);
    const { locais, semPosicao } = n.deduplicarLuse(registros, centros);
    expect(semPosicao).toBe(1);
    expect(locais.map((l) => [l.lugar, l.centro, l.processos])).toEqual([
      ["c:-34.91000,-8.04000", [-34.91, -8.04], 2],
      ["d:99999004010004", [-34.95, -8.05], 1],
    ]);
  });
});

describe("Defesa Civil: rua sem o número mascarado, inclusive nas linhas deslocadas", () => {
  it("linha normal: a rua antes da vírgula; o número mascarado não sai", () => {
    const lido = n.lerAtendimentoDaDefesaCivil({
      Regional: "RPA 3", Ano: 2024, Mes: "Abril", Data: "2024-04-11T00:00:00", Ocorrencia: "Imóveis com Danos / Risco",
      Solicitacao: "Vistoria em Imóveis", Endereco: "Rua das Flores Sinteticas, ?_$.", Bairro: "Gracas",
    });
    expect(lido).toEqual({ ano: 2024, bairro: "Gracas", rua: "Rua das Flores Sinteticas", ocorrencia: "Imóveis com Danos / Risco" });
  });

  it("linha deslocada (o mês no campo Ano): a rua vem de Solicitacao e a ocorrência de Data", () => {
    const lido = n.lerAtendimentoDaDefesaCivil({
      Regional: "2019", Ano: "Abril", Mes: "2019-04-24", Data: "rvores em Risco", Ocorrencia: "Vistoria em Imveis",
      Solicitacao: "\"Rua Sintetica do Conselheiro", Endereco: " \"\"#_|/\"", Bairro: "Espinheiro",
    });
    expect(lido).toEqual({ ano: 2019, bairro: "Espinheiro", rua: "Rua Sintetica do Conselheiro", ocorrencia: "rvores em Risco" });
  });

  it("nenhum símbolo da máscara chega à saída, e linha só com a máscara é descartada", () => {
    const mascaras = ["@}>", "$!>=", "`=-[", "#$[", "{})!", "9<-%", "%$<!", "^[{"];
    for (const m of mascaras) {
      const lido = n.lerAtendimentoDaDefesaCivil({ Ano: 2023, Data: "2023-01-04", Ocorrencia: "", Endereco: `Avenida Sintetica, ${m}`, Bairro: "Madalena" });
      expect(lido?.rua).toBe("Avenida Sintetica");
      expect(JSON.stringify(lido)).not.toContain(m);
    }
    expect(n.lerAtendimentoDaDefesaCivil({ Ano: "Novembro", Regional: "2020", Mes: "2020-11-01", Solicitacao: "{})!", Endereco: "{})!", Bairro: "Madalena" })).toBeNull();
  });

  it("categorias da ocorrência toleram a acentuação perdida na publicação", () => {
    expect(n.categoriaDaOcorrencia("Imveis com Danos / Risco")).toBe("danos_ou_risco");
    expect(n.categoriaDaOcorrencia("imóveis com Danos / Risco")).toBe("danos_ou_risco");
    expect(n.categoriaDaOcorrencia("Alagamentos")).toBe("alagamento");
    expect(n.categoriaDaOcorrencia("Desabamento Parcial Imóveis")).toBe("desabamento");
    expect(n.categoriaDaOcorrencia("Incêndios")).toBe("incendio");
    expect(n.categoriaDaOcorrencia("rvores em Risco")).toBe("arvore");
    expect(n.categoriaDaOcorrencia("")).toBe("nao_informada");
  });
});

describe("Central 156, sinistros, coleta e Censo", () => {
  it("categorias do 156 e dias até o atendimento (só ATENDIDA, com as datas em ordem)", () => {
    expect(n.categoriaDoPedido("DRENAGEM", "LIMPEZA DE GALERIAS E VALETAS")).toBe("drenagem");
    expect(n.categoriaDoPedido("ILUMINACAO PUBLICA", "MANUTENCAO EM LAMPADA APAGADA")).toBe("lampada");
    expect(n.categoriaDoPedido("ILUMINACAO PUBLICA", "ACENDER CIRCUITO")).toBe("lampada");
    expect(n.categoriaDoPedido("LIMPEZA URBANA", "REMOCAO DE ENTULHOS")).toBe("entulho");
    expect(n.categoriaDoPedido("ARBORIZACAO", "PODA DE ARVORES")).toBeNull();
    expect(n.diasAteAtender("ATENDIDA", "2026-01-25T00:00:00", "2026-01-26T00:00:00")).toBe(1);
    expect(n.diasAteAtender("EXECUCAO", "2026-01-25T00:00:00", "2026-01-26T00:00:00")).toBeNull();
    expect(n.diasAteAtender("ATENDIDA", "2026-01-25T00:00:00", "2026-01-20T00:00:00")).toBeNull();
  });

  it("janela de 12 meses que termina no pedido mais recente", () => {
    expect(n.inicioDaJanela("2026-01-30", 12)).toBe("2025-01-31");
  });

  it("sinistro: com vítima pela natureza ou pela contagem; atropelamento pelo pedestre; cruzamento só se for outra rua", () => {
    const base = { data: "2024-01-01T00:00:00", natureza: "COM VÍTIMA", endereco: "AV SINTETICA", numero: "", detalhe_endereco_acidente: "RUA OUTRA SINTETICA", tipo: "COLISÃO", pedestre: "0,0", vitimas: "1,0", vitimasfatais: "0,0" };
    expect(n.lerSinistro(base)).toMatchObject({ comVitima: true, atropelamento: false, numero: null, cruzamento: "RUA OUTRA SINTETICA" });
    expect(n.lerSinistro({ ...base, natureza: "SEM VÍTIMA", vitimas: "0,0" })?.comVitima).toBe(false);
    expect(n.lerSinistro({ ...base, pedestre: "1,0" })?.atropelamento).toBe(true);
    expect(n.lerSinistro({ ...base, numero: "1353", detalhe_endereco_acidente: "AV SINTETICA" })).toMatchObject({ numero: 1353, cruzamento: null });
  });

  it("roteiro da coleta formatado para a tela", () => {
    expect(n.lerRoteiroDeColeta({ turno: "MANHÃ", intervalo: "07:30 à 12:00 hs", frequencia: "TER, QUI, SAB", endereco: "R SINTETICA", setor: "1-12" }))
      .toMatchObject({ turno: "manhã", intervalo: "7h30 às 12h", frequencia: "ter, qui e sáb" });
    expect(n.lerRoteiroDeColeta({ turno: "NOTURNO", intervalo: " 19:30 à 00:00 hs", frequencia: "DIÁRIA" })).toMatchObject({ turno: "noite", intervalo: "19h30 às 0h", frequencia: "diária" });
  });

  it("Censo: valor suprimido (X) vira null, nunca 0", () => {
    const linha = { CD_setor: "261160605000001", V05000: "346", V05015: "X", V05021: "279", V05024: "41", V05027: "240", V05033: "0" };
    expect(n.lerSetorDoEntorno(linha)).toEqual({ codigo: "261160605000001", domicilios: 346, onibus: null, calcada: 279, obstaculo: 41, rampa: 240, arvores: 0 });
  });

  it("localizador de setor: ponto no polígono, com buraco excluído", () => {
    const quadrado = (x0: number, y0: number, x1: number, y1: number) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
    const setores = [
      { codigo: "261160605000001", caixa: [-34.91, -8.04, -34.9, -8.03], aneis: [quadrado(-34.91, -8.04, -34.9, -8.03), quadrado(-34.906, -8.036, -34.904, -8.034)] },
      { codigo: "261160605000002", caixa: [-34.906, -8.036, -34.904, -8.034], aneis: [quadrado(-34.906, -8.036, -34.904, -8.034)] },
    ];
    const local = n.criarLocalizadorDeSetor(setores);
    expect(local.achar(-34.908, -8.038)).toBe("261160605000001");
    expect(local.achar(-34.905, -8.035)).toBe("261160605000002");
    expect(local.achar(-34.95, -8.0)).toBeNull();
  });
});
