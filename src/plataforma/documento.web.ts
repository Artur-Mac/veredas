import { guardarArquivoPessoal, lerArquivoPessoal } from "./midia.web";
export type ArquivoDoDocumento = { chave: string; bytes: number; mime: "application/pdf" };
export async function selecionarDocumento(): Promise<ArquivoDoDocumento | null> {
  const arquivo = await new Promise<File | null>((resolve, reject) => {
    const seletor = document.createElement("input");
    seletor.type = "file"; seletor.accept = "application/pdf";
    seletor.onchange = () => resolve(seletor.files?.[0] ?? null);
    seletor.oncancel = () => resolve(null);
    seletor.onerror = reject;
    seletor.click();
  });
  if (!arquivo) return null;
  if (!arquivo.size || arquivo.size > 20 * 1024 * 1024) throw new Error("Escolha um PDF de até 20 MB.");
  if (await arquivo.slice(0, 5).text() !== "%PDF-") throw new Error("O conteúdo não é um PDF reconhecido.");
  const chave = `documento-${Date.now().toString(36)}.pdf`;
  const pdf = new Blob([await arquivo.arrayBuffer()], { type: "application/pdf" });
  await guardarArquivoPessoal(chave, pdf);
  return { chave, bytes: pdf.size, mime: "application/pdf" };
}
export async function abrirDocumento(chave: string): Promise<void> {
  const janela = window.open("", "_blank");
  if (!janela) throw new Error("Permita abrir o documento ou consulte o arquivo original.");
  janela.opener = null;
  try {
    const blob = await lerArquivoPessoal(chave);
    if (!blob) throw new Error("Este PDF não está neste navegador. A referência foi preservada.");
    const uri = URL.createObjectURL(blob);
    janela.location.replace(uri);
    // Não revogar enquanto o leitor pode estar usando o arquivo.
    const relogio = setInterval(() => { if (janela.closed) { URL.revokeObjectURL(uri); clearInterval(relogio); } }, 1000);
  } catch (e) { janela.close(); throw e; }
}
