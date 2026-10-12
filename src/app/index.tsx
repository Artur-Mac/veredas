import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAparecer } from '@/componentes/animacao';
import { Botao, vibrarLeve } from '@/componentes/Botao';
import { ListaDeExemplos } from '@/componentes/ListaDeExemplos';
import { MapaCadastral } from '@/componentes/mapa/MapaCadastral';
import { Cabecalho, SeloDemonstracao, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { rotaParaTexto } from '@/entrada/RecebedorDeAnuncio';
import { useLinkNaAreaDeTransferencia } from '@/entrada/useLinkNaAreaDeTransferencia';
import { dossies, mapaPorId } from '@/fixtures';
import { nomeProduto } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { familias, raio } from '@/tema/tipografia';

function BotaoMeusDossies() {
  const { paleta } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Meus dossiês"
      hitSlop={10}
      onPress={() => router.push('/dossies')}
      style={({ pressed }) => [estilos.botaoIcone, { borderColor: paleta.linha, opacity: pressed ? 0.6 : 1 }]}
    >
      <Feather name="folder" size={18} color={paleta.tinta} />
    </Pressable>
  );
}

function AvisoAreaDeTransferencia({ link, aoAnalisar, aoDescartar }: { link: string; aoAnalisar: () => void; aoDescartar: () => void }) {
  const { paleta } = useTema();
  const aparecer = useAparecer(0, 16);
  return (
    <Animated.View style={[aparecer, estilos.aviso, { backgroundColor: paleta.tinta }]} accessibilityLiveRegion="polite">
      <View style={estilos.avisoTopo}>
        <Feather name="clipboard" size={18} color={paleta.sobreTinta} />
        <Texto variante="destaque" style={{ color: paleta.sobreTinta }}>
          Analisar este anúncio?
        </Texto>
      </View>
      <Texto variante="pequeno" style={{ color: paleta.sobreTinta }} numberOfLines={1}>
        {`Há um link copiado com ${link.length} caracteres.`}
      </Texto>
      <View style={estilos.avisoAcoes}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrarLeve();
            aoAnalisar();
          }}
          style={[estilos.avisoBotao, { backgroundColor: paleta.sobreTinta }]}
        >
          <Texto variante="corpoForte">Analisar</Texto>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={aoDescartar} style={estilos.avisoBotaoTexto}>
          <Texto variante="corpoForte" style={{ color: paleta.sobreTinta }}>
            Agora não
          </Texto>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function Entrada() {
  const { paleta } = useTema();
  const [texto, setTexto] = useState('');
  const { link, descartar } = useLinkNaAreaDeTransferencia();
  const heroi = useAparecer(0);
  const campo = useAparecer(160);
  const primeiro = dossies[0];

  const verificar = (conteudo: string) => {
    const limpo = conteudo.trim();
    if (limpo.length === 0) {
      return;
    }
    router.push(rotaParaTexto(limpo));
  };

  const colar = () => {
    Clipboard.getStringAsync()
      .then(setTexto)
      .catch((erro: unknown) => console.warn('Não foi possível colar da área de transferência.', erro));
  };

  return (
    <Tela cabecalho={<Cabecalho voltar={false} direita={<><SeloDemonstracao /><BotaoMeusDossies /></>} />}>
      <Animated.View style={[heroi, estilos.heroi]}>
        <Texto variante="rotulo" tom="mare">
          Recife · verificação de anúncio
        </Texto>
        <Texto variante="marca" accessibilityRole="header">
          {nomeProduto}
        </Texto>
        <Texto variante="titulo">Compartilhe ou cole o link do anúncio.</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          Mostramos o que os registros públicos dizem sobre o prédio, o que o anúncio declara e o que ainda falta confirmar antes da visita.
        </Texto>
      </Animated.View>

      {link === null ? null : (
        <AvisoAreaDeTransferencia
          link={link}
          aoAnalisar={() => {
            descartar();
            verificar(link);
          }}
          aoDescartar={descartar}
        />
      )}

      <Animated.View style={[campo, estilos.formulario]}>
        <View style={[estilos.campo, { backgroundColor: paleta.superficie, borderColor: paleta.linhaForte }]}>
          <Feather name="link-2" size={18} color={paleta.tintaFraca} />
          <TextInput
            id="link-anuncio"
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={() => verificar(texto)}
            placeholder="link do anúncio de qualquer portal"
            placeholderTextColor={paleta.tintaFraca}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            accessibilityLabel="Link do anúncio"
            style={[estilos.entrada, { color: paleta.tinta, fontFamily: familias.dado }]}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Colar da área de transferência" onPress={colar} hitSlop={8}>
            <Texto variante="rotulo" tom="azulejo">
              colar
            </Texto>
          </Pressable>
        </View>
        <Botao rotulo="Verificar anúncio" iconeDepois="arrow-right" aoPressionar={() => verificar(texto)} desativado={texto.trim().length === 0} />
        <Texto variante="pequeno" tom="tintaFraca">
          Sem cadastro. Você também pode tocar em compartilhar no app do portal e escolher o {nomeProduto}.
        </Texto>
      </Animated.View>

      {primeiro === undefined ? null : (
        <View style={estilos.ilustracao}>
          <MapaCadastral mapa={mapaPorId(primeiro.dossie_id)} alvos={['alvo']} ornamental altura={150} />
          <Texto variante="pequeno" tom="tintaFraca">
            Quadras e edificações desenhadas com o cadastro aberto da Prefeitura do Recife, sem mapa de terceiros.
          </Texto>
        </View>
      )}

      <View style={estilos.secao}>
        <Texto variante="rotulo" tom="tintaSuave">
          Anúncios de exemplo · dados reais de Recife
        </Texto>
        <ListaDeExemplos />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  heroi: {
    gap: 10,
    paddingTop: 12,
  },
  botaoIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aviso: {
    borderRadius: raio.grande,
    padding: 16,
    gap: 8,
  },
  avisoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avisoAcoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  avisoBotao: {
    borderRadius: raio.medio,
    paddingHorizontal: 18,
    minHeight: 44,
    justifyContent: 'center',
  },
  avisoBotaoTexto: {
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  formulario: {
    gap: 12,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.2,
    borderRadius: raio.medio,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  entrada: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
  },
  ilustracao: {
    gap: 8,
  },
  secao: {
    gap: 12,
  },
});
