import { useState } from "react";
import { View } from "react-native";
import { esquemaCaderno, type Caderno } from "../../dados/caderno";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, GrupoLocal } from "./blocos";

export function HistoricoPessoal({ caderno, salvar }: { caderno: Caderno; salvar: (mudar: (c: Caderno) => Caderno) => Promise<boolean> }) {
  const [fato, setFato] = useState("");
  const [referencia, setReferencia] = useState("");
  const [motivo, setMotivo] = useState("");
  const [evidencia, setEvidencia] = useState("");
  const [erro, setErro] = useState("");
  const guardar = async () => {
    const entrada = { id: `correcao-${Date.now().toString(36)}`, em: new Date().toISOString(), fato, referencia, motivo, evidencia };
    const teste = esquemaCaderno.shape.correcoes.unwrap().element.safeParse(entrada);
    if (!teste.success) { setErro("Informe o fato, a fonte com data/versão e o motivo. A evidência é opcional."); return; }
    if (await salvar(c => ({ ...c, correcoes: [...c.correcoes ?? [], teste.data] }))) { setFato(""); setReferencia(""); setMotivo(""); setEvidencia(""); setErro(""); }
  };
  return <>
    <GrupoLocal titulo={`Alterações do anúncio (${caderno.historicoDoAnuncio?.length ?? 0})`} apoio="Edições salvas e novas extrações confirmadas. O VEREDA não monitora o portal; a ausência de uma alteração aqui não comprova que o anúncio continua disponível.">
      {!caderno.historicoDoAnuncio?.length ? <Texto>Nenhuma alteração registrada desde a ativação deste histórico. Valores antigos não foram reconstruídos.</Texto> : null}
      {caderno.historicoDoAnuncio?.slice().reverse().map(h => <View key={h.id} style={{ gap: 6, marginVertical: 8 }}>
        <Texto tipo="secao">{new Date(h.em).toLocaleString("pt-BR")} · {h.origem === "edicao" ? "Edição salva" : "Nova extração confirmada"}</Texto>
        {h.alteracoes.map(a => <View key={a.campo}><Texto tipo="apoio">{a.campo}</Texto><Texto>Antes: {a.antes}</Texto><Texto>Depois: {a.depois}</Texto></View>)}
      </View>)}
    </GrupoLocal>
    <GrupoLocal titulo="Contestar uma informação" apoio="Sua anotação fica privada. Não altera a fonte pública e não é enviada a nenhum órgão.">
      <CampoLocal rotulo="Qual informação precisa de correção?" value={fato} onChangeText={setFato} maxLength={240} />
      <CampoLocal rotulo="Fonte, data ou versão contestada" value={referencia} onChangeText={setReferencia} maxLength={500} />
      <CampoLocal rotulo="Motivo da correção" value={motivo} onChangeText={setMotivo} multiline maxLength={2000} />
      <CampoLocal rotulo="Evidência ou referência (opcional)" value={evidencia} onChangeText={setEvidencia} multiline maxLength={2000} />
      <Botao rotulo="Guardar correção no caderno" onPress={() => void guardar()} />
      {erro ? <Texto role="alert">{erro}</Texto> : null}
      {caderno.correcoes?.slice().reverse().map(c => <View key={c.id} style={{ gap: 4, marginVertical: 8 }}>
        <Texto tipo="secao">{c.fato}</Texto><Texto tipo="apoio">{c.referencia} · anotado em {new Date(c.em).toLocaleString("pt-BR")}</Texto><Texto>{c.motivo}</Texto>{c.evidencia ? <Texto>{c.evidencia}</Texto> : null}
      </View>)}
    </GrupoLocal>
  </>;
}
