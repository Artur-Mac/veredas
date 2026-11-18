import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { ResultadoCaminhabilidadeEVida } from "../../dados/dossie/caminhabilidadeEVidaNaRua";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";

export function VidaAPeNaQuadra({
  dados,
}: {
  dados: ResultadoCaminhabilidadeEVida;
}) {
  const { cor } = useTema();
  const [verPesos, setVerPesos] = useState(false);

  return (
    <View
      testID="vida-a-pe-na-quadra"
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
          Dia a dia a pé e vida na rua
        </Texto>
        <Texto tipo="secao" style={styles.manchete}>
          {dados.manchete}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.sub}>
          {dados.frasePercentil}
        </Texto>
      </View>

      {dados.categorias.map((c) => (
        <View
          key={c.id}
          style={[styles.linhaCat, { borderTopColor: cor("cor-linha") }]}
        >
          <View style={styles.topoCat}>
            <Texto tipo="etiqueta" style={styles.tituloCat}>
              {`${c.titulo} (peso ${c.pesoPct}%)`}
            </Texto>
            <Texto
              tipo="numero"
              cor={
                c.nota0a10 !== null && c.nota0a10 >= 7
                  ? "cor-salvia-escura"
                  : "cor-texto"
              }
              style={styles.valorCat}
            >
              {c.nota0a10 !== null
                ? `${c.nota0a10.toFixed(1).replace(".", ",")} / 10`
                : c.distanciaRetaM !== null
                  ? `${c.distanciaRetaM} m`
                  : "Sem leitura"}
            </Texto>
          </View>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.resumoCat}>
            {c.resumo}
          </Texto>
        </View>
      ))}

      <View style={[styles.rodape, { borderTopColor: cor("cor-linha") }]}>
        <Texto testID="vida-a-pe-malha-quadra" tipo="apoio" cor="cor-texto-apoio" style={styles.vidaRua}>
          {dados.fraseMalhaQuadra}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.vidaRua}>
          {`Entorno da face de quadra: ${dados.vidaNaRuaResumo}`}
        </Texto>

        <Pressable
          testID="vida-a-pe-pesos-toggle"
          accessibilityRole="button"
          accessibilityState={{ expanded: verPesos }}
          onPress={() => setVerPesos((v) => !v)}
          style={styles.botaoPesos}
        >
          <Texto tipo="apoio" cor="cor-azul-cadastral" style={styles.textoBotaoPesos}>
            {verPesos
              ? "Ocultar decomposição e pesos"
              : "Ver pesos e decomposição desta nota"}
          </Texto>
        </Pressable>

        {verPesos ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoPesos}>
            {dados.decomposicaoResumo}
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
  cabecalho: {
    padding: 16,
    paddingBottom: 12,
    gap: 4,
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
  sub: {
    fontSize: 12,
    lineHeight: 17,
    fontVariant: ["tabular-nums"],
  },
  linhaCat: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 2,
  },
  topoCat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  tituloCat: {
    fontSize: 13,
    fontWeight: "700",
  },
  valorCat: {
    fontSize: 12.5,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  resumoCat: {
    fontSize: 12,
    lineHeight: 16,
  },
  rodape: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  vidaRua: {
    fontSize: 12,
    lineHeight: 17,
  },
  botaoPesos: {
    minHeight: TOQUE_MINIMO - 6,
    justifyContent: "center",
  },
  textoBotaoPesos: {
    fontSize: 12,
    fontWeight: "600",
  },
  textoPesos: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
