// Textos da gaveta de fonte (Fatia 4). Funções puras: recebem a meta do índice e devolvem o que a gaveta mostra.
// Nada aqui lê armazenamento nem relógio. Os nomes, o órgão, a licença, as datas e as colunas vêm de `META.fontes`
// (src/dados/recife/indice/meta.json); este arquivo só acrescenta o nome curto, o recorte e os rótulos de confiança.
import type { ChaveDeFonte, Confianca, MetaDoIndice } from "../../dados/contratos";

/** Quem trouxe o dado: uma base da Prefeitura, o anúncio, a própria pessoa ou a média das análises dela. */
export type FonteDoDado = ChaveDeFonte | "anuncio" | "voce" | "suas_analises";

/** As quatro linhas de confiança de index.html (`.conf-trace`, linhas 2410 a 2440), na ordem de index.html. */
export const ORDEM_DA_CONFIANCA: readonly Confianca[] = ["oficial", "declarado", "inferencia", "nao_sabemos"];

const ROTULO_DA_CONFIANCA: Record<Confianca, string> = {
  oficial: "registro oficial",
  declarado: "declarado pelo anunciante",
  inferencia: "inferência ou sinal exploratório",
  nao_sabemos: "não sabemos",
};

/** Explicação de uma linha para cada categoria, mostrada na gaveta. */
export const EXPLICACAO_DA_CONFIANCA: Record<Confianca, string> = {
  oficial: "Vem de uma base pública da Prefeitura, sem alteração.",
  declarado: "Alguém informou o valor. Não há registro oficial para conferir.",
  inferencia: "Conclusão tirada de outros dados. Confirme na visita ou nos documentos.",
  nao_sabemos: "Não há dado para afirmar nada. Vira pergunta para a visita.",
};

/**
 * Rótulo da confiança. A categoria "declarado" muda de dono conforme a fonte: o anunciante, a própria pessoa ou as
 * análises que ela guardou.
 */
export function rotuloDaConfianca(confianca: Confianca, fonte: FonteDoDado | null = null): string {
  if (confianca === "declarado" && fonte === "voce") return "declarado por você";
  if (confianca === "declarado" && fonte === "suas_analises") return "declarado nos anúncios das suas análises";
  return ROTULO_DA_CONFIANCA[confianca];
}

const NOME_CURTO: Record<ChaveDeFonte, string> = {
  iptu_2026: "IPTU 2026",
  itbi: "ITBI 2016 a 2026",
  licenciamento: "Licenciamento de obras",
  lotes: "Lotes",
  bairros: "Bairros e RPAs",
};

/** O que cada base contribui para o dossiê, conforme as regras do índice (Fatia 3 da ordem). */
const RECORTE: Record<ChaveDeFonte, string> = {
  iptu_2026: "Unidades residenciais do tipo apartamento, agrupadas por rua e número do edifício.",
  itbi: "Transmissões de apartamentos, ligadas ao edifício pela rua e pelo número. Vale o valor da avaliação de cada unidade nos últimos 36 meses. É avaliação fiscal, não preço de mercado.",
  licenciamento:
    "Licenças da categoria Obra, a até 150 m do edifício. Contam construção, acréscimo de área e demolição dos últimos 24 meses.",
  lotes: "Lote que contém o ponto central do edifício: chave cadastral, pavimentos, nome e contorno.",
  bairros: "Limites oficiais dos bairros do Recife.",
};

/** Nome curto da fonte para linhas de uma linha: "IPTU 2026", "anúncio", "você", "suas análises". */
export function nomeCurtoDaFonte(fonte: FonteDoDado): string {
  switch (fonte) {
    case "anuncio":
      return "anúncio";
    case "voce":
      return "você";
    case "suas_analises":
      return "suas análises";
    default:
      return NOME_CURTO[fonte];
  }
}

/** "2026-10-03" vira "03/10/2026"; "2026-10-20T16:17:16Z" vira "20/10/2026" (data em UTC, sem conversão de fuso). */
export function dataDaFonte(iso: string | null): string {
  if (!iso) return "Não informada";
  const achado = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return achado ? `${achado[3]}/${achado[2]}/${achado[1]}` : iso;
}

/** "Prefeitura da Cidade do Recife · Secretaria de Finanças" vira "Prefeitura do Recife". */
export function orgaoCurto(orgao: string): string {
  return orgao.startsWith("Prefeitura da Cidade do Recife") ? "Prefeitura do Recife" : (orgao.split(" · ")[0] ?? orgao);
}

export type DescricaoDeBase = {
  tipo: "base";
  chave: ChaveDeFonte;
  /** "IPTU 2026 · Prefeitura do Recife · ODbL". */
  titulo: string;
  /** Nome completo da base, como no meta.json. */
  subtitulo: string;
  orgao: string;
  licenca: string;
  modificadoEm: string;
  consultadoEm: string;
  recorte: string;
  colunas: string[];
  url: string;
};

export type DescricaoDeOrigem = {
  tipo: "anuncio" | "voce" | "suas_analises";
  titulo: string;
  texto: string;
};

export type DescricaoDaFonte = DescricaoDeBase | DescricaoDeOrigem;

/**
 * Descreve a fonte para a gaveta. Devolve `null` só quando a base não está no meta.json: a gaveta então avisa, em vez de
 * inventar nome, órgão ou data.
 */
export function descreverFonte(fonte: FonteDoDado, meta: Pick<MetaDoIndice, "fontes">): DescricaoDaFonte | null {
  switch (fonte) {
    case "anuncio":
      return {
        tipo: "anuncio",
        titulo: "Informado no anúncio",
        texto: "Este dado veio do anúncio, pelo link ou pelo texto lido, e não foi conferido com registro oficial.",
      };
    case "voce":
      return {
        tipo: "voce",
        titulo: "Informado por você",
        texto: "Você digitou ou corrigiu este valor. Ele vale até você mudá-lo.",
      };
    case "suas_analises":
      return {
        tipo: "suas_analises",
        titulo: "Suas análises",
        texto: "Calculado com os valores por m² das suas outras análises de aluguel no mesmo bairro, como os anúncios informaram.",
      };
    default: {
      const base = meta.fontes.find((f) => f.chave === fonte);
      if (!base) return null;
      return {
        tipo: "base",
        chave: fonte,
        titulo: `${NOME_CURTO[fonte]} · ${orgaoCurto(base.orgao)} · ${base.licenca}`,
        subtitulo: base.nome,
        orgao: base.orgao,
        licenca: base.licenca,
        modificadoEm: dataDaFonte(base.modificadoEm),
        consultadoEm: dataDaFonte(base.consultadoEm),
        recorte: RECORTE[fonte],
        colunas: base.colunasUsadas,
        url: base.url,
      };
    }
  }
}
