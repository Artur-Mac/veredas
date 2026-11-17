import { useState } from "react";
import { View } from "react-native";
import { cadernoVazio, esquemaCaderno, type Caderno } from "../../dados/caderno";
import type { AnaliseV2 } from "../../dados/contratos";
import { custoDaRotina, saldoDoBalancete } from "../../dados/complementos";
import { formatarData, formatarCentavos } from "../../dados/formatos";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, centavosDaEntrada, EscolhaLocal, GrupoLocal } from "./blocos";
import { proporBalancete, type PropostaDoBalancete } from "../../dados/propostasBalancete";
import { CronologiaDaAnalise } from "./Cronologia";
type Salvar = (mudar: (c: Caderno) => Caderno) => Promise<boolean>;
const reais = (v: number | null) => v === null ? "Não informado" : formatarCentavos(v);
const novoId = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}`;

export function PerfilDomestico({ caderno, salvar }: { caderno: Caderno; salvar: Salvar }) {
  const p = caderno.perfilDomestico;
  const [pessoas, setPessoas] = useState(p?.ocupantes?.toString() ?? "");
  const [limite, setLimite] = useState(p?.orcamentoCentavos === null || !p ? "" : (p.orcamentoCentavos / 100).toFixed(2).replace(".", ","));
  const [assunto, setAssunto] = useState<"agua" | "energia" | "transporte" | "outro">("energia");
  const [quantidade, setQuantidade] = useState(""); const [tarifa, setTarifa] = useState("");
  const [fonte, setFonte] = useState(""); const [data, setData] = useState(""); const [erro, setErro] = useState("");
  const guardar = async (item: boolean) => {
    try {
      const consumo = item ? { id: novoId("consumo"), assunto, unidade: assunto === "energia" ? "kwh" as const : assunto === "agua" ? "m3" as const : assunto === "transporte" ? "viagem" as const : "mes" as const,
        quantidade: quantidade.trim() ? Number(quantidade.replace(",", ".")) : null, tarifaCentavos: centavosDaEntrada(tarifa), fonte, referenciaEm: data.trim() || null } : null;
      const perfil = esquemaCaderno.shape.perfilDomestico.unwrap().parse({ ocupantes: pessoas.trim() ? Number(pessoas) : null, orcamentoCentavos: centavosDaEntrada(limite), consumos: consumo ? [consumo] : [] });
      custoDaRotina({ ...perfil, consumos: [...caderno.perfilDomestico?.consumos ?? [], ...perfil.consumos] });
      if (await salvar(c => ({ ...c, perfilDomestico: { ...perfil, consumos: [...c.perfilDomestico?.consumos ?? [], ...perfil.consumos] } }))) { setErro(""); if (item) { setFonte(""); setTarifa(""); setQuantidade(""); } }
    } catch { setErro("Confira ocupantes (1 a 30), valores, quantidade e fonte da tarifa. Data: AAAA-MM-DD ou vazio. Não inferimos tarifas atuais."); }
  };
  let custo = null;
  try { custo = p ? custoDaRotina(p) : null; } catch { /* As hipóteses continuam visíveis para correção ou retirada. */ }
  return <GrupoLocal titulo="Perfil da casa e consumo mensal" apoio="Cenário privado. Tarifas e consumos são hipóteses informadas por você; não alteram o mensal do anúncio nem os extras dos cenários de permanência.">
    <CampoLocal rotulo="Pessoas na casa (opcional)" value={pessoas} onChangeText={setPessoas} keyboardType="number-pad" />
    <CampoLocal rotulo="Orçamento mensal disponível em R$ (opcional)" value={limite} onChangeText={setLimite} keyboardType="decimal-pad" />
    <Botao rotulo="Guardar perfil da casa" onPress={() => void guardar(false)} />
    <EscolhaLocal rotulo="Consumo estimado" valor={assunto} opcoes={[{ valor: "energia", rotulo: "Energia · kWh" }, { valor: "agua", rotulo: "Água · m³" }, { valor: "transporte", rotulo: "Transporte · viagens" }, { valor: "outro", rotulo: "Outro · mensal" }]} aoEscolher={setAssunto} />
    <CampoLocal rotulo="Quantidade mensal estimada" value={quantidade} onChangeText={setQuantidade} keyboardType="decimal-pad" />
    <CampoLocal rotulo="Tarifa por unidade em R$" value={tarifa} onChangeText={setTarifa} keyboardType="decimal-pad" />
    <CampoLocal rotulo="Fonte ou hipótese da tarifa" value={fonte} onChangeText={setFonte} maxLength={300} />
    <CampoLocal rotulo="Data da tarifa (AAAA-MM-DD, se conhecida)" value={data} onChangeText={setData} maxLength={10} />
    <Botao rotulo="Guardar consumo estimado" onPress={() => void guardar(true)} />
    {custo ? <><Texto>Rotina — subtotal estimado conhecido: {reais(custo.conhecidoCentavos)} · {custo.pendentes} itens pendentes.</Texto><Texto>Orçamento informado: {reais(p!.orcamentoCentavos)}.</Texto></> : null}
    {p && !custo ? <Texto role="alert">A estimativa excede o limite monetário. Retire a hipótese excedente; nenhum total foi presumido.</Texto> : null}
    {p?.consumos.map(v => <View key={v.id} style={{ gap: 4 }}><Texto>{v.assunto} · {v.quantidade ?? "quantidade desconhecida"} {v.unidade} × {reais(v.tarifaCentavos)}</Texto><Texto tipo="apoio">{v.fonte} · {v.referenciaEm ? formatarData(v.referenciaEm) : "data não informada"}. Não inclui taxas fixas ou tributos não informados.</Texto>
      <Botao rotulo="Retirar esta hipótese" acessivel={`Retirar hipótese ${v.id}`} onPress={() => void salvar(c => ({ ...c, perfilDomestico: c.perfilDomestico ? { ...c.perfilDomestico, consumos: c.perfilDomestico.consumos.filter(x => x.id !== v.id) } : undefined }))} /></View>)}
    {erro ? <Texto role="alert">{erro}</Texto> : null}
  </GrupoLocal>;
}

export function ComplementosDoEdificio({ analise, salvar }: { analise: AnaliseV2; salvar: Salvar }) {
  const c = analise.caderno ?? cadernoVazio();
  const [periodo, setPeriodo] = useState(""); const [receitas, setReceitas] = useState(""); const [despesas, setDespesas] = useState("");
  const [reserva, setReserva] = useState(""); const [inadimplencia, setInadimplencia] = useState(""); const [fonte, setFonte] = useState(""); const [erro, setErro] = useState("");
  const [propostas, setPropostas] = useState<PropostaDoBalancete[]>([]);
  const [documentoId, setDocumentoId] = useState<string | null>(null);
  const [pagina, setPagina] = useState<number | null>(null);
  const prefazer = (doc: Caderno["documentos"][number]) => {
    const p = proporBalancete(doc);
    const entrada = (campo: PropostaDoBalancete["campo"]) => { const v = p.propostas.find(p => p.campo === campo); return v ? (v.centavos / 100).toFixed(2).replace(".", ",") : ""; };
    setReceitas(entrada("receitasCentavos")); setDespesas(entrada("despesasCentavos")); setReserva(entrada("reservaCentavos")); setInadimplencia(entrada("inadimplenciaCentavos"));
    setPropostas(p.propostas); setDocumentoId(doc.id); setPagina(doc.pagina); setFonte(`${doc.titulo} · ${doc.origem}`.slice(0, 300));
    setErro(p.ambiguos.length ? "Há valores conflitantes para a mesma rubrica. Eles ficaram vazios: confira o documento e preencha manualmente." : p.propostas.length ? "Prévia preenchida. Confira rubricas, página e competência antes de guardar." : "Nenhuma rubrica reconhecida com segurança. Preencha manualmente; não interpretamos tabelas ou conclusões.");
  };
  const guardar = async () => {
    try {
      const valores = { receitasCentavos: centavosDaEntrada(receitas), despesasCentavos: centavosDaEntrada(despesas), reservaCentavos: centavosDaEntrada(reserva), inadimplenciaCentavos: centavosDaEntrada(inadimplencia) };
      const b = esquemaCaderno.shape.balancetes.unwrap().element.parse({ id: novoId("balancete"), documentoId, periodo, ...valores, fonte, pagina,
        evidencias: propostas.filter(p => valores[p.campo] === p.centavos), registradoEm: new Date().toISOString() });
      if (await salvar(c => ({ ...c, balancetes: [...c.balancetes ?? [], b] }))) { setErro(""); setPeriodo(""); setPropostas([]); setDocumentoId(null); setPagina(null); }
    } catch { setErro("Informe competência AAAA-MM, fonte/documento/página e valores; deixe vazio o que não foi apresentado."); }
  };
  return <>
    <GrupoLocal titulo="Linha do tempo do imóvel" apoio="Eventos de fontes distintas. Uma sequência de datas não demonstra relação causal nem certifica a condição atual.">
      <CronologiaDaAnalise analise={analise} />
    </GrupoLocal>
    <GrupoLocal titulo="Balancetes e finanças apresentados" apoio="Totais do condomínio, separados dos custos da sua unidade. Não fazemos rateio automático ou diagnóstico financeiro.">
      {c.documentos.filter(d => d.tipo === "balancete" && d.vinculo !== "outro_imovel" && d.trecho.trim()).map(d => <View key={d.id} style={{ gap: 5 }}>
        <Botao rotulo={`Revisar rubricas de ${d.titulo}`} onPress={() => prefazer(d)} />
      </View>)}
      {propostas.map(p => <Texto key={p.campo} tipo="apoio">Prévia: “{p.trecho}” · {p.pagina === null ? "página não informada" : `página ${p.pagina}`}. Confirme o valor abaixo; texto revisado não certifica o documento.</Texto>)}
      <CampoLocal rotulo="Competência do balancete (AAAA-MM)" value={periodo} onChangeText={setPeriodo} maxLength={7} />
      <CampoLocal rotulo="Receitas do condomínio em R$" value={receitas} onChangeText={setReceitas} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Despesas do condomínio em R$" value={despesas} onChangeText={setDespesas} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Reserva informada em R$" value={reserva} onChangeText={setReserva} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Inadimplência informada em R$" value={inadimplencia} onChangeText={setInadimplencia} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Fonte do balancete, documento e página" value={fonte} onChangeText={setFonte} maxLength={300} />
      <Botao rotulo="Guardar balancete apresentado" onPress={() => void guardar()} />
      {c.balancetes?.map(b => <View key={b.id} style={{ gap: 4, marginVertical: 8 }}><Texto tipo="secao">Competência {formatarData(b.periodo)}</Texto><Texto>Saldo de receitas menos despesas: {reais(saldoDoBalancete(b))}</Texto><Texto>Reserva: {reais(b.reservaCentavos)} · Inadimplência: {reais(b.inadimplenciaCentavos)}</Texto><Texto tipo="apoio">{b.fonte}. Ausência de documento não significa ausência de débito.</Texto>
        {b.evidencias?.map(p => <Texto tipo="apoio" key={p.campo}>Trecho preservado: “{p.trecho}” · {p.pagina === null ? "página não informada" : `página ${p.pagina}`}</Texto>)}
      </View>)}
      {erro ? <Texto role="alert">{erro}</Texto> : null}
    </GrupoLocal>
  </>;
}

export function InfraestruturaEExperiencia({ caderno: c, salvar }: { caderno: Caderno; salvar: Salvar }) {
  const [assunto, setAssunto] = useState<"cisterna" | "reservatorio" | "bomba" | "rodizio">("cisterna"); const [estado, setEstado] = useState<"sim" | "nao" | "nao_sabemos">("nao_sabemos");
  const [relato, setRelato] = useState(""); const [fonte, setFonte] = useState(""); const [data, setData] = useState("");
  const [tema, setTema] = useState(""); const [esperado, setEsperado] = useState(""); const [id, setId] = useState<string | null>(null); const [experiencia, setExperiencia] = useState(""); const [em, setEm] = useState(""); const [erro, setErro] = useState("");
  const infraestrutura = async () => {
    try {
      const v = esquemaCaderno.shape.infraestrutura.unwrap().element.parse({ id: novoId("infra"), assunto, estado, relato, fonte, observadoEm: data.trim() || null, registradoEm: new Date().toISOString() });
      if (await salvar(c => ({ ...c, infraestrutura: [...c.infraestrutura ?? [], v] }))) { setRelato(""); setErro(""); }
    } catch { setErro("Confira a fonte e data da observação (AAAA-MM-DD ou vazio)."); }
  };
  const expectativa = async () => {
    try {
      const v = esquemaCaderno.shape.expectativas.unwrap().element.parse({ id: novoId("expectativa"), assunto: tema, esperado, em: new Date().toISOString(), experiencias: [] });
      if (await salvar(c => ({ ...c, expectativas: [...c.expectativas ?? [], v] }))) { setEsperado(""); setErro(""); }
    } catch { setErro("Informe assunto e expectativa; o registro ficará privado e datado."); }
  };
  const observar = async () => {
    try {
      const v = esquemaCaderno.shape.expectativas.unwrap().element.shape.experiencias.element.parse({ em: new Date().toISOString(), observadoEm: em, texto: experiencia });
      if (await salvar(c => ({ ...c, expectativas: c.expectativas?.map(e => e.id === id ? { ...e, experiencias: [...e.experiencias, v] } : e) }))) { setId(null); setExperiencia(""); setErro(""); }
    } catch { setErro("Informe data observada AAAA-MM-DD e experiência. A expectativa anterior será preservada."); }
  };
  return <>
    <GrupoLocal titulo="Água e infraestrutura do prédio" apoio="O que foi observado ou respondido pelo condomínio. Sem acesso a contas de moradores, sem inferir abastecimento por bairro.">
      <EscolhaLocal rotulo="Item de infraestrutura" valor={assunto} opcoes={[{ valor: "cisterna", rotulo: "Cisterna" }, { valor: "reservatorio", rotulo: "Reservatório" }, { valor: "bomba", rotulo: "Bomba" }, { valor: "rodizio", rotulo: "Rodízio" }]} aoEscolher={setAssunto} />
      <EscolhaLocal rotulo="Situação informada" valor={estado} opcoes={[{ valor: "sim", rotulo: "Sim" }, { valor: "nao", rotulo: "Não" }, { valor: "nao_sabemos", rotulo: "Não sabemos" }]} aoEscolher={setEstado} />
      <CampoLocal rotulo="Relato sobre água e infraestrutura" value={relato} onChangeText={setRelato} multiline maxLength={2000} />
      <CampoLocal rotulo="Fonte da informação de infraestrutura" value={fonte} onChangeText={setFonte} maxLength={300} />
      <CampoLocal rotulo="Data da observação de infraestrutura (AAAA-MM-DD, se conhecida)" value={data} onChangeText={setData} maxLength={10} />
      <Botao rotulo="Guardar infraestrutura informada" onPress={() => void infraestrutura()} />
      {c.infraestrutura?.map(i => <View key={i.id}><Texto>{i.assunto} · {i.estado === "nao_sabemos" ? "não sabemos" : i.estado === "sim" ? "sim" : "não"}</Texto><Texto>{i.relato}</Texto><Texto tipo="apoio">{i.fonte} · {i.observadoEm ? formatarData(i.observadoEm) : "data não informada"}</Texto></View>)}
    </GrupoLocal>
    <GrupoLocal titulo="Expectativa e experiência após a mudança" apoio="Registros privados; a experiência acrescenta uma versão datada, sem apagar a expectativa original.">
      <CampoLocal rotulo="Assunto da expectativa" value={tema} onChangeText={setTema} maxLength={100} />
      <CampoLocal rotulo="O que você espera do imóvel" value={esperado} onChangeText={setEsperado} multiline maxLength={2000} />
      <Botao rotulo="Guardar expectativa" onPress={() => void expectativa()} />
      {c.expectativas?.map(e => <View key={e.id} style={{ gap: 5, marginVertical: 8 }}><Texto tipo="secao">{e.assunto}</Texto><Texto>Expectativa registrada em {new Date(e.em).toLocaleString("pt-BR")}: {e.esperado}</Texto>
        {e.experiencias.map((v, i) => <Texto key={i}>{formatarData(v.observadoEm)} · {v.texto}</Texto>)}
        <Botao rotulo="Acrescentar experiência" acessivel={`Acrescentar experiência sobre ${e.assunto}`} onPress={() => setId(e.id)} />
        {id === e.id ? <><CampoLocal rotulo="Data da experiência (AAAA-MM-DD)" value={em} onChangeText={setEm} maxLength={10} /><CampoLocal rotulo="Sua experiência após a mudança" value={experiencia} onChangeText={setExperiencia} multiline maxLength={2000} /><Botao rotulo="Guardar experiência datada" onPress={() => void observar()} /></> : null}
      </View>)}
    </GrupoLocal>
    {erro ? <Texto role="alert">{erro}</Texto> : null}
  </>;
}
