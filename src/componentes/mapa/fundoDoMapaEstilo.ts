// Cores e espessuras do fundo do mapa, por camada, a partir dos tokens do tema (claro ou escuro). Puro: o componente
// FundoDoMapa e as provas visuais leem esta mesma tabela. As cores de chão, quadra, lote, água e via da cidade vêm dos
// tokens mapa-* (src/tema/tokens.ts): no claro são os valores da tabela da seção 4 do pedido; no escuro têm degraus próprios,
// porque lá cor-papel-claro = cor-superficie e cor-sutil = cor-linha.
import { comAlfa, type Cores } from "../../tema/tokens";

export type EstiloDoFundo = ReturnType<typeof estiloDoFundo>;

/** Espessuras na tela, em px; o componente divide pelo zoom. */
export const TRACO = {
  hachura: 1.4,
  lote: 0.6,
  predio: 0.8,
  praca: 0.6,
  agua: 0.6,
  via: 1.6,
  divisa: 1,
  divisaDoImovel: 1.6,
  loteDoImovel: 1.5,
  haloDaRua: 2.6,
  haloDoBairro: 3,
} as const;

export const TRACEJADO_DA_DIVISA = [5, 3] as const;

export const FONTES_DO_FUNDO = { rua: "PlusJakartaSans", bairro: "Fraunces", tecnico: "JetBrainsMono" } as const;

/** `escuro` fica na assinatura por compatibilidade: as diferenças do escuro estão nos próprios tokens. */
export function estiloDoFundo(c: Cores, _escuro = false) {
  return {
    /** Fora de qualquer bairro carregado: "sem dado", hachura sobre o papel. */
    semDado: c["mapa-sem-dado"],
    hachura: c["cor-linha"],
    /** Rua: o espaço entre as quadras, dentro dos bairros com dado. Também o chão das pontes. */
    chao: c["mapa-rua"],
    tinta: c["cor-acao"],
    tintaOpacidade: 0.07,
    quadra: c["mapa-quadra"],
    lote: c["mapa-lote"],
    loteLinha: c["mapa-lote-linha"],
    predio: c["cor-azul-cadastral-suave"],
    predioLinha: c["cor-azul-cadastral"],
    predioLinhaOpacidade: 0.45,
    praca: c["cor-salvia-suave"],
    pracaLinha: c["cor-salvia"],
    agua: c["mapa-agua"],
    aguaLinha: comAlfa(c["cor-azul-cadastral"], 0.3),
    /** Avenida em linha no nível de cidade: contrasta com o chão (teste de contraste nos dois temas). */
    via: c["mapa-via-cidade"],
    divisa: c["cor-texto-apoio"],
    divisaOpacidade: 0.8,
    divisaDoImovel: c["cor-barro"],
    divisaDoImovelOpacidade: 0.9,
    loteDoImovel: c["cor-azul-cadastral"],
    loteDoImovelOpacidade: 0.85,
    rua: c["cor-texto-apoio"],
    avenida: c["cor-texto"],
    ruaDoImovel: c["cor-azul-cadastral"],
    /** Halo dos rótulos: a cor do chão, que é o que fica atrás do texto na via. */
    halo: c["mapa-rua"],
    bairro: c["cor-texto-apoio"],
    bairroDoImovel: c["cor-barro"],
  };
}
