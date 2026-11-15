// Linha do tempo documental da estrutura (15/11/2026): etapas separadas, vínculo exigido, nunca estado atual.
import { describe, expect, it } from "@jest/globals";
import { lerLinhaDoTempo, type AtoDocumentado } from "../src/dados/estrutura/linhaDoTempo";

const ato = (x: Partial<AtoDocumentado>): AtoDocumentado => ({ etapa: "vistoria", data: "2025-04-10", documento: "Diário Oficial do Recife (fictício para teste)", numero: null, orgao: "SEDEC", vinculo: "lote", ...x });

describe("linha do tempo estrutural", () => {
  it("sem atos: diz que não há documento e o que perguntar", () => {
    const l = lerLinhaDoTempo([]);
    expect(l.frase).toBe("Nenhum ato documentado sobre a estrutura deste prédio.");
    expect(l.etapasSemDocumento).toHaveLength(6);
    expect(l.perguntaAoSindico).toContain("ART ou RRT");
  });
  it("interdição sem liberação: último ato e a checagem que falta; nunca o estado atual", () => {
    const l = lerLinhaDoTempo([ato({ etapa: "chamado", data: "2025-03-02" }), ato({ etapa: "interdicao", data: "2025-04-10", numero: "Ofício 123/2025" })]);
    expect(l.frase).toBe("Último ato documentado: interdição em 10/04/2025 (Ofício 123/2025). Isso não confirma a condição atual do prédio.");
    expect(l.checagemQueFalta).toContain("liberação posterior à interdição");
    expect(l.perguntaAoSindico).toContain("A interdição foi suspensa?");
    expect(l.etapasComprovadas).toEqual(["chamado", "interdicao"]);
  });
  it("liberação anterior à interdição não conta como liberação", () => {
    const l = lerLinhaDoTempo([ato({ etapa: "liberacao", data: "2024-01-01" }), ato({ etapa: "interdicao", data: "2025-04-10" })]);
    expect(l.checagemQueFalta).toContain("liberação posterior");
  });
  it("vínculo ambíguo (só bairro ou rua) é descartado e contado", () => {
    const l = lerLinhaDoTempo([ato({ vinculo: "bairro_ou_rua", etapa: "interdicao" })]);
    expect(l.atos).toHaveLength(0);
    expect(l.descartados).toBe(1);
    expect(l.frase).toBe("Nenhum ato documentado sobre a estrutura deste prédio.");
  });
  it("desabamento só com documento ligado ao lote e ao bloco", () => {
    expect(lerLinhaDoTempo([ato({ etapa: "desabamento", vinculo: "lote" })]).mostrarDesabamento).toBe(false);
    expect(lerLinhaDoTempo([ato({ etapa: "desabamento", vinculo: "lote_e_bloco" })]).mostrarDesabamento).toBe(true);
  });
  it("ato sem data não vira último ato datado", () => {
    const l = lerLinhaDoTempo([ato({ data: null })]);
    expect(l.ultimoAto).toBeNull();
    expect(l.frase).toBe("Há um ato documentado, sem data no documento.");
  });
});
