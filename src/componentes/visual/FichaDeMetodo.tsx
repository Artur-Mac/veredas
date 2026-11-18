import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { FichaDeMetodo6Campos } from "../../dados/fichaDeMetodo";
import { useTema } from "../../tema/Tema";
import { TOQUE_MINIMO } from "../../tema/tokens";
import { Texto } from "../Texto";

export type { FichaDeMetodo6Campos } from "../../dados/fichaDeMetodo";

const CAMPOS: readonly { chave: keyof FichaDeMetodo6Campos; rotulo: string }[] = [
  { chave: "oQueMede", rotulo: "O que mede" },
  { chave: "fonte", rotulo: "Fonte" },
  { chave: "data", rotulo: "Data" },
  { chave: "calculo", rotulo: "Como foi calculada" },
  { chave: "limite", rotulo: "Limite" },
  { chave: "naVisita", rotulo: "Na visita" },
];

/** As seis linhas da ficha, para quem já tem o seu próprio botão de abrir. */
export function LinhasDaFichaDeMetodo({ ficha, testID }: { ficha: FichaDeMetodo6Campos; testID?: string }) {
  return (
    <View testID={testID} style={styles.bloco}>
      {CAMPOS.map((c) => (
        <Texto key={c.chave} tipo="apoio" cor="cor-texto-apoio" style={styles.linha}>
          <Texto tipo="apoio" cor="cor-texto" style={styles.rotulo}>{`${c.rotulo}: `}</Texto>
          {ficha[c.chave]}
        </Texto>
      ))}
    </View>
  );
}

/** Botão "Como foi calculada" (44 px de toque) que abre a ficha de 6 campos logo abaixo. */
export function FichaDeMetodo({
  ficha,
  testID,
  rotulo = "Como foi calculada",
}: {
  ficha: FichaDeMetodo6Campos;
  /** O botão recebe `${testID}-toggle`; as linhas, `${testID}`. */
  testID: string;
  rotulo?: string;
}) {
  const { cor } = useTema();
  const [aberta, setAberta] = useState(false);
  return (
    <View style={[styles.rodape, { borderTopColor: cor("cor-linha") }]}>
      <Pressable
        testID={`${testID}-toggle`}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberta }}
        accessibilityLabel={aberta ? `Ocultar: ${rotulo}` : rotulo}
        onPress={() => setAberta((v) => !v)}
        style={styles.botao}
      >
        <Texto tipo="apoio" cor="cor-azul-cadastral" style={styles.textoBotao}>
          {aberta ? `Ocultar: ${rotulo.toLowerCase()}` : rotulo}
        </Texto>
      </Pressable>
      {aberta ? <LinhasDaFichaDeMetodo ficha={ficha} testID={testID} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rodape: {
    borderTopWidth: 1,
  },
  botao: {
    minHeight: TOQUE_MINIMO,
    justifyContent: "center",
  },
  textoBotao: {
    fontSize: 12,
    fontWeight: "600",
  },
  bloco: {
    paddingBottom: 10,
    gap: 4,
  },
  linha: {
    fontSize: 12,
    lineHeight: 17,
  },
  rotulo: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
});
