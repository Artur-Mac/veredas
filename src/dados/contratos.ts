// Contratos da v1.0 (autor: arquiteto). O operário implementa funções que produzem e consomem estes
// tipos; não altera campos, nomes ou regras daqui sem ordem em docs/handoff/ORDEM_DO_ARQUITETO.md.
// O formato v1 do caderno continua em ./analise.ts e só é lido para migração.
import { z } from "zod";
import { BAIRROS_COBERTOS } from "./recife/bairros";

// ——— Vocabulário ———————————————————————————————————————————————————————————————

export const modalidade = z.enum(["aluguel", "compra"]);
export const portal = z.enum(["zap", "vivareal", "quintoandar", "olx", "outro"]);
export const tipologia = z.enum(["apartamento", "casa", "flat", "kitnet", "cobertura", "outro"]);
/** Quem trouxe o valor declarado: o endereço do link, o texto/HTML colado, ou a própria pessoa. */
export const origemDoValor = z.enum(["link", "texto", "voce"]);
/** As quatro linhas de confiança de index.html (.conf-trace): oficial, declarado, inferência, não sabemos. */
export const confianca = z.enum(["oficial", "declarado", "inferencia", "nao_sabemos"]);
export const periodo = z.enum(["mes", "ano", "desconhecido"]);
export const bairroCoberto = z.enum(BAIRROS_COBERTOS);

const reais = z.number().finite().min(0).max(1e10);
const contagem = z.number().int().min(0).max(999);
const instante = z.iso.datetime();
/** [longitude, latitude] em WGS84, 6 casas decimais. */
const coordenada = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const dsqfl = z.string().regex(/^\d{14}$/);

// ——— Extração do anúncio (Camadas A, B e C) ————————————————————————————————————

export const chaveDeCampo = z.enum([
  "modalidade", "tipologia", "bairro", "cidade", "logradouro", "numero", "nomeEdificio",
  "area", "quartos", "suites", "banheiros", "vagas", "andar", "anoConstrucao",
  "preco", "condominio", "iptu", "seguroIncendio", "taxaServico", "totalInformado",
]);

/** Tudo o que um extrator consegue ler. `null` = não lido. Nunca use 0 para "não lido". */
export const esquemaCamposExtraidos = z.strictObject({
  modalidade: modalidade.nullable(),
  tipologia: tipologia.nullable(),
  /** Como o bairro apareceu (trecho do slug ou do texto), antes de normalizar. */
  bairroTexto: z.string().max(120).nullable(),
  /** Slug oficial de BAIRROS_DO_RECIFE, ou null quando não reconhecido. */
  bairro: z.string().max(40).nullable(),
  /** "recife" quando a URL/texto indica Recife; outra cidade só se explícita; senão null. */
  cidade: z.string().max(80).nullable(),
  logradouro: z.string().max(160).nullable(),
  numero: z.string().max(12).nullable(),
  nomeEdificio: z.string().max(120).nullable(),
  area: z.number().positive().max(100000).nullable(),
  quartos: contagem.nullable(),
  suites: contagem.nullable(),
  banheiros: contagem.nullable(),
  vagas: contagem.nullable(),
  andar: z.number().int().min(-5).max(200).nullable(),
  anoConstrucao: z.number().int().min(1800).max(2100).nullable(),
  preco: reais.nullable(),
  condominio: reais.nullable(),
  iptu: z.strictObject({ valor: reais, periodo }).nullable(),
  seguroIncendio: reais.nullable(),
  taxaServico: reais.nullable(),
  /** "Total R$ X" do pacote mensal (QuintoAndar). Serve para conferir a periodicidade do IPTU. */
  totalInformado: reais.nullable(),
  /** Slugs curtos: "piscina", "garagem", "mobiliado", "academia", "sauna", "vista-mar", "varanda", "elevador". */
  comodidades: z.array(z.string().max(40)).max(30),
});

