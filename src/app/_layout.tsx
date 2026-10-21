import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { DadosNoAparelho, useAparelho } from "../estado/Aparelho";
import { PreferenciasDoMock, usePreferencias } from "../estado/Preferencias";
import { SessaoDoApp } from "../estado/Sessao";
import { OPCOES_DA_FOLHA } from "../navegacao/opcoes";
import { TemaDoApp, useTema } from "../tema/Tema";
import { ProvedorDeAviso } from "../componentes/casca/Aviso";
import { RecebedorDeCompartilhamento } from "../componentes/leitor/RecebedorDeCompartilhamento";
import { ReinicioDoApp } from "../componentes/casca/Reinicio";
import { AnalisesNoAparelho } from "../estado/Analises";
import { CarteiraNoAparelho } from "../estado/Carteira";
import { FONTES } from "../tema/tokens";

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = { initialRouteName: "(abas)" };

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
        <Stack.Screen name="(abas)" />
        <Stack.Screen name="exemplos/[id]" />
        <Stack.Screen name="editar" />
        <Stack.Screen name="analise" />
        <Stack.Screen name="sobre-os-dados" options={OPCOES_DA_FOLHA} />
        <Stack.Screen name="creditos" options={OPCOES_DA_FOLHA} />
        <Stack.Screen name="mock" />
      </Stack>
      <RecebedorDeCompartilhamento />
    </>
  );
}

/**
 * Raiz. O tema e o aviso (toast) não guardam nada e ficam fora do reinício; tudo o que lê o armazenamento fica dentro
 * dele, para "Apagar meus dados deste aparelho" poder remontar os provedores já com o armazenamento vazio.
 * O compartilhamento (expo-share-intent) vem antes de todos, como pede a biblioteca; sem o módulo nativo, não faz nada.
 */
export default function Raiz() {
  return (
    <ShareIntentProvider>
      <TemaDoApp>
        <ProvedorDeAviso>
          <ReinicioDoApp>
            <PreferenciasDoMock>
              <DadosNoAparelho>
                <CarteiraNoAparelho>
                  <AnalisesNoAparelho>
                    <SessaoDoApp>
                      <Pilha />
                    </SessaoDoApp>
                  </AnalisesNoAparelho>
                </CarteiraNoAparelho>
              </DadosNoAparelho>
            </PreferenciasDoMock>
          </ReinicioDoApp>
        </ProvedorDeAviso>
      </TemaDoApp>
    </ShareIntentProvider>
  );
}
