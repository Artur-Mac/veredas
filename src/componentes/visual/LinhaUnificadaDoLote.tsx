import React from "react";
import { StyleSheet, View } from "react-native";
import type {
  EventoLinhaUnificada,
  ResultadoLinhaUnificadaDoLote,
} from "../../dados/dossie/linhaUnificadaDoLote";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, type TokenDeCor } from "../../tema/tokens";

function pontoCategoria(cat: EventoLinhaUnificada["categoria"]): TokenDeCor {
  if (cat === "predio") return "cor-azul-cadastral";
  if (cat === "itbi") return "cor-salvia";
  if (cat === "obra") return "cor-acao";
  return "cor-barro";
}

export function LinhaUnificadaDoLote({
  linha,
}: {
  linha: ResultadoLinhaUnificadaDoLote;
}) {
  const { cor } = useTema();

  return (
    <View
      testID="linha-unificada-do-lote"
      style={[
        styles.cartao,
        {
          backgroundColor: cor("cor-superficie"),
          borderColor: cor("cor-linha-forte"),
        },
      ]}
    >
      <View style={styles.cabecalho}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
          Histórico do prédio, registro e rua
        </Texto>
        <Texto tipo="secao" style={styles.manchete}>
          {linha.manchete}
        </Texto>
      </View>

      {linha.eventos.map((ev, idx) => (
        <View
          key={`${ev.categoria}-${ev.etiquetaData}-${idx}`}
          style={[styles.linhaEvento, { borderTopColor: cor("cor-linha") }]}
        >
          <View style={styles.colData}>
            <View
              style={[
                styles.ponto,
                { backgroundColor: cor(pontoCategoria(ev.categoria)) },
              ]}
            />
            <Texto tipo="numero" cor="cor-texto-apoio" style={styles.textoData}>
              {ev.etiquetaData}
            </Texto>
          </View>
          <View style={styles.colTexto}>
            <Texto tipo="etiqueta" style={styles.tituloEvento}>
              {ev.titulo}
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.detalheEvento}>
              {ev.detalhe}
            </Texto>
          </View>
        </View>
      ))}

      {/* R45: Bloco objetivo "O que fazer com isso" */}
      <View style={[styles.blocoAcoes, { borderTopColor: cor("cor-linha") }]}>
        <Texto tipo="etiqueta" cor="cor-salvia-escura" style={styles.tituloAcoes}>
          O que fazer com isso
        </Texto>
        {linha.acoesConcretas.map((acao, idx) => (
          <Texto
            key={idx}
            tipo="apoio"
            cor="cor-texto"
            style={styles.textoAcao}
          >
            {`• ${acao}`}
          </Texto>
        ))}
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
  cabecalho: {
    padding: 16,
    paddingBottom: 12,
    gap: 3,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  manchete: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  linhaEvento: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  colData: {
    width: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 2,
  },
  ponto: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  textoData: {
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  colTexto: {
    flex: 1,
    gap: 2,
  },
  tituloEvento: {
    fontSize: 13,
    fontWeight: "700",
  },
  detalheEvento: {
    fontSize: 12,
    lineHeight: 16.5,
  },
  blocoAcoes: {
    borderTopWidth: 1,
    padding: 16,
    gap: 5,
  },
  tituloAcoes: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  textoAcao: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
