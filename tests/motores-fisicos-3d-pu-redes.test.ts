import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  avaliarBioclimatico3d,
  calcularVpl10AnosPoente,
  construirHorizonteSolar108,
} from "../src/municipios/recife/motores/bioclimatico3d";
import { avaliarAcustica3d, resolverIsolamentoD2mnTw } from "../src/nucleo/motores/acustica3d";
import {
  agruparChamados156StDbscan,
  avaliarHidroMare1m,
  calcularRiscoAcumulado30AnosPct,
} from "../src/municipios/recife/motores/hidroMare1m";
import { ajustarZeladoriaPuLearningEm } from "../src/nucleo/motores/zeladoriaPuLearning";
import { avaliarResilienciaRedes, DATA_ASSUNCAO_AQUA_PERNAMBUCO } from "../src/municipios/recife/motores/resilienciaRedes";

describe("Milestone 4 — Bioclimático 3D, Acústica 3D, Hidro-Maré 1m, PU-Learning 156 e Resiliência", () => {
  test("IND-03 Bioclimático 3D: Uint8Array(108), sol/brisa EN 17037, VPL Poente R$ 17.521 e Radar LPUOS 2025", () => {
    const horiz = construirHorizonteSolar108([
      {
        id: "viz-leste",
        azimuteGraus: 100,
        distanciaM: 18,
        alturaEdificadaAtualM: 42,
        vlCoefMax: 4.0,
        gabaritoLegalEstimadoM: 48,
      },
      {
        id: "viz-norte-potencial",
        azimuteGraus: 0,
        distanciaM: 25,
        alturaEdificadaAtualM: 6,
        vlCoefMax: 5.0,
        gabaritoLegalEstimadoM: 60,
        protegidoIepZephIpav: false,
      },
    ]);
    expect(horiz).toBeInstanceOf(Uint8Array);
    expect(horiz.byteLength).toBe(108);

    const poenteBaixo = avaliarBioclimatico3d({
      fachadaAzimuteGraus: 270,
      andar: 2,
      horizonte108: horiz,
      lstDeltaIlhaCalorC: 3.1,
      obstaculosProximos: [
        {
          id: "viz-norte-potencial",
          azimuteGraus: 0,
          distanciaM: 25,
          alturaEdificadaAtualM: 6,
          vlCoefMax: 5.0,
          gabaritoLegalEstimadoM: 60,
          protegidoIepZephIpav: false,
        },
      ],
    });

    expect(poenteBaixo.exposicaoPoente).toBe(true);
    expect(poenteBaixo.custoMensalExtraPoenteReais).toBe(210);
    expect(calcularVpl10AnosPoente(210, 0.08)).toBe(17_521);
    expect(poenteBaixo.vpl10AnosPoenteReais).toBe(17_521);
    expect(poenteBaixo.radarPerdaVista.riscoSubstancialVerticalizacao).toBe(true);
    expect(poenteBaixo.radarPerdaVista.margemLegalGabaritoMaxM).toBe(54);

    const nascenteAlto = avaliarBioclimatico3d({
      fachadaAzimuteGraus: 95,
      andar: 14,
      obstaculosProximos: [
        {
          id: "casa-iep",
          azimuteGraus: 95,
          distanciaM: 20,
          alturaEdificadaAtualM: 7,
          protegidoIepZephIpav: true,
        },
      ],
    });
    expect(nascenteAlto.exposicaoPoente).toBe(false);
    expect(nascenteAlto.classificacaoBrisaLesteSudeste).toBe("brisa_franca");
    expect(nascenteAlto.horasSolEquinocioH).toBeGreaterThanOrEqual(1.5);
    expect(nascenteAlto.atendeMetaEn17037Minimo15H).toBe(true);
    expect(nascenteAlto.radarPerdaVista.amortecedorPatrimonialIepZephIpav).toBe(true);
  });

  test("IND-04 Acústica 3D: atenuação de fundos/altura na via, zero atenuação no PEZR SBRF, corte 2013 e privacidade P3", () => {
    expect(resolverIsolamentoD2mnTw(1998)).toBe(17.8);
    expect(resolverIsolamentoD2mnTw(2020, "Superior")).toBe(32.8);

    const frenteTerreoAv = avaliarAcustica3d({
      andar: 1,
      fachadaVoltadaParaVia: "frente",
      tipologiaVia: "arterial_principal",
      distanciaViaM: 12,
      anoConstrucao: 2005,
      distanciaFonteLuseM: 40,
      precoImovelReais: 800_000,
    });

    const fundosAltoAv = avaliarAcustica3d({
      andar: 15,
      fachadaVoltadaParaVia: "fundos",
      tipologiaVia: "arterial_principal",
      distanciaViaM: 12,
      anoConstrucao: 2021,
      classeIsolamentoDeclarada: "Superior",
      distanciaFonteLuseM: 40,
    });

    expect(fundosAltoAv.ruidoExternoViaDbA).toBeLessThan(frenteTerreoAv.ruidoExternoViaDbA - 12);
    expect(frenteTerreoAv.privacidadeAudio.gravacaoAudioBrutoPermitida).toBe(false);
    expect(frenteTerreoAv.descontoHedonicoNelsonNsdiPct).toBeGreaterThan(5);

    // PEZR SBRF 65 dB sobre o edifício: sem atenuação por andar alto nem fundos
    const sobRotaSbrfPre2013 = avaliarAcustica3d({
      andar: 18,
      fachadaVoltadaParaVia: "fundos",
      tipologiaVia: "local",
      distanciaViaM: 30,
      anoConstrucao: 2008,
      curvaPezrAeroportoDb: 65,
    });
    const sobRotaSbrfSup2022 = avaliarAcustica3d({
      andar: 18,
      fachadaVoltadaParaVia: "fundos",
      tipologiaVia: "local",
      distanciaViaM: 30,
      anoConstrucao: 2022,
      classeIsolamentoDeclarada: "Superior",
      curvaPezrAeroportoDb: 65,
    });
    expect(sobRotaSbrfPre2013.ruidoExternoAeronavePezrDb).toBe(65);
    expect(sobRotaSbrfPre2013.ruidoInternoDormitorioDbA).toBeCloseTo(47.2, 0);
    expect(sobRotaSbrfSup2022.ruidoInternoDormitorioDbA).toBeCloseTo(32.2, 0);
  });

  test("IND-05 Hidro-Maré 1m: ST-DBSCAN deduplica enxurrada 156 e integra tábua REMO real + macrodrenagem + Beltrán", () => {
    const marePath = join(__dirname, "..", "docs/dados/raw/fontes-prioritarias-2026-11-14/mare-remo-porto-recife-2026-11-14.json");
    const mareJson = JSON.parse(readFileSync(marePath, "utf-8")) as { registros: { hora: string; altura_m: number; tipo: "PM" | "BM" | null }[] };

    const t0 = Date.parse("2026-05-20T14:00:00Z");
    const chamados = [
      { id: "c1", lon: -34.901, lat: -8.065, timestampMs: t0 },
      { id: "c2", lon: -34.9012, lat: -8.0652, timestampMs: t0 + 30 * 60_000 },
      { id: "c3", lon: -34.9008, lat: -8.0649, timestampMs: t0 + 90 * 60_000 },
      { id: "c4", lon: -34.901, lat: -8.065, timestampMs: t0 + 15 * 86_400_000 }, // outro evento 15 dias depois
    ];
    const clusters = agruparChamados156StDbscan(chamados);
    expect(clusters).toHaveLength(2);
    expect(clusters[0]!.chamadosAgrupados).toBe(3);

    expect(calcularRiscoAcumulado30AnosPct(0.01)).toBeCloseTo(26.0, 1);

    const hidro = avaliarHidroMare1m({
      handM: 0.85,
      areaDrenadaM2: 4500,
      declividadeTangente: 0.008,
      cotaTerrenoM: 1.9,
      cotaViaM: 2.05,
      emPoligonalAlagamento2026: true,
      chamados156NoRaio: chamados,
      pulsosChuvaProximos: [{ dataHoraUtc: "2026-05-20T14:00:00Z", acumulado3hMm: 48.2 }],
      leiturasMareDia: mareJson.registros,
      statusLimpezaMacrodrenagem: "NÃO FOI LIMPO",
      probabilidadeAnualHistorica: 0.01,
      precoImovelReais: 500_000,
    });

    expect(hidro.eventosDistintosAgrupados).toBe(2);
    expect(hidro.mareMaximaDiaM).toBeGreaterThanOrEqual(1.8);
    expect(hidro.eventoCompostoChuvaMareCritica).toBe(true);
    expect(hidro.alertaDrenagemNaoLimpa).toBe(true);
    expect(hidro.deltaZMeioFioM).toBeCloseTo(-0.15, 2);
    expect(hidro.classificacaoExposicao).toBe("critica_lote_baixo");
    expect(hidro.faixaImpactoBeltranReais).toEqual([-124_500, -52_500]);
  });

  test("IND-06 PU-Learning EM separa risco latente de propensão de reporte ao 156 com ELBO monotônico", () => {
    const res = ajustarZeladoriaPuLearningEm([
      {
        id: "rua-alta-renda-156",
        observadoPositivo156: true,
        rendaMedianaSm: 8.5,
        escolaridadeSuperiorPct: 72,
        coberturaInternetPct: 98,
        sinaisFisicos: { proximidadeCanalOuDrenagemScore: 0.9, desnivelTopograficoScore: 0.85, deficienciaIluminacaoVistoriada: 0.7 },
      },
      {
        id: "rua-subnotificada",
        observadoPositivo156: false,
        rendaMedianaSm: 1.4,
        escolaridadeSuperiorPct: 12,
        coberturaInternetPct: 48,
        sinaisFisicos: { proximidadeCanalOuDrenagemScore: 0.92, desnivelTopograficoScore: 0.88, deficienciaIluminacaoVistoriada: 0.8 },
      },
      {
        id: "rua-seca-estavel",
        observadoPositivo156: false,
        rendaMedianaSm: 6.0,
        escolaridadeSuperiorPct: 65,
        coberturaInternetPct: 95,
        sinaisFisicos: { proximidadeCanalOuDrenagemScore: 0.05, desnivelTopograficoScore: 0.08, deficienciaIluminacaoVistoriada: 0.05 },
      },
    ]);

    expect(res.epistemicTag).toBe("inferencia");
    for (let i = 1; i < res.elboPorIteracao.length; i += 1) {
      expect(res.elboPorIteracao[i]!).toBeGreaterThanOrEqual(res.elboPorIteracao[i - 1]! - 1e-6);
    }
    const subnot = res.itens.find((x) => x.id === "rua-subnotificada")!;
    const seca = res.itens.find((x) => x.id === "rua-seca-estavel")!;
    expect(subnot.propensaoReporteEstimada).toBeLessThan(0.5);
    expect(subnot.riscoLatenteCorrigidoTheta).toBeGreaterThan(seca.riscoLatenteCorrigidoTheta);
  });

  test("IND-08 Resiliência de Redes: AQUA PE em 23/11/2026 + dívidas pré-transição Compesa + conjunto DEC real", () => {
    const energiaPath = join(__dirname, "..", "docs/dados/raw/fontes-prioritarias-2026-11-14/energia-prova-conjuntos-dec-fec-2025.json");
    const energiaJson = JSON.parse(readFileSync(energiaPath, "utf-8")) as {
      contagens: { "boa-viagem": { conjuntos: Record<string, number> } };
    };
    const codIdReal = Object.keys(energiaJson.contagens["boa-viagem"].conjuntos)[0]!;

    const pre = avaliarResilienciaRedes(
      {
        bairroSlug: "boa-viagem",
        unidadesCondominio: 20,
        volumeCisternaLitros: 30_000,
        volumeCaixaSuperiorLitros: 12_900,
        conjuntoEletricoCodId: codIdReal,
        decHorasAno: 14.5,
        fecInterrupcoesAno: 7.2,
        temGeradorElevadorBomba: false,
        distanciaErb5g3500MhzM: 320,
      },
      "2026-11-20",
    );
    expect(pre.hidrico.concessionariaDistribuicaoVigente).toBe("Compesa");

    const pos = avaliarResilienciaRedes(
      {
        bairroSlug: "boa-viagem",
        unidadesCondominio: 20,
        volumeCisternaLitros: 30_000,
        volumeCaixaSuperiorLitros: 12_900,
        conjuntoEletricoCodId: codIdReal,
        decHorasAno: 14.5,
        fecInterrupcoesAno: 7.2,
        temGeradorElevadorBomba: false,
        distanciaErb5g3500MhzM: 320,
      },
      DATA_ASSUNCAO_AQUA_PERNAMBUCO,
    );
    expect(pos.hidrico.concessionariaDistribuicaoVigente).toBe("AQUA Pernambuco (Acciona + BRK)");
    expect(pos.hidrico.alertaDividaAnterior23Nov2026).toMatch(/23\/11\/2026.*Compesa/);
    expect(pos.hidrico.autonomiaReservaDias).toBe(5);
    expect(pos.eletrico.conjuntoCodId).toBe(codIdReal);
    expect(pos.eletrico.riscoInterrupcaoSemGerador).toBe("alto");
    expect(pos.telecom.coberturaEstimada5g).toBe("forte_urbana");
    expect(pos.telecom.roteiroTesteVisitaComodos).toHaveLength(3);
  });
});
