// Experimento legado, preservado para compatibilidade. NÃO usar para conclusões da janela.
// A funcionalidade integrada usa dados/sol/: calendário real, contorno construído e sensibilidade.
// Motor determinístico de Sol, Sombra e Vento Alísio do Recife (Fatia Inteligente 1).
// Funções puras sobre o índice cadastral (`pavimentos`, `poligono`, `centro` dos edifícios vizinhos)
// e os dados declarados/observados (`andar`, `orientacaoGraus`). Sem rede, sem relógio implícito e sem veredito.
import type { Edificio } from "../contratos";
import { distanciaMetros } from "../geo";

export type HorarioSolar = "manha" | "meio_dia" | "tarde";
export type EstacaoSolar = "equinocio" | "verao" | "inverno";

export const METROS_POR_PAVIMENTO = 3.1;
const METROS_POR_GRAU = (Math.PI / 180) * 6371008.8;
const MERIDIANO_FUSO_RECIFE = -45; // UTC-3
const RAIO_SOMBRA_VIZINHOS_M = 120;
const RAIO_BRISA_SUDESTE_M = 65;

export const HORARIOS_DO_MAPA: readonly { id: HorarioSolar; rotulo: string; horaLocal: number }[] = [
  { id: "manha", rotulo: "Manhã · 8h30", horaLocal: 8.5 },
  { id: "meio_dia", rotulo: "Meio-dia · 12h", horaLocal: 12 },
  { id: "tarde", rotulo: "Tarde · 15h30", horaLocal: 15.5 },
] as const;

export type PosicaoSolar = {
  horaLocal: number;
  /** Altura do sol acima do horizonte em graus (-90 a 90). Positiva durante o dia. */
  elevacaoGraus: number;
  /** Azimute em graus: 0 = Norte, 90 = Leste, 180 = Sul, 270 = Oeste. */
  azimuteGraus: number;
  /** Deslocamento da sombra no plano local [lesteM, sulM] por 1 metro de altura do obstáculo. */
  sombraPorMetro: [number, number];
};

export type VizinhoRelevante = {
  id: string;
  nome: string | null;
  pavimentos: number;
  alturaM: number;
  distanciaM: number;
  azimuteGraus: number;
  direcaoCardeal: string;
};

export type LeituraDaJanela = {
  graus: number;
  /** Ex.: "Nascente (Leste)" ou "Poente (Oeste)". */
  fachada: string;
  /** Horas aproximadas de sol direto na janela no equinócio, já descontando prédios vizinhos mais altos. */
  horasSolDireto: number;
  /** Horas que seriam recebidas sem obstrução de vizinhos. */
  horasSemVizinhos: number;
  /** Vizinho que mais reduz o sol direto nesta direção, se houver. */
  bloqueioSolar: VizinhoRelevante | null;
  /** Recebe a brisa dominante do Recife (cone Leste-Sudeste, 95° a 165°)? */
  recebeBrisaSudeste: "direta" | "reduzida_por_vizinho" | "outra_face";
  /** Frase principal em linguagem simples para exibir na tela da visita ou do dossiê. */
  resumoHumano: string;
  /** Orientação prática para observar durante a visita. */
  dicaPratica: string;
};

export type SinteseSolESombra = {
  /** Altura estimada do edifício em metros (`pavimentos * 3,1`), ou null quando o cadastro não traz pavimentos. */
  alturaEdificioM: number | null;
  pavimentos: number | null;
  /** Altura estimada da janela do apartamento em metros, quando o andar foi informado. */
  alturaAndarM: number | null;
  andarAnalisado: number | null;
  /** Usou metade da altura do prédio por falta do andar no anúncio? */
  andarEstimadoNoMeio: boolean;
  /** Horas de sol na fachada Leste (manhã) e Oeste (tarde) na altura analisada. */
  horasManhaLeste: number;
  horasTardeOeste: number;
  vizinhoMaisProximoLeste: VizinhoRelevante | null;
  vizinhoMaisProximoOeste: VizinhoRelevante | null;
  brisaSudeste: {
    situacao: "livre" | "parcial" | "bloqueada";
    vizinho: VizinhoRelevante | null;
    frase: string;
  };
  /** Manchete curta em português simples para uma pessoa comum entender o impacto no dia a dia. */
  manchete: string;
  /** Explicação complementar objetiva. */
  detalhe: string;
  /** Se a pessoa já registrou a direção da janela na visita, traz a leitura específica da janela. */
  janelaRegistrada: LeituraDaJanela | null;
};

