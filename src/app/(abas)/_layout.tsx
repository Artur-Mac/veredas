import { Tabs } from "expo-router";
import React from "react";
import { CabecalhoDoApp } from "../../componentes/casca/CabecalhoDoApp";
import { DockInferior } from "../../componentes/casca/DockInferior";
import { useTema } from "../../tema/Tema";

export default function LayoutAbas() {
  const { cor } = useTema();

  return (
    <Tabs
      tabBar={() => <DockInferior />}
      screenOptions={{
        header: () => <CabecalhoDoApp />,
        sceneStyle: { backgroundColor: cor("cor-fundo") },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Explorar" }} />
      <Tabs.Screen name="dossie" options={{ title: "Dossiê" }} />
      <Tabs.Screen name="comparar" options={{ title: "Comparar" }} />
      <Tabs.Screen name="visita" options={{ title: "Visita" }} />
      <Tabs.Screen name="ler" options={{ href: null }} />
      <Tabs.Screen name="predio" options={{ href: null }} />
      <Tabs.Screen name="salvos" options={{ href: null }} />
      <Tabs.Screen name="receber" options={{ href: null }} />
    </Tabs>
  );
}
