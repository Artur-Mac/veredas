import type { Edificio } from "../contratos";
import { emMetros } from "./geometria";

export type PapelFachada = "frente_rua" | "lateral_1" | "lateral_2" | "fundos";
export type GrupoSolarRecife = "Nascente" | "Poente" | "Norte" | "Sul";

export type FachadaInferida = {
  id: PapelFachada;
  papelRotulo: "Frente Rua" | "Lateral" | "Fundos";
  azimuteGraus: number;
  orientacaoSolar: string;
  grupoSolar: GrupoSolarRecife;
  rotuloBotao: string;
  rotuloCompleto: string;
  recebeBrisaAlisia: boolean;
  alinhamentoBrisaPct: number;
  pontoMedioM: [number, number];
  larguraM: number;
  compativelComAnuncio: boolean;
};

export type PistasAnuncioSolar = {
  mencionouNascente: boolean;
  mencionouPoente: boolean;
  mencionouSuperVentilado: boolean;
  mencionouVistaMar: boolean;
  resumoPistas: string | null;
};

export type InferenciaDeFachadas = {
  frenteAzimuteGraus: number;
  larguraM: number;
  profundidadeM: number;
  poligonoMetros: [number, number][];
  fachadas: [FachadaInferida, FachadaInferida, FachadaInferida, FachadaInferida];
  fachadaSugeridaId: PapelFachada;
  frente: FachadaInferida;
  fundos: FachadaInferida;
  confianca: "alta_anuncio_e_rua" | "media_pela_rua" | "estimada_geometria";
  resumoAutomatico: string;
  subtituloExplicacao: string;
  pistas: PistasAnuncioSolar;
};

export type VizinhoParaFachada = Pick<Edificio, "id" | "logradouro" | "centro" | "pavimentos" | "poligono">;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export function normalizarAzimute(graus: number): number {
  const mod = Math.round(((graus % 360) + 360) % 360);
  return mod === 360 ? 0 : mod;
}

/**
 * Classificação solar específica para Recife (~8°S):
 * Alísios predominantes sopram de E/SE (90°–160°); Nascente centra em ~90°, Poente em ~270°.
 */
export function classificarOrientacaoRecife(azimuteGraus: number): {
  orientacaoSolar: string;
  grupoSolar: GrupoSolarRecife;
  recebeBrisaAlisia: boolean;
  alinhamentoBrisaPct: number;
} {
  const az = normalizarAzimute(azimuteGraus);
  // Alinhamento com os ventos alísios E-SE (centro em 125°)
  const cosBrisa = Math.cos((az - 125) * RAD);
  const alinhamentoBrisaPct = Math.round(Math.max(0, cosBrisa) * 100);
  const recebeBrisaAlisia = cosBrisa >= 0.55; // aprox. 70° a 180°

  if (az >= 45 && az <= 135) {
    const orientacaoSolar =
      az < 68 ? "Nascente-Norte" : az > 112 ? "Nascente-Sul" : "Nascente";
    return { orientacaoSolar, grupoSolar: "Nascente", recebeBrisaAlisia, alinhamentoBrisaPct };
  }
  if (az > 135 && az < 225) {
    const orientacaoSolar =
      az < 158 ? "Sul-Nascente" : az > 202 ? "Sul-Poente" : "Sul";
    return { orientacaoSolar, grupoSolar: "Sul", recebeBrisaAlisia, alinhamentoBrisaPct };
  }
  if (az >= 225 && az <= 315) {
    const orientacaoSolar =
      az < 248 ? "Poente-Sul" : az > 292 ? "Poente-Norte" : "Poente";
    return { orientacaoSolar, grupoSolar: "Poente", recebeBrisaAlisia, alinhamentoBrisaPct };
  }
  const orientacaoSolar =
    az >= 315 && az < 338 ? "Norte-Poente" : az > 22 && az < 45 ? "Norte-Nascente" : "Norte";
  return { orientacaoSolar, grupoSolar: "Norte", recebeBrisaAlisia, alinhamentoBrisaPct };
}

