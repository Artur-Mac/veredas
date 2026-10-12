import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Edificio } from '@/dominio/esquema';
import { area, codigoEdificacao, numero, plural } from '@/dominio/formato';
import { categoriasEmOrdem, type Bloco, type PerguntaEfetiva, type VisaoDossie } from '@/dominio/visao';
import { blocos, rotuloCategoriaPlural, rotuloStatusPergunta, rotuloTipoAcao } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { raio } from '@/tema/tipografia';

import { SinalCategoria } from '../Carimbo';
import { Texto } from '../Texto';

export function SecaoBloco({ numeroBloco, children }: { numeroBloco: Bloco; children: ReactNode }) {
  const { paleta } = useTema();
  const { titulo, subtitulo } = blocos[numeroBloco];
  return (
    <View style={estilos.secao}>
      <View style={[estilos.cabecalhoSecao, { borderTopColor: paleta.tinta }]}>
        <View style={[estilos.numero, { borderColor: paleta.tinta }]}>
          <Texto variante="dadoGrande" style={estilos.textoNumero}>
            {String(numeroBloco)}
          </Texto>
        </View>
        <View style={estilos.tituloSecao}>
          <Texto variante="subtitulo" accessibilityRole="header">
            {titulo}
          </Texto>
          <Texto variante="pequeno" tom="tintaSuave">
            {subtitulo}
          </Texto>
        </View>
      </View>
      {children}
    </View>
  );
}

export function ResumoDaVisao({ visao, abertas }: { visao: VisaoDossie; abertas: number }) {
  const itens = categoriasEmOrdem.filter((categoria) => visao.contagem[categoria] > 0);
  return (
    <View style={estilos.resumo} accessibilityLabel="Contagem de cartões por tipo">
      {itens.map((categoria) => {
        const quantidade = visao.contagem[categoria];
        const [singular, pluralForma] = rotuloCategoriaPlural[categoria];
        return (
          <View key={categoria} style={estilos.itemResumo}>
            <SinalCategoria categoria={categoria} tamanho={11} />
            <Texto variante="dado" tom="tintaSuave">
              {`${numero(quantidade)} ${quantidade === 1 ? singular : pluralForma}`}
            </Texto>
          </View>
        );
      })}
      <View style={estilos.itemResumo}>
        <SinalCategoria categoria="desconhecido" tamanho={11} />
        <Texto variante="dado" tom="tintaSuave">
          {plural(abertas, 'pergunta em aberto', 'perguntas em aberto')}
        </Texto>
      </View>
    </View>
  );
}

function Fato({ rotulo, valor }: { rotulo: string; valor: string }) {
  const { paleta } = useTema();
  return (
    <View style={[estilos.fato, { borderColor: paleta.linha, backgroundColor: paleta.superficie }]}>
      <Texto variante="rotulo" tom="tintaSuave">
        {rotulo}
      </Texto>
      <Texto variante="dadoGrande">{valor}</Texto>
    </View>
  );
}

export function FatosDoEdificio({ edificio }: { edificio: Edificio }) {
  const { paleta } = useTema();
  return (
    <View style={estilos.fatosBloco}>
      <View style={estilos.fatos}>
        <Fato rotulo="Pavimentos" valor={edificio.pavimentos === null ? '—' : numero(edificio.pavimentos)} />
        <Fato rotulo="Construção" valor={edificio.ano_construcao === null ? '—' : String(edificio.ano_construcao)} />
        <Fato rotulo="Unidades" valor={edificio.unidades === null ? '—' : numero(edificio.unidades)} />
        <Fato
          rotulo="Área construída"
          valor={edificio.area_construida_m2 === null ? '—' : area(Math.round(edificio.area_construida_m2))}
        />
      </View>
      <View style={[estilos.codigo, { borderColor: paleta.azulejo }]}>
        <SinalCategoria categoria="registro_oficial" tamanho={10} />
        <Texto variante="rotulo" tom="azulejo">
          edificação cadastrada
        </Texto>
        <Texto variante="dado" tom="azulejo" selectable>
          {codigoEdificacao(edificio.dsqfl)}
        </Texto>
      </View>
      {edificio.evidencias.length === 0 ? null : (
        <View style={estilos.evidencias}>
          {edificio.evidencias.map((evidencia) => (
            <View key={evidencia} style={estilos.evidencia}>
              <Feather name="check" size={13} color={paleta.mare} />
              <Texto variante="pequeno" tom="tintaSuave" style={estilos.flex}>
                {evidencia}
              </Texto>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function PerguntaAberta({ pergunta }: { pergunta: PerguntaEfetiva }) {
  const { paleta } = useTema();
  const parcial = pergunta.statusEfetivo === 'parcial';
  return (
    <View
      style={[
        estilos.pergunta,
        { borderColor: paleta.grafite, borderStyle: parcial ? 'solid' : 'dashed', backgroundColor: parcial ? paleta.superficie : 'transparent' },
      ]}
    >
      <View style={estilos.linhaPergunta}>
        <Texto variante="corpoForte" style={estilos.flex}>
          {pergunta.texto}
        </Texto>
        <Texto variante="rotulo" tom="grafite">
          {rotuloStatusPergunta[pergunta.statusEfetivo]}
        </Texto>
      </View>
      <View style={estilos.linhaAcao}>
        <Feather name="corner-down-right" size={14} color={paleta.mare} />
        <Texto variante="pequeno" tom="mare" style={estilos.flex}>
          {pergunta.acao.texto}
        </Texto>
      </View>
    </View>
  );
}

export function GrupoDePerguntas({ tipo, perguntas }: { tipo: PerguntaEfetiva['acao']['tipo']; perguntas: PerguntaEfetiva[] }) {
  if (perguntas.length === 0) {
    return null;
  }
  return (
    <View style={estilos.grupo}>
      <Texto variante="rotulo" tom="tintaSuave">
        {`${rotuloTipoAcao[tipo]} · ${perguntas.length}`}
      </Texto>
      {perguntas.map((pergunta) => (
        <PerguntaAberta key={pergunta.id} pergunta={pergunta} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  secao: {
    gap: 14,
  },
  cabecalhoSecao: {
    flexDirection: 'row',
    gap: 14,
    borderTopWidth: 2,
    paddingTop: 14,
  },
  numero: {
    width: 38,
    height: 38,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoNumero: {
    fontSize: 18,
    lineHeight: 22,
  },
  tituloSecao: {
    flex: 1,
    gap: 2,
  },
  resumo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 6,
  },
  itemResumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fatosBloco: {
    gap: 12,
  },
  fatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fato: {
    flexGrow: 1,
    flexBasis: '45%',
    borderWidth: 1,
    borderRadius: raio.medio,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  codigo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: raio.pequeno,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  evidencias: {
    gap: 6,
  },
  evidencia: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
  },
  pergunta: {
    borderWidth: 1.2,
    borderRadius: raio.medio,
    padding: 12,
    gap: 8,
  },
  linhaPergunta: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  linhaAcao: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  grupo: {
    gap: 8,
  },
});
