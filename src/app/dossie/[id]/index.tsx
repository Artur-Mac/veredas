import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { BarraCusto } from '@/componentes/BarraCusto';
import { Botao } from '@/componentes/Botao';
import { CartaoEvidencia } from '@/componentes/CartaoEvidencia';
import { DesvioDeRota } from '@/componentes/dossie/DesvioDeRota';
import { FatosDoEdificio, GrupoDePerguntas, ResumoDaVisao, SecaoBloco } from '@/componentes/dossie/Partes';
import { LegendaMapa, MapaCadastral } from '@/componentes/mapa/MapaCadastral';
import { Cabecalho, SeloDemonstracao, Tela } from '@/componentes/Tela';
import { Texto } from '@/componentes/Texto';
import { camposExibidos } from '@/dominio/camposDeclarados';
import type { Cartao, TipoAcao } from '@/dominio/esquema';
import { dataCurta } from '@/dominio/formato';
import { itensDoRoteiro, perguntasEmAberto, type VisaoDossie } from '@/dominio/visao';
import { useRegistro } from '@/estado/armazenamento';
import { mapaPorId } from '@/fixtures';
import { useVisaoDaRota, type ParametrosResolucao } from '@/navegacao/useVisaoDaRota';
import { rotuloOperacao } from '@/textos/rotulos';
import { useTema } from '@/tema/TemaProvider';
import { raio } from '@/tema/tipografia';

const ordemAcoes: TipoAcao[] = ['documento', 'pergunta', 'visita', 'profissional'];

function abrirFonte(url: string) {
  WebBrowser.openBrowserAsync(url).catch((erro: unknown) => {
    console.error(`Não foi possível abrir a fonte ${url}.`, erro);
  });
}

function ListaDeCartoes({
  cartoes,
  id,
  parametros,
  contestados,
}: {
  cartoes: Cartao[];
  id: string;
  parametros: ParametrosResolucao;
  contestados: Set<string>;
}) {
  return (
    <>
      {cartoes.map((cartao, indice) => {
        const abrir = () => router.push({ pathname: '/dossie/[id]/cartao/[cartao]', params: { id, cartao: cartao.id, ...parametros } });
        return (
          <CartaoEvidencia
            key={cartao.id}
            cartao={cartao}
            indice={indice}
            contestado={contestados.has(cartao.id)}
            aoAbrir={abrir}
            aoVerFonte={() => (cartao.url_fonte === null ? abrir() : abrirFonte(cartao.url_fonte))}
            aoContestar={() =>
              router.push({ pathname: '/dossie/[id]/contestar/[cartao]', params: { id, cartao: cartao.id, ...parametros } })
            }
          />
        );
      })}
    </>
  );
}

function StatusIdentidade({ visao }: { visao: VisaoDossie }) {
  const { paleta } = useTema();
  if (visao.modo === 'rua') {
    return (
      <View style={estilos.linhaStatus}>
        <View style={[estilos.status, { borderColor: paleta.grafite, borderStyle: 'dashed' }]}>
          <Feather name="help-circle" size={14} color={paleta.grafite} />
          <Texto variante="rotulo" tom="grafite">
            prédio não identificado
          </Texto>
        </View>
        <Texto variante="rotulo" tom="tintaSuave">
          só rua e bairro
        </Texto>
      </View>
    );
  }
  const humano = visao.origem === 'humano';
  return (
    <View style={estilos.linhaStatus}>
      <View style={[estilos.status, { borderColor: paleta.mare, backgroundColor: paleta.mareFundo }]}>
        <Feather name={humano ? 'user-check' : 'check-circle'} size={14} color={paleta.mare} />
        <Texto variante="rotulo" tom="mare">
          {humano ? 'confirmado por você' : 'identificado automaticamente'}
        </Texto>
      </View>
      <Texto variante="rotulo" tom="tintaSuave">
        {humano ? 'origem humana' : `confiança ${visao.dossie.identidade.confianca}`}
      </Texto>
    </View>
  );
}

