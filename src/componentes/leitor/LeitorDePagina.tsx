import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { type LeituraParcial, type Portal } from "../../dados/contratos";
import { chavesDoAnuncio } from "../../dados/extrator/estado";
import { DOMINIOS_DOS_PORTAIS, coletaEhDoAnuncio, esquemaColetaDaPagina, lerPagina } from "../../dados/extrator/pagina";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { Texto } from "../Texto";
import { SCRIPT_COLETOR, paginaBloqueada } from "./coletor";
import { resumoDaColeta } from "./diagnostico";
import {
  ESTADO_INICIAL_DO_LEITOR,
  proximoEstado,
  type EstadoDoLeitor,
  type EventoDoLeitor,
  type MotivoDaFalha,
} from "./decidir";

export const AVISO_DE_OUTRA_PAGINA = "O portal abriu outra página. Confira o anúncio ou cole o texto.";
export const AVISO_DE_VERIFICACAO = "O portal pediu uma verificação. Complete na página abaixo.";

export interface LeitorDePaginaProps {
  url: string;
  portal: Portal;
  idNoPortal: string | null;
  aoLer: (leituras: LeituraParcial[]) => void;
  aoFalhar: (motivo: MotivoDaFalha) => void;
}

/**
 * Origens que a WebView aceita carregar. `about:srcdoc` é o quadro interno que o desafio da Cloudflare cria no iOS;
 * sem ele na lista, a biblioteca recusa o quadro (e tenta abri-lo fora do app), e o desafio nunca termina.
 */
export const ORIGENS_DA_WEBVIEW = ["https://*", "http://*", "about:blank", "about:srcdoc"];

const PRAZO_DA_PAGINA_MS = 20_000;
const PRAZO_DA_VERIFICACAO_MS = 120_000;

/**
 * Modo de inspeção (só em `__DEV__`): escreve no console os NOMES das chaves do objeto do anúncio, em cada estado da
 * página, para descobrir os sinônimos de ZAP, VivaReal e OLX em `estado.ts`. Nunca escreve valores.
 */
function mapearChaves(estados: string[], portal: Portal, idNoPortal: string | null): void {
  if (estados.length === 0) {
    console.info(`[Mapear chaves] ${portal}: a página não trouxe estado nenhum.`);
    return;
  }
  estados.forEach((texto, posicao) => {
    let estado: unknown;
    try {
      estado = JSON.parse(texto);
    } catch {
      console.info(`[Mapear chaves] ${portal}, estado ${posicao + 1}: não é JSON.`);
      return;
    }
    const caminhos = chavesDoAnuncio(estado, idNoPortal);
    if (caminhos.length === 0) {
      console.info(`[Mapear chaves] ${portal}, estado ${posicao + 1}: objeto do anúncio não encontrado.`);
      return;
    }
    console.info(`[Mapear chaves] ${portal}, estado ${posicao + 1}: ${caminhos.length} chaves`, caminhos);
  });
}

