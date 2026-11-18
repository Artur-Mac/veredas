import { describe, expect, it } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { inferirFachadasDoEdificio } from "../src/dados/sol/inferirFachadas";
import { avaliarConfortoTermico } from "../src/dados/clima/confortoTermico";
import { avaliarBioclimatico3d } from "../src/municipios/recife/motores/bioclimatico3d";
import { avaliarAcustica3d } from "../src/nucleo/motores/acustica3d";
import { TemaDoApp } from "../src/tema/Tema";
import { CanvasSolSombraBrisa25D } from "../src/componentes/visual/CanvasSolSombraBrisa25D";
import { TermometroConfortoTermico } from "../src/componentes/visual/TermometroConfortoTermico";
import { PlacarHeroi5Segundos } from "../src/componentes/visual/PlacarHeroi5Segundos";
import { TresPerguntasDoBolso } from "../src/componentes/visual/TresPerguntasDoBolso";
import { MatrizVisualComparar } from "../src/componentes/visual/MatrizVisualComparar";

function extrairTextos(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
  if (!node) return "";
  if (Array.isArray(node)) return node.flatMap(extrairTextos).join(" | ");
  const out: string[] = [];
  for (const c of node.children ?? []) {
    if (typeof c === "string") out.push(c);
    else out.push(extrairTextos(c));
  }
  return out.join(" | ");
}

