import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import type { AnaliseV2 } from "../../dados/contratos";
import {
  gerarLinkPrivadoSemServidor,
  gerarTextoResumoExecutivo,
  type EntradaResumoExecutivo,
} from "../../dados/dossie/resumoExecutivo2Paginas";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";

export function ExportarResumoExecutivo({
  entrada,
  analisePrincipal = null,
  outrasAnalises = [],
}: {
  entrada: EntradaResumoExecutivo;
  analisePrincipal?: AnaliseV2 | null;
  outrasAnalises?: readonly AnaliseV2[];
}) {
  const { cor } = useTema();
  const [copiado, setCopiado] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [linkGerado, setLinkGerado] = useState<string | null>(null);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const timerTextoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerLinkRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerTextoRef.current) clearTimeout(timerTextoRef.current);
      if (timerLinkRef.current) clearTimeout(timerLinkRef.current);
    },
    [],
  );

  const resumo = gerarTextoResumoExecutivo(entrada);

  const copiar = () => {
    void Clipboard.setStringAsync(resumo)
      .then(() => {
        setCopiado(true);
        if (timerTextoRef.current) clearTimeout(timerTextoRef.current);
        timerTextoRef.current = setTimeout(() => setCopiado(false), 3000);
      })
      .catch(() => {
        setCopiado(false);
      });
  };

  const gerarECopiarLink = () => {
    const origemWeb =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.origin
        : undefined;
    const url = gerarLinkPrivadoSemServidor({
      entrada,
      analisePrincipal,
      outrasAnalises,
      origemWeb,
    });
    setLinkGerado(url);
    void Clipboard.setStringAsync(url)
      .then(() => {
        setLinkCopiado(true);
        if (timerLinkRef.current) clearTimeout(timerLinkRef.current);
        timerLinkRef.current = setTimeout(() => setLinkCopiado(false), 3000);
      })
      .catch(() => {
        setLinkCopiado(false);
      });
  };

  return (
    <View
      testID="exportar-resumo-executivo"
      style={[
        styles.cartao,
        {
          backgroundColor: cor("cor-superficie"),
          borderColor: cor("cor-linha-forte"),
        },
      ]}
    >
      <View style={styles.topo}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
          Resumo para guardar ou enviar
        </Texto>
        <Texto tipo="secao" style={styles.titulo}>
          Dossiê executivo em 6 blocos (preço, caixa, sol, sossego, vista e obras)
        </Texto>
      </View>

      <View style={[styles.rodape, { borderTopColor: cor("cor-linha") }]}>
        <Pressable
          testID="botao-exportar-resumo-executivo"
          accessibilityRole="button"
          onPress={copiar}
          style={({ pressed }) => [
            styles.botaoPrincipal,
            {
              backgroundColor: copiado
                ? cor("cor-salvia-suave")
                : cor("cor-papel-claro"),
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Texto
            tipo="etiqueta"
            cor={copiado ? "cor-salvia-escura" : "cor-texto"}
            style={styles.textoBotao}
          >
            {copiado
              ? "Dossiê executivo copiado!"
              : "Copiar dossiê executivo completo"}
          </Texto>
        </Pressable>

        <Pressable
          testID="botao-gerar-link-privado"
          accessibilityRole="button"
          onPress={gerarECopiarLink}
          style={({ pressed }) => [
            styles.botaoPrincipal,
            {
              backgroundColor: linkCopiado
                ? cor("cor-salvia-suave")
                : cor("cor-papel-claro"),
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Texto
            tipo="etiqueta"
            cor={linkCopiado ? "cor-salvia-escura" : "cor-azul-cadastral"}
            style={styles.textoBotao}
          >
            {linkCopiado
              ? "Link privado copiado! Nada enviado a servidor"
              : "Copiar link privado sem servidor (#s= / #v=)"}
          </Texto>
        </Pressable>

        {linkGerado ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" numberOfLines={2} style={styles.linkPreview}>
            {linkGerado}
          </Texto>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: mostrarPrevia }}
          onPress={() => setMostrarPrevia((v) => !v)}
          style={styles.botaoPrevia}
        >
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoPrevia}>
            {mostrarPrevia ? "Ocultar prévia do texto" : "Ler prévia do dossiê antes de copiar"}
          </Texto>
        </Pressable>

        {mostrarPrevia ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.previaTexto}>
            {resumo}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    overflow: "hidden",
  },
  topo: {
    padding: 16,
    paddingBottom: 12,
    gap: 3,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  titulo: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  rodape: {
    borderTopWidth: 1,
    padding: 14,
    gap: 6,
  },
  botaoPrincipal: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotao: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  linkPreview: {
    fontSize: 11,
    lineHeight: 15,
    fontVariant: ["tabular-nums"],
  },
  botaoPrevia: {
    minHeight: TOQUE_MINIMO,
    alignItems: "center",
    justifyContent: "center",
  },
  textoPrevia: {
    fontSize: 12,
    fontWeight: "600",
  },
  previaTexto: {
    fontSize: 11.5,
    lineHeight: 16.5,
    fontVariant: ["tabular-nums"],
  },
});
