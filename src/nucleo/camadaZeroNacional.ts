import type { EpistemicTag } from "./contratosCanonicos";

/**
 * CAMADA 0 — Núcleo Nacional Universal (Cobertura dos 5.570 municípios brasileiros).
 * Independe de qualquer cadastro municipal específico (C1/C2): consome IBGE Censo/CNEFE,
 * ANATEL (ERBs 4G/5G), ANEEL (DEC/FEC), CEMADEN/CPRM, SPU litoral/fluvial, ANAC RBAC 161,
 * MapBiomas LST, ONR CNM e DataJud (APIs públicas CNJ por UF).
 */

export type TierMunicipio = "C0" | "C1" | "C2";

export type AdaptadorCamadaZeroInput = {
  codigoIbge7: string;
  nomeMunicipio: string;
  uf: string;
  emPoligonalSpuEstuarinaOuCosteira?: boolean;
  setorCenso2022?: {
    domicilios: number | null;
    calcadaPct: number | null;
    arborizacaoPct: number | null;
    rampaPct: number | null;
  } | null;
  conjuntoAneelDec?: number | null;
  conjuntoAneelFec?: number | null;
  distanciaErb5gM?: number | null;
  deltaIlhaCalorMapBiomasC?: number | null;
  areaRiscoCprm?: boolean;
  curvaPezrAnacDb?: number | null;
};

export type DossieNacionalCamadaZero = {
  codigoIbge7: string;
  municipio: string;
  uf: string;
  tierAtivo: TierMunicipio;
  coberturaBase: "Núcleo Nacional Universal (5.570 municípios)";
  sinaisNacionais: {
    spuCosteiroOuFluvialAtencao: boolean;
    aneelDecHorasAno: number | null;
    aneelFecInterrupcoesAno: number | null;
    cobertura5gEstimada: "forte" | "media" | "baixa" | "nao_sabemos";
    deltaCalorMapBiomasC: number | null;
    riscoGeologicoCprm: boolean;
    ruidoAeroportuarioAnacDb: number | null;
    priorEntornoCensoCalcadaPct: number | null;
  };
  modulosDisponiveis: string[];
  tagPredominante: EpistemicTag;
};

const TRIBUNAL_ESTADUAL_POR_UF: Record<string, string> = {
  PE: "api_publica_tjpe",
  SP: "api_publica_tjsp",
  RJ: "api_publica_tjrj",
  RS: "api_publica_tjrs",
  MG: "api_publica_tjmg",
  CE: "api_publica_tjce",
  PR: "api_publica_tjpr",
  BA: "api_publica_tjba",
  DF: "api_publica_tjdft",
};

export function validarCodigoIbge7(codigo: string): boolean {
  return /^[1-5]\d{6}$/.test(codigo);
}

export function endpointDatajudEstadualPorUf(uf: string): string {
  const slug = TRIBUNAL_ESTADUAL_POR_UF[uf.toUpperCase()];
  if (slug) return `https://api-publica.datajud.cnj.jus.br/${slug}/_search`;
  return `https://api-publica.datajud.cnj.jus.br/api_publica_tj${uf.toLowerCase()}/_search`;
}

export function montarDossieCamadaZero(
  entrada: AdaptadorCamadaZeroInput,
  tier = "C0" as TierMunicipio,
): DossieNacionalCamadaZero {
  if (!validarCodigoIbge7(entrada.codigoIbge7)) {
    throw new Error(`Código IBGE municipal de 7 dígitos inválido: ${entrada.codigoIbge7}`);
  }

  let cov5g: DossieNacionalCamadaZero["sinaisNacionais"]["cobertura5gEstimada"] = "nao_sabemos";
  if (typeof entrada.distanciaErb5gM === "number") {
    cov5g = entrada.distanciaErb5gM <= 450 ? "forte" : entrada.distanciaErb5gM <= 1100 ? "media" : "baixa";
  }

  return {
    codigoIbge7: entrada.codigoIbge7,
    municipio: entrada.nomeMunicipio,
    uf: entrada.uf.toUpperCase(),
    tierAtivo: tier,
    coberturaBase: "Núcleo Nacional Universal (5.570 municípios)",
    sinaisNacionais: {
      spuCosteiroOuFluvialAtencao: entrada.emPoligonalSpuEstuarinaOuCosteira ?? false,
      aneelDecHorasAno: entrada.conjuntoAneelDec ?? null,
      aneelFecInterrupcoesAno: entrada.conjuntoAneelFec ?? null,
      cobertura5gEstimada: cov5g,
      deltaCalorMapBiomasC: entrada.deltaIlhaCalorMapBiomasC ?? null,
      riscoGeologicoCprm: entrada.areaRiscoCprm ?? false,
      ruidoAeroportuarioAnacDb: entrada.curvaPezrAnacDb ?? null,
      priorEntornoCensoCalcadaPct: entrada.setorCenso2022?.calcadaPct ?? null,
    },
    modulosDisponiveis: [
      "Auditoria documental ONR (CNM 16 dígitos)",
      "DataJud CNJ estadual e TRF",
      "Resiliência ANEEL / ANATEL 5G",
      "Clima MapBiomas LST / CPRM / PEZR ANAC",
      "Simulador financeiro SPU e Custo por Partes",
    ],
    tagPredominante: "registro_oficial",
  };
}
