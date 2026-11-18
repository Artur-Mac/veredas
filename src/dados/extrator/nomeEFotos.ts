// Nome do edifício e fotos do anúncio (15/11/2026). Funções puras.
// - `textoDoCampo`: texto vindo do estado da página que é, na verdade, marcador de ausência. As páginas novas do ZAP
//   (Next.js) serializam campo vazio como "$undefined"; ele virava a rua "$undefined" no app.
// - `nomeDeEdificioNoTexto`: "Edf. Engenho Torre", "Edifício Solar do Atlântico", "Condomínio Jardim das Acácias".
// - `fotosDoAnuncio`: URLs https das fotos no objeto do anúncio (o app mostra sem guardar cópia).

/** Texto útil de um campo do estado; null para vazio, "undefined", "null" e marcadores do React Server ("$undefined", "$L1"). */
export function textoDoCampo(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  if (/^\$/.test(t)) return null;
  if (/^(undefined|null|nan|none|-+)$/i.test(t)) return null;
  return t;
}

const PREFIXO = String.raw`(?:[Ee]df\.?|EDF\.?|[Ee]d\.|ED\.|[Ee]dif[íi]cio|EDIF[ÍI]CIO|[Cc]ondom[íi]nio|CONDOM[ÍI]NIO|[Rr]esidencial|RESIDENCIAL)`;
// Palavra do nome sem ponto (o ponto encerra a frase: "Residencial Porto Belo. Próximo…") e separadores sem quebra de
// linha (o nome não atravessa para a linha seguinte).
const PALAVRA = String.raw`(?:[A-ZÀ-Ý0-9][\wÀ-ÿ'’-]*)`;
const LIGA = String.raw`(?:d[aeo]s?|e|D[AEO]S?|E)`;
const NOME = new RegExp(String.raw`(?:^|[^\wÀ-ÿ])${PREFIXO}[ \t]+(${PALAVRA}(?:[ \t]+(?:${LIGA}[ \t]+)?${PALAVRA}){0,4})`, "gu");

/** Palavras que, depois de "Condomínio"/"Residencial", não são nome de prédio. */
const NAO_E_NOME = new Set([
  "fechado", "clube", "completo", "com", "novo", "nova", "alto", "padrão", "padrao", "ótimo", "otimo", "lazer", "piscina", "incluso",
  "incluído", "incluido", "baixo", "barato", "excelente", "frente", "mobiliado", "valor", "r$", "ar", "pago", "de", "do", "da",
]);

/** Nome do edifício escrito no texto do anúncio, ou null. Exige palavra própria (maiúscula) depois do prefixo. */
export function nomeDeEdificioNoTexto(texto: string | null | undefined): string | null {
  if (!texto) return null;
  for (const m of texto.matchAll(NOME)) {
    if (!m[1]) continue;
    const palavras = m[1].replace(/[.,]+$/, "").split(/\s+/);
    while (palavras.length && /^(d[aeo]s?|e)$/i.test(palavras.at(-1)!)) palavras.pop();
    if (!palavras.length || NAO_E_NOME.has(palavras[0]!.toLowerCase())) continue;
    if (/^\d+$/.test(palavras[0]!)) continue; // "Edifício 2 quartos"
    const nome = palavras.join(" ").slice(0, 120);
    if (nome.length >= 3) return nome;
  }
  return null;
}

// Conferido no ZAP real (15/11/2026): listing.medias.images[].dangerousSrc com "{description}", "{action}" e
// "{width}x{height}"; "foto.webp?action=fit-in&dimension=870x653" responde 200 image/webp.
const TAMANHO_DA_FOTO = "870x653";

/** Só o nome do arquivo da foto, sem endereço ("893547852-996.68255896601041.jpg"). */
const SO_O_ARQUIVO = /^[\w.-]+\.(?:jpe?g|png|webp)$/i;

/**
 * URL de foto utilizável: https, de imagem; os modelos do ZAP ("{action}/{width}x{height}") viram um tamanho fixo.
 * `base`: endereço das fotos do portal que guarda só o nome do arquivo (o QuintoAndar).
 */
export function urlDaFoto(v: unknown, base?: string): string | null {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  const bruto = typeof v === "string" ? v : o ? (o["url"] ?? o["src"] ?? o["dangerousSrc"] ?? o["original"]) : null;
  if (typeof bruto !== "string") return null;
  const completo = base && SO_O_ARQUIVO.test(bruto.trim()) ? `${base}${bruto.trim()}` : bruto;
  const u = completo.trim().replace("{action}", "fit-in").replace("{width}x{height}", TAMANHO_DA_FOTO).replace("{description}", "foto");
  if (!/^https:\/\//.test(u) || /[{}\s]/.test(u) || u.length > 600) return null;
  if (!/\.(jpe?g|png|webp)(\?|$)/i.test(u) && !/(img|image|foto|photo|media|resized)/i.test(u)) return null;
  // Vídeo, planta 3D ou tour não entram como foto.
  if (/\.(mp4|m3u8|mov)(\?|$)|youtube|vimeo|matterport/i.test(u)) return null;
  return u;
}

/** Até `maximo` fotos distintas a partir das listas mais comuns no objeto do anúncio. `base`: ver `urlDaFoto`. */
export function fotosDoAnuncio(obj: Record<string, unknown>, maximo = 12, base?: string): string[] {
  const listas: unknown[] = [];
  const procurar = (no: unknown, nivel: number) => {
    if (!no || typeof no !== "object" || nivel > 3) return;
    for (const [k, v] of Object.entries(no as Record<string, unknown>)) {
      // Planta baixa ("floorPlans") não é foto do imóvel.
      if (/floorplans?|plantas?/i.test(k)) continue;
      if (/^(medias|images|photos|imagelist|fotos|imagens|pictures)$/i.test(k) && Array.isArray(v)) listas.push(v);
      // ZAP: "medias" é objeto ({ images: [...] }); desce nele.
      else if (v && typeof v === "object" && !Array.isArray(v)) procurar(v, nivel + 1);
    }
  };
  procurar(obj, 1);
  const out: string[] = [];
  for (const l of listas) for (const item of l as unknown[]) {
    if (item && typeof item === "object" && /video/i.test(String((item as Record<string, unknown>)["type"] ?? ""))) continue;
    const u = urlDaFoto(item, base);
    if (u && !out.includes(u)) out.push(u);
    if (out.length >= maximo) return out;
  }
  return out;
}
