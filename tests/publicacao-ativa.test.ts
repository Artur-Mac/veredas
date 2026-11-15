// Guarda da publicação ativa do app (VE02.03): o catálogo gerado só aponta para arquivos existentes, e cada partição
// confere com o sha256 e a contagem de edifícios do manifesto de cobertura da mesma versão. Uma ativação interrompida
// ou corrompida falha aqui antes de chegar a alguém.
import { describe, expect, it } from "@jest/globals";
import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const raiz = join(__dirname, "..");
const catalogo = readFileSync(join(raiz, "src/dados/recife/publicacaoGerada.ts"), "utf8");
const diretorio = /DIRETORIO_DO_INDICE = "([a-z0-9/-]+)"/.exec(catalogo)?.[1] ?? "";
const habilitados = JSON.parse(/BAIRROS_HABILITADOS = (\[[^\]]*\])/.exec(catalogo)?.[1] ?? "[]") as string[];
const pasta = join(raiz, "src/dados/recife", diretorio);

describe("publicação ativa do índice municipal", () => {
  it("catálogo aponta para uma versão imutável existente, sem caminho relativo para fora", () => {
    expect(diretorio).toMatch(/^indice-municipal\/[0-9a-f]{16}$/);
    expect(existsSync(join(pasta, "cobertura.json"))).toBe(true);
    expect(existsSync(join(pasta, "meta.json"))).toBe(true);
    for (const m of catalogo.matchAll(/require\("\.\/(.+?\.json)"\)/g)) expect(existsSync(join(raiz, "src/dados/recife", m[1]!))).toBe(true);
    // D036: os bairros são caminhos de camada (relativos a src/dados), fora do bundle; só o meta.json ainda é require().
    const arquivos = [...catalogo.matchAll(/"(recife\/indice-municipal\/[0-9a-f]{16}\/[a-z-]+\.json)"/g)].map((m) => m[1]!);
    expect(arquivos.length).toBe(habilitados.length);
    for (const a of arquivos) expect(existsSync(join(raiz, "src/dados", a))).toBe(true);
    expect([...catalogo.matchAll(/require\(/g)]).toHaveLength(1);
  });

  it("cada bairro habilitado confere com sha256 e contagem do manifesto de cobertura", () => {
    const cobertura = JSON.parse(readFileSync(join(pasta, "cobertura.json"), "utf8")) as { bairros: { bairro: string; sha256: string; edificios: number; estado: string }[] };
    const porBairro = new Map(cobertura.bairros.map((b) => [b.bairro, b]));
    expect(habilitados.length).toBeGreaterThanOrEqual(72);
    for (const b of habilitados) {
      const linha = porBairro.get(b);
      expect(linha?.estado).toBe("habilitado");
      const bytes = readFileSync(join(pasta, `${b}.json`));
      expect({ b, sha256: createHash("sha256").update(bytes).digest("hex") }).toEqual({ b, sha256: linha!.sha256 });
      expect((JSON.parse(bytes.toString("utf8")) as { edificios: unknown[] }).edificios.length).toBe(linha!.edificios);
    }
  });
});
