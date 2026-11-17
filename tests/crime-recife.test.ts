import { describe, expect, it } from "@jest/globals";
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { z } from "zod";
import { BAIRROS_COBERTOS, BAIRROS_DO_RECIFE } from "../src/dados/recife/bairros";

// Confere os dois arquivos gerados por scripts/dados/coletar-crime-recife.mjs (contagens de ocorrência por bairro,
// registros da SDS-PE compilados pelo Crime Brasil) e o parser do script, com uma fixture SINTÉTICA em
// tests/fixtures/. Os números dos JSONs são dado coletado; nada aqui é inventado, exceto a fixture.

const RAIZ = join(__dirname, "..");
const SCRIPT = join(RAIZ, "scripts", "dados", "coletar-crime-recife.mjs");
const FIXTURE = join(__dirname, "fixtures", "crime-bairro-sintetico.html");
const FIXTURE_HISTORICO = join(__dirname, "fixtures", "crime-bairro-historico-sintetico.html");
const DIR_CRIME = join(RAIZ, "src", "dados", "recife", "crime");

const ATRIBUICAO = "registros da SDS-PE compilados pelo Crime Brasil";
const PREFIXO_URL = "https://crimebrasil.com.br/bairro/pe/recife/";
const CARIMBO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

function parsear(arquivo: string): unknown {
  return JSON.parse(execFileSync(process.execPath, [SCRIPT, "--parsear", arquivo], { encoding: "utf-8" })) as unknown;
}

function parsearEsperandoErro(html: string): string {
  const arquivo = join(mkdtempSync(join(tmpdir(), "crime-fixture-")), "pagina.html");
  writeFileSync(arquivo, html);
  try {
    execFileSync(process.execPath, [SCRIPT, "--parsear", arquivo], { encoding: "utf-8", stdio: "pipe" });
  } catch (erro) {
    return String((erro as { stderr?: string }).stderr ?? "");
  }
  throw new Error("o parser deveria ter falhado");
}

/** Meses entre dois AAAA-MM, contando os dois extremos. */
function mesesDaJanela(inicio: string, fim: string): number {
  const [ai = NaN, mi = NaN] = inicio.split("-").map(Number);
  const [af = NaN, mf = NaN] = fim.split("-").map(Number);
  return (af - ai) * 12 + (mf - mi) + 1;
}

