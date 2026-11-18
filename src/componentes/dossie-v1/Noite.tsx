// VE08: "Voltando à noite" (dentro de "A pé, a partir da entrada") e "De que lado vem o barulho" (aba Edifício).
// Primeiro o que muda para a pessoa; postes, pedidos de lâmpada e atropelamentos ficam atrás de um toque.
import { useState } from "react";
import { View } from "react-native";
import { ladoDoBarulho, voltaANoite } from "../../dados/recife/noite";
import { ESPACO } from "../../tema/tokens";
import { Texto } from "../Texto";
import { Corpo, LinkComSeta, Nota, Sobretitulo, Titulo2 } from "./base";

export function VoltandoANoite({ bairro, predioId }: { bairro: string | null; predioId: string | null }) {
  const [aberto, setAberto] = useState(false);
  const v = voltaANoite(bairro, predioId);
  if (!v) return null;
  return (
    <View style={{ marginTop: ESPACO[4], gap: ESPACO[2] }} role="group" aria-label="Voltando à noite">
      <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>Voltando à noite</Texto>
      <Corpo>{v.frase}</Corpo>
      <LinkComSeta rotulo={aberto ? "Ocultar o caminho à noite" : "Ver o caminho à noite"} discreto seta={false} onPress={() => setAberto((x) => !x)} />
      {aberto ? <View style={{ gap: 6 }}>{v.detalhes.map((d) => <Nota key={d}>{d}</Nota>)}</View> : null}
    </View>
  );
}

export function LadoDoBarulho({ bairro, predioId, centro = null, aoLevarParaVisita }: { bairro: string | null; predioId: string | null; centro?: readonly [number, number] | null; aoLevarParaVisita: (texto: string) => Promise<boolean> }) {
  const [levado, setLevado] = useState<"sim" | "nao" | null>(null);
  const b = ladoDoBarulho(bairro, predioId, centro);
  if (!b) return null;
  return (
    <View style={{ gap: ESPACO[2] }}>
      <Sobretitulo>De que lado vem o barulho</Sobretitulo>
      <Titulo2>{b.titulo}</Titulo2>
      <Corpo>{b.frase}</Corpo>
      {levado === "sim" ? (
        <Texto role="status" tipo="apoio" cor="cor-texto-apoio">Levado para o roteiro da visita.</Texto>
      ) : (
        <LinkComSeta rotulo={levado === "nao" ? "Não coube no roteiro (limite de perguntas)" : "Levar para a visita"} acessivel="Levar a conferência do barulho para o roteiro da visita"
          onPress={() => void aoLevarParaVisita(b.pergunta).then((ok) => setLevado(ok ? "sim" : "nao"))} />
      )}
      <Nota>{b.nota}</Nota>
    </View>
  );
}
