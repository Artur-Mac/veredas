import type { Coordenada } from "./esquema";

export function distanciaMetros([lon1, lat1]: Coordenada, [lon2, lat2]: Coordenada): number {
  const r = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function metrosParaCoordenada([lon0, lat0]: Coordenada, x: number, y: number): Coordenada {
  const lat = lat0 - y / 110540;
  const lon = lon0 + x / (111320 * Math.cos((lat0 * Math.PI) / 180));
  return [lon, lat];
}

export function coordenadaParaMetros([lon0, lat0]: Coordenada, [lon, lat]: Coordenada): [number, number] {
  return [(lon - lon0) * 111320 * Math.cos((lat0 * Math.PI) / 180), (lat0 - lat) * 110540];
}

export type Plataforma = "ios" | "android" | "web";

export function linkDoMapa(plataforma: Plataforma, [lon, lat]: Coordenada, rotulo: string, origem?: Coordenada): string {
  if (plataforma === "ios") {
    const partida = origem ? `source=${origem[1]},${origem[0]}&` : "";
    return `https://maps.apple.com/directions?${partida}destination=${lat},${lon}&mode=`;
  }
  return `geo:0,0?q=${lat},${lon}(${encodeURIComponent(rotulo)})`;
}
