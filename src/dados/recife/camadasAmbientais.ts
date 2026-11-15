import { z } from "zod";
import { distanciaMetros } from "../geo";

const esquemaCamadasAmbientais = z.strictObject({
  versao: z.literal(1),
  municipio: z.literal("2611606"),
  consultadoEm: z.string(),
  calorSuperficie: z.strictObject({
    fonte: z.string(),
    licenca: z.string(),
    url: z.string().url(),
    cenasUsadas: z.array(
      z.strictObject({
        id: z.string(),
        data: z.string(),
        nuvensPct: z.number(),
      }),
    ),
    lon0: z.number(),
    lat0: z.number(),
    passo: z.number().positive(),
    cols: z.number().int().positive(),
    lins: z.number().int().positive(),
    decimosCBase64: z.string().min(16),
    medianaBairrosDecimosC: z.record(z.string(), z.number().int()),
  }),
  areasVerdes: z.strictObject({
    fonteArvores: z.string(),
    fontePracas: z.string(),
    licenca: z.string(),
    sha256Arvores: z.string().length(64),
    sha256Pracas: z.string().length(64),
    arvoresTombadas: z.array(z.tuple([z.number(), z.number(), z.string()])),
    pracasEParques: z.array(z.tuple([z.number(), z.number(), z.string()])),
  }),
  relevoEDrenagem: z.strictObject({
    fonteRelevo: z.string(),
    licencaRelevo: z.string(),
    fonteHidrografia: z.string(),
    licencaHidrografia: z.string(),
    lon0: z.number(),
    lat0: z.number(),
    passo: z.number().positive(),
    cols: z.number().int().positive(),
    lins: z.number().int().positive(),
    decimetrosBase64: z.string().min(16),
    nomesHidricos: z.array(z.string()),
    pontosCanaisRios: z.array(z.tuple([z.number(), z.number(), z.number().int().min(0)])),
  }),
  arboviroses: z.strictObject({
    fonte: z.string(),
    url: z.string().url(),
    licenca: z.string(),
    anos: z.tuple([z.number().int(), z.number().int(), z.number().int()]),
    registrosLidos: z.number().int().positive(),
    porBairro: z.record(
      z.string(),
      z.tuple([
        z.number().int().min(0), // 2023 confirmados/prováveis
        z.number().int().min(0), // 2024 confirmados/prováveis
        z.number().int().min(0), // 2025 confirmados/prováveis
        z.number().int().min(0), // notificações totais 3 anos
      ]),
    ),
  }),
  ruidoCorredores: z.strictObject({
    fonte: z.string(),
    licenca: z.string(),
    corredoresOnibus: z.array(z.tuple([z.number(), z.number(), z.number().int().positive()])),
    estacoesMetro: z.array(z.tuple([z.number(), z.number(), z.string()])),
    trilhosMetro: z.array(z.tuple([z.number(), z.number()])),
  }),
});

export type BaseCamadasAmbientais = z.infer<typeof esquemaCamadasAmbientais>;

const TABELA_B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decodifica Base64 para Int16Array little-endian sem depender de `Buffer` do Node (funciona em Hermes, Web e Jest). */
function decodificarInt16LeBase64(b64: string): Int16Array {
  const limpo = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const bytes = new Uint8Array(Math.floor((limpo.length * 3) / 4));
  let p = 0;
  for (let i = 0; i < limpo.length; i += 4) {
    const c0 = TABELA_B64.indexOf(limpo[i] ?? "A");
    const c1 = TABELA_B64.indexOf(limpo[i + 1] ?? "A");
    const c2 = i + 2 < limpo.length ? TABELA_B64.indexOf(limpo[i + 2]!) : -1;
    const c3 = i + 3 < limpo.length ? TABELA_B64.indexOf(limpo[i + 3]!) : -1;
    bytes[p++] = (c0 << 2) | (c1 >> 4);
    if (c2 >= 0 && p < bytes.length) bytes[p++] = ((c1 & 15) << 4) | (c2 >> 2);
    if (c3 >= 0 && p < bytes.length) bytes[p++] = ((c2 & 3) << 6) | c3;
  }
  const n = Math.floor(bytes.length / 2);
  const saida = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const u = bytes[i * 2]! | (bytes[i * 2 + 1]! << 8);
    saida[i] = u >= 0x8000 ? u - 0x10000 : u;
  }
  return saida;
}

