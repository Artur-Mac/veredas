import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  POLOS_RECIFE,
  compararRotinaDoisDestinos,
  type PoloDestinoRecife,
} from "../../dados/mobilidade/rotinaCasal";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";

type Props = {
  nomeOpcaoA: string;
  centroA: readonly [number, number] | null;
  bairroA: string | null;
  nomeOpcaoB: string;
  centroB: readonly [number, number] | null;
  bairroB: string | null;
};

export function RotinaDoisDestinosComparar({
  nomeOpcaoA,
  centroA,
  bairroA,
  nomeOpcaoB,
  centroB,
  bairroB,
}: Props) {
  const { cor } = useTema();
  const [destino1Id, setDestino1Id] =
    useState<PoloDestinoRecife["id"]>("polo_porto_digital");
  const [destino2Id, setDestino2Id] =
    useState<PoloDestinoRecife["id"]>("polo_boa_viagem");

  const resultado = compararRotinaDoisDestinos({
    nomeOpcaoA,
    centroA,
    bairroA,
    nomeOpcaoB,
    centroB,
    bairroB,
    destino1Id,
    destino2Id,
    diasPresenciaisMes: 20,
  });
  const difMinDia = Math.abs(resultado.minutosDiaOpcaoA - resultado.minutosDiaOpcaoB);
  const horasMesMenos = Math.round(((difMinDia * 20) / 60) * 10) / 10;

  return (
    <View
      testID="rotina-dois-destinos-comparar"
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
          Rotina a dois destinos (ida e volta no pico)
        </Texto>
        <Texto tipo="secao" style={styles.manchete}>
          {resultado.resumoRotina}
        </Texto>
      </View>

      {/* Seletores compactos sem caixas aninhadas */}
      <View style={[styles.secao, { borderTopColor: cor("cor-linha") }]}>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloPolo}>
          Trajeto 1
        </Texto>
        <View style={styles.chipsRow}>
          {POLOS_RECIFE.map((p) => {
            const ativo = destino1Id === p.id;
            return (
              <Pressable
                key={`d1-${p.id}`}
                accessibilityRole="button"
                onPress={() => setDestino1Id(p.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: ativo
                      ? cor("cor-texto")
                      : cor("cor-papel-claro"),
                  },
                ]}
              >
                <Texto
                  tipo="apoio"
                  cor={ativo ? "cor-superficie" : "cor-texto"}
                  style={styles.textoChip}
                >
                  {p.nomeCurto}
                </Texto>
              </Pressable>
            );
          })}
        </View>

        <Texto
          tipo="apoio"
          cor="cor-texto-apoio"
          style={[styles.rotuloPolo, { marginTop: 4 }]}
        >
          Trajeto 2
        </Texto>
        <View style={styles.chipsRow}>
          {POLOS_RECIFE.map((p) => {
            const ativo = destino2Id === p.id;
            return (
              <Pressable
                key={`d2-${p.id}`}
                accessibilityRole="button"
                onPress={() => setDestino2Id(p.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: ativo
                      ? cor("cor-azul-cadastral")
                      : cor("cor-papel-claro"),
                  },
                ]}
              >
                <Texto
                  tipo="apoio"
                  cor={ativo ? "cor-superficie" : "cor-texto"}
                  style={styles.textoChip}
                >
                  {p.nomeCurto}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Comparativo lado a lado por hairline */}
      <View style={[styles.linhaTotais, { borderTopColor: cor("cor-linha") }]}>
        <View style={styles.colTotal}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.nomeCol} numberOfLines={1}>
            {nomeOpcaoA}
          </Texto>
          <Texto
            tipo="numero"
            cor={
              resultado.vencedorRotina === "A" ? "cor-salvia-escura" : "cor-texto"
            }
            style={styles.valorTotal}
          >
            {`${resultado.minutosDiaOpcaoA} min/dia`}
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.detalheTrajeto}>
            {`${resultado.destino1.nomeCurto} ${resultado.pessoa1OpcaoAMin}m · ${resultado.destino2.nomeCurto} ${resultado.pessoa2OpcaoAMin}m`}
          </Texto>
        </View>

        <View
          style={[styles.divisorVert, { backgroundColor: cor("cor-linha") }]}
        />

        <View style={styles.colTotal}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.nomeCol} numberOfLines={1}>
            {nomeOpcaoB}
          </Texto>
          <Texto
            tipo="numero"
            cor={
              resultado.vencedorRotina === "B" ? "cor-salvia-escura" : "cor-texto"
            }
            style={styles.valorTotal}
          >
            {`${resultado.minutosDiaOpcaoB} min/dia`}
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.detalheTrajeto}>
            {`${resultado.destino1.nomeCurto} ${resultado.pessoa1OpcaoBMin}m · ${resultado.destino2.nomeCurto} ${resultado.pessoa2OpcaoBMin}m`}
          </Texto>
        </View>
      </View>

      {difMinDia >= 6 && resultado.vencedorRotina !== "empate" ? (
        <View
          testID="rotina-economia-mensal"
          style={[styles.faixaEconomia, { borderTopColor: cor("cor-linha") }]}
        >
          <Texto tipo="apoio" cor="cor-salvia-escura" style={styles.textoEconomia}>
            {`~${String(horasMesMenos).replace(".", ",")} h/mês a menos no trânsito em ${resultado.vencedorRotina === "A" ? nomeOpcaoA : nomeOpcaoB} considerando 20 dias presenciais.`}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
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
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  secao: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 6,
  },
  rotuloPolo: {
    fontSize: 11,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  chip: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.pilula,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textoChip: {
    fontSize: 11,
    fontWeight: "600",
  },
  linhaTotais: {
    borderTopWidth: 1,
    flexDirection: "row",
    padding: 14,
    gap: 10,
    alignItems: "center",
  },
  faixaEconomia: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textoEconomia: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  colTotal: {
    flex: 1,
    gap: 2,
  },
  divisorVert: {
    width: 1,
    alignSelf: "stretch",
  },
  nomeCol: {
    fontSize: 12,
    fontWeight: "600",
  },
  valorTotal: {
    fontSize: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  detalheTrajeto: {
    fontSize: 11,
    lineHeight: 15,
    fontVariant: ["tabular-nums"],
  },
});
