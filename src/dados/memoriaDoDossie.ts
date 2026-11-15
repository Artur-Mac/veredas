// Junta, para um imóvel com prédio confirmado, as entradas do retrato da memória (VE09) a partir das bases já carregadas
// pelo app: anúncio, índice municipal (licenças e Defesa Civil da rua), essenciais (VE04) e volta à noite (VE08).
import type { AnaliseV2, Edificio } from "./contratos";
import { mudancasDesde, retrato, type Instantaneo, type Mudanca } from "./memoria";
import { indiceDoBairro } from "./recife/indice";
import { DIRETORIO_DO_INDICE } from "./recife/publicacaoGerada";
import { CATEGORIAS_DO_DIA, essenciaisDoPredio, nomeDe } from "./recife/essenciais";
import { VERSAO_DOS_ESSENCIAIS } from "./recife/essenciaisGerados";
import { noiteDoBairro } from "./recife/noite";
import { VERSAO_DO_TRANSITO } from "./recife/transitoGerado";
import type { SlugCoberto } from "./recife/bairros";

export function retratoDoDossie(a: AnaliseV2, predio: Edificio | null, em: string): Instantaneo {
  const fontes: Record<string, string> = { indice: DIRETORIO_DO_INDICE, essenciais: VERSAO_DOS_ESSENCIAIS, gtfs: VERSAO_DO_TRANSITO };
  let obras: Parameters<typeof retrato>[0]["obras"] = [];
  let defesaCivil: Parameters<typeof retrato>[0]["defesaCivil"] = null;
  let essenciais: Parameters<typeof retrato>[0]["essenciais"] = [];
  let noite: Parameters<typeof retrato>[0]["noite"] = null;
  if (predio) {
    try {
      const ix = indiceDoBairro(predio.bairro as SlugCoberto);
      obras = predio.obras150m.recentes.flatMap(([i, m]) => { const o = ix.obras[i]; return o ? [{ ...o, distanciaM: m }] : []; });
      const dc = ix.rua?.logradouros[predio.id.split("-")[0] ?? ""]?.defesaCivil;
      defesaCivil = dc ? { porAno: dc.porAno, ...(dc.acoesComunitarias !== undefined ? { acoesComunitarias: dc.acoesComunitarias } : {}) } : null;
    } catch { /* índice ilegível: o retrato fica sem essas linhas, nunca com valores inventados */ }
    const ess = essenciaisDoPredio(predio.bairro, predio.id);
    if (ess) essenciais = CATEGORIAS_DO_DIA.map((c) => {
      const x = ess.predio.c[c];
      if (!x) return { categoria: c, nome: null, minutos: null };
      const local = ess.pacote.locais[x.l];
      // Mesmo nome que o dossiê mostra (código de parada vira "Ponto de ônibus").
      return { categoria: c, nome: local ? nomeDe(local) : null, minutos: "min" in x ? Math.round(x.min) : null };
    });
    const v = noiteDoBairro(predio.bairro)?.predios[predio.id]?.v;
    const n = noiteDoBairro(predio.bairro);
    if (v && n) noite = { parada: n.paradas[v.p]!.nome, ultima: n.paradas[v.p]!.ultima };
  }
  return retrato({ em, fontes, declarados: a.declarados, obras, defesaCivil, ruaDoPredio: predio?.logradouro ?? null, essenciais, noite });
}

/** Mudanças desde o retrato guardado na análise; null se não há retrato. */
export function mudancasDoDossie(a: AnaliseV2, predio: Edificio | null, agora: string): { desde: string; mudancas: Mudanca[] } | null {
  const m = a.caderno?.memoria;
  if (!m) return null;
  return { desde: m.em, mudancas: mudancasDesde(m, retratoDoDossie(a, predio, agora)) };
}
