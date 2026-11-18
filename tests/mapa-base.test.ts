// Mapa-base (18/11/2026): os arquivos do piloto (Boa Viagem, Torre, cidade) gerados por
// scripts/dados/construir-mapa-base.mjs e a leitura em src/dados/recife/mapaBase.ts.
import { beforeEach, describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import { gzipSync } from "zlib";
import { METROS_POR_GRAU, UNIDADES_POR_METRO, type PoligonoBase } from "../src/dados/recife/mapaBaseContrato";
import {
  arquivoDaCidade,
  arquivoDoMapaBase,
  arquivosDoMapaBaseParaOQuadro,
  bairrosNaCaixa,
  caixaDoBairro,
  checarArquivoDoBairroRaso,
  codificarPoligonos,
  decodificarArquivoDoBairro,
  decodificarLinhas,
  decodificarPoligonos,
  esquecerMapaBase,
  FONTES_DO_MAPA_BASE,
  INDICE_DO_MAPA_BASE,
  mapaBaseDaCidade,
  mapaBaseDoBairro,
  validarArquivoDaCidade,
  validarArquivoDoBairro,
  type CaixaEmGraus,
} from "../src/dados/recife/mapaBase";
import { ARQUIVOS_DO_MAPA_BASE } from "../src/dados/recife/mapaBaseGerado";
import { DIRETORIO_DO_INDICE } from "../src/dados/recife/publicacaoGerada";

const DADOS = join(__dirname, "..", "src", "dados");
const ler = (c: string): unknown => JSON.parse(readFileSync(join(DADOS, c), "utf8"));
const PILOTO = ["boa-viagem", "torre"];
const GOLDEN = { id: "8001-216", bairro: "boa-viagem" };

function noPlano(origem: readonly [number, number], lon: number, lat: number): [number, number] {
  const kx = METROS_POR_GRAU * Math.cos((origem[1] * Math.PI) / 180) * UNIDADES_POR_METRO;
  return [(lon - origem[0]) * kx, -(lat - origem[1]) * METROS_POR_GRAU * UNIDADES_POR_METRO];
}
function dentro(x: number, y: number, p: PoligonoBase): boolean {
  let d = false;
  for (const a of p.aneis) {
    const n = a.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = a[2 * i]!, yi = a[2 * i + 1]!, xj = a[2 * j]!, yj = a[2 * j + 1]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
    }
  }
  return d;
}
/** Um ponto interior: o meio do maior intervalo numa linha horizontal (a mesma ideia do pipeline). */
function pontoInterior(p: PoligonoBase): [number, number] {
  for (const f of [0.5, 0.37, 0.63, 0.25, 0.75, 0.13, 0.87]) {
    const y = p.caixa[1] + (p.caixa[3] - p.caixa[1]) * f + 0.5;
    const xs: number[] = [];
    for (const a of p.aneis) {
      const n = a.length / 2;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = a[2 * i]!, yi = a[2 * i + 1]!, xj = a[2 * j]!, yj = a[2 * j + 1]!;
        if (yi > y !== yj > y) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
      }
    }
    xs.sort((m, n) => m - n);
    let melhor: [number, number] | null = null, larg = 0;
    for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1]! - xs[i]! > larg) { larg = xs[i + 1]! - xs[i]!; melhor = [(xs[i]! + xs[i + 1]!) / 2, y]; }
    if (melhor) return melhor;
  }
  return [p.aneis[0]![0]!, p.aneis[0]![1]!];
}

beforeEach(() => esquecerMapaBase());

