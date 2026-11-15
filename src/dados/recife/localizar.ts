// Entrada única do Explorar (15/11/2026): o que a pessoa digita é um link de anúncio, ou uma busca por prédio, rua ou
// bairro no cadastro; "Usar minha localização agora" acha o prédio do cadastro mais perto do aparelho. Puro: quem chama
// baixa as partições (D036) dos bairros que `bairrosDaBusca`/`bairrosNoPonto` devolvem e passa os edifícios.
import type { Edificio } from "../contratos";
import { distanciaMetros } from "../geo";
import { BAIRROS_DO_RECIFE, eCoberto, type SlugCoberto } from "./bairros";
import { buscarPorEndereco, normalizar } from "./buscar";
import { CAIXAS_DOS_BAIRROS } from "./caixasDosBairros";

/** Os seis bairros do piloto: a busca sem bairro no texto procura neles. */
export const BAIRROS_DO_PILOTO = ["boa-viagem", "gracas", "espinheiro", "madalena", "casa-forte", "aflitos"] as const;

export type Entrada = { tipo: "vazia" } | { tipo: "link"; url: string } | { tipo: "link_invalido"; motivo: string } | { tipo: "busca"; texto: string };

/** Link (com ou sem https://, de portal) ou texto de busca. */
export function lerEntrada(bruto: string): Entrada {
  const t = bruto.trim();
  if (!t) return { tipo: "vazia" };
  const pareceLink = /^https?:\/\//i.test(t) || /^(www\.)?[a-z0-9-]+\.(com|net|org)(\.br)?\//i.test(t);
  if (!pareceLink) return { tipo: "busca", texto: t };
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".")) return { tipo: "link_invalido", motivo: "Insira um link válido com https:// ou http://." };
    return { tipo: "link", url: u.href };
  } catch {
    return { tipo: "link_invalido", motivo: "Link inválido. Confira o endereço digitado." };
  }
}

const NOMES = BAIRROS_DO_RECIFE.filter((b) => eCoberto(b.slug))
  .map((b) => ({ slug: b.slug as SlugCoberto, nome: normalizar(b.nome) }))
  .sort((a, b) => b.nome.length - a.nome.length);

/** Bairros cobertos citados no texto (nome inteiro, sem acento), do nome mais longo ao mais curto. */
export function bairrosCitados(texto: string): SlugCoberto[] {
  const n = ` ${normalizar(texto)} `;
  const achados: SlugCoberto[] = [];
  let resto = n;
  for (const b of NOMES) {
    if (resto.includes(` ${b.nome} `)) {
      achados.push(b.slug);
      resto = resto.replace(` ${b.nome} `, " ");
    }
  }
  return achados;
}

/** Onde procurar: os bairros citados; sem bairro no texto, os do piloto. */
export function bairrosDaBusca(texto: string): { bairros: SlugCoberto[]; citados: boolean } {
  const citados = bairrosCitados(texto);
  return citados.length ? { bairros: citados, citados: true } : { bairros: BAIRROS_DO_PILOTO.filter(eCoberto), citados: false };
}

/** Texto sem os nomes de bairro citados (para casar rua e prédio). */
export function textoSemBairros(texto: string): string {
  let n = ` ${normalizar(texto)} `;
  for (const b of NOMES) n = n.replace(` ${b.nome} `, " ");
  return n.trim();
}

export type ResultadoDaBusca = { edificio: Edificio; motivo: "endereco_ou_nome" | "bairro" };

/**
 * Prédios para o texto, até 8: rua, número e nome do prédio (a mesma busca da confirmação); texto que é só o nome de um
 * bairro lista os prédios com mais unidades dele (para começar por algum).
 */
export function buscarNoCadastro(texto: string, edificiosPorBairro: ReadonlyMap<SlugCoberto, readonly Edificio[]>): ResultadoDaBusca[] {
  const semBairro = textoSemBairros(texto);
  const todos = [...edificiosPorBairro.values()].flat();
  if (!semBairro) {
    return todos.slice().sort((a, b) => b.unidades - a.unidades || (a.id < b.id ? -1 : 1)).slice(0, 8).map((edificio) => ({ edificio, motivo: "bairro" as const }));
  }
  return buscarPorEndereco(semBairro, todos).map((edificio) => ({ edificio, motivo: "endereco_ou_nome" as const }));
}

/** Bairros cuja caixa (centros dos prédios + 300 m) contém o ponto. */
export function bairrosNoPonto(lon: number, lat: number): SlugCoberto[] {
  return Object.entries(CAIXAS_DOS_BAIRROS)
    .filter(([slug, [o, s, l, n]]) => eCoberto(slug) && lon >= o && lon <= l && lat >= s && lat <= n)
    .map(([slug]) => slug as SlugCoberto);
}

export const RAIO_DA_LOCALIZACAO_M = 250;

/** O prédio do cadastro mais perto do ponto, até 250 m (centro do lote, em linha reta). */
export function predioMaisPerto(lon: number, lat: number, edificios: readonly Edificio[], raioM = RAIO_DA_LOCALIZACAO_M): { edificio: Edificio; distanciaM: number } | null {
  let melhor: { edificio: Edificio; distanciaM: number } | null = null;
  for (const e of edificios) {
    if (Math.abs(e.centro[0] - lon) > 0.004 || Math.abs(e.centro[1] - lat) > 0.004) continue;
    const d = distanciaMetros([lon, lat], e.centro);
    if (d <= raioM && (!melhor || d < melhor.distanciaM)) melhor = { edificio: e, distanciaM: Math.round(d) };
  }
  return melhor;
}
