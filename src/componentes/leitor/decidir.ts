// Decisão pura do leitor de página (Fatia 2B, C2): o componente só despacha eventos e reage ao estado.
// Nenhum temporizador, ref ou callback mora aqui.
import type { LeituraParcial } from "../../dados/contratos";

export type MotivoDaFalha = "tempo" | "verificacao" | "erro" | "outra_pagina";

export type EstadoDoLeitor =
  | { fase: "carregando" }
  | { fase: "verificando" }
  | { fase: "lido" }
  | { fase: "falhou"; motivo: MotivoDaFalha };

export type EventoDoLeitor =
  /**
   * Uma coleta validada da página, já passada por `lerPagina`. `outraPagina`: a coleta não veio do anúncio pedido
   * (host diferente, caminho sem o id do anúncio, lista ou busca); nesse caso `leituras` só traz o que o estado do
   * anúncio (objeto com o id) rendeu.
   */
  | { tipo: "mensagem"; leituras: LeituraParcial[]; verificacao: boolean; outraPagina?: boolean }
  | { tipo: "prazo_20s" }
  | { tipo: "prazo_120s" }
  | { tipo: "erro" };

export const ESTADO_INICIAL_DO_LEITOR: EstadoDoLeitor = { fase: "carregando" };

/** A mensagem serve quando trouxe preço ou área: sem isso não há o que revisar. */
export function rendeDados(leituras: LeituraParcial[]): boolean {
  return leituras.some((l) => l.campos.preco !== null || l.campos.area !== null);
}

/** Falha que a pessoa ainda pode desfazer: a página continua à vista dela, e o anúncio ou o desafio podem chegar. */
function falhaRecuperavel(estado: EstadoDoLeitor): boolean {
  return estado.fase === "falhou" && (estado.motivo === "tempo" || estado.motivo === "outra_pagina");
}

/**
 * Regras:
 * - mensagem que rende preço ou área → `lido`, mesmo com `verificacao` (a palavra "verifique" aparece em anúncios);
 *   vale também depois de uma falha, porque a página continua à vista da pessoa;
 * - mensagem com `verificacao` e sem dados → `verificando`, a partir de `carregando` e também de `falhou` por tempo
 *   ou por outra página: o desafio pode aparecer depois dos 20 s, e a página continua à vista da pessoa. Falha por
 *   verificação ou por erro não volta;
 * - mensagem sem dados, sem verificação e fora do anúncio pedido (`outraPagina`) → `falhou` por `outra_pagina`, a partir
 *   de `carregando`, `verificando` e `falhou` por tempo. O que a página trouxe de JSON-LD e de texto já foi descartado
 *   em `lerPagina`; se a pessoa voltar ao anúncio e ele render dados, vira `lido`;
 * - `prazo_20s` só derruba `carregando`; `prazo_120s` só derruba `verificando`;
 * - `erro` derruba `carregando` e `verificando`;
 * - `lido` não muda mais. Sem mudança, devolve o próprio `estado` (mesma referência).
 */
export function proximoEstado(estado: EstadoDoLeitor, evento: EventoDoLeitor): EstadoDoLeitor {
  if (estado.fase === "lido") return estado;
  switch (evento.tipo) {
    case "mensagem":
      if (rendeDados(evento.leituras)) return { fase: "lido" };
      if (evento.verificacao) {
        return estado.fase === "carregando" || falhaRecuperavel(estado) ? { fase: "verificando" } : estado;
      }
      if (evento.outraPagina) {
        return estado.fase === "carregando" || estado.fase === "verificando" || (estado.fase === "falhou" && estado.motivo === "tempo")
          ? { fase: "falhou", motivo: "outra_pagina" }
          : estado;
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
