/**
 * Política de arquivamento de conjuntos obsoletos e preservação integral das árvores tombadas.
 * - Exclui chamados CTTU 2015/2016 (`5767160f`, `a6a6d09e`) e camadas pré-PD2021 do PublicationManifest.
 * - Retira atributos volumétricos do censo arbóreo de 2007 (~96% vazios; sombra na rota rejeitada em 74/80 testes).
 * - Preserva estritamente as árvores tombadas (restrição legal de abate) como registro oficial.
 */

export type EstadoCicloDeVidaFonte = "ativo" | "substituido" | "arquivado_fora_do_manifesto";

export type RegistroQuarentenaLegada = {
  sourceSlug: string;
  resourceIds: readonly string[];
  estado: EstadoCicloDeVidaFonte;
  motivo: string;
  substituidoPor: string | null;
};

export const REGISTRO_FONTES_ARQUIVADAS: readonly RegistroQuarentenaLegada[] = [
  {
    sourceSlug: "cttu_chamados_2015_2016",
    resourceIds: [
      "5767160f-f27a-43f1-9fe0-40ebd4742e3f",
      "a6a6d09e-fc5c-4fec-adcb-bf9286d1748f",
    ],
    estado: "arquivado_fora_do_manifesto",
    motivo: "Defasagem superior a 10 anos; circulação viária e interseções não refletem a rede atual.",
    substituidoPor: "cttu_sinistros_2022_2024",
  },
  {
    sourceSlug: "zoneamento_pre_pd2021",
    resourceIds: ["zoneamento_legado_pre_pd2021"],
    estado: "arquivado_fora_do_manifesto",
    motivo: "Parâmetros revogados pelo Plano Diretor (LC 2/2021) e LPUOS (Lei 19.426/2025).",
    substituidoPor: "esig_lpuos_2025_rest",
  },
  {
    sourceSlug: "censo_arboreo_2007_copa_altura",
    resourceIds: ["4ac43805-0f44-43b0-bdf1-c25d89b5fa5d"],
    estado: "substituido",
    motivo: "Defasagem >18 anos e ~96% sem altura/copa preenchidas; sombra na rota falhou em 74/80 testes.",
    substituidoPor: "pe3d_lidar_dossel_ndsm",
  },
  {
    sourceSlug: "apac_cache_utc_sem_conversao",
    resourceIds: ["cache_apac_bruto_utc"],
    estado: "substituido",
    motivo: "Desvio sistemático de +3h e leituras negativas (-1) tratadas sem quarentena.",
    substituidoPor: "apac_cemaden_brt_sanitizado",
  },
];

const IDS_ARQUIVADOS = new Set(REGISTRO_FONTES_ARQUIVADAS.flatMap((r) => r.resourceIds));

export function deveExcluirDoManifesto(identificador: string): boolean {
  return IDS_ARQUIVADOS.has(identificador);
}

export type ArvoreTombadaOficial = {
  objectId: number;
  cdNum: number | null;
  nomePopular: string;
  nomeCientifico: string | null;
  familia: string | null;
  enderecoReferencia: string | null;
  coordenada: [number, number];
  restricaoLegalAbate: true;
  epistemicTag: "registro_oficial";
};

/**
 * Extrai estritamente as árvores tombadas (patrimônio legal protegido contra corte), descartando atributos
 * volumétricos de copa/altura defasados do censo arbóreo de 2007.
 */
export function extrairArvoresTombadasOficiais(geojson: {
  features?: {
    geometry?: { coordinates?: [number, number] } | null;
    properties?: Record<string, unknown>;
  }[];
}): ArvoreTombadaOficial[] {
  const saida: ArvoreTombadaOficial[] = [];
  for (const f of geojson.features ?? []) {
    const coords = f.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const [lon, lat] = coords;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

    const p = f.properties ?? {};
    saida.push({
      objectId: typeof p.objectid === "number" ? p.objectid : saida.length + 1,
      cdNum: typeof p.cdnum === "number" ? p.cdnum : null,
      nomePopular: String(p.nmpopul ?? "Árvore tombada").trim(),
      nomeCientifico: typeof p.cdnmcient === "string" ? p.cdnmcient.trim() : null,
      familia: typeof p.cdfam === "string" ? p.cdfam.trim() : null,
      enderecoReferencia: typeof p.nmender === "string" ? p.nmender.trim() : null,
      coordenada: [Number(lon.toFixed(6)), Number(lat.toFixed(6))],
      restricaoLegalAbate: true,
      epistemicTag: "registro_oficial",
    });
  }
  return saida;
}

/**
 * Remove atributos de copa/altura do cadastro arbóreo antigo em qualquer registro genérico de árvore,
 * preservando somente os registros legalmente tombados.
 */
export function filtrarCadastroArboreoLegado<T extends { tombada?: boolean; restricaoLegalAbate?: boolean; alturaCopaM?: unknown; diametroCopaM?: unknown }>(
  itens: readonly T[],
): (Omit<T, "alturaCopaM" | "diametroCopaM"> & { restricaoLegalAbate: true })[] {
  return itens
    .filter((i) => i.tombada === true || i.restricaoLegalAbate === true)
    .map(({ alturaCopaM: _a, diametroCopaM: _d, ...resto }) => ({
      ...resto,
      restricaoLegalAbate: true as const,
    }));
}
