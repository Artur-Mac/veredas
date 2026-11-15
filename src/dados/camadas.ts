// Camadas de dados por área fora do bundle JS (D036, divisão do pacote). Cada arquivo gerado pelos pipelines (índice do
// bairro, sol, trânsito, essenciais, noite, chuva, procura) é um "arquivo de camada", nomeado pelo caminho relativo a
// src/dados (ex.: "recife/noite/678af34eca5d1dd9/boa-viagem.json"). O app não o importa: os módulos de cada camada leem
// com `lerCamada`, que é síncrona e só devolve o que já foi carregado; as telas esperam com `garantirCamadas` (ou o
// componente `EsperaDasCamadas`) antes de desenhar.
//
// Onde o arquivo mora:
// - web: em /dados/<caminho com sha256>.json (public/dados, gerado por scripts/dados/publicar-camadas.mjs), baixado sob
//   demanda e guardado no Cache Storage do navegador; o service worker (public/sw.js) guarda a casca do app. Um dossiê
//   aberto uma vez reabre sem rede.
// - nativo: como asset empacotado no aplicativo (expo-asset), lido do disco.
// Toda leitura confere o tamanho em bytes (e, na web, o sha256) com o manifesto gerado antes de entregar o conteúdo.
// Arquivo que falta ou não confere vira estado `falhou`: a tela mostra isso e oferece tentar de novo, nunca um dado
// parecido. A validação de conteúdo (zod, versão gerada) continua nos módulos de cada camada, como antes.
import { aquecerArquivoDeCamada, buscarArquivoDeCamada } from "../plataforma/camadas";
import { CAMADAS_PUBLICADAS, type ArquivoPublicado } from "./camadasGeradas";

/** Lida antes de terminar de carregar: erro de programação (a tela não esperou). */
export class CamadaPendente extends Error {
  constructor(readonly caminho: string) {
    super(`Camada de dados ainda não carregada: ${caminho}. A tela tem de esperar por ela (garantirCamadas/EsperaDasCamadas).`);
    this.name = "CamadaPendente";
  }
}

/** O arquivo não pôde ser lido ou não confere com o manifesto. */
export class CamadaIndisponivel extends Error {
  constructor(readonly caminho: string, motivo: string) {
    super(`Camada de dados indisponível: ${caminho} (${motivo}).`);
    this.name = "CamadaIndisponivel";
  }
}

type Entrada =
  | { estado: "carregando"; promessa: Promise<void> }
  | { estado: "pronta"; valor: unknown }
  | { estado: "falhou"; erro: Error };

export type EstadoDasCamadas = "pronta" | "carregando" | "falhou";

const entradas = new Map<string, Entrada>();
const ouvintes = new Set<() => void>();

/**
 * Leitor síncrono só para o Jest (tests/configurar-camadas.ts): lê o arquivo do repositório pelo sistema de módulos do
 * Jest, para que os mocks de JSON dos testes continuem valendo. O app nunca o define.
 */
type LeitorDeTeste = (caminho: string) => unknown;
const leitorDeTeste = (): LeitorDeTeste | undefined => (globalThis as { __veredaLerCamadaEmTeste?: LeitorDeTeste }).__veredaLerCamadaEmTeste;

function avisar(): void {
  for (const f of ouvintes) f();
}

export function ouvirCamadas(f: () => void): () => void {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
}

export function descritorDaCamada(caminho: string): ArquivoPublicado | null {
  return (CAMADAS_PUBLICADAS as Record<string, ArquivoPublicado | undefined>)[caminho] ?? null;
}

function lerEmTeste(caminho: string, leitor: LeitorDeTeste): Entrada {
  let entrada: Entrada;
  try {
    entrada = { estado: "pronta", valor: leitor(caminho) };
  } catch (e) {
    entrada = { estado: "falhou", erro: e instanceof Error ? e : new Error(String(e)) };
  }
  entradas.set(caminho, entrada);
  return entrada;
}

