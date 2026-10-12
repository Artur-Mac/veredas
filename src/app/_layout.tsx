import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ShareIntentProvider } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RecebedorDeAnuncio } from '@/entrada/RecebedorDeAnuncio';
import { EstadoProvider, useEstado } from '@/estado/armazenamento';
import { TemaProvider, useTema } from '@/tema/TemaProvider';
import { fontesParaCarregar } from '@/tema/tipografia';

SplashScreen.preventAutoHideAsync().catch((erro: unknown) => {
  console.warn('Não foi possível manter a abertura visível.', erro);
});

const compartilhamentoDesativado =
  Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function Pilha() {
  const { paleta, escuro } = useTema();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(paleta.fundo).catch((erro: unknown) => {
      console.warn('Não foi possível ajustar a cor de fundo do sistema.', erro);
    });
  }, [paleta.fundo]);

  return (
    <>
      <StatusBar style={escuro ? 'light' : 'dark'} />
      <RecebedorDeAnuncio />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: paleta.fundo },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(abas)" options={{ animation: 'fade' }} />
        <Stack.Screen name="dossie/[id]/cartao/[cartao]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="dossie/[id]/contestar/[cartao]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

function TemaDoUsuario() {
  const { estado } = useEstado();
  return (
    <TemaProvider preferencia={estado.tema}>
      <Pilha />
    </TemaProvider>
  );
}

export default function Raiz() {
  const [fontesProntas, erroFontes] = useFonts(fontesParaCarregar);

  useEffect(() => {
    if (erroFontes !== null) {
      console.error('Falha ao carregar as fontes do PropSight.', erroFontes);
    }
    if (fontesProntas || erroFontes !== null) {
      SplashScreen.hideAsync().catch((erro: unknown) => {
        console.warn('Não foi possível esconder a abertura.', erro);
      });
    }
  }, [fontesProntas, erroFontes]);

  if (!fontesProntas && erroFontes === null) {
    return null;
  }

  return (
    <ShareIntentProvider options={{ disabled: compartilhamentoDesativado, resetOnBackground: true }}>
      <SafeAreaProvider>
        <EstadoProvider>
          <TemaDoUsuario />
        </EstadoProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  );
}
