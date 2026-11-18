// Sobrou de tests/persistencia-sqlite-pmtiles-multicidade.test.ts (19/11/2026, decisão A8): os três testes que abriam o
// banco SQLite e o PMTiles saíram com o núcleo offline (guardado em arquivo/nucleo-offline-2026-11-18). Este não usa nenhum
// dos dois: só o roteamento de cobertura por município.
import { describe, expect, test } from "@jest/globals";
import { diagnosticarImovelPorMunicipio, resolverCapacidadesMunicipio } from "../src/municipios/adaptadores/registroMunicipios";
import { endpointDatajudEstadualPorUf } from "../src/nucleo/camadaZeroNacional";

describe("Camada 0/1/2 Multi-Cidade", () => {
  test("Roteia Camada 0 Nacional (5.570 municípios) e Camadas 1/2 (Recife C2 + capitais C1)", () => {
    const capRecife = resolverCapacidadesMunicipio("2611606");
    expect(capRecife.tier).toBe("C2");
    expect(capRecife.possuiLidarAltaResolucao).toBe(true);

    const capSp = resolverCapacidadesMunicipio("3550308");
    expect(capSp.tier).toBe("C1");
    expect(endpointDatajudEstadualPorUf("SP")).toMatch(/api_publica_tjsp/);

    const c0 = diagnosticarImovelPorMunicipio({
      codigoIbge7: "2604106", // Caruaru (PE) — cobertura universal Camada 0
      nomeMunicipio: "Caruaru",
      uf: "PE",
      distanciaErb5gM: 380,
      conjuntoAneelDec: 11.4,
      deltaIlhaCalorMapBiomasC: 2.8,
      areaRiscoCprm: false,
    });
    expect(c0.capacidades.tier).toBe("C0");
    expect(c0.dossieBaseNacional.sinaisNacionais.cobertura5gEstimada).toBe("forte");
    expect(c0.dossieBaseNacional.tagPredominante).toBe("registro_oficial");
  });
});
