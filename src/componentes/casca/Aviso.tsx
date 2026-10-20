// Aviso curto (toast) do app. O provedor mora na raiz (`src/app/_layout.tsx`), acima das rotas, para que qualquer tela,
// gaveta ou folha possa avisar ("+1 crédito", "Removido dos salvos") sem montar um provedor próprio.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, Platform, StyleSheet } from "react-native";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, comAlfa } from "../../tema/tokens";
import { Texto } from "../Texto";

type ContextoAviso = {
  mostrarAviso: (mensagem: string) => void;
};

const Contexto = createContext<ContextoAviso | null>(null);

/** Sem provedor acima (uma tela montada sozinha, num teste): avisar não faz nada. */
const SEM_PROVEDOR: ContextoAviso = { mostrarAviso: () => {} };

export function ProvedorDeAviso({ children }: { children: ReactNode }) {
  const { cor } = useTema();
  const [mensagem, setMensagem] = useState("");
  const [opacidade] = useState(() => new Animated.Value(0));

  // Desmontar a raiz (reinício do app) interrompe o aviso em andamento, sem tocar no estado de quem já saiu.
  useEffect(() => () => opacidade.stopAnimation(), [opacidade]);

  const mostrarAviso = useCallback(
    (texto: string) => {
      setMensagem(texto);
      opacidade.stopAnimation();
      opacidade.setValue(0);
      Animated.sequence([
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.delay(2600),
        Animated.timing(opacidade, {
          toValue: 0,
          duration: 220,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start(({ finished }) => {
        // Um aviso novo interrompe o anterior: só o que terminou sozinho apaga a mensagem.
        if (finished) setMensagem("");
      });
    },
    [opacidade],
  );

  const valor = useMemo(() => ({ mostrarAviso }), [mostrarAviso]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      {mensagem ? (
        <Animated.View
          role="status"
          aria-live="polite"
          pointerEvents="none"
          style={[
            styles.toast,
            {
              backgroundColor: cor("cor-campo"),
              boxShadow: `0 4px 12px ${comAlfa(cor("cor-campo"), 0.28)}`,
              opacity: opacidade,
            },
          ]}
        >
          <Texto tipo="apoio" cor="cor-texto-campo" style={styles.texto}>
            {mensagem}
          </Texto>
        </Animated.View>
      ) : null}
    </Contexto.Provider>
  );
}

export function useAviso(): ContextoAviso {
  return useContext(Contexto) ?? SEM_PROVEDOR;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 84,
    alignSelf: "center",
    paddingHorizontal: ESPACO[4],
    paddingVertical: ESPACO[2] + 2,
    borderRadius: RAIO.pilula,
    zIndex: 9999,
    elevation: 8,
    maxWidth: 420,
  },
  texto: {
    fontSize: 12.5,
    fontWeight: "500",
    textAlign: "center",
  },
});
