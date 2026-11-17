import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formularioVazio } from "../src/dados/formulario";
import { guardarRascunho, lerRascunho, PREFIXO_RASCUNHO } from "../src/estado/rascunho";
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
beforeEach(async () => { await AsyncStorage.clear(); });
describe("rascunho recuperável", () => {
  it("preserva campos incompletos e ID para não duplicar análise depois de salvar", async () => {
    const form = { ...formularioVazio(), nome: "Nome longo em edição", bairro: null };
    await guardarRascunho("novo", form, "imovel-123");
    expect(await lerRascunho("novo")).toEqual({ form, analiseId: "imovel-123" });
  });
  it("mantém ordem de digitação e não transforma zero em ausência", async () => {
    const a = formularioVazio();
    await Promise.all([guardarRascunho("novo", { ...a, nome: "A" }), guardarRascunho("novo", { ...a, nome: "AB", preco: 0 })]);
    expect((await lerRascunho("novo"))?.form).toMatchObject({ nome: "AB", preco: 0 });
  });
  it("versão desconhecida ou inválida não é apagada ao falhar leitura", async () => {
    const bruto = JSON.stringify({ versao: 99, form: formularioVazio(), outraInformacao: "preservar" });
    await AsyncStorage.setItem(PREFIXO_RASCUNHO + "novo", bruto);
    await expect(lerRascunho("novo")).rejects.toThrow();
    expect(await AsyncStorage.getItem(PREFIXO_RASCUNHO + "novo")).toBe(bruto);
  });
});