function rad(graus: number): number {
  return (graus * Math.PI) / 180;
}

function deg(radianos: number): number {
  return (radianos * 180) / Math.PI;
}

function declinacaoDaEstacao(estacao: EstacaoSolar): number {
  if (estacao === "verao") return -23.44;
  if (estacao === "inverno") return 23.44;
  return 0;
}

/** Equações astronômicas determinísticas para a latitude/longitude do Recife (fuso UTC-3). */
export function posicaoSolarRecife(
  horaLocal: number,
  coordenada: readonly [number, number] = [-34.9, -8.05],
  estacao: EstacaoSolar = "equinocio",
): PosicaoSolar {
  const [lon, lat] = coordenada;
  const phi = rad(lat);
  const delta = rad(declinacaoDaEstacao(estacao));
  const correcaoLongitudeHoras = (lon - MERIDIANO_FUSO_RECIFE) / 15;
  const horaSolar = horaLocal + correcaoLongitudeHoras;
  const omega = rad((horaSolar - 12) * 15);

  const sinElev = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(omega);
  const elevRad = Math.asin(Math.max(-1, Math.min(1, sinElev)));
  const elevacaoGraus = deg(elevRad);

  // Vetor horizontal unitário em direção ao sol: leste = xSol, norte = nSol.
  const xSol = -Math.cos(delta) * Math.sin(omega);
  const nSol = Math.cos(phi) * Math.sin(delta) - Math.sin(phi) * Math.cos(delta) * Math.cos(omega);
  const azimuteGraus = ((deg(Math.atan2(xSol, nSol)) % 360) + 360) % 360;

  // Sombra cai no sentido oposto ao sol. Eixo Y do plano do mapa aponta para o Sul (-Norte).
  if (elevacaoGraus <= 2) {
    return { horaLocal, elevacaoGraus, azimuteGraus, sombraPorMetro: [0, 0] };
  }
  const normaHorizontal = Math.hypot(xSol, nSol) || 1;
  const alcancePorMetro = Math.min(3.0, 1 / Math.tan(elevRad));
  const dxLeste = (-xSol / normaHorizontal) * alcancePorMetro;
  const dySul = (nSol / normaHorizontal) * alcancePorMetro;
  return { horaLocal, elevacaoGraus, azimuteGraus, sombraPorMetro: [dxLeste, dySul] };
}

/** Altura estimada em metros pelo número oficial de pavimentos da base de Lotes. */
export function alturaDoEdificioM(e: Pick<Edificio, "pavimentos">): number | null {
  if (e.pavimentos === null || e.pavimentos <= 0) return null;
  return Math.round(e.pavimentos * METROS_POR_PAVIMENTO * 10) / 10;
}

/** Altura aproximada da janela do apartamento a partir do chão (em metros). */
export function alturaDoAndarM(andar: number | null): number | null {
  if (andar === null || !Number.isFinite(andar)) return null;
  if (andar <= 0) return 1.6;
  return Math.round((1.5 + andar * METROS_POR_PAVIMENTO) * 10) / 10;
}

function nomeCurtoCardeal(azimute: number): string {
  const nomes = ["Norte", "Nordeste", "Leste", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"] as const;
  const g = ((Math.round(azimute) % 360) + 360) % 360;
  return nomes[Math.round(g / 45) % 8] ?? "Norte";
}

function diferencaAngularGraus(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 540) % 360 - 180);
  return d;
}

