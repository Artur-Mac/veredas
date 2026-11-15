// Preparar a negociação (VE10): total conhecido (desconhecido ≠ zero, IPTU anual e sem período), achados do cadastro
// reais, histórico de preço registrado, amostra pessoal com unidades distintas e candidatos a "mesmo imóvel".
import { describe, expect, it } from "@jest/globals";
import { candidatosMesmoImovel, mensagemDeNegociacao, prepararNegociacao, valorDoHistorico } from "../src/dados/negociacao";
import { derivarDossie } from "../src/dados/dossie/derivar";
import type { AnaliseV2, Edificio, IndiceDoBairro } from "../src/dados/contratos";
import { DIRETORIO_DO_INDICE } from "../src/dados/recife/publicacaoGerada";
import { analiseDeTeste } from "./fixtures/caderno";

const v = (valor: number | null, mais: Record<string, unknown> = {}) => ({ valor, origem: "texto" as const, aConfirmar: false, ...mais });
const comDeclarados = (a: AnaliseV2, d: Partial<Record<keyof AnaliseV2["declarados"], unknown>>): AnaliseV2 => ({ ...a, declarados: { ...a.declarados, ...d } as AnaliseV2["declarados"] });
const vazio = { achados: { principal: null, apoio: [] }, perguntas: [] };

describe("total mensal conhecido", () => {
  it("valor desconhecido não vira zero: o total diz o que falta", () => {
    const a = comDeclarados(analiseDeTeste("a"), { condominio: v(null), seguroIncendio: v(40) });
    const n = prepararNegociacao(a, vazio, []);
    expect(n.total.valor).toBe(2540);
    expect(n.total.texto).toBe("Total mensal conhecido: R$ 2.540 (faltam condomínio, IPTU).");
  });
  it("IPTU anual vira mensal; IPTU sem período fica fora da soma", () => {
    const anual = comDeclarados(analiseDeTeste("a"), { iptu: v(1200, { periodo: "ano" }), seguroIncendio: v(40) });
    expect(prepararNegociacao(anual, vazio, []).total.valor).toBe(2500 + 600 + 100 + 40);
    const sem = comDeclarados(analiseDeTeste("a"), { iptu: v(1200, { periodo: "desconhecido" }), seguroIncendio: v(40) });
    expect(prepararNegociacao(sem, vazio, []).total.faltando).toEqual(["IPTU"]);
  });
});

describe("histórico de preço registrado", () => {
  it("lê os valores do histórico e só conta mudanças do preço anunciado", () => {
    expect(valorDoHistorico("3.000 · anúncio")).toBe(3000);
    expect(valorDoHistorico("2.850,5 · informado por você")).toBe(2850.5);
    expect(valorDoHistorico("Não informado · anúncio")).toBeNull();
    const a = analiseDeTeste("a", { caderno: { versao: 1, documentos: [], entidades: [], ocorrencias: [], observacoes: [], cenarios: [], visitas: [], decisao: "considerando", diario: [],
      historicoDoAnuncio: [
        { id: "historico-1", em: "2026-10-01T12:00:00.000Z", origem: "nova_extracao", alteracoes: [{ campo: "Preço anunciado", antes: "3.000 · anúncio", depois: "2.800 · anúncio" }, { campo: "Condomínio", antes: "600 · anúncio", depois: "650 · anúncio" }] },
      ] } });
    const n = prepararNegociacao(a, vazio, []);
    expect(n.argumentos[0]).toMatchObject({ id: "historico:preco", fato: "O preço anunciado passou de R$ 3.000 para R$ 2.800 em 01/10/2026 (registro seu).", peso: 3 });
  });
});

