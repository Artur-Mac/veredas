import type { TextStyle } from "react-native";

export const CORES_CLARO = {
  "cor-fundo": "#F2EBDD",
  "cor-papel-claro": "#FAF6EE",
  "cor-superficie": "#FFFFFF",
  "cor-creme": "#FAF7F0",
  "cor-sutil": "#E7DEC9",
  "cor-linha": "#E2D9C8",
  "cor-linha-forte": "#C9BEA8",
  "cor-traco": "#7C8488",
  "cor-nota": "#FAF7F0",
  "cor-texto": "#171717",
  "cor-texto-apoio": "#625C51",
  "cor-acao": "#F47745",
  "cor-acao-hover": "#E06332",
  "cor-sobre-acao": "#171717",
  "cor-barro": "#B94E36",
  "cor-barro-suave": "#F9EBE8",
  /** Ferrugem para texto pequeno: #B94E36 dá 4,21 sobre o papel; esta dá 4,98 (WCAG AA). */
  "cor-barro-texto": "#A8452F",
  "cor-sobre-barro": "#FFFFFF",
  "cor-salvia": "#7F8870",
  "cor-salvia-escura": "#3A5230",
  "cor-salvia-suave": "#EBF2E8",
  "cor-azul-cadastral": "#2E5A85",
  "cor-azul-cadastral-suave": "#EBF1F8",
  "cor-campo": "#141413",
  "cor-texto-campo": "#FAF7F0",
  "cor-faixa-regua": "#D1B1A5",
  "cat-ipe-roxo": "#6B4DB0",
  "cat-goiaba": "#B4436C",
  "cat-ipe-amarelo": "#A87512",
  "cat-mare": "#1F7F7A",
  "cat-terra": "#8A7A60",
  "cat-outros": "#B9C0BC",
  "crime-1": "#2E3538",
  "crime-2": "#7C8488",
  "crime-3": "#C3C8C5",
  "mapa-terra": "#ECEAE4",
  "mapa-via": "#FFFFFF",
  "mapa-mar": "#D3E3E8",
  "mapa-praia": "#F1E8D6",
  "mapa-praca": "#DDE6DA",
} as const;

export type TokenDeCor = keyof typeof CORES_CLARO;
export type Cores = Record<TokenDeCor, string>;

export const CORES_ESCURO: Cores = {
  "cor-fundo": "#141413",
  "cor-papel-claro": "#1F2427",
  "cor-superficie": "#1F2427",
  "cor-creme": "#2A2622",
  "cor-sutil": "#2C3338",
  "cor-linha": "#2C3338",
  "cor-linha-forte": "#4A5357",
  "cor-traco": "#8E969A",
  "cor-nota": "#2A2622",
  "cor-texto": "#FAF7F0",
  "cor-texto-apoio": "#8E969A",
  "cor-acao": "#F47745",
  "cor-acao-hover": "#E06332",
  "cor-sobre-acao": "#171717",
  "cor-barro": "#D9805A",
  "cor-barro-suave": "#3A2A25",
  "cor-barro-texto": "#D9805A",
  "cor-sobre-barro": "#141413",
  "cor-salvia": "#A4B398",
  "cor-salvia-escura": "#7F8870",
  "cor-salvia-suave": "#1E2A26",
  "cor-azul-cadastral": "#7FA6CE",
  "cor-azul-cadastral-suave": "#1A2836",
  "cor-campo": "#141413",
  "cor-texto-campo": "#FAF7F0",
  "cor-faixa-regua": "#574036",
  "cat-ipe-roxo": "#A88BE0",
  "cat-goiaba": "#E58BA8",
  "cat-ipe-amarelo": "#E8B54A",
  "cat-mare": "#4FB3AE",
  "cat-terra": "#CDBFA8",
  "cat-outros": "#5C656A",
  "crime-1": "#E4E7E5",
  "crime-2": "#8E969A",
  "crime-3": "#4A5357",
  "mapa-terra": "#1D2327",
  "mapa-via": "#2E363B",
  "mapa-mar": "#15252D",
  "mapa-praia": "#2A2A25",
  "mapa-praca": "#1E2A26",
};

export const FONTES = {
  Fraunces: require("../../assets/fonts/Fraunces.ttf"),
  PlusJakartaSans: require("../../assets/fonts/PlusJakartaSans.ttf"),
  JetBrainsMono: require("../../assets/fonts/JetBrainsMono.ttf"),
} as const;

type NomeDeFonte = keyof typeof FONTES;

function tipo(fontFamily: NomeDeFonte, fontSize: number, lineHeight: number): TextStyle {
  return { fontFamily, fontSize, lineHeight, fontVariant: ["tabular-nums"] };
}

export const TIPOS = {
  numero: tipo("JetBrainsMono", 28, 38),
  "titulo-tela": tipo("Fraunces", 28, 36),
  barra: tipo("PlusJakartaSans", 16, 20),
  botao: tipo("PlusJakartaSans", 15, 20),
  secao: tipo("PlusJakartaSans", 14, 20),
  corpo: tipo("PlusJakartaSans", 14, 20),
  apoio: tipo("PlusJakartaSans", 12, 16),
  etiqueta: tipo("PlusJakartaSans", 12, 16),
} as const;

export type Tipo = keyof typeof TIPOS;

export const ESPACO = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24 } as const;

export const RAIO = { quadrado: 8, icone: 10, cartao: 16, pilula: 999 } as const;

export const LINHA = { divisor: 0.5, traco: 2, lote: 1.5, raio: 1.25 } as const;

export const REGUA = { trilho: 6, marcador: 14 } as const;

export const ICONE = { p: 16, m: 20, g: 24 } as const;

export const TOQUE_MINIMO = 48;

export const MOVIMENTO = { seta: 150, secao: 200 } as const;

export function comAlfa(hex: string, alfa: number): string {
  const canal = Math.round(alfa * 255).toString(16).padStart(2, "0");
  return `${hex}${canal}`;
}
