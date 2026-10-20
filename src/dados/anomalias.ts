// Títulos das anomalias (arquiteto). Faixa do Explorar, revisão e dossiê usam esta função, para que o mesmo
// problema tenha o mesmo nome em todas as telas. Tom neutro: descreve o anúncio, não acusa quem anunciou.
import type { Anomalia, ChaveDeCampo } from "./contratos";

const ROTULO: Partial<Record<ChaveDeCampo, string>> = {
  preco: "Preço", condominio: "Condomínio", iptu: "IPTU", seguroIncendio: "Seguro incêndio",
  taxaServico: "Taxa de serviço", totalInformado: "Total", area: "Área", quartos: "Quartos",
  suites: "Suítes", banheiros: "Banheiros", vagas: "Vagas", andar: "Andar", bairro: "Bairro",
  logradouro: "Rua", numero: "Número", nomeEdificio: "Nome do edifício", modalidade: "Tipo de negócio",
};

export function rotuloDoCampo(campo: ChaveDeCampo): string {
  return ROTULO[campo] ?? campo;
}

/** "IPTU sem periodicidade", "Condomínio abaixo do comum", "IPTU com valor simbólico"… */
export function tituloDaAnomalia(a: Pick<Anomalia, "campo" | "tipo">): string {
  const campo = rotuloDoCampo(a.campo);
  switch (a.tipo) {
    case "periodo_desconhecido": return `${campo} sem periodicidade`;
    case "nao_informado": return `${campo} não informado`;
    case "valor_simbolico": return `${campo} com valor simbólico`;
    case "valor_atipico": return `${campo} abaixo do comum`;
    case "valor_repetido":
      if (a.campo === "condominio") return "Condomínio igual ao IPTU";
      if (a.campo === "iptu") return "IPTU igual ao condomínio";
      return `${campo} repetido`;
    case "incoerente": return `${campo} difere entre as leituras`;
  }
}
