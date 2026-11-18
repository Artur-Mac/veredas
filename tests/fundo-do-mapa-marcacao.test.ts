// A marcação SVG do fundo (o que a web desenha num único <g>): mesmas camadas, mesmos textos e mesmos atributos que o
// componente nativo, ids únicos por prefixo e texto de dado escapado.
import { describe, expect, it } from "@jest/globals";
import { montarFundoDoMapa, type CenaDoFundo } from "../src/componentes/mapa/fundoDoMapaCena";
import { estiloDoFundo, FONTES_DO_FUNDO, TRACO } from "../src/componentes/mapa/fundoDoMapaEstilo";
import { escaparMarcacao, marcacaoDoFundo } from "../src/componentes/mapa/fundoDoMapaMarcacao";
import { CORES_CLARO } from "../src/tema/tokens";
import { CENTRO_DO_IMOVEL, LOGRADOURO_DO_IMOVEL, lerRecorte, mapaBaseDoRecorte, paraDesenhoCentrado } from "./apoio/mapa-base-de-teste";

const A = mapaBaseDoRecorte(lerRecorte("janela-A-gaveta"));
const E = estiloDoFundo(CORES_CLARO);

function cena(zoom = 1): CenaDoFundo {
  return montarFundoDoMapa({
    bairros: [A],
    cidade: null,
    bairroDoImovel: "boa-viagem",
    imovel: { centro: CENTRO_DO_IMOVEL, codigoDoLogradouro: LOGRADOURO_DO_IMOVEL },
    quadro: { largura: 340, altura: 300, paraDesenho: paraDesenhoCentrado(CENTRO_DO_IMOVEL, 340, 300, 220), zoom },
  });
}

const contar = (s: string, re: RegExp) => (s.match(re) ?? []).length;

describe("marcacaoDoFundo", () => {
  const c = cena();

  it("tudo = chão + rótulos; cada rótulo tem um caminho e dois textos (halo e letra)", () => {
    expect(c.rotulos.length).toBeGreaterThan(0);
    const tudo = marcacaoDoFundo(c, E, "tudo", "fx");
    expect(tudo).toBe(marcacaoDoFundo(c, E, "chao", "fx") + marcacaoDoFundo(c, E, "rotulos", "fx"));
    const rot = marcacaoDoFundo(c, E, "rotulos", "fx");
    expect(contar(rot, /<textPath /g)).toBe(2 * c.rotulos.length);
    expect(contar(rot, /<text /g)).toBe(2 * (c.rotulos.length + c.bairros.length));
    expect(contar(rot, /<path id="/g)).toBe(c.rotulos.length);
    expect(marcacaoDoFundo(c, E, "chao", "fx")).not.toMatch(/<text/);
    expect(rot).not.toMatch(/<rect/);
  });

  it("os ids dos caminhos levam o prefixo da instância e as referências apontam para eles", () => {
    const rot = marcacaoDoFundo(c, E, "rotulos", "fAB");
    for (const r of c.rotulos) {
      expect(rot).toContain(`<path id="fAB-${r.id}"`);
      expect(rot).toContain(`href="#fAB-${r.id}"`);
    }
    expect(marcacaoDoFundo(c, E, "rotulos", "fCD")).not.toContain("fAB-");
  });

  it("fontes do app, halo com traço e traços constantes com o zoom", () => {
    const rot = marcacaoDoFundo(c, E, "rotulos", "f");
    expect(rot).toContain(`font-family:${FONTES_DO_FUNDO.rua}`);
    if (c.bairros.length) expect(rot).toContain(`font-family:${FONTES_DO_FUNDO.bairro}`);
    expect(rot).toContain(`stroke="${E.halo}" stroke-width="${TRACO.haloDaRua}"`);
    const z = cena(4);
    expect(marcacaoDoFundo(z, E, "chao", "f")).toContain(`stroke-width="${TRACO.lote / 4}"`);
    expect(marcacaoDoFundo(z, E, "rotulos", "f")).toContain(`stroke-width="${TRACO.haloDaRua / 4}"`);
  });

  it("escapa o texto que vem do dado", () => {
    expect(escaparMarcacao(`R. "A" & <B> d'C`)).toBe("R. &quot;A&quot; &amp; &lt;B&gt; d&#39;C");
    const r = c.rotulos[0]!;
    const suja: CenaDoFundo = { ...c, rotulos: [{ ...r, nome: "Rua <script>&" }], bairros: [] };
    const rot = marcacaoDoFundo(suja, E, "rotulos", "f");
    expect(rot).toContain("Rua &lt;script&gt;&amp;");
    expect(rot).not.toContain("<script>");
  });

  it("sem dado, nada", () => {
    expect(marcacaoDoFundo({ ...c, temDado: false }, E, "tudo", "f")).toBe("");
  });
});
