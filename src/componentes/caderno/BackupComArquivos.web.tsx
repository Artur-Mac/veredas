import { useRef, useState } from "react";
import type { AnaliseV2 } from "../../dados/contratos";
import type { RevisaoDaImportacao } from "../../dados/backup";
import { exportarPacote, guardarArquivosDoPacote, revisarPacote, selecionarPacote, type RevisaoPacote } from "../../plataforma/pacote.web";
import { baixarBackup } from "../../plataforma/backupArquivo.web";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { GrupoLocal } from "./blocos";

export function BackupComArquivos({ lista, importar, disponivel }: { lista: AnaliseV2[]; importar: (r: RevisaoDaImportacao) => Promise<void>; disponivel: boolean }) {
  const [revisao, setRevisao] = useState<RevisaoPacote | null>(null);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const executar = async (acao: () => Promise<void>) => {
    if (trava.current) return;
    trava.current = true; setOcupado(true);
    try { await acao(); }
    catch (e) { setAviso(e instanceof Error && !e.name.includes("Zod") && !(e instanceof SyntaxError) ? e.message : "Pacote inválido ou incompatível. O caderno anterior foi preservado."); }
    finally { trava.current = false; setOcupado(false); }
  };
  return <GrupoLocal titulo="Cópia com arquivos deste navegador" apoio="Inclui fotos e PDFs vinculados. Contém dados privados; guarde em local protegido. Até 32 MB de arquivos e 1.000 anexos.">
    <Botao rotulo="Exportar com fotos e PDFs" desativado={!disponivel || ocupado} onPress={() => void executar(async () => {
      const texto = await exportarPacote(lista); await baixarBackup(texto, `vereda-com-arquivos-${new Date().toISOString().slice(0, 10)}.json`); setAviso("Pacote com arquivos preparado. Confira o download e teste a restauração antes de apagar originais.");
    })} />
    <Botao rotulo="Escolher cópia com arquivos" desativado={!disponivel || ocupado} onPress={() => void executar(async () => {
      const texto = await selecionarPacote(); if (texto === null) return;
      setRevisao(null);
      setRevisao(await revisarPacote(texto, lista)); setAviso("Integridade conferida. Revise as cópias antes de confirmar.");
    })} />
    {revisao ? <>
      <Texto>{revisao.revisao.novas} novas cópias · {revisao.revisao.iguais} já presentes · {revisao.arquivos.length} arquivos verificados. Conflitos mantêm ambas as versões.</Texto>
      <Botao rotulo="Confirmar pacote com arquivos" desativado={ocupado} onPress={() => void executar(async () => {
        if (JSON.stringify(lista) !== revisao.revisao.base) throw new Error("O caderno mudou. Selecione e revise novamente.");
        await guardarArquivosDoPacote(revisao.arquivos);
        await importar(revisao.revisao);
        setRevisao(null); setAviso("Pacote restaurado neste navegador.");
      })} />
      <Botao rotulo="Cancelar pacote" desativado={ocupado} onPress={() => setRevisao(null)} />
      <Texto tipo="apoio">Arquivos são guardados antes das referências. Se a gravação do caderno falhar, algumas cópias podem ficar sem vínculo; arquivos anteriores não são substituídos.</Texto>
    </> : null}
    {aviso ? <Texto role="status">{aviso}</Texto> : null}
  </GrupoLocal>;
}
