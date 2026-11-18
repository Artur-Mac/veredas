// No nativo não há marcação SVG crua: o FundoDoMapa desenha com os componentes do react-native-svg. A web usa
// MarcacaoDoFundo.web.tsx (o Metro escolhe por plataforma).
import type { ReactElement } from "react";
import type { CenaDoFundo } from "./fundoDoMapaCena";
import type { EstiloDoFundo } from "./fundoDoMapaEstilo";
import type { PartesDaMarcacao } from "./fundoDoMapaMarcacao";

export type MarcacaoDoFundoProps = { cena: CenaDoFundo; estilo: EstiloDoFundo; partes: PartesDaMarcacao; prefixo: string; marca: Record<string, string> };

export const MarcacaoDoFundo: ((p: MarcacaoDoFundoProps) => ReactElement | null) | null = null;
