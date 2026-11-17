import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { Linking, Platform } from "react-native";
import { copiarArquivoNativo } from "./copiarArquivoNativo";

export type ArquivoDoDocumento = { chave: string; bytes: number; mime: "application/pdf" };
export async function selecionarDocumento(): Promise<ArquivoDoDocumento | null> {
  const r = await File.pickFileAsync({ mimeTypes: ["application/pdf"] });
  if (r.canceled) return null;
  const arquivo = r.result;
  if (!arquivo.size || arquivo.size > 20 * 1024 * 1024) throw new Error("Escolha um PDF de até 20 MB.");
  const inicio = new Uint8Array(await arquivo.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...inicio) !== "%PDF-") throw new Error("O conteúdo não é um PDF reconhecido.");
  if (!FileSystem.documentDirectory) throw new Error("Armazenamento indisponível.");
  const chave = `documento-${Date.now().toString(36)}.pdf`;
  const bytes = await copiarArquivoNativo(arquivo.uri, chave, 20 * 1024 * 1024);
  return { chave, bytes, mime: "application/pdf" };
}
export async function abrirDocumento(chave: string): Promise<void> {
  if (!/^documento-[a-z0-9-]+\.pdf$/.test(chave) || !FileSystem.documentDirectory) throw new Error("Referência inválida.");
  const uri = FileSystem.documentDirectory + "vereda-midia/" + chave;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error("Este PDF não está neste aparelho. A referência foi preservada.");
  await Linking.openURL(Platform.OS === "android" ? await FileSystem.getContentUriAsync(uri) : uri);
}
