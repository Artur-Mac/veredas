// "No imóvel": o painel escuro de campo (`.field-dark-panel` e `.field-dark-row`, index.html 2625–2642) com
// cronômetro, roteiro conferível, "Sinta o espaço" (luz e ruído) e impressões. Sob `TemaEscuro`, todas as peças
// leem os tokens escuros; o fundo é `cor-campo` e o texto, `cor-texto-campo`.
import type { ReactNode } from "react";
import { View } from "react-native";
import type { Pergunta, Visita } from "../../dados/contratos";
import { TemaEscuro, useTema } from "../../tema/Tema";
import { ESPACO, RAIO, TOQUE_MINIMO, comAlfa } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { BarraDeProgresso, CampoDeTexto, Chamada, LinkDeAcao, TituloDeSecao } from "./blocos";
import { LinhaDePergunta } from "./LinhaDePergunta";
import { OPCOES_DE_RUIDO, MAX_NOTAS, formatarCronometro } from "./logica";
import { OrientacaoDaJanela } from "./Orientacao";
import type { ControleDaVisita } from "./useVisita";

/** `.field-dark-row`: faixa de 12 px de respiro com divisória fina embaixo, menos na última. */
function Faixa({ children, ultima = false }: { children: ReactNode; ultima?: boolean }) {
  const { cor } = useTema();
  return (
    <View
      style={{
        paddingVertical: ESPACO[3],
        borderBottomWidth: ultima ? 0 : 1,
        borderBottomColor: comAlfa(cor("cor-texto-campo"), 0.1),
      }}
    >
      {children}
    </View>
  );
}

function Cronometro({ controle }: { controle: ControleDaVisita }) {
  const { rodando, segundos } = controle;
  const estado = rodando ? "Visita em andamento" : segundos > 0 ? "Visita pausada" : "Pronto para começar";
  const rotulo = rodando ? "Pausar" : segundos > 0 ? "Retomar" : "Começar";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: ESPACO[4] }}>
      <View style={{ flexShrink: 1 }}>
        <Texto
          tipo="numero"
          cor="cor-texto-campo"
          accessibilityRole="timer"
          accessibilityLabel={`Tempo da visita ${formatarCronometro(segundos)}`}
          style={{ fontSize: 32, lineHeight: 38, letterSpacing: -1.3 }}
        >
          {formatarCronometro(segundos)}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, marginTop: 4 }}>
          {estado}
        </Texto>
      </View>
      <Botao
        rotulo={rotulo}
        variante="secundario"
        pilula
        icone={rodando ? "player-pause" : "player-play"}
        tamanhoIcone="p"
        onPress={controle.alternarCronometro}
      />
    </View>
  );
}

/** Ruído em três opções: percepção da pessoa, sem decibéis. Tocar de novo na escolhida limpa o registro. */
function RuidoDeFora({ ruido, aoEscolher }: { ruido: Visita["ruido"]; aoEscolher: (ruido: Visita["ruido"]) => void }) {
  const { cor } = useTema();
  return (
    <View style={{ gap: ESPACO[3] }}>
      <View>
        <Texto style={{ fontSize: 16, lineHeight: 23, fontWeight: "600", letterSpacing: -0.4 }}>Ruído de fora</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 17, marginTop: 5 }}>
          Compare com a janela aberta e fechada. É a sua percepção: o Vereda não mede decibéis.
        </Texto>
      </View>
      <View role="group" accessibilityLabel="Ruído percebido" style={{ flexDirection: "row", gap: ESPACO[2] }}>
        {OPCOES_DE_RUIDO.map((opcao) => {
          const escolhida = ruido === opcao.valor;
          return (
            <Pressionavel
              key={opcao.valor}
              accessibilityRole="button"
              accessibilityLabel={opcao.nome}
              accessibilityState={{ selected: escolhida }}
              aria-pressed={escolhida}
              onPress={() => aoEscolher(escolhida ? null : opcao.valor)}
              style={{
                flex: 1,
                minHeight: TOQUE_MINIMO,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: RAIO.icone,
                borderWidth: 1,
                borderColor: escolhida ? cor("cor-acao") : cor("cor-linha-forte"),
                backgroundColor: escolhida ? cor("cor-acao") : undefined,
              }}
            >
              <Texto tipo="etiqueta" cor={escolhida ? "cor-sobre-acao" : "cor-texto"} style={{ fontWeight: escolhida ? "700" : "500" }} numberOfLines={1}>
                {opcao.nome}
              </Texto>
            </Pressionavel>
          );
        })}
      </View>
    </View>
  );
}

type PropsDoPainel = {
  perguntas: Pergunta[];
  controle: ControleDaVisita;
  aoAbrirPergunta: (id: string) => void;
  aoAdicionarPergunta: () => void;
};

function Painel({ perguntas, controle, aoAbrirPergunta, aoAdicionarPergunta }: PropsDoPainel) {
  const { cor } = useTema();
  const { visita } = controle;
  if (!visita) return null;
  const conferidas = perguntas.filter((p) => visita.verificadas.includes(p.id)).length;
  return (
    <View
      style={{
        backgroundColor: cor("cor-campo"),
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto-campo"), 0.12),
        boxShadow: `0 10px 28px -8px ${comAlfa(cor("cor-campo"), 0.35)}`,
      }}
    >
      <Faixa>
        <Cronometro controle={controle} />
      </Faixa>

      <Faixa>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: ESPACO[3] }}>
          <TituloDeSecao>Seu roteiro</TituloDeSecao>
          <Texto tipo="apoio" cor="cor-texto-apoio" accessibilityLabel={`${conferidas} de ${perguntas.length} conferidas`}>
            {`${conferidas} de ${perguntas.length}`}
          </Texto>
        </View>
        <BarraDeProgresso feitas={conferidas} total={perguntas.length} rotulo="Perguntas conferidas" />
        {perguntas.map((p) => (
          <LinhaDePergunta
            key={p.id}
            pergunta={p}
            conferida={visita.verificadas.includes(p.id)}
            resposta={visita.respostas[p.id]}
            aoConferir={() => controle.alternarVerificada(p.id)}
            aoAbrir={() => aoAbrirPergunta(p.id)}
          />
        ))}
        <LinkDeAcao rotulo="Sua pergunta" icone="plus" seta={false} onPress={aoAdicionarPergunta} />
      </Faixa>

      <Faixa>
        <Chamada>Sinta o espaço</Chamada>
        <View style={{ height: ESPACO[3] }} />
        <TituloDeSecao tamanho={20}>Luz na janela</TituloDeSecao>
        <View style={{ height: ESPACO[3] }} />
        <OrientacaoDaJanela graus={visita.orientacaoGraus} aoMudar={controle.definirOrientacao} />
      </Faixa>

      <Faixa>
        <RuidoDeFora ruido={visita.ruido} aoEscolher={controle.definirRuido} />
      </Faixa>

      <Faixa ultima>
        <CampoDeTexto
          rotulo="Suas impressões"
          linhas={4}
          maxLength={MAX_NOTAS}
          value={controle.notas}
          onChangeText={controle.definirNotas}
          placeholder="O que você gostou? O que pesou contra?"
        />
      </Faixa>
    </View>
  );
}

/** O painel de campo: sempre escuro, em qualquer tema do app. */
export function PainelDeCampo(props: PropsDoPainel) {
  return (
    <TemaEscuro>
      <Painel {...props} />
    </TemaEscuro>
  );
}
