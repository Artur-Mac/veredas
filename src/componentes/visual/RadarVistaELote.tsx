import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type {
  NivelAlertaRadar,
  ResultadoRadarVistaELote,
} from "../../dados/entorno/radarVistaELote";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO, type TokenDeCor } from "../../tema/tokens";

function pontoCorRadar(estado: NivelAlertaRadar): TokenDeCor {
  if (estado === "atencao") return "cor-barro";
  if (estado === "moderado") return "cor-acao";
  if (estado === "ok") return "cor-salvia";
  return "cor-traco";
}

function corValorRadar(estado: NivelAlertaRadar): TokenDeCor {
  if (estado === "atencao") return "cor-barro-texto";
  if (estado === "ok") return "cor-salvia-escura";
  return "cor-texto";
}

export function RadarVistaELote({ radar }: { radar: ResultadoRadarVistaELote }) {
  const { cor } = useTema();
  const [mostrarMetodo, setMostrarMetodo] = useState(false);

  return (
    <View
      testID="radar-vista-e-lote"
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
          Horizonte da janela, privacidade e lote
        </Texto>
        <Texto tipo="secao" style={styles.manchete}>
          {radar.manchete}
        </Texto>
      </View>

      {radar.itens.map((item) => (
        <View
          key={item.id}
          style={[styles.linhaItem, { borderTopColor: cor("cor-linha") }]}
        >
          <View style={[styles.ponto, { backgroundColor: cor(pontoCorRadar(item.estado)) }]} />
          <View style={styles.corpoItem}>
            <View style={styles.topoItem}>
              <Texto tipo="etiqueta" style={styles.tituloItem}>
                {item.titulo}
              </Texto>
              <Texto
                tipo="apoio"
                cor={corValorRadar(item.estado)}
                style={styles.valorItem}
              >
                {item.valorCurto}
              </Texto>
            </View>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.detalheItem}>
              {item.detalhe}
            </Texto>
          </View>
        </View>
      ))}

      {radar.acoesPraticas.length > 0 ? (
        <View
          testID="radar-acoes-praticas"
          style={[styles.faixaAcoes, { borderTopColor: cor("cor-linha") }]}
        >
          <Texto tipo="etiqueta" style={styles.tituloAcoes}>
            O que conferir antes de avançar
          </Texto>
          {radar.acoesPraticas.map((acao, idx) => (
            <Texto
              key={`acao-${idx}`}
              tipo="apoio"
              cor="cor-texto-apoio"
              style={styles.detalheItem}
            >
              {`• ${acao}`}
            </Texto>
          ))}
        </View>
      ) : null}

      <View style={[styles.rodapeMetodo, { borderTopColor: cor("cor-linha") }]}>
        <Pressable
          testID="radar-toggle-metodo"
          accessibilityRole="button"
          accessibilityState={{ expanded: mostrarMetodo }}
          onPress={() => setMostrarMetodo((v) => !v)}
          style={styles.botaoMetodo}
        >
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoBotaoMetodo}>
            {mostrarMetodo
              ? "Ocultar critério de leitura"
              : "Como conferimos vista, recuo e obras"}
          </Texto>
        </Pressable>
        {mostrarMetodo ? (
          <View testID="radar-ficha-metodo" style={styles.blocoFichaMetodo}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoMetodo}>
              Cruzamos somente licenças oficiais publicadas pela Prefeitura do Recife e a geometria dos lotes cadastrados num cone frontal de 42° a partir da fachada selecionada. Nunca projetamos obras privadas sem alvará público.
            </Texto>
            {[
              { rotulo: "Método", valor: radar.fichaMetodo.metodo },
              { rotulo: "Fonte", valor: radar.fichaMetodo.fonte },
              { rotulo: "Escala", valor: radar.fichaMetodo.escala },
              { rotulo: "Fórmula", valor: radar.fichaMetodo.formula },
              { rotulo: "Não inclui", valor: radar.fichaMetodo.naoInclui },
              { rotulo: "Janela", valor: radar.fichaMetodo.janelaTemporal },
            ].map((campo) => (
              <View key={campo.rotulo} style={styles.linhaMetodoCampo}>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloMetodoCampo}>
                  {`${campo.rotulo}: `}
                  <Texto tipo="apoio" style={styles.valorMetodoCampo}>
                    {campo.valor}
                  </Texto>
                </Texto>
              </View>
            ))}
          </View>
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
  linhaItem: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  ponto: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 5,
  },
  corpoItem: {
    flex: 1,
    gap: 2,
  },
  topoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 8,
  },
  tituloItem: {
    fontSize: 13,
    fontWeight: "700",
  },
  valorItem: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  detalheItem: {
    fontSize: 12,
    lineHeight: 17,
  },
  rodapeMetodo: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  faixaAcoes: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 4,
  },
  tituloAcoes: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  botaoMetodo: {
    minHeight: TOQUE_MINIMO,
    justifyContent: "center",
  },
  textoBotaoMetodo: {
    fontSize: 12,
    fontWeight: "600",
  },
  blocoFichaMetodo: {
    gap: 4,
    paddingBottom: 10,
  },
  textoMetodo: {
    fontSize: 11.5,
    lineHeight: 16,
    paddingBottom: 4,
  },
  linhaMetodoCampo: {
    gap: 1,
  },
  rotuloMetodoCampo: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "600",
  },
  valorMetodoCampo: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
