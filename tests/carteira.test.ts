// Carteira de créditos: o +1 do descarte só vale para análise que consumiu crédito (e uma vez), e o corte do extrato em
// 500 linhas nunca perde as linhas que provam isso. E a regra de ferro da persistência: nada grava por cima de uma
// carteira guardada que não pôde ser lida. Toda análise daqui é sintética.
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React, { useEffect } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { CHAVE_CARTEIRA, esquemaCarteira, type Carteira } from "../src/dados/contratos";
import { LIMITE_DO_EXTRATO, creditarDescarteNaCarteira, limitarExtrato } from "../src/dados/descarte";
import { CarteiraNoAparelho, PREFIXO_BRUTO_CARTEIRA, carregarCarteira, useCarteira } from "../src/estado/Carteira";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

type Movimento = Carteira["extrato"][number];

/** Cada linha ganha um instante próprio (o índice vira os segundos), para o teste saber quem é quem depois do corte. */
const instante = (n: number) => `2026-10-20T12:${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}.000Z`;
const recarga = (n: number): Movimento => ({ em: instante(n), tipo: "recarga_de_teste", analiseId: null, delta: 3 });
const dossie = (analiseId: string, n = 0): Movimento => ({ em: instante(n), tipo: "dossie_cadastral", analiseId, delta: -1 });
const descarte = (analiseId: string, n = 0): Movimento => ({ em: instante(n), tipo: "descarte", analiseId, delta: 1 });
const cota: Movimento = { em: instante(0), tipo: "cota_inicial", analiseId: null, delta: 3 };
const carteiraCom = (saldo: number, extrato: Carteira["extrato"]): Carteira => ({ saldo, extrato });
const tipos = (extrato: Carteira["extrato"], tipo: Movimento["tipo"]) => extrato.filter((m) => m.tipo === tipo);

describe("limitarExtrato", () => {
  it("o teto é o do contrato (500 linhas)", () => {
    expect(LIMITE_DO_EXTRATO).toBe(500);
    const cheio = Array.from({ length: 500 }, (_, i) => recarga(i));
    expect(esquemaCarteira.safeParse(carteiraCom(10, cheio)).success).toBe(true);
    expect(esquemaCarteira.safeParse(carteiraCom(10, [...cheio, recarga(500)])).success).toBe(false);
  });

  it("extrato que cabe volta o mesmo array", () => {
    const extrato = [dossie("a"), cota];
    expect(limitarExtrato(extrato)).toBe(extrato);
    const justo = Array.from({ length: 500 }, (_, i) => recarga(i));
    expect(limitarExtrato(justo)).toBe(justo);
  });

  it("corta as recargas de teste mais antigas primeiro e guarda dossiê e descarte, mesmo os mais antigos de todos", () => {
    // mais recente primeiro; no fim (o mais antigo de todos) ficam o dossiê e o descarte da análise "velha"
    const extrato: Movimento[] = [
      ...Array.from({ length: 510 }, (_, i) => recarga(1000 - i)),
      descarte("velha", 2),
      dossie("velha", 1),
    ];
    expect(extrato).toHaveLength(512);
    const cortado = limitarExtrato(extrato);
    expect(cortado).toHaveLength(500);
    expect(tipos(cortado, "dossie_cadastral")).toEqual([dossie("velha", 1)]);
    expect(tipos(cortado, "descarte")).toEqual([descarte("velha", 2)]);
    // saíram as 12 recargas mais antigas (as últimas das 510), e as que ficam seguem na mesma ordem
    expect(tipos(cortado, "recarga_de_teste")).toEqual(extrato.slice(0, 498));
    expect(cortado.slice(0, 498)).toEqual(extrato.slice(0, 498));
  });

  it("recargas mais novas ficam na frente das mais antigas quando só algumas precisam sair", () => {
    const extrato: Movimento[] = [recarga(900), dossie("a", 899), recarga(800), recarga(700), descarte("b", 600), recarga(500)];
    const cortado = limitarExtrato(extrato, 4);
    expect(cortado).toEqual([recarga(900), dossie("a", 899), recarga(800), descarte("b", 600)]);
    // a de 700 não saiu antes da de 500 por acaso: sai primeiro a mais antiga
    expect(limitarExtrato(extrato, 5)).toEqual([recarga(900), dossie("a", 899), recarga(800), recarga(700), descarte("b", 600)]);
  });

  it("depois das recargas sai a cota inicial, e só por último as linhas de dossiê e descarte", () => {
    const base: Movimento[] = [dossie("a", 30), descarte("a", 31), recarga(20), cota];
    expect(limitarExtrato(base, 3)).toEqual([dossie("a", 30), descarte("a", 31), cota]);
    expect(limitarExtrato(base, 2)).toEqual([dossie("a", 30), descarte("a", 31)]);
    // sem nada para cortar além das protegidas (o contrato não comporta 501 delas): saem as mais antigas
    const protegidas: Movimento[] = Array.from({ length: 501 }, (_, i) => (i % 2 === 0 ? dossie(`a${i}`, i) : descarte(`a${i}`, i)));
    const cortado = limitarExtrato(protegidas);
    expect(cortado).toHaveLength(500);
    expect(cortado).toEqual(protegidas.slice(0, 500));
  });

  it("não muda o extrato recebido", () => {
    const extrato: Movimento[] = [...Array.from({ length: 505 }, (_, i) => recarga(i)), dossie("a")];
    const copia = JSON.stringify(extrato);
    limitarExtrato(extrato);
    expect(JSON.stringify(extrato)).toBe(copia);
  });

  it("creditarDescarteNaCarteira, com o extrato cheio, ainda respeita o teto e mantém o dossiê", () => {
    const extrato: Movimento[] = [...Array.from({ length: 499 }, (_, i) => recarga(1000 - i)), dossie("a", 1)];
    const depois = creditarDescarteNaCarteira(carteiraCom(5, extrato), "a", new Date("2026-10-20T15:30:00.000Z"));
    expect(depois.extrato).toHaveLength(500);
    expect(depois.extrato[0]).toMatchObject({ tipo: "descarte", analiseId: "a", delta: 1 });
    expect(tipos(depois.extrato, "dossie_cadastral")).toEqual([dossie("a", 1)]);
    expect(esquemaCarteira.safeParse(depois).success).toBe(true);
  });
});

