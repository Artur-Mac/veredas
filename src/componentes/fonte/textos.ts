// Textos da gaveta de fonte (Fatia 4). Funções puras: recebem a meta do índice e devolvem o que a gaveta mostra.
// Nada aqui lê armazenamento nem relógio. Os nomes, o órgão, a licença, as datas e as colunas vêm de `META.fontes`
// (src/dados/recife/indice/meta.json); este arquivo só acrescenta o nome curto, o recorte e os rótulos de confiança.
import type { ChaveDeFonte, ChaveDeFonteDaRua, Confianca, MetaDoIndice } from "../../dados/contratos";

/** Quem trouxe o dado: uma base da Prefeitura ou do IBGE, o anúncio, a própria pessoa ou a média das análises dela. */
export type FonteDoDado = ChaveDeFonte | ChaveDeFonteDaRua | "anuncio" | "voce" | "suas_analises";

/** As bases da seção "A rua" (v1.1); as três do IBGE não nomeiam licença e pedem a citação da fonte. */
const FONTES_DA_RUA: readonly ChaveDeFonteDaRua[] = [
  "licenciamento_ambiental", "central_156", "iluminacao", "coleta", "sinistros", "defesa_civil", "cnefe", "censo_entorno", "censo_amostra",
];
const FONTES_DO_IBGE: readonly FonteDoDado[] = ["cnefe", "censo_entorno", "censo_amostra"];

export function eFonteDaRua(fonte: FonteDoDado): fonte is ChaveDeFonteDaRua {
  return (FONTES_DA_RUA as readonly string[]).includes(fonte);
}

/** As quatro linhas de confiança de index.html (`.conf-trace`, linhas 2410 a 2440), na ordem de index.html. */
export const ORDEM_DA_CONFIANCA: readonly Confianca[] = ["oficial", "declarado", "inferencia", "nao_sabemos"];

const ROTULO_DA_CONFIANCA: Record<Confianca, string> = {
  oficial: "registro oficial",
  declarado: "declarado pelo anunciante",
  inferencia: "inferência ou sinal exploratório",
  nao_sabemos: "não sabemos",
};

/**
 * Explicação de uma linha para cada categoria, mostrada na gaveta. A de "oficial" ("sem alteração") só vale para valor
 * copiado do registro; para mediana, faixa, moda, contagem ou mensalização, use `explicacaoDaConfianca` com o id do dado.
 */
export const EXPLICACAO_DA_CONFIANCA: Record<Confianca, string> = {
  oficial: "Vem de uma base pública da Prefeitura, sem alteração.",
  declarado: "Alguém informou o valor. Não há registro oficial para conferir.",
  inferencia: "Conclusão tirada de outros dados. Confirme na visita ou nos documentos.",
  nao_sabemos: "Não há dado para afirmar nada. Vira pergunta para a visita.",
};

/** Rastro do dado oficial que o Vereda calcula a partir do registro, em vez de copiá-lo. */
export const EXPLICACAO_DO_CALCULO = "Calculado pelo Vereda a partir de uma base pública da Prefeitura (mediana, faixa ou contagem por prédio).";

/** v1.1: as contagens da seção "A rua" (a até 150 m do prédio ou na rua dele) e os percentuais do Censo. */
export const EXPLICACAO_DO_CALCULO_DA_RUA = "Calculado pelo Vereda a partir de uma base pública da Prefeitura (contagem a até 150 m do prédio ou na rua dele).";
export const EXPLICACAO_DO_CALCULO_DO_IBGE = "Calculado pelo Vereda a partir de uma base pública do IBGE (percentual do setor censitário ou da área de ponderação).";

/**
 * Ids de `Fato` e de `Achado` (src/dados/dossie/derivar.ts) com confiança "oficial" cujo valor é o do registro, só
 * reformatado. O `Fato` não diz qual é qual, então a lista é explícita; um teste confere que todo dado oficial que a
 * derivação produz está numa das duas listas.
 */