/** Saída de UM extrator (URL, texto ou JSON-LD) antes da mescla. */
export const esquemaLeituraParcial = z.strictObject({
  metodo: z.enum(["url", "texto", "json_ld"]),
  portal,
  idNoPortal: z.string().max(40).nullable(),
  campos: esquemaCamposExtraidos,
});

export const esquemaAnomalia = z.strictObject({
  campo: chaveDeCampo,
  tipo: z.enum(["nao_informado", "valor_simbolico", "valor_atipico", "periodo_desconhecido", "valor_repetido", "incoerente"]),
  /** Texto exatamente como lido ("R$ 1", "Não informado"), para mostrar à pessoa. */
  valorLido: z.string().max(80).nullable(),
  mensagem: z.string().max(200),
});

export const cobertura = z.enum(["coberto", "recife_fora", "fora_do_recife", "desconhecida"]);

/** Resultado final da leitura do anúncio, antes da revisão humana. Guardado na Analise. */
export const esquemaExtracao = z.strictObject({
  url: z.string().max(2000),
  portal,
  idNoPortal: z.string().max(40).nullable(),
  coletadoEm: instante,
  metodos: z.array(z.enum(["url", "texto", "json_ld"])).min(1).max(3),
  campos: esquemaCamposExtraidos,
  /** De qual leitura veio cada campo não nulo. */
  origemDosCampos: z.partialRecord(chaveDeCampo, z.enum(["link", "texto"])),
  anomalias: z.array(esquemaAnomalia).max(30),
  /** Campos de custo e identificação esperados para a modalidade que ficaram nulos. */
  lacunas: z.array(chaveDeCampo).max(30),
  cobertura,
});

// ——— Análise do usuário (persistida, versão 2) ————————————————————————————————————

function declarado<T extends z.ZodType>(valor: T) {
  return z.strictObject({
    /** null = desconhecido. 0 só é válido se a pessoa digitou 0 (origem "voce"). */
    valor: valor.nullable(),
    origem: origemDoValor,
    /** true: não entra em soma nenhuma, mostra "A confirmar" e gera pergunta de visita. */
    aConfirmar: z.boolean(),
  });
}

export const esquemaDeclarados = z.strictObject({
  preco: declarado(reais),
  condominio: declarado(reais),
  iptu: declarado(reais).extend({ periodo }),
  seguroIncendio: declarado(reais),
  taxaServico: declarado(reais),
  outros: declarado(reais),
  area: declarado(z.number().positive().max(100000)),
  quartos: declarado(contagem),
  suites: declarado(contagem),
  banheiros: declarado(contagem),
  vagas: declarado(contagem),
  andar: declarado(z.number().int().min(-5).max(200)),
});

export const esquemaVinculo = z.discriminatedUnion("estado", [
  z.strictObject({ estado: z.literal("pendente") }),
  z.strictObject({
    estado: z.literal("confirmado"),
    edificioId: z.string().max(40),
    dsqfl: dsqfl.nullable(),
    confirmadoEm: instante,
    /** `geradoEm` do índice usado na confirmação, para avisar quando o índice for regenerado. */
    indiceGeradoEm: z.string().max(40),
  }),
  z.strictObject({ estado: z.literal("pulado"), em: instante }),
  z.strictObject({ estado: z.literal("nao_encontrado"), em: instante }),
  z.strictObject({ estado: z.literal("fora_de_cobertura") }),
]);

export const esquemaVisita = z.strictObject({
  /** Ids de Pergunta marcadas como conferidas. */
  verificadas: z.array(z.string().max(60)).max(100),
  /** Resposta anotada por id de Pergunta. */
  respostas: z.record(z.string().max(60), z.string().max(1000)),
  perguntasProprias: z.array(z.strictObject({ id: z.string().regex(/^propria-[a-z0-9-]{1,40}$/), texto: z.string().trim().min(1).max(240) })).max(30),
  notas: z.string().max(4000),
  /** Percepção da pessoa. A v1.0 não mede decibéis. */
  ruido: z.enum(["silencioso", "moderado", "alto"]).nullable(),
  /** Para onde a janela principal está voltada, informado pela pessoa (0 = norte). */
  orientacaoGraus: z.number().int().min(0).max(359).nullable(),
  segundos: z.number().int().min(0).max(604800),
  concluidaEm: instante.nullable(),
});

