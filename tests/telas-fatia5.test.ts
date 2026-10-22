// Telas da Fatia 5 renderizadas com react-test-renderer: Comparar, Salvos, Créditos, Sobre os dados e a gaveta de
// descarte, com os provedores de verdade e o armazenamento simulado. Análises SINTÉTICAS; o único dado real é o
// primeiro edifício de Casa Forte lido do índice em tempo de teste (como no smoke da ordem). Também a casca do app
// (cabeçalho, menu, dock, aviso na raiz) e "Apagar meus dados deste aparelho".
import { afterAll, afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import { readdirSync, readFileSync } from "fs";
import { router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text } from "react-native";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { ProvedorDeAviso, useAviso } from "../src/componentes/casca/Aviso";
import { CabecalhoDoApp, rotuloDeCreditos } from "../src/componentes/casca/CabecalhoDoApp";
import { apagarDadosDoAparelho } from "../src/componentes/casca/apagarDados";
import { DockInferior } from "../src/componentes/casca/DockInferior";
import { ITENS_DO_MENU } from "../src/componentes/casca/MenuRapido";
import { RESPIRO_NO_TOPO_DA_GAVETA } from "../src/componentes/casca/Gaveta";
import { RastroDeConfianca } from "../src/componentes/fonte/RastroDeConfianca";
import { GavetaDeDescarte } from "../src/componentes/descarte/GavetaDeDescarte";
import {
  CHAVE_ANALISES_V2,
  CHAVE_CARTEIRA,
  esquemaAnaliseV2,
  esquemaCarteira,
  type AnaliseV2,
  type Carteira,
  type Edificio,
} from "../src/dados/contratos";
import { derivarDossie } from "../src/dados/dossie/derivar";
import { primeiraAnomaliaPendente } from "../src/dados/formulario";
import { edificiosDoBairro, indiceDoBairro, META } from "../src/dados/recife/indice";
import { AnalisesNoAparelho, useAnalises } from "../src/estado/Analises";
import { CarteiraNoAparelho, useCarteira } from "../src/estado/Carteira";
import { TemaDoApp } from "../src/tema/Tema";
import { CORES_CLARO, comAlfa } from "../src/tema/tokens";
import Raiz from "../src/app/_layout";
import Comparar from "../src/app/(abas)/comparar";
import Explorar from "../src/app/(abas)/index";
import Predio from "../src/app/(abas)/predio";
import Salvos from "../src/app/(abas)/salvos";
import Creditos from "../src/app/creditos";
import SobreOsDados from "../src/app/sobre-os-dados";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("expo-clipboard", () => ({ getStringAsync: jest.fn(async () => "") }));
// O que a raiz do app desenha no lugar do `Stack` de verdade (cada teste põe aqui a tela que quer ver).
let mockConteudoDoStack: React.ReactElement | null = null;
// Os parâmetros da rota que `useLocalSearchParams` devolve (a tela do prédio lê `id`).
let mockParametros: Record<string, string> = {};
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => mockParametros,
  usePathname: () => "/",
  Stack: Object.assign(() => mockConteudoDoStack, { Screen: () => null }),
}));
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));
jest.mock("expo-splash-screen", () => ({ preventAutoHideAsync: jest.fn(async () => true), hideAsync: jest.fn(async () => true) }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const INSTANTE = "2026-10-20T12:00:00.000Z";
const v = (valor: number | null, aConfirmar = false) => ({ valor, origem: "texto" as const, aConfirmar });
const vazio = v(null);
const iptu = (valor: number | null, periodo: "mes" | "ano" | "desconhecido", aConfirmar = false) => ({ ...v(valor, aConfirmar), periodo });

type Mudancas = Partial<Omit<AnaliseV2, "declarados">> & { declarados?: Partial<AnaliseV2["declarados"]> };

function analise(id: string, mudancas: Mudancas = {}): AnaliseV2 {
  const { declarados, ...resto } = mudancas;
  return esquemaAnaliseV2.parse({
    versao: 2, id, criadaEm: INSTANTE, atualizadaEm: INSTANTE, nome: `Imóvel ${id}`, modalidade: "aluguel", tipologia: "apartamento",
    url: "", bairroTexto: "Casa Forte", bairro: "casa-forte", logradouro: null, numero: null, nomeEdificio: null, extracao: null,
    declarados: {
      preco: v(4500), condominio: v(1190), iptu: iptu(288, "mes"), seguroIncendio: v(42), taxaServico: vazio, outros: vazio,
      area: v(100), quartos: v(3), suites: vazio, banheiros: v(2), vagas: v(1), andar: v(5), ...declarados,
    },
    vinculo: { estado: "pendente" },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null, ...resto,
  });
}

const descartada = (id: string, mudancas: Mudancas = {}) =>
  analise(id, { descarte: { motivo: "preco_taxas", observacao: "Condomínio pesou.", em: "2026-10-18T10:00:00.000Z" }, ...mudancas });

const carteiraCom = (saldo: number, extrato: Carteira["extrato"]): Carteira => ({ saldo, extrato });
const cota: Carteira["extrato"][number] = { em: INSTANTE, tipo: "cota_inicial", analiseId: null, delta: 3 };
/** A análise usou 1 crédito (prédio confirmado): só ela rende o +1 do descarte. */
const pagou = (analiseId: string): Carteira["extrato"][number] => ({ em: INSTANTE, tipo: "dossie_cadastral", analiseId, delta: -1 });

async function semear(analises: AnaliseV2[], carteira?: Carteira) {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify(analises));
  if (carteira) await AsyncStorage.setItem(CHAVE_CARTEIRA, JSON.stringify(carteira));
}

const gravadas = async () => JSON.parse((await AsyncStorage.getItem(CHAVE_ANALISES_V2)) as string) as AnaliseV2[];
const carteiraGravada = async () => esquemaCarteira.parse(JSON.parse((await AsyncStorage.getItem(CHAVE_CARTEIRA)) as string));

// ——— Utilidades de leitura da árvore ————————————————————————————————————————————————

function textosDe(no: unknown): string[] {
  if (no === null || no === undefined) return [];
  if (typeof no === "string") return [no];
  if (Array.isArray(no)) return no.flatMap(textosDe);
  const filhos = (no as { children?: unknown }).children;
  return textosDe(filhos);
}
const texto = (arvore: TestRenderer.ReactTestRenderer) => textosDe(arvore.toJSON()).join("\n");
/** Existe um texto exatamente igual (o aviso "+1 crédito" é um texto só; a frase da gaveta o contém dentro de outra). */
const temTextoExato = (arvore: TestRenderer.ReactTestRenderer, exato: string) => textosDe(arvore.toJSON()).includes(exato);

function textoDoNo(no: ReactTestInstance): string {
  return no.children.map((c) => (typeof c === "string" ? c : textoDoNo(c))).join(" ");
}

/** O primeiro (mais externo) elemento tocável que contém o texto, ou que tem o rótulo de acessibilidade. */
function tocavel(arvore: TestRenderer.ReactTestRenderer, alvo: string): ReactTestInstance {
  const achados = arvore.root.findAll(
    (n) =>
      typeof n.props.onPress === "function" &&
      (n.props.accessibilityLabel === alvo || (typeof n.type === "string" ? false : textoDoNo(n).replace(/\s+/g, " ").includes(alvo))),
  );
  const primeiro = achados[0];
  if (!primeiro) throw new Error(`Nada tocável com "${alvo}"`);
  return primeiro;
}
const tocar = async (arvore: TestRenderer.ReactTestRenderer, alvo: string) => {
  const no = tocavel(arvore, alvo);
  await act(async () => {
    (no.props.onPress as () => void)();
  });
};
const existe = (arvore: TestRenderer.ReactTestRenderer, alvo: string) => {
  try {
    tocavel(arvore, alvo);
    return true;
  } catch {
    return false;
  }
};

const esperar = (ms = 5) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

type Elemento = React.ReactElement;
const montadas: TestRenderer.ReactTestRenderer[] = [];
async function montar(tela: Elemento): Promise<TestRenderer.ReactTestRenderer> {
  let arvore!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    arvore = TestRenderer.create(
      React.createElement(
        TemaDoApp,
        null,
        React.createElement(
          CarteiraNoAparelho,
          null,
          React.createElement(AnalisesNoAparelho, null, React.createElement(ProvedorDeAviso, null, tela)),
        ),
      ),
    );
  });
  montadas.push(arvore);
  await esperar();
  return arvore;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParametros = {};
});

// Desmonta o que cada teste montou (a animação do aviso termina depois e não deve atualizar árvore viva) e, no
// fim, espera o aviso de 3 s acabar para o Jest não reclamar de temporizador pendente.
afterEach(() => {
  for (const arvore of montadas.splice(0)) act(() => arvore.unmount());
});
afterAll(() => new Promise<void>((resolve) => setTimeout(resolve, 3200)));

// ——— Gaveta de descarte ————————————————————————————————————————————————————————————

