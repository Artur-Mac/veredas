import {
  esquemaEntityLink,
  normalizarParaEntailment,
  type EntityLink,
} from "../contratosCanonicos";
import { wgs84ParaSirgas31985, distanciaPlanarM } from "../geo/sirgas31985";

/**
 * Pipeline Determinístico + Probabilístico de Resolução de Entidades (`Fellegi-Sunter` em 250 m EPSG:31985)
 * e Deduplicação Multi-Corretor de Anúncios (`pHash` perceptual + distância de Hamming + atributos estruturais).
 */

export type CandidatoPredioCadastro = {
  buildingId: string;
  dsqfl: string;
  codLogradouro: string;
  cnm16?: string | null;
  nomeEdificio: string | null;
  logradouro: string;
  numero: string | null;
  bairroSlug: string;
  lon: number;
  lat: number;
  pavimentos: number | null;
  areasTipologiasM2: number[];
};

export type AnuncioParaVincular = {
  adId: string;
  url: string;
  portal: string;
  bairroSlug: string | null;
  logradouroTexto: string | null;
  numeroTexto: string | null;
  nomeEdificioTexto: string | null;
  areaM2: number | null;
  quartos: number | null;
  vagas: number | null;
  andar: number | null;
  precoReais: number | null;
  lon?: number | null;
  lat?: number | null;
  matrizCinza8x8?: number[] | null; // Grade 8x8 normalizada 0..255 para pHash
};

/** Jaro-Winkler clássica normalizada [0, 1] para comparação tolerante a digitação em nomes de edifícios. */
export function jaroWinkler(aRaw: string, bRaw: string): number {
  const a = normalizarParaEntailment(aRaw);
  const b = normalizarParaEntailment(bRaw);
  if (!a || !b) return 0;
  if (a === b) return 1;

  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatch = new Array<boolean>(a.length).fill(false);
  const bMatch = new Array<boolean>(b.length).fill(false);
  let matches = 0;

  for (let i = 0; i < a.length; i += 1) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, b.length);
    for (let j = start; j < end; j += 1) {
      if (bMatch[j] || a[i] !== b[j]) continue;
      aMatch[i] = true;
      bMatch[j] = true;
      matches += 1;
      break;
    }
  }
  if (matches === 0) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!aMatch[i]) continue;
    while (!bMatch[k]) k += 1;
    if (a[i] !== b[k]) t += 1;
    k += 1;
  }
  const m = matches;
  const jaro = (m / a.length + m / b.length + (m - t / 2) / m) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i += 1) {
    if (a[i] === b[i]) prefix += 1;
    else break;
  }
  return Math.round((jaro + prefix * 0.1 * (1 - jaro)) * 10_000) / 10_000;
}

/**
 * Pesos log-verossimilhança Fellegi-Sunter EM calibrados (m_k / u_k):
 * `w_concordancia = ln(m_k / u_k)`, `w_discordancia = ln((1 - m_k) / (1 - u_k))`.
 */
const PESOS_FS = {
  mesmoBairro: { m: 0.96, u: 0.08 },
  logradouroSim: { m: 0.92, u: 0.02 },
  numeroExato: { m: 0.9, u: 0.015 },
  nomeEdificioSim: { m: 0.88, u: 0.025 },
  areaCompativel: { m: 0.93, u: 0.2 },
  andarDentroGabarito: { m: 0.98, u: 0.5 },
} as const;

function pesoLog(concorda: boolean, par: { m: number; u: number }): number {
  return concorda ? Math.log(par.m / par.u) : Math.log((1 - par.m) / (1 - par.u));
}

