// Web (D036): registra o service worker (public/sw.js), que guarda a casca do app (HTML, bundle, fontes) para ela abrir
// sem rede, e tira do Cache Storage as camadas de versões que o app já não usa. Só no build de produção: no
// desenvolvimento, um bundle guardado esconderia a edição recém-feita.
import { CAMADAS_PUBLICADAS } from "../dados/camadasGeradas";
import { limparCamadasAntigas } from "./camadas";

export function iniciarModoOffline(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window === "undefined" || !window.isSecureContext || !("serviceWorker" in navigator)) return;
  void (async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
      const registro = await navigator.serviceWorker.ready;
      // O que esta página já baixou antes de o service worker assumir (a primeira visita): a casca a guardar.
      const urls = [`${location.origin}/`, ...performance.getEntriesByType("resource").map((e) => e.name)];
      registro.active?.postMessage({ tipo: "guardar-casca", urls });
    } catch {
      // Sem service worker o app funciona igual; só não reabre sem rede.
    }
    try {
      await limparCamadasAntigas(Object.values(CAMADAS_PUBLICADAS).map((d) => d.url));
    } catch {
      // Limpeza é oportunista.
    }
  })();
}
