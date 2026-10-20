// Descarte, crédito único por análise e carteira (Fatia 5). Toda análise daqui é sintética.
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React, { useEffect } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { CHAVE_CARTEIRA, esquemaAnaliseV2, esquemaCarteira, motivoDeDescarte, type AnaliseV2, type Carteira } from "../src/dados/contratos";
import {
  LIMITE_DA_OBSERVACAO,
  MOTIVOS_DE_DESCARTE,
  aplicarDescarte,
  creditarDescarteNaCarteira,
  dataLocal,
  descreverMovimento,
  extratoTemDescarte,
  normalizarObservacao,
  restaurarAnalise,
  rotuloDoMotivo,
  sinalDoDelta,
} from "../src/dados/descarte";
import { CarteiraNoAparelho, useCarteira } from "../src/estado/Carteira";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

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

const carteiraCom = (saldo: number, extrato: Carteira["extrato"] = []): Carteira => ({ saldo, extrato });
const cota: Carteira["extrato"][number] = { em: INSTANTE, tipo: "cota_inicial", analiseId: null, delta: 3 };
const descarteDe = (analiseId: string): Carteira["extrato"][number] => ({ em: INSTANTE, tipo: "descarte", analiseId, delta: 1 });

describe("motivos de descarte", () => {
  it("são os quatro de index.html, uma chave de motivoDeDescarte para cada", () => {
    expect(MOTIVOS_DE_DESCARTE.map((m) => m.rotulo)).toEqual([
      "Preço ou taxas acima do orçamento",
      "Ruído ou entorno desfavorável",
      "Planta, andar ou vaga inadequados",
      "Outro motivo",
    ]);
    expect(MOTIVOS_DE_DESCARTE.map((m) => m.chave)).toEqual([...motivoDeDescarte.options]);
    expect(rotuloDoMotivo("ruido_entorno")).toBe("Ruído ou entorno desfavorável");
  });
});

describe("aplicarDescarte", () => {
  it("grava motivo, observação e instante, e uma análise válida", () => {
    const { analise: depois, creditar } = aplicarDescarte(
      analise("a"), { motivo: "preco_taxas", observacao: "  Condomínio pesou.  " }, [cota], AGORA,
    );
    expect(depois.descarte).toEqual({ motivo: "preco_taxas", observacao: "Condomínio pesou.", em: "2026-10-20T15:30:00.000Z" });
    expect(depois.atualizadaEm).toBe("2026-10-20T15:30:00.000Z");
    expect(esquemaAnaliseV2.safeParse(depois).success).toBe(true);
    expect(creditar).toBe(true);
  });

  it("não mexe na análise original", () => {
    const original = analise("a");
    aplicarDescarte(original, { motivo: "outro", observacao: "" }, [], AGORA);
    expect(original.descarte).toBeNull();
    expect(original.atualizadaEm).toBe(INSTANTE);
  });

  it("observação vazia é aceita; observação longa é cortada em 400 e continua válida", () => {
    const vazia = aplicarDescarte(analise("a"), { motivo: "outro", observacao: "   " }, [], AGORA).analise;
    expect(vazia.descarte?.observacao).toBe("");
    const longa = aplicarDescarte(analise("a"), { motivo: "outro", observacao: "x".repeat(900) }, [], AGORA).analise;
    expect(longa.descarte?.observacao).toHaveLength(LIMITE_DA_OBSERVACAO);
    expect(esquemaAnaliseV2.safeParse(longa).success).toBe(true);
  });

  it("não parte um emoji ao meio no corte", () => {
    const texto = `${"a".repeat(399)}😀 resto`;
    const cortada = normalizarObservacao(texto);
    expect(cortada).toBe("a".repeat(399));
    expect(cortada.length).toBeLessThanOrEqual(LIMITE_DA_OBSERVACAO);
  });

  it("só cabe crédito quando o extrato ainda não tem o descarte daquela análise", () => {
    const entrada = { motivo: "outro" as const, observacao: "" };
    expect(aplicarDescarte(analise("a"), entrada, [cota], AGORA).creditar).toBe(true);
    expect(aplicarDescarte(analise("a"), entrada, [descarteDe("a"), cota], AGORA).creditar).toBe(false);
    // descarte de OUTRA análise não conta
    expect(aplicarDescarte(analise("a"), entrada, [descarteDe("b"), cota], AGORA).creditar).toBe(true);
  });

  it("análise já descartada volta como veio: o primeiro motivo e a primeira data ficam", () => {
    const primeira = aplicarDescarte(analise("a"), { motivo: "preco_taxas", observacao: "um" }, [], AGORA).analise;
    const depois = aplicarDescarte(primeira, { motivo: "outro", observacao: "dois" }, [], new Date("2026-10-21T00:00:00.000Z"));
    expect(depois.analise).toBe(primeira);
    expect(depois.analise.descarte?.motivo).toBe("preco_taxas");
    // o descarte já estava gravado, mas o crédito ainda não: a segunda tentativa pode creditar
    expect(depois.creditar).toBe(true);
  });
});

