// Camadas do mapa dos exemplos (M2, 18/11/2026): "Alagamento" era oferecida no seletor e num botão do dossiê de exemplo,
// mas não desenhava nada (a faixa hachurada saiu com o mapa-base). O teste monta a tela do mapa e as seções com os
// provedores de verdade e toca os controles: o seletor só oferece o que tem desenho, um link antigo cai em "Ruas", e
// nenhum botão do dossiê leva a uma camada que o mapa não oferece.
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import TelaDoMapa from "../src/app/exemplos/[id]/(abas)/mapa";
import { Botao } from "../src/componentes/Botao";
import { SecoesDoDossie } from "../src/componentes/dossie/Secoes";
import { Mapa } from "../src/componentes/mapa/Mapa";
import { dossies, IDS_DOSSIES } from "../src/dados/dossies";
import type { Dossie } from "../src/dados/esquema";
import { DadosNoAparelho } from "../src/estado/Aparelho";
import { PreferenciasDoMock } from "../src/estado/Preferencias";
import { SessaoDoApp } from "../src/estado/Sessao";
import { ContextoDoDossie } from "../src/navegacao/useDossie";
import { TemaDoApp } from "../src/tema/Tema";

type Navegacao = { pathname?: string; params?: { id?: string; camada?: string } };
type Globais = { __params: { id?: string; camada?: string }; __navegacoes: Navegacao[] };
const G = globalThis as unknown as Globais;

jest.mock("expo-router", () => {
  const g = globalThis as unknown as Globais;
  return {
    router: {
      push: () => undefined,
      replace: () => undefined,
      back: () => undefined,
      canGoBack: () => true,
      navigate: (destino: Navegacao) => void g.__navegacoes.push(destino),
      setParams: (novos: { camada?: string }) => {
        g.__params = { ...g.__params, ...novos };
      },
    },
    useLocalSearchParams: () => g.__params,
    Link: () => null,
  };
});
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const dossie = (id: string): Dossie => {
  const d = dossies.get(id);
  if (!d) throw new Error(`Dossiê sem dados: ${id}`);
  return d;
};

async function montar(d: Dossie, elemento: React.ReactElement): Promise<TestRenderer.ReactTestRenderer> {
  let arvore!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    arvore = TestRenderer.create(
      React.createElement(
        TemaDoApp,
        null,
        React.createElement(
          PreferenciasDoMock,
          null,
          React.createElement(DadosNoAparelho, null, React.createElement(SessaoDoApp, null, React.createElement(ContextoDoDossie.Provider, { value: d }, elemento))),
        ),
      ),
    );
  });
  // As preferências e os dados do aparelho chegam do armazenamento (simulado) depois do primeiro desenho.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return arvore;
}

/** As opções do seletor "Camada", na ordem, com a marcada. */
function camadasOferecidas(arvore: TestRenderer.ReactTestRenderer): { nomes: string[]; marcada: string | null } {
  const grupo = arvore.root.find((n) => typeof n.type === "string" && n.props.role === "radiogroup" && n.props.accessibilityLabel === "Camada");
  const radios = grupo.findAll((n) => typeof n.type === "string" && n.props.role === "radio");
  const nomeDe = (n: TestRenderer.ReactTestInstance) => n.findAll((x) => typeof x.props.children === "string").map((x) => x.props.children as string)[0] ?? "";
  const marcado = radios.find((n) => n.props["aria-checked"] === true || (n.props.accessibilityState as { checked?: boolean } | undefined)?.checked === true);
  return { nomes: radios.map(nomeDe), marcada: marcado ? nomeDe(marcado) : null };
}

beforeEach(() => {
  G.__params = { id: "casa-forte" };
  G.__navegacoes = [];
});

describe("mapa dos exemplos: só as camadas que têm desenho", () => {
  it("o seletor oferece Ruas, 3D e sombra e Calor; Alagamento não aparece", async () => {
    const arvore = await montar(dossie("casa-forte"), React.createElement(TelaDoMapa));
    expect(camadasOferecidas(arvore)).toEqual({ nomes: ["Ruas", "3D e sombra", "Calor"], marcada: "Ruas" });
    expect(JSON.stringify(arvore.toJSON())).not.toContain("Alagamento");
    await act(async () => arvore.unmount());
  });

  it("um link antigo com ?camada=alagamento cai em Ruas, sem painel de camada", async () => {
    G.__params = { id: "casa-forte", camada: "alagamento" };
    const arvore = await montar(dossie("casa-forte"), React.createElement(TelaDoMapa));
    expect(camadasOferecidas(arvore).marcada).toBe("Ruas");
    expect(arvore.root.findByType(Mapa).props.camada).toBe("ruas");
    await act(async () => arvore.unmount());
  });

  it("as camadas que ficaram continuam valendo pelo link e pelo seletor", async () => {
    G.__params = { id: "casa-forte", camada: "calor" };
    const arvore = await montar(dossie("casa-forte"), React.createElement(TelaDoMapa));
    expect(camadasOferecidas(arvore).marcada).toBe("Calor");
    expect(arvore.root.findByType(Mapa).props.camada).toBe("calor");
    // Tocar em cada opção pede ao roteador exatamente uma das camadas oferecidas ("Ruas" tira o parâmetro).
    const grupo = arvore.root.find((n) => typeof n.type === "string" && n.props.role === "radiogroup" && n.props.accessibilityLabel === "Camada");
    const pedidas: (string | undefined)[] = [];
    for (const radio of grupo.findAll((n) => typeof n.type !== "string" && n.props.role === "radio" && typeof n.props.onPress === "function")) {
      act(() => (radio.props.onPress as () => void)());
      pedidas.push(G.__params.camada);
    }
    expect([...new Set(pedidas)]).toEqual([undefined, "3d", "calor"]);
    await act(async () => arvore.unmount());
  });
});

describe("seções do dossiê de exemplo", () => {
  it.each([...IDS_DOSSIES])("%s: nenhum botão leva a uma camada que o mapa não oferece, e a seção de alagamento continua com o seu fato", async (id) => {
    const d = dossie(id);
    const arvore = await montar(d, React.createElement(SecoesDoDossie, { dossie: d, aoMedir: () => undefined }));
    // As seções começam fechadas: abre todas pelo cabeçalho, como quem lê o dossiê inteiro.
    const fechadas = () => arvore.root.findAll((n) => typeof n.type !== "string" && n.props.role === "button" && n.props["aria-expanded"] === false && typeof n.props.onPress === "function");
    for (let i = 0; i < 40 && fechadas().length > 0; i++) await act(async () => (fechadas()[0]!.props.onPress as () => void)());
    for (const botao of arvore.root.findAllByType(Botao)) {
      if (botao.props.rotulo === "Abrir mapa" || botao.props.rotulo === "Ver em 3D") act(() => (botao.props.onPress as () => void)());
    }
    const camadas = G.__navegacoes.filter((n) => n.pathname === "/exemplos/[id]/mapa").map((n) => n.params?.camada);
    expect(camadas.length).toBeGreaterThan(0);
    for (const c of camadas) expect(["3d", "calor"]).toContain(c);
    // O fato da faixa marginal não dependia do mapa: continua na seção.
    const faixa = d.secoes.find((s) => s.id === "alagamento")?.fatos.find((f) => f.id === "faixa_marginal");
    expect(faixa).toBeDefined();
    expect(JSON.stringify(arvore.toJSON())).toContain(faixa!.texto);
    await act(async () => arvore.unmount());
  });
});
