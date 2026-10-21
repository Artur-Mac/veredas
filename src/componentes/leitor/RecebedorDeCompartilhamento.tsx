// Recebe o anúncio compartilhado (página do Safari, link ou trecho de "Ler no Vereda") e abre a tela de leitura com
// ele. Fica na raiz, ao lado das rotas, porque o compartilhamento chega com o app em qualquer tela. Sem o módulo nativo
// (Expo Go, web, testes), o contexto nunca tem compartilhamento e este componente não faz nada.
import { router, usePathname } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { anuncioRecebido, parametrosDaLeitura } from "../../dados/extrator/compartilhado";
import { guardarColeta, linkAbertoRecente, registrarLinkAberto, registrarRecebimento } from "../../estado/compartilhamento";
import { useAviso } from "../casca/Aviso";

export const AVISO_NADA_DO_ANUNCIO =
  "O que você mandou não parece o anúncio. Compartilhe o link ou selecione o trecho com o preço e escolha Ler no Vereda.";

export function RecebedorDeCompartilhamento() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const { mostrarAviso } = useAviso();
  const caminho = usePathname();
  /** O mesmo compartilhamento só abre a leitura uma vez, mesmo que a raiz renderize de novo antes de limpá-lo. */
  const tratado = useRef<object | null>(null);

  useEffect(() => {
    if (!hasShareIntent || tratado.current === shareIntent) return;
    tratado.current = shareIntent;
    const agora = Date.now();
    const recebido = anuncioRecebido(shareIntent, linkAbertoRecente(agora));
    // Limpa também a cópia nativa (no iOS, a página inteira fica no grupo de apps até aqui).
    resetShareIntent();
    registrarRecebimento(agora);
    // No iOS, o anúncio pode ter sido compartilhado da aba do Safari aberta pelo próprio Vereda: ela sai da frente.
    if (Platform.OS === "ios") WebBrowser.dismissBrowser().catch(() => undefined);

    const naEspera = caminho === "/receber";
    if (recebido === null) {
      mostrarAviso(AVISO_NADA_DO_ANUNCIO);
      if (naEspera) router.replace("/");
      return;
    }
    if (recebido.url) registrarLinkAberto(recebido.url, agora);
    const destino = {
      pathname: "/ler" as const,
      params: parametrosDaLeitura(recebido, String(agora), recebido.coleta ? guardarColeta(recebido.coleta) : null),
    };
    if (naEspera) router.replace(destino);
    else router.navigate(destino);
  }, [hasShareIntent, shareIntent, resetShareIntent, mostrarAviso, caminho]);

  return null;
}
