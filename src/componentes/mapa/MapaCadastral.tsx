import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Pattern, Rect, Text as TextoSvg } from 'react-native-svg';

import type { Mapa } from '@/dominio/esquema';
import { useTema } from '@/tema/TemaProvider';
import { familias } from '@/tema/tipografia';

import { usarDriverNativo, useMovimentoReduzido } from '../animacao';
import { useIdSvg } from '../Carimbo';
import { Texto } from '../Texto';
import {
  caixaDeFoco,
  caminhoDoAnel,
  caminhoDosAneis,
  centroide,
  enquadrar,
  paraTela,
  rotulosDeRua,
} from './geometria';

export interface CamadasMapa {
  ocorrencias: boolean;
  raio: boolean;
  suscetibilidade: boolean;
  rotulos: boolean;
}

interface Props {
  mapa: Mapa;
  alvos: string[];
  selecionado?: string | null;
  aoSelecionar?: (id: string) => void;
  camadas?: Partial<CamadasMapa>;
  altura?: number;
  ornamental?: boolean;
  focoNoRaio?: boolean;
  letras?: boolean;
}

const camadasPadrao: CamadasMapa = { ocorrencias: true, raio: true, suscetibilidade: true, rotulos: true };

function useSequencia(quantidade: number, chave: string) {
  const reduzido = useMovimentoReduzido();
  const [valores] = useState(() => Array.from({ length: quantidade }, () => new Animated.Value(0)));
  useEffect(() => {
    for (const valor of valores) {
      valor.setValue(0);
    }
    const animacao = Animated.stagger(
      reduzido ? 0 : 260,
      valores.map((valor) =>
        Animated.timing(valor, {
          toValue: 1,
          duration: reduzido ? 0 : 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: usarDriverNativo,
        }),
      ),
    );
    animacao.start();
    return () => animacao.stop();
  }, [valores, reduzido, chave]);
  return valores;
}

function usePulso(ativo: boolean) {
  const reduzido = useMovimentoReduzido();
  const [pulso] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!ativo || reduzido) {
      return;
    }
    pulso.setValue(0);
    const animacao = Animated.sequence([
      Animated.delay(900),
      Animated.loop(
        Animated.timing(pulso, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: usarDriverNativo }),
        { iterations: 3 },
      ),
    ]);
    animacao.start();
    return () => animacao.stop();
  }, [ativo, pulso, reduzido]);
  return pulso;
}

