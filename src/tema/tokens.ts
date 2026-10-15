import type { TextStyle } from "react-native";

export const CORES_CLARO = {
  "cor-fundo": "#F3F4F2",
  "cor-superficie": "#FFFFFF",
  "cor-texto": "#22292D",
  "cor-texto-apoio": "#636B6F",
  "cor-linha": "#E2E5E2",
  "cor-traco": "#7C8488",
  "cor-nota": "#F6EEE8",
  "cor-barro": "#8C3D1D",
  "cor-sobre-barro": "#FFFFFF",
  "cor-faixa-regua": "#D1B1A5",
  "cor-azul-cadastral": "#2E5A85",
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
  "cor-fundo": "#14181B",
  "cor-superficie": "#1F2427",
  "cor-texto": "#E4E7E5",
  "cor-texto-apoio": "#8E969A",
  "cor-linha": "#2C3338",
  "cor-traco": "#8E969A",
  "cor-nota": "#2A2622",
  "cor-barro": "#D9805A",
  "cor-sobre-barro": "#14181B",
  "cor-faixa-regua": "#574036",
  "cor-azul-cadastral": "#7FA6CE",
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
  "ArchivoCondensed-ExtraBold": require("../../docs/mock/fontes/ArchivoCondensed-ExtraBold.ttf"),
  "Archivo-Bold": require("../../docs/mock/fontes/Archivo-Bold.ttf"),
  "Archivo-SemiBold": require("../../docs/mock/fontes/Archivo-SemiBold.ttf"),
  "Archivo-Medium": require("../../docs/mock/fontes/Archivo-Medium.ttf"),
  "Archivo-Regular": require("../../docs/mock/fontes/Archivo-Regular.ttf"),
} as const;

type NomeDeFonte = keyof typeof FONTES;

function tipo(fontFamily: NomeDeFonte, fontSize: number, lineHeight: number): TextStyle {
  return { fontFamily, fontSize, lineHeight, fontVariant: ["tabular-nums"] };
}

export const TIPOS = {
  numero: tipo("ArchivoCondensed-ExtraBold", 28, 32),
  "titulo-tela": tipo("ArchivoCondensed-ExtraBold", 24, 28),
  barra: tipo("Archivo-Bold", 16, 20),
  botao: tipo("Archivo-Bold", 15, 20),
  secao: tipo("Archivo-SemiBold", 14, 20),
  corpo: tipo("Archivo-Regular", 14, 20),
  apoio: tipo("Archivo-Regular", 12, 16),
  etiqueta: tipo("Archivo-Medium", 12, 16),
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
