import type { Worker as Motor, createWorker as Criar } from "tesseract.js";
type Api = { createWorker: typeof Criar };
let carregando: Promise<Api> | null = null;
function motor(): Promise<Api> {
  if (!carregando) carregando = new Promise<Api>((resolve, reject) => {
    const existente = (window as unknown as { Tesseract?: Api }).Tesseract;
    if (existente) { resolve(existente); return; }
    const script = document.createElement("script"); script.src = new URL("/ocr/tesseract.min.js", location.origin).href;
    script.onload = () => { const api = (window as unknown as { Tesseract?: Api }).Tesseract; if (api) resolve(api); else reject(new Error("Motor OCR indisponível.")); };
    script.onerror = () => { carregando = null; reject(new Error("Não foi possível abrir o motor local. Continue colando o texto.")); };
    document.head.appendChild(script);
  });
  return carregando;
}
export async function escolherImagemOcr(): Promise<File | null> {
  return new Promise(resolve => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = () => resolve(input.files?.[0] ?? null); input.oncancel = () => resolve(null); input.click(); });
}
export async function extrairImagemLocal(arquivo: File, sinal: AbortSignal, progresso: (fracao: number) => void): Promise<string> {
  if (!arquivo.size || arquivo.size > 10 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(arquivo.type)) throw new Error("Escolha PNG, JPEG ou WebP de até 10 MB.");
  const uri = URL.createObjectURL(arquivo);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("Imagem inválida ou ilegível.")); img.src = uri; });
    if (img.width * img.height > 30e6 || Math.max(img.width, img.height) > 10000) throw new Error("Imagem muito grande. Recorte o anúncio para até 30 megapixels e 10.000 px por lado.");
  } finally { URL.revokeObjectURL(uri); }
  let worker: Motor | undefined;
  let rejeitar: (e: Error) => void = () => {};
  let encerrado = false;
  const cancelado = new Promise<never>((_, reject) => { rejeitar = reject; });
  const cancelar = () => { encerrado = true; if (worker) void worker.terminate(); rejeitar(new Error("Leitura cancelada. Nada foi aplicado.")); };
  sinal.addEventListener("abort", cancelar, { once: true });
  const timer = setTimeout(cancelar, 60000);
  const trabalho = async () => {
    if (sinal.aborted) throw new Error("Leitura cancelada. Nada foi aplicado.");
    const api = await motor();
    worker = await api.createWorker("por", 1, { workerPath: new URL("/ocr/worker.min.js", location.origin).href,
      corePath: new URL("/ocr/core", location.origin).href, langPath: new URL("/ocr", location.origin).href,
      workerBlobURL: false, cacheMethod: "write", logger: m => { if (!encerrado && m.status === "recognizing text") progresso(m.progress); } });
    if (encerrado || sinal.aborted) { await worker.terminate(); throw new Error("Leitura cancelada. Nada foi aplicado."); }
    const resultado = await worker.recognize(arquivo);
    if (sinal.aborted || encerrado) throw new Error("Leitura cancelada. Nada foi aplicado.");
    if (!resultado.data.text.trim()) throw new Error("Não encontramos texto legível. Transcreva manualmente.");
    if (resultado.data.text.length > 200000) throw new Error("Texto muito extenso. Recorte a imagem e tente novamente.");
    return resultado.data.text;
  };
  try { return await Promise.race([trabalho(), cancelado]); }
  finally { clearTimeout(timer); sinal.removeEventListener("abort", cancelar); encerrado = true; if (worker) await worker.terminate(); }
}
