import * as WebBrowser from "expo-web-browser";
import { useMemo } from "react";
import { View } from "react-native";
import type { ContextoDoBairro, Edificio, Posicao, RuaDoBairro, VisaoDoDossie } from "../../dados/contratos";
import { derivarSintesesInteligentes, type CartaoDeSinteseHumana } from "../../dados/dossie/sintesesDaRua";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, comAlfa, type TokenDeCor } from "../../tema/tokens";
import type { PedidoDeFonte } from "../fonte/GavetaDeFonte";
import { RastroDeConfianca } from "../fonte/RastroDeConfianca";
import { nomeCurtoDaFonte, rotuloDaConfianca } from "../fonte/textos";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { ARua, type RespostaDaDefesaCivil } from "./ARua";
import { CartaoSemPredio } from "./CartaoSemPredio";
import { DiaADia } from "./DiaADia";
import { essenciaisDoPredio } from "../../dados/recife/essenciais";
import { LinhaDeObraNumerada } from "./MapaDoLote";
import { CaixaCreme, Corpo, LinkComSeta, Nota, Numero, NumeroEditorial, Secao, Seta, Sobretitulo, Titulo2 } from "./base";
import {
  corpoQueCabe,
  deltaDaPosicao,
  linhasDeObras,
  linhasDoContexto,
  notaDaPosicao,
  notaDasLicencas,
  posicoesDoBullet,
  resumoDasObras,
  textoSemPosicao,
  valorDaPosicao,
} from "./textos";

export type SecaoDoEntorno = "sol" | "obras" | "rua" | "leitura" | "preco" | "contexto";

type Props = {
  visao: VisaoDoDossie;
  /** Edifício confirmado do índice: usado na síntese de sol/sombra e na explicação de posição fiscal. */
  edificio: Edificio | null;
  vizinhos?: readonly Edificio[];
  orientacaoJanelaGraus?: number | null;
  slugBairro?: string | null;
  ruaDoBairro?: RuaDoBairro | null;
  contexto: ContextoDoBairro | null;
  nomeDoBairro: string;
  coberto: boolean;
  vinculoConfirmado: boolean;
  aoAbrirFonte: (pedido: PedidoDeFonte) => void;
  aoAbrirMapa: () => void;
  aoConfirmarPredio: () => void;
  aoMedirSecao: (secao: SecaoDoEntorno, y: number) => void;
  /** v1.1: a resposta da pessoa sobre os atendimentos da Defesa Civil na rua (null desfaz). */
  aoResponderDefesaCivil: (resposta: RespostaDaDefesaCivil) => void;
};


function CartaoSintese({ cartao }: { cartao: CartaoDeSinteseHumana }) {
  const { cor } = useTema();
  return (
    <CaixaCreme estilo={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <Texto
          tipo="etiqueta"
          cor="cor-barro-texto"
          style={{ fontSize: 10, lineHeight: 14, fontWeight: "700", letterSpacing: 0.7, textTransform: "uppercase", flexShrink: 1 }}
        >
          {cartao.sobretitulo}
        </Texto>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            backgroundColor: comAlfa(cor("cor-texto"), 0.06),
          }}
        >
          <Numero tamanho={11.5}>{cartao.medidaDestaque}</Numero>
        </View>
      </View>
      <Texto tipo="secao" style={{ fontSize: 14.5, lineHeight: 20, fontWeight: "600" }}>
        {cartao.manchete}
      </Texto>
      <Texto tipo="corpo" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 19 }}>
        {cartao.explicacaoHumana}
      </Texto>
      {cartao.dicaPratica ? (
        <View style={{ paddingTop: 6, borderTopWidth: 0.5, borderTopColor: cor("cor-linha") }}>
          <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 17.5 }}>
            {cartao.dicaPratica}
          </Texto>
        </View>
      ) : null}
      {cartao.urlFonte ? (
        <Pressionavel
          accessibilityRole="link"
          accessibilityLabel={`Fonte oficial: ${cartao.fonteCurta}`}
          onPress={() => void WebBrowser.openBrowserAsync(cartao.urlFonte!)}
          style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}
        >
          <Nota estilo={{ textDecorationLine: "underline" }}>{`Fonte: ${cartao.fonteCurta}`}</Nota>
        </Pressionavel>
      ) : (
        <Nota>{`Fonte: ${cartao.fonteCurta}`}</Nota>
      )}
    </CaixaCreme>
  );
}

