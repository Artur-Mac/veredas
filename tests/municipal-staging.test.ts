import { describe, expect, it } from "@jest/globals";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { BAIRROS_DO_RECIFE } from "../src/dados/recife/bairros";
import { esquemaMetaDoIndice } from "../src/dados/contratos";
import { qualidadeGeometrica, validarIndiceMunicipal } from "../src/dados/recife/validarMunicipal";
const raiz = join(__dirname, "..");
const base = JSON.parse(readFileSync(join(raiz, "src/dados/recife/indice/casa-forte.json"), "utf8"));
describe("staging municipal", () => {
  it("valida o formato completo sem publicar ou habilitar bairro novo", () => {
    expect(validarIndiceMunicipal("casa-forte", base).edificios.length).toBeGreaterThan(0);
  });
  it("recusa bairro errado, totais incorretos e referências inexistentes", () => {
    expect(() => validarIndiceMunicipal("torre", base)).toThrow();
    expect(() => validarIndiceMunicipal("casa-forte", { ...base, contexto: { ...base.contexto, unidades: 0 } })).toThrow();
    const b = structuredClone(base);
    b.edificios[0].obras150m.recentes = [[9999999, 100]];
    expect(() => validarIndiceMunicipal("casa-forte", b)).toThrow();
  });
});

// Só roda quando explicitamente solicitado após a geração; não finge verificar arquivos ausentes no CI.
if (process.env.VEREDA_AUDITAR_MUNICIPAL === "1") {
  it("audita todas as 94 partições geradas, sem modificar o app", () => {
    const pasta = join(raiz, ".cache/dados-recife/indice-municipal-staging");
    esquemaMetaDoIndice.parse(JSON.parse(readFileSync(join(pasta, "meta.json"), "utf8")));
    const linhas = BAIRROS_DO_RECIFE.map(b => {
      const texto = readFileSync(join(pasta, `${b.slug}.json`), "utf8");
      const v = validarIndiceMunicipal(b.slug, JSON.parse(texto));
      return { bairro: b.slug, edificios: v.edificios.length, unidades: v.contexto.unidades, geometria: qualidadeGeometrica(v), bytes: Buffer.byteLength(texto),
        sha256: createHash("sha256").update(texto).digest("hex"), ids: v.edificios.map(e => e.id) };
    });
    const porId = new Map<string, string[]>();
    for (const l of linhas) for (const id of l.ids) porId.set(id, [...(porId.get(id) ?? []), l.bairro]);
    const colisoes = [...porId].filter(([, bairros]) => bairros.length > 1).map(([id, bairros]) => ({ id, bairros }));
    const resultado = { estado: "staging validado estruturalmente; publicação depende de auditoria de associação, cobertura e desempenho",
      particoes: linhas.map(({ ids: _ids, ...resto }) => resto), colisoesEntreBairros: colisoes,
      semEdificios: linhas.filter(l => l.edificios === 0).map(l => l.bairro),
      acimaDe2MB: linhas.filter(l => l.bytes > 2000000).map(l => l.bairro) };
    writeFileSync(join(raiz, "docs/plano-recife/execucoes/municipal-validacao.json"), JSON.stringify(resultado, null, 2) + "\n");
    expect(linhas).toHaveLength(94);
  }, 120000);
}
