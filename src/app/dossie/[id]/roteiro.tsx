import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { useAparecer } from '@/componentes/animacao';
import { vibrarLeve } from '@/componentes/Botao';
import { DesvioDeRota } from '@/componentes/dossie/DesvioDeRota';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { itensDoRoteiro, type PerguntaEfetiva } from '@/dominio/visao';
import { useEstado, useRegistro } from '@/estado/armazenamento';
import { useVisaoDaRota } from '@/navegacao/useVisaoDaRota';
import { rotuloStatusPergunta } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { raio } from '@/tema/tipografia';

function Progresso({ feitos, total }: { feitos: number; total: number }) {
  const { paleta } = useTema();
  const [largura] = useState(() => new Animated.Value(0));
  const fracao = total === 0 ? 0 : feitos / total;
  useEffect(() => {
    Animated.timing(largura, { toValue: fracao, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [fracao, largura]);
  return (
    <View style={estilos.progresso}>
      <View style={estilos.linhaProgresso}>
        <Texto variante="dadoGrande">{`${feitos} de ${total}`}</Texto>
        <Texto variante="pequeno" tom="tintaSuave">
          itens conferidos
        </Texto>
      </View>
      <View style={[estilos.trilho, { backgroundColor: paleta.grafiteFundo }]}>
        <Animated.View
          style={[
            estilos.preenchimento,
            { backgroundColor: paleta.mare, width: largura.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    </View>
  );
}

function ItemRoteiro({ item, marcado, indice, aoAlternar }: { item: PerguntaEfetiva; marcado: boolean; indice: number; aoAlternar: () => void }) {
  const { paleta } = useTema();
  const aparecer = useAparecer(indice * 70);
  return (
    <Animated.View style={aparecer}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcado }}
        onPress={() => {
          vibrarLeve();
          aoAlternar();
        }}
        style={[estilos.item, { borderColor: marcado ? paleta.mare : paleta.linha, backgroundColor: marcado ? paleta.mareFundo : paleta.superficie }]}
      >
        <View style={[estilos.caixa, { borderColor: marcado ? paleta.mare : paleta.linhaForte, backgroundColor: marcado ? paleta.mare : 'transparent' }]}>
          {marcado ? <Feather name="check" size={16} color={paleta.sobreTinta} /> : null}
        </View>
        <View style={estilos.textoItem}>
          <Texto variante="corpoForte" style={marcado ? estilos.feito : null}>
            {item.acao.texto}
          </Texto>
          <Texto variante="pequeno" tom="tintaSuave">
            {`${item.texto} · ${rotuloStatusPergunta[item.statusEfetivo]}`}
          </Texto>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Roteiro() {
  const resultado = useVisaoDaRota();
  const { despachar } = useEstado();
  const id = resultado.tipo === 'pronto' ? resultado.id : '';
  const registro = useRegistro(id);

  if (resultado.tipo !== 'pronto') {
    return <DesvioDeRota resultado={resultado} />;
  }

  const itens = itensDoRoteiro(resultado.visao);
  const feitos = itens.filter((i) => registro.roteiro[i.id] === true).length;

  return (
    <Tela cabecalho={<Cabecalho titulo="Roteiro de visita" />}>
      <View style={estilos.topo}>
        <Texto variante="titulo">O que conferir na visita</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          Gerado das perguntas que nenhum registro respondeu. Marque conforme for conferindo; fica salvo neste aparelho.
        </Texto>
      </View>
      <Progresso feitos={feitos} total={itens.length} />
      <View style={estilos.lista}>
        {itens.map((item, indice) => (
          <ItemRoteiro
            key={item.id}
            item={item}
            indice={indice}
            marcado={registro.roteiro[item.id] === true}
            aoAlternar={() => despachar({ tipo: 'marcarItem', id, item: item.id, marcado: registro.roteiro[item.id] !== true })}
          />
        ))}
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: 8,
    paddingTop: 4,
  },
  progresso: {
    gap: 10,
  },
  linhaProgresso: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  trilho: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    borderRadius: 5,
  },
  lista: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderRadius: raio.grande,
    padding: 14,
    alignItems: 'flex-start',
  },
  caixa: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoItem: {
    flex: 1,
    gap: 4,
  },
  feito: {
    textDecorationLine: 'line-through',
  },
});
