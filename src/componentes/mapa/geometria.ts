import type { Mapa, Ponto } from '@/dominio/esquema';

export interface Caixa {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Enquadramento {
  viewBox: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
  pixelsPorMetro: number;
}

export function caminhoDoAnel(anel: Ponto[]): string {
  return `${anel.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(-y).toFixed(1)}`).join('')}Z`;
}

export function caminhoDosAneis(aneis: Ponto[][]): string {
  return aneis.map(caminhoDoAnel).join('');
}

export function caminhoDaLinha(pontos: Ponto[]): string {
  return pontos.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(-y).toFixed(1)}`).join('');
}

export function caixaDosPontos(pontos: Ponto[]): Caixa {
  return pontos.reduce<Caixa>(
    (caixa, [x, y]) => ({
      minX: Math.min(caixa.minX, x),
      minY: Math.min(caixa.minY, y),
      maxX: Math.max(caixa.maxX, x),
      maxY: Math.max(caixa.maxY, y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
}

export function centroide(anel: Ponto[]): Ponto {
  let areaDupla = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < anel.length; i += 1) {
    const atual = anel[i];
    const proximo = anel[(i + 1) % anel.length];
    if (atual === undefined || proximo === undefined) {
      continue;
    }
    const cruzado = atual[0] * proximo[1] - proximo[0] * atual[1];
    areaDupla += cruzado;
    cx += (atual[0] + proximo[0]) * cruzado;
    cy += (atual[1] + proximo[1]) * cruzado;
  }
  if (Math.abs(areaDupla) < 1e-6) {
    const caixa = caixaDosPontos(anel);
    return [(caixa.minX + caixa.maxX) / 2, (caixa.minY + caixa.maxY) / 2];
  }
  return [cx / (3 * areaDupla), cy / (3 * areaDupla)];
}

export function caixaDeFoco(mapa: Mapa, alvos: string[], incluirRaio: boolean): Caixa {
  const pontos: Ponto[] = mapa.alvos.filter((a) => alvos.includes(a.id)).flatMap((a) => a.pontos);
  if (incluirRaio) {
    const [cx, cy] = mapa.centro_raio;
    pontos.push([cx - mapa.raio_m, cy - mapa.raio_m], [cx + mapa.raio_m, cy + mapa.raio_m]);
  }
  if (pontos.length === 0) {
    const metade = mapa.lado_m / 4;
    return { minX: -metade, minY: -metade, maxX: metade, maxY: metade };
  }
  return caixaDosPontos(pontos);
}

export function enquadrar(caixa: Caixa, largura: number, altura: number, margem: number, limite: number): Enquadramento {
  const proporcao = largura / altura;
  const larguraFoco = (caixa.maxX - caixa.minX) * (1 + margem * 2);
  const alturaFoco = (caixa.maxY - caixa.minY) * (1 + margem * 2);
  let larguraVista = Math.max(larguraFoco, alturaFoco * proporcao, 80);
  let alturaVista = larguraVista / proporcao;
  if (alturaVista > limite) {
    alturaVista = limite;
    larguraVista = alturaVista * proporcao;
  }
  const centroX = (caixa.minX + caixa.maxX) / 2;
  const centroY = -(caixa.minY + caixa.maxY) / 2;
  const x = centroX - larguraVista / 2;
  const y = centroY - alturaVista / 2;
  return {
    viewBox: `${x.toFixed(1)} ${y.toFixed(1)} ${larguraVista.toFixed(1)} ${alturaVista.toFixed(1)}`,
    x,
    y,
    largura: larguraVista,
    altura: alturaVista,
    pixelsPorMetro: largura / larguraVista,
  };
}

export function paraTela(ponto: Ponto, quadro: Enquadramento): { x: number; y: number } {
  return {
    x: (ponto[0] - quadro.x) * quadro.pixelsPorMetro,
    y: (-ponto[1] - quadro.y) * quadro.pixelsPorMetro,
  };
}

const abreviacoes: Record<string, string> = {
  RUA: 'R.',
  AVENIDA: 'Av.',
  TRAVESSA: 'Tv.',
  ESTRADA: 'Estr.',
  PRACA: 'Pça.',
  PRAÇA: 'Pça.',
  LARGO: 'Lg.',
  VILA: 'Vila',
  ALAMEDA: 'Al.',
  BECO: 'Beco',
  CAIS: 'Cais',
};

const minusculas = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E']);

export function nomeDeRua(nome: string): string {
  const palavras = nome.trim().split(/\s+/);
  return palavras
    .map((palavra, indice) => {
      const maiuscula = palavra.toUpperCase();
      if (indice === 0 && abreviacoes[maiuscula] !== undefined) {
        return abreviacoes[maiuscula];
      }
      if (indice > 0 && minusculas.has(maiuscula)) {
        return maiuscula.toLowerCase();
      }
      return maiuscula.charAt(0) + maiuscula.slice(1).toLowerCase();
    })
    .join(' ');
}

export interface RotuloDeRua {
  nome: string;
  x: number;
  y: number;
  angulo: number;
  comprimento: number;
}

function dentro(ponto: Ponto, quadro: Enquadramento): boolean {
  const ySvg = -ponto[1];
  return ponto[0] >= quadro.x && ponto[0] <= quadro.x + quadro.largura && ySvg >= quadro.y && ySvg <= quadro.y + quadro.altura;
}

export function rotulosDeRua(mapa: Mapa, quadro: Enquadramento, maximo: number, evitar: Ponto[] = []): RotuloDeRua[] {
  const melhorPorNome = new Map<string, RotuloDeRua>();
  const folgaAlvo = 34 / quadro.pixelsPorMetro;
  const folgaRotulo = 46 / quadro.pixelsPorMetro;
  const longeDoAlvo = (meio: Ponto) => evitar.every(([x, y]) => Math.hypot(meio[0] - x, meio[1] - y) > folgaAlvo);
  for (const logradouro of mapa.logradouros) {
    for (let i = 0; i < logradouro.pontos.length - 1; i += 1) {
      const a = logradouro.pontos[i];
      const b = logradouro.pontos[i + 1];
      if (a === undefined || b === undefined) {
        continue;
      }
      const meio: Ponto = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (!dentro(meio, quadro) || !longeDoAlvo(meio)) {
        continue;
      }
      const comprimento = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const atual = melhorPorNome.get(logradouro.nome);
      if (atual !== undefined && atual.comprimento >= comprimento) {
        continue;
      }
      let angulo = (Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI;
      if (angulo > 90) {
        angulo -= 180;
      } else if (angulo < -90) {
        angulo += 180;
      }
      melhorPorNome.set(logradouro.nome, { nome: nomeDeRua(logradouro.nome), x: meio[0], y: -meio[1], angulo, comprimento });
    }
  }
  const escolhidos: RotuloDeRua[] = [];
  const candidatos = [...melhorPorNome.values()]
    .filter((r) => r.comprimento > quadro.largura * 0.12)
    .sort((r1, r2) => r2.comprimento - r1.comprimento);
  for (const candidato of candidatos) {
    const colide = escolhidos.some((r) => Math.hypot(r.x - candidato.x, r.y - candidato.y) < folgaRotulo);
    if (!colide) {
      escolhidos.push(candidato);
    }
    if (escolhidos.length >= maximo) {
      break;
    }
  }
  return escolhidos;
}
