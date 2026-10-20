// Decisão pura do leitor de página (Fatia 2B, C2): o componente só despacha eventos e reage ao estado.
// Nenhum temporizador, ref ou callback mora aqui.
import type { LeituraParcial } from "../../dados/contratos";

export type MotivoDaFalha = "tempo" | "verificacao" | "erro";

export type EstadoDoLeitor =
  | { fase: "carregando" }
  | { fase: "verificando" }
  | { fase: "lido" }
  | { fase: "falhou"; motivo: MotivoDaFalha };

export type EventoDoLeitor =
  /** Uma coleta validada da página, já passada por `lerPagina`. */
  | { tipo: "mensagem"; leituras: LeituraParcial[]; verificacao: boolean }
  | { tipo: "prazo_20s" }
  | { tipo: "prazo_120s" }
  | { tipo: "erro" };

export const ESTADO_INICIAL_DO_LEITOR: EstadoDoLeitor = { fase: "carregando" };

/** A mensagem serve quando trouxe preço ou área: sem isso não há o que revisar. */
export function rendeDados(leituras: LeituraParcial[]): boolean {
  return leituras.some((l) => l.campos.preco !== null || l.campos.area !== null);
}

/**
 * Regras:
 * - mensagem que rende preço ou área → `lido`, mesmo com `verificacao` (a palavra "verifique" aparece em anúncios);
 *   vale também depois de uma falha, porque a página continua à vista da pessoa;
 * - mensagem com `verificacao` e sem dados → `verificando`, a partir de `carregando` e também de `falhou` por tempo:
 *   o desafio pode aparecer depois dos 20 s, e a página continua à vista da pessoa. Falha por verificação ou por erro não volta;
 * - `prazo_20s` só derruba `carregando`; `prazo_120s` só derruba `verificando`;
 * - `erro` derruba `carregando` e `verificando`;
 * - `lido` não muda mais. Sem mudança, devolve o próprio `estado` (mesma referência).
 */
export function proximoEstado(estado: EstadoDoLeitor, evento: EventoDoLeitor): EstadoDoLeitor {
  if (estado.fase === "lido") return estado;
  switch (evento.tipo) {
    case "mensagem":
      if (rendeDados(evento.leituras)) return { fase: "lido" };
      if (evento.verificacao && (estado.fase === "carregando" || (estado.fase === "falhou" && estado.motivo === "tempo"))) {
        return { fase: "verificando" };
      }
      return estado;
    case "prazo_20s":
      return estado.fase === "carregando" ? { fase: "falhou", motivo: "tempo" } : estado;
    case "prazo_120s":
      return estado.fase === "verificando" ? { fase: "falhou", motivo: "verificacao" } : estado;
    case "erro":
      return estado.fase === "carregando" || estado.fase === "verificando" ? { fase: "falhou", motivo: "erro" } : estado;
  }
}