/** Distância horizontal aproximada entre a borda do prédio alvo e o polígono (ou centro) do vizinho. */
function distanciaEntreBordasM(alvo: Edificio, vizinho: Edificio): { distanciaM: number; azimuteGraus: number } {
  const [lon0, lat0] = alvo.centro;
  const cosLat = Math.cos(rad(lat0));
  const paraMetros = ([lon, lat]: readonly [number, number]): [number, number] => [
    (lon - lon0) * METROS_POR_GRAU * cosLat,
    (lat - lat0) * METROS_POR_GRAU, // Norte positivo aqui para azimute
  ];
  const [vx, vn] = paraMetros(vizinho.centro);
  const azimuteCentro = ((deg(Math.atan2(vx, vn)) % 360) + 360) % 360;

  const pontosAlvo = alvo.poligono?.length ? alvo.poligono.map(paraMetros) : [[0, 0] as [number, number]];
  const pontosVizinho = vizinho.poligono?.length ? vizinho.poligono.map(paraMetros) : [[vx, vn] as [number, number]];

  let menor = distanciaMetros(alvo.centro, vizinho.centro);
  for (const [ax, an] of pontosAlvo) {
    for (const [bx, bn] of pontosVizinho) {
      const d = Math.hypot(bx - ax, bn - an);
      if (d < menor) menor = d;
    }
  }
  return { distanciaM: Math.max(4, Math.round(menor)), azimuteGraus: Math.round(azimuteCentro) % 360 };
}

function vizinhosComAltura(predio: Edificio, vizinhos: readonly Edificio[]): VizinhoRelevante[] {
  const lista: VizinhoRelevante[] = [];
  for (const v of vizinhos) {
    if (v.id === predio.id || v.pavimentos === null || v.pavimentos <= 0) continue;
    const distCentro = distanciaMetros(predio.centro, v.centro);
    if (distCentro > RAIO_SOMBRA_VIZINHOS_M + 35) continue;
    const { distanciaM, azimuteGraus } = distanciaEntreBordasM(predio, v);
    if (distanciaM > RAIO_SOMBRA_VIZINHOS_M) continue;
    lista.push({
      id: v.id,
      nome: v.nome,
      pavimentos: v.pavimentos,
      alturaM: Math.round(v.pavimentos * METROS_POR_PAVIMENTO * 10) / 10,
      distanciaM,
      azimuteGraus,
      direcaoCardeal: nomeCurtoCardeal(azimuteGraus),
    });
  }
  return lista.sort((a, b) => a.distanciaM - b.distanciaM);
}

/**
 * Calcula quantas horas de sol direto atingem uma fachada voltada para `azimuteFachada` na cota `zAndarM`,
 * descontando a obstrução angular de edifícios vizinhos mais altos no cone da trajetória solar.
 */
