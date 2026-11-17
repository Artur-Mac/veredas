import { describe, expect, it } from "@jest/globals";
import { esquemaAnaliseV2 } from "../src/dados/contratos";
import { cadernoVazio, esquemaDocumentoPessoal, normalizarCnpj, ocorrenciasDoImovel, ultimaInspecao, type Ocorrencia } from "../src/dados/caderno";
import { exportarCaderno, lerBackup, planejarImportacao } from "../src/dados/backup";
import { comprarOuAlugar, horizonte, price, taxaMensalEfetiva } from "../src/dados/orcamento";
import { prepararOutraVisita } from "../src/dados/sessoes";
import { baseDeServicos, servicosProximos, validarServicos } from "../src/dados/recife/servicos";
import { analiseDeTeste, EM } from "./fixtures/caderno";
import { htmlDoResumo, resumoCompartilhavel } from "../src/dados/resumo";

describe("caderno amplo — integridade e semântica", () => {
  it("compartilhamento exclui notas privadas por padrão e escapa conteúdo no PDF", () => {
    const a = analiseDeTeste();
    a.visita.notas = "Conteúdo privado";
    a.nome = '<script>alert("teste")</script>';
    expect(resumoCompartilhavel(a)).not.toContain("Conteúdo privado");
    expect(resumoCompartilhavel(a, true)).toContain("Conteúdo privado");
    const html = htmlDoResumo(resumoCompartilhavel(a));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("VEREDA");
  });
  it("extensão opcional preserva análise antiga e recusa versão futura de complemento", () => {
    const a = analiseDeTeste();
    expect(esquemaAnaliseV2.parse(a)).toEqual(a);
    expect(esquemaAnaliseV2.safeParse({ ...a, caderno: { ...cadernoVazio(), versao: 2 } }).success).toBe(false);
  });
  it("backup restaura ausências, zero, notas e complementos, sem carteira", () => {
    const a = analiseDeTeste("a", { caderno: cadernoVazio() });
    a.declarados.seguroIncendio.valor = 0;
    a.visita.notas = "Nota privada sintética";
    const texto = exportarCaderno([a], EM);
    expect(lerBackup(texto)).toEqual([a]);
    expect(texto).not.toContain("carteira");
  });
  it("importação repetida é idempotente, preserva conflito como outra cópia", () => {
    const a = analiseDeTeste("a");
    const diferente = { ...a, nome: "Outro conteúdo" };
    const r = planejarImportacao([a], [diferente]);
    expect(r.lista).toHaveLength(2);
    expect(r.lista[0]).toEqual(a);
    expect(r.conflitos).toHaveLength(1);
    expect(planejarImportacao(r.lista, [diferente]).lista).toHaveLength(2);
    expect(planejarImportacao([a], [a]).novas).toBe(0);
  });
  it("arquivo inválido/futuro/duplicado é recusado antes da alteração", () => {
    expect(() => lerBackup("{" )).toThrow();
    const b = JSON.parse(exportarCaderno([analiseDeTeste()], EM));
    expect(() => lerBackup(JSON.stringify({ ...b, versao: 9 }))).toThrow();
    expect(() => lerBackup(JSON.stringify({ ...b, analises: [...b.analises, ...b.analises] }))).toThrow();
    expect(() => lerBackup("á".repeat(6 * 1024 * 1024))).toThrow("10 MB");
  });
  it("arquivar visita guarda respostas/datas e nova sessão não as apaga", () => {
    const a = analiseDeTeste();
    a.visita.notas = "Janela fechada";
    a.visita.respostas = { custo: "Pedir boleto" };
    const b = prepararOutraVisita(a, EM, "sessao-a");
    expect(b.caderno?.visitas[0]).toMatchObject({ notas: "Janela fechada", respostas: { custo: "Pedir boleto" }, concluidaEm: null });
    expect(b.visita.respostas).toEqual({});
    expect(a.visita.notas).toBe("Janela fechada");
    expect(prepararOutraVisita(b, EM, "sessao-a")).toEqual(b);
  });
  it("última inspeção não usa emissão, outro imóvel ou data desconhecida", () => {
    const d = esquemaDocumentoPessoal.parse({ id: "laudo-a", titulo: "Fachada", tipo: "laudo", inspecaoEm: "2020-01-01", emitidoEm: "2026-01-01", recebidoEm: EM,
      origem: "Documento apresentado", escopo: "Fachada", trecho: "", pagina: null, vinculo: "confirmado" });
    const recente = { ...d, id: "laudo-b", inspecaoEm: "2025-01-01", emitidoEm: "2025-02-01" };
    expect(ultimaInspecao([d, recente])?.id).toBe("laudo-b");
    expect(ultimaInspecao([{ ...recente, vinculo: "outro_imovel" }, { ...d, inspecaoEm: null }])).toBeNull();
  });
  it("CNPJ conserva letras e não atribui outros imóveis/entidades ao prédio", () => {
    expect(normalizarCnpj("AB.CDE.123/0001-99")).toBe("ABCDE123000199");
    const c = cadernoVazio();
    c.entidades = [{ id: "condominio", cnpj: "12345678000199", nome: "Condomínio sintético", papel: "condominio", endereco: "", evidencia: "Ata", confirmado: true }];
    const o: Ocorrencia = { id: "caso-a", entidadeId: "condominio", assunto: "vicio", identificador: "1234567-89.2026.8.17.0001", orgao: "Tribunal", polo: "autor", natureza: "alegacao", estagio: "Em andamento", referenciaEm: null,
      vinculo: "confirmado", fonte: "Documento apresentado", trecho: "Reparos pleiteados", valorCentavos: 100000, tipoValor: "causa", registradoEm: EM };
    c.ocorrencias = [o, { ...o, id: "recurso" }, { ...o, id: "outro", identificador: "outro", vinculo: "outro_imovel" }];
    expect(ocorrenciasDoImovel(c)).toEqual([o]);
    expect(ocorrenciasDoImovel(c)[0]?.polo).toBe("autor");
  });
});

