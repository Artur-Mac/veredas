export function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("vereda-midia-v1", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("fotos");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(new Error("Armazenamento de fotos indisponível."));
  });
}
async function otimizar(uri: string): Promise<Blob> {
  if (!/^(blob:|data:image\/)/.test(uri)) throw new Error("Escolha uma imagem neste aparelho.");
  const imagem = new Image();
  await new Promise<void>((resolve, reject) => { imagem.onload = () => resolve(); imagem.onerror = reject; imagem.src = uri; });
  if (imagem.width * imagem.height > 40_000_000) throw new Error("Imagem muito grande.");
  const proporcao = Math.min(1, 1600 / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(imagem.width * proporcao));
  canvas.height = Math.max(1, Math.round(imagem.height * proporcao));
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Não foi possível preparar a foto.");
  contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Imagem inválida.")), "image/jpeg", 0.75));
  if (blob.size > 5 * 1024 * 1024) throw new Error("A imagem preparada excede 5 MB.");
  return blob;
}
export async function guardarFoto(uri: string, chave: string): Promise<number> {
  if (!/^foto-[a-z0-9-]+\.jpg$/.test(chave)) throw new Error("Arquivo inválido.");
  const blob = await otimizar(uri);
  const banco = await abrirBanco();
  try {
    await new Promise<void>((resolve, reject) => {
      const t = banco.transaction("fotos", "readwrite");
      t.objectStore("fotos").add(blob, chave);
      t.oncomplete = () => resolve();
      t.onabort = t.onerror = () => reject(new Error("Não foi possível guardar a foto."));
    });
    return blob.size;
  } finally { banco.close(); }
}
export async function abrirFoto(chave: string): Promise<string | null> {
  const blob = await lerArquivoPessoal(chave);
  return blob ? URL.createObjectURL(blob) : null;
}
export async function lerArquivoPessoal(chave: string): Promise<Blob | null> {
  if (!/^(foto-[a-z0-9-]+\.(jpg|png)|documento-[a-z0-9-]+\.pdf)$/.test(chave)) throw new Error("Referência inválida.");
  const banco = await abrirBanco();
  try {
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const r = banco.transaction("fotos").objectStore("fotos").get(chave);
      r.onsuccess = () => resolve(r.result as Blob | undefined); r.onerror = reject;
    });
    return blob ?? null;
  } finally { banco.close(); }
}
export async function guardarArquivoPessoal(chave: string, blob: Blob): Promise<void> {
  if (!/^(foto-[a-z0-9-]+\.(jpg|png)|documento-[a-z0-9-]+\.pdf)$/.test(chave)) throw new Error("Referência inválida.");
  if (blob.size > 20 * 1024 * 1024) throw new Error("Arquivo excede 20 MB.");
  const banco = await abrirBanco();
  try {
    await new Promise<void>((resolve, reject) => {
      const t = banco.transaction("fotos", "readwrite");
      t.objectStore("fotos").add(blob, chave);
      t.oncomplete = () => resolve();
      t.onabort = t.onerror = () => reject(new Error("Não foi possível guardar o arquivo; a cópia anterior foi preservada."));
    });
  } finally { banco.close(); }
}
export function liberarFoto(uri: string): void { URL.revokeObjectURL(uri); }
export async function apagarMidiaPessoal(): Promise<void> {
  const banco = await abrirBanco();
  try {
    await new Promise<void>((resolve, reject) => {
      const t = banco.transaction("fotos", "readwrite");
      t.objectStore("fotos").clear();
      t.oncomplete = () => resolve(); t.onabort = t.onerror = reject;
    });
  } finally { banco.close(); }
}
