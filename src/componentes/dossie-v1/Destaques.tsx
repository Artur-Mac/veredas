import { useState } from "react";
import { View } from "react-native";
import type { Achado, Pergunta, VisaoDoDossie } from "../../dados/contratos";
import { destaquesDosIndicadores, type Indicador } from "../../dados/dossie/indicadores";
import { CartaoDoIndicador, Divergencias, RotinaNumOlhar } from "./Indicadores";
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
  /** 15/11/2026: indicadores comparados com o bairro (src/dados/dossie/indicadores.ts). */
  indicadores?: readonly Indicador[];
  bairro?: string | null;
  predioId?: string | null;
  aoAbrirPergunta?: (p: Pergunta) => void;
  aoVerRotina?: () => void;
  aoInvestigar?: (id: Indicador["id"]) => void;
};

/** Divergência do anúncio × cadastro: vai para a área própria, não para os destaques (sabatina, 15/11/2026). */
const eDivergencia = (a: Achado) => (a.tipo === "iptu" && a.titulo !== "IPTU no cadastro") || a.tipo === "anomalia";
/** "IPTU no cadastro" só repete o que o custo já mostra ("~R$ X pelo cadastro"): sai da aba. */
const eRepeticao = (a: Achado) => a.tipo === "iptu" && a.titulo === "IPTU no cadastro";
/** Achado que pesa como destaque por si: área que não confere e estrutura antiga a confirmar. */
const eAchadoForte = (a: Achado) => (a.tipo === "area" && /não confere/i.test(a.titulo)) || a.tipo === "estrutura";

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
  const [expandido, setExpandido] = useState(false);
  const textoLongo = achado.texto.length > 130;
  return (
    <CaixaCreme laranja estilo={{ marginTop: 14, gap: ESPACO[1] }}>
      <Texto tipo="titulo-tela" role="heading" style={{ fontSize: 23, lineHeight: 28, fontWeight: "500", letterSpacing: -0.4 }}>
        {achado.titulo}
      </Texto>
      {achado.medida ? <Medida numero={achado.medida.numero} unidade={achado.medida.unidade} /> : null}
      <Texto tipo="corpo" cor="cor-texto-apoio" numberOfLines={textoLongo && !expandido ? 2 : undefined} style={{ fontSize: 15, lineHeight: 22, marginTop: ESPACO[1] }}>
        {achado.texto}
      </Texto>
      {textoLongo ? (
        <LinkComSeta rotulo={expandido ? "Mostrar menos" : "Ler texto completo"} onPress={() => setExpandido((v) => !v)} discreto seta={false} />
      ) : null}
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

/**
 * Aba Destaques (15/11/2026): até 3 destaques — os achados fortes do anúncio e os indicadores mais fora da média do
 * bairro —, a rotina a pé num olhar e as divergências do anúncio numa área própria. O resto fica no Entorno e no Edifício.
 */
export function Destaques({ visao, coberto, vinculoConfirmado, aoAbrirFonte, aoVerComposicao, aoVerObras, aoConfirmarPredio, aoVerVerificacoes, indicadores = [], bairro = null, predioId = null, aoAbrirPergunta, aoVerRotina, aoInvestigar }: Props) {
  const achados = listaDeAchados(visao);
  const fortes = achados.filter(eAchadoForte);
  const divergencias = achados.filter(eDivergencia);
  const fortesDosIndicadores = destaquesDosIndicadores(indicadores, Math.max(0, 3 - fortes.length));
  // Sem indicadores (sem prédio ou bairro sem camada), os achados que não são divergência continuam como antes.
  const restantes = indicadores.length ? [] : achados.filter((a) => !eDivergencia(a) && !eAchadoForte(a) && !eRepeticao(a));
  const [principal, ...apoio] = [...fortes, ...restantes];
  const semPredio = !visao.loteConfirmado;
  const temDestaque = Boolean(principal) || fortesDosIndicadores.length > 0;
  return (
    <View>
      {temDestaque ? (
        <>
          <Sobretitulo>O que mais pesa</Sobretitulo>
          <Titulo2 estilo={{ marginBottom: 0 }}>Destaques deste prédio.</Titulo2>
          {principal ? <AchadoPrincipal achado={principal} aoAbrirFonte={aoAbrirFonte} aoVerComposicao={aoVerComposicao} aoVerObras={aoVerObras} /> : null}
          {apoio.map((a) => (
            <AchadoDeApoio key={a.id} achado={a} aoAbrirFonte={aoAbrirFonte} aoVerComposicao={aoVerComposicao} aoVerObras={aoVerObras} />
          ))}
          {fortesDosIndicadores.length ? (
            <View style={{ gap: ESPACO[2], marginTop: ESPACO[3] }}>
              {fortesDosIndicadores.map((i) => <CartaoDoIndicador key={i.id} indicador={i} aoInvestigar={aoInvestigar} />)}
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Sobretitulo>Leitura do imóvel</Sobretitulo>
          <Titulo2 estilo={{ marginBottom: 0 }}>{semPredio ? "Só dados do anúncio." : "Dentro da média do bairro."}</Titulo2>
          <Corpo estilo={{ marginTop: ESPACO[2] }}>
            {semPredio
              ? "Confirme o prédio para cruzar dados da rua, obras e entorno."
              : "Sem desvios relevantes frente ao bairro. Veja Entorno e Raio-X abaixo."}
          </Corpo>
        </>
      )}

      {aoVerRotina ? (
        <View style={{ marginTop: ESPACO[4] }}>
          <RotinaNumOlhar bairro={bairro} predioId={predioId} aoVerMais={aoVerRotina} />
        </View>
      ) : null}

      {divergencias.length ? (
        <View style={{ marginTop: ESPACO[4] }}>
          <Divergencias achados={divergencias} perguntas={visao.perguntas} aoAbrirPergunta={aoAbrirPergunta ?? (() => undefined)} aoCorrigir={(a) => (achadoPedeComposicao(a) ? aoVerComposicao : null)} />
        </View>
      ) : null}

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
