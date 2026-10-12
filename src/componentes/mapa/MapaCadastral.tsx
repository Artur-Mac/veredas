import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Pattern, Rect, Text as TextoSvg } from 'react-native-svg';

import type { Mapa, Ponto } from '@/dominio/esquema';
import { useTema } from '@/tema/TemaProvider';
import { familias } from '@/tema/tipografia';

import { usarDriverNativo, useMovimentoReduzido } from '../animacao';
import { useIdSvg } from '../Carimbo';
import { Texto } from '../Texto';
import {
  caixaDaTela,
  caixaDeFoco,
  caminhoDaLinha,
  caminhoDoAnel,
  caminhoDosAneis,
  centroide,
  enquadrar,
  paraTela,
  posicoesDosSelos,
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

type NivelMancha = 'alta' | 'media';

interface Mancha {
  nivel: NivelMancha;
  tipo: string;
  pontos: Mapa['suscetibilidade'][number]['pontos'];
}

function nivelDaClasse(classe: string): NivelMancha | null {
  const normalizada = classe.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (normalizada === 'alta') {
    return 'alta';
  }
  if (normalizada === 'media') {
    return 'media';
  }
  return null;
}

function manchasVisiveis(mapa: Mapa): Mancha[] {
  return mapa.suscetibilidade.flatMap((area) => {
    const nivel = nivelDaClasse(area.classe);
    return nivel === null ? [] : [{ nivel, tipo: area.tipo.toLowerCase(), pontos: area.pontos }];
  });
}

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
  const caixa = caixaDeFoco(mapa, focoNoRaio || alvosDesenhados.length === 0 ? [] : alvos, !ornamental && (focoNoRaio || visiveis.raio));
  const quadro = largura > 0 ? enquadrar(caixa, largura, altura, ornamental ? 1.6 : 0.08, mapa.lado_m) : null;
  const metro = quadro === null ? 1 : 1 / quadro.pixelsPorMetro;
  const centrosDosAlvos = alvosDesenhados.map((a) => centroide(a.pontos));
  const rotulos = quadro === null || ornamental || !visiveis.rotulos ? [] : rotulosDeRua(mapa, quadro, 5, centrosDosAlvos);
  const centroAlvo = alvosDesenhados.length === 1 ? (centrosDosAlvos[0] ?? null) : null;
  const escalaMetros = quadro === null ? 50 : quadro.largura > 380 ? 100 : 50;
  const rotuloDoRaio: Ponto = [mapa.centro_raio[0] - mapa.raio_m * 0.71 - 16 * metro, mapa.centro_raio[1] + mapa.raio_m * 0.71 + 6 * metro];
  const bloqueios =
    quadro === null
      ? []
      : [
          caixaDaTela(quadro, 0, altura - 58, escalaMetros * quadro.pixelsPorMetro + 100, 58),
          caixaDaTela(quadro, largura - 58, 0, 58, 72),
          caixaDaTela(quadro, 0, 0, largura, 14),
          caixaDaTela(quadro, 0, altura - 14, largura, 14),
          caixaDaTela(quadro, 0, 0, 14, altura),
          caixaDaTela(quadro, largura - 14, 0, 14, altura),
        ];
  const selos = posicoesDosSelos(
    mapa.ruas_com_ocorrencias.map((r) => r.trechos),
    visiveis.raio ? [...centrosDosAlvos, rotuloDoRaio] : centrosDosAlvos,
    24 * metro,
    { centro: mapa.centro_raio, raio: mapa.raio_m },
    visiveis.raio ? 9 * metro : -12 * metro,
    bloqueios,
  );
  const pulsoTela = centroAlvo !== null && quadro !== null ? paraTela(centroAlvo, quadro) : null;

  return (
    <View
      onLayout={aoMedir}
      style={[estilos.moldura, { height: altura, backgroundColor: paleta.fundo, borderColor: ornamental ? 'transparent' : paleta.linha }]}
      accessibilityRole="image"
      accessibilityLabel={
        ornamental
          ? 'Desenho de quadras e edificações do cadastro do Recife'
          : `Mapa cadastral com ${mapa.edificacoes.length} edificações, ${mapa.ruas_com_ocorrencias.length} ruas com atendimentos da Defesa Civil e raio de ${mapa.raio_m} metros`
      }
    >
      {quadro === null ? null : (
        <>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: base }]}>
            <Svg width={largura} height={altura} viewBox={quadro.viewBox}>
              <Path d={caminhoDosAneis(mapa.quadras)} fill={paleta.mapaQuadra} />
              <Path
                d={caminhoDosAneis(mapa.lotes)}
                fill="none"
                stroke={paleta.mapaEdificacaoBorda}
                strokeWidth={0.5 * metro}
                strokeOpacity={0.45}
              />
              <Path
                d={caminhoDosAneis(mapa.edificacoes)}
                fill={paleta.mapaEdificacao}
                stroke={paleta.mapaEdificacaoBorda}
                strokeWidth={0.6 * metro}
              />
            </Svg>
          </Animated.View>

          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: contexto }]}>
            <Svg width={largura} height={altura} viewBox={quadro.viewBox}>
              <Defs>
                <Pattern id={`${idHachura}-alta`} width={5 * metro} height={5 * metro} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <Line x1={0} y1={0} x2={0} y2={5 * metro} stroke={paleta.azulejo} strokeWidth={1.1 * metro} opacity={0.38} />
                </Pattern>
                <Pattern id={`${idHachura}-media`} width={9 * metro} height={9 * metro} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <Line x1={0} y1={0} x2={0} y2={9 * metro} stroke={paleta.azulejo} strokeWidth={0.9 * metro} opacity={0.22} />
                </Pattern>
              </Defs>
              {visiveis.suscetibilidade && !ornamental
                ? manchasVisiveis(mapa).map((area, indice) => (
                    <Path
                      key={`sus-${indice}`}
                      d={caminhoDoAnel(area.pontos)}
                      fill={`url(#${idHachura}-${area.nivel})`}
                      stroke={paleta.azulejo}
                      strokeWidth={1 * metro}
                      strokeOpacity={area.nivel === 'alta' ? 0.6 : 0.3}
                    />
                  ))
                : null}
              {visiveis.ocorrencias && !ornamental
                ? mapa.ruas_com_ocorrencias.map((rua) => (
                    <Path
                      key={`rua-${rua.nome}`}
                      d={rua.trechos.map(caminhoDaLinha).join('')}
                      fill="none"
                      stroke={paleta.azulejo}
                      strokeWidth={6 * metro}
                      strokeOpacity={0.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
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
                ? mapa.ruas_com_ocorrencias.map((rua, indice) => {
                    const posicao = selos[indice];
                    if (posicao === undefined) {
                      throw new Error(`selo sem posição para ${rua.nome}`);
                    }
                    const [x, y] = posicao;
                    return (
                      <G key={`selo-${rua.nome}`}>
                        <Circle cx={x} cy={-y} r={10 * metro} fill={paleta.azulejo} stroke={paleta.fundo} strokeWidth={2 * metro} />
                        <TextoSvg
                          x={x}
                          y={-y + 3.8 * metro}
                          fontSize={10.5 * metro}
                          fontFamily={familias.dadoForte}
                          textAnchor="middle"
                          fill={paleta.sobreTinta}
                        >
                          {String(rua.n)}
                        </TextoSvg>
                      </G>
                    );
                  })
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
                  <G key={desenho.id}>
                    <Path
                      d={caminhoDoAnel(desenho.pontos)}
                      fill={ativo || ornamental ? paleta.azulejo : paleta.azulejoFundo}
                      fillOpacity={ativo || ornamental ? 0.92 : 0.95}
                      stroke={paleta.azulejo}
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

          {aoSelecionar === undefined
            ? null
            : alvosDesenhados.map((desenho) => {
                const posicao = paraTela(centroide(desenho.pontos), quadro);
                return (
                  <Pressable
                    key={`toque-${desenho.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Escolher a candidata ${desenho.id} no mapa`}
                    onPress={() => aoSelecionar(desenho.id)}
                    style={[estilos.alvoDeToque, { left: posicao.x - 26, top: posicao.y - 26 }]}
                  />
                );
              })}

          {ornamental ? null : (
            <>
              <View pointerEvents="none" style={[estilos.norte, { backgroundColor: paleta.superficie, borderColor: paleta.linha }]}>
                <Svg width={14} height={18} viewBox="0 0 14 18">
                  <Path d="M7 0 L13 16 L7 12 L1 16 Z" fill={paleta.tinta} />
                </Svg>
                <Texto variante="carimbo">N</Texto>
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
  const itens: { chave: string; rotulo: string; simbolo: 'alvo' | 'ocorrencia' | 'raio' | NivelMancha }[] = [];
  if (comAlvo) {
    itens.push({ chave: 'alvo', rotulo: 'edificação do anúncio', simbolo: 'alvo' });
  }
  if (mapa.ruas_com_ocorrencias.length > 0) {
    itens.push({ chave: 'oc', rotulo: 'rua com atendimentos da Defesa Civil; o número vale para a rua inteira no bairro', simbolo: 'ocorrencia' });
  }
  itens.push({ chave: 'raio', rotulo: `raio de ${mapa.raio_m} m usado para escolher as ruas`, simbolo: 'raio' });
  const manchas = new Map(manchasVisiveis(mapa).map((m) => [`${m.nivel}-${m.tipo}`, m]));
  for (const [chave, mancha] of manchas) {
    itens.push({
      chave,
      rotulo: `suscetibilidade ${mancha.nivel === 'alta' ? 'alta' : 'média'} a ${mancha.tipo} (SGB 2015)`,
      simbolo: mancha.nivel,
    });
  }
  return (
    <View style={estilos.legenda}>
      {itens.map((item) => (
        <View key={item.chave} style={estilos.itemLegenda}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            {item.simbolo === 'alvo' ? <Rect x={1} y={2} width={12} height={10} fill={paleta.azulejo} /> : null}
            {item.simbolo === 'ocorrencia' ? (
              <>
                <Line x1={1} y1={11} x2={13} y2={3} stroke={paleta.azulejo} strokeWidth={4} strokeOpacity={0.5} strokeLinecap="round" />
                <Circle cx={7} cy={7} r={3.4} fill={paleta.azulejo} />
              </>
            ) : null}
            {item.simbolo === 'raio' ? (
              <Circle cx={7} cy={7} r={5.5} fill="none" stroke={paleta.tinta} strokeWidth={1.2} strokeDasharray="2.5 2" />
            ) : null}
            {item.simbolo === 'alta' || item.simbolo === 'media' ? (
              <>
                <Rect x={1} y={1} width={12} height={12} fill="none" stroke={paleta.azulejo} strokeWidth={1} strokeOpacity={item.simbolo === 'alta' ? 1 : 0.5} />
                {(item.simbolo === 'alta' ? [-6, -2, 2, 6, 10] : [-4, 4]).map((desvio) => (
                  <Line
                    key={desvio}
                    x1={Math.max(1, 1 + desvio)}
                    y1={Math.max(1, 1 - desvio)}
                    x2={Math.min(13, 13 + desvio)}
                    y2={Math.min(13, 13 - desvio)}
                    stroke={paleta.azulejo}
                    strokeWidth={1}
                    strokeOpacity={item.simbolo === 'alta' ? 0.9 : 0.6}
                  />
                ))}
              </>
            ) : null}
          </Svg>
          <Texto variante="pequeno" tom="tintaSuave" style={estilos.textoLegenda}>
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
  alvoDeToque: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
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
    maxWidth: '100%',
  },
  textoLegenda: {
    flexShrink: 1,
  },
});
