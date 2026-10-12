import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Botao } from '@/componentes/Botao';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';

export default function NaoEncontrado() {
  return (
    <Tela cabecalho={<Cabecalho titulo="Página não encontrada" />}>
      <View style={estilos.topo}>
        <Texto variante="titulo">Esta página não existe.</Texto>
        <Botao rotulo="Voltar ao início" icone="home" aoPressionar={() => router.replace('/')} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: 16,
    paddingTop: 4,
  },
});
