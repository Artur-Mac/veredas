import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { dossiePorTexto, dossies, mapaPorId } from '@/fixtures';
import { montarVisao, precisaConfirmacao } from '@/dominio/visao';

const raiz = join(__dirname, '..');

describe('fixtures do protótipo', () => {
  it('há três dossiês, um deles de compra e um com confirmação do edifício', () => {
    expect(dossies).toHaveLength(3);
    expect(dossies.some((d) => d.anuncio.operacao === 'compra')).toBe(true);
    expect(dossies.some((d) => precisaConfirmacao(d))).toBe(true);
    expect(dossies.some((d) => d.identidade.status === 'resolvido' && d.identidade.confianca === 'alta')).toBe(true);
  });

  it('nenhuma fixture é rascunho', () => {
    const lista = readFileSync(join(raiz, 'src', 'fixtures', 'lista.ts'), 'utf8');
    expect(lista).not.toMatch(/rascunho/i);
    for (const dossie of dossies) {
      expect(JSON.stringify(dossie)).not.toMatch(/rascunho/i);
    }
  });

  it('todo dossiê tem o cartão de setorização oficial ausente do SGB', () => {
    for (const dossie of dossies) {
      const cartao = dossie.cartoes.find((c) => c.id === 'c_setorizacao');
      expect(cartao?.categoria).toBe('desconhecido');
    }
  });

  it('todo cartão com fato tem fonte e escala; nenhum valor sem origem no custo', () => {
    for (const dossie of dossies) {
      const cartoes = [...dossie.cartoes, ...Object.values(dossie.cartoes_por_candidata).flat()];
      for (const cartao of cartoes) {
        expect(cartao.fonte.length).toBeGreaterThan(0);
        if (cartao.categoria === 'registro_oficial') {
          expect(cartao.url_fonte).not.toBeNull();
        }
        if (cartao.visual?.tipo === 'custo_mensal') {
          for (const parcela of cartao.visual.parcelas) {
            const temValor = parcela.valor !== null || parcela.faixa !== null;
            expect(temValor).toBe(parcela.origem !== 'nao_informado');
          }
        }
      }
    }
  });

  it('o modo rua só mostra cartões de rua, microárea ou bairro', () => {
    for (const dossie of dossies.filter(precisaConfirmacao)) {
      const visao = montarVisao(dossie, { tipo: 'rua' });
      expect(visao.modo).toBe('rua');
      expect(visao.edificio).toBeNull();
      for (const cartao of visao.cartoes) {
        expect(['rua', 'microarea', 'bairro', 'municipio']).toContain(cartao.escala);
      }
    }
  });

  it('confirmar uma candidata gera origem humana e os cartões dela', () => {
    for (const dossie of dossies.filter(precisaConfirmacao)) {
      for (const candidata of dossie.identidade.candidatas) {
        const visao = montarVisao(dossie, { tipo: 'candidata', candidata: candidata.id });
        expect(visao.origem).toBe('humano');
        expect(visao.edificio?.dsqfl).toBe(candidata.dsqfl);
      }
    }
  });

  it('divergência de endereço ou de andar deixa a identidade em aberto', () => {
    for (const dossie of dossies) {
      const ids = new Set([...dossie.cartoes, ...Object.values(dossie.cartoes_por_candidata).flat()].map((c) => c.id));
      const identidade = dossie.perguntas.find((p) => p.id === 'q_identidade');
      if (ids.has('c_endereco') || ids.has('c_andar')) {
        expect(identidade?.status).toBe('parcial');
      }
    }
  });

  it('atendimentos da Defesa Civil valem para a rua e respondem à pergunta sobre estrutura', () => {
    for (const dossie of dossies) {
      const cartao = dossie.cartoes.find((c) => c.id === 'c_defesa_civil');
      expect(cartao?.escala).toBe('rua');
      expect(cartao?.pergunta_id).toBe('q_estrutura');
      expect(cartao?.claim).toMatch(/rua inteira/);
    }
  });

  it('sem mancha de inundação na carta, a pergunta sobre alagamento segue desconhecida', () => {
    for (const dossie of dossies.filter((d) => d.identidade.status === 'resolvido')) {
      const suscetibilidade = dossie.cartoes.find((c) => c.id === 'c_suscetibilidade');
      const alagamento = dossie.perguntas.find((p) => p.id === 'q_alagamento');
      const semMancha = suscetibilidade?.claim.includes('fora das áreas de suscetibilidade a inundação') ?? true;
      expect(alagamento?.status).toBe(semMancha ? 'desconhecida' : 'parcial');
    }
  });

  it('anúncio sem vaga não pergunta sobre a vaga', () => {
    for (const dossie of dossies.filter((d) => d.anuncio.campos_declarados.vagas === 0)) {
      expect(dossie.perguntas.some((p) => p.id === 'q_vaga')).toBe(false);
    }
  });

  it('área menor que a construída fiscal, dentro da margem, não vira inconsistência', () => {
    for (const dossie of dossies) {
      const cartoes = [...dossie.cartoes, ...Object.values(dossie.cartoes_por_candidata).flat()].filter((c) => c.id === 'c_area');
      for (const cartao of cartoes) {
        if (cartao.visual?.tipo !== 'comparacao_area') {
          throw new Error('cartão de área sem comparação');
        }
        const declarada = cartao.visual.itens.find((i) => i.categoria === 'declarado_anunciante')?.valor_m2 ?? 0;
        const cadastro = cartao.visual.itens.filter((i) => i.categoria === 'registro_oficial').map((i) => i.valor_m2);
        if (declarada <= Math.max(...cadastro) * 1.15 && declarada >= Math.min(...cadastro) * 0.7) {
          expect(cartao.categoria).toBe('registro_oficial');
        }
      }
    }
  });

  it('cada mapa tem geometria e o link de cada anúncio é reconhecido pelo código', () => {
    for (const dossie of dossies) {
      const mapa = mapaPorId(dossie.dossie_id);
      expect(mapa.edificacoes.length).toBeGreaterThan(10);
      expect(mapa.quadras.length).toBeGreaterThan(0);
      expect(dossiePorTexto(`https://exemplo.invalid/imovel/apartamento-${dossie.anuncio.codigo_anuncio}?origem=teste`)?.dossie_id).toBe(dossie.dossie_id);
    }
  });
});
