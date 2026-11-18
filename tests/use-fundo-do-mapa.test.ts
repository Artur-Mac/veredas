// O gancho comum dos mapas para o mapa-base (18/11/2026): que arquivos cada quadro pede, em que estado fica e que cena
// entrega. Nos testes o leitor de camadas é síncrono (tests/configurar-camadas.ts): o que existe já está "carregado".
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { contarMontagensDoFundo } from "../src/componentes/mapa/fundoDoMapaCena";
import { esquecerCenasDoFundo, metrosPorPixelDoQuadro, planoDeCargaDoFundo, useFundoDoMapa, type FundoDoMapaCarregado, type PedidoDoFundo } from "../src/componentes/mapa/useFundoDoMapa";
import { arquivoDaCidade, arquivoDoMapaBase, BAIRROS_DECODIFICADOS_EM_MEMORIA, bairrosDecodificadosEmMemoria, bairrosNaCaixa, esquecerMapaBase, mapaBaseDoBairro, type CaixaEmGraus } from "../src/dados/recife/mapaBase";
import { esquecerCamadas, garantirCamadas } from "../src/dados/camadas";
import * as plataforma from "../src/plataforma/camadas";
import { METROS_POR_GRAU } from "../src/dados/recife/mapaBaseContrato";
import { CENTRO_DO_IMOVEL, LOGRADOURO_DO_IMOVEL, paraDesenhoCentrado } from "./apoio/mapa-base-de-teste";

const LARGURA = 340;
const ALTURA = 300;

/** A caixa em graus de um quadro de `metros` de largura centrado em `centro` (a mesma conta de paraDesenhoCentrado). */
function caixaDe(centro: readonly [number, number], metros: number): CaixaEmGraus {
  const cos = Math.cos((centro[1] * Math.PI) / 180);
  const meiaL = metros / 2;
  const meiaA = (metros * ALTURA) / LARGURA / 2;
  return [centro[0] - meiaL / (METROS_POR_GRAU * cos), centro[1] - meiaA / METROS_POR_GRAU, centro[0] + meiaL / (METROS_POR_GRAU * cos), centro[1] + meiaA / METROS_POR_GRAU];
}

function pedido(metros: number, extra: Partial<PedidoDoFundo> = {}): PedidoDoFundo {
  return {
    bairro: "boa-viagem",
    imovel: { centro: CENTRO_DO_IMOVEL, codigoDoLogradouro: LOGRADOURO_DO_IMOVEL },
    quadro: { largura: LARGURA, altura: ALTURA, paraDesenho: paraDesenhoCentrado(CENTRO_DO_IMOVEL, LARGURA, ALTURA, metros), zoom: 1 },
    caixa: caixaDe(CENTRO_DO_IMOVEL, metros),
    ...extra,
  };
}

const montadas: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  act(() => { for (const m of montadas.splice(0)) m.unmount(); });
});

/** Roda o gancho num componente e devolve o que ele entregou no último render. */
function usar(p: PedidoDoFundo): FundoDoMapaCarregado {
  let saida!: FundoDoMapaCarregado;
  const Sonda = () => {
    saida = useFundoDoMapa(p);
    return null;
  };
  act(() => { montadas.push(TestRenderer.create(React.createElement(Sonda))); });
  return saida;
}

