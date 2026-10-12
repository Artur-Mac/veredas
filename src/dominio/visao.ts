import type {
  CamposDeclarados,
  Cartao,
  Categoria,
  Dossie,
  Edificio,
  ParcelaCusto,
  Pergunta,
  StatusPergunta,
} from './esquema';

export type Resolucao = { tipo: 'candidata'; candidata: string } | { tipo: 'rua' };

export type OrigemIdentidade = 'resolvedor' | 'humano';

export type Bloco = 1 | 2 | 3 | 4;

export interface PerguntaEfetiva extends Pergunta {
  statusEfetivo: StatusPergunta;
}

export interface VisaoDossie {
  dossie: Dossie;
  modo: 'identificado' | 'rua';
  origem: OrigemIdentidade | null;
  edificio: Edificio | null;
  cartoes: Cartao[];
  cartoesPorBloco: Record<Bloco, Cartao[]>;
  perguntas: PerguntaEfetiva[];
  custo: ParcelaCusto[];
  contagem: Record<Categoria, number>;
}

const escalasDeRua = new Set(['rua', 'microarea', 'bairro']);

export const categoriasEmOrdem: Categoria[] = [
  'registro_oficial',
  'observacao_direta',
  'declarado_anunciante',
  'inconsistencia',
  'desconhecido',
  'precisa_especialista',
];

export function precisaConfirmacao(dossie: Dossie): boolean {
  return dossie.identidade.status === 'pendente_confirmacao';
}

export function resolucaoValida(dossie: Dossie, resolucao: Resolucao | null): Resolucao | null {
  if (resolucao === null || !precisaConfirmacao(dossie)) {
    return null;
  }
  if (resolucao.tipo === 'rua') {
    return resolucao;
  }
  const existe = dossie.identidade.candidatas.some((c) => c.id === resolucao.candidata);
  return existe ? resolucao : null;
}

function mesclarPorId(base: Cartao[], sobrepostos: Cartao[]): Cartao[] {
  const idsSobrepostos = new Set(sobrepostos.map((c) => c.id));
  return [...base.filter((c) => !idsSobrepostos.has(c.id)), ...sobrepostos];
}

export function custoDosCamposDeclarados(campos: CamposDeclarados): ParcelaCusto[] {
  const iptuMensal =
    campos.iptu === null ? null : campos.iptu_periodicidade === 'anual' ? campos.iptu / 12 : campos.iptu;
  const parcela = (rotulo: string, valor: number | null): ParcelaCusto => ({
    rotulo,
    valor,
    faixa: null,
    origem: valor === null ? 'nao_informado' : 'informado_no_anuncio',
  });
  return [
    parcela('Aluguel', campos.preco),
    parcela('Condomínio', campos.condominio),
    parcela('IPTU', iptuMensal),
    parcela('Seguro-fiança', null),
  ];
}

function custoDoAnuncio(dossie: Dossie, cartoes: Cartao[]): ParcelaCusto[] {
  for (const cartao of cartoes) {
    if (cartao.visual?.tipo === 'custo_mensal') {
      return cartao.visual.parcelas;
    }
  }
  const declarado = custoDosCamposDeclarados(dossie.anuncio.campos_declarados);
  if (dossie.anuncio.operacao === 'compra') {
    return declarado.filter((p) => p.rotulo !== 'Aluguel' && p.rotulo !== 'Seguro-fiança');
  }
  return declarado;
}

function contar(cartoes: Cartao[]): Record<Categoria, number> {
  const contagem: Record<Categoria, number> = {
    registro_oficial: 0,
    observacao_direta: 0,
    declarado_anunciante: 0,
    inconsistencia: 0,
    desconhecido: 0,
    precisa_especialista: 0,
  };
  for (const cartao of cartoes) {
    contagem[cartao.categoria] += 1;
  }
  return contagem;
}

export function montarVisao(dossie: Dossie, resolucao: Resolucao | null): VisaoDossie {
  const valida = resolucaoValida(dossie, resolucao);
  let modo: VisaoDossie['modo'] = 'identificado';
  let origem: OrigemIdentidade | null = null;
  let edificio: Edificio | null = null;
  let cartoes: Cartao[] = dossie.cartoes;

  if (dossie.identidade.status === 'resolvido') {
    origem = 'resolvedor';
    edificio = dossie.identidade.edificio;
  } else if (valida?.tipo === 'candidata') {
    origem = 'humano';
    edificio = dossie.identidade.candidatas.find((c) => c.id === valida.candidata) ?? null;
    cartoes = mesclarPorId(dossie.cartoes, dossie.cartoes_por_candidata[valida.candidata] ?? []);
  } else {
    modo = 'rua';
    cartoes = dossie.cartoes.filter((c) => escalasDeRua.has(c.escala));
  }

  const cartoesPorBloco: Record<Bloco, Cartao[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const cartao of cartoes) {
    cartoesPorBloco[cartao.bloco].push(cartao);
  }

  const perguntas: PerguntaEfetiva[] = dossie.perguntas.map((p) => ({
    ...p,
    statusEfetivo: modo === 'rua' ? (p.status_modo_rua ?? p.status) : p.status,
  }));

  return {
    dossie,
    modo,
    origem,
    edificio,
    cartoes,
    cartoesPorBloco,
    perguntas,
    custo: custoDoAnuncio(dossie, cartoes),
    contagem: contar(cartoes),
  };
}

export function perguntasEmAberto(visao: VisaoDossie): PerguntaEfetiva[] {
  return visao.perguntas.filter((p) => p.statusEfetivo !== 'respondida');
}

export function itensDoRoteiro(visao: VisaoDossie): PerguntaEfetiva[] {
  return perguntasEmAberto(visao).filter((p) => p.acao.tipo === 'visita');
}

export function cartaoDaVisao(visao: VisaoDossie, cartaoId: string): Cartao | null {
  return visao.cartoes.find((c) => c.id === cartaoId) ?? null;
}
