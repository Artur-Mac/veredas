import * as FileSystem from "expo-file-system/legacy";
import { copiarArquivoNativo } from "./copiarArquivoNativo";

function caminho(chave: string) {
  if (!/^foto-[a-z0-9-]+\.(jpg|png)$/.test(chave) || !FileSystem.documentDirectory) throw new Error("Arquivo inválido ou armazenamento indisponível.");
  return FileSystem.documentDirectory + "vereda-midia/" + chave;
}
export async function guardarFoto(uri: string, chave: string): Promise<number> {
  caminho(chave);
  return copiarArquivoNativo(uri, chave, 5 * 1024 * 1024);
}
export async function abrirFoto(chave: string): Promise<string | null> {
  const uri = caminho(chave);
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists ? uri : null;
}
export function liberarFoto(_uri: string): void {}
export async function apagarMidiaPessoal(): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  await FileSystem.deleteAsync(FileSystem.documentDirectory + "vereda-midia/", { idempotent: true });
}
