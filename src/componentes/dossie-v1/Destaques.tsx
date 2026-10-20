import { View } from "react-native";
import type { Achado, VisaoDoDossie } from "../../dados/contratos";
import { ESPACO } from "../../tema/tokens";
import type { PedidoDeFonte } from "../fonte/GavetaDeFonte";
import { RastroDeConfianca } from "../fonte/RastroDeConfianca";
import { nomeCurtoDaFonte, rotuloDaConfianca, type FonteDoDado } from "../fonte/textos";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { CaixaCreme, Corpo, Divisor, LinhaTocavel, LinkComSeta, NumeroEditorial, Seta, Sobretitulo, Titulo2 } from "./base";
import { CartaoSemPredio } from "./CartaoSemPredio";
import { achadoPedeComposicao, achadoPedeObras, corpoQueCabe, listaDeAchados } from "./textos";

type Props = {
  visao: VisaoDoDossie;
  coberto: boolean;
  vinculoConfirmado: boolean;
  aoAbrirFonte: (pedido: PedidoDeFonte) => void;
  aoVerComposicao: () => void;
  aoVerObras: () => void;
  aoConfirmarPredio: () => void;
  aoVerVerificacoes: () => void;
};

function pedidoDoAchado(a: Achado): PedidoDeFonte | null {
  if (a.fonte === null) return null;
  return {
    fonte: a.fonte,
    confianca: a.confianca,
    dado: { rotulo: a.titulo, valor: a.medida ? `${a.medida.numero} ${a.medida.unidade}`.trim() : a.texto },
  };
}

/** A linha "registro oficial · IPTU 2026 ›" que abre a gaveta de fonte do achado. */
function LinhaDeFonte({ achado, aoAbrir }: { achado: Achado; aoAbrir: (p: PedidoDeFonte) => void }) {
  const pedido = pedidoDoAchado(achado);
  const fonte: FonteDoDado | null = achado.fonte;
  const texto = fonte ? `${rotuloDaConfianca(achado.confianca, fonte)} · ${nomeCurtoDaFonte(fonte)}` : undefined;
  if (!pedido) return <RastroDeConfianca confianca={achado.confianca} texto={texto} />;
  return (
    <Pressionavel
      onPress={() => aoAbrir(pedido)}
      accessibilityRole="button"
      accessibilityLabel={`Ver fonte: ${texto ?? ""}`}
      style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" }}
    >
      <RastroDeConfianca confianca={achado.confianca} fonte={fonte} texto={texto} />
      <Seta tamanho={12} cor="cor-texto-apoio" />
    </Pressionavel>
  );
}

/** `.ds-finding-measure`: o número em destaque e a unidade ao lado. */
function Medida({ numero, unidade }: { numero: string; unidade: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginTop: ESPACO[2] }}>
      <NumeroEditorial tamanho={corpoQueCabe(numero, 250, 36, 20)} apertado={-0.035}>
        {numero}
      </NumeroEditorial>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
        {unidade}
      </Texto>
    </View>
  );
}

function AchadoPrincipal({ achado, aoAbrirFonte, aoVerComposicao, aoVerObras }: { achado: Achado } & Pick<Props, "aoAbrirFonte" | "aoVerComposicao" | "aoVerObras">) {
  return (
    <CaixaCreme laranja estilo={{ marginTop: 14, gap: ESPACO[1] }}>
      <Texto tipo="titulo-tela" role="heading" style={{ fontSize: 23, lineHeight: 28, fontWeight: "500", letterSpacing: -0.4 }}>
        {achado.titulo}
      </Texto>
      {achado.medida ? <Medida numero={achado.medida.numero} unidade={achado.medida.unidade} /> : null}
      <Corpo estilo={{ marginTop: ESPACO[1] }}>{achado.texto}</Corpo>
      <LinhaDeFonte achado={achado} aoAbrir={aoAbrirFonte} />
      {achadoPedeComposicao(achado) ? <LinkComSeta rotulo="Ver composição" onPress={aoVerComposicao} /> : null}
      {achadoPedeObras(achado) ? <LinkComSeta rotulo="Ver obras próximas" onPress={aoVerObras} /> : null}
    </CaixaCreme>
  );
}