function hostDe(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function LeitorDePagina({ url, portal, idNoPortal, aoLer, aoFalhar }: LeitorDePaginaProps) {
  // O estado vive numa ref para o despacho ser síncrono; o `useState` só faz a tela reagir.
  const estadoRef = useRef<EstadoDoLeitor>(ESTADO_INICIAL_DO_LEITOR);
  const [estado, definirEstado] = useState<EstadoDoLeitor>(ESTADO_INICIAL_DO_LEITOR);

  // Callbacks em ref: o pai os recria a cada renderização e isso não pode reiniciar os prazos.
  const aoLerRef = useRef(aoLer);
  const aoFalharRef = useRef(aoFalhar);
  useEffect(() => {
    aoLerRef.current = aoLer;
    aoFalharRef.current = aoFalhar;
  });

  const despachar = useCallback((evento: EventoDoLeitor) => {
    const anterior = estadoRef.current;
    const proximo = proximoEstado(anterior, evento);
    if (proximo === anterior) return;
    estadoRef.current = proximo;
    definirEstado(proximo);
    if (proximo.fase === "lido" && evento.tipo === "mensagem") aoLerRef.current(evento.leituras);
    else if (proximo.fase === "falhou") aoFalharRef.current(proximo.motivo);
  }, []);

  // Os dois prazos são agendados uma vez, na montagem.
  const prazoDaVerificacaoPassou = useRef(false);
  useEffect(() => {
    const prazoDaPagina = setTimeout(() => despachar({ tipo: "prazo_20s" }), PRAZO_DA_PAGINA_MS);
    const prazoDaVerificacao = setTimeout(() => {
      prazoDaVerificacaoPassou.current = true;
      despachar({ tipo: "prazo_120s" });
    }, PRAZO_DA_VERIFICACAO_MS);
    return () => {
      clearTimeout(prazoDaPagina);
      clearTimeout(prazoDaVerificacao);
    };
  }, [despachar]);

  // O desafio pode aparecer depois da falha por tempo e até depois dos 120 s da montagem: se o prazo da verificação
  // já passou, a espera por ela recomeça ao entrar em "verificando". Nunca fica sem prazo.
  const fase = estado.fase;
  useEffect(() => {
    if (fase !== "verificando" || !prazoDaVerificacaoPassou.current) return;
    const novoPrazo = setTimeout(() => despachar({ tipo: "prazo_120s" }), PRAZO_DA_VERIFICACAO_MS);
    return () => clearTimeout(novoPrazo);
  }, [fase, despachar]);

  // Modo de inspeção: o botão pede uma nova coleta e a próxima mensagem vira o mapa de chaves. Nada é guardado.
  const webViewRef = useRef<WebView>(null);
  const mapearNaProximaMensagem = useRef(false);
  const pedirMapaDeChaves = () => {
    mapearNaProximaMensagem.current = true;
    webViewRef.current?.injectJavaScript(SCRIPT_COLETOR);
  };

  // Diagnóstico (só em desenvolvimento): o resumo da última coleta, para copiar quando a página abre e nada é lido.
  const [diagnostico, definirDiagnostico] = useState("");
  const numeroDaColeta = useRef(0);

  const tratarMensagem = (evento: WebViewMessageEvent) => {
    let bruto: unknown;
    try {
      bruto = JSON.parse(evento.nativeEvent.data);
    } catch {
      return;
    }
    const validada = esquemaColetaDaPagina.safeParse(bruto);
    if (!validada.success) return;
    const coleta = validada.data;
    if (__DEV__ && mapearNaProximaMensagem.current) {
      mapearNaProximaMensagem.current = false;
      mapearChaves(coleta.estados, portal, idNoPortal);
    }
    const leituras = lerPagina(coleta, portal, idNoPortal, url);
    const doAnuncio = coletaEhDoAnuncio(coleta, portal, idNoPortal, url);
    const bloqueio = paginaBloqueada(coleta.titulo, coleta.texto);
    if (__DEV__) {
      numeroDaColeta.current += 1;
      definirDiagnostico(resumoDaColeta(coleta, leituras, { numero: numeroDaColeta.current, doAnuncio, bloqueio }));
    }
    if (estadoRef.current.fase === "lido") return;
    // A página pode ter redirecionado para outro lugar do portal (lista, busca, início). Aí `lerPagina` só devolve o
    // que o estado do anúncio rendeu, e o leitor avisa em vez de esperar até o prazo.
    despachar({
      tipo: "mensagem",
      leituras,
      verificacao: coleta.verificacao,
      outraPagina: !doAnuncio,
      bloqueio,
    });
  };

  const hostDoLink = hostDe(url);

  /**
   * A página do anúncio (quadro principal) só navega no portal e no desafio. Quadros internos (o iOS os pergunta
   * também; o Android, não) carregam como num navegador comum: o desafio da Cloudflare roda num deles, e eles não
   * tiram a pessoa da página.
   */
  const permitirNavegacao = (pedido: string, quadroPrincipal = true): boolean => {
    if (!quadroPrincipal && (pedido === "about:blank" || pedido === "about:srcdoc")) return true;
    let analisado: URL;
    try {
      analisado = new URL(pedido);
    } catch {
      return false;
    }
    if (analisado.protocol !== "https:" && analisado.protocol !== "http:") return false;
    if (!quadroPrincipal) return true;
    const host = analisado.hostname.toLowerCase();
    if (host === "challenges.cloudflare.com") return true;
    const permitidos = DOMINIOS_DOS_PORTAIS[portal];
    if (permitidos.length > 0) return permitidos.some((p) => host === p || host.endsWith(`.${p}`));
    return hostDoLink !== "" && (host === hostDoLink || host.endsWith(`.${hostDoLink}`));
  };

  const { cor } = useTema();
  const verificando = estado.fase === "verificando";
  const outraPagina = estado.fase === "falhou" && estado.motivo === "outra_pagina";
  // A página continua à vista, maior, enquanto a pessoa ainda pode completar a verificação.
  const ampliada = verificando || (estado.fase === "falhou" && estado.motivo === "verificacao");

  return (
    <View>
      {verificando ? <FaixaDeAviso texto={AVISO_DE_VERIFICACAO} /> : null}
      {outraPagina ? <FaixaDeAviso texto={AVISO_DE_OUTRA_PAGINA} /> : null}

      <View
        style={[
          styles.quadro,
          { borderColor: comAlfa(cor("cor-texto"), 0.09), backgroundColor: cor("cor-superficie") },
          ampliada ? styles.quadroAmpliado : null,
        ]}
      >
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          injectedJavaScript={SCRIPT_COLETOR}
          onMessage={tratarMensagem}
          onError={() => despachar({ tipo: "erro" })}
          originWhitelist={ORIGENS_DA_WEBVIEW}
          onShouldStartLoadWithRequest={(pedido) => permitirNavegacao(pedido.url, pedido.isTopFrame !== false)}
          setSupportMultipleWindows={false}
          // Cookies de terceiros como no Chrome (o padrão do Android): o desafio guarda a prova num deles. Ficam só
          // nesta WebView, separados do navegador da pessoa, e o app não os lê.
          thirdPartyCookiesEnabled
          sharedCookiesEnabled={false}
          allowsInlineMediaPlayback={false}
          mediaPlaybackRequiresUserAction
          style={styles.pagina}
        />
      </View>

      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mapear chaves"
          onPress={pedirMapaDeChaves}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={styles.botaoDeInspecao}
        >
          <Texto tipo="apoio" cor="cor-azul-cadastral" style={styles.textoDeInspecao}>
            Mapear chaves
          </Texto>
        </Pressable>
      ) : null}
      {__DEV__ ? (
        <View style={styles.diagnostico}>
          <Texto tipo="apoio" style={styles.textoDoDiagnostico}>
            {diagnostico || "Diagnóstico: nenhuma coleta chegou da página ainda."}
          </Texto>
          {diagnostico ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copiar diagnóstico"
              onPress={() => void Clipboard.setStringAsync(diagnostico)}
              style={styles.botaoDeInspecao}
            >
              <Texto tipo="apoio" cor="cor-azul-cadastral" style={styles.textoDeInspecao}>
                Copiar diagnóstico
              </Texto>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Aviso sobre a página, em ferrugem: fundo suave, borda da cor e texto no token de texto pequeno. */
function FaixaDeAviso({ texto }: { texto: string }) {
  const { cor } = useTema();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.faixaDeAviso, { backgroundColor: cor("cor-barro-suave"), borderColor: cor("cor-barro") }]}
    >
      <Texto tipo="apoio" cor="cor-barro-texto" style={styles.textoDoAviso}>
        {texto}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  // Quadro 4:3 com a borda de `.ed-card` (index.html, linha 1922).
  quadro: {
    width: "100%",
    aspectRatio: 4 / 3,
    minHeight: 240,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  quadroAmpliado: {
    aspectRatio: undefined,
    height: 480,
  },
  faixaDeAviso: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 11,
    borderWidth: 1,
  },
  textoDoAviso: {
    fontWeight: "600",
  },
  pagina: {
    flex: 1,
  },
  botaoDeInspecao: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
  },
  diagnostico: {
    gap: 2,
  },
  textoDoDiagnostico: {
    fontFamily: "JetBrainsMono",
    fontSize: 10.5,
    lineHeight: 14,
  },
  textoDeInspecao: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
