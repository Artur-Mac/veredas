import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { MapaDoLote } from "../src/componentes/dossie-v1/MapaDoLote";
import { montarCena25DDoLote } from "../src/componentes/dossie-v1/mapa";
import { OrientacaoDaJanela } from "../src/componentes/visita-v1/Orientacao";
import { esquemaEdificio, type Edificio } from "../src/dados/contratos";
import { derivarGuiaDeEstrutura, temTresSinaisCadastrais } from "../src/dados/dossie/guiaEstrutura";
import {
  alturaDoAndarM,
  alturaDoEdificioM,
  analisarJanelaNoRecife,
  analisarSolESombra,
  posicaoSolarRecife,
} from "../src/dados/dossie/solESombra";
import { TemaDoApp, TemaEscuro } from "../src/tema/Tema";

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

const PALAVRAS_PROIBIDAS = [/perigos/i, /vale a pena/i, /\bcaro\b/i, /\bcara\b/i, /barat/i, /caix[ãa]o/i, /ótim|\botim/i, /\bruim\b/i, /arriscad/i, /seguro/i];

function quadrado(lon: number, lat: number, meio = 0.00009): [number, number][] {
  return [
    [lon - meio, lat - meio],
    [lon + meio, lat - meio],
    [lon + meio, lat + meio],
    [lon - meio, lat + meio],
  ];
}

function criarEdificio(mudancas: Partial<Edificio> = {}): Edificio {
  const centro = mudancas.centro ?? [-34.9, -8.04];
  return esquemaEdificio.parse({
    id: "88001-100",
    bairro: "gracas",
    logradouro: "RUA SINTETICA DO SOL",
    numero: "100",
    dsqfl: "61755015020005",
    nome: "Edifício Aurora",
    centro,
    poligono: quadrado(centro[0], centro[1]),
    unidades: 20,
    tipologias: [{ area: 85, unidades: 20, iptuAnualMediano: 2400 }],
    anoConstrucao: 2012,
    pavimentos: 12,
    ate4Pavimentos: false,
    padrao: "Superior",
    iptuAnual: { n: 20, p25: 2200, mediana: 2400, p75: 2600 },
    itbi: null,
    obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
    ...mudancas,
  });
}

function textosDe(no: unknown): string[] {
  if (no === null || no === undefined || typeof no === "boolean") return [];
  if (typeof no === "string" || typeof no === "number") return [String(no)];
  if (Array.isArray(no)) return no.flatMap(textosDe);
  if (typeof no === "object" && "children" in no) {
    return textosDe((no as { children?: unknown }).children);
  }
  return [];
}

