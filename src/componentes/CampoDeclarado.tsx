import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTema } from '@/tema/TemaProvider';
import { familias, raio } from '@/tema/tipografia';

import { useAparecer } from './animacao';
import { vibrarLeve } from './Botao';
import { SinalCategoria } from './Carimbo';
import { Texto } from './Texto';

interface Props {
  campo: string;
  rotulo: string;
  valorDeclarado: string | null;
  correcao: string | null;
  aoCorrigir: (valor: string | null) => void;
}

export function CampoDeclarado({ campo, rotulo, valorDeclarado, correcao, aoCorrigir }: Props) {
  const { paleta } = useTema();
  const aparecer = useAparecer(0, 6);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(correcao ?? valorDeclarado ?? '');
  const valor = correcao ?? valorDeclarado;
  const ausente = valor === null;

  return (
    <Animated.View style={[aparecer, estilos.linha, { borderBottomColor: paleta.linha }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor ?? 'não informado'}. Toque para corrigir.`}
        onPress={() => {
          vibrarLeve();
          setRascunho(correcao ?? valorDeclarado ?? '');
          setEditando(!editando);
        }}
        style={estilos.toque}
      >
        <View style={estilos.rotulo}>
          <Texto variante="rotulo" tom="tintaSuave">
            {rotulo}
          </Texto>
          <View style={estilos.marca}>
            {correcao === null ? (
              <>
                <SinalCategoria categoria={ausente ? 'desconhecido' : 'declarado_anunciante'} tamanho={9} />
                <Texto variante="rotulo" tom={ausente ? 'grafite' : 'jambo'} style={estilos.marcaTexto}>
                  {ausente ? 'não informado' : 'declarado pelo anunciante'}
                </Texto>
              </>
            ) : (
              <>
                <Feather name="edit-3" size={10} color={paleta.mare} />
                <Texto variante="rotulo" tom="mare" style={estilos.marcaTexto}>
                  corrigido por você
                </Texto>
              </>
            )}
          </View>
        </View>
        <Texto variante={ausente ? 'corpo' : 'destaque'} tom={ausente ? 'grafite' : 'tinta'} style={estilos.valor}>
          {valor ?? '—'}
        </Texto>
      </Pressable>
      {editando ? (
        <View style={estilos.edicao}>
          <TextInput
            id={`correcao-${campo}`}
            value={rascunho}
            onChangeText={setRascunho}
            autoFocus
            accessibilityLabel={`Corrigir ${rotulo}`}
            style={[
              estilos.entrada,
              { borderColor: paleta.linhaForte, color: paleta.tinta, backgroundColor: paleta.superficie, fontFamily: familias.dado },
            ]}
          />
          <View style={estilos.botoes}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                aoCorrigir(rascunho.trim().length === 0 ? null : rascunho.trim());
                setEditando(false);
              }}
              style={[estilos.botao, { backgroundColor: paleta.tinta }]}
            >
              <Texto variante="pequeno" tom="sobreTinta">
                salvar
              </Texto>
            </Pressable>
            {correcao === null ? null : (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  aoCorrigir(null);
                  setEditando(false);
                }}
                style={[estilos.botao, { borderColor: paleta.linhaForte, borderWidth: 1 }]}
              >
                <Texto variante="pequeno">voltar ao anúncio</Texto>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    gap: 10,
  },
  toque: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
  },
  rotulo: {
    gap: 3,
    flex: 1,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  marcaTexto: {
    fontSize: 9.5,
  },
  valor: {
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '52%',
  },
  edicao: {
    gap: 8,
  },
  entrada: {
    borderWidth: 1,
    borderRadius: raio.medio,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  botoes: {
    flexDirection: 'row',
    gap: 8,
  },
  botao: {
    borderRadius: raio.medio,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
