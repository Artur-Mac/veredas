// Atalhos de navegação do Comparar e dos Salvos, com a mesma regra do Explorar: análise com prédio por
// confirmar em bairro coberto vai primeiro à confirmação; as demais abrem o dossiê com a análise ativa.
import { router } from "expo-router";
import { useCallback } from "react";
import type { AnaliseV2 } from "../../dados/contratos";
import { destinoDaAnalise } from "../../dados/formulario";
import { useAnalises } from "../../estado/Analises";

export function useAbrirAnalise(): (a: AnaliseV2) => Promise<void> {
  const { definirAtiva } = useAnalises();
  return useCallback(
    async (a: AnaliseV2) => {
      if (destinoDaAnalise(a) === "predio") {
        router.push({ pathname: "/predio", params: { id: a.id } });
        return;
      }
      await definirAtiva(a.id);
      router.push({ pathname: "/dossie", params: { id: a.id } });
    },
    [definirAtiva],
  );
}

/** Deixa a análise ativa e abre a aba Visita. */
export function usePrepararVisita(): (id: string) => Promise<void> {
  const { definirAtiva } = useAnalises();
  return useCallback(
    async (id: string) => {
      await definirAtiva(id);
      router.push("/visita");
    },
    [definirAtiva],
  );
}

/** Abre a edição dos valores da análise. */
export function editarAnalise(id: string): void {
  router.push({ pathname: "/editar", params: { id } });
}

/** Abre a confirmação do prédio da análise. */
export function confirmarPredio(id: string): void {
  router.push({ pathname: "/predio", params: { id } });
}
