// Utilitários de geometria plana dos mapas e as células de calor de demonstração do mapa dos exemplos.
// Ruas, praças, água, lotes e prédios inventados saíram em 18/11/2026: o chão do mapa dos exemplos é o mapa-base de verdade
// (FundoDoMapa). As células de calor continuam: são da camada "Calor", de demonstração, rotulada como ilustrativa.
export type Ponto = [number, number];
export type Poligono = Ponto[];

export type CelulaDeCalor = { x: number; y: number; v: number };

export function semente(texto: string): () => number {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  let estado = h >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cacheDoCalor = new Map<string, CelulaDeCalor[]>();

/** Células de 100 m (em metros em volta do imóvel) da camada "Calor" de demonstração; as mesmas para o mesmo dossiê. */
export function celulasDeCalor(idDossie: string): CelulaDeCalor[] {
  const guardadas = cacheDoCalor.get(idDossie);
  if (guardadas) return guardadas;
  const rand = semente(`${idDossie}:calor`);
  const calor: CelulaDeCalor[] = [];
  for (let x = -1100; x < 1100; x += 100) {
    for (let y = -1100; y < 1100; y += 100) {
      const ruido = 0.5 + 0.35 * Math.sin(x / 380 + rand()) * Math.cos(y / 460) + (rand() - 0.5) * 0.3;
      calor.push({ x, y, v: Math.min(1, Math.max(0, ruido)) });
    }
  }
  cacheDoCalor.set(idDossie, calor);
  return calor;
}

export function caminho(pontos: Poligono): string {
  return `M ${pontos.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
}

export function dentroDoPoligono([px, py]: Ponto, poligono: Poligono): boolean {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i, i += 1) {
    const a = poligono[i];
    const b = poligono[j];
    if (!a || !b) continue;
    const cruza = a[1] > py !== b[1] > py && px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0];
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

export function poligonoNaCaixa(poligono: Poligono, largura: number, altura: number, margem: number): Poligono {
  const xs = poligono.map(([x]) => x);
  const ys = poligono.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const escala = Math.min(largura / w, altura / h);
  return poligono.map(([x, y]) => [
    margem + (x - minX) * escala + (largura - w * escala) / 2,
    margem + (y - minY) * escala + (altura - h * escala) / 2,
  ]);
}
