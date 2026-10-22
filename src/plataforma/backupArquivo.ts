import * as Clipboard from "expo-clipboard";
/** No nativo, o JSON pode ser copiado e restaurado manualmente. Não promete pacote com mídia. */
export async function baixarBackup(texto: string): Promise<string> {
  await Clipboard.setStringAsync(texto);
  return "Caderno copiado. Guarde o texto em um arquivo privado. Arquivos de mídia não estão incluídos.";
}
