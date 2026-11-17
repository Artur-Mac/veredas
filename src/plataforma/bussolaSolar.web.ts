import type { FonteDeRumo } from "../dados/sol/captura";
// Não expõe alpha relativo como norte. A entrada manual funciona em qualquer navegador.
export const temBussolaSolar = false;
export function fonteDaBussolaSolar(): FonteDeRumo {
  return { preparar: async () => null, observar: async () => { throw new Error("Use a direção manual no navegador"); } };
}
