import { describe, expect, test } from "@jest/globals";
import { CORES_CLARO, CORES_ESCURO, TOQUE_MINIMO } from "../src/tema/tokens";
import { auditarDocumentoVereda, validarCnm16 } from "../src/nucleo/documentos/auditorDocumental";
import { validarNumeroProcessoCnj } from "../src/nucleo/documentos/datajudClient";
import { vincularAnuncioFellegiSunter } from "../src/nucleo/resolucao/fellegiSunter";
import { sanearTextoCamada1 } from "../src/dados/cidadao/tradutorCidadao";

function luminanciaRelativa(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrasteWcag(hexA: string, hexB: string): number {
  const l1 = luminanciaRelativa(hexA);
  const l2 = luminanciaRelativa(hexB);
  const maior = Math.max(l1, l2);
  const menor = Math.min(l1, l2);
  return (maior + 0.05) / (menor + 0.05);
}

describe("Milestone 8 — Acessibilidade WCAG AA, Alvos >= 48dp e Resiliência a Entradas Corrompidas", () => {
  test("Contraste WCAG AA >= 4.5:1 para texto normal e >= 3.0:1 para destaque, com TOQUE_MINIMO >= 48", () => {
    expect(TOQUE_MINIMO).toBeGreaterThanOrEqual(48);

    // Tema claro (Papel #F2EBDD & Superfície #FFFFFF)
    expect(contrasteWcag(CORES_CLARO["cor-texto"], CORES_CLARO["cor-fundo"])).toBeGreaterThanOrEqual(4.5);
    expect(contrasteWcag(CORES_CLARO["cor-texto-apoio"], CORES_CLARO["cor-fundo"])).toBeGreaterThanOrEqual(4.5);
    expect(contrasteWcag(CORES_CLARO["cor-barro-texto"], CORES_CLARO["cor-fundo"])).toBeGreaterThanOrEqual(4.5);
    expect(contrasteWcag(CORES_CLARO["cor-azul-cadastral"], CORES_CLARO["cor-superficie"])).toBeGreaterThanOrEqual(4.5);
    expect(contrasteWcag(CORES_CLARO["cor-salvia-escura"], CORES_CLARO["cor-fundo"])).toBeGreaterThanOrEqual(4.5);

    // Tema escuro (painel de visita)
    expect(contrasteWcag(CORES_ESCURO["cor-texto"], CORES_ESCURO["cor-fundo"])).toBeGreaterThanOrEqual(4.5);
    expect(contrasteWcag(CORES_ESCURO["cor-texto-apoio"], CORES_ESCURO["cor-fundo"])).toBeGreaterThanOrEqual(4.5);
    expect(contrasteWcag(CORES_ESCURO["cor-acao"], CORES_ESCURO["cor-fundo"])).toBeGreaterThanOrEqual(3.0);
  });

  test("Resiliência contra entradas malformadas, NaN, JSON corrompido e documentos vazios/truncados", () => {
    const entradasEstranhas = [
      "",
      "   ",
      "\u0000\u0007\ufffd",
      "999999.9.9999999-99",
      "null",
      "🚀 Região é cara e perigosa / vale a pena caixão!",
      "A".repeat(5000),
    ];

    for (const s of entradasEstranhas) {
      expect(() => validarCnm16(s)).not.toThrow();
      expect(() => validarNumeroProcessoCnj(s)).not.toThrow();
      const clean = sanearTextoCamada1(s);
      expect(clean).not.toMatch(/caix[ãa]o|vale a pena/i);
    }

    const audVazia = auditarDocumentoVereda({ docId: "fuzz-empty", paginas: [] });
    expect(audVazia.estadoAusencia).toBe("sem_leitura_publicada");

    const audTrunc = auditarDocumentoVereda({
      docId: "fuzz-trunc",
      paginas: [{ pagina: 1, texto: "\u0000\ufffd ??? R-1" }],
      dataEmissaoCertidaoIso: "data-invalida",
    });
    expect(audTrunc.validadeCertidao30Dias.estado).toBe("faltando");

    expect(() =>
      vincularAnuncioFellegiSunter(
        {
          adId: "fuzz-ad",
          url: "invalid",
          portal: "outro",
          bairroSlug: null,
          logradouroTexto: null,
          numeroTexto: null,
          nomeEdificioTexto: null,
          areaM2: Number.NaN,
          quartos: null,
          vagas: null,
          andar: null,
          precoReais: null,
          lon: Number.NaN,
          lat: Number.NaN,
        },
        [],
      ),
    ).not.toThrow();

  });
});
