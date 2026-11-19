import { useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ScrollView, View, type ScrollViewInstance } from "react-native";
import { Botao } from "../componentes/Botao";
import { Coluna } from "../componentes/casca/Coluna";
import { carregarCadastro } from "../componentes/dossie-v1/cadastro";
import { AvisoDasCamadas, useCamadas } from "../componentes/EsperaDasCamadas";
import { camadasDasAnalises } from "../dados/camadasDasTelas";
import { CapturaSolar, EscolhaSolar } from "../componentes/sol/Captura";
import { ExploracaoSolar } from "../componentes/sol/Exploracao";
import { Cabecalho, Tela } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import type { CoordenadaSolar, JanelaSolar } from "../dados/sol/contratos";
import { guardarJanela, registroSolar, removerJanela } from "../dados/sol/janelas";
import { useAnalises } from "../estado/Analises";
import { useTema } from "../tema/Tema";

export default function TelaSolar() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { lista, analiseAtiva, pronto, atualizar } = useAnalises();
  const analise = id ? lista.find(a => a.id === id) : analiseAtiva;
  const { cor } = useTema();
  // D036: o cadastro dos imóveis do caderno fica fora do bundle; a tela espera por ele.
  const camadas = useCamadas(camadasDasAnalises(lista));
  const comCamadas = camadas.estado === "pronta";
  const cadastro = useMemo(() => analise && comCamadas ? carregarCadastro(analise) : null, [analise, comCamadas]);
  const registro = useMemo(() => analise ? registroSolar(analise) : null, [analise]);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [captura, setCaptura] = useState<"nova" | "editar" | null>(null), [gerenciar, setGerenciar] = useState(false);
  const [excluir, setExcluir] = useState(false), [erro, setErro] = useState("");
  const rolagem = useRef<ScrollViewInstance>(null);
  const abrirCaptura = (tipo: "nova" | "editar") => { setCaptura(tipo); setGerenciar(false); rolagem.current?.scrollTo({ y: 0, animated: false }); };
  const janela = registro?.janelas.find(j => j.id === (selecionada ?? registro.ativaId)) ?? registro?.janelas[0] ?? null;
  const coordenada = useMemo<CoordenadaSolar | null>(() => {
    if (janela?.coordenada) return janela.coordenada;
    const e = cadastro?.edificio;
    if (e) return { longitude: e.centro[0], latitude: e.centro[1], origem: "cadastro", precisaoM: null };
    const p = analise?.caderno?.localizacaoDaVisita;
    return p ? { longitude: p.longitude, latitude: p.latitude, origem: "gps_da_visita", precisaoM: p.precisaoM } : null;
  }, [janela?.coordenada, cadastro?.edificio, analise?.caderno?.localizacaoDaVisita]);
  const efetiva = useMemo(() => janela ? coordenada === janela.coordenada ? janela : { ...janela, coordenada } : null, [janela, coordenada]);
  const salvar = async (j: JanelaSolar) => {
    if (!analise) return;
    await atualizar(analise.id, a => guardarJanela(a, j, new Date().toISOString()));
    setSelecionada(j.id); setCaptura(null); setErro(""); setExcluir(false);
    if (captura || !janela) rolagem.current?.scrollTo({ y: 0, animated: false });
  };
  const apagar = async () => {
    if (!analise || !janela) return;
    try { await atualizar(analise.id, a => removerJanela(a, janela.id, new Date().toISOString())); setSelecionada(null); setExcluir(false); }
    catch { setErro("Não foi possível remover a janela. Tente de novo."); }
  };
  const alternarProtecao = async (p: JanelaSolar["protecoes"][number]) => {
    if (!analise || !janela) return;
    const idJanela = janela.id;
    await atualizar(analise.id, a => {
      const atual = registroSolar(a).janelas.find(j => j.id === idJanela);
      if (!atual) throw new Error("Esta janela não está mais no caderno.");
      const em = new Date().toISOString();
      const nova = guardarJanela(a, { ...atual, protecoes: atual.protecoes.includes(p) ? atual.protecoes.filter(x => x !== p) : [...atual.protecoes, p], revisadoEm: em }, em);
      // Anotar uma proteção não troca a seleção de uma janela aberta enquanto a escrita aguardava na fila.
      if (nova.caderno?.solar) nova.caderno.solar.ativaId = registroSolar(a).ativaId;
      return nova;
    });
  };
  return <Tela>
    <Cabecalho titulo="Sol nas suas janelas" pai="/dossie" />
    <ScrollView ref={rolagem} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Coluna>
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: cor("cor-linha"), backgroundColor: cor("cor-superficie"), padding: 20, gap: 18 }}>
          {!pronto ? <Texto>Abrindo suas janelas…</Texto> : camadas.estado !== "pronta" ? <AvisoDasCamadas estado={camadas.estado} tentarDeNovo={camadas.tentarDeNovo} carregando="Carregando os dados dos seus imóveis…" oQue="os dados dos bairros dos seus imóveis" /> : !analise ? <Texto>Abra um imóvel no dossiê para registrar suas janelas.</Texto> : captura || !janela ? <CapturaSolar key={`${captura ?? "nova"}-${captura === "editar" ? janela?.id : "nova"}`}
            existente={captura === "editar" ? efetiva : null} coordenada={coordenada}
            aoGuardar={salvar} aoCancelar={() => { setCaptura(null); if (!janela) setErro("Você pode voltar quando estiver no imóvel."); }} /> : <>
            {registro && registro.janelas.length > 1 ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{registro.janelas.map(j => <EscolhaSolar key={j.id} rotulo={j.nome} selecionado={j.id === janela.id} aoEscolher={() => { setSelecionada(j.id); setExcluir(false); }} />)}</View> : null}
            {efetiva ? <ExploracaoSolar key={janela.id} janela={efetiva} analiseId={analise.id} predio={cadastro?.edificio ?? null} andarDeclarado={analise.declarados.andar.valor} lista={lista} aoGuardar={salvar} aoEditar={() => abrirCaptura("editar")} aoTrocarVisao={() => rolagem.current?.scrollTo({ y: 0, animated: false })} aoAlternarProtecao={alternarProtecao} /> : null}
            <Botao rotulo="Gerenciar janelas" variante="texto" expandido={gerenciar} onPress={() => setGerenciar(!gerenciar)} />
            {gerenciar ? <View style={{ gap: 8 }}>
              <Botao rotulo="Adicionar outra janela" desativado={(registro?.janelas.length ?? 0) >= 20} onPress={() => abrirCaptura("nova")} />
              <Botao rotulo="Rever direção desta janela" onPress={() => abrirCaptura("editar")} />
              <Botao rotulo="Remover esta janela" variante="texto" onPress={() => setExcluir(true)} />
              {excluir ? <View style={{ gap: 8 }}><Texto>{`Remover o registro de ${janela.nome}?`}</Texto><Botao rotulo="Confirmar remoção" onPress={() => void apagar()} /><Botao rotulo="Manter janela" variante="texto" onPress={() => setExcluir(false)} /></View> : null}
            </View> : null}
          </>}
          {erro ? <Texto role="alert">{erro}</Texto> : null}
        </View>
      </Coluna>
    </ScrollView>
  </Tela>;
}
