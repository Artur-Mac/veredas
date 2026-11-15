// A volta à noite e o lado do barulho (VE08): só redige o que scripts/dados/noite/rodar-noite.mjs calculou. Primeiro o que
// muda para a pessoa (ponto, minutos, travessias, último ônibus; lado que dá para a via); os registros vêm depois.
// Sem nota de segurança, sem decibéis, sem aeroporto (o plano oficial ainda não foi georreferenciado e conferido).
import { z } from "zod";
import { lerCamada } from "../camadas";
import { ARQUIVOS_DA_NOITE, VERSAO_DA_NOITE } from "./noiteGerado";

/** O arquivo de camada do bairro (fora do bundle, D036), ou null fora do piloto. */
export const arquivoDaNoite = (bairro: string | null | undefined): string | null => (bairro ? ARQUIVOS_DA_NOITE[bairro] ?? null : null);

const esquema = z.strictObject({
  versao: z.string(), diaUtil: z.string(), fim156: z.string(), inicio156: z.string(),
  paradas: z.array(z.strictObject({ nome: z.string(), ultima: z.number().int().min(22 * 3600).max(48 * 3600) })),
  predios: z.record(z.string(), z.strictObject({
    v: z.strictObject({
      p: z.number().int().nonnegative(), m: z.number().nonnegative(), t: z.number().int().nonnegative(),
      alt: z.strictObject({ m: z.number(), travessias: z.number().int() }).nullable(),
      luz: z.tuple([z.number().int(), z.number().int(), z.number().int(), z.number().int()]),
      ruas: z.array(z.tuple([z.string(), z.number(), z.number().int(), z.number().int(), z.array(z.number().int())])),
    }).optional(),
    r: z.strictObject({ lado: z.string(), m: z.number(), rua: z.string().nullable(), partidas: z.number().int().nullable() }).optional(),
    s: z.strictObject({ lado: z.string(), m: z.number(), desde: z.string().nullable() }).optional(),
  })),
});
export type NoiteDoBairro = z.infer<typeof esquema>;

const cache = new Map<string, NoiteDoBairro | null>();
export function noiteDoBairro(bairro: string | null | undefined): NoiteDoBairro | null {
  if (!bairro) return null;
  if (!cache.has(bairro)) {
    const c = arquivoDaNoite(bairro);
    const p = c ? esquema.safeParse(lerCamada(c)) : null;
    cache.set(bairro, p?.success && p.data.versao === VERSAO_DA_NOITE ? p.data : null);
  }
  return cache.get(bairro) ?? null;
}

