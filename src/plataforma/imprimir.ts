import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";
import { copiarArquivoNativo } from "./copiarArquivoNativo";
export async function imprimirResumo(html: string): Promise<void> {
  if (!await Sharing.isAvailableAsync()) throw new Error("O compartilhamento de arquivo não está disponível. Copie o resumo ou use a versão web.");
  const fontes = [["Fraunces", require("../../assets/fonts/Fraunces.ttf")], ["PlusJakartaSans", require("../../assets/fonts/PlusJakartaSans.ttf")]] as const;
  let estilos = "";
  for (const [nome, modulo] of fontes) {
    const a = Asset.fromModule(modulo); await a.downloadAsync();
    const base64 = await FileSystem.readAsStringAsync(a.localUri ?? a.uri, { encoding: FileSystem.EncodingType.Base64 });
    estilos += `@font-face{font-family:'${nome}';src:url(data:font/ttf;base64,${base64}) format('truetype')}`;
  }
  const pdf = await Print.printToFileAsync({ html: html.replace("</style>", estilos + "</style>"), base64: false });
  const chave = `documento-resumo-${Date.now().toString(36)}.pdf`;
  await copiarArquivoNativo(pdf.uri, chave, 20 * 1024 * 1024);
  // Só o temporário produzido por esta chamada; a cópia verificada já está no diretório privado.
  await FileSystem.deleteAsync(pdf.uri, { idempotent: true });
  await Sharing.shareAsync(FileSystem.documentDirectory + "vereda-midia/" + chave, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
}
