import { useMemo } from "react";
import { Linking, View } from "react-native";
import type { Confianca, MetaDoIndice } from "../../dados/contratos";
import { META } from "../../dados/recife/indice";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Gaveta } from "../casca/Gaveta";
import { Texto } from "../Texto";
import { RastroCompleto } from "./RastroDeConfianca";
import { descreverFonte, type DescricaoDaFonte, type FonteDoDado } from "./textos";

export type DadoDaFonte = { rotulo: string; valor: string };

/**
 * O que a tela guarda para abrir a gaveta: de onde vem o dado, com que confiança e qual é o dado. `idDoDado` (o `id` do
 * `Fato` ou do `Achado`) é opcional: com ele a gaveta separa o dado copiado do calculado pela lista; sem ele, pela fonte.
 */
export type PedidoDeFonte = { fonte: FonteDoDado; confianca: Confianca; dado?: DadoDaFonte | null; idDoDado?: string | null };

type Props = {
  visivel: boolean;
  aoFechar: () => void;
  fonte: FonteDoDado | null;
  /** Categoria de confiança do dado que abriu a gaveta. */
  confianca: Confianca | null;
  /** O dado em si, para a pessoa ver de qual número a fonte fala. */
  dado?: DadoDaFonte | null;
  /** Id do `Fato` ou do `Achado`, quando a tela o tem (ver `PedidoDeFonte`). */
  idDoDado?: string | null;
  /** Só para teste: quando ausente, vale o `META` do índice. */
  meta?: Pick<MetaDoIndice, "fontes"> & Partial<Pick<MetaDoIndice, "fontesDaRua">>;
};

type MetaDaGaveta = Pick<MetaDoIndice, "fontes"> & Partial<Pick<MetaDoIndice, "fontesDaRua">>;

function descricaoOuErro(fonte: FonteDoDado, meta: MetaDaGaveta): { descricao: DescricaoDaFonte | null; erro: boolean } {
  try {
    return { descricao: descreverFonte(fonte, meta), erro: false };
  } catch {
    return { descricao: null, erro: true };
  }
}

function lerMeta(): MetaDaGaveta | null {
  try {
    return { fontes: META.fontes, fontesDaRua: META.fontesDaRua };
  } catch {
    return null;
  }
}

function LinhaDeDados({ rotulo, valor, mono = false }: { rotulo: string; valor: string; mono?: boolean }) {
  const { cor } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={`${rotulo}: ${valor}`}
      style={{ paddingVertical: ESPACO[3] - 1, gap: 2, borderBottomWidth: 0.5, borderBottomColor: cor("cor-linha") }}
    >
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 16 }}>
        {rotulo}
      </Texto>
      <Texto
        tipo={mono ? "etiqueta" : "corpo"}
        style={mono ? { fontFamily: "JetBrainsMono", fontSize: 12, lineHeight: 18 } : { fontSize: 13, lineHeight: 19, fontWeight: "600" }}
      >
        {valor}
      </Texto>
    </View>
  );
}

/**
 * Gaveta de fonte (`openSourceSheet`, index.html 6003 a 6101): de onde vem o dado, quem publica, em que licença, quando a
 * base foi modificada e quando o Vereda a consultou, quais colunas leu e qual a confiança do dado.
 */
export function GavetaDeFonte({ visivel, aoFechar, fonte, confianca, dado = null, idDoDado = null, meta }: Props) {
  const { cor } = useTema();
  const metaUsada = useMemo(() => (visivel ? (meta ?? lerMeta()) : null), [visivel, meta]);
  const { descricao, erro } = useMemo(
    () => (fonte && metaUsada ? descricaoOuErro(fonte, metaUsada) : { descricao: null, erro: fonte !== null && visivel }),
    [fonte, metaUsada, visivel],
  );

  if (!visivel || !fonte) return null;

  const titulo = descricao ? descricao.titulo : "Fonte do dado";
  const subtitulo = descricao?.tipo === "base" ? descricao.subtitulo : undefined;

  return (
    <Gaveta visivel titulo={titulo} subtitulo={subtitulo} aoFechar={aoFechar}>
      <View style={{ gap: ESPACO[4], paddingTop: ESPACO[3] }}>
        {dado ? (
          <View
            accessible
            accessibilityLabel={`${dado.rotulo}: ${dado.valor}`}
            style={{
              gap: 2,
              padding: ESPACO[3],
              borderRadius: RAIO.icone,
              backgroundColor: cor("cor-creme"),
              borderWidth: 1,
              borderColor: cor("cor-linha"),
            }}
          >
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 16 }}>
              {dado.rotulo}
            </Texto>
            {/* Número ou valor curto em mono; frase longa (um achado sem medida) no corpo de texto. */}
            <Texto
              tipo="corpo"
              style={
                dado.valor.length <= 28
                  ? { fontFamily: "JetBrainsMono", fontSize: 16, lineHeight: 22, fontWeight: "600" }
                  : { fontSize: 13, lineHeight: 19, fontWeight: "500" }
              }
            >
              {dado.valor}
            </Texto>
          </View>
        ) : null}

        {descricao?.tipo === "base" ? (
          <View>
            <Texto tipo="corpo" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 19, marginBottom: ESPACO[2] }}>
              {descricao.orgao}
            </Texto>
            <LinhaDeDados rotulo="Licença" valor={descricao.licenca} />
            <LinhaDeDados rotulo="Base modificada em" valor={descricao.modificadoEm} />
            <LinhaDeDados rotulo="Consultada pelo Vereda em" valor={descricao.consultadoEm} />
            <LinhaDeDados rotulo="Recorte usado" valor={descricao.recorte} />
            <LinhaDeDados rotulo="Colunas usadas" valor={descricao.colunas.join(", ")} mono />
          </View>
        ) : descricao ? (
          <Texto tipo="corpo" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 19 }}>
            {descricao.texto}
          </Texto>
        ) : (
          <Texto tipo="corpo" role="alert" cor="cor-barro-texto" style={{ fontSize: 13, lineHeight: 19 }}>
            {erro
              ? "Não foi possível ler os dados desta fonte. O dado continua válido; só a descrição da base ficou indisponível."
              : "Esta base não consta no registro de fontes do índice cadastral."}
          </Texto>
        )}

        {confianca ? (
          <View style={{ gap: ESPACO[2] }}>
            <Texto tipo="secao" role="heading" style={{ fontWeight: "600" }}>
              Confiança deste dado
            </Texto>
            <RastroCompleto atual={confianca} fonte={fonte} idDoDado={idDoDado} />
          </View>
        ) : null}

        {descricao?.tipo === "base" ? (
          <Botao
            rotulo="Consultar o portal da fonte"
            variante="secundario"
            icone="external-link"
            tamanhoIcone="p"
            acessivel={`Consultar o portal da fonte: ${descricao.subtitulo}`}
            onPress={() => {
              void Linking.openURL(descricao.url).catch(() => undefined);
            }}
          />
        ) : null}
      </View>
    </Gaveta>
  );
}
