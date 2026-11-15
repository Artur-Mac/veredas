import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { diaNoRecife, horaLegivel, instanteNoRecife, periodoDeSol } from "../../dados/sol/astronomia";
import type { JanelaSolar } from "../../dados/sol/contratos";
import { lerExposicao, trajetoria, type EstadoSolar } from "../../dados/sol/geometria";
import { nomeDaDirecao, origemDaJanela, registroSolar } from "../../dados/sol/janelas";
import { useTema } from "../../tema/Tema";
import { obterPosicaoDaVisita } from "../../plataforma/posicaoDaVisita";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { carregarCadastro } from "../dossie-v1/cadastro";
import { CampoDeTexto } from "../visita-v1/blocos";
import { EscolhaSolar } from "./Captura";
import { ControleSolar } from "./Controle";
import { EntornoSolar } from "./EntornoSolar";
import { IlustracaoSolar } from "./Ilustracao";

export const TEXTO_DO_ESTADO: Record<EstadoSolar, string> = {
  sol_potencial: "O Sol está à frente desta janela",
  sol_atras_da_face: "O Sol está do outro lado da fachada",
  bloqueado_no_modelo: "Um vizinho faz sombra neste cenário",
  noite: "Agora é noite no percurso solar",
  indeterminado: "Precisamos conferir alguns dados",
};
function ReguaDoDia({ janela, dia }: { janela: JanelaSolar; dia: string }) {
  const { cor } = useTema();
  const serie = useMemo(() => janela.coordenada ? trajetoria(janela, dia, null, undefined, 30) : [], [janela, dia]);
  if (!janela.coordenada || janela.referencia !== "verdadeiro") return null;
  return <View accessible accessibilityLabel="Faixa de exposição potencial ao longo do dia, sem calcular obstáculos" style={{ gap: 5 }}>
    <View style={{ flexDirection: "row", gap: 1, height: 6, overflow: "hidden", borderRadius: 3 }}>
      {serie.map(p => <View key={p.minuto} style={{ flex: 1, backgroundColor: cor(p.leitura.estado === "sol_potencial" ? "cor-acao" : "cor-linha" ) }} />)}
    </View>
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10 }}>0h</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10 }}>Laranja: potencial de sol direto</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10 }}>24h</Texto>
    </View>
  </View>;
}
function ComparacaoDeJanelas({ atual, analiseAtualId, lista, dia, minutos }: { atual: JanelaSolar; analiseAtualId: string; lista: AnaliseV2[]; dia: string; minutos: number }) {
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const opcoes = useMemo(() => lista.flatMap(a => {
    const c = carregarCadastro(a).edificio;
    return registroSolar(a).janelas.filter(j => !(a.id === analiseAtualId && j.id === atual.id)).map(j => ({ chave: `${a.id}:${j.id}`, analise: a.nome,
      janela: j.coordenada || !c ? j : { ...j, coordenada: { longitude: c.centro[0], latitude: c.centro[1], origem: "cadastro" as const, precisaoM: null } } }));
  }).filter(o => o.janela.coordenada && o.janela.graus !== null && o.janela.referencia === "verdadeiro"), [lista, atual.id, analiseAtualId]);
  const outra = opcoes.find(o => o.chave === escolhida);
  return <View style={{ gap: 12 }}>
    <Texto tipo="titulo-tela" style={{ fontSize: 24 }}>O sol em cada janela</Texto>
    <Texto tipo="apoio" cor="cor-texto-apoio">Mesma data e horário. Sem calcular obstáculos.</Texto>
    <View style={{ gap: 6 }}>{opcoes.map(o => <EscolhaSolar key={o.chave} rotulo={`${o.janela.nome} · ${o.analise}`} selecionado={o.chave === escolhida} aoEscolher={() => setEscolhida(o.chave)} />)}</View>
    {!opcoes.length ? <Texto>Registre mais uma janela para comparar. Pode ser outro cômodo ou outro imóvel salvo.</Texto> : null}
    {outra ? [atual, outra.janela].map((j, i) => <View key={i} style={{ gap: 6, paddingVertical: 10 }}>
      <Texto tipo="secao">{`${j.nome} · ${nomeDaDirecao(j.graus!)}`}</Texto>
      <Texto tipo="corpo">{TEXTO_DO_ESTADO[lerExposicao(j, dia, minutos).estado]}</Texto>
      <ReguaDoDia janela={j} dia={dia} />
      <Texto tipo="apoio" cor="cor-texto-apoio">{origemDaJanela(j)}</Texto>
    </View>) : null}
  </View>;
}

