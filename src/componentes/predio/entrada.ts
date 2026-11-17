// O que a busca de prédio usa de uma análise (tela "Prédio" e cartão do anúncio). Puro.
import type { AnaliseV2 } from "../../dados/contratos";
import { textoDoCampo } from "../../dados/extrator/nomeEFotos";
import type { SlugCoberto } from "../../dados/recife/bairros";
import type { EntradaDeBusca } from "../../dados/recife/buscar";
import { avisoDeTipologia } from "./textos";

/**
 * Área "a confirmar" (a leitura trouxe anomalia) não serve de pista: ela sozinha dá 30 a 40 pontos a qualquer prédio com
 * tipologia parecida e sugeriria um prédio (a confirmação custa 1 crédito) sem nenhum outro sinal do anúncio.
 * Rua e número com marcador de ausência ("$undefined" de leituras antigas) não contam.
 */
export function entradaDeBusca(analise: AnaliseV2, bairro: SlugCoberto): EntradaDeBusca {
  // Loja, sala ou casa: a área casaria com apartamentos parecidos, que não são o imóvel. Rua, número e nome valem.
  const area = avisoDeTipologia(analise.tipologia) ? { valor: null, aConfirmar: true } : analise.declarados.area;
  return {
    bairro,
    logradouro: textoDoCampo(analise.logradouro),
    numero: textoDoCampo(analise.numero),
    nomeEdificio: textoDoCampo(analise.nomeEdificio),
    area: area.aConfirmar ? null : area.valor,
    andar: analise.declarados.andar.valor,
    anoConstrucao: analise.extracao?.campos.anoConstrucao ?? null,
  };
}
