// Cabeçalho do app (`.top-header-minimal`, index.html 1256–1272 e 3195–3262): marca, pílula de créditos e menu.
// Tudo aqui leva a uma rota de verdade: a marca abre o início, a pílula abre a carteira (/creditos) e o menu leva às
// telas do app. Nenhum texto de tela mora no cabeçalho.
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { useCarteira } from "../../estado/Carteira";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO, comAlfa } from "../../tema/tokens";
import { desenhoDoSimbolo } from "../desenhoDaMarca";
import { Texto } from "../Texto";
import { MenuRapido } from "./MenuRapido";

/** "1 crédito", "3 créditos". */
export function rotuloDeCreditos(saldo: number): string {
  return `${saldo} ${saldo === 1 ? "crédito" : "créditos"}`;
}

export function CabecalhoDoApp() {
  const { cor } = useTema();
  const { saldo, pronto } = useCarteira();
  const [menuAberto, setMenuAberto] = useState(false);
  // Antes de ler a carteira o saldo ainda é o inicial de mentira: melhor um traço do que um número que pode estar errado.
  const rotulo = pronto ? rotuloDeCreditos(saldo) : "— créditos";

  return (
    <View style={[styles.cabecalho, { backgroundColor: cor("cor-fundo"), borderBottomColor: comAlfa(cor("cor-texto"), 0.08) }]}>
      {/* `.brand-lockup`: ninho do João-de-barro e VEREDA em Fraunces 500, com 0,18em de espaçamento. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Início Vereda"
        onPress={() => router.push("/")}
        style={styles.marca}
      >
        <Svg width={24} height={24} viewBox="0 0 100 100" fill="none" aria-hidden>
          <Path d={desenhoDoSimbolo} fill={cor("cor-acao")} fillRule="evenodd" />
        </Svg>
        <Texto tipo="titulo-tela" style={styles.nomeDaMarca}>
          VEREDA
        </Texto>
      </Pressable>

      <View style={styles.acoes}>
        {/* `.credits-pill-btn`: o alvo de toque tem 44 px de altura; a pílula desenhada por dentro mantém os 28 px do protótipo. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pronto ? `Carteira de créditos: ${rotulo}` : "Carteira de créditos"}
          onPress={() => router.push("/creditos")}
          style={styles.alvoDaPilula}
        >
          {({ pressed }) => (
            <View
              style={[
                styles.pilula,
                {
                  backgroundColor: pressed ? cor("cor-superficie") : cor("cor-creme"),
                  borderColor: comAlfa(cor("cor-texto"), 0.11),
                },
              ]}
            >
              <View style={[styles.ponto, { backgroundColor: cor("cor-acao") }]} />
              <Texto tipo="apoio" style={styles.textoDaPilula}>
                {rotulo}
              </Texto>
            </View>
          )}
        </Pressable>

        {/* `.icon-only-toggle`: 36 px desenhados dentro de um alvo de 44 px. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu de navegação"
          accessibilityState={{ expanded: menuAberto }}
          aria-expanded={menuAberto}
          onPress={() => setMenuAberto((antes) => !antes)}
          style={styles.alvoDoMenu}
        >
          {({ pressed }) => (
            <View
              style={[
                styles.botaoDoMenu,
                {
                  backgroundColor: pressed || menuAberto ? cor("cor-superficie") : comAlfa(cor("cor-superficie"), 0.65),
                  borderColor: comAlfa(cor("cor-texto"), 0.11),
                },
              ]}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={cor("cor-texto")} strokeWidth={1.7} strokeLinecap="round" aria-hidden>
                <Line x1="4" y1="7" x2="20" y2="7" />
                <Line x1="4" y1="12" x2="20" y2="12" />
                <Line x1="4" y1="17" x2="20" y2="17" />
              </Svg>
            </View>
          )}
        </Pressable>
      </View>

      <MenuRapido aberto={menuAberto} aoFechar={() => setMenuAberto(false)} saldo={pronto ? saldo : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // O menu desenha 36 px dentro de 48 px de alvo: com 10 px aqui, a borda visível fica a 16 px da lateral.
    paddingLeft: 16,
    paddingRight: 10,
    borderBottomWidth: 1,
    zIndex: 60,
  },
  marca: {
    minHeight: TOQUE_MINIMO,
    minWidth: TOQUE_MINIMO,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 8,
  },
  nomeDaMarca: {
    fontSize: 19,
    lineHeight: 22,
    fontWeight: "500",
    letterSpacing: 3.42, // 0,18em de 19 px
  },
  acoes: {
    flexDirection: "row",
    alignItems: "center",
  },
  alvoDaPilula: {
    minHeight: TOQUE_MINIMO,
    minWidth: TOQUE_MINIMO,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  pilula: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RAIO.pilula,
    borderWidth: 1,
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Plus Jakarta Sans 600, números alinhados (`.credits-pill-btn`, index.html 2380–2409); não é mono.
  textoDaPilula: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "600",
  },
  alvoDoMenu: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoDoMenu: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
  },
});
