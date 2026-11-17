import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as FileSystem from "expo-file-system/legacy";
import { copiarArquivoNativo } from "../src/plataforma/copiarArquivoNativo";

jest.mock("expo-file-system/legacy", () => ({ documentDirectory: "file:///app/", getInfoAsync: jest.fn(),
  copyAsync: jest.fn(), makeDirectoryAsync: jest.fn(), deleteAsync: jest.fn() }));
const arquivos = new Map<string, string>();
beforeEach(() => {
  jest.clearAllMocks(); arquivos.clear();
  jest.mocked(FileSystem.getInfoAsync).mockImplementation(async uri => {
    const conteudo = arquivos.get(uri);
    return conteudo === undefined ? { exists: false, uri, isDirectory: false } : { exists: true, uri, isDirectory: false, size: conteudo.length, modificationTime: 1 };
  });
  jest.mocked(FileSystem.copyAsync).mockImplementation(async ({ from, to }) => { arquivos.set(to, arquivos.get(from)!); });
});
describe("cópia privada nativa — filesystem simulado, sem certificação de aparelho", () => {
  it("recusa destino existente e preserva seus bytes", async () => {
    arquivos.set("file:///origem", "novo"); arquivos.set("file:///app/vereda-midia/foto-a.jpg", "anterior");
    await expect(copiarArquivoNativo("file:///origem", "foto-a.jpg", 100)).rejects.toThrow("anterior foi preservada");
    expect(arquivos.get("file:///app/vereda-midia/foto-a.jpg")).toBe("anterior");
    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
  });
  it("serializa colisões e uma recusa não bloqueia a próxima cópia", async () => {
    arquivos.set("file:///a", "primeiro"); arquivos.set("file:///b", "segundo");
    const r = await Promise.allSettled([copiarArquivoNativo("file:///a", "documento-a.pdf", 100), copiarArquivoNativo("file:///b", "documento-a.pdf", 100)]);
    expect(r.map(x => x.status)).toEqual(["fulfilled", "rejected"]);
    expect(arquivos.get("file:///app/vereda-midia/documento-a.pdf")).toBe("primeiro");
    await expect(copiarArquivoNativo("file:///b", "foto-b.png", 100)).resolves.toBe(7);
    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });
  it("falha de cópia ou tamanho não apaga arquivos em rollback", async () => {
    arquivos.set("file:///a", "conteudo");
    await expect(copiarArquivoNativo("file:///a", "foto-a.jpg", 2)).rejects.toThrow("limite");
    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
    jest.mocked(FileSystem.copyAsync).mockImplementation(async ({ to }) => { arquivos.set(to, "x"); });
    await expect(copiarArquivoNativo("file:///a", "foto-a.jpg", 100)).rejects.toThrow("verificar");
    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });
});
