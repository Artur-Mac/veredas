import { describe, expect, it, jest } from "@jest/globals";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { inferirFachadasDoEdificio } from "../src/dados/sol/inferirFachadas";
import { simularCenaSombra25D, type PredioCena25D } from "../src/dados/sol/motorSombra25D";
import { analisarRadarVistaELote } from "../src/dados/entorno/radarVistaELote";
import { calcularPulsoDaQuadra } from "../src/dados/dossie/pulsoDaQuadra";
import { fontesDeBarulho, simularUnidade } from "../src/dados/dossie/simuladorDaUnidade";
import { edificiosDoBairro, META } from "../src/dados/recife/indice";
import { montarBoletimPreContrato } from "../src/dados/recife/boletimPreContrato";
import { BAIRROS_COBERTOS } from "../src/dados/recife/bairros";
import { essenciaisDoBairro } from "../src/dados/recife/essenciais";
import { filtrarPrediosPorPorte, resumoDoBairroNoCadastro } from "../src/dados/recife/localizar";
import { avaliarBioclimatico3d } from "../src/municipios/recife/motores/bioclimatico3d";
import { avaliarConfortoTermico } from "../src/dados/clima/confortoTermico";
import { avaliarAcustica3d } from "../src/nucleo/motores/acustica3d";
import { PALAVRAS_PROIBIDAS_UI, REGEX_JARGON_CAMADA1 } from "../src/dados/cidadao/tradutorCidadao";
import { CanvasSolSombraBrisa25D } from "../src/componentes/visual/CanvasSolSombraBrisa25D";
import { RadarVistaELote } from "../src/componentes/visual/RadarVistaELote";
import { CopilotoDocumentosPreSinal } from "../src/componentes/visual/CopilotoDocumentosPreSinal";
import { BlocoDeCusto } from "../src/componentes/dossie-v1/Custo";
import { COMO_PEDIR_ISENCAO_RECIFE, HIPOTESES_ISENCAO_IPTU_RECIFE } from "../src/dados/recife/isencaoIptuRecife";
import { PulsoDaQuadra } from "../src/componentes/visual/PulsoDaQuadra";
import { TresPerguntasDoBolso } from "../src/componentes/visual/TresPerguntasDoBolso";
import { RotinaDoisDestinosComparar } from "../src/componentes/visual/RotinaDoisDestinosComparar";
import { ExportarResumoExecutivo } from "../src/componentes/visual/ExportarResumoExecutivo";
import { CartaoResumoCompartilhado } from "../src/componentes/comparar/CartaoResumoCompartilhado";
import { gerarLinkPrivadoSemServidor, gerarTextoResumoExecutivo } from "../src/dados/dossie/resumoExecutivo2Paginas";
import { lerFragmento } from "../src/dados/salaDeDecisao";
import { ondeMaisProcurar } from "../src/dados/escolha";
import { DueloFinalistas } from "../src/componentes/cidadao/DueloFinalistas";
import { ConvergenciaFamiliar } from "../src/componentes/cidadao/ConvergenciaFamiliar";
import { compararRotinaDoisDestinos, estimarMinutosPicoIdaVolta } from "../src/dados/mobilidade/rotinaCasal";
import {
  ORIENTACAO_CNIB_ONR,
  PRAZOS_REFERENCIA_PRE_SINAL,
  auditarTextoColadoCidadao,
} from "../src/dados/documentos/copilotoPreSinal";
import { avaliarCaminhabilidadeEVidaNaRua } from "../src/dados/dossie/caminhabilidadeEVidaNaRua";
import { VidaAPeNaQuadra } from "../src/componentes/visual/VidaAPeNaQuadra";
import { SimuladorBolso15Segundos } from "../src/componentes/visual/SimuladorBolso15Segundos";
import { construirLinhaUnificadaDoLote } from "../src/dados/dossie/linhaUnificadaDoLote";
import { LinhaUnificadaDoLote } from "../src/componentes/visual/LinhaUnificadaDoLote";
import { decomporSossego } from "../src/dados/acustica/decomporSossego";
import { EscalaDeRuidoHumana, RelogioDoPredio } from "../src/componentes/visual/EscalasVisuais";
import { TermometroConfortoTermico } from "../src/componentes/visual/TermometroConfortoTermico";
import { MatrizVisualComparar } from "../src/componentes/visual/MatrizVisualComparar";
import { PlacarHeroi5Segundos } from "../src/componentes/visual/PlacarHeroi5Segundos";
import { BussolaSolarBrisa } from "../src/componentes/cidadao/BussolaSolarBrisa";
import { SimuladorTco10Anos } from "../src/componentes/cidadao/SimuladorTco10Anos";
import {
  montarTextoNegociacaoPartilhavel,
  ResumoEvidenciaPartilhavel,
} from "../src/componentes/cidadao/ResumoEvidenciaPartilhavel";
import { TemaDoApp } from "../src/tema/Tema";

function listarTsxRecursivo(dir: string): string[] {
  const arquivos: string[] = [];
  for (const nome of readdirSync(dir)) {
    const full = join(dir, nome);
    const st = statSync(full);
    if (st.isDirectory()) {
      arquivos.push(...listarTsxRecursivo(full));
    } else if (/\.tsx$/.test(nome)) {
      arquivos.push(full);
    }
  }
  return arquivos;
}

function extrairTextos(
  node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null,
): string[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(extrairTextos);
  const out: string[] = [];
  for (const c of node.children ?? []) {
    if (typeof c === "string") out.push(c);
    else out.push(...extrairTextos(c));
  }
  return out;
}