describe("plano de carga", () => {
  it("mede metros por pixel pela caixa, já contando o zoom", () => {
    expect(metrosPorPixelDoQuadro(caixaDe(CENTRO_DO_IMOVEL, 340), LARGURA)).toBeCloseTo(1, 2);
    expect(metrosPorPixelDoQuadro(caixaDe(CENTRO_DO_IMOVEL, 340), LARGURA, 2)).toBeCloseTo(0.5, 2);
  });

  it("gaveta no meio de Boa Viagem: só o arquivo do bairro", () => {
    const plano = planoDeCargaDoFundo("boa-viagem", caixaDe(CENTRO_DO_IMOVEL, 220), LARGURA);
    expect(plano).toEqual({ arquivos: [arquivoDoMapaBase("boa-viagem")], completo: true });
  });

  it("Por perto de 2,6 km: o bairro, os vizinhos que tocam o quadro e a cidade", () => {
    const plano = planoDeCargaDoFundo("boa-viagem", caixaDe(CENTRO_DO_IMOVEL, 2600), LARGURA);
    expect(plano.completo).toBe(true);
    expect(plano.arquivos[0]).toBe(arquivoDoMapaBase("boa-viagem"));
    expect(plano.arquivos).toContain(arquivoDaCidade());
    expect(plano.arquivos.length).toBeGreaterThan(2);
  });

  it("quadro de 5 km (nível de cidade): só o bairro do imóvel e a cidade, sem baixar os vizinhos", () => {
    const plano = planoDeCargaDoFundo("boa-viagem", caixaDe(CENTRO_DO_IMOVEL, 5000), LARGURA);
    expect(plano).toEqual({ arquivos: [arquivoDoMapaBase("boa-viagem"), arquivoDaCidade()], completo: true });
  });

  it("sem saber o bairro: os bairros cuja caixa toca o quadro e a cidade", () => {
    const plano = planoDeCargaDoFundo(null, caixaDe(CENTRO_DO_IMOVEL, 220), LARGURA);
    expect(plano.arquivos).toContain(arquivoDoMapaBase("boa-viagem"));
    expect(plano.arquivos).toContain(arquivoDaCidade());
  });

  it("quadro que cruza a divisa mas fica na borda de 300 m: o bairro e a cidade (o chão do vizinho)", () => {
    const casaForte: readonly [number, number] = [-34.914433, -8.035775];
    const plano = planoDeCargaDoFundo("casa-forte", caixaDe(casaForte, 220), LARGURA);
    expect(plano).toEqual({ arquivos: [arquivoDoMapaBase("casa-forte"), arquivoDaCidade()], completo: true });
  });

  it("longe do Recife não há arquivo de bairro para pedir", () => {
    const saoPaulo: readonly [number, number] = [-46.6333, -23.5505];
    const plano = planoDeCargaDoFundo(null, caixaDe(saoPaulo, 220), LARGURA);
    expect(plano.arquivos.filter((a) => a !== arquivoDaCidade())).toEqual([]);
  });
});

