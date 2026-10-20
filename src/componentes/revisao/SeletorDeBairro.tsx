import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  bairroEscolhido,
  escolhaDeBairro,
  opcoesDeBairro,
  rotuloDoBairroEscolhido,
  type EstadoDoFormulario,
  type OpcaoDeBairro,
} from "../../dados/formulario";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { Texto } from "../Texto";
import { estilosDoTema } from "./estilosDoTema";

export interface SeletorDeBairroProps {
  estado: Pick<EstadoDoFormulario, "bairro" | "bairroTexto">;
  /** A pessoa escolheu: `bairro` é o slug (ou `FORA_DO_RECIFE`) e `bairroTexto`, o nome para mostrar e guardar. */
  aoEscolher: (escolha: { bairro: string; bairroTexto: string }) => void;
  desabilitado?: boolean;
}

/**
 * Seletor com busca dos bairros do Recife mais "Fora do Recife". Vem marcado pelo que a extração achou; a escolha
 * da pessoa é o que decide a cobertura (`coberturaDoFormulario`).
 */
export function SeletorDeBairro({ estado, aoEscolher, desabilitado = false }: SeletorDeBairroProps) {
  const { cor } = useTema();
  const styles = useEstilos();
  const [aberto, definirAberto] = useState(false);
  const [consulta, definirConsulta] = useState("");
  const opcoes = useMemo(() => opcoesDeBairro(consulta), [consulta]);
  const escolhido = bairroEscolhido(estado);
  const rotulo = rotuloDoBairroEscolhido(estado);

  const alternar = () => {
    if (desabilitado) return;
    definirAberto(!aberto);
    definirConsulta("");
  };

  const escolher = (opcao: OpcaoDeBairro) => {
    // Um bairro leva o nome oficial. "Fora do Recife" mantém o texto de bairro que o anúncio trouxe, só como informação.
    aoEscolher(escolhaDeBairro(estado, opcao.valor));
    definirAberto(false);
    definirConsulta("");
  };

  return (
    <View style={styles.campo}>
      <Texto tipo="etiqueta" style={styles.rotulo}>
        Bairro
      </Texto>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bairro"
        accessibilityValue={{ text: rotulo ?? "Nenhum escolhido" }}
        accessibilityState={{ expanded: aberto, disabled: desabilitado }}
        aria-expanded={aberto}
        disabled={desabilitado}
        onPress={alternar}
        style={[styles.gatilho, aberto ? styles.gatilhoAberto : null]}
      >
        <Texto tipo="corpo" numberOfLines={1} style={rotulo ? styles.textoEscolhido : styles.textoSemEscolha}>
          {rotulo ?? "Escolha o bairro"}
        </Texto>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={cor("cor-texto-apoio")} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <Path d={aberto ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
        </Svg>
      </Pressable>

      {aberto ? (
        <View style={styles.painel}>
          <TextInput
            autoFocus
            value={consulta}
            onChangeText={definirConsulta}
            placeholder="Buscar bairro"
            placeholderTextColor={cor("cor-texto-apoio")}
            accessibilityLabel="Buscar bairro"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.busca}
          />
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.lista}>
            {opcoes.length === 0 ? (
              <Texto tipo="apoio" style={styles.semResultado}>
                Nenhum bairro encontrado.
              </Texto>
            ) : (
              opcoes.map((opcao) => {
                const marcada = opcao.valor === escolhido;
                return (
                  <Pressable
                    key={opcao.valor}
                    accessibilityRole="button"
                    accessibilityLabel={opcao.rotulo}
                    accessibilityState={{ selected: marcada }}
                    aria-pressed={marcada}
                    onPress={() => escolher(opcao)}
                    style={[styles.opcao, marcada ? styles.opcaoMarcada : null]}
                  >
                    <Texto tipo="corpo" numberOfLines={1} style={[styles.textoOpcao, marcada ? styles.textoOpcaoMarcada : null]}>
                      {opcao.rotulo}
                    </Texto>
                    {opcao.coberto ? (
                      <View style={styles.etiquetaCadastro}>
                        <Texto tipo="apoio" style={styles.textoEtiquetaCadastro}>
                          com cadastro
                        </Texto>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

// Valores de index.html (.scanner-input-well 1512), com as cores sempre por token.
const useEstilos = estilosDoTema((cor) =>
  StyleSheet.create({
    campo: {
      gap: 5,
      minWidth: 0,
    },
    rotulo: {
      color: cor("cor-texto-apoio"),
      fontWeight: "600",
    },
    gatilho: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      minHeight: 46,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 10,
      backgroundColor: cor("cor-creme"),
    },
    gatilhoAberto: {
      backgroundColor: cor("cor-superficie"),
      borderColor: cor("cor-acao"),
      boxShadow: `0 0 0 3px ${comAlfa(cor("cor-acao"), 0.15)}`,
    },
    textoEscolhido: {
      flex: 1,
      color: cor("cor-texto"),
      fontSize: 14,
      fontWeight: "500",
    },
    textoSemEscolha: {
      flex: 1,
      color: cor("cor-texto-apoio"),
      fontSize: 14,
      fontWeight: "500",
    },
    painel: {
      gap: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
      borderRadius: 12,
      backgroundColor: cor("cor-superficie"),
    },
    busca: {
      minHeight: 42,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: cor("cor-creme"),
      color: cor("cor-texto"),
      fontFamily: "PlusJakartaSans",
      fontSize: 14,
      fontWeight: "500",
      outlineWidth: 0,
    },
    lista: {
      maxHeight: 232,
    },
    opcao: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    opcaoMarcada: {
      backgroundColor: cor("cor-creme"),
    },
    textoOpcao: {
      flex: 1,
      color: cor("cor-texto"),
      fontSize: 14,
      fontWeight: "500",
    },
    textoOpcaoMarcada: {
      fontWeight: "700",
    },
    etiquetaCadastro: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: cor("cor-salvia-suave"),
    },
    textoEtiquetaCadastro: {
      color: cor("cor-salvia-escura"),
      fontSize: 10.5,
      lineHeight: 14,
      fontWeight: "600",
    },
    semResultado: {
      color: cor("cor-texto-apoio"),
      paddingVertical: 12,
      paddingHorizontal: 10,
    },
  }),
);
