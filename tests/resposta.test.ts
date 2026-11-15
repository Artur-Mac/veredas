// VE15: responder a pergunta decisiva com o valor confirmado refaz a comparação. Monotonicidade: um condomínio acima do
// limiar inverte a ordem; abaixo, não. Desconhecido nunca vira zero; IPTU exige período; nada muda sem valor válido.
import { describe, expect, it } from "@jest/globals";
import { esquemaAnaliseV2, type AnaliseV2 } from "../src/dados/contratos";
import { projetarDecisao, type Par } from "../src/dados/decisao";
import { aplicarResposta, efeitoDaResposta } from "../src/dados/resposta";

const EM = "2026-11-14T12:00:00.000Z";
const v = (valor: number | null, mais: Record<string, unknown> = {}) => ({ valor, origem: "texto" as const, aConfirmar: false, ...mais });
function analise(id: string, condominio: number | null): AnaliseV2 {
  return esquemaAnaliseV2.parse({
    versao: 2, id, criadaEm: EM, atualizadaEm: EM, nome: id, modalidade: "aluguel", tipologia: "apartamento", url: "", bairroTexto: "Graças", bairro: "gracas",
    logradouro: null, numero: null, nomeEdificio: null, extracao: null,
    declarados: { preco: v(2800), condominio: v(condominio), iptu: v(100, { periodo: "mes" }), seguroIncendio: v(40), taxaServico: v(null), outros: v(null),
      area: v(70), quartos: v(2), suites: v(null), banheiros: v(null), vagas: v(null), andar: v(null) },
    vinculo: { estado: "pendente" }, visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null,
  });
}
const ROT: Par<string> = ["A", "B"];
const projetar = (a: AnaliseV2, b: AnaliseV2) => projetarDecisao(a, b, [null, null], ROT, "custo", [null, null]);

describe("aplicar a resposta", () => {
  it("grava como informado por você, sem 'a confirmar'; seguro, taxa e área vão ao campo certo", () => {
    const a = analise("a", null);
    expect(aplicarResposta(a, "condominio", 650, null, EM)!.declarados.condominio).toEqual({ valor: 650, origem: "voce", aConfirmar: false });
    expect(aplicarResposta(a, "seguro", 35, null, EM)!.declarados.seguroIncendio.valor).toBe(35);
    expect(aplicarResposta(a, "area", 68.5, null, EM)!.declarados.area.valor).toBe(68.5);
    expect(esquemaAnaliseV2.safeParse(aplicarResposta(a, "condominio", 0, null, EM)).success).toBe(true);
  });
  it("IPTU exige período; valor inválido ou área zero não mudam nada", () => {
    const a = analise("a", 600);
    expect(aplicarResposta(a, "iptu", 1200, null, EM)).toBeNull();
    expect(aplicarResposta(a, "iptu", 1200, "ano", EM)!.declarados.iptu).toEqual({ valor: 1200, origem: "voce", aConfirmar: false, periodo: "ano" });
    expect(aplicarResposta(a, "condominio", Number.NaN, null, EM)).toBeNull();
    expect(aplicarResposta(a, "condominio", -1, null, EM)).toBeNull();
    expect(aplicarResposta(a, "area", 0, null, EM)).toBeNull();
  });
});

describe("a comparação refeita com a resposta", () => {
  // A: R$ 2.800 + 600 + 100 + 40 = R$ 3.540 conhecidos. B: R$ 2.800 + condomínio desconhecido + 100 + 40 = R$ 2.940 + ?
  const a = analise("a", 600), b = analise("b", null);
  const antes = projetar(a, b);
  it("antes: a pergunta decisiva é o condomínio de B", () => {
    if (antes.estado !== "pronta") throw new Error("pronta");
    expect(antes.pergunta).toMatchObject({ alvo: 1, campo: "condominio" });
  });
  it("monotonicidade: abaixo do limiar a ordem favorece B; acima, A; subir o valor nunca favorece B", () => {
    const ordens = [0, 200, 400, 550, 650, 800, 1200].map((c) => {
      const d = projetar(a, aplicarResposta(b, "condominio", c, null, EM)!);
      return d.estado === "pronta" ? d.visitarPrimeiro : "x";
    });
    const pos = (o: unknown) => (o === 1 ? 0 : o === null ? 1 : 2);
    for (let i = 1; i < ordens.length; i++) expect(pos(ordens[i])).toBeGreaterThanOrEqual(pos(ordens[i - 1]));
    expect(ordens[0]).toBe(1);
    expect(ordens.at(-1)).toBe(0);
  });
  it("a frase diz se a ordem mudou", () => {
    const depoisAlto = projetar(a, aplicarResposta(b, "condominio", 1200, null, EM)!);
    const depoisBaixo = projetar(a, aplicarResposta(b, "condominio", 100, null, EM)!);
    expect(efeitoDaResposta(antes, depoisAlto)).toMatch(/^Valor guardado\. (Com esse valor, a ordem mudou: visite primeiro A\.|A ordem não mudou: A continua na frente\.)$/);
    expect(efeitoDaResposta(antes, depoisBaixo)).toMatch(/^Valor guardado\./);
  });
});
