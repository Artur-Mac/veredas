import { describe, expect, it } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { derivarCustoPorPartes } from "../src/dados/custoPorPartes";
import { esquemaAnaliseV2, esquemaEdificio } from "../src/dados/contratos";
import { avaliarConfortoTermico } from "../src/dados/clima/confortoTermico";
import { avaliarBioclimatico3d } from "../src/municipios/recife/motores/bioclimatico3d";
import { avaliarAcustica3d } from "../src/nucleo/motores/acustica3d";
import { EscalaDeRuidoHumana } from "../src/componentes/visual/EscalasVisuais";
import { TermometroConfortoTermico } from "../src/componentes/visual/TermometroConfortoTermico";
import { TresPerguntasDoBolso } from "../src/componentes/visual/TresPerguntasDoBolso";
import { TemaDoApp } from "../src/tema/Tema";
import type { PerfilDoDomicilio } from "../src/estado/PerfilDomicilio";

const PERFIL_RECIFE: PerfilDoDomicilio = {
  versao: 1,
  configurado: true,
  moradores: 2,
  usoArCondicionado: "noite_1_quarto",
  destinoBairro: "recife",
  modoTransporte: "carro_moto",
  diasPresenciaisMes: 20,
  entradaPercentualCompra: 20,
  prazoAnosCompra: 30,
  necessidadesDeAcesso: [],
  orcamentoMensalReais: 5500,
  locaisRotina: [],
  atualizadoEm: null,
};

function textosDoNo(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
  if (!node) return "";
  if (Array.isArray(node)) return node.flatMap(textosDoNo).join(" ");
  return (node.children ?? []).map((c) => (typeof c === "string" ? c : textosDoNo(c))).join(" ");
}

