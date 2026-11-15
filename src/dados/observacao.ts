// Contrato de observação e publicação (VE02, A04/A37). Compartilhado pelo app, pelos testes (Jest) e pelo pipeline em
// Node 22 (scripts/dados/observacoes/*.mjs importa este arquivo direto, com remoção de tipos). Por isso só importa
// `zod`: nada de import relativo, nada de API do Node ou do React Native.
//
// Regras (docs/aplicacao/VEREDA-APPLICATION-PLAN.md §4):
// - HTTP 200 nunca basta: a coleta é "valida" só com registros utilizáveis e contagem coerente com o declarado.
// - Desconhecido e zero são estados diferentes (`estadoDoValor`).
// - Data administrativa não vira tempo do evento: são campos separados, cada um com sua precisão.
// - Um snapshot parcial não publica camada que pareça completa (ver `podePublicar`).
import { z } from "zod";

export const VERSAO_DO_CONTRATO = 1 as const;

const instante = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/);
const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);

/** valida: registros utilizáveis e contagem fecha. vazia: a fonte respondeu, legitimamente, sem registros. parcial: faltou
 * página, orçamento ou parte dos registros. falhou: nada utilizável (acesso negado, HTML de erro, formato desconhecido…). */
export const estadoDaColeta = z.enum(["valida", "vazia", "parcial", "falhou"]);
export type EstadoDaColeta = z.infer<typeof estadoDaColeta>;

export const motivoDeFalha = z.enum([
  "acesso_negado", // 401/403, login, desafio: não é conjunto vazio
  "limite_de_taxa", // 429 que persistiu depois das novas tentativas
  "erro_http", // outro status de erro
  "corpo_nao_e_dados", // 200 com HTML/texto de erro onde se esperava JSON/CSV
  "formato_desconhecido", // colunas ou chaves que o analisador não reconhece
  "pagina_repetida", // a paginação devolveu a mesma página para offsets diferentes
  "pagina_faltando", // uma página veio vazia ou curta antes do total declarado
  "orcamento_esgotado", // limite de requisições da execução
  "nenhum_registro_utilizavel", // registros lidos, todos em quarentena
  "rede", // tempo esgotado, DNS, conexão
]);
export type MotivoDeFalha = z.infer<typeof motivoDeFalha>;

export const escalaEspacial = z.enum(["ponto", "unidade", "edificio", "rua", "setor_censitario", "bairro", "municipio", "regiao"]);
export const precisaoTemporal = z.enum(["instante", "dia", "mes", "ano", "nenhuma"]);

export const esquemaSnapshotDaFonte = z.strictObject({
  versaoDoContrato: z.literal(VERSAO_DO_CONTRATO),
  fonte: z.string().regex(/^[a-z0-9_]{2,60}$/),
  url: z.string().max(2000),
  recuperadoEm: instante,
  periodoDeReferencia: z.strictObject({ de: dia, ate: dia }).nullable(),
  tipoDeMidia: z.string().max(100),
  /** Hash do corpo bruto arquivado; null quando não houve corpo (falha de rede) ou o corpo não pode ser guardado. */
  sha256: sha256.nullable(),
  bytes: z.number().int().min(0),
  analisador: z.strictObject({ nome: z.string().max(60), versao: z.string().max(20) }),
  termos: z.strictObject({
    licenca: z.string().max(80),
    /** arquivar: o bruto pode ser guardado para replay; so_derivados: só os campos extraídos; nao_arquivar: nada. */
    retencao: z.enum(["arquivar", "so_derivados", "nao_arquivar"]),
    atribuicao: z.string().max(200),
  }),
  escala: escalaEspacial,
  precisaoDaData: precisaoTemporal,
  estado: estadoDaColeta,
  motivo: motivoDeFalha.nullable(),
  contagens: z.strictObject({
    requisicoes: z.number().int().min(0),
    /** Total que a fonte declara (ex.: `total` do CKAN); null quando ela não declara. */
    registrosDeclarados: z.number().int().min(0).nullable(),
    registrosLidos: z.number().int().min(0),
    observacoes: z.number().int().min(0),
    quarentena: z.number().int().min(0),
  }),
});
export type SnapshotDaFonte = z.infer<typeof esquemaSnapshotDaFonte>;

export const estadoDoValor = z.enum(["conhecido", "desconhecido", "zero_declarado", "a_confirmar"]);

