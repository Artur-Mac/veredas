import type { CampoDeclarado, Categoria, Escala, OrigemParcela, StatusPergunta, TipoAcao } from '@/dominio/esquema';
import type { EstadoDossie, PreferenciaTema } from '@/estado/armazenamento';
import type { Bloco } from '@/dominio/visao';

export const nomeProduto = 'PropSight';

export const rotuloCategoria: Record<Categoria, string> = {
  registro_oficial: 'registro oficial',
  observacao_direta: 'observação direta',
  declarado_anunciante: 'declarado pelo anunciante',
  inconsistencia: 'inconsistência',
  desconhecido: 'desconhecido',
  precisa_especialista: 'precisa de especialista',
};

export const rotuloCategoriaPlural: Record<Categoria, [string, string]> = {
  registro_oficial: ['registro oficial', 'registros oficiais'],
  observacao_direta: ['observação direta', 'observações diretas'],
  declarado_anunciante: ['declaração do anunciante', 'declarações do anunciante'],
  inconsistencia: ['inconsistência', 'inconsistências'],
  desconhecido: ['desconhecido', 'desconhecidos'],
  precisa_especialista: ['caso para especialista', 'casos para especialista'],
};

export const explicacaoCategoria: Record<Categoria, string> = {
  registro_oficial: 'Consta em base pública, com data e escala declaradas.',
  observacao_direta: 'Medido por geometria ou cálculo reproduzível.',
  declarado_anunciante: 'Veio do anúncio e ainda não foi verificado.',
  inconsistencia: 'Duas fontes discordam. Mostramos as duas.',
  desconhecido: 'Não sabemos, e dizemos como descobrir.',
  precisa_especialista: 'Indício que pede avaliação profissional.',
};

export const rotuloEscala: Record<Escala, string> = {
  unidade: 'a unidade',
  edificio: 'o prédio',
  lote: 'o lote',
  rua: 'a rua',
  microarea: 'as ruas em volta',
  bairro: 'o bairro',
  municipio: 'a cidade',
};

export const rotuloOrigemParcela: Record<OrigemParcela, string> = {
  informado_no_anuncio: 'informado no anúncio',
  do_cadastro_fiscal: 'do cadastro fiscal',
  nao_informado: 'não informado',
};

export const rotuloStatusPergunta: Record<StatusPergunta, string> = {
  respondida: 'respondida',
  parcial: 'resposta parcial',
  desconhecida: 'sem resposta',
};

export const rotuloTipoAcao: Record<TipoAcao, string> = {
  documento: 'Peça o documento',
  pergunta: 'Pergunte ao corretor',
  visita: 'Confira na visita',
  profissional: 'Procure um profissional',
};

export const blocos: Record<Bloco, { titulo: string; subtitulo: string }> = {
  1: { titulo: 'Identidade', subtitulo: 'Qual é o prédio e como chegamos a ele.' },
  2: { titulo: 'Registros oficiais', subtitulo: 'O que bases públicas dizem sobre o prédio e a rua.' },
  3: {
    titulo: 'O que o anúncio declara e o que não bate',
    subtitulo: 'Campos do anúncio, custo mensal e divergências entre fontes.',
  },
  4: {
    titulo: 'O que ainda não sabemos',
    subtitulo: 'Cada lacuna vira um documento a pedir, uma pergunta ou um item de visita.',
  },
};

export const rotuloEstadoDossie: Record<EstadoDossie, string> = {
  em_analise: 'em análise',
  visita_marcada: 'visita marcada',
  visitado: 'visitado',
  descartado: 'descartado',
  fechado: 'fechado',
};

export const rotuloPreferenciaTema: Record<PreferenciaTema, string> = {
  sistema: 'Sistema',
  claro: 'Claro',
  escuro: 'Escuro',
};

export const rotuloCampo: Record<CampoDeclarado, string> = {
  preco: 'Preço',
  condominio: 'Condomínio',
  iptu: 'IPTU',
  iptu_periodicidade: 'Periodicidade do IPTU',
  area_m2: 'Área',
  quartos: 'Quartos',
  suites: 'Suítes',
  banheiros: 'Banheiros',
  vagas: 'Vagas',
  andar: 'Andar',
  edificio: 'Edifício',
  logradouro: 'Rua',
  numero: 'Número',
  complemento: 'Complemento',
  bairro: 'Bairro',
};

export const rotuloOperacao = {
  aluguel: 'aluguel',
  compra: 'compra',
} as const;