describe("arquivos do piloto", () => {
  it("o piloto e a cidade estão publicados", () => {
    for (const s of PILOTO) expect(arquivoDoMapaBase(s)).toMatch(new RegExp(`^recife/mapa-base/[0-9a-f]{16}/${s}\\.json$`));
    expect(arquivoDaCidade()).toMatch(/^recife\/mapa-base\/[0-9a-f]{16}\/cidade\.json$/);
    expect(arquivoDoMapaBase("bairro-que-nao-existe")).toBeNull();
    expect(arquivoDoMapaBase(null)).toBeNull();
  });

  it.each(PILOTO)("%s: esquema completo e decodificação", (slug) => {
    const a = validarArquivoDoBairro(slug, ler(arquivoDoMapaBase(slug)!));
    const m = decodificarArquivoDoBairro(a);
    expect(m.divisa.slug).toBe(slug);
    expect(m.divisa.partes.length).toBeGreaterThan(0);
    expect(m.quadras.length).toBeGreaterThan(100);
    expect(m.lotes.length).toBe(a.lotes.pavimentos.length);
    expect(m.ruas.length).toBe(a.ruas.nome.length);
    for (const r of m.ruas) expect(r.nome.trim()).not.toBe("");
    for (const q of m.quadras) for (const anel of q.aneis) expect(anel.length).toBeGreaterThanOrEqual(6);
    for (const r of m.ruas) for (const l of r.linhas) expect(l.length).toBeGreaterThanOrEqual(4);
  });

  it("cidade: esquema completo, as 94 divisas, oceano e avenidas", () => {
    validarArquivoDaCidade(ler(arquivoDaCidade()!));
    const c = mapaBaseDaCidade()!;
    expect(c.bairros).toHaveLength(94);
    expect(new Set(c.bairros.map((b) => b.slug)).size).toBe(94);
    expect(c.agua.some((w) => w.tipo === "oceano")).toBe(true);
    expect(c.vias.every((v) => v.avenida || v.corredor || v.perimetral)).toBe(true);
    expect(c.vias.some((v) => v.nome === "Av. Boa Viagem")).toBe(true);
  });

  it("nenhuma chave proibida nem DSQFL nos arquivos", () => {
    const proibidas = /"(dsqfl|dsq|endereco|endereço|nmendcomp|nmedificacao|nome_edificacao|endereco_completo|inscricao|seqimovel|sequencial)"/i;
    for (const c of [...Object.values(ARQUIVOS_DO_MAPA_BASE), arquivoDaCidade()!]) {
      const texto = readFileSync(join(DADOS, c), "utf8");
      expect(texto).not.toMatch(proibidas);
      expect(texto).not.toMatch(/geradoEm|C:\\\\|\/Users\//);
    }
    // Nenhum DSQFL do índice (14 dígitos) aparece no arquivo de Boa Viagem.
    const ix = ler(`recife/${DIRETORIO_DO_INDICE}/boa-viagem.json`) as { edificios: { dsqfl: string | null }[] };
    const texto = readFileSync(join(DADOS, arquivoDoMapaBase("boa-viagem")!), "utf8");
    for (const e of ix.edificios.slice(0, 200)) if (e.dsqfl) expect(texto.includes(`"${e.dsqfl}"`) || texto.includes(e.dsqfl)).toBe(false);
  });

  it("peso gzip de cada arquivo no teto de 250 kB", () => {
    for (const c of [...Object.values(ARQUIVOS_DO_MAPA_BASE), arquivoDaCidade()!]) {
      expect(gzipSync(readFileSync(join(DADOS, c)), { level: 9 }).length).toBeLessThanOrEqual(250_000);
    }
  });

  it("o índice usado é o índice ativo", () => {
    expect(INDICE_DO_MAPA_BASE).toBe(DIRETORIO_DO_INDICE);
  });

  it("fontes com recurso, licença ODbL e sha256 do bruto", () => {
    expect(FONTES_DO_MAPA_BASE.map((f) => f.recurso)).toEqual(expect.arrayContaining(["c41ee0d0-bb33-4380-8809-2e9082d79ab0", "a961bf64-f6fe-4b1d-95c5-456bf0d01a31", "054f05a9-a113-47e0-a46f-720e4828eaf2"]));
    for (const f of FONTES_DO_MAPA_BASE) {
      expect(f.licenca).toBe("odc-odbl");
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(f.bytes).toBeGreaterThan(0);
    }
  });

  it("caixas em graus envolvem a divisa de cada bairro", () => {
    for (const s of PILOTO) {
      const c = caixaDoBairro(s)!;
      expect(c[0]).toBeLessThan(c[2]);
      expect(c[1]).toBeLessThan(c[3]);
      expect(c[0]).toBeGreaterThan(-35.1);
      expect(c[2]).toBeLessThan(-34.8);
      const m = mapaBaseDoBairro(s)!;
      const [x0, y0] = noPlano(m.origem, c[0], c[3]);
      const [x1, y1] = noPlano(m.origem, c[2], c[1]);
      for (const p of m.divisa.partes) {
        expect(p.caixa[0]).toBeGreaterThanOrEqual(x0 - 2);
        expect(p.caixa[1]).toBeGreaterThanOrEqual(y0 - 2);
        expect(p.caixa[2]).toBeLessThanOrEqual(x1 + 2);
        expect(p.caixa[3]).toBeLessThanOrEqual(y1 + 2);
      }
    }
  });
});

describe("conteúdo", () => {
  it("o lote do Golden Tower (8001-216) existe, é do índice e tem os pavimentos do índice", () => {
    const ix = ler(`recife/${DIRETORIO_DO_INDICE}/${GOLDEN.bairro}.json`) as { edificios: { id: string; centro: [number, number]; pavimentos: number | null }[] };
    const e = ix.edificios.find((x) => x.id === GOLDEN.id)!;
    const m = mapaBaseDoBairro(GOLDEN.bairro)!;
    const [x, y] = noPlano(m.origem, e.centro[0], e.centro[1]);
    const lotes = m.lotes.filter((l) => dentro(x, y, l));
    expect(lotes).toHaveLength(1);
    expect(lotes[0]!.noIndice).toBe(true);
    expect(lotes[0]!.pavimentos).toBe(e.pavimentos);
    expect(lotes[0]!.quadra).toBeGreaterThanOrEqual(0);
  });

  it("a rua 8001 existe em Boa Viagem, com nome", () => {
    const r = mapaBaseDoBairro("boa-viagem")!.ruas.find((x) => x.codigo === 8001);
    expect(r).toBeDefined();
    expect(r!.nome.length).toBeGreaterThan(3);
    expect(r!.linhas.length).toBeGreaterThan(0);
  });

  it("avenidas e corredores marcados; nenhum nome 'Av ' sem ponto", () => {
    const ruas = mapaBaseDoBairro("boa-viagem")!.ruas;
    expect(ruas.find((r) => r.nome === "Av. Boa Viagem")?.avenida).toBe(true);
    expect(ruas.some((r) => r.corredor)).toBe(true);
    expect(ruas.some((r) => /^Av /.test(r.nome))).toBe(false);
  });

  it.each(PILOTO)("%s: todo lote com quadra >= 0 tem um ponto interior dentro da quadra", (slug) => {
    const m = mapaBaseDoBairro(slug)!;
    let fora = 0;
    for (const l of m.lotes) {
      if (l.quadra < 0) continue;
      const [x, y] = pontoInterior(l);
      if (!dentro(x, y, m.quadras[l.quadra]!)) fora++;
    }
    expect(fora).toBe(0);
    expect(m.lotes.filter((l) => l.quadra >= 0).length / m.lotes.length).toBeGreaterThan(0.95);
  });

  it("Boa Viagem tem água do oceano, cortada, e praças", () => {
    const m = mapaBaseDoBairro("boa-viagem")!;
    expect(m.agua.some((w) => w.tipo === "oceano")).toBe(true);
    expect(m.pracas.length).toBeGreaterThan(0);
    expect(m.lotes.some((l) => l.noIndice)).toBe(true);
    expect(m.lotes.some((l) => l.pavimentos === null)).toBe(true);
  });
});

describe("codificação", () => {
  it("ida e volta de polígonos num exemplo feito à mão", () => {
    const quadrado = [0, 0, 100, 0, 100, 100, 0, 100];
    const furo = [20, 20, 40, 20, 40, 40];
    const outro = [-50, 300, -10, 300, -10, 340];
    const g = codificarPoligonos([[quadrado, furo], [outro]]);
    expect(g).toEqual([2, 4, 0, 0, 100, 0, 0, 100, -100, 0, 3, 20, -80, 20, 0, 0, 20, 1, 3, -90, 260, 40, 0, 0, 40]);
    const p = decodificarPoligonos(g, 2, "teste");
    expect(p.map((x) => x.aneis.map((a) => [...a]))).toEqual([[quadrado, furo], [outro]]);
    expect(p[0]!.caixa).toEqual([0, 0, 100, 100]);
    expect(p[1]!.caixa).toEqual([-50, 300, -10, 340]);
    expect(decodificarPoligonos(g, null, "teste")).toHaveLength(2);
  });

  it("linhas: ida e volta e recusa de lista truncada ou com sobra", () => {
    const g = [1, 2, 5, 5, 10, 0, 1, 3, 0, 0, 1, 1, 1, 1];
    const l = decodificarLinhas(g, 2, "teste");
    expect(l.map((r) => r.map((x) => [...x]))).toEqual([[[5, 5, 15, 5]], [[15, 5, 16, 6, 17, 7]]]);
    expect(() => decodificarLinhas(g.slice(0, -1), 2, "teste")).toThrow(/truncada/);
    expect(() => decodificarLinhas([...g, 0], 2, "teste")).toThrow(/sobrando/);
    expect(() => decodificarPoligonos([1, 2, 0, 0, 1, 1], 1, "teste")).toThrow(/mínimo 3/);
  });

  it("recusa arquivo de outra versão, de outro bairro ou com colunas desencontradas", () => {
    const a = ler(arquivoDoMapaBase("torre")!) as Record<string, unknown>;
    expect(() => checarArquivoDoBairroRaso("torre", { ...a, versao: 2 })).toThrow(/versão 2/);
    expect(() => checarArquivoDoBairroRaso("boa-viagem", a)).toThrow(/diz ser do bairro "torre"/);
    const lotes = a.lotes as Record<string, unknown[]>;
    expect(() => checarArquivoDoBairroRaso("torre", { ...a, lotes: { ...lotes, quadra: lotes.quadra!.slice(1) } })).toThrow(/coluna quadra/);
  });

  it("lotes preguiçosos: só decodificados no primeiro acesso", () => {
    const a = validarArquivoDoBairro("torre", ler(arquivoDoMapaBase("torre")!));
    let lidos = 0;
    const g = a.lotes.g;
    const espiao = new Proxy(g, { get(t, k, r) { if (k === "length") lidos++; return Reflect.get(t, k, r) as unknown; } });
    const m = decodificarArquivoDoBairro({ ...a, lotes: { ...a.lotes, g: espiao } });
    expect(m.quadras.length).toBeGreaterThan(0);
    expect(lidos).toBe(0);
    const primeiro = m.lotes;
    expect(lidos).toBeGreaterThan(0);
    expect(m.lotes).toBe(primeiro);
  });

  it("decodifica uma vez por arquivo", () => {
    expect(mapaBaseDoBairro("torre")).toBe(mapaBaseDoBairro("torre"));
    expect(mapaBaseDaCidade()).toBe(mapaBaseDaCidade());
    expect(mapaBaseDoBairro("bairro-que-nao-existe")).toBeNull();
  });
});

describe("carga em dois tempos", () => {
  /** Caixa em graus de `lado` metros em volta de um ponto. */
  const quadro = (lon: number, lat: number, lado: number): CaixaEmGraus => {
    const dLat = lado / 2 / METROS_POR_GRAU, dLon = lado / 2 / (METROS_POR_GRAU * Math.cos((lat * Math.PI) / 180));
    return [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
  };
  const GOLDEN_CENTRO = [-34.907539, -8.141503] as const;

  it("gaveta no meio de Boa Viagem: só o arquivo do bairro, completo", () => {
    const r = arquivosDoMapaBaseParaOQuadro({ bairro: "boa-viagem", caixa: quadro(GOLDEN_CENTRO[0], GOLDEN_CENTRO[1], 450) });
    expect(r).toEqual({ arquivos: [arquivoDoMapaBase("boa-viagem")], completo: true });
  });

  it("quadro de 2,6 km saindo da borda: o bairro, os vizinhos com arquivo e a cidade", () => {
    const caixa = quadro(-34.9, -8.11, 2600);
    const r = arquivosDoMapaBaseParaOQuadro({ bairro: "boa-viagem", caixa });
    expect(r.completo).toBe(true);
    expect(r.arquivos[0]).toBe(arquivoDoMapaBase("boa-viagem"));
    expect(r.arquivos.at(-1)).toBe(arquivoDaCidade());
    for (const s of bairrosNaCaixa(caixa)) expect(r.arquivos).toContain(arquivoDoMapaBase(s));
    expect(new Set(r.arquivos).size).toBe(r.arquivos.length);
  });

  it("bairro sem arquivo, ou sem bairro: os bairros na caixa e a cidade direto", () => {
    const caixa = quadro(-34.95, -8.05, 1000);
    const esperado = { arquivos: [...bairrosNaCaixa(caixa).map((s) => arquivoDoMapaBase(s)!), arquivoDaCidade()!], completo: true };
    expect(arquivosDoMapaBaseParaOQuadro({ bairro: "bairro-que-nao-existe", caixa })).toEqual(esperado);
    expect(arquivosDoMapaBaseParaOQuadro({ bairro: null, caixa })).toEqual(esperado);
  });

  it("bairrosNaCaixa: Torre perto da Torre, nenhum longe do Recife", () => {
    const t = caixaDoBairro("torre")!;
    expect(bairrosNaCaixa(t)).toContain("torre");
    expect(bairrosNaCaixa([-40, -10, -39.9, -9.9])).toEqual([]);
  });
});
