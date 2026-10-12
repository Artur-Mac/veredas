import { rotuloCampo } from '@/textos/rotulos';

import type { CampoDeclarado, Dossie } from './esquema';
import { area, moeda } from './formato';

export interface CampoExibido {
  campo: CampoDeclarado;
  rotulo: string;
  valor: string | null;
}

const ordem: CampoDeclarado[] = [
  'preco',
  'condominio',
  'iptu',
  'area_m2',
  'quartos',
  'suites',
  'banheiros',
  'vagas',
  'andar',
  'edificio',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
];

function formatar(dossie: Dossie, campo: CampoDeclarado): string | null {
  const c = dossie.anuncio.campos_declarados;
  switch (campo) {
    case 'preco':
      if (c.preco === null) {
        return null;
      }
      return dossie.anuncio.operacao === 'aluguel' ? `${moeda(c.preco)} por mês` : moeda(c.preco);
    case 'condominio':
      if (c.condominio === null) {
        return null;
      }
      return c.condominio === 0 ? 'isento (R$ 0)' : `${moeda(c.condominio)} por mês`;
    case 'iptu':
      if (c.iptu === null) {
        return null;
      }
      return c.iptu_periodicidade === 'anual' ? `${moeda(c.iptu)} por ano` : `${moeda(c.iptu)} por mês`;
    case 'area_m2':
      return c.area_m2 === null ? null : area(c.area_m2);
    case 'andar':
      return c.andar === null ? null : `${c.andar}º`;
    case 'iptu_periodicidade':
      return c.iptu_periodicidade;
    default: {
      const valor = c[campo];
      return valor === null ? null : String(valor);
    }
  }
}

export function camposExibidos(dossie: Dossie): CampoExibido[] {
  return ordem.map((campo) => ({
    campo,
    rotulo: campo === 'preco' ? (dossie.anuncio.operacao === 'aluguel' ? 'Aluguel' : 'Preço de venda') : rotuloCampo[campo],
    valor: formatar(dossie, campo),
  }));
}
