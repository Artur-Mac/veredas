import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_600SemiBold,
  AtkinsonHyperlegibleNext_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible-next';
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from '@expo-google-fonts/ibm-plex-mono';

export const fontesParaCarregar = {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_600SemiBold,
  AtkinsonHyperlegibleNext_700Bold,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
};

export const familias = {
  titulo: 'BricolageGrotesque_700Bold',
  tituloForte: 'BricolageGrotesque_800ExtraBold',
  tituloMedio: 'BricolageGrotesque_500Medium',
  texto: 'AtkinsonHyperlegibleNext_400Regular',
  textoMedio: 'AtkinsonHyperlegibleNext_600SemiBold',
  textoForte: 'AtkinsonHyperlegibleNext_700Bold',
  dado: 'IBMPlexMono_400Regular',
  dadoMedio: 'IBMPlexMono_500Medium',
  dadoForte: 'IBMPlexMono_600SemiBold',
} as const;

export const escala = {
  rotulo: 11,
  pequeno: 13,
  corpo: 15,
  destaque: 17,
  subtitulo: 21,
  titulo: 28,
  marca: 40,
} as const;

export const espaco = {
  meio: 4,
  um: 8,
  um5: 12,
  dois: 16,
  tres: 24,
  quatro: 32,
  cinco: 40,
} as const;

export const raio = {
  pequeno: 4,
  medio: 10,
  grande: 18,
} as const;
