// Teclado das abas (web). Puro, exceto `focarElemento`, que só age no navegador. Serve ao dossiê e às etapas da visita.
import { Platform } from "react-native";

/** Tecla pressionada, na web (`key`) ou no evento nativo (`nativeEvent.key`). */
export type EventoDeTecla = { key?: string; nativeEvent?: { key?: string }; preventDefault?: () => void };

export function teclaDoEvento(evento: EventoDeTecla): string {
  return evento.key ?? evento.nativeEvent?.key ?? "";
}

/**
 * Teclado das abas (index.html `dossierTabKey` 5201 a 5210 e `journeyTabKeys`): seta direita e esquerda dão a volta, Home vai à
 * primeira, End à última. Devolve a aba de destino, ou `null` quando a tecla não é de navegação.
 */
export function abaPorTecla<T extends string>(ids: readonly T[], atual: T, tecla: string): T | null {
  const n = ids.length;
  const i = ids.indexOf(atual);
  if (n === 0 || i < 0) return null;
  switch (tecla) {
    case "ArrowRight":
      return ids[(i + 1) % n] ?? null;
    case "ArrowLeft":
      return ids[(i + n - 1) % n] ?? null;
    case "Home":
      return ids[0] ?? null;
    case "End":
      return ids[n - 1] ?? null;
    default:
      return null;
  }
}

/** Na web, leva o foco do teclado ao elemento de `id` (index.html: `document.getElementById('ds-tab-…').focus()`). */
export function focarElemento(id: string): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  document.getElementById(id)?.focus();
}
