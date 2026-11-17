// Persistência do caderno de análises. Regra: nada grava por cima de uma chave que não foi lida com sucesso, e um item
// ruim nunca leva os outros. Toda análise daqui é sintética.
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React, { useEffect } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { z } from "zod";
import { CHAVE_ANALISES_V2, esquemaAnaliseV2, type AnaliseV2 } from "../src/dados/contratos";
import { esquemaAnalise } from "../src/dados/analise";
import { migrarAnaliseV1 } from "../src/dados/migracao";
import { cadernoVazio } from "../src/dados/caderno";
import { planejarImportacao } from "../src/dados/backup";
import {
  AnalisesNoAparelho,
  CHAVE_ANALISES_V1,
  CHAVE_ATIVA,
  CHAVE_QUARENTENA,
  carregarAnalises,
  useAnalises,
} from "../src/estado/Analises";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// ——— Armazenamento simulado que falha quando o teste manda ———————————————————————————————————————

type FnSimulada = {
  mockImplementation: (fn: (chave: string, ...resto: unknown[]) => Promise<unknown>) => unknown;
  getMockImplementation: () => ((chave: string, ...resto: unknown[]) => Promise<unknown>) | undefined;
};
const simulado = AsyncStorage as unknown as { getItem: FnSimulada; setItem: FnSimulada; removeItem: FnSimulada };
const leituraOriginal = simulado.getItem.getMockImplementation()!;
const gravacaoOriginal = simulado.setItem.getMockImplementation()!;
const remocaoOriginal = simulado.removeItem.getMockImplementation()!;

function falharLeituraDe(chave: string) {
  simulado.getItem.mockImplementation(async (k, ...resto) => {
    if (k === chave) throw new Error("falha simulada de leitura");
    return leituraOriginal(k, ...resto);
  });
}
function falharGravacaoDe(chave: string) {
  simulado.setItem.mockImplementation(async (k, ...resto) => {
    if (k === chave) throw new Error("falha simulada de gravação");
    return gravacaoOriginal(k, ...resto);
  });
}
const restaurarArmazenamento = () => {
  simulado.getItem.mockImplementation(leituraOriginal);
  simulado.setItem.mockImplementation(gravacaoOriginal);
  simulado.removeItem.mockImplementation(remocaoOriginal);
};

const INSTANTE = "2026-10-20T12:00:00.000Z";
const AGORA = new Date("2026-10-20T15:30:00.000Z");
const vazio = { valor: null, origem: "texto" as const, aConfirmar: false };

function analise(id: string, mudancas: Partial<AnaliseV2> = {}): AnaliseV2 {
  return esquemaAnaliseV2.parse({
    versao: 2, id, criadaEm: INSTANTE, atualizadaEm: INSTANTE, nome: `Imóvel sintético ${id}`, modalidade: "aluguel",
    tipologia: "apartamento", url: "", bairroTexto: "Casa Forte", bairro: "casa-forte", logradouro: null, numero: null,
    nomeEdificio: null, extracao: null,
    declarados: {
      preco: { ...vazio, valor: 4000 }, condominio: vazio, iptu: { ...vazio, periodo: "desconhecido" }, seguroIncendio: vazio,
      taxaServico: vazio, outros: vazio, area: vazio, quartos: vazio, suites: vazio, banheiros: vazio, vagas: vazio, andar: vazio,
    },
    vinculo: { estado: "pendente" },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null, ...mudancas,
  });
}

/** Item que o esquema estrito recusa: a chave `campoDeOutraVersao` não existe na v2. */
const itemRuim = (id: string) => ({ ...analise(id), campoDeOutraVersao: "veio de uma versão futura", nome: `Ruim ${id}` });

const v1Valida = (id: string, mudancas: Record<string, unknown> = {}) => ({
  id,
  nome: `Apartamento sintético ${id}`,
  bairro: "Casa Forte",
  url: "https://www.zapimoveis.com.br/imovel/111",
  tipo: "aluguel",
  preco: 3200,
  condominio: 800,
  iptuAnual: 2400,
  outros: null,
  area: 85,
  notas: "Andar alto",
  verificadas: [],
  atualizadoEm: "2026-10-19T12:00:00.000Z",
  ...mudancas,
});