describe("Sol, sombra, vento Sudeste e Mapa 2.5D", () => {
  it("calcula posição solar coerente para o Recife: manhã a Leste (sombra p/ Oeste), tarde a Oeste (sombra p/ Leste)", () => {
    const manha = posicaoSolarRecife(8.5, [-34.9, -8.05], "equinocio");
    const meioDia = posicaoSolarRecife(11.4, [-34.9, -8.05], "equinocio");
    const tarde = posicaoSolarRecife(15.5, [-34.9, -8.05], "equinocio");

    expect(manha.elevacaoGraus).toBeGreaterThan(30);
    expect(manha.azimuteGraus).toBeGreaterThan(60);
    expect(manha.azimuteGraus).toBeLessThan(115);
    expect(manha.sombraPorMetro[0]).toBeLessThan(0); // sombra cai para Oeste

    expect(meioDia.elevacaoGraus).toBeGreaterThan(78); // sol quase a pino no Recife

    expect(tarde.elevacaoGraus).toBeGreaterThan(20);
    expect(tarde.azimuteGraus).toBeGreaterThan(245);
    expect(tarde.azimuteGraus).toBeLessThan(295);
    expect(tarde.sombraPorMetro[0]).toBeGreaterThan(0); // sombra cai para Leste
  });

  it("reduz horas de sol da manhã e sinaliza bloqueio de brisa Sudeste quando há torre vizinha alta colada a Leste/Sudeste", () => {
    const alvo = criarEdificio({ id: "88001-100", pavimentos: 15, centro: [-34.9, -8.04] });
    // Vizinho de 25 pavimentos (~77,5 m) cerca de 22 m a Leste-Sudeste
    const torreLeste = criarEdificio({
      id: "88001-120",
      pavimentos: 25,
      centro: [-34.89972, -8.04012],
    });

    const andarBaixo = analisarSolESombra(alvo, [torreLeste], 2, 115);
    const andarAlto = analisarSolESombra(alvo, [torreLeste], 15, null);
    const semVizinhos = analisarSolESombra(alvo, [], 2, 115);

    expect(alturaDoEdificioM(alvo)).toBe(46.5);
    expect(alturaDoAndarM(2)).toBe(7.7);
    expect(andarBaixo.horasManhaLeste).toBeLessThan(semVizinhos.horasManhaLeste);
    expect(andarBaixo.brisaSudeste.situacao).not.toBe("livre");
    expect(andarBaixo.janelaRegistrada?.recebeBrisaSudeste).toBe("reduzida_por_vizinho");

    // No 15º andar, recebe mais sol que no 2º andar
    expect(andarAlto.horasManhaLeste).toBeGreaterThanOrEqual(andarBaixo.horasManhaLeste);

    const poente = analisarJanelaNoRecife(270, { predio: alvo, vizinhos: [], andar: 8 });
    expect(poente.fachada).toContain("Poente");
    expect(poente.horasSolDireto).toBeGreaterThan(3);

    for (const t of [andarBaixo.manchete, andarBaixo.detalhe, poente.resumoHumano, poente.dicaPratica]) {
      for (const p of PALAVRAS_PROIBIDAS) expect(t).not.toMatch(p);
    }
  });

  it("gera cena 2.5D com sombra projetada, etiqueta de altura e cota do andar, e alterna horários no MapaDoLote", () => {
    const alvo = criarEdificio({ pavimentos: 14 });
    const vizinho = criarEdificio({ id: "88001-200", pavimentos: 8, centro: [-34.9003, -8.0402] });

    const cenaManha = montarCena25DDoLote(alvo, [], [vizinho], 320, 280, "manha", 6);
    const cenaTarde = montarCena25DDoLote(alvo, [], [vizinho], 320, 280, "tarde", 6);

    expect(cenaManha.volumes).toHaveLength(2);
    const volAlvo = cenaManha.volumes.find((v) => v.alvo);
    expect(volAlvo?.faixaDoAndar).not.toBeNull();
    expect(volAlvo?.sombra.length).toBeGreaterThan(1);
    expect(volAlvo?.etiquetaAltura?.texto).toBe("43m");
    expect(cenaManha.volumes[0]?.sombra[0]).not.toBe(cenaTarde.volumes[0]?.sombra[0]);

    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(MapaDoLote, { predio: alvo, obras: [], vizinhos: [vizinho], andar: 6 })),
      );
    });
    const quadro25d = arvore.root.findAll((n) => n.props.role === "img")[0];
    expect(String(quadro25d?.props.accessibilityLabel ?? "")).not.toContain("em volume 3D com sombra projetada");

    // Alterna para Planta 2D
    const botaoPlanta = arvore.root.findAll((n) => n.props.accessibilityLabel === "Ver mapa: Planta 2D")[0];
    expect(botaoPlanta).toBeDefined();
    act(() => {
      (botaoPlanta?.props.onPress as () => void)();
    });
    const quadro2d = arvore.root.findAll((n) => n.props.role === "img")[0];
    expect(String(quadro2d?.props.accessibilityLabel ?? "")).not.toContain("em volume 3D com sombra projetada");
  });

  it("exibe atalhos rápidos na OrientacaoDaJanela e traduz Poente/Nascente na visita", () => {
    let grausAtual: number | null = null;
    let arvore!: TestRenderer.ReactTestRenderer;
    const renderizar = (g: number | null) =>
      React.createElement(
        TemaDoApp,
        null,
        React.createElement(
          TemaEscuro,
          null,
          React.createElement(OrientacaoDaJanela, {
            graus: g,
            aoMudar: (novo) => {
              grausAtual = novo;
            },
            predio: criarEdificio(),
            vizinhos: [],
            andar: 5,
          }),
        ),
      );

    act(() => {
      arvore = TestRenderer.create(renderizar(null));
    });
    const atalhoPoente = arvore.root.findAll((n) => n.props.accessibilityLabel === "Apontar janela para Poente · O")[0];
    expect(atalhoPoente).toBeDefined();
    act(() => {
      (atalhoPoente?.props.onPress as () => void)();
    });
    expect(grausAtual).toBe(270);

    act(() => {
      arvore.update(renderizar(270));
    });
    const textos = textosDe(arvore.toJSON()).join(" ");
    expect(textos).toContain("Poente (Oeste)");
    expect(textos).toContain("sol direto à tarde");
  });
});

describe("Guia visual de estrutura (3 sinais cadastrais)", () => {
  it("aciona exclusivamente quando coexistem até 4 pavimentos, construção anterior a 2005 e padrão Simples/Médio", () => {
    const comSinais = criarEdificio({ pavimentos: 4, ate4Pavimentos: true, anoConstrucao: 1988, padrao: "Médio" });
    expect(temTresSinaisCadastrais(comSinais)).toBe(true);

    const guia = derivarGuiaDeEstrutura(comSinais, {
      rua: {
        grupos: [],
        defesaCivil: { rua: "Rua Sintetica", atendimentos: 2, anos: "2021 e 2023", resposta: null },
      },
    });
    expect(guia).not.toBeNull();
    expect(guia?.pontosDaVisita).toHaveLength(3);
    expect(guia?.contextoDefesaCivil).toContain("2 registros da Defesa Civil");

    // Falta de qualquer um dos 3 sinais desliga completamente o guia
    expect(derivarGuiaDeEstrutura(criarEdificio({ pavimentos: 5, ate4Pavimentos: false, anoConstrucao: 1988, padrao: "Médio" }))).toBeNull();
    expect(derivarGuiaDeEstrutura(criarEdificio({ pavimentos: 4, ate4Pavimentos: true, anoConstrucao: 2006, padrao: "Médio" }))).toBeNull();
    expect(derivarGuiaDeEstrutura(criarEdificio({ pavimentos: 4, ate4Pavimentos: true, anoConstrucao: 1988, padrao: "Superior" }))).toBeNull();

    // Nenhuma palavra proibida
    const todoTexto = [
      guia!.titulo,
      guia!.explicacaoSimples,
      guia!.sinaisNoCadastro,
      guia!.avisoDeEscopo,
      guia!.contextoDefesaCivil ?? "",
      ...guia!.pontosDaVisita.flatMap((p) => [p.ondeOlhar, p.oQueObservar]),
    ].join("\n");
    for (const p of PALAVRAS_PROIBIDAS) expect(todoTexto).not.toMatch(p);
  });
});
