import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { DadosNoAparelho, useAparelho } from "../estado/Aparelho";
import { PreferenciasDoMock, usePreferencias } from "../estado/Preferencias";
import { SessaoDoApp } from "../estado/Sessao";
import { OPCOES_DA_FOLHA } from "../navegacao/opcoes";
import { TemaDoApp, useTema } from "../tema/Tema";
import { FONTES } from "../tema/tokens";

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: "index" };

function Pilha() {
  const [fontesProntas, erroDeFonte] = useFonts(FONTES);
  const { carregadas } = usePreferencias();
  const { carregado } = useAparelho();
  const { escuro, cor } = useTema();
  const pronto = fontesProntas && carregadas && carregado;

  useEffect(() => {
    if (pronto) void SplashScreen.hideAsync();
  }, [pronto]);

  if (erroDeFonte) throw erroDeFonte;
  if (!pronto) return null;

  return (
    <>
      <StatusBar style={escuro ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor("cor-fundo") } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="ler" />
        <Stack.Screen name="comparar" />
        <Stack.Screen name="sobre-os-dados" />
        <Stack.Screen name="mock" />
        <Stack.Screen name="creditos" options={OPCOES_DA_FOLHA} />
        <Stack.Screen name="dossie/[id]" />
      </Stack>
    </>
  );
}

export default function Raiz() {
  return (
    <PreferenciasDoMock>
      <TemaDoApp>
        <DadosNoAparelho>
          <SessaoDoApp>
            <Pilha />
          </SessaoDoApp>
        </DadosNoAparelho>
      </TemaDoApp>
    </PreferenciasDoMock>
  );
}
