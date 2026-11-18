import { describe, expect, it } from "@jest/globals";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { formatarReaisCompacto } from "../src/dados/formatos";
import { inferirFachadasDoEdificio } from "../src/dados/sol/inferirFachadas";
import { avaliarConfortoTermico } from "../src/dados/clima/confortoTermico";
import { avaliarBioclimatico3d } from "../src/municipios/recife/motores/bioclimatico3d";
import { avaliarAcustica3d } from "../src/nucleo/motores/acustica3d";
import { PALAVRAS_PROIBIDAS_UI, REGEX_JARGON_CAMADA1 } from "../src/dados/cidadao/tradutorCidadao";
import { TemaDoApp } from "../src/tema/Tema";
import { PlacarHeroi5Segundos } from "../src/componentes/visual/PlacarHeroi5Segundos";
import { CanvasSolSombraBrisa25D } from "../src/componentes/visual/CanvasSolSombraBrisa25D";
import { TermometroConfortoTermico } from "../src/componentes/visual/TermometroConfortoTermico";
import { TresPerguntasDoBolso } from "../src/componentes/visual/TresPerguntasDoBolso";
import { EscalaDeRuidoHumana, RelogioDoPredio, SilencioInteligente } from "../src/componentes/visual/EscalasVisuais";
import { MatrizVisualComparar } from "../src/componentes/visual/MatrizVisualComparar";

function extrairTextos(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(extrairTextos);
  const out: string[] = [];
  for (const c of node.children ?? []) {
    if (typeof c === "string") out.push(c);
    else out.push(...extrairTextos(c));
  }
  return out;
}

