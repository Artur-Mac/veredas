// Links que o sistema abre no app. O Safari, depois de compartilhar com "Ler no Vereda", abre `vereda://dataUrl=…`
// (expo-share-intent): esse endereço não é uma rota, então vai para a espera (aba escondida), onde o anúncio é recebido.
import { ehLinkDoCompartilhamento } from "../dados/extrator/compartilhado";

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return ehLinkDoCompartilhamento(path) ? "/receber" : path;
  } catch {
    return "/";
  }
}
