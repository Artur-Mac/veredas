import {
  montarDossieCamadaZero,
  validarCodigoIbge7,
  type AdaptadorCamadaZeroInput,
  type DossieNacionalCamadaZero,
  type TierMunicipio,
} from "../../nucleo/camadaZeroNacional";

/**
 * Registro Desacoplado de Adaptadores Municipais (Camadas 0, 1 e 2).
 * Permite ao mesmo cliente offline operar em Recife (`C2`, profundidade completa ESIG + PE3D + 156 + ITBI)
 * ou em capitais brasileiras (`C1` GeoSampa/SQL, ObservaPOA, Fortaleza, BH, Rio, Curitiba) e qualquer dos
 * 5.570 municípios brasileiros (`C0` Núcleo Nacional Universal) sem código específico de cidade no núcleo.
 */

export type CapacidadesMunicipais = {
  codigoIbge7: string;
  nome: string;
  uf: string;
  tier: TierMunicipio;
  chaveCadastralLocal: string;
  portalGeoOficial: string;
  possuiItbiPorTransacao: boolean;
  possuiLidarAltaResolucao: boolean;
  possuiDrenagemMicro156: boolean;
  pacoteOfflineSlug: string | null;
};

export const CATALOGO_MUNICIPIOS_ATIVOS: Record<string, CapacidadesMunicipais> = {
  "2611606": {
    codigoIbge7: "2611606",
    nome: "Recife",
    uf: "PE",
    tier: "C2",
    chaveCadastralLocal: "DSQFL (14 dígitos) + Sequencial IPTU",
    portalGeoOficial: "ESIG Recife / Dados Abertos + PE3D LiDAR 1 m",
    possuiItbiPorTransacao: true,
    possuiLidarAltaResolucao: true,
    possuiDrenagemMicro156: true,
    pacoteOfflineSlug: "recife_2026_11",
  },
  "3550308": {
    codigoIbge7: "3550308",
    nome: "São Paulo",
    uf: "SP",
    tier: "C1",
    chaveCadastralLocal: "SQL (Setor-Quadra-Lote) GeoSampa",
    portalGeoOficial: "GeoSampa / IPTU-PGV / ITBI Prefeitura SP",
    possuiItbiPorTransacao: true,
    possuiLidarAltaResolucao: true,
    possuiDrenagemMicro156: true,
    pacoteOfflineSlug: null,
  },
  "4314902": {
    codigoIbge7: "4314902",
    nome: "Porto Alegre",
    uf: "RS",
    tier: "C1",
    chaveCadastralLocal: "Inscrição Imobiliária SMFA / ObservaPOA",
    portalGeoOficial: "ObservaPOA / Dados Abertos PMPA",
    possuiItbiPorTransacao: false,
    possuiLidarAltaResolucao: false,
    possuiDrenagemMicro156: true,
    pacoteOfflineSlug: null,
  },
  "2304400": {
    codigoIbge7: "2304400",
    nome: "Fortaleza",
    uf: "CE",
    tier: "C1",
    chaveCadastralLocal: "Inscrição Cartográfica SEFIN / GeoFor",
    portalGeoOficial: "Fortaleza em Mapas / Dados Abertos SEFIN",
    possuiItbiPorTransacao: true,
    possuiLidarAltaResolucao: false,
    possuiDrenagemMicro156: false,
    pacoteOfflineSlug: null,
  },
  "3106200": {
    codigoIbge7: "3106200",
    nome: "Belo Horizonte",
    uf: "MG",
    tier: "C1",
    chaveCadastralLocal: "Índice Cadastral PBH / BHMap",
    portalGeoOficial: "BHMap / PRODABEL Dados Abertos",
    possuiItbiPorTransacao: true,
    possuiLidarAltaResolucao: true,
    possuiDrenagemMicro156: true,
    pacoteOfflineSlug: null,
  },
  "3304557": {
    codigoIbge7: "3304557",
    nome: "Rio de Janeiro",
    uf: "RJ",
    tier: "C1",
    chaveCadastralLocal: "Inscrição IPTU SMF / IPP",
    portalGeoOficial: "Data.Rio / Instituto Pereira Passos",
    possuiItbiPorTransacao: true,
    possuiLidarAltaResolucao: true,
    possuiDrenagemMicro156: true,
    pacoteOfflineSlug: null,
  },
  "4106902": {
    codigoIbge7: "4106902",
    nome: "Curitiba",
    uf: "PR",
    tier: "C1",
    chaveCadastralLocal: "Indicação Fiscal PMC / IPPUC",
    portalGeoOficial: "GeoCuritiba / IPPUC",
    possuiItbiPorTransacao: true,
    possuiLidarAltaResolucao: false,
    possuiDrenagemMicro156: true,
    pacoteOfflineSlug: null,
  },
};

export function resolverCapacidadesMunicipio(
  codigoIbge7: string,
  fallbackNome?: string,
  fallbackUf?: string,
): CapacidadesMunicipais {
  const conhecido = CATALOGO_MUNICIPIOS_ATIVOS[codigoIbge7];
  if (conhecido) return conhecido;
  if (!validarCodigoIbge7(codigoIbge7)) {
    throw new Error(`Código IBGE inválido: ${codigoIbge7}`);
  }
  return {
    codigoIbge7,
    nome: fallbackNome ?? `Município IBGE ${codigoIbge7}`,
    uf: (fallbackUf ?? "BR").toUpperCase(),
    tier: "C0",
    chaveCadastralLocal: "CNM 16 dígitos ONR + Coordenada WGS84/SIRGAS",
    portalGeoOficial: "Núcleo Nacional (IBGE / ANATEL / ANEEL / SPU / ONR / DataJud)",
    possuiItbiPorTransacao: false,
    possuiLidarAltaResolucao: false,
    possuiDrenagemMicro156: false,
    pacoteOfflineSlug: null,
  };
}

export function diagnosticarImovelPorMunicipio(entrada: AdaptadorCamadaZeroInput): {
  capacidades: CapacidadesMunicipais;
  dossieBaseNacional: DossieNacionalCamadaZero;
} {
  const cap = resolverCapacidadesMunicipio(entrada.codigoIbge7, entrada.nomeMunicipio, entrada.uf);
  const dossie = montarDossieCamadaZero(entrada, cap.tier);
  if (cap.tier !== "C0") {
    dossie.modulosDisponiveis.unshift(`Cadastro Municipal ${cap.tier} (${cap.chaveCadastralLocal})`);
  }
  return { capacidades: cap, dossieBaseNacional: dossie };
}
