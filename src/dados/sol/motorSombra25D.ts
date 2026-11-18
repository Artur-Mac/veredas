import { incidenciaNaFace, instanteNoRecife, posicaoDoSol, type Sol } from "./astronomia";
import { intervalosDoRaio, type Ponto } from "./geometria";
import type { FachadaInferida, InferenciaDeFachadas, PapelFachada } from "./inferirFachadas";

export type PredioCena25D = {
  id: string;
  pontosM: [number, number][];
  alturaM: number;
  ehAlvo: boolean;
  potencialFuturoM: number | null;
};

export type SombraNoSolo25D = {
  id: string;
  ehAlvo: boolean;
  futura: boolean;
  poliM: [number, number][];
};

export type Parede25D = {
  indiceAresta: number;
  p0M: [number, number];
  p1M: [number, number];
  pontoMedioM: [number, number];
  normalM: [number, number];
  azimuteGraus: number;
  fachadaId: PapelFachada | null;
  ehFrenteCamera: boolean;
  luminosidadeSol0a1: number;
  emSombraPropria: boolean;
  profundidadeOrdenacao: number;
};

export type OclusaoSolarJanela25D = {
  solAcima: boolean;
  solNaFrente: boolean;
  emSombraVizinho: boolean;
  bloqueadorId: string | null;
  pontoJanelaM: [number, number];
  pontoBloqueioM: [number, number] | null;
  zBloqueioM: number | null;
  ateQualAndarProtegido: number;
  distanciaBloqueioM: number | null;
};

export type FluxoBrisa25D = {
  origemM: [number, number];
  cp1M: [number, number];
  cp2M: [number, number];
  destinoM: [number, number];
  pontaA: [number, number];
  pontaB: [number, number];
};

export type EstadoCenaSombra25D = {
  sol: Sol;
  sombrasSolo: SombraNoSolo25D[];
  oclusao: OclusaoSolarJanela25D;
  luzTeto0a1: number;
  tetoEmSombra: boolean;
  paredesPorPredio: Record<string, Parede25D[]>;
  prediosOrdenados: PredioCena25D[];
  fluxosBrisa: FluxoBrisa25D[];
  bloqueioBrisa: boolean;
};

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Normaliza o poligono em sentido anti-horario (CCW) no plano Leste(+x)/Norte(+y). */
export function normalizarPoligonoCCW(pts: readonly [number, number][]): [number, number][] {
  if (pts.length < 3) return pts.map((p) => [p[0], p[1]]);
  let area2 = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    area2 += a[0] * b[1] - b[0] * a[1];
  }
  const copia = pts.map((p): [number, number] => [p[0], p[1]]);
  return area2 < 0 ? copia.reverse() : copia;
}

/** Envoltoria convexa (Andrew's monotone chain) para projetar sombra de prisma retangular no solo. */
export function envoltoriaSombraSolo(
  baseM: readonly [number, number][],
  dxM: number,
  dyM: number,
): [number, number][] {
  const todos: [number, number][] = [
    ...baseM.map((p): [number, number] => [p[0], p[1]]),
    ...baseM.map(([x, y]): [number, number] => [x + dxM, y + dyM]),
  ];
  if (todos.length < 3) return [];
  const ord = [...todos].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const baixo: [number, number][] = [];
  for (const p of ord) {
    while (baixo.length >= 2 && cross(baixo[baixo.length - 2]!, baixo[baixo.length - 1]!, p) <= 0) {
      baixo.pop();
    }
    baixo.push(p);
  }
  const cima: [number, number][] = [];
  for (let i = ord.length - 1; i >= 0; i--) {
    const p = ord[i]!;
    while (cima.length >= 2 && cross(cima[cima.length - 2]!, cima[cima.length - 1]!, p) <= 0) {
      cima.pop();
    }
    cima.push(p);
  }
  baixo.pop();
  cima.pop();
  return [...baixo, ...cima];
}