export const esquemaObservacao = z.strictObject({
  id: z.string().min(8).max(120),
  fonte: z.string().regex(/^[a-z0-9_]{2,60}$/),
  /** Snapshot de onde a observação saiu (hash do bruto), ou null quando o bruto não é arquivado. */
  snapshotSha256: sha256.nullable(),
  /** Onde achar o registro no original: "_id=123", "linha 45", "campo preco". */
  localizador: z.string().min(1).max(200),
  propriedade: z.string().regex(/^[a-z0-9_.]{2,80}$/),
  valor: z.union([z.number(), z.string().max(500), z.boolean()]).nullable(),
  unidade: z.string().max(40).nullable(),
  estadoDoValor,
  entidades: z.array(z.strictObject({
    tipo: z.enum(["anuncio", "unidade", "edificio", "rua", "bairro", "parada", "area"]),
    id: z.string().min(1).max(120),
    /** Como o vínculo foi feito: "texto_da_fonte", "nome_normalizado", "confirmacao_da_pessoa"… */
    metodo: z.string().max(60),
  })).max(10),
  geometria: z.strictObject({
    tipo: z.literal("ponto"),
    coordenadas: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    crs: z.literal("EPSG:4326"),
    precisao: z.enum(["levantada", "endereco", "rua", "bairro", "desconhecida"]),
  }).nullable(),
  tempos: z.strictObject({
    /** Quando aconteceu no mundo; null quando a fonte não diz. */
    evento: z.string().max(40).nullable(),
    precisaoDoEvento: precisaoTemporal,
    /** Data do registro administrativo (atendimento, protocolo); nunca usada como evento sem regra explícita. */
    administrativo: z.string().max(40).nullable(),
    publicado: z.string().max(40).nullable(),
    recuperado: instante,
  }),
  trecho: z.string().max(300).nullable(),
  metodo: z.strictObject({ nome: z.string().max(60), versao: z.string().max(20) }),
});
export type Observacao = z.infer<typeof esquemaObservacao>;

export const esquemaQuarentena = z.strictObject({
  fonte: z.string().regex(/^[a-z0-9_]{2,60}$/),
  snapshotSha256: sha256.nullable(),
  localizador: z.string().min(1).max(200),
  motivo: z.enum([
    "layout_desconhecido", "sem_data", "data_invalida", "sem_endereco", "coordenada_fora_da_regiao",
    "provavel_crs_errado", "duplicado", "valor_invalido",
  ]),
  trecho: z.string().max(300),
});
export type Quarentena = z.infer<typeof esquemaQuarentena>;

export const esquemaManifestoDePublicacao = z.strictObject({
  versaoDoContrato: z.literal(VERSAO_DO_CONTRATO),
  publicacao: z.string().regex(/^[a-z0-9_-]{2,60}$/),
  versao: z.string().regex(/^[0-9a-f]{16}$/),
  criadoEm: instante,
  versaoAnterior: z.string().regex(/^[0-9a-f]{16}$/).nullable(),
  estado: z.enum(["completa", "parcial"]),
  fontes: z.array(z.strictObject({
    fonte: z.string(), sha256: sha256.nullable(), estado: estadoDaColeta, analisador: z.string(), recuperadoEm: instante,
  })).min(1),
  derivacoes: z.array(z.strictObject({ nome: z.string(), versao: z.string() })),
  particoes: z.array(z.strictObject({
    arquivo: z.string().regex(/^[a-z0-9_.-]{1,80}$/), sha256, bytes: z.number().int().min(0), registros: z.number().int().min(0),
  })).min(1),
  cobertura: z.strictObject({
    /** O que cada contagem conta, ex.: "observações aceitas por ano administrativo". */
    denominador: z.string().max(200),
    total: z.number().int().min(0),
    porChave: z.record(z.string(), z.number().int().min(0)),
  }),
  validacao: z.strictObject({
    quarentena: z.number().int().min(0),
    motivos: z.record(z.string(), z.number().int().min(0)),
    verificacoes: z.array(z.strictObject({ nome: z.string(), ok: z.boolean(), detalhe: z.string().max(400) })),
  }),
});
export type ManifestoDePublicacao = z.infer<typeof esquemaManifestoDePublicacao>;

/**
 * Estado de uma coleta a partir do que se sabe ao final. `erro` tem precedência. Zero declarado e zero lido é "vazia"
 * (resultado legítimo); registros lidos e nenhum aceito é falha, nunca cobertura completa.
 */
export function classificarColeta(p: {
  erro: MotivoDeFalha | null;
  declarados: number | null;
  lidos: number;
  aceitos: number;
  paginasFaltando: number;
}): { estado: EstadoDaColeta; motivo: MotivoDeFalha | null } {
  if (p.erro && p.lidos === 0) return { estado: "falhou", motivo: p.erro };
  if (p.lidos === 0 && (p.declarados === 0 || p.declarados === null) && !p.erro) return { estado: "vazia", motivo: null };
  if (p.lidos > 0 && p.aceitos === 0) return { estado: "falhou", motivo: "nenhum_registro_utilizavel" };
  if (p.erro) return { estado: "parcial", motivo: p.erro };
  if (p.paginasFaltando > 0) return { estado: "parcial", motivo: "pagina_faltando" };
  if (p.declarados !== null && p.lidos < p.declarados) return { estado: "parcial", motivo: "pagina_faltando" };
  if (p.lidos === 0) return { estado: "falhou", motivo: "pagina_faltando" };
  return { estado: "valida", motivo: null };
}

/** Uma publicação só vira "completa" com todas as fontes válidas ou legitimamente vazias. */
export function estadoDaPublicacao(fontes: readonly { estado: EstadoDaColeta }[]): "completa" | "parcial" | "bloqueada" {
  if (fontes.length === 0 || fontes.every((f) => f.estado === "falhou")) return "bloqueada";
  return fontes.every((f) => f.estado === "valida" || f.estado === "vazia") ? "completa" : "parcial";
}
