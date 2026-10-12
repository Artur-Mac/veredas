import { StyleSheet, View } from 'react-native';

import { numero } from '@/dominio/formato';
import { nomeDeRua } from '@/componentes/mapa/geometria';
import { useTema } from '@/tema/TemaProvider';

import { Texto } from '../Texto';

interface Props {
  total: number;
  raio_m: number;
  periodo: string;
  por_ano: { ano: number; n: number }[];
  por_tipo: { tipo: string; n: number }[];
  ruas: { nome: string; n: number }[];
}

function Lista({ titulo, itens }: { titulo: string; itens: { chave: string; rotulo: string; n: number }[] }) {
  const { paleta } = useTema();
  if (itens.length === 0) {
    return null;
  }
  return (
    <View>
      <Texto variante="rotulo" tom="tintaSuave" style={estilos.tituloLista}>
        {titulo}
      </Texto>
      {itens.map((item) => (
        <View key={item.chave} style={[estilos.item, { borderBottomColor: paleta.linha }]}>
          <Texto variante="pequeno" style={estilos.nome}>
            {item.rotulo}
          </Texto>
          <Texto variante="dado" tom="azulejo">
            {numero(item.n)}
          </Texto>
        </View>
      ))}
    </View>
  );
}

export function GraficoOcorrencias({ total, raio_m, periodo, por_ano, por_tipo, ruas }: Props) {
  const { paleta } = useTema();
  const maiorAno = Math.max(...por_ano.map((a) => a.n), 1);
  return (
    <View style={estilos.bloco}>
      <View style={estilos.topo}>
        <Texto variante="dadoGrande" tom="azulejo">
          {numero(total)}
        </Texto>
        <Texto variante="pequeno" tom="tintaSuave" style={estilos.legendaTotal}>
          {`${total === 1 ? 'atendimento registrado' : 'atendimentos registrados'}, ${periodo}, ${ruas.length === 1 ? 'na única rua' : `nas ${numero(ruas.length)} ruas`} que passam a até ${raio_m} m. Cada rua conta inteira, dentro do bairro.`}
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
      <Lista titulo="por rua" itens={ruas.map((r) => ({ chave: r.nome, rotulo: nomeDeRua(r.nome), n: r.n }))} />
      <Lista titulo="por tipo" itens={por_tipo.map((t) => ({ chave: t.tipo, rotulo: t.tipo, n: t.n }))} />
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: {
    gap: 14,
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
  tituloLista: {
    marginBottom: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nome: {
    flex: 1,
  },
});