function BarraBala({ posicao }: { posicao: Posicao }) {
  const { cor } = useTema();
  const { valor, referencia } = posicoesDoBullet(posicao);
  const rotuloDoImovel = posicao.fonte === "itbi" ? "Preço anunciado" : "Este imóvel";
  const medianaRotulo = posicao.fonte === "suas_analises" ? "Mediana das suas análises" : "Mediana fiscal";
  return (
    <View style={{ marginTop: 20, marginBottom: 9 }}>
      <View
        accessible
        role="img"
        accessibilityLabel={`${rotuloDoImovel} ${valorDaPosicao(posicao, posicao.valor, true)}; ${medianaRotulo.toLowerCase()} ${valorDaPosicao(posicao, posicao.referencia.mediana, true)}`}
        style={{ height: 10, borderRadius: 6, backgroundColor: cor("cor-sutil"), justifyContent: "center" }}
      >
        <View style={{ width: `${valor}%`, height: 10, borderRadius: 6, backgroundColor: cor("cor-acao") }} />
        <View
          style={{
            position: "absolute",
            left: `${referencia}%`,
            marginLeft: -3.5,
            top: -9,
            width: 7,
            height: 28,
            borderRadius: 4,
            backgroundColor: cor("cor-texto"),
            borderWidth: 2,
            borderColor: cor("cor-superficie"),
          }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 15, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 13, height: 7, borderRadius: 3, backgroundColor: cor("cor-acao") }} />
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
              {rotuloDoImovel}
            </Texto>
          </View>
          <Numero tamanho={17} estilo={{ marginTop: 4 }}>{valorDaPosicao(posicao, posicao.valor)}</Numero>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: cor("cor-texto") }} />
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
              {medianaRotulo}
            </Texto>
          </View>
          <Numero tamanho={17} estilo={{ marginTop: 4 }}>{valorDaPosicao(posicao, posicao.referencia.mediana)}</Numero>
        </View>
      </View>
    </View>
  );
}

function PrecoNoContexto({ visao, edificio, aoAbrirFonte }: Pick<Props, "visao" | "edificio" | "aoAbrirFonte">) {
  const posicao = visao.posicao;
  if (!posicao) return <Corpo>{textoSemPosicao(visao, edificio)}</Corpo>;
  const delta = deltaDaPosicao(posicao);
  const corDoDelta: TokenDeCor = delta.tom === "acima" ? "cor-barro-texto" : delta.tom === "abaixo" ? "cor-salvia-escura" : "cor-texto";
  const confianca = posicao.fonte === "suas_analises" ? "declarado" : "oficial";
  const pedido: PedidoDeFonte = {
    fonte: posicao.fonte,
    confianca,
    dado: { rotulo: posicao.rotulo, valor: valorDaPosicao(posicao, posicao.valor) },
  };
  const textoDoRastro = `${rotuloDaConfianca(confianca, posicao.fonte)} · ${nomeCurtoDaFonte(posicao.fonte)}`;
  const nota = notaDaPosicao(posicao);
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 4 }}>
        {delta.metrica ? (
          <Numero tamanho={corpoQueCabe(delta.metrica, 130, 38, 24)} cor={corDoDelta}>
            {delta.metrica}
          </Numero>
        ) : null}
        <View style={{ flex: 1 }}>
          <Texto tipo="corpo" style={{ fontSize: 13, lineHeight: 19 }}>
            {delta.direcao}
          </Texto>
        </View>
      </View>
      <BarraBala posicao={posicao} />
      {nota ? <Nota estilo={{ marginBottom: ESPACO[1] }}>{nota}</Nota> : null}
      <Pressionavel
        onPress={() => aoAbrirFonte(pedido)}
        accessibilityRole="button"
        accessibilityLabel={`Ver fonte: ${textoDoRastro}`}
        style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" }}
      >
        <RastroDeConfianca confianca={confianca} fonte={posicao.fonte} texto={textoDoRastro} />
        <Seta tamanho={12} cor="cor-texto-apoio" />
      </Pressionavel>
    </View>
  );
}

