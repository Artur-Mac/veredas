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
  descarteDevolveuAConfirmacao,
  descarteGeraCredito,
  descreverMovimento,
  extratoTemDescarte,
  extratoTemDossie,
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
/** A análise consumiu crédito: é o que dá direito ao +1 do descarte. */
const dossieDe = (analiseId: string): Carteira["extrato"][number] => ({ em: INSTANTE, tipo: "dossie_cadastral", analiseId, delta: -1 });
/** Análise com o prédio confirmado (o que custou o crédito) e já descartada. */
const confirmadaEDescartada = (id: string): AnaliseV2 =>
  aplicarDescarte(
    analise(id, { vinculo: { estado: "confirmado", edificioId: "ed-1", dsqfl: null, confirmadoEm: INSTANTE, indiceGeradoEm: INSTANTE } }),
    { motivo: "preco_taxas", observacao: "caro" },
    [],
    AGORA,
  ).analise;

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
      analise("a"), { motivo: "preco_taxas", observacao: "  Condomínio pesou.  " }, [dossieDe("a"), cota], AGORA,
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

  it("só cabe crédito quando a análise consumiu crédito e o extrato ainda não tem o descarte dela", () => {
    const entrada = { motivo: "outro" as const, observacao: "" };
    expect(aplicarDescarte(analise("a"), entrada, [dossieDe("a"), cota], AGORA).creditar).toBe(true);
    expect(aplicarDescarte(analise("a"), entrada, [descarteDe("a"), dossieDe("a"), cota], AGORA).creditar).toBe(false);
    // dossiê e descarte de OUTRA análise não contam para esta
    expect(aplicarDescarte(analise("a"), entrada, [dossieDe("a"), descarteDe("b"), dossieDe("b"), cota], AGORA).creditar).toBe(true);
    expect(aplicarDescarte(analise("a"), entrada, [descarteDe("b"), dossieDe("b"), cota], AGORA).creditar).toBe(false);
  });

  it("análise que nunca consumiu crédito é descartada normalmente, sem crédito", () => {
    const entrada = { motivo: "outro" as const, observacao: "" };
    for (const extrato of [[], [cota], [dossieDe("b"), cota]]) {
      const r = aplicarDescarte(analise("a"), entrada, extrato, AGORA);
      expect(r.creditar).toBe(false);
      expect(r.analise.descarte).not.toBeNull();
    }
  });

  it("análise já descartada volta como veio: o primeiro motivo e a primeira data ficam", () => {
    const extrato = [dossieDe("a")];
    const primeira = aplicarDescarte(analise("a"), { motivo: "preco_taxas", observacao: "um" }, extrato, AGORA).analise;
    const depois = aplicarDescarte(primeira, { motivo: "outro", observacao: "dois" }, extrato, new Date("2026-10-21T00:00:00.000Z"));
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
    // nem com o +1 no extrato: sem descarte gravado, não há o que restaurar
    expect(restaurarAnalise(a, AGORA, [descarteDe("a"), dossieDe("a")])).toBe(a);
  });

  describe("o +1 do descarte devolveu a confirmação: o vínculo volta a pendente", () => {
    const AMANHA = new Date("2026-10-21T09:00:00.000Z");

    it("confirmado + descarte mais novo que o dossiê no extrato: vínculo pendente, descarte fora, o resto igual", () => {
      const descartada = confirmadaEDescartada("a");
      const volta = restaurarAnalise(descartada, AMANHA, [descarteDe("a"), dossieDe("a"), cota]);
      expect(volta.vinculo).toEqual({ estado: "pendente" });
      expect(volta.descarte).toBeNull();
      expect(volta.atualizadaEm).toBe("2026-10-21T09:00:00.000Z");
      expect({ ...volta, vinculo: descartada.vinculo, atualizadaEm: descartada.atualizadaEm, descarte: descartada.descarte }).toEqual(descartada);
      expect(esquemaAnaliseV2.safeParse(volta).success).toBe(true);
    });

    it("sem o +1 no extrato (descarte sem crédito, ou crédito que ainda não saiu), o vínculo fica confirmado", () => {
      const descartada = confirmadaEDescartada("a");
      for (const extrato of [[], [cota], [dossieDe("a"), cota], [descarteDe("b"), dossieDe("b"), dossieDe("a")]]) {
        expect(restaurarAnalise(descartada, AMANHA, extrato).vinculo).toEqual(descartada.vinculo);
      }
    });

    it("se a pessoa pagou de novo depois do reembolso, a confirmação de agora não foi devolvida: o vínculo fica", () => {
      const descartada = confirmadaEDescartada("a");
      // do mais recente para o mais antigo: segundo dossiê, descarte (+1), primeiro dossiê
      const extrato = [dossieDe("a"), descarteDe("a"), dossieDe("a"), cota];
      expect(descarteDevolveuAConfirmacao(extrato, "a")).toBe(false);
      expect(restaurarAnalise(descartada, AMANHA, extrato).vinculo).toEqual(descartada.vinculo);
    });

    it("só o vínculo confirmado é desfeito: pendente, pulado, não encontrado e fora de cobertura ficam como estão", () => {
      const extrato = [descarteDe("a"), dossieDe("a"), cota];
      const vinculos = [
        { estado: "pendente" as const },
        { estado: "pulado" as const, em: INSTANTE },
        { estado: "nao_encontrado" as const, em: INSTANTE },
        { estado: "fora_de_cobertura" as const },
      ];
      for (const vinculo of vinculos) {
        const descartada = aplicarDescarte(analise("a", { vinculo }), { motivo: "outro", observacao: "" }, [], AGORA).analise;
        const volta = restaurarAnalise(descartada, AMANHA, extrato);
        expect(volta.vinculo).toEqual(vinculo);
        expect(volta.descarte).toBeNull();
      }
    });

    it("o descarte de outra análise não conta", () => {
      const descartada = confirmadaEDescartada("a");
      expect(restaurarAnalise(descartada, AMANHA, [descarteDe("b"), dossieDe("b"), dossieDe("a")]).vinculo).toEqual(descartada.vinculo);
    });

    it("sem o extrato, o vínculo fica como estava (quem restaura passa o extrato da carteira)", () => {
      const descartada = confirmadaEDescartada("a");
      expect(restaurarAnalise(descartada, AMANHA).vinculo).toEqual(descartada.vinculo);
    });

    it("não muda a análise recebida", () => {
      const descartada = confirmadaEDescartada("a");
      const antes = JSON.stringify(descartada);
      restaurarAnalise(descartada, AMANHA, [descarteDe("a"), dossieDe("a")]);
      expect(JSON.stringify(descartada)).toBe(antes);
    });

    it("descarteDevolveuAConfirmacao: precisa do descarte da análise, mais novo que o último dossiê dela", () => {
      expect(descarteDevolveuAConfirmacao([descarteDe("a"), dossieDe("a")], "a")).toBe(true);
      expect(descarteDevolveuAConfirmacao([dossieDe("a"), descarteDe("a"), dossieDe("a")], "a")).toBe(false);
      expect(descarteDevolveuAConfirmacao([dossieDe("a")], "a")).toBe(false);
      expect(descarteDevolveuAConfirmacao([], "a")).toBe(false);
      expect(descarteDevolveuAConfirmacao([descarteDe("b"), dossieDe("a")], "a")).toBe(false);
      // o dossiê dela já saiu no corte do extrato: o descarte é o mais recente
      expect(descarteDevolveuAConfirmacao([descarteDe("a"), cota], "a")).toBe(true);
    });
  });

  it("confirmar, descartar e restaurar não dá dossiê grátis: confirmar de novo custa 1 crédito, e só o primeiro descarte devolve", () => {
    // Imita as telas: o Prédio só debita quando o vínculo ainda não está confirmado; o Descartar credita uma vez; os Salvos restauram.
    let carteira = carteiraCom(3, [cota]);
    let a = analise("a");
    const confirmarPredio = () => {
      if (a.vinculo.estado !== "confirmado") {
        carteira = {
          saldo: carteira.saldo - 1,
          extrato: [{ em: INSTANTE, tipo: "dossie_cadastral", analiseId: "a", delta: -1 }, ...carteira.extrato],
        };
      }
      a = { ...a, vinculo: { estado: "confirmado", edificioId: "ed-1", dsqfl: null, confirmadoEm: INSTANTE, indiceGeradoEm: INSTANTE } };
    };
    const descartar = () => {
      const r = aplicarDescarte(a, { motivo: "outro", observacao: "" }, carteira.extrato, AGORA);
      a = r.analise;
      if (r.creditar) carteira = creditarDescarteNaCarteira(carteira, "a", AGORA);
    };
    const restaurar = () => {
      a = restaurarAnalise(a, AGORA, carteira.extrato);
    };

    confirmarPredio();
    expect(carteira.saldo).toBe(2);
    descartar();
    expect(carteira.saldo).toBe(3);
    restaurar();
    expect(a.vinculo).toEqual({ estado: "pendente" });
    // o dossiê que a pessoa abre agora tem de ser pago: sem o -1 ela teria o dossiê de graça
    confirmarPredio();
    expect(carteira.saldo).toBe(2);
    // segundo ciclo: o descarte não devolve de novo, e restaurar não pede um terceiro pagamento pelo mesmo dossiê
    descartar();
    expect(carteira.saldo).toBe(2);
    restaurar();
    expect(a.vinculo.estado).toBe("confirmado");
    expect(a.descarte).toBeNull();
    expect(carteira.extrato.filter((m) => m.tipo === "dossie_cadastral")).toHaveLength(2);
    expect(carteira.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(1);
  });
});

