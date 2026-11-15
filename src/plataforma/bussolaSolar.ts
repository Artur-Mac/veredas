import * as Location from "expo-location";
import type { FonteDeRumo } from "../dados/sol/captura";
export const temBussolaSolar = true;
export function fonteDaBussolaSolar(): FonteDeRumo {
  return {
    preparar: async () => {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status !== "granted") throw new Error("Permissão não concedida");
      // Geolocalização é opcional para a direção; a coordenada cadastral tem prioridade no chamador.
      try {
        const pos = await Location.getLastKnownPositionAsync({ maxAge: 300000, requiredAccuracy: 100 });
        if (pos) return { longitude: pos.coords.longitude, latitude: pos.coords.latitude,
          precisaoM: pos.coords.accuracy, origem: "gps_da_visita" as const };
      } catch { /* a bússola pode funcionar sem posição GPS atual */ }
      return null;
    },
    observar: async (receber, falhar) => {
      const sub = await Location.watchHeadingAsync(p => receber(p.trueHeading, p.accuracy), falhar);
      return () => sub.remove();
    },
  };
}
