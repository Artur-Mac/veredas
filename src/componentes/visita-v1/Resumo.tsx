// Aba "Resumo" (index.html: renderLiveVisit 5908–5913, CSS .vv-summary-* 3198–3206): o que a pessoa conferiu,
// respondeu e percebeu. Sem nota nem veredito sobre o imóvel.
import type { ReactNode } from "react";
import { View } from "react-native";
import { ESPACO } from "../../tema/tokens";
import { Icone } from "../Icone";
import { Texto } from "../Texto";
import { Chamada, LinkDeAcao, Superficie } from "./blocos";
import { duracaoPorExtenso, type ResumoDaVisita } from "./logica";

function Nota({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={{ paddingVertical: 17, gap: 6 }}>
      <Texto style={{ fontSize: 14, lineHeight: 21, fontWeight: "600" }}>{titulo}</Texto>
      {children}
    </View>
  );
}

function TextoDaNota({ children }: { children: string }) {
  return (
    <Texto cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 20 }}>
      {children}
    </Texto>
  );
}

export function Resumo({ resumo, aoReverRespostas }: { resumo: ResumoDaVisita; aoReverRespostas: () => void }) {
  const faltam = resumo.pendentes.length;
  return (
    <Superficie>
      <Chamada>Visita salva neste aparelho</Chamada>
      <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: ESPACO[2], marginTop: 15 }}>
        <Texto tipo="titulo-tela" style={{ fontSize: 42, lineHeight: 48, fontWeight: "500", letterSpacing: -2 }}>
          {String(resumo.conferidas.length)}
        </Texto>
        <Texto cor="cor-texto-apoio" style={{ fontSize: 14 }}>
          {`de ${resumo.total} ${resumo.total === 1 ? "pergunta conferida" : "perguntas conferidas"}`}
        </Texto>
      </View>
      <Texto cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 21, marginTop: 6 }}>
        {faltam > 0 ? `${faltam} ${faltam === 1 ? "ponto ainda para confirmar" : "pontos ainda para confirmar"}.` : "Seu roteiro está completo."}
      </Texto>

      {resumo.segundos > 0 ? (
        <Nota titulo="Tempo no imóvel">
          <TextoDaNota>{duracaoPorExtenso(resumo.segundos)}</TextoDaNota>
        </Nota>
      ) : null}

      {resumo.conferidas.length > 0 ? (
        <Nota titulo="Conferido">
          <View style={{ gap: ESPACO[2] }}>
            {resumo.conferidas.map((p) => (
              <View key={p.id} style={{ flexDirection: "row", alignItems: "flex-start", gap: ESPACO[2] }}>
                <View style={{ paddingTop: 2 }}>
                  <Icone nome="check" tamanho="p" cor="cor-salvia-escura" />
                </View>
                <Texto style={{ flex: 1, fontSize: 13, lineHeight: 20 }}>{p.titulo}</Texto>
              </View>
            ))}
          </View>
        </Nota>
      ) : null}

      {resumo.respostas.map((r) => (
        <Nota key={r.id} titulo={r.titulo}>
          <TextoDaNota>{r.texto}</TextoDaNota>
        </Nota>
      ))}

      {resumo.orientacao ? (
        <Nota titulo="Luz na janela">
          <TextoDaNota>{`${resumo.orientacao.nome} (${resumo.orientacao.rotulo}) · ${resumo.orientacao.graus}° registrados por você`}</TextoDaNota>
        </Nota>
      ) : null}

      {resumo.ruido ? (
        <Nota titulo="Ruído percebido">
          <TextoDaNota>{`${resumo.ruido} · sua percepção`}</TextoDaNota>
        </Nota>
      ) : null}

      {resumo.notas ? (
        <Nota titulo="Suas impressões">
          <TextoDaNota>{resumo.notas}</TextoDaNota>
        </Nota>
      ) : null}

      {faltam > 0 ? (
        <Nota titulo="Ainda para confirmar">
          <View style={{ gap: 4 }}>
            {resumo.pendentes.map((p) => (
              <Texto key={p.id} cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 20 }}>
                {p.titulo}
              </Texto>
            ))}
          </View>
        </Nota>
      ) : null}

      <LinkDeAcao rotulo="Rever respostas" onPress={aoReverRespostas} />
    </Superficie>
  );
}
