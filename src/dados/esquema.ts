import { z } from "zod";

const coordenada = z.tuple([z.number(), z.number()]);

export const rotulo = z.enum(["registro_oficial", "declarado", "inferencia", "nao_sabemos"]);

export const estadoDoFato = z.enum(["padrao", "carregando", "vazio", "nao_sabemos", "contestado", "em_verificacao"]);

const fonte = z.strictObject({
  base: z.string(),
  orgao: z.string().nullable(),
  licenca: z.string().nullable(),
  url: z.string().nullable(),
  atualizado_em: z.string().nullable(),
  consultado_em: z.string().nullable(),
  via: z.string().nullable(),
});

const fato = z
  .strictObject({
    id: z.string(),
    rotulo,
    valor: z.unknown(),
    unidade: z.string().nullable(),
    texto: z.string(),
    fonte,
    escala: z.string().nullable(),
    ilustrativo: z.boolean(),
    estado: estadoDoFato,
    motivo_nao_sabemos: z.string().nullable(),
  })
  .refine((f) => f.estado !== "nao_sabemos" || typeof f.motivo_nao_sabemos === "string", {
    message: "fato em nao_sabemos sem motivo_nao_sabemos",
  });

const regua = z.strictObject({
  universo: z.string(),
  recorte: z.enum(["bairro", "raio_500", "raio_1000"]),
  periodo_meses: z.union([z.literal(12), z.literal(24)]),
  n: z.number().int(),
  p25: z.number(),
  mediana: z.number(),
  p75: z.number(),
  minimo: z.number(),
  maximo: z.number(),
  valor_anuncio: z.number(),
  posicao_percentil: z.number().int().min(0).max(100),
  unidade: z.string(),
  rotulo,
  fonte,
  escala: z.string(),
  ilustrativo: z.boolean(),
  frase: z.string(),
});

export const corDeCategoria = z.enum([
  "cat-ipe-roxo",
  "cat-goiaba",
  "cat-ipe-amarelo",
  "cat-mare",
  "cat-terra",
  "cat-outros",
  "crime-1",
  "crime-2",
  "crime-3",
]);

const anel = z.strictObject({
  tipo: z.literal("anel"),
  rotulo_centro: z.string(),
  total: z.number().int(),
  fatias: z.array(z.strictObject({ nome: z.string(), valor: z.number().int().min(0), cor: corDeCategoria })).max(6),
});

const barrasVizinhos = z.strictObject({
  tipo: z.literal("barras_vizinhos"),
  ordem: z.literal("norte_para_sul"),
  detalhe: anel,
  itens: z.array(
    z.strictObject({
      bairro: z.string(),
      do_dossie: z.boolean(),
      ocorrencias: z.number().int(),
      moradores: z.number().int().nullable(),
      por_mil: z.number().nullable(),
      estado: estadoDoFato,
      motivo_nao_sabemos: z.string().nullable(),
    }),
  ),
});

const secao = z.strictObject({
  id: z.string(),
  titulo: z.string(),
  fase: z.enum(["prototipo", "final"]),
  bloco_prd: z.enum(["cadastro", "fiscal", "defesa_civil", "consistencia", "extra_final", "extra_mock"]),
  icone: z.string(),
  resumo: z.string(),
  fatos: z.array(fato),
  grafico: z.union([z.null(), anel, barrasVizinhos]),
  ilustrativo: z.boolean().optional(),
});

const camposDoAnuncio = z.strictObject({
  preco: fato.optional(),
  aluguel: fato.optional(),
  condominio: fato.optional(),
  iptu: fato.optional(),
  area: fato.optional(),
  quartos: fato.optional(),
  suites: fato.optional(),
  banheiros: fato.optional(),
  vagas: fato.optional(),
  andar: fato.optional(),
});

export const esquemaDoDossie = z.strictObject({
  id: z.string().regex(/^[a-z-]+$/),
  tipo: z.enum(["aluguel", "compra"]),
  bairro: z.string(),
  fase: z.enum(["prototipo", "final"]),
  gerado_em: z.string(),
  endereco: z.strictObject({ logradouro: z.string(), numero: z.string().nullable(), ilustrativo: z.boolean() }),
  lote: z.strictObject({
    dsqfl: z.string().nullable(),
    confirmado: z.boolean(),
    centro: coordenada,
    poligono: z.array(coordenada).nullable(),
    ilustrativo_poligono: z.boolean(),
  }),
  anuncio: z.strictObject({ lido_em: z.string(), observacao: z.string(), campos: camposDoAnuncio }),
  preco: z.strictObject({ valor_m2: z.number(), regua }),
  visita: z.array(
    z.strictObject({
      texto: z.string(),
      origem: z.array(z.string()),
      escala: z.string().optional(),
      rotulo: rotulo.optional(),
    }),
  ),
  secoes: z.array(secao),
  mapa: z.strictObject({
    raios_m: z.array(z.number().int()),
    pontos: z.array(z.unknown()),
    pontos_ilustrativos: z.boolean(),
  }),
});

export const tipoDeMovimento = z.enum(["cota_inicial", "dossie", "confirmacao_lote", "feedback_pos_visita", "motivo_descarte"]);

export const esquemaDosCreditos = z.strictObject({
  observacao: z.string(),
  extrato: z.array(
    z.strictObject({
      data: z.string(),
      tipo: tipoDeMovimento,
      dossie: z.string().nullable(),
      delta: z.number().int(),
    }),
  ),
});

export type Dossie = z.infer<typeof esquemaDoDossie>;
export type Fato = z.infer<typeof fato>;
export type Fonte = z.infer<typeof fonte>;
export type Rotulo = z.infer<typeof rotulo>;
export type EstadoDoFato = z.infer<typeof estadoDoFato>;
export type Regua = z.infer<typeof regua>;
export type Secao = z.infer<typeof secao>;
export type Anel = z.infer<typeof anel>;
export type BarrasVizinhos = z.infer<typeof barrasVizinhos>;
export type CorDeCategoria = z.infer<typeof corDeCategoria>;
export type Coordenada = z.infer<typeof coordenada>;
export type CamposDoAnuncio = z.infer<typeof camposDoAnuncio>;
export type Creditos = z.infer<typeof esquemaDosCreditos>;
export type TipoDeMovimento = z.infer<typeof tipoDeMovimento>;
