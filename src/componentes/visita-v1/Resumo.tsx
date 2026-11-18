// Aba "Resumo" (index.html: renderLiveVisit 5908–5913, CSS .vv-summary-* 3198–3206): o que a pessoa conferiu,
// respondeu e percebeu. Sem nota nem veredito sobre o imóvel.
import * as Clipboard from "expo-clipboard";
import { useState, type ReactNode } from "react";
import type { JanelaSolar } from "../../dados/sol/contratos";
import { nomeDaDirecao, origemDaJanela } from "../../dados/sol/janelas";
import { Pressable, View } from "react-native";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, TOQUE_MINIMO } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Icone } from "../Icone";
import { Texto } from "../Texto";
import { Chamada, LinkDeAcao, Superficie } from "./blocos";
import { duracaoPorExtenso, resumoDaVisitaEmTexto, type ResumoDaVisita } from "./logica";

function Nota({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { cor } = useTema();
  return (
    <View style={{ paddingVertical: 17, gap: 6, borderTopWidth: 1, borderTopColor: cor("cor-linha") }}>
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

export function Resumo({ resumo, aoReverRespostas, janelas, aoExplorarSol }: { resumo: ResumoDaVisita; aoReverRespostas: () => void; janelas?: JanelaSolar[]; aoExplorarSol?: () => void }) {
  const { cor } = useTema();
  const [incluirImpressoes, setIncluirImpressoes] = useState(false);
  const [avisoCopia, setAvisoCopia] = useState<{ texto: string; erro?: boolean } | null>(null);
  const faltam = resumo.pendentes.length;
  const janelasTexto = (janelas ?? []).map(
    (j) => `${j.nome}${j.graus !== null ? ` · ${nomeDaDirecao(j.graus)}` : " · direção a conferir"} (${origemDaJanela(j)})`,
  );
  const copiarResumo = async () => {
    try {
      await Clipboard.setStringAsync(
        resumoDaVisitaEmTexto(resumo, { incluirImpressoesPessoais: incluirImpressoes, janelasTexto }),
      );
      setAvisoCopia({ texto: "Resumo da visita copiado para colar ou guardar." });
    } catch {
      setAvisoCopia({ texto: "Não foi possível copiar o resumo agora.", erro: true });
    }
  };
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

      {janelas && janelas.length > 0 ? <Nota titulo="Sol nas suas janelas">
        {janelas.map(j => <TextoDaNota key={j.id}>{`${j.nome}${j.graus !== null ? ` · ${nomeDaDirecao(j.graus)}` : " · direção a conferir"}. ${origemDaJanela(j)}.`}</TextoDaNota>)}
        {aoExplorarSol ? <LinkDeAcao rotulo="Explorar o sol" onPress={aoExplorarSol} /> : null}
      </Nota> : !janelas && resumo.orientacao ? (
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

      <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 8 }}>
        {resumo.notas ? (
          <Pressable
            testID="visita-toggle-impressoes-copia"
            onPress={() => {
              setIncluirImpressoes((v) => !v);
              setAvisoCopia(null);
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: incluirImpressoes }}
            style={{
              minHeight: TOQUE_MINIMO,
              paddingHorizontal: 12,
              borderRadius: RAIO.pilula,
              backgroundColor: incluirImpressoes ? cor("cor-texto") : cor("cor-papel-claro"),
              justifyContent: "center",
              alignSelf: "flex-start",
            }}
          >
            <Texto
              tipo="apoio"
              cor={incluirImpressoes ? "cor-papel-claro" : "cor-texto"}
              style={{ fontSize: 12.5, fontWeight: "600" }}
            >
              {`Incluir minhas impressões na cópia: ${incluirImpressoes ? "sim" : "não (padrão privado)"}`}
            </Texto>
          </Pressable>
        ) : null}
        <Botao rotulo="Copiar resumo da visita" variante="secundario" onPress={() => void copiarResumo()} />
        {avisoCopia ? (
          <Texto
            tipo="apoio"
            cor={avisoCopia.erro ? "cor-barro-texto" : "cor-salvia-escura"}
            role={avisoCopia.erro ? "alert" : "status"}
            style={{ fontSize: 12.5, fontWeight: "600" }}
          >
            {avisoCopia.texto}
          </Texto>
        ) : null}
      </View>

      <LinkDeAcao rotulo="Rever respostas" onPress={aoReverRespostas} />
    </Superficie>
  );
}
