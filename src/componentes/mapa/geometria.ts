export type Ponto = [number, number];
export type Poligono = Ponto[];

export type Rua = { x1: number; y1: number; x2: number; y2: number; largura: number };
export type Praca = { x: number; y: number; largura: number; altura: number };
export type Agua = { tipo: "mar"; pontos: Ponto[] } | { tipo: "rio"; d: string; largura: number };
export type Predio = { poligono: Poligono; altura: number };
export type CelulaDeCalor = { x: number; y: number; v: number };

export type Geometria = {
  angulo: number;
  lotes: Poligono[];
  ruas: Rua[];
  pracas: Praca[];
  agua: Agua;
  predios: Predio[];
  calor: CelulaDeCalor[];
};

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

function girar([x, y]: Ponto, angulo: number): Ponto {
  const c = Math.cos(angulo);
  const s = Math.sin(angulo);
  return [x * c - y * s, x * s + y * c];
}

function retangulo(cx: number, cy: number, largura: number, altura: number, angulo: number, rand: () => number): Poligono {
  const meiaL = largura / 2;
  const meiaA = altura / 2;
  const cantos: Ponto[] = [[-meiaL, -meiaA], [meiaL, -meiaA], [meiaL, meiaA], [-meiaL, meiaA]];
  return cantos.map(([x, y]) => girar([cx + x + (rand() - 0.5) * 3, cy + y + (rand() - 0.5) * 3], angulo));
}

const cache = new Map<string, Geometria>();

export function geometria(idDossie: string): Geometria {
  const guardada = cache.get(idDossie);
  if (guardada) return guardada;
  const rand = semente(idDossie);
  const angulo = ((rand() * 24 - 12) * Math.PI) / 180;
  const passoX = 140;
  const passoY = 150;
  const posicoes: Ponto[] = [[0, 0], [-44, 0], [44, 0], [0, -48], [0, 48], [-44, -48], [44, -48], [-44, 48], [44, 48]];
  const lotes = posicoes.map(([x, y]) => retangulo(x, y, 34 + rand() * 4, 38 + rand() * 6, angulo, rand));
  const ruas: Rua[] = [];
  for (let k = -20; k <= 20; k += 1) {
    ruas.push({ x1: passoX / 2 + k * passoX, y1: -3200, x2: passoX / 2 + k * passoX, y2: 3200, largura: k % 4 === 0 ? 20 : 9 });
    ruas.push({ x1: -3200, y1: passoY / 2 + k * passoY, x2: 3200, y2: passoY / 2 + k * passoY, largura: k % 4 === 1 ? 20 : 9 });
  }
  const pracas: Praca[] = [];
  while (pracas.length < 4) {
    const i = Math.round((rand() - 0.5) * 14);
    const j = Math.round((rand() - 0.5) * 12);
    if (Math.abs(i) < 2 && Math.abs(j) < 2) continue;
    pracas.push({ x: i * passoX - passoX / 2 + 12, y: j * passoY - passoY / 2 + 12, largura: passoX - 24, altura: passoY - 24 });
  }
  const litoral = idDossie === "boa-viagem";
  let agua: Agua;
  if (litoral) {
    const pontos: Ponto[] = [];
    for (let y = -3400; y <= 3400; y += 200) pontos.push([1650 + 70 * Math.sin(y / 700), y]);
    agua = { tipo: "mar", pontos };
  } else {
    const lado = rand() < 0.5 ? -1 : 1;
    const base = lado * (520 + rand() * 420);
    agua = { tipo: "rio", d: `M -3400 ${base + 300} C -1200 ${base - 400}, 900 ${base + 500}, 3400 ${base - 200}`, largura: 110 };
  }
  const predios: Predio[] = [];
  for (let i = -5; i <= 5; i += 1) {
    for (let j = -5; j <= 5; j += 1) {
      if (i === 0 && j === 0) continue;
      const quantos = 1 + Math.floor(rand() * 3);
      for (let n = 0; n < quantos; n += 1) {
        const cx = i * passoX + (rand() - 0.5) * 60;
        const cy = j * passoY + (rand() - 0.5) * 70;
        predios.push({ poligono: retangulo(cx, cy, 22 + rand() * 18, 22 + rand() * 18, angulo, rand), altura: 10 + rand() * 50 });
      }
    }
  }
  const calor: CelulaDeCalor[] = [];
  for (let x = -1100; x < 1100; x += 100) {
    for (let y = -1100; y < 1100; y += 100) {
      const ruido = 0.5 + 0.35 * Math.sin(x / 380 + rand()) * Math.cos(y / 460) + (rand() - 0.5) * 0.3;
      calor.push({ x, y, v: Math.min(1, Math.max(0, litoral && x > 1200 ? 0.05 : ruido)) });
    }
  }
  const resultado = { angulo, lotes, ruas, pracas, agua, predios, calor };
  cache.set(idDossie, resultado);
  return resultado;
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
