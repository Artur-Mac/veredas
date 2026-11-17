import { useState } from "react";
import { View } from "react-native";
import { esquemaOcorrencia, ocorrenciasDoImovel, type Caderno, type Ocorrencia } from "../../dados/caderno";
import { formatarReais } from "../../dados/formatos";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, centavosDaEntrada, EscolhaLocal, GrupoLocal } from "./blocos";

const ASSUNTOS = { obra: "Obra", vicio: "Vício construtivo em discussão", estrutura: "Questão estrutural", trabalhista: "Trabalhista", ruido: "Ruído/vizinhança", outro: "Outro" };
const POLOS = { autor: "autor", reu: "réu", outro: "outro papel", desconhecido: "não informado" };
const NATUREZAS = { alegacao: "alegação", documento_tecnico: "documento técnico", decisao: "decisão", observacao: "observação" };
const VALORES = { causa: "da causa", pedido: "do pedido", condenacao: "da condenação informada", acordo: "do acordo", provisao: "da provisão informada", desconhecido: "natureza não informada" };

export function OcorrenciasDoEdificio({ caderno, salvar, levarParaVisita }: { caderno: Caderno; salvar: (fn: (c: Caderno) => Caderno) => Promise<boolean>; levarParaVisita: (id: string, texto: string) => Promise<void> }) {
  const [entidade, setEntidade] = useState("");
  const [assunto, setAssunto] = useState<Ocorrencia["assunto"]>("obra");
  const [identificador, setIdentificador] = useState("");
  const [orgao, setOrgao] = useState("");
  const [polo, setPolo] = useState<Ocorrencia["polo"]>("desconhecido");
  const [natureza, setNatureza] = useState<Ocorrencia["natureza"]>("alegacao");
  const [estagio, setEstagio] = useState("");
  const [referencia, setReferencia] = useState("");
  const [vinculo, setVinculo] = useState<Ocorrencia["vinculo"]>("a_confirmar");
  const [fonte, setFonte] = useState("");
  const [trecho, setTrecho] = useState("");
  const [valor, setValor] = useState("");
  const [tipoValor, setTipoValor] = useState<Ocorrencia["tipoValor"]>("desconhecido");
  const [erro, setErro] = useState("");
  const guardar = async () => {
    try {
      if (!caderno.entidades.some(e => e.id === entidade)) throw new Error();
      const o = esquemaOcorrencia.parse({ id: `ocorrencia-${Date.now().toString(36)}`, entidadeId: entidade, assunto, identificador,
        orgao, polo, natureza, estagio, referenciaEm: referencia.trim() || null, vinculo, fonte, trecho,
        valorCentavos: centavosDaEntrada(valor), tipoValor, registradoEm: new Date().toISOString() });
      if (await salvar(c => ({ ...c, ocorrencias: [...c.ocorrencias, o] }))) { setIdentificador(""); setTrecho(""); setValor(""); setErro(""); }
    } catch { setErro("Escolha a entidade e confira identificador, órgão, estágio, origem, data e valor. Use AAAA-MM-DD ou deixe a data vazia."); }
  };
  const vinculadas = ocorrenciasDoImovel(caderno);
  return <GrupoLocal titulo="Obras, questões construtivas e trabalhistas" apoio="Registros apresentados por você. Nenhuma busca judicial automática ou diagnóstico é realizado.">
    <Texto>{vinculadas.length} casos distintos com vínculo confirmado ao imóvel. Registros a confirmar ficam separados.</Texto>
    {caderno.ocorrencias.map(o => <View key={o.id} style={{ gap: 5, marginVertical: 10 }}>
      <Texto tipo="secao">{ASSUNTOS[o.assunto]} · {o.identificador}</Texto>
      <Texto>{caderno.entidades.find(e => e.id === o.entidadeId)?.nome ?? "Entidade a confirmar"} · polo: {POLOS[o.polo]}</Texto>
      <Texto tipo="apoio">{NATUREZAS[o.natureza]} · {o.estagio} · {o.vinculo === "confirmado" ? "Vínculo informado como confirmado" : "Não confirmado neste imóvel"}</Texto>
      <Texto tipo="apoio">{o.orgao} · referência {o.referenciaEm ?? "não informada"} · {o.fonte}</Texto>
      {o.trecho ? <Texto selectable>{o.trecho}</Texto> : null}
      <Texto tipo="apoio">Valor {VALORES[o.tipoValor]}: {o.valorCentavos === null ? "não informado" : formatarReais(o.valorCentavos / 100)}. Não é rateio ou custo mensal confirmado.</Texto>
      {o.vinculo !== "outro_imovel" ? <Botao rotulo="Levar dúvida sobre este registro à visita" onPress={() => {
        void levarParaVisita(`propria-caso-${o.id.slice(-25)}`, `Qual é o vínculo e o estágio do registro ${o.identificador} sobre ${ASSUNTOS[o.assunto].toLowerCase()}? Há providências ou rateios aprovados?`.slice(0, 240));
      }} /> : null}
    </View>)}
    <Texto tipo="apoio">Ação, alegação, laudo e decisão têm significados diferentes. O condomínio pode ser autor buscando reparos. Não há soma de valores nem nota de risco.</Texto>
    {caderno.entidades.length ? <>
      <EscolhaLocal rotulo="Entidade do registro" valor={entidade} opcoes={caderno.entidades.map(e => ({ valor: e.id, rotulo: `${e.nome} (${e.papel})` }))} aoEscolher={setEntidade} />
      <EscolhaLocal rotulo="Assunto do registro" valor={assunto} opcoes={[{ valor: "obra", rotulo: "Obra" }, { valor: "vicio", rotulo: "Vício discutido" }, { valor: "estrutura", rotulo: "Questão estrutural" }, { valor: "trabalhista", rotulo: "Trabalhista" }, { valor: "ruido", rotulo: "Ruído" }, { valor: "outro", rotulo: "Outro" }]} aoEscolher={setAssunto} />
      <CampoLocal rotulo="Número do processo ou identificador do documento" value={identificador} onChangeText={setIdentificador} maxLength={120} />
      <CampoLocal rotulo="Tribunal ou órgão de origem" value={orgao} onChangeText={setOrgao} maxLength={120} />
      <EscolhaLocal rotulo="Polo da entidade" valor={polo} opcoes={[{ valor: "autor", rotulo: "Autor" }, { valor: "reu", rotulo: "Réu" }, { valor: "outro", rotulo: "Outro" }, { valor: "desconhecido", rotulo: "Não sei" }]} aoEscolher={setPolo} />
      <EscolhaLocal rotulo="Natureza da evidência" valor={natureza} opcoes={[{ valor: "alegacao", rotulo: "Alegação" }, { valor: "documento_tecnico", rotulo: "Documento técnico" }, { valor: "decisao", rotulo: "Decisão" }, { valor: "observacao", rotulo: "Observação" }]} aoEscolher={setNatureza} />
      <CampoLocal rotulo="Estágio informado na fonte" value={estagio} onChangeText={setEstagio} maxLength={240} />
      <CampoLocal rotulo="Data de referência (AAAA-MM-DD, se conhecida)" value={referencia} onChangeText={setReferencia} maxLength={10} />
      <EscolhaLocal rotulo="Vínculo ao imóvel" valor={vinculo} opcoes={[{ valor: "a_confirmar", rotulo: "A confirmar" }, { valor: "confirmado", rotulo: "Conferi o vínculo" }, { valor: "outro_imovel", rotulo: "Outro imóvel" }]} aoEscolher={setVinculo} />
      <CampoLocal rotulo="Fonte, documento e página" value={fonte} onChangeText={setFonte} maxLength={500} />
      <CampoLocal rotulo="Trecho que sustenta o registro" value={trecho} onChangeText={setTrecho} multiline maxLength={3000} />
      <CampoLocal rotulo="Valor em R$ (se informado)" value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
      <EscolhaLocal rotulo="Natureza do valor" valor={tipoValor} opcoes={[{ valor: "desconhecido", rotulo: "Não sei" }, { valor: "causa", rotulo: "Valor da causa" }, { valor: "pedido", rotulo: "Pedido" }, { valor: "condenacao", rotulo: "Condenação informada" }, { valor: "acordo", rotulo: "Acordo" }, { valor: "provisao", rotulo: "Provisão informada" }]} aoEscolher={setTipoValor} />
      <Botao rotulo="Guardar ocorrência apresentada" onPress={() => void guardar()} />
    </> : <Texto>Registre primeiro a identidade jurídica na seção CNPJ.</Texto>}
    {erro ? <Texto role="alert">{erro}</Texto> : null}
  </GrupoLocal>;
}
