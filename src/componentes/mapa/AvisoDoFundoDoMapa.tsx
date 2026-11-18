// O que o mapa diz quando o fundo (ruas, quadras, lotes) ainda não chegou ou não pôde ser carregado. O mapa em si
// continua na tela, como era antes do fundo: nada aqui esconde o lote, o pino ou as obras.
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import type { EstadoDoFundo } from "./useFundoDoMapa";

type Props = {
  estado: EstadoDoFundo;
  tentarDeNovo: () => void;
  style?: StyleProp<ViewStyle>;
  /** O que completa a frase da falha (o que continua valendo no mapa). Padrão: "O lote e os pontos continuam valendo.". */
  oQueContinua?: string;
};

/** Uma linha discreta enquanto carrega; a falha dita em claro, com "Tentar de novo". Nada nos outros estados. */
export function AvisoDoFundoDoMapa({ estado, tentarDeNovo, style, oQueContinua = "O lote e os pontos continuam valendo." }: Props) {
  if (estado === "carregando") {
    return (
      <View style={style}>
        <Texto role="status" tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          Carregando ruas e quadras…
        </Texto>
      </View>
    );
  }
  if (estado !== "falhou") return null;
  return (
    <View style={[{ gap: 6, alignItems: "flex-start" }, style]}>
      <Texto role="alert" tipo="apoio" style={{ fontSize: 12.5, lineHeight: 18 }}>
        {`Não foi possível carregar as ruas e quadras deste mapa. ${oQueContinua}`}
      </Texto>
      <Botao rotulo="Tentar de novo" variante="secundario" onPress={tentarDeNovo} />
    </View>
  );
}
