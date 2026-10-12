import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Text as TextoSvg } from 'react-native-svg';

import type { Categoria } from '@/dominio/esquema';
import { area, numero } from '@/dominio/formato';
import { useTema } from '@/tema/TemaProvider';
import { familias } from '@/tema/tipografia';

import { corDaCategoria, SinalCategoria } from '../Carimbo';
import { Texto } from '../Texto';

interface Item {
  rotulo: string;
  valor_m2: number;
  categoria: Categoria;
}

function passoDosTicks(amplitude: number): number {
  if (amplitude <= 12) {
    return 2;
  }
  if (amplitude <= 30) {
    return 5;
  }
  return 10;
}

export function ComparacaoArea({ itens }: { itens: Item[] }) {
  const { paleta } = useTema();
  const [largura, setLargura] = useState(0);
  const valores = itens.map((i) => i.valor_m2);
  const menor = Math.min(...valores);
  const maior = Math.max(...valores);
  const amplitude = Math.max(maior - menor, 4);
  const passo = passoDosTicks(amplitude);
  const inicio = Math.floor((menor - amplitude * 0.25) / passo) * passo;
  const fim = Math.ceil((maior + amplitude * 0.25) / passo) * passo;
  const margem = 18;
  const altura = 30 + itens.length * 26;
  const eixoY = altura - 22;
  const posicao = (valor: number) => margem + ((valor - inicio) / (fim - inicio)) * (largura - margem * 2);
  const ticks: number[] = [];
  for (let t = inicio; t <= fim + 1e-9; t += passo) {
    ticks.push(t);
  }
  const ordenados = [...itens].sort((a, b) => a.valor_m2 - b.valor_m2);

  return (
    <View style={estilos.bloco}>
      <View onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)} style={{ height: altura }}>
        {largura === 0 ? null : (
          <Svg width={largura} height={altura}>
            <Line x1={margem} y1={eixoY} x2={largura - margem} y2={eixoY} stroke={paleta.linhaForte} strokeWidth={1} />
            {ticks.map((t) => (
              <TextoSvg
                key={`t-${t}`}
                x={posicao(t)}
                y={eixoY + 16}
                fontSize={10}
                fontFamily={familias.dado}
                textAnchor="middle"
                fill={paleta.tintaFraca}
              >
                {numero(t)}
              </TextoSvg>
            ))}
            {ticks.map((t) => (
              <Line key={`l-${t}`} x1={posicao(t)} y1={eixoY - 3} x2={posicao(t)} y2={eixoY + 3} stroke={paleta.linhaForte} strokeWidth={1} />
            ))}
            {ordenados.map((item, indice) => {
              const x = posicao(item.valor_m2);
              const y = 14 + indice * 26;
              const { cor } = corDaCategoria(item.categoria, paleta);
              return (
                <Line
                  key={`g-${item.rotulo}`}
                  x1={x}
                  y1={y + 6}
                  x2={x}
                  y2={eixoY}
                  stroke={cor}
                  strokeWidth={1.2}
                  strokeDasharray={item.categoria === 'declarado_anunciante' ? '3 2' : undefined}
                />
              );
            })}
          </Svg>
        )}
        {largura === 0
          ? null
          : ordenados.map((item, indice) => {
              const x = posicao(item.valor_m2);
              const y = 14 + indice * 26;
              const esquerda = x > largura * 0.6;
              return (
                <View
                  key={`r-${item.rotulo}`}
                  style={[
                    estilos.marcador,
                    esquerda ? { right: largura - x - 6, flexDirection: 'row-reverse' } : { left: x - 6 },
                    { top: y - 6 },
                  ]}
                >
                  <SinalCategoria categoria={item.categoria} tamanho={12} />
                  <Texto variante="dado" style={{ color: corDaCategoria(item.categoria, paleta).cor }}>
                    {area(item.valor_m2)}
                  </Texto>
                </View>
              );
            })}
      </View>
      <View style={estilos.legenda}>
        {itens.map((item) => (
          <View key={item.rotulo} style={estilos.itemLegenda}>
            <SinalCategoria categoria={item.categoria} tamanho={10} />
            <Texto variante="pequeno" tom="tintaSuave">
              {`${item.rotulo}: ${area(item.valor_m2)}`}
            </Texto>
          </View>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: {
    gap: 8,
  },
  marcador: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legenda: {
    gap: 4,
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
