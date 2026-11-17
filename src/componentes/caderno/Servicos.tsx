import { useMemo, useState } from "react";
import { View } from "react-native";
import { baseDeServicos, CATEGORIAS_CNEFE, servicosProximos } from "../../dados/recife/servicos";
import { AVISO_DO_ATRITO, fatosDeAtrito, type FatoDeAtrito } from "../../dados/recife/atrito";
import { Texto } from "../Texto";
import { EscolhaLocal, GrupoLocal } from "./blocos";
import type { Caderno } from "../../dados/caderno";

function Lista({ centro }: { centro: [number, number] }) {
  const [categoria, setCategoria] = useState<"4" | "5" | "8">("4");
  const [raio, setRaio] = useState<"150" | "300" | "600">("300");
  const resultado = useMemo(() => {
    try {
      const base = baseDeServicos();
      return { base, busca: servicosProximos(base, centro, Number(raio), Number(categoria) as 4 | 5 | 8), erro: null };
    } catch { return { base: null, busca: null, erro: "Esta base não pôde ser aberta. Seu dossiê continua disponível." }; }
  }, [centro, raio, categoria]);
  return <View style={{ gap: 10 }}>
    <EscolhaLocal rotulo="Tipo de serviço" valor={categoria} opcoes={[{ valor: "4", rotulo: "Ensino" }, { valor: "5", rotulo: "Saúde" }, { valor: "8", rotulo: "Religioso" }]} aoEscolher={setCategoria} />
    <EscolhaLocal rotulo="Raio em linha reta" valor={raio} opcoes={[{ valor: "150", rotulo: "150 m" }, { valor: "300", rotulo: "300 m" }, { valor: "600", rotulo: "600 m" }]} aoEscolher={setRaio} />
    {resultado.busca ? <>
      <Texto>{resultado.busca.total} pontos de endereço no raio · mostrando {resultado.busca.itens.length}.</Texto>
      {resultado.busca.itens.map((p, i) => <Texto key={`${p.coordenada.join("-")}-${i}`} tipo="apoio">{CATEGORIAS_CNEFE[Number(categoria) as 4 | 5 | 8]} · aproximadamente {p.distanciaM} m em linha reta do ponto cadastral.</Texto>)}
      <Texto tipo="apoio">Fonte: IBGE, CNEFE / Censo 2022. Coordenadas originais do levantamento (nível 1); não certificam fachada ou distância à janela. Não comprova funcionamento atual, vaga, rota acessível ou ruído.</Texto>
      <Texto tipo="apoio">Um local com mais de uma porta pode ter vários pontos. Coordenadas coincidentes da mesma categoria foram deduplicadas. {resultado.base?.excluidos.qualidade ?? 0} registros das categorias selecionadas ficaram fora por outro nível de geocodificação na base municipal.</Texto>
    </> : <Texto role="alert">{resultado.erro}</Texto>}
  </View>;
}
/**
 * 15/11/2026: estabelecimentos do CNEFE em volta do prédio, por categoria (nunca o nome): primeiro o que pode trazer
 * barulho ou movimento à noite e de dia (bar e venda de bebida, oficina, supermercado), separado da conveniência do dia a
 * dia (padaria, farmácia, mercadinho, lanchonete). Retrato do levantamento de 2022.
 */
function AtritoEConveniencia({ bairro, predioId }: { bairro: string; predioId: string }) {
  const fatos = useMemo(() => { try { return fatosDeAtrito(bairro, predioId); } catch { return null; } }, [bairro, predioId]);
  if (fatos === null) return <Texto tipo="apoio">Sem leitura publicada nesta área ainda.</Texto>;
  if (!fatos.length) return <Texto tipo="apoio">Nenhum bar, oficina, mercado ou comércio do dia a dia a até 300 m no Censo 2022.</Texto>;
  const grupo = (titulo: string, xs: FatoDeAtrito[]) => xs.length ? <View style={{ gap: 4 }} role="group" aria-label={titulo}>
    <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 11, lineHeight: 16, fontWeight: "700" }}>{titulo}</Texto>
    {xs.map(f => <View key={f.categoria} style={{ gap: 1 }}><Texto style={{ fontSize: 13, lineHeight: 19 }}>{f.frase}</Texto><Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>{f.detalhe.replace(` ${AVISO_DO_ATRITO}`, "")}</Texto></View>)}
  </View> : null;
  return <View style={{ gap: 10 }}>
    {grupo("Pode trazer barulho ou movimento", fatos.filter(f => f.grupo === "atrito"))}
    {grupo("Conveniência do dia a dia", fatos.filter(f => f.grupo === "conveniencia"))}
    {grupo("Obras no levantamento de 2022", fatos.filter(f => f.grupo === "retrato"))}
    <Texto tipo="apoio">{`Fonte: IBGE, CNEFE do Censo 2022 (descrição do estabelecimento lida só para a categoria; o nome não é guardado). ${AVISO_DO_ATRITO}`}</Texto>
  </View>;
}

export function ServicosDeEntorno({ centro, referenciaDaVisita, bairro = null, predioId = null }: { centro: [number, number] | null; referenciaDaVisita?: Caderno["localizacaoDaVisita"]; bairro?: string | null; predioId?: string | null }) {
  const precisaoInsuficiente = referenciaDaVisita && (referenciaDaVisita.precisaoM === null || referenciaDaVisita.precisaoM > 100);
  return <>
  {bairro && predioId ? <GrupoLocal titulo="Bares, oficinas e comércio em volta" apoio="Censo 2022, por categoria: o que pode trazer barulho separado da conveniência do dia a dia." aberto>
    <AtritoEConveniencia bairro={bairro} predioId={predioId} />
  </GrupoLocal> : null}
  <GrupoLocal titulo="Serviços registrados no entorno" apoio="Ensino, saúde e usos religiosos registrados no Censo 2022.">
    {referenciaDaVisita ? <Texto tipo="apoio">Referência: posição registrada por você em {new Date(referenciaDaVisita.em).toLocaleString("pt-BR")}. Precisão horizontal informada: {referenciaDaVisita.precisaoM === null ? "não disponível" : `aproximadamente ${Math.round(referenciaDaVisita.precisaoM)} m`}. Não confirma o prédio ou distância à janela.</Texto> : null}
    {precisaoInsuficiente ? <Texto>A precisão desta posição não permite a consulta de proximidade. Registre novamente durante a visita; o limite inicial desta ferramenta é 100 m de precisão horizontal informada.</Texto> : centro ? (centro[0] < -35.1 || centro[0] > -34.8 || centro[1] < -8.18 || centro[1] > -7.9 ? <Texto>Referência fora da área de consulta desta base do Recife.</Texto> : <Lista centro={centro} />) : <Texto>Confirme a localização do prédio ou registre uma posição durante a visita para consultar proximidade. Você pode continuar sem essa informação.</Texto>}
  </GrupoLocal>
  </>;
}
