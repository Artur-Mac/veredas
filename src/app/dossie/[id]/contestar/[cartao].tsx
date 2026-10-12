import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Botao } from '@/componentes/Botao';
import { Carimbo } from '@/componentes/Carimbo';
import { DesvioDeRota } from '@/componentes/dossie/DesvioDeRota';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { cartaoDaVisao } from '@/dominio/visao';
import { useEstado } from '@/estado/armazenamento';
import { useVisaoDaRota } from '@/navegacao/useVisaoDaRota';
import { useTema } from '@/tema/TemaProvider';
import { familias, raio } from '@/tema/tipografia';

export default function Contestar() {
  const { cartao: cartaoId } = useLocalSearchParams<{ cartao: string }>();
  const resultado = useVisaoDaRota();
  const { despachar } = useEstado();
  const { paleta } = useTema();
  const [texto, setTexto] = useState('');
  const [registrado, setRegistrado] = useState(false);

  if (resultado.tipo !== 'pronto') {
    return <DesvioDeRota resultado={resultado} />;
  }

  const { visao, id } = resultado;
  const cartao = cartaoDaVisao(visao, cartaoId);

  return (
    <Tela
      cabecalho={<Cabecalho titulo="Isso está errado" />}
      rodape={
        registrado ? (
          <Botao rotulo="Voltar ao dossiê" icone="arrow-left" aoPressionar={() => router.back()} />
        ) : (
          <Botao
            rotulo="Registrar contestação"
            icone="flag"
            desativado={texto.trim().length < 5}
            aoPressionar={() => {
              despachar({ tipo: 'contestar', id, cartaoId, texto: texto.trim(), em: new Date().toISOString() });
              setRegistrado(true);
            }}
          />
        )
      }
    >
      <View style={estilos.topo}>
        {cartao === null ? null : <Carimbo categoria={cartao.categoria} />}
        <Texto variante="titulo">{cartao === null ? 'Contestar cartão' : cartao.titulo}</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          {cartao === null ? '' : cartao.claim}
        </Texto>
      </View>
      {registrado ? (
        <View style={[estilos.confirmacao, { backgroundColor: paleta.mareFundo }]}>
          <Texto variante="destaque" tom="mare">
            Contestação registrada neste aparelho.
          </Texto>
          <Texto variante="corpo" tom="tintaSuave">
            Na versão conectada, ela entra na fila de revisão. Se for confirmada, o dossiê e a tabela de edifícios são corrigidos e a versão anterior fica guardada.
          </Texto>
        </View>
      ) : (
        <View style={estilos.formulario}>
          <Texto variante="rotulo" tom="tintaSuave">
            O que está errado?
          </Texto>
          <TextInput
            id="texto-contestacao"
            value={texto}
            onChangeText={setTexto}
            multiline
            placeholder="Ex.: o prédio tem 14 andares, não 12."
            placeholderTextColor={paleta.tintaFraca}
            accessibilityLabel="Descreva o que está errado"
            style={[
              estilos.campo,
              { borderColor: paleta.linhaForte, color: paleta.tinta, backgroundColor: paleta.superficie, fontFamily: familias.texto },
            ]}
          />
          <Texto variante="pequeno" tom="tintaFraca">
            Não informe dados pessoais de ninguém.
          </Texto>
        </View>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: 10,
    paddingTop: 4,
  },
  formulario: {
    gap: 8,
  },
  campo: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: raio.medio,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  confirmacao: {
    borderRadius: raio.grande,
    padding: 16,
    gap: 8,
  },
});
