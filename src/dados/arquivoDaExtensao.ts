import { z } from "zod";
const esquema = z.strictObject({ formato: z.literal("vereda-anuncio"), versao: z.literal(1), id: z.string().regex(/^ext-[a-f0-9]{40}$/),
  url: z.string().max(2000).refine(v => { try { const u = new URL(v); return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password && u.hostname.includes("."); } catch { return false; } }),
  titulo: z.string().max(300), texto: z.string().max(200000) });
export type ArquivoDaExtensao = z.infer<typeof esquema>;
let recebido: ArquivoDaExtensao | null = null;
export function guardarArquivoDaExtensao(v: ArquivoDaExtensao): string { recebido = v; return v.id; }
export function arquivoDaExtensao(id: string): ArquivoDaExtensao | null { return recebido?.id === id ? recebido : null; }
export function esquecerArquivoDaExtensao(): void { recebido = null; }
export async function lerArquivoDaExtensao(texto: string, hash: (v: string) => Promise<string>): Promise<ArquivoDaExtensao> {
  if (texto.length > 400000) throw new Error("Arquivo de anúncio muito grande.");
  const v = esquema.parse(JSON.parse(texto));
  const esperado = "ext-" + (await hash(v.url + "\n" + v.texto)).slice(0, 40);
  if (v.id !== esperado) throw new Error("O conteúdo não corresponde ao identificador. Exporte novamente pela extensão.");
  return v;
}
