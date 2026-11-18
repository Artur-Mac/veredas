// "Ruído do aeroporto" (hub, 18/11/2026): o Aeroporto dos Guararapes como fonte de ruído com nome, sem decibéis.
// Dado: o eixo da pista 18/36 no OpenStreetMap (scripts/dados/pista-aeroporto-recife.mjs, ODbL). Para cada ponto:
// - a distância em linha reta até a pista;
// - se o ponto fica sob a trajetória de pouso e decolagem: no prolongamento do eixo, até 10 km da cabeceira, dentro da
//   superfície de aproximação do Anexo 14 da ICAO (150 m para cada lado a 60 m da cabeceira, abrindo 15% para cada
//   lado). A altura do avião é a da rampa padrão de 3°, uma estimativa: o voo real varia.
// Nenhum número de decibéis: as curvas oficiais de ruído (plano de zoneamento da ANAC) não estão georreferenciadas.
import { z } from "zod";

export const FONTE_DO_AEROPORTO = "OpenStreetMap (pista, ODbL) · faixa de aproximação pelo Anexo 14 da ICAO";
/** Até esta distância da pista o aeroporto entra como fonte mesmo fora da trajetória. */
export const RAIO_DO_AEROPORTO_M = 3000;
/** Comprimento da faixa sob a trajetória contado a partir da cabeceira. */
export const ALCANCE_DA_TRAJETORIA_M = 10000;
const RAMPA_GRAUS = 3;

const ponto = z.tuple([z.number().min(-35.2).max(-34.7), z.number().min(-8.4).max(-7.8)]);
const esquema = z.object({
  aeroporto: z.string().min(1),
  pista: z.object({
    ref: z.literal("18/36"),
    cabeceiraNorte: z.object({ ref: z.literal("18"), lonLat: ponto }),
    cabeceiraSul: z.object({ ref: z.literal("36"), lonLat: ponto }),
    comprimentoM: z.number().positive(),
  }),
  fonte: z.object({ url: z.string().url(), licenca: z.literal("ODbL") }),
});
type BaseDoAeroporto = z.infer<typeof esquema>;

let cache: BaseDoAeroporto | null = null;
export function validarAeroporto(dados: unknown): BaseDoAeroporto {
  return esquema.parse(dados);
}
export function baseDoAeroporto(): BaseDoAeroporto {
  if (!cache) cache = validarAeroporto(require("./aeroporto.json") as unknown);
  return cache;
}

export type RelacaoComOAeroporto = {
  nome: string;
  /** Distância em linha reta até o ponto mais perto da pista. */
  distanciaM: number;
  /** Rumo, a partir do prédio, do ponto mais perto da pista (0 = norte). */
  rumoGraus: number;
  /** Sob a trajetória: qual cabeceira, a que distância dela e a altura estimada do avião. */
  trajetoria: { cabeceira: "18" | "36"; distanciaDaCabeceiraM: number; alturaEstimadaM: number } | null;
  urlFonte: string;
};

/** Metros num plano local em volta do ponto de referência (precisão de metros na escala do Recife). */
function plano(ref: readonly [number, number]) {
  const kx = 111320 * Math.cos((ref[1] * Math.PI) / 180);
  const ky = 110574;
  return (p: readonly [number, number]) => [(p[0] - ref[0]) * kx, (p[1] - ref[1]) * ky] as const;
}

export function relacaoComOAeroporto(centro: readonly [number, number] | null | undefined, base: BaseDoAeroporto = baseDoAeroporto()): RelacaoComOAeroporto | null {
  if (!centro) return null;
  const { cabeceiraNorte, cabeceiraSul } = base.pista;
  const xy = plano(cabeceiraNorte.lonLat);
  const [sx, sy] = xy(cabeceiraSul.lonLat);
  const L = Math.hypot(sx, sy);
  const [ux, uy] = [sx / L, sy / L];
  const [px, py] = xy(centro);
  const t = px * ux + py * uy; // ao longo do eixo, da cabeceira 18 (norte) para a 36 (sul)
  const c = px * uy - py * ux; // de lado
  const tc = Math.max(0, Math.min(L, t));
  const [qx, qy] = [tc * ux, tc * uy];
  const distanciaM = Math.round(Math.hypot(px - qx, py - qy));
  const rumoGraus = Math.round(((Math.atan2(qx - px, qy - py) * 180) / Math.PI + 360) % 360);

  let trajetoria: RelacaoComOAeroporto["trajetoria"] = null;
  const alemDaCabeceira = t < 0 ? -t : t > L ? t - L : null;
  if (alemDaCabeceira !== null && alemDaCabeceira <= ALCANCE_DA_TRAJETORIA_M) {
    const meiaLargura = 150 + 0.15 * Math.max(0, alemDaCabeceira - 60);
    if (Math.abs(c) <= meiaLargura) {
      trajetoria = {
        cabeceira: t < 0 ? "18" : "36",
        distanciaDaCabeceiraM: Math.round(alemDaCabeceira),
        alturaEstimadaM: Math.round(alemDaCabeceira * Math.tan((RAMPA_GRAUS * Math.PI) / 180)),
      };
    }
  }
  if (!trajetoria && distanciaM > RAIO_DO_AEROPORTO_M) return null;
  return { nome: base.aeroporto, distanciaM, rumoGraus, trajetoria, urlFonte: base.fonte.url };
}

const km = (m: number) => (m >= 1000 ? `${(Math.round(m / 100) / 10).toLocaleString("pt-BR")} km` : `${Math.round(m / 10) * 10} m`);

/** Frase para a tela: distância, trajetória e o que conferir. Sem decibéis. */
export function fraseDoAeroporto(r: RelacaoComOAeroporto): { manchete: string; frase: string; pergunta: string } {
  if (r.trajetoria) {
    const { distanciaDaCabeceiraM: d, alturaEstimadaM: h } = r.trajetoria;
    return {
      manchete: `Na linha de pouso e decolagem do aeroporto, a ${km(d)} da cabeceira`,
      frase:
        `O prédio fica no prolongamento da pista do Aeroporto dos Guararapes, a ${km(d)} da cabeceira ${r.trajetoria.cabeceira}. ` +
        `Os aviões que usam esse lado passam por cima, a cerca de ${km(h)} de altura numa rampa padrão de 3° (o voo real varia).`,
      pergunta: "Avião: ficar 15 minutos no imóvel de manhã e no fim da tarde e contar quantos aviões passam e se dá para conversar com a janela aberta.",
    };
  }
  return {
    manchete: `Pista do aeroporto a ${km(r.distanciaM)}`,
    frase: `A pista do Aeroporto dos Guararapes fica a ${km(r.distanciaM)} em linha reta. O prédio não fica no prolongamento da pista; o barulho vem das decolagens, pousos e do movimento no solo.`,
    pergunta: "Avião: na visita, ouvir com a janela aberta se o movimento do aeroporto chega até o imóvel.",
  };
}