describe("restaurarAnalise", () => {
  it("tira o descarte e não toca em mais nada", () => {
    const descartada = aplicarDescarte(analise("a"), { motivo: "outro", observacao: "x" }, [], AGORA).analise;
    const volta = restaurarAnalise(descartada, new Date("2026-10-22T09:00:00.000Z"));
    expect(volta.descarte).toBeNull();
    expect(volta.atualizadaEm).toBe("2026-10-22T09:00:00.000Z");
    expect({ ...volta, atualizadaEm: INSTANTE }).toEqual(analise("a"));
    expect(esquemaAnaliseV2.safeParse(volta).success).toBe(true);
  });

  it("análise que não está descartada volta a mesma", () => {
    const a = analise("a");
    expect(restaurarAnalise(a, AGORA)).toBe(a);
  });
});

describe("creditarDescarteNaCarteira", () => {
  it("credita +1 com uma linha 'descarte' no topo do extrato", () => {
    const depois = creditarDescarteNaCarteira(carteiraCom(3, [cota]), "a", AGORA);
    expect(depois.saldo).toBe(4);
    expect(depois.extrato[0]).toEqual({ em: "2026-10-20T15:30:00.000Z", tipo: "descarte", analiseId: "a", delta: 1 });
    expect(depois.extrato).toHaveLength(2);
    expect(esquemaCarteira.safeParse(depois).success).toBe(true);
  });

  it("descartar duas vezes a mesma análise credita uma vez", () => {
    const uma = creditarDescarteNaCarteira(carteiraCom(3, [cota]), "a", AGORA);
    const duas = creditarDescarteNaCarteira(uma, "a", new Date("2026-10-21T00:00:00.000Z"));
    expect(duas).toBe(uma);
    expect(duas.saldo).toBe(4);
    expect(duas.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(1);
  });

  it("análises diferentes creditam uma vez cada", () => {
    const a = creditarDescarteNaCarteira(carteiraCom(0), "a", AGORA);
    const b = creditarDescarteNaCarteira(a, "b", AGORA);
    expect(b.saldo).toBe(2);
    expect(extratoTemDescarte(b.extrato, "a")).toBe(true);
    expect(extratoTemDescarte(b.extrato, "c")).toBe(false);
  });

  it("descartar, restaurar e descartar de novo não credita outra vez", () => {
    let carteira = carteiraCom(3, [cota]);
    let a = analise("a");
    const descartar = () => {
      const r = aplicarDescarte(a, { motivo: "outro", observacao: "" }, carteira.extrato, AGORA);
      a = r.analise;
      if (r.creditar) carteira = creditarDescarteNaCarteira(carteira, a.id, AGORA);
    };
    descartar();
    a = restaurarAnalise(a, AGORA);
    expect(carteira.saldo).toBe(4);
    descartar();
    expect(a.descarte).not.toBeNull();
    expect(carteira.saldo).toBe(4);
    expect(carteira.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(1);
  });
});

describe("extrato em palavras", () => {
  it("descreve cada tipo de movimento, com o nome da análise quando ela existe", () => {
    expect(descreverMovimento(cota, null)).toBe("Cota inicial");
    expect(descreverMovimento({ em: INSTANTE, tipo: "dossie_cadastral", analiseId: "a", delta: -1 }, "Casa Forte 3 quartos")).toBe("Prédio confirmado · Casa Forte 3 quartos");
    expect(descreverMovimento({ em: INSTANTE, tipo: "dossie_cadastral", analiseId: "a", delta: -1 }, null)).toBe("Prédio confirmado");
    expect(descreverMovimento(descarteDe("a"), "Casa Forte 3 quartos")).toBe("Descarte informado · Casa Forte 3 quartos");
    expect(descreverMovimento({ em: INSTANTE, tipo: "recarga_de_teste", analiseId: null, delta: 3 }, null)).toBe("Recarga de créditos de teste");
  });

  it("sinal do saldo e data no formato brasileiro", () => {
    expect(sinalDoDelta(1)).toBe("+1");
    expect(sinalDoDelta(3)).toBe("+3");
    expect(sinalDoDelta(-1)).toBe("−1");
    // meio-dia em UTC cai no mesmo dia em qualquer fuso do Brasil
    expect(dataLocal("2026-10-20T12:00:00.000Z")).toBe("20/10/2026");
  });
});

// ——— A carteira de verdade: provedor com o armazenamento simulado ————————————————————

type Contexto = ReturnType<typeof useCarteira>;
let contexto!: Contexto;
/** Entrega o contexto da carteira ao teste (o efeito roda dentro do `act`, depois de cada renderização). */
function Sonda({ aoContexto }: { aoContexto: (c: Contexto) => void }) {
  const c = useCarteira();
  useEffect(() => {
    aoContexto(c);
  });
  return null;
}
const guardarContexto = (c: Contexto) => {
  contexto = c;
};
const arvoreDaCarteira = () => React.createElement(CarteiraNoAparelho, null, React.createElement(Sonda, { aoContexto: guardarContexto }));

async function montar(): Promise<TestRenderer.ReactTestRenderer> {
  let arvore!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    arvore = TestRenderer.create(arvoreDaCarteira());
  });
  return arvore;
}

