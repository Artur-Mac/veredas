import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import { BAIRROS_DO_RECIFE } from "../src/dados/recife/bairros";
import {
  ATRIBUICAO_DA_SEGURANCA,
  POUCOS_MORADORES,
  posicaoDaTaxa,
  segurancaDoBairro,
  validarSeguranca,
} from "../src/dados/recife/seguranca";

// "Segurança no bairro" (hub, 18/11/2026): taxa por 1.000 moradores, vizinhos de divisa, sem ranking nem nota.
const RAIZ = join(__dirname, "..");
const ler = (rel: string) => JSON.parse(readFileSync(join(RAIZ, rel), "utf-8")) as unknown;
const populacao = ler("src/dados/recife/populacao-bairros.json") as { totalMunicipio: number; populacao: Record<string, number> };

describe("população por bairro (Censo 2022)", () => {
  it("os 94 bairros de bairros.ts, somando a população oficial do Recife", () => {
    expect(Object.keys(populacao.populacao).sort()).toEqual(BAIRROS_DO_RECIFE.map((b) => b.slug).sort());
    const soma = Object.values(populacao.populacao).reduce((s, n) => s + n, 0);
    expect(soma).toBe(populacao.totalMunicipio);
    // Censo 2022: Recife tem 1.488.920 moradores.
    expect(soma).toBe(1488920);
  });
});

describe("segurancaDoBairro", () => {
  it("taxa = total × 1.000 / moradores, com uma casa", () => {
    const r = segurancaDoBairro("boa-viagem")!;
    expect(r.bairro.total).not.toBeNull();
    const esperado = Math.round(((r.bairro.total! * 1000) / populacao.populacao["boa-viagem"]!) * 10) / 10;
    expect(r.bairro.taxaPorMil).toBe(esperado);
    expect(r.atribuicao).toBe(ATRIBUICAO_DA_SEGURANCA);
  });

  it("vizinhos de divisa em ordem alfabética (nunca pela taxa) e Paissandu fora de Madalena", () => {
    const r = segurancaDoBairro("madalena")!;
    const nomes = r.vizinhos.map((v) => v.nome);
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, "pt-BR")));
    expect(r.vizinhos.map((v) => v.slug)).not.toContain("paissandu");
    expect(r.vizinhos.map((v) => v.slug)).toEqual(expect.arrayContaining(["torre", "gracas", "derby"]));
  });

  it("divisa é simétrica: se A é vizinho de B, B é vizinho de A", () => {
    for (const b of BAIRROS_DO_RECIFE) {
      const r = segurancaDoBairro(b.slug);
      if (!r) continue;
      for (const v of r.vizinhos) {
        const volta = segurancaDoBairro(v.slug);
        if (volta) expect([b.slug, v.slug, volta.vizinhos.some((x) => x.slug === b.slug)]).toEqual([b.slug, v.slug, true]);
      }
    }
  });

  it("bairro sem janela de 12 meses não tem total nem taxa (não comparável)", () => {
    const r = segurancaDoBairro("recife")!;
    expect(r.bairro.total).toBeNull();
    expect(r.bairro.taxaPorMil).toBeNull();
    expect(r.posicao).toBeNull();
  });

  it("marca poucos moradores, onde a taxa exagera", () => {
    const r = segurancaDoBairro("santo-antonio")!;
    expect(populacao.populacao["santo-antonio"]!).toBeLessThan(POUCOS_MORADORES);
    expect(r.bairro.poucosMoradores).toBe(true);
    expect(segurancaDoBairro("boa-viagem")!.bairro.poucosMoradores).toBe(false);
  });

  it("bairro sem dado (pendência da coleta) ou desconhecido devolve null", () => {
    expect(segurancaDoBairro("pau-ferro")).toBeNull();
    expect(segurancaDoBairro("nao-existe")).toBeNull();
    expect(segurancaDoBairro(null)).toBeNull();
  });

  it("posição: faixa de 15% em volta da mediana conta como perto", () => {
    expect(posicaoDaTaxa(115, 100)).toBe("perto");
    expect(posicaoDaTaxa(116, 100)).toBe("acima");
    expect(posicaoDaTaxa(84, 100)).toBe("abaixo");
    expect(posicaoDaTaxa(null, 100)).toBeNull();
  });

  it("a mediana do Recife é calculada dos próprios dados", () => {
    const { mediana } = validarSeguranca(ler("src/dados/recife/crime/ocorrencias.json"), populacao);
    expect(mediana).toBeGreaterThan(0);
    expect(segurancaDoBairro("gracas")!.medianaRecife).toBe(mediana);
  });
});

describe("frases do cartão", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { frasesDaSeguranca } = require("../src/componentes/dossie-v1/SegurancaNoBairro") as typeof import("../src/componentes/dossie-v1/SegurancaNoBairro");

  it("posição contra a mediana, período e principais, sem veredito", () => {
    for (const b of BAIRROS_DO_RECIFE) {
      const s = segurancaDoBairro(b.slug);
      if (!s) continue;
      const texto = Object.values(frasesDaSeguranca(s)).filter(Boolean).join(" ").toLowerCase();
      for (const proibida of ["seguro", "perigos", "violento", "ranking", "nota "]) expect([b.slug, texto.includes(proibida)]).toEqual([b.slug, false]);
    }
    const f = frasesDaSeguranca(segurancaDoBairro("boa-viagem")!);
    expect(f.periodo).toBe("de nov/2025 a out/2026");
    expect(f.posicao).toMatch(/mediana dos bairros do Recife/);
    expect(f.principais).not.toMatch(/outros/i);
  });

  it("avisa quando o bairro tem poucos moradores", () => {
    expect(frasesDaSeguranca(segurancaDoBairro("santo-antonio")!).poucosMoradores).toMatch(/447 moradores/);
    expect(frasesDaSeguranca(segurancaDoBairro("boa-viagem")!).poucosMoradores).toBeNull();
  });
});