function associarFachadaAlvo(
  normalAz: number,
  fachadas: readonly FachadaInferida[],
): PapelFachada {
  let melhor = fachadas[0]!.id;
  let menorDiff = 999;
  for (const f of fachadas) {
    const diff = Math.abs((((normalAz - f.azimuteGraus) % 360) + 540) % 360 - 180);
    if (diff < menorDiff) {
      menorDiff = diff;
      melhor = f.id;
    }
  }
  return melhor;
}

export function calcularParedesPredio(
  predio: PredioCena25D,
  sol: Sol,
  fachadasAlvo?: readonly FachadaInferida[],
): Parede25D[] {
  const ccw = normalizarPoligonoCCW(predio.pontosM);
  const solAcima = sol.elevacao > 1;
  const azRad = sol.azimute * RAD;
  const elevRad = sol.elevacao * RAD;
  const solHx = Math.sin(azRad);
  const solHy = Math.cos(azRad);
  const cosElev = Math.cos(elevRad);

  const paredes: Parede25D[] = [];
  for (let i = 0; i < ccw.length; i++) {
    const p0M = ccw[i]!;
    const p1M = ccw[(i + 1) % ccw.length]!;
    const ex = p1M[0] - p0M[0];
    const ey = p1M[1] - p0M[1];
    const len = Math.hypot(ex, ey);
    if (len < 1e-4) continue;
    // Em poligono CCW no plano (East=+x, North=+y), normal externa = [ey, -ex] / len
    const nx = ey / len;
    const ny = -ex / len;
    const mid: [number, number] = [(p0M[0] + p1M[0]) / 2, (p0M[1] + p1M[1]) / 2];
    const normalAz = Math.round((((Math.atan2(nx, ny) * DEG) % 360) + 360) % 360);

    // Vetor da camera 2.5D: teto sobe -0.22px (Oeste) e -0.42px (Norte), logo camera olha de (+0.22, -0.42)
    const dotCam = nx * 0.22 + ny * -0.42;
    const ehFrenteCamera = dotCam >= -0.02;

    const dotSolH = nx * solHx + ny * solHy;
    const luminosidadeSol0a1 =
      solAcima && dotSolH > 0 ? Math.min(1, cosElev * dotSolH) : 0;

    // Profundidade para painter's algorithm dentro do mesmo predio (maiores valores = mais perto da camera)
    const profundidadeOrdenacao = mid[0] * 0.22 - mid[1] * 0.42;

    paredes.push({
      indiceAresta: i,
      p0M,
      p1M,
      pontoMedioM: mid,
      normalM: [nx, ny],
      azimuteGraus: normalAz,
      fachadaId:
        predio.ehAlvo && fachadasAlvo ? associarFachadaAlvo(normalAz, fachadasAlvo) : null,
      ehFrenteCamera,
      luminosidadeSol0a1,
      emSombraPropria: !solAcima || dotSolH <= 0.02,
      profundidadeOrdenacao,
    });
  }

  return paredes.sort((a, b) => a.profundidadeOrdenacao - b.profundidadeOrdenacao);
}

function criarFluxosBrisa(bloqueioBrisa: boolean): FluxoBrisa25D[] {
  // Alisio E-SE sopra de 125° (E-SE) para 305° (O-NO)
  const dirX = -Math.sin(125 * RAD);
  const dirY = -Math.cos(125 * RAD);
  const perpX = -dirY;
  const perpY = dirX;

  const faixas: { cx: number; cy: number; comp: number; curva: number }[] = [
    { cx: 36, cy: -16, comp: 46, curva: bloqueioBrisa ? 11 : 4.5 },
    { cx: 58, cy: 12, comp: 42, curva: bloqueioBrisa ? -9 : -3.8 },
    { cx: 14, cy: -42, comp: 44, curva: bloqueioBrisa ? 9.5 : 4.0 },
  ];

  return faixas.map(({ cx, cy, comp, curva }) => {
    const origemM: [number, number] = [cx - dirX * (comp * 0.48), cy - dirY * (comp * 0.48)];
    const destinoM: [number, number] = [cx + dirX * (comp * 0.52), cy + dirY * (comp * 0.52)];
    const cp1M: [number, number] = [
      origemM[0] + dirX * (comp * 0.34) + perpX * curva,
      origemM[1] + dirY * (comp * 0.34) + perpY * curva,
    ];
    const cp2M: [number, number] = [
      origemM[0] + dirX * (comp * 0.72) - perpX * (curva * 0.65),
      origemM[1] + dirY * (comp * 0.72) - perpY * (curva * 0.65),
    ];

    const tx = destinoM[0] - cp2M[0];
    const ty = destinoM[1] - cp2M[1];
    const tLen = Math.hypot(tx, ty) || 1;
    const ux = tx / tLen;
    const uy = ty / tLen;
    const rx = -uy;
    const ry = ux;

    const pontaA: [number, number] = [
      destinoM[0] - ux * 4.5 + rx * 2.6,
      destinoM[1] - uy * 4.5 + ry * 2.6,
    ];
    const pontaB: [number, number] = [
      destinoM[0] - ux * 4.5 - rx * 2.6,
      destinoM[1] - uy * 4.5 - ry * 2.6,
    ];

    return { origemM, cp1M, cp2M, destinoM, pontaA, pontaB };
  });
}

