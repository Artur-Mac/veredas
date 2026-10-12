import Feather from '@expo/vector-icons/Feather';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useAparecer, useMovimentoReduzido, usarDriverNativo } from '@/componentes/animacao';
import { Botao } from '@/componentes/Botao';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { etapasDoPipeline, type Etapa } from '@/dominio/etapas';
import { precisaConfirmacao } from '@/dominio/visao';
import { dossiePorId } from '@/fixtures';
import { useTema } from '@/tema/TemaProvider';

const duracaoEtapa = 620;

function Giro() {
  const { paleta } = useTema();
  const reduzido = useMovimentoReduzido();
  const [giro] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduzido) {
      return;
    }
    const animacao = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: usarDriverNativo }),
    );
    animacao.start();
    return () => animacao.stop();
  }, [giro, reduzido]);
  const rotacao = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate: rotacao }] }}>
      <Feather name="loader" size={14} color={paleta.mare} />
    </Animated.View>
  );
}

function LinhaEtapa({ etapa, estado, ultima }: { etapa: Etapa; estado: 'pendente' | 'ativa' | 'feita'; ultima: boolean }) {
  const { paleta } = useTema();
  const resultado = useAparecer(0, 4);
  const feita = estado === 'feita';
  return (
    <View style={estilos.etapa}>
      <View style={estilos.trilho}>
        <View
          style={[
            estilos.no,
            feita
              ? { backgroundColor: paleta.mare, borderColor: paleta.mare }
              : { borderColor: estado === 'ativa' ? paleta.mare : paleta.linhaForte, borderStyle: estado === 'pendente' ? 'dashed' : 'solid' },
          ]}
        >
          {feita ? <Feather name="check" size={13} color={paleta.sobreTinta} /> : null}
          {estado === 'ativa' ? <Giro /> : null}
        </View>
        {ultima ? null : <View style={[estilos.segmento, { backgroundColor: feita ? paleta.mare : paleta.linha }]} />}
      </View>
      <View style={estilos.textoEtapa}>
        <Texto variante="destaque" tom={estado === 'pendente' ? 'tintaFraca' : 'tinta'}>
          {etapa.titulo}
        </Texto>
        {feita ? (
          <Animated.View style={resultado}>
            <Texto variante="dado" tom="tintaSuave">
              {etapa.resultado}
            </Texto>
          </Animated.View>
        ) : (
          <Texto variante="dado" tom="tintaFraca">
            {estado === 'ativa' ? 'consultando…' : 'na fila'}
          </Texto>
        )}
      </View>
    </View>
  );
}

export default function Etapas() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dossie = dossiePorId(id);
  const etapas = dossie === null ? [] : etapasDoPipeline(dossie);
  const [concluidas, setConcluidas] = useState(0);
  const reduzido = useMovimentoReduzido();

  useEffect(() => {
    if (concluidas >= etapas.length) {
      return;
    }
    const temporizador = setTimeout(() => setConcluidas((n) => n + 1), reduzido ? 60 : duracaoEtapa);
    return () => clearTimeout(temporizador);
  }, [concluidas, etapas.length, reduzido]);

  if (dossie === null) {
    return <Redirect href={{ pathname: '/demonstracao', params: { link: id } }} />;
  }

  const pronto = concluidas >= etapas.length;
  const confirmar = precisaConfirmacao(dossie);

  return (
    <Tela
      cabecalho={<Cabecalho titulo="Consultando registros" />}
      rodape={
        <Botao
          rotulo={!pronto ? 'Consultando…' : confirmar ? 'Confirmar o prédio' : 'Abrir o dossiê'}
          iconeDepois="arrow-right"
          desativado={!pronto}
          aoPressionar={() =>
            confirmar
              ? router.replace({ pathname: '/anuncio/[id]/confirmacao', params: { id } })
              : router.replace({ pathname: '/dossie/[id]', params: { id } })
          }
        />
      }
    >
      <View style={estilos.topo}>
        <Texto variante="titulo">{pronto ? 'Registros consultados.' : 'Cruzando o anúncio com registros públicos.'}</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          Cada etapa grava fonte, data e escala. O que não encontrarmos vira pergunta, não suposição.
        </Texto>
      </View>
      <View>
        {etapas.map((etapa, indice) => (
          <LinhaEtapa
            key={etapa.id}
            etapa={etapa}
            ultima={indice === etapas.length - 1}
            estado={indice < concluidas ? 'feita' : indice === concluidas ? 'ativa' : 'pendente'}
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
  etapa: {
    flexDirection: 'row',
    gap: 14,
  },
  trilho: {
    alignItems: 'center',
    width: 26,
  },
  no: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmento: {
    width: 2,
    flex: 1,
    minHeight: 22,
  },
  textoEtapa: {
    flex: 1,
    gap: 2,
    paddingBottom: 18,
    paddingTop: 2,
  },
});
