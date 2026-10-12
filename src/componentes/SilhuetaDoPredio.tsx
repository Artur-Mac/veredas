import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Polygon, Text as TextoSvg } from 'react-native-svg';

import type { Edificio, Ponto } from '@/dominio/esquema';
import { useTema } from '@/tema/TemaProvider';
import { familias } from '@/tema/tipografia';

interface Props {
  pegada: Ponto[];
  pavimentos: number;
  andarDeclarado: number | null;
  contorno: Edificio['contorno'];
  altura?: number;
  compacta?: boolean;
}

interface Face {
  a: Ponto;
  b: Ponto;
  profundidade: number;
  clara: boolean;
}

type PontoTela = [number, number];

const alturaDoPavimento = 3.2;
const cosseno = Math.cos(Math.PI / 6);
const seno = Math.sin(Math.PI / 6);
const larguraDosRotulos = 128;
const folga = 10;
const distanciaMinimaEntreRotulos = 36;
const tracejadoDoLote = '4 3';

function anelAberto(anel: Ponto[]): Ponto[] {
  const primeiro = anel[0];
  const ultimo = anel[anel.length - 1];
  if (anel.length > 3 && primeiro !== undefined && ultimo !== undefined && primeiro[0] === ultimo[0] && primeiro[1] === ultimo[1]) {
    return anel.slice(0, -1);
  }
  return anel;
}

function areaComSinal(anel: Ponto[]): number {
  return anel.reduce((soma, atual, i) => {
    const proximo = anel[(i + 1) % anel.length] ?? atual;
    return soma + atual[0] * proximo[1] - proximo[0] * atual[1];
  }, 0);
}

function alinharAoEixoMaior(anel: Ponto[]): Ponto[] {
  let maior = 0;
  let angulo = 0;
  anel.forEach((a, i) => {
    const b = anel[(i + 1) % anel.length];
    if (b === undefined) {
      return;
    }
    const comprimento = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (comprimento > maior) {
      maior = comprimento;
      angulo = Math.atan2(b[1] - a[1], b[0] - a[0]);
    }
  });
  const cx = anel.reduce((soma, p) => soma + p[0], 0) / anel.length;
  const cy = anel.reduce((soma, p) => soma + p[1], 0) / anel.length;
  const c = Math.cos(-angulo);
  const s = Math.sin(-angulo);
  return anel.map(([x, y]) => [(x - cx) * c - (y - cy) * s, (x - cx) * s + (y - cy) * c]);
}

function facesVisiveis(anel: Ponto[]): Face[] {
  const antiHorario = areaComSinal(anel) > 0;
  const faces: Face[] = [];
  anel.forEach((a, i) => {
    const b = anel[(i + 1) % anel.length];
    if (b === undefined) {
      return;
    }
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const nx = antiHorario ? dy : -dy;
    const ny = antiHorario ? -dx : dx;
    if (nx + ny >= 0) {
      return;
    }
    faces.push({ a, b, profundidade: a[0] + a[1] + b[0] + b[1], clara: Math.abs(nx) >= Math.abs(ny) });
  });
  return faces.sort((f1, f2) => f2.profundidade - f1.profundidade);
}

function projetarIsometrico([x, y]: Ponto, z: number): PontoTela {
  return [(x - y) * cosseno, -(x + y) * seno - z];
}

function maisADireita(pontos: PontoTela[]): PontoTela {
  return pontos.reduce((melhor, p) => (p[0] > melhor[0] ? p : melhor), pontos[0] ?? [0, 0]);
}

