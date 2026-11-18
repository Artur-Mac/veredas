// Sala de decisão (15/11/2026): abre o link de comparação compartilhada (#s=…) ou de resposta (#r=…). Na web o pacote
// vem no fragmento (#), que não vai para servidor; no aparelho, em ?d=.
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Platform, ScrollView, View } from "react-native";
import { Coluna } from "../componentes/casca/Coluna";
import { TelaDaSala } from "../componentes/comparar/Sala";
import { Cabecalho, Tela } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { lerFragmento, type LidoDoLink } from "../dados/salaDeDecisao";

export default function TelaSala() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  const lido = useMemo<LidoDoLink>(() => {
    const fragmento = Platform.OS === "web" && typeof window !== "undefined" && window.location.hash ? window.location.hash : (d ?? "");
    try { return lerFragmento(decodeURIComponent(fragmento)); } catch { return { tipo: "erro", motivo: "Link corrompido: copie o link inteiro de novo." }; }
  }, [d]);
  return (
    <Tela>
      <Cabecalho titulo="Sala de decisão" pai="/comparar" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Coluna>
          <View style={{ gap: 12 }}>
            {lido.tipo === "erro" ? <Texto role="alert" cor="cor-barro-texto">{lido.motivo}</Texto> : null}
            {lido.tipo === "vazio" ? <Texto tipo="apoio">Abra esta tela pelo link de uma comparação compartilhada.</Texto> : null}
            <TelaDaSala
              sala={lido.tipo === "sala" ? lido.sala : null}
              resposta={lido.tipo === "resposta" ? lido.resposta : null}
              resumo={lido.tipo === "resumo" ? lido.resumo : null}
            />
          </View>
        </Coluna>
      </ScrollView>
    </Tela>
  );
}