type CacheDecodificado = {
  dados: BaseCamadasAmbientais;
  gradeTermica: Int16Array;
  gradeRelevo: Int16Array;
};

let cache: CacheDecodificado | null = null;

export function validarCamadasAmbientais(dados: unknown): BaseCamadasAmbientais {
  return esquemaCamadasAmbientais.parse(dados);
}

function carregar(): CacheDecodificado {
  if (!cache) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dados = validarCamadasAmbientais(require("./camadas-ambientais.json") as unknown);
    cache = {
      dados,
      gradeTermica: decodificarInt16LeBase64(dados.calorSuperficie.decimosCBase64),
      gradeRelevo: decodificarInt16LeBase64(dados.relevoEDrenagem.decimetrosBase64),
    };
  }
  return cache;
}

export function baseDeCamadasAmbientais(): BaseCamadasAmbientais {
  return carregar().dados;
}

export function lerTemperaturaSuperficie100m(
  centro: [number, number],
  slugBairro: string | null | undefined,
): { tempQuadraC: number; medianaBairroC: number | null; diferencaBairroC: number | null } | null {
  const { dados, gradeTermica } = carregar();
  const g = dados.calorSuperficie;
  const col = Math.floor((centro[0] - g.lon0) / g.passo);
  const lin = Math.floor((centro[1] - g.lat0) / g.passo);
  if (col < 0 || col >= g.cols || lin < 0 || lin >= g.lins) return null;

  let dec = gradeTermica[lin * g.cols + col] ?? 0;
  // Se a célula exata tiver nuvem nas 4 cenas, olha vizinhança imediata 3x3 (até 100 m)
  if (dec <= 0) {
    const viz: number[] = [];
    for (let dl = -1; dl <= 1; dl++) {
      for (let dc = -1; dc <= 1; dc++) {
        const l2 = lin + dl, c2 = col + dc;
        if (l2 >= 0 && l2 < g.lins && c2 >= 0 && c2 < g.cols) {
          const v = gradeTermica[l2 * g.cols + c2] ?? 0;
          if (v > 0) viz.push(v);
        }
      }
    }
    if (viz.length === 0) return null;
    viz.sort((a, b) => a - b);
    dec = viz[Math.floor(viz.length / 2)]!;
  }

  const tempQuadraC = Number((dec / 10).toFixed(1));
  const medDec = slugBairro ? (g.medianaBairrosDecimosC[slugBairro] ?? null) : null;
  const medianaBairroC = medDec !== null ? Number((medDec / 10).toFixed(1)) : null;
  const diferencaBairroC =
    medianaBairroC !== null ? Number((tempQuadraC - medianaBairroC).toFixed(1)) : null;
  return { tempQuadraC, medianaBairroC, diferencaBairroC };
}

export function lerAreasVerdesProximas(centro: [number, number]) {
  const { dados } = carregar();
  let pracaMaisProxima: { nome: string; distanciaM: number } | null = null;
  let pracasAte300m = 0;
  for (const [lon, lat, nome] of dados.areasVerdes.pracasEParques) {
    if (Math.abs(lon - centro[0]) > 0.004 || Math.abs(lat - centro[1]) > 0.004) continue;
    const d = Math.round(distanciaMetros(centro, [lon, lat]));
    if (d <= 300) pracasAte300m += 1;
    if (!pracaMaisProxima || d < pracaMaisProxima.distanciaM) {
      pracaMaisProxima = { nome, distanciaM: d };
    }
  }

  let arvoreTombadaProxima: { nome: string; distanciaM: number } | null = null;
  for (const [lon, lat, nome] of dados.areasVerdes.arvoresTombadas) {
    if (Math.abs(lon - centro[0]) > 0.004 || Math.abs(lat - centro[1]) > 0.004) continue;
    const d = Math.round(distanciaMetros(centro, [lon, lat]));
    if (d <= 300 && (!arvoreTombadaProxima || d < arvoreTombadaProxima.distanciaM)) {
      arvoreTombadaProxima = { nome, distanciaM: d };
    }
  }

  return { pracasAte300m, pracaMaisProxima, arvoreTombadaProxima };
}