export function vincularAnuncioFellegiSunter(
  anuncio: AnuncioParaVincular,
  candidatos: readonly CandidatoPredioCadastro[],
  opts: {
    raioBloqueioM?: number;
    limiarConfirmado?: number;
    limiarRevisao?: number;
  } = {},
): EntityLink[] {
  const raio = opts.raioBloqueioM ?? 250;
  const tConf = opts.limiarConfirmado ?? 6.5;
  const tRev = opts.limiarRevisao ?? 1.2;

  const utmAnuncio =
    typeof anuncio.lon === "number" && typeof anuncio.lat === "number"
      ? wgs84ParaSirgas31985(anuncio.lon, anuncio.lat)
      : null;

  const links: EntityLink[] = [];

  for (const c of candidatos) {
    // Blocking espacial estrito de 250 m em EPSG:31985 quando há coordenada
    if (utmAnuncio) {
      const utmC = wgs84ParaSirgas31985(c.lon, c.lat);
      if (distanciaPlanarM(utmAnuncio, utmC) > raio) continue;
    } else if (anuncio.bairroSlug && anuncio.bairroSlug !== c.bairroSlug) {
      continue;
    }

    let score = 0;

    if (anuncio.bairroSlug) {
      score += pesoLog(anuncio.bairroSlug === c.bairroSlug, PESOS_FS.mesmoBairro);
    }

    if (anuncio.logradouroTexto) {
      const simLog = jaroWinkler(anuncio.logradouroTexto, c.logradouro);
      score += pesoLog(simLog >= 0.85, PESOS_FS.logradouroSim);
    }

    if (anuncio.numeroTexto && c.numero) {
      const n1 = anuncio.numeroTexto.replace(/\D+/g, "");
      const n2 = c.numero.replace(/\D+/g, "");
      if (n1 && n2) score += pesoLog(n1 === n2, PESOS_FS.numeroExato);
    }

    if (anuncio.nomeEdificioTexto && c.nomeEdificio) {
      const simNome = jaroWinkler(anuncio.nomeEdificioTexto, c.nomeEdificio);
      score += pesoLog(simNome >= 0.84, PESOS_FS.nomeEdificioSim);
    }

    if (typeof anuncio.areaM2 === "number" && anuncio.areaM2 > 0 && c.areasTipologiasM2.length > 0) {
      const compativel = c.areasTipologiasM2.some((a) => Math.abs(a - anuncio.areaM2!) / Math.max(1, a) <= 0.08);
      score += pesoLog(compativel, PESOS_FS.areaCompativel);
    }

    if (typeof anuncio.andar === "number" && typeof c.pavimentos === "number") {
      score += pesoLog(anuncio.andar <= c.pavimentos, PESOS_FS.andarDentroGabarito);
    }

    const posterior = Math.round((1 / (1 + Math.exp(-(score - 2.2)))) * 10_000) / 10_000;
    const tier: EntityLink["match_tier"] =
      score >= tConf && posterior >= 0.95 ? "confirmado" : score >= tRev ? "candidato_revisao" : "rejeitado";

    links.push(
      esquemaEntityLink.parse({
        link_id: `${anuncio.adId}::${c.dsqfl}`,
        source_entity_type: "anuncio",
        target_dsqfl: c.dsqfl,
        target_building_id: c.buildingId,
        cod_logradouro: c.codLogradouro,
        cnm_16: c.cnm16 ?? null,
        fellegi_sunter_weight: Math.round(score * 1000) / 1000,
        posterior_probability: posterior,
        match_tier: tier,
        // Vínculos na zona cinzenta NUNCA assumem revisão automática: ficam null até ação explícita
        reviewed_by: null,
        requires_user_confirmation: tier === "candidato_revisao",
      }),
    );
  }

  return links.sort((a, b) => b.fellegi_sunter_weight - a.fellegi_sunter_weight);
}

// ——— Deduplicação Multi-Corretor via pHash + Atributos ——————————————————————————————————