const guardado = (chave: string) => AsyncStorage.getItem(chave);
const lerLista = async (chave: string): Promise<unknown[]> => JSON.parse((await guardado(chave)) as string) as unknown[];
const chavesDoApp = async () => (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith("vereda-")).sort();
const chavesComPrefixo = async (prefixo: string) => (await chavesDoApp()).filter((k) => k.startsWith(prefixo));

describe("Persistência e migração de análises v1 -> v2 com AsyncStorage", () => {
  const CHAVE_V1 = "vereda-analises-v1";

  const analisesV1 = [
    {
      id: "teste-1",
      nome: "Apartamento em Casa Forte",
      bairro: "Casa Forte",
      url: "https://www.zapimoveis.com.br/imovel/111",
      tipo: "aluguel",
      preco: 3200,
      condominio: 800,
      iptuAnual: 2400,
      outros: null,
      area: 85,
      notas: "Andar alto",
      verificadas: [],
      atualizadoEm: "2026-10-19T12:00:00.000Z",
    },
  ];

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("migra v1 para v2 na primeira carga e mantém v1 intacta", async () => {
    // 1. Simula v1 pré-existente
    await AsyncStorage.setItem(CHAVE_V1, JSON.stringify(analisesV1));

    // 2. Simula o fluxo de carga do AnalisesNoAparelho
    const brutoV2 = await AsyncStorage.getItem(CHAVE_ANALISES_V2);
    expect(brutoV2).toBeNull();

    const brutoV1 = await AsyncStorage.getItem(CHAVE_V1);
    expect(brutoV1).not.toBeNull();
    const lidasV1 = JSON.parse(brutoV1!);

    const agora = new Date("2026-10-19T21:00:00.000Z");
    const migradas = lidasV1.map((item: unknown) => {
      const v1 = esquemaAnalise.parse(item);
      return migrarAnaliseV1(v1, agora);
    });

    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify(migradas));

    // 3. Verifica que v2 foi gravada e é válida
    const v2Gravada = await AsyncStorage.getItem(CHAVE_ANALISES_V2);
    expect(v2Gravada).not.toBeNull();
    const parsedV2 = z.array(esquemaAnaliseV2).parse(JSON.parse(v2Gravada!));
    expect(parsedV2.length).toBe(1);
    expect(parsedV2[0]?.id).toBe("teste-1");
    expect(parsedV2[0]?.bairro).toBe("casa-forte");
    expect(parsedV2[0]?.versao).toBe(2);

    // 4. Verifica que v1 continua INTACTA
    const v1Apos = await AsyncStorage.getItem(CHAVE_V1);
    expect(v1Apos).toBe(JSON.stringify(analisesV1));
  });
});

// ——— Carga item a item (a função que o provedor usa) ——————————————————————————————————————————

