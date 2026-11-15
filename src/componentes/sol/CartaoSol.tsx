import { router } from "expo-router";
import { View } from "react-native";
import type { AnaliseV2 } from "../../dados/contratos";
import { nomeDaDirecao, origemDaJanela, registroSolar } from "../../dados/sol/janelas";
import { useTema } from "../../tema/Tema";
import { Botao } from "../Botao";
import { Texto } from "../Texto";

export function CartaoSol({ analise, aoAbrir }: { analise: AnaliseV2; aoAbrir?: () => void }) {
  const { cor } = useTema();
  const registro = registroSolar(analise);
  const janela = registro.janelas.find(j => j.id === registro.ativaId) ?? registro.janelas[0];
  const declarada = analise.url.match(/(?:^|[-/])(nascente|poente)(?:[-/?#]|$)/i)?.[1]?.toLowerCase();
  return <View style={{ padding: 20, gap: 10, backgroundColor: cor("cor-superficie"), borderColor: cor("cor-linha"), borderWidth: 1, borderRadius: 18 }}>
    <Texto tipo="apoio" cor="cor-barro-texto" style={{ letterSpacing: 1, fontSize: 10 }}>NA VISITA</Texto>
    <Texto tipo="titulo-tela" role="heading" style={{ fontSize: 26, lineHeight: 31 }}>Sol nas suas janelas</Texto>
    <Texto tipo="corpo">{janela?.graus !== null && janela?.graus !== undefined ? `${janela.nome} · voltada para ${nomeDaDirecao(janela.graus)}` : "Descubra como o sol chega à sala e aos quartos."}</Texto>
    {janela ? <Texto tipo="apoio" cor="cor-texto-apoio">{origemDaJanela(janela)}</Texto> : declarada ? <Texto tipo="apoio" cor="cor-texto-apoio">{`Anúncio menciona: ${declarada}. Confira na visita.`}</Texto> : null}
    <Botao rotulo={janela ? "Explorar o sol" : "Verificar na visita"} onPress={aoAbrir ?? (() => router.push({ pathname: "/sol", params: { id: analise.id } }))} />
  </View>;
}
