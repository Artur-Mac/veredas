// Sol nas fachadas do prédio (VE07.02): lados opostos, estações, obstáculo, altura desconhecida, noite e prédio real.
import { describe, expect, it } from "@jest/globals";
import { contrasteDasFachadas, DATAS_DAS_ESTACOES, estadoDoLado, fraseDoDestaque, horaDaVisita, ladosDoVolume, linhasDosLados, notaDoMetodo, perguntaParaVisita } from "../src/dados/sol/fachadas";
import { emCoordenadas, type Ponto, type VolumeSolar } from "../src/dados/sol/geometria";
import type { EntornoDaJanela } from "../src/dados/sol/entorno";
import { carregarEntornoSolar } from "../src/dados/sol/entorno";
import { DIRETORIO_DO_INDICE } from "../src/dados/recife/publicacaoGerada";
import { MAX_TEXTO_DA_PERGUNTA } from "../src/componentes/visita-v1/logica";

const centro: Ponto = [-34.9, -8.05];
const ret = (x1: number, y1: number, x2: number, y2: number): Ponto[] => [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
function vol(id: string, anel: Ponto[], pav: number | null): VolumeSolar {
  return { id, dsqfl: id === "proprio" ? "00000000000001" : "00000000000002", aneis: [anel.map((p) => emCoordenadas(p, centro))],
    alturaM: pav === null ? null : pav * 3.1, alturaMinM: pav === null ? null : pav * 2.8, alturaMaxM: pav === null ? null : pav * 3.4, baseM: 0,
    origemAltura: pav === null ? "desconhecida" : "pavimentos_cadastrais" };
}
// Prédio de 4 pavimentos, 20 m (leste–oeste) × 30 m (norte–sul).
const proprio = vol("proprio", ret(-10, -15, 10, 15), 4);
const entorno = (...outros: VolumeSolar[]): EntornoDaJanela => ({ recorte: { versao: "t", fonteEm: "2026-03-02", centro, raioM: 300, cobertura: "cadastral_parcial", volumes: [proprio, ...outros] }, volumesDoImovel: [proprio] });

describe("lados do prédio", () => {
  it("um retângulo tem os quatro lados nas quatro direções, com o comprimento de cada um", () => {
    const l = ladosDoVolume(proprio);
    expect(l.map((x) => [x.direcao, x.graus, x.comprimentoM])).toEqual([["norte", 0, 20], ["leste", 90, 30], ["sul", 180, 20], ["oeste", 270, 30]]);
  });
});

describe("contraste sem obstáculos", () => {
  const c = contrasteDasFachadas(entorno(), 2);
  if (c.estado !== "ok") throw new Error("esperava ok");
  const lado = (d: string) => c.lados.find((x) => x.direcao === d)!;
  it("lados opostos: leste de manhã, oeste à tarde; nada à noite", () => {
    expect(lado("leste").verao.manha.min).toBeGreaterThan(180);
    expect(lado("leste").verao.manha.frente).toBeGreaterThanOrEqual(lado("leste").verao.manha.max);
    // Meio-dia solar no Recife ≈ 11h20 (hora civil): logo depois das 12h o leste ainda pode ficar "indeterminado"
    // pela folga de ±5° de direção, mas nunca com sol garantido à tarde.
    expect(lado("leste").verao.tarde.min).toBe(0);
    expect(lado("leste").verao.tarde.max).toBeLessThanOrEqual(60);
    expect(lado("oeste").verao.tarde.min).toBeGreaterThan(180);
    // Entre o meio-dia solar (≈ 11h18 em 21/12) e as 12h civis, o oeste já pega sol: no máximo esses ~40 min.
    expect(lado("oeste").verao.manha.min).toBeLessThanOrEqual(45);
    expect(estadoDoLado(entorno(), proprio, lado("oeste"), 2, DATAS_DAS_ESTACOES.verao, 23 * 60)).toBe("noite");
  });
  it("estações no Recife (8° S): sul tem sol em dezembro, norte em junho", () => {
    expect(lado("sul").verao.manha.min + lado("sul").verao.tarde.min).toBeGreaterThan(lado("sul").inverno.manha.max + lado("sul").inverno.tarde.max);
    expect(lado("norte").inverno.manha.min + lado("norte").inverno.tarde.min).toBeGreaterThan(lado("norte").verao.manha.max + lado("norte").verao.tarde.max);
  });
  it("destaque e hora da visita entre lados opostos; frase, pergunta e nota sem temperatura interna", () => {
    // Em dezembro o Sol fica o dia todo na metade sul do céu (8° S): o maior contraste é entre lados opostos (sul × norte).
    expect(c.destaque?.sol.direcao).toBe("sul");
    expect(c.destaque?.sombra.direcao).toBe("norte");
    const h = horaDaVisita(entorno(), c, "2026-12-15");
    expect(h).not.toBeNull();
    expect(c.destaque!.periodo === "manha" ? h! <= 11 : h! >= 13).toBe(true);
    expect(fraseDoDestaque(c, h)).toMatch(/^(De manhã|À tarde), o lado sul do prédio fica de frente para o sol por cerca de [\d,]+ h no verão; o lado norte, nenhuma\. No inverno \(junho\) é o contrário\. No 2º andar, os prédios vizinhos do cadastro não tapam esse sol\. Para ver a diferença, visite por volta das \d+h\.$/);
    expect(perguntaParaVisita(c, h)!.length).toBeLessThanOrEqual(MAX_TEXTO_DA_PERGUNTA);
    expect(notaDoMetodo(c)).toContain("Não indica a temperatura dentro do apartamento");
    expect(linhasDosLados(c)).toHaveLength(4);
    const norte = linhasDosLados(c).find((l) => l.startsWith("Lado norte"))!;
    expect(norte).toMatch(/^Lado norte — verão: sem sol de frente\. Inverno: manhã cerca de [\d,]+ h de frente \(com os vizinhos, (cerca de|de) [\d,]+( a [\d,]+)? h\); tarde cerca de [\d,]+ h de frente/);
    expect(linhasDosLados(c).join(" ")).not.toMatch(/cerca de 0 h|nenhuma hora e nenhuma hora/);
  });
});

describe("obstáculos e incerteza de altura", () => {
  it("um prédio alto colado a oeste tira o sol da tarde do lado oeste no andar baixo", () => {
    const alto = vol("alto", ret(-40, -40, -14, 40), 20);
    const c = contrasteDasFachadas(entorno(alto), 0);
    if (c.estado !== "ok") throw new Error("ok");
    const oeste = c.lados.find((x) => x.direcao === "oeste")!;
    expect(oeste.verao.tarde.min).toBeLessThan(60);
    // Orientação não muda com o obstáculo; a ressalva diz que os vizinhos tapam.
    expect(oeste.verao.tarde.frente).toBeGreaterThan(180);
  });
  it("vizinho sem altura no cadastro abre a faixa (mínimo < máximo), não vira sol nem sombra garantidos", () => {
    const desconhecido = vol("x", ret(-40, -40, -14, 40), null);
    const c = contrasteDasFachadas(entorno(desconhecido), 0);
    if (c.estado !== "ok") throw new Error("ok");
    const o = c.lados.find((x) => x.direcao === "oeste")!.verao.tarde;
    expect(o.max).toBeGreaterThan(o.min);
  });
  it("prédio sem volume validado ou sem altura: sem geometria, nada inventado", () => {
    expect(contrasteDasFachadas(null, 3).estado).toBe("sem_geometria");
    expect(contrasteDasFachadas({ ...entorno(), volumesDoImovel: [] }, 3).estado).toBe("sem_geometria");
    expect(contrasteDasFachadas({ ...entorno(), volumesDoImovel: [vol("proprio", ret(-10, -15, 10, 15), null)] }, 3).estado).toBe("sem_geometria");
  });
});

describe("prédio real (Madalena entrou no recorte solar)", () => {
  it("um prédio de Madalena com volume validado tem lados e faixas de sol", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ix = require(`../src/dados/recife/${DIRETORIO_DO_INDICE}/madalena.json`) as { edificios: Parameters<typeof carregarEntornoSolar>[0][] };
    const e = ix.edificios.find((x) => { const en = carregarEntornoSolar(x); return en && en.volumesDoImovel[0]?.alturaMinM; });
    expect(e).toBeDefined();
    const t0 = Date.now();
    const c = contrasteDasFachadas(carregarEntornoSolar(e!), null);
    const ms = Date.now() - t0;
    expect(c.estado).toBe("ok");
    if (c.estado === "ok") {
      expect(c.lados.length).toBeGreaterThanOrEqual(2);
      for (const l of c.lados) expect(l.verao.tarde.max).toBeGreaterThanOrEqual(l.verao.tarde.min);
    }
    console.log(JSON.stringify({ predio: e!.id, ms, frase: c.estado === "ok" ? fraseDoDestaque(c, null) : null }));
  });
});