describe("carregarAnalises: nenhum dado anterior some", () => {
  beforeEach(async () => {
    restaurarArmazenamento();
    await AsyncStorage.clear();
  });
  afterEach(restaurarArmazenamento);

  describe("item inválido entre válidos", () => {
    it("os válidos entram, o inválido vai intacto para a quarentena e a chave do caderno não é tocada", async () => {
      const ruim = itemRuim("ruim");
      const texto = JSON.stringify([analise("a"), ruim, analise("b")]);
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, texto);

      const r = await carregarAnalises(AGORA);

      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.lista.map((a) => a.id)).toEqual(["a", "b"]);
      expect(r.quarentenadas).toBe(1);
      expect(await lerLista(CHAVE_QUARENTENA)).toEqual([ruim]);
      expect(await guardado(CHAVE_ANALISES_V2)).toBe(texto);
    });

    it("itens que não são objeto (null, número, texto) também vão para a quarentena sem derrubar a carga", async () => {
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([null, analise("a"), 42, "solto", [1, 2]]));
      const r = await carregarAnalises(AGORA);
      expect(r.ok && r.lista.map((a) => a.id)).toEqual(["a"]);
      expect(r.ok && r.quarentenadas).toBe(4);
      expect(await lerLista(CHAVE_QUARENTENA)).toEqual([null, 42, "solto", [1, 2]]);
    });

    it("carregar de novo não duplica o que já está na quarentena", async () => {
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a"), itemRuim("ruim")]));
      await carregarAnalises(AGORA);
      await carregarAnalises(new Date("2026-10-21T08:00:00.000Z"));
      const r = await carregarAnalises(new Date("2026-10-22T08:00:00.000Z"));
      expect(r.ok && r.quarentenadas).toBe(1);
      expect(await lerLista(CHAVE_QUARENTENA)).toEqual([itemRuim("ruim")]);
    });

    it("a quarentena só acrescenta: o que já estava guardado continua, na frente do novo", async () => {
      const antigo = { restoDeOutraVersao: true, id: "antigo" };
      await AsyncStorage.setItem(CHAVE_QUARENTENA, JSON.stringify([antigo]));
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a"), itemRuim("novo")]));
      const r = await carregarAnalises(AGORA);
      expect(r.ok).toBe(true);
      expect(await lerLista(CHAVE_QUARENTENA)).toEqual([antigo, itemRuim("novo")]);
    });

    it("se a quarentena existente está ilegível, copia o texto dela antes de seguir e nada se perde", async () => {
      await AsyncStorage.setItem(CHAVE_QUARENTENA, "{isto não é json");
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a"), itemRuim("novo")]));
      const r = await carregarAnalises(AGORA);
      expect(r.ok).toBe(true);
      const copias = await chavesComPrefixo(`${CHAVE_QUARENTENA}-ilegivel-`);
      expect(copias).toHaveLength(1);
      expect(await guardado(copias[0]!)).toBe("{isto não é json");
      expect(await lerLista(CHAVE_QUARENTENA)).toEqual([itemRuim("novo")]);
    });

    it("se os inválidos não podem ser guardados à parte, a carga falha e o caderno segue intocado (nada seria perdido na próxima gravação)", async () => {
      const texto = JSON.stringify([analise("a"), itemRuim("ruim")]);
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, texto);
      falharGravacaoDe(CHAVE_QUARENTENA);
      const r = await carregarAnalises(AGORA);
      expect(r).toMatchObject({ ok: false, falha: "quarentena" });
      restaurarArmazenamento();
      expect(await guardado(CHAVE_ANALISES_V2)).toBe(texto);
    });
  });

  describe("leitura bruta que falha", () => {
    it("JSON corrompido: copia o texto bruto, devolve falha e não grava nada na chave", async () => {
      const corrompido = '[{"versao":2,"id":"a","nome":"corta';
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, corrompido);

      const r = await carregarAnalises(AGORA);

      expect(r).toMatchObject({ ok: false, falha: "json_invalido", chave: CHAVE_ANALISES_V2 });
      const copia = r.ok ? null : r.copia;
      expect(copia).toBe("vereda-analises-v2-bruto-2026-10-20T15-30-00-000Z");
      expect(await guardado(copia!)).toBe(corrompido);
      expect(await guardado(CHAVE_ANALISES_V2)).toBe(corrompido);
      expect(await guardado(CHAVE_QUARENTENA)).toBeNull();
    });

    it("repetir a carga com o mesmo texto corrompido não empilha cópias iguais", async () => {
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, "[nao-json");
      await carregarAnalises(new Date("2026-10-20T15:30:00.000Z"));
      await carregarAnalises(new Date("2026-10-20T15:31:00.000Z"));
      await carregarAnalises(new Date("2026-10-21T09:00:00.000Z"));
      expect(await chavesComPrefixo("vereda-analises-v2-bruto-")).toHaveLength(1);
    });

    it("JSON válido que não é uma lista é tratado como ilegível: nenhuma migração por cima", async () => {
      const texto = JSON.stringify({ versao: 2, itens: [analise("a")] });
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, texto);
      await AsyncStorage.setItem(CHAVE_ANALISES_V1, JSON.stringify([v1Valida("antiga")]));

      const r = await carregarAnalises(AGORA);

      expect(r).toMatchObject({ ok: false, falha: "formato", chave: CHAVE_ANALISES_V2 });
      expect(await guardado(CHAVE_ANALISES_V2)).toBe(texto);
      const copia = r.ok ? null : r.copia;
      expect(copia).not.toBeNull();
      expect(await guardado(copia!)).toBe(texto);
    });

    it("erro do próprio armazenamento: falha sem cópia (não há texto) e nenhuma gravação foi tentada", async () => {
      const texto = JSON.stringify([analise("a")]);
      await AsyncStorage.setItem(CHAVE_ANALISES_V2, texto);
      falharLeituraDe(CHAVE_ANALISES_V2);
      const gravacoes = jest.spyOn(AsyncStorage, "setItem");
      gravacoes.mockClear();

      const r = await carregarAnalises(AGORA);

      expect(r).toEqual({ ok: false, falha: "armazenamento", chave: CHAVE_ANALISES_V2, copia: null });
      expect(gravacoes).not.toHaveBeenCalled();
      restaurarArmazenamento();
      expect(await guardado(CHAVE_ANALISES_V2)).toBe(texto);
      expect(await chavesComPrefixo("vereda-analises-v2-bruto")).toHaveLength(0);
    });

    it("v1 corrompida e sem v2: falha, copia o texto da v1 e não cria a v2", async () => {
      await AsyncStorage.setItem(CHAVE_ANALISES_V1, "[{quebrado");
      const r = await carregarAnalises(AGORA);
      expect(r).toMatchObject({ ok: false, falha: "json_invalido", chave: CHAVE_ANALISES_V1 });
      expect(await guardado(CHAVE_ANALISES_V1)).toBe("[{quebrado");
      expect(await guardado(CHAVE_ANALISES_V2)).toBeNull();
      expect(await chavesComPrefixo("vereda-analises-v1-bruto-")).toHaveLength(1);
    });
  });

  describe("migração v1 -> v2 item a item", () => {
    it("um item ruim entre bons: os bons migram, o ruim vai intacto para a quarentena e a v1 não muda", async () => {
      const boa1 = v1Valida("boa-1");
      const boa2 = v1Valida("boa-2", { tipo: "compra", preco: 900000 });
      const fora_do_esquema = { id: "lixo", nome: "", preco: "muito" };
      const textoV1 = JSON.stringify([boa1, fora_do_esquema, boa2]);
      await AsyncStorage.setItem(CHAVE_ANALISES_V1, textoV1);

      const r = await carregarAnalises(AGORA);

      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.lista.map((a) => a.id)).toEqual(["boa-1", "boa-2"]);
      expect(r).toMatchObject({ quarentenadas: 1, migradas: 2 });
      expect(await lerLista(CHAVE_QUARENTENA)).toEqual([fora_do_esquema]);
      expect(z.array(esquemaAnaliseV2).parse(await lerLista(CHAVE_ANALISES_V2)).map((a) => a.id)).toEqual(["boa-1", "boa-2"]);
      expect(await guardado(CHAVE_ANALISES_V1)).toBe(textoV1);
    });

    it("item da v1 que passa no esquema da v1 mas faz a migração lançar também vai para a quarentena", async () => {
      // `id` livre na v1; a v2 só aceita [a-z0-9-]
      const lanca = v1Valida("ID com Espaço e Maiúsculas");
      expect(esquemaAnalise.safeParse(lanca).success).toBe(true);
      expect(() => migrarAnaliseV1(esquemaAnalise.parse(lanca), AGORA)).toThrow();
      const textoV1 = JSON.stringify([lanca, v1Valida("boa")]);
      await AsyncStorage.setItem(CHAVE_ANALISES_V1, textoV1);

      const r = await carregarAnalises(AGORA);

      expect(r.ok && r.lista.map((a) => a.id)).toEqual(["boa"]);
      expect(await lerLista(CHAVE_QUARENTENA)).toEqual([lanca]);
      expect(await guardado(CHAVE_ANALISES_V1)).toBe(textoV1);
    });

    it("v1 só com itens ruins: lista vazia, tudo na quarentena, v1 intacta", async () => {
      const textoV1 = JSON.stringify([{ a: 1 }, { b: 2 }]);
      await AsyncStorage.setItem(CHAVE_ANALISES_V1, textoV1);
      const r = await carregarAnalises(AGORA);
      expect(r).toMatchObject({ ok: true, quarentenadas: 2, migradas: 0 });
      expect(await lerLista(CHAVE_QUARENTENA)).toEqual([{ a: 1 }, { b: 2 }]);
      expect(await guardado(CHAVE_ANALISES_V1)).toBe(textoV1);
    });

    it("se a v2 não pôde ser gravada, a v1 e a quarentena ficam, e a carga seguinte refaz tudo sem duplicar", async () => {
      const ruim = { id: "ruim" };
      const textoV1 = JSON.stringify([v1Valida("boa"), ruim]);
      await AsyncStorage.setItem(CHAVE_ANALISES_V1, textoV1);
      falharGravacaoDe(CHAVE_ANALISES_V2);

      const falha = await carregarAnalises(AGORA);
      expect(falha).toMatchObject({ ok: false, falha: "gravacao" });
      restaurarArmazenamento();
      expect(await guardado(CHAVE_ANALISES_V2)).toBeNull();
      expect(await guardado(CHAVE_ANALISES_V1)).toBe(textoV1);

      const r = await carregarAnalises(new Date("2026-10-21T08:00:00.000Z"));
      expect(r.ok && r.lista.map((a) => a.id)).toEqual(["boa"]);
      expect(await lerLista(CHAVE_QUARENTENA)).toEqual([ruim]);
    });

    it("sem v2 e sem v1: caderno vazio e nenhuma gravação", async () => {
      const r = await carregarAnalises(AGORA);
      expect(r).toEqual({ ok: true, lista: [], quarentenadas: 0, migradas: 0 });
      expect(await chavesDoApp()).toEqual([]);
    });
  });
});

