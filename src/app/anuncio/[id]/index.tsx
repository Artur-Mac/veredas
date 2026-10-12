import Feather from '@expo/vector-icons/Feather';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Botao } from '@/componentes/Botao';
import { CampoDeclarado } from '@/componentes/CampoDeclarado';
import { Cabecalho, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { camposExibidos } from '@/dominio/camposDeclarados';
import { dataCurta } from '@/dominio/formato';
import { useEstado, useRegistro } from '@/estado/armazenamento';
import { dossiePorId } from '@/fixtures';
import { rotuloOperacao } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { raio } from '@/tema/tipografia';

const intervalo = 240;

export default function LendoAnuncio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { paleta } = useTema();
  const { despachar } = useEstado();
  const registro = useRegistro(id);
  const dossie = dossiePorId(id);
  const campos = dossie === null ? [] : camposExibidos(dossie);
  const [lidos, setLidos] = useState(0);

  useEffect(() => {
    if (lidos >= campos.length) {
      return;
    }
    const temporizador = setTimeout(() => setLidos((n) => n + 1), intervalo);
    return () => clearTimeout(temporizador);
  }, [lidos, campos.length]);

  if (dossie === null) {
    return <Redirect href="/demonstracao" />;
  }

  const completo = lidos >= campos.length;
  const trechos = dossie.anuncio.trechos_descricao;

  return (
    <Tela
      cabecalho={<Cabecalho titulo="Lendo o anúncio" />}
      rodape={
        <Botao
          rotulo={completo ? 'Ver o que se sabe do prédio' : 'Lendo…'}
          iconeDepois="arrow-right"
          desativado={!completo}
          aoPressionar={() => router.push({ pathname: '/anuncio/[id]/etapas', params: { id } })}
        />
      }
    >
      <View style={estilos.topo}>
        <Texto variante="rotulo" tom="tintaSuave">
          {`anúncio de ${rotuloOperacao[dossie.anuncio.operacao]} · coletado em ${dataCurta(dossie.anuncio.coletado_em)}`}
        </Texto>
        <Texto variante="titulo">{completo ? 'Anúncio lido.' : 'Lendo o anúncio…'}</Texto>
        <Texto variante="corpo" tom="tintaSuave">
          Tudo abaixo foi declarado pelo anunciante e ainda não foi verificado. Toque em um campo para corrigir.
        </Texto>
      </View>

      <View style={[estilos.folha, { backgroundColor: paleta.superficie, borderColor: paleta.linha }]}>
        {campos.slice(0, lidos).map((campo, indice) => (
          <CampoDeclarado
            key={campo.campo}
            campo={campo.campo}
            rotulo={campo.rotulo}
            valorDeclarado={campo.valor}
            correcao={registro.correcoes[campo.campo] ?? null}
            aoCorrigir={(valor) => despachar({ tipo: 'corrigirCampo', id, campo: campo.campo, valor })}
          />
        ))}
        {completo ? null : (
          <View style={estilos.lendo}>
            <Feather name="loader" size={16} color={paleta.tintaFraca} />
            <Texto variante="pequeno" tom="tintaFraca">
              {`${lidos} de ${campos.length} campos`}
            </Texto>
          </View>
        )}
      </View>

      {completo && trechos.length > 0 ? (
        <View style={estilos.trechos}>
          <Texto variante="rotulo" tom="tintaSuave">
            Na descrição do anúncio
          </Texto>
          {trechos.map((trecho) => (
            <View key={trecho.texto} style={[estilos.trecho, { borderLeftColor: paleta.jambo }]}>
              <Texto variante="corpo" tom="jambo">
                {`“${trecho.texto}”`}
              </Texto>
            </View>
          ))}
        </View>
      ) : null}
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
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  lendo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  trechos: {
    gap: 10,
  },
  trecho: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    paddingVertical: 2,
  },
});
