import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Dossie, Mapa } from '@/dominio/esquema';
import { area, moeda, plural } from '@/dominio/formato';
import { dossies, mapaPorId } from '@/fixtures';
import { rotuloOperacao } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { raio } from '@/tema/tipografia';

import { useAparecer } from './animacao';
import { useEscalaDeToque, vibrarLeve } from './Botao';
import { caixaDosPontos, caminhoDoAnel } from './mapa/geometria';
import { Texto } from './Texto';

export function PegadaEdificio({ mapa, tamanho = 56 }: { mapa: Mapa; tamanho?: number }) {
  const { paleta } = useTema();
  const pontos = mapa.alvos.flatMap((a) => a.pontos);
  if (pontos.length === 0) {
    return null;
  }
  const caixa = caixaDosPontos(pontos);
  const lado = Math.max(caixa.maxX - caixa.minX, caixa.maxY - caixa.minY) * 1.25;
  const cx = (caixa.minX + caixa.maxX) / 2;
  const cy = -(caixa.minY + caixa.maxY) / 2;
  const unico = mapa.alvos.length === 1;
  return (
    <Svg width={tamanho} height={tamanho} viewBox={`${cx - lado / 2} ${cy - lado / 2} ${lado} ${lado}`}>
      {mapa.alvos.map((alvo) => (
        <Path
          key={alvo.id}
          d={caminhoDoAnel(alvo.pontos)}
          fill={unico ? paleta.azulejo : 'none'}
          stroke={paleta.azulejo}
          strokeWidth={lado / 40}
          strokeDasharray={unico ? undefined : `${lado / 25} ${lado / 35}`}
        />
      ))}
    </Svg>
  );
}

function resumoDoAnuncio(dossie: Dossie): string {
  const c = dossie.anuncio.campos_declarados;
  return [
    c.quartos === null ? null : plural(c.quartos, 'quarto', 'quartos'),
    c.area_m2 === null ? null : area(c.area_m2),
    c.andar === null ? null : `${c.andar}º andar`,
  ]
    .filter((parte): parte is string => parte !== null)
    .join(' · ');
}

function ItemExemplo({ dossie, indice }: { dossie: Dossie; indice: number }) {
  const { paleta } = useTema();
  const aparecer = useAparecer(120 + indice * 90);
  const { estiloEscala, aoPressionarDentro, aoSoltar } = useEscalaDeToque();
  const campos = dossie.anuncio.campos_declarados;
  const mapa = mapaPorId(dossie.dossie_id);
  const semNumero = dossie.identidade.status === 'pendente_confirmacao';
  return (
    <Animated.View style={[aparecer, estiloEscala]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Verificar anúncio de ${rotuloOperacao[dossie.anuncio.operacao]} em ${campos.bairro ?? 'Recife'}`}
        onPressIn={aoPressionarDentro}
        onPressOut={aoSoltar}
        onPress={() => {
          vibrarLeve();
          router.push({ pathname: '/anuncio/[id]', params: { id: dossie.dossie_id } });
        }}
        style={[estilos.item, { backgroundColor: paleta.superficie, borderColor: paleta.linha }]}
      >
        <View style={[estilos.pegada, { backgroundColor: paleta.azulejoFundo }]}>
          <PegadaEdificio mapa={mapa} />
        </View>
        <View style={estilos.textoItem}>
          <Texto variante="rotulo" tom="tintaSuave">
            {`${rotuloOperacao[dossie.anuncio.operacao]} · ${campos.bairro ?? 'Recife'}`}
          </Texto>
          <Texto variante="destaque" numberOfLines={1}>
            {campos.logradouro === null ? 'Endereço não informado' : `${campos.logradouro}${campos.numero === null ? ', sem número' : `, ${campos.numero}`}`}
          </Texto>
          <Texto variante="pequeno" tom="tintaSuave">
            {resumoDoAnuncio(dossie)}
          </Texto>
          <View style={estilos.linhaPreco}>
            <Texto variante="dado" tom="jambo">
              {campos.preco === null ? 'preço não informado' : moeda(campos.preco)}
            </Texto>
            {semNumero ? (
              <Texto variante="rotulo" tom="grafite">
                prédio a confirmar
              </Texto>
            ) : null}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={paleta.tintaFraca} />
      </Pressable>
    </Animated.View>
  );
}

export function ListaDeExemplos() {
  return (
    <View style={estilos.lista}>
      {dossies.map((dossie, indice) => (
        <ItemExemplo key={dossie.dossie_id} dossie={dossie} indice={indice} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: raio.grande,
    padding: 12,
  },
  pegada: {
    width: 64,
    height: 64,
    borderRadius: raio.medio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoItem: {
    flex: 1,
    gap: 3,
  },
  linhaPreco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
});