describe("GavetaDeDescarte", () => {
  const abrir = (extra: Partial<React.ComponentProps<typeof GavetaDeDescarte>> = {}) => {
    const aoFechar = jest.fn();
    const aoDescartar = jest.fn();
    const tela = React.createElement(GavetaDeDescarte, { analiseId: "a", visivel: true, aoFechar, aoDescartar, ...extra });
    return { aoFechar, aoDescartar, tela };
  };

  it("mostra os quatro motivos do protótipo e só deixa descartar depois de escolher um", async () => {
    await semear([analise("a")], carteiraCom(2, [pagou("a"), cota]));
    const { tela } = abrir();
    const arvore = await montar(tela);
    const t = texto(arvore);
    for (const motivo of [
      "Preço ou taxas acima do orçamento",
      "Ruído ou entorno desfavorável",
      "Planta, andar ou vaga inadequados",
      "Outro motivo",
    ]) {
      expect(t).toContain(motivo);
    }
    expect(t).toContain("Por que você descartou este imóvel?");
    expect(t).toContain("Imóvel a · Seu feedback concede +1 crédito na carteira.");
    expect(t).toContain("Observação (opcional)");
    expect(tocavel(arvore, "Descartar imóvel").props.desativado).toBe(true);
    await tocar(arvore, "Outro motivo");
    expect(tocavel(arvore, "Descartar imóvel").props.desativado).toBe(false);
  });

  it("grava o descarte com a observação, credita +1, avisa e chama aoDescartar", async () => {
    await semear([analise("a"), analise("b")], carteiraCom(2, [pagou("a"), cota]));
    const { tela, aoFechar, aoDescartar } = abrir();
    const arvore = await montar(tela);

    await tocar(arvore, "Ruído ou entorno desfavorável");
    const campo = arvore.root.findByProps({ accessibilityLabel: "Observação (opcional)" });
    await act(async () => {
      (campo.props.onChangeText as (t: string) => void)("  Janela para a avenida.  ");
    });
    await tocar(arvore, "Descartar imóvel");
    await esperar(20);

    const salvas = await gravadas();
    const a = salvas.find((x) => x.id === "a");
    expect(a?.descarte).toMatchObject({ motivo: "ruido_entorno", observacao: "Janela para a avenida." });
    expect(esquemaAnaliseV2.safeParse(a).success).toBe(true);
    expect(salvas.find((x) => x.id === "b")?.descarte).toBeNull();

    const carteira = await carteiraGravada();
    expect(carteira.saldo).toBe(3);
    expect(carteira.extrato[0]).toMatchObject({ tipo: "descarte", analiseId: "a", delta: 1 });

    expect(temTextoExato(arvore, "+1 crédito")).toBe(true);
    expect(aoDescartar).toHaveBeenCalledTimes(1);
    expect(aoFechar).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sem aoDescartar, volta a Explorar", async () => {
    await semear([analise("a")], carteiraCom(3, [cota]));
    const { tela } = abrir({ aoDescartar: undefined });
    const arvore = await montar(tela);
    await tocar(arvore, "Outro motivo");
    await tocar(arvore, "Descartar imóvel");
    await esperar(20);
    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("dois toques seguidos no botão creditam uma vez só", async () => {
    await semear([analise("a")], carteiraCom(2, [pagou("a"), cota]));
    const { tela, aoDescartar } = abrir();
    const arvore = await montar(tela);
    await tocar(arvore, "Planta, andar ou vaga inadequados");
    const botao = tocavel(arvore, "Descartar imóvel");
    await act(async () => {
      (botao.props.onPress as () => void)();
      (botao.props.onPress as () => void)();
    });
    await esperar(20);
    const carteira = await carteiraGravada();
    expect(carteira.saldo).toBe(3);
    expect(carteira.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(1);
    expect(aoDescartar).toHaveBeenCalledTimes(1);
  });

  it("análise que não usou crédito: a gaveta diz que não rende, descarta e não credita nem avisa +1", async () => {
    await semear([analise("a")], carteiraCom(3, [cota]));
    const { tela, aoDescartar } = abrir();
    const arvore = await montar(tela);
    expect(texto(arvore)).toContain("Imóvel a · Este imóvel não usou crédito, então o descarte não rende crédito.");
    expect(texto(arvore)).not.toContain("Seu feedback concede +1 crédito");
    await tocar(arvore, "Outro motivo");
    await tocar(arvore, "Descartar imóvel");
    await esperar(20);

    expect((await gravadas()).find((x) => x.id === "a")?.descarte?.motivo).toBe("outro");
    const carteira = await carteiraGravada();
    expect(carteira.saldo).toBe(3);
    expect(carteira.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(0);
    expect(temTextoExato(arvore, "+1 crédito")).toBe(false);
    expect(aoDescartar).toHaveBeenCalledTimes(1);
  });

  it("análise restaurada e descartada de novo não credita outra vez nem avisa +1", async () => {
    // a carteira já tem o crédito deste descarte (feito antes de restaurar)
    const extrato: Carteira["extrato"] = [{ em: INSTANTE, tipo: "descarte", analiseId: "a", delta: 1 }, cota];
    await semear([analise("a")], carteiraCom(4, extrato));
    const { tela, aoDescartar } = abrir();
    const arvore = await montar(tela);
    expect(texto(arvore)).toContain("O crédito deste descarte já foi concedido.");
    await tocar(arvore, "Preço ou taxas acima do orçamento");
    await tocar(arvore, "Descartar imóvel");
    await esperar(20);

    expect((await gravadas()).find((x) => x.id === "a")?.descarte?.motivo).toBe("preco_taxas");
    const carteira = await carteiraGravada();
    expect(carteira.saldo).toBe(4);
    expect(carteira.extrato.filter((m) => m.tipo === "descarte")).toHaveLength(1);
    expect(temTextoExato(arvore, "+1 crédito")).toBe(false);
    expect(texto(arvore)).not.toContain("+1 crédito");
    expect(aoDescartar).toHaveBeenCalledTimes(1);
  });

  it("descartar outro imóvel não troca a análise ativa; descartar a que está ativa não muda nada", async () => {
    await semear([analise("a"), analise("b")], carteiraCom(3, [cota]));
    await AsyncStorage.setItem("vereda-ativa-v1", "b");
    const { tela } = abrir();
    const arvore = await montar(tela);
    await tocar(arvore, "Outro motivo");
    await tocar(arvore, "Descartar imóvel");
    await esperar(20);
    expect((await gravadas()).find((x) => x.id === "a")?.descarte).not.toBeNull();
    expect(await AsyncStorage.getItem("vereda-ativa-v1")).toBe("b");

    await semear([analise("a"), analise("b")], carteiraCom(3, [cota]));
    await AsyncStorage.setItem("vereda-ativa-v1", "a");
    const outra = await montar(abrir().tela);
    await tocar(outra, "Outro motivo");
    await tocar(outra, "Descartar imóvel");
    await esperar(20);
    expect(await AsyncStorage.getItem("vereda-ativa-v1")).toBe("a");
  });

  it("cada abertura começa limpa: sem o motivo da vez anterior", async () => {
    await semear([analise("a")], carteiraCom(3, [cota]));
    const props = { analiseId: "a", aoFechar: jest.fn(), aoDescartar: jest.fn() };
    const arvore = await montar(React.createElement(GavetaDeDescarte, { ...props, visivel: true }));
    await tocar(arvore, "Outro motivo");
    expect(tocavel(arvore, "Descartar imóvel").props.desativado).toBe(false);
    await act(async () => {
      arvore.update(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(
            CarteiraNoAparelho,
            null,
            React.createElement(AnalisesNoAparelho, null, React.createElement(ProvedorDeAviso, null, React.createElement(GavetaDeDescarte, { ...props, visivel: false }))),
          ),
        ),
      );
    });
    expect(texto(arvore)).not.toContain("Por que você descartou");
    await act(async () => {
      arvore.update(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(
            CarteiraNoAparelho,
            null,
            React.createElement(AnalisesNoAparelho, null, React.createElement(ProvedorDeAviso, null, React.createElement(GavetaDeDescarte, { ...props, visivel: true }))),
          ),
        ),
      );
    });
    expect(texto(arvore)).toContain("Por que você descartou");
    expect(tocavel(arvore, "Descartar imóvel").props.desativado).toBe(true);
  });

  it("fechada, não desenha nada", async () => {
    await semear([analise("a")]);
    const { tela } = abrir({ visivel: false });
    const arvore = await montar(tela);
    expect(texto(arvore)).not.toContain("Por que você descartou");
  });
});

// ——— Salvos ——————————————————————————————————————————————————————————————————————————

describe("Salvos", () => {
  const lista = () => [
    analise("alu1", { nome: "Casa Forte 3 quartos" }),
    analise("alu2", { nome: "Graças 2 quartos", bairro: "gracas", bairroTexto: "Graças" }),
    analise("com1", { nome: "Madalena compra", modalidade: "compra", bairro: "madalena", bairroTexto: "Madalena", declarados: { preco: v(890000), iptu: iptu(3240, "ano") } }),
    analise("fora", { nome: "Fora dos salvos", salva: false }),
    descartada("des1", { nome: "Imóvel descartado" }),
  ];

  it("lista só as salvas e não descartadas, com a contagem e o preço anunciado", async () => {
    await semear(lista(), carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Salvos));
    const t = texto(arvore);
    expect(t).toContain("Seus imóveis salvos.");
    expect(t).toContain("3 opções para olhar com calma.");
    expect(t).toContain("Casa Forte 3 quartos");
    expect(t).toContain("Madalena compra");
    expect(t).not.toContain("Fora dos salvos");
    expect(t).toContain("R$ 4.500");
    expect(t).toContain("Aluguel anunciado");
    expect(t).toContain("Preço anunciado");
    expect(t).toContain("Todos");
    expect(t).toContain("Aluguel");
    expect(t).toContain("Compra");
  });

  it("o filtro Aluguel / Compra separa as modalidades", async () => {
    await semear(lista(), carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Salvos));
    await tocar(arvore, "Compra");
    let t = texto(arvore);
    expect(t).toContain("Madalena compra");
    expect(t).not.toContain("Casa Forte 3 quartos");
    await tocar(arvore, "Aluguel");
    t = texto(arvore);
    expect(t).toContain("Casa Forte 3 quartos");
    expect(t).not.toContain("Madalena compra");
  });

  it("mostra os Descartados com o motivo e restaura sem mexer na carteira", async () => {
    const extrato: Carteira["extrato"] = [{ em: INSTANTE, tipo: "descarte", analiseId: "des1", delta: 1 }, cota];
    await semear(lista(), carteiraCom(4, extrato));
    const arvore = await montar(React.createElement(Salvos));
    let t = texto(arvore);
    expect(t).toContain("Descartados");
    expect(t).toContain("Imóvel descartado");
    expect(t).toContain("Preço ou taxas acima do orçamento");
    expect(t).toContain("18/10/2026");
    expect(t).toContain("Condomínio pesou.");
    expect(t).toContain("não mexe nos seus créditos");

    await tocar(arvore, "Restaurar Imóvel descartado");
    await esperar(20);
    const depois = (await gravadas()).find((x) => x.id === "des1");
    expect(depois?.descarte).toBeNull();
    expect(esquemaAnaliseV2.safeParse(depois).success).toBe(true);
    t = texto(arvore);
    expect(t).toContain("Imóvel restaurado");
    expect(t).toContain("4 opções para olhar com calma.");

    const carteira = await carteiraGravada();
    expect(carteira.saldo).toBe(4);
    expect(carteira.extrato).toEqual(extrato);
  });

  it("C2 na tela: restaurar o imóvel cujo +1 devolveu a confirmação volta o prédio a pendente, sem mexer na carteira", async () => {
    const e = edificiosDoBairro("casa-forte")[0];
    if (!e) throw new Error("índice de Casa Forte vazio");
    const confirmadaDescartada = descartada("des2", {
      nome: "Confirmado e descartado",
      vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl, confirmadoEm: INSTANTE, indiceGeradoEm: META.geradoEm },
    });
    const extrato: Carteira["extrato"] = [
      { em: "2026-10-19T10:00:00.000Z", tipo: "descarte", analiseId: "des2", delta: 1 },
      { em: "2026-10-18T09:00:00.000Z", tipo: "dossie_cadastral", analiseId: "des2", delta: -1 },
      cota,
    ];
    await semear([...lista(), confirmadaDescartada], carteiraCom(3, extrato));
    const arvore = await montar(React.createElement(Salvos));
    await tocar(arvore, "Restaurar Confirmado e descartado");
    await esperar(20);
    const depois = (await gravadas()).find((x) => x.id === "des2");
    expect(depois?.descarte).toBeNull();
    expect(depois?.vinculo).toEqual({ estado: "pendente" });
    expect(texto(arvore)).toContain("Confirme o prédio de novo");
    const carteira = await carteiraGravada();
    expect(carteira.saldo).toBe(3);
    expect(carteira.extrato).toEqual(extrato);
  });

  it("com a carteira que não abriu, restaurar é recusado e nada é gravado", async () => {
    await semear(lista());
    await AsyncStorage.setItem(CHAVE_CARTEIRA, "{corrompido");
    const antes = await AsyncStorage.getItem(CHAVE_ANALISES_V2);
    const arvore = await montar(React.createElement(Salvos));
    await tocar(arvore, "Restaurar Imóvel descartado");
    await esperar(20);
    expect(await AsyncStorage.getItem(CHAVE_ANALISES_V2)).toBe(antes);
    expect(await AsyncStorage.getItem(CHAVE_CARTEIRA)).toBe("{corrompido");
    expect(texto(arvore)).toContain("Não deu para restaurar agora");
  });

  it("remover dos salvos tira o imóvel da lista e o mantém no caderno, sem trocar a análise ativa", async () => {
    await semear(lista(), carteiraCom(3, [cota]));
    await AsyncStorage.setItem("vereda-ativa-v1", "alu2");
    const arvore = await montar(React.createElement(Salvos));
    await tocar(arvore, "Remover Casa Forte 3 quartos dos salvos");
    await esperar(20);
    expect((await gravadas()).find((x) => x.id === "alu1")?.salva).toBe(false);
    expect(await AsyncStorage.getItem("vereda-ativa-v1")).toBe("alu2");
    expect(texto(arvore)).not.toContain("Casa Forte 3 quartos");
    expect(texto(arvore)).toContain("2 opções para olhar com calma.");
  });

  it("descartar a partir do cartão abre a gaveta e depois move o imóvel para Descartados, com +1 crédito", async () => {
    await semear(lista(), carteiraCom(2, [pagou("alu1"), cota]));
    const arvore = await montar(React.createElement(Salvos));
    await tocar(arvore, "Descartar Casa Forte 3 quartos");
    expect(texto(arvore)).toContain("Por que você descartou este imóvel?");
    await tocar(arvore, "Outro motivo");
    await tocar(arvore, "Descartar imóvel");
    await esperar(20);
    expect((await gravadas()).find((x) => x.id === "alu1")?.descarte?.motivo).toBe("outro");
    expect((await carteiraGravada()).saldo).toBe(3);
    const t = texto(arvore);
    expect(t).not.toContain("Por que você descartou este imóvel?");
    expect(t).toContain("Descartados");
    expect(t).toContain("2 opções para olhar com calma.");
    expect(temTextoExato(arvore, "+1 crédito")).toBe(true);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sem salvos: 'Sua próxima opção começa aqui.'; filtro vazio: 'Nenhum imóvel neste filtro.'", async () => {
    await semear([], carteiraCom(3, [cota]));
    let arvore = await montar(React.createElement(Salvos));
    expect(texto(arvore)).toContain("Sua próxima opção começa aqui.");
    expect(texto(arvore)).toContain("Nenhum imóvel salvo ainda.");
    await tocar(arvore, "Explorar imóveis");
    expect(router.push).toHaveBeenCalledWith("/");

    await semear([analise("alu1")], carteiraCom(3, [cota]));
    arvore = await montar(React.createElement(Salvos));
    await tocar(arvore, "Compra");
    expect(texto(arvore)).toContain("Nenhum imóvel neste filtro.");
    await tocar(arvore, "Ver todos os salvos");
    expect(texto(arvore)).toContain("1 opção para olhar com calma.");
  });
});

