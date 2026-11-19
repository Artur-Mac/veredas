import { describe, expect, it, jest } from "@jest/globals";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { inferirFachadasDoEdificio } from "../src/dados/sol/inferirFachadas";
import { simularCenaSombra25D, type PredioCena25D } from "../src/dados/sol/motorSombra25D";
import { analisarRadarVistaELote } from "../src/dados/entorno/radarVistaELote";
import { calcularPulsoDaQuadra } from "../src/dados/dossie/pulsoDaQuadra";
import { decomporCausasDeBarulhoSemDb, fontesDeBarulho, simularUnidade } from "../src/dados/dossie/simuladorDaUnidade";
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
import { avaliarSensibilidadeDuelo, DueloFinalistas } from "../src/componentes/cidadao/DueloFinalistas";
import { ConvergenciaFamiliar } from "../src/componentes/cidadao/ConvergenciaFamiliar";
import { compararRotinaDoisDestinos, estimarMinutosPicoIdaVolta } from "../src/dados/mobilidade/rotinaCasal";
import {
  ORIENTACAO_CNIB_ONR,
  PRAZOS_REFERENCIA_PRE_SINAL,
  auditarTextoColadoCidadao,
  derivarImpedimentosPreSinal,
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
import {
  auditarConjuntoDocumental,
  gerarPedidoDocumentosFaltantes,
  gerarRoteiroTresPerguntasSindico,
} from "../src/dados/pacoteEspecialista";
import { CartaoDoIndicador, montarTextoDivergenciasParaCorretor } from "../src/componentes/dossie-v1/Indicadores";
import {
  acaoPraticaDoIndicador,
  fichaDeMetodoDoIndicador,
  type Indicador,
} from "../src/dados/dossie/indicadores";
import { calcularAreaPoligonoM2, MapaDoLote } from "../src/componentes/dossie-v1/MapaDoLote";
import { descreverJanelaTemporalDaBase, GavetaDeFonte } from "../src/componentes/fonte/GavetaDeFonte";
import { Entorno } from "../src/componentes/dossie-v1/Entorno";
import { EdificioDoDossie, sintetizarChaveDuplaDoEdificio } from "../src/componentes/dossie-v1/Edificio";
import { sintetizarPerfilObrasProximas } from "../src/componentes/dossie-v1/textos";
import type { VisaoDoDossie } from "../src/dados/contratos";
import { derivarDossie } from "../src/dados/dossie/derivar";
import { analiseDoPredio } from "../src/dados/raioX";
import { gerarCnm16Formatado } from "../src/nucleo/documentos/auditorDocumental";
import { TemaDoApp } from "../src/tema/Tema";

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(async () => true),
  getStringAsync: jest.fn(async () => ""),
}));

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

  // Decisão A6 (18/11/2026): Plus Jakarta Sans em todo texto SVG; a única exceção é FONTES_DO_FUNDO.bairro (Fraunces), só
  // nos nomes de bairro do fundo do mapa (src/componentes/mapa/fundoDoMapaEstilo.ts).
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

  // Decisão A2 do Samuel (18/11/2026): o dB(A) pode aparecer, desde que estimado e dito como estimativa. A ficha do
  // pulso traz a conta do eixo de sossego com o nível estimado; a regra deixa de ser "zero dB" e passa a ser "dB só
  // com estimativa".
  it("novos módulos visuais (Radar, Copiloto, Pulso, Checklist IPTU) seguem anti-jargão, dB só com estimativa, zero R$ 0 e zero palavras proibidas", () => {
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
            spuAnualReais: 0,
            custoMensalArReais: 140,
            economiaLegalItbiReais: 15_000,
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
    const comDb = extrairTextos(tree.toJSON()).filter((t) => /\d\s*dB\b/i.test(t));
    expect(comDb.length).toBeGreaterThan(0);
    for (const t of comDb) expect(t).toMatch(/estimativ|estimad/i);
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
    expect(txtCompra).toContain("Caixa para entrar (sem cartório)");
    expect(txtCompra).toContain("Economia possível de ITBI (financiamento pelo Sistema Financeiro da Habitação, SFH, e pedido em até 180 dias)");
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
    expect(linhaObras.comparativoTemporal).toContain("2 relevantes nos últimos 24 meses frente a 5 registros");

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
            spuAnualReais: 2_400,
            custoMensalArReais: 140,
            economiaLegalItbiReais: 15_000,
            descontoRuidoReais: 0,
            vplCalorPoenteReais: 0,
            riscoManutencaoPredioReais: 0,
            excedenteMedianaM2Reais: 0,
            entradaTco10Anos: { precoCompraReais: 650_000, aluguelEquivalenteMensalReais: 2_925, condominioMensalReais: 1_050, iptuAnualReais: 3_600 },
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

  it("expõe diligência estatutária do Recife (AQUA/Compesa, vistoria predial periódica PE e CAT 90 dias) em CopilotoDocumentosPreSinal em S50", () => {
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
    expect(aluguelFiancaTxt).toContain("fiança locatícia estimada em cerca de 10% do aluguel por mês (estimativa de mercado, não é valor de lei)");
    expect(aluguelFiancaTxt).not.toMatch(/8\.245/);

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

  it("Explorar reduz borderWidth:1 para <=4 caixas e remove comAlfa (S63)", () => {
    const explorarSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "inicio", "Explorar.tsx"),
      "utf8",
    );
    expect(explorarSrc).not.toMatch(/\bcomAlfa\b/);
    expect((explorarSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(4);
  });

  it("auditoria global de fios garante zero divisórias subpixel 0.5 em todo src/ (S64)", () => {
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
      expect(s).not.toMatch(/border(?:Top|Bottom|Left|Right)?Width:\s*0\.5\b/);
    }
  });

  it("NoImovel e Orientacao mantem no maximo 1 borderWidth:1 e Orientacao zera comAlfa (S66)", () => {
    const noImovelSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "visita-v1", "NoImovel.tsx"),
      "utf8",
    );
    const orientacaoSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "visita-v1", "Orientacao.tsx"),
      "utf8",
    );

    expect((noImovelSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(noImovelSrc).toContain("tabular-nums");
    expect((orientacaoSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(orientacaoSrc).not.toMatch(/\bcomAlfa\b/);
  });

  it("Sala e salvos eliminam comAlfa, usam cor-linha-forte e aplicam tabular-nums nos resumos (S67)", () => {
    const salaSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "comparar", "Sala.tsx"),
      "utf8",
    );
    const salvosSrc = readFileSync(join(__dirname, "..", "src", "app", "(abas)", "salvos.tsx"), "utf8");

    expect(salaSrc).not.toMatch(/\bcomAlfa\b/);
    expect((salaSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(3);
    expect(salvosSrc).not.toMatch(/\bcomAlfa\b/);
    expect(salvosSrc).toContain("tabular-nums");
  });

  it("MapaDoLote reduz borderWidth:1 para <=4 caixas com pílulas planas e tipografia tabular (S69)", () => {
    const mapaSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "MapaDoLote.tsx"),
      "utf8",
    );
    expect((mapaSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(4);
    expect(mapaSrc).toContain("fontVariant: [\"tabular-nums\"]");
  });

  it("PerfilDomicilio zera comAlfa/caixas de pílulas e exibe prévia mensal ao vivo (S70)", () => {
    const perfilSrc = readFileSync(
      join(__dirname, "..", "src", "app", "perfil-domicilio.tsx"),
      "utf8",
    );
    expect(perfilSrc).not.toMatch(/\bcomAlfa\b/);
    expect((perfilSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(2);
    expect(perfilSrc).toContain("perfil-resumo-mensal-vivo");
  });

  it("ler.tsx e visita-v1/blocos.tsx zeram comAlfa e comparar/vx.tsx mantém só a sombra de segmento em <=2 caixas (S71)", () => {
    const lerPath = join(__dirname, "..", "src", "app", "(abas)", "ler.tsx");
    const blocosPath = join(__dirname, "..", "src", "componentes", "visita-v1", "blocos.tsx");
    const vxPath = join(__dirname, "..", "src", "componentes", "comparar", "vx.tsx");
    for (const p of [lerPath, blocosPath]) {
      const s = readFileSync(p, "utf8");
      expect(s).not.toMatch(/\bcomAlfa\b/);
      expect((s.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(2);
    }
    const vxSrc = readFileSync(vxPath, "utf8");
    expect(vxSrc).not.toMatch(/borderColor:\s*comAlfa/);
    expect((vxSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(1);
    const lerSrc = readFileSync(lerPath, "utf8");
    expect(lerSrc).toContain("tabular-nums");
  });

  it("zera bordas ternárias 0.5px em todo src/ e desmodulariza Edificio, AbasDoDossie, FichaViva, CartaoDoImovel e editar (S72)", () => {
    const arquivosTsx = listarTsxRecursivo(join(__dirname, "..", "src"));
    for (const arquivo of arquivosTsx) {
      const conteudo = readFileSync(arquivo, "utf8");
      expect(conteudo).not.toMatch(/border(?:Top|Bottom|Left|Right)?Width:\s*[^,\n}]*\b0\.5\b/);
    }

    const semComAlfa = [
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Edificio.tsx"),
      join(__dirname, "..", "src", "componentes", "dossie-v1", "FichaViva.tsx"),
      join(__dirname, "..", "src", "componentes", "comparar", "CartaoDoImovel.tsx"),
    ];
    for (const p of semComAlfa) {
      expect(readFileSync(p, "utf8")).not.toMatch(/\bcomAlfa\b/);
    }

    const abasSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "AbasDoDossie.tsx"),
      "utf8",
    );
    const edifSrc = readFileSync(semComAlfa[0]!, "utf8");
    expect(abasSrc).not.toMatch(/borderWidth:\s*1\b/);
    expect(edifSrc).not.toMatch(/borderWidth:\s*1\b/);

    const fichaSrc = readFileSync(semComAlfa[1]!, "utf8");
    const cartaoSrc = readFileSync(semComAlfa[2]!, "utf8");
    expect(fichaSrc).toContain("tabular-nums");
    expect(cartaoSrc).toContain("tabular-nums");
  });

  it("fluxo de confirmação de prédio e LeitorDePagina zeram comAlfa, rgba literal e caixas extras (S73)", () => {
    const caixaPath = join(__dirname, "..", "src", "componentes", "predio", "CaixaDoPredio.tsx");
    const buscaPath = join(__dirname, "..", "src", "componentes", "predio", "BuscaDePredio.tsx");
    const predioPath = join(__dirname, "..", "src", "app", "(abas)", "predio.tsx");
    const leitorPath = join(__dirname, "..", "src", "componentes", "leitor", "LeitorDePagina.tsx");

    for (const p of [caixaPath, buscaPath, predioPath, leitorPath]) {
      expect(readFileSync(p, "utf8")).not.toMatch(/\bcomAlfa\b/);
    }

    const caixaSrc = readFileSync(caixaPath, "utf8");
    expect(caixaSrc).not.toMatch(/rgba\(/);
    expect(caixaSrc).not.toMatch(/borderWidth:\s*1\b/);
    expect(caixaSrc).toContain("tabular-nums");

    for (const p of [buscaPath, predioPath, leitorPath]) {
      const s = readFileSync(p, "utf8");
      expect((s.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(1);
    }
    expect(readFileSync(predioPath, "utf8")).toContain("tabular-nums");
  });

  it("Pacote e auditarConjuntoDocumental mantêm <=1 borda externa, zero comAlfa/jargão proibido e zero prazo inventado (S74)", () => {
    const pacoteTsx = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Pacote.tsx"),
      "utf8",
    );
    expect(pacoteTsx).not.toMatch(/\bcomAlfa\b/);
    expect((pacoteTsx.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(pacoteTsx).toContain("tabular-nums");

    const pBase = edificiosDoBairro("gracas")[0]!;
    const analiseBase = analiseDoPredio(pBase, {
      agora: "2026-11-15T12:00:00.000Z",
      indiceGeradoEm: "2026-11-15T00:00:00Z",
      origem: "busca",
    });
    const compra = { ...analiseBase, modalidade: "compra" as const };
    const aud = auditarConjuntoDocumental(compra, "2026-11-15T12:00:00.000Z");
    const pedido = gerarPedidoDocumentosFaltantes(compra, aud);
    const todoTexto = [aud.resumoCurto, ...aud.itens.flatMap((i) => [i.titulo, i.rotuloEstado, i.detalhe, i.referencia]), pedido].join(" ");

    expect(REGEX_JARGON_CAMADA1.test(todoTexto)).toBe(false);
    for (const pat of PALAVRAS_PROIBIDAS_UI) {
      expect(pat.test(todoTexto)).toBe(false);
    }
  });

  it("sobre-os-dados, SimuladorPrice, visita-v1/CartaoDoImovel e SeletorDeBairro zeram comAlfa/bordas extras (S76)", () => {
    const sobrePath = join(__dirname, "..", "src", "app", "sobre-os-dados.tsx");
    const pricePath = join(__dirname, "..", "src", "componentes", "dossie-v1", "SimuladorPrice.tsx");
    const cartaoVisitaPath = join(__dirname, "..", "src", "componentes", "visita-v1", "CartaoDoImovel.tsx");
    const bairroPath = join(__dirname, "..", "src", "componentes", "revisao", "SeletorDeBairro.tsx");

    for (const p of [sobrePath, pricePath, cartaoVisitaPath]) {
      expect(readFileSync(p, "utf8")).not.toMatch(/\bcomAlfa\b/);
    }
    expect(readFileSync(sobrePath, "utf8")).not.toMatch(/borderWidth:\s*1\b/);
    expect(readFileSync(pricePath, "utf8")).not.toMatch(/borderWidth:\s*1\b/);
    expect(readFileSync(pricePath, "utf8")).toContain("tabular-nums");
    expect(readFileSync(cartaoVisitaPath, "utf8")).toContain("tabular-nums");

    const bairroSrc = readFileSync(bairroPath, "utf8");
    expect((bairroSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(2);
  });

  it("RadarVistaELote responde perguntas de uso, escala e fração do lote sem jargão proibido nem caixas extras (S77)", () => {
    const bv = edificiosDoBairro("boa-viagem");
    const predioComDados = bv.find(
      (e) => e.poligono && e.poligono.length >= 3 && (e.unidades ?? 0) >= 2 && (e.pavimentos ?? 0) >= 2,
    )!;
    expect(predioComDados).toBeDefined();
    const inf = inferirFachadasDoEdificio({ edificio: predioComDados, textoAnuncio: "" });

    const radarSemClausula = analisarRadarVistaELote({
      centro: predioComDados.centro,
      edificio: predioComDados,
      fachadaAtiva: inf.frente,
      andar: 4,
      vizinhos: bv,
      obrasProximas: null,
    });
    expect(radarSemClausula.perguntasDeUsoELote.map((p) => p.id)).toEqual([
      "temporada",
      "escala_vertical",
      "fracao_terreno",
    ]);
    expect(radarSemClausula.perguntasDeUsoELote[0]?.respostaCurta).toBe("Depende da convenção do condomínio");
    expect(radarSemClausula.perguntasDeUsoELote[0]?.fundamentoEAritmetica).toBe(
      "STJ (REsp 2.121.055, Segunda Seção, 07/05/2026): em condomínio residencial, oferecer a unidade para estadia de curta temporada depende de aprovação de dois terços dos condôminos em assembleia. Confira a convenção e as atas antes do sinal.",
    );
    expect(radarSemClausula.perguntasDeUsoELote[1]?.fundamentoEAritmetica).toContain("LC Municipal nº 2/2021");
    expect(radarSemClausula.perguntasDeUsoELote[2]?.respostaCurta).toContain("m² de lote por unidade");

    const radarComClausula = analisarRadarVistaELote({
      centro: predioComDados.centro,
      edificio: predioComDados,
      fachadaAtiva: inf.frente,
      andar: 4,
      vizinhos: bv,
      obrasProximas: null,
      clausulaTemporadaNaConvencao: "Permitida locação por temporada mediante registro na portaria.",
    });
    expect(radarComClausula.perguntasDeUsoELote[0]?.respostaCurta).toBe("Há trecho salvo nos documentos");
    expect(radarComClausula.perguntasDeUsoELote[0]?.fundamentoEAritmetica).toBe(
      "Convenção ou ata registrada: “Permitida locação por temporada mediante registro na portaria.” · STJ (REsp 2.121.055, Segunda Seção, 07/05/2026): a liberação depende de aprovação de dois terços dos condôminos.",
    );

    const radarSemPredio = analisarRadarVistaELote({
      centro: predioComDados.centro,
      edificio: null,
      fachadaAtiva: inf.frente,
      andar: 4,
      vizinhos: [],
      obrasProximas: null,
    });
    expect(radarSemPredio.perguntasDeUsoELote[1]?.respostaCurta).toBe("Sem gabarito completo no raio de 120 m");
    expect(radarSemPredio.perguntasDeUsoELote[2]?.respostaCurta).toBe("A confirmar na matrícula");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(RadarVistaELote, { radar: radarComClausula })),
      );
    });
    expect(() => tree.root.find((n) => n.props.testID === "radar-lista-uso-lote")).toThrow();

    const toggleUso = tree.root.find((n) => n.props.testID === "radar-toggle-uso-lote");
    act(() => {
      toggleUso.props.onPress();
    });
    expect(tree.root.find((n) => n.props.testID === "radar-lista-uso-lote")).toBeDefined();

    const txt = extrairTextos(tree.toJSON()).join("\n");
    expect(txt).toContain("Posso alugar por curta temporada (Airbnb)?");
    expect(txt).toContain("Quanto de terreno corresponde a cada unidade?");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    const radarSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "visual", "RadarVistaELote.tsx"),
      "utf8",
    );
    expect(radarSrc).not.toMatch(/\bcomAlfa\b/);
    expect((radarSrc.match(/borderWidth:\s*1\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(radarSrc).toContain("tabular-nums");

    act(() => {
      tree.unmount();
    });
  });

  it("casca (CabecalhoDoApp, Gaveta, MenuRapido, DockInferior) e FormularioDeRevisao removem bordas extras e comAlfa (S78)", () => {
    const cabPath = join(__dirname, "..", "src", "componentes", "casca", "CabecalhoDoApp.tsx");
    const dockPath = join(__dirname, "..", "src", "componentes", "casca", "DockInferior.tsx");
    const gavetaPath = join(__dirname, "..", "src", "componentes", "casca", "Gaveta.tsx");
    const menuPath = join(__dirname, "..", "src", "componentes", "casca", "MenuRapido.tsx");
    const formPath = join(__dirname, "..", "src", "componentes", "revisao", "FormularioDeRevisao.tsx");

    for (const p of [cabPath, dockPath]) {
      const s = readFileSync(p, "utf8");
      expect(s).not.toMatch(/\bcomAlfa\b/);
      expect(s).not.toMatch(/\bborderWidth:\s*1(?!\.)\b/);
    }
    for (const p of [gavetaPath, menuPath]) {
      const s = readFileSync(p, "utf8");
      expect(s).not.toMatch(/border\w*Color:\s*comAlfa/);
    }
    expect(readFileSync(menuPath, "utf8")).toContain("tabular-nums");

    const formSrc = readFileSync(formPath, "utf8");
    expect((formSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(formSrc).toContain("tabular-nums");
  });

  it("DueloFinalistas mostra síntese não dominada custo×tempo e TresPerguntasDoBolso simula imóvel fechado/obra (S79)", () => {
    let arvoreTroca!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvoreTroca = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(DueloFinalistas, {
            opcaoA: {
              id: "A",
              nomeExibicao: "Graças 95m²",
              custoMensalTotalReais: 4_800,
              areaM2: 95,
              deslocamentoMinDia: 24,
              ruidoInternoDb: 37,
              situacaoDocumentalResumo: "Terreno alodial",
              riscoAguaChuvaResumo: "Cota acima da média",
            },
            opcaoB: {
              id: "B",
              nomeExibicao: "Torre 95m²",
              custoMensalTotalReais: 3_700,
              areaM2: 95,
              deslocamentoMinDia: 54,
              ruidoInternoDb: 38,
              situacaoDocumentalResumo: "Terreno alodial",
              riscoAguaChuvaResumo: "Cota acima da média",
            },
          }),
        ),
      );
    });
    const sinteseTrocaEl = arvoreTroca.root.find((n) => n.props.testID === "duelo-sintese-troca");
    expect(sinteseTrocaEl).toBeDefined();
    const txtTroca = extrairTextos(arvoreTroca.toJSON()).join("\n");
    expect(txtTroca).toContain("por hora poupada");
    expect(txtTroca).toContain("Se uma hora sua vale mais que");
    expect(REGEX_JARGON_CAMADA1.test(txtTroca)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txtTroca)).toBe(false);
    act(() => {
      arvoreTroca.unmount();
    });

    let arvoreDom!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvoreDom = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(DueloFinalistas, {
            opcaoA: {
              id: "A",
              nomeExibicao: "Casa Forte 100m²",
              custoMensalTotalReais: 3_900,
              areaM2: 100,
              deslocamentoMinDia: 20,
              ruidoInternoDb: 36,
              situacaoDocumentalResumo: "Terreno alodial",
              riscoAguaChuvaResumo: "Cota acima da média",
            },
            opcaoB: {
              id: "B",
              nomeExibicao: "Boa Viagem 100m²",
              custoMensalTotalReais: 4_500,
              areaM2: 100,
              deslocamentoMinDia: 48,
              ruidoInternoDb: 39,
              situacaoDocumentalResumo: "Terreno alodial",
              riscoAguaChuvaResumo: "Cota acima da média",
            },
          }),
        ),
      );
    });
    const txtDom = extrairTextos(arvoreDom.toJSON()).join("\n");
    expect(txtDom).toContain("não há troca a fazer entre custo e tempo");
    act(() => {
      arvoreDom.unmount();
    });

    let arvoreBolso!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvoreBolso = TestRenderer.create(
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
            spuAnualReais: 2_400,
            custoMensalArReais: 140,
            economiaLegalItbiReais: 15_000,
            descontoRuidoReais: 0,
            vplCalorPoenteReais: 0,
            riscoManutencaoPredioReais: 0,
            excedenteMedianaM2Reais: 0,
            entradaTco10Anos: { precoCompraReais: 650_000, aluguelEquivalenteMensalReais: 2_925, condominioMensalReais: 1_050, iptuAnualReais: 3_600 },
          }),
        ),
      );
    });
    expect(() => arvoreBolso.root.find((n) => n.props.testID === "bolso-resumo-imovel-fechado")).toThrow();
    const btnFechado = arvoreBolso.root.find((n) => n.props.testID === "bolso-modo-imovel-fechado");
    act(() => {
      btnFechado.props.onPress();
    });
    expect(arvoreBolso.root.find((n) => n.props.testID === "bolso-resumo-imovel-fechado")).toBeDefined();
    const txtBolso = extrairTextos(arvoreBolso.toJSON()).join("\n");
    expect(txtBolso).toContain("Sem morador (obra ou transição):");
    expect(txtBolso).toContain("encargos fixos do imóvel (condomínio + IPTU + União)");
    expect(REGEX_JARGON_CAMADA1.test(txtBolso)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txtBolso)).toBe(false);
    act(() => {
      arvoreBolso.unmount();
    });

    for (const rel of [
      "src/componentes/cidadao/DueloFinalistas.tsx",
      "src/componentes/visual/TresPerguntasDoBolso.tsx",
    ]) {
      const s = readFileSync(join(__dirname, "..", rel), "utf8");
      expect(s).not.toMatch(/\bcomAlfa\b/);
      expect((s.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
    }
  });

  it("DiaADia, RastroDeConfianca, Controles e MapaDoPredio zeram bordas extras e tokens comAlfa em bordas (S81)", () => {
    const diaPath = join(__dirname, "..", "src", "componentes", "dossie-v1", "DiaADia.tsx");
    const rastroPath = join(__dirname, "..", "src", "componentes", "fonte", "RastroDeConfianca.tsx");
    const controlesPath = join(__dirname, "..", "src", "componentes", "Controles.tsx");
    const mapaPredioPath = join(__dirname, "..", "src", "componentes", "predio", "MapaDoPredio.tsx");

    for (const p of [diaPath, rastroPath]) {
      const s = readFileSync(p, "utf8");
      expect(s).not.toMatch(/\bcomAlfa\b/);
      expect(s).not.toMatch(/\bborderWidth:\s*1(?!\.)\b/);
    }
    const controlesSrc = readFileSync(controlesPath, "utf8");
    expect((controlesSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);

    const mapaSrc = readFileSync(mapaPredioPath, "utf8");
    expect(mapaSrc).not.toMatch(/border\w*Color:\s*comAlfa/);
  });

  it("RotinaDoisDestinosComparar expõe premissa explícita pico × fora de pico e regime híbrido (S82)", () => {
    const rPico = compararRotinaDoisDestinos({
      nomeOpcaoA: "Opção Boa Viagem",
      centroA: null,
      bairroA: "boa-viagem",
      nomeOpcaoB: "Opção Graças",
      centroB: null,
      bairroB: "gracas",
      destino1Id: "polo_porto_digital",
      destino2Id: "polo_ufpe",
      diasPresenciaisMes: 20,
      faixaHorario: "pico",
    });
    const rFora = compararRotinaDoisDestinos({
      nomeOpcaoA: "Opção Boa Viagem",
      centroA: null,
      bairroA: "boa-viagem",
      nomeOpcaoB: "Opção Graças",
      centroB: null,
      bairroB: "gracas",
      destino1Id: "polo_porto_digital",
      destino2Id: "polo_ufpe",
      diasPresenciaisMes: 12,
      faixaHorario: "fora_pico",
    });
    expect(rFora.minutosDiaOpcaoA).toBeLessThan(rPico.minutosDiaOpcaoA);
    expect(rFora.faixaHorario).toBe("fora_pico");
    expect(rFora.diasPresenciaisMes).toBe(12);

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
        ),
      );
    });

    const txtPico = extrairTextos(tree.toJSON()).join("\n");
    expect(txtPico).toContain("ida e volta no pico");
    expect(txtPico).toContain("~19 km/h · 20 dias/mês");

    const btnFora = tree.root.find((n) => n.props.testID === "rotina-faixa-fora-pico");
    const btnHibrido = tree.root.find((n) => n.props.testID === "rotina-dias-12");
    act(() => {
      btnFora.props.onPress();
      btnHibrido.props.onPress();
    });

    const txtFora = extrairTextos(tree.toJSON()).join("\n");
    expect(txtFora).toContain("ida e volta fora de pico");
    expect(txtFora).toContain("~28 km/h · 12 dias/mês");
    expect(txtFora).toContain("considerando 12 dias presenciais");
    expect(REGEX_JARGON_CAMADA1.test(txtFora)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txtFora)).toBe(false);

    const src = readFileSync(
      join(__dirname, "..", "src", "componentes", "visual", "RotinaDoisDestinosComparar.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/\bcomAlfa\b/);
    expect((src.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);

    act(() => {
      tree.unmount();
    });
  });

  it("Indicadores.tsx zera comAlfa/bordas, garante TOQUE_MINIMO e monta texto limpo de divergências (S83)", () => {
    const indPath = join(__dirname, "..", "src", "componentes", "dossie-v1", "Indicadores.tsx");
    const indSrc = readFileSync(indPath, "utf8");
    expect(indSrc).not.toMatch(/\bcomAlfa\b/);
    expect(indSrc).not.toMatch(/\bborderWidth:\s*1(?!\.)\b/);
    expect(indSrc).toContain("TOQUE_MINIMO");
    expect(indSrc).toContain("tabular-nums");

    const msg = montarTextoDivergenciasParaCorretor(
      [
        {
          id: "ach-1",
          tipo: "area",
          titulo: "Área anunciada diferente do cadastro",
          medida: null,
          texto: "Anúncio cita 95 m² contra 82 m² no cadastro municipal.",
          confianca: "oficial",
          fonte: "iptu_2026",
          perguntaId: "p-1",
        },
      ],
      [
        {
          id: "p-1",
          titulo: "Qual a área privativa na matrícula?",
          pista: "Diferença de 13 m²",
          textoParaMensagem: "Confirmar área privativa",
          origem: "achado",
          prioridade: "documentos",
        },
      ],
    );
    expect(REGEX_JARGON_CAMADA1.test(msg)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(msg)).toBe(false);
  });

  it("Entorno zera comAlfa e sintetizarPerfilObrasProximas exibe breakdown por categoria e ritmo 12m (S85)", () => {
    const entornoPath = join(__dirname, "..", "src", "componentes", "dossie-v1", "Entorno.tsx");
    const entornoSrc = readFileSync(entornoPath, "utf8");
    expect(entornoSrc).not.toMatch(/\bcomAlfa\b/);
    expect(entornoSrc).toContain("tabular-nums");
    expect((entornoSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);

    expect(sintetizarPerfilObrasProximas(null)).toBeNull();
    expect(
      sintetizarPerfilObrasProximas({ licencasDeObra: 4, relevantes24m: 0, demolicoes24m: 0, recentes: [] }),
    ).toBeNull();

    const obrasMock = {
      licencasDeObra: 18,
      relevantes24m: 3,
      demolicoes24m: 1,
      recentes: [
        {
          categoria: "construcao" as const,
          descricao: "Edifício residencial multifamiliar",
          data: "2026-06",
          distanciaM: 85,
          situacao: "DEFERIDO",
          centro: [-34.918, -8.034] as [number, number],
          licenca: ["valida", "2027-11-01", true] as ["valida", string, boolean],
        },
        {
          categoria: "acrescimo" as const,
          descricao: "Acréscimo de área",
          data: "2026-02",
          distanciaM: 120,
          situacao: "EM ANÁLISE",
          centro: [-34.919, -8.035] as [number, number],
        },
        {
          categoria: "demolicao" as const,
          descricao: "Demolição total",
          data: "2025-04",
          distanciaM: 95,
          situacao: "DEFERIDO",
          centro: [-34.917, -8.033] as [number, number],
        },
      ],
    };

    const perfil = sintetizarPerfilObrasProximas(obrasMock, "2026-11");
    expect(perfil).not.toBeNull();
    expect(perfil!.construcoes).toBe(1);
    expect(perfil!.acrescimos).toBe(1);
    expect(perfil!.demolicoes).toBe(1);
    expect(perfil!.impacto).toBe(1);
    expect(perfil!.ultimos12m).toBe(2);
    expect(perfil!.anteriores12m).toBe(1);
    expect(perfil!.etiquetas).toEqual(["1 construção nova", "1 acréscimo", "1 demolição", "1 de impacto"]);
    expect(perfil!.ritmo12m).toBe("Ritmo na janela: 2 nos últimos 12 meses · 1 nos 12 meses anteriores");

    const visaoMinima = {
      imovel: "Rua Teste, 100",
      endereco: "Rua Teste, 100",
      custo: {
        principal: { rotulo: "Preço anunciado", valor: 680000, unidade: "R$", porM2: 8500 },
        mensalConhecido: 900,
        parcelas: [],
        pendencias: 0,
        textoDoResumo: "Condomínio e IPTU somam R$ 900/mês.",
      },
      especificacoes: { area: 80, quartos: 3, banheiros: 2, vagas: 1, andar: 5 },
      achados: { principal: null, apoio: [] },
      perguntas: [],
      cadastro: [],
      posicao: null,
      obras: obrasMock,
      rua: null,
    } as unknown as VisaoDoDossie;

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(Entorno, {
            visao: visaoMinima,
            edificio: null,
            contexto: null,
            nomeDoBairro: "Casa Forte",
            coberto: true,
            vinculoConfirmado: true,
            aoAbrirFonte: () => undefined,
            aoAbrirMapa: () => undefined,
            aoConfirmarPredio: () => undefined,
            aoMedirSecao: () => undefined,
            aoResponderDefesaCivil: () => undefined,
          }),
        ),
      );
    });

    const chips = tree.root.find((n) => n.props.testID === "obras-resumo-categorias");
    expect(chips).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join(" ");
    expect(txt).toContain("1 construção nova");
    expect(txt).toContain("1 de impacto");
    expect(txt).toContain("Ritmo na janela: 2 nos últimos 12 meses · 1 nos 12 meses anteriores");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    act(() => {
      tree.unmount();
    });
  });

  it("DueloFinalistas exibe 'O que mudaria esta comparação' com sensibilidade a pendências e andar (S86)", () => {
    const dueloPath = join(__dirname, "..", "src", "componentes", "cidadao", "DueloFinalistas.tsx");
    const dueloSrc = readFileSync(dueloPath, "utf8");
    expect(dueloSrc).not.toMatch(/\bcomAlfa\b/);
    expect((dueloSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(dueloSrc).toContain("tabular-nums");

    const baseA = {
      id: "A",
      nomeExibicao: "Graças 95m²",
      custoMensalTotalReais: 4200,
      areaM2: 95,
      deslocamentoMinDia: 25,
      ruidoInternoDb: 34,
      situacaoDocumentalResumo: "Matrícula limpa",
      riscoAguaChuvaResumo: "Cota protegida",
    };
    const baseB = {
      id: "B",
      nomeExibicao: "Espinheiro 110m²",
      custoMensalTotalReais: 4850,
      areaM2: 110,
      deslocamentoMinDia: 20,
      ruidoInternoDb: 36,
      situacaoDocumentalResumo: "Matrícula limpa",
      riscoAguaChuvaResumo: "Checar garagem",
    };

    const sensPend = avaliarSensibilidadeDuelo(
      { ...baseA, itensPendentesCusto: ["Condomínio"], andarInformado: true },
      { ...baseB, itensPendentesCusto: [], andarInformado: true },
    );
    expect(sensPend.titulo).toBe("O que mudaria esta comparação");
    expect(sensPend.diferencaMensalReais).toBe(650);
    expect(sensPend.pontos[0]).toContain("Graças 95m²");
    expect(sensPend.pontos[0]).toContain("Condomínio");
    expect(sensPend.pontos[0]).toContain("650/mês");

    const sensLimpaAndar = avaliarSensibilidadeDuelo(
      { ...baseA, andarInformado: false },
      { ...baseB, andarInformado: true },
    );
    expect(sensLimpaAndar.pontos).toHaveLength(2);
    expect(sensLimpaAndar.pontos[0]).toContain("variação acima desse valor");
    expect(sensLimpaAndar.pontos[1]).toContain("Confirmar o andar de Graças 95m²");

    const sensEmpate = avaliarSensibilidadeDuelo(
      { ...baseA, custoMensalTotalReais: 4500 },
      { ...baseB, custoMensalTotalReais: 4520 },
    );
    expect(sensEmpate.pontos[0]).toContain("diferem em apenas R$ 20/mês");

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(DueloFinalistas, {
            opcaoA: { ...baseA, itensPendentesCusto: ["Condomínio"], andarInformado: false },
            opcaoB: { ...baseB, itensPendentesCusto: [], andarInformado: true },
          }),
        ),
      );
    });

    const sec = tree.root.find((n) => n.props.testID === "duelo-sensibilidade");
    expect(sec).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join(" ");
    expect(txt).toContain("O que mudaria esta comparação");
    expect(txt).toContain("Condomínio");
    expect(txt).toContain("Confirmar o andar de Graças 95m²");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    act(() => {
      tree.unmount();
    });
  });

  it("LeitorDeAta, PorPerto, Explorar e NoImovel cumprem desmodularizacao e zero comAlfa (S87)", () => {
    const leitorSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "caderno", "LeitorDeAta.tsx"),
      "utf8",
    );
    const porPertoSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "PorPerto.tsx"),
      "utf8",
    );
    const explorarSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "inicio", "Explorar.tsx"),
      "utf8",
    );
    const noImovelSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "visita-v1", "NoImovel.tsx"),
      "utf8",
    );

    expect(leitorSrc).toContain("resumirCoberturaDaLeitura");
    expect(leitorSrc).toContain("leitor-resumo-cobertura");
    expect(leitorSrc).not.toMatch(/\bcomAlfa\b/);
    expect((leitorSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(leitorSrc).toContain("tabular-nums");

    expect(porPertoSrc).not.toMatch(/\bcomAlfa\b/);
    expect((porPertoSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);

    expect(explorarSrc).not.toMatch(/\bcomAlfa\b/);
    expect((explorarSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(2);
    expect(explorarSrc).toContain("tabular-nums");

    expect(noImovelSrc).not.toMatch(/\bcomAlfa\b/);
    expect((noImovelSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
  });

  it("GavetaDeFonte e dossie zeram comAlfa e exibem clareza temporal sem relogio do aparelho (S88)", () => {
    const gavetaSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "fonte", "GavetaDeFonte.tsx"),
      "utf8",
    );
    const dossieSrc = readFileSync(
      join(__dirname, "..", "src", "app", "(abas)", "dossie.tsx"),
      "utf8",
    );

    expect(gavetaSrc).not.toMatch(/\bcomAlfa\b/);
    expect(gavetaSrc).not.toMatch(/\bborderWidth:\s*1(?!\.)\b/);
    expect(gavetaSrc).toContain("tabular-nums");
    expect(gavetaSrc).not.toContain("Date.now");

    expect(dossieSrc).not.toMatch(/\bcomAlfa\b/);
    expect((dossieSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(2);

    expect(descreverJanelaTemporalDaBase("03/10/2026", "20/10/2026")).toBe(
      "Retrato local colhido no mesmo mês da publicação",
    );
    expect(descreverJanelaTemporalDaBase("2026-09-15", "2026-10-02")).toBe(
      "Retrato local colhido 1 mês após a publicação",
    );
    expect(descreverJanelaTemporalDaBase("01/08/2026", "15/10/2026")).toBe(
      "Retrato local colhido 2 meses após a publicação",
    );
    expect(descreverJanelaTemporalDaBase("A confirmar", "20/10/2026")).toBeNull();
    expect(descreverJanelaTemporalDaBase("20/11/2026", "01/10/2026")).toBeNull();

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(GavetaDeFonte, {
            visivel: true,
            aoFechar: () => undefined,
            fonte: "iptu_2026",
            confianca: "oficial",
            meta: META,
            dado: { rotulo: "IPTU 2026 no prédio", valor: "R$ 328–R$ 371/mês" },
          }),
        ),
      );
    });

    const txt = extrairTextos(tree.toJSON()).join(" ");
    expect(txt).toContain("Ciclo do retrato");
    expect(txt).toContain("Retrato local colhido");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    act(() => {
      tree.unmount();
    });
  });

  it("SimuladorDaUnidade decompoe causas de barulho sem dB e reduz para <=1 borderWidth:1 (S90)", () => {
    const simSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "SimuladorDaUnidade.tsx"),
      "utf8",
    );
    expect(simSrc).not.toMatch(/\bcomAlfa\b/);
    expect((simSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(simSrc).toContain("tabular-nums");
    expect(simSrc).toContain("simulador-causas-barulho");

    // Unificação de 19/11/2026: a quarta causa é o avião (aeroporto da branch de segurança).
    const vazio = decomporCausasDeBarulhoSemDb([]);
    expect(vazio).toHaveLength(4);
    expect(vazio[3]).toMatchObject({ id: "aereo", rotulo: "Avião" });
    expect(vazio.every((c) => c.nivel === "Sem registro próximo")).toBe(true);

    const composto = decomporCausasDeBarulhoSemDb([
      {
        id: "via",
        nome: "Via principal (Av. Conselheiro Aguiar)",
        quando: "de dia e à noite",
        distanciaM: 55,
        rumoGraus: 90,
        fonte: "OSM",
      },
      {
        id: "bar",
        nome: "Bar ou venda de bebida",
        quando: "à noite",
        distanciaM: 140,
        rumoGraus: 180,
        fonte: "IBGE",
      },
    ]);
    expect(composto[0]).toMatchObject({ id: "trafego", nivel: "Presença próxima" });
    expect(composto[0]!.detalhe).toContain("55 m");
    expect(composto[1]).toMatchObject({ id: "comercio", nivel: "Sem registro próximo" });
    expect(composto[2]).toMatchObject({ id: "noturno", nivel: "Presença moderada" });
    expect(composto[2]!.detalhe).toContain("140 m");

    const txt = composto.map((c) => `${c.rotulo} ${c.nivel} ${c.detalhe}`).join(" ");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);
  });

  it("Pacote gera 3 perguntas ao sindico e BlocoDeCusto mostra alerta de boleto ao lado do condominio (S91)", () => {
    const custoSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Custo.tsx"),
      "utf8",
    );
    const pacoteSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Pacote.tsx"),
      "utf8",
    );
    expect(custoSrc).not.toMatch(/\bcomAlfa\b/);
    expect(custoSrc).not.toMatch(/\bborderWidth:\s*1(?!\.)\b/);
    expect(custoSrc).toContain("custo-alerta-doc-boleto");
    expect(pacoteSrc).not.toMatch(/\bcomAlfa\b/);
    expect((pacoteSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(pacoteSrc).toContain("pacote-copiar-perguntas-sindico");

    const rSem = gerarRoteiroTresPerguntasSindico("Apt Teste", null);
    const rCom = gerarRoteiroTresPerguntasSindico("Apt Teste", 850);
    expect(rSem).toContain("(1) Qual o valor atual da taxa condominial");
    expect(rCom).toContain("850/mês");
    for (const t of [rSem, rCom]) {
      expect(REGEX_JARGON_CAMADA1.test(t)).toBe(false);
      for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(t)).toBe(false);
    }

    const montarCusto = (estadoCondominio: "a_confirmar" | "conhecido") => {
      const custoObj = {
        principal: { rotulo: "Preço anunciado", valor: 650000, unidade: "R$", porM2: 7222 },
        totalMensalConhecido: estadoCondominio === "conhecido" ? 1100 : 250,
        alemDoPrincipal: null,
        parcelas: [
          {
            nome: "Condomínio" as const,
            valorMensal: estadoCondominio === "conhecido" ? 850 : null,
            estado: estadoCondominio,
            nota: estadoCondominio === "a_confirmar" ? "não informado no anúncio" : null,
          },
          { nome: "IPTU" as const, valorMensal: 250, estado: "conhecido" as const, nota: null },
        ],
        pendencias: estadoCondominio === "a_confirmar" ? 1 : 0,
        notaForaDaSoma: null,
      } as unknown as VisaoDoDossie["custo"];

      let tree!: TestRenderer.ReactTestRenderer;
      act(() => {
        tree = TestRenderer.create(
          React.createElement(
            TemaDoApp,
            null,
            React.createElement(BlocoDeCusto, {
              custo: custoObj,
              area: 90,
              posicao: null,
              aoAbrirPosicao: () => undefined,
              aoAjustar: () => undefined,
            }),
          ),
        );
      });
      return tree;
    };

    const tPendente = montarCusto("a_confirmar");
    const alertaPendente = tPendente.root.find((n) => n.props.testID === "custo-alerta-doc-boleto");
    expect(extrairTextos(alertaPendente.props ? tPendente.toJSON() : null).join(" ")).toContain(
      "peça o boleto vigente do condomínio",
    );
    const tConhecido = montarCusto("conhecido");
    const txt = extrairTextos(tConhecido.toJSON()).join(" ");
    expect(txt).toContain("valide também o saldo do fundo de reserva");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    act(() => {
      tPendente.unmount();
      tConhecido.unmount();
    });
  });

  it("MapaDoLote zera comAlfa/bordas extras e exibe área geométrica do polígono (S92)", () => {
    const mapaSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "MapaDoLote.tsx"),
      "utf8",
    );
    expect(mapaSrc).not.toMatch(/\bcomAlfa\b/);
    // Unificação de 19/11/2026: além da moldura do mapa, o mapa-base trouxe o quadradinho "Prédios que o Vereda conhece" da
    // legenda, que precisa do contorno fino para se distinguir do "Lote do prédio" (contorno grosso). São 2, não 1.
    expect((mapaSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(2);
    expect(mapaSrc).toContain("tabular-nums");

    expect(calcularAreaPoligonoM2(null)).toBeNull();
    expect(calcularAreaPoligonoM2([[-34.896, -8.121], [-34.895, -8.121]])).toBeNull();
    const areaCalc = calcularAreaPoligonoM2(poligono);
    expect(areaCalc).not.toBeNull();
    expect(areaCalc!).toBeGreaterThan(300);
    expect(areaCalc!).toBeLessThan(500);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(MapaDoLote, {
            predio: {
              id: "60461-120",
              bairro: "boa-viagem",
              logradouro: "AV BOA VIAGEM",
              numero: "120",
              dsqfl: null,
              nome: "Ed. Teste Mapa",
              centro,
              poligono,
              unidades: 12,
              tipologias: [{ area: 75, unidades: 12, iptuAnualMediano: null }],
              anoConstrucao: 2012,
              pavimentos: 12,
              ate4Pavimentos: false,
              padrao: "Superior",
              iptuAnual: null,
              itbi: null,
              obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
            },
            obras: [],
            vizinhos: [],
          }),
        ),
      );
    });

    const geoNode = tree.root.find((n) => n.props.testID === "mapa-geometria-lote");
    expect(geoNode).toBeDefined();
    const txt = extrairTextos(tree.toJSON()).join(" ");
    // Unificação de 19/11/2026: "m² de projeção (N vértices)" virou "Área do lote no cadastro: ~X m²" (é a área do
    // contorno do lote, não a projeção da torre; o número de vértices não diz nada a quem compra).
    expect(txt).toContain("Área do lote no cadastro:");
    expect(txt).not.toContain("vértices");
    expect(txt).not.toContain("de projeção");
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    act(() => {
      tree.unmount();
    });
  });

  it("Sala, FichaViva, salvos e editar reduzem para <=1 borderWidth:1 e explicitam amostra/privacidade (S93)", () => {
    const salaSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "comparar", "Sala.tsx"),
      "utf8",
    );
    const fichaSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "FichaViva.tsx"),
      "utf8",
    );
    const salvosSrc = readFileSync(
      join(__dirname, "..", "src", "app", "(abas)", "salvos.tsx"),
      "utf8",
    );
    const editarSrc = readFileSync(
      join(__dirname, "..", "src", "app", "editar.tsx"),
      "utf8",
    );

    expect(salaSrc).not.toMatch(/\bcomAlfa\b/);
    expect((salaSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(salaSrc).toContain("Sem conta, sem nuvem e sem servidor");
    expect(salaSrc).toContain("tabular-nums");

    expect(fichaSrc).not.toMatch(/\bcomAlfa\b/);
    expect((fichaSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(fichaSrc).toContain("salve ao menos 5 imóveis deste bairro");
    expect(fichaSrc).toContain("tabular-nums");

    expect(salvosSrc).not.toMatch(/\bcomAlfa\b/);
    expect((salvosSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(salvosSrc).toContain("tabular-nums");

    expect((editarSrc.match(/\bborderWidth:\s*1(?!\.)\b/g) ?? []).length).toBeLessThanOrEqual(1);
  });

  it("CartaoDoIndicador entrega percentil, acao pratica e ficha de metodo de 6 campos sem comAlfa/bordas (S95)", () => {
    const indSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Indicadores.tsx"),
      "utf8",
    );
    expect(indSrc).not.toMatch(/\bcomAlfa\b/);
    expect(indSrc).not.toMatch(/\bborderWidth:\s*1(?!\.)\b/);
    expect(indSrc).toContain("tabular-nums");

    const temas: Indicador["id"][] = ["a_pe", "noite", "barulho", "obras", "sol", "chuva"];
    for (const id of temas) {
      const mockInd: Indicador = {
        id,
        tema: `Tema ${id}`,
        classe: "pior",
        rotulo: "Rótulo exemplo",
        frase: "Frase factual do cadastro.",
        comparacao: "Mais próximo que 8 de cada 10 prédios.",
        significado: "Significado prático.",
        percentilBairro: id === "chuva" ? null : 80,
        forca: 0.7,
        base: 42,
      };
      const ficha = fichaDeMetodoDoIndicador(mockInd);
      const acao = acaoPraticaDoIndicador(mockInd);
      expect(Object.values(ficha).every((v) => v.trim().length > 5)).toBe(true);
      expect(ficha.amostra).toContain("42 edifícios no bairro");
      expect(acao.length).toBeGreaterThan(15);
      const agregado = `${Object.values(ficha).join(" ")} ${acao}`;
      expect(REGEX_JARGON_CAMADA1.test(agregado)).toBe(false);
      for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(agregado)).toBe(false);
    }

    const indicadorSol: Indicador = {
      id: "sol",
      tema: "Sol e sombra",
      classe: "pior",
      rotulo: "Sol da tarde forte",
      frase: "8 de cada 10 metros do contorno do lote dão para o poente.",
      comparacao: "Mais sol da tarde que 9 de cada 10 prédios de Boa Viagem.",
      significado: "Os cômodos do poente tendem a esquentar após 15h.",
      percentilBairro: 90,
      forca: 0.9,
      base: 120,
    };

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CartaoDoIndicador, { indicador: indicadorSol }),
        ),
      );
    });

    const toggleCard = tree.root.find(
      (n) =>
        typeof n.props.onPress === "function" &&
        typeof n.props.accessibilityLabel === "string" &&
        n.props.accessibilityLabel.startsWith("Sol e sombra:"),
    );
    act(() => {
      toggleCard.props.onPress();
    });

    let txt = extrairTextos(tree.toJSON()).join(" ");
    expect(txt).toContain("Posição relativa: percentil 90 entre 120 prédios do bairro.");
    expect(txt).toContain("O que fazer com isso:");

    const toggleMetodo = tree.root.find((n) => n.props.testID === "indicador-toggle-metodo-sol");
    act(() => {
      toggleMetodo.props.onPress();
    });

    const fichaNode = tree.root.find((n) => n.props.testID === "indicador-ficha-metodo-sol");
    expect(fichaNode).toBeDefined();
    txt = extrairTextos(tree.toJSON()).join(" ");
    for (const campo of ["Medida", "Unidade", "Fonte", "Recorte", "Amostra", "Limite"]) {
      expect(txt).toContain(campo);
    }
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    act(() => {
      tree.unmount();
    });
  });

  it("onda S96: expõe 6 campos da matrícula (Docket R31) e travas causais tipadas bloqueia/depende_de em CopilotoDocumentosPreSinal", () => {
    const leitura = auditarTextoColadoCidadao(
      "Matrícula proprietário João. R-3 compra e venda. Hipoteca ativa R$ 180.000,00. Fração ideal 0,021. Certidão negativa de ônus.",
    );
    expect(leitura.esquemaMatricula6Campos).toHaveLength(6);
    const porId = Object.fromEntries(leitura.esquemaMatricula6Campos.map((c) => [c.id, c.presente]));
    expect(porId.proprietario).toBe(true);
    expect(porId.historico).toBe(true);
    expect(porId.gravames).toBe(true);
    expect(porId.onus_situacao).toBe(true);
    expect(porId.fracao_divida).toBe(true);

    const impedimentos = derivarImpedimentosPreSinal({
      spuAtivo: true,
      onusAtivos: [
        { atoNumero: "AV-4", titulo: "Penhora registrada", citacao: "AV-4 penhora" },
        { atoNumero: "R-5", titulo: "Alienação fiduciária", citacao: "R-5 alienação" },
      ],
      alertas: [
        {
          codigo: "chamada_cota_extra",
          titulo: "Chamada de cota extra",
          severidade: "atencao",
          citacao: "rateio",
        },
      ],
      estadosPacote: { matricula: "faltando" },
    });

    const bloqueios = impedimentos.filter((i) => i.relacao === "bloqueia").map((i) => i.id);
    const dependencias = impedimentos.filter((i) => i.relacao === "depende_de").map((i) => i.id);
    expect(bloqueios).toEqual(["spu-uniao", "onus-restricao"]);
    expect(dependencias).toEqual(["onus-garantia", "matricula-pendente", "condo-rateio-acao"]);
    const textoImp = impedimentos.map((i) => `${i.titulo} ${i.impacto} ${i.comoDestravar}`).join(" ");
    expect(REGEX_JARGON_CAMADA1.test(textoImp)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(textoImp)).toBe(false);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(CopilotoDocumentosPreSinal, {
            nomeImovel: "Ed. Atlântico",
            anoConstrucao: 2014,
            unidades: 40,
            chaveLote14: "12345678901234",
            spuAtivo: true,
          }),
        ),
      );
    });

    expect(tree.root.find((n) => n.props.testID === "copiloto-cadeia-impedimentos")).toBeDefined();
    let txt = extrairTextos(tree.toJSON()).join(" ");
    expect(txt).toContain("Bloqueia");
    expect(txt).toContain("Depende de");

    const toggleLeitor = tree.root.find((n) => n.props.testID === "toggle-leitor-rapido-doc");
    act(() => {
      toggleLeitor.props.onPress();
    });
    const input = tree.root.find((n) => n.props.testID === "input-texto-documento");
    act(() => {
      input.props.onChangeText(
        "Matrícula proprietário João. R-3 compra e venda. Hipoteca ativa R$ 180.000,00. Fração ideal 0,021. Certidão negativa de ônus.",
      );
    });

    expect(tree.root.find((n) => n.props.testID === "copiloto-schema-matricula-6")).toBeDefined();
    txt = extrairTextos(tree.toJSON()).join(" ");
    expect(txt).toContain("6 campos essenciais da matrícula");
    expect(txt).toContain("presente");

    const copSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "visual", "CopilotoDocumentosPreSinal.tsx"),
      "utf8",
    );
    expect(copSrc.match(/\bborderWidth:\s*1(?!\.)\b/g)?.length ?? 0).toBeLessThanOrEqual(1);
    expect(copSrc).not.toContain("comAlfa(");

    act(() => {
      tree.unmount();
    });
  });

  it("onda S97: expõe chave dupla lote 14d + CNM 16d (R42/ONR) com cópia em 1 toque e zero borderWidth: 1 em Edificio.tsx", async () => {
    const cnmValida = gerarCnm16Formatado("004123", "2", "0005678");
    const comCnm = sintetizarChaveDuplaDoEdificio({
      chaveLote14: "12345678901234",
      textosDocumentos: [`Certidão de ônus reais CNM ${cnmValida} lavrada em Recife.`],
    });
    expect(comCnm.loteConfirmado).toBe(true);
    expect(comCnm.loteFormatado).toBe("12.3456.789.01.234");
    expect(comCnm.cnmConfirmada).toBe(true);
    expect(comCnm.cnmFormatada).toBe(cnmValida);
    expect(comCnm.textoParaCopiar).toContain("Lote municipal (Prefeitura): 12.3456.789.01.234");
    expect(comCnm.textoParaCopiar).toContain(`Matrícula nacional do cartório (CNM, Código Nacional de Matrícula): ${cnmValida}`);

    const semCnm = sintetizarChaveDuplaDoEdificio({
      chaveLote14: null,
      textosDocumentos: ["Matrícula falsa 123456.7.0005678-00 sem dígito válido."],
    });
    expect(semCnm.loteConfirmado).toBe(false);
    expect(semCnm.loteFormatado).toBe("A confirmar no cadastro");
    expect(semCnm.cnmConfirmada).toBe(false);
    expect(semCnm.cnmFormatada).toBe("Pedir certidão de ônus (16 dígitos)");

    for (const s of [comCnm.textoParaCopiar, comCnm.cnmFormatada, semCnm.loteFormatado, semCnm.cnmFormatada]) {
      expect(REGEX_JARGON_CAMADA1.test(s)).toBe(false);
      for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(s)).toBe(false);
    }

    const bv = edificiosDoBairro("boa-viagem");
    const predioBv = bv[0]!;
    const analiseBv = analiseDoPredio(predioBv, {
      agora: "2026-11-18T10:00:00.000Z",
      indiceGeradoEm: "2026-11-15T00:00:00Z",
      origem: "busca",
    });
    const visaoBv = derivarDossie(
      analiseBv,
      predioBv,
      null,
      [],
      [],
      new Date("2026-11-18T10:00:00.000Z"),
      "custo",
      null,
    );

    const clip = jest.requireMock("expo-clipboard") as { setStringAsync: jest.Mock };
    clip.setStringAsync.mockClear();

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(EdificioDoDossie, {
            visao: visaoBv,
            edificio: predioBv,
            coberto: true,
            vinculoConfirmado: true,
            prioridade: "custo",
            chaveLote14: "12345678901234",
            textosDocumentos: [`Matrícula oficial CNM ${cnmValida}`],
            aoMudarPrioridade: () => undefined,
            aoAbrirPergunta: () => undefined,
            aoAbrirRoteiro: () => undefined,
            aoAbrirFonte: () => undefined,
            aoAbrirCadastro: () => undefined,
            aoConfirmarPredio: () => undefined,
            aoMedirSecao: () => undefined,
          }),
        ),
      );
    });

    const blocoChaves = tree.root.find((n) => n.props.testID === "edificio-chave-dupla");
    expect(blocoChaves).toBeDefined();
    let txt = extrairTextos(tree.toJSON()).join(" ");
    expect(txt).toContain("12.3456.789.01.234");
    expect(txt).toContain(cnmValida);
    expect(REGEX_JARGON_CAMADA1.test(txt)).toBe(false);
    for (const rx of PALAVRAS_PROIBIDAS_UI) expect(rx.test(txt)).toBe(false);

    const btnCopiar = tree.root.find((n) => n.props.testID === "edificio-copiar-chaves");
    await act(async () => {
      btnCopiar.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(clip.setStringAsync).toHaveBeenCalledWith(comCnm.textoParaCopiar);
    txt = extrairTextos(tree.toJSON()).join(" ");
    expect(txt).toContain("Chaves copiadas");

    const edifSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Edificio.tsx"),
      "utf8",
    );
    expect(edifSrc).not.toMatch(/\bborderWidth:\s*1(?!\.)\b/);
    expect(edifSrc).not.toContain("comAlfa(");

    act(() => {
      tree.unmount();
    });
  });

  it("onda S98: zera comAlfa em todas as 7 famílias principais de UI e finaliza bordas limpas em Topo, SeletorDeBairro e index.tsx", () => {
    const familias = [
      join(__dirname, "..", "src", "app", "(abas)"),
      join(__dirname, "..", "src", "componentes", "dossie-v1"),
      join(__dirname, "..", "src", "componentes", "visual"),
      join(__dirname, "..", "src", "componentes", "cidadao"),
      join(__dirname, "..", "src", "componentes", "revisao"),
      join(__dirname, "..", "src", "componentes", "visita-v1"),
      join(__dirname, "..", "src", "componentes", "inicio"),
    ];
    const violacoesComAlfa: string[] = [];
    for (const dir of familias) {
      for (const arquivo of listarTsxRecursivo(dir)) {
        const conteudo = readFileSync(arquivo, "utf8");
        if (/\bcomAlfa\b/.test(conteudo)) {
          violacoesComAlfa.push(arquivo);
        }
      }
    }
    expect(violacoesComAlfa).toEqual([]);

    const topoSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "dossie-v1", "Topo.tsx"),
      "utf8",
    );
    expect(topoSrc).not.toMatch(/\bborderWidth:\s*1(?!\.)\b/);
    expect(topoSrc).not.toContain("JetBrainsMono");
    expect(topoSrc).toContain("tabular-nums");

    const bairroSrc = readFileSync(
      join(__dirname, "..", "src", "componentes", "revisao", "SeletorDeBairro.tsx"),
      "utf8",
    );
    expect(bairroSrc.match(/\bborderWidth:\s*1(?!\.)\b/g)?.length ?? 0).toBeLessThanOrEqual(1);

    const homeSrc = readFileSync(
      join(__dirname, "..", "src", "app", "(abas)", "index.tsx"),
      "utf8",
    );
    expect(homeSrc.match(/\bborderWidth:\s*1(?!\.)\b/g)?.length ?? 0).toBeLessThanOrEqual(2);
  });
});
