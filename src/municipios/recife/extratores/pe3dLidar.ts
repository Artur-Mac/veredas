import type { EpistemicTag } from "../../../nucleo/contratosCanonicos";

/**
 * Conector PE3D LiDAR (escala 1:1.000 no Recife, resolução altimétrica 0,5–1,0 m e ortofotos 12 cm).
 * Separa cota do terreno (MDT) de alturas construídas e dossel arbóreo (nDSM = MDS - MDT),
 * mantendo proveniência explícita quando recorre ao cadastro 3D ESIG ou DEM GLO-30.
 */

export type GradeRasterPe3d = {
  fonte: "pe3d_lidar";
  resolucaoM: number; // 0.5 ou 1.0
  lon0: number;
  lat0: number;
  passoDeg: number;
  cols: number;
  lins: number;
  mdtMetros: Float32Array;
  mdsMetros: Float32Array;
};

export type LeituraAltimetrica3D = {
  cotaTerrenoM: number | null;
  cotaTopoM: number | null;
  alturaAcimaDoSoloM: number | null; // MDS - MDT (nDSM)
  origem: "pe3d_lidar" | "esig_edificacao_3d" | "copernicus_glo30" | "nao_sabemos";
  epistemicTag: EpistemicTag;
};

function lerCelulaBilinear(grade: Float32Array, cols: number, lins: number, colF: number, linF: number): number | null {
  const c0 = Math.floor(colF);
  const r0 = Math.floor(linF);
  const c1 = Math.min(cols - 1, c0 + 1);
  const r1 = Math.min(lins - 1, r0 + 1);
  if (c0 < 0 || r0 < 0 || c0 >= cols || r0 >= lins) return null;

  const v00 = grade[r0 * cols + c0]!;
  const v10 = grade[r0 * cols + c1]!;
  const v01 = grade[r1 * cols + c0]!;
  const v11 = grade[r1 * cols + c1]!;
  if (![v00, v10, v01, v11].every((v) => Number.isFinite(v) && v > -900)) return null;

  const tx = colF - c0;
  const ty = linF - r0;
  return (1 - tx) * (1 - ty) * v00 + tx * (1 - ty) * v10 + (1 - tx) * ty * v01 + tx * ty * v11;
}

export function extrairAlturaPe3dNoPonto(grade: GradeRasterPe3d, lon: number, lat: number): LeituraAltimetrica3D {
  const colF = (lon - grade.lon0) / grade.passoDeg;
  const linF = (lat - grade.lat0) / grade.passoDeg;
  const mdt = lerCelulaBilinear(grade.mdtMetros, grade.cols, grade.lins, colF, linF);
  const mds = lerCelulaBilinear(grade.mdsMetros, grade.cols, grade.lins, colF, linF);

  if (mdt === null || mds === null) {
    return {
      cotaTerrenoM: null,
      cotaTopoM: null,
      alturaAcimaDoSoloM: null,
      origem: "nao_sabemos",
      epistemicTag: "nao_sabemos",
    };
  }

  const ndsm = Math.max(0, mds - mdt);
  return {
    cotaTerrenoM: Math.round(mdt * 100) / 100,
    cotaTopoM: Math.round(mds * 100) / 100,
    alturaAcimaDoSoloM: Math.round(ndsm * 100) / 100,
    origem: "pe3d_lidar",
    epistemicTag: "registro_oficial",
  };
}

/**
 * Resolve altura de edificação ou dossel com fallback explícito:
 * 1) LiDAR PE3D (MDS - MDT, `registro_oficial`)
 * 2) Edificação 3D ESIG / `edificacoes-3d.zip` (`registro_oficial`)
 * 3) Estimativa paramétrica por pavimentos (`pavimentos * 3.1m`, `inferencia`)
 * 4) `nao_sabemos`
 */
export function resolverAlturaEdificacao3D(entrada: {
  gradePe3d?: GradeRasterPe3d | null;
  lon: number;
  lat: number;
  alturaEsigM?: number | null;
  pavimentos?: number | null;
}): LeituraAltimetrica3D {
  if (entrada.gradePe3d) {
    const l = extrairAlturaPe3dNoPonto(entrada.gradePe3d, entrada.lon, entrada.lat);
    if (l.alturaAcimaDoSoloM !== null) return l;
  }
  if (typeof entrada.alturaEsigM === "number" && Number.isFinite(entrada.alturaEsigM) && entrada.alturaEsigM > 0) {
    return {
      cotaTerrenoM: null,
      cotaTopoM: Math.round(entrada.alturaEsigM * 100) / 100,
      alturaAcimaDoSoloM: Math.round(entrada.alturaEsigM * 100) / 100,
      origem: "esig_edificacao_3d",
      epistemicTag: "registro_oficial",
    };
  }
  if (typeof entrada.pavimentos === "number" && Number.isFinite(entrada.pavimentos) && entrada.pavimentos > 0) {
    const alt = Math.round((entrada.pavimentos * 3.1 + 1.5) * 10) / 10;
    return {
      cotaTerrenoM: null,
      cotaTopoM: null,
      alturaAcimaDoSoloM: alt,
      origem: "copernicus_glo30",
      epistemicTag: "inferencia",
    };
  }
  return {
    cotaTerrenoM: null,
    cotaTopoM: null,
    alturaAcimaDoSoloM: null,
    origem: "nao_sabemos",
    epistemicTag: "nao_sabemos",
  };
}
