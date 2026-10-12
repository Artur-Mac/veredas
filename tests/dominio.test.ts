import { area, dataReferencia, enderecoCurto, faixaMoeda, moeda } from '@/dominio/formato';
import { extrairCodigoAnuncio, pareceLinkDeAnuncio } from '@/dominio/link';
import { andarEfetivo } from '@/dominio/camposDeclarados';
import { chaveDaResolucao, custoDosCamposDeclarados, montarVisao, precisaConfirmacao } from '@/dominio/visao';
import { posicoesDosSelos } from '@/componentes/mapa/geometria';
import { dossies } from '@/fixtures';

describe('código do anúncio a partir do link', () => {
  it.each([
    ['https://portal.exemplo/imovel/aluguel-apartamento-3-quartos-80m2-id-2916594307/?source=ranking', '2916594307'],
    ['Veja este: https://m.exemplo.com/grande-recife/imoveis/edf-x-apto-1005-1541528320', '1541528320'],
    ['https://www.exemplo.com.br/imovel/893547852/alugar/apartamento?utm_source=shared', '893547852'],
    ['texto sem link e sem número', null],
  ])('%s → %s', (texto, esperado) => {
    expect(extrairCodigoAnuncio(texto)).toBe(esperado);
  });

  it('só considera link de anúncio uma URL com código numérico no caminho', () => {
    expect(pareceLinkDeAnuncio('https://exemplo.com/imovel/1234567')).toBe(true);
    expect(pareceLinkDeAnuncio('https://exemplo.com/sobre?id=1234567')).toBe(false);
    expect(pareceLinkDeAnuncio('1234567')).toBe(false);
  });
});

describe('formatos', () => {
  it('moeda e área no padrão brasileiro', () => {
    expect(moeda(2800)).toBe('R$ 2.800');
    expect(moeda(1234.5)).toBe('R$ 1.234,50');
    expect(faixaMoeda(80.4, 110.2)).toBe('R$ 80 a R$ 110');
    expect(area(84.5)).toBe('84,5 m²');
  });

  it('datas de referência', () => {
    expect(dataReferencia('2021-01-01/2024-12-31')).toBe('2021–2024');
    expect(dataReferencia('2026-01-01/2026-12-31')).toBe('2026');
    expect(dataReferencia('2026-03-02')).toBe('2 mar. 2026');
    expect(dataReferencia(null)).toBe('sem data de referência');
  });

  it('endereço oficial curto', () => {
    expect(enderecoCurto('Rua Rocha Pombo, 42, Estância, Recife - Pernambuco, CEP 50865-090')).toBe('Rua Rocha Pombo, 42, Estância');
    expect(enderecoCurto('Rua Ipojuca, , Areias, Recife - Pernambuco')).toBe('Rua Ipojuca, Areias');
  });
});

describe('regras do dossiê', () => {
  const [dossie] = dossies;
  if (dossie === undefined) {
    throw new Error('sem fixtures');
  }

  it('andar efetivo usa a correção do usuário quando existe', () => {
    expect(andarEfetivo(dossie, '3º')).toBe(3);
    expect(andarEfetivo(dossie, 'térreo')).toBeNull();
    expect(andarEfetivo(dossie, undefined)).toBe(dossie.anuncio.campos_declarados.andar);
  });

  it('IPTU sem periodicidade não vira valor mensal', () => {
    const campos = { ...dossie.anuncio.campos_declarados, iptu: 2000, iptu_periodicidade: null };
    const iptu = custoDosCamposDeclarados(campos).find((p) => p.rotulo === 'IPTU');
    expect(iptu?.valor).toBeNull();
    expect(iptu?.origem).toBe('nao_informado');
  });

  it('a mensagem editada é guardada por escolha de prédio', () => {
    const pendente = dossies.find(precisaConfirmacao);
    if (pendente === undefined) {
      throw new Error('sem dossiê pendente');
    }
    const chaves = pendente.identidade.candidatas.map((c) => chaveDaResolucao(montarVisao(pendente, { tipo: 'candidata', candidata: c.id })));
    expect(new Set([...chaves, chaveDaResolucao(montarVisao(pendente, { tipo: 'rua' }))]).size).toBe(chaves.length + 1);
  });
});

describe('selos de atendimentos no mapa', () => {
  const borda = { centro: [0, 0] as [number, number], raio: 150 };

  it('ficam fora do raio, na saída da rua', () => {
    const [selo] = posicoesDosSelos([[[[-150, 0], [0, 0]]]], [], 20, borda, 9, []);
    expect(selo?.[0]).toBeCloseTo(-159);
    expect(selo?.[1]).toBeCloseTo(0);
  });

  it('evitam áreas bloqueadas e usam a outra ponta da rua', () => {
    const bloqueio = { minX: -200, maxX: -140, minY: -10, maxY: 10 };
    const [selo] = posicoesDosSelos([[[[-150, 0], [150, 0]]]], [], 20, borda, 9, [bloqueio]);
    expect(selo?.[0]).toBeCloseTo(159);
  });
});
