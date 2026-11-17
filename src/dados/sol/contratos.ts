import { z } from "zod";

export const esquemaCoordenadaSolar = z.strictObject({
  longitude: z.number().min(-180).max(180), latitude: z.number().min(-90).max(90),
  origem: z.enum(["cadastro", "gps_da_visita", "exemplo"]), precisaoM: z.number().nonnegative().nullable(),
});
export const esquemaJanelaSolar = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]{1,60}$/), nome: z.string().trim().min(1).max(60),
  graus: z.number().int().min(0).max(359).nullable(),
  referencia: z.enum(["verdadeiro", "magnetico", "desconhecido"]),
  origem: z.enum(["bussola", "manual", "legado"]),
  observadoEm: z.iso.datetime().nullable(), revisadoEm: z.iso.datetime().nullable(),
  calibracao: z.number().int().min(0).max(3).nullable(),
  coordenada: esquemaCoordenadaSolar.nullable(),
  andar: z.number().int().min(-5).max(200).nullable(),
  posicao: z.strictObject({
    volumeId: z.string().max(100), longitude: z.number().min(-180).max(180), latitude: z.number().min(-90).max(90),
    geometriaVersao: z.string().max(80), origem: z.literal("fachada_informada"),
  }).nullable(),
  protecoes: z.array(z.enum(["varanda", "arvore", "brise", "predio"])).max(4),
}).superRefine((v, ctx) => {
  if (new Set(v.protecoes).size !== v.protecoes.length) ctx.addIssue({ code: "custom", message: "Proteções repetidas" });
  if (v.origem === "bussola" && (v.referencia !== "verdadeiro" || v.observadoEm === null || v.calibracao === null))
    ctx.addIssue({ code: "custom", message: "Captura por bússola exige referência verdadeira e qualidade" });
});
export const esquemaSolar = z.strictObject({
  versao: z.literal(1), ativaId: z.string().max(60).nullable(),
  janelas: z.array(esquemaJanelaSolar).max(20),
}).superRefine((v, ctx) => {
  if (new Set(v.janelas.map(j => j.id)).size !== v.janelas.length) ctx.addIssue({ code: "custom", message: "Janelas repetidas" });
  if (v.ativaId !== null && !v.janelas.some(j => j.id === v.ativaId)) ctx.addIssue({ code: "custom", message: "Janela ativa ausente" });
});
export type JanelaSolar = z.infer<typeof esquemaJanelaSolar>;
export type CoordenadaSolar = z.infer<typeof esquemaCoordenadaSolar>;
export type RegistroSolar = z.infer<typeof esquemaSolar>;
