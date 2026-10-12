import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Platform, Share, StyleSheet, TextInput, View } from 'react-native';

import { Botao } from '@/componentes/Botao';
import { DesvioDeRota } from '@/componentes/dossie/DesvioDeRota';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { useEstado, useRegistro } from '@/estado/armazenamento';
import { useVisaoDaRota } from '@/navegacao/useVisaoDaRota';
import { montarMensagem, partesDaMensagem } from '@/textos/mensagem';
import { nomeProduto } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { familias, raio } from '@/tema/tipografia';

type Retorno = 'copiado' | 'compartilhado' | null;

export default function Mensagem() {
  const resultado = useVisaoDaRota();
  const { despachar } = useEstado();
  const { paleta } = useTema();
  const id = resultado.tipo === 'pronto' ? resultado.id : '';
  const registro = useRegistro(id);
  const [retorno, setRetorno] = useState<Retorno>(null);

  if (resultado.tipo !== 'pronto') {
    return <DesvioDeRota resultado={resultado} />;
  }

  const gerada = montarMensagem(resultado.visao);
  const texto = registro.mensagem ?? gerada;
  const { perguntas, documentos } = partesDaMensagem(resultado.visao);
  const editada = registro.mensagem !== null && registro.mensagem !== gerada;

  const copiar = () => {
    Clipboard.setStringAsync(texto)
      .then(() => setRetorno('copiado'))
      .catch((erro: unknown) => console.error('Não foi possível copiar a mensagem.', erro));
  };

  const compartilhar = () => {
    if (Platform.OS === 'web') {
      copiar();
      return;
    }
    Share.share({ message: texto })
      .then((acao) => {
        if (acao.action === Share.sharedAction) {
          setRetorno('compartilhado');
        }
      })
      .catch((erro: unknown) => console.error('Não foi possível abrir o compartilhamento.', erro));
  };

  return (
    <Tela
      cabecalho={<Cabecalho titulo="Mensagem para o corretor" />}
      rodape={
        <View style={estilos.botoes}>
          <Botao rotulo="Copiar" icone="copy" aoPressionar={copiar} estilo={estilos.botao} />
          <Botao rotulo="Compartilhar" icone="share-2" variante="secundario" aoPressionar={compartilhar} estilo={estilos.botao} />
        </View>
      }
    >
      <View style={estilos.topo}>
        <Texto variante="titulo">Pergunte antes de ir.</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          {`Texto montado com ${perguntas.length} perguntas e ${documentos.length} documentos que nenhum registro respondeu. Edite à vontade.`}
        </Texto>
      </View>

      <View style={[estilos.folha, { backgroundColor: paleta.superficie, borderColor: paleta.linha }]}>
        <TextInput
          id="texto-mensagem"
          value={texto}
          onChangeText={(novo) => {
            setRetorno(null);
            despachar({ tipo: 'salvarMensagem', id, texto: novo });
          }}
          multiline
          scrollEnabled={false}
          accessibilityLabel="Texto da mensagem para o corretor"
          style={[estilos.campo, { color: paleta.tinta, fontFamily: familias.texto }]}
        />
      </View>

      {editada ? (
        <Botao
          rotulo="Voltar ao texto gerado"
          variante="texto"
          icone="rotate-ccw"
          aoPressionar={() => despachar({ tipo: 'salvarMensagem', id, texto: null })}
        />
      ) : null}

      {retorno === null ? null : (
        <View style={[estilos.retorno, { backgroundColor: paleta.mareFundo }]} accessibilityLiveRegion="polite">
          <Feather name="check" size={16} color={paleta.mare} />
          <Texto variante="corpoForte" tom="mare">
            {retorno === 'copiado' ? 'Mensagem copiada.' : 'Compartilhamento aberto.'}
          </Texto>
        </View>
      )}

      <View style={[estilos.aviso, { borderColor: paleta.linha }]}>
        <Feather name="lock" size={14} color={paleta.tintaSuave} />
        <Texto variante="pequeno" tom="tintaSuave" style={estilos.textoAviso}>
          {`O ${nomeProduto} não envia nada. Você escolhe o aplicativo e a pessoa.`}
        </Texto>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: 8,
    paddingTop: 4,
  },
  folha: {
    borderWidth: 1,
    borderRadius: raio.grande,
    padding: 14,
  },
  campo: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 280,
    textAlignVertical: 'top',
  },
  botoes: {
    flexDirection: 'row',
    gap: 10,
  },
  botao: {
    flex: 1,
  },
  retorno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: raio.medio,
    padding: 12,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: raio.medio,
    padding: 12,
  },
  textoAviso: {
    flex: 1,
  },
});
