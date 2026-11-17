// Internet no lugar em que a pessoa vai usar (15/11/2026): consulta de fibra, medição no cômodo e o que falta.
import { describe, expect, it } from "@jest/globals";
import { cadernoVazio, esquemaCaderno } from "../src/dados/caderno";
import { esquemaConsultaDeFibra, esquemaMedicaoNoComodo, frasesDaDisponibilidade, frasesDaQualidade, pendenciasDaConectividade, type RegistroDeConectividade } from "../src/dados/conectividade";
import { numeroOuNulo } from "../src/componentes/caderno/Conectividade";

const agora = "2026-11-15T18:30:00.000Z";
const fibra = (x: Partial<RegistroDeConectividade> = {}) => esquemaConsultaDeFibra.parse({ id: "fibra-1", tipo: "consulta_fibra", prestadora: "Prestadora A", escopo: "endereco", bloco: "", resultado: "disponivel", canal: "site", protocolo: "", consultadoEm: "2026-11-15", registradoEm: agora, ...x });
const medicao = (x: Record<string, unknown> = {}) => esquemaMedicaoNoComodo.parse({ id: "medicao-1", tipo: "medicao", comodo: "Quarto 2", em: agora, rede: "wifi", operadora: null, tecnologia: "wifi_5", metodo: "simet", downloadMbps: 312.4, uploadMbps: null, latenciaMs: 9, chamada: "nao_testada", nota: "", registradoEm: agora, ...x });

describe("três fatos separados", () => {
  it("consulta por endereço não vira confirmação na unidade", () => {
    expect(frasesDaDisponibilidade([fibra()])[0]).toBe("Fibra Prestadora A: disponível segundo a prestadora para o endereço do prédio, consulta de 15/11/2026. Vale para o endereço; a instalação na unidade ainda depende de porta disponível e acesso à infraestrutura do condomínio.");
    expect(frasesDaDisponibilidade([fibra({ escopo: "bloco", bloco: "B", resultado: "consulta_tecnica", protocolo: "123" } as never)])[0]).toBe("Fibra Prestadora A: depende de visita técnica para o bloco B, consulta de 15/11/2026 (protocolo 123).");
  });
  it("medição mostra só o que foi medido, com hora local e rede", () => {
    expect(frasesDaQualidade([medicao()])[0]).toBe("Quarto 2, 15/11/2026, 15:30, Wi-Fi 5 GHz: download 312,4 Mbps, latência 9 ms (SIMET).");
    expect(frasesDaQualidade([medicao({ rede: "movel", tecnologia: "4g", metodo: "chamada", downloadMbps: null, latenciaMs: null, chamada: "falhou" })])[0]).toBe("Quarto 2, 15/11/2026, 15:30, 4G (operadora não informada): chamada falhou (teste de chamada).");
    expect(frasesDaQualidade([medicao({ downloadMbps: null, latenciaMs: null, metodo: "outro_teste" })])[0]).toContain("sem resultado medido");
  });
  it("dado ausente fica nulo, nunca zero; entrada inválida é recusada", () => {
    expect(numeroOuNulo("")).toBeNull();
    expect(numeroOuNulo("12,5")).toBe(12.5);
    expect(() => numeroOuNulo("-3")).toThrow();
    expect(() => numeroOuNulo("abc")).toThrow();
  });
  it("Wi-Fi e rede móvel não se misturam; chamada exige resultado", () => {
    expect(() => medicao({ rede: "movel", tecnologia: "wifi_5" })).toThrow();
    expect(() => medicao({ rede: "wifi", tecnologia: "5g" })).toThrow();
    expect(() => medicao({ metodo: "chamada", chamada: "nao_testada" })).toThrow();
  });
});

describe("o que falta", () => {
  it("sem nada: consultar e medir", () => {
    expect(pendenciasDaConectividade([])).toEqual(["Consultar a fibra de pelo menos uma prestadora para o endereço ou o bloco.", "Medir no cômodo onde você pretende trabalhar (SIMET ou uma chamada), anotando a hora."]);
  });
  it("só Wi-Fi num cômodo, só endereço: pede bloco, rede móvel, upload e segundo cômodo", () => {
    const p = pendenciasDaConectividade([fibra(), medicao({ latenciaMs: null })]);
    expect(p).toHaveLength(4);
    expect(p[0]).toContain("bloco ou a unidade");
  });
  it("completo: nada falta", () => {
    expect(pendenciasDaConectividade([fibra({ escopo: "unidade" } as never), medicao(), medicao({ id: "medicao-2", comodo: "Sala", rede: "movel", tecnologia: "5g", operadora: "Operadora X" })])).toEqual([]);
  });
});

describe("caderno", () => {
  it("cadernos antigos (sem o campo) continuam válidos; com registros, validam", () => {
    expect(esquemaCaderno.safeParse(cadernoVazio()).success).toBe(true);
    expect(esquemaCaderno.safeParse({ ...cadernoVazio(), conectividade: [fibra(), medicao()] }).success).toBe(true);
    expect(esquemaCaderno.safeParse({ ...cadernoVazio(), conectividade: [{ ...medicao(), tecnologia: "4g" }] }).success).toBe(false);
  });
});