// ——— Comparar —————————————————————————————————————————————————————————————————————————

describe("Comparar", () => {
  const duas = () => [
    analise("alu1", { nome: "Casa Forte 3 quartos" }), // 4.500 + 1.190 + 288 + 42 = 6.020
    analise("alu2", {
      nome: "Graças 2 quartos", bairro: "gracas", bairroTexto: "Graças",
      declarados: { preco: v(3800), condominio: v(900), iptu: iptu(2400, "ano"), seguroIncendio: vazio, area: v(82.5), quartos: v(2) }, // 3.800 + 900 + 200 = 4.900
    }),
    analise("des", { nome: "Não pode aparecer", descarte: { motivo: "outro", observacao: "", em: INSTANTE } }),
    analise("com1", { nome: "Compra solta", modalidade: "compra" }),
  ];

  it("Custo: diferença no custo mensal conhecido, barras, parcelas e '{n} parcelas a confirmar'", async () => {
    await semear(duas(), carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Comparar));
    const t = texto(arvore);
    expect(t).toContain("Lado a lado");
    expect(t).toContain("Compare suas opções.");
    expect(t).toContain("Casa Forte 3 quartos");
    expect(t).toContain("Graças 2 quartos");
    expect(t).not.toContain("Não pode aparecer");
    expect(t).not.toContain("Compra solta");
    expect(t).toContain("R$ 1.120");
    expect(t).toContain("de diferença no custo mensal conhecido.");
    expect(t).toContain("R$ 6.020/mês");
    expect(t).toContain("R$ 4.900/mês");
    expect(t).toContain("1 parcela a confirmar");
    expect(t).toContain("Nenhuma parcela a confirmar");
    expect(t).toContain("A confirmar");
    expect(t).toContain("Seguro incêndio");
    expect(t).toContain("Meus salvos");
    expect(t).toContain("Escolher para visitar");
    // nenhuma recomendação
    expect(t).not.toMatch(/melhor|pior|recomend|vale a pena|barat|caro\b/i);
  });

  it("Espaço e Entorno trocam o painel; sem prédio confirmado mostra 'Prédio não confirmado'", async () => {
    await semear(duas(), carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Comparar));
    await tocar(arvore, "Espaço");
    let t = texto(arvore);
    expect(t).toContain("Espaço para a sua rotina");
    expect(t).toContain("17,5 m²");
    expect(t).toContain("82,5 m²");
    expect(t).toContain("Aluguel anunciado por m²");
    await tocar(arvore, "Entorno");
    await esperar();
    t = texto(arvore);
    expect(t).toContain("Prédio não confirmado");
    expect(t).toContain("Confirmar prédio");
    expect(t).not.toContain("Lendo o cadastro");
  });

  it("Entorno com o prédio confirmado usa o edifício do índice cadastral", async () => {
    const e = edificiosDoBairro("casa-forte")[0];
    if (!e) throw new Error("índice de Casa Forte vazio");
    const confirmada = analise("alu1", {
      nome: "Casa Forte 3 quartos",
      vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl, confirmadoEm: INSTANTE, indiceGeradoEm: META.geradoEm },
    });
    await semear([confirmada, duas()[1] as AnaliseV2], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Comparar));
    await tocar(arvore, "Entorno");
    await esperar(30);
    const t = texto(arvore);
    expect(t).toContain("Prédio confirmado");
    expect(t).toContain(String(e.obras150m.relevantes24m));
    expect(t).toContain("Últimos 24 meses");
    expect(t).toContain("Prédio não confirmado");
  });

  it("trocar o imóvel de um lado oferece só análises não descartadas da modalidade", async () => {
    await semear([...duas(), analise("alu3", { nome: "Terceiro aluguel" })], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Comparar));
    await tocar(arvore, "Imóvel 1: Casa Forte 3 quartos. Trocar imóvel");
    const t = texto(arvore);
    expect(t).toContain("Escolher imóvel 1");
    expect(t).toContain("Terceiro aluguel");
    expect(t).not.toContain("Não pode aparecer");
    expect(t).not.toContain("Compra solta");
    await tocar(arvore, "Terceiro aluguel");
    expect(texto(arvore)).not.toContain("Escolher imóvel 1");
    expect(texto(arvore)).toContain("Terceiro aluguel");
  });

  it("Comprar mostra a comparação de compra: preço anunciado e despesas mensais à parte", async () => {
    const compras = [
      analise("c1", { nome: "Compra A", modalidade: "compra", declarados: { preco: v(890000), seguroIncendio: vazio } }),
      analise("c2", { nome: "Compra B", modalidade: "compra", declarados: { preco: v(760000), seguroIncendio: vazio } }),
    ];
    await semear([...duas().filter((a) => a.id !== "com1"), ...compras], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Comparar));
    await tocar(arvore, "Comprar");
    const t = texto(arvore);
    expect(t).toContain("Compra A");
    expect(t).toContain("Compra B");
    expect(t).toContain("R$ 130.000");
    expect(t).toContain("de diferença no preço anunciado.");
    expect(t).toContain("Mensal conhecido");
    expect(t).not.toContain("Casa Forte 3 quartos");
  });

  it("com uma análise só, explica o que falta em vez de comparar", async () => {
    await semear([analise("alu1")], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Comparar));
    const t = texto(arvore);
    expect(t).toContain("Duas análises de aluguel para comparar.");
    expect(t).toContain("Você tem 1 análise de aluguel.");
    expect(existe(arvore, "Explorar imóveis")).toBe(true);
    expect(t).not.toContain("Escolher para visitar");
  });

  it("Escolher para visitar deixa a análise ativa e abre a Visita", async () => {
    await semear(duas(), carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Comparar));
    await tocar(arvore, "Escolher para visitar");
    await tocar(arvore, "Graças 2 quartos. Graças · 82,5 m² · 2 quartos");
    await esperar(10);
    expect(router.push).toHaveBeenCalledWith("/visita");
    expect(await AsyncStorage.getItem("vereda-ativa-v1")).toBe("alu2");
  });
});

