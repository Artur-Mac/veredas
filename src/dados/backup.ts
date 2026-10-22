import { z } from "zod";
import { esquemaAnaliseV2, type AnaliseV2 } from "./contratos";

export const LIMITE_BACKUP_BYTES = 10 * 1024 * 1024;
const esquemaBackup = z.strictObject({
  formato: z.literal("vereda-caderno"), versao: z.literal(1), exportadoEm: z.iso.datetime(),
  incluiArquivos: z.literal(false), analises: z.array(esquemaAnaliseV2).max(500),
}).superRefine((v, ctx) => {
  if (new Set(v.analises.map(a => a.id)).size !== v.analises.length)
    ctx.addIssue({ code: "custom", message: "Identificadores repetidos no arquivo." });
});

export function bytesUtf8(texto: string): number {
  let total = 0;
  for (const c of texto) {
    const n = c.codePointAt(0)!;
    total += n <= 0x7f ? 1 : n <= 0x7ff ? 2 : n <= 0xffff ? 3 : 4;
  }
  return total;
}

export function exportarCaderno(analises: readonly AnaliseV2[], agora: string): string {
  const resultado = JSON.stringify(esquemaBackup.parse({ formato: "vereda-caderno", versao: 1, exportadoEm: agora,
    incluiArquivos: false, analises }), null, 2);
  if (bytesUtf8(resultado) > LIMITE_BACKUP_BYTES) throw new Error("O caderno excede 10 MB. Nenhum dado foi alterado.");
  return resultado;
}
export function lerBackup(texto: string): AnaliseV2[] {
  if (bytesUtf8(texto) > LIMITE_BACKUP_BYTES) throw new Error("O arquivo excede 10 MB.");
  try { return esquemaBackup.parse(JSON.parse(texto)).analises; }
  catch { throw new Error("Arquivo incompatível ou inválido. Seu caderno continua intacto."); }
}

export type RevisaoDaImportacao = {
  base: string; lista: AnaliseV2[]; novas: number; iguais: number; conflitos: string[];
};

/** Conflitos mantêm ambas as versões. A cópia tem ID determinístico e reimportação não duplica. */
export function planejarImportacao(atual: readonly AnaliseV2[], recebidas: readonly AnaliseV2[]): RevisaoDaImportacao {
  const lista = [...atual];
  let novas = 0;
  let iguais = 0;
  const conflitos: string[] = [];
  const iguaisSemId = (a: AnaliseV2, b: AnaliseV2) => JSON.stringify({ ...a, id: "" }) === JSON.stringify({ ...b, id: "" });
  for (const original of recebidas) {
    const a = esquemaAnaliseV2.parse(original);
    const existente = lista.find(x => x.id === a.id);
    if (existente && iguaisSemId(existente, a)) { iguais++; continue; }
    if (existente) {
      const prefixo = a.id.slice(0, 42);
      if (lista.some(x => x.id.startsWith(`${prefixo}-import-`) && iguaisSemId(x, a))) { iguais++; continue; }
      let sequencia = 1;
      while (lista.some(x => x.id === `${prefixo}-import-${sequencia}`)) sequencia++;
      lista.push({ ...a, id: `${prefixo}-import-${sequencia}` });
      conflitos.push(a.nome);
    } else lista.push(a);
    novas++;
  }
  if (lista.length > 500) throw new Error("A importação excederia 500 análises. Nenhuma alteração foi feita.");
  return { base: JSON.stringify(atual), lista, novas, iguais, conflitos };
}
