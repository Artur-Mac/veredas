import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTema } from '@/tema/TemaProvider';
import { espaco, raio } from '@/tema/tipografia';

import { usarDriverNativo } from './animacao';
import { Texto } from './Texto';

type Variante = 'primario' | 'secundario' | 'texto';
type NomeIcone = ComponentProps<typeof Feather>['name'];

interface Props {
  rotulo: string;
  aoPressionar: () => void;
  variante?: Variante;
  icone?: NomeIcone;
  iconeDepois?: NomeIcone;
  desativado?: boolean;
  estilo?: StyleProp<ViewStyle>;
  acessibilidade?: string;
  children?: ReactNode;
}

export function vibrarLeve() {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync().catch((erro: unknown) => {
      console.warn('Retorno tátil indisponível neste aparelho.', erro);
    });
  }
}

export function useEscalaDeToque() {
  const [escalaToque] = useState(() => new Animated.Value(1));
  const animar = (destino: number) => {
    Animated.spring(escalaToque, {
      toValue: destino,
      useNativeDriver: usarDriverNativo,
      speed: 40,
      bounciness: destino === 1 ? 6 : 0,
    }).start();
  };
  return {
    estiloEscala: { transform: [{ scale: escalaToque }] },
    aoPressionarDentro: () => animar(0.97),
    aoSoltar: () => animar(1),
  };
}

export function Botao({
  rotulo,
  aoPressionar,
  variante = 'primario',
  icone,
  iconeDepois,
  desativado = false,
  estilo,
  acessibilidade,
}: Props) {
  const { paleta } = useTema();
  const { estiloEscala, aoPressionarDentro, aoSoltar } = useEscalaDeToque();
  const corTexto = variante === 'primario' ? paleta.sobreTinta : paleta.tinta;
  const fundo = variante === 'primario' ? paleta.tinta : variante === 'secundario' ? paleta.superficie : 'transparent';
  const borda = variante === 'secundario' ? paleta.linhaForte : 'transparent';

  return (
    <Animated.View style={[estiloEscala, estilo, desativado && estilos.desativado]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={acessibilidade ?? rotulo}
        accessibilityState={{ disabled: desativado }}
        disabled={desativado}
        onPressIn={aoPressionarDentro}
        onPressOut={aoSoltar}
        onPress={() => {
          vibrarLeve();
          aoPressionar();
        }}
        style={({ pressed }) => [
          estilos.base,
          variante === 'texto' ? estilos.texto : null,
          { backgroundColor: fundo, borderColor: borda, opacity: pressed ? 0.88 : 1 },
        ]}
      >
        <View style={estilos.conteudo}>
          {icone === undefined ? null : <Feather name={icone} size={18} color={corTexto} />}
          <Texto variante="corpoForte" style={{ color: corTexto }}>
            {rotulo}
          </Texto>
          {iconeDepois === undefined ? null : <Feather name={iconeDepois} size={18} color={corTexto} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: raio.medio,
    borderWidth: 1,
    paddingHorizontal: espaco.dois,
    justifyContent: 'center',
  },
  texto: {
    minHeight: 44,
    paddingHorizontal: espaco.um,
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.um,
  },
  desativado: {
    opacity: 0.45,
  },
});
