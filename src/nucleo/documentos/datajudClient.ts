import type { EpistemicTag } from "../contratosCanonicos";

/**
 * Conector Determinístico DataJud (API Pública CNJ — api_publica_tjpe/_search e api_publica_trf5/_search):
 * - Validação ISO 7064 MOD 97-10 do número único de 20 dígitos (Resolução CNJ nº 65/2008).
 * - Paginação baseada em `search_after` sobre o CNPJ do condomínio ou da construtora (escopo público PJ).
 */

export const DATAJUD_ENDPOINTS = {
  tjpe: "https://api-publica.datajud.cnj.jus.br/api_publica_tjpe/_search",
  trf5: "https://api-publica.datajud.cnj.jus.br/api_publica_trf5/_search",
} as const;

export type TribunalDatajud = keyof typeof DATAJUD_ENDPOINTS;

export type ProcessoDatajudNormalizado = {
  numeroCnj: string;
  tribunal: TribunalDatajud;
  classeCodigo: number | null;
  classeNome: string | null;
  assuntos: string[];
  dataAjuizamento: string | null;
  ultimaMovimentacaoIso: string | null;
  categoriaVereda: "execucao_cota_condominial" | "acao_estrutural_ou_vicio" | "trabalhista_ou_fiscal" | "outro";
  sortCursor: (string | number)[];
};

/** Validação ISO 7064 MOD 97-10 de processo CNJ: `NNNNNNN-DD.AAAA.J.TR.OOOO` (20 dígitos). */
export function validarNumeroProcessoCnj(numero: string): { valido: boolean; limpo20: string | null } {
  const dig = numero.replace(/\D+/g, "");
  if (dig.length !== 20) return { valido: false, limpo20: null };
  // Resolução CNJ 65/2008: RRRRRRRRRRRRRRR + DD na ponta (NNNNNNN AAAA J TR OOOO DD) mod 97 === 1
  const n7 = dig.slice(0, 7);
  const dv2 = dig.slice(7, 9);
  const resto11 = dig.slice(9, 20);
  const valido = BigInt(`${n7}${resto11}${dv2}`) % 97n === 1n;
  return { valido, limpo20: dig };
}

export function gerarDvProcessoCnj(n7: string, aaaa4: string, j1: string, tr2: string, oooo4: string): string {
  const base18 = `${n7.padStart(7, "0")}${aaaa4.padStart(4, "0")}${j1}${tr2.padStart(2, "0")}${oooo4.padStart(4, "0")}`;
  const dv = Number(98n - (BigInt(`${base18}00`) % 97n));
  return `${base18.slice(0, 7)}-${String(dv).padStart(2, "0")}.${base18.slice(7, 11)}.${base18.slice(11, 12)}.${base18.slice(12, 14)}.${base18.slice(14, 18)}`;
}

export function construirCorpoBuscaDatajud(opts: {
  termoOuCnpj: string;
  tamanhoPagina?: number;
  searchAfter?: (string | number)[] | null;
}): Record<string, unknown> {
  const query: Record<string, unknown> = {
    size: opts.tamanhoPagina ?? 50,
    sort: [{ "@timestamp": "asc" }, { "numeroProcesso.keyword": "asc" }],
    query: {
      bool: {
        should: [
          { match_phrase: { "dadosBasicos.nomeParte": opts.termoOuCnpj } },
          { match: { "dadosBasicos.documento": opts.termoOuCnpj.replace(/\D+/g, "") } },
          { match: { "numeroProcesso": opts.termoOuCnpj.replace(/\D+/g, "") } },
        ],
        minimum_should_match: 1,
      },
    },
  };
  if (opts.searchAfter && opts.searchAfter.length > 0) {
    query.search_after = opts.searchAfter;
  }
  return query;
}

export function classificarAssuntoDatajud(
  classeNome: string | null,
  assuntos: readonly string[],
): ProcessoDatajudNormalizado["categoriaVereda"] {
  const txt = `${classeNome ?? ""} ${assuntos.join(" ")}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/(despesas condominiais|cota condominial|condominio em edilicio|execucao de titulo extrajudicial)/.test(txt)) {
    return "execucao_cota_condominial";
  }
  if (/(vicio de construcao|defeito estrutural|obrigacao de fazer|interdicao|demolicao|desabamento|seguro habitacional)/.test(txt)) {
    return "acao_estrutural_ou_vicio";
  }
  if (/(execucao fiscal|reclamacao trabalhista|fgts)/.test(txt)) {
    return "trabalhista_ou_fiscal";
  }
  return "outro";
}

export type RespostaEsHit = {
  _source?: {
    numeroProcesso?: string;
    classe?: { codigo?: number; nome?: string };
    assuntos?: { nome?: string }[];
    dataAjuizamento?: string;
    dataHoraUltimaAtualizacao?: string;
  };
  sort?: (string | number)[];
};

export async function consultarDatajudPaginado(
  tribunal: TribunalDatajud,
  termoOuCnpj: string,
  fetchPost: (url: string, bodyJson: string) => Promise<{ hits?: { hits?: RespostaEsHit[] } }>,
  maxPaginas = 10,
): Promise<{
  processos: ProcessoDatajudNormalizado[];
  paginas: number;
  epistemicTag: EpistemicTag;
}> {
  const url = DATAJUD_ENDPOINTS[tribunal];
  const processos: ProcessoDatajudNormalizado[] = [];
  let cursor: (string | number)[] | null = null;
  let paginas = 0;

  while (paginas < maxPaginas) {
    const corpo = construirCorpoBuscaDatajud({ termoOuCnpj, tamanhoPagina: 50, searchAfter: cursor });
    const resp = await fetchPost(url, JSON.stringify(corpo));
    const hits = resp.hits?.hits ?? [];
    paginas += 1;
    if (hits.length === 0) break;

    for (const h of hits) {
      const num = h._source?.numeroProcesso ?? "";
      const assuntos = (h._source?.assuntos ?? []).map((a) => a.nome ?? "").filter(Boolean);
      const classeNome = h._source?.classe?.nome ?? null;
      processos.push({
        numeroCnj: num,
        tribunal,
        classeCodigo: h._source?.classe?.codigo ?? null,
        classeNome,
        assuntos,
        dataAjuizamento: h._source?.dataAjuizamento ?? null,
        ultimaMovimentacaoIso: h._source?.dataHoraUltimaAtualizacao ?? null,
        categoriaVereda: classificarAssuntoDatajud(classeNome, assuntos),
        sortCursor: h.sort ?? [],
      });
    }

    const lastSort = hits[hits.length - 1]?.sort;
    if (!lastSort || hits.length < 50) break;
    cursor = lastSort;
  }

  return {
    processos,
    paginas,
    epistemicTag: "registro_oficial",
  };
}
