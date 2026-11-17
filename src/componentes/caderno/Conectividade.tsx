// Internet no lugar em que a pessoa vai usar (15/11/2026): consulta de fibra por endereço/bloco/unidade e medição por
// cômodo (SIMET ou chamada). Disponibilidade consultada, cobertura móvel externa e qualidade observada ficam separadas.
import { useState } from "react";
import { Linking, View } from "react-native";
import type { Caderno } from "../../dados/caderno";
import { ANATEL_MOSAICO_URL, SIMET_URL, esquemaConsultaDeFibra, esquemaMedicaoNoComodo, frasesDaDisponibilidade, frasesDaQualidade, pendenciasDaConectividade, type MedicaoNoComodo } from "../../dados/conectividade";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, EscolhaLocal, GrupoLocal } from "./blocos";

type Salvar = (mudar: (c: Caderno) => Caderno) => Promise<boolean>;
const novoId = (p: string) => `${p}-${Date.now().toString(36)}`;
/** "12,5" → 12.5; vazio → null (não medido nunca vira zero). */
export function numeroOuNulo(t: string): number | null {
  const v = t.trim().replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error("número inválido");
  return n;
}

export function ConectividadeNoLocal({ caderno, salvar }: { caderno: Caderno; salvar: Salvar }) {
  const regs = caderno.conectividade ?? [];
  const [prestadora, setPrestadora] = useState(""); const [escopo, setEscopo] = useState<"endereco" | "bloco" | "unidade">("endereco");
  const [bloco, setBloco] = useState(""); const [resultado, setResultado] = useState<"disponivel" | "consulta_tecnica" | "indisponivel" | "sem_resposta">("disponivel");
  const [canal, setCanal] = useState<"site" | "telefone" | "whatsapp" | "loja" | "sindico_ou_portaria" | "outro">("site");
  const [protocolo, setProtocolo] = useState(""); const [dataConsulta, setDataConsulta] = useState("");
  const [comodo, setComodo] = useState(""); const [rede, setRede] = useState<"wifi" | "movel">("wifi");
  const [tecnologia, setTecnologia] = useState<MedicaoNoComodo["tecnologia"]>("wifi_desconhecida");
  const [operadora, setOperadora] = useState(""); const [metodo, setMetodo] = useState<"simet" | "chamada" | "outro_teste">("simet");
  const [down, setDown] = useState(""); const [up, setUp] = useState(""); const [lat, setLat] = useState("");
  const [chamada, setChamada] = useState<"funcionou" | "falhou" | "nao_testada">("nao_testada"); const [nota, setNota] = useState("");
  const [erro, setErro] = useState("");
  const guardarConsulta = async () => {
    try {
      const c = esquemaConsultaDeFibra.parse({ id: novoId("fibra"), tipo: "consulta_fibra", prestadora, escopo, bloco: escopo === "bloco" ? bloco : "", resultado, canal, protocolo,
        consultadoEm: dataConsulta.trim() || new Date().toISOString().slice(0, 10), registradoEm: new Date().toISOString() });
      if (await salvar((x) => ({ ...x, conectividade: [...(x.conectividade ?? []), c] }))) { setPrestadora(""); setProtocolo(""); setErro(""); }
    } catch { setErro("Informe a prestadora e a data da consulta (AAAA-MM-DD ou vazio para hoje)."); }
  };
  const guardarMedicao = async () => {
    try {
      const m = esquemaMedicaoNoComodo.parse({ id: novoId("medicao"), tipo: "medicao", comodo, em: new Date().toISOString(), rede, operadora: operadora.trim() || null, tecnologia, metodo,
        downloadMbps: numeroOuNulo(down), uploadMbps: numeroOuNulo(up), latenciaMs: numeroOuNulo(lat), chamada, nota, registradoEm: new Date().toISOString() });
      if (await salvar((x) => ({ ...x, conectividade: [...(x.conectividade ?? []), m] }))) { setDown(""); setUp(""); setLat(""); setNota(""); setErro(""); }
    } catch { setErro("Informe o cômodo; a tecnologia precisa ser da rede escolhida; números com vírgula ou vazios; num teste de chamada, diga se funcionou."); }
  };
  const disponibilidade = frasesDaDisponibilidade(regs), qualidade = frasesDaQualidade(regs), pendencias = pendenciasDaConectividade(regs);
  return <GrupoLocal titulo="Internet onde você vai usar" apoio="Três coisas diferentes: o que a prestadora respondeu, a cobertura móvel prevista ao ar livre e o que você mediu no cômodo. Fica neste aparelho.">
    <Texto tipo="secao">Disponibilidade consultada</Texto>
    {disponibilidade.length ? disponibilidade.map((f) => <Texto key={f}>{f}</Texto>) : <Texto tipo="apoio">Nenhuma consulta de fibra registrada.</Texto>}
    <CampoLocal rotulo="Prestadora consultada" value={prestadora} onChangeText={setPrestadora} maxLength={80} />
    <EscolhaLocal rotulo="A resposta vale para" valor={escopo} opcoes={[{ valor: "endereco", rotulo: "Endereço" }, { valor: "bloco", rotulo: "Bloco" }, { valor: "unidade", rotulo: "Unidade" }]} aoEscolher={setEscopo} />
    {escopo === "bloco" ? <CampoLocal rotulo="Bloco" value={bloco} onChangeText={setBloco} maxLength={40} /> : null}
    <EscolhaLocal rotulo="Resposta da prestadora" valor={resultado} opcoes={[{ valor: "disponivel", rotulo: "Disponível" }, { valor: "consulta_tecnica", rotulo: "Visita técnica" }, { valor: "indisponivel", rotulo: "Indisponível" }, { valor: "sem_resposta", rotulo: "Sem resposta" }]} aoEscolher={setResultado} />
    <EscolhaLocal rotulo="Canal da consulta" valor={canal} opcoes={[{ valor: "site", rotulo: "Site" }, { valor: "telefone", rotulo: "Telefone" }, { valor: "whatsapp", rotulo: "WhatsApp" }, { valor: "loja", rotulo: "Loja" }, { valor: "sindico_ou_portaria", rotulo: "Síndico/portaria" }, { valor: "outro", rotulo: "Outro" }]} aoEscolher={setCanal} />
    <CampoLocal rotulo="Protocolo (opcional)" value={protocolo} onChangeText={setProtocolo} maxLength={80} />
    <CampoLocal rotulo="Data da consulta (AAAA-MM-DD; vazio = hoje)" value={dataConsulta} onChangeText={setDataConsulta} maxLength={10} />
    <Botao rotulo="Guardar consulta de fibra" onPress={() => void guardarConsulta()} />

    <Texto tipo="secao">Cobertura móvel externa</Texto>
    <Texto tipo="apoio">O mapa da Anatel mostra a cobertura prevista ao ar livre, por operadora. Não diz como o sinal chega dentro da unidade.</Texto>
    <Botao rotulo="Abrir o mapa de cobertura da Anatel" onPress={() => { void Linking.openURL(ANATEL_MOSAICO_URL).catch(() => undefined); }} />

    <Texto tipo="secao">Qualidade observada na unidade</Texto>
    {qualidade.length ? qualidade.map((f) => <Texto key={f}>{f}</Texto>) : <Texto tipo="apoio">Nenhuma medição registrada.</Texto>}
    <Botao rotulo="Abrir o teste SIMET (NIC.br)" onPress={() => { void Linking.openURL(SIMET_URL).catch(() => undefined); }} />
    <CampoLocal rotulo="Cômodo da medição" value={comodo} onChangeText={setComodo} maxLength={100} />
    <EscolhaLocal rotulo="Rede usada no teste" valor={rede} opcoes={[{ valor: "wifi", rotulo: "Wi-Fi" }, { valor: "movel", rotulo: "Rede móvel" }]} aoEscolher={(v) => { setRede(v); setTecnologia(v === "wifi" ? "wifi_desconhecida" : "movel_desconhecida"); }} />
    <EscolhaLocal rotulo="Tecnologia vista no aparelho" valor={tecnologia} opcoes={rede === "wifi"
      ? [{ valor: "wifi_2_4", rotulo: "2,4 GHz" }, { valor: "wifi_5", rotulo: "5 GHz" }, { valor: "wifi_desconhecida", rotulo: "Não sei" }]
      : [{ valor: "4g", rotulo: "4G" }, { valor: "5g", rotulo: "5G" }, { valor: "3g", rotulo: "3G" }, { valor: "2g", rotulo: "2G" }, { valor: "movel_desconhecida", rotulo: "Não sei" }]} aoEscolher={setTecnologia} />
    <CampoLocal rotulo={rede === "movel" ? "Operadora do chip (se souber)" : "Operadora da internet (se souber)"} value={operadora} onChangeText={setOperadora} maxLength={80} />
    <EscolhaLocal rotulo="Como testou" valor={metodo} opcoes={[{ valor: "simet", rotulo: "SIMET" }, { valor: "chamada", rotulo: "Chamada" }, { valor: "outro_teste", rotulo: "Outro teste" }]} aoEscolher={setMetodo} />
    <CampoLocal rotulo="Download em Mbps (se medido)" value={down} onChangeText={setDown} keyboardType="decimal-pad" />
    <CampoLocal rotulo="Upload em Mbps (se medido)" value={up} onChangeText={setUp} keyboardType="decimal-pad" />
    <CampoLocal rotulo="Latência em ms (se medida)" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
    <EscolhaLocal rotulo="Chamada" valor={chamada} opcoes={[{ valor: "nao_testada", rotulo: "Não testei" }, { valor: "funcionou", rotulo: "Funcionou" }, { valor: "falhou", rotulo: "Falhou" }]} aoEscolher={setChamada} />
    <CampoLocal rotulo="Nota da medição (opcional)" value={nota} onChangeText={setNota} multiline maxLength={1000} />
    <Botao rotulo="Guardar medição no cômodo" onPress={() => void guardarMedicao()} />

    {pendencias.length ? <View style={{ gap: 4 }}><Texto tipo="secao">Ainda falta</Texto>{pendencias.map((p) => <Texto key={p} tipo="apoio">{p}</Texto>)}</View> : null}
    {regs.length ? <Botao rotulo="Retirar o último registro de internet" onPress={() => void salvar((x) => ({ ...x, conectividade: (x.conectividade ?? []).slice(0, -1) }))} /> : null}
    {erro ? <Texto role="alert">{erro}</Texto> : null}
  </GrupoLocal>;
}