const MINUSCULAS_DO_NOME = new Set(["de", "da", "do", "das", "dos", "e"]);
/**
 * Nome do corpo d'água em linguagem de tela (15/11/2026). A hidrografia da ESIG mistura nomes ("RIO CAPIBARIBE") e classes
 * ("ALAGADO", "RP", "CANAL"); "ALAGADO" é a classe de área úmida mapeada, e mostrá-lo como nome ("ALAGADO a 500 m") soava
 * como veredito de alagamento.
 */
export function nomeHidricoDeTela(bruto: string): string {
  const n = bruto.trim();
  const classe: Record<string, string> = { ALAGADO: "Área úmida mapeada", RP: "Curso d'água", CANAL: "Canal", RIO: "Rio", "AÇUDE": "Açude", LAGOA: "Lagoa", RIACHO: "Riacho" };
  if (classe[n.toUpperCase()]) return classe[n.toUpperCase()]!;
  const subterraneo = /_SUBTERRANEO$/i.test(n);
  const titulo = n.replace(/_SUBTERRANEO$/i, "").toLowerCase().split(/\s+/)
    .map((p, i) => (i > 0 && MINUSCULAS_DO_NOME.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(" ");
  return subterraneo ? `${titulo} (trecho subterrâneo)` : titulo;
}

export function lerRelevoECanalProximo(centro: [number, number]) {
  const { dados, gradeRelevo } = carregar();
  const g = dados.relevoEDrenagem;
  const col = Math.floor((centro[0] - g.lon0) / g.passo);
  const lin = Math.floor((centro[1] - g.lat0) / g.passo);

  let altitudeM: number | null = null;
  let diferencaEntornoM: number | null = null;

  if (col >= 0 && col < g.cols && lin >= 0 && lin < g.lins) {
    const val = gradeRelevo[lin * g.cols + col] ?? -9999;
    if (val > -900) {
      altitudeM = Number((val / 10).toFixed(1));
      const viz: number[] = [];
      for (let dl = -2; dl <= 2; dl++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (dl === 0 && dc === 0) continue;
          const l2 = lin + dl, c2 = col + dc;
          if (l2 >= 0 && l2 < g.lins && c2 >= 0 && c2 < g.cols) {
            const v2 = gradeRelevo[l2 * g.cols + c2] ?? -9999;
            if (v2 > -900) viz.push(v2 / 10);
          }
        }
      }
      if (viz.length >= 3) {
        const mediaViz = viz.reduce((a, b) => a + b, 0) / viz.length;
        diferencaEntornoM = Number((altitudeM - mediaViz).toFixed(1));
      }
    }
  }

  let cursoDaguaMaisProximo: { nome: string; distanciaM: number } | null = null;
  for (const [lon, lat, idNome] of g.pontosCanaisRios) {
    if (Math.abs(lon - centro[0]) > 0.005 || Math.abs(lat - centro[1]) > 0.005) continue;
    const d = Math.round(distanciaMetros(centro, [lon, lat]));
    if (!cursoDaguaMaisProximo || d < cursoDaguaMaisProximo.distanciaM) {
      cursoDaguaMaisProximo = { nome: nomeHidricoDeTela(g.nomesHidricos[idNome] ?? "Canal ou rio"), distanciaM: d };
    }
  }

  return { altitudeM, diferencaEntornoM, cursoDaguaMaisProximo };
}

export function lerCorredoresDeRuidoDiurno(centro: [number, number]) {
  const { dados } = carregar();
  const r = dados.ruidoCorredores;

  let corredorOnibusProximo: { distanciaM: number; viagensDia: number } | null = null;
  for (const [lon, lat, viagens] of r.corredoresOnibus) {
    if (Math.abs(lon - centro[0]) > 0.004 || Math.abs(lat - centro[1]) > 0.004) continue;
    const d = Math.round(distanciaMetros(centro, [lon, lat]));
    if (!corredorOnibusProximo || d < corredorOnibusProximo.distanciaM) {
      corredorOnibusProximo = { distanciaM: d, viagensDia: viagens };
    }
  }

  let distanciaTrilhoMetroM: number | null = null;
  for (const [lon, lat] of r.trilhosMetro) {
    if (Math.abs(lon - centro[0]) > 0.006 || Math.abs(lat - centro[1]) > 0.006) continue;
    const d = Math.round(distanciaMetros(centro, [lon, lat]));
    if (distanciaTrilhoMetroM === null || d < distanciaTrilhoMetroM) {
      distanciaTrilhoMetroM = d;
    }
  }

  let estacaoMetroProxima: { nome: string; distanciaM: number } | null = null;
  for (const [lon, lat, nome] of r.estacoesMetro) {
    if (Math.abs(lon - centro[0]) > 0.012 || Math.abs(lat - centro[1]) > 0.012) continue;
    const d = Math.round(distanciaMetros(centro, [lon, lat]));
    if (!estacaoMetroProxima || d < estacaoMetroProxima.distanciaM) {
      estacaoMetroProxima = { nome, distanciaM: d };
    }
  }

  return { corredorOnibusProximo, distanciaTrilhoMetroM, estacaoMetroProxima };
}

export function lerArbovirosesDoBairro(slugBairro: string | null | undefined) {
  if (!slugBairro) return null;
  const { dados } = carregar();
  const reg = dados.arboviroses.porBairro[slugBairro];
  if (!reg) return null;
  const [casos2023, casos2024, casos2025, notificacoesTotais3Anos] = reg;
  return {
    anos: dados.arboviroses.anos,
    casos2023,
    casos2024,
    casos2025,
    totalConfirmadosProvaveis3Anos: casos2023 + casos2024 + casos2025,
    notificacoesTotais3Anos,
    fonte: dados.arboviroses.fonte,
    url: dados.arboviroses.url,
  };
}

export type CategoriaPontoMapa = "praca" | "metro" | "ensino" | "saude" | "rotina";

export type PontoDoMapaExtra = {
  id: string;
  categoria: CategoriaPontoMapa;
  rotulo: string;
  detalhe: string;
  coordenada: [number, number];
  distanciaM: number;
};

/**
 * Pontos públicos georreferenciados nas camadas ambientais municipais (praças/parques e estações de metrô)
 * próximos a `centro`, ordenados por distância em linha reta.
 */
export function pontosDoEntornoNoMapa(
  centro: [number, number],
  raioPracasM = 800,
  limitePracas = 6,
  raioMetroM = 1400,
  limiteMetro = 3,
): PontoDoMapaExtra[] {
  const { dados } = carregar();
  const pracas: PontoDoMapaExtra[] = [];
  const vistasPracas = new Set<string>();
  for (const [lon, lat, nome] of dados.areasVerdes.pracasEParques) {
    if (Math.abs(lon - centro[0]) > 0.012 || Math.abs(lat - centro[1]) > 0.012) continue;
    const d = Math.round(distanciaMetros(centro, [lon, lat]));
    if (d > raioPracasM) continue;
    const chave = nome.trim().toLowerCase();
    if (vistasPracas.has(chave)) continue;
    vistasPracas.add(chave);
    pracas.push({
      id: `praca-${pracas.length}-${lon.toFixed(5)}`,
      categoria: "praca",
      rotulo: nome,
      detalhe: "Praça ou parque · cadastro municipal",
      coordenada: [lon, lat],
      distanciaM: d,
    });
  }
  pracas.sort((a, b) => a.distanciaM - b.distanciaM);

  const metro: PontoDoMapaExtra[] = [];
  for (const [lon, lat, nome] of dados.ruidoCorredores.estacoesMetro) {
    if (Math.abs(lon - centro[0]) > 0.018 || Math.abs(lat - centro[1]) > 0.018) continue;
    const d = Math.round(distanciaMetros(centro, [lon, lat]));
    if (d > raioMetroM) continue;
    metro.push({
      id: `metro-${metro.length}-${lon.toFixed(5)}`,
      categoria: "metro",
      rotulo: `Estação ${nome}`,
      detalhe: "Estação de metrô · rede municipal",
      coordenada: [lon, lat],
      distanciaM: d,
    });
  }
  metro.sort((a, b) => a.distanciaM - b.distanciaM);

  return [...pracas.slice(0, limitePracas), ...metro.slice(0, limiteMetro)];
}