describe("Teste dos Gêmeos Intra-Prédio (Unidade 202 Poente vs Unidade 1401 Nascente-Sul)", () => {
  // Torre em Boa Viagem orientada N-S, frente voltada para Leste (~90°, Rua à frente, Poente atrás)
  const centro: [number, number] = [-34.896, -8.121];
  const poligono: [number, number][] = [
    [-34.8961, -8.12108],
    [-34.8959, -8.12108],
    [-34.8959, -8.12092],
    [-34.8961, -8.12092],
  ];

  // Vizinhos na mesma rua ao Norte e ao Sul e do outro lado da via a Leste
  const vizinhosMesmaRua = [
    {
      id: "60461-110",
      logradouro: "AV BOA VIAGEM",
      centro: [-34.896, -8.1206] as [number, number],
      pavimentos: 12,
      poligono: null,
    },
    {
      id: "60461-130",
      logradouro: "AV BOA VIAGEM",
      centro: [-34.896, -8.1214] as [number, number],
      pavimentos: 14,
      poligono: null,
    },
    {
      id: "60461-125",
      logradouro: "AV BOA VIAGEM",
      centro: [-34.89578, -8.121] as [number, number], // outro lado da rua (+x = Leste)
      pavimentos: 10,
      poligono: null,
    },
  ];

  it("infere automaticamente Frente Rua Nascente e Fundos Poente usando vizinhos e geometria", () => {
    const inf = inferirFachadasDoEdificio({
      edificio: {
        id: "60461-120",
        bairro: "boa-viagem",
        logradouro: "AV BOA VIAGEM",
        centro,
        poligono,
      },
      vizinhosDoBairro: vizinhosMesmaRua,
      textoAnuncio: "Apartamento amplo 3 quartos Boa Viagem",
    });

    expect(inf.frente.grupoSolar).toBe("Nascente");
    expect(inf.fundos.grupoSolar).toBe("Poente");
    expect(inf.confianca).toBe("media_pela_rua");
    expect(inf.resumoAutomatico).toMatch(/Frente do prédio é Nascente.*Fundos são Poente/);
  });

  it("diferencia materialmente Apê 202 (2º andar Poente) vs Apê 1401 (14º andar Nascente) na mesma torre", () => {
    const inf = inferirFachadasDoEdificio({
      edificio: {
        id: "60461-120",
        bairro: "boa-viagem",
        logradouro: "AV BOA VIAGEM",
        centro,
        poligono,
      },
      vizinhosDoBairro: vizinhosMesmaRua,
    });

    const fac202 = inf.fundos; // Poente (~270°)
    const fac1401 = inf.frente; // Nascente (~90°)

    const bio202 = avaliarBioclimatico3d({
      fachadaAzimuteGraus: fac202.azimuteGraus,
      andar: 2,
      lstDeltaIlhaCalorC: 0.9,
    });
    const bio1401 = avaliarBioclimatico3d({
      fachadaAzimuteGraus: fac1401.azimuteGraus,
      andar: 14,
      lstDeltaIlhaCalorC: 0.9,
    });

    const conforto202 = avaliarConfortoTermico({
      andar: 2,
      pavimentosTotais: 16,
      fachada: fac202,
      bioclimatico: bio202,
      diferencaBairroCalorC: 0.9,
    });
    const conforto1401 = avaliarConfortoTermico({
      andar: 14,
      pavimentosTotais: 16,
      fachada: fac1401,
      bioclimatico: bio1401,
      diferencaBairroCalorC: 0.9,
    });

    const acustica202 = avaliarAcustica3d({
      andar: 2,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "arterial_principal",
      distanciaViaM: 10,
      anoConstrucao: 2010,
      precoImovelReais: 680_000,
    });
    const acustica1401 = avaliarAcustica3d({
      andar: 14,
      fachadaVoltadaParaVia: "fundos",
      tipologiaVia: "arterial_principal",
      distanciaViaM: 10,
      anoConstrucao: 2010,
      precoImovelReais: 680_000,
    });

    // Verificacoes fisicas e financeiras entre irmaos na mesma torre
    expect(bio202.exposicaoPoente).toBe(true);
    expect(bio1401.exposicaoPoente).toBe(false);
    expect(conforto202.indiceCalor0a100).toBeGreaterThan(conforto1401.indiceCalor0a100 + 30);
    expect(["quente_tarde", "tende_abafar"]).toContain(conforto202.zona);
    expect(["fresco_ventilado", "clima_agradavel"]).toContain(conforto1401.zona);
    expect(conforto202.custoMensalArReais).toBeGreaterThan(conforto1401.custoMensalArReais + 60);
    expect(acustica202.ruidoInternoDormitorioDbA).toBeGreaterThan(acustica1401.ruidoInternoDormitorioDbA + 8);

    // Renderizar telas lado a lado e conferir diferenciadores claros na UI
    let tree202!: TestRenderer.ReactTestRenderer;
    let tree1401!: TestRenderer.ReactTestRenderer;
    let treeMatriz!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree202 = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(PlacarHeroi5Segundos, {
            modalidade: "compra",
            precoPrincipalReais: 680_000,
            mensalBolsoRealReais: 6_250,
            dinheiroParaEntrarReais: 155_000,
            comparacaoM2Pct: 4,
            orientacaoCurta: fac202.orientacaoSolar,
            conforto: conforto202,
            ruidoDormitorioDb: acustica202.ruidoInternoDormitorioDbA,
          }),
          React.createElement(TermometroConfortoTermico, { conforto: conforto202, andar: 2 }),
          React.createElement(TresPerguntasDoBolso, {
            modalidade: "compra",
            nomeImovel: "Apê 202 Poente",
            enderecoImovel: "Av. Boa Viagem, 120",
            precoAnuncioReais: 680_000,
            aluguelAnunciadoReais: null,
            condominioMensalReais: 1_100,
            iptuMensalReais: 280,
            prestacaoEstimadaReais: 4_600,
            entradaReais: 136_000,
            itbiReais: 8_500,
            spuAnualReais: 0,
            custoMensalArReais: conforto202.custoMensalArReais,
            economiaLegalItbiReais: 14_000,
            descontoRuidoReais: acustica202.descontoHedonicoEstimadoReais ?? 18_000,
            vplCalorPoenteReais: bio202.vpl10AnosPoenteReais,
            riscoManutencaoPredioReais: 0,
            excedenteMedianaM2Reais: 0,
          }),
        ),
      );

      tree1401 = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CanvasSolSombraBrisa25D, {
            inferencia: inf,
            fachadaSelecionada: fac1401.id,
            aoSelecionarFachada: () => undefined,
            andar: 14,
            aoAlterarAndar: () => undefined,
            pavimentosTotais: 16,
            centro,
          }),
          React.createElement(TermometroConfortoTermico, { conforto: conforto1401, andar: 14 }),
        ),
      );

      treeMatriz = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(MatrizVisualComparar, {
            modalidade: "compra",
            opcaoA: {
              nome: "Apê 202 (Poente)",
              precoPrincipalReais: 680_000,
              areaM2: 110,
              mensalBolsoRealReais: 6_250,
              orientacaoCurta: fac202.orientacaoSolar,
              climaSelo: conforto202.selo,
              confortoQuente: true,
              ruidoInternoDb: acustica202.ruidoInternoDormitorioDbA,
              anoConstrucao: 2010,
              spuAlerta: false,
            },
            opcaoB: {
              nome: "Apê 1401 (Nascente)",
              precoPrincipalReais: 680_000,
              areaM2: 110,
              mensalBolsoRealReais: 5_980,
              orientacaoCurta: fac1401.orientacaoSolar,
              climaSelo: conforto1401.selo,
              confortoQuente: false,
              ruidoInternoDb: acustica1401.ruidoInternoDormitorioDbA,
              anoConstrucao: 2010,
              spuAlerta: false,
            },
          }),
        ),
      );
    });

    const texto202 = extrairTextos(tree202.toJSON());
    const texto1401 = extrairTextos(tree1401.toJSON());
    const textoMatriz = extrairTextos(treeMatriz.toJSON());

    expect(texto202).toContain("Poente");
    // Decisão D4 (18/11/2026): ficam os fatos para negociar, sem valor de proposta.
    expect(texto202).toContain("Fatos que você pode levar à conversa");
    expect(texto202).not.toMatch(/alvo (justo|sugerido)/i);
    expect(texto1401).toContain("Nascente");
    expect(texto1401).toContain(conforto1401.selo);
    expect(textoMatriz).toContain("Apê 1401 (Nascente) leva vantagem");
  });
});
