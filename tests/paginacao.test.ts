import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
const codigo = readFileSync(join(__dirname, "../scripts/dados/paginacao.mjs"), "utf8");
const planejarPaginas = new Function(codigo.replace(/^export /gm, "") + "\nreturn planejarPaginas;")() as
  (total: number, limite: number, registros: unknown[]) => { offsets: number[]; paginas: unknown[][] };
describe("paginação de dados públicos", () => {
  it("resultado vazio válido tem zero páginas e nenhum offset indefinido", () => {
    expect(planejarPaginas(0, 500, [])).toEqual({ offsets: [], paginas: [] });
  });
  it("preserva primeira página e prevê a última página parcial", () => {
    const registros = Array.from({ length: 500 }, (_, id) => ({ id }));
    const p = planejarPaginas(501, 500, registros);
    expect(p.offsets).toEqual([0, 500]); expect(p.paginas[0]).toBe(registros); expect(p.paginas).toHaveLength(2);
  });
  it("não aceita resposta incompleta como cobertura vazia ou completa", () => {
    expect(() => planejarPaginas(1, 500, [])).toThrow();
    expect(() => planejarPaginas(0, 500, [{}])).toThrow();
    expect(() => planejarPaginas(-1, 500, [])).toThrow();
    expect(() => planejarPaginas(0, 0, [])).toThrow();
  });
});
