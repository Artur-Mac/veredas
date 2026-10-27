import { router } from "expo-router";
import { useRef, useState } from "react";
import { lerArquivoDaExtensao, guardarArquivoDaExtensao } from "../../dados/arquivoDaExtensao";
import { useAnalises } from "../../estado/Analises";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { GrupoLocal } from "../caderno/blocos";
export function ImportarExtensao() {
  const { lista, pronto } = useAnalises(); const [aviso, setAviso] = useState(""); const ocupado = useRef(false);
  const importar = async () => {
    if (ocupado.current || !pronto) return; ocupado.current = true;
    try {
      const arquivo = await new Promise<File | null>(resolve => { const i = document.createElement("input"); i.type = "file"; i.accept = "application/json,.json"; i.onchange = () => resolve(i.files?.[0] ?? null); i.oncancel = () => resolve(null); i.click(); });
      if (!arquivo) return; if (arquivo.size > 1024 * 1024) throw new Error("Escolha um arquivo de anúncio de até 1 MB.");
      const v = await lerArquivoDaExtensao(await arquivo.text(), async texto => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto)))).map(b => b.toString(16).padStart(2, "0")).join(""));
      if (lista.some(a => a.id === v.id)) { router.push({ pathname: "/dossie", params: { id: v.id } }); return; }
      router.push({ pathname: "/ler", params: { arquivoExtensao: guardarArquivoDaExtensao(v), origem: "extensao", n: Date.now().toString(36) } });
    } catch (e) { setAviso(e instanceof Error && !e.name.includes("Zod") && !(e instanceof SyntaxError) ? e.message : "Arquivo de anúncio inválido. Nada foi salvo."); }
    finally { ocupado.current = false; }
  };
  return <GrupoLocal titulo="Importar anúncio da extensão" apoio="Escolha o arquivo preparado pela extensão VEREDA. Os campos serão propostos para revisão; não salva nem confirma prédio automaticamente.">
    <Botao rotulo="Escolher arquivo da extensão VEREDA" desativado={!pronto} onPress={() => void importar()} />{aviso ? <Texto role="status">{aviso}</Texto> : null}
  </GrupoLocal>;
}