// ——— Créditos ————————————————————————————————————————————————————————————————————————

describe("carteira que não abriu (C1 nas telas)", () => {
  it("Créditos e o cabeçalho não mostram 0 crédito; a gaveta de descarte recusa e nada é gravado", async () => {
    await semear([analise("a")]);
    await AsyncStorage.setItem(CHAVE_CARTEIRA, "{corrompido");
    const creditos = await montar(React.createElement(Creditos));
    let t = texto(creditos);
    expect(t).toContain("Não foi possível abrir sua carteira de créditos");
    expect(t).not.toContain("Recarregar");
    expect(textosDe(creditos.toJSON())).not.toContain("0");

    const cabecalho = await montar(React.createElement(CabecalhoDoApp));
    t = texto(cabecalho);
    expect(t).toContain("— créditos");
    expect(t).not.toContain("0 créditos");

    const antes = await AsyncStorage.getItem(CHAVE_ANALISES_V2);
    const gaveta = await montar(React.createElement(GavetaDeDescarte, { analiseId: "a", visivel: true, aoFechar: jest.fn(), aoDescartar: jest.fn() }));
    await tocar(gaveta, "Outro motivo");
    await tocar(gaveta, "Descartar imóvel");
    await esperar(20);
    expect(await AsyncStorage.getItem(CHAVE_ANALISES_V2)).toBe(antes);
    expect(await AsyncStorage.getItem(CHAVE_CARTEIRA)).toBe("{corrompido");
    expect(texto(gaveta)).toContain("Não foi possível abrir sua carteira de créditos");
  });
});

describe("Créditos", () => {
  it("mostra o saldo, o extrato em palavras e a frase da versão de teste", async () => {
    const extrato: Carteira["extrato"] = [
      { em: "2026-10-20T15:00:00.000Z", tipo: "descarte", analiseId: "a", delta: 1 },
      { em: "2026-10-20T14:00:00.000Z", tipo: "dossie_cadastral", analiseId: "a", delta: -1 },
      { em: "2026-10-20T12:00:00.000Z", tipo: "cota_inicial", analiseId: null, delta: 3 },
    ];
    await semear([analise("a", { nome: "Casa Forte 3 quartos" })], carteiraCom(3, extrato));
    const arvore = await montar(React.createElement(Creditos));
    const t = texto(arvore);
    expect(t).toContain("Carteira de créditos");
    expect(t).toContain("Saldo disponível");
    expect(t).toContain("Descarte informado · Casa Forte 3 quartos");
    expect(t).toContain("Prédio confirmado · Casa Forte 3 quartos");
    expect(t).toContain("Cota inicial");
    expect(t).toContain("+1");
    expect(t).toContain("−1");
    expect(t).toContain("+3");
    expect(t).toContain("Na versão de teste, créditos não têm valor em dinheiro.");
    expect(t).not.toContain("Recarregar");
    expect(existe(arvore, "Fechar")).toBe(true);
  });

  it("com saldo zero oferece 'Recarregar 3 créditos de teste' e a recarga vai para o extrato", async () => {
    await semear([], carteiraCom(0, [cota]));
    const arvore = await montar(React.createElement(Creditos));
    expect(texto(arvore)).toContain("Recarregar 3 créditos de teste");
    await tocar(arvore, "Recarregar 3 créditos de teste");
    await esperar(20);
    const carteira = await carteiraGravada();
    expect(carteira.saldo).toBe(3);
    expect(carteira.extrato[0]).toMatchObject({ tipo: "recarga_de_teste", delta: 3 });
    const t = texto(arvore);
    expect(t).toContain("Recarga de créditos de teste");
    expect(t).not.toContain("Recarregar 3 créditos de teste");
  });
});

// ——— Sobre os dados ———————————————————————————————————————————————————————————————————

describe("Sobre os dados", () => {
  it("lista cada fonte do meta.json com órgão, licença, datas, registros e colunas", async () => {
    await semear([], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(SobreOsDados));
    const t = texto(arvore);
    expect(META.fontes.length).toBeGreaterThan(0);
    for (const f of META.fontes) {
      expect(t).toContain(f.nome);
      expect(t).toContain(f.orgao);
      for (const coluna of f.colunasUsadas) expect(t).toContain(coluna);
      expect(t).toContain(f.registrosLidos.toLocaleString("pt-BR"));
    }
    expect(t).toContain("ODbL");
    expect(t).toContain("Modificado em");
    expect(t).toContain("Consultado em");
    expect(t).toContain("Registros lidos");
    expect(t).toContain("Colunas usadas");
    expect(t).toContain("Contém dados da Prefeitura do Recife, disponibilizados sob a Open Database License (ODbL).");
    // data do meta.json em dia/mês/ano
    expect(t).toContain("03/10/2026");
  });

  it("diz o que ainda não cobre", async () => {
    await semear([], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(SobreOsDados));
    const t = texto(arvore);
    expect(t).toContain("O que ainda não cobrimos");
    for (const item of ["Aluguel de mercado", "Segurança por bairro", "Alagamento por endereço", "Fotos dos anúncios", "Cobertura por bairro e camada"]) {
      expect(t).toContain(item);
    }
    expect(t).toContain("72 bairros do Recife");
  });
});

