import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { useTema } from '@/tema/TemaProvider';

import { useIdSvg } from './Carimbo';

const passo = 24;

export function GradeDeLevantamento() {
  const { paleta } = useTema();
  const idFina = useIdSvg('grade-fina');
  const idCruz = useIdSvg('grade-cruz');
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={idFina} width={passo} height={passo} patternUnits="userSpaceOnUse">
            <Line x1={0} y1={0} x2={passo} y2={0} stroke={paleta.grade} strokeWidth={1} />
            <Line x1={0} y1={0} x2={0} y2={passo} stroke={paleta.grade} strokeWidth={1} />
          </Pattern>
          <Pattern id={idCruz} width={passo * 5} height={passo * 5} patternUnits="userSpaceOnUse">
            <Line x1={0} y1={0} x2={5} y2={0} stroke={paleta.linhaForte} strokeWidth={1} />
            <Line x1={0} y1={0} x2={0} y2={5} stroke={paleta.linhaForte} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${idFina})`} />
        <Rect width="100%" height="100%" fill={`url(#${idCruz})`} opacity={0.7} />
      </Svg>
    </View>
  );
}