describe("useFundoDoMapa", () => {
  it("gaveta de 220 m: cena pronta no nível de lote, com a rua e o bairro do imóvel", () => {
    const r = usar(pedido(220));
    expect(r.estado).toBe("pronta");
    expect(r.cena?.temDado).toBe(true);
    expect(r.cena?.nivel).toBe("lote");
    expect(r.cena?.selo).toBe("Boa Viagem");
    expect(r.cena?.acessibilidade.rua).toMatch(/Major Armando/);
    expect(r.cena?.camadas.loteDoImovel).not.toBe("");
  });

  it("Por perto de 2,6 km: nível de quadras, com nome de bairro", () => {
    const r = usar(pedido(2600));
    expect(r.estado).toBe("pronta");
    expect(r.cena?.nivel).toBe("bairro");
    expect(r.cena?.bairros.some((b) => b.doImovel)).toBe(true);
    expect(r.cena?.camadas.lotes).toBe("");
  });

  it("quadro de 5 km: nível de cidade", () => {
    const r = usar(pedido(5000));
    expect(r.estado).toBe("pronta");
    expect(r.cena?.nivel).toBe("cidade");
  });

  it("desligado não carrega nem monta", () => {
    const r = usar(pedido(220, { ativo: false }));
    expect(r).toMatchObject({ estado: "desligado", cena: null });
  });

  it("bairro que não existe e quadro fora do Recife: sem cobertura ou sem dado, nunca uma cena inventada", () => {
    const saoPaulo: readonly [number, number] = [-46.6333, -23.5505];
    const r = usar({
      bairro: null,
      imovel: { centro: saoPaulo, codigoDoLogradouro: null },
      quadro: { largura: LARGURA, altura: ALTURA, paraDesenho: paraDesenhoCentrado(saoPaulo, LARGURA, ALTURA, 220), zoom: 1 },
      caixa: caixaDe(saoPaulo, 220),
    });
    // Só a cidade pode ter sido pedida; longe dela não há chão com dado.
    expect(["sem-cobertura", "pronta"]).toContain(r.estado);
    if (r.cena) {
      expect(r.cena.camadas.quadras).toBe("");
      expect(r.cena.camadas.lotes).toBe("");
      expect(r.cena.selo).toBeNull();
    }
  });

  it("a mesma entrada entrega a mesma cena (não remonta a cada render)", () => {
    const p = pedido(220);
    const cenas: (FundoDoMapaCarregado["cena"])[] = [];
    const Sonda = ({ n }: { n: number }) => {
      cenas.push(useFundoDoMapa(p).cena);
      return n > 0 ? null : null;
    };
    let a!: TestRenderer.ReactTestRenderer;
    act(() => { a = TestRenderer.create(React.createElement(Sonda, { n: 0 })); });
    montadas.push(a);
    act(() => { a.update(React.createElement(Sonda, { n: 1 })); });
    expect(cenas.length).toBeGreaterThanOrEqual(2);
    expect(cenas[cenas.length - 1]).toBe(cenas[0]);
  });

  it("quadro fora do Recife só com a cidade: sem cobertura, não pronta", () => {
    const saoPaulo: readonly [number, number] = [-46.6333, -23.5505];
    const r = usar({
      bairro: null,
      imovel: null,
      quadro: { largura: LARGURA, altura: ALTURA, paraDesenho: paraDesenhoCentrado(saoPaulo, LARGURA, ALTURA, 220), zoom: 1 },
      caixa: caixaDe(saoPaulo, 220),
    });
    expect(r).toMatchObject({ estado: "sem-cobertura", cena: null });
  });

  it("manterAnterior: enquanto o quadro novo não está pronto, entrega a última cena", () => {
    const saidas: FundoDoMapaCarregado[] = [];
    const Sonda = ({ p }: { p: PedidoDoFundo }) => {
      saidas.push(useFundoDoMapa(p));
      return null;
    };
    const primeiro = pedido(220, { manterAnterior: true });
    let a!: TestRenderer.ReactTestRenderer;
    act(() => { a = TestRenderer.create(React.createElement(Sonda, { p: primeiro })); });
    montadas.push(a);
    const pronta = saidas[saidas.length - 1]!;
    expect(pronta.estado).toBe("pronta");
    // Sem o leitor de teste e com a busca parada, os arquivos ficam "carregando".
    const g = globalThis as { __veredaLerCamadaEmTeste?: (c: string) => unknown };
    const original = g.__veredaLerCamadaEmTeste;
    const busca = jest.spyOn(plataforma, "buscarArquivoDeCamada").mockImplementation(() => new Promise<never>(() => undefined));
    try {
      delete g.__veredaLerCamadaEmTeste;
      act(() => { esquecerMapaBase(); esquecerCamadas(); });
      act(() => { a.update(React.createElement(Sonda, { p: pedido(240, { manterAnterior: true }) })); });
      const depois = saidas[saidas.length - 1]!;
      expect(depois.estado).toBe("carregando");
      expect(depois.cena).toBe(pronta.cena);
    } finally {
      g.__veredaLerCamadaEmTeste = original;
      busca.mockRestore();
      act(() => { esquecerMapaBase(); esquecerCamadas(); });
    }
  });

  it("depois de falhar por arquivo recusado, tentar de novo relê e monta", () => {
    const g = globalThis as { __veredaLerCamadaEmTeste?: (c: string) => unknown };
    const original = g.__veredaLerCamadaEmTeste!;
    const arquivo = arquivoDoMapaBase("boa-viagem")!;
    let saida!: FundoDoMapaCarregado;
    const Sonda = () => {
      saida = useFundoDoMapa(p);
      return null;
    };
    const p = pedido(220);
    try {
      esquecerMapaBase();
      act(() => { esquecerCamadas(); });
      g.__veredaLerCamadaEmTeste = (c) => (c === arquivo ? { versao: "outra" } : original(c));
      act(() => { montadas.push(TestRenderer.create(React.createElement(Sonda))); });
      expect(saida.estado).toBe("falhou");
      // O arquivo certo chega (nova carga); tentar de novo tem de reler e remontar.
      g.__veredaLerCamadaEmTeste = original;
      act(() => { esquecerCamadas(); });
      act(() => { saida.tentarDeNovo(); });
      expect(saida.estado).toBe("pronta");
      expect(saida.cena?.temDado).toBe(true);
    } finally {
      g.__veredaLerCamadaEmTeste = original;
      act(() => { esquecerMapaBase(); esquecerCamadas(); });
    }
  });
});

