import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { vibrarLeve } from '@/componentes/Botao';
import { PegadaEdificio } from '@/componentes/ListaDeExemplos';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import type { Dossie } from '@/dominio/esquema';
import { moeda } from '@/dominio/formato';
import { estadosDossie, useEstado, useRegistro, type EstadoDossie, type PreferenciaTema } from '@/estado/armazenamento';
import { dossies, mapaPorId } from '@/fixtures';
import { rotuloEstadoDossie, rotuloOperacao, rotuloPreferenciaTema } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { familias, raio } from '@/tema/tipografia';

function Opcao({ rotulo, ativo, aoEscolher }: { rotulo: string; ativo: boolean; aoEscolher: () => void }) {
  const { paleta } = useTema();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: ativo }}
      onPress={() => {
        vibrarLeve();
        aoEscolher();
      }}
      style={[estilos.opcao, { borderColor: ativo ? paleta.tinta : paleta.linha, backgroundColor: ativo ? paleta.tinta : 'transparent' }]}
    >
      <Texto variante="pequeno" tom={ativo ? 'sobreTinta' : 'tintaSuave'}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

function ItemDossie({ dossie }: { dossie: Dossie }) {
  const { paleta } = useTema();
  const { despachar } = useEstado();
  const registro = useRegistro(dossie.dossie_id);
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState(registro.motivoDescarte ?? '');
  const campos = dossie.anuncio.campos_declarados;
  const descartado = registro.estado === 'descartado';
  const parametros =
    registro.resolucao === null
      ? {}
      : registro.resolucao.tipo === 'rua'
        ? { modo: 'rua' }
        : { edificio: registro.resolucao.candidata };

  const definir = (estado: EstadoDossie) => {
    despachar({ tipo: 'definirEstado', id: dossie.dossie_id, estado, motivo: estado === 'descartado' ? (motivo.trim() || null) : null });
  };

  return (
    <View style={[estilos.item, { backgroundColor: paleta.superficie, borderColor: paleta.linha, opacity: descartado ? 0.82 : 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir dossiê de ${campos.bairro ?? 'Recife'}`}
        onPress={() => router.push({ pathname: '/dossie/[id]', params: { id: dossie.dossie_id, ...parametros } })}
        style={estilos.cabecalhoItem}
      >
        <View style={[estilos.pegada, { backgroundColor: paleta.azulejoFundo }]}>
          <PegadaEdificio mapa={mapaPorId(dossie.dossie_id)} tamanho={44} />
        </View>
        <View style={estilos.textoItem}>
          <Texto variante="rotulo" tom="tintaSuave">
            {`${rotuloOperacao[dossie.anuncio.operacao]} · ${campos.bairro ?? 'Recife'}`}
          </Texto>
          <Texto variante="destaque" numberOfLines={1} style={descartado ? estilos.riscado : null}>
            {campos.logradouro ?? 'Endereço não informado'}
          </Texto>
          <Texto variante="dado" tom="jambo">
            {campos.preco === null ? 'preço não informado' : moeda(campos.preco)}
          </Texto>
        </View>
        <View style={[estilos.estado, { borderColor: paleta.linhaForte }]}>
          <Texto variante="rotulo" tom="tinta">
            {rotuloEstadoDossie[registro.estado]}
          </Texto>
        </View>
      </Pressable>

      {descartado && registro.motivoDescarte !== null ? (
        <Texto variante="pequeno" tom="tintaSuave">{`Motivo do descarte: ${registro.motivoDescarte}`}</Texto>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => setAberto(!aberto)} style={estilos.alternar} hitSlop={6}>
        <Texto variante="pequeno" tom="azulejo">
          {aberto ? 'fechar' : 'mudar estado'}
        </Texto>
        <Feather name={aberto ? 'chevron-up' : 'chevron-down'} size={14} color={paleta.azulejo} />
      </Pressable>

      {aberto ? (
        <View style={estilos.edicao}>
          <View style={estilos.opcoes} accessibilityRole="radiogroup">
            {estadosDossie.map((estado) => (
              <Opcao key={estado} rotulo={rotuloEstadoDossie[estado]} ativo={registro.estado === estado} aoEscolher={() => definir(estado)} />
            ))}
          </View>
          <Texto variante="rotulo" tom="tintaSuave">
            Motivo do descarte (opcional)
          </Texto>
          <TextInput
            id={`motivo-${dossie.dossie_id}`}
            value={motivo}
            onChangeText={setMotivo}
            onEndEditing={() => {
              if (descartado) {
                despachar({ tipo: 'definirEstado', id: dossie.dossie_id, estado: 'descartado', motivo: motivo.trim() || null });
              }
            }}
            placeholder="Ex.: condomínio acima do que posso pagar"
            placeholderTextColor={paleta.tintaFraca}
            style={[estilos.campo, { borderColor: paleta.linhaForte, color: paleta.tinta, fontFamily: familias.texto }]}
          />
          <Texto variante="pequeno" tom="tintaFraca">
            O motivo do descarte ajuda a calibrar o produto e, na versão conectada, rende crédito.
          </Texto>
        </View>
      ) : null}
    </View>
  );
}

export default function MeusDossies() {
  const { estado, despachar } = useEstado();
  const preferencias: PreferenciaTema[] = ['sistema', 'claro', 'escuro'];
  return (
    <Tela cabecalho={<Cabecalho titulo="Meus dossiês" />}>
      <View style={estilos.topo}>
        <Texto variante="titulo">Meus dossiês</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          Os anúncios que você verificou, com o estado de cada um. Tudo fica salvo neste aparelho.
        </Texto>
      </View>
      <View style={estilos.lista}>
        {dossies.map((dossie) => (
          <ItemDossie key={dossie.dossie_id} dossie={dossie} />
        ))}
      </View>
      <View style={estilos.tema}>
        <Texto variante="rotulo" tom="tintaSuave">
          Aparência
        </Texto>
        <View style={estilos.opcoes} accessibilityRole="radiogroup">
          {preferencias.map((preferencia) => (
            <Opcao
              key={preferencia}
              rotulo={rotuloPreferenciaTema[preferencia]}
              ativo={estado.tema === preferencia}
              aoEscolher={() => despachar({ tipo: 'definirTema', tema: preferencia })}
            />
          ))}
        </View>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: {
    gap: 8,
    paddingTop: 4,
  },
  lista: {
    gap: 12,
  },
  item: {
    borderWidth: 1,
    borderRadius: raio.grande,
    padding: 14,
    gap: 10,
  },
  cabecalhoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pegada: {
    width: 52,
    height: 52,
    borderRadius: raio.medio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoItem: {
    flex: 1,
    gap: 2,
  },
  riscado: {
    textDecorationLine: 'line-through',
  },
  estado: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  alternar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  edicao: {
    gap: 10,
  },
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  opcao: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  campo: {
    borderWidth: 1,
    borderRadius: raio.medio,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  tema: {
    gap: 10,
  },
});