// ——— O provedor de verdade, com o armazenamento simulado ——————————————————————————————————————

type Contexto = ReturnType<typeof useCarteira>;
let contexto!: Contexto;
function Sonda() {
  const c = useCarteira();
  useEffect(() => {
    contexto = c;
  });
  return null;
}

async function montar(): Promise<void> {
  await act(async () => {
    TestRenderer.create(React.createElement(CarteiraNoAparelho, null, React.createElement(Sonda)));
  });
}

async function guardar(c: Carteira): Promise<void> {
  await AsyncStorage.setItem(CHAVE_CARTEIRA, JSON.stringify(c));
}

async function gravada(): Promise<Carteira> {
  return esquemaCarteira.parse(JSON.parse((await AsyncStorage.getItem(CHAVE_CARTEIRA)) as string));
}

describe("carteira: +1 do descarte só para análise que consumiu crédito", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("sem dossiê da análise no extrato, creditarDescarte devolve false, o saldo fica e nada é regravado", async () => {
    await montar();
    expect(contexto.saldo).toBe(3);
    const antes = await AsyncStorage.getItem(CHAVE_CARTEIRA);
    let creditou = true;
    await act(async () => {
      creditou = await contexto.creditarDescarte("nunca-pagou");
    });
    expect(creditou).toBe(false);
    expect(contexto.saldo).toBe(3);
    expect(tipos(contexto.carteira.extrato, "descarte")).toHaveLength(0);
    expect(await AsyncStorage.getItem(CHAVE_CARTEIRA)).toBe(antes);
  });

  it("o dossiê de uma análise não dá direito ao +1 de outra", async () => {
    await guardar(carteiraCom(2, [dossie("a", 1), cota]));
    await montar();
    let creditou = true;
    await act(async () => {
      creditou = await contexto.creditarDescarte("b");
    });
    expect(creditou).toBe(false);
    expect(contexto.saldo).toBe(2);
  });

  it("confirmar o prédio (-1) e descartar (+1) devolve o crédito uma única vez, mesmo com chamadas repetidas", async () => {
    await montar();
    let debitou = false;
    await act(async () => {
      debitou = await contexto.debitarDossie("a");
    });
    expect(debitou).toBe(true);
    expect(contexto.saldo).toBe(2);
    let resultados: boolean[] = [];
    await act(async () => {
      resultados = await Promise.all([
        contexto.creditarDescarte("a"),
        contexto.creditarDescarte("a"),
        contexto.creditarDescarte("a"),
      ]);
    });
    expect(resultados).toEqual([true, false, false]);
    await act(async () => {
      expect(await contexto.creditarDescarte("a")).toBe(false);
    });
    expect(contexto.saldo).toBe(3);
    const noDisco = await gravada();
    expect(noDisco.saldo).toBe(3);
    expect(tipos(noDisco.extrato, "dossie_cadastral")).toHaveLength(1);
    expect(tipos(noDisco.extrato, "descarte")).toHaveLength(1);
  });
});

