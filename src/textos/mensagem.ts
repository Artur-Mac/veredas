import { perguntasEmAberto, type VisaoDossie } from '@/dominio/visao';

export interface PartesMensagem {
  perguntas: string[];
  documentos: string[];
}

export function partesDaMensagem(visao: VisaoDossie): PartesMensagem {
  const abertas = perguntasEmAberto(visao).filter((p) => p.para_corretor !== null);
  return {
    perguntas: abertas.filter((p) => p.acao.tipo !== 'documento').map((p) => p.para_corretor ?? ''),
    documentos: abertas.filter((p) => p.acao.tipo === 'documento').map((p) => p.para_corretor ?? ''),
  };
}

function descricaoDoImovel(visao: VisaoDossie): string {
  const { operacao, campos_declarados: campos } = visao.dossie.anuncio;
  const finalidade = operacao === 'aluguel' ? 'para alugar' : 'à venda';
  const local = [campos.logradouro === null ? null : `na ${campos.logradouro}`, campos.bairro === null ? null : `em ${campos.bairro}`]
    .filter((parte): parte is string => parte !== null)
    .join(', ');
  return local.length > 0 ? `do apartamento ${finalidade} ${local}` : `do apartamento ${finalidade}`;
}

export function montarMensagem(visao: VisaoDossie): string {
  const { perguntas, documentos } = partesDaMensagem(visao);
  const linhas = [`Olá! Vi o anúncio ${descricaoDoImovel(visao)}. Antes de marcar a visita, queria confirmar alguns pontos:`, ''];
  perguntas.forEach((pergunta, indice) => {
    linhas.push(`${indice + 1}. ${pergunta}`);
  });
  if (documentos.length > 0) {
    linhas.push('', 'Se possível, me envie também:');
    for (const documento of documentos) {
      linhas.push(`• ${documento}`);
    }
  }
  linhas.push('', 'Obrigado!');
  return linhas.join('\n');
}