export const IDS_DE_DADO_COPIADO: readonly string[] = [
  "cadastro-nome", // NMEDIFICACAO da base de Lotes
  "cadastro-pavimentos", // qtd_pavimento da base de Lotes
  "cadastro-chave", // DSQFL do lote
];

/** Ids de `Fato` e de `Achado` com confiança "oficial" que são medianas, faixas, modas, contagens ou valores mensalizados (÷ 12). */
export const IDS_DE_DADO_CALCULADO: readonly string[] = [
  "cadastro-ano", // moda do ano de construção corrigido entre as unidades
  "cadastro-unidades", // contagem de registros de IPTU residenciais no endereço
  "cadastro-area", // faixa das áreas por tipologia do prédio
  "cadastro-padrao", // moda do padrão da construção
  "iptu-faixa", // 1º a 3º quartil do IPTU anual das unidades, em valor mensal (÷ 12)
  "ach-iptu", // mediana do IPTU anual da tipologia, em valor mensal (÷ 12)
  "ach-obras", // contagem de licenças de obra a até 150 m em 24 meses
  "ach-itbi", // mediana das avaliações fiscais por unidade, 36 meses
];

/**
 * Bases da Prefeitura que o Vereda nunca copia por inteiro: o dossiê mostra a faixa, a mediana, a moda ou a contagem por
 * prédio. Um dado oficial que vem delas e cujo id não está nas listas acima conta como calculado. As cópias do registro
 * (nome, pavimentos e chave cadastral) vêm da base de Lotes.
 */
const BASES_AGREGADAS: readonly FonteDoDado[] = ["iptu_2026", "itbi", "licenciamento"];

/**
 * Explicação da confiança de um dado. Só "oficial" muda. O id do dado manda: em `IDS_DE_DADO_CALCULADO` o rastro diz que o
 * Vereda calculou o valor; em `IDS_DE_DADO_COPIADO` vale "sem alteração". Sem id (ou com id fora das listas), decide a
 * fonte: base agregada (IPTU 2026, ITBI, licenciamento) é cálculo; qualquer outra, ou sem fonte, mantém a explicação da
 * categoria. A gaveta de fonte só recebe a fonte, não o id, então é esta última regra que vale na tela.
 */
export function explicacaoDaConfianca(confianca: Confianca, idDoDado: string | null = null, fonte: FonteDoDado | null = null): string {
  if (confianca !== "oficial") return EXPLICACAO_DA_CONFIANCA[confianca];
  if (fonte !== null && FONTES_DO_IBGE.includes(fonte)) return EXPLICACAO_DO_CALCULO_DO_IBGE;
  if (fonte !== null && eFonteDaRua(fonte)) return EXPLICACAO_DO_CALCULO_DA_RUA;
  if (idDoDado !== null && IDS_DE_DADO_CALCULADO.includes(idDoDado)) return EXPLICACAO_DO_CALCULO;
  if (idDoDado !== null && IDS_DE_DADO_COPIADO.includes(idDoDado)) return EXPLICACAO_DA_CONFIANCA.oficial;
  if (fonte !== null && BASES_AGREGADAS.includes(fonte)) return EXPLICACAO_DO_CALCULO;
  return EXPLICACAO_DA_CONFIANCA.oficial;
}

/**
 * Rótulo da confiança. A categoria "declarado" muda de dono conforme a fonte: o anunciante, a própria pessoa ou as
 * análises que ela guardou.
 */
export function rotuloDaConfianca(confianca: Confianca, fonte: FonteDoDado | null = null): string {
  if (confianca === "declarado" && fonte === "voce") return "declarado por você";
  if (confianca === "declarado" && fonte === "suas_analises") return "declarado nos anúncios das suas análises";
  return ROTULO_DA_CONFIANCA[confianca];
}

