// Aba "Preparar" (index.html: renderLiveVisit 5916–5918, CSS .vv-number-title 3159, .vv-message 3183): quantos pontos
// conferir, os três primeiros numerados, o roteiro completo, "Adicionar pergunta" e "Antes de marcar".
import { View } from "react-native";
import type { Pergunta, Visita } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { ESPACO } from "../../tema/tokens";
import { Texto } from "../Texto";
import { LinkDeAcao, Superficie, TituloDeSecao } from "./blocos";
import { LinhaDePergunta } from "./LinhaDePergunta";

const PERGUNTAS_EM_DESTAQUE = 3;

export function Preparar({
  perguntas,
  visita,
  aoAbrirPergunta,
  aoVerRoteiro,
  aoAdicionarPergunta,
  aoPrepararMensagem,
}: {
  perguntas: Pergunta[];
  visita: Visita;
  aoAbrirPergunta: (id: string) => void;
  aoVerRoteiro: () => void;
  aoAdicionarPergunta: () => void;
  aoPrepararMensagem: () => void;
}) {
  const { cor } = useTema();
  const n = perguntas.length;
  return (
    <Superficie>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginBottom: 17 }}>
        <Texto
          tipo="titulo-tela"
          cor="cor-barro-texto"
          style={{ fontSize: 38, lineHeight: 42, fontWeight: "500" }}
          accessibilityLabel={`${n} ${n === 1 ? "ponto" : "pontos"} para conferir`}
        >
          {String(n)}
        </Texto>
        <TituloDeSecao>{n === 1 ? "ponto para conferir" : "pontos para conferir"}</TituloDeSecao>
      </View>
      <Texto cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 21, marginBottom: ESPACO[2] }}>
        A partir da análise deste imóvel.
      </Texto>

      {perguntas.slice(0, PERGUNTAS_EM_DESTAQUE).map((p, i) => (
        <LinhaDePergunta
          key={p.id}
          pergunta={p}
          numero={i + 1}
          conferida={visita.verificadas.includes(p.id)}
          resposta={visita.respostas[p.id]}
          aoAbrir={() => aoAbrirPergunta(p.id)}
        />
      ))}
      {n > PERGUNTAS_EM_DESTAQUE ? <LinkDeAcao rotulo="Ver roteiro completo" onPress={aoVerRoteiro} /> : null}
      <LinkDeAcao rotulo="Adicionar pergunta" icone="plus" seta={false} onPress={aoAdicionarPergunta} />

      {/* `.vv-message` */}
      <View style={{ marginTop: 26, paddingTop: 22, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 10 }}>
        <TituloDeSecao>Antes de marcar</TituloDeSecao>
        <Texto cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 22 }}>
          Peça as informações que faltam e combine a visita com o corretor.
        </Texto>
        <LinkDeAcao rotulo="Preparar mensagem" onPress={aoPrepararMensagem} />
      </View>
    </Superficie>
  );
}
