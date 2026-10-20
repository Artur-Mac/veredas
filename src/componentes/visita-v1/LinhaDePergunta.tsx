// `.vv-question` de index.html (CSS 3166–3182): linha de pergunta do roteiro, numerada em "Preparar" e com
// caixa de conferência em "No imóvel". O título abre o campo de resposta; a caixa só confere.
import { View } from "react-native";
import type { Pergunta } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { ESPACO, TOQUE_MINIMO } from "../../tema/tokens";
import { Icone } from "../Icone";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Seta } from "./blocos";

type Props = {
  pergunta: Pergunta;
  /** Posição no roteiro, começando em 1; vira o "01", "02"… quando a linha não é conferível. */
  numero?: number;
  conferida: boolean;
  /** Resposta anotada: aparece no lugar da pista. */
  resposta?: string;
  /** Com `aoConferir`, a linha leva a caixa de conferência no lugar do número. */
  aoConferir?: () => void;
  aoAbrir: () => void;
};

export function LinhaDePergunta({ pergunta, numero, conferida, resposta, aoConferir, aoAbrir }: Props) {
  const { cor, escuro } = useTema();
  const apoio = resposta && resposta.trim() !== "" ? resposta.trim() : pergunta.pista;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: ESPACO[3], paddingVertical: 13 }}>
      {aoConferir ? (
        <Pressionavel
          role="checkbox"
          accessibilityLabel={`Conferida: ${pergunta.titulo}`}
          accessibilityState={{ checked: conferida }}
          aria-checked={conferida}
          onPress={aoConferir}
          style={{ width: TOQUE_MINIMO, height: TOQUE_MINIMO, alignItems: "center", justifyContent: "center", borderRadius: 24 }}
        >
          <View
            style={{
              width: 25,
              height: 25,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: conferida ? cor("cor-salvia") : cor("cor-traco"),
              backgroundColor: conferida ? cor("cor-salvia") : undefined,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {conferida ? <Icone nome="check" tamanho="p" cor={escuro ? "cor-campo" : "cor-superficie"} /> : null}
          </View>
        </Pressionavel>
      ) : (
        <Texto
          tipo="apoio"
          cor="cor-barro-texto"
          style={{ width: 18, paddingTop: 5, fontSize: 12, fontWeight: "500", flexShrink: 0 }}
        >
          {String(numero ?? 0).padStart(2, "0")}
        </Texto>
      )}
      <Pressionavel
        accessibilityRole="button"
        accessibilityLabel={`${pergunta.titulo}. ${apoio}`}
        accessibilityHint="Abre o campo para anotar a resposta"
        onPress={aoAbrir}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: TOQUE_MINIMO,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: ESPACO[3],
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Texto
            cor={conferida ? "cor-salvia-escura" : "cor-texto"}
            style={{ fontSize: 16, lineHeight: 23, fontWeight: "600", letterSpacing: -0.4 }}
          >
            {pergunta.titulo}
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" numberOfLines={2} style={{ fontSize: 11, lineHeight: 17, marginTop: 5 }}>
            {apoio}
          </Texto>
        </View>
        <Seta tamanho={15} />
      </Pressionavel>
    </View>
  );
}