export function MapaCadastral({
  mapa,
  alvos,
  selecionado = null,
  aoSelecionar,
  camadas,
  altura = 300,
  ornamental = false,
  focoNoRaio = false,
  letras = false,
}: Props) {
  const { paleta } = useTema();
  const [largura, setLargura] = useState(0);
  const visiveis = { ...camadasPadrao, ...camadas };
  const [base, contexto, alvo] = useSequencia(3, `${mapa.dossie_id}-${alvos.join(',')}`);
  const pulso = usePulso(!ornamental && alvos.length === 1);
  const idHachura = useIdSvg('suscetibilidade');

  const aoMedir = (evento: LayoutChangeEvent) => {
    setLargura(evento.nativeEvent.layout.width);
  };

  if (base === undefined || contexto === undefined || alvo === undefined) {
    throw new Error('sequência de animação do mapa incompleta');
  }

  const alvosDesenhados = mapa.alvos.filter((a) => alvos.includes(a.id));
  const caixa = caixaDeFoco(mapa, focoNoRaio || alvosDesenhados.length === 0 ? [] : alvos, focoNoRaio || visiveis.raio);
  const quadro = largura > 0 ? enquadrar(caixa, largura, altura, ornamental ? 0.6 : 0.08, mapa.lado_m) : null;
  const metro = quadro === null ? 1 : 1 / quadro.pixelsPorMetro;
  const centrosDosAlvos = alvosDesenhados.map((a) => centroide(a.pontos));
  const rotulos = quadro === null || ornamental || !visiveis.rotulos ? [] : rotulosDeRua(mapa, quadro, 5, centrosDosAlvos);
  const centroAlvo = alvosDesenhados.length === 1 ? (centrosDosAlvos[0] ?? null) : null;
  const pulsoTela = centroAlvo !== null && quadro !== null ? paraTela(centroAlvo, quadro) : null;
  const escalaMetros = quadro === null ? 50 : quadro.largura > 380 ? 100 : 50;

  return (
    <View
      onLayout={aoMedir}
      style={[estilos.moldura, { height: altura, backgroundColor: paleta.fundo, borderColor: ornamental ? 'transparent' : paleta.linha }]}
      accessibilityRole="image"
      accessibilityLabel={
        ornamental
          ? 'Desenho de quadras e edificações do cadastro do Recife'
          : `Mapa cadastral com ${mapa.edificacoes.length} edificações, ${mapa.ocorrencias.length} pontos de atendimento da Defesa Civil e raio de ${mapa.raio_m} metros`
      }
    >
      {quadro === null ? null : (
        <>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: base }]}>
            <Svg width={largura} height={altura} viewBox={quadro.viewBox}>
              <Path d={caminhoDosAneis(mapa.quadras)} fill={paleta.mapaQuadra} />
              <Path
                d={caminhoDosAneis(mapa.edificacoes)}
                fill={ornamental ? paleta.mapaQuadra : paleta.mapaEdificacao}
                stroke={paleta.mapaEdificacaoBorda}
                strokeWidth={0.6 * metro}
              />
            </Svg>
          </Animated.View>

          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: contexto }]}>
            <Svg width={largura} height={altura} viewBox={quadro.viewBox}>
              <Defs>
                <Pattern id={idHachura} width={6 * metro} height={6 * metro} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <Line x1={0} y1={0} x2={0} y2={6 * metro} stroke={paleta.azulejo} strokeWidth={1.2 * metro} opacity={0.45} />
                </Pattern>
              </Defs>
              {visiveis.suscetibilidade && !ornamental
                ? mapa.suscetibilidade.map((area, indice) => (
                    <Path
                      key={`sus-${indice}`}
                      d={caminhoDoAnel(area.pontos)}
                      fill={`url(#${idHachura})`}
                      stroke={paleta.azulejo}
                      strokeWidth={1 * metro}
                      strokeOpacity={0.5}
                    />
                  ))
                : null}
              {visiveis.raio && !ornamental ? (
                <G>
                  <Circle
                    cx={mapa.centro_raio[0]}
                    cy={-mapa.centro_raio[1]}
                    r={mapa.raio_m}
                    fill="none"
                    stroke={paleta.tinta}
                    strokeWidth={1.2 * metro}
                    strokeDasharray={`${6 * metro} ${5 * metro}`}
                    opacity={0.7}
                  />
                  <TextoSvg
                    x={mapa.centro_raio[0] - mapa.raio_m * 0.71 - 4 * metro}
                    y={-mapa.centro_raio[1] - mapa.raio_m * 0.71 - 4 * metro}
                    fontSize={11 * metro}
                    fontFamily={familias.dadoMedio}
                    textAnchor="end"
                    fill={paleta.tintaSuave}
                  >
                    {`${mapa.raio_m} m`}
                  </TextoSvg>
                </G>
              ) : null}
              {rotulos.map((rotulo) => (
                <G key={rotulo.nome} transform={`rotate(${rotulo.angulo.toFixed(1)} ${rotulo.x.toFixed(1)} ${rotulo.y.toFixed(1)})`}>
                  <TextoSvg
                    x={rotulo.x}
                    y={rotulo.y}
                    fontSize={10.5 * metro}
                    fontFamily={familias.textoMedio}
                    textAnchor="middle"
                    stroke={paleta.fundo}
                    strokeWidth={3 * metro}
                    fill={paleta.fundo}
                  >
                    {rotulo.nome}
                  </TextoSvg>
                  <TextoSvg
                    x={rotulo.x}
                    y={rotulo.y}
                    fontSize={10.5 * metro}
                    fontFamily={familias.textoMedio}
                    textAnchor="middle"
                    fill={paleta.mapaRotulo}
                  >
                    {rotulo.nome}
                  </TextoSvg>
                </G>
              ))}
              {visiveis.ocorrencias && !ornamental
                ? mapa.ocorrencias.map((ocorrencia, indice) => (
                    <Circle
                      key={`oc-${indice}`}
                      cx={ocorrencia.x}
                      cy={-ocorrencia.y}
                      r={(3.2 + 1.6 * Math.sqrt(ocorrencia.n)) * metro}
                      fill={paleta.fundo}
                      stroke={paleta.azulejo}
                      strokeWidth={2 * metro}
                    />
                  ))
                : null}
            </Svg>
          </Animated.View>

          {pulsoTela === null ? null : (
            <Animated.View
              pointerEvents="none"
              style={[
                estilos.pulso,
                {
                  borderColor: paleta.azulejo,
                  left: pulsoTela.x - 40,
                  top: pulsoTela.y - 40,
                  opacity: pulso.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.7, 0] }),
                  transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1.4] }) }],
                },
              ]}
            />
          )}

          <Animated.View
            pointerEvents="box-none"
            style={[StyleSheet.absoluteFill, { opacity: alvo, transform: [{ scale: alvo.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1] }) }] }]}
          >
            <Svg width={largura} height={altura} viewBox={quadro.viewBox}>
              {alvosDesenhados.map((desenho) => {
                const ativo = selecionado === null ? alvosDesenhados.length === 1 : selecionado === desenho.id;
                const [cx, cy] = centroide(desenho.pontos);
                return (
                  <G key={desenho.id} onPress={aoSelecionar === undefined ? undefined : () => aoSelecionar(desenho.id)}>
                    <Path
                      d={caminhoDoAnel(desenho.pontos)}
                      fill={ornamental ? paleta.mapaEdificacaoBorda : ativo ? paleta.azulejo : paleta.azulejoFundo}
                      fillOpacity={ornamental ? 0.9 : ativo ? 0.92 : 0.95}
                      stroke={ornamental ? paleta.tintaSuave : paleta.azulejo}
                      strokeWidth={(ativo ? 2.4 : 1.6) * metro}
                      strokeDasharray={ativo || ornamental ? undefined : `${4 * metro} ${3 * metro}`}
                    />
                    {letras ? (
                      <G>
                        <Circle cx={cx} cy={-cy} r={11 * metro} fill={ativo ? paleta.tinta : paleta.superficieElevada} stroke={paleta.tinta} strokeWidth={1.4 * metro} />
                        <TextoSvg
                          x={cx}
                          y={-cy + 4 * metro}
                          fontSize={12 * metro}
                          fontFamily={familias.dadoForte}
                          textAnchor="middle"
                          fill={ativo ? paleta.sobreTinta : paleta.tinta}
                        >
                          {desenho.id}
                        </TextoSvg>
                      </G>
                    ) : null}
                  </G>
                );
              })}
            </Svg>
          </Animated.View>

          {ornamental ? null : (
            <>
              <View pointerEvents="none" style={[estilos.norte, { backgroundColor: paleta.superficie, borderColor: paleta.linha }]}>
                <Svg width={14} height={18} viewBox="0 0 14 18">
                  <Path d="M7 0 L13 16 L7 12 L1 16 Z" fill={paleta.tinta} />
                </Svg>
                <Texto variante="rotulo">N</Texto>
              </View>
              <View pointerEvents="none" style={[estilos.escala, { backgroundColor: paleta.superficie, borderColor: paleta.linha }]}>
                <View
                  style={[
                    estilos.barraEscala,
                    { width: escalaMetros * quadro.pixelsPorMetro, borderColor: paleta.tinta },
                  ]}
                />
                <Texto variante="dado" tom="tintaSuave">
                  {`${escalaMetros} m`}
                </Texto>
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

export function LegendaMapa({ mapa, comAlvo = true }: { mapa: Mapa; comAlvo?: boolean }) {
  const { paleta } = useTema();
  const itens: { chave: string; rotulo: string; simbolo: 'alvo' | 'ocorrencia' | 'raio' | 'suscetibilidade' }[] = [];
  if (comAlvo) {
    itens.push({ chave: 'alvo', rotulo: 'edificação do anúncio', simbolo: 'alvo' });
  }
  if (mapa.ocorrencias.length > 0) {
    itens.push({ chave: 'oc', rotulo: 'atendimento da Defesa Civil', simbolo: 'ocorrencia' });
  }
  itens.push({ chave: 'raio', rotulo: `raio de ${mapa.raio_m} m`, simbolo: 'raio' });
  if (mapa.suscetibilidade.length > 0) {
    itens.push({ chave: 'sus', rotulo: 'suscetibilidade (SGB 2015)', simbolo: 'suscetibilidade' });
  }
  return (
    <View style={estilos.legenda}>
      {itens.map((item) => (
        <View key={item.chave} style={estilos.itemLegenda}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            {item.simbolo === 'alvo' ? <Rect x={1} y={2} width={12} height={10} fill={paleta.azulejo} /> : null}
            {item.simbolo === 'ocorrencia' ? (
              <Circle cx={7} cy={7} r={4.5} fill={paleta.fundo} stroke={paleta.azulejo} strokeWidth={2} />
            ) : null}
            {item.simbolo === 'raio' ? (
              <Circle cx={7} cy={7} r={5.5} fill="none" stroke={paleta.tinta} strokeWidth={1.2} strokeDasharray="2.5 2" />
            ) : null}
            {item.simbolo === 'suscetibilidade' ? (
              <>
                <Rect x={1} y={1} width={12} height={12} fill="none" stroke={paleta.azulejo} strokeWidth={1} />
                <Line x1={1} y1={9} x2={5} y2={13} stroke={paleta.azulejo} strokeWidth={1} />
                <Line x1={1} y1={5} x2={9} y2={13} stroke={paleta.azulejo} strokeWidth={1} />
                <Line x1={1} y1={1} x2={13} y2={13} stroke={paleta.azulejo} strokeWidth={1} />
                <Line x1={5} y1={1} x2={13} y2={9} stroke={paleta.azulejo} strokeWidth={1} />
              </>
            ) : null}
          </Svg>
          <Texto variante="pequeno" tom="tintaSuave">
            {item.rotulo}
          </Texto>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  moldura: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 14,
  },
  pulso: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  norte: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  escala: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  barraEscala: {
    height: 6,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 6,
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
