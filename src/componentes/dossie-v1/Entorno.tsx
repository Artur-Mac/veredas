import { View } from "react-native";
import type { ContextoDoBairro, Edificio, Posicao, VisaoDoDossie } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, type TokenDeCor } from "../../tema/tokens";
import type { PedidoDeFonte } from "../fonte/GavetaDeFonte";
import { RastroDeConfianca } from "../fonte/RastroDeConfianca";
import { nomeCurtoDaFonte, rotuloDaConfianca } from "../fonte/textos";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { CartaoSemPredio } from "./CartaoSemPredio";
import { LinhaDeObraNumerada } from "./MapaDoLote";
import { Corpo, LinkComSeta, Nota, Numero, NumeroEditorial, Secao, Seta, Sobretitulo, Titulo2 } from "./base";
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

export type SecaoDoEntorno = "obras" | "preco" | "contexto";

type Props = {
  visao: VisaoDoDossie;
  /** Edifício confirmado do índice: só para explicar por que a compra não tem posição. */
  edificio: Edificio | null;
  contexto: ContextoDoBairro | null;
  nomeDoBairro: string;
  coberto: boolean;
  vinculoConfirmado: boolean;
  aoAbrirFonte: (pedido: PedidoDeFonte) => void;
  aoAbrirMapa: () => void;
  aoConfirmarPredio: () => void;
  aoMedirSecao: (secao: SecaoDoEntorno, y: number) => void;
};

/** Barra bala (`.ds-bullet`, index.html 5284 a 5290): o preenchimento é o imóvel; o traço escuro, a mediana. */
function BarraBala({ posicao }: { posicao: Posicao }) {
  const { cor } = useTema();
  const { valor, referencia } = posicoesDoBullet(posicao);
  // Compra: o preço do anúncio contra as avaliações fiscais por unidade (R$). Aluguel: R$/m² contra as suas análises.
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

/** Aba Entorno: obras recentes, o preço no contexto e o contexto do bairro. */
export function Entorno({
  visao, edificio, contexto, nomeDoBairro, coberto, vinculoConfirmado, aoAbrirFonte, aoAbrirMapa, aoConfirmarPredio, aoMedirSecao,
}: Props) {
  const aluguel = visao.custo.principal.rotulo === "Aluguel anunciado";
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