describe("SOTA Física 2.5D de Sombras, Zero Serifas SVG e Auditoria S3–S6", () => {
  const centro: [number, number] = [-34.896, -8.121];
  const poligono: [number, number][] = [
    [-34.8961, -8.12108],
    [-34.8959, -8.12108],
    [-34.8959, -8.12092],
    [-34.8961, -8.12092],
  ];
  const vizinhosMesmaRua = [
    {
      id: "60461-110",
      logradouro: "AV BOA VIAGEM",
      centro: [-34.896, -8.1206] as [number, number],
      pavimentos: 12,
      poligono: null,
    },
    {
      id: "60461-125",
      logradouro: "AV BOA VIAGEM",
      centro: [-34.89578, -8.121] as [number, number],
      pavimentos: 10,
      poligono: null,
    },
  ];

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

  const caixaAlvo: PredioCena25D = {
    id: "alvo",
    pontosM: [
      [-9, -9],
      [9, -9],
      [9, 9],
      [-9, 9],
    ],
    alturaM: 42,
    ehAlvo: true,
    potencialFuturoM: null,
  };

  const vizinhoOeste12p: PredioCena25D = {
    id: "viz-oeste",
    pontosM: [
      [-34, -10],
      [-18, -10],
      [-18, 10],
      [-34, 10],
    ],
    alturaM: 36, // 12 pavimentos (~36 m) a Oeste do edificio alvo
    ehAlvo: false,
    potencialFuturoM: null,
  };

  it("projeta sombras reais no solo para edifício alvo e vizinhos, apontando Oeste às 07h e Leste às 15h/17h", () => {
    const c07 = simularCenaSombra25D({
      predios: [caixaAlvo, vizinhoOeste12p],
      inferencia: inf,
      fachadaAtiva: inf.frente,
      andar: 4,
      hora: 7,
      dia: "2026-12-21",
      centro,
      mostrarTorresFuturas: false,
    });
    const c12 = simularCenaSombra25D({
      predios: [caixaAlvo, vizinhoOeste12p],
      inferencia: inf,
      fachadaAtiva: inf.frente,
      andar: 4,
      hora: 12,
      dia: "2026-12-21",
      centro,
      mostrarTorresFuturas: false,
    });
    const c15 = simularCenaSombra25D({
      predios: [caixaAlvo, vizinhoOeste12p],
      inferencia: inf,
      fachadaAtiva: inf.fundos,
      andar: 4,
      hora: 15,
      dia: "2026-12-21",
      centro,
      mostrarTorresFuturas: false,
    });

    expect(c07.sombrasSolo.some((s) => s.ehAlvo)).toBe(true);
    expect(c07.sombrasSolo.some((s) => !s.ehAlvo)).toBe(true);

    const xsAlvo07 = c07.sombrasSolo.find((s) => s.ehAlvo)!.poliM.map((p) => p[0]);
    const xsAlvo12 = c12.sombrasSolo.find((s) => s.ehAlvo)!.poliM.map((p) => p[0]);
    const xsAlvo15 = c15.sombrasSolo.find((s) => s.ehAlvo)!.poliM.map((p) => p[0]);

    const min07 = Math.min(...xsAlvo07);
    const max15 = Math.max(...xsAlvo15);
    const span07 = Math.max(...xsAlvo07) - min07;
    const span12 = Math.max(...xsAlvo12) - Math.min(...xsAlvo12);
    const span15 = max15 - Math.min(...xsAlvo15);

    // 07h (Sol a Leste) projeta sombra longa para Oeste (x << -9)
    expect(min07).toBeLessThan(-25);
    // 15h (Sol a Oeste) projeta sombra longa para Leste (x >> +9)
    expect(max15).toBeGreaterThan(22);
    // Meio-dia tem sombra horizontalmente mais curta que 07h e 15h
    expect(span12).toBeLessThan(span07);
    expect(span12).toBeLessThan(span15);
  });

  it("calcula self-shadowing fisico nas paredes (Leste iluminada às 07h, Oeste iluminada às 15h)", () => {
    const c07 = simularCenaSombra25D({
      predios: [caixaAlvo],
      inferencia: inf,
      fachadaAtiva: inf.frente,
      andar: 4,
      hora: 7,
      dia: "2026-12-21",
      centro,
      mostrarTorresFuturas: false,
    });
    const p07 = c07.paredesPorPredio["alvo"]!;
    const paredeLeste07 = p07.find((w) => w.normalM[0] > 0.7)!;
    const paredeOeste07 = p07.find((w) => w.normalM[0] < -0.7)!;
    expect(paredeLeste07.emSombraPropria).toBe(false);
    expect(paredeOeste07.emSombraPropria).toBe(true);

    const c15 = simularCenaSombra25D({
      predios: [caixaAlvo],
      inferencia: inf,
      fachadaAtiva: inf.fundos,
      andar: 4,
      hora: 15,
      dia: "2026-12-21",
      centro,
      mostrarTorresFuturas: false,
    });
    const p15 = c15.paredesPorPredio["alvo"]!;
    const paredeLeste15 = p15.find((w) => w.normalM[0] > 0.7)!;
    const paredeOeste15 = p15.find((w) => w.normalM[0] < -0.7)!;
    expect(paredeOeste15.emSombraPropria).toBe(false);
    expect(paredeLeste15.emSombraPropria).toBe(true);
  });

  it("detecta bloqueio real por andar no vizinho Poente e recorta o raio solar no bloqueador", () => {
    const fachadaOeste = {
      ...inf.fundos,
      azimuteGraus: 270,
      pontoMedioM: [-9, 0] as [number, number],
    };

    const andar2 = simularCenaSombra25D({
      predios: [caixaAlvo, vizinhoOeste12p],
      inferencia: inf,
      fachadaAtiva: fachadaOeste,
      andar: 2,
      hora: 16,
      dia: "2026-12-21",
      centro,
      mostrarTorresFuturas: false,
    });
    const andar15 = simularCenaSombra25D({
      predios: [caixaAlvo, vizinhoOeste12p],
      inferencia: inf,
      fachadaAtiva: fachadaOeste,
      andar: 15,
      hora: 16,
      dia: "2026-12-21",
      centro,
      mostrarTorresFuturas: false,
    });

    expect(andar2.oclusao.emSombraVizinho).toBe(true);
    expect(andar2.oclusao.bloqueadorId).toBe("viz-oeste");
    expect(andar2.oclusao.pontoBloqueioM).not.toBeNull();
    expect(andar2.oclusao.ateQualAndarProtegido).toBeGreaterThanOrEqual(3);
    expect(andar15.oclusao.emSombraVizinho).toBe(false);
  });

  it("permite selecionar fachadas clicando diretamente nas paredes 2.5D do canvas", () => {
    const aoSelecionar = jest.fn();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CanvasSolSombraBrisa25D, {
            inferencia: inf,
            fachadaSelecionada: "frente_rua",
            aoSelecionarFachada: aoSelecionar,
            andar: 5,
            aoAlterarAndar: () => undefined,
            pavimentosTotais: 14,
            centro,
          }),
        ),
      );
    });

    const paredeFundos = tree.root.find((n) => n.props.testID === "canvas-wall-fundos");
    expect(paredeFundos).toBeDefined();
    act(() => {
      paredeFundos.props.onPress();
    });
    expect(aoSelecionar).toHaveBeenCalledWith("fundos");
  });

  it("proíbe <TextoSvg> ou <SvgText> sem fontFamily explícito em todo src/ e injeta CSS SVG sans-serif na Web", () => {
    const srcRoot = join(__dirname, "..", "src");
    const tsxFiles = listarTsxRecursivo(srcRoot);
    const violacoes: string[] = [];

    for (const file of tsxFiles) {
      const content = readFileSync(file, "utf8");
      const matches = content.match(/<(?:TextoSvg|SvgText)\b[\s\S]*?>/g) ?? [];
      for (const tag of matches) {
        if (!/fontFamily=/.test(tag)) {
          violacoes.push(`${file}: ${tag.slice(0, 90)}`);
        }
      }
    }
    expect(violacoes).toEqual([]);

    const layout = readFileSync(join(srcRoot, "app", "_layout.tsx"), "utf8");
    expect(layout).toContain("vereda-svg-sans");
    expect(layout).toContain("PlusJakartaSans");
  });

  it("novos módulos visuais (Radar, Copiloto, Pulso, Checklist IPTU) seguem anti-jargão, zero dB, zero R$ 0 e zero palavras proibidas", () => {
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 90, andar: 6 });
    const conf = avaliarConfortoTermico({
      andar: 6,
      pavimentosTotais: 14,
      fachada: inf.frente,
      bioclimatico: bio,
    });
    const acu = avaliarAcustica3d({
      andar: 6,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "coletora",
      distanciaViaM: 18,
      anoConstrucao: 2015,
      precoImovelReais: 850_000,
    });
    const radar = analisarRadarVistaELote({
      centro,
      edificio: null,
      fachadaAtiva: inf.frente,
      andar: 6,
      vizinhos: vizinhosMesmaRua,
      obrasProximas: null,
    });
    const pulso = calcularPulsoDaQuadra({
      conforto: conf,
      acustica: acu,
      anoConstrucao: 2015,
      obrasProximas: null,
      visaoRua: null,
      vinculoConfirmado: false,
      precoInformado: true,
      condominioInformado: true,
      comparacaoM2Pct: 0,
      spuAtivo: false,
    });

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(RadarVistaELote, { radar }),
          React.createElement(CopilotoDocumentosPreSinal, {
            nomeImovel: "Residencial Mar Azul",
            anoConstrucao: 2015,
            unidades: 28,
            chaveLote14: "12345678901234",
            spuAtivo: true,
          }),
          React.createElement(PulsoDaQuadra, { pulso }),
          React.createElement(TresPerguntasDoBolso, {
            modalidade: "compra",
            nomeImovel: "Residencial Mar Azul",
            enderecoImovel: "Boa Viagem",
            precoAnuncioReais: 850_000,
            aluguelAnunciadoReais: null,
            condominioMensalReais: 950,
            iptuMensalReais: 260,
            prestacaoEstimadaReais: 5_100,
            entradaReais: 170_000,
            itbiReais: 10_000,
            cartorioRegistroReais: 6_500,
            spuAnualReais: 0,
            custoMensalArReais: 140,
            economiaLegalItbiCartorioReais: 15_000,
            descontoRuidoReais: 0,
            vplCalorPoenteReais: 0,
            riscoManutencaoPredioReais: 0,
            excedenteMedianaM2Reais: 0,
          }),
        ),
      );
    });

    const toggleIptu = tree.root.find((n) => n.props.testID === "iptu-revisao-toggle");
    const togglePulso = tree.root.find((n) => n.props.testID === "pulso-metodo-toggle");
    act(() => {
      toggleIptu.props.onPress();
      togglePulso.props.onPress();
    });

    const texto = extrairTextos(tree.toJSON()).join("\n");
    expect(texto).toContain("revisão cadastral na Prefeitura do Recife");
    expect(texto).toContain("Cadastro Imobiliário Recife");
    expect(texto).not.toMatch(/R\$ 0(?![\d.,])/);
    expect(texto).not.toMatch(/\d\s*dB\b/i);
    expect(REGEX_JARGON_CAMADA1.test(texto)).toBe(false);
    for (const r of PALAVRAS_PROIBIDAS_UI) {
      expect(r.test(texto)).toBe(false);
    }
    const semSeguroPermitido = texto
      .replace(/seguro incêndio/gi, "")
      .replace(/seguro fiança/gi, "");
    expect(/\bseguro\b/i.test(semSeguroPermitido)).toBe(false);
  });

  it("calcula interseção de rotina a dois destinos sem jargão nem palavras proibidas", () => {
    const rot = compararRotinaDoisDestinos({
      nomeOpcaoA: "Casa Forte 95m²",
      centroA: null,
      bairroA: "casa-forte",
      nomeOpcaoB: "Boa Viagem 90m²",
      centroB: null,
      bairroB: "boa-viagem",
      destino1Id: "polo_casa_forte",
      destino2Id: "polo_ufpe",
    });
    expect(rot.vencedorRotina).toBe("A");
    expect(rot.minutosDiaOpcaoA).toBeLessThan(rot.minutosDiaOpcaoB);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(RotinaDoisDestinosComparar, {
            nomeOpcaoA: "Casa Forte 95m²",
            centroA: null,
            bairroA: "casa-forte",
            nomeOpcaoB: "Boa Viagem 90m²",
            centroB: null,
            bairroB: "boa-viagem",
          }),
        ),
      );
    });
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("min/dia");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    expect(/\bseguro\b/i.test(txt)).toBe(false);
  });

  it("renderiza pinos 2.5D de obras licenciadas no canvas e dossiê executivo exportável sem R$ 0, dB ou jargão", () => {
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 90, andar: 5 });
    const conf = avaliarConfortoTermico({
      andar: 5,
      pavimentosTotais: 14,
      fachada: inf.frente,
      bioclimatico: bio,
    });
    const acu = avaliarAcustica3d({
      andar: 5,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "coletora",
      distanciaViaM: 18,
      anoConstrucao: 2016,
      precoImovelReais: 920_000,
    });
    const obras = {
      licencasDeObra: 2,
      relevantes24m: 1,
      demolicoes24m: 0,
      recentes: [
        {
          categoria: "construcao" as const,
          descricao: "ALVARA DE CONSTRUCAO",
          data: "2026-04",
          situacao: "EMITIDA",
          centro: [-34.8957, -8.1208] as [number, number],
          distanciaM: 38,
        },
      ],
    };
    const radar = analisarRadarVistaELote({
      centro,
      edificio: null,
      fachadaAtiva: inf.frente,
      andar: 5,
      vizinhos: vizinhosMesmaRua,
      obrasProximas: obras,
    });
    const pulso = calcularPulsoDaQuadra({
      conforto: conf,
      acustica: acu,
      anoConstrucao: 2016,
      obrasProximas: obras,
      visaoRua: null,
      vinculoConfirmado: true,
      precoInformado: true,
      condominioInformado: true,
      comparacaoM2Pct: 0,
      spuAtivo: false,
    });

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CanvasSolSombraBrisa25D, {
            inferencia: inf,
            fachadaSelecionada: "frente_rua",
            aoSelecionarFachada: () => undefined,
            andar: 5,
            aoAlterarAndar: () => undefined,
            pavimentosTotais: 14,
            centro,
            obrasEntorno: obras,
          }),
          React.createElement(ExportarResumoExecutivo, {
            entrada: {
              nomeImovel: "Edifício Atlântico",
              endereco: "Av. Boa Viagem, 120",
              modalidade: "compra",
              precoPrincipalReais: 920_000,
              mensalBolsoRealReais: 6_800,
              dinheiroEntrarReais: 215_000,
              fachadaResumo: "Nascente (5º andar)",
              conforto: conf,
              sossegoNivel: "Calmo à noite",
              radar,
              pulso,
              anoConstrucao: 2016,
              unidades: 36,
              chaveLote14: "12345678901234",
              spuAtivo: false,
            },
          }),
        ),
      );
    });

    const togglePrevia = tree.root.find(
      (n) => typeof n.type !== "string" && typeof n.props.accessibilityState?.expanded === "boolean",
    );
    act(() => {
      togglePrevia.props.onPress();
    });

    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Obra");
    expect(txt).toContain("DOSSIÊ EXECUTIVO VEREDA");
    expect(txt).not.toMatch(/R\$ 0(?![\d.,])/);
    expect(txt).not.toMatch(/\d\s*dB\b/i);
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    expect(/\bseguro\b/i.test(txt)).toBe(false);
  });

  it("audita trecho de matrícula/ata no aparelho e alterna pacote pré-sinal em 3 estados", () => {
    const audit = auditarTextoColadoCidadao(
      "R-4 Penhora executiva determinada em juízo.\nAta de assembleia extraordinária aprovou cota extra para fachada e mencionou vaga presa na garagem.",
    );
    expect(audit.onusAtivosResumo.some((o) => /Penhora/i.test(o.titulo))).toBe(true);
    expect(audit.alertasCondoScanResumo.some((a) => /cota extra/i.test(a.titulo))).toBe(true);
    expect(audit.alertasCondoScanResumo.some((a) => /Vaga presa/i.test(a.titulo))).toBe(true);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CopilotoDocumentosPreSinal, {
            nomeImovel: "Edifício Aurora",
            anoConstrucao: 2008,
            unidades: 32,
            chaveLote14: "12345678901234",
          }),
        ),
      );
    });

    const item0 = tree.root.find((n) => n.props.testID === "pacote-item-0");
    act(() => {
      item0.props.onPress();
    });
    expect(extrairTextos(tree.toJSON()).join("\n")).toContain("1/4 recebidos");

    const toggleLeitor = tree.root.find((n) => n.props.testID === "toggle-leitor-rapido-doc");
    act(() => {
      toggleLeitor.props.onPress();
    });
    const inputDoc = tree.root.find((n) => n.props.testID === "input-texto-documento");
    act(() => {
      inputDoc.props.onChangeText("Ata de assembleia com cota extra aprovada e vaga presa.");
    });
    const aposColar = extrairTextos(tree.toJSON()).join("\n");
    expect(aposColar).toContain("Chamada de cota extra");
    expect(aposColar).toContain("Vaga presa ou rotativa");
    expect(REGEX_JARGON_CAMADA1.test(aposColar)).toBe(false);
    expect(/\bseguro\b/i.test(aposColar)).toBe(false);
  });

  it("calcula caminhabilidade 0–10 com pesos abertos, percentil no bairro e renderiza VidaAPeNaQuadra sem jargão", () => {
    const cam = avaliarCaminhabilidadeEVidaNaRua({
      predio: null,
      essenciais: null,
      visaoRua: null,
      nomeDoBairro: "Boa Viagem",
    });
    expect(cam.ausenciaNota).toBe("sem_leitura_publicada");
    expect(cam.frasePercentil).toContain("20 prédios");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(VidaAPeNaQuadra, { dados: cam })),
      );
    });
    const togglePesos = tree.root.find((n) => n.props.testID === "vida-a-pe-pesos-toggle");
    act(() => {
      togglePesos.props.onPress();
    });
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Mercado 30%");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    expect(/\bseguro\b/i.test(txt)).toBe(false);
  });

  it("simulador de bolso em 15 segundos calcula entrada, ITBI SFH e aluguel sem jargão nem R$ 0", () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(SimuladorBolso15Segundos)),
      );
    });
    const toggle = tree.root.find((n) => n.props.testID === "simulador-15s-toggle");
    act(() => {
      toggle.props.onPress();
    });
    const txtCompra = extrairTextos(tree.toJSON()).join("\n");
    expect(txtCompra).toContain("Caixa para entrar");
    expect(txtCompra).toContain("SFH / 180 dias");
    expect(txtCompra).not.toMatch(/R\$ 0(?![\d.,])/);

    const btnAlugar = tree.root.find((n) => n.props.testID === "sim15-mod-aluguel");
    act(() => {
      btnAlugar.props.onPress();
    });
    const txtAluguel = extrairTextos(tree.toJSON()).join("\n");
    expect(txtAluguel).toContain("Garantia estimada");
    expect(REGEX_JARGON_CAMADA1.test(txtAluguel)).toBe(false);
    expect(/\bseguro\b/i.test(txtAluguel)).toBe(false);
  });

  it("constrói linha unificada cronológica do lote e edifício com ações práticas sem jargão", () => {
    const linha = construirLinhaUnificadaDoLote({
      edificio: {
        id: "60461-120",
        bairro: "boa-viagem",
        logradouro: "AV BOA VIAGEM",
        numero: "120",
        dsqfl: "12345678901234",
        nome: "Atlântico",
        centro,
        poligono,
        unidades: 30,
        tipologias: [{ area: 95, unidades: 30, iptuAnualMediano: 3200 }],
        anoConstrucao: 2005,
        pavimentos: 15,
        ate4Pavimentos: false,
        padrao: "Superior",
        iptuAnual: { n: 30, p25: 2900, mediana: 3200, p75: 3500 },
        itbi: {
          transmissoes: 4,
          desde: 2023,
          ate: 2025,
          valorUnidade: { n: 4, p25: 720_000, mediana: 780_000, p75: 840_000 },
          porAno: [
            [2023, 1],
            [2025, 2],
          ],
        },
        obras150m: { licencasDeObra: 1, relevantes24m: 1, demolicoes24m: 0, recentes: [] },
      },
      obrasProximas: {
        licencasDeObra: 1,
        relevantes24m: 1,
        demolicoes24m: 0,
        recentes: [
          {
            categoria: "construcao",
            descricao: "ALVARA DE CONSTRUCAO INICIAL",
            data: "2026-03",
            situacao: "EMITIDA",
            centro: [-34.8957, -8.1208],
            distanciaM: 42,
          },
        ],
      },
      visaoRua: null,
      spuAtivo: true,
    });

    expect(linha.eventos.length).toBeGreaterThanOrEqual(4);
    expect(linha.eventos[0]!.ordemAno).toBeGreaterThanOrEqual(linha.eventos[1]!.ordemAno);
    expect(linha.acoesConcretas.length).toBeGreaterThanOrEqual(2);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(LinhaUnificadaDoLote, { linha })),
      );
    });
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("O que fazer com isso");
    expect(txt).toContain("Obra nova licenciada");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    expect(/\bseguro\b/i.test(txt)).toBe(false);
  });

  it("audita área declarada × cadastral (Gridics) e garante zero hex no MapaDoLote", () => {
    const mapaSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "MapaDoLote.tsx"),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(mapaSrc.match(/#[0-9A-Fa-f]{3,8}\b/g)).toBeNull();

    const radarDiv = analisarRadarVistaELote({
      centro,
      edificio: {
        id: "60461-120",
        bairro: "boa-viagem",
        logradouro: "AV BOA VIAGEM",
        numero: "120",
        dsqfl: "12345678901234",
        nome: "Atlântico",
        centro,
        poligono,
        unidades: 20,
        tipologias: [{ area: 75, unidades: 20, iptuAnualMediano: 2400 }],
        anoConstrucao: 2012,
        pavimentos: 12,
        ate4Pavimentos: false,
        padrao: "Superior",
        iptuAnual: null,
        itbi: null,
        obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
      },
      fachadaAtiva: inf.frente,
      andar: 4,
      vizinhos: vizinhosMesmaRua,
      obrasProximas: null,
      areaDeclaradaM2: 112,
    });
    const loteItem = radarDiv.itens.find((i) => i.id === "lote")!;
    expect(loteItem.estado).toBe("atencao");
    expect(loteItem.detalhe).toContain("112 m² × cadastro 75 m²");
  });

  it("permite pular para faixas de andar (Baixo, Médio, Alto) em 1 toque no Canvas 2.5D", () => {
    const aoAlterarAndar = jest.fn();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CanvasSolSombraBrisa25D, {
            inferencia: inf,
            fachadaSelecionada: "frente_rua",
            aoSelecionarFachada: () => undefined,
            andar: 4,
            aoAlterarAndar,
            pavimentosTotais: 16,
            centro,
          }),
        ),
      );
    });
    const btnAlto = tree.root.find((n) => n.props.testID === "andar-banda-alto");
    act(() => {
      btnAlto.props.onPress();
    });
    expect(aoAlterarAndar).toHaveBeenCalledWith(15);
  });

  it("gera link privado sem servidor (#v= / #s=) no dossiê executivo", async () => {
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 90, andar: 5 });
    const conf = avaliarConfortoTermico({
      andar: 5,
      pavimentosTotais: 14,
      fachada: inf.frente,
      bioclimatico: bio,
    });
    const acu = avaliarAcustica3d({
      andar: 5,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "coletora",
      distanciaViaM: 18,
      anoConstrucao: 2016,
      precoImovelReais: 850_000,
    });
    const radar = analisarRadarVistaELote({
      centro,
      edificio: null,
      fachadaAtiva: inf.frente,
      andar: 5,
      vizinhos: vizinhosMesmaRua,
      obrasProximas: null,
    });
    const pulso = calcularPulsoDaQuadra({
      conforto: conf,
      acustica: acu,
      anoConstrucao: 2016,
      obrasProximas: null,
      visaoRua: null,
      vinculoConfirmado: true,
      precoInformado: true,
      condominioInformado: true,
      comparacaoM2Pct: 0,
      spuAtivo: false,
    });

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(ExportarResumoExecutivo, {
            entrada: {
              nomeImovel: "Edifício Atlântico",
              endereco: "Av. Boa Viagem, 120",
              modalidade: "compra",
              precoPrincipalReais: 850_000,
              mensalBolsoRealReais: 6_200,
              dinheiroEntrarReais: 195_000,
              fachadaResumo: "Nascente (5º andar)",
              conforto: conf,
              sossegoNivel: "Calmo à noite",
              radar,
              pulso,
              anoConstrucao: 2016,
              unidades: 36,
              chaveLote14: "12345678901234",
              spuAtivo: false,
            },
          }),
        ),
      );
    });

    const btnLink = tree.root.find((n) => n.props.testID === "botao-gerar-link-privado");
    await act(async () => {
      btnLink.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    const txt = extrairTextos(tree.toJSON()).join("\n");
    act(() => {
      tree.unmount();
    });
    expect(txt).toContain("/sala#v=");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    expect(/\bseguro\b/i.test(txt)).toBe(false);
  });

  it("elimina hex literais em FichaViva e Negociacao e unifica PlusJakartaSans em <TextoSvg> do MapaDoLote", () => {
    const lerLimpo = (rel: string) =>
      readFileSync(join(__dirname, "..", rel), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");

    for (const rel of [
      "src/componentes/dossie-v1/FichaViva.tsx",
      "src/componentes/dossie-v1/Negociacao.tsx",
    ]) {
      expect(lerLimpo(rel).match(/#[0-9A-Fa-f]{3,8}\b/g)).toBeNull();
    }

    const mapaSvgTags = lerLimpo("src/componentes/dossie-v1/MapaDoLote.tsx").match(/<TextoSvg\b[\s\S]*?>/g) ?? [];
    expect(mapaSvgTags.length).toBeGreaterThan(0);
    for (const tag of mapaSvgTags) {
      expect(tag).toContain('fontFamily="PlusJakartaSans"');
    }
  });

  it("expõe ordem Gridics no radar e consequência frente vs fundos sem dB no simulador (R9/R11/R38)", () => {
    const radarOrdem = analisarRadarVistaELote({
      centro,
      edificio: null,
      fachadaAtiva: inf.frente,
      andar: 5,
      vizinhos: vizinhosMesmaRua,
      obrasProximas: null,
    });
    expect(radarOrdem.itens.map((i) => i.id)).toEqual([
      "cone_vista",
      "lote",
      "privacidade",
      "obras",
    ]);

    const bv = edificiosDoBairro("boa-viagem");
    const comFonte = bv.find((e) => fontesDeBarulho(e).length > 0)!;
    expect(comFonte).toBeDefined();
    const primFonte = fontesDeBarulho(comFonte)[0]!;
    const frente = simularUnidade({
      predio: comFonte,
      vizinhos: bv,
      tipo: "apartamento",
      andar: 4,
      fachadaGraus: primFonte.rumoGraus,
    });
    const fundos = simularUnidade({
      predio: comFonte,
      vizinhos: bv,
      tipo: "apartamento",
      andar: 4,
      fachadaGraus: (primFonte.rumoGraus + 180) % 360,
    });
    expect(frente.barulho.consequenciaPorFace).toContain("frente");
    expect(fundos.barulho.consequenciaPorFace).not.toBe(frente.barulho.consequenciaPorFace);
    expect(frente.barulho.consequenciaPorFace).not.toMatch(/\d+\s*dB/i);
    expect(fundos.barulho.consequenciaPorFace).not.toMatch(/\d+\s*dB/i);
  });

  it("remove caixas aninhadas com borderWidth: 1 em checklists de ler.tsx e garante transparência R50 em sobre-os-dados", () => {
    const lerSrc = readFileSync(join(__dirname, "..", "src", "app", "(abas)", "ler.tsx"), "utf8");
    const checklistBlock = lerSrc.match(/linhaDoChecklist:\s*\{[^}]*\}/)?.[0] ?? "";
    expect(checklistBlock).not.toMatch(/\bborderWidth:\s*1\b/);
    expect(checklistBlock).toContain("borderTopWidth: 1");

    const sobreSrc = readFileSync(join(__dirname, "..", "src", "app", "sobre-os-dados.tsx"), "utf8");
    expect(sobreSrc).toContain("escopo-qualidade-leituras");
    expect(sobreSrc).toContain("O que lemos sozinhos vs. o que pede confirmação");
  });

  it("filtra edifícios por porte (Zoneomics R35) e resume retrato factual do bairro (R28) sem preços", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const torres = filtrarPrediosPorPorte(bv, "torre", 8);
    expect(torres.length).toBeGreaterThan(0);
    expect(torres.every((e) => (e.pavimentos ?? 0) >= 15)).toBe(true);

    const baixos = filtrarPrediosPorPorte(bv, "baixo", 8);
    expect(baixos.length).toBeGreaterThan(0);
    expect(baixos.every((e) => (e.pavimentos ?? 0) <= 6 || e.ate4Pavimentos)).toBe(true);

    const resumo = resumoDoBairroNoCadastro(bv)!;
    expect(resumo).not.toBeNull();
    expect(resumo.totalEdificios).toBe(bv.length);
    expect(resumo.medianaPavimentos).toBeGreaterThan(0);
    expect(resumo.decadaPredominante).toMatch(/^anos \d{4}$/);
  });

  it("garante zero hex literal em toda a árvore UI (.tsx) e expõe malha de quadra Walk Score R8", () => {
    const pastas = [
      join(__dirname, "..", "src", "componentes"),
      join(__dirname, "..", "src", "app"),
    ];
    const violacoesHex: string[] = [];
    for (const pasta of pastas) {
      for (const arquivo of listarTsxRecursivo(pasta)) {
        const limpo = readFileSync(arquivo, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*\/\/.*$/gm, "");
        const matches = limpo.match(/#[0-9A-Fa-f]{3,8}\b/g);
        if (matches) violacoesHex.push(`${arquivo}: ${matches.join(",")}`);
      }
    }
    expect(violacoesHex).toEqual([]);

    const essBv = essenciaisDoBairro("boa-viagem");
    const bv = edificiosDoBairro("boa-viagem");
    const predioRede = bv.find((e) => essBv?.predios[e.id]?.modo === "rede");
    if (predioRede && essBv) {
      const camRede = avaliarCaminhabilidadeEVidaNaRua({
        predio: predioRede,
        essenciais: essBv,
        visaoRua: null,
        nomeDoBairro: "Boa Viagem",
      });
      expect(camRede.fraseMalhaQuadra).toContain("malha de quadra");
      let tree!: TestRenderer.ReactTestRenderer;
      act(() => {
        tree = TestRenderer.create(
          React.createElement(TemaDoApp, null, React.createElement(VidaAPeNaQuadra, { dados: camRede })),
        );
      });
      expect(tree.root.find((n) => n.props.testID === "vida-a-pe-malha-quadra")).toBeDefined();
    }
  });

  it("gera boletim numerado do pré-contrato (DataZap R27) sem valuation nem palavras proibidas", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const bol = montarBoletimPreContrato({
      meta: META,
      bairrosCobertos: BAIRROS_COBERTOS.length,
      edificiosAmostra: bv.slice(0, 25),
    });
    expect(bol.edicao).toContain("Edição 1");
    expect(bol.itens).toHaveLength(4);
    expect(bol.itens.map((i) => i.numero)).toEqual([
      "Boletim #01",
      "Boletim #02",
      "Boletim #03",
      "Boletim #04",
    ]);
    const texto = `${bol.titulo} ${bol.subtitulo} ${bol.itens.map((i) => `${i.titulo} ${i.resumo}`).join(" ")}`;
    expect(texto).not.toMatch(/R\$ 0(?![\d.,])/);
    expect(texto).not.toMatch(/\d\s*dB\b/i);
    expect(/\bseguro\b/i.test(texto)).toBe(false);
    for (const r of PALAVRAS_PROIBIDAS_UI) {
      expect(r.test(texto)).toBe(false);
    }
  });

  it("elimina textTransform: uppercase em toda a árvore UI (.tsx)", () => {
    const pastas = [
      join(__dirname, "..", "src", "componentes"),
      join(__dirname, "..", "src", "app"),
    ];
    const violacoes: string[] = [];
    for (const pasta of pastas) {
      for (const arquivo of listarTsxRecursivo(pasta)) {
        const src = readFileSync(arquivo, "utf8");
        if (/textTransform:\s*["']uppercase["']/.test(src)) {
          violacoes.push(arquivo);
        }
      }
    }
    expect(violacoes).toEqual([]);
  });

  it("calcula deslocamento geodésico real no Comparar e alterna critérios ao vivo na ConvergenciaFamiliar", () => {
    const bvMin = estimarMinutosPicoIdaVolta(null, "boa-viagem", "polo_porto_digital");
    const espMin = estimarMinutosPicoIdaVolta(null, "espinheiro", "polo_porto_digital");
    expect(bvMin).toBeGreaterThan(espMin);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(DueloFinalistas, {
            opcaoA: {
              id: "A",
              nomeExibicao: "Espinheiro 90m²",
              custoMensalTotalReais: 4200,
              areaM2: 90,
              deslocamentoMinDia: espMin,
              ruidoInternoDb: 38,
              situacaoDocumentalResumo: "Terreno alodial",
              riscoAguaChuvaResumo: "Cota acima da média",
            },
            opcaoB: {
              id: "B",
              nomeExibicao: "Boa Viagem 90m²",
              custoMensalTotalReais: 4600,
              areaM2: 90,
              deslocamentoMinDia: bvMin,
              ruidoInternoDb: 42,
              situacaoDocumentalResumo: "Terreno alodial",
              riscoAguaChuvaResumo: "Checar garagem na chuva",
            },
          }),
          React.createElement(ConvergenciaFamiliar, {
            perfilA: {
              pessoaNome: "Pessoa 1",
              imoveisFavoritosIds: ["A"],
              tetoMensalReais: 5000,
              exigeSilencioNoQuarto: true,
              exigeElevadorOuRampa: false,
            },
            perfilB: {
              pessoaNome: "Pessoa 2",
              imoveisFavoritosIds: ["A"],
              tetoMensalReais: 5000,
              exigeSilencioNoQuarto: false,
              exigeElevadorOuRampa: false,
            },
          }),
        ),
      );
    });

    expect(extrairTextos(tree.toJSON()).join("\n")).toContain("Terreno, cota e drenagem");
    const toggleSilencio = tree.root.find((n) => n.props.testID === "convergencia-toggle-silencio-b");
    const ajusteMais = tree.root.find((n) => n.props.testID === "convergencia-ajuste-teto-b");
    act(() => {
      toggleSilencio.props.onPress();
      ajusteMais.props.onPress();
    });
    const atualizado = extrairTextos(tree.toJSON()).join("\n");
    expect(atualizado).toContain("Pessoa 2: silêncio à noite (sim)");
    expect(atualizado).toContain("5.500");
  });

  it("expõe recorte micro de setor censitário (R16) e fallback de bairro em VidaAPeNaQuadra", () => {
    const essBv = essenciaisDoBairro("boa-viagem");
    const bv = edificiosDoBairro("boa-viagem");
    const predioRede = bv.find((e) => essBv?.predios[e.id]?.modo === "rede")!;
    expect(predioRede).toBeDefined();

    const semSetor = avaliarCaminhabilidadeEVidaNaRua({
      predio: predioRede,
      essenciais: essBv,
      visaoRua: null,
      nomeDoBairro: "Boa Viagem",
    });
    expect(semSetor.microContextoSetor).toContain("Escala do bairro");

    const comSetor = avaliarCaminhabilidadeEVidaNaRua({
      predio: predioRede,
      essenciais: essBv,
      visaoRua: {
        defesaCivil: null,
        grupos: [
          {
            id: "entorno",
            titulo: "Calçada e entorno da quadra",
            nota: null,
            fatos: [
              { id: "c1", rotulo: "Calçada", valor: "96%", detalhe: "Setor 2022", fonte: "censo_entorno", confianca: "oficial", data: "Censo 2022" },
              { id: "c2", rotulo: "Cinco ou mais árvores na face da quadra", valor: "72%", detalhe: "Setor 2022", fonte: "censo_entorno", confianca: "oficial", data: "Censo 2022" },
            ],
          },
          {
            id: "moradia",
            titulo: "Moradia na região",
            nota: null,
            fatos: [
              { id: "m1", rotulo: "Domicílios alugados", valor: "31%", detalhe: "Área de ponderação", fonte: "censo_amostra", confianca: "oficial", data: "Censo 2022" },
            ],
          },
        ],
      },
      nomeDoBairro: "Boa Viagem",
    });
    expect(comSetor.microContextoSetor).toContain("Recorte micro (setor Censo 2022)");
    expect(comSetor.microContextoSetor).toContain("Calçada 96%");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(VidaAPeNaQuadra, { dados: comSetor })),
      );
    });
    const elMicro = tree.root.find((n) => n.props.testID === "vida-a-pe-micro-setor");
    expect(elMicro).toBeDefined();
    expect(extrairTextos(tree.toJSON()).join("\n")).toContain("Calçada 96%");
  });

  it("decodifica ida e volta link #v= de dossiê único na Sala sem servidor", () => {
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 90, andar: 5 });
    const conf = avaliarConfortoTermico({
      andar: 5,
      pavimentosTotais: 14,
      fachada: inf.frente,
      bioclimatico: bio,
    });
    const acu = avaliarAcustica3d({
      andar: 5,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "coletora",
      distanciaViaM: 18,
      anoConstrucao: 2016,
      precoImovelReais: 850_000,
    });
    const radar = analisarRadarVistaELote({
      centro,
      edificio: null,
      fachadaAtiva: inf.frente,
      andar: 5,
      vizinhos: vizinhosMesmaRua,
      obrasProximas: null,
    });
    const pulso = calcularPulsoDaQuadra({
      conforto: conf,
      acustica: acu,
      anoConstrucao: 2016,
      obrasProximas: null,
      visaoRua: null,
      vinculoConfirmado: true,
      precoInformado: true,
      condominioInformado: true,
      comparacaoM2Pct: 0,
      spuAtivo: false,
    });
    const link = gerarLinkPrivadoSemServidor({
      entrada: {
        nomeImovel: "Edifício Beira-Mar",
        endereco: "Boa Viagem, Recife",
        modalidade: "compra",
        precoPrincipalReais: 850_000,
        mensalBolsoRealReais: 6_200,
        dinheiroEntrarReais: 195_000,
        fachadaResumo: "Nascente (5º andar)",
        conforto: conf,
        sossegoNivel: "Calmo",
        radar,
        pulso,
        anoConstrucao: 2016,
        unidades: 36,
        chaveLote14: "12345678901234",
        spuAtivo: false,
      },
    });
    const frag = link.split("#")[1]!;
    const lido = lerFragmento(`#${frag}`);
    expect(lido.tipo).toBe("resumo");
    if (lido.tipo !== "resumo") throw new Error("Esperado tipo resumo");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CartaoResumoCompartilhado, { resumo: lido.resumo }),
        ),
      );
    });
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Dossiê resumido compartilhado");
    expect(txt).toContain("Edifício Beira-Mar");
    expect(txt).toContain("Nascente (5º andar)");
    expect(txt).not.toMatch(/R\$ 0(?![\d.,])/);
  });

  it("aplica filtro multicritério exigirMercado com contador ao vivo em OndeMaisProcurarNoPiloto", () => {
    const ruas = [
      { c: "r1", n: "RUA DA HORA", b: "espinheiro", p: 4, m10: 0.9, t: [18] },
      { c: "r2", n: "RUA ISOLADA", b: "madalena", p: 2, m10: 0.1, t: [22] },
    ];
    const semFiltro = ondeMaisProcurar(ruas, ["recife"], "recife", 30, [], { exigirMercado: false });
    const comMercado = ondeMaisProcurar(ruas, ["recife"], "recife", 30, [], { exigirMercado: true });
    expect(semFiltro.total).toBe(2);
    expect(comMercado.total).toBe(1);
    expect(comMercado.ruas[0]!.c).toBe("r1");

    const explorarSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "inicio", "Explorar.tsx"),
      "utf8",
    );
    expect(explorarSrc).toContain("procura-toggle-mercado");
    expect(explorarSrc).toContain("procura-contador-vivo");
    expect(explorarSrc).toContain("exigirMercado");
  });

  it("desmodulariza Créditos e Perfil do Domicílio em linhas hairline e alvos de toque >= 44px", () => {
    const creditosSrc = readFileSync(join(__dirname, "..", "src", "app", "creditos.tsx"), "utf8");
    expect(creditosSrc).toContain("borderTopWidth: 1");
    expect(creditosSrc).not.toMatch(/accessibilityLabel="Extrato"[\s\S]*borderRadius:\s*8/);

    const perfilSrc = readFileSync(join(__dirname, "..", "src", "app", "perfil-domicilio.tsx"), "utf8");
    const secaoMatch = perfilSrc.match(/function SecaoDoPerfil[\s\S]*?return\s*\([\s\S]*?>/)?.[0] ?? "";
    expect(secaoMatch).toContain("borderTopWidth: 1");
    expect(secaoMatch).not.toMatch(/\bborderWidth:\s*1\b/);
    expect(perfilSrc).not.toMatch(/minHeight:\s*40\b/);
  });

  it("exibe janelas de validade B4, orientação CNIB, observabilidade Cherre e alvos >= 44px em CopilotoDocumentosPreSinal", () => {
    expect(PRAZOS_REFERENCIA_PRE_SINAL).toHaveLength(4);
    expect(PRAZOS_REFERENCIA_PRE_SINAL.some((p) => /30 dias/i.test(p.prazo))).toBe(true);
    expect(PRAZOS_REFERENCIA_PRE_SINAL.some((p) => /180 dias/i.test(p.prazo))).toBe(true);
    expect(ORIENTACAO_CNIB_ONR).toContain("não coleta nem consulta CPF");

    const vazio = auditarTextoColadoCidadao("   ");
    expect(vazio.camposReconhecidos).toEqual([]);
    expect(vazio.camposAusentesNoTrecho).toEqual([]);

    const parcial = auditarTextoColadoCidadao("Ata de assembleia aprova cota extra.");
    expect(parcial.camposReconhecidos).toContain("Atos R-n / AV-n ou cláusulas de condomínio");
    expect(parcial.camposAusentesNoTrecho).toContain("Chave CNM (16 dígitos)");
    expect(parcial.camposAusentesNoTrecho).toContain("Data de emissão");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CopilotoDocumentosPreSinal, {
            nomeImovel: "Edifício Solar",
            anoConstrucao: 2012,
            unidades: 28,
            chaveLote14: "12345678901234",
          }),
        ),
      );
    });

    const togglePrazos = tree.root.find((n) => n.props.testID === "toggle-prazos-pre-sinal");
    act(() => {
      togglePrazos.props.onPress();
    });
    const listaPrazos = tree.root.find((n) => n.props.testID === "lista-prazos-pre-sinal");
    expect(listaPrazos).toBeDefined();
    const txtPrazos = extrairTextos(tree.toJSON()).join("\n");
    expect(txtPrazos).toContain("Até 30 dias da emissão");
    expect(txtPrazos).toContain("180 dias da emissão");
    expect(txtPrazos).toContain("onr.org.br");

    const toggleLeitor = tree.root.find((n) => n.props.testID === "toggle-leitor-rapido-doc");
    act(() => {
      toggleLeitor.props.onPress();
    });
    const inputDoc = tree.root.find((n) => n.props.testID === "input-texto-documento");
    act(() => {
      inputDoc.props.onChangeText("Ata de assembleia aprova cota extra.");
    });
    const obsNode = tree.root.find((n) => n.props.testID === "observabilidade-leitura-doc");
    expect(obsNode).toBeDefined();
    const obsTxt = extrairTextos(tree.toJSON()).join("\n");
    expect(obsTxt).toContain("Lido neste recorte");
    expect(obsTxt).toContain("Ausente neste recorte");

    const copSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "visual", "CopilotoDocumentosPreSinal.tsx"),
      "utf8",
    );
    expect(copSrc).not.toMatch(/minHeight:\s*(?:38|42)\b/);
    expect(copSrc).not.toContain("TOQUE_MINIMO - 6");
  });

  it("exibe hipóteses determinísticas de isenção de IPTU (Ownwell app30), lembrete pré-sinal Winker e desmodulariza alertaMarinha em Custo", () => {
    expect(HIPOTESES_ISENCAO_IPTU_RECIFE).toHaveLength(4);
    expect(COMO_PEDIR_ISENCAO_RECIFE).toContain("Recife em Dia");
    for (const h of HIPOTESES_ISENCAO_IPTU_RECIFE) {
      const linha = `${h.titulo} ${h.requisito} ${h.comoConferir}`;
      expect(REGEX_JARGON_CAMADA1.test(linha)).toBe(false);
      for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(linha)).toBe(false);
    }

    const oficialCompra = {
      principal: { rotulo: "Preço anunciado" as const, valor: 720_000, porM2: 7200 },
      totalMensalConhecido: 980,
      alemDoPrincipal: null,
      parcelas: [
        { nome: "Condomínio" as const, estado: "conhecido" as const, valorMensal: 800, nota: null },
        { nome: "IPTU" as const, estado: "conhecido" as const, valorMensal: 180, nota: null },
      ],
      pendentes: 0,
      notaForaDaSoma: null,
    };

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(BlocoDeCusto, {
            custo: oficialCompra,
            area: 100,
            posicao: null,
            aoAbrirPosicao: () => undefined,
            aoAjustar: () => undefined,
            partes: {
              oficial: oficialCompra,
              referenciaIptuDoPredio: null,
              fatiasDaRotina: [
                {
                  id: "energia",
                  rotulo: "Energia elétrica estimada",
                  valorMensalReais: 240,
                  explicacaoHumana: "Tarifa homologada ANEEL",
                  fonteCurta: "ANEEL 2026",
                },
              ],
              somaRotinaEstimadaReais: 240,
              simulacaoCompra: null,
              alertaMarinha: {
                titulo: "Conferir regime de Terreno de Marinha",
                laudemioReferencia5PctReais: 36_000,
                explicacaoHumana: "Faixa costeira pede checagem do regime SPU na matrícula.",
                perguntaParaCorretor: "O terreno é alodial, foreiro ou sob ocupação da União?",
                fonteCurta: "SPU / DL 2.398/1987",
              },
              transferencia: null,
              comparacaoComTetoPessoal: null,
              janelaPoenteConsiderada: false,
            },
          }),
        ),
      );
    });

    const toggleEstimativas = tree.root.find(
      (n) =>
        n.props.accessibilityLabel === "Estimativas à parte: luz e financiamento. Toque para ver e ajustar" &&
        typeof n.props.onPress === "function",
    );
    act(() => {
      toggleEstimativas.props.onPress();
    });
    expect(tree.root.find((n) => n.props.testID === "custo-lembrete-doc-condominio")).toBeDefined();

    const toggleIptu = tree.root.find((n) => n.props.testID === "toggle-isencao-iptu-recife");
    act(() => {
      toggleIptu.props.onPress();
    });
    expect(tree.root.find((n) => n.props.testID === "lista-isencao-iptu-recife")).toBeDefined();

    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("declaração de quitação do condomínio");
    expect(txt).toContain("Recife em Dia");
    expect(txt).not.toMatch(/R\$ 0(?![\d.,])/);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    const custoSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Custo.tsx"),
      "utf8",
    );
    expect(custoSrc).not.toMatch(/minHeight:\s*32\b/);
    const blocoMarinha = custoSrc.match(/partes\.alertaMarinha \? \(\s*<View[\s\S]*?>/)?.[0] ?? "";
    expect(blocoMarinha).not.toMatch(/\bborderWidth:\s*1\b/);
    expect(blocoMarinha).toContain("borderLeftWidth: 3");
  });

  it("desmodulariza CaixaCreme de sobre-os-dados em hairlines, publica tabela ATTOM e cláusula local/não-treino Cherre/ONR", () => {
    const sobreSrc = readFileSync(
      join(__dirname, "..", "src", "app", "sobre-os-dados.tsx"),
      "utf8",
    );
    expect(sobreSrc).not.toMatch(/\bborderWidth:\s*1\b/);
    expect(sobreSrc).toContain("tabela-elementos-dados");
    expect(sobreSrc).toContain("nada é usado para treinar modelos");
    expect(sobreSrc).toContain("não substitui certidão oficial nem responsabiliza o app");
  });

  it("expõe escada de ação prática e ficha de método de 6 campos (Jupiter app28 / Symbium) em RadarVistaELote", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const edificio = bv.find((e) => e.poligono && e.poligono.length >= 3)!;
    const inf = inferirFachadasDoEdificio({ edificio, textoAnuncio: "" });

    const radarComObra = analisarRadarVistaELote({
      centro: edificio.centro,
      edificio,
      fachadaAtiva: inf.frente,
      andar: 5,
      vizinhos: bv.slice(0, 6).map((v) => ({
        id: v.id,
        centro: v.centro,
        logradouro: v.logradouro ?? "",
        pavimentos: v.pavimentos,
        poligono: v.poligono,
      })),
      obrasProximas: {
        licencasDeObra: 2,
        relevantes24m: 1,
        demolicoes24m: 0,
        recentes: [
          {
            categoria: "construcao",
            descricao: "Edifício residencial multipavimentos",
            data: "2026-08",
            situacao: "EMITIDA",
            centro: [
              edificio.centro[0] + Math.sin((inf.frente.azimuteGraus * Math.PI) / 180) * 0.00035,
              edificio.centro[1] + Math.cos((inf.frente.azimuteGraus * Math.PI) / 180) * 0.00035,
            ],
            distanciaM: 40,
          },
        ],
      },
    });
    expect(radarComObra.acoesPraticas.length).toBeGreaterThan(0);
    expect(radarComObra.fichaMetodo.janelaTemporal).toContain("24 meses");

    const radarLimpo = analisarRadarVistaELote({
      centro: edificio.centro,
      edificio: null,
      fachadaAtiva: inf.frente,
      andar: 5,
      vizinhos: [],
      obrasProximas: null,
    });
    expect(radarLimpo.acoesPraticas).toEqual([]);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(RadarVistaELote, { radar: radarComObra }),
        ),
      );
    });

    expect(tree.root.find((n) => n.props.testID === "radar-acoes-praticas")).toBeDefined();
    const toggle = tree.root.find((n) => n.props.testID === "radar-toggle-metodo");
    act(() => {
      toggle.props.onPress();
    });
    expect(tree.root.find((n) => n.props.testID === "radar-ficha-metodo")).toBeDefined();

    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("O que conferir antes de avançar");
    expect(txt).toContain("Janela:");
    expect(txt).toContain("Não inclui:");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    const radarSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "visual", "RadarVistaELote.tsx"),
      "utf8",
    );
    expect(radarSrc).not.toContain("TOQUE_MINIMO - 4");
  });

  it("unifica tipografia PlusJakartaSans/tabular-nums, metadado v2 Gridics e origem por rubrica Ownwell em S34", () => {
    for (const rel of [
      "src/componentes/caderno/LeitorDeAta.tsx",
      "src/componentes/dossie-v1/PorPerto.tsx",
      "src/componentes/dossie-v1/MapaDoLote.tsx",
      "src/componentes/visual/ExportarResumoExecutivo.tsx",
    ]) {
      const src = readFileSync(join(__dirname, "..", rel), "utf8");
      expect(src).not.toContain("JetBrainsMono");
    }

    const bv = edificiosDoBairro("boa-viagem");
    const edificio = bv.find((e) => e.poligono && e.poligono.length >= 3)!;
    const inf = inferirFachadasDoEdificio({ edificio, textoAnuncio: "" });
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 90, andar: 3 });
    const conf = avaliarConfortoTermico({
      andar: 3,
      pavimentosTotais: 10,
      fachada: inf.frente,
      bioclimatico: bio,
    });
    const radar = analisarRadarVistaELote({
      centro: edificio.centro,
      edificio: null,
      fachadaAtiva: inf.frente,
      andar: 3,
      vizinhos: [],
      obrasProximas: null,
    });
    const pulso = calcularPulsoDaQuadra({
      conforto: conf,
      acustica: avaliarAcustica3d({
        andar: 3,
        fachadaVoltadaParaVia: "frente",
        tipologiaVia: "local",
        distanciaViaM: 12,
        anoConstrucao: null,
        precoImovelReais: null,
      }),
      anoConstrucao: null,
      obrasProximas: null,
      visaoRua: null,
      vinculoConfirmado: false,
      precoInformado: false,
      condominioInformado: false,
      comparacaoM2Pct: null,
      spuAtivo: false,
    });

    const resumo = gerarTextoResumoExecutivo({
      nomeImovel: "Apartamento em análise",
      endereco: "Boa Viagem, Recife",
      modalidade: "compra",
      precoPrincipalReais: null,
      mensalBolsoRealReais: null,
      dinheiroEntrarReais: null,
      fachadaResumo: "Nascente (3º andar)",
      conforto: conf,
      sossegoNivel: "Calmo",
      radar,
      pulso,
      anoConstrucao: null,
      unidades: null,
      chaveLote14: null,
      spuAtivo: false,
    });
    expect(resumo).toContain("Modelo do dossiê: v2");
    expect(resumo).toContain("Itens faltantes visíveis antes do sinal");
    expect(resumo).toContain("chave municipal do lote");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(SimuladorBolso15Segundos)),
      );
    });
    const toggle = tree.root.find((n) => n.props.testID === "simulador-15s-toggle");
    act(() => {
      toggle.props.onPress();
    });
    expect(tree.root.find((n) => n.props.testID === "sim15-origens-calculo")).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Origem de cada linha");
    expect(txt).toContain("Banco Central");
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("desenha cota visual 2.5D do andar ativo, exibe economia mensal de trânsito e blinda WCAG >= 44px em visual/", () => {
    const visualDir = join(__dirname, "..", "src", "componentes", "visual");
    const violacoesToque: string[] = [];
    for (const arquivo of listarTsxRecursivo(visualDir)) {
      const src = readFileSync(arquivo, "utf8");
      if (/\bTOQUE_MINIMO\s*-/.test(src) || /\bminHeight:\s*(?:3[0-9]|4[0-3])\b/.test(src)) {
        violacoesToque.push(arquivo);
      }
    }
    expect(violacoesToque).toEqual([]);

    const bv = edificiosDoBairro("boa-viagem");
    const predio = bv.find((e) => e.poligono && e.poligono.length >= 3)!;
    const inf = inferirFachadasDoEdificio({ edificio: predio, textoAnuncio: "" });

    let canvasTree!: TestRenderer.ReactTestRenderer;
    act(() => {
      canvasTree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CanvasSolSombraBrisa25D, {
            inferencia: inf,
            fachadaSelecionada: inf.frente.id,
            aoSelecionarFachada: () => undefined,
            andar: 5,
            aoAlterarAndar: () => undefined,
            pavimentosTotais: 14,
            centro: predio.centro,
          }),
        ),
      );
    });
    expect(
      canvasTree.root.find((n) => n.props.testID === "canvas-cota-andar-ativo"),
    ).toBeDefined();

    let rotinaTree!: TestRenderer.ReactTestRenderer;
    act(() => {
      rotinaTree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(RotinaDoisDestinosComparar, {
            nomeOpcaoA: "Opção Boa Viagem",
            centroA: null,
            bairroA: "boa-viagem",
            nomeOpcaoB: "Opção Graças",
            centroB: null,
            bairroB: "gracas",
          }),
        ),
      );
    });
    expect(
      rotinaTree.root.find((n) => n.props.testID === "rotina-economia-mensal"),
    ).toBeDefined();
    const rotinaTxt = extrairTextos(rotinaTree.toJSON()).join("\n");
    expect(rotinaTxt).toContain("h/mês a menos no trânsito");
    expect(REGEX_JARGON_CAMADA1.test(rotinaTxt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(rotinaTxt)).toBe(false);
  });

  it("exibe comparativo temporal ano contra ano ou série 2018–2026 em LinhaUnificadaDoLote", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const comItbi = bv.find((e) => (e.itbi?.porAno?.length ?? 0) >= 2)!;
    const linhaItbi = construirLinhaUnificadaDoLote({
      edificio: comItbi,
      obrasProximas: null,
      visaoRua: null,
      spuAtivo: false,
    });
    expect(linhaItbi.comparativoTemporal).toMatch(/Ritmo fiscal no edifício: \d+ transmiss/);

    const linhaObras = construirLinhaUnificadaDoLote({
      edificio: null,
      obrasProximas: {
        licencasDeObra: 5,
        relevantes24m: 2,
        demolicoes24m: 1,
        recentes: [],
      },
      visaoRua: null,
      spuAtivo: false,
    });
    expect(linhaObras.comparativoTemporal).toContain("2 relevante(s) nos últimos 24 meses frente a 5");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(LinhaUnificadaDoLote, { linha: linhaItbi }),
        ),
      );
    });
    expect(tree.root.find((n) => n.props.testID === "linha-comparativo-temporal")).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Ritmo fiscal no edifício");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("elimina minHeight < 44px em controles interativos de visita-v1 e dossie-v1 (S37)", () => {
    const alvos = [
      "src/componentes/visita-v1/NoImovel.tsx",
      "src/componentes/visita-v1/Orientacao.tsx",
      "src/componentes/dossie-v1/MapaDoLote.tsx",
      "src/componentes/dossie-v1/PorPerto.tsx",
      "src/componentes/dossie-v1/Topo.tsx",
    ];
    for (const rel of alvos) {
      const src = readFileSync(join(__dirname, "..", rel), "utf8");
      expect(src).not.toMatch(/\bminHeight:\s*(?:34|36|38|40)\b/);
    }
  });

  it("projeta volume e sombra 2.5D de obras licenciadas reais ao ativar torres futuras (Localize.city S38)", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const predio = bv.find((e) => e.poligono && e.poligono.length >= 3)!;
    const inf = inferirFachadasDoEdificio({ edificio: predio, textoAnuncio: "" });

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CanvasSolSombraBrisa25D, {
            inferencia: inf,
            fachadaSelecionada: inf.frente.id,
            aoSelecionarFachada: () => undefined,
            andar: 5,
            aoAlterarAndar: () => undefined,
            pavimentosTotais: 14,
            centro: predio.centro,
            vizinhosLotes: [
              {
                id: "viz-existente-8p",
                centro: [predio.centro[0] + 0.00045, predio.centro[1]],
                logradouro: "Rua Existente",
                pavimentos: 8,
                poligono: null,
              },
            ],
            obrasEntorno: {
              licencasDeObra: 1,
              relevantes24m: 1,
              demolicoes24m: 0,
              recentes: [
                {
                  categoria: "construcao",
                  descricao: "ALVARA TORRE NOVA",
                  data: "2026-06",
                  situacao: "EMITIDA",
                  centro: [predio.centro[0] - 0.00034, predio.centro[1]],
                  distanciaM: 37,
                },
              ],
            },
          }),
        ),
      );
    });

    expect(tree.root.findAll((n) => n.props.children === "Obra").length).toBeGreaterThan(0);
    expect(tree.root.findAll((n) => n.props.children === "18p")).toHaveLength(0);

    const toggleFut = tree.root.find((n) => n.props.testID === "toggle-torres-futuras");
    act(() => {
      toggleFut.props.onPress();
    });
    expect(tree.root.findAll((n) => n.props.children === "18p").length).toBeGreaterThan(0);
    const depois = extrairTextos(tree.toJSON()).join("\n");
    expect(depois).toContain("Risco de torres futuras: ligado");
    expect(REGEX_JARGON_CAMADA1.test(depois)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(depois)).toBe(false);
  });

  it("unifica tipografia PlusJakartaSans/tabular-nums e desmodulariza respostas em Sala, FichaViva, EntornoSolar, MapaDoPredio e perfil-domicilio (S39)", () => {
    for (const rel of [
      "src/componentes/comparar/Sala.tsx",
      "src/componentes/dossie-v1/FichaViva.tsx",
      "src/app/perfil-domicilio.tsx",
      "src/componentes/sol/EntornoSolar.tsx",
      "src/componentes/predio/MapaDoPredio.tsx",
    ]) {
      const src = readFileSync(join(__dirname, "..", rel), "utf8");
      expect(src).not.toContain("JetBrainsMono");
    }

    const salaSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "comparar", "Sala.tsx"),
      "utf8",
    );
    const respBlock = salaSrc.match(/resposta\.respostas\.map[\s\S]*?<\/View>/)?.[0] ?? "";
    expect(respBlock).toContain("borderTopWidth");
    expect(respBlock).not.toMatch(/borderRadius:\s*12/);
  });

  it("nomeia resolução por edifício e posição relativa explícita (Local Logic / ClimateCheck) em S40", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const essBv = essenciaisDoBairro("boa-viagem")!;
    const predioRede = bv.find((e) => essBv.predios[e.id]?.modo === "rede")!;
    const cam = avaliarCaminhabilidadeEVidaNaRua({
      predio: predioRede,
      essenciais: essBv,
      visaoRua: null,
      nomeDoBairro: "Boa Viagem",
    });
    expect(cam.escopoGranularidade).toContain("não média de CEP ou esquina");
    expect(cam.frasePercentil).toContain("Posição relativa:");

    const inf = inferirFachadasDoEdificio({ edificio: predioRede, textoAnuncio: "" });
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 90, andar: 4 });
    const conf = avaliarConfortoTermico({
      andar: 4,
      pavimentosTotais: 12,
      fachada: inf.frente,
      bioclimatico: bio,
    });
    const pulso = calcularPulsoDaQuadra({
      conforto: conf,
      acustica: avaliarAcustica3d({
        andar: 4,
        fachadaVoltadaParaVia: "frente",
        tipologiaVia: "local",
        distanciaViaM: 14,
        anoConstrucao: 2010,
        precoImovelReais: 750_000,
      }),
      anoConstrucao: 2010,
      obrasProximas: null,
      visaoRua: null,
      vinculoConfirmado: true,
      precoInformado: true,
      condominioInformado: true,
      comparacaoM2Pct: 0,
      spuAtivo: false,
    });
    expect(pulso.escopoResolucao).toContain("escala deste edifício");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(VidaAPeNaQuadra, { dados: cam }),
          React.createElement(PulsoDaQuadra, { pulso }),
        ),
      );
    });
    expect(tree.root.find((n) => n.props.testID === "vida-a-pe-escopo-edificio")).toBeDefined();
    expect(tree.root.find((n) => n.props.testID === "pulso-escopo-edificio")).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Posição relativa:");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("verifica afirmação do anúncio vs geometria (HouseCanary app9) e atenuação acústica sem dB (Mapa Sossego app1) em S42", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const predio = bv.find((e) => e.poligono && e.poligono.length >= 3 && e.centro)!;
    const infNascente = inferirFachadasDoEdificio({
      edificio: predio,
      textoAnuncio: "Apartamento nascente com sol da manhã",
    });
    const sim = simularUnidade({
      predio,
      vizinhos: bv,
      tipo: "apartamento",
      andar: 4,
      fachadaGraus: 90,
    });
    expect(sim.barulho.nota).toContain("dobrar a distância reduz de forma relevante o efeito da fonte");
    expect(sim.barulho.nota).not.toMatch(/\d+\s*dB/i);

    const poente = infNascente.fachadas.find((f) => !f.compativelComAnuncio) ?? infNascente.fundos;
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CanvasSolSombraBrisa25D, {
            inferencia: infNascente,
            fachadaSelecionada: poente.id,
            aoSelecionarFachada: () => undefined,
            andar: 4,
            aoAlterarAndar: () => undefined,
            pavimentosTotais: 12,
            centro: predio.centro,
          }),
        ),
      );
    });
    expect(tree.root.find((n) => n.props.testID === "canvas-checagem-anuncio")).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Anúncio cita");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("unifica escala 0–10 entre Pulso e Escalas, declara limite acústico e exibe próxima ação na visita em S43", () => {
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 270, andar: 12 });
    const conf = avaliarConfortoTermico({
      andar: 12,
      pavimentosTotais: 12,
      fachadaAzimuteGraus: 270,
      bioclimatico: bio,
    });
    const acu = avaliarAcustica3d({
      andar: 4,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "coletora",
      distanciaViaM: 12,
      anoConstrucao: 2005,
      precoImovelReais: 680_000,
    });
    const pulso = calcularPulsoDaQuadra({
      conforto: conf,
      acustica: acu,
      anoConstrucao: 2005,
      obrasProximas: null,
      visaoRua: null,
      vinculoConfirmado: true,
      precoInformado: true,
      condominioInformado: true,
      comparacaoM2Pct: 0,
      spuAtivo: false,
    });
    const sintese = decomporSossego(acu, 2005);

    // Escala única 0–10 (HowLoud R36): mesmos valores numéricos entre cartões e PulsoDaQuadra
    expect(conf.notaConforto0a10).toBe(pulso.eixos[0].nota0a10);
    expect(sintese.notaSossego0a10).toBe(pulso.eixos[1].nota0a10);
    expect(sintese.avisoEstimativaSemLaudo).not.toMatch(/\d+\s*dB/i);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(EscalaDeRuidoHumana, { acustica: acu, anoConstrucao: 2005 }),
          React.createElement(RelogioDoPredio, { anoConstrucao: 2005, unidades: 24, pavimentos: 12 }),
          React.createElement(TermometroConfortoTermico, { conforto: conf, andar: 12 }),
        ),
      );
    });

    expect(tree.root.find((n) => n.props.testID === "escala-ruido-nota-0a10")).toBeDefined();
    expect(tree.root.find((n) => n.props.testID === "escala-ruido-aviso-metodo")).toBeDefined();
    expect(tree.root.find((n) => n.props.testID === "relogio-acao-visita")).toBeDefined();
    expect(tree.root.find((n) => n.props.testID === "termometro-nota-0a10")).toBeDefined();
    expect(tree.root.find((n) => n.props.testID === "termometro-acao-visita")).toBeDefined();

    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain(`${sintese.notaSossego0a10.toFixed(1).replace(".", ",")} / 10`);
    expect(txt).toContain(`${conf.notaConforto0a10.toFixed(1).replace(".", ",")} / 10`);
    expect(txt).toContain("não equivale a medição acústica no local");
    expect(txt).toContain("O que checar");
    expect(txt).not.toMatch(/\d+\s*dB/i);
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("adiciona faixa descritiva de caminhabilidade (Walk Score) e resumo de 3 séries passado→hoje (ClimateCheck) em S44", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const essBv = essenciaisDoBairro("boa-viagem")!;
    const predioRede = bv.find((e) => essBv.predios[e.id]?.modo === "rede")!;
    const cam = avaliarCaminhabilidadeEVidaNaRua({
      predio: predioRede,
      essenciais: essBv,
      visaoRua: null,
      nomeDoBairro: "Boa Viagem",
    });
    expect(cam.faixaDescritivaAPe).toBeTruthy();

    const camSemPredio = avaliarCaminhabilidadeEVidaNaRua({
      predio: null,
      essenciais: essBv,
      visaoRua: null,
      nomeDoBairro: "Boa Viagem",
    });
    expect(camSemPredio.faixaDescritivaAPe).toBeNull();

    const linha = construirLinhaUnificadaDoLote({
      edificio: predioRede,
      obrasProximas: { licencasDeObra: 3, relevantes24m: 1, demolicoes24m: 0, recentes: [] },
      visaoRua: null,
      spuAtivo: false,
    });
    expect(linha.resumoTresSeriesPassado).toContain("Três séries até hoje —");

    const linhaVazia = construirLinhaUnificadaDoLote({
      edificio: null,
      obrasProximas: null,
      visaoRua: null,
      spuAtivo: false,
    });
    expect(linhaVazia.resumoTresSeriesPassado).toBeNull();

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(VidaAPeNaQuadra, { dados: cam }),
          React.createElement(LinhaUnificadaDoLote, { linha }),
        ),
      );
    });
    expect(tree.root.find((n) => n.props.testID === "vida-a-pe-faixa-descritiva")).toBeDefined();
    expect(tree.root.find((n) => n.props.testID === "linha-tres-series-historico")).toBeDefined();

    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain(cam.faixaDescritivaAPe!);
    expect(txt).toContain("Três séries até hoje —");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("desmodulariza acordeões do SimuladorDaUnidade e nomeia colunas A×B e régua única em Comparar em S45", () => {
    const simSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "SimuladorDaUnidade.tsx"),
      "utf8",
    );
    expect(simSrc).toContain("simulador-painel-unificado");
    expect((simSrc.match(/borderWidth:\s*1/g) ?? []).length).toBeLessThanOrEqual(3);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(DueloFinalistas, {
            opcaoA: {
              id: "A",
              nomeExibicao: "Graças 95m²",
              custoMensalTotalReais: 4100,
              areaM2: 95,
              deslocamentoMinDia: 32,
              ruidoInternoDb: 38,
              situacaoDocumentalResumo: "Terreno alodial",
              riscoAguaChuvaResumo: "Cota acima da média",
            },
            opcaoB: {
              id: "B",
              nomeExibicao: "Boa Viagem 95m²",
              custoMensalTotalReais: 4550,
              areaM2: 95,
              deslocamentoMinDia: 48,
              ruidoInternoDb: 44,
              situacaoDocumentalResumo: "Terreno de Marinha",
              riscoAguaChuvaResumo: "Checar garagem na chuva",
            },
          }),
          React.createElement(MatrizVisualComparar, {
            modalidade: "compra",
            opcaoA: {
              nome: "Graças 95m²",
              precoPrincipalReais: 780_000,
              areaM2: 95,
              mensalBolsoRealReais: 4100,
              orientacaoCurta: "Nascente",
              climaSelo: "Fresco e ventilado",
              confortoQuente: false,
              ruidoInternoDb: 38,
              anoConstrucao: 2016,
              spuAlerta: false,
            },
            opcaoB: {
              nome: "Boa Viagem 95m²",
              precoPrincipalReais: 850_000,
              areaM2: 95,
              mensalBolsoRealReais: 4550,
              orientacaoCurta: "Poente",
              climaSelo: "Tende a abafar",
              confortoQuente: true,
              ruidoInternoDb: 44,
              anoConstrucao: 2005,
              spuAlerta: true,
            },
          }),
        ),
      );
    });

    expect(tree.root.find((n) => n.props.testID === "duelo-cabecalho-colunas")).toBeDefined();
    expect(tree.root.find((n) => n.props.testID === "matriz-aviso-escala")).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Graças 95m²");
    expect(txt).toContain("Boa Viagem 95m²");
    expect(txt).toContain("mesma régua nos dois imóveis");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("expõe fundamento normativo LC Municipal nº 2/2021 e aritmética do recuo (Symbium / Gridics) em RadarVistaELote em S46", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const predio = bv.find((e) => e.poligono && e.poligono.length >= 3 && e.centro)!;
    const inf = inferirFachadasDoEdificio({ edificio: predio, textoAnuncio: "" });
    const radar = analisarRadarVistaELote({
      centro: predio.centro,
      edificio: predio,
      fachadaAtiva: inf.frente,
      andar: 6,
      vizinhos: bv,
      obrasProximas: null,
    });
    expect(radar.fundamentoNormativoEAritmetica).toContain("LC Municipal nº 2/2021");
    expect(radar.fundamentoNormativoEAritmetica).toContain("±42°");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(RadarVistaELote, { radar }),
        ),
      );
    });
    expect(tree.root.find((n) => n.props.testID === "radar-fundamento-aritmetica")).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("LC Municipal nº 2/2021");
    expect(txt).toContain("±42°");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("exibe seção explícita sem leitura quando anoConstrucao ausente em RelogioDoPredio (NeighborhoodScout R26 / Regrid R17) em S47", () => {
    let arvoreOculta!: TestRenderer.ReactTestRenderer;
    let arvoreVisivel!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvoreOculta = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(RelogioDoPredio, { anoConstrucao: null, unidades: null, pavimentos: null }),
        ),
      );
      arvoreVisivel = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(RelogioDoPredio, {
            anoConstrucao: null,
            unidades: null,
            pavimentos: null,
            exibirSemLeitura: true,
          }),
        ),
      );
    });
    expect(arvoreOculta.toJSON()).toBeNull();
    expect(arvoreVisivel.root.find((n) => n.props.testID === "relogio-do-predio-vazio")).toBeDefined();
    const txt = extrairTextos(arvoreVisivel.toJSON()).join("\n");
    expect(txt).toContain("Sem leitura publicada de ano de entrega");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("remove último dB não calibrado em BussolaSolarBrisa e unifica notas 0–10 no PlacarHeroi5Segundos em S48", () => {
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 90, andar: 7 });
    const conf = avaliarConfortoTermico({
      andar: 7,
      pavimentosTotais: 14,
      fachadaAzimuteGraus: 90,
      bioclimatico: bio,
    });
    const acu = avaliarAcustica3d({
      andar: 7,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "local",
      distanciaViaM: 12,
      anoConstrucao: 2018,
      precoImovelReais: 850_000,
    });

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(BussolaSolarBrisa, { azimuteGraus: 105, ruidoDbAtual: 35.4 }),
          React.createElement(PlacarHeroi5Segundos, {
            modalidade: "compra",
            precoPrincipalReais: 850_000,
            mensalBolsoRealReais: 5_900,
            dinheiroParaEntrarReais: 195_000,
            comparacaoM2Pct: -4,
            orientacaoCurta: "Nascente",
            conforto: conf,
            ruidoDormitorioDb: acu.ruidoInternoDormitorioDbA,
          }),
        ),
      );
    });

    expect(tree.root.find((n) => n.props.testID === "bussola-som-ambiente")).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("zero gravação de áudio");
    expect(txt).toContain(`${conf.notaConforto0a10.toFixed(1).replace(".", ",")}/10`);
    expect(txt).not.toMatch(/\d+\s*dB/i);
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("abre gaveta de base legal e fórmulas (Decreto-Lei nº 2.398/1987 e 180 dias) em TresPerguntasDoBolso em S49", () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(TresPerguntasDoBolso, {
            modalidade: "compra",
            nomeImovel: "Residencial Mar Azul",
            enderecoImovel: "Boa Viagem",
            precoAnuncioReais: 850_000,
            aluguelAnunciadoReais: null,
            condominioMensalReais: 950,
            iptuMensalReais: 260,
            prestacaoEstimadaReais: 5_100,
            entradaReais: 170_000,
            itbiReais: 10_000,
            cartorioRegistroReais: 6_500,
            spuAnualReais: 2_400,
            custoMensalArReais: 140,
            economiaLegalItbiCartorioReais: 15_000,
            descontoRuidoReais: 0,
            vplCalorPoenteReais: 0,
            riscoManutencaoPredioReais: 0,
            excedenteMedianaM2Reais: 0,
            saldo10AnosCompraVsAluguelReais: 120_000,
          }),
        ),
      );
    });

    const toggle = tree.root.find((n) => n.props.testID === "bolso-metodo-toggle");
    expect(toggle).toBeDefined();
    act(() => {
      toggle.props.onPress();
    });
    expect(tree.root.find((n) => n.props.testID === "bolso-ficha-metodo")).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Decreto-Lei nº 2.398/1987");
    expect(txt).toContain("180 dias");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("expõe diligência estatutária do Recife (AQUA/Compesa, vistoria trienal PE e CAT 90 dias) em CopilotoDocumentosPreSinal em S50", () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CopilotoDocumentosPreSinal, {
            nomeImovel: "Residencial Atlântico",
            anoConstrucao: 2012,
            unidades: 36,
            chaveLote14: "12345678901234",
            spuAtivo: true,
          }),
        ),
      );
    });
    const toggle = tree.root.find((n) => n.props.testID === "toggle-prazos-pre-sinal");
    act(() => {
      toggle.props.onPress();
    });
    expect(tree.root.find((n) => n.props.testID === "alertas-diligencia-recife")).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("AQUA Pernambuco");
    expect(txt).toContain("Lei Estadual PE nº 13.032/2006");
    expect(txt).toContain("CAT");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("exibe dias úteis/ano em RotinaDoisDestinosComparar e alterna presets de entrada em SimuladorTco10Anos em S51", () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(RotinaDoisDestinosComparar, {
            nomeOpcaoA: "Opção Boa Viagem",
            centroA: null,
            bairroA: "boa-viagem",
            nomeOpcaoB: "Opção Graças",
            centroB: null,
            bairroB: "gracas",
          }),
          React.createElement(SimuladorTco10Anos, {
            entrada: {
              precoCompraReais: 850_000,
              aluguelEquivalenteMensalReais: 3_900,
              condominioMensalReais: 950,
              iptuAnualReais: 2_800,
            },
          }),
        ),
      );
    });

    expect(tree.root.find((n) => n.props.testID === "rotina-aviso-tabela")).toBeDefined();
    const antesTxt = extrairTextos(tree.toJSON()).join("\n");
    expect(antesTxt).toContain("dias úteis de 8h por ano");
    expect(antesTxt).toContain("sem rastreamento GPS pessoal");

    const preset50 = tree.root.find((n) => n.props.testID === "tco-preset-50");
    act(() => {
      preset50.props.onPress();
    });
    const depoisTxt = extrairTextos(tree.toJSON()).join("\n");
    expect(depoisTxt).not.toBe(antesTxt);
    expect(REGEX_JARGON_CAMADA1.test(depoisTxt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(depoisTxt)).toBe(false);
  });

  it("unifica hairlines 1px, substitui caixa interna em FichaViva e garante minHeight >= 44 em Placar/Entorno em S52", () => {
    const fichaSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "FichaViva.tsx"),
      "utf8",
    );
    expect(fichaSrc).toContain('borderLeftWidth: 3, borderLeftColor: cor("cor-azul-cadastral")');
    expect(fichaSrc).not.toContain("borderRadius: 10, backgroundColor:");
    expect(fichaSrc).not.toMatch(/borderTopWidth:\s*[^,\n]*0\.5/);

    const entornoSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Entorno.tsx"),
      "utf8",
    );
    expect(entornoSrc).toContain("minHeight: 48");
    expect(entornoSrc).not.toMatch(/borderTopWidth:\s*[^,\n]*0\.5/);

    const placarSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "comparar", "Placar.tsx"),
      "utf8",
    );
    expect(placarSrc).toContain("minHeight: 48");

    const explorarSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "inicio", "Explorar.tsx"),
      "utf8",
    );
    expect(explorarSrc).not.toMatch(/borderTopWidth:\s*0\.5/);
  });

  it("permite ocultar valores financeiros e exclui notas privadas por padrão no Resumo Executivo em S53", () => {
    const bio = avaliarBioclimatico3d({ fachadaAzimuteGraus: 90, andar: 5 });
    const conf = avaliarConfortoTermico({
      andar: 5,
      pavimentosTotais: 12,
      fachadaAzimuteGraus: 90,
      bioclimatico: bio,
    });
    const radar = analisarRadarVistaELote({
      centro: [-34.896, -8.121],
      edificio: null,
      fachadaAtiva: inferirFachadasDoEdificio({
        edificio: { id: "x", bairro: "boa-viagem", logradouro: "Rua X", centro: [-34.896, -8.121], poligono: null },
        textoAnuncio: "",
      }).frente,
      andar: 5,
      vizinhos: [],
      obrasProximas: null,
    });
    const pulso = calcularPulsoDaQuadra({
      conforto: conf,
      acustica: avaliarAcustica3d({
        andar: 5,
        fachadaVoltadaParaVia: "frente",
        tipologiaVia: "local",
        distanciaViaM: 12,
        anoConstrucao: 2016,
        precoImovelReais: 850_000,
      }),
      anoConstrucao: 2016,
      obrasProximas: null,
      visaoRua: null,
      vinculoConfirmado: true,
      precoInformado: true,
      condominioInformado: true,
      comparacaoM2Pct: 0,
      spuAtivo: false,
    });

    const entradaResumo = {
      nomeImovel: "Residencial Privacidade",
      endereco: "Boa Viagem, Recife",
      modalidade: "compra" as const,
      precoPrincipalReais: 850_000,
      mensalBolsoRealReais: 5_400,
      dinheiroEntrarReais: 195_000,
      fachadaResumo: "Nascente (5º andar)",
      conforto: conf,
      sossegoNivel: "Calmo",
      radar,
      pulso,
      anoConstrucao: 2016,
      unidades: 24,
      chaveLote14: "12345678901234",
      spuAtivo: false,
    };

    const textoOculto = gerarTextoResumoExecutivo(entradaResumo, {
      ocultarValoresFinanceiros: true,
    });
    expect(textoOculto).not.toContain("R$ 850.000");
    expect(textoOculto).toContain("Ocultado pelo usuário neste envio");
    expect(textoOculto).toContain("Ocultados pelo usuário");
    expect(textoOculto).toContain("notas privadas do seu caderno ficam de fora por padrão");

    const linkOculto = gerarLinkPrivadoSemServidor({
      entrada: entradaResumo,
      ocultarValoresFinanceiros: true,
    });
    const hash = linkOculto.split("#")[1]!;
    const dec = lerFragmento(`#${hash}`);
    expect(dec.tipo).toBe("resumo");
    if (dec.tipo === "resumo") {
      expect(dec.resumo.p).toBeNull();
      expect(dec.resumo.mb).toBeNull();
    }

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(ExportarResumoExecutivo, { entrada: entradaResumo }),
        ),
      );
    });
    const toggleValores = tree.root.find(
      (n) => n.props.testID === "toggle-ocultar-valores-resumo",
    );
    const botaoPrevia = tree.root
      .findAll((n) => typeof n.props.onPress === "function" && n.props.accessibilityState?.expanded !== undefined)[0]!;
    act(() => {
      toggleValores.props.onPress();
      botaoPrevia.props.onPress();
    });

    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Modo técnico ativo: valores financeiros ocultos");
    expect(txt).not.toContain("R$ 850.000");
    expect(txt).toContain("Ocultado pelo usuário neste envio");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("adiciona cópia em 1 toque, assinatura VEREDA e divisória hairline em ResumoEvidenciaPartilhavel em S54", () => {
    const src = readFileSync(
      join(__dirname, "..", "src", "componentes", "cidadao", "ResumoEvidenciaPartilhavel.tsx"),
      "utf8",
    );
    expect(src).not.toContain("comAlfa");
    expect(src).not.toContain('backgroundColor: cor("cor-papel-claro"), borderRadius:');

    const texto = montarTextoNegociacaoPartilhavel({
      tituloImovel: "Residencial Capibaribe",
      dsqfl: "11223344556677",
      cnm16: "077214.2.0045123-71",
      cartoes: [],
    });
    expect(texto).toContain("Mensagem preparada com o VEREDA.");
    expect(texto).not.toMatch(/mobilidade|vis[aã]o|cadeirante|idoso/i);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(ResumoEvidenciaPartilhavel, {
            tituloImovel: "Residencial Capibaribe",
            dsqfl: "11223344556677",
            cnm16: "077214.2.0045123-71",
            cartoes: [],
          }),
        ),
      );
    });
    expect(tree.root.find((n) => n.props.testID === "botao-copiar-roteiro-evidencia")).toBeDefined();
    const previaBtn = tree.root.find((n) => n.props.testID === "botao-alternar-previa-roteiro");
    act(() => {
      previaBtn.props.onPress();
    });
    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Mensagem preparada com o VEREDA.");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("alterna entrada 20%/35% na compra e Caução/Seguro fiança no aluguel em SimuladorBolso15Segundos em S55", () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(SimuladorBolso15Segundos)),
      );
    });

    const toggle = tree.root.find((n) => n.props.testID === "simulador-15s-toggle");
    act(() => {
      toggle.props.onPress();
    });
    const compra20Txt = extrairTextos(tree.toJSON()).join("\n");

    const entrada35Btn = tree.root.find((n) => n.props.testID === "sim15-entrada-35");
    act(() => {
      entrada35Btn.props.onPress();
    });
    const compra35Txt = extrairTextos(tree.toJSON()).join("\n");
    expect(compra35Txt).not.toBe(compra20Txt);

    const modAluguel = tree.root.find((n) => n.props.testID === "sim15-mod-aluguel");
    act(() => {
      modAluguel.props.onPress();
    });
    const aluguelCaucaoTxt = extrairTextos(tree.toJSON()).join("\n");

    const fiancaBtn = tree.root.find((n) => n.props.testID === "sim15-garantia-fianca");
    act(() => {
      fiancaBtn.props.onPress();
    });
    const aluguelFiancaTxt = extrairTextos(tree.toJSON()).join("\n");
    expect(aluguelFiancaTxt).not.toBe(aluguelCaucaoTxt);
    expect(aluguelFiancaTxt).toContain("fiança locatícia estimada");

    expect(REGEX_JARGON_CAMADA1.test(aluguelFiancaTxt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(aluguelFiancaTxt)).toBe(false);
    expect(/\bseguro\b/i.test(aluguelFiancaTxt)).toBe(false);
  });

  it("visual e cidadao mantem no maximo 1 container borderWidth:1 por componente e zero comAlfa/toque<44 em cidadao (S56)", () => {
    const pastaVisual = join(__dirname, "..", "src", "componentes", "visual");
    const pastaCidadao = join(__dirname, "..", "src", "componentes", "cidadao");
    const arqsVisual = readdirSync(pastaVisual).filter((f) => f.endsWith(".tsx"));
    const arqsCidadao = readdirSync(pastaCidadao).filter((f) => f.endsWith(".tsx"));

    expect(arqsVisual.length + arqsCidadao.length).toBeGreaterThanOrEqual(20);

    for (const nome of arqsVisual) {
      const src = readFileSync(join(pastaVisual, nome), "utf8");
      const bordas = src.match(/borderWidth:\s*1/g) ?? [];
      expect({ arq: `visual/${nome}`, bordas: bordas.length }).toEqual({
        arq: `visual/${nome}`,
        bordas: expect.any(Number),
      });
      expect(bordas.length).toBeLessThanOrEqual(1);
    }

    for (const nome of arqsCidadao) {
      const src = readFileSync(join(pastaCidadao, nome), "utf8");
      const bordas = src.match(/borderWidth:\s*1/g) ?? [];
      expect(bordas.length).toBeLessThanOrEqual(1);
      expect(src).not.toMatch(/\bcomAlfa\b/);
      expect(src).not.toMatch(/minHeight:\s*TOQUE_MINIMO\s*-/);
      expect(src).not.toMatch(/minHeight:\s*(?:3\d|4[0-3])\b/);
    }

    const cartaoSrc = readFileSync(join(pastaCidadao, "CartaoCidadao3Camadas.tsx"), "utf8");
    expect(cartaoSrc).toContain("cartao-3camadas-toggle-");
  });

  it("auditoria global de toque WCAG (>=44px) garante zero LinkDeLinha/controles <44px nos módulos corrigidos (S58)", () => {
    const srcRoot = join(__dirname, "..", "src");
    const arqs: string[] = [];
    const empilhar = (dir: string) => {
      for (const nome of readdirSync(dir)) {
        const p = join(dir, nome);
        if (statSync(p).isDirectory()) empilhar(p);
        else if (p.endsWith(".tsx")) arqs.push(p);
      }
    };
    empilhar(srcRoot);
    expect(arqs.length).toBeGreaterThan(50);

    for (const p of arqs) {
      const s = readFileSync(p, "utf8");
      expect(s).not.toMatch(/altura=\{(?:[123]\d|4[0-3])\}/);
    }

    const alvos = [
      "componentes/inicio/Creditos.tsx",
      "componentes/revisao/SeletorDeBairro.tsx",
      "app/exemplos/[id]/(abas)/mapa.tsx",
      "app/exemplos/[id]/(abas)/visita.tsx",
      "app/exemplos/[id]/caminhos.tsx",
      "app/mock.tsx",
    ];
    for (const rel of alvos) {
      const s = readFileSync(join(srcRoot, rel), "utf8");
      expect(s).not.toMatch(/minHeight:\s*(?:[123]\d|4[0-3])\b/);
    }

    const topoLegacy = readFileSync(join(srcRoot, "componentes", "dossie", "Topo.tsx"), "utf8");
    expect(topoLegacy).not.toMatch(/minHeight:\s*28\b/);
    expect(topoLegacy).toContain("minHeight: TOQUE_MINIMO");
  });

  it("PorPerto e Negociacao removem comAlfa, meio-pixel 0.5 e caixas aninhadas (S60)", () => {
    const porPertoSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "PorPerto.tsx"),
      "utf8",
    );
    const negociacaoSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Negociacao.tsx"),
      "utf8",
    );

    expect(porPertoSrc).not.toMatch(/\bcomAlfa\b/);
    expect(porPertoSrc).not.toMatch(/borderTopWidth:[^,\n]*0\.5\b/);
    expect((porPertoSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(4);

    expect(negociacaoSrc).not.toMatch(/\bcomAlfa\b/);
    expect(negociacaoSrc).not.toMatch(/borderTopWidth:[^,\n]*0\.5\b/);
  });

  it("Home (index.tsx) reduz caixas para <=4 e aplica tabular-nums nos cartões; Paineis.tsx zera comAlfa (S61)", () => {
    const homeSrc = readFileSync(join(__dirname, "..", "src", "app", "(abas)", "index.tsx"), "utf8");
    const paineisSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "comparar", "Paineis.tsx"),
      "utf8",
    );

    expect((homeSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(4);
    expect(homeSrc).toMatch(/precoDestaque:\s*\{[\s\S]*?tabular-nums/);
    expect(homeSrc).not.toContain("alvoDoMarcador");
    expect(paineisSrc).not.toMatch(/\bcomAlfa\b/);
  });
});
