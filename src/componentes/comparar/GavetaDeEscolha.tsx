// Gaveta com uma lista de análises para escolher uma (o `<select>` de `.vc-home` e o "Escolher para visitar"
// de index.html). Reaproveita a gaveta da casca: puxador, Esc e arraste.
import { View } from "react-native";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { Icone } from "../Icone";
import { Gaveta } from "../casca/Gaveta";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";

export type OpcaoDeEscolha = { id: string; titulo: string; detalhe: string; marcada: boolean };

type Props = {
  visivel: boolean;
  titulo: string;
  subtitulo?: string;
  opcoes: readonly OpcaoDeEscolha[];
  aoEscolher: (id: string) => void;
  aoFechar: () => void;
};

export function GavetaDeEscolha({ visivel, titulo, subtitulo, opcoes, aoEscolher, aoFechar }: Props) {
  const { cor } = useTema();
  return (
    <Gaveta visivel={visivel} titulo={titulo} subtitulo={subtitulo} aoFechar={aoFechar}>
      <View role="radiogroup" aria-label={titulo} style={{ paddingTop: 8 }}>
        {opcoes.map((o, i) => (
          <Pressionavel
            key={o.id}
            role="radio"
            aria-checked={o.marcada}
            accessibilityState={{ checked: o.marcada }}
            accessibilityLabel={`${o.titulo}. ${o.detalhe}`}
            onPress={() => aoEscolher(o.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              minHeight: 56,
              paddingVertical: 10,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: comAlfa(cor("cor-texto"), 0.07),
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Texto tipo="secao" style={{ fontWeight: "600" }} numberOfLines={2}>
                {o.titulo}
              </Texto>
              {o.detalhe ? (
                <Texto tipo="apoio" cor="cor-texto-apoio" numberOfLines={2}>
                  {o.detalhe}
                </Texto>
              ) : null}
            </View>
            {o.marcada ? <Icone nome="check" tamanho="m" cor="cor-salvia-escura" /> : null}
          </Pressionavel>
        ))}
      </View>
    </Gaveta>
  );
}