/** Calcula dHash/gradient 64-bit determinístico (string hexadecimal de 16 caracteres) sobre grade 8×8. */
export function calcularPhash64(matriz8x8: readonly number[]): string {
  if (matriz8x8.length !== 64) {
    throw new Error(`Grade pHash deve ter exatamente 64 pixels (recebido ${matriz8x8.length}).`);
  }
  const ordenada = [...matriz8x8].sort((a, b) => a - b);
  const mediana = (ordenada[31]! + ordenada[32]!) / 2;
  let bits = 0n;
  for (let i = 0; i < 64; i += 1) {
    if (matriz8x8[i]! > mediana) bits |= 1n << BigInt(i);
  }
  return bits.toString(16).padStart(16, "0");
}

export function distanciaHammingHex64(hashA: string, hashB: string): number {
  let xor = BigInt(`0x${hashA}`) ^ BigInt(`0x${hashB}`);
  let count = 0;
  while (xor > 0n) {
    count += Number(xor & 1n);
    xor >>= 1n;
  }
  return count;
}

export type GrupoAnuncioDeduplicado = {
  unidadeCanonicaId: string;
  anuncios: AnuncioParaVincular[];
  portais: string[];
  precoMinReais: number | null;
  precoMaxReais: number | null;
  dispersaoPrecoPct: number | null;
  motivoAgrupamento: "phash_foto_e_atributos" | "atributos_estruturais_e_edificio";
};

export function deduplicarAnunciosMultiCorretor(
  anuncios: readonly (AnuncioParaVincular & { dsqflVinculado?: string | null })[],
): GrupoAnuncioDeduplicado[] {
  const grupos: {
    rep: AnuncioParaVincular & { dsqflVinculado?: string | null; phash?: string | null };
    itens: AnuncioParaVincular[];
    motivo: GrupoAnuncioDeduplicado["motivoAgrupamento"];
  }[] = [];

  for (const an of anuncios) {
    const phash = an.matrizCinza8x8 && an.matrizCinza8x8.length === 64 ? calcularPhash64(an.matrizCinza8x8) : null;
    let alocou = false;

    for (const g of grupos) {
      const mesmoDsqfl = Boolean(an.dsqflVinculado && g.rep.dsqflVinculado && an.dsqflVinculado === g.rep.dsqflVinculado);
      const areaProx =
        typeof an.areaM2 === "number" &&
        typeof g.rep.areaM2 === "number" &&
        Math.abs(an.areaM2 - g.rep.areaM2) <= Math.max(2, g.rep.areaM2 * 0.03);
      const mesmosQuartos = an.quartos === g.rep.quartos;
      const mesmoAndar = an.andar === null || g.rep.andar === null || an.andar === g.rep.andar;

      const phashProximo =
        phash !== null && g.rep.phash != null && distanciaHammingHex64(phash, g.rep.phash) <= 6;

      if ((mesmoDsqfl && areaProx && mesmosQuartos && mesmoAndar) || (phashProximo && areaProx)) {
        g.itens.push(an);
        if (phashProximo) g.motivo = "phash_foto_e_atributos";
        alocou = true;
        break;
      }
    }

    if (!alocou) {
      grupos.push({
        rep: { ...an, phash },
        itens: [an],
        motivo: phash ? "phash_foto_e_atributos" : "atributos_estruturais_e_edificio",
      });
    }
  }

  return grupos.map((g, idx) => {
    const precos = g.itens.map((i) => i.precoReais).filter((v): v is number => typeof v === "number" && v > 0);
    const minP = precos.length > 0 ? Math.min(...precos) : null;
    const maxP = precos.length > 0 ? Math.max(...precos) : null;
    const disp = minP !== null && maxP !== null && minP > 0 ? Math.round(((maxP - minP) / minP) * 1000) / 10 : null;
    const portais = [...new Set(g.itens.map((i) => i.portal))].sort();
    return {
      unidadeCanonicaId: `unit-${idx + 1}-${g.itens[0]!.adId}`,
      anuncios: g.itens,
      portais,
      precoMinReais: minP,
      precoMaxReais: maxP,
      dispersaoPrecoPct: disp,
      motivoAgrupamento: g.motivo,
    };
  });
}
