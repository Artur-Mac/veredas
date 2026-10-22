import { describe, expect, it, jest } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { esquemaCandidato, esquemaIndiceDoBairro, type AnaliseV2, type Edificio } from "../src/dados/contratos";
import { buscarCandidatos, buscarCandidatosDetalhados, buscarPorEndereco, enderecoSemFecho, normalizar, type EntradaDeBusca } from "../src/dados/recife/buscar";
import { DIRETORIO_DO_INDICE } from "../src/dados/recife/publicacaoGerada";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import { MapaDoPredio } from "../src/componentes/predio/MapaDoPredio";
import {
  PERCURSO_INICIAL,
  aposEscolha,
  maisProximos,
  proximoDoPercurso,
  type Percurso,
} from "../src/componentes/predio/percurso";
import { distanciaEmMetros, montarCena, projetorLocal, raioSemPoligono } from "../src/componentes/predio/projecao";
import {
  enderecoEmCaixaDeTitulo,
  formatarChaveCadastral,
  linhaDeResultado,
  mensagemSemCandidatos,
  resumoDoPredio,
  rotuloDoLoteVizinho,
} from "../src/componentes/predio/textos";
import { TemaDoApp } from "../src/tema/Tema";
import { CORES_CLARO } from "../src/tema/tokens";
import fixture from "./fixtures/indice-sintetico.json";

// A fixture é sintética (ver o campo _leia). O esquema é estrito, então o _leia sai antes de validar.
const { _leia: leia, ...indiceBruto } = fixture;
const indice = esquemaIndiceDoBairro.parse(indiceBruto);
const edificios = indice.edificios;

function achar(id: string): Edificio {
  const e = edificios.find((x) => x.id === id);
  if (!e) throw new Error(`Fixture sem o edifício ${id}`);
  return e;
}
const SOLAR = achar("900001-100");
const TESTE_250 = achar("900001-250");
const MAR = achar("900002-45");
const VILA = achar("900002-300");
const EXEMPLO = achar("900003-12");

const vazio: EntradaDeBusca = {
  bairro: "gracas", logradouro: null, numero: null, nomeEdificio: null, area: null, andar: null, anoConstrucao: null,
};
const com = (parcial: Partial<EntradaDeBusca>): EntradaDeBusca => ({ ...vazio, ...parcial });
const ids = (lista: { edificioId: string }[]) => lista.map((c) => c.edificioId);
const idsDosEdificios = (lista: Edificio[]) => lista.map((e) => e.id);

/** Cópia da fixture com outro id, para testar limite e desempate sem inventar mais um arquivo. */
function clone(base: Edificio, id: string, extras: Partial<Edificio> = {}): Edificio {
  return { ...base, id, nome: null, ...extras };
}

describe("a fixture do índice sintético", () => {
  it("avisa que é sintética e segue o formato de esquemaIndiceDoBairro", () => {
    expect(leia).toMatch(/SINTETICOS/);
    expect(edificios).toHaveLength(5);
    expect(indice.contexto.edificios).toBe(5);
    expect(edificios.every((e) => e.id.startsWith("9000"))).toBe(true);
  });
});

describe("buscarCandidatos: endereço", () => {
  it("rua e número iguais acham o prédio direto, com a rua e o número somando 150 pontos", () => {
    const r = buscarCandidatos(com({ logradouro: "Rua do Teste Sintético", numero: "100" }), edificios);
    expect(ids(r)).toEqual(["900001-100", "900001-250"]);
    expect(r[0]).toEqual({ edificioId: "900001-100", pontos: 150, motivos: ["Mesma rua e mesmo número do anúncio"] });
    expect(r[1]).toEqual({ edificioId: "900001-250", pontos: 50, motivos: ["Mesma rua do anúncio"] });
  });

  it("ignora acento, caixa, pontuação e o tipo de via (R., Av.)", () => {
    expect(ids(buscarCandidatos(com({ logradouro: "R. DO TESTE SINTÉTICO", numero: "250" }), edificios))[0]).toBe("900001-250");
    expect(ids(buscarCandidatos(com({ logradouro: "Avenida Sintética Alfa", numero: "45" }), edificios))[0]).toBe("900002-45");
    expect(ids(buscarCandidatos(com({ logradouro: "av. sintetica alfa", numero: "300" }), edificios))[0]).toBe("900002-300");
  });

  it("número de outra rua não conta", () => {
    const r = buscarCandidatos(com({ logradouro: "Travessa do Exemplo", numero: "100" }), edificios);
    expect(r).toEqual([{ edificioId: "900003-12", pontos: 50, motivos: ["Mesma rua do anúncio"] }]);
  });

  it("número sem rua não acha nada", () => {
    expect(buscarCandidatos(com({ numero: "100" }), edificios)).toEqual([]);
  });

  it("abreviação de título no logradouro casa com o nome por extenso", () => {
    const doutor = clone(SOLAR, "900050-10", { logradouro: "RUA DOUTOR JOSE MARIA", numero: "10" });
    expect(ids(buscarCandidatos(com({ logradouro: "Rua Dr. José Maria", numero: "10" }), [doutor]))).toEqual(["900050-10"]);
  });
});

describe("buscarCandidatos: nome do edifício", () => {
  it("o mesmo nome vale 100 pontos, em qualquer caixa", () => {
    for (const nome of ["Solar do Gayppio", "SOLAR DO GAYPPIO", "solar do gayppio"]) {
      expect(buscarCandidatos(com({ nomeEdificio: nome }), edificios)).toEqual([
        { edificioId: "900001-100", pontos: 100, motivos: ["Mesmo nome de edifício do anúncio"] },
      ]);
    }
  });

  it("ignora edifício, edf, condomínio e residencial", () => {
    for (const nome of ["Edifício Solar do Gayppio", "EDF. SOLAR DO GAYPPIO", "Condomínio Residencial Solar do Gayppio", "Edif Solar do Gayppio"]) {
      expect(ids(buscarCandidatos(com({ nomeEdificio: nome }), edificios))).toEqual(["900001-100"]);
    }
  });

  it("um nome que contém o outro vale se o contido tem 2 palavras ou mais", () => {
    expect(ids(buscarCandidatos(com({ nomeEdificio: "Solar do Gayppio Residence" }), edificios))).toEqual(["900001-100"]);
    expect(ids(buscarCandidatos(com({ nomeEdificio: "Mar Ficticio Boa Vista" }), edificios))).toEqual(["900002-45"]);
    // "Solar" sozinho tem 1 palavra: não vale como contido.
    expect(buscarCandidatos(com({ nomeEdificio: "Solar" }), edificios)).toEqual([]);
    expect(buscarCandidatos(com({ nomeEdificio: "Gayppio" }), edificios)).toEqual([]);
  });

  it("nome de uma palavra só vale quando é igual", () => {
    const beta = buscarCandidatos(com({ nomeEdificio: "Beta" }), edificios);
    expect(beta).toEqual([]);
    expect(ids(buscarCandidatos(com({ nomeEdificio: "Edifício Vila Beta" }), edificios))).toEqual(["900002-300"]);
    const sozinho = clone(SOLAR, "900051-1", { nome: "Beta" });
    expect(ids(buscarCandidatos(com({ nomeEdificio: "Edf Beta" }), [sozinho]))).toEqual(["900051-1"]);
  });

  it("soma nome, rua e número, com os motivos na mesma ordem", () => {
    const [primeiro] = buscarCandidatos(
      com({ nomeEdificio: "Solar do Gayppio", logradouro: "Rua do Teste Sintetico", numero: "100" }),
      edificios,
    );
    expect(primeiro).toEqual({
      edificioId: "900001-100",
      pontos: 250,
      motivos: ["Mesmo nome de edifício do anúncio", "Mesma rua e mesmo número do anúncio"],
    });
  });

  it("edifício sem nome no cadastro nunca casa por nome", () => {
    expect(buscarCandidatos(com({ nomeEdificio: "Edifício" }), edificios)).toEqual([]);
  });
});

