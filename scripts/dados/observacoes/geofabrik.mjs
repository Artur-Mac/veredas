// Fonte HTML estruturada (VE02.02): a listagem do Geofabrik, de onde se escolhe um extrato OSM datado e reproduzível
// em vez do `-latest` móvel. Lê só o que a página publica (nome do arquivo datado, presença do .md5, "data up to" e
// tamanho do -latest). Página sem nenhum extrato datado é falha (HTML de erro ou layout mudou), nunca "zero extratos".
import { createHash } from "node:crypto";
import { esquemaObservacao } from "../../../src/dados/observacao.ts";

export const ANALISADOR_GEOFABRIK = { nome: "geofabrik_listagem_html", versao: "1" };

/** Arquivos datados `<regiao>-AAMMDD.osm.pbf` da listagem do diretório, com indicação de .md5 publicado. */
export function lerListagem(html, regiao) {
  if (!/<html/i.test(html) || !/<a\s/i.test(html)) return null;
  const re = new RegExp(`href="(${regiao}-(\\d{6})\\.osm\\.pbf)"`, "g");
  const md5 = new Set([...html.matchAll(new RegExp(`href="(${regiao}-\\d{6}\\.osm\\.pbf)\\.md5"`, "g"))].map((m) => m[1]));
  const vistos = new Map();
  for (const m of html.matchAll(re)) {
    const [, arquivo, aammdd] = m;
    const data = `20${aammdd.slice(0, 2)}-${aammdd.slice(2, 4)}-${aammdd.slice(4, 6)}`;
    vistos.set(arquivo, { arquivo, data, md5Publicado: md5.has(arquivo) });
  }
  return [...vistos.values()].sort((a, b) => a.data.localeCompare(b.data));
}

/** "contains all OSM data up to 2026-11-13T21:22:20Z. File size: 424 MB" da página da região. */
export function lerPaginaDaRegiao(html) {
  const texto = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const ate = /contains all OSM data up to (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/.exec(texto)?.[1] ?? null;
  // A frase do -latest.osm.pbf é a única com "contains all OSM data up to"; o tamanho vem logo depois.
  const tamanho = /contains all OSM data up to \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\.\s*File size:\s*([\d.]+)\s*MB/.exec(texto)?.[1] ?? null;
  return { dadosAte: ate, tamanhoDoLatestMB: tamanho === null ? null : Number(tamanho) };
}

/** O extrato datado mais recente que tem .md5 publicado e data ≤ `limite` (AAAA-MM-DD). */
export function escolherExtrato(lista, limite) {
  const elegiveis = lista.filter((x) => x.md5Publicado && x.data <= limite);
  return elegiveis.at(-1) ?? null;
}

export function observacoesDaListagem(lista, { fonte, url, snapshotSha256, recuperadoEm }) {
  return lista.map((x) => esquemaObservacao.parse({
    id: createHash("sha256").update(`${fonte}|${snapshotSha256}|${x.arquivo}`).digest("hex").slice(0, 24),
    fonte, snapshotSha256, localizador: `href=${x.arquivo}`,
    propriedade: "osm.extrato_datado_disponivel", valor: x.arquivo, unidade: null, estadoDoValor: "conhecido",
    entidades: [{ tipo: "area", id: "geofabrik:nordeste", metodo: "texto_da_fonte" }], geometria: null,
    tempos: { evento: null, precisaoDoEvento: "nenhuma", administrativo: null, publicado: x.data, recuperado: recuperadoEm },
    trecho: `${x.arquivo}${x.md5Publicado ? " (+ .md5)" : ""} em ${url}`.slice(0, 300),
    metodo: ANALISADOR_GEOFABRIK,
  }));
}
