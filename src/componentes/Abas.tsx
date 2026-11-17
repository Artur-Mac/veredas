import { router } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO } from "../tema/tokens";
import { Icone } from "./Icone";
import type { NomeIcone } from "./icones";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

export type IdDaAba = "dossie" | "mapa" | "visita" | "meus";

const ITENS: { id: IdDaAba; nome: string; icone: NomeIcone }[] = [
  { id: "dossie", nome: "Dossiê", icone: "file-text" },
  { id: "mapa", nome: "Mapa", icone: "map" },
  { id: "visita", nome: "Visita", icone: "clipboard-check" },
  { id: "meus", nome: "Meus dossiês", icone: "folders" },
];

type Props = { atual: IdDaAba; aoEscolher: (aba: IdDaAba) => void };

export function Abas({ atual, aoEscolher }: Props) {
  const { cor } = useTema();
  const insets = useSafeAreaInsets();
  return (
    <View
      role="tablist"
      accessibilityLabel="Abas"
      style={{
        flexDirection: "row",
        backgroundColor: cor("cor-superficie"),
        paddingTop: ESPACO[1],
        paddingHorizontal: ESPACO[2],
        paddingBottom: ESPACO[2] + insets.bottom,
        borderTopWidth: 0.5,
        borderTopColor: cor("cor-linha"),
      }}
    >
      {ITENS.map((item) => {
        const ativa = item.id === atual;
        return (
          <Pressionavel
            key={item.id}
            role="tab"
            accessibilityLabel={item.nome}
            accessibilityState={{ selected: ativa }}
            aria-selected={ativa}
            onPress={() => aoEscolher(item.id)}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 2, minHeight: 56, borderRadius: RAIO.cartao }}
          >
            <View
              style={{
                width: 56,
                height: 28,
                borderRadius: RAIO.pilula,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: ativa ? cor("cor-nota") : undefined,
              }}
            >
              <Icone nome={item.icone} cor={ativa ? "cor-texto" : "cor-texto-apoio"} />
            </View>
            <Texto tipo="apoio" cor={ativa ? "cor-texto" : "cor-texto-apoio"} numberOfLines={1}>
              {item.nome}
            </Texto>
          </Pressionavel>
        );
      })}
    </View>
  );
}

export function AbasForaDoDossie({ idDossie }: { idDossie: string }) {
  return (
    <Abas
      atual="dossie"
      aoEscolher={(aba) => {
        if (aba === "meus") router.dismissTo("/");
        else if (aba === "dossie") router.dismissTo({ pathname: "/exemplos/[id]", params: { id: idDossie } });
        else if (aba === "mapa") router.dismissTo({ pathname: "/exemplos/[id]/mapa", params: { id: idDossie } });
        else router.dismissTo({ pathname: "/exemplos/[id]/visita", params: { id: idDossie } });
      }}
    />
  );
}
