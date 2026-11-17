// Coleta paginada do datastore CKAN (dados.recife.pe.gov.br) com estados honestos (VE02.02/VE02.04).
// Reusa o cliente HTTP do projeto (novas tentativas em 408/429/5xx, Retry-After limitado, sem cache aqui) e o
// planejador de páginas. HTTP 200 não é sucesso: corpo que não é JSON do CKAN, página repetida, página curta antes do
// total ou orçamento esgotado viram "falhou"/"parcial" com motivo, nunca cobertura completa.
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { get } from "../../../docs/dados/infra/scripts/http.mjs";
import { planejarPaginas } from "../paginacao.mjs";

const sha256 = (t) => createHash("sha256").update(t).digest("hex");

function motivoDoErro(e) {
  if (e?.status === 401 || e?.status === 403) return "acesso_negado";
  if (e?.status === 429) return "limite_de_taxa";
  if (typeof e?.status === "number") return "erro_http";
  return "rede";
}

/** Corpo do datastore_search ou null quando não é o JSON esperado (HTML de erro, página de login, JSON de falha). */
export function lerPaginaCkan(texto) {
  if (!/^\s*\{/.test(texto)) return null;
  let j;
  try {
    j = JSON.parse(texto);
  } catch {
    return null;
  }
  if (j?.success !== true || !Array.isArray(j?.result?.records) || !Number.isInteger(j?.result?.total)) return null;
  return { total: j.result.total, registros: j.result.records };
}

/**
 * Lê um recurso do datastore até o total declarado. `orcamento`: máximo de requisições nesta execução.
 * Devolve { registros, paginasBrutas, requisicoes, bytes, declarados, erro, paginasFaltando, sha256 } — `sha256` é do
 * envelope bruto (concatenação canônica das páginas), para arquivar e reproduzir.
 */
export async function coletarDatastore({ base, recurso, campos, limite = 500, orcamento = 400, opcoesHttp = {} }) {
  // Lista branca obrigatória: o recurso pode publicar colunas que não devem ser coletadas (ex.: medidas do imóvel na
  // Defesa Civil). Sem `campos`, a coleta não começa.
  if (!Array.isArray(campos) || campos.length === 0) throw new Error("coletarDatastore exige a lista branca de campos.");
  const filtro = `&fields=${encodeURIComponent(["_id", ...campos].join(","))}`;
  const url = (off) => `${base.replace(/\/$/, "")}/api/3/action/datastore_search?resource_id=${encodeURIComponent(recurso)}&limit=${limite}&offset=${off}${filtro}`;
  const r = { registros: [], paginasBrutas: [], requisicoes: 0, bytes: 0, declarados: null, erro: null, paginasFaltando: 0 };
  const buscar = async (off) => {
    if (r.requisicoes >= orcamento) {
      r.erro = "orcamento_esgotado";
      return null;
    }
    r.requisicoes += 1;
    try {
      const { text } = await get(url(off), { cache: false, retries: 2, timeoutMs: 45_000, ...opcoesHttp });
      r.bytes += Buffer.byteLength(text);
      r.paginasBrutas.push({ offset: off, texto: text });
      const pagina = lerPaginaCkan(text);
      if (!pagina) r.erro = "corpo_nao_e_dados";
      return pagina;
    } catch (e) {
      r.erro = motivoDoErro(e);
      return null;
    }
  };

  const primeira = await buscar(0);
  if (!primeira) return fechar(r);
  r.declarados = primeira.total;
  let plano;
  try {
    plano = planejarPaginas(primeira.total, limite, primeira.registros);
  } catch {
    r.erro = "pagina_faltando";
    r.registros.push(...primeira.registros);
    return fechar(r);
  }
  r.registros.push(...primeira.registros);
  const vistos = new Set(primeira.registros.map((x) => x._id));
  for (const off of plano.offsets.slice(1)) {
    const pagina = await buscar(off);
    if (!pagina) {
      r.paginasFaltando = plano.offsets.length - plano.offsets.indexOf(off);
      break;
    }
    const esperado = Math.min(limite, primeira.total - off);
    if (pagina.registros.length > 0 && pagina.registros.every((x) => vistos.has(x._id))) {
      r.erro = "pagina_repetida";
      r.paginasFaltando = plano.offsets.length - plano.offsets.indexOf(off);
      break;
    }
    if (pagina.registros.length < esperado) {
      r.paginasFaltando += 1;
    }
    for (const x of pagina.registros) {
      if (!vistos.has(x._id)) {
        vistos.add(x._id);
        r.registros.push(x);
      }
    }
  }
  return fechar(r);
}

function fechar(r) {
  const envelope = r.paginasBrutas.map((p) => `${p.offset}\n${p.texto}`).join("\n␞\n");
  return { ...r, sha256: envelope ? sha256(envelope) : null, envelope };
}
