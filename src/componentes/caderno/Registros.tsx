import { useState } from "react";
import { View } from "react-native";
import type { AnaliseV2 } from "../../dados/contratos";
import { cadernoVazio, esquemaObservacao, type Caderno } from "../../dados/caderno";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, EscolhaLocal, GrupoLocal } from "./blocos";
import { FotosPessoais } from "./Fotos";
import { HistoricoPessoal } from "./Historico";
import { InfraestruturaEExperiencia } from "./Complementos";
import { LembretesPessoais } from "./Lembretes";
import { RotinaPessoal } from "./Rotina";
import { edificioPorId } from "../../dados/recife/indice";
import { eCoberto } from "../../dados/recife/bairros";
import { ResumoSelecionavel } from "./Resumo";
import { obterPosicaoDaVisita } from "../../plataforma/posicaoDaVisita";

type Props = { analise: AnaliseV2; salvar: (mudar: (c: Caderno) => Caderno) => Promise<boolean>; novaVisita: () => Promise<void> };
export function RegistrosPessoais({ analise, salvar, novaVisita }: Props) {
  const c = analise.caderno ?? cadernoVazio();
  let centro: [number, number] | null = null;
  try {
    if (analise.vinculo.estado === "confirmado" && eCoberto(analise.bairro)) centro = edificioPorId(analise.vinculo.edificioId, analise.bairro)?.centro ?? null;
  } catch { /* A consulta opcional não impede guardar observações pessoais. */ }
  const [comodo, setComodo] = useState("");
  const [assunto, setAssunto] = useState<Caderno["observacoes"][number]["assunto"]>("som");
  const [texto, setTexto] = useState("");
  const [diario, setDiario] = useState("");
  const [erro, setErro] = useState("");
  const [posicionando, setPosicionando] = useState(false);
  const registrarPosicao = async () => {
    if (posicionando) return;
    setPosicionando(true);
    try {
      const localizacaoDaVisita = await obterPosicaoDaVisita();
      await salvar(a => ({ ...a, localizacaoDaVisita })); setErro("");
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível obter sua posição. Continue manualmente."); }
    finally { setPosicionando(false); }
  };
  const guardar = async () => {
    try {
      const o = esquemaObservacao.parse({ id: `observacao-${Date.now().toString(36)}`, em: new Date().toISOString(), comodo, assunto, texto, origem: "voce" });
      if (await salvar(a => ({ ...a, observacoes: [...a.observacoes, o] }))) { setTexto(""); setErro(""); }
    } catch { setErro("Informe cômodo/local e observação, com até 2.000 caracteres."); }
  };
  return <View style={{ gap: 12 }}>
    <Texto tipo="titulo-tela">Seu registro de campo.</Texto>
    <Texto>Observações suas, por local e horário. São registros pessoais; não substituem medição ou laudo.</Texto>
    <FotosPessoais caderno={c} salvar={salvar} />
    <ResumoSelecionavel analise={analise} />
    <HistoricoPessoal caderno={c} salvar={salvar} />
    <InfraestruturaEExperiencia caderno={c} salvar={salvar} />
    <LembretesPessoais caderno={c} salvar={salvar} />
    <RotinaPessoal caderno={c} centro={centro} salvar={salvar} />
    <GrupoLocal titulo="Referência de localização da visita" apoio="Use durante a visita. GPS não confirma prédio, unidade ou andar. A posição fica privada neste aparelho.">
      {c.localizacaoDaVisita ? <Texto tipo="apoio">Posição registrada em {new Date(c.localizacaoDaVisita.em).toLocaleString("pt-BR")}. Precisão horizontal informada: {c.localizacaoDaVisita.precisaoM === null ? "não disponível" : `aproximadamente ${Math.round(c.localizacaoDaVisita.precisaoM)} m`}.</Texto> : null}
      <Botao rotulo="Registrar posição atual da visita" desativado={posicionando} onPress={() => void registrarPosicao()} />
    </GrupoLocal>
    <GrupoLocal titulo="Registrar uma observação" aberto>
      <CampoLocal rotulo="Cômodo ou local" value={comodo} onChangeText={setComodo} maxLength={100} />
      <EscolhaLocal rotulo="Assunto da observação" valor={assunto} opcoes={[{ valor: "som", rotulo: "Som" }, { valor: "sol", rotulo: "Sol" },
        { valor: "conectividade", rotulo: "Conectividade" }, { valor: "agua", rotulo: "Água" }, { valor: "acesso", rotulo: "Acesso" }, { valor: "outro", rotulo: "Outro" }]} aoEscolher={setAssunto} />
      {assunto === "conectividade" ? <Texto tipo="apoio">Anote operadora, indicador 4G/5G visto no aparelho e se foi possível chamar/navegar. Wi-Fi 5 GHz é diferente de rede móvel 5G. Sem roteador ligado não há Wi-Fi do imóvel a medir; sem conexão não há teste de velocidade.</Texto> : null}
      {assunto === "som" ? <Texto tipo="apoio">Anote fonte percebida, duração, janela aberta/fechada e horário. Este registro não mede decibéis.</Texto> : null}
      {assunto === "sol" ? <Texto tipo="apoio">Anote horário, direção informada e incidência observada. Uma visita não determina insolação anual ou temperatura interna.</Texto> : null}
      <CampoLocal rotulo="O que você observou" value={texto} onChangeText={setTexto} multiline maxLength={2000} />
      <Botao rotulo="Guardar observação" variante="principal" onPress={() => void guardar()} />
    </GrupoLocal>
    {c.observacoes.slice().reverse().map(o => <View key={o.id} style={{ gap: 5, marginVertical: 8 }}>
      <Texto tipo="secao">{o.comodo} · {o.assunto}</Texto><Texto tipo="apoio">Você registrou em {new Date(o.em).toLocaleString("pt-BR")}</Texto><Texto>{o.texto}</Texto>
    </View>)}
    <GrupoLocal titulo={`Visitas anteriores (${c.visitas.length})`} apoio="Iniciar uma nova visita preserva o resumo anterior no histórico.">
      <Botao rotulo="Guardar visita atual e preparar outra" onPress={() => void novaVisita()} />
      {c.visitas.length === 0 ? <Texto>Nenhuma sessão anterior arquivada.</Texto> : null}
      {c.visitas.slice().reverse().map(v => <View key={v.id} style={{ gap: 6, marginVertical: 8 }}>
        <Texto tipo="secao">{v.concluidaEm ? `Concluída em ${new Date(v.concluidaEm).toLocaleString("pt-BR")}` : "Data da visita não informada"}</Texto>
        {v.notas ? <Texto>{v.notas}</Texto> : null}
        {Object.entries(v.respostas).map(([id, resposta]) => <Texto key={id} tipo="apoio">{v.rotulosDasPerguntas?.[id] ?? v.perguntasProprias.find(p => p.id === id)?.texto ?? "Resposta registrada anteriormente"}: {resposta}</Texto>)}
      </View>)}
    </GrupoLocal>
    <GrupoLocal titulo="Decisão e diário pessoal" apoio="Sua decisão não altera os fatos do imóvel nem é compartilhada automaticamente.">
      <EscolhaLocal rotulo="Situação da busca" valor={c.decisao} opcoes={[{ valor: "considerando", rotulo: "Considerando" }, { valor: "visita_planejada", rotulo: "Visita planejada" }, { valor: "visitado", rotulo: "Visitado" }, { valor: "escolhido", rotulo: "Escolhido" }]}
        aoEscolher={v => { void salvar(a => ({ ...a, decisao: v })); }} />
      <CampoLocal rotulo="Expectativa ou experiência após a mudança" value={diario} onChangeText={setDiario} multiline maxLength={2000} />
      <Botao rotulo="Guardar no diário" desativado={!diario.trim()} onPress={() => {
        const entrada = { id: `diario-${Date.now().toString(36)}`, em: new Date().toISOString(), texto: diario.trim() };
        void salvar(a => ({ ...a, diario: [...a.diario, entrada] })).then(ok => { if (ok) setDiario(""); });
      }} />
      {c.diario.slice().reverse().map(d => <View key={d.id}><Texto tipo="apoio">{new Date(d.em).toLocaleString("pt-BR")}</Texto><Texto>{d.texto}</Texto></View>)}
    </GrupoLocal>
    {erro ? <Texto role="alert">{erro}</Texto> : null}
  </View>;
}
