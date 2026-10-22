import { useState } from "react";
import { formatarData } from "../../dados/formatos";
import { Linking, View } from "react-native";
import type { AnaliseV2 } from "../../dados/contratos";
import { cadernoVazio, esquemaDocumentoPessoal, esquemaEntidadeJuridica, normalizarCnpj, ultimaInspecao,
  type Caderno, type DocumentoPessoal } from "../../dados/caderno";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, EscolhaLocal, GrupoLocal } from "./blocos";
import { OcorrenciasDoEdificio } from "./Ocorrencias";
import { abrirDocumento, selecionarDocumento, type ArquivoDoDocumento } from "../../plataforma/documento";

const TIPOS: { valor: DocumentoPessoal["tipo"]; rotulo: string }[] = [
  { valor: "laudo", rotulo: "Laudo" }, { valor: "art_rrt", rotulo: "ART/RRT" }, { valor: "ata", rotulo: "Ata" },
  { valor: "balancete", rotulo: "Balancete" }, { valor: "convencao", rotulo: "Convenção" }, { valor: "cndt", rotulo: "CNDT" },
  { valor: "acoes_trt6", rotulo: "Ações TRT6" }, { valor: "licenca", rotulo: "Licença" }, { valor: "matricula", rotulo: "Matrícula" }, { valor: "outro", rotulo: "Outro" },
];
type Props = { analise: AnaliseV2; salvar: (mudar: (c: Caderno) => Caderno) => Promise<boolean>; levarParaVisita: (id: string, texto: string) => Promise<void> };
export function DocumentosDoEdificio({ analise, salvar, levarParaVisita }: Props) {
  const c = analise.caderno ?? cadernoVazio();
  const ultimo = ultimaInspecao(c.documentos);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<DocumentoPessoal["tipo"]>("laudo");
  const [origem, setOrigem] = useState("");
  const [inspecao, setInspecao] = useState("");
  const [emissao, setEmissao] = useState("");
  const [escopo, setEscopo] = useState("");
  const [trecho, setTrecho] = useState("");
  const [pagina, setPagina] = useState("");
  const [vinculo, setVinculo] = useState<DocumentoPessoal["vinculo"]>("a_confirmar");
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [papel, setPapel] = useState<Caderno["entidades"][number]["papel"]>("condominio");
  const [evidencia, setEvidencia] = useState("");
  const [confirmado, setConfirmado] = useState("nao");
  const [arquivo, setArquivo] = useState<ArquivoDoDocumento | null>(null);
  const [anexando, setAnexando] = useState(false);
  const abrirConsulta = (url: string) => { void Linking.openURL(url).catch(() => setErro("Não foi possível abrir a fonte. O registro local foi preservado.")); };
  const guardarDocumento = async () => {
    try {
      const d = esquemaDocumentoPessoal.parse({ id: `documento-${Date.now().toString(36)}`, titulo, tipo, origem,
        inspecaoEm: inspecao.trim() || null, emitidoEm: emissao.trim() || null, recebidoEm: new Date().toISOString(),
        escopo, trecho, pagina: pagina.trim() ? Number(pagina) : null, vinculo, ...(arquivo ? { arquivo } : {}) });
      if (await salvar(a => ({ ...a, documentos: [...a.documentos, d] }))) { setTitulo(""); setTrecho(""); setArquivo(null); setErro(""); }
    } catch { setErro("Confira título, origem, datas no formato AAAA-MM-DD e página. Deixe a data vazia quando desconhecida."); }
  };
  const guardarEntidade = async () => {
    try {
      const e = esquemaEntidadeJuridica.parse({ id: `entidade-${Date.now().toString(36)}`, cnpj: normalizarCnpj(cnpj), nome, papel,
        endereco: [analise.logradouro, analise.numero, analise.bairroTexto].filter(Boolean).join(", "), evidencia, confirmado: confirmado === "sim" });
      if (await salvar(a => {
        const anterior = a.entidades.find(x => x.cnpj === e.cnpj && x.papel === e.papel);
        const entidade = { ...e, id: anterior?.id ?? e.id };
        return { ...a, entidades: [...a.entidades.filter(x => x.id !== entidade.id), entidade] };
      })) { setNome(""); setCnpj(""); setErro(""); }
    } catch { setErro("Confira o identificador, nome e evidência do vínculo. A formatação do CNPJ não comprova identidade ou situação cadastral."); }
  };
  return <View style={{ gap: 12 }}>
    <Texto tipo="titulo-tela">Documentos e edifício.</Texto>
    <Texto>{ultimo ? `Última inspeção apresentada: ${formatarData(ultimo.inspecaoEm)} · ${ultimo.titulo}` : "Nenhum laudo com data de inspeção e vínculo confirmado foi apresentado."}</Texto>
    <Texto tipo="apoio">Data de emissão e ART/RRT não substituem a data/escopo da inspeção. Documentos apresentados não certificam a condição atual do prédio.</Texto>
    {c.documentos.map(d => <View key={d.id} style={{ gap: 4, marginVertical: 10 }}>
      <Texto tipo="secao">{d.titulo}</Texto>
      <Texto tipo="apoio">{TIPOS.find(t => t.valor === d.tipo)?.rotulo} · {d.vinculo === "confirmado" ? "Vínculo confirmado por você" : "Vínculo a revisar"}</Texto>
      <Texto>Inspeção: {d.inspecaoEm ? formatarData(d.inspecaoEm) : "não informada"} · Emissão: {d.emitidoEm ? formatarData(d.emitidoEm) : "não informada"}</Texto>
      <Texto tipo="apoio">Origem: {d.origem}{d.pagina ? ` · página ${d.pagina}` : ""}</Texto>
      {d.escopo ? <Texto>Escopo informado: {d.escopo}</Texto> : null}
      {d.trecho ? <Texto selectable>{d.trecho}</Texto> : null}
      {d.arquivo ? <Botao rotulo="Abrir PDF apresentado" onPress={() => {
        void abrirDocumento(d.arquivo!.chave).catch(e => setErro(e instanceof Error ? e.message : "Não foi possível abrir o PDF."));
      }} /> : null}
      {d.tipo === "cndt" ? <Texto tipo="apoio">CNDT trata de débitos no alcance do BNDT; não inventaria todas as ações.</Texto> : null}
      {d.tipo === "acoes_trt6" ? <Texto tipo="apoio">Certidão de ações tem alcance e data próprios; ação em andamento não é condenação.</Texto> : null}
      {d.vinculo !== "outro_imovel" ? <Botao rotulo="Levar dúvida sobre este documento à visita" onPress={() => {
        void levarParaVisita(`propria-doc-${d.id.slice(-25)}`, `Pode esclarecer a data, o escopo e as pendências do documento ${d.titulo}?`.slice(0, 240));
      }} /> : null}
    </View>)}
    <GrupoLocal titulo="Registrar documento apresentado" apoio="Registre metadados e trechos. Você pode escolher um PDF privado de até 20 MB. Não há consulta externa ou leitura automática.">
      <Botao rotulo={arquivo ? "Trocar PDF escolhido" : "Escolher PDF deste aparelho"} desativado={anexando} onPress={() => {
        setAnexando(true); void selecionarDocumento().then(v => { if (v) setArquivo(v); })
          .catch(e => setErro(e instanceof Error ? e.message : "Não foi possível guardar o PDF."))
          .finally(() => setAnexando(false));
      }} />
      {arquivo ? <Texto tipo="apoio">PDF guardado neste aparelho. Confirme os dados abaixo para vinculá-lo ao registro.</Texto> : null}
      <CampoLocal rotulo="Título do documento" value={titulo} onChangeText={setTitulo} maxLength={160} />
      <EscolhaLocal rotulo="Tipo de documento" valor={tipo} opcoes={TIPOS} aoEscolher={setTipo} />
      {tipo === "cndt" ? <Botao rotulo="Abrir consulta de CNDT no TST" onPress={() => abrirConsulta("https://www.tst.jus.br/certidao1")} /> : null}
      {tipo === "acoes_trt6" ? <Botao rotulo="Abrir certidões de ações no TRT6" onPress={() => abrirConsulta("https://pje.trt6.jus.br/certidoes/inicio")} /> : null}
      {tipo === "licenca" ? <Botao rotulo="Abrir consultas de licenciamento do Recife" onPress={() => abrirConsulta("https://licenciamentounificado.recife.pe.gov.br/consultas-processos-de-licenciamento-fiscalizacao")} /> : null}
      {["cndt", "acoes_trt6", "licenca"].includes(tipo) ? <Texto tipo="apoio">A fonte abre no navegador. Nenhum CNPJ é enviado automaticamente pelo VEREDA. Se obtiver um documento, volte para anexar e registrar sua data e alcance.</Texto> : null}
      <CampoLocal rotulo="Origem ou responsável que apresentou" value={origem} onChangeText={setOrigem} maxLength={240} />
      <CampoLocal rotulo="Data da inspeção (AAAA-MM-DD, se conhecida)" value={inspecao} onChangeText={setInspecao} maxLength={10} />
      <CampoLocal rotulo="Data de emissão (AAAA-MM-DD, se conhecida)" value={emissao} onChangeText={setEmissao} maxLength={10} />
      <CampoLocal rotulo="Escopo do documento" value={escopo} onChangeText={setEscopo} multiline maxLength={2000} />
      <CampoLocal rotulo="Trecho relevante" value={trecho} onChangeText={setTrecho} multiline maxLength={6000} />
      <CampoLocal rotulo="Página do trecho" value={pagina} onChangeText={setPagina} keyboardType="number-pad" />
      <EscolhaLocal rotulo="Vínculo do documento ao imóvel" valor={vinculo} opcoes={[{ valor: "a_confirmar", rotulo: "A confirmar" }, { valor: "confirmado", rotulo: "Conferi o imóvel" }, { valor: "outro_imovel", rotulo: "Outro imóvel" }]} aoEscolher={setVinculo} />
      <Botao rotulo="Guardar registro do documento" variante="principal" onPress={() => void guardarDocumento()} />
    </GrupoLocal>
    <GrupoLocal titulo="Identidade jurídica e CNPJ" apoio="Condomínio, construtora, SPE e administradora são entidades diferentes. Nenhuma consulta externa acontece ao guardar.">
      {c.entidades.map(e => <View key={e.id}><Texto>{e.nome} · {e.papel}</Texto><Texto tipo="apoio">{e.cnpj} · {e.confirmado ? "Vínculo confirmado por você" : "A confirmar"}</Texto><Texto tipo="apoio">{e.evidencia}</Texto></View>)}
      <CampoLocal rotulo="Nome da entidade" value={nome} onChangeText={setNome} maxLength={160} />
      <CampoLocal rotulo="CNPJ informado" value={cnpj} onChangeText={setCnpj} autoCapitalize="characters" maxLength={20} />
      <EscolhaLocal rotulo="Papel da entidade" valor={papel} opcoes={[{ valor: "condominio", rotulo: "Condomínio" }, { valor: "construtora", rotulo: "Construtora" }, { valor: "incorporadora", rotulo: "Incorporadora/SPE" }, { valor: "administradora", rotulo: "Administradora" }, { valor: "vizinho", rotulo: "Atividade vizinha" }]} aoEscolher={setPapel} />
      <CampoLocal rotulo="Evidência do vínculo (documento/endereço)" value={evidencia} onChangeText={setEvidencia} multiline maxLength={1000} />
      <EscolhaLocal rotulo="Você conferiu esse vínculo?" valor={confirmado} opcoes={[{ valor: "nao", rotulo: "Ainda não" }, { valor: "sim", rotulo: "Sim" }]} aoEscolher={setConfirmado} />
      <Botao rotulo="Guardar entidade" onPress={() => void guardarEntidade()} />
    </GrupoLocal>
    <OcorrenciasDoEdificio caderno={c} salvar={salvar} levarParaVisita={levarParaVisita} />
    {erro ? <Texto role="alert">{erro}</Texto> : null}
  </View>;
}
