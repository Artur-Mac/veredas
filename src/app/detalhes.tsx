import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Coluna } from "../componentes/casca/Coluna";
import { Cabecalho, Tela } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { OrcamentoPessoal } from "../componentes/caderno/Orcamento";
import { DocumentosDoEdificio } from "../componentes/caderno/Edificio";
import { RegistrosPessoais } from "../componentes/caderno/Registros";
import { cadernoVazio, esquemaCaderno, type Caderno } from "../dados/caderno";
import { useAnalises } from "../estado/Analises";
import { prepararOutraVisita } from "../dados/sessoes";
import { perguntasDaVisita } from "../componentes/visita-v1/logica";

export default function DetalhesDaAnalise() {
  const { id, secao } = useLocalSearchParams<{ id?: string; secao?: string }>();
  const { lista, pronto, atualizar } = useAnalises();
  const analise = lista.find(a => a.id === id);
  const [aviso, setAviso] = useState("");
  const trava = useRef(false);
  const salvar = async (mudar: (c: Caderno) => Caderno): Promise<boolean> => {
    if (!analise || trava.current) return false;
    trava.current = true;
    try {
      await atualizar(analise.id, a => ({ ...a, atualizadaEm: new Date().toISOString(), caderno: esquemaCaderno.parse(mudar(a.caderno ?? cadernoVazio())) }));
      setAviso("Registro salvo neste aparelho."); return true;
    } catch { setAviso("Não foi possível salvar o registro. Confira os campos e tente novamente; o conteúdo anterior foi preservado."); return false; }
    finally { trava.current = false; }
  };
  const titulo = secao === "orcamento" ? "Orçamento" : secao === "edificio" ? "Documentos do edifício" : "Registro de campo";
  const levarParaVisita = async (id: string, texto: string) => {
    if (!analise || trava.current) return;
    trava.current = true;
    try {
      await atualizar(analise.id, a => a.visita.perguntasProprias.some(p => p.id === id) ? a : ({ ...a,
        atualizadaEm: new Date().toISOString(), visita: { ...a.visita, perguntasProprias: [...a.visita.perguntasProprias, { id, texto }] } }));
      setAviso("Pergunta no roteiro da visita. Você pode responder ou revisar a mensagem ao corretor.");
    } catch { setAviso("Não foi possível levar a pergunta à visita. Confira o limite de 30 perguntas próprias e tente novamente."); }
    finally { trava.current = false; }
  };
  const novaVisita = async () => {
    if (!analise || trava.current) return;
    trava.current = true;
    const em = new Date().toISOString();
    const id = `visita-${Date.now().toString(36)}`;
    try { await atualizar(analise.id, a => prepararOutraVisita(a, em, id, Object.fromEntries(perguntasDaVisita(a, lista, new Date()).map(p => [p.id, p.titulo])))); setAviso("Visita anterior guardada. Você pode iniciar outra na área Visita."); }
    catch { setAviso("Não foi possível preparar outra visita. A anterior foi preservada."); }
    finally { trava.current = false; }
  };
  return <Tela><Coluna><Cabecalho titulo={titulo} pai="/dossie" /></Coluna>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 64 }}><Coluna>
        {!pronto ? <Texto>Abrindo caderno…</Texto> : !analise ? <Texto>Análise não encontrada. Volte ao caderno para escolher um imóvel.</Texto> : <>
          <Texto tipo="apoio" style={{ marginBottom: 16 }}>{analise.nome}</Texto>
          {secao === "orcamento" ? <OrcamentoPessoal analise={analise} salvar={salvar} /> :
            secao === "edificio" ? <DocumentosDoEdificio analise={analise} salvar={salvar} levarParaVisita={levarParaVisita} /> :
              secao === "campo" ? <RegistrosPessoais analise={analise} salvar={salvar} novaVisita={novaVisita} /> : <Texto>Seção não encontrada.</Texto>}
        </>}
        {aviso ? <Texto role="status" accessibilityLiveRegion="polite" style={{ marginVertical: 16 }}>{aviso}</Texto> : null}
      </Coluna></ScrollView>
    </KeyboardAvoidingView>
  </Tela>;
}
