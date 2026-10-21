// Memória do compartilhamento, só enquanto o app está aberto: nada daqui vai para o armazenamento do aparelho.
// - a coleta da página do Safari, que é grande demais para viajar nos parâmetros da rota;
// - o link que a pessoa abriu no navegador, para o trecho que volta sem link ("Ler no Vereda" no Android);
// - a hora do último recebimento, para a tela de leitura não ler a área de transferência por cima dele.
import type { ColetaDaPagina } from "../dados/extrator/pagina";

/** Por quanto tempo o link aberto no navegador ainda vale para um trecho que chega sem link. */
export const VALIDADE_DO_LINK_ABERTO_MS = 30 * 60 * 1000;

let coletaGuardada: { id: string; coleta: ColetaDaPagina } | null = null;
let contador = 0;
let linkAberto: { url: string; em: number } | null = null;
let ultimoRecebimentoEm: number | null = null;

/** Guarda a coleta e devolve o id que vai na rota. Só a última fica: uma página nova substitui a anterior. */
export function guardarColeta(coleta: ColetaDaPagina): string {
  contador += 1;
  const id = `c${contador}`;
  coletaGuardada = { id, coleta };
  return id;
}

export function coletaDoId(id: string): ColetaDaPagina | null {
  return coletaGuardada !== null && coletaGuardada.id === id ? coletaGuardada.coleta : null;
}

export function registrarLinkAberto(url: string, em: number): void {
  linkAberto = { url, em };
}

/** O link aberto há menos de `VALIDADE_DO_LINK_ABERTO_MS`, ou null. */
export function linkAbertoRecente(agora: number): string | null {
  if (linkAberto === null || agora - linkAberto.em > VALIDADE_DO_LINK_ABERTO_MS) return null;
  return linkAberto.url;
}

export function registrarRecebimento(em: number): void {
  ultimoRecebimentoEm = em;
}

/** Chegou um compartilhamento desde `instante`? */
export function recebeuDesde(instante: number): boolean {
  return ultimoRecebimentoEm !== null && ultimoRecebimentoEm >= instante;
}

/** Volta ao estado de app recém-aberto. "Apagar meus dados deste aparelho" também esquece esta memória. */
export function esquecerCompartilhamento(): void {
  coletaGuardada = null;
  linkAberto = null;
  ultimoRecebimentoEm = null;
}