const NOME_CURTO: Record<ChaveDeFonte | ChaveDeFonteDaRua, string> = {
  iptu_2026: "IPTU 2026",
  itbi: "ITBI 2016 a 2026",
  licenciamento: "Licenciamento de obras",
  lotes: "Lotes",
  bairros: "Bairros e RPAs",
  licenciamento_ambiental: "Licenciamento Ambiental",
  central_156: "Central 156 da Emlurb",
  iluminacao: "Iluminação pública",
  coleta: "Roteiro da coleta",
  sinistros: "Sinistros da CTTU",
  defesa_civil: "Defesa Civil",
  cnefe: "Endereços do IBGE (CNEFE)",
  censo_entorno: "Entorno do Censo",
  censo_amostra: "Amostra do Censo",
};

/** O que cada base contribui para o dossiê, conforme as regras do índice (Fatia 3 da ordem). */
const RECORTE: Record<ChaveDeFonte | ChaveDeFonteDaRua, string> = {
  iptu_2026: "Unidades residenciais do tipo apartamento, agrupadas por rua e número do edifício.",
  itbi: "Transmissões de apartamentos, ligadas ao edifício pela rua e pelo número. Vale o valor da avaliação de cada unidade nos últimos 36 meses. É avaliação fiscal, não preço de mercado.",
  licenciamento:
    "Licenças da categoria Obra, a até 150 m do edifício. Contam construção, acréscimo de área e demolição dos últimos 24 meses.",
  lotes: "Lote que contém o ponto central do edifício: chave cadastral, pavimentos, nome e contorno.",
  bairros: "Limites oficiais dos bairros do Recife.",
  licenciamento_ambiental:
    "Processos com licença de utilização sonora (LUSE) no histórico do lote, um local por lote, a até 150 m do prédio. Vale a situação vigente ou expirada na data da base.",
  central_156:
    "Pedidos de drenagem, lâmpada apagada e entulho nos 12 meses mais recentes publicados, a até 150 m do prédio. Sem coordenada, o endereço do pedido vira ponto pelo CNEFE. Tempo até o atendimento pela mediana dos atendidos.",
  iluminacao: "Pontos de iluminação pública marcados como desativados no cadastro de 2025, a até 150 m do prédio.",
  coleta: "Trechos do roteiro da coleta domiciliar casados com a rua do prédio pelo nome, com o CNEFE.",
  sinistros:
    "Chamados de sinistro com vítima de 2022 a 2024, postos no mapa pelo CNEFE (rua e número ou cruzamento), a até 150 m do prédio.",
  defesa_civil:
    "Atendimentos de 2014 a 2024 na rua do prédio, no mesmo bairro. A publicação esconde o número do imóvel, então o prédio só é confirmado por você.",
  cnefe: "Endereços do Censo 2022 usados para pôr no mapa o que só tem endereço e para achar o setor do prédio. O complemento não é lido.",
  censo_entorno: "Domicílios do setor censitário do prédio em face de quadra com ponto de ônibus, calçada, obstáculo, rampa e árvores.",
  censo_amostra: "Domicílios alugados na área de ponderação do setor do prédio, pela Tabela 1.1 da Amostra do Censo 2022.",
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
  chave: ChaveDeFonte | ChaveDeFonteDaRua;
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
export function descreverFonte(fonte: FonteDoDado, meta: Pick<MetaDoIndice, "fontes"> & Partial<Pick<MetaDoIndice, "fontesDaRua">>): DescricaoDaFonte | null {
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
      if (eFonteDaRua(fonte)) {
        const daRua = meta.fontesDaRua?.find((f) => f.chave === fonte);
        if (!daRua) return null;
        const ibge = daRua.licenca === "Citar o IBGE";
        return {
          tipo: "base",
          chave: fonte,
          titulo: ibge ? `${NOME_CURTO[fonte]} · IBGE` : `${NOME_CURTO[fonte]} · ${orgaoCurto(daRua.orgao)} · ${daRua.licenca}`,
          subtitulo: daRua.nome,
          orgao: daRua.orgao,
          licenca: ibge ? "Sem licença nomeada; o IBGE pede a citação da fonte" : daRua.licenca,
          modificadoEm: dataDaFonte(daRua.modificadoEm),
          consultadoEm: dataDaFonte(daRua.consultadoEm),
          recorte: RECORTE[fonte],
          colunas: daRua.colunasUsadas,
          url: daRua.url,
        };
      }
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
