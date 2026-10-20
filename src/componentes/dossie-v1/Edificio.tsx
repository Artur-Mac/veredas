import { View } from "react-native";
import type { Edificio as EdificioDoIndice, Fato, Pergunta, Prioridade, VisaoDoDossie } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, comAlfa } from "../../tema/tokens";
import type { PedidoDeFonte } from "../fonte/GavetaDeFonte";
import { TracoDeConfianca } from "../fonte/RastroDeConfianca";
import { rotuloDaConfianca } from "../fonte/textos";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { CartaoSemPredio } from "./CartaoSemPredio";
import { Corpo, LinhaTocavel, LinkComSeta, Nota, Numero, NumeroEditorial, Secao, Sobretitulo, Titulo2 } from "./base";
import { PRIORIDADES, VERIFICACOES_VISIVEIS, corpoQueCabe, resumoDoValor } from "./textos";

export type SecaoDoEdificio = "verificacoes" | "cadastro" | "valor";

type Props = {
  visao: VisaoDoDossie;
  /** Edifício do índice, só para o resumo do valor na compra. */
  edificio: EdificioDoIndice | null;
  coberto: boolean;
  vinculoConfirmado: boolean;
  prioridade: Prioridade;
  aoMudarPrioridade: (p: Prioridade) => void;
  aoAbrirPergunta: (p: Pergunta) => void;
  aoAbrirRoteiro: () => void;
  aoAbrirFonte: (pedido: PedidoDeFonte) => void;
  aoAbrirCadastro: () => void;
  aoConfirmarPredio: () => void;
  aoMedirSecao: (secao: SecaoDoEdificio, y: number) => void;
};

function Prioridades({ atual, aoMudar }: { atual: Prioridade; aoMudar: (p: Prioridade) => void }) {
  const { cor } = useTema();
  return (
    <View role="group" accessibilityLabel="Sua prioridade" style={{ flexDirection: "row", gap: 4, marginTop: 7, marginBottom: 9 }}>
      {PRIORIDADES.map((p) => {
        const ativa = p.id === atual;
        return (
          <Pressionavel
            key={p.id}
            onPress={() => aoMudar(p.id)}
            accessibilityRole="button"
            accessibilityLabel={p.rotulo}
            accessibilityState={{ selected: ativa }}
            aria-pressed={ativa}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 7,
              borderWidth: 1,
              borderColor: ativa ? comAlfa(cor("cor-barro"), 0.5) : cor("cor-linha"),
              backgroundColor: ativa ? cor("cor-barro-suave") : cor("cor-papel-claro"),
            }}
          >
            <Texto tipo="apoio" cor={ativa ? "cor-barro-texto" : "cor-texto-apoio"} style={{ fontSize: 12, lineHeight: 16, fontWeight: ativa ? "600" : "400" }}>
              {p.rotulo}
            </Texto>
          </Pressionavel>
        );
      })}
    </View>
  );
}

/** "Antes de decidir" (`renderDossierChecks`, index.html 5528 a 5532): as três primeiras verificações da prioridade escolhida. */
function AntesDeDecidir({ visao, prioridade, aoMudarPrioridade, aoAbrirPergunta, aoAbrirRoteiro }: Pick<Props, "visao" | "prioridade" | "aoMudarPrioridade" | "aoAbrirPergunta" | "aoAbrirRoteiro">) {
  const { cor } = useTema();
  const total = visao.perguntas.length;
  const primeiras = visao.perguntas.slice(0, VERIFICACOES_VISIVEIS);
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 21 }}>
        <Texto tipo="titulo-tela" role="heading" style={{ fontSize: 31, lineHeight: 33, fontWeight: "500", letterSpacing: -0.62, maxWidth: 190 }}>
          {"Antes de\ndecidir."}
        </Texto>
        <View accessible accessibilityLabel={`${total} a conferir`} style={{ alignItems: "flex-end", paddingTop: 1 }}>
          <NumeroEditorial tamanho={40} cor="cor-barro-texto">
            {String(total)}
          </NumeroEditorial>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10, lineHeight: 14, marginTop: 5 }}>
            a conferir
          </Texto>
        </View>
      </View>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>
        O que pesa mais para você?
      </Texto>
      <Prioridades atual={prioridade} aoMudar={aoMudarPrioridade} />
      <View>
        {primeiras.map((p, i) => (
          <View key={p.id} style={{ borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: cor("cor-linha") }}>
            <LinhaTocavel onPress={() => aoAbrirPergunta(p)} acessivel={`${p.titulo}. ${p.pista}`} minimo={58} estilo={{ paddingVertical: 14 }}>
              <Texto tipo="corpo" style={{ fontSize: i === 0 ? 20 : 18, lineHeight: i === 0 ? 26 : 24, fontWeight: "600", letterSpacing: -0.45 }}>
                {p.titulo}
              </Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18, marginTop: 4 }}>
                {p.pista}
              </Texto>
            </LinhaTocavel>
          </View>
        ))}
      </View>
      <LinkComSeta rotulo="Ver todas as verificações" onPress={aoAbrirRoteiro} />
    </View>
  );
}