describe("buscarCandidatos: área", () => {
  it("só a área devolve quem tem a tipologia, 30 pontos e mais 10 se a tipologia tem 2 ou mais unidades", () => {
    const r = buscarCandidatos(com({ area: 125 }), edificios);
    expect(r).toEqual([
      { edificioId: "900001-250", pontos: 40, motivos: ["3 unidades com 125 m² no cadastro"] },
      { edificioId: "900002-45", pontos: 30, motivos: ["1 unidade com 126,5 m² no cadastro"] },
    ]);
  });

  it("a tolerância é o maior entre 1,5 m² e 3%", () => {
    expect(ids(buscarCandidatos(com({ area: 129 }), edificios))).toEqual(["900002-45"]); // 3% de 129 = 3,87
    expect(buscarCandidatos(com({ area: 131 }), edificios)).toEqual([]);
    expect(ids(buscarCandidatos(com({ area: 60 }), edificios))).toEqual(["900003-12"]); // 62,4 está a 2,4 > 1,8
    const pequeno = clone(SOLAR, "900052-1", { tipologias: [{ area: 40, unidades: 2, iptuAnualMediano: null }] });
    expect(ids(buscarCandidatos(com({ area: 41.4 }), [pequeno]))).toEqual(["900052-1"]); // 1,4 <= 1,5
    expect(buscarCandidatos(com({ area: 41.6 }), [pequeno])).toEqual([]); // 1,6 > 1,5
  });

  it("área e ano de construção somam; o ano sozinho não passa dos 30 pontos mínimos", () => {
    expect(buscarCandidatos(com({ area: 85.5, anoConstrucao: 2009 }), edificios)).toEqual([
      {
        edificioId: "900001-100",
        pontos: 55,
        motivos: ["16 unidades com 85,5 m² no cadastro", "Construído em 2008, perto do ano do anúncio"],
      },
    ]);
    expect(buscarCandidatos(com({ area: 85.5, anoConstrucao: 2011 }), edificios)[0]?.pontos).toBe(40);
    expect(buscarCandidatos(com({ anoConstrucao: 2008 }), edificios)).toEqual([]);
  });
});

describe("buscarCandidatos: andar, sinal e ordem", () => {
  it("andar acima dos pavimentos do prédio exclui", () => {
    const rua = com({ logradouro: "Av Sintetica Alfa" });
    expect(ids(buscarCandidatos(rua, edificios))).toEqual(["900002-300", "900002-45"]);
    expect(ids(buscarCandidatos({ ...rua, andar: 5 }, edificios))).toEqual(["900002-45"]); // Vila Beta tem 2 pavimentos
    expect(ids(buscarCandidatos({ ...rua, andar: 2 }, edificios))).toEqual(["900002-300", "900002-45"]);
  });

  it("prédio sem pavimentos no cadastro nunca é excluído pelo andar", () => {
    expect(ids(buscarCandidatos(com({ logradouro: "Travessa do Exemplo", andar: 30 }), edificios))).toEqual(["900003-12"]);
  });

  it("andar sozinho, e entrada sem nenhum sinal, devolvem lista vazia", () => {
    expect(buscarCandidatos(com({ andar: 3 }), edificios)).toEqual([]);
    expect(buscarCandidatos(vazio, edificios)).toEqual([]);
    expect(buscarCandidatos(com({ logradouro: "  ", nomeEdificio: "", area: 0 }), edificios)).toEqual([]);
    expect(buscarCandidatos(vazio, [])).toEqual([]);
  });

  it("só entram edifícios do bairro da entrada", () => {
    expect(buscarCandidatos(com({ bairro: "casa-forte", logradouro: "Rua do Teste Sintetico", numero: "100" }), edificios)).toEqual([]);
  });

  it("ordena por pontos e depois por id, e devolve no máximo 8", () => {
    const muitos = Array.from({ length: 12 }, (_, i) => clone(SOLAR, `900200-${String(i + 1).padStart(2, "0")}`, { logradouro: "RUA DAS CLONES", numero: String(i + 1) }));
    const r = buscarCandidatos(com({ logradouro: "Rua das Clones", numero: "7" }), muitos);
    expect(r).toHaveLength(8);
    expect(r[0]).toMatchObject({ edificioId: "900200-07", pontos: 150 });
    expect(ids(r.slice(1))).toEqual(["900200-01", "900200-02", "900200-03", "900200-04", "900200-05", "900200-06", "900200-08"]);
    expect(r.slice(1).every((c) => c.pontos === 50)).toBe(true);
  });

  it("informa total antes do corte e pistas estruturadas sem mudar a API anterior", () => {
    const muitos = Array.from({ length: 12 }, (_, i) => clone(SOLAR, `900200-${String(i + 1).padStart(2, "0")}`, { logradouro: "RUA DAS CLONES", numero: String(i + 1) }));
    const entrada = com({ logradouro: "Rua das Clones", numero: "7" });
    const r = buscarCandidatosDetalhados(entrada, muitos);
    expect(r.totalCompativeis).toBe(12);
    expect(r.resultadosLimitados).toBe(true);
    expect(r.candidatos).toHaveLength(8);
    expect(r.candidatos[0]?.pistas).toEqual(["rua", "numero"]);
    expect(r.candidatos.slice(1).every((c) => c.pistas.join() === "rua")).toBe(true);
    expect(r.candidatos.map(({ pistas, ...c }) => c)).toEqual(buscarCandidatos(entrada, muitos));
    expect(buscarCandidatosDetalhados(vazio, muitos)).toEqual({ candidatos: [], totalCompativeis: 0, resultadosLimitados: false });
    const area = buscarCandidatosDetalhados(com({ area: SOLAR.tipologias[0]!.area }), [SOLAR]);
    expect(area.candidatos[0]?.pistas).toEqual(["area"]);
    expect(area.resultadosLimitados).toBe(false);
  });

  it("cada candidato passa em esquemaCandidato", () => {
    const todos = buscarCandidatos(
      com({ nomeEdificio: "Solar do Gayppio", logradouro: "Rua do Teste Sintetico", numero: "100", area: 85.5, anoConstrucao: 2008 }),
      edificios,
    );
    expect(todos[0]?.motivos).toHaveLength(4);
    for (const c of todos) expect(esquemaCandidato.safeParse(c).success).toBe(true);
  });
});

