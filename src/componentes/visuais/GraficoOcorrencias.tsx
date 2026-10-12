import { StyleSheet, View } from 'react-native';

import { numero, plural } from '@/dominio/formato';
import { useTema } from '@/tema/TemaProvider';

import { Texto } from '../Texto';

interface Props {
  total: number;
  raio_m: number;
  periodo: string;
  por_ano: { ano: number; n: number }[];
  por_tipo: { tipo: string; n: number }[];
  sem_posicao: number;
}

export function GraficoOcorrencias({ total, raio_m, periodo, por_ano, por_tipo, sem_posicao }: Props) {
  const { paleta } = useTema();
  const maiorAno = Math.max(...por_ano.map((a) => a.n), 1);
  return (
    <View style={estilos.bloco}>
      <View style={estilos.topo}>
        <Texto variante="dadoGrande" tom="azulejo">
          {numero(total)}
        </Texto>
        <Texto variante="pequeno" tom="tintaSuave" style={estilos.legendaTotal}>
          {`${total === 1 ? 'atendimento posicionado' : 'atendimentos posicionados'} a até ${raio_m} m, ${periodo}`}
        </Texto>
      </View>
      <View style={estilos.anos}>
        {por_ano.map((ano) => (
          <View key={ano.ano} style={estilos.coluna}>
            <View style={estilos.trilho}>
              <View
                style={[
                  estilos.barraAno,
                  {
                    height: `${Math.max((ano.n / maiorAno) * 100, ano.n > 0 ? 8 : 0)}%`,
                    backgroundColor: paleta.azulejo,
                  },
                ]}
              />
            </View>
            <Texto variante="dado" tom="tinta">
              {numero(ano.n)}
            </Texto>
            <Texto variante="rotulo" tom="tintaFraca">
              {String(ano.ano)}
            </Texto>
          </View>
        ))}
      </View>
      {por_tipo.length === 0 ? null : (
        <View style={estilos.tipos}>
          {por_tipo.map((tipo) => (
            <View key={tipo.tipo} style={[estilos.tipo, { borderBottomColor: paleta.linha }]}>
              <Texto variante="pequeno" style={estilos.nomeTipo}>
                {tipo.tipo}
              </Texto>
              <Texto variante="dado" tom="azulejo">
                {numero(tipo.n)}
              </Texto>
            </View>
          ))}
        </View>
      )}
      {sem_posicao === 0 ? null : (
        <Texto variante="pequeno" tom="grafite">
          {`Mais ${plural(sem_posicao, 'registro', 'registros')} na mesma rua sem número, que não conseguimos posicionar.`}
        </Texto>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: {
    gap: 12,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  legendaTotal: {
    flex: 1,
    paddingBottom: 2,
  },
  anos: {
    flexDirection: 'row',
    gap: 10,
    height: 112,
  },
  coluna: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trilho: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barraAno: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tipos: {
    gap: 0,
  },
  tipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nomeTipo: {
    flex: 1,
  },
});