export function extrairPistasOrientacao(texto?: string | null): PistasAnuncioSolar {
  const t = (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const mencionouNascente = /\bnascent|\bsol da manha|\bleste\b/.test(t);
  const mencionouPoente = /\bpoente|\bsol da tarde|\boeste\b/.test(t);
  const mencionouSuperVentilado = /\bsuper ?ventilad|\bventilacao cruzada|\bventila(do|cao)\b|\bbrisa\b/.test(t);
  const mencionouVistaMar = /\bfrente mar\b|\bvista (para o )?mar\b|\bbeira mar\b/.test(t);

  const achados: string[] = [];
  if (mencionouNascente) achados.push("nascente");
  if (mencionouPoente) achados.push("poente");
  if (mencionouSuperVentilado) achados.push("ventilação");
  if (mencionouVistaMar) achados.push("vista mar");

  return {
    mencionouNascente,
    mencionouPoente,
    mencionouSuperVentilado,
    mencionouVistaMar,
    resumoPistas: achados.length > 0 ? achados.join(" · ") : null,
  };
}

function normalizarNomeRua(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(r\.|rua|av\.|avenida|trav\.|travessa|estr\.|estrada|praca|pc\.)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function codigoRua(id: string): string {
  const parte = id.split("-")[0] ?? "";
  return /^\d+$/.test(parte) ? parte : "";
}

function limparPoligonoMetros(
  poligono: readonly [number, number][] | null | undefined,
  centro: readonly [number, number],
): [number, number][] {
  if (!poligono || poligono.length < 3) {
    return [
      [-11, -7],
      [11, -7],
      [11, 7],
      [-11, 7],
    ];
  }
  const pts = poligono.map((p) => emMetros(p, [centro[0], centro[1]]) as [number, number]);
  const ultimo = pts[pts.length - 1];
  const primeiro = pts[0];
  if (ultimo && primeiro && Math.hypot(ultimo[0] - primeiro[0], ultimo[1] - primeiro[1]) < 0.05) {
    pts.pop();
  }
  if (pts.length < 3) {
    return [
      [-11, -7],
      [11, -7],
      [11, 7],
      [-11, 7],
    ];
  }
  return pts;
}

type RetanguloMinimo = {
  eixoU: [number, number]; // direção unitária de u
  eixoV: [number, number]; // direção unitária de v (90° horário)
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
  cx: number;
  cy: number;
};

/** Calcula o retângulo envolvente mínimo orientado (OBB) sobre as arestas do polígono. */
function calcularObb(pts: readonly [number, number][]): RetanguloMinimo {
  let melhorArea = Number.POSITIVE_INFINITY;
  let melhorAngulo = 0;

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const comp = Math.hypot(dx, dy);
    if (comp < 0.3) continue;
    const ang = Math.atan2(dx, dy);
    const ux = Math.sin(ang);
    const uy = Math.cos(ang);
    const vx = uy;
    const vy = -ux;

    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const p of pts) {
      const u = p[0] * ux + p[1] * uy;
      const v = p[0] * vx + p[1] * vy;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const area = (maxU - minU) * (maxV - minV);
    if (area > 0 && area < melhorArea) {
      melhorArea = area;
      melhorAngulo = ang;
    }
  }

  const ux = Math.sin(melhorAngulo);
  const uy = Math.cos(melhorAngulo);
  const vx = uy;
  const vy = -ux;

  let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
  for (const p of pts) {
    const u = p[0] * ux + p[1] * uy;
    const v = p[0] * vx + p[1] * vy;
    if (u < uMin) uMin = u;
    if (u > uMax) uMax = u;
    if (v < vMin) vMin = v;
    if (v > vMax) vMax = v;
  }

  const uMid = (uMin + uMax) / 2;
  const vMid = (vMin + vMax) / 2;

  return {
    eixoU: [ux, uy],
    eixoV: [vx, vy],
    uMin,
    uMax,
    vMin,
    vMax,
    cx: uMid * ux + vMid * vx,
    cy: uMid * uy + vMid * vy,
  };
}

type CandidataFace = {
  normal: [number, number];
  azimuteGraus: number;
  pontoMedioM: [number, number];
  larguraM: number;
};

/**
 * Infere automaticamente a orientação solar da frente da rua e dos 4 lados do edifício
 * usando o polígono cadastral do imóvel e os edifícios vizinhos no mesmo logradouro.
 */
export function inferirFachadasDoEdificio(params: {
  edificio: Pick<Edificio, "id" | "logradouro" | "centro" | "poligono"> & { bairro?: string | null };
  vizinhosDoBairro?: readonly VizinhoParaFachada[];
  textoAnuncio?: string | null;
}): InferenciaDeFachadas {
  const { edificio, vizinhosDoBairro = [], textoAnuncio } = params;
  const centro: [number, number] = [edificio.centro[0], edificio.centro[1]];
  const poligonoMetros = limparPoligonoMetros(edificio.poligono, centro);
  const obb = calcularObb(poligonoMetros);

  const larguraU = Math.max(4, obb.uMax - obb.uMin);
  const larguraV = Math.max(4, obb.vMax - obb.vMin);
  const meiaU = larguraU / 2;
  const meiaV = larguraV / 2;

  const candidatas: CandidataFace[] = [
    {
      normal: [obb.eixoU[0], obb.eixoU[1]],
      azimuteGraus: normalizarAzimute(Math.atan2(obb.eixoU[0], obb.eixoU[1]) * DEG),
      pontoMedioM: [obb.cx + obb.eixoU[0] * meiaU, obb.cy + obb.eixoU[1] * meiaU],
      larguraM: larguraV,
    },
    {
      normal: [obb.eixoV[0], obb.eixoV[1]],
      azimuteGraus: normalizarAzimute(Math.atan2(obb.eixoV[0], obb.eixoV[1]) * DEG),
      pontoMedioM: [obb.cx + obb.eixoV[0] * meiaV, obb.cy + obb.eixoV[1] * meiaV],
      larguraM: larguraU,
    },
    {
      normal: [-obb.eixoU[0], -obb.eixoU[1]],
      azimuteGraus: normalizarAzimute(Math.atan2(-obb.eixoU[0], -obb.eixoU[1]) * DEG),
      pontoMedioM: [obb.cx - obb.eixoU[0] * meiaU, obb.cy - obb.eixoU[1] * meiaU],
      larguraM: larguraV,
    },
    {
      normal: [-obb.eixoV[0], -obb.eixoV[1]],
      azimuteGraus: normalizarAzimute(Math.atan2(-obb.eixoV[0], -obb.eixoV[1]) * DEG),
      pontoMedioM: [obb.cx - obb.eixoV[0] * meiaV, obb.cy - obb.eixoV[1] * meiaV],
      larguraM: larguraU,
    },
  ];

  // Filtrar vizinhos próximos (150 m) e distinguir mesma rua vs ruas adjacentes/fundos
  const normAlvo = normalizarNomeRua(edificio.logradouro);
  const codAlvo = codigoRua(edificio.id);
  const proximos = vizinhosDoBairro
    .filter((v) => v.id !== edificio.id)
    .map((v) => {
      const m = emMetros(v.centro, centro) as [number, number];
      const dist = Math.hypot(m[0], m[1]);
      const mesmaRua =
        (codAlvo.length > 0 && codigoRua(v.id) === codAlvo) ||
        (normAlvo.length > 2 && normalizarNomeRua(v.logradouro) === normAlvo);
      return { v, m, dist, mesmaRua };
    })
    .filter((item) => item.dist > 1 && item.dist <= 150);

  const mesmaRuaVizinhos = proximos.filter((p) => p.mesmaRua);

  // Vetor dominante do eixo da rua se houver >= 2 vizinhos na mesma rua
  let ruaEixo: [number, number] | null = null;
  if (mesmaRuaVizinhos.length >= 2) {
    let cxx = 0, cxy = 0, cyy = 0;
    for (const p of mesmaRuaVizinhos) {
      cxx += p.m[0] * p.m[0];
      cxy += p.m[0] * p.m[1];
      cyy += p.m[1] * p.m[1];
    }
    const tr = cxx + cyy;
    if (tr > 1) {
      const phi = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
      ruaEixo = [Math.cos(phi), Math.sin(phi)];
    }
  }

  let melhorIdx = 0;
  let melhorScore = -Infinity;
  let evidenciaRuaForte = false;

  for (let idx = 0; idx < 4; idx++) {
    const f = candidatas[idx]!;
    let score = 0;

    // Bônus se perpendicular ao eixo estimado da rua (quem olha para a rua está perpendicular ao traçado)
    if (ruaEixo) {
      const paralelismoRua = Math.abs(f.normal[0] * ruaEixo[0] + f.normal[1] * ruaEixo[1]);
      score += (1 - paralelismoRua) * 3.2;
      if (1 - paralelismoRua > 0.6) evidenciaRuaForte = true;
    }

    // Vizinhos na frente: mesma rua = fachada oposta da mesma via (+3.5); outra rua = fundos (-2.0)
    for (const viz of proximos) {
      if (viz.dist > 75) continue;
      const proj = viz.m[0] * f.normal[0] + viz.m[1] * f.normal[1];
      const lat = Math.abs(viz.m[0] * -f.normal[1] + viz.m[1] * f.normal[0]);
      if (proj >= 7 && proj <= 65 && lat <= Math.max(22, proj * 0.9)) {
        if (viz.mesmaRua) {
          score += 3.5;
          evidenciaRuaForte = true;
        } else {
          score -= 1.8;
        }
      }
      // Bloqueio imediato muito colado (< 6m) sugere divisa de lote, não via pública
      if (proj > 0 && proj < 6 && lat < 14 && !viz.mesmaRua) {
        score -= 2.5;
      }
    }

    // Desempate discreto para face mais voltada ao quadrante mar/leste/nordeste caso quadra simétrica
    const fatorLeste = Math.cos((f.azimuteGraus - 105) * RAD) * 0.15;
    const fatorLargura = (f.larguraM / Math.max(larguraU, larguraV)) * 0.1;
    score += fatorLeste + fatorLargura;

    if (score > melhorScore) {
      melhorScore = score;
      melhorIdx = idx;
    }
  }

  // Ordenar em: frente_rua, lateral_1 (+90°), fundos (+180°), lateral_2 (+270°)
  const idxFrente = melhorIdx;
  const idxLat1 = (melhorIdx + 1) % 4;
  const idxFundos = (melhorIdx + 2) % 4;
  const idxLat2 = (melhorIdx + 3) % 4;

  const pistas = extrairPistasOrientacao(textoAnuncio);

  const construirFachada = (id: PapelFachada, papelRotulo: "Frente Rua" | "Lateral" | "Fundos", cand: CandidataFace): FachadaInferida => {
    const cl = classificarOrientacaoRecife(cand.azimuteGraus);
    const compativelComAnuncio =
      (pistas.mencionouNascente && cl.grupoSolar === "Nascente") ||
      (pistas.mencionouPoente && cl.grupoSolar === "Poente") ||
      (pistas.mencionouVistaMar && cand.azimuteGraus >= 45 && cand.azimuteGraus <= 145) ||
      (pistas.mencionouSuperVentilado && cl.recebeBrisaAlisia);

    return {
      id,
      papelRotulo,
      azimuteGraus: cand.azimuteGraus,
      orientacaoSolar: cl.orientacaoSolar,
      grupoSolar: cl.grupoSolar,
      rotuloBotao: `${papelRotulo} · ${cl.orientacaoSolar}`,
      rotuloCompleto: `${papelRotulo} · ${cl.orientacaoSolar} (${cand.azimuteGraus}°)` ,
      recebeBrisaAlisia: cl.recebeBrisaAlisia,
      alinhamentoBrisaPct: cl.alinhamentoBrisaPct,
      pontoMedioM: cand.pontoMedioM,
      larguraM: Math.round(cand.larguraM * 10) / 10,
      compativelComAnuncio,
    };
  };

  const frente = construirFachada("frente_rua", "Frente Rua", candidatas[idxFrente]!);
  const lateral1 = construirFachada("lateral_1", "Lateral", candidatas[idxLat1]!);
  const lateral2 = construirFachada("lateral_2", "Lateral", candidatas[idxLat2]!);
  const fundos = construirFachada("fundos", "Fundos", candidatas[idxFundos]!);
  const fachadas: [FachadaInferida, FachadaInferida, FachadaInferida, FachadaInferida] = [
    frente,
    lateral1,
    lateral2,
    fundos,
  ];

  // Determinar fachada sugerida combinando frente + pistas do anúncio
  let fachadaSugeridaId: PapelFachada = "frente_rua";
  if (pistas.mencionouNascente) {
    const matchNascente = fachadas.find((f) => f.grupoSolar === "Nascente");
    if (matchNascente) fachadaSugeridaId = matchNascente.id;
  } else if (pistas.mencionouPoente) {
    const matchPoente = fachadas.find((f) => f.grupoSolar === "Poente");
    if (matchPoente) fachadaSugeridaId = matchPoente.id;
  } else if (pistas.mencionouVistaMar) {
    const maisLeste = [...fachadas].sort(
      (a, b) => Math.abs(((a.azimuteGraus - 100 + 540) % 360) - 180) - Math.abs(((b.azimuteGraus - 100 + 540) % 360) - 180),
    )[0];
    if (maisLeste) fachadaSugeridaId = maisLeste.id;
  } else if (pistas.mencionouSuperVentilado && !frente.recebeBrisaAlisia) {
    const maisBrisa = [...fachadas].sort((a, b) => b.alinhamentoBrisaPct - a.alinhamentoBrisaPct)[0];
    if (maisBrisa && maisBrisa.alinhamentoBrisaPct > frente.alinhamentoBrisaPct + 20) {
      fachadaSugeridaId = maisBrisa.id;
    }
  }

  const sugerida = fachadas.find((f) => f.id === fachadaSugeridaId) ?? frente;
  const confianca: InferenciaDeFachadas["confianca"] =
    pistas.resumoPistas && sugerida.compativelComAnuncio
      ? "alta_anuncio_e_rua"
      : evidenciaRuaForte
        ? "media_pela_rua"
        : "estimada_geometria";

  const resumoAutomatico = `Frente do prédio é ${frente.orientacaoSolar} (${frente.azimuteGraus}°) · Fundos são ${fundos.orientacaoSolar} (${fundos.azimuteGraus}°).`;

  const subtituloExplicacao =
    confianca === "alta_anuncio_e_rua"
      ? `Posição na rua cruzada com pistas do anúncio (${pistas.resumoPistas}): toque em outro lado se a unidade apontar para lá.`
      : confianca === "media_pela_rua"
        ? "Orientação calculada automaticamente pelo polígono do prédio na rua — toque em qualquer lado para simular outro apartamento."
        : "Orientação estimada pelo contorno do lote. Toque no lado em que ficam as janelas principais do apartamento.";

  return {
    frenteAzimuteGraus: frente.azimuteGraus,
    larguraM: Math.round(candidatas[idxFrente]!.larguraM * 10) / 10,
    profundidadeM: Math.round(candidatas[idxLat1]!.larguraM * 10) / 10,
    poligonoMetros,
    fachadas,
    fachadaSugeridaId,
    frente,
    fundos,
    confianca,
    resumoAutomatico,
    subtituloExplicacao,
    pistas,
  };
}