describe("buscarPorEndereco", () => {
  it("rua e número, com ou sem tipo de via, vírgula e acento", () => {
    for (const texto of ["rua do teste sintetico 100", "do teste sintético, 100", "R. DO TESTE SINTETICO N 100", "Rua do Teste Sintético nº 100"]) {
      expect(idsDosEdificios(buscarPorEndereco(texto, edificios))).toEqual(["900001-100"]);
    }
    expect(idsDosEdificios(buscarPorEndereco("avenida sintetica alfa 45", edificios))).toEqual(["900002-45"]);
    expect(idsDosEdificios(buscarPorEndereco("av sintetica alfa 300", edificios))).toEqual(["900002-300"]);
  });

  it("só a rua traz os prédios dela; número que não existe traz a rua inteira", () => {
    expect(idsDosEdificios(buscarPorEndereco("rua do teste sintetico", edificios))).toEqual(["900001-100", "900001-250"]);
    expect(idsDosEdificios(buscarPorEndereco("rua do teste sintetico 999", edificios))).toEqual(["900001-100", "900001-250"]);
  });

  it("o nome do prédio, inteiro, com edifício na frente ou ainda incompleto", () => {
    for (const texto of ["Solar do Gayppio", "solar do gayppio", "edf solar do gayppio", "solar do gay", "solar"]) {
      expect(idsDosEdificios(buscarPorEndereco(texto, edificios))).toEqual(["900001-100"]);
    }
    expect(idsDosEdificios(buscarPorEndereco("mar ficticio", edificios))).toEqual(["900002-45"]);
    expect(idsDosEdificios(buscarPorEndereco("vila beta", edificios))).toEqual(["900002-300"]);
  });

  it("só o número acha os prédios com aquele número", () => {
    expect(idsDosEdificios(buscarPorEndereco("100", edificios))).toEqual(["900001-100"]);
    expect(idsDosEdificios(buscarPorEndereco("12", edificios))).toEqual(["900003-12"]);
    expect(buscarPorEndereco("777", edificios)).toEqual([]);
  });

  it("texto vazio, curto ou sem relação devolve lista vazia", () => {
    for (const texto of ["", "   ", "r", "zzz qqq", ",,,"]) expect(buscarPorEndereco(texto, edificios)).toEqual([]);
    expect(buscarPorEndereco("solar", [])).toEqual([]);
  });

  it("devolve no máximo 8, por id", () => {
    const muitos = Array.from({ length: 12 }, (_, i) => clone(SOLAR, `900300-${String(i + 1).padStart(2, "0")}`, { logradouro: "RUA DAS CLONES", numero: String(i + 1) }));
    const r = buscarPorEndereco("rua das clones", muitos);
    expect(r).toHaveLength(8);
    expect(idsDosEdificios(r)).toEqual(["900300-01", "900300-02", "900300-03", "900300-04", "900300-05", "900300-06", "900300-07", "900300-08"]);
    expect(idsDosEdificios(buscarPorEndereco("rua das clones 11", muitos))).toEqual(["900300-11"]);
  });
});

describe("tipos de via do cadastro (RUA, AV, EST, PRC)", () => {
  // O cadastro do Recife começa o logradouro por RUA, AV, EST ou PRC. Ids 9000xx: edifícios de teste, só aqui.
  const ENCANAMENTO = clone(SOLAR, "900060-1191", { bairro: "casa-forte", logradouro: "EST DO ENCANAMENTO", numero: "1191" });
  const CASA_FORTE = clone(SOLAR, "900061-317", { bairro: "casa-forte", logradouro: "PRC DE CASA FORTE", numero: "317" });
  const AVENIDA = clone(SOLAR, "900062-45", { bairro: "casa-forte", logradouro: "AV DE EXEMPLO", numero: "45" });
  const predios = [ENCANAMENTO, CASA_FORTE, AVENIDA];
  const emCasaForte = (parcial: Partial<EntradaDeBusca>) => com({ bairro: "casa-forte", ...parcial });

  it("buscarCandidatos: Estrada do Encanamento 1191 acha EST DO ENCANAMENTO, rua e número, 150 pontos", () => {
    expect(buscarCandidatos(emCasaForte({ logradouro: "Estrada do Encanamento", numero: "1191" }), predios)).toEqual([
      { edificioId: "900060-1191", pontos: 150, motivos: ["Mesma rua e mesmo número do anúncio"] },
    ]);
  });

  it("buscarCandidatos: Praça de Casa Forte 317 acha PRC DE CASA FORTE, rua e número, 150 pontos", () => {
    expect(buscarCandidatos(emCasaForte({ logradouro: "Praça de Casa Forte", numero: "317" }), predios)).toEqual([
      { edificioId: "900061-317", pontos: 150, motivos: ["Mesma rua e mesmo número do anúncio"] },
    ]);
  });

  it("buscarPorEndereco: Estrada do Encanamento 1191 e Praça de Casa Forte 317", () => {
    expect(idsDosEdificios(buscarPorEndereco("Estrada do Encanamento 1191", predios))).toEqual(["900060-1191"]);
    expect(idsDosEdificios(buscarPorEndereco("Estrada do Encanamento", predios))).toEqual(["900060-1191"]);
    expect(idsDosEdificios(buscarPorEndereco("estrada do enc", predios))).toEqual(["900060-1191"]);
    expect(idsDosEdificios(buscarPorEndereco("Praça de Casa Forte 317", predios))).toEqual(["900061-317"]);
    expect(idsDosEdificios(buscarPorEndereco("Praça de Casa Forte, 317", predios))).toEqual(["900061-317"]);
    expect(idsDosEdificios(buscarPorEndereco("praca de casa forte", predios))).toEqual(["900061-317"]);
  });

  it("buscarPorEndereco: o prédio de rua igual vem antes de um de rua parecida com o mesmo número", () => {
    // Os rivais têm id menor: só a rua exata (sem o tipo de via, nos dois lados) faz o certo ganhar o desempate.
    const rivais = [
      clone(SOLAR, "900050-1191", { bairro: "casa-forte", logradouro: "RUA DO ENCANAMENTO NOVO", numero: "1191" }),
      clone(SOLAR, "900051-317", { bairro: "casa-forte", logradouro: "RUA DE CASA FORTE VELHA", numero: "317" }),
    ];
    const todos = [...rivais, ...predios];
    expect(idsDosEdificios(buscarPorEndereco("Estrada do Encanamento 1191", todos))[0]).toBe("900060-1191");
    expect(idsDosEdificios(buscarPorEndereco("Praça de Casa Forte 317", todos))[0]).toBe("900061-317");
    expect(ids(buscarCandidatos(emCasaForte({ logradouro: "Estrada do Encanamento", numero: "1191" }), todos))[0]).toBe("900060-1191");
    expect(ids(buscarCandidatos(emCasaForte({ logradouro: "Praça de Casa Forte", numero: "317" }), todos))[0]).toBe("900061-317");
  });

  it("todos os tipos de via da lista, com e sem ponto e em qualquer caixa, saem dos dois lados da comparação", () => {
    const tipos = [
      "rua", "r", "avenida", "av", "estrada", "est", "praça", "praca", "pça", "pca", "prc", "travessa", "tv", "alameda",
      "al", "largo", "lgo",
    ];
    for (const tipo of tipos) {
      for (const escrito of [tipo, `${tipo}.`, tipo.toUpperCase(), `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}.`]) {
        const anuncio = buscarCandidatos(emCasaForte({ logradouro: `${escrito} do Encanamento`, numero: "1191" }), predios);
        expect([escrito, anuncio]).toEqual([escrito, [{ edificioId: "900060-1191", pontos: 150, motivos: ["Mesma rua e mesmo número do anúncio"] }]]);
        const digitado = idsDosEdificios(buscarPorEndereco(`${escrito} do Encanamento 1191`, predios));
        expect([escrito, digitado]).toEqual([escrito, ["900060-1191"]]);
      }
    }
  });

  it("os quatro prefixos do cadastro são o mesmo tipo de via: o que sobra é o nome da rua", () => {
    const quatro = ["RUA", "AV", "EST", "PRC"].map((p, i) => clone(SOLAR, `90008${i}-9`, { bairro: "casa-forte", logradouro: `${p} DE EXEMPLO`, numero: "9" }));
    const r = buscarCandidatos(emCasaForte({ logradouro: "Rua de Exemplo", numero: "9" }), quatro);
    expect(r).toHaveLength(4);
    expect(r.every((c) => c.pontos === 150)).toBe(true);
    // Estrada escrita por extenso no cadastro também casa com a abreviação do anúncio.
    const porExtenso = clone(SOLAR, "900090-5", { bairro: "casa-forte", logradouro: "ESTRADA DO ENCANAMENTO", numero: "5" });
    expect(ids(buscarCandidatos(emCasaForte({ logradouro: "Est. do Encanamento", numero: "5" }), [porExtenso]))).toEqual(["900090-5"]);
  });

  it("só a primeira palavra é tipo de via: o resto do nome continua valendo", () => {
    const praca = clone(SOLAR, "900091-1", { bairro: "casa-forte", logradouro: "RUA DA PRACA", numero: "1" });
    expect(buscarCandidatos(emCasaForte({ logradouro: "Rua da", numero: "1" }), [praca])).toEqual([]);
    expect(ids(buscarCandidatos(emCasaForte({ logradouro: "Rua da Praça", numero: "1" }), [praca]))).toEqual(["900091-1"]);
  });

  it("na exibição: RUA vira Rua, AV vira Avenida, EST vira Estrada e PRC vira Praça", () => {
    expect(enderecoEmCaixaDeTitulo("RUA TELES JUNIOR", "331")).toBe("Rua Teles Junior, 331");
    expect(enderecoEmCaixaDeTitulo("AV SANTOS DUMONT", "267")).toBe("Avenida Santos Dumont, 267");
    expect(enderecoEmCaixaDeTitulo("EST DO ENCANAMENTO", "1191")).toBe("Estrada do Encanamento, 1191");
    expect(enderecoEmCaixaDeTitulo("PRC DE CASA FORTE", "317")).toBe("Praça de Casa Forte, 317");
    expect(enderecoEmCaixaDeTitulo("PRC DE CASA FORTE", null)).toBe("Praça de Casa Forte");
    expect(linhaDeResultado(ENCANAMENTO)).toBe("Estrada do Encanamento, 1191");
    expect(linhaDeResultado(CASA_FORTE)).toBe("Praça de Casa Forte, 317");
  });

  it("o que a tela mostra, digitado de volta, acha o mesmo prédio", () => {
    for (const e of predios) {
      const escrito = enderecoEmCaixaDeTitulo(e.logradouro, e.numero);
      expect(idsDosEdificios(buscarPorEndereco(escrito, predios))).toContain(e.id);
      const [achado] = buscarCandidatos(emCasaForte({ logradouro: e.logradouro, numero: e.numero }), predios);
      expect(achado?.edificioId).toBe(e.id);
    }
  });
});