// ——— O provedor de verdade ————————————————————————————————————————————————————————————————————

type Contexto = ReturnType<typeof useAnalises>;
let contexto!: Contexto;
function Sonda() {
  const c = useAnalises();
  useEffect(() => {
    contexto = c;
  });
  return null;
}
const arvore = () => React.createElement(AnalisesNoAparelho, null, React.createElement(Sonda));

/** Monta e espera a carga terminar (`pronto`). */
async function montar(): Promise<TestRenderer.ReactTestRenderer> {
  let renderizador!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderizador = TestRenderer.create(arvore());
  });
  for (let i = 0; i < 50 && !contexto.pronto; i += 1) {
    await act(async () => {
      await new Promise((resolver) => setTimeout(resolver, 0));
    });
  }
  expect(contexto.pronto).toBe(true);
  return renderizador;
}

/** Devolve o motivo da rejeição, ou `null` se a promessa resolveu. */
async function rejeicaoDe(promessa: Promise<unknown>): Promise<string | null> {
  let motivo: string | null = null;
  await act(async () => {
    try {
      await promessa;
    } catch (e) {
      motivo = e instanceof Error ? e.message : String(e);
    }
  });
  return motivo;
}

describe("AnalisesNoAparelho: o caderno nunca é apagado por uma carga que falhou", () => {
  beforeEach(async () => {
    restaurarArmazenamento();
    await AsyncStorage.clear();
    contexto = undefined as unknown as Contexto;
  });
  afterEach(restaurarArmazenamento);

  it("edições complementares concorrentes usam a lista atual e visita antiga não as apaga", async () => {
    const a = analise("a");
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([a]));
    const arvore = await montar();
    await act(async () => {
      await Promise.all([
        contexto.atualizar("a", x => ({ ...x, caderno: { ...(x.caderno ?? cadernoVazio()), decisao: "visitado" } })),
        contexto.atualizar("a", x => ({ ...x, caderno: { ...(x.caderno ?? cadernoVazio()), diario: [{ id: "d1", em: INSTANTE, texto: "Anotação preservada" }] } })),
      ]);
      await contexto.salvar({ ...a, visita: { ...a.visita, notas: "Espelho de visita antigo" } });
    });
    expect(contexto.lista[0]?.caderno).toMatchObject({ decisao: "visitado", diario: [{ texto: "Anotação preservada" }] });
    expect(contexto.lista[0]?.visita.notas).toBe("Espelho de visita antigo");
    await act(async () => arvore.unmount());
  });

  it("importação revisada é atômica e recusa revisão antiga se o caderno mudou", async () => {
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a")]));
    const arvore = await montar();
    const revisao = planejarImportacao(contexto.lista, [analise("b")]);
    await act(async () => { await contexto.salvar(analise("c")); });
    expect(await rejeicaoDe(contexto.importar(revisao))).toContain("caderno mudou");
    expect(contexto.lista.map(x => x.id)).toEqual(["c", "a"]);
    const atual = planejarImportacao(contexto.lista, [analise("b")]);
    falharGravacaoDe(CHAVE_ANALISES_V2);
    expect(await rejeicaoDe(contexto.importar(atual))).not.toBeNull();
    expect(contexto.lista.map(x => x.id)).toEqual(["c", "a"]);
    restaurarArmazenamento();
    await act(async () => { await contexto.importar(atual); });
    expect(contexto.lista.map(x => x.id)).toEqual(["c", "a", "b"]);
    await act(async () => arvore.unmount());
  });

  it("item inválido entre válidos: abre os válidos, avisa quantas ficaram de fora e salvar não apaga a quarentena", async () => {
    const ruim = itemRuim("ruim");
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a"), ruim, analise("b")]));
    await montar();

    expect(contexto.lista.map((a) => a.id)).toEqual(["a", "b"]);
    expect(contexto.erro).toBe("");
    expect(contexto.bloqueada).toBe(false);
    expect(contexto.aviso).toBe("1 análise não pôde ser aberta e foi guardada à parte. As outras continuam no seu caderno.");

    await act(async () => {
      await contexto.salvar(analise("c"));
    });

    expect(z.array(esquemaAnaliseV2).parse(await lerLista(CHAVE_ANALISES_V2)).map((a) => a.id)).toEqual(["c", "a", "b"]);
    expect(await lerLista(CHAVE_QUARENTENA)).toEqual([ruim]);
  });

  it("dois itens ruins: a frase fica no plural, em linguagem de gente", async () => {
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([itemRuim("x"), analise("a"), itemRuim("y")]));
    await montar();
    expect(contexto.aviso).toBe("2 análises não puderam ser abertas e foram guardadas à parte. As outras continuam no seu caderno.");
    expect(contexto.aviso).not.toMatch(/json|esquema|quarentena|schema/i);
  });

  it("caderno só com itens ruins: o aviso não promete que 'as outras' continuam", async () => {
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([itemRuim("x"), itemRuim("y"), itemRuim("z")]));
    await montar();
    expect(contexto.lista).toEqual([]);
    expect(contexto.aviso).toBe("3 análises não puderam ser abertas e foram guardadas à parte.");
    expect(await lerLista(CHAVE_QUARENTENA)).toHaveLength(3);
  });

  it("JSON corrompido: bloqueia salvar e remover, não grava nada por cima e guarda uma cópia do texto", async () => {
    const corrompido = '[{"versao":2,"id":"a","nome":"Meu apartamento qu';
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, corrompido);
    await AsyncStorage.setItem(CHAVE_ATIVA, "a");
    await montar();

    expect(contexto.bloqueada).toBe(true);
    expect(contexto.lista).toEqual([]);
    expect(contexto.erro).toContain("Nada foi apagado nem gravado por cima");
    expect(contexto.erro).toContain("Uma cópia do conteúdo original ficou guardada à parte");
    expect(contexto.erro).not.toMatch(/json|esquema|quarentena/i);

    const aoSalvar = await rejeicaoDe(contexto.salvar(analise("nova")));
    const aoRemover = await rejeicaoDe(contexto.remover("a"));
    await act(async () => {
      await contexto.definirAtiva("nova");
    });

    expect(aoSalvar).toContain("nada foi gravado");
    expect(aoRemover).toContain("nada foi gravado");
    expect(await guardado(CHAVE_ANALISES_V2)).toBe(corrompido);
    expect(await guardado(CHAVE_ATIVA)).toBe("a");
    const copias = await chavesComPrefixo("vereda-analises-v2-bruto-");
    expect(copias).toHaveLength(1);
    expect(await guardado(copias[0]!)).toBe(corrompido);
  });

  it("erro do armazenamento na leitura: bloqueia, não diz que há cópia e a chave não recebe gravação nenhuma", async () => {
    const texto = JSON.stringify([analise("a")]);
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, texto);
    falharLeituraDe(CHAVE_ANALISES_V2);
    await montar();

    expect(contexto.bloqueada).toBe(true);
    expect(contexto.erro).not.toContain("cópia");
    expect(await rejeicaoDe(contexto.salvar(analise("nova")))).not.toBeNull();

    restaurarArmazenamento();
    expect(await guardado(CHAVE_ANALISES_V2)).toBe(texto);
  });

  it("recarregar depois de a leitura voltar a funcionar abre o caderno e libera as gravações", async () => {
    const texto = JSON.stringify([analise("a"), analise("b")]);
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, texto);
    falharLeituraDe(CHAVE_ANALISES_V2);
    await montar();
    expect(contexto.bloqueada).toBe(true);

    restaurarArmazenamento();
    await act(async () => {
      await contexto.recarregar();
    });

    expect(contexto.bloqueada).toBe(false);
    expect(contexto.erro).toBe("");
    expect(contexto.lista.map((a) => a.id)).toEqual(["a", "b"]);
    await act(async () => {
      await contexto.salvar(analise("c"));
    });
    expect((await lerLista(CHAVE_ANALISES_V2)).map((a) => (a as { id: string }).id)).toEqual(["c", "a", "b"]);
  });

  it("salvar pedido antes de a carga terminar espera a carga e não passa por cima do que estava guardado", async () => {
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a")]));
    act(() => {
      TestRenderer.create(arvore());
    });
    // a leitura do disco ainda não terminou aqui
    expect(contexto.pronto).toBe(false);
    const salvando = contexto.salvar(analise("b"));
    expect(await rejeicaoDe(salvando)).toBeNull();
    expect((await lerLista(CHAVE_ANALISES_V2)).map((a) => (a as { id: string }).id)).toEqual(["b", "a"]);
  });

  it("salvar pedido antes da carga, com o caderno corrompido, é recusado em vez de gravar por cima", async () => {
    const corrompido = "[[[ nao e json";
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, corrompido);
    act(() => {
      TestRenderer.create(arvore());
    });
    expect(contexto.pronto).toBe(false);
    const salvando = contexto.salvar(analise("b"));
    expect(await rejeicaoDe(salvando)).toContain("nada foi gravado");
    expect(await guardado(CHAVE_ANALISES_V2)).toBe(corrompido);
  });

  it("v1 com um item ruim: abre os bons, avisa, e a v1 e a quarentena guardam tudo", async () => {
    const ruim = { id: "ruim", nome: 123 };
    const textoV1 = JSON.stringify([v1Valida("boa"), ruim]);
    await AsyncStorage.setItem(CHAVE_ANALISES_V1, textoV1);
    await montar();

    expect(contexto.lista.map((a) => a.id)).toEqual(["boa"]);
    expect(contexto.aviso).toBe("1 análise não pôde ser aberta e foi guardada à parte. As outras continuam no seu caderno.");
    expect(await guardado(CHAVE_ANALISES_V1)).toBe(textoV1);
    expect(await lerLista(CHAVE_QUARENTENA)).toEqual([ruim]);
    // e depois de salvar nada disso muda
    await act(async () => {
      await contexto.salvar(analise("nova"));
    });
    expect(await guardado(CHAVE_ANALISES_V1)).toBe(textoV1);
    expect(await lerLista(CHAVE_QUARENTENA)).toEqual([ruim]);
  });

  it("falha só na seleção ativa não rejeita conteúdo já salvo; reabrir recupera a análise", async () => {
    await montar();
    falharGravacaoDe(CHAVE_ATIVA);
    expect(await rejeicaoDe(contexto.salvar(analise("nova")))).toBeNull();
    expect(contexto.lista.map((a) => a.id)).toEqual(["nova"]);
    expect(contexto.ativa).toBe("nova");
    expect(contexto.aviso).toContain("seleção");
    expect((await lerLista(CHAVE_ANALISES_V2)).map((a) => (a as AnaliseV2).id)).toEqual(["nova"]);
    await act(async () => { await contexto.recarregar(); });
    expect(contexto.ativa).toBe("nova");
    expect(contexto.bloqueada).toBe(false);
    restaurarArmazenamento();
    await act(async () => { await contexto.salvar(analise("nova")); });
    expect(contexto.lista).toHaveLength(1);
    expect(await guardado(CHAVE_ATIVA)).toBe("nova");
  });

  it("falha da lista rejeita sem alterar memória nem seleção e a fila continua utilizável", async () => {
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a")]));
    await montar();
    falharGravacaoDe(CHAVE_ANALISES_V2);
    expect(await rejeicaoDe(contexto.salvar(analise("b")))).not.toBeNull();
    expect(contexto.lista.map((a) => a.id)).toEqual(["a"]);
    expect(contexto.ativa).toBe("a");
    restaurarArmazenamento();
    await act(async () => { await contexto.salvar(analise("b")); });
    expect(contexto.lista.map((a) => a.id)).toEqual(["b", "a"]);
  });

  it("remover a ativa preserva exclusão e fallback mesmo se falhar a preferência", async () => {
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a"), analise("b")]));
    await AsyncStorage.setItem(CHAVE_ATIVA, "a");
    await montar();
    falharGravacaoDe(CHAVE_ATIVA);
    expect(await rejeicaoDe(contexto.remover("a"))).toBeNull();
    expect(contexto.ativa).toBe("b");
    await act(async () => { await contexto.recarregar(); });
    expect(contexto.lista.map((a) => a.id)).toEqual(["b"]);
    expect(contexto.ativa).toBe("b");
  });

  it("salvamentos e seleção concorrentes aguardam inclusive a preferência, na ordem solicitada", async () => {
    await montar();
    let liberar!: () => void;
    const pausa = new Promise<void>((r) => { liberar = r; });
    simulado.setItem.mockImplementation(async (k, ...resto) => {
      if (k === CHAVE_ATIVA && resto[0] === "a") await pausa;
      return gravacaoOriginal(k, ...resto);
    });
    let terminou = false;
    await act(async () => {
      const a = contexto.salvar(analise("a"));
      const b = contexto.salvar(analise("b")).then(() => { terminou = true; });
      const selecao = contexto.definirAtiva("a");
      await new Promise((r) => setTimeout(r, 0));
      expect(terminou).toBe(false);
      liberar();
      await Promise.all([a, b, selecao]);
    });
    expect(contexto.lista.map((a) => a.id)).toEqual(["b", "a"]);
    expect(contexto.ativa).toBe("a");
    expect(await guardado(CHAVE_ATIVA)).toBe("a");
  });

  it("falha ao remover ponteiro da última análise não rejeita a exclusão; reabertura fica vazia", async () => {
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a")]));
    await AsyncStorage.setItem(CHAVE_ATIVA, "a");
    await montar();
    simulado.removeItem.mockImplementation(async (k, ...resto) => {
      if (k === CHAVE_ATIVA) throw new Error("falha de preferência");
      return remocaoOriginal(k, ...resto);
    });
    expect(await rejeicaoDe(contexto.remover("a"))).toBeNull();
    expect(contexto.lista).toEqual([]);
    expect(contexto.ativa).toBeNull();
    expect(contexto.aviso).toContain("seleção");
    await act(async () => { await contexto.recarregar(); });
    expect(contexto.ativa).toBeNull();
    expect(contexto.bloqueada).toBe(false);
    restaurarArmazenamento();
    await act(async () => { await contexto.recarregar(); });
    expect(await guardado(CHAVE_ATIVA)).toBeNull();
  });

  it("ponteiro inválido é reparado e seleção pedida para item inexistente não entra no contexto", async () => {
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a")]));
    await AsyncStorage.setItem(CHAVE_ATIVA, "removida");
    await montar();
    expect(contexto.ativa).toBe("a");
    expect(await guardado(CHAVE_ATIVA)).toBe("a");
    await act(async () => { await contexto.definirAtiva("inexistente"); });
    expect(contexto.ativa).toBe("a");
    await act(async () => { await contexto.remover("a"); });
    expect(contexto.ativa).toBeNull();
    expect(await guardado(CHAVE_ATIVA)).toBeNull();
  });

  it("caderno saudável: sem aviso, sem erro, salvar e remover funcionam e o ponteiro da análise ativa é lembrado", async () => {
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("a"), analise("b")]));
    await AsyncStorage.setItem(CHAVE_ATIVA, "b");
    await montar();
    expect(contexto.aviso).toBe("");
    expect(contexto.erro).toBe("");
    expect(contexto.ativa).toBe("b");
    await act(async () => {
      await contexto.remover("a");
    });
    expect(contexto.lista.map((a) => a.id)).toEqual(["b"]);
    expect(await guardado(CHAVE_QUARENTENA)).toBeNull();
  });
});
