// Espera do compartilhamento do Safari (iOS). A extensão abre o Vereda com `vereda://dataUrl=…`, que
// `+native-intent.tsx` traz para cá; o `RecebedorDeCompartilhamento`, na raiz, lê o anúncio e troca esta tela pela
// leitura. Se nada chegar, a tela diz o que fazer em vez de deixar a pessoa esperando.
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Botao } from "../../componentes/Botao";
import { Tela } from "../../componentes/Tela";
import { Texto } from "../../componentes/Texto";

/** Tempo para a extensão entregar a página. A leitura costuma chegar em menos de um segundo. */
const ESPERA_MS = 6000;

export default function EsperaDoCompartilhamento() {
  const [demorou, setDemorou] = useState(false);
  useEffect(() => {
    const espera = setTimeout(() => setDemorou(true), ESPERA_MS);
    return () => clearTimeout(espera);
  }, []);

  return (
    <Tela>
      <View style={styles.centro}>
        <Texto tipo="titulo-tela" role="heading" style={styles.titulo}>
          {demorou ? "O anúncio não chegou" : "Abrindo o anúncio"}
        </Texto>
        <Texto tipo="apoio" accessibilityLiveRegion="polite" style={styles.texto}>
          {demorou
            ? "Volte ao Safari e compartilhe o anúncio de novo, ou cole o link no Vereda."
            : "Lendo a página que você compartilhou."}
        </Texto>
        {demorou ? <Botao rotulo="Colar o link" variante="principal" onPress={() => router.replace("/")} /> : null}
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  titulo: {
    textAlign: "center",
  },
  texto: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
