import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  gerarTextoResumoExecutivo,
  type EntradaResumoExecutivo,
} from "../../dados/dossie/resumoExecutivo2Paginas";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";

export function ExportarResumoExecutivo({
  entrada,
}: {
  entrada: EntradaResumoExecutivo;
}) {
  const { cor } = useTema();
  const [copiado, setCopiado] = useState(false);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);

  const resumo = gerarTextoResumoExecutivo(entrada);

  const copiar = () => {
    void Clipboard.setStringAsync(resumo)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
      })
      .catch(() => {
        setCopiado(false);
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
  botaoPrevia: {
    minHeight: 38,
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
