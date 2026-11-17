// Linha do tempo documental da estrutura de um prédio (15/11/2026). Só organiza atos com documento: nunca diagnostica,
// nunca deduz o estado atual. Etapas separadas: chamado, vistoria, laudo com ART/RRT, interdição, reparo, liberação.
// Desabamento só aparece com documento que confirme o evento E a correspondência com o prédio (lote e bloco).
// Sem confirmação do estado atual, diz a data do último ato e a checagem que falta.
export type EtapaEstrutural = "chamado" | "vistoria" | "laudo_art_rrt" | "interdicao" | "reparo" | "liberacao" | "desabamento";
export const ORDEM_DAS_ETAPAS: readonly EtapaEstrutural[] = ["chamado", "vistoria", "laudo_art_rrt", "interdicao", "reparo", "liberacao"];
export const ROTULO_DA_ETAPA: Record<EtapaEstrutural, string> = {
  chamado: "Chamado", vistoria: "Vistoria", laudo_art_rrt: "Laudo com ART/RRT", interdicao: "Interdição", reparo: "Reparo", liberacao: "Liberação", desabamento: "Desabamento",
};

export type AtoDocumentado = {
  etapa: EtapaEstrutural;
  /** Data do ato (AAAA-MM-DD); null quando o documento não traz. */
  data: string | null;
  /** Documento que comprova: ex. "Diário Oficial do Recife, ed. 046, 10/04/2025, p. 3" ou "laudo fornecido pelo condomínio". */
  documento: string;
  /** Número de processo, ofício, ART ou RRT, quando houver. */
  numero: string | null;
  orgao: string | null;
  /** Até onde o documento identifica o prédio. "bairro_ou_rua" não basta para afirmar nada sobre este prédio. */
  vinculo: "lote_e_bloco" | "lote" | "endereco" | "bairro_ou_rua";
};

export type LeituraEstrutural = {
  /** Atos que valem para este prédio (vínculo por lote ou endereço), em ordem de data. */
  atos: AtoDocumentado[];
  etapasComprovadas: EtapaEstrutural[];
  etapasSemDocumento: EtapaEstrutural[];
  ultimoAto: AtoDocumentado | null;
  /** Só true com documento de desabamento ligado ao lote e ao bloco. */
  mostrarDesabamento: boolean;
  /** Frase do estado: nunca afirma a condição atual. */
  frase: string;
  checagemQueFalta: string;
  perguntaAoSindico: string;
  /** Atos descartados por vínculo insuficiente (contados, nunca atribuídos). */
  descartados: number;
};

const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const VINCULO_SUFICIENTE = new Set<AtoDocumentado["vinculo"]>(["lote_e_bloco", "lote", "endereco"]);

export function lerLinhaDoTempo(entrada: readonly AtoDocumentado[]): LeituraEstrutural {
  const atos = entrada.filter((a) => VINCULO_SUFICIENTE.has(a.vinculo))
    .sort((a, b) => (a.data ?? "9999").localeCompare(b.data ?? "9999") || ORDEM_DAS_ETAPAS.indexOf(a.etapa) - ORDEM_DAS_ETAPAS.indexOf(b.etapa));
  const descartados = entrada.length - atos.length;
  const etapasComprovadas = ORDEM_DAS_ETAPAS.filter((e) => atos.some((a) => a.etapa === e));
  const etapasSemDocumento = ORDEM_DAS_ETAPAS.filter((e) => !etapasComprovadas.includes(e));
  const datados = atos.filter((a) => a.data);
  const ultimoAto = datados.at(-1) ?? null;
  const mostrarDesabamento = atos.some((a) => a.etapa === "desabamento" && a.vinculo === "lote_e_bloco");
  const interditado = etapasComprovadas.includes("interdicao");
  const liberado = atos.some((a) => a.etapa === "liberacao" && (!interditado || (a.data ?? "") >= (atos.filter((x) => x.etapa === "interdicao").map((x) => x.data ?? "").sort().at(-1) ?? "")));
  let frase: string;
  if (!atos.length) frase = "Nenhum ato documentado sobre a estrutura deste prédio.";
  else if (!ultimoAto) frase = `${atos.length === 1 ? "Há um ato documentado" : `Há ${atos.length} atos documentados`}, sem data no documento.`;
  else frase = `Último ato documentado: ${ROTULO_DA_ETAPA[ultimoAto.etapa].toLowerCase()} em ${dataBr(ultimoAto.data!)}${ultimoAto.numero ? ` (${ultimoAto.numero})` : ""}. Isso não confirma a condição atual do prédio.`;
  let checagemQueFalta: string;
  if (interditado && !liberado) checagemQueFalta = "Falta o documento de liberação posterior à interdição (ou a confirmação de que ela continua).";
  else if (interditado && liberado) checagemQueFalta = "Falta um laudo recente com ART/RRT que confirme a condição atual depois da liberação.";
  else if (etapasComprovadas.includes("vistoria") && !etapasComprovadas.includes("laudo_art_rrt")) checagemQueFalta = "Falta o laudo com ART/RRT da vistoria e o que ele recomendou.";
  else if (!atos.length) checagemQueFalta = "Falta saber se houve vistoria, laudo, interdição ou obra estrutural no prédio.";
  else checagemQueFalta = "Falta um laudo recente com ART/RRT que confirme a condição atual.";
  const numeros = atos.map((a) => a.numero).filter(Boolean);
  const perguntaAoSindico = [
    atos.length ? `Encontramos ${numeros.length ? `o${numeros.length > 1 ? "s" : ""} registro${numeros.length > 1 ? "s" : ""} ${numeros.join(", ")}` : "registros"} sobre a estrutura do prédio${ultimoAto ? `, o último de ${dataBr(ultimoAto.data!)}` : ""}.` : null,
    "Houve vistoria da Defesa Civil ou do Controle Urbano? Há laudo de engenharia com ART ou RRT? Pode enviar a cópia?",
    interditado ? (liberado ? "A liberação depois da interdição está documentada? Que reparo foi feito?" : "A interdição foi suspensa? Há documento de liberação e do reparo feito?") : "Houve interdição, reparo estrutural ou liberação? Em que datas?",
  ].filter(Boolean).join(" ");
  return { atos, etapasComprovadas, etapasSemDocumento, ultimoAto, mostrarDesabamento, frase, checagemQueFalta, perguntaAoSindico, descartados };
}