/** Motivos de index.html (openDiscardSheet), com chave estável. */
export const motivoDeDescarte = z.enum(["preco_taxas", "ruido_entorno", "planta_andar_vaga", "outro"]);

export const esquemaAnaliseV2 = z.strictObject({
  versao: z.literal(2),
  id: z.string().regex(/^[a-z0-9-]{1,60}$/),
  criadaEm: instante,
  atualizadaEm: instante,
  nome: z.string().trim().min(1).max(120),
  modalidade,
  tipologia: tipologia.nullable(),
  /** "" quando a análise nasceu sem link. */
  url: z.string().max(2000),
  bairroTexto: z.string().max(120),
  bairro: z.string().max(40).nullable(),
  logradouro: z.string().max(160).nullable(),
  numero: z.string().max(12).nullable(),
  nomeEdificio: z.string().max(120).nullable(),
  extracao: esquemaExtracao.nullable(),
  declarados: esquemaDeclarados,
  vinculo: esquemaVinculo,
  visita: esquemaVisita,
  salva: z.boolean(),
  descarte: z.strictObject({ motivo: motivoDeDescarte, observacao: z.string().max(400), em: instante }).nullable(),
});

/** Chave de armazenamento local da v2. A v1 ("vereda-analises-v1") só é lida para migrar e nunca apagada. */
export const CHAVE_ANALISES_V2 = "vereda-analises-v2";
export const CHAVE_CARTEIRA = "vereda-carteira-v1";

/** Carteira local de créditos: sem dinheiro, sem compra. Ver docs/V1-ESCOPO-E-VIABILIDADE.md. */
export const esquemaCarteira = z.strictObject({
  saldo: z.number().int().min(0).max(999),
  extrato: z.array(z.strictObject({
    em: instante,
    tipo: z.enum(["cota_inicial", "dossie_cadastral", "descarte", "recarga_de_teste"]),
    analiseId: z.string().max(60).nullable(),
    delta: z.number().int().min(-1).max(3),
  })).max(500),
});

// ——— Índice cadastral do Recife (gerado por scripts/dados/construir-indice-recife.mjs) ————————

const quartis = z.strictObject({ n: z.number().int().min(1), p25: z.number(), mediana: z.number(), p75: z.number() });

/**
 * Licença de obra relevante para quem mora ao lado: construção nova, acréscimo de área ou demolição.
 * Só registros com `categoria_empreendimento = "Obra"` (o resto da base é alvará de funcionamento de
 * comércio). Regras de classificação na Fatia 3 da ordem. Guardada uma vez por bairro, em
 * `IndiceDoBairro.obras`; os edifícios apontam para ela pelo índice.
 */
export const esquemaObra = z.strictObject({
  categoria: z.enum(["construcao", "acrescimo", "demolicao"]),
  /** `assunto` (ou `tipo_processo`, se vazio) como publicado, ex.: "ALVARA DE CONSTRUCAO INICIAL". */
  descricao: z.string().max(80),
  /** Mês de `data_entrada`, "AAAA-MM". */
  data: z.string().regex(/^\d{4}-\d{2}$/),
  situacao: z.string().max(80).nullable(),
  /** Coordenada publicada ou, sem ela, centro do lote pelo `dsqfl`. */
  centro: coordenada,
});