function FatoDaGrade({ fato, aoAbrirFonte }: { fato: Fato; aoAbrirFonte: Props["aoAbrirFonte"] }) {
  const pedido: PedidoDeFonte | null =
    fato.fonte !== null && fato.confianca !== "nao_sabemos"
      ? { fonte: fato.fonte, confianca: fato.confianca, dado: { rotulo: fato.rotulo, valor: fato.valor } }
      : null;
  const numerico = /\d/.test(fato.valor);
  const conteudo = (
    <>
      {numerico ? (
        <Numero tamanho={corpoQueCabe(fato.valor, 140, 24, 12)} peso="500">
          {fato.valor}
        </Numero>
      ) : (
        <Texto tipo="corpo" style={{ fontSize: 16, lineHeight: 22, fontWeight: "600" }}>
          {fato.valor}
        </Texto>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 }}>
        <TracoDeConfianca confianca={fato.confianca} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ flex: 1, fontSize: 11, lineHeight: 15 }}>
          {fato.rotulo}
        </Texto>
      </View>
    </>
  );
  const rotulo = `${fato.rotulo}: ${fato.valor}. ${rotuloDaConfianca(fato.confianca, fato.fonte)}.`;
  const estilo = { width: "47%" as const, flexGrow: 1, minWidth: 0, minHeight: 48, justifyContent: "center" as const };
  return pedido ? (
    <Pressionavel onPress={() => aoAbrirFonte(pedido)} accessibilityRole="button" accessibilityLabel={`${rotulo} Ver fonte.`} style={[estilo, { borderRadius: RAIO.quadrado }]}>
      {conteudo}
    </Pressionavel>
  ) : (
    <View accessible accessibilityLabel={rotulo} style={estilo}>
      {conteudo}
    </View>
  );
}

function EstruturaECadastro({ visao, aoAbrirFonte, aoAbrirCadastro }: Pick<Props, "visao" | "aoAbrirFonte" | "aoAbrirCadastro">) {
  return (
    <View>
      <Sobretitulo>Identidade cadastral</Sobretitulo>
      <Titulo2 estilo={{ marginBottom: 14 }}>Estrutura e cadastro</Titulo2>
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 20, rowGap: 14 }}>
        {visao.cadastro.map((f) => (
          <FatoDaGrade key={f.id} fato={f} aoAbrirFonte={aoAbrirFonte} />
        ))}
      </View>
      <Nota estilo={{ marginTop: 12 }}>Toque em um dado para ver a fonte.</Nota>
      <LinkComSeta rotulo="Abrir cadastro completo" onPress={aoAbrirCadastro} />
    </View>
  );
}

