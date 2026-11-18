import { describe, expect, it, jest } from "@jest/globals";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { inferirFachadasDoEdificio } from "../src/dados/sol/inferirFachadas";
import { simularCenaSombra25D, type PredioCena25D } from "../src/dados/sol/motorSombra25D";
import { analisarRadarVistaELote } from "../src/dados/entorno/radarVistaELote";
import { calcularPulsoDaQuadra } from "../src/dados/dossie/pulsoDaQuadra";
import { avaliarBioclimatico3d } from "../src/municipios/recife/motores/bioclimatico3d";
import { avaliarConfortoTermico } from "../src/dados/clima/confortoTermico";
import { avaliarAcustica3d } from "../src/nucleo/motores/acustica3d";
import { PALAVRAS_PROIBIDAS_UI, REGEX_JARGON_CAMADA1 } from "../src/dados/cidadao/tradutorCidadao";
import { CanvasSolSombraBrisa25D } from "../src/componentes/visual/CanvasSolSombraBrisa25D";
import { RadarVistaELote } from "../src/componentes/visual/RadarVistaELote";
import { CopilotoDocumentosPreSinal } from "../src/componentes/visual/CopilotoDocumentosPreSinal";
import { PulsoDaQuadra } from "../src/componentes/visual/PulsoDaQuadra";
import { TresPerguntasDoBolso } from "../src/componentes/visual/TresPerguntasDoBolso";
import { RotinaDoisDestinosComparar } from "../src/componentes/visual/RotinaDoisDestinosComparar";
import { ExportarResumoExecutivo } from "../src/componentes/visual/ExportarResumoExecutivo";
import { compararRotinaDoisDestinos } from "../src/dados/mobilidade/rotinaCasal";
import { auditarTextoColadoCidadao } from "../src/dados/documentos/copilotoPreSinal";
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
});