export const esquemaEdificio = z.strictObject({
  /** `${Código Logradouro}-${numero}` do IPTU 2026, ex.: "60461-331". */
  id: z.string().regex(/^\d+-[0-9A-Za-z]{1,12}$/),
  bairro: bairroCoberto,
  /** Como no IPTU, em caixa alta: "RUA TELES JUNIOR". A interface formata. */
  logradouro: z.string().max(160),
  numero: z.string().max(12),
  /** Da base de Lotes: lote que contém o centro do edifício ou, sem coordenada no IPTU, lote achado pelo endereço (NMENDCOMP). */
  dsqfl: dsqfl.nullable(),
  /**
   * `NMEDIFICACAO` da base de Lotes, normalizado: sem o prefixo "EDF"/"EDIF"/"EDIFICIO", espaços simples,
   * caixa de título ("EDF  PARADOR  DE  CERVANTES" → "Parador de Cervantes"). Preenchido em 87% dos
   * prédios de Graças (conferido em 20/10/2026).
   */
  nome: z.string().max(120).nullable(),
  centro: coordenada,
  /** Polígono do lote simplificado (≤ 24 vértices); null se a etapa de Lotes falhar. */
  poligono: z.array(coordenada).min(3).max(24).nullable(),
  /** Registros de IPTU residenciais no endereço. O índice só guarda edifícios com 2 ou mais. */
  unidades: z.number().int().min(2),
  /** Unidades agrupadas por `AREA CONSTRUIDA` (arredondada a 0,01 m²), em ordem crescente de área. */
  tipologias: z.array(z.strictObject({
    area: z.number().positive(),
    unidades: z.number().int().min(1),
    iptuAnualMediano: z.number().nonnegative().nullable(),
  })).min(1).max(60),
  /** Moda de "ano da construção corrigido". */
  anoConstrucao: z.number().int().min(1800).max(2100).nullable(),
  /** `qtd_pavimento` da base de Lotes. Nunca use "quantidade de pavimentos" do IPTU (sem correlação com a altura). */
  pavimentos: z.number().int().positive().max(200).nullable(),
  /** Moda de "Tipo de Construção" do IPTU: true para "Apartamento <= 4 Pavimentos", false para "> 4". */
  ate4Pavimentos: z.boolean().nullable(),
  /** Moda de "tipo de padrão da construção" ("Simples", "Médio", "Superior", "Luxo"...). */
  padrao: z.string().max(40).nullable(),
  /** Quartis de "valor cobrado de IPTU" (anual, R$) das unidades residenciais. */
  iptuAnual: quartis.nullable(),
  /**
   * ITBI 2016–2026 no mesmo `cod_logradouro` + `numero`. Avaliação fiscal, não preço de mercado.
   * ATENÇÃO: `area_construida` do ITBI inclui área comum (66,7 m² privativos no IPTU = 109,84 m² no ITBI,
   * conferido em 20/10/2026). Nunca divida por ela nem compare com área privativa de anúncio.
   */
  itbi: z.strictObject({
    transmissoes: z.number().int().min(1),
    desde: z.number().int(),
    ate: z.number().int(),
    /** Quartis de `valor_avaliacao` (R$ por unidade) nos 36 meses anteriores à geração; null quando n < 3. */
    valorUnidade: quartis.nullable(),
    porAno: z.array(z.tuple([z.number().int(), z.number().int().min(1)])),
  }).nullable(),
  /** Licenciamento a até 150 m do `centro`. */
  obras150m: z.strictObject({
    /** Licenças válidas com categoria "Obra" desde 2018, de qualquer tipo (inclui habite-se e reforma pequena), sem indeferidas, canceladas, arquivadas, desistidas ou extintas, e sem repetição de lote, categoria e mês. */
    licencasDeObra: z.number().int().min(0),
    /** Construção, acréscimo ou demolição com `data_entrada` nos 24 meses anteriores à geração. */
    relevantes24m: z.number().int().min(0),
    demolicoes24m: z.number().int().min(0),
    /** Até 10 das relevantes em 24 meses, mais recentes primeiro: [índice em IndiceDoBairro.obras, distância em m]. */
    recentes: z.array(z.tuple([z.number().int().min(0), z.number().int().min(0).max(150)])).max(10),
  }),
});

export const esquemaContextoDoBairro = z.strictObject({
  bairro: bairroCoberto,
  edificios: z.number().int().min(0),
  unidades: z.number().int().min(0),
  /** IPTU anual por m² das unidades residenciais indexadas. */
  iptuAnualPorM2: quartis.nullable(),
});