describe("parser da página de bairro (fixture sintética)", () => {
  const html = readFileSync(FIXTURE, "utf-8");

  it("lê período, total e contagem por natureza", () => {
    expect(parsear(FIXTURE)).toEqual({
      bairro: "Bairro Sintético",
      cidade: "Recife",
      janela: "12-meses",
      periodo: { inicio: "2030-01", fim: "2030-12" },
      total: 1234,
      naturezas: [
        { natureza: "Natureza Alfa", ocorrencias: 617 },
        { natureza: "Natureza Beta & Gama", ocorrencias: 370 },
        { natureza: "Outros tipos", ocorrencias: 247 },
      ],
      atualizadoEm: "2030-12-15",
      licencaDeclaradaPeloSite: "https://exemplo.invalid/licenca",
    });
  });

  it("bairro sem registro recente: lê o período inteiro, sem inventar datas", () => {
    expect(parsear(FIXTURE_HISTORICO)).toEqual({
      bairro: "Bairro Histórico",
      cidade: "Recife",
      janela: "todo-o-periodo",
      periodo: null,
      total: 30,
      naturezas: [
        { natureza: "Natureza Alfa", ocorrencias: 18 },
        { natureza: "Natureza Beta", ocorrencias: 12 },
      ],
      atualizadoEm: null,
      licencaDeclaradaPeloSite: "https://exemplo.invalid/licenca",
    });
    const historico = readFileSync(FIXTURE_HISTORICO, "utf-8");
    // O rótulo do total tem de combinar com a janela declarada; sem o aviso de "sem registro recente" a página é recusada.
    expect(parsearEsperandoErro(historico.replace("não tem ocorrências registradas nos últimos 12 meses", "tem ocorrências"))).toContain("temporalCoverage");
    expect(parsearEsperandoErro(historico.replace("Ocorrências (todo o período)", "Ocorrências no período"))).toContain("rótulo do total");
  });

  it("a fixture fecha: total igual à soma das naturezas", () => {
    const lido = parsear(FIXTURE) as { total: number; naturezas: { ocorrencias: number }[] };
    expect(lido.naturezas.reduce((s, n) => s + n.ocorrencias, 0)).toBe(lido.total);
  });

  it("o script passivo de detecção da Cloudflare não é tratado como erro nem como dado", () => {
    expect(html).toContain("challenge-platform");
    expect(() => parsear(FIXTURE)).not.toThrow();
  });

  it("recusa página sem o JSON-LD Dataset, sem total e sem contagens", () => {
    expect(parsearEsperandoErro(html.replace('"@type":"Dataset"', '"@type":"Outro"'))).toContain("Dataset");
    expect(parsearEsperandoErro(html.replace("Ocorrências no período", "Outra coisa"))).toContain("total");
    expect(parsearEsperandoErro(html.replace(/<b>/g, "<i>").replace(/<\/b>/g, "</i>"))).toContain("contagem por natureza");
  });

  it("recusa contagem ilegível, listas que discordam e janela inválida; nunca vira zero", () => {
    expect(parsearEsperandoErro(html.replace("<span>370</span>", "<span>n/d</span>"))).toContain("ilegível");
    expect(parsearEsperandoErro(html.replace("<span>370</span>", "<span>371</span>"))).toContain("difere");
    expect(parsearEsperandoErro(html.replace("2030-01/2030-12", "2030-13/2030-12"))).toContain("temporalCoverage");
  });
});

// ——— Arquivos gravados ————————————————————————————————————————————————————————————