/** O conteúdo já carregado do arquivo de camada. Lança `CamadaPendente` se a tela não esperou, ou o erro da carga. */
export function lerCamada(caminho: string): unknown {
  let e = entradas.get(caminho);
  const leitor = leitorDeTeste();
  if (!e && leitor) e = lerEmTeste(caminho, leitor);
  if (e?.estado === "pronta") return e.valor;
  if (e?.estado === "falhou") throw e.erro;
  throw new CamadaPendente(caminho);
}

/** O arquivo não está em memória: ainda não carregou, ou a carga falhou. Quem guarda "sem dado" em cache não pode guardar isso. */
export function faltaCamada(e: unknown): e is CamadaPendente | CamadaIndisponivel {
  return e instanceof CamadaPendente || e instanceof CamadaIndisponivel;
}

/** Estado conjunto: `falhou` se algum falhou, `carregando` se algum ainda não chegou, `pronta` se todos estão em memória. */
export function estadoDasCamadas(caminhos: readonly string[]): EstadoDasCamadas {
  let carregando = false;
  const leitor = leitorDeTeste();
  for (const c of caminhos) {
    let e = entradas.get(c);
    if (!e && leitor) e = lerEmTeste(c, leitor);
    if (e?.estado === "falhou") return "falhou";
    if (e?.estado !== "pronta") carregando = true;
  }
  return carregando ? "carregando" : "pronta";
}

function carregar(caminho: string): Promise<void> {
  const atual = entradas.get(caminho);
  if (atual?.estado === "pronta") return Promise.resolve();
  if (atual?.estado === "carregando") return atual.promessa;
  const leitor = leitorDeTeste();
  if (leitor) {
    const e = lerEmTeste(caminho, leitor);
    avisar();
    return e.estado === "falhou" ? Promise.reject(e.erro) : Promise.resolve();
  }
  const descritor = descritorDaCamada(caminho);
  const promessa = (async () => {
    try {
      if (!descritor) throw new CamadaIndisponivel(caminho, "fora do manifesto publicado; rode scripts/dados/publicar-camadas.mjs");
      const valor = await buscarArquivoDeCamada(caminho, descritor);
      entradas.set(caminho, { estado: "pronta", valor });
    } catch (e) {
      const erro = e instanceof CamadaIndisponivel ? e : new CamadaIndisponivel(caminho, e instanceof Error ? e.message : String(e));
      entradas.set(caminho, { estado: "falhou", erro });
      throw erro;
    } finally {
      avisar();
    }
  })();
  entradas.set(caminho, { estado: "carregando", promessa });
  avisar();
  return promessa;
}

/**
 * Carrega (uma vez) os arquivos pedidos. Um que falhou antes é tentado de novo. Rejeita com o primeiro erro, depois de
 * todos terminarem: o que chegou fica em memória.
 */
export async function garantirCamadas(caminhos: readonly string[]): Promise<void> {
  const unicos = [...new Set(caminhos)];
  for (const c of unicos) if (entradas.get(c)?.estado === "falhou") entradas.delete(c);
  const resultados = await Promise.allSettled(unicos.map(carregar));
  const falha = resultados.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (falha) throw falha.reason;
}

/**
 * Guarda no aparelho, em segundo plano, o que uma tela vai pedir depois (na web, no Cache Storage, sem ler para a
 * memória; no nativo já está no aplicativo). Não espera nem avisa de falha: a tela que precisar mostra o estado.
 */
export function adiantarCamadas(caminhos: readonly string[]): void {
  if (leitorDeTeste()) return;
  for (const c of caminhos) {
    const d = descritorDaCamada(c);
    if (d && !entradas.has(c)) void aquecerArquivoDeCamada(c, d).catch(() => undefined);
  }
}

/** Só para testes: esquece o que foi carregado. */
export function esquecerCamadas(): void {
  entradas.clear();
  avisar();
}
