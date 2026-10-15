import type { Dossie, EstadoDoFato, Fato } from "../dados/esquema";
import { estadoDoFato } from "../dados/estadoDoFato";
import { chaveDoFato, useAparelho } from "./Aparelho";
import { usePreferencias } from "./Preferencias";

export function useEstadoDoFato(dossie: Dossie, fato: Fato): EstadoDoFato {
  const { forcado } = usePreferencias();
  const { dados } = useAparelho();
  return estadoDoFato(fato, forcado, chaveDoFato(dossie.id, fato.id) in dados.contestacoes);
}

export function useCarregando(): boolean {
  return usePreferencias().forcado === "carregando";
}

export function useLoteConfirmado(dossie: Dossie): boolean {
  const { dados } = useAparelho();
  return dados.lotesConfirmados[dossie.id] ?? dossie.lote.confirmado;
}

export function useMostrarFinal(): boolean {
  return usePreferencias().final;
}
