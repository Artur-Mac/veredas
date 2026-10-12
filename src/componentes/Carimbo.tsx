import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Polygon, Rect } from 'react-native-svg';

import type { Categoria } from '@/dominio/esquema';
import { rotuloCategoria } from '@/textos/rotulos';
import type { Paleta } from '@/tema/cores';
import { useTema } from '@/tema/TemaProvider';

import { Texto, type Tom } from './Texto';

export function corDaCategoria(categoria: Categoria, paleta: Paleta): { cor: string; fundo: string; tom: Tom } {
  switch (categoria) {
    case 'registro_oficial':
      return { cor: paleta.azulejo, fundo: paleta.azulejoFundo, tom: 'azulejo' };
    case 'observacao_direta':
      return { cor: paleta.mare, fundo: paleta.mareFundo, tom: 'mare' };
    case 'declarado_anunciante':
      return { cor: paleta.jambo, fundo: paleta.jamboFundo, tom: 'jambo' };
    case 'inconsistencia':
      return { cor: paleta.tinta, fundo: 'transparent', tom: 'tinta' };
    case 'desconhecido':
    case 'precisa_especialista':
      return { cor: paleta.grafite, fundo: 'transparent', tom: 'grafite' };
  }
}

export function useIdSvg(prefixo: string): string {
  return `${prefixo}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

export function Hachura({ cor, opacidade = 0.28 }: { cor: string; opacidade?: number }) {
  const id = useIdSvg('hachura');
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id={id} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Line x1={0} y1={0} x2={0} y2={6} stroke={cor} strokeWidth={1.4} opacity={opacidade} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export function SinalCategoria({ categoria, tamanho = 12 }: { categoria: Categoria; tamanho?: number }) {
  const { paleta } = useTema();
  const { cor } = corDaCategoria(categoria, paleta);
  const meio = tamanho / 2;
  return (
    <Svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
      {categoria === 'registro_oficial' ? <Rect x={1} y={1} width={tamanho - 2} height={tamanho - 2} fill={cor} /> : null}
      {categoria === 'observacao_direta' ? <Circle cx={meio} cy={meio} r={meio - 1} fill={cor} /> : null}
      {categoria === 'declarado_anunciante' ? (
        <Polygon points={`${meio},0.5 ${tamanho - 0.5},${meio} ${meio},${tamanho - 0.5} 0.5,${meio}`} fill={cor} />
      ) : null}
      {categoria === 'inconsistencia' ? (
        <>
          <Rect x={0.75} y={0.75} width={tamanho * 0.62} height={tamanho * 0.62} fill="none" stroke={cor} strokeWidth={1.3} />
          <Rect
            x={tamanho * 0.38 - 0.75}
            y={tamanho * 0.38 - 0.75}
            width={tamanho * 0.62}
            height={tamanho * 0.62}
            fill="none"
            stroke={cor}
            strokeWidth={1.3}
          />
        </>
      ) : null}
      {categoria === 'desconhecido' ? (
        <Circle cx={meio} cy={meio} r={meio - 1} fill="none" stroke={cor} strokeWidth={1.3} strokeDasharray="2 1.6" />
      ) : null}
      {categoria === 'precisa_especialista' ? (
        <>
          <Circle cx={meio} cy={meio} r={meio - 0.8} fill="none" stroke={cor} strokeWidth={1.1} />
          <Circle cx={meio} cy={meio} r={meio - 3.4} fill="none" stroke={cor} strokeWidth={1.1} />
        </>
      ) : null}
    </Svg>
  );
}

export function Carimbo({ categoria }: { categoria: Categoria }) {
  const { paleta } = useTema();
  const { cor, fundo, tom } = corDaCategoria(categoria, paleta);
  const tracejado = categoria === 'desconhecido';
  const duplo = categoria === 'precisa_especialista';
  const conteudo = (
    <View
      style={[
        estilos.carimbo,
        { borderColor: cor, backgroundColor: fundo, borderStyle: tracejado ? 'dashed' : 'solid' },
        duplo ? estilos.interno : null,
      ]}
    >
      {categoria === 'inconsistencia' ? <Hachura cor={paleta.tinta} opacidade={0.18} /> : null}
      <SinalCategoria categoria={categoria} tamanho={10} />
      <Texto variante="carimbo" tom={tom}>
        {rotuloCategoria[categoria]}
      </Texto>
    </View>
  );
  if (!duplo) {
    return conteudo;
  }
  return <View style={[estilos.externo, { borderColor: cor }]}>{conteudo}</View>;
}

const estilos = StyleSheet.create({
  carimbo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1.2,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  externo: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 5,
    padding: 2,
  },
  interno: {
    borderWidth: 1,
  },
});
