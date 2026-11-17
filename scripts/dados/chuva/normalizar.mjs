// VE13 — normalização determinística do texto de endereço dos registros da Defesa Civil antes do vínculo à rua oficial.
// Só transformações que não mudam o lugar: tirar localizadores ("próximo ao", "em frente ao", …), escrever números por
// extenso como algarismos ("Rua Doze" → "Rua 12"), expandir abreviações comuns. Proposta de candidatos (prefixo, erro de
// digitação) fica separada e sempre vai para revisão.
const dobrar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

const NUMEROS = ["zero", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove", "vinte"];
const ABREV = { av: "avenida", r: "rua", tv: "travessa", trav: "travessa", est: "estrada", pca: "praca", gov: "governador", dr: "doutor", pres: "presidente", cel: "coronel", gal: "general", gen: "general", eng: "engenheiro", prof: "professor", sen: "senador", dep: "deputado", cons: "conselheiro", min: "ministro", mal: "marechal", alm: "almirante", sto: "santo", sta: "santa" };

/** Texto do registro → texto para o vínculo (minúsculas, sem acento). Não inventa nome: só remove e reescreve. */
export function normalizarParaVinculo(texto) {
  let t = dobrar(texto);
  // Localizadores e o que vem depois: "rua x proximo ao n 10", "avenida y em frente ao mercado".
  t = t.replace(/\s+(proximo|proxima|perto|em frente|na frente|frente|ao lado|esquina|apos|depois|antes|altura|entre|no final|final)\b.*$/, "").trim();
  const ps = t.split(" ").map((p, i) => (ABREV[p] && (i === 0 || p !== "r") ? ABREV[p] : p));
  // "rua doze" → "rua 12" (só como nome inteiro depois do tipo de logradouro).
  if (ps.length === 2 && NUMEROS.includes(ps[1])) ps[1] = String(NUMEROS.indexOf(ps[1]));
  return ps.join(" ").trim();
}

/** Classe do lugar: canal, rio, loteamento, comunidade etc. não são logradouro e não ganham caminho a pé. */
export function classeDoTexto(texto) {
  const t = dobrar(texto);
  if (/^(canal|rio|riacho|corrego|galeria|mare)\b/.test(t)) return "curso_dagua";
  if (/^(loteamento|comunidade|conselho|vila|conjunto|ocupacao|favela|habitacional|sitio|beco)\b/.test(t)) return "lugar_nomeado";
  if (/^\d|^(rua|avenida|av|travessa|trav|tv|estrada|est|praca|pca|largo|alameda|r)\b/.test(t)) return "rua";
  return "rua";
}

function distancia(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
/**
 * O nome oficial parece o texto do registro? "prefixo" (o oficial começa com o texto, ≥ 3 palavras, ex.: "Rua Melanio de
 * Barros" → "… Correia"), "digitacao" (até 2 letras de diferença em nomes de ≥ 10 letras). Sempre candidato, nunca automático.
 */
export function parecidos(textoNormalizado, nomeOficial) {
  const a = textoNormalizado, b = normalizarParaVinculo(nomeOficial);
  if (!a || !b || a === b) return null;
  if (a.split(" ").length >= 3 && b.startsWith(`${a} `)) return "prefixo";
  if (a.length >= 10 && distancia(a, b) <= 2) return "digitacao";
  return null;
}
