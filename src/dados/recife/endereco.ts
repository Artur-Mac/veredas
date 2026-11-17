// Formatação de endereço e chave cadastral (arquiteto). Única fonte: prédio, dossiê, visita, comparar e Explorar
// usam estas funções, para que "EST DO ENCANAMENTO" apareça igual em todas as telas.

/** Chave cadastral de 14 dígitos no formato D.SSSS.QQQ.FF.LLLL. Devolve null sem chave válida. */
export function formatarChaveCadastral(dsqfl: string | null): string | null {
  if (dsqfl === null || !/^\d{14}$/.test(dsqfl)) return null;
  return [dsqfl.slice(0, 1), dsqfl.slice(1, 5), dsqfl.slice(5, 8), dsqfl.slice(8, 10), dsqfl.slice(10, 14)].join(".");
}

const MINUSCULAS = new Set(["a", "e", "o", "as", "os", "da", "das", "de", "do", "dos", "em"]);

/**
 * Primeira palavra do logradouro, por extenso. O cadastro do Recife começa por RUA, AV, EST ou PRC; as demais
 * entradas cobrem o que a pessoa digita ou o anúncio traz. A busca é feita sem acento ("Pça" → "pca").
 */
const VIAS_POR_EXTENSO = new Map([
  ["rua", "Rua"], ["r", "Rua"], ["av", "Avenida"], ["avenida", "Avenida"], ["est", "Estrada"], ["estr", "Estrada"],
  ["estrada", "Estrada"], ["prc", "Praça"], ["pc", "Praça"], ["pca", "Praça"], ["praca", "Praça"], ["tv", "Travessa"],
  ["trav", "Travessa"], ["travessa", "Travessa"], ["al", "Alameda"], ["alameda", "Alameda"], ["lgo", "Largo"],
  ["lg", "Largo"], ["largo", "Largo"], ["bc", "Beco"], ["rod", "Rodovia"],
]);

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Partícula só fica minúscula no meio do nome: "Rua Projetada A" mantém o "A" final. */
function emCaixaDeTitulo(palavra: string, primeira: boolean, ultima: boolean): string {
  const minuscula = palavra.toLowerCase();
  if (!primeira && !ultima && MINUSCULAS.has(minuscula)) return minuscula;
  return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
}

/**
 * "EST DO ENCANAMENTO" e "719" viram "Estrada do Encanamento, 719". O cadastro não tem acento, então ele não é
 * restaurado. Sem número, só a rua.
 */
export function formatarEndereco(logradouro: string, numero: string | null): string {
  const partes = logradouro.trim().replace(/\./g, " ").split(/\s+/).filter(Boolean);
  const [primeira, ...resto] = partes;
  const via = primeira ? VIAS_POR_EXTENSO.get(semAcento(primeira.toLowerCase())) : undefined;
  const palavras =
    primeira === undefined
      ? []
      : [via ?? emCaixaDeTitulo(primeira, true, resto.length === 0), ...resto.map((p, i) => emCaixaDeTitulo(p, false, i === resto.length - 1))];
  const rua = palavras.join(" ");
  const n = numero?.trim();
  return n ? `${rua}, ${n}` : rua;
}