function ObrasProximas({ visao, aoAbrirFonte, aoAbrirMapa }: Pick<Props, "visao" | "aoAbrirFonte" | "aoAbrirMapa">) {
  const obras = visao.obras;
  if (!obras) return null;
  const linhas = linhasDeObras(obras);
  const nota = notaDasLicencas(obras);
  const pedido: PedidoDeFonte = {
    fonte: "licenciamento",
    confianca: "oficial",
    dado: { rotulo: "Obras licenciadas a até 150 m, últimos 24 meses", valor: String(obras.relevantes24m) },
  };
  const textoDoRastro = `${rotuloDaConfianca("oficial", "licenciamento")} · ${nomeCurtoDaFonte("licenciamento")}`;
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <NumeroEditorial tamanho={40} apertado={-0.035}>
          {String(obras.relevantes24m)}
        </NumeroEditorial>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
          {obras.relevantes24m === 1 ? "obra licenciada perto" : "obras licenciadas perto"}
        </Texto>
      </View>
      <Corpo estilo={{ marginTop: ESPACO[2] }}>{resumoDasObras(obras)}</Corpo>
      {linhas.length > 0 ? (
        <View style={{ marginTop: ESPACO[3] }}>
          {linhas.map((l) => (
            <LinhaDeObraNumerada key={l.numero} numero={l.numero} categoria={l.categoria} titulo={l.titulo} detalhe={l.detalhe} rotulo={l.rotuloAcessivel} />
          ))}
        </View>
      ) : null}
      {nota ? <Nota estilo={{ marginTop: ESPACO[2] }}>{nota}</Nota> : null}
      <LinkComSeta rotulo="Abrir mapa" onPress={aoAbrirMapa} acessivel="Abrir mapa do lote com as obras como pontos" />
      <Pressionavel
        onPress={() => aoAbrirFonte(pedido)}
        accessibilityRole="button"
        accessibilityLabel={`Ver fonte: ${textoDoRastro}`}
        style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" }}
      >
        <RastroDeConfianca confianca="oficial" fonte="licenciamento" texto={textoDoRastro} />
        <Seta tamanho={12} cor="cor-texto-apoio" />
      </Pressionavel>
    </View>
  );
}

function ContextoDoBairroSecao({ contexto, aoAbrirFonte }: { contexto: ContextoDoBairro; aoAbrirFonte: Props["aoAbrirFonte"] }) {
  const { cor } = useTema();
  const linhas = linhasDoContexto(contexto);
  return (
    <View>
      {linhas.map((l, i) => (
        <Pressionavel
          key={l.id}
          onPress={() => aoAbrirFonte({ fonte: l.fonte, confianca: "oficial", dado: { rotulo: l.rotulo, valor: l.valor } })}
          accessibilityRole="button"
          accessibilityLabel={`${l.rotulo}: ${l.valor}${l.apoio ? `. ${l.apoio}` : ""}. Ver fonte.`}
          style={{
            minHeight: 48,
            paddingVertical: 10,
            borderTopWidth: i === 0 ? 0 : 0.5,
            borderTopColor: cor("cor-linha"),
            borderRadius: RAIO.quadrado,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ flex: 1, fontSize: 12, lineHeight: 17 }}>
              {l.rotulo}
            </Texto>
            <Numero tamanho={14} estilo={{ textAlign: "right" }}>
              {l.valor}
            </Numero>
          </View>
          {l.apoio ? (
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16, marginTop: 2 }}>
              {l.apoio}
            </Texto>
          ) : null}
        </Pressionavel>
      ))}
      <Nota estilo={{ marginTop: ESPACO[2] }}>Toque em uma linha para ver a fonte.</Nota>
    </View>
  );
}

