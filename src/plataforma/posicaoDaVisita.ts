import * as Location from "expo-location";
import type { Caderno } from "../dados/caderno";

export async function obterPosicaoDaVisita(): Promise<NonNullable<Caderno["localizacaoDaVisita"]>> {
  const permissao = await Location.requestForegroundPermissionsAsync();
  if (permissao.status !== "granted") throw new Error("Localização não autorizada. Continue registrando suas observações manualmente.");
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { longitude: p.coords.longitude, latitude: p.coords.latitude,
    precisaoM: p.coords.accuracy !== null && p.coords.accuracy >= 0 ? p.coords.accuracy : null,
    em: new Date(p.timestamp).toISOString(), origem: "gps_da_visita" };
}