export function simularCenaSombra25D(params: {
  predios: readonly PredioCena25D[];
  inferencia: InferenciaDeFachadas;
  fachadaAtiva: FachadaInferida;
  andar: number;
  hora: number;
  dia: string;
  centro: readonly [number, number];
  mostrarTorresFuturas: boolean;
}): EstadoCenaSombra25D {
  const { predios, inferencia, fachadaAtiva, andar, hora, dia, centro, mostrarTorresFuturas } =
    params;

  const sol = posicaoDoSol(instanteNoRecife(dia, hora * 60), {
    latitude: centro[1],
    longitude: centro[0],
  });
  const solAcima = sol.elevacao > 1;
  const solNaFrente = solAcima && incidenciaNaFace(sol, fachadaAtiva.azimuteGraus);
  const elevRad = Math.max(0.06, sol.elevacao * RAD);
  const tanElev = Math.tan(elevRad);
  const azRad = sol.azimute * RAD;
  const dirSolX = Math.sin(azRad);
  const dirSolY = Math.cos(azRad);
  const zAndarM = Math.max(1.5, (andar - 1) * 3.0 + 1.5);

  // Camada 1: Sombra projetada no solo para O PREDIO ALVO e TODOS OS VIZINHOS
  const sombrasSolo: SombraNoSolo25D[] = [];
  if (solAcima) {
    for (const p of predios) {
      const altEfetiva =
        !p.ehAlvo && mostrarTorresFuturas && p.potencialFuturoM ? p.potencialFuturoM : p.alturaM;
      const compM = Math.min(130, altEfetiva / tanElev);
      const dxM = -dirSolX * compM;
      const dyM = -dirSolY * compM;
      const ccw = normalizarPoligonoCCW(p.pontosM);
      const poliM = envoltoriaSombraSolo(ccw, dxM, dyM);
      if (poliM.length >= 3) {
        sombrasSolo.push({
          id: p.id,
          ehAlvo: p.ehAlvo,
          futura: !p.ehAlvo && mostrarTorresFuturas && Boolean(p.potencialFuturoM),
          poliM,
        });
      }
    }
  }

  // Camada 3: Ray-casting de oclusao na altura do andar + recorte de raio (nunca atravessa vizinho)
  const facAzRad = fachadaAtiva.azimuteGraus * RAD;
  const pontoJanelaM: [number, number] = [
    fachadaAtiva.pontoMedioM[0] + Math.sin(facAzRad) * 0.25,
    fachadaAtiva.pontoMedioM[1] + Math.cos(facAzRad) * 0.25,
  ];
  const dirSol: Ponto = [dirSolX, dirSolY];

  let emSombraVizinho = false;
  let bloqueadorId: string | null = null;
  let menorDistBloqueio: number | null = null;
  let zBloqueioM: number | null = null;
  let maiorZTopoSombraM = 0;

  if (solAcima && solNaFrente) {
    for (const v of predios) {
      if (v.ehAlvo) continue;
      const altEfetiva =
        mostrarTorresFuturas && v.potencialFuturoM ? v.potencialFuturoM : v.alturaM;
      const ccw = normalizarPoligonoCCW(v.pontosM);
      const intervalos = intervalosDoRaio(pontoJanelaM, dirSol, [ccw]);
      for (const [tEntrada] of intervalos) {
        if (tEntrada <= 0.1) continue;
        const zRaioNaEntrada = zAndarM + tEntrada * tanElev;
        const zTopoSombraNoAlvo = altEfetiva - tEntrada * tanElev;
        if (zTopoSombraNoAlvo > maiorZTopoSombraM) {
          maiorZTopoSombraM = zTopoSombraNoAlvo;
        }
        if (altEfetiva > zRaioNaEntrada + 0.15) {
          emSombraVizinho = true;
          if (menorDistBloqueio === null || tEntrada < menorDistBloqueio) {
            menorDistBloqueio = tEntrada;
            bloqueadorId = v.id;
            zBloqueioM = Math.min(altEfetiva, Math.max(2, zRaioNaEntrada));
          }
        }
      }
    }
  }

  const pontoBloqueioM: [number, number] | null =
    menorDistBloqueio !== null
      ? [
          pontoJanelaM[0] + dirSolX * menorDistBloqueio,
          pontoJanelaM[1] + dirSolY * menorDistBloqueio,
        ]
      : null;

  const ateQualAndarProtegido =
    maiorZTopoSombraM >= 1.5 ? Math.max(1, Math.floor((maiorZTopoSombraM - 1.5) / 3.0) + 1) : 0;

  // Ordenacao 2.5D de tras para frente relativa ao vetor da camera (+x=dir, -y=frente)
  const prediosOrdenados = [...predios].sort((a, b) => {
    const cxA = a.pontosM.reduce((s, p) => s + p[0], 0) / a.pontosM.length;
    const cyA = a.pontosM.reduce((s, p) => s + p[1], 0) / a.pontosM.length;
    const cxB = b.pontosM.reduce((s, p) => s + p[0], 0) / b.pontosM.length;
    const cyB = b.pontosM.reduce((s, p) => s + p[1], 0) / b.pontosM.length;
    return cxA * 0.22 - cyA * 0.42 - (cxB * 0.22 - cyB * 0.42);
  });

  // Camada 2: Self-shadowing por face + teto
  const paredesPorPredio: Record<string, Parede25D[]> = {};
  for (const p of prediosOrdenados) {
    paredesPorPredio[p.id] = calcularParedesPredio(
      p,
      sol,
      p.ehAlvo ? inferencia.fachadas : undefined,
    );
  }

  const luzTeto0a1 = solAcima ? Math.max(0.15, Math.sin(elevRad)) : 0;
  const tetoEmSombra = !solAcima;

  // Brisa E-SE (125°) bloqueio downwind
  const ventoDeAz = 125 * RAD;
  const ventoVemX = Math.sin(ventoDeAz);
  const ventoVemY = Math.cos(ventoDeAz);
  const bloqueioBrisa = predios.some((p) => {
    if (p.ehAlvo) return false;
    const cx = p.pontosM.reduce((s, pt) => s + pt[0], 0) / p.pontosM.length;
    const cy = p.pontosM.reduce((s, pt) => s + pt[1], 0) / p.pontosM.length;
    const projVento = cx * ventoVemX + cy * ventoVemY;
    const alt = mostrarTorresFuturas && p.potencialFuturoM ? p.potencialFuturoM : p.alturaM;
    return projVento > 12 && projVento < 65 && alt > zAndarM + 3;
  });

  return {
    sol,
    sombrasSolo,
    oclusao: {
      solAcima,
      solNaFrente,
      emSombraVizinho,
      bloqueadorId,
      pontoJanelaM,
      pontoBloqueioM,
      zBloqueioM,
      ateQualAndarProtegido,
      distanciaBloqueioM: menorDistBloqueio,
    },
    luzTeto0a1,
    tetoEmSombra,
    paredesPorPredio,
    prediosOrdenados,
    fluxosBrisa: criarFluxosBrisa(bloqueioBrisa),
    bloqueioBrisa,
  };
}
