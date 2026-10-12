import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import type { OrigemParcela, ParcelaCusto } from '@/dominio/esquema';
import { faixaMoeda, moeda } from '@/dominio/formato';
import { rotuloOrigemParcela } from '@/textos/rotulos';
import type { Paleta } from '@/tema/cores';
import { useTema } from '@/tema/TemaProvider';

import { useMovimentoReduzido } from './animacao';
import { Hachura } from './Carimbo';
import { Texto } from './Texto';

function corDaOrigem(origem: OrigemParcela, paleta: Paleta): string {
  switch (origem) {
    case 'informado_no_anuncio':
      return paleta.jambo;
    case 'do_cadastro_fiscal':
      return paleta.azulejo;
    case 'nao_informado':
      return paleta.grafite;
  }
}

function minimo(parcela: ParcelaCusto): number | null {
  return parcela.faixa?.[0] ?? parcela.valor;
}

function maximo(parcela: ParcelaCusto): number | null {
  return parcela.faixa?.[1] ?? parcela.valor;
}

function textoDoValor(parcela: ParcelaCusto): string {
  if (parcela.faixa !== null) {
    return faixaMoeda(parcela.faixa[0], parcela.faixa[1]);
  }
  if (parcela.valor === null) {
    return 'não informado';
  }
  return parcela.valor === 0 ? 'R$ 0' : moeda(Math.round(parcela.valor));
}

export function BarraCusto({ parcelas, titulo = 'Custo mensal' }: { parcelas: ParcelaCusto[]; titulo?: string }) {
  const { paleta } = useTema();
  const reduzido = useMovimentoReduzido();
  const [largura, setLargura] = useState(0);
  const conhecidas = parcelas.filter((p) => maximo(p) !== null && (maximo(p) ?? 0) > 0);
  const naoInformadas = parcelas.filter((p) => p.origem === 'nao_informado');
  const totalMinimo = conhecidas.reduce((soma, p) => soma + (minimo(p) ?? 0), 0);
  const totalMaximo = conhecidas.reduce((soma, p) => soma + (maximo(p) ?? 0), 0);
  const [progressos] = useState(() => parcelas.map(() => new Animated.Value(0)));

  useEffect(() => {
    if (largura === 0) {
      return;
    }
    for (const progresso of progressos) {
      progresso.setValue(0);
    }
    const animacao = Animated.stagger(
      reduzido ? 0 : 180,
      progressos.map((progresso) =>
        Animated.timing(progresso, {
          toValue: 1,
          duration: reduzido ? 0 : 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: false,
        }),
      ),
    );
    animacao.start();
    return () => animacao.stop();
  }, [largura, progressos, reduzido]);

  const aoMedir = (evento: LayoutChangeEvent) => setLargura(evento.nativeEvent.layout.width);
  const espacamento = 3;
  const larguraUtil = Math.max(largura - espacamento * Math.max(conhecidas.length - 1, 0), 0);

  return (
    <View style={estilos.bloco}>
      <View style={estilos.cabecalho}>
        <Texto variante="rotulo" tom="tintaSuave">
          {titulo}
        </Texto>
        <Texto variante="titulo" accessibilityRole="header">
          {totalMaximo === 0 ? 'sem valores' : faixaMoeda(totalMinimo, totalMaximo)}
        </Texto>
        <Texto variante="pequeno" tom="tintaSuave">
          {naoInformadas.length === 0
            ? 'somando os valores conhecidos'
            : `somando os valores conhecidos, mais ${naoInformadas.length === 1 ? '1 valor não informado' : `${naoInformadas.length} valores não informados`}`}
        </Texto>
      </View>

      <View onLayout={aoMedir} style={[estilos.barra, { backgroundColor: paleta.grafiteFundo }]}>
        {largura === 0
          ? null
          : conhecidas.map((parcela) => {
              const indice = parcelas.indexOf(parcela);
              const progresso = progressos[indice];
              if (progresso === undefined) {
                throw new Error(`parcela sem animação: ${parcela.rotulo}`);
              }
              const alvoMaximo = ((maximo(parcela) ?? 0) / totalMaximo) * larguraUtil;
              const alvoMinimo = ((minimo(parcela) ?? 0) / totalMaximo) * larguraUtil;
              const cor = corDaOrigem(parcela.origem, paleta);
              return (
                <Animated.View
                  key={parcela.rotulo}
                  style={[
                    estilos.segmento,
                    { width: progresso.interpolate({ inputRange: [0, 1], outputRange: [0, alvoMaximo] }) },
                  ]}
                >
                  <View style={[estilos.preenchido, { width: alvoMinimo, backgroundColor: cor }]} />
                  {alvoMaximo - alvoMinimo > 0.5 ? (
                    <View style={[estilos.incerto, { width: alvoMaximo - alvoMinimo, borderColor: cor }]}>
                      <Hachura cor={cor} opacidade={0.7} />
                    </View>
                  ) : null}
                </Animated.View>
              );
            })}
      </View>

      <View style={estilos.linhas}>
        {parcelas.map((parcela) => {
          const cor = corDaOrigem(parcela.origem, paleta);
          const naoInformada = parcela.origem === 'nao_informado';
          return (
            <View key={parcela.rotulo} style={[estilos.linha, { borderBottomColor: paleta.linha }]}>
              <View
                style={[
                  estilos.amostra,
                  naoInformada
                    ? { borderColor: cor, borderStyle: 'dashed', borderWidth: 1.2 }
                    : { backgroundColor: cor },
                ]}
              />
              <View style={estilos.rotuloLinha}>
                <Texto variante="corpoForte">{parcela.rotulo}</Texto>
                <Texto variante="rotulo" style={{ color: cor }}>
                  {rotuloOrigemParcela[parcela.origem]}
                </Texto>
              </View>
              <Texto variante="dado" tom={naoInformada ? 'grafite' : 'tinta'}>
                {textoDoValor(parcela)}
              </Texto>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: {
    gap: 14,
  },
  cabecalho: {
    gap: 4,
  },
  barra: {
    height: 22,
    borderRadius: 4,
    flexDirection: 'row',
    gap: 3,
    overflow: 'hidden',
  },
  segmento: {
    height: '100%',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  preenchido: {
    height: '100%',
  },
  incerto: {
    height: '100%',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    overflow: 'hidden',
  },
  linhas: {
    gap: 0,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  amostra: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  rotuloLinha: {
    flex: 1,
    gap: 2,
  },
});
