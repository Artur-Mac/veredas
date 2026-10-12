import { z } from 'zod';

export const categoriaSchema = z.enum([
  'registro_oficial',
  'observacao_direta',
  'declarado_anunciante',
  'inconsistencia',
  'desconhecido',
  'precisa_especialista',
]);

export const escalaSchema = z.enum(['unidade', 'edificio', 'lote', 'rua', 'microarea', 'bairro']);

export const origemParcelaSchema = z.enum(['informado_no_anuncio', 'do_cadastro_fiscal', 'nao_informado']);

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data no formato AAAA-MM-DD');

const dataReferencia = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(\/\d{4}-\d{2}-\d{2})?$/, 'data ISO ou intervalo ISO inicio/fim')
  .nullable();

const visualComparacaoArea = z.strictObject({
  tipo: z.literal('comparacao_area'),
  itens: z
    .array(
      z.strictObject({
        rotulo: z.string().min(1),
        valor_m2: z.number().positive(),
        categoria: categoriaSchema,
      }),
    )
    .min(2),
});

const visualOcorrencias = z.strictObject({
  tipo: z.literal('ocorrencias'),
  total: z.number().int().nonnegative(),
  raio_m: z.number().positive(),
  periodo: z.string().min(1),
  por_ano: z.array(z.strictObject({ ano: z.number().int(), n: z.number().int().nonnegative() })),
  por_tipo: z.array(z.strictObject({ tipo: z.string().min(1), n: z.number().int().nonnegative() })),
  sem_posicao: z.number().int().nonnegative(),
});

export const parcelaCustoSchema = z.strictObject({
  rotulo: z.string().min(1),
  valor: z.number().nonnegative().nullable(),
  faixa: z.tuple([z.number().nonnegative(), z.number().nonnegative()]).nullable(),
  origem: origemParcelaSchema,
});

const visualCustoMensal = z.strictObject({
  tipo: z.literal('custo_mensal'),
  parcelas: z.array(parcelaCustoSchema).min(1),
});

export const visualSchema = z.discriminatedUnion('tipo', [
  visualComparacaoArea,
  visualOcorrencias,
  visualCustoMensal,
]);

export const cartaoSchema = z.strictObject({
  id: z.string().min(1),
  bloco: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  categoria: categoriaSchema,
  titulo: z.string().min(1),
  resumo: z.string().min(1).max(70).optional(),
  claim: z.string().min(1),
  fonte: z.string().min(1),
  url_fonte: z.url().nullable(),
  data_ref: dataReferencia,
  data_coleta: dataIso,
  escala: escalaSchema,
  metodo: z.string().min(1),
  limitacao: z.string().min(1),
  acao: z.string().min(1),
  pergunta_id: z.string().min(1).nullable(),
  visual: visualSchema.optional(),
});

export const tipoAcaoSchema = z.enum(['documento', 'pergunta', 'visita', 'profissional']);

export const statusPerguntaSchema = z.enum(['respondida', 'parcial', 'desconhecida']);

export const perguntaSchema = z.strictObject({
  id: z.string().min(1),
  texto: z.string().min(1),
  status: statusPerguntaSchema,
  status_modo_rua: statusPerguntaSchema.optional(),
  evidencias: z.array(z.string().min(1)),
  acao: z.strictObject({ tipo: tipoAcaoSchema, texto: z.string().min(1) }),
  para_corretor: z.string().min(1).nullable(),
});

export const edificioSchema = z.strictObject({
  id: z.string().min(1),
  dsqfl: z.string().regex(/^\d{14}$/, 'código de 14 dígitos'),
  endereco_oficial: z.string().min(1),
  pavimentos: z.number().int().positive().nullable(),
  area_construida_m2: z.number().positive().nullable(),
  ano_construcao: z.number().int().min(1800).max(2100).nullable(),
  unidades: z.number().int().positive().nullable(),
  evidencias: z.array(z.string().min(1)),
});

export const camposDeclaradosSchema = z.strictObject({
  preco: z.number().nonnegative().nullable(),
  condominio: z.number().nonnegative().nullable(),
  iptu: z.number().nonnegative().nullable(),
  iptu_periodicidade: z.enum(['mensal', 'anual']).nullable(),
  area_m2: z.number().positive().nullable(),
  quartos: z.number().int().nonnegative().nullable(),
  suites: z.number().int().nonnegative().nullable(),
  banheiros: z.number().int().nonnegative().nullable(),
  vagas: z.number().int().nonnegative().nullable(),
  andar: z.number().int().nullable(),
  edificio: z.string().min(1).nullable(),
  logradouro: z.string().min(1).nullable(),
  numero: z.string().min(1).nullable(),
  complemento: z.string().min(1).nullable(),
  bairro: z.string().min(1).nullable(),
});

export const campoDeclaradoSchema = camposDeclaradosSchema.keyof();