export const esquemaIndiceDoBairro = z.strictObject({
  bairro: bairroCoberto,
  geradoEm: z.string().max(40),
  contexto: esquemaContextoDoBairro,
  edificios: z.array(esquemaEdificio),
  /** Obras relevantes referidas por algum edifício do bairro, sem repetição. */
  obras: z.array(esquemaObra),
});

export const chaveDeFonte = z.enum(["iptu_2026", "itbi", "licenciamento", "lotes", "bairros"]);

export const esquemaMetaDoIndice = z.strictObject({
  geradoEm: z.string().max(40),
  fontes: z.array(z.strictObject({
    chave: chaveDeFonte,
    nome: z.string(),
    orgao: z.string(),
    licenca: z.literal("ODbL"),
    url: z.string().url(),
    recursos: z.array(z.string()).min(1),
    modificadoEm: z.string().nullable(),
    consultadoEm: z.string(),
    registrosLidos: z.number().int().min(0),
    /** Lista branca efetivamente pedida à API (parâmetro `fields`). Nenhuma coluna pessoal. */
    colunasUsadas: z.array(z.string()).min(1),
  })).min(1),
});

/** Saída da busca de prédio candidato (T3). */
export const esquemaCandidato = z.strictObject({
  edificioId: z.string(),
  pontos: z.number().int(),
  /** Frases curtas e factuais, ex.: "3 unidades com 125 m² no cadastro", "Mesma rua do anúncio". */
  motivos: z.array(z.string().max(80)).max(6),
});

// ——— Visão do dossiê (derivada, não persistida) ————————————————————————————————————

export type Confianca = z.infer<typeof confianca>;
export type ChaveDeFonte = z.infer<typeof chaveDeFonte>;

/** Uma linha de fato com rastro de confiança (.conf-trace) e caminho para a fonte. */
export type Fato = {
  id: string;
  rotulo: string;
  /** Já formatado para exibição ("2010", "R$ 328–R$ 371/mês", "A confirmar"). */
  valor: string;
  confianca: Confianca;
  fonte: ChaveDeFonte | "anuncio" | "voce" | null;
  detalhe: string | null;
};

export type Prioridade = "custo" | "conforto" | "documentos";

/** Item de "Antes de decidir" e do roteiro de visita. */
export type Pergunta = {
  /** Estável entre renderizações: "lacuna-iptu", "anomalia-condominio", "achado-obras", "padrao-agua", "propria-…". */
  id: string;
  /** Pergunta curta, como em index.html: "R$ 288 de IPTU por mês?". */
  titulo: string;
  /** Pista em uma linha: "Anúncio sem periodicidade". */
  pista: string;
  /** Frase completa que entra na mensagem ao corretor. */
  textoParaMensagem: string;
  origem: "lacuna" | "anomalia" | "achado" | "padrao" | "propria";
  prioridade: Prioridade;
};

/** "O que o Vereda encontrou · Além do anúncio" (renderDossierFindings). */
export type Achado = {
  id: string;
  tipo: "iptu" | "area" | "obras" | "estrutura" | "itbi" | "anomalia" | "idade";
  titulo: string;
  /** Número em destaque (.ds-finding-measure). */
  medida: { numero: string; unidade: string } | null;
  texto: string;
  confianca: Confianca;
  fonte: ChaveDeFonte | "anuncio" | null;
  /** Id da Pergunta que este achado gerou, se gerou. */
  perguntaId: string | null;
};

export type ParcelaDoCusto = {
  nome: "Aluguel" | "Condomínio" | "IPTU" | "Seguro incêndio" | "Taxa de serviço" | "Outros";
  /** Valor mensal; null quando desconhecido ou a confirmar. */
  valorMensal: number | null;
  estado: "conhecido" | "a_confirmar" | "desconhecido";
  /** Texto curto quando não conhecido: "O anúncio informa R$ 288, sem periodicidade". */
  nota: string | null;
};

