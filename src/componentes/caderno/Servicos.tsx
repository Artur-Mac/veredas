import { useMemo, useState } from "react";
import { View } from "react-native";
import { baseDeServicos, CATEGORIAS_CNEFE, servicosProximos } from "../../dados/recife/servicos";
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
export function ServicosDeEntorno({ centro, referenciaDaVisita }: { centro: [number, number] | null; referenciaDaVisita?: Caderno["localizacaoDaVisita"] }) {
  const precisaoInsuficiente = referenciaDaVisita && (referenciaDaVisita.precisaoM === null || referenciaDaVisita.precisaoM > 100);
  return <GrupoLocal titulo="Serviços registrados no entorno" apoio="Ensino, saúde e usos religiosos registrados no Censo 2022.">
    {referenciaDaVisita ? <Texto tipo="apoio">Referência: posição registrada por você em {new Date(referenciaDaVisita.em).toLocaleString("pt-BR")}. Precisão horizontal informada: {referenciaDaVisita.precisaoM === null ? "não disponível" : `aproximadamente ${Math.round(referenciaDaVisita.precisaoM)} m`}. Não confirma o prédio ou distância à janela.</Texto> : null}
    {precisaoInsuficiente ? <Texto>A precisão desta posição não permite a consulta de proximidade. Registre novamente durante a visita; o limite inicial desta ferramenta é 100 m de precisão horizontal informada.</Texto> : centro ? (centro[0] < -35.1 || centro[0] > -34.8 || centro[1] < -8.18 || centro[1] > -7.9 ? <Texto>Referência fora da área de consulta desta base do Recife.</Texto> : <Lista centro={centro} />) : <Texto>Confirme a localização do prédio ou registre uma posição durante a visita para consultar proximidade. Você pode continuar sem essa informação.</Texto>}
  </GrupoLocal>;
}
