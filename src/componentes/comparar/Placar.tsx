// Placar do Comparar (15/11/2026): quem ganha em cada seção e por quanto; um toque abre a aba com o detalhe.
import { View } from "react-native";
import type { Topico } from "./comparar";
import type { LinhaDoPlacar } from "./placar";
import { useTema } from "../../tema/Tema";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Seta } from "../dossie-v1/base";

export function PlacarDoPar({ linhas, rotulos, aoAbrir }: { linhas: readonly LinhaDoPlacar[]; rotulos: readonly [string, string]; aoAbrir: (t: Topico) => void }) {
  const { cor } = useTema();
  if (!linhas.length) return null;
  return (
    <View role="group" aria-label="Quem ganha em cada parte" style={{ borderRadius: 16, borderWidth: 1, borderColor: cor("cor-linha"), backgroundColor: cor("cor-superficie"), overflow: "hidden" }}>
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
        <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 11.5, lineHeight: 16, fontWeight: "700" }}>Quem ganha em cada parte</Texto>
      </View>
      {linhas.map((l, i) => (
        <Pressionavel key={l.id} onPress={() => aoAbrir(l.topico)} accessibilityRole="button"
          accessibilityLabel={`${l.secao}: ${l.vencedor === null ? "empate ou sem dado" : `ganha ${rotulos[l.vencedor]}`}. ${l.frase} Ver detalhe`}
          style={{ minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: cor("cor-linha"), flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 19, fontWeight: "600" }}>{l.secao}</Texto>
              <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, backgroundColor: cor(l.vencedor === null ? "cor-creme" : "cor-salvia-suave") }}>
                <Texto tipo="apoio" cor={l.vencedor === null ? "cor-texto-apoio" : "cor-salvia-escura"} style={{ fontSize: 11, lineHeight: 15, fontWeight: "700" }}>
                  {l.vencedor === null ? "Empate" : rotulos[l.vencedor]}
                </Texto>
              </View>
            </View>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5, lineHeight: 17 }}>{l.frase}</Texto>
          </View>
          <Seta tamanho={12} />
        </Pressionavel>
      ))}
    </View>
  );
}
