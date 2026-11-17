import { router, usePathname } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";
import { useTema } from "../../tema/Tema";
import { TOQUE_MINIMO, comAlfa } from "../../tema/tokens";
import { AlvoDeToque } from "../Pressionavel";
import { Texto } from "../Texto";
import { Coluna } from "./Coluna";

export interface ItemDock {
  id: string;
  nome: string;
  rota: string;
  icone: (ativo: boolean) => React.ReactNode;
}

export function DockInferior() {
  const insets = useSafeAreaInsets();
  const rotaAtual = usePathname();
  const { cor } = useTema();

  const eAtivo = (rota: string) => {
    if (rota === "/" && (rotaAtual === "/" || rotaAtual === "/index" || rotaAtual.startsWith("/ler") || rotaAtual.startsWith("/predio") || rotaAtual.startsWith("/receber"))) {
      return true;
    }
    if (rota === "/dossie" && rotaAtual.startsWith("/dossie")) return true;
    if (rota === "/comparar" && (rotaAtual.startsWith("/comparar") || rotaAtual.startsWith("/salvos"))) return true;
    if (rota === "/visita" && rotaAtual.startsWith("/visita")) return true;
    return false;
  };

  const itens: ItemDock[] = [
    {
      id: "explore",
      nome: "Explorar",
      rota: "/",
      icone: (ativo) => (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={ativo ? cor("cor-acao") : cor("cor-texto-apoio")} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="11" cy="11" r="7.5" />
          <Path d="m20 20-3.8-3.8" />
        </Svg>
      ),
    },
    {
      id: "dossier",
      nome: "Dossiê",
      rota: "/dossie",
      icone: (ativo) => (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={ativo ? cor("cor-acao") : cor("cor-texto-apoio")} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <Path d="M14 2v6h6" />
          <Line x1="8" y1="13" x2="16" y2="13" />
          <Line x1="8" y1="17" x2="13" y2="17" />
        </Svg>
      ),
    },
    {
      id: "compare",
      nome: "Comparar",
      rota: "/comparar",
      icone: (ativo) => (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={ativo ? cor("cor-acao") : cor("cor-texto-apoio")} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="4" width="7" height="16" rx="1.5" />
          <Rect x="14" y="4" width="7" height="16" rx="1.5" />
        </Svg>
      ),
    },
    {
      id: "visit",
      nome: "Visita",
      rota: "/visita",
      icone: (ativo) => (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={ativo ? cor("cor-acao") : cor("cor-texto-apoio")} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" />
          <Polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" fill={ativo ? cor("cor-acao") : "none"} />
        </Svg>
      ),
    },
  ];

  return (
    <View
      style={[
        styles.dock,
        {
          paddingBottom: Math.max(10, insets.bottom),
          backgroundColor: comAlfa(cor("cor-papel-claro"), 0.94),
          borderTopColor: comAlfa(cor("cor-texto"), 0.08),
        },
      ]}
    >
      {/* A faixa vai de ponta a ponta; as quatro abas ficam na coluna do app. */}
      <Coluna style={styles.abas}>
        {itens.map((item) => {
          const ativo = eAtivo(item.rota);
          return (
            <AlvoDeToque
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativo }}
              aria-selected={ativo}
              accessibilityLabel={item.nome}
              onPress={() => router.push(item.rota as any)}
              style={styles.dockItem}
            >
              {ativo ? <View style={[styles.tracoAtivo, { backgroundColor: cor("cor-acao") }]} /> : null}
              {item.icone(ativo)}
              <Texto
                tipo="apoio"
                style={[
                  styles.rotulo,
                  {
                    color: ativo ? cor("cor-texto") : cor("cor-texto-apoio"),
                    fontWeight: ativo ? "600" : "500",
                  },
                ]}
              >
                {item.nome}
              </Texto>
            </AlvoDeToque>
          );
        })}
      </Coluna>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    borderTopWidth: 1,
    paddingTop: 8,
    position: "relative",
    zIndex: 55,
  },
  abas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  dockItem: {
    flex: 1,
    minHeight: TOQUE_MINIMO,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
    position: "relative",
  },
  tracoAtivo: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 2,
    borderRadius: 2,
  },
  rotulo: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
