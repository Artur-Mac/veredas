import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import type { AnaliseV2 } from "../../dados/contratos";
import { htmlDoResumo, resumoCompartilhavel } from "../../dados/resumo";
import { imprimirResumo } from "../../plataforma/imprimir";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { EscolhaLocal, GrupoLocal } from "./blocos";

export function ResumoSelecionavel({ analise }: { analise: AnaliseV2 }) {
  const [notas, setNotas] = useState("nao");
  const [aviso, setAviso] = useState("");
  const texto = resumoCompartilhavel(analise, notas === "sim");
  return <GrupoLocal titulo="Preparar resumo para compartilhar" apoio="Revise o conteúdo. Documentos, CNPJ e observações por cômodo ficam fora deste resumo.">
    <EscolhaLocal rotulo="Incluir suas notas da visita atual?" valor={notas} opcoes={[{ valor: "nao", rotulo: "Não" }, { valor: "sim", rotulo: "Sim, incluir" }]} aoEscolher={setNotas} />
    <Texto selectable>{texto}</Texto>
    <Botao rotulo="Copiar resumo selecionado" onPress={() => { void Clipboard.setStringAsync(texto).then(() => setAviso("Resumo copiado. Você escolhe onde compartilhar.")).catch(() => setAviso("Não foi possível copiar.")); }} />
    <Botao rotulo="Imprimir ou salvar PDF" onPress={() => { void imprimirResumo(htmlDoResumo(texto)).catch(e => setAviso(e instanceof Error ? e.message : "Não foi possível preparar o PDF.")); }} />
    {aviso ? <Texto role="status">{aviso}</Texto> : null}
  </GrupoLocal>;
}
