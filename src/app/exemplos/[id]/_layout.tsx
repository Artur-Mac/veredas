import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { SafeAreaInsetsContext, useSafeAreaInsets } from "react-native-safe-area-context";
import { AvisoDeExemplo } from "../../../componentes/dossie/AvisoDeExemplo";
import { dossieOuNulo } from "../../../dados/dossies";
import { useSessao } from "../../../estado/Sessao";
import { OPCOES_DA_FOLHA } from "../../../navegacao/opcoes";
import { ContextoDoDossie } from "../../../navegacao/useDossie";
import { useTema } from "../../../tema/Tema";

export const unstable_settings = { anchor: "(abas)" };

export default function LayoutDoDossie() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cor } = useTema();
  const { mudar } = useSessao();
  const insets = useSafeAreaInsets();
  // O aviso já ocupa a área do relógio: as telas abaixo (Tela) não recuam o topo de novo.
  const insetsSemTopo = useMemo(() => ({ ...insets, top: 0 }), [insets]);
  useEffect(() => () => mudar(() => ({ recebido: null })), [mudar, id]);
  const dossie = dossieOuNulo(id);
  if (!dossie) return <Redirect href="/" />;
  return (
    <ContextoDoDossie.Provider value={dossie}>
      <View style={{ flex: 1, backgroundColor: cor("cor-fundo") }}>
        <AvisoDeExemplo />
        <SafeAreaInsetsContext.Provider value={insetsSemTopo}>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor("cor-fundo") } }}>
              <Stack.Screen name="(abas)" />
              <Stack.Screen name="confirmar-lote" />
              <Stack.Screen name="caminhos" />
              <Stack.Screen name="linha-do-tempo" />
              <Stack.Screen name="visita/ao-vivo" />
              <Stack.Screen name="fonte/[fato]" options={OPCOES_DA_FOLHA} />
              <Stack.Screen name="contestar/[fato]" options={OPCOES_DA_FOLHA} />
              <Stack.Screen name="domicilio" options={OPCOES_DA_FOLHA} />
            </Stack>
          </View>
        </SafeAreaInsetsContext.Provider>
      </View>
    </ContextoDoDossie.Provider>
  );
}
