import { StyleSheet, Text, type TextProps } from 'react-native';

import type { Paleta } from '@/tema/cores';
import { useTema } from '@/tema/TemaProvider';
import { escala, familias } from '@/tema/tipografia';

export type Variante =
  | 'marca'
  | 'titulo'
  | 'subtitulo'
  | 'destaque'
  | 'corpo'
  | 'corpoForte'
  | 'pequeno'
  | 'rotulo'
  | 'dado'
  | 'dadoGrande';

export type Tom = keyof Pick<
  Paleta,
  'tinta' | 'tintaSuave' | 'tintaFraca' | 'azulejo' | 'mare' | 'jambo' | 'grafite' | 'sobreTinta'
>;

interface Props extends TextProps {
  variante?: Variante;
  tom?: Tom;
}

export function Texto({ variante = 'corpo', tom = 'tinta', style, ...resto }: Props) {
  const { paleta } = useTema();
  return <Text {...resto} style={[estilos[variante], { color: paleta[tom] }, style]} />;
}

const estilos = StyleSheet.create({
  marca: {
    fontFamily: familias.tituloForte,
    fontSize: escala.marca,
    lineHeight: escala.marca * 1.02,
    letterSpacing: -1.4,
  },
  titulo: {
    fontFamily: familias.tituloForte,
    fontSize: escala.titulo,
    lineHeight: escala.titulo * 1.1,
    letterSpacing: -0.7,
  },
  subtitulo: {
    fontFamily: familias.titulo,
    fontSize: escala.subtitulo,
    lineHeight: escala.subtitulo * 1.2,
    letterSpacing: -0.3,
  },
  destaque: {
    fontFamily: familias.titulo,
    fontSize: escala.destaque,
    lineHeight: escala.destaque * 1.25,
    letterSpacing: -0.15,
  },
  corpo: {
    fontFamily: familias.texto,
    fontSize: escala.corpo,
    lineHeight: escala.corpo * 1.45,
  },
  corpoForte: {
    fontFamily: familias.textoForte,
    fontSize: escala.corpo,
    lineHeight: escala.corpo * 1.45,
  },
  pequeno: {
    fontFamily: familias.texto,
    fontSize: escala.pequeno,
    lineHeight: escala.pequeno * 1.4,
  },
  rotulo: {
    fontFamily: familias.dadoMedio,
    fontSize: escala.rotulo,
    lineHeight: escala.rotulo * 1.35,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  dado: {
    fontFamily: familias.dado,
    fontSize: escala.pequeno,
    lineHeight: escala.pequeno * 1.4,
  },
  dadoGrande: {
    fontFamily: familias.dadoMedio,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
});