// ——— Utilidades da casca ———————————————————————————————————————————————————————————————

/** Elementos que o React Native Web desenha como <button> ou <a>: um dentro do outro quebra a hidratação na web. */
function tocaveisAninhados(arvore: TestRenderer.ReactTestRenderer): string[] {
  const ehTocavel = (n: ReactTestInstance) =>
    typeof n.type === "string" && (typeof n.props.onClick === "function" || typeof n.props.onResponderRelease === "function");
  const nome = (n: ReactTestInstance) => String(n.props.accessibilityLabel ?? n.props["aria-label"] ?? "?");
  const problemas: string[] = [];
  for (const no of arvore.root.findAll(ehTocavel)) {
    for (let pai = no.parent; pai; pai = pai.parent) {
      if (ehTocavel(pai)) {
        problemas.push(`${nome(no)} dentro de ${nome(pai)}`);
        break;
      }
    }
  }
  return problemas;
}

/** O nó de verdade (View) com esse rótulo de acessibilidade: o que recebe o estilo e o toque. */
const hospedeiro = (arvore: TestRenderer.ReactTestRenderer, rotulo: string) =>
  arvore.root.findAll((n) => typeof n.type === "string" && n.props.accessibilityLabel === rotulo)[0];

const estiloDe = (no: ReactTestInstance | undefined) => StyleSheet.flatten(no?.props.style) ?? {};

const itensDoMenu = (arvore: TestRenderer.ReactTestRenderer) =>
  arvore.root.findAll((n) => typeof n.type === "string" && n.props.role === "menuitem");

// ——— Cabeçalho e menu rápido (H2) ———————————————————————————————————————————————————————

describe("Cabeçalho do app (H2)", () => {
  const abrirCabecalho = async (saldo = 7) => {
    await semear([], carteiraCom(saldo, [cota]));
    return montar(React.createElement(CabecalhoDoApp));
  };

  it("a pílula mostra o saldo da carteira, com singular, e abre a rota /creditos", async () => {
    const arvore = await abrirCabecalho(7);
    expect(texto(arvore)).toContain("7 créditos");
    await tocar(arvore, "Carteira de créditos: 7 créditos");
    expect(router.push).toHaveBeenCalledWith("/creditos");
    expect(rotuloDeCreditos(1)).toBe("1 crédito");
    expect(rotuloDeCreditos(0)).toBe("0 créditos");
  });

  it("a marca abre o início", async () => {
    const arvore = await abrirCabecalho();
    await tocar(arvore, "Início Vereda");
    expect(router.push).toHaveBeenCalledWith("/");
  });

  it("a pílula usa Plus Jakarta Sans 600, como .credits-pill-btn, e não mono", async () => {
    const arvore = await abrirCabecalho(7);
    const pilula = arvore.root.findAllByType(Text).find((t) => t.props.children === "7 créditos");
    const estilo = estiloDe(pilula);
    expect(estilo.fontFamily).toBe("PlusJakartaSans");
    expect(estilo.fontWeight).toBe("600");
    expect(estilo.fontFamily).not.toBe("JetBrainsMono");
    expect(estilo.fontVariant).toContain("tabular-nums");
  });

  it("os alvos de toque da marca, da pílula e do menu têm pelo menos 44 × 44", async () => {
    const arvore = await abrirCabecalho();
    for (const rotulo of ["Início Vereda", "Carteira de créditos: 7 créditos", "Menu de navegação"]) {
      const e = estiloDe(hospedeiro(arvore, rotulo));
      expect([rotulo, Math.max(e.minHeight ?? 0, e.height ?? 0) >= 44, Math.max(e.minWidth ?? 0, e.width ?? 0) >= 44]).toEqual([rotulo, true, true]);
    }
  });

  it("não tem gaveta própria com texto fixo: nada de dialog, de registros ou de fontes escritos à mão", async () => {
    const arvore = await abrirCabecalho();
    await tocar(arvore, "Carteira de créditos: 7 créditos");
    await tocar(arvore, "Menu de navegação");
    const t = texto(arvore);
    expect(t).not.toMatch(/422\.776|registros|ODbL|Sobre os dados públicos|Fontes abertas|Uso interno/i);
    expect(arvore.root.findAll((n) => typeof n.type === "string" && n.props.role === "dialog")).toHaveLength(0);
    expect(tocaveisAninhados(arvore)).toEqual([]);
  });

  it("o menu rápido abre e fecha, e leva às rotas reais do app", async () => {
    const arvore = await abrirCabecalho(7);
    expect(itensDoMenu(arvore)).toHaveLength(0);
    await tocar(arvore, "Menu de navegação");
    expect(hospedeiro(arvore, "Menu de navegação")?.props.accessibilityState).toMatchObject({ expanded: true });
    const rotulos = itensDoMenu(arvore).map((n) => textoDoNo(n).replace(/\s+/g, " ").trim());
    expect(rotulos).toEqual(["Início", "Minhas análises", "Dossiês de exemplo", "Carteira de créditos 7", "Sobre os dados", "Cópia do meu caderno"]);
    expect(ITENS_DO_MENU.map((i) => i.rota)).toEqual(["/", "/salvos", "/exemplos/boa-viagem", "/creditos", "/sobre-os-dados", "/dados-do-caderno"]);

    for (const [i, item] of ITENS_DO_MENU.entries()) {
      jest.clearAllMocks();
      if (itensDoMenu(arvore).length === 0) await tocar(arvore, "Menu de navegação");
      const toque = arvore.root.findAll((n) => typeof n.type !== "string" && n.props.role === "menuitem" && typeof n.props.onPress === "function")[i];
      await act(async () => {
        (toque?.props.onPress as () => void)();
      });
      expect([item.rotulo, (router.push as jest.Mock).mock.calls]).toEqual([item.rotulo, [[item.rota]]]);
      // Escolher um item fecha o menu.
      expect(itensDoMenu(arvore)).toHaveLength(0);
    }
  });

  it("tocar fora do menu o fecha; cada item tem alvo de 44 px; não há etiquetas de código (T1, DEMO, T15)", async () => {
    const arvore = await abrirCabecalho();
    await tocar(arvore, "Menu de navegação");
    for (const item of itensDoMenu(arvore)) expect(estiloDe(item).minHeight).toBeGreaterThanOrEqual(44);
    const t = texto(arvore);
    for (const etiqueta of ["T1", "T4", "DEMO", "T15"]) expect(t.split("\n")).not.toContain(etiqueta);
    await tocar(arvore, "Fechar menu");
    expect(itensDoMenu(arvore)).toHaveLength(0);
  });
});

describe("Dock inferior", () => {
  it("as quatro abas têm alvo de 44 px e cores por token", async () => {
    await semear([], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(DockInferior));
    for (const aba of ["Explorar", "Dossiê", "Comparar", "Visita"]) {
      expect(estiloDe(hospedeiro(arvore, aba)).minHeight).toBeGreaterThanOrEqual(44);
    }
    await tocar(arvore, "Comparar");
    expect(router.push).toHaveBeenCalledWith("/comparar");
    const ativa = arvore.root.findAll((n) => typeof n.type === "string" && n.props.accessibilityState?.selected === true);
    expect(ativa.map((n) => n.props.accessibilityLabel)).toEqual(["Explorar"]);
  });
});

// ——— Aviso na raiz (H1) e "Apagar meus dados" (H8) ———————————————————————————————————————————