describe("buscarCandidatos: várias tipologias na tolerância de área", () => {
  const comTipologias = (tipologias: Edificio["tipologias"]) =>
    clone(SOLAR, "900070-1", { logradouro: "RUA DAS TIPOLOGIAS", numero: "1", tipologias });
  const t = (area: number, unidades: number) => ({ area, unidades, iptuAnualMediano: null });

  it("a mais próxima tem 1 unidade e outra na tolerância tem 3: 30 + 10 pontos", () => {
    const predio = comTipologias([t(100, 1), t(102, 3)]);
    expect(buscarCandidatos(com({ area: 100 }), [predio])).toEqual([
      { edificioId: "900070-1", pontos: 40, motivos: ["3 unidades com 102 m² no cadastro"] },
    ]);
    // A ordem em que o cadastro lista as tipologias não muda nada.
    const invertido = comTipologias([t(102, 3), t(100, 1)]);
    expect(buscarCandidatos(com({ area: 100 }), [invertido])[0]?.pontos).toBe(40);
  });

  it("o +10 vale uma vez só, mesmo com várias tipologias repetidas na tolerância", () => {
    const predio = comTipologias([t(99, 4), t(100, 2), t(101, 6)]);
    expect(buscarCandidatos(com({ area: 100 }), [predio])[0]?.pontos).toBe(40);
  });

  it("sem nenhuma tipologia repetida na tolerância, são 30 pontos", () => {
    const predio = comTipologias([t(99, 1), t(100.5, 1)]);
    expect(buscarCandidatos(com({ area: 100 }), [predio])).toEqual([
      { edificioId: "900070-1", pontos: 30, motivos: ["1 unidade com 100,5 m² no cadastro"] },
    ]);
  });

  it("tipologia repetida fora da tolerância não dá o +10", () => {
    const predio = comTipologias([t(100, 1), t(110, 8)]); // tolerância de 100 m² = 3 m²
    expect(buscarCandidatos(com({ area: 100 }), [predio])[0]?.pontos).toBe(30);
  });

  it("a mais próxima com 2 ou mais unidades continua valendo 40", () => {
    const predio = comTipologias([t(100, 5), t(102, 1)]);
    expect(buscarCandidatos(com({ area: 100 }), [predio])).toEqual([
      { edificioId: "900070-1", pontos: 40, motivos: ["5 unidades com 100 m² no cadastro"] },
    ]);
  });
});

describe("mensagem da tela quando não há candidatos", () => {
  const SEM_RUA = "Sem o endereço não dá para saber qual é o prédio. Peça a rua e o número ao corretor.";

  it("com rua no anúncio, diz que não achou o endereço e manda conferir ou buscar", () => {
    expect(mensagemSemCandidatos("RUA TELES JUNIOR", "331")).toBe(
      "Não achamos Rua Teles Junior, 331 no cadastro disponível para o Recife. Confira o endereço com o corretor ou busque abaixo.",
    );
    expect(mensagemSemCandidatos("Estrada do Encanamento", null)).toBe(
      "Não achamos Estrada do Encanamento no cadastro disponível para o Recife. Confira o endereço com o corretor ou busque abaixo.",
    );
  });

  it("sem rua no anúncio, pede a rua e o número ao corretor", () => {
    for (const logradouro of [null, "", "   "]) expect(mensagemSemCandidatos(logradouro, "331")).toBe(SEM_RUA);
    expect(mensagemSemCandidatos(null, null)).toBe(SEM_RUA);
  });

  it("nunca as duas mensagens juntas", () => {
    expect(mensagemSemCandidatos("RUA TELES JUNIOR", "331")).not.toContain("Sem o endereço");
    expect(mensagemSemCandidatos(null, "331")).not.toContain("Não achamos");
  });
});