describe("carteira: o corte do extrato em 500 linhas", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  /** 500 linhas: 499 recargas de teste e, no fim (a mais antiga de todas), o dossiê de "antiga". */
  const extratoCheioComDossieNoFim = (): Movimento[] => [
    ...Array.from({ length: 499 }, (_, i) => recarga(1000 - i)),
    dossie("antiga", 1),
  ];

  it("uma recarga de teste com o extrato cheio tira a recarga mais antiga, não o dossiê; o +1 da análise antiga ainda vale", async () => {
    await guardar(carteiraCom(10, extratoCheioComDossieNoFim()));
    await montar();
    await act(async () => {
      await contexto.recarregarTeste();
    });
    expect(contexto.carteira.extrato).toHaveLength(500);
    expect(contexto.carteira.extrato[0]).toMatchObject({ tipo: "recarga_de_teste", delta: 3 });
    expect(tipos(contexto.carteira.extrato, "dossie_cadastral")).toEqual([dossie("antiga", 1)]);
    // a mais antiga das recargas (a de instante 1000 - 498) saiu
    expect(contexto.carteira.extrato.some((m) => m.em === instante(1000 - 498))).toBe(false);
    let creditou = false;
    await act(async () => {
      creditou = await contexto.creditarDescarte("antiga");
    });
    expect(creditou).toBe(true);
    expect(contexto.saldo).toBe(10 + 3 + 1);
    const noDisco = await gravada();
    expect(noDisco.extrato).toHaveLength(500);
    expect(noDisco.saldo).toBe(14);
    expect(tipos(noDisco.extrato, "descarte")).toHaveLength(1);
    expect(tipos(noDisco.extrato, "dossie_cadastral")).toEqual([dossie("antiga", 1)]);
  });

  it("confirmar um prédio com o extrato cheio não tira o dossiê nem o descarte antigos, e o descarte antigo não credita outra vez", async () => {
    const extrato: Movimento[] = [
      ...Array.from({ length: 497 }, (_, i) => recarga(1000 - i)),
      descarte("velha", 3),
      dossie("velha", 2),
      cota,
    ];
    expect(extrato).toHaveLength(500);
    await guardar(carteiraCom(20, extrato));
    await montar();
    await act(async () => {
      await contexto.debitarDossie("nova");
    });
    const depois = contexto.carteira.extrato;
    expect(depois).toHaveLength(500);
    expect(depois[0]).toMatchObject({ tipo: "dossie_cadastral", analiseId: "nova", delta: -1 });
    expect(tipos(depois, "descarte")).toEqual([descarte("velha", 3)]);
    expect(tipos(depois, "dossie_cadastral").map((m) => m.analiseId)).toEqual(["nova", "velha"]);
    // só 1 linha passou do teto: saiu a recarga mais antiga, e a cota inicial (a última do extrato) ficou
    expect(depois.some((m) => m.tipo === "cota_inicial")).toBe(true);
    expect(tipos(depois, "recarga_de_teste")).toHaveLength(496);
    let creditou = true;
    await act(async () => {
      creditou = await contexto.creditarDescarte("velha");
    });
    expect(creditou).toBe(false);
    expect(contexto.saldo).toBe(19);
    const noDisco = await gravada();
    expect(noDisco.saldo).toBe(19);
    expect(noDisco.extrato).toHaveLength(500);
  });

  it("recargas repetidas por cima do teto nunca apagam o dossiê nem a cota inicial enquanto houver recarga para cortar", async () => {
    await guardar(carteiraCom(10, [...Array.from({ length: 496 }, (_, i) => recarga(1000 - i)), dossie("a", 1), cota]));
    await montar();
    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        await contexto.recarregarTeste();
      });
    }
    expect(contexto.saldo).toBe(25);
    expect(contexto.carteira.extrato).toHaveLength(500);
    expect(tipos(contexto.carteira.extrato, "dossie_cadastral")).toEqual([dossie("a", 1)]);
    expect(tipos(contexto.carteira.extrato, "cota_inicial")).toEqual([cota]);
    expect(tipos(await gravada().then((c) => c.extrato), "dossie_cadastral")).toEqual([dossie("a", 1)]);
    let creditou = false;
    await act(async () => {
      creditou = await contexto.creditarDescarte("a");
    });
    expect(creditou).toBe(true);
  });
});