describe("mesmo imóvel × mesmo prédio", () => {
  const conf = (id: string, area: number | null, quartos: number | null, andar: number | null, url = `https://anuncio.test/${id}`) => comDeclarados(
    analiseDeTeste(id, { url, vinculo: { estado: "confirmado", edificioId: "99001-100", dsqfl: null, confirmadoEm: "2026-11-01T00:00:00.000Z", indiceGeradoEm: "x" } }),
    { area: v(area), quartos: v(quartos), andar: v(andar) });
  it("mesma área (±2%) e quartos no mesmo prédio é candidato; outra unidade do prédio não é", () => {
    const a = conf("a", 70, 2, null), b = conf("b", 71, 2, 5), c = conf("c", 90, 3, 5), d = conf("d", 70, 2, 7);
    const a5 = conf("a5", 70, 2, 5);
    expect(candidatosMesmoImovel(a, [a, b, c]).map((x) => x.id)).toEqual(["b"]);
    expect(candidatosMesmoImovel(a, [a, b])[0]!.motivo).toBe("mesmo prédio, 71 m² e 2 quartos; andar não informado em um dos dois");
    // Andares informados e diferentes: unidades diferentes.
    expect(candidatosMesmoImovel(a5, [a5, d])).toEqual([]);
    // Sem área ou quartos: não dá para dizer.
    expect(candidatosMesmoImovel(conf("x", null, 2, null), [b])).toEqual([]);
  });
  it("candidato fica fora da amostra pessoal; a amostra precisa de ao menos 2 outros imóveis", () => {
    const area = (id: string, m2: number, preco: number, edificioId: string) => comDeclarados(
      analiseDeTeste(id, { url: `https://anuncio.test/${id}`, vinculo: { estado: "confirmado", edificioId, dsqfl: null, confirmadoEm: "2026-11-01T00:00:00.000Z", indiceGeradoEm: "x" } }),
      { area: v(m2), quartos: v(2), preco: v(preco), seguroIncendio: v(0), iptu: v(100, { periodo: "mes" }) });
    const eu = area("eu", 70, 3500, "99001-100"), gemeo = area("gemeo", 70, 2000, "99001-100"), o1 = area("o1", 80, 2500, "99002-1"), o2 = area("o2", 60, 2000, "99003-1");
    const n = prepararNegociacao(eu, vazio, [eu, gemeo, o1, o2]);
    expect(n.mesmoImovel.map((x) => x.id)).toEqual(["gemeo"]);
    const amostra = n.argumentos.find((x) => x.id === "amostra:posicao")!;
    expect(amostra.fato).toMatch(/^Entre os 3 imóveis desse tipo que você salvou em Casa Forte com área e valor conhecidos, este tem o maior aluguel anunciado por m² \(R\$ 50\/m²; os outros vão de R\$ 31\/m² a R\$ 33\/m²\)\. É a sua amostra, não um preço de mercado\.$/);
    expect(prepararNegociacao(eu, vazio, [eu, gemeo, o1]).argumentos.some((x) => x.id === "amostra:posicao")).toBe(false);
  });
});

describe("prédio real e mensagem", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ix = require(`../src/dados/recife/${DIRETORIO_DO_INDICE}/boa-viagem.json`) as IndiceDoBairro;
  const e = ix.edificios.find((x) => x.id === "53490-78") as Edificio;
  const a = comDeclarados(analiseDeTeste("real", { bairro: "boa-viagem", bairroTexto: "Boa Viagem", url: "https://anuncio.test/real",
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl, confirmadoEm: "2026-11-01T00:00:00.000Z", indiceGeradoEm: ix.geradoEm } }),
  { preco: v(3000), condominio: v(null), iptu: v(288, { periodo: "desconhecido" }), area: v(70), quartos: v(2), seguroIncendio: v(40) });
  const visao = derivarDossie(a, e, ix.contexto, ix.obras, [], new Date("2026-11-14T12:00:00Z"), "custo", null);
  const n = prepararNegociacao(a, visao, [a]);
  it("os achados reais do cadastro viram argumentos com a pergunta do dossiê", () => {
    expect(n.argumentos.some((x) => x.id.startsWith("achado:") && x.pergunta)).toBe(true);
    // Valor que falta vira pergunta da mensagem, não frase de destaque (peso 0): o total já diz o que falta.
    expect(n.argumentos.find((x) => x.id.startsWith("lacuna:") && /condom/i.test(x.pergunta ?? ""))?.peso).toBe(0);
  });
  it("mensagem: sem proposta só pede confirmações; com proposta, diz o total e o valor que você escreveu", () => {
    const ids = n.argumentos.map((x) => x.id);
    const sem = mensagemDeNegociacao(a, n, ids, null);
    expect(sem).toMatch(/^Olá! Tenho interesse no imóvel "Imóvel sintético de teste" \(https:\/\/anuncio\.test\/real\)\.\nAntes de fazer uma proposta, queria confirmar:\n- /);
    expect(sem).not.toMatch(/proposta é/);
    const com = mensagemDeNegociacao(a, n, ids, 2800);
    expect(com).toContain("Pelo que levantei, o total mensal conhecido fica em R$ 3.040, ainda sem condomínio, IPTU.");
    expect(com).toContain("Minha proposta é de R$ 2.800 por mês de aluguel.");
    expect(com.split("\n").at(-1)).toBe("Obrigado!");
    // Nada de "mercado", "valor justo" ou número sugerido pelo app.
    expect(com).not.toMatch(/mercado|valor justo|sugerid/i);
  });
});