describe("Raiz do app", () => {
  const montarRaiz = async (conteudo: React.ReactElement) => {
    mockConteudoDoStack = conteudo;
    let arvore!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      arvore = TestRenderer.create(React.createElement(Raiz));
    });
    montadas.push(arvore);
    await esperar(30);
    return arvore;
  };
  afterEach(() => {
    mockConteudoDoStack = null;
  });

  it("H1: o provedor de aviso mora na raiz: qualquer rota abaixo dela avisa, sem provedor próprio", async () => {
    await semear([], carteiraCom(3, [cota]));
    let aviso!: ReturnType<typeof useAviso>;
    const Sonda = () => {
      aviso = useAviso();
      return null;
    };
    const arvore = await montarRaiz(React.createElement(Sonda));
    expect(texto(arvore)).not.toContain("+1 crédito");
    await act(async () => aviso.mostrarAviso("+1 crédito"));
    expect(temTextoExato(arvore, "+1 crédito")).toBe(true);
    // Um aviso novo troca o anterior em vez de somar.
    await act(async () => aviso.mostrarAviso("Removido dos salvos"));
    expect(temTextoExato(arvore, "Removido dos salvos")).toBe(true);
    expect(temTextoExato(arvore, "+1 crédito")).toBe(false);
  });

  it("H1: o toast do descarte feito fora das telas com provedor próprio aparece (gaveta de descarte na raiz)", async () => {
    await semear([analise("a")], carteiraCom(2, [pagou("a"), cota]));
    const arvore = await montarRaiz(
      React.createElement(GavetaDeDescarte, { analiseId: "a", visivel: true, aoFechar: jest.fn(), aoDescartar: jest.fn() }),
    );
    await tocar(arvore, "Outro motivo");
    await tocar(arvore, "Descartar imóvel");
    await esperar(30);
    expect(temTextoExato(arvore, "+1 crédito")).toBe(true);
    expect((await carteiraGravada()).saldo).toBe(3);
  });

  it("as telas Salvos e Créditos não montam provedor de aviso próprio", () => {
    for (const arquivo of ["src/app/(abas)/salvos.tsx", "src/app/creditos.tsx"]) {
      expect([arquivo, readFileSync(arquivo, "utf8").includes("<ProvedorDeAviso")]).toEqual([arquivo, false]);
    }
    expect(readFileSync("src/app/_layout.tsx", "utf8")).toContain("<ProvedorDeAviso>");
  });

  describe("H8: Apagar meus dados deste aparelho", () => {
    const estado = { lista: [] as { id: string }[], saldo: -1 };
    const Sonda = () => {
      estado.lista = useAnalises().lista;
      estado.saldo = useCarteira().saldo;
      return React.createElement(SobreOsDados);
    };
    const chavesDoApp = async () => (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith("vereda-")).sort();
    const semearTudo = async () => {
      await semear([analise("a"), analise("b")], carteiraCom(7, [cota]));
      await AsyncStorage.setItem("vereda-ativa-v1", "a");
      await AsyncStorage.setItem("vereda-mock", JSON.stringify({ apagado: false }));
      await AsyncStorage.setItem("vereda-mock-preferencias", JSON.stringify({ tema: "claro" }));
      await AsyncStorage.setItem("outro-app-chave", "fica");
    };

    it("diz o que será apagado e só apaga no segundo toque", async () => {
      await semearTudo();
      const arvore = await montarRaiz(React.createElement(Sonda));
      expect(estado.lista).toHaveLength(2);
      expect(estado.saldo).toBe(7);
      expect(texto(arvore)).toContain("Apagar meus dados deste aparelho");
      expect(texto(arvore)).not.toContain("Sim, apagar tudo");

      // Primeiro toque: só abre a confirmação, que diz o que vai embora.
      await tocar(arvore, "Apagar meus dados deste aparelho");
      const t = texto(arvore);
      expect(t).toContain("Apagar tudo o que o Vereda guardou aqui?");
      expect(t).toMatch(/Suas análises/);
      expect(t).toMatch(/Seus créditos/);
      expect(t).toMatch(/Suas visitas/);
      expect(t).toContain("Não dá para desfazer");
      expect(await chavesDoApp()).toHaveLength(5);
      expect(estado.lista).toHaveLength(2);

      // Cancelar volta ao botão e não apaga nada.
      await tocar(arvore, "Cancelar");
      expect(texto(arvore)).not.toContain("Sim, apagar tudo");
      expect(await chavesDoApp()).toHaveLength(5);
    });

    it("apaga toda chave 'vereda-*', mantém as de outros apps, zera a memória das telas e volta ao início", async () => {
      await semearTudo();
      const arvore = await montarRaiz(React.createElement(Sonda));
      await tocar(arvore, "Apagar meus dados deste aparelho");
      await tocar(arvore, "Sim, apagar tudo");
      await esperar(60);

      // O armazenamento não guarda mais nada do que a pessoa fez: as análises, a análise ativa e as preferências sumiram.
      const restantes = await chavesDoApp();
      expect(restantes).not.toContain("vereda-analises-v2");
      expect(restantes).not.toContain("vereda-analises-v1");
      expect(restantes).not.toContain("vereda-ativa-v1");
      expect(restantes).not.toContain("vereda-mock");
      expect(restantes).not.toContain("vereda-mock-preferencias");
      expect(await AsyncStorage.getItem("outro-app-chave")).toBe("fica");
      // A carteira recomeça do zero (a cota inicial de um aparelho novo), não com o saldo que a pessoa tinha.
      const carteira = await carteiraGravada();
      expect(carteira.saldo).toBe(3);
      expect(carteira.extrato).toHaveLength(1);
      expect(carteira.extrato[0]?.tipo).toBe("cota_inicial");

      // A memória acompanha: nenhuma tela continua mostrando o que foi apagado.
      expect(estado.lista).toHaveLength(0);
      expect(estado.saldo).toBe(3);
      expect(router.dismissTo).toHaveBeenCalledWith("/");
      expect(temTextoExato(arvore, "Dados apagados deste aparelho")).toBe(true);
    });

    it("sem chave nenhuma do app, apagar não dá erro", async () => {
      await AsyncStorage.clear();
      await expect(apagarDadosDoAparelho()).resolves.toBe(0);
    });
  });
});

// ——— Salvos e Comparar: botões irmãos, sombra por token, rastro de confiança ———————————————

describe("Botões irmãos e cores por token (H3, H8)", () => {
  it("Salvos: o cartão, 'Remover' e os links não ficam um dentro do outro", async () => {
    await semear([analise("alu1", { nome: "Casa Forte 3 quartos" }), analise("alu2", { nome: "Graças 2 quartos" })], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Salvos));
    expect(existe(arvore, "Remover Casa Forte 3 quartos dos salvos")).toBe(true);
    expect(tocaveisAninhados(arvore)).toEqual([]);
    const remover = estiloDe(hospedeiro(arvore, "Remover Casa Forte 3 quartos dos salvos"));
    expect(remover.width).toBeGreaterThanOrEqual(44);
    expect(remover.height).toBeGreaterThanOrEqual(44);
  });

  it("Comparar: nenhum toque dentro de toque, e a sombra do segmento ativo vem do token (sem hex solto)", async () => {
    await semear(
      [
        analise("alu1", { nome: "Casa Forte 3 quartos" }),
        analise("alu2", { nome: "Graças 2 quartos", bairro: "gracas", bairroTexto: "Graças" }),
      ],
      carteiraCom(3, [cota]),
    );
    const arvore = await montar(React.createElement(Comparar));
    expect(tocaveisAninhados(arvore)).toEqual([]);
    const ativos = arvore.root.findAll(
      (n) =>
        typeof n.type === "string" &&
        (n.props.role === "radio" || n.props.role === "tab") &&
        (n.props.accessibilityState?.checked === true || n.props.accessibilityState?.selected === true),
    );
    expect(ativos.length).toBeGreaterThan(0);
    for (const ativo of ativos) {
      const sombra = estiloDe(ativo).boxShadow as string;
      expect(sombra).toBe(`0 1px 3px ${comAlfa(CORES_CLARO["cor-texto"], 0.05)}`);
      expect(sombra).not.toMatch(/rgba?\(/);
    }
  });

  it("Sobre os dados usa o RastroDeConfianca de src/componentes/fonte, com as quatro origens, e não uma cópia", async () => {
    await semear([], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(SobreOsDados));
    const rastros = arvore.root.findAllByType(RastroDeConfianca);
    expect(rastros.map((r) => r.props.confianca)).toEqual(["oficial", "declarado", "inferencia", "nao_sabemos"]);
    expect(rastros.map((r) => r.props.texto)).toEqual([
      "registro oficial: IPTU, ITBI, Licenciamento e Lotes",
      "declarado no anúncio: preço, área, condomínio",
      "inferência do cadastro: sinais que pedem confirmação",
      "não sabemos: vira pergunta para a visita",
    ]);
    expect(readFileSync("src/app/sobre-os-dados.tsx", "utf8")).not.toContain("TracoDaOrigem");
  });

  it("Sobre os dados: a pessoa vê o botão de apagar dados e o aviso de que ficam só neste aparelho", async () => {
    await semear([], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(SobreOsDados));
    expect(texto(arvore)).toContain("Seus dados neste aparelho");
    expect(existe(arvore, "Apagar meus dados deste aparelho")).toBe(true);
  });
});

// ——— Explorar: foco do cartão (T1), aviso do caderno (T2), achado e área do cartão (T3) ————————————————