function texto(lista: PontoTela[]): string {
  return lista.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

export function SilhuetaDoPredio({ pegada, pavimentos, andarDeclarado, contorno, altura = 210, compacta = false }: Props) {
  const { paleta } = useTema();
  const [largura, setLargura] = useState(0);
  const anel = alinharAoEixoMaior(anelAberto(pegada));
  const faces = facesVisiveis(anel);
  const tracejado = contorno === 'lote' ? tracejadoDoLote : undefined;
  const topoDoPredio = pavimentos * alturaDoPavimento;
  const andarFlutua = andarDeclarado !== null && andarDeclarado > pavimentos;
  const baseDoAndar = andarDeclarado === null ? null : Math.max(andarDeclarado - 1, 0) * alturaDoPavimento;
  const topoDoDesenho = baseDoAndar === null ? topoDoPredio : Math.max(topoDoPredio, baseDoAndar + alturaDoPavimento);

  const brutos = anel.flatMap((p) => [projetarIsometrico(p, 0), projetarIsometrico(p, topoDoDesenho)]);
  const minX = Math.min(...brutos.map((p) => p[0]));
  const maxX = Math.max(...brutos.map((p) => p[0]));
  const minY = Math.min(...brutos.map((p) => p[1]));
  const maxY = Math.max(...brutos.map((p) => p[1]));
  const larguraDoDesenho = Math.max(largura - (compacta ? 0 : larguraDosRotulos) - folga * 2, 1);
  const alturaDoDesenho = altura - folga * 2;
  const escala = Math.min(larguraDoDesenho / Math.max(maxX - minX, 1), alturaDoDesenho / Math.max(maxY - minY, 1));
  const deslocX = folga + (larguraDoDesenho - (maxX - minX) * escala) / 2 - minX * escala;
  const deslocY = folga + (alturaDoDesenho - (maxY - minY) * escala) / 2 - minY * escala;
  const projetar = (p: Ponto, z: number): PontoTela => {
    const [x, y] = projetarIsometrico(p, z);
    return [x * escala + deslocX, y * escala + deslocY];
  };
  const faixa = (face: Face, z0: number, z1: number) => texto([projetar(face.a, z0), projetar(face.b, z0), projetar(face.b, z1), projetar(face.a, z1)]);

  const lajes = Array.from({ length: Math.max(pavimentos - 1, 0) }, (_, i) => (i + 1) * alturaDoPavimento);
  const base = anel.map((p) => projetar(p, 0));
  const topo = anel.map((p) => projetar(p, topoDoPredio));
  const ancoraCadastro = maisADireita(topo);
  const ancoraAndar =
    baseDoAndar === null ? null : maisADireita(anel.map((p) => projetar(p, baseDoAndar + alturaDoPavimento / 2)));
  const xRotulo = largura - larguraDosRotulos + 6;
  const yCadastro = ancoraCadastro[1];
  const yAndar =
    ancoraAndar === null
      ? null
      : andarFlutua
        ? Math.min(ancoraAndar[1], yCadastro - distanciaMinimaEntreRotulos)
        : Math.max(ancoraAndar[1], yCadastro + distanciaMinimaEntreRotulos);
  const extremos = [
    anel.reduce((m, p) => (p[0] - p[1] < m[0] - m[1] ? p : m)),
    anel.reduce((m, p) => (p[0] - p[1] > m[0] - m[1] ? p : m)),
  ];
  const sombra = base.map(([x, y]): PontoTela => [x + 7, y + 3]);

  const descricao = [
    `Volume desenhado a partir do cadastro, com o contorno ${contorno === 'lote' ? 'do lote' : 'da edificação'}: ${pavimentos} pavimentos.`,
    andarDeclarado === null
      ? null
      : `O anúncio declara ${andarDeclarado}º andar${andarFlutua ? ', acima do último pavimento cadastrado' : ''}.`,
  ]
    .filter((parte): parte is string => parte !== null)
    .join(' ');

  return (
    <View
      onLayout={(evento: LayoutChangeEvent) => setLargura(evento.nativeEvent.layout.width)}
      style={[estilos.moldura, { height: altura }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={descricao}
    >
      {largura === 0 || anel.length < 3 ? null : (
        <Svg width={largura} height={altura}>
          <Polygon points={texto(sombra)} fill={paleta.sombra} />
          {faces.map((face, indice) => (
            <G key={`face-${indice}`}>
              <Polygon points={faixa(face, 0, topoDoPredio)} fill={paleta.superficie} />
              <Polygon
                points={faixa(face, 0, topoDoPredio)}
                fill={paleta.azulejo}
                fillOpacity={face.clara ? 0.16 : 0.32}
                stroke={paleta.azulejo}
                strokeWidth={1}
                strokeDasharray={tracejado}
                strokeLinejoin="round"
              />
              {lajes.map((z) => {
                const [x1, y1] = projetar(face.a, z);
                const [x2, y2] = projetar(face.b, z);
                return (
                  <Line key={`laje-${z}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={paleta.azulejo} strokeWidth={0.6} strokeOpacity={0.5} />
                );
              })}
              {baseDoAndar === null || andarFlutua ? null : (
                <Polygon
                  points={faixa(face, baseDoAndar, baseDoAndar + alturaDoPavimento)}
                  fill={paleta.jambo}
                  fillOpacity={0.85}
                  stroke={paleta.jambo}
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
              )}
            </G>
          ))}
          <Polygon points={texto(topo)} fill={paleta.superficie} />
          <Polygon
            points={texto(topo)}
            fill={paleta.azulejo}
            fillOpacity={0.55}
            stroke={paleta.azulejo}
            strokeWidth={1}
            strokeDasharray={tracejado}
            strokeLinejoin="round"
          />
          {baseDoAndar === null || !andarFlutua ? null : (
            <G>
              {extremos.map((p, indice) => {
                const [x1, y1] = projetar(p, topoDoPredio);
                const [x2, y2] = projetar(p, baseDoAndar);
                return (
                  <Line key={`vao-${indice}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={paleta.grafite} strokeWidth={0.8} strokeDasharray="2 4" />
                );
              })}
              {faces.map((face, indice) => (
                <Polygon
                  key={`flutua-${indice}`}
                  points={faixa(face, baseDoAndar, baseDoAndar + alturaDoPavimento)}
                  fill={paleta.jambo}
                  fillOpacity={0.1}
                  stroke={paleta.jambo}
                  strokeWidth={1.3}
                  strokeDasharray="5 3"
                  strokeLinejoin="round"
                />
              ))}
              <Polygon
                points={texto(anel.map((p) => projetar(p, baseDoAndar + alturaDoPavimento)))}
                fill={paleta.jambo}
                fillOpacity={0.06}
                stroke={paleta.jambo}
                strokeWidth={1.3}
                strokeDasharray="5 3"
                strokeLinejoin="round"
              />
            </G>
          )}
          {compacta ? null : (
            <G>
              <Line
                x1={ancoraCadastro[0] + 4}
                y1={ancoraCadastro[1]}
                x2={xRotulo - 4}
                y2={yCadastro}
                stroke={paleta.azulejo}
                strokeWidth={0.8}
                strokeDasharray="1 3"
              />
              <TextoSvg x={xRotulo} y={yCadastro - 3} fontSize={9.5} fontFamily={familias.dadoMedio} fill={paleta.azulejo} letterSpacing={0.6}>
                {contorno === 'lote' ? 'CADASTRO DE LOTES' : 'CADASTRO'}
              </TextoSvg>
              <TextoSvg x={xRotulo} y={yCadastro + 11} fontSize={12.5} fontFamily={familias.textoMedio} fill={paleta.tinta}>
                {`${pavimentos} pavimentos`}
              </TextoSvg>
              {ancoraAndar === null || yAndar === null || andarDeclarado === null ? null : (
                <G>
                  <Line
                    x1={ancoraAndar[0] + 4}
                    y1={ancoraAndar[1]}
                    x2={xRotulo - 4}
                    y2={yAndar}
                    stroke={paleta.jambo}
                    strokeWidth={0.8}
                    strokeDasharray="1 3"
                  />
                  <TextoSvg x={xRotulo} y={yAndar - 3} fontSize={9.5} fontFamily={familias.dadoMedio} fill={paleta.jambo} letterSpacing={0.6}>
                    ANÚNCIO
                  </TextoSvg>
                  <TextoSvg x={xRotulo} y={yAndar + 11} fontSize={12.5} fontFamily={familias.textoMedio} fill={paleta.tinta}>
                    {`${andarDeclarado}º andar`}
                  </TextoSvg>
                </G>
              )}
            </G>
          )}
        </Svg>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  moldura: {
    width: '100%',
  },
});