const DIRS = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"];
const oposto = (d: string) => DIRS[(DIRS.indexOf(d) + 4) % 8] ?? d;
const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const hora = (s: number) => { const x = s % 86400; return `${String(Math.floor(x / 3600)).padStart(2, "0")}:${String(Math.floor((x % 3600) / 60)).padStart(2, "0")}`; };
const minutos = (m: number) => Math.max(1, Math.round(m / 1.2 / 60));
const lista = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}`);

export type VoltaANoite = { frase: string; detalhes: string[] };
/** A volta para casa chegando de ônibus/metrô depois das 22h num dia útil. */
export function voltaANoite(bairro: string | null | undefined, predioId: string | null | undefined): VoltaANoite | null {
  const n = noiteDoBairro(bairro);
  const v = predioId ? n?.predios[predioId]?.v : undefined;
  if (!n || !v) return null;
  const parada = n.paradas[v.p]!;
  const trav = v.t === 0 ? "sem atravessar via principal" : v.t === 1 ? "com 1 travessia de via principal" : `com ${v.t} travessias de via principal`;
  // Depois das 2h (26h do dia de serviço) já são as linhas da madrugada: dizer isso em vez de chamar de "último".
  const ultimo = parada.ultima > 26 * 3600 ? `Há chegada programada lá também de madrugada (a última, às ${hora(parada.ultima)}).` : `O último ônibus programado chega lá às ${hora(parada.ultima)}.`;
  const frase = `Chegando de ônibus depois das 22h num dia útil: o ponto mais perto com chegada nesse horário é o ${parada.nome}, a ${minutos(v.m)} min a pé, ${trav}. ${ultimo}`;
  const [postes, maiorSem, pedidos, abertos] = v.luz;
  const detalhes: string[] = [];
  detalhes.push(`Postes cadastrados a até 25 m do caminho: ${postes}${maiorSem >= 30 ? `; o maior trecho sem poste cadastrado tem ${maiorSem} m` : ""}. ` +
    `O cadastro diz onde há poste, não se a lâmpada acende: entre ${dataBr(n.inicio156)} e ${dataBr(n.fim156)}, ` +
    (pedidos === 0 ? "nenhum pedido de lâmpada apagada foi feito ao 156 a até 25 m do caminho." :
      `${pedidos === 1 ? "houve 1 pedido" : `houve ${pedidos} pedidos`} de lâmpada apagada ao 156 a até 25 m do caminho${abertos ? ` (${abertos} sem atendimento até ${dataBr(n.fim156)})` : ", todos atendidos"}.`));
  if (v.alt) detalhes.push(`Há um trajeto de tamanho parecido (${Math.round(v.alt.m - v.m)} m a mais) com ${v.alt.travessias === 0 ? "nenhuma travessia" : v.alt.travessias === 1 ? "1 travessia" : `${v.alt.travessias} travessias`} de via principal.`);
  if (v.ruas.length) {
    const partes = v.ruas.map(([rua, , n2, fatais, anos]) => `${rua} (${n2}${fatais ? `, ${fatais} com morte` : ""}; ${lista(anos.map(String))})`);
    detalhes.push(`Atropelamentos registrados pela CTTU em 2022–2024 nas ruas que o caminho usa: ${lista(partes)}. O registro dá a rua, não o ponto do caminho nem a hora.`);
  }
  detalhes.push("Travessias estimadas pela rede do mapa (cruzamentos de via principal e faixas mapeadas). Isto não é uma avaliação de segurança da rua.");
  return { frase, detalhes };
}

export type LadoDoBarulho = { titulo: string; frase: string; pergunta: string; nota: string };
/** De que lado do prédio vem o barulho de via principal (≤ 80 m) e de local com LUSE vigente (≤ 150 m). */
export function ladoDoBarulho(bairro: string | null | undefined, predioId: string | null | undefined): LadoDoBarulho | null {
  const n = noiteDoBairro(bairro);
  const p = predioId ? n?.predios[predioId] : undefined;
  if (!p || (!p.r && !p.s)) return null;
  const partes: string[] = [];
  let pergunta = "";
  if (p.r) {
    const via = p.r.rua ?? "uma via principal";
    partes.push(`O lado ${p.r.lado} do prédio dá para ${p.r.rua ? `a ${via}` : via}, via principal a ${p.r.m} m${p.r.partidas ? `, com ${p.r.partidas} partidas de ônibus num dia útil no ponto mais perto` : ""}. ` +
      `Para comparar o barulho, visite num dia útil entre 17h e 19h e ouça também o lado ${oposto(p.r.lado)}.`);
    pergunta = `Barulho: ouvir o lado ${p.r.lado} (${via}) num dia útil por volta das 18h e comparar com o lado ${oposto(p.r.lado)}.`;
  }
  if (p.s) {
    partes.push(`A ${p.s.m} m, para o ${p.s.lado}, há um local com licença ambiental de uso sonoro (LUSE) vigente; a licença não diz horário nem volume, então vale passar numa sexta ou num sábado à noite.`);
    if (!pergunta) pergunta = `Barulho: passar numa sexta ou sábado à noite e ouvir o lado ${p.s.lado}, onde há um local com licença de som a ${p.s.m} m.`;
  }
  const titulo = p.r && p.s ? "Rua movimentada e som licenciado." : p.r ? "A via movimentada mais perto." : "Som licenciado por perto.";
  return { titulo, frase: partes.join(" "), pergunta, nota: "Sem medição de decibéis. Via principal do mapa (OpenStreetMap), partidas do GTFS fixado e LUSE do Licenciamento Ambiental da Prefeitura. O aeroporto não entra: o plano oficial de ruído ainda não foi georreferenciado e conferido." };
}
