import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
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
import { PerfilDoDomicilioNoAparelho } from "../estado/PerfilDomicilio";
import { FONTES } from "../tema/tokens";
import { iniciarModoOffline } from "../plataforma/modoOffline";

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: "(abas)" };

function Pilha() {
  const [fontesProntas, erroDeFonte] = useFonts(FONTES);
  const { carregadas } = usePreferencias();
  const { carregado } = useAparelho();
  const { escuro, cor } = useTema();
  const pronto = fontesProntas && carregadas && carregado;

  useEffect(() => {
    if (pronto) void SplashScreen.hideAsync();
  }, [pronto]);

  // D036: na web, depois das fontes, guarda a casca do app para reabrir sem rede (nada no nativo).
  useEffect(() => {
    if (!pronto) return;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      if (!document.getElementById("vereda-svg-sans")) {
        const tag = document.createElement("style");
        tag.id = "vereda-svg-sans";
        tag.textContent =
          'svg text, svg tspan { font-family: "PlusJakartaSans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-variant-numeric: tabular-nums; }';
        document.head.appendChild(tag);
      }
    }
    const t = setTimeout(iniciarModoOffline, 2000);
    return () => clearTimeout(t);
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
        <Stack.Screen name="perfil-domicilio" options={OPCOES_DA_FOLHA} />
        <Stack.Screen name="mock" />
        <Stack.Screen name="sala" />
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
                    <PerfilDoDomicilioNoAparelho>
                      <SessaoDoApp>
                        <Pilha />
                      </SessaoDoApp>
                    </PerfilDoDomicilioNoAparelho>
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
