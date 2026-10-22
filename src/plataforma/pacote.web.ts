import { z } from "zod";
import type { AnaliseV2 } from "../dados/contratos";
import { bytesUtf8, exportarCaderno, lerBackup, planejarImportacao, type RevisaoDaImportacao } from "../dados/backup";
import { guardarArquivoPessoal, lerArquivoPessoal } from "./midia.web";

const MB = 1024 * 1024;
export const LIMITE_PACOTE_BYTES = 48 * MB;
const chave = z.string().max(120).regex(/^(foto-[a-z0-9-]+\.(jpg|png)|documento-[a-z0-9-]+\.pdf)$/);
const esquema = z.strictObject({ formato: z.literal("vereda-pacote"), versao: z.literal(1), exportadoEm: z.iso.datetime(),
  metadados: z.string().max(10 * MB), arquivos: z.array(z.strictObject({ chave, mime: z.enum(["image/jpeg", "image/png", "application/pdf"]),
    bytes: z.number().int().min(1).max(20 * MB), sha256: z.string().regex(/^[a-f0-9]{64}$/), base64: z.string().max(28 * MB) })).max(1000),
});
export type RevisaoPacote = { revisao: RevisaoDaImportacao; arquivos: { chave: string; blob: Blob; sha256: string }[] };
async function sha256(blob: Blob): Promise<string> {
  if (!crypto.subtle) throw new Error("A verificação de arquivos exige um navegador seguro e compatível.");
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))).map(b => b.toString(16).padStart(2, "0")).join("");
}
function referencias(analises: readonly AnaliseV2[]): Map<string, number> {
  const refs = new Map<string, number>();
  for (const a of analises) {
    for (const f of [...(a.caderno?.fotos ?? []), ...(a.caderno?.documentos.flatMap(d => d.arquivo ? [d.arquivo] : []) ?? [])]) {
      const bytes = refs.get(f.chave);
      if (bytes !== undefined && bytes !== f.bytes) throw new Error("Referências de arquivo conflitantes.");
      refs.set(chave.parse(f.chave), f.bytes);
    }
  }
  return refs;
}
function comoBase64(bytes: Uint8Array): string {
  let binario = "";
  for (let i = 0; i < bytes.length; i += 8192) binario += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binario);
}
async function conferirArquivo(nome: string, blob: Blob) {
  const inicio = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const pdf = nome.endsWith(".pdf") && String.fromCharCode(...inicio.slice(0, 5)) === "%PDF-" && blob.type === "application/pdf";
  const jpg = nome.endsWith(".jpg") && inicio[0] === 255 && inicio[1] === 216 && inicio[2] === 255 && blob.type === "image/jpeg";
  const png = nome.endsWith(".png") && inicio.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10" && blob.type === "image/png";
  if (!(pdf || jpg || png) || blob.size > (pdf ? 20 : 5) * MB) throw new Error("Tipo ou tamanho de arquivo inválido.");
}
export async function exportarPacote(analises: readonly AnaliseV2[]): Promise<string> {
  const exportadoEm = new Date().toISOString();
  const metadados = exportarCaderno(analises, exportadoEm);
  const arquivos: z.infer<typeof esquema>["arquivos"] = [];
  let bytes = 0;
  for (const [chave, tamanho] of referencias(analises)) {
    const blob = await lerArquivoPessoal(chave);
    if (!blob || blob.size !== tamanho) throw new Error("Há arquivo ausente neste navegador. Exporte metadados ou recupere o original antes da cópia completa.");
    bytes += blob.size;
    if (bytes > 32 * MB || arquivos.length >= 1000) throw new Error("A cópia excede o limite de 32 MB de arquivos ou 1.000 anexos.");
    await conferirArquivo(chave, blob);
    arquivos.push({ chave, mime: blob.type as "image/jpeg" | "image/png" | "application/pdf", bytes: blob.size,
      sha256: await sha256(blob), base64: comoBase64(new Uint8Array(await blob.arrayBuffer())) });
  }
  const texto = JSON.stringify({ formato: "vereda-pacote", versao: 1, exportadoEm, metadados, arquivos });
  if (bytesUtf8(texto) > LIMITE_PACOTE_BYTES) throw new Error("A cópia excedeu 48 MB. Nenhum dado foi alterado.");
  return texto;
}
export async function revisarPacote(texto: string, atuais: readonly AnaliseV2[]): Promise<RevisaoPacote> {
  if (bytesUtf8(texto) > LIMITE_PACOTE_BYTES) throw new Error("Pacote excede 48 MB.");
  const pacote = esquema.parse(JSON.parse(texto));
  const analises = lerBackup(pacote.metadados);
  const refs = referencias(analises);
  const nomes = new Set<string>();
  const renomeados = new Map<string, string>();
  const arquivos: RevisaoPacote["arquivos"] = [];
  let total = 0;
  for (const f of pacote.arquivos) {
    if (nomes.has(f.chave) || refs.get(f.chave) !== f.bytes) throw new Error("Arquivo duplicado ou não referenciado corretamente.");
    nomes.add(f.chave);
    if (f.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(f.base64)) throw new Error("Arquivo codificado incorretamente.");
    const bytes = Uint8Array.from(atob(f.base64), c => c.charCodeAt(0));
    total += bytes.length;
    if (bytes.length !== f.bytes || total > 32 * MB) throw new Error("Tamanho de arquivo incompatível.");
    const blob = new Blob([bytes], { type: f.mime });
    await conferirArquivo(f.chave, blob);
    if (await sha256(blob) !== f.sha256) throw new Error("A integridade de um arquivo não pôde ser confirmada.");
    const existente = await lerArquivoPessoal(f.chave);
    let destino = f.chave;
    if (existente && await sha256(existente) !== f.sha256) {
      destino = f.chave.replace(/\.(jpg|png|pdf)$/, `-${f.sha256.slice(0, 16)}.$1`);
      renomeados.set(f.chave, destino);
    }
    arquivos.push({ chave: destino, blob, sha256: f.sha256 });
  }
  if (refs.size !== nomes.size) throw new Error("Há anexos ausentes. O pacote não é uma cópia completa.");
  const recebidas = analises.map(a => !a.caderno ? a : ({ ...a, caderno: { ...a.caderno,
    ...(a.caderno.fotos ? { fotos: a.caderno.fotos.map(f => ({ ...f, chave: renomeados.get(f.chave) ?? f.chave })) } : {}),
    documentos: a.caderno.documentos.map(d => !d.arquivo ? d : ({ ...d, arquivo: { ...d.arquivo, chave: renomeados.get(d.arquivo.chave) ?? d.arquivo.chave } })),
  } }));
  return { revisao: planejarImportacao(atuais, recebidas), arquivos };
}
export async function guardarArquivosDoPacote(arquivos: RevisaoPacote["arquivos"]): Promise<void> {
  for (const f of arquivos) {
    const existente = await lerArquivoPessoal(f.chave);
    if (existente) {
      if (await sha256(existente) !== f.sha256) throw new Error("Um arquivo mudou desde a revisão. Revise novamente; o original foi preservado.");
    } else await guardarArquivoPessoal(f.chave, f.blob);
  }
}
export async function selecionarPacote(): Promise<string | null> {
  const arquivo = await new Promise<File | null>(resolve => {
    const entrada = document.createElement("input"); entrada.type = "file"; entrada.accept = "application/json,.json";
    entrada.onchange = () => resolve(entrada.files?.[0] ?? null); entrada.oncancel = () => resolve(null); entrada.click();
  });
  if (!arquivo) return null;
  if (arquivo.size > LIMITE_PACOTE_BYTES) throw new Error("Arquivo excede 48 MB.");
  return arquivo.text();
}
