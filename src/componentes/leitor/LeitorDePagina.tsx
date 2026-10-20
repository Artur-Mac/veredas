import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { type LeituraParcial, type Portal } from "../../dados/contratos";
import { chavesDoAnuncio } from "../../dados/extrator/estado";
import { esquemaColetaDaPagina, lerPagina } from "../../dados/extrator/pagina";
import { Texto } from "../Texto";
import { SCRIPT_COLETOR } from "./coletor";
import {
  ESTADO_INICIAL_DO_LEITOR,
  proximoEstado,
  type EstadoDoLeitor,
  type EventoDoLeitor,
} from "./decidir";

export interface LeitorDePaginaProps {
  url: string;
  portal: Portal;
  idNoPortal: string | null;
  aoLer: (leituras: LeituraParcial[]) => void;
  aoFalhar: (motivo: "tempo" | "verificacao" | "erro") => void;
}

const DOMINIOS_PERMITIDOS: Record<Portal, string[]> = {
  zap: ["zapimoveis.com.br"],
  vivareal: ["vivareal.com.br"],
  quintoandar: ["quintoandar.com.br"],
  olx: ["olx.com.br"],
  outro: [],
};

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
    if (estadoRef.current.fase === "lido") return;
    despachar({
      tipo: "mensagem",
      leituras: lerPagina(coleta, portal, idNoPortal),
      verificacao: coleta.verificacao,
    });
  };

  const hostDoLink = hostDe(url);

  const permitirNavegacao = (pedido: string): boolean => {
    let analisado: URL;
    try {
      analisado = new URL(pedido);
    } catch {
      return false;
    }
    if (analisado.protocol !== "https:" && analisado.protocol !== "http:") return false;
    const host = analisado.hostname.toLowerCase();
    if (host === "challenges.cloudflare.com") return true;
    const permitidos = DOMINIOS_PERMITIDOS[portal];
    if (permitidos.length > 0) return permitidos.some((p) => host === p || host.endsWith(`.${p}`));
    return hostDoLink !== "" && (host === hostDoLink || host.endsWith(`.${hostDoLink}`));
  };

  const verificando = estado.fase === "verificando";
  // A página continua à vista, maior, enquanto a pessoa ainda pode completar a verificação.
  const ampliada = verificando || (estado.fase === "falhou" && estado.motivo === "verificacao");

  return (
    <View>
      {verificando ? (
        <View style={styles.faixaDeVerificacao}>
          <Texto tipo="apoio" style={styles.textoDeVerificacao}>
            O portal pediu uma verificação. Complete na página abaixo.
          </Texto>
        </View>
      ) : null}

      <View style={[styles.quadro, ampliada ? styles.quadroAmpliado : null]}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          injectedJavaScript={SCRIPT_COLETOR}
          onMessage={tratarMensagem}
          onError={() => despachar({ tipo: "erro" })}
          onShouldStartLoadWithRequest={(pedido) => permitirNavegacao(pedido.url)}
          setSupportMultipleWindows={false}
          thirdPartyCookiesEnabled={false}
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
          <Texto tipo="apoio" style={styles.textoDeInspecao}>
            Mapear chaves
          </Texto>
        </Pressable>
      ) : null}
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
    borderColor: "rgba(23, 23, 23, 0.09)",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  quadroAmpliado: {
    aspectRatio: undefined,
    height: 480,
  },
  faixaDeVerificacao: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 11,
    backgroundColor: "#F9EBE8",
    borderWidth: 1,
    borderColor: "#B94E36",
  },
  textoDeVerificacao: {
    color: "#9A341E",
    fontSize: 12,
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
  textoDeInspecao: {
    color: "#2E5A85",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