describe("uma montagem por abertura (desempenho, 18/11/2026)", () => {
  it("abrir o mapa monta a cena uma vez; a chegada de uma camada alheia não remonta nem troca a cena", async () => {
    act(() => { esquecerCenasDoFundo(); });
    let saida!: FundoDoMapaCarregado;
    // Um pedido novo a cada render (paraDesenho com identidade nova), como um mapa que não memoriza a conta.
    const Sonda = () => {
      saida = useFundoDoMapa(pedido(221));
      return null;
    };
    const antes = contarMontagensDoFundo();
    act(() => { montadas.push(TestRenderer.create(React.createElement(Sonda))); });
    expect(saida.estado).toBe("pronta");
    const cena = saida.cena;
    expect(contarMontagensDoFundo() - antes).toBe(1);
    // Outra camada do app chega (o relógio das camadas anda): nem remonta nem troca a identidade da cena.
    const alheio = arquivoDoMapaBase("pina")!;
    await act(async () => { await garantirCamadas([alheio]); });
    act(() => { montadas[montadas.length - 1]!.update(React.createElement(Sonda)); });
    expect(saida.cena).toBe(cena);
    expect(contarMontagensDoFundo() - antes).toBe(1);
  });

  it("fechar e reabrir com o mesmo quadro reaproveita a cena guardada, sem montar de novo", () => {
    act(() => { esquecerCenasDoFundo(); });
    const antes = contarMontagensDoFundo();
    const primeira = usar(pedido(222)).cena;
    act(() => { for (const m of montadas.splice(0)) m.unmount(); });
    const segunda = usar(pedido(222)).cena;
    expect(primeira).not.toBeNull();
    expect(segunda).toBe(primeira);
    expect(contarMontagensDoFundo() - antes).toBe(1);
  });

  it("com a chave de medição ligada o gancho fica desligado: nada carregado, nenhuma cena", () => {
    const g = globalThis as { __veredaSemFundoDoMapa?: boolean };
    g.__veredaSemFundoDoMapa = true;
    try {
      const r = usar(pedido(223));
      expect(r.estado).toBe("desligado");
      expect(r.cena).toBeNull();
    } finally {
      delete g.__veredaSemFundoDoMapa;
    }
  });
});

describe("memória do mapa-base", () => {
  it(`guarda só os ${BAIRROS_DECODIFICADOS_EM_MEMORIA} bairros usados por último; o descartado é decodificado de novo`, () => {
    act(() => { esquecerMapaBase(); });
    const slugs = bairrosNaCaixa([-35.1, -8.2, -34.8, -7.9]).slice(0, BAIRROS_DECODIFICADOS_EM_MEMORIA + 2);
    expect(slugs.length).toBe(BAIRROS_DECODIFICADOS_EM_MEMORIA + 2);
    const primeiro = mapaBaseDoBairro(slugs[0]!);
    for (const s of slugs.slice(1, BAIRROS_DECODIFICADOS_EM_MEMORIA)) mapaBaseDoBairro(s);
    // Usar o primeiro de novo o põe no fim da fila.
    expect(mapaBaseDoBairro(slugs[0]!)).toBe(primeiro);
    mapaBaseDoBairro(slugs[BAIRROS_DECODIFICADOS_EM_MEMORIA]!);
    mapaBaseDoBairro(slugs[BAIRROS_DECODIFICADOS_EM_MEMORIA + 1]!);
    const guardados = bairrosDecodificadosEmMemoria();
    expect(guardados.length).toBe(BAIRROS_DECODIFICADOS_EM_MEMORIA);
    expect(guardados).toContain(slugs[0]);
    // Saíram os dois usados há mais tempo (o segundo e o terceiro).
    expect(guardados).not.toContain(slugs[1]);
    expect(guardados).not.toContain(slugs[2]);
    const relido = mapaBaseDoBairro(slugs[1]!);
    expect(relido?.bairro).toBe(slugs[1]);
    expect(bairrosDecodificadosEmMemoria().at(-1)).toBe(slugs[1]);
    act(() => { esquecerMapaBase(); });
  });
});
