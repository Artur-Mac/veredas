import { CORES_CLARO, CORES_ESCURO } from "../tema/tokens";

/**
 * Estilo Vetorial Editorial do Mapa Offline (MapLibre GL Native Spec + PMTiles).
 * Toda cor provém exclusivamente da paleta canónica (`CORES_CLARO` / `CORES_ESCURO`) sem neon ou gradientes.
 */

export function criarEstiloEditorialMapLibre(
  escuro = false,
  caminhoPmtiles = "pmtiles://recife_2026_11.pmtiles",
): Record<string, unknown> {
  const c = escuro ? CORES_ESCURO : CORES_CLARO;
  return {
    version: 8,
    name: `Vereda Editorial (${escuro ? "escuro" : "claro"})`,
    sources: {
      vereda_offline: {
        type: "vector",
        url: caminhoPmtiles,
      },
    },
    layers: [
      {
        id: "fundo-papel",
        type: "background",
        paint: {
          "background-color": c["cor-fundo"],
        },
      },
      {
        id: "agua-hidrografia",
        type: "fill",
        source: "vereda_offline",
        "source-layer": "alagamento",
        paint: {
          "fill-color": c["cor-azul-cadastral"],
          "fill-opacity": 0.22,
        },
      },
      {
        id: "zonas-aeroporto",
        type: "line",
        source: "vereda_offline",
        "source-layer": "ruido_aeroporto",
        paint: {
          "line-color": c["cor-barro"],
          "line-width": 1.25,
          "line-dasharray": [4, 2],
        },
      },
      {
        id: "edificios-lote",
        type: "circle",
        source: "vereda_offline",
        "source-layer": "edificios",
        paint: {
          "circle-radius": 4,
          "circle-color": c["cor-acao"],
          "circle-stroke-width": 1,
          "circle-stroke-color": c["cor-texto"],
        },
      },
      {
        id: "preservacao-iep",
        type: "circle",
        source: "vereda_offline",
        "source-layer": "iep",
        paint: {
          "circle-radius": 5,
          "circle-color": c["cor-salvia-escura"],
        },
      },
    ],
    metadata: {
      fonteCorpo: "PlusJakartaSans",
      fonteNumero: "JetBrainsMono",
      offlineFirst: true,
    },
  };
}
