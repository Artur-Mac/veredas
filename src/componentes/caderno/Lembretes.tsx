import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { esquemaCaderno, type Caderno } from "../../dados/caderno";
import { dataDoLembrete } from "../../dados/lembretes";
import { permitirLembretes, estadoLembretes } from "../../plataforma/lembretes";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, EscolhaLocal, GrupoLocal } from "./blocos";
export function LembretesPessoais({ caderno, salvar }: { caderno: Caderno; salvar: (fn: (c: Caderno) => Caderno) => Promise<boolean> }) {
  const [id, setId] = useState<string | null>(null); const [titulo, setTitulo] = useState(""); const [data, setData] = useState(""); const [fuso, setFuso] = useState("America/Recife");
  const [notificar, setNotificar] = useState("nao"); const [aviso, setAviso] = useState("");
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => { const relogio = setInterval(() => setAgora(Date.now()), 60000); return () => clearInterval(relogio); }, []);
  const guardar = async () => {
    try {
      const em = dataDoLembrete(data, fuso); if (Date.parse(em) <= Date.now()) throw new Error("Escolha um horário futuro para o lembrete.");
      const r = esquemaCaderno.shape.lembretes.unwrap().element.parse({ id: id ?? `lembrete-${Date.now().toString(36)}`, titulo, em, fuso, notificar: Platform.OS !== "web" && notificar === "sim", estado: "ativo" });
      if (await salvar(c => ({ ...c, lembretes: [...c.lembretes?.filter(x => x.id !== r.id) ?? [], r] }))) { setId(null); setTitulo(""); setData(""); setAviso("Lembrete guardado. " + estadoLembretes()); }
    } catch (e) { setAviso(e instanceof Error && !e.name.includes("Zod") ? e.message : "Confira título, data/hora com offset e fuso válido."); }
  };
  return <GrupoLocal titulo="Lembretes de visita e pendências" apoio={estadoLembretes()}>
    <CampoLocal rotulo="Título do lembrete" value={titulo} onChangeText={setTitulo} maxLength={160} />
    <CampoLocal rotulo="Data e hora com offset (ex.: 2026-11-01T14:00-03:00)" value={data} onChangeText={setData} maxLength={35} />
    <CampoLocal rotulo="Fuso de exibição do lembrete" value={fuso} onChangeText={setFuso} maxLength={100} />
    {Platform.OS !== "web" ? <><Botao rotulo="Permitir avisos locais neste aparelho" onPress={() => { void permitirLembretes().then(setAviso).catch(() => setAviso("Não foi possível pedir permissão. A anotação continua disponível.")); }} />
      <Texto tipo="apoio">Até 60 próximos avisos no aparelho; abra o app para atualizar os demais. Nenhum aviso contém o nome do imóvel ou suas notas.</Texto>
      <Botao rotulo="Conferir estado dos avisos" onPress={() => setAviso(estadoLembretes())} />
      <EscolhaLocal rotulo="Solicitar aviso local" valor={notificar} opcoes={[{ valor: "nao", rotulo: "Não" }, { valor: "sim", rotulo: "Sim" }]} aoEscolher={setNotificar} /></> : null}
    <Botao rotulo={id ? "Guardar novo horário do lembrete" : "Guardar lembrete"} onPress={() => void guardar()} />
    {id ? <Botao rotulo="Cancelar edição do lembrete" onPress={() => { setId(null); setTitulo(""); setData(""); }} /> : null}
    {caderno.lembretes?.map(r => <View key={r.id} style={{ gap: 6, marginVertical: 8 }}><Texto tipo="secao">{r.titulo}</Texto>
      <Texto>{new Intl.DateTimeFormat("pt-BR", { timeZone: r.fuso, dateStyle: "short", timeStyle: "short" }).format(new Date(r.em))} · {r.fuso} · {r.estado === "ativo" ? (Date.parse(r.em) < agora ? "horário passado" : "pendente") : r.estado === "concluido" ? "concluído" : "cancelado"}</Texto>
      {r.estado === "ativo" ? <><Botao rotulo="Editar horário" acessivel={`Editar horário de ${r.titulo}`} onPress={() => { setId(r.id); setTitulo(r.titulo); setData(r.em.replace(/\.\d{3}Z$/, "Z")); setFuso(r.fuso); setNotificar(r.notificar ? "sim" : "nao"); }} />
        <Botao rotulo="Concluir lembrete" acessivel={`Concluir lembrete ${r.titulo}`} onPress={() => void salvar(c => ({ ...c, lembretes: c.lembretes?.map(x => x.id === r.id ? { ...x, estado: "concluido" } : x) }))} />
        <Botao rotulo="Cancelar lembrete" acessivel={`Cancelar lembrete ${r.titulo}`} onPress={() => void salvar(c => ({ ...c, lembretes: c.lembretes?.map(x => x.id === r.id ? { ...x, estado: "cancelado" } : x) }))} /></> : null}
    </View>)}
    {aviso ? <Texto role="status">{aviso}</Texto> : null}
  </GrupoLocal>;
}