describe("3 Pegadinhas Reais do Mercado Imobiliário do Recife", () => {
  it("Pegadinha 1: O 'falso econômico' em Terreno de Marinha (Ocupação bloqueia FGTS + soma taxa anual)", () => {
    const vazio = { valor: null, origem: "link" as const, aConfirmar: true };
    const analise = esquemaAnaliseV2.parse({
      versao: 2,
      id: "peg-spu-1",
      criadaEm: "2026-11-17T10:00:00Z",
      atualizadaEm: "2026-11-17T10:00:00Z",
      url: "https://anuncio.invalid/spu",
      nome: "Apartamento em Boa Viagem perto da praia",
      modalidade: "compra",
      tipologia: "apartamento",
      bairro: "boa-viagem",
      bairroTexto: "Boa Viagem",
      logradouro: "Rua Barão de Souza Leão",
      numero: "420",
      nomeEdificio: "Edifício Costa Sul",
      extracao: null,
      declarados: {
        preco: { valor: 490_000, origem: "link", aConfirmar: false },
        condominio: { valor: 1_550, origem: "link", aConfirmar: false },
        iptu: { valor: 2_800, origem: "link", periodo: "ano", aConfirmar: false },
        seguroIncendio: vazio,
        taxaServico: vazio,
        outros: vazio,
        area: { valor: 96, origem: "link", aConfirmar: false },
        quartos: { valor: 3, origem: "link", aConfirmar: false },
        suites: vazio,
        banheiros: { valor: 2, origem: "link", aConfirmar: false },
        vagas: { valor: 1, origem: "link", aConfirmar: false },
        andar: { valor: 5, origem: "link", aConfirmar: false },
      },
      vinculo: {
        estado: "confirmado",
        edificioId: "70100-420",
        dsqfl: "12345678901234",
        confirmadoEm: "2026-11-17T10:00:00Z",
        indiceGeradoEm: "2026-11-17T08:00:00Z",
      },
      visita: {
        verificadas: [],
        respostas: {},
        perguntasProprias: [],
        notas: "",
        ruido: null,
        orientacaoGraus: null,
        segundos: 0,
        concluidaEm: null,
      },
      salva: true,
      descarte: null,
    });

    const predioOrla = esquemaEdificio.parse({
      id: "70100-420",
      bairro: "boa-viagem",
      logradouro: "RUA BARAO DE SOUZA LEAO",
      numero: "420",
      dsqfl: "12345678901234",
      nome: "Edifício Costa Sul",
      centro: [-34.889, -8.116], // ponto na orla atlântica de Boa Viagem
      poligono: null,
      unidades: 12, // condomínio pequeno, rateio pesado
      tipologias: [{ area: 96, unidades: 12, iptuAnualMediano: 2800 }],
      anoConstrucao: 1994,
      pavimentos: 6,
      ate4Pavimentos: false,
      padrao: "Médio",
      iptuAnual: { n: 12, p25: 2500, mediana: 2800, p75: 3100 },
      itbi: null,
      obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
    });

    const partes = derivarCustoPorPartes(analise, predioOrla, PERFIL_RECIFE, {
      regimeSpu: "ocupacao",
      valorDominioPlenoTerrenoReais: 6_000_000,
      fracaoIdeal: 1 / 12,
    });

    expect(partes.spuEstatutario?.elegivelFgtsCaixa).toBe(false);
    expect(partes.spuEstatutario?.encargoPatrimonialAnualVigenteReais).toBe(10_000); // 2% de (6M / 12)
    expect(partes.alertaMarinha).not.toBeNull();
    expect(partes.estruturaECondominio?.classeAgressividade).toBe("CAA-IV");
    expect(partes.estruturaECondominio?.sistemasEmJanelaCritica.length).toBeGreaterThan(0);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(TresPerguntasDoBolso, {
            modalidade: "compra",
            nomeImovel: analise.nome,
            enderecoImovel: "Boa Viagem",
            precoAnuncioReais: 490_000,
            aluguelAnunciadoReais: null,
            condominioMensalReais: 1_550,
            iptuMensalReais: 233,
            prestacaoEstimadaReais: partes.simulacaoCompra?.prestacaoPriceReais ?? 3_500,
            entradaReais: 98_000,
            itbiReais: 6_000,
            spuAnualReais: partes.spuEstatutario?.encargoPatrimonialAnualVigenteReais ?? 10_000,
            custoMensalArReais: 180,
            economiaLegalItbiReais: partes.otimizacaoFechamento?.melhorCenarioEconomiaReais ?? 8_000,
            descontoRuidoReais: 0,
            vplCalorPoenteReais: 0,
            riscoManutencaoPredioReais: partes.estruturaECondominio?.choqueCotaExtraEstimadoPorUnidadeReais ?? 12_000,
            excedenteMedianaM2Reais: 0,
          }),
        ),
      );
    });
    const txt = textosDoNo(tree.toJSON());
    expect(txt).toContain("Taxa da União /12");
    // Decisão D4 (18/11/2026): ficam os fatos para negociar, sem valor de proposta.
    expect(txt).toContain("Fatos que você pode levar à conversa");
    expect(txt).not.toMatch(/alvo (justo|sugerido)/i);
  });

  it("Pegadinha 2: Cobertura / último andar Poente em ilha de calor vira forno à tarde", () => {
    const bioCobertura = avaliarBioclimatico3d({
      fachadaAzimuteGraus: 270, // Poente
      andar: 16,
      lstDeltaIlhaCalorC: 1.5,
    });
    const confCobertura = avaliarConfortoTermico({
      andar: 16,
      pavimentosTotais: 16, // último andar (laje exposta)
      fachadaAzimuteGraus: 270,
      bioclimatico: bioCobertura,
      diferencaBairroCalorC: 1.5,
    });

    expect(confCobertura.zona).toBe("quente_tarde");
    expect(confCobertura.selo).toBe("Quente à tarde");
    expect(confCobertura.fatores.some((f) => /Último andar/i.test(f.titulo))).toBe(true);
    expect(confCobertura.custoMensalArReais).toBeGreaterThanOrEqual(240);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(TermometroConfortoTermico, { conforto: confCobertura, andar: 16 })),
      );
    });
    const txt = textosDoNo(tree.toJSON());
    expect(txt).toContain("Quente à tarde");
    expect(txt).toContain("Último andar");
  });

  it("Pegadinha 3: Quarto baixo pré-2013 de frente para corredor arterial estoura conforto acústico", () => {
    const acuCorredor = avaliarAcustica3d({
      andar: 2,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "arterial_principal",
      distanciaViaM: 8,
      anoConstrucao: 1995, // esquadria pré-NBR 15575 (2013)
      precoImovelReais: 580_000,
    });

    expect(acuCorredor.isolamentoFachadaD2mnTwDb).toBeLessThan(20);
    expect(acuCorredor.atendeReferenciaNoturnaNbr10151).toBe(false);
    expect(acuCorredor.ruidoInternoDormitorioDbA).toBeGreaterThan(50);
    expect(acuCorredor.descontoHedonicoEstimadoReais).toBeGreaterThan(0);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(EscalaDeRuidoHumana, { acustica: acuCorredor, anoConstrucao: 1995 })),
      );
    });
    const txt = textosDoNo(tree.toJSON());
    expect(txt).toContain("Atenção à janela");
    expect(txt).toContain("Prédio de 1995: janelas antigas filtram menos o som da rua");
    expect(txt).toContain("Trânsito da via");
    expect(txt).not.toMatch(/\d\s*dB\b/i);
  });
});