function calcularSolNaFachada(
  azimuteFachada: number,
  zAndarM: number,
  coordenada: readonly [number, number],
  vizinhos: readonly VizinhoRelevante[],
): { horasComVizinhos: number; horasSemVizinhos: number; maiorBloqueio: VizinhoRelevante | null } {
  const passoHoras = 0.25; // 15 min
  let semVizinhos = 0;
  let comVizinhos = 0;
  const contagemBloqueio = new Map<string, { vizinho: VizinhoRelevante; horas: number }>();

  for (let h = 5.5; h <= 17.75; h += passoHoras) {
    const sol = posicaoSolarRecife(h, coordenada, "equinocio");
    if (sol.elevacaoGraus <= 4) continue;
    // O sol incide na fachada quando está a menos de 82° da normal da janela.
    if (diferencaAngularGraus(sol.azimuteGraus, azimuteFachada) > 82) continue;

    semVizinhos += passoHoras;

    // Verifica se algum prédio vizinho na direção do sol (±24° de abertura aparente) tem ângulo de topo maior que o sol.
    let bloqueante: VizinhoRelevante | null = null;
    for (const v of vizinhos) {
      if (v.alturaM <= zAndarM) continue;
      const abertura = v.distanciaM <= 25 ? 28 : v.distanciaM <= 50 ? 22 : 16;
      if (diferencaAngularGraus(sol.azimuteGraus, v.azimuteGraus) > abertura) continue;
      const anguloTopo = deg(Math.atan2(v.alturaM - zAndarM, v.distanciaM));
      if (anguloTopo >= sol.elevacaoGraus) {
        bloqueante = v;
        break;
      }
    }

    if (!bloqueante) {
      comVizinhos += passoHoras;
    } else {
      const atual = contagemBloqueio.get(bloqueante.id);
      contagemBloqueio.set(bloqueante.id, { vizinho: bloqueante, horas: (atual?.horas ?? 0) + passoHoras });
    }
  }

  let maiorBloqueio: VizinhoRelevante | null = null;
  let maxHoras = 0;
  for (const item of contagemBloqueio.values()) {
    if (item.horas > maxHoras) {
      maxHoras = item.horas;
      maiorBloqueio = item.vizinho;
    }
  }

  const arredondarMeiaHora = (v: number) => Math.round(v * 2) / 2;
  return {
    horasComVizinhos: arredondarMeiaHora(comVizinhos),
    horasSemVizinhos: arredondarMeiaHora(semVizinhos),
    maiorBloqueio: maxHoras >= 0.5 ? maiorBloqueio : null,
  };
}

function rotuloDeFachadaRecife(graus: number): { fachada: string; periodo: "manha" | "tarde" | "lateral" } {
  const g = ((Math.round(graus) % 360) + 360) % 360;
  if (g >= 45 && g <= 155) {
    return { fachada: `Nascente (${nomeCurtoCardeal(g)})`, periodo: "manha" };
  }
  if (g >= 205 && g <= 315) {
    return { fachada: `Poente (${nomeCurtoCardeal(g)})`, periodo: "tarde" };
  }
  return { fachada: `Face ${nomeCurtoCardeal(g)}`, periodo: "lateral" };
}

function formatarHoras(h: number): string {
  if (h <= 0) return "menos de 30 min";
  const texto = String(h).replace(".", ",");
  return h === 1 ? "cerca de 1 h" : `cerca de ${texto} h`;
}