describe("Explorar: cartão da análise", () => {
  afterEach(() => {
    mockConteudoDoStack = null;
  });
  const abrirExplorar = async (analises: AnaliseV2[]) => {
    await semear(analises, carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Explorar));
    await esperar(30); // o cartão lê o índice do bairro depois da primeira pintura
    return arvore;
  };
  const hospedeiroDoCartao = (arvore: TestRenderer.ReactTestRenderer, nome: string) =>
    arvore.root.findAll(
      (n) => typeof n.type === "string" && typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.startsWith(`${nome}.`),
    )[0] as ReactTestInstance;
  const estiloDoTexto = (arvore: TestRenderer.ReactTestRenderer, conteudo: string) =>
    StyleSheet.flatten(arvore.root.findAll((n) => n.type === Text && textoDoNo(n) === conteudo)[0]?.props.style) ?? {};

  const indice = indiceDoBairro("casa-forte");
  const casaForte = () => edificiosDoBairro("casa-forte");
  const confirmadaEm = (id: string, e: Edificio, mudancas: Mudancas = {}) =>
    analise(id, {
      nome: `Prédio ${id}`,
      vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl, confirmadoEm: INSTANTE, indiceGeradoEm: META.geradoEm },
      ...mudancas,
    });
  /** O achado principal que o dossiê mostra: a mesma chamada de `derivarDossie` da tela do dossiê. */
  const achadoDoDossie = (a: AnaliseV2, e: Edificio | null, outras: AnaliseV2[] = []) =>
    derivarDossie(a, e, indice.contexto, indice.obras, outras, new Date()).achados.principal?.titulo ?? null;

  it("T1: o anel de foco do teclado aparece inteiro: nada acima do toque do cartão corta o que passa da borda", async () => {
    const arvore = await abrirExplorar([analise("alu1", { nome: "Imóvel alu1" })]);
    const toque = hospedeiroDoCartao(arvore, "Imóvel alu1");
    expect(toque).toBeDefined();

    // O contêiner do cartão não recorta (é ele que cortava o anel); o topo e o próprio toque recortam os cantos por dentro.
    const cartao = (() => {
      for (let n = toque.parent; n; n = n.parent) if (typeof n.type === "string" && n.props.style !== undefined) return n;
      return undefined;
    })();
    expect(estiloDe(cartao).overflow).not.toBe("hidden");
    expect(estiloDe(cartao).borderRadius).toBe(18);
    expect(estiloDe(toque).borderRadius).toBe(17);
    expect(estiloDe(toque).overflow).toBe("hidden");
    const topos = toque.findAll((n) => typeof n.type === "string" && StyleSheet.flatten(n.props.style)?.aspectRatio === 16 / 10);
    expect(topos).toHaveLength(1);
    expect(estiloDe(topos[0]).overflow).toBe("hidden");
    expect(estiloDe(topos[0]).borderTopLeftRadius).toBe(17);

    // Nenhum ancestral do toque, até a raiz, recorta o conteúdo.
    const recortando: string[] = [];
    for (let n = toque.parent; n; n = n.parent) {
      if (typeof n.type === "string" && StyleSheet.flatten(n.props.style)?.overflow === "hidden") recortando.push(String(n.type));
    }
    expect(recortando).toEqual([]);
  });

  it("T1: com o foco vindo do teclado (web), o toque do cartão ganha o anel de 2 px em azul cadastral, por fora", async () => {
    const arvore = await abrirExplorar([analise("alu1", { nome: "Imóvel alu1" })]);
    const plataforma = jest.replaceProperty(Platform, "OS", "web");
    try {
      const alvo = { matches: (seletor: string) => seletor === ":focus-visible" };
      await act(async () => {
        (hospedeiroDoCartao(arvore, "Imóvel alu1").props.onFocus as (e: unknown) => void)({ target: alvo, currentTarget: alvo });
      });
      const com = estiloDe(hospedeiroDoCartao(arvore, "Imóvel alu1"));
      expect(com).toMatchObject({ outlineWidth: 2, outlineStyle: "solid", outlineColor: CORES_CLARO["cor-azul-cadastral"], outlineOffset: 2 });
      await act(async () => {
        (hospedeiroDoCartao(arvore, "Imóvel alu1").props.onBlur as () => void)();
      });
      expect(estiloDe(hospedeiroDoCartao(arvore, "Imóvel alu1")).outlineWidth).toBeUndefined();
    } finally {
      plataforma.restore();
    }
  });

  it("T3: o ponto ferrugem do cartão é o achado principal do dossiê (prédio confirmado, contexto e obras do bairro)", async () => {
    const e = casaForte().find((x) => achadoDoDossie(confirmadaEm("c", x), x) !== null);
    if (!e) throw new Error("nenhum prédio de Casa Forte gera achado");
    const a = confirmadaEm("conf", e);
    const esperado = achadoDoDossie(a, e);
    expect(esperado).not.toBeNull();
    // A leitura antiga (primeira anomalia da leitura) não tem o que mostrar aqui: o achado vem só do cadastro do prédio.
    expect(primeiraAnomaliaPendente(a)).toBeNull();

    const arvore = await abrirExplorar([a]);
    expect(textosDe(arvore.toJSON()).filter((t) => t === esperado)).toHaveLength(1);
    expect(estiloDoTexto(arvore, esperado as string).color).toBe(CORES_CLARO["cor-barro-texto"]);
  });

  it("T3: sem vínculo confirmado a derivação não usa o prédio: o achado do cadastro não aparece no cartão", async () => {
    const e = casaForte().find((x) => achadoDoDossie(confirmadaEm("c", x), x) !== null);
    if (!e) throw new Error("nenhum prédio de Casa Forte gera achado");
    const achadoDoPredio = achadoDoDossie(confirmadaEm("c", e), e) as string;
    const pendente = analise("pen", { nome: "Imóvel pen" });
    expect(achadoDoDossie(pendente, null)).toBeNull();
    const arvore = await abrirExplorar([pendente]);
    expect(textosDe(arvore.toJSON())).not.toContain(achadoDoPredio);
    expect(texto(arvore)).toContain("Prédio não confirmado");
  });

  it("T3: área 'a confirmar' aparece como 'Área a confirmar' na faixa de especificações, no lugar do valor", async () => {
    const arvore = await abrirExplorar([
      analise("conf", { nome: "Imóvel conf", declarados: { area: v(100, true) } }),
      analise("sem", { nome: "Imóvel sem", declarados: { area: v(null, true), quartos: vazio, banheiros: vazio, vagas: vazio } }),
      analise("ok", { nome: "Imóvel ok", declarados: { area: v(84.5) } }),
    ]);
    const textos = textosDe(arvore.toJSON());
    // Duas análises com a área marcada, uma delas sem nenhuma outra especificação (a faixa aparece só por causa da área).
    expect(textos.filter((t) => t === "Área a confirmar")).toHaveLength(2);
    expect(textos).not.toContain("100 m²");
    expect(textos).toContain("84,5 m²");
  });

  it("T2: o aviso da quarentena fica numa faixa creme com texto ferrugem, no topo, e continua depois do toast", async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("alu1", { nome: "Imóvel alu1" }), { lixo: true }]));
    // Pela raiz do app: é lá que mora o provedor do toast, acima do provedor do caderno.
    mockConteudoDoStack = React.createElement(Explorar);
    let arvore!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      arvore = TestRenderer.create(React.createElement(Raiz));
    });
    montadas.push(arvore);
    await esperar(60);
    const faixa = () => arvore.root.findAll((n) => typeof n.type === "string" && n.props.role === "note");
    const fato = "1 análise não pôde ser aberta e foi guardada à parte. As outras continuam no seu caderno.";
    expect(faixa()).toHaveLength(1);
    expect(textoDoNo(faixa()[0] as ReactTestInstance)).toBe(fato);
    expect(estiloDe(faixa()[0])).toMatchObject({
      backgroundColor: CORES_CLARO["cor-creme"],
      borderColor: CORES_CLARO["cor-linha"],
      borderRadius: 13,
    });
    expect(estiloDoTexto(arvore, fato).color).toBe(CORES_CLARO["cor-barro-texto"]);
    // No topo: antes do cartão de "Auditar novo anúncio".
    expect(texto(arvore).indexOf(fato)).toBeGreaterThanOrEqual(0);
    expect(texto(arvore).indexOf(fato)).toBeLessThan(texto(arvore).indexOf("Auditar novo anúncio"));
    // O toast (role status) leva o mesmo texto...
    const toast = () => arvore.root.findAll((n) => typeof n.type === "string" && n.props.role === "status" && textoDoNo(n) === fato);
    expect(toast()).toHaveLength(1);
    // ...e some em ~3 s; a faixa fica.
    await esperar(3300);
    expect(toast()).toHaveLength(0);
    expect(faixa()).toHaveLength(1);
    expect(textoDoNo(faixa()[0] as ReactTestInstance)).toBe(fato);
  }, 10000);

  it("T2: com várias análises na quarentena o aviso diz quantas; sem quarentena não há faixa", async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([{ lixo: 1 }, { lixo: 2 }, { lixo: 3 }]));
    const arvore = await montar(React.createElement(Explorar));
    const faixas = arvore.root.findAll((n) => typeof n.type === "string" && n.props.role === "note");
    expect(faixas.map(textoDoNo)).toEqual(["3 análises não puderam ser abertas e foram guardadas à parte."]);

    const limpa = await abrirExplorar([analise("alu1", { nome: "Imóvel alu1" })]);
    expect(limpa.root.findAll((n) => typeof n.type === "string" && n.props.role === "note")).toHaveLength(0);
  });
});

