import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ListaDeExemplos } from '@/componentes/ListaDeExemplos';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { useTema } from '@/tema/TemaProvider';
import { raio } from '@/tema/tipografia';

export default function Demonstracao() {
  const parametros = useLocalSearchParams<{ codigo?: string }>();
  const { paleta } = useTema();
  const codigo = typeof parametros.codigo === 'string' && /^\d{6,}$/.test(parametros.codigo) ? parametros.codigo : null;
  return (
    <Tela cabecalho={<Cabecalho titulo="Anúncio fora da demonstração" />}>
      <View style={estilos.topo}>
        <Texto variante="titulo">Este anúncio não está entre os exemplos.</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          Nesta versão de demonstração, os dossiês foram montados com antecedência para três anúncios reais de Recife. A versão conectada lê qualquer anúncio no seu aparelho.
        </Texto>
      </View>
      <View style={[estilos.caixa, { borderColor: paleta.grafite }]}>
        <Texto variante="rotulo" tom="grafite">
          o que recebemos
        </Texto>
        <Texto variante="dado" tom="tintaSuave">
          {codigo === null ? 'nenhum código de anúncio reconhecido no texto' : `código de anúncio ${codigo}`}
        </Texto>
      </View>
      <View style={estilos.secao}>
        <Texto variante="rotulo" tom="tintaSuave">
          Escolha um exemplo
        </Texto>
        <ListaDeExemplos />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: 8,
    paddingTop: 4,
  },
  caixa: {
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderRadius: raio.medio,
    padding: 12,
    gap: 4,
  },
  secao: {
    gap: 12,
  },
});
