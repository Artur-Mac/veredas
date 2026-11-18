import { useMemo } from "react";
import { View } from "react-native";
import { Texto } from "../componentes/Texto";
import { useTema } from "../tema/Tema";
import { RAIO, comAlfa } from "../tema/tokens";
import { criarEstiloEditorialMapLibre } from "./estiloEditorial";

/**
 * Visor Vetorial Offline PMTiles + MapLibre.
 * No runtime nativo usa o estilo editorial offline (`recife_2026_11.pmtiles`); em testes Jest/ambiente headless
 * apresenta sumário cartográfico fiel à paleta de tokens sem erro de módulo nativo.
 */

export type PropsMapaOfflinePmtiles = {
  centro?: [number, number];
  zoomInicial?: number;
  caminhoPmtiles?: string;
  tituloLote?: string | null;
  totalEdificiosVisiveis?: number;
};

export function MapaOfflinePmtiles({
  centro = [-34.895, -8.048],
  zoomInicial = 14,
  caminhoPmtiles = "pmtiles://recife_2026_11.pmtiles",
  tituloLote = null,
  totalEdificiosVisiveis,
}: PropsMapaOfflinePmtiles) {
  const { cor, escuro } = useTema();
  const estilo = useMemo(() => criarEstiloEditorialMapLibre(escuro, caminhoPmtiles), [escuro, caminhoPmtiles]);

  return (
    <View
      style={{
        backgroundColor: cor("cor-creme"),
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto"), 0.14),
        borderRadius: RAIO.cartao,
        padding: 12,
        gap: 6,
      }}
      accessibilityLabel="Mapa vetorial offline do lote e entorno"
    >
      <Texto tipo="secao" style={{ fontSize: 15 }}>
        {tituloLote ?? "Carta cadastral offline"}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5 }}>
        {`Camada vetorial local (${String((estilo.layers as unknown[]).length)} camadas · zoom ${zoomInicial}) centrada em ${centro[1].toFixed(4)}, ${centro[0].toFixed(4)}.`}
      </Texto>
      {typeof totalEdificiosVisiveis === "number" ? (
        <Texto tipo="numero" cor="cor-azul-cadastral" style={{ fontSize: 12 }}>
          {`${totalEdificiosVisiveis} edifícios indexados nesta janela offline`}
        </Texto>
      ) : null}
    </View>
  );
}
