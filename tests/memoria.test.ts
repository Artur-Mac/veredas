// Memória do dossiê (VE09): retratos sucessivos reais (versões publicadas do índice que continuam no repositório) e casos
// sintéticos para o que a base real não exercita. Republicar sem mudar fatos, grafia diferente, correção retroativa,
// registro antigo que aparece, sumiço, recorrência, reversão e retrato ausente.
import { describe, expect, it } from "@jest/globals";
import { mudancasDesde, resumoDasMudancas, retrato, type EntradasDoRetrato } from "../src/dados/memoria";
import { esquemaCaderno, cadernoVazio } from "../src/dados/caderno";

/* eslint-disable @typescript-eslint/no-require-imports */
const versoes = ["59f361842f6410d4", "91b71d239c1847cf", "5bad409c1782ca8a", "1e393803851f3fd5"] as const;
type Indice = { obras: { categoria: string; descricao: string; data: string; situacao: string | null; centro: [number, number] }[]; edificios: { id: string; obras150m: { recentes: [number, number][] } }[];
  rua: { logradouros: Record<string, { defesaCivil?: { porAno: [number, number][]; acoesComunitarias?: number; grafia: string } }> } };
const indice = (v: string): Indice => require(`../src/dados/recife/indice-municipal/${v}/boa-viagem.json`);
const declarados = { preco: { valor: 3000 }, condominio: { valor: 600 }, iptu: { valor: 100, periodo: "mes" }, seguroIncendio: { valor: 40 } };
function doIndice(v: string, predioId: string, em: string, extra: Partial<EntradasDoRetrato> = {}) {
  const ix = indice(v);
  const e = ix.edificios.find((x) => x.id === predioId)!;
  const dc = ix.rua.logradouros[predioId.split("-")[0]!]?.defesaCivil;
  return retrato({ em, fontes: { indice: v }, declarados, ruaDoPredio: null, essenciais: [], noite: null,
    obras: e.obras150m.recentes.map(([i, m]) => ({ ...ix.obras[i]!, distanciaM: m })),
    defesaCivil: dc ? { porAno: dc.porAno, ...(dc.acoesComunitarias !== undefined ? { acoesComunitarias: dc.acoesComunitarias } : {}) } : null, ...extra });
}
const SALGUEIRO = "53490-78";

describe("retratos reais sucessivos (Rua Salgueiro, Boa Viagem)", () => {
  it("republicação sem mudar fatos não gera mudança", () => {
    expect(mudancasDesde(doIndice(versoes[0], SALGUEIRO, "2026-10-25T12:00:00.000Z"), doIndice(versoes[1], SALGUEIRO, "2026-11-14T12:00:00.000Z"))).toEqual([]);
  });
  it("correção do leitor ('Maro'): anos fechados mudam e viram correção, não atendimento novo; a grafia da rua não conta", () => {
    const ms = mudancasDesde(doIndice(versoes[1], SALGUEIRO, "2026-10-25T12:00:00.000Z"), doIndice(versoes[2], SALGUEIRO, "2026-11-14T12:00:00.000Z"));
    const r = resumoDasMudancas(ms);
    expect(r.relevantes).toEqual([]);
    expect(r.correcoes.find((m) => m.id === "dc:2019")?.frase).toBe("Atendimentos da Defesa Civil na rua em 2019: 15 → 730. É um ano já fechado: a base foi corrigida ou reclassificada, não houve atendimento novo.");
    expect(ms.some((m) => /grafia|Salgueiro/.test(m.frase))).toBe(false);
  });
  it("separação das ações comunitárias: anos somem e caem, sem 'novos atendimentos'", () => {
    const ms = mudancasDesde(doIndice(versoes[2], SALGUEIRO, "2026-11-14T10:00:00.000Z"), doIndice(versoes[3], SALGUEIRO, "2026-11-14T20:00:00.000Z"));
    expect(ms.every((m) => m.natureza === "correcao")).toBe(true);
    expect(ms.find((m) => m.id === "dc:2024")?.frase).toMatch(/2024: 2 → 0\. É um ano já fechado/);
    expect(ms.find((m) => m.id === "dc:comunitarias")?.frase).toBe("A base passou a separar ações comunitárias da Defesa Civil (735 na rua), que não são atendimentos a risco.");
  });
});

const base = (fatos: Partial<EntradasDoRetrato>, em = "2026-06-15T12:00:00.000Z") =>
  retrato({ em, fontes: {}, declarados, obras: [], defesaCivil: null, ruaDoPredio: null, essenciais: [], noite: null, ...fatos });
const obra = (data: string, situacao: string | null, descricao = "ALVARA DE CONSTRUCAO INICIAL") => ({ categoria: "construcao", descricao, data, situacao, centro: [-34.9, -8.1] as [number, number], distanciaM: 80 });

