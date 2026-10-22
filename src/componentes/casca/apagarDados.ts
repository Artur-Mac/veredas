// "Apagar meus dados deste aparelho": remove do armazenamento local toda chave do Vereda (análises, carteira de créditos
// com o extrato, visitas, análise ativa e preferências). Nada sai do aparelho e nada fica no servidor, então não há
// o que apagar fora daqui.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { esquecerCompartilhamento } from "../../estado/compartilhamento";
import { apagarMidiaPessoal } from "../../plataforma/midia";

/** Toda chave que o app grava começa assim ("vereda-analises-v2", "vereda-carteira-v1", "vereda-ativa-v1", …). */
export const PREFIXO_DAS_CHAVES = "vereda-";

/** Remove as chaves "vereda-*" e devolve quantas existiam. Não toca em chave de outro app do mesmo domínio. */
export async function apagarDadosDoAparelho(): Promise<number> {
  // O link aberto no navegador e a página compartilhada ficam só na memória; somem junto.
  esquecerCompartilhamento();
  const chaves = (await AsyncStorage.getAllKeys()).filter((chave) => chave.startsWith(PREFIXO_DAS_CHAVES));
  if (chaves.length > 0) await AsyncStorage.multiRemove(chaves);
  await apagarMidiaPessoal();
  return chaves.length;
}