export function ExploracaoSolar({ janela, analiseId, predio, andarDeclarado, lista, aoGuardar, aoEditar, aoTrocarVisao, aoAlternarProtecao }: {
  janela: JanelaSolar; analiseId: string; predio: Edificio | null; andarDeclarado: number | null; lista: AnaliseV2[];
  aoGuardar: (j: JanelaSolar) => Promise<void>; aoEditar: () => void;
  aoTrocarVisao?: () => void;
  aoAlternarProtecao?: (p: JanelaSolar["protecoes"][number]) => Promise<void>;
}) {
  const { cor } = useTema();
  const [hoje] = useState(() => diaNoRecife(new Date()));
  const [dia, setDia] = useState(hoje), [minutos, setMinutos] = useState(900);
  const [dataAberta, setDataAberta] = useState(false), [textoData, setTextoData] = useState(hoje.split("-").reverse().join("/"));
  const [detalhe, setDetalhe] = useState<"entorno" | "comparar" | "metodo" | null>(null);
  const [erro, setErro] = useState(""), [localizando, setLocalizando] = useState(false);
  const viva = useRef(true);
  useEffect(() => { viva.current = true; return () => { viva.current = false; }; }, []);
  const leitura = useMemo(() => janela.coordenada && janela.graus !== null ? lerExposicao(janela, dia, minutos) : null, [janela, dia, minutos]);
  const periodo = useMemo(() => janela.coordenada && janela.graus !== null && janela.referencia === "verdadeiro" ? periodoDeSol(dia, janela.coordenada, janela.graus) : "Confira a direção para explorar o Sol", [janela, dia]);
  const aplicarData = (data: string) => { try { instanteNoRecife(data, 720); setDia(data); setTextoData(data.split("-").reverse().join("/")); setDataAberta(false); setErro(""); } catch { setErro("Use uma data válida no formato dia/mês/ano."); } };
  const localizar = async () => {
    if (localizando) return; setLocalizando(true); setErro("");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const p = await Promise.race([obterPosicaoDaVisita(), new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("tempo")), 15000); })]);
      if (!viva.current) return;
      await aoGuardar({ ...janela, coordenada: { longitude: p.longitude, latitude: p.latitude, precisaoM: p.precisaoM, origem: "gps_da_visita" } });
    } catch { setErro("Não conseguimos localizar o imóvel. Você pode confirmar o prédio no dossiê ou tentar na visita."); }
    finally { clearTimeout(timeout); setLocalizando(false); }
  };
  const abrir = (d: typeof detalhe) => { setDetalhe(detalhe === d ? null : d); aoTrocarVisao?.(); };
  if (leitura && (detalhe === "entorno" || detalhe === "comparar")) return <View style={{ gap: 16 }}>
    <Botao rotulo="Voltar ao percurso" variante="texto" onPress={() => abrir(null)} />
    <ControleSolar valor={minutos} minimo={0} maximo={1430} passo={10} rotulo="Horário" texto={horaLegivel(minutos)} aoMudar={setMinutos} />
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <Texto tipo="apoio" cor="cor-texto-apoio">{`${dia.split("-").reverse().join("/")} · Recife`}</Texto>
      <Botao rotulo="Mudar data" variante="texto" onPress={() => { abrir(null); setDataAberta(true); }} />
    </View>
    {detalhe === "entorno" ? <EntornoSolar janela={janela} predio={predio} andarDeclarado={andarDeclarado} dia={dia} minutos={minutos} aoGuardar={aoGuardar} />
      : <ComparacaoDeJanelas atual={janela} analiseAtualId={analiseId} lista={lista} dia={dia} minutos={minutos} />}
  </View>;
  return <View style={{ gap: 18 }}>
    <View style={{ gap: 6 }}>
      <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 11, letterSpacing: 0.7 }}>{janela.nome.toUpperCase()}</Texto>
      <Texto tipo="titulo-tela" role="heading" style={{ fontSize: 30, lineHeight: 36 }}>{janela.graus === null ? "Direção a conferir" : `Voltada para ${nomeDaDirecao(janela.graus)}`}</Texto>
      <Texto tipo="corpo">{periodo}</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio">{origemDaJanela(janela)}</Texto>
    </View>
    {leitura ? <>
      <IlustracaoSolar graus={janela.graus!} leitura={leitura} />
      <Texto tipo="corpo" role="status" style={{ fontWeight: "600" }}>{TEXTO_DO_ESTADO[leitura.estado]}</Texto>
      <ControleSolar valor={minutos} minimo={0} maximo={1430} passo={10} rotulo="Horário" texto={horaLegivel(minutos)} aoMudar={setMinutos} />
      <ReguaDoDia janela={janela} dia={dia} />
    </> : <View style={{ gap: 12 }}>
      <Texto tipo="corpo">A direção está guardada. Para calcular o percurso do Sol, precisamos da localização do imóvel.</Texto>
      <Botao rotulo={localizando ? "Buscando localização…" : "Estou no imóvel · usar localização"} desativado={localizando} onPress={() => void localizar()} />
    </View>}
    {erro ? <Texto role="alert" cor="cor-barro-texto">{erro}</Texto> : null}
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
      <Texto tipo="apoio" cor="cor-texto-apoio">{`${dia === hoje ? "Hoje · " : ""}${dia.split("-").reverse().join("/")} · Recife`}</Texto>
      <Botao rotulo={dataAberta ? "Fechar data" : "Mudar data"} variante="texto" expandido={dataAberta} onPress={() => setDataAberta(!dataAberta)} />
    </View>
    {dataAberta ? <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{[["Hoje", hoje], ["21 de junho", `${dia.slice(0, 4)}-06-21`], ["21 de dezembro", `${dia.slice(0, 4)}-12-21`]].map(([rotulo, data]) => <EscolhaSolar key={rotulo} rotulo={rotulo!} aoEscolher={() => aplicarData(data!)} />)}</View>
      <CampoDeTexto rotulo="Data (dia/mês/ano)" value={textoData} onChangeText={setTextoData} maxLength={10} keyboardType="numbers-and-punctuation" />
      <Botao rotulo="Usar esta data" onPress={() => aplicarData(textoData.split("/").reverse().join("-"))} />
    </View> : null}
    <Texto tipo="apoio" cor="cor-texto-apoio">Percurso solar; nuvens e proteções locais podem mudar o sol na janela.</Texto>
    {janela.referencia !== "verdadeiro" ? <Botao rotulo="Conferir a direção registrada" onPress={aoEditar} /> : null}
    <View style={{ borderTopWidth: 1, borderColor: cor("cor-linha"), paddingTop: 6, gap: 2 }}>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Botao rotulo="Ver entorno" variante="texto" desativado={!leitura || janela.referencia !== "verdadeiro"} onPress={() => abrir("entorno")} />
        <Botao rotulo="Comparar janelas" acessivel="Comparar com outra janela" variante="texto" desativado={!leitura || janela.referencia !== "verdadeiro"} onPress={() => abrir("comparar")} />
      </View>
      <Botao rotulo="Como foi estimado" variante="texto" expandido={detalhe === "metodo"} onPress={() => abrir("metodo")} />
    </View>
    {detalhe === "metodo" ? <View style={{ gap: 12 }}>
      <Texto tipo="secao">Da direção ao percurso do Sol</Texto>
      <Texto tipo="corpo">Usamos a localização do imóvel, a direção registrada, a data e o horário de Recife. O cálculo solar é local, com SunCalc 2.1.1. O desenho mostra a direção do Sol; não mede a luz dentro do cômodo.</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio">{`Direção: ${janela.graus ?? "não informada"}° · referência: ${janela.referencia}. ${janela.observadoEm ? `Registrada em ${janela.observadoEm.slice(0, 10).split("-").reverse().join("/")}.` : "Data do registro anterior desconhecida."}`}</Texto>
      {janela.coordenada ? <Texto tipo="apoio" cor="cor-texto-apoio">{`Localização: ${janela.coordenada.origem === "cadastro" ? "centro cadastral do prédio" : "GPS da visita"}${janela.coordenada.precisaoM !== null ? ` · precisão informada de ${Math.round(janela.coordenada.precisaoM)} m` : " · precisão não informada"}. A localização não identifica a janela na fachada.`}</Texto> : null}
      <Texto tipo="corpo">Sol direto pode aumentar o aquecimento. Observe a proteção da janela e o uso de ar-condicionado nesse horário. Esta ferramenta não prevê temperatura ou conta de energia.</Texto>
      <Texto tipo="apoio" style={{ fontWeight: "600" }}>Proteções que observei nesta janela</Texto>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{([['varanda', 'Varanda'], ['arvore', 'Árvore'], ['brise', 'Brise'], ['predio', 'Prédio']] as const).map(([id, rotulo]) => <EscolhaSolar key={id} rotulo={rotulo} selecionado={janela.protecoes.includes(id)} aoEscolher={() => {
        setErro(""); const tarefa = aoAlternarProtecao ? aoAlternarProtecao(id) : aoGuardar({ ...janela, protecoes: janela.protecoes.includes(id) ? janela.protecoes.filter(p => p !== id) : [...janela.protecoes, id], revisadoEm: new Date().toISOString() });
        void tarefa.catch(() => setErro("Não foi possível guardar a observação. Tente de novo."));
      }} />)}</View>
      <Texto tipo="apoio" cor="cor-texto-apoio">Anotação da visita. Sem dimensões, essas proteções não entram no cálculo de sombras.</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio">No entorno, alturas usam cenários de 2,8 a 3,4 m por pavimento, terreno plano e posição aproximada da abertura. Essa faixa testa hipóteses; não é uma medição de altura. A base é parcial, sem garantia de árvores, varandas ou construções recentes. Os horários de resultado incerto não são tratados como ausência de sombra.</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio">Testamos também variações de direção (5° na indicação manual, 20–35° na bússola conforme a calibração) e 2 m na posição da janela. São cenários de sensibilidade, não uma garantia de precisão. Se mudarem a conclusão, o horário fica indeterminado.</Texto>
    </View> : null}
  </View>;
}
