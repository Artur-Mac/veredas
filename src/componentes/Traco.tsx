import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import type { Rotulo } from "../dados/esquema";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO } from "../tema/tokens";
import { Texto } from "./Texto";

export function Traco({ rotulo }: { rotulo: Rotulo }) {
  const { cor } = useTema();
  const texto = cor("cor-texto");
  if (rotulo === "inferencia") {
    return (
      <Svg width={16} height={6} viewBox="0 0 16 6" aria-hidden>
        {[-4, -1, 2, 5, 8, 11, 14, 17].map((x) => (
          <Line key={x} x1={x} y1={6} x2={x + 6} y2={0} stroke={texto} strokeWidth={1} />
        ))}
      </Svg>
    );
  }
  const traco =
    rotulo === "registro_oficial"
      ? { stroke: cor("cor-azul-cadastral"), dash: undefined }
      : rotulo === "declarado"
        ? { stroke: texto, dash: "4 3" }
        : { stroke: texto, dash: "1 3" };
  return (
    <Svg width={16} height={2} viewBox="0 0 16 2" aria-hidden>
      <Line x1={0} y1={1} x2={16} y2={1} stroke={traco.stroke} strokeWidth={2} strokeDasharray={traco.dash} />
    </Svg>
  );
}

export function NaoSabemos() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
      <Traco rotulo="nao_sabemos" />
      <Texto>não sabemos</Texto>
    </View>
  );
}

export function Bloco({ largura = "100%", alto = false }: { largura?: number | `${number}%`; alto?: boolean }) {
  const { cor } = useTema();
  return (
    <View
      aria-hidden
      style={{ width: largura, height: alto ? 32 : 16, borderRadius: 6, backgroundColor: cor("cor-linha") }}
    />
  );
}

export function QuadradoDeCor({ corLivre }: { corLivre: string }) {
  return <View aria-hidden style={{ width: 16, height: 16, borderRadius: RAIO.quadrado / 2, backgroundColor: corLivre }} />;
}
