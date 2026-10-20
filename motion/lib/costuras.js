// Quadros de emenda entre cenas construídas em paralelo (18/10/2026).
// Cada costura é o último quadro de uma cena e o primeiro da seguinte: papel com a grade de 48 px
// (a mesma `.grade` das cenas 05 a 09) e as formas abaixo, desenhadas por `desenharCostura` num
// <svg class="camada" viewBox="0 0 1920 1080"> posto logo acima da grade. Nada mais no quadro:
// sem rodapé, sem marca, sem cursor.
//
// Regra: as duas cenas vizinhas desenham a costura com esta função e conferem o quadro por diff de
// PNG contra `motion/poc/costura.html?id=<ID>` (0 px diferentes). Não mude estes números sem avisar
// as duas cenas. As costuras 04→05 (`subsolo.js`) e 09→10 (`cena09.html`, POC.saida) já existem
// e não estão aqui, exceto a 09→10 repetida como referência.

export const COSTURAS = {
  // cena 02 → cena 03: as quatro marcas viram quatro pontos ferrugem numa linha de base
  'C02-03': {
    linhas: [{ d: 'M360 760 L1560 760', cor: '#171717', largura: 2 }],
    pontos: [
      { x: 840, y: 760, r: 11, cor: '#B94E36' },
      { x: 920, y: 760, r: 11, cor: '#B94E36' },
      { x: 1000, y: 760, r: 11, cor: '#B94E36' },
      { x: 1080, y: 760, r: 11, cor: '#B94E36' },
    ],
  },
  // cena 03 → cena 04: a linha do chão da quadra (vira o plano de corte) e o ponto "você" na calçada
  'C03-04': {
    linhas: [{ d: 'M-20 540 L1940 540', cor: '#171717', largura: 3 }],
    pontos: [{ x: 960, y: 528, r: 12, cor: '#171717' }],
  },
  // cena 09 → cena 10 (já definida pela cena 09; repetida aqui só como referência)
  'C09-10': {
    linhas: [{ d: 'M240 900 L1680 900', cor: '#F47745', largura: 4.2 }],
    pontos: [],
  },
  // cena 10 → cena 11: a régua de 1 a 5 se estende e vira a linha do tempo
  'C10-11': {
    linhas: [{ d: 'M160 860 L1760 860', cor: '#F47745', largura: 4.2 }],
    pontos: [],
  },
  // cena 11 → cena 12: a linha deixa a rua e assenta reta; a cena 12 desenha a moldura da foto a partir dela
  'C11-12': {
    linhas: [{ d: 'M300 930 L1620 930', cor: '#F47745', largura: 4.2 }],
    pontos: [],
  },
};

const NS = 'http://www.w3.org/2000/svg';

// Desenha a costura `id` dentro de `svg` e devolve os elementos, para a cena animá-los
// (no quadro da emenda, os atributos têm de voltar exatamente a estes valores).
export function desenharCostura(id, svg) {
  const c = COSTURAS[id];
  if (!c) throw new Error('costura desconhecida: ' + id);
  const linhas = c.linhas.map((l) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', l.d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', l.cor);
    p.setAttribute('stroke-width', String(l.largura));
    p.setAttribute('stroke-linecap', 'round');
    svg.appendChild(p);
    return p;
  });
  const pontos = c.pontos.map((q) => {
    const e = document.createElementNS(NS, 'circle');
    e.setAttribute('cx', String(q.x));
    e.setAttribute('cy', String(q.y));
    e.setAttribute('r', String(q.r));
    e.setAttribute('fill', q.cor);
    svg.appendChild(e);
    return e;
  });
  return { linhas, pontos };
}
