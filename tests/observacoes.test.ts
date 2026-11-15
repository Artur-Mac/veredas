// Contrato de observação (VE02.01) e importação deliberada de anúncio no mesmo contrato (VE02.02). Análises SINTÉTICAS.
import { describe, expect, it } from "@jest/globals";
import { esquemaAnaliseV2, type AnaliseV2 } from "../src/dados/contratos";
import {
  classificarColeta,
  esquemaManifestoDePublicacao,
  esquemaObservacao,
  esquemaSnapshotDaFonte,
  estadoDaPublicacao,
} from "../src/dados/observacao";
import { observacoesDoAnuncio } from "../src/dados/observacoesDoAnuncio";

const INSTANTE = "2026-11-14T12:00:00.000Z";
const v = (valor: number | null, aConfirmar = false, origem: "link" | "texto" | "voce" = "texto") => ({ valor, origem, aConfirmar });
const vazio = v(null);

function analise(mudancas: Partial<AnaliseV2["declarados"]> = {}, extra: Partial<AnaliseV2> = {}): AnaliseV2 {
  return esquemaAnaliseV2.parse({
    versao: 2, id: "obs-1", criadaEm: INSTANTE, atualizadaEm: INSTANTE, nome: "Sintético", modalidade: "aluguel",
    tipologia: "apartamento", url: "https://www.zapimoveis.com.br/imovel/aluguel-x-id-1/", bairroTexto: "Graças", bairro: "gracas",
    logradouro: null, numero: null, nomeEdificio: null, extracao: null,
    declarados: {
      preco: v(3000), condominio: vazio, iptu: { ...v(150), periodo: "desconhecido" }, seguroIncendio: v(0), taxaServico: vazio, outros: vazio,
      area: v(70, true), quartos: v(2), suites: vazio, banheiros: vazio, vagas: vazio, andar: vazio, ...mudancas,
    },
    vinculo: { estado: "pendente" },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "Nota privada da visita", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null, ...extra,
  });
}

describe("classificarColeta: HTTP 200 não basta", () => {
  const casos: [Parameters<typeof classificarColeta>[0], ReturnType<typeof classificarColeta>][] = [
    [{ erro: "acesso_negado", declarados: null, lidos: 0, aceitos: 0, paginasFaltando: 0 }, { estado: "falhou", motivo: "acesso_negado" }],
    [{ erro: "corpo_nao_e_dados", declarados: null, lidos: 0, aceitos: 0, paginasFaltando: 0 }, { estado: "falhou", motivo: "corpo_nao_e_dados" }],
    [{ erro: null, declarados: 0, lidos: 0, aceitos: 0, paginasFaltando: 0 }, { estado: "vazia", motivo: null }],
    [{ erro: null, declarados: 10, lidos: 10, aceitos: 0, paginasFaltando: 0 }, { estado: "falhou", motivo: "nenhum_registro_utilizavel" }],
    [{ erro: "pagina_repetida", declarados: 10, lidos: 5, aceitos: 5, paginasFaltando: 1 }, { estado: "parcial", motivo: "pagina_repetida" }],
    [{ erro: null, declarados: 10, lidos: 5, aceitos: 5, paginasFaltando: 1 }, { estado: "parcial", motivo: "pagina_faltando" }],
    [{ erro: null, declarados: 10, lidos: 8, aceitos: 8, paginasFaltando: 0 }, { estado: "parcial", motivo: "pagina_faltando" }],
    [{ erro: null, declarados: 10, lidos: 10, aceitos: 9, paginasFaltando: 0 }, { estado: "valida", motivo: null }],
  ];
  it.each(casos)("%j → %j", (entrada, saida) => {
    expect(classificarColeta(entrada)).toEqual(saida);
  });

  it("publicação: completa só com fontes válidas ou vazias; todas falhando bloqueia", () => {
    expect(estadoDaPublicacao([{ estado: "valida" }, { estado: "vazia" }])).toBe("completa");
    expect(estadoDaPublicacao([{ estado: "valida" }, { estado: "parcial" }])).toBe("parcial");
    expect(estadoDaPublicacao([{ estado: "falhou" }])).toBe("bloqueada");
    expect(estadoDaPublicacao([])).toBe("bloqueada");
  });

  it("os esquemas recusam hash, propriedade e versão inválidos", () => {
    const { snapshot, observacoes } = observacoesDoAnuncio(analise());
    expect(() => esquemaSnapshotDaFonte.parse({ ...snapshot, sha256: "abc" })).toThrow();
    expect(() => esquemaObservacao.parse({ ...observacoes[0], propriedade: "Preço Total!" })).toThrow();
    expect(() => esquemaObservacao.parse({ ...observacoes[0], tempos: { ...observacoes[0]!.tempos, recuperado: "ontem" } })).toThrow();
    expect(() => esquemaManifestoDePublicacao.parse({ versaoDoContrato: 1, publicacao: "x", versao: "nao-hex" })).toThrow();
  });
});

