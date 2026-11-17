import { z } from "zod";
import type { Edificio } from "../contratos";
import { faltaCamada, lerCamada } from "../camadas";
import { ARQUIVOS_SOLARES } from "./fontesGeradas";
import { emMetros, type Ponto, type RecorteSolar, type VolumeSolar } from "./geometria";
const ponto = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const volume = z.strictObject({
  id: z.string(), dsqfl: z.string().regex(/^(\d{14})?$/), aneis: z.array(z.array(ponto).min(4)).min(1),
  alturaM: z.number().positive().nullable(), alturaMinM: z.number().positive().nullable(), alturaMaxM: z.number().positive().nullable(),
  baseM: z.number(), origemAltura: z.enum(["pavimentos_cadastrais", "desconhecida"]), associacaoValidada: z.boolean(),
});
const esquemaArea = z.strictObject({ versao: z.string(), fonteEm: z.string(), bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  cobertura: z.literal("cadastral_parcial"), volumes: z.array(volume) });
type Area = z.infer<typeof esquemaArea>;
const cache = new Map<string, Area | null>();
const esquemaCompacto = z.strictObject({ formato: z.literal(1), origem: ponto, escala: z.literal(1000000), lotes: z.array(z.string()),
  versao: z.string(), fonteEm: z.string(), bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]), cobertura: z.literal("cadastral_parcial"),
  volumes: z.array(z.tuple([z.string(), z.number().int().nonnegative(), z.number().positive().nullable(), z.union([z.literal(0), z.literal(1)]),
    z.array(z.array(z.tuple([z.number().int(), z.number().int()])).min(4)).min(1)])),
});
function decodificarArea(valor: unknown): Area {
  const c = esquemaCompacto.parse(valor);
  return esquemaArea.parse({ versao: c.versao, fonteEm: c.fonteEm, bbox: c.bbox, cobertura: c.cobertura,
    volumes: c.volumes.map(([id, lote, n, associada, aneis]) => ({ id, dsqfl: c.lotes[lote],
      aneis: aneis.map(r => r.map(p => [c.origem[0] + p[0] / c.escala, c.origem[1] + p[1] / c.escala])),
      alturaM: n === null ? null : n * 3.1, alturaMinM: n === null ? null : n * 2.8, alturaMaxM: n === null ? null : n * 3.4,
      baseM: 0, origemAltura: n === null ? "desconhecida" : "pavimentos_cadastrais", associacaoValidada: !!associada })) });
}
/** O arquivo de camada do recorte solar do bairro (fora do bundle, D036), ou null sem recorte. */
export const arquivoSolar = (bairro: string | null | undefined): string | null => (bairro ? ARQUIVOS_SOLARES[bairro] ?? null : null);
export type EntornoDaJanela = { recorte: RecorteSolar; volumesDoImovel: VolumeSolar[] };
export function carregarEntornoSolar(predio: Edificio): EntornoDaJanela | null {
  if (!cache.has(predio.bairro)) {
    const arquivo = ARQUIVOS_SOLARES[predio.bairro];
    try { cache.set(predio.bairro, arquivo ? decodificarArea(lerCamada(arquivo)) : null); }
    catch (e) { if (faltaCamada(e)) throw e; cache.set(predio.bairro, null); }
  }
  const area = cache.get(predio.bairro);
  if (!area || !predio.dsqfl) return null;
  const [w, s, e, n] = area.bbox;
  const centro: Ponto = predio.centro;
  const margens = [emMetros([w, centro[1]], centro)[0] * -1, emMetros([e, centro[1]], centro)[0],
    emMetros([centro[0], s], centro)[1] * -1, emMetros([centro[0], n], centro)[1]];
  const raioM = Math.min(300, ...margens);
  if (raioM < 100) return null;
  const volumes = area.volumes.filter(v => {
    const pts = v.aneis[0]!.map(p => emMetros(p, centro));
    const minX = Math.min(...pts.map(p => p[0])), maxX = Math.max(...pts.map(p => p[0]));
    const minY = Math.min(...pts.map(p => p[1])), maxY = Math.max(...pts.map(p => p[1]));
    return Math.hypot(Math.max(minX, 0, -maxX), Math.max(minY, 0, -maxY)) <= raioM;
  });
  const volumesDoImovel = volumes.filter(v => v.dsqfl === predio.dsqfl && v.associacaoValidada)
    .sort((a, b) => (b.alturaM ?? 0) - (a.alturaM ?? 0));
  return { recorte: { versao: area.versao, fonteEm: area.fonteEm, centro, raioM, cobertura: area.cobertura, volumes }, volumesDoImovel };
}
export function facesDoVolume(v: VolumeSolar, graus: number) {
  const ring = v.aneis[0]!;
  const centro = ring[0]!;
  const metricos = ring.map(p => emMetros(p, centro));
  const area = metricos.reduce((s, p, i) => { const q = metricos[(i + 1) % metricos.length]!; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  return ring.slice(0, -1).map((p, i) => {
    const q = ring[i + 1]!, a = metricos[i]!, b = metricos[i + 1]!;
    const dx = b[0] - a[0], dy = b[1] - a[1], sentido = area >= 0 ? 1 : -1;
    const orientacao = (Math.atan2(sentido * dy, -sentido * dx) * 180 / Math.PI + 360) % 360;
    const diferenca = Math.abs(((orientacao - graus + 540) % 360) - 180);
    return { indice: i, meio: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as Ponto,
      comprimento: Math.hypot(dx, dy), orientacao, diferenca, a: p, b: q };
  }).filter(f => f.comprimento >= 2 && f.diferenca <= 40).sort((a, b) => a.diferenca - b.diferenca || b.comprimento - a.comprimento).slice(0, 6);
}