describe("percurso de \"Não é este (ver vizinho)\"", () => {
  /** Oito prédios em fila para o leste, a 33 m um do outro: "P0" é o mais a oeste. */
  const fila = Array.from({ length: 8 }, (_, i) =>
    clone(SOLAR, `900400-${i}`, { centro: [-34.9 + i * 0.0003, -8.04], poligono: null, logradouro: "RUA DA FILA", numero: String(i) }),
  );
  const seguir = (atual: Edificio, candidatos: Edificio[], todos: Edificio[], vezes: number) => {
    const vistosNaTela: (string | null)[] = [];
    let em = atual;
    let percurso: Percurso = PERCURSO_INICIAL;
    for (let i = 0; i < vezes; i += 1) {
      const passo = proximoDoPercurso(em, candidatos, todos, percurso);
      vistosNaTela.push(passo.edificio?.id ?? null);
      percurso = passo.percurso;
      if (!passo.edificio) break;
      em = passo.edificio;
    }
    return vistosNaTela;
  };

  it("maisProximos ordena por distância, sem o próprio prédio, e respeita o limite e as exclusões", () => {
    expect(idsDosEdificios(maisProximos(SOLAR, edificios))).toEqual(["900003-12", "900001-250", "900002-45", "900002-300"]);
    expect(idsDosEdificios(maisProximos(SOLAR, edificios, new Set(), 2))).toEqual(["900003-12", "900001-250"]);
    expect(idsDosEdificios(maisProximos(SOLAR, edificios, new Set(["900003-12"]), 2))).toEqual(["900001-250", "900002-45"]);
    expect(idsDosEdificios(maisProximos(fila[0] ?? SOLAR, fila))).toEqual(["900400-1", "900400-2", "900400-3", "900400-4", "900400-5"]);
    expect(maisProximos(SOLAR, [SOLAR])).toEqual([]);
  });

  it("percorre os candidatos na ordem e, acabados, mostra os mais próximos do atual, sem repetir", () => {
    // Candidatos: Solar e Teste 250. Do Teste 250 (onde a lista termina), por distância: Exemplo, Mar, Vila.
    const candidatos = [SOLAR, TESTE_250];
    expect(seguir(SOLAR, candidatos, edificios, 5)).toEqual([
      "900001-250", // o outro candidato
      "900003-12", // vizinhos do Teste 250, do mais perto ao mais longe
      "900002-45",
      "900002-300",
      "900001-100", // acabou: volta ao primeiro candidato
    ]);
  });

  it("com um candidato só, vai direto aos vizinhos mais próximos dele", () => {
    expect(seguir(SOLAR, [SOLAR], edificios, 5)).toEqual(["900003-12", "900001-250", "900002-45", "900002-300", "900001-100"]);
  });

  it("mostra no máximo 5 vizinhos por distância e depois recomeça", () => {
    const [primeiro, ...resto] = fila;
    if (!primeiro) throw new Error("fila vazia");
    const passos = seguir(primeiro, [primeiro], fila, 7);
    expect(passos).toEqual(["900400-1", "900400-2", "900400-3", "900400-4", "900400-5", "900400-0", "900400-1"]);
    expect(passos).not.toContain("900400-6");
    expect(resto).toHaveLength(7);
  });

  it("nenhum prédio se repete dentro de uma volta", () => {
    const candidatos = [SOLAR, MAR];
    const volta = seguir(SOLAR, candidatos, edificios, 4);
    expect(new Set([SOLAR.id, ...volta]).size).toBe(volta.length + 1);
  });

  it("sem candidatos (prédio escolhido na busca), mostra os mais próximos dele e volta a ele", () => {
    const volta = seguir(MAR, [], edificios, 5);
    // Vila (84 m), Teste 250 (142 m), Solar (212 m), Exemplo (237 m); acabados, volta ao Mar.
    expect(volta).toEqual(["900002-300", "900001-250", "900001-100", "900003-12", "900002-45"]);
    const metros = volta.slice(0, 4).flatMap((id) => (id ? [distanciaEmMetros(MAR.centro, achar(id).centro)] : []));
    expect(metros).toHaveLength(4);
    expect(metros).toEqual([...metros].sort((a, b) => a - b));
  });

  it("depois de escolher outro prédio no mapa, os vizinhos saem dele e não repetem o que já foi visto", () => {
    const antes = proximoDoPercurso(SOLAR, [SOLAR], edificios).percurso; // viu o Solar; o próximo seria o Exemplo
    expect(antes.fila).not.toBeNull();
    const aposTocar = aposEscolha(antes, SOLAR.id);
    expect(aposTocar.fila).toBeNull();
    expect(aposTocar.vistos).toEqual(["900001-100"]);
    const passo = proximoDoPercurso(MAR, [SOLAR], edificios, aposTocar);
    expect(passo.edificio?.id).toBe("900002-300"); // o mais perto do Mar; o Solar já foi visto
    expect(passo.percurso.vistos).toEqual(["900001-100", "900002-45"]);
  });

  it("índice com um prédio só: não há outro para mostrar", () => {
    expect(proximoDoPercurso(SOLAR, [SOLAR], [SOLAR]).edificio).toBeNull();
    expect(proximoDoPercurso(SOLAR, [], [SOLAR]).edificio).toBeNull();
  });
});