function AchadoDeApoio({ achado, aoAbrirFonte, aoVerComposicao, aoVerObras }: { achado: Achado } & Pick<Props, "aoAbrirFonte" | "aoVerComposicao" | "aoVerObras">) {
  const pedido = pedidoDoAchado(achado);
  const medida = achado.medida;
  const rotulo = `${medida ? `${medida.numero} ${medida.unidade}. ` : ""}${achado.titulo}. ${achado.texto}`;
  const conteudo = (
    <>
      {medida ? (
        <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
          <NumeroEditorial tamanho={corpoQueCabe(medida.numero, 230, 26, 18)} apertado={-0.035}>
            {medida.numero}
          </NumeroEditorial>
          <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, flexShrink: 1 }}>
            {medida.unidade}
          </Texto>
        </View>
      ) : null}
      <Texto tipo="corpo" style={{ fontSize: medida ? 13 : 17, lineHeight: medida ? 19 : 24, fontWeight: "600", marginTop: medida ? 3 : 0 }}>
        {achado.titulo}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18, marginTop: 3 }}>
        {achado.texto}
      </Texto>
    </>
  );
  return (
    <View>
      {pedido ? (
        <LinhaTocavel onPress={() => aoAbrirFonte(pedido)} acessivel={`${rotulo} Ver fonte.`} minimo={76} estilo={{ paddingVertical: 12 }}>
          {conteudo}
        </LinhaTocavel>
      ) : (
        <View style={{ paddingVertical: 12 }}>{conteudo}</View>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: ESPACO[4] }}>
        <RastroDeConfianca confianca={achado.confianca} fonte={achado.fonte} texto={achado.fonte ? `${rotuloDaConfianca(achado.confianca, achado.fonte)} · ${nomeCurtoDaFonte(achado.fonte)}` : undefined} />
        {achadoPedeComposicao(achado) ? <LinkComSeta rotulo="Ver composição" onPress={aoVerComposicao} /> : null}
        {achadoPedeObras(achado) ? <LinkComSeta rotulo="Ver obras próximas" onPress={aoVerObras} /> : null}
      </View>
    </View>
  );
}

/** Aba Destaques (`renderDossierHighlights`, index.html 5261 a 5274). */
export function Destaques({ visao, coberto, vinculoConfirmado, aoAbrirFonte, aoVerComposicao, aoVerObras, aoConfirmarPredio, aoVerVerificacoes }: Props) {
  const achados = listaDeAchados(visao);
  const [principal, ...apoio] = achados;
  const semPredio = !visao.loteConfirmado;
  return (
    <View>
      {principal ? (
        <>
          <Sobretitulo>O que o Vereda encontrou</Sobretitulo>
          <Titulo2 estilo={{ marginBottom: 0 }}>Além do anúncio.</Titulo2>
          <AchadoPrincipal achado={principal} aoAbrirFonte={aoAbrirFonte} aoVerComposicao={aoVerComposicao} aoVerObras={aoVerObras} />
          {apoio.map((a) => (
            <AchadoDeApoio key={a.id} achado={a} aoAbrirFonte={aoAbrirFonte} aoVerComposicao={aoVerComposicao} aoVerObras={aoVerObras} />
          ))}
        </>
      ) : (
        <>
          <Sobretitulo>Leitura do imóvel</Sobretitulo>
          <Titulo2 estilo={{ marginBottom: 0 }}>{semPredio ? "Só o que o anúncio informa." : "Nenhuma divergência encontrada nos dados disponíveis."}</Titulo2>
          <Corpo estilo={{ marginTop: ESPACO[2] }}>
            {semPredio
              ? "Sem o prédio confirmado, o dossiê mostra os valores do anúncio e o que você informou."
              : "Explore o entorno e os registros do edifício para preparar a visita."}
          </Corpo>
        </>
      )}

      {semPredio ? (
        <View style={{ marginTop: ESPACO[4] }}>
          <CartaoSemPredio visao={visao} coberto={coberto} vinculoConfirmado={vinculoConfirmado} aoConfirmar={aoConfirmarPredio} />
        </View>
      ) : null}

      {/* `.ds-check-entry`: a entrada para "Antes de decidir". */}
      <View style={{ marginTop: ESPACO[3] }}>
        <Divisor />
        <LinhaTocavel
          onPress={aoVerVerificacoes}
          acessivel={`Antes de decidir, ${visao.perguntas.length} verificações para a visita`}
          estilo={{ paddingTop: ESPACO[4] }}
        >
          <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
            Antes de decidir
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18, marginTop: 4 }}>
            {`${visao.perguntas.length} ${visao.perguntas.length === 1 ? "verificação" : "verificações"} para a visita`}
          </Texto>
        </LinhaTocavel>
      </View>
    </View>
  );
}
