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

function comprimentoDaLinha(pontos: Ponto[]): number {
  let total = 0;
  for (let i = 0; i < pontos.length - 1; i += 1) {
    const a = pontos[i];
    const b = pontos[i + 1];
    if (a !== undefined && b !== undefined) {
      total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
  }
  return total;
}

function pontoNaLinha(linha: Ponto[], fracao: number): Ponto {
  const alvo = comprimentoDaLinha(linha) * fracao;
  let percorrido = 0;
  for (let i = 0; i < linha.length - 1; i += 1) {
    const a = linha[i];
    const b = linha[i + 1];
    if (a === undefined || b === undefined) {
      continue;
    }
    const trecho = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (percorrido + trecho >= alvo && trecho > 0) {
      const t = (alvo - percorrido) / trecho;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    percorrido += trecho;
  }
  const primeiro = linha[0];
  if (primeiro === undefined) {
    throw new Error('rua com ocorrências sem geometria');
  }
  return primeiro;
}

const fracoesDeTentativa = [0.5, 0.32, 0.68, 0.2, 0.8];

function longeDe(ponto: Ponto, ocupados: Ponto[], folga: number): boolean {
  return ocupados.every(([ox, oy]) => Math.hypot(ponto[0] - ox, ponto[1] - oy) > folga);
}

function posicaoInterna(linhas: Ponto[][], ocupados: Ponto[], folga: number, bloqueios: Caixa[]): Ponto {
  const maisLonga = linhas.reduce<Ponto[]>(
    (atual, linha) => (comprimentoDaLinha(linha) > comprimentoDaLinha(atual) ? linha : atual),
    linhas[0] ?? [],
  );
  const livre = fracoesDeTentativa.map((fracao) => pontoNaLinha(maisLonga, fracao)).find((p) => longeDe(p, ocupados, folga) && !bloqueado(p, bloqueios));
  return livre ?? pontoNaLinha(maisLonga, 0.5);
}

export interface Circulo {
  centro: Ponto;
  raio: number;
}

function bloqueado([x, y]: Ponto, bloqueios: Caixa[]): boolean {
  return bloqueios.some((c) => x >= c.minX && x <= c.maxX && y >= c.minY && y <= c.maxY);
}

export function posicoesDosSelos(
  linhasPorRua: Ponto[][][],
  evitar: Ponto[],
  folga: number,
  borda: Circulo,
  afastamento: number,
  bloqueios: Caixa[],
): Ponto[] {
  const [cx, cy] = borda.centro;
  const escolhidas: Ponto[] = [];
  for (const linhas of linhasPorRua) {
    const ocupados = [...evitar, ...escolhidas];
    const naBorda = linhas
      .flatMap((linha) => [linha[0], linha[linha.length - 1]])
      .filter((p): p is Ponto => p !== undefined)
      .filter(([x, y]) => Math.hypot(x - cx, y - cy) >= borda.raio - 1.5)
      .map(([x, y]): Ponto => {
        const fator = (borda.raio + afastamento) / Math.hypot(x - cx, y - cy);
        return [cx + (x - cx) * fator, cy + (y - cy) * fator];
      });
    const livre = naBorda.find((p) => longeDe(p, ocupados, folga) && !bloqueado(p, bloqueios));
    escolhidas.push(livre ?? posicaoInterna(linhas, ocupados, folga, bloqueios));
  }
  return escolhidas;
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
  if (larguraVista > limite) {
    larguraVista = limite;
    alturaVista = larguraVista / proporcao;
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

export function caixaDaTela(quadro: Enquadramento, esquerda: number, topo: number, largura: number, altura: number): Caixa {
  const metro = 1 / quadro.pixelsPorMetro;
  return {
    minX: quadro.x + esquerda * metro,
    maxX: quadro.x + (esquerda + largura) * metro,
    minY: -(quadro.y + (topo + altura) * metro),
    maxY: -(quadro.y + topo * metro),
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
