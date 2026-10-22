// Modelo local de protocolo. Não autentica pessoas, cria conta, envia dados ou substitui backend/ACL.
// Operação remota continua desligada até implementação e revisão de autorização no servidor.
import { z } from "zod";
import { esquemaAnaliseV2 } from "./contratos";

const id = z.string().regex(/^[a-z0-9-]{1,80}$/);
export const esquemaOperacao = z.strictObject({
  id, donoId: id, analiseId: id, revisaoBase: z.number().int().min(0),
  tipo: z.enum(["salvar", "excluir", "restaurar"]), conteudo: esquemaAnaliseV2.nullable(),
}).refine(o => o.tipo === "excluir" ? o.conteudo === null : o.conteudo?.id === o.analiseId,
  "Conteúdo incompatível com a operação");
type Operacao = z.infer<typeof esquemaOperacao>;
type Registro = { donoId: string; revisao: number; conteudo: z.infer<typeof esquemaAnaliseV2> | null; excluido: boolean };
export type EstadoDoModelo = { registros: Record<string, Registro>; aplicadas: Record<string, { assinatura: string; revisao: number }> };
export type ResultadoDoModelo =
  | { estado: "nao_autorizado" }
  | { estado: "conflito"; remoto: Registro | null; local: Operacao }
  | { estado: "confirmado"; revisao: number; repetida: boolean };

/** Muta apenas o modelo em memória após validar toda a operação; testes de protocolo, não transporte real. */
export function aplicarNoModelo(estado: EstadoDoModelo, entrada: unknown, usuarioAutenticado: string): ResultadoDoModelo {
  const o = esquemaOperacao.parse(entrada);
  if (o.donoId !== usuarioAutenticado) return { estado: "nao_autorizado" };
  const atual = Object.prototype.hasOwnProperty.call(estado.registros, o.analiseId) ? estado.registros[o.analiseId] : undefined;
  if (atual && atual.donoId !== usuarioAutenticado) return { estado: "nao_autorizado" };
  const chave = `${usuarioAutenticado}/${o.id}`;
  const assinatura = JSON.stringify(o);
  const aplicada = estado.aplicadas[chave];
  if (aplicada) {
    if (aplicada.assinatura !== assinatura) return { estado: "conflito", remoto: atual ?? null, local: o };
    return { estado: "confirmado", revisao: aplicada.revisao, repetida: true };
  }
  if ((atual?.revisao ?? 0) !== o.revisaoBase || (atual?.excluido && o.tipo === "salvar") || (o.tipo === "restaurar" && !atual?.excluido))
    return { estado: "conflito", remoto: atual ?? null, local: o };
  const revisao = (atual?.revisao ?? 0) + 1;
  // Tombstone fica no modelo; um cliente antigo não pode ressuscitar o item por último horário.
  estado.registros[o.analiseId] = { donoId: usuarioAutenticado, revisao, conteudo: o.conteudo, excluido: o.tipo === "excluir" };
  estado.aplicadas[chave] = { assinatura, revisao };
  return { estado: "confirmado", revisao, repetida: false };
}