export const dossieSchema = z
  .strictObject({
    dossie_id: z.string().regex(/^[a-z0-9-]+$/, 'identificador em minúsculas com hífens'),
    gerado_em: z.iso.datetime({ offset: true }),
    versao_metodo: z.string().min(1),
    anuncio: z.strictObject({
      operacao: z.enum(['aluguel', 'compra']),
      codigo_anuncio: z.string().regex(/^\d{6,}$/, 'código numérico do anúncio'),
      coletado_em: dataIso,
      campos_declarados: camposDeclaradosSchema,
      trechos_descricao: z.array(
        z.strictObject({ campo: z.string().min(1), texto: z.string().min(1).max(120) }),
      ),
    }),
    identidade: z.strictObject({
      status: z.enum(['resolvido', 'pendente_confirmacao']),
      confianca: z.enum(['alta', 'media', 'baixa']),
      origem: z.literal('resolvedor').nullable(),
      edificio: edificioSchema.nullable(),
      candidatas: z.array(edificioSchema),
    }),
    cartoes: z.array(cartaoSchema),
    cartoes_por_candidata: z.record(z.string(), z.array(cartaoSchema)),
    perguntas: z.array(perguntaSchema),
    resumo: z.record(z.string(), z.number().int().nonnegative()),
  })
  .superRefine((dossie, ctx) => {
    const { identidade } = dossie;
    if (identidade.status === 'resolvido' && (identidade.edificio === null || identidade.origem !== 'resolvedor')) {
      ctx.addIssue({ code: 'custom', message: 'dossiê resolvido exige edificio e origem "resolvedor"' });
    }
    if (identidade.status === 'pendente_confirmacao') {
      if (identidade.edificio !== null || identidade.candidatas.length < 2 || identidade.candidatas.length > 3) {
        ctx.addIssue({ code: 'custom', message: 'confirmação pendente exige 2 ou 3 candidatas e edificio nulo' });
      }
      const chaves = Object.keys(dossie.cartoes_por_candidata).sort().join(',');
      const ids = identidade.candidatas.map((c) => c.id).sort().join(',');
      if (chaves !== ids) {
        ctx.addIssue({ code: 'custom', message: `cartoes_por_candidata (${chaves}) difere das candidatas (${ids})` });
      }
    }
    const todosCartoes = [...dossie.cartoes, ...Object.values(dossie.cartoes_por_candidata).flat()];
    const idsPerguntas = new Set(dossie.perguntas.map((p) => p.id));
    for (const cartao of todosCartoes) {
      if (cartao.pergunta_id !== null && !idsPerguntas.has(cartao.pergunta_id)) {
        ctx.addIssue({ code: 'custom', message: `cartão ${cartao.id} aponta para pergunta inexistente ${cartao.pergunta_id}` });
      }
    }
    const idsGerais = dossie.cartoes.map((c) => c.id);
    if (new Set(idsGerais).size !== idsGerais.length) {
      ctx.addIssue({ code: 'custom', message: 'ids de cartões repetidos em cartoes' });
    }
    const idsCartoes = new Set(todosCartoes.map((c) => c.id));
    for (const pergunta of dossie.perguntas) {
      for (const evidencia of pergunta.evidencias) {
        if (!idsCartoes.has(evidencia)) {
          ctx.addIssue({ code: 'custom', message: `pergunta ${pergunta.id} cita cartão inexistente ${evidencia}` });
        }
      }
    }
  });

const ponto = z.tuple([z.number(), z.number()]);
const anel = z.array(ponto).min(3);

export const mapaSchema = z.strictObject({
  dossie_id: z.string().min(1),
  crs: z.literal('EPSG:31985'),
  origem_utm: ponto,
  origem_wgs84: ponto,
  lado_m: z.number().positive(),
  fonte: z.string().min(1),
  data_ref: dataIso,
  quadras: z.array(anel),
  edificacoes: z.array(anel),
  logradouros: z.array(z.strictObject({ nome: z.string().min(1), pontos: z.array(ponto).min(2) })),
  alvos: z.array(z.strictObject({ id: z.string().min(1), dsqfl: z.string().regex(/^\d{14}$/), pontos: anel })),
  ocorrencias: z.array(
    z.strictObject({
      x: z.number(),
      y: z.number(),
      ano: z.number().int(),
      tipo: z.string().min(1),
      n: z.number().int().positive(),
    }),
  ),
  centro_raio: ponto,
  raio_m: z.number().positive(),
  suscetibilidade: z.array(
    z.strictObject({ tipo: z.string().min(1), classe: z.string().min(1), pontos: anel }),
  ),
});

export type Categoria = z.infer<typeof categoriaSchema>;
export type Escala = z.infer<typeof escalaSchema>;
export type OrigemParcela = z.infer<typeof origemParcelaSchema>;
export type ParcelaCusto = z.infer<typeof parcelaCustoSchema>;
export type Visual = z.infer<typeof visualSchema>;
export type Cartao = z.infer<typeof cartaoSchema>;
export type TipoAcao = z.infer<typeof tipoAcaoSchema>;
export type StatusPergunta = z.infer<typeof statusPerguntaSchema>;
export type Pergunta = z.infer<typeof perguntaSchema>;
export type Edificio = z.infer<typeof edificioSchema>;
export type CamposDeclarados = z.infer<typeof camposDeclaradosSchema>;
export type CampoDeclarado = z.infer<typeof campoDeclaradoSchema>;
export type Dossie = z.infer<typeof dossieSchema>;
export type Mapa = z.infer<typeof mapaSchema>;
export type Ponto = z.infer<typeof ponto>;
