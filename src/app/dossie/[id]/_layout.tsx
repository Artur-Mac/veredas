import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
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
  useEffect(() => () => mudar(() => ({ recebido: null })), [mudar, id]);
  const dossie = dossieOuNulo(id);
  if (!dossie) return <Redirect href="/" />;
  return (
    <ContextoDoDossie.Provider value={dossie}>
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
    </ContextoDoDossie.Provider>
  );
}