/** Barra bala (.ds-bullet): posição de um valor numa faixa de referência. Sem adjetivo. */
export type Posicao = {
  rotulo: string;
  valor: number;
  referencia: z.infer<typeof quartis>;
  unidade: "R$/m²" | "R$/mês" | "R$/ano" | "R$";
  /** Diferença percentual em relação à mediana, inteira e com sinal. */
  deltaPercentual: number;
  /** Frase factual: "12% acima da mediana das avaliações fiscais do prédio". */
  frase: string;
  fonte: ChaveDeFonte | "suas_analises";
};

export type VisaoDoDossie = {
  analiseId: string;
  titulo: string;
  /** "Boa Viagem · Recife". */
  subtitulo: string;
  /** "Rua X, 327" quando conhecido; senão null. */
  endereco: string | null;
  loteConfirmado: boolean;
  especificacoes: { area: number | null; quartos: number | null; banheiros: number | null; vagas: number | null; andar: number | null };
  custo: {
    principal: { rotulo: "Aluguel anunciado" | "Preço anunciado"; valor: number | null; porM2: number | null };
    totalMensalConhecido: number | null;
    alemDoPrincipal: number | null;
    parcelas: ParcelaDoCusto[];
    /** "IPTU e Seguro fora da soma. …" quando há parcelas não conhecidas. */
    notaForaDaSoma: string | null;
  };
  posicao: Posicao | null;
  achados: { principal: Achado | null; apoio: Achado[] };
  perguntas: Pergunta[];
  cadastro: Fato[];
  historico: { quando: string; texto: string }[];
  obras: ObrasProximas | null;
};

/** `obras150m` com os índices já resolvidos contra `IndiceDoBairro.obras`. */
export type ObrasProximas = {
  licencasDeObra: number;
  relevantes24m: number;
  demolicoes24m: number;
  recentes: (z.infer<typeof esquemaObra> & { distanciaM: number })[];
};

// ——— Tipos inferidos ————————————————————————————————————————————————————————————

export type Modalidade = z.infer<typeof modalidade>;
export type Portal = z.infer<typeof portal>;
export type Tipologia = z.infer<typeof tipologia>;
export type OrigemDoValor = z.infer<typeof origemDoValor>;
export type Periodo = z.infer<typeof periodo>;
export type ChaveDeCampo = z.infer<typeof chaveDeCampo>;
export type CamposExtraidos = z.infer<typeof esquemaCamposExtraidos>;
export type LeituraParcial = z.infer<typeof esquemaLeituraParcial>;
export type Anomalia = z.infer<typeof esquemaAnomalia>;
export type Cobertura = z.infer<typeof cobertura>;
export type ExtracaoAnuncio = z.infer<typeof esquemaExtracao>;
export type Declarados = z.infer<typeof esquemaDeclarados>;
export type Vinculo = z.infer<typeof esquemaVinculo>;
export type Visita = z.infer<typeof esquemaVisita>;
export type MotivoDeDescarte = z.infer<typeof motivoDeDescarte>;
export type AnaliseV2 = z.infer<typeof esquemaAnaliseV2>;
export type Carteira = z.infer<typeof esquemaCarteira>;
export type Obra = z.infer<typeof esquemaObra>;
export type Edificio = z.infer<typeof esquemaEdificio>;
export type ContextoDoBairro = z.infer<typeof esquemaContextoDoBairro>;
export type IndiceDoBairro = z.infer<typeof esquemaIndiceDoBairro>;
export type MetaDoIndice = z.infer<typeof esquemaMetaDoIndice>;
export type Candidato = z.infer<typeof esquemaCandidato>;
export type Quartis = z.infer<typeof quartis>;

/** Campos vazios: ponto de partida de todo extrator. */
export function camposVazios(): CamposExtraidos {
  return {
    modalidade: null, tipologia: null, bairroTexto: null, bairro: null, cidade: null, logradouro: null,
    numero: null, nomeEdificio: null, area: null, quartos: null, suites: null, banheiros: null, vagas: null,
    andar: null, anoConstrucao: null, preco: null, condominio: null, iptu: null, seguroIncendio: null,
    taxaServico: null, totalInformado: null, comodidades: [],
  };
}
