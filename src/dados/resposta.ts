// Resposta à pergunta decisiva (VE15.03 / VE11.04): quando a pergunta que pode mudar a escolha é um valor que falta
// (condomínio, IPTU, seguro, taxa, outros, área, preço), a pessoa informa o valor confirmado ali mesmo e a comparação é
// refeita. O valor entra como "informado por você" (sem "a confirmar"); o histórico do anúncio registra a edição como
// qualquer outra (registrarAlteracaoDoAnuncio). Nada é inferido: sem valor, nada muda.
import type { AnaliseV2 } from "./contratos";
import type { CampoDaPergunta, ProjecaoDaDecisao } from "./decisao";

export type CampoRespondivel = Exclude<CampoDaPergunta, "iptu_periodo"> | "iptu_periodo";
export const CAMPOS_RESPONDIVEIS: readonly CampoRespondivel[] = ["preco", "condominio", "iptu", "iptu_periodo", "seguro", "taxa", "outros", "area"];
const CHAVE: Record<Exclude<CampoRespondivel, "iptu_periodo">, keyof AnaliseV2["declarados"]> = {
  preco: "preco", condominio: "condominio", iptu: "iptu", seguro: "seguroIncendio", taxa: "taxaServico", outros: "outros", area: "area",
};

/** Rótulo curto do campo para o formulário. */
export const ROTULO_DO_CAMPO: Record<CampoRespondivel, string> = {
  preco: "Preço confirmado (R$)", condominio: "Condomínio confirmado (R$ por mês)", iptu: "IPTU confirmado (R$)", iptu_periodo: "IPTU confirmado (R$)",
  seguro: "Seguro incêndio confirmado (R$ por mês)", taxa: "Taxa de serviço confirmada (R$ por mês)", outros: "Outros custos confirmados (R$ por mês)", area: "Área confirmada (m²)",
};

/**
 * Aplica o valor confirmado ao campo. Taxas aceitam zero (condomínio zero existe); área e preço precisam ser > 0. IPTU
 * exige o período (mês ou ano). Devolve null quando o valor não serve, sem mudar nada.
 */
export function aplicarResposta(a: AnaliseV2, campo: CampoRespondivel, valor: number, periodo: "mes" | "ano" | null, em: string): AnaliseV2 | null {
  if (!Number.isFinite(valor) || valor < 0) return null;
  if ((campo === "area" || campo === "preco") && valor <= 0) return null;
  if ((campo === "iptu" || campo === "iptu_periodo") && !periodo) return null;
  const chave = campo === "iptu_periodo" ? "iptu" : CHAVE[campo];
  const novo = { valor, origem: "voce" as const, aConfirmar: false, ...(chave === "iptu" ? { periodo } : {}) };
  return { ...a, atualizadaEm: em, declarados: { ...a.declarados, [chave]: novo } as AnaliseV2["declarados"] };
}

/** O que a resposta mudou na escolha, em uma frase. */
export function efeitoDaResposta(antes: ProjecaoDaDecisao, depois: ProjecaoDaDecisao): string {
  if (antes.estado !== "pronta" || depois.estado !== "pronta") return "Valor guardado. A comparação foi refeita.";
  const a = antes.visitarPrimeiro, d = depois.visitarPrimeiro;
  if (a === d) return d === null ? `Valor guardado. A comparação foi refeita: ${depois.manchete}` : `Valor guardado. A ordem não mudou: ${depois.rotulos[d]} continua na frente.`;
  if (d === null) return `Valor guardado. Com esse valor, os dois ficam próximos: ${depois.manchete}`;
  return `Valor guardado. Com esse valor, a ordem mudou: visite primeiro ${depois.rotulos[d]}.`;
}