async function gravada(): Promise<Carteira> {
  return esquemaCarteira.parse(JSON.parse((await AsyncStorage.getItem(CHAVE_CARTEIRA)) as string));
}

describe("creditarDescarte na carteira (provedor + armazenamento)", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("descartar duas vezes a mesma análise credita uma vez, e o saldo gravado confere", async () => {
    await montar();
    expect(contexto.saldo).toBe(3);
    let primeira = false;
    let segunda = true;
    await act(async () => {
      primeira = await contexto.creditarDescarte("a");
    });
    await act(async () => {
      segunda = await contexto.creditarDescarte("a");
    });
    expect(primeira).toBe(true);
    expect(segunda).toBe(false);
    expect(contexto.saldo).toBe(4);
    expect(contexto.carteira.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(1);
    const noDisco = await gravada();
    expect(noDisco.saldo).toBe(4);
    expect(noDisco.extrato.filter((m) => m.tipo === "descarte" && m.analiseId === "a")).toHaveLength(1);
  });

  it("dois toques quase juntos também creditam uma vez", async () => {
    await montar();
    let resultados: boolean[] = [];
    await act(async () => {
      resultados = await Promise.all([contexto.creditarDescarte("a"), contexto.creditarDescarte("a")]);
    });
    expect(resultados.filter(Boolean)).toHaveLength(1);
    expect(contexto.saldo).toBe(4);
  });

  it("outra análise credita normalmente", async () => {
    await montar();
    await act(async () => {
      await contexto.creditarDescarte("a");
      await contexto.creditarDescarte("b");
    });
    expect(contexto.saldo).toBe(5);
  });

  it("uma alteração pedida antes da leitura não apaga a carteira guardada", async () => {
    await AsyncStorage.setItem(
      CHAVE_CARTEIRA,
      JSON.stringify(carteiraCom(7, [{ em: INSTANTE, tipo: "recarga_de_teste", analiseId: null, delta: 3 }])),
    );
    let creditou = false;
    act(() => {
      TestRenderer.create(arvoreDaCarteira());
    });
    // a leitura do disco ainda não terminou aqui: `contexto` mostra o saldo inicial de mentira
    expect(contexto.saldo).toBe(3);
    await act(async () => {
      creditou = await contexto.creditarDescarte("a");
    });
    expect(creditou).toBe(true);
    expect(contexto.saldo).toBe(8);
    expect((await gravada()).saldo).toBe(8);
  });

  it("com um crédito só, duas confirmações seguidas debitam uma", async () => {
    await AsyncStorage.setItem(CHAVE_CARTEIRA, JSON.stringify(carteiraCom(1, [cota])));
    await montar();
    let resultados: boolean[] = [];
    await act(async () => {
      resultados = await Promise.all([contexto.debitarDossie("a"), contexto.debitarDossie("b")]);
    });
    expect(resultados).toEqual([true, false]);
    expect(contexto.saldo).toBe(0);
    expect((await gravada()).extrato.filter((m) => m.tipo === "dossie_cadastral")).toHaveLength(1);
  });

  it("a recarga de teste soma 3 e fica no extrato", async () => {
    await AsyncStorage.setItem(CHAVE_CARTEIRA, JSON.stringify(carteiraCom(0, [cota])));
    await montar();
    await act(async () => {
      await contexto.recarregarTeste();
    });
    expect(contexto.saldo).toBe(3);
    expect(contexto.carteira.extrato[0]).toMatchObject({ tipo: "recarga_de_teste", delta: 3, analiseId: null });
  });
});
