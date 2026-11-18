// Só na web (o Metro escolhe este arquivo por plataforma): o fundo do mapa como marcação SVG crua num único <g>, em vez de
// dezenas de componentes do react-native-svg (cada rótulo eram dois <Text> com <TextPath> e um <Path> no <Defs>).
// O desenho é o mesmo: fundoDoMapaMarcacao escreve os atributos que o react-native-svg escreveria. O nativo usa
// MarcacaoDoFundo.tsx (nulo) e continua desenhando com o react-native-svg.
import { createElement, memo, useMemo } from "react";
import type { CenaDoFundo } from "./fundoDoMapaCena";
import type { EstiloDoFundo } from "./fundoDoMapaEstilo";
import { marcacaoDoFundo, type PartesDaMarcacao } from "./fundoDoMapaMarcacao";

export type MarcacaoDoFundoProps = { cena: CenaDoFundo; estilo: EstiloDoFundo; partes: PartesDaMarcacao; prefixo: string; marca: Record<string, string> };

function Marcacao({ cena, estilo, partes, prefixo, marca }: MarcacaoDoFundoProps) {
  const html = useMemo(() => marcacaoDoFundo(cena, estilo, partes, prefixo), [cena, estilo, partes, prefixo]);
  return createElement("g", { ...marca, dangerouslySetInnerHTML: { __html: html } });
}

export const MarcacaoDoFundo: ((p: MarcacaoDoFundoProps) => ReturnType<typeof Marcacao>) | null = memo(Marcacao) as unknown as (p: MarcacaoDoFundoProps) => ReturnType<typeof Marcacao>;
