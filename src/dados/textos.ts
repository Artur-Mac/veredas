import type { Rotulo } from "./esquema";

export const ROTULOS: Record<Rotulo, string> = {
  registro_oficial: "registro oficial",
  declarado: "declarado pelo anunciante",
  inferencia: "inferência ou sinal exploratório",
  nao_sabemos: "não sabemos",
};

export const TEXTO_ILUSTRATIVO = "dado ilustrativo, pendente de fonte";
export const TEXTO_ROTAS = "abre no app de mapas que você escolher; o Vereda não calcula tempo";
export const TEXTO_RECEBIDO = "Recebido. O fato continua visível enquanto conferimos.";
export const AVISO_LEITURA = "Só lemos campos do imóvel. Nada sobre quem anuncia.";
export const BAIRROS_COBERTOS_TEXTO = "Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena.";
