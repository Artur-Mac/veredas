import Feather from '@expo/vector-icons/Feather';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import type { Cartao } from '@/dominio/esquema';
import { dataReferencia } from '@/dominio/formato';
import { rotuloEscala } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { raio } from '@/tema/tipografia';

import { useAparecer } from './animacao';
import { BarraCusto } from './BarraCusto';
import { useEscalaDeToque, vibrarLeve } from './Botao';
import { Carimbo, corDaCategoria } from './Carimbo';
import { Texto } from './Texto';
import { ComparacaoArea } from './visuais/ComparacaoArea';
import { GraficoOcorrencias } from './visuais/GraficoOcorrencias';

interface Props {
  cartao: Cartao;
  indice?: number;
  aoAbrir: () => void;
  aoContestar: () => void;
  aoVerFonte: () => void;
  contestado?: boolean;
}

export function Selo({ texto, icone }: { texto: string; icone?: 'map-pin' | 'calendar' }) {
  const { paleta } = useTema();
  return (
    <View style={[estilos.selo, { borderColor: paleta.linha, backgroundColor: paleta.superficie }]}>
      {icone === undefined ? null : <Feather name={icone} size={11} color={paleta.tintaFraca} />}
      <Texto variante="dado" tom="tintaSuave" style={estilos.textoSelo}>
        {texto}
      </Texto>
    </View>
  );
}

export function CartaoEvidencia({ cartao, indice = 0, aoAbrir, aoContestar, aoVerFonte, contestado = false }: Props) {
  const { paleta } = useTema();
  const aparecer = useAparecer(Math.min(indice, 6) * 70);
  const { estiloEscala, aoPressionarDentro, aoSoltar } = useEscalaDeToque();
  const { cor } = corDaCategoria(cartao.categoria, paleta);
  const desconhecido = cartao.categoria === 'desconhecido';
  const especialista = cartao.categoria === 'precisa_especialista';

  return (
    <Animated.View style={[aparecer, estiloEscala]}>
      <View style={especialista ? [estilos.contornoDuplo, { borderColor: cor }] : null}>
        <View
          style={[
            estilos.cartao,
            {
              backgroundColor: desconhecido ? 'transparent' : paleta.superficie,
              borderColor: desconhecido || especialista ? cor : paleta.linha,
              borderStyle: desconhecido ? 'dashed' : 'solid',
              borderWidth: desconhecido ? 1.4 : 1,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Abre fonte, data, escala, método e limitação"
            onPressIn={aoPressionarDentro}
            onPressOut={aoSoltar}
            onPress={() => {
              vibrarLeve();
              aoAbrir();
            }}
            style={estilos.areaDeToque}
          >
            <View style={estilos.topo}>
              <Carimbo categoria={cartao.categoria} />
              <View style={estilos.selos}>
                <Selo texto={`vale para ${rotuloEscala[cartao.escala]}`} icone="map-pin" />
                {cartao.data_ref === null ? null : <Selo texto={dataReferencia(cartao.data_ref)} icone="calendar" />}
              </View>
            </View>

            <View style={estilos.texto}>
              <Texto variante="destaque">{cartao.titulo}</Texto>
              <Texto variante="corpo" tom="tintaSuave">
                {cartao.claim}
              </Texto>
            </View>

            {cartao.visual?.tipo === 'comparacao_area' ? <ComparacaoArea itens={cartao.visual.itens} /> : null}
            {cartao.visual?.tipo === 'ocorrencias' ? <GraficoOcorrencias {...cartao.visual} /> : null}
            {cartao.visual?.tipo === 'custo_mensal' ? <BarraCusto parcelas={cartao.visual.parcelas} /> : null}

            <View style={[estilos.acao, { backgroundColor: paleta.mareFundo }]}>
              <Feather name="corner-down-right" size={16} color={paleta.mare} />
              <Texto variante="corpoForte" tom="mare" style={estilos.textoAcao}>
                {cartao.acao}
              </Texto>
            </View>
          </Pressable>

          <View style={[estilos.rodape, { borderTopColor: paleta.linha }]}>
            <Pressable accessibilityRole="link" hitSlop={8} onPress={aoVerFonte} style={estilos.link}>
              <Feather name="external-link" size={14} color={paleta.azulejo} />
              <Texto variante="pequeno" tom="azulejo">
                {cartao.url_fonte === null ? 'ver detalhes da fonte' : 'ver fonte'}
              </Texto>
            </Pressable>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={aoContestar} style={estilos.link}>
              <Feather name={contestado ? 'check' : 'flag'} size={14} color={paleta.tintaSuave} />
              <Texto variante="pequeno" tom="tintaSuave">
                {contestado ? 'contestação registrada' : 'isso está errado'}
              </Texto>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contornoDuplo: {
    borderWidth: 1,
    borderRadius: raio.grande + 3,
    padding: 3,
  },
  cartao: {
    borderRadius: raio.grande,
    padding: 16,
    gap: 14,
  },
  areaDeToque: {
    gap: 14,
  },
  topo: {
    gap: 10,
  },
  selos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  textoSelo: {
    fontSize: 11,
  },
  texto: {
    gap: 6,
  },
  acao: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderRadius: raio.medio,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textoAcao: {
    flex: 1,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
});
