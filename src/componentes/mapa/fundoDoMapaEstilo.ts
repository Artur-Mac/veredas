// Cores e espessuras do fundo do mapa, por camada, a partir dos tokens do tema (claro ou escuro). Puro: o componente
// FundoDoMapa e as provas visuais leem esta mesma tabela.
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

export function estiloDoFundo(c: Cores, escuro = false) {
  return {
    /** Fora de qualquer bairro carregado: "sem dado", hachura sobre o papel. */
    semDado: c["cor-papel-claro"],
    hachura: c["cor-linha"],
    /** Rua: o espaço entre as quadras, dentro dos bairros com dado. */
    chao: c["cor-superficie"],
    tinta: c["cor-acao"],
    tintaOpacidade: 0.07,
    quadra: c["cor-sutil"],
    /**
     * Lote: o papel no claro. No escuro o papel (cor-fundo) é o tom mais fundo da paleta e os lotes viravam buracos
     * pretos dentro das quadras (prova de 18/11/2026); cor-creme mantém o lote um passo distinto da quadra.
     */
    lote: escuro ? c["cor-creme"] : c["cor-fundo"],
    loteLinha: c["cor-linha-forte"],
    predio: c["cor-azul-cadastral-suave"],
    predioLinha: c["cor-azul-cadastral"],
    predioLinhaOpacidade: 0.45,
    praca: c["cor-salvia-suave"],
    pracaLinha: c["cor-salvia"],
    /**
     * Água: o azul claro do modelo (~#D3DEE8) não tem token. `mapa-mar` (#D3E3E8 no claro, #15252D no escuro) é o mais
     * perto que existe; o contorno é o azul cadastral a 30%. Pedido de token próprio no relatório.
     */
    agua: c["mapa-mar"],
    aguaLinha: comAlfa(c["cor-azul-cadastral"], 0.3),
    via: c["cor-superficie"],
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
    halo: c["cor-superficie"],
    bairro: c["cor-texto-apoio"],
    bairroDoImovel: c["cor-barro"],
  };
}
