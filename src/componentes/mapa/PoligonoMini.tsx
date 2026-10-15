import Svg, { Path } from "react-native-svg";
import type { Dossie } from "../../dados/esquema";
import { useTema } from "../../tema/Tema";
import { caminho, geometria, poligonoNaCaixa } from "./geometria";

export function PoligonoMini({ dossie, confirmado }: { dossie: Dossie; confirmado: boolean }) {
  const { cor } = useTema();
  const lote = geometria(dossie.id).lotes[0];
  if (!lote) throw new Error(`Geometria sem lote para ${dossie.id}`);
  const d = caminho(poligonoNaCaixa(lote, 34, 26, 3));
  return (
    <Svg width={40} height={32} viewBox="0 0 40 32" aria-hidden>
      {confirmado ? (
        <Path d={d} fill={cor("cor-azul-cadastral")} fillOpacity={0.18} stroke={cor("cor-azul-cadastral")} strokeWidth={1.5} strokeLinejoin="round" />
      ) : (
        <Path d={d} fill="none" stroke={cor("cor-traco")} strokeWidth={1.5} strokeDasharray="3 3" strokeLinejoin="round" />
      )}
    </Svg>
  );
}
