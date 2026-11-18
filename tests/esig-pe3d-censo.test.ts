import { describe, expect, it } from "@jest/globals";
import {
  areaPoligonoM2,
  poligonosInterceptamEm31985,
  reprojetarAnelPara31985,
  reprojetarAnelPara4326,
  sirgas31985ParaWgs84,
  wgs84ParaSirgas31985,
} from "../src/nucleo/geo/sirgas31985";
import {
  ESIG_ENDPOINTS,
  construirUrlPaginadaEsig,
  cruzarLoteEm31985,
  extrairCamadaEsigPaginada,
  mapearLinhaIptuParaChaves,
} from "../src/municipios/recife/extratores/esigRest";
import {
  extrairAlturaPe3dNoPonto,
  resolverAlturaEdificacao3D,
  type GradeRasterPe3d,
} from "../src/municipios/recife/extratores/pe3dLidar";
import {
  fundirEntornoComPriorCenso,
  normalizarPercentuaisSetor,
} from "../src/nucleo/censo/entornoCnefe";

describe("Milestone 2 — EPSG:31985, ESIG REST, PE3D LiDAR e IBGE Entorno/CNEFE", () => {
  it("converte ida e volta WGS84 <-> SIRGAS 2000 UTM 25S (EPSG:31985) com precisão submilimétrica no Recife", () => {
    // Marco Zero / Boa Viagem no Recife
    const pontos: [number, number][] = [
      [-34.871139, -8.063169],
      [-34.901234, -8.120456],
      [-34.922851, -8.034112],
    ];
    for (const [lon, lat] of pontos) {
      const [e, n] = wgs84ParaSirgas31985(lon, lat);
      // Zona 25S sobre o Recife: Easting ~288k–295k, Northing ~9.10M–9.115M
      expect(e).toBeGreaterThan(280_000);
      expect(e).toBeLessThan(305_000);
      expect(n).toBeGreaterThan(9_090_000);
      expect(n).toBeLessThan(9_125_000);

      const [lonBack, latBack] = sirgas31985ParaWgs84(e, n);
      expect(Math.abs(lonBack - lon)).toBeLessThan(1e-9);
      expect(Math.abs(latBack - lat)).toBeLessThan(1e-9);
    }

    // Quadrado exato de 100 m × 100 m em EPSG:31985 -> área 10.000 m²
    const quadrado: [number, number][] = [
      [290_000, 9_105_000],
      [290_100, 9_105_000],
      [290_100, 9_105_100],
      [290_000, 9_105_100],
    ];
    expect(areaPoligonoM2(quadrado)).toBeCloseTo(10_000, 4);
    const wgsExato = reprojetarAnelPara4326(quadrado, 9);
    expect(areaPoligonoM2(reprojetarAnelPara31985(wgsExato))).toBeCloseTo(10_000, 2);
    const wgsCompacto = reprojetarAnelPara4326(quadrado, 6);
    expect(Math.abs(areaPoligonoM2(reprojetarAnelPara31985(wgsCompacto)) - 10_000)).toBeLessThan(15);
  });

  it("pagina ESIG ArcGIS REST deterministicamente por OBJECTID com retry em 429/503 e cruza lotes em 31985", async () => {
    const cfg = ESIG_ENDPOINTS.lpuos_2025!;
    expect(construirUrlPaginadaEsig(cfg, 2000, 31985)).toContain("OBJECTID+%3E+2000");
    expect(ESIG_ENDPOINTS.microdrenagem_elementos?.maxRecordCount).toBe(8000);

    let tentativas = 0;
    const urlsChamadas: string[] = [];
    const res = await extrairCamadaEsigPaginada(
      cfg,
      async (url) => {
        urlsChamadas.push(url);
        tentativas += 1;
        if (tentativas === 1) {
          return {
            status: 503,
            headers: { get: () => "1" },
            json: async () => ({}),
          };
        }
        if (url.includes("OBJECTID+%3E+0")) {
          return {
            status: 200,
            json: async () => ({
              exceededTransferLimit: true,
              features: [
                { attributes: { OBJECTID: 10, DSQFL: "12345678901234", ZONA: "ZCS", VLCOEFMAX: 4.0 } },
                { attributes: { OBJECTID: 25, DSQFL: "12345678901235", ZONA: "ZAC", VLCOEFMAX: 3.0 } },
              ],
            }),
          };
        }
        return {
          status: 200,
          json: async () => ({
            exceededTransferLimit: false,
            features: [{ attributes: { OBJECTID: 40, DSQFL: "12345678901236", ZONA: "ZEPH", IEP: 1 } }],
          }),
        };
      },
      { aguardarMs: async () => undefined },
    );

    expect(urlsChamadas.some((u) => u.includes("OBJECTID+%3E+25"))).toBe(true);
    expect(res.paginasLidas).toBe(2);
    expect(res.feicoes).toHaveLength(3);
    expect(res.snapshot.row_count).toBe(3);

    const lote = {
      id: "12345678901234",
      anel31985: [
        [290_000, 9_105_000],
        [290_040, 9_105_000],
        [290_040, 9_105_030],
        [290_000, 9_105_030],
      ] as const,
    };
    const spuSobreposto = {
      id: "spu-orla",
      anel31985: [
        [289_980, 9_104_980],
        [290_020, 9_104_980],
        [290_020, 9_105_050],
        [289_980, 9_105_050],
      ] as const,
    };
    const vizinho80m = {
      id: "99999999999999",
      anel31985: [
        [290_120, 9_105_000],
        [290_160, 9_105_000],
        [290_160, 9_105_030],
        [290_120, 9_105_030],
      ] as const,
    };
    const vizinho180m = {
      id: "88888888888888",
      anel31985: [
        [290_250, 9_105_000],
        [290_280, 9_105_000],
        [290_280, 9_105_030],
        [290_250, 9_105_030],
      ] as const,
    };

    expect(poligonosInterceptamEm31985(lote.anel31985, vizinho80m.anel31985, 100)).toBe(true);
    expect(poligonosInterceptamEm31985(lote.anel31985, vizinho180m.anel31985, 100)).toBe(false);

    const cruz = cruzarLoteEm31985(lote, {
      poligonosSpu: [spuSobreposto],
      poligonosLpuos: [{ ...spuSobreposto, id: "z1", propriedades: { ZONA: "ZCS", VLCOEFMAX: 4.5, IEP: 0 } }],
      poligonosIpav: [],
      lotesProximos: [vizinho80m, vizinho180m],
    });
    expect(cruz.areaTerreno31985M2).toBe(1200);
    expect(cruz.emSpuMarinha).toBe(true);
    expect(cruz.vlCoefMax).toBe(4.5);
    expect(cruz.lotesVizinhos100mIds).toEqual(["99999999999999"]);

    const chaves = mapearLinhaIptuParaChaves(
      {
        "Código Logradouro": "60461",
        "Número do contribuinte": "1045999",
        "AREA TERRENO": "1.200,50",
        "AREA CONSTRUIDA": "95,00",
        "valor do m2 do terreno": "12.500,00",
        "fração ideal": "0,0200",
        "Tipo de Estrutura": "ALVENARIA AUTOPORTANTE",
        "fator de obsolescência": "0,68",
      },
      "12345678901234",
    );
    expect(chaves.codLogradouro).toBe("60461");
    expect(chaves.areaTerrenoM2).toBe(1200.5);
    expect(chaves.valorM2Terreno).toBe(12500);
    expect(chaves.tipoEstrutura).toBe("ALVENARIA AUTOPORTANTE");
  });

  it("calcula MDS - MDT no PE3D LiDAR e preserva fallbacks com tags epistêmicas explícitas", () => {
    const grade: GradeRasterPe3d = {
      fonte: "pe3d_lidar",
      resolucaoM: 1.0,
      lon0: -34.91,
      lat0: -8.06,
      passoDeg: 0.0001,
      cols: 3,
      lins: 3,
      mdtMetros: new Float32Array([
        2.0, 2.0, 2.0,
        2.0, 2.4, 2.0,
        2.0, 2.0, 2.0,
      ]),
      mdsMetros: new Float32Array([
        2.0, 2.0, 2.0,
        2.0, 44.4, 2.0,
        2.0, 2.0, 2.0,
      ]),
    };

    const p = extrairAlturaPe3dNoPonto(grade, -34.9099, -8.0599);
    expect(p.cotaTerrenoM).toBeCloseTo(2.4, 2);
    expect(p.alturaAcimaDoSoloM).toBeCloseTo(42.0, 2);
    expect(p.epistemicTag).toBe("registro_oficial");

    const inf = resolverAlturaEdificacao3D({ lon: -34.9, lat: -8.05, pavimentos: 12 });
    expect(inf.epistemicTag).toBe("inferencia");
    expect(inf.alturaAcimaDoSoloM).toBeCloseTo(38.7, 1);

    const unk = resolverAlturaEdificacao3D({ lon: -34.9, lat: -8.05 });
    expect(unk.epistemicTag).toBe("nao_sabemos");
    expect(unk.alturaAcimaDoSoloM).toBeNull();
  });

  it("funde CNEFE/EMLURB pontual com percentuais do Entorno Censo 2022 apenas como prior ('inferencia')", () => {
    const setor = normalizarPercentuaisSetor({
      codigo: "261160605000001",
      domicilios: 200,
      contagens: {
        bueiro: 120,
        calcada: 180,
        rampa_cadeirante: 30,
        iluminacao: null,
      },
    });
    expect(setor.percentuais.bueiro).toBe(0.6);
    expect(setor.percentuais.iluminacao).toBeNull();

    const fundido = fundirEntornoComPriorCenso(
      { bueirosEmlurbQtd: 2, postesIluminacaoAtivosQtd: undefined },
      setor,
    );
    expect(fundido.bueiro.presentePontual).toBe(true);
    expect(fundido.bueiro.epistemicTag).toBe("registro_oficial");
    expect(fundido.rampa_cadeirante.priorSetorialPct).toBe(0.15);
    expect(fundido.rampa_cadeirante.epistemicTag).toBe("inferencia");
    expect(fundido.iluminacao.epistemicTag).toBe("nao_sabemos");
  });
});
