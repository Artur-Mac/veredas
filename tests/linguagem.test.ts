import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { linguagemProibida, marcasDeTerceiros, type Regra } from './regras';

const raiz = join(__dirname, '..');

function arquivosEm(pasta: string, extensoes: string[]): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) {
      return arquivosEm(caminho, extensoes);
    }
    return extensoes.includes(extname(nome)) ? [caminho] : [];
  });
}

function textosDoJson(valor: unknown): string[] {
  if (typeof valor === 'string') {
    return [valor];
  }
  if (Array.isArray(valor)) {
    return valor.flatMap(textosDoJson);
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.values(valor).flatMap(textosDoJson);
  }
  return [];
}

function violacoes(textos: { origem: string; texto: string }[], regras: Regra[]): string[] {
  return textos.flatMap(({ origem, texto }) =>
    regras.filter((regra) => regra.padrao.test(texto)).map((regra) => `${origem}: ${regra.nome} em "${texto.slice(0, 140)}"`),
  );
}

const fixtures = arquivosEm(join(raiz, 'src', 'fixtures'), ['.json']).flatMap((arquivo) =>
  textosDoJson(JSON.parse(readFileSync(arquivo, 'utf8'))).map((texto) => ({ origem: relative(raiz, arquivo), texto })),
);

const codigoDoApp = arquivosEm(join(raiz, 'src'), ['.ts', '.tsx']).map((arquivo) => ({
  origem: relative(raiz, arquivo),
  texto: readFileSync(arquivo, 'utf8'),
}));

const documentacaoAutoral = ['README.md', 'app.json', 'docs/PLANO-PROTOTIPO.md', 'docs/FIXTURES.md', 'docs/CATALOGO-DE-CARTOES.md', 'docs/PRD-PropSight.md', 'docs/CONTEXT.md', 'docs/panfleto-propsight.html']
  .map((arquivo) => join(raiz, arquivo))
  .filter((arquivo) => {
    try {
      return statSync(arquivo).isFile();
    } catch {
      return false;
    }
  })
  .map((arquivo) => ({ origem: relative(raiz, arquivo), texto: readFileSync(arquivo, 'utf8') }));

const scriptsDeDados = (() => {
  try {
    return arquivosEm(join(raiz, 'scripts', 'dados'), ['.py', '.sql', '.json', '.md']).map((arquivo) => ({
      origem: relative(raiz, arquivo),
      texto: readFileSync(arquivo, 'utf8'),
    }));
  } catch {
    return [];
  }
})();

describe('linguagem calibrada (RNF-01)', () => {
  it('existem fixtures e código para verificar', () => {
    expect(fixtures.length).toBeGreaterThan(0);
    expect(codigoDoApp.length).toBeGreaterThan(0);
  });

  it('as fixtures não usam nota, veredito, adjetivo avaliativo nem certificação', () => {
    expect(violacoes(fixtures, linguagemProibida)).toEqual([]);
  });

  it('as telas e os modelos de texto também não usam', () => {
    expect(violacoes(codigoDoApp, linguagemProibida)).toEqual([]);
  });
});

describe('marcas de terceiros (regulamento 11.20 iv)', () => {
  it('nenhum portal ou empresa aparece em telas, código, fixtures, scripts ou documentação do protótipo', () => {
    expect(violacoes([...fixtures, ...codigoDoApp, ...documentacaoAutoral, ...scriptsDeDados], marcasDeTerceiros)).toEqual([]);
  });
});

describe('o próprio teste detecta o que deve barrar', () => {
  it.each([
    ['Este imóvel é seguro.', true],
    ['IPTU e seguro-fiança não informados.', false],
    ['Taxa oculta de R$ 210.', true],
    ['Documentação limpa.', true],
    ['Risco de 30% de alagamento.', true],
    ['Boa Viagem, 10º andar.', false],
    ['Imóvel auditado.', true],
    ['Ótimo preço.', true],
  ])('"%s" barrado = %s', (texto, barrado) => {
    expect(violacoes([{ origem: 'exemplo', texto }], linguagemProibida).length > 0).toBe(barrado);
  });
});
