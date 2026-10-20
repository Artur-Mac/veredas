import { Tabs, router } from "expo-router";
import { Abas, type IdDaAba } from "../../../../componentes/Abas";
import { useDossie } from "../../../../navegacao/useDossie";

const ABA_DA_ROTA: Record<string, IdDaAba> = { index: "dossie", mapa: "mapa", visita: "visita" };
const ROTA_DA_ABA: Record<Exclude<IdDaAba, "meus">, string> = { dossie: "index", mapa: "mapa", visita: "visita" };

export default function AbasDoDossie() {
  const { id } = useDossie();
  return (
    <Tabs
      backBehavior="firstRoute"
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const atual = state.routes[state.index]?.name ?? "index";
        return (
          <Abas
            atual={ABA_DA_ROTA[atual] ?? "dossie"}
            aoEscolher={(aba) => {
              if (aba === "meus") router.dismissTo("/");
              else navigation.navigate(ROTA_DA_ABA[aba], { id });
            }}
          />
        );
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dossiê" }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa" }} />
      <Tabs.Screen name="visita" options={{ title: "Visita" }} />
    </Tabs>
  );
}
