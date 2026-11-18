import React from "react";
import { StyleSheet, View } from "react-native";
import type {
  EixoPulsoDaQuadra,
  ResultadoPulsoDaQuadra,
} from "../../dados/dossie/pulsoDaQuadra";
import { FichaDeMetodo } from "./FichaDeMetodo";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, type TokenDeCor } from "../../tema/tokens";

function corNota(eixo: EixoPulsoDaQuadra): TokenDeCor {
  if (eixo.ausencia === "sem_ocorrencia_no_periodo") return "cor-salvia";
  if (eixo.ausencia !== null || eixo.nota0a10 === null) return "cor-traco";
  if (eixo.nota0a10 >= 7.5) return "cor-salvia";
  if (eixo.nota0a10 >= 5.5) return "cor-acao";
  return "cor-barro";
}

function corTextoNota(eixo: EixoPulsoDaQuadra): TokenDeCor {
  if (eixo.ausencia === "sem_ocorrencia_no_periodo") return "cor-salvia-escura";
  if (eixo.ausencia !== null || eixo.nota0a10 === null) return "cor-texto-apoio";
  if (eixo.nota0a10 >= 7.5) return "cor-salvia-escura";
  if (eixo.nota0a10 < 5.5) return "cor-barro-texto";
  return "cor-texto";
}

export function PulsoDaQuadra({ pulso }: { pulso: ResultadoPulsoDaQuadra }) {
  const { cor } = useTema();

  return (
    <View
      testID="pulso-da-quadra"
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
          Pulso da quadra por dimensão (0–10)
        </Texto>
        <Texto tipo="secao" style={styles.manchete}>
          {pulso.manchete}
        </Texto>
        <Texto testID="pulso-escopo-edificio" tipo="apoio" cor="cor-texto-apoio" style={styles.escopoTxt}>
          {pulso.escopoResolucao}
        </Texto>
      </View>

      {pulso.eixos.map((eixo) => {
        const pctBarra =
          eixo.nota0a10 !== null
            ? Math.max(8, Math.min(100, (eixo.nota0a10 / 10) * 100))
            : 0;
        return (
          <View
            key={eixo.id}
            style={[styles.linhaEixo, { borderTopColor: cor("cor-linha") }]}
          >
            <View style={styles.topoEixo}>
              <Texto tipo="etiqueta" style={styles.tituloEixo}>
                {eixo.titulo}
              </Texto>
              <Texto
                tipo="numero"
                cor={corTextoNota(eixo)}
                style={styles.valorEixo}
              >
                {eixo.rotuloValor}
              </Texto>
            </View>

            {pctBarra > 0 ? (
              <View style={[styles.trilho, { backgroundColor: cor("cor-papel-claro") }]}>
                <View
                  style={[
                    styles.barra,
                    {
                      width: `${pctBarra}%`,
                      backgroundColor: cor(corNota(eixo)),
                    },
                  ]}
                />
              </View>
            ) : null}

            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.resumoEixo}>
              {eixo.resumo}
            </Texto>
          </View>
        );
      })}

      {/* R11: cada nota do pulso abre, num toque, a ficha de 6 campos com a conta de cada eixo. */}
      <View style={styles.rodapeMetodo}>
        <FichaDeMetodo ficha={pulso.metodo} testID="pulso-metodo" rotulo="Como cada nota foi calculada" />
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
    fontVariant: ["tabular-nums"],
  },
  escopoTxt: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  linhaEixo: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 5,
  },
  topoEixo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  tituloEixo: {
    fontSize: 13,
    fontWeight: "700",
  },
  valorEixo: {
    fontSize: 12.5,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  trilho: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  barra: {
    height: "100%",
    borderRadius: 3,
  },
  resumoEixo: {
    fontSize: 12,
    lineHeight: 16,
  },
  rodapeMetodo: {
    paddingHorizontal: 16,
  },
});
