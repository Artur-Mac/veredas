import { useEffect, useMemo, useState } from "react";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { eCoberto } from "../../dados/recife/bairros";
import { edificioPorId } from "../../dados/recife/indice";

type Alvo = { id: string; bairro: string | null; edificioId: string };

/**
 * Edifícios do índice cadastral das análises com prédio confirmado, por id da análise. A leitura roda depois da
 * primeira pintura (o primeiro acesso a um bairro valida o arquivo inteiro) e devolve `null` enquanto não terminou.
 * Edifício que não está no índice atual, ou índice que falha ao carregar, vira `null` no mapa: nada é inventado.
 */
export function useEdificios(analises: readonly AnaliseV2[]): Map<string, Edificio | null> | null {
  const chave = useMemo(() => {
    const alvos: Alvo[] = [];
    for (const a of analises) {
      if (a.vinculo.estado === "confirmado") alvos.push({ id: a.id, bairro: a.bairro, edificioId: a.vinculo.edificioId });
    }
    return JSON.stringify(alvos);
  }, [analises]);
  const [lido, definirLido] = useState<{ chave: string; mapa: Map<string, Edificio | null> } | null>(null);

  useEffect(() => {
    const agendado = setTimeout(() => {
      const mapa = new Map<string, Edificio | null>();
      for (const alvo of JSON.parse(chave) as Alvo[]) {
        try {
          mapa.set(alvo.id, eCoberto(alvo.bairro) ? edificioPorId(alvo.edificioId, alvo.bairro) : null);
        } catch {
          mapa.set(alvo.id, null);
        }
      }
      definirLido({ chave, mapa });
    }, 0);
    return () => clearTimeout(agendado);
  }, [chave]);

  return lido?.chave === chave ? lido.mapa : null;
}
