// "Não é este (ver vizinho)": a ordem em que a tela mostra os prédios a cada toque. Funções puras: recebem o que
// está na tela, a lista de candidatos e o índice do bairro, e devolvem o próximo prédio e o novo estado do percurso.
// Primeiro os candidatos, do mais ao menos provável; acabados eles, os edifícios do índice mais próximos do prédio
// em que a lista terminou, por distância, até 5, sem repetir nenhum que a pessoa já viu.
import type { Edificio } from "../../dados/contratos";
import { distanciaEmMetros } from "./projecao";

/** Quantos vizinhos por distância a tela mostra depois dos candidatos. */
export const VIZINHOS_POR_PERCURSO = 5;

export type Percurso = {
  /** Ids dos prédios que já estiveram na tela neste percurso. */
  vistos: readonly string[];
  /** Vizinhos por distância ainda por mostrar, já na ordem. `null` enquanto ainda há candidatos. */
  fila: readonly string[] | null;
};

export const PERCURSO_INICIAL: Percurso = { vistos: [], fila: null };

export type Passo = {
  /** O prédio a mostrar. `null` quando o índice não tem outro prédio além do que já está na tela. */
  edificio: Edificio | null;
  percurso: Percurso;
};

/**
 * Edifícios do índice mais próximos de `base`, do mais perto ao mais longe, até `quantos`. Nunca devolve o próprio
 * `base` nem os ids de `excluir`. Distância entre os centros em metros; empate fica com o menor `id`.
 */
export function maisProximos(
  base: Edificio,
  edificios: readonly Edificio[],
  excluir: ReadonlySet<string> = new Set(),
  quantos = VIZINHOS_POR_PERCURSO,
): Edificio[] {
  return edificios
    .filter((e) => e.id !== base.id && !excluir.has(e.id))
    .map((e) => ({ e, distancia: distanciaEmMetros(base.centro, e.centro) }))
    .sort((a, b) => a.distancia - b.distancia || (a.e.id < b.e.id ? -1 : a.e.id > b.e.id ? 1 : 0))
    .slice(0, quantos)
    .map((par) => par.e);
}

/**
 * A pessoa escolheu outro prédio no mapa ou na busca: o que estava na tela já foi visto, e os vizinhos por
 * distância têm de ser calculados de novo a partir do prédio escolhido.
 */
export function aposEscolha(percurso: Percurso, idQueEstavaNaTela: string | null): Percurso {
  const jaVisto = idQueEstavaNaTela === null || percurso.vistos.includes(idQueEstavaNaTela);
  return { vistos: jaVisto ? percurso.vistos : [...percurso.vistos, idQueEstavaNaTela], fila: null };
}

/**
 * Próximo prédio ao tocar em "Não é este". Com candidatos ainda não vistos, o próximo deles na ordem de `candidatos`.
 * Sem eles (ou se só havia um), os `quantos` edifícios mais próximos de `atual`, um por toque. Mostrados todos, o
 * percurso recomeça do primeiro candidato (ou do primeiro prédio visto, se não há candidatos).
 */
export function proximoDoPercurso(
  atual: Edificio,
  candidatos: readonly Edificio[],
  edificios: readonly Edificio[],
  percurso: Percurso = PERCURSO_INICIAL,
  quantos = VIZINHOS_POR_PERCURSO,
): Passo {
  const vistos = percurso.vistos.includes(atual.id) ? percurso.vistos : [...percurso.vistos, atual.id];
  let fila = percurso.fila;

  if (fila === null) {
    const proximoCandidato = candidatos.find((c) => !vistos.includes(c.id));
    if (proximoCandidato) return { edificio: proximoCandidato, percurso: { vistos, fila: null } };
    fila = maisProximos(atual, edificios, new Set(vistos), quantos).map((e) => e.id);
  }

  const porId = new Map(edificios.map((e) => [e.id, e]));
  while (fila.length > 0) {
    const [id, ...resto] = fila;
    fila = resto;
    const vizinho = id === undefined || vistos.includes(id) ? undefined : porId.get(id);
    if (vizinho) return { edificio: vizinho, percurso: { vistos, fila } };
  }

  const primeiroVisto = vistos[0] === undefined ? undefined : porId.get(vistos[0]);
  const inicio = candidatos[0] ?? primeiroVisto;
  if (!inicio || inicio.id === atual.id) return { edificio: null, percurso: { vistos, fila: [] } };
  return { edificio: inicio, percurso: { vistos: [inicio.id], fila: null } };
}