describe("mapa do prédio: lotes vizinhos acessíveis", () => {
  const renderizar = (aoEscolher: (e: Edificio) => void) => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(MapaDoPredio, { selecionado: SOLAR, outros: edificios, aoEscolher })),
      );
    });
    return arvore;
  };
  // Os Pressable do mapa: componentes com onPress e papel de botão (os nós nativos vêm logo abaixo deles).
  const botoes = (arvore: TestRenderer.ReactTestRenderer) =>
    arvore.root.findAll(
      (n) => typeof n.type !== "string" && n.props.accessibilityRole === "button" && typeof n.props.onPress === "function",
    );
  const ESCONDEM = (n: ReactTestInstance) =>
    n.props.accessible === true ||
    n.props.accessibilityElementsHidden === true ||
    n.props["aria-hidden"] === true ||
    n.props.importantForAccessibility === "no-hide-descendants";

  it("cada lote vizinho tocável é um botão com o rótulo \"Prédio vizinho: {endereço}\"", () => {
    const arvore = renderizar(() => undefined);
    // SOLAR enquadra Exemplo (60 m ao norte) e Teste 250 (80 m ao sul); o Mar e a Vila estão longe.
    const lista = botoes(arvore);
    expect(lista.map((b) => [b.props.accessibilityRole, b.props.accessibilityLabel])).toEqual([
      ["button", "Prédio vizinho: Rua do Teste Sintetico, 250"],
      ["button", "Prédio vizinho: Travessa do Exemplo, 12"],
    ]);
    expect(rotuloDoLoteVizinho(EXEMPLO)).toBe("Prédio vizinho: Travessa do Exemplo, 12");
    // No que o leitor de tela enxerga (o nó nativo), o botão é acessível, com o mesmo papel e rótulo.
    for (const b of lista) {
      const nativo = b.findAll((n) => typeof n.type === "string" && n.props.accessibilityRole === "button");
      expect(nativo.length).toBeGreaterThan(0);
      expect(nativo[0]?.props.accessible).toBe(true);
      expect(nativo[0]?.props.accessibilityLabel).toBe(b.props.accessibilityLabel);
    }
  });

  it("nenhum contêiner do botão é acessível nem esconde os filhos", () => {
    const arvore = renderizar(() => undefined);
    const lista = botoes(arvore);
    expect(lista.length).toBeGreaterThan(0);
    for (const b of lista) {
      let pai: ReactTestInstance | null = b.parent;
      while (pai) {
        expect([pai.type, ESCONDEM(pai)]).toEqual([pai.type, false]);
        pai = pai.parent;
      }
    }
  });

  it("tocar no lote escolhe aquele prédio", () => {
    const escolhidos: string[] = [];
    const arvore = renderizar((e) => escolhidos.push(e.id));
    const [sul, norte] = botoes(arvore);
    act(() => sul?.props.onPress());
    act(() => norte?.props.onPress());
    expect(escolhidos).toEqual(["900001-250", "900003-12"]);
  });

  it("as cores vêm dos tokens do tema", () => {
    const arvore = renderizar(() => undefined);
    const raiz = arvore.root;
    expect(raiz.findAll((n) => n.props.fill === CORES_CLARO["cor-acao"]).length).toBeGreaterThan(0);
    expect(raiz.findAll((n) => n.props.stroke === CORES_CLARO["cor-azul-cadastral"]).length).toBeGreaterThan(0);
    expect(raiz.findAll((n) => n.props.stroke === CORES_CLARO["cor-superficie"]).length).toBeGreaterThan(0);
    const fundos = raiz.findAll((n) => n.props.style?.backgroundColor === CORES_CLARO["cor-azul-cadastral-suave"]);
    expect(fundos.length).toBeGreaterThan(0);
  });

  it("o código do mapa não tem cor solta", () => {
    const fonte = readFileSync(join(__dirname, "../src/componentes/predio/MapaDoPredio.tsx"), "utf8");
    expect(fonte.match(/#[0-9A-Fa-f]{3,8}\b/g)).toBeNull();
    expect(fonte.match(/rgba?\(/g)).toBeNull();
  });
});

describe("normalizar", () => {
  it("tira acento, caixa e pontuação", () => {
    expect(normalizar("  Júnior, 331! ")).toBe("junior 331");
    expect(normalizar("EDF.  PARADOR  DE  CERVANTES")).toBe("edf parador de cervantes");
  });
});

describe("textos da tela do prédio", () => {
  it("a chave cadastral sai como D.SSSS.QQQ.FF.LLLL", () => {
    expect(formatarChaveCadastral("61755015020005")).toBe("6.1755.015.02.0005");
    expect(formatarChaveCadastral("99999900100001")).toBe("9.9999.900.10.0001");
    expect(formatarChaveCadastral(null)).toBeNull();
    expect(formatarChaveCadastral("1234567890123")).toBeNull();
    expect(formatarChaveCadastral("0617800412020327")).toBeNull(); // 16 dígitos não é chave
    expect(formatarChaveCadastral("6.1755.015.02.0005")).toBeNull();
  });

  it("o endereço sai em caixa de título", () => {
    expect(enderecoEmCaixaDeTitulo("RUA TELES JUNIOR", "331")).toBe("Rua Teles Junior, 331");
    expect(enderecoEmCaixaDeTitulo("AV SANTOS DUMONT", "267")).toBe("Avenida Santos Dumont, 267");
    expect(enderecoEmCaixaDeTitulo("RUA DA HORA", null)).toBe("Rua da Hora");
    expect(enderecoEmCaixaDeTitulo("R DOS TESTES E OUTROS", " 5 ")).toBe("Rua dos Testes e Outros, 5");
    expect(enderecoEmCaixaDeTitulo("TRAVESSA DO EXEMPLO", "12")).toBe("Travessa do Exemplo, 12");
  });

  it("o resumo omite o que o cadastro não tem, sem inventar zero", () => {
    expect(resumoDoPredio(SOLAR)).toBe("24 unidades · construído em 2008 · padrão médio · 12 pavimentos");
    expect(resumoDoPredio(EXEMPLO)).toBe("2 unidades · construído em 2009");
    expect(resumoDoPredio({ ...SOLAR, pavimentos: 1, anoConstrucao: null })).toBe("24 unidades · padrão médio · 1 pavimento");
  });

  it("a linha de resultado junta endereço e nome", () => {
    expect(linhaDeResultado(SOLAR)).toBe("Rua do Teste Sintetico, 100 · Solar do Gayppio");
    expect(linhaDeResultado(TESTE_250)).toBe("Rua do Teste Sintetico, 250");
  });
});

describe("projeção local do mapa", () => {
  it("1 milésimo de grau de latitude são cerca de 111 m, e o norte vai para cima da tela", () => {
    const projetar = projetorLocal([-34.9, -8.04]);
    const [origemX, origemY] = projetar([-34.9, -8.04]);
    expect(origemX).toBeCloseTo(0, 9);
    expect(origemY).toBeCloseTo(0, 9);
    const [x, y] = projetar([-34.9, -8.039]);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(-111.19, 1);
    const [leste] = projetar([-34.899, -8.04]);
    expect(leste).toBeCloseTo(111.19 * Math.cos((8.04 * Math.PI) / 180), 1);
    expect(distanciaEmMetros([-34.9, -8.04], [-34.9, -8.039])).toBeCloseTo(111.19, 1);
  });

  it("enquadra o selecionado e os vizinhos mais próximos dentro da área de desenho", () => {
    const cena = montarCena(SOLAR, edificios, { largura: 400, altura: 180, reservaInferior: 40 });
    expect(cena.pino).toEqual(cena.selecionado.centro);
    expect(cena.selecionado.pontos).toHaveLength(4);
    for (const [x, y] of cena.selecionado.pontos ?? []) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(400);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(140);
    }
    // Exemplo (norte, 60 m) e Teste 250 (sul, 80 m) estão a menos de 140 m; os outros dois, não.
    expect(cena.vizinhos.map((v) => v.id)).toEqual(["900003-12", "900001-250"]);
    expect(cena.vizinhos.map((v) => v.id)).not.toContain("900001-100");
    const norte = cena.vizinhos[0];
    const sul = cena.vizinhos[1];
    expect(norte && norte.centro[1] < cena.pino[1]).toBe(true);
    expect(sul && sul.centro[1] > cena.pino[1]).toBe(true);
  });

  it("um raio maior traz os outros lotes; o leste fica à direita", () => {
    const cena = montarCena(SOLAR, edificios, { raioMaximoM: 400, paraEnquadrar: 4 });
    expect(cena.vizinhos.map((v) => v.id)).toHaveLength(4);
    const mar = cena.vizinhos.find((v) => v.id === "900002-45");
    expect(mar && mar.centro[0] > cena.pino[0]).toBe(true);
  });

  it("prédio sem polígono vira círculo e prédio isolado não aparece gigante", () => {
    const cena = montarCena(VILA, [VILA], { largura: 400, altura: 180, reservaInferior: 40 });
    expect(cena.selecionado.pontos).toBeNull();
    expect(cena.vizinhos).toEqual([]);
    expect(cena.metrosPorUnidade).toBeCloseTo(70 / 376, 3);
    const raio = raioSemPoligono(cena, true);
    expect(raio).toBeGreaterThanOrEqual(11);
    expect(raio).toBeLessThanOrEqual(22);
    expect(raioSemPoligono(cena, false)).toBeLessThan(raio);
  });

  it("a mesma entrada dá a mesma cena", () => {
    expect(montarCena(MAR, edificios)).toEqual(montarCena(MAR, edificios));
  });
});

