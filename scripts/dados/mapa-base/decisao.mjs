// Decisões do pipeline do mapa-base que não dependem de dado: que bairros entram nesta execução e o texto do módulo
// gerado. Sem import (tests/mapa-base.test.ts avalia este arquivo tirando os `export`, como faz com outros núcleos).

/** Comparação por unidade de código (sem localeCompare: o resultado não depende do sistema). Três vias. */
export function compararTexto(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Quais bairros esta execução gera e publica.
 * - `todos`: todos os conhecidos; troca a versão inteira.
 * - `pedidos` (de --bairros): cada um tem de ser conhecido. Se a publicação tiraria bairros que já estão publicados
 *   (`publicados`), recusa com erro, a não ser com `substituir`. Para acrescentar um bairro, liste os publicados mais ele.
 * - `saida` (--saida): gera numa pasta à parte, sem tocar no publicado; nada é tirado, então não há o que recusar.
 * Devolve a lista ordenada (por código), sem repetição.
 */
export function decidirBairros({ todos = false, pedidos = [], substituir = false, saida = false, publicados = [], conhecidos }) {
  const conhecido = new Set(conhecidos);
  if (todos && pedidos.length) throw new Error("Use --todos ou --bairros, não os dois.");
  const lista = todos ? [...conhecido] : [...new Set(pedidos)];
  if (!lista.length) throw new Error("Use --bairros a,b ou --todos.");
  const desconhecidos = lista.filter((s) => !conhecido.has(s));
  if (desconhecidos.length) throw new Error(`Bairro desconhecido: ${desconhecidos.join(", ")}`);
  lista.sort(compararTexto);
  if (!todos && !saida && !substituir) {
    const pedido = new Set(lista);
    const tirados = [...publicados].filter((s) => !pedido.has(s)).sort(compararTexto);
    if (tirados.length) {
      throw new Error(
        `Recusado: publicar só ${lista.join(", ")} tiraria ${tirados.length} bairro(s) já publicado(s) (${tirados.slice(0, 8).join(", ")}${tirados.length > 8 ? ", …" : ""}). ` +
          "Inclua-os em --bairros, use --todos, gere em --saida <pasta> ou passe --substituir para trocar a publicação de propósito.",
      );
    }
  }
  return lista;
}

/** Caixa [oeste, sul, leste, norte] em graus arredondada para fora a 1e-5 grau. */
export function caixaEmGraus(c) {
  return [Math.floor(c[0] * 1e5) / 1e5, Math.floor(c[1] * 1e5) / 1e5, Math.ceil(c[2] * 1e5) / 1e5, Math.ceil(c[3] * 1e5) / 1e5];
}

/**
 * O texto de src/dados/recife/mapaBaseGerado.ts. `caixas`: slug → caixa em graus do polígono do bairro. Sai igual
 * qualquer que seja a ordem de `bairros` (ordena por código).
 */
export function textoDoModulo({ versao, indice, bairros, caixas, fontes }) {
  const lista = [...bairros].sort(compararTexto);
  return (
    "// Gerado por scripts/dados/construir-mapa-base.mjs. Não edite à mão. Troca atômica depois de gravar os arquivos.\n" +
    "// Mapa-base por bairro (fora do bundle, D036): bairro → arquivo de camada; caixa [oeste, sul, leste, norte] em graus do\n" +
    "// polígono do bairro; o índice usado para marcar os lotes de prédios conhecidos; as fontes para \"Sobre os dados\".\n" +
    `export const VERSAO_DO_MAPA_BASE_GERADO = ${JSON.stringify(versao)};\n` +
    `export const INDICE_DO_MAPA_BASE = ${JSON.stringify(indice)};\n` +
    `export const ARQUIVO_DA_CIDADE: string = ${JSON.stringify(`recife/mapa-base/${versao}/cidade.json`)};\n` +
    `export const ARQUIVOS_DO_MAPA_BASE: Record<string, string> = {\n${lista.map((s) => `  ${JSON.stringify(s)}: ${JSON.stringify(`recife/mapa-base/${versao}/${s}.json`)},`).join("\n")}\n};\n` +
    `export const CAIXAS_DO_MAPA_BASE: Record<string, readonly [number, number, number, number]> = {\n${lista.map((s) => `  ${JSON.stringify(s)}: [${caixaEmGraus(caixas[s]).join(", ")}],`).join("\n")}\n};\n` +
    "export type FonteDoMapaBase = { recurso: string; nome: string; conjunto: string; licenca: string; lastModified: string | null; sha256: string; bytes: number };\n" +
    `export const FONTES_DO_MAPA_BASE: readonly FonteDoMapaBase[] = ${JSON.stringify(fontes, null, 2)};\n`
  );
}