describe("Anti-Jargão, Anti-Truncamento e Tokens Puros na Nova Camada Visual", () => {
  it("formatarReaisCompacto evita truncamento em milhares e milhões", () => {
    expect(formatarReaisCompacto(3_850)).toBe("R$ 3.850");
    expect(formatarReaisCompacto(536_400)).toBe("R$ 536 mil");
    expect(formatarReaisCompacto(1_850_000)).toBe("R$ 1,9 milhão");
    expect(formatarReaisCompacto(2_400_000)).toBe("R$ 2,4 milhões");
    expect(formatarReaisCompacto(2_000_000)).toBe("R$ 2 milhões");
  });

  it("nenhum componente em src/componentes/visual/ usa hex ou rgb/rgba fora dos tokens", () => {
    const dir = join(__dirname, "..", "src", "componentes", "visual");
    const arquivos = readdirSync(dir).filter((f) => /\.tsx?$/.test(f));
    expect(arquivos.length).toBeGreaterThanOrEqual(5);
    for (const nome of arquivos) {
      const src = readFileSync(join(dir, nome), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(src.match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(/g)).toBeNull();
    }
  });

  it("todos os novos blocos visuais evitam R$ truncado, jargão técnico, 'seguro' e palavras proibidas", () => {
    const inf = inferirFachadasDoEdificio({
      edificio: {
        id: "60461-331",
        bairro: "casa-forte",
        logradouro: "RUA TELES JUNIOR",
        centro: [-34.918, -8.034],
        poligono: null,
      },
      textoAnuncio: "Apartamento nascente super ventilado Casa Forte",
    });
    const fac = inf.frente;
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: fac.azimuteGraus, andar: 7 });
    const conf = avaliarConfortoTermico({
      andar: 7,
      pavimentosTotais: 15,
      fachada: fac,
      bioclimatico: bio,
      pracasAte300m: 2,
    });
    const acu = avaliarAcustica3d({
      andar: 7,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "coletora",
      distanciaViaM: 18,
      anoConstrucao: 2016,
      precoImovelReais: 1_850_000,
    });

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(PlacarHeroi5Segundos, {
            modalidade: "compra",
            precoPrincipalReais: 1_850_000,
            mensalBolsoRealReais: 12_900,
            dinheiroParaEntrarReais: 420_000,
            comparacaoM2Pct: -8,
            orientacaoCurta: fac.orientacaoSolar,
            conforto: conf,
            ruidoDormitorioDb: acu.ruidoInternoDormitorioDbA,
            spuAtivo: false,
          }),
          React.createElement(CanvasSolSombraBrisa25D, {
            inferencia: inf,
            fachadaSelecionada: fac.id,
            aoSelecionarFachada: () => undefined,
            andar: 7,
            aoAlterarAndar: () => undefined,
            pavimentosTotais: 15,
          }),
          React.createElement(TermometroConfortoTermico, { conforto: conf, andar: 7 }),
          React.createElement(TresPerguntasDoBolso, {
            modalidade: "compra",
            nomeImovel: "Residencial Praça de Casa Forte",
            enderecoImovel: "Rua Teles Junior, 331",
            precoAnuncioReais: 1_850_000,
            aluguelAnunciadoReais: null,
            condominioMensalReais: 1_650,
            iptuMensalReais: 520,
            prestacaoEstimadaReais: 10_200,
            entradaReais: 370_000,
            itbiReais: 26_000,
            spuAnualReais: 0,
            custoMensalArReais: conf.custoMensalArReais,
            economiaLegalItbiReais: 22_000,
            descontoRuidoReais: 15_000,
            vplCalorPoenteReais: 0,
            riscoManutencaoPredioReais: 0,
            excedenteMedianaM2Reais: 45_000,
            entradaTco10Anos: { precoCompraReais: 650_000, aluguelEquivalenteMensalReais: 2_925, condominioMensalReais: 1_050, iptuAnualReais: 3_600 },
          }),
          React.createElement(EscalaDeRuidoHumana, { acustica: acu, anoConstrucao: 2016 }),
          React.createElement(RelogioDoPredio, { anoConstrucao: 2016, unidades: 30, pavimentos: 15 }),
          React.createElement(SilencioInteligente, {
            itensNormais: [
              { rotulo: "Prédio confirmado no cadastro do Recife", detalhe: "Matrícula conferida" },
              { rotulo: "IPTU compatível com a região" },
            ],
          }),
          React.createElement(MatrizVisualComparar, {
            modalidade: "compra",
            opcaoA: {
              nome: "Opção A",
              precoPrincipalReais: 1_850_000,
              areaM2: 140,
              mensalBolsoRealReais: 12_900,
              orientacaoCurta: fac.orientacaoSolar,
              climaSelo: conf.selo,
              confortoQuente: false,
              ruidoInternoDb: acu.ruidoInternoDormitorioDbA,
              anoConstrucao: 2016,
              spuAlerta: false,
            },
            opcaoB: {
              nome: "Opção B",
              precoPrincipalReais: 1_420_000,
              areaM2: 120,
              mensalBolsoRealReais: 11_100,
              orientacaoCurta: "Poente",
              climaSelo: "Quente à tarde",
              confortoQuente: true,
              ruidoInternoDb: 52,
              anoConstrucao: 1998,
              spuAlerta: true,
            },
          }),
        ),
      );
    });

    const linhas = extrairTextos(tree.toJSON());
    const completo = linhas.join("\n");

    // 1. Zero valores monetarios cortados com reticencias
    expect(completo).not.toMatch(/R\$\s*[\d.,]+(?:\.\.\.|…)/);
    expect(completo).toContain("R$ 1,9 milhão");

    // 2. Zero jargao tecnico de camada 3 nem dB bruto exposto ao cidadao
    expect(REGEX_JARGON_CAMADA1.test(completo)).toBe(false);
    expect(completo).not.toMatch(/\d\s*dB\b/i);

    // 3. Zero palavras proibidas e zero uso solto de "seguro"
    for (const regra of PALAVRAS_PROIBIDAS_UI) {
      expect(regra.test(completo)).toBe(false);
    }
    const semSeguroPermitido = completo.replace(/seguro incêndio/gi, "").replace(/seguro fiança/gi, "");
    expect(/\bseguro\b/i.test(semSeguroPermitido)).toBe(false);

    // 4. SilencioInteligente começa recolhido e abre ao toque
    expect(completo).not.toContain("Matrícula conferida");
    const silencioBotao = tree.root.find((n) => n.props.testID === "silencio-inteligente-toggle");
    expect(silencioBotao).toBeDefined();
    act(() => {
      silencioBotao?.props.onPress();
    });
    const aposExpandir = extrairTextos(tree.toJSON()).join("\n");
    expect(aposExpandir).toContain("Matrícula conferida");

    // 5. Toggles interativos do Canvas 2.5D respondem sem erro
    const btnInverno = tree.root.find((n) => n.props.testID === "estacao-inverno");
    const btnFuturas = tree.root.find((n) => n.props.testID === "toggle-torres-futuras");
    act(() => {
      btnInverno.props.onPress();
      btnFuturas.props.onPress();
    });
    expect(extrairTextos(tree.toJSON()).join("\n")).toContain("Risco de torres futuras: ligado");
  });
});
