// Passos da tela de preparo do dossiê (15/11/2026): só o que o bairro de fato tem. Puro.
import { arquivoDaChuva } from "./recife/chuva";
import { arquivoDosEssenciais } from "./recife/essenciais";
import { arquivoDaNoite } from "./recife/noite";

export function passosDoPreparo(camadas: readonly string[], bairro: string | null): string[] {
  const tem = (arq: string | null) => arq !== null && camadas.includes(arq);
  return [
    "Conferindo o prédio no cadastro da Prefeitura",
    "Cruzando IPTU, transmissões e obras perto",
    ...(tem(arquivoDosEssenciais(bairro)) ? ["Medindo o caminho a pé até mercado, farmácia e ônibus"] : []),
    ...(tem(arquivoDaNoite(bairro)) ? ["Vendo a volta para casa à noite"] : []),
    ...(tem(arquivoDaChuva(bairro)) ? ["Procurando registros de alagamento na rua"] : []),
    "Montando o dossiê",
  ];
}