function DeclaradosCompactos({ visao }: { visao: VisaoDossie }) {
  const { paleta } = useTema();
  const registro = useRegistro(visao.dossie.dossie_id);
  const campos = camposExibidos(visao.dossie).filter((c) =>
    ['preco', 'condominio', 'iptu', 'area_m2', 'quartos', 'vagas', 'andar'].includes(c.campo),
  );
  return (
    <View style={[estilos.declarados, { borderColor: paleta.jambo }]}>
      <Texto variante="rotulo" tom="jambo">
        declarado pelo anunciante
      </Texto>
      <View style={estilos.gradeDeclarados}>
        {campos.map((campo) => {
          const correcao = registro.correcoes[campo.campo] ?? null;
          const valor = correcao ?? campo.valor;
          return (
            <View key={campo.campo} style={estilos.declarado}>
              <Texto variante="rotulo" tom="tintaFraca">
                {campo.rotulo}
              </Texto>
              <Texto variante="dado" tom={valor === null ? 'grafite' : 'tinta'}>
                {valor ?? 'não informado'}
              </Texto>
              {correcao === null ? null : (
                <Texto variante="rotulo" tom="mare" style={estilos.corrigido}>
                  corrigido por você
                </Texto>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function Dossie() {
  const resultado = useVisaoDaRota();
  const { paleta } = useTema();
  const id = resultado.tipo === 'pronto' ? resultado.id : '';
  const registro = useRegistro(id);

  if (resultado.tipo !== 'pronto') {
    return <DesvioDeRota resultado={resultado} />;
  }

  const { visao, parametros } = resultado;
  const { dossie } = visao;
  const mapa = mapaPorId(id);
  const contestados = new Set(registro.contestacoes.map((c) => c.cartaoId));
  const abertas = perguntasEmAberto(visao);
  const roteiro = itensDoRoteiro(visao);
  const custoEmCartao = visao.cartoesPorBloco[3].some((c) => c.visual?.tipo === 'custo_mensal');
  const campos = dossie.anuncio.campos_declarados;
  const alvosDoMapa = visao.modo === 'rua' || visao.edificio === null ? [] : [visao.edificio.id];

  return (
    <Tela
      cabecalho={
        <Cabecalho
          titulo="Dossiê"
          direita={
            <>
              <SeloDemonstracao />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Meus dossiês"
                hitSlop={10}
                onPress={() => router.push('/dossies')}
                style={[estilos.botaoIcone, { borderColor: paleta.linha }]}
              >
                <Feather name="folder" size={18} color={paleta.tinta} />
              </Pressable>
            </>
          }
        />
      }
    >
      <View style={estilos.heroi}>
        <MapaCadastral mapa={mapa} alvos={alvosDoMapa} focoNoRaio={visao.modo === 'rua'} altura={310} />
        <LegendaMapa mapa={mapa} comAlvo={alvosDoMapa.length > 0} />
      </View>

      <View style={estilos.identidade}>
        <Texto variante="rotulo" tom="tintaSuave">
          {`${rotuloOperacao[dossie.anuncio.operacao]} · ${campos.bairro ?? 'Recife'} · anúncio coletado em ${dataCurta(dossie.anuncio.coletado_em)}`}
        </Texto>
        <Texto variante="titulo">
          {visao.edificio === null ? `${campos.logradouro ?? 'Rua não informada'}, sem número` : visao.edificio.endereco_oficial}
        </Texto>
        <StatusIdentidade visao={visao} />
        <ResumoDaVisao visao={visao} abertas={abertas.length} />
      </View>

      <SecaoBloco numeroBloco={1}>
        {visao.edificio === null ? (
          <View style={[estilos.semPredio, { borderColor: paleta.grafite }]}>
            <Texto variante="corpo">
              Não identificamos o prédio deste anúncio. Este dossiê mostra só o que vale para a rua e o bairro.
            </Texto>
            <Botao
              rotulo="Escolher o prédio no mapa"
              variante="secundario"
              icone="map"
              aoPressionar={() => router.push({ pathname: '/anuncio/[id]/confirmacao', params: { id } })}
            />
          </View>
        ) : (
          <FatosDoEdificio edificio={visao.edificio} />
        )}
        <ListaDeCartoes cartoes={visao.cartoesPorBloco[1]} id={id} parametros={parametros} contestados={contestados} />
        {visao.origem === 'humano' ? (
          <Botao
            rotulo="Não é este prédio?"
            variante="texto"
            icone="refresh-ccw"
            aoPressionar={() => router.push({ pathname: '/anuncio/[id]/confirmacao', params: { id } })}
          />
        ) : null}
      </SecaoBloco>

      <SecaoBloco numeroBloco={2}>
        {visao.cartoesPorBloco[2].length === 0 ? (
          <Texto variante="corpo" tom="tintaSuave">
            Nenhum registro oficial nesta escala.
          </Texto>
        ) : (
          <ListaDeCartoes cartoes={visao.cartoesPorBloco[2]} id={id} parametros={parametros} contestados={contestados} />
        )}
      </SecaoBloco>

      <SecaoBloco numeroBloco={3}>
        <DeclaradosCompactos visao={visao} />
        {custoEmCartao ? null : (
          <View style={[estilos.painel, { backgroundColor: paleta.superficie, borderColor: paleta.linha }]}>
            <BarraCusto key={`${id}-${visao.modo}`} parcelas={visao.custo} titulo="Custo mensal declarado" />
          </View>
        )}
        <ListaDeCartoes cartoes={visao.cartoesPorBloco[3]} id={id} parametros={parametros} contestados={contestados} />
      </SecaoBloco>

      <SecaoBloco numeroBloco={4}>
        <ListaDeCartoes cartoes={visao.cartoesPorBloco[4]} id={id} parametros={parametros} contestados={contestados} />
        {ordemAcoes.map((tipo) => (
          <GrupoDePerguntas key={tipo} tipo={tipo} perguntas={abertas.filter((p) => p.acao.tipo === tipo)} />
        ))}
        <View style={estilos.acoes}>
          <Botao
            rotulo={`Roteiro de visita · ${roteiro.length} itens`}
            icone="check-square"
            aoPressionar={() => router.push({ pathname: '/dossie/[id]/roteiro', params: { id, ...parametros } })}
          />
          <Botao
            rotulo="Mensagem para o corretor"
            variante="secundario"
            icone="message-square"
            aoPressionar={() => router.push({ pathname: '/dossie/[id]/mensagem', params: { id, ...parametros } })}
          />
        </View>
      </SecaoBloco>

      <View style={[estilos.rodape, { borderTopColor: paleta.linha }]}>
        <Texto variante="dado" tom="tintaFraca">
          {`método ${dossie.versao_metodo} · dossiê gerado em ${dataCurta(dossie.gerado_em)}`}
        </Texto>
        <Texto variante="pequeno" tom="tintaFraca">
          Fontes: Prefeitura do Recife (dados abertos, ODbL), IBGE (CNEFE 2022) e Serviço Geológico do Brasil. Ausência de registro não significa ausência de problema.
        </Texto>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  botaoIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroi: {
    gap: 10,
  },
  identidade: {
    gap: 10,
  },
  linhaStatus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1.2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  semPredio: {
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderRadius: raio.grande,
    padding: 16,
    gap: 14,
  },
  declarados: {
    borderWidth: 1,
    borderRadius: raio.grande,
    padding: 14,
    gap: 10,
  },
  gradeDeclarados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  declarado: {
    width: '50%',
    gap: 2,
    paddingRight: 8,
  },
  corrigido: {
    fontSize: 9.5,
  },
  painel: {
    borderWidth: 1,
    borderRadius: raio.grande,
    padding: 16,
  },
  acoes: {
    gap: 10,
    marginTop: 6,
  },
  rodape: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    gap: 6,
  },
});