// ——— A carteira guardada que não pode ser lida nunca é apagada ————————————————————————————————————

type FnSimulada = {
  mockImplementation: (fn: (chave: string, ...resto: unknown[]) => Promise<unknown>) => unknown;
  getMockImplementation: () => ((chave: string, ...resto: unknown[]) => Promise<unknown>) | undefined;
};
const simulado = AsyncStorage as unknown as { getItem: FnSimulada; setItem: FnSimulada };
const leituraOriginal = simulado.getItem.getMockImplementation()!;
const gravacaoOriginal = simulado.setItem.getMockImplementation()!;

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
};

const guardado = (chave: string) => AsyncStorage.getItem(chave);
const copiasBrutas = async () => (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(`${PREFIXO_BRUTO_CARTEIRA}-`)).sort();
/** Quantas vezes algo foi gravado na chave da carteira desde o último `mockClear`. */
const gravacoesNaCarteira = () =>
  jest.spyOn(AsyncStorage, "setItem").mock.calls.filter(([chave]) => chave === CHAVE_CARTEIRA).length;

/** Monta e espera a carga terminar (`pronto`). */
async function montarEEsperar(): Promise<TestRenderer.ReactTestRenderer> {
  let renderizador!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderizador = TestRenderer.create(React.createElement(CarteiraNoAparelho, null, React.createElement(Sonda)));
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

const GUARDADA_VALIDA = carteiraCom(7, [dossie("a", 1), cota]);

describe("carteira: leitura que falha bloqueia e nunca grava por cima", () => {
  beforeEach(async () => {
    restaurarArmazenamento();
    await AsyncStorage.clear();
    jest.spyOn(AsyncStorage, "setItem").mockClear();
    contexto = undefined as unknown as Contexto;
  });
  afterEach(restaurarArmazenamento);

  /** Os três jeitos de a carteira guardada não abrir. `texto` é o que está na chave; `null` = o armazenamento falha ao ler. */
  const cenarios: { nome: string; texto: string | null; falha: "json_invalido" | "formato" | "armazenamento" }[] = [
    { nome: "JSON corrompido (cortado no meio)", texto: '{"saldo":7,"extrato":[{"em":"2026-10-20T12:00:00.0', falha: "json_invalido" },
    { nome: "texto só com espaços (não é JSON)", texto: "   ", falha: "json_invalido" },
    { nome: "fora do esquema: saldo negativo", texto: JSON.stringify({ saldo: -4, extrato: [] }), falha: "formato" },
    { nome: "fora do esquema: sem extrato", texto: JSON.stringify({ saldo: 7 }), falha: "formato" },
    { nome: "fora do esquema: campo a mais", texto: JSON.stringify({ saldo: 7, extrato: [], bonus: 100 }), falha: "formato" },
    { nome: "fora do esquema: saldo em texto", texto: JSON.stringify({ saldo: "7", extrato: [] }), falha: "formato" },
    { nome: "fora do esquema: nem é um objeto", texto: JSON.stringify([7]), falha: "formato" },
    { nome: "fora do esquema: o texto null", texto: "null", falha: "formato" },
    { nome: "erro de leitura do armazenamento", texto: null, falha: "armazenamento" },
  ];

  for (const { nome, texto, falha } of cenarios) {
    describe(nome, () => {
      /** Prepara o cenário: com `texto` guarda ele na chave; sem, guarda uma carteira boa e faz a leitura falhar. */
      async function preparar(): Promise<string> {
        const noDisco = texto ?? JSON.stringify(GUARDADA_VALIDA);
        await AsyncStorage.setItem(CHAVE_CARTEIRA, noDisco);
        if (texto === null) falharLeituraDe(CHAVE_CARTEIRA);
        jest.spyOn(AsyncStorage, "setItem").mockClear();
        return noDisco;
      }

      it("carregarCarteira devolve a falha, copia o texto bruto (quando há texto) e não toca na chave", async () => {
        const noDisco = await preparar();
        const r = await carregarCarteira(new Date("2026-10-20T15:30:00.000Z"));
        expect(r).toMatchObject({ ok: false, falha, chave: CHAVE_CARTEIRA });
        const copia = r.ok ? "x" : r.copia;
        if (texto === null) {
          expect(copia).toBeNull();
        } else {
          expect(copia).toBe("vereda-carteira-v1-bruto-2026-10-20T15-30-00-000Z");
          expect(await guardado(copia!)).toBe(texto);
        }
        expect(gravacoesNaCarteira()).toBe(0);
        restaurarArmazenamento();
        expect(await guardado(CHAVE_CARTEIRA)).toBe(noDisco);
      });

      it("o provedor bloqueia debitar, creditar e recarregar com erro claro, e a chave guardada continua idêntica", async () => {
        const noDisco = await preparar();
        await montarEEsperar();

        expect(contexto.bloqueada).toBe(true);
        expect(contexto.pronto).toBe(true);
        expect(contexto.erro).toContain("Nada foi apagado nem gravado por cima");
        expect(contexto.erro).not.toMatch(/json|esquema|schema|quarentena/i);
        expect(contexto.erro.includes("cópia")).toBe(texto !== null);
        // nada de carteira inventada: nem o saldo inicial de 3 nem o extrato da cota inicial
        expect(contexto.saldo).toBe(0);
        expect(contexto.carteira).toEqual({ saldo: 0, extrato: [] });

        const aoDebitar = await rejeicaoDe(contexto.debitarDossie("a"));
        const aoCreditar = await rejeicaoDe(contexto.creditarDescarte("a"));
        const aoRecarregar = await rejeicaoDe(contexto.recarregarTeste());
        for (const motivo of [aoDebitar, aoCreditar, aoRecarregar]) {
          expect(motivo).toContain("nada foi gravado");
          expect(motivo).toContain("Recarregue o app");
        }

        expect(contexto.saldo).toBe(0);
        expect(gravacoesNaCarteira()).toBe(0);
        restaurarArmazenamento();
        expect(await guardado(CHAVE_CARTEIRA)).toBe(noDisco);
        // a cópia do texto bruto existe só quando o armazenamento chegou a entregar um texto, e é uma só
        const copias = await copiasBrutas();
        expect(copias).toHaveLength(texto === null ? 0 : 1);
        if (texto !== null) expect(await guardado(copias[0]!)).toBe(texto);
      });

      it("pedir uma alteração antes de a leitura terminar também é recusado, sem gravar", async () => {
        const noDisco = await preparar();
        act(() => {
          TestRenderer.create(React.createElement(CarteiraNoAparelho, null, React.createElement(Sonda)));
        });
        expect(contexto.pronto).toBe(false);
        expect(await rejeicaoDe(contexto.debitarDossie("a"))).toContain("nada foi gravado");
        expect(gravacoesNaCarteira()).toBe(0);
        restaurarArmazenamento();
        expect(await guardado(CHAVE_CARTEIRA)).toBe(noDisco);
      });

      it("recarregar com a leitura ainda falhando segue bloqueado e não empilha cópias", async () => {
        const noDisco = await preparar();
        await montarEEsperar();
        await act(async () => {
          await contexto.recarregar();
          await contexto.recarregar();
        });
        expect(contexto.bloqueada).toBe(true);
        expect(await rejeicaoDe(contexto.recarregarTeste())).not.toBeNull();
        expect(gravacoesNaCarteira()).toBe(0);
        restaurarArmazenamento();
        expect(await guardado(CHAVE_CARTEIRA)).toBe(noDisco);
        expect(await copiasBrutas()).toHaveLength(texto === null ? 0 : 1);
      });
    });
  }

  it("erro de leitura que passa: recarregar abre a carteira guardada (não a inicial) e libera as gravações", async () => {
    const texto = JSON.stringify(GUARDADA_VALIDA);
    await AsyncStorage.setItem(CHAVE_CARTEIRA, texto);
    falharLeituraDe(CHAVE_CARTEIRA);
    await montarEEsperar();
    expect(contexto.bloqueada).toBe(true);
    expect(contexto.saldo).toBe(0);

    restaurarArmazenamento();
    await act(async () => {
      await contexto.recarregar();
    });

    expect(contexto.bloqueada).toBe(false);
    expect(contexto.erro).toBe("");
    expect(contexto.saldo).toBe(7);
    expect(contexto.carteira).toEqual(GUARDADA_VALIDA);
    expect(await guardado(CHAVE_CARTEIRA)).toBe(texto);

    let debitou = false;
    await act(async () => {
      debitou = await contexto.debitarDossie("b");
    });
    expect(debitou).toBe(true);
    expect(contexto.saldo).toBe(6);
    expect((await gravada()).saldo).toBe(6);
    expect(tipos((await gravada()).extrato, "dossie_cadastral").map((m) => m.analiseId)).toEqual(["b", "a"]);
  });

  it("carteira guardada boa: abre sem erro, não reescreve a chave só por abrir", async () => {
    const texto = JSON.stringify(GUARDADA_VALIDA);
    await AsyncStorage.setItem(CHAVE_CARTEIRA, texto);
    jest.spyOn(AsyncStorage, "setItem").mockClear();
    await montarEEsperar();
    expect(contexto.bloqueada).toBe(false);
    expect(contexto.erro).toBe("");
    expect(contexto.saldo).toBe(7);
    expect(gravacoesNaCarteira()).toBe(0);
    expect(await guardado(CHAVE_CARTEIRA)).toBe(texto);
    expect(await copiasBrutas()).toHaveLength(0);
  });

  it("só quando a chave não existe nasce a carteira inicial (3 créditos, cota inicial), gravada uma vez", async () => {
    expect(await guardado(CHAVE_CARTEIRA)).toBeNull();
    jest.spyOn(AsyncStorage, "setItem").mockClear();
    await montarEEsperar();
    expect(contexto.bloqueada).toBe(false);
    expect(contexto.saldo).toBe(3);
    expect(contexto.carteira.extrato).toHaveLength(1);
    expect(contexto.carteira.extrato[0]).toMatchObject({ tipo: "cota_inicial", analiseId: null, delta: 3 });
    expect(gravacoesNaCarteira()).toBe(1);
    expect(await gravada()).toEqual(contexto.carteira);
    expect(await copiasBrutas()).toHaveLength(0);
  });

  it("chave ausente e a carteira inicial não pôde ser gravada: bloqueia em vez de fingir 3 créditos, e recarregar tenta de novo", async () => {
    falharGravacaoDe(CHAVE_CARTEIRA);
    await montarEEsperar();
    expect(contexto.bloqueada).toBe(true);
    expect(contexto.saldo).toBe(0);
    expect(contexto.erro).toContain("Nada foi apagado nem gravado por cima");
    expect(await rejeicaoDe(contexto.debitarDossie("a"))).toContain("nada foi gravado");
    expect(await guardado(CHAVE_CARTEIRA)).toBeNull();

    restaurarArmazenamento();
    await act(async () => {
      await contexto.recarregar();
    });
    expect(contexto.bloqueada).toBe(false);
    expect(contexto.saldo).toBe(3);
    expect((await gravada()).saldo).toBe(3);
  });

  it("descartar com a carteira bloqueada não credita nada e não grava", async () => {
    // a análise "a" pagou, mas a carteira que a guarda não abre: o +1 não pode sair de uma carteira que não foi lida
    const texto = JSON.stringify(carteiraCom(2, [dossie("a", 1), cota]));
    await AsyncStorage.setItem(CHAVE_CARTEIRA, texto + "}}");
    await montarEEsperar();
    expect(await rejeicaoDe(contexto.creditarDescarte("a"))).toContain("nada foi gravado");
    expect(await guardado(CHAVE_CARTEIRA)).toBe(texto + "}}");
  });
});
