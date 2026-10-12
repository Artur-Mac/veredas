import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTema } from '@/tema/TemaProvider';
import { espaco } from '@/tema/tipografia';

import { GradeDeLevantamento } from './GradeDeLevantamento';
import { Texto } from './Texto';

interface CabecalhoProps {
  titulo?: string;
  voltar?: boolean;
  direita?: ReactNode;
}

export function SeloDemonstracao() {
  const { paleta } = useTema();
  return (
    <View
      accessibilityLabel="Demonstração com dados reais pré-processados"
      style={[estilos.selo, { borderColor: paleta.linhaForte }]}
    >
      <Texto variante="carimbo" tom="tintaSuave">
        demonstração
      </Texto>
    </View>
  );
}

export function Cabecalho({ titulo, voltar = true, direita }: CabecalhoProps) {
  const { paleta } = useTema();
  return (
    <View style={estilos.cabecalho}>
      <View style={estilos.cabecalhoLado}>
        {voltar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={12}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [estilos.voltar, { borderColor: paleta.linha, opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="arrow-left" size={18} color={paleta.tinta} />
          </Pressable>
        ) : null}
        {titulo === undefined ? null : (
          <Texto variante="rotulo" tom="tintaSuave" numberOfLines={1} style={estilos.titulo}>
            {titulo}
          </Texto>
        )}
      </View>
      <View style={estilos.cabecalhoDireita}>{direita}</View>
    </View>
  );
}

interface TelaProps {
  children: ReactNode;
  cabecalho?: ReactNode;
  rodape?: ReactNode;
  rolar?: boolean;
  grade?: boolean;
  acimaDasAbas?: boolean;
}

export function Tela({ children, cabecalho, rodape, rolar = true, grade = false, acimaDasAbas = false }: TelaProps) {
  const { paleta } = useTema();
  return (
    <SafeAreaView edges={acimaDasAbas ? ['top'] : ['top', 'bottom']} style={[estilos.tela, { backgroundColor: paleta.fundo }]}>
      {grade ? <GradeDeLevantamento /> : null}
      {cabecalho}
      {rolar ? (
        <ScrollView
          contentContainerStyle={estilos.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[estilos.conteudo, estilos.fixo]}>{children}</View>
      )}
      {rodape === undefined ? null : (
        <View style={[estilos.rodape, { borderTopColor: paleta.linha, backgroundColor: paleta.fundo }]}>
          <View style={estilos.conteudoRodape}>{rodape}</View>
        </View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
  },
  conteudo: {
    paddingHorizontal: espaco.dois + 4,
    paddingBottom: espaco.cinco,
    gap: espaco.tres,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  fixo: {
    flex: 1,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaco.dois + 4,
    paddingTop: espaco.um,
    paddingBottom: espaco.um5,
    gap: espaco.um5,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  cabecalhoLado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.um5,
    flex: 1,
    minWidth: 0,
  },
  titulo: {
    flexShrink: 1,
  },
  cabecalhoDireita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.um,
  },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selo: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rodape: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: espaco.dois + 4,
    paddingTop: espaco.um5,
    paddingBottom: espaco.um5,
    width: '100%',
  },
  conteudoRodape: {
    gap: espaco.um,
    width: '100%',
    maxWidth: 560 - (espaco.dois + 4) * 2,
    alignSelf: 'center',
  },
});