describe("casos sintéticos", () => {
  it("custo do anúncio que mudou vem primeiro, com a diferença por mês", () => {
    const ms = mudancasDesde(base({}), base({ declarados: { ...declarados, condominio: { valor: 680 } } }));
    expect(ms[0]).toMatchObject({ natureza: "anuncio", frase: "Condomínio: R$ 600 → R$ 680 (+R$ 80 por mês)." });
  });
  it("licença nova depois do retrato é novidade; licença antiga que só apareceu agora não é obra nova; situação que muda é mundo", () => {
    const ms = mudancasDesde(base({ obras: [obra("2026-03", "EM ANALISE")] }),
      base({ obras: [obra("2026-03", "DEFERIDO"), obra("2026-08", "EM ANALISE", "ALVARA DE DEMOLICAO"), obra("2025-11", "DEFERIDO", "ALVARA DE ACRESCIMO")] }, "2026-09-01T12:00:00.000Z"));
    expect(ms.find((m) => m.frase.includes("situação passou de EM ANALISE para DEFERIDO"))?.natureza).toBe("mundo");
    expect(ms.find((m) => m.frase.includes("demolicao"))?.natureza).toBe("mundo");
    const antiga = ms.find((m) => m.frase.includes("acrescimo"))!;
    expect(antiga.natureza).toBe("antigo");
    expect(antiga.frase).toContain("só apareceu agora na base (não é obra nova desde o seu retrato)");
  });
  it("licença que sai da lista não vira 'obra terminada'", () => {
    const [m] = mudancasDesde(base({ obras: [obra("2024-05", "DEFERIDO")] }), base({ obras: [] }));
    expect(m!.natureza).toBe("correcao");
    expect(m!.frase).toContain("não diz que a obra terminou ou foi cancelada");
  });
  it("recorrência no ano em curso é atendimento novo; diferença só de caixa/acento no texto é ignorada", () => {
    const ms = mudancasDesde(base({ defesaCivil: { porAno: [[2026, 1]] }, noite: { parada: "Ponto na Avenida Boa Viagem", ultima: 85800 } }),
      base({ defesaCivil: { porAno: [[2026, 3]] }, noite: { parada: "PONTO NA AVENIDA BOA VIAGEM", ultima: 85800 } }));
    expect(ms).toHaveLength(1);
    expect(ms[0]).toMatchObject({ natureza: "mundo", frase: "2 novos atendimentos da Defesa Civil na rua em 2026 (agora 3)." });
  });
  it("reversão: A → B → A volta a mostrar a mudança inversa, sem acumular duplicata", () => {
    const a = base({ declarados: { ...declarados, preco: { valor: 3000 } } }), b = base({ declarados: { ...declarados, preco: { valor: 2800 } } });
    expect(mudancasDesde(a, b)).toHaveLength(1);
    expect(mudancasDesde(b, a)[0]!.frase).toBe("Preço anunciado: R$ 2.800 → R$ 3.000 (+R$ 200 por mês).");
    expect(mudancasDesde(a, a)).toEqual([]);
  });
  it("essencial: arredondamento de minutos não alerta; mudança do mapa diz que pode ser só mapeamento", () => {
    const um = base({ essenciais: [{ categoria: "mercado", nome: "Mercado A", minutos: 6 }] });
    expect(mudancasDesde(um, base({ essenciais: [{ categoria: "mercado", nome: "Mercado A", minutos: 7 }] }))).toEqual([]);
    const [m] = mudancasDesde(um, base({ essenciais: [{ categoria: "mercado", nome: "Mercado B", minutos: 3 }] }));
    expect(m!.frase).toBe("Mercado mais perto: Mercado A, 6 min → Mercado B, 3 min a pé (o mapa mudou; pode ser lugar novo ou só mapeado agora).");
  });
  it("camada que não existia no retrato antigo vira uma nota, não 'não havia no mapa'; camada que não carregou agora não gera nada", () => {
    const sem = base({}), com = base({ essenciais: [{ categoria: "mercado", nome: "Mercado A", minutos: 6 }], noite: { parada: "Ponto X", ultima: 85000 } });
    const ms = mudancasDesde(sem, com);
    expect(ms.map((m) => m.frase).sort()).toEqual([
      "O dossiê passou a mostrar a volta de ônibus à noite; não havia isso no seu retrato para comparar.",
      "O dossiê passou a mostrar mercado, farmácia, praça e ponto mais perto a pé; não havia isso no seu retrato para comparar.",
    ]);
    expect(ms.every((m) => m.natureza === "correcao")).toBe(true);
    expect(mudancasDesde(com, sem)).toEqual([]);
  });
  it("o retrato cabe no caderno validado e o caderno antigo, sem retrato, continua válido", () => {
    const c = { ...cadernoVazio(), memoria: base({ obras: [obra("2026-03", "DEFERIDO")] }) };
    expect(esquemaCaderno.safeParse(c).success).toBe(true);
    expect(esquemaCaderno.safeParse(cadernoVazio()).success).toBe(true);
  });
});
