// VE16: o texto de cobertura das camadas acompanha os módulos gerados (nada de "cinco bairros" fixo na tela).
import { describe, expect, it } from "@jest/globals";
import { AREAS_POR_CAMADA, nomesDasAreas } from "../src/dados/recife/coberturaDasCamadas";

describe("cobertura das camadas", () => {
  it("toda camada cobre ao menos o piloto, na ordem publicada", () => {
    for (const areas of Object.values(AREAS_POR_CAMADA)) expect(areas.slice(0, 5)).toEqual(["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"]);
  });
  it("nomes oficiais com vírgulas e 'e'", () => {
    expect(nomesDasAreas(["boa-viagem", "casa-forte", "torre"])).toBe("Boa Viagem, Casa Forte e Torre");
    expect(nomesDasAreas(["gracas"])).toBe("Graças");
    expect(nomesDasAreas([])).toBe("");
  });
});