/** Traduz a orientação da janela (0° a 359°) em leitura prática para quem visita um imóvel no Recife. */
export function analisarJanelaNoRecife(
  graus: number,
  opcoes: {
    predio?: Edificio | null;
    vizinhos?: readonly Edificio[];
    andar?: number | null;
  } = {},
): LeituraDaJanela {
  const g = ((Math.round(graus) % 360) + 360) % 360;
  const { predio = null, vizinhos = [], andar = null } = opcoes;
  const alturaPredio = predio ? alturaDoEdificioM(predio) : null;
  const zAndar = alturaDoAndarM(andar) ?? (alturaPredio ? Math.max(4.5, alturaPredio * 0.5) : 10);
  const coordenada = predio?.centro ?? ([-34.9, -8.05] as const);
  const listaVizinhos = predio ? vizinhosComAltura(predio, vizinhos) : [];

  const { fachada, periodo } = rotuloDeFachadaRecife(g);
  const sol = calcularSolNaFachada(g, zAndar, coordenada, listaVizinhos);

  // Cone dos ventos alísios do Recife: Leste-Sudeste (95° a 165°).
  const naBrisa = g >= 95 && g <= 165;
  const barreiraSudeste = naBrisa
    ? listaVizinhos.find(
        (v) => v.distanciaM <= RAIO_BRISA_SUDESTE_M && v.alturaM > zAndar + 2 && diferencaAngularGraus(v.azimuteGraus, g) <= 28,
      ) ?? null
    : null;
  const recebeBrisaSudeste: LeituraDaJanela["recebeBrisaSudeste"] = !naBrisa
    ? "outra_face"
    : barreiraSudeste
      ? "reduzida_por_vizinho"
      : "direta";

  let resumoHumano: string;
  let dicaPratica: string;

  if (periodo === "manha") {
    if (sol.maiorBloqueio) {
      const b = sol.maiorBloqueio;
      resumoHumano = `${fachada}: recebe ${formatarHoras(sol.horasComVizinhos)} de sol da manhã (prédio de ${b.pavimentos} andares a ${b.distanciaM} m faz sombra em parte da manhã).`;
    } else {
      resumoHumano = `${fachada}: recebe ${formatarHoras(sol.horasComVizinhos)} de sol direto da manhã, mais ameno à tarde.`;
    }
    dicaPratica =
      recebeBrisaSudeste === "direta"
        ? "Voltada para o quadrante da brisa marítima do Recife (Leste/Sudeste). Confira a circulação de ar com as portas internas abertas."
        : recebeBrisaSudeste === "reduzida_por_vizinho"
          ? `Na direção da brisa Sudeste, mas há edifício mais alto a ${barreiraSudeste!.distanciaM} m. Sinta a ventilação real com a janela aberta.`
          : "Sol concentrado antes do meio-dia; paredes tendem a esfriar mais cedo no fim da tarde.";
  } else if (periodo === "tarde") {
    if (sol.maiorBloqueio) {
      const b = sol.maiorBloqueio;
      resumoHumano = `${fachada}: recebe ${formatarHoras(sol.horasComVizinhos)} de sol da tarde (edifício de ${b.pavimentos} andares a ${b.distanciaM} m projeta sombra parcial).`;
    } else {
      resumoHumano = `${fachada}: recebe ${formatarHoras(sol.horasComVizinhos)} de sol direto à tarde.`;
    }
    dicaPratica =
      "No Recife, fachadas a Oeste acumulam calor nas paredes após as 13h. Observe se há ventilação cruzada, brise/varanda ou ponto para ar-condicionado.";
  } else {
    resumoHumano = `${fachada}: incidência solar lateral (${formatarHoras(sol.horasComVizinhos)} de sol direto ao longo do dia).`;
    dicaPratica =
      g >= 315 || g <= 45
        ? "Face Norte recebe mais sol nos meses de chuva/inverno (maio a agosto). Confira a claridade natural dos quartos."
        : "Face Sul recebe luz indireta na maior parte do ano e brisa lateral Sudeste. Observe se áreas frias e armários são bem ventilados.";
  }

  return {
    graus: g,
    fachada,
    horasSolDireto: sol.horasComVizinhos,
    horasSemVizinhos: sol.horasSemVizinhos,
    bloqueioSolar: sol.maiorBloqueio,
    recebeBrisaSudeste,
    resumoHumano,
    dicaPratica,
  };
}

