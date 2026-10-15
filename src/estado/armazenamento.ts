import AsyncStorage from "@react-native-async-storage/async-storage";

export async function lerJson(chave: string): Promise<unknown> {
  const texto = await AsyncStorage.getItem(chave);
  if (texto === null) return null;
  return JSON.parse(texto) as unknown;
}

export async function gravarJson(chave: string, valor: unknown): Promise<void> {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

export async function apagar(chave: string): Promise<void> {
  await AsyncStorage.removeItem(chave);
}
