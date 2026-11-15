// Estado da licença de obra no retrato do Licenciamento Urbanístico (15/11/2026). Puro, testado em
// scripts/dados/testes/licenca.test.mjs.
import { dobrar } from "./rua/nucleo.mjs";

/**
 * Estado da licença no retrato da base (P05: não prova que a obra começou, parou ou terminou). null quando a leitura
 * não trouxe as colunas de licença (cache antigo do CKAN).
 * - "valida" / "vencida": emissão e validade publicadas; validade comparada com a data da geração;
 * - "emitida": emissão publicada sem validade; "deferida": processo deferido sem data de licença publicada;
 * - "em_analise": solicitada, em tramitação ou em exigência.
 */
export function estadoDaLicenca(r, hoje) {
  if (!("data_emissao_licenca" in r)) return null;
  const emissao = String(r.data_emissao_licenca ?? "").slice(0, 10);
  const validade = String(r.data_validade_licenca ?? "").slice(0, 10);
  const temData = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  const s = dobrar(r.situacao_processo);
  const impacto = dobrar(r.empreendimento_de_impacto) === "sim" ? true : dobrar(r.empreendimento_de_impacto) === "nao" ? false : null;
  let estado;
  if (temData(emissao) && temData(validade)) estado = validade >= hoje ? "valida" : "vencida";
  else if (temData(emissao)) estado = "emitida";
  else if (/solicitad|tramit|exigenc|analise/.test(s)) estado = "em_analise";
  else if (s.includes("deferid")) estado = "deferida";
  else estado = "outra";
  return { estado, emitidaEm: temData(emissao) ? emissao : null, validaAte: temData(validade) ? validade : null, impacto };
}

