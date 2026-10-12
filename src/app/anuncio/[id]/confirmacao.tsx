import Feather from '@expo/vector-icons/Feather';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useAparecer } from '@/componentes/animacao';
import { Botao, vibrarLeve } from '@/componentes/Botao';
import { LegendaMapa, MapaCadastral } from '@/componentes/mapa/MapaCadastral';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import type { Edificio } from '@/dominio/esquema';
import { area, codigoEdificacao, enderecoCurto, plural } from '@/dominio/formato';
import { useEstado } from '@/estado/armazenamento';
import { dossiePorId, mapaPorId } from '@/fixtures';
import { useTema } from '@/tema/TemaProvider';
import { raio } from '@/tema/tipografia';

function fatos(edificio: Edificio): string {
  return [
    edificio.pavimentos === null ? null : plural(edificio.pavimentos, 'pavimento', 'pavimentos'),
    edificio.ano_construcao === null ? null : `construção de ${edificio.ano_construcao}`,
    edificio.unidades === null ? null : plural(edificio.unidades, 'unidade', 'unidades'),
    edificio.area_construida_m2 === null ? null : `${area(Math.round(edificio.area_construida_m2))} construídos`,
  ]
    .filter((parte): parte is string => parte !== null)
    .join(' · ');
}

function OpcaoCandidata({
  candidata,
  ativa,
  indice,
  aoEscolher,
}: {
  candidata: Edificio;
  ativa: boolean;
  indice: number;
  aoEscolher: () => void;
}) {
  const { paleta } = useTema();
  const aparecer = useAparecer(200 + indice * 90);
  return (
    <Animated.View style={aparecer}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: ativa }}
        accessibilityLabel={`Candidata ${candidata.id}, ${candidata.endereco_oficial}`}
        onPress={() => {
          vibrarLeve();
          aoEscolher();
        }}
        style={[
          estilos.opcao,
          {
            backgroundColor: ativa ? paleta.azulejoFundo : paleta.superficie,
            borderColor: ativa ? paleta.azulejo : paleta.linha,
            borderWidth: ativa ? 2 : 1,
          },
        ]}
      >
        <View style={[estilos.letra, { backgroundColor: ativa ? paleta.tinta : 'transparent', borderColor: paleta.tinta }]}>
          <Texto variante="dadoGrande" tom={ativa ? 'sobreTinta' : 'tinta'} style={estilos.textoLetra}>
            {candidata.id}
          </Texto>
        </View>
        <View style={estilos.textoOpcao}>
          <Texto variante="destaque">{enderecoCurto(candidata.endereco_oficial)}</Texto>
          <Texto variante="dado" tom="tintaSuave">
            {fatos(candidata)}
          </Texto>
          <Texto variante="dado" tom="tintaFraca">
            {`edificação ${codigoEdificacao(candidata.dsqfl)}`}
          </Texto>
          {candidata.evidencias.map((evidencia) => (
            <View key={evidencia} style={estilos.evidencia}>
              <Feather name="check" size={13} color={paleta.mare} />
              <Texto variante="pequeno" tom="tintaSuave" style={estilos.textoEvidencia}>
                {evidencia}
              </Texto>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Confirmacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { despachar } = useEstado();
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const dossie = dossiePorId(id);

  if (dossie === null) {
    return <Redirect href={{ pathname: '/demonstracao', params: { link: id } }} />;
  }
  if (dossie.identidade.status === 'resolvido') {
    return <Redirect href={{ pathname: '/dossie/[id]', params: { id } }} />;
  }

  const mapa = mapaPorId(id);
  const candidatas = dossie.identidade.candidatas;
  const rua = dossie.anuncio.campos_declarados.logradouro ?? 'nesta rua';

  return (
    <Tela
      cabecalho={<Cabecalho titulo="Confirmação do edifício" />}
      rodape={
        <View style={estilos.rodape}>
          <Botao
            rotulo={escolhida === null ? 'Escolha um prédio no mapa' : `Confirmar o prédio ${escolhida}`}
            icone="check"
            desativado={escolhida === null}
            aoPressionar={() => {
              if (escolhida === null) {
                return;
              }
              despachar({ tipo: 'resolver', id, resolucao: { tipo: 'candidata', candidata: escolhida } });
              router.replace({ pathname: '/dossie/[id]', params: { id, edificio: escolhida } });
            }}
          />
          <Botao
            rotulo="Nenhum destes ou não sei"
            variante="texto"
            aoPressionar={() => {
              despachar({ tipo: 'resolver', id, resolucao: { tipo: 'rua' } });
              router.replace({ pathname: '/dossie/[id]', params: { id, modo: 'rua' } });
            }}
          />
        </View>
      }
    >
      <View style={estilos.topo}>
        <Texto variante="rotulo" tom="tintaSuave">
          confiança média · falta um toque seu
        </Texto>
        <Texto variante="titulo">Qual é o prédio?</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          {`O anúncio não informa o número. Encontramos ${plural(candidatas.length, 'edificação compatível', 'edificações compatíveis')} na ${rua}. Não temos certeza de qual é.`}
        </Texto>
      </View>

      <View style={estilos.mapa}>
        <MapaCadastral
          mapa={mapa}
          alvos={candidatas.map((c) => c.id)}
          selecionado={escolhida}
          aoSelecionar={(candidata) => {
            vibrarLeve();
            setEscolhida(candidata);
          }}
          letras
          altura={320}
          camadas={{ ocorrencias: false, raio: false, suscetibilidade: false }}
        />
        <LegendaMapa mapa={{ ...mapa, ruas_com_ocorrencias: [], suscetibilidade: [] }} comAlvo={false} />
      </View>

      <View style={estilos.lista} accessibilityRole="radiogroup">
        {candidatas.map((candidata, indice) => (
          <OpcaoCandidata
            key={candidata.id}
            candidata={candidata}
            indice={indice}
            ativa={escolhida === candidata.id}
            aoEscolher={() => setEscolhida(candidata.id)}
          />
        ))}
      </View>

      <Texto variante="pequeno" tom="tintaFraca">
        Sua confirmação fica registrada como origem humana da identificação. Os fatos do dossiê passam a valer para o prédio que você escolher.
      </Texto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: 8,
    paddingTop: 4,
  },
  mapa: {
    gap: 10,
  },
  lista: {
    gap: 10,
  },
  opcao: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: raio.grande,
    padding: 14,
  },
  letra: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoLetra: {
    fontSize: 18,
    lineHeight: 22,
  },
  textoOpcao: {
    flex: 1,
    gap: 4,
  },
  evidencia: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  textoEvidencia: {
    flex: 1,
  },
  rodape: {
    gap: 2,
  },
});
