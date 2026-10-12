export interface Regra {
  nome: string;
  padrao: RegExp;
}

export const linguagemProibida: Regra[] = [
  { nome: 'adjetivo "seguro"', padrao: /\bsegur[oa]s?\b(?!\s*-?\s*(fian[cç]a|inc[eê]ndio|residencial|obrigat[oó]rio))/i },
  { nome: '"perigoso"', padrao: /\bperigos[oa]s?\b|\bperigo\b/i },
  { nome: '"vale a pena"', padrao: /\bvale\s+a\s+pena\b/i },
  { nome: '"documentação limpa"', padrao: /documenta[cç][aã]o\s+limpa/i },
  { nome: '"em ordem"', padrao: /\b(documenta[cç][aã]o|matr[ií]cula|papelada|im[oó]vel|documentos?)\s+(est[aá]\s+|est[aã]o\s+)?em\s+ordem\b/i },
  { nome: 'vocabulário de certificação', padrao: /\baudit\w*/i },
  { nome: 'parcela "oculta"', padrao: /\bocult[oa]s?\b/i },
  { nome: 'parcela "omitida"', padrao: /\bomitid[oa]s?\b/i },
  { nome: 'score', padrao: /\bscores?\b/i },
  { nome: 'nota', padrao: /\bnotas?\b/i },
  { nome: 'pontuação', padrao: /\bpontua[cç][aã]o\b/i },
  { nome: 'semáforo', padrao: /sem[aá]foro/i },
  { nome: 'veredito', padrao: /\bveredit/i },
  { nome: 'risco em porcentagem', padrao: /risco[^.\n]{0,24}\d+\s*%/i },
  { nome: 'adjetivo avaliativo', padrao: /\b(imperd[ií]vel|excelente|p[eé]ssim[oa]s?|arriscad[oa]s?|confi[aá]vel|barat[oa]s?|caro)\b/i },
  { nome: '"ótimo"', padrao: /(^|[^\p{L}])[oó]tim[oa]s?($|[^\p{L}])/iu },
  { nome: 'recomendação', padrao: /\brecomend(amos|ado|ada|amos|a-se)\b/i },
  { nome: 'garantia de resultado', padrao: /\bgarantid[oa]s?\b/i },
  { nome: '"bom negócio"', padrao: /\bbo[am]\s+(neg[oó]cio|compra|investimento|oportunidade)\b/i },
];

export const marcasDeTerceiros: Regra[] = [
  { nome: 'portal', padrao: /\bzap\b|zapim[oó]veis/i },
  { nome: 'portal', padrao: /quinto\s*andar/i },
  { nome: 'portal', padrao: /\bolx\b/i },
  { nome: 'portal', padrao: /viva\s*real/i },
  { nome: 'portal', padrao: /imovelweb/i },
  { nome: 'portal', padrao: /\bloft\b/i },
  { nome: 'portal', padrao: /chaves\s+na\s+m[aã]o|trovit|wimoveis|netim[oó]veis/i },
  { nome: 'empresa', padrao: /moura\s+dubeaux|morada\s+real/i },
  { nome: 'empresa', padrao: /\bsprift\b|zillow|first\s+street|redfin|eemovel|datazap|fipezap|qpre[cç]o/i },
  { nome: 'produto', padrao: /chatgpt|whats\s*app/i },
  { nome: 'empresa', padrao: /\banthropic\b|\bopenai\b|\bclaude\b/i },
  { nome: 'empresa', padrao: /\bCAIXA\b|caixa\s+econ[oô]mica/ },
];
