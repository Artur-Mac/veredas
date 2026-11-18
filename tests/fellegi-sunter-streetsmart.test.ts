import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  calcularPhash64,
  deduplicarAnunciosMultiCorretor,
  distanciaHammingHex64,
  jaroWinkler,
  vincularAnuncioFellegiSunter,
  type CandidatoPredioCadastro,
} from "../src/nucleo/resolucao/fellegiSunter";
import {
  avaliarWalkabilityStreetSmart,
  filtrarPartidasValidasGtfs,
  pesoDecaimentoPolinomial,
} from "../src/nucleo/mobilidade/streetSmart";

describe("Milestone 5 — Fellegi-Sunter 250m EM, pHash Multi-Corretor e Street Smart/GTFS", () => {
  test("Fellegi-Sunter bloqueia em 250 m (EPSG:31985), confirma match inequívoco e exige revisão explícita na zona cinzenta", () => {
    const candidatos: CandidatoPredioCadastro[] = [
      {
        buildingId: "edf-gracas-100",
        dsqfl: "11223344556677",
        codLogradouro: "88001",
        nomeEdificio: "Parador de Cervantes",
        logradouro: "RUA TELES JUNIOR",
        numero: "150",
        bairroSlug: "gracas",
        lon: -34.901,
        lat: -8.046,
        pavimentos: 14,
        areasTipologiasM2: [98, 125],
      },
      {
        buildingId: "edf-longe-500m",
        dsqfl: "99887766554433",
        codLogradouro: "88001",
        nomeEdificio: "Parador de Cervantes",
        logradouro: "RUA TELES JUNIOR",
        numero: "150",
        bairroSlug: "gracas",
        lon: -34.9065, // > 500 m distante
        lat: -8.046,
        pavimentos: 14,
        areasTipologiasM2: [125],
      },
    ];

    expect(jaroWinkler("Edf Parador Cervantes", "Parador de Cervantes")).toBeGreaterThan(0.7);

    const linksConfirmados = vincularAnuncioFellegiSunter(
      {
        adId: "zap-1",
        url: "https://anuncio.invalid/1",
        portal: "zap",
        bairroSlug: "gracas",
        logradouroTexto: "Rua Teles Júnior",
        numeroTexto: "150",
        nomeEdificioTexto: "Parador de Cervantes",
        areaM2: 124,
        quartos: 3,
        vagas: 2,
        andar: 7,
        precoReais: 850_000,
        lon: -34.9012,
        lat: -8.0461,
      },
      candidatos,
    );

    // O candidato > 250 m foi filtrado pelo blocking espacial EPSG:31985
    expect(linksConfirmados).toHaveLength(1);
    expect(linksConfirmados[0]!.match_tier).toBe("confirmado");
    expect(linksConfirmados[0]!.posterior_probability).toBeGreaterThanOrEqual(0.95);

    // Zona cinzenta sem número exato e nome parcial nunca é assumida silenciosamente
    const linksCinza = vincularAnuncioFellegiSunter(
      {
        adId: "olx-amb",
        url: "https://anuncio.invalid/2",
        portal: "olx",
        bairroSlug: "gracas",
        logradouroTexto: "Rua Teles Junior",
        numeroTexto: null,
        nomeEdificioTexto: "Condominio das Flores",
        areaM2: 100,
        quartos: 3,
        vagas: 1,
        andar: 4,
        precoReais: 680_000,
        lon: -34.9012,
        lat: -8.0461,
      },
      candidatos,
    );
    expect(linksCinza[0]!.match_tier).toBe("candidato_revisao");
    expect(linksCinza[0]!.requires_user_confirmation).toBe(true);
    expect(linksCinza[0]!.reviewed_by).toBeNull();
  });

  test("pHash 64-bit e atributos estruturais agrupam anúncios duplicados de portais diferentes expondo dispersão de preço", () => {
    const imgBase = Array.from({ length: 64 }, (_, i) => (i % 8) * 30 + Math.floor(i / 8) * 5);
    // Cópia recomprimida com leve ruído mantém Hamming <= 6
    const imgRecompress = imgBase.map((v, i) => (i % 19 === 0 ? v + 2 : v));

    const h1 = calcularPhash64(imgBase);
    const h2 = calcularPhash64(imgRecompress);
    expect(distanciaHammingHex64(h1, h2)).toBeLessThanOrEqual(6);

    const grupos = deduplicarAnunciosMultiCorretor([
      {
        adId: "imob-a",
        url: "https://imob-a.invalid/1",
        portal: "zap",
        bairroSlug: "gracas",
        logradouroTexto: "Rua Teles Junior",
        numeroTexto: "150",
        nomeEdificioTexto: "Parador",
        areaM2: 125,
        quartos: 3,
        vagas: 2,
        andar: 7,
        precoReais: 850_000,
        dsqflVinculado: "11223344556677",
        matrizCinza8x8: imgBase,
      },
      {
        adId: "imob-b",
        url: "https://imob-b.invalid/2",
        portal: "vivareal",
        bairroSlug: "gracas",
        logradouroTexto: "Rua Teles Junior",
        numeroTexto: "150",
        nomeEdificioTexto: "Parador",
        areaM2: 125,
        quartos: 3,
        vagas: 2,
        andar: 7,
        precoReais: 935_000,
        dsqflVinculado: "11223344556677",
        matrizCinza8x8: imgRecompress,
      },
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0]!.portais).toEqual(["vivareal", "zap"]);
    expect(grupos[0]!.precoMinReais).toBe(850_000);
    expect(grupos[0]!.precoMaxReais).toBe(935_000);
    expect(grupos[0]!.dispersaoPrecoPct).toBe(10);
  });

  test("Street Smart penaliza quadras > 120 m, aplica decaimento 400-2400 m, usa semáforos reais e respeita calendário GTFS >24h", () => {
    const semPath = join(__dirname, "..", "docs/dados/raw/fontes-prioritarias-2026-11-14/semaforos-acessiveis.json");
    const semaforos = JSON.parse(readFileSync(semPath, "utf-8")) as { semafororo: number; bairro: string }[];
    expect(semaforos.length).toBeGreaterThanOrEqual(60);

    expect(pesoDecaimentoPolinomial(300)).toBe(1);
    expect(pesoDecaimentoPolinomial(1400)).toBeCloseTo(0.5, 2);
    expect(pesoDecaimentoPolinomial(2500)).toBe(0);

    const caminhaoBoa = avaliarWalkabilityStreetSmart({
      servicosProximos: [
        { id: "sup", categoria: "supermercado", distanciaRedeM: 250 },
        { id: "far", categoria: "farmacia", distanciaRedeM: 380 },
        { id: "par", categoria: "parque", distanciaRedeM: 800 },
      ],
      fatoresRua: {
        comprimentoMedioQuadraM: 95,
        intersecoesPorKm2: 90,
        coberturaCopaArvoresPct: 40,
        iluminacaoDesativada150mCount: 0,
        pctDomiciliosCalcadaAdequada: 80,
        semaforosSonorosProximosCount: semaforos.filter((s) => /Graças/i.test(s.bairro)).length,
        abrigosClimaticosProximosCount: 3,
      },
    });

    const quadraMuro = avaliarWalkabilityStreetSmart({
      servicosProximos: [
        { id: "sup", categoria: "supermercado", distanciaRedeM: 250 },
        { id: "far", categoria: "farmacia", distanciaRedeM: 380 },
        { id: "par", categoria: "parque", distanciaRedeM: 800 },
      ],
      fatoresRua: {
        comprimentoMedioQuadraM: 240,
        intersecoesPorKm2: 28,
        coberturaCopaArvoresPct: 5,
        iluminacaoDesativada150mCount: 4,
      },
    });

    expect(caminhaoBoa.indiceAcessoAPeSinergico).toBeGreaterThan(quadraMuro.indiceAcessoAPeSinergico);
    expect(quadraMuro.alertaQuadraLonga).toBe(true);

    // Calendário GTFS: 2026-11-15 é Domingo; exceção remove serviço útil de feriado e mantém viagem > 24h ("25:15:00" = 01:15)
    const partidas = filtrarPartidasValidasGtfs({
      dataYyyymmdd: "20261115",
      horaAtualHms: "01:00:00",
      janelaMinutos: 45,
      calendars: [
        {
          serviceId: "UTIL",
          monday: 1,
          tuesday: 1,
          wednesday: 1,
          thursday: 1,
          friday: 1,
          saturday: 0,
          sunday: 0,
          startDateYyyymmdd: "20260101",
          endDateYyyymmdd: "20261231",
        },
        {
          serviceId: "DOM_CORUJAO",
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 1,
          sunday: 1,
          startDateYyyymmdd: "20260101",
          endDateYyyymmdd: "20261231",
        },
      ],
      exceptions: [{ serviceId: "DOM_CORUJAO", dateYyyymmdd: "20261115", exceptionType: 2 }],
      stopTimes: [
        { serviceId: "UTIL", tripId: "t1", routeShortName: "CDU/Caxangá", departureTimeHms: "01:20:00" },
        { serviceId: "DOM_CORUJAO", tripId: "t2", routeShortName: "Bacurau BV", departureTimeHms: "25:15:00" },
      ],
      incluirDiaOperacionalAnteriorAposMeiaNoite: true,
    });

    expect(partidas.some((p) => p.routeShortName === "CDU/Caxangá")).toBe(false);
    expect(partidas.some((p) => p.routeShortName === "Bacurau BV" && p.esperaMin === 15)).toBe(true);
  });
});