/** Aba Entorno: obras, rua, leitura cruzada e contexto. A análise solar fica no cartão próprio de janelas. */
export function Entorno({
  visao,
  edificio,
  slugBairro = null,
  ruaDoBairro = null,
  contexto,
  nomeDoBairro,
  coberto,
  vinculoConfirmado,
  aoAbrirFonte,
  aoAbrirMapa,
  aoConfirmarPredio,
  aoMedirSecao,
  aoResponderDefesaCivil,
}: Props) {
  const aluguel = visao.custo.principal.rotulo === "Aluguel anunciado";
  const sinteses = useMemo(
    () =>
      derivarSintesesInteligentes({
        slugBairro: slugBairro ?? edificio?.bairro ?? null,
        edificio,
        ruaDoBairro,
        andar: visao.especificacoes.andar,
      }),
    [slugBairro, edificio, ruaDoBairro, visao.especificacoes.andar],
  );
  const cartoesDeSintese = [
    sinteses.calorEArvores,
    sinteses.chuvaEAlagamento,
    sinteses.arboviroses,
    sinteses.ruidoDiaNoite,
    sinteses.rendaDoSetor,
  ].filter((c): c is CartaoDeSinteseHumana => c !== null);

  return (
    <View>
      <Secao semTopo aoMedir={(y) => aoMedirSecao("obras", y)}>
        <Sobretitulo>Mudanças na vizinhança</Sobretitulo>
        <Titulo2>Obras próximas</Titulo2>
        {visao.obras ? (
          <ObrasProximas visao={visao} aoAbrirFonte={aoAbrirFonte} aoAbrirMapa={aoAbrirMapa} />
        ) : (
          <View style={{ marginTop: ESPACO[3] }}>
            <CartaoSemPredio visao={visao} coberto={coberto} vinculoConfirmado={vinculoConfirmado} aoConfirmar={aoConfirmarPredio} />
          </View>
        )}
      </Secao>
      {visao.rua ? (
        <Secao aoMedir={(y) => aoMedirSecao("rua", y)}>
          <ARua rua={visao.rua} aoAbrirFonte={aoAbrirFonte} aoResponderDefesaCivil={aoResponderDefesaCivil} />
        </Secao>
      ) : null}
      {/* VE04: tempo a pé até mercado, farmácia, praça e ônibus, com plano B (some fora do piloto). */}
      {edificio && essenciaisDoPredio(edificio.bairro, edificio.id) ? (
        <Secao>
          <DiaADia edificio={edificio} />
        </Secao>
      ) : null}
      {cartoesDeSintese.length > 0 ? (
        <Secao aoMedir={(y) => aoMedirSecao("leitura", y)}>
          <Sobretitulo>Dados cruzados em linguagem simples</Sobretitulo>
          <Titulo2>O que esperar no dia a dia</Titulo2>
          <Corpo estilo={{ marginBottom: ESPACO[3] }}>
            Cruzamento automático de satélite térmico, relevo, canais, transporte, saúde ambiental e Censo 2022 para esta localização.
          </Corpo>
          <View style={{ gap: ESPACO[3] }}>
            {cartoesDeSintese.map((c) => (
              <CartaoSintese key={c.id} cartao={c} />
            ))}
          </View>
        </Secao>
      ) : null}
      <Secao aoMedir={(y) => aoMedirSecao("preco", y)}>
        <Sobretitulo>Preço no contexto</Sobretitulo>
        <Titulo2>{aluguel ? "Aluguel por m²" : "Preço e avaliação fiscal"}</Titulo2>
        <PrecoNoContexto visao={visao} edificio={edificio} aoAbrirFonte={aoAbrirFonte} />
      </Secao>
      <Secao semBase aoMedir={(y) => aoMedirSecao("contexto", y)}>
        <Sobretitulo>Registros do bairro</Sobretitulo>
        <Titulo2>{`${nomeDoBairro}, em números`}</Titulo2>
        {contexto ? (
          <ContextoDoBairroSecao contexto={contexto} aoAbrirFonte={aoAbrirFonte} />
        ) : (
          <Corpo>Ainda não há contexto cadastral para este bairro.</Corpo>
        )}
      </Secao>
    </View>
  );
}
