// Foto remota do anúncio (15/11/2026). O CDN do ZAP recusa (403) pedido com Referer de outro site; sem Referer, responde.
// No nativo a imagem já vai sem Referer; na web, o navegador mandaria o do Vereda, então a foto é um <img> com
// referrerPolicy="no-referrer". Nada é guardado: a foto é carregada da origem a cada exibição.
import React from "react";
import { Image, Platform, type ImageStyle, type StyleProp } from "react-native";

type Props = { uri: string; rotulo: string; estilo: StyleProp<ImageStyle> & { width?: number | string; height?: number | string } };

export function FotoRemota({ uri, rotulo, estilo }: Props) {
  if (Platform.OS === "web") {
    const s = (Array.isArray(estilo) ? Object.assign({}, ...estilo) : estilo ?? {}) as Record<string, unknown>;
    return React.createElement("img", {
      src: uri, alt: rotulo, referrerPolicy: "no-referrer", loading: "lazy", draggable: false,
      style: { objectFit: "cover", display: "block", flexShrink: 0, ...s },
    });
  }
  return <Image source={{ uri }} accessibilityLabel={rotulo} resizeMode="cover" style={estilo} referrerPolicy="no-referrer" />;
}
