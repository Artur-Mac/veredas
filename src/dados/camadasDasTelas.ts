// Quais arquivos de camada (src/dados/camadas.ts) cada tela lê, para ela esperar por eles antes de desenhar (D036).
// Bairro fora da cobertura de uma camada simplesmente não entra na lista: a seção daquela camada não aparece, como antes.
import { arquivoDaChuva } from "./recife/chuva";
import { arquivoDosEssenciais } from "./recife/essenciais";
import { arquivoDoIndice } from "./recife/indice";
import { arquivoDaNoite } from "./recife/noite";
import { arquivoDaProcura } from "./recife/procura";
import { arquivosDoTransito } from "./recife/transito";
import { arquivoSolar } from "./sol/entorno";

const definidos = (xs: readonly (string | null)[]): string[] => [...new Set(xs.filter((x): x is string => !!x))];

/** O que o dossiê de uma análise lê ao abrir: índice do bairro, dia a dia a pé, noite e chuva. */
export function camadasDoBairro(bairro: string | null | undefined): string[] {
  return definidos([arquivoDoIndice(bairro), arquivoDosEssenciais(bairro), arquivoDaNoite(bairro), arquivoDaChuva(bairro)]);
}

/** Telas que leem várias análises (Visita, Comparar, detalhes, Sol): as camadas do dossiê de cada bairro do caderno. */
export function camadasDasAnalises(analises: readonly { bairro: string | null }[]): string[] {
  return definidos(analises.flatMap((a) => camadasDoBairro(a.bairro)));
}

/** A aba Rotina do Comparar: a grade programada, o acesso a pé dos bairros do par e "Onde mais procurar". */
export function camadasDaRotina(bairros: readonly (string | null | undefined)[]): string[] {
  return definidos([...arquivosDoTransito(bairros), arquivoDaProcura()]);
}

/** O recorte solar do bairro (aba Edifício e tela do Sol). */
export function camadasDoSol(bairro: string | null | undefined): string[] {
  return definidos([arquivoSolar(bairro)]);
}

/** O que outras abas vão pedir depois que o dossiê abriu: guardado em segundo plano para reabrir sem rede. */
export function camadasParaDepois(bairro: string | null | undefined): string[] {
  return definidos([...camadasDoSol(bairro), ...(arquivosDoTransito([bairro]).length > 1 ? camadasDaRotina([bairro]) : [])]);
}
