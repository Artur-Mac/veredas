import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { Botao } from '@/componentes/Botao';
import { Carimbo } from '@/componentes/Carimbo';
import { DesvioDeRota } from '@/componentes/dossie/DesvioDeRota';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { dataCurta, dataReferencia } from '@/dominio/formato';
import { cartaoDaVisao } from '@/dominio/visao';
import { useVisaoDaRota } from '@/navegacao/useVisaoDaRota';
import { explicacaoCategoria, rotuloEscala } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { raio } from '@/tema/tipografia';

function Linha({ rotulo, valor, selecionavel = false }: { rotulo: string; valor: string; selecionavel?: boolean }) {
  const { paleta } = useTema();
  return (
    <View style={[estilos.linha, { borderBottomColor: paleta.linha }]}>
      <Texto variante="rotulo" tom="tintaSuave">
        {rotulo}
      </Texto>
      <Texto variante="corpo" selectable={selecionavel}>
        {valor}
      </Texto>
    </View>
  );
}

export default function CamadaDoCartao() {
  const { cartao: cartaoId } = useLocalSearchParams<{ cartao: string }>();
  const resultado = useVisaoDaRota();
  const { paleta } = useTema();

  if (resultado.tipo !== 'pronto') {
    return <DesvioDeRota resultado={resultado} />;
  }

  const { visao, id, parametros } = resultado;
  const cartao = cartaoDaVisao(visao, cartaoId);

  if (cartao === null) {
    return (
      <Tela cabecalho={<Cabecalho titulo="Cartão" />}>
        <Texto variante="corpo">Este cartão não faz parte do dossiê nesta identificação do prédio.</Texto>
      </Tela>
    );
  }

  const pergunta = visao.perguntas.find((p) => p.id === cartao.pergunta_id) ?? null;
  const url = cartao.url_fonte;

  return (
    <Tela
      cabecalho={<Cabecalho titulo="Fonte e método" />}
      rodape={
        <View style={estilos.botoes}>
          {url === null ? null : (
            <Botao
              rotulo="Abrir a fonte"
              icone="external-link"
              aoPressionar={() => {
                WebBrowser.openBrowserAsync(url).catch((erro: unknown) => {
                  console.error(`Não foi possível abrir a fonte ${url}.`, erro);
                });
              }}
            />
          )}
          <Botao
            rotulo="Isso está errado"
            variante="secundario"
            icone="flag"
            aoPressionar={() =>
              router.push({ pathname: '/dossie/[id]/contestar/[cartao]', params: { id, cartao: cartao.id, ...parametros } })
            }
          />
        </View>
      }
    >
      <View style={estilos.topo}>
        <Carimbo categoria={cartao.categoria} />
        <Texto variante="pequeno" tom="tintaSuave">
          {explicacaoCategoria[cartao.categoria]}
        </Texto>
        <Texto variante="titulo">{cartao.titulo}</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          {cartao.claim}
        </Texto>
      </View>

      <View style={[estilos.ficha, { backgroundColor: paleta.superficie, borderColor: paleta.linha }]}>
        <Linha rotulo="Fonte" valor={cartao.fonte} />
        {url === null ? null : <Linha rotulo="Endereço da fonte" valor={url} selecionavel />}
        <Linha rotulo="Data de referência" valor={dataReferencia(cartao.data_ref)} />
        <Linha rotulo="Data de coleta" valor={dataCurta(cartao.data_coleta)} />
        <Linha rotulo="Escala" valor={rotuloEscala[cartao.escala]} />
        <Linha rotulo="Método" valor={cartao.metodo} />
        <Linha rotulo="Limitação principal" valor={cartao.limitacao} />
        <Linha rotulo="O que fazer" valor={cartao.acao} />
        {pergunta === null ? null : <Linha rotulo="Pergunta relacionada" valor={pergunta.texto} />}
      </View>

      <View style={[estilos.aviso, { borderColor: paleta.linha }]}>
        <Texto variante="pequeno" tom="tintaSuave">
          {`Este cartão vale para a escala "${rotuloEscala[cartao.escala]}". Não estenda a conclusão para uma escala menor do que a registrada.`}
        </Texto>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: 10,
    paddingTop: 4,
  },
  ficha: {
    borderWidth: 1,
    borderRadius: raio.grande,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  linha: {
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aviso: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: raio.medio,
    padding: 12,
  },
  botoes: {
    gap: 8,
  },
});
