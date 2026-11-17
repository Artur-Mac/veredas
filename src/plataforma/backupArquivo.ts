import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
let contador = 0;
/** Arquivo privado; a pessoa escolhe o destino no diálogo do sistema. Não envia automaticamente. */
export async function baixarBackup(texto: string, nome?: string): Promise<string> {
  if (!FileSystem.documentDirectory || !await Sharing.isAvailableAsync()) {
    await Clipboard.setStringAsync(texto); return "Caderno copiado. Guarde o texto em arquivo privado; mídia não está incluída.";
  }
  const pasta = FileSystem.documentDirectory + "vereda-midia/";
  const base = nome && /^[a-z0-9.-]{1,100}$/.test(nome) ? nome.replace(/\.json$/, "") : "vereda-caderno";
  const uri = pasta + `${base}-${Date.now().toString(36)}-${++contador}.json`;
  await FileSystem.makeDirectoryAsync(pasta, { intermediates: true });
  if ((await FileSystem.getInfoAsync(uri)).exists) throw new Error("Nome de cópia já utilizado. Tente exportar novamente.");
  await FileSystem.writeAsStringAsync(uri, texto, { encoding: FileSystem.EncodingType.UTF8 });
  if (await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 }) !== texto) throw new Error("Não foi possível verificar o arquivo exportado.");
  await Sharing.shareAsync(uri, { mimeType: "application/json", UTI: "public.json" });
  return "Arquivo preparado. Confira o destino escolhido. Nenhum envio foi realizado automaticamente; mídia não está incluída.";
}