/** Síntese completa do prédio confirmado cruzando altura cadastral, andar do anúncio, vizinhos e vento Sudeste. */
export function analisarSolESombra(
  predio: Edificio,
  vizinhos: readonly Edificio[],
  andarDeclarado: number | null,
  orientacaoJanelaGraus: number | null = null,
): SinteseSolESombra {
  const alturaEdificioM = alturaDoEdificioM(predio);
  const andarConhecido = andarDeclarado !== null && Number.isFinite(andarDeclarado) ? andarDeclarado : null;
  const alturaAndarConhecida = alturaDoAndarM(andarConhecido);
  const zAnalise = alturaAndarConhecida ?? (alturaEdificioM ? Math.max(4.5, Math.round(alturaEdificioM * 0.5 * 10) / 10) : 9.3);
  const andarEstimadoNoMeio = andarConhecido === null;

  const relevantes = vizinhosComAltura(predio, vizinhos);
  const leste = calcularSolNaFachada(90, zAnalise, predio.centro, relevantes);
  const oeste = calcularSolNaFachada(270, zAnalise, predio.centro, relevantes);

  // Vento Sudeste no Recife (~135°): busca obstáculos mais altos que `zAnalise` no cone 105°..165° até 65 m.
  const obstaculosSudeste = relevantes.filter(
    (v) => v.distanciaM <= RAIO_BRISA_SUDESTE_M && v.alturaM > zAnalise + 2 && v.azimuteGraus >= 105 && v.azimuteGraus <= 165,
  );
  const maisPertoSudeste = obstaculosSudeste[0] ?? null;
  const brisaSituacao: SinteseSolESombra["brisaSudeste"]["situacao"] = !maisPertoSudeste
    ? "livre"
    : maisPertoSudeste.distanciaM <= 28 && maisPertoSudeste.alturaM >= zAnalise + 9
      ? "bloqueada"
      : "parcial";

  const referenciaAltura =
    andarConhecido !== null
      ? andarConhecido <= 0
        ? "no térreo"
        : `no ${andarConhecido}º andar (~${Math.round(zAnalise)} m)`
      : predio.pavimentos
        ? `na metade da altura do prédio (~${Math.round(zAnalise)} m)`
        : "na altura média estimada";

  const fraseBrisa =
    brisaSituacao === "livre"
      ? `Frente Sudeste (vento dominante do Recife) sem prédios mais altos a até ${RAIO_BRISA_SUDESTE_M} m ${referenciaAltura}.`
      : `A Sudeste há um prédio de ${maisPertoSudeste!.pavimentos} andares a ${maisPertoSudeste!.distanciaM} m, que pode reduzir a brisa direta ${referenciaAltura}.`;

  const partesManchete: string[] = [];
  if (leste.maiorBloqueio && leste.horasComVizinhos < 3) {
    partesManchete.push(`Sombra de vizinho a Leste pela manhã (${formatarHoras(leste.horasComVizinhos)} de sol)`);
  } else {
    partesManchete.push(`Manhã livre a Leste (${formatarHoras(leste.horasComVizinhos)} de sol)`);
  }
  if (oeste.maiorBloqueio && oeste.horasComVizinhos < 3) {
    partesManchete.push(`sombra parcial à tarde a Oeste (${formatarHoras(oeste.horasComVizinhos)})`);
  } else {
    partesManchete.push(`tarde aberta a Oeste (${formatarHoras(oeste.horasComVizinhos)} de sol)`);
  }

  const prefixoAltura =
    alturaEdificioM !== null && predio.pavimentos !== null
      ? `Prédio de ${predio.pavimentos} ${predio.pavimentos === 1 ? "pavimento" : "pavimentos"} (~${Math.round(alturaEdificioM)} m). `
      : predio.ate4Pavimentos
        ? "Prédio de até 4 pavimentos no cadastro. "
        : "";

  const faltaAndar = andarEstimadoNoMeio
    ? " Informe o andar do apartamento para calcular na altura exata da unidade."
    : "";

  return {
    alturaEdificioM,
    pavimentos: predio.pavimentos,
    alturaAndarM: alturaAndarConhecida,
    andarAnalisado: andarConhecido,
    andarEstimadoNoMeio,
    horasManhaLeste: leste.horasComVizinhos,
    horasTardeOeste: oeste.horasComVizinhos,
    vizinhoMaisProximoLeste: leste.maiorBloqueio,
    vizinhoMaisProximoOeste: oeste.maiorBloqueio,
    brisaSudeste: {
      situacao: brisaSituacao,
      vizinho: maisPertoSudeste,
      frase: fraseBrisa,
    },
    manchete: `${partesManchete[0]} · ${partesManchete[1]}`,
    detalhe: `${prefixoAltura}${fraseBrisa}${faltaAndar}`,
    janelaRegistrada:
      orientacaoJanelaGraus !== null
        ? analisarJanelaNoRecife(orientacaoJanelaGraus, { predio, vizinhos, andar: andarConhecido })
        : null,
  };
}