describe("Salvos: aviso do caderno (T2)", () => {
  it("mostra a faixa da quarentena no topo, antes do cabeçalho, e não a mostra sem quarentena", async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify([analise("alu1", { nome: "Casa Forte 3 quartos" }), { lixo: true }]));
    const arvore = await montar(React.createElement(Salvos));
    const faixas = arvore.root.findAll((n) => typeof n.type === "string" && n.props.role === "note");
    const fato = "1 análise não pôde ser aberta e foi guardada à parte. As outras continuam no seu caderno.";
    expect(faixas.map(textoDoNo)).toEqual([fato]);
    expect(estiloDe(faixas[0])).toMatchObject({ backgroundColor: CORES_CLARO["cor-creme"], borderRadius: 13 });
    const t = texto(arvore);
    expect(t.indexOf(fato)).toBeLessThan(t.indexOf("Sua seleção"));
    expect(t).toContain("Casa Forte 3 quartos");

    await semear([analise("alu1", { nome: "Casa Forte 3 quartos" })], carteiraCom(3, [cota]));
    const limpa = await montar(React.createElement(Salvos));
    expect(limpa.root.findAll((n) => typeof n.type === "string" && n.props.role === "note")).toHaveLength(0);
  });
});

// ——— Prédio (T4) ————————————————————————————————————————————————————————————————————————

describe("Prédio: área a confirmar não vira pista (T4)", () => {
  const edificio = edificiosDoBairro("casa-forte").find((e) => e.tipologias.length > 0);
  const areaDoCadastro = edificio?.tipologias[0]?.area as number;
  /** Só a área do anúncio como pista: sem rua, sem nome de edifício, sem andar, sem ano. */
  const soComArea = (id: string, aConfirmar: boolean) =>
    analise(id, { nome: `Imóvel ${id}`, declarados: { area: v(areaDoCadastro, aConfirmar), andar: vazio } });
  const abrirPredio = async (a: AnaliseV2) => {
    await semear([a], carteiraCom(3, [cota]));
    mockParametros = { id: a.id };
    return montar(React.createElement(Predio));
  };

  it("só área não oferece confirmação direta e permite examinar alternativas sem cobrar", async () => {
    expect(edificio).toBeDefined();
    const arvore = await abrirPredio(soComArea("nor", false));
    expect(existe(arvore, "É este prédio")).toBe(false);
    expect(texto(arvore)).toContain("Precisamos de mais uma informação");
    expect(texto(arvore)).not.toContain("Usa 1 crédito");
    await tocar(arvore, "Examinar sugestões");
    expect(texto(arvore)).toContain("compatív");
    const alternativa = arvore.root.findAll((n) => typeof n.props.onPress === "function" && n.props.accessibilityLabel?.startsWith("Examinar ") && !n.props.accessibilityLabel.startsWith("Examinar sugestões"))[0];
    expect(alternativa).toBeDefined();
    await act(async () => { alternativa!.props.onPress(); });
    expect(existe(arvore, "É este prédio")).toBe(true);
    expect(texto(arvore)).toContain("Confira o endereço antes de confirmar");
    expect(texto(arvore)).not.toContain("garante");
    expect((await carteiraGravada()).saldo).toBe(3);
  });

  it("saldo zero permite buscar e escolher, mas confirmação pede créditos sem gravar vínculo", async () => {
    const a = analise("sem-creditos", { logradouro: edificio!.logradouro, numero: edificio!.numero });
    await semear([a], carteiraCom(0, [cota, pagou("um"), pagou("dois"), pagou("tres")]));
    mockParametros = { id: a.id };
    const arvore = await montar(React.createElement(Predio));
    expect(existe(arvore, "É este prédio")).toBe(true);
    await tocar(arvore, "É este prédio");
    expect((await carteiraGravada()).saldo).toBe(0);
    expect((await gravadas())[0]?.vinculo.estado).toBe("pendente");
    expect(texto(arvore)).toContain("créditos");
  });

  it("com a área 'a confirmar', nenhum prédio é sugerido e o crédito não é oferecido", async () => {
    const arvore = await abrirPredio(soComArea("aco", true));
    expect(existe(arvore, "É este prédio")).toBe(false);
    expect(texto(arvore)).not.toContain("Usa 1 crédito");
    expect(texto(arvore)).toContain("Precisamos de mais uma informação");
    expect(existe(arvore, "Continuar sem identificar")).toBe(true);
    await tocar(arvore, "Continuar sem identificar");
    expect((await gravadas())[0]?.vinculo.estado).toBe("pulado");
    expect((await carteiraGravada()).saldo).toBe(3);
  });
});

// ——— Lote A: custos nas superfícies de decisão ———————————————————————————————

describe("Lote A: custo mensal com a mesma semântica", () => {
  it.each(["salvos", "explorar", "comparar"])("%s mostra mensal 3.100, anunciado 2.500 e pendências; edição atualiza a soma", async (superficie) => {
    const a = analise("lote-a", { nome: "Apartamento de teste com nome longo para comparar custos", declarados: { preco: v(2500), condominio: v(600), iptu: iptu(null, "desconhecido"), seguroIncendio: vazio } });
    await semear([a, analise("lote-b")], carteiraCom(3, [cota]));
    let estado!: ReturnType<typeof useAnalises>;
    const Sonda = () => {
      estado = useAnalises();
      return React.createElement(superficie === "salvos" ? Salvos : superficie === "explorar" ? Explorar : Comparar);
    };
    const arvore = await montar(React.createElement(Sonda));
    let t = texto(arvore);
    expect(t).toContain("Mensal conhecido");
    expect(t).toContain("R$ 3.100");
    expect(t).toContain("Aluguel anunciado");
    expect(t).toContain("R$ 2.500");
    expect(t).toContain("+ valores a confirmar");
    expect(t).not.toContain("Total conhecido");
    await act(async () => { await estado.salvar({ ...a, declarados: { ...a.declarados, condominio: v(800) } }); });
    t = texto(arvore);
    expect(t).toContain("R$ 3.300");
    expect(t).not.toContain("R$ 3.100");
  });
});

// ——— Gavetas de rota: respiro do primeiro título (T5) ——————————————————————————————————————————

describe("Créditos e Sobre os dados: o primeiro título não fica colado na divisória (T5)", () => {
  /** O recuo de cima do bloco que contém o texto: o primeiro ancestral com `paddingTop`. */
  const recuoDoTitulo = (arvore: TestRenderer.ReactTestRenderer, titulo: string) => {
    const no = arvore.root.findAll((n) => n.type === Text && textoDoNo(n) === titulo)[0];
    for (let n = no?.parent; n; n = n.parent) {
      const recuo = typeof n.type === "string" ? StyleSheet.flatten(n.props.style)?.paddingTop : undefined;
      if (typeof recuo === "number") return recuo;
    }
    return undefined;
  };

  it("Créditos: 'Saldo disponível' começa a cerca de 13 px da divisória, como nas outras gavetas", async () => {
    await semear([], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(Creditos));
    expect(recuoDoTitulo(arvore, "Saldo disponível")).toBe(RESPIRO_NO_TOPO_DA_GAVETA);
    expect(RESPIRO_NO_TOPO_DA_GAVETA).toBeGreaterThanOrEqual(12);
    expect(RESPIRO_NO_TOPO_DA_GAVETA).toBeLessThanOrEqual(14);
  });

  it("Sobre os dados: 'De onde vêm os números' começa a cerca de 13 px da divisória", async () => {
    await semear([], carteiraCom(3, [cota]));
    const arvore = await montar(React.createElement(SobreOsDados));
    expect(recuoDoTitulo(arvore, "De onde vêm os números")).toBe(RESPIRO_NO_TOPO_DA_GAVETA);
  });
});

describe("Cores só por token nos arquivos desta frente", () => {
  const arquivos = [
    "src/app/_layout.tsx",
    "src/app/(abas)/index.tsx",
    "src/app/(abas)/ler.tsx",
    "src/app/(abas)/predio.tsx",
    "src/app/(abas)/salvos.tsx",
    "src/app/(abas)/comparar.tsx",
    "src/app/editar.tsx",
    "src/app/sobre-os-dados.tsx",
    "src/app/creditos.tsx",
    ...["src/componentes/casca", "src/componentes/comparar", "src/componentes/revisao"].flatMap((pasta) =>
      readdirSync(pasta)
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => `${pasta}/${f}`),
    ),
  ];

  it.each(arquivos)("%s não tem cor solta (hex ou rgb/rgba) no código", (arquivo) => {
    // Sem os comentários: a regra é sobre o código, e os comentários citam o protótipo.
    const codigo = readFileSync(arquivo, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(codigo.match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(/g)).toBeNull();
  });
});