const esquemaPeriodo = z.strictObject({
  inicio: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  fim: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

// strictObject: qualquer campo a mais (taxa, ranking, nota, classificação) reprova.
const camposComuns = {
  nome: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  papel: z.enum(["alvo", "vizinho", "outro"]),
  /** "todo-o-periodo": a página não tem registro nos últimos 12 meses e só mostra o período inteiro, sem datas. */
  janela: z.enum(["12-meses", "todo-o-periodo"]),
  periodo: esquemaPeriodo.nullable(),
  total: z.number().int().min(0),
  naturezas: z.array(z.strictObject({ natureza: z.string().min(1), ocorrencias: z.number().int().min(0) })).min(1),
  url: z.string().startsWith(PREFIXO_URL),
};
const janelaCoerente = (b: { janela: string; periodo: unknown }) => (b.janela === "12-meses") === (b.periodo !== null);

const esquemaBairro = z.strictObject({ ...camposComuns, divisaComAlvos: z.array(z.string()) }).refine(janelaCoerente, "janela e período incoerentes");

/** Rótulo do site que não é um dos 94 bairros oficiais: não tem divisa calculada nem grafia de bairros.ts. */
const esquemaForaDaLista = z.strictObject({ ...camposComuns, motivo: z.string().min(1) }).refine(janelaCoerente, "janela e período incoerentes");

const esquemaOcorrencias = z.strictObject({
  geradoEm: z.string().regex(CARIMBO),
  atribuicao: z.literal(ATRIBUICAO),
  periodo: esquemaPeriodo,
  bairros: z.array(esquemaBairro).min(6),
  foraDaListaOficial: z.array(esquemaForaDaLista),
});

const esquemaMeta = z.strictObject({
  geradoEm: z.string().regex(CARIMBO),
  fontes: z.tuple([
    z.strictObject({
      chave: z.literal("crime_sds_pe"),
      nome: z.string(),
      fontePrimaria: z.string().startsWith("SDS-PE"),
      compiladoPor: z.literal("Crime Brasil"),
      atribuicao: z.literal(ATRIBUICAO),
      licenca: z.literal("não declarada pela SDS-PE"),
      url: z.string().url(),
      urlMunicipio: z.string().url(),
      urls: z.array(z.string().startsWith(PREFIXO_URL)).min(6),
      coletadoEm: z.string().regex(CARIMBO),
      modificadoEm: z.string().nullable(),
      periodo: esquemaPeriodo,
      paginasLidas: z.number().int().min(6),
      registrosLidos: z.number().int().min(0),
      acessoAutomatizado: z.strictObject({ robotsTxt: z.string(), termos: z.string(), requisicoes: z.string() }),
      licencaDeclaradaPeloCompilador: z.string().nullable(),
      limitacoes: z.array(z.string()).min(5),
      pendencias: z.array(z.strictObject({ slug: z.string(), nome: z.string(), motivo: z.string() })),
    }),
    z.strictObject({
      chave: z.literal("bairros_malha"),
      nome: z.string(),
      orgao: z.string(),
      licenca: z.literal("ODbL"),
      url: z.string().url(),
      recursos: z.array(z.string()).min(1),
      modificadoEm: z.string().nullable(),
      consultadoEm: z.string(),
      registrosLidos: z.literal(94),
      colunasUsadas: z.array(z.string()).min(1),
      criterioDeDivisa: z.string(),
    }),
  ]),
});

const ocorrencias = esquemaOcorrencias.parse(JSON.parse(readFileSync(join(DIR_CRIME, "ocorrencias.json"), "utf-8")));
const meta = esquemaMeta.parse(JSON.parse(readFileSync(join(DIR_CRIME, "meta.json"), "utf-8")));
const fonte = meta.fontes[0];

describe("src/dados/recife/crime/ocorrencias.json", () => {
  it("todo bairro (e todo rótulo fora da lista): total é igual à soma das naturezas", () => {
    for (const b of [...ocorrencias.bairros, ...ocorrencias.foraDaListaOficial]) {
      const soma = b.naturezas.reduce((s, n) => s + n.ocorrencias, 0);
      expect({ slug: b.slug, total: b.total }).toEqual({ slug: b.slug, total: soma });
    }
  });

  it("cada bairro tem a grafia e o slug de bairros.ts, sem repetição", () => {
    const slugs = new Set<string>();
    for (const b of ocorrencias.bairros) {
      const oficial = BAIRROS_DO_RECIFE.find((o) => o.slug === b.slug);
      expect(oficial).toBeDefined();
      expect(b.nome).toBe(oficial?.nome);
      expect(slugs.has(b.slug)).toBe(false);
      slugs.add(b.slug);
      // A URL usa o slug do site: o de bairros.ts ou um dos aliases (Poço da Panela).
      const slugNoSite = b.url.slice(PREFIXO_URL.length);
      expect([b.slug, ...(oficial?.aliases ?? [])]).toContain(slugNoSite);
    }
  });

  it("os cinco bairros da v1 são alvos; todo vizinho faz divisa com pelo menos um alvo", () => {
    const alvos = ocorrencias.bairros.filter((b) => b.papel === "alvo").map((b) => b.slug);
    expect(alvos).toEqual([...BAIRROS_COBERTOS]);
    for (const b of ocorrencias.bairros) {
      for (const a of b.divisaComAlvos) {
        expect(alvos).toContain(a);
        expect(a).not.toBe(b.slug);
      }
      if (b.papel === "vizinho") expect(b.divisaComAlvos.length).toBeGreaterThan(0);
      if (b.papel === "outro") expect(b.divisaComAlvos).toEqual([]);
    }
  });

  it("os 94 bairros de bairros.ts estão no JSON ou em pendencias, nunca nos dois nem em nenhum", () => {
    const noJson = new Set(ocorrencias.bairros.map((b) => b.slug));
    const pendentes = new Set(fonte.pendencias.map((p) => p.slug));
    for (const o of BAIRROS_DO_RECIFE) expect([o.slug, noJson.has(o.slug), pendentes.has(o.slug)]).toEqual([o.slug, !pendentes.has(o.slug), !noJson.has(o.slug)]);
    expect(noJson.size + pendentes.size).toBe(BAIRROS_DO_RECIFE.length);
  });

  it("naturezas sem repetição dentro do bairro", () => {
    for (const b of [...ocorrencias.bairros, ...ocorrencias.foraDaListaOficial]) {
      const nomes = b.naturezas.map((n) => n.natureza.toLowerCase());
      expect(new Set(nomes).size).toBe(nomes.length);
    }
  });

  it("janela de 12 meses, igual em todo bairro que tem janela e no cabeçalho", () => {
    expect(mesesDaJanela(ocorrencias.periodo.inicio, ocorrencias.periodo.fim)).toBe(12);
    for (const b of [...ocorrencias.bairros, ...ocorrencias.foraDaListaOficial]) {
      if (b.janela === "12-meses") expect(b.periodo).toEqual(ocorrencias.periodo);
      else expect(b.periodo).toBeNull();
    }
  });

  it("bairro sem janela de 12 meses é declarado nas limitações e nunca entra na soma de registros", () => {
    const semJanela = [...ocorrencias.bairros, ...ocorrencias.foraDaListaOficial].filter((b) => b.janela !== "12-meses");
    const limitacoes = fonte.limitacoes.join(" ");
    for (const b of semJanela) expect(limitacoes).toContain(b.slug);
  });

  it("rótulos fora da lista oficial: slug que não é de bairros.ts nem alias, sem repetir bairro", () => {
    const oficiais = new Set(BAIRROS_DO_RECIFE.flatMap((o) => [o.slug, ...(o.aliases ?? [])]));
    const noJson = new Set(ocorrencias.bairros.map((b) => b.slug));
    for (const r of ocorrencias.foraDaListaOficial) {
      expect(oficiais.has(r.slug)).toBe(false);
      expect(noJson.has(r.slug)).toBe(false);
      expect(r.url).toBe(PREFIXO_URL + r.slug);
    }
  });
});

describe("src/dados/recife/crime/meta.json", () => {
  it("fonte primária, compilador, licença e atribuição", () => {
    expect(fonte.fontePrimaria).toContain("SDS-PE");
    expect(fonte.compiladoPor).toBe("Crime Brasil");
    expect(fonte.licenca).toBe("não declarada pela SDS-PE");
    expect(fonte.atribuicao).toBe(ATRIBUICAO);
  });

  it("combina com o ocorrencias.json: período, páginas, URLs e registros", () => {
    expect(fonte.periodo).toEqual(ocorrencias.periodo);
    const todos = [...ocorrencias.bairros, ...ocorrencias.foraDaListaOficial];
    expect(fonte.paginasLidas).toBe(todos.length);
    expect(fonte.urls).toEqual(todos.map((b) => b.url));
    expect(fonte.registrosLidos).toBe(todos.filter((b) => b.janela === "12-meses").reduce((s, b) => s + b.total, 0));
    expect(fonte.coletadoEm).toBe(ocorrencias.geradoEm);
  });

  it("declara as limitações que o app não pode esconder", () => {
    const texto = fonte.limitacoes.join(" ").toLowerCase();
    for (const termo of ["contagem bruta", "subnotificação", "coordenada", "sem bairro"]) expect(texto).toContain(termo);
  });

  it("pendências apontam bairros que existem em bairros.ts e não estão no JSON", () => {
    for (const p of fonte.pendencias) {
      expect(BAIRROS_DO_RECIFE.some((o) => o.slug === p.slug)).toBe(true);
      expect(ocorrencias.bairros.some((b) => b.slug === p.slug)).toBe(false);
    }
  });
});
