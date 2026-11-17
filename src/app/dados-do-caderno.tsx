import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Botao } from "../componentes/Botao";
import { CampoLocal, GrupoLocal } from "../componentes/caderno/blocos";
import { Coluna } from "../componentes/casca/Coluna";
import { Cabecalho, Tela } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { exportarCaderno, lerBackup, planejarImportacao, type RevisaoDaImportacao } from "../dados/backup";
import { useAnalises } from "../estado/Analises";
import { baixarBackup } from "../plataforma/backupArquivo";
import { BackupComArquivos } from "../componentes/caderno/BackupComArquivos";

export default function DadosDoCaderno() {
  const { lista, pronto, bloqueada, importar } = useAnalises();
  const [texto, setTexto] = useState("");
  const [revisao, setRevisao] = useState<RevisaoDaImportacao | null>(null);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const exportar = async () => {
    try { setAviso(await baixarBackup(exportarCaderno(lista, new Date().toISOString()))); }
    catch { setAviso("Não foi possível exportar. Seu caderno continua intacto."); }
  };
  const revisar = () => {
    try { setRevisao(planejarImportacao(lista, lerBackup(texto))); setAviso(""); }
    catch (e) { setRevisao(null); setAviso(e instanceof Error ? e.message : "Arquivo inválido."); }
  };
  const confirmar = async () => {
    if (!revisao || trava.current) return;
    trava.current = true; setOcupado(true);
    try { await importar(revisao); setTexto(""); setRevisao(null); setAviso("Importação salva neste aparelho."); }
    catch (e) { setAviso(e instanceof Error ? e.message : "Não foi possível importar."); }
    finally { trava.current = false; setOcupado(false); }
  };
  return <Tela><Coluna><Cabecalho titulo="Seu caderno e seus dados" pai="/salvos" /></Coluna>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 48 }}><Coluna>
      <Texto tipo="titulo-tela">Guarde uma cópia.</Texto>
      <Texto style={{ marginVertical: 16 }}>Exporte análises, respostas, cenários e registros locais. A carteira de créditos e arquivos de mídia não fazem parte desta cópia.</Texto>
      <Botao rotulo="Exportar caderno" onPress={() => void exportar()} desativado={!pronto || bloqueada} />
      <BackupComArquivos lista={lista} importar={importar} disponivel={pronto && !bloqueada} />
      <GrupoLocal titulo="Restaurar ou juntar um caderno" apoio="Revise antes de importar. Conflitos mantêm ambas as versões; nada é substituído sem revisão.">
        <CampoLocal rotulo="Conteúdo do arquivo de caderno" multiline value={texto} maxLength={10 * 1024 * 1024}
          onChangeText={v => { setTexto(v); setRevisao(null); }} style={{ minHeight: 160 }} />
        <Botao rotulo="Revisar importação" onPress={revisar} desativado={!pronto || bloqueada || !texto.trim()} />
        {revisao ? <View style={{ gap: 10 }}>
          <Texto>{revisao.novas} novas cópias · {revisao.iguais} já presentes · {revisao.conflitos.length} conflitos mantidos em separado.</Texto>
          {revisao.conflitos.map((nome, i) => <Texto key={i} tipo="apoio">Manter ambas: {nome}</Texto>)}
          <Botao rotulo="Confirmar importação" variante="principal" onPress={() => void confirmar()} desativado={ocupado} />
          <Botao rotulo="Cancelar importação" onPress={() => setRevisao(null)} desativado={ocupado} />
        </View> : null}
      </GrupoLocal>
      {aviso ? <Texto role="status" accessibilityLiveRegion="polite" style={{ marginTop: 16 }}>{aviso}</Texto> : null}
    </Coluna></ScrollView>
  </Tela>;
}