describe("importação deliberada no contrato de observação", () => {
  const porPropriedade = (a: AnaliseV2) => Object.fromEntries(observacoesDoAnuncio(a).observacoes.map((o) => [o.propriedade, o]));

  it("taxa ausente fica desconhecida; zero declarado fica zero; 'a confirmar' é seu próprio estado", () => {
    const o = porPropriedade(analise());
    expect(o["anuncio.condominio"]).toMatchObject({ valor: null, estadoDoValor: "desconhecido" });
    expect(o["anuncio.seguro_incendio"]).toMatchObject({ valor: 0, estadoDoValor: "zero_declarado" });
    expect(o["anuncio.area_declarada"]).toMatchObject({ valor: 70, estadoDoValor: "a_confirmar", unidade: "m2" });
    expect(o["anuncio.aluguel_pedido"]).toMatchObject({ valor: 3000, estadoDoValor: "conhecido", unidade: "BRL/mes" });
    expect(o["anuncio.iptu"]).toMatchObject({ valor: 150, unidade: "BRL/periodo_desconhecido" });
  });

  it("compra usa preço pedido em BRL; IPTU anual mantém a unidade anual", () => {
    const o = porPropriedade(analise({ preco: v(600000), iptu: { ...v(2400), periodo: "ano" } }, { modalidade: "compra" }));
    expect(o["anuncio.preco_pedido"]).toMatchObject({ valor: 600000, unidade: "BRL" });
    expect(o["anuncio.iptu"]).toMatchObject({ unidade: "BRL/ano" });
  });

  it("prédio confirmado entra como entidade; origem do valor vira método", () => {
    const a = analise({ condominio: v(500, false, "voce") }, {
      vinculo: { estado: "confirmado", edificioId: "34223-220", dsqfl: "61755015020005", confirmadoEm: INSTANTE, indiceGeradoEm: "2026-10-22T00:30:36Z" },
    });
    const o = porPropriedade(a);
    expect(o["anuncio.condominio"]!.entidades).toEqual(expect.arrayContaining([{ tipo: "edificio", id: "34223-220", metodo: "confirmacao_da_pessoa" }]));
    expect(o["anuncio.condominio"]!.metodo.nome).toBe("digitado_pela_pessoa");
    expect(o["anuncio.aluguel_pedido"]!.metodo.nome).toBe("leitura_do_texto");
  });

  it("snapshot: só derivados (sem bruto do portal), estado válido; sem nenhum valor conhecido, falhou", () => {
    const { snapshot } = observacoesDoAnuncio(analise());
    expect(snapshot).toMatchObject({ fonte: "importacao_deliberada", sha256: null, estado: "valida", escala: "unidade" });
    expect(snapshot.termos.retencao).toBe("so_derivados");
    const nada = Object.fromEntries(Object.keys(analise().declarados).map((k) => [k, k === "iptu" ? { ...vazio, periodo: "desconhecido" } : vazio]));
    expect(observacoesDoAnuncio(analise(nada as Partial<AnaliseV2["declarados"]>)).snapshot).toMatchObject({ estado: "falhou", motivo: "nenhum_registro_utilizavel" });
  });

  it("nada do caderno privado (notas da visita) entra nas observações", () => {
    expect(JSON.stringify(observacoesDoAnuncio(analise()))).not.toContain("Nota privada");
  });
});
