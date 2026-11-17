// Dossiês de exemplo (/exemplos/*), L3: a régua que compara o preço por m² do anúncio com os quartis de avaliação fiscal do
// ITBI por m² saiu (Revisão 2.5: a área do ITBI inclui área comum). Os três exemplos de compra (Casa Forte, Graças e
// Madalena) não desenham a régua, não mostram o rótulo de registro oficial nem o rodapé do ITBI; no lugar, uma frase. Os dois de
// aluguel (Boa Viagem e Espinheiro) seguem com a régua. Os JSON de docs/mock não mudam: o teste lê os mesmos arquivos.
import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { CartaoDoAnuncio } from "../src/componentes/dossie/Topo";
import { FRASE_DA_REGUA_DO_ITBI_RETIRADA, reguaEDoItbi } from "../src/componentes/fatos/Regua";
import { dossies, IDS_DOSSIES } from "../src/dados/dossies";
import type { Dossie } from "../src/dados/esquema";
import { DadosNoAparelho } from "../src/estado/Aparelho";
import { PreferenciasDoMock } from "../src/estado/Preferencias";
import { SessaoDoApp } from "../src/estado/Sessao";
import { ContextoDoDossie } from "../src/navegacao/useDossie";
import { TemaDoApp } from "../src/tema/Tema";
import VerFonte from "../src/app/exemplos/[id]/fonte/[fato]";
import IssoEstaErrado from "../src/app/exemplos/[id]/contestar/[fato]";

type Globais = { __params: { id?: string; fato?: string } };
const G = globalThis as unknown as Globais;

jest.mock("expo-router", () => ({
  router: { push: () => undefined, replace: () => undefined, navigate: () => undefined, back: () => undefined, canGoBack: () => true },
  useLocalSearchParams: () => (globalThis as unknown as Globais).__params,
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: () => Promise.resolve() }));

const DE_COMPRA = ["casa-forte", "gracas", "madalena"] as const;
const DE_ALUGUEL = ["boa-viagem", "espinheiro"] as const;

const dossie = (id: string): Dossie => {
  const d = dossies.get(id);
  if (!d) throw new Error(`Dossiê sem dados: ${id}`);
  return d;
};

/**
 * Desenha a tela com os provedores do app, espera o armazenamento (simulado) responder, junta tudo o que aparece (texto e
 * nomes acessíveis, para nada escapar por um `accessibilityLabel`) e desmonta.
 */
async function tudoQueAparece(d: Dossie, elemento: React.ReactElement): Promise<string> {
  let arvore!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    arvore = TestRenderer.create(
      React.createElement(
        TemaDoApp,
        null,
        React.createElement(
          PreferenciasDoMock,
          null,
          React.createElement(
            DadosNoAparelho,
            null,
            React.createElement(SessaoDoApp, null, React.createElement(ContextoDoDossie.Provider, { value: d }, elemento)),
          ),
        ),
      ),
    );
  });
  const saida: string[] = [];
  const andar = (n: TestRenderer.ReactTestRendererJSON | string) => {
    if (typeof n === "string") {
      saida.push(n);
      return;
    }
    for (const chave of ["accessibilityLabel", "aria-label"] as const) {
      const rotulo = n.props[chave];
      if (typeof rotulo === "string") saida.push(rotulo);
    }
    for (const filho of n.children ?? []) andar(filho);
  };
  const raiz = arvore.toJSON();
  for (const n of Array.isArray(raiz) ? raiz : raiz ? [raiz] : []) andar(n);
  await act(async () => {
    arvore.unmount();
  });
  return saida.join(" | ");
}

describe("exemplos: a régua do ITBI por m² saiu (L3)", () => {
  it("a frase é a pedida, palavra por palavra", () => {
    expect(FRASE_DA_REGUA_DO_ITBI_RETIRADA).toBe(
      "A comparação por m² com o ITBI foi retirada: a área do ITBI inclui área comum e não se compara com a área do anúncio.",
    );
  });

  it("os cinco exemplos existem, e só os três de compra têm régua feita do ITBI", () => {
    expect([...IDS_DOSSIES].sort()).toEqual([...DE_COMPRA, ...DE_ALUGUEL].sort());
    for (const id of DE_COMPRA) {
      const r = dossie(id).preco.regua;
      // Os dados de docs/mock seguem como estavam: é a tela que deixa de usar a régua.
      expect([id, r.rotulo, r.fonte.base, r.unidade]).toEqual([id, "registro_oficial", "ITBI 2015-2026", "R$/m²"]);
      expect([id, reguaEDoItbi(r)]).toEqual([id, true]);
    }
    for (const id of DE_ALUGUEL) expect([id, reguaEDoItbi(dossie(id).preco.regua)]).toEqual([id, false]);
  });

  it.each(DE_COMPRA.map((id) => [id]))("%s: no lugar da régua, só a frase; nada de ITBI, quartis, 'registro oficial' nem R$/m² fiscal", async (id) => {
    const d = dossie(id);
    const regua = d.preco.regua;
    const t = await tudoQueAparece(d, React.createElement(CartaoDoAnuncio, { dossie: d }));
    expect(t).toContain(FRASE_DA_REGUA_DO_ITBI_RETIRADA);
    // A frase é a única menção ao ITBI no cartão.
    expect(t.replace(FRASE_DA_REGUA_DO_ITBI_RETIRADA, "")).not.toMatch(/ITBI|avalia[cç][õo]es fiscais|quartis/i);
    expect(t).not.toContain(regua.frase);
    expect(t).not.toContain(regua.escala);
    expect(t).not.toContain(regua.fonte.base);
    // A régua oficial do ITBI era a única do cartão com esse rótulo; o resto do anúncio é declarado.
    expect(t).not.toMatch(/registro oficial/i);
    // Os controles de recorte e de período eram da régua.
    expect(t).not.toContain("Recorte");
    expect(t).not.toContain("12 meses");
  });

  it.each(DE_ALUGUEL.map((id) => [id]))("%s: a régua de aluguel anunciado continua, com a frase dela e sem a do ITBI", async (id) => {
    const d = dossie(id);
    const t = await tudoQueAparece(d, React.createElement(CartaoDoAnuncio, { dossie: d }));
    expect(t).toContain(d.preco.regua.frase);
    expect(t).toContain("Recorte");
    expect(t).not.toContain(FRASE_DA_REGUA_DO_ITBI_RETIRADA);
  });

  it.each(DE_COMPRA.map((id) => [id]))("%s: o endereço direto da régua (Ver fonte, Isso está errado) também só mostra a frase", async (id) => {
    const d = dossie(id);
    G.__params = { id, fato: "regua" };
    for (const Tela of [VerFonte, IssoEstaErrado]) {
      const t = await tudoQueAparece(d, React.createElement(Tela));
      expect(t).toContain(FRASE_DA_REGUA_DO_ITBI_RETIRADA);
      expect(t).not.toMatch(/ITBI 2015|registro oficial|quartis|Período|Licença|Abrir a base/i);
    }
  });
});
