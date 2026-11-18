/**
 * Desduplicação de recursos cicloviários do Recife (GeoJSONs triplicados de paraciclos e fusão com CSV).
 */

export const PARACICLOS_RECURSO_CANONICO = "836b8e24-67d8-49fc-a62c-85602b501e80";
export const PARACICLOS_RECURSOS_TRIPLICADOS_ESPELHO = [
  "a290b35f-0f2f-440a-a437-ad478a9076ff",
  "8778757a-1daa-49aa-a553-2cce1be03569",
] as const;

export type RecursoGeoParaciclo = {
  resourceId: string;
  sha256: string;
  features: {
    geometry?: { type?: string; coordinates?: [number, number] } | null;
    properties?: Record<string, unknown>;
  }[];
};

export type ParacicloUnico = {
  chaveCanonica: string;
  referencia: string;
  nome: string | null;
  coordenada: [number, number];
  fontesRecursos: string[];
};

export type ResultadoDedupeParaciclos = {
  unicos: ParacicloUnico[];
  recursosLidos: number;
  recursosDescartadosPorShaIdentico: string[];
  feicoesBrutas: number;
  feicoesDuplicadasRemovidas: number;
};

function normalizarNome(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function deduplicarParaciclosGeojson(recursos: readonly RecursoGeoParaciclo[]): ResultadoDedupeParaciclos {
  const shasVistos = new Set<string>();
  const descartadosSha: string[] = [];
  const porChave = new Map<string, ParacicloUnico>();

  let feicoesBrutas = 0;
  let feicoesDuplicadasRemovidas = 0;

  for (const rec of recursos) {
    if (shasVistos.has(rec.sha256)) {
      descartadosSha.push(rec.resourceId);
      continue;
    }
    shasVistos.add(rec.sha256);

    for (const f of rec.features) {
      feicoesBrutas += 1;
      const coords = f.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;
      const [lon, lat] = coords;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

      const props = f.properties ?? {};
      const ref = String(props.Name ?? props.referencia ?? props.id ?? "").trim();
      const nomeBruto = String(props.Description ?? props.nome ?? "").trim();
      // Balde de ~2,2 m em WGS84 (0.00002 deg ≈ 2.2 m) + referência normalizada
      const bx = Math.round(lon * 50_000);
      const by = Math.round(lat * 50_000);
      const chave = `${normalizarNome(ref)}|${bx}:${by}`;

      const existente = porChave.get(chave);
      if (existente) {
        feicoesDuplicadasRemovidas += 1;
        if (!existente.fontesRecursos.includes(rec.resourceId)) {
          existente.fontesRecursos.push(rec.resourceId);
        }
        continue;
      }

      porChave.set(chave, {
        chaveCanonica: chave,
        referencia: ref || `pc_${bx}_${by}`,
        nome: nomeBruto || null,
        coordenada: [Number(lon.toFixed(6)), Number(lat.toFixed(6))],
        fontesRecursos: [rec.resourceId],
      });
    }
  }

  return {
    unicos: [...porChave.values()],
    recursosLidos: recursos.length - descartadosSha.length,
    recursosDescartadosPorShaIdentico: descartadosSha,
    feicoesBrutas,
    feicoesDuplicadasRemovidas,
  };
}
