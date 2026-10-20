import { describe, expect, it } from "@jest/globals";
import { custoMensal } from "../src/dados/custos";
import { esquemaAnaliseV2, type AnaliseV2 } from "../src/dados/contratos";

const v = (valor: number | null, aConfirmar = false) => ({ valor, origem: "texto" as const, aConfirmar });
const vazio = v(null);
const base: AnaliseV2 = {
  versao: 2, id: "a", criadaEm: "2026-10-20T12:00:00.000Z", atualizadaEm: "2026-10-20T12:00:00.000Z",
  nome: "Apartamento", modalidade: "aluguel", tipologia: "apartamento", url: "", bairroTexto: "Casa Forte",
  bairro: "casa-forte", logradouro: null, numero: null, nomeEdificio: null, extracao: null,
  declarados: {
    preco: v(4500), condominio: v(1190), iptu: { ...v(288, true), periodo: "desconhecido" },
    seguroIncendio: vazio, taxaServico: vazio, outros: vazio, area: v(125), quartos: v(3),
    suites: vazio, banheiros: vazio, vagas: vazio, andar: vazio,
  },
  vinculo: { estado: "pendente" },
  visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
  salva: true, descarte: null,
};
const com = (m: Partial<AnaliseV2["declarados"]>, extra: Partial<AnaliseV2> = {}): AnaliseV2 =>
  ({ ...base, ...extra, declarados: { ...base.declarados, ...m } });

describe("custo mensal", () => {
  it("o exemplo da base é uma análise válida", () => {
    expect(esquemaAnaliseV2.safeParse(base).success).toBe(true);
  });
  it("deixa fora IPTU sem período e o que é desconhecido (caso do cartão do Explorar)", () => {
    const c = custoMensal(base);
    expect(c.totalMensalConhecido).toBe(5690);
    expect(c.alemDoPrincipal).toBe(1190);
    expect(c.pendentes).toBe(2);
    expect(c.parcelas.find((p) => p.nome === "IPTU")).toMatchObject({ estado: "a_confirmar", valorMensal: null, nota: "O anúncio informa R$ 288, sem periodicidade" });
    expect(c.notaForaDaSoma).toBe("IPTU e Seguro incêndio fora da soma.");
  });
  it("nunca soma o preço de compra", () => {
    const c = custoMensal(com({ preco: v(890000), iptu: { ...v(3240), periodo: "ano" } }, { modalidade: "compra" }));
    expect(c.principal).toEqual({ rotulo: "Preço anunciado", valor: 890000, porM2: 7120 });
    expect(c.totalMensalConhecido).toBe(1190 + 270);
    expect(c.alemDoPrincipal).toBeNull();
    expect(c.parcelas.map((p) => p.nome)).toEqual(["Condomínio", "IPTU"]);
  });
  it("valor marcado a confirmar fica fora mesmo com período conhecido", () => {
    const c = custoMensal(com({ condominio: v(100, true), iptu: { ...v(95), periodo: "mes" }, seguroIncendio: v(42) }));
    expect(c.totalMensalConhecido).toBe(4500 + 95 + 42);
    expect(c.parcelas.find((p) => p.nome === "Condomínio")).toMatchObject({ estado: "a_confirmar", nota: "O anúncio informa R$ 100" });
    expect(c.pendentes).toBe(1);
  });
  it("zero digitado pela pessoa entra como zero", () => {
    const zero = { valor: 0, origem: "voce" as const, aConfirmar: false };
    const c = custoMensal(com({ condominio: zero, iptu: { ...zero, periodo: "mes" }, seguroIncendio: zero }));
    expect(c.totalMensalConhecido).toBe(4500);
    expect(c.pendentes).toBe(0);
    expect(c.notaForaDaSoma).toBeNull();
  });
  it("sem nenhuma parcela conhecida não inventa total", () => {
    const c = custoMensal(com({ preco: vazio, condominio: vazio, iptu: { ...vazio, periodo: "desconhecido" } }));
    expect(c.totalMensalConhecido).toBeNull();
    expect(c.alemDoPrincipal).toBeNull();
    expect(c.principal.porM2).toBeNull();
  });
  it("atribui a nota a quem informou o valor", () => {
    const daPessoa = { valor: 300, origem: "voce" as const, aConfirmar: true };
    const c = custoMensal(com({ condominio: daPessoa, iptu: { ...daPessoa, periodo: "desconhecido" } }));
    expect(c.parcelas.find((p) => p.nome === "Condomínio")?.nota).toBe("Você informou R$ 300");
    expect(c.parcelas.find((p) => p.nome === "IPTU")?.nota).toBe("Você informou R$ 300, sem periodicidade");
  });
  it("mostra taxa e outros só quando informados", () => {
    const c = custoMensal(com({ taxaServico: v(120), outros: v(50) }));
    expect(c.parcelas.map((p) => p.nome)).toEqual(["Aluguel", "Condomínio", "IPTU", "Seguro incêndio", "Taxa de serviço", "Outros"]);
    expect(c.totalMensalConhecido).toBe(4500 + 1190 + 120 + 50);
  });
});