// indice.ts lê os cinco JSON de src/dados/recife/indice/ por `require`. Aqui eles são simulados (módulos virtuais)
// com a fixture sintética, de modo que o teste não depende do índice gerado nem o toca.
describe("indice.ts com JSON simulado", () => {
  const virtual = { virtual: true } as const;
  const caminho = (nome: string) => `../src/dados/recife/${DIRETORIO_DO_INDICE}/${nome}.json`;
  const doBairro = (slug: string) => ({
    ...indiceBruto,
    bairro: slug,
    contexto: { ...indiceBruto.contexto, bairro: slug },
    edificios: indiceBruto.edificios.map((e) => ({ ...e, id: `${slug.length}${e.id}`, bairro: slug })),
  });
  const meta = {
    geradoEm: "2026-01-01T00:00:00Z",
    fontes: [
      {
        chave: "iptu_2026", nome: "Fonte sintética", orgao: "Teste", licenca: "ODbL", url: "https://exemplo.invalido/dados",
        recursos: ["recurso"], modificadoEm: null, consultadoEm: "2026-01-01", registrosLidos: 1, colunasUsadas: ["logradouro"],
      },
    ],
  };
  type Modulo = typeof import("../src/dados/recife/indice");
  // `require` e não `import`: cada teste precisa de uma cópia nova do módulo, depois dos mocks.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const carregarModulo = (): Modulo => require("../src/dados/recife/indice") as Modulo;

  it("valida no primeiro acesso, guarda em memória e acha edifício por id", () => {
    jest.isolateModules(() => {
      for (const slug of ["boa-viagem", "casa-forte", "espinheiro", "madalena"]) jest.doMock(caminho(slug), () => doBairro(slug), virtual);
      jest.doMock(caminho("gracas"), () => indiceBruto, virtual);
      jest.doMock(caminho("meta"), () => meta, virtual);
      const m = carregarModulo();
      expect(m.edificiosDoBairro("gracas")).toHaveLength(5);
      expect(m.edificiosDoBairro("gracas")).toBe(m.edificiosDoBairro("gracas"));
      expect(m.contextoDoBairro("gracas").edificios).toBe(5);
      expect(m.indiceDoBairro("gracas").geradoEm).toBe("2026-01-01T00:00:00Z");
      expect(m.edificioPorId("900001-100")?.nome).toBe("Solar do Gayppio");
      expect(m.edificioPorId("900001-100", "gracas")?.id).toBe("900001-100");
      expect(m.edificioPorId("900001-100", "madalena")).toBeNull();
      expect(m.edificioPorId("0-0")).toBeNull();
      expect(m.META.geradoEm).toBe("2026-01-01T00:00:00Z");
      expect(m.META.fontes).toHaveLength(1);
    });
  });

  it("arquivo inválido lança erro claro com o campo que falhou; importar o módulo não lança", () => {
    jest.isolateModules(() => {
      jest.doMock(caminho("casa-forte"), () => ({ bairro: "casa-forte", edificios: [{ id: "1-1" }] }), virtual);
      jest.doMock(caminho("meta"), () => ({ fontes: [] }), virtual);
      const m = carregarModulo();
      expect(() => m.edificiosDoBairro("casa-forte")).toThrow(/Índice cadastral inválido em casa-forte\.json \(\d+ problemas?; primeiro em /);
      expect(() => m.META.geradoEm).toThrow(/meta\.json/);
    });
  });

  it("arquivo de outro bairro no lugar errado é recusado", () => {
    jest.isolateModules(() => {
      jest.doMock(caminho("madalena"), () => indiceBruto, virtual);
      expect(() => carregarModulo().edificiosDoBairro("madalena")).toThrow(/diz ser do bairro "gracas"/);
    });
  });

  it("um bairro inválido não esconde o id achado em outro, mas lança se o id não aparece", () => {
    jest.isolateModules(() => {
      for (const slug of ["boa-viagem", "casa-forte", "espinheiro", "madalena"]) {
        jest.doMock(caminho(slug), () => (slug === "boa-viagem" ? { quebrado: true } : doBairro(slug)), virtual);
      }
      jest.doMock(caminho("gracas"), () => indiceBruto, virtual);
      const m = carregarModulo();
      expect(m.edificioPorId("900001-100")?.id).toBe("900001-100");
      expect(() => m.edificioPorId("0-0")).toThrow(/boa-viagem\.json/);
    });
  });
});

// A tela inteira (src/app/(abas)/predio.tsx), com os contextos de análises e carteira, o roteador e o índice
// simulados: o do bairro é a fixture sintética. Tudo é carregado dentro do isolateModules para o React ser um só.
describe("tela do prédio, de ponta a ponta", () => {
  const virtual = { virtual: true } as const;
  const rotuloVizinho = "Não é este (ver vizinho)";
  const instante = "2026-10-20T12:00:00.000Z";
  const v = (valor: number | null) => ({ valor, origem: "texto" as const, aConfirmar: false });

  function analiseDe(parcial: Partial<AnaliseV2>): AnaliseV2 {
    return {
      versao: 2, id: "analise-do-predio", criadaEm: instante, atualizadaEm: instante, nome: "Apartamento de teste",
      modalidade: "aluguel", tipologia: "apartamento", url: "", bairroTexto: "Graças", bairro: "gracas",
      logradouro: null, numero: null, nomeEdificio: null, extracao: null,
      declarados: {
        preco: v(4500), condominio: v(null), iptu: { ...v(null), periodo: "desconhecido" }, seguroIncendio: v(null),
        taxaServico: v(null), outros: v(null), area: v(null), quartos: v(null), suites: v(null), banheiros: v(null),
        vagas: v(null), andar: v(null),
      },
      vinculo: { estado: "pendente" },
      visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
      salva: true, descarte: null,
      ...parcial,
    };
  }

  type Aberta = {
    texto: () => string;
    botoes: () => string[];
    tocar: (rotulo: string) => void;
    /** Toca no elemento com este `accessibilityLabel` (resultado da busca, lote do mapa). */
    tocarPeloRotuloAcessivel: (rotulo: string) => void;
    escrever: (texto: string) => void;
  };

  /**
   * Abre a tela e entrega o controle a `roteiro`, ainda dentro do isolateModules: o RN carrega módulos sob demanda
   * (inline requires), e uma nova renderização fora do isolamento pegaria outra cópia do React.
   */
  function abrir(analise: AnaliseV2, roteiro: (tela: Aberta) => void): void {
    jest.isolateModules(() => {
      jest.doMock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => ({}) }), virtual);
      jest.doMock("../src/estado/Analises", () => ({
        useAnalises: () => ({ lista: [analise], pronto: true, analiseAtiva: analise, salvar: async () => undefined }),
      }));
      jest.doMock("../src/estado/Carteira", () => ({
        useCarteira: () => ({ saldo: 3, recarregarTeste: async () => undefined, debitarDossie: async () => true }),
      }));
      jest.doMock("../src/componentes/Tela", () => ({ Tela: ({ children }: { children: unknown }) => children }));
      jest.doMock("../src/componentes/predio/GavetaSemCreditos", () => ({ GavetaSemCreditos: () => null }));
      jest.doMock(caminhoDoJson("gracas"), () => indiceBruto, virtual);
      /* eslint-disable @typescript-eslint/no-require-imports */
      const ReactIsolado = require("react") as typeof import("react");
      const Renderizador = require("react-test-renderer") as typeof import("react-test-renderer");
      const { TemaDoApp: Tema } = require("../src/tema/Tema") as typeof import("../src/tema/Tema");
      const Tela = (require("../src/app/(abas)/predio") as { default: () => React.ReactElement }).default;
      /* eslint-enable @typescript-eslint/no-require-imports */
      let arvore!: TestRenderer.ReactTestRenderer;
      Renderizador.act(() => {
        arvore = Renderizador.create(ReactIsolado.createElement(Tema, null, ReactIsolado.createElement(Tela)));
      });
      const textosDe = (no: ReactTestInstance): string[] =>
        no.findAll((n) => (n.type as unknown) === "Text").map((n) => n.children.map((c) => (typeof c === "string" ? c : textosDe(c).join(""))).join(""));
      roteiro({
        texto: () => textosDe(arvore.root).join("\n"),
        botoes: () => arvore.root.findAll((n) => typeof n.props.rotulo === "string").map((n) => n.props.rotulo as string),
        tocar: (rotulo) => {
          const botao = arvore.root.findAll((n) => n.props.rotulo === rotulo && typeof n.props.onPress === "function")[0];
          if (!botao) throw new Error(`Sem botão "${rotulo}" na tela`);
          Renderizador.act(() => botao.props.onPress());
        },
        tocarPeloRotuloAcessivel: (rotulo) => {
          const alvo = arvore.root.findAll((n) => n.props.accessibilityLabel === rotulo && typeof n.props.onPress === "function")[0];
          if (!alvo) throw new Error(`Sem elemento "${rotulo}" na tela`);
          Renderizador.act(() => alvo.props.onPress());
        },
        escrever: (texto) => {
          const campo = arvore.root.findAll((n) => typeof n.props.onChangeText === "function")[0];
          if (!campo) throw new Error("Sem campo de busca na tela");
          Renderizador.act(() => campo.props.onChangeText(texto));
        },
      });
    });
  }
  const caminhoDoJson = (slug: string) => `../src/dados/recife/${DIRETORIO_DO_INDICE}/${slug}.json`;

  it("sem candidatos e com rua no anúncio: só a mensagem de endereço não achado", () => {
    abrir(analiseDe({ logradouro: "RUA QUE NAO EXISTE", numero: "999" }), (tela) => {
      const texto = tela.texto();
      expect(texto).toContain(
        "Não achamos Rua Que Nao Existe, 999 no cadastro disponível para o Recife. Confira o endereço com o corretor ou busque abaixo.",
      );
      expect(texto).not.toContain("Sem o endereço não dá para saber");
      expect(tela.botoes()).not.toContain(rotuloVizinho);
    });
  });

  it("sem candidatos e sem rua no anúncio: só a mensagem de pedir o endereço ao corretor", () => {
    abrir(analiseDe({ logradouro: null, numero: null }), (tela) => {
      const texto = tela.texto();
      expect(texto).toContain("Sem o endereço não dá para saber qual é o prédio. Peça a rua e o número ao corretor.");
      expect(texto).not.toContain("Não achamos");
    });
  });

  it("\"Não é este (ver vizinho)\" está na tela mesmo com um candidato só e mostra o vizinho mais próximo", () => {
    // Nome do edifício e nenhuma outra pista: o Solar do Gayppio é o único candidato.
    abrir(analiseDe({ nomeEdificio: "Solar do Gayppio" }), (tela) => {
      expect(tela.texto()).toContain("Solar do Gayppio");
      expect(tela.botoes().filter((r) => r === rotuloVizinho)).toHaveLength(1);
      tela.tocar(rotuloVizinho);
      // O mais próximo do Solar é a Travessa do Exemplo (sem nome no cadastro: o título é o endereço).
      expect(tela.texto().split("\n")).toContain("Travessa do Exemplo, 12");
      // Quem mostrou o vizinho foi o botão, não a pessoa.
      expect(tela.texto()).toContain("Prédio vizinho no cadastro");
      expect(tela.texto()).not.toContain("Escolhido por você");
      expect(tela.botoes().filter((r) => r === rotuloVizinho)).toHaveLength(1);
    });
  });

  it("percorre os candidatos, depois os mais próximos por distância, e volta ao primeiro; o botão não some nem muda", () => {
    // Rua do Teste Sintetico, 100: o Solar (150 pontos) e o 250 (só a rua, 50) são os candidatos.
    abrir(analiseDe({ logradouro: "RUA DO TESTE SINTETICO", numero: "100" }), (tela) => {
      const nomes = ["Solar do Gayppio", "Rua do Teste Sintetico, 250", "Travessa do Exemplo, 12", "Mar Ficticio", "Vila Beta"];
      const naTela = () => nomes.filter((nome) => tela.texto().split("\n").includes(nome));
      expect(naTela()).toEqual(["Solar do Gayppio"]);
      const percurso: string[][] = [];
      for (let i = 0; i < 5; i += 1) {
        tela.tocar(rotuloVizinho);
        percurso.push(naTela());
        expect(tela.botoes().filter((r) => r === rotuloVizinho)).toHaveLength(1);
      }
      // Candidatos: Solar, Teste 250. Acabados, os mais próximos do Teste 250: Exemplo, Mar, Vila. Depois, o Solar.
      expect(percurso).toEqual([
        ["Rua do Teste Sintetico, 250"],
        ["Travessa do Exemplo, 12"],
        ["Mar Ficticio"],
        ["Vila Beta"],
        ["Solar do Gayppio"],
      ]);
    });
  });

  it("um prédio escolhido na busca também tem \"Não é este (ver vizinho)\"", () => {
    abrir(analiseDe({ logradouro: "RUA QUE NAO EXISTE", numero: "999" }), (tela) => {
      expect(tela.botoes()).not.toContain(rotuloVizinho);
      tela.escrever("vila beta");
      tela.tocarPeloRotuloAcessivel("Escolher Avenida Sintetica Alfa, 300 · Vila Beta");
      expect(tela.texto().split("\n")).toContain("Vila Beta");
      expect(tela.texto()).toContain("Escolhido por você");
      expect(tela.botoes().filter((r) => r === rotuloVizinho)).toHaveLength(1);
      // Sem candidatos, os vizinhos saem do prédio escolhido: o Mar Ficticio (84 m) é o primeiro.
      tela.tocar(rotuloVizinho);
      expect(tela.texto().split("\n")).toContain("Mar Ficticio");
    });
  });
});

describe("busca com o endereço colado do anúncio", () => {
  const ed = edificiosDoBairro("gracas");
  it.each([
    "Rua Esmeraldino Bandeira, 411 - Graças, Recife - PE",
    "Rua Esmeraldino Bandeira, 411, Graças, Recife, PE, 52011-000",
    "Esmeraldino Bandeira 411 - Gracas",
  ])("%s acha o 411", (texto) => {
    expect(buscarPorEndereco(texto, ed)[0]).toMatchObject({ logradouro: "RUA ESMERALDINO BANDEIRA", numero: "411" });
  });
  it("tirar o fecho não apaga rua com nome de bairro no meio", () => {
    expect(enderecoSemFecho("Rua das Graças, 100 - Graças, Recife - PE")).toBe("Rua das Graças  100");
  });
});
