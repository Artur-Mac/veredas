import Feather from '@expo/vector-icons/Feather';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useAparecer } from '@/componentes/animacao';
import { Botao, vibrarLeve } from '@/componentes/Botao';
import { MapaCadastral } from '@/componentes/mapa/MapaCadastral';
import { SilhuetaDoPredio } from '@/componentes/SilhuetaDoPredio';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { andarEfetivo } from '@/dominio/camposDeclarados';
import type { Edificio, Ponto } from '@/dominio/esquema';
import { area, codigoEdificacao, enderecoCurto, plural } from '@/dominio/formato';
import type { Resolucao } from '@/dominio/visao';
import { useEstado, useRegistro } from '@/estado/armazenamento';
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
  pegada,
  andar,
  ativa,
  indice,
  aoEscolher,
}: {
  candidata: Edificio;
  pegada: Ponto[] | null;
  andar: number | null;
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
            {`lote ${codigoEdificacao(candidata.dsqfl)}`}
          </Texto>
          {candidata.evidencias.map((evidencia) => (
            <View key={evidencia} style={estilos.evidencia}>
              <View style={[estilosMarcador.marcador, { backgroundColor: paleta.tintaFraca }]} />
              <Texto variante="pequeno" tom="tintaSuave" style={estilos.textoEvidencia}>
                {evidencia}
              </Texto>
            </View>
          ))}
        </View>
        {pegada === null || candidata.pavimentos === null ? null : (
          <View style={estilos.silhueta}>
            <SilhuetaDoPredio
              pegada={pegada}
              pavimentos={candidata.pavimentos}
              andarDeclarado={andar}
              contorno={candidata.contorno}
              altura={104}
              compacta
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function Confirmacao() {
  const { id, de } = useLocalSearchParams<{ id: string; de?: string }>();
  const { despachar } = useEstado();
  const { paleta } = useTema();
  const registro = useRegistro(id);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const dossie = dossiePorId(id);

  if (dossie === null) {
    return <Redirect href="/demonstracao" />;
  }
  if (dossie.identidade.status === 'resolvido') {
    return <Redirect href={{ pathname: '/dossie/[id]', params: { id } }} />;
  }

  const mapa = mapaPorId(id);
  const candidatas = dossie.identidade.candidatas;
  const rua = dossie.anuncio.campos_declarados.logradouro ?? 'rua do anúncio';
  const andar = andarEfetivo(dossie, registro.correcoes.andar);
  const semAndarCompativel = andar !== null && candidatas.every((c) => c.pavimentos !== null && andar > c.pavimentos);
  const pegadaDe = (candidata: string) => mapa.alvos.find((alvo) => alvo.id === candidata)?.pontos ?? null;

  const concluir = (resolucao: Resolucao) => {
    despachar({ tipo: 'resolver', id, resolucao });
    const parametros = resolucao.tipo === 'rua' ? { id, modo: 'rua' } : { id, edificio: resolucao.candidata };
    if (de === 'dossie') {
      router.dismissTo({ pathname: '/dossie/[id]', params: parametros });
      return;
    }
    router.replace({ pathname: '/dossie/[id]', params: parametros });
  };

  return (
    <Tela
      grade
      cabecalho={<Cabecalho titulo="Confirmação do edifício" />}
      rodape={
        <View style={estilos.rodape}>
          <Botao
            rotulo={escolhida === null ? 'Escolha um prédio no mapa' : `Confirmar o prédio ${escolhida}`}
            icone="check"
            desativado={escolhida === null}
            aoPressionar={() => {
              if (escolhida !== null) {
                concluir({ tipo: 'candidata', candidata: escolhida });
              }
            }}
          />
          <Botao rotulo="Nenhum destes ou não sei" variante="texto" aoPressionar={() => concluir({ tipo: 'rua' })} />
        </View>
      }
    >
      <View style={estilos.topo}>
        <Texto variante="rotulo" tom="tintaSuave">
          confiança média · falta um toque seu
        </Texto>
        <Texto variante="titulo">Qual é o prédio?</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          {`O anúncio não informa o número. Na ${rua}, ${plural(candidatas.length, 'edificação combina', 'edificações combinam')} com parte do que o anúncio declara. Compare as evidências de cada uma.`}
        </Texto>
      </View>

      {semAndarCompativel ? (
        <View style={[estilos.aviso, { borderColor: paleta.jambo, backgroundColor: paleta.jamboFundo }]} accessibilityRole="alert">
          <Feather name="alert-triangle" size={16} color={paleta.jambo} />
          <Texto variante="pequeno" style={estilos.textoAviso}>
            {`Nenhuma candidata tem pavimentos para o ${andar}º andar do anúncio. Escolher uma não resolve essa divergência: ela segue como pergunta no dossiê.`}
          </Texto>
        </View>
      ) : null}

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
        <Texto variante="pequeno" tom="tintaSuave">
          Toque numa letra do mapa ou num cartão abaixo para escolher.
        </Texto>
      </View>

      <View style={estilos.lista} accessibilityRole="radiogroup">
        {candidatas.map((candidata, indice) => (
          <OpcaoCandidata
            key={candidata.id}
            candidata={candidata}
            pegada={pegadaDe(candidata.id)}
            andar={andar}
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
  aviso: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: raio.medio,
    padding: 12,
    alignItems: 'flex-start',
  },
  textoAviso: {
    flex: 1,
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
  silhueta: {
    width: 72,
    alignSelf: 'center',
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

const estilosMarcador = StyleSheet.create({
  marcador: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },
});