describe("orçamento — fórmulas e ausências", () => {
  it("ajuste da última parcela é pago, não perdoado, mesmo quando a parcela regular arredonda a zero", () => {
    expect(price(1, 0, 600)).toMatchObject({ parcelaCentavos: 0, parcelaFinalCentavos: 1, jurosCentavos: 0 });
    const r = comprarOuAlugar({ precoCentavos: 1, entradaCentavos: 0, taxaMensal: 0, prazo: 600, horizonte: 600,
      aluguelMensalCentavos: 0, custosCompraMensaisCentavos: 0, custosAquisicaoCentavos: 0, retornoMensal: 0, valorizacaoMensal: 0, custoVendaFracao: 0 });
    expect(r.saldoDevedorCentavos).toBe(0);
    expect(r.investimentoAluguelCentavos).toBe(1);
  });
  it("recusa resultados fora da precisão segura em vez de mostrar patrimônio monetário incorreto", () => {
    expect(() => comprarOuAlugar({ precoCentavos: 1e12, entradaCentavos: 0, taxaMensal: 0, prazo: 600, horizonte: 600,
      aluguelMensalCentavos: 0, custosCompraMensaisCentavos: 0, custosAquisicaoCentavos: 0, retornoMensal: 1, valorizacaoMensal: 1, custoVendaFracao: 0 })).toThrow("precisão monetária");
  });
  it("caução compõe caixa e não despesa; mensal parcial não vira total completo", () => {
    const a = analiseDeTeste();
    const h = horizonte(a, { id: "cenario", nome: "12 meses", meses: 12, despesasIniciaisCentavos: 100000, caucaoCentavos: 750000, extrasMensaisCentavos: null, registradoEm: EM });
    expect(h.mensalConhecidoCentavos).toBe(310000);
    expect(h.despesaConhecidaCentavos).toBe(310000 * 12 + 100000);
    expect(h.caixaInicialConhecidoCentavos).toBe(850000);
    expect(h.completo).toBe(false);
  });
  it("Price trata taxa zero, limite próximo a zero e taxa anual efetiva", () => {
    expect(price(120000, 0, 12)).toMatchObject({ parcelaCentavos: 10000, jurosCentavos: 0 });
    expect(price(120000, 1e-12, 12).parcelaCentavos).toBe(10000);
    expect(taxaMensalEfetiva(1.01 ** 12 - 1)).toBeCloseTo(0.01, 10);
    expect(price(10000000, 0.01, 120).parcelaCentavos).toBe(143471);
    expect(() => price(1, -1, 12)).toThrow();
    expect(() => price(1, 0.01, 0)).toThrow();
  });
  it("compra × aluguel separa saldo, patrimônio e investimento, sem duplicar amortização", () => {
    const resultado = comprarOuAlugar({ precoCentavos: 12000000, entradaCentavos: 0, taxaMensal: 0, prazo: 120, horizonte: 120,
      aluguelMensalCentavos: 100000, custosCompraMensaisCentavos: 0, custosAquisicaoCentavos: 0, retornoMensal: 0, valorizacaoMensal: 0, custoVendaFracao: 0 });
    expect(resultado.saldoDevedorCentavos).toBe(0);
    expect(resultado.patrimonioCompraCentavos).toBe(12000000);
    expect(resultado.investimentoAluguelCentavos).toBe(0);
  });
});

describe("serviços CNEFE — base real e ausência de inferências", () => {
  it("valida a camada integral sem nomes/contatos e com qualidade preservada", () => {
    const base = baseDeServicos();
    expect(base.pontos.length).toBe(5661);
    expect(base.pontos.every(p => p[3] === 1)).toBe(true);
    expect(() => validarServicos({ ...base, municipio: "outra" })).toThrow();
  });
  it("total precede corte; raio e categoria são respeitados", () => {
    const b = { ...baseDeServicos(), pontos: [[-34.9, -8.03, 4, 1], [-34.9001, -8.0301, 4, 1], [-34.9, -8.03, 5, 1]] as [number, number, 4 | 5 | 8, 1][] };
    const r = servicosProximos(b, [-34.9, -8.03], 300, 4, 1);
    expect(r.total).toBe(2); expect(r.itens).toHaveLength(1);
    expect(() => servicosProximos(b, [-34.9, -8.03], 0, 4)).toThrow();
  });
});
