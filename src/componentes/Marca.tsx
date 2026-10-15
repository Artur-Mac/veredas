import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";
import { useTema } from "../tema/Tema";
import { desenhoDaPalavra, desenhoDoSimbolo, desenhoDoSimboloPequeno } from "./desenhoDaMarca";

export function Logotipo({ altura = 24 }: { altura?: number }) {
  const { cor } = useTema();
  return (
    <Svg width={(altura * 323) / 84} height={altura} viewBox="0 0 323 84" accessibilityLabel="Vereda" role="img">
      <Path d={desenhoDoSimbolo} fill={cor("cor-barro")} fillRule="evenodd" />
      <Path d={desenhoDaPalavra} fill={cor("cor-texto")} />
    </Svg>
  );
}

export function Simbolo({ largura }: { largura: number }) {
  const { cor } = useTema();
  return (
    <Svg width={largura} height={(largura * 83) / 99} viewBox="0 0 99 83" aria-hidden>
      <Path d={largura <= 24 ? desenhoDoSimboloPequeno : desenhoDoSimbolo} fill={cor("cor-barro")} fillRule="evenodd" />
    </Svg>
  );
}

const QUADRA: [number, number][] = [
  [22, 8], [62, 8], [102, 8],
  [22, 42], [102, 42],
  [22, 76], [62, 76], [102, 76],
];

export function KvMini() {
  const { cor } = useTema();
  return (
    <Svg width={128} height={104} viewBox="0 0 160 130" aria-hidden>
      <G transform="rotate(-8 80 50)">
        {QUADRA.map(([x, y]) => (
          <Rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={36}
            height={30}
            fill="none"
            stroke={cor("crime-3")}
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />
        ))}
      </G>
      <G transform="rotate(-8 80 50)">
        <Rect
          x={62}
          y={42}
          width={36}
          height={30}
          fill={cor("cor-azul-cadastral")}
          fillOpacity={0.12}
          stroke={cor("cor-azul-cadastral")}
          strokeWidth={2}
        />
        <Path fill={cor("cor-barro")} fillRule="evenodd" transform="translate(70 47) scale(0.21)" d={desenhoDoSimbolo} />
      </G>
      <Line x1={80} y1={74} x2={80} y2={112} stroke={cor("cor-barro")} strokeWidth={1.5} strokeDasharray="3 3" />
      <Rect x={8} y={114} width={144} height={6} rx={3} fill={cor("cor-linha")} />
      <Rect x={52} y={114} width={56} height={6} rx={3} fill={cor("cor-faixa-regua")} />
      <Line x1={72} y1={111} x2={72} y2={123} stroke={cor("cor-traco")} strokeWidth={1.5} />
      <Circle cx={80} cy={117} r={6} fill={cor("cor-barro")} stroke={cor("cor-superficie")} strokeWidth={2} />
    </Svg>
  );
}