describe("creditarDescarteNaCarteira", () => {
  it("credita +1 com uma linha 'descarte' no topo do extrato, para análise que consumiu crédito", () => {
    const depois = creditarDescarteNaCarteira(carteiraCom(2, [dossieDe("a"), cota]), "a", AGORA);
    expect(depois.saldo).toBe(3);
    expect(depois.extrato[0]).toEqual({ em: "2026-10-20T15:30:00.000Z", tipo: "descarte", analiseId: "a", delta: 1 });
    expect(depois.extrato).toHaveLength(3);
    expect(esquemaCarteira.safeParse(depois).success).toBe(true);
  });

  it("análise que nunca consumiu crédito não rende +1: a carteira volta a mesma", () => {
    const sem = carteiraCom(3, [cota]);
    expect(creditarDescarteNaCarteira(sem, "a", AGORA)).toBe(sem);
    // o dossiê de OUTRA análise não vale para esta
    const outra = carteiraCom(2, [dossieDe("b"), cota]);
    expect(creditarDescarteNaCarteira(outra, "a", AGORA)).toBe(outra);
    // recarga de teste e cota inicial não são consumo de crédito
    const recarga = carteiraCom(6, [{ em: INSTANTE, tipo: "recarga_de_teste", analiseId: null, delta: 3 }, cota]);
    expect(creditarDescarteNaCarteira(recarga, "a", AGORA)).toBe(recarga);
  });

  it("descartar duas vezes a mesma análise credita uma vez", () => {
    const uma = creditarDescarteNaCarteira(carteiraCom(2, [dossieDe("a"), cota]), "a", AGORA);
    const duas = creditarDescarteNaCarteira(uma, "a", new Date("2026-10-21T00:00:00.000Z"));
    expect(duas).toBe(uma);
    expect(duas.saldo).toBe(3);
    expect(duas.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(1);
  });

  it("análises diferentes creditam uma vez cada, cada uma com o seu dossiê", () => {
    const a = creditarDescarteNaCarteira(carteiraCom(0, [dossieDe("b"), dossieDe("a")]), "a", AGORA);
    const b = creditarDescarteNaCarteira(a, "b", AGORA);
    expect(b.saldo).toBe(2);
    expect(extratoTemDescarte(b.extrato, "a")).toBe(true);
    expect(extratoTemDescarte(b.extrato, "c")).toBe(false);
    // "c" nunca consumiu crédito
    expect(creditarDescarteNaCarteira(b, "c", AGORA)).toBe(b);
  });

  it("descartar, restaurar e descartar de novo não credita outra vez", () => {
    let carteira = carteiraCom(2, [dossieDe("a"), cota]);
    let a = analise("a");
    const descartar = () => {
      const r = aplicarDescarte(a, { motivo: "outro", observacao: "" }, carteira.extrato, AGORA);
      a = r.analise;
      if (r.creditar) carteira = creditarDescarteNaCarteira(carteira, a.id, AGORA);
    };
    descartar();
    a = restaurarAnalise(a, AGORA);
    expect(carteira.saldo).toBe(3);
    descartar();
    expect(a.descarte).not.toBeNull();
    expect(carteira.saldo).toBe(3);
    expect(carteira.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(1);
  });

  it("descarteGeraCredito e extratoTemDossie olham o extrato, por análise", () => {
    expect(extratoTemDossie([dossieDe("a"), cota], "a")).toBe(true);
    expect(extratoTemDossie([dossieDe("b"), descarteDe("a"), cota], "a")).toBe(false);
    expect(descarteGeraCredito([dossieDe("a")], "a")).toBe(true);
    expect(descarteGeraCredito([descarteDe("a"), dossieDe("a")], "a")).toBe(false);
    expect(descarteGeraCredito([], "a")).toBe(false);
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
    // a análise consome 1 crédito ao confirmar o prédio; só então o descarte rende +1
    await act(async () => {
      await contexto.debitarDossie("a");
    });
    expect(contexto.saldo).toBe(2);
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
    expect(contexto.saldo).toBe(3);
    expect(contexto.carteira.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(1);
    const noDisco = await gravada();
    expect(noDisco.saldo).toBe(3);
    expect(noDisco.extrato.filter((m) => m.tipo === "descarte" && m.analiseId === "a")).toHaveLength(1);
  });

  it("dois toques quase juntos também creditam uma vez", async () => {
    await AsyncStorage.setItem(CHAVE_CARTEIRA, JSON.stringify(carteiraCom(2, [dossieDe("a"), cota])));
    await montar();
    let resultados: boolean[] = [];
    await act(async () => {
      resultados = await Promise.all([contexto.creditarDescarte("a"), contexto.creditarDescarte("a")]);
    });
    expect(resultados.filter(Boolean)).toHaveLength(1);
    expect(contexto.saldo).toBe(3);
  });

  it("outra análise credita normalmente, cada uma com o seu dossiê", async () => {
    await AsyncStorage.setItem(CHAVE_CARTEIRA, JSON.stringify(carteiraCom(1, [dossieDe("b"), dossieDe("a"), cota])));
    await montar();
    await act(async () => {
      await contexto.creditarDescarte("a");
      await contexto.creditarDescarte("b");
    });
    expect(contexto.saldo).toBe(3);
  });

  it("análise sem dossiê no extrato não credita pelo provedor e não grava nada", async () => {
    await AsyncStorage.setItem(CHAVE_CARTEIRA, JSON.stringify(carteiraCom(3, [cota])));
    await montar();
    const antes = await AsyncStorage.getItem(CHAVE_CARTEIRA);
    let creditou = true;
    await act(async () => {
      creditou = await contexto.creditarDescarte("a");
    });
    expect(creditou).toBe(false);
    expect(contexto.saldo).toBe(3);
    expect(await AsyncStorage.getItem(CHAVE_CARTEIRA)).toBe(antes);
  });

  it("uma alteração pedida antes da leitura não apaga a carteira guardada", async () => {
    await AsyncStorage.setItem(
      CHAVE_CARTEIRA,
      JSON.stringify(carteiraCom(7, [dossieDe("a"), { em: INSTANTE, tipo: "recarga_de_teste", analiseId: null, delta: 3 }])),
    );
    let creditou = false;
    act(() => {
      TestRenderer.create(arvoreDaCarteira());
    });
    // a leitura do disco ainda não terminou aqui: `contexto` não mostra saldo nenhum (nem um inicial de mentira)
    expect(contexto.pronto).toBe(false);
    expect(contexto.saldo).toBe(0);
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
