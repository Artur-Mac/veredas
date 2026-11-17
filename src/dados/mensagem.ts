// Mensagem para o corretor (Fatia 5). Pura: a pessoa revisa o texto, copia ou abre no WhatsApp sem
// destinatário e escolhe o contato; o Vereda não envia nada.
import type { AnaliseV2, Pergunta } from "./contratos";

export const MAX_PERGUNTAS_NA_MENSAGEM = 6;
const ID_DO_ENDERECO = "lacuna-endereco";
const FECHO = "Obrigado!\n\nMensagem preparada com o VEREDA.";

/**
 * Entram até 6 perguntas ainda não verificadas (`visita.verificadas`), com `textoParaMensagem`, na ordem
 * recebida, mas com a de endereço sempre em primeiro. Sem pergunta pendente, o pedido é só a visita.
 * A assinatura faz parte da sugestão editável; copiar e compartilhar respeitam o texto revisado.
 */
export function mensagemParaCorretor(a: AnaliseV2, perguntas: Pergunta[]): string {
  const verificadas = new Set(a.visita.verificadas);
  const pendentes = perguntas.filter((p) => !verificadas.has(p.id) && p.textoParaMensagem.trim() !== "");
  const escolhidas = [
    ...pendentes.filter((p) => p.id === ID_DO_ENDERECO),
    ...pendentes.filter((p) => p.id !== ID_DO_ENDERECO),
  ].slice(0, MAX_PERGUNTAS_NA_MENSAGEM);

  const url = a.url.trim();
  const abertura = `Olá! Vi o anúncio ${a.nome}${url ? ` (${url})` : ""}.`;
  if (escolhidas.length === 0) return `${abertura}\nGostaria de marcar uma visita.\n${FECHO}`;
  const lista = escolhidas.map((p, i) => `${i + 1}. ${p.textoParaMensagem.trim()}`);
  return [abertura, "Antes de visitar, pode me confirmar:", ...lista, FECHO].join("\n");
}
