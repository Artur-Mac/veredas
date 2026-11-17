import * as FileSystem from "expo-file-system/legacy";

// Fotos e documentos compartilham a fila: uma colisão nunca substitui o primeiro arquivo.
let fila: Promise<unknown> = Promise.resolve();
export function copiarArquivoNativo(uri: string, chave: string, limiteBytes: number): Promise<number> {
  const tarefa = fila.then(async () => {
    if (!/^(file|content):/.test(uri) || !/^(foto-[a-z0-9-]+\.(jpg|png)|documento-[a-z0-9-]+\.pdf)$/.test(chave) || !FileSystem.documentDirectory) throw new Error("Arquivo inválido ou armazenamento indisponível.");
    const pasta = FileSystem.documentDirectory + "vereda-midia/";
    const destino = pasta + chave;
    const origem = await FileSystem.getInfoAsync(uri);
    if (!origem.exists || origem.isDirectory || !origem.size || origem.size > limiteBytes) throw new Error("Arquivo ausente, vazio ou acima do limite permitido.");
    await FileSystem.makeDirectoryAsync(pasta, { intermediates: true });
    if ((await FileSystem.getInfoAsync(destino)).exists) throw new Error("Já existe um arquivo com esta referência. A cópia anterior foi preservada; escolha o arquivo novamente.");
    await FileSystem.copyAsync({ from: uri, to: destino });
    const copia = await FileSystem.getInfoAsync(destino);
    if (!copia.exists || copia.isDirectory || copia.size !== origem.size) throw new Error("Não foi possível verificar o arquivo guardado. Nenhum arquivo anterior foi apagado.");
    return copia.size;
  });
  fila = tarefa.catch(() => undefined);
  return tarefa;
}