function ValorEHistorico({ visao, edificio, aoAbrirFonte }: Pick<Props, "visao" | "edificio" | "aoAbrirFonte">) {
  const { cor } = useTema();
  const resumo = resumoDoValor(visao, edificio);
  const pedido: PedidoDeFonte | null = resumo.fonte
    ? { fonte: resumo.fonte, confianca: resumo.confianca, dado: { rotulo: resumo.rotulo, valor: resumo.valor } }
    : null;
  const corpo = (
    <>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>
        {resumo.rotulo}
      </Texto>
      <Numero tamanho={corpoQueCabe(resumo.valor, 280, 26, 16)} estilo={{ marginTop: 7 }}>
        {resumo.valor}
      </Numero>
      {resumo.apoio ? <Nota estilo={{ marginTop: 6 }}>{resumo.apoio}</Nota> : null}
    </>
  );
  return (
    <View>
      <Sobretitulo>O valor em perspectiva</Sobretitulo>
      <Titulo2 estilo={{ marginBottom: 12 }}>Valor e histórico</Titulo2>
      {pedido ? (
        <Pressionavel onPress={() => aoAbrirFonte(pedido)} accessibilityRole="button" accessibilityLabel={`${resumo.frase}. Ver fonte.`} style={{ borderRadius: RAIO.quadrado, paddingVertical: 4 }}>
          {corpo}
        </Pressionavel>
      ) : (
        <View accessible accessibilityLabel={resumo.frase}>
          {corpo}
        </View>
      )}
      {visao.historico.length > 0 ? (
        <View role="list" style={{ marginTop: 16 }}>
          {visao.historico.map((h, i) => (
            <View
              key={`${h.quando}-${i}`}
              role="listitem"
              accessible
              accessibilityLabel={`${h.quando}: ${h.texto}`}
              style={{ borderLeftWidth: 1, borderLeftColor: cor("cor-linha-forte"), paddingLeft: 16, paddingBottom: i === visao.historico.length - 1 ? 0 : 13 }}
            >
              <View
                style={{
                  position: "absolute",
                  left: -5,
                  top: 3,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: cor("cor-salvia"),
                  borderWidth: 2,
                  borderColor: cor("cor-superficie"),
                }}
              />
              <Numero tamanho={11} peso="400" cor="cor-texto-apoio">
                {h.quando}
              </Numero>
              <Texto tipo="corpo" style={{ fontSize: 12, lineHeight: 18, fontWeight: "600", marginTop: 3 }}>
                {h.texto}
              </Texto>
            </View>
          ))}
        </View>
      ) : (
        <Corpo estilo={{ marginTop: ESPACO[3], fontSize: 13, lineHeight: 19 }}>Sem eventos registrados no cadastro deste prédio.</Corpo>
      )}
      {visao.historico.length > 0 ? (
        <Nota estilo={{ marginTop: ESPACO[3] }}>Construção: IPTU 2026 · transmissões: ITBI · demolições: licenciamento de obras.</Nota>
      ) : null}
    </View>
  );
}

/** Aba Edifício: "Antes de decidir", "Estrutura e cadastro" e "Valor e histórico". */
export function EdificioDoDossie(props: Props) {
  const { visao, coberto, vinculoConfirmado, aoConfirmarPredio, aoMedirSecao } = props;
  return (
    <View>
      <Secao semTopo aoMedir={(y) => aoMedirSecao("verificacoes", y)}>
        <AntesDeDecidir
          visao={visao}
          prioridade={props.prioridade}
          aoMudarPrioridade={props.aoMudarPrioridade}
          aoAbrirPergunta={props.aoAbrirPergunta}
          aoAbrirRoteiro={props.aoAbrirRoteiro}
        />
      </Secao>
      {visao.loteConfirmado ? (
        <>
          <Secao aoMedir={(y) => aoMedirSecao("cadastro", y)}>
            <EstruturaECadastro visao={visao} aoAbrirFonte={props.aoAbrirFonte} aoAbrirCadastro={props.aoAbrirCadastro} />
          </Secao>
          <Secao semBase aoMedir={(y) => aoMedirSecao("valor", y)}>
            <ValorEHistorico visao={visao} edificio={props.edificio} aoAbrirFonte={props.aoAbrirFonte} />
          </Secao>
        </>
      ) : (
        <Secao semBase aoMedir={(y) => aoMedirSecao("cadastro", y)}>
          <Sobretitulo>Identificação do edifício</Sobretitulo>
          <Titulo2 estilo={{ marginBottom: ESPACO[3] }}>{coberto ? "Primeiro, confirme o prédio." : "Sem cadastro neste bairro."}</Titulo2>
          <CartaoSemPredio visao={visao} coberto={coberto} vinculoConfirmado={vinculoConfirmado} aoConfirmar={aoConfirmarPredio} />
        </Secao>
      )}
    </View>
  );
}
