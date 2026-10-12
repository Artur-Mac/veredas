import { area, numero, plural } from './formato';
import type { Cartao, Dossie } from './esquema';

export interface Etapa {
  id: string;
  titulo: string;
  resultado: string;
}

function cartaoPorId(cartoes: Cartao[], id: string): Cartao | null {
  return cartoes.find((c) => c.id === id) ?? null;
}

function resumoDoCartao(cartao: Cartao | null, semCartao: string): string {
  if (cartao === null) {
    return semCartao;
  }
  if (cartao.resumo !== undefined) {
    return cartao.resumo;
  }
  if (cartao.visual?.tipo === 'ocorrencias') {
    return `${plural(cartao.visual.total, 'atendimento', 'atendimentos')} nas ruas a até ${cartao.visual.raio_m} m`;
  }
  return cartao.titulo;
}

export function etapasDoPipeline(dossie: Dossie): Etapa[] {
  const { identidade, anuncio } = dossie;
  const camposPreenchidos = Object.entries(anuncio.campos_declarados).filter(
    ([campo, valor]) => campo !== 'iptu_periodicidade' && valor !== null,
  ).length;
  const cartoesCandidatas = Object.values(dossie.cartoes_por_candidata).flat();
  const todos = [...dossie.cartoes, ...cartoesCandidatas];
  const inconsistencias = new Set(todos.filter((c) => c.categoria === 'inconsistencia').map((c) => c.id)).size;
  const emAberto = dossie.perguntas.filter((p) => p.status !== 'respondida').length;
  const edificio = identidade.edificio;
  const candidatas = identidade.candidatas.length;

  const cadastro =
    edificio === null
      ? `${plural(candidatas, 'edificação compatível', 'edificações compatíveis')} na rua`
      : [
          edificio.pavimentos === null ? null : plural(edificio.pavimentos, 'pavimento', 'pavimentos'),
          edificio.area_construida_m2 === null ? null : `${area(Math.round(edificio.area_construida_m2))} construídos`,
        ]
          .filter((parte): parte is string => parte !== null)
          .join(' · ');

  const fiscal =
    edificio === null
      ? 'consultado para cada candidata'
      : [
          edificio.unidades === null ? null : plural(edificio.unidades, 'unidade', 'unidades'),
          edificio.ano_construcao === null ? null : `construção de ${edificio.ano_construcao}`,
        ]
          .filter((parte): parte is string => parte !== null)
          .join(' · ');

  return [
    { id: 'anuncio', titulo: 'Anúncio lido', resultado: `${numero(camposPreenchidos)} campos declarados` },
    {
      id: 'edificio',
      titulo: 'Edifício resolvido',
      resultado:
        identidade.status === 'resolvido'
          ? 'identificado automaticamente, confiança alta'
          : `${plural(candidatas, 'candidata', 'candidatas')}, falta a sua confirmação`,
    },
    { id: 'cadastro', titulo: 'Cadastro de edificações', resultado: cadastro.length > 0 ? cadastro : 'sem dados no cadastro' },
    { id: 'fiscal', titulo: 'Cadastro fiscal', resultado: fiscal.length > 0 ? fiscal : 'sem unidades no cadastro' },
    {
      id: 'defesa',
      titulo: 'Defesa Civil',
      resultado: resumoDoCartao(cartaoPorId(todos, 'c_defesa_civil'), 'base não consultada'),
    },
    {
      id: 'suscetibilidade',
      titulo: 'Suscetibilidade',
      resultado: resumoDoCartao(cartaoPorId(todos, 'c_suscetibilidade'), 'carta não consultada'),
    },
    {
      id: 'consistencia',
      titulo: 'Consistência',
      resultado:
        inconsistencias === 0
          ? 'nenhuma divergência entre anúncio e cadastros'
          : `${plural(inconsistencias, 'divergência', 'divergências')} entre anúncio e cadastros`,
    },
    {
      id: 'desconhecidos',
      titulo: 'Desconhecidos',
      resultado: `${plural(emAberto, 'pergunta', 'perguntas')} sem resposta completa`,
    },
  ];
}
